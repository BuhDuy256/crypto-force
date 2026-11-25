# Kế hoạch chốt cách kiểm chứng WebSocket trước khi build

Đọc file này để biết mục tiêu, phạm vi, các cổng duyệt, thứ tự công việc và điều kiện hoàn thành Bước 11 của Market Data.

**Mục tiêu:** đối chiếu nguyên văn chuẩn bảo mật OWASP ASVS 5.0 V4.4, chốt cách kiểm chứng chức năng, phục hồi, toàn vẹn dữ liệu, hiệu năng so sánh và chẩn đoán cho vòng WebSocket, sau đó viết bộ test tự động trước khi Bước 12 triển khai code production [[1, Bước 11]](#ref-1).

**Test basis:** hành vi cập nhật trực tiếp `MK-93` đến `MK-132` và `MK-142` [[2]](#ref-2), quality attribute scenarios `QA-05`, `QA-06`, `QA-09` và `QA-14` đến `QA-17` [[3]](#ref-3), thiết kế WebSocket và xem lại REST (ADR-009 đến ADR-011) [[4]](#ref-4) [[5]](#ref-5) [[6]](#ref-6) [[7]](#ref-7) [[8]](#ref-8), cùng phân tích yêu cầu WebSocket [[9]](#ref-9).

## Ràng buộc

- Không triển khai full STLC; tài liệu kiểm chứng nằm trong `docs/testing/test-scopes/TS-002-market-data/websocket-verification.md`, code test nằm theo tính năng trong workspace [[1]](#ref-1) [[10]](#ref-10).
- Không build code production WebSocket ở Bước 11; test mới được phép fail cho tới khi Bước 12 triển khai hành vi tương ứng [[1]](#ref-1).
- Không viết test trên interface/seam chưa được product owner duyệt, và không khóa assertion trên tham số workload hay công cụ phát tải WebSocket chưa được duyệt [[11, LL-004]](#ref-11) [[12]](#ref-12).
- Không thay đổi abstract plan; chỉ cập nhật tracker, tài liệu scope TS-002 và thư mục làm việc của Bước 11.
- Mọi test viết mới tuân thủ quy ước Testware: dùng expected literal độc lập, không mock module của app, không chờ thời gian thật, không tạo export chỉ để test [[10]](#ref-10).
- Chỉ chạy kiểm tra theo phạm vi thay đổi; không tự chạy `pnpm check` và không commit khi người dùng chưa yêu cầu.

## Đầu ra dự kiến

Đường dẫn tính từ gốc repo. Các file code test dưới đây là đầu ra của Task 3 sau khi product owner duyệt Task 2.

| File | Trách nhiệm | Task |
| --- | --- | --- |
| `docs/testing/test-scopes/TS-002-market-data/websocket-verification.md` | Test basis, đối chiếu nguyên văn OWASP ASVS 5.0 V4.4 và WCAG 2.2, bảng seam/interface đề xuất, mô hình trạng thái, decision table, STRIDE threat model, ma trận bao phủ 41 rule và 7 QA, bộ dữ liệu tham chiếu và đối soát nến đóng, hai protocol so sánh tách biệt, kịch bản chẩn đoán 3 nhóm nguyên nhân và danh sách mutation | 1 |
| `docs/testing/test-scopes/TS-002-market-data/websocket-requirement-gap-analysis.md` | Cập nhật trạng thái đã đọc nguyên văn OWASP ASVS 5.0 V4.4 và xác nhận V4.4.3–4.4.4 không áp dụng theo quyết định xác thực cookie phiên (ADR-010) | 1 |
| `docs/testing/test-scopes/TS-002-market-data/README.md` | Bổ sung link tới tài liệu kiểm chứng WebSocket và trạng thái Bước 11 | 1, 4 |
| `packages/shared/src/schemas/market-data-ws.schema.test.ts` | Test contract khung WS client/server, `MarketSummary.dataTime` và biến môi trường mới (`DATABASE_POOL_MAX`, `WS_MAX_CONNECTIONS_PER_USER`, `BINANCE_WS_URL`) | 3 |
| `apps/api/test/market-data/stream-provider.test.ts` | Test `BinanceStreamProvider` qua fake WS server: combined stream, chuẩn hóa kline/ticker, micro-batch lệnh, ping/pong, xoay trước 24 giờ, reconnect backoff, khung sai định dạng | 3 |
| `apps/api/test/market-data/stream-hub.test.ts` | Test `MarketDataStreamHub` qua fake `MarketDataStreamProvider`: shared ref-count (tối đa 1 stream upstream cho N client), giữ topic 5 giây sau khi hết subscriber, gọi `onCandleClosed` vô hiệu hóa cache REST, single-serialize fan-out, loại khung sai, log tổng hợp 10 giây | 3 |
| `apps/api/test/market-data/cache-invalidation.test.ts` | Test mở rộng `CachedMarketDataProvider.invalidateCandles(pair, timeframe)`: vô hiệu hóa đúng khóa nến khi có nến đóng, không xóa khóa khác và giữ nguyên cơ chế giữ lỗi nguồn trong TTL (ADR-008) | 3 |
| `apps/api/test/market-data/ws-gateway.test.ts` | Test tích hợp `/api/market-data/ws` với HTTP server, Better Auth và PostgreSQL thật: `Origin` (403), `WSS` production (403), thiếu phiên (401), giới hạn 4 tab (`4429` + `CONNECTION_LIMIT_EXCEEDED`), subscribe/unsubscribe, giới hạn 10 kênh, `maxPayload` 4 KB, rate limit 20 msg/10s (`4429`), `heartbeat` 5s, `SLOW_CONSUMER` (`4008`), thu hồi phiên qua hook và kiểm tra theo lô (`4401` trong 5 giây), shutdown `1001` | 3 |
| `apps/web/app/utils/market-candle-merge.test.ts` | Test thuần hàm hợp nhất snapshot + bộ đệm WS: nến đang mở cập nhật tại chỗ, đóng nến và cắt cửa sổ 500 + 19 warm-up, trùng `openTime` đã đóng bị bỏ, không lùi `dataTime`, phát hiện thiếu bản chốt ở biên chuyển giao, tràn đệm 50 sự kiện, không lấp khoảng trống thật | 3 |
| `apps/web/e2e/market-data/websocket-live.spec.ts` | Test E2E qua API, Auth, DB thật và replay HTTP+WS cục bộ: cập nhật trực tiếp chart/sidebar/đóng nến, đổi timeframe không rơi cập nhật chart khác, đổi pair liên tiếp, 2 chart cùng timeframe, nhiều tab độc lập và tab thứ 5 bị chặn `4429`, tạm dừng/tiếp tục/đổi lựa chọn khi tạm dừng, tab ẩn/hiện, dữ liệu cũ 15s và đặt lại 30s, ngắt mạng → `Đang đồng bộ` → REST backfill đối soát 0 nến đóng thiếu/trùng/lệch OHLCV → `Đang trực tiếp`, đồng bộ lỗi từng phần, hết hạn phiên `4401`, nguồn lỗi `unavailable`, accessibility nhãn chữ và tiết chế thông báo | 3 |
| `work/step-11-websocket-verification/execution.md` | Ghi trạng thái môi trường đã kiểm, kết quả đọc nguyên văn ASVS V4.4, danh sách đề xuất cần duyệt, kết quả chạy test red có chủ đích và bàn giao Bước 12 | 1, 3, 4 |

## Công việc

### Task 1: Đọc nguyên văn ASVS V4.4 và chốt thiết kế kiểm chứng

- [x] Đọc nguyên văn file OWASP ASVS 5.0 `0x13-V4-API-and-Web-Service.md` (V4.4 WebSocket) và cập nhật kết luận vào [WebSocket Requirement Gap Analysis](../../../../../../testing/test-scopes/TS-002-market-data/websocket-requirement-gap-analysis.md).
- [x] Khảo sát source và môi trường thực tế tại commit `e819628` (schemas, providers, cache decorator, auth, database client, Web hooks, perf server, ESLint rules, phiên bản runtime và khóa `ws`).
- [x] Thiết kế và ghi toàn bộ tài liệu [Kiểm chứng WebSocket](../../../../../../testing/test-scopes/TS-002-market-data/websocket-verification.md):
  - Phân loại test basis phủ 41 rule `Confirmed` (`MK-93` đến `MK-132`, `MK-142`), 2 gap `Accepted` (`MK-140`, `MK-141`) và 7 kịch bản chất lượng (`QA-05`, `QA-06`, `QA-09`, `QA-14` đến `QA-17`).
  - Đối chiếu nguyên văn OWASP ASVS 5.0 V4.4 và WCAG 2.2.
  - Bảng 7 public interface/seam đề xuất (dùng nguyên tắc deep module, chỉ rõ lỗi bắt được và phần không chứng minh được).
  - Bảng chuyển trạng thái (gồm cả chuyển trạng thái hợp lệ và bị chặn) cho kết nối upstream và hai tầng đồng bộ Web, decision table bắt tay/hợp nhất, STRIDE threat model và ma trận requirement → kịch bản → test → evidence.
  - Bộ dữ liệu tham chiếu cố định và thuật toán đối chiếu nến đóng sau reconnect/backfill (`QA-16`, `QA-17`).
  - Hai protocol đo và so sánh tách biệt: (A) REST polling vs WebSocket cho freshness, request upstream, lưu lượng và tỷ lệ dữ liệu cũ; (B) trước vs sau shared subscriptions cho capacity và fan-out. Phân biệt `backend-to-chart latency` với `source-to-chart delay`, chốt điều kiện tính client vào capacity, tách tiến trình/máy phát tải và đếm riêng 3 bộ đếm request/subscription.
  - Kịch bản chẩn đoán 3 nhóm nguyên nhân (upstream, backend, client chậm) và định dạng timeline log/metric theo pair/timeframe.
  - Danh sách mutation và phép kiểm fake dự kiến làm gate bắt buộc ở Bước 12.
- [x] Lập danh sách tách riêng từng seam và tham số đề xuất (`Proposed`) trong `execution.md`, kiểm tra Prettier, `pnpm check:docs` và `review-change`.

### Task 2: Trình product owner duyệt seam, công cụ phát tải và protocol so sánh

- [x] Trình product owner duyệt từng mục đề xuất (`Proposed`): 7 public interface/seam kiểm thử (`S1`–`S7`), công cụ phát tải WebSocket (Node `ws` load driver độc lập), chế độ so sánh trước/sau shared subscriptions (tách 2 commit), workload/thời lượng/bậc tải capacity, cách thu bằng chứng paint của canvas (`W10`), ngưỡng không bão hòa máy phát tải (`W9`) và các cổng biên assertion (`W11`).
- [x] Cập nhật trạng thái `Confirmed` ngày 2026-11-23 cho toàn bộ 18 mục đã duyệt trong `websocket-verification.md` (giữ `k6` cho WebSocket ở trạng thái `Proposed` trong `docs/testing/test-strategy.md` vì đã chọn Node `ws` load driver).

### Task 3: Viết bộ test tự động trước build và xác nhận trạng thái red

- [x] Chỉ thực hiện sau khi Task 2 đã duyệt seam và cổng biên.
- [x] Tạo fixture tham chiếu đóng băng (`apps/api/test/market-data/ws-reference-dataset.json`) và nối vào local Binance WS+HTTP replay harness (`apps/api/test/support/market-data-ws-server.ts`, có kiểm chặn outbound và cổng tách biệt Web 5186 / API 3017 / control 3018 / upstream WS 3019); kịch bản đối soát ngắt mạng 30s/120s/300s đầy đủ trên fixture này được mở rộng khi build Bước 12.
- [x] Viết các lát test tự động trước build theo thứ tự triển khai Bước 12: shared contract & env → cache invalidation → BinanceStreamProvider → MarketDataStreamHub → WS Gateway (Auth/Origin/WSS/session revocation/limits/backpressure) → Web pure merge util → E2E WebSocket live & recovery.
- [x] Chạy từng nhóm test và ghi rõ lệnh chạy, số test, phân biệt test fail ở assertion hành vi với test chưa tới assertion do thiếu module production. Không bỏ qua test bằng `skip`/`todo` và không sửa expected của test regression cũ khi production chưa chuyển đổi.

### Task 4: Review, kiểm tra tài liệu và bàn giao Bước 12

- [x] Chạy Prettier, `pnpm check:docs`, ESLint cho các file test mới, typecheck theo workspace bị ảnh hưởng, `graphify update .` và `review-change` với subagent độc lập.
- [x] Hoàn thiện mục bàn giao Bước 12 trong `execution.md` (thứ tự lát red → green, danh sách mutation và phép kiểm độ nhạy fake bắt buộc, điều kiện chạy benchmark so sánh A và B).
- [x] Cập nhật `README.md` của TS-002 và chuyển Bước 11 trong `tracker.md` sang `Hoàn thành`.

## References

1. <a id="ref-1"></a>[Kế hoạch triển khai Market Data ở mức tổng quan](../../abstract-implementation-plan.md)
2. <a id="ref-2"></a>[Market Data](../../../../../../UCs/market-data.md)
3. <a id="ref-3"></a>[Quality Attributes](../../../../../../UCs/quality-attributes.md)
4. <a id="ref-4"></a>[Market Data & Realtime Updates](../../../../../../architecture/10-market-data.md)
5. <a id="ref-5"></a>[API & Realtime Communication Contracts](../../../../../../architecture/22-api-endpoints.md)
6. <a id="ref-6"></a>[System States & Lifecycle](../../../../../../architecture/20-state-machine.md)
7. <a id="ref-7"></a>[Security](../../../../../../architecture/23-security.md)
8. <a id="ref-8"></a>[Architectural Decisions](../../../../../../architecture/30-decisions.md)
9. <a id="ref-9"></a>[WebSocket Requirement Gap Analysis](../../../../../../testing/test-scopes/TS-002-market-data/websocket-requirement-gap-analysis.md)
10. <a id="ref-10"></a>[Testware](../../../../../../conventions/testware.md)
11. <a id="ref-11"></a>[Lessons Learned](../../../../../../../LESSONS.md)
12. <a id="ref-12"></a>[Test Strategy](../../../../../../testing/test-strategy.md)
