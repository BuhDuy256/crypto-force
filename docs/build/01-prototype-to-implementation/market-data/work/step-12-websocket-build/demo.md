# Hướng dẫn chạy và demo Market Data (REST + WebSocket Realtime)

Đọc file này để biết cách chạy môi trường thật của Market Data, thao tác kiểm chứng trực quan 4 luồng chính (dữ liệu trực tiếp, đổi pair/timeframe trên multi-chart, subscribe/unsubscribe kèm tạm dừng/tiếp tục, và ngắt mạng rồi phục hồi đồng bộ) cùng lệnh chạy lại các bộ test và benchmark tự động.

## 1. Chuẩn bị môi trường và khởi động

Chạy từ thư mục gốc của repository (yêu cầu Node.js `>=22.22`, `pnpm` 9 và Docker Desktop):

1. **Khởi động PostgreSQL và áp dụng migration:**
   - `pnpm db:up`
   - `pnpm db:migrate`
2. **Biến môi trường trong `.env` (tạo từ `.env.example`):**
   - Các biến bắt buộc đã có: `DATABASE_URL`, `POSTGRES_DB`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL=http://localhost:5173`.
   - Các biến có giá trị mặc định đã chốt ở vòng WebSocket (không bắt buộc khai báo nếu giữ mặc định):
     - `DATABASE_POOL_MAX=20` (số kết nối tối đa của `pg.Pool` trong API)
     - `WS_MAX_CONNECTIONS_PER_USER=4` (giới hạn 4 tab cập nhật trực tiếp đồng thời mỗi tài khoản theo quy tắc giới hạn tab MK-142)
     - `BINANCE_WS_URL=wss://stream.binance.com:9443/stream` (đầu nối Binance Spot combined stream)
   - Đảm bảo `VITE_API_MOCKING` không đặt hoặc bằng `false` để kết nối API và Binance thật.
