# Kế hoạch chốt requirements cho WebSocket

Đọc file này để biết phạm vi, các quyết định cần chốt, thứ tự công việc và cách kiểm chứng Bước 09 của Market Data.

## Mục tiêu và đầu ra

Bước 09 mở rộng requirements của Market Data từ vòng cập nhật định kỳ sang vòng cập nhật trực tiếp, làm đầu vào cho thiết kế WebSocket (Bước 10) và chốt kiểm chứng (Bước 11) [[1]](#ref-1). Bước này chỉ sửa tài liệu. Không sửa code, schema shared hoặc test tự động.

| Đầu ra | File từ gốc repo | Điều kiện đạt |
| --- | --- | --- |
| Use case Market Data mở rộng cho cập nhật trực tiếp | `docs/UCs/market-data.md` | Có use case cập nhật trực tiếp, đổi pair/timeframe, mất kết nối, dữ liệu cũ và phục hồi đồng bộ theo góc nhìn người dùng; giữ toàn bộ ID cũ `MK-01` đến `MK-92`, rule mới từ `MK-93`, có `sequenceDiagram` và `stateDiagram-v2` cho vòng đời kết nối và đồng bộ [[2]](#ref-2) |
| Tiêu chí chất lượng cho vòng cập nhật trực tiếp | `docs/UCs/quality-attributes.md` | Có scenario đo được cho độ mới dữ liệu, tải đồng thời, latency, phục hồi và tính toàn vẹn dữ liệu; phân biệt rõ mục tiêu cần kiểm chứng với kết quả đã đo; giá trị chưa được duyệt giữ trạng thái `Proposed` [[1]](#ref-1) [[2]](#ref-2) |
| Phân tích requirements và tác động | `docs/testing/test-scopes/TS-002-market-data/websocket-requirement-gap-analysis.md` (tạo mới) | Ghi trạng thái requirements trước phân tích, nguồn kèm commit, phân tích tác động lên rule/scenario cũ, điểm thiếu hoặc mâu thuẫn, kết quả đối chiếu baseline độc lập, bảng quyết định agent đề xuất và kết luận |
| Câu hỏi mở | `docs/open-questions.md` | Cập nhật `OQ-035`, giữ rõ phạm vi `OQ-030`, `OQ-031`, `OQ-067`, `OQ-086`; câu hỏi mới nhận ID kế tiếp từ `OQ-087` |
| Mục lục UCs và TS-002 | `docs/UCs/README.md`, `docs/testing/test-scopes/TS-002-market-data/README.md` | Mô tả đúng phạm vi đã mở rộng sang cập nhật trực tiếp và trạng thái phân tích WebSocket |
| Ghi nhận thực hiện và bàn giao Bước 10 | `work/step-09-websocket-requirements/execution.md` | Ghi các đầu vào kỹ thuật cần chuyển sang thiết kế (Bước 10), kết quả kiểm tra và review |

Bước 09 không chốt giao thức WebSocket nội bộ, tên message, shared subscriptions, cơ chế reconnect/backoff phía server hay REST backfill endpoint. Các nội dung đó thuộc Bước 10 [[1]](#ref-1). Use case chỉ ghi hành vi người dùng hoặc tester quan sát được từ bên ngoài [[2]](#ref-2).

## Skills và rules áp dụng

| Skill hoặc rule | Ảnh hưởng đến cách làm |
| --- | --- |
| `write-use-case` | Theo 10 bước: nguồn kèm commit, giữ ID cũ, main flow dạng hộp đen, exception flow theo từng bước, `stateDiagram-v2` cho vòng đời trạng thái, rule có số đo, boundary test, baseline độc lập, tách riêng từng giá trị agent đề xuất để product owner duyệt |
| Use Case Documentation, Documentation Conventions, Mermaid | Định dạng bảng rule, bảng luồng, Gap analysis, ID không đứng một mình và trích dẫn [[2]](#ref-2) [[3]](#ref-3) |
| LL-003 | Không kết luận requirements đủ khi chưa đối chiếu baseline độc lập; ID và mức chuẩn lấy từ bản gốc [[4]](#ref-4) |
| LL-004 | Mọi giá trị agent đề xuất có nguồn, lý do và mức thay đổi so với nguồn hiện có; giữ trạng thái `Proposed` tới khi product owner duyệt từng giá trị [[4]](#ref-4) |
| LL-006, LL-007 | Chỉ ghi trạng thái môi trường và kết quả đo đã kiểm chứng trong Bước 08; không nâng mục tiêu thành kết quả đã đạt [[4]](#ref-4) |
| `review-change` | Subagent mới kiểm diff tài liệu đối chiếu `docs/conventions/` trước khi báo hoàn thành |

## Điểm xuất phát

Các nhận định dưới đây đọc tại commit `0dd67c9` ngày 2026-11-23:

- `docs/UCs/market-data.md` có hai use case (`Xem lịch sử thị trường` và `Theo dõi cập nhật định kỳ`), ID từ `MK-01` đến `MK-92`. Mục Tổng quan ghi cập nhật trực tiếp và phục hồi kết nối còn ngoài phạm vi [[5]](#ref-5).
- `docs/UCs/quality-attributes.md` đã có kịch bản độ trễ cập nhật dưới 1 giây ở p95 (QA-05, `Confirmed`), kết nối lại trong 30 giây và 0 nến bị thiếu (QA-06, `Confirmed`), cùng các kịch bản REST và REST polling (QA-09 đến QA-13). Chưa có scenario về tải đồng thời cho Market Data realtime, phân biệt backend-to-chart latency với source-to-chart delay, hay toàn vẹn dữ liệu sau phục hồi [[6]](#ref-6) [[7]](#ref-7) [[8]](#ref-8).
- Baseline REST polling đo trên code đóng băng tại commit `2709f3b` và chốt kết quả tại commit `d31ba25`: 12 lượt mức 1 và 10 client đạt 120 weight mỗi 60 giây; độ mới dữ liệu (QA-12) và tỷ lệ thời gian dữ liệu cũ là `Inconclusive` do thiếu bằng chứng canvas paint và còn sai số clock; tổng thể giới hạn tải lên nguồn (QA-13) là `Inconclusive` do mức 50 client quá tải host local trước warm-up [[9]](#ref-9).
- `docs/open-questions.md` còn mở câu hỏi báo mất kết nối khi đang tạm dừng Live (OQ-035), mục tiêu số client WebSocket cho load test (OQ-067), chu kỳ làm mới cho timeframe lớn ở vòng polling (OQ-086), chọn pair từ Search (OQ-030) và tín hiệu BUY/SELL (OQ-031) [[10]](#ref-10).
- Prototype Realtime mô tả switch `Live updates` ("Live · Binance" kèm độ trễ, "Paused at {giờ}"), banner mất kết nối kèm thời điểm, "Disconnected at {giờ} · retrying", nút `Reconnect now` chuyển sang "Reconnecting…" và toast "Reconnected. Live data resumed." [[11]](#ref-11).

## Quyết định cần phân tích và đề xuất

Mọi giá trị hoặc quyết định hành vi chưa có nguồn xác nhận được đặt trạng thái `Proposed` (hoặc `Inferred` nếu chỉ suy ra từ prototype) và liệt kê riêng để product owner duyệt từng mục theo LL-004 [[4]](#ref-4):

1. Quan hệ giữa use case `Theo dõi cập nhật định kỳ` (vòng REST polling) và use case mới `Theo dõi cập nhật trực tiếp`: giữ nguyên ID `MK-63` đến `MK-92` để không phá vỡ truy vết kiểm chứng vòng polling, đồng thời phân rõ phạm vi từng vòng.
2. Trạng thái kết nối và đồng bộ người dùng thấy trên màn hình: đang cập nhật trực tiếp, đang tạm dừng, dữ liệu cũ/trễ, mất kết nối và đang tự kết nối lại, đang đồng bộ lại dữ liệu sau khi có kết nối, đã phục hồi. Phân biệt rõ "đã mở lại kết nối" với "đã đồng bộ xong dữ liệu" [[7]](#ref-7).
3. Ngưỡng báo dữ liệu cũ (stale data), hành vi nút kết nối lại thủ công (`Reconnect now`), và câu hỏi `OQ-035` (có báo mất kết nối khi người dùng đã tạm dừng cập nhật trực tiếp không).
4. Hành vi khi đổi pair, đổi timeframe, đổi số chart, ẩn/hiện tab, tạm dừng/tiếp tục, mở nhiều tab, phiên hết hạn và reload trong vòng cập nhật trực tiếp.
5. Bảo mật kênh cập nhật trực tiếp quan sát được từ bên ngoài theo OWASP ASVS 5.0 V4.4 (TLS/WSS, kiểm `Origin` lúc handshake, gắn xác thực phiên hợp lệ và cắt cập nhật khi phiên hết hạn hoặc bị thu hồi).
6. Các quality attribute scenario cần bổ sung hoặc làm rõ trong `docs/UCs/quality-attributes.md`: tải đồng thời (có điều kiện tính một client vào capacity), backend-to-chart latency và source-to-chart delay, phục hồi đồng bộ (tới khi nhận cập nhật mới và bù đủ nến đóng), và toàn vẹn dữ liệu OHLCV sau phục hồi [[7]](#ref-7) [[8]](#ref-8).

## Công việc

1. **Nguồn và ID.** Xác nhận toàn bộ ID `MK-01` đến `MK-92`, `QA-01` đến `QA-13`, `OQ-001` đến `OQ-086` tại commit `0dd67c9`. Giữ nguyên nghĩa mọi ID cũ; cấp tiếp từ `MK-93`, `QA-14` và `OQ-087`.
2. **Baseline độc lập.** Thu thập ba nguồn độc lập:
   - Bộ use case do subagent mới viết, chỉ nhận mục tiêu cập nhật trực tiếp và danh sách actor, không đọc file nào trong repo.
   - WCAG 2.2 (SC 1.4.1 mức A, SC 2.1.1 mức A, SC 2.2.2 mức A, SC 2.4.7 mức AA, SC 4.1.3 mức AA) cho nội dung tự cập nhật, trạng thái kết nối và thông báo phục hồi.
   - OWASP ASVS 5.0 V4.4 (4.4.1 mức L1, 4.4.2–4.4.4 mức L2) để đề xuất mở rộng bảo mật cho kênh trực tiếp ngoài phạm vi Auth/Session của ADR-002 [[12]](#ref-12).
3. **Mở rộng `docs/UCs/market-data.md`.** Cập nhật Tổng quan, bổ sung use case `Theo dõi cập nhật trực tiếp` với `sequenceDiagram`, `stateDiagram-v2` vòng đời kết nối và đồng bộ, bảng bước, bảng rule có số đo, bảng luồng thay thế và ngoại lệ, và cập nhật `Gap analysis`.
4. **Cập nhật `docs/UCs/quality-attributes.md`.** Rà soát các kịch bản hiện có (QA-05, QA-06); bổ sung scenario còn thiếu về tải đồng thời, freshness/latency, phục hồi đồng bộ và toàn vẹn dữ liệu với sáu phần đầy đủ; phân biệt mục tiêu với kết quả đã đo.
5. **Tạo `docs/testing/test-scopes/TS-002-market-data/websocket-requirement-gap-analysis.md`.** Ghi trạng thái trước phân tích, nguồn kèm commit `0dd67c9`, phân tích tác động lên rule/scenario cũ, điểm thiếu/mâu thuẫn, kết quả baseline độc lập, bảng quyết định agent đề xuất và kết luận.
6. **Cập nhật `docs/open-questions.md`, `docs/UCs/README.md`, `docs/testing/test-scopes/TS-002-market-data/README.md`.**
7. **Ghi `work/step-09-websocket-requirements/execution.md` và cập nhật `tracker.md`.**

## Kiểm chứng hoàn thành

| Kiểm tra | Điều kiện đạt |
| --- | --- |
| `pnpm exec prettier --check` cho các file Markdown đã sửa hoặc tạo | Đạt |
| `pnpm check:docs` | Đạt; không mất ID cũ so với `HEAD` |
| `review-change` | Subagent review độc lập không còn finding mở |
| Báo cáo cho product owner | Liệt kê tách riêng từng giá trị và quyết định do agent đề xuất để duyệt từng mục; liệt kê toàn bộ ID thêm mới |

Không chạy typecheck, test app hoặc `pnpm check` vì Bước 09 chỉ sửa tài liệu. Không commit khi người dùng chưa yêu cầu.

## References

1. <a id="ref-1"></a>[Kế hoạch triển khai Market Data ở mức tổng quan](../../abstract-implementation-plan.md)
2. <a id="ref-2"></a>[Use Case Documentation](../../../../../../conventions/use-cases.md)
3. <a id="ref-3"></a>[Documentation Conventions](../../../../../../conventions/docs.md)
4. <a id="ref-4"></a>[Lessons Learned](../../../../../../../LESSONS.md)
5. <a id="ref-5"></a>[Market Data](../../../../../../UCs/market-data.md)
6. <a id="ref-6"></a>[Quality Attributes](../../../../../../UCs/quality-attributes.md)
7. <a id="ref-7"></a>[Những thứ cần đạt được trong lúc build Market Data](../../goal.md)
8. <a id="ref-8"></a>[Market Data sẽ thêm dòng nào vào CV?](../../cv-goal.md)
9. <a id="ref-9"></a>[Kiểm chứng REST polling](../../../../../../testing/test-scopes/TS-002-market-data/rest-polling-verification.md)
10. <a id="ref-10"></a>[Open Questions](../../../../../../open-questions.md)
11. <a id="ref-11"></a>[Realtime](../../../../../../design/prototype/docs/requirements/realtime.md)
12. <a id="ref-12"></a>[Architectural Decisions](../../../../../../architecture/30-decisions.md)
