import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { cpus, freemem, hostname, platform, release, totalmem } from 'node:os';
import { dirname, resolve } from 'node:path';
import { createInterface } from 'node:readline';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { hashPassword } from 'better-auth/crypto';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import { percentiles } from '../aggregate.mjs';
import { BENCHMARK_CHANNELS, startReplayServer } from './replay-ws.mjs';

const directory = dirname(fileURLToPath(import.meta.url));
const root = resolve(directory, '../../../../..');
const privateCache = resolve(root, 'node_modules/.cache/market-data-ws-k6');
const credentialsPath = resolve(privateCache, 'credentials.json');
const validationSummaryPath = resolve(privateCache, 'validation-summary.json');
const evidenceDirectory = resolve(root, 'docs/testing/evidence/market-data/ws-k6-100vu-v1');
const recoveryEvidencePath = resolve(
  root,
  'docs/testing/evidence/market-data/ws-v1-benchmarks/summary.json',
);
const migrationsFolder = resolve(root, 'apps/api/drizzle');
const apiEntry = resolve(root, 'apps/api/dist/index.js');
const workloadScript = resolve(directory, 'workload-ws.js');
const monitorScript = resolve(directory, '../monitor.ps1');
const apiOrigin = 'http://127.0.0.1:3095';
const apiWsUrl = 'ws://127.0.0.1:3095/api/market-data/ws';
const replayHttpUrl = 'http://127.0.0.1:3096';
const replayIntervalMs = 500;
const userCount = 100;
const benchmarkPassword = 'ws-k6-sustained-perf-password-2026';
const betterAuthSecret = 'ws-k6-sustained-perf-local-secret-at-least-32-chars';
const saturationCpuPercent = 80;
const aggregatedMetrics = [
  'deliveredMessagesPerSec',
  'p95LatencyMs',
  'p99LatencyMs',
  'errorRate',
  'apiCpuPercent',
  'k6CpuPercent',
  'apiHeapMaxMb',
];

function round2(value) {
  return Math.round(value * 100) / 100;
}

