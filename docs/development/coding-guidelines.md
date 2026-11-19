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
| Test file | `.test.ts` hoặc `.test.tsx` theo nội dung; E2E dùng `.spec.ts`. Tên theo tính năng, không theo test scope (xem [Testware](#testware)) | `backtest.test.ts`, `e2e/auth/links.spec.ts` |
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

## Testware

Test sống lâu hơn một test scope: một test viết cho TS-001 sẽ còn chạy làm regression cho các thay đổi sau này. Người sửa test thường chưa đọc tài liệu STLC của scope đó.

- Đặt tên file và thư mục test theo tính năng, không theo test scope: `apps/api/test/auth/session.test.ts`, không dùng `ts001-session.test.ts` *(lint: `testware/no-scope-in-path`)*.
- Comment và chuỗi trong test không dùng ID làm việc của tài liệu STLC (`PROC-01`, `MD-05`, `DR-07`, `ER-06`, `SEC-04`, `TS-001`). Chỉ giữ test case ID (`TC-xxx`) ở đầu tên test, để truy vết kết quả về test case. ID nằm trong đường dẫn file vẫn được dùng *(lint: `testware/no-stlc-ids`)*.
- Comment đầu mỗi file test nói: file kiểm hành vi gì, test chạy trên môi trường nào (fake nào, database nào, vì sao), cách chạy, và nơi có expected result. Một người chưa đọc tài liệu STLC phải sửa được file sau khi đọc comment này.
- Test kiểm hành vi theo requirement, không theo code hiện tại. System test (`apps/web/e2e/`) không import source của app; expected value lấy từ requirement *(lint: `no-restricted-imports`)*.
- Ở test có import code của app (Component, Component integration), expected value là literal lấy từ test case hoặc requirement. Không lấy expected value từ hằng số, cấu hình hay hàm của code đang được test, và không assert giá trị của một hằng số hay cấu hình thay cho hành vi. Khi code sai, expected value lấy từ code cũng sai theo, nên test vẫn pass *(lint: `testware/no-implementation-oracle`)*. Input cũng vậy: giá trị biên (ví dụ số lần thử tối đa) viết thành literal từ test case, không import hằng số của app như `SIGN_IN_RATE_LIMIT` *(lint: `testware/no-app-constants`)*. Code production không export hằng số, hàm hay type mà không module production nào import: export chỉ để test dùng làm test bám vào cấu trúc của module. Test hành vi qua hàm public của module *(`pnpm check:exports`, knip)*.
- Không thay module của app bằng mock (`vi.mock`, `vi.doMock`, `vi.spyOn` trên module trong `src/` hoặc `app/`). Mock như vậy chép cách code chia module: test fail khi chỉ sắp xếp lại code, và pass khi module thật hỏng. Chỉ thay boundary: truyền fake qua tham số (mailer, logger, clock), hoặc thêm fake cho host trong `apps/api/test/support/outbound.ts` *(lint: `testware/no-app-module-mocks`)*.
- Assert đúng status mà test case cho input đó, kèm body hoặc side effect khi test case có ghi. Không assert "status khác 429" hay một khoảng status: response 500 cũng khác 429 *(lint: `testware/exact-status-oracle`)*. Khi requirement không cho status mà status lấy từ thư viện (ví dụ 200 của Better Auth), test design ghi status đó là contract của version thư viện, có người duyệt. Test kiểm thêm tác dụng mà requirement cho, ví dụ email được gửi hay tài khoản được tạo, vì thư viện có thể trả status đúng mà không làm việc đó *(review: skill `review-change`)*. Mỗi test Vitest phải có ít nhất một assertion *(Vitest `expect.requireAssertions`; mỗi package chạy Vitest phải bật option này trong `vitest.config.ts`: `pnpm check:rules`)*. Playwright không đếm assertion, nên mỗi test E2E phải có `expect()` trong thân test, hoặc gọi helper có tên bắt đầu bằng `expect` (ví dụ `expectExpiredScreen`) *(lint: `testware/require-expect`)*.
- Khi môi trường test mô phỏng một sự kiện (khởi động lại, trình duyệt thứ hai, đóng tab), bản mô phỏng phải làm mất đúng trạng thái mà sự kiện thật làm mất. Ví dụ: khởi động lại API là chạy process mới (`apps/api/test/support/api-process.ts`), không phải tạo object mới trong cùng process, vì thư viện có thể giữ trạng thái trong biến của module. Trước khi dùng một mock, stub hoặc driver, người viết test làm hỏng một lần hành vi mà thành phần đó thay thế, rồi chạy test dùng thành phần đó. Test phải fail. Comment đầu file test ghi lỗi đã thử và test đã fail *(review: skill `review-change`)*. Tên test và comment chỉ nói điều mà assertion kiểm được *(review: skill `review-change`)*.
- Mỗi test chạy được riêng và chạy được theo mọi thứ tự. Test không dùng chung dữ liệu có thể thay đổi với test khác. Mỗi test tạo dữ liệu riêng, ví dụ một user hoặc một IP riêng. Một mock phải trả được lỗi khi test cần lỗi. Một mock luôn trả thành công làm test không fail được *(review: skill `review-change`)*.
- Test không phụ thuộc vào thời gian thật. Test điều khiển thời gian bằng fake clock hoặc bằng clock truyền qua tham số. Test chờ theo điều kiện (`expect.poll`, `toBeVisible`), không chờ một số giây cố định (`page.waitForTimeout`, `setTimeout`). Khi máy chậm, test chờ cố định có thể fail mà sản phẩm không sai *(review: skill `review-change`)*.
- Khi một tính chất chỉ kiểm được bằng đọc code của dependency, ví dụ token được sinh từ CSPRNG, test tự động không thay được việc đọc code đó: một bộ đếm cũng tạo được token không trùng. Ghi kết quả là review, kèm file và dòng đã đọc, không ghi là test đã chứng minh. Ghi version đã đọc ở dòng `Dependency đã review` của Implementation Status, dạng `` `tên@version` `` *(`pnpm check:stlc` fail khi `pnpm-lock.yaml` không còn version đó)*.
- Khi môi trường test không cho tạo một precondition mà người dùng thật tạo được, sửa môi trường test (biến môi trường, server thứ hai, database riêng), không sửa test để né. Ví dụ: kiểm màn Sign in khi chưa cấu hình Google bằng một server E2E chạy với biến Google trống, không giả response của API trong trình duyệt.

## Những điều không bắt buộc

- Không bắt buộc mỗi API endpoint phải có đủ Controller, Service, Repository và Mapper nếu một layer không có trách nhiệm thực tế.
- Không bắt buộc mỗi route có `pages/` hoặc mỗi data access có custom hook.
- Không tạo `packages/application` cho đến khi có business logic thực sự cần dùng chung giữa API và Worker.
- Không tạo base class, factory hoặc generic abstraction chỉ để dự phòng tương lai.

## References

1. <a id="ref-1"></a>[Project: Crypto Force](../../CLAUDE.md)
2. <a id="ref-2"></a>[Project Structure](project-structure.md)
3. <a id="ref-3"></a>[Test Strategy](../testing/test-strategy.md)
