# Lessons Learned

Đọc file này để biết những gì đã hiệu quả, những gì cần cải thiện trong đợt kiểm thử TS-001, và các hành động áp dụng cho đợt sau.

## 1. Phạm vi

| Trường | Nội dung |
| --- | --- |
| Đợt kiểm thử | TS-001 Authentication, Phase 01 đến vòng 1 của Phase 05 (2026-11-17 – 2026-11-19) |
| Nguồn quan sát | Execution Status mục 5 và 6 [[1]](#ref-1); Implementation Status [[2]](#ref-2); LL-007 [[3]](#ref-3); review độc lập của Phase 05; ghi chú khi lập Phase 06 |
| Người tham gia | Agent. Chưa có retrospective với product owner (input IN-11) |

## 2. Quan sát

| Observation ID | Quan sát và dữ liệu | Làm tốt / cần cải thiện | Nguyên nhân | Ảnh hưởng |
| --- | --- | --- | --- | --- |
| OB-01 | Test tự động được kiểm bằng mutant ở Phase 04 trước khi chạy (Implementation Status mục 2). Vòng 1 phát hiện 19 defect; 8 trong 9 khác biệt đã biết có test Failed. Khác biệt còn lại (GO-06) là OB-05 | Làm tốt | Đã xác minh cho test có mutant: mỗi test đó đã thấy fail ít nhất một lần khi hành vi sai. 12 test case chỉ được chấp nhận bằng review assertion (TD-08, GAP-07) | Kết quả Failed đáng tin; product owner duyệt nguyên nhân Product của cả 19 defect mà không phải sửa testware |
| OB-02 | Báo cáo ghi mạnh hơn evidence: bản đầu của Execution Status ghi 299 Passed và 368 instance (gồm 17 test ngoài TS-001); TC-200 ghi Passed khi 6.4.2 chỉ đọc source; câu cũ trong CHANGELOG không được sửa. Review độc lập bắt cả ba lỗi | Cần cải thiện | Đã xác minh, ghi ở LL-007 | Số liệu sai có thể đi vào quyết định của product owner |
| OB-03 | Execution Readiness được lập sau lượt chạy đầu tiên (DV-07), và kết luận Chưa sẵn sàng khi các lượt chạy đã diễn ra | Cần cải thiện | Giả thuyết: PROC-17 được chạy theo thời gian của product owner trước khi agent lập file | Điều kiện vào không có tác dụng chặn cho RUN-001 đến RUN-009 |
| OB-04 | `playwright test --list` ghi đè `results.json` và báo cáo HTML của RUN-013 (DV-08). EV-013 chỉ còn output console và ảnh chụp | Cần cải thiện | Đã xác minh: reporter `html` và `json` chạy cả khi `--list`. Đã sửa ở TD-28 | Mất evidence chi tiết của một suite |
| OB-05 | TC-195, TC-196 Passed cho GO-06 (luôn hiện màn chọn tài khoản), nhưng code không có `prompt=select_account` (GAP-05) | Cần cải thiện | Giả thuyết: Google hiện màn chọn vì trình duyệt có hai phiên Google; precondition của test case không giới hạn số phiên | Một khác biệt đã biết có thể bị ghi là đã khắc phục khi chưa sửa |
| OB-06 | Ba dòng TD-21 đến TD-23 của Execution Status bị ghi vào dòng 1, trước tiêu đề, không có xuống dòng, và đã được commit ở `ce5e35c`. Ba dòng gốc ở mục 6 vẫn là nội dung cũ. `pnpm check` không bắt; agent Phase 06 thấy khi đọc file | Cần cải thiện | Đã xác minh: một lệnh sửa bằng script thêm text vào đầu file thay vì thay dòng | Người đọc thấy trạng thái cũ của TD-21 đến TD-23 |
| OB-07 | Không có phase nào ghi effort thực tế; lịch ở Estimates & Schedule không có ngày (PJ-07) | Cần cải thiện | Đã xác minh: không có trường effort trong file status của các phase | Không so được kế hoạch với thực tế (input IN-13) |
| OB-08 | Ghi kết quả theo suite, không theo ID instance (DV-05, TD-24) | Cần cải thiện | Đã xác minh: Phase 04 không có bảng instance | Số 351 không đối chiếu được với inventory |

## 3. Action items

| Action ID | Observation ID | Hành động | Owner | Hạn / cycle áp dụng | Cách xác nhận đã cải thiện | Trạng thái |
| --- | --- | --- | --- | --- | --- | --- |
| ACT-01 | OB-01 | Giữ yêu cầu "test đã thấy fail ít nhất một lần" cho test case mới, gồm test của TD-19 | Agent | Vòng 2 của TS-001 | Implementation Status ghi mutant cho mỗi test mới | Chưa làm |
| ACT-02 | OB-02 | Áp dụng LL-007; mở rộng check `criteriaWithUnmetInput` và `readinessConclusion` của `scripts/check-stlc-docs.mjs` sang Phase 06 | Agent | 2026-11-19 | `pnpm check` báo lỗi khi tiêu chí Q của Phase 06 là Đạt mà RC đầu vào chưa đạt | Xong |
| ACT-03 | OB-05 | Thêm test CI kiểm URL authorization của Google có `prompt=select_account`; sửa precondition của TC-195 thành một phiên Google | Agent (test); product owner (duyệt đổi test case) | Vòng 2 của TS-001 | Test mới Failed trên `7cdb0f5` và Passed sau bản sửa | Chưa làm |
| ACT-04 | OB-07 | Ghi giờ bắt đầu và kết thúc của mỗi phase vào file status của phase đó | Agent | Vòng 2 của TS-001 | Test Summary Report version sau có mục 4.3 với effort thực tế | Chưa làm |
| ACT-05 | OB-03 | Lập Execution Readiness trước lượt chạy đầu của vòng 2, kể cả lượt chạy thủ công của product owner | Agent; product owner | Vòng 2 của TS-001 | Readiness có giờ lập sớm hơn RUN đầu tiên | Chưa làm |
| ACT-06 | OB-06 | Thêm check: mọi file Markdown trong `docs/testing/test-scopes/` bắt đầu bằng heading `# ` | Agent | 2026-11-19 | `pnpm check` báo lỗi trên bản `ce5e35c` của Execution Status | Xong |
| ACT-07 | OB-08 | Lập inventory instance theo ID trước vòng 2 (TD-24) | Agent | Vòng 2 của TS-001 | Execution Status Q1-02 Đạt | Chưa làm |

OB-04 không có action mới: TD-28 đã sửa config và Procedures & Suites mục 5 yêu cầu chép kết quả trước lần chạy sau.

## 4. Tiêu chí đạt

| ID | Tiêu chí | Điều kiện đầu vào | Kết quả |
| --- | --- | --- | --- |
| Q5-01 | Mỗi observation có dữ liệu hoặc ví dụ cụ thể đi kèm | IN-11 | Đạt một phần: mỗi observation có dữ liệu; IN-11 là Giả định vì chưa có retrospective với product owner |
| Q5-02 | Nguyên nhân của mỗi observation ghi rõ đã xác minh hay giả thuyết | — | Đạt |
| Q5-03 | Mỗi observation "Cần cải thiện" có ít nhất một action item, hoặc ghi lý do không hành động | — | Đạt |
| Q5-04 | Mỗi action item có owner, hạn và cách xác nhận cải thiện | — | Đạt |

**Người review / ngày:** chưa có.

## References

1. <a id="ref-1"></a>[Test Execution Status](../../05-execution/output/01-execution-status.md) — lần chốt 1, 2026-11-19 08:25
2. <a id="ref-2"></a>[Implementation Status](../../04-implementation/output/01-implementation-status.md) — 2026-11-19
3. <a id="ref-3"></a>[Lessons Learned](../../../../../../LESSONS.md) — LL-007
