# Risk Register

Đọc file này để biết các rủi ro sản phẩm và rủi ro dự án của đợt kiểm thử, mức rủi ro của từng rủi ro, và cách mỗi rủi ro được xử lý.

## 1. Cách đánh giá

| Trường | Nội dung |
| --- | --- |
| Cách xác định rủi ro | [workshop, phỏng vấn, rà soát requirement, đối chiếu chuẩn, dữ liệu lỗi cũ] |
| Thang khả năng xảy ra | [các mức và định nghĩa] |
| Thang mức ảnh hưởng | [các mức và định nghĩa] |
| Cách tính mức rủi ro | [ma trận khả năng × ảnh hưởng, hoặc tích số khi đánh giá định lượng [[1, §5.2.3]](#ref-1)] |
| Người tham gia | [tên hoặc vai trò] |

Khi không có dữ liệu để ước lượng khả năng xảy ra, ghi "Chưa xác định" thay vì tự gán một mức.

## 2. Rủi ro sản phẩm

| Risk ID | Rủi ro | Đặc tính chất lượng | Test basis item / feature | Khả năng | Ảnh hưởng | Mức rủi ro | Căn cứ đánh giá | Xử lý |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [PR-01] | [điều có thể sai, với ai, hậu quả] | [ví dụ: functional correctness, security, performance efficiency] | [IDs; version] | [mức] | [mức] | [mức] | [dữ liệu, lỗi cũ, ý kiến chuyên gia; [[n]](#ref-2)] | [Giảm bằng testing, xem Test Approach / Chấp nhận / Chuyển giao / Kế hoạch dự phòng] |

Rủi ro sản phẩm gắn với đặc tính chất lượng theo ISO/IEC 25010 [[1, §5.2.2]](#ref-1).

## 3. Rủi ro dự án

| Risk ID | Rủi ro | Loại | Khả năng | Ảnh hưởng | Mức rủi ro | Biện pháp giảm thiểu / dự phòng | Owner |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [PJ-01] | [ví dụ: build bàn giao trễ, thiếu môi trường] | [Tổ chức / Con người / Kỹ thuật / Nhà cung cấp] | [mức] | [mức] | [mức] | [biện pháp] | [tên] |

## 4. Tiêu chí đạt

| ID | Tiêu chí | Điều kiện đầu vào | Kết quả |
| --- | --- | --- | --- |
| Q2-01 | Mỗi rủi ro sản phẩm dẫn tới test basis item hoặc feature trong phạm vi và tới một đặc tính chất lượng | RC-01 | [Đạt / Không đạt] |
| Q2-02 | Khả năng và ảnh hưởng có căn cứ; không có căn cứ thì ghi "Chưa xác định" | IN-07, IN-08 | |
| Q2-03 | Rủi ro từ chuẩn bắt buộc được xác định theo version và mức áp dụng lấy từ bản gốc | RC-04 | |
| Q2-04 | Mỗi rủi ro sản phẩm có cách xử lý; rủi ro được giảm bằng testing có mặt trong ma trận của Test Approach | — | |
| Q2-05 | Rủi ro sản phẩm có xử lý "Chấp nhận" ghi tên risk owner đã quyết định | RC-02 | |
| Q2-06 | Mỗi rủi ro dự án có owner và biện pháp giảm thiểu hoặc dự phòng | — | |
| Q2-07 | Rủi ro của các hạng mục Out of scope trong Test Plan đã được xem xét | — | |

**Người review / ngày:** [tên, ngày]

## References

1. <a id="ref-1"></a>[ISTQB Certified Tester Foundation Level Syllabus v4.0.1](https://www.istqb.org/wp-content/uploads/2024/11/ISTQB_CTFL_Syllabus_v4.0.1.pdf) — v4.0.1, 2024-09-15
2. <a id="ref-2"></a>[Tên tài liệu, lấy từ heading cấp 1 của file nguồn](đường-dẫn) — [version hoặc thời điểm chốt]
