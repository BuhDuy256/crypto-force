// Uses a monotonic source clock. Each version changes the open candle close and base volume.
// Input choices: phase 1379 ms and period 7000 ms avoid alignment with the 5000 ms client interval.
const intervals = {
  '1m': 60000,
  '5m': 300000,
  '15m': 900000,
  '1h': 3600000,
  '4h': 14400000,
  '1d': 86400000,
};
export function pollingReplay(fixture, { now = () => performance.now(), wallNow = Date.now } = {}) {
  let started = now();
  let wallStarted = wallNow();
  let failure = false;
  const phaseMs = 1379;
  const periodMs = 7000;
  function version() {
    return Math.max(0, 1 + Math.floor((now() - started - phaseMs) / periodMs));
  }
  function read(key) {
    const entry = fixture.keys[key];
    if (!entry) return undefined;
    const current = version();
    if (key.startsWith('summary:'))
      return {
        version: current,
        raw: { ...entry.raw, lastPrice: String(20000 + current) },
      };
    const step = intervals[key.split(':')[1]];
    const tail = Math.floor((wallStarted + now() - started) / step) * step;
    const shift = tail - entry.raw.at(-1)[0];
    const raw = entry.raw.map((row) => [
      row[0] + shift,
      ...row.slice(1, 6),
      row[6] + shift,
      ...row.slice(7),
    ]);
    raw[518] = [
      tail,
      '19999',
      String(20001 + current),
      '19998',
      String(20000 + current),
      String(519 + current),
      tail + step - 1,
      '0',
      1,
      '0',
      '0',
      '0',
    ];
    return { version: current, raw };
  }
  return {
    read,
    get failure() {
      return failure;
    },
    begin(failed, reset) {
      if (reset) {
        started = now();
        wallStarted = wallNow();
      }
      failure = failed;
    },
    state() {
      return {
        started,
        wallStarted,
        now: now(),
        phaseMs,
        periodMs,
        failure,
        version: version(),
        timeOrigin: performance.timeOrigin,
      };
    },
    validate(key, body, status) {
      if (status === 503) return failure && body?.error?.code === 'MARKET_DATA_UNAVAILABLE';
      if (status !== 200) return false;
      if (key.startsWith('summary:'))
        return (
          body.pair === key.slice(8) &&
          body.change24hPercent === fixture.keys[key].expected.change24hPercent &&
          Number.isInteger(body.lastPrice - 20000) &&
          body.lastPrice >= 20000 &&
          body.lastPrice <= 20000 + version()
        );
      const points = body?.candles;
      if (!Array.isArray(points) || points.length !== 519 || body.warmupCount !== 19) return false;
      const [pair, timeframe] = key.split(':');
      if (
        body.pair !== pair ||
        body.timeframe !== timeframe ||
        !Number.isSafeInteger(body.dataTime)
      )
        return false;
      const last = points[518];
      if (
        last.isClosed !== false ||
        body.dataTime < last.openTime ||
        body.dataTime >= last.openTime + intervals[timeframe]
      )
        return false;
      const current = last.close - 20000;
      if (
        !Number.isInteger(current) ||
        current < 0 ||
        current > version() ||
        last.open !== 19999 ||
        last.high !== 20001 + current ||
        last.low !== 19998 ||
        last.volume !== 519 + current
      )
        return false;
      const expected = fixture.keys[key].candles;
      const step = intervals[key.split(':')[1]];
      return points.slice(0, 518).every((point, index) => {
        const candle = expected[index];
        return (
          point.open === candle.open &&
          point.high === candle.high &&
          point.low === candle.low &&
          point.close === candle.close &&
          point.volume === candle.volume &&
          point.isClosed === true &&
          last.openTime - point.openTime === (518 - index) * step
        );
      });
    },
  };
}
