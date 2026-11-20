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
04. `pnpm check`: chạy lần lượt `pnpm typecheck`, `pnpm lint`, `pnpm check:rules`, `pnpm check:exports`, `pnpm check:docs`, `pnpm format:check`. Đây là kiểm tra toàn repo dành cho người dùng và CI. Agent chỉ chạy khi người dùng yêu cầu rõ lệnh này. Agent chọn kiểm tra theo phạm vi ở mục Kiểm chứng theo thay đổi bên dưới. `pnpm lint` cũng kiểm tra dependency boundaries, layer rules và anti-pattern bị cấm trong `eslint.config.js`. `pnpm check:docs` kiểm convention của tài liệu trong `docs/` (link, trích dẫn, ID, khung của use case và architecture).
05. `pnpm test`: component test của `packages/shared` và `apps/web`, rồi integration test của `apps/api` (Vitest) trên database `<POSTGRES_DB>_test`. Database này được tạo lại từ migration mỗi lần chạy; cần `pnpm db:up`. `pnpm test:e2e`: E2E của `apps/web` (Playwright). Lệnh này tự khởi động hai server E2E theo `apps/web/e2e/environment.ts`: một server có Google (cổng 5173, API 3000), một server không có Google (cổng 5174, API 3001). Mỗi server có database riêng và in email ra console thay vì gửi. Dừng `pnpm dev` trước khi chạy `pnpm test:e2e`, vì server E2E cần các cổng này.
06. `pnpm build`: build mọi app (`tsup` cho API/Worker, `react-router build` cho Web).
07. `pnpm db:generate` / `pnpm db:migrate`: sinh và áp dụng migration Drizzle (`apps/api/drizzle/`).
08. Thêm dependency: `pnpm --filter @crypto-force/<web|api|worker|shared|engine> add <package>`.
09. Knowledge graph của code (Graphify): cài CLI ngoài repo bằng `uv tool install graphifyy`, build lần đầu bằng `graphify extract . --code-only` (chỉ AST cục bộ, không gửi gì cho LLM ngoài). `graphify-out/` đã gitignore. Cách agent dùng graph nằm ở mục `graphify` bên dưới; dùng `graphify affected "<symbol>"` trước khi sửa symbol dùng chung (ví dụ schema trong `packages/shared`) để thấy tác động qua ranh giới workspace.

## Router

Mỗi loại quy tắc có một nơi sở hữu; mô hình các tầng nằm trong [Conventions](docs/conventions/README.md). Mục này chỉ nói khi nào đọc gì và chạy lệnh nào.

| Khi | Đọc / dùng |
| --- | --- |
| Viết hoặc sửa code production | [Code](docs/conventions/code.md), [Project Structure](docs/conventions/project-structure.md). Ưu tiên convention của framework hoặc tool đang dùng; áp dụng convention của project khi framework không quy định |
| Viết hoặc sửa test | [Testware](docs/conventions/testware.md), [Test Strategy](docs/testing/test-strategy.md) |
| Viết hoặc sửa tài liệu trong `docs/` | [Documentation Conventions](docs/conventions/docs.md) và file convention của loại tài liệu đó |
| Viết hoặc sửa use case (`docs/UCs/`) | Skill `write-use-case`, [Use Case Documentation](docs/conventions/use-cases.md) |
| Viết hoặc sửa tài liệu kiến trúc (`docs/architecture/`) | Skill `write-architecture-doc`, [Architecture Documentation](docs/conventions/architecture.md) |
| Cần biết sản phẩm phải làm gì, hệ thống được dựng thế nào | [Use Cases](docs/UCs/README.md), [Architecture](docs/architecture/README.md) |
| Hook hoặc `pnpm check` báo lỗi | Sửa theo message của rule. Không thêm `eslint-disable`, `@ts-expect-error` hoặc comment để lách rule |
| Người dùng chỉ ra lỗi của agent, hoặc một lỗi có thể lặp lại | Skill `correct`: chặn lỗi ở tầng cao nhất làm được (cấu trúc, type, lint, test) trước khi viết văn bản |
| Trước khi báo hoàn thành | Chọn kiểm tra theo mục Kiểm chứng theo thay đổi. Thay đổi code, test, hoặc tài liệu trong `docs/UCs`, `docs/architecture`, `docs/conventions`: skill `review-change`. Thay đổi hành vi giao diện ở `apps/web`: kiểm hành vi trên trình duyệt bằng skill `playwright-cli`. Báo rõ phạm vi đã kiểm và phần chưa kiểm |
| Kiểm chứng app end-to-end | Người dùng gọi `/create-verification-skill` để sinh skill `verify-<app>`; `/maintain-verification-skill` giữ feature map khớp với app |

## Kiểm chứng theo thay đổi

Agent chọn tập kiểm tra nhỏ nhất đủ kiểm chứng thay đổi và các phần bị ảnh hưởng. Không tự chạy `pnpm check`, ghép lại toàn bộ lệnh thành phần để thay thế, hoặc yêu cầu người dùng chạy lệnh này sau mỗi task. Người dùng chủ động chạy kiểm tra toàn repo. Yêu cầu commit không tự cho phép agent chạy `pnpm check`.

