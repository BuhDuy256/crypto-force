# Kết quả build REST Market Data

Đọc file này để biết kết quả thực chạy và phần còn lại của Bước 08.

## Task 6: Kết quả baseline REST

### Kết quả cuối Task 6

Đã kết thúc các lượt đo được chọn. Công cụ v1/v2/v3/v4 được commit trước lượt đo tương ứng tại `aa22312`, `738e780`, `f8d760f` và `1fededf`. Evidence tổng hợp nằm tại [task-06-summary.json](../../../../../testing/evidence/market-data/task-06-summary.json). Từng thư mục run giữ config, manifest, commands, samples, reconciliation, upstream và resource log. Sáu file gzip đã được giải nén và đối chiếu cả raw SHA256 lẫn gzip SHA256. Không có file chưa nén vượt 5.000.000 byte trong các cohort v2–v4.

Môi trường: Windows local, Web production build, replay HTTP có delay 50 ms, một API instance. API, replay, generator/browser và PostgreSQL cùng host. Kết quả không thay phép đo trên VPS. Chưa đo riêng RTT hoặc CPU/RAM của Chromium. Resource log chưa tách được nguyên nhân tranh chấp tài nguyên.

API có 47.245 request được gán steady theo thời điểm bắt đầu burst, không gồm warm-up. Có 2.446 request lỗi, đều nằm ở default/50. Đây là tổng 18 lượt request steady trong JSON, không gồm cohort v1 bị hủy. Request thuộc burst steady có thể hoàn tất sau cửa sổ steady. Latency HTTP chỉ mô tả theo quyết định clock của product owner. Percentile tách endpoint/cache/outcome nằm trong `api[].groups` của JSON và summary từng run. Không gộp hoặc lấy trung bình percentile giữa lần lặp.

| Cohort / client | Request steady lần 1 / 2 / 3 | Request lỗi lần 1 / 2 / 3 |
| --- | --- | --- |
| default / 1 | 145 / 145 / 145 | 0 / 0 / 0 |
| default / 10 | 1400 / 1350 / 1400 | 0 / 0 / 0 |
| default / 50 | 3805 / 5800 / 7040 | 2340 / 106 / 0 |
| diverse / 1 | 145 / 145 / 145 | 0 / 0 / 0 |
| diverse / 10 | 1450 / 1450 / 1450 | 0 / 0 / 0 |
| diverse / 50 | 7095 / 7050 / 7085 | 0 / 0 / 0 |

Micro được chọn có 900 batch và 3.600 request đo: 3 × 100 miss + 3 × 100 hit + 3 × 100 × 10 single-flight. Mỗi batch single-flight có một upstream call và chín join. Cả 900 batch đúng trạng thái, toàn bộ 3.600 mẫu hợp lệ. Ba lượt hit v2 được giữ riêng, không trộn với hit v3. Các số p95 dưới đây dùng clock đơn điệu Node, làm tròn một chữ số để trình bày.

| Trạng thái / cohort | Mẫu thành công mỗi lần lặp | p95 ms lần 1 / 2 / 3 | Failure |
| --- | --- | --- | --- |
| miss / v2 | 100 | 153.8 / 138.2 / 121.8 | 0 |
| hit / v3 | 100 | 28.9 / 26.0 / 26.7 | 0 |
| single-flight / v2 | 1000 | 319.6 / 296.0 / 541.0 | 0 |

UI được chọn có 720 thao tác chính: 2 × 3 × 100 cho hai flow chính, cộng 4 × 30 cho lượt phụ. Loại 50 warm-up của mười lượt đầy đủ, ba warm-up của lượt v2 bị dừng, và năm warm-up cùng tám mẫu chính của lượt v3 bị dừng khỏi bảng này. Hai lỗi trong bảng thuộc open-cold v2, cùng có Auth 429. Cả hai mẫu lỗi vẫn nằm trong mẫu số 100 của lần lặp. Percentile chỉ tính mẫu hợp lệ. Mốc cuối là apply một chart khi đổi timeframe, hoặc đủ bốn chart khi mở/đổi pair.

| Lượt UI | Mẫu chính | Lỗi | p50 / p95 / p99 apply đủ chart, ms |
| --- | --- | --- | --- |
| rest-v2-ui-open-cold-1 | 100 | 1 | 450.3 / 760.6 / 2016.7 |
| rest-v2-ui-open-cold-2 | 100 | 1 | 471.8 / 830.5 / 2167.3 |
| rest-v2-ui-open-cold-3 | 100 | 0 | 584.2 / 1222.7 / 1505.0 |
| rest-v3-ui-timeframe-cold-1 | 100 | 0 | 362.9 / 413.1 / 439.8 |
| rest-v3-ui-timeframe-cold-2 | 100 | 0 | 368.7 / 410.5 / 441.6 |
| rest-v3-ui-timeframe-cold-3 | 100 | 0 | 363.1 / 409.2 / 438.6 |
| rest-v3-ui-pair-cold-1 | 30 | 0 | 472.6 / 601.8 / 687.1 |
| rest-v3-ui-open-hot-1 | 30 | 0 | 194.2 / 243.3 / 300.3 |
| rest-v4-ui-timeframe-hot-1 | 30 | 0 | 369.6 / 400.7 / 403.5 |
| rest-v4-ui-pair-hot-1 | 30 | 0 | 481.2 / 574.4 / 603.1 |

Tất cả response HTTP 200 đã ghi reconciliation trong v2–v4 đều hợp lệ. Phạm vi kiểm server này gồm chuẩn bị, warm-up, lượt chính và lượt bị dừng. Với API, mọi sample client thành công đều có reconciliation hợp lệ. Phép ghép request ID phía UI chỉ kiểm các mẫu chính hợp lệ của profile đầy đủ v3/v4 được chọn. Mọi ID trong body của các mẫu đó ghép được tới reconciliation hợp lệ. UI v2 chưa có ID phía browser, nên chỉ kiểm oracle tại browser và ledger server riêng. Chưa có bằng chứng từng canvas đã paint. **QA-10 và QA-11: Inconclusive. Capacity: Inconclusive.** Không có ngưỡng HTTP latency, lỗi hoặc capacity được duyệt.

Smoke Binance đúng một lượt đã đối chiếu 518 nến đóng và summary, có header quota. Không có load test hoặc retry Binance thật. Các lượt bị hủy, lỗi và thay đổi harness được giữ ở các mục dưới.

### Kết quả cohort v2 và chuẩn bị cohort v3

Cohort v2 dùng công cụ đo tại commit `738e780`. Đã chạy đủ 18 lượt API và chín lượt micro. Ba lượt UI open-cold đã kết thúc. Lượt timeframe-cold đầu tiên dừng sau ba thao tác warm-up, chưa có mẫu chính. Thư mục evidence giữ lượt này với nhãn không đủ điều kiện baseline.

API default/50 có lỗi và độ biến thiên lớn. Hai lần lặp đầu có 2340/3805 và 106/5800 request steady thất bại. Lần thứ ba có 0/7040. Không gộp các lần lặp để che lỗi. Log reconciliation của lần đầu có response 503 và request không ghép được với mẫu client. Các số này chưa chứng minh response 200 có giá sai. CPU, RAM, event loop và pool dùng chung máy với generator. Chưa thể quy nguyên nhân cho riêng API hoặc generator.

Micro hit lần một có một batch trả HTTP 200 nhưng snapshot khác prime. Batch đó phát sinh một upstream miss. Hai failure trong summary gồm một sample sai snapshot và một vi phạm trạng thái batch. Đây không phải hai lỗi transport. Hai lượt hit còn lại, ba lượt miss và ba lượt single-flight không ghi nhận failure.

UI open-cold lần một lỗi sample 95, lần hai lỗi sample 91. Mỗi lỗi trùng một response Auth 429. Lần ba có 100/100 mẫu hợp lệ. Mảng body/apply rỗng trong hai mẫu lỗi không chứng minh browser chưa phát request. Công cụ v2 chưa ghi request start. Mốc apply không chứng minh draw, nên QA-10/QA-11 vẫn là `Inconclusive`.

Source Better Auth `1.7.25` trong `dist/api/rate-limiter/index.mjs` cập nhật `lastRequest` sau request được phép. Cấu hình hiện tại dùng database. Giá trị mặc định là window 10 giây và max 100. Chuỗi thao tác liên tục có thể chạm giới hạn này. Harness không sửa cấu hình Auth production.

Cohort v3 thay đổi bước chuẩn bị. Nếu Auth trả 429 trước thao tác được đo, runner chờ theo `X-Retry-After` rồi reload một lần. Runner phải thấy đủ bốn chart trước khi bắt đầu đo. Nếu 429 xảy ra trong thao tác được đo, mẫu vẫn lỗi và không retry. Runner ghi request start, server request ID, snapshot time và ảnh của mẫu lỗi.

Micro hit v3 kiểm tuổi snapshot prime trước khi đo. Guard 1000 ms lấy từ think time 6000 ms trừ TTL 5000 ms. Khi tuổi prime đạt 4000 ms, runner chờ 6000 ms rồi prime lại. Runner ghi thao tác chuẩn bị riêng. TTL production và số mẫu chính không đổi. Ba lượt hit v3 được giữ riêng với các lượt v2.

Bốn test helper đã pass. Bốn mutant làm assertion fail: dùng prime gần hết hạn, prime lại không cần thiết, bỏ chờ header Auth và bỏ chờ chart sẵn sàng. Sau khi khôi phục, cả bốn test pass. Preflight trên browser production với Auth thật cũng kiểm bước phục hồi sau 429. Preflight không cung cấp mẫu latency baseline.

Source k6 `v2.4.0`, `lib/netext/httpext/tracer.go`, dùng `time.Now().UnixNano()` cho HTTP timing. Vì vậy các giá trị latency API v2 chỉ mang tính mô tả. Chúng chưa đáp ứng yêu cầu clock đơn điệu. Mô tả clock chung trong manifest v2 đã ghi quá mức bằng chứng. Manifest giữ mô tả cũ trong `clockErratum`. Raw và percentile vẫn được giữ nguyên.

