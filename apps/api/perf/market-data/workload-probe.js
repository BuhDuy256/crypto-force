import http from 'k6/http';
import { check } from 'k6';
import { equalValues } from './equal.mjs';

// Functional probe in the actual k6 runtime. No latency output file is retained.
const user = JSON.parse(open(__ENV.CREDENTIALS))[0];
const oracle = JSON.parse(open(__ENV.ORACLE));
export const options = {
  vus: 1,
  iterations: 1,
  noCookiesReset: true,
  thresholds: { checks: ['rate==1'] },
};
export default function () {
  const origin = 'http://127.0.0.1:5195';
  const login = http.post(`${origin}/api/auth/sign-in/email`, JSON.stringify(user), {
    headers: { Origin: origin, 'Content-Type': 'application/json', 'x-forwarded-for': '10.91.0.1' },
  });
  check(login, { 'real sign-in succeeds': (response) => response.status === 200 });
  const response = http.get(`${origin}/api/market-data/candles?pair=BTCUSDT&timeframe=5m`, {
    headers: { 'x-perf-id': __ENV.PROBE_ID || 'k6-functional-probe' },
  });
  check(response, {
    'candle body matches the independent oracle': (value) =>
      value.status === 200 && equalValues(value.json().candles, oracle.keys['BTCUSDT:5m'].candles),
  });
}
