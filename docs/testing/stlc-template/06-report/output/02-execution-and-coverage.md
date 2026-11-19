# Test Execution & Coverage

Đọc file này để biết bao nhiêu test đã chạy và kết quả ra sao, test basis được bao phủ đến mức nào, và phần nào chưa được kiểm chứng.

## 1. Phạm vi số liệu

| Trường | Nội dung |
| --- | --- |
| Đối tượng được đánh giá | [build hoặc commit] |
| Thời điểm chốt dữ liệu | [ngày giờ, múi giờ] |
| Nguồn kết quả test | [[n]](#ref-n) [query hoặc report có thời điểm] |
| Nguồn coverage item | [[n]](#ref-n) [register và version] |

## 2. Quy tắc đếm

| Khái niệm | Định nghĩa |
| --- | --- |
| Test case | Một test case ID và version thuộc test basis; có thể chạy nhiều lần |
| Test instance | Một test case kết hợp với một bộ dữ liệu và một cấu hình; mỗi instance có ID riêng |
| Lượt chạy | Một lần thực hiện một instance, gồm cả confirmation test sau khi sửa và rerun không có thay đổi |
| Kết quả hiện hành | Kết quả của một instance trên đối tượng được đánh giá, chọn theo quy tắc bên dưới |
| Exploratory session | Đếm riêng theo charter, không quy đổi thành test case |

**Quy tắc chọn kết quả hiện hành:** [query hoặc filter; build và cấu hình hợp lệ; cách xử lý rerun; điều kiện dùng lại kết quả của build cũ].

Mỗi instance có đúng một kết quả hiện hành. Một lần rerun pass không xóa failure chưa rõ nguyên nhân trước đó; failure này được ghi là anomaly trong [Defects, mục 5](03-defects.md#5-bản-sửa-và-regression).

## 3. Trạng thái test

### 3.1. Khối lượng

| Chỉ số | Số lượng | Nguồn |
| --- | --- | --- |
| Test case trong phạm vi | [số] | [[n]](#ref-n) |
| Test instance trong phạm vi (T) | [số] | |
| Tổng lượt chạy | [số] | |
| Lượt confirmation test và rerun | [số] | |
| Exploratory session dự kiến / đã thực hiện | [số / số hoặc N/A] | |

### 3.2. Kết quả hiện hành

| Trạng thái | Số instance | Định nghĩa |
| --- | --- | --- |
| Passed (TP) | [số] | Đáp ứng expected result, có evidence |
| Failed (TF) | [số] | Sai lệch so với expected result; dẫn tới defect hoặc anomaly |
| Blocked (TB) | [số] | Không thể hoàn tất; dẫn tới blocker |
| Not Run (TN) | [số] | Chưa thực hiện |
| Skipped (TS) | [số] | Chủ động bỏ qua, có lý do |
| Inconclusive (TI) | [số] | Đã chạy nhưng chưa đủ căn cứ kết luận |
| **Tổng (T)** | **[số]** | TP + TF + TB + TN + TS + TI |

| Chỉ số | Công thức | Giá trị |
| --- | --- | --- |
| Tỷ lệ có kết luận | (TP + TF) / T | [số / mẫu số (%)] |
| Pass rate trên instance có kết luận | TP / (TP + TF) | |
| Pass rate trên toàn phạm vi | TP / T | |

Mẫu số bằng 0 thì ghi N/A.

### 3.3. Kết quả theo nhóm quan trọng

| Nhóm (flow, mức rủi ro hoặc cấu hình) | T | Passed | Failed | Chưa có kết luận | Phát hiện chính |
| --- | --- | --- | --- | --- | --- |
| [tên nhóm] | [số] | [số] | [số] | [số] | [Defect hoặc Gap IDs] |

Khi các nhóm chồng lấn nhau, các dòng không được cộng thành tổng.

## 4. Coverage

### 4.1. Quy tắc đo

| Ký hiệu | Định nghĩa |
| --- | --- |
| N | Số coverage item thuộc phạm vi |
| D | Số item có đủ test theo điều kiện "đủ test" ghi trong coverage item register |
| E | Số item thuộc D mà mọi test bắt buộc đã có kết quả Passed hoặc Failed |
| P | Số item thuộc E mà mọi test bắt buộc đã pass và không còn anomaly chưa giải quyết |

P ≤ E ≤ D ≤ N. Instance ở trạng thái Blocked, Not Run, Skipped hoặc Inconclusive không được tính vào E.

### 4.2. Coverage theo chiều

| Chiều | Đơn vị đếm | N | D | E | P | Criterion ID | Nguồn |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Requirement / acceptance criteria | Một AC | | | | | | |
| Scenario / flow | Một nhánh flow | | | | | | |
| Business rule / decision | Một tổ hợp trong decision table | | | | | | |
| State / transition | Một transition hợp lệ hoặc không hợp lệ | | | | | | |
| Input / data | Một partition hoặc boundary | | | | | | |
| Security control | Một mục checklist, ghi version của checklist | | | | | | |
| Interface / integration | Một tương tác | | | | | | |
| Environment / configuration | Một cấu hình | | | | | | |

Bỏ các chiều không áp dụng. Mỗi chiều tính ba tỷ lệ trên cùng mẫu số N: design coverage D/N, execution coverage E/N, item đạt P/N. N bằng 0 thì ghi N/A. Các chiều không được cộng thành một tỷ lệ chung.

### 4.3. Code coverage

| Metric | Build và tập test | Phạm vi code / exclusions | Covered / Total | Nguồn |
| --- | --- | --- | --- | --- |
| [Statement / Branch / ...] | [build; suite] | [phạm vi] | [số / số] | [[n]](#ref-n) |

Ghi N/A nếu không đo. Code coverage cho biết code nào đã được thực thi, không cho biết hành vi đúng, nên không được tính vào N, D, E, P ở mục 4.2.

## 5. Coverage gaps

| Gap ID | Item / chiều / cấu hình | Phần chưa được kiểm chứng | Nguyên nhân | Owner / hành động |
| --- | --- | --- | --- | --- |
| [GAP-01] | [item IDs] | [hành vi cụ thể] | [thiếu test / chạy một phần / blocked / chưa chạy / thiếu evidence] | [tên; hành động] |

## 6. Tiêu chí đạt

| ID | Tiêu chí | Điều kiện đầu vào | Kết quả |
| --- | --- | --- | --- |
| Q2-01 | Đối tượng, thời điểm chốt và nguồn kết quả được ghi rõ; mọi kết quả thuộc đúng đối tượng được đánh giá | RC-01, RC-02 | [Đạt / Không đạt] |
| Q2-02 | Tổng các trạng thái ở mục 3.2 bằng T; confirmation test và rerun không được đếm thành instance mới | — | |
| Q2-03 | Mọi tỷ lệ có tử số, mẫu số và nguồn; dữ liệu thiếu không được ghi thành 0 | RC-05 | |
| Q2-04 | Coverage item cùng version với test basis và test đã chạy; P ≤ E ≤ D ≤ N ở mọi chiều | RC-03 | |
| Q2-05 | Mọi item thuộc N nhưng không thuộc E có một dòng ở mục 5 | IN-05 | |
| Q2-06 | Code coverage không được gộp vào coverage theo test basis | — | |

**Người review / ngày:** [tên, ngày]

## References

1. <a id="ref-1"></a>[Tên tài liệu, lấy từ heading cấp 1 của file nguồn](đường-dẫn) — [version hoặc thời điểm chốt]