function numberOrNull(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function reconcileRun({ ledger, expectedVus, steadySeconds }) {
  const eventsByChannel = ledger?.eventsByChannel ?? {};
  const reports = Array.isArray(ledger?.vuReports) ? ledger.vuReports : [];

  let actualDeliveredTotal = 0;
  let missingEventsTotal = 0;
  let duplicateEventsTotal = 0;
  let invalidEventsTotal = 0;
  let abnormalDisconnects = 0;
  let missingSubscribedAcks = 0;
  let vusWithMissingEvents = 0;

  for (const report of reports) {
    actualDeliveredTotal += numberOrNull(report.uniqueSteadyMessages) ?? 0;
    duplicateEventsTotal += numberOrNull(report.duplicateMessages) ?? 0;
    invalidEventsTotal += numberOrNull(report.invalidMessages) ?? 0;
    if (report.closeCode !== 1000) abnormalDisconnects += 1;
    if (report.subscribedAck !== true) missingSubscribedAcks += 1;

    let missingForVu = 0;
    for (const [key, expectedSeqs] of Object.entries(eventsByChannel)) {
      if (!Array.isArray(expectedSeqs)) continue;
      const received = numberOrNull(report.channels?.[key]?.uniqueCount) ?? 0;
      missingForVu += Math.max(0, expectedSeqs.length - received);
    }
    missingEventsTotal += missingForVu;
    if (missingForVu > 0) vusWithMissingEvents += 1;
  }

  const missingVuReports = Math.max(0, expectedVus - reports.length);
  const deliveredMessagesPerSec =
    steadySeconds > 0 ? round2(actualDeliveredTotal / steadySeconds) : 0;
  const passed =
    reports.length > 0 &&
    missingEventsTotal === 0 &&
    duplicateEventsTotal === 0 &&
    invalidEventsTotal === 0 &&
    abnormalDisconnects === 0 &&
    missingVuReports === 0 &&
    missingSubscribedAcks === 0;

  return {
    passed,
    expectedVus,
    vuReports: reports.length,
    missingVuReports,
    steadySeconds,
    expectedDeliveredTotal: (numberOrNull(ledger?.totalSteadyEvents) ?? 0) * expectedVus,
    actualDeliveredTotal,
    deliveredMessagesPerSec,
    missingEventsTotal,
    duplicateEventsTotal,
    invalidEventsTotal,
    abnormalDisconnects,
    missingSubscribedAcks,
    vusWithMissingEvents,
    maxUpstreamConnections: numberOrNull(ledger?.maxUpstreamConnections) ?? 0,
  };
}

function parseJsonLines(lines) {
  const parsed = [];
  for (const line of lines) {
    if (typeof line !== 'string') continue;
    const trimmed = line.trim();
    if (!trimmed.startsWith('{')) continue;
    try {
      const value = JSON.parse(trimmed);
      if (value !== null && typeof value === 'object') parsed.push(value);
    } catch {
      // Non-JSON lines are raw error output; the caller keeps them in the evidence file.
    }
  }
  return parsed;
}

export function parseHubLogs(logLines) {
  const samples = parseJsonLines(logLines).filter(
    (entry) => entry.msg === 'Market data stream hub summary.',
  );
  const maxOf = (key) =>
    samples.reduce(
      (max, sample) => (Number.isFinite(sample[key]) ? Math.max(max, sample[key]) : max),
      0,
    );
  return {
    samples,
    maxActiveClients: maxOf('activeWsClients'),
    maxUpstreamSubscriptions: maxOf('upstreamSubscriptions'),
    maxFanOutRatio: maxOf('fanOutRatio'),
    eventLoopLagP95MaxMs: maxOf('eventLoopLagP95Ms'),
    heapUsedMaxMb: maxOf('heapUsedMb'),
    rssMaxMb: maxOf('rssMb'),
    droppedInvalidEventsMax: maxOf('droppedInvalidEvents'),
  };
}

function summarizeProcessSamples(samples, logicalCores) {
  if (samples.length === 0) {
    return {
      sampleCount: 0,
      elapsedSeconds: 0,
      cpuSecondsDelta: 0,
      avgCpuPercentOfOneCore: 0,
      avgCpuPercentOfHost: 0,
      maxWorkingSetMb: 0,
      avgWorkingSetMb: 0,
    };
  }
  const ordered = [...samples].sort((a, b) => a.timestamp - b.timestamp);
  const first = ordered[0];
  const last = ordered.at(-1);
  const elapsedSeconds = (last.timestamp - first.timestamp) / 1000;
  const cpuSecondsDelta = Math.max(0, last.cpuSeconds - first.cpuSeconds);
  const avgCpuPercentOfOneCore =
    elapsedSeconds > 0 ? round2((cpuSecondsDelta / elapsedSeconds) * 100) : 0;
  const workingSetMb = ordered.map((sample) => sample.workingSetBytes / (1024 * 1024));
  const workingSetTotal = workingSetMb.reduce((total, value) => total + value, 0);
  return {
    sampleCount: ordered.length,
    elapsedSeconds: round2(elapsedSeconds),
    cpuSecondsDelta: round2(cpuSecondsDelta),
    avgCpuPercentOfOneCore,
    avgCpuPercentOfHost: round2(avgCpuPercentOfOneCore / logicalCores),
    maxWorkingSetMb: round2(Math.max(...workingSetMb)),
    avgWorkingSetMb: round2(workingSetTotal / workingSetMb.length),
  };
}

export function summarizeMonitor(jsonlLines, logicalCores = cpus().length) {
  const byProcess = new Map();
  for (const sample of parseJsonLines(jsonlLines)) {
    if (typeof sample.process !== 'string') continue;
    if (!Number.isFinite(sample.cpuSeconds) || !Number.isFinite(sample.workingSetBytes)) continue;
    const timestamp = Date.parse(sample.utc);
    if (!Number.isFinite(timestamp)) continue;
    const entries = byProcess.get(sample.process) ?? [];
    entries.push({
      timestamp,
      cpuSeconds: sample.cpuSeconds,
      workingSetBytes: sample.workingSetBytes,
    });
    byProcess.set(sample.process, entries);
  }
  const api = summarizeProcessSamples(byProcess.get('api') ?? [], logicalCores);
  const k6 = summarizeProcessSamples(byProcess.get('k6') ?? [], logicalCores);
  return {
    logicalCores,
    api,
    k6,
    loadGeneratorSaturated: k6.avgCpuPercentOfHost > saturationCpuPercent,
  };
}

function medianOf(sortedValues) {
  if (sortedValues.length === 0) return null;
  const middle = Math.floor(sortedValues.length / 2);
  return sortedValues.length % 2 === 0
    ? round2((sortedValues[middle - 1] + sortedValues[middle]) / 2)
    : sortedValues[middle];
}

function metricStats(values) {
  const clean = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  return {
    median: medianOf(clean),
    min: clean.at(0) ?? null,
    max: clean.at(-1) ?? null,
    quantiles: percentiles(clean),
  };
}

export function aggregateRuns(runSummaries) {
  const runs = Array.isArray(runSummaries) ? runSummaries : [];
  const stats = {};
  for (const key of aggregatedMetrics) {
    stats[key] = metricStats(runs.map((run) => run[key]));
  }
  return { runCount: runs.length, ...stats, runs };
}

function loadEnv() {
  const envPath = resolve(root, '.env');
  if (!existsSync(envPath)) throw new Error('A .env file is required at the repository root.');
  process.loadEnvFile(envPath);
}

function targetDatabase() {
  const base = process.env.DATABASE_URL;
  if (!base) throw new Error('DATABASE_URL is missing. Copy .env.example to .env.');
  const url = new URL(base);
  url.pathname = `${url.pathname.replace(/\/$/, '')}_ws_k6_perf`;
  const name = url.pathname.slice(1);
  if (!name.endsWith('_ws_k6_perf')) throw new Error('The benchmark database name is invalid.');
  return { url, name, adminUrl: base };
}

async function ensureDatabase({ adminUrl, name }) {
  const admin = new pg.Client({ connectionString: adminUrl });
  await admin.connect();
  try {
    const existing = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [name]);
    if (existing.rowCount === 0) {
      await admin.query(`CREATE DATABASE "${name.replaceAll('"', '""')}"`);
    }
  } finally {
    await admin.end();
  }
}

