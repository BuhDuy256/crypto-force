# Test Implementation Status

Đọc file này để biết từng test case trong phạm vi đã có đủ testware, data và môi trường để chạy hay chưa, testware khác test design ở đâu, và việc gì còn phải làm.

## 1. Phạm vi

| Trường | Nội dung |
| --- | --- |
| Version / thời điểm chốt | [version; ngày giờ, múi giờ] |
| Phạm vi | [feature, test level, test type] |
| Test design được hiện thực hóa | [[n]](#ref-n) [version] |
| Snapshot testware | [commit, tag hoặc version cố định] |
| Build hoặc interface dùng để xác minh | [build; hoặc "Chưa có build", xác minh theo contract [[n]](#ref-n)] |
| Người thực hiện / người review | [tên hoặc vai trò] |
| File chi tiết | [Procedures & Suites](02-procedures-and-suites.md), [Test Data](03-test-data.md), [Test Environment](04-test-environment.md) |

## 2. Mức sẵn sàng theo test case

| Test case ID / version | Coverage items | Procedure / script | Suite | Data IDs | Env IDs | Trạng thái | Phần thiếu |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [ID; version] | [IDs] | [ID] | [ID] | [IDs] | [IDs] | [trạng thái] | [mô tả, kèm Change ID nếu có; hoặc "Không có"] |

| Trạng thái | Định nghĩa |
| --- | --- |
| Sẵn sàng | Procedure hoặc script đã được xác minh, data và môi trường liên quan đã được kiểm tra sẵn sàng |
| Đã tạo, chưa xác minh | Có procedure hoặc script, nhưng chưa xác minh hoặc data, môi trường chưa sẵn sàng |
| Một phần | Chỉ hiện thực hóa được một phần các bước hoặc dữ liệu của test case |
| Chưa triển khai | Chưa có testware |
| Bị chặn | Không thể làm tiếp vì một trở ngại đã xác định |
| Hoãn | Có quyết định hoãn, kèm người quyết định |

| Trạng thái | Số test case |
| --- | --- |
| Sẵn sàng | [số] |
| Đã tạo, chưa xác minh | [số] |
| Một phần | [số] |
| Chưa triển khai | [số] |
| Bị chặn | [số] |
| Hoãn | [số] |
| **Tổng** | **[số, bằng số test case trong phạm vi]** |

## 3. Thay đổi so với test design

Mỗi dòng phải đọc được mà không cần mở file khác: người review thấy test design ghi gì, vì sao không làm được đúng như vậy, đã làm gì thay, và vì sao cách mới vẫn kiểm đúng expected result. Trước khi ghi một thay đổi, thử sửa môi trường test (biến môi trường, server thứ hai, database riêng) để làm đúng test design. Chỉ ghi thay đổi khi môi trường không sửa được, hoặc khi chính test design mâu thuẫn với test basis.

| Change ID | Test case ID | Test design ghi | Vấn đề khi làm đúng như vậy | Thay đổi | Vì sao vẫn kiểm đúng expected result | Người xác nhận, ngày | Nguồn đã được cập nhật |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [CH-01] | [ID] | [precondition hoặc bước, trích từ test case] | [điều gì chặn, kèm nguồn: test basis, công cụ hoặc môi trường] | [bước, dữ liệu hoặc precondition mới] | [hành vi nào vẫn được kiểm; phần nào không còn kiểm, nếu có] | [tên, ngày] | [[n]](#ref-n) [hoặc "Chưa cập nhật"] |

Expected result chỉ thay đổi khi người có thẩm quyền về test design xác nhận, không thay đổi để khớp với hành vi hiện tại của sản phẩm. Ghi "Không có" nếu testware đúng với test design.

## 4. Việc còn lại và điều kiện khi chạy

| ID | Việc | Test case liên quan | Owner | Hạn | Nơi theo dõi |
| --- | --- | --- | --- | --- | --- |
| [TD-01] | [việc cụ thể] | [IDs] | [tên] | [ngày] | [link] |

**Điều kiện cần kiểm tra lại khi chạy test:** [ví dụ: build mới thay đổi selector, test data hết hạn, quyền truy cập dịch vụ ngoài; hoặc "Không có"]

## 5. Tiêu chí đạt

| ID | Tiêu chí | Điều kiện đầu vào | Kết quả |
| --- | --- | --- | --- |
| Q1-01 | Version của test design và snapshot testware được ghi rõ | RC-02 | [Đạt / Không đạt] |
| Q1-02 | Mỗi test case trong phạm vi có một dòng ở mục 2; tổng ở bảng số lượng bằng số test case trong phạm vi | IN-01, IN-02 | |
| Q1-03 | Test case chỉ được ghi Sẵn sàng khi procedure, data và môi trường liên quan đều đạt tiêu chí của file 02, 03, 04 | — | |
| Q1-04 | Mọi thay đổi expected result có người xác nhận; không expected result nào được đổi để khớp hành vi hiện tại | RC-01, IN-12 | |
| Q1-05 | Mọi test case chưa Sẵn sàng có phần thiếu được mô tả và có việc tương ứng ở mục 4 | — | |
| Q1-06 | Điều kiện cần kiểm tra lại khi chạy test được ghi, hoặc ghi "Không có" | — | |

**Người review / ngày:** [tên, ngày]

## References

1. <a id="ref-1"></a>[Tên tài liệu, lấy từ heading cấp 1 của file nguồn](đường-dẫn) — [version hoặc thời điểm chốt]
