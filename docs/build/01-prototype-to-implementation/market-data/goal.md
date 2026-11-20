# Những thứ cần đạt được trong lúc build Market Data

Các mục tiêu lấy từ [cv-goal.md](cv-goal.md).

1. **Một dòng trong CV:** Increased **load-tested** capacity from {A} to {B} concurrent clients through shared subscriptions, maintaining p95 update latency below {L} ms on unchanged hardware.
2. **Thiết kế ranh giới và khả năng thay provider:** Frontend dùng contract dữ liệu thống nhất, không phụ thuộc payload Binance. Giải thích phần phải thay khi thêm provider khác [[4, §4 và §25]](cv-goal.md#ref-4).
3. **Phát triển từng bước:** REST phục vụ lịch sử và backfill, WebSocket bổ sung cập nhật trực tiếp. Giải thích cách nâng cấp mà vẫn giữ contract nến ổn định.
4. **Thiết kế luồng realtime:** Giải thích đường đi của dữ liệu, nơi chuẩn hóa và cách chuyển cập nhật tới đúng pair/timeframe. Liên hệ với luồng realtime trong brief [[4, §4 và §17]](cv-goal.md#ref-4).
5. **Xử lý lỗi và phục hồi:** Giải thích cách phát hiện mất kết nối, reconnect và bù nến thiếu. Phân biệt kết nối đã mở lại với dữ liệu đã đồng bộ xong [[4, §17 và §25]](cv-goal.md#ref-4).
6. **Tách trách nhiệm giữa các module:** Giải thích vì sao adapter lấy dữ liệu, service điều phối và chart hiển thị. Tránh một service vừa lấy dữ liệu vừa tính strategy, backtest và gửi mọi sự kiện [[4, §27]](cv-goal.md#ref-4).
7. **Khả năng quan sát và chẩn đoán:** Giải thích cách tìm nguyên nhân chart bị chậm hoặc ngừng cập nhật. Đề xuất phân biệt lỗi upstream, xử lý backend và client chậm theo mục tiêu observability của brief [[4, §17 và §30]](cv-goal.md#ref-4).
8. **Demo chức năng có thể kiểm chứng:** Cho thấy người dùng xem nến và đổi timeframe. Khi triển khai multi-chart, chứng minh đổi timeframe của một chart không làm tải lại các chart khác [[4, §5]](cv-goal.md#ref-4).
9. **Lập luận về trade-off:** Giải thích vì sao chọn WebSocket, vì sao REST vẫn cần và điều kiện nào khiến thiết kế phải thay đổi. Brief yêu cầu giải thích lựa chọn kiến trúc và cung cấp deliverables [[4, §23 và §28]](cv-goal.md#ref-4).

## Bằng chứng nằm trong repo như nào?

> Các file tài liệu và thư mục được ghi là **đã có** hiện tồn tại trong repo. Nội dung Market Data cần bổ sung được mô tả bên dưới. Các đường dẫn ghi **ví dụ dự kiến** chưa tồn tại, là ví dụ nơi đặt file theo cấu trúc repo, chưa phải tên file đã chốt.

Yêu cầu và hành vi nằm trong `docs/UCs/`. Cơ chế đáp ứng nằm trong `docs/architecture/`. Kịch bản, kết quả và dữ liệu kiểm chứng nằm trong `docs/testing/`. Code và test tự động nằm trong các workspace.

> **Proposed:** Dùng `docs/testing/market-data.md` và `docs/testing/evidence/market-data/` cho tài liệu kiểm chứng gọn và dữ liệu đo. Repo chưa có hai đường dẫn này. Không dùng `test-scopes/TS-xxx-*` cho phần này vì cấu trúc đó dành cho bộ tài liệu STLC. Không tạo đủ 6 phase STLC.

1. **Một dòng trong CV:**
   - **Đã có:** `docs/UCs/quality-attributes.md` là nơi bổ sung workload và tiêu chí chấp nhận về sức tải, độ trễ Market Data.
   - **Ví dụ dự kiến:** `apps/api/test/performance/market-data.k6.js` chứa kịch bản load test REST/WebSocket bằng k6.
   - **Ví dụ dự kiến:** `docs/testing/market-data.md` ghi kịch bản benchmark, môi trường, lệnh chạy và kết quả trước/sau. `docs/testing/evidence/market-data/benchmark-before.json` và `benchmark-after.json` lưu dữ liệu đo dùng cho dòng CV.

2. **Thiết kế ranh giới và khả năng thay provider:**
   - **Ví dụ dự kiến:** `docs/UCs/market-data.md` mô tả dữ liệu nến và hành vi người dùng cần nhận, độc lập với Binance hoặc provider cụ thể.
   - **Đã có:** `docs/architecture/10-market-data.md` hiện là khung tài liệu. Bổ sung sơ đồ Web → API → Market Data Service → Provider và phần giải thích thay provider ảnh hưởng những thành phần nào.
   - **Đã có:** `docs/architecture/22-api-endpoints.md` là nơi bổ sung contract REST/WebSocket công khai cho Market Data.
   - **Ví dụ dự kiến:** `packages/shared/src/schemas/market-data.schema.ts` chứa Zod schema cho contract nến thống nhất, chẳng hạn `candleSchema` với thời gian mở nến và các trường OHLCV. Frontend và backend dùng schema/type qua public exports trong `packages/shared/src/index.ts` đã có.
   - **Ví dụ dự kiến:** `packages/shared/test/market-data.schema.test.ts` kiểm tra dữ liệu hợp lệ và dữ liệu bị từ chối theo contract nến.
   - **Ví dụ dự kiến:** `apps/api/test/market-data/provider-contract.test.ts` kiểm tra service làm việc với provider giả lập qua interface `MarketDataProvider`, không phụ thuộc payload Binance. Provider giả lập đặt tại `apps/api/test/support/market-data-provider.ts` và truyền qua tham số, không mock module của app.

3. **Phát triển từng bước:**
   - **Đã có:** `docs/build/01-prototype-to-implementation/market-data/goal.md` ghi mục tiêu của flow Market Data.
   - Các commit và diff trong Git thể hiện từng bước REST → polling → WebSocket. Mỗi bước có code chạy được và giữ REST cho lịch sử/backfill.
   - **Đã có:** `docs/architecture/10-market-data.md` là nơi bổ sung trách nhiệm của REST và WebSocket qua từng bước.
   - **Ví dụ dự kiến:** `docs/UCs/market-data.md` ghi hành vi của từng flow. `docs/testing/market-data.md` ghi các kịch bản đã kiểm và kết quả cho từng bước REST, polling, WebSocket.

4. **Thiết kế luồng realtime:**
   - **Ví dụ dự kiến:** `docs/UCs/market-data.md` mô tả cập nhật nến, đổi pair/timeframe và kết quả người dùng quan sát được.
   - **Đã có:** `docs/architecture/10-market-data.md` là nơi bổ sung data-flow diagram, sequence tải lịch sử rồi nhận cập nhật, subscribe/unsubscribe theo pair/timeframe.
   - **Ví dụ dự kiến:** `apps/api/src/services/market-data.service.ts` chứa phần điều phối subscription. `apps/api/test/market-data/subscriptions.test.ts` kiểm tra chia sẻ subscription và chuyển cập nhật tới đúng client.
   - **Ví dụ dự kiến:** `docs/testing/market-data.md` ghi kịch bản subscribe/unsubscribe, nhiều client cùng stream và đổi pair/timeframe, kèm kết quả kiểm chứng.

5. **Xử lý lỗi và phục hồi:**
   - **Ví dụ dự kiến:** `docs/UCs/market-data.md` mô tả hành vi khi mất kết nối và khi dữ liệu được đồng bộ lại. `docs/UCs/quality-attributes.md` đã có là nơi bổ sung tiêu chí phục hồi đo được.
   - **Đã có:** `docs/architecture/10-market-data.md` là nơi bổ sung sequence mất kết nối → reconnect → REST backfill → đồng bộ xong.
   - **Ví dụ dự kiến:** `apps/api/test/market-data/recovery.test.ts` kiểm tra phục hồi và đối chiếu nến sau backfill. `apps/api/test/support/binance-ws-server.ts` giả lập upstream WebSocket để tạo mất kết nối có kiểm soát.
   - **Ví dụ dự kiến:** `docs/testing/market-data.md` ghi kịch bản ngắt kết nối và kết quả đối chiếu. `docs/testing/evidence/market-data/recovery.log` lưu timeline sự cố, `candle-reconciliation.json` lưu kết quả kiểm tra nến thiếu, trùng hoặc lệch OHLCV.

6. **Tách trách nhiệm giữa các module:**
   - **Đã có:** `docs/architecture/10-market-data.md` là nơi bổ sung component diagram và trách nhiệm của adapter, service, chart.
   - **Đã có:** `docs/conventions/project-structure.md` quy định ranh giới các layer. `eslint.config.js` chứa rule kiểm tra dependency boundaries.
   - **Ví dụ dự kiến:** `apps/api/src/services/market-data.service.ts` điều phối nghiệp vụ. `apps/web/app/api/market-data.ts` gọi HTTP API và `apps/web/app/hooks/useMarketData.ts` quản lý query/UI logic. Contract dùng chung nằm trong `packages/shared`, không import source của API vào Web.

7. **Khả năng quan sát và chẩn đoán:**
   - **Đã có:** `apps/api/src/configs/logger.ts` là cấu hình logger của API.
   - **Ví dụ dự kiến:** `apps/api/test/market-data/observability.test.ts` kiểm tra log có ngữ cảnh pair/timeframe khi upstream lỗi hoặc phục hồi.
   - **Đã có:** `docs/architecture/10-market-data.md` là nơi bổ sung vị trí ghi log/metric và cách phân biệt lỗi upstream, backend, client chậm.
   - **Ví dụ dự kiến:** `docs/testing/market-data.md` ghi kết quả chẩn đoán một lần chart chậm hoặc ngừng cập nhật, liên kết log/metric trong `docs/testing/evidence/market-data/`.

8. **Demo chức năng có thể kiểm chứng:**
   - **Ví dụ dự kiến:** `docs/UCs/market-data.md` ghi flow xem nến, đổi timeframe và hành vi độc lập của từng chart khi có multi-chart.
   - **Ví dụ dự kiến:** `apps/web/e2e/market-data/chart.spec.ts` kiểm tra flow xem nến và đổi timeframe. Khi có multi-chart, bổ sung kiểm tra đổi timeframe một chart không làm tải lại chart khác.
   - **Ví dụ dự kiến:** `docs/build/01-prototype-to-implementation/market-data/demo.md` chứa hướng dẫn chạy và các bước demo flow thật.
   - **Ví dụ dự kiến:** `docs/testing/market-data.md` ghi kết quả kiểm tra flow, liên kết screenshot hoặc trace trong `docs/testing/evidence/market-data/` khi cần minh họa.

9. **Lập luận về trade-off:**
   - **Đã có:** `docs/architecture/30-decisions.md` là nơi bổ sung ADR về lựa chọn WebSocket, vai trò REST và shared subscriptions, kèm phương án thay thế, lợi ích, chi phí và điều kiện xem xét lại.
