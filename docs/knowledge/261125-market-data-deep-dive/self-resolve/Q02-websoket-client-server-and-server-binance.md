# Q02 - WebSocket kết nối Client, Backend và Binance như thế nào?

---

1. **WebSocket Architecture**

   Crypto Force duy trì hai tầng WebSocket connections độc lập:

   - **Downstream:** Client ↔ Backend.
   - **Upstream:** Backend ↔ Binance.

   Backend đóng đồng thời hai vai trò:
   - **WebSocket Server** đối với Browser.
   - **WebSocket Client** đối với Binance.

   

```mermaid
   flowchart LR
       C1[Client A]
       C2[Client B]
       C3[Client C]

       subgraph Backend
           G[WebSocket Gateway]
           H[MarketDataStreamHub]
           P[Binance WS Adapter]
           G <--> H
           H <--> P
       end

       B[Binance]

       C1 <-->|Downstream WS| G
       C2 <-->|Downstream WS| G
       C3 <-->|Downstream WS| G
       P <-->|Upstream WS| B
   ```

   Hai tầng WebSocket không phải một TCP connection xuyên suốt. Backend nhận dữ liệu từ Binance, xử lý và chuyển tiếp đến các clients tương ứng.

2. **Connection vs Subscription**

   - **Connection:** Đường truyền WebSocket giữa hai endpoints.
   - **Subscription:** Yêu cầu đăng ký nhận dữ liệu thuộc một channel, ví dụ `BTCUSDT:1m` .
   - **Multiplexing:** Một WebSocket connection mang nhiều logical subscriptions.
   - **Shared Subscriptions:** Nhiều downstream clients cùng sử dụng một logical upstream subscription.

3. **Shared Subscriptions và Reference Counting**

   - Mỗi Browser tab có một downstream WebSocket connection riêng.
   - Client gửi yêu cầu subscribe đến Backend.
   - `MarketDataStreamHub` quản lý subscribers theo channel.
   - Client đầu tiên subscribe → Backend đăng ký upstream channel với Binance.
   - Các clients tiếp theo subscribe cùng channel → Backend tái sử dụng upstream subscription.
   - Hub theo dõi các subscribers; số lượng subscribers tương ứng với `refCount` .
   - Khi không còn subscriber, Backend trì hoãn unsubscribe 5 giây để tránh subscribe/unsubscribe liên tục.

4. **Data Flow và Fan-out**

   

```mermaid
   sequenceDiagram
       participant A as Client A
       participant B as Client B
       participant H as Backend Hub
       participant X as Binance

       A->>H: Subscribe BTCUSDT:1m
       H->>X: SUBSCRIBE btcusdt@kline_1m
       B->>H: Subscribe BTCUSDT:1m
       Note over H,X: Reuse upstream subscription

       X-->>H: Candle Event
       par Fan-out
           H-->>A: Candle Event
       and
           H-->>B: Candle Event
       end

       A->>H: Unsubscribe
       Note over H: B vẫn subscribe
       B->>H: Unsubscribe
       Note over H: refCount = 0, delay 5s
       H->>X: UNSUBSCRIBE
   ```

   Luồng xử lý:

   - Browser kết nối tới `/api/market-data/ws` .
   - WebSocket Gateway xác thực connection và nhận `subscribe` .
   - Hub quản lý subscription và yêu cầu Binance WS Adapter đăng ký stream nếu cần.
   - Binance gửi market event qua upstream WebSocket.
   - Adapter chuẩn hóa dữ liệu.
   - Hub xác định subscribers, serialize event một lần và **fan-out** tới các clients.
   - Frontend nhận event để cập nhật chart.

5. **Ví dụ: 100 clients cùng xem BTCUSDT:1m**

   | Thành phần | Số lượng |
   |---|---:|
   | Downstream WebSocket connections | 100 |
   | Upstream WebSocket connections | 1 |
   | Logical upstream subscriptions | 1 |
   | Event từ Binance cho mỗi lần cập nhật | 1 |
   | Client nhận event qua fan-out | 100 |

   Đây là ví dụ minh họa khi 100 client connections được cho phép và đang hoạt động.

6. **Key Takeaway**

   - **Downstream:** Client ↔ Backend.
   - **Upstream:** Backend ↔ Binance.
   - **Multiplexing:** Một connection chứa nhiều subscriptions.
   - **Shared Subscriptions:** Nhiều clients chia sẻ upstream subscription.
   - **Fan-out:** Một event được phân phối đến nhiều clients.

   **Mental Model:** Connection là đường truyền; subscription xác định dữ liệu cần nhận; Hub liên kết subscribers với dữ liệu từ Binance.

---

## References

1. [Market Data Architecture](https://github.com/BuhDuy256/crypto-force/blob/feat/market-data/websocket/docs/architecture/10-market-data.md)
2. [Frontend WebSocket Client](https://github.com/BuhDuy256/crypto-force/blob/feat/market-data/websocket/apps/web/app/api/market-data-ws.ts)
3. [Backend WebSocket Gateway](https://github.com/BuhDuy256/crypto-force/blob/feat/market-data/websocket/apps/api/src/api/ws/market-data.ws.ts)
4. [MarketDataStreamHub](https://github.com/BuhDuy256/crypto-force/blob/feat/market-data/websocket/apps/api/src/services/market-data-stream.service.ts)
5. [Binance WebSocket Adapter](https://github.com/BuhDuy256/crypto-force/blob/feat/market-data/websocket/apps/api/src/providers/market-data/binance-stream.provider.ts)