async function clearTransientTables(connectionString) {
  const pool = new pg.Pool({ connectionString });
  try {
    await pool.query('DELETE FROM "session"');
    await pool.query('DELETE FROM "rate_limit"');
  } finally {
    await pool.end();
  }
}

async function seed() {
  loadEnv();
  const target = targetDatabase();
  await ensureDatabase(target);
  const pool = new pg.Pool({ connectionString: target.url.toString() });
  try {
    await migrate(drizzle({ client: pool }), { migrationsFolder });
    const passwordHash = await hashPassword(benchmarkPassword);
    const credentials = [];
    for (let index = 1; index <= userCount; index += 1) {
      const suffix = String(index).padStart(3, '0');
      const userId = `ws-k6-user-${suffix}`;
      const email = `ws-k6-${suffix}@example.test`;
      await pool.query(
        `INSERT INTO "user" (id, name, email, email_verified) VALUES ($1, $2, $3, true)
         ON CONFLICT (email) DO UPDATE
         SET name = EXCLUDED.name, email_verified = true, updated_at = now()`,
        [userId, `WS k6 ${suffix}`, email],
      );
      const stored = await pool.query('SELECT id FROM "user" WHERE email = $1', [email]);
      const storedUserId = stored.rows[0].id;
      await pool.query(
        `INSERT INTO "account" (id, account_id, provider_id, user_id, password)
         VALUES ($1, $2, 'credential', $3, $4)
         ON CONFLICT (id) DO UPDATE
         SET account_id = EXCLUDED.account_id, provider_id = EXCLUDED.provider_id,
             user_id = EXCLUDED.user_id, password = EXCLUDED.password, updated_at = now()`,
        [`ws-k6-account-${suffix}`, storedUserId, storedUserId, passwordHash],
      );
      credentials.push({ email, password: benchmarkPassword });
    }
    mkdirSync(privateCache, { recursive: true });
    writeFileSync(credentialsPath, JSON.stringify(credentials, null, 2));
    const counts = await pool.query(
      `SELECT (SELECT COUNT(*)::int FROM "user") AS users,
              (SELECT COUNT(*)::int FROM "account" WHERE provider_id = 'credential') AS credentials`,
    );
    console.log(
      JSON.stringify(
        {
          database: target.name,
          users: counts.rows[0].users,
          credentialAccounts: counts.rows[0].credentials,
          credentialsPath,
        },
        null,
        2,
      ),
    );
  } finally {
    await pool.end();
  }
}

