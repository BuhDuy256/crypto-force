# Requirement Readiness

Đọc file này để biết từng requirement trong phạm vi đã đủ sẵn sàng để lập kế hoạch và thiết kế test hay chưa, vì sao, và requirement khác implementation hiện có ở đâu.

## 1. Phạm vi

| Trường | Nội dung |
| --- | --- |
| Version / thời điểm chốt | [version; ngày giờ, múi giờ] |
| Tài liệu requirement | [[n]](#ref-n) [version] |
| Tiêu chí sẵn sàng | [[n]](#ref-n) [version] |
| Người thực hiện / người review | [tên hoặc vai trò] |
| File chi tiết | [Baseline Comparison](02-baseline-comparison.md), [Review Findings](03-review-findings.md) |

## 2. Tiêu chí sẵn sàng

| Criterion ID | Tiêu chí | Nguồn |
| --- | --- | --- |
| [RD-01] | [ví dụ: có ID duy nhất; expected behavior kiểm chứng được; không mâu thuẫn với requirement khác; có luồng thay thế và ngoại lệ; giá trị cụ thể có nguồn] | [[n]](#ref-n) |

## 3. Trạng thái từng requirement

| Requirement ID / version | Tiêu chí chưa đạt | Finding IDs | Câu hỏi mở | Trạng thái | Owner |
| --- | --- | --- | --- | --- | --- |
| [ID; version] | [Criterion IDs; hoặc "Không có"] | [IDs] | [link `open-questions.md#oq-xxx`] | [trạng thái] | [tên] |

| Trạng thái | Định nghĩa |
| --- | --- |
| Ready | Đạt mọi tiêu chí sẵn sàng |
| Ready với giả định | Chưa đạt một tiêu chí, người giữ requirement đã chấp nhận giả định cụ thể; giả định được ghi ở finding tương ứng |
| Chờ câu hỏi mở | Chưa xác định được expected behavior cho đến khi câu hỏi mở được chốt |
| Chưa Ready | Có finding chưa được xử lý |
| Ngoài phạm vi | Có quyết định loại khỏi phạm vi, kèm người quyết định |

| Trạng thái | Số requirement |
| --- | --- |
| Ready | [số] |
| Ready với giả định | [số] |
| Chờ câu hỏi mở | [số] |
| Chưa Ready | [số] |
| Ngoài phạm vi | [số] |
| **Tổng** | **[số, bằng số requirement trong tài liệu ở mục 1]** |

## 4. Khác biệt giữa requirement và implementation

| Requirement ID / version | Requirement quy định | Implementation hiện tại | Nguồn quan sát | Quyết định |
| --- | --- | --- | --- | --- |
| [ID; version] | [hành vi theo requirement] | [hành vi quan sát được] | [file, commit, prototype] | [Giữ requirement, implementation cần sửa / Sửa requirement, xem Finding ID / Chờ câu hỏi mở] |

Implementation không được dùng làm nguồn của expected behavior. Khi requirement và implementation khác nhau, người giữ requirement quyết định bên nào đúng. Ghi "Không có" nếu không phát hiện khác biệt hoặc chưa có implementation.

## 5. Tiêu chí đạt

| ID | Tiêu chí | Điều kiện đầu vào | Kết quả |
| --- | --- | --- | --- |
| Q1-01 | Tài liệu requirement và tiêu chí sẵn sàng được ghi kèm version | RC-01, RC-02 | [Đạt / Không đạt] |
| Q1-02 | Mỗi requirement trong phạm vi có một dòng ở mục 3; tổng ở bảng số lượng bằng số requirement trong tài liệu | RC-01 | |
| Q1-03 | Requirement chỉ được ghi Ready khi đạt mọi tiêu chí; Ready với giả định có người giữ requirement chấp nhận | RC-02, RC-04 | |
| Q1-04 | Requirement Chờ câu hỏi mở dẫn tới ID câu hỏi; nội dung câu hỏi không được chép vào file này | RC-05 | |
| Q1-05 | Giá trị cụ thể trong requirement có nguồn; giá trị do người phân tích đề xuất được ghi lý do và được duyệt riêng từng giá trị | IN-06 | |
| Q1-06 | Mọi khác biệt giữa requirement và implementation có quyết định của người giữ requirement hoặc dẫn tới câu hỏi mở | IN-08 | |

**Người review / ngày:** [tên, ngày]

## References

1. <a id="ref-1"></a>[Tên tài liệu, lấy từ heading cấp 1 của file nguồn](đường-dẫn) — [version hoặc thời điểm chốt]
