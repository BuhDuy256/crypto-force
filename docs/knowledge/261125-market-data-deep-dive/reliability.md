# Market Data Reliability — Correctness, Recovery và Security

Đọc file này để nghiên cứu các câu hỏi về reliability — correctness, recovery và security và kiểm chứng mức độ hiểu bằng implementation thực tế.

## Tóm tắt

- **Agent đề xuất:** Trả lời từng câu bằng lời của mình, đối chiếu code, test và evidence trước khi tự đánh giá.
- **Agent đề xuất:** Các câu hỏi là nghiên cứu cá nhân, không phải kết luận đã kiểm chứng hay open decision của sản phẩm.
- Tài liệu nguồn ban đầu: [[1]](#ref-1) [[2]](#ref-2).

## Câu hỏi nghiên cứu

### Q15 — Làm sao đảm bảo dữ liệu OHLCV trên chart không bị thiếu, trùng hoặc ghi đè bởi event cũ?

- **Cần nghiên cứu:** Khái niệm cốt lõi, vấn đề cần giải quyết, cơ chế hiện thực và trade-off cụ thể trong Crypto Force.
- **Evidence cần tìm:** Function/module thực tế, test hoặc benchmark phù hợp với phạm vi câu hỏi; không suy diễn từ số liệu ngoài workload.
- **Tự kiểm chứng:** Giải thích bằng một ví dụ lỗi hoặc sequence; chỉ ra code và chứng minh nhận định bằng nguồn.
- **Mức hiểu:** Chưa đánh giá (L0–L4).

### Q16 — Điều gì xảy ra khi Binance WebSocket bị disconnect? Hệ thống reconnect và REST backfill theo trình tự nào?

- **Cần nghiên cứu:** Khái niệm cốt lõi, vấn đề cần giải quyết, cơ chế hiện thực và trade-off cụ thể trong Crypto Force.
- **Evidence cần tìm:** Function/module thực tế, test hoặc benchmark phù hợp với phạm vi câu hỏi; không suy diễn từ số liệu ngoài workload.
- **Tự kiểm chứng:** Giải thích bằng một ví dụ lỗi hoặc sequence; chỉ ra code và chứng minh nhận định bằng nguồn.
- **Mức hiểu:** Chưa đánh giá (L0–L4).

### Q17 — Làm sao phân biệt WebSocket đã reconnect với dữ liệu trên chart đã thực sự đồng bộ?

- **Cần nghiên cứu:** Khái niệm cốt lõi, vấn đề cần giải quyết, cơ chế hiện thực và trade-off cụ thể trong Crypto Force.
- **Evidence cần tìm:** Function/module thực tế, test hoặc benchmark phù hợp với phạm vi câu hỏi; không suy diễn từ số liệu ngoài workload.
- **Tự kiểm chứng:** Giải thích bằng một ví dụ lỗi hoặc sequence; chỉ ra code và chứng minh nhận định bằng nguồn.
- **Mức hiểu:** Chưa đánh giá (L0–L4).

### Q18 — Làm sao phát hiện dữ liệu stale khi kết nối WebSocket vẫn đang mở?

- **Cần nghiên cứu:** Khái niệm cốt lõi, vấn đề cần giải quyết, cơ chế hiện thực và trade-off cụ thể trong Crypto Force.
- **Evidence cần tìm:** Function/module thực tế, test hoặc benchmark phù hợp với phạm vi câu hỏi; không suy diễn từ số liệu ngoài workload.
- **Tự kiểm chứng:** Giải thích bằng một ví dụ lỗi hoặc sequence; chỉ ra code và chứng minh nhận định bằng nguồn.
- **Mức hiểu:** Chưa đánh giá (L0–L4).

### Q19 — Backpressure và Slow Consumer là gì? Tại sao một client chậm không được làm ảnh hưởng các client khác?

- **Cần nghiên cứu:** Khái niệm cốt lõi, vấn đề cần giải quyết, cơ chế hiện thực và trade-off cụ thể trong Crypto Force.
- **Evidence cần tìm:** Function/module thực tế, test hoặc benchmark phù hợp với phạm vi câu hỏi; không suy diễn từ số liệu ngoài workload.
- **Tự kiểm chứng:** Giải thích bằng một ví dụ lỗi hoặc sequence; chỉ ra code và chứng minh nhận định bằng nguồn.
- **Mức hiểu:** Chưa đánh giá (L0–L4).

### Q20 — Hệ thống bảo vệ WebSocket connection bằng authentication, session validation, Origin checking và resource limits như thế nào?

- **Cần nghiên cứu:** Khái niệm cốt lõi, vấn đề cần giải quyết, cơ chế hiện thực và trade-off cụ thể trong Crypto Force.
- **Evidence cần tìm:** Function/module thực tế, test hoặc benchmark phù hợp với phạm vi câu hỏi; không suy diễn từ số liệu ngoài workload.
- **Tự kiểm chứng:** Giải thích bằng một ví dụ lỗi hoặc sequence; chỉ ra code và chứng minh nhận định bằng nguồn.
- **Mức hiểu:** Chưa đánh giá (L0–L4).

## References

1. <a id="ref-1"></a>[Market Data & Realtime Updates](../../architecture/10-market-data.md)
2. <a id="ref-2"></a>[Kiểm chứng WebSocket cập nhật trực tiếp](../../testing/test-scopes/TS-002-market-data/websocket-verification.md)
