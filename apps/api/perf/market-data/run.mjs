import { spawn, execFileSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
  unlinkSync,
} from 'node:fs';
import { cpus, freemem, hostname, platform, release, totalmem } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { gzipSync } from 'node:zlib';
import { aggregate, percentiles } from './aggregate.mjs';
import { browserRun } from './browser.mjs';
import { primeCache } from './prime-cache.mjs';

const directory = dirname(fileURLToPath(import.meta.url));
const root = resolve(directory, '../../../..');
const evidence = resolve(root, 'docs/testing/evidence/market-data');
const origin = 'http://127.0.0.1:5195';
const control = 'http://127.0.0.1:3025';
const k6 =
  process.env.K6_PATH ||
  resolve(process.env.LOCALAPPDATA, 'crypto-force-tools/k6-2.4.0/k6-v2.4.0-windows-amd64/k6.exe');
const hash = (value) => createHash('sha256').update(value).digest('hex');
const hashFile = (file) => hash(readFileSync(file));
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const base = JSON.parse(readFileSync(resolve(directory, 'config.json'), 'utf8'));
const command = process.argv[2];
const cohortPrefix = 'rest-v3';
const privateDirectory = resolve(root, 'node_modules/.cache/market-data-perf');
mkdirSync(privateDirectory, { recursive: true });
mkdirSync(evidence, { recursive: true });
async function request(path, body) {
  const response = await fetch(
    `${control}${path}`,
    body === undefined
      ? {}
      : {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
  );
  if (!response.ok) throw new Error('The benchmark control request failed.');
  return response.json();
}
function filesUnder(path) {
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? filesUnder(resolve(path, entry.name)) : [resolve(path, entry.name)],
  );
}
async function manifest(run, workload) {
  const build = resolve(root, 'apps/web/build/client');
  const database = await request('/environment');
  const containerId = execFileSync('docker', ['compose', 'ps', '-q', 'postgres'], {
    cwd: root,
    encoding: 'utf8',
  }).trim();
  const containerLimits = JSON.parse(
    execFileSync('docker', ['inspect', '--format', '{{json .HostConfig}}', containerId], {
      encoding: 'utf8',
    }),
  );
  return {
    ...base,
    ...workload,
    run,
    origin,
    commit: git('rev-parse', 'HEAD'),
    dirtyDiffHash: hash(git('diff', 'HEAD')),
    dirtyFiles: git('status', '--short'),
    lockfileHash: hashFile(resolve(root, 'pnpm-lock.yaml')),
    fixtureHash: hashFile(resolve(directory, 'fixtures/replay.json')),
    node: process.version,
    k6: execFileSync(k6, ['version'], { encoding: 'utf8' }).trim(),
    pnpm: execFileSync(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', 'pnpm --version'], {
      encoding: 'utf8',
    }).trim(),
    environment: {
      os: `${platform()} ${release()}`,
      host: hostname(),
      cpu: cpus()[0]?.model,
      logicalCores: cpus().length,
      ram: totalmem(),
      freeRam: freemem(),
      topology: 'Browser, k6, API, replay, and Docker Desktop PostgreSQL share this Windows host.',
      cpuGovernor: 'Unknown',
      databaseDescription: 'Dedicated _market_data_perf_test database. No production account data.',
      database,
      containerLimits: {
        nanoCpus: containerLimits.NanoCpus,
        memoryBytes: containerLimits.Memory,
        cpuQuota: containerLimits.CpuQuota,
        cpuPeriod: containerLimits.CpuPeriod,
      },
      network:
        'Loopback HTTP, no TLS, no compression, no shaping. Replay delay is 50 ms and is not network RTT.',
      clock:
        workload.mode === 'steady'
          ? 'Native k6 HTTP timing uses UnixNano wall-clock differences. Monotonic timing is not verified. These latency values are descriptive.'
          : workload.mode === 'micro' || workload.mode === 'ui'
            ? 'Client duration uses performance.now. UTC correlates events on the same host. Host synchronization is not independently verified.'
            : 'Mode-specific clocks: native k6 HTTP timing uses a wall clock. Node micro and browser UI use performance.now. Host synchronization is not independently verified.',
    },
    buildHash: hash(
      filesUnder(build)
        .sort()
        .map((file) => `${file.slice(build.length)}:${hashFile(file)}`)
        .join('\n'),
    ),
    startedUtc: new Date().toISOString(),
  };
}
async function begin(run, workload) {
  const path = resolve(evidence, run);
  if (existsSync(path))
    throw new Error('The evidence directory already exists. Use a new cohort name.');
  mkdirSync(path);
  const data = await manifest(run, workload);
  writeFileSync(resolve(path, 'manifest.json'), JSON.stringify(data, null, 2));
  writeFileSync(resolve(path, 'config.json'), JSON.stringify(workload, null, 2));
  writeFileSync(
    resolve(path, 'commands.txt'),
    `${base.setupCommandsExecuted.join('\n')}\nnode apps/api/perf/market-data/run.mjs ${process.argv.slice(2).join(' ')}\n`,
  );
  for (const name of [
    'samples.jsonl',
    'errors.jsonl',
    'api.jsonl',
    'upstream.jsonl',
    'resources.jsonl',
    'reconciliation.jsonl',
  ])
    writeFileSync(resolve(path, name), '');
  await request('/begin', { run });
  const rtt = [];
  for (let i = 0; i < 5; i++) {
    const start = performance.now();
    await fetch(`${origin}/api/health`);
    rtt.push(performance.now() - start);
  }
  writeFileSync(
    resolve(path, 'network.json'),
    JSON.stringify(
      {
        generatorApiHealthRoundTripMs: rtt,
        apiReplayRtt: 'Unmeasured separately from the configured replay delay.',
        browserApiRtt: 'Resource timing includes request and server work.',
      },
      null,
      2,
    ),
  );
  return { path, data };
}
function compress(path) {
  const hashes = {};
  for (const file of filesUnder(path)) {
    if (statSync(file).size > base.rawCompressionThresholdBytes && !file.endsWith('.gz')) {
      const rawHash = hashFile(file);
      writeFileSync(`${file}.gz`, gzipSync(readFileSync(file)));
      hashes[file.slice(path.length + 1)] = {
        rawSha256: rawHash,
        gzipSha256: hashFile(`${file}.gz`),
      };
      unlinkSync(file);
    }
  }
  const name = resolve(path, 'manifest.json');
  const data = JSON.parse(readFileSync(name, 'utf8'));
  writeFileSync(
    name,
    JSON.stringify({ ...data, endedUtc: new Date().toISOString(), compressed: hashes }, null, 2),
  );
}
async function accounts(count) {
  const credentials = [];
  for (let index = 0; index < count; index++) {
    const email = `perf-${randomUUID()}@example.test`;
    const password = `Benchmark-${randomUUID()}-91`;
    const response = await fetch(`${origin}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: origin,
        'x-forwarded-for': `10.83.${Math.floor(index / 250)}.${(index % 250) + 1}`,
      },
      body: JSON.stringify({ email, password, name: 'Benchmark Reader' }),
    });
    if (response.status !== 200) throw new Error('The benchmark account creation failed.');
    let link;
    const deadline = performance.now() + 10000;
    while (!link && performance.now() < deadline) {
      link = String(await request('/mail')).match(/http:\/\/[^\s]+\/verify-email\?[^\s]+/)?.[0];
      if (!link) await delay(20);
    }
    if (!link) throw new Error('The benchmark verification email is missing.');
    const verified = await fetch(link, { redirect: 'manual' });
    if (verified.status !== 302 && verified.status !== 200)
      throw new Error('The benchmark email verification failed.');
    credentials.push({ email, password });
  }
  writeFileSync(resolve(privateDirectory, 'credentials.json'), JSON.stringify(credentials));
  return credentials;
}
async function k6Run(run, workload) {
  const { path, data } = await begin(run, workload);
  const args = [
    'run',
    '--quiet',
    '--out',
    `json=${resolve(path, 'raw-k6.jsonl')}`,
    '--env',
    `CREDENTIALS=${resolve(privateDirectory, 'credentials.json')}`,
    '--env',
    `MANIFEST=${resolve(path, 'manifest.json')}`,
    '--env',
    `ORACLE=${resolve(directory, 'fixtures/replay.json')}`,
    resolve(directory, 'workload.js'),
  ];
  appendFileSync(
    resolve(path, 'commands.txt'),
    `k6 run --quiet --out json=<run>/raw-k6.jsonl --env CREDENTIALS=<private-file> --env MANIFEST=<run>/manifest.json --env ORACLE=apps/api/perf/market-data/fixtures/replay.json apps/api/perf/market-data/workload.js\n`,
  );
  const child = spawn(k6, args, { stdio: ['ignore', 'pipe', 'pipe'] });
  const monitor = spawn(
    'powershell.exe',
    [
      '-NoProfile',
      '-File',
      resolve(directory, 'monitor.ps1'),
      '-TargetProcessId',
      String(child.pid),
      '-OutputPath',
      resolve(path, 'generator-resources.jsonl'),
    ],
    { windowsHide: true, stdio: 'ignore' },
  );
  child.stdout.on('data', (value) => appendFileSync(resolve(path, 'generator.txt'), value));
  child.stderr.on('data', (value) => appendFileSync(resolve(path, 'generator-errors.txt'), value));
  const timer = setInterval(() => {
    appendFileSync(
      resolve(path, 'resources.jsonl'),
      `${JSON.stringify({ utc: new Date().toISOString(), process: 'orchestrator', cpu: process.cpuUsage(), memory: process.memoryUsage(), freeHostRam: freemem() })}\n`,
    );
  }, 1000);
  const exitCode = await new Promise((done, reject) => {
    child.on('error', reject);
    child.on('exit', done);
  });
  clearInterval(timer);
  await new Promise((done) => {
    if (monitor.exitCode !== null) done();
    else monitor.on('exit', done);
  });
  await request('/end', {});
  const summary = await aggregate(path);
  writeFileSync(resolve(path, 'exit.json'), JSON.stringify({ exitCode, commit: data.commit }));
  compress(path);
  console.log(JSON.stringify({ run, exitCode, summary }));
}
async function functionalProbe() {
  const id = `probe-${randomUUID()}`;
  execFileSync(
    k6,
    [
      'run',
      '--quiet',
      '--env',
      `CREDENTIALS=${resolve(privateDirectory, 'credentials.json')}`,
      '--env',
      `ORACLE=${resolve(directory, 'fixtures/replay.json')}`,
      '--env',
      `PROBE_ID=${id}`,
      resolve(directory, 'workload-probe.js'),
    ],
    { stdio: 'pipe' },
  );
  const state = await request('/state');
  if (!state.reconciliations.some((entry) => entry.id === id && entry.valid))
    throw new Error('The functional probe did not produce a valid reconciliation.');
  console.log('The k6 functional probe and server reconciliation passed.');
}
async function microRun(run, state, credentials) {
  const { path } = await begin(run, {
    mode: 'micro',
    state,
    batches: 100,
    clients: state === 'single-flight' ? 10 : 1,
  });
  const cookies = [];
  for (const [index, user] of credentials.slice(0, state === 'single-flight' ? 10 : 1).entries()) {
    const response = await fetch(`${origin}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: {
        Origin: origin,
        'Content-Type': 'application/json',
        'x-forwarded-for': `10.84.0.${index + 1}`,
      },
      body: JSON.stringify(user),
    });
    if (response.status !== 200) throw new Error('The micro-batch sign-in failed.');
    cookies.push(
      response.headers
        .getSetCookie()
        .map((value) => value.split(';')[0])
        .join('; '),
    );
  }
  const values = [];
  const errorValues = [];
  const oracle = JSON.parse(readFileSync(resolve(directory, 'fixtures/replay.json'), 'utf8')).keys[
    'BTCUSDT:5m'
  ];
  let failures = 0;
  for (let batch = 0; batch < 100; batch++) {
    if (state !== 'hit') await delay(6000);
    let prime;
    if (state === 'hit')
      prime = await primeCache({
        prime: () =>
          fetch(`${origin}/api/market-data/candles?pair=BTCUSDT&timeframe=5m`, {
            headers: { Cookie: cookies[0], 'x-perf-id': `${run}-prime-${batch}` },
          }).then((response) => response.json()),
        now: Date.now,
        pause: delay,
        ttlMs: 5000,
        thinkMs: 6000,
        record: (event) =>
          appendFileSync(
            resolve(path, 'preparations.jsonl'),
            `${JSON.stringify({ batch, ...event })}\n`,
          ),
      });
    const before = await request('/state');
    if (state === 'single-flight') await request('/barrier', { waiters: 9 });
    const responses = await Promise.all(
      cookies.map(async (cookie, client) => {
        const id = `${run}-${batch}-${client}`;
        const start = performance.now();
        try {
          const response = await fetch(
            `${origin}/api/market-data/candles?pair=BTCUSDT&timeframe=5m`,
            { headers: { Cookie: cookie, 'x-perf-id': id } },
          );
          const bytes = await response.arrayBuffer();
          const end = performance.now();
          const body = JSON.parse(new TextDecoder().decode(bytes));
          const valid =
            response.status === 200 &&
            body.pair === 'BTCUSDT' &&
            body.timeframe === '5m' &&
            body.warmupCount === 19 &&
            JSON.stringify(body.candles) === JSON.stringify(oracle.candles) &&
            (state !== 'hit' || JSON.stringify(body) === JSON.stringify(prime));
          const sample = {
            id,
            batch,
            client,
            start,
            end,
            durationMs: end - start,
            status: response.status,
            bodyBytes: bytes.byteLength,
            dataTime: body.dataTime,
            valid,
          };
          appendFileSync(resolve(path, 'samples.jsonl'), `${JSON.stringify(sample)}\n`);
          if (valid) values.push(sample.durationMs);
          else {
            failures++;
            errorValues.push(sample.durationMs);
            appendFileSync(resolve(path, 'errors.jsonl'), `${JSON.stringify(sample)}\n`);
          }
          return sample;
        } catch {
          failures++;
          errorValues.push(performance.now() - start);
          appendFileSync(
            resolve(path, 'errors.jsonl'),
            `${JSON.stringify({ id, start, end: performance.now(), error: 'transport' })}\n`,
          );
          return undefined;
        }
      }),
    );
    const after = await request('/state');
    const calls = after.upstream.length - before.upstream.length;
    const events = after.cacheEvents.slice(before.cacheEvents.length);
    const valid =
      state === 'hit'
        ? calls === 0 && events.filter((entry) => entry.cacheState === 'hit').length === 1
        : state === 'miss'
          ? calls === 1 && events.filter((entry) => entry.cacheState === 'miss').length === 1
          : calls === 1 &&
            events.filter((entry) => entry.cacheState === 'join').length === 9 &&
            new Set(responses.map((response) => response?.dataTime)).size === 1;
    if (!valid) failures++;
    appendFileSync(
      resolve(path, 'batches.jsonl'),
      `${JSON.stringify({ batch, calls, joined: events.filter((entry) => entry.cacheState === 'join').length, valid })}\n`,
    );
    console.log(JSON.stringify({ run, batch, valid }));
    await request('/release', {});
  }
  await request('/end', {});
  const reconciled = readFileSync(resolve(path, 'reconciliation.jsonl'), 'utf8')
    .trim()
    .split('\n')
    .filter(Boolean)
    .map(JSON.parse);
  const invalid = reconciled.filter((row) => !row.valid).length;
  writeFileSync(
    resolve(path, 'summary.json'),
    JSON.stringify(
      {
        run,
        state,
        batches: 100,
        failures,
        invalid,
        count: values.length,
        latencyMs: percentiles(values),
        errorCount: errorValues.length,
        errorLatencyMs: percentiles(errorValues),
        capacity: 'Inconclusive',
        timing:
          'Node fetch monotonic elapsed time. Barrier samples are separate from the 50 ms baseline.',
      },
      null,
      2,
    ),
  );
  writeFileSync(
    resolve(path, 'reconciliation.json'),
    JSON.stringify({ count: reconciled.length, invalid }, null, 2),
  );
  compress(path);
}
if (command === 'prepare') {
  const data = await manifest(cohortPrefix, {
    api: { cohorts: ['default', 'diverse'], clients: [1, 10, 50], repeats: 3 },
    micro: { states: ['miss', 'hit', 'single-flight'], batches: 100, repeats: 3 },
    ui: {
      primary: ['open-cold', 'timeframe-cold'],
      actions: 100,
      repeats: 3,
      secondary: ['pair-cold', 'open-hot', 'timeframe-hot', 'pair-hot'],
      secondaryActions: 30,
    },
    firstMeasurement: 'Not started',
    accountCount: 50,
    sessionCount: 'Created by real Auth before each measured run',
    sourceDigest: hash(
      filesUnder(directory)
        .filter((file) => !file.endsWith('measurement-manifest.json'))
        .sort()
        .map((file) => `${file.slice(directory.length)}:${hashFile(file)}`)
        .join('\n'),
    ),
  });
  writeFileSync(resolve(directory, 'measurement-manifest.json'), JSON.stringify(data, null, 2));
  console.log('The benchmark preparation manifest is ready for commit.');
} else if (command === 'accounts') {
  await accounts(50);
  console.log('The benchmark created 50 verified accounts.');
} else if (command === 'api') {
  if (!process.argv.includes('--allow-wall-clock'))
    throw new Error(
      'The native k6 HTTP timer uses a wall clock. Use --allow-wall-clock only for descriptive runs.',
    );
  await functionalProbe();
  for (const cohort of ['default', 'diverse'])
    for (const clients of [1, 10, 50])
      for (let repeat = 1; repeat <= 3; repeat++)
        await k6Run(`${cohortPrefix}-api-${cohort}-${clients}-${repeat}`, {
          mode: 'steady',
          cohort,
          clients,
          repeat,
        });
} else if (command === 'micro' || command === 'micro-hit') {
  await functionalProbe();
  const credentials = JSON.parse(
    readFileSync(resolve(privateDirectory, 'credentials.json'), 'utf8'),
  );
  for (const state of command === 'micro-hit' ? ['hit'] : ['miss', 'hit', 'single-flight'])
    for (let repeat = 1; repeat <= 3; repeat++)
      await microRun(`${cohortPrefix}-micro-${state}-${repeat}`, state, credentials);
} else if (command === 'ui') {
  await functionalProbe();
  const credentials = JSON.parse(
    readFileSync(resolve(privateDirectory, 'credentials.json'), 'utf8'),
  );
  for (const assetCache of ['cold', 'hot'])
    for (const action of ['open', 'timeframe', 'pair'])
      for (
        let repeat = 1;
        repeat <= (assetCache === 'cold' && action !== 'pair' ? 3 : 1);
        repeat++
      ) {
        if (process.argv.includes('--remaining-ui') && assetCache === 'cold' && action === 'open')
          continue;
        const run = `${cohortPrefix}-ui-${action}-${assetCache}-${repeat}`;
        const { path, data } = await begin(run, {
          mode: 'ui',
          assetCache,
          action,
          repeat,
          actions: assetCache === 'cold' && action !== 'pair' ? 100 : 30,
        });
        await browserRun(path, data, credentials);
        await request('/end', {});
        compress(path);
      }
} else if (command === 'probe') {
  await functionalProbe();
} else if (command === 'validate') {
  console.log(
    JSON.stringify({
      fixtureHash: hashFile(resolve(directory, 'fixtures/replay.json')),
      k6: execFileSync(k6, ['version'], { encoding: 'utf8' }).trim(),
      health: (await fetch(`${origin}/api/health`)).status,
      state: await request('/state'),
    }),
  );
} else throw new Error('Select accounts, validate, api, micro, or ui.');
