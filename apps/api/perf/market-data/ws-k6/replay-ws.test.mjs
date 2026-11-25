import assert from 'node:assert/strict';
import { once } from 'node:events';
import { describe, it } from 'node:test';
import { WebSocket } from 'ws';
import {
  BENCHMARK_CHANNELS,
  buildUpstreamFrame,
  channelToStreamName,
  startReplayServer,
} from './replay-ws.mjs';

describe('replay-ws server', () => {
  it('defines 4 kline channels and 1 summary channel with valid deterministic payloads', () => {
    assert.equal(BENCHMARK_CHANNELS.length, 5);
    assert.equal(channelToStreamName(BENCHMARK_CHANNELS[0]), 'btcusdt@kline_1m');
    assert.equal(channelToStreamName(BENCHMARK_CHANNELS[4]), 'btcusdt@ticker');

    const klineFrame = buildUpstreamFrame({
      channel: BENCHMARK_CHANNELS[0],
      seq: 7,
      openTimeMs: 1735689600000,
      isClosed: false,
      nowMs: 1735689600500,
      invalidPayload: false,
    });
    assert.equal(klineFrame.stream, 'btcusdt@kline_1m');
    assert.equal(klineFrame.data.e, 'kline');
    assert.equal(klineFrame.data.E, 1735689600500);
    assert.equal(klineFrame.data.k.v, '7');
    assert.equal(klineFrame.data.k.t % 60_000, 0);
    assert.ok(Number(klineFrame.data.k.h) >= Number(klineFrame.data.k.c));
    assert.ok(Number(klineFrame.data.k.l) <= Number(klineFrame.data.k.c));

    const summaryFrame = buildUpstreamFrame({
      channel: BENCHMARK_CHANNELS[4],
      seq: 7,
      openTimeMs: 1735689600000,
      isClosed: false,
      nowMs: 1735689600500,
      invalidPayload: false,
    });
    assert.equal(summaryFrame.stream, 'btcusdt@ticker');
    assert.equal(summaryFrame.data.e, '24hrTicker');
    assert.equal(summaryFrame.data.c, '60000.07');
  });

  it('acknowledges SUBSCRIBE, emits steady frames with ledger counts, and stores VU reports', async () => {
    const server = await startReplayServer({ port: 0, intervalMs: 40 });
    try {
      const ws = new WebSocket(server.wsUrl);
      await once(ws, 'open');

      const received = [];
      ws.on('message', (raw) => {
        received.push(JSON.parse(raw.toString()));
      });

      const params = BENCHMARK_CHANNELS.map(channelToStreamName);
      ws.send(JSON.stringify({ method: 'SUBSCRIBE', params, id: 1 }));
      await new Promise((resolve) => setTimeout(resolve, 60));

      const ack = received.find((msg) => msg.id === 1);
      assert.deepEqual(ack, { id: 1, result: null });

      const startRes = await fetch(`${server.httpUrl}/start-steady`, { method: 'POST' });
      assert.equal(startRes.status, 200);
      await new Promise((resolve) => setTimeout(resolve, 150));

      const stopRes = await fetch(`${server.httpUrl}/stop-steady`, { method: 'POST' });
      assert.equal(stopRes.status, 200);

      const reportRes = await fetch(`${server.httpUrl}/vu-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vu: 1, subscribedAck: true, closeCode: 1000, channels: {} }),
      });
      assert.equal(reportRes.status, 200);

      const ledger = await (await fetch(`${server.httpUrl}/ledger`)).json();
      assert.equal(ledger.maxUpstreamConnections, 1);
      assert.ok(ledger.totalSteadyEvents >= 10);
      assert.equal(ledger.vuReports.length, 1);
      assert.equal(ledger.vuReports[0].vu, 1);

      const steadyKlines = received.filter(
        (msg) => msg.stream === 'btcusdt@kline_1m' && Number(msg.data?.k?.v) >= 1,
      );
      assert.ok(steadyKlines.length >= 2);
      assert.equal(Number(steadyKlines[0].data.k.v), 1);

      ws.close(1000);
      await once(ws, 'close');
    } finally {
      await server.close();
    }
  });

  it('supports drop-one, duplicate-one, and invalid-payload fault modes', async () => {
    const server = await startReplayServer({ port: 0, intervalMs: 30 });
    try {
      const ws = new WebSocket(server.wsUrl);
      await once(ws, 'open');
      const received = [];
      ws.on('message', (raw) => received.push(JSON.parse(raw.toString())));
      ws.send(
        JSON.stringify({
          method: 'SUBSCRIBE',
          params: ['btcusdt@kline_1m'],
          id: 1,
        }),
      );
      await new Promise((resolve) => setTimeout(resolve, 40));

      const faultRes = await fetch(`${server.httpUrl}/fault`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'duplicate-one' }),
      });
      assert.equal(faultRes.status, 200);

      await fetch(`${server.httpUrl}/start-steady`, { method: 'POST' });
      await new Promise((resolve) => setTimeout(resolve, 110));
      await fetch(`${server.httpUrl}/stop-steady`, { method: 'POST' });

      const seqs = received
        .filter((msg) => msg.stream === 'btcusdt@kline_1m' && Number(msg.data?.k?.v) >= 1)
        .map((msg) => Number(msg.data.k.v));
      const seq1Count = seqs.filter((value) => value === 1).length;
      assert.equal(seq1Count, 2);

      ws.close(1000);
      await once(ws, 'close');
    } finally {
      await server.close();
    }
  });
});
