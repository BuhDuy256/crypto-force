# Test Analysis & Design: Readiness

Đọc file này để xác định thông tin cần có trước khi phân tích test basis và thiết kế test, mức độ tin cậy của từng thông tin, và khi nào đủ điều kiện để bắt đầu.

## 1. Đợt thiết kế

| Trường | Nội dung |
| --- | --- |
| Mục tiêu | [cần thiết kế test để kiểm chứng điều gì] |
| Phạm vi | [feature, test level, test type] |
| Thời gian dự kiến | [bắt đầu – kết thúc, múi giờ] |
| Người thực hiện / người review | [tên hoặc vai trò] |

## 2. Thông tin cần có

Một thông tin có thể đến từ nhiều nguồn, và một nguồn có thể đáp ứng nhiều thông tin. Ghi nguồn theo dạng `[[n]](#ref-n)`, chi tiết nằm ở mục [References](#references).

| ID | Thông tin cần có | Dùng cho file | Nguồn | Trạng thái | Căn cứ trạng thái | Ảnh hưởng nếu chưa xác minh |
| --- | --- | --- | --- | --- | --- | --- |
| IN-01 | Các trường ở mục 1 | 01–05 | [[n]](#ref-n) | [Đã xác minh / Giả định / Chưa có] | [vì sao xếp vào trạng thái này] | [phần thiết kế nào bị ảnh hưởng; làm được đến đâu; ai xử lý và hạn xử lý] |
| IN-02 | Test basis có version: requirement, acceptance criteria, business rule, API contract, UI spec | 01–04 | | | | |
| IN-03 | Mức rủi ro của từng test basis item hoặc từng feature | 02–04 | | | | |
| IN-04 | Test approach từ Test Plan: test level, test type, technique hoặc coverage criterion yêu cầu, coverage target | 01, 03 | | | | |
| IN-05 | Baseline độc lập với nguồn sinh ra test basis: chuẩn ngành kèm version và mức áp dụng, hoặc use case viết độc lập | 02 | | | | |
| IN-06 | Thông tin về test object cần cho technique cụ thể: code cho white-box, state model, kiến trúc tích hợp | 03 | | | | |
| IN-07 | Test case và test model hiện có có thể tái sử dụng, kèm version | 03, 04 | | | | |
| IN-08 | Quy ước đặt ID, định dạng test case, nơi lưu | 02–05 | | | | |
| IN-09 | Người có thẩm quyền trả lời câu hỏi về test basis và nơi báo lỗi test basis | 02, 03 | | | | |
| IN-10 | Ràng buộc đã biết về test data và môi trường, ví dụ dịch vụ ngoài không dùng được khi test | 05 | | | | |

Bỏ các dòng không áp dụng, ví dụ IN-06 khi không dùng white-box hoặc state transition.

Cách xếp trạng thái:

- **Đã xác minh:** nguồn truy cập được, đúng version. Với test basis, người có thẩm quyền đã xác nhận. Với chuẩn ngành, ID và mức yêu cầu lấy từ bản gốc, không lấy từ bản tóm tắt.
- **Giả định:** đang dùng nhưng chưa được xác nhận. Requirement suy ra từ code hoặc prototype là giả định cho đến khi được người có thẩm quyền xác nhận.
- **Chưa có:** chưa có nguồn nào đáp ứng.

Cột "Ảnh hưởng nếu chưa xác minh" chỉ điền khi trạng thái là Giả định hoặc Chưa có.

## 3. Điều kiện bắt đầu

Mục 2 đánh giá từng thông tin. Các điều kiện dưới đây kiểm tra quan hệ giữa các thông tin. Mỗi điều kiện tương ứng với một tiêu chí đạt của file output; điều kiện không đạt ở đây thì tiêu chí tương ứng ở output cũng không đạt.

| ID | Điều kiện | Thông tin liên quan | Kết quả | Ảnh hưởng nếu không đạt |
| --- | --- | --- | --- | --- |
| RC-01 | Mỗi test basis item trong phạm vi có version và đã được xác nhận, hoặc được đánh dấu là giả định | IN-02 | [Đạt / Không đạt / N/A] | [phần thiết kế nào bị ảnh hưởng; làm được đến đâu; ai xử lý và hạn xử lý] |
| RC-02 | Mỗi test basis item trong phạm vi có mức rủi ro | IN-02, IN-03 | | |
| RC-03 | Test Plan xác định coverage criterion và coverage target theo rủi ro, hoặc người có thẩm quyền đã quyết định thay thế | IN-04 | | |
| RC-04 | Phần phạm vi có chuẩn ngành áp dụng đã có baseline độc lập với version và mức áp dụng | IN-05 | | |
| RC-05 | Đã có người trả lời câu hỏi về test basis và nơi báo lỗi test basis | IN-09 | | |

## 4. Kết luận sẵn sàng

**Trạng thái:** [Sẵn sàng / Sẵn sàng một phần / Chưa sẵn sàng]

- **Sẵn sàng:** mọi điều kiện ở mục 3 đạt, và không còn thông tin nào ở mục 2 ở trạng thái Giả định hoặc Chưa có.
- **Sẵn sàng một phần:** RC-01 đạt cho phần test basis sẽ làm. Các điều kiện còn lại chỉ ảnh hưởng tới một phần phạm vi; làm phần không bị ảnh hưởng và ghi phần còn lại vào cột ảnh hưởng.
- **Chưa sẵn sàng:** RC-01 không đạt cho mọi test basis item. Khi không có test basis có version, expected result của test case không có nguồn để đối chiếu.

**Phần được phép làm:** [test basis item hoặc feature; hoặc "Toàn bộ phạm vi"]

**Người quyết định / ngày:** [tên, ngày]

## References

1. <a id="ref-1"></a>[Tên tài liệu, lấy từ heading cấp 1 của file nguồn](đường-dẫn) — [version hoặc thời điểm chốt]
