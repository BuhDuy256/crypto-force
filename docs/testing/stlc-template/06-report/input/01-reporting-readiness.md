# Test Summary: Readiness

Đọc file này để xác định thông tin cần có trước khi lập Test Summary, mức độ tin cậy của từng thông tin, và khi nào đủ điều kiện để bắt đầu tổng hợp.

## 1. Báo cáo cần lập

| Trường | Nội dung |
| --- | --- |
| Câu hỏi báo cáo cần trả lời | [ví dụ: Authentication có đủ điều kiện chuyển sang UAT không] |
| Đối tượng được đánh giá | [build hoặc commit; version từng thành phần nếu cần] |
| Phạm vi báo cáo | [feature, test level, cycle hoặc release] |
| Thời điểm chốt dữ liệu | [ngày giờ và múi giờ] |
| Có gồm Closure & Handover | [Có / Không] |

## 2. Thông tin cần có

Một thông tin có thể đến từ nhiều nguồn, và một nguồn có thể đáp ứng nhiều thông tin. Ghi nguồn theo dạng `[[n]](#ref-n)`, chi tiết nằm ở mục [References](#references).

| ID | Thông tin cần có | Dùng cho file | Nguồn | Trạng thái | Căn cứ trạng thái | Ảnh hưởng nếu chưa xác minh |
| --- | --- | --- | --- | --- | --- | --- |
| IN-01 | Các trường ở mục 1: câu hỏi, đối tượng, phạm vi, thời điểm chốt | 01–06 | [[n]](#ref-n) | [Đã xác minh / Giả định / Chưa có] | [vì sao xếp vào trạng thái này] | [kết luận nào bị ảnh hưởng; kết luận được đến đâu; ai xử lý và hạn xử lý] |
| IN-02 | Test basis có version: requirement, acceptance criteria, business rule, checklist | 01, 02 | | | | |
| IN-03 | Phạm vi, phần loại trừ và thay đổi so với kế hoạch | 01, 02 | | | | |
| IN-04 | Exit criteria đã thống nhất trước khi thực thi | 01 | | | | |
| IN-05 | Danh sách coverage item và điều kiện để một item được coi là đủ test | 02 | | | | |
| IN-06 | Kết quả test và evidence trên đúng đối tượng được đánh giá | 02 | | | | |
| IN-07 | Môi trường, dữ liệu test và khác biệt so với môi trường đích | 01, 02, 04 | | | | |
| IN-08 | Defects và kết quả confirmation test tại thời điểm chốt dữ liệu | 03 | | | | |
| IN-09 | Rủi ro đã biết và các quyết định liên quan | 04 | | | | |
| IN-10 | Người có thẩm quyền quyết định bước tiếp theo và chấp nhận rủi ro | 01, 04 | | | | |
| IN-11 | Quan sát về quy trình test, kết quả retrospective | 05 | | | | |
| IN-12 | Testware, môi trường và dữ liệu cần bàn giao | 06 | | | | |
| IN-13 | Lịch, thời lượng và effort theo Test Plan, và số liệu thực tế tương ứng | 01 | | | | |

Bỏ các dòng không áp dụng, ví dụ IN-12 khi báo cáo không gồm Closure & Handover.

Cách xếp trạng thái:

- **Đã xác minh:** nguồn truy cập được, đúng version và thời điểm chốt. Với test basis và exit criteria, người có thẩm quyền đã xác nhận. Với kết quả test, kết quả được sinh từ một lần chạy có thể lặp lại hoặc có evidence lưu lại.
- **Giả định:** đang dùng nhưng chưa được xác nhận. Requirement suy ra từ code hoặc prototype là giả định cho đến khi được người có thẩm quyền xác nhận.
- **Chưa có:** chưa có nguồn nào đáp ứng.

Cột "Ảnh hưởng nếu chưa xác minh" chỉ điền khi trạng thái là Giả định hoặc Chưa có.

## 3. Điều kiện bắt đầu

Mục 2 đánh giá từng thông tin. Các điều kiện dưới đây kiểm tra quan hệ giữa các thông tin: cùng đối tượng, cùng version, cùng thời điểm chốt. Mỗi điều kiện tương ứng với một tiêu chí đạt của file output; điều kiện không đạt ở đây thì tiêu chí tương ứng ở output cũng không đạt.

| ID | Điều kiện | Thông tin liên quan | Kết quả | Ảnh hưởng nếu không đạt |
| --- | --- | --- | --- | --- |
| RC-01 | Câu hỏi quyết định, đối tượng được đánh giá và thời điểm chốt dữ liệu đã xác định | IN-01 | [Đạt / Không đạt / N/A] | [kết luận nào bị ảnh hưởng; kết luận được đến đâu; ai xử lý và hạn xử lý] |
| RC-02 | Mọi kết quả test dùng trong báo cáo thuộc đúng đối tượng được đánh giá. Kết quả từ build cũ có phân tích tác động đi kèm | IN-01, IN-06 | | |
| RC-03 | Test basis, coverage item và test đã chạy dùng cùng version | IN-02, IN-05, IN-06 | | |
| RC-04 | Exit criteria đã có trước khi thực thi. Nếu chưa có, báo cáo sẽ kết luận exit criteria là "Chưa được thiết lập" | IN-04 | | |
| RC-05 | Số liệu từ các nguồn dùng cùng đơn vị đếm và cùng thời điểm chốt, hoặc đã có cách quy đổi | IN-06, IN-08 | | |

## 4. Kết luận sẵn sàng

**Trạng thái:** [Sẵn sàng / Sẵn sàng một phần / Chưa sẵn sàng]

- **Sẵn sàng:** mọi điều kiện ở mục 3 đạt, và không còn thông tin nào ở mục 2 ở trạng thái Giả định hoặc Chưa có.
- **Sẵn sàng một phần:** RC-01 và RC-02 đạt. Các thông tin hoặc điều kiện còn lại chưa đạt đã có cột ảnh hưởng được điền. Những kết luận bị ảnh hưởng được ghi là "Chưa đủ bằng chứng" trong output, kèm ID của dòng IN hoặc RC tương ứng.
- **Chưa sẵn sàng:** RC-01 hoặc RC-02 không đạt. Khi chưa xác định được đánh giá cái gì và tại thời điểm nào, mọi số liệu trong báo cáo đều không kiểm chứng được.

**Người đánh giá / ngày:** [tên, ngày]

## References

1. <a id="ref-1"></a>[Tên tài liệu, lấy từ heading cấp 1 của file nguồn](đường-dẫn) — [version hoặc thời điểm chốt]
