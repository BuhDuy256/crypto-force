# Test Plan

Đọc file này để biết đợt kiểm thử nhằm mục tiêu gì, phạm vi đến đâu, dựa trên giả định và ràng buộc nào, ai tham gia, giao tiếp thế nào, và kế hoạch đã được duyệt hay chưa.

## 1. Thông tin kế hoạch

| Trường | Nội dung |
| --- | --- |
| Plan ID / version / trạng thái | [ID; version; Draft / Reviewed / Approved] |
| Feature / release / iteration | [tên] |
| Người lập / người review | [tên hoặc vai trò] |
| File chi tiết | [Risk Register](02-risk-register.md), [Test Approach](03-test-approach.md), [Entry & Exit Criteria](04-entry-exit-criteria.md), [Estimates & Schedule](05-estimates-and-schedule.md) |

| Version | Ngày | Thay đổi | Người cập nhật | Người duyệt |
| --- | --- | --- | --- | --- |
| [version] | [ngày] | [thay đổi về phạm vi, approach, criteria hoặc lịch] | [tên] | [tên] |

## 2. Mục tiêu

| Objective ID | Mục tiêu kiểm thử | Rủi ro liên quan | Exit criteria liên quan |
| --- | --- | --- | --- |
| [OBJ-01] | [điều cần đánh giá hoặc chứng minh] | [Risk IDs] | [Criterion IDs] |

## 3. Phạm vi

| Scope ID | Hành vi / thành phần / test type / cấu hình | In / Out | Test basis item / version | Căn cứ |
| --- | --- | --- | --- | --- |
| [SC-01] | [mô tả cụ thể] | [In / Out] | [IDs; version] | [lý do; [[n]](#ref-n)] |

Hạng mục Out of scope ghi lý do, và rủi ro của việc không test nằm ở [Risk Register](02-risk-register.md).

## 4. Giả định và ràng buộc

| ID | Loại | Nội dung | Nguồn | Ảnh hưởng nếu sai hoặc thay đổi |
| --- | --- | --- | --- | --- |
| [AS-01] | [Giả định / Ràng buộc] | [nội dung cụ thể] | [[n]](#ref-n) [hoặc "Người lập plan giả định"] | [phần kế hoạch nào phải thay đổi] |

## 5. Stakeholder

| Vai trò | Người | Trách nhiệm trong testing | Duyệt hoặc quyết định gì |
| --- | --- | --- | --- |
| [ví dụ: Product owner] | [tên] | [trách nhiệm] | [plan / exit criteria / chấp nhận rủi ro / release] |

## 6. Giao tiếp

| Thông tin | Hình thức | Tần suất | Người nhận | Template hoặc nơi lưu |
| --- | --- | --- | --- | --- |
| [ví dụ: tiến độ, defect, test summary] | [báo cáo, dashboard, chat, họp] | [hằng ngày / mỗi cycle / một lần] | [vai trò] | [link] |

## 7. Phê duyệt

| Vai trò | Người | Quyết định | Ngày | Plan version | Điều kiện |
| --- | --- | --- | --- | --- | --- |
| [người duyệt plan] | [tên] | [Duyệt / Duyệt có điều kiện / Chưa duyệt] | [ngày] | [version] | [điều kiện hoặc "Không có"] |

Sau khi duyệt, mọi thay đổi về phạm vi, approach, criteria hoặc lịch được ghi thành version mới ở mục 1.

## 8. Tiêu chí đạt

| ID | Tiêu chí | Điều kiện đầu vào | Kết quả |
| --- | --- | --- | --- |
| Q1-01 | Phạm vi liệt kê từng hạng mục In và Out, kèm test basis item có version | RC-01 | [Đạt / Không đạt] |
| Q1-02 | Mỗi mục tiêu dẫn tới ít nhất một rủi ro và một exit criterion | — | |
| Q1-03 | Giả định và ràng buộc được tách riêng; mỗi dòng có nguồn hoặc ghi rõ là giả định của người lập plan | RC-03 | |
| Q1-04 | Người duyệt plan, người duyệt exit criteria và risk owner được ghi tên | RC-02 | |
| Q1-05 | Cách giao tiếp ghi rõ hình thức, tần suất và người nhận cho từng loại thông tin | IN-04 | |
| Q1-06 | Các file 02–05 đạt tiêu chí của chúng, hoặc phần chưa đạt được ghi là giả định ở mục 4 | — | |
| Q1-07 | Plan đã được duyệt với version cụ thể trước khi bắt đầu thiết kế test | RC-02 | |

**Người review / ngày:** [tên, ngày]

## References

1. <a id="ref-1"></a>[Tên tài liệu, lấy từ heading cấp 1 của file nguồn](đường-dẫn) — [version hoặc thời điểm chốt]
