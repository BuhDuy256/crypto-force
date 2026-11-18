# Test Environment

Đọc file này để biết môi trường test gồm những thành phần nào, thành phần nào là thật và thành phần nào được mock, cách dựng và reset, và kết quả kiểm tra sẵn sàng.

## 1. Phạm vi

| Trường | Nội dung |
| --- | --- |
| Yêu cầu môi trường | [[n]](#ref-n) [version] |
| Cấu hình môi trường | [file cấu hình, IaC, Docker Compose; commit hoặc version] |
| Thời điểm kiểm tra | [ngày giờ, múi giờ] |

## 2. Thành phần môi trường

| Env ID | Thành phần | Version / cấu hình thực tế | Loại | Hành vi được mô phỏng / không đại diện | Dựng và reset | Nơi truy cập | Owner |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [ENV-01] | [database, API, dịch vụ email, công cụ test] | [version đang chạy, không phải version dự kiến] | [Thật / Mock / Stub / Driver / Simulator / Service virtualization] | [với mock, stub: hành vi nào được mô phỏng và hành vi nào không; với thành phần thật: "N/A"] | [lệnh hoặc cách làm] | [URL, host; nơi lấy quyền truy cập] | [tên] |

## 3. Kiểm tra sẵn sàng

| Env ID | Cách kiểm tra | Kết quả | Evidence / ngày |
| --- | --- | --- | --- |
| [ENV-01] | [health check, smoke test, chạy thử reset] | [Đạt / Không đạt] | [link; ngày] |

Cấu hình đã viết nhưng chưa được dựng thì ghi Không đạt, không ghi là môi trường đã hoạt động.

Với mock, stub, driver, simulator: làm hỏng một lần hành vi mà thành phần thay thế (mutant hoặc lỗi đã biết), chạy test dùng thành phần đó, và ghi vào cột Cách kiểm tra `Kiểm bằng lỗi: <lỗi>; <test nào fail>`. Ví dụ: một driver "khởi động lại API" phải làm mất bộ đếm trong bộ nhớ; với mutant để bộ đếm trong bộ nhớ, test khởi động lại phải fail. Chưa làm bước này thì ghi Không đạt. `pnpm check:docs` kiểm tra điều này.

## 4. Khác biệt so với môi trường đích

| Khác biệt | Env IDs | Ảnh hưởng tới kết quả test |
| --- | --- | --- |
| [ví dụ: email gửi vào inbox giả thay vì Resend] | [IDs] | [loại lỗi mà test trên môi trường này không phát hiện được] |

## 5. Tiêu chí đạt

| ID | Tiêu chí | Điều kiện đầu vào | Kết quả |
| --- | --- | --- | --- |
| Q4-01 | Mỗi yêu cầu môi trường có thành phần tương ứng, hoặc được ghi là thiếu ở Implementation Status | RC-03 | [Đạt / Không đạt] |
| Q4-02 | Version và cấu hình ghi theo thực tế đang chạy | IN-06 | |
| Q4-03 | Mỗi mock, stub, driver, simulator ghi rõ hành vi được mô phỏng và hành vi không đại diện | IN-06 | |
| Q4-04 | Mỗi thành phần đã được kiểm tra bằng cách chạy thực tế và có evidence | — | |
| Q4-05 | Khác biệt so với môi trường đích được ghi kèm ảnh hưởng | — | |
| Q4-06 | Không có secrets trong file này | — | |
| Q4-07 | Mỗi mock, stub, driver, simulator ghi Đạt có `Kiểm bằng lỗi:` | — | |

**Người review / ngày:** [tên, ngày]

## References

1. <a id="ref-1"></a>[Tên tài liệu, lấy từ heading cấp 1 của file nguồn](đường-dẫn) — [version hoặc thời điểm chốt]
