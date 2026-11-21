# Changelog

Các thay đổi đáng chú ý về sản phẩm, kiến trúc và quy trình phát triển.

## [Unreleased]

- Test trước build REST Market Data cho Task 4: shared contract, provider/service, adapter/cache, HTTP/session và E2E qua API thật với upstream giả lập. Shared/HTTP đang red. Module production còn thiếu chặn suite provider và startup E2E. Chưa hoàn tất TDD, mutation hoặc baseline.

### Changed

- Chốt các quyết định còn Proposed của Bước 07 Market Data. TTL cache tính từ lúc provider trả kết quả thành công và hết hạn khi đủ 5 giây. API kiểm phiên trước query. Ba pair có tick size 0.01. Mọi giá hiển thị, gồm OHLC và MA, làm tròn half-up và luôn đủ 2 chữ số. Provider trả vượt limit và payload không parse được trả 502. Workload baseline, công cụ `k6` và ngưỡng QA-10/QA-11 kèm điều kiện kết luận đã được duyệt. Test mới và expected giá đã sửa đang red vì chưa có code production.

### Added

- Kế hoạch Bước 08 Market Data: build REST tải lịch sử theo năm lát red → green, đo baseline, chốt tài liệu, rồi build REST polling. Bốn quyết định vận hành còn chờ duyệt: commit theo Task, cài `k6`, smoke Binance thật và lưu evidence. Product owner quyết định không dùng screen reader ở Bước 08. Accessibility chỉ kiểm ở mức khai báo bằng Playwright, có ghi các điểm lệch Playwright không phát hiện được và cách giảm. Chưa triển khai code.
- Protocol baseline REST Market Data cho Task 3 của Bước 07: định nghĩa phép đo, cache rỗng/hit/single-flight, workload đề xuất, replay/smoke và evidence chạy lại. Workload và ngưỡng hiệu năng còn Proposed. Chưa đo baseline hoặc xác nhận capacity.
- Thiết kế kiểm chứng REST Market Data cho Task 2 của Bước 07: ma trận requirement/kịch bản/evidence, partitions và biên, fixture với expected literal, cache/cooldown, E2E/accessibility, log và mutation dự kiến. Kết quả test trước build ghi riêng ở Task 4.
- Test basis REST Market Data, đối chiếu sáu SC WCAG, sáu interface kiểm thử được product owner duyệt và khảo sát harness từ source cho Task 1 của Bước 07. Chưa đo baseline.
- Frontend Realtime dùng HTTP mock: pair chung, 1/2/4 chart với timeframe riêng, nến, volume, MA(20), giá/thay đổi 24h và sidebar. Các chart có trạng thái đang tải, rỗng, lỗi và thử lại riêng.
- Schema HTTP nháp cho Market Data, fixtures tất định và MSW handlers. Browser suite riêng kiểm UI mock và worker thật, gồm responsive, bàn phím, accessibility và dữ liệu cũ đến sau.
- Bản nháp use case Market Data, câu hỏi mở, kế hoạch và bằng chứng hoàn thành Bước 2. API contract production chưa được chốt.
- Requirements Market Data cho vòng REST tải lịch sử: rule đã chốt cho nến đang mở, MA, volume, sidebar, timeframe, lựa chọn mặc định, 500 nến mỗi chart, exception flow và accessibility, kèm gap analysis với hai baseline độc lập. Ngưỡng hiệu năng REST còn Proposed.
- Test scope TS-002 Market Data kiểm thử theo increment REST, REST polling, WebSocket, không dùng template STLC; mỗi increment có file phân tích requirements.
- Thiết kế Market Data cho vòng REST: thành phần Web, API, Market Data Service và provider, luồng tải lịch sử, phân loại lỗi và log để phân biệt lỗi upstream, backend, client. ADR-003 đặt adapter dữ liệu thị trường trong layer `providers/` của API; ADR-004 để Web tính MA từ nến API trả về. Chưa triển khai code.
- Contract nến và API REST cho Market Data: kiểu nến domain có nến đang mở, nến khởi động MA và thời điểm dữ liệu, quy tắc chuẩn hóa từ Binance, hai endpoint yêu cầu phiên và năm mã lỗi. ADR-005 đặt số chữ số thập phân của pair là hằng số trong `packages/shared`. Chưa triển khai code.
- Thiết kế cache Market Data cho vòng REST: không lưu nến vào PostgreSQL, cache 5 giây trong process API qua decorator của provider, gộp request trùng, không cache lỗi, dừng gọi Binance theo `Retry-After` khi bị giới hạn. ADR-006 ghi trade-off và điều kiện xét lại. Chưa triển khai code.
- Trạng thái `Dropped` cho rule bị bỏ trong `docs/UCs/`, được `check:docs` chấp nhận.
- Monorepo TypeScript strict với React Router, Express, worker pg-boss, shared schemas và strategy/backtest engine; PostgreSQL chạy bằng Docker Compose.
- Landing page có SEO metadata, giao diện responsive và trang 404; design tokens, font self-host, hỗ trợ bàn phím và reduced motion.
- Authentication với Better Auth: email/password, xác minh email, reset password, Google OAuth tùy cấu hình và cookie session; gửi email qua Resend. Giao diện Auth có validation, error summary và kiểm soát đích redirect nội bộ.
- Bộ test Auth gồm component, integration trên PostgreSQL và E2E Playwright. E2E dùng hai môi trường có/không có Google, database riêng và email console, tách khỏi môi trường dev.
- CI chạy kiểm tra chất lượng, build và integration test; E2E chạy cho pull request vào `main`.
- Quality gates trong `pnpm check`: typecheck, lint, kiểm dependency/layer boundaries, chất lượng testware, export thừa, tài liệu và formatting. Testware phải có assertion, kiểm kết quả độc lập với implementation và chỉ mock tại boundary.
- Bộ template và skills cho sáu phase STLC, test strategy và test scope Authentication (TS-001). Vòng 1 chưa đạt exit criteria, còn 19 defect Open; chưa đóng scope, cần sửa lỗi và chạy vòng 2. Chi tiết trong [Test Summary](docs/testing/test-scopes/TS-001-auth/06-report/output/01-test-summary-report.md).
- Nguồn skills chung tại `.agents/skills/`, đồng bộ sang Claude và Codex bằng `pnpm skills:sync`; Graphify hỗ trợ tra cứu quan hệ code.
- Thêm skills Better Auth (hướng dẫn chung, bảo mật, tạo auth, email/password, organization, 2FA) và skill review UI; bỏ skill `diagnosing-bugs`.

