# Test Data & Environment Requirements

Đọc file này để biết các test case cần dữ liệu và môi trường có đặc điểm gì, ai chịu trách nhiệm, cần trong bao lâu, và cách reset.

## 1. Yêu cầu test data

| Data requirement ID | Test case IDs | Mô tả | Người chịu trách nhiệm | Thời gian cần | Yêu cầu reset | Lưu trữ hoặc huỷ |
| --- | --- | --- | --- | --- | --- | --- |
| [DR-01] | [IDs] | [đặc điểm cần có: partition, trạng thái, khối lượng; không chỉ tên file] | [tên hoặc vai trò] | [từ – đến, hoặc theo cycle] | [reset trước mỗi test / mỗi suite / không cần; yêu cầu cô lập khi chạy song song] | [giữ lại / xoá sau khi dùng] |

## 2. Yêu cầu môi trường

| Env requirement ID | Test case IDs | Thành phần | Mô tả | Thật / được phép mock | Người chịu trách nhiệm | Thời gian cần |
| --- | --- | --- | --- | --- | --- | --- |
| [ER-01] | [IDs] | [database, API, dịch vụ ngoài, công cụ] | [cấu hình, version, khả năng cần có] | [Thật / Mock được, kèm hành vi thật bị mất khi mock] | [tên hoặc vai trò] | [từ – đến] |

## 3. Tiêu chí đạt

| ID | Tiêu chí | Điều kiện đầu vào | Kết quả |
| --- | --- | --- | --- |
| Q5-01 | Mọi yêu cầu data và môi trường của test case trong file Test Cases có dòng tương ứng ở đây | — | [Đạt / Không đạt] |
| Q5-02 | Yêu cầu data mô tả đặc điểm cần có của dữ liệu, không chỉ tên file hoặc bảng | — | |
| Q5-03 | Mỗi yêu cầu có người chịu trách nhiệm, thời gian cần và yêu cầu reset | — | |
| Q5-04 | Thành phần được phép mock ghi rõ hành vi thật bị mất khi mock, và ràng buộc đã biết được phản ánh | IN-10 | |
| Q5-05 | Không có secrets hoặc dữ liệu cá nhân thật trong file này | — | |

**Người review / ngày:** [tên, ngày]

## References

1. <a id="ref-1"></a>[Tên tài liệu, lấy từ heading cấp 1 của file nguồn](đường-dẫn) — [version hoặc thời điểm chốt]
