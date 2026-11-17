# Review Findings

Đọc file này để biết requirement đã được review thế nào, những anomaly, recommendation và câu hỏi đã tìm thấy, và quyết định xử lý cho từng finding.

## 1. Cách tổ chức review

| Trường | Nội dung |
| --- | --- |
| Mục đích | [ví dụ: đánh giá requirement có đủ để thiết kế test không] |
| Tài liệu được review | [[n]](#ref-2) [version] |
| Đặc tính được đánh giá | [completeness, correctness, testability, consistency, readability] |
| Loại review | [Informal / Walkthrough / Technical review / Inspection] |
| Kỹ thuật review | [Checklist-based / Scenario-based / khác] |
| Vai trò | [Author; Reviewer; Moderator; Scribe; Review leader; tên từng người] |
| Exit criteria của review | [ví dụ: mọi finding có quyết định; không còn anomaly mức cao chưa xử lý] |

Loại review chọn theo mục tiêu, mức độ quan trọng của tài liệu, yêu cầu pháp lý và nhu cầu lưu vết [[1, §3.2.4]](#ref-1). Trong inspection, author không đóng vai review leader hoặc scribe [[1, §3.2.4]](#ref-1).

## 2. Findings

| Finding ID | Requirement ID / version | Loại | Mô tả | Mức độ | Quyết định | Owner | Hành động | Kết quả |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [RF-01] | [ID; version] | [Anomaly: không nhất quán / mơ hồ / mâu thuẫn / thiếu / không chính xác / trùng lặp; Recommendation; Question] | [mô tả cụ thể, kèm ví dụ cho thấy vấn đề] | [mức] | [Chấp nhận / Từ chối, kèm lý do / Hoãn / Chuyển thành câu hỏi mở `open-questions.md#oq-xxx`] | [tên] | [việc cần làm] | [requirement version mới đã sửa; hoặc "Chưa xử lý"] |

Mỗi finding cần quyết định về trạng thái, người chịu trách nhiệm và hành động [[1, §3.2.2]](#ref-1). Question được ghi vào nơi quản lý câu hỏi mở; file này chỉ dẫn tới ID câu hỏi.

## 3. Kết quả review

**Exit criteria của review:** [Đạt / Chưa đạt; tiêu chí chưa đạt]

**Cần review lại:** [Có, phạm vi và thời điểm / Không]

## 4. Tiêu chí đạt

| ID | Tiêu chí | Điều kiện đầu vào | Kết quả |
| --- | --- | --- | --- |
| Q3-01 | Cách tổ chức review được ghi đủ các trường ở mục 1, kèm version của tài liệu; mục đích khớp với mục tiêu của đợt phân tích; loại review và reviewer khớp với nguồn lực đã xác định | IN-01, IN-10, RC-01 | [Đạt / Không đạt] |
| Q3-02 | Review dùng tiêu chí sẵn sàng đã thống nhất | RC-02 | |
| Q3-03 | Mỗi finding dẫn tới requirement có version, có loại và có ví dụ cụ thể | — | |
| Q3-04 | Mỗi finding có quyết định, owner và hành động; quyết định Từ chối có lý do | RC-04 | |
| Q3-05 | Question được ghi ở nơi quản lý câu hỏi mở và dẫn bằng ID; nội dung không bị chép vào file này | RC-05 | |
| Q3-06 | Finding đã sửa dẫn tới version mới của requirement và đã được kiểm tra lại trên version đó | — | |
| Q3-07 | Exit criteria của review có kết quả đánh giá | — | |

**Người review / ngày:** [tên, ngày]

## References

1. <a id="ref-1"></a>[ISTQB Certified Tester Foundation Level Syllabus v4.0.1](https://www.istqb.org/wp-content/uploads/2024/11/ISTQB_CTFL_Syllabus_v4.0.1.pdf) — v4.0.1, 2024-09-15
2. <a id="ref-2"></a>[Tên tài liệu, lấy từ heading cấp 1 của file nguồn](đường-dẫn) — [version hoặc thời điểm chốt]