**Quyết định product owner, 2026-11-21:** giữ 18 lượt API làm số liệu mô tả và ghi rõ giới hạn clock. Không đo lại API trong Task 6. Quyết định này không xác nhận HTTP latency hoặc capacity đạt yêu cầu. Yêu cầu clock đơn điệu vẫn áp dụng cho các lượt baseline đủ điều kiện trong tương lai. Runner v3 chặn mode API mặc định để tránh tạo thêm lượt có cùng giới hạn mà không ghi rõ.

### Cohort v3 và v4

Cohort v3 đã hoàn tất ba lượt micro-hit, ba lượt UI timeframe-cold, pair-cold và open-hot. Mỗi lượt micro-hit có 100/100 mẫu, không failure hoặc reconciliation sai. Mỗi lượt timeframe-cold có 100/100 mẫu hợp lệ. p95 apply lần lượt 413,1 / 410,5 / 409,2 ms. Mỗi lượt timeframe-cold ghi một Auth 429 trong bước chuẩn bị và phục hồi theo header.

Lượt v3 timeframe-hot dừng trong bước chuẩn bị action 8. Runner đã giữ năm mẫu warm-up và tám mẫu chính. Request 4h trong bước chuẩn bị trả 503 sau provider timeout. Resource log ghi event-loop p95 tối đa 2753,56 ms và khoảng cách hai mẫu resource tối đa 3385,25 ms. Các số này chưa xác định được nguyên nhân chậm. Summary của lượt này ghi không đủ điều kiện baseline. Không tăng timeout hoặc thêm retry cho 503.

Cohort v4 chỉ chạy lại timeframe-hot và chạy pair-hot, mỗi profile đủ 30 mẫu chính. Thay đổi runner chỉ thêm lựa chọn hai profile này qua `--hot-tail`. Script, config và manifest v4 đã được commit tại `1fededf` trước lượt đo. Những profile v2/v3 đã hoàn tất vẫn giữ nguyên.

### Chuẩn bị ban đầu

Người dùng đã duyệt cài k6 ngoài repository, smoke Binance một lượt và commit evidence. File raw lớn hơn 5 MB được nén gzip và lưu SHA256 trong manifest. Không có ủy quyền load test Binance thật.

GitHub API `repos/grafana/k6/releases/latest` trả bản stable `v2.4.0`. Archive Windows amd64 có SHA256 `aaa90b3afc336faf90172c7addf45c4f41305f6f188e3d564f79466e80ac68e3`. Binary được cài tại `%LOCALAPPDATA%/crypto-force-tools/k6-2.4.0/`. Lệnh version trả `k6.exe v2.4.0`, commit `dd9395906d`, Go `1.26.11`, Windows amd64.

Harness nằm trong `apps/api/perf/market-data/`. Replay nhận HTTP từ adapter Binance thật. Auth và session dùng PostgreSQL riêng có hậu tố `_market_data_perf_test`. Cache dùng clock thật và TTL 5000 ms. Không dùng MSW. Email được giữ trong bộ nhớ. Outbound ngoài loopback bị chặn trong process benchmark. Chỉ kiểm password khi tạo tài khoản dùng response rỗng ở boundary Pwned Passwords.

Fixture hiệu năng dùng số nguyên. Mỗi khóa có 519 nến, 19 nến warm-up và 500 điểm MA. Generator tạo raw input và manifest tham chiếu trước đo. Runner không dùng mapper production để tính expected. Các lựa chọn kỹ thuật của agent được ghi trong `config.json` kèm lý do. Chúng không thêm ngưỡng sản phẩm.

Instrumentation dùng User Timing sau ba lệnh `setData`. Detail chứa series đã áp dụng. Runner đối chiếu toàn bộ nến hiển thị, volume và MA với manifest. Runner ghi riêng body và apply. Mốc apply không chứng minh canvas đã vẽ xong. Thời gian hiển thị và kết luận mở Realtime/đổi timeframe (QA-10/QA-11) phải giữ `Inconclusive` nếu chưa có bằng chứng draw.

Runner UI dùng context mới cho từng mẫu. Khi đo chiều 1m → 5m hoặc SOLUSDT → BTCUSDT, runner tìm QueryClient qua cây React và gọi API public `removeQueries` cho khóa đích đang inactive. Đây là thao tác chuẩn bị benchmark để xóa Query cache theo protocol. Product không export API riêng cho runner. Cách tìm QueryClient phụ thuộc cấu trúc React và phải fail nếu không tìm thấy.

Diff `eslint.config.js` thuộc T3: thêm runtime globals và tắt type-aware rules riêng cho script JavaScript của harness, tương tự `scripts/*.mjs`. Rules production và testware không đổi. Không có thay đổi testware Market Data chỉ đọc.

Chưa chạy baseline hoặc smoke thật trong giai đoạn chuẩn bị. Chưa có kết luận latency hoặc capacity.

### Kiểm công cụ đo trước lượt đầu

- Web production build, Web typecheck và 10/10 test Web đạt. Lint theo phạm vi và `check:docs` đạt.
- `checks.mjs` có chín assertion cho nearest-rank, fixture và phân bố khóa. Chín fault lần lượt làm assertion fail: kết quả rỗng thành 0, làm tròn rank xuống, p95 thành p94, thiếu khóa, thiếu nến, MA đầu sai, MA cuối sai, thiếu pair và phân bố khóa lệch. Sau mỗi lần khôi phục, cả chín assertion pass.
- Preflight browser dùng production build, sign-in thật và bốn chart. Toàn bộ nến hiển thị, volume và MA khớp oracle. Fault replay tăng close của nến index 30 lên 1 làm assertion nến fail. Sau khi tắt fault và hết TTL, preflight pass.
- Mutant production tính MA từ high thay close làm preflight fail tại assertion MA: giá trị đầu 10103 thay 10099. Đã khôi phục source, build lại và xác nhận preflight pass. Không giữ mẫu latency từ các lượt preflight.
- Preflight single-flight phát 10 request cùng khóa sau TTL. Cả 10 trả 200, cùng snapshot, một call upstream và chín log join. Barrier giữ trạng thái released để không mất tín hiệu nếu join cuối tới trước HTTP replay.
- PostgreSQL binary là `17.10`. Docker inspect trả `NanoCpus=0`, `Memory=0`. Ba listener chỉ nghe `127.0.0.1`. Manifest mỗi run đọc version SQL, migration, kích thước DB, số user/session và giới hạn container thực tế.

Reviewer độc lập phát hiện năm blocker trước đo. Phân bố khóa đã tách vòng pair khỏi vòng timeframe. Micro-batch đã tách latency thành công/lỗi. Manifest đã bỏ placeholder môi trường. Lượt hit so toàn bộ body với snapshot prime. Phần độ nhạy được bổ sung bằng các fault ở trên. Reconciliation ghi boolean và khóa khi sai. Chi tiết từng trường sai chưa được lưu riêng.

Reviewer đã kiểm lại năm blocker và logic barrier. Không còn blocker trong phạm vi kiểm lại. Lượt đo chưa bắt đầu tại thời điểm commit công cụ đo.

### Smoke thật và cohort v1 bị hủy

Commit công cụ đo trước lượt đầu: `aa22312`. Smoke Binance chạy đúng một lượt sau commit. Hai thao tác lịch sử BTCUSDT/5m và summary đều hợp lệ, có header quota. Toàn bộ 518 nến đóng khớp payload cùng snapshot. Nến đang mở không được so với trạng thái nguồn ở thời điểm muộn hơn. Evidence: `docs/testing/evidence/market-data/rest-v1-binance-smoke/`. Không gọi lại Binance để đo tải.

Cohort replay `rest-v1-api-default-1-1` bị hủy vì hai lỗi harness. `response.json()` của k6 không bảo đảm thứ tự key giống oracle. So bằng JSON string làm response hợp lệ bị báo sai. Middleware dùng `req.path` bên trong router đã bỏ prefix, nên không ghi reconciliation. Đây không phải bằng chứng sản phẩm trả dữ liệu sai.

Đã giữ 90 raw samples, trong đó 65 samples có tag steady trước khi hủy. Thư mục evidence giữ nhãn không đủ điều kiện baseline. Không dùng percentile của lượt này để kết luận sản phẩm. Orchestrator bị dừng trước khi tạo lượt kế tiếp.

Cohort tiếp theo là `rest-v2`. Comparator so cấu trúc và giá trị, bỏ qua thứ tự key của object nhưng giữ thứ tự array. Middleware giữ path gốc trước khi vào router. Runner bắt buộc chạy functional probe trong runtime k6 và kiểm reconciliation có request ID riêng trước các mode API, micro và UI.

Đã chạy 12 assertion và 11 mutant của công cụ đo. Mỗi mutant fail tại assertion, khôi phục rồi pass. Hai mutant bổ sung tái hiện lỗi phụ thuộc thứ tự key và comparator luôn trả true. Probe k6 có hai check đạt: sign-in thật và toàn bộ nến khớp oracle. Server ghi reconciliation `valid: true` cho đúng request probe. Không giữ latency probe làm baseline.

Review cohort v2 không tìm thêm blocker ở comparator, path gốc, probe bắt buộc hoặc nhãn evidence. Công thức latency được sửa trước đo: `blocked + duration`. Source k6 `v2.4.0`, `lib/netext/httpext/tracer.go:303–304`, tính blocked từ GetConn tới GotConn. Khoảng này đã gồm thiết lập kết nối. Assertion timing dùng input blocked 3, connecting 2, TLS 1, duration 10 và expected 13. Mutant cộng thêm connecting/TLS phải fail trước khi tiếp tục.

## Task 1: Shared contract và Web

HEAD bắt đầu: `be781f3aa9b5e65ec4ad7cc314bad570175c8195`.

Môi trường đã chạy: Node `22.23.5`, pnpm `9.15.9`, Docker Compose `5.1.4`. Node và pnpm cần quyền chạy ngoài sandbox tại `C:/dev_env/nvm/v22.23.5`. Chưa kiểm kết nối PostgreSQL trong Task 1.

