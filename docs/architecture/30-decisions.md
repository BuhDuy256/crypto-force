# Architectural Decisions

Đọc file này để biết danh sách Architectural Decision Record và lý do chọn từng quyết định.

## ADR-001: Chặn màn hình workspace bằng route middleware ở web

**Status:** Accepted (2026-11-16)

### Bối cảnh

Mọi màn hình workspace chỉ mở được khi có phiên. Khi không có phiên, màn hình hiện lời mời đăng nhập ngay tại URL đó, và đăng nhập xong thì quay lại đúng màn hình [[1, Phiên và Sign out]](#ref-1). Lớp chặn này chỉ phục vụ hiển thị; API vẫn tự kiểm phiên ở từng request [[2]](#ref-2).

Web chạy ở chế độ SPA, nên phiên được kiểm ở trình duyệt bằng `GET /api/auth/get-session`. Loader của từng màn hình không được chạy khi chưa có phiên, vì nó sẽ gọi API và nhận lỗi 401 hàng loạt.

### Quyết định

- Các màn hình workspace nằm dưới một layout route chung. Layout này khai báo `clientMiddleware`, chạy trước mọi loader con.
- Middleware gọi `get-session`:
  - không có phiên thì ném `data(null, { status: 401 })`;
  - không gọi được (mất mạng, API lỗi) thì ném status 503;
  - có phiên thì đưa phiên vào router context để loader dùng lại, không gọi `get-session` lần nữa.
- `ErrorBoundary` của root hiển thị theo status: 401 là màn chặn đăng nhập, 503 là lỗi tải kèm nút thử lại. Layout không có `ErrorBoundary` riêng.
- Khi tab hiện lại (`visibilitychange`), layout chạy lại loader, nên phiên kết thúc ở tab khác sẽ hiện màn chặn ngay tại URL hiện tại.

### Lý do

Middleware chặn được loader con trong cả hai trường hợp: mở thẳng URL và điều hướng trong app. Kiểm phiên trong component (hoặc trong loader của layout) không làm được điều này, vì loader con chạy song song với loader cha.

Màn chặn đặt ở root vì spike trên React Router 8.5.1 cho thấy lỗi từ middleware rơi vào boundary khác nhau. Khi mở thẳng URL, lỗi rơi vào boundary của root. Khi điều hướng trong app, lỗi rơi vào boundary của layout. Xử lý ở root cho cùng một kết quả trong cả hai trường hợp.

### Hệ quả

- Màn hình workspace mới chỉ cần thêm route vào layout; không tự kiểm phiên.
- Màn chặn hiện toàn trang, không có App header. Điều này khớp với yêu cầu, vì khi chưa đăng nhập thì không có gì để hiện trong header.
- Status khác 401 và 503 từ loader con vẫn rơi vào phần hiển thị lỗi chung của root.
- Nếu sau này bật SSR, phải xét lại quyết định này, vì middleware phía server chạy theo cách khác.

## ADR-002: Mức bảo mật Authentication theo OWASP ASVS 5.0 L1 cộng một số mục L2

**Status:** Accepted (2026-11-16)

### Bối cảnh

Crypto Force chỉ mô phỏng: không giữ tiền, không kết nối sàn và không đặt lệnh [[3]](#ref-3). Tài khoản chỉ bảo vệ dữ liệu nghiên cứu của người dùng, như strategy và kết quả backtest. Cần một mức chuẩn để quyết định yêu cầu bảo mật nào của Authentication và Session là bắt buộc, yêu cầu nào là rủi ro chấp nhận.

### Quyết định

- Nền là ASVS 5.0 L1 cho các chương V6 Authentication, V7 Session Management và các mục 3.3, 3.4, 3.5, 3.7 của V3 Web Frontend Security [[4]](#ref-4) [[5]](#ref-5) [[6]](#ref-6).
- Thêm các mục L2 làm được bằng config, một middleware hoặc một hook nhỏ:
  - thời hạn phiên tuyệt đối 30 ngày (7.3.2), và ghi rõ thời hạn phiên cùng số phiên đồng thời (7.1.1, 7.1.2);
  - kiểm password đã bị lộ khi đăng ký và đặt password mới (6.2.12);
  - header `X-Content-Type-Options`, `Referrer-Policy`, CSP `frame-ancestors` (3.4.4–3.4.6);
  - nút Sign out trên mọi màn hình đã đăng nhập (7.4.4).
- Hành vi cụ thể ghi trong Security [[2]](#ref-2).

### Rủi ro chấp nhận

| Rủi ro | Mục ASVS | Lý do chấp nhận |
| --- | --- | --- |
| Không có MFA | 6.3.3 (L2) | Mất tài khoản không gây thiệt hại tài chính |
| Giới hạn đăng nhập chỉ theo IP; kẻ tấn công đổi IP liên tục vẫn thử được nhiều password cho một tài khoản | 6.3.1 | Giới hạn theo tài khoản cho phép người khác cố ý khóa tài khoản của người dùng |
| Không có idle timeout | 7.3.1 (L2) | Đã có thời hạn tuyệt đối và Sign out |
| Phần mềm quét email mở link xác minh trước người dùng thì phiên được tạo trên máy quét, người dùng phải tự Sign in | 3.5.3, 7.6.2 (L2) | Link xác minh là GET; đổi sang bước xác nhận bằng POST tốn công hơn lợi ích ở mức này |
| Xóa session ở DB lỗi khi Sign out thì token đã bị sao chép còn dùng được tới khi hết hạn | 7.4.1 | Phải đồng thời mất token và DB lỗi; xử lý phải can thiệp vào luồng nội bộ của Better Auth |
| Không chặn password chứa từ theo ngữ cảnh (tên sản phẩm, email) | 6.1.2, 6.2.11 (L2) | Đã chặn password phổ biến và password đã bị lộ |
| Cookie dùng tiền tố `__Secure-`, không phải `__Host-` | 3.3.3 (L2) | `__Secure-` đạt L1 |
| Chưa có CSP đầy đủ | 3.4.3 (L2) | Làm riêng khi rà bảo mật toàn app |
| Không báo cho người dùng khi đăng nhập đáng ngờ hoặc khi password đổi | 6.3.5, 6.3.7 (L3) | Ngoài mức đã chọn |
| Thời gian phản hồi có thể khác nhau giữa email đã và chưa đăng ký | 6.3.8 (L3) | Nội dung và status đã giống nhau |
| Chưa có xem và kết thúc từng phiên, xác thực lại trước khi đổi email | 7.5.1, 7.5.2 (L2) | Thuộc Settings, quyết ở increment đó |
| Không kiểm chữ ký id_token của Google trong luồng authorization code | 6.8.2 (L2) | Token được nhận trực tiếp từ token endpoint của Google qua TLS; OpenID Connect cho phép dùng xác thực TLS thay cho kiểm chữ ký trong trường hợp này [[7, §3.1.3.7]](#ref-7). Đây là hành vi mặc định của Better Auth |

### Hệ quả

- Mỗi mục L1 và L2 đã chọn phải có test trước khi phát hành.
- Kiểm password đã bị lộ gọi API bên ngoài khi Create account và Reset password.
- Phải nâng lên L2 đầy đủ nếu sau này lưu API key của sàn hoặc đặt lệnh thật.

## ADR-003: Đặt adapter dữ liệu thị trường trong layer `providers/` của API

**Status:** Accepted (2026-11-20)

### Bối cảnh

Backend chỉ được gọi Binance qua `MarketDataProvider`; frontend không gọi Binance [[9, Shared và Engine]](#ref-9). Thêm provider thứ hai không được làm thay đổi frontend (QA-09) [[11, Modifiability]](#ref-11). `apps/api` đã có layer Route, Controller, Service, Repository, Mapper nhưng chưa có nơi cho đầu ra tới API bên ngoài. Worker chưa cần dữ liệu thị trường.

### Phương án đã xét

| Phương án | Dễ hơn | Khó hơn |
| --- | --- | --- |
| Folder `providers/` trong `apps/api`, interface đặt cùng adapter | Một chỗ để đọc interface và adapter; ranh giới import viết được bằng ESLint như các layer khác | Worker không dùng lại được; rule ESLint phải chặn Service import file adapter theo tên file, vì interface và adapter cùng folder |
| Interface do `services/` sở hữu, adapter ở `providers/` | Đúng nguyên tắc dependency inversion | Thêm một bước nhảy khi đọc code, khi chỉ có một service và một provider |
| Interface và adapter trong một package mới | API và Worker dùng chung | Tạo package khi chưa có bên dùng thứ hai, trái quy tắc không tạo abstraction trước nhu cầu [[9, Dependency rules]](#ref-9) |

### Quyết định

- Tạo `apps/api/src/providers/market-data/` gồm interface `MarketDataProvider`, kiểu domain và adapter Binance.
- Adapter chuẩn hóa dữ liệu provider sang kiểu domain. Kiểu dữ liệu của Binance không ra khỏi adapter.
- Service chỉ import file interface, không import file adapter. Route và Controller không import `providers/`. `providers/` không import Express, `api/`, `services/`, `repositories/`, `database/`. Rule ESLint được thêm cùng lúc với folder.
- `index.ts` tạo adapter từ cấu hình và truyền qua `AppDependencies`, `ApiRouterDependencies` tới service. Integration test truyền provider giả lập theo cùng đường.

### Lý do

Folder `providers/` có interface cùng adapter tách Binance khỏi service bằng ít thành phần nhất. Composition root hiện có đã truyền dependency qua tham số, nên không cần thư viện DI. Provider giả lập kiểm được ranh giới mà không cần provider thật thứ hai.

### Hệ quả

- Đổi provider chỉ thay adapter và lựa chọn trong composition root [[10, Provider và cách thay thế]](#ref-10).
- Thêm một rule `no-restricted-imports` cho `providers/` trong `eslint.config.js`.
- Xét lại khi Worker cần dữ liệu thị trường, chẳng hạn cho backtest: chuyển interface và kiểu domain sang package có public API.

## ADR-004: Web tính MA của chart từ nến API trả về

**Status:** Accepted (2026-11-20)

### Bối cảnh

Mỗi chart hiển thị MA theo giá đóng cửa (MK-01). MA phủ mọi nến đang hiển thị khi lịch sử đủ (MK-24), tính cả nến đang mở với nhãn giá trị tạm (MK-28) và chỉ dùng nến có thật (MK-36) [[8, Xem lịch sử thị trường]](#ref-8). Chart chỉ hiển thị một số nến giới hạn (MK-33), nên mẫu MA của các nến đầu cần nến trước cửa sổ hiển thị. Chỉ báo dùng cho strategy thuộc `packages/engine`; engine chưa có MA.

### Phương án đã xét

| Phương án | Dễ hơn | Khó hơn |
| --- | --- | --- |
| Web tính MA; API trả thêm nến khởi động MA | Contract chỉ có nến; đổi tham số MA không đổi API; tooltip MA cùng nguồn với nến | Web tải thêm một ít nến; MA của chart và của strategy có thể là hai bản cài đặt |
| API tính MA và trả kèm nến | Một bản cài đặt có thể dùng `packages/engine` | Contract lớn hơn; mỗi tham số MA mới đổi API; vòng WebSocket phải gửi lại MA khi nến đang mở thay đổi |

### Quyết định

- API trả số nến hiển thị (MK-33) cộng số nến cần cho mẫu MA đầu tiên (MK-24). Contract đánh dấu được nến nào thuộc cửa sổ hiển thị.
- Web tính MA bằng hàm thuần, không I/O, từ toàn bộ nến nhận được; chart chỉ vẽ nến trong cửa sổ hiển thị.

### Lý do

MA trên Realtime chỉ phục vụ hiển thị và tính từ chính các nến Web đã có. Khi WebSocket cập nhật nến đang mở, Web tính lại MA tại chỗ mà không cần server gửi thêm dữ liệu.

### Rủi ro chấp nhận

MA trên chart và MA trong strategy có thể lệch nhau nếu hai bản cài đặt khác nhau.

### Hệ quả

- Contract nến có nến khởi động MA và cách phân biệt nến hiển thị.
- Xét lại khi `packages/engine` có chỉ báo MA cho strategy: Web dùng lại hàm của engine nếu dependency rules cho phép, để chart và strategy dùng cùng một cách tính.

## References

1. <a id="ref-1"></a>[Authentication](../UCs/authentication.md)
2. <a id="ref-2"></a>[Security](23-security.md)
3. <a id="ref-3"></a>[Project Brief](../UCs/sources/project-brief.md)
4. <a id="ref-4"></a>OWASP ASVS 5.0, V6 Authentication. <https://raw.githubusercontent.com/OWASP/ASVS/master/5.0/en/0x15-V6-Authentication.md>
5. <a id="ref-5"></a>OWASP ASVS 5.0, V7 Session Management. <https://raw.githubusercontent.com/OWASP/ASVS/master/5.0/en/0x16-V7-Session-Management.md>
6. <a id="ref-6"></a>OWASP ASVS 5.0, V3 Web Frontend Security. <https://raw.githubusercontent.com/OWASP/ASVS/master/5.0/en/0x12-V3-Web-Frontend-Security.md>
7. <a id="ref-7"></a>OpenID Connect Core 1.0 incorporating errata set 2. <https://openid.net/specs/openid-connect-core-1_0.html>
8. <a id="ref-8"></a>[Market Data](../UCs/market-data.md)
9. <a id="ref-9"></a>[Project Structure](../conventions/project-structure.md)
10. <a id="ref-10"></a>[Market Data & Realtime Updates](10-market-data.md)
11. <a id="ref-11"></a>[Quality Attributes](../UCs/quality-attributes.md)
