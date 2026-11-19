# Requirement Analysis: Readiness

Đọc file này để xác định thông tin cần có trước khi review requirement, mức độ tin cậy của từng thông tin, và khi nào đủ điều kiện để bắt đầu.

## 1. Đợt phân tích

| Trường | Nội dung |
| --- | --- |
| Mục tiêu | [ví dụ: xác định requirement Authentication nào đủ sẵn sàng để lập test plan và thiết kế test] |
| Phạm vi | [feature, nhóm requirement, tài liệu cần review] |
| Thời gian dự kiến | [bắt đầu – kết thúc, múi giờ] |
| Người thực hiện / reviewer | [tên hoặc vai trò] |

## 2. Thông tin cần có

Một thông tin có thể đến từ nhiều nguồn, và một nguồn có thể đáp ứng nhiều thông tin. Ghi nguồn theo dạng `[[n]](#ref-n)`, chi tiết nằm ở mục [References](#references).

| ID | Thông tin cần có | Dùng cho file | Nguồn | Trạng thái | Căn cứ trạng thái | Ảnh hưởng nếu chưa xác minh |
| --- | --- | --- | --- | --- | --- | --- |
| IN-01 | Các trường ở mục 1 | 01–03 | [[n]](#ref-n) | [Đã xác minh / Giả định / Chưa có] | [vì sao xếp vào trạng thái này] | [requirement nào bị ảnh hưởng; review được đến đâu; ai xử lý và hạn xử lý] |
| IN-02 | Tài liệu requirement có version: spec, user story, acceptance criteria, business rule, API contract, prototype | 01–03 | | | | |
| IN-03 | Nguồn gốc của từng tài liệu requirement: ai viết, viết dựa trên gì, ví dụ từ prototype hay từ code | 02 | | | | |
| IN-04 | Tiêu chí sẵn sàng đã thống nhất, ví dụ Definition of Ready hoặc checklist review | 01, 03 | | | | |
| IN-05 | Baseline độc lập: chuẩn ngành kèm version và mức áp dụng lấy từ bản gốc, hoặc use case do người chưa đọc spec viết | 02 | | | | |
| IN-06 | Người giữ requirement có thẩm quyền trả lời câu hỏi và duyệt thay đổi | 01, 03 | | | | |
| IN-07 | Nơi quản lý câu hỏi mở và quy ước ghi | 01, 03 | | | | |
| IN-08 | Implementation hoặc prototype hiện có, dùng để phát hiện khác biệt, không dùng làm nguồn của expected behavior | 01 | | | | |
| IN-09 | Ràng buộc nghiệp vụ, pháp lý hoặc quy định của domain | 02, 03 | | | | |
| IN-10 | Loại review cần dùng và reviewer có thể tham gia | 03 | | | | |

Bỏ các dòng không áp dụng.

Cách xếp trạng thái:

- **Đã xác minh:** nguồn truy cập được, đúng version. Với tiêu chí sẵn sàng và người giữ requirement, người có thẩm quyền đã xác nhận. Với chuẩn ngành, ID và mức yêu cầu lấy từ bản gốc, không lấy từ bản tóm tắt.
- **Giả định:** đang dùng nhưng chưa được xác nhận.
- **Chưa có:** chưa có nguồn nào đáp ứng.

Cột "Ảnh hưởng nếu chưa xác minh" chỉ điền khi trạng thái là Giả định hoặc Chưa có.

## 3. Điều kiện bắt đầu

Mục 2 đánh giá từng thông tin. Các điều kiện dưới đây kiểm tra quan hệ giữa các thông tin. Mỗi điều kiện tương ứng với một tiêu chí đạt của file output; điều kiện không đạt ở đây thì tiêu chí tương ứng ở output cũng không đạt.

| ID | Điều kiện | Thông tin liên quan | Kết quả | Ảnh hưởng nếu không đạt |
| --- | --- | --- | --- | --- |
| RC-01 | Mỗi tài liệu requirement trong phạm vi có version và truy cập được | IN-02 | [Đạt / Không đạt / N/A] | [requirement nào bị ảnh hưởng; review được đến đâu; ai xử lý và hạn xử lý] |
| RC-02 | Tiêu chí sẵn sàng đã thống nhất trước khi review | IN-04 | | |
| RC-03 | Có ít nhất một baseline độc lập với nguồn đã sinh ra requirement | IN-03, IN-05 | | |
| RC-04 | Người giữ requirement đã được xác định và có kênh trả lời | IN-06 | | |
| RC-05 | Nơi quản lý câu hỏi mở đã có và có quy ước ghi | IN-07 | | |

## 4. Kết luận sẵn sàng

**Trạng thái:** [Sẵn sàng / Sẵn sàng một phần / Chưa sẵn sàng]

- **Sẵn sàng:** mọi điều kiện ở mục 3 đạt, và không còn thông tin nào ở mục 2 ở trạng thái Giả định hoặc Chưa có.
- **Sẵn sàng một phần:** RC-01 đạt cho phần tài liệu sẽ review. Các điều kiện còn lại chưa đạt đã có cột ảnh hưởng được điền.
- **Chưa sẵn sàng:** RC-01 không đạt cho mọi tài liệu. Khi tài liệu không có version, finding không gắn được với nội dung cụ thể nào và không kiểm tra lại được sau khi sửa.

**Phần được phép làm:** [tài liệu hoặc nhóm requirement; hoặc "Toàn bộ phạm vi"]

**Người quyết định / ngày:** [tên, ngày]

## References

1. <a id="ref-1"></a>[Tên tài liệu, lấy từ heading cấp 1 của file nguồn](đường-dẫn) — [version hoặc thời điểm chốt]
