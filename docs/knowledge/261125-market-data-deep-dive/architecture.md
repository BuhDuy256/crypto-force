# Market Data Architecture — Data Flow và Shared Subscriptions

Đọc file này để nghiên cứu các câu hỏi về architecture — data flow và shared subscriptions và kiểm chứng mức độ hiểu bằng implementation thực tế.

## Tóm tắt

- **Agent đề xuất:** Trả lời từng câu bằng lời của mình, đối chiếu code, test và evidence trước khi tự đánh giá.
- **Agent đề xuất:** Các câu hỏi là nghiên cứu cá nhân, không phải kết luận đã kiểm chứng hay open decision của sản phẩm.
- Tài liệu nguồn ban đầu: [[1]](#ref-1) [[2]](#ref-2).

## Câu hỏi nghiên cứu

### Q06 — Dữ liệu Market Data đi qua những thành phần nào từ Binance đến chart của người dùng?

- **Cần nghiên cứu:** Khái niệm cốt lõi, vấn đề cần giải quyết, cơ chế hiện thực và trade-off cụ thể trong Crypto Force.
- **Evidence cần tìm:** Function/module thực tế, test hoặc benchmark phù hợp với phạm vi câu hỏi; không suy diễn từ số liệu ngoài workload.
- **Tự kiểm chứng:** Giải thích bằng một ví dụ lỗi hoặc sequence; chỉ ra code và chứng minh nhận định bằng nguồn.
- **Mức hiểu:** Chưa đánh giá (L0–L4).

### Q07 — Tại sao Frontend không kết nối trực tiếp tới Binance mà phải đi qua Backend?

- **Cần nghiên cứu:** Khái niệm cốt lõi, vấn đề cần giải quyết, cơ chế hiện thực và trade-off cụ thể trong Crypto Force.
- **Evidence cần tìm:** Function/module thực tế, test hoặc benchmark phù hợp với phạm vi câu hỏi; không suy diễn từ số liệu ngoài workload.
- **Tự kiểm chứng:** Giải thích bằng một ví dụ lỗi hoặc sequence; chỉ ra code và chứng minh nhận định bằng nguồn.
- **Mức hiểu:** Chưa đánh giá (L0–L4).

### Q08 — MarketDataProvider, MarketDataStreamProvider, Service và WebSocket Gateway có trách nhiệm khác nhau như thế nào?

- **Cần nghiên cứu:** Khái niệm cốt lõi, vấn đề cần giải quyết, cơ chế hiện thực và trade-off cụ thể trong Crypto Force.
- **Evidence cần tìm:** Function/module thực tế, test hoặc benchmark phù hợp với phạm vi câu hỏi; không suy diễn từ số liệu ngoài workload.
- **Tự kiểm chứng:** Giải thích bằng một ví dụ lỗi hoặc sequence; chỉ ra code và chứng minh nhận định bằng nguồn.
- **Mức hiểu:** Chưa đánh giá (L0–L4).

### Q09 — Shared Subscriptions và Fan-out hoạt động như thế nào? Tại sao 400 clients có thể dùng chung một upstream WebSocket connection?

- **Cần nghiên cứu:** Khái niệm cốt lõi, vấn đề cần giải quyết, cơ chế hiện thực và trade-off cụ thể trong Crypto Force.
- **Evidence cần tìm:** Function/module thực tế, test hoặc benchmark phù hợp với phạm vi câu hỏi; không suy diễn từ số liệu ngoài workload.
- **Tự kiểm chứng:** Giải thích bằng một ví dụ lỗi hoặc sequence; chỉ ra code và chứng minh nhận định bằng nguồn.
- **Mức hiểu:** Chưa đánh giá (L0–L4).

### Q10 — Reference Counting (refCount) quản lý subscription như thế nào? Tại sao hệ thống trì hoãn unsubscribe 5 giây?

- **Cần nghiên cứu:** Khái niệm cốt lõi, vấn đề cần giải quyết, cơ chế hiện thực và trade-off cụ thể trong Crypto Force.
- **Evidence cần tìm:** Function/module thực tế, test hoặc benchmark phù hợp với phạm vi câu hỏi; không suy diễn từ số liệu ngoài workload.
- **Tự kiểm chứng:** Giải thích bằng một ví dụ lỗi hoặc sequence; chỉ ra code và chứng minh nhận định bằng nguồn.
- **Mức hiểu:** Chưa đánh giá (L0–L4).

### Q11 — Một WebSocket connection có thể multiplex nhiều pair/timeframe streams như thế nào?

- **Cần nghiên cứu:** Khái niệm cốt lõi, vấn đề cần giải quyết, cơ chế hiện thực và trade-off cụ thể trong Crypto Force.
- **Evidence cần tìm:** Function/module thực tế, test hoặc benchmark phù hợp với phạm vi câu hỏi; không suy diễn từ số liệu ngoài workload.
- **Tự kiểm chứng:** Giải thích bằng một ví dụ lỗi hoặc sequence; chỉ ra code và chứng minh nhận định bằng nguồn.
- **Mức hiểu:** Chưa đánh giá (L0–L4).

### Q12 — Tại sao REST vẫn cần thiết sau khi đã triển khai WebSocket?

- **Cần nghiên cứu:** Khái niệm cốt lõi, vấn đề cần giải quyết, cơ chế hiện thực và trade-off cụ thể trong Crypto Force.
- **Evidence cần tìm:** Function/module thực tế, test hoặc benchmark phù hợp với phạm vi câu hỏi; không suy diễn từ số liệu ngoài workload.
- **Tự kiểm chứng:** Giải thích bằng một ví dụ lỗi hoặc sequence; chỉ ra code và chứng minh nhận định bằng nguồn.
- **Mức hiểu:** Chưa đánh giá (L0–L4).

### Q13 — REST Cache, Single-flight và Cache Invalidation hoạt động như thế nào? Tại sao phải invalidate cache khi nến đóng?

- **Cần nghiên cứu:** Khái niệm cốt lõi, vấn đề cần giải quyết, cơ chế hiện thực và trade-off cụ thể trong Crypto Force.
- **Evidence cần tìm:** Function/module thực tế, test hoặc benchmark phù hợp với phạm vi câu hỏi; không suy diễn từ số liệu ngoài workload.
- **Tự kiểm chứng:** Giải thích bằng một ví dụ lỗi hoặc sequence; chỉ ra code và chứng minh nhận định bằng nguồn.
- **Mức hiểu:** Chưa đánh giá (L0–L4).

### Q14 — Khi nhiều chart hoặc client cùng subscribe một pair/timeframe, hệ thống tránh duplicate upstream subscriptions như thế nào?

- **Cần nghiên cứu:** Khái niệm cốt lõi, vấn đề cần giải quyết, cơ chế hiện thực và trade-off cụ thể trong Crypto Force.
- **Evidence cần tìm:** Function/module thực tế, test hoặc benchmark phù hợp với phạm vi câu hỏi; không suy diễn từ số liệu ngoài workload.
- **Tự kiểm chứng:** Giải thích bằng một ví dụ lỗi hoặc sequence; chỉ ra code và chứng minh nhận định bằng nguồn.
- **Mức hiểu:** Chưa đánh giá (L0–L4).

## References

1. <a id="ref-1"></a>[Market Data & Realtime Updates](../../architecture/10-market-data.md)
2. <a id="ref-2"></a>[Architectural Decisions](../../architecture/30-decisions.md)
