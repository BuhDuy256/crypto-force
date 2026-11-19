# Test Log

Đọc file này để biết từng lượt chạy test đã diễn ra thế nào: chạy gì, trên build và dữ liệu nào, kết quả thực tế so với expected result, và evidence đi kèm.

## 1. Phạm vi

| Trường | Nội dung |
| --- | --- |
| Đối tượng được kiểm thử | [build hoặc commit] |
| Khoảng thời gian ghi | [từ – đến, múi giờ] |
| Nguồn kết quả tự động | [[n]](#ref-n) [CI pipeline, test report] |
| Nơi lưu evidence | [vị trí; quyền truy cập; thời gian lưu] |

## 2. Lượt chạy

| Run ID | Instance ID / test case version | Dữ liệu / cấu hình | Build | Người thực hiện / thời điểm | Expected / actual | Trạng thái | Evidence IDs | Defect / anomaly IDs |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [RUN-001] | [ID; version] | [data set; cấu hình] | [build] | [tên hoặc CI job; ngày giờ] | [tóm tắt hoặc link] | [trạng thái] | [EV IDs] | [IDs] |

Mỗi lượt chạy lại là một dòng mới; dòng cũ được giữ nguyên. Với kết quả từ CI, mỗi dòng có thể là một job, kèm link tới report chi tiết; khi đó report phải giữ được expected và actual của từng test. Test chưa chạy không có dòng ở đây; trạng thái Not Run và Skipped được ghi ở [Execution Status](01-execution-status.md#23-instance-chưa-có-kết-luận).

| Trạng thái | Định nghĩa |
| --- | --- |
| Passed | Actual result khớp expected result; có evidence theo quy ước |
| Failed | Actual result khác expected result; dẫn tới anomaly report |
| Blocked | Không thể hoàn tất vì một trở ngại đã xác định; dẫn tới blocker |
| Inconclusive | Đã chạy nhưng chưa đủ căn cứ kết luận, kể cả khi actual result khớp expected result nhưng thiếu evidence theo quy ước; dẫn tới anomaly report hoặc phân tích |

Khi công cụ dùng tên trạng thái khác, ghi bảng ánh xạ: [tên trong công cụ → trạng thái ở trên].

## 3. Exploratory session

| Session ID | Charter | Người thực hiện | Build | Thời lượng | Phạm vi đã khám phá | Phát hiện | Evidence / anomaly IDs |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [SES-01] | [mục tiêu và giới hạn] | [tên] | [build] | [phút] | [chức năng, dữ liệu, trạng thái đã thử] | [quan sát, câu hỏi, anomaly] | [IDs] |

## 4. Evidence

| Evidence ID | Run / session | Loại | Vị trí | Điều được chứng minh |
| --- | --- | --- | --- | --- |
| [EV-001] | [Run hoặc Session ID] | [log, assertion, request/response, ảnh, video] | [link] | [điều cụ thể mà evidence này xác nhận] |

Evidence không chứa secrets hoặc dữ liệu cá nhân thật. Mức evidence theo quy ước đã thống nhất; không bắt buộc chụp ảnh mọi test.

## 5. Tiêu chí đạt

| ID | Tiêu chí | Điều kiện đầu vào | Kết quả |
| --- | --- | --- | --- |
| Q2-01 | Mỗi lượt chạy xác định instance, test case version, dữ liệu, cấu hình, build, người thực hiện và thời điểm | RC-05 | [Đạt / Không đạt] |
| Q2-02 | Mỗi lượt chạy có expected và actual result, hoặc link tới nơi giữ chúng | RC-02 | |
| Q2-03 | Build ghi trong mỗi lượt chạy khớp với build trong môi trường tại thời điểm chạy | RC-01 | |
| Q2-04 | Mọi lượt chạy Failed hoặc Inconclusive dẫn tới anomaly report hoặc phân tích | IN-09 | |
| Q2-05 | Lượt chạy lại được thêm thành dòng mới; không ghi đè kết quả cũ | — | |
| Q2-06 | Evidence truy cập được, gắn với Run ID hoặc Session ID, không chứa secrets hoặc dữ liệu cá nhân thật | IN-08 | |
| Q2-07 | Mọi lượt chạy có evidence đúng mức đã quy ước cho nhóm rủi ro của nó; lượt chạy khớp expected result nhưng thiếu evidence được ghi là Inconclusive | IN-04, IN-08 | |
| Q2-08 | Exploratory session có charter, thời lượng, phạm vi đã khám phá và phát hiện; không được quy đổi thành số test case | — | |

**Người review / ngày:** [tên, ngày]

## References

1. <a id="ref-1"></a>[Tên tài liệu, lấy từ heading cấp 1 của file nguồn](đường-dẫn) — [version hoặc thời điểm chốt]
