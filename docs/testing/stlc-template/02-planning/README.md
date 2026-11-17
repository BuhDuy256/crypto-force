# Phase 02: Test Planning

Đọc file này để biết Phase 02 tạo ra kết quả gì, phục vụ ai, và dùng các template trong thư mục này theo thứ tự nào.

## Kết quả của phase

| Câu hỏi | Trả lời |
| --- | --- |
| Đạt kết quả gì | Test plan đã được duyệt: mục tiêu và phạm vi kiểm thử; rủi ro sản phẩm và rủi ro dự án; test approach gồm test level, test type, technique và coverage target theo mức rủi ro; entry và exit criteria; estimate và lịch. |
| Phục vụ ai | Người duyệt kế hoạch và người quyết định release cần biết sẽ kiểm tra gì, đến mức nào, và khi nào được coi là xong; người phân tích và thiết kế test cần coverage target theo rủi ro; người chạy test cần entry, exit, suspension criteria; risk owner cần biết rủi ro nào được giảm bằng testing và rủi ro nào không. |
| Trong phạm vi | Phân tích rủi ro sản phẩm và rủi ro dự án; chọn test level, test type, technique, coverage criterion và mức automation; xác định entry, exit, suspension và resumption criteria; ước lượng effort; lập lịch và phân công; xác định cách giao tiếp và tài liệu đầu ra. |
| Ngoài phạm vi | Sửa requirement hoặc chốt câu hỏi mở về requirement. Thiết kế test case. Chấp nhận rủi ro thay risk owner. Quyết định release. |
| Tiêu chuẩn đạt | Mỗi file output có mục **Tiêu chí đạt** riêng. Test plan chỉ đạt khi các file nó dẫn tới đều đạt và plan đã được người có thẩm quyền duyệt. |

## Các file

| File | Nội dung | Bắt buộc |
| --- | --- | --- |
| [input/01-planning-readiness.md](input/01-planning-readiness.md) | Thông tin cần có, trạng thái xác minh, điều kiện để bắt đầu lập kế hoạch | Có |
| [output/01-test-plan.md](output/01-test-plan.md) | Bối cảnh, mục tiêu, phạm vi, giả định và ràng buộc, stakeholder, giao tiếp, phê duyệt | Có |
| [output/02-risk-register.md](output/02-risk-register.md) | Rủi ro sản phẩm và rủi ro dự án, mức rủi ro và cách xử lý | Có |
| [output/03-test-approach.md](output/03-test-approach.md) | Ma trận test level × test type, technique và coverage theo mức rủi ro, automation, metrics, deliverables | Có |
| [output/04-entry-exit-criteria.md](output/04-entry-exit-criteria.md) | Entry, exit, suspension và resumption criteria | Có |
| [output/05-estimates-and-schedule.md](output/05-estimates-and-schedule.md) | Estimate theo hoạt động, phân công, lịch và ngân sách | Có |

Mỗi tiêu chí đạt trong file output ghi điều kiện đầu vào tương ứng (ID dạng `IN-xx` hoặc `RC-xx` trong file input). Điều kiện đầu vào không đạt thì tiêu chí tương ứng cũng không đạt.

## Thứ tự thực hiện

1. Điền `input/01-planning-readiness.md` và kết luận trạng thái sẵn sàng.
2. Lập `02-risk-register.md`. Test approach dựa trên rủi ro, nên rủi ro được xác định trước [[1, §5.2]](#ref-1).
3. Lập `03-test-approach.md` từ các rủi ro sản phẩm.
4. Lập `04-entry-exit-criteria.md` từ mục tiêu kiểm thử và mức rủi ro.
5. Lập `05-estimates-and-schedule.md` từ test approach.
6. Lập `01-test-plan.md` sau cùng và trình duyệt cả bộ.

## References

1. <a id="ref-1"></a>[ISTQB Certified Tester Foundation Level Syllabus v4.0.1](https://www.istqb.org/wp-content/uploads/2024/11/ISTQB_CTFL_Syllabus_v4.0.1.pdf) — v4.0.1, 2024-09-15
