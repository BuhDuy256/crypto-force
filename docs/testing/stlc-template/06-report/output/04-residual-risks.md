# Residual Risks

Đọc file này để biết những rủi ro còn lại sau đợt kiểm thử, đề xuất xử lý từng rủi ro và quyết định của người có thẩm quyền.

## 1. Cách đánh giá

| Trường | Nội dung |
| --- | --- |
| Đối tượng được đánh giá / thời điểm chốt | [build; ngày giờ, múi giờ] |
| Thang khả năng xảy ra | [các mức và định nghĩa, hoặc [[n]](#ref-n)] |
| Thang mức ảnh hưởng | [các mức và định nghĩa, hoặc [[n]](#ref-n)] |
| Cách xếp hạng | [ví dụ: ma trận khả năng × ảnh hưởng] |
| Người tham gia đánh giá | [tên hoặc vai trò] |

Khi không có dữ liệu để ước lượng khả năng xảy ra, ghi "Chưa xác định" thay vì tự gán một mức.

## 2. Danh sách rủi ro

| Risk ID | Nguồn | Sự kiện có thể xảy ra và ảnh hưởng | Khả năng / ảnh hưởng | Căn cứ đánh giá | Biện pháp giảm thiểu đã có | Owner |
| --- | --- | --- | --- | --- | --- | --- |
| [R-01] | [Defect ID / Gap ID / IN hoặc RC ID / Env ID] | [điều gì có thể xảy ra, với ai, hậu quả] | [mức / mức] | [dữ liệu hoặc lý do] | [biện pháp và evidence, hoặc "Không có"] | [tên] |

Nguồn của rủi ro có thể là: defect chưa giải quyết ([Defects, mục 4](03-defects.md#4-defect-quan-trọng)), coverage gap ([Execution & Coverage, mục 5](02-execution-and-coverage.md#5-coverage-gaps)), thông tin ở trạng thái Giả định hoặc điều kiện không đạt ([Test Summary: Readiness](../input/01-reporting-readiness.md)), khác biệt môi trường ([Test Summary Report, mục 4.2](01-test-summary-report.md#42-môi-trường-và-dữ-liệu)).

## 3. Quyết định xử lý

| Risk ID | Đề xuất | Quyết định | Người quyết định, ngày, link | Điều kiện / thời điểm review lại |
| --- | --- | --- | --- | --- |
| [R-01] | [sửa / test thêm / giảm thiểu / chấp nhận / chuyển giao] | [Chưa quyết định / quyết định] | [tên, ngày, link bằng chứng] | [điều kiện hoặc ngày review lại] |

Một rủi ro chỉ được ghi là đã chấp nhận khi có quyết định của người có thẩm quyền và link tới bằng chứng của quyết định đó.

## 4. Tiêu chí đạt

| ID | Tiêu chí | Điều kiện đầu vào | Kết quả |
| --- | --- | --- | --- |
| Q4-01 | Mọi defect ở mục 4 của file Defects và mọi coverage gap đã được xem xét: có Risk ID, hoặc có lý do không tạo rủi ro | — | [Đạt / Không đạt] |
| Q4-02 | Mọi thông tin ở trạng thái Giả định và mọi điều kiện không đạt trong input đã được xem xét như trên | IN-01 → IN-13, RC-01 → RC-05 | |
| Q4-03 | Mức khả năng và ảnh hưởng có căn cứ; không có căn cứ thì ghi "Chưa xác định" | IN-09 | |
| Q4-04 | Mọi rủi ro có owner | — | |
| Q4-05 | Mọi quyết định chấp nhận có người có thẩm quyền, ngày và bằng chứng | IN-10 | |

**Người review / ngày:** [tên, ngày]

## References

1. <a id="ref-1"></a>[Tên tài liệu, lấy từ heading cấp 1 của file nguồn](đường-dẫn) — [version hoặc thời điểm chốt]
