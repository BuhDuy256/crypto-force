# Test Implementation Status

Đọc file này để biết từng test case của TS-001 đã có đủ testware, data và môi trường để chạy hay chưa, testware khác test design ở đâu, và việc gì còn phải làm.

## 1. Phạm vi

| Trường | Nội dung |
| --- | --- |
| Version / thời điểm chốt | 2026-11-18 (GMT+7) |
| Phạm vi | Authentication, SC-01 đến SC-09 và SC-17 của Test Plan. Test level: Component, Component integration, System (tự động); System integration và review (thủ công); 4 exploratory charter |
| Test design được hiện thực hóa | Test Cases [[1]](#ref-1), 166 test case: 159 test case `v1` tại commit `497541d`; ngày 2026-11-18 có TC-005, TC-060, TC-103, TC-133, TC-204, TC-206 `v2` và TC-209 `v1` mới (mục 3, mục 4.2) |
| Snapshot testware | Branch `test/auth`, commit chứa thư mục `04-implementation/` |
| Build hoặc interface dùng để xác minh | Code tại `b4ca981` (`git log b4ca981..HEAD -- apps packages` không có commit); `better-auth@1.7.25`. Ngày 2026-11-18, `SIGN_IN_RATE_LIMIT` (`apps/api/src/configs/auth.ts`) và `DEFAULT_DESTINATION` (`apps/web/app/utils/auth-redirect.ts`) bỏ từ khóa `export`, vì không module production nào import chúng (`pnpm check:exports`). `pnpm build` trước và sau thay đổi cho `apps/api/dist/index.js` và `apps/web/build` giống từng byte; chỉ `index.js.map` khác, vì file này chứa source |
| Dependency đã review | `better-auth@1.7.25`, `@better-auth/core@1.7.25`, `@better-auth/utils@0.5.1`, đọc ngày 2026-11-18. Nội dung đã review, cần làm lại khi một version đổi: status của request được chấp nhận (Test Cases mục 2.1, CH-07); nguồn ngẫu nhiên của token phiên (TC-209); requirement viết theo hành vi của Better Auth (SR-06 của Entry/Exit Criteria). `pnpm check:docs` fail khi `pnpm-lock.yaml` không còn một version ở đây |
| Người thực hiện / người review | Người thực hiện: agent. Người review: product owner. Ngày 2026-11-18, product owner duyệt báo cáo Phase 04, xác nhận CH-02, CH-03, CH-05, CH-06, và giao agent tự chốt các quyết định không đổi cách vận hành dự án. Các quyết định agent chốt theo ủy quyền này ghi "theo ủy quyền của product owner" |
| File chi tiết | [Procedures & Suites](02-procedures-and-suites.md), [Test Data](03-test-data.md), [Test Environment](04-test-environment.md) |

## 2. Mức sẵn sàng theo test case

Test case có phần CI và phần S được tính là một dòng. "Sẵn sàng" với test case tự động nghĩa là script đã chạy hết trên `b4ca981`, đã được review với test case, và đã thấy fail ít nhất một lần khi hành vi sai: trên `b4ca981` vì sản phẩm lệch test basis, hoặc trên mutant build (Procedures & Suites mục 6). Ngoại lệ theo TD-08: 11 test case ưu tiên Trung bình và dòng 1 của TC-232 được chấp nhận bằng review assertion, không có mutant riêng; cột Phần thiếu ghi rõ.

| Test case ID / version | Coverage items | Procedure / script | Suite | Data IDs | Env IDs | Trạng thái | Phần thiếu |
| --- | --- | --- | --- | --- | --- | --- | --- |
| TC-001; v1 | MD-01-CI-01, MD-01-CI-03, MD-01-CI-06, MD-01-CI-09, MD-01-CI-12 | PROC-01 | SU-03 | DA-01, DA-07 | ENV-01, ENV-06 | Sẵn sàng | Không có |
| TC-002; v1 | MD-01-CI-13 | PROC-01 | SU-03 | DA-01, DA-07 | ENV-01, ENV-06 | Sẵn sàng | CH-07 |
| TC-003; v1 | MD-01-CI-02 | PROC-01 | SU-03 | DA-07 | ENV-01, ENV-10 | Sẵn sàng | Fail trên mutant M7 (VF-12). CH-07, CH-08 |
| TC-004; v1 | MD-01-CI-04, MD-01-CI-07, MD-01-CI-10 | PROC-01 | SU-03 | DA-07 | ENV-01, ENV-06 | Sẵn sàng | CH-07 |
| TC-005; v2 | MD-01-CI-05, MD-01-CI-08, MD-01-CI-11, MD-01-CI-14 | PROC-01 | SU-03 | DA-07 | ENV-01, ENV-06, ENV-10 | Sẵn sàng | CH-07, CH-08 |
| TC-006; v1 | MD-05-CI-01 đến MD-05-CI-04 | PROC-01 | SU-03 | DA-07 | ENV-01, ENV-06 | Sẵn sàng | CH-07 |
| TC-007; v1 | MD-05-CI-05 đến MD-05-CI-08 | PROC-01 | SU-03 | DA-07 | ENV-01, ENV-06 | Sẵn sàng | CH-07 |
| TC-008; v1 | MD-05-CI-09 đến MD-05-CI-12 | PROC-01 | SU-03 | DA-07 | ENV-01, ENV-06 | Sẵn sàng | CH-07 |
| TC-009; v1 | MD-05-CI-13 đến MD-05-CI-16 | PROC-05 | SU-03 | DA-07 | ENV-01, ENV-04, ENV-06 | Sẵn sàng | CH-07 |
| TC-010; v1 | MD-05-CI-41 đến MD-05-CI-44 | PROC-05 | SU-03 | DA-07 | ENV-01, ENV-04, ENV-06 | Sẵn sàng | CH-07 |
| TC-011; v1 | MD-05-CI-17 đến MD-05-CI-20 | PROC-01 | SU-03 | DA-02, DA-07 | ENV-01, ENV-03, ENV-06 | Sẵn sàng | CH-07 |
| TC-012; v1 | MD-05-CI-21 đến MD-05-CI-24 | PROC-01 | SU-03 | DA-02, DA-07 | ENV-01, ENV-03, ENV-06 | Sẵn sàng | CH-07 |
| TC-013; v1 | MD-05-CI-25 đến MD-05-CI-28 | PROC-01 | SU-03 | DA-01, DA-07 | ENV-01, ENV-03, ENV-06 | Sẵn sàng | CH-07 |
| TC-014; v1 | MD-05-CI-29 đến MD-05-CI-32 | PROC-01 | SU-03 | DA-01, DA-07 | ENV-01, ENV-03, ENV-06 | Sẵn sàng | CH-07 |
| TC-015; v1 | MD-05-CI-33 đến MD-05-CI-36 | PROC-01 | SU-03 | DA-07, DA-11 | ENV-01, ENV-06 | Sẵn sàng | CH-07 |
| TC-016; v1 | MD-05-CI-37 đến MD-05-CI-40 | PROC-01 | SU-03 | DA-07, DA-11 | ENV-01, ENV-06 | Sẵn sàng | CH-07 |
| TC-017; v1 | MD-05-CI-45 đến MD-05-CI-48 | PROC-05 | SU-03 | DA-07 | ENV-01, ENV-04, ENV-06 | Sẵn sàng | CH-07 |
| TC-018; v1 | MD-05-CI-49 đến MD-05-CI-52 | PROC-05 | SU-03 | DA-07 | ENV-01, ENV-04, ENV-06 | Sẵn sàng | CH-07 |
| TC-019; v1 | MD-05-CI-53 | PROC-05 | SU-03 | DA-07 | ENV-01, ENV-04, ENV-06 | Sẵn sàng | Fail trên mutant M5 (VF-10). CH-07 |
| TC-020; v1 | MD-05-CI-54 | PROC-01 | SU-03 | DA-07 | ENV-01, ENV-06 | Sẵn sàng | Không có |
| TC-021; v1 | MD-05-CI-20, MD-05-CI-28, MD-05-CI-36 (phần UI) | PROC-11 | SU-12 | DA-01, DA-02, DA-07 | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-030; v1 | MD-02-CI-01 | PROC-12 | SU-12 | DA-01 | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-031; v1 | MD-02-CI-02 | PROC-12 | SU-12 | DA-01 | ENV-02, ENV-07 | Sẵn sàng | Fail trên mutant M15 (VF-12) |
| TC-032; v1 | MD-02-CI-03 | PROC-02 | SU-03 | — | ENV-01 | Sẵn sàng | Fail trên mutant M8 (VF-12) |
| TC-033; v1 | MD-02-CI-04, MD-02-CI-05, MD-02-CI-15, MD-02-CI-16 | PROC-02 | SU-03 | DA-01 | ENV-01 | Sẵn sàng | Không có |
| TC-034; v1 | MD-02-CI-06, MD-02-CI-07 | PROC-02 | SU-03 | DA-01 | ENV-01, ENV-06 | Sẵn sàng | Không có |
| TC-035; v1 | MD-02-CI-08 | PROC-02 | SU-03 | DA-01 | ENV-01, ENV-06 | Sẵn sàng | Không có |
| TC-036; v1 | MD-02-CI-09 | PROC-02 | SU-03 | DA-01 | ENV-01, ENV-06 | Sẵn sàng | Không có |
| TC-037; v1 | MD-02-CI-10, MD-02-CI-21 | PROC-12 | SU-12 | DA-01 | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-038; v1 | MD-02-CI-11, MD-02-CI-22 | PROC-12 | SU-12 | DA-01 | ENV-02, ENV-07, ENV-12 | Sẵn sàng | Không có |
| TC-039; v1 | MD-02-CI-12, MD-02-CI-23 | PROC-02 | SU-03 | DA-01, DA-08 | ENV-01, ENV-03 | Sẵn sàng | Không có |
| TC-040; v1 | MD-02-CI-13, MD-02-CI-24 | PROC-12 | SU-12 | DA-01 | ENV-02, ENV-07 | Sẵn sàng | Dòng 2 fail trên mutant M15, dòng 1 fail trên mutant M15b (VF-12) |
| TC-041; v1 | MD-02-CI-14, MD-02-CI-25 | PROC-02 | SU-03 | DA-01, DA-07 | ENV-01 | Sẵn sàng | Không có |
| TC-042; v1 | MD-02-CI-17, MD-02-CI-18, MD-02-CI-19 | PROC-02 | SU-03 | DA-01 | ENV-01, ENV-06 | Sẵn sàng | Dòng 1 fail trên mutant M9, dòng 2 fail trên M9b (VF-12) |
| TC-043; v1 | MD-02-CI-26 | PROC-05 | SU-03 | DA-04 | ENV-01, ENV-04 | Sẵn sàng | Không có |
| TC-044; v1 | MD-02-CI-27 | PROC-02 | SU-03 | DA-02, DA-08 | ENV-01, ENV-03 | Sẵn sàng | Không có |
| TC-045; v1 | MD-07-CI-16, MD-07-CI-01, MD-07-CI-02, MD-07-CI-03 | PROC-02 | SU-03 | DA-02, DA-08 | ENV-01, ENV-03, ENV-06 | Sẵn sàng | Không có |
| TC-046; v1 | MD-07-CI-17, MD-07-CI-04, MD-07-CI-05, MD-07-CI-06 | PROC-02 | SU-03 | DA-01, DA-08 | ENV-01, ENV-03, ENV-06 | Sẵn sàng | Không có |
| TC-047; v1 | MD-07-CI-18, MD-07-CI-07, MD-07-CI-08, MD-07-CI-09 | PROC-02 | SU-03 | DA-01 | ENV-01, ENV-06 | Sẵn sàng | Không có |
| TC-048; v1 | MD-07-CI-19, MD-07-CI-10, MD-07-CI-11, MD-07-CI-12 | PROC-02 | SU-03 | DA-01 | ENV-01, ENV-06 | Sẵn sàng | Không có |
| TC-049; v1 | MD-07-CI-20, MD-07-CI-13, MD-07-CI-14, MD-07-CI-15 | PROC-02 | SU-03 | DA-01 | ENV-01, ENV-06 | Sẵn sàng | Không có |
| TC-050; v1 | MD-07-CI-21 đến MD-07-CI-24 | PROC-02 | SU-03 | DA-01 | ENV-01, ENV-06 | Sẵn sàng | Không có |
| TC-060; v2 | MD-03-CI-01, MD-03-CI-02, MD-03-CI-03 | PROC-13 | SU-12 | DA-01, DA-08 | ENV-02, ENV-07 | Sẵn sàng | CH-02 |
| TC-061; v1 | MD-03-CI-04 | PROC-13 | SU-12 | DA-01, DA-08 | ENV-02, ENV-07 | Sẵn sàng | Fail trên mutant M17 (VF-12) |
| TC-062; v1 | MD-03-CI-05, MD-03-CI-10 | PROC-13 | SU-12 | DA-01, DA-08 | ENV-02, ENV-06, ENV-07 | Sẵn sàng | Fail trên mutant M16 (VF-12) |
| TC-063; v1 | MD-03-CI-06 | PROC-03 | SU-03 | DA-01, DA-08 | ENV-01, ENV-03 | Sẵn sàng | Fail trên mutant M10 (VF-12) |
| TC-064; v1 | MD-03-CI-07 | PROC-13 | SU-12 | DA-01, DA-08 | ENV-02, ENV-07 | Sẵn sàng | Fail trên mutant M16 (VF-12) |
| TC-065; v1 | MD-03-CI-08 | PROC-13 | SU-12 | DA-01, DA-08 | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-066; v1 | MD-03-CI-09, MD-03-CI-12 | PROC-03 | SU-03 | DA-01, DA-08 | ENV-01, ENV-03, ENV-06 | Sẵn sàng | Không có |
| TC-067; v1 | MD-03-CI-11 | PROC-13 | SU-12 | DA-01, DA-08 | ENV-02, ENV-06, ENV-07 | Sẵn sàng | Không có |
| TC-068; v1 | MD-03-CI-13 | PROC-03 | SU-03 | DA-01, DA-08 | ENV-01, ENV-03 | Sẵn sàng | Không có |
| TC-069; v1 | MD-03-CI-14, MD-03-CI-15 | PROC-03 | SU-03 | DA-01, DA-08 | ENV-01, ENV-03, ENV-06 | Sẵn sàng | Không có |
| TC-070; v1 | MD-04-CI-01 | PROC-13 | SU-12 | DA-02, DA-08 | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-071; v1 | MD-04-CI-02 | PROC-13 | SU-12 | DA-01, DA-02, DA-08 | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-072; v1 | MD-04-CI-03, MD-04-CI-09 | PROC-13 | SU-12 | DA-02, DA-08 | ENV-02, ENV-06, ENV-07 | Sẵn sàng | Không có |
| TC-073; v1 | MD-04-CI-04 | PROC-13 | SU-12 | DA-02, DA-08 | ENV-02, ENV-07 | Sẵn sàng | Fail trên mutant M18 (VF-12) |
| TC-074; v1 | MD-04-CI-05 | PROC-13 | SU-12 | DA-02, DA-08 | ENV-02, ENV-07 | Sẵn sàng | Fail trên mutant M18 (VF-12) |
| TC-075; v1 | MD-04-CI-06 | PROC-13 | SU-12 | DA-02, DA-08 | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-076; v1 | MD-04-CI-07 | PROC-13 | SU-12 | DA-01, DA-02, DA-08 | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-077; v1 | MD-04-CI-08 | PROC-03 | SU-03 | DA-02, DA-08 | ENV-01, ENV-03, ENV-06 | Sẵn sàng | Không có |
| TC-078; v1 | MD-04-CI-10, MD-04-CI-11 | PROC-13 | SU-12 | DA-01, DA-02, DA-08 | ENV-02, ENV-06, ENV-07 | Sẵn sàng | Không có |
| TC-090; v1 | MD-06-CI-01 đến MD-06-CI-04 | PROC-04, PROC-08 | SU-02, SU-03 | DA-05 | ENV-01, ENV-05, ENV-13 | Sẵn sàng | Không có |
| TC-091; v1 | MD-06-CI-05 đến MD-06-CI-08 | PROC-04, PROC-08 | SU-02, SU-03 | DA-05 | ENV-01, ENV-05, ENV-13 | Sẵn sàng | Không có |
| TC-092; v1 | MD-06-CI-09 đến MD-06-CI-12 | PROC-04, PROC-08 | SU-02, SU-03 | DA-01, DA-05, DA-08 | ENV-01, ENV-05, ENV-13 | Sẵn sàng | Không có |
| TC-093; v1 | MD-06-CI-13 đến MD-06-CI-16 | PROC-04, PROC-08 | SU-02, SU-03 | DA-01, DA-05, DA-08 | ENV-01, ENV-05, ENV-13 | Sẵn sàng | Không có |
| TC-094; v1 | MD-06-CI-17 đến MD-06-CI-19 | PROC-08, PROC-14 | SU-02, SU-12 | DA-10 | ENV-02, ENV-07, ENV-13 | Sẵn sàng | Không có |
| TC-095; v1 | MD-06-CI-20 đến MD-06-CI-23 | PROC-08, PROC-14 | SU-02, SU-12 | DA-10 | ENV-02, ENV-07, ENV-13 | Sẵn sàng | Không có |
| TC-096; v1 | MD-06-CI-24 đến MD-06-CI-27 | PROC-04, PROC-08 | SU-02, SU-03 | DA-05 | ENV-01, ENV-05, ENV-13 | Sẵn sàng | Không có |
| TC-097; v1 | MD-06-CI-28 đến MD-06-CI-31 | PROC-04, PROC-08 | SU-02, SU-03 | DA-01, DA-05, DA-08 | ENV-01, ENV-05, ENV-13 | Sẵn sàng | Không có |
| TC-098; v1 | MD-06-CI-32, MD-06-CI-33 | PROC-08, PROC-14 | SU-02, SU-12 | DA-10 | ENV-02, ENV-07, ENV-13 | Sẵn sàng | Không có |
| TC-100; v1 | MD-08-CI-01 | PROC-05 | SU-03 | DA-03, DA-04 | ENV-01, ENV-04 | Sẵn sàng | Không có |
| TC-101; v1 | MD-08-CI-02 | PROC-05 | SU-03 | DA-04 | ENV-01, ENV-03, ENV-04 | Sẵn sàng | Không có |
| TC-102; v1 | MD-08-CI-03 | PROC-05 | SU-03 | DA-01, DA-04 | ENV-01, ENV-04 | Sẵn sàng | Không có |
| TC-103; v2 | MD-08-CI-04 | PROC-05, PROC-17 | SU-03, SU-21 | DA-02, DA-04, DA-12 | ENV-01, ENV-04, ENV-09 | Đã tạo, chưa xác minh | Phần CI sẵn sàng. Phần S chạy thủ công ở PROC-17 với Google thật (CH-11); DA-12 và ENV-09 chưa kiểm tra (EN-07); TD-09 |
| TC-104; v1 | MD-08-CI-05 | PROC-05 | SU-03 | DA-03, DA-04 | ENV-01, ENV-04 | Sẵn sàng | Không có |
| TC-110; v1 | MD-09-CI-01, MD-09-CI-06 | PROC-04 | SU-03 | DA-01, DA-06, DA-08 | ENV-01, ENV-05 | Sẵn sàng | Không có |
| TC-111; v1 | MD-09-CI-02, MD-09-CI-07 | PROC-04 | SU-03 | DA-01, DA-06, DA-08 | ENV-01, ENV-05 | Sẵn sàng | Không có |
| TC-112; v1 | MD-09-CI-03, MD-09-CI-08 | PROC-04 | SU-03 | DA-01, DA-06, DA-08 | ENV-01, ENV-05 | Sẵn sàng | Dòng 1 fail trên mutant M11, dòng 2 fail trên M11b (VF-12) |
| TC-113; v1 | MD-09-CI-04, MD-09-CI-09 | PROC-04 | SU-03 | DA-01, DA-06, DA-08 | ENV-01, ENV-05 | Sẵn sàng | Không có |
| TC-114; v1 | MD-09-CI-05, MD-09-CI-10 | PROC-04 | SU-03 | DA-01, DA-06, DA-08 | ENV-01, ENV-05 | Sẵn sàng | Không có |
| TC-120; v1 | MD-10-CI-01, MD-10-CI-04, MD-10-CI-07 | PROC-12 | SU-12 | DA-01 | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-121; v1 | MD-10-CI-02, MD-10-CI-08, MD-10-CI-10 | PROC-12 | SU-12 | DA-01 | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-122; v1 | MD-10-CI-09 | PROC-12 | SU-12 | — | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-123; v1 | MD-10-CI-03, MD-10-CI-13, MD-10-CI-11 | PROC-12 | SU-12 | DA-01 | ENV-02, ENV-07, ENV-12 | Sẵn sàng | Không có |
| TC-124; v1 | MD-10-CI-12 | PROC-12 | SU-12 | — | ENV-02, ENV-07, ENV-12 | Sẵn sàng | Không có |
| TC-125; v1 | MD-10-CI-05 | PROC-12 | SU-12 | DA-01 | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-126; v1 | MD-10-CI-06 | PROC-12 | SU-12 | DA-01 | ENV-02, ENV-07 | Sẵn sàng | CH-05 |
| TC-130; v1 | MD-11-CI-01 đến MD-11-CI-04, MD-11-CI-43 | PROC-14 | SU-12 | DA-11 | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-131; v1 | MD-11-CI-05 đến MD-11-CI-08, MD-11-CI-44 | PROC-14 | SU-12 | DA-11 | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-132; v1 | MD-11-CI-09 đến MD-11-CI-12, MD-11-CI-45 | PROC-14 | SU-12 | DA-11 | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-133; v2 | MD-11-CI-13 đến MD-11-CI-16 | PROC-06, PROC-14 | SU-03, SU-12 | DA-01, DA-11 | ENV-01, ENV-02, ENV-07 | Sẵn sàng | Phần S fail trên mutant W25b, phần CI fail trên mutant M25 (VF-12). Dòng khoảng trắng, dòng từng fail trên `b4ca981`, đã chuyển sang S. CH-09 |
| TC-134; v1 | MD-11-CI-17, MD-11-CI-18 | PROC-14 | SU-12 | — | ENV-02, ENV-07 | Sẵn sàng | Chấp nhận bằng review assertion, không có mutant riêng (TD-08) |
| TC-135; v1 | MD-11-CI-19 đến MD-11-CI-22 | PROC-14 | SU-12 | DA-01, DA-08 | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-136; v1 | MD-11-CI-23, MD-11-CI-24 | PROC-14 | SU-12 | DA-11 | ENV-02, ENV-07 | Sẵn sàng | Chấp nhận bằng review assertion, không có mutant riêng (TD-08) |
| TC-137; v1 | MD-11-CI-25 | PROC-14 | SU-12 | DA-01 | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-138; v1 | MD-11-CI-26 | PROC-11 | SU-12 | DA-07 | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-139; v1 | MD-11-CI-27, MD-11-CI-28 | PROC-14 | SU-12 | — | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-140; v1 | MD-11-CI-29, MD-11-CI-30 | PROC-14 | SU-12 | — | ENV-02, ENV-07, ENV-11 | Sẵn sàng | Không có |
| TC-141; v1 | MD-11-CI-31, MD-11-CI-32 | PROC-14 | SU-12 | — | ENV-02, ENV-04, ENV-07 | Sẵn sàng | Không có |
| TC-142; v1 | MD-11-CI-33 đến MD-11-CI-39 | PROC-14 | SU-12 | DA-01, DA-08 | ENV-02, ENV-07, ENV-12 | Sẵn sàng | Không có |
| TC-143; v1 | MD-11-CI-40 đến MD-11-CI-42 | PROC-14 | SU-12 | DA-01, DA-08 | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-144; v1 | MD-11-CI-46, MD-11-CI-47 | PROC-14 | SU-12 | DA-10 | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-145; v1 | MD-11-CI-48 | PROC-13 | SU-12 | DA-02, DA-08 | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-146; v1 | MD-11-CI-49 | PROC-13 | SU-12 | DA-01, DA-08 | ENV-02, ENV-07 | Sẵn sàng | Fail trên mutant M16 (VF-12) |
| TC-150; v1 | MD-12-CI-01 đến MD-12-CI-06 | PROC-06, PROC-14 | SU-03, SU-12 | DA-01, DA-02, DA-03 | ENV-01, ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-160; v1 | MD-18-CI-01 đến MD-18-CI-07 | PROC-09, PROC-14 | SU-02, SU-12 | DA-01, DA-09 | ENV-02, ENV-07, ENV-13 | Sẵn sàng | Không có |
| TC-170; v1 | MD-13-CI-01 | PROC-14 | SU-12 | DA-01 | ENV-02, ENV-07 | Sẵn sàng | Chấp nhận bằng review assertion, không có mutant riêng (TD-08) |
| TC-171; v1 | MD-13-CI-02 | PROC-14 | SU-12 | DA-01 | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-172; v1 | MD-13-CI-03 | PROC-14 | SU-12 | DA-11 | ENV-02, ENV-07 | Sẵn sàng | Chấp nhận bằng review assertion, không có mutant riêng (TD-08) |
| TC-173; v1 | MD-13-CI-04 | PROC-14 | SU-12 | DA-01 | ENV-02, ENV-07 | Sẵn sàng | Chấp nhận bằng review assertion, không có mutant riêng (TD-08) |
| TC-174; v1 | MD-13-CI-05 | PROC-14 | SU-12 | DA-02 | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-175; v1 | MD-13-CI-06 | PROC-11 | SU-12 | DA-01, DA-07 | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-176; v1 | MD-13-CI-07 | PROC-14 | SU-12 | DA-11, DA-08 | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-177; v1 | MD-13-CI-08 | PROC-14 | SU-12 | DA-11, DA-08 | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-178; v1 | MD-13-CI-09 | PROC-14 | SU-12 | DA-11, DA-08 | ENV-02, ENV-07 | Sẵn sàng | Chấp nhận bằng review assertion, không có mutant riêng (TD-08) |
| TC-179; v1 | MD-13-CI-10 | PROC-14 | SU-12 | DA-11, DA-08 | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-180; v1 | MD-13-CI-11 | PROC-14 | SU-12 | DA-11, DA-08 | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-181; v1 | MD-13-CI-12 | PROC-14 | SU-12 | DA-11 | ENV-02, ENV-07 | Sẵn sàng | Chấp nhận bằng review assertion, không có mutant riêng (TD-08) |
| TC-182; v1 | MD-13-CI-13 | PROC-14 | SU-12 | DA-01 | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-183; v1 | MD-13-CI-14 | PROC-14 | SU-12 | DA-02 | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-184; v1 | MD-13-CI-15 | PROC-14 | SU-12 | DA-11 | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-185; v1 | MD-13-CI-16 | PROC-06 | SU-03 | DA-11 | ENV-01, ENV-03 | Sẵn sàng | CH-03 |
| TC-186; v1 | MD-13-CI-17 | PROC-13 | SU-12 | DA-01, DA-08 | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-187; v1 | MD-13-CI-18 | PROC-13 | SU-12 | DA-01, DA-08 | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-188; v1 | MD-13-CI-19 | PROC-13 | SU-12 | DA-01, DA-08 | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-189; v1 | MD-13-CI-20 | PROC-13 | SU-12 | DA-11 | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-190; v1 | MD-13-CI-21 | PROC-13 | SU-12 | DA-01, DA-08 | ENV-02, ENV-07 | Sẵn sàng | Chấp nhận bằng review assertion, không có mutant riêng (TD-08) |
| TC-191; v1 | MD-13-CI-22 | PROC-13 | SU-12 | DA-01, DA-08 | ENV-02, ENV-06, ENV-07 | Sẵn sàng | Chấp nhận bằng review assertion, không có mutant riêng (TD-08) |
| TC-192; v1 | MD-13-CI-23 | PROC-06 | SU-03 | DA-01 | ENV-01, ENV-03 | Sẵn sàng | Fail trên mutant M21 (VF-12). CH-03 |
| TC-193; v1 | MD-13-CI-24 | PROC-12 | SU-12 | DA-01 | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-194; v1 | MD-13-CI-25 | PROC-12 | SU-12 | DA-01 | ENV-02, ENV-07, ENV-12 | Sẵn sàng | Không có |
| TC-195; v1 | MD-13-CI-26 | PROC-17 | SU-21 | DA-12 | ENV-09 | Đã tạo, chưa xác minh | DA-12 và ENV-09 chưa kiểm tra (EN-07); TD-09 |
| TC-196; v1 | MD-13-CI-27 | PROC-17 | SU-21 | DA-12 | ENV-09 | Đã tạo, chưa xác minh | DA-12 và ENV-09 chưa kiểm tra (EN-07); TD-09 |
| TC-197; v1 | MD-13-CI-28 | PROC-17 | SU-21 | DA-12 | ENV-09 | Đã tạo, chưa xác minh | DA-12 và ENV-09 chưa kiểm tra (EN-07); TD-09 |
| TC-198; v1 | MD-13-CI-29 | PROC-17 | SU-21 | DA-12 | ENV-09 | Đã tạo, chưa xác minh | DA-12 và ENV-09 chưa kiểm tra (EN-07); TD-09 |
| TC-199; v1 | MD-13-CI-30 | PROC-05 | SU-03 | DA-02, DA-04, DA-08 | ENV-01, ENV-03, ENV-04 | Sẵn sàng | Không có |
| TC-200; v1 | MD-14-CI-01, MD-14-CI-02, MD-14-CI-10, MD-14-CI-16, MD-14-CI-18, MD-14-CI-19, MD-14-CI-20 | PROC-18 | SU-22 | — | — | Sẵn sàng | Không có |
| TC-201; v1 | MD-14-CI-05 | PROC-04 | SU-03 | DA-05 | ENV-01, ENV-05 | Sẵn sàng | Không có |
| TC-202; v1 | MD-14-CI-07 | PROC-15 | SU-12 | — | ENV-02, ENV-07 | Sẵn sàng | Fail trên mutant W21 và W22 (VF-12) |
| TC-203; v1 | MD-14-CI-08 | PROC-04 | SU-03 | DA-05 | ENV-01 | Sẵn sàng | Fail trên mutant M12 (VF-12) |
| TC-204; v2 | MD-14-CI-13 | PROC-06 | SU-03 | — | ENV-01 | Sẵn sàng | Phần đếm bản ghi fail trên mutant M24 (VF-12). Phần Sign in không phát hiện được tài khoản mặc định: ba email sai định dạng nên bị từ chối trước khi API tìm tài khoản (CH-10). CH-06, CH-10 |
| TC-205; v1 | MD-14-CI-22 | PROC-06 | SU-03 | DA-01 | ENV-01 | Sẵn sàng | Chấp nhận bằng review assertion, không có mutant riêng (TD-08) |
| TC-206; v2 | MD-14-CI-23 | PROC-07 | SU-03 | — | ENV-01 | Sẵn sàng | Fail trên mutant M23 (VF-12). Test chỉ kiểm định dạng token; nguồn ngẫu nhiên được kiểm bằng review ở TC-209 |
| TC-207; v1 | MD-14-CI-34 | PROC-15 | SU-12 | — | ENV-02, ENV-07 | Sẵn sàng | Fail trên mutant M19 (VF-12) |
| TC-208; v1 | MD-14-CI-39 | PROC-06 | SU-03 | DA-01 | ENV-01, ENV-03 | Sẵn sàng | Fail trên mutant M13 (VF-12) |
| TC-209; v1 | MD-14-CI-23 | PROC-18 | SU-22 | — | — | Sẵn sàng | Bản review tham chiếu ngày 2026-11-18 ở mục 4.2 (TD-14) |
| TC-220; v1 | MD-15-CI-01, MD-15-CI-02, MD-15-CI-03 | PROC-06, PROC-15 | SU-03, SU-12 | DA-01 | ENV-01, ENV-02, ENV-07, ENV-11 | Sẵn sàng | Không có |
| TC-221; v1 | MD-15-CI-04, MD-15-CI-06 | PROC-06, PROC-15 | SU-03, SU-12 | DA-01 | ENV-01, ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-222; v1 | MD-15-CI-05 | PROC-06 | SU-03 | — | ENV-01, ENV-03, ENV-04 | Sẵn sàng | Không có |
| TC-223; v1 | MD-15-CI-07 | PROC-06 | SU-03 | DA-01 | ENV-01 | Sẵn sàng | CH-03 |
| TC-224; v1 | MD-15-CI-08 | PROC-06 | SU-03 | DA-01 | ENV-01 | Sẵn sàng | Fail trên mutant M22 (VF-12) |
| TC-225; v1 | MD-15-CI-09 | PROC-15 | SU-12 | — | ENV-02, ENV-07 | Sẵn sàng | Chấp nhận bằng review assertion, không có mutant riêng (TD-08) |
| TC-226; v1 | MD-15-CI-10, MD-15-CI-11 | PROC-06 | SU-03 | — | ENV-11 | Sẵn sàng | Không có |
| TC-227; v1 | MD-15-CI-12 đến MD-15-CI-20 | PROC-15 | SU-12 | — | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-228; v1 | MD-15-CI-21 | PROC-15 | SU-12 | — | ENV-02, ENV-07 | Sẵn sàng | Fail trên mutant M20 (VF-12) |
| TC-229; v1 | MD-15-CI-22, MD-15-CI-23, MD-15-CI-24 | PROC-06 | SU-03 | DA-01, DA-02 | ENV-01, ENV-03 | Sẵn sàng | CH-03 |
| TC-230; v1 | MD-15-CI-25 | PROC-15 | SU-12 | DA-01, DA-08 | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-231; v1 | MD-15-CI-26, MD-15-CI-27 | PROC-06 | SU-03 | DA-01 | ENV-01, ENV-03 | Sẵn sàng | Không có |
| TC-232; v1 | MD-15-CI-28 | PROC-05 | SU-03 | DA-04 | ENV-01, ENV-04 | Sẵn sàng | Dòng 2 fail trên mutant M14 (VF-12). Dòng 1: không có mutant một lỗi nào không tương đương, vì Better Auth từ chối callback thiếu `state` ở hai chỗ độc lập (thiếu `state`, rồi không tìm thấy state đã lưu); chấp nhận bằng review (TD-08) |
| TC-240; v1 | MD-17-CI-01 đến MD-17-CI-05 | PROC-16 | SU-12 | — | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-241; v1 | MD-17-CI-06 đến MD-17-CI-10 | PROC-16 | SU-12 | — | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-242; v1 | MD-17-CI-11 đến MD-17-CI-14 | PROC-16 | SU-12 | — | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-243; v1 | MD-17-CI-15 đến MD-17-CI-19 | PROC-16 | SU-12 | DA-01, DA-08 | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-244; v1 | MD-17-CI-20 đến MD-17-CI-25 | PROC-16 | SU-12 | DA-01, DA-08 | ENV-02, ENV-07, ENV-08 | Sẵn sàng | Không có |
| TC-245; v1 | MD-17-CI-26 đến MD-17-CI-29 | PROC-16 | SU-12 | DA-01, DA-08 | ENV-02, ENV-07, ENV-08 | Sẵn sàng | Không có |
| TC-246; v1 | MD-17-CI-30 đến MD-17-CI-33 | PROC-16 | SU-12 | — | ENV-02, ENV-07 | Sẵn sàng | Không có |

| Trạng thái | Định nghĩa |
| --- | --- |
| Sẵn sàng | Procedure hoặc script đã được xác minh, data và môi trường liên quan đã được kiểm tra sẵn sàng |
| Đã tạo, chưa xác minh | Có procedure hoặc script, nhưng chưa xác minh hoặc data, môi trường chưa sẵn sàng |
| Một phần | Chỉ hiện thực hóa được một phần các bước hoặc dữ liệu của test case |
| Chưa triển khai | Chưa có testware |
| Bị chặn | Không thể làm tiếp vì một trở ngại đã xác định |
| Hoãn | Có quyết định hoãn, kèm người quyết định |

| Trạng thái | Số test case |
| --- | --- |
| Sẵn sàng | 161 (12 trong số này được chấp nhận bằng review, TD-08) |
| Đã tạo, chưa xác minh | 5, đều thủ công: TC-195 đến TC-198, phần S của TC-103; chờ DA-12 và ENV-09 (TD-09) |
| Một phần | 0 |
| Chưa triển khai | 0 |
| Bị chặn | 0 |
| Hoãn | 0 |
| **Tổng** | **166** |

4 exploratory charter CHR-01 đến CHR-04 có procedure PROC-19 đến PROC-22; charter không có script nên không xác minh bằng dry run.

## 3. Thay đổi so với test design

CH-07 và CH-10 là hai thay đổi expected result; các dòng khác đổi bước, môi trường, test level hoặc cách so. Mỗi dòng dưới đây ghi test design yêu cầu gì, điều gì chặn việc làm đúng như vậy, testware làm gì thay, và vì sao cách mới vẫn kiểm đúng expected result. CH-01 và CH-04 đã bị hủy sau review ngày 2026-11-18: môi trường test được sửa, và hai test case giờ chạy đúng test design. Hai dòng được giữ lại để lịch sử review khớp với ID. CH-02, CH-03, CH-05 đến CH-08 được product owner xác nhận ngày 2026-11-18. CH-09 đến CH-11 do agent chốt cùng ngày theo ủy quyền của product owner (TD-10, TD-11).

| Change ID | Test case ID | Test design ghi | Vấn đề khi làm đúng như vậy | Thay đổi | Vì sao vẫn kiểm đúng expected result | Người xác nhận, ngày | Nguồn đã được cập nhật |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CH-01 (đã hủy) | TC-140 dòng 2 | Precondition: `GOOGLE_CLIENT_ID` và `GOOGLE_CLIENT_SECRET` trống. Mở `/sign-in`: không có nút Continue with Google | Bản đầu chỉ có một server E2E, và server đó lấy biến Google từ `.env` của developer, nên không có server nào chạy với hai biến trống. Bản đầu né bằng hai cách: giả response `/api/auth-config` trong trình duyệt, và gọi hàm nội bộ `isGoogleEnabled` trong test API. Cả hai kiểm code hiện tại, không kiểm app thật khi thiếu biến Google | Không còn thay đổi. Môi trường E2E chạy hai server (ENV-07): `main` có biến Google giả, `withoutGoogle` có hai biến trống, cổng và database riêng. Dòng 2 mở `/sign-in` trên `withoutGoogle`. Test API của `isGoogleEnabled` bị xóa | Test chạy đúng test design. Hai dòng không còn phụ thuộc giá trị Google trong `.env` | Không cần | Không cần |
| CH-02 | TC-060 | Precondition: A đăng nhập ở trình duyệt 1 và trình duyệt 2. Bước: "Ở trình duyệt 1: Forgot password cho A", rồi mở link ở tab 1 và tab 2 | Test basis: người đã đăng nhập mà mở Auth thì được chuyển tới đích, ví dụ Realtime; chỉ link reset là ngoại lệ [[2, Chuyển tiếp sau khi đăng nhập]](#ref-2). Vì vậy trình duyệt 1 mở `/forgot-password` thì sang Realtime và không thấy form. Bước trong test design mâu thuẫn với test basis | Link được yêu cầu qua màn Forgot password ở trình duyệt 3, là trình duyệt chưa đăng nhập. Link được mở ở tab 1 và tab 2 của trình duyệt 1, như test design. Bản đầu gọi thẳng `POST /api/auth/request-password-reset` ở trình duyệt 1, không qua UI | Expected result của TC-060 nói về link và phiên: link mở được ở hai tab, và sau khi lưu password thì phiên ở trình duyệt 1 và 2 bị từ chối. Trình duyệt nào yêu cầu link không làm đổi các điều đó. Người quên password cũng yêu cầu link khi chưa đăng nhập | Product owner, 2026-11-18 | Test Cases TC-060 `v2`, 2026-11-18 |
| CH-03 | TC-185, TC-192, TC-223, TC-229 | TC-223: "Status và body giống nhau" khi Create account với email đã đăng ký và với email mới. TC-185, TC-192, TC-229: "Response như khi gửi thành công" khi mailer lỗi | Mỗi phép so dùng hai email khác nhau, nên body Create account luôn khác ở 4 trường của `user`: `id` (mỗi tài khoản một id), `email` (lặp lại email đã gửi), `createdAt` và `updatedAt` (thời điểm request). So nguyên body thì test luôn fail, kể cả khi sản phẩm đúng. Test basis yêu cầu cùng một response để form không lộ email đã đăng ký [[3, Lộ email đã đăng ký]](#ref-3) | So nguyên status và body. Riêng 4 trường trên được so theo dạng: `id` có cùng độ dài và cùng loại ký tự, `email` là một email, `createdAt` và `updatedAt` là thời điểm của request (lệch không quá 10 phút). Bản đầu bỏ hẳn 4 trường này khỏi phép so | Người ngoài chỉ phân biệt được hai response qua phần khác về dạng, ví dụ `id` dài khác, `createdAt` cũ của tài khoản đã có, hoặc trường thừa hay thiếu. So theo dạng vẫn bắt được các khác biệt đó. Phép so chỉ bỏ qua các giá trị mà hai email khác nhau buộc phải khác | Product owner, 2026-11-18 | Test Cases mục 2.1, cụm "Response giống nhau", 2026-11-18 |
| CH-04 (đã hủy) | TC-021 dòng 1 | Ở Check your email, bấm Resend the link tới khi API trả 429. Chạy lại với email chưa đăng ký: thông báo giống hệt | Bản đầu hiểu "email chưa đăng ký" là email không có tài khoản ngay lúc bấm Resend the link. Với cách hiểu đó, UI không tới được Check your email, nên bản đầu ghi `history.state` của React Router để mở thẳng bước này. Cách đó dựa vào code nội bộ và trái test basis: tải lại Check your email thì quay về Create account [[2, Create account và Verify email]](#ref-2) | Không còn thay đổi. Cách hiểu đúng: email chưa có tài khoản khi người dùng bấm Create account. Test basis đưa cả email mới và email đã có tài khoản tới Check your email [[2, Create account và Verify email]](#ref-2). Test chạy hai lần trên UI: lần 1 với email của tài khoản đã có, lần 2 với email mới. 3 request đầu được gửi thẳng tới API, như test design ghi | Test chạy đúng test design | Không cần | Không cần |
| CH-05 | TC-126 | Sign out ở tab 2, rồi đưa tab 1 lên trước: tab 1 hiện màn chặn "Sign in to open Realtime" | Chromium headless coi mọi tab là đang hiển thị, nên `bringToFront` không gửi sự kiện nào cho tab 1. Trình duyệt thật gửi `visibilitychange` (ẩn) và `blur` khi người dùng rời tab, rồi `visibilitychange` (hiện) và `focus` khi người dùng quay lại. Trang web biết người dùng quay lại tab qua các sự kiện này | Khi mở tab 2, test đặt tab 1 về trạng thái ẩn và gửi `visibilitychange` và `blur`. Khi đưa tab 1 lên trước, test đặt tab 1 về trạng thái hiện và gửi `visibilitychange` và `focus`. Bản đầu chỉ gửi một `visibilitychange` và không đổi trạng thái ẩn hay hiện | Tab 1 nhận đủ chuỗi sự kiện của một lần chuyển tab thật, nên test không phụ thuộc vào việc app nghe sự kiện nào. Phần không kiểm: trình duyệt thật có gửi các sự kiện đó không. Đó là hành vi của trình duyệt, không phải của Crypto Force | Product owner, 2026-11-18 | Không cần: bước của test design đúng; thay đổi chỉ do Chromium headless |
| CH-06 | TC-204 | Precondition: database `_test` vừa tạo từ migration. Đếm bản ghi bảng `user`: 0 | `pnpm test` tạo `_test` từ migration một lần cho cả lượt chạy. Các file test chạy trước TC-204 tạo tài khoản trong `_test`, nên khi TC-204 chạy, `_test` không còn là database vừa tạo từ migration | TC-204 tạo database `<POSTGRES_DB>_test_fresh` từ migration, đếm bảng `user` trong database đó, rồi xóa database. Phần Sign in với `root@localhost`, `admin@localhost`, `sa@localhost` vẫn chạy như test design | Database riêng đúng là database vừa tạo từ migration của sản phẩm. Kết quả không phụ thuộc thứ tự chạy các file test | Product owner, 2026-11-18 | Test Cases TC-204 `v2` (precondition), 2026-11-18 |
| CH-07 | TC-002 đến TC-019 | "Request được chấp nhận" là response không phải 429 (Test Cases mục 2.1) | Response 500, 404 hay 400 cũng không phải 429, nên test vẫn pass khi endpoint hỏng. Mutant M4 (Google provider không được cấu hình) cho thấy TC-010 (d = 10, 11) và TC-019 vẫn pass với cách so cũ. TC-019 còn không kiểm 3 lần Sign in trước đó có tới bộ đếm hay không | Request được chấp nhận phải nhận đúng response của nó khi không bị giới hạn: Sign in với password sai được 401 (như `t`=0 của TC-001); Continue with Google được 200 kèm URL của provider (TC-009); callback Google với `state` lạ được 302 về Auth kèm lỗi (TC-232); Create account, gửi lại link xác minh và Send reset link được 200. TC-019 kiểm thêm: 3 lần Sign in trước đó đều được 401 | Mọi response mà test design coi là được chấp nhận vẫn được chấp nhận, trừ response lỗi khác 429. Response lỗi nghĩa là endpoint không làm việc của nó, nên test fail là đúng. Giá trị 200 của 3 endpoint email không có trong test basis. Nguồn: `better-auth@1.7.25` (khóa trong `pnpm-lock.yaml`) trả `ctx.json(...)` mà không đặt status, tức 200, ở các nhánh thành công trong `dist/api/routes/sign-up.mjs:187, 262, 272`, `email-verification.mjs:118` và `password.mjs:66, 89`. Harness cũng dùng giá trị này để tạo tài khoản (`createUnverifiedAccount`, `newResetToken`). Review ngày 2026-11-18 thấy thêm: status 200 của Continue with Google và 302 của callback cũng lấy từ Better Auth, vì TC-009 chỉ ghi "trả URL của provider" và TC-232 chỉ ghi "chuyển về Auth với lỗi". Vì status lấy từ thư viện không phải requirement, test kiểm thêm tác dụng mà test basis cho: request được chấp nhận gửi email hoặc tạo tài khoản (TC-011, TC-013 đến TC-016), callback chuyển về Auth kèm lỗi (TC-017, TC-018). Mutant M6 cho thấy test chỉ kiểm status vẫn pass khi request không gửi email, còn test mới fail (VF-11) | Product owner, 2026-11-18. Điều kiện: status 200 và 302 là contract của riêng `better-auth@1.7.25`, không phải requirement; test kiểm cả tác dụng của request; kiểm lại các status khi version đổi (mục 1, Dependency đã review) | Test Cases mục 2.1, 2026-11-18 |
| CH-08 | TC-003, TC-005 | Môi trường CI (đồng hồ điều khiển được); bước "Khởi động lại API" | Bản đầu khởi động lại bằng cách tạo instance Better Auth mới trong cùng process test. Better Auth `1.7.25` giữ bộ đếm của `storage: 'memory'` trong một biến của module (`better-auth/dist/api/rate-limiter/index.mjs`), nên instance mới dùng chung bộ đếm với instance cũ. Mutant M3 (bộ đếm trong bộ nhớ) cho thấy TC-005 vẫn pass cả 4 dòng, dù bộ đếm mất khi API khởi động lại thật. Process API riêng không đọc được đồng hồ điều khiển của process test | TC-003 và TC-005 chạy API thật thành process riêng (ENV-10). Khởi động lại là dừng process rồi chạy process mới. Đồng hồ thật: các lần bấm cách nhau 1 giây. Process mới cần khoảng 3 giây để sẵn sàng; khi nó sẵn sàng muộn hơn thời điểm của lần bấm đầu tiên sau khởi động lại, mọi lần bấm sau khởi động lại lùi cùng một khoảng. Test kiểm kết quả của các lần bấm trước khởi động lại (precondition; dòng 4: lần thứ 4 được 429), và báo lỗi môi trường khi lần bấm cuối muộn hơn 9 giây sau lần đầu | Expected result của TC-005 chỉ phụ thuộc số lần bấm được chấp nhận trong cửa sổ 10 giây. Khi mọi lần bấm nằm trong 9 giây đầu, việc lùi thời điểm không đổi expected result của dòng nào. Process mới không giữ gì trong bộ nhớ của process cũ, nên bộ đếm chỉ còn khi API lưu nó ở database, như khi khởi động lại thật. Cổng cố định 3991 đến 3993 không trùng cổng của `pnpm dev` và E2E (3000, 3001, 5173, 5174). Điều kiện đã kiểm trong code: request chỉ được gửi sau khi process in `API listening`; `afterEach` dừng mọi process, kể cả khi assertion fail; các file test chạy lần lượt (`fileParallelism: false`); khi cổng đang bị chiếm, process mới dừng và test fail kèm output của process, không pass sai | Product owner, 2026-11-18 | Test Cases TC-005 `v2` (precondition, bỏ ER-06), 2026-11-18 |
| CH-09 | TC-133 | Môi trường CI. Sign in với email ` an@example.com ` (khoảng trắng ở đầu và cuối): đăng nhập vào cùng tài khoản | Test basis: "Email được bỏ khoảng trắng ở đầu và cuối" [[2, Quy tắc dùng chung]](#ref-2). Test basis đặt quy tắc này ở "Quy tắc dùng chung cho mọi bước" và không nói quy tắc được áp ở form hay ở API. Hiện form áp quy tắc này: ô email có `type="email"`, nên trình duyệt bỏ khoảng trắng ở hai đầu, và schema form trong `packages/shared/src/schemas/auth.schema.ts` cũng bỏ khoảng trắng trước khi gửi. API (`better-auth@1.7.25`) trả 400 cho email có khoảng trắng (dry run VF-02). Trong repo, chỉ `apps/web` gọi `/api/auth` (tìm `api/auth` trong `apps/` ngoài test, ngày 2026-11-18: `apps/web/app/api/auth.ts`, `hooks/useAuth.ts`, `routes/auth-layout.tsx`, `routes/workspace-layout.tsx`), nên người dùng không gặp 400 này. Test ở CI vì vậy fail mà không chỉ ra lỗi nào người dùng gặp. Cách đọc khác của test basis: API cũng phải bỏ khoảng trắng. Agent chọn cách đọc theo form vì không có client nào khác; nếu sau này có client khác, cách đọc kia đúng hơn và dòng này cần chạy lại ở CI | Dòng khoảng trắng chạy ở S: nhập email của tài khoản A (DA-01) có một khoảng trắng ở đầu và ở cuối vào form Sign in. 3 dòng còn lại (chữ hoa, `+tag`, nguyên dạng) giữ ở CI. TC-133 thành `v2`, test level "CI, S" | Expected result giữ nguyên: đăng nhập vào cùng tài khoản. Test chạy qua đúng nơi người dùng nhập email. Mutant W25b (ô email thành `type="text"` và schema không bỏ khoảng trắng) làm phần S fail; W25 chỉ sửa schema và là mutant tương đương, vì trình duyệt vẫn bỏ khoảng trắng. Phần không kiểm: một client khác gửi email có khoảng trắng thẳng tới API thì nhận 400; hiện không có client nào như vậy | Agent, 2026-11-18, theo ủy quyền của product owner | Test Cases TC-133 `v2`, 2026-11-18 |
| CH-10 | TC-204 | Sign in `root@localhost`, `admin@localhost`, `sa@localhost` với `password`: thông báo không khớp | Test basis: email đúng định dạng khi domain có ít nhất một dấu chấm [[2, Quy tắc dùng chung]](#ref-2). Ba email này sai định dạng, nên form báo lỗi định dạng và không gửi request, còn API trả 400 `INVALID_EMAIL` (dry run VF-02). Expected result "thông báo không khớp" mâu thuẫn với test basis | Expected result mới: mọi lần Sign in bị từ chối và không có phiên; API trả 400 với `code` `INVALID_EMAIL`. Phần "bị từ chối, không có phiên" lấy từ test basis. Status 400 và `INVALID_EMAIL` là hành vi hiện tại của `better-auth@1.7.25` (dry run VF-02; code: `better-auth/dist/api/routes/sign-in.mjs:315` kiểm định dạng email trước khi tìm tài khoản), được ghi như contract của riêng version đó, như CH-07; test kiểm thêm tác dụng: response không đặt cookie phiên. Phần "0 bản ghi" không đổi | Mục tiêu của TC-204 là ASVS 6.3.2: không có tài khoản mặc định. Phần kiểm được mục tiêu này là phép đếm: database vừa tạo từ migration có 0 bản ghi, và mutant M24 (migration tạo sẵn một tài khoản) làm phép đếm fail. Phần Sign in không phát hiện được tài khoản mặc định: ba email bị từ chối vì sai định dạng, trước khi API tìm tài khoản, nên một tài khoản `root@localhost` có sẵn cũng không làm test fail. Phần này chỉ cho thấy ba email đó không mở được phiên. Đổi email của test case sang dạng hợp lệ là thay đổi test design, chưa làm vì phép đếm đã kiểm mục tiêu | Agent, 2026-11-18, theo ủy quyền của product owner | Test Cases TC-204 `v2`, 2026-11-18 |
| CH-11 | TC-103 phần S | Môi trường S: bấm Continue with Google, provider giả trả email của tài khoản chưa xác minh U. Expected: không có phiên, không liên kết, Auth báo email đã đăng ký | Provider giả ở S (ENV-04) chỉ đổi được redirect trong trình duyệt. Bước trao đổi `code` do API server gọi tới Google, và test không thay được endpoint đó khi không sửa code sản phẩm. Vì vậy luồng Google có profile chạy không được ở S | Phần S chạy thủ công trong PROC-17 với Google thật: Create account bằng email của tài khoản Google test, không mở link xác minh, rồi bấm Continue with Google. Phần CI vẫn tự động. Không thêm cấu hình endpoint Google vào sản phẩm chỉ để test: dự án chưa chạy production, và lợi ích không đủ so với code chỉ dùng cho test | Expected result giữ nguyên. Google thật là môi trường gần thực tế hơn provider giả. Đổi lại, phần S chỉ chạy được khi có DA-12 và ENV-09 (TD-09) | Agent, 2026-11-18, theo ủy quyền của product owner | Test Cases TC-103 `v2` (precondition và bước của phần S), 2026-11-18; Procedures & Suites PROC-17 |

## 4. Việc còn lại và điều kiện khi chạy

TD-01 đến TD-06 thuộc Design Status. Số tiếp theo bắt đầu từ TD-07.

| ID | Việc | Test case liên quan | Owner | Hạn | Nơi theo dõi |
| --- | --- | --- | --- | --- | --- |
| TD-09 | Chuẩn bị tài khoản Google test và hộp thư Resend (DA-12), kiểm EN-07 (ENV-09), rồi chạy PROC-17 | TC-195 đến TC-198, TC-103 phần S | Product owner | Phase 05 | [Procedures & Suites](02-procedures-and-suites.md) mục 2.3 |
| TD-13 | Ghi defect report ở Phase 05 cho dấu hiệu lỗi sản phẩm của dry run, sau khi chạy chính thức | Xem mục 4.1 | Agent | Phase 05 | `05-execution/` |
| TD-16 | Tìm nguyên nhân của test fail không ổn định khi chạy cả bộ. Ghi nhận trước ngày 2026-11-18 tối: (1) 1 test API chưa rõ tên fail thêm ở 1 lần chạy (VF-10); (2) TC-021 dòng 3 fail 1 lần khi chạy cả bộ E2E; (3) TC-017 fail 1 lần trong 9 lần chạy nhóm giới hạn Google (VF-11). Nội dung lỗi của cả ba lần chưa được lưu. Chạy lại ngày 2026-11-18 tối, không tái hiện được: 5 lần chạy toàn bộ `apps/api` cho cùng một danh sách 39 test fail (đều là dấu hiệu lỗi sản phẩm ở mục 4.1); 15 lần chạy nhóm giới hạn Google pass 11/11. Lượt chạy toàn bộ SU-12 ngày 2026-11-19 (VF-13) cũng không tái hiện: TC-021 dòng 3 pass, và mọi test fail đều thuộc mục 4.1. Kết quả này chưa loại được lỗi: với tỉ lệ 1/9 của TC-017, xác suất 15 lần liên tiếp không fail khoảng 17%. Việc còn lại: khi một test fail mà lần chạy lại pass, lưu output của lần fail vào evidence theo quy ước của Procedures & Suites mục 5, rồi điều tra từ output đó. Cần đóng việc này trước khi job `test` và `e2e` của CI chặn merge, vì một job đôi khi đỏ mà không có lỗi làm người đọc bỏ qua kết quả đỏ | TC-021, TC-017, chưa rõ test API | Agent | Trước khi CI chặn merge | `.github/workflows/ci.yml`; evidence của Phase 05 |
| TD-18 | Kiểm bằng lỗi phần S của ENV-04 (route Google giả) và link xác minh ký lại của ENV-06, sau khi lỗi sản phẩm của TC-141 và TC-072 được sửa. Hiện hai test này fail vì lỗi sản phẩm, nên mutant không cho thấy pass chuyển sang fail | TC-141, TC-072 | Agent | Lần chạy regression đầu tiên sau khi sửa TC-141, TC-072 | Test Environment mục 3 |

Design Status TD-05 (đối chiếu test hiện có với test case) đã xong ở phase này: `apps/api/test/auth.test.ts` và `apps/web/e2e/auth.spec.ts` viết theo spec cũ và được thay bằng các file `ts001-*`.

### 4.1. Dấu hiệu lỗi sản phẩm từ dry run

Dry run chạy trên `b4ca981`. Các test case dưới đây fail vì hành vi của sản phẩm khác expected result; testware đã được kiểm là đúng (Procedures & Suites mục 6). Đây chưa phải kết quả chạy chính thức.

| Dấu hiệu | Test case |
| --- | --- |
| Khóa Sign in theo giới hạn 5 lần trong 15 phút thay vì 3 lần trong 10 giây; UI không hiện thông báo khóa sau lần bấm thứ 4. Build tham chiếu (VF-04) cho thấy PROC-01 pass khi giới hạn đúng test basis | TC-001, TC-002, TC-004 dòng 1 và 3, TC-005, TC-006, TC-007 (d = 8, 9), TC-008, TC-020, TC-138, TC-175 |
| Sign in lại khi đang có phiên không hủy token cũ | TC-033 |
| Không có thời hạn tuyệt đối 30 ngày | TC-036, TC-049 (30 ngày và 30 ngày + 1 giây) |
| Phiên và link reset còn được chấp nhận đúng tại thời điểm hết hạn | TC-046 (3.600 giây), TC-047 (7 ngày), TC-050 (1 ngày) |
| Đặt password bằng một link reset không làm các link reset khác hết hiệu lực | TC-068 |
| Không kiểm danh sách password phổ biến và Pwned Passwords; không ghi cảnh báo khi API lỗi | TC-110, TC-111, TC-113, TC-114 |
| API đếm độ dài password theo đơn vị UTF-16 thay vì code point | TC-096, TC-097 (4 và 65 emoji) |
| Schema form không giới hạn password 128 ký tự và Full name 100 ký tự | TC-090 đến TC-098 phần C (129, 130 ký tự; 101, 102 ký tự; 129 và 101 emoji), TC-095 và TC-098 phần S |
| Mở link xác minh của B khi đang đăng nhập A làm phiên chuyển sang B, không hiện thông báo | TC-071 |
| Lỗi link xác minh không có cách gửi lại link; khi trình duyệt có phiên thì không có thông báo lỗi | TC-072, TC-078, TC-145 |
| Form Forgot password và Choose a new password không có danh sách lỗi | TC-242, TC-243 |
| New password trống báo "Use at least 8 characters." thay vì "Fill in both fields." | TC-135 dòng 1 |
| Google trả lỗi thì email đã nhập bị mất | TC-141 |
| Email "already have" gửi cho tài khoản chưa xác minh không hướng dẫn xác nhận email | TC-183 |
| Tải lại Check your email vẫn ở Check your email | TC-184 |
| Reset password bắt đầu từ màn chặn Backtest mở Realtime sau Sign in | TC-187 |
| Response của API không có `X-Content-Type-Options`, `Referrer-Policy`, CSP `frame-ancestors` | TC-227 |
| Trang có token reset không đặt `Referrer-Policy: no-referrer` | TC-230 |

**Điều kiện cần kiểm tra lại khi chạy test:** version `better-auth` khác `1.7.25` (SR-05; helper `expiredVerificationLink` dựa vào định dạng token của version này); text, label hoặc role trên các trang Auth thay đổi; cổng 5173 bận vì `pnpm dev` đang chạy; Docker Desktop và PostgreSQL chưa bật.

### 4.2. Việc đã đóng

| ID | Việc | Kết quả | Ngày đóng |
| --- | --- | --- | --- |
| TD-07 | Quy ước ghi kết quả và evidence (IN-11) | Agent chốt theo ủy quyền của product owner: dùng quy ước đã đề xuất (Procedures & Suites mục 5). Testware đã xuất đúng các file này, nên không đổi script. IN-11, RC-06 và Q2-04 đạt | 2026-11-18 |
| TD-08 | Xác minh 33 test case tự động chưa từng thấy fail | 19 test case ưu tiên Cao: mỗi test case fail trên một mutant nhắm đúng hành vi của nó (M7 đến M20, W21, W22; VF-12), trừ dòng 1 của TC-232 (không có mutant một lỗi nào không tương đương). 14 test case ưu tiên Trung bình: review assertion với expected result; thêm mutant cho 3 test case có lỗi dễ cài (TC-192: M21, TC-224: M22, TC-206: M23), 11 test case còn lại được chấp nhận bằng review. Sau review độc lập, thêm M9b (dòng 2 của TC-042, fail) M25 (phần CI của TC-133, fail) và M15b (dòng 1 của TC-040, fail); hai mutant sau chạy ngày 2026-11-19 (TD-17). Trong lúc làm, sửa helper so body của TC-185, TC-192, TC-229: body không phải JSON được so bằng text, và request với mailer hoạt động phải được 200 (status của `better-auth@1.7.25`, bảng ở Test Cases mục 2.1). Thiếu điều kiện 200 thì hai response 500 rỗng giống nhau làm test pass; mutant M26 (Send reset link luôn lỗi) làm điều kiện này fail | 2026-11-18 |
| TD-10 | Expected result ở CI của TC-133 và TC-204 | TC-133: dòng khoảng trắng chuyển sang S (CH-09). TC-204: expected result theo quy tắc định dạng email của test basis (CH-10). Hai test giờ pass trên `b4ca981`, nên dòng "API trả 400" bị bỏ khỏi mục 4.1 | 2026-11-18 |
| TD-11 | Phần S của TC-103 bị chặn | Chạy thủ công với Google thật trong PROC-17 (CH-11); không sửa code sản phẩm để thay endpoint Google. Test E2E bị skip được xóa | 2026-11-18 |
| TD-12 | Xác nhận CH-02, CH-03, CH-05, CH-06 | Product owner xác nhận. Nguồn đã cập nhật ở Test Cases: TC-060 `v2`, cụm "Response giống nhau" ở mục 2.1, TC-204 `v2`; CH-05 không cần sửa test design | 2026-11-18 |
| TD-14 | Nguồn ngẫu nhiên của token phiên (ASVS 7.2.3) | Thêm TC-209 (Review) vào Test Cases, phủ phần của MD-14-CI-23 mà TC-206 không kiểm được; TC-206 thành `v2` với tên chỉ nói điều assertion kiểm (định dạng token). Bản review tham chiếu cho TC-209: (b) Review code, thủ công, ngày 2026-11-18, trên các version ở mục 1 (Dependency đã review). Mọi route mà dự án dùng (Sign in, Create account, xác minh email, liên kết Google, đổi thông tin user) gọi `createSession` mà không có `overrideAll`, nên token là `generateId(32)` (`better-auth/dist/db/internal-adapter.mjs:304`). `generateId` (`@better-auth/core/dist/utils/id.mjs`) gọi `createRandomStringGenerator` với bảng 62 ký tự (`@better-auth/utils/dist/random.mjs`). Hàm này lấy byte từ `crypto.getRandomValues` (dòng 31), là CSPRNG của Node.js và không nhận seed. Hàm bỏ các byte từ 248 trở lên trước phép chia lấy dư (dòng 23), nên 62 ký tự có xác suất bằng nhau. Một token có khoảng 190 bit (32 × log2 62). `apps/api/src/configs/auth.ts` không thay `generateId` và không có `databaseHooks`. Mức bảo đảm của (b) là review, không phải test tự động; `pnpm check:docs` fail khi lockfile không còn version đã review. | 2026-11-18 |
| TD-15 | Kiểm ENV-03, ENV-04, ENV-05, ENV-06, ENV-12 bằng lỗi | Mỗi mock có dòng "Kiểm bằng lỗi:" ở Test Environment mục 3, với mutant hoặc lỗi sản phẩm đã biết làm test dùng mock đó fail. Còn hai phần chưa kiểm được và chuyển sang TD-18: phần S của ENV-04 và link xác minh ký lại của ENV-06. 5 mục được bỏ khỏi danh sách đã biết của `scripts/check-stlc-docs.mjs`; check đó chỉ thấy chuỗi "Kiểm bằng lỗi:", nên không thấy phần còn thiếu trong một dòng | 2026-11-18 |
| TD-17 | Chạy mutant M25 với phần CI của TC-133 và M15b với dòng 1 của TC-040, rồi chạy lại toàn bộ SU-12 | Trên code hiện tại, phần CI của TC-133 pass. Trên M25, test fail: `An@Example.com` nhận 401 thay vì 200. Trên M15b, dòng 1 của TC-040 fail (sau khi mở lại trình duyệt, phiên không còn), dòng 2 pass. Sau mỗi mutant, mọi file giống bản sao từng byte. TC-040 và TC-133 chuyển sang Sẵn sàng. SU-12 chạy lại toàn bộ với 2 worker, vì máy thiếu bộ nhớ: 141 pass, 20 fail; 20 test fail đều thuộc mục 4.1 (VF-13) | 2026-11-19 |

## 5. Tiêu chí đạt

| ID | Tiêu chí | Điều kiện đầu vào | Kết quả |
| --- | --- | --- | --- |
| Q1-01 | Version của test design và snapshot testware được ghi rõ | RC-02 | Đạt |
| Q1-02 | Mỗi test case trong phạm vi có một dòng ở mục 2; tổng ở bảng số lượng bằng số test case trong phạm vi | IN-01, IN-02 | Đạt: 166 dòng |
| Q1-03 | Test case chỉ được ghi Sẵn sàng khi procedure, data và môi trường liên quan đều đạt tiêu chí của file 02, 03, 04 | — | Đạt cho 161 test case Sẵn sàng: data và môi trường của chúng đã kiểm tra (DA-01 đến DA-11, ENV-01 đến ENV-08, ENV-10 đến ENV-13). 12 test case trong số đó được chấp nhận bằng review assertion thay cho mutant (TD-08, mục 4.2) |
| Q1-04 | Mọi thay đổi expected result có người xác nhận; không expected result nào được đổi để khớp hành vi hiện tại | RC-01, IN-12 | Đạt. Hai thay đổi expected result. CH-07: "không phải 429" thành response và tác dụng của từng endpoint (Test Cases mục 2.1), product owner xác nhận. CH-10: TC-204 theo quy tắc định dạng email của test basis, agent chốt theo ủy quyền của product owner; product owner chưa xem CH-10, và CH-10 được nêu trong báo cáo để product owner xác nhận hoặc bác. Cả hai lấy phần tác dụng từ test basis; status lấy từ `better-auth@1.7.25` là contract của riêng version đó, nên expected result không chỉ khớp hành vi hiện tại. Các CH khác đổi bước, môi trường, test level hoặc cách so, không đổi expected result; CH-01 và CH-04 đã hủy |
| Q1-05 | Mọi test case chưa Sẵn sàng có phần thiếu được mô tả và có việc tương ứng ở mục 4 | — | Đạt: 5 test case thủ công chờ TD-09 |
| Q1-06 | Điều kiện cần kiểm tra lại khi chạy test được ghi, hoặc ghi "Không có" | — | Đạt |

**Người review / ngày:** Product owner duyệt báo cáo Phase 04, 2026-11-18. Thay đổi sau lần duyệt đó (CH-09 đến CH-11, mục 4.2) do agent chốt theo ủy quyền và chưa được review

## References

1. <a id="ref-1"></a>[Test Cases](../../03-design/output/04-test-cases.md) — commit `497541d`, 2026-11-17
2. <a id="ref-2"></a>[Authentication](../../../../../design/prototype/docs/requirements/authentication.md) — commit `c23d848`, 2026-11-17
3. <a id="ref-3"></a>[Security](../../../../../architecture/23-security.md) — commit `c23d848`, 2026-11-17
