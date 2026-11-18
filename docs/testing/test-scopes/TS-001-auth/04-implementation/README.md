# Phase 04: Test Implementation

Đọc file này để biết Phase 04 tạo ra kết quả gì, phục vụ ai, và dùng các template trong thư mục này theo thứ tự nào.

## Kết quả của phase

| Câu hỏi | Trả lời |
| --- | --- |
| Đạt kết quả gì | Testware cần để chạy test đã tồn tại, có version và đã được xác minh dùng được: test procedure, test script manual và automated, test suite, lịch chạy, test data và test environment. Mỗi phần truy vết được tới test case mà nó hiện thực hóa. |
| Phục vụ ai | Người chạy test cần biết chạy gì, chạy thế nào và theo thứ tự nào; người quản lý môi trường và dữ liệu cần biết tài nguyên nào phải duy trì; người review cần kiểm tra script có kiểm đúng expected result hay không. |
| Trong phạm vi | Tạo hoặc tái sử dụng testware; sắp test case thành procedure và suite; lập lịch chạy theo độ ưu tiên; tạo test data; dựng môi trường gồm stub, driver, simulator và service virtualization; xác minh testware, data và môi trường [[1, §1.4.1]](#ref-1) [[1, §1.4.3]](#ref-1). |
| Ngoài phạm vi | Thiết kế test case và expected result; khi cần sửa, đưa về nguồn chịu trách nhiệm test design. Chạy test để đánh giá sản phẩm. Phát triển chức năng sản phẩm. |
| Tiêu chuẩn đạt | Mỗi file output có mục **Tiêu chí đạt** riêng. |

## Các file

| File | Nội dung | Bắt buộc |
| --- | --- | --- |
| [input/01-implementation-readiness.md](input/01-implementation-readiness.md) | Thông tin cần có, trạng thái xác minh, điều kiện để bắt đầu tạo testware | Có |
| [output/01-implementation-status.md](output/01-implementation-status.md) | Mức sẵn sàng của từng test case, thay đổi so với test design, việc còn lại | Có |
| [output/02-procedures-and-suites.md](output/02-procedures-and-suites.md) | Test procedure, script, suite, lịch chạy, runbook và kết quả xác minh testware | Có |
| [output/03-test-data.md](output/03-test-data.md) | Test data đã chuẩn bị và kết quả kiểm tra sẵn sàng | Có |
| [output/04-test-environment.md](output/04-test-environment.md) | Thành phần môi trường đã dựng, mock và stub, kết quả kiểm tra sẵn sàng | Có |

Mỗi tiêu chí đạt trong file output ghi điều kiện đầu vào tương ứng (ID dạng `IN-xx` hoặc `RC-xx` trong file input). Điều kiện đầu vào không đạt thì tiêu chí tương ứng cũng không đạt.

## Thứ tự thực hiện

1. Điền `input/01-implementation-readiness.md` và kết luận trạng thái sẵn sàng.
2. Lập `03-test-data.md` và `04-test-environment.md`. Hai file này không phụ thuộc nhau.
3. Lập `02-procedures-and-suites.md`. Phần tạo script có thể làm song song với bước 2; phần xác minh bằng dry run cần data và môi trường đã sẵn sàng.
4. Lập `01-implementation-status.md` sau cùng, vì một test case chỉ sẵn sàng khi procedure, data và môi trường của nó đều sẵn sàng.

## References

1. <a id="ref-1"></a>[ISTQB Certified Tester Foundation Level Syllabus v4.0.1](https://www.istqb.org/wp-content/uploads/2024/11/ISTQB_CTFL_Syllabus_v4.0.1.pdf) — v4.0.1, 2024-09-15
