# Changelog

Mọi thay đổi đáng chú ý của dự án được ghi lại trong file này.

## [Unreleased]

### Added
- Khung tài liệu dự án: `README.md`, `AGENTS.md`, `CLAUDE.md` và `LESSONS.md` (Lesson Learned LL-001, LL-002).
- Tài liệu requirements: system description có sơ đồ Mermaid và hình minh họa nến BTCUSDT 15m, khung functional và non-functional requirements.
- Tài liệu architecture (system, market data, strategy, backtesting, evaluation, search, news sentiment, database, API, security, decisions), design mockup và development/CI-CD.
- Các skill trong `.claude/`: `commit`, `commit-push`, `lesson-manager`.
- Design board `docs/design/UI.html` (Crypto Force – Workspace Review) gồm 11 board, tự chứa CSS, JavaScript và font nên mở trực tiếp bằng trình duyệt.
- Tài liệu `docs/requirements/project-brief.md` ghi bài toán gốc, mục tiêu, các module và yêu cầu kiến trúc của Crypto Force; tham chiếu trong `docs/requirements/README.md` và `docs/CONTRIBUTING.md`.

### Changed
- Tách authoring conventions khỏi reader-facing content: tạo `docs/CONTRIBUTING.md` làm Single Source of Truth cho quy tắc viết và maintain tài liệu; `docs/README.md` và `docs/architecture/README.md` còn lại phục vụ người đọc.
- `docs/design/README.md` mô tả design board `UI.html`, cách mở file và danh sách 11 board thay cho danh sách ảnh mockup cũ.
- Cập nhật design board `docs/design/UI.html` sang bản task-oriented workspace; tiêu đề trang đổi thành "Crypto Force – Task-Oriented Workspace", danh sách 11 board và kích thước giữ nguyên.

- Cập nhật `docs/design/README.md` định vị `UI.html` là design reference chứ không phải implementation specification: thêm hướng dẫn trích xuất ý đồ thiết kế (information architecture, user flows, visual language), các giả định cần tránh và implementation principles.

- Đổi tên design board thành `docs/design/Crypto Force UI.html` kèm bundle mới dung lượng nhẹ hơn (~6.5 MB → ~2.95 MB); cập nhật link và tên file trong `docs/design/README.md`.

### Removed
- Hai file requirements `docs/requirements/functional-requirements.md` và `docs/requirements/non-functional-requirements.md`; yêu cầu chi tiết quy tụ về `project-brief.md`.
- Năm ảnh mockup JPG trong `docs/design/` (`01-realtime`, `02-strategy-engine`, `03-discovery`, `04-backtest`, `05-new-crawler`), được thay bằng `UI.html`.
