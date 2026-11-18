# Test Implementation: Readiness

Đọc file này để xác định thông tin cần có trước khi tạo testware cho TS-001, mức độ tin cậy của từng thông tin, và khi nào đủ điều kiện để bắt đầu.

## 1. Đợt hiện thực hóa

| Trường | Nội dung |
| --- | --- |
| Mục tiêu | Tạo testware cho 165 test case và 4 exploratory charter của Phase 03, để Phase 05 chạy được Component, Component integration, System và System integration của Authentication |
| Phạm vi | Phạm vi của Test Design [[1]](#ref-1): SC-01 đến SC-09, SC-17. Test level: Component, Component integration, System (tự động); System integration, review và exploratory (thủ công) |
| Đối tượng hoặc interface dự kiến | Code tại `b4ca981`; `git log b4ca981..HEAD -- apps packages` không có commit. API: endpoint của `better-auth@1.7.25` dưới `/api/auth`, `/api/auth-config`. UI: label, role và text của các trang Auth tại `b4ca981` |
| Thời gian dự kiến | Bắt đầu 2026-11-17 (GMT+7); không có hạn kết thúc (Test Plan AS-02) |
| Người thực hiện / người review | Người thực hiện: agent. Người review: product owner |

## 2. Thông tin cần có

| ID | Thông tin cần có | Dùng cho file | Nguồn | Trạng thái | Căn cứ trạng thái | Ảnh hưởng nếu chưa xác minh |
| --- | --- | --- | --- | --- | --- | --- |
| IN-01 | Các trường ở mục 1 | 01–04 | [[1]](#ref-1) [[2]](#ref-2) | Đã xác minh | Phase 03 Đạt, product owner review ngày 2026-11-17 (commit `eb1be83`, `497541d`) | — |
| IN-02 | Test case và charter có version, kèm expected result và nguồn của expected result | 01, 02 | [[3]](#ref-3) | Đã xác minh | 165 test case `v1`, 4 charter; mỗi expected result dẫn tới test basis có commit hoặc quyết định BD ở `c23d848`; product owner review | — |
| IN-03 | Coverage item và traceability từ coverage item tới test case | 01 | [[1]](#ref-1) [[3]](#ref-3) | Đã xác minh | Design Status mục 2, mục 3; Test Cases mục 2.11 | — |
| IN-04 | Độ ưu tiên hoặc mức rủi ro của từng test case | 02 | [[3]](#ref-3) [[4]](#ref-4) | Đã xác minh | Cột Ưu tiên của Test Cases lấy từ mức rủi ro của coverage item (Test Cases Q4-04) | — |
| IN-05 | Yêu cầu test data | 03 | [[5]](#ref-5) | Đã xác minh | DR-01 đến DR-12, product owner review | — |
| IN-06 | Yêu cầu môi trường | 04 | [[5]](#ref-5) | Đã xác minh | ER-01 đến ER-13, product owner review | — |
| IN-07 | Interface và điểm truy cập để test | 02 | Code tại `b4ca981`: `apps/api/src/configs/auth.ts`, `apps/web/app/pages/Auth/`, `apps/web/app/components/SignInGate.tsx`, `apps/web/app/layouts/workspace/` | Đã xác minh | API theo route của Better Auth 1.7.25 (`pnpm-lock.yaml`). UI dùng role, label và text hiển thị; không dùng class CSS. Không có `data-testid`; text hiển thị lấy từ Authentication và trùng với code tại `b4ca981` | — |
| IN-08 | Testware có thể tái sử dụng | 02, 03 | `apps/api/test/auth.test.ts`, `apps/api/test/global-setup.ts`, `apps/api/test/test-database.ts`, `apps/web/e2e/auth.spec.ts`, `apps/web/e2e/support.ts` tại `b4ca981` | Đã xác minh | `global-setup.ts` và `test-database.ts` dùng lại, đã chạy thử (SU-01). `auth.test.ts` và `auth.spec.ts` viết theo spec cũ (ví dụ giới hạn Sign in 5 lần trong 15 phút) nên được thay bằng file `ts001-*` (Design Status TD-05). `support.ts` thuộc test workspace, được sửa để dùng database E2E và không xóa cả bảng `rate_limit` | — |
| IN-09 | Cách tiếp cận manual hoặc automated, framework, quy ước viết và nơi lưu testware | 02 | [[4, §4]](#ref-4) [[4, §8]](#ref-4) | Đã xác minh | Vitest cho Component và Component integration, Playwright cho System; System integration, review và exploratory là thủ công. Code test trong `apps/api/test/`, `apps/web/e2e/`, `packages/shared/test/`, `apps/web/app/**/*.test.ts`; tên test bắt đầu bằng Test case ID | — |
| IN-10 | Ràng buộc khi chạy | 02 | [[4, §6]](#ref-4) [[6]](#ref-6) | Đã xác minh | Test tự động không gọi Google, Resend, Pwned Passwords thật (AS-06). E2E dùng database riêng (PJ-03), `RESEND_API_KEY` trống (PJ-09). Integration test chạy tuần tự trên một database | — |
| IN-11 | Quy ước ghi kết quả và evidence mà testware phải xuất ra | 02 | Đề xuất của agent, theo Test Approach mục 7 [[4, §7]](#ref-4) | Giả định | Chưa có quy ước của dự án. Agent đề xuất: output của Vitest (`--reporter=json` khi cần), Playwright HTML report và `test-results/results.json`, trace và screenshot khi fail, kèm commit và version `better-auth` (EN-03). Product owner chưa duyệt | Ảnh hưởng Q2-04. Testware vẫn chạy được; nếu product owner đổi quy ước ở Phase 05, chỉ cần đổi reporter trong config. Product owner xử lý, trước Phase 05 |
| IN-12 | Người có thẩm quyền trả lời câu hỏi về test design và expected result | 01 | [[2]](#ref-2) | Đã xác minh | Product owner review và duyệt Phase 03 | — |

## 3. Điều kiện bắt đầu

| ID | Điều kiện | Thông tin liên quan | Kết quả | Ảnh hưởng nếu không đạt |
| --- | --- | --- | --- | --- |
| RC-01 | Mỗi test case cần hiện thực hóa có expected result dẫn tới nguồn có version | IN-02 | Đạt | — |
| RC-02 | Test case, coverage item và test basis dùng cùng version | IN-02, IN-03 | Đạt: test case `v1` dựa trên test basis của Design Status; code tại `b4ca981` không đổi từ lúc thiết kế | — |
| RC-03 | Mỗi test case trong phạm vi có yêu cầu data và môi trường, hoặc được ghi là chưa có | IN-02, IN-05, IN-06 | Đạt (Test Cases Q4-06) | — |
| RC-04 | Test sẽ được automated có điểm truy cập đã xác định từ contract hoặc build hiện có | IN-07 | Đạt | — |
| RC-05 | Testware tái sử dụng đã được chạy thử trên version hiện tại, không chỉ giả định tương thích | IN-08 | Đạt: SU-01 dùng `global-setup.ts`, SU-11 dùng server E2E mới | — |
| RC-06 | Quy ước ghi kết quả và evidence đã thống nhất trước khi viết script | IN-11 | Không đạt | Script vẫn viết được vì reporter nằm ở config. Q2-04 không đạt cho tới khi product owner duyệt quy ước (TD-07) |

## 4. Kết luận sẵn sàng

**Trạng thái:** Sẵn sàng một phần

RC-01 đạt cho mọi test case. RC-06 không đạt, nhưng chỉ ảnh hưởng cách lưu evidence, không ảnh hưởng nội dung script.

**Phần được phép làm:** Toàn bộ phạm vi

**Người quyết định / ngày:** Agent đề xuất, 2026-11-17; chờ product owner xác nhận

## References

1. <a id="ref-1"></a>[Test Design Status](../../03-design/output/01-design-status.md) — commit `497541d`, 2026-11-17
2. <a id="ref-2"></a>[TS-001: Authentication](../../README.md) — commit `497541d`, 2026-11-17
3. <a id="ref-3"></a>[Test Cases](../../03-design/output/04-test-cases.md) — commit `497541d`, 2026-11-17
4. <a id="ref-4"></a>[Test Approach](../../02-planning/output/03-test-approach.md) — commit `341584a`, 2026-11-17
5. <a id="ref-5"></a>[Test Data & Environment Requirements](../../03-design/output/05-data-and-environment-requirements.md) — commit `eb1be83`, 2026-11-17
6. <a id="ref-6"></a>[Risk Register](../../02-planning/output/02-risk-register.md) — commit `341584a`, 2026-11-17
