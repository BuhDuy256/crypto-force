# Data Model & Persistence

Đọc file này để biết hệ thống lưu những dữ liệu nào, quan hệ giữa các entity, quyền sở hữu dữ liệu và cách bảo đảm tính toàn vẹn qua persistence và migration.

## Drivers

| Driver | Cơ chế đáp ứng |
| --- | --- |
| Danh tính và dữ liệu phiên của tài khoản | `user` sở hữu quan hệ với `account`, `session` qua foreign key [[1]](#ref-1) |
| Link reset chỉ dùng một lần (RP-04), thu hồi phiên khi đổi password (RP-06) | Dữ liệu tạm `verification` và bản ghi `session`; logic tiêu thụ/thu hồi thuộc Auth |
| Bộ đếm giới hạn không mất khi khởi động lại (SEC-04) | Rate limiter lưu bảng `rate_limit` |

## Phạm vi dữ liệu và quyền sở hữu

| Nhóm dữ liệu | Nơi lưu và bên quản lý | Hiện trạng |
| --- | --- | --- |
| Tài khoản, danh tính đăng nhập, phiên và dữ liệu xác thực tạm | PostgreSQL; schema/migration do API sở hữu, Better Auth thao tác qua Drizzle adapter | Có trong migration ứng dụng |
| Bộ đếm giới hạn request | PostgreSQL; rate limiter của Better Auth | Có bảng `rate_limit`, tồn tại qua lần khởi động process |
| Hạ tầng queue | PostgreSQL; pg-boss quản lý schema nội bộ, Worker khởi động queue | Không thuộc ERD bảng ứng dụng |
| Dữ liệu trình duyệt | Router context và TanStack Query cache | Không phải bản lưu bền của dữ liệu server |

Database ứng dụng hiện có các bảng trong ERD dưới đây. Chưa có schema cho Strategy Version, Experiment, market data hay kết quả backtest trong migration; mô hình domain của chúng được xác định khi triển khai module tương ứng [[2]](#ref-2) [[3]](#ref-3).

`createDatabase` tạo `pg.Pool` và Drizzle client; Better Auth truy cập các bảng qua Drizzle adapter. Tên property TypeScript dùng camelCase, tên cột PostgreSQL dùng snake_case ở cả runtime và drizzle-kit [[2]](#ref-2).

### ERD

ERD dùng tên bảng và cột vật lý từ schema và migration `0000_auth.sql` [[3]](#ref-3). `timestamptz` biểu diễn `timestamp with time zone`; các cột không có PK/FK/UK vẫn có thể là NOT NULL, chi tiết ở bảng ràng buộc bên dưới.

```mermaid
erDiagram
    user ||--o{ session : "có phiên"
    user ||--o{ account : "có danh tính đăng nhập"
    user {
        text id PK
        text name
        text email UK
        boolean email_verified
        text image
        timestamptz created_at
        timestamptz updated_at
    }
    session {
        text id PK
        text token UK
        text user_id FK
        timestamptz expires_at
        text ip_address
        text user_agent
        timestamptz created_at
        timestamptz updated_at
    }
    account {
        text id PK
        text account_id
        text provider_id
        text user_id FK
        text password
        text access_token
        text refresh_token
        text id_token
        timestamptz access_token_expires_at
        timestamptz refresh_token_expires_at
        text scope
        timestamptz created_at
        timestamptz updated_at
    }
    verification {
        text id PK
        text identifier
        text value
        timestamptz expires_at
        timestamptz created_at
        timestamptz updated_at
    }
    rate_limit {
        text id PK
        text key UK
        integer count
        bigint last_request
    }
```

`verification` và `rate_limit` không có foreign key tới `user`. Với bản ghi reset password, `verification.value` là user ID và `identifier` chứa loại token; đây là liên kết logic do ứng dụng quản lý, không được DB bảo vệ bằng FK [[4]](#ref-4).

### Ràng buộc và index

| Bảng | Ràng buộc và ý nghĩa |
| --- | --- |
| `user` | Mọi cột bắt buộc trừ `image`; `email` UNIQUE; `email_verified` mặc định false |
| `session` | Mọi cột bắt buộc trừ `ip_address`, `user_agent`; `token` UNIQUE; index `user_id`; FK `user_id` xóa cascade |
| `account` | Bắt buộc `id`, `account_id`, `provider_id`, `user_id`, timestamps; password, token, hạn token và scope nullable; index `user_id`; FK `user_id` xóa cascade |
| `verification` | Mọi cột bắt buộc; index `identifier`, không có UNIQUE cho `identifier` |
| `rate_limit` | Mọi cột bắt buộc; `key` UNIQUE; `last_request` là bigint ánh xạ thành number trong Drizzle |

Các bảng có `created_at`, `updated_at` dùng mặc định DB `now()`; cập nhật `updated_at` dùng `$onUpdate` của Drizzle, không có SQL trigger trong migration. ID do Better Auth sinh. Schema không khai báo composite UNIQUE cho `account(provider_id, account_id)` [[3]](#ref-3).

## Persistence và migration

PostgreSQL chạy qua Docker Compose với named volume `postgres-data`; dừng container không đồng nghĩa xóa volume. API dùng connection pool qua `createDatabase`, nhận địa chỉ kết nối từ `DATABASE_URL`; Worker tạo kết nối pg-boss riêng. API và Worker có trách nhiệm đóng kết nối của mình khi shutdown [[5]](#ref-5).

Schema TypeScript được export từ `apps/api/src/database/schema/index.ts`; drizzle-kit sinh SQL vào `apps/api/drizzle/`. Runtime và generator cùng dùng snake_case. Từ repository root, `pnpm db:generate` sinh migration, `pnpm db:migrate` áp dụng migration vào database cấu hình. Các lệnh này là thao tác quản lý schema riêng, không nằm trong bootstrap API [[2]](#ref-2) [[5]](#ref-5).

FK, UNIQUE và NOT NULL được PostgreSQL bảo vệ. Thời hạn, tiêu thụ token và thu hồi phiên là bất biến do Auth adapter/hook thực hiện, không phải CHECK constraint hoặc trigger của DB. Chi tiết cơ chế bảo mật nằm trong Security [[6]](#ref-6). ERD và migration mô tả schema của codebase, không chứng minh một database đang chạy đã áp dụng migration.

## Quyết định

| Hạng mục | Quyết định |
| --- | --- |
| Schema sở hữu bởi ứng dụng | `apps/api/src/database/schema/index.ts` export schema Auth; migration nằm trong `apps/api/drizzle/` |
| Toàn vẹn dữ liệu | Quan hệ bắt buộc dùng FK; dữ liệu tạm không có FK cần logic ứng dụng quản lý vòng đời |
| Queue | Worker khởi động pg-boss trên cùng `DATABASE_URL`; pg-boss quản lý schema nội bộ riêng. ERD trên chỉ bao gồm bảng trong migration của ứng dụng, không phải bảng nội bộ của queue [[7]](#ref-7) |

## Rủi ro

- Dữ liệu `account` và `session` có credential/token nhạy cảm; không đưa nội dung các cột này vào log hoặc response tùy ý.
- Xóa cascade chỉ áp dụng cho `account` và `session`; tác vụ xóa tài khoản sau này phải xét riêng dữ liệu `verification` không có FK.
- Migration hiện chỉ định nghĩa Auth. Strategy Version, Experiment và kết quả backtest cần schema riêng khi triển khai flow Strategy → Backtest; không có bảng cho các domain này trong ERD hiện tại [[3]](#ref-3).

## References

1. <a id="ref-1"></a>[Authentication](../UCs/authentication.md)
2. <a id="ref-2"></a>[Database client](../../apps/api/src/database/client.ts) và [Drizzle config](../../apps/api/drizzle.config.ts)
3. <a id="ref-3"></a>[Auth schema](../../apps/api/src/database/schema/auth.ts) và [Auth migration](../../apps/api/drizzle/0000_auth.sql)
4. <a id="ref-4"></a>Better Auth cài trong workspace: `apps/api/node_modules/better-auth/dist/api/routes/password.mjs`.
5. <a id="ref-5"></a>[Docker Compose](../../docker-compose.yml), [API bootstrap](../../apps/api/src/index.ts) và [Workspace commands](../../package.json)
6. <a id="ref-6"></a>[Security](23-security.md)
7. <a id="ref-7"></a>[Worker bootstrap](../../apps/worker/src/index.ts)
