# Phase 03: Test Analysis & Design

Đọc file này để biết Phase 03 tạo ra kết quả gì, phục vụ ai, chọn test technique theo dấu hiệu nào, và dùng các template trong thư mục này theo thứ tự nào.

## Kết quả của phase

| Câu hỏi | Trả lời |
| --- | --- |
| Đạt kết quả gì | Từ test basis đã có version, xác định cần kiểm tra cái gì (test condition) và kiểm tra thế nào (test case), qua một chuỗi có thể kiểm tra từng bước: test condition → test model → coverage item → test case. Lỗi trong test basis được phát hiện và báo cáo. |
| Phục vụ ai | Người review cần kiểm tra test model có đúng với test basis không và test case có phủ hết coverage item không; người tạo testware cần test case có input và expected result cụ thể; người giữ test basis cần biết test basis thiếu, mơ hồ hoặc mâu thuẫn ở đâu. |
| Trong phạm vi | Phân tích test basis thành test condition có ưu tiên; đối chiếu với baseline độc lập; chọn technique; dựng test model; rút coverage item; thiết kế test case và exploratory charter; xác định yêu cầu test data và môi trường; báo lỗi test basis. |
| Ngoài phạm vi | Viết hoặc sửa requirement và acceptance criteria; lỗi test basis được trả về nguồn chịu trách nhiệm. Tạo script, test data và môi trường thật. Chạy test. Testing in production như canary, monitoring, A/B test, chaos testing, real user monitoring. Static testing như lint và static analysis. |
| Tiêu chuẩn đạt | Mỗi file output có mục **Tiêu chí đạt** riêng. |

## Chọn technique

Mỗi technique dùng cùng một chuỗi; chỉ khác nhau ở dạng của test model và luật rút coverage item. Mức coverage cần đạt lấy từ Test Plan theo rủi ro.

