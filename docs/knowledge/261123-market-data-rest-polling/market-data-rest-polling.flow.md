# Luồng lấy dữ liệu nến qua các layer

Đọc file này để biết một yêu cầu lấy nến đi từ `MarketChartCard` qua những hàm nào tới Binance, mỗi layer kiểm gì và lỗi được phân loại ở đâu.

Các mã yêu cầu dạng `MK-xx` trong file là requirement của [Market Data](../../UCs/market-data.md) [[1]](#ref-1).

## Tóm tắt

- Web gọi `getCandleHistory` trong [market-data.ts](../../../apps/web/app/api/market-data.ts) [[4]](#ref-4); API trả `CandleHistory` đã kiểm bằng schema của `packages/shared`, nên hai đầu nói cùng một contract.
- Phía API, yêu cầu đi Route → `requireSession` → Controller → Service → `MarketDataProvider` → Cache decorator → adapter Binance. Service chỉ import interface nên không phụ thuộc Binance [[2]](#ref-2), còn adapter là nơi duy nhất biết API của Binance [[7]](#ref-7).
- Cache decorator nằm giữa Service và adapter: khóa còn hạn thì trả snapshot đã giữ kèm `dataTime` cũ, hết hạn mới gọi Binance [[6]](#ref-6).
- Service xin `REQUEST_CANDLES = 500 + 20 - 1 = 519` nến, để Web vẽ 500 nến mà vẫn tính được MA(20) từ nến đầu tiên [[5]](#ref-5).
- Service phân loại lỗi thành `MARKET_DATA_UNAVAILABLE` (503) và `MARKET_DATA_INVALID` (502); Web chỉ nhận `code`, không nhận chi tiết của Binance và chỉ gọi lại khi người dùng bấm Retry [[8]](#ref-8).

## Luồng thành công

```mermaid
sequenceDiagram
    participant C as MarketChartCard
    participant H as useCandleHistory
    participant F as getCandleHistory (api/market-data.ts)
    participant R as requireSession (route)
    participant K as controller.candles
    participant S as service.getCandleHistory
    participant D as read (cache decorator)
    participant P as binance.getCandles
    participant X as Binance /api/v3/klines

    C->>H: pair, timeframe, live
    H->>H: queryKey ['market-data', 'candles', pair, timeframe]
    alt Query đã có query.data
        H-->>C: query.data đã giữ, không gửi HTTP
    else Chưa có dữ liệu hoặc query hết hạn
        H->>F: queryFn({ signal })
        F->>F: readJson đặt deadline CHART_TIMEOUT_MS (MK-34)
        F->>R: GET /api/market-data/candles
        R->>R: auth.api.getSession, Cache-Control no-store (MK-40)
        R->>K: candles(req.query)
        K->>K: candleHistoryInputSchema.safeParse (MK-30, MK-32)
        K->>S: service.getCandleHistory(input)
        S->>S: limit = REQUEST_CANDLES = 519 (MK-33, MK-24)
        S->>D: provider.getCandles({ pair, timeframe, limit })
        D->>D: key = candles:pair:timeframe:limit
        alt Khóa còn hạn trong cache
            D-->>S: snapshot đã giữ, cùng dataTime
        else Khóa hết hạn hoặc chưa có
            D->>P: provider.getCandles(request)
            P->>X: fetch kèm AbortController và deadline của adapter
            X-->>P: mảng kline thô
            P->>P: klineSchema, dataTime = now(), isClosed = closeTime < dataTime (MK-25)
            P-->>D: { candles, dataTime }
            D->>D: ghi cache theo ttlMs
            D-->>S: snapshot mới, dataTime mới
        end
        S->>S: candleHistorySchema, warmupCount = độ dài trừ 500 (MK-45, MK-52)
        S-->>K: CandleHistory
        K-->>F: res.json(...) 200
        F->>F: schema, data.pair và data.timeframe khớp input
        F-->>H: CandleHistory
        H->>H: bỏ response có dataTime cũ hơn query.data (MK-79)
    end
    H-->>C: query
```

Mỗi layer chỉ nhận thứ lớp trước đưa, và mọi tên hàm trong diagram là tên thật trong source:

| Thành phần | Hàm hoặc biến | Việc làm |
| --- | --- | --- |
| Card | `useCandleHistory(pair, timeframe, live)` [[3]](#ref-3) | Tạo query theo lựa chọn của chart |
| Hook | `queryFn({ signal })` | Gọi API và so `dataTime` trước khi nhận |
| Web API | `getCandleHistory`, `readJson` [[4]](#ref-4) | Đặt deadline, đọc JSON, kiểm contract, trả `CandleHistory` |
| Route | `requireSession(auth)` [[9]](#ref-9) | Chặn request không có phiên |
| Controller | `candles(req, res)` | Kiểm query bằng schema, gọi service, `res.json` |
| Service | `getCandleHistory`, `run` [[5]](#ref-5) | Tính `limit`, gọi provider, kiểm nến, log và phân loại lỗi |
| Interface | `MarketDataProvider` [[2]](#ref-2) | Kiểu domain mà mọi provider phải trả |
| Cache | `read(entries, key, load)` [[6]](#ref-6) | Cache theo khóa, gộp request trùng, cache cả lỗi |
| Adapter | `request`, `getCandles` [[7]](#ref-7) | Gọi Binance, áp timeout và cooldown, chuẩn hóa sang kiểu domain |

Giá trị của các hằng số, tất cả đều là cấu hình chứ không phải hằng số rải trong code:

| Hằng số | Nơi khai báo | Giá trị | Ý nghĩa |
| --- | --- | --- | --- |
| `CHART_TIMEOUT_MS` | [market-data.ts](../../../apps/web/app/api/market-data.ts) | 10 000 ms | Deadline của request nến ở Web; hết hạn thì request kết thúc với `TIMEOUT` (MK-34) |
| `REQUEST_CANDLES` | [market-data.service.ts](../../../apps/api/src/services/market-data.service.ts) | 519 | Số nến xin từ provider: 500 để vẽ, 19 để MA(20) có giá trị ngay từ nến đầu |
| `DISPLAY_CANDLES`, `MA_PERIOD` | [market-data.service.ts](../../../apps/api/src/services/market-data.service.ts) | 500, 20 | Số nến hiển thị và chu kỳ MA; `warmupCount` bằng số nến vượt quá 500 |
| `timeoutMs` | [index.ts](../../../apps/api/src/index.ts) | 5000 ms | Deadline gọi Binance, ngắn hơn deadline của Web để API kịp trả lỗi đã phân loại |
| `ttlMs` | [index.ts](../../../apps/api/src/index.ts) | 5000 ms | Thời gian sống của một khóa cache, bằng chu kỳ làm mới của Web |

## Nhánh lỗi

```mermaid
sequenceDiagram
    participant C as MarketChartCard
    participant H as useCandleHistory
    participant F as getCandleHistory
    participant R as requireSession
    participant K as controller.candles
    participant S as service.getCandleHistory
    participant B as binance provider
    participant E as errorHandler

    C->>H: Chart cần dữ liệu
    H->>F: queryFn({ signal })
    F->>R: GET /api/market-data/candles
    R->>K: Có phiên hợp lệ
    K->>S: getCandleHistory
    S->>B: provider.getCandles
    alt Nguồn dữ liệu không khả dụng (MK-39)
        B-->>S: MarketDataProviderError kind 'unavailable'
        S-->>E: AppError 503 MARKET_DATA_UNAVAILABLE
    else Nến sai sau chuẩn hóa (MK-45)
        B-->>S: Nến không khớp candleHistorySchema
        S-->>E: AppError 502 MARKET_DATA_INVALID
    else Query không hợp lệ (MK-30, MK-32)
        K-->>E: AppError 400 INVALID_QUERY
    end
    E-->>F: { error: { code, message } }
    Note over F: Deadline 10 000 ms kết thúc request bằng AbortError (MK-34)
    F-->>H: MarketDataRequestError(code)
    H-->>C: query.isError, query.error
    C->>C: Không tự thử lại, hiện Retry (MK-12, MK-82)
    C->>H: query.refetch() khi người dùng bấm Retry
```

Không có phiên hợp lệ thì `requireSession` dừng trước Controller bằng `AppError` mang `UNAUTHENTICATED`; Web đổi `code` đó thành lần kiểm phiên lại qua `useSessionGate` thay vì hiện lỗi của chart (MK-40). Thứ tự deadline cũng rõ: adapter gọi Binance tối đa 5000 ms, Web chờ tối đa 10 000 ms, nên lỗi đã phân loại tới được Web trước khi Web tự hết hạn.

## References

1. <a id="ref-1"></a>[Market Data](../../UCs/market-data.md)
2. <a id="ref-2"></a>[market-data-provider.ts](../../../apps/api/src/providers/market-data/market-data-provider.ts)
3. <a id="ref-3"></a>[useMarketData.ts](../../../apps/web/app/hooks/useMarketData.ts)
4. <a id="ref-4"></a>[market-data.ts (Web API)](../../../apps/web/app/api/market-data.ts)
5. <a id="ref-5"></a>[market-data.service.ts](../../../apps/api/src/services/market-data.service.ts)
6. <a id="ref-6"></a>[cached-market-data.provider.ts](../../../apps/api/src/providers/market-data/cached-market-data.provider.ts)
7. <a id="ref-7"></a>[binance.provider.ts](../../../apps/api/src/providers/market-data/binance.provider.ts)
8. <a id="ref-8"></a>[index.ts (composition root)](../../../apps/api/src/index.ts)
9. <a id="ref-9"></a>[session.middleware.ts](../../../apps/api/src/api/middlewares/session.middleware.ts)
