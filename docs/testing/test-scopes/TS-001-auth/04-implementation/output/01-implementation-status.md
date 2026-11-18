# Test Implementation Status

Đọc file này để biết từng test case của TS-001 đã có đủ testware, data và môi trường để chạy hay chưa, testware khác test design ở đâu, và việc gì còn phải làm.

## 1. Phạm vi

| Trường | Nội dung |
| --- | --- |
| Version / thời điểm chốt | 2026-11-18 (GMT+7) |
| Phạm vi | Authentication, SC-01 đến SC-09 và SC-17 của Test Plan. Test level: Component, Component integration, System (tự động); System integration và review (thủ công); 4 exploratory charter |
| Test design được hiện thực hóa | Test Cases [[1]](#ref-1), 165 test case `v1`, commit `497541d` |
| Snapshot testware | Branch `test/auth`, commit chứa thư mục `04-implementation/` |
| Build hoặc interface dùng để xác minh | Code tại `b4ca981` (`git log b4ca981..HEAD -- apps packages` không có commit); `better-auth@1.7.25`. Ngày 2026-11-18, `SIGN_IN_RATE_LIMIT` (`apps/api/src/configs/auth.ts`) và `DEFAULT_DESTINATION` (`apps/web/app/utils/auth-redirect.ts`) bỏ từ khóa `export`, vì không module production nào import chúng (`pnpm check:exports`). `pnpm build` trước và sau thay đổi cho `apps/api/dist/index.js` và `apps/web/build` giống từng byte; chỉ `index.js.map` khác, vì file này chứa source |
| Dependency đã review | `better-auth@1.7.25`, `@better-auth/core@1.7.25`, `@better-auth/utils@0.5.1`, đọc ngày 2026-11-18. Nội dung đã review, cần làm lại khi một version đổi: status của request được chấp nhận (Test Cases mục 2.1, CH-07); nguồn ngẫu nhiên của token phiên (TC-206, TD-14); requirement viết theo hành vi của Better Auth (SR-06 của Entry/Exit Criteria). `pnpm check:docs` fail khi `pnpm-lock.yaml` không còn một version ở đây |
| Người thực hiện / người review | Người thực hiện: agent. Người review: product owner |
| File chi tiết | [Procedures & Suites](02-procedures-and-suites.md), [Test Data](03-test-data.md), [Test Environment](04-test-environment.md) |

## 2. Mức sẵn sàng theo test case

Test case có phần CI và phần S được tính là một dòng. "Sẵn sàng" với test case tự động nghĩa là script đã chạy hết trên `b4ca981`, đã được review với test case, và đã thấy fail ít nhất một lần khi hành vi sai: trên `b4ca981` vì sản phẩm lệch test basis, hoặc trên mutant build (Procedures & Suites mục 6).

| Test case ID / version | Coverage items | Procedure / script | Suite | Data IDs | Env IDs | Trạng thái | Phần thiếu |
| --- | --- | --- | --- | --- | --- | --- | --- |
| TC-001; v1 | MD-01-CI-01, MD-01-CI-03, MD-01-CI-06, MD-01-CI-09, MD-01-CI-12 | PROC-01 | SU-03 | DA-01, DA-07 | ENV-01, ENV-06 | Sẵn sàng | Không có |
| TC-002; v1 | MD-01-CI-13 | PROC-01 | SU-03 | DA-01, DA-07 | ENV-01, ENV-06 | Sẵn sàng | CH-07 |
| TC-003; v1 | MD-01-CI-02 | PROC-01 | SU-03 | DA-07 | ENV-01, ENV-10 | Đã tạo, chưa xác minh | Chưa thấy test fail khi hành vi sai (VF-02 đến VF-07, VF-10); TD-08. CH-07, CH-08 |
| TC-004; v1 | MD-01-CI-04, MD-01-CI-07, MD-01-CI-10 | PROC-01 | SU-03 | DA-07 | ENV-01, ENV-06 | Sẵn sàng | CH-07 |
| TC-005; v1 | MD-01-CI-05, MD-01-CI-08, MD-01-CI-11, MD-01-CI-14 | PROC-01 | SU-03 | DA-07 | ENV-01, ENV-06, ENV-10 | Sẵn sàng | CH-07, CH-08 |
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
| TC-031; v1 | MD-02-CI-02 | PROC-12 | SU-12 | DA-01 | ENV-02, ENV-07 | Đã tạo, chưa xác minh | Chưa thấy test fail khi hành vi sai (VF-02 đến VF-07); TD-08 |
| TC-032; v1 | MD-02-CI-03 | PROC-02 | SU-03 | — | ENV-01 | Đã tạo, chưa xác minh | Chưa thấy test fail khi hành vi sai (VF-02 đến VF-07); TD-08 |
| TC-033; v1 | MD-02-CI-04, MD-02-CI-05, MD-02-CI-15, MD-02-CI-16 | PROC-02 | SU-03 | DA-01 | ENV-01 | Sẵn sàng | Không có |
| TC-034; v1 | MD-02-CI-06, MD-02-CI-07 | PROC-02 | SU-03 | DA-01 | ENV-01, ENV-06 | Sẵn sàng | Không có |
| TC-035; v1 | MD-02-CI-08 | PROC-02 | SU-03 | DA-01 | ENV-01, ENV-06 | Sẵn sàng | Không có |
| TC-036; v1 | MD-02-CI-09 | PROC-02 | SU-03 | DA-01 | ENV-01, ENV-06 | Sẵn sàng | Không có |
| TC-037; v1 | MD-02-CI-10, MD-02-CI-21 | PROC-12 | SU-12 | DA-01 | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-038; v1 | MD-02-CI-11, MD-02-CI-22 | PROC-12 | SU-12 | DA-01 | ENV-02, ENV-07, ENV-12 | Sẵn sàng | Không có |
| TC-039; v1 | MD-02-CI-12, MD-02-CI-23 | PROC-02 | SU-03 | DA-01, DA-08 | ENV-01, ENV-03 | Sẵn sàng | Không có |
| TC-040; v1 | MD-02-CI-13, MD-02-CI-24 | PROC-12 | SU-12 | DA-01 | ENV-02, ENV-07 | Đã tạo, chưa xác minh | Chưa thấy test fail khi hành vi sai (VF-02 đến VF-07); TD-08 |
| TC-041; v1 | MD-02-CI-14, MD-02-CI-25 | PROC-02 | SU-03 | DA-01, DA-07 | ENV-01 | Sẵn sàng | Không có |
| TC-042; v1 | MD-02-CI-17, MD-02-CI-18, MD-02-CI-19 | PROC-02 | SU-03 | DA-01 | ENV-01, ENV-06 | Đã tạo, chưa xác minh | Chưa thấy test fail khi hành vi sai (VF-02 đến VF-07); TD-08 |
| TC-043; v1 | MD-02-CI-26 | PROC-05 | SU-03 | DA-04 | ENV-01, ENV-04 | Sẵn sàng | Không có |
| TC-044; v1 | MD-02-CI-27 | PROC-02 | SU-03 | DA-02, DA-08 | ENV-01, ENV-03 | Sẵn sàng | Không có |
| TC-045; v1 | MD-07-CI-16, MD-07-CI-01, MD-07-CI-02, MD-07-CI-03 | PROC-02 | SU-03 | DA-02, DA-08 | ENV-01, ENV-03, ENV-06 | Sẵn sàng | Không có |
| TC-046; v1 | MD-07-CI-17, MD-07-CI-04, MD-07-CI-05, MD-07-CI-06 | PROC-02 | SU-03 | DA-01, DA-08 | ENV-01, ENV-03, ENV-06 | Sẵn sàng | Không có |
| TC-047; v1 | MD-07-CI-18, MD-07-CI-07, MD-07-CI-08, MD-07-CI-09 | PROC-02 | SU-03 | DA-01 | ENV-01, ENV-06 | Sẵn sàng | Không có |
| TC-048; v1 | MD-07-CI-19, MD-07-CI-10, MD-07-CI-11, MD-07-CI-12 | PROC-02 | SU-03 | DA-01 | ENV-01, ENV-06 | Sẵn sàng | Không có |
| TC-049; v1 | MD-07-CI-20, MD-07-CI-13, MD-07-CI-14, MD-07-CI-15 | PROC-02 | SU-03 | DA-01 | ENV-01, ENV-06 | Sẵn sàng | Không có |
| TC-050; v1 | MD-07-CI-21 đến MD-07-CI-24 | PROC-02 | SU-03 | DA-01 | ENV-01, ENV-06 | Sẵn sàng | Không có |
| TC-060; v1 | MD-03-CI-01, MD-03-CI-02, MD-03-CI-03 | PROC-13 | SU-12 | DA-01, DA-08 | ENV-02, ENV-07 | Sẵn sàng | CH-02; TD-12 |
| TC-061; v1 | MD-03-CI-04 | PROC-13 | SU-12 | DA-01, DA-08 | ENV-02, ENV-07 | Đã tạo, chưa xác minh | Chưa thấy test fail khi hành vi sai (VF-02 đến VF-07); TD-08 |
| TC-062; v1 | MD-03-CI-05, MD-03-CI-10 | PROC-13 | SU-12 | DA-01, DA-08 | ENV-02, ENV-06, ENV-07 | Đã tạo, chưa xác minh | Chưa thấy test fail khi hành vi sai (VF-02 đến VF-07); TD-08 |
| TC-063; v1 | MD-03-CI-06 | PROC-03 | SU-03 | DA-01, DA-08 | ENV-01, ENV-03 | Đã tạo, chưa xác minh | Chưa thấy test fail khi hành vi sai (VF-02 đến VF-07); TD-08 |
| TC-064; v1 | MD-03-CI-07 | PROC-13 | SU-12 | DA-01, DA-08 | ENV-02, ENV-07 | Đã tạo, chưa xác minh | Chưa thấy test fail khi hành vi sai (VF-02 đến VF-07); TD-08 |
| TC-065; v1 | MD-03-CI-08 | PROC-13 | SU-12 | DA-01, DA-08 | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-066; v1 | MD-03-CI-09, MD-03-CI-12 | PROC-03 | SU-03 | DA-01, DA-08 | ENV-01, ENV-03, ENV-06 | Sẵn sàng | Không có |
| TC-067; v1 | MD-03-CI-11 | PROC-13 | SU-12 | DA-01, DA-08 | ENV-02, ENV-06, ENV-07 | Sẵn sàng | Không có |
| TC-068; v1 | MD-03-CI-13 | PROC-03 | SU-03 | DA-01, DA-08 | ENV-01, ENV-03 | Sẵn sàng | Không có |
| TC-069; v1 | MD-03-CI-14, MD-03-CI-15 | PROC-03 | SU-03 | DA-01, DA-08 | ENV-01, ENV-03, ENV-06 | Sẵn sàng | Không có |
| TC-070; v1 | MD-04-CI-01 | PROC-13 | SU-12 | DA-02, DA-08 | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-071; v1 | MD-04-CI-02 | PROC-13 | SU-12 | DA-01, DA-02, DA-08 | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-072; v1 | MD-04-CI-03, MD-04-CI-09 | PROC-13 | SU-12 | DA-02, DA-08 | ENV-02, ENV-06, ENV-07 | Sẵn sàng | Không có |
| TC-073; v1 | MD-04-CI-04 | PROC-13 | SU-12 | DA-02, DA-08 | ENV-02, ENV-07 | Đã tạo, chưa xác minh | Chưa thấy test fail khi hành vi sai (VF-02 đến VF-07); TD-08 |
| TC-074; v1 | MD-04-CI-05 | PROC-13 | SU-12 | DA-02, DA-08 | ENV-02, ENV-07 | Đã tạo, chưa xác minh | Chưa thấy test fail khi hành vi sai (VF-02 đến VF-07); TD-08 |
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
| TC-103; v1 | MD-08-CI-04 | PROC-05, PROC-14 | SU-03, SU-12 | DA-02, DA-04 | ENV-01, ENV-02, ENV-04, ENV-07 | Một phần | Phần S bị chặn: OAuth provider giả không trả lời được bước trao đổi `code` phía server; TD-11 |
| TC-104; v1 | MD-08-CI-05 | PROC-05 | SU-03 | DA-03, DA-04 | ENV-01, ENV-04 | Sẵn sàng | Không có |
| TC-110; v1 | MD-09-CI-01, MD-09-CI-06 | PROC-04 | SU-03 | DA-01, DA-06, DA-08 | ENV-01, ENV-05 | Sẵn sàng | Không có |
| TC-111; v1 | MD-09-CI-02, MD-09-CI-07 | PROC-04 | SU-03 | DA-01, DA-06, DA-08 | ENV-01, ENV-05 | Sẵn sàng | Không có |
| TC-112; v1 | MD-09-CI-03, MD-09-CI-08 | PROC-04 | SU-03 | DA-01, DA-06, DA-08 | ENV-01, ENV-05 | Đã tạo, chưa xác minh | Chưa thấy test fail khi hành vi sai (VF-02 đến VF-07); TD-08 |
| TC-113; v1 | MD-09-CI-04, MD-09-CI-09 | PROC-04 | SU-03 | DA-01, DA-06, DA-08 | ENV-01, ENV-05 | Sẵn sàng | Không có |
| TC-114; v1 | MD-09-CI-05, MD-09-CI-10 | PROC-04 | SU-03 | DA-01, DA-06, DA-08 | ENV-01, ENV-05 | Sẵn sàng | Không có |
| TC-120; v1 | MD-10-CI-01, MD-10-CI-04, MD-10-CI-07 | PROC-12 | SU-12 | DA-01 | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-121; v1 | MD-10-CI-02, MD-10-CI-08, MD-10-CI-10 | PROC-12 | SU-12 | DA-01 | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-122; v1 | MD-10-CI-09 | PROC-12 | SU-12 | — | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-123; v1 | MD-10-CI-03, MD-10-CI-13, MD-10-CI-11 | PROC-12 | SU-12 | DA-01 | ENV-02, ENV-07, ENV-12 | Sẵn sàng | Không có |
| TC-124; v1 | MD-10-CI-12 | PROC-12 | SU-12 | — | ENV-02, ENV-07, ENV-12 | Sẵn sàng | Không có |
| TC-125; v1 | MD-10-CI-05 | PROC-12 | SU-12 | DA-01 | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-126; v1 | MD-10-CI-06 | PROC-12 | SU-12 | DA-01 | ENV-02, ENV-07 | Sẵn sàng | CH-05; TD-12 |
| TC-130; v1 | MD-11-CI-01 đến MD-11-CI-04, MD-11-CI-43 | PROC-14 | SU-12 | DA-11 | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-131; v1 | MD-11-CI-05 đến MD-11-CI-08, MD-11-CI-44 | PROC-14 | SU-12 | DA-11 | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-132; v1 | MD-11-CI-09 đến MD-11-CI-12, MD-11-CI-45 | PROC-14 | SU-12 | DA-11 | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-133; v1 | MD-11-CI-13 đến MD-11-CI-16 | PROC-06 | SU-03 | DA-01, DA-11 | ENV-01 | Sẵn sàng | TD-10 (câu hỏi expected result) |
| TC-134; v1 | MD-11-CI-17, MD-11-CI-18 | PROC-14 | SU-12 | — | ENV-02, ENV-07 | Đã tạo, chưa xác minh | Chưa thấy test fail khi hành vi sai (VF-02 đến VF-07); TD-08 |
| TC-135; v1 | MD-11-CI-19 đến MD-11-CI-22 | PROC-14 | SU-12 | DA-01, DA-08 | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-136; v1 | MD-11-CI-23, MD-11-CI-24 | PROC-14 | SU-12 | DA-11 | ENV-02, ENV-07 | Đã tạo, chưa xác minh | Chưa thấy test fail khi hành vi sai (VF-02 đến VF-07); TD-08 |
| TC-137; v1 | MD-11-CI-25 | PROC-14 | SU-12 | DA-01 | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-138; v1 | MD-11-CI-26 | PROC-11 | SU-12 | DA-07 | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-139; v1 | MD-11-CI-27, MD-11-CI-28 | PROC-14 | SU-12 | — | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-140; v1 | MD-11-CI-29, MD-11-CI-30 | PROC-14 | SU-12 | — | ENV-02, ENV-07, ENV-11 | Sẵn sàng | Không có |
| TC-141; v1 | MD-11-CI-31, MD-11-CI-32 | PROC-14 | SU-12 | — | ENV-02, ENV-04, ENV-07 | Sẵn sàng | Không có |
| TC-142; v1 | MD-11-CI-33 đến MD-11-CI-39 | PROC-14 | SU-12 | DA-01, DA-08 | ENV-02, ENV-07, ENV-12 | Sẵn sàng | Không có |
| TC-143; v1 | MD-11-CI-40 đến MD-11-CI-42 | PROC-14 | SU-12 | DA-01, DA-08 | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-144; v1 | MD-11-CI-46, MD-11-CI-47 | PROC-14 | SU-12 | DA-10 | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-145; v1 | MD-11-CI-48 | PROC-13 | SU-12 | DA-02, DA-08 | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-146; v1 | MD-11-CI-49 | PROC-13 | SU-12 | DA-01, DA-08 | ENV-02, ENV-07 | Đã tạo, chưa xác minh | Chưa thấy test fail khi hành vi sai (VF-02 đến VF-07); TD-08 |
| TC-150; v1 | MD-12-CI-01 đến MD-12-CI-06 | PROC-06, PROC-14 | SU-03, SU-12 | DA-01, DA-02, DA-03 | ENV-01, ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-160; v1 | MD-18-CI-01 đến MD-18-CI-07 | PROC-09, PROC-14 | SU-02, SU-12 | DA-01, DA-09 | ENV-02, ENV-07, ENV-13 | Sẵn sàng | Không có |
| TC-170; v1 | MD-13-CI-01 | PROC-14 | SU-12 | DA-01 | ENV-02, ENV-07 | Đã tạo, chưa xác minh | Chưa thấy test fail khi hành vi sai (VF-02 đến VF-07); TD-08 |
| TC-171; v1 | MD-13-CI-02 | PROC-14 | SU-12 | DA-01 | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-172; v1 | MD-13-CI-03 | PROC-14 | SU-12 | DA-11 | ENV-02, ENV-07 | Đã tạo, chưa xác minh | Chưa thấy test fail khi hành vi sai (VF-02 đến VF-07); TD-08 |
| TC-173; v1 | MD-13-CI-04 | PROC-14 | SU-12 | DA-01 | ENV-02, ENV-07 | Đã tạo, chưa xác minh | Chưa thấy test fail khi hành vi sai (VF-02 đến VF-07); TD-08 |
| TC-174; v1 | MD-13-CI-05 | PROC-14 | SU-12 | DA-02 | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-175; v1 | MD-13-CI-06 | PROC-11 | SU-12 | DA-01, DA-07 | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-176; v1 | MD-13-CI-07 | PROC-14 | SU-12 | DA-11, DA-08 | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-177; v1 | MD-13-CI-08 | PROC-14 | SU-12 | DA-11, DA-08 | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-178; v1 | MD-13-CI-09 | PROC-14 | SU-12 | DA-11, DA-08 | ENV-02, ENV-07 | Đã tạo, chưa xác minh | Chưa thấy test fail khi hành vi sai (VF-02 đến VF-07); TD-08 |
| TC-179; v1 | MD-13-CI-10 | PROC-14 | SU-12 | DA-11, DA-08 | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-180; v1 | MD-13-CI-11 | PROC-14 | SU-12 | DA-11, DA-08 | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-181; v1 | MD-13-CI-12 | PROC-14 | SU-12 | DA-11 | ENV-02, ENV-07 | Đã tạo, chưa xác minh | Chưa thấy test fail khi hành vi sai (VF-02 đến VF-07); TD-08 |
| TC-182; v1 | MD-13-CI-13 | PROC-14 | SU-12 | DA-01 | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-183; v1 | MD-13-CI-14 | PROC-14 | SU-12 | DA-02 | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-184; v1 | MD-13-CI-15 | PROC-14 | SU-12 | DA-11 | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-185; v1 | MD-13-CI-16 | PROC-06 | SU-03 | DA-11 | ENV-01, ENV-03 | Sẵn sàng | CH-03; TD-12 |
| TC-186; v1 | MD-13-CI-17 | PROC-13 | SU-12 | DA-01, DA-08 | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-187; v1 | MD-13-CI-18 | PROC-13 | SU-12 | DA-01, DA-08 | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-188; v1 | MD-13-CI-19 | PROC-13 | SU-12 | DA-01, DA-08 | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-189; v1 | MD-13-CI-20 | PROC-13 | SU-12 | DA-11 | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-190; v1 | MD-13-CI-21 | PROC-13 | SU-12 | DA-01, DA-08 | ENV-02, ENV-07 | Đã tạo, chưa xác minh | Chưa thấy test fail khi hành vi sai (VF-02 đến VF-07); TD-08 |
| TC-191; v1 | MD-13-CI-22 | PROC-13 | SU-12 | DA-01, DA-08 | ENV-02, ENV-06, ENV-07 | Đã tạo, chưa xác minh | Chưa thấy test fail khi hành vi sai (VF-02 đến VF-07); TD-08 |
| TC-192; v1 | MD-13-CI-23 | PROC-06 | SU-03 | DA-01 | ENV-01, ENV-03 | Đã tạo, chưa xác minh | Chưa thấy test fail khi hành vi sai (VF-02 đến VF-07); TD-08. CH-03; TD-12 |
| TC-193; v1 | MD-13-CI-24 | PROC-12 | SU-12 | DA-01 | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-194; v1 | MD-13-CI-25 | PROC-12 | SU-12 | DA-01 | ENV-02, ENV-07, ENV-12 | Sẵn sàng | Không có |
| TC-195; v1 | MD-13-CI-26 | PROC-17 | SU-21 | DA-12 | ENV-09 | Đã tạo, chưa xác minh | DA-12 và ENV-09 chưa kiểm tra (EN-07); TD-09 |
| TC-196; v1 | MD-13-CI-27 | PROC-17 | SU-21 | DA-12 | ENV-09 | Đã tạo, chưa xác minh | DA-12 và ENV-09 chưa kiểm tra (EN-07); TD-09 |
| TC-197; v1 | MD-13-CI-28 | PROC-17 | SU-21 | DA-12 | ENV-09 | Đã tạo, chưa xác minh | DA-12 và ENV-09 chưa kiểm tra (EN-07); TD-09 |
| TC-198; v1 | MD-13-CI-29 | PROC-17 | SU-21 | DA-12 | ENV-09 | Đã tạo, chưa xác minh | DA-12 và ENV-09 chưa kiểm tra (EN-07); TD-09 |
| TC-199; v1 | MD-13-CI-30 | PROC-05 | SU-03 | DA-02, DA-04, DA-08 | ENV-01, ENV-03, ENV-04 | Sẵn sàng | Không có |
| TC-200; v1 | MD-14-CI-01, MD-14-CI-02, MD-14-CI-10, MD-14-CI-16, MD-14-CI-18, MD-14-CI-19, MD-14-CI-20 | PROC-18 | SU-22 | — | — | Sẵn sàng | Không có |
| TC-201; v1 | MD-14-CI-05 | PROC-04 | SU-03 | DA-05 | ENV-01, ENV-05 | Sẵn sàng | Không có |
| TC-202; v1 | MD-14-CI-07 | PROC-15 | SU-12 | — | ENV-02, ENV-07 | Đã tạo, chưa xác minh | Chưa thấy test fail khi hành vi sai (VF-02 đến VF-07); TD-08 |
| TC-203; v1 | MD-14-CI-08 | PROC-04 | SU-03 | DA-05 | ENV-01 | Đã tạo, chưa xác minh | Chưa thấy test fail khi hành vi sai (VF-02 đến VF-07); TD-08 |
| TC-204; v1 | MD-14-CI-13 | PROC-06 | SU-03 | — | ENV-01 | Sẵn sàng | CH-06; TD-10 (câu hỏi expected result) |
| TC-205; v1 | MD-14-CI-22 | PROC-06 | SU-03 | DA-01 | ENV-01 | Đã tạo, chưa xác minh | Chưa thấy test fail khi hành vi sai (VF-02 đến VF-07); TD-08 |
| TC-206; v1 | MD-14-CI-23 | PROC-07 | SU-03 | — | ENV-01 | Đã tạo, chưa xác minh | Chưa thấy test fail khi hành vi sai (VF-02 đến VF-07); TD-08. Test chỉ kiểm định dạng token. Nguồn ngẫu nhiên được kiểm bằng review code, không bằng test (TD-14) |
| TC-207; v1 | MD-14-CI-34 | PROC-15 | SU-12 | — | ENV-02, ENV-07 | Đã tạo, chưa xác minh | Chưa thấy test fail khi hành vi sai (VF-02 đến VF-07); TD-08 |
| TC-208; v1 | MD-14-CI-39 | PROC-06 | SU-03 | DA-01 | ENV-01, ENV-03 | Đã tạo, chưa xác minh | Chưa thấy test fail khi hành vi sai (VF-02 đến VF-07); TD-08 |
| TC-220; v1 | MD-15-CI-01, MD-15-CI-02, MD-15-CI-03 | PROC-06, PROC-15 | SU-03, SU-12 | DA-01 | ENV-01, ENV-02, ENV-07, ENV-11 | Sẵn sàng | Không có |
| TC-221; v1 | MD-15-CI-04, MD-15-CI-06 | PROC-06, PROC-15 | SU-03, SU-12 | DA-01 | ENV-01, ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-222; v1 | MD-15-CI-05 | PROC-06 | SU-03 | — | ENV-01, ENV-03, ENV-04 | Sẵn sàng | Không có |
| TC-223; v1 | MD-15-CI-07 | PROC-06 | SU-03 | DA-01 | ENV-01 | Sẵn sàng | CH-03; TD-12 |
| TC-224; v1 | MD-15-CI-08 | PROC-06 | SU-03 | DA-01 | ENV-01 | Đã tạo, chưa xác minh | Chưa thấy test fail khi hành vi sai (VF-02 đến VF-07); TD-08 |
| TC-225; v1 | MD-15-CI-09 | PROC-15 | SU-12 | — | ENV-02, ENV-07 | Đã tạo, chưa xác minh | Chưa thấy test fail khi hành vi sai (VF-02 đến VF-07); TD-08 |
| TC-226; v1 | MD-15-CI-10, MD-15-CI-11 | PROC-06 | SU-03 | — | ENV-11 | Sẵn sàng | Không có |
| TC-227; v1 | MD-15-CI-12 đến MD-15-CI-20 | PROC-15 | SU-12 | — | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-228; v1 | MD-15-CI-21 | PROC-15 | SU-12 | — | ENV-02, ENV-07 | Đã tạo, chưa xác minh | Chưa thấy test fail khi hành vi sai (VF-02 đến VF-07); TD-08 |
| TC-229; v1 | MD-15-CI-22, MD-15-CI-23, MD-15-CI-24 | PROC-06 | SU-03 | DA-01, DA-02 | ENV-01, ENV-03 | Sẵn sàng | CH-03; TD-12 |
| TC-230; v1 | MD-15-CI-25 | PROC-15 | SU-12 | DA-01, DA-08 | ENV-02, ENV-07 | Sẵn sàng | Không có |
| TC-231; v1 | MD-15-CI-26, MD-15-CI-27 | PROC-06 | SU-03 | DA-01 | ENV-01, ENV-03 | Sẵn sàng | Không có |
| TC-232; v1 | MD-15-CI-28 | PROC-05 | SU-03 | DA-04 | ENV-01, ENV-04 | Đã tạo, chưa xác minh | Chưa thấy test fail khi hành vi sai (VF-02 đến VF-07); TD-08 |
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
| Sẵn sàng | 127 |
| Đã tạo, chưa xác minh | 37 (33 tự động chưa thấy fail; 4 thủ công TC-195 đến TC-198) |
| Một phần | 1 (TC-103) |
| Chưa triển khai | 0 |
| Bị chặn | 0 |
| Hoãn | 0 |
| **Tổng** | **165** |

4 exploratory charter CHR-01 đến CHR-04 có procedure PROC-19 đến PROC-22; charter không có script nên không xác minh bằng dry run.

## 3. Thay đổi so với test design

CH-07 là thay đổi expected result duy nhất; các dòng khác đổi bước, môi trường hoặc cách so. Mỗi dòng dưới đây ghi test design yêu cầu gì, điều gì chặn việc làm đúng như vậy, testware làm gì thay, và vì sao cách mới vẫn kiểm đúng expected result. CH-01 và CH-04 đã bị hủy sau review ngày 2026-11-18: môi trường test được sửa, và hai test case giờ chạy đúng test design. Hai dòng được giữ lại để lịch sử review khớp với ID. CH-07 và CH-08 được product owner xác nhận ngày 2026-11-18. CH-02, CH-03, CH-05 và CH-06 chờ xác nhận (TD-12).

| Change ID | Test case ID | Test design ghi | Vấn đề khi làm đúng như vậy | Thay đổi | Vì sao vẫn kiểm đúng expected result | Người xác nhận, ngày | Nguồn đã được cập nhật |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CH-01 (đã hủy) | TC-140 dòng 2 | Precondition: `GOOGLE_CLIENT_ID` và `GOOGLE_CLIENT_SECRET` trống. Mở `/sign-in`: không có nút Continue with Google | Bản đầu chỉ có một server E2E, và server đó lấy biến Google từ `.env` của developer, nên không có server nào chạy với hai biến trống. Bản đầu né bằng hai cách: giả response `/api/auth-config` trong trình duyệt, và gọi hàm nội bộ `isGoogleEnabled` trong test API. Cả hai kiểm code hiện tại, không kiểm app thật khi thiếu biến Google | Không còn thay đổi. Môi trường E2E chạy hai server (ENV-07): `main` có biến Google giả, `withoutGoogle` có hai biến trống, cổng và database riêng. Dòng 2 mở `/sign-in` trên `withoutGoogle`. Test API của `isGoogleEnabled` bị xóa | Test chạy đúng test design. Hai dòng không còn phụ thuộc giá trị Google trong `.env` | Không cần | Không cần |
| CH-02 | TC-060 | Precondition: A đăng nhập ở trình duyệt 1 và trình duyệt 2. Bước: "Ở trình duyệt 1: Forgot password cho A", rồi mở link ở tab 1 và tab 2 | Test basis: người đã đăng nhập mà mở Auth thì được chuyển tới đích, ví dụ Realtime; chỉ link reset là ngoại lệ [[2, Chuyển tiếp sau khi đăng nhập]](#ref-2). Vì vậy trình duyệt 1 mở `/forgot-password` thì sang Realtime và không thấy form. Bước trong test design mâu thuẫn với test basis | Link được yêu cầu qua màn Forgot password ở trình duyệt 3, là trình duyệt chưa đăng nhập. Link được mở ở tab 1 và tab 2 của trình duyệt 1, như test design. Bản đầu gọi thẳng `POST /api/auth/request-password-reset` ở trình duyệt 1, không qua UI | Expected result của TC-060 nói về link và phiên: link mở được ở hai tab, và sau khi lưu password thì phiên ở trình duyệt 1 và 2 bị từ chối. Trình duyệt nào yêu cầu link không làm đổi các điều đó. Người quên password cũng yêu cầu link khi chưa đăng nhập | Chưa xác nhận | Chưa cập nhật: bước của TC-060 cần sửa ở test design |
| CH-03 | TC-185, TC-192, TC-223, TC-229 | TC-223: "Status và body giống nhau" khi Create account với email đã đăng ký và với email mới. TC-185, TC-192, TC-229: "Response như khi gửi thành công" khi mailer lỗi | Mỗi phép so dùng hai email khác nhau, nên body Create account luôn khác ở 4 trường của `user`: `id` (mỗi tài khoản một id), `email` (lặp lại email đã gửi), `createdAt` và `updatedAt` (thời điểm request). So nguyên body thì test luôn fail, kể cả khi sản phẩm đúng. Test basis yêu cầu cùng một response để form không lộ email đã đăng ký [[3, Lộ email đã đăng ký]](#ref-3) | So nguyên status và body. Riêng 4 trường trên được so theo dạng: `id` có cùng độ dài và cùng loại ký tự, `email` là một email, `createdAt` và `updatedAt` là thời điểm của request (lệch không quá 10 phút). Bản đầu bỏ hẳn 4 trường này khỏi phép so | Người ngoài chỉ phân biệt được hai response qua phần khác về dạng, ví dụ `id` dài khác, `createdAt` cũ của tài khoản đã có, hoặc trường thừa hay thiếu. So theo dạng vẫn bắt được các khác biệt đó. Phép so chỉ bỏ qua các giá trị mà hai email khác nhau buộc phải khác | Chưa xác nhận | Chưa cập nhật: test design cần định nghĩa "body giống nhau" |
| CH-04 (đã hủy) | TC-021 dòng 1 | Ở Check your email, bấm Resend the link tới khi API trả 429. Chạy lại với email chưa đăng ký: thông báo giống hệt | Bản đầu hiểu "email chưa đăng ký" là email không có tài khoản ngay lúc bấm Resend the link. Với cách hiểu đó, UI không tới được Check your email, nên bản đầu ghi `history.state` của React Router để mở thẳng bước này. Cách đó dựa vào code nội bộ và trái test basis: tải lại Check your email thì quay về Create account [[2, Create account và Verify email]](#ref-2) | Không còn thay đổi. Cách hiểu đúng: email chưa có tài khoản khi người dùng bấm Create account. Test basis đưa cả email mới và email đã có tài khoản tới Check your email [[2, Create account và Verify email]](#ref-2). Test chạy hai lần trên UI: lần 1 với email của tài khoản đã có, lần 2 với email mới. 3 request đầu được gửi thẳng tới API, như test design ghi | Test chạy đúng test design | Không cần | Không cần |
| CH-05 | TC-126 | Sign out ở tab 2, rồi đưa tab 1 lên trước: tab 1 hiện màn chặn "Sign in to open Realtime" | Chromium headless coi mọi tab là đang hiển thị, nên `bringToFront` không gửi sự kiện nào cho tab 1. Trình duyệt thật gửi `visibilitychange` (ẩn) và `blur` khi người dùng rời tab, rồi `visibilitychange` (hiện) và `focus` khi người dùng quay lại. Trang web biết người dùng quay lại tab qua các sự kiện này | Khi mở tab 2, test đặt tab 1 về trạng thái ẩn và gửi `visibilitychange` và `blur`. Khi đưa tab 1 lên trước, test đặt tab 1 về trạng thái hiện và gửi `visibilitychange` và `focus`. Bản đầu chỉ gửi một `visibilitychange` và không đổi trạng thái ẩn hay hiện | Tab 1 nhận đủ chuỗi sự kiện của một lần chuyển tab thật, nên test không phụ thuộc vào việc app nghe sự kiện nào. Phần không kiểm: trình duyệt thật có gửi các sự kiện đó không. Đó là hành vi của trình duyệt, không phải của Crypto Force | Chưa xác nhận | Chưa cập nhật |
| CH-06 | TC-204 | Precondition: database `_test` vừa tạo từ migration. Đếm bản ghi bảng `user`: 0 | `pnpm test` tạo `_test` từ migration một lần cho cả lượt chạy. Các file test chạy trước TC-204 tạo tài khoản trong `_test`, nên khi TC-204 chạy, `_test` không còn là database vừa tạo từ migration | TC-204 tạo database `<POSTGRES_DB>_test_fresh` từ migration, đếm bảng `user` trong database đó, rồi xóa database. Phần Sign in với `root@localhost`, `admin@localhost`, `sa@localhost` vẫn chạy như test design | Database riêng đúng là database vừa tạo từ migration của sản phẩm. Kết quả không phụ thuộc thứ tự chạy các file test | Chưa xác nhận | Chưa cập nhật |
| CH-07 | TC-002 đến TC-019 | "Request được chấp nhận" là response không phải 429 (Test Cases mục 2.1) | Response 500, 404 hay 400 cũng không phải 429, nên test vẫn pass khi endpoint hỏng. Mutant M4 (Google provider không được cấu hình) cho thấy TC-010 (d = 10, 11) và TC-019 vẫn pass với cách so cũ. TC-019 còn không kiểm 3 lần Sign in trước đó có tới bộ đếm hay không | Request được chấp nhận phải nhận đúng response của nó khi không bị giới hạn: Sign in với password sai được 401 (như `t`=0 của TC-001); Continue with Google được 200 kèm URL của provider (TC-009); callback Google với `state` lạ được 302 về Auth kèm lỗi (TC-232); Create account, gửi lại link xác minh và Send reset link được 200. TC-019 kiểm thêm: 3 lần Sign in trước đó đều được 401 | Mọi response mà test design coi là được chấp nhận vẫn được chấp nhận, trừ response lỗi khác 429. Response lỗi nghĩa là endpoint không làm việc của nó, nên test fail là đúng. Giá trị 200 của 3 endpoint email không có trong test basis. Nguồn: `better-auth@1.7.25` (khóa trong `pnpm-lock.yaml`) trả `ctx.json(...)` mà không đặt status, tức 200, ở các nhánh thành công trong `dist/api/routes/sign-up.mjs:187, 262, 272`, `email-verification.mjs:118` và `password.mjs:66, 89`. Harness cũng dùng giá trị này để tạo tài khoản (`createUnverifiedAccount`, `newResetToken`). Review ngày 2026-11-18 thấy thêm: status 200 của Continue with Google và 302 của callback cũng lấy từ Better Auth, vì TC-009 chỉ ghi "trả URL của provider" và TC-232 chỉ ghi "chuyển về Auth với lỗi". Vì status lấy từ thư viện không phải requirement, test kiểm thêm tác dụng mà test basis cho: request được chấp nhận gửi email hoặc tạo tài khoản (TC-011, TC-013 đến TC-016), callback chuyển về Auth kèm lỗi (TC-017, TC-018). Mutant M6 cho thấy test chỉ kiểm status vẫn pass khi request không gửi email, còn test mới fail (VF-11) | Product owner, 2026-11-18. Điều kiện: status 200 và 302 là contract của riêng `better-auth@1.7.25`, không phải requirement; test kiểm cả tác dụng của request; kiểm lại các status khi version đổi (mục 1, Dependency đã review) | Test Cases mục 2.1, 2026-11-18 |
| CH-08 | TC-003, TC-005 | Môi trường CI (đồng hồ điều khiển được); bước "Khởi động lại API" | Bản đầu khởi động lại bằng cách tạo instance Better Auth mới trong cùng process test. Better Auth `1.7.25` giữ bộ đếm của `storage: 'memory'` trong một biến của module (`better-auth/dist/api/rate-limiter/index.mjs`), nên instance mới dùng chung bộ đếm với instance cũ. Mutant M3 (bộ đếm trong bộ nhớ) cho thấy TC-005 vẫn pass cả 4 dòng, dù bộ đếm mất khi API khởi động lại thật. Process API riêng không đọc được đồng hồ điều khiển của process test | TC-003 và TC-005 chạy API thật thành process riêng (ENV-10). Khởi động lại là dừng process rồi chạy process mới. Đồng hồ thật: các lần bấm cách nhau 1 giây. Process mới cần khoảng 3 giây để sẵn sàng; khi nó sẵn sàng muộn hơn thời điểm của lần bấm đầu tiên sau khởi động lại, mọi lần bấm sau khởi động lại lùi cùng một khoảng. Test kiểm kết quả của các lần bấm trước khởi động lại (precondition; dòng 4: lần thứ 4 được 429), và báo lỗi môi trường khi lần bấm cuối muộn hơn 9 giây sau lần đầu | Expected result của TC-005 chỉ phụ thuộc số lần bấm được chấp nhận trong cửa sổ 10 giây. Khi mọi lần bấm nằm trong 9 giây đầu, việc lùi thời điểm không đổi expected result của dòng nào. Process mới không giữ gì trong bộ nhớ của process cũ, nên bộ đếm chỉ còn khi API lưu nó ở database, như khi khởi động lại thật. Cổng cố định 3991 đến 3993 không trùng cổng của `pnpm dev` và E2E (3000, 3001, 5173, 5174). Điều kiện đã kiểm trong code: request chỉ được gửi sau khi process in `API listening`; `afterEach` dừng mọi process, kể cả khi assertion fail; các file test chạy lần lượt (`fileParallelism: false`); khi cổng đang bị chiếm, process mới dừng và test fail kèm output của process, không pass sai | Product owner, 2026-11-18 | Chưa cập nhật: TC-005 vẫn ghi ER-06 (đồng hồ điều khiển được) |

## 4. Việc còn lại và điều kiện khi chạy

TD-01 đến TD-06 thuộc Design Status. Số tiếp theo bắt đầu từ TD-07.

| ID | Việc | Test case liên quan | Owner | Hạn | Nơi theo dõi |
| --- | --- | --- | --- | --- | --- |
| TD-07 | Duyệt quy ước ghi kết quả và evidence (IN-11): reporter và file evidence ở Procedures & Suites mục 5 | Mọi test case | Product owner | Trước Phase 05 | File này |
| TD-08 | Chọn cách xác minh 33 test case tự động chưa từng thấy fail (danh sách ở Procedures & Suites mục 6.2): thêm mutant nhắm riêng từng test case, hoặc chấp nhận bằng chứng review vì các test case này dùng chung helper và assertion đã thấy fail ở test case khác. Trước ngày 2026-11-18 danh sách có 34 test case; TC-019 ra khỏi danh sách vì fail trên mutant M5 (VF-10). Làm trước 19 test case ưu tiên Cao, ví dụ TC-003, TC-042, TC-063, TC-112, TC-146, TC-208, TC-232. Khi TD-08 còn mở, 33 test case này giữ trạng thái "Đã tạo, chưa xác minh", và Phase 05 chưa bắt đầu, trừ khi product owner chấp nhận bằng chứng hiện có | Xem Procedures & Suites mục 6.2 | Product owner quyết định; agent làm | Trước Phase 05 | Procedures & Suites mục 6 |
| TD-09 | Chuẩn bị tài khoản Google test và hộp thư Resend (DA-12), kiểm EN-07 (ENV-09), rồi chạy PROC-17 | TC-195 đến TC-198 | Product owner | Phase 05 | [Procedures & Suites](02-procedures-and-suites.md) mục 2.3 |
| TD-10 | Quyết định expected result ở CI của TC-133 và TC-204. Dry run: API trả 400 cho email có khoảng trắng ở hai đầu và cho `root@localhost`, trong khi test case ghi Sign in thành công và thông báo không khớp (401). UI bỏ khoảng trắng trước khi gửi, và `root@localhost` không qua kiểm định dạng email của form. Hai hướng: giữ expected result (API phải chuẩn hóa và trả 401), hoặc chuyển phần này sang test System | TC-133, TC-204 | Product owner | Trước Phase 05 | File này |
| TD-11 | Phần S của TC-103 bị chặn: OAuth provider giả ở S chỉ trả lỗi; luồng thành công cần server trao đổi `code` với Google, và test không thay được endpoint đó khi không sửa code sản phẩm. Hai hướng: chấp nhận phần CI cộng CHR-02, hoặc thêm cấu hình endpoint Google cho môi trường test | TC-103 | Product owner | Trước Phase 05 | File này |
| TD-12 | Xác nhận CH-02, CH-03, CH-05 và CH-06. CH-07 và CH-08 đã được xác nhận ngày 2026-11-18 | TC-060, TC-126, TC-185, TC-192, TC-204, TC-223, TC-229 | Product owner | Trước Phase 05 | Mục 3 |
| TD-13 | Ghi defect report ở Phase 05 cho dấu hiệu lỗi sản phẩm của dry run, sau khi chạy chính thức | Xem mục 4.1 | Agent | Phase 05 | `05-execution/` |
| TD-14 | Nguồn ngẫu nhiên của token phiên (ASVS 7.2.3) có hai lớp bằng chứng. (a) Hành vi, tự động: TC-206 kiểm token không trùng, và độ dài cùng bảng ký tự đủ 128 bit. Lớp này không cho thấy token khó đoán: một bộ đếm cùng độ dài và bảng ký tự cũng pass. (b) Review code, thủ công, ngày 2026-11-18, trên các version ở mục 1 (Dependency đã review). Mọi route mà dự án dùng (Sign in, Create account, xác minh email, liên kết Google, đổi thông tin user) gọi `createSession` mà không có `overrideAll`, nên token là `generateId(32)` (`better-auth/dist/db/internal-adapter.mjs:304`). `generateId` (`@better-auth/core/dist/utils/id.mjs`) gọi `createRandomStringGenerator` với bảng 62 ký tự (`@better-auth/utils/dist/random.mjs`). Hàm này lấy byte từ `crypto.getRandomValues` (dòng 31), là CSPRNG của Node.js và không nhận seed. Hàm bỏ các byte từ 248 trở lên trước phép chia lấy dư (dòng 23), nên 62 ký tự có xác suất bằng nhau. Một token có khoảng 190 bit (32 × log2 62). `apps/api/src/configs/auth.ts` không thay `generateId` và không có `databaseHooks`. Mức bảo đảm của (b) là review, không phải test tự động; `pnpm check:docs` fail khi lockfile không còn version đã review. Việc còn lại: product owner quyết định có thêm test case Review cho (b) vào Test Cases không. Định nghĩa "Request được chấp nhận" (phần cũ của TD-14) đã sửa ngày 2026-11-18 theo CH-07 | TC-206 | Product owner | Trước Phase 05 | Mục 1; Test Cases |
| TD-15 | Kiểm ENV-03, ENV-04, ENV-05, ENV-06 và ENV-12 bằng lỗi: với mỗi mock, làm hỏng một lần hành vi mà mock thay thế (mutant hoặc lỗi đã biết), chạy test dùng mock đó và ghi "Kiểm bằng lỗi:" vào Test Environment mục 3. Kiểm tra sẵn sàng hiện có chỉ cho thấy mock chạy, chưa cho thấy test fail khi hành vi sai. `pnpm check:docs` giữ 5 mục này trong danh sách đã biết (`scripts/check-stlc-docs.mjs`) và fail khi có mục mới | Các test case dùng ENV-03, ENV-04, ENV-05, ENV-06, ENV-12 | Agent | Trước Phase 05 | [Test Environment](04-test-environment.md) mục 3 |
| TD-16 | Tìm nguyên nhân của 2 test fail không ổn định khi chạy cả bộ: (1) 1 test API fail thêm ở 1 lần chạy, các lần khác (ít nhất 5) không fail; chưa xác định tên (VF-10); (2) TC-021 dòng 3 fail 1 lần khi chạy cả bộ E2E ngày 2026-11-18, rồi pass 5 lần khi chạy riêng; (3) TC-017 fail 1 lần trong 9 lần chạy nhóm test giới hạn Google ngày 2026-11-18, sau khi test kiểm thêm đích chuyển hướng (VF-11); 8 lần chạy nhóm khác và 20 lần chạy riêng pass. Nội dung lỗi chưa được lưu, nên chưa biết đó là test API ở (1) hay một lỗi khác. Cần giải quyết trước khi job `test` và `e2e` của CI chặn merge, vì một job đôi khi đỏ mà không có lỗi làm người đọc bỏ qua kết quả đỏ | TC-021, TC-017, chưa rõ test API | Agent | Trước Phase 05 | `.github/workflows/ci.yml` |

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
| API trả 400 thay vì đăng nhập được hoặc 401; chờ quyết định ở TD-10 trước khi coi là lỗi sản phẩm | TC-133, TC-204 |

**Điều kiện cần kiểm tra lại khi chạy test:** version `better-auth` khác `1.7.25` (SR-05; helper `expiredVerificationLink` dựa vào định dạng token của version này); text, label hoặc role trên các trang Auth thay đổi; cổng 5173 bận vì `pnpm dev` đang chạy; Docker Desktop và PostgreSQL chưa bật.

## 5. Tiêu chí đạt

| ID | Tiêu chí | Điều kiện đầu vào | Kết quả |
| --- | --- | --- | --- |
| Q1-01 | Version của test design và snapshot testware được ghi rõ | RC-02 | Đạt |
| Q1-02 | Mỗi test case trong phạm vi có một dòng ở mục 2; tổng ở bảng số lượng bằng số test case trong phạm vi | IN-01, IN-02 | Đạt: 165 dòng |
| Q1-03 | Test case chỉ được ghi Sẵn sàng khi procedure, data và môi trường liên quan đều đạt tiêu chí của file 02, 03, 04 | — | Đạt cho 127 test case Sẵn sàng: data và môi trường của chúng đã kiểm tra (DA-01 đến DA-11, ENV-01 đến ENV-08, ENV-10 đến ENV-13). Q2-04 của file 02 không đạt, nhưng chỉ liên quan cách lưu evidence |
| Q1-04 | Mọi thay đổi expected result có người xác nhận; không expected result nào được đổi để khớp hành vi hiện tại | RC-01, IN-12 | Đạt. CH-07 là thay đổi expected result duy nhất: "không phải 429" thành response và tác dụng của từng endpoint (Test Cases mục 2.1). Product owner xác nhận ngày 2026-11-18. Status 200 và 302 lấy từ `better-auth@1.7.25` và được chấp nhận là contract của riêng version đó; phần tác dụng lấy từ test basis, nên expected result không chỉ khớp hành vi hiện tại. CH-02, CH-03, CH-05, CH-06 đổi bước, môi trường hoặc cách so, không đổi expected result, và chờ xác nhận (TD-12); CH-08 đã xác nhận; CH-01 và CH-04 đã hủy |
| Q1-05 | Mọi test case chưa Sẵn sàng có phần thiếu được mô tả và có việc tương ứng ở mục 4 | — | Đạt: TD-08, TD-09, TD-11, TD-14 |
| Q1-06 | Điều kiện cần kiểm tra lại khi chạy test được ghi, hoặc ghi "Không có" | — | Đạt |

**Người review / ngày:** Chưa review

## References

1. <a id="ref-1"></a>[Test Cases](../../03-design/output/04-test-cases.md) — commit `497541d`, 2026-11-17
2. <a id="ref-2"></a>[Authentication](../../../../../design/prototype/docs/requirements/authentication.md) — commit `c23d848`, 2026-11-17
3. <a id="ref-3"></a>[Security](../../../../../architecture/23-security.md) — commit `c23d848`, 2026-11-17
