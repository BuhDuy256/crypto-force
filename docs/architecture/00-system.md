# System Context & Architecture Overview

Đọc file này để biết bối cảnh hệ thống, bức tranh kiến trúc tổng thể và ranh giới của hệ thống.

## Drivers

| Driver | Cơ chế đáp ứng |
| --- | --- |
| Truy cập workspace gắn với tài khoản và phiên (SS-03, SS-04, SS-07) | Web kiểm phiên trước khi tải workspace; API sở hữu dữ liệu xác thực [[1]](#ref-1) |
| Phân tích thị trường, xây dựng và đánh giá strategy | Ranh giới Web/API, Worker và engine thuần tính toán; phần triển khai của từng container nêu bên dưới [[2]](#ref-2) |
| Tách tính toán nền khỏi request phục vụ UI | Worker process riêng và queue PostgreSQL; chưa có pipeline nghiệp vụ được đăng ký [[2]](#ref-2) |

## Thành phần

### Bối cảnh

```mermaid
flowchart LR
    U[Khách và người dùng] --> CF[Crypto Force]
    CF --> G[Google: xác thực danh tính]
    CF --> R[Resend: gửi email]
    CF --> P[Pwned Passwords: kiểm password bị lộ]
    CF -. tích hợp theo thiết kế, chưa triển khai .-> BI[Binance: dữ liệu thị trường]
    CF -. tích hợp theo thiết kế, chưa triển khai .-> L[LLM: sentiment]
```

### Container

```mermaid
flowchart LR
    B[Trình duyệt: Web React Router] -- HTTP cùng origin /api --> A[API Express]
    A --> D[(PostgreSQL)]
    A --> G[Google OAuth]
    A --> R[Mailer: Resend hoặc console]
    A --> P[Pwned Passwords API]
    W[Worker: pg-boss] --> D
```

Các kết nối nét liền trong sơ đồ là cơ chế đã có trong source; kết nối nét đứt là tích hợp trong thiết kế chưa có adapter triển khai. Việc một integration có code không khẳng định dịch vụ đó đã được cấu hình trên môi trường deploy.

| Container/package | Trách nhiệm | Phần đã triển khai |
| --- | --- | --- |
| Web | Render UI, điều hướng và giữ server state phía client | Landing, Auth, màn 404, workspace layout/header và lớp chặn phiên; nội dung các tab nghiệp vụ là placeholder |
| API | HTTP boundary, orchestration và truy cập dữ liệu | Better Auth, health, cấu hình Auth công khai, security headers, logging và error handling |
| PostgreSQL | Persistence của ứng dụng và queue | Schema ứng dụng gồm dữ liệu tài khoản/phiên và rate limit; pg-boss quản lý schema queue riêng |
| Worker | Thực thi job nền ngoài vòng đời HTTP request | Khởi động/dừng pg-boss; chưa đăng ký job handler |
| `packages/shared` | Contracts và validation dùng chung | Schema Auth và environment |
| `packages/engine` | Tính toán domain tất định, không I/O | Entry point chưa export module tính toán |

Nguồn hiện trạng: bootstrap API/Worker, route config và entry point engine [[3]](#ref-3). Worker không nằm trên đường xử lý request Auth hiện tại.

Web dùng SPA cho ứng dụng và prerender Landing; cấu hình render nằm tại `apps/web/react-router.config.ts`. Trong development, Vite proxy `/api` tới API; khi deploy cần routing cùng origin cho Web/API. Cookie và ràng buộc reverse proxy nằm trong Security [[4]](#ref-4).

### Web và App shell

| Nhóm route | Cơ chế |
| --- | --- |
| Landing `/` và route không tồn tại | Public; không nằm dưới workspace layout |
| `/sign-in`, `/sign-up`, `/sign-up/verify`, `/forgot-password`, `/reset-password` | Auth layout đọc session và cấu hình Google; xử lý đích `next` qua `getSafeNext` |
| `/realtime`, `/strategy`, `/discovery`, `/backtest`, `/news` | Workspace layout kiểm session trước loader con, cấp user cho AppHeader và render Outlet |

Route config và layout nằm tại `apps/web/app/routes.ts`, `routes/auth-layout.tsx` và `routes/workspace-layout.tsx`. AppHeader dùng chung trong workspace; các control phụ thuộc Search, backtest và thị trường được bổ sung theo flow tương ứng [[5]](#ref-5).

## Ranh giới trách nhiệm

Trình duyệt trao đổi dữ liệu với API qua HTTP; API giữ credential dịch vụ ngoài và kết nối database. Package shared không sở hữu persistence; engine không sở hữu I/O. Worker và API là process riêng, không dùng việc API trả được HTTP để suy ra Worker sẵn sàng [[2]](#ref-2).

Kiểm phiên ở Web phục vụ điều hướng và hiển thị, không thay thế authorization của API. Quyết định middleware trước loader con nằm trong ADR về màn chặn workspace [[6, ADR-001]](#ref-6). Trạng thái truy cập và vòng đời process được mô tả trong System States & Lifecycle [[7]](#ref-7).

## Quyết định

| Hạng mục | Quyết định |
| --- | --- |
| Ranh giới runtime | Web, API và Worker tách biệt; PostgreSQL cung cấp persistence cho backend |
| Ranh giới package | Shared cung cấp contract; engine chứa tính toán domain, không phụ thuộc hạ tầng I/O [[2]](#ref-2) |
| Dữ liệu và contract | ERD, constraints và migration nằm trong Database [[8]](#ref-8); endpoint và lỗi HTTP nằm trong API Contracts [[9]](#ref-9) |

## Rủi ro

- `/api/health` chỉ chứng minh Express trả được response, không kiểm PostgreSQL, Worker hoặc dịch vụ ngoài; không dùng nó để kết luận toàn hệ thống sẵn sàng.
- Các flow nghiệp vụ và backend của Strategy/Backtest thuộc increment sau [[5]](#ref-5).

## References

1. <a id="ref-1"></a>[Authentication](../UCs/authentication.md)
2. <a id="ref-2"></a>[Project: Crypto Force](../../AGENTS.md) và [Project Brief](../UCs/sources/project-brief.md)
3. <a id="ref-3"></a>[API bootstrap](../../apps/api/src/index.ts), [Worker bootstrap](../../apps/worker/src/index.ts), [Web routes](../../apps/web/app/routes.ts) và [Engine entry point](../../packages/engine/src/index.ts)
4. <a id="ref-4"></a>[Security](23-security.md)
5. <a id="ref-5"></a>[Prototype → Implementation Roadmap](../build/01-prototype-to-implementation/draft/implementation-plan/roadmap.md)
6. <a id="ref-6"></a>[Architectural Decisions](30-decisions.md)
7. <a id="ref-7"></a>[System States & Lifecycle](20-state-machine.md)
8. <a id="ref-8"></a>[Data Model & Persistence](21-database.md)
9. <a id="ref-9"></a>[API & Realtime Communication Contracts](22-api-endpoints.md)
