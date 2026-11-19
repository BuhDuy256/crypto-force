# Phase 06: Test Summary & Closure

Đọc file này để biết Phase 06 tạo ra kết quả gì, phục vụ ai, và dùng các template trong thư mục này theo thứ tự nào.

## Kết quả của phase

| Câu hỏi | Trả lời |
| --- | --- |
| Đạt kết quả gì | Kết luận có bằng chứng về chất lượng của đối tượng được kiểm thử, trong phạm vi đã thống nhất, kèm recommendation cho bước tiếp theo. |
| Phục vụ ai | Người quyết định bước tiếp theo (release, UAT, cycle tiếp theo); risk owner cần chấp nhận hoặc từ chối rủi ro còn lại; người tiếp nhận testware và các việc còn tồn đọng. |
| Trong phạm vi | Tổng hợp kết quả test, coverage và defects; đối chiếu exit criteria; đánh giá rủi ro còn lại; recommendation; lessons learned. Bàn giao testware và môi trường khi đợt test có Closure [[1, §1.4.1]](#ref-1) [[1, §5.3.2]](#ref-1). |
| Ngoài phạm vi | Chạy thêm test, sửa defect. Quyết định release hoặc chấp nhận rủi ro thay người có thẩm quyền. Kết luận về phần sản phẩm nằm ngoài phạm vi kiểm thử. |
| Tiêu chuẩn đạt | Mỗi file output có mục **Tiêu chí đạt** riêng. Báo cáo chính chỉ đạt khi mọi file mà nó dẫn tới đều đạt, hoặc phần chưa đạt đã được ghi thành giới hạn của kết luận. |

## Các file

| File | Nội dung | Bắt buộc |
| --- | --- | --- |
| [input/01-reporting-readiness.md](input/01-reporting-readiness.md) | Thông tin cần có, trạng thái xác minh của từng thông tin, điều kiện để bắt đầu tổng hợp | Có |
| [output/01-test-summary-report.md](output/01-test-summary-report.md) | Báo cáo cho người quyết định: bối cảnh, exit criteria, recommendation, sign-off | Có |
| [output/02-execution-and-coverage.md](output/02-execution-and-coverage.md) | Quy tắc đếm, trạng thái test, coverage và coverage gaps | Có |
| [output/03-defects.md](output/03-defects.md) | Defects tại thời điểm chốt dữ liệu, chất lượng bản sửa và regression | Có |
| [output/04-residual-risks.md](output/04-residual-risks.md) | Rủi ro còn lại, đề xuất xử lý, quyết định của risk owner | Có |
| [output/05-lessons-learned.md](output/05-lessons-learned.md) | Quan sát về đợt kiểm thử và action items cho đợt sau | Có |
| [output/06-closure-and-handover.md](output/06-closure-and-handover.md) | Lưu trữ và bàn giao testware, môi trường; change request cho việc tồn đọng | Tùy chọn |

Mỗi tiêu chí đạt trong file output ghi điều kiện đầu vào tương ứng (ID dạng `IN-xx` hoặc `RC-xx` trong file input). Điều kiện đầu vào không đạt thì tiêu chí tương ứng cũng không đạt.

## Thứ tự thực hiện

1. Điền `input/01-reporting-readiness.md` và kết luận trạng thái sẵn sàng.
2. Lập `02-execution-and-coverage.md`, `03-defects.md` và `05-lessons-learned.md`. Ba file này không phụ thuộc nhau.
3. Lập `04-residual-risks.md`, vì rủi ro còn lại được rút ra từ coverage gaps ở file `02` và defects chưa giải quyết ở file `03`.
4. Lập `01-test-summary-report.md` sau cùng, vì báo cáo chính tổng hợp kết luận của các file `02`–`05`.
5. Lập `06-closure-and-handover.md` khi đợt test kết thúc. File này có thể hoàn thành sau khi báo cáo chính đã phát hành.

## References

1. <a id="ref-1"></a>[ISTQB Certified Tester Foundation Level Syllabus v4.0.1](https://www.istqb.org/wp-content/uploads/2024/11/ISTQB_CTFL_Syllabus_v4.0.1.pdf) — v4.0.1, 2024-09-15
