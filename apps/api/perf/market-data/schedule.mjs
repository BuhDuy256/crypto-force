export function burstKeys(offset, diverse) {
  const pair = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'][diverse ? offset % 3 : 0];
  const all = ['1m', '5m', '15m', '1h', '4h', '1d'];
  const frames = diverse
    ? Array.from({ length: 4 }, (_, index) => all[(Math.floor(offset / 3) + index) % 6])
    : ['5m', '15m', '1h', '4h'];
  return { pair, frames };
}
