# Test Procedures & Suites

Đọc file này để biết các test procedure, script và suite đã được tạo, cách chạy chúng theo thứ tự nào, và bằng chứng cho thấy chúng kiểm đúng expected result.

## 1. Phạm vi

| Trường | Nội dung |
| --- | --- |
| Nơi lưu testware | [repository, thư mục] |
| Snapshot | [commit, tag hoặc version] |
| Framework và công cụ | [tên, version] |
| Test design được hiện thực hóa | [[n]](#ref-n) [version] |

## 2. Procedures và scripts

| Procedure ID | Test case IDs theo thứ tự chạy | Mục tiêu | Ưu tiên | Loại | Khởi đầu | Kết thúc và dọn dẹp | Vị trí / version | Verification IDs |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [PROC-01] | [TC IDs] | [điều cần kiểm chứng] | [mức, theo IN-04] | [Manual / Automated / Exploratory charter] | [precondition, setup] | [cleanup, trả tài nguyên] | [đường dẫn; version] | [VF IDs] |

Exploratory charter ghi mục tiêu, giới hạn, tài nguyên và cách ghi session, không cần các bước cố định.

## 3. Suites

| Suite ID | Cách chọn test | Data / cấu hình | Thứ tự, phụ thuộc, chạy song song | Lệnh chạy |
| --- | --- | --- | --- | --- |
| [SU-01] | [danh sách Procedure IDs, tag hoặc query] | [Data IDs; cấu hình] | [độc lập / cần thứ tự; số worker] | [lệnh cụ thể] |

**Chính sách retry:** [có retry không, số lần, điều kiện]. Lượt chạy fail trước khi retry vẫn được ghi lại; retry không được dùng để che failure.

## 4. Lịch chạy

| Batch | Suite / procedure IDs | Điều kiện bắt đầu | Thứ tự / thời gian dự kiến | Môi trường | Căn cứ ưu tiên |
| --- | --- | --- | --- | --- | --- |
| [B-01] | [IDs] | [phụ thuộc, build cần có] | [thứ tự; thời lượng ước lượng] | [Env IDs] | [mức rủi ro, [[n]](#ref-n)] |

Với CI, lịch có thể là trigger và thứ tự job trong pipeline thay cho ngày giờ cố định.

## 5. Runbook

| Việc | Hướng dẫn |
| --- | --- |
| Lấy đúng version và cài dependency | [lệnh; working directory; version runtime] |
| Cấu hình và quyền truy cập | [biến cấu hình cần có; nơi lấy secrets] |
| Chuẩn bị và reset data, môi trường | [lệnh hoặc link tới [Test Data](03-test-data.md), [Test Environment](04-test-environment.md)] |
| Chạy toàn bộ, chạy một phần, chạy manual | [lệnh; cách chọn suite hoặc test] |
| Đọc kết quả và lấy evidence | [nơi xuất report, log, trace; cách gắn với Run ID] |
| Dừng, chạy lại, xử lý lượt chạy dở | [cách giữ evidence của failure trước khi chạy lại] |
| Dọn dẹp | [lệnh hoặc bước] |

Runbook không chứa secrets; chỉ dẫn tới nơi quản lý chúng.

## 6. Xác minh testware

| Verification ID | Procedure / suite | Cách xác minh | Kết quả | Evidence |
| --- | --- | --- | --- | --- |
| [VF-01] | [IDs] | [review với test case, lint và typecheck, dry run, cố ý tạo sai lệch để xác nhận assertion fail] | [Đạt / Không đạt / Chưa đủ bằng chứng] | [link] |

Script chạy không lỗi chưa chứng minh script kiểm đúng. Với assertion quan trọng, xác nhận rằng test fail khi hành vi lệch khỏi expected result. Dấu hiệu lỗi sản phẩm phát hiện khi dry run được báo theo quy trình xử lý defect; kết quả dry run không thay cho kết quả chạy test chính thức.

## 7. Tiêu chí đạt

| ID | Tiêu chí | Điều kiện đầu vào | Kết quả |
| --- | --- | --- | --- |
| Q2-01 | Mỗi procedure có mục tiêu, ưu tiên, test case theo thứ tự, bước khởi đầu, bước kết thúc và vị trí có version theo quy ước lưu testware | IN-02, IN-09 | [Đạt / Không đạt] |
| Q2-02 | Assertion khớp expected result của đúng version test case; assertion quan trọng đã được xác nhận fail khi hành vi sai | RC-01 | |
| Q2-03 | Script dùng điểm truy cập đã xác định trong contract hoặc test ID, không dựa vào chi tiết nội bộ dễ thay đổi | RC-04 | |
| Q2-04 | Kết quả và evidence được xuất theo quy ước ghi kết quả đã thống nhất | RC-06 | |
| Q2-05 | Testware tái sử dụng đã được chạy thử trên version hiện tại | RC-05 | |
| Q2-06 | Cách chọn test của mỗi suite lặp lại được; thứ tự và phụ thuộc giữa test được khai báo | IN-10 | |
| Q2-07 | Chính sách retry được khai báo; lượt fail trước retry vẫn được ghi lại | — | |
| Q2-08 | Lịch chạy sắp theo độ ưu tiên có nguồn | IN-04, IN-10 | |
| Q2-09 | Người khác tác giả chạy được testware chỉ bằng runbook; runbook không chứa secrets | — | |

**Người review / ngày:** [tên, ngày]

## References

1. <a id="ref-1"></a>[Tên tài liệu, lấy từ heading cấp 1 của file nguồn](đường-dẫn) — [version hoặc thời điểm chốt]
