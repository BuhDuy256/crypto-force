# Test Design Status

Đọc file này để biết từng test basis item đã được phân tích và thiết kế test tới đâu, coverage của từng test model so với target, và việc gì còn phải làm.

## 1. Phạm vi

| Trường | Nội dung |
| --- | --- |
| Version / thời điểm chốt | 2026-11-17 (GMT+7) |
| Phạm vi | Luồng Authentication của Crypto Force (SC-01 đến SC-09, SC-17 của Test Plan). Test level: Component, Component integration, System, System integration. Test type: Functional, Security, Usability, Reliability |
| Test basis | Requirement Readiness [[1]](#ref-1) `6c7bbd7`: 81 requirement Ready; quyết định của 17 lỗi test basis ở Test Conditions mục 4.1 [[2]](#ref-2), đã có trong Authentication và Security tại commit `c23d848` |
| Test Plan | [[3]](#ref-3) version 1.1, commit `341584a` |
| Snapshot test design | Branch `test/auth`: commit thêm thư mục `03-design/`, có parent là `6c7bbd7` |
| Người thực hiện / người review | Người thực hiện: agent. Người review: product owner |
| File chi tiết | [Test Conditions](02-test-conditions.md), [Test Models](03-test-models.md), [Test Cases](04-test-cases.md), [Data & Environment Requirements](05-data-and-environment-requirements.md) |

## 2. Truy vết theo test basis item

Requirement có expected result một phần lấy từ quyết định của lỗi test basis ghi BD đó ở cột Phần thiếu. Quyết định có trong Authentication và Security tại commit `c23d848`; cột Test basis item ghi version mà requirement được phân tích ở Phase 01.

| Test basis item / version | Rủi ro | Test condition IDs | Test model IDs | Test case / charter IDs | Trạng thái | Phần thiếu |
| --- | --- | --- | --- | --- | --- | --- |
| RD-01; `705a1ad` | Trung bình | COND-01 | MD-13, MD-18 | TC-160, TC-170 | Đã thiết kế | Không có |
| RD-02; `705a1ad` | Trung bình | COND-02 | MD-10, MD-13 | TC-121, TC-171 | Đã thiết kế | Không có |
| RD-04; `705a1ad` | Trung bình | COND-03 | MD-10, MD-13 | TC-121, TC-171 | Đã thiết kế | Không có |
| RD-05; `705a1ad` | Trung bình | COND-04 | MD-13 | TC-171, TC-193 | Đã thiết kế | Không có |
| RD-06; `705a1ad` | Cao | COND-05 | MD-16, MD-18 | TC-160, CHR-04 | Đã thiết kế | BD-14 |
| RD-07; `705a1ad` | Trung bình | COND-06 | MD-11 | TC-143 | Đã thiết kế | Không có |
| RD-08; `705a1ad` | Trung bình | COND-07 | MD-13 | TC-172 | Đã thiết kế | Không có |
| CM-01; `705a1ad` | Trung bình | COND-08 | MD-11 | TC-133 | Đã thiết kế | Không có |
| CM-02; `705a1ad` | Cao | COND-09 | MD-06, MD-14 | TC-090 đến TC-093, TC-096, TC-097, TC-201, TC-203 | Đã thiết kế | BD-10 |
| CM-03; `705a1ad` | Trung bình | COND-10 | MD-11 | TC-142 | Đã thiết kế | Không có |
| SI-01; `705a1ad` | Trung bình | COND-11 | MD-11 | TC-130 | Đã thiết kế | Không có |
| SI-02; `705a1ad` | Trung bình | COND-12 | MD-11 | TC-130 | Đã thiết kế | BD-09(a) |
| SI-03; `705a1ad` | Trung bình | COND-13 | MD-11 | TC-134 | Đã thiết kế | Không có |
| SI-04; `705a1ad` | Trung bình | COND-14 | MD-12, MD-16 | TC-150, TC-173 | Đã thiết kế | BD-01 |
| SI-05; `705a1ad` | Trung bình | COND-15 | MD-12, MD-13 | TC-150, TC-174 | Đã thiết kế | BD-01 |
| SI-06; `705a1ad` | Cao | COND-16 | MD-01, MD-05, MD-13, MD-16 | TC-001 đến TC-008, TC-020, TC-175, CHR-01 | Đã thiết kế | BD-03(b) |
| SI-07; `705a1ad` | Trung bình | COND-17 | MD-01, MD-11 | TC-137, TC-138 | Đã thiết kế | Không có |
| SI-08; `705a1ad` | Trung bình | COND-18 | MD-11, MD-17 | TC-139 | Đã thiết kế | Không có |
| SI-09; `705a1ad` | Cao | COND-19 | MD-02, MD-07 | TC-030, TC-034 đến TC-036, TC-047 đến TC-049, CHR-01 | Đã thiết kế | BD-04 |
| SI-10; `705a1ad` | Cao | COND-20 | MD-02, MD-07 | TC-031, TC-040, TC-042, TC-050 | Đã thiết kế | BD-05(b) |
| SI-11; `705a1ad` | Cao | COND-21 | MD-02, MD-12 | TC-033, TC-150 | Đã thiết kế | Không có |
| SI-12; `705a1ad` | Trung bình | COND-22 | MD-12 | TC-150 | Đã thiết kế | Không có |
| GO-01; `705a1ad` | Cao | COND-23 | MD-11 | TC-140 | Đã thiết kế | Không có |
| GO-02; `705a1ad` | Cao | COND-24 | MD-08 | TC-101 | Đã thiết kế | Không có |
| GO-03; `705a1ad` | Cao | COND-25 | MD-08, MD-16 | TC-102, TC-103, CHR-02 | Đã thiết kế | Không có |
| GO-04; `705a1ad` | Cao | COND-26 | MD-11 | TC-141 | Đã thiết kế | Không có |
| GO-05; `705a1ad` | Cao | COND-27 | MD-02, MD-13 | TC-043, TC-101, TC-195 | Đã thiết kế | BD-05(a) |
| GO-06; `705a1ad` | Cao | COND-28 | MD-13 | TC-195, TC-196 | Đã thiết kế | Không có |
| GO-07; `705a1ad` | Cao | COND-29 | MD-08, MD-13 | TC-199 | Đã thiết kế | Không có |
| GO-08; `705a1ad` | Cao | COND-30 | MD-05 | TC-009, TC-010, TC-017 đến TC-019 | Đã thiết kế | BD-03(a), BD-03(c) |
| GO-09; `705a1ad` | Cao | COND-31 | MD-08, MD-16 | TC-100, TC-104, CHR-02 | Đã thiết kế | BD-13 |
| GO-10; `705a1ad` | Cao | COND-32 | MD-13 | TC-196 | Đã thiết kế | Không có |
| CA-01; `705a1ad` | Trung bình | COND-33 | MD-11, MD-13 | TC-136, TC-176 | Đã thiết kế | Không có |
| CA-02; `705a1ad` | Trung bình | COND-34 | MD-06, MD-11 | TC-094, TC-095, TC-131, TC-144 | Đã thiết kế | BD-09 |
| CA-03; `705a1ad` | Trung bình | COND-35 | MD-13 | TC-021, TC-176 | Đã thiết kế | BD-02 |
| CA-04; `705a1ad` | Trung bình | COND-36 | MD-13, MD-15 | TC-182, TC-223 | Đã thiết kế | Không có |
| CA-05; `705a1ad` | Cao | COND-37 | MD-04, MD-13 | TC-044, TC-070, TC-176, TC-177, CHR-03 | Đã thiết kế | BD-05(a) |
| CA-06; `705a1ad` | Cao | COND-38 | MD-04, MD-11 | TC-072, TC-077, TC-078, TC-145 | Đã thiết kế | BD-06(a) |
| CA-07; `705a1ad` | Trung bình | COND-39 | MD-13 | TC-021, TC-180 | Đã thiết kế | BD-02 |
| CA-08; `705a1ad` | Trung bình | COND-40 | MD-13 | TC-181 | Đã thiết kế | Không có |
| CA-09; `705a1ad` | Trung bình | COND-41 | MD-13 | TC-178, TC-179 | Đã thiết kế | Không có |
| CA-10; `705a1ad` | Trung bình | COND-42 | MD-13 | TC-177 | Đã thiết kế | Không có |
| CA-11; `705a1ad` | Trung bình | COND-43 | MD-17 | TC-246 | Đã thiết kế | Không có |
| CA-12; `705a1ad` | Cao | COND-44 | MD-04, MD-07 | TC-045, TC-072, TC-077 | Đã thiết kế | BD-04 |
| CA-13; `705a1ad` | Cao | COND-45 | MD-06 | TC-091, TC-095, TC-096, TC-098 | Đã thiết kế | BD-10 |
| CA-14; `705a1ad`, Security `d6c0541` | Cao | COND-46 | MD-09 | TC-110 đến TC-114 | Đã thiết kế | BD-11, BD-12 |
| CA-15; `705a1ad` | Trung bình | COND-47 | MD-13 | TC-184 | Đã thiết kế | Không có |
| CA-16; `705a1ad` | Trung bình | COND-48 | MD-13 | TC-183 | Đã thiết kế | Không có |
| CA-17; `705a1ad` | Cao | COND-49 | MD-04, MD-16 | TC-073 đến TC-076 | Đã thiết kế | Không có |
| RP-01; `705a1ad` | Trung bình | COND-50 | MD-13 | TC-186, TC-198 | Đã thiết kế | Không có |
| RP-02; `705a1ad` | Trung bình | COND-51 | MD-11 | TC-132 | Đã thiết kế | BD-08 |
| RP-03; `705a1ad` | Trung bình | COND-52 | MD-11, MD-13 | TC-021, TC-132, TC-189, TC-224 | Đã thiết kế | BD-02 |
| RP-04; `705a1ad` | Cao | COND-53 | MD-03, MD-07, MD-16 | TC-046, TC-060 đến TC-069, CHR-03 | Đã thiết kế | BD-04, BD-06(b), BD-07 |
| RP-05; `705a1ad` | Cao | COND-54 | MD-06, MD-11 | TC-092, TC-093, TC-097, TC-135 | Đã thiết kế | BD-08 |
| RP-06; `705a1ad` | Cao | COND-55 | MD-02, MD-03, MD-13, MD-16 | TC-039, TC-060, TC-188 | Đã thiết kế | Không có |
| RP-07; `705a1ad` | Cao | COND-56 | MD-03, MD-11, MD-13 | TC-062, TC-064, TC-146, TC-190, TC-191 | Đã thiết kế | BD-06 |
| RP-08; `705a1ad` | Cao | COND-57 | MD-11, MD-13 | TC-143, TC-187, TC-188 | Đã thiết kế | Không có |
| SS-01; `bd0ecff` | Cao | COND-58, COND-82 | MD-02, MD-13 | TC-037, TC-193 | Đã thiết kế | Không có |
| SS-02; `bd0ecff` | Trung bình | COND-59 | MD-02, MD-13 | TC-038, TC-194 | Đã thiết kế | Không có |
| SS-03; `bd0ecff` | Trung bình | COND-60, COND-82 | MD-10, MD-13 | TC-121, TC-122, TC-193 | Đã thiết kế | Không có |
| SS-04; `bd0ecff` | Trung bình | COND-61 | MD-10 | TC-125, TC-126 | Đã thiết kế | Không có |
| SS-05; Security `d6c0541` | Cao | COND-62 | MD-02, MD-07 | TC-036, TC-049 | Đã thiết kế | BD-04 |
| SS-06; `705a1ad` | Cao | COND-63 | MD-04, MD-16 | TC-071 | Đã thiết kế | Không có |
| SS-07; ADR-001 `705a1ad` | Trung bình | COND-64 | MD-10 | TC-123, TC-124 | Đã thiết kế | Không có |
| SS-08; Security `d6c0541` | Cao | COND-65 | MD-02 | TC-041 | Đã thiết kế | Không có |
| SEC-01; Security `d6c0541` | Cao | COND-66 | MD-15 | TC-220 | Đã thiết kế | Không có |
| SEC-02; Security `d6c0541` | Cao | COND-67 | MD-15 | TC-221, TC-222, CHR-04 | Đã thiết kế | Không có |
| SEC-03; Security `d6c0541` | Trung bình | COND-68 | MD-15 | TC-223, TC-224 | Đã thiết kế | Không có |
| SEC-04; Security `d6c0541` | Cao | COND-69 | MD-01 | TC-003, TC-005 | Đã thiết kế | Không có |
| SEC-06; Security `d6c0541` | Trung bình | COND-70 | MD-15 | TC-225, TC-226 | Đã thiết kế | Không có |
| SEC-07; Security `d6c0541` | Cao | COND-71 | MD-05 | TC-011 đến TC-016, TC-021 | Đã thiết kế | BD-02, BD-03(a) |
| SEC-08; Security `d6c0541` | Cao | COND-72 | MD-15 | TC-227, TC-228 | Đã thiết kế | `Strict-Transport-Security` không test trong TS-001 (TD-02) |
| SEC-09; Security `d6c0541` | Trung bình | COND-73 | MD-13, MD-15 | TC-185, TC-192, TC-229 | Đã thiết kế | Không có |
| ASVS-6.2.7; ADR-002 `705a1ad` | Cao | COND-74 | MD-14 | TC-202 | Đã thiết kế | Không có |
| ASVS-6.3.2; ADR-002 `705a1ad` | Trung bình | COND-75 | MD-14 | TC-204 | Đã thiết kế | Không có |
| ASVS-7.2.2; ADR-002 `705a1ad` | Trung bình | COND-76 | MD-14 | TC-205 | Đã thiết kế | Không có |
| ASVS-7.2.3; ADR-002 `705a1ad` | Trung bình | COND-77 | MD-14 | TC-206 | Đã thiết kế | Không có |
| ASVS-7.2.4; ADR-002 `705a1ad` | Cao | COND-78 | MD-02, MD-14, MD-16 | TC-033 | Đã thiết kế | Không có |
| ASVS-3.4.2; ADR-002 `705a1ad` | Cao | COND-79 | MD-14 | TC-207, CHR-04 | Đã thiết kế | Không có |
| A11Y-01; `dbbaafe` | Trung bình | COND-80 | MD-17 | TC-240 đến TC-243 | Đã thiết kế | Không có |
| A11Y-02; Test Strategy `705a1ad` | Trung bình | COND-81 | MD-17 | TC-244, TC-245 | Đã thiết kế | Không có |
| BD-15; Security `c23d848` | Cao | COND-83 | MD-15, MD-16 | TC-232, CHR-02 | Đã thiết kế | Không có |
| BD-16; Security `c23d848` | Cao | COND-84 | MD-15, MD-16 | TC-231, CHR-03 | Đã thiết kế | Không có |
| BD-17; Security `c23d848` | Cao | COND-85 | MD-15, MD-16 | TC-230, CHR-03 | Đã thiết kế | Không có |

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
| MD-01 | State Transition | All transitions | 14 | 14 | 100% | 100%, Test Approach mục 2 | Không có |
| MD-02 | State Transition | All transitions | 26 | 26 | 100% | 100%, Test Approach mục 2 | Không có |
| MD-03 | State Transition | All transitions | 15 | 15 | 100% | 100%, Test Approach mục 2 | Không có |
| MD-04 | State Transition | All transitions | 11 | 11 | 100% | 100%, Test Approach mục 2 | Không có |
| MD-05 | Boundary Value Analysis | 3-value BVA | 54 | 54 | 100% | 100%, Test Approach mục 2 | Không có |
| MD-06 | Boundary Value Analysis | 3-value BVA | 33 | 33 | 100% | 100%, Test Approach mục 2 | Không có |
| MD-07 | Boundary Value Analysis | 3-value BVA | 24 | 24 | 100% | 100%, Test Approach mục 2 | Không có |
| MD-08 | Decision Table | All feasible columns | 5 | 5 | 100% | 100%, Test Approach mục 2 | Không có |
| MD-09 | Decision Table | All feasible columns | 10 | 10 | 100% | 100%, Test Approach mục 2 | Không có |
| MD-10 | State Transition | Valid transitions | 13 | 13 | 100% | 100%, Test Approach mục 2 | Không có |
| MD-11 | Equivalence Partitioning | Each Choice | 49 | 49 | 100% | 100%, Test Approach mục 2 | Không có |
| MD-12 | Decision Table | All feasible columns | 6 | 6 | 100% | 100%, Test Approach mục 2 | Không có |
| MD-13 | Scenario / use case | Mỗi luồng | 30 | 30 | 100% | 100%, Test Approach mục 2 | Không có |
| MD-14 | Checklist-based (ASVS) | Mỗi mục áp dụng | 40 | 39 | 97,5% | 100% mục áp dụng, Test Approach mục 2 | MD-14-CI-33 (3.4.1, rủi ro Cao): Không test trong TS-001, kiểm khi deploy (TD-02). MD-14-CI-28 (7.4.4, rủi ro Cao) chỉ được phủ phần Sign out từ một màn hình (TD-03) |
| MD-15 | Checklist-based | Mỗi mục | 28 | 28 | 100% | 100%, người thiết kế đề xuất, product owner duyệt 2026-11-17 | Không có |
| MD-16 | Threat model STRIDE | Mỗi threat có test case hoặc là rủi ro chấp nhận | 29 | 24 | 82,8% | 100%, Test Approach mục 2 | Đạt theo criterion với 3 threat là rủi ro chấp nhận của ADR-002 (MD-16-CI-02, CI-15, CI-25). Không đạt: MD-16-CI-08 (control SEC-05 ngoài phạm vi, SC-11) và MD-16-CI-29 (Không test, product owner quyết định 2026-11-17; thiếu requirement, theo dõi ở TD-06) |
| MD-17 | Checklist-based | Mỗi mục; 6 màn hình kể cả trạng thái lỗi | 33 | 33 | 100% | 6/6 màn hình, Test Approach mục 2 | Không có |
| MD-18 | Equivalence Partitioning | Mỗi partition | 7 | 7 | 100% | 100%, người thiết kế đề xuất, product owner duyệt 2026-11-17 | Không có |

Mỗi dòng chỉ tính trên coverage item của một model. Không cộng các model khác technique thành một tỷ lệ chung. N bằng 0 thì ghi N/A.

## 4. Việc còn lại

| ID | Việc | Liên quan | Owner | Hạn | Nơi theo dõi |
| --- | --- | --- | --- | --- | --- |
| TD-02 | Kiểm `Strict-Transport-Security` (ASVS 3.4.1) khi deploy, cùng với SEC-05 | MD-14-CI-33 | Product owner | Khi deploy lần đầu | [Test Conditions](02-test-conditions.md) mục 4.1 |
| TD-03 | Đưa nút Sign out trên mọi màn hình workspace (ASVS 7.4.4) vào test scope của workspace | MD-14-CI-28; SC-14 | Product owner | Khi lập test scope của workspace | [Test Scopes](../../../README.md) |
| TD-06 | Quyết định một trong hai việc: thêm requirement log bảo mật cho Sign in và Reset password, hoặc ghi việc thiếu log là rủi ro chấp nhận trong ADR-002. Nếu thêm requirement, thêm test condition và test case cho TH-29 | MD-16-CI-29 (TH-29) | Product owner | Trước khi deploy public | [Test Conditions](02-test-conditions.md) mục 4.1 |

## 5. Tiêu chí đạt

| ID | Tiêu chí | Điều kiện đầu vào | Kết quả |
| --- | --- | --- | --- |
| Q1-01 | Version của test basis, Test Plan và snapshot test design được ghi rõ | RC-01 | Đạt |
| Q1-02 | Mỗi test basis item trong phạm vi có một dòng ở mục 2, với trạng thái theo định nghĩa | IN-01, IN-02 | Đạt: 81 requirement Ready và 3 requirement mới từ BD-15, BD-16, BD-17 |
| Q1-03 | Coverage của mỗi model có tử số, mẫu số và target có nguồn; không gộp các model khác technique | RC-03 | Đạt |
| Q1-04 | Mọi model chưa đạt target có gap được liệt kê, kèm mức rủi ro của phần chưa phủ | RC-02, RC-03 | Đạt: MD-14 và MD-16 |
| Q1-05 | Mọi item "Không test" có người quyết định | — | Đạt: MD-14-CI-33, phần còn lại của MD-14-CI-28, MD-16-CI-29 do product owner quyết định ngày 2026-11-17 |
| Q1-06 | Mọi việc còn lại có owner và nơi theo dõi | — | Đạt |

**Người review / ngày:** Product owner, 2026-11-17

## References

1. <a id="ref-1"></a>[Requirement Readiness](../../01-requirement-analysis/output/01-requirement-readiness.md) — commit `6c7bbd7`, 2026-11-17
2. <a id="ref-2"></a>[Test Conditions](02-test-conditions.md) — 2026-11-17
3. <a id="ref-3"></a>[Test Plan](../../02-planning/output/01-test-plan.md) — version 1.1, commit `341584a`, 2026-11-17
