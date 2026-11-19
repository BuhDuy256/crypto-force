# Changelog

Các thay đổi đáng chú ý về sản phẩm, kiến trúc và quy trình phát triển.

## [Unreleased]

### Added

- Monorepo TypeScript strict với React Router, Express, worker pg-boss, shared schemas và strategy/backtest engine; PostgreSQL chạy bằng Docker Compose.
- Landing page có SEO metadata, giao diện responsive và trang 404; design tokens, font self-host, hỗ trợ bàn phím và reduced motion.
- Authentication với Better Auth: email/password, xác minh email, reset password, Google OAuth tùy cấu hình và cookie session; gửi email qua Resend. Giao diện Auth có validation, error summary và kiểm soát đích redirect nội bộ.
- Bộ test Auth gồm component, integration trên PostgreSQL và E2E Playwright. E2E dùng hai môi trường có/không có Google, database riêng và email console, tách khỏi môi trường dev.
- CI chạy kiểm tra chất lượng, build và integration test; E2E chạy cho pull request vào `main`.
- Quality gates trong `pnpm check`: typecheck, lint, kiểm dependency/layer boundaries, chất lượng testware, export thừa, tài liệu và formatting. Testware phải có assertion, kiểm kết quả độc lập với implementation và chỉ mock tại boundary.
- Bộ template và skills cho sáu phase STLC, test strategy và test scope Authentication (TS-001). Vòng 1 chưa đạt exit criteria, còn 19 defect Open; chưa đóng scope, cần sửa lỗi và chạy vòng 2. Chi tiết trong [Test Summary](docs/testing/test-scopes/TS-001-auth/06-report/output/01-test-summary-report.md).
- Nguồn skills chung tại `.agents/skills/`, đồng bộ sang Claude và Codex bằng `pnpm skills:sync`; Graphify hỗ trợ tra cứu quan hệ code.

### Changed

- Tổ chức yêu cầu sản phẩm trong `docs/UCs/`, bắt đầu với Authentication; kiến trúc ghi cơ chế và tham chiếu requirement ID. Tám quality attribute scenario vẫn ở trạng thái Proposed.
- Tập trung conventions cho code, testware và tài liệu tại `docs/conventions/`; `AGENTS.md` hướng dẫn khi nào đọc và dùng từng quy tắc. Thêm skills viết use case, architecture và review thay đổi.
- Chốt baseline bảo mật OWASP ASVS 5.0 L1 cùng một số mục L2 và rủi ro chấp nhận trong [ADR-002](docs/architecture/30-decisions.md). Requirement Auth và gap analysis nằm trong [Authentication](docs/UCs/authentication.md); các gap chưa được coi là đã triển khai.
- Dùng `docs/design/prototype/` làm design reference duy nhất, thay các design board và ảnh mockup cũ; tập trung câu hỏi chưa chốt trong `docs/open-questions.md`.
- Prototype cải thiện accessibility và mobile: quản lý focus trong dialog, skip link, error summary, giữ bản nháp strategy và cảnh báo thay đổi Settings chưa lưu; bổ sung trạng thái lỗi tải, dữ liệu cũ và offline.

### Fixed

- Playwright `--list` không ghi đè kết quả và báo cáo của lần chạy trước.
- Vite tối ưu dependency và biên dịch trước route để tránh reload trang khi cache trống.
