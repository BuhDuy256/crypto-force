# Test Planning: Readiness

Đọc file này để xác định thông tin cần có trước khi lập test plan, mức độ tin cậy của từng thông tin, và khi nào đủ điều kiện để bắt đầu.

## 1. Kế hoạch cần lập

| Trường | Nội dung |
| --- | --- |
| Mục tiêu của đợt kiểm thử | [ví dụ: đánh giá Authentication trước khi chuyển sang UAT] |
| Phạm vi dự kiến | [feature, release, iteration] |
| Mốc thời gian liên quan | [release, iteration, milestone] |
| Người lập / người duyệt | [tên hoặc vai trò] |

## 2. Thông tin cần có

Một thông tin có thể đến từ nhiều nguồn, và một nguồn có thể đáp ứng nhiều thông tin. Ghi nguồn theo dạng `[[n]](#ref-n)`, chi tiết nằm ở mục [References](#references).

| ID | Thông tin cần có | Dùng cho file | Nguồn | Trạng thái | Căn cứ trạng thái | Ảnh hưởng nếu chưa xác minh |
| --- | --- | --- | --- | --- | --- | --- |
| IN-01 | Các trường ở mục 1 | 01–05 | [[n]](#ref-n) | [Đã xác minh / Giả định / Chưa có] | [vì sao xếp vào trạng thái này] | [phần kế hoạch nào bị ảnh hưởng; lập được đến đâu; ai xử lý và hạn xử lý] |
| IN-02 | Test basis có version và trạng thái của từng item, ví dụ Ready hoặc còn câu hỏi mở | 01, 02 | | | | |
| IN-03 | Test policy hoặc test strategy của tổ chức, dự án; quy ước testing đã có | 03 | | | | |
| IN-04 | Stakeholder: người duyệt plan, người duyệt exit criteria, risk owner, kỳ vọng chất lượng | 01, 02, 04 | | | | |
| IN-05 | Kiến trúc, thành phần và tích hợp với hệ thống ngoài | 02, 03 | | | | |
| IN-06 | Ràng buộc: thời gian, người, ngân sách, công cụ, môi trường, dịch vụ ngoài | 01, 03, 05 | | | | |
| IN-07 | Dữ liệu lịch sử: defect trước đây, số liệu effort, estimate của dự án tương tự | 02, 05 | | | | |
| IN-08 | Nguồn rủi ro đã biết: câu hỏi mở, gap requirement, khác biệt giữa code và spec, sự cố trước đây | 02 | | | | |
| IN-09 | Testware và hạ tầng test hiện có: framework, CI, test đã viết | 03, 05 | | | | |
| IN-10 | Kế hoạch phát triển và release: mốc bàn giao build, iteration | 05 | | | | |
| IN-11 | Chuẩn hoặc quy định bắt buộc, kèm version và mức áp dụng, ví dụ OWASP ASVS, WCAG | 02, 03, 04 | | | | |

Bỏ các dòng không áp dụng.

Cách xếp trạng thái:

- **Đã xác minh:** nguồn truy cập được, đúng version. Với test basis, stakeholder và ràng buộc, người có thẩm quyền đã xác nhận. Với chuẩn, ID và mức yêu cầu lấy từ bản gốc, không lấy từ bản tóm tắt.
- **Giả định:** đang dùng nhưng chưa được xác nhận.
- **Chưa có:** chưa có nguồn nào đáp ứng.

Cột "Ảnh hưởng nếu chưa xác minh" chỉ điền khi trạng thái là Giả định hoặc Chưa có.

## 3. Điều kiện bắt đầu

Mục 2 đánh giá từng thông tin. Các điều kiện dưới đây kiểm tra quan hệ giữa các thông tin. Mỗi điều kiện tương ứng với một tiêu chí đạt của file output; điều kiện không đạt ở đây thì tiêu chí tương ứng ở output cũng không đạt.

| ID | Điều kiện | Thông tin liên quan | Kết quả | Ảnh hưởng nếu không đạt |
| --- | --- | --- | --- | --- |
| RC-01 | Ranh giới phạm vi đã xác định: các test basis item thuộc phạm vi được liệt kê kèm version | IN-01, IN-02 | [Đạt / Không đạt / N/A] | [phần kế hoạch nào bị ảnh hưởng; lập được đến đâu; ai xử lý và hạn xử lý] |
| RC-02 | Đã xác định người duyệt plan, người duyệt exit criteria và risk owner | IN-04 | | |
| RC-03 | Ràng buộc về thời gian, người và môi trường có nguồn, không chỉ là giả định của người lập plan | IN-06, IN-10 | | |
| RC-04 | Chuẩn bắt buộc đã xác định version và mức áp dụng từ bản gốc | IN-11 | | |
| RC-05 | Thông tin kiến trúc đủ để xác định ranh giới giữa các test level và các điểm tích hợp | IN-05 | | |

## 4. Kết luận sẵn sàng

**Trạng thái:** [Sẵn sàng / Sẵn sàng một phần / Chưa sẵn sàng]

- **Sẵn sàng:** mọi điều kiện ở mục 3 đạt, và không còn thông tin nào ở mục 2 ở trạng thái Giả định hoặc Chưa có.
- **Sẵn sàng một phần:** RC-01 đạt. Các điều kiện còn lại chưa đạt đã có cột ảnh hưởng được điền; phần kế hoạch bị ảnh hưởng được ghi là giả định trong test plan.
- **Chưa sẵn sàng:** RC-01 không đạt. Khi chưa biết phạm vi, không xác định được rủi ro, approach hay estimate cho cái gì.

**Người quyết định / ngày:** [tên, ngày]

## References

1. <a id="ref-1"></a>[Tên tài liệu, lấy từ heading cấp 1 của file nguồn](đường-dẫn) — [version hoặc thời điểm chốt]
