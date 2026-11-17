# Entry & Exit Criteria

Đọc file này để biết điều kiện để bắt đầu từng hoạt động hoặc test level, điều kiện để coi là hoàn thành, và khi nào phải tạm dừng hoặc được tiếp tục.

## 1. Entry criteria

| Criterion ID | Hoạt động / test level | Điều kiện | Cách kiểm tra | Nguồn dữ liệu |
| --- | --- | --- | --- | --- |
| [EN-01] | [ví dụ: system test] | [ví dụ: smoke test pass trên build được bàn giao] | [lệnh, checklist] | [CI, file] |

Entry criteria thường gồm: tài nguyên sẵn sàng (người, công cụ, môi trường, test data, ngân sách, thời gian); testware sẵn sàng (test basis, requirement kiểm thử được, test case); chất lượng ban đầu của test object, ví dụ smoke test đã pass [[1, §5.1.3]](#ref-1).

## 2. Exit criteria

| Criterion ID | Test level | Loại | Tiêu chí | Ngưỡng / mẫu số | Objective IDs | Nguồn của ngưỡng |
| --- | --- | --- | --- | --- | --- | --- |
| [EX-01] | [level] | [Mức độ kỹ lưỡng / Có hoặc không] | [ví dụ: coverage của rủi ro Cao; số defect chưa giải quyết theo severity; mọi test đã lên kế hoạch đã chạy] | [giá trị; mẫu số] | [IDs] | [[n]](#ref-2) [chuẩn hoặc quyết định]; hoặc "Người lập plan đề xuất", kèm lý do |

Exit criteria có hai loại: đo mức độ kỹ lưỡng (coverage đạt được, số defect chưa giải quyết, defect density, số test fail) và tiêu chí có hoặc không (test đã lên kế hoạch đã chạy, static testing đã làm, mọi defect đã được báo cáo, regression đã automation). Hết thời gian hoặc ngân sách chỉ được dùng làm điều kiện kết thúc khi stakeholder đã review và chấp nhận rủi ro của việc dừng test [[1, §5.1.3]](#ref-1).

## 3. Suspension và resumption criteria

| Criterion ID | Loại | Điều kiện | Người quyết định |
| --- | --- | --- | --- |
| [SR-01] | [Tạm dừng / Tiếp tục] | [ví dụ: tạm dừng khi smoke test fail trên build mới; tiếp tục khi build sửa lỗi pass smoke test] | [vai trò] |

## 4. Phê duyệt

| Người duyệt | Quyết định | Ngày | Version |
| --- | --- | --- | --- |
| [tên] | [Duyệt / Chưa duyệt] | [ngày] | [version] |

## 5. Tiêu chí đạt

| ID | Tiêu chí | Điều kiện đầu vào | Kết quả |
| --- | --- | --- | --- |
| Q4-01 | Mỗi tiêu chí đo được: có metric, ngưỡng, mẫu số và nguồn dữ liệu | — | [Đạt / Không đạt] |
| Q4-02 | Ngưỡng khác nhau theo mức rủi ro khi rủi ro khác nhau; mỗi ngưỡng có nguồn, giá trị do người lập plan đề xuất ghi lý do | IN-07 | |
| Q4-03 | Mỗi exit criterion dẫn tới ít nhất một mục tiêu kiểm thử | — | |
| Q4-04 | Tiêu chí từ chuẩn bắt buộc dùng version và mức áp dụng lấy từ bản gốc | RC-04 | |
| Q4-05 | Kết thúc do hết thời gian hoặc ngân sách chỉ được phép khi có stakeholder chấp nhận rủi ro | RC-02 | |
| Q4-06 | Exit criteria được người có thẩm quyền duyệt trước khi bắt đầu chạy test | RC-02 | |
| Q4-07 | Mỗi suspension criterion có resumption criterion tương ứng và người quyết định | — | |

**Người review / ngày:** [tên, ngày]

## References

1. <a id="ref-1"></a>[ISTQB Certified Tester Foundation Level Syllabus v4.0.1](https://www.istqb.org/wp-content/uploads/2024/11/ISTQB_CTFL_Syllabus_v4.0.1.pdf) — v4.0.1, 2024-09-15
2. <a id="ref-2"></a>[Tên tài liệu, lấy từ heading cấp 1 của file nguồn](đường-dẫn) — [version hoặc thời điểm chốt]
