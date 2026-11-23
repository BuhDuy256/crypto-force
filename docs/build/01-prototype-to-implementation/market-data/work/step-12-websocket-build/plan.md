# Kế hoạch build WebSocket và hoàn thiện bằng chứng

Đọc file này để biết thứ tự triển khai 7 lát red → green của Bước 12, mốc tách hai commit So sánh B (B1 và B2), danh sách kiểm chứng, mutation gate, chẩn đoán 3 nguyên nhân, smoke Binance WS thật và cập nhật tài liệu bằng chứng.

## Phạm vi và đầu vào đã chốt

- **Đầu vào:** bộ tài liệu yêu cầu (`MK-93`–`MK-142`, `QA-05`, `QA-06`, `QA-09`, `QA-14`–`QA-17`), kiến trúc (`ADR-009`–`ADR-011`) và kiểm chứng đã duyệt ngày 2026-11-23 tại commit `e79da6f` [[1]](#ref-1) [[2]](#ref-2).
- **Quyết định tách 2 commit (`W2`):**
  - **Commit B1 (Chế độ Trước — Per-client combined upstream):** triển khai đủ luồng WebSocket xuyên suốt (`packages/shared`, `apps/api`, `apps/web`) với `MarketDataStreamHub` mở 1 kết nối combined upstream riêng cho mỗi client và tuần tự hóa JSON riêng cho client đó, không thêm cờ benchmark vào code production.
  - **Commit B2 (Chế độ Sau — Shared subscriptions, ADR-009):** chuyển `MarketDataStreamHub` sang ref-count chia sẻ tối đa 1 stream upstream mỗi khóa, trễ hủy 5 giây, và tuần tự hóa JSON 1 lần cho mọi subscriber.
- **Ràng buộc:** không sửa `abstract-implementation-plan.md`, không thêm `eslint-disable` hay `@ts-expect-error`, không giữ nhánh chỉ phục vụ benchmark trong code production.

## Danh sách task

- [x] **Task 1 — Lát 1 & Lát 2 (Shared contract, env, `MarketSummary.dataTime` và Cache invalidation):** cập nhật `packages/shared` (`marketSummarySchema`, `apiEnvSchema`, `wsClientMessageSchema`, `wsServerMessageSchema`), cập nhật `binance.provider.ts` trả `dataTime` và các fixture summary REST cũ, thêm `invalidateCandles(pair, timeframe)` cho `createCachedMarketDataProvider`. Gate: shared WS 39/39 + regression 116/116 + API cache invalidation 2/2 + cache regression 14/14 green.
- [x] **Task 2 — Lát 3 & Lát 5 (Stream Provider, Session Repo/Service, WS Gateway, Auth hook, Pool & ESLint rule):** thêm `MarketDataStreamProvider` vào `market-data-provider.ts`, triển khai `binance-stream.provider.ts`, `session.repository.ts`, `ws-session.service.ts`, `api/ws/market-data.ws.ts`, mở rộng `createAuth` (`onSessionRevoked`), `createDatabase` (`max` từ `DATABASE_POOL_MAX`), graceful shutdown `1001` trong `index.ts` và mở rộng rule `noDatabaseAccess` cho `apps/api/src/api/ws/**/*.ts`. Gate: `stream-provider.test.ts` 4/4 green.
- [x] **Task 3 — Lát 4 (Commit B1) & Lát 6 (Web pure merge util và Realtime WebSocket UI):** triển khai `market-data-stream.service.ts` chế độ B1 (1 combined upstream/client), triển khai `apps/web/app/utils/market-candle-merge.ts`, `apps/web/app/api/market-data-ws.ts`, cập nhật `useRealtimeWorkspace`, `useMarketData` và UI 7 trạng thái kết nối/đồng bộ. Gate: `market-candle-merge.test.ts` 8/8 green, `ws-gateway.test.ts` 9/9 green, E2E `websocket-live.spec.ts` green, tạo **Commit B1**.
- [x] **Task 4 — Lát 4 (Commit B2 — Shared subscriptions ADR-009):** chuyển `market-data-stream.service.ts` và `index.ts` sang shared ref-count + trễ hủy 5s + single-serialize fan-out. Mở rộng E2E đối soát `ws-reference-dataset.json`, biên 15s/30s/120s, giữ viewport/crosshair và 7 trạng thái live-region. Gate: `stream-hub.test.ts` 5/5 + toàn bộ unit/integration/E2E Market Data green, tạo **Commit B2**.
- [ ] **Task 5 — Lát 7 (Mutation gate, Chẩn đoán 3 nguyên nhân, Smoke Binance WS 90s, Phép so sánh A và Phép so sánh B):**
  - Chạy toàn bộ danh sách mutation và phép kiểm độ nhạy fake trong `websocket-verification.md`; khôi phục và xác nhận green lại sau mỗi lần thử.
  - Chạy 3 kịch bản chẩn đoán (upstream, backend, client chậm) và lưu `diagnosis-timeline.json`.
  - Chạy lượt smoke Binance WS thật 90 giây (`W8`).
  - Chạy Phép so sánh A (`2709f3b` chạy lại cùng runner `paintAt` `W10` đối chiếu WebSocket B2 trên `polling-config.json`).
  - Chạy Phép so sánh B (Commit B1 Trước vs Commit B2 Sau bằng Node.js `ws` load driver độc lập `W1` kèm 1 Chromium probe, các bậc `W3`, kiểm bão hòa `W9` và hiệu chuẩn clock-exchange `W7`) và đo phục hồi đồng bộ (`W6`).
- [ ] **Task 6 — Hoàn thiện tài liệu, bằng chứng, đối chiếu `goal.md`/`cv-goal.md`, hướng dẫn demo, `review-change`, `pnpm build` và `pnpm check`:** cập nhật `websocket-verification.md`, các file kiến trúc/UC nếu cần, ghi đối chiếu `goal.md`/`cv-goal.md` và hướng dẫn chạy/demo vào `work/step-12-websocket-build/`, cập nhật `tracker.md` sang `Hoàn thành`, chạy `review-change`, `pnpm build` và `pnpm check`.

## References

1. <a id="ref-1"></a>[Kiểm chứng WebSocket cập nhật trực tiếp](../../../../../testing/test-scopes/TS-002-market-data/websocket-verification.md)
2. <a id="ref-2"></a>[Kết quả Bước 11 và bàn giao Bước 12](../step-11-websocket-verification/execution.md#task-4-bàn-giao-bước-12)
