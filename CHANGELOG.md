# Changelog

Các thay đổi đáng chú ý về sản phẩm, kiến trúc và quy trình phát triển.

## [Unreleased]

- Test trước build REST Market Data đã green qua Bước 08 Task 5: shared contract, provider/service, Binance adapter, cache decorator, HTTP/session và flow UI qua API thật. Task 6 đã kết thúc thu số liệu; QA-10/QA-11 và capacity là Inconclusive.

### Changed

- Bước 08 Task 8: requirements và thiết kế REST polling. Use case Theo dõi cập nhật định kỳ có rule MK-63 đến MK-85, gồm chu kỳ 5 giây, tạm dừng theo WCAG 2.2 SC 2.2.2, tab ẩn, làm mới lỗi giữ dữ liệu và giữ vùng xem. Thêm QA-12 (độ mới) và QA-13 (request tới Binance), ADR-007 (polling tải lại toàn bộ cửa sổ) và ADR-008 (giữ lỗi nguồn trong TTL), OQ-086. Product owner duyệt các giá trị và hai ADR ngày 2026-11-22; ADR-006 chuyển sang Superseded by ADR-008, OQ-085 Resolved.

- Bước 08 Task 7: chốt tài liệu REST tải lịch sử. Kiểm chứng REST có mục kết quả theo từng requirement, gồm suite và commit của lượt chạy, mutation, kiểm trên trình duyệt, baseline, smoke Binance và phần chưa kiểm. Kiến trúc ghi Market Data REST đã triển khai, timeout API 5000 ms, chính sách path trong log HTTP và rủi ro từ baseline. Các rule thiếu evidence (MK-30, MK-32, MK-37, MK-41, MK-43, MK-45, MK-46, MK-62, QA-09) ghi phần Inconclusive. Thời gian mở Realtime và đổi timeframe (QA-10, QA-11) và capacity vẫn Inconclusive.

- Hoàn tất Task 6: lưu 18 lượt API mô tả, chín lượt micro được chọn và mười lượt UI đầy đủ (720 thao tác chính). Giữ riêng các lượt bị dừng và lỗi. QA-10/QA-11 vẫn Inconclusive vì apply chưa chứng minh canvas paint; capacity chưa có ngưỡng. Evidence có summary JSON, manifest, raw samples, reconciliation và hash gzip.


- Baseline REST Task 6: product owner chọn giữ 18 lượt API làm số liệu mô tả do giới hạn wall clock. Ba lượt timeframe-cold v3 đủ 100 mẫu mỗi lượt, không có mẫu lỗi. Lượt timeframe-hot v3 dừng sau tám mẫu chính vì chuẩn bị chart gặp provider timeout/503. Runner thêm `--hot-tail` để đo đủ hai profile phụ còn thiếu trong cohort v4, giữ nguyên lượt bị dừng.

- Bước 08 Task 6: thêm harness đo REST với HTTP replay qua Binance adapter, oracle OHLCV/MA riêng, k6, tổng hợp nearest-rank và User Timing tại mốc apply của chart. Cohort v2 đã chạy 18 lượt API, chín lượt micro và ba lượt UI open-cold. API default/50 có timeout và response 503. Hai lượt UI có Auth 429. Cohort v3 bổ sung kiểm tuổi cache prime và phục hồi Auth trong bước chuẩn bị. Mốc apply chưa chứng minh canvas đã vẽ. Native HTTP timing của k6 dùng wall clock, chưa đáp ứng yêu cầu clock đơn điệu.

- Công cụ đo REST: bỏ phụ thuộc thứ tự key khi đối chiếu JSON trong k6, giữ path gốc để ghi reconciliation qua router và bắt buộc probe k6 trước phát tải. Cohort v1 bị hủy vì lỗi harness. Smoke Binance một lượt đã đối chiếu khớp 518 nến đóng và summary, có header quota.

- Bước 08 Task 5: Realtime đọc dữ liệu qua API thật với mặc định 5m/15m/1h/4h, không còn Load history và sidebar không còn MA/volume. Chart có hạn chờ 10 giây, phiên hết hạn chuyển sang màn chặn đăng nhập, status luôn có trong DOM để thông báo trạng thái, mô tả bằng chữ, nhãn nến đang mở và MA tạm, thời điểm dữ liệu, múi giờ thiết bị, đọc nến và zoom bằng bàn phím, nến tăng rỗng ruột. Retry giữ focus. Giá format theo số chữ số của pair (ADR-005). E2E REST từ 11 lên 24 test. Có ảnh kiểm trên trình duyệt. Screen reader không kiểm theo quyết định của product owner.

