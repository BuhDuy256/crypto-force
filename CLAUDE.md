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
23. Testing: `Vitest` (unit, integration với PostgreSQL chạy bằng Docker Compose), `Playwright` (E2E); công cụ khác chọn theo [`docs/testing/test-strategy.md`](docs/testing/test-strategy.md)
24. Code Quality: `ESLint` (`typescript-esli nt` strict), `Prettier`

## Commands

Chạy từ thư mục gốc; yêu cầu Node.js `>=22.22` (React Router 8) và `pnpm` 9.

01. `pnpm install`: cài dependencies cho toàn bộ workspaces.
02. `pnpm db:up` / `pnpm db:down`: bật / tắt PostgreSQL qua Docker Compose (cần file `.env`, tạo từ `.env.example`).
03. `pnpm dev`: chạy song song `apps/web` (Vite, cổng 5173, proxy `/api` sang API), `apps/api` (cổng 3000) và `apps/worker`.
04. `pnpm check`: chạy lần lượt `pnpm typecheck`, `pnpm lint`, `pnpm format:check`; bắt buộc pass trước khi commit. `pnpm lint` cũng kiểm tra dependency boundaries, layer rules và anti-pattern bị cấm trong `eslint.config.js`.
05. `pnpm test`: component test của `packages/shared` và `apps/web`, rồi integration test của `apps/api` (Vitest) trên database `<POSTGRES_DB>_test`. Database này được tạo lại từ migration mỗi lần chạy; cần `pnpm db:up`. `pnpm test:e2e`: E2E của `apps/web` (Playwright). Lệnh này tự khởi động hai server E2E theo `apps/web/e2e/environment.ts`: một server có Google (cổng 5173, API 3000), một server không có Google (cổng 5174, API 3001). Mỗi server có database riêng và in email ra console thay vì gửi. Dừng `pnpm dev` trước khi chạy `pnpm test:e2e`, vì server E2E cần các cổng này.
06. `pnpm build`: build mọi app (`tsup` cho API/Worker, `react-router build` cho Web).
07. `pnpm db:generate` / `pnpm db:migrate`: sinh và áp dụng migration Drizzle (`apps/api/drizzle/`).
08. Thêm dependency: `pnpm --filter @crypto-force/<web|api|worker|shared|engine> add <package>`.
09. Knowledge graph của code (Graphify): cài CLI ngoài repo bằng `uv tool install graphifyy`, build lần đầu bằng `graphify extract . --code-only` (chỉ AST cục bộ, không gửi gì cho LLM ngoài). `graphify-out/` đã gitignore. Cách agent dùng graph nằm ở mục `graphify` bên dưới; dùng `graphify affected "<symbol>"` trước khi sửa symbol dùng chung (ví dụ schema trong `packages/shared`) để thấy tác động qua ranh giới workspace.

## Architecture

01. Tuân thủ [Project Structure](docs/development/project-structure.md) về folder organization, layer responsibilities và dependency boundaries.
02. Áp dụng nguyên tắc **Strict Boundaries, Flexible Implementation**: giữ ranh giới trách nhiệm rõ ràng, không tạo folder, layer hoặc abstraction khi chưa có nhu cầu thực tế.
03. Các quyết định về hành vi và thiết kế hệ thống được quản lý trong [Architecture Documentation](docs/architecture/README.md). Không xem cấu trúc tài liệu là cấu trúc bắt buộc của source code.

## Coding Conventions

01. Tuân thủ [Coding Guidelines](docs/development/coding-guidelines.md) về naming, TypeScript, validation, error handling và coding constraints.
02. Ưu tiên conventions của framework/tool đang sử dụng; áp dụng project-specific conventions theo Coding Guidelines khi framework không quy định.
03. Không sao chép hoặc định nghĩa lại các conventions đã được quy định trong Development Guide.

## Documentation

Tuân thủ [ `docs/CONTRIBUTING.md` ](docs/CONTRIBUTING.md) khi tạo hoặc chỉnh sửa tài liệu trong `docs/` .

## Testing & Quality

