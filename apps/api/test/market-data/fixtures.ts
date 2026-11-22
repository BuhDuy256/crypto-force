// Synthetic input for REST tests. Expected values are stored separately in closed-candles.json.
// This module does not calculate expected MA values or parse product schemas.
import { pino } from 'pino';

export function candles(count = 519, interval = 60000) {
  return Array.from({ length: count }, (_, i) => ({
    openTime: 1735689600000 + i * interval,
    open: 100 + i,
    high: 101 + i,
    low: 99 + i,
    close: 100 + i,
    volume: 10 + i,
    isClosed: i < count - 1,
  }));
}

export function klines(count = 519, interval = 60000) {
  return Array.from({ length: count }, (_, i) => [
    1735689600000 + i * interval,
    String(100 + i),
    String(101 + i),
    String(99 + i),
    String(100 + i),
    String(10 + i),
    1735689600000 + (i + 1) * interval - 1,
    '1262.5',
    7,
    '6.25',
    '631.25',
    '0',
  ]);
}

export function capturingLogger() {
  const records: unknown[] = [];
  const logger = pino(
    { level: 'trace' },
    {
      write(line: string) {
        records.push(JSON.parse(line));
      },
    },
  );
  return { logger, records };
}

export function deferred<T>() {
  let resolve: (value: T) => void = () => {
    throw new Error('The deferred promise is not ready.');
  };
  let reject: (error: Error) => void = () => {
    throw new Error('The deferred promise is not ready.');
  };
  const promise = new Promise<T>((onResolve, onReject) => {
    resolve = onResolve;
    reject = onReject;
  });
  return { promise, resolve, reject };
}
