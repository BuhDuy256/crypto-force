# Project Structure

Đọc file này để biết cách tổ chức source code của Crypto Force, trách nhiệm của từng folder và các ranh giới phụ thuộc bắt buộc.

## Nguyên tắc

1. Monorepo dùng `pnpm` workspaces với `apps/web`, `apps/api`, `apps/worker`, `packages/shared` và `packages/engine` [[1, Tech Stack]](#ref-1).
2. `apps/web` và `apps/api` tổ chức theo layer; frontend cho phép colocate component đặc thù trong từng page. `packages/engine` tổ chức theo domain.
3. Strict boundaries, flexible implementation: trách nhiệm và dependency là constraints; không bắt buộc tạo mọi folder, layer hoặc file trước khi có nhu cầu.
4. Không import source nội bộ của app khác. Cross-package imports phải đi qua public exports của package; không import sâu vào private internals.
5. Cấu trúc source không bắt buộc trùng với cấu trúc tài liệu `docs/architecture/` [[2, Phạm vi của `docs/architecture/`]](#ref-2).

## Cấu trúc tham chiếu

Cây dưới đây là nơi đặt code khi phát sinh nhu cầu, không phải danh sách folder bắt buộc phải tạo ngay.

```text
apps/
  web/
    app/
      routes.ts        # Explicit React Router route config
      routes/           # React Router route modules
      pages/            # UI màn hình phức tạp, khi cần
      components/       # Components shared across pages
        ui/             # shadcn/ui primitives
      hooks/            # UI logic và query hooks
      api/              # Typed HTTP API access
      layouts/
      contexts/
      types/            # UI-only types
      utils/
    mocks/              # Development HTTP handlers, fixtures và MSW bootstrap
  api/
    src/
      api/
        routes/
        controllers/
        middlewares/
      services/
      repositories/
      mappers/
      database/
      configs/
      errors/
  worker/
    src/
      jobs/             # *.handler.ts: job execution handlers
      services/
      configs/
packages/
  shared/
    src/
      schemas/
      types/
      constants/
  engine/
    src/
      indicators/
      strategies/
      combinations/
      backtesting/
      evaluation/
```

## Web: layer-based và page colocation

| Vị trí | Trách nhiệm |
| --- | --- |
| `routes.ts` và `routes/` | Route config tường minh và route modules theo React Router framework mode; không gom toàn bộ business logic vào route. |
| `pages/` | Màn hình phức tạp; có thể có `components/` riêng bên trong từng page. Không bắt buộc mỗi route có page riêng. |
| `components/ui/` | UI primitives theo shadcn/ui. |
| `components/` (ngoài `ui/`) | Component dùng chung giữa nhiều màn hình, không thuộc riêng một page. |
| `hooks/` | Custom hooks cho UI state, interactions và TanStack Query. |
| `api/` | Typed HTTP API access (ví dụ `backtest.ts`, `client.ts`); không chứa React rendering hoặc business logic. |
| `types/` | Types đặc thù UI; contract chia sẻ với backend đặt tại `packages/shared`. |

Dùng React Router framework mode theo Tech Stack đã chọn [[1, Tech Stack]](#ref-1). Không bắt buộc một route module chỉ được render một page; có thể viết UI đơn giản ngay trong route module. Component đặc thù của một page nên colocate trong `pages/<Page>/components/`; chỉ chuyển lên `components/` khi thực sự được dùng chung giữa các page. Không tạo `components/common/` vì `components/` đã là nơi chứa component dùng chung. Khả năng tái sử dụng trong tương lai không phải lý do để chuyển component lên sớm.

## Development HTTP mocks

`apps/web/mocks/` chứa MSW handlers (`handlers.ts`), dữ liệu giả trong `fixtures/` khi có nhu cầu, browser bootstrap (`browser.ts`) và Vite middleware phục vụ worker script chỉ trong development (`vite.ts`). Đây là code hỗ trợ development, không phải layer nghiệp vụ. Fixtures phục vụ test vẫn nằm trong phạm vi test tương ứng.

Luồng dữ liệu của ứng dụng là Page → query hook hoặc route loader → `app/api/` → HTTP. MSW chặn HTTP request có handler; request không có handler tiếp tục đến backend thật. Page, component, hook và API module không import mock, kể cả bằng dynamic import hoặc re-export *(lint)*. Chỉ `app/entry.client.tsx` được khởi động browser mocks; `vite.config.ts` tích hợp dev middleware.

Quy tắc bật mock, contracts và chuyển sang backend thật nằm tại [HTTP mocking](code.md#http-mocking). Production build từ chối chunk chứa module trong `mocks/`, MSW runtime hoặc worker asset.

## API: layer-based

| Layer | Trách nhiệm | Không được |
| --- | --- | --- |
| Route | Đăng ký endpoint, kết nối middleware và controller. | Chứa business logic. |
| Middleware | Xử lý cross-cutting HTTP concerns, authentication, validation và errors. | Thực hiện nghiệp vụ thay service. |
| Controller | Nhận request đã được kiểm tra, gọi application service, trả HTTP response. | Truy vấn DB trực tiếp hoặc chạy thuật toán engine. |
| Service | Business rules và orchestration; trả về kết quả không gắn với Express. | Phụ thuộc vào `Request`/`Response` của Express hoặc truy vấn DB trực tiếp. |
| Repository | Data access qua Drizzle; quản lý queries và persistence. | Chứa HTTP handling hoặc business rules. |
| Mapper | Chuyển đổi representation khi thực sự cần. | Gọi DB, thực hiện I/O hoặc chứa business rules. |

Luồng thường gặp: Route → Middleware → Controller → Service → Repository → PostgreSQL. Đây không phải yêu cầu mọi endpoint phải có đủ các layer. API contracts dùng chung lấy từ `packages/shared`, tránh khai báo DTO trùng lặp.

## Worker

- `jobs/`: job execution handlers (ví dụ `backtest.handler.ts`), nhận và validate job payload, điều phối execution và reporting; phân biệt handler với job payload contract ở `packages/shared`.
- `services/`: logic ứng dụng chỉ thuộc Worker.
- `configs/`: cấu hình riêng của Worker.
- Worker có thể gọi public API của `packages/engine` và `packages/shared`; không import trực tiếp `apps/api/src/**`.
- Khi API và Worker thực sự cần chung một business operation, trích xuất sang package có public API phù hợp; không mặc định tạo `packages/application` từ đầu.

## Shared và Engine

- `packages/shared`: Zod schemas, contracts, shared types và constants; không biến thành nơi chứa mọi business logic.
- `packages/engine`: pure TypeScript computations theo domain (indicator, strategy, combination, backtest, evaluation), không I/O, không Express/React/DB/Binance SDK, không đọc environment variables trực tiếp; cùng input và version phải cho kết quả deterministic (bao gồm seed nếu có randomness) [[1, Tech Stack]](#ref-1) [[3, Rủi ro chất lượng]](#ref-3).
- Backend tích hợp Binance qua `MarketDataProvider` adapter; frontend không gọi Binance trực tiếp [[1, Tech Stack]](#ref-1).

## Dependency rules

1. `apps/web` → backend qua HTTP/WebSocket contracts, không import backend source.
2. `apps/api` và `apps/worker` → shared/engine qua package public exports, không import source nội bộ của nhau.
3. `packages/engine` không phụ thuộc vào `apps/*` hoặc hạ tầng I/O.
4. `packages/shared` không phụ thuộc vào `apps/*`; không import `packages/engine` chỉ để phục vụ UI contracts.
5. Chỉ tạo abstraction, layer hoặc folder khi có trách nhiệm thực tế; không tạo pass-through layers chỉ để đủ sơ đồ.

Các quy tắc 2, 3, 4 và ranh giới layer trong `apps/api` (Route/Controller không import `repositories/`, `database/`; Service không import Express, `database/`; Repository không import Express, `api/`, `services/`) được enforce bằng `no-restricted-imports` trong `eslint.config.js`. Khi thêm folder hoặc layer mới có ranh giới phụ thuộc, thêm rule tương ứng vào `eslint.config.js` cùng lúc.

## References

1. <a id="ref-1"></a>[Project: Crypto Force](../../AGENTS.md)
2. <a id="ref-2"></a>[Architecture Documentation](architecture.md)
3. <a id="ref-3"></a>[Test Strategy](../testing/test-strategy.md)
