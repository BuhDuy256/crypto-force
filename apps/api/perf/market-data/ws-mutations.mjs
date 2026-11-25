import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../../../', import.meta.url));
const outDir = resolve(root, 'docs/testing/evidence/market-data/ws-task-12');
mkdirSync(outDir, { recursive: true });

const cases = [
  {
    id: 'shared-subscriptions-per-client',
    group: 'Shared subscriptions',
    file: 'apps/api/src/services/market-data-stream.service.ts',
    mutate: (text) =>
      text.replace(
        'topic.subscribers.set(clientId, sink);',
        'topic.subscribers.set(clientId, sink);\n        streamProvider.subscribe(channel);',
      ),
    filter: '@crypto-force/api',
    testFile: 'test/market-data/stream-hub.test.ts',
  },
  {
    id: 'skip-5s-grace-delay',
    group: 'Giữ topic 5 giây',
    file: 'apps/api/src/services/market-data-stream.service.ts',
    mutate: (text) =>
      text.replace(
        'const IDLE_UNSUBSCRIBE_DELAY_MS = 5_000;',
        'const IDLE_UNSUBSCRIBE_DELAY_MS = 0;',
      ),
    filter: '@crypto-force/api',
    testFile: 'test/market-data/stream-hub.test.ts',
  },
  {
    id: 'omit-onCandleClosed',
    group: 'Vô hiệu hóa cache REST (Hub)',
    file: 'apps/api/src/services/market-data-stream.service.ts',
    mutate: (text) =>
      text.replace('onCandleClosed(event.pair, event.timeframe);', '// omitted onCandleClosed'),
    filter: '@crypto-force/api',
    testFile: 'test/market-data/stream-hub.test.ts',
  },
  {
    id: 'clear-wrong-timeframe-cache',
    group: 'Vô hiệu hóa cache REST (Cache decorator)',
    file: 'apps/api/src/providers/market-data/cached-market-data.provider.ts',
    mutate: (text) =>
      text.replace('if (key.startsWith(prefix)) {', "if (key.startsWith('candles:')) {"),
    filter: '@crypto-force/api',
    testFile: 'test/market-data/cache-invalidation.test.ts',
  },
  {
    id: 'merge-duplicate-openTime',
    group: 'Hợp nhất và biên chuyển giao (trùng openTime)',
    file: 'apps/web/app/utils/market-candle-merge.ts',
    mutate: (text) =>
      text.replace(
        'if (event.candle.openTime === last.openTime) {',
        'if (false && event.candle.openTime === last.openTime) {',
      ),
    filter: '@crypto-force/web',
    testFile: 'app/utils/market-candle-merge.test.ts',
  },
  {
    id: 'merge-accept-older-dataTime',
    group: 'Hợp nhất và biên chuyển giao (lùi dataTime)',
    file: 'apps/web/app/utils/market-candle-merge.ts',
    mutate: (text) => text.replace('if (event.dataTime < history.dataTime) {', 'if (false) {'),
    filter: '@crypto-force/web',
    testFile: 'app/utils/market-candle-merge.test.ts',
  },
  {
    id: 'merge-skip-missing-closed-boundary',
    group: 'Hợp nhất và biên chuyển giao (thiếu bản chốt biên)',
    file: 'apps/web/app/utils/market-candle-merge.ts',
    mutate: (text) =>
      text.replace(
        "if (!last.isClosed) {\n    return { kind: 'resync-required', history, reason: 'missing-closed-boundary' };\n  }",
        '// skipped missing-closed-boundary check',
      ),
    filter: '@crypto-force/web',
    testFile: 'app/utils/market-candle-merge.test.ts',
  },
  {
    id: 'hub-forward-invalid-events',
    group: 'Dữ liệu sai định dạng',
    file: 'apps/api/src/services/market-data-stream.service.ts',
    mutate: (text) => text.replace('if (!parsed.success) {', 'if (false && !parsed.success) {'),
    filter: '@crypto-force/api',
    testFile: 'test/market-data/stream-hub.test.ts',
  },
  {
    id: 'gateway-bypass-origin-check',
    group: 'Bảo mật upgrade (Origin)',
    file: 'apps/api/src/api/ws/market-data.ws.ts',
    mutate: (text) =>
      text.replace(
        'if (!origin || origin !== expectedOrigin) {',
        'if (false && (!origin || origin !== expectedOrigin)) {',
      ),
    filter: '@crypto-force/api',
    testFile: 'test/market-data/ws-gateway.test.ts',
  },
  {
    id: 'gateway-skip-revocation-hook',
    group: 'Cưỡng chế thu hồi phiên (hook)',
    file: 'apps/api/src/configs/auth.ts',
    mutate: (text) =>
      text.replace('onSessionRevoked?.(deleted.id);', '// skipped onSessionRevoked'),
    filter: '@crypto-force/api',
    testFile: 'test/market-data/ws-gateway.test.ts',
  },
  {
    id: 'gateway-skip-batch-db-check',
    group: 'Cưỡng chế thu hồi phiên (kiểm theo lô DB 3s)',
    file: 'apps/api/src/api/ws/market-data.ws.ts',
    mutate: (text) =>
      text.replace(
        'if (revoked.length > 0) {\n          revokeSessions(revoked);\n        }',
        '// skipped batch DB revokeSessions',
      ),
    filter: '@crypto-force/api',
    testFile: 'test/market-data/ws-gateway.test.ts',
  },
  {
    id: 'gateway-allow-tab-5',
    group: 'Giới hạn tài nguyên (4 tab)',
    file: 'apps/api/src/api/ws/market-data.ws.ts',
    mutate: (text) =>
      text.replace(
        'if ((existingForUser?.size ?? 0) >= maxConnectionsPerUser) {',
        'if ((existingForUser?.size ?? 0) >= maxConnectionsPerUser + 1) {',
      ),
    filter: '@crypto-force/api',
    testFile: 'test/market-data/ws-gateway.test.ts',
  },
  {
    id: 'gateway-skip-slow-consumer-4008',
    group: 'Giới hạn tài nguyên (backpressure 4008)',
    file: 'apps/api/src/api/ws/market-data.ws.ts',
    mutate: (text) =>
      text.replaceAll(
        'if (client.ws.bufferedAmount > MAX_BUFFERED_BYTES) {',
        'if (false && client.ws.bufferedAmount > MAX_BUFFERED_BYTES) {',
      ),
    filter: '@crypto-force/api',
    testFile: 'test/market-data/ws-gateway.test.ts',
  },
  {
    id: 'fake-driver-omit-reconnect-resync',
    group: 'Độ nhạy fake/replay (resyncRequired)',
    file: 'apps/api/src/providers/market-data/binance-stream.provider.ts',
    mutate: (text) =>
      text.replace(
        "statusHandler?.({ upstream: 'available', resyncRequired: isReconnect });",
        "statusHandler?.({ upstream: 'available', resyncRequired: false });",
      ),
    filter: '@crypto-force/api',
    testFile: 'test/market-data/stream-provider.test.ts',
  },
  {
    id: 'fake-replay-no-tick-emitted',
    group: 'Độ nhạy fake/replay (replay không phát tick)',
    file: 'apps/api/test/market-data/stream-hub.test.ts',
    mutate: (text) =>
      text.replace('candleHandler?.(event);', '// fault: replay does not emit candle tick'),
    filter: '@crypto-force/api',
    testFile: 'test/market-data/stream-hub.test.ts',
  },
  {
    id: 'fake-disconnect-noop',
    group: 'Độ nhạy fake/replay (ngắt kết nối không đóng socket)',
    file: 'apps/api/test/market-data/stream-provider.test.ts',
    mutate: (text) =>
      text.replace(
        "server.sockets[0]?.close(1011, 'upstream restart');",
        '// fault: disconnect command does not close socket',
      ),
    filter: '@crypto-force/api',
    testFile: 'test/market-data/stream-provider.test.ts',
  },
  {
    id: 'fake-buffered-amount-always-zero',
    group: 'Độ nhạy fake/replay (bufferedAmount luôn bằng 0)',
    file: 'apps/api/test/market-data/ws-gateway.test.ts',
    mutate: (text) => text.replace('rawSocket?.pause();', 'if (false) rawSocket?.pause();'),
    filter: '@crypto-force/api',
    testFile: 'test/market-data/ws-gateway.test.ts',
  },
  {
    id: 'ui-live-before-backfill-complete',
    group: 'Trạng thái đồng bộ UI (báo trực tiếp trước khi backfill xong)',
    file: 'apps/web/app/hooks/useRealtimeWorkspace.ts',
    mutate: (text) =>
      text.replaceAll("setConnectionState('syncing');", "setConnectionState('live');"),
    runner: 'playwright',
    grep: 'shows unavailable on upstream drop',
  },
  {
    id: 'ui-paused-reports-reconnecting',
    group: 'Trạng thái đồng bộ UI (báo mất kết nối khi đang tạm dừng)',
    file: 'apps/web/app/hooks/useRealtimeWorkspace.ts',
    mutate: (text) =>
      text.replaceAll("setConnectionState('paused');", "setConnectionState('reconnecting');"),
    runner: 'playwright',
    grep: 'closes WebSocket on pause',
  },
  {
    id: 'ui-stale-boundary-off-by-one',
    group: 'Trạng thái đồng bộ UI (biên 15s/30s/120s Spec 7)',
    file: 'apps/web/app/hooks/useRealtimeWorkspace.ts',
    mutate: (text) =>
      text.replace('const STALE_THRESHOLD_MS = 15_000;', 'const STALE_THRESHOLD_MS = 16_000;'),
    runner: 'playwright',
    grep: 'enforces 15s stale and 30s reset boundaries',
  },
  {
    id: 'ui-skip-reconnect-backfill',
    group: 'Trạng thái đồng bộ UI (bỏ qua REST backfill sau reconnect Spec 8)',
    file: 'apps/web/app/hooks/useRealtimeWorkspace.ts',
    mutate: (text) => text.replace('if (needsBackfill) {', 'if (false && needsBackfill) {'),
    runner: 'playwright',
    grep: 'isolates initial chart errors',
  },
];

