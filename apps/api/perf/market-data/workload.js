import http from 'k6/http';
import { sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';
import exec from 'k6/execution';
import { burstKeys } from './schedule.mjs';
import { equalValues } from './equal.mjs';
import { requestDuration } from './timing.mjs';

// Run with run.mjs. The approved closed workload has 30 s warm-up and 180 s measurement.
const credentials = JSON.parse(open(__ENV.CREDENTIALS));
const manifest = JSON.parse(open(__ENV.MANIFEST));
const oracle = JSON.parse(open(__ENV.ORACLE));
const latency = new Trend('market_latency', true);
const errors = new Rate('market_errors');
export const options = {
  scenarios: {
    baseline: {
      executor: 'constant-vus',
      vus: manifest.clients,
      duration: '210s',
      gracefulStop: '20s',
    },
  },
  noCookiesReset: true,
  discardResponseBodies: false,
  batch: 5,
  batchPerHost: 5,
  systemTags: ['status', 'method', 'name', 'scenario'],
};
export default function () {
  if (__ITER === 0) {
    const user = credentials[__VU - 1];
    const login = http.post(`${manifest.origin}/api/auth/sign-in/email`, JSON.stringify(user), {
      headers: {
        'Content-Type': 'application/json',
        Origin: manifest.origin,
        'x-forwarded-for': `10.81.0.${__VU}`,
      },
      tags: { name: 'auth-setup' },
    });
    if (login.status !== 200) throw new Error('The benchmark sign-in failed.');
  }
  const offset = manifest.cohort === 'diverse' ? __ITER + __VU - 1 + manifest.seed : 0;
  const { pair, frames } = burstKeys(offset, manifest.cohort === 'diverse');
  const started = Date.now();
  const phase =
    started - exec.scenario.startTime >= 30000 && started - exec.scenario.startTime < 210000
      ? 'steady'
      : 'warmup';
  const requests = [
    ...frames.map((timeframe) => ({ endpoint: 'candles', pair, timeframe })),
    { endpoint: 'summary', pair },
  ];
  const responses = http.batch(
    requests.map((request, index) => ({
      method: 'GET',
      url: `${manifest.origin}/api/market-data/${request.endpoint}?pair=${pair}${request.timeframe ? `&timeframe=${request.timeframe}` : ''}`,
      params: {
        timeout: '10s',
        headers: { 'x-perf-id': `${manifest.run}-${__VU}-${__ITER}-${index}` },
        tags: { name: request.endpoint, pair, timeframe: request.timeframe || '', phase },
      },
    })),
  );
  responses.forEach((response, index) => {
    const request = requests[index];
    let valid;
    try {
      const body = response.json();
      const expected =
        oracle.keys[request.timeframe ? `${pair}:${request.timeframe}` : `summary:${pair}`];
      valid =
        response.status === 200 &&
        (request.timeframe
          ? equalValues(body.candles, expected.candles) &&
            body.warmupCount === 19 &&
            body.pair === pair &&
            body.timeframe === request.timeframe
          : equalValues(body, expected.expected));
    } catch {
      valid = false;
    }
    const tags = {
      phase,
      pair,
      timeframe: request.timeframe || '',
      endpoint: request.endpoint,
      status: String(response.status),
      outcome: valid ? 'success' : 'error',
      id: `${manifest.run}-${__VU}-${__ITER}-${index}`,
      batchStartUtc: String(started),
    };
    // Full client HTTP elapsed time includes connection, blocking, TLS, and body reception.
    latency.add(requestDuration(response.timings), tags);
    errors.add(!valid, tags);
    if (!valid)
      console.error(
        JSON.stringify({
          id: tags.id,
          status: response.status,
          error: response.error_code || 'invalid-data',
        }),
      );
  });
  sleep(6);
}
