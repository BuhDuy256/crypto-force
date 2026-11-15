# Changelog

Mọi thay đổi đáng chú ý của dự án được ghi lại trong file này.

## [Unreleased]

### Added
- Bảy skill vendor trong `.claude/skills/`: `shadcn`, `react-best-practices`, `web-design-guidelines`, `playwright-cli`, `verification-before-completion`, `writing-plans` và `deliver-acceptance-criteria`. Mỗi skill đi kèm `LICENSE` và `UPSTREAM.md` ghi repository, commit ghim và các sửa đổi so với upstream. Sửa đổi đáng kể: `shadcn` đọc project context bằng lệnh `info --json` tường minh thay vì inject khi load và bỏ `allowed-tools`; `writing-plans` không còn ghi plan vào một đường dẫn mặc định trong repo; `web-design-guidelines` đọc guidelines từ bản local đã ghim.
- `.claude/settings.json` bật hai plugin marketplace (`ui-design-review`, `auth-skills`), ghim theo commit của từng marketplace.
- `apps/web` Foundation: design tokens lấy từ prototype trong `app/app.css`, gồm theme tối mặc định và theme sáng Proposed, cùng token `success`/`warning`/`info`. Font Onest và JetBrains Mono được self-host trong `app/assets/fonts/` (SIL OFL 1.1). Base styles gồm focus ring, link, selection và `prefers-reduced-motion`; thêm skip link "Skip to main content". Token `input` được nâng contrast lên ≥ 3:1. Thêm OQ-076 về cách chọn theme.
- Monorepo `pnpm` gồm `apps/web` (React Router 8 SPA + prerender `/`, Tailwind CSS 4, cấu hình shadcn/ui, TanStack Query), `apps/api` (Express 5, pino, Drizzle + `pg`, `GET /api/health`, error middleware), `apps/worker` (pg-boss 12), `packages/shared` (Zod env schemas) và `packages/engine`. Kèm TypeScript strict dùng chung, ESLint `strictTypeChecked` có rule chặn vi phạm dependency boundaries, Prettier, Docker Compose cho PostgreSQL 17 và `.env.example`. Toàn bộ folder trong cây tham chiếu của `docs/development/project-structure.md` đã được tạo; folder chưa có code được giữ bằng `.gitkeep`.
- `README.md` hướng dẫn cài đặt và chạy local; `AGENTS.md` có mục Commands.
- Khung tài liệu dự án: `README.md`, `AGENTS.md`, `CLAUDE.md` và `LESSONS.md` (Lesson Learned LL-001, LL-002).
- Tài liệu requirements: system description có sơ đồ Mermaid và hình minh họa nến BTCUSDT 15m, khung functional và non-functional requirements.
- Tài liệu architecture (system, market data, strategy, backtesting, evaluation, search, news sentiment, database, API, security, decisions), design mockup và development/CI-CD.
- Các skill trong `.claude/`: `commit`, `commit-push`, `lesson-manager`.
- Design board `docs/design/UI.html` (Crypto Force – Workspace Review) gồm 11 board, tự chứa CSS, JavaScript và font nên mở trực tiếp bằng trình duyệt.
- Tài liệu `docs/requirements/project-brief.md` ghi bài toán gốc, mục tiêu, các module và yêu cầu kiến trúc của Crypto Force; tham chiếu trong `docs/requirements/README.md` và `docs/CONTRIBUTING.md`.
- Thư mục `docs/design/reqs-from-ui/` mô tả hành vi sản phẩm theo UI cho từng nhóm màn hình (workspace, strategy engine, backtest, discovery, realtime, news, settings, authentication, public pages) với nhãn `Confirmed`/`Inferred`/`Proposed` và mục **Điểm UI chưa xác định**.
- `docs/testing/test-strategy.md`: test strategy theo STLC, đi từ 17 rủi ro chất lượng tới test levels, test types và công cụ đề xuất.
- `docs/open-questions.md`: register tập trung 74 câu hỏi mở (OQ-001 – OQ-074), có mức ưu tiên, cột "Chặn" và bảng Resolved & Dropped.
- `docs/CONTRIBUTING.md` thêm quy tắc trích dẫn nguồn kiểu paper (`[n]` + `## References`) và quy tắc câu hỏi mở chỉ ghi trong `open-questions.md`.
- `docs/design/prototype/`: prototype dạng source của 12 board trong `Crypto Force UI.html`. Mỗi màn hình là một file `.dc.html`. App header, styles, font, dc-runtime và React được tách thành file dùng chung. Các màn hình điều hướng được qua link `.dc.html`. Prototype chạy bằng `node docs/design/prototype/serve.mjs`.