3. **Chạy toàn bộ ứng dụng:**
   - `pnpm dev`
   - Mở trình duyệt tại `http://localhost:5173`, đăng nhập tài khoản đã xác minh email và điều hướng tới `/realtime` [[1]](#ref-1) [[2]](#ref-2).

## 2. Kịch bản demo 4 luồng chính trên giao diện

### Luồng A — Xem dữ liệu trực tiếp từ Binance và đóng nến (`MK-93`–`MK-95`)

1. Khi mở `/realtime`, màn hình tải mặc định `BTCUSDT` với 4 chart (`5m`, `15m`, `1h`, `4h`) và khung `Market summary · BTCUSDT` bên phải.
2. Quan sát thanh trạng thái kết nối (`data-testid="realtime-connection-status"`): chuyển từ `Syncing · Đang đồng bộ` sang `Live · Đang trực tiếp` ngay sau khi 4 chart và sidebar hợp nhất xong.
3. Mở DevTools → tab **Network**:
   - Lọc **Fetch/XHR**: sau 5 request tải lịch sử đầu tiên (4 `/api/market-data/candles` + 1 `/api/market-data/summary`), **không còn request HTTP lặp lại mỗi 5 giây**.
   - Lọc **WS**: có duy nhất 1 kết nối `/api/market-data/ws` (`101 Switching Protocols`). Các khung `candle`, `summary` và `heartbeat` (mỗi 5 giây) chảy về liên tục; giá `Close`, `Volume`, `MA(20) (provisional)`, `Data time` trên từng chart và `Last price` / `Change (24h)` trên sidebar tự nhảy ngay khi có tick mới.
4. Khi qua mốc phút chẵn của timeframe đang xem (hoặc đổi Chart 1 sang `1m` để quan sát trong vòng ≤ 60 giây): khi khung `candle` có `isClosed: true` đến, nến vừa đóng chốt giá và MA, còn nến mới mở nối vào cuối trục thời gian mà vẫn giữ cửa sổ tối đa 500 nến hiển thị.

### Luồng B — Multi-chart, đổi timeframe độc lập và đổi pair (`MK-04`–`MK-06`, `MK-96`, `MK-97`, `MK-125`)

1. **Đổi timeframe 1 chart không làm gián đoạn chart khác:**
   - Trên Chart 1, mở combobox `Timeframe for chart 1` và chọn `1m`.
   - Trong DevTools → WS → **Messages**: trình duyệt chỉ gửi 1 khung `{"type":"unsubscribe","channels":[{"kind":"kline","pair":"BTCUSDT","timeframe":"5m"}]}` và 1 khung `{"type":"subscribe","channels":[{"kind":"kline","pair":"BTCUSDT","timeframe":"1m"}]}`.
   - Trong tab **Fetch/XHR**: chỉ có 1 request `GET /api/market-data/candles?pair=BTCUSDT&timeframe=1m`. Ba chart còn lại (`15m`, `1h`, `4h`) và sidebar tiếp tục nhận cập nhật trực tiếp không bị tải lại.
2. **Hai chart cùng timeframe dùng chung 1 kênh subscribe:**
   - Chọn Chart 2 về `1m` (cùng `1m` với Chart 1): trình duyệt không gửi lệnh `subscribe` trùng cho `kline:BTCUSDT:1m`. Cả hai chart cùng cập nhật giá `1m`, nhưng người dùng có thể kéo/zoom Chart 1 về quá khứ bằng phím `-` hoặc chuột trong khi Chart 2 vẫn bám nến cuối độc lập.
3. **Đổi pair toàn màn hình và đổi số lượng chart (`1` / `2` / `4`):**
   - Mở combobox `Pair` và chọn `ETHUSDT`: trình duyệt gửi `unsubscribe` toàn bộ kênh `BTCUSDT`, `subscribe` các kênh `ETHUSDT` kèm tải lịch sử mới, không để giá `BTCUSDT` cũ xuất hiện dưới nhãn `ETHUSDT`.
   - Bấm nút số chart `2` hoặc `1`: các kênh của chart ẩn được `unsubscribe` ngay; bấm lại `4` thì chart hiện lại với đúng timeframe đã chọn trước đó.

### Luồng C — Tạm dừng, tiếp tục và giới hạn 4 tab đồng thời (`MK-107`–`MK-109`, `MK-123`, `MK-142`)

1. **Tạm dừng và tiếp tục:**
   - Bấm nút `Pause · Tạm dừng` (hoặc công tắc `Live updates`): kết nối WebSocket đóng sạch với mã `1000`, thanh trạng thái hiện `Paused at <thời điểm> · Đã tạm dừng` (không hiện cảnh báo mất kết nối).
   - Khi đang tạm dừng, đổi timeframe Chart 1 sang `5m`: ứng dụng chỉ gọi 1 request REST lấy lịch sử `5m`, không mở kết nối WebSocket và giữ nguyên trạng thái `Đã tạm dừng`.
   - Bấm `Resume · Tiếp tục`: ứng dụng mở lại WebSocket, chuyển qua `Syncing · Đang đồng bộ` để bù dữ liệu REST trong < 1 giây rồi về `Live · Đang trực tiếp`.
2. **Nhiều tab độc lập và giới hạn 4 tab:**
   - Mở thêm các tab `/realtime` trong cùng trình duyệt: tối đa 4 tab hoạt động độc lập (một tab đổi sang `SOLUSDT` hoặc tạm dừng không làm đổi các tab kia).
   - Khi mở tab thứ 5 của cùng tài khoản, server trả khung lỗi `CONNECTION_LIMIT_EXCEEDED` và đóng kết nối tab thứ 5 bằng mã `4429`; tab thứ 5 hiện `Connection limit reached · Vượt giới hạn tab trực tiếp` và dừng tự kết nối lại, trong khi 4 tab đầu vẫn `Live · Đang trực tiếp`.

### Luồng D — Ngắt mạng, phục hồi đồng bộ bù nến và thu hồi phiên (`MK-98`–`MK-106`, `MK-121`)

1. **Ngắt kết nối và tự đồng bộ bù nến:**
   - Trong DevTools → tab **Network**, chuyển chế độ throttling sang **Offline** (hoặc dừng tạm tiến trình API): thanh trạng thái chuyển sang `Disconnected at <thời điểm>, retrying · Mất kết nối, đang thử lại` kèm nút `Reconnect · Kết nối lại`; toàn bộ nến và giá cuối cùng vẫn giữ nguyên trên màn hình.
   - Bật lại mạng (**No throttling**) hoặc bấm `Reconnect · Kết nối lại` (nút tự khóa `disabled` trong lúc đang mở kết nối): khi kết nối mở lại, thanh trạng thái hiển thị `Syncing · Đang đồng bộ` trong lúc đệm sự kiện mới và gọi REST backfill bù các nến đã đóng trong thời gian mất mạng, sau đó mới chuyển về `Live · Đang trực tiếp`.
2. **Cưỡng chế thu hồi phiên trên mọi tab:**
   - Mở 2 tab `/realtime` đang `Live · Đang trực tiếp`. Trên tab 1 bấm **Sign out** (hoặc đổi mật khẩu): cả 2 tab đều nhận mã đóng `4401` tức thì (< 5 giây), dừng mọi cập nhật/reconnect và hiển thị màn chặn đăng nhập.

## 3. Lệnh chạy lại bộ kiểm chứng tự động và benchmark

| Mục kiểm chứng | Lệnh chạy từ thư mục gốc |
| --- | --- |
| Unit test contract WebSocket & Env (`packages/shared`) | `pnpm --filter @crypto-force/shared exec vitest run src/schemas/market-data-ws.schema.test.ts` |
| Integration test Adapter, Hub, Cache invalidation & WS Gateway (`apps/api`) | `pnpm --filter @crypto-force/api exec vitest run test/market-data/cache-invalidation.test.ts test/market-data/stream-provider.test.ts test/market-data/stream-hub.test.ts test/market-data/ws-gateway.test.ts` |
| Unit test hàm thuần hợp nhất nến & hook (`apps/web`) | `pnpm --filter @crypto-force/web test` |
| E2E Playwright 8 kịch bản WebSocket qua API/Auth/DB thật | `pnpm --filter @crypto-force/web exec playwright test --config playwright.market-data-ws.config.ts --workers=1` |
| Cổng 14 mutation & kiểm độ nhạy fake | `node apps/api/perf/market-data/ws-mutations.mjs` |
| Chẩn đoán 3 nhóm nguyên nhân (`diagnosis-timeline.json`) | `node --import tsx apps/api/perf/market-data/ws-diagnosis.mjs` |
| Smoke Binance Spot WebSocket thật 90 giây (`W8`) | `node --import tsx apps/api/perf/market-data/ws-binance-smoke.mjs` |
| Benchmark So sánh A, So sánh B (B1 vs B2) và 16 mẫu phục hồi (`W6`) | `node --import tsx apps/api/perf/market-data/ws-benchmark.mjs` |

## References

1. <a id="ref-1"></a>[Market Data & Realtime Updates](../../../../architecture/10-market-data.md)
2. <a id="ref-2"></a>[Kiểm chứng WebSocket cập nhật trực tiếp](../../../../testing/test-scopes/TS-002-market-data/websocket-verification.md)
