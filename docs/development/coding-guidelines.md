# Coding Guidelines

Đọc file này để biết các quy tắc viết code, phân chia trách nhiệm và xử lý dữ liệu khi implement Crypto Force.

## Phạm vi và ưu tiên

1. Tuân thủ Tech Stack trong `CLAUDE.md` [[1, Tech Stack]](#ref-1), dependency boundaries trong `project-structure.md` [[2]](#ref-2) và Test Strategy trong `docs/testing/test-strategy.md` [[3]](#ref-3).
2. Strict boundaries, flexible implementation: bảo vệ trách nhiệm từng layer nhưng không tạo class, interface, mapper, hook hay folder chỉ để đủ template.
3. Không đưa workflow thực thi Agent vào file này. Ví dụ code chỉ minh họa conventions, không phải implementation bắt buộc.
4. Quy tắc nào kiểm tra được bằng máy thì enforce trong `eslint.config.js` hoặc TypeScript; file này chỉ giải thích lý do và cách sửa. Các quy tắc đang được lint enforce được đánh dấu *(lint)*.

## Naming conventions

Các quy tắc sau kết hợp framework conventions với lựa chọn riêng của Crypto Force; role suffix không phải yêu cầu của TypeScript hay Express.

| Đối tượng | Convention | Ví dụ |
| --- | --- | --- |
| Backend Route / Controller / Service / Repository / Mapper | `kebab-case` + role suffix | `backtest.route.ts`, `backtest.service.ts` |
| Web API access | Tên resource bằng `kebab-case.ts`, không dùng `.service.ts` | `api/backtest.ts`, `api/client.ts` |
| Worker job handler | `kebab-case.handler.ts` | `backtest.handler.ts` |
| React component và Page | `PascalCase.tsx` nếu chứa JSX | `BacktestPage.tsx`, `ResultChart.tsx` |
| React custom hook | `useXxx.ts` hoặc `useXxx.tsx` nếu có JSX | `useBacktest.ts` |
| React Router route module | Theo `app/routes.ts` và quy ước của React Router | `routes/backtest.tsx` |
| shadcn/ui primitive file | Giữ naming do CLI/config sinh ra, thường `kebab-case.tsx` | `components/ui/button.tsx` |
| Shared Zod schema file | `kebab-case.schema.ts` | `backtest.schema.ts` |
| Engine pure function file | `kebab-case.ts`, tên theo operation/domain | `simulate-trades.ts` |
| Test file | `.test.ts` hoặc `.test.tsx` theo nội dung | `backtest.test.ts` |
| Function, variable, property, schema symbol | `camelCase` | `createBacktest`, `runId`, `createBacktestSchema` |
| Class, component, type, interface | `PascalCase` | `BacktestResult`, `MarketDataProvider` |
| Constants | `camelCase` mặc định; `UPPER_SNAKE_CASE` cho giới hạn/hằng số bất biến có ý nghĩa đặc biệt | `defaultOptions`, `MAX_CANDIDATES` |
| PostgreSQL tables / columns | `snake_case` | `backtest_runs`, `created_at` |
| TypeScript / API JSON fields | `camelCase` | `createdAt`, `runId` |

- Không thêm prefix `I` cho interface; dùng `MarketDataProvider` thay vì `IMarketDataProvider`.
- Không áp dụng role suffix cho engine pure functions, React components hoặc HTTP API access ở Web.
- `.ts` cho code không chứa JSX, `.tsx` cho code có JSX, `.d.ts` cho ambient declarations. Ưu tiên tên và cấu trúc framework/tool tạo ra đối với framework-owned files.
- Không đổi tên các file generated của shadcn/ui trái với cấu hình CLI.
- Route config tường minh tại `app/routes.ts`; route module filename tuân theo route config, không ép suffix `.route.tsx`.

## TypeScript

- TypeScript `strict`; không sử dụng `any` để né type checking. Với dữ liệu chưa tin cậy, dùng `unknown` rồi narrow/parse.
- Ưu tiên type inference khi rõ ràng; khai báo explicit types tại public API, boundaries và những chỗ inference khó hiểu.
- Dùng `import type` cho type-only imports; không import private internals xuyên package.
- Không dùng non-null assertion hoặc type assertion để thay thế validation; assertion chỉ khi có invariant đã được bảo đảm.
- Function nên có trách nhiệm rõ ràng; tách phần thuần tính toán khỏi side effects khi có thể.

## Comments

- Code phải tự giải thích qua tên, type và cấu trúc. Comment chỉ dùng cho lý do (*why*) mà code không thể diễn đạt, ví dụ ràng buộc từ bên ngoài như giới hạn API của Binance.
- Không dùng comment để giải thích hoặc hợp thức hóa một workaround. Sửa nguyên nhân gốc; nếu chưa sửa được thì báo lại trong task thay vì để lại comment.
- Không để `TODO`, `FIXME`, `HACK`, `XXX` trong code *(lint)*. Việc còn dang dở ghi vào task tracker hoặc [`open-questions.md`](../open-questions.md).
- Không dùng `eslint-disable` để lách rule; directive không còn tác dụng bị báo lỗi *(lint)*. Nếu một rule sai trong một ngữ cảnh cụ thể, sửa phạm vi của rule trong `eslint.config.js`.

## Contracts, validation và data representation

- Validate untrusted input ở boundaries: HTTP request, WebSocket event, job payload, external provider response và environment variables bằng Zod khi phù hợp [[1, Tech Stack]](#ref-1).
- REST/WebSocket/job contracts dùng chung thuộc `packages/shared`; không định nghĩa các bản schema độc lập giữa Web, API và Worker [[3, Contract]](#ref-3).
- API JSON và TypeScript properties dùng `camelCase`; PostgreSQL table/column identifiers dùng `snake_case`. Drizzle map hai representation này, không bắt buộc Mapper chỉ để đổi case.
- Chỉ tạo Mapper riêng khi có transformation đáng kể (ví dụ flatten/nesting, serialize timestamp, format domain output). Mapper phải thuần, không I/O và không business logic.
- Không trả raw database entities nếu làm lộ trường nội bộ hoặc không khớp API contract. Không coi TypeScript cast là runtime validation.

## Frontend: React, Router và server state

- UI components tập trung render và user interactions; không gọi HTTP client hoặc Binance trực tiếp. File trong `components/` và `pages/` không import `api/` *(lint)*.
- `useEffect` và `useLayoutEffect` chỉ được dùng trong `app/hooks/` *(lint)*. Effect là nguồn lỗi phổ biến (dependency sai, race condition, render thừa) và hầu hết trường hợp có cách tốt hơn: giá trị suy ra từ props/state thì tính trong lúc render; server state dùng TanStack Query hoặc route loader; phản hồi hành động người dùng đặt trong event handler. Trường hợp cần đồng bộ với thư viện imperative (ví dụ Lightweight Charts) hoặc subscription, viết một custom hook có tên rõ ràng trong `app/hooks/`.
- HTTP API access tập trung trong `app/api/` với resource modules như `backtest.ts`; custom hooks hoặc React Router data APIs điều phối data loading. Không bắt buộc tạo custom hook chỉ để wrap một lệnh đơn giản.
- TanStack Query quản lý server state, cache, invalidation và mutation khi phù hợp; không tự xây cache server state riêng [[1, Tech Stack]](#ref-1).
- React Hook Form + Zod resolver cho forms; tránh định nghĩa validation trùng giữa form và shared contract.
- Local UI state dùng React state; Context chỉ cho state thực sự cần chia sẻ rộng, không thay thế TanStack Query.
- Sử dụng Tailwind CSS và shadcn/ui; ưu tiên design tokens và reusable primitives. Không hardcode styling lặp lại khi đã có component dùng chung.
- Đặt UI primitives (chủ yếu shadcn/ui) tại `components/ui/`; component thực sự dùng chung giữa các page tại `components/`; component đặc thù của một page tại `pages/<Page>/components/`. Không tạo `components/common/` [[2, Web: layer-based và page colocation]](#ref-2).
- Không đưa component lên `components/` chỉ vì *có thể* tái sử dụng sau này; chỉ di chuyển khi có nhu cầu chia sẻ thực tế và trách nhiệm của component vẫn phù hợp.
- Route modules có thể render UI đơn giản; tách `pages/` cho màn hình phức tạp. Không bắt buộc mỗi route có page riêng [[2, Web: layer-based và page colocation]](#ref-2).

## Backend: responsibilities

- Route đăng ký endpoints và middleware; không chứa business logic.
- Middleware xử lý validation/auth/error concerns; request đã parse phải được chuyển tiếp với dữ liệu đáng tin cậy thay vì cast `req.body` mù quáng.
- Controller chuyển đổi HTTP input/output, gọi Service, chuyển lỗi đến error handling; không truy cập Repository trực tiếp *(lint)*.
- Service thực hiện business logic và orchestration; không nhận/trả Express `Request` hoặc `Response`, không thực hiện SQL/Drizzle query trực tiếp *(lint)*.
- Repository chỉ thực hiện data access; không chứa HTTP response formatting hoặc business rules *(lint: không import Express, `api/`, `services/`)*.
- Dùng typed application/domain errors cho expected failures và centralized error middleware; không nuốt lỗi, không để internal details lộ ra response.
- Dùng `pino` cho structured logging, correlation identifiers khi có request/job context; không log secrets, session cookies, tokens hoặc thông tin nhạy cảm [[1, Tech Stack]](#ref-1).

## Worker, concurrency và engine

- Job handler (`*.handler.ts`) validate payload, quản lý job lifecycle và gọi logic thực thi; tránh đưa toàn bộ thuật toán vào handler. Job payload schemas/contracts nằm trong `packages/shared`, không gộp lẫn với handler.
- Thiết kế các side effects có khả năng retry an toàn; cân nhắc idempotency khi job có thể chạy lại [[3, Rủi ro chất lượng]](#ref-3).
- Không dùng fire-and-forget Promise cho công việc cần bảo đảm hoàn tất; đưa công việc nền quan trọng vào job queue.
- Engine phải deterministic và không I/O; dependencies như time, randomness hoặc external data phải được đưa vào qua input/seed. Không đọc `process.env` trong engine [[1, Tech Stack]](#ref-1).
- Engine tính toán với `number` (float64); lưu giá, phí và P/L trong DB bằng `NUMERIC`, chỉ làm tròn ở presentation boundary. Test so sánh số thực với tolerance phù hợp [[1, Tech Stack]](#ref-1).

## Error handling và testing

- Phân biệt lỗi validation, business rule, infrastructure và unexpected errors; không catch rồi trả giá trị thành công giả.
- Cleanup tài nguyên và xử lý cancellation/timeout ở các boundaries có kết nối, jobs hoặc streams.
- Test hành vi quan sát được và contracts, không khóa chặt implementation details. Theo test levels, types và tools đã chốt/đề xuất trong Test Strategy; không tự coi các công cụ Proposed là quyết định cuối cùng [[3]](#ref-3).
- Với tính toán engine, bao phủ edge cases, deterministic replay và golden regression; thay đổi golden results phải được review [[3, Rủi ro chất lượng]](#ref-3).

## Những điều không bắt buộc

- Không bắt buộc mỗi API endpoint phải có đủ Controller, Service, Repository và Mapper nếu một layer không có trách nhiệm thực tế.
- Không bắt buộc mỗi route có `pages/` hoặc mỗi data access có custom hook.
- Không tạo `packages/application` cho đến khi có business logic thực sự cần dùng chung giữa API và Worker.
- Không tạo base class, factory hoặc generic abstraction chỉ để dự phòng tương lai.

## References

1. <a id="ref-1"></a>[Project: Crypto Force](../../CLAUDE.md)
2. <a id="ref-2"></a>[Project Structure](project-structure.md)
3. <a id="ref-3"></a>[Test Strategy](../testing/test-strategy.md)
