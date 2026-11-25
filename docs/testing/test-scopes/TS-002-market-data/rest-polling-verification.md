# Kiểm chứng REST polling

Đọc file này để biết test trước build, nguồn tham chiếu và cách đo baseline REST polling của Realtime.

## Phạm vi

Phạm vi gồm cập nhật định kỳ của chart và sidebar (MK-63 đến MK-85), độ mới (QA-12), tải lên Binance (QA-13) và giữ lỗi nguồn trong TTL (ADR-008). Product owner duyệt các giá trị ngày 2026-11-22 [[1]](#ref-1) [[2]](#ref-2) [[3]](#ref-3). Task 9 viết test trước build; Task 10 đã triển khai, kiểm chức năng và đo baseline [[4]](#ref-4).

Giữ định nghĩa latency HTTP/UI, lỗi, cache hit/miss, nearest-rank percentile, workload, môi trường và cấu trúc evidence của REST tải lịch sử [[5]](#ref-5). Không dùng fake clock để kết luận latency thực tế. Mốc apply chưa chứng minh canvas paint.

## Level, type và technique

Lựa chọn dựa trên rủi ro của Test Strategy [[6]](#ref-6). Bảng trạng thái và expected result lấy từ requirements, không lấy từ code hiện tại.

| Nhóm                           | Level và type                                                                                | Technique và tiêu chí                                                                            |
| ------------------------------ | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Chu kỳ, dataTime, lỗi/phục hồi | Component integration qua hook public, React và QueryClient thật; functional, data integrity | BVA ba giá trị cho chu kỳ; EP timestamp cũ hơn, bằng và mới hơn; state transition lỗi → phục hồi |
| Cache lỗi                      | Component qua public provider; resilience, contract                                          | Pending/error/expired; BVA TTL; cả lỗi invalid/unavailable và lỗi ngoài dự kiến                  |
| Trạng thái trang/chart         | System/E2E qua HTTP API, Auth và DB thật; functional, accessibility                          | Các chuyển trạng thái trong bảng; decision table dữ liệu/lỗi; boundary timeout                   |
| Freshness, bytes, weight       | System performance                                                                           | Replay có timestamp, cùng workload baseline REST; không suy diễn từ test chức năng               |

### Mô hình chuyển trạng thái

Trạng thái cập nhật toàn trang và trạng thái dữ liệu của từng query là hai chiều độc lập. Guard của mỗi dòng xác định sự kiện được xử lý [[1]](#ref-1).

| Trạng thái trước     | Sự kiện hoặc guard     | Kết quả quan sát                                                   | Test                                        |
| -------------------- | ---------------------- | ------------------------------------------------------------------ | ------------------------------------------- |
| Mới mở/reload        | Phiên hợp lệ           | Bật, tải lần đầu                                                   | E2E refresh, E2E reload sau paused          |
| Bật, tab hiện, idle  | Đủ 5 giây              | Chart và sidebar bắt đầu làm mới; thành công đổi dữ liệu/thời điểm | Hook boundary, E2E refresh                  |
| Bật, đang chờ        | Đủ chu kỳ              | Không bắt đầu request chồng                                        | Hook slow, E2E deadline                     |
| Bật                  | Tạm dừng               | Giữ dữ liệu, hiện thời điểm tạm dừng, không bắt đầu request mới    | E2E pause/resume                            |
| Tạm dừng, đang chờ   | Request hoàn tất       | Nhận kết quả, vẫn tạm dừng                                         | E2E in-flight pause                         |
| Tạm dừng             | Tiếp tục, tab hiện     | Bật, bắt đầu trong 1 giây                                          | E2E pause/resume                            |
| Bật, tab hiện        | Tab ẩn                 | Không bắt đầu request; không yêu cầu hủy request đã chạy           | E2E visibility                              |
| Bật, tab ẩn          | Tab hiện               | Bắt đầu trong 1 giây                                               | E2E visibility                              |
| Tạm dừng, tab ẩn     | Tab hiện               | Vẫn tạm dừng, không tự làm mới                                     | E2E paused + hidden                         |
| Bật, có dữ liệu      | Nguồn lỗi hoặc timeout | Giữ dữ liệu/thời điểm, báo lỗi; chu kỳ sau thử lại                 | Hook recovery, E2E recovery/deadline        |
| Bật, báo lỗi làm mới | Nguồn phục hồi         | Hiển thị dữ liệu mới, bỏ lỗi                                       | Hook recovery, E2E recovery                 |
| Chưa có dữ liệu, lỗi | Đủ chu kỳ              | Giữ lỗi và Retry; không tự tải chart                               | E2E initial error                           |
| Chưa có dữ liệu, lỗi | Người dùng Retry       | Tải theo lựa chọn hiện tại                                         | E2E initial error                           |
| Đang làm mới         | Đổi timeframe/pair     | Chỉ hiển thị dữ liệu lựa chọn mới, chu kỳ mới                      | E2E timeframe và pair race                  |
| Đang làm mới         | Phiên hết hạn          | Màn chặn đăng nhập, ngừng cập nhật                                 | E2E session                                 |

Tick khi paused/hidden/pending/initial-error là chuyển trạng thái bị chặn. Không tự thêm hành vi cho sự kiện chưa có trong nguồn. Mục tiêu là bao phủ các dòng trên; test red dừng sớm không chứng minh các assertion phía sau.

### Decision table dữ liệu và lỗi

Hai điều kiện boolean tạo bốn tổ hợp khả thi. Không gộp hoặc loại tổ hợp. Nguồn: lỗi làm mới, timeout và chart chưa có dữ liệu (MK-80 đến MK-82) [[1]](#ref-1).

| Điều kiện/hành động                           | Có dữ liệu, thành công | Có dữ liệu, lỗi       | Chưa có dữ liệu, thành công | Chưa có dữ liệu, lỗi |
| --------------------------------------------- | ---------------------- | --------------------- | --------------------------- | -------------------- |
| Có dữ liệu trước request                      | T                      | T                     | F                           | F                    |
| Request lỗi                                   | F                      | T                     | F                           | T                    |
| Hiển thị response mới và dataTime             | Có                     | Không                 | Có                          | Không                |
| Giữ dữ liệu và dataTime cũ                    | Không                  | Có                    | Không áp dụng               | Không áp dụng        |
| Hiển thị lỗi                                  | Không                  | Có                    | Không                       | Có                   |
| Tự tải chart ở chu kỳ sau khi bật và tab hiện | Có                     | Có                    | Có                          | Không                |
| Test                                          | E2E refresh            | E2E recovery/deadline | E2E mở trang                | E2E initial error    |

### Biên thời gian và dữ liệu

- Chu kỳ: elapsed nguyên millisecond dưới 5000 chưa có request; tại 5000 và sau 5000 bắt đầu request khi idle. Kiểm 4999/5000/5001 (MK-63, MK-64). Tính elapsed từ lần bắt đầu request trước, không từ lúc assert hoàn tất.
- Cache lỗi: pending chưa có expiry. Provider reject ở clock 2000; read ở 6999 nhận lỗi cũ, read ở 7000 gọi provider mới. Summary kiểm riêng 4999/5000/5001 kể từ reject. TTL lấy từ quyết định giữ lỗi (ADR-008) [[3]](#ref-3).
- Timeout chart: các biên 9999/10000/10001 ms vẫn lấy oracle từ REST tải lịch sử [[5]](#ref-5). E2E polling thêm giữ dữ liệu và không chồng trước deadline. Không tăng timeout để chữa lỗi sản phẩm.
- Response `dataTime` cũ hơn bị bỏ, bằng hoặc mới hơn được nhận (MK-79). Hook dùng snapshot 1800000000000, cũ 1799999999999, mới 1800000000001 và bằng 1800000000000. Agent chọn epoch tổng hợp và khoảng cách 1 ms để phân biệt các partition; không đổi ngưỡng sản phẩm.

## Ma trận requirement → phép kiểm

Tên rút gọn trỏ tới file trong mục Harness. Kết quả thực chạy của từng requirement nằm trong [Kết quả Task 10](#kết-quả-task-10).

| Requirement | Nội dung                                     | Phép kiểm và oracle                                                                                                        | Giới hạn                                              |
| ----------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| MK-63       | Chart chu kỳ 5 giây                          | Hook boundary, E2E refresh; số request, close 618 → 628                                                                    | Dùng clock giả ở test chức năng                       |
| MK-64       | Sidebar chu kỳ 5 giây                        | Hook boundary, E2E refresh; Last price 618 → 628                                                                           | Dùng clock giả ở test chức năng                       |
| MK-65       | Không chồng request                          | Hook slow, E2E deadline, ledger HTTP vào API                                                                               | Không lấy upstream count thay browser count           |
| MK-66       | Đổi thời điểm dữ liệu                        | E2E refresh; Data time đổi                                                                                                 | Epoch API từ control clock                            |
| MK-67       | Tối đa 500 nến, bỏ nến cũ nhất               | E2E rollover advance 300000 ms; series apply có 500 điểm, openTime đầu/cuối dịch một interval, warm-up vẫn 19; ảnh canvas  | Apply chưa chứng minh paint của mọi frame             |
| MK-68       | Giữ vùng xem                                 | E2E zoom/kéo, ảnh trục thời gian trước/sau refresh cùng lựa chọn                                                           | Không export chart API chỉ cho test                   |
| MK-69       | Nến mới trong vùng xem khi đang xem nến cuối | E2E kéo tới cuối (End), rollover một interval, ảnh trục thời gian trước/sau                                                | Kiểm trên Chromium local                              |
| MK-70       | Giữ focus                                    | E2E keyboard selection và kiểm `playwright-cli` pause/resume bằng Space                                                    | Kiểm trên Chromium local                              |
| MK-71       | Giữ thông tin nến đang chỉ                   | E2E keyboard selection và kiểm `playwright-cli` hover chuột qua refresh kèm ảnh                                            | Chưa kiểm thao tác chạm                               |
| MK-72       | Thành công không thông báo                   | E2E keyboard selection, mutation DOM của live region trong refresh thành công                                              | Không kiểm tiếng screen reader                        |
| MK-73       | Một điều khiển pause/resume mọi query        | E2E pause/resume, ledger, kiểm phím Space bằng `playwright-cli`                                                            | Kiểm trên Chromium local                              |
| MK-74       | Paused at có thời điểm                       | E2E pause/resume kiểm nhãn có giây theo thời điểm tạm dừng                                                                 | Kiểm trên múi giờ thiết bị local                      |
| MK-75       | Tiếp tục trong 1 giây                        | E2E pause/resume, clock chạy 999 ms rồi flush UI                                                                           | Dùng clock giả trong E2E                              |
| MK-76       | Không refresh khi tab ẩn                     | E2E visibility, ledger API không tăng                                                                                      | Driver phát visibilitychange, chưa thay chuyển tab UI |
| MK-77       | Tab hiện lại làm mới trong 1 giây            | E2E visibility                                                                                                             | Cùng giới hạn với visibilitychange                    |
| MK-78       | Mở/reload mặc định bật                       | E2E refresh/pause và reload sau khi tạm dừng                                                                               | Không lưu pause qua reload                            |
| MK-79       | Bỏ dữ liệu cũ hơn                            | Hook older/equal/newer qua public hook                                                                                     | Không assert query option                             |
| MK-80       | Lỗi giữ dữ liệu, phục hồi bỏ lỗi             | Hook recovery; E2E recovery cả chart/sidebar                                                                               | Data time giữ nguyên khi lỗi                          |
| MK-81       | Timeout như lỗi làm mới                      | E2E deadline, dữ liệu còn và status lỗi                                                                                    | Clock page, hold trước API                            |
| MK-82       | Chart chưa có dữ liệu không tự retry         | E2E initial error, đếm request chart, Retry giữ focus                                                                      | Sidebar tách khỏi số đếm                              |
| MK-83       | Đổi lựa chọn khi đang refresh                | E2E timeframe race và pair race                                                                                            | Kiểm trên replay local                                |
| MK-84       | Phiên hết hạn                                | E2E session, sign-out từ context khác, màn chặn và ledger đứng                                                             | Cookie browser vẫn gửi                                |
| MK-85       | Pause khi đang refresh                       | E2E in-flight pause, release đổi giá rồi ledger đứng                                                                       | Nhận response còn hợp lệ                              |
| QA-12       | Freshness p95 dưới 11 giây                   | Protocol nguồn tham chiếu bên dưới                                                                                         | Chưa có bằng chứng canvas paint (Inconclusive)        |
| QA-13       | Tối đa 504 weight/phút                       | Protocol load bên dưới, cả thành công/lỗi                                                                                  | 1/10 client đạt; 50 client quá tải host (Inconclusive)|

## Harness và cách chạy

| Phạm vi    | File và lệnh từ repo root                                                                                                                                             |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hook       | `apps/web/app/hooks/useMarketData.polling.test.ts`; `pnpm --filter @crypto-force/web exec vitest run app/hooks/useMarketData.polling.test.ts`                         |
| Cache lỗi  | `apps/api/test/market-data/polling-cache.test.ts`; `pnpm --filter @crypto-force/api exec vitest run test/market-data/polling-cache.test.ts`                           |
| E2E        | `apps/web/e2e/market-data/rest-polling.spec.ts`; `pnpm --filter @crypto-force/web exec playwright test --config playwright.market-data-polling.config.ts --workers=1` |
| Regression | Suite API Market Data cũ, shared market-data và E2E `playwright.market-data-rest.config.ts`, từng spec với một worker; test mới red chạy riêng                        |

Hook dùng `happy-dom`, `react-dom/client`, React `act`, router bộ nhớ và QueryClient thật. Chỉ thay fetch boundary. Probe đọc data/error trong render để đăng ký cập nhật hook. Clock giả chạy timer thông báo của QueryClient; flush 1 ms không phải chờ thời gian thật. Không export helper production hoặc mock module app.

E2E dùng `apps/api/test/support/market-data-rest-server.ts`, cổng API 3015/control 3016 và Web 5185. Hai suite dùng DB dẫn xuất `_market_data_rest_test`; không chạy đồng thời. Auth dùng đồng hồ thật, polling/cache dùng clock riêng. Email vào bộ nhớ. MSW tắt, service worker bị chặn, browser không intercept response Market Data.

Replay `polling` có epoch gốc 1800000000000. Nến căn interval, nến cuối đang mở. Close cuối của các timeframe mặc định và summary là 618 tại gốc, 628 sau 5000 ms, 638 sau 10000 ms. Riêng timeframe 1d cộng 100 vào close, nên sau 5000 ms trả 728 để test phân biệt dữ liệu 1d với 5m. Agent chọn input tổng hợp này để response đổi trong cùng nến. Endpoint loopback `/__rest/polling` đổi elapsed/failure/hold, không xóa cache. `/__rest/reset/polling` xóa trạng thái giữa test. `pollingRequests` đếm request trước cache; ledger upstream đếm request sau cache. Hold dừng trước API để kiểm timeout Web mà không chờ timeout Node thật.

Phép kiểm driver phải chứng minh response đầu đúng, nến đổi theo clock, trả 503 khi nguồn lỗi và phục hồi. Làm hỏng từng boundary trước khi dùng kết quả green tương ứng: replay không đổi close; nguồn luôn thành công; visibility event không đổi trạng thái; hold trả ngay; nguồn trả timestamp cũ. Chỉ tính độ nhạy khi assertion hành vi fail. Ghi phép đã chạy vào execution; phép chưa chạy không được gọi là đã kiểm.

## Protocol đo freshness, dữ liệu cũ và bytes

Dùng workload 1/10/50 client, lựa chọn mặc định, cùng môi trường và cách lặp baseline REST [[5]](#ref-5). Giữ riêng cohort thành công, lỗi, cache nóng/lạnh; không gộp percentile. Commit runner, manifest, lịch replay và điều kiện pass trước lượt đo. Task 9 thiết kế protocol; Task 10 tạo và chạy runner.

Nguồn tham chiếu là HTTP replay đi qua Binance adapter với lịch đổi nến đang mở biết trước. Mỗi thay đổi có `eventId`, pair/timeframe/openTime, OHLCV, `sourceAvailableAt` và timestamp đơn điệu của nguồn. Lịch đổi lệch pha polling/TTL để không chỉ đo trường hợp thuận lợi. Manifest ghi lịch, phase, seed nếu có và hash dữ liệu. Không dùng `dataTime` của response thay thời điểm nguồn có giá mới.

Web ghi eventId và mốc vẽ dữ liệu tương ứng. Runner đối chiếu OHLCV/openTime rồi xác nhận canvas qua ảnh và sự kiện render của chart hoặc observer ngoài đã kiểm độ nhạy. `market-data:apply` chỉ là apply. Chưa có evidence paint thì freshness là Inconclusive.

Đồng bộ clock nguồn/browser bằng mốc đơn điệu cùng host, ghi sai số trước/sau lượt đo. Không xác định được sai số phù hợp với độ phân giải phép đo thì ghi Inconclusive. Fake clock chỉ dùng test chức năng. Mỗi event có một mẫu cho mỗi client/chart đang hiện. Draw phiên bản mới hơn cùng series có thể hoàn tất mẫu event cũ nếu oracle xác nhận đúng dữ liệu; ghi event bị thay thế. Không đòi chart vẽ mọi phiên bản trung gian. Giữ mẫu thiếu/censored khi chưa có draw thay thế, không loại để giảm p95.

| Chỉ số                     | Công thức và điểm đọc                                                                                                                                                                       | Điều kiện kết luận                                                                                                               |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Freshness                  | `drawAt(event hoặc phiên bản thay thế mới hơn, client) - sourceAvailableAt(event)`; nguồn có dữ liệu mới → canvas vẽ đúng phiên bản đó hoặc mới hơn; nearest-rank p95                       | p95 < 11000 ms cho QA-12 khi bật, tab hiện, nguồn bình thường. Thiếu paint/mẫu chưa giải trình thì Inconclusive                  |
| Tỷ lệ thời gian dữ liệu cũ | Tích phân chỉ báo `sourceVersion(t - 11000) > drawnVersion(t)`, chia thời gian quan sát đủ điều kiện rồi nhân 100%. Version tăng theo lịch nguồn của cùng series; draw mới thay thế draw cũ | Ngưỡng cũ 11000 ms lấy từ QA-12. Báo mô tả, chưa có ngưỡng pass riêng. Không suy ra từ p95                                       |
| Bytes/client/phút          | Tổng `Network.loadingFinished.encodedDataLength` tại browser cho Market Data trong cửa sổ đo, chia client-minute; gồm request lỗi. Ghi nghĩa byte và version CDP đã kiểm                    | Tách cold load và steady polling, compression/protocol. Chưa có ngưỡng pass. Không lấy kích thước JSON nguồn thay bytes browser  |
| Weight/phút                | Tổng weight request mà replay nhận từ API trong từng cửa sổ trượt nửa mở `[t, t + 60000)` ms; đối chiếu log adapter/ledger nguồn                                                            | Mọi cửa sổ đủ thời lượng của workload 1/10/50, cả thành công/lỗi, không quá 504 (QA-13). Không tính browser request thành weight |

Cuối lượt đo tiếp tục thu đủ để thấy kết quả event cuối nhưng không đổi mẫu số cửa sổ chính. Báo riêng thời gian paused/hidden/lỗi nguồn, request hủy, mẫu thiếu và khoảng không có tham chiếu. Tỷ lệ dữ liệu cũ chỉ có mẫu số khi nguồn quan sát được. Không kết luận QA-12 đạt trong cohort lỗi nguồn.

Artifacts: manifest môi trường/commit/version, timeline nguồn, request browser/bytes, draw samples, cache ledger, upstream weight ledger, lỗi/mẫu thiếu, nearest-rank summary và reconciliation. Kết quả nêu phạm vi đã kiểm và phần Inconclusive [[5]](#ref-5).

## Runner baseline của Task 10

Runner `apps/api/perf/market-data/polling-baseline.mjs` dùng Chromium với Web production build. API, Auth, session và PostgreSQL là thành phần thật. HTTP replay đi qua Binance adapter, cùng entrypoint perf và môi trường loopback của baseline REST [[5]](#ref-5). Client browser thay bộ phát tải HTTP để đo được bytes tại browser. Không dùng số đo này làm kết quả latency k6 hoặc production capacity.

Cấu hình đóng băng trong `apps/api/perf/market-data/polling-config.json`: workload mặc định, 1/10/50 client, mỗi cohort thành công hoặc lỗi có ba lần lặp. Thời gian warm-up 30 giây và steady 180 giây lấy từ baseline REST [[5]](#ref-5). Runner thu thêm 15 giây cuối để giữ mẫu trễ. Phase 1379 ms và chu kỳ nguồn 7000 ms là input tổng hợp do agent chọn để tránh trùng nhịp polling. Replay dùng clock đơn điệu, giữ timeline qua warm-up. Lần tải đầu của từng client được phân loại theo request đầu của mỗi URL, không theo một mốc chung cho mọi client.

Mỗi lần lặp dùng cache rỗng ở đầu cohort. Các client tạo sau có thể nhận cache hit trong giai đoạn chuẩn bị. Measurement steady chỉ bắt đầu sau khi mọi client tải xong và qua warm-up. Cache không bị xóa ở ranh giới warm-up/steady. Cohort lỗi đổi nguồn sang 503 khi bắt đầu steady; dữ liệu đã nhận còn được giữ trên chart. Ledger nguồn và response reconciliation gồm cả request thành công và lỗi.

Manifest lưu commit, diff hash, lockfile hash, Web build hash, source hash, cấu hình máy, database và phiên bản browser. `window.json` lưu chính xác mốc đầu/cuối steady theo clock runner và nguồn. Source timeline, mẫu apply, bytes CDP, clock exchanges, lỗi và mẫu thiếu được giữ riêng. Clock exchange có biên round-trip trước/sau lượt đo. Runner chưa có bằng chứng paint, nên freshness và tỷ lệ thời gian dữ liệu cũ là `Inconclusive`. `applyReceivedDelay` chỉ là số mô tả tới lúc runner nhận apply, không thay cho thời gian canvas vẽ.

Các lượt `polling-v1-success-1-r0` và `polling-preflight-v2-success-1-r0` là preflight. Lượt đầu có một response reconciliation sai do reset version của nguồn. Lượt thứ hai có 60 response hợp lệ và 12 apply hợp lệ. Cả hai không thuộc baseline chính thức. Review sau preflight phát hiện cách phân loại bytes tải đầu và oracle summary chưa đủ. Hai lỗi được sửa tại module sở hữu và có test bắt mutant. Preflight v3 và v4 kiểm bản sửa trước khi đo chính thức. Lượt v4 có đủ pair/timeframe/openTime/OHLCV cho từng event nguồn, 60 response hợp lệ, 12 apply hợp lệ và không có browser error.

Lượt `polling-v1-success-1-r1` đã bị dừng sau khi bắt đầu steady vì runner chưa lưu ranh giới cửa sổ đo. Raw logs và `termination.json` được giữ. Lượt này Inconclusive và không thuộc baseline. Cohort `polling-v2` bổ sung `window.json` trước khi chạy lại; không đổi workload hoặc ngưỡng.

Lệnh dựng và chạy:

```powershell
pnpm --filter @crypto-force/web build
pnpm --filter @crypto-force/api exec tsx perf/market-data/server.mjs --polling
node apps/api/perf/market-data/polling-baseline.mjs --smoke
node apps/api/perf/market-data/polling-baseline.mjs
```

Lệnh server chạy ở terminal riêng. Credentials của 50 tài khoản test đã có từ baseline REST, nằm trong `node_modules/.cache/market-data-perf/credentials.json`. File này không được đưa vào Git. Bộ test runner chạy bằng `node --test apps/api/perf/market-data/polling.test.mjs` và không cần database.

## Kết quả Task 9

Test, regression, kiểm tra tĩnh, driver fault và review của Task 9 nằm trong execution [[7]](#ref-7). Tại thời điểm kết thúc Task 9 (`5d49818`), polling chưa build và baseline chưa đo.

## Kết quả Task 10

Bản triển khai và runner được đóng băng tại commit `77036dc` và `2709f3b` (bổ sung `window.json`). Evidence chức năng, mutation và ảnh trình duyệt nằm trong [`rest-polling-task-10/`](../../evidence/market-data/rest-polling-task-10/functional-results.json).

### Kiểm chức năng và mutation

| Phạm vi | Kết quả |
| --- | --- |
| Web Vitest (`apps/web`) | 18/18 pass, gồm 8 test hook polling và 10 test Web cũ |
| API Market Data (`apps/api/test/market-data`) | 96/96 pass (90 test cũ + 6 test cache polling ADR-008); lượt `--sequence.shuffle` cũng 96/96 |
| E2E polling (`playwright.market-data-polling.config.ts`, `--workers=1`) | 15/15 pass (11 test Task 9 + 4 test bổ sung: reload sau pause, pause khi tab ẩn, đổi pair race, rollover/viewport) |
| E2E REST history (`playwright.market-data-rest.config.ts`, `--workers=1`) | 24/24 pass |
| E2E mock UI và MSW (`playwright.market-data.config.ts`, `--workers=1`) | 9/9 mock UI pass, 1/1 MSW pass |
| Test runner baseline (`apps/api/perf/market-data/polling.test.mjs`) | 3/3 pass |
| Mutation và driver fault | 17/17 mutant/fault làm assertion liên quan fail rồi khôi phục green (3 unit, 6 E2E ban đầu, 5 E2E bổ sung, 3 runner) |

Không cộng các lượt chạy lại hoặc lượt mutation vào số test trên. Không chạy `pnpm check` hoặc toàn bộ test của repository.

### Kết quả theo requirement

| Requirement | Kết quả | Evidence và giới hạn |
| --- | --- | --- |
| MK-63, MK-64, MK-65, MK-66 | Passed | Hook polling 8/8, E2E polling 15/15, mutant chu kỳ 6000 ms bị bắt |
| MK-67, MK-68, MK-69 | Passed | E2E rollover 300000 ms, ảnh trục thời gian trước/sau rollover và End (`historical-axis-*.png`, `tail-*.png`, `rollover-canvas.png`), mutant `fitContent` và không theo tail bị bắt |
| MK-70, MK-71 | Passed với bàn phím và chuột | E2E keyboard selection, kiểm `playwright-cli` giữ hover và focus (`hover.png`). Thao tác chạm chưa kiểm |
| MK-72 | Passed ở mức khai báo | E2E mutation DOM live region rỗng khi refresh thành công, mutant thông báo thành công bị bắt. Không kiểm screen reader |
| MK-73, MK-74, MK-75, MK-78 | Passed | E2E pause/resume, reload sau paused, `playwright-cli` phím Space giữ focus, mutant mặc định paused và bỏ refresh khi resume bị bắt |
| MK-76, MK-77 | Passed ở mức boundary visibility | E2E visibility và tổ hợp paused + hidden, mutant polling khi hidden và driver no-op bị bắt. Chưa kiểm chuyển tab trên trình duyệt có giao diện |
| MK-79 | Passed | Hook older/equal/newer, mutant nhận snapshot cũ hơn bị bắt |
| MK-80, MK-81, MK-82, MK-83, MK-84, MK-85 | Passed | Hook recovery, E2E recovery/deadline/initial-error/timeframe-pair race/session/in-flight pause, mutant ẩn dữ liệu khi lỗi, hold trả ngay và bỏ đổi pair bị bắt |
| ADR-008 (giữ lỗi nguồn trong TTL) | Passed | API `polling-cache.test.ts` 6/6 (lượt thường và shuffle), mutant xóa lỗi ngay bị bắt; baseline lỗi 1 và 10 client giữ `maxSliding60sWeight = 120` |
| QA-12 (độ mới p95 dưới 11 giây) | Inconclusive | Runner chỉ đo tới `market-data:apply` (`applyReceivedDelay`), chưa chứng minh canvas paint; clock exchange còn sai số round-trip |
| Tỷ lệ thời gian dữ liệu cũ | Inconclusive | Phụ thuộc mốc vẽ canvas giống QA-12 |
| QA-13 (tối đa 504 weight/phút) | Inconclusive | Đạt ở mức 1 và 10 client (mọi lượt đều 120 ≤ 504, cả thành công và lỗi). Mức 50 client quá tải máy đo local trước warm-up nên chưa có cửa sổ steady đủ 180 giây |

### Kết quả baseline polling (`polling-v2`)

Môi trường: Windows local (`commit 2709f3b`), Web production build, API + HTTP replay (50 ms delay) + Docker PostgreSQL + Chromium chạy cùng một host, HTTP/1.1 loopback không nén. Mỗi lượt gồm 30 giây warm-up, 180 giây steady và 15 giây tail. Toàn bộ 12 lượt hoàn tất đều đã đối chiếu độc lập lại `maxSliding60sWeight`, `upstreamRequests` và `encodedBytes` từ `window.json`, `upstream.jsonl` và `bytes.json.gz`: khớp 100%, 0 response sai, 0 apply sai, 0 browser error, 0 outbound ngoài dự kiến.

| Lượt (`docs/testing/evidence/market-data/<run>/`) | Client | Nguồn | Upstream req | Max weight / 60s | QA-13 | Reconciled (invalid) | Initial bytes | Steady bytes / client / phút | Apply delay p50 / p95 / p99 (ms) | Missing applies | Max clock RTT (ms) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `polling-v2-success-1-r1` | 1 | Bình thường | 179 | 120 | Passed | 225 (0) | 226.244 | 2.696.113 | 2536 / 4917 / 5087 | 0 | 18,6 |
| `polling-v2-success-1-r2` | 1 | Bình thường | 179 | 120 | Passed | 225 (0) | 226.244 | 2.714.928 | 2641 / 4987 / 5136 | 0 | 2,6 |
| `polling-v2-success-1-r3` | 1 | Bình thường | 180 | 120 | Passed | 225 (0) | 226.244 | 2.714.928 | 2637 / 5016 / 5138 | 0 | 4,8 |
| `polling-v2-error-1-r1` | 1 | Lỗi 503 | 179 | 120 | Passed | 225 (0) | 226.244 | 30.490 | — | 100 | 6,3 |
| `polling-v2-error-1-r2` | 1 | Lỗi 503 | 180 | 120 | Passed | 225 (0) | 226.244 | 30.660 | — | 100 | 12,1 |
| `polling-v2-error-1-r3` | 1 | Lỗi 503 | 180 | 120 | Passed | 225 (0) | 226.244 | 30.660 | — | 100 | 6,1 |
| `polling-v2-success-10-r1` | 10 | Bình thường | 175 | 120 | Passed | 2280 (0) | 2.262.440 | 2.647.070 | 3798 / 6606 / 7430 | 0 | 23,2 |
| `polling-v2-success-10-r2` | 10 | Bình thường | 174 | 120 | Passed | 2275 (0) | 2.262.440 | 2.667.673 | 3558 / 6520 / 7511 | 0 | 13,9 |
| `polling-v2-success-10-r3` | 10 | Bình thường | 175 | 120 | Passed | 2290 (0) | 2.262.440 | 2.673.411 | 3810 / 6794 / 7816 | 0 | 22,2 |
| `polling-v2-error-10-r1` | 10 | Lỗi 503 | 175 | 120 | Passed | 2285 (0) | 2.262.440 | 44.907 | — | 1040 | 37,8 |
| `polling-v2-error-10-r2` | 10 | Lỗi 503 | 175 | 120 | Passed | 2288 (0) | 2.262.440 | 67.531 | — | 1000 | 22,0 |
| `polling-v2-error-10-r3` | 10 | Lỗi 503 | 175 | 120 | Passed | 2285 (0) | 2.262.440 | 56.211 | — | 1040 | 43,5 |

**Mức 50 client (`polling-v2-success-50-r1`):** dừng ở pha khởi tạo trước warm-up (`locator.waitFor: Timeout 30000ms exceeded` cho `Chart 4 values`). Raw logs (`api.jsonl`, `resources.jsonl`, `reconciliation.jsonl`, `upstream.jsonl`) và [`termination.json`](../../evidence/market-data/polling-v2-success-50-r1/termination.json) được giữ lại. Mở tuần tự 50 Chromium context thật trên cùng máy Windows mất 192,9 giây trong khi các tab mở trước đã polling 5 giây/lần, làm bão hòa host: trong `resources.jsonl` (161 mẫu), PostgreSQL pool đạt đỉnh `waiting = 143` (mẫu cuối `connections = 10, waiting = 103`), Node event loop `eventLoopP95Ms` đạt đỉnh `1325,4 ms` (mẫu cuối `590,9 ms`); HTTP nearest-rank `p50 = 5182 ms, p95 = 10120 ms` (vượt hạn chờ 10 giây của chart), `max = 16047 ms`. Trong khoảng đó, 2953/2953 response Market Data vẫn hợp lệ và chỉ có 158 request upstream. Product owner duyệt ngày 2026-11-23 giữ 12 lượt 1/10 client đã hoàn tất, giữ evidence lỗi của lượt 50 client và ghi QA-13 ở mức 50 client (và tổng thể QA-13) là `Inconclusive`.

**Kết luận baseline:**
- **QA-12 và tỷ lệ thời gian dữ liệu cũ:** `Inconclusive`. `applyReceivedDelay` p95 đạt 4917–5016 ms ở 1 client và 6520–6794 ms ở 10 client (chỉ mang tính mô tả tới mốc apply, không chứng minh canvas paint).
- **QA-13:** đạt ở 1 và 10 client (120 weight/60 giây ≤ 504, không đổi giữa 1 và 10 client, cả nguồn bình thường và nguồn lỗi); `Inconclusive` ở 50 client do chưa hoàn thành cửa sổ steady trên máy local → **tổng thể QA-13 là `Inconclusive`**.
- **Bytes/client/phút (mô tả, HTTP/1.1 loopback không nén):** 2,65–2,71 MB/client/phút khi nguồn bình thường; 30,5–67,5 KB/client/phút khi nguồn lỗi 503; tải đầu 226.244 bytes/client.

### Phần chưa kiểm

- Bằng chứng canvas paint thực tế và độ trễ đồng bộ clock cho QA-12 và tỷ lệ thời gian dữ liệu cũ.
- Baseline polling ở mức 50 client trên môi trường tách máy phát tải khỏi API/DB (hoặc VPS).
- Chuyển tab trên trình duyệt có giao diện thật (E2E phát `visibilitychange` qua boundary).
- Thao tác chạm khi hover nến qua refresh (MK-71) và tiếng đọc screen reader (MK-72, theo quyết định của product owner).

## References

1. <a id="ref-1"></a>[Market Data — cập nhật định kỳ](../../../UCs/market-data.md)
2. <a id="ref-2"></a>[Quality Attributes](../../../UCs/quality-attributes.md)
3. <a id="ref-3"></a>[Architecture Decisions](../../../architecture/30-decisions.md)
4. <a id="ref-4"></a>[Bước 08 — Task 9 và Task 10](../../../build/01-prototype-to-implementation/market-data/implementation/work/step-08-rest-build/plan.md)
5. <a id="ref-5"></a>[Kiểm chứng REST tải lịch sử](rest-verification.md)
6. <a id="ref-6"></a>[Test Strategy](../../test-strategy.md)
7. <a id="ref-7"></a>[Execution Bước 08](../../../build/01-prototype-to-implementation/market-data/implementation/work/step-08-rest-build/execution.md)