- Bước 08 Task 4: nối hai endpoint Market Data qua service và provider có cache. Kiểm phiên Better Auth trước query, trả mã lỗi theo contract và `Cache-Control: no-store`. Log HTTP có method/path/status/duration, che token trong path Auth, bỏ path không có route, header phiên, query và message lỗi ngoài dự kiến. Thêm test log, reset callback và response 503.

- Bước 08 Task 3: thêm cache decorator theo pair/timeframe/limit và namespace summary. TTL tính từ lúc provider trả thành công, gộp request đang chờ, không cache lỗi và giữ snapshot khi hit. Cache còn hạn vẫn trả dữ liệu trong cooldown Binance. Thêm test vòng đời summary và log hit/miss/join.

- Bước 08 Task 2: thêm interface provider, service kiểm snapshot và Binance adapter có timeout, mapping OHLCV/summary, phân loại lỗi và cooldown. Thêm ba rule ESLint kiểm ranh giới provider, nơi đọc biến môi trường API và production import testware.

- Bước 08 Task 1: chuyển contract REST Market Data sang snapshot có `isClosed`, `warmupCount`, `dataTime` và timeframe `1d`. Web tính MA(20), ẩn nến warm-up và hiển thị giá đủ hai chữ số. Shared Market Data 116 test, Web logic 10 test, UI mock 9 test và MSW 1 test đạt tại mốc Task 1.

- Chốt các quyết định còn Proposed của Bước 07 Market Data. TTL cache tính từ lúc provider trả kết quả thành công và hết hạn khi đủ 5 giây. API kiểm phiên trước query. Ba pair có tick size 0.01. Mọi giá hiển thị, gồm OHLC và MA, làm tròn half-up và luôn đủ 2 chữ số. Provider trả vượt limit và payload không parse được trả 502. Workload baseline, công cụ `k6` và ngưỡng QA-10/QA-11 kèm điều kiện kết luận đã được duyệt. Test mới và expected giá đã sửa đang red vì chưa có code production.

### Added

