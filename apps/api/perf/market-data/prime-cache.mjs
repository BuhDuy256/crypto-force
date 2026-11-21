// The guard is the approved think time minus TTL: 6000 - 5000 = 1000 ms.
// It leaves at least that margin before the measured hit starts.
export async function primeCache({ prime, now, pause, ttlMs, thinkMs, record }) {
  const maxAge = ttlMs - (thinkMs - ttlMs);
  let snapshot = await prime();
  if (now() - snapshot.dataTime >= maxAge) {
    record({
      phase: 'setup',
      reason: 'prime-near-expiry',
      snapshotAgeMs: now() - snapshot.dataTime,
    });
    await pause(thinkMs);
    snapshot = await prime();
  }
  if (now() - snapshot.dataTime >= maxAge)
    throw new Error('The cache prime is too old for the measured hit.');
  return snapshot;
}
