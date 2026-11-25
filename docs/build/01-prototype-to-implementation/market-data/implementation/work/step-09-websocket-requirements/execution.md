# Kết quả phân tích requirements WebSocket

Đọc file này để biết các đầu ra đã soạn trong Bước 09, các đầu vào chuyển sang thiết kế Bước 10 và kết quả review, kiểm chứng tài liệu.

## Đầu ra đã soạn (HEAD trước thay đổi: `0dd67c9`)

| Tài liệu | Nội dung đã cập nhật | Trạng thái |
| --- | --- | --- |
| [Market Data](../../../../../../UCs/market-data.md) | Mở rộng Tổng quan; thêm use case `Theo dõi cập nhật trực tiếp` với `sequenceDiagram`, `stateDiagram-v2`, bảng bước, rule `MK-93` đến `MK-123`, luồng thay thế và ngoại lệ `MK-124` đến `MK-132`, và gap `MK-133` đến `MK-141`. Giữ nguyên toàn bộ ID cũ `MK-01` đến `MK-92` | Confirmed (product owner, 2026-11-23) |
| [Quality Attributes](../../../../../../UCs/quality-attributes.md) | Bổ sung câu phân biệt mục tiêu cần kiểm chứng với kết quả đã đo; thêm độ mới dữ liệu trực tiếp (QA-14), tải đồng thời tối thiểu 50 client kèm ba điều kiện (QA-15), phục hồi đồng bộ sau khôi phục mạng (QA-16) và toàn vẹn OHLCV (QA-17). Giữ nguyên các kịch bản cũ (QA-01 đến QA-13) | Confirmed (product owner, 2026-11-23) |
| [WebSocket Requirement Gap Analysis](../../../../../../testing/test-scopes/TS-002-market-data/websocket-requirement-gap-analysis.md) | Trạng thái trước phân tích, nguồn kèm commit `0dd67c9`, phân tích tác động lên requirements cũ, mâu thuẫn và cách giải quyết, kết quả đối chiếu ba baseline độc lập (subagent độc lập, WCAG 2.2, OWASP ASVS 5.0 V4.4), bảng quyết định đã duyệt và kết luận | Hoàn thành |
| [Open Questions](../../../../../../open-questions.md) | Chuyển câu hỏi báo mất kết nối khi tạm dừng (OQ-035) sang Resolved; chốt phần Market Data của mục tiêu load test (OQ-067, giữ mở phần backtest job); giữ mở câu hỏi giới hạn số tab đồng thời mỗi tài khoản (OQ-087) cho Bước 10 | Đã cập nhật |
| [Use Cases](../../../../../../UCs/README.md) và [TS-002](../../../../../../testing/test-scopes/TS-002-market-data/README.md) | Cập nhật mô tả phạm vi Market Data và trạng thái increment WebSocket | Đã cập nhật |

## Duyệt quyết định của product owner

Product owner duyệt toàn bộ 15 mục đề xuất ngày 2026-11-23, không đổi giá trị nào: `MK-93` đến `MK-132` và `QA-14` đến `QA-17` chuyển sang `Confirmed`; `OQ-035` chuyển sang `Resolved` (gap `MK-135` chuyển sang `Closed`); `MK-140` và `MK-141` giữ `Accepted`; `OQ-087` (gap `MK-138`) giữ `Open` để chốt khi thiết kế bảo vệ tài nguyên WebSocket ở Bước 10.

## Đầu vào chuyển sang Bước 10 (Thiết kế WebSocket)

Các nội dung dưới đây thuộc cơ chế bên trong nên không đưa vào `docs/UCs/`, chuyển sang Bước 10 để thiết kế trong `10-market-data.md`, `20-state-machine.md`, `22-api-endpoints.md`, `23-security.md` và `30-decisions.md`:

- **Shared subscriptions và fan-out:** duy trì tối đa 1 kết nối trực tiếp tới nguồn cho mỗi tổ hợp `(pair, timeframe)` đang được xem theo kịch bản tải đồng thời (QA-15), quản lý vòng đời subscribe/unsubscribe khi client đổi pair, đổi timeframe, ẩn chart hoặc ngắt kết nối (MK-96, MK-97).
- **Chuyển giao lịch sử → trực tiếp và REST backfill:** thứ tự tải lịch sử ban đầu rồi gắn cập nhật trực tiếp không tạo khoảng trống và không tạo nến trùng (MK-104 đến MK-106, MK-110, MK-111, MK-127); giữ REST làm nguồn lịch sử và backfill.
- **Heartbeat, phát hiện dữ liệu cũ và backoff:** cơ chế kiểm tín hiệu sống phục vụ ngưỡng 15 giây dữ liệu cũ (MK-98), 30 giây đặt lại luồng (MK-99) và chính sách exponential backoff có jitter trong trần 120 giây (MK-122).
- **Cưỡng chế phiên và bảo mật WebSocket:** kiểm phiên và `Origin` lúc HTTP upgrade (MK-118, MK-119), dùng kết nối mã hóa trên production (MK-120), đóng kết nối hoặc dừng gửi dữ liệu trong 5 giây khi phiên hết hạn hoặc bị thu hồi (MK-121), xác định có dùng lại cookie session chuẩn hay token WebSocket riêng (điều kiện áp dụng OWASP ASVS 5.0 V4.4.3–4.4.4), và giới hạn subscription/kết nối mỗi tài khoản sau khi chốt câu hỏi giới hạn tab (OQ-087).
- **Kiểm soát lệch đồng hồ và khả năng quan sát:** không dựa vào hiệu giữa đồng hồ máy người dùng với mốc giờ của sàn cho trạng thái dữ liệu cũ (gap MK-140); bổ sung log/metric theo `pair`/`timeframe` để phân biệt lỗi upstream, backend và client chậm.
- **Tách môi trường đo 50 client và đọc nguyên văn ASVS V4.4:** kết quả `polling-v2` cho thấy 50 Chromium chạy cùng máy với API và PostgreSQL làm bão hòa host local trước warm-up [[1, Kết quả Task 10]](#ref-1), nên thiết kế kiểm chứng Bước 11 cần cấu hình phát tải phù hợp để đo kịch bản tải đồng thời (QA-15) và đọc nguyên văn file OWASP ASVS 5.0 V4.4 trước khi khóa test bảo mật.

## Xử lý review độc lập (`review-change`)

Subagent review độc lập báo 2 finding high, 8 finding medium và 6 finding low. Toàn bộ 16 finding đã được xử lý trước lượt kiểm chứng cuối:

- **High (2):** sửa commit HEAD từ `d31ba25` sang `0dd67c9` (tách rõ `d31ba25` là commit chốt Bước 08 và `2709f3b` là commit đóng băng code `polling-v2`); sửa trích dẫn OWASP ASVS 5.0 V4.4 ghi rõ mới tra qua chỉ mục kho `OWASP/ASVS` (chưa đọc file nguyên văn), gỡ gán nhầm V4.4.3–4.4.4 cho yêu cầu phiên chung và tách rõ phạm vi V4.4 khỏi `ADR-002`.
- **Medium (8):** tách các rule gộp (`MK-102`, `MK-113`, `MK-115`, `MK-118`) thành từng rule một ý kiểm chứng được (`MK-102`/`MK-103`, `MK-114` đến `MK-117`, `MK-119`/`MK-120`, `MK-123`); làm rõ điểm đo và ranh giới giữa từ chối kết nối mới (MK-118) và dừng kết nối đang mở (MK-121); sửa điều kiện/phản hồi của `MK-126` (tab ẩn) và `MK-128` (dữ liệu sai); sửa nguyên nhân `Inconclusive` của độ mới polling (QA-12) so với tải lên nguồn (QA-13); bỏ chi tiết `phím End` chưa có trong nguồn khỏi `MK-141`; cập nhật trạng thái thực tế trong `tracker.md` và `execution.md`; bổ sung lý do và nguồn cho khoảng ngắt `30 giây đến 5 phút`, `1,5 giây` (QA-14) và `10 giây` (QA-16) theo LL-004; thêm điều kiện hiệu lực sau khi product owner duyệt cho hai gap `Accepted` (`MK-140`, `MK-141`).
- **Low (6):** thay từ nội bộ `backend` bằng `hệ thống nhận event của Binance` trong kịch bản tải đồng thời (QA-15); thay `Bước 10–11` trong `MK-140` bằng mô tả độc lập với số bước build; rút gọn số liệu lặp trong `OQ-067` và trỏ về `QA-15`; sửa toàn bộ ID đứng một mình làm chủ ngữ/tân ngữ; đồng bộ kịch bản giữa `sequenceDiagram` và bảng bước luồng chính của `Theo dõi cập nhật trực tiếp`; sửa chính xác commit `2709f3b`/`d31ba25` trong `plan.md`.

## Kiểm chứng

Chạy sau khi xử lý toàn bộ findings review:

- `pnpm exec prettier --check` cho 9 file Markdown đã sửa hoặc tạo mới: đạt.
- `pnpm check:docs`: đạt (`check-docs: docs OK`).
- Không chạy `pnpm check`, typecheck hoặc test ứng dụng vì Bước 09 chỉ sửa tài liệu.

## References

1. <a id="ref-1"></a>[Kiểm chứng REST polling](../../../../../../testing/test-scopes/TS-002-market-data/rest-polling-verification.md)