- Red: ba file test shared Market Data có 116 test, 38 pass và 78 fail. Hai file REST mới có 115 test. Test nháp có một test. Các test REST tới assertion. Summary query lỗi tại `safeParse` vì thiếu public export.
- Green: `pnpm --filter @crypto-force/shared test` pass 149/149 test toàn package, gồm 116 test Market Data. Không gộp 33 test còn lại vào kết quả Market Data.
- `pnpm --filter @crypto-force/web test` pass 10/10 test. Có thêm một test cho 519 nến: chỉ vẽ 500 nến và MA đầu dùng đủ 20 close.
- Mutation strict query: thay `strictObject` bằng `object` làm 6/115 test fail tại assertion. Mutation căn mốc UTC: bỏ kiểm alignment làm 7/108 test fail tại assertion. Đã khôi phục code và shared pass 149/149.
- Mutation warm-up: bỏ cắt nến warm-up làm test mới fail, 1 fail và 9 pass. Đã khôi phục code và Web pass 10/10.
- Typecheck shared và Web đạt. `pnpm check:exports` đạt. Typecheck API còn 8 lỗi import module provider/cache/service chưa có, thuộc Task 2–4.
- Mock E2E MSW: 1/1 pass. Spec UI: 9/9 pass, chạy riêng file với `--workers=1`.
- Lượt E2E trước có lỗi do fixture cũ, định dạng giá cũ, và lỗi encoding/locator khi chuyển test. Các lỗi này đã được sửa. Không dùng các lượt bị dừng làm kết quả cuối.

### Thay đổi testware

Nguồn: contract trong `docs/architecture/10-market-data.md`, ADR-004 và quyết định định dạng giá trong Bước 07.

| File | Loại | Thay đổi |
| --- | --- | --- |
| `packages/shared/src/schemas/market-data.schema.test.ts` | T1 | Chuyển snapshot sang metadata mới. Giữ case giá và thứ tự. Bỏ case MA trong response vì ADR-004 giao Web tính MA. |
| `apps/web/app/utils/market-chart.test.ts` | T1 và thêm test | Một nến không đủ MA20. Thêm case warm-up với expected tính tay: 1..20 có mean 10.5, 500..519 có mean 509.5. |
| `apps/web/mocks/market-data.test.ts` | T1 | Giữ các mean tính tay và kiểm qua mapper Web. Bổ sung timeframe 1d. |
| `apps/web/e2e/market-data/realtime.spec.ts` | T1 | Payload không có MA, có metadata. End chọn 1d theo MK-30. MA hiển thị đủ hai chữ số. Giữ các assertion flow. |
| `apps/web/e2e/market-data/msw-smoke.spec.ts` | T1 | Kiểm metadata thay MA trong HTTP response. Vẫn kiểm MA hiển thị trên UI. |

`as UTCTimestamp` mới trong mapper đổi milliseconds đã kiểm ở contract sang kiểu seconds có brand của Lightweight Charts. Giá trị không bị làm tròn trong mapper.

Vitest không đặt `allowOnly` trong config shared. Source Vitest 5.1.0 mặc định `allowOnly: !isCI`. Config Playwright Market Data chưa đặt `forbidOnly`. Source Playwright 1.65.1 tại `lib/common/index.js` mặc định `forbidOnly: false`. Chưa thay config trong Task 1.

Graphify đã chạy query và affected cho ba schema trước khi sửa. Lượt update trong sandbox bị chặn đọc git ignore toàn cục. Đã chạy lại với quyền ngoài sandbox.

## Task 2: Provider, service và Binance adapter

HEAD bắt đầu: `75e4cdf`. Node `22.23.5` và pnpm `9.15.9` đã kiểm bằng lệnh thực tế. Các lượt Vitest dùng global setup hiện có, tạo lại database test từ migration. Node vẫn cần quyền chạy ngoài sandbox.

Đã thêm interface và kiểu domain trong `providers/market-data/`, service nhận provider qua tham số, và Binance adapter nhận HTTP transport, clock, timeout và logger. Service yêu cầu 519 nến, giữ nguyên dữ liệu provider, tính warm-up từ số nến thực nhận và kiểm snapshot bằng schema shared. Cửa sổ hiển thị vẫn tối đa 500 nến. Các giá trị này lấy từ cửa sổ 500 nến và MA(20) đã duyệt trong contract, không phải ngưỡng mới.

Adapter đọc tuple Binance, dùng base volume, không làm tròn và không retry. Deadline bao phủ cả nhận response và đọc body. Adapter abort HTTP transport khi hết hạn. Deadline vẫn kết thúc request nếu transport bỏ qua abort. Lỗi transport và upstream được phân biệt với payload không đọc được. Service đổi lỗi có kiểu thành `AppError` 502 hoặc 503, giữ nguyên lỗi bất ngờ, và ghi pair/timeframe, số nến, thời gian provider và tổng thời gian.

`binance.test.ts` có sẵn hai case cooldown 429/418 dù Task 3 mới liệt kê phần build cooldown. Task 2 đã build cooldown chung giữa hai endpoint để đạt điều kiện hai suite pass. Task 3 vẫn phải kiểm cache/cooldown và mutation tương ứng. Không thêm khoảng chờ mặc định khi header `Retry-After` không có giá trị hợp lệ.

### Test và mutation

- Trước skeleton: hai suite bị chặn bởi import, không có test tới assertion.
- Sau skeleton: 28 test tới hành vi. Có 24 fail và 4 pass. Bốn case từ chối dữ liệu pass vì skeleton luôn reject, chưa chứng minh validation. Lượt này còn báo unhandled rejection từ assertion timeout khi skeleton trả thành công quá sớm.
- Sau implementation: 28/28 test gốc pass. Sau bổ sung: service 25 test và adapter 23 test, tổng 48/48. Công thức: 17 + 8 test service mới + 11 + 12 test adapter mới. Không tính test Auth hoặc cache vào tổng này.
- Hai nơi đối chiếu literal `closed-candles.json` kiểm đủ 518 nến đóng: adapter và service. Case mới dùng giá và summary khác fixture gốc, gồm ETHUSDT/1d và SOLUSDT.
- Sau review: thêm 5 regression test về log, tổng cuối 53/53. Công thức: 17 + 13 test service mới + 11 + 12 test adapter mới = 30 + 23. Các lượt mutation trước review dùng bộ 47 hoặc 48 test, không phải bộ 53 test cuối.

| Mutation | Bằng chứng |
| --- | --- |
| Đổi close thêm 0.5 | 4 assertion fail, gồm đối chiếu đủ nến đóng |
| Dùng quote volume thay base volume | 4 assertion fail |
| Tăng warm-up ở output đã parse | 11 assertion fail |
| Bỏ `controller.abort()` | Assertion `signal.aborted` fail |
| HTTP fake bỏ listener abort | Assertion transport nhận abort fail. Khôi phục fake, 48/48 pass |
| Đổi 502 thành 503 hoặc 503 thành 502 | Assertion status/code của service fail |
| Bỏ kiểm summary của service | Cả 3 case summary invalid fail |
| Cho payload kline hoặc summary không đọc được trả thành công | Các case payload invalid fail |
| Đổi dấu phần trăm summary | Case summary khác fixture fail |
| Đổi lỗi bất ngờ thành lỗi provider | Assertion giữ nguyên lỗi fail |
| Bỏ log thành công | Assertion số log fail |
| Đổi lỗi transport thành dữ liệu invalid | Assertion nhóm lỗi fail |
| Cho JSON hỏng trả dữ liệu thành công | 3 case adapter/service fail |
| Đổi close ở output service | 3 assertion fail: dữ liệu khác fixture, đối chiếu 518 nến đóng và giữ gap. Khôi phục, 53/53 pass |
| Đổi close trong provider fake | Assertion đối chiếu nến đóng của service fail. Khôi phục, 53/53 pass |
| Tắt từng rule ESLint mới | Test ranh giới tương ứng fail. Khôi phục, cả 3 test rule pass |

Code hoặc fake được khôi phục sau từng mutant. Hai suite được chạy lại green sau mỗi mutant được tính trong bảng. Hai lượt thử không được tính là evidence assertion: mutant warm-up đầu tiên bị schema từ chối, và mutant bỏ log đầu tiên gây lỗi transform. Cả hai đã được khôi phục trước khi chạy mutant thay thế trong bảng.

### Thay đổi testware và ranh giới

Thêm test là thay đổi được phép theo kế hoạch. Các expected mới lấy từ contract đã duyệt: mapping giữ nguyên giá trị, lỗi 502/503, log ngữ cảnh và timeout của fixture. Timeout fixture vẫn là 5000 ms, không đặt timeout production mặc định.

Ba test service cũ chuyển từ biến kết quả sang callback nhận kết quả. Test adapter cũng chuyển cách nhận kết quả. Đây là T2 theo rule `testware/no-implementation-oracle` hiện có. Expected, input và số lần gọi provider không đổi. Mutation close, quote volume và warm-up vẫn làm assertion fail. Comment đầu hai suite được cập nhật theo evidence hiện tại.

Config ESLint thay đổi theo quyền đã ghi trong Task 2. Ba rule kiểm ranh giới provider, `process.env` ngoài API configs và production import testware có cả case hợp lệ và case bị từ chối. Test dùng config ESLint thật. Rule môi trường từng chặn nhầm `data.env`: test hợp lệ đã fail, rồi pass sau khi rule nhận diện riêng `process`. Không thêm ngoại lệ cho code production. Các rule mới đã được thêm vào `check:rules`.

### Xử lý review

Reviewer độc lập báo hai finding medium: log chưa chỉ ra nến sai hoặc chi tiết lỗi mạng, và thiếu mutant trực tiếp cho hai test golden/gap của service. Đã thêm năm test chẩn đoán và chạy red: 5 fail, 48 pass. Sau khi sửa, 53/53 pass. Log nến invalid có rule, path và `openTime`. Log mạng có tên/code lỗi, không ghi message hoặc raw payload.

Schema shared bổ sung path tới nến vi phạm cho thứ tự thời gian và mốc thời gian/trạng thái đóng. Invariant, payload được chấp nhận và response thành công không đổi. Đây là dữ liệu chẩn đoán từ chính nơi kiểm invariant, tránh viết lại validation trong service. `graphify affected candleHistorySchema` đã xác định Shared, API và Web là phạm vi liên quan trước khi sửa. Shared pass 149/149, gồm 116 test Market Data và 33 test khác. Web logic pass 10/10. Typecheck Shared/Web đạt. Không thêm hoặc sửa Lesson Learned.