01. Ưu tiên ràng buộc có thể kiểm tra tự động hơn quy tắc bằng văn bản, theo thứ tự: cấu trúc code và type → lint rule → test → tài liệu. Khi một lỗi của agent lặp lại hoặc có thể lặp lại, đề xuất lint rule, type hoặc test chặn lỗi đó trước khi đề xuất thêm văn bản vào `CLAUDE.md`, `docs/` hoặc `LESSONS.md`.
02. Lint rule mới phải có `message` chỉ ra cách sửa đúng (và link tới tài liệu liên quan nếu có), để agent sửa nguyên nhân gốc thay vì vá tạm.
03. Hook trong `.claude/settings.json` chạy ESLint trên file vừa sửa. Khi hook báo lỗi, sửa theo message của rule; không thêm `eslint-disable`, `@ts-expect-error` hoặc comment giải thích để lách rule.
04. Trước khi báo hoàn thành, chạy `pnpm check`. Với thay đổi ở `apps/web`, chạy app (`pnpm dev`) và kiểm tra hành vi trên trình duyệt bằng Skill `playwright-cli`; báo rõ bước nào đã kiểm tra và bước nào bỏ qua.
05. Skill theo thang ưu tiên trên: `correct` tìm các loại lỗi agent lặp lại và chặn chúng ở mức cao nhất có thể, agent cũng tự dùng khi người dùng chỉ ra lỗi; người dùng gọi `/create-verification-skill` sinh skill `verify-<app>` kèm feature map để agent tự chạy và kiểm chứng app; `/maintain-verification-skill` giữ feature map khớp với app sau mỗi thay đổi.

## Safety Rules

01. Khi instruction của một Skill khác với rules, constraints hoặc quyết định đã chốt của project, áp dụng quy định của project.
02. Chỉ thực hiện side effect (cài dependency, tạo hoặc sửa file, commit, thay đổi ngoài repository) trong phạm vi task người dùng yêu cầu.
03. Không tạo file Markdown (báo cáo, tóm tắt, plan, ghi chú) khi người dùng không yêu cầu. Kết quả công việc báo cáo trong câu trả lời.

## Response & Writing Conventions

01. Sử dụng Vietnamese làm ngôn ngữ chính cho documents và responses. Giữ nguyên thuật ngữ chuyên ngành bằng English khi phổ biến hoặc chính xác hơn bản dịch Vietnamese. Ngoại lệ: mọi file trong `.claude/` viết hoàn toàn bằng English.
02. Ưu tiên cách diễn đạt rõ ràng, tự nhiên và chính xác. Tránh văn phong máy móc, phóng đại hoặc nội dung không mang lại giá trị.
03. Đảm bảo nội dung có đủ context, các ý liên kết logic và thuật ngữ được sử dụng nhất quán. Không tự tạo thông tin hoặc trình bày giả định như sự thật.
04. Điều chỉnh giọng văn, mức độ chi tiết và cách trình bày theo từng task. Không áp dụng một writing style hoặc format cố định cho mọi nội dung.

## Lesson Learned & Pitfalls

01. [`LESSONS.md`](LESSONS.md) là Single Source of Truth cho các Lesson Learned đã được người dùng chấp thuận. Không sao chép nội dung bài học vào `CLAUDE.md`.
02. Trước khi thực hiện task, đọc các Lesson Learned có Scope liên quan đến task trong `LESSONS.md`. Chỉ áp dụng bài học còn hiệu lực, bỏ qua bài học có `Status: Deprecated`.
03. Dùng Skill `correct` ([`.claude/skills/correct/SKILL.md`](.claude/skills/correct/SKILL.md)) khi người dùng chỉ ra lỗi của agent hoặc khi cần thêm, review hay cập nhật Lesson Learned. Lesson Learned chỉ dành cho lỗi không chặn được bằng kiến trúc, type, lint hoặc test.
04. Không tự thêm, sửa hoặc xóa Lesson Learned khi người dùng chưa chấp thuận.

## graphify

01. Khi có `graphify-out/graph.json`, chạy `graphify query "<câu hỏi>"` trước lần grep hoặc đọc source đầu tiên cho mỗi câu hỏi về codebase. Chỉ đọc file thô ở những dòng mà graph hoặc lần đọc trước đã chỉ ra. Ghi quy tắc này vào prompt của mọi subagent khám phá code.
02. Dùng `graphify path "<A>" "<B>"` cho quan hệ giữa hai symbol, `graphify explain "<concept>"` cho một khái niệm cụ thể. Trước khi sửa symbol dùng chung giữa các workspace (ví dụ schema trong `packages/shared`), chạy `graphify affected "<symbol>"` để biết nơi bị ảnh hưởng.
03. Sau khi sửa code, chạy `graphify update .` để cập nhật graph (chỉ AST, không tốn API).
04. Graph chỉ index code (`--code-only`). Không chạy `graphify extract` thiếu `--code-only` hoặc `graphify label`: chúng gửi nội dung `docs/` hoặc tên symbol cho LLM bên ngoài. Khi chạy `graphify cluster-only`, thêm `--no-label`.
05. `graphify-out/` được gitignore, không commit và không cần review. Graph là công cụ điều hướng, không thay thế đọc code: kết quả `INFERRED` phải kiểm tra lại trên source trước khi dựa vào.
