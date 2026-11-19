# Test Closure & Handover

Đọc file này để biết testware, môi trường và các việc tồn đọng của TS-001 được lưu ở đâu, và việc gì còn lại trước khi đóng đợt kiểm thử.

## 1. Bàn giao

TS-001 chưa kết thúc (mục 2), nên chưa có bàn giao. Bảng dưới ghi vị trí hiện tại để vòng 2 dùng lại.

| Hạng mục | Vị trí lưu | Người nhận | Trạng thái | Việc còn lại / hạn |
| --- | --- | --- | --- | --- |
| Test basis, test plan và Test Summary Report bản cuối | `docs/testing/test-scopes/TS-001-auth/` (Phase 01, 02, 06); test basis ở `docs/design/prototype/docs/requirements/`, `docs/architecture/` | Product owner | Chưa làm | Bản cuối của báo cáo sau vòng 2 |
| Test case, script, charter và test data có thể dùng lại | `03-design/output/04-test-cases.md`; `apps/api/test/`, `apps/web/e2e/`, test của `packages/shared` và `apps/web`; `04-implementation/output/03-test-data.md` | Agent (vòng 2) | Chưa làm | Không có |
| Execution log, evidence, traceability và coverage report | `05-execution/output/`, `05-execution/evidence/`; [Execution & Coverage](02-execution-and-coverage.md) | Product owner | Chưa làm | Evidence của RUN-013 chỉ còn output console và ảnh chụp (DV-08) |
| Change request hoặc backlog item cho defect và coverage gap chưa giải quyết | Chưa có: dự án không có tracker; defect nằm ở [Defect Reports](../../05-execution/output/03-defect-reports.md), gap ở [Execution & Coverage, mục 5](02-execution-and-coverage.md#5-coverage-gaps) | Product owner | Chưa làm | Tạo item khi có developer (CD-01) |
| Rủi ro còn lại và quyết định liên quan | [Residual Risks](04-residual-risks.md) | Product owner | Chưa làm | CD-05 |
| Môi trường test, tài nguyên và dữ liệu tạm, đưa về trạng thái đã thống nhất | Database `_test`, `_e2e` tạo lại từ migration mỗi lần chạy; trạng thái đã thống nhất: Test Environment [[1]](#ref-1) | Agent | Chưa làm | Kiểm khi đóng; không cần dọn giữa vòng 1 và vòng 2 |
| Quyền truy cập và thời gian lưu evidence | Evidence trong git, cùng quyền với repo. Chưa có quy định thời gian lưu | Product owner | Chưa làm | Quyết định thời gian lưu khi đóng |

## 2. Kết luận closure

**Trạng thái:** Chưa bắt đầu

**Phạm vi đã đóng:** Không có.

**Lý do đóng:** Chưa đóng. Exit criteria Không đạt và vòng 2 (M-07, M-08) chưa làm (Test Summary Report mục 7.1).

**Việc còn lại:** CD-01 đến CD-05 ở Test Summary Report mục 7.1; TD-16, TD-18, TD-19, TD-20, TD-24, TD-25 ở Execution Status mục 6; ACT-01, ACT-03, ACT-04, ACT-05, ACT-07 ở Lessons Learned mục 3.

Đóng đợt test không có nghĩa là sản phẩm đạt exit criteria. Kết luận về exit criteria nằm ở [Test Summary Report, mục 5](01-test-summary-report.md#5-exit-criteria).

## 3. Tiêu chí đạt

| ID | Tiêu chí | Điều kiện đầu vào | Kết quả |
| --- | --- | --- | --- |
| Q6-01 | Mọi hạng mục bàn giao có vị trí lưu truy cập được và người nhận | IN-12 | Đạt một phần: mọi hạng mục có người nhận; change request chưa có vị trí vì dự án không có tracker |
| Q6-02 | Mọi defect chưa giải quyết ở file Defects và mọi coverage gap đều có change request hoặc backlog item | IN-08 | Không đạt: chưa có change request (CD-01) |
| Q6-03 | Môi trường test được đưa về trạng thái đã thống nhất, hoặc ghi rõ việc còn lại | IN-12 | Đạt: việc còn lại ở mục 1 |
| Q6-04 | Mọi việc còn lại có owner và nơi theo dõi | — | Đạt |
| Q6-05 | Khi kết thúc sớm, phần chưa hoàn tất và ảnh hưởng được ghi rõ | — | Đạt: không kết thúc sớm; TS-001 chưa đóng |

**Người review / ngày:** chưa có.

## References

1. <a id="ref-1"></a>[Test Environment](../../04-implementation/output/04-test-environment.md) — 2026-11-19
