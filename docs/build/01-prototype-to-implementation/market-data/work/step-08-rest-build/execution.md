# Kết quả build REST Market Data

Đọc file này để biết kết quả thực chạy và phần còn lại của Bước 08.

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

## Phần còn lại

Task 1 đã hoàn tất trong commit `396ed0f`. Review của Task 1 không thấy lỗi production. Finding evidence fixture đã xử lý bằng mutant chia MA cho 19 thay 20, rồi khôi phục và chạy Web 10/10. Task 2 đã hoàn tất trong commit `8a68581`. Task 3 đã hoàn tất kiểm chứng và review. Task 4–10 chưa thực hiện. Ba quyết định vận hành của Task 6 đang chờ product owner duyệt. Không đánh dấu Bước 08 hoàn thành.
