# O01 - **Khác biệt cốt lõi giữa REST Polling và WebSocket khi muốn select là gì? Vấn đề mà 2 cái giải quyết? Trade-offs là gì?**

Đọc file này để trả lời câu hỏi so sánh Rest Polling và Web Socket được nêu trong [[1]](#ref-1) (câu hỏi đã được rewrite so với câu hỏi gốc, là quyết định của writer)

---

1. Rest Polling = Client chủ động hỏi Server về data theo chu kỳ.

2. Web Socket = Server chủ động gửi data cho Client mà không đợi hỏi.

3. Rest Polling gây trễ data. Ví dụ: 10h client lấy new price + Binance có new price ở 10:00:01, nhưng mà Rest Polling fetchs mỗi 5 giây thì new price đã trễ 4 giây. 

> Độ trễ của Rest Polling là **độ trễ của polling interval**.

4. WebSokcet thì update realtime nên là 10:00:01 nhận data.

> Độ trễ của Web Socket là **độ trễ của network**.  

5. Chi phí mà Rest Polling bỏ ra: `repeated requrest`, `response payload`, `backend processing`.

6. Chi phí mà Web Socket bỏ ra: `open connections`, `connection state`, `buffers`, `heartbeat`.

7. Web Socket có ưu điểm:

* Đơn giản, không như Web Socket phải: Subscription Registry, connection heartbeat, reconnect và resubscribe, fan-out nhiều client, theo dõi client nào vẫn còn subscribe. 

* Dễ test + retry, vì có input và output rõ ràng. (Không có nghĩa là Web Socket khó test, nó chỉ khó ở integration & e2e tests)

* Phù hợp với Stateless API. Giải thích kĩ hơn:
    - Stateless API == Server không cần ghi nhớ trạng thái hội thoại của các request trước đó để xử lí request tiếp theo.
    - **Stateless API giúp horizontal scaling và failover dễ hơn rất nhiều**. 
    - WebSocket là Stateful, trong backend phải lưu:

```
subscriptions = new Map([
    ["client-A", ["BTCUSDT:1m"]].
    ["client-B", ["BTCUSDT:1m, "ETHUSDT:5m"]].
]);
```

* Dễ HTTP Caching, tích hợp Load Balancer, HTTP obserability (dễ dàng phân phối traffic đến nhiều server instances).

8. HTTP Polling có nhược điểm ở việc chọn interval + nhiều client polling cùng lúc + payload là toàn bộ candle window. 

### 9. REST Polling vs WebSocket — Trade-off Matrix

**Core Difference:** REST Polling sử dụng client-driven pull theo chu kỳ, trong khi WebSocket hỗ trợ event-driven push qua một persistent, bidirectional connection.

**Legend:**
* `+` Advantage — Có lợi trong workload đang xét.
* `-` Disadvantage — Có bất lợi trong workload đang xét.
* `±` Context-dependent — Tùy yêu cầu và kiến trúc.

| Dimension | REST Polling | WebSocket | Trade-off / When it matters |
|---|---|---|---|
| **Communication Model** | `-` Client pull theo chu kỳ | `+` Server push theo event | Push phù hợp khi cần dữ liệu mới ngay; pull phù hợp khi chỉ cần kiểm tra định kỳ. |
| **Connection Lifecycle** | `±` Request-response độc lập; có thể tái sử dụng TCP | `±` Persistent WebSocket connection | Persistent connection phù hợp với streaming nhưng cần heartbeat, cleanup và quản lý tài nguyên. |
| **Application State** | `+` Thường không cần lưu subscription state | `-` Thường phải lưu connection và subscription state | Ít state giúp vận hành đơn giản; subscription state cho phép push đúng đối tượng. |
| **Latency / Freshness** | `-` Phụ thuộc polling interval | `+` Không phải chờ chu kỳ polling | WebSocket phù hợp hơn khi freshness là requirement quan trọng. |
| **Network Overhead** | `-` Request/response lặp lại | `+` Event frames và heartbeat | WebSocket thường hiệu quả hơn khi update thường xuyên; update hiếm có thể không đáng giữ connection. |
| **Recovery** | `+` Retry request và lấy snapshot mới | `-` Reconnect, resubscribe, có thể cần backfill | WebSocket reconnect không tự đảm bảo phục hồi các event bị bỏ lỡ. |
| **Scaling** | `±` HTTP requests dễ phân phối độc lập | `±` Long-lived connections và fan-out | REST thuận lợi cho stateless scaling; WebSocket có thể giảm upstream work nhờ shared subscriptions. |
| **Data Access** | `±` Snapshot, history, query theo nhu cầu | `±` Continuous live updates | Hai cơ chế phục vụ những nhu cầu khác nhau và thường được kết hợp. |

#### Decision Rule

* **Choose REST Polling:** Khi dữ liệu không yêu cầu realtime nghiêm ngặt, tần suất cập nhật thấp và ưu tiên simplicity.
* **Choose WebSocket:** Khi dữ liệu cập nhật thường xuyên, yêu cầu low latency và cần server-driven push.
* **Choose Hybrid:** Khi cần cả historical snapshots, realtime updates và recovery/backfill.

#### Key Insight

**Technical Property + Requirement = Trade-off Evaluation**

Một đặc tính kỹ thuật không mặc định là ưu điểm hoặc nhược điểm.

Ví dụ:
* REST thường không cần lưu subscription state → đơn giản hơn khi scale HTTP requests.
* WebSocket cần quản lý subscription state → phức tạp hơn, nhưng hỗ trợ selective push và shared subscriptions.

**Crypto Force:** REST được sử dụng để lấy historical candles và backfill, trong khi WebSocket xử lý live market updates.

> Trade-offs should be evaluated against requirements, not treated as absolute advantages or disadvantages.

---

## References

1. <a id="ref-1"></a>[Market Data Fundamentals](../fundamentals.md)
