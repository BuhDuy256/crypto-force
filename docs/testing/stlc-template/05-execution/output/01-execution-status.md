# Test Execution Status

Đọc file này để biết trạng thái hiện hành của từng test instance và coverage item tại một thời điểm chốt, kết quả nào còn hiệu lực, và việc gì còn phải làm.

## 1. Phạm vi kết quả

| Trường | Nội dung |
| --- | --- |
| Version / thời điểm chốt | [version; ngày giờ, múi giờ] |
| Đối tượng được kiểm thử | [build hoặc commit; khi có nhiều build, ghi từng build và phần kết quả thuộc build đó] |
| Phạm vi | [feature, test level, test type] |
| Thời gian thực thi | [bắt đầu – kết thúc, múi giờ] |
| Người thực hiện / người tổng hợp | [tên, vai trò hoặc CI job] |
| Nguồn | [Test Log](02-test-log.md), [Defect Reports](03-defect-reports.md), [[n]](#ref-n) [test inventory] |

## 2. Trạng thái test instance

### 2.1. Quy tắc đếm

| Khái niệm | Định nghĩa |
| --- | --- |
| Test instance | Một test case version kết hợp với một bộ dữ liệu và một cấu hình; mỗi instance có ID riêng trong inventory |
| Lượt chạy | Một lần thực hiện một instance, gồm cả confirmation test sau khi sửa và rerun không có thay đổi |
| Kết quả hiện hành | Kết quả của lượt chạy hợp lệ gần nhất trên build đang đánh giá |
| Exploratory session | Đếm riêng theo charter, không quy đổi thành test instance |

Một lần rerun pass không xóa failure chưa rõ nguyên nhân trước đó; failure này vẫn được ghi ở [Defect Reports](03-defect-reports.md).

### 2.2. Số lượng theo trạng thái

| Trạng thái | Số instance | Instance IDs hoặc query |
| --- | --- | --- |
| Passed | [số] | [IDs] |
| Failed | [số] | |
| Blocked | [số] | |
| Not Run | [số] | |
| Skipped | [số] | |
| Inconclusive | [số] | |
| **Tổng** | **[số, bằng số instance trong inventory]** | |
| Exploratory session đã thực hiện / dự kiến | [số / số] | |

### 2.3. Instance chưa có kết luận

| Instance ID | Trạng thái | Lý do | Blocker / Defect ID | Owner / dự kiến chạy |
| --- | --- | --- | --- | --- |
| [ID] | [Blocked / Not Run / Skipped / Inconclusive] | [lý do cụ thể] | [ID] | [tên, ngày] |

## 3. Truy vết tới coverage item

| Coverage item ID | Test instance bắt buộc | Lượt chạy hợp lệ | Điều đã kiểm chứng | Phần chưa kiểm chứng |
| --- | --- | --- | --- | --- |
| [ID] | [Instance IDs] | [Run IDs] | [hành vi cụ thể] | [hành vi, kèm Instance hoặc Defect ID; hoặc "Không có"] |

Một coverage item chỉ được ghi là đã kiểm chứng khi mọi test instance bắt buộc của nó có kết quả hiện hành Passed và không còn anomaly chưa giải quyết liên quan tới các instance đó.

## 4. Hiệu lực kết quả

| Nhóm kết quả | Build / cấu hình | Còn hiệu lực cho build đang đánh giá | Căn cứ | Test cần chạy lại / owner |
| --- | --- | --- | --- | --- |
| [Run IDs hoặc suite] | [build; cấu hình] | [Có / Không / Một phần] | [phân tích tác động của thay đổi giữa hai build] | [Instance IDs; tên] |

Khi build thay đổi trong đợt thực thi, kết quả trên build cũ chỉ được dùng lại khi có phân tích tác động cho thấy thay đổi không ảnh hưởng tới test đó.

## 5. Tạm dừng và sai lệch

| ID | Sự kiện | Thời gian | Tiêu chí áp dụng | Ảnh hưởng | Người quyết định |
| --- | --- | --- | --- | --- | --- |
| [DV-01] | [bắt đầu khi entry criteria chưa đạt / tạm dừng / tiếp tục / đổi build / đổi lịch / dùng mock thay tích hợp thật] | [từ – đến] | [ID tiêu chí tạm dừng hoặc tiếp tục; hoặc "Không có tiêu chí"] | [instance hoặc kết quả bị ảnh hưởng] | [tên] |

## 6. Việc còn lại

| ID | Việc | Liên quan | Owner | Hạn | Nơi theo dõi |
| --- | --- | --- | --- | --- | --- |
| [TD-01] | [chạy, chạy lại, phân tích anomaly, gỡ blocker] | [Instance, Run, Defect IDs] | [tên] | [ngày] | [link] |

## 7. Tiêu chí đạt

| ID | Tiêu chí | Điều kiện đầu vào | Kết quả |
| --- | --- | --- | --- |
| Q1-01 | Thời điểm chốt và build được ghi rõ; kết quả từ nhiều build không bị gộp chung | RC-01 | [Đạt / Không đạt] |
| Q1-02 | Mỗi instance trong inventory có đúng một kết quả hiện hành; tổng ở mục 2.2 bằng số instance trong inventory | IN-04, RC-04 | |
| Q1-03 | Mọi instance chưa có kết luận có lý do và owner ở mục 2.3 | — | |
| Q1-04 | Coverage item chỉ được ghi là đã kiểm chứng khi mọi instance bắt buộc đã Passed và không còn anomaly chưa giải quyết liên quan | IN-11 | |
| Q1-05 | Kết quả trên build cũ có căn cứ còn hiệu lực, hoặc đã được đưa vào danh sách chạy lại | RC-01 | |
| Q1-06 | Mỗi lần bắt đầu khi entry criteria chưa đạt, tạm dừng hoặc tiếp tục đều dẫn tới tiêu chí áp dụng và người quyết định | IN-10, IN-12, RC-06 | |
| Q1-07 | Mọi việc còn lại có owner và nơi theo dõi | — | |

**Người review / ngày:** [tên, ngày]

## References

1. <a id="ref-1"></a>[Tên tài liệu, lấy từ heading cấp 1 của file nguồn](đường-dẫn) — [version hoặc thời điểm chốt]