| Technique | Dùng khi | Test model | Coverage item | Nguồn |
| --- | --- | --- | --- | --- |
| Equivalence Partitioning | Một nhóm giá trị được kỳ vọng xử lý giống nhau | Partition hợp lệ và không hợp lệ; không chồng lấn, không rỗng | Mỗi partition. Khi có nhiều tập partition: Each Choice, mỗi partition của mỗi tập ít nhất một lần | [[1, §4.2.1]](#ref-1) |
| Boundary Value Analysis | Partition có thứ tự | Giá trị biên của từng partition | 2-value: giá trị biên và giá trị kề thuộc partition bên cạnh. 3-value: giá trị biên và hai giá trị kề | [[1, §4.2.2]](#ref-1) |
| Decision Table | Kết quả phụ thuộc tổ hợp nhiều điều kiện | Bảng: hàng là điều kiện và hành động, cột là rule | Mỗi cột khả thi | [[1, §4.2.3]](#ref-1) |
| State Transition | Hành vi phụ thuộc trạng thái trước đó | State diagram hoặc state table | All states; valid transitions (0-switch); hoặc all transitions, gồm cả transition không hợp lệ | [[1, §4.2.4]](#ref-1) |
| Statement / Branch | Có code và cần đo coverage của code | Control flow graph | Statement thực thi được; hoặc branch | [[1, §4.3]](#ref-1) |
| Error guessing | Có kiến thức về lỗi thường gặp ở loại hệ thống này | Danh sách lỗi, defect hoặc failure dự đoán | Mỗi mục trong danh sách (ISTQB không định nghĩa coverage item cho technique này) | [[1, §4.4.1]](#ref-1) |
| Exploratory | Test basis thiếu hoặc mơ hồ; vùng chưa mô hình hóa được | Không có model trước khi chạy; charter ở [Test Cases](output/04-test-cases.md) dẫn trực tiếp tới test condition | Xác định trong session | [[1, §4.4.2]](#ref-1) |
| Checklist-based | Có checklist hoặc chuẩn ngoài, ví dụ OWASP ASVS, WCAG | Checklist có version | Mỗi mục checklist | [[1, §4.4.3]](#ref-1) |
| Scenario / use case | Luồng nghiệp vụ nhiều bước | Luồng chính, luồng thay thế, luồng ngoại lệ | Mỗi luồng | Không có trong CTFL v4.0.1 |

Test type non-functional dùng cùng chuỗi, với model riêng. CTFL v4.0.1 không định nghĩa model và coverage item cho các test type này; bảng dưới là quy ước của bộ template.

| Test type | Test model | Coverage item | Kết quả đo |
| --- | --- | --- | --- |
| Performance: load, soak, benchmark | Workload model: scenario, load profile, thời lượng, ngưỡng có nguồn | Mỗi tổ hợp scenario × load profile | Số đo so với ngưỡng |
| Security | Threat model, ví dụ STRIDE, và/hoặc checklist như OWASP ASVS | Mỗi threat hoặc mỗi mục checklist | Đạt / không đạt theo từng mục, kèm phát hiện của scanner |
| Usability / Accessibility | Checklist heuristic hoặc WCAG, có version | Mỗi mục checklist | Đạt / không đạt theo từng mục |
| Fuzz / property-based | Input grammar hoặc property hệ thống phải giữ | Mỗi property | Số vi phạm tìm được, kèm thời gian chạy hoặc số input đã sinh |

Test level và test type là hai chiều độc lập: hầu hết test type chạy được ở mọi test level [[1, §2.2]](#ref-1). Test type non-functional phân loại theo đặc tính chất lượng của ISO/IEC 25010 [[1, §2.2.2]](#ref-1).

Khi chọn mức coverage: all transitions bao gồm valid transitions, và valid transitions bao gồm all states [[1, §4.2.4]](#ref-1); 3-value BVA chặt hơn 2-value [[1, §4.2.2]](#ref-1); branch coverage bao gồm statement coverage [[1, §4.3.2]](#ref-1).

Acceptance criteria có thể được dùng trực tiếp làm test condition [[1, §4.5.2]](#ref-1); khi đó test condition dẫn tới ID của acceptance criterion thay vì viết lại nội dung.

## Các file

| File | Nội dung | Bắt buộc |
| --- | --- | --- |
| [input/01-design-readiness.md](input/01-design-readiness.md) | Thông tin cần có, trạng thái xác minh, điều kiện để bắt đầu phân tích và thiết kế | Có |
| [output/01-design-status.md](output/01-design-status.md) | Truy vết từ test basis tới test case, coverage theo từng test model, việc còn lại | Có |
| [output/02-test-conditions.md](output/02-test-conditions.md) | Test condition có ưu tiên, gap so với baseline độc lập, lỗi test basis | Có |
| [output/03-test-models.md](output/03-test-models.md) | Test model theo technique và coverage item rút ra | Có |
| [output/04-test-cases.md](output/04-test-cases.md) | Test case và exploratory charter | Có |
| [output/05-data-and-environment-requirements.md](output/05-data-and-environment-requirements.md) | Yêu cầu test data và môi trường | Có |

Mỗi tiêu chí đạt trong file output ghi điều kiện đầu vào tương ứng (ID dạng `IN-xx` hoặc `RC-xx` trong file input). Điều kiện đầu vào không đạt thì tiêu chí tương ứng cũng không đạt.

## Thứ tự thực hiện

1. Điền `input/01-design-readiness.md` và kết luận trạng thái sẵn sàng.
2. Lập `02-test-conditions.md`. Lỗi test basis phát hiện ở bước này được báo ngay, không đợi xong phase.
3. Lập `03-test-models.md`. Review test model trước khi thiết kế test case, vì sai ở model sẽ lan sang mọi test case rút ra từ nó.
4. Lập `04-test-cases.md` và `05-data-and-environment-requirements.md`.
5. Lập `01-design-status.md` sau cùng.

## References

1. <a id="ref-1"></a>[ISTQB Certified Tester Foundation Level Syllabus v4.0.1](https://www.istqb.org/wp-content/uploads/2024/11/ISTQB_CTFL_Syllabus_v4.0.1.pdf) — v4.0.1, 2024-09-15
