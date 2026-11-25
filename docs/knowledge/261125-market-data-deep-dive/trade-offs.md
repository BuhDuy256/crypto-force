# Market Data Trade-offs — Scaling và Engineering Decisions

Đọc file này để nghiên cứu các câu hỏi về trade-offs — scaling và engineering decisions và kiểm chứng mức độ hiểu bằng implementation thực tế.

## Tóm tắt

- **Agent đề xuất:** Trả lời từng câu bằng lời của mình, đối chiếu code, test và evidence trước khi tự đánh giá.
- **Agent đề xuất:** Các câu hỏi là nghiên cứu cá nhân, không phải kết luận đã kiểm chứng hay open decision của sản phẩm.
- Tài liệu nguồn ban đầu: [[1]](#ref-1) [[2]](#ref-2).

## Câu hỏi nghiên cứu

### Q31 — Tại sao chọn shared subscriptions trong một Backend process thay vì mỗi client một upstream connection?

- **Cần nghiên cứu:** Khái niệm cốt lõi, vấn đề cần giải quyết, cơ chế hiện thực và trade-off cụ thể trong Crypto Force.
- **Evidence cần tìm:** Function/module thực tế, test hoặc benchmark phù hợp với phạm vi câu hỏi; không suy diễn từ số liệu ngoài workload.
- **Tự kiểm chứng:** Giải thích bằng một ví dụ lỗi hoặc sequence; chỉ ra code và chứng minh nhận định bằng nguồn.
- **Mức hiểu:** Chưa đánh giá (L0–L4).

### Q32 — Shared subscriptions có những trade-off gì về memory, complexity, isolation và fault propagation?

- **Cần nghiên cứu:** Khái niệm cốt lõi, vấn đề cần giải quyết, cơ chế hiện thực và trade-off cụ thể trong Crypto Force.
- **Evidence cần tìm:** Function/module thực tế, test hoặc benchmark phù hợp với phạm vi câu hỏi; không suy diễn từ số liệu ngoài workload.
- **Tự kiểm chứng:** Giải thích bằng một ví dụ lỗi hoặc sequence; chỉ ra code và chứng minh nhận định bằng nguồn.
- **Mức hiểu:** Chưa đánh giá (L0–L4).

### Q33 — Nếu triển khai nhiều Backend instances, thiết kế shared subscriptions hiện tại còn hoạt động hiệu quả không? Cần thay đổi gì?

- **Cần nghiên cứu:** Khái niệm cốt lõi, vấn đề cần giải quyết, cơ chế hiện thực và trade-off cụ thể trong Crypto Force.
- **Evidence cần tìm:** Function/module thực tế, test hoặc benchmark phù hợp với phạm vi câu hỏi; không suy diễn từ số liệu ngoài workload.
- **Tự kiểm chứng:** Giải thích bằng một ví dụ lỗi hoặc sequence; chỉ ra code và chứng minh nhận định bằng nguồn.
- **Mức hiểu:** Chưa đánh giá (L0–L4).

### Q34 — Nếu số lượng client tăng lên 10.000, bạn sẽ xác định bottleneck và thiết kế hướng mở rộng như thế nào?

- **Cần nghiên cứu:** Khái niệm cốt lõi, vấn đề cần giải quyết, cơ chế hiện thực và trade-off cụ thể trong Crypto Force.
- **Evidence cần tìm:** Function/module thực tế, test hoặc benchmark phù hợp với phạm vi câu hỏi; không suy diễn từ số liệu ngoài workload.
- **Tự kiểm chứng:** Giải thích bằng một ví dụ lỗi hoặc sequence; chỉ ra code và chứng minh nhận định bằng nguồn.
- **Mức hiểu:** Chưa đánh giá (L0–L4).

### Q35 — Nếu phải xây lại Market Data mà không có AI Agent, bạn sẽ chia implementation thành những bước nào và kiểm chứng từng bước ra sao?

- **Cần nghiên cứu:** Khái niệm cốt lõi, vấn đề cần giải quyết, cơ chế hiện thực và trade-off cụ thể trong Crypto Force.
- **Evidence cần tìm:** Function/module thực tế, test hoặc benchmark phù hợp với phạm vi câu hỏi; không suy diễn từ số liệu ngoài workload.
- **Tự kiểm chứng:** Giải thích bằng một ví dụ lỗi hoặc sequence; chỉ ra code và chứng minh nhận định bằng nguồn.
- **Mức hiểu:** Chưa đánh giá (L0–L4).

## References

1. <a id="ref-1"></a>[Architectural Decisions](../../architecture/30-decisions.md)
2. <a id="ref-2"></a>[Market Data & Realtime Updates](../../architecture/10-market-data.md)
