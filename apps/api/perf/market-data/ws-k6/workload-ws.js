import http from 'k6/http';
import ws from 'k6/ws';
import { sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { createVuTracker, extractCookieHeader, WORKLOAD_CHANNELS } from './tracker.mjs';

const credentials = JSON.parse(open(__ENV.CREDENTIALS_PATH));

const API_ORIGIN = __ENV.API_ORIGIN;
const WS_URL = __ENV.WS_URL;
const REPLAY_HTTP_URL = __ENV.REPLAY_HTTP_URL;
const SUMMARY_PATH = __ENV.SUMMARY_PATH;
const VUS = Number(__ENV.VUS || 100);
const WARMUP_SECONDS = Number(__ENV.WARMUP_SECONDS || 30);
const STEADY_SECONDS = Number(__ENV.STEADY_SECONDS || 180);
const DRAIN_SECONDS = Number(__ENV.DRAIN_SECONDS || 15);
const TOTAL_SECONDS = WARMUP_SECONDS + STEADY_SECONDS + DRAIN_SECONDS;
const STAGGER_BUCKETS = 20;
const STAGGER_STEP_SECONDS = 0.25;

const wsDeliveryLatency = new Trend('ws_delivery_latency_ms', true);
const wsSourceToClient = new Trend('ws_source_to_client_ms', true);
const wsSteadyMessages = new Counter('ws_steady_messages');
const wsInvalidMessages = new Counter('ws_invalid_messages');
const wsDuplicateMessages = new Counter('ws_duplicate_messages');
const wsServerErrors = new Counter('ws_server_errors');
const wsAuthErrors = new Counter('ws_auth_errors');
const wsAbnormalDisconnects = new Counter('ws_abnormal_disconnects');
const wsErrorRate = new Rate('ws_error_rate');

export const options = {
  scenarios: {
    sustained: {
      executor: 'per-vu-iterations',
      vus: VUS,
      iterations: 1,
      maxDuration: `${TOTAL_SECONDS + 30}s`,
    },
  },
};

function postReport(report) {
  http.post(`${REPLAY_HTTP_URL}/vu-report`, JSON.stringify(report), {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'vu-report' },
  });
}

export default function () {
  const user = credentials[__VU - 1];
  const tracker = createVuTracker(__VU);
  const staggerSeconds = ((__VU - 1) % STAGGER_BUCKETS) * STAGGER_STEP_SECONDS;
  if (staggerSeconds > 0) sleep(staggerSeconds);

  const signIn = http.post(`${API_ORIGIN}/api/auth/sign-in/email`, JSON.stringify(user), {
    headers: {
      'Content-Type': 'application/json',
      Origin: API_ORIGIN,
      'X-Forwarded-Proto': 'https',
      'x-forwarded-for': `10.82.0.${__VU}`,
    },
    tags: { name: 'auth-sign-in' },
  });
  const cookie = signIn.status === 200 ? extractCookieHeader(signIn.headers['Set-Cookie']) : null;
  if (signIn.status !== 200 || cookie === null) {
    wsAuthErrors.add(1);
    wsErrorRate.add(true);
    postReport(tracker.snapshot(null, `sign-in-${signIn.status}`));
    return;
  }

  let closeCode = null;
  let closeReason = '';
  ws.connect(
    WS_URL,
    {
      headers: { Cookie: cookie, Origin: API_ORIGIN, 'X-Forwarded-Proto': 'https' },
      tags: { name: 'market-data-ws' },
    },
    (socket) => {
      socket.on('open', () => {
        socket.send(JSON.stringify({ type: 'subscribe', channels: WORKLOAD_CHANNELS }));
        const holdMs = Math.max(0, Math.round((TOTAL_SECONDS - staggerSeconds) * 1000));
        socket.setTimeout(() => {
          socket.close(1000);
        }, holdMs);
      });
      socket.on('message', (raw) => {
        const result = tracker.onMessage(raw, Date.now());
        if (result.kind === 'invalid') {
          wsInvalidMessages.add(1);
          wsErrorRate.add(true);
          return;
        }
        if (result.kind === 'error') {
          wsServerErrors.add(1);
          wsErrorRate.add(true);
          return;
        }
        if (result.isSteady !== true) return;
        wsSteadyMessages.add(1);
        wsDeliveryLatency.add(result.backendToClientMs);
        if (result.sourceToClientMs !== null) wsSourceToClient.add(result.sourceToClientMs);
        if (result.duplicate === true) {
          wsDuplicateMessages.add(1);
          wsErrorRate.add(true);
          return;
        }
        wsErrorRate.add(false);
      });
      socket.on('close', (code, reason) => {
        closeCode = code;
        closeReason = reason ?? '';
      });
    },
  );

  if (closeCode !== 1000) wsAbnormalDisconnects.add(1);
  postReport(tracker.snapshot(closeCode, closeReason));
}

export function handleSummary(data) {
  return { [SUMMARY_PATH]: JSON.stringify(data, null, 2) };
}