### Changed

- Bàn giao Bước 08 cho REST Market Data: sáu interface đã duyệt, thứ tự red → green, fixture/oracle, evidence còn thiếu, gate mutation/fake và điều kiện chạy baseline. Tài liệu bàn giao đã được review độc lập. Trạng thái hoàn thành Bước 07 có hiệu lực khi commit riêng Task 5 thành công. Workload, ngưỡng và quyết định chưa duyệt giữ Proposed. Chưa hoàn tất TDD hoặc đo baseline.
- Kế hoạch Market Data viết test tự động sau khi chốt cách kiểm chứng và trước khi build từng increment.
- Tổ chức yêu cầu sản phẩm trong `docs/UCs/`, bắt đầu với Authentication; kiến trúc ghi cơ chế và tham chiếu requirement ID. Tám quality attribute scenario chuyển sang `Confirmed` theo ủy quyền của product owner ngày 2026-11-20; cột Nguồn ghi lý do từng số đo để product owner có thể phủ quyết.
- Tập trung conventions cho code, testware và tài liệu tại `docs/conventions/`; `AGENTS.md` hướng dẫn khi nào đọc và dùng từng quy tắc. Thêm skills viết use case, architecture và review thay đổi.
- Chốt baseline bảo mật OWASP ASVS 5.0 L1 cùng một số mục L2 và rủi ro chấp nhận trong [ADR-002](docs/architecture/30-decisions.md). Requirement Auth và gap analysis nằm trong [Authentication](docs/UCs/authentication.md); các gap chưa được coi là đã triển khai.
- Dùng `docs/design/prototype/` làm design reference duy nhất, thay các design board và ảnh mockup cũ; tập trung câu hỏi chưa chốt trong `docs/open-questions.md`.
- Prototype cải thiện accessibility và mobile: quản lý focus trong dialog, skip link, error summary, giữ bản nháp strategy và cảnh báo thay đổi Settings chưa lưu; bổ sung trạng thái lỗi tải, dữ liệu cũ và offline.
- Codex chạy hook `PostToolUse` trong `.codex/hooks.json`, gọi `scripts/lint-codex-edits.mjs` để dùng chung bộ kiểm ESLint và tài liệu với Claude khi sửa file.
- Viết lại tài liệu kiến trúc toàn hệ thống theo câu hỏi của người đọc: `00-system.md` và `20`–`23` nêu thành phần, vòng đời trạng thái, dữ liệu, contract và bảo mật đã triển khai; `docs/conventions/architecture.md` cho phép chọn và sắp xếp section theo chủ đề thay vì khung cố định.
- Comment trong code trỏ tới requirement ID của [Authentication](docs/UCs/authentication.md) để truy vết từ code về yêu cầu. `pnpm check:docs` kiểm ID đã cấp không biến mất và comment không trích ID không tồn tại; CI checkout hai commit để có baseline so sánh.
- `AGENTS.md` thêm mục `Kiểm chứng theo thay đổi`: agent chọn tập kiểm tra nhỏ nhất đủ kiểm chứng thay đổi và các phần bị ảnh hưởng, chỉ chạy `pnpm check` khi người dùng yêu cầu rõ lệnh này. `pnpm check` giữ vai trò kiểm tra toàn repo cho người dùng và CI; skills `correct` và `review-change` theo cùng quy tắc.

### Fixed

- Continue with Google luôn hiện màn chọn tài khoản: URL nhà cung cấp thêm `prompt=select_account`, nên Sign out chỉ kết thúc phiên Crypto Force và lần đăng nhập sau không ngầm dùng lại tài khoản Google đang mở.
- Playwright `--list` không ghi đè kết quả và báo cáo của lần chạy trước.
- Vite tối ưu dependency và biên dịch trước route để tránh reload trang khi cache trống.