- Bốn file Knowledge rút từ Bước 08 Task 5: vòng đời fetch của TanStack Query v5, test deadline bằng clock của Playwright, status và mô tả cho công nghệ hỗ trợ, lỗi khi dùng mutation để chứng minh test. Mỗi nhận định trích source của phiên bản đang dùng, docs chính thức hoặc evidence của Task 5, hoặc mang nhãn `Inferred`/`Agent đề xuất`.
- Tầng Knowledge trong `docs/knowledge/` cho kiến thức có nguồn thu được khi làm dự án, kèm convention `docs/conventions/knowledge.md`. `check:docs` kiểm dòng mục đích và References của folder này. File đầu tiên ghi anti-pattern khi code dựa trên test có sẵn, theo ImpossibleBench, METR và danh mục TDD anti-pattern của James Carr. Kế hoạch Bước 08 trích file này thay cho bản chép.
- Kế hoạch Bước 08 Market Data: build REST tải lịch sử theo năm lát red → green, đo baseline, chốt tài liệu, rồi build REST polling. Mỗi Task kết thúc bằng commit. Ba quyết định vận hành đã được duyệt khi bắt đầu Task 6: cài `k6`, smoke Binance thật và lưu evidence. Plan nêu anti-pattern khi code dựa trên test có sẵn, bốn loại sửa test được phép, testware Market Data chỉ đọc mặc định và rule ESLint chặn code chỉ phục vụ test. Product owner quyết định không dùng screen reader ở Bước 08. Accessibility chỉ kiểm ở mức khai báo bằng Playwright, có ghi các điểm lệch Playwright không phát hiện được và cách giảm. Code đã được build qua Task 5.
- Protocol baseline REST Market Data cho Task 3 của Bước 07: định nghĩa phép đo, cache rỗng/hit/single-flight, workload đề xuất, replay/smoke và evidence chạy lại. Workload và ngưỡng QA-10/QA-11 đã được duyệt. Task 6 đã thu số liệu với giới hạn kết luận ghi trong execution. Chưa xác nhận capacity.
- Thiết kế kiểm chứng REST Market Data cho Task 2 của Bước 07: ma trận requirement/kịch bản/evidence, partitions và biên, fixture với expected literal, cache/cooldown, E2E/accessibility, log và mutation dự kiến. Kết quả test trước build ghi riêng ở Task 4.
- Test basis REST Market Data, đối chiếu sáu SC WCAG, sáu interface kiểm thử được product owner duyệt và khảo sát harness từ source cho Task 1 của Bước 07. Kết quả đo sau build nằm trong execution Bước 08 Task 6.
- Frontend Realtime dùng HTTP mock: pair chung, 1/2/4 chart với timeframe riêng, nến, volume, MA(20), giá/thay đổi 24h và sidebar. Các chart có trạng thái đang tải, rỗng, lỗi và thử lại riêng.
- Schema HTTP nháp cho Market Data, fixtures tất định và MSW handlers. Browser suite riêng kiểm UI mock và worker thật, gồm responsive, bàn phím, accessibility và dữ liệu cũ đến sau.
- Bản nháp use case Market Data, câu hỏi mở, kế hoạch và bằng chứng hoàn thành Bước 2. API contract production chưa được chốt.
- Requirements Market Data cho vòng REST tải lịch sử: rule đã chốt cho nến đang mở, MA, volume, sidebar, timeframe, lựa chọn mặc định, 500 nến mỗi chart, exception flow và accessibility, kèm gap analysis với hai baseline độc lập. Ngưỡng hiệu năng REST còn Proposed.
- Test scope TS-002 Market Data kiểm thử theo increment REST, REST polling, WebSocket, không dùng template STLC; mỗi increment có file phân tích requirements.
- Thiết kế Market Data cho vòng REST: thành phần Web, API, Market Data Service và provider, luồng tải lịch sử, phân loại lỗi và log để phân biệt lỗi upstream, backend, client. ADR-003 đặt adapter dữ liệu thị trường trong layer `providers/` của API; ADR-004 để Web tính MA từ nến API trả về. Chưa triển khai code.
- Contract nến và API REST cho Market Data: kiểu nến domain có nến đang mở, nến khởi động MA và thời điểm dữ liệu, quy tắc chuẩn hóa từ Binance, hai endpoint yêu cầu phiên và năm mã lỗi. ADR-005 đặt số chữ số thập phân của pair là hằng số trong `packages/shared`. Chưa triển khai code.
- Thiết kế cache Market Data cho vòng REST: không lưu nến vào PostgreSQL, cache 5 giây trong process API qua decorator của provider, gộp request trùng, không cache lỗi, dừng gọi Binance theo `Retry-After` khi bị giới hạn. ADR-006 ghi trade-off và điều kiện xét lại. Chưa triển khai code.
- Trạng thái `Dropped` cho rule bị bỏ trong `docs/UCs/`, được `check:docs` chấp nhận.
- Monorepo TypeScript strict với React Router, Express, worker pg-boss, shared schemas và strategy/backtest engine; PostgreSQL chạy bằng Docker Compose.
- Landing page có SEO metadata, giao diện responsive và trang 404; design tokens, font self-host, hỗ trợ bàn phím và reduced motion.
- Authentication với Better Auth: email/password, xác minh email, reset password, Google OAuth tùy cấu hình và cookie session; gửi email qua Resend. Giao diện Auth có validation, error summary và kiểm soát đích redirect nội bộ.
- Bộ test Auth gồm component, integration trên PostgreSQL và E2E Playwright. E2E dùng hai môi trường có/không có Google, database riêng và email console, tách khỏi môi trường dev.
- CI chạy kiểm tra chất lượng, build và integration test; E2E chạy cho pull request vào `main`.
- Quality gates trong `pnpm check`: typecheck, lint, kiểm dependency/layer boundaries, chất lượng testware, export thừa, tài liệu và formatting. Testware phải có assertion, kiểm kết quả độc lập với implementation và chỉ mock tại boundary.
- Bộ template và skills cho sáu phase STLC, test strategy và test scope Authentication (TS-001). Vòng 1 chưa đạt exit criteria, còn 19 defect Open; chưa đóng scope, cần sửa lỗi và chạy vòng 2. Chi tiết trong [Test Summary](docs/testing/test-scopes/TS-001-auth/06-report/output/01-test-summary-report.md).
- Nguồn skills chung tại `.agents/skills/`, đồng bộ sang Claude và Codex bằng `pnpm skills:sync`; Graphify hỗ trợ tra cứu quan hệ code.
- Thêm skills Better Auth (hướng dẫn chung, bảo mật, tạo auth, email/password, organization, 2FA) và skill review UI; bỏ skill `diagnosing-bugs`.

