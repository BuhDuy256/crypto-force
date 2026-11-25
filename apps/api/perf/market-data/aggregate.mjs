import { appendFileSync, createReadStream, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { resolve } from 'node:path';
import { gunzipSync, createGunzip } from 'node:zlib';

export function percentiles(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return Object.fromEntries(
    [
      ['p50', 0.5],
      ['p95', 0.95],
      ['p99', 0.99],
    ].map(([name, quantile]) => [
      name,
      sorted.length ? sorted[Math.ceil(quantile * sorted.length) - 1] : null,
    ]),
  );
}
export async function aggregate(directory) {
  const manifest = JSON.parse(readFileSync(resolve(directory, 'manifest.json'), 'utf8'));
  const reconciliationPath = resolve(directory, 'reconciliation.jsonl');
  const reconciliation = (
    existsSync(reconciliationPath)
      ? readFileSync(reconciliationPath, 'utf8')
      : gunzipSync(readFileSync(`${reconciliationPath}.gz`)).toString('utf8')
  )
    .trim()
    .split('\n')
    .filter(Boolean)
    .map(JSON.parse);
  const byId = new Map(reconciliation.map((row) => [row.id, row]));
  const groups = {};
  let rawCount = 0;
  let unmatched = 0;
  let measured = 0;
  let failed = 0;
  const histogram = {};
  const timeline = {};
  writeFileSync(resolve(directory, 'samples.jsonl'), '');
  writeFileSync(resolve(directory, 'errors.jsonl'), '');
  const rawPath = resolve(directory, 'raw-k6.jsonl');
  for await (const line of createInterface({
    input: existsSync(rawPath)
      ? createReadStream(rawPath)
      : createReadStream(`${rawPath}.gz`).pipe(createGunzip()),
    crlfDelay: Infinity,
  })) {
    const sample = JSON.parse(line);
    if (sample.type !== 'Point' || sample.metric !== 'market_latency') continue;
    rawCount++;
    if (sample.data.tags.phase !== 'steady') continue;
    const tags = sample.data.tags;
    measured++;
    if (tags.outcome !== 'success') failed++;
    const requestKey = `${tags.pair}:${tags.timeframe || tags.endpoint}`;
    histogram[requestKey] = (histogram[requestKey] || 0) + 1;
    const second = Math.floor(Number(tags.batchStartUtc) / 1000);
    timeline[second] = (timeline[second] || 0) + 1;
    const result = byId.get(tags.id);
    if (!result) unmatched++;
    const normalized = {
      id: tags.id,
      batchStartUtc: tags.batchStartUtc,
      durationMs: sample.data.value,
      status: tags.status,
      pair: tags.pair,
      timeframe: tags.timeframe,
      endpoint: tags.endpoint,
      phase: tags.phase,
      cacheState: result?.cacheState || 'unknown',
      outcome: tags.outcome,
      valid: result?.valid ?? false,
    };
    appendFileSync(resolve(directory, 'samples.jsonl'), `${JSON.stringify(normalized)}\n`);
    if (tags.outcome !== 'success' || !result?.valid)
      appendFileSync(resolve(directory, 'errors.jsonl'), `${JSON.stringify(normalized)}\n`);
    const key = `${tags.endpoint}:${result?.cacheState || 'unknown'}:${tags.outcome}`;
    (groups[key] ??= []).push(sample.data.value);
  }
  const summary = {
    run: manifest.run,
    environment: 'local, replay 50 ms',
    rawCount,
    measured,
    failed,
    errorRate: measured ? failed / measured : null,
    requestsPerSecond: measured / 180,
    burstsPerSecond: measured / 5 / 180,
    histogram,
    timeline,
    unmatched,
    reconciliation: {
      responses: reconciliation.length,
      invalid: reconciliation.filter((row) => !row.valid).length,
    },
    groups: Object.fromEntries(
      Object.entries(groups).map(([key, values]) => [
        key,
        { count: values.length, ...percentiles(values) },
      ]),
    ),
    capacity: 'Inconclusive: no approved HTTP latency, error rate, or capacity threshold.',
  };
  writeFileSync(resolve(directory, 'summary.json'), JSON.stringify(summary, null, 2));
  writeFileSync(
    resolve(directory, 'reconciliation.json'),
    JSON.stringify(summary.reconciliation, null, 2),
  );
  return summary;
}
if (process.argv[1]?.endsWith('aggregate.mjs') && process.argv[2])
  console.log(JSON.stringify(await aggregate(resolve(process.argv[2]))));
