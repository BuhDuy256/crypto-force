# Defect Reports

Đọc file này để biết các anomaly TS-001 đã phát hiện ở Phase 05, thông tin để tái hiện và xử lý từng anomaly, và kết quả kiểm tra sau khi sửa. Mọi anomaly dưới đây đang ở trạng thái Open. Chưa có bản sửa, nên chưa có confirmation testing.

## 1. Phạm vi

| Trường | Nội dung |
| --- | --- |
| Đối tượng được kiểm thử | Commit `7cdb0f5`, `better-auth@1.7.25`. DEF-19 phát hiện ở RUN-007 trên `b35a791`; từ `b35a791` đến `7cdb0f5` không có commit đổi code sản phẩm |
| Nơi quản lý defect | File này. Dự án chưa có tracker; Phase 05 giữ báo cáo trong repo |
| Định nghĩa severity và priority | Thang mặc định của skill `test-defect-classification` [[5]](#ref-5): Critical, Major, Minor, Trivial. Severity ở đây là đề xuất của tester từ evidence. Product owner duyệt severity và nguyên nhân Product của DEF-01 đến DEF-19 ngày 2026-11-19 (tin nhắn trong session). Priority do agent đặt theo severity (Major: Cao, Minor: Trung bình, Trivial: Thấp), theo ủy quyền của product owner |
| Thời điểm chốt | 2026-11-19 08:25 (UTC+7) |

## 2. Danh sách anomaly

Nguyên nhân của mọi dòng là Product, theo phân tích ở Test Log mục 2.4 [[6]](#ref-6). Phân tích này dựa trên hai điều: testware đã được kiểm ở Phase 04, và mỗi test fail trùng với một dấu hiệu ở Implementation Status mục 4.1 [[4]](#ref-4). Product owner duyệt nguyên nhân Product và severity của mọi dòng ngày 2026-11-19; priority đặt theo severity, theo ủy quyền của product owner (Execution Status TD-21).

| ID | Tiêu đề | Nguyên nhân | Severity / priority | Trạng thái | Run IDs phát hiện |
| --- | --- | --- | --- | --- | --- |
| DEF-01 | Sign in khóa sau 5 lần trong 15 phút, không phải 3 lần trong 10 giây; UI không hiện thông báo khóa | Product | Major / Cao | Open | RUN-012, RUN-013 |
| DEF-02 | Sign in lại khi đang có phiên không hủy token cũ | Product | Major / Cao | Open | RUN-012 |
| DEF-03 | Không có thời hạn tuyệt đối 30 ngày của phiên | Product | Major / Cao | Open | RUN-012 |
| DEF-04 | Phiên và link reset còn được chấp nhận đúng tại thời điểm hết hạn | Product | Minor / Trung bình | Open | RUN-012 |
| DEF-05 | Đặt password bằng một link reset không làm các link reset khác hết hiệu lực | Product | Major / Cao | Open | RUN-012 |
| DEF-06 | Không kiểm danh sách password phổ biến và Pwned Passwords; không ghi cảnh báo khi API lỗi | Product | Major / Cao | Open | RUN-012 |
| DEF-07 | API đếm độ dài password theo UTF-16 thay vì code point | Product | Minor / Trung bình | Open | RUN-012 |
| DEF-08 | Schema form không giới hạn password 128 ký tự và Full name 100 ký tự | Product | Minor / Trung bình | Open | RUN-012, RUN-013 |
| DEF-09 | Mở link xác minh của B khi đang đăng nhập A chuyển phiên sang B, không có thông báo | Product | Major / Cao | Open | RUN-013 |
| DEF-10 | Link xác minh lỗi: không có cách gửi lại link; khi có phiên thì không có thông báo lỗi | Product | Minor / Trung bình | Open | RUN-013 |
| DEF-11 | Form Forgot password và Choose a new password không có danh sách lỗi | Product | Minor / Trung bình | Open | RUN-013 |
| DEF-12 | New password trống báo "Use at least 8 characters." thay vì "Fill in both fields." | Product | Trivial / Thấp | Open | RUN-013 |
| DEF-13 | Google trả lỗi thì email đã nhập ở form Sign in bị mất | Product | Minor / Trung bình | Open | RUN-013 |
| DEF-14 | Email "You already have an account" gửi cho tài khoản chưa xác minh không hướng dẫn xác nhận email | Product | Minor / Trung bình | Open | RUN-013 |
| DEF-15 | Tải lại Check your email vẫn ở Check your email | Product | Minor / Trung bình | Open | RUN-013 |
| DEF-16 | Reset password bắt đầu từ màn chặn Backtest mở Realtime sau Sign in | Product | Minor / Trung bình | Open | RUN-013 |
| DEF-17 | Response của API không có `X-Content-Type-Options`, `Referrer-Policy`, CSP `frame-ancestors` | Product | Minor / Trung bình | Open | RUN-013 |
| DEF-18 | Trang có token reset không đặt `Referrer-Policy: no-referrer` | Product | Major / Cao | Open | RUN-013 |
| DEF-19 | Google với email của tài khoản chưa xác minh: Auth hiện thông báo chung thay vì báo email đã đăng ký | Product | Minor / Trung bình | Open | RUN-007 (AN-02) |

Hai anomaly không phải defect nằm ở Test Log mục 2.1: BL-01 (Resend chế độ test, nguyên nhân Environment) và AN-01 (setup sai, nguyên nhân Test). Hai ghi chú để quyết định sau, chưa phải defect: khi Resend từ chối gửi, Auth vẫn hiện "Check your email" (Test Log mục 2.1); TC-200 và TC-209 ghi nguồn không khớp ở DV-03 (Test Log mục 2.3).

## 3. Nội dung một report

Mọi report dùng chung các giá trị sau, nên chúng không lặp lại trong từng report.

| Trường | Giá trị chung |
| --- | --- |
| Ngày phát hiện / người báo cáo | 2026-11-19; agent (tester), kết quả theo output của Vitest và Playwright. DEF-19: product owner chạy PROC-17, agent đọc log, database và video |
| Đối tượng và môi trường | Commit `7cdb0f5`; Windows 11; Node.js `>=22.22`; PostgreSQL của `pnpm db:up`. Report API/shared: ENV-01 (`pnpm test`). Report E2E: ENV-02 và ENV-07 (`pnpm test:e2e`, hai server E2E, `--workers=2`) |
| Trạng thái ban đầu | Cơ sở dữ liệu `_test` hoặc `_e2e` tạo lại từ migration; không có tài khoản nào ngoài tài khoản test tạo trong từng test; `RESEND_API_KEY` trống; email in ra console |
| Cách tái hiện | Chạy đúng một test case: `pnpm --filter @crypto-force/api exec vitest run -t "TC-xxx"` (DEF-08 phần C: `--filter @crypto-force/shared`), hoặc `pnpm --filter @crypto-force/web exec playwright test --grep "TC-xxx"`. Input và dữ liệu chính xác nằm ở cột "Input" của test case trong Test Cases [[3]](#ref-3). Test tạo dữ liệu riêng, nên không cần dữ liệu nào có sẵn |
| Evidence | Output thô: EV-012 (RUN-012) và EV-013 (RUN-013) ở `05-execution/evidence/`. Không có secrets hoặc email thật |

Mỗi report dưới đây ghi phần riêng: test case, expected (nguồn), actual và severity. Phần "Actual" gồm kết quả đo trong lượt chạy này, nếu có, và hành vi mô tả ở Implementation Status mục 4.1 [[4]](#ref-4), ghi từ dry run `b4ca981`. Chỗ nào chỉ có mô tả của mục 4.1 thì ghi "mục 4.1".

### DEF-01: Sign in khóa sau 5 lần trong 15 phút

| Trường | Nội dung |
| --- | --- |
| Test case, dữ liệu | TC-001, 002, 004 (dòng 1, 3), 005 (dòng 1 đến 4), 006, 007 (d = 8, 9), 008 (d = 8 đến 11), 020; TC-138, TC-175 (UI). A là tài khoản đã xác minh; IP riêng từ `198.51.100.0/24` |
| Các bước tái hiện | Trạng thái ban đầu chung ở mục 3. Tự động: `pnpm --filter @crypto-force/api exec vitest run -t "TC-001"`. Thủ công trên API (IP chưa có request, tài khoản A đã xác minh): gửi `POST /api/auth/sign-in/email` cho A ở giây 0 (password sai), 1 (đúng), 2 (sai), 3 (sai). Expected ở giây 3: 429, `X-Retry-After: 9`. Actual: 401. UI: `pnpm --filter @crypto-force/web exec playwright test --grep "TC-175" --workers=1` |
| Expected | Sign in tối đa 3 request trong 10 giây mỗi IP; request thứ 4 trong 10 giây nhận 429 kèm `X-Retry-After`; UI hiện thông báo khóa từ lần bấm thứ 4. Nguồn: Security, mục "Giới hạn số lần đăng nhập" [[2]](#ref-2); Authentication, mục Sign in [[1]](#ref-1) |
| Actual | Mục 4.1: giới hạn 5 lần trong 15 phút; UI không hiện thông báo khóa sau lần bấm thứ 4. TC-001 fail với `expected 401 to be 429` (EV-012). Build tham chiếu đổi giới hạn thành 3 lần/10 giây (VF-04): 35/35 test của PROC-01 pass |
| Severity | Major: giới hạn thử password sai khác requirement bảo mật (ASVS 6.1.1, 6.1.3) và người dùng không thấy lý do khi bị khóa |
| Tham chiếu | MD-01, MD-05; EX-06 |

### DEF-02: Sign in lại không hủy token cũ

| Trường | Nội dung |
| --- | --- |
| Test case, dữ liệu | TC-033 dòng 1 đến 4: A có phiên P1 (dòng 1, 2) hoặc P2 (dòng 3, 4); gửi Sign in kèm cookie của phiên; Keep me signed in bật (dòng 1, 3) hoặc tắt (dòng 2, 4) |
| Các bước tái hiện | Trạng thái ban đầu chung ở mục 3. `pnpm --filter @crypto-force/api exec vitest run -t "TC-033"`. Thủ công: Sign in A, lưu cookie phiên P1; gửi Sign in A lần nữa kèm cookie P1; gọi `GET /api/auth/get-session` với cookie P1. Expected: không có phiên. Actual: trả phiên của A |
| Expected | Token mới khác token cũ; phiên của token cũ bị từ chối. Nguồn: ASVS 7.2.4 [[3]](#ref-3); Authentication, mục Sign in [[1]](#ref-1) |
| Actual | `get-session` với token cũ trả phiên (`expected { session: …, user: … } to be null`, EV-012, cả 4 dòng) |
| Severity | Major: token cũ còn dùng được sau khi người dùng đăng nhập lại |
| Tham chiếu | MD-02-CI-04, MD-02-CI-05, MD-02-CI-15, MD-02-CI-16 |

### DEF-03: Không có thời hạn tuyệt đối 30 ngày

| Trường | Nội dung |
| --- | --- |
| Test case, dữ liệu | TC-036 (phiên dùng mỗi ngày tới 31 ngày); TC-049 (request ở 30 ngày + 0 s và + 1 s) |
| Các bước tái hiện | Trạng thái ban đầu chung ở mục 3. `pnpm --filter @crypto-force/api exec vitest run -t "TC-036"`. Thủ công (cần đồng hồ điều khiển được): tạo phiên P1 ở t = 0; gọi `get-session` mỗi 1 ngày + 1 giây tới 31 ngày. Expected: bị từ chối từ 30 ngày. Actual: còn được chấp nhận |
| Expected | Request từ 30 ngày kể từ lúc tạo phiên bị từ chối dù phiên được dùng đều. Nguồn: Security, bảng phiên, dòng "Thời hạn phiên tuyệt đối" [[2]](#ref-2) |
| Actual | Phiên vẫn được chấp nhận sau 30 ngày (`expected true to be false`, EV-012) |
| Severity | Major: phiên bị đánh cắp hoặc để quên dùng được vô thời hạn khi có request đều |
| Tham chiếu | MD-02-CI-09, MD-07-CI-13 đến MD-07-CI-15, MD-07-CI-20; ASVS 7.1.1 |

### DEF-04: Phiên và link reset được chấp nhận đúng tại thời điểm hết hạn

| Trường | Nội dung |
| --- | --- |
| Test case, dữ liệu | TC-046 (link reset dùng ở 3.600 s), TC-047 (phiên nhớ ở 7 ngày + 0 s), TC-050 (phiên trình duyệt ở 1 ngày + 0 s) |
| Các bước tái hiện | Trạng thái ban đầu chung ở mục 3. `pnpm --filter @crypto-force/api exec vitest run -t "TC-046"`, `pnpm --filter @crypto-force/api exec vitest run -t "TC-047"`, `pnpm --filter @crypto-force/api exec vitest run -t "TC-050"`. Thủ công (đồng hồ điều khiển được): gửi link reset cho A ở t = 0; đặt password `New-Horse-92` bằng token ở t = 3.600 giây. Expected: bị từ chối. Actual: password đổi |
| Expected | Giá trị đúng bằng thời hạn bị từ chối. TC-046: 3.598, 3.599 thành công; 3.600, 3.601 bị từ chối. Nguồn: Authentication, Reset password [[1]](#ref-1); BD-04 của Test Design [[3]](#ref-3) |
| Actual | Mục 4.1: ba giá trị đúng bằng thời hạn vẫn được chấp nhận; giá trị liền sau thì bị từ chối (các dòng khác của TC-046, 047, 050 pass) |
| Severity | Minor: lệch một khoảnh khắc ở biên, không mở rộng thời hạn |
| Tham chiếu | MD-07-CI-04 đến MD-07-CI-09, MD-07-CI-17, MD-07-CI-18, MD-07-CI-21 đến MD-07-CI-24 |

### DEF-05: Đặt password bằng một link reset không vô hiệu hóa các link khác

| Trường | Nội dung |
| --- | --- |
| Test case, dữ liệu | TC-068: A có hai token reset T1 và T2 còn hạn. Đặt `New-Horse-92` bằng T2, rồi `Other-Horse-93` bằng T1 |
| Các bước tái hiện | Trạng thái ban đầu chung ở mục 3. `pnpm --filter @crypto-force/api exec vitest run -t "TC-068"`. Thủ công: Forgot password cho A hai lần, lấy token T1 và T2; đặt `New-Horse-92` bằng T2; rồi đặt `Other-Horse-93` bằng T1. Expected: lần 2 bị từ chối (400). Actual: 200 |
| Expected | Lần 2 bị từ chối; password là `New-Horse-92`. Nguồn: BD-07(a) [[3]](#ref-3) |
| Actual | Lần 2 nhận 200 thay vì 400 (`expected 200 to be 400`, EV-012) |
| Severity | Major: link reset cũ trong email vẫn đổi được password sau khi người dùng đã đặt password mới |
| Tham chiếu | MD-03-CI-13 |

### DEF-06: Không kiểm password phổ biến hoặc đã lộ

| Trường | Nội dung |
| --- | --- |
| Test case, dữ liệu | TC-110 (`password`, `12345678`), TC-111 (stub báo đã lộ), TC-113 (stub trả 503), TC-114 (stub không trả lời); mỗi test case một dòng Create account và một dòng New password |
| Các bước tái hiện | Trạng thái ban đầu chung ở mục 3. `pnpm --filter @crypto-force/api exec vitest run -t "TC-110"`, `pnpm --filter @crypto-force/api exec vitest run -t "TC-111"`, `pnpm --filter @crypto-force/api exec vitest run -t "TC-113"`, `pnpm --filter @crypto-force/api exec vitest run -t "TC-114"`. Thủ công: Create account với password `password`. Expected: lỗi "This password is too common or has appeared in a data breach. Choose a different one.". Actual: tài khoản được tạo |
| Expected | TC-110, TC-111: lỗi "This password is too common or has appeared in a data breach. Choose a different one."; không tạo tài khoản, password không đổi. TC-113, TC-114: được chấp nhận và log có đúng một cảnh báo. Nguồn: Authentication, Create account [[1]](#ref-1); Security, Password [[2]](#ref-2); BD-11 [[3]](#ref-3) |
| Actual | Password phổ biến và password đã lộ được chấp nhận (`expected true to be false`, EV-012). TC-113 và TC-114 fail vì log không có dòng cảnh báo (mục 4.1) |
| Severity | Major: người dùng đặt được password nằm trong danh sách đã lộ |
| Tham chiếu | MD-09-CI-01, 02, 04, 05, 06, 07, 09, 10 (TC-112 pass) |

### DEF-07: API đếm độ dài password theo UTF-16

| Trường | Nội dung |
| --- | --- |
| Test case, dữ liệu | TC-096 (Create account), TC-097 (New password), phần CI: password gồm 4 và 65 emoji `😀` |
| Các bước tái hiện | Trạng thái ban đầu chung ở mục 3. `pnpm --filter @crypto-force/api exec vitest run -t "TC-096"`, `pnpm --filter @crypto-force/api exec vitest run -t "TC-097"`. Thủ công: Create account với password gồm 4 emoji `😀`. Expected: "Use at least 8 characters.". Actual: tài khoản được tạo |
| Expected | 4 emoji: "Use at least 8 characters."; 65 emoji: được chấp nhận (độ dài đếm theo code point). Nguồn: BD-10 [[3]](#ref-3) |
| Actual | 4 emoji (8 đơn vị UTF-16) được chấp nhận; 65 emoji (130 đơn vị) bị từ chối (mục 4.1; 4 test fail, EV-012) |
| Severity | Minor: chỉ ảnh hưởng password có ký tự ngoài BMP |
| Tham chiếu | MD-06-CI-24 đến MD-06-CI-31 |

### DEF-08: Schema form không giới hạn password và Full name

| Trường | Nội dung |
| --- | --- |
| Test case, dữ liệu | Phần C (RUN-012): TC-090 đến TC-093 (129, 130 ký tự), TC-094, TC-095 (101, 102 ký tự), TC-096, TC-097 (129 emoji), TC-098 (101 emoji). Phần S (RUN-013): TC-095 (101, 102 ký tự), TC-098 (101 emoji) |
| Các bước tái hiện | Trạng thái ban đầu chung ở mục 3. `pnpm --filter @crypto-force/shared exec vitest run -t "TC-090"` (và TC-092, TC-094, TC-096 đến TC-098); `pnpm --filter @crypto-force/web exec playwright test --grep "TC-095" --workers=1`. Thủ công: ở `/sign-up`, nhập Full name 101 ký tự `a`, các ô khác hợp lệ, bấm Create account. Expected: "Use 100 characters or fewer.". Actual: không có lỗi |
| Expected | Password quá 128 ký tự: "Use 128 characters or fewer."; Full name quá 100 ký tự: "Use 100 characters or fewer.". Nguồn: Authentication, Create account [[1]](#ref-1) |
| Actual | Schema chấp nhận 129 và 130 ký tự, 101 và 102 ký tự; form không báo lỗi (mục 4.1; 9 test fail ở `packages/shared`, 3 test fail ở E2E) |
| Severity | Minor: giá trị quá dài vào được API |
| Tham chiếu | MD-06 |

### DEF-09: Link xác minh của B chuyển phiên khi đang đăng nhập A

| Trường | Nội dung |
| --- | --- |
| Test case, dữ liệu | TC-071: A đăng nhập; B chưa xác minh; mở link xác minh của B |
| Các bước tái hiện | Trạng thái ban đầu chung ở mục 3. `pnpm --filter @crypto-force/web exec playwright test --grep "TC-071" --workers=1`. Thủ công: Sign in A; Create account B ở trình duyệt khác, lấy link xác minh của B từ console của API; mở link đó ở trình duyệt đang có phiên A. Expected: thông báo "{email của B} is verified. You’re still signed in as {email của A}." và phiên vẫn là A |
| Expected | Auth báo "{email của B} is verified. You’re still signed in as {email của A}."; phiên vẫn là A. Nguồn: Authentication, Create account và Verify email [[1]](#ref-1); TC-071 [[3]](#ref-3) |
| Actual | Lượt chạy này chỉ đo: không thấy thông báo "is verified. You’re still signed in as …" (`getByRole(...)` not found, EV-013); các assertion về phiên ở bước sau không chạy vì test dừng ở assertion đầu. Việc phiên chuyển sang B và không có thông báo lấy từ mục 4.1 (dry run `b4ca981`), chưa đo lại ở `7cdb0f5` |
| Severity | Major: người dùng đổi tài khoản mà không biết |
| Tham chiếu | MD-04-CI-02 |

### DEF-10: Link xác minh lỗi không có cách gửi lại và thiếu thông báo khi có phiên

| Trường | Nội dung |
| --- | --- |
| Test case, dữ liệu | TC-072 (link hết hạn, không có phiên), TC-078 dòng 1 và 2 (link hết hạn, phiên của B hoặc A), TC-145 (token bị đổi ký tự cuối) |
| Các bước tái hiện | Trạng thái ban đầu chung ở mục 3. `pnpm --filter @crypto-force/web exec playwright test --grep "TC-145" --workers=1` (và TC-072, TC-078). Thủ công: Create account B, lấy link xác minh từ console; đổi ký tự cuối của token; mở link khi không có phiên. Expected: màn lỗi link với Send a new link và Back to sign in |
| Expected | Lỗi link xác minh; không có phiên; B vẫn chưa xác minh; phiên đang có không đổi (TC-072, TC-078, TC-145). Trang lỗi báo link hết hạn hoặc đã dùng và có **Send a new link** và **Back to sign in**; link có token bị sửa cũng hiện màn này (Authentication, dòng 93). Nguồn: Authentication [[1]](#ref-1); BD-06(a) [[3]](#ref-3) |
| Actual | Mục 4.1: trang lỗi không có cách gửi lại link; khi trình duyệt có phiên thì không có thông báo lỗi |
| Severity | Minor: người dùng phải quay về Create account để nhận link mới |
| Tham chiếu | MD-04-CI-03, MD-04-CI-09, MD-04-CI-10, MD-04-CI-11; MD-11-CI-48 |

### DEF-11: Form Forgot password và Choose a new password không có danh sách lỗi

| Trường | Nội dung |
| --- | --- |
| Test case, dữ liệu | TC-242 (Send reset link với email trống), TC-243 (Choose a new password với hai ô trống) |
| Các bước tái hiện | Trạng thái ban đầu chung ở mục 3. `pnpm --filter @crypto-force/web exec playwright test --grep "TC-242" --workers=1`, `pnpm --filter @crypto-force/web exec playwright test --grep "TC-243" --workers=1`. Thủ công: mở `/forgot-password`, để trống Email, bấm Send reset link. Expected: danh sách lỗi "Fix 1 field to continue" có link tới ô Email |
| Expected | Danh sách lỗi theo mẫu của prototype: tóm tắt số lỗi, link tới ô lỗi, `aria-invalid` và thông báo của ô. Nguồn: TC-242 [[3]](#ref-3), nguồn của test case là quy ước lỗi form của prototype (mục Pattern dùng chung) |
| Actual | Không thấy danh sách "Fix N fields to continue" (`getByRole('alert')…` not visible, EV-013) |
| Severity | Minor: người dùng đọc màn hình không biết số lỗi và vị trí |
| Tham chiếu | MD-17-CI-11 đến MD-17-CI-19 |

### DEF-12: Thông báo New password trống sai chữ

| Trường | Nội dung |
| --- | --- |
| Test case, dữ liệu | TC-135 dòng 1: New password trống, Confirm `New-Horse-92` |
| Các bước tái hiện | Trạng thái ban đầu chung ở mục 3. `pnpm --filter @crypto-force/web exec playwright test --grep "TC-135" --workers=1`. Thủ công: mở link reset còn hạn của A; để trống New password, Confirm là `New-Horse-92`; bấm lưu. Expected: "Fill in both fields." |
| Expected | "Fill in both fields." Nguồn: Authentication, Reset password [[1]](#ref-1); BD-08 [[3]](#ref-3) |
| Actual | "Use at least 8 characters." (mục 4.1; test fail EV-013) |
| Severity | Trivial: thông báo sai chữ nhưng người dùng vẫn biết ô nào cần sửa |
| Tham chiếu | MD-11-CI-19 đến MD-11-CI-22 |

### DEF-13: Google trả lỗi thì mất email đã nhập

| Trường | Nội dung |
| --- | --- |
| Test case, dữ liệu | TC-141 dòng 1 (`access_denied`) và dòng 2 (`server_error`); form Sign in có email `an@example.com` |
| Các bước tái hiện | Trạng thái ban đầu chung ở mục 3. `pnpm --filter @crypto-force/web exec playwright test --grep "TC-141" --workers=1`. Cần OAuth provider giả của E2E (ENV-04): ở `/sign-in` nhập `an@example.com`, bấm Continue with Google, provider trả `error=access_denied`. Expected: ô email còn `an@example.com` |
| Expected | Auth hiện lỗi; ô email còn `an@example.com`; không có phiên. Nguồn: Authentication, Sign in [[1]](#ref-1) |
| Actual | Ô email trống sau khi quay lại từ Google (mục 4.1; 2 test fail, EV-013) |
| Severity | Minor: người dùng phải nhập lại email |
| Tham chiếu | MD-11-CI-31, MD-11-CI-32 |

### DEF-14: Email "already have an account" cho tài khoản chưa xác minh không hướng dẫn xác nhận email

| Trường | Nội dung |
| --- | --- |
| Test case, dữ liệu | TC-183: tài khoản U chưa xác minh; Create account với email của U |
| Các bước tái hiện | Trạng thái ban đầu chung ở mục 3. `pnpm --filter @crypto-force/web exec playwright test --grep "TC-183" --workers=1`. Thủ công: Create account U, không mở link xác minh; Create account lần nữa với email của U; đọc email trong console của API. Expected: email hướng dẫn Reset password rồi xác nhận email |
| Expected | Như TC-182; email hướng dẫn Reset password rồi xác nhận email. Nguồn: Authentication, Create account và Verify email [[1]](#ref-1) |
| Actual | Email không có hướng dẫn xác nhận email (mục 4.1; test fail EV-013) |
| Severity | Minor: người dùng không biết bước tiếp theo |
| Tham chiếu | MD-13-CI-14 |

### DEF-15: Tải lại Check your email vẫn ở Check your email

| Trường | Nội dung |
| --- | --- |
| Test case, dữ liệu | TC-184: sau Create account, ở màn Check your email, tải lại trang |
| Các bước tái hiện | Trạng thái ban đầu chung ở mục 3. `pnpm --filter @crypto-force/web exec playwright test --grep "TC-184" --workers=1`. Thủ công: Create account với email mới; ở màn Check your email, bấm F5. Expected: form Create account |
| Expected | Quay về form Create account. Nguồn: Authentication, Create account và Verify email [[1]](#ref-1) |
| Actual | Trang vẫn ở Check your email (mục 4.1; test fail EV-013) |
| Severity | Minor: trạng thái Check your email còn sau khi tải lại, trái test basis |
| Tham chiếu | MD-13-CI-15 |

### DEF-16: Reset password từ màn chặn Backtest mở Realtime

| Trường | Nội dung |
| --- | --- |
| Test case, dữ liệu | TC-187: A không có phiên; mở `/backtest`; Sign in to continue; Forgot password; mở link; đặt password mới; Sign in |
| Các bước tái hiện | Trạng thái ban đầu chung ở mục 3. `pnpm --filter @crypto-force/web exec playwright test --grep "TC-187" --workers=1`. Thủ công: không có phiên; mở `/backtest`; bấm Sign in to continue, rồi Forgot password; mở link reset từ console; đặt password mới; Sign in. Expected: mở Backtest |
| Expected | Sau Sign in mở Backtest. Nguồn: Authentication, Reset password [[1]](#ref-1) |
| Actual | Sau Sign in mở Realtime (mục 4.1; test fail EV-013) |
| Severity | Minor: người dùng mất đích ban đầu |
| Tham chiếu | MD-13-CI-18 |

### DEF-17: Response của API thiếu header bảo mật

| Trường | Nội dung |
| --- | --- |
| Test case, dữ liệu | TC-227: `GET /api/auth/get-session`, `GET` route auth-config, `GET /api/does-not-exist` |
| Các bước tái hiện | Trạng thái ban đầu chung ở mục 3. `pnpm --filter @crypto-force/web exec playwright test --grep "TC-227" --workers=1`. Thủ công: `curl -i http://localhost:3000/api/auth/get-session`, `curl -i http://localhost:3000/api/does-not-exist`. Expected: có `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, CSP có `frame-ancestors 'none'` |
| Expected | Cả ba response có `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer` và CSP có `frame-ancestors 'none'`. Nguồn: Security, mục Header bảo mật [[2]](#ref-2); TC-227 [[3]](#ref-3) |
| Actual | `Expected: "nosniff"; Received: undefined` cho `/api/auth/get-session` (EV-013). Assertion đầu tiên fail nên test dừng: `Referrer-Policy`, CSP và hai đường còn lại chưa được đo ở lượt này. Việc thiếu cả ba header lấy từ mục 4.1 |
| Severity | Minor: thiếu lớp phòng thủ; không có khai thác trực tiếp đã biết |
| Tham chiếu | MD-15-CI-12 đến MD-15-CI-20 |

### DEF-18: Trang có token reset không đặt `Referrer-Policy: no-referrer`

| Trường | Nội dung |
| --- | --- |
| Test case, dữ liệu | TC-230: A có link reset còn hạn; mở link; đọc header `Referrer-Policy` của document và thẻ `meta name="referrer"` |
| Các bước tái hiện | Trạng thái ban đầu chung ở mục 3. `pnpm --filter @crypto-force/web exec playwright test --grep "TC-230" --workers=1`. Thủ công: Forgot password cho A; mở link reset; trong DevTools đọc header `Referrer-Policy` của document và thẻ `meta name="referrer"`. Expected: một trong hai là `no-referrer` |
| Expected | Header hoặc thẻ `meta` có giá trị `no-referrer`. Nguồn: BD-17 [[3]](#ref-3); Security [[2]](#ref-2) |
| Actual | `Expected value: "no-referrer"; Received array: [undefined, null]` (EV-013) |
| Severity | Major: token reset nằm trong URL của trang và có thể rò rỉ qua header Referer khi trang tải tài nguyên hoặc người dùng bấm link ra ngoài |
| Tham chiếu | MD-15-CI-25 |

### DEF-19: Google với email của tài khoản chưa xác minh hiện thông báo chung

| Trường | Nội dung |
| --- | --- |
| Các bước tái hiện (thủ công) | 1. Chạy `pnpm dev` với `.env` gốc (Google OAuth thật) và database dev không có tài khoản của email Google test. 2. Mở `/sign-up`, Create account bằng đúng email của tài khoản Google test, một password hợp lệ; không mở link xác minh. 3. Mở `/sign-in`, bấm Continue with Google, chọn tài khoản Google test. 4. Quan sát URL và thông báo; kiểm database: không có dòng `session`, user vẫn chưa xác minh, chỉ có account `credential` (EV-009) |
| Test case, dữ liệu | TC-103 phần S; tài khoản U tạo bằng Create account với email của tài khoản Google test, chưa xác minh; RUN-007 trên Google thật (ENV-09) |
| Expected | Không có phiên; không liên kết; Auth báo email đã đăng ký và gợi ý Sign in bằng password hoặc Reset password. Nguồn: Authentication [[1]](#ref-1); TC-103 `v2` [[3]](#ref-3) |
| Actual | Không có phiên, không liên kết (đúng). Trang quay về `/sign-in?provider=google&error=account_not_linked` với thông báo chung "Google sign-in didn't finish. It may have been cancelled or blocked. Try again, or use your email below." (Test Log RUN-007, EV-005, EV-009) |
| Severity | Minor: dữ liệu đúng; người dùng không biết email đã có tài khoản |
| Tham chiếu | MD-08-CI-04; AN-02; TD-19 |

## 4. Confirmation testing và regression testing

Chưa có bản sửa nào. Khi một defect được sửa, thêm dòng cho defect đó: chạy lại các test của defect trên build có bản sửa, rồi chạy regression theo phạm vi mà thay đổi có thể ảnh hưởng. DEF-17 đến DEF-19 và TD-18, TD-19 (Implementation Status mục 4) có điều kiện đi kèm khi sửa.

| Defect ID | Build có bản sửa | Confirmation test: Run IDs / kết quả | Test bổ sung cho thay đổi | Regression: phạm vi / Run IDs / kết quả | Trạng thái sau kiểm tra |
| --- | --- | --- | --- | --- | --- |
| DEF-01 đến DEF-19 | Chưa có | Chưa chạy | TD-18, TD-19 chờ bản sửa của DEF-10 (TC-072, TC-141) và DEF-19 | Chưa chạy | Open |

## 5. Tiêu chí đạt

| ID | Tiêu chí | Điều kiện đầu vào | Kết quả |
| --- | --- | --- | --- |
| Q3-01 | Mỗi report có đủ các trường ở mục 3 | IN-09 | Đạt: mỗi report có trường "Các bước tái hiện" riêng; trạng thái ban đầu chung ở mục 3 |
| Q3-02 | Các bước tái hiện và evidence đủ để người khác tái hiện mà không cần hỏi người báo cáo | IN-06, IN-07, RC-03 | Đạt một phần: mỗi report có lệnh chạy riêng và bước thủ công với dữ liệu cụ thể. Chưa có người khác chạy lại từng report. DEF-03, DEF-04 cần đồng hồ điều khiển được, nên bước thủ công khó làm ngoài test; DEF-13 cần provider giả của E2E |
| Q3-03 | Expected result dẫn tới nguồn có version | RC-02 | Đạt một phần (RC-02 đạt một phần vì TC-200, không có defect nào từ TC-200): nguồn là test basis ở `c23d848`, Test Cases ở `497541d` và các bản v2 |
| Q3-04 | Mỗi anomaly có nguyên nhân được phân loại; failure không bị mặc định là product defect | — | Đạt: phân loại dựa trên testware đã kiểm ở Phase 04 và đối chiếu với mục 4.1; product owner duyệt nguyên nhân của mọi dòng ngày 2026-11-19 (TD-21) |
| Q3-05 | Mọi defect Closed có confirmation test Passed trên build có bản sửa | RC-01 | Đạt một phần: không có defect Closed; RC-01 đạt một phần, nhưng chỉ DEF-19 đến từ RUN-007 trên working tree của product owner |
| Q3-06 | Mỗi bản sửa có phạm vi regression và kết quả, hoặc ghi rõ chưa chạy regression | — | Đạt: chưa có bản sửa; ghi ở mục 4 |
| Q3-07 | Defect ở trạng thái Duplicate, Rejected hoặc Deferred có lý do và link tới report gốc hoặc quyết định | — | Đạt: không có defect ở các trạng thái đó |

**Người review / ngày:** chưa có.

## References

1. <a id="ref-1"></a>[Authentication](../../../../../design/prototype/docs/requirements/authentication.md) — commit `c23d848`, 2026-11-17
2. <a id="ref-2"></a>[Security](../../../../../architecture/23-security.md) — commit `c23d848`, 2026-11-17
3. <a id="ref-3"></a>[Test Cases](../../03-design/output/04-test-cases.md) — commit `497541d`, 2026-11-17, với các bản `v2` ngày 2026-11-18
4. <a id="ref-4"></a>[Implementation Status](../../04-implementation/output/01-implementation-status.md) — mục 4.1, 2026-11-19
5. <a id="ref-5"></a>Skill `test-defect-classification` — `.claude/skills/test-defect-classification/SKILL.md`, thang severity mặc định
6. <a id="ref-6"></a>[Test Log](02-test-log.md) — mục 2.4
