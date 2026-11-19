# Defect Summary

Đọc file này để biết tình trạng defects của TS-001 tại thời điểm chốt dữ liệu, những defect chưa giải quyết có ảnh hưởng lớn, và chất lượng của các bản sửa.

## 1. Phạm vi số liệu

| Trường | Nội dung |
| --- | --- |
| Đối tượng được đánh giá | Commit `7cdb0f5`; DEF-19 từ RUN-007 trên `b35a791` (input IN-06) |
| Thời điểm chốt dữ liệu | 2026-11-19 08:25 (UTC+7), trùng với Execution & Coverage |
| Nguồn | Defect Reports mục 2 [[1]](#ref-1). Dự án không có tracker; file này là danh sách defect |
| Tập defect | Phát hiện trong vòng 1 của Phase 05. Gồm 8 trong 9 khác biệt đã biết ở Requirement Readiness mục 4 [[2]](#ref-2) |
| Định nghĩa severity và priority | Skill `test-defect-classification` (EX-03 [[3]](#ref-3)); product owner duyệt severity 2026-11-19; priority đặt theo severity |

## 2. Trạng thái

| Nhóm trạng thái | Số ticket | Trạng thái tương ứng trong tracker |
| --- | --- | --- |
| Open / In progress / Reopened | 19 | Open: DEF-01 đến DEF-19 |
| Fixed, chờ confirmation test | 0 | |
| Verified | 0 | |
| Deferred | 0 | |
| Rejected / Not a defect | 0 | |
| Duplicate | 0 | |
| Chờ triage | 0 | Product owner duyệt nguyên nhân và severity 2026-11-19 (Execution Status TD-21) |
| **Tổng** | **19** | |

| Chỉ số | Giá trị | Cách tính |
| --- | --- | --- |
| Ticket mới trong cycle / có sẵn trước cycle | 19 / 0 | Mọi report có ngày phát hiện 2026-11-19 [[1]](#ref-1) |
| Defect đã xác nhận | 19 | 19 − 0 − 0 − 0 |
| Defect chưa giải quyết | 19 | 19 + 0 + 0 |
| Anomaly chưa rõ nguyên nhân | 1 | TC-017, TC-021 dòng 3 chập chờn ở Phase 04 (Implementation Status TD-16); không tái hiện ở RUN-012, RUN-013 |

## 3. Defect chưa giải quyết theo severity

| Severity | Open / In progress / Reopened | Fixed chờ confirmation test | Deferred | Tổng |
| --- | --- | --- | --- | --- |
| Critical | 0 | 0 | 0 | 0 |
| Major | 7: DEF-01, 02, 03, 05, 06, 09, 18 | 0 | 0 | 7 |
| Minor | 11: DEF-04, 07, 08, 10, 11, 13 đến 17, 19 | 0 | 0 | 11 |
| Trivial | 1: DEF-12 | 0 | 0 | 1 |

## 4. Defect quan trọng

Tiêu chí chọn: mọi defect Major, mọi defect gắn với EX-04 (ASVS) hoặc EX-06 (khác biệt đã biết), và DEF-11 vì nó liên quan tới EX-05 (accessibility). Không có workaround cho người dùng ở defect nào; không có owner sửa và hạn sửa vì dự án chưa giao (PJ-01).

| Defect ID | Hành vi sai và người dùng bị ảnh hưởng | Severity / priority | Trạng thái và evidence confirmation test | Exit criterion | Owner / hạn sửa |
| --- | --- | --- | --- | --- | --- |
| DEF-01 | Sign in khóa sau 5 lần trong 15 phút, không phải 3 lần trong 10 giây; UI không báo khóa. Mọi người dùng Sign in; kẻ đoán password | Major / Cao | Open; chưa có confirmation test (RUN-012, RUN-013) | EX-04 (6.3.1), EX-06 (SI-06) | Chưa giao |
| DEF-02 | Sign in lại khi đang có phiên không hủy token cũ (session fixation) | Major / Cao | Open; chưa có confirmation test | EX-04 (7.2.4) | Chưa giao |
| DEF-03 | Phiên không có thời hạn tuyệt đối 30 ngày | Major / Cao | Open; chưa có confirmation test | EX-04 (7.3.2), EX-06 (SS-05) | Chưa giao |
| DEF-05 | Đặt password bằng một link reset không làm các link reset khác hết hiệu lực | Major / Cao | Open; chưa có confirmation test | EX-03; expected từ BD-07(a), không thuộc mục ASVS nào của MD-14 | Chưa giao |
| DEF-04 | Phiên và link reset còn được chấp nhận đúng tại thời điểm hết hạn | Minor / Trung bình | Open; chưa có confirmation test | EX-04 (6.4.1, qua TC-046) | Chưa giao |
| DEF-06 | Không kiểm password phổ biến và Pwned Passwords | Major / Cao | Open; chưa có confirmation test | EX-04 (6.2.4, 6.2.12), EX-06 (CA-14) | Chưa giao |
| DEF-09 | Mở link xác minh của B khi đang đăng nhập A chuyển phiên sang B | Major / Cao | Open; chưa có confirmation test | EX-06 (SS-06) | Chưa giao |
| DEF-18 | Trang có token reset không đặt `Referrer-Policy: no-referrer` | Major / Cao | Open; chưa có confirmation test | EX-04 (3.4.5) | Chưa giao |
| DEF-07, DEF-08 | Độ dài password đếm theo UTF-16; form không giới hạn password 128 và Full name 100 | Minor / Trung bình | Open; chưa có confirmation test | EX-04 (6.2.1, 6.2.9), EX-06 (CA-13, CM-02) | Chưa giao |
| DEF-11 | Forgot password và Choose a new password không có danh sách lỗi (A11Y-01) | Minor / Trung bình | Open; chưa có confirmation test | Liên quan EX-05 nhưng không thuộc ngưỡng axe của nó | Chưa giao |
| DEF-16 | Reset password bắt đầu từ màn chặn Backtest mở Realtime | Minor / Trung bình | Open; chưa có confirmation test | EX-06 (RP-08) | Chưa giao |
| DEF-17 | Response của API thiếu `X-Content-Type-Options`, `Referrer-Policy`, CSP `frame-ancestors` | Minor / Trung bình | Open; chưa có confirmation test | EX-04 (3.4.4, 3.4.6), EX-06 (SEC-08) | Chưa giao |
| DEF-19 | Google với email của tài khoản chưa xác minh hiện thông báo chung | Minor / Trung bình | Open; chưa có confirmation test (RUN-007, input IN-06) | EX-06 (GO-03) | Chưa giao |

Phần "Actual" của nhiều report lấy từ dry run Phase 04 trên `b4ca981` (Implementation Status mục 4.1), không đo lại ở `7cdb0f5`. Test fail ở `7cdb0f5` xác nhận hành vi sai còn đó, nhưng chi tiết như con số ở "Actual" có thể khác.

## 5. Bản sửa và regression

| Nội dung | Kết quả | Evidence |
| --- | --- | --- |
| Bản sửa có confirmation test pass | Không có | Defect Reports mục 4 |
| Bản sửa có confirmation test fail hoặc chưa có confirmation test | Không có bản sửa | |
| Phạm vi regression sau các bản sửa | Chưa có bản sửa. Lần chạy đầy đủ trên `7cdb0f5`: `pnpm test` (RUN-012) và `pnpm test:e2e` (RUN-013) | EV-012, EV-013 |
| Defect tái xuất hiện, failure không ổn định | Không có defect tái xuất hiện. TC-017, TC-021 dòng 3 chập chờn ở Phase 04; mỗi test chạy một lần ở RUN-012, RUN-013 và pass; nguyên nhân chưa rõ (TD-16) | Implementation Status mục 4 |

## 6. Tiêu chí đạt

| ID | Tiêu chí | Điều kiện đầu vào | Kết quả |
| --- | --- | --- | --- |
| Q3-01 | Query và thời điểm chốt được ghi; thời điểm chốt trùng với file Execution & Coverage | RC-05 | Đạt một phần: thời điểm chốt trùng; nguồn là Defect Reports mục 2. RC-05 đạt một phần vì đơn vị instance (TD-24), không ảnh hưởng số defect |
| Q3-02 | Tổng các nhóm ở mục 2 bằng tổng ticket; mỗi ticket thuộc đúng một nhóm | IN-08 | Đạt |
| Q3-03 | Fixed và Verified được tách riêng; Duplicate, Rejected và Chờ triage không được tính là defect đã xác nhận | — | Đạt |
| Q3-04 | Mọi defect ở mục 4 có evidence confirmation test hoặc ghi rõ chưa có confirmation test | — | Đạt |
| Q3-05 | Failure không ổn định được ghi là anomaly, không bị bỏ qua sau một lần rerun pass | — | Đạt: TD-16 ở mục 2 và 5 |

**Người review / ngày:** chưa có.

## References

1. <a id="ref-1"></a>[Defect Reports](../../05-execution/output/03-defect-reports.md) — lần chốt 1, 2026-11-19
2. <a id="ref-2"></a>[Requirement Readiness](../../01-requirement-analysis/output/01-requirement-readiness.md) — mục 4
3. <a id="ref-3"></a>[Entry & Exit Criteria](../../02-planning/output/04-entry-exit-criteria.md) — version 1.1, 2026-11-17
