# Market Data Performance — Benchmark và Bottleneck

Đọc file này để nghiên cứu các câu hỏi về performance — benchmark và bottleneck và kiểm chứng mức độ hiểu bằng implementation thực tế.

## Tóm tắt

- **Agent đề xuất:** Trả lời từng câu bằng lời của mình, đối chiếu code, test và evidence trước khi tự đánh giá.
- **Agent đề xuất:** Các câu hỏi là nghiên cứu cá nhân, không phải kết luận đã kiểm chứng hay open decision của sản phẩm.
- Tài liệu nguồn ban đầu: [[1]](#ref-1) [[2]](#ref-2) [[3]](#ref-3).

## Câu hỏi nghiên cứu

### Q21 — sourceToChartDelayMs, backendToChartMs và backendToClientMs khác nhau như thế nào?

- **Cần nghiên cứu:** Khái niệm cốt lõi, vấn đề cần giải quyết, cơ chế hiện thực và trade-off cụ thể trong Crypto Force.
- **Evidence cần tìm:** Function/module thực tế, test hoặc benchmark phù hợp với phạm vi câu hỏi; không suy diễn từ số liệu ngoài workload.
- **Tự kiểm chứng:** Giải thích bằng một ví dụ lỗi hoặc sequence; chỉ ra code và chứng minh nhận định bằng nguồn.
- **Mức hiểu:** Chưa đánh giá (L0–L4).

### Q22 — Tại sao chuyển từ REST Polling sang WebSocket làm p95 source-to-chart latency giảm từ khoảng 4.642 ms xuống 40 ms?

- **Cần nghiên cứu:** Khái niệm cốt lõi, vấn đề cần giải quyết, cơ chế hiện thực và trade-off cụ thể trong Crypto Force.
- **Evidence cần tìm:** Function/module thực tế, test hoặc benchmark phù hợp với phạm vi câu hỏi; không suy diễn từ số liệu ngoài workload.
- **Tự kiểm chứng:** Giải thích bằng một ví dụ lỗi hoặc sequence; chỉ ra code và chứng minh nhận định bằng nguồn.
- **Mức hiểu:** Chưa đánh giá (L0–L4).

### Q23 — Tại sao bandwidth giảm khoảng 99,5%? WebSocket thực sự giảm những loại dữ liệu và request nào?

- **Cần nghiên cứu:** Khái niệm cốt lõi, vấn đề cần giải quyết, cơ chế hiện thực và trade-off cụ thể trong Crypto Force.
- **Evidence cần tìm:** Function/module thực tế, test hoặc benchmark phù hợp với phạm vi câu hỏi; không suy diễn từ số liệu ngoài workload.
- **Tự kiểm chứng:** Giải thích bằng một ví dụ lỗi hoặc sequence; chỉ ra code và chứng minh nhận định bằng nguồn.
- **Mức hiểu:** Chưa đánh giá (L0–L4).

### Q24 — Tại sao shared subscriptions giúp giảm CPU API từ 77,09% xuống 33,01% ở mức tải 400 clients?

- **Cần nghiên cứu:** Khái niệm cốt lõi, vấn đề cần giải quyết, cơ chế hiện thực và trade-off cụ thể trong Crypto Force.
- **Evidence cần tìm:** Function/module thực tế, test hoặc benchmark phù hợp với phạm vi câu hỏi; không suy diễn từ số liệu ngoài workload.
- **Tự kiểm chứng:** Giải thích bằng một ví dụ lỗi hoặc sequence; chỉ ra code và chứng minh nhận định bằng nguồn.
- **Mức hiểu:** Chưa đánh giá (L0–L4).

### Q25 — Tại sao B1 thất bại ở 400 clients nhưng B2 thành công? Bottleneck thực sự nằm ở đâu?

- **Cần nghiên cứu:** Khái niệm cốt lõi, vấn đề cần giải quyết, cơ chế hiện thực và trade-off cụ thể trong Crypto Force.
- **Evidence cần tìm:** Function/module thực tế, test hoặc benchmark phù hợp với phạm vi câu hỏi; không suy diễn từ số liệu ngoài workload.
- **Tự kiểm chứng:** Giải thích bằng một ví dụ lỗi hoặc sequence; chỉ ra code và chứng minh nhận định bằng nguồn.
- **Mức hiểu:** Chưa đánh giá (L0–L4).

### Q26 — 400 concurrent clients có phải capacity tối đa của hệ thống không? Làm sao xác định giới hạn thật?

- **Cần nghiên cứu:** Khái niệm cốt lõi, vấn đề cần giải quyết, cơ chế hiện thực và trade-off cụ thể trong Crypto Force.
- **Evidence cần tìm:** Function/module thực tế, test hoặc benchmark phù hợp với phạm vi câu hỏi; không suy diễn từ số liệu ngoài workload.
- **Tự kiểm chứng:** Giải thích bằng một ví dụ lỗi hoặc sequence; chỉ ra code và chứng minh nhận định bằng nguồn.
- **Mức hiểu:** Chưa đánh giá (L0–L4).

### Q27 — Benchmark cần kiểm soát những biến nào để so sánh REST Polling và WebSocket một cách công bằng?

- **Cần nghiên cứu:** Khái niệm cốt lõi, vấn đề cần giải quyết, cơ chế hiện thực và trade-off cụ thể trong Crypto Force.
- **Evidence cần tìm:** Function/module thực tế, test hoặc benchmark phù hợp với phạm vi câu hỏi; không suy diễn từ số liệu ngoài workload.
- **Tự kiểm chứng:** Giải thích bằng một ví dụ lỗi hoặc sequence; chỉ ra code và chứng minh nhận định bằng nguồn.
- **Mức hiểu:** Chưa đánh giá (L0–L4).

### Q28 — Làm sao phân biệt bottleneck do Binance, Backend, PostgreSQL, Network, Browser hoặc Load Generator?

- **Cần nghiên cứu:** Khái niệm cốt lõi, vấn đề cần giải quyết, cơ chế hiện thực và trade-off cụ thể trong Crypto Force.
- **Evidence cần tìm:** Function/module thực tế, test hoặc benchmark phù hợp với phạm vi câu hỏi; không suy diễn từ số liệu ngoài workload.
- **Tự kiểm chứng:** Giải thích bằng một ví dụ lỗi hoặc sequence; chỉ ra code và chứng minh nhận định bằng nguồn.
- **Mức hiểu:** Chưa đánh giá (L0–L4).

### Q29 — Làm sao đo chính xác thời điểm dữ liệu thực sự được vẽ lên chart, thay vì chỉ đo lúc nhận WebSocket message?

- **Cần nghiên cứu:** Khái niệm cốt lõi, vấn đề cần giải quyết, cơ chế hiện thực và trade-off cụ thể trong Crypto Force.
- **Evidence cần tìm:** Function/module thực tế, test hoặc benchmark phù hợp với phạm vi câu hỏi; không suy diễn từ số liệu ngoài workload.
- **Tự kiểm chứng:** Giải thích bằng một ví dụ lỗi hoặc sequence; chỉ ra code và chứng minh nhận định bằng nguồn.
- **Mức hiểu:** Chưa đánh giá (L0–L4).

### Q30 — Kết quả benchmark nào đã được chứng minh và kết quả nào vẫn Inconclusive? Tại sao?

- **Cần nghiên cứu:** Khái niệm cốt lõi, vấn đề cần giải quyết, cơ chế hiện thực và trade-off cụ thể trong Crypto Force.
- **Evidence cần tìm:** Function/module thực tế, test hoặc benchmark phù hợp với phạm vi câu hỏi; không suy diễn từ số liệu ngoài workload.
- **Tự kiểm chứng:** Giải thích bằng một ví dụ lỗi hoặc sequence; chỉ ra code và chứng minh nhận định bằng nguồn.
- **Mức hiểu:** Chưa đánh giá (L0–L4).

## References

1. <a id="ref-1"></a>[Kiểm chứng WebSocket cập nhật trực tiếp](../../testing/test-scopes/TS-002-market-data/websocket-verification.md)
2. <a id="ref-2"></a>[WebSocket benchmark summary](../../testing/evidence/market-data/ws-v1-benchmarks/summary.json)
3. <a id="ref-3"></a>[Kiểm chứng REST polling](../../testing/test-scopes/TS-002-market-data/rest-polling-verification.md)
