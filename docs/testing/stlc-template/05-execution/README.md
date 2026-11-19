# Phase 05: Test Execution

Đọc file này để biết Phase 05 tạo ra kết quả gì, phục vụ ai, và dùng các template trong thư mục này theo thứ tự nào.

## Kết quả của phase

| Câu hỏi | Trả lời |
| --- | --- |
| Đạt kết quả gì | Các test trong phạm vi được chạy trên một đối tượng đã xác định. Mỗi lượt chạy có actual result so với expected result, trạng thái và evidence. Mọi anomaly được báo cáo. Tại mỗi thời điểm chốt, biết được trạng thái hiện hành của từng test instance. |
| Phục vụ ai | Developer cần defect report đủ thông tin để tái hiện và sửa; người điều phối test cần biết test nào còn phải chạy hoặc chạy lại; bất kỳ ai cần biết hành vi thực tế của đối tượng được kiểm thử tại một thời điểm. |
| Trong phạm vi | Chạy test manual, automated và exploratory theo lịch; so sánh và ghi kết quả; báo cáo anomaly; confirmation testing và regression testing sau khi sửa; tạm dừng và tiếp tục theo tiêu chí đã thống nhất; chạy công cụ đo như code coverage, performance, security scanner [[1, §1.4.1]](#ref-1) [[1, §2.2.3]](#ref-1). |
| Ngoài phạm vi | Thiết kế test case mới, trừ test bổ sung cho confirmation testing. Sửa defect. Kết luận exit criteria đã đạt, chấp nhận rủi ro hoặc quyết định release. |
| Tiêu chuẩn đạt | Mỗi file output có mục **Tiêu chí đạt** riêng. |

## Các file

| File | Nội dung | Bắt buộc |
| --- | --- | --- |
| [input/01-execution-readiness.md](input/01-execution-readiness.md) | Thông tin cần có, trạng thái xác minh, điều kiện để bắt đầu chạy test | Có |
| [output/01-execution-status.md](output/01-execution-status.md) | Trạng thái hiện hành của test instance và coverage item tại thời điểm chốt; hiệu lực kết quả; tạm dừng, sai lệch và việc còn lại | Có |
| [output/02-test-log.md](output/02-test-log.md) | Từng lượt chạy, exploratory session và evidence | Có |
| [output/03-defect-reports.md](output/03-defect-reports.md) | Anomaly và defect report, confirmation testing và regression testing | Có |
| [output/04-tool-reports.md](output/04-tool-reports.md) | Kết quả từ công cụ đo: code coverage, performance, security scanner | Tùy chọn |

Mỗi tiêu chí đạt trong file output ghi điều kiện đầu vào tương ứng (ID dạng `IN-xx` hoặc `RC-xx` trong file input). Điều kiện đầu vào không đạt thì tiêu chí tương ứng cũng không đạt.

## Thứ tự thực hiện

1. Điền `input/01-execution-readiness.md` và kết luận trạng thái sẵn sàng.
2. Trong khi chạy test, ghi `02-test-log.md` và `03-defect-reports.md` liên tục. Mỗi failure hoặc kết quả inconclusive trong test log dẫn tới một anomaly report hoặc một phân tích.
3. Ghi `04-tool-reports.md` mỗi khi chạy công cụ đo.
4. Lập `01-execution-status.md` tại mỗi thời điểm chốt. File này có thể được cập nhật nhiều lần trong một đợt thực thi, mỗi lần với một thời điểm chốt mới.

## References

1. <a id="ref-1"></a>[ISTQB Certified Tester Foundation Level Syllabus v4.0.1](https://www.istqb.org/wp-content/uploads/2024/11/ISTQB_CTFL_Syllabus_v4.0.1.pdf) — v4.0.1, 2024-09-15
