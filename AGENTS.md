# Project: Crypto Force

## Tech Stack

01. Language: `TypeScript` (strict)
02. Runtime: `Node.js` (LTS, ESM)
03. Package manager: `pnpm` (workspaces: `apps/web`,         `apps/api`,         `apps/worker`,         `packages/shared`,         `packages/engine`)
04. Frontend: `React`,  `React Router` (framework mode, dùng `Vite`; SPA cho app, prerender các route landing để phục vụ SEO)
05. Server state (frontend): `TanStack Query`
06. Forms: `React Hook Form` + `@hookform/resolvers` + `Zod`
07. Styling & UI: `Tailwind CSS`, `shadcn/ui`, `Lucide`
08. Data tables: `TanStack Table` cho sorting và pagination
09. Charts: `Lightweight Charts` (TradingView, Apache-2.0, bắt buộc hiển thị attribution) cho biểu đồ tài chính
10. Backend: `Express`
11. Realtime transport: `WebSocket` (`ws`), dùng cho dữ liệu thị trường, tiến độ Search/backtest và sự kiện Leaderboard. Client subscribe dữ liệu thị trường theo pair + timeframe.
12. Market data: Binance REST + WebSocket, chỉ được gọi qua `MarketDataProvider` adapter trong backend; frontend không gọi Binance trực tiếp.
13. Database: `PostgreSQL`, chạy bằng `Docker Compose` (local và VPS)
14. ORM / migrations: `Drizzle ORM` + `drizzle-kit`
15. Background jobs: `pg-boss` trên PostgreSQL, chạy trong worker process riêng (`apps/worker`) cho backtest, Strategy Search, crawl tin và sentiment. Chỉ chuyển sang `BullMQ` + `Redis` khi đo được pg-boss là bottleneck.
16. Strategy & backtest engine: package TypeScript thuần trong `packages/engine` (indicator, strategy, combination, backtest, evaluation; không I/O, tất định, chạy được trong `worker_threads`)
17. Numeric precision: engine tính bằng `number` (float64) để giữ tốc độ khi Search; giá, phí và P/L được lưu trong DB bằng kiểu `NUMERIC` và chỉ làm tròn khi hiển thị. So sánh kết quả trong test dùng sai số cho phép (tolerance).
18. Sentiment analysis: gọi LLM API bên ngoài qua interface `SentimentAnalyzer`. Lưu kết quả kèm tên model và phiên bản prompt để truy vết; tái sử dụng kết quả đã lưu khi cần chạy lại với cùng dữ liệu sentiment.
19. Auth: `Better Auth` (cookie session, Google OAuth, email/password, reset password), dữ liệu lưu trong PostgreSQL qua Drizzle adapter
20. Email: `Resend`
21. Validation: `Zod` (schema dùng chung trong `packages/shared`: strategy definition, cấu hình backtest, snapshot của run, giới hạn Search, biến môi trường)
22. Logging: `pino`
23. Testing: công cụ chọn theo [`docs/testing/test-strategy.md`](docs/testing/test-strategy.md) — Open ([OQ-069](docs/open-questions.md#oq-069))
24. Code Quality: `ESLint` (`typescript-eslint` strict), `Prettier`

## Commands

## Architecture

## Coding Conventions

## Documentation

Tuân thủ [ `docs/CONTRIBUTING.md` ](docs/CONTRIBUTING.md) khi tạo hoặc chỉnh sửa tài liệu trong `docs/` .

## Testing & Quality

## Safety Rules

## Response & Writing Conventions

01. Sử dụng Vietnamese làm ngôn ngữ chính cho documents và responses. Giữ nguyên thuật ngữ chuyên ngành bằng English khi phổ biến hoặc chính xác hơn bản dịch Vietnamese. Ngoại lệ: mọi file trong `.claude/` viết hoàn toàn bằng English.
02. Ưu tiên cách diễn đạt rõ ràng, tự nhiên và chính xác. Tránh văn phong máy móc, phóng đại hoặc nội dung không mang lại giá trị.
03. Đảm bảo nội dung có đủ context, các ý liên kết logic và thuật ngữ được sử dụng nhất quán. Không tự tạo thông tin hoặc trình bày giả định như sự thật.
04. Điều chỉnh giọng văn, mức độ chi tiết và cách trình bày theo từng task. Không áp dụng một writing style hoặc format cố định cho mọi nội dung.

## Lesson Learned & Pitfalls

01. [`LESSONS.md`](LESSONS.md) là Single Source of Truth cho các Lesson Learned đã được người dùng chấp thuận. Không sao chép nội dung bài học vào `AGENTS.md`.
02. Trước khi thực hiện task, đọc các Lesson Learned có Scope liên quan đến task trong `LESSONS.md`. Chỉ áp dụng bài học còn hiệu lực, bỏ qua bài học có `Status: Deprecated`.
03. Dùng Skill `lesson-manager` ([`.claude/skills/lesson-manager/SKILL.md`](.claude/skills/lesson-manager/SKILL.md)) khi cần Capture, Review hoặc Update Lesson Learned.
04. Không tự thêm, sửa hoặc xóa Lesson Learned khi người dùng chưa chấp thuận.
