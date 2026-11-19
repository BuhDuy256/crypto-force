# Phase 01: Requirement Analysis

Đọc file này để biết Phase 01 tạo ra kết quả gì, phục vụ ai, và dùng các template trong thư mục này theo thứ tự nào.

## Kết quả của phase

| Câu hỏi | Trả lời |
| --- | --- |
| Đạt kết quả gì | Mỗi requirement trong phạm vi đã được review theo tiêu chí sẵn sàng đã thống nhất và đối chiếu với một baseline độc lập. Kết quả gồm trạng thái sẵn sàng của từng requirement, các anomaly đã được quyết định xử lý, và các câu hỏi mở được ghi đúng nơi quản lý. |
| Phục vụ ai | Người giữ requirement cần biết requirement nào thiếu, mơ hồ hoặc mâu thuẫn; người lập test plan cần biết phạm vi nào đã sẵn sàng và nguồn rủi ro nào còn mở; người thiết kế test cần test basis có version và đã được xác nhận. |
| Trong phạm vi | Review requirement theo tiêu chí sẵn sàng; đối chiếu với baseline độc lập; ghi anomaly, recommendation và câu hỏi; theo dõi quyết định xử lý; ghi khác biệt giữa requirement và implementation hiện có. |
| Ngoài phạm vi | Viết hoặc sửa requirement, việc của người giữ requirement. Chốt câu hỏi mở thay người có thẩm quyền. Lập risk register và test approach. Sinh test condition và test case. |
| Tiêu chuẩn đạt | Mỗi file output có mục **Tiêu chí đạt** riêng. |

Phase này là static testing áp dụng cho requirement: đánh giá completeness, correctness, testability và consistency mà không cần chạy phần mềm [[1, §3.1]](#ref-1). Lỗi thường tìm thấy ở requirement gồm: không nhất quán, mơ hồ, mâu thuẫn, thiếu, không chính xác và trùng lặp [[1, §3.1.3]](#ref-1).

## Các file

| File | Nội dung | Bắt buộc |
| --- | --- | --- |
| [input/01-analysis-readiness.md](input/01-analysis-readiness.md) | Thông tin cần có, trạng thái xác minh, điều kiện để bắt đầu review | Có |
| [output/01-requirement-readiness.md](output/01-requirement-readiness.md) | Trạng thái sẵn sàng của từng requirement, khác biệt giữa requirement và implementation | Có |
| [output/02-baseline-comparison.md](output/02-baseline-comparison.md) | Đối chiếu requirement với baseline độc lập và danh sách gap | Có |
| [output/03-review-findings.md](output/03-review-findings.md) | Cách tổ chức review, anomaly, recommendation, câu hỏi và quyết định xử lý | Có |

Mỗi tiêu chí đạt trong file output ghi điều kiện đầu vào tương ứng (ID dạng `IN-xx` hoặc `RC-xx` trong file input). Điều kiện đầu vào không đạt thì tiêu chí tương ứng cũng không đạt.

## Thứ tự thực hiện

1. Điền `input/01-analysis-readiness.md` và kết luận trạng thái sẵn sàng.
2. Lập `03-review-findings.md` và `02-baseline-comparison.md`. Hai việc này không phụ thuộc nhau; gap tìm thấy ở bước đối chiếu baseline được ghi thành finding ở `03`.
3. Lập `01-requirement-readiness.md` sau cùng, khi các finding đã có quyết định xử lý.

## References

1. <a id="ref-1"></a>[ISTQB Certified Tester Foundation Level Syllabus v4.0.1](https://www.istqb.org/wp-content/uploads/2024/11/ISTQB_CTFL_Syllabus_v4.0.1.pdf) — v4.0.1, 2024-09-15
