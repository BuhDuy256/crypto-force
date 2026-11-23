# WebSocket Requirement Gap Analysis

Đọc file này để biết trạng thái requirements Market Data trước vòng cập nhật trực tiếp, tác động lên requirements cũ, các gap từ baseline độc lập và quyết định cần product owner duyệt trước khi thiết kế WebSocket.

## Trạng thái requirements trước phân tích

Trước phân tích này, Market Data đã build và kiểm chứng hai vòng đầu (chốt tài liệu Bước 08 tại commit `d31ba25`, HEAD hiện tại trước Bước 09 là `0dd67c9`) [[1]](#ref-1) [[2]](#ref-2):

- Vòng tải lịch sử có use case `Xem lịch sử thị trường` (MK-01 đến MK-62) và ba quality attribute scenario (QA-09 đến QA-11).
- Vòng cập nhật định kỳ có use case `Theo dõi cập nhật định kỳ` (MK-63 đến MK-92) và hai quality attribute scenario (QA-12, QA-13). Kết quả baseline `polling-v2` (đo trên code đóng băng tại commit `2709f3b`) ghi nhận 12 lượt đạt ở mức 1 và 10 client (120 weight mỗi 60 giây). Độ mới dữ liệu (QA-12) và tỷ lệ thời gian dữ liệu cũ giữ trạng thái `Inconclusive` vì runner mới đo tới `market-data:apply`, chưa có bằng chứng canvas paint và còn sai số đồng bộ clock round-trip; tổng thể giới hạn tải lên nguồn (QA-13) giữ trạng thái `Inconclusive` vì mức 50 client quá tải host local trước warm-up nên chưa có cửa sổ steady đủ 180 giây [[2, Kết quả Task 10]](#ref-2).
- Cho vòng cập nhật trực tiếp, repo mới có hai scenario tổng quát ở mức hệ thống là độ trễ cập nhật dưới 1 giây ở p95 (QA-05, `Confirmed`) và kết nối lại trong 30 giây kèm 0 nến bị thiếu khi kết nối Binance bị đóng (QA-06, `Confirmed`) [[3]](#ref-3).
- Mục Tổng quan của use case ghi cập nhật trực tiếp và phục hồi kết nối còn ngoài phạm vi [[4]](#ref-4). Hai câu hỏi liên quan còn mở: báo mất kết nối khi đang tạm dừng Live ([OQ-035](../../../open-questions.md#oq-035)) và mục tiêu số client WebSocket của load test ([OQ-067](../../../open-questions.md#oq-067)) [[5]](#ref-5).

## Phạm vi phân tích

Phân tích áp dụng cho use case `Theo dõi cập nhật trực tiếp` trên Realtime và các quality attribute scenario về độ mới dữ liệu, tải đồng thời, latency, phục hồi và tính toàn vẹn dữ liệu của vòng WebSocket [[4, Theo dõi cập nhật trực tiếp]](#ref-4) [[3]](#ref-3). Tín hiệu BUY/SELL ([OQ-031](../../../open-questions.md#oq-031)), chọn strategy làm nguồn tín hiệu và mở Realtime theo pair từ Search ([OQ-030](../../../open-questions.md#oq-030)) nằm ngoài phạm vi. Thiết kế giao thức WebSocket, shared subscriptions, cơ chế reconnect và REST backfill thuộc Bước 10; kịch bản kiểm chứng thuộc Bước 11 [[6]](#ref-6).

## Nguồn đối chiếu

Mọi nguồn trong repo được đọc tại commit `0dd67c9` ngày 2026-11-23.

| Nguồn | Phần đã đọc |
| --- | --- |
| Project Brief [[7]](#ref-7) | §4 Realtime Market Data, §5 Multi-Timeframe Chart, §17 Realtime và Reliability, §25 Câu hỏi kiến trúc, §28 Deliverables, §29 Demo scenario |
| Prototype Realtime [[8]](#ref-8) | Cập nhật live và dữ liệu lịch sử, Mất kết nối |
| Mục tiêu Market Data [[9]](#ref-9) | Mục 1 đến mục 9 về capacity, ranh giới provider, phát triển từng bước, luồng realtime, phục hồi và observability |
| Định hướng CV của Market Data [[10]](#ref-10) | Ba flow REST, polling, WebSocket; chỉ số capacity, latency, recovery, độ đúng nến, upstream, fan-out, lưu lượng, tỷ lệ dữ liệu cũ; phân biệt backend-to-chart latency và source-to-chart delay |
| Open Questions [[5]](#ref-5) | Câu hỏi của Realtime & Market data và Testing (`OQ-030`, `OQ-031`, `OQ-035`, `OQ-067`, `OQ-086`) |
| Architectural Decisions [[11]](#ref-11) | ADR-002 (mức bảo mật ASVS 5.0 cho Auth/Session), ADR-003 đến ADR-008 (provider, MA, số thập phân, cache và polling) |
| Use case, quality attributes và kết quả polling trước phân tích | Rule MK-01 đến MK-92, scenario QA-05, QA-06, QA-09 đến QA-13 và kết quả `polling-v2` [[4]](#ref-4) [[3]](#ref-3) [[2]](#ref-2) |

## Phân tích tác động lên requirements hiện có

| Nhóm requirement hiện có | Tác động từ vòng cập nhật trực tiếp |
| --- | --- |
| Tải lịch sử, hiển thị, MA, giá, accessibility (`MK-01` đến `MK-62`) | Giữ nguyên ID và nghĩa. Vẫn áp dụng cho lần tải dữ liệu ban đầu, đổi pair/timeframe, tính MA, định dạng giá, kiểm dữ liệu sai và accessibility |
| Chu kỳ cập nhật định kỳ (`MK-63`, `MK-64`, `MK-65`, `MK-80`, `MK-81`) | Giữ nguyên ID để bảo toàn truy vết của vòng baseline REST polling. Trong vòng cập nhật trực tiếp, cập nhật không còn theo chu kỳ 5 giây mà cập nhật theo dữ liệu mới từ nguồn (MK-93, MK-94); lỗi làm mới định kỳ được thay bằng trạng thái dữ liệu cũ, mất kết nối và phục hồi đồng bộ (MK-98 đến MK-106) |
| Giữ ngữ cảnh xem, giới hạn nến, tạm dừng, tab ẩn và lỗi ban đầu (`MK-66` đến `MK-79`, `MK-82` đến `MK-85`) | Kế thừa hành vi cho luồng trực tiếp: giữ giới hạn 500 nến (MK-67, MK-95), giữ vùng xem, nến cuối, focus, tooltip và không thông báo thành công (MK-68 đến MK-72, MK-113 đến MK-117), một nút tạm dừng và tiếp tục mặc định bật (MK-73, MK-74, MK-78, MK-107), không quay về dữ liệu cũ hơn mở rộng thêm cho sidebar (MK-79, MK-111), chart lỗi tải đầu không tự vẽ nến lẻ (MK-82, MK-131) |
| Gap chu kỳ theo timeframe (`MK-92`, [OQ-086](../../../open-questions.md#oq-086)) | Không chặn vòng cập nhật trực tiếp vì dữ liệu đẩy theo sự kiện thay vì chu kỳ cố định |
| Độ trễ và phục hồi đã chốt (`QA-05`, `QA-06`) | Giữ nguyên ID và nghĩa. Tách rõ độ trễ từ lúc hệ thống nhận event của kịch bản độ trễ cập nhật (QA-05) với source-to-chart delay của kịch bản độ mới trực tiếp (QA-14); bổ sung thời gian phục hồi đồng bộ sau khôi phục mạng (QA-16) và toàn vẹn OHLCV (QA-17) |
| Modifiability và baseline REST/polling (`QA-09` đến `QA-13`) | Yêu cầu thêm provider không đổi frontend (QA-09) tiếp tục áp dụng cho việc thêm provider trực tiếp thứ hai. Kịch bản độ mới và tải của vòng polling (QA-12, QA-13) giữ vai trò baseline để so sánh với kịch bản độ mới và tải đồng thời của vòng trực tiếp (QA-14, QA-15) |

## Điểm thiếu, mâu thuẫn và cách giải quyết

| Điểm | Nguồn mâu thuẫn hoặc thiếu | Kết quả |
| --- | --- | --- |
| Độ trễ ms trên thanh trạng thái | Prototype ghi dòng Data hiện `"Live · Binance"` kèm độ trễ [[8, Cập nhật live và dữ liệu lịch sử]](#ref-8); baseline độc lập lưu ý lệch đồng hồ thiết bị có thể làm sai lệch tuổi dữ liệu | Không bắt buộc hiển thị số ms độ trễ trên UI; giữ nhãn trạng thái kết nối (MK-112) và thời điểm dữ liệu của từng chart (MK-27). Độ trễ thật đo qua observability và benchmark (gap MK-141) |
| Trạng thái giữa mất kết nối và trực tiếp | Prototype chỉ nêu Live, Paused, Disconnected/Reconnecting; mục tiêu dự án yêu cầu phân biệt kết nối đã mở lại với dữ liệu đã đồng bộ xong [[9, mục 5]](#ref-9) | Bổ sung trạng thái dữ liệu cũ (MK-98), đang đồng bộ (MK-104) và đồng bộ chưa xong (MK-127) vào vòng đời trạng thái |
| Hai định nghĩa độ trễ realtime | Kịch bản độ trễ cập nhật (QA-05) đo từ lúc hệ thống nhận event của Binance tới màn hình; kịch bản độ mới polling (QA-12) đo từ lúc nguồn tham chiếu có dữ liệu mới tới lúc chart vẽ | Giữ kịch bản nhận event tới màn hình (QA-05) cho backend-to-chart latency và thêm kịch bản độ mới trực tiếp (QA-14) cho source-to-chart delay để so sánh ngang hàng với vòng polling (QA-12) [[10]](#ref-10) |
| Phạm vi phục hồi và toàn vẹn dữ liệu | Kịch bản kết nối Binance bị đóng (QA-06) chỉ nêu mốc 30 giây kết nối lại; định hướng CV đo thời gian từ lúc mạng khôi phục tới lúc chart nhận cập nhật mới và bù đủ nến đóng, kèm đối chiếu 0 nến thiếu, trùng, lệch OHLCV [[10]](#ref-10) | Giữ kịch bản ngắt kết nối nguồn (QA-06), bổ sung kịch bản phục hồi đồng bộ sau khôi phục mạng (QA-16) và kịch bản toàn vẹn OHLCV (QA-17) |
| Báo mất kết nối khi đang tạm dừng | Câu hỏi báo mất kết nối khi tạm dừng ([OQ-035](../../../open-questions.md#oq-035)) chưa chốt; prototype không thể hiện tổ hợp này | Giữ trạng thái tạm dừng và không hiện cảnh báo mất kết nối (MK-108), đồng bộ lại khi người dùng tiếp tục (MK-107). `OQ-035` chuyển sang Resolved sau khi product owner duyệt ngày 2026-11-23 |
| Chuyển ngầm về polling khi mất kết nối | Không nguồn nào yêu cầu tự hạ về polling 5 giây khi mất kết nối trực tiếp; chuyển ngầm sẽ che giấu sự cố kết nối | Không chuyển ngầm về polling; giữ dữ liệu cũ và hiển thị rõ trạng thái mất kết nối kèm kết nối lại tự động và thủ công (MK-100 đến MK-106, MK-122). REST phục vụ tải lịch sử và bù nến ở Bước 10 |
| Cửa sổ nến sau gián đoạn dài | Baseline độc lập đề xuất giới hạn 200–1.000 nến và ngưỡng backfill 500 nến (BR-03, BR-11) | Giữ giới hạn 500 nến đã chốt (MK-33, MK-67); khi gián đoạn vượt quá 500 nến của một timeframe, tải lại tối đa 500 nến gần nhất đã phủ đủ toàn bộ cửa sổ hiển thị |

## Kết quả baseline độc lập

| Baseline | Mức áp dụng | Kết quả |
| --- | --- | --- |
| Bộ use case do subagent viết ngày 2026-11-23, chỉ nhận mục tiêu cập nhật trực tiếp và actor, không đọc file nào trong repo | Luồng chính (MF-1 đến MF-5), luồng thay thế và ngoại lệ (AF-1 đến AF-6, EF-1 đến EF-9), rule (BR-01 đến BR-16), quality scenario và usability/accessibility | 8 nhóm gap: dữ liệu cũ và đặt lại luồng; đồng bộ và lỗi đồng bộ; báo lỗi khi đang tạm dừng; nến trùng, lệch thứ tự, dữ liệu sai và đổi lựa chọn khi tạm dừng; cưỡng chế phiên hết hạn; giới hạn số tab mỗi tài khoản; lệch đồng hồ thiết bị; các tiện ích UI chưa cần thiết |
| WCAG 2.2 [[12]](#ref-12) và Understanding SC 2.2.2 [[13]](#ref-13) | SC 1.4.1 (A), SC 2.1.1 (A), SC 2.2.2 (A), SC 2.4.7 (AA), SC 4.1.3 (AA) cho trạng thái kết nối và nội dung tự cập nhật | 1 nhóm gap (MK-139): mọi trạng thái kết nối phải có nhãn chữ ngoài màu (MK-112) và chỉ thông báo screen reader khi chuyển trạng thái, không lặp theo từng lần tự thử lại (MK-113). SC 1.4.1, 2.1.1, 2.4.7 đã đọc nguyên văn ngày 2026-11-20; SC 2.2.2 đọc nguyên văn ngày 2026-11-22; định nghĩa SC 4.1.3 đối chiếu nguyên văn ngày 2026-11-23 |
| OWASP ASVS 5.0 V4.4 WebSocket [[14]](#ref-14) | V4.4.1 (L1) và V4.4.2 đến V4.4.4 (L2). Quyết định bảo mật Auth/Session (ADR-002) chỉ áp dụng cho V6, V7 và V3.3–3.5, 3.7 [[11, ADR-002]](#ref-11); product owner đã duyệt mở rộng sang V4.4.1 và V4.4.2 cho vòng WebSocket ngày 2026-11-23 | 1 nhóm gap (MK-137): bổ sung yêu cầu kiểm `Origin` lúc bắt tay (MK-119) và mã hóa kết nối trên production (MK-120). Đã đọc nguyên văn file `0x13-V4-API-and-Web-Service.md` ngày 2026-11-23 ở Bước 11: xác nhận chính xác ID và mức V4.4.1 (L1), V4.4.2 (L2), và xác nhận V4.4.3–4.4.4 (L2) không áp dụng vì thiết kế xác thực WebSocket (ADR-010) tái sử dụng cookie phiên HTTPS chuẩn của Better Auth trên cùng origin |

Danh sách gap tổng hợp nằm trong Gap analysis của use case [[4, Gap analysis]](#ref-4). Bảng dưới ghi kết quả đối chiếu từng mục của baseline độc lập và OWASP ASVS V4.4:

| Mục baseline | Trạng thái trước phân tích | Kết quả xử lý |
| --- | --- | --- |
| Cập nhật nến đang mở, đóng nến và giá sidebar (MF-1, BR-05) | Thiếu | Thêm cập nhật trực tiếp cho chart, sidebar và đóng nến (MK-93, MK-94, MK-95) |
| Đổi layout, đổi pair, đổi timeframe không làm gián đoạn chart khác, đổi liên tiếp, hai chart cùng timeframe (MF-2 đến MF-4, AF-1, AF-2) | Một phần (đã có cho vòng tải lịch sử và polling) | Bổ sung cách ly luồng trực tiếp (MK-96, MK-97), đổi liên tiếp (MK-124), hai chart cùng timeframe (MK-125) |
| Tạm dừng, tiếp tục có đồng bộ bù nến và đổi lựa chọn trong lúc tạm dừng (MF-5, AF-3) | Một phần (đã có nút tạm dừng ở vòng polling) | Bổ sung đồng bộ khi tiếp tục (MK-107), đổi lựa chọn khi tạm dừng (MK-109) và không báo mất kết nối khi tạm dừng (MK-108, OQ-035 đã chốt) |
| Tab ẩn hiện lại và reload (AF-4, AF-6) | Một phần | Mở rộng đồng bộ khi tab hiện lại (MK-126) và giữ reload về mặc định đang bật (MK-132, MK-37, MK-78) |
| Nhiều tab cùng phiên và giới hạn 4 tab mỗi tài khoản (AF-5, BR-14) | Thiếu | Bổ sung tính độc lập giữa các tab (MK-123) và dừng đồng loạt khi hết phiên (MK-121); giới hạn tối đa 4 tab mỗi tài khoản đã chốt ở Bước 10 (`MK-142` Confirmed, [OQ-087](../../../open-questions.md#oq-087) `Resolved`, đóng gap MK-138) |
| Mất kết nối, giữ dữ liệu, tự thử lại có trần 120 giây, kết nối lại thủ công (EF-1, BR-10) | Một phần (có trong prototype, chưa vào UC) | Bổ sung giữ dữ liệu (MK-100), báo mất kết nối (MK-101), kết nối lại thủ công (MK-102), khóa nút khi đang kết nối (MK-103) và trần tự thử lại 120 giây (MK-122). Chính sách backoff chi tiết chuyển sang thiết kế Bước 10 |
| Dữ liệu cũ 10 giây và tự đặt lại luồng 30 giây (EF-2, BR-09, QS-FRESH-2) | Thiếu | Thêm ngưỡng dữ liệu cũ 15 giây (MK-98) và ngưỡng đặt lại luồng 30 giây (MK-99) (gap MK-133) |
| Đồng bộ sau kết nối lại, bù nến thiếu và cảnh báo đồng bộ chưa xong (EF-3, EF-4, BR-11) | Một phần (mới có kịch bản ngắt nguồn QA-06) | Thêm trạng thái đang đồng bộ (MK-104), bù nến thiếu (MK-105), trực tiếp sau đồng bộ (MK-106), cảnh báo đồng bộ chưa xong (MK-127) (gap MK-134). Giữ nguyên quy tắc không lấp khoảng trống thật (MK-35) |
| Nến trùng, cập nhật đến muộn, dữ liệu sai và lỗi Binance (EF-5, EF-6, EF-8, EF-9, BR-04) | Một phần (đã có cho REST) | Thêm không tạo nến trùng (MK-110), không lùi dữ liệu cho cả chart và sidebar (MK-111), loại bỏ cập nhật sai (MK-128) và lỗi nguồn Binance (MK-130) (gap MK-136) |
| Yêu cầu phiên khi mở kênh trực tiếp và dừng cập nhật trong 5 giây khi phiên hết hạn (EF-7, BR-15) | Một phần (đã có luồng phiên hết hạn MK-40, MK-84) | Thêm từ chối mở mới khi thiếu phiên (MK-118), cưỡng chế dừng trong 5 giây trên mọi tab (MK-121) và luồng ngoại lệ (MK-129) (gap MK-137) |
| OWASP ASVS 5.0 V4.4.1 (TLS/WSS L1) và V4.4.2 (Origin L2) | Thiếu ở mức UC | Thêm kiểm origin (MK-119) và mã hóa trên production (MK-120) (gap MK-137); cơ chế triển khai thuộc Bước 10 (`23-security.md`) |
| OWASP ASVS 5.0 V4.4.3–4.4.4 (token riêng cho WebSocket, L2) | Không áp dụng (đã xác nhận nguyên văn) | Thiết kế Bước 10 (quyết định xác thực cookie phiên ADR-010) tái sử dụng cookie phiên HTTPS chuẩn của Better Auth trên cùng origin; đọc nguyên văn file `0x13-V4-API-and-Web-Service.md` ngày 2026-11-23 xác nhận V4.4.3–4.4.4 không áp dụng khi dùng quản lý phiên chuẩn |
| Freshness, capacity, recovery, data integrity (QS-FRESH-1, QS-CONC-2, QS-REC-1, QS-INT-2, QS-INT-3) | Một phần (mới có QA-05, QA-06) | Bổ sung kịch bản độ mới trực tiếp (QA-14), tải đồng thời tối thiểu 50 client (QA-15), phục hồi đồng bộ sau khôi phục mạng (QA-16) và toàn vẹn OHLCV (QA-17) |
| Không chỉ dùng màu, giữ vùng xem, giữ focus, giữ tooltip và tiết chế thông báo screen reader (A11Y-1, A11Y-3, A11Y-4, UX-2) | Một phần | Thêm nhãn chữ cho trạng thái kết nối (MK-112), tiết chế thông báo (MK-113) và bốn quy tắc giữ ngữ cảnh xem (MK-114 đến MK-117) (gap MK-139) |
| Lệch đồng hồ thiết bị ±60 giây (BR-13) | Thiếu | Accepted (gap MK-140): ngưỡng dữ liệu cũ (MK-98) đo theo khoảng thời gian trôi qua từ tín hiệu gần nhất; kiểm soát đồng hồ chuyển sang thiết kế Bước 10 và kiểm chứng Bước 11 |
| Coalescing tối đa 4 lần vẽ/giây, 50 fps, sidebar 5–50 pair (BR-08, BR-16, QS-CONC-1) | Không áp dụng | Realtime đang cố định 3 pair (MK-32) và sidebar chỉ hiển thị 1 pair đang chọn (MK-07, MK-60). Tần suất gộp frame vẽ thuộc thiết kế hiệu năng UI (Bước 10) nếu đo thấy nghẽn |
| Mặc định 1 chart 15m, giữ layout khi reload, nút Jump to latest, reduced motion, tabular-nums, đếm ngược đóng nến (BR-01, BR-02, AF-6, A11Y-2, A11Y-5, UX-2, UX-3) | Không áp dụng hoặc Accepted | Giữ quyết định đã chốt: mặc định 4 chart 5m/15m/1h/4h (MK-31), reload về mặc định (MK-37); các tiện ích UI chưa cần thiết ghi trong gap MK-141 |
| Độ lệch giữa giá sidebar và nến đang mở dưới 2 giây (BR-12, QS-INT-4) | Không áp dụng riêng | Cả chart và sidebar cùng nhận cập nhật trực tiếp trong ngưỡng độ mới 1,5 giây ở p95 (QA-14) và cùng quy tắc không lùi dữ liệu (MK-111), không cần thêm ngưỡng đồng bộ riêng giữa hai vùng |

## Quyết định và giá trị do agent đề xuất

Các giá trị và quyết định hành vi dưới đây do agent đề xuất; product owner duyệt toàn bộ ngày 2026-11-23, không đổi giá trị nào. Giá trị gốc nằm tại rule hoặc scenario ở cột Mục; khi thay đổi giá trị, cập nhật nơi gốc trước rồi cập nhật bảng này.

| Mục | Đề xuất | Nguồn và lý do | Thay đổi so với nguồn hiện có | Trạng thái |
| --- | --- | --- | --- | --- |
| Ngưỡng báo dữ liệu cũ (MK-98) | 15 giây không có tín hiệu hợp lệ | Agent đề xuất: dài hơn chu kỳ 5 giây của polling (MK-63) để tránh báo giả khi thị trường yên ngắn, ngắn hơn mốc 30 giây kết nối lại (QA-06). Baseline độc lập đề xuất 10 giây | Hành vi mới; dài hơn 5 giây so với đề xuất của baseline độc lập | Confirmed (2026-11-23) |
| Ngưỡng tự đặt lại luồng khi dữ liệu cũ (MK-99) | 30 giây không có tín hiệu hợp lệ | Agent đề xuất: gấp đôi ngưỡng dữ liệu cũ (MK-98), khớp mốc 30 giây của baseline độc lập (BR-09) | Hành vi mới | Confirmed (2026-11-23) |
| Trần thời gian tự thử kết nối lại (MK-122) | 120 giây mất kết nối trước khi chuyển sang trạng thái mất kết nối hoàn toàn | Agent đề xuất theo baseline độc lập (BR-10): tránh thử lặp vô hạn khi mất mạng lâu; người dùng vẫn có nút kết nối lại thủ công (MK-102) | Prototype không quy định khi nào dừng tự thử lại | Confirmed (2026-11-23) |
| Thời hạn bắt đầu đồng bộ khi tiếp tục hoặc tab hiện lại (MK-107, MK-126) | 1 giây | Understanding SC 2.2.2 [[13]](#ref-13); giữ cùng giá trị 1 giây đã duyệt ở vòng polling (MK-75, MK-77) | Mở rộng từ làm mới định kỳ sang đồng bộ trực tiếp | Confirmed (2026-11-23) |
| Thời hạn dừng cập nhật khi phiên hết hạn hoặc bị thu hồi (MK-121) | 5 giây trên mọi tab | Agent đề xuất theo baseline độc lập (BR-15): chặn tiếp tục đẩy dữ liệu cho phiên đã kết thúc | Vòng polling chỉ dừng ở lần gọi kế tiếp (chu kỳ 5 giây); vòng trực tiếp phải chủ động dừng kênh đang mở | Confirmed (2026-11-23) |
| Không báo mất kết nối khi đang tạm dừng (MK-108, OQ-035) | Giữ trạng thái tạm dừng, không hiện cảnh báo mất kết nối; đồng bộ khi người dùng tiếp tục | Agent đề xuất giải quyết câu hỏi báo mất kết nối khi tạm dừng ([OQ-035](../../../open-questions.md#oq-035)): người dùng chủ động đóng băng màn hình để phân tích | Prototype không thể hiện tổ hợp này | Confirmed (2026-11-23) |
| Không hiển thị con số ms độ trễ trên UI (gap MK-141) | Chỉ hiển thị nhãn trạng thái kết nối và thời điểm dữ liệu của từng chart | Agent đề xuất: sai lệch đồng hồ thiết bị làm số ms độ trễ trên trình duyệt gây hiểu nhầm; độ trễ thật đo qua observability và benchmark | Khác prototype (prototype ghi `"Live · Binance"` kèm độ trễ) | Confirmed (2026-11-23) |
| Mở rộng phạm vi bảo mật sang OWASP ASVS V4.4.1–4.4.2 (MK-119, MK-120) | Kiểm `Origin` lúc bắt tay (V4.4.2 L2) và chỉ dùng kết nối mã hóa trên production (V4.4.1 L1) | Agent đề xuất mở rộng ngoài phạm vi Auth/Session của ADR-002 [[11, ADR-002]](#ref-11) để bảo vệ kênh trực tiếp khỏi Cross-Site WebSocket Hijacking và truyền không mã hóa | Mở rộng phạm vi chuẩn ASVS so với ADR-002 | Confirmed (2026-11-23) |
| Giữ dữ liệu, hiển thị mất kết nối và nút kết nối lại thủ công (MK-100 đến MK-103) | Giữ dữ liệu gần nhất, báo thời điểm mất kết nối và đang thử lại, có nút kết nối lại thủ công (MK-100 đến MK-102); khóa nút khi lần kết nối thủ công đang chạy (MK-103) | Prototype Realtime [[8, Mất kết nối]](#ref-8) kết hợp tránh gửi lặp tương tự khóa thử lại khi đang tải (MK-38) | Chuyển hành vi prototype sang requirement chính thức và bổ sung khóa chống gửi lặp | Confirmed (2026-11-23) |
| Phân biệt đang đồng bộ và cảnh báo đồng bộ chưa xong (MK-104 đến MK-106, MK-127) | Kết nối mở lại chuyển sang đang đồng bộ; chỉ báo trực tiếp sau khi bù đủ nến đóng; bù lỗi thì báo đồng bộ chưa xong | Mục tiêu phân biệt kết nối lại với đồng bộ xong [[9, mục 5]](#ref-9) và baseline độc lập (EF-3) | Bổ sung trạng thái mà prototype chưa có | Confirmed (2026-11-23) |
| Độ mới dữ liệu trực tiếp (QA-14) | Source-to-chart delay dưới 1,5 giây ở p95 | Định hướng CV định nghĩa chỉ số source-to-chart delay [[10]](#ref-10); con số 1,5 giây do agent đề xuất (1 giây từ lúc hệ thống nhận event của QA-05 cộng tối đa 0,5 giây truyền từ nguồn tới hệ thống, khớp baseline độc lập QS-FRESH-1) | Scenario mới, tách khỏi độ trễ nhận event tới màn hình (QA-05) | Confirmed (2026-11-23) |
| Tải đồng thời tối thiểu (QA-15, OQ-067) | Ít nhất 50 client đồng thời, 0 nến sai, độ trễ từ lúc hệ thống nhận event dưới 1 giây ở p95, tối đa 1 kết nối tới nguồn mỗi tổ hợp pair/timeframe | Agent đề xuất: 50 client khớp bậc tải cao nhất của giới hạn tải polling (QA-13); điều kiện tính capacity lấy từ định hướng CV [[10]](#ref-10) | Scenario mới; cần tách máy phát tải khỏi máy chủ vì 50 client chạy cùng máy đã bão hòa ở `polling-v2` [[2]](#ref-2) | Confirmed (2026-11-23) |
| Thời lượng ngắt mạng thử nghiệm và ngưỡng phục hồi đồng bộ (QA-16) | Ngắt kết nối 30 giây đến 5 phút; phục hồi đồng bộ dưới 10 giây ở p95 sau khi mạng khôi phục | Định hướng CV định nghĩa chỉ số thời gian phục hồi [[10]](#ref-10); khoảng ngắt 30 giây đến 5 phút do agent đề xuất để tạo 1 đến 5 nến đóng khung 1m bị thiếu cần bù mà thời gian kiểm thử vẫn gọn; ngưỡng 10 giây do agent đề xuất (bằng một phần ba mốc 30 giây của QA-06, khớp baseline độc lập QS-REC-1) | Bổ sung bên cạnh mốc 30 giây kết nối lại khi Binance đóng kết nối của kịch bản ngắt nguồn (QA-06) | Confirmed (2026-11-23) |
| Toàn vẹn OHLCV sau trực tiếp và phục hồi (QA-17) | 0 nến đóng thiếu, 0 nến trùng, 0 nến đóng lệch OHLCV | Quy tắc dữ liệu khớp nguồn (MK-51, MK-52), bù nến (MK-105) và định hướng kiểm chứng toàn vẹn dữ liệu [[10]](#ref-10) | Scenario chất lượng mới cho vòng trực tiếp | Confirmed (2026-11-23) |

## Kết luận

Phân tích đã đối chiếu xong với ba baseline độc lập và ghi nhận đầy đủ tác động lên requirements hiện có. Product owner đã duyệt toàn bộ rule (`MK-93` đến `MK-132`), bốn scenario (`QA-14` đến `QA-17`), quyết định `OQ-035` và các gap chấp nhận (`MK-140`, `MK-141`) ngày 2026-11-23. Cả hai điều kiện chuyển tiếp đã được đóng: câu hỏi giới hạn số tab đồng thời ([OQ-087](../../../open-questions.md#oq-087)) đã chốt tại Bước 10 (`MK-142` Confirmed, `e819628`), và nguyên văn OWASP ASVS 5.0 V4.4 [[14]](#ref-14) đã được đọc trực tiếp ngày 2026-11-23 tại Bước 11. **Requirements của vòng WebSocket đủ làm đầu vào cho chốt kiểm chứng (Bước 11) và triển khai (Bước 12).** Mọi chỉ số ở các kịch bản chất lượng mới (QA-14 đến QA-17) là mục tiêu cần kiểm chứng, không phải kết quả đã đo.

## References

1. <a id="ref-1"></a>[Kiểm chứng REST tải lịch sử](rest-verification.md)
2. <a id="ref-2"></a>[Kiểm chứng REST polling](rest-polling-verification.md)
3. <a id="ref-3"></a>[Quality Attributes](../../../UCs/quality-attributes.md)
4. <a id="ref-4"></a>[Market Data](../../../UCs/market-data.md)
5. <a id="ref-5"></a>[Open Questions](../../../open-questions.md)
6. <a id="ref-6"></a>[Kế hoạch triển khai Market Data ở mức tổng quan](../../../build/01-prototype-to-implementation/market-data/abstract-implementation-plan.md)
7. <a id="ref-7"></a>[Project Brief](../../../UCs/sources/project-brief.md)
8. <a id="ref-8"></a>[Realtime](../../../design/prototype/docs/requirements/realtime.md)
9. <a id="ref-9"></a>[Những thứ cần đạt được trong lúc build Market Data](../../../build/01-prototype-to-implementation/market-data/goal.md)
10. <a id="ref-10"></a>[Market Data sẽ thêm dòng nào vào CV?](../../../build/01-prototype-to-implementation/market-data/cv-goal.md)
11. <a id="ref-11"></a>[Architectural Decisions](../../../architecture/30-decisions.md)
12. <a id="ref-12"></a>W3C, *Web Content Accessibility Guidelines (WCAG) 2.2*, W3C Recommendation, 12/12/2024. <https://www.w3.org/TR/WCAG22/>
13. <a id="ref-13"></a>W3C, *Understanding SC 2.2.2: Pause, Stop, Hide (Level A)*, cập nhật 04/10/2026, đọc ngày 2026-11-22. <https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html>
14. <a id="ref-14"></a>OWASP ASVS 5.0, V4 API and Web Service (V4.4 WebSocket), đọc nguyên văn file `0x13-V4-API-and-Web-Service.md` ngày 2026-11-23. <https://raw.githubusercontent.com/OWASP/ASVS/master/5.0/en/0x13-V4-API-and-Web-Service.md>