### Changed
- `AGENTS.md` bổ sung mục Safety Rules: quy định của project thắng instruction của skill khi xung đột, và side effect chỉ được thực hiện trong phạm vi task người dùng yêu cầu.
- `eslint.config.js` bỏ qua `.claude/skills/shadcn/**` vì đây là code vendor, không phải code của project.
- `.gitignore` bỏ qua thư mục làm việc `.playwright-cli/`.
- Chuyển `docs/design/reqs-from-ui/` vào `docs/design/prototype/docs/requirements/` để tài liệu hành vi sản phẩm nằm cùng prototype, và cập nhật link trong `docs/CONTRIBUTING.md`, `docs/design/README.md`, `docs/design/prototype/README.md`, `docs/open-questions.md`, `docs/testing/test-strategy.md`. `docs/design/prototype/README.md` nêu rõ prototype chỉ thể hiện giao diện và tương tác mô phỏng, hành vi sản phẩm được mô tả trong `docs/requirements/`.
- Skill `commit` và `commit-push` commit và push lên branch hiện tại, kể cả `main`; không tạo, chuyển hoặc gợi ý branch mới trừ khi người dùng yêu cầu.
- `docs/design/prototype/`: sửa các finding của UI/UX review. Focus được giữ trong drawer/dialog/màn chặn và trả về khi đóng (`tools/modal-focus.js`). Bản nháp Strategy Engine và Composite builder được lưu lại (`tools/dc-lifecycle.js` cung cấp `prevState()`). Thêm skip link và error summary; lỗi form gắn với trường. Realtime giữ đủ 1/2/4 chart trên mobile. Trades và Leaderboard chuyển sang card trên điện thoại, cột P/L luôn hiện. Ngày hiển thị dạng `01 May 2025`. Settings theo dõi thay đổi chưa lưu cho cả research defaults. Thêm pattern lỗi tải, dữ liệu cũ và offline trong States. Cập nhật `reqs-from-ui/` (settings, workspace, realtime, backtest, discovery) và `open-questions.md` (OQ-061 resolved, thêm OQ-075).
- Tách authoring conventions khỏi reader-facing content: tạo `docs/CONTRIBUTING.md` làm Single Source of Truth cho quy tắc viết và maintain tài liệu; `docs/README.md` và `docs/architecture/README.md` còn lại phục vụ người đọc.
- `docs/design/README.md` mô tả design board `UI.html`, cách mở file và danh sách 11 board thay cho danh sách ảnh mockup cũ.
- Cập nhật design board `docs/design/UI.html` sang bản task-oriented workspace; tiêu đề trang đổi thành "Crypto Force – Task-Oriented Workspace", danh sách 11 board và kích thước giữ nguyên.

- Cập nhật `docs/design/README.md` định vị `UI.html` là design reference chứ không phải implementation specification: thêm hướng dẫn trích xuất ý đồ thiết kế (information architecture, user flows, visual language), các giả định cần tránh và implementation principles.

- Đổi tên design board thành `docs/design/Crypto Force UI.html` kèm bundle mới dung lượng nhẹ hơn (~6.5 MB → ~2.95 MB); cập nhật link và tên file trong `docs/design/README.md`.

- `docs/design/README.md` ghi rõ nguồn gốc board "Crypto Force UI.html" (export từ Claude Web UI Design) và giải thích vì sao `reqs-from-ui/` là nguồn mô tả hành vi sản phẩm thay vì trích trực tiếp từ file HTML.
- Đổi tên mục **Cần chốt** thành **Điểm UI chưa xác định** trong toàn bộ `docs/design/reqs-from-ui/` và các tham chiếu kèm theo.
- Thêm ảnh PNG từng màn hình vào `docs/design/` (Landing, Sign in, 404, Realtime, Strategy Engine, Strategy library, Discovery, Backtest, News, Settings, Empty & loading states); cập nhật Table of Contents trong `docs/design/README.md`.

- `docs/design/README.md` thêm mục Prototype. Đồng thời sửa danh sách board thành 12 (bổ sung Strategy library; Backtest có kích thước 1600×1500) và bỏ mô tả thanh điều hướng sticky cùng các chế độ Desktop/Tablet/Mobile, vì bản export không có.

- Chốt Tech Stack trong `AGENTS.md`: bỏ các nhãn Proposed/Open, thêm Data tables, Market data, Sentiment, Auth (Better Auth), Email, Logging; PostgreSQL chạy bằng Docker Compose; mục Testing trỏ tới test strategy.

### Removed
- Mục **Điểm UI chưa xác định** trong `docs/design/reqs-from-ui/*.md`; nội dung chuyển vào `docs/open-questions.md`.
- Hai file requirements `docs/requirements/functional-requirements.md` và `docs/requirements/non-functional-requirements.md`; yêu cầu chi tiết quy tụ về `project-brief.md`.
- Năm ảnh mockup JPG trong `docs/design/` (`01-realtime`, `02-strategy-engine`, `03-discovery`, `04-backtest`, `05-new-crawler`), được thay bằng `UI.html`.
- Design board `docs/design/Crypto Force UI.html` và 11 ảnh PNG từng màn hình trong `docs/design/`; `docs/design/prototype/` là design reference duy nhất. Cập nhật `docs/design/README.md` (bảng board, How to Use chuyển sang prototype) và bỏ tham chiếu tới file đã xóa trong `prototype/README.md`.
