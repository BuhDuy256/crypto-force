// Tracks the first request for each Market Data URL within one browser client.
export function pollingTransfers() {
  const initialKeys = new Set();
  const requests = new Map();
  return {
    start(id, url) {
      if (!url.includes('/api/market-data/')) return;
      const phase = initialKeys.has(url) ? 'polling' : 'initial';
      initialKeys.add(url);
      requests.set(id, { phase, url });
    },
    finish(id) {
      const request = requests.get(id);
      requests.delete(id);
      return request;
    },
  };
}