function apiEnvironment(databaseUrl) {
  const env = { ...process.env };
  delete env.GOOGLE_CLIENT_ID;
  delete env.GOOGLE_CLIENT_SECRET;
  return {
    ...env,
    NODE_ENV: 'production',
    LOG_LEVEL: 'info',
    API_PORT: '3095',
    BETTER_AUTH_URL: apiOrigin,
    BETTER_AUTH_SECRET: betterAuthSecret,
    RESEND_API_KEY: 're_perf_dummy_unused_in_ws_load_test',
    EMAIL_FROM: 'Crypto Force Perf <perf@example.test>',
    DATABASE_URL: databaseUrl,
    DATABASE_POOL_MAX: '20',
    WS_MAX_CONNECTIONS_PER_USER: '4',
    BINANCE_WS_URL: `${replayHttpUrl.replace('http', 'ws')}/stream`,
  };
}

function resolveK6() {
  const configured = process.env.K6_PATH;
  if (configured) return configured;
  const local = resolve(
    process.env.LOCALAPPDATA ?? process.env.HOME ?? '',
    'crypto-force-tools/k6-2.4.0/k6-v2.4.0-windows-amd64/k6.exe',
  );
  return existsSync(local) ? local : 'k6';
}

function captureLines(child, sink) {
  for (const stream of [child.stdout, child.stderr]) {
    if (!stream) continue;
    createInterface({ input: stream }).on('line', (line) => sink.push(line));
  }
}

function startMonitor({ pid, outputPath, processName }) {
  return spawn(
    'powershell',
    [
      '-ExecutionPolicy',
      'Bypass',
      '-File',
      monitorScript,
      '-TargetProcessId',
      String(pid),
      '-OutputPath',
      outputPath,
      '-ProcessName',
      processName,
    ],
    { stdio: 'ignore', windowsHide: true },
  );
}

async function stopChild(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  child.kill();
  const exited = await Promise.race([
    once(child, 'exit').then(() => true),
    delay(5000).then(() => false),
  ]);
  if (!exited) child.kill('SIGKILL');
}

function apiFailureDetail(logLines) {
  const tail = logLines.slice(-5).join('\n');
  return tail ? `\nLast API output:\n${tail}` : '';
}

async function waitForApiHealth(child, timeoutMs, logLines) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(
        `The API exited before becoming healthy (code ${child.exitCode}).${apiFailureDetail(logLines)}`,
      );
    }
    try {
      const response = await fetch(`${apiOrigin}/api/health`);
      if (response.status === 200) {
        await response.arrayBuffer();
        return;
      }
    } catch {
      // The API is still starting and the loop retries.
    }
    await delay(250);
  }
  throw new Error(`The API did not become healthy on 127.0.0.1:3095.${apiFailureDetail(logLines)}`);
}

async function replayRequest(httpUrl, path, body) {
  const response = await fetch(
    `${httpUrl}${path}`,
    body === undefined
      ? { method: 'POST' }
      : {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
  );
  if (!response.ok) {
    throw new Error(`Replay control ${path} failed with status ${response.status}.`);
  }
  return response.json();
}

function hostInfo() {
  return {
    os: `${platform()} ${release()}`,
    host: hostname(),
    cpu: cpus()[0]?.model ?? null,
    logicalCores: cpus().length,
    ramBytes: totalmem(),
    freeRamBytes: freemem(),
  };
}

function readK6Summary(path) {
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return {};
  }
}

