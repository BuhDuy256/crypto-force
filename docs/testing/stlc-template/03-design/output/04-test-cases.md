# Test Cases

Đọc file này để biết các test case và exploratory charter đã được thiết kế, mỗi test case phủ coverage item nào, và expected result của nó dựa trên nguồn nào.

## 1. Phạm vi

| Trường | Nội dung |
| --- | --- |
| Test model | [Test Models](03-test-models.md) [version] |
| Test basis | [[n]](#ref-n) [version] |
| Nơi lưu | [vị trí, nếu test case nằm ngoài file này] |

## 2. Test cases

| Test case ID / version | Mục tiêu | Ưu tiên | Coverage item IDs | Precondition | Input / bước | Expected result | Nguồn expected result | Data / env requirement IDs |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [TC-01; v1] | [điều cần kiểm chứng] | [mức] | [IDs] | [trạng thái hệ thống và dữ liệu trước khi chạy] | [giá trị cụ thể; bước] | [kết quả cụ thể, quan sát được] | [[n]](#ref-n) [mục hoặc ID] | [DR, ER IDs] |

Input và expected result ghi giá trị cụ thể, đủ để hai người chạy cùng test case cho ra cùng kết luận.

## 3. Exploratory charters

| Charter ID | Test condition IDs | Mục tiêu | Phạm vi và giới hạn | Tài nguyên | Timebox |
| --- | --- | --- | --- | --- | --- |
| [CHR-01] | [IDs] | [điều cần tìm hiểu hoặc rủi ro cần khám phá] | [phần được khám phá, phần không] | [data, công cụ, tài khoản] | [phút] |

## 4. Tiêu chí đạt

| ID | Tiêu chí | Điều kiện đầu vào | Kết quả |
| --- | --- | --- | --- |
| Q4-01 | Mọi coverage item trong phạm vi target có ít nhất một test case phủ, hoặc được ghi là gap ở Design Status | RC-03 | [Đạt / Không đạt] |
| Q4-02 | Expected result của mỗi test case dẫn tới nguồn có version; không expected result nào lấy từ hành vi hiện tại của sản phẩm | RC-01 | |
| Q4-03 | Precondition, input và expected result đủ cụ thể để hai người chạy cho cùng kết luận | — | |
| Q4-04 | Ưu tiên của test case lấy từ mức rủi ro của coverage item mà nó phủ | RC-02 | |
| Q4-05 | Không có hai test case phủ cùng một tập coverage item mà không có lý do; test case tái sử dụng ghi rõ version gốc | IN-07 | |
| Q4-06 | Mỗi test case có yêu cầu data và môi trường tương ứng ở file Data & Environment Requirements | — | |

**Người review / ngày:** [tên, ngày]

## References

1. <a id="ref-1"></a>[Tên tài liệu, lấy từ heading cấp 1 của file nguồn](đường-dẫn) — [version hoặc thời điểm chốt]
