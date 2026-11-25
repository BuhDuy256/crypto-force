import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { aggregateRuns, parseHubLogs, reconcileRun, summarizeMonitor } from './run.mjs';

describe('ws-k6 run reconciler and aggregators', () => {
  it('passes reconciliation when every VU receives all ledger events with zero errors', () => {
    const ledger = {
      maxUpstreamConnections: 1,
      eventsByChannel: {
        'kline:BTCUSDT:1m': [1, 2, 3],
        'kline:BTCUSDT:5m': [1, 2, 3],
        'kline:ETHUSDT:1m': [1, 2, 3],
        'kline:SOLUSDT:1m': [1, 2, 3],
        'summary:BTCUSDT': [1, 2, 3],
      },
      totalSteadyEvents: 15,
      vuReports: [1, 2].map((vu) => ({
        vu,
        subscribedAck: true,
        closeCode: 1000,
        steadyMessages: 15,
        uniqueSteadyMessages: 15,
        duplicateMessages: 0,
        outOfOrderMessages: 0,
        invalidMessages: 0,
        serverErrorCount: 0,
        channels: {
          'kline:BTCUSDT:1m': { uniqueCount: 3, minSeq: 1, maxSeq: 3, missingInternalSeqs: [] },
          'kline:BTCUSDT:5m': { uniqueCount: 3, minSeq: 1, maxSeq: 3, missingInternalSeqs: [] },
          'kline:ETHUSDT:1m': { uniqueCount: 3, minSeq: 1, maxSeq: 3, missingInternalSeqs: [] },
          'kline:SOLUSDT:1m': { uniqueCount: 3, minSeq: 1, maxSeq: 3, missingInternalSeqs: [] },
          'summary:BTCUSDT': { uniqueCount: 3, minSeq: 1, maxSeq: 3, missingInternalSeqs: [] },
        },
      })),
    };

    const result = reconcileRun({ ledger, expectedVus: 2, steadySeconds: 1.5 });
    assert.equal(result.passed, true);
    assert.equal(result.expectedDeliveredTotal, 30);
    assert.equal(result.actualDeliveredTotal, 30);
    assert.equal(result.missingEventsTotal, 0);
    assert.equal(result.duplicateEventsTotal, 0);
    assert.equal(result.invalidEventsTotal, 0);
    assert.equal(result.abnormalDisconnects, 0);
    assert.equal(result.deliveredMessagesPerSec, 20);
  });

  it('fails reconciliation on missing event, duplicate event, or abnormal close', () => {
    const ledger = {
      maxUpstreamConnections: 1,
      eventsByChannel: { 'kline:BTCUSDT:1m': [1, 2, 3] },
      totalSteadyEvents: 3,
      vuReports: [
        {
          vu: 1,
          subscribedAck: true,
          closeCode: 4008,
          steadyMessages: 3,
          uniqueSteadyMessages: 2,
          duplicateMessages: 1,
          outOfOrderMessages: 0,
          invalidMessages: 0,
          serverErrorCount: 0,
          channels: {
            'kline:BTCUSDT:1m': { uniqueCount: 2, minSeq: 1, maxSeq: 3, missingInternalSeqs: [2] },
          },
        },
      ],
    };

    const result = reconcileRun({ ledger, expectedVus: 1, steadySeconds: 1 });
    assert.equal(result.passed, false);
    assert.equal(result.missingEventsTotal, 1);
    assert.equal(result.duplicateEventsTotal, 1);
    assert.equal(result.abnormalDisconnects, 1);
    assert.equal(result.vusWithMissingEvents, 1);
  });

  it('parses Pino hub summary logs and computes monitor CPU and saturation flag', () => {
    const hub = parseHubLogs([
      JSON.stringify({ msg: 'API listening', port: 3095 }),
      JSON.stringify({
        msg: 'Market data stream hub summary.',
        activeWsClients: 100,
        upstreamSubscriptions: 5,
        fanOutRatio: 100,
        eventLoopLagP95Ms: 21.5,
        heapUsedMb: 74.2,
        rssMb: 142.8,
        droppedInvalidEvents: 0,
      }),
    ]);
    assert.equal(hub.samples.length, 1);
    assert.equal(hub.maxActiveClients, 100);
    assert.equal(hub.eventLoopLagP95MaxMs, 21.5);
    assert.equal(hub.droppedInvalidEventsMax, 0);

    const monitor = summarizeMonitor(
      [
        JSON.stringify({
          utc: '2026-11-25T07:00:00.000Z',
          process: 'api',
          cpuSeconds: 1.0,
          workingSetBytes: 100 * 1024 * 1024,
        }),
        JSON.stringify({
          utc: '2026-11-25T07:00:10.000Z',
          process: 'api',
          cpuSeconds: 2.5,
          workingSetBytes: 120 * 1024 * 1024,
        }),
        JSON.stringify({
          utc: '2026-11-25T07:00:00.000Z',
          process: 'k6',
          cpuSeconds: 0.5,
          workingSetBytes: 80 * 1024 * 1024,
        }),
        JSON.stringify({
          utc: '2026-11-25T07:00:10.000Z',
          process: 'k6',
          cpuSeconds: 2.0,
          workingSetBytes: 90 * 1024 * 1024,
        }),
      ],
      12,
    );
    assert.equal(monitor.api.avgCpuPercentOfOneCore, 15);
    assert.equal(monitor.api.maxWorkingSetMb, 120);
    assert.equal(monitor.k6.avgCpuPercentOfHost, 1.25);
    assert.equal(monitor.loadGeneratorSaturated, false);
  });

  it('aggregates five independent runs with median, min, and max', () => {
    const agg = aggregateRuns([
      {
        runId: 'r1',
        deliveredMessagesPerSec: 998,
        p95LatencyMs: 18,
        p99LatencyMs: 29,
        errorRate: 0,
        apiCpuPercent: 14,
        k6CpuPercent: 5,
        apiHeapMaxMb: 80,
      },
      {
        runId: 'r2',
        deliveredMessagesPerSec: 1000,
        p95LatencyMs: 16,
        p99LatencyMs: 25,
        errorRate: 0,
        apiCpuPercent: 15,
        k6CpuPercent: 5.5,
        apiHeapMaxMb: 82,
      },
      {
        runId: 'r3',
        deliveredMessagesPerSec: 1001,
        p95LatencyMs: 17,
        p99LatencyMs: 27,
        errorRate: 0,
        apiCpuPercent: 14.5,
        k6CpuPercent: 5.2,
        apiHeapMaxMb: 81,
      },
      {
        runId: 'r4',
        deliveredMessagesPerSec: 999,
        p95LatencyMs: 19,
        p99LatencyMs: 31,
        errorRate: 0,
        apiCpuPercent: 16,
        k6CpuPercent: 6,
        apiHeapMaxMb: 83,
      },
      {
        runId: 'r5',
        deliveredMessagesPerSec: 1000,
        p95LatencyMs: 15,
        p99LatencyMs: 24,
        errorRate: 0,
        apiCpuPercent: 13.5,
        k6CpuPercent: 4.8,
        apiHeapMaxMb: 79,
      },
    ]);
    assert.equal(agg.runCount, 5);
    assert.equal(agg.deliveredMessagesPerSec.median, 1000);
    assert.equal(agg.p95LatencyMs.median, 17);
    assert.equal(agg.p95LatencyMs.min, 15);
    assert.equal(agg.p95LatencyMs.max, 19);
  });
});
