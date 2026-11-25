# Q03 - Vì sao WebSocket phù hợp với Market Data?

Đọc file này để biết những đặc điểm của Market Data khiến WebSocket phù hợp để cập nhật dữ liệu trực tiếp, cùng các đánh đổi về thiết kế và vận hành.

## Tóm tắt

* Market Data có dữ liệu thay đổi liên tục, yêu cầu độ trễ thấp và nhiều người dùng cần cùng một nguồn dữ liệu.
* WebSocket cho phép Backend chủ động gửi dữ liệu mới đến Client mà không phải chờ chu kỳ REST Polling [[1]](#ref-1).
* Shared Subscriptions giúp nhiều Client sử dụng chung một đăng ký dữ liệu từ Binance [[1]](#ref-1).
* WebSocket yêu cầu Backend quản lý kết nối, đăng ký dữ liệu và phục hồi khi mất kết nối [[1]](#ref-1).
* Crypto Force dùng REST để lấy lịch sử và bù dữ liệu thiếu. WebSocket xử lý cập nhật trực tiếp [[1]](#ref-1).

---

1. **Continuous Updates (Dữ liệu thay đổi liên tục)**
   - **Đặc điểm:** Giá, Volume (khối lượng giao dịch) và Candles (nến) thay đổi thường xuyên. Các thay đổi không phụ thuộc vào thời điểm Client gửi yêu cầu.
   - **Requirement (Yêu cầu):** Client cần nhận dữ liệu mới ngay khi Backend nhận được từ Binance.
   - **WebSocket Fit (Điểm phù hợp):** Backend sử dụng Server Push (chủ động gửi dữ liệu) qua kết nối đang mở [[1]](#ref-1).
   - **Trade-off (Đánh đổi):** Backend phải quản lý Connection Lifecycle (vòng đời kết nối) và phát hiện khi kết nối bị mất.

2. **Low Latency & Data Freshness (Độ trễ thấp và dữ liệu mới)**
   - **Đặc điểm:** Giá và nến trên biểu đồ cần phản ánh dữ liệu mới với độ trễ thấp.
   - **Requirement:** Giảm Source-to-Chart Latency (thời gian từ lúc nguồn phát dữ liệu đến khi biểu đồ cập nhật).
   - **WebSocket Fit:** Loại bỏ thời gian chờ Polling Interval (khoảng thời gian giữa hai lần gọi API).
   - **Trade-off:** Vẫn có Network Latency (độ trễ mạng) và Processing Latency (độ trễ xử lý). Hệ thống cần Stale Detection (phát hiện dữ liệu cũ) và Reconnection (kết nối lại) [[1]](#ref-1).
   - **Evidence (Bằng chứng):** Trong benchmark 10 Client, độ trễ p95 từ nguồn đến biểu đồ giảm từ khoảng 4.642 ms với REST Polling xuống 40 ms với WebSocket. Đây là kết quả của bài đo rút gọn, không phải mức cải thiện cố định cho mọi hệ thống [[2]](#ref-2).

3. **Incremental Updates (Cập nhật từng phần)**
   - **Đặc điểm:** Mỗi sự kiện thường chỉ thay đổi nến hiện tại hoặc thông tin giá. Phần lớn nến lịch sử không thay đổi.
   - **Requirement:** Tránh truyền lại dữ liệu không thay đổi.
   - **WebSocket Fit:** Backend gửi Incremental Updates (dữ liệu mới hoặc thay đổi) thay vì liên tục gửi Full Snapshot (toàn bộ dữ liệu tại một thời điểm).
   - **Trade-off:** Client phải quản lý Local State (dữ liệu đang lưu tại Client) và Data Merging (hợp nhất dữ liệu). Client cũng phải xử lý Duplicate Events (sự kiện trùng) và Out-of-order Events (sự kiện đến sai thứ tự) [[1]](#ref-1).

4. **Multiple Consumers (Nhiều Client cần cùng dữ liệu)**
   - **Đặc điểm:** Nhiều người dùng có thể theo dõi cùng một Trading Pair (cặp giao dịch) và Timeframe (khung thời gian).
   - **Requirement:** Tránh Duplicate Upstream Subscriptions (đăng ký trùng dữ liệu với Binance).
   - **WebSocket Fit:** Backend sử dụng Shared Subscriptions (chia sẻ đăng ký dữ liệu từ Binance) và Fan-out (nhận một sự kiện rồi phân phối cho nhiều Client) [[1]](#ref-1).
   - **Trade-off:** Backend phải quản lý Subscription Registry (danh sách đăng ký), Reference Counting (đếm số bên đang đăng ký) và Slow Consumers (Client nhận dữ liệu quá chậm).
   - **Lưu ý:** Shared Subscriptions là giải pháp do Backend triển khai. WebSocket không tự động cung cấp cơ chế này.

5. **Long-lived Connections (Kết nối được duy trì lâu dài)**
   - **Đặc điểm:** Người dùng có thể mở biểu đồ và theo dõi dữ liệu trong thời gian dài.
   - **Requirement:** Client cần tiếp tục nhận dữ liệu và thay đổi kênh đăng ký khi cần.
   - **WebSocket Fit:** Persistent Connection (kết nối được duy trì) hỗ trợ Bidirectional Communication (trao đổi dữ liệu hai chiều). Client có thể Subscribe (đăng ký) hoặc Unsubscribe (hủy đăng ký) qua cùng kết nối [[1]](#ref-1).
   - **Trade-off:** Backend phải quản lý Connection State (trạng thái kết nối) và Subscription State (trạng thái đăng ký).
   - **Scaling Impact (Ảnh hưởng đến mở rộng):** Horizontal Scaling (mở rộng bằng cách thêm máy chủ) phức tạp hơn khi mỗi Backend Instance (một tiến trình Backend) giữ các kết nối riêng.
   - **Inferred:** Nếu nhiều Backend Instances cần chia sẻ cùng dữ liệu, hệ thống có thể cần cơ chế phân phối dữ liệu giữa các instances. Đây là vấn đề mở rộng từ thiết kế Hub hiện tại [[1]](#ref-1).

6. **Data Consistency & Recovery (Tính chính xác và phục hồi dữ liệu)**
   - **Đặc điểm:** Giá và nến vẫn thay đổi khi Client mất kết nối.
   - **Requirement:** Đảm bảo Data Integrity (tính toàn vẹn dữ liệu). Biểu đồ không được thiếu nến đã đóng, có nến trùng hoặc ghi đè dữ liệu mới bằng dữ liệu cũ.
   - **WebSocket Fit:** WebSocket tiếp tục nhận Live Events (sự kiện trực tiếp) sau khi Reconnect (kết nối lại). Tuy nhiên, WebSocket không tự lấy lại các sự kiện bị bỏ lỡ.
   - **Trade-off:** Cần REST Backfill (gọi REST để bù dữ liệu thiếu), Event Reconciliation (đối chiếu và hợp nhất sự kiện) và Synchronization State (trạng thái đồng bộ).
   - **Crypto Force:** Hệ thống sử dụng REST để lấy dữ liệu thiếu sau khi mất kết nối. Client đối chiếu và hợp nhất dữ liệu trước khi báo đã đồng bộ [[1]](#ref-1).

7. **Trade-off Summary (Bảng tổng hợp)**

   | Đặc điểm Market Data | WebSocket đáp ứng | Đánh đổi |
   |---|---|---|
   | Continuous Updates (cập nhật liên tục) | Server Push (chủ động gửi dữ liệu) | Connection Management (quản lý kết nối) |
   | Low Latency (độ trễ thấp) | Không chờ Polling Interval (chu kỳ gọi API) | Reconnection & Stale Detection (kết nối lại và phát hiện dữ liệu cũ) |
   | Incremental Updates (cập nhật từng phần) | Gửi dữ liệu thay đổi | Local State & Data Merging (lưu và hợp nhất dữ liệu) |
   | Multiple Consumers (nhiều Client cần cùng dữ liệu) | Shared Subscriptions & Fan-out (chia sẻ đăng ký và phân phối dữ liệu) | Subscription Management (quản lý đăng ký) |
   | Long-lived Monitoring (theo dõi lâu dài) | Persistent Connection (duy trì kết nối) | Stateful Backend (Backend lưu trạng thái kết nối) |
   | Data Integrity (tính toàn vẹn dữ liệu) | Live Events kết hợp REST Backfill | Recovery Complexity (phục hồi phức tạp hơn) |

   **Agent đề xuất:** Bảng này tổng hợp các đặc điểm trong thiết kế Market Data và những đánh đổi liên quan [[1]](#ref-1). Các đặc điểm không phải ưu điểm tuyệt đối của WebSocket trong mọi hệ thống.

8. **Key Takeaway (Kết luận)**
   - WebSocket phù hợp với Market Data vì dữ liệu thay đổi liên tục và cần được cập nhật nhanh.
   - Shared Subscriptions và Fan-out giúp Backend chia sẻ dữ liệu Binance cho nhiều Client.
   - WebSocket làm tăng độ phức tạp trong quản lý kết nối và trạng thái đăng ký.
   - Stateless Scaling (mở rộng bằng các máy chủ không cần lưu trạng thái phiên làm việc của từng Client) vẫn có giá trị. Crypto Force chấp nhận thêm trạng thái kết nối để hỗ trợ cập nhật trực tiếp.
   - Crypto Force sử dụng Hybrid Architecture (kiến trúc kết hợp): REST xử lý dữ liệu lịch sử và phục hồi, WebSocket xử lý cập nhật trực tiếp [[1]](#ref-1).

   **Decision Rule (Nguyên tắc lựa chọn):** Chọn WebSocket khi yêu cầu cập nhật nhanh và liên tục đủ quan trọng để chấp nhận chi phí quản lý kết nối. Đây là nguyên tắc tổng hợp từ các đánh đổi trên.

9. **Project & Operational Constraints (Ràng buộc của dự án và vận hành)**

   - **Scaling Strategy (Chiến lược mở rộng):** Nếu giai đoạn hiện tại chỉ dùng một Backend Instance, hệ thống có thể quản lý Subscription State (trạng thái đăng ký) trong bộ nhớ. Khi mở rộng nhiều instances, cần xem lại cách chia sẻ dữ liệu.
   - **Infrastructure (Hạ tầng):** Máy chủ và Reverse Proxy (thành phần chuyển tiếp yêu cầu đến Backend) cần hỗ trợ kết nối WebSocket lâu dài.
   - **Provider Capabilities (Khả năng của nguồn dữ liệu):** Binance hỗ trợ WebSocket API để cung cấp dữ liệu thị trường trực tiếp.
   - **Rate Limits (Giới hạn yêu cầu):** Binance giới hạn số lượng yêu cầu và kết nối. Shared Subscriptions giúp giảm số đăng ký và kết nối trùng lặp.
   - **Development Cost (Chi phí phát triển):** WebSocket cần thêm công việc quản lý kết nối, xử lý lỗi và kiểm thử.
   - **Recovery Strategy (Cách phục hồi):** REST Backfill (lấy lại dữ liệu thiếu qua REST) giúp Client đồng bộ sau khi mất WebSocket connection.

   **Key Insight:** Các ràng buộc này không trực tiếp tạo ra nhu cầu dùng WebSocket. Chúng quyết định hệ thống có thể chấp nhận những đánh đổi của WebSocket hay không.

   **Open:** Cần xác nhận kế hoạch Horizontal Scaling và giới hạn hạ tầng của Crypto Force trước khi coi chúng là ràng buộc đã được chốt.

---

## References

1. <a id="ref-1"></a>[Market Data & Realtime Updates](../../architecture/10-market-data.md)
2. <a id="ref-2"></a>[Kiểm chứng WebSocket cập nhật trực tiếp](../../testing/test-scopes/TS-002-market-data/websocket-verification.md)
