# Kiểm chứng WebSocket cập nhật trực tiếp

Đọc file này để biết test basis, đối chiếu chuẩn bảo mật, public interfaces kiểm thử, ma trận kịch bản, bộ dữ liệu tham chiếu, protocol so sánh hiệu năng và kịch bản chẩn đoán cho vòng WebSocket của Market Data.

## Test basis và phạm vi

Test basis nội bộ được đọc tại commit `e819628` (đã chốt thiết kế WebSocket và xem lại REST). Expected result lấy từ use case [[1]](#ref-1), quality attributes [[2]](#ref-2) và thiết kế kiến trúc đã duyệt (quyết định WebSocket đa kênh ADR-009, xác thực cookie/thu hồi theo lô ADR-010, chuyển giao lịch sử và client chậm ADR-011) [[3]](#ref-3) [[4]](#ref-4) [[5]](#ref-5) [[6]](#ref-6) [[7]](#ref-7), không lấy từ hành vi polling hiện có trong code.

| Phân loại | Requirement hoặc gap | Cách dùng làm expected result |
| --- | --- | --- |
| Cập nhật trực tiếp và đóng nến | Cập nhật nến mở, volume, MA, `dataTime`, giá sidebar và chốt nến mở nến mới (MK-93 đến MK-95) | Giá trị OHLCV/MA/summary khớp bộ dữ liệu tham chiếu, bỏ nhãn đang mở và MA tạm khi `isClosed` chuyển `true`, giữ tối đa 500 nến (MK-67) |
| Đổi lựa chọn, nhiều chart và nhiều tab | Đổi timeframe độc lập, đổi pair, đổi liên tiếp, hai chart cùng timeframe, nhiều tab độc lập, reload về mặc định và giới hạn 4 tab mỗi tài khoản (MK-96, MK-97, MK-123 đến MK-125, MK-132, MK-142) | Chênh lệch `unsubscribe`/`subscribe` chính xác, 0 cập nhật rơi ở chart khác, 0 cập nhật pair cũ, tab thứ 5 nhận `CONNECTION_LIMIT_EXCEEDED` và mã đóng `4429` mà không ngắt 4 tab cũ |
| Dữ liệu cũ, mất kết nối và phục hồi | Ngưỡng dữ liệu cũ 15 giây, đặt lại luồng 30 giây, giữ dữ liệu, báo mất kết nối, kết nối lại thủ công và khóa nút, trần tự thử lại 120 giây, nguồn Binance lỗi (MK-98 đến MK-103, MK-122, MK-130) | Chuyển trạng thái đúng biên đồng hồ đơn điệu, giữ dữ liệu và `dataTime` cũ, không lộ chi tiết kỹ thuật (MK-39) |
| Đồng bộ bù nến và toàn vẹn dữ liệu | Đang đồng bộ, bù đủ nến đóng thiếu, trực tiếp sau đồng bộ xong, đồng bộ lỗi từng phần, không trùng `openTime`, không lùi `dataTime` cả chart lẫn sidebar, loại bỏ cập nhật sai, chart lỗi tải đầu không vẽ nến lẻ (MK-104 đến MK-106, MK-110, MK-111, MK-127, MK-128, MK-131) | Đối chiếu 0 nến đóng thiếu, 0 nến trùng, 0 lệch OHLCV; không lấp khoảng trống thật (MK-35); không báo đang trực tiếp trước khi mọi chart và sidebar đồng bộ xong |
| Tạm dừng, tiếp tục và tab ẩn hiện | Tiếp tục đồng bộ trong 1 giây, không báo mất kết nối khi tạm dừng, đổi lựa chọn khi tạm dừng chỉ gọi REST, tab ẩn hiện lại đồng bộ khi bỏ lỡ dữ liệu (MK-107 đến MK-109, MK-126) | Tạm dừng đóng sạch mã `1000`, giữ nhãn tạm dừng (MK-74); tiếp tục hoặc tab hiện lại kích hoạt quy trình đồng bộ đúng guard |
| Accessibility và giữ ngữ cảnh xem | Nhãn chữ cho 7 trạng thái kết nối/đồng bộ, thông báo screen reader đúng 1 lần mỗi chuyển trạng thái, giữ vùng xem, theo nến cuối, giữ focus và tooltip (MK-112 đến MK-117) | Khai báo role/status/nhãn chữ qua Playwright và kiểm trực quan trục thời gian/hover; giữ quyết định ngày 2026-11-21 không kiểm bằng phần mềm screen reader [[8, E2E và phần kiểm thủ công]](#ref-8) |
| Bảo mật và cưỡng chế phiên | Thiếu phiên từ chối, kiểm `Origin`, bắt buộc `WSS` production, dừng cập nhật và dừng tự kết nối lại trên mọi tab trong 5 giây khi phiên hết hạn/thu hồi (MK-118 đến MK-121, MK-129) | HTTP 403/401 ở bước upgrade với 0 khung WS, đóng mã `4401` trong 5 giây qua hook thu hồi và kiểm tra theo lô, mở màn chặn đăng nhập (MK-40) |
| Kế thừa vòng REST và polling | Tải lịch sử, MA(20), định dạng 2 chữ số thập phân, 0 lấp khoảng trống, màn hình hẹp 320 px, lỗi không lộ chi tiết (MK-01 đến MK-62, MK-67 đến MK-78) | Regression suite REST tải lịch sử tiếp tục chạy độc lập; thay đổi `MarketSummary.dataTime` là mở rộng additive vào contract REST |
| Gap Closed | Dữ liệu cũ, đồng bộ, tạm dừng, nến trùng/sai, bảo mật, giới hạn tab, accessibility (MK-133 đến MK-139) | Truy về 41 rule Confirmed tương ứng, không tách thành test độc lập |
| Gap Accepted | Lệch đồng hồ thiết bị ±60 giây (MK-140) và không hiển thị số ms độ trễ trên UI (MK-141) | Kiểm ngưỡng dữ liệu cũ dùng đồng hồ đơn điệu không phụ thuộc lệch đồng hồ thiết bị; kiểm UI không hiển thị số ms độ trễ giả |

Các kịch bản chất lượng thuộc phạm vi kiểm chứng:

| ID | Nội dung mục tiêu | Cách kiểm chứng và điều kiện kết luận |
| --- | --- | --- |
| QA-05 | Backend-to-chart latency p95 dưới 1 giây | Đo trong protocol so sánh tải đồng thời từ lúc API nhận frame tới lúc chart vẽ dữ liệu mới |
| QA-06 | Kết nối lại trong 30 giây và 0 nến đóng thiếu khi kết nối Binance bị đóng | Test tích hợp `BinanceStreamProvider` + `MarketDataStreamHub` và kịch bản ngắt upstream trên replay WS |
| QA-09 | Thêm provider dữ liệu trực tiếp thứ hai với 0 file frontend thay đổi | Test ranh giới qua interface `MarketDataStreamProvider` giả lập; kiểm ESLint dependency boundaries |
| QA-14 | Source-to-chart delay p95 dưới 1,5 giây trên cùng workload với polling | Protocol so sánh A (REST polling vs WebSocket); cần bằng chứng paint của canvas mới kết luận `Passed`, thiếu paint ghi `Inconclusive` |
| QA-15 | Ít nhất 50 client đồng thời thỏa 0 nến sai, backend-to-chart latency p95 < 1 giây, tối đa 1 kết nối nguồn mỗi `(pair, timeframe)` | Protocol so sánh B (trước vs sau shared subscriptions) với máy hoặc tiến trình phát tải tách khỏi API/DB |
| QA-16 | Phục hồi đồng bộ p95 dưới 10 giây sau ngắt mạng 30 giây đến 5 phút | Kịch bản ngắt mạng có kiểm soát lặp lại; đo từ mốc mạng khôi phục tới mốc chart vừa bù đủ nến đóng vừa áp dụng cập nhật mới ở trạng thái đang trực tiếp |
| QA-17 | 0 nến đóng thiếu, 0 nến trùng `openTime`, 0 nến đóng lệch OHLCV sau trực tiếp và phục hồi | Đối chiếu tự động từng nến đóng với bộ dữ liệu tham chiếu cố định sau chuỗi trùng/đến muộn/sai định dạng và ngắt kết nối |

## Đối chiếu nguyên văn OWASP ASVS 5.0 V4.4 và WCAG 2.2

Đã đọc trực tiếp file nguyên văn OWASP ASVS 5.0 `0x13-V4-API-and-Web-Service.md` (chương V4 API and Web Service, mục V4.4 WebSocket) ngày 2026-11-23 [[14]](#ref-14). Kết quả đối chiếu xác nhận toàn bộ điều kiện áp dụng của thiết kế xác thực WebSocket bằng cookie phiên (ADR-010) [[7, ADR-010]](#ref-7):

| Mục ASVS 5.0 | Mức | Nguyên văn yêu cầu (tóm tắt sát bản gốc tiếng Anh) | Áp dụng cho Crypto Force |
| --- | --- | --- | --- |
| V4.4.1 | L1 | Mọi kết nối WebSocket phải dùng WebSocket qua TLS (`WSS`) | Áp dụng trên production (MK-120): kiểm giao thức kết nối mã hóa từ reverse proxy (`X-Forwarded-Proto: https`) lúc HTTP upgrade, từ chối bằng HTTP 403 nếu không mã hóa; Web tạo URL `wss:` khi `location.protocol === 'https:'` |
| V4.4.2 | L2 | Trong bước HTTP WebSocket handshake ban đầu, phải kiểm tra header `Origin` với danh sách origin được phép của ứng dụng | Áp dụng ở mọi môi trường kể cả `NODE_ENV=test` (MK-119): kiểm khớp chính xác origin của `BETTER_AUTH_URL`, thiếu hoặc sai `Origin` trả HTTP 403 với 0 khung WS |
| V4.4.3 | L2 | Nếu không thể dùng cơ chế quản lý phiên chuẩn của ứng dụng, phải dùng token riêng tuân thủ yêu cầu Session Management | Không áp dụng do quyết định xác thực cookie phiên (ADR-010) tái sử dụng cookie phiên `HttpOnly`/`SameSite`/`Secure` chuẩn của Better Auth trên cùng origin. Sẽ mở lại nếu tách WebSocket sang domain khác |
| V4.4.4 | L2 | Token WebSocket riêng phải được cấp hoặc xác thực ban đầu qua phiên HTTPS đã xác thực trước đó | Không áp dụng do quyết định xác thực cookie phiên (ADR-010, cùng lý do với V4.4.3). Giữ ràng buộc không có luồng đăng nhập bên trong kênh WebSocket |
| V4.1.3 *(liên quan)* | L2 | Header HTTP do lớp trung gian đặt (`X-Forwarded-*`, `X-Real-IP`) không được để người dùng cuối ghi đè | Ràng buộc triển khai reverse proxy đã ghi trong thiết kế bảo mật [[6, Rủi ro]](#ref-6): không kiểm được bằng test local đơn tiến trình, ghi thành điều kiện deploy |

Đối chiếu WCAG 2.2 cho phần bổ sung của vòng WebSocket (đã đọc nguyên văn SC 1.4.1, 2.1.1, 2.4.7 ngày 2026-11-20; SC 2.2.2 ngày 2026-11-22; SC 4.1.3 ngày 2026-11-23) [[9]](#ref-9) [[10]](#ref-10):

| SC và mức | Đối chiếu requirement WebSocket | Phạm vi kiểm và giới hạn |
| --- | --- | --- |
| 1.4.1 Use of Color — A | Mọi 7 trạng thái kết nối và đồng bộ có nhãn chữ riêng (MK-112) | Kiểm text hiển thị và thuộc tính DOM của từng trạng thái trong E2E |
| 2.1.1 Keyboard — A, 2.4.7 Focus Visible — AA | Giữ focus bàn phím khi nhận cập nhật trực tiếp (MK-116), thao tác tạm dừng/tiếp tục/kết nối lại/đồng bộ lại dùng được bằng bàn phím | Kiểm điều hướng bàn phím và `document.activeElement` trong E2E và kiểm trực quan focus ring |
| 2.2.2 Pause, Stop, Hide — A | Tạm dừng/tiếp tục cập nhật trực tiếp, tiếp tục đồng bộ trong 1 giây (MK-73, MK-107, MK-108) | Kiểm hành vi nút điều khiển và thời hạn đồng bộ |
| 4.1.3 Status Messages — AA | Thông báo chuyển trạng thái kết nối/đồng bộ không chuyển focus; không thông báo tick thường và không lặp theo mỗi lượt tự thử lại (MK-113) | Kiểm MutationObserver trên vùng `role="status"`/`role="alert"` và cây accessibility Chromium; không kiểm tiếng đọc screen reader theo quyết định ngày 2026-11-21 [[8]](#ref-8) |

## Chênh lệch với source hiện tại

Kiểm trực tiếp source tại commit `e819628` ngày 2026-11-23:

| Nơi đã đọc | Hiện trạng tại commit `e819628` | Bước 12 phải triển khai |
| --- | --- | --- |
| `packages/shared/src/schemas/market-data.schema.ts`, `env.schema.ts` [[15]](#ref-15) | `marketSummarySchema` chưa có `dataTime`; chưa có schema khung WS; `apiEnvSchema` chưa có `DATABASE_POOL_MAX`, `WS_MAX_CONNECTIONS_PER_USER`, `BINANCE_WS_URL` | Bổ sung `dataTime` cho `marketSummarySchema`, xuất các schema khung WS mà production sử dụng và 3 biến môi trường mới qua public exports của `@crypto-force/shared` |
| `apps/api/src/providers/market-data/` [[16]](#ref-16) | `market-data-provider.ts` mới có `MarketDataProvider`; `binance.provider.ts` chưa trả `dataTime` cho `getSummary`; `cached-market-data.provider.ts` chưa có `invalidateCandles`; chưa có `binance-stream.provider.ts` | Thêm `MarketDataStreamProvider`, bổ sung `dataTime` cho `getSummary`, thêm `invalidateCandles(pair, timeframe)` cho cache decorator, tạo `binance-stream.provider.ts` |
| `apps/api/src/repositories/`, `services/`, `api/ws/` | Chưa có `session.repository.ts`, `ws-session.service.ts`, `market-data-stream.service.ts`, `api/ws/market-data.ws.ts` | Tạo bốn module theo đúng phân tầng trong thiết kế Market Data [[3, Thành phần và ranh giới]](#ref-3) |
| `apps/api/src/configs/auth.ts`, `database/client.ts`, `index.ts` [[17]](#ref-17) | `createAuth` chưa có callback `onSessionRevoked` trong `databaseHooks.session.delete.after`; `createDatabase` chưa truyền `max`; `index.ts` chưa gắn WebSocket server và đóng WS mã `1001` khi shutdown | Nối callback thu hồi phiên, cấu hình `max` từ `DATABASE_POOL_MAX` (mặc định 20), gắn WS gateway và cập nhật trình tự graceful shutdown |
| `eslint.config.js` [[18]](#ref-18) | Rule `noDatabaseAccess` mới áp dụng cho `api/routes/**/*.ts` và `api/controllers/**/*.ts` | Mở rộng `noDatabaseAccess` cho `apps/api/src/api/ws/**/*.ts` |
| `apps/web/app/hooks/useMarketData.ts`, `useRealtimeWorkspace.ts`, `api/market-data.ts` [[19]](#ref-19) | Còn dùng `refetchInterval: 5000` polling; chưa có `api/market-data-ws.ts`, chưa có hàm thuần hợp nhất nến trong `app/utils/`, chưa có 7 trạng thái kết nối/đồng bộ | Thay vòng lặp polling bằng WS client + bộ đệm + hàm hợp nhất thuần + REST backfill và UI trạng thái kết nối/đồng bộ |

## Public interfaces và seams đã duyệt

**Trạng thái: Confirmed (product owner duyệt toàn bộ `S1` đến `S7` ngày 2026-11-23).** Các seam này được thiết kế trên cơ sở kiến trúc đã duyệt [[3]](#ref-3) [[4]](#ref-4) [[6]](#ref-6), tuân thủ quy tắc Testware [[11]](#ref-11): chỉ xuất symbol có caller production thật (vượt qua `pnpm check:exports` / `knip --production`), không thêm tham số ghi đè ngưỡng sản phẩm chỉ để test (dùng Vitest fake timers và boundary input thật), không thêm cờ benchmark vào code production và không mock module của app.

| ID | Seam / điểm kiểm thử | Interface đã chốt | Nguồn, lý do và tác động so với hiện tại | Dependency thay được | Lỗi bắt được / Phần không chứng minh được |
| --- | --- | --- | --- | --- | --- |
| S1 | Shared WS & Summary contract | `packages/shared/src/index.ts`: mở rộng `marketSummarySchema` (+ `dataTime`), mở rộng `apiEnvSchema` (+ `DATABASE_POOL_MAX`, `WS_MAX_CONNECTIONS_PER_USER`, `BINANCE_WS_URL`), xuất `wsClientMessageSchema` và `wsServerMessageSchema` (cùng các type suy ra cho caller thật). Không xuất schema con chỉ dùng nội bộ để giữ `pnpm check:exports` sạch | Agent đề xuất từ hợp đồng WS và biến môi trường đã duyệt [[4]](#ref-4) [[6]](#ref-6). Tác động: mở rộng additive lên `marketSummarySchema` yêu cầu cập nhật `binance.provider.ts` và fixture summary REST ở Bước 12 | Input literal, không I/O | Bắt lỗi enum, key thừa (`strictObject`), `openTime` lệch mốc trong sự kiện `candle`, `dataTime`, biên env. Không chứng minh runtime có gọi schema |
| S2 | Cache invalidation theo nến đóng | `providers/market-data/cached-market-data.provider.ts`: `createCachedMarketDataProvider(...)` trả `CachedMarketDataProvider` mở rộng `MarketDataProvider` thêm `invalidateCandles(pair: MarketPair, timeframe: MarketTimeframe): void` | Agent đề xuất từ quyết định vô hiệu hóa cache theo nến đóng (ADR-011) [[7]](#ref-7). Tác động: chỉ composition root gọi qua callback `onCandleClosed`, `services/` không import file cache decorator | Provider giả lập, clock `now`, `ttlMs` | Bắt lỗi không xóa cache khi có nến đóng hoặc xóa nhầm khóa khác / summary. Không chứng minh composition root nối callback đúng |
| S3 | Binance WS stream adapter | `providers/market-data/binance-stream.provider.ts`: `createBinanceStreamProvider({ wsUrl, now, logger, createWebSocket?, random? }): MarketDataStreamProvider` (`subscribe`, `unsubscribe`, `onCandle`, `onSummary`, `onStatus`, `close`). Giữ cố định trong implementation các mốc đã duyệt (xoay 23h50m, backoff 1s→15s, ≤ 5 lệnh/giây) và kiểm bằng Vitest fake timers | Agent đề xuất từ interface stream đã chốt [[3, Provider và cách thay thế]](#ref-3). Lý do: không lộ tham số ghi đè ngưỡng ra public API; chỉ tiêm boundary WS, clock và `random` cho full jitter tất định. Tác động: thêm module adapter mới trong `providers/market-data/` | Local fake WS server (`ws`) hoặc `createWebSocket`, clock `now`, `random` cố định, fake timers | Bắt lỗi mapping kline/ticker, micro-batch ≤ 5 lệnh/s, ping/pong, xoay 23h50m, backoff 1s→15s, frame hỏng, phát `unavailable`/`available + resyncRequired`. Không chứng minh thay đổi phía Binance thật |
| S4 | Shared subscription hub | `services/market-data-stream.service.ts`: `createMarketDataStreamHub({ streamProvider, onCandleClosed, now, logger })` trả `subscribe(clientId, channel, sink)`, `unsubscribe(clientId, channel)`, `removeClient(clientId)`, `close()`. Giữ cố định trễ hủy 5s và nhịp log tổng hợp 10s đã duyệt; kiểm bằng fake timers | Agent đề xuất từ thiết kế Hub và ranh giới layer [[3, Shared subscriptions và fan-out]](#ref-3). Lý do: không thêm cờ benchmark vào production (tách chế độ Trước/Sau bằng 2 commit trong `W2`). Tác động: thêm service mới chỉ import `market-data-provider.ts` | Fake `MarketDataStreamProvider`, spy `onCandleClosed`, logger thu structured logs, `now`, fake timers | Bắt lỗi ref-count 0→1 (1 stream upstream cho N client), giữ 5s, gọi `onCandleClosed`, validate khung bằng `wsServerMessageSchema`, single-serialize fan-out, log 10s. Không chứng minh HTTP upgrade hay backpressure socket |
| S5 | WebSocket session service & repository | `repositories/session.repository.ts`: `createSessionRepository(db)` (`findByIds(ids: string[])`). `services/ws-session.service.ts`: `createWsSessionService({ sessionRepository, now })` (`findExpiredOrRevoked(active: { sessionId: string; expiresAt: number }[])`) | Agent đề xuất theo phân tầng `api/ws/` → `services/` → `repositories/` → `database/` (ADR-010) [[7]](#ref-7). Lý do: bảo vệ rule `noDatabaseAccess` cho `api/ws/`. Tác động: thêm 1 repository và 1 service mới | PostgreSQL test DB thật cho repository; fake repository hoặc DB thật + `now` cho service | Bắt lỗi truy vấn lô `WHERE id IN (...)`, biên hết hạn `<= now` và phiên xóa ngoài process. Không chứng minh hook Better Auth hay đóng mã `4401` |
| S6 | WebSocket Gateway & Auth hook | `api/ws/market-data.ws.ts`: `attachMarketDataWs({ server, auth, wsSessionService, streamHub, allowedOrigin, requireTls, maxConnectionsPerUser, logger, now })` trả `{ revokeSession(sessionId), close() }`; mở rộng `createAuth({ ..., onSessionRevoked? })`. Giữ cố định các ngưỡng đã duyệt (10 kênh, 4 KB, 20 msg/10s, 64 KB, 5s heartbeat, 1s/3s kiểm phiên) và kiểm bằng fake timers + input biên thật | Agent đề xuất từ hợp đồng WS và bảo mật đã duyệt [[4]](#ref-4) [[6]](#ref-6). Lý do: chỉ nhận dependency và cấu hình môi trường thật (`allowedOrigin`, `requireTls`, `maxConnectionsPerUser`), không mở 8 tham số ghi đè ngưỡng chỉ để test. Tác động: mở rộng tùy chọn `onSessionRevoked` của `createAuth` và mở rộng rule `noDatabaseAccess` cho `api/ws/**/*.ts` | HTTP server thật, Better Auth + PostgreSQL test DB thật, fake `MarketDataStreamProvider` (hoặc local replay WS server), client `ws` thật, fake timers | Bắt lỗi thứ tự upgrade (`Origin` 403 → `WSS` 403 → phiên 401), 4 tab `4429`, 10 kênh, 4 KB, 20 msg/10s `4429`, `heartbeat` 5s, `SLOW_CONSUMER` `4008`, thu hồi `4401` ≤ 5s, shutdown `1001`, không log cookie/query. Không chứng minh UI và Vite proxy |
| S7 | Web pure merge & E2E flow | `apps/web/app/utils/market-candle-merge.ts`: `mergeCandleEvent(history, event)` và `reconcileSnapshotWithBuffer(snapshot, bufferedEvents)` (được `useMarketData` gọi trực tiếp); E2E `apps/web/e2e/market-data/websocket-live.spec.ts` qua API, Auth, DB thật và replay HTTP+WS cục bộ | Agent đề xuất từ quyết định viết hàm hợp nhất dạng thuần trong `app/utils/` (ADR-011) [[3]](#ref-3) [[7]](#ref-7). Lý do: tách logic biên nến khỏi DOM để kiểm đủ bảng quyết định, dùng E2E kiểm nối luồng đầy đủ. Tác động: thêm 1 util thuần trong `apps/web/app/utils/` và 1 config/spec E2E mới | Input literal cho hàm thuần; replay HTTP+WS cục bộ cho E2E (tắt MSW, không intercept browser HTTP/WS) | Bắt lỗi hợp nhất nến mở/đóng/trùng/lùi/lệch biên/tràn đệm 50 event/cửa sổ 519; luồng người dùng đầy đủ, 7 trạng thái UI, nhiều tab, backfill, đối soát, accessibility. Không chứng minh mạng internet thật và tiếng đọc screen reader |

## Chọn level, type và technique

Lựa chọn dựa trên các rủi ro mất kết nối Binance (R-07), lệch contract (R-10), độ trễ realtime (R-12), bảo mật phiên (R-13), khó quan sát sự cố (R-15) và accessibility (R-16) trong Test Strategy [[12]](#ref-12):

| Nhóm hành vi | Rủi ro và lý do chọn level | Type | Technique và tiêu chí thiết kế |
| --- | --- | --- | --- |
| Khung WS, `MarketSummary.dataTime`, env | Sai trường phá vỡ cả API và Web; unit/component shared bắt nhanh không cần I/O | Functional, contract | EP (Each Choice) cho từng loại thông điệp và mã lỗi; BVA 3 giá trị cho giới hạn số nguyên (`DATABASE_POOL_MAX`, `WS_MAX_CONNECTIONS_PER_USER`) |
| Chuẩn hóa WS, xoay 24 giờ, backoff | Sai mapping hoặc mất reconnect làm dừng dữ liệu mọi client; component adapter qua fake WS server | Functional, resilience | State transition (`All transitions` cho vòng đời upstream), BVA 3 giá trị cho tốc độ 5 lệnh/giây và mốc 23h50m |
| Shared subscriptions, cache invalidation | Rò rỉ stream upstream hoặc lệch OHLCV biên đóng nến; component Hub và Cache decorator | Functional, data integrity, resilience | State transition ref-count (0→1→2→1→0), BVA 3 giá trị cho trễ hủy 5000 ms (4999/5000/5001) |
| Handshake bảo mật, thu hồi phiên, giới hạn tài nguyên | Lỗ hổng CSWSH, rò rỉ dữ liệu sau thu hồi phiên, cạn RAM; integration Gateway + Auth + DB thật | Security, functional, resilience | Decision table (mọi tổ hợp khả thi cho upgrade), STRIDE threat model + checklist nguyên văn ASVS 5.0 V4.4, BVA 3 giá trị cho 4 tab (3/4/5), 10 kênh (9/10/11), 4096 bytes (4095/4096/4097), 20 msg/10s (19/20/21), 64 KB (65535/65536/65537), thu hồi ≤ 5000 ms |
| Hợp nhất nến, biên đóng nến và đệm | Rơi nến đóng hoặc nhân đôi nến làm vi phạm toàn vẹn OHLCV (QA-17); unit hàm thuần phía Web | Functional, data integrity | Decision table hợp nhất (trạng thái nến cuối × vị trí `openTime` × `isClosed` × `dataTime`), BVA 3 giá trị cho đệm 50 event (49/50/51) và cửa sổ 500/519 nến |
| Vòng đời đồng bộ UI, nhiều tab, ngắt mạng, accessibility | Lỗi phối hợp WS + REST backfill chỉ lộ ở full flow; system/E2E qua API thật | Functional, resilience, accessibility | Scenario testing (main, alternative, exception), State transition (`All transitions` cho trạng thái tab và từng slot chart), WCAG 2.2 checklist |
| Hiệu năng so sánh và chẩn đoán timeline | Không chứng minh được từ test chức năng/clock giả; benchmark tách tải và fault injection | Performance, observability | Performance workload modeling (kiểm Little's Law), fault injection 3 nguyên nhân |

### Bảng chuyển trạng thái (State Transitions)

Các trạng thái, sự kiện và tham số thời gian trong hai bảng dưới lấy từ thiết kế vòng đời kết nối [[5, Kết nối upstream Binance WebSocket]](#ref-5), thiết kế luồng realtime [[3, Chuyển giao lịch sử sang trực tiếp, reconnect và REST backfill]](#ref-3) và hợp đồng khung WebSocket [[4, Kênh WebSocket Market Data]](#ref-4).

#### 1. Kết nối upstream Binance WebSocket (`BinanceStreamProvider`)

| Trạng thái trước | Sự kiện và guard | Trạng thái sau và hành động | Ghi chú invalid/bị chặn |
| --- | --- | --- | --- |
| `Nghỉ` | Có topic đầu tiên (`refCount: 0 → 1`) | `Đang mở`: mở WS tới combined stream | `unsubscribe` khi `Nghỉ`: bỏ qua an toàn, không mở kết nối |
| `Đang mở` | Socket mở thành công | `Đang nhận`: gửi `SUBSCRIBE` (gom ≤ 5 lệnh/giây), phát `status(available)` | — |
| `Đang mở` | Lỗi mở kết nối | `Chờ thử lại`: tăng `attempt`, hẹn backoff (1s → 15s full jitter [[3]](#ref-3)), phát `status(unavailable)` | — |
| `Đang nhận` | Nhận `kline`/`24hrTicker` hợp lệ | `Đang nhận`: chuẩn hóa và phát event cho Hub | Frame sai định dạng: loại bỏ, ghi log `warn`, giữ `Đang nhận` |
| `Đang nhận` | Hết topic (`refCount = 0`) quá 5000 ms [[3]](#ref-3) | `Nghỉ`: gửi `UNSUBSCRIBE`, đóng sạch kết nối | Có topic mới ở 4999 ms: hủy timer đóng, giữ `Đang nhận` |
| `Đang nhận` | Đạt 23h50m [[3]](#ref-3) hoặc nhận `serverShutdown` | `Xoay`: mở kết nối thay thế song song | Không phát `status(unavailable)` nếu kết nối cũ còn sống |
| `Xoay` | Kết nối mới đăng ký xong mọi topic | `Đang nhận`: chuyển luồng sang kết nối mới, đóng kết nối cũ, không phát `resyncRequired` | — |
| `Xoay` | Kết nối thay thế lỗi | `Chờ thử lại`: phát `status(unavailable)` khi kết nối cũ cũng đóng | — |
| `Đang nhận` | Đứt kết nối hoặc quá hạn im lặng | `Chờ thử lại`: phát `status(unavailable)`, đặt lịch backoff | — |
| `Chờ thử lại` | Hết backoff (`activeTopics > 0`) | `Đang mở`: mở lại, sau khi vào `Đang nhận` phát `status(available, resyncRequired: true)` | Hết backoff khi `activeTopics = 0`: chuyển về `Nghỉ`, không mở kết nối |
| Bất kỳ trạng thái | `close()` (API shutdown [[5]](#ref-5)) | Đã đóng: hủy mọi timer, đóng socket, không tự mở lại | `subscribe` sau `close()`: từ chối/bỏ qua, không mở socket mới |

#### 2. Trạng thái kết nối cấp tab và đồng bộ cấp chart phía Web

Tham chiếu trạng thái và mã đóng từ vòng đời Realtime [[5, Kết nối WebSocket và đồng bộ Realtime]](#ref-5) và hợp đồng WebSocket [[4, Mã đóng kết nối (Close Codes)]](#ref-4):

| Trạng thái tab | Sự kiện và guard | Trạng thái sau và hành động quan sát | Chuyển trạng thái bị chặn / lưu ý |
| --- | --- | --- | --- |
| `Khởi tạo` | Mở hoặc reload Realtime | `Đang đồng bộ`: mở WS, gửi `subscribe`, bật bộ đệm (tối đa 50 sự kiện/kênh [[3]](#ref-3)), gọi REST mặc định 4 chart + sidebar (MK-31, MK-78, MK-132) | — |
| `Đang đồng bộ` | Mọi chart hiển thị và sidebar hợp nhất xong, biên đóng nến hợp lệ | `Đang trực tiếp`: bỏ bộ đệm, áp thẳng event trực tiếp (MK-106) | Không báo `Đang trực tiếp` khi còn 1 chart đang đồng bộ (MK-104) |
| `Đang đồng bộ` | Một hoặc nhiều chart tải lần đầu lỗi | Chart lỗi vào `initial_error` kèm nút thử lại riêng, hủy subscribe kênh chỉ riêng chart đó dùng; chart còn lại vẫn trực tiếp (MK-12, MK-131) | Event trực tiếp cho chart ở `initial_error` bị bỏ qua |
| `Đang đồng bộ` | Một hoặc nhiều chart backfill lỗi (đã có dữ liệu cũ) | `Đồng bộ chưa xong`: chart lỗi giữ dữ liệu cũ, xóa bộ đệm, hiện cảnh báo và nút đồng bộ lại; chart khác vẫn trực tiếp (MK-127) | Không nối event mới qua khoảng trống |
| `Đang trực tiếp` | Không có tín hiệu hợp lệ / `heartbeat` ≥ 15000 ms (đồng hồ đơn điệu) | `Dữ liệu cũ`: giữ dữ liệu gần nhất, hiện nhãn dữ liệu cũ (MK-98, MK-140) | Frame sai định dạng không đặt lại đồng hồ tín hiệu sống (MK-128) |
| `Dữ liệu cũ` | Nhận event hợp lệ hoặc `heartbeat` trước 30000 ms | `Đang trực tiếp`: bỏ cảnh báo dữ liệu cũ (MK-98) | — |
| `Dữ liệu cũ` | Không có tín hiệu hợp lệ ≥ 30000 ms | `Mất kết nối, đang thử lại`: chủ động đóng socket, bắt đầu backoff Web→API 1s→16s full jitter [[3]](#ref-3) (MK-99) | — |
| `Đang trực tiếp` | Nhận khung `status(upstream: "unavailable")` khi socket Web↔API vẫn mở [[4]](#ref-4) | `Nguồn tạm thời không khả dụng`: giữ socket Web↔API mở, giữ dữ liệu gần nhất, hiện cảnh báo nguồn không khả dụng không lộ chi tiết kỹ thuật (MK-39, MK-130); **không** chạy backoff Web→API | Khác với mất kết nối Web↔API; chờ `status(available, resyncRequired: true)` từ server |
| `Nguồn tạm thời không khả dụng` | Nhận `status(upstream: "available", resyncRequired: true)` [[4]](#ref-4) | `Đang đồng bộ`: bật bộ đệm và chạy REST backfill bù nến đóng thiếu (MK-104, MK-105, MK-130) | Nếu trong lúc chờ nguồn hồi phục mà socket Web↔API cũng đóng (`1006`/`1001`), chuyển sang `Mất kết nối, đang thử lại` |
| `Đang trực tiếp` | Đóng kết nối Web↔API bằng mã `1001`, `1006` hoặc `4008` [[4]](#ref-4) | `Mất kết nối, đang thử lại`: giữ dữ liệu gần nhất, báo thời điểm mất kết nối, bắt đầu backoff 1s→16s (MK-100, MK-101, MK-122) | Nếu đóng `1006` ngay lúc upgrade: kiểm phiên để phát hiện `401` |
| `Mất kết nối, đang thử lại` | WS mở lại thành công (hoặc sự kiện `online` kích hoạt thử nhanh 0–500 ms rồi mở lại [[3]](#ref-3)) | `Đang đồng bộ`: gửi `subscribe`, bật bộ đệm và chạy REST backfill (MK-104, MK-105) | — |
| `Mất kết nối, đang thử lại` | Bấm kết nối lại thủ công trong lúc đang chờ backoff | Khởi chạy ngay lượt thử kết nối mới, hiện trạng thái đang kết nối lại và khóa nút trong lúc thử (MK-102, MK-103) | Bấm lặp lúc nút bị khóa: không gửi lượt thử chồng |
| `Mất kết nối, đang thử lại` | Hết thời hạn tự thử kết nối lại (`elapsed >= 120000 ms`, biên đã chốt trong `W11`) | `Mất kết nối hoàn toàn`: dừng tự thử lại, giữ nút kết nối lại thủ công (MK-122) | Các lượt thử lặp trong cùng trạng thái không phát thông báo screen reader mới (MK-113) |
| `Mất kết nối hoàn toàn` | Bấm kết nối lại thủ công | `Mất kết nối, đang thử lại`: khóa nút trong lúc thử (MK-102, MK-103) | Bấm lặp lúc nút bị khóa: không gửi lượt thử chồng |
| `Đang trực tiếp` / `Dữ liệu cũ` / `Đang đồng bộ` / `Nguồn tạm thời không khả dụng` / `Mất kết nối` | Người dùng tạm dừng | `Đã tạm dừng`: đóng sạch WS mã `1000`, ghi thời điểm tạm dừng, không báo mất kết nối (MK-73, MK-74, MK-108) | Đổi pair/timeframe/số chart khi `Đã tạm dừng` chỉ gọi REST, giữ `Đã tạm dừng` (MK-109) |
| `Đã tạm dừng` | Người dùng tiếp tục | `Đang đồng bộ`: mở WS và bắt đầu đồng bộ trong ≤ 1000 ms (MK-107) | Tab ẩn hiện lại khi đang `Đã tạm dừng`: giữ `Đã tạm dừng`, không tự mở WS (MK-126) |
| `Đang trực tiếp` | Tab ẩn rồi hiện lại (guard: còn mới, không `resyncRequired`) | `Đang trực tiếp`: không gọi REST backfill thừa (MK-126) | Nếu đứt/cũ/`resyncRequired`: chuyển `Đang đồng bộ` trong ≤ 1000 ms |
| Bất kỳ trạng thái | Nhận mã đóng `4401` hoặc HTTP `401` [[4]](#ref-4) | `Phiên hết hạn`: dừng mọi cập nhật và mọi timer reconnect, gọi `revalidate()` mở màn chặn đăng nhập (MK-40, MK-121, MK-129) | Không tự kết nối lại sau `4401` |
| Bất kỳ trạng thái | Nhận `4429` (`CONNECTION_LIMIT_EXCEEDED` hoặc `RATE_LIMITED`) [[4]](#ref-4) | `Cảnh báo giới hạn`: dừng tự kết nối lại, hiện cảnh báo tương ứng, giữ dữ liệu đã tải (MK-142) | Không tự retry vô hạn trên mã `4429` |

### Decision Table: Bắt tay HTTP Upgrade `/api/market-data/ws`

Thứ tự kiểm tra và phản hồi lấy từ hợp đồng bắt tay WebSocket [[4, Kết nối và bắt tay (HTTP Upgrade)]](#ref-4) và thiết kế bảo mật [[6, Quyết định]](#ref-6). Bốn điều kiện kiểm tuần tự: `Origin` hợp lệ (O), kết nối mã hóa khi production (T), phiên hợp lệ (S), số kết nối tài khoản < giới hạn 4 (L). Các cột có điều kiện trước là `F` gộp điều kiện sau bằng `–` vì bước kiểm trước đã từ chối ngay; tổng 5 cột phủ đủ $2^4 = 16$ tổ hợp:

| Điều kiện / Hành động | R1 | R2 | R3 | R4 | R5 |
| --- | --- | --- | --- | --- | --- |
| `Origin` khớp `BETTER_AUTH_URL` (MK-119, V4.4.2) | F | T | T | T | T |
| Production có `WSS` / dev-test không yêu cầu TLS (MK-120, V4.4.1) | – | F | T | T | T |
| Cookie phiên Better Auth hợp lệ và chưa hết hạn (MK-118) | – | – | F | T | T |
| Số kết nối đang mở của tài khoản < 4 (MK-142) | – | – | – | F | T |
| Trả `HTTP 403` và đóng socket (0 khung WS, không gọi `getSession`) | X | X | | | |
| Trả `HTTP 401` và đóng socket (0 khung WS) | | | X | | |
| Nâng cấp 101, gửi `error` `CONNECTION_LIMIT_EXCEEDED` và đóng mã `4429` (0 dữ liệu, giữ các tab cũ) | | | | X | |
| Nâng cấp 101, cho phép `subscribe`, bật `heartbeat` và giám sát phiên | | | | | X |

### Decision Table: Hợp nhất event nến với lịch sử (`mergeCandleEvent` và biên chuyển giao)

Quy tắc hợp nhất lấy từ thiết kế xử lý nến trùng/đến muộn/biên đóng nến [[3, Xử lý nến trùng, đến muộn, sai định dạng và client chậm]](#ref-3) và quyết định chuyển giao (ADR-011) [[7, ADR-011]](#ref-7). Việc kiểm `openTime` đúng mốc timeframe thuộc `wsServerMessageSchema` (khung `candle` chứa cả `timeframe` và `candle`), không chỉ riêng `candleSchema` vì `candleSchema` không có trường `timeframe`:

| Điều kiện / Hành động | M1 | M2 | M3 | M4 | M5 | M6 | M7 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Event vượt qua `wsServerMessageSchema` (gồm OHLCV và mốc `openTime` theo `timeframe`) và khớp `(pair, timeframe)` | F | T | T | T | T | T | T |
| `event.dataTime >= current.dataTime` (MK-111) | – | F | T | T | T | T | T |
| Quan hệ `event.openTime` với nến cuối `last.openTime` | – | – | `<` | `==` (`last.isClosed=true`) | `==` (`last.isClosed=false`) | `>` (`last.isClosed=true`) | `>` (`last.isClosed=false`) |
| Loại bỏ event, giữ nguyên mảng nến và `dataTime` | X | X | X | X | | | |
| Cập nhật tại chỗ nến cuối (OHLCV, `isClosed`, `dataTime`) | | | | | X | | |
| Nối nến mới vào cuối, giữ tối đa 500 hiển thị + 19 warm-up, không chèn gap | | | | | | X | |
| Báo thiếu bản chốt nến cuối ở biên chuyển giao → yêu cầu lượt REST backfill mới (ADR-011) | | | | | | | X |

### STRIDE Threat Model cho bề mặt WebSocket

Các biện pháp bảo vệ tài nguyên (4 tab, 10 kênh, 4 KB, 20 msg/10s, 64 KB) và kiểm phiên định kỳ (1s bộ nhớ, 3s theo lô DB) tham chiếu từ thiết kế bảo mật đã duyệt [[6, Quyết định]](#ref-6):

| Mối đe dọa (STRIDE) | Tài sản và đường tấn công | Control và kịch bản kiểm |
| --- | --- | --- |
| **Spoofing (CSWSH / thiếu phiên)** | Trang web độc hại mở `new WebSocket('wss://.../api/market-data/ws')` mượn cookie trình duyệt (V4.4.2), hoặc gọi không cookie / cookie đã sign-out (MK-118) | Kiểm `Origin` trả 403 ở cả `NODE_ENV=test` (R1); thiếu/hết hạn/thu hồi cookie trả 401 với 0 khung dữ liệu (R3); không chấp nhận `ws://` khi `NODE_ENV=production` không có `X-Forwarded-Proto: https` (R2) |
| **Tampering** | Client gửi khung JSON hỏng, trường thừa, `pair`/`timeframe` ngoài enum, hoặc upstream phát nến `high < low`, `volume < 0`, `openTime` lệch mốc, hoặc `summary` có `lastPrice <= 0` | Gateway parse bằng `wsClientMessageSchema` strict, trả `error` `INVALID_MESSAGE`; Hub và Web validate bằng `wsServerMessageSchema` (gồm mốc `openTime` theo `timeframe` và `marketSummarySchema`), loại bỏ frame hỏng không vẽ và không đặt lại đồng hồ tín hiệu sống (MK-128) |
| **Repudiation** | Không có vết khi upgrade bị từ chối, client bị ngắt `4401`/`4429`/`4008`, hoặc upstream ngắt | Kiểm structured log của `MarketDataWsGateway`, `MarketDataStreamHub` và `BinanceStreamProvider` [[3, Observability]](#ref-3) có `path`, `closeCode`, `clientId` ẩn danh, `pair`/`timeframe` |
| **Information disclosure** | Lộ cookie/token/query trong log WS; lộ chi tiết lỗi/payload Binance ra khung `error`/`status`; phiên bị thu hồi vẫn nhận dữ liệu quá 5 giây | Kiểm log không chứa chuỗi cookie/token/query/payload sentinel; khung `error`/`status` chỉ mang thông điệp chung (MK-39, MK-130); kiểm thu hồi qua sign-out, reset password và xóa trực tiếp DB đóng mọi tab bằng `4401` trong ≤ 5 giây (MK-121) |
| **Denial of service** | Mở hàng chục tab bằng 1 tài khoản; gửi khung > 4 KB; spam `subscribe`/`unsubscribe`; subscribe > 10 kênh; mở socket nhưng ngừng đọc làm phình RAM server; lặp `unsubscribe`/`subscribe` làm chạm giới hạn 5 lệnh/giây của Binance | Kiểm biên 3/4/5 kết nối (`4429`), 9/10/11 kênh (`SUBSCRIPTION_LIMIT_EXCEEDED`), 4095/4096/4097 bytes, 19/20/21 msg/10s (`4429` + `RATE_LIMITED`), `bufferedAmount` > 64 KB (`4008`), giữ topic 5s và micro-batch upstream [[6, Quyết định]](#ref-6) |
| **Elevation of privilege** | Tài khoản có phiên hết hạn hoặc chưa đăng nhập lợi dụng shared subscription đang có sẵn của người dùng khác để đọc dữ liệu | Kiểm upgrade luôn chạy `getSession` trước khi gắn vào `MarketDataStreamHub` dù topic đã có subscriber đang hoạt động |

## Ma trận bao phủ requirement → kịch bản → test → evidence

Mọi file test ghi tên rút gọn theo bảng đầu ra trong kế hoạch Bước 11 [[23, Đầu ra dự kiến]](#ref-23).

| Requirement | Nội dung chính | Precondition và thao tác | Expected result | Level / File test dự kiến | Evidence cần lưu |
| --- | --- | --- | --- | --- | --- |
| MK-93 | Chart tự cập nhật trực tiếp không chờ chu kỳ | Mở mặc định, nguồn phát kline `5m` mới ở +300 ms | Nến mở, volume, MA và `dataTime` chart `5m` đổi ngay không chờ 5s; không phát REST mới | E2E `websocket-live.spec.ts` | Ledger 0 REST thêm, giá trị OHLCV/MA/dataTime |
| MK-94 | Sidebar tự cập nhật trực tiếp theo pair | Mở mặc định, nguồn phát `24hrTicker` BTCUSDT mới | `lastPrice` và `change24hPercent` trên sidebar cập nhật khớp nguồn | E2E `websocket-live.spec.ts` | Snapshot text sidebar khớp literal |
| MK-95 | Đóng nến hiện tại, mở nến kế tiếp, giữ 500 nến | Chart đang có 500 nến + 19 warm-up; nguồn gửi `isClosed: true` rồi nến kế tiếp `isClosed: false` | Nến cũ chốt bỏ nhãn đang mở/MA tạm; nến mới thêm vào, nến cũ nhất rời cửa sổ hiển thị, giữ 19 warm-up | Unit `market-candle-merge.test.ts`, E2E `websocket-live.spec.ts` | Length 519 (500 hiển thị), `openTime` đầu/cuối, nhãn UI |
| MK-96 | Đổi timeframe 1 chart không rơi cập nhật chart khác | 4 chart đang trực tiếp; đổi chart 1 từ `5m` → `1m` trong khi nguồn phát đều cho `15m`, `1h`, `4h` và summary | Chỉ gửi `unsubscribe(5m)` + `subscribe(1m)` và REST `1m`; 0 cập nhật bị rơi ở `15m`/`1h`/`4h`/sidebar | Integration `stream-hub.test.ts`, E2E `websocket-live.spec.ts` | Frame log WS và bộ đếm cập nhật trên 3 chart còn lại |
| MK-97 | Đổi pair chuyển luồng, 0 cập nhật pair cũ | Đang xem BTCUSDT, đổi sang ETHUSDT trong lúc nguồn vẫn đẩy tick BTCUSDT | Hủy mọi kênh BTCUSDT, tải lịch sử + subscribe ETHUSDT; 0 giá BTCUSDT xuất hiện dưới nhãn ETHUSDT | E2E `websocket-live.spec.ts` | Trace WS `unsubscribe` BTC, giá ETH +100 offset |
| MK-98 | Ngưỡng dữ liệu cũ 15 giây | Đang trực tiếp; ngừng phát event và `heartbeat` tại 14999/15000/15001 ms (clock đơn điệu), rồi phát lại `heartbeat` | 14999 ms vẫn trực tiếp; ≥ 15000 ms giữ dữ liệu gần nhất và hiện nhãn `Dữ liệu cũ`; có `heartbeat` quay lại `Đang trực tiếp` | E2E `websocket-live.spec.ts` | Trạng thái tại 3 biên clock, dữ liệu không mất |
| MK-99 | Ngưỡng đặt lại luồng 30 giây | Kéo dài im lặng qua 29999/30000/30001 ms | ≥ 30000 ms Web chủ động đóng socket và chuyển `Mất kết nối, đang thử lại`, mở kết nối mới | E2E `websocket-live.spec.ts` | Log đóng socket tại ≥ 30000 ms và lần mở lại |
| MK-100, MK-101 | Mất kết nối giữ dữ liệu, báo thời điểm và đang tự thử lại | Đang trực tiếp; ngắt kết nối WS từ server | Chart/sidebar giữ nguyên dữ liệu và `dataTime` gần nhất; hiện nhãn mất kết nối + thời điểm + đang thử lại | E2E `websocket-live.spec.ts` | DOM trạng thái, giá trị nến không bị xóa |
| MK-102, MK-103 | Kết nối lại thủ công (cả khi đang chờ backoff và khi mất kết nối hoàn toàn) và khóa nút khi đang chạy | Thử riêng hai trạng thái: (a) `Mất kết nối, đang thử lại` đang chờ backoff, và (b) `Mất kết nối hoàn toàn`; bấm nút kết nối lại trong khi lượt mở kết nối đang bị giữ | Ở cả hai trạng thái: khởi chạy ngay lượt thử mới, hiện trạng thái đang kết nối lại, nút bị disable không gửi lượt thử thứ hai cho tới khi xong | E2E `websocket-live.spec.ts` | Trạng thái `disabled` của nút, đếm số lần upgrade = 1 cho mỗi trạng thái |
| MK-104 | Phân biệt kết nối mở lại với đồng bộ xong | Ngắt mạng rồi mở lại WS nhưng giữ REST backfill chưa trả | Sau khi WS mở lại, màn hình ở `Đang đồng bộ`, chưa hiển thị `Đang trực tiếp` | E2E `websocket-live.spec.ts` | Trạng thái `Đang đồng bộ` trong lúc REST còn pending |
| MK-105 | Tự bù đủ nến đóng bị thiếu sau phục hồi, không lấp gap thật | Ngắt mạng 3 phút (thiếu 3 nến đóng `1m`, trong đó có 1 gap thật); khôi phục mạng | Backfill bù đủ 2 nến đóng thật bị thiếu, không chèn nến cho gap thật, cập nhật nến mở và sidebar; cache REST đã vô hiệu hóa khi có nến đóng | Integration `cache-invalidation.test.ts`, Unit `market-candle-merge.test.ts`, E2E `websocket-live.spec.ts` | Báo cáo đối chiếu `0 missing / 0 duplicate / 0 OHLCV mismatch` |
| MK-106 | Chuyển về trực tiếp khi mọi chart và sidebar đồng bộ xong | Thả REST backfill cho 4 chart và sidebar lần lượt | Chỉ khi chart cuối cùng và sidebar hợp nhất xong mới đổi sang `Đang trực tiếp` và bỏ cảnh báo | E2E `websocket-live.spec.ts` | Timeline chuyển trạng thái sau request cuối |
| MK-107, MK-108 | Tạm dừng không báo mất kết nối; tiếp tục đồng bộ trong 1 giây | Đang trực tiếp → bấm Tạm dừng (ngắt upstream trong lúc tạm dừng) → bấm Tiếp tục | Khi tạm dừng đóng mã `1000`, giữ nhãn `Đã tạm dừng`, không báo mất kết nối; bấm Tiếp tục mở WS và gọi backfill trong ≤ 1000 ms | E2E `websocket-live.spec.ts` | Mã đóng `1000`, 0 cảnh báo lỗi khi tạm dừng, mốc bắt đầu đồng bộ ≤ 1000 ms |
| MK-109 | Đổi pair/timeframe/số chart khi đang tạm dừng | Đang tạm dừng; đổi timeframe chart 1, đổi pair và tăng số chart | Chỉ gọi REST tải lịch sử mới, không mở kết nối WS, giữ nguyên trạng thái `Đã tạm dừng` | E2E `websocket-live.spec.ts` | Ledger WS = 0 mở mới, REST có gọi đúng lựa chọn mới |
| MK-110 | Không tạo nến trùng cùng `(pair, timeframe, openTime)` | Gửi 2 event cùng `openTime` cho nến mở và gửi lại `openTime` của nến đã đóng | Cập nhật tại chỗ nến mở, bỏ qua bản lặp nến đã đóng; số nến trùng = 0 | Unit `market-candle-merge.test.ts`, E2E `websocket-live.spec.ts` | Kiểm duy nhất mọi `openTime` trên mảng nến |
| MK-111 | Không lùi dữ liệu trên cả chart và sidebar | Gửi event `candle` và `summary` có `dataTime` nhỏ hơn mốc mới nhất đã áp dụng (hoặc REST backfill cũ hơn WS mới) | Bỏ qua event/response cũ hơn trên cả chart lẫn sidebar; 0 lần lùi `dataTime` | Shared `market-data-ws.schema.test.ts`, Unit `market-candle-merge.test.ts`, E2E `websocket-live.spec.ts` | `dataTime` và giá trước/sau không đổi |
| MK-112, MK-113 | Nhãn chữ cho 7 trạng thái và tiết chế thông báo screen reader | Đi qua 7 trạng thái + nhiều tick thường + 3 lượt tự thử lại liên tiếp trong cùng trạng thái mất kết nối | Đủ 7 nhãn chữ khác nhau; 0 thông báo cho tick thường; đúng 1 thông báo khi đổi trạng thái, không lặp ở lượt retry thứ 2–3; không chuyển focus | E2E `websocket-live.spec.ts` | Log MutationObserver vùng live region và `activeElement` |
| MK-114 đến MK-117 | Giữ vùng xem, theo nến cuối, giữ focus, giữ tooltip | Zoom/kéo về quá khứ, hoặc đứng ở nến cuối, focus nút điều khiển, hover một nến trong khi nguồn đẩy cập nhật trực tiếp và đóng nến | Vùng xem quá khứ giữ nguyên; đang ở nến cuối thì nến mới nằm trong vùng xem; `activeElement` và thông tin nến hover không mất | E2E `websocket-live.spec.ts` + kiểm trực quan ảnh | Ảnh trục thời gian trước/sau, `activeElement`, giá trị tooltip |
| MK-118 | Từ chối mở mới WS khi thiếu phiên hoặc phiên hết hạn/thu hồi | Gửi HTTP upgrade không cookie, cookie rác, cookie hết hạn và cookie vừa sign-out | Đều trả `HTTP 401`, đóng socket, 0 khung WS được gửi | Integration `ws-gateway.test.ts` | HTTP status 401, frame count = 0 |
| MK-119 | Kiểm `Origin` lúc HTTP upgrade (ASVS V4.4.2) | Gửi upgrade thiếu header `Origin` và với `Origin: https://evil.example` trên `NODE_ENV=test` | Trả `HTTP 403`, không gọi `getSession`, 0 khung WS | Integration `ws-gateway.test.ts` | HTTP status 403, `getSession` call count = 0 |
| MK-120 | Bắt buộc `WSS` trên production (ASVS V4.4.1) | Khởi tạo gateway với `requireTls: true`; gửi upgrade không có `X-Forwarded-Proto: https` và có `X-Forwarded-Proto: https` | Thiếu header hoặc `http` trả `HTTP 403`; `https` được chấp nhận đi tiếp sang kiểm phiên | Integration `ws-gateway.test.ts` | HTTP status 403 vs 101 |
| MK-121, MK-129 | Dừng cập nhật và dừng reconnect trên mọi tab trong ≤ 5 giây khi phiên hết hạn/thu hồi | Mở 2 tab cùng phiên; thử riêng 3 đường: (a) sign-out, (b) reset password, (c) xóa phiên trực tiếp trong PostgreSQL / tiến clock quá `expiresAt` | Cả 2 tab nhận mã đóng `4401` trong ≤ 5000 ms (bộ nhớ 1s, theo lô DB 3s, hook tức thì), dừng mọi tick và reconnect, hiện màn chặn đăng nhập | Integration `ws-gateway.test.ts`, E2E `websocket-live.spec.ts` | Thời gian từ thu hồi tới `4401`, 0 frame sau đó, màn chặn hiển thị |
| MK-122 | Trần tự thử kết nối lại 120 giây | Giữ server từ chối kết nối qua 119999/120000/120001 ms (clock điều khiển) | Tại 119999 ms còn tự thử theo backoff 1s→16s; từ 120000 ms trở đi (`elapsed >= 120000 ms`, biên đã chốt `W11`) chuyển `Mất kết nối hoàn toàn`, dừng tự thử | E2E `websocket-live.spec.ts` | Số lần thử sau 120000 ms = 0, trạng thái `Mất kết nối hoàn toàn` |
| MK-123 | Nhiều tab cùng phiên độc lập | Mở 2 tab cùng tài khoản: tab A đổi pair ETHUSDT và tạm dừng; tab B giữ BTCUSDT và đang trực tiếp | Tab B tiếp tục nhận cập nhật BTCUSDT, không bị đổi pair hay tạm dừng theo tab A | E2E `websocket-live.spec.ts` | Snapshot 2 page độc lập |
| MK-124 | Đổi pair hoặc timeframe liên tiếp nhanh | Đổi BTC → ETH → SOL hoặc 5m → 15m → 1m trước khi lượt trước hoàn tất (giữ promise cũ) | Chỉ hiển thị lịch sử và cập nhật trực tiếp của lựa chọn cuối cùng; 0 dữ liệu cũ xuất hiện | E2E `websocket-live.spec.ts` | Giá trị hiển thị khớp lựa chọn cuối sau khi thả response cũ |
| MK-125 | Hai chart cùng timeframe trên 1 tab | Chọn chart 1 và chart 2 đều là `5m`; zoom chart 1 về quá khứ, giữ chart 2 ở cuối | Chỉ 1 kênh `kline:BTCUSDT:5m` trên WS; cả hai nhận cùng OHLCV, giữ vùng xem độc lập | E2E `websocket-live.spec.ts` | Danh sách `subscribed` không trùng kênh, OHLCV giống nhau, trục thời gian khác nhau |
| MK-126 | Tab ẩn rồi hiện lại | (a) Bật trực tiếp, ẩn tab không mất dữ liệu rồi hiện lại; (b) Ẩn tab có mất dữ liệu/cũ rồi hiện lại; (c) Tạm dừng, ẩn rồi hiện lại | (a) Không gọi REST thừa; (b) Bắt đầu đồng bộ trong ≤ 1000 ms và bù đủ nến; (c) Giữ nguyên `Đã tạm dừng` | E2E `websocket-live.spec.ts` | Ledger REST theo từng nhánh (a/b/c) |
| MK-127 | Đồng bộ bù nến thất bại từng phần | Sau reconnect, cho REST backfill chart `5m` trả 503, 3 chart còn lại trả 200 | Chart `5m` giữ dữ liệu cũ, xóa bộ đệm, báo `Đồng bộ chưa xong` kèm nút đồng bộ lại; 3 chart kia vẫn trực tiếp; bấm đồng bộ lại thành công quay về `Đang trực tiếp` | E2E `websocket-live.spec.ts` | Trạng thái từng chart, 0 event mới nối qua khoảng trống ở `5m` |
| MK-128 | Loại bỏ cập nhật nến hoặc giá sai định dạng | Nguồn gửi nến sai (`high < low`, `close <= 0`, `volume < 0`, `openTime` lệch mốc timeframe) và summary sai (`lastPrice <= 0`, `change24hPercent` không hữu hạn, thiếu `dataTime`) | Hub loại trước fan-out và ghi log `warn`; Web cũng loại nếu nhận trực tiếp, giữ dữ liệu chart và sidebar cũ và không đặt lại đồng hồ 15s/30s | Integration `stream-hub.test.ts`, Unit `market-candle-merge.test.ts`, E2E `websocket-live.spec.ts` | Log `droppedInvalidEvents`, dữ liệu chart và sidebar giữ nguyên |
| MK-130 | Nguồn Binance không khả dụng | Đóng kết nối ở fake Binance WS server kèm chuỗi lỗi nội bộ sentinel (giữ kết nối Web↔API mở) | Hub phát `status(unavailable)`; UI giữ dữ liệu, báo nguồn tạm thời không khả dụng (0 chuỗi sentinel), không ngắt WS Web↔API, tự đồng bộ khi nhận `status(available, resyncRequired: true)` | Integration `stream-provider.test.ts`, `ws-gateway.test.ts`, E2E `websocket-live.spec.ts` | Không chứa chuỗi sentinel trong frame/DOM, socket Web↔API giữ mở, hồi phục về trực tiếp |
| MK-131 | Chart lỗi tải ban đầu không vẽ nến lẻ | Cho REST lần đầu của chart `5m` trả 503 trong khi nguồn WS vẫn đẩy kline `5m` | Chart `5m` giữ trạng thái lỗi + nút Retry, không vẽ nến lẻ; chỉ nhận trực tiếp sau khi bấm Retry thành công | E2E `websocket-live.spec.ts` | Trạng thái lỗi giữ nguyên dù có frame `5m` |
| MK-132 | Reload về lựa chọn mặc định đang bật trực tiếp | Đổi pair ETH, tạm dừng (hoặc ở trạng thái mất kết nối), rồi reload trang | Trở về BTCUSDT 4 chart 5m/15m/1h/4h với cập nhật trực tiếp đang bật | E2E `websocket-live.spec.ts` | Lựa chọn và trạng thái sau reload |
| MK-142 | Giới hạn 4 tab trực tiếp mỗi tài khoản | Mở lần lượt 4 kết nối/tab hợp lệ của cùng tài khoản, rồi mở tab thứ 5; kiểm thêm đóng 1 trong 4 tab cũ rồi mở lại | 4 tab đầu hoạt động bình thường; tab thứ 5 nhận `error` `CONNECTION_LIMIT_EXCEEDED` và mã đóng `4429`, dừng tự reconnect và hiện cảnh báo mà 4 tab cũ không bị ngắt; đóng 1 tab thì tab mới mở thành công | Integration `ws-gateway.test.ts`, E2E `websocket-live.spec.ts` | Mã đóng `4429`, trạng thái 4 tab cũ, kiểm biên 3/4/5 |
| MK-140, MK-141 | Lệch đồng hồ thiết bị và không hiện ms độ trễ | Lệch đồng hồ trình duyệt `Date.now()` ±60s so với server trong E2E | Không báo dữ liệu cũ giả ở < 15s (dùng `performance.now()`); UI không hiện chuỗi số ms độ trễ | E2E `websocket-live.spec.ts` | Không có báo giả khi lệch ±60s, kiểm DOM thanh trạng thái |
| ADR-009, ADR-011 | Shared subscriptions, vô hiệu hóa cache, `SLOW_CONSUMER` `4008`, giới hạn 10 kênh / 4 KB / 20 msg/10s | 10 client subscribe cùng `BTCUSDT:5m`; đẩy nến đóng `isClosed: true`; tạo client không đọc vượt 64 KB; gửi khung 4097 bytes, kênh thứ 11, tin thứ 21/10s | Upstream nhận đúng 1 lệnh `SUBSCRIBE`; cache REST bị xóa ngay khi có nến đóng; client chậm bị đóng `4008` và tự backfill; giới hạn trả đúng mã lỗi/đóng | Integration `stream-hub.test.ts`, `cache-invalidation.test.ts`, `ws-gateway.test.ts` | Số lệnh `SUBSCRIBE` = 1, cache miss ngay sau nến đóng, mã đóng `4008`/`4429` |

## Bộ dữ liệu tham chiếu và đối soát nến đóng (`QA-16`, `QA-17`)

Bộ dữ liệu tham chiếu là tập JSON đóng băng lưu tại `apps/api/test/market-data/ws-reference-dataset.json` (runner đo hiệu năng và phục hồi Bước 12 ghi mã băm SHA-256 của file này vào `manifest.json` cho từng lượt chạy), do nguồn replay HTTP và replay WS cùng đọc từ một timeline thống nhất để không bao giờ mâu thuẫn giữa dữ liệu REST backfill và dữ liệu WS trực tiếp.

### Cấu trúc bộ dữ liệu tham chiếu

- **Khung thời gian và gốc mốc:** gốc `1735689600000` (2025-01-01 00:00:00 UTC), bao phủ 3 pair (`BTCUSDT`, `ETHUSDT`, `SOLUSDT`) và 6 timeframe (`1m`, `5m`, `15m`, `1h`, `4h`, `1d`), khởi đầu bằng 519 nến lịch sử (500 hiển thị + 19 warm-up) có giá nhị phân chính xác (bội của `0.125`) để so khớp chính xác không phụ thuộc sai số float64 [[8, Fixture và oracle độc lập]](#ref-8).
- **Kịch bản sự kiện đóng băng cho toàn vẹn OHLCV (QA-17) và phục hồi đồng bộ (QA-16):** kéo dài 6 phút thời gian thị trường trên `1m` (và cắt ngang ít nhất 1 ranh giới đóng nến `5m`), gồm có chủ đích:
  1. Cập nhật nến đang mở (`isClosed: false`) nhiều tick liên tiếp cho cùng `openTime`.
  2. Mốc chốt đóng nến (`isClosed: true`) chuyển sang nến kế tiếp, kèm vô hiệu hóa cache REST ở biên TTL 5 giây.
  3. Một khoảng trống thị trường thật (bỏ hẳn 1 nến `1m` khỏi nguồn tham chiếu) để kiểm quy tắc không tạo nến giả (MK-35).
  4. Sự cố tiêm lỗi trực tiếp: 1 bản ghi trùng `openTime` của nến đã đóng (MK-110), 1 bản ghi đến muộn có `dataTime` cũ hơn (MK-111), 1 bản ghi nến sai định dạng `high < low` và 1 bản ghi summary `lastPrice <= 0` (MK-128).
  5. Ba lần ngắt kết nối có kiểm soát dài 30 giây, 120 giây và 300 giây (khớp khoảng ngắt thử nghiệm 30 giây đến 5 phút của kịch bản phục hồi đồng bộ QA-16), tạo 1 đến 5 nến đóng bị thiếu trên `1m` (và ít nhất 1 nến đóng bị thiếu trên `5m`).

### Quy tắc đối chiếu nến đóng và đo thời gian phục hồi

1. **Đối chiếu nến đóng (QA-17):** sau mỗi lượt đồng bộ và ở cuối lượt đo, lấy danh sách mọi nến có `isClosed: true` trong cửa sổ hiển thị của từng chart trên client, đối chiếu theo khóa `(pair, timeframe, openTime)` với manifest literal độc lập của bộ dữ liệu tham chiếu:
   - `missingClosedCandles`: số khóa có trong cửa sổ tham chiếu (đã trừ khoảng trống thật khai báo trong manifest) nhưng thiếu trên client → yêu cầu **= 0**.
   - `duplicateOpenTimes`: số khóa xuất hiện hơn 1 lần hoặc thứ tự `openTime` không tăng nghiêm ngặt → yêu cầu **= 0**.
   - `ohlcvMismatches`: số nến đóng có bất kỳ trường `open`, `high`, `low`, `close`, `volume` khác manifest → yêu cầu **= 0**.
   - Nến đang mở (`isClosed: false`) không so đối chiếu giá trị ở hai thời điểm khác nhau; chỉ kiểm `openTime` đứng cuối, đúng mốc timeframe và khớp tick mới nhất đã nhận.
2. **Đo thời gian phục hồi (QA-16):** tách biệt rõ với mốc kết nối lại nguồn 30 giây (QA-06). Với mỗi lần ngắt kết nối có kiểm soát:
   - **Điểm bắt đầu (`networkRestoredAt`):** mốc đồng hồ đơn điệu lúc harness khôi phục mạng giữa trình duyệt và API (hoặc khôi phục luồng upstream Binance WS cho kịch bản ngắt nguồn).
   - **Điểm kết thúc (`recoveredAt`):** mốc đầu tiên mà đồng thời thỏa ba điều kiện: (a) đối chiếu xác nhận mọi chart hiển thị đã bù đủ mọi nến đóng bị thiếu (0 thiếu/trùng/lệch), (b) trạng thái màn hình đã chuyển về `Đang trực tiếp` (MK-106), và (c) chart đã áp dụng ít nhất một cập nhật trực tiếp mới phát ra sau thời điểm khôi phục.
   - **Tổng hợp:** nearest-rank p95 của `recoveredAt - networkRestoredAt` qua các lần ngắt có kiểm soát phải **< 10000 ms** (QA-16).

## Protocol đo và so sánh hiệu năng

**Trạng thái: Confirmed (product owner duyệt toàn bộ `W1` đến `W11` ngày 2026-11-23).** Để phục vụ mục tiêu CV và tránh ngụy tạo cải thiện [[13]](#ref-13) [[20]](#ref-20), Bước 11 tách cứng thành **hai phép so sánh độc lập** với định nghĩa chỉ số thống nhất tuyệt đối giữa requirements, thiết kế và kết quả đo:

### Định nghĩa chỉ số nhất quán

| Chỉ số | Công thức và điểm đo | Khác biệt bắt buộc | Ngưỡng và nguồn |
| --- | --- | --- | --- |
| `backendToChartMs` (Backend-to-chart latency) | `chartRenderedAt(event, client) - apiReceivedAt(event)` (tức `dataTime` tại API tới lúc chart hiển thị) | **Không** gồm thời gian truyền từ nguồn tới API hay thời gian chờ chu kỳ polling; ở tầng protocol load ghi riêng `backendToClientMs` (`wsFrameReceivedAt - apiReceivedAt`) | p95 < 1000 ms (QA-05, QA-15) |
| `sourceToChartDelayMs` (Source-to-chart delay / Freshness) | `chartRenderedAt(event hoặc phiên bản mới hơn, client) - sourceAvailableAt(event)` | Gồm toàn bộ đường đi từ lúc nguồn tham chiếu phát hành tới lúc chart hiển thị; dùng chung định nghĩa giữa độ mới polling (QA-12) và độ mới trực tiếp (QA-14) | Polling: p95 < 11000 ms (QA-12); WebSocket: p95 < 1500 ms (QA-14) |
| Tỷ lệ thời gian dữ liệu cũ | $\frac{1}{T_{\text{eligible}}} \int \mathbf{1}[\text{sourceVersion}(t - \Delta) > \text{drawnVersion}(t)]\,dt \times 100\%$ | Báo cả với $\Delta = 11000$ ms (so ngang với polling) và $\Delta = 1500$ ms (ngưỡng trực tiếp QA-14); không coi giá không đổi là dữ liệu cũ | Báo mô tả, chưa đặt ngưỡng pass riêng |
| Bộ đếm request và subscription *(đếm tách biệt 3 sổ)* | (1) `browserToApi`: số HTTP request + số khung WS client↔API; (2) `upstreamRest`: số HTTP request và tổng `weight` tới replay/Binance; (3) `upstreamWsSubscriptions`: số kết nối WS và số topic đang subscribe trên upstream | Không gộp request browser thành request upstream; không đồng nhất request count với Binance weight | Upstream WS ≤ 1 kết nối mỗi `(pair, timeframe)` (QA-15); REST weight ≤ 504/60s (QA-13) |
| `fanOutRatio` | `activeTopicSubscribers / activeUpstreamSubscriptions` | Đo riêng ở chế độ trước và sau shared subscriptions | Báo mô tả, chứng minh fan-out tuyến tính theo số client |
| Lưu lượng (`bytes/client/phút`) | Tổng `Network.loadingFinished.encodedDataLength` (HTTP) cộng tổng kích thước khung WS nhận/gửi qua CDP (`Network.webSocketFrameReceived` + `webSocketFrameSent`) tại browser chia cho `client-minute` | Tách rõ pha tải đầu (`cold load`) với pha ổn định (`steady`), ghi rõ HTTP/1.1 không nén để ngang hàng với `polling-v2` [[21]](#ref-21) | Báo mô tả, so trực tiếp với `2,65–2,71 MB/client/phút` của `polling-v2` |
| Tài nguyên hệ thống | CPU %, RSS/Heap MB, `eventLoopLagP95Ms`, `pg.Pool` (`total`/`idle`/`waiting`) của API và CPU/event-loop lag của máy phát tải mỗi 1 giây | Theo dõi cả chuỗi thời gian để phát hiện rò rỉ bộ nhớ hoặc nghẽn máy phát tải | Máy phát tải không bão hòa theo ngưỡng đã chốt `W9` (CPU < 70%, event-loop lag p95 < 50 ms); nếu bão hòa ghi lượt đo là `Inconclusive` |

**Quy tắc bằng chứng hiển thị (`chartRenderedAt`, đã chốt tại `W10`):** khắc phục trạng thái `Inconclusive` của `polling-v2` (chỉ đo tới `market-data:apply`), runner trình duyệt ở Bước 12 ghi hai mốc tách biệt: `applyAt` (khi dữ liệu apply xong vào Lightweight Charts) và `paintAt` (callback hai vòng `requestAnimationFrame` sau `applyAt` kèm xác nhận đổi pixel canvas đã kiểm độ nhạy). Nếu lượt đo chưa chứng minh được `paintAt` đã qua phép kiểm độ nhạy, chỉ báo `applyReceivedDelay` mô tả và giữ kết luận kịch bản độ mới trực tiếp (QA-14) và kịch bản độ trễ cập nhật (QA-05) trên trình duyệt là `Inconclusive`.

### Phép so sánh A: REST Polling vs WebSocket (Freshness, Upstream và Lưu lượng)

- **Phiên bản đối chiếu:** REST polling đóng băng tại commit `2709f3b` (chu kỳ 5 giây, cache 5 giây, tải lại toàn bộ cửa sổ theo quyết định polling ADR-007 và giữ lỗi cache ADR-008 — giữ nguyên không làm yếu baseline) [[21]](#ref-21) so với bản WebSocket triển khai ở Bước 12.
- **Điều kiện tương đương bắt buộc:** cùng phần cứng, cùng Web production build, cùng HTTP/1.1 không nén, cùng PostgreSQL thật và Better Auth thật, cùng cache REST TTL 5 giây, cùng lựa chọn mặc định (`BTCUSDT`, 4 chart `5m`/`15m`/`1h`/`4h` + sidebar), cùng replay delay `50 ms`, cùng lịch đổi dữ liệu lệch pha (`phaseMs = 1379`, `sourcePeriodMs = 7000` đã khóa trong `polling-config.json` [[22]](#ref-22)), cùng khung đo `30s warm-up + 180s steady + 15s tail`, lặp 3 lượt cho mỗi mức `1` và `10` Chromium client.
- **Điều kiện đồng bộ phiên bản baseline:** vì `polling-v2` trước đây chưa có bằng chứng `paintAt` (nên kịch bản độ mới polling QA-12 là `Inconclusive`) và chạy `pg.Pool` mặc định 10 kết nối [[21]](#ref-21), khi thực hiện Phép so sánh A ở Bước 12 phải: (1) chạy lại commit đóng băng `2709f3b` bằng cùng runner đo `paintAt` (không sửa code ứng dụng của `2709f3b`) để đối chiếu `sourceToChartDelayMs` có cùng mốc vẽ canvas, và (2) giữ cùng kích thước pool DB (chạy cả hai ở mức mặc định 10 cho mức 1/10 client hoặc ghi rõ chênh lệch `DATABASE_POOL_MAX` 10 vs 20 trong `manifest.json` kèm bằng chứng `pool.waiting = 0`).
- **Trọng tâm so sánh:** `source-to-chart delay` (p50/p95/p99), tỷ lệ thời gian dữ liệu cũ, `upstreamRest` requests & weight/phút, `upstreamWsSubscriptions`, `browserToApi` requests/frames, `bytes/client/phút` và tài nguyên API/DB.

### Phép so sánh B: Trước vs Sau Shared Subscriptions (Capacity và Fan-out)

Phép so sánh này **tách riêng** khỏi phép so sánh A để quy kết chính xác mức tăng capacity cho cơ chế shared subscriptions mà không trộn lẫn với việc đổi từ REST sang WebSocket [[13]](#ref-13) [[20]](#ref-20):

- **Điều kiện tương đương bắt buộc:** cùng giao thức WebSocket `/api/market-data/ws`, cùng xác thực Better Auth + kiểm phiên theo lô (ADR-010), cùng cấu hình `DATABASE_POOL_MAX = 20`, cùng hardware, cùng replay WS server phát sự kiện ở nhịp cố định, cùng quy tắc đối chiếu OHLCV. Không tắt cache, không chèn độ trễ nhân tạo và không hạ cấu hình bản "Trước".
- **Biến độc lập duy nhất (tách 2 commit theo `W2` đã chốt):**
  - **Chế độ Trước (Per-client combined upstream):** mỗi kết nối client trên API mở đúng **1 kết nối combined upstream WebSocket riêng** tới replay WS server (gộp 4 kline + 1 summary của chính client đó, cùng cơ chế combined stream như bản Sau — không mở 5 socket/client để tránh làm yếu baseline nhân tạo) và tự tuần tự hóa JSON riêng cho client đó.
  - **Chế độ Sau (Shared subscriptions — ADR-009):** `MarketDataStreamHub` chia sẻ tối đa 1 stream upstream cho mỗi khóa `(pair, timeframe)` / `pair` xuyên mọi client và tuần tự hóa JSON 1 lần cho mọi subscriber.
- **Điều kiện một client được tính vào Capacity (theo kịch bản tải đồng thời QA-15 và mục tiêu CV [[13]](#ref-13)):** một mức tải `N` client đồng thời chỉ được công nhận đạt capacity khi thỏa đồng thời cả 4 điều kiện trên toàn bộ 3 lần lặp:
  1. 100% client hoàn tất đồng bộ đầu và nhận đầy đủ dữ liệu với `0` nến đóng thiếu, `0` nến trùng và `0` lệch OHLCV.
  2. Độ trễ `backendToClientMs` của toàn bộ `N` protocol client **và** độ trễ đầu-cuối `backendToChartMs` đo trực tiếp trên Chromium probe đều đạt nearest-rank `p95 < 1000 ms` (QA-05, QA-15). Không cộng gộp hai percentile (`p95(X) + p95(Y) ≠ p95(X + Y)`).
  3. Tỷ lệ lỗi khung/ngắt kết nối bất thường (kể cả `SLOW_CONSUMER` `4008`) bằng `0%`.
  4. Máy/tiến trình phát tải không bão hòa theo ngưỡng đã chốt `W9`, và ở chế độ Sau giữ đúng `upstreamWsSubscriptions <=` số khóa đang xem (tối đa 5 stream cho lựa chọn mặc định: 4 kline + 1 summary).
- **Tách tải khỏi API/DB và phạm vi kết luận:** để không lặp lại lỗi bão hòa máy khi mở 50 Chromium cùng host như ở `polling-v2` [[21]](#ref-21):
  - **Tải đồng thời (`N` protocol client WS thật):** chạy trên tiến trình riêng (hoặc máy riêng / container giới hạn CPU riêng), mỗi client dùng một tài khoản test riêng (tuân thủ giới hạn 4 tab mỗi tài khoản MK-142 mà không tắt rule bảo mật), xác thực cookie thật qua Better Auth, gọi REST snapshot ban đầu rồi giữ WS nhận mọi event và đối chiếu OHLCV.
  - **1 Chromium thật song song làm probe UI:** mở 1 browser Chromium thật (Web production build) dưới tải nền `N` để đo riêng `backendToChartMs` (từ `apiReceivedAt` tới `paintAt`) và `clientApplyMs`. Báo cáo tách rõ hai chỉ số: `backendToClientMs` của `N` protocol client và `backendToChartMs` của 1 Chromium probe; ghi rõ giới hạn rằng 1 browser probe không mô phỏng `N` tiến trình render trình duyệt chạy đồng thời trên máy chủ.

### Tham số công cụ, so sánh, workload và cổng biên đã duyệt

**Trạng thái: Confirmed (product owner duyệt toàn bộ `W1` đến `W11` ngày 2026-11-23).** Với `W1`, product owner chọn **Node.js `ws` load driver độc lập** (không cần đổi trạng thái `k6` cho WebSocket trong Test Strategy [[12]](#ref-12)) [[24, LL-004]](#ref-24):

| ID | Tham số | Giá trị đã chốt | Nguồn và lý do | Tác động so với hiện tại / test basis |
| --- | --- | --- | --- | --- |
| W1 | Công cụ phát tải WebSocket | **Node.js `ws` load driver độc lập** (tách tiến trình/máy khỏi API/DB, kèm 1 Chromium probe) | Agent đề xuất: `k6` cho WS đang `Proposed` trong Test Strategy [[12]](#ref-12) và chưa có trên PATH shell hiện tại; driver `ws` dùng đúng `ws@8.23.0` đã khóa, dễ điều phối cookie Better Auth + REST backfill + đối chiếu từng nến đóng | Không thêm binary ngoài repo; giữ `k6` cho WebSocket ở trạng thái `Proposed` trong Test Strategy [[12]](#ref-12) |
| W2 | Cách tách chế độ Trước vs Sau cho So sánh B | **Tách 2 commit liên tiếp ở Bước 12** (commit B1: WebSocket với 1 combined upstream riêng mỗi client để đo Trước; commit B2: bổ sung `MarketDataStreamHub` shared ref-count + single-serialize để đo Sau) | Agent đề xuất thay cho cờ `WS_SHARED_SUBSCRIPTIONS` để giữ code production sạch, không chứa nhánh chỉ phục vụ benchmark [[11]](#ref-11) | Yêu cầu giữ cố định commit B1 và chạy đo Trước trước khi chồng commit B2 (tương tự cách giữ `2709f3b` cho polling) |
| W3 | Bậc tải cho So sánh B | `10`, `50` (khớp mục tiêu tối thiểu tải đồng thời QA-15), sau đó tăng bậc `100`, `200`, `400` cho tới khi vi phạm điều kiện capacity; `3` lần lặp mỗi bậc | Agent đề xuất: xác nhận ngưỡng tối thiểu 50 client và tìm trần tải thực tế cho dòng CV capacity [[13]](#ref-13) | Tăng tổng thời gian chạy benchmark khi đi lên các bậc > 50; dừng ngay ở bậc đầu tiên vi phạm điều kiện capacity |
| W4 | Nhịp phát sự kiện replay WS (So sánh B) | `2 sự kiện/giây/kênh` (`10 sự kiện/giây` cho 4 chart + 1 summary mỗi client), xen kẽ mốc đóng nến `1m` mỗi `60 giây` | Agent đề xuất từ nhịp thực tế 1–2 sự kiện/giây của Binance Spot đã viện dẫn khi định bộ đệm 50 sự kiện (ADR-011) [[3]](#ref-3). Kiểm Little's Law ở 50 client: $50 \times 10 = 500$ khung/giây (~100 KB/giây ở ~200 byte/khung) | Chỉ áp dụng cho So sánh B; So sánh A vẫn giữ nguyên `sourcePeriodMs = 7000` và `phaseMs = 1379` của `polling-config.json` [[22]](#ref-22) để ngang hàng với `polling-v2` |
| W5 | Thời lượng mỗi lượt So sánh B | `30 giây` warm-up + `180 giây` steady + `15 giây` drain/tail, `3` lần lặp | Agent đề xuất dựa theo cấu hình `polling-v2` [[22]](#ref-22): đi qua nhiều chu kỳ kiểm phiên 3s và nhiều mốc đóng nến | Tốn khoảng 12 phút cho 3 lặp của mỗi bậc tải; giữ chuẩn so sánh đồng nhất với `polling-v2` |
| W6 | Số lần ngắt mạng đo phục hồi đồng bộ (QA-16) | `10` lần ngắt ở mức `30 giây` + `3` lần ở mức `120 giây` + `3` lần ở mức `300 giây` (tổng 16 mẫu p95) | Agent đề xuất: phủ đủ dải 30 giây đến 5 phút của kịch bản phục hồi đồng bộ (QA-16) và có đủ 16 mẫu cho nearest-rank p95 mà tổng thời gian chạy chỉ khoảng 25 phút (thay vì > 75 phút nếu chạy 10 lần ở cả 300 giây) | Đã chốt 16 mẫu để giữ thời gian chạy khoảng 25 phút (thay vì ~75 phút với 30 mẫu đồng đều) |
| W7 | Kiểm soát clock và hiệu chuẩn timestamp | Không dùng `performance.timeOrigin + performance.now()` trực tiếp giữa các tiến trình khác nhau (vì mỗi tiến trình tự gắn mốc wall-clock lúc khởi động). Mọi phép đo xuyên tiến trình (đặc biệt API ↔ Chromium) đều chạy hiệu chuẩn clock-exchange đo `roundTripMs` trước và sau lượt đo (tương tự `polling-v2` [[21]](#ref-21)); tách máy dùng thêm NTP/Chrony. Ngưỡng cảnh báo/hạ `Inconclusive` khi biên sai số clock > `50 ms` | Agent đề xuất: `50 ms` bằng 5% ngưỡng 1000 ms (QA-05, QA-15) để sai số đồng hồ không làm lệch kết luận pass/fail | Mọi lượt đo đều phải lưu log clock-exchange trong `manifest.json`; nếu `maxClockRttMs / 2 > 50 ms` gần ngưỡng pass thì ghi `Inconclusive` |
| W8 | Lượt smoke Binance WS thật | `1` client, subscribe `BTCUSDT@kline_1m` + `BTCUSDT@ticker` trong `90 giây` (đi qua ít nhất 1 mốc đóng nến thật), không load test Binance thật | Agent đề xuất: kiểm chứng mapping payload thật và cờ `k.x` từ `wss://stream.binance.com:9443/stream` với chi phí tối thiểu | Không dùng số liệu smoke ít mẫu để báo p95 hoặc capacity; yêu cầu mạng ngoài khi chạy riêng lượt smoke |
| W9 | Ngưỡng không bão hòa của máy/tiến trình phát tải | CPU máy phát tải < `70%` và `eventLoopLagP95Ms` tiến trình phát tải < `50 ms` trong suốt cửa sổ steady | Agent đề xuất theo quy tắc không để load generator thành bottleneck [[12]](#ref-12) | Nếu vượt một trong hai ngưỡng, lượt đo bị gắn `Inconclusive` và không được tính vào capacity |
| W10 | Phương pháp thu bằng chứng `paintAt` trên canvas | Hai vòng `requestAnimationFrame` liên tiếp sau `applyAt` kết hợp kiểm đổi pixel vùng canvas (đã kiểm độ nhạy bằng phép thử không đổi dữ liệu thì pixel không đổi) | Agent đề xuất nhằm vượt giới hạn `Inconclusive` của `polling-v2` (mới đo tới `market-data:apply`) [[21]](#ref-21) | Bổ sung probe nhẹ phía runner E2E/perf (không thay đổi code nghiệp vụ); nếu chưa chứng minh độ nhạy của probe, giữ kết luận paint là `Inconclusive` |
| W11 | Cổng biên thời gian cho assertion tự động | (a) Dữ liệu cũ (MK-98): `< 15000 ms` trực tiếp, `>= 15000 ms` dữ liệu cũ; (b) Đặt lại luồng (MK-99): `< 30000 ms` giữ socket, `>= 30000 ms` đóng và kết nối lại; (c) Trần tự thử lại (MK-122): `< 120000 ms` còn tự thử (`119999 ms`), `>= 120000 ms` (`120000 ms`, `120001 ms`) chuyển `Mất kết nối hoàn toàn`; (d) Thu hồi phiên (MK-121): đóng `4401` trong `<= 5000 ms` | Agent đề xuất để chốt chính xác dấu `>=` / `<=` tại đúng mốc biên, nhất quán với quy ước biên TTL 5000 ms đã duyệt ở Bước 07 [[8, Mô hình cache và cooldown]](#ref-8) | Khóa assertion 3 giá trị biên cho bộ test tự động; không làm thay đổi giá trị ngưỡng trong UC |

## Kịch bản chẩn đoán 3 nhóm nguyên nhân bằng log và metric

Phục vụ mục tiêu khả năng quan sát và chẩn đoán [[20, mục 7]](#ref-20) [[3, Observability]](#ref-3), Bước 12 thực thi 3 kịch bản fault injection có kiểm soát (tách khỏi benchmark sạch) và lưu timeline hợp nhất theo `pair`/`timeframe` vào `docs/testing/evidence/market-data/<run-id>/diagnosis-timeline.json`:

| Kịch bản sự cố | Cách tạo lỗi có kiểm soát | Dấu hiệu kỳ vọng trên timeline (phân biệt 3 nguyên nhân) | Cách bác bỏ hai nguyên nhân còn lại |
| --- | --- | --- | --- |
| **1. Upstream chậm hoặc ngắt** | Replay WS ngừng phát hoặc trễ 2500 ms trên `BTCUSDT:5m` rồi đóng kết nối Binance WS | `BinanceStreamProvider` ghi `binance_ws_disconnected` / `upstreamDelayMs` tăng > 2000 ms; `lastUpstreamFrameAt` của `BTCUSDT:5m` đứng yên; Hub phát `status(unavailable)` | `dispatchDurationMs` và `eventLoopLagP95Ms` của API vẫn thấp; không có log `SLOW_CONSUMER` hay tăng `clientApplyMs` |
| **2. Backend API nghẽn** | Chạy tải đồng thời hoặc tiêm tác vụ CPU blocking 400 ms / trì hoãn truy vấn DB kiểm phiên trong tiến trình API | Upstream vẫn phát đều (`upstreamDelayMs` thấp), nhưng log tổng hợp 10s của `MarketDataStreamHub` cho thấy `eventLoopLagP95Ms`, `dispatchDurationMs` hoặc `sessionRevalidationDurationMs` tăng vọt, kéo `backendToChartMs` tăng trên mọi client | Replay WS ghi nhận vẫn đẩy frame đúng lịch; mọi client khỏe cùng chịu trễ như nhau chứ không riêng 1 client chậm |
| **3. Client chậm hoặc mạng client nghẽn** | Một client WS ngừng đọc socket (hoặc browser bật CPU/network throttling qua CDP) trong khi client thứ hai trên cùng API vẫn đọc bình thường | API ghi `SLOW_CONSUMER` (`bufferedAmount > 65536`, `closeCode: 4008`) riêng cho `clientId` bị chậm, hoặc browser probe ghi `clientApplyMs` tăng cao trong khi `backendToChartMs` của client đối chứng vẫn bình thường | `upstreamDelayMs`, `dispatchDurationMs` và `eventLoopLagP95Ms` đều ở mức bình thường |

Cấu trúc mỗi bản ghi trong `diagnosis-timeline.json` chuẩn hóa theo trục thời gian hiệu chuẩn chung: `{ "tsCalibratedMs", "utc", "layer": "upstream" | "api-provider" | "api-hub" | "api-gateway" | "web-client", "pair", "timeframe", "event", "metrics": { ... } }`, không chứa cookie, token hay payload nhạy cảm.

## Danh sách mutation và phép kiểm fake dự kiến

Các phép làm hỏng dưới đây là **gate bắt buộc ở Bước 12** sau khi bộ test gốc đạt green (khôi phục ngay sau mỗi mutation và xác nhận green lại; lỗi syntax/import không tính là phát hiện mutant) [[11]](#ref-11):

| Nhóm hành vi | Mutation có chủ đích (production) hoặc fault (fake) | Test bắt buộc phải fail |
| --- | --- | --- |
| Shared subscriptions | Mỗi client subscribe mở thêm 1 lời gọi `streamProvider.subscribe` mới thay vì ref-count | `stream-hub.test.ts` (số lần gọi upstream > 1) |
| Giữ topic 5 giây | Gọi `unsubscribe` lên upstream ngay khi `refCount = 0` hoặc không bao giờ hủy sau 5000 ms | `stream-hub.test.ts` (assertion tại 4999/5000 ms) |
| Vô hiệu hóa cache REST | Bỏ gọi `onCandleClosed` khi nhận `isClosed: true` hoặc xóa nhầm khóa `timeframe` khác | `stream-hub.test.ts`, `cache-invalidation.test.ts`, `websocket-live.spec.ts` |
| Hợp nhất và biên chuyển giao | Cho nến trùng `openTime` tạo phần tử thứ hai; cho `dataTime` cũ hơn ghi đè; bỏ qua phát hiện thiếu bản chốt khi `last.isClosed === false` và `event.openTime > last.openTime` | `market-candle-merge.test.ts`, `websocket-live.spec.ts` |
| Dữ liệu sai định dạng | Cho phép frame `high < low` hoặc `summary.lastPrice <= 0` đi qua Hub, hoặc đặt lại đồng hồ tín hiệu sống 15s khi nhận frame sai | `stream-hub.test.ts`, `websocket-live.spec.ts` |
| Bảo mật upgrade | Bỏ kiểm `Origin` ở `NODE_ENV=test`, bỏ kiểm `WSS` khi `requireTls: true`, hoặc kiểm `getSession` trước `Origin` | `ws-gateway.test.ts` |
| Cưỡng chế thu hồi phiên | Tắt hook `onSessionRevoked` hoặc tắt vòng kiểm theo lô DB | `ws-gateway.test.ts`, `websocket-live.spec.ts` (không nhận `4401` trong ≤ 5s) |
| Giới hạn tài nguyên và backpressure | Cho phép mở tab thứ 5, cho phép kênh thứ 11, bỏ `maxPayload` 4 KB, hoặc bỏ ngắt `4008` khi `bufferedAmount > 64 KB` | `ws-gateway.test.ts`, `websocket-live.spec.ts` |
| Trạng thái đồng bộ UI | Chuyển sang `Đang trực tiếp` ngay khi WS mở lại trước khi REST backfill xong, ngắt WS Web↔API khi chỉ nhận `status(unavailable)`, hoặc báo mất kết nối khi đang tạm dừng | `websocket-live.spec.ts` |
| Độ nhạy fake/replay | Làm hỏng replay WS không phát tick mới; làm hỏng nút ngắt kết nối không thực sự đóng socket; làm hỏng fake `bufferedAmount` luôn bằng 0 | Các test phụ thuộc driver tương ứng phải fail ở assertion hành vi |

## References

1. <a id="ref-1"></a>[Market Data](../../../UCs/market-data.md)
2. <a id="ref-2"></a>[Quality Attributes](../../../UCs/quality-attributes.md)
3. <a id="ref-3"></a>[Market Data & Realtime Updates](../../../architecture/10-market-data.md)
4. <a id="ref-4"></a>[API & Realtime Communication Contracts](../../../architecture/22-api-endpoints.md)
5. <a id="ref-5"></a>[System States & Lifecycle](../../../architecture/20-state-machine.md)
6. <a id="ref-6"></a>[Security](../../../architecture/23-security.md)
7. <a id="ref-7"></a>[Architectural Decisions](../../../architecture/30-decisions.md)
8. <a id="ref-8"></a>[Kiểm chứng REST tải lịch sử](rest-verification.md)
9. <a id="ref-9"></a>W3C, *Web Content Accessibility Guidelines (WCAG) 2.2*, W3C Recommendation, 12/12/2024. <https://www.w3.org/TR/WCAG22/>
10. <a id="ref-10"></a>W3C, *Understanding SC 2.2.2: Pause, Stop, Hide (Level A)*, cập nhật 04/10/2026, đọc ngày 2026-11-22. <https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html>
11. <a id="ref-11"></a>[Testware](../../../conventions/testware.md)
12. <a id="ref-12"></a>[Test Strategy](../../test-strategy.md)
13. <a id="ref-13"></a>[Market Data sẽ thêm dòng nào vào CV?](../../../build/01-prototype-to-implementation/market-data/cv-goal.md)
14. <a id="ref-14"></a>OWASP ASVS 5.0, V4 API and Web Service (`0x13-V4-API-and-Web-Service.md`, mục V4.4 WebSocket và V4.1.3), đọc nguyên văn ngày 2026-11-23. <https://raw.githubusercontent.com/OWASP/ASVS/master/5.0/en/0x13-V4-API-and-Web-Service.md>
15. <a id="ref-15"></a>[Shared Market Data schema](../../../../packages/shared/src/schemas/market-data.schema.ts) và [Shared Env schema](../../../../packages/shared/src/schemas/env.schema.ts) tại commit `e819628`
16. <a id="ref-16"></a>[Market Data Provider interface](../../../../apps/api/src/providers/market-data/market-data-provider.ts), [Binance REST adapter](../../../../apps/api/src/providers/market-data/binance.provider.ts) và [Cache decorator](../../../../apps/api/src/providers/market-data/cached-market-data.provider.ts) tại commit `e819628`
17. <a id="ref-17"></a>[Auth config](../../../../apps/api/src/configs/auth.ts), [Database client](../../../../apps/api/src/database/client.ts) và [API bootstrap](../../../../apps/api/src/index.ts) tại commit `e819628`
18. <a id="ref-18"></a>[ESLint config](../../../../eslint.config.js) tại commit `e819628`
19. <a id="ref-19"></a>[Web Market Data hook](../../../../apps/web/app/hooks/useMarketData.ts), [Realtime workspace hook](../../../../apps/web/app/hooks/useRealtimeWorkspace.ts) và [Web Market Data API](../../../../apps/web/app/api/market-data.ts) tại commit `e819628`
20. <a id="ref-20"></a>[Những thứ cần đạt được trong lúc build Market Data](../../../build/01-prototype-to-implementation/market-data/goal.md)
21. <a id="ref-21"></a>[Kiểm chứng REST polling](rest-polling-verification.md)
22. <a id="ref-22"></a>[Polling baseline config](../../../../apps/api/perf/market-data/polling-config.json) tại commit `e819628`
23. <a id="ref-23"></a>[Kế hoạch chốt cách kiểm chứng WebSocket trước khi build](../../../build/01-prototype-to-implementation/market-data/work/step-11-websocket-verification/plan.md)
24. <a id="ref-24"></a>[Lessons Learned](../../../../LESSONS.md)