function extractK6Metrics(summary) {
  const metrics = summary?.metrics ?? {};
  const latency = metrics.ws_delivery_latency_ms?.values ?? {};
  const errorRate = metrics.ws_error_rate?.values ?? {};
  return {
    p95LatencyMs: numberOrNull(latency['p(95)']),
    p99LatencyMs: numberOrNull(latency['p(99)']),
    errorRate: numberOrNull(errorRate.rate),
  };
}

function filterServerMetrics(lines) {
  const kept = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    let entry;
    try {
      entry = JSON.parse(trimmed);
    } catch {
      kept.push(trimmed);
      continue;
    }
    if (entry?.msg === 'Market data stream hub summary.') {
      kept.push(trimmed);
      continue;
    }
    if (typeof entry?.level === 'number' && entry.level >= 40) kept.push(trimmed);
  }
  return kept;
}

function timestampOf(line) {
  try {
    const parsed = Date.parse(JSON.parse(line).utc);
    return Number.isFinite(parsed) ? parsed : 0;
  } catch {
    return 0;
  }
}

function mergeMonitorFiles(sourcePaths, outputPath) {
  const lines = [];
  for (const sourcePath of sourcePaths) {
    if (!existsSync(sourcePath)) continue;
    for (const line of readFileSync(sourcePath, 'utf8').split(/\r?\n/)) {
      const trimmed = line.trim();
      if (trimmed) lines.push(trimmed);
    }
  }
  lines.sort((a, b) => timestampOf(a) - timestampOf(b));
  writeFileSync(outputPath, lines.length > 0 ? `${lines.join('\n')}\n` : '');
  return lines;
}

