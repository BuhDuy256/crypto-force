# Test Approach

Đọc file này để biết mỗi rủi ro được giảm bằng test level và test type nào, dùng technique và coverage target nào theo mức rủi ro, phần nào được automation, và các số liệu cần thu thập.

## 1. Test type và test level

### 1.1. Test type đã xem xét

Mỗi dòng là một đặc tính chất lượng theo ISO/IEC 25010 [[1, §2.2.2]](#ref-1). Mọi dòng đều có quyết định, kể cả khi quyết định là Out.

| Đặc tính chất lượng | Có rủi ro trong phạm vi | Quyết định | Lý do / Risk IDs |
| --- | --- | --- | --- |
| Functional suitability | [Có / Không / Chưa xác định] | [In / Out] | [lý do; Risk IDs] |
| Performance efficiency | | | |
| Compatibility | | | |
| Usability (interaction capability) | | | |
| Reliability | | | |
| Security | | | |
| Maintainability | | | |
| Portability (flexibility) | | | |
| Safety | | | |

Đặc tính có rủi ro nhưng quyết định Out được ghi vào [Risk Register](02-risk-register.md) với cách xử lý khác testing.

### 1.2. Ma trận test level × test type

| Test level | Functional | [Non-functional: đặc tính chất lượng] | [Non-functional: đặc tính chất lượng] | White-box |
| --- | --- | --- | --- | --- |
| Component | [In / Out; Risk IDs; công cụ] | | | |
| Component integration | | | | |
| System | | | | |
| System integration | | | | |
| Acceptance | | | | |

Mỗi cột non-functional là một đặc tính có quyết định In ở mục 1.1. Ô "In" ghi Risk IDs được giảm ở đó; ô "Out" có thể để trống.

**Ranh giới giữa các test level:** [thành phần nào được test riêng, điểm tích hợp nào, thành phần nào được mock ở level nào và hành vi thật nào bị mất khi mock]

**Confirmation testing và regression testing:** [khi nào chạy lại, phạm vi regression sau mỗi thay đổi, regression nào được automation]

## 2. Technique và coverage theo mức rủi ro

| Mức rủi ro | Test type | Technique | Coverage criterion | Coverage target | Nguồn của giá trị |
| --- | --- | --- | --- | --- | --- |
| [Cao] | [Functional] | [ví dụ: State Transition] | [ví dụ: all transitions] | [%] | [chuẩn, quyết định của người duyệt, hoặc "Người lập plan đề xuất", kèm lý do] |

Mỗi giá trị target ghi nguồn. Giá trị do người lập plan đề xuất được duyệt riêng từng giá trị, kèm lý do chọn.

## 3. Chuẩn bắt buộc

| Chuẩn | Version | Mức áp dụng | Phần áp dụng | Risk IDs |
| --- | --- | --- | --- | --- |
| [ví dụ: OWASP ASVS] | [version] | [level] | [chương, mục] | [IDs] |

## 4. Automation và phân bổ test

| Test level | Automated / Manual | Công cụ | Chạy ở đâu | Khi nào chạy |
| --- | --- | --- | --- | --- |
| [level] | [Automated / Manual / Kết hợp] | [framework] | [local, CI] | [mỗi commit, mỗi PR, trước release] |

**Phân bổ theo test pyramid:** [số lượng tương đối giữa các tầng, và lý do lệch khỏi dạng kim tự tháp nếu có]

## 5. Độc lập trong testing

| Hoạt động | Ai thực hiện | Mức độc lập |
| --- | --- | --- |
| [ví dụ: viết component test, review test model, chạy acceptance test] | [vai trò] | [tác giả tự test / người khác trong nhóm / nhóm độc lập] |

## 6. Yêu cầu test data và môi trường

| Yêu cầu | Test level | Thật / được phép mock | Ràng buộc |
| --- | --- | --- | --- |
| [ví dụ: database, dịch vụ email, OAuth provider] | [level] | [Thật / Mock, kèm hành vi thật bị mất] | [ví dụ: không dùng được tài khoản thật] |

Chi tiết từng yêu cầu được xác định ở bước thiết kế test.

## 7. Metrics

| Metric | Loại | Định nghĩa: tử số / mẫu số | Nguồn dữ liệu | Tần suất |
| --- | --- | --- | --- | --- |
| [ví dụ: requirement coverage] | [Tiến độ / Chất lượng sản phẩm / Defect / Rủi ro / Coverage / Chi phí] | [công thức] | [công cụ hoặc file] | [tần suất] |

## 8. Deliverables

| Deliverable | Phase tạo ra | Nơi lưu |
| --- | --- | --- |
| [ví dụ: test case, test log, test summary report] | [phase] | [link] |

## 9. Khác biệt so với test policy và test strategy

| Nội dung trong policy hoặc strategy | Khác biệt trong plan này | Lý do | Người duyệt |
| --- | --- | --- | --- |
| [[n]](#ref-n) [mục] | [khác biệt] | [lý do] | [tên] |

Ghi "Không có" nếu plan tuân theo policy và strategy hiện có.

## 10. Tiêu chí đạt

| ID | Tiêu chí | Điều kiện đầu vào | Kết quả |
| --- | --- | --- | --- |
| Q3-01 | Mỗi rủi ro sản phẩm có xử lý "Giảm bằng testing" xuất hiện ở ít nhất một ô của ma trận; mỗi ô "In" có Risk IDs | — | [Đạt / Không đạt] |
| Q3-02 | Ranh giới test level khớp với kiến trúc; thành phần được mock ghi rõ hành vi thật bị mất | RC-05 | |
| Q3-03 | Mỗi coverage target có nguồn; giá trị do người lập plan đề xuất được ghi lý do và đã được duyệt riêng | RC-02 | |
| Q3-04 | Chuẩn bắt buộc có version, mức áp dụng và phần áp dụng lấy từ bản gốc | RC-04 | |
| Q3-05 | Lựa chọn automation ghi công cụ, nơi chạy và thời điểm chạy, dựa trên hạ tầng hiện có | IN-09 | |
| Q3-06 | Mỗi metric có tử số, mẫu số và nguồn dữ liệu | — | |
| Q3-07 | Khác biệt so với test policy hoặc test strategy có lý do và người duyệt | IN-03 | |
| Q3-08 | Mọi đặc tính chất lượng ở mục 1.1 có quyết định và lý do; đặc tính có rủi ro nhưng quyết định Out có mặt trong Risk Register | IN-08 | |

**Người review / ngày:** [tên, ngày]

## References

1. <a id="ref-1"></a>[ISTQB Certified Tester Foundation Level Syllabus v4.0.1](https://www.istqb.org/wp-content/uploads/2024/11/ISTQB_CTFL_Syllabus_v4.0.1.pdf) — v4.0.1, 2024-09-15
2. <a id="ref-2"></a>[Tên tài liệu, lấy từ heading cấp 1 của file nguồn](đường-dẫn) — [version hoặc thời điểm chốt]
