# Q04 - OSI, TCP/IP, HTTP và WebSocket liên quan như thế nào? Dữ liệu đi qua các tầng mạng ra sao?

Đọc file này để hiểu vai trò của các giao thức mạng, cách dữ liệu được truyền giữa các tầng và cách WebSocket hoạt động trong Crypto Force.

## Tóm tắt

* **Protocol (giao thức):** Tập hợp các quy tắc để hai hệ thống trao đổi dữ liệu.
* **OSI:** Mô hình tham chiếu gồm 7 tầng, giúp phân chia trách nhiệm khi truyền dữ liệu.
* **TCP/IP:** Bộ giao thức được Internet sử dụng, thường được mô tả bằng 4 tầng.
* **Encapsulation (đóng gói):** Mỗi tầng thêm thông tin cần thiết trước khi truyền dữ liệu.
* **WebSocket:** Giao thức ở tầng Application, sử dụng TCP để truyền các message hai chiều.
* **Crypto Force:** Browser ↔ Backend và Backend ↔ Binance sử dụng hai kết nối WebSocket độc lập [[1]](#ref-1).

---

1. **Protocol và mô hình OSI**

   Protocol quy định cách hai hệ thống giao tiếp. Mỗi giao thức giải quyết một phần công việc, thay vì một giao thức xử lý tất cả.

   | OSI Layer | Trách nhiệm | Ví dụ |
   |---|---|---|
   | **7. Application** | Quy tắc giao tiếp giữa ứng dụng | HTTP, WebSocket, DNS |
   | **6. Presentation** | Biểu diễn, mã hóa và chuyển đổi dữ liệu | Chức năng mã hóa, định dạng |
   | **5. Session** | Quản lý phiên giao tiếp | Thiết lập, duy trì phiên |
   | **4. Transport** | Truyền dữ liệu giữa hai đầu | TCP, UDP |
   | **3. Network** | Định địa chỉ và định tuyến | IP |
   | **2. Data Link** | Truyền dữ liệu trên một liên kết mạng | Ethernet, Wi-Fi |
   | **1. Physical** | Truyền tín hiệu vật lý | Cáp, sóng vô tuyến |

   OSI là mô hình tham chiếu. Trong thực tế, tầng 5 và 6 thường không tồn tại dưới dạng những lớp giao thức riêng biệt.

2. **OSI và TCP/IP khác nhau như thế nào?**

   | OSI (7 tầng) | TCP/IP (4 tầng) | Giao thức hoặc chức năng |
   |---|---|---|
   | Application, Presentation, Session | **Application** | HTTP, WebSocket, biểu diễn dữ liệu |
   | Transport | **Transport** | TCP, UDP |
   | Network | **Internet** | IPv4, IPv6 |
   | Data Link, Physical | **Link** | Ethernet, Wi-Fi |

   - **OSI:** Giúp hiểu và phân chia trách nhiệm của các tầng.
   - **TCP/IP:** Mô tả các giao thức được sử dụng để trao đổi dữ liệu trên Internet.
   - **Điểm cần nhớ:** HTTP và WebSocket thuộc tầng Application. TCP thuộc Transport. IP thuộc Network.

3. **Protocol Stack (Các giao thức phối hợp như thế nào?)**

   Với WebSocket bảo mật ( `wss://` ), các giao thức phối hợp như sau:

   

```mermaid
   flowchart TB
       A["WebSocket<br/>Quy định message và frame"]
       B["TLS<br/>Mã hóa dữ liệu"]
       C["TCP<br/>Truyền byte đúng thứ tự"]
       D["IP<br/>Định địa chỉ và định tuyến"]
       E["Ethernet / Wi-Fi<br/>Truyền qua liên kết mạng"]

       A --> B --> C --> D --> E
   ```

   | Protocol | Trách nhiệm | Không đảm bảo |
   |---|---|---|
   | **WebSocket** | Phân biệt message, giao tiếp hai chiều | Tự phục hồi message bị bỏ lỡ |
   | **TLS** | Mã hóa và bảo vệ dữ liệu khi truyền | Truyền dữ liệu thay TCP |
   | **TCP** | Truyền luồng byte đúng thứ tự, phát hiện mất và truyền lại | Phân biệt JSON message |
   | **IP** | Chuyển gói tin qua các mạng | Gói tin chắc chắn tới đích |

   **HTTP nằm ở đâu?**

   - HTTP và WebSocket đều là giao thức tầng Application.
   - Với WebSocket qua HTTP/1.1, Client gửi HTTP Upgrade request.
   - Server chấp nhận bằng `101 Switching Protocols` .
   - Sau đó, hai bên trao đổi WebSocket frames qua kết nối TCP hiện có.
   - HTTP Upgrade không tạo thêm một TCP connection.

4. **Encapsulation & Decapsulation (Đóng gói và tháo gói dữ liệu)**

   Giả sử Backend gửi một WebSocket message chứa giá BTCUSDT.

   

```json
   {"pair":"BTCUSDT","price":95000}
   ```

   Dữ liệu được chuyển thành byte và đóng gói qua nhiều tầng:

   

```mermaid
   flowchart TB
       A["Application<br/>WebSocket Frame = WS Header + Message"]
       B["TLS (WSS)<br/>Mã hóa và bảo vệ dữ liệu"]
       C["Transport<br/>TCP Segment = TCP Header + Bytes"]
       D["Network<br/>IP Packet = IP Header + TCP Segment"]
       E["Data Link<br/>Frame = Link Header + IP Packet + Trailer"]
       F["Physical<br/>Tín hiệu điện / ánh sáng / sóng"]

       A -->|Encapsulation| B
       B --> C --> D --> E --> F
   ```

   - **Encapsulation:** Bên gửi thêm thông tin theo từng tầng để truyền dữ liệu.
   - **Decapsulation:** Bên nhận xử lý các thông tin đó theo chiều ngược lại.
   - Một WebSocket message có thể được truyền qua nhiều TCP segments.
   - TCP chỉ xử lý luồng byte. WebSocket Framing (cách đóng khung) giúp ứng dụng phân biệt các message.

   Sơ đồ mô tả quá trình truyền ở mức khái niệm. TLS và TCP có thể chia dữ liệu thành những phần khác nhau.

5. **HTTP vs WebSocket trên TCP**

   | Đặc điểm | HTTP/1.1 | WebSocket |
   |---|---|---|
   | OSI Layer | Application | Application |
   | Transport | TCP | TCP |
   | Cách giao tiếp | Request → Response | Message hai chiều |
   | Bên bắt đầu trao đổi | Client gửi request | Hai bên có thể gửi message sau khi kết nối |
   | TCP Connection | Có thể tái sử dụng | Duy trì cho phiên WebSocket |
   | Đơn vị dữ liệu | HTTP message | WebSocket frame/message |

   **Điểm cốt lõi:** Cả HTTP và WebSocket đều có thể sử dụng TCP. Khác biệt nằm ở quy tắc giao tiếp của tầng Application, không đơn thuần là thời gian giữ kết nối.

6. **Áp dụng trong Crypto Force**

   

```mermaid
   flowchart LR
       C["Browser"]
       B["Backend"]
       X["Binance"]

       C <-->|"WS 1 / TCP 1<br/>Downstream"| B
       B <-->|"WS 2 / TCP 2<br/>Upstream"| X
   ```

   - **WS 1:** Browser kết nối tới Backend để đăng ký và nhận dữ liệu.
   - **WS 2:** Backend kết nối tới Binance để nhận dữ liệu thị trường.
   - Hai kết nối có TCP connections riêng.
   - Backend nhận dữ liệu từ Binance, chuẩn hóa và chuyển tiếp đến Browser [[1]](#ref-1).
   - `MarketDataStreamHub` quản lý Shared Subscriptions (chia sẻ đăng ký dữ liệu) và Fan-out (phân phối một sự kiện đến nhiều Client) [[2]](#ref-2).

7. **Key Takeaway (Kết luận)**

   - **OSI:** Giúp hiểu mỗi tầng mạng giải quyết vấn đề gì.
   - **TCP/IP:** Các giao thức phối hợp để truyền dữ liệu qua Internet.
   - **TCP:** Truyền byte đáng tin cậy và đúng thứ tự khi kết nối hoạt động.
   - **TLS:** Bảo vệ dữ liệu bằng mã hóa.
   - **HTTP/WebSocket:** Quy định cách ứng dụng trao đổi dữ liệu.
   - **Encapsulation:** Đóng gói dữ liệu qua các tầng trước khi truyền.
   - **Decapsulation:** Xử lý dữ liệu theo chiều ngược lại ở bên nhận.

   **Mental Model:** Ứng dụng tạo message → WebSocket đóng khung → TLS mã hóa → TCP truyền byte → IP định tuyến → mạng vật lý truyền tín hiệu.

---

## References

1. <a id="ref-1"></a>[Market Data & Realtime Updates](../../architecture/10-market-data.md)
2. <a id="ref-2"></a>[market-data-stream.service.ts](../../../apps/api/src/services/market-data-stream.service.ts)