Hai mutant output service và provider fake trong bảng đã bổ sung evidence còn thiếu. Reviewer đã kiểm lại và đóng cả hai finding. Không có finding mới trong phần sửa sau review.

### Kiểm chứng cuối Task 2

| Lệnh hoặc phạm vi | Kết quả |
| --- | --- |
| `pnpm --filter @crypto-force/api exec vitest run test/market-data/service.test.ts test/market-data/binance.test.ts` | 53/53 pass |
| Cùng hai suite với `--sequence.shuffle` | 53/53 pass, seed `1795226737161` |
| ESLint `apps/api/src`, `apps/worker/src`, `apps/web/app`, hai suite đã sửa, plugin và test rule mới, `eslint.config.js` | Đạt. Không có source cũ cần sửa để tuân thủ rule mới |
| `node --test scripts/app-boundaries.test.mjs scripts/mock-boundaries.test.mjs` | 5/5 pass: 3 test mới và 2 regression HTTP mock boundary |
| `pnpm --filter @crypto-force/api typecheck` | Còn 3 lỗi import cache decorator tại `cached-provider.test.ts`, `provider-contract.test.ts`, `market-data-rest-server.ts`. Thuộc Task 3. Không có lỗi type khác |
| `pnpm check:exports` | Đạt |
| `pnpm check:docs` | Đạt |
| Prettier các file Task 2 | Code đạt. `.prettierignore` bỏ qua Markdown, nên không ghi Markdown đã được Prettier kiểm |
| `graphify update .` | Đã cập nhật lại bằng AST cục bộ sau khi sửa schema và log. Không chạy label hoặc gửi code cho LLM |
| `git diff --check` | Đạt |

Không chạy `pnpm check`, toàn bộ test API, E2E hoặc Binance thật. Task 2 không thay hành vi UI. Kiểm chứng và review độc lập của Task 2 đã hoàn tất. Các file Task 2 được lưu trong commit riêng theo kế hoạch.

## Task 3: Cache decorator và lỗi upstream

HEAD bắt đầu: `8a68581`. Node thực chạy là `22.23.5`. Các lệnh Node/pnpm và cập nhật graph cần quyền ngoài sandbox. Không gọi Binance thật.

Decorator mới nằm tại `apps/api/src/providers/market-data/cached-market-data.provider.ts`. Cache tách namespace nến và summary. Khóa nến có pair/timeframe/limit. TTL nhận qua tham số, dùng mốc 5000 ms đã duyệt trong test và tính từ lúc provider resolve thành công. Snapshot trả lại giữ nguyên `dataTime`, `isClosed` và dữ liệu nến. Request cùng khóa dùng chung pending promise. Lỗi được trả cho mọi waiter và xóa khỏi cache để caller tiếp theo gọi lại provider.

Cooldown 429/418 theo `Retry-After` đã có ở adapter trong Task 2. Task 3 giữ nguyên adapter và kiểm lại cooldown dùng chung giữa lịch sử và summary. Decorator kiểm cache trước khi gọi adapter, nên snapshot còn hạn vẫn trả trong cooldown. Log debug ghi key và trạng thái `miss`, `join`, `hit`.

### Red, green và thay đổi testware

- Lượt đầu hai suite không thu được test vì thiếu module decorator. Sau khi thêm decorator chỉ chuyển tiếp provider, cả 7 test chạy tới assertion: 5 fail, 2 pass.
- Sau khi thêm cache, hai suite pass 7/7. Cùng service 30 và adapter 23, tổng là 60/60 test Market Data.
- Thêm hai test: log debug theo key/trạng thái, và vòng đời summary với pair SOLUSDT cùng giá khác fixture trước. Summary kiểm waiter, TTL tính từ resolve, lỗi refresh khi hết hạn và caller tiếp theo thành công. Hai suite nay có 9 test, tăng từ 7. Tổng bốn suite là 62 = cache 8 + contract 1 + adapter 23 + service 30. Không cộng test Auth hoặc HTTP vào tổng.
- Test mới là thay đổi được phép theo kế hoạch. Nguồn expected là mô hình cache/cooldown và bảng log decorator trong `docs/testing/test-scopes/TS-002-market-data/rest-verification.md`. Giá summary là input tổng hợp, expected giữ nguyên input.
- T2: assertion nhận hai promise của test snapshot cũ chuyển sang callback nhận kết quả để tuân thủ `testware/no-implementation-oracle`. Expected, input và call count giữ nguyên. Assertion retry dùng `.resolves` để mutant giữ rejection fail tại assertion. Đây là tăng độ chặt, không nới expected.
- Comment đầu hai suite thay trạng thái mutation dự kiến và thiếu module bằng fault check hiện tại. Không thêm `as` trong production, export helper cho test hoặc sửa config test/lint.

### Mutation

Mỗi lượt dưới chạy cache, contract và adapter: 32 test. Sau từng mutant, khôi phục code và xác nhận 32/32 pass.

| Mutation | Assertion fail |
| --- | --- |
| Bỏ pair khỏi key | 3: log key, tách khóa và contract cooldown |
| Bỏ timeframe khỏi key | 2: log key và tách khóa |
| Bỏ limit khỏi key | 2: log key và tách khóa |
| Đổi biên TTL từ `<` thành `<=` | 2: summary hết hạn và nến tại đúng TTL |
| Làm mới `dataTime` khi cache hit | 2: snapshot nến và snapshot summary |
| Bỏ single-flight | 3: waiter nến, waiter summary và waiter lỗi |
| Giữ rejected promise | 2: retry nến và retry summary phải resolve |
| Bỏ kiểm cooldown trong adapter | 3: 429, 418 và số HTTP call trong contract |
| Đổi log debug thành trace | 1: mức log của miss/join/hit |

Mutant single-flight còn gây unhandled rejection sau assertion call count fail. Lượt khôi phục không có lỗi đó. Lần thử giữ rejection đầu tiên fail do lỗi thoát ngoài assertion, nên không tính làm evidence. Sau khi dùng `.resolves`, cả hai test fail tại assertion rồi pass sau khôi phục. Hai lỗi script tạm cũng không tính làm evidence: PowerShell coi stderr là lỗi kết thúc và target newline không khớp. Mọi file production đã khôi phục sau các lần thử này.

### Kiểm chứng cuối Task 3

| Lệnh hoặc phạm vi | Kết quả |
| --- | --- |
| `pnpm --filter @crypto-force/api test test/market-data/cached-provider.test.ts test/market-data/provider-contract.test.ts test/market-data/binance.test.ts test/market-data/service.test.ts` | 62/62 pass |
| `pnpm --filter @crypto-force/api exec vitest run` với cùng bốn file và `--sequence.shuffle` | 62/62 pass, seed `1795227681654` |
| `pnpm --filter @crypto-force/api typecheck` | Đạt, không còn lỗi import decorator |
| ESLint decorator và hai suite đã sửa | Đạt |
| `pnpm check:exports` | Đạt |
| `graphify update .` | Đạt sau khi chạy ngoài sandbox, AST cục bộ. Không chạy label |
| `pnpm check:docs` | Đạt |
| Prettier các file Task 3 | Code đạt. Markdown bị `.prettierignore` bỏ qua |
| `git diff --check` | Đạt |

Lệnh shuffle đầu dùng `pnpm test` bị pnpm từ chối option trước khi chạy test. Lượt chạy qua `exec vitest run` trong bảng mới là evidence shuffle. Không chạy `pnpm check`, toàn bộ test API, E2E hoặc đo baseline. Task 3 không thay UI hoặc HTTP/session. Các phần này thuộc Task 4 trở đi.

Reviewer độc lập đã đọc diff, source và conventions theo skill `review-change`. Không có finding trong các mục checklist. Reviewer dùng evidence test và mutation của tác giả, không chạy lại test. Task 3 kết thúc bằng commit riêng theo kế hoạch.

## Task 4: HTTP và session

HEAD bắt đầu: `e6e0f97`. Node thực chạy là `22.23.5`. Lệnh Node/pnpm cần quyền ngoài sandbox. Integration dùng database `_test` do harness tạo lại từ migration. Không gọi Binance thật.

`createApp` nhận provider, dựng service và nối router/controller Market Data. Middleware gọi Better Auth `getSession` với `fromNodeHeaders` trước kiểm query. Health và Auth config vẫn công khai. `src/index.ts` tạo Binance adapter và cache decorator. TTL là 5000 ms đã duyệt. Timeout adapter 5000 ms là agent chọn theo harness REST hiện có, để API có thời gian trả lỗi trước timeout chart 10 giây. Trước Task 4 chưa có adapter trong composition root. Không thay timeout của Web.

HTTP giữ mapping lỗi từ service: 502 cho dữ liệu invalid, 503 cho nguồn không khả dụng, 500 cho lỗi ngoài dự kiến. Query sai trả 400, phiên không hợp lệ trả 401. Router đặt `no-store` trước kiểm phiên. Logger chỉ serialize method/path/status và duration, bỏ query/header/raw error. Path của Auth dùng route pattern, URL không có route dùng `/unmatched`. Middleware lỗi ngoài dự kiến ghi nhóm lỗi thay vì message có thể chứa secret. Không thêm `as` trong production.

Đã kiểm source package cài đặt `better-auth@1.7.25`: `dist/integrations/node.mjs` chuyển Node headers thành `Headers`; `dist/api/routes/session.d.mts` yêu cầu headers và trả session hoặc null. HTTP test dùng Better Auth thật, gồm phiên hết hạn và phiên đã thu hồi.

### Red, green và testware