function runTestCase(item) {
  if (item.runner === 'playwright') {
    return spawnSync(
      'pnpm',
      [
        '--filter',
        '@crypto-force/web',
        'exec',
        'playwright',
        'test',
        '--config',
        'playwright.market-data-ws.config.ts',
        '--workers=1',
        '-g',
        `"${item.grep}"`,
      ],
      { cwd: root, encoding: 'utf8', shell: true },
    );
  }
  return spawnSync('pnpm', ['--filter', item.filter, 'exec', 'vitest', 'run', item.testFile], {
    cwd: root,
    encoding: 'utf8',
    shell: true,
  });
}

const results = [];
for (const item of cases) {
  const fullPath = resolve(root, item.file);
  const original = readFileSync(fullPath, 'utf8');
  let killed;
  let assertionFailure;
  let exitCode;
  try {
    const mutated = item.mutate(original);
    assert.notEqual(mutated, original, `Mutation ${item.id} did not modify ${item.file}`);
    writeFileSync(fullPath, mutated, 'utf8');
    const res = runTestCase(item);
    exitCode = res.status ?? 1;
    const output = `${res.stdout ?? ''}\n${res.stderr ?? ''}`;
    assertionFailure = / FAIL |AssertionError|Test timed out|1 failed|Error: expect\(/i.test(
      output,
    );
    killed = exitCode !== 0 && assertionFailure;
    assert.equal(killed, true, `Mutation ${item.id} was not killed by an assertion failure.`);
  } finally {
    writeFileSync(fullPath, original, 'utf8');
  }
  const restored = runTestCase(item);
  assert.equal(restored.status, 0, `Restored test failed after mutation ${item.id}`);
  const record = {
    mutant: item.id,
    group: item.group,
    file: item.file,
    testFile: item.testFile ?? `e2e/market-data/websocket-live.spec.ts (-g "${item.grep}")`,
    exitCode,
    assertionFailure,
    restoredGreen: restored.status === 0,
  };
  results.push(record);
  console.log(JSON.stringify(record));
}

writeFileSync(resolve(outDir, 'mutations.json'), JSON.stringify(results, null, 2), 'utf8');
