# Kế hoạch thiết kế WebSocket và xem lại thiết kế REST

Đọc file này để biết phạm vi, các quyết định cần chốt, thứ tự công việc và cách kiểm chứng Bước 10 của Market Data.

## Mục tiêu và đầu ra

Bước 10 mở hộp đen của use case cập nhật trực tiếp đã chốt ở Bước 09 (`MK-93` đến `MK-132`, `QA-14` đến `QA-17`), đồng thời xem lại thiết kế REST tải lịch sử và REST polling từ kết quả đo Bước 08 [[1]](#ref-1) [[2]](#ref-2). Bước này chỉ sửa tài liệu. Không sửa code, schema shared, rule ESLint hoặc test tự động.

| Đầu ra | File từ gốc repo | Điều kiện đạt |
| --- | --- | --- |
| Thiết kế luồng realtime và xem lại REST | `docs/architecture/10-market-data.md` | Có Drivers cho `MK-93` đến `MK-141` và `QA-05`, `QA-06`, `QA-14` đến `QA-17`; sơ đồ thành phần mở rộng; interface stream provider; shared subscriptions và fan-out; chuyển giao lịch sử sang trực tiếp, reconnect, REST backfill, xử lý nến trùng/đến muộn/sai định dạng và client chậm; xem lại thiết kế REST; observability mở rộng [[3]](#ref-3) |
| Giao thức WebSocket và vai trò REST | `docs/architecture/22-api-endpoints.md` | Có contract `/api/market-data/ws` (handshake, subscribe/unsubscribe, candle/summary/heartbeat/status/error, close codes), giữ rõ REST cho lịch sử và backfill, bổ sung `dataTime` cho `MarketSummary` |
| Vòng đời kết nối và đồng bộ | `docs/architecture/20-state-machine.md` | Có trạng thái và bên sở hữu cho kết nối upstream Binance WebSocket, kết nối WebSocket của client, đồng bộ Realtime tại Web và trình tự shutdown API khi có WebSocket server |
| Bảo mật và bảo vệ tài nguyên WebSocket | `docs/architecture/23-security.md` | Có kiểm phiên, kiểm `Origin`, `WSS` trên production theo OWASP ASVS 5.0 V4.4, cưỡng chế dừng khi phiên hết hạn hoặc bị thu hồi, giới hạn kết nối/subscription/payload/tốc độ thông điệp và xử lý client chậm |
| Xem lại lưu trữ và database | `docs/architecture/21-database.md` | Ghi kết quả xem lại: không lưu nến vào PostgreSQL, bổ sung truy vấn đọc phiên theo lô và rà soát cấu hình `pg.Pool` |
| Cập nhật cấp hệ thống và ma trận driver | `docs/architecture/00-system.md`, `docs/architecture/README.md` | Phân biệt kết nối REST đã triển khai (nét liền) với kết nối WebSocket theo thiết kế (nét đứt); ma trận driver phủ `MK-93` đến `MK-141` và `QA-14` đến `QA-17` |
| Quyết định có trade-off | `docs/architecture/30-decisions.md` | Thêm các quyết định kiến trúc mới (`ADR-009` đến `ADR-011`) ở trạng thái `Proposed`, không sửa nội dung các ADR đã `Accepted` |
| Câu hỏi mở | `docs/open-questions.md` | Giữ [giới hạn số tab đồng thời (OQ-087)](../../../../../open-questions.md#oq-087) ở trạng thái `Open` kèm phương án đề xuất để product owner duyệt |
| Bàn giao Bước 11–12 | `work/step-10-websocket-design/execution.md` | Tổng hợp quyết định đề xuất (tách riêng từng giá trị theo quy tắc giá trị có nguồn LL-004), kết quả xem lại REST, bàn giao kiểm chứng/build và kết quả kiểm tra tài liệu |

Bước 10 không viết code adapter, test tự động, kịch bản benchmark hoặc script kiểm chứng; các phần đó thuộc Bước 11 và Bước 12 [[1]](#ref-1).

## Skills và rules áp dụng

| Skill hoặc rule | Ảnh hưởng đến cách làm |
| --- | --- |
| `write-architecture-doc` | Theo 8 bước: drivers từ UC, chọn view C4, mở hộp đen, ghi ADR cho trade-off, kiểm mọi claim về code tại nguồn, không chép giá trị của UC, cập nhật ma trận README, kiểm chứng và review |
| Architecture Documentation, Documentation Conventions, Mermaid | Section `## Drivers`, định dạng ADR, ID không đứng một mình, trích dẫn kiểu paper, diagram tối đa 10 node và không chép con số của UC [[4]](#ref-4) [[5]](#ref-5) |
| Project Structure, ESLint boundaries | Giữ layer Route/WS → Service → Provider/Repository; WS gateway ở `apps/api/src/api/ws/`, stream interface đặt trong `providers/market-data/market-data-provider.ts`, `WsSessionService` trong `services/` gọi `SessionRepository` trong `repositories/` [[6]](#ref-6) |
| Bài học về giá trị đề xuất, trạng thái môi trường và báo cáo bằng chứng (`LL-004`, `LL-006`, `LL-007`) | Mỗi giá trị kiến trúc do agent đề xuất mang nhãn `Proposed` kèm nguồn, lý do và tác động để product owner duyệt từng mục; mọi khẳng định về code/package hiện tại có nguồn đã đọc [[7]](#ref-7) |
| `review-change` | Subagent mới kiểm diff tài liệu đối chiếu `docs/conventions/` trước khi chốt |

## Điểm xuất phát

Các nhận định hiện trạng được kiểm trực tiếp trên source tại commit `3f68161` (đã chốt Bước 09) ngày 2026-11-23:

- `apps/api/package.json` và `pnpm-lock.yaml` đã cài và khóa `ws@8.23.0`, `express@5.3.0`, `better-auth@1.7.25`. API hiện chưa mở WebSocket server; `apps/api/src/index.ts` dùng `app.listen` và đóng HTTP server trước `pool.end()`.
- `apps/web/vite.config.ts` đã bật proxy `/api` với `ws: true` tới `API_PROXY_TARGET`.
- `apps/api/src/database/client.ts` khởi tạo `new pg.Pool({ connectionString })` không đặt `max` (mặc định 10 kết nối). `apps/api/src/configs/auth.ts` không bật cookie cache và chạy `findSession` trong `hooks.before` trước `getSession`, nên mỗi request REST `Inferred` chạm PostgreSQL hai lượt tuần tự [[8]](#ref-8).
- `scripts/eslint-plugin-app-boundaries.mjs` chỉ cho phép `services/` import `providers/market-data/market-data-provider.ts`, chặn `api/`, `repositories/`, `database/` import `providers/`.
- `packages/shared/src/schemas/market-data.schema.ts` có `candleSchema`, `candleHistorySchema` và `marketSummarySchema`; `marketSummarySchema` hiện chưa có `dataTime`.
- Use case có `MK-01` đến `MK-132` (`Confirmed`), gap `MK-133` đến `MK-141` (gap giới hạn tab `MK-138` còn `Open` qua [câu hỏi giới hạn số tab đồng thời (OQ-087)](../../../../../open-questions.md#oq-087)), và quality attribute scenarios `QA-05`, `QA-06`, `QA-09` đến `QA-17` (`Confirmed`) [[2]](#ref-2) [[9]](#ref-9).

## Quyết định kiến trúc cần đề xuất

Mọi quyết định có trade-off nằm trong ADR mới ở trạng thái `Proposed`; mọi tham số kỹ thuật nội bộ do agent đề xuất ghi rõ nguồn, lý do và tác động để product owner duyệt hoặc phủ quyết từng mục theo bài học về giá trị đề xuất (`LL-004`) [[7]](#ref-7):

1. **Chuyển cập nhật trực tiếp sang WebSocket đa kênh với shared subscriptions (ADR-009):** một kết nối WebSocket mỗi tab tại `/api/market-data/ws`, hub chia sẻ tối đa 1 stream upstream cho mỗi khóa `(pair, timeframe)` hoặc `pair` trên một kết nối combined stream tới Binance, giữ REST cho tải lịch sử và backfill.
2. **Xác thực WebSocket và cưỡng chế phiên (ADR-010):** dùng lại cookie phiên Better Auth lúc HTTP upgrade kèm kiểm `Origin` chặt (ASVS V4.4.2) và `WSS` trên production (ASVS V4.4.1); thu hồi ngay qua hook auth trong process kết hợp `WsSessionService` và `SessionRepository` kiểm lại theo lô mỗi 3 giây trên bảng `session` để đạt thời hạn cưỡng chế phiên (MK-121) mà không lặp lại nút thắt pool DB của polling.
3. **Chuyển giao lịch sử → trực tiếp, vô hiệu hóa cache theo nến đóng và xử lý client chậm (ADR-011):** subscribe và đệm sự kiện phía client trước khi gọi REST snapshot, hợp nhất tất định theo `openTime`/`dataTime`, composition root nối callback vô hiệu hóa entry cache REST khi hub nhận nến đóng để tránh khoảng trống tại biên TTL, và ngắt client chậm vượt ngưỡng đệm bằng mã đóng `4008` để client tự đồng bộ lại qua REST thay vì làm rơi nến đóng âm thầm.
4. **Bảo vệ tài nguyên và phương án cho [giới hạn số tab đồng thời (OQ-087)](../../../../../open-questions.md#oq-087):** đề xuất tối đa 4 kết nối WebSocket đồng thời mỗi tài khoản (cảnh báo và dừng tự kết nối lại trên tab thứ 5 bằng mã đóng `4429`, không ngắt 4 tab cũ), giới hạn 10 kênh mỗi kết nối, kích thước khung 4 KB và tốc độ 20 thông điệp mỗi 10 giây.
5. **Xem lại thiết kế REST:** giữ nguyên contract nến lịch sử và cache decorator (ADR-008) để bảo vệ Binance trước đợt đồng bộ hàng loạt khi nhiều client reconnect; bổ sung trường `dataTime` vào `MarketSummary` để sidebar đáp ứng quy tắc không lùi dữ liệu (MK-111); bổ sung cấu hình `DATABASE_POOL_MAX` (mặc định đề xuất 20 kết nối) cho đợt backfill đồng thời.

## Công việc

1. Kiểm chứng lại toàn bộ driver từ `docs/UCs/market-data.md` và `docs/UCs/quality-attributes.md`; đối chiếu tài liệu Binance Spot WebSocket Streams và tóm tắt OWASP ASVS 5.0 V4.4 (giữ rõ yêu cầu đọc nguyên văn trước Bước 11).
2. Cập nhật `docs/architecture/10-market-data.md`, `22-api-endpoints.md`, `20-state-machine.md`, `23-security.md`, `21-database.md`, `00-system.md`, `30-decisions.md`, `README.md` và `docs/open-questions.md`.
3. Viết `work/step-10-websocket-design/execution.md` và cập nhật trạng thái Bước 10 trong `tracker.md`.
4. Chạy kiểm tra định dạng, `pnpm check:docs` và subagent `review-change`; sửa toàn bộ findings trước khi trình product owner duyệt.

## Kiểm chứng hoàn thành

| Kiểm tra | Điều kiện đạt |
| --- | --- |
| `pnpm exec prettier --check` cho mọi file Markdown đã tạo hoặc sửa | Đạt |
| `pnpm check:docs` | Đạt (`check-docs: docs OK`) |
| `review-change` | Subagent review độc lập không còn finding mở |
| Trạng thái Bước 10 | Ghi `Đang thực hiện` chờ product owner duyệt các quyết định `Proposed` (`ADR-009` đến `ADR-011`), từng tham số kỹ thuật đề xuất và [giới hạn số tab đồng thời (OQ-087)](../../../../../open-questions.md#oq-087); chuyển `Hoàn thành` sau khi duyệt |

Không chạy typecheck, test app hoặc `pnpm check` vì Bước 10 chỉ sửa tài liệu. Không commit khi người dùng chưa yêu cầu.

## References

1. <a id="ref-1"></a>[Kế hoạch triển khai Market Data ở mức tổng quan](../../abstract-implementation-plan.md)
2. <a id="ref-2"></a>[Market Data](../../../../../UCs/market-data.md)
3. <a id="ref-3"></a>[Market Data & Realtime Updates](../../../../../architecture/10-market-data.md)
4. <a id="ref-4"></a>[Architecture Documentation](../../../../../conventions/architecture.md)
5. <a id="ref-5"></a>[Documentation Conventions](../../../../../conventions/docs.md)
6. <a id="ref-6"></a>[Project Structure](../../../../../conventions/project-structure.md)
7. <a id="ref-7"></a>[Lessons Learned](../../../../../../LESSONS.md)
8. <a id="ref-8"></a>[Bottleneck thật sự của REST polling qua số đo baseline](../../../../../knowledge/261123-market-data-rest-polling/market-data-rest-polling.polling-bottlenecks.md)
9. <a id="ref-9"></a>[Quality Attributes](../../../../../UCs/quality-attributes.md)
