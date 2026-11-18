# Test Data

Đọc file này để biết test data nào đã được chuẩn bị cho TS-001, mỗi bộ dữ liệu đáp ứng yêu cầu nào, cách khởi tạo và reset, và kết quả kiểm tra sẵn sàng.

## 1. Phạm vi

| Trường | Nội dung |
| --- | --- |
| Yêu cầu test data | Data & Environment Requirements [[1]](#ref-1) mục 1, DR-01 đến DR-12, commit `eb1be83` |
| Nơi lưu data, fixture, generator | Component integration: `apps/api/test/support/harness.ts`, `apps/api/test/support/passwords.ts`, `apps/api/test/support/outbound.ts`. System: `apps/web/e2e/auth/fixtures.ts`. Component: hằng số trong `packages/shared/test/auth.schema.test.ts` và `apps/web/app/utils/auth-redirect.test.ts` |
| Snapshot | Branch `test/auth`, commit chứa thư mục `04-implementation/` |
| Thời điểm kiểm tra | 2026-11-17, 22:00 đến 23:30 (GMT+7) |

## 2. Bộ dữ liệu

Mọi dữ liệu được sinh trong test. Không có bộ dữ liệu nào tồn tại sẵn giữa các lần chạy: database `<POSTGRES_DB>_test` và `<POSTGRES_DB>_e2e` được tạo lại từ migration ở đầu mỗi lần chạy (ENV-01, ENV-02).

| Data ID / version | Yêu cầu đáp ứng | Test case IDs | Partition, boundary, trạng thái hoặc khối lượng đã tạo | Dạng | Khởi tạo / reset / cô lập | Hạn dùng | Owner |
| --- | --- | --- | --- | --- | --- | --- | --- |
| DA-01; v1 | DR-01 | Như DR-01 | Tài khoản email/password đã xác minh, email `<label>-<UUID>@example.com`, password `Correct-Horse-91`. Password mới `New-Horse-92`, `Other-Horse-93`; password sai `Wrong-Horse-00`. Riêng TC-133 dùng `an@example.com` vì input của test case cố định email này | Chỉ có generator, chạy trong test | CI: `createVerifiedAccount` tạo bằng Create account rồi mở link xác minh trong mailer bộ nhớ. S: `createVerifiedUser` tạo bằng `POST /api/auth/sign-up/email` từ một IP riêng rồi đặt `email_verified = true` trong database E2E. Email chứa UUID nên test chạy song song không dùng chung tài khoản | Không có | Agent |
| DA-02; v1 | DR-02 | Như DR-02 | Tài khoản chưa xác minh, password `Correct-Horse-91`, có link xác minh trong mailer (CI) hoặc trong console (S) | Chỉ có generator | CI: `createUnverifiedAccount`. S: `createUnverifiedUser` | Link hết hạn sau 1 giờ kể từ lúc tạo | Agent |
| DA-03; v1 | DR-03 | TC-100, TC-104, TC-150 | Tài khoản chỉ có Google: email `g1-<UUID>@example.test`, liên kết với `sub` `google-sub-<UUID>`, không có password | Chỉ có generator | CI: tạo qua luồng Google với OAuth provider giả (ENV-04). S: `createGoogleOnlyUser` chèn một dòng `user` và một dòng `account` có `provider_id = 'google'` vào database E2E | Không có | Agent |
| DA-04; v1 | DR-04 | TC-043, TC-100 đến TC-104, TC-199, TC-232 | Profile trong id_token giả: `sub`, `email`, `email_verified: true`, `name`; mỗi test đặt bằng `setGoogleProfile` | Chỉ có generator | `resetOutbound()` trước mỗi test | Không có | Agent |
| DA-05; v1 | DR-05 | TC-090 đến TC-093, TC-096, TC-097, TC-201, TC-203 | ASCII dài 6, 7, 8, 9, 127, 128, 129, 130 ký tự cắt từ chuỗi `Vq7#Lm2$Tx9@Kd4!` lặp lại; `😀` lặp 4, 8, 65, 129 lần; `qzmvbtkw`; `  Pass Word Ab9  ` | Chỉ có generator | `asciiPassword(length)`, `EMOJI.repeat(n)`; không phụ thuộc trạng thái | Không có | Agent |
| DA-06; v1 | DR-06 | TC-110 đến TC-114 | `password`, `12345678`; chuỗi ngẫu nhiên 20 ký tự `randomPassword()` sinh mỗi lần chạy | Chỉ có generator | Sinh trong test | Không có | Agent |
| DA-07; v1 | DR-07 | TC-001 đến TC-021, TC-041, TC-138, TC-175 | CI: IP lấy tuần tự từ `198.51.100.1` (file giới hạn số lần), `203.0.113.1` (file Google), `203.0.113.200` (TC-041). S: TC-021 dùng `198.51.100.21` đến `.26`, TC-138 dùng `198.51.100.138`, TC-175 dùng `198.51.100.175`. Request khác dùng IP riêng `10.<file hoặc worker>.<n>.<n>` | Chỉ có generator | Mỗi test case một IP, đặt qua `x-forwarded-for`. Không xóa cả bảng `rate_limit`; helper của test workspace chỉ xóa bucket `127.0.0.1` và `no-trusted-ip` | Không có | Agent |
| DA-08; v1 | DR-08 | Như DR-08 | Link xác minh và link reset: CI đọc từ `MemoryMailer`; S đọc từ `apps/web/.e2e-output/e2e-console.log`. Token sửa bằng `tamperToken` (đổi ký tự cuối). Link hết hạn ở S: link reset được đặt `expires_at` về quá khứ; link xác minh được ký lại với thời hạn đã qua 60 giây (ENV-06) | Chỉ có generator | Lấy mới trong mỗi test | Link hết hạn sau 1 giờ | Agent |
| DA-09; v1 | DR-09 | TC-160 | `/backtest`, `https://evil.example/`, `//evil.example`, `/\evil.example`, `javascript:alert(1)`, `/sign-in`, không có `next` | Đã tồn tại trong code test | Không cần | Không có | Agent |
| DA-10; v1 | DR-10 | TC-094, TC-095, TC-098, TC-144 | Full name `N` lặp 0, 1, 2, 99, 100, 101, 102 lần; `😀` lặp 51, 101 lần; 3 khoảng trắng; `An Nguyen` | Đã tồn tại trong code test | Không cần | Không có | Agent |
| DA-11; v1 | DR-11 | Như DR-11 | 7 giá trị email của MD-11; ` an@example.com `, `An@Example.com`, `an+test@example.com`; email mới `<label>-<UUID>@example.com`; `none@example.test` không có tài khoản | Đã tồn tại trong code test | Email mới sinh trong mỗi test | Không có | Agent |
| DA-12; v1 | DR-12 | TC-195 đến TC-198 | Tài khoản Google của product owner; hộp thư của chủ tài khoản Resend với `+tag` mới cho mỗi lần chạy | Chưa tạo; product owner chuẩn bị ở session thủ công | Tài khoản Crypto Force tạo trong session được xóa sau session (PROC-17) | Không có | Product owner |

Không có password, token hay dữ liệu cá nhân thật trong code test và trong file này. Password của DR-01 là giá trị tự đặt; `BETTER_AUTH_SECRET` được đọc từ `.env` khi chạy và không được ghi ra.

## 3. Kiểm tra sẵn sàng

| Data ID | Đặc tính đã kiểm tra | Cách kiểm tra | Kết quả | Evidence / ngày |
| --- | --- | --- | --- | --- |
| DA-01 | Tài khoản đăng nhập được bằng `Correct-Horse-91`; email đã xác minh | SU-01 (`smoke.test.ts`) và SU-11 (`smoke.spec.ts`) tạo tài khoản rồi Sign in thành công | Đạt | VF-02, VF-03; 2026-11-17 |
| DA-02 | Sign in với password đúng trả `EMAIL_NOT_VERIFIED`; có link trong mailer | TC-150 dòng 5 ở CI pass; `createUnverifiedAccount` chờ email "Confirm" trước khi trả về | Đạt | VF-02; 2026-11-17 |
| DA-03 | Tài khoản có đúng một liên kết Google và không có password | CI: TC-104 đọc bảng `account` thấy `sub` S1. S: TC-150 dòng 2 dùng tài khoản này | Đạt | VF-02, VF-03; 2026-11-17 |
| DA-04 | Callback Google với profile giả tạo được phiên | TC-101 pass: phiên có email của profile và `emailVerified: true` | Đạt | VF-02; 2026-11-17 |
| DA-05 | Độ dài đúng theo đơn vị code point; chuỗi không có trong danh sách phổ biến | `asciiPassword(n).length === n`; `EMOJI.repeat(n)` có n code point; TC-201 và TC-090 dòng 8, 9 tạo được tài khoản | Đạt | VF-01, VF-02; 2026-11-17 |
| DA-06 | Password ngẫu nhiên khác nhau mỗi lần chạy | `randomBytes(15)` mỗi lần gọi | Đạt | Review code; 2026-11-17 |
| DA-07 | Request của mỗi test case vào bucket riêng | CI: TC-006 thấy 3 lần đầu được chấp nhận trên IP mới. S: TC-021 và các test chạy song song không nhận 429 ngoài dự kiến | Đạt | VF-02, VF-03; 2026-11-17 |
| DA-08 | Link đọc được từ console; link hết hạn bị từ chối | S: SU-11 mở link từ console. TC-062 thấy màn link hết hạn sau khi đặt `expires_at` | Đạt | VF-03; 2026-11-17 |
| DA-09 đến DA-11 | Giá trị đúng như test case | Review với Test Cases | Đạt | VF-01; 2026-11-17 |
| DA-12 | — | Chưa kiểm tra: dữ liệu thuộc session thủ công của product owner ở Phase 05 | Không đạt | — |

## 4. Tiêu chí đạt

| ID | Tiêu chí | Điều kiện đầu vào | Kết quả |
| --- | --- | --- | --- |
| Q3-01 | Mỗi yêu cầu test data có bộ dữ liệu tương ứng, hoặc được ghi là thiếu ở Implementation Status | RC-03 | Đạt: DR-01 đến DR-11 có DA tương ứng; DA-12 ghi ở Implementation Status TD-09 |
| Q3-02 | Đặc tính của mỗi bộ dữ liệu đã được kiểm tra theo yêu cầu và có evidence | IN-05 | Đạt cho DA-01 đến DA-11. DA-12 chưa kiểm tra |
| Q3-03 | Cách khởi tạo, reset và cô lập được ghi và đã chạy thử | IN-05 | Đạt |
| Q3-04 | Dữ liệu chỉ có generator được đánh dấu rõ, và bước chạy generator có trong runbook | — | Đạt: generator chạy trong test, không có bước riêng; runbook ở Procedures & Suites mục 5 |
| Q3-05 | Dữ liệu có thời hạn được ghi hạn dùng | — | Đạt: DA-02, DA-08 |
| Q3-06 | Không có secrets hoặc dữ liệu cá nhân thật trong data và trong file này | — | Đạt |

**Người review / ngày:** Chưa review

## References

1. <a id="ref-1"></a>[Test Data & Environment Requirements](../../03-design/output/05-data-and-environment-requirements.md) — commit `eb1be83`, 2026-11-17
