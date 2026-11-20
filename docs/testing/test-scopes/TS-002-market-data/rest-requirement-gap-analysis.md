# REST Requirement Gap Analysis

Đọc file này để biết trạng thái requirements Market Data trước vòng REST tải lịch sử, các gap đã tìm thấy và kết quả giải quyết trước khi thiết kế test.

## Trạng thái requirements trước phân tích

Trước phân tích này, requirements của Market Data là bản nháp suy ra từ code frontend. Code đó được dựng khi chuyển màn hình Realtime từ prototype sang `apps/web` bằng HTTP mock [[1]](#ref-1). Bản nháp ghi lại hành vi UI mock đã chạy, không xuất phát từ phân tích nhu cầu người dùng:

- Rule MK-01 đến MK-19. MK-09 đến MK-19 có trạng thái Proposed, do agent đề xuất khi dựng UI.
- Bốn gap Open trỏ tới câu hỏi mở: tải thêm lịch sử, MA khi thiếu nến, MA và volume trong sidebar, nến đang mở.
- Chưa đối chiếu baseline độc lập. Prototype, code UI mock và bản nháp có cùng nguồn gốc, nên chỉ thấy chỗ chúng lệch nhau, không thấy điều cả ba cùng bỏ sót.
- Chưa có quality attribute scenario cho vòng REST.

## Phạm vi phân tích

Phân tích áp dụng cho use case xem lịch sử thị trường trên Realtime và các quality attribute scenario của vòng tải lịch sử [[2]](#ref-2) [[3]](#ref-3). Cập nhật trực tiếp, polling và phục hồi kết nối nằm ngoài phạm vi. Kịch bản kiểm thử nằm trong file riêng của test scope này.

## Nguồn đối chiếu

Brief, prototype và Open Questions được đọc tại commit `b836aa4`. Use case được đọc từ bản chưa commit ngày 2026-11-20, trước khi ghi các quyết định của phân tích này.

| Nguồn | Phần đã đọc |
| --- | --- |
| Project Brief [[4]](#ref-4) | §4 Realtime Market Data, §5 Multi-Timeframe Chart, §29 Demo scenario |
| Prototype Realtime [[5]](#ref-5) | Chọn số chart và timeframe, Cập nhật live và dữ liệu lịch sử, Mất kết nối |
| Open Questions [[6]](#ref-6) | Câu hỏi của Market Data |
| Use case Market Data trước phân tích | Rule và gap của UI mock, cùng nội dung với tài liệu use case [[2]](#ref-2) |

## Điểm thiếu, mâu thuẫn và cách giải quyết

| Điểm | Nguồn mâu thuẫn hoặc thiếu | Kết quả |
| --- | --- | --- |
| Tập timeframe | Brief có 1d, prototype không có | Theo brief (MK-30) |
| Lựa chọn mặc định | Brief demo 5m, 15m, 1h, 4h; UI mock 1m, 5m, 15m, 1h | Theo brief (MK-31) |
| Tải thêm lịch sử | Prototype có nút nhưng không tải dữ liệu; không nguồn yêu cầu nào cần | Bỏ thao tác (MK-61), số nến cố định (MK-33) |
| Nến đang mở | Không nguồn nào quy định | Có nến đang mở, nhãn chữ, thời điểm dữ liệu (MK-25, MK-26, MK-27) |
| MA thiếu mẫu và nến đang mở | Không nguồn nào quy định | MK-15, MK-24, MK-28, MK-36 |
| MA và volume trong sidebar | Một sidebar cho nhiều timeframe | Chuyển sang từng chart (MK-60, MK-29), volume theo base asset (MK-23) |
| Exception flow | UI mock có trạng thái tải và lỗi, chưa có thời hạn chờ | Thời hạn chờ 10 giây (MK-34), rule MK-35 đến MK-39 và luồng phiên hết hạn (MK-40) |

## Kết quả baseline độc lập

| Baseline | Mức áp dụng | Kết quả |
| --- | --- | --- |
| Bộ use case do subagent viết, chỉ nhận mục tiêu và actor | Các mục trong phạm vi vòng tải lịch sử | 4 nhóm gap: cập nhật cần reload (Accepted), đọc giá trị và zoom, múi giờ và độ chính xác, dữ liệu sai và khớp nguồn |
| WCAG 2.2 mức AA [[7]](#ref-7) | SC 1.1.1, 1.4.1, 1.4.10, 2.1.1, 2.4.7, 4.1.3 cho chart và trạng thái | 1 nhóm gap về accessibility và reflow |

Các mục baseline khác được xử lý như sau: pair riêng cho từng chart và nhớ layout khác quyết định đã chốt (MK-07, MK-37). Availability theo tháng không áp dụng khi chưa vận hành production. Thời gian chờ khi bị giới hạn request, offline và báo thiếu nến thuộc lỗi chung hoặc quyết định MK-35. Danh sách gap và quyết định nằm trong Gap analysis của use case [[2, Gap analysis]](#ref-2).

Sáu SC của WCAG đã được đọc nguyên văn từ bản Recommendation ngày 12/12/2024 vào ngày 2026-11-20. Mức A/AA và phạm vi đối chiếu nằm trong tài liệu kiểm chứng REST [[8, Đối chiếu WCAG 2.2]](#ref-8). Đây là đối chiếu test basis, chưa phải bằng chứng sản phẩm đạt WCAG AA.

## Kết luận

Requirements của vòng tải lịch sử đủ để thiết kế test chức năng: mọi gap có quyết định Closed hoặc Accepted và không còn câu hỏi mở chặn vòng này. Test accessibility dùng đối chiếu nguyên văn đã ghi, nhưng mô tả nến cuối chưa chứng minh tương đương toàn bộ thông tin chart; cần giữ giới hạn này khi thiết kế và báo kết quả [[8]](#ref-8). Làm mới lỗi giữ dữ liệu cũ (MK-13) áp dụng từ vòng cập nhật định kỳ, không có test trong vòng này. Ngưỡng hiệu năng của mở Realtime (QA-10) và đổi timeframe (QA-11) còn Proposed. Test hiệu năng chỉ được thiết kế sau khi chốt workload và môi trường đo.

## References

1. <a id="ref-1"></a>[Bằng chứng triển khai frontend mock](../../../build/01-prototype-to-implementation/market-data/work/step-02-mock-frontend/execution.md)
2. <a id="ref-2"></a>[Market Data](../../../UCs/market-data.md)
3. <a id="ref-3"></a>[Quality Attributes](../../../UCs/quality-attributes.md)
4. <a id="ref-4"></a>[Project Brief](../../../UCs/sources/project-brief.md)
5. <a id="ref-5"></a>[Realtime](../../../design/prototype/docs/requirements/realtime.md)
6. <a id="ref-6"></a>[Open Questions](../../../open-questions.md)
7. <a id="ref-7"></a>W3C, _Web Content Accessibility Guidelines (WCAG) 2.2_, W3C Recommendation, 12/12/2024. <https://www.w3.org/TR/WCAG22/>
8. <a id="ref-8"></a>[Kiểm chứng REST tải lịch sử](rest-verification.md)
