# API & Realtime Communication Contracts

Đọc file này để biết các contract đi qua ranh giới HTTP và realtime của hệ thống, bên gọi, điều kiện truy cập, input/output và cách biểu diễn lỗi.

## Drivers

| Driver | Cơ chế đáp ứng |
| --- | --- |
| Sign in, Create account, Verify email, Continue with Google và Reset password | Endpoint của Better Auth dưới `/api/auth`; Web gọi qua typed wrapper [[1]](#ref-1) |
| Không có phiên thì chặn workspace (SS-03), Sign out thu hồi phiên (SS-01) | `get-session` và `sign-out` dùng cookie session |
| Chỉ nhận origin và đích chuyển tiếp hợp lệ (SEC-02, RD-06) | Better Auth kiểm origin/callback; Web kiểm `next` trước khi điều hướng |
| Giới hạn request Auth và gửi email (SI-06, GO-08, SEC-07) | Better Auth trả 429 cùng `X-Retry-After`; Web chuyển lỗi thành `AuthRequestError` |
| Xem lịch sử nến, summary và backfill sau gián đoạn (MK-08, MK-25, MK-33, MK-105) | [Endpoint Market Data](#endpoint-market-data) |
| Phiên hết hạn khi xem Realtime (MK-40) | Endpoint REST Market Data trả 401 `UNAUTHENTICATED`; WebSocket trả 401 lúc upgrade hoặc đóng bằng mã `4401` |
| Lỗi theo nhóm, không lộ chi tiết upstream (MK-12, MK-18, MK-39, MK-45, MK-130) | [Lỗi Market Data](#lỗi-market-data) và thông điệp `error`/`status` WebSocket |
| Cập nhật trực tiếp nến và summary, đổi kênh độc lập, tín hiệu sống và trạng thái đồng bộ (MK-93 đến MK-99, MK-104 đến MK-106, MK-110, MK-111) | [Kênh WebSocket Market Data](#kênh-websocket-market-data) |
| Xác thực, kiểm `Origin`, `WSS` production, cưỡng chế phiên và giới hạn số tab đồng thời (MK-118 đến MK-121, MK-142) | Bắt tay HTTP upgrade tại `/api/market-data/ws` và mã đóng `4401`, `4429` ([Kênh WebSocket Market Data](#kênh-websocket-market-data), [Security](23-security.md)) |

## Thành phần

`createApp` mount Better Auth bằng `toNodeHandler` trước `express.json()`, vì Better Auth tự đọc body. Router `/api` của ứng dụng được mount sau đó; nó có health, cấu hình Auth công khai và hai endpoint Market Data [[2]](#ref-2). Server HTTP của API gắn thêm `WebSocketServer` (`ws@8.23.0` trong `apps/api/package.json` và khóa trong `pnpm-lock.yaml`) qua `attachMarketDataWs` xử lý sự kiện `upgrade` cho duy nhất đường dẫn `/api/market-data/ws` [[9]](#ref-9) [[10]](#ref-10).

## Ranh giới giao tiếp

| Bên gọi → bên nhận | Transport và contract | Hiện trạng |
| --- | --- | --- |
| Trình duyệt → API | HTTP cùng origin, prefix `/api` | Đã triển khai: Health, cấu hình công khai, Better Auth và Market Data REST |
| Trình duyệt ↔ API realtime | WebSocket cùng origin tại `/api/market-data/ws` | Đã triển khai server (`attachMarketDataWs`) và client WebSocket (`createMarketDataWsClient`); Vite proxy `/api` đã bật `ws: true` [[6]](#ref-6) |
| Google/hộp thư → API qua trình duyệt | Callback OAuth hoặc link kiểm token | Đã triển khai dưới `/api/auth/*`, sau đó chuyển về route Web |
| API → PostgreSQL | Drizzle adapter và connection pool | Đã triển khai cho Auth và truy vấn đọc phiên theo lô của WebSocket (`SessionRepository`) |
| API ↔ Binance | HTTPS REST và WSS combined stream | Đã triển khai; chỉ qua `MarketDataProvider` và `MarketDataStreamProvider` [[9]](#ref-9) |
| Worker → PostgreSQL | pg-boss | Queue bootstrap; chưa có contract payload job nghiệp vụ |

Web gọi API qua module `app/api/`; contract Auth hiện nằm trong `apps/web/app/api/auth.ts`. `AuthConfig` và các schema Market Data được kiểm bằng Zod từ `packages/shared`; kết quả Auth lấy type từ Better Auth client [[3]](#ref-3).

### Endpoint ứng dụng

| Method | Path | Session | Response thành công |
| --- | --- | --- | --- |
| GET | `/api/health` | Không yêu cầu | `{ "status": "ok" }`; không kiểm kết nối DB hoặc Worker |
| GET | `/api/auth-config` | Không yêu cầu | `{ "google": boolean }`; true khi cả Google client ID và secret có cấu hình, không lộ giá trị secret |

Nguồn: `health.route.ts`, `auth-config.route.ts` và bootstrap API [[2]](#ref-2).

### Endpoint Market Data

Trạng thái: đã triển khai cho vòng REST tải lịch sử và REST polling. Ở vòng WebSocket, hai endpoint này **tiếp tục giữ vai trò tải lịch sử ban đầu, đổi pair/timeframe khi tạm dừng hoặc đang trực tiếp, và REST backfill sau mất kết nối hoặc bỏ lỡ dữ liệu (MK-105, MK-109, ADR-009)**. Web gọi hai path này qua `app/api/market-data.ts` [[8]](#ref-8). Kiểu response là contract nến và summary trong Market Data; bảng dưới không định nghĩa lại trường [[9, Contract nến và chuẩn hóa]](#ref-9).

| Method | Path | Query | Session | Response thành công |
| --- | --- | --- | --- | --- |
| GET | `/api/market-data/candles` | `pair`, `timeframe`; bắt buộc | Yêu cầu | 200, lịch sử nến (`CandleHistory`) |
| GET | `/api/market-data/summary` | `pair`; bắt buộc | Yêu cầu | 200, summary (`MarketSummary`, bổ sung trường `dataTime` ở vòng WebSocket đã duyệt ngày 2026-11-23, phục vụ MK-111) |

- `pair` và `timeframe` phải thuộc enum trong `packages/shared` (MK-30, MK-32). Query thiếu, sai giá trị hoặc thừa tham số trả 400.
- Client không gửi số nến. Server quyết định số nến: số nến tối đa trên một chart (MK-33) cộng nến khởi động MA (ADR-004), để client không tăng tải lên provider.
- Response có `Cache-Control: no-store`. API cache dữ liệu ngắn hạn phía server; `dataTime` cho biết thời điểm API nhận dữ liệu, nên response từ cache không đổi contract [[9, Cache và giới hạn request]](#ref-9).
- Middleware dùng chung của router ứng dụng kiểm phiên: gọi `auth.api.getSession` với header của request, đổi bằng `fromNodeHeaders` của `better-auth/node`. Endpoint này của Better Auth yêu cầu header và trả `null` khi không có phiên hợp lệ [[4]](#ref-4). Kiểm phiên chạy trước kiểm query. Request không có phiên hợp lệ nhận 401 `UNAUTHENTICATED` kể cả khi query cũng sai, để người chưa đăng nhập không thấy quy tắc validation.

#### Lỗi Market Data

Body theo envelope của router ứng dụng: `{ "error": { "code": string, "message": string } }`. `message` là thông điệp chung, không có status, URL hoặc payload của provider (MK-39); chi tiết nằm trong log [[9, Observability]](#ref-9).

| Nhóm | HTTP | `code` | Web xử lý |
| --- | --- | --- | --- |
| Không có phiên hợp lệ | 401 | `UNAUTHENTICATED` | Chuyển sang màn chặn workspace (MK-40) |
| Input không hợp lệ | 400 | `INVALID_QUERY` | Không xảy ra từ UI; lỗi chung của chart hoặc sidebar kèm thử lại |
| Nguồn dữ liệu không khả dụng hoặc hết timeout | 503 | `MARKET_DATA_UNAVAILABLE` | Lỗi của chart hoặc sidebar kèm thử lại (MK-12, MK-18), hoặc đồng bộ chưa xong khi đang backfill (MK-127) |
| Dữ liệu nguồn sai, gồm payload upstream không parse được | 502 | `MARKET_DATA_INVALID` | Lỗi của chart kèm thử lại, không vẽ nến (MK-45) |
| Lỗi không lường trước | 500 | `INTERNAL_ERROR` | Lỗi kèm thử lại |

503 cho nguồn không khả dụng, vì đây là tình trạng tạm thời và thử lại có thể thành công. 502 cho dữ liệu nguồn sai, vì upstream đã trả lời nhưng response không dùng được. Web phân nhánh theo `code`, không theo status.

### Endpoint Auth đang dùng trong ứng dụng

Body là JSON; tham số trong cột Input là query khi method là GET. Các giới hạn và hành vi người dùng nằm trong Authentication [[1]](#ref-1); cấu hình backend và route của Better Auth quyết định contract HTTP [[4]](#ref-4).

| Method | Path | Input chính | Kết quả hoặc tác động |
| --- | --- | --- | --- |
| GET | `/api/auth/get-session` | Cookie nếu có | Session và user, hoặc `null` khi không có phiên hợp lệ |
| POST | `/api/auth/sign-in/email` | `email`, `password`, `rememberMe`, `callbackURL` | Tạo session, trả user/token cùng thông tin redirect; đặt cookie |
| POST | `/api/auth/sign-up/email` | `name`, `email`, `password`, `callbackURL` | Response đăng ký không tiết lộ email đã tồn tại; tài khoản mới cần xác minh email trước khi có phiên |
| POST | `/api/auth/send-verification-email` | `email`, `callbackURL` | `{ "status": true }`; gửi link nếu phù hợp |
| GET | `/api/auth/verify-email` | `token`, `callbackURL` | Kiểm link, cập nhật xác minh, redirect về callback của Web; giữ phiên tài khoản khác nếu có (SS-06) |
| POST | `/api/auth/request-password-reset` | `email`, `redirectTo` | `{ "status": true, "message": string }` giống nhau cho email có hoặc không có tài khoản (RP-03) |
| GET | `/api/auth/reset-password/:token` | Path token, query `callbackURL` | Link trong email; redirect tới form Web kèm `token` hoặc `error=INVALID_TOKEN`, chưa đổi password |
| POST | `/api/auth/reset-password` | `token`, `newPassword` | `{ "status": true }`; đổi password, thu hồi session và các link reset còn lại |
| POST | `/api/auth/sign-in/social` | `provider: "google"`, `callbackURL`, `errorCallbackURL` | Trả URL và thông tin redirect để trình duyệt mở Google |
| GET, POST | `/api/auth/callback/google` | Tham số phản hồi OAuth, gồm `code`, `state` hoặc lỗi | Better Auth hoàn tất OAuth, tạo session khi hợp lệ, redirect về Web |
| POST | `/api/auth/sign-out` | Cookie session nếu có | Kết thúc phiên hiện tại và xóa cookie; Web xóa cache sau response thành công |

Các endpoint bắt đầu đăng nhập, gửi email và kiểm link không yêu cầu phiên đăng nhập sẵn; token/state và origin vẫn phải hợp lệ. `get-session` cho phép kiểm cả trạng thái chưa đăng nhập. Sign out sử dụng cookie của phiên cần kết thúc. Cookie, các trường token trả bởi thư viện và token trong path của link reset password không được log [[5]](#ref-5).

### Surface HTTP kế thừa từ Better Auth

Mount toàn bộ handler Better Auth cũng đăng ký các route không có UI tương ứng. Cấu hình hiện không khai báo `disabledPaths`; vì vậy bảng endpoint mà Web đang dùng không phải allowlist của API. Các nhóm dưới đây là surface thư viện, không phải tuyên bố các flow Settings đã được xây [[4]](#ref-4).

| Method | Path sau `/api/auth` | Điều kiện và phạm vi |
| --- | --- | --- |
| POST | `/get-session` | Method bổ sung của thư viện; Web hiện dùng GET |
| GET | `/list-sessions` | Session hợp lệ; liệt kê phiên |
| POST | `/revoke-session`, `/revoke-sessions`, `/revoke-other-sessions` | Session và kiểm tra tương ứng của thư viện; thu hồi phiên |
| POST | `/update-user`, `/update-session` | Session; cập nhật trường mà schema thư viện chấp nhận |
| POST | `/change-password`, `/verify-password` | Session và kiểm password; chưa có UI Settings sử dụng |
| GET | `/list-accounts`, `/account-info` | Session; truy cập thông tin provider/account |
| POST | `/link-social`, `/unlink-account`, `/get-access-token`, `/refresh-token` | Kiểm session/provider theo route thư viện; chưa có wrapper Web sử dụng |
| POST | `/change-email`, `/delete-user` | Route có đăng ký nhưng chức năng bị chặn bởi cấu hình mặc định chưa bật |
| GET | `/delete-user/callback` | Có kiểm cấu hình xóa tài khoản, hiện chưa bật |
| GET | `/ok`, `/error` | Route tiện ích của thư viện |

Đầu vào/đầu ra của surface kế thừa do schema route Better Auth sở hữu; nguồn route nằm trong `dist/api/index.mjs` và `dist/api/routes/`. `setPassword` là API server-only, không phải endpoint HTTP được đăng ký bằng path. Khi đưa một route kế thừa vào flow sản phẩm, cần xác định contract được ứng dụng sử dụng và kiểm lại cấu hình bảo mật của route đó [[4]](#ref-4).

### Lỗi và header

| Phạm vi | Contract |
| --- | --- |
| Better Auth | Lỗi thông thường có `code`, `message`; Web unwrap kết quả SDK thành `AuthRequestError` với `status`, `code`, `retryAfter`. Lỗi 429 có thể chỉ có `message`, nên `code` là optional |
| Rate limit | Status 429; `X-Retry-After` cho thời gian chờ. Wrapper Sign in đọc header này để UI xử lý giới hạn số lần |
| Router ứng dụng | Lỗi Market Data theo [bảng riêng](#lỗi-market-data). Lỗi `AppError` có `{ "error": { "code": string, "message": string } }`; route không tồn tại trả 404 với `NOT_FOUND`; lỗi không xác định trả 500 với `INTERNAL_ERROR` |
| Kiểm session của workspace | Request lỗi được Web chuyển thành trạng thái lỗi route 503; `null` được chuyển thành 401. Đây là status nội bộ của router Web, không phải khẳng định endpoint `get-session` luôn trả HTTP 401/503 |

Header chung do middleware API đặt; các thuộc tính cookie, origin, cache và reverse proxy được mô tả trong Security [[5]](#ref-5). Error envelope của Express không được áp đặt lên response Better Auth vì handler Auth xử lý request riêng [[2]](#ref-2).

## Realtime và job contracts

API khởi động `WebSocketServer` cho Market Data qua `attachMarketDataWs` trong `apps/api/src/index.ts`; tùy chọn `ws: true` của Vite cho phép proxy chuyển tiếp WebSocket cùng origin trong development [[2]](#ref-2) [[6]](#ref-6). Mục [Kênh WebSocket Market Data](#kênh-websocket-market-data) dưới đây mô tả contract đã triển khai của vòng WebSocket (ADR-009 đến ADR-011).

Worker mới khởi động pg-boss, chưa có job handler hoặc payload schema nghiệp vụ. HTTP response, event realtime và payload job là ba contract khác nhau; hiện chưa có contract tiến độ hoặc kết quả backtest được nối giữa chúng [[7]](#ref-7).

### Kênh WebSocket Market Data

Trạng thái: đã triển khai. Mọi schema thông điệp được định nghĩa bằng Zod strict trong `packages/shared` để API và Web dùng chung một nguồn contract.

#### Kết nối và bắt tay (HTTP Upgrade)

- **Endpoint:** `GET /api/market-data/ws` (nâng cấp `Upgrade: websocket`), cùng origin với Web (`wss://` bắt buộc trên môi trường production theo yêu cầu kết nối mã hóa MK-120; `ws://` trên development/test).
- **Xác thực và kiểm tra lúc upgrade:** chạy trước khi hoàn tất nâng cấp giao thức, theo thứ tự:
  1. Kiểm `Origin` khớp chính xác với origin của `BETTER_AUTH_URL` (MK-119). Thiếu hoặc sai `Origin` trả `HTTP/1.1 403 Forbidden` và đóng socket (0 khung WebSocket).
  2. Trên môi trường production, từ chối yêu cầu không đi qua TLS (MK-120) bằng `HTTP/1.1 403 Forbidden`.
  3. Kiểm phiên từ cookie qua `auth.api.getSession({ headers: fromNodeHeaders(req.headers) })` (ADR-010). Không có phiên hợp lệ trả `HTTP/1.1 401 Unauthorized` và đóng socket (0 khung dữ liệu, MK-118).
- **Giới hạn kết nối mỗi tài khoản (MK-142):** Sau khi xác thực hợp lệ, nếu số kết nối WebSocket đang mở của tài khoản đạt ngưỡng cấu hình trong [Security](23-security.md#quyết-định), server gửi ngay một khung `error` với mã `CONNECTION_LIMIT_EXCEEDED` và đóng socket bằng mã `4429` (không chấp nhận subscribe và không gửi dữ liệu thị trường). Cách này cho phép trình duyệt phân biệt giới hạn tab với lỗi mạng (mã `1006`) để hiển thị cảnh báo và dừng tự kết nối lại.

#### Thông điệp Client → Server

Mọi khung vượt kích thước tối đa quy định trong [Security](23-security.md#quyết-định) hoặc không phải JSON hợp lệ theo schema strict đều bị từ chối.

| `type` | Payload chính | Ý nghĩa và kiểm tra |
| --- | --- | --- |
| `subscribe` | `{ "type": "subscribe", "channels": MarketChannel[] }` | Đăng ký bổ sung một hoặc nhiều kênh. Mỗi `MarketChannel` là `{ "kind": "kline", "pair": MarketPair, "timeframe": MarketTimeframe }` hoặc `{ "kind": "summary", "pair": MarketPair }`. Tổng kênh hoạt động trên một kết nối chịu giới hạn số kênh trong [Security](23-security.md#quyết-định) |
| `unsubscribe` | `{ "type": "unsubscribe", "channels": MarketChannel[] }` | Hủy đăng ký các kênh không còn dùng (đổi timeframe một chart, ẩn chart hoặc đổi pair; MK-96, MK-97) |

Tốc độ thông điệp đến từ mỗi kết nối chịu giới hạn tốc độ quy định trong [Security](23-security.md#quyết-định) [[5]](#ref-5).

#### Thông điệp Server → Client

| `type` | Payload chính | Ý nghĩa và driver |
| --- | --- | --- |
| `subscribed` | `{ "type": "subscribed", "channels": MarketChannel[] }` | Xác nhận danh sách kênh hiện đang hoạt động của kết nối sau `subscribe` |
| `unsubscribed` | `{ "type": "unsubscribed", "channels": MarketChannel[] }` | Xác nhận danh sách kênh còn lại sau `unsubscribe` |
| `candle` | `{ "type": "candle", "pair": MarketPair, "timeframe": MarketTimeframe, "candle": Candle, "dataTime": number, "sourceTime"?: number }` | Cập nhật nến đang mở hoặc chốt nến đã đóng; tái sử dụng `candleSchema` của REST [[9, Nến]](#ref-9). `dataTime` là mốc nhận tại API (MK-27, MK-111, QA-05); `sourceTime` là mốc sự kiện của nguồn nếu có, chỉ dùng đo độ trễ và log (QA-14, MK-140) |
| `summary` | `{ "type": "summary", "summary": MarketSummary, "sourceTime"?: number }` | Cập nhật giá gần nhất và thay đổi 24 giờ cho sidebar; tái sử dụng `marketSummarySchema` có `dataTime` (MK-94, MK-111) |
| `heartbeat` | `{ "type": "heartbeat", "serverTime": number }` | Tín hiệu sống ứng dụng gửi định kỳ khi luồng upstream khỏe (nhịp gửi quy định trong [Chuyển giao lịch sử sang trực tiếp, reconnect và REST backfill](10-market-data.md#chuyển-giao-lịch-sử-sang-trực-tiếp-reconnect-và-rest-backfill)); Web dùng để đặt lại bộ đếm dữ liệu cũ (MK-98, MK-99), không thay đổi `dataTime` hiển thị của chart |
| `status` | `{ "type": "status", "upstream": "available" \| "unavailable", "resyncRequired": boolean, "serverTime": number }` | Báo trạng thái nguồn dữ liệu phía sau API. `unavailable` chuyển UI sang cảnh báo nguồn tạm thời không khả dụng (MK-130, MK-39); `available` kèm `resyncRequired: true` kích hoạt Web vào trạng thái đang đồng bộ và chạy REST backfill (MK-104 đến MK-106, QA-06) |
| `error` | `{ "type": "error", "code": WsErrorCode, "message": string }` | Lỗi giao thức hoặc giới hạn tài nguyên, dùng thông điệp chung không lộ chi tiết kỹ thuật (MK-39). `WsErrorCode` gồm: `INVALID_MESSAGE`, `SUBSCRIPTION_LIMIT_EXCEEDED`, `RATE_LIMITED`, `CONNECTION_LIMIT_EXCEEDED` |

#### Mã đóng kết nối (Close Codes)

| Close Code | Ý nghĩa | Hành vi phía Web |
| --- | --- | --- |
| `1000` | Đóng chủ động (tạm dừng cập nhật trực tiếp hoặc rời trang Realtime) | Giữ trạng thái tạm dừng (MK-108) hoặc giải phóng tài nguyên; không tự kết nối lại |
| `1001` | Server đang shutdown | Giữ dữ liệu gần nhất, báo mất kết nối và tự kết nối lại theo backoff (MK-100, MK-101, MK-122) |
| `1006` | Rớt mạng đột ngột hoặc bị từ chối ở bước HTTP upgrade | Nếu xảy ra khi đang mở kết nối, kiểm lại phiên qua `get-session`/revalidation để phát hiện từ chối `401` (MK-118, MK-40); nếu phiên còn hiệu lực thì tự kết nối lại theo backoff có jitter (MK-101, MK-122) |
| `4401` | Phiên hết hạn hoặc bị thu hồi trong lúc kết nối đang mở | Dừng cập nhật và dừng tự kết nối lại trong thời hạn cưỡng chế (MK-121); gọi `revalidate()` mở màn chặn đăng nhập (MK-40, MK-129) |
| `4429` | Vượt giới hạn số tab đồng thời (MK-142) hoặc vượt giới hạn tốc độ thông điệp | Dừng tự kết nối lại; hiển thị cảnh báo vượt giới hạn tab đồng thời khi nhận `CONNECTION_LIMIT_EXCEEDED` hoặc cảnh báo vượt giới hạn tốc độ thao tác khi nhận `RATE_LIMITED`, giữ dữ liệu đã tải |
| `4008` | `SLOW_CONSUMER` — bộ đệm gửi phía server vượt ngưỡng (quyết định chuyển giao ADR-011, ngưỡng trong [Security](23-security.md#quyết-định)) | Tự kết nối lại và chạy đồng bộ bù nến qua REST (MK-104, MK-105) |

## Quyết định

| Hạng mục | Quyết định |
| --- | --- |
| Quyền sở hữu route | Better Auth sở hữu `/api/auth/*`; router Express của ứng dụng sở hữu `/api/health`, `/api/auth-config`, `/api/market-data/*`; WebSocket Gateway sở hữu upgrade `/api/market-data/ws` |
| Callback | URL callback backend thuộc `/api/auth/*`; route form `/reset-password` và route `/sign-up/verify` là Web UI, không thay thế endpoint kiểm token |
| Cấu hình Google | API trả capability công khai; Auth layout dùng false nếu không đọc được cấu hình, không suy ra secret từ phía client |
| Truy cập Market Data | Cả REST và WebSocket đều yêu cầu phiên hợp lệ. Endpoint công khai sẽ biến API thành proxy miễn phí tới Binance |
| Số nến REST | Server quyết định, không nhận từ query |
| Vai trò song song REST và WebSocket | REST phục vụ lịch sử đầu, đổi lựa chọn khi tạm dừng và backfill; WebSocket phục vụ cập nhật trực tiếp và tín hiệu đồng bộ; cả hai dùng chung `candleSchema` và `marketSummarySchema` (ADR-009) |

## Rủi ro

- Khi nâng Better Auth, cần đối chiếu lại route, error shape và wrapper Web; bảng endpoint không thay thế schema/runtime validation của thư viện.
- Chưa có API nghiệp vụ Strategy/Backtest; các tab workspace không chứng minh API tương ứng đã tồn tại.
- Surface mặc định của thư viện rộng hơn các route mà Web đang dùng; khi đổi cấu hình hoặc nâng version cần kiểm cả route kế thừa, không chỉ wrapper frontend.
- Trình duyệt ẩn mã HTTP khi HTTP upgrade WebSocket bị từ chối (chỉ báo mã đóng `1006` trong JavaScript); vì vậy từ chối `401` lúc mở kết nối cần Web kiểm lại phiên để chuyển màn chặn đăng nhập thay vì lặp reconnect vô ích.

## References

1. <a id="ref-1"></a>[Authentication](../UCs/authentication.md)
2. <a id="ref-2"></a>[Express app](../../apps/api/src/app.ts), [API router](../../apps/api/src/api/routes/index.ts), [Health route](../../apps/api/src/api/routes/health.route.ts), [Auth config route](../../apps/api/src/api/routes/auth-config.route.ts), [Error handler](../../apps/api/src/api/middlewares/error-handler.middleware.ts) và [API bootstrap](../../apps/api/src/index.ts)
3. <a id="ref-3"></a>[Web Auth API](../../apps/web/app/api/auth.ts), [Shared Auth schemas](../../packages/shared/src/schemas/auth.schema.ts) và [Auth layout](../../apps/web/app/routes/auth-layout.tsx)
4. <a id="ref-4"></a>[Auth config](../../apps/api/src/configs/auth.ts); route và rate limiter của Better Auth cài trong workspace tại `apps/api/node_modules/better-auth/dist/api/`.
5. <a id="ref-5"></a>[Security](23-security.md)
6. <a id="ref-6"></a>[Vite config](../../apps/web/vite.config.ts)
7. <a id="ref-7"></a>[Worker bootstrap](../../apps/worker/src/index.ts)
8. <a id="ref-8"></a>[Web Market Data API](../../apps/web/app/api/market-data.ts)
9. <a id="ref-9"></a>[Market Data & Realtime Updates](10-market-data.md)
10. <a id="ref-10"></a>[API package manifest](../../apps/api/package.json) và [Lockfile](../../pnpm-lock.yaml) tại commit `0dd67c9`
