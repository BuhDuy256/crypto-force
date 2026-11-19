# Test Execution: Readiness

Đọc file này để xác định thông tin và tài nguyên cần có trước khi chạy test, mức độ tin cậy của từng thông tin, và khi nào đủ điều kiện để bắt đầu.

## 1. Đợt thực thi

| Trường | Nội dung |
| --- | --- |
| Mục tiêu | [cần kiểm chứng điều gì] |
| Đối tượng được kiểm thử | [build hoặc commit dự kiến; thành phần] |
| Phạm vi | [feature, test level, test type] |
| Thời gian dự kiến | [bắt đầu – kết thúc, múi giờ] |
| Người thực hiện | [tên, vai trò hoặc CI job] |

## 2. Thông tin cần có

Một thông tin có thể đến từ nhiều nguồn, và một nguồn có thể đáp ứng nhiều thông tin. Ghi nguồn theo dạng `[[n]](#ref-n)`, chi tiết nằm ở mục [References](#references).

| ID | Thông tin cần có | Dùng cho file | Nguồn | Trạng thái | Căn cứ trạng thái | Ảnh hưởng nếu chưa xác minh |
| --- | --- | --- | --- | --- | --- | --- |
| IN-01 | Các trường ở mục 1 | 01–04 | [[n]](#ref-n) | [Đã xác minh / Giả định / Chưa có] | [vì sao xếp vào trạng thái này] | [test hoặc kết quả nào bị ảnh hưởng; chạy được đến đâu; ai xử lý và hạn xử lý] |
| IN-02 | Test basis có version, nguồn của expected result | 02, 03 | | | | |
| IN-03 | Testware có version: test case, test procedure, script, charter, kèm precondition và expected result | 02 | | | | |
| IN-04 | Test inventory: danh sách test instance (test case × dữ liệu × cấu hình) trong phạm vi, độ ưu tiên và lịch chạy | 01, 02 | | | | |
| IN-05 | Đối tượng được kiểm thử: build, danh sách thay đổi, known issues | 01, 02, 03 | | | | |
| IN-06 | Môi trường test: cấu hình, dependency, stub, mock, quyền truy cập, kết quả kiểm tra sẵn sàng | 02, 03 | | | | |
| IN-07 | Test data: data set, trạng thái tài khoản, cách khởi tạo và reset, kết quả kiểm tra sẵn sàng | 02 | | | | |
| IN-08 | Quy ước ghi kết quả: định nghĩa trạng thái, thông tin bắt buộc của một lượt chạy, mức evidence theo rủi ro, nơi lưu | 01, 02 | | | | |
| IN-09 | Quy trình xử lý defect: nơi báo cáo, triage, định nghĩa severity và priority, owner | 03 | | | | |
| IN-10 | Entry criteria, tiêu chí tạm dừng và tiêu chí tiếp tục | 01 | | | | |
| IN-11 | Coverage item và traceability từ coverage item tới test | 01 | | | | |
| IN-12 | Người xử lý blocker và người quyết định bắt đầu, tạm dừng, tiếp tục | 01 | | | | |

Bỏ các dòng không áp dụng.

Cách xếp trạng thái:

- **Đã xác minh:** nguồn truy cập được, đúng version. Với test basis và tiêu chí, người có thẩm quyền đã xác nhận. Với môi trường và test data, đã được kiểm tra thực tế, ví dụ bằng smoke test hoặc script kiểm tra, và có kết quả lưu lại.
- **Giả định:** đang dùng nhưng chưa được xác nhận. Expected result suy ra từ code hoặc prototype là giả định cho đến khi được người có thẩm quyền xác nhận.
- **Chưa có:** chưa có nguồn nào đáp ứng.

Cột "Ảnh hưởng nếu chưa xác minh" chỉ điền khi trạng thái là Giả định hoặc Chưa có.

## 3. Điều kiện bắt đầu

Mục 2 đánh giá từng thông tin. Các điều kiện dưới đây kiểm tra quan hệ giữa các thông tin và tình trạng thực tế của tài nguyên. Mỗi điều kiện tương ứng với một tiêu chí đạt của file output; điều kiện không đạt ở đây thì tiêu chí tương ứng ở output cũng không đạt.

| ID | Điều kiện | Thông tin liên quan | Kết quả | Ảnh hưởng nếu không đạt |
| --- | --- | --- | --- | --- |
| RC-01 | Build cần kiểm thử đã được xác định và triển khai vào môi trường test; build đang chạy trong môi trường khớp với build được ghi nhận | IN-01, IN-05, IN-06 | [Đạt / Không đạt / N/A] | [test hoặc kết quả nào bị ảnh hưởng; chạy được đến đâu; ai xử lý và hạn xử lý] |
| RC-02 | Testware và expected result dùng cùng version với test basis | IN-02, IN-03 | | |
| RC-03 | Môi trường và test data đã được kiểm tra thực tế, không chỉ dựa trên xác nhận bằng lời | IN-06, IN-07 | | |
| RC-04 | Mỗi test instance trong inventory có đủ testware, dữ liệu và cấu hình, hoặc được đánh dấu chưa chạy được kèm lý do | IN-03, IN-04, IN-07 | | |
| RC-05 | Quy ước ghi kết quả và quy trình xử lý defect đã thống nhất trước lượt chạy đầu tiên | IN-08, IN-09 | | |
| RC-06 | Entry criteria đạt, hoặc người có thẩm quyền đã quyết định bắt đầu khi chưa đạt | IN-10, IN-12 | | |

## 4. Kết luận sẵn sàng

**Trạng thái:** [Sẵn sàng / Sẵn sàng một phần / Chưa sẵn sàng]

- **Sẵn sàng:** mọi điều kiện ở mục 3 đạt, và không còn thông tin nào ở mục 2 ở trạng thái Giả định hoặc Chưa có.
- **Sẵn sàng một phần:** RC-01 và RC-05 đạt. Các điều kiện còn lại chỉ ảnh hưởng tới một phần inventory; chạy phần không bị ảnh hưởng và ghi phần còn lại vào cột ảnh hưởng.
- **Chưa sẵn sàng:** RC-01 hoặc RC-05 không đạt. Khi không xác định được build, kết quả không gắn được với đối tượng nào. Khi chưa thống nhất cách ghi kết quả, các lượt chạy không so sánh được với nhau và phải ghi lại.

**Phần được phép chạy:** [test instance hoặc nhóm test; hoặc "Toàn bộ inventory"]

**Người quyết định / ngày:** [tên, ngày]

## References

1. <a id="ref-1"></a>[Tên tài liệu, lấy từ heading cấp 1 của file nguồn](đường-dẫn) — [version hoặc thời điểm chốt]