- Lượt đầu: 18/18 test HTTP fail tại assertion vì nhận 404. Thêm 8 test: hai case unavailable và sáu case log cho status 200/400/401/502/503/500. Lượt trước build có 26/26 fail vì 404.
- Sau khi nối HTTP: 25 pass, một test log fail do `req.url` bị Express rút thành `/summary`. Sửa production dùng `originalUrl` và bỏ query. HTTP đạt 26/26.
- Sau review, HTTP thêm hai regression log dùng reset callback Auth và URL không có route. HTTP hiện có 28 test. Tổng năm suite trong `test/market-data` là 90 = HTTP 28 + service 30 + Binance 23 + cache 8 + contract 1. Phạm vi Market Data là 88 = 90 trừ hai regression log dùng chung. Không cộng test ở `test/auth` hoặc smoke vào tổng này. Bốn suite ngoài HTTP giữ nguyên số test của Task 3.
- Test mới được phép theo plan. Nguồn expected là bảng lỗi trong `docs/architecture/22-api-endpoints.md` và bảng log trong `docs/testing/test-scopes/TS-002-market-data/rest-verification.md`. Log kiểm field và duration hữu hạn không âm, không snapshot câu message.
- T3: thêm type cho callback fake chuyển tiếp adapter để ESLint không nhận tham số `any`. Input, expected và assertion của test cũ giữ nguyên. Các fake vẫn nhận payload invalid để kiểm validation runtime. Comment đầu suite ghi fault đã thực chạy.
- Đã chạy `git diff --stat 32fffa5 --` với danh sách testware chỉ đọc trong plan. Task 4 chỉ sửa `http.test.ts`; thay đổi testware của Task 1–3 giữ nguyên và có phân loại ở các phần trên.

`check:exports` phát hiện `CandleRequest` và `CandleSnapshot` không có importer production khi provider đã được nối vào app. Đã bỏ hai từ khóa `export`, giữ nguyên type và interface provider. Không thêm caller giả hoặc nới cấu hình kiểm tra.

### Mutation

Tám mutant đầu chạy 26 test HTTP. Tất cả fail tại assertion. Sau từng mutant, khôi phục production và xác nhận 26/26 pass. Mutant path sau review chạy 28 test, fail hai assertion chống lộ token. Khôi phục production rồi xác nhận 28/28 pass.

| Mutant | Test fail |
| --- | --- |
| Bỏ kiểm session | 7: thiếu phiên, thứ tự validation, revoked, expired và log 401 |
| Strip query thay strict | 3: tham số thừa của nến/summary và log 400 |
| Trả message lỗi ngoài dự kiến trong response | 1: envelope 500 không còn che chi tiết |
| Ghi status log sai | 6: từng nhóm status |
| Bỏ duration khỏi log | 6: từng nhóm status |
| Serialize header/query vào log | 6: phát hiện cookie/token/query sentinel |
| Ghi message lỗi chứa secret vào log | 1: log 500 |
| Đổi unavailable từ 503 thành 500 | 3: nến, summary và log 503 |
| Bỏ chính sách path đã che dữ liệu | 2: log chứa reset token thật và token trong path không có route |

### Sửa finding sau review

Reviewer phát hiện logger toàn app vẫn ghi reset token của Better Auth trong path. Lỗi có ở request serializer và completion log. Đã xác nhận trên `better-auth@1.7.25`, `dist/api/routes/password.mjs`: link email có `/reset-password/:token`. Hai regression HTTP mới chạy red: 26 pass, 2 fail tại assertion log chứa token. Sau sửa, 28/28 pass. Test reset callback còn kiểm redirect 302 tới màn reset và giữ token ở đích, để chứng minh thay đổi log không làm hỏng callback.

Áp dụng `correct`: `httpLogPath` là nơi duy nhất chọn path cho request serializer và cả completion log thành công/lỗi. Chỉ bốn endpoint tĩnh của app được ghi path. Auth dùng `/api/auth/{*splat}`, đường dẫn khác dùng `/unmatched`. Request gốc không bị đổi. Thêm regression cho URL chưa biết để route mới không vô tình ghi dữ liệu trong path. Không thêm rule lint theo cú pháp hoặc sửa Lesson Learned.

### Kiểm chứng Task 4

| Lệnh hoặc phạm vi | Kết quả |
| --- | --- |
| `pnpm --filter @crypto-force/api exec vitest run` | Lượt đầu: 248 pass, 1 fail trong 249 test. Market Data 88/88 pass. Test Auth TC-204 vượt timeout 5000 ms khi tạo database mới |
| Cùng lệnh, chạy lại trước sửa finding path | 249/249 pass, không thay timeout hoặc test Auth |
| Cùng lệnh, lượt cuối sau sửa finding path | 251/251 pass trong 13 file. Tổng là 90 test trong năm suite `test/market-data` và 161 test Auth/smoke ngoài năm suite này |
| `pnpm --filter @crypto-force/api exec vitest run test/auth/security.test.ts` | Chạy lại suite có lỗi: 19/19 pass, không sửa test hoặc tăng timeout |
| `pnpm --filter @crypto-force/api exec vitest run test/market-data --sequence.shuffle` | 88/88 pass, seed `1795228999439` |
| Cùng lệnh sau sửa finding path | 90/90 pass, seed `1795229988362`: 88 Market Data và hai regression log dùng chung |
| `pnpm --filter @crypto-force/api typecheck` | Đạt sau khi sửa type callback fake và bỏ export thừa |
| ESLint các file production và HTTP test đã sửa | Đạt |
| `pnpm --filter @crypto-force/api build` | Đạt |
| `pnpm check:exports` | Đạt sau khi bỏ export của hai type không có caller production |
| `graphify update .` | Đạt, cập nhật AST cục bộ sau khi bỏ export type. Không chạy label hoặc gọi LLM |
| `pnpm check:docs` | Đạt |
| Prettier các file Task 4 và `git diff --check` | Đạt. Markdown bị `.prettierignore` bỏ qua |

Sau sửa finding, đã chạy lại ESLint cho `app.ts` và HTTP test, typecheck API, build API, `check:docs`, Prettier, `git diff --check` và cập nhật graph. Các kiểm tra này đạt. Lượt toàn API cuối với hai test mới đạt 251/251. Không tăng timeout hoặc sửa test Auth.

Reviewer đã kiểm lại phần sửa, đóng finding high và không có finding mới. Review chỉ đọc, dùng evidence của các lượt test/mutation đã chạy, không chạy lại test. Task 4 kết thúc bằng commit riêng theo plan.

Không chạy `pnpm check`, E2E, browser hoặc baseline. Task 4 không sửa UI. Task 5 còn kiểm flow UI qua API thật.

## Task 5: Flow UI qua API thật

HEAD bắt đầu: `31b3175`. Node `22.23.5`, pnpm `9.15.9`. Docker Desktop chưa chạy khi bắt đầu, agent đã khởi động. PostgreSQL 17 báo healthy trước lượt red. Lệnh Node/pnpm/Docker cần quyền ngoài sandbox. Không gọi Binance thật.

### Red

`pnpm --filter @crypto-force/web exec playwright test --config playwright.market-data-rest.config.ts` thu thập 11 test, không phải 10 như plan ghi. Test thứ 11 kiểm giá làm tròn half-up (ADR-005), được thêm sau khi plan được viết. Lượt đầu timeout webServer 60 giây khi Docker vừa bật và Vite tối ưu dependency lần đầu. Lượt red dùng làm mốc: API startup thành công, test tới assertion UI, 4 pass và 7 fail:

- 4 test fail tại assertion UI: timeframe mặc định là 1m thay vì 5m (MK-31), không có Retry chart 1 vì chart 1 không phải 5m, và sidebar còn MA/Volume (MK-60).
- 3 test fail trong `beforeEach`: sign-up nhận 429 vì Better Auth giới hạn sign-up theo IP, và cả 11 test cùng gửi từ 127.0.0.1.

### Build

- API client Web: lỗi có `code` theo envelope của API. Web phân nhánh theo `code`, không theo status. Chart có deadline 10 giây tính từ lúc gửi request tới lúc đọc xong body (MK-34). Deadline dùng `setTimeout` để clock của trang điều khiển được. Payload sai contract trả lỗi `MARKET_DATA_INVALID`. Vẫn gọi HTTP cùng origin.
- 401 `UNAUTHENTICATED` chạy lại kiểm phiên của workspace layout. Root boundary hiện màn chặn đăng nhập tại URL hiện tại theo ADR-001 (MK-40).
- Realtime: mặc định 5m/15m/1h/4h (MK-31), bỏ Load history (MK-61), sidebar chỉ còn giá, thay đổi 24 giờ và trạng thái (MK-60).
- Mỗi chart có status `role="status"` và `aria-live="polite"` luôn có trong DOM. Khi trống, status dùng `sr-only` thay vì bị ẩn (MK-48). Chart có mô tả bằng chữ (MK-47). Nến đang mở và MA tạm có nhãn chữ (MK-26, MK-28). Mỗi chart có thời điểm dữ liệu (MK-27). Trang ghi múi giờ, trục và crosshair dùng múi giờ thiết bị (MK-43).
- Chart đọc giá trị một nến bằng chuột hoặc phím Left/Right/Home/End, và zoom bằng +/- (MK-41, MK-46). Nến tăng rỗng ruột, nến giảm đặc (MK-49).
- `marketPairPriceDecimals` trong `packages/shared` thực hiện ADR-005. Trước Task 5, hằng số này chưa có trong code. Giá format theo số chữ số của pair.

Không thêm type assertion để lách type checker trong `src/` hoặc `app/`. Chỉ có `as const` cho literal: `priceFormat` của chart và `marketPairPriceDecimals`. Không export helper chỉ cho test. `MarketDataRequestError` và `marketPairPriceDecimals` có caller production.

### Quyết định của agent

Agent chốt các quyết định dưới theo ủy quyền của product owner. Product owner có thể bác bỏ khi review.

| Quyết định                                                                                                                                              | Lý do                                                                                                                               |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Deadline 10 giây chỉ áp dụng cho request nến, không áp dụng cho summary                                                                                 | MK-34 chỉ nói về chart. Không có nguồn cho thời hạn của sidebar                                                                     |
| Status ở trạng thái Ready để trống, không thông báo "đã tải"                                                                                            | MK-48 chỉ yêu cầu loading, rỗng và lỗi. Bốn chart cùng báo đã tải gây nhiễu cho người dùng screen reader                            |
| Retry dùng `aria-disabled` khi đang tải và ở lại DOM từ lần lỗi đầu tới khi có data. Sau khi retry thành công, focus chuyển vào vùng chart hoặc sidebar | Thuộc tính `disabled` làm mất focus. Nút Retry rời DOM sau khi thành công, nên focus sẽ rơi về body nếu không chuyển (MK-38, MK-46) |
| Phím Left/Right/Home/End chọn nến, +/- zoom                                                                                                             | MK-46 không miễn chức năng chart. Lightweight Charts không có thao tác bàn phím                                                     |
| Nhãn múi giờ ghi tên IANA, ví dụ `Times in Asia/Bangkok`                                                                                                | MK-43 yêu cầu màn hình ghi múi giờ. Thời điểm dữ liệu dùng dạng ngắn `GMT+7`                                                        |

