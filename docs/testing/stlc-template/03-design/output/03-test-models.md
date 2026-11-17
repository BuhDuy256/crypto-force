# Test Models

Đọc file này để biết mỗi test condition được mô hình hóa bằng technique nào, vì sao chọn technique đó, test model cụ thể, và danh sách coverage item rút ra từ model.

## 1. Danh sách model

| Model ID | Technique | Test condition IDs | Lý do chọn | Coverage criterion | Target / nguồn | Số coverage item |
| --- | --- | --- | --- | --- | --- | --- |
| [MD-01] | [technique] | [IDs] | [đặc điểm của test condition dẫn tới technique này] | [ví dụ: 3-value BVA] | [% ; [[n]](#ref-n)] | [số] |

## 2. Chi tiết từng model

Mỗi model dùng khung dưới đây. Phần "Model" có dạng theo technique như bảng ở mục 3.

### [MD-01]: [tên ngắn]

**Technique / coverage criterion:** [technique; criterion]

**Test condition:** [IDs]

**Model:**

[model theo dạng ở mục 3; mỗi phần tử dẫn tới nguồn [[n]](#ref-n)]

**Coverage items:**

| Coverage item ID | Phần tử của model | Mô tả |
| --- | --- | --- |
| [MD-01-CI-01] | [partition, giá trị biên, cột, transition, mục checklist, luồng] | [mô tả cụ thể] |

Coverage item ID có dạng `<Model ID>-CI-<số>`, để từ một test case biết được nó thuộc model nào.

## 3. Dạng model theo technique

| Technique | Dạng model | Kiểm tra model trước khi dùng |
| --- | --- | --- |
| Equivalence Partitioning | Bảng: data element, partition, hợp lệ / không hợp lệ, định nghĩa giá trị, nguồn | Partition không chồng lấn và không rỗng; có partition không hợp lệ; mọi giá trị của data element thuộc một partition |
| Boundary Value Analysis | Bảng: partition, giá trị biên, giá trị kề theo 2-value hoặc 3-value | Chỉ áp dụng cho partition có thứ tự; biên lấy từ nguồn, không suy từ code |
| Decision Table | Bảng: hàng điều kiện và hành động; cột là rule; điều kiện dùng T, F, –, N/A; hành động dùng X hoặc để trống | Đủ tổ hợp điều kiện; cột bị loại vì không khả thi hoặc được gộp có lý do |
| State Transition | State table: hàng là trạng thái, cột là event (kèm guard); ô trống là transition không hợp lệ | Mọi trạng thái và event trong nguồn đều có mặt; transition không hợp lệ được liệt kê khi dùng all transitions |
| Statement / Branch | Control flow graph hoặc danh sách statement, branch từ công cụ đo | Ghi version của code và phạm vi loại trừ |
| Error guessing | Danh sách lỗi, defect, failure dự đoán, kèm căn cứ: lỗi cũ, lỗi thường gặp | Mỗi mục có căn cứ |
| Checklist-based | Checklist có version; mỗi mục kiểm tra được độc lập và trực tiếp | Mục quá chung hoặc tự động kiểm tra được thì tách ra |
| Scenario / use case | Luồng chính, luồng thay thế, luồng ngoại lệ, mỗi luồng là chuỗi bước | Mọi luồng thay thế và ngoại lệ trong nguồn đều có mặt |
| Performance | Workload model: scenario, load profile, thời lượng, ngưỡng | Ngưỡng có nguồn; load profile dựa trên số liệu hoặc giả định đã ghi rõ |
| Security | Threat model và/hoặc checklist có version | Mỗi threat dẫn tới tài sản và đường tấn công cụ thể; ID mục checklist lấy từ bản gốc |
| Fuzz / property-based | Input grammar hoặc danh sách property | Mỗi property dẫn tới test basis item |

Exploratory testing không có model ở file này; charter nằm ở [Test Cases](04-test-cases.md#3-exploratory-charters).

## 4. Tiêu chí đạt

| ID | Tiêu chí | Điều kiện đầu vào | Kết quả |
| --- | --- | --- | --- |
| Q3-01 | Mỗi model có lý do chọn technique dựa trên đặc điểm của test condition và mức rủi ro | IN-03, IN-04 | [Đạt / Không đạt] |
| Q3-02 | Mỗi model đã qua các kiểm tra ở mục 3 cho technique tương ứng; model white-box hoặc state transition dùng thông tin test object có version | IN-06, RC-01 | |
| Q3-03 | Mỗi phần tử của model dẫn tới nguồn có version; phần tử không có nguồn đã được báo thành lỗi test basis | IN-09 | |
| Q3-04 | Coverage item được rút theo luật của coverage criterion đã chọn; người khác đếm lại được cùng số lượng | RC-03 | |
| Q3-05 | Model đã được review bởi người khác tác giả trước khi thiết kế test case | — | |
| Q3-06 | Mọi coverage item ID có dạng `<Model ID>-CI-<số>` | IN-08 | |

**Người review / ngày:** [tên, ngày]

## References

1. <a id="ref-1"></a>[Tên tài liệu, lấy từ heading cấp 1 của file nguồn](đường-dẫn) — [version hoặc thời điểm chốt]
