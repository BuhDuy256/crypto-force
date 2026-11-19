# Test Data

Đọc file này để biết test data nào đã được chuẩn bị, mỗi bộ dữ liệu đáp ứng yêu cầu nào, cách khởi tạo và reset, và kết quả kiểm tra sẵn sàng.

## 1. Phạm vi

| Trường | Nội dung |
| --- | --- |
| Yêu cầu test data | [[n]](#ref-n) [version] |
| Nơi lưu data, fixture, generator | [vị trí] |
| Snapshot | [commit, tag hoặc version] |
| Thời điểm kiểm tra | [ngày giờ, múi giờ] |

## 2. Bộ dữ liệu

| Data ID / version | Yêu cầu đáp ứng | Test case IDs | Partition, boundary, trạng thái hoặc khối lượng đã tạo | Dạng | Khởi tạo / reset / cô lập | Hạn dùng | Owner |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [DA-01] | [ID yêu cầu] | [IDs] | [nội dung cụ thể] | [Đã tồn tại / Chỉ có generator, cần chạy trước test] | [lệnh hoặc cách làm; cách tránh test chạy song song dùng chung dữ liệu] | [ngày hết hạn, token có thời hạn; hoặc "Không có"] | [tên] |

Không ghi mật khẩu, token hoặc dữ liệu cá nhân thật; chỉ dẫn tới nơi quản lý quyền truy cập.

## 3. Kiểm tra sẵn sàng

| Data ID | Đặc tính đã kiểm tra | Cách kiểm tra | Kết quả | Evidence / ngày |
| --- | --- | --- | --- | --- |
| [DA-01] | [đặc tính theo yêu cầu, ví dụ: tài khoản ở trạng thái chưa xác minh email] | [query, script, chạy thử reset] | [Đạt / Không đạt] | [link; ngày] |

Kiểm tra đặc tính của dữ liệu theo yêu cầu, không chỉ kiểm tra file hoặc bảng có tồn tại.

## 4. Tiêu chí đạt

| ID | Tiêu chí | Điều kiện đầu vào | Kết quả |
| --- | --- | --- | --- |
| Q3-01 | Mỗi yêu cầu test data có bộ dữ liệu tương ứng, hoặc được ghi là thiếu ở Implementation Status | RC-03 | [Đạt / Không đạt] |
| Q3-02 | Đặc tính của mỗi bộ dữ liệu đã được kiểm tra theo yêu cầu và có evidence | IN-05 | |
| Q3-03 | Cách khởi tạo, reset và cô lập được ghi và đã chạy thử | IN-05 | |
| Q3-04 | Dữ liệu chỉ có generator được đánh dấu rõ, và bước chạy generator có trong runbook | — | |
| Q3-05 | Dữ liệu có thời hạn được ghi hạn dùng | — | |
| Q3-06 | Không có secrets hoặc dữ liệu cá nhân thật trong data và trong file này | — | |

**Người review / ngày:** [tên, ngày]

## References

1. <a id="ref-1"></a>[Tên tài liệu, lấy từ heading cấp 1 của file nguồn](đường-dẫn) — [version hoặc thời điểm chốt]
