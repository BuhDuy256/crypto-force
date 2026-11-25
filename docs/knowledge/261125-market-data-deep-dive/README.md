# Market Data Deep Dive — Research Roadmap

Đọc file này để tìm toàn bộ 35 câu hỏi nghiên cứu Market Data, các nguồn tương ứng và lộ trình tự đánh giá kỹ năng.

## Phạm vi

**Agent đề xuất:** Bộ câu hỏi phục vụ học lại implementation do AI Agent hỗ trợ; không thay thế documentation, requirement hay evidence. Ban đầu tất cả câu hỏi đều chưa được đánh giá.

| Knowledge domain | Questions | File |
| --- | --- | --- |
| Fundamentals | Q01–Q05 | [fundamentals.md](fundamentals.md) |
| Architecture | Q06–Q14 | [architecture.md](architecture.md) |
| Reliability | Q15–Q20 | [reliability.md](reliability.md) |
| Performance | Q21–Q30 | [performance.md](performance.md) |
| Trade-offs | Q31–Q35 | [trade-offs.md](trade-offs.md) |

## Core ideas và research overlap

**Agent đề xuất:** Nhóm theo tri thức cần học, không theo các từ trùng nhau trong câu hỏi.

| Shared research | Questions | Phân biệt mục tiêu |
| --- | --- | --- |
| Transport/freshness | Q01, Q02, Q12, Q22 | Protocol, lý do chọn, vai trò REST và latency evidence |
| Subscription topology | Q09, Q10, Q11, Q14, Q31 | Fan-out, refCount lifecycle, multiplex, deduplication và trade-off |
| Correctness/recovery | Q15, Q16, Q17, Q18 | Merge, reconnect, UI sync completion và stale |
| Scalability | Q24, Q25, Q26, Q27, Q30 | CPU, quota failure, unknown ceiling, benchmark fairness và reporting |
| Observability | Q19, Q28, Q29 | Slow consumer, layer diagnosis và đo paint time |
| Future system design | Q32, Q33, Q34, Q35 | Trade-off hiện tại, multi-instance, giả định 10k và tự triển khai lại |

Q09 khác Q10 ở **fan-out runtime** so với **vòng đời refCount**. Q25 khác Q26 ở **bottleneck đã quan sát** so với **capacity chưa đo**. Q16 khác Q17 ở **reconnect** so với **hoàn tất đồng bộ UI**. Các câu này dùng chung nguồn nhưng không phải câu hỏi trùng hoàn toàn.

## Lộ trình ưu tiên

**Agent đề xuất:** Q09 → Q06 → Q12 → Q16 → Q15 → Q22 → Q25 → Q24 → Q26 → Q30.

## Thang tự đánh giá

| Level | Chứng minh được gì? |
| --- | --- |
| L0 | Chưa thể tự giải thích |
| L1 | Hiểu và giải thích khái niệm |
| L2 | Chỉ ra code, function, test và evidence trong repo |
| L3 | Lý giải quyết định, trade-off và failure mode |
| L4 | Tự debug, thay đổi hoặc implement lại và xác nhận bằng test |

**Agent đề xuất:** Không coi một câu đã hoàn thành chỉ vì AI đưa ra lời giải. Chỉ cập nhật level dựa trên buổi tự kiểm tra và bằng chứng cụ thể.

## Giới hạn

Benchmark đang có là các bài chạy rút gọn và kết quả kiểm chứng baseline 180s × 3 đa máy vẫn `Inconclusive` [[1]](#ref-1). 400 concurrent clients là mức tải đã thử, không phải capacity tối đa. Q33 và Q34 là bài tập giả định về tương lai, không phải feature đã triển khai. Luồng hiện tại cần tra cứu tại tài liệu kiến trúc [[2]](#ref-2) và baseline REST Polling [[3]](#ref-3).

## References

1. <a id="ref-1"></a>[Kiểm chứng WebSocket cập nhật trực tiếp](../../testing/test-scopes/TS-002-market-data/websocket-verification.md)
2. <a id="ref-2"></a>[Market Data & Realtime Updates](../../architecture/10-market-data.md)
3. <a id="ref-3"></a>[Kiểm chứng REST polling](../../testing/test-scopes/TS-002-market-data/rest-polling-verification.md)
