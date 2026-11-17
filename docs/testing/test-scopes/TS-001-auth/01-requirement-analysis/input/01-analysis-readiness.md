# Requirement Analysis: Readiness

Đọc file này để xác định thông tin cần có trước khi review requirement Authentication, mức độ tin cậy của từng thông tin, và khi nào đủ điều kiện để bắt đầu.

## 1. Đợt phân tích

| Trường | Nội dung |
| --- | --- |
| Mục tiêu | Xác định requirement Authentication nào đủ sẵn sàng để lập test plan và thiết kế test |
| Phạm vi | Toàn bộ Authentication [[1]](#ref-1); các mục Authentication, Giới hạn số lần đăng nhập, Giới hạn gửi email, Email trong môi trường development của Security [[2]](#ref-2); các mục Điều kiện đăng nhập và Sign out của Workspace [[3]](#ref-3); quy ước lỗi form của prototype [[4]](#ref-4) |
| Thời gian dự kiến | 2026-11-17 (GMT+7) |
| Người thực hiện / reviewer | Người thực hiện: agent. Reviewer: người giữ requirement |

## 2. Thông tin cần có

| ID | Thông tin cần có | Dùng cho file | Nguồn | Trạng thái | Căn cứ trạng thái | Ảnh hưởng nếu chưa xác minh |
| --- | --- | --- | --- | --- | --- | --- |
| IN-01 | Các trường ở mục 1 | 01–03 | — | Đã xác minh | Product owner yêu cầu tiếp tục đợt phân tích này và quyết định các finding ngày 2026-11-17 | — |
| IN-02 | Tài liệu requirement có version | 01–03 | [[1]](#ref-1) [[2]](#ref-2) [[3]](#ref-3) [[4]](#ref-4) [[5]](#ref-5) [[11]](#ref-11) | Đã xác minh | Mỗi file có commit, ghi ở References. Authentication, Security, Architectural Decisions và Test Strategy được sửa theo quyết định của finding tại commit `705a1ad` | — |
| IN-03 | Nguồn gốc của từng tài liệu requirement | 02 | [[1]](#ref-1) [[4]](#ref-4) | Đã xác minh | Crypto Force UI Prototype ghi rằng hành vi sản phẩm của từng màn hình được mô tả trong `docs/requirements/`, tức là spec mô tả hành vi theo prototype. Code được viết theo spec | — |
| IN-04 | Tiêu chí sẵn sàng đã thống nhất | 01, 03 | — | Đã xác minh | Product owner duyệt tiêu chí CR-01 đến CR-06 trong Requirement Readiness và thang mức độ của finding ngày 2026-11-17 | — |
| IN-05 | Baseline độc lập | 02 | [[6]](#ref-6) [[7]](#ref-7) [[8]](#ref-8) | Đã xác minh | ID và mức lấy từ file gốc của OWASP ASVS 5.0 ngày 2026-11-17. Mức áp dụng là L1 cộng các mục L2 đã chọn theo ADR-002 [[5]](#ref-5) | — |
| IN-06 | Người giữ requirement có thẩm quyền trả lời câu hỏi và duyệt thay đổi | 01, 03 | — | Đã xác minh | Product owner quyết định RF-01 đến RF-11 ngày 2026-11-17 | — |
| IN-07 | Nơi quản lý câu hỏi mở và quy ước ghi | 01, 03 | [[9]](#ref-9) | Đã xác minh | Open Questions có ID `OQ-xxx`, anchor theo ID và mục Resolved | — |
| IN-08 | Implementation hiện có | 01 | `apps/api/src/configs/auth.ts`, `apps/web/app/api/auth.ts`, `packages/shared/src/schemas/auth.schema.ts` | Đã xác minh | Đọc tại commit `b4ca981` | — |
| IN-09 | Ràng buộc nghiệp vụ, pháp lý hoặc quy định của domain | 02, 03 | [[5]](#ref-5) [[10]](#ref-10) | Đã xác minh | Sản phẩm không giữ tiền, không kết nối sàn và không đặt lệnh. ADR-002 dùng điều này làm căn cứ chọn mức ASVS | — |
| IN-10 | Loại review cần dùng và reviewer có thể tham gia | 03 | — | Đã xác minh | Product owner chấp nhận informal review dựa trên checklist, do agent thực hiện, ngày 2026-11-17 | — |

## 3. Điều kiện bắt đầu

| ID | Điều kiện | Thông tin liên quan | Kết quả | Ảnh hưởng nếu không đạt |
| --- | --- | --- | --- | --- |
| RC-01 | Mỗi tài liệu requirement trong phạm vi có version và truy cập được | IN-02 | Đạt | — |
| RC-02 | Tiêu chí sẵn sàng đã thống nhất trước khi review | IN-04 | Đạt | Tiêu chí được duyệt sau lần review đầu. Kết quả review được đánh giá lại theo đúng bộ tiêu chí đã duyệt |
| RC-03 | Có ít nhất một baseline độc lập với nguồn đã sinh ra requirement | IN-03, IN-05 | Đạt | — |
| RC-04 | Người giữ requirement đã được xác định và có kênh trả lời | IN-06 | Đạt | — |
| RC-05 | Nơi quản lý câu hỏi mở đã có và có quy ước ghi | IN-07 | Đạt | — |

## 4. Kết luận sẵn sàng

**Trạng thái:** Sẵn sàng

**Phần được phép làm:** Toàn bộ phạm vi

**Người quyết định / ngày:** Product owner, 2026-11-17

## References

1. <a id="ref-1"></a>[Authentication](../../../../../design/prototype/docs/requirements/authentication.md) — commit `705a1ad`, 2026-11-17
2. <a id="ref-2"></a>[Security](../../../../../architecture/23-security.md) — commit `705a1ad`, 2026-11-17
3. <a id="ref-3"></a>[Workspace](../../../../../design/prototype/docs/requirements/workspace.md) — commit `bd0ecff`, 2026-11-16
4. <a id="ref-4"></a>[Crypto Force UI Prototype](../../../../../design/prototype/README.md) — commit `dbbaafe`, 2026-11-16
5. <a id="ref-5"></a>[Architectural Decisions](../../../../../architecture/30-decisions.md) — commit `705a1ad`, 2026-11-17
6. <a id="ref-6"></a>OWASP ASVS 5.0, V6 Authentication. <https://raw.githubusercontent.com/OWASP/ASVS/master/5.0/en/0x15-V6-Authentication.md> — truy cập 2026-11-17
7. <a id="ref-7"></a>OWASP ASVS 5.0, V7 Session Management. <https://raw.githubusercontent.com/OWASP/ASVS/master/5.0/en/0x16-V7-Session-Management.md> — truy cập 2026-11-17
8. <a id="ref-8"></a>OWASP ASVS 5.0, V3 Web Frontend Security. <https://raw.githubusercontent.com/OWASP/ASVS/master/5.0/en/0x12-V3-Web-Frontend-Security.md> — truy cập 2026-11-17
9. <a id="ref-9"></a>[Open Questions](../../../../../open-questions.md) — commit `ac49066`, 2026-11-16
10. <a id="ref-10"></a>[Project Brief](../../../../../requirements/project-brief.md) — commit `16608e5`, 2026-11-15
11. <a id="ref-11"></a>[Test Strategy](../../../../../testing/test-strategy.md) — commit `705a1ad`, 2026-11-17