async function executeRun({
  runId,
  outputDirectory,
  vus,
  warmupSeconds,
  steadySeconds,
  drainSeconds,
  faultMode,
}) {
  loadEnv();
  const target = targetDatabase();
  if (!existsSync(credentialsPath)) {
    throw new Error(
      'The credentials file is missing. Run: node apps/api/perf/market-data/ws-k6/run.mjs seed',
    );
  }
  if (!existsSync(apiEntry)) {
    throw new Error('The API build is missing. Run: pnpm --filter @crypto-force/api build');
  }
  mkdirSync(outputDirectory, { recursive: true });
  const samplingDirectory = resolve(outputDirectory, '.sampling');
  rmSync(samplingDirectory, { recursive: true, force: true });
  mkdirSync(samplingDirectory, { recursive: true });
  const apiMonitorPath = resolve(samplingDirectory, 'host-monitor.api.jsonl');
  const k6MonitorPath = resolve(samplingDirectory, 'host-monitor.k6.jsonl');

  await clearTransientTables(target.url.toString());

  const startedUtc = new Date().toISOString();
  const replay = await startReplayServer({ port: 3096, intervalMs: replayIntervalMs });
  const apiLogLines = [];
  const k6LogLines = [];
  const controlErrors = [];
  const timers = [];
  let api;
  let monitorApi;
  let monitorK6;
  let k6;
  let replayClosed = false;

  try {
    if (faultMode) await replayRequest(replay.httpUrl, '/fault', { mode: faultMode });

    api = spawn(process.execPath, [apiEntry], {
      cwd: root,
      env: apiEnvironment(target.url.toString()),
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
    captureLines(api, apiLogLines);
    await waitForApiHealth(api, 60_000, apiLogLines);
    monitorApi = startMonitor({ pid: api.pid, outputPath: apiMonitorPath, processName: 'api' });

    const k6Path = resolveK6();
    const k6SummaryPath = resolve(outputDirectory, 'k6-summary.json');
    k6 = spawn(
      k6Path,
      ['run', '--summary-trend-stats', 'avg,min,med,max,p(90),p(95),p(99)', workloadScript],
      {
        cwd: root,
        env: {
          ...process.env,
          CREDENTIALS_PATH: credentialsPath,
          API_ORIGIN: apiOrigin,
          WS_URL: apiWsUrl,
          REPLAY_HTTP_URL: replay.httpUrl,
          SUMMARY_PATH: k6SummaryPath,
          VUS: String(vus),
          WARMUP_SECONDS: String(warmupSeconds),
          STEADY_SECONDS: String(steadySeconds),
          DRAIN_SECONDS: String(drainSeconds),
        },
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
      },
    );
    captureLines(k6, k6LogLines);
    monitorK6 = startMonitor({ pid: k6.pid, outputPath: k6MonitorPath, processName: 'k6' });

    let phase = 'warmup';
    timers.push(
      setTimeout(() => {
        phase = 'steady';
        void replayRequest(replay.httpUrl, '/start-steady').catch((error) => {
          controlErrors.push(error);
        });
      }, warmupSeconds * 1000),
    );
    timers.push(
      setTimeout(
        () => {
          phase = 'drain';
          void replayRequest(replay.httpUrl, '/stop-steady').catch((error) => {
            controlErrors.push(error);
          });
        },
        (warmupSeconds + steadySeconds) * 1000,
      ),
    );

    const k6ExitCode = await new Promise((resolveExit, rejectExit) => {
      k6.once('error', rejectExit);
      k6.once('exit', (code) => resolveExit(code ?? 1));
    });
    for (const timer of timers) clearTimeout(timer);
    timers.length = 0;
    if (phase === 'steady') await replayRequest(replay.httpUrl, '/stop-steady');
    if (controlErrors.length > 0) throw controlErrors[0];
    await delay(500);

    const ledgerResponse = await fetch(`${replay.httpUrl}/ledger`);
    if (!ledgerResponse.ok) {
      throw new Error(`The replay ledger request failed with status ${ledgerResponse.status}.`);
    }
    const ledger = await ledgerResponse.json();

    await stopChild(monitorApi);
    await stopChild(monitorK6);
    await stopChild(api);
    await replay.close();
    replayClosed = true;

    const reconciliation = reconcileRun({ ledger, expectedVus: vus, steadySeconds });
    const hub = parseHubLogs(apiLogLines);
    const hostLines = mergeMonitorFiles(
      [apiMonitorPath, k6MonitorPath],
      resolve(outputDirectory, 'host-monitor.jsonl'),
    );
    const monitor = summarizeMonitor(hostLines, cpus().length);
    if (hub.samples.length === 0) {
      throw new Error(`No "Market data stream hub summary." line was captured for ${runId}.`);
    }
    if (monitor.api.sampleCount === 0 || monitor.k6.sampleCount === 0) {
      throw new Error(`The host monitor produced no samples for ${runId}.`);
    }
    const k6Summary = readK6Summary(k6SummaryPath);
    const k6Metrics = extractK6Metrics(k6Summary);
    const finishedUtc = new Date().toISOString();

    writeFileSync(
      resolve(outputDirectory, 'server-metrics.jsonl'),
      filterServerMetrics(apiLogLines)
        .map((line) => `${line}\n`)
        .join(''),
    );
    writeFileSync(
      resolve(outputDirectory, 'reconciliation.json'),
      JSON.stringify(reconciliation, null, 2),
    );
    writeFileSync(
      resolve(outputDirectory, 'manifest.json'),
      JSON.stringify(
        {
          runId,
          startedUtc,
          finishedUtc,
          vus,
          warmupSeconds,
          steadySeconds,
          drainSeconds,
          faultMode: faultMode ?? null,
          api: { entry: apiEntry, origin: apiOrigin, wsUrl: apiWsUrl, node: process.version },
          replay: {
            httpUrl: replay.httpUrl,
            wsUrl: replay.wsUrl,
            intervalMs: replayIntervalMs,
            channels: BENCHMARK_CHANNELS.map((channel) => channel.key),
          },
          database: { name: target.name },
          k6: { path: k6Path, exitCode: k6ExitCode },
          host: hostInfo(),
          credentialsPath,
        },
        null,
        2,
      ),
    );
    rmSync(samplingDirectory, { recursive: true, force: true });

    const runSummary = {
      runId,
      startedUtc,
      finishedUtc,
      vus,
      k6ExitCode,
      reconciliationPassed: reconciliation.passed,
      deliveredMessagesPerSec: reconciliation.deliveredMessagesPerSec,
      p95LatencyMs: k6Metrics.p95LatencyMs,
      p99LatencyMs: k6Metrics.p99LatencyMs,
      errorRate: k6Metrics.errorRate,
      apiCpuPercent: monitor.api.avgCpuPercentOfOneCore,
      k6CpuPercent: monitor.k6.avgCpuPercentOfHost,
      apiHeapMaxMb: hub.heapUsedMaxMb,
      apiRssMaxMb: hub.rssMaxMb,
      apiEventLoopLagP95MaxMs: hub.eventLoopLagP95MaxMs,
      k6RamMaxMb: monitor.k6.maxWorkingSetMb,
      loadGeneratorSaturated: monitor.loadGeneratorSaturated,
      missingEventsTotal: reconciliation.missingEventsTotal,
      duplicateEventsTotal: reconciliation.duplicateEventsTotal,
      invalidEventsTotal: reconciliation.invalidEventsTotal,
      abnormalDisconnects: reconciliation.abnormalDisconnects,
      missingVuReports: reconciliation.missingVuReports,
    };

    return { runId, reconciliation, hub, monitor, k6Metrics, k6LogLines, runSummary };
  } finally {
    for (const timer of timers) clearTimeout(timer);
    await stopChild(monitorApi);
    await stopChild(monitorK6);
    await stopChild(api);
    await stopChild(k6);
    if (!replayClosed) await replay.close();
  }
}

async function validate() {
  loadEnv();
  const checks = [];
  let failure = null;
  try {
    const smoke = await executeRun({
      runId: 'smoke-clean-10vu',
      outputDirectory: resolve(privateCache, 'validation/smoke-clean-10vu'),
      vus: 10,
      warmupSeconds: 10,
      steadySeconds: 15,
      drainSeconds: 5,
    });
    const smokePassed = smoke.reconciliation.passed === true;
    checks.push({
      name: 'clean-smoke',
      faultMode: null,
      expected: 'reconciliation passes',
      passed: smokePassed,
      reconciliation: smoke.reconciliation,
    });
    if (!smokePassed) throw new Error('The clean 10-VU smoke did not pass reconciliation.');

    const faults = [
      {
        mode: 'drop-one',
        expected: 'missingEventsTotal > 0',
        verify: (run) =>
          run.reconciliation.passed === false && run.reconciliation.missingEventsTotal > 0,
      },
      {
        mode: 'duplicate-one',
        expected: 'duplicateEventsTotal > 0',
        verify: (run) =>
          run.reconciliation.passed === false && run.reconciliation.duplicateEventsTotal > 0,
      },
      {
        mode: 'invalid-payload',
        expected: 'droppedInvalidEventsMax > 0 and missingEventsTotal > 0',
        verify: (run) =>
          run.reconciliation.passed === false &&
          run.hub.droppedInvalidEventsMax > 0 &&
          run.reconciliation.missingEventsTotal > 0,
      },
    ];

    for (const fault of faults) {
      const run = await executeRun({
        runId: `fault-${fault.mode}`,
        outputDirectory: resolve(privateCache, 'validation', `fault-${fault.mode}`),
        vus: 5,
        warmupSeconds: 10,
        steadySeconds: 15,
        drainSeconds: 5,
        faultMode: fault.mode,
      });
      const passed = fault.verify(run);
      checks.push({
        name: fault.mode,
        faultMode: fault.mode,
        expected: fault.expected,
        passed,
        droppedInvalidEventsMax: run.hub.droppedInvalidEventsMax,
        reconciliation: run.reconciliation,
      });
      if (!passed) throw new Error(`The ${fault.mode} fault was not detected as expected.`);
    }
  } catch (error) {
    failure = error;
  }

  mkdirSync(privateCache, { recursive: true });
  writeFileSync(
    validationSummaryPath,
    JSON.stringify(
      {
        generatedAtUtc: new Date().toISOString(),
        allChecksPassed: checks.length === 4 && checks.every((check) => check.passed),
        checks,
      },
      null,
      2,
    ),
  );
  if (failure) throw failure;
  console.log(
    JSON.stringify(
      {
        allChecksPassed: true,
        validationSummaryPath,
        checks: checks.map((check) => ({
          name: check.name,
          passed: check.passed,
          missingEventsTotal: check.reconciliation.missingEventsTotal,
          duplicateEventsTotal: check.reconciliation.duplicateEventsTotal,
          invalidEventsTotal: check.reconciliation.invalidEventsTotal,
          abnormalDisconnects: check.reconciliation.abnormalDisconnects,
        })),
      },
      null,
      2,
    ),
  );
}

function readRecoveryEvidence() {
  const reference = {
    source: 'docs/testing/evidence/market-data/ws-v1-benchmarks/summary.json',
    field: 'recoveryQa16AndQa17',
  };
  if (!existsSync(recoveryEvidencePath)) return { ...reference, available: false };
  const summary = JSON.parse(readFileSync(recoveryEvidencePath, 'utf8'));
  const recovery = summary.recoveryQa16AndQa17;
  if (!recovery) return { ...reference, available: false };
  return {
    ...reference,
    available: true,
    sampleCount: recovery.sampleCount,
    recoveryMsPercentiles: recovery.recoveryMsPercentiles,
    allSamplesZeroMissingDuplicateMismatch: recovery.allSamplesZeroMissingDuplicateMismatch,
    qa16Passed: recovery.qa16Passed,
    qa17Passed: recovery.qa17Passed,
  };
}

async function benchmark({ force }) {
  loadEnv();
  if (existsSync(evidenceDirectory) && !force) {
    throw new Error(
      'The evidence directory already exists. Pass --force to overwrite docs/testing/evidence/market-data/ws-k6-100vu-v1/.',
    );
  }
  mkdirSync(evidenceDirectory, { recursive: true });
  const runSummaries = [];
  for (const runId of ['r1', 'r2', 'r3', 'r4', 'r5']) {
    const result = await executeRun({
      runId,
      outputDirectory: resolve(evidenceDirectory, runId),
      vus: 100,
      warmupSeconds: 30,
      steadySeconds: 180,
      drainSeconds: 15,
    });
    runSummaries.push(result.runSummary);
  }

  const aggregate = aggregateRuns(runSummaries);
  const summary = {
    generatedAtUtc: new Date().toISOString(),
    parameters: { vus: 100, runs: 5, warmupSeconds: 30, steadySeconds: 180, drainSeconds: 15 },
    environment: { ...hostInfo(), node: process.version, apiEntry },
    runCount: aggregate.runCount,
    runs: aggregate.runs,
    aggregate: Object.fromEntries(aggregatedMetrics.map((key) => [key, aggregate[key]])),
    loadGeneratorSaturated: runSummaries.some((run) => run.loadGeneratorSaturated),
    allRunsPassed: runSummaries.every((run) => run.reconciliationPassed),
    recoveryEvidence: readRecoveryEvidence(),
  };
  writeFileSync(resolve(evidenceDirectory, 'summary.json'), JSON.stringify(summary, null, 2));
  console.log(
    JSON.stringify(
      {
        evidenceDirectory,
        runCount: summary.runCount,
        allRunsPassed: summary.allRunsPassed,
        loadGeneratorSaturated: summary.loadGeneratorSaturated,
        deliveredMessagesPerSec: aggregate.deliveredMessagesPerSec,
        p95LatencyMs: aggregate.p95LatencyMs,
        p99LatencyMs: aggregate.p99LatencyMs,
      },
      null,
      2,
    ),
  );
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) {
  const command = process.argv[2];
  const handlers = {
    seed,
    validate,
    benchmark: () => benchmark({ force: process.argv.includes('--force') }),
  };
  const handler = handlers[command];
  if (!handler) {
    console.error('Usage: node apps/api/perf/market-data/ws-k6/run.mjs <seed|validate|benchmark>');
    process.exitCode = 1;
  } else {
    try {
      await handler();
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    }
  }
}
