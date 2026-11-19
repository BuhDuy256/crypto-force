# Defect Reports

Đọc file này để biết các anomaly đã phát hiện trong đợt thực thi, thông tin để tái hiện và xử lý từng anomaly, và kết quả kiểm tra sau khi sửa.

## 1. Phạm vi

| Trường | Nội dung |
| --- | --- |
| Đối tượng được kiểm thử | [build hoặc commit] |
| Nơi quản lý defect | [[n]](#ref-n) [tracker, project, query] |
| Định nghĩa severity và priority | [[n]](#ref-n) |
| Thời điểm chốt | [ngày giờ, múi giờ] |

Khi defect được quản lý trong tracker, file này giữ danh sách ở mục 2 và link tới từng report; các trường ở mục 3 nằm trong tracker.

## 2. Danh sách anomaly

| ID | Tiêu đề | Nguyên nhân | Severity / priority | Trạng thái | Run IDs phát hiện | Link |
| --- | --- | --- | --- | --- | --- | --- |
| [DEF-01] | [tóm tắt ngắn] | [Product / Test / Data / Environment / Chưa xác định] | [mức / mức] | [Open / Deferred / Duplicate / Chờ sửa / Chờ confirmation test / Reopened / Closed / Rejected] | [Run IDs] | [link] |

Một failure chưa phải là một product defect. Failure do test, dữ liệu hoặc môi trường được ghi với nguyên nhân tương ứng; failure chưa rõ nguyên nhân giữ ở "Chưa xác định".

## 3. Nội dung một report

| Trường | Nội dung |
| --- | --- |
| ID / tiêu đề | [ID; tóm tắt ngắn của anomaly] |
| Ngày phát hiện / người báo cáo | [ngày; tên và vai trò] |
| Đối tượng và môi trường | [build; môi trường; cấu hình] |
| Bối cảnh | [test case hoặc session đang chạy, dữ liệu, kỹ thuật test hoặc checklist đang dùng] |
| Các bước tái hiện | [bước cụ thể, bắt đầu từ trạng thái ban đầu] |
| Expected / actual | [expected result và nguồn; actual result] |
| Evidence | [log, request/response, ảnh, video; Evidence IDs] |
| Severity / priority | [mức ảnh hưởng; mức khẩn cấp xử lý] |
| Trạng thái | [trạng thái hiện tại] |
| Tham chiếu | [Test case, Run, Coverage item IDs; requirement] |

## 4. Confirmation testing và regression testing

| Defect ID | Build có bản sửa | Confirmation test: Run IDs / kết quả | Test bổ sung cho thay đổi | Regression: phạm vi / Run IDs / kết quả | Trạng thái sau kiểm tra |
| --- | --- | --- | --- | --- | --- |
| [DEF-01] | [build] | [Run IDs; Passed / Failed] | [Instance IDs hoặc "Không có"] | [suite; Run IDs; kết quả] | [Closed / Reopened] |

Defect chỉ được đóng khi confirmation test trên build có bản sửa đã Passed. Báo "đã sửa" từ developer không thay cho confirmation test.

## 5. Tiêu chí đạt

| ID | Tiêu chí | Điều kiện đầu vào | Kết quả |
| --- | --- | --- | --- |
| Q3-01 | Mỗi report có đủ các trường ở mục 3 | IN-09 | [Đạt / Không đạt] |
| Q3-02 | Các bước tái hiện và evidence đủ để người khác tái hiện mà không cần hỏi người báo cáo | IN-06, IN-07, RC-03 | |
| Q3-03 | Expected result dẫn tới nguồn có version | RC-02 | |
| Q3-04 | Mỗi anomaly có nguyên nhân được phân loại; failure không bị mặc định là product defect | — | |
| Q3-05 | Mọi defect Closed có confirmation test Passed trên build có bản sửa | RC-01 | |
| Q3-06 | Mỗi bản sửa có phạm vi regression và kết quả, hoặc ghi rõ chưa chạy regression | — | |
| Q3-07 | Defect ở trạng thái Duplicate, Rejected hoặc Deferred có lý do và link tới report gốc hoặc quyết định | — | |

**Người review / ngày:** [tên, ngày]

## References

1. <a id="ref-1"></a>[Tên tài liệu, lấy từ heading cấp 1 của file nguồn](đường-dẫn) — [version hoặc thời điểm chốt]
