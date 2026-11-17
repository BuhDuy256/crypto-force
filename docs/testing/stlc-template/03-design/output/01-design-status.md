# Test Design Status

Đọc file này để biết từng test basis item đã được phân tích và thiết kế test tới đâu, coverage của từng test model so với target, và việc gì còn phải làm.

## 1. Phạm vi

| Trường | Nội dung |
| --- | --- |
| Version / thời điểm chốt | [version; ngày giờ, múi giờ] |
| Phạm vi | [feature, test level, test type] |
| Test basis | [[n]](#ref-n) [version] |
| Test Plan | [[n]](#ref-n) [version] |
| Snapshot test design | [commit, tag hoặc version] |
| Người thực hiện / người review | [tên hoặc vai trò] |
| File chi tiết | [Test Conditions](02-test-conditions.md), [Test Models](03-test-models.md), [Test Cases](04-test-cases.md), [Data & Environment Requirements](05-data-and-environment-requirements.md) |

## 2. Truy vết theo test basis item

| Test basis item / version | Rủi ro | Test condition IDs | Test model IDs | Test case / charter IDs | Trạng thái | Phần thiếu |
| --- | --- | --- | --- | --- | --- | --- |
| [ID; version] | [mức] | [IDs] | [IDs] | [IDs] | [trạng thái] | [mô tả; hoặc "Không có"] |

| Trạng thái | Định nghĩa |
| --- | --- |
| Đã thiết kế | Có test condition, test model và test case phủ đủ coverage item theo target |
| Một phần | Có test case nhưng chưa đạt coverage target |
| Bị chặn bởi lỗi test basis | Chờ trả lời từ nguồn test basis; dẫn tới ID lỗi ở Test Conditions mục 4 |
| Chưa thiết kế | Chưa có test condition |
| Không test | Có quyết định không test, kèm người quyết định |

## 3. Coverage theo test model

| Test model ID | Technique | Coverage criterion | Coverage item (N) | Item có test case (D) | D / N | Target | Gap |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [MD-01] | [technique] | [ví dụ: valid transitions] | [số] | [số] | [%] | [% và nguồn] | [Coverage item IDs chưa có test case] |

Mỗi dòng chỉ tính trên coverage item của một model. Không cộng các model khác technique thành một tỷ lệ chung. N bằng 0 thì ghi N/A.

## 4. Việc còn lại

| ID | Việc | Liên quan | Owner | Hạn | Nơi theo dõi |
| --- | --- | --- | --- | --- | --- |
| [TD-01] | [việc cụ thể] | [IDs] | [tên] | [ngày] | [link] |

## 5. Tiêu chí đạt

| ID | Tiêu chí | Điều kiện đầu vào | Kết quả |
| --- | --- | --- | --- |
| Q1-01 | Version của test basis, Test Plan và snapshot test design được ghi rõ | RC-01 | [Đạt / Không đạt] |
| Q1-02 | Mỗi test basis item trong phạm vi có một dòng ở mục 2, với trạng thái theo định nghĩa | IN-01, IN-02 | |
| Q1-03 | Coverage của mỗi model có tử số, mẫu số và target có nguồn; không gộp các model khác technique | RC-03 | |
| Q1-04 | Mọi model chưa đạt target có gap được liệt kê, kèm mức rủi ro của phần chưa phủ | RC-02, RC-03 | |
| Q1-05 | Mọi item "Không test" có người quyết định | — | |
| Q1-06 | Mọi việc còn lại có owner và nơi theo dõi | — | |

**Người review / ngày:** [tên, ngày]

## References

1. <a id="ref-1"></a>[Tên tài liệu, lấy từ heading cấp 1 của file nguồn](đường-dẫn) — [version hoặc thời điểm chốt]