| Thay đổi | Kiểm tra phù hợp |
| --- | --- |
| Markdown, hướng dẫn hoặc skill | `pnpm exec prettier --check <các-file-đã-sửa>`. Với tài liệu trong `docs/`, thêm `pnpm check:docs`. Không chạy typecheck hoặc test app chỉ vì sửa văn bản |
| Code trong một workspace | `pnpm exec eslint <các-file-đã-sửa>`, `pnpm --filter @crypto-force/<workspace> typecheck` và test liên quan tới hành vi đã thay đổi |
| Contract hoặc code dùng chung | Kiểm tra package sở hữu và các workspace tiêu thụ bị ảnh hưởng. Dùng Graphify để xác định tác động theo quy tắc bên dưới |
| Rule ESLint hoặc script kiểm tra | Chạy test của rule hoặc script đã sửa. Kiểm tra trường hợp hợp lệ và trường hợp phải bị từ chối |
| Export hoặc dependency boundary | Chạy `pnpm check:exports` khi thay đổi ảnh hưởng public exports. Chạy ESLint cho các file chịu tác động |
| Hành vi giao diện | Chạy test liên quan và kiểm tra flow bị ảnh hưởng trên trình duyệt. Chỉ khởi động các dịch vụ cần cho flow đó |
| Build hoặc cấu hình runtime | Build workspace bị ảnh hưởng và kiểm tra hành vi liên quan |
| Skill trong `.agents/skills/` | Chạy `pnpm skills:sync` và `pnpm skills:check`, cùng kiểm tra văn bản đã sửa |

Các lệnh kiểm tra chuyên biệt có thể quét toàn repo khi chưa hỗ trợ lọc file, chẳng hạn `pnpm check:docs`. Không suy diễn kết quả của một kiểm tra thành kết quả của toàn bộ repo. Chỉ mở rộng hoặc chạy lại kiểm tra khi có thay đổi mới, lỗi hoặc tác động chưa được kiểm chứng.

## Safety Rules

01. Khi instruction của một Skill khác với rules, constraints hoặc quyết định đã chốt của project, áp dụng quy định của project.
02. Chỉ thực hiện side effect (cài dependency, tạo hoặc sửa file, commit, thay đổi ngoài repository) trong phạm vi task người dùng yêu cầu.
03. Không tạo file Markdown (báo cáo, tóm tắt, plan, ghi chú) khi người dùng không yêu cầu. Kết quả công việc báo cáo trong câu trả lời.

## Responses

Trả lời người dùng bằng tiếng Việt; giữ thuật ngữ chuyên ngành bằng tiếng Anh khi phổ biến hoặc chính xác hơn bản dịch. Ngôn ngữ và văn phong của tài liệu nằm trong [Documentation Conventions](docs/conventions/docs.md#ngôn-ngữ-và-văn-phong).

## Lesson Learned & Pitfalls

01. [`LESSONS.md`](LESSONS.md) là Single Source of Truth cho các Lesson Learned đã được người dùng chấp thuận. Không sao chép nội dung bài học vào `AGENTS.md`.
02. Trước khi thực hiện task, đọc các Lesson Learned có Scope liên quan đến task trong `LESSONS.md`. Chỉ áp dụng bài học còn hiệu lực, bỏ qua bài học có `Status: Deprecated`.
03. Dùng Skill `correct` ([`.agents/skills/correct/SKILL.md`](.agents/skills/correct/SKILL.md)) khi cần thêm, review hay cập nhật Lesson Learned. Lesson Learned chỉ dành cho lỗi trong quá trình làm việc mà nhìn file kết quả không thấy được.
04. Không tự thêm, sửa hoặc xóa Lesson Learned khi người dùng chưa chấp thuận.

## graphify

01. Khi có `graphify-out/graph.json`, chạy `graphify query "<câu hỏi>"` trước lần grep hoặc đọc source đầu tiên cho mỗi câu hỏi về codebase. Chỉ đọc file thô ở những dòng mà graph hoặc lần đọc trước đã chỉ ra. Ghi quy tắc này vào prompt của mọi subagent khám phá code.
02. Dùng `graphify path "<A>" "<B>"` cho quan hệ giữa hai symbol, `graphify explain "<concept>"` cho một khái niệm cụ thể. Trước khi sửa symbol dùng chung giữa các workspace (ví dụ schema trong `packages/shared`), chạy `graphify affected "<symbol>"` để biết nơi bị ảnh hưởng.
03. Sau khi sửa code, chạy `graphify update .` để cập nhật graph (chỉ AST, không tốn API).
04. Graph chỉ index code (`--code-only`). Không chạy `graphify extract` thiếu `--code-only` hoặc `graphify label`: chúng gửi nội dung `docs/` hoặc tên symbol cho LLM bên ngoài. Khi chạy `graphify cluster-only`, thêm `--no-label`.
05. `graphify-out/` được gitignore, không commit và không cần review. Graph là công cụ điều hướng, không thay thế đọc code: kết quả `INFERRED` phải kiểm tra lại trên source trước khi dựa vào.

## Skills

01. Skills được tạo và chỉnh sửa tại `.agents/skills/`. Chạy `pnpm skills:sync` để đồng bộ một chiều sang cả `.claude/skills/` và `.codex/skills/`; chạy `pnpm skills:check` để kiểm tra chênh lệch.
02. Claude hooks trong `.claude/settings.json` chỉ chạy với Claude Code. Codex dùng `.codex/hooks.json` để kiểm tra file sau khi sửa. Cả hai dùng chung bộ kiểm ESLint và docs. Cả hai chọn kiểm chứng theo mục Kiểm chứng theo thay đổi, không tự chạy `pnpm check` trước khi báo hoàn thành.