### Changed

- Bước 08 Task 1: chuyển contract REST Market Data sang snapshot có `isClosed`, `warmupCount`, `dataTime` và timeframe `1d`. Web tính MA(20), ẩn nến warm-up và hiển thị giá đủ hai chữ số. Shared Market Data 116 test, Web logic 10 test, UI mock 9 test và MSW 1 test đạt. Các lát provider/service/API chưa build.

- Bàn giao Bước 08 cho REST Market Data: sáu interface đã duyệt, thứ tự red → green, fixture/oracle, evidence còn thiếu, gate mutation/fake và điều kiện chạy baseline. Tài liệu bàn giao đã được review độc lập. Trạng thái hoàn thành Bước 07 có hiệu lực khi commit riêng Task 5 thành công. Workload, ngưỡng và quyết định chưa duyệt giữ Proposed. Chưa hoàn tất TDD hoặc đo baseline.
- Kế hoạch Market Data viết test tự động sau khi chốt cách kiểm chứng và trước khi build từng increment.
- Tổ chức yêu cầu sản phẩm trong `docs/UCs/`, bắt đầu với Authentication; kiến trúc ghi cơ chế và tham chiếu requirement ID. Tám quality attribute scenario chuyển sang `Confirmed` theo ủy quyền của product owner ngày 2026-11-20; cột Nguồn ghi lý do từng số đo để product owner có thể phủ quyết.
- Tập trung conventions cho code, testware và tài liệu tại `docs/conventions/`; `AGENTS.md` hướng dẫn khi nào đọc và dùng từng quy tắc. Thêm skills viết use case, architecture và review thay đổi.
- Chốt baseline bảo mật OWASP ASVS 5.0 L1 cùng một số mục L2 và rủi ro chấp nhận trong [ADR-002](docs/architecture/30-decisions.md). Requirement Auth và gap analysis nằm trong [Authentication](docs/UCs/authentication.md); các gap chưa được coi là đã triển khai.
- Dùng `docs/design/prototype/` làm design reference duy nhất, thay các design board và ảnh mockup cũ; tập trung câu hỏi chưa chốt trong `docs/open-questions.md`.
- Prototype cải thiện accessibility và mobile: quản lý focus trong dialog, skip link, error summary, giữ bản nháp strategy và cảnh báo thay đổi Settings chưa lưu; bổ sung trạng thái lỗi tải, dữ liệu cũ và offline.
- Codex chạy hook `PostToolUse` trong `.codex/hooks.json`, gọi `scripts/lint-codex-edits.mjs` để dùng chung bộ kiểm ESLint và tài liệu với Claude khi sửa file.
- Viết lại tài liệu kiến trúc toàn hệ thống theo câu hỏi của người đọc: `00-system.md` và `20`–`23` nêu thành phần, vòng đời trạng thái, dữ liệu, contract và bảo mật đã triển khai; `docs/conventions/architecture.md` cho phép chọn và sắp xếp section theo chủ đề thay vì khung cố định.
- Comment trong code trỏ tới requirement ID của [Authentication](docs/UCs/authentication.md) để truy vết từ code về yêu cầu. `pnpm check:docs` kiểm ID đã cấp không biến mất và comment không trích ID không tồn tại; CI checkout hai commit để có baseline so sánh.
- `AGENTS.md` thêm mục `Kiểm chứng theo thay đổi`: agent chọn tập kiểm tra nhỏ nhất đủ kiểm chứng thay đổi và các phần bị ảnh hưởng, chỉ chạy `pnpm check` khi người dùng yêu cầu rõ lệnh này. `pnpm check` giữ vai trò kiểm tra toàn repo cho người dùng và CI; skills `correct` và `review-change` theo cùng quy tắc.

### Fixed

- Continue with Google luôn hiện màn chọn tài khoản: URL nhà cung cấp thêm `prompt=select_account`, nên Sign out chỉ kết thúc phiên Crypto Force và lần đăng nhập sau không ngầm dùng lại tài khoản Google đang mở.
- Playwright `--list` không ghi đè kết quả và báo cáo của lần chạy trước.
- Vite tối ưu dependency và biên dịch trước route để tránh reload trang khi cache trống.
