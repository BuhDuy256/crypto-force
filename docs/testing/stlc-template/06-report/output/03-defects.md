# Defect Summary

Đọc file này để biết tình trạng defects tại thời điểm chốt dữ liệu, những defect chưa giải quyết có ảnh hưởng lớn, và chất lượng của các bản sửa.

## 1. Phạm vi số liệu

| Trường | Nội dung |
| --- | --- |
| Đối tượng được đánh giá | [build hoặc commit] |
| Thời điểm chốt dữ liệu | [ngày giờ, múi giờ] |
| Nguồn | [[n]](#ref-n) [query của tracker] |
| Tập defect | [phát hiện trong cycle / có sẵn và liên quan release / cả hai] |
| Định nghĩa severity và priority | [[n]](#ref-n) |

## 2. Trạng thái

| Nhóm trạng thái | Số ticket | Trạng thái tương ứng trong tracker |
| --- | --- | --- |
| Open / In progress / Reopened | [số] | [tên trạng thái] |
| Fixed, chờ confirmation test | [số] | |
| Verified | [số] | |
| Deferred | [số] | |
| Rejected / Not a defect | [số] | |
| Duplicate | [số] | |
| Chờ triage | [số] | |
| **Tổng** | **[số]** | |

Mỗi ticket thuộc đúng một nhóm. Ticket ở trạng thái Closed được xếp theo lý do đóng: ticket đóng vì duplicate hoặc rejected không thuộc nhóm Verified.

| Chỉ số | Giá trị | Cách tính |
| --- | --- | --- |
| Ticket mới trong cycle / có sẵn trước cycle | [số / số] | [query] |
| Defect đã xác nhận | [số] | Tổng trừ Rejected, Duplicate và Chờ triage |
| Defect chưa giải quyết | [số] | Open + Fixed chờ confirmation test + Deferred |
| Anomaly chưa rõ nguyên nhân | [số] | [nguồn] |

## 3. Defect chưa giải quyết theo severity

| Severity | Open / In progress / Reopened | Fixed chờ confirmation test | Deferred | Tổng |
| --- | --- | --- | --- | --- |
| [mức 1] | | | | |
| [mức 2] | | | | |
| [mức 3] | | | | |

Severity là mức ảnh hưởng của defect; priority là mức khẩn cấp xử lý. Bảng này xếp theo severity; priority ghi ở mục 4.

## 4. Defect quan trọng

Tiêu chí chọn: [ví dụ: mọi defect chưa giải quyết ở hai mức severity cao nhất, và mọi defect liên quan tới một exit criterion].

| Defect ID | Hành vi sai và người dùng bị ảnh hưởng | Severity / priority | Trạng thái và evidence confirmation test | Workaround | Owner / hạn sửa |
| --- | --- | --- | --- | --- | --- |
| [ID và link] | [mô tả] | [mức / mức] | [trạng thái; run ID] | [workaround và giới hạn, hoặc "Không có"] | [tên, ngày] |

## 5. Bản sửa và regression

| Nội dung | Kết quả | Evidence |
| --- | --- | --- |
| Bản sửa có confirmation test pass | [Defect IDs] | [run IDs, build] |
| Bản sửa có confirmation test fail hoặc chưa có confirmation test | [Defect IDs] | |
| Phạm vi regression sau các bản sửa | [suite đã chạy; phần chưa chạy] | |
| Defect tái xuất hiện, failure không ổn định | [IDs; phân tích] | |

Số test fail không quy đổi trực tiếp thành số defect: một defect có thể làm nhiều test fail, và một failure có thể do test, dữ liệu hoặc môi trường.

## 6. Tiêu chí đạt

| ID | Tiêu chí | Điều kiện đầu vào | Kết quả |
| --- | --- | --- | --- |
| Q3-01 | Query và thời điểm chốt được ghi; thời điểm chốt trùng với file Execution & Coverage | RC-05 | [Đạt / Không đạt] |
| Q3-02 | Tổng các nhóm ở mục 2 bằng tổng ticket; mỗi ticket thuộc đúng một nhóm | IN-08 | |
| Q3-03 | Fixed và Verified được tách riêng; Duplicate, Rejected và Chờ triage không được tính là defect đã xác nhận | — | |
| Q3-04 | Mọi defect ở mục 4 có evidence confirmation test hoặc ghi rõ chưa có confirmation test | — | |
| Q3-05 | Failure không ổn định được ghi là anomaly, không bị bỏ qua sau một lần rerun pass | — | |

**Người review / ngày:** [tên, ngày]

## References

1. <a id="ref-1"></a>[Tên tài liệu, lấy từ heading cấp 1 của file nguồn](đường-dẫn) — [version hoặc thời điểm chốt]
