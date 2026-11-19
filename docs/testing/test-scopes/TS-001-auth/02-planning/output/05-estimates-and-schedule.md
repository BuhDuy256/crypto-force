# Estimates & Schedule

Đọc file này để biết effort ước lượng cho từng hoạt động kiểm thử Authentication, cách ước lượng, ai làm, và lịch thực hiện.

## 1. Estimate

Mọi giá trị a, m, b là đề xuất của người lập plan; product owner duyệt ngày 2026-11-17. Dự án chưa có số liệu effort (IN-07), nên chưa dùng được kỹ thuật theo tỷ lệ hay ngoại suy. Three-point được chọn để thể hiện sai số [[1, §5.1.4]](#ref-1). Đơn vị là giờ làm việc; với agent là thời gian của phiên làm việc.

| Hoạt động | Kỹ thuật ước lượng | Giá trị đầu vào | Estimate | Giả định |
| --- | --- | --- | --- | --- |
| Phase 03: test condition, test model, test case cho 15 rủi ro và 81 requirement (agent) | Three-point | a = 6, m = 10, b = 16 | 10,3 ± 1,7 giờ | Không phải mở lại câu hỏi về requirement; model State Transition và Decision Table nhỏ như mô tả ở Test Approach mục 2 |
| Review test condition và test case (product owner) | Three-point | a = 1,5, m = 3, b = 5 | 3,1 ± 0,6 giờ | Review một lần, sửa một vòng |
| Phase 04: database E2E riêng, OAuth provider giả, stub Pwned Passwords, điều khiển thời gian, cài `@axe-core/playwright`, viết test tự động (agent) | Three-point | a = 10, m = 16, b = 28 | 17,0 ± 3,0 giờ | Better Auth cho phép cấu hình OAuth provider giả và stub Pwned Passwords mà không sửa code sản phẩm. Nếu không, b tăng |
| Phase 05: chạy test, ghi test log, defect report, confirmation và regression (agent) | Three-point | a = 4, m = 8, b = 16 | 8,7 ± 2,0 giờ | Một vòng chạy đầu và một vòng confirmation sau khi sửa 9 khác biệt đã biết |
| 4 exploratory session 60 phút, kèm debrief (agent) | Three-point | a = 4, m = 5, b = 7 | 5,2 ± 0,5 giờ | Session không bị dừng giữa chừng vì defect chặn luồng |
| Session Google và Resend thật (product owner) | Three-point | a = 1,5, m = 2, b = 3,5 | 2,2 ± 0,3 giờ | OAuth client và Resend trong `.env` hoạt động với localhost (EN-07). Bước Resend thêm khoảng 0,5 giờ, đề xuất của người lập plan; product owner duyệt ngày 2026-11-17 |
| Phase 06: Test Summary Report và rủi ro còn lại (agent) | Three-point | a = 1, m = 2, b = 4 | 2,2 ± 0,5 giờ | Metrics ở Test Approach mục 7 được ghi trong lúc chạy |
| Review và duyệt Phase 02, 05, 06 (product owner) | Three-point | a = 1,5, m = 3, b = 5 | 3,1 ± 0,6 giờ | Mỗi phase review một lần |

| Người thực hiện | Tổng estimate |
| --- | --- |
| Agent | 43,3 ± 4,0 giờ |
| Product owner | 8,3 ± 0,9 giờ |

Tổng E là tổng các E. Tổng SD là căn bậc hai của tổng bình phương các SD, với giả định các hoạt động độc lập.

Estimate không gồm: sửa 9 khác biệt giữa requirement và implementation (PJ-01), và thêm test vào CI (PJ-02). Đây là việc phát triển, không phải việc kiểm thử.

Với three-point estimation: E = (a + 4m + b) / 6, SD = (b − a) / 6, trong đó a là ước lượng lạc quan nhất, m là khả năng cao nhất, b là bi quan nhất. Estimate luôn dựa trên giả định và có sai số [[1, §5.1.4]](#ref-1).

## 2. Phân công

| Vai trò | Người | Hoạt động | Thời gian có thể tham gia | Nhu cầu đào tạo |
| --- | --- | --- | --- | --- |
| Người lập plan, thiết kế và chạy test | Agent | Phase 03 đến 06, exploratory session | Theo phiên làm việc do product owner mở | Không có |
| Product owner | Product owner | Duyệt plan, review test case, session Google và Resend thật, quyết định suspension, exit criteria và rủi ro còn lại | Khoảng 8,3 ± 0,9 giờ trong đợt kiểm thử (AS-03) | Không có |
| Developer | Chưa xác định | Sửa 9 khác biệt đã biết và defect mới | Chưa xác nhận (PJ-01) | Không có |

## 3. Lịch

Lịch chưa có ngày vì chưa có mốc release hay iteration (IN-10). Các mốc dưới đây có thứ tự và phụ thuộc; ngày được điền khi product owner xác nhận thời gian. Rủi ro mức Cao được thiết kế và chạy trước.

| Mốc | Hoạt động | Bắt đầu | Kết thúc | Phụ thuộc | Owner của phụ thuộc |
| --- | --- | --- | --- | --- | --- |
| M-01 | Duyệt test plan | Chưa xác định | Chưa xác định | Bộ file Phase 02 | Product owner |
| M-02 | Phase 03 cho rủi ro mức Cao (PR-01, PR-03 đến PR-09) | Sau M-01 | Chưa xác định | EN-01 | Product owner |
| M-03 | Phase 03 cho rủi ro mức Trung bình; review test case | Sau M-02 | Chưa xác định | Thời gian review của product owner | Product owner |
| M-04 | Phase 04: môi trường, công cụ, test data | Sau M-03 | Chưa xác định | EN-02; duyệt dependency mới (PJ-05) | Product owner |
| M-05 | Phase 04: viết test tự động, rủi ro Cao trước | Sau M-04 | Chưa xác định | EN-06 | Agent |
| M-06 | Phase 05 vòng 1 trên build hiện có; exploratory session; session Google và Resend thật | Sau M-05 | Chưa xác định | EN-03 đến EN-05, EN-07 | Product owner (EN-07) |
| M-07 | Sửa khác biệt đã biết và defect của vòng 1 | Sau M-06 | Chưa xác định | Có developer và hạn sửa (PJ-01) | Product owner |
| M-08 | Phase 05 vòng 2: confirmation và regression cuối | Sau M-07 | Chưa xác định | Build có bản sửa | Product owner |
| M-09 | Phase 06: Test Summary Report, quyết định rủi ro còn lại | Sau M-08 | Chưa xác định | EX-01 đến EX-08 có kết quả | Product owner |

## 4. Ngân sách

N/A. Đợt kiểm thử không có ngân sách riêng. Công cụ đều là open source; test tự động không gọi dịch vụ trả phí.

## 5. Tiêu chí đạt

| ID | Tiêu chí | Điều kiện đầu vào | Kết quả |
| --- | --- | --- | --- |
| Q5-01 | Mỗi estimate ghi kỹ thuật ước lượng, giá trị đầu vào và giả định | IN-07 | Đạt: IN-07 Chưa có, nên dùng three-point và ghi rõ giá trị là đề xuất |
| Q5-02 | Estimate theo three-point ghi cả khoảng sai số | — | Đạt |
| Q5-03 | Mọi hoạt động trong Test Approach có estimate và có người thực hiện | — | Đạt |
| Q5-04 | Phụ thuộc vào bên ngoài nhóm test có owner và có nguồn | RC-03 | Đạt: mỗi phụ thuộc có owner. Developer sửa khác biệt chưa xác định; product owner là owner của phụ thuộc này (PJ-01) |
| Q5-05 | Thời gian tham gia của từng người dựa trên xác nhận, không chỉ giả định của người lập plan | RC-03 | Đạt: product owner xác nhận AS-03. Developer chưa có, nên chưa có thời gian tham gia (PJ-01) |

**Người review / ngày:** Product owner, 2026-11-17

## References

1. <a id="ref-1"></a>[ISTQB Certified Tester Foundation Level Syllabus v4.0.1](https://www.istqb.org/wp-content/uploads/2024/11/ISTQB_CTFL_Syllabus_v4.0.1.pdf) — v4.0.1, 2024-09-15
