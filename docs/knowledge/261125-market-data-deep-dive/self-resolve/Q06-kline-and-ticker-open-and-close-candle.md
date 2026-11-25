# Q06 - Kline và Ticker là gì? Nến đang mở và nến đã đóng khác nhau như thế nào?

Đọc file này để hiểu dữ liệu Kline, Ticker, vòng đời của một nến và cách Crypto Force nhận, xử lý và hiển thị dữ liệu từ Binance.

## Tóm tắt

* **Kline (Candlestick Data):** Dữ liệu giá và khối lượng giao dịch trong một khung thời gian, thường được biểu diễn bằng OHLCV.
* **Ticker:** Dữ liệu tóm tắt thị trường. Crypto Force dùng giá gần nhất và tỷ lệ thay đổi giá trong 24 giờ.
* **Open Candle (Nến đang mở):** Nến chưa kết thúc khung thời gian. Giá và khối lượng vẫn có thể thay đổi.
* **Closed Candle (Nến đã đóng):** Nến đã hoàn tất. Crypto Force dùng `isClosed` để xác định trạng thái nến [[1]](#ref-1).
* Binance cung cấp dữ liệu Kline và Ticker qua REST và WebSocket. Backend chuẩn hóa dữ liệu trước khi gửi tới Frontend [[2]](#ref-2) [[3]](#ref-3).

---

1. **Kline và Ticker khác nhau như thế nào?**

   | Đặc điểm | Kline | Ticker |
   |---|---|---|
   | Mục đích | Biểu diễn giá trong một khoảng thời gian | Tóm tắt thông tin thị trường |
   | Dữ liệu chính | Open, High, Low, Close, Volume | Last Price, 24h Price Change |
   | Phụ thuộc Timeframe | Có: `1m` , `5m` , `1h` ... | Không, với 24h Ticker của Crypto Force |
   | Hiển thị | Candlestick Chart (biểu đồ nến) | Giá và mức thay đổi ở Sidebar |
   | REST API | `/api/v3/klines` | `/api/v3/ticker/24hr` |
   | WebSocket Stream | `btcusdt@kline_1m` | `btcusdt@ticker` |

   Crypto Force sử dụng hai nguồn dữ liệu này cho những mục đích khác nhau [[2]](#ref-2) [[3]](#ref-3).

2. **OHLCV là gì?**

   OHLCV mô tả giá và khối lượng giao dịch trong một khoảng thời gian.

   | Field | Ý nghĩa |
   |---|---|
   | **Open (O)** | Giá giao dịch đầu tiên của nến |
   | **High (H)** | Giá cao nhất trong nến |
   | **Low (L)** | Giá thấp nhất trong nến |
   | **Close (C)** | Giá giao dịch gần nhất trong nến |
   | **Volume (V)** | Tổng khối lượng giao dịch trong nến |

   Ví dụ giả định cho BTCUSDT khung `1m` :

   | Open | High | Low | Close | Volume |
   |---:|---:|---:|---:|---:|
   | 95.000 | 95.200 | 94.900 | 95.100 | 12, 5 |

   Một nến còn có `openTime` (thời điểm bắt đầu) và `isClosed` (trạng thái hoàn tất).

3. **Open Candle và Closed Candle**

   Một nến `1m` đại diện cho một khoảng thời gian một phút.

   

```mermaid
   flowchart LR
       A["10:00:00<br/>Mở nến"]
       B["10:00:20<br/>Giá thay đổi"]
       C["10:00:45<br/>Giá thay đổi"]
       D["10:01:00<br/>Sang khung mới"]

       A --> B --> C --> D
   ```

   | | Open Candle | Closed Candle |
   |---|---|---|
   | Trạng thái | Đang hình thành | Đã hoàn tất |
   | `isClosed` | `false` | `true` |
   | Open | Giữ nguyên | Giữ nguyên |
   | High / Low | Có thể thay đổi | Giá trị cuối cùng |
   | Close | Có thể thay đổi | Giá đóng cuối cùng |
   | Volume | Có thể tăng | Khối lượng cuối cùng |

   **Ví dụ giả định về một nến BTCUSDT:**

   | Thời điểm | Close | High | Volume | isClosed |
   |---|---:|---:|---:|---|
   | 10:00:00 | 95.000 | 95.000 | 1 | false |
   | 10:00:20 | 95.100 | 95.100 | 5 | false |
   | 10:00:45 | 95.050 | 95.200 | 9 | false |
   | Khi nến hoàn tất | 95.150 | 95.200 | 12 | true |

   Khi nến đóng, Binance phát cập nhật với `k.x = true` . Binance WS Adapter chuyển giá trị này thành `isClosed: true` [[2]](#ref-2).

   **Lưu ý:** Hết khoảng thời gian của nến không có nghĩa Frontend đã nhận được sự kiện đóng nến. Client vẫn cần xử lý sự kiện đến từ nguồn.

4. **Binance gửi dữ liệu Kline và Ticker như thế nào?**

   

```mermaid
   flowchart TD
       B["Binance WebSocket"]
       K["Kline Event<br/>btcusdt@kline_1m"]
       T["Ticker Event<br/>btcusdt@ticker"]
       A["Binance WS Adapter"]
       C["Candle<br/>OHLCV + isClosed"]
       S["MarketSummary<br/>lastPrice + change24hPercent"]

       B --> K
       B --> T
       K --> A
       T --> A
       A --> C
       A --> S
   ```

   Binance WS Adapter đọc và chuẩn hóa hai loại sự kiện [[2]](#ref-2).

   **Kline Event:**

   | Binance Field | Crypto Force Field |
   |---|---|
   | `k.t` | `openTime` |
   | `k.i` | `timeframe` |
   | `k.o` | `open` |
   | `k.h` | `high` |
   | `k.l` | `low` |
   | `k.c` | `close` |
   | `k.v` | `volume` |
   | `k.x` | `isClosed` |

   **Ticker Event:**

   | Binance Field | Crypto Force Field |
   |---|---|
   | `s` | `pair` |
   | `c` | `lastPrice` |
   | `P` | `change24hPercent` |

`dataTime` là thời điểm Backend nhận và chuẩn hóa dữ liệu. Trường `E` của sự kiện Binance được giữ thành `sourceTime` khi có giá trị [[2]](#ref-2).

5. **Crypto Force xử lý nến mở và nến đóng như thế nào?**

   - Khi nhận nến mở, Frontend cập nhật OHLCV của nến có cùng `openTime` .
   - Khi nhận nến đóng, Frontend lưu giá trị cuối cùng của nến và tiếp tục xử lý các nến mới.
   - Hệ thống dùng `openTime` để nhận diện nến và `dataTime` để tránh áp dụng cập nhật cũ lên dữ liệu mới.
   - Backend kiểm tra giá trị OHLCV trước khi phân phối sự kiện.
   - Khi nhận nến đóng, `MarketDataStreamHub` gọi `onCandleClosed` để vô hiệu hóa dữ liệu nến đã lưu trong REST Cache [[1]](#ref-1) [[4]](#ref-4).

   **Ví dụ giả định:** Nếu nến `10:00` đã đóng nhưng Client nhận lại một cập nhật cũ của chính nến đó, hệ thống cần tránh ghi đè giá trị cuối cùng bằng dữ liệu cũ.

6. **Key Takeaway (Kết luận)**

   - **Kline:** Cung cấp OHLCV để vẽ biểu đồ nến.
   - **Ticker:** Cung cấp thông tin tóm tắt giá và biến động thị trường.
   - **Open Candle:** Nến đang hình thành. Các giá trị High, Low, Close và Volume có thể thay đổi.
   - **Closed Candle:** Nến đã hoàn tất, có `isClosed = true` .
   - ** `openTime` :** Xác định nến thuộc khung thời gian nào.
   - ** `dataTime` :** Giúp hệ thống xác định thời điểm dữ liệu được cập nhật.
   - ** `isClosed` :** Phân biệt nến đang hình thành với nến đã hoàn tất.

   **Mental Model:** Kline trả lời *"Giá thay đổi như thế nào trong một khung thời gian?"*. Ticker trả lời *"Giá gần nhất và mức biến động thị trường hiện tại là bao nhiêu?"*.

---

## References

1. <a id="ref-1"></a>[Market Data & Realtime Updates](../../architecture/10-market-data.md)
2. <a id="ref-2"></a>[binance-stream.provider.ts](../../../apps/api/src/providers/market-data/binance-stream.provider.ts)
3. <a id="ref-3"></a>[binance.provider.ts](../../../apps/api/src/providers/market-data/binance.provider.ts)
4. <a id="ref-4"></a>[market-data-stream.service.ts](../../../apps/api/src/services/market-data-stream.service.ts)