### Testware

Đã chạy `git diff --stat 32fffa5 --` với danh sách testware chỉ đọc. Ngoài thay đổi của Task 1–4, Task 5 sửa bốn file sau.

| File                         | Loại         | Thay đổi và nguồn                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ---------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rest-history.spec.ts`       | T3           | Sign-up gửi `x-forwarded-for` với một địa chỉ 10.x riêng cho mỗi test, giống E2E Auth. Expected và assertion hành vi giữ nguyên. Header comment cập nhật theo trạng thái hiện tại                                                                                                                                                                                                                                                                                                                                                     |
| `rest-history.spec.ts`       | Thêm test    | 13 test mới, liệt kê ở mục Test mới                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `market-data-rest-server.ts` | Thêm harness | Scenario `web-hold`, `gap`, `flat`, `open`, `summary-error`. Scenario cũ không đổi. App ngoài bọc `createApp` để giữ request của `web-hold`; app ngoài cũng tắt `x-powered-by` như `createApp`, nên header response không đổi. `web-hold` giữ request HTTP trước API, nên timeout Web không dựa vào timeout 5 giây của API (`rest-verification.md`, E2E và phần kiểm thủ công)                                                                                                                                                        |
| `realtime.spec.ts`           | T1           | Spec mock kiểm mặc định 1m, Load history, MA/volume ở sidebar và làm mới lỗi giữ nến cũ. Ba hành vi sau đã Dropped hoặc chỉ thuộc vòng polling (MK-09, MK-16, MK-13); nguồn mới là MK-31, MK-60, MK-61. Mỗi test giữ ý đồ cũ trên timeframe mới: chia sẻ request dùng 1d thay 4h, lỗi chart chuyển sang 5m/15m/1h/4h. Expected lấy từ công thức fixture, ví dụ volume chart 5m là 20 × 60 = 1,200. Phần refresh giữ nến cũ bị bỏ khỏi test thứ 7. Test accessibility vào trạng thái lỗi bằng cách đổi timeframe thay cho Load history |
| `msw-smoke.spec.ts`          | T1           | Assertion `Summary MA20` (MK-09 đã Dropped) chuyển sang dòng giá trị của chart 1 (MK-29). Expected tính tay từ fixture mock: close 67000 + 67 × 24 = 68,608.00, MA 67000 + 67 × 14.5 = 67,971.50, volume 24 × 100 = 2,400                                                                                                                                                                                                                                                                                                             |

Số test: REST 11 → 24. Mock UI giữ 9 test. MSW giữ 1 test.

### Test mới

| Test                                    | Requirement                                 | Oracle                                                                                                                                                                                                 |
| --------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Hủy request của pair cũ                 | MK-14, MK-17                                | Request BTC/5m của browser kết thúc `failed` khi đổi sang ETHUSDT, nên response sau release không tới trang. Sau release và đổi timeframe chart 2, chart 1 vẫn 718.00 và không có 608.50               |
| Request chart sau 9999, 10000, 10001 ms | MK-34                                       | Clock dừng trước request. Ở 9999 ms, status vẫn Loading và response được release kết thúc `finished`. Ở 10000 và 10001 ms, request bị abort, chart báo lỗi kèm Retry, response tới muộn không thay lỗi |
| Phiên bị thu hồi                        | MK-40                                       | Sign-out ở context khác bằng cookie của trang. Đổi timeframe nhận 401, màn chặn hiện tại `/realtime`. Đăng nhập lại thì quay về Realtime và có dữ liệu                                                 |
| Nến đang mở và bàn phím ở Asia/Bangkok  | MK-24, MK-26 đến MK-28, MK-41, MK-43, MK-46 | Literal tính tay: dataTime 2025-01-02 19:14:59.999 UTC hiển thị `Jan 3, 2025, 02:14 GMT+7`. Home chọn nến index 19 lúc 08:35 với OHLCV 119/120/118/119/29 và MA 109.50                                 |
| Status chỉ đổi ở chart liên quan        | MK-48                                       | Status có sẵn trước thay đổi và vẫn là cùng phần tử. Chart 1 đổi đúng 1 lần, chart 2–4 không đổi, focus giữ ở timeframe chart 2                                                                        |
| Retry bằng bàn phím                     | MK-12, MK-38, MK-46, MK-48, MK-58           | Chỉ chart 1 lỗi. Retry bị giữ upstream: nút có `aria-disabled="true"` và giữ focus. Enter lần hai không tạo request. Browser gửi đúng 1 request, rồi focus ở vùng chart 1                              |
| Cây accessibility của Chromium          | MK-47, MK-48                                | Role, name và description của chart, cùng role và `live` của status, khớp giữa Playwright và `Accessibility.getPartialAXTree`                                                                          |
| Giá trị của fixture gap và tăng/giảm    | MK-35, MK-36                                | Gap: MA 2200 / 20 = 110.00. Flat: MA (18 × 100 + 101 + 100) / 20 = 100.05. Hình nến (MK-49) chỉ có trong ảnh trình duyệt                                                                               |
| Status qua retry lỗi                    | MK-12, MK-48                                | Lỗi → Loading → lỗi đổi đúng 2 lần text của cùng phần tử status. Status chart 2–4 không đổi                                                                                                            |
| Mô tả khi rỗng và thiếu MA              | MK-11, MK-15, MK-47, MK-48                  | Bốn status báo rỗng. Fixture 19 nến: description `Close 118.00 · Volume 28 · MA(20) Not enough data` cùng hướng dẫn phím                                                                               |
| Retry sidebar                           | MK-18, MK-46                                | Chỉ summary lỗi. Retry bằng Enter hiện 618.13 USDT, focus ở sidebar, không có request nến mới                                                                                                          |

Hai lỗi driver gặp khi viết test mới đã sửa trước lượt green. Thứ nhất, app dev render trong React `StrictMode`, nên request đầu của mỗi query bị hủy. Helper nay theo dõi request cuối cùng khớp URL. Thứ hai, timer 0 ms tạo trong lúc `runFor` đang chạy được Playwright đặt lùi 1 ms (`coreBundle.js` của `playwright-core@1.65.1`, `addTimer`). Vì vậy các kiểm sau deadline dùng `runFor(1)`. Hai lỗi này không đổi expected.

Test mới phát hiện một lỗi production trước lượt green: status rỗng dùng `empty:hidden` nên bị loại khỏi cây accessibility. Live region không tồn tại trước khi trạng thái đổi. Lỗi đã sửa bằng `sr-only`.

Test Retry giữ upstream phát hiện lỗi production thứ hai: TanStack Query v5 đưa query chưa có data về `pending` khi retry. Nút Retry rời DOM trong lúc tải, focus mất, rồi nút xuất hiện lại khi retry lỗi. Lỗi đã sửa: nút Retry ở lại từ lần lỗi đầu (`errorUpdateCount > 0`) tới khi có data, cho cả chart và sidebar.

### Mutation

Script áp từng mutant, chạy các test liên quan, khôi phục file, rồi chạy lại cùng test.

| Mutant                                                   | Test fail                                               | Sau khôi phục |
| -------------------------------------------------------- | ------------------------------------------------------- | ------------- |
| Driver: ETH trả giá BTC (giữ dữ liệu pair cũ)            | 2/2: held và release, nhận 618.00 thay 718.00           | 2/2 pass      |
| Production: MA dùng high thay close (tính MA sai)        | 2/2: mặc định và nến đang mở, nhận 609.50               | 2/2 pass      |
| Driver: lỗi 5m lan sang mọi interval                     | 2/2: chart 2 không có 608.50, status chart khác báo lỗi | 2/2 pass      |
| Production: deadline 9999 ms                             | 1/1: request bị abort ở 9999 ms                         | 1/1 pass      |
| Production: deadline 10001 ms                            | 1/1: request chưa kết thúc ở 10000 ms                   | 1/1 pass      |
| Production: bỏ chuyển màn chặn khi 401                   | 1/1: không có màn chặn                                  | 1/1 pass      |
| Production: status ẩn khi trống                          | 2/2: status không tìm thấy, cây Chromium khác expected  | 2/2 pass      |
| Production: vẽ nến warm-up                               | 1/1: Home không chọn được nến index 19                  | 1/1 pass      |
| Production: retry không giữ focus                        | 1/1: vùng chart 1 không có focus                        | 1/1 pass      |
| Production: không chuyển tiếp abort của caller tới fetch | 1/1: request BTC/5m cũ chưa kết thúc sau 3 giây         | 1/1 pass      |
| Production: deadline 10002 ms                            | 1/1: request chưa kết thúc ở 10001 ms                   | 1/1 pass      |
| Driver: fixture gap giữ nến index 10                     | 1/1: MA 110.50 thay 110.00                              | 1/1 pass      |
| Production: thay phần tử status ở mỗi trạng thái         | 1/1: phần tử mới không có bộ đếm thay đổi               | 1/1 pass      |
| Production: chart không liên kết mô tả                   | 1/1: description chỉ còn hướng dẫn phím                 | 1/1 pass      |
| Production: retry sidebar không giữ focus                | 1/1: sidebar không có focus                             | 1/1 pass      |

Mutant "Retry không bị chặn khi đang tải" (bỏ `if (query.isFetching) return;`) sống sót: test vẫn thấy đúng 1 request. Đây là mutant tương đương. TanStack Query v5 không hủy fetch đang chạy của query chưa có data, nên `refetch()` lần hai dùng lại promise cũ. Guard được giữ làm lớp phòng thủ. MK-38 được bảo đảm bởi `aria-disabled` và hành vi dedupe này.

Lượt mutation đầu của bốn mutant gap, status, mô tả và retry sidebar báo 0 pass/0 fail, vì `pnpm` tạm thời không tìm thấy trong shell. Lượt đó không tính là evidence. Bảng trên ghi lượt chạy lại.

### Xử lý review

Reviewer độc lập đọc diff, conventions và evidence theo skill `review-change`. Kết quả gồm 1 finding high, 5 medium và 14 low.

| Finding                                                                                                            | Xử lý                                                                                                                                                                                                                             |
| ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| High: test response cũ sau release không kiểm outcome. Request cũ bị Web hủy, nên response không bao giờ tới trang | Test đổi tên và assert request cũ `failed` trước 3 giây. Mutant "không chuyển tiếp abort" làm test fail. Lần thử đầu với poll 10 giây không bắt được mutant, vì deadline 10 giây của Web cũng làm request `failed`; oracle đã sửa |
| Medium: test status dựa vào deadline thật 10 giây                                                                  | Giữ nguyên. Deadline bắt đầu khi request được gửi, sau khi module đã tải. Trước release, test chỉ chờ chart 2–4 tải xong. Rủi ro chỉ còn khi máy rất chậm sau lúc gửi request                                                     |
| Medium: MK-47/MK-48 chưa kiểm trạng thái rỗng, lỗi và thiếu MA                                                     | Thêm test status qua retry lỗi và test mô tả khi rỗng và thiếu MA                                                                                                                                                                 |
| Medium: MK-38 không có assertion                                                                                   | Retry giữ upstream, kiểm `aria-disabled`, focus và số request của browser. Test này phát hiện lỗi `pending` của TanStack ở trên                                                                                                   |
| Medium: tên test gap/flat nói "draws"; thiếu mutant                                                                | Đổi tên. Thêm mutant driver gap                                                                                                                                                                                                   |
| Medium: header file test không ghi fault đã thử                                                                    | Header spec và test server ghi fault đã thử                                                                                                                                                                                       |
| Low: mutant 10001 ms, comment sau deadline, zoom ledger không có chờ                                               | Thêm mutant 10002 ms, sửa comment, bỏ assertion ledger của zoom; zoom có evidence trình duyệt                                                                                                                                     |
| Low: retry sidebar mất focus                                                                                       | Sidebar dùng cùng `useRetryFocus`. Thêm test và mutant                                                                                                                                                                            |
| Low: app ngoài của test server bật `x-powered-by`                                                                  | Tắt `x-powered-by` như `createApp`                                                                                                                                                                                                |
| Low: nguồn volume 2,400, câu "bản ghi lời đọc" cũ, comment MK-13, claim `as`, header không ghi đường dẫn ảnh       | Đã sửa                                                                                                                                                                                                                            |
| Low: `let email` dùng chung, URL 5185 lặp                                                                          | Giữ: config có `workers: 1`, comment ghi điều kiện này                                                                                                                                                                            |
| Low: query bị pause khi offline không có status                                                                    | Giữ, ngoài phạm vi Task 5. Ghi lại để xét khi có requirement mất mạng                                                                                                                                                             |
| Low: `MARKET_DATA_INVALID` và `INVALID_QUERY` vẫn có Retry                                                         | Giữ: MK-12 yêu cầu chart lỗi có thử lại. Web vẫn không vẽ nến khi dữ liệu sai                                                                                                                                                     |
| Low: regex data time trong spec mock                                                                               | Giữ: dataTime của mock hiển thị theo múi giờ máy chạy test, nên không có literal ổn định                                                                                                                                          |

### Kiểm trên trình duyệt

Dùng `playwright-cli`, Chromium, Windows 11, múi giờ Asia/Bangkok. API test server và Web dev 5185 chạy cùng harness của E2E. Ảnh nằm trong `docs/testing/evidence/market-data/2026-11-21-rest-ui-browser/`.

| Requirement                                     | Kết quả                                                                                                       | Evidence                                    |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Canvas, attribution (MK-02)                     | Passed: 4 chart vẽ nến, volume và MA, mỗi chart có logo TradingView                                           | `01-default-1440.png`                       |
| Warm-up không vẽ, MA phủ nến đầu (MK-24, MK-33) | Passed: nến trái nhất là 08:35 (index 19), MA bắt đầu ở 109.50                                                | `02-keyboard-zoom-first-visible-candle.png` |
| Crosshair (MK-41, MK-43)                        | Passed: hover nến 09:20 hiện O 128, MA 118.50, khớp công thức fixture. Nhãn thời gian GMT+7                   | `03-mouse-crosshair.png`                    |
| Zoom và kéo (MK-42, MK-61)                      | Passed: zoom bằng phím, kéo bằng chuột dừng ở nến đầu đã tải. Ledger giữ 5 upstream call                      | `02`, `04-mouse-drag.png`                   |
| Gap (MK-35, MK-36)                              | Passed: sau 07:45 là 07:55, không có nến 07:50. MA chỉ có điểm cuối 110                                       | `05-gap.png`                                |
| Nến tăng/giảm ngoài màu (MK-49)                 | Passed: nến tăng rỗng ruột, nến giảm đặc. Hướng nến vẫn phân biệt được khi bật forced colors                  | `06`, `07`                                  |
| Focus nhìn thấy (MK-58)                         | Passed: viền focus ở chart và ô timeframe. Thứ tự Tab: pair → số chart → timeframe → chart → link TradingView | `02`, `09-320px-focus-timeframe.png`        |
| 320 CSS px (MK-50, MK-59)                       | Passed: `scrollWidth` 320 = `innerWidth` 320, 4 chart cùng x = 16 và xếp một cột                              | `08-320px-full-page.png`                    |

Finding hiển thị, không chặn requirement: nhãn tick đầu và cuối của trục thời gian bị cắt ("1, 10:00", "Jan 3, 0"). Ở chiều rộng hẹp, nhãn giá chồng lên nhãn volume. Canvas giữ màu nền tối khi bật forced colors. Lightweight Charts tạo `id="tv-attr-logo"` lặp lại ở mỗi chart.

Accessibility ở mức khai báo theo [giới hạn kiểm accessibility](accessibility-verification-limits.md). MK-47 và MK-48 Passed ở mức khai báo qua hai test cây accessibility và status. Phần screen reader đọc ra không kiểm, theo quyết định của product owner ngày 2026-11-21. Câu yêu cầu kiểm screen reader và các câu liên quan trong `rest-verification.md` đã cập nhật theo quyết định này.

### Kiểm chứng Task 5

| Lệnh hoặc phạm vi                                                                                     | Kết quả                                                                                                |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `pnpm --filter @crypto-force/web exec playwright test --config playwright.market-data-rest.config.ts` | 24/24 pass, lượt cuối sau khi xử lý review                                                             |
| `... --config playwright.market-data.config.ts --project=ui --workers=1`                              | 9/9 pass                                                                                               |
| `... --config playwright.market-data.config.ts --project=msw --workers=1`                             | 1/1 pass                                                                                               |
| `pnpm --filter @crypto-force/web test`                                                                | 10/10 pass                                                                                             |
| `pnpm --filter @crypto-force/shared test`                                                             | 149/149 pass                                                                                           |
| Typecheck shared, Web, API                                                                            | Đạt. Lượt đầu API báo `number \| undefined` ở test server, đã sửa bằng cùng mặc định 1m của `klines()` |
| ESLint các file `.ts`/`.tsx` đã sửa                                                                   | Đạt                                                                                                    |
| `pnpm check:exports`                                                                                  | Đạt                                                                                                    |
| `pnpm check:docs`                                                                                     | Đạt sau khi tách tham chiếu ADR-001 khỏi trích dẫn `docs/UCs` trong comment                            |
| Prettier các file code, `git diff --check`                                                            | Đạt                                                                                                    |
| `graphify update .`                                                                                   | Đạt, AST cục bộ                                                                                        |

Không chạy `pnpm check`, toàn bộ test API hoặc baseline. Task 5 không sửa code API production. Thay đổi phía API chỉ nằm ở test server.

## Task 7: Chốt tài liệu REST tải lịch sử

HEAD bắt đầu: `caf7ffb`. Task 7 chỉ sửa tài liệu, không sửa code hoặc testware.

### Đối chiếu hành vi thực tế với tài liệu

| Tài liệu | Khác biệt | Xử lý |
| --- | --- | --- |
| `docs/architecture/10-market-data.md` | Trạng thái còn ghi chưa triển khai. Rủi ro còn ghi schema nháp chưa khớp contract. Header weight ghi chưa xác nhận trên response thật | Ghi đã triển khai. Bỏ rủi ro schema nháp. Ghi tên header nhận được trong smoke Binance |
| `docs/architecture/10-market-data.md` | Thiết kế chỉ ghi timeout API là cấu hình. Code đặt 5000 ms ở composition root. Web không đặt hạn chờ cho summary | Ghi giá trị, nguồn và lý do theo Task 4. Ghi quyết định hạn chờ chỉ cho request nến theo Task 5 |
| `docs/architecture/10-market-data.md`, `23-security.md` | Log HTTP ghi "method, URL". Code chỉ ghi path tĩnh, `/api/auth/{*splat}` hoặc `/unmatched`, không ghi query | Ghi chính sách path theo `httpLogPath` trong `apps/api/src/app.ts` |
| `docs/architecture/10-market-data.md` | Rủi ro về thời gian mở Realtime, đổi timeframe (QA-10, QA-11) và TTL ghi chưa có số đo | Ghi kết quả Inconclusive, request hết thời gian chờ ở 50 client và Auth 429 trong baseline, kèm link tới kết quả |
| `docs/architecture/22-api-endpoints.md`, `00-system.md`, `README.md` | Endpoint Market Data và Binance ghi chưa triển khai. Web xử lý 400/502 ghi không có thử lại | Ghi đã triển khai. Ghi Retry cho mọi lỗi chart, theo Task 5 và quy tắc chart lỗi có thử lại (MK-12) |
| `docs/UCs/market-data.md` | Sáu rule accessibility ghi "số SC chưa đối chiếu nguyên văn". Bước 07 đã đọc nguyên văn sáu SC ngày 2026-11-20 | Sửa cột Nguồn. Rule và giá trị không đổi |
| `docs/UCs/quality-attributes.md` | Không có khác biệt. Kết quả đo thuộc tài liệu kiểm chứng | Không sửa |

Không có hành vi thực tế nào cần đổi rule trong `docs/UCs/`. Hạn chờ 10 giây (MK-34) và tối đa 500 nến (MK-33) ghi "xem lại khi đo hiệu năng". Số đo apply không chứng minh mốc vẽ, nên Task 7 không đổi hai giá trị này.

### Kết quả trong tài liệu kiểm chứng

`rest-verification.md` có mục Kết quả thực chạy: kết quả từng suite, tóm tắt mutation, bảng kết quả theo requirement, baseline, smoke Binance và phần chưa kiểm. Các câu cũ đã sai sau Bước 08 được sửa: interface chưa có, file test dự kiến, harness E2E bị chặn, mutation chưa chạy, `k6` chưa cài, thư mục evidence chưa có, tên header weight chưa xác nhận. Ký tự lỗi encoding trong danh sách file schema đã sửa. README của TS-002 ghi trạng thái mới.

Requirement có kết quả khác Passed:

- Rời Realtime rồi mở lại về mặc định (MK-37): chưa có test, Inconclusive. Reload Passed.
- Đọc nến bằng thao tác chạm (MK-41): chưa kiểm. Chuột và bàn phím Passed.
- Mọi điều khiển dùng được bằng bàn phím (MK-46): Inconclusive, chọn pair và số chart bằng phím chưa có evidence.
- Tập pair và timeframe (MK-30, MK-32): Passed ở contract và API; số lựa chọn trên UI chưa có assertion.
- Dòng MA/volume đang tải (MK-62): Passed khi đổi pair; đổi timeframe chưa có assertion.
- Nến sai không được vẽ (MK-45): Passed ở API; UI qua API thật chưa có scenario dữ liệu sai.
- Múi giờ thiết bị (MK-43): chỉ kiểm Asia/Bangkok.
- Thay provider mà frontend không đổi (QA-09): Inconclusive, vì chưa thêm provider thật thứ hai để đo số đo của scenario.
- Thời gian mở Realtime, đổi timeframe (QA-10, QA-11) và capacity: Inconclusive, theo kết quả Task 6.
- Mô tả chart và thông báo trạng thái (MK-47, MK-48): Passed ở mức khai báo, không kiểm screen reader theo quyết định của product owner.

### Review và kiểm chứng

Reviewer độc lập theo skill `review-change` báo 2 finding high, 6 medium và 11 low. Đã sửa tất cả:

- High: lỗi ở mặc định/50 client được ghi là response 503. Evidence cho thấy mọi lỗi phía client có status 0 sau khoảng 10 giây, tức `k6` hết thời gian chờ; server chỉ ghi 221 response 503 ở lần lặp 1. Đã sửa câu ở `rest-verification.md` và `10-market-data.md`.
- High: MK-46 ghi Passed dù chọn pair và số chart bằng phím chưa có evidence. Đã đổi thành Inconclusive.
- Medium: MK-30/MK-32, MK-62 và MK-45 ghi Passed nhiều hơn evidence; đã tách phần Inconclusive. Commit của từng suite được ghi riêng. Tác động của timeout 5000 ms được ghi. Nguồn `app.ts` và error handler đổi sang commit `caf7ffb`.
- Low: câu "đề xuất" và "dự kiến" còn sót, nhãn mutant Task 1, nguồn của MK-50/MK-59 và MK-61, lượt UTC của MK-43, nhãn lượt UI phụ, lượt thường của API, ID đứng một mình, nguồn của rate limit Better Auth, nguồn `packages/shared` trong `00-system.md`, số đo bị chép sang `10-market-data.md`, checkbox plan và CHANGELOG.

| Lệnh | Kết quả |
| --- | --- |
| `pnpm --filter @crypto-force/web exec playwright test --config playwright.market-data-rest.config.ts --workers=1` trên `caf7ffb` | 24/24 pass. Chạy lại vì `aa22312` sửa hook vẽ chart sau lượt Task 5 |
| `... --config playwright.market-data.config.ts --project=ui --workers=1` trên `caf7ffb` | 9/9 pass |
| `pnpm check:docs`, `git diff --check` | Đạt |

Lượt E2E đầu bị lỗi trước khi chạy test: webServer hết 60 giây và shell trong sandbox không tìm thấy `playwright`. Lượt chạy ngoài sandbox trong bảng mới là evidence. Không chạy `pnpm check`.

## Task 8: Requirements và thiết kế polling

HEAD bắt đầu: `9729616`. Task 8 chỉ sửa tài liệu, không sửa code hoặc testware.

### Phân tích và baseline

Phân tích nằm trong [REST Polling Requirement Gap Analysis](../../../../../testing/test-scopes/TS-002-market-data/rest-polling-requirement-gap-analysis.md). Hai baseline độc lập:

- Bộ use case do subagent viết, chỉ nhận mục tiêu làm mới định kỳ và actor, không đọc file của repo.
- WCAG 2.2 SC 2.2.2 và Understanding SC 2.2.2, đọc ngày 2026-11-22 qua công cụ đọc trang. Nội dung SC 4.1.3 chỉ có bản tóm tắt; mức AA khớp với đối chiếu nguyên văn của Bước 07.

Gap quan trọng nhất là SC 2.2.2, mức A: chart và sidebar tự cập nhật phải có cách tạm dừng. Prototype đã có switch Live updates nhưng requirements chưa có.

### Thay đổi tài liệu

| Tài liệu | Thay đổi |
| --- | --- |
| `docs/UCs/market-data.md` | Use case Theo dõi cập nhật định kỳ: rule MK-63 đến MK-79, luồng ngoại lệ MK-80 đến MK-85, gap MK-86 đến MK-92. MK-53 chuyển Closed |
| `docs/UCs/quality-attributes.md` | QA-12 độ mới dữ liệu, QA-13 request tới Binance theo số client |
| `docs/open-questions.md` | OQ-085 ghi đề xuất giữ 500 nến; thêm OQ-086 chu kỳ theo timeframe |
| `docs/architecture/30-decisions.md` | ADR-007 polling tải lại toàn bộ cửa sổ; ADR-008 giữ lỗi nguồn trong TTL. Cả hai Proposed; ADR-006 giữ Accepted tới khi ADR-008 được duyệt |
| `docs/architecture/10-market-data.md`, `README.md` | Drivers, section Cập nhật định kỳ, observability, quyết định, rủi ro và ma trận driver |
| `docs/testing/test-scopes/TS-002-market-data/README.md` | Trạng thái increment REST polling |

### Kiểm tra source cho thiết kế

- `@tanstack/query-core@5.107.1`: chu kỳ dùng `setInterval`, bỏ lần gọi khi `document.visibilityState` là `hidden`, và dùng lại fetch đang chạy. Thiết kế dựa vào ba hành vi này cho MK-65, MK-76.
- `useCandlestickChart.ts` tại `9729616` gọi `fitContent()`, xóa crosshair và bỏ nến đang chọn mỗi khi dữ liệu đổi. Polling phải sửa chỗ này để đạt MK-68 đến MK-71.
- Tìm `compression`, `zlib`, `gzip` trong `apps/api/src` không có kết quả, nên API không nén response trong source; chưa kiểm proxy. Mảng `candles` của smoke Binance có 519 nến, 63.992 byte JSON; ước tính lưu lượng trong ADR-007 dựa vào số này.

### Quyết định do agent đề xuất

Mọi giá trị do agent đề xuất nằm trong bảng [Quyết định do agent đề xuất](../../../../../testing/test-scopes/TS-002-market-data/rest-polling-requirement-gap-analysis.md#quyết-định-do-agent-đề-xuất). Product owner duyệt toàn bộ bảng ngày 2026-11-22, không đổi giá trị nào. Rule MK-63 đến MK-85, QA-12 và QA-13 chuyển sang Confirmed. ADR-007 và ADR-008 chuyển sang Accepted, ADR-006 chuyển sang `Superseded by ADR-008`. OQ-085 chuyển sang Resolved.

### Review và kiểm chứng

Reviewer độc lập theo skill `review-change` báo 0 finding high, 5 medium và 7 low. Đã sửa tất cả:

- Medium: MK-79 nói cả sidebar nhưng summary không có `dataTime`. Đã giới hạn MK-79 cho chart và ghi lý do trong thiết kế.
- Medium: `refetchOnWindowFocus: true` làm query chưa có dữ liệu tự tải lại khi tab hiện lại, trái MK-82. Đã kiểm source: `shouldFetchOn` gọi `isStale`, và `isStaleByTime` trả `true` khi chưa có `data`. Thiết kế đổi sang hàm chỉ trả `true` khi query có dữ liệu.
- Medium: checkbox review và commit của Task 8 được đánh trước khi làm. Review đã chạy xong; commit tạo ngay sau khi sửa findings, trong cùng thay đổi này.
- Medium: gap đóng bằng rule còn Proposed. Use case và gap analysis ghi rõ quyết định của gap có hiệu lực khi product owner duyệt.
- Medium: use case và QA-13 kể cơ chế của API và lặp phép tính 504 weight. Đã đổi sang hành vi quan sát được và trỏ tới ADR-006.
- Low: lý do của 1 giây ở MK-75, nguồn của bản WCAG đã đọc, tên tài liệu kiểm chứng polling, bảng duyệt là bản sao của giá trị gốc, phạm vi kiểm nén response, các mục baseline chưa có kết quả, đoạn văn lặp diagram.

| Lệnh | Kết quả |
| --- | --- |
| `pnpm exec prettier --write` cho các file đã sửa | Đạt |
| `pnpm check:docs`, `git diff --check` | Đạt |

Không chạy test, vì Task 8 không sửa code hoặc testware. Không chạy `pnpm check`.

## Phần còn lại

Task 1 đã hoàn tất trong commit `396ed0f`. Review của Task 1 không thấy lỗi production. Finding evidence fixture đã xử lý bằng mutant chia MA cho 19 thay 20, rồi khôi phục và chạy Web 10/10. Task 2 đã hoàn tất trong commit `8a68581`. Task 3 đã hoàn tất trong commit `e6e0f97`. Task 4 đã hoàn tất trong commit `31b3175`. Task 5 đã hoàn tất trong commit `b7be50f`. Trạng thái và quyết định của Task 6 nằm tại [Kết quả baseline REST](#task-6-kết-quả-baseline-rest). Task 7 chốt tài liệu REST tải lịch sử. Commit của Task 7 là mốc so sánh REST tải lịch sử. Task 8 chốt requirements và thiết kế polling; product owner duyệt ngày 2026-11-22. Task 9–10 chưa thực hiện. Không đánh dấu Bước 08 hoàn thành.
