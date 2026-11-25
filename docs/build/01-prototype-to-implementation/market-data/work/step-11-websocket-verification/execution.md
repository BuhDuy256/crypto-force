# Kết quả chốt cách kiểm chứng WebSocket trước khi build

Đọc file này để biết trạng thái môi trường đã kiểm, kết quả đọc nguyên văn OWASP ASVS 5.0 V4.4, kết quả duyệt 18 mục đề xuất, kết quả chạy bộ test tự động trước build và nội dung bàn giao sang Bước 12.

## Task 1 và Task 2: Đọc nguyên văn ASVS V4.4, thiết kế kiểm chứng và duyệt seam

Ngày thực hiện: 2026-11-23. Source và test basis được đọc tại commit `e819628` (đã chốt thiết kế Bước 10). Product owner đã duyệt toàn bộ **18 mục đề xuất** (`S1`–`S7` và `W1`–`W11`) ngày 2026-11-23, chọn **Node.js `ws` load driver độc lập** cho công cụ phát tải WebSocket (`W1`, giữ `k6` cho WebSocket ở trạng thái `Proposed` trong Test Strategy [[3]](#ref-3)) và **tách 2 commit liên tiếp** cho Phép so sánh B (`W2`).

### Môi trường và hiện trạng đã kiểm tra

Chỉ kiểm tra sự hiện diện của biến trong `.env`, không in hoặc lưu giá trị bí mật [[4, LL-006]](#ref-4):

| Hạng mục kiểm tra | Nguồn kiểm | Kết quả |
| --- | --- | --- |
| Runtime Node.js và pnpm | `node --version`, `pnpm --version` | Node `v22.23.5`, pnpm `9.15.9` |
| Thư viện WebSocket đã khóa | `pnpm-lock.yaml` | `ws@8.23.0` và `@types/ws@8.18.2` đã khóa |
| Công cụ `k6` | `Get-Command k6` trong shell hiện tại | Không tìm thấy `k6` trên PATH của shell hiện tại |
| Biến `.env` hiện có | Đọc khóa trong `.env` | `DATABASE_URL`, `POSTGRES_DB`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`: có giá trị. `DATABASE_POOL_MAX`, `WS_MAX_CONNECTIONS_PER_USER`, `BINANCE_WS_URL`: chưa đặt |
| OWASP ASVS 5.0 V4.4 | Tải trực tiếp nguyên văn `https://raw.githubusercontent.com/OWASP/ASVS/master/5.0/en/0x13-V4-API-and-Web-Service.md` | Đã đọc nguyên văn: V4.4.1 (L1 — WSS bắt buộc), V4.4.2 (L2 — kiểm `Origin` lúc HTTP upgrade), V4.4.3–4.4.4 (L2 — không áp dụng do quyết định xác thực cookie phiên ADR-010); V4.1.3 (L2 — không cho client ghi đè `X-Forwarded-*` ở lớp proxy). Đã gỡ các ghi chú "chưa đọc file nguyên văn" trên `websocket-requirement-gap-analysis.md`, `UCs/market-data.md`, `23-security.md` và `30-decisions.md` |
| PostgreSQL `_test` | Chạy Vitest API thực tế trên `_test` DB | PostgreSQL sẵn sàng; global setup tạo/migrate `_test` thành công |

### Chỉ mục 18 mục đã duyệt (`Confirmed`, 2026-11-23)

Chi tiết nguồn, lý do và tác động nằm trong tài liệu sở hữu [Kiểm chứng WebSocket cập nhật trực tiếp](../../../../../testing/test-scopes/TS-002-market-data/websocket-verification.md) [[2]](#ref-2) [[4, LL-004]](#ref-4):

| Nhóm | Phạm vi và nơi định nghĩa chi tiết | Trạng thái |
| --- | --- | --- |
| Nhóm A — 7 Public interfaces và seams (`S1`–`S7`) | [Public interfaces và seams đã duyệt](../../../../../testing/test-scopes/TS-002-market-data/websocket-verification.md#public-interfaces-và-seams-đã-duyệt) | Confirmed (2026-11-23) |
| Nhóm B — 11 Tham số công cụ, so sánh, workload và cổng biên (`W1`–`W11`) | [Tham số công cụ, so sánh, workload và cổng biên đã duyệt](../../../../../testing/test-scopes/TS-002-market-data/websocket-verification.md#tham-số-công-cụ-so-sánh-workload-và-cổng-biên-đã-duyệt) | Confirmed (2026-11-23) |

### Xử lý review độc lập Task 1 (`review-change`)

Subagent review độc lập cho Task 1 báo 4 finding high, 8 finding medium và 2 finding low. Toàn bộ 14 finding đã được xử lý trước khi chốt Task 2: tách chuyển trạng thái `status(unavailable)` (giữ socket Web↔API mở theo lỗi nguồn Binance MK-130) khỏi đóng socket `1001`/`1006`/`4008`; cập nhật đồng bộ kết quả đọc nguyên văn ASVS V4.4 và đóng `OQ-087` trên toàn bộ tài liệu liên quan; bổ sung `W9`–`W11`; bỏ export không có caller production khỏi `S1`, đổi `W2` sang 2 commit, bỏ tham số ghi đè ngưỡng sản phẩm khỏi `S3`/`S4`/`S6`; thống nhất nguồn gốc `W6`, bổ sung trích dẫn kiến trúc, mở rộng kết nối lại thủ công (MK-102) cho trạng thái chờ backoff, sửa toàn bộ ID đứng một mình, cấm cộng gộp percentile trong So sánh B, sửa hiệu chuẩn clock-exchange ở `W7`, làm rõ điều kiện chạy lại `2709f3b` và topology 1 combined upstream mỗi client ở So sánh B, bổ sung summary sai cho `MK-128` và biên `>= 120000 ms` cho `MK-122`.

## Task 3: Bộ test tự động trước build và trạng thái red

Ngày thực hiện: 2026-11-23. Chỉ thêm test, fixture đóng băng và harness E2E; không sửa code production hoặc expected của test regression cũ.

### Các lát red bàn giao cho Bước 12

| Lát | File test và harness | Test red tiêu biểu và expected | Kết quả thực chạy trước build |
| --- | --- | --- | --- |
| 1. Shared contract & env | `packages/shared/src/schemas/market-data-ws.schema.test.ts` | `MarketSummary.dataTime` (5 case), 3 biến env `DATABASE_POOL_MAX`/`WS_MAX_CONNECTIONS_PER_USER`/`BINANCE_WS_URL` (9 case), `wsClientMessageSchema` (8 case) và `wsServerMessageSchema` (17 case) | **39/39 fail:** 14 case summary/env tới assertion và fail do contract hiện chưa có trường mới; 25 case khung WS fail tại `TypeError: Cannot read properties of undefined (reading 'safeParse')` vì export chưa tồn tại. **Regression shared:** `116/116 pass` (không gộp vào số test mới) |
| 2. Cache invalidation | `apps/api/test/market-data/cache-invalidation.test.ts` | `invalidateCandles(pair, timeframe)` xóa đúng mọi `limit` của khóa vừa đóng nến, giữ nguyên khóa khác, summary và cache lỗi nguồn ADR-008 (2 case) | **2/2 fail** tại `TypeError: cache.invalidateCandles is not a function` (chưa tới assertion sau bước gọi phương thức). **Regression cache API:** `14/14 pass` (`cached-provider.test.ts` 8 + `polling-cache.test.ts` 6) |
| 3. Binance WS adapter | `apps/api/test/market-data/stream-provider.test.ts` | 4 case qua local `WebSocketServer`: mở lười và chuẩn hóa kline/ticker + bỏ frame hỏng không lộ sentinel, phát `unavailable` → reconnect → `available + resyncRequired`, micro-batch ≤ 5 lệnh/s, xoay chủ động 23h50m | Chưa tới assertion: `Cannot find module '../../src/providers/market-data/binance-stream.provider'` |
| 4. Shared subscription hub | `apps/api/test/market-data/stream-hub.test.ts` | 5 case qua fake `MarketDataStreamProvider`: 10 client chỉ mở 1 upstream stream và nhận JSON tuần tự hóa giống hệt, giữ topic 4999/5000 ms và hủy timer khi có subscriber mới, gọi `onCandleClosed` chỉ khi `isClosed: true`, loại bỏ nến/summary sai trước fan-out, log tổng hợp 10s và truyền `status` | Chưa tới assertion: `Cannot find module '../../src/services/market-data-stream.service'` |
| 5. WS Gateway & Session batch | `apps/api/test/market-data/ws-gateway.test.ts` | 9 case tích hợp qua HTTP server, Better Auth và PostgreSQL `_test` thật: thứ tự kiểm `Origin` (403 không cookie) → `WSS` production (403 không cookie) → phiên (401), giới hạn 4 tab (`4429` + `CONNECTION_LIMIT_EXCEEDED`), 10 kênh + 4 KB (`1009`) + 20 msg/10s (`4429`), `heartbeat` chu kỳ 5s (fake timer), `SLOW_CONSUMER` `4008` khi `bufferedAmount > 64 KB`, 3 case tách riêng thu hồi phiên qua sign-out / reset password / xóa trực tiếp DB (`4401` ≤ 5s, fake timer 3s cho kiểm tra theo lô), shutdown (`1001`) | Chưa tới assertion: `Cannot find module '../../src/api/ws/market-data.ws'` (cùng `session.repository.ts`, `ws-session.service.ts`) |
| 6. Web pure merge util | `apps/web/app/utils/market-candle-merge.test.ts` | 8 case thuần phủ bảng quyết định `M1`–`M7` (sai pair/cũ `dataTime`, nến cũ/trùng đã đóng, cập nhật tại chỗ, nối nến giữ 500+19 và giữ gap thật, thiếu bản chốt biên chuyển giao) và biên bộ đệm 49/50/51 sự kiện | Chưa tới assertion: `Cannot find module './market-candle-merge'`. **Regression Web util:** `market-chart.test.ts` `2/2 pass` |
| 7. E2E WebSocket live & recovery | `apps/api/test/market-data/ws-reference-dataset.json`, `apps/api/test/support/market-data-ws-server.ts`, `apps/web/playwright.market-data-ws.config.ts`, `apps/web/e2e/market-data/websocket-live.spec.ts` | 6 kịch bản E2E qua API thật (cổng 3017/control 3018/upstream WS 3019/Web 5186, DB `_market_data_ws_test`, tắt MSW): live nến/summary/đóng nến 0 REST thêm, đổi timeframe/pair không rơi cập nhật, tạm dừng/tiếp tục không báo mất kết nối, đang đồng bộ/backfill lỗi từng phần/nguồn không khả dụng không lộ sentinel, 2 tab độc lập + tab 5 bị chặn `4429` + sign-out đóng mọi tab, bỏ tick sai + giữ focus + không hiện ms độ trễ | Playwright `--list` thu thập **6 test**. Chạy thực tế exit 1 ở API startup: `ERR_MODULE_NOT_FOUND` tại `apps/api/src/api/ws/market-data.ws`. Chưa mở trình duyệt |

### Lệnh đã chạy và kết quả kiểm tra

Do Windows sandbox chặn ghi `.vite-temp` và `.vitest-secret-token` trong `node_modules/` (`EPERM`), các lượt chạy Vitest, Playwright, `web typecheck`, Prettier `--write` cho `.ts` và `graphify update .` được thực thi ngoài sandbox; các kiểm tra đọc tĩnh (`eslint`, `check:docs`, `prettier --check`, `shared/api typecheck`) chạy trong sandbox:

| Lệnh từ repo root | Kết quả |
| --- | --- |
| `pnpm --filter @crypto-force/shared exec vitest run src/schemas/market-data-ws.schema.test.ts` | Exit 1 — 39/39 fail có chủ đích (14 assertion fail, 25 `TypeError` thiếu export) |
| `pnpm --filter @crypto-force/shared exec vitest run src/schemas/market-data.schema.test.ts src/schemas/market-data-rest.schema.test.ts src/schemas/market-summary-input.schema.test.ts` | Pass — 116/116 regression pass |
| `pnpm --filter @crypto-force/api exec vitest run test/market-data/cache-invalidation.test.ts test/market-data/stream-provider.test.ts test/market-data/stream-hub.test.ts test/market-data/ws-gateway.test.ts` | Exit 1 — 2/2 fail tại `cache.invalidateCandles is not a function`; 3 suite còn lại fail import do module chưa build |
| `pnpm --filter @crypto-force/api exec vitest run test/market-data/cached-provider.test.ts test/market-data/polling-cache.test.ts` | Pass — `14/14` regression pass (`8` + `6`) |
| `pnpm --filter @crypto-force/web exec vitest run app/utils/market-candle-merge.test.ts` | Exit 1 — fail import `./market-candle-merge` |
| `pnpm --filter @crypto-force/web exec vitest run app/utils/market-chart.test.ts` | Pass — 2/2 regression pass |
| `pnpm --filter @crypto-force/web exec playwright test --config playwright.market-data-ws.config.ts --list` | Pass — thu thập 6 test trong 1 file |
| `pnpm --filter @crypto-force/web exec playwright test --config playwright.market-data-ws.config.ts --workers=1` | Exit 1 — API startup `ERR_MODULE_NOT_FOUND` tại `api/ws/market-data.ws` |
| `pnpm exec eslint` cho 4 file có import đã tồn tại (`market-data-ws.schema.test.ts`, `cache-invalidation.test.ts`, `playwright.market-data-ws.config.ts`, `websocket-live.spec.ts`) | Pass — 0 lỗi, 0 cảnh báo. 5 file còn lại chỉ báo `no-unsafe-*` / unresolved do 6 module production chưa tồn tại |
| `pnpm --filter @crypto-force/shared typecheck` | Pass — 0 lỗi |
| `pnpm --filter @crypto-force/web typecheck` | Red có chủ đích: chỉ 1 lỗi `TS2307` tại `market-candle-merge.test.ts` do thiếu `./market-candle-merge`; 0 lỗi ở E2E và config |
| `pnpm --filter @crypto-force/api typecheck` | Red có chủ đích: chỉ lỗi thiếu 5 module WS production và các type stream chưa xuất trong `market-data-provider.ts` |
| `pnpm exec prettier --check` cho toàn bộ 10 file code/JSON mới và 9 file Markdown | Pass sau khi chạy `--write` cho 7 file `.ts` mới |
| `pnpm check:docs` và `git diff --check` | Pass (`check-docs: docs OK`, 0 lỗi diff) |
| `graphify update .` | Pass — cập nhật AST graph thành công (không dùng `graphify label`) |

Không chạy `pnpm check`, benchmark, smoke Binance thật hoặc mutation. Bước 11 chỉ hoàn tất thiết kế kiểm chứng và test trước build; chưa hoàn tất chu trình TDD green, kiểm độ nhạy fake/mutation hay đo hiệu năng.

## Task 4: Bàn giao Bước 12

### Thứ tự triển khai red → green theo từng lát

Ở mỗi lát, Bước 12 chạy lại test red (xác nhận test đã tới assertion sau khi dựng module), triển khai tối thiểu để green, chạy scoped ESLint + typecheck workspace, rồi chạy mutation và kiểm độ nhạy fake trước khi sang lát kế tiếp:

1. **Lát 1 — Shared contract & env (`packages/shared`):** bổ sung `dataTime` cho `marketSummarySchema`, 3 biến môi trường cho `apiEnvSchema`, xuất `wsClientMessageSchema` và `wsServerMessageSchema` (và cập nhật `binance.provider.ts` trả `dataTime` cho `getSummary` để regression REST không vỡ). Gate: `market-data-ws.schema.test.ts` 39/39 green + `116/116` regression green + `pnpm check:exports` sạch.
2. **Lát 2 — Cache invalidation (`apps/api`):** thêm `invalidateCandles(pair, timeframe)` cho `createCachedMarketDataProvider`. Gate: `cache-invalidation.test.ts` + `cached-provider.test.ts` + `polling-cache.test.ts` green.
3. **Lát 3 — Stream Provider & Binance WS Adapter (`apps/api`):** bổ sung `MarketDataStreamProvider` trong `market-data-provider.ts`, triển khai `binance-stream.provider.ts`. Gate: `stream-provider.test.ts` 4/4 green.
4. **Lát 4 — Shared Subscription Hub (`apps/api`):** triển khai `market-data-stream.service.ts` (và giữ riêng **commit B1** với 1 combined upstream riêng mỗi client trước khi áp dụng shared ref-count ở **commit B2** theo quyết định `W2` đã duyệt). Gate: `stream-hub.test.ts` 5/5 green.
5. **Lát 5 — Session Repository, WsSessionService, WS Gateway, Auth hook, Pool & ESLint rule (`apps/api`):** mở rộng `noDatabaseAccess` cho `apps/api/src/api/ws/**/*.ts`, cấu hình `DATABASE_POOL_MAX`, triển khai `session.repository.ts`, `ws-session.service.ts`, `api/ws/market-data.ws.ts`, nối `onSessionRevoked` trong `createAuth`, cập nhật graceful shutdown `index.ts` (đóng WS `1001` trước `server.close`). Gate: `ws-gateway.test.ts` 9/9 green (gồm kiểm `heartbeat` 5s, `SLOW_CONSUMER` `4008` > 64 KB và 3 case thu hồi phiên tách riêng).
6. **Lát 6 — Web pure merge util & Realtime WebSocket UI (`apps/web`):** triển khai `apps/web/app/utils/market-candle-merge.ts`, `apps/web/app/api/market-data-ws.ts`, cập nhật `useRealtimeWorkspace`, `useMarketData` và UI 7 trạng thái. Gate: `market-candle-merge.test.ts` 8/8 green + `websocket-live.spec.ts` 6/6 green + mở rộng case đối soát đầy đủ `ws-reference-dataset.json` (30s/120s/300s ngắt mạng, dữ liệu cũ 15s/đặt lại 30s, trần tự thử 120s, giữ viewport/crosshair và live-region đủ 7 trạng thái).
7. **Lát 7 — Mutation gate, Chẩn đoán 3 nguyên nhân, Smoke Binance WS và Benchmark So sánh A & B:**
   - Chạy toàn bộ danh sách mutation và kiểm độ nhạy fake trong [Kiểm chứng WebSocket](../../../../../testing/test-scopes/TS-002-market-data/websocket-verification.md#danh-sách-mutation-và-phép-kiểm-fake-dự-kiến) sau khi test gốc green; khôi phục và xác nhận green lại sau mỗi lần thử.
   - Chạy 3 kịch bản chẩn đoán (upstream, backend, client chậm) và lưu `diagnosis-timeline.json`.
   - Chạy lượt smoke Binance WS thật 90 giây (`W8`).
   - Chạy **Phép so sánh A** (chạy lại commit `2709f3b` cùng runner `paintAt` `W10` đối chiếu với WebSocket trên `polling-config.json`) và **Phép so sánh B** (commit B1 Trước vs commit B2 Sau bằng Node `ws` load driver độc lập `W1` kèm 1 Chromium probe, kiểm ngưỡng bão hòa `W9` và hiệu chuẩn clock-exchange `W7`).

### Review cuối Task 4

Subagent `review-change` độc lập kiểm lại toàn bộ 10 file test/fixture/harness mới và các tài liệu cập nhật, báo 7 finding high, 4 finding medium và 5 finding low (không có finding ở Exports/Boundaries). Toàn bộ 16 finding đã được xử lý và kiểm chứng lại:

- **Sửa test rỗng / thiếu assertion và đồng hồ thật:** thêm 2 case `heartbeat` 5s và `SLOW_CONSUMER` `4008` (> 64 KB) vào `ws-gateway.test.ts`, tách riêng 3 case thu hồi phiên và dùng `vi.useFakeTimers` cho chu kỳ kiểm lô DB 3s (tổng 9 case); bỏ cookie ở case kiểm `Origin`/`WSS` để chứng minh thứ tự `403` trước `401`; thêm fake timers + assertion backoff + `socketIndex >= 1` và keepalive ping 30s trong `stream-provider.test.ts`; thêm case sai `timeframe` ở `M1` và assertion `close`/`dataTime` cho biên đệm 49/50 ở `market-candle-merge.test.ts`.
- **Sửa E2E harness và khớp tên test với assertion:** nối `ws-reference-dataset.json` vào `market-data-ws-server.ts`, neo nến cuối mọi timeframe về `isClosed: false`, thêm bộ đếm ingress `apiRestRequests` và `activeClientWs`, reset đầy đủ state/cache ở `/__ws/reset`, đặt gate `holdBackfill` trước `createApp` và hỗ trợ `clearCache`; trên `websocket-live.spec.ts` kiểm `apiRestRequests` thay vì chỉ `restLedger`, phát thêm tick hợp lệ sau tick stale/invalid để loại pass rỗng, kiểm `activeClientWs === 0` + REST `1m` lúc tạm dừng + đồng bộ ≤ 1000 ms khi tiếp tục, kiểm chặt nhãn `Syncing`/`Đang đồng bộ` (không phải `Live`) khi giữ backfill, thêm kiểm `MutationObserver` live-region ở test 6 và sửa tiêu đề khớp đúng assertion.
- **Sửa diễn đạt tài liệu:** gỡ toàn bộ cụm từ "đề xuất" / "khuyến nghị" / thì tương lai còn sót trong `websocket-verification.md` sau khi product owner đã duyệt 18 mục, cập nhật rõ nơi sinh SHA-256 `manifest.json` ở Bước 12, và đồng bộ `plan.md` cùng `execution.md` theo đúng 9 case của `ws-gateway.test.ts`.

## References

1. <a id="ref-1"></a>[Kế hoạch chốt cách kiểm chứng WebSocket trước khi build](plan.md)
2. <a id="ref-2"></a>[Kiểm chứng WebSocket cập nhật trực tiếp](../../../../../testing/test-scopes/TS-002-market-data/websocket-verification.md)
3. <a id="ref-3"></a>[Test Strategy](../../../../../testing/test-strategy.md)
4. <a id="ref-4"></a>[Lessons Learned](../../../../../../LESSONS.md)
