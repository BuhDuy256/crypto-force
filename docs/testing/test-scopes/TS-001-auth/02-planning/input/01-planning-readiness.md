# Test Planning: Readiness

Đọc file này để xác định thông tin cần có trước khi lập test plan Authentication, mức độ tin cậy của từng thông tin, và khi nào đủ điều kiện để bắt đầu.

## 1. Kế hoạch cần lập

| Trường | Nội dung |
| --- | --- |
| Mục tiêu của đợt kiểm thử | Đánh giá luồng Authentication tại code commit `b4ca981` so với 81 requirement Ready của TS-001, và cung cấp bằng chứng để product owner quyết định rủi ro còn lại |
| Phạm vi dự kiến | 81 requirement Ready trong Requirement Readiness [[1]](#ref-1); 3 requirement Ngoài phạm vi (RD-03, SEC-05, SEC-10) không được test |
| Mốc thời gian liên quan | Chưa có mốc release hoặc iteration |
| Người lập / người duyệt | Người lập: agent. Người duyệt: product owner |

## 2. Thông tin cần có

| ID | Thông tin cần có | Dùng cho file | Nguồn | Trạng thái | Căn cứ trạng thái | Ảnh hưởng nếu chưa xác minh |
| --- | --- | --- | --- | --- | --- | --- |
| IN-01 | Các trường ở mục 1 | 01–05 | [[1]](#ref-1) | Đã xác minh | Product owner duyệt mục tiêu và phạm vi ngày 2026-11-17; đợt kiểm thử không có mốc thời gian (AS-02) | — |
| IN-02 | Test basis có version và trạng thái của từng item | 01, 02 | [[1]](#ref-1) | Đã xác minh | Requirement Readiness tại commit `da6b261`: 81 Ready, 3 Ngoài phạm vi, 0 câu hỏi mở. Product owner duyệt ngày 2026-11-17 | — |
| IN-03 | Test policy hoặc test strategy; quy ước testing đã có | 03 | [[2]](#ref-2) [[3]](#ref-3) | Đã xác minh | Test Strategy tại `705a1ad`. `Vitest` và `Playwright` là Confirmed; các công cụ khác và tiêu chí vào/ra là Proposed. Dự án không có test policy riêng | — |
| IN-04 | Stakeholder: người duyệt plan, người duyệt exit criteria, risk owner | 01, 02, 04 | [[1]](#ref-1) [[6]](#ref-6) | Đã xác minh | Product owner xác nhận ngày 2026-11-17 là người duyệt plan, người duyệt exit criteria và risk owner (AS-01) | — |
| IN-05 | Kiến trúc, thành phần và tích hợp với hệ thống ngoài | 02, 03 | [[4]](#ref-4) [[5]](#ref-5) [[7]](#ref-7) | Đã xác minh | Better Auth `^1.7.25` trong `apps/api`, cookie session, PostgreSQL qua Drizzle; web SPA gọi `/api/auth/*` qua proxy của Vite. Hệ thống ngoài: Google OAuth, Resend, API Pwned Passwords của Have I Been Pwned | — |
| IN-06 | Ràng buộc: thời gian, người, ngân sách, công cụ, môi trường, dịch vụ ngoài | 01, 03, 05 | [[2]](#ref-2) [[7]](#ref-7) | Đã xác minh | Công cụ và môi trường local (Docker Compose) có nguồn. Product owner xác nhận ngày 2026-11-17: không có hạn thời gian (AS-02), khoảng 8,3 ± 0,9 giờ tham gia (AS-03), và Google OAuth client đã cấu hình cho localhost. `.env` có `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `BETTER_AUTH_URL=http://localhost:5173`, `RESEND_API_KEY` và `EMAIL_FROM` (domain `resend.dev`) | — |
| IN-07 | Dữ liệu lịch sử: defect trước đây, số liệu effort | 02, 05 | — | Chưa có | Đây là test scope đầu tiên. Không có defect log hay số liệu effort | Khả năng xảy ra ở Risk Register dựa trên khác biệt đã biết giữa requirement và code, không dựa trên defect cũ. Estimate dùng three-point, chưa hiệu chỉnh được. Không có người xử lý; số liệu thực tế của TS-001 dùng cho test scope sau |
| IN-08 | Nguồn rủi ro đã biết | 02 | [[1]](#ref-1) [[6]](#ref-6) | Đã xác minh | Requirement Readiness mục 4: 9 khác biệt giữa requirement và implementation tại `b4ca981`. ADR-002: 5 rủi ro chấp nhận. Review Findings RF-01 đến RF-12 đã có quyết định | — |
| IN-09 | Testware và hạ tầng test hiện có | 03, 05 | `apps/api/test/auth.test.ts`, `apps/web/e2e/`, `.github/workflows/ci.yml` tại `393e2b8` | Đã xác minh | 11 integration test (`pnpm test`), 3 E2E Auth và 11 E2E workspace (`pnpm test:e2e`). CI chỉ chạy `pnpm check` và `pnpm build`, không chạy test. E2E dùng database dev và xóa cả bảng `rate_limit`. Khi `.env` có `RESEND_API_KEY`, E2E gọi Resend thật. Chưa cài `@axe-core/playwright` và công cụ đo code coverage | — |
| IN-10 | Kế hoạch phát triển và release | 05 | — | Đã xác minh | Product owner xác nhận ngày 2026-11-17: không có mốc release hay mốc bàn giao build. Người sửa 9 khác biệt ở IN-08 được theo dõi ở PJ-01, owner là product owner | — |
| IN-11 | Chuẩn bắt buộc, kèm version và mức áp dụng | 02, 03, 04 | [[6]](#ref-6) [[8]](#ref-8) [[9]](#ref-9) [[10]](#ref-10) | Đã xác minh | OWASP ASVS 5.0 L1 cho V6, V7 và 3.3, 3.4, 3.5, 3.7 của V3, cộng các mục L2 đã chọn trong ADR-002. ID và mức đã lấy từ file gốc ở Phase 01. Dự án không bắt buộc WCAG theo version; A11Y-02 dùng ngưỡng của Test Strategy | — |

## 3. Điều kiện bắt đầu

| ID | Điều kiện | Thông tin liên quan | Kết quả | Ảnh hưởng nếu không đạt |
| --- | --- | --- | --- | --- |
| RC-01 | Ranh giới phạm vi đã xác định: các test basis item thuộc phạm vi được liệt kê kèm version | IN-01, IN-02 | Đạt | — |
| RC-02 | Đã xác định người duyệt plan, người duyệt exit criteria và risk owner | IN-04 | Đạt | — |
| RC-03 | Ràng buộc về thời gian, người và môi trường có nguồn | IN-06, IN-10 | Đạt | — |
| RC-04 | Chuẩn bắt buộc đã xác định version và mức áp dụng từ bản gốc | IN-11 | Đạt | — |
| RC-05 | Thông tin kiến trúc đủ để xác định ranh giới giữa các test level và các điểm tích hợp | IN-05 | Đạt | — |

## 4. Kết luận sẵn sàng

**Trạng thái:** Sẵn sàng một phần

Mọi điều kiện ở mục 3 đạt. Một thông tin ở mục 2 là Chưa có: IN-07 (chưa có số liệu lịch sử). Phần kế hoạch bị ảnh hưởng được ghi ở rủi ro PJ-07: khả năng xảy ra ở Risk Register dựa trên bằng chứng trong repo, và estimate chưa hiệu chỉnh được.

**Người quyết định / ngày:** Product owner, 2026-11-17

## References

1. <a id="ref-1"></a>[Requirement Readiness](../../01-requirement-analysis/output/01-requirement-readiness.md) — commit `da6b261`, 2026-11-17
2. <a id="ref-2"></a>[Test Strategy](../../../../test-strategy.md) — commit `705a1ad`, 2026-11-17
3. <a id="ref-3"></a>[Project: Crypto Force](../../../../../../CLAUDE.md) — commit `bf86629`, 2026-11-16
4. <a id="ref-4"></a>[Security](../../../../../architecture/23-security.md) — commit `705a1ad`, 2026-11-17
5. <a id="ref-5"></a>[Project Structure](../../../../../conventions/project-structure.md) — commit `dbbaafe`, 2026-11-16
6. <a id="ref-6"></a>[Architectural Decisions](../../../../../architecture/30-decisions.md) — commit `705a1ad`, 2026-11-17
7. <a id="ref-7"></a>`apps/api/src/configs/auth.ts`, `apps/api/package.json`, `apps/web/playwright.config.ts` — commit `b4ca981`
8. <a id="ref-8"></a>OWASP ASVS 5.0, V6 Authentication. <https://raw.githubusercontent.com/OWASP/ASVS/master/5.0/en/0x15-V6-Authentication.md> — truy cập 2026-11-17
9. <a id="ref-9"></a>OWASP ASVS 5.0, V7 Session Management. <https://raw.githubusercontent.com/OWASP/ASVS/master/5.0/en/0x16-V7-Session-Management.md> — truy cập 2026-11-17
10. <a id="ref-10"></a>OWASP ASVS 5.0, V3 Web Frontend Security. <https://raw.githubusercontent.com/OWASP/ASVS/master/5.0/en/0x12-V3-Web-Frontend-Security.md> — truy cập 2026-11-17
