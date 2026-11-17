# Test Implementation: Readiness

Đọc file này để xác định thông tin cần có trước khi tạo testware, mức độ tin cậy của từng thông tin, và khi nào đủ điều kiện để bắt đầu.

## 1. Đợt hiện thực hóa

| Trường | Nội dung |
| --- | --- |
| Mục tiêu | [nhóm test cần chuẩn bị để kiểm chứng điều gì] |
| Phạm vi | [feature, test level, test type, cấu hình] |
| Đối tượng hoặc interface dự kiến | [build nếu đã có; version của API, schema, contract hoặc component] |
| Thời gian dự kiến | [bắt đầu – kết thúc, múi giờ] |
| Người thực hiện / người review | [tên hoặc vai trò] |

## 2. Thông tin cần có

Một thông tin có thể đến từ nhiều nguồn, và một nguồn có thể đáp ứng nhiều thông tin. Ghi nguồn theo dạng `[[n]](#ref-n)`, chi tiết nằm ở mục [References](#references).

| ID | Thông tin cần có | Dùng cho file | Nguồn | Trạng thái | Căn cứ trạng thái | Ảnh hưởng nếu chưa xác minh |
| --- | --- | --- | --- | --- | --- | --- |
| IN-01 | Các trường ở mục 1 | 01–04 | [[n]](#ref-n) | [Đã xác minh / Giả định / Chưa có] | [vì sao xếp vào trạng thái này] | [testware nào bị ảnh hưởng; làm được đến đâu; ai xử lý và hạn xử lý] |
| IN-02 | Test case và charter có version, kèm expected result và nguồn của expected result | 01, 02 | | | | |
| IN-03 | Coverage item và traceability từ coverage item tới test case | 01 | | | | |
| IN-04 | Độ ưu tiên hoặc mức rủi ro của từng test case | 02 | | | | |
| IN-05 | Yêu cầu test data: partition, boundary, trạng thái, khối lượng, yêu cầu cô lập | 03 | | | | |
| IN-06 | Yêu cầu môi trường: cấu hình, dependency, thành phần cần mock hoặc stub, công cụ | 04 | | | | |
| IN-07 | Interface và điểm truy cập để test: API contract, selector hoặc test ID trên UI, log, hook quan sát | 02 | | | | |
| IN-08 | Testware có thể tái sử dụng: script, fixture, helper, data generator, kèm version | 02, 03 | | | | |
| IN-09 | Cách tiếp cận manual hoặc automated, framework, quy ước viết và nơi lưu testware | 02 | | | | |
| IN-10 | Ràng buộc khi chạy: thời gian, nguồn lực, lịch dùng môi trường, phụ thuộc giữa các test | 02 | | | | |
| IN-11 | Quy ước ghi kết quả và evidence mà testware phải xuất ra | 02 | | | | |
| IN-12 | Người có thẩm quyền trả lời câu hỏi về test design và expected result | 01 | | | | |

Bỏ các dòng không áp dụng.

Cách xếp trạng thái:

- **Đã xác minh:** nguồn truy cập được, đúng version. Với test case và expected result, người có thẩm quyền đã xác nhận. Với testware tái sử dụng, đã chạy thử trên version hiện tại.
- **Giả định:** đang dùng nhưng chưa được xác nhận. Expected result suy ra từ code hoặc prototype là giả định cho đến khi được người có thẩm quyền xác nhận.
- **Chưa có:** chưa có nguồn nào đáp ứng.

Cột "Ảnh hưởng nếu chưa xác minh" chỉ điền khi trạng thái là Giả định hoặc Chưa có.

## 3. Điều kiện bắt đầu

Mục 2 đánh giá từng thông tin. Các điều kiện dưới đây kiểm tra quan hệ giữa các thông tin. Mỗi điều kiện tương ứng với một tiêu chí đạt của file output; điều kiện không đạt ở đây thì tiêu chí tương ứng ở output cũng không đạt.

| ID | Điều kiện | Thông tin liên quan | Kết quả | Ảnh hưởng nếu không đạt |
| --- | --- | --- | --- | --- |
| RC-01 | Mỗi test case cần hiện thực hóa có expected result dẫn tới nguồn có version | IN-02 | [Đạt / Không đạt / N/A] | [testware nào bị ảnh hưởng; làm được đến đâu; ai xử lý và hạn xử lý] |
| RC-02 | Test case, coverage item và test basis dùng cùng version | IN-02, IN-03 | | |
| RC-03 | Mỗi test case trong phạm vi có yêu cầu data và môi trường, hoặc được ghi là chưa có | IN-02, IN-05, IN-06 | | |
| RC-04 | Test sẽ được automated có điểm truy cập đã xác định từ contract hoặc build hiện có | IN-07 | | |
| RC-05 | Testware tái sử dụng đã được chạy thử trên version hiện tại, không chỉ giả định tương thích | IN-08 | | |
| RC-06 | Quy ước ghi kết quả và evidence đã thống nhất trước khi viết script | IN-11 | | |

## 4. Kết luận sẵn sàng

**Trạng thái:** [Sẵn sàng / Sẵn sàng một phần / Chưa sẵn sàng]

- **Sẵn sàng:** mọi điều kiện ở mục 3 đạt, và không còn thông tin nào ở mục 2 ở trạng thái Giả định hoặc Chưa có.
- **Sẵn sàng một phần:** RC-01 đạt cho phần test case sẽ làm. Các điều kiện còn lại chỉ ảnh hưởng tới một phần test case; làm phần không bị ảnh hưởng và ghi phần còn lại vào cột ảnh hưởng.
- **Chưa sẵn sàng:** RC-01 không đạt cho mọi test case. Khi chưa biết expected result, assertion sẽ được viết theo hành vi hiện tại của sản phẩm, và test sẽ pass cả khi sản phẩm sai.

**Phần được phép làm:** [test case hoặc nhóm test; hoặc "Toàn bộ phạm vi"]

**Người quyết định / ngày:** [tên, ngày]

## References

1. <a id="ref-1"></a>[Tên tài liệu, lấy từ heading cấp 1 của file nguồn](đường-dẫn) — [version hoặc thời điểm chốt]
