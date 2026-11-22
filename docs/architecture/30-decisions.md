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

## ADR-005: Số chữ số thập phân của pair là hằng số trong `packages/shared`

**Status:** Accepted (2026-11-20)

### Bối cảnh

Giá hiển thị theo số chữ số thập phân của pair, giá khác 0 không hiển thị thành 0 (MK-44) [[8, Xem lịch sử thị trường]](#ref-8). Danh sách pair là enum nhỏ trong `packages/shared`. Binance công bố bước giá (tick size) trong filter `PRICE_FILTER` của mỗi symbol trong `exchangeInfo`; theo tài liệu, mọi filter của symbol là optional [[12]](#ref-12).

### Phương án đã xét

| Phương án | Dễ hơn | Khó hơn |
| --- | --- | --- |
| Hằng số theo pair trong `packages/shared`, cùng danh sách pair | Không thêm request; Web dùng ngay khi render; test đơn giản | Phải cập nhật tay khi Binance đổi tick size hoặc khi thêm pair |
| Endpoint metadata đọc `exchangeInfo` qua provider | Luôn khớp sàn | Thêm endpoint, request và trạng thái lỗi; chart phải chờ metadata trước khi format giá |
| Suy từ chuỗi giá của provider | Không cần metadata | Chuỗi của Binance có số 0 thừa; giá trị không cho biết bước giá |

### Quyết định

Chọn hằng số theo pair. Giá trị lấy từ tick size trong `exchangeInfo` của Binance lúc build và ghi nguồn cạnh hằng số [[10, Quyết định]](#ref-10).

Giá trị tra ngày 2026-11-21 từ `GET /api/v3/exchangeInfo`, filter `PRICE_FILTER` [[12]](#ref-12). Product owner duyệt ngày 2026-11-21.

| Pair | `tickSize` | Số chữ số thập phân |
| --- | --- | --- |
| BTCUSDT | 0.01 | 2 |
| ETHUSDT | 0.01 | 2 |
| SOLUSDT | 0.01 | 2 |

Khi giá có nhiều chữ số hơn số chữ số của pair, Web làm tròn half-up lúc hiển thị: chữ số bỏ đi từ 5 trở lên thì làm tròn lên. Giá luôn hiển thị đủ số chữ số của pair, kể cả số 0 ở cuối. Quy tắc áp dụng cho mọi giá hiển thị: giá cuối, open/high/low/close và MA. Volume không phải giá, không theo quy tắc này. Ví dụ `100.125` hiển thị `100.13`, `153.6` hiển thị `153.60`, `68608` hiển thị `68,608.00`. Chỉ làm tròn khi hiển thị; giá trị domain không đổi. Product owner duyệt ngày 2026-11-21.

### Hệ quả

- Khi symbol không có `PRICE_FILTER`, người build chọn giá trị theo giá thực tế của pair và ghi lý do cạnh hằng số.
- Binance có thể đổi tick size của symbol. Hằng số không tự cập nhật. Giá trị chỉ đúng tại ngày tra; khi Binance đổi, cập nhật hằng số và ngày tra.
- Thêm pair phải thêm số chữ số thập phân cùng lúc; schema dùng chung bắt buộc mỗi pair có giá trị.
- Xét lại khi danh sách pair do người dùng chọn tự do, hoặc khi thêm provider có bước giá khác Binance.

## ADR-006: Cache Market Data trong process API, không lưu vào PostgreSQL

**Status:** Accepted (2026-11-20)

### Bối cảnh

Mỗi chart hiển thị tối đa 500 nến gần nhất (MK-33). Vòng REST không tự cập nhật chart (MK-27) [[8, Xem lịch sử thị trường]](#ref-8). Binance giới hạn request weight theo IP và khóa IP khi client tiếp tục gửi request sau 429 [[13]](#ref-13). Không có cache, số request tới Binance tăng theo số lần mở Realtime. API chạy một instance trên VPS. Project chỉ thêm Redis khi đo được bottleneck.

### Phương án đã xét

| Phương án | Dễ hơn | Khó hơn |
| --- | --- | --- |
| Cache trong process API, TTL ngắn, decorator quanh provider | Không thêm hạ tầng; mức trần request tới Binance cố định theo số khóa; Service và adapter không đổi | Mất khi khởi động lại; mỗi instance có cache riêng |
| Lưu nến vào PostgreSQL, đồng bộ từ Binance | Giữ được lịch sử dài cho backtest; ít phụ thuộc Binance khi đọc | Cần job đồng bộ, lấp khoảng trống và đối soát với nguồn (MK-35, MK-51); nến đang mở vẫn phải lấy từ Binance |
| Redis dùng chung | Cache chung cho nhiều instance | Thêm dịch vụ khi chưa có số đo cần nó |
| Không cache | Đơn giản nhất | Số request tới Binance tăng theo số người dùng; dễ chạm giới hạn IP |

### Quyết định

Chọn cache trong process API với TTL 5 giây, gộp request trùng và không cache lỗi. Decorator cài `MarketDataProvider` và được bọc ở composition root [[10, Cache và giới hạn request]](#ref-10). Không lưu Market Data vào PostgreSQL ở vòng REST.

### Hệ quả

- Khi provider trả thành công, Binance nhận tối đa 504 weight mỗi phút từ một instance [[10, Cache và giới hạn request]](#ref-10). Lỗi không được cache, nên khi Binance lỗi, số lời gọi tăng theo số lần thử lại.
- Dữ liệu có thể cũ tới 5 giây; `dataTime` cho biết thời điểm thật của dữ liệu (MK-27).
- Xét lại khi chạy hơn một instance API, khi backtest cần dữ liệu thị trường dài hạn, hoặc khi vòng WebSocket đổi cách lấy nến đang mở.

## ADR-007: Web làm mới định kỳ bằng cách tải lại toàn bộ cửa sổ nến qua endpoint lịch sử

**Status:** Proposed

### Bối cảnh

Vòng cập nhật định kỳ cho chart và sidebar tự làm mới theo chu kỳ (MK-63, MK-64), giữ tối đa 500 nến gần nhất (MK-67) và không thay dữ liệu bằng dữ liệu cũ hơn (MK-79) [[8, Theo dõi cập nhật định kỳ]](#ref-8). Vòng này là baseline để so sánh độ mới dữ liệu, request upstream và lưu lượng với WebSocket. Baseline không được dựng yếu chỉ để tạo mức cải thiện [[14]](#ref-14). Endpoint lịch sử nến, cache 5 giây trong API và mức trần request Binance theo số khóa đã có từ vòng tải lịch sử (ADR-006) [[10, Cache và giới hạn request]](#ref-10).

### Phương án đã xét

| Phương án | Dễ hơn | Khó hơn |
| --- | --- | --- |
| Web gọi lại endpoint lịch sử theo chu kỳ, nhận lại toàn bộ cửa sổ nến | Không đổi contract và API. Mỗi lần làm mới đã đủ 500 nến và nến khởi động MA, nên không có bước nối nến hay bù khoảng trống. MA tính lại cùng cách với lần tải đầu (ADR-004) | Mỗi lần làm mới nhận lại cả cửa sổ, nên lưu lượng mỗi client lớn |
| Web gọi endpoint mới chỉ trả các nến từ nến đang mở trở đi, rồi nối vào dữ liệu đang có | Lưu lượng nhỏ | Thêm endpoint và contract. Web phải nối nến, bỏ nến cũ nhất và tính lại MA. Sau khi tab ẩn lâu hoặc mất mạng, Web phải tự phát hiện khoảng trống và tải lại cả cửa sổ |
| Chu kỳ riêng theo timeframe | Ít request cho timeframe lớn | Nến đang mở của timeframe lớn vẫn đổi giá theo từng giao dịch; thêm giá trị cần chốt (OQ-086) |
| Server đẩy dữ liệu (SSE hoặc WebSocket) | Độ mới tốt hơn | Thuộc vòng WebSocket; không còn là baseline polling |

### Quyết định

- Mỗi chart và sidebar là một query riêng của TanStack Query, như vòng tải lịch sử. Khi cập nhật đang bật, query đặt `refetchInterval` bằng chu kỳ làm mới (MK-63, MK-64) và không làm mới khi tab ẩn (MK-76).
- Lần làm mới gọi cùng endpoint lịch sử nến và summary, không đổi contract [[15, Endpoint Market Data]](#ref-15).
- Chu kỳ là một hằng số cho mọi timeframe, đặt bằng TTL cache của API.

### Lý do

Toàn bộ cửa sổ có sẵn trong cache của API, nên chu kỳ bằng TTL không làm tăng request tới Binance (ADR-006). Tải lại cả cửa sổ loại bỏ lỗi nối nến, giữ đúng các rule nến đã kiểm ở vòng tải lịch sử (MK-51, MK-52) và không cần cơ chế bù khoảng trống riêng cho polling.

### Rủi ro chấp nhận

Response lịch sử nến của smoke Binance có 519 nến, khoảng 64 KB JSON chưa nén [[16]](#ref-16). Source của API không có middleware nén response. `Inferred`: 4 chart làm mới mỗi 5 giây nhận khoảng 3 MB mỗi client mỗi phút. Số đo thật thuộc tài liệu kiểm chứng polling.

### Hệ quả

- Request từ browser tới API tăng theo số client: mỗi client có 4 chart và 1 sidebar, mỗi query làm mới một lần mỗi chu kỳ.
- So sánh lưu lượng giữa polling và WebSocket phải ghi rằng polling tải lại toàn bộ cửa sổ. Khi dòng CV về lưu lượng dùng so sánh này, cần kèm điều kiện đó, hoặc thêm phương án chỉ tải nến mới và đo lại.
- Xét lại khi lưu lượng đo được là bottleneck, hoặc khi OQ-086 chốt chu kỳ khác nhau theo timeframe.

## ADR-008: Cache Market Data trong process API, giữ cả lỗi nguồn trong thời gian sống của cache

**Status:** Proposed

### Bối cảnh

ADR-006 chọn cache trong process API với TTL 5 giây và không cache lỗi. Lý do không cache lỗi là thao tác thử lại của chart (MK-12) gọi lại nguồn ngay. Ở vòng tải lịch sử, lỗi chỉ dẫn tới lời gọi mới khi người dùng bấm thử lại. Ở vòng cập nhật định kỳ, mỗi client tự làm mới sau mỗi chu kỳ (MK-63, MK-64) [[8, Theo dõi cập nhật định kỳ]](#ref-8). Khi Binance lỗi, single-flight chỉ gộp các lời gọi đồng thời, nên số lời gọi tới Binance tăng theo số client. `Inferred`: với 50 client, mỗi client 5 query làm mới mỗi 5 giây, API có thể gọi Binance khoảng 3000 lần mỗi phút, tức 6000 weight, bằng giới hạn theo IP [[13]](#ref-13). Cooldown 429/418 của adapter chỉ chặn sau khi đã chạm giới hạn. QA-13 yêu cầu mức trần weight không đổi cả khi Binance lỗi [[11, Scalability và Performance]](#ref-11).

### Phương án đã xét

| Phương án | Dễ hơn | Khó hơn |
| --- | --- | --- |
| Giữ ADR-006, chỉ dựa vào cooldown 429/418 | Không đổi code cache; thử lại của người dùng gọi nguồn ngay | Số lời gọi tăng theo số client tới khi Binance trả 429; không đạt QA-13 khi Binance lỗi |
| Decorator giữ lỗi nguồn theo khóa trong cùng TTL với kết quả thành công | Mức trần weight giống khi thành công, không phụ thuộc số client. Logic nằm ở một chỗ, không phụ thuộc cách client làm mới | Thử lại của người dùng trong TTL nhận lại cùng lỗi, tối đa 5 giây |
| Web giãn chu kỳ sau mỗi lần làm mới lỗi (backoff) | API không đổi | Chu kỳ người dùng thấy thay đổi khi lỗi; tải lên Binance vẫn phụ thuộc hành vi của từng client |

### Quyết định

Giữ mọi phần của ADR-006, trừ quy tắc không cache lỗi. Decorator giữ kết quả lỗi nguồn không khả dụng và lỗi dữ liệu nguồn sai theo khóa, trong cùng TTL, tính từ lúc provider bên trong reject. Lỗi không lường trước không được giữ. Request cùng khóa trong TTL nhận lại lỗi đó mà không gọi provider.

### Lý do

Phương án này giữ mức trần weight ở một nơi mà mọi client đi qua, nên tải lên Binance không phụ thuộc số client hay cách client làm mới. Chu kỳ làm mới người dùng thấy không đổi khi lỗi.

### Rủi ro chấp nhận

Sau khi Binance phục hồi, chart có thể còn báo lỗi thêm tối đa một TTL cộng một chu kỳ làm mới.

### Hệ quả

- Khi ADR-008 được chấp nhận, ADR-006 chuyển sang `Superseded by ADR-008` và mục cache trong thiết kế Market Data đổi theo.
- Mức trần weight của Binance khi lỗi bằng mức trần khi thành công [[10, Giới hạn request của Binance]](#ref-10).
- Xét lại cùng các điều kiện của ADR-006, hoặc khi thời gian báo lỗi thêm sau phục hồi làm người dùng khó chịu.

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
12. <a id="ref-12"></a>Binance Spot API, General endpoints, Exchange information, đọc ngày 2026-11-20. <https://developers.binance.com/docs/binance-spot-api-docs/rest-api/general-endpoints>
13. <a id="ref-13"></a>Binance Spot API, General API Information (Limits) và response của `GET /api/v3/exchangeInfo?symbol=BTCUSDT`, đọc ngày 2026-11-20. <https://developers.binance.com/docs/binance-spot-api-docs/rest-api/limits>
14. <a id="ref-14"></a>[Market Data sẽ thêm dòng nào vào CV?](../build/01-prototype-to-implementation/market-data/cv-goal.md)
15. <a id="ref-15"></a>[API Contracts](22-api-endpoints.md)
16. <a id="ref-16"></a>Evidence smoke Binance: [`reconciliation.json`](../testing/evidence/market-data/rest-v1-binance-smoke/reconciliation.json), mảng `candles` có 519 phần tử, 63.992 byte khi serialize JSON
