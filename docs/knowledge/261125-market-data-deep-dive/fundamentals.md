# Market Data Fundamentals — Transport và Latency

Đọc file này để nghiên cứu các câu hỏi về fundamentals — transport và latency và kiểm chứng mức độ hiểu bằng implementation thực tế.

## Tóm tắt

- **Agent đề xuất:** Trả lời từng câu bằng lời của mình, đối chiếu code, test và evidence trước khi tự đánh giá.
- **Agent đề xuất:** Các câu hỏi là nghiên cứu cá nhân, không phải kết luận đã kiểm chứng hay open decision của sản phẩm.
- Tài liệu nguồn ban đầu: [[1]](#ref-1) [[2]](#ref-2).

## Câu hỏi nghiên cứu

### Q01 — REST Polling và WebSocket khác nhau như thế nào về communication model, connection lifecycle và resource usage?

- **Cần nghiên cứu:** Khái niệm cốt lõi, vấn đề cần giải quyết, cơ chế hiện thực và trade-off cụ thể trong Crypto Force.
- **Evidence cần tìm:** Function/module thực tế, test hoặc benchmark phù hợp với phạm vi câu hỏi; không suy diễn từ số liệu ngoài workload.
- **Tự kiểm chứng:** Giải thích bằng một ví dụ lỗi hoặc sequence; chỉ ra code và chứng minh nhận định bằng nguồn.
- **Mức hiểu:** Chưa đánh giá (L0–L4).

### Q02 — Tại sao Market Data cần WebSocket thay vì chỉ dùng REST Polling?

- **Cần nghiên cứu:** Khái niệm cốt lõi, vấn đề cần giải quyết, cơ chế hiện thực và trade-off cụ thể trong Crypto Force.
- **Evidence cần tìm:** Function/module thực tế, test hoặc benchmark phù hợp với phạm vi câu hỏi; không suy diễn từ số liệu ngoài workload.
- **Tự kiểm chứng:** Giải thích bằng một ví dụ lỗi hoặc sequence; chỉ ra code và chứng minh nhận định bằng nguồn.
- **Mức hiểu:** Chưa đánh giá (L0–L4).

### Q03 — WebSocket hoạt động như thế nào trên TCP? HTTP Upgrade, ping/pong và connection close có vai trò gì?

- **Cần nghiên cứu:** Khái niệm cốt lõi, vấn đề cần giải quyết, cơ chế hiện thực và trade-off cụ thể trong Crypto Force.
- **Evidence cần tìm:** Function/module thực tế, test hoặc benchmark phù hợp với phạm vi câu hỏi; không suy diễn từ số liệu ngoài workload.
- **Tự kiểm chứng:** Giải thích bằng một ví dụ lỗi hoặc sequence; chỉ ra code và chứng minh nhận định bằng nguồn.
- **Mức hiểu:** Chưa đánh giá (L0–L4).

### Q04 — Binance cung cấp dữ liệu Kline và Ticker như thế nào? Làm sao phân biệt nến đang mở và nến đã đóng?

- **Cần nghiên cứu:** Khái niệm cốt lõi, vấn đề cần giải quyết, cơ chế hiện thực và trade-off cụ thể trong Crypto Force.
- **Evidence cần tìm:** Function/module thực tế, test hoặc benchmark phù hợp với phạm vi câu hỏi; không suy diễn từ số liệu ngoài workload.
- **Tự kiểm chứng:** Giải thích bằng một ví dụ lỗi hoặc sequence; chỉ ra code và chứng minh nhận định bằng nguồn.
- **Mức hiểu:** Chưa đánh giá (L0–L4).

### Q05 — p50, p95, p99 latency là gì? Tại sao p95 thường hữu ích hơn average latency khi đánh giá realtime systems?

- **Cần nghiên cứu:** Khái niệm cốt lõi, vấn đề cần giải quyết, cơ chế hiện thực và trade-off cụ thể trong Crypto Force.
- **Evidence cần tìm:** Function/module thực tế, test hoặc benchmark phù hợp với phạm vi câu hỏi; không suy diễn từ số liệu ngoài workload.
- **Tự kiểm chứng:** Giải thích bằng một ví dụ lỗi hoặc sequence; chỉ ra code và chứng minh nhận định bằng nguồn.
- **Mức hiểu:** Chưa đánh giá (L0–L4).

## References

1. <a id="ref-1"></a>[Market Data & Realtime Updates](../../architecture/10-market-data.md)
2. <a id="ref-2"></a>[Kiểm chứng REST polling](../../testing/test-scopes/TS-002-market-data/rest-polling-verification.md)
