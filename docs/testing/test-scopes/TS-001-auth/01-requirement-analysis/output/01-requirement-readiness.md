# Requirement Readiness

Đọc file này để biết từng requirement Authentication đã đủ sẵn sàng để lập kế hoạch và thiết kế test hay chưa, vì sao, và requirement khác implementation hiện có ở đâu.

## 1. Phạm vi

| Trường | Nội dung |
| --- | --- |
| Version / thời điểm chốt | 2026-11-17 (GMT+7); code tại commit `b4ca981` |
| Tài liệu requirement | Authentication [[1]](#ref-1) `705a1ad`; Security [[2]](#ref-2) `705a1ad`; Workspace [[3]](#ref-3) `bd0ecff`; Crypto Force UI Prototype [[4]](#ref-4) `dbbaafe`; Architectural Decisions [[5]](#ref-5) `705a1ad`; Test Strategy [[6]](#ref-6) `705a1ad` |
| Tiêu chí sẵn sàng | Mục 2 của file này; product owner duyệt ngày 2026-11-17 ([Readiness](../input/01-analysis-readiness.md), RC-02) |
| Người thực hiện / người review | Người thực hiện: agent. Người review: product owner |
| File chi tiết | [Baseline Comparison](02-baseline-comparison.md), [Review Findings](03-review-findings.md) |

Spec không có requirement ID. ID trong file này do người phân tích gán theo từng câu có hành vi kiểm được trong tài liệu nguồn (RF-01).

## 2. Tiêu chí sẵn sàng

| Criterion ID | Tiêu chí | Nguồn |
| --- | --- | --- |
| CR-01 | Đầy đủ: đã nêu input, output, hành vi khi lỗi và ràng buộc | [[8, §3.1]](#ref-8) |
| CR-02 | Đúng: khớp với nguồn quyết định (spec, ADR, câu hỏi đã Resolved) | [[8, §3.1]](#ref-8) |
| CR-03 | Nhất quán: không mâu thuẫn với requirement khác hoặc với ADR | [[8, §3.1]](#ref-8) |
| CR-04 | Kiểm được: có kết quả quan sát được; con số có đơn vị và điều kiện đo | [[8, §3.1]](#ref-8) |
| CR-05 | Rõ nghĩa: hai người đọc hiểu cùng một hành vi; không chỉ có ví dụ thay cho quy tắc | Đề xuất của agent; product owner duyệt ngày 2026-11-17 |
| CR-06 | Truy vết được: có ID duy nhất và dẫn tới một tài liệu nguồn có version | Đề xuất của agent; product owner duyệt ngày 2026-11-17 |

## 3. Trạng thái từng requirement

| Tiền tố | Nhóm | Nguồn |
| --- | --- | --- |
| `RD` | Chuyển tiếp sau khi đăng nhập (redirect) | [[1, Chuyển tiếp sau khi đăng nhập]](#ref-1) |
| `CM` | Quy tắc dùng chung cho mọi bước | [[1, Quy tắc dùng chung]](#ref-1) |
| `SI` | Sign in | [[1, Sign in]](#ref-1) [[2, Giới hạn số lần đăng nhập]](#ref-2) |
| `GO` | Continue with Google | [[1, Sign in]](#ref-1) [[2, Authentication]](#ref-2) |
| `CA` | Create account và Verify email | [[1, Create account và Verify email]](#ref-1) |
| `RP` | Reset password | [[1, Reset password]](#ref-1) |
| `SS` | Phiên và Sign out | [[3, Điều kiện đăng nhập]](#ref-3) [[3, Sign out]](#ref-3) [[2, Authentication]](#ref-2) [[5, ADR-001]](#ref-5) |
| `SEC` | Bảo mật: cookie, origin, rate limit, email, header | [[2]](#ref-2) |
| `A11Y` | Accessibility | [[4, Lỗi form]](#ref-4) [[6]](#ref-6) |
| `ASVS` | Mục ASVS L1 mà ADR-002 áp dụng nhưng spec không nêu hành vi; giữ số của mục gốc | [[5, ADR-002]](#ref-5) [[9]](#ref-9) [[10]](#ref-10) [[11]](#ref-11) |

Requirement ID có dạng `<tiền tố>-NN`. ID không đổi và không dùng lại; requirement mới nhận số kế tiếp trong nhóm. Version trong cột đầu là commit của tài liệu nguồn.

| Requirement ID / version | Tiêu chí chưa đạt | Finding IDs | Câu hỏi mở | Trạng thái | Owner |
| --- | --- | --- | --- | --- | --- |
| RD-01: không có đích chờ thì tới Realtime; [[1]](#ref-1) `705a1ad` | Không có | — | — | Ready | Product owner |
| RD-02: đến từ màn chặn workspace thì về đúng màn đó; [[1]](#ref-1) `705a1ad` | Không có | — | — | Ready | Product owner |
| RD-03: đến từ Backtest this idea thì tới Strategy Engine; [[1]](#ref-1) `705a1ad` | — | — | — | Ngoài phạm vi | Product owner |
| RD-04: có đích chờ thì Auth hiện dòng báo trước đích; [[1]](#ref-1) `705a1ad` | Không có | — | — | Ready | Product owner |
| RD-05: đích chờ bị xóa khi đăng nhập thành công hoặc Sign out; [[1]](#ref-1) `705a1ad` | Không có | — | — | Ready | Product owner |
| RD-06: chỉ nhận đường dẫn nội bộ, đích ngoài app thay bằng Realtime; [[1]](#ref-1) `705a1ad` | Không có | — | — | Ready | Product owner |
| RD-07: đã đăng nhập mà mở Auth thì tới thẳng đích, trừ link reset; [[1]](#ref-1) `705a1ad` | Không có | — | — | Ready | Product owner |
| RD-08: chuyển bước không làm mất email đã nhập; [[1]](#ref-1) `705a1ad` | Không có | — | — | Ready | Product owner |
| CM-01: email bỏ khoảng trắng, không phân biệt hoa thường, `+tag` là địa chỉ riêng; [[1]](#ref-1) `705a1ad` | Không có | RF-01 | — | Ready | Product owner |
| CM-02: password 8–128 ký tự, không ép thành phần, không bị cắt bớt; [[1]](#ref-1) `705a1ad` | Không có | RF-01 | — | Ready | Product owner |
| CM-03: lỗi server hoặc mất mạng hiện thông báo chung kèm gợi ý thử lại; câu cụ thể của từng bước không cố định; [[1]](#ref-1) `705a1ad` | Không có | RF-01, RF-06 | — | Ready | Product owner |
| SI-01: email trống; [[1]](#ref-1) `705a1ad` | Không có | — | — | Ready | Product owner |
| SI-02: email sai định dạng; [[1]](#ref-1) `705a1ad` | Không có | — | — | Ready | Product owner |
| SI-03: password trống; [[1]](#ref-1) `705a1ad` | Không có | — | — | Ready | Product owner |
| SI-04: email và password không khớp thì báo lỗi kèm link Reset password; [[1]](#ref-1) `705a1ad` | Không có | — | — | Ready | Product owner |
| SI-05: email chưa xác minh thì báo và cho gửi lại link; [[1]](#ref-1) `705a1ad` | Không có | — | — | Ready | Product owner |
| SI-06: từ một IP, lần bấm Sign in thứ 4 cách lần được chấp nhận cuối dưới 10 giây thì bị khóa; khóa hết 10 giây sau lần được chấp nhận cuối; 429 kèm `X-Retry-After`; [[1]](#ref-1) [[2]](#ref-2) `705a1ad` | Không có | RF-03 | — | Ready | Product owner |
| SI-07: sửa password sau lần sai thì ẩn lỗi, trừ khi đang khóa; [[1]](#ref-1) `705a1ad` | Không có | — | — | Ready | Product owner |
| SI-08: bật/tắt hiện password; [[1]](#ref-1) `705a1ad` | Không có | — | — | Ready | Product owner |
| SI-09: Keep me signed in bật: 7 ngày, tự gia hạn, tối đa 30 ngày; [[1]](#ref-1) [[2]](#ref-2) `705a1ad` | Không có | — | — | Ready | Product owner |
| SI-10: Keep me signed in tắt: cookie không có `Max-Age` hay `Expires`; [[1]](#ref-1) `705a1ad` | Không có | — | — | Ready | Product owner |
| SI-11: hợp lệ thì ghi phiên và chuyển tới đích; [[1]](#ref-1) `705a1ad` | Không có | — | — | Ready | Product owner |
| SI-12: tài khoản chỉ có Google mà nhập password thì nhận thông báo như SI-04; [[1]](#ref-1) `705a1ad` | Không có | RF-01 | — | Ready | Product owner |
| GO-01: nút chỉ hiện khi đã cấu hình Google OAuth; [[1]](#ref-1) `705a1ad` | Không có | — | — | Ready | Product owner |
| GO-02: email mới thì tạo tài khoản, không qua Verify; [[1]](#ref-1) `705a1ad` | Không có | — | — | Ready | Product owner |
| GO-03: email đã có tài khoản: đã xác minh thì liên kết, chưa xác minh thì báo email đã đăng ký; [[1]](#ref-1) `705a1ad` | Không có | — | — | Ready | Product owner |
| GO-04: đóng cửa sổ Google hoặc Google lỗi thì hiện lỗi, giữ form email; [[1]](#ref-1) `705a1ad` | Không có | — | — | Ready | Product owner |
| GO-05: đăng nhập bằng Google xong thì chuyển tới đích; [[1]](#ref-1) `705a1ad` | Không có | — | — | Ready | Product owner |
| GO-06: Google luôn hiện màn chọn tài khoản; [[1]](#ref-1) `705a1ad` | Không có | — | — | Ready | Product owner |
| GO-07: Reset password không đánh dấu email đã xác minh; khôi phục bằng Reset password rồi xác nhận email; [[1]](#ref-1) `705a1ad` | Không có | RF-01 | — | Ready | Product owner |
| GO-08: bắt đầu Continue with Google dùng giới hạn của Sign in; callback của Google giới hạn 100 request/10 giây/IP; [[2]](#ref-2) `705a1ad` | Không có | RF-07 | — | Ready | Product owner |
| GO-09: tài khoản Google được xác định theo provider và `sub`, không theo email; [[2]](#ref-2) `705a1ad` | Không có | RF-07 | — | Ready | Product owner |
| GO-10: phiên Crypto Force độc lập với phiên Google; Sign out không đăng xuất Google; [[2]](#ref-2) `705a1ad` | Không có | RF-07 | — | Ready | Product owner |
| CA-01: form gồm Full name, email, password, checkbox xác nhận; [[1]](#ref-1) `705a1ad` | Không có | — | — | Ready | Product owner |
| CA-02: lỗi tại trường khi bấm Create account; [[1]](#ref-1) `705a1ad` | Không có | — | — | Ready | Product owner |
| CA-03: hợp lệ thì tới Check your email, hiện email vừa nhập; [[1]](#ref-1) `705a1ad` | Không có | — | — | Ready | Product owner |
| CA-04: email đã có tài khoản cũng tới Check your email; chủ tài khoản nhận email "đã có tài khoản"; [[1]](#ref-1) `705a1ad` | Không có | — | — | Ready | Product owner |
| CA-05: link xác minh: xác minh, ghi phiên, chuyển tới đích; [[1]](#ref-1) `705a1ad` | Không có | — | — | Ready | Product owner |
| CA-06: link xác minh hết hạn thì báo lỗi và cho gửi lại link; [[1]](#ref-1) `705a1ad` | Không có | RF-02 | — | Ready | Product owner |
| CA-07: Resend the link: nút thành "Sent again" và bị vô hiệu; [[1]](#ref-1) `705a1ad` | Không có | — | — | Ready | Product owner |
| CA-08: Use a different email: quay lại Create account; [[1]](#ref-1) `705a1ad` | Không có | — | — | Ready | Product owner |
| CA-09: I've confirmed: có phiên thì tới đích, chưa có thì Sign in với email điền sẵn; [[1]](#ref-1) `705a1ad` | Không có | — | — | Ready | Product owner |
| CA-10: nút I've confirmed ghi tên đích; [[1]](#ref-1) `705a1ad` | Không có | — | — | Ready | Product owner |
| CA-11: tab Sign in và Create account điều khiển bằng mũi tên, Home, End; [[1]](#ref-1) `705a1ad` | Không có | — | — | Ready | Product owner |
| CA-12: link xác minh hiệu lực 1 giờ; [[2]](#ref-2) `705a1ad` | Không có | — | — | Ready | Product owner |
| CA-13: Full name tối đa 100 ký tự, password tối đa 128 ký tự; [[1]](#ref-1) `705a1ad` | Không có | — | — | Ready | Product owner |
| CA-14: password phổ biến hoặc đã bị lộ bị từ chối; API Pwned Passwords lỗi hoặc không phản hồi thì chỉ kiểm tra danh sách 3.000 password, chấp nhận và ghi log cảnh báo; [[1]](#ref-1) `705a1ad`, [[2]](#ref-2) `d6c0541` | Không có | RF-12 | — | Ready | Product owner |
| CA-15: tải lại Check your email thì quay về Create account; [[1]](#ref-1) `705a1ad` | Không có | RF-01 | — | Ready | Product owner |
| CA-16: email "đã có tài khoản" gửi tới tài khoản chưa xác minh hướng dẫn Reset password rồi xác nhận email; [[1]](#ref-1) `705a1ad` | Không có | RF-01 | — | Ready | Product owner |
| CA-17: phiên chỉ được tạo ở lần mở link đầu tiên; link còn hạn của email đã xác minh không báo lỗi, không tạo phiên, mở Sign in hoặc tới thẳng đích nếu đã có phiên; [[1]](#ref-1) `705a1ad` | Không có | RF-01, RF-02 | — | Ready | Product owner |
| RP-01: Forgot password?, nhập email, Send reset link; [[1]](#ref-1) `705a1ad` | Không có | — | — | Ready | Product owner |
| RP-02: email sai định dạng báo lỗi như Sign in; [[1]](#ref-1) `705a1ad` | Không có | — | — | Ready | Product owner |
| RP-03: email hợp lệ luôn hiện "If an account exists for …"; [[1]](#ref-1) `705a1ad` | Không có | — | — | Ready | Product owner |
| RP-04: link reset hiệu lực 1 giờ, dùng một lần; [[1]](#ref-1) `705a1ad` | Không có | — | — | Ready | Product owner |
| RP-05: New password theo quy tắc của Create account; Confirm không khớp hoặc để trống thì báo lỗi ngay khi gõ; [[1]](#ref-1) `705a1ad` | Không có | RF-10 | — | Ready | Product owner |
| RP-06: lưu thành công thì hiện "Password updated.", đăng xuất mọi phiên; [[1]](#ref-1) `705a1ad` | Không có | — | — | Ready | Product owner |
| RP-07: link hết hạn hoặc đã dùng: Send a new link, Back to sign in; [[1]](#ref-1) `705a1ad` | Không có | — | — | Ready | Product owner |
| RP-08: link reset mang theo đích chờ và mở được khi đang đăng nhập; [[1]](#ref-1) `705a1ad` | Không có | — | — | Ready | Product owner |
| SS-01: Sign out xóa phiên, đích chờ, dữ liệu đã tải, rồi mở Landing; [[3]](#ref-3) `bd0ecff` | Không có | — | — | Ready | Product owner |
| SS-02: Sign out lỗi thì vẫn đăng nhập và báo toast để thử lại; [[3]](#ref-3) `bd0ecff` | Không có | — | — | Ready | Product owner |
| SS-03: không có phiên thì màn workspace hiện màn chặn; [[3]](#ref-3) `bd0ecff` | Không có | — | — | Ready | Product owner |
| SS-04: phiên kết thúc khi màn đang mở thì hiện màn chặn khi chuyển màn hoặc quay lại tab; [[3]](#ref-3) `bd0ecff` | Không có | — | — | Ready | Product owner |
| SS-05: thời hạn phiên tuyệt đối 30 ngày; [[2]](#ref-2) `705a1ad` | Không có | — | — | Ready | Product owner |
| SS-06: mở link xác minh khi đang có phiên tài khoản khác thì giữ phiên và báo email vừa xác minh; [[1]](#ref-1) `705a1ad` | Không có | — | — | Ready | Product owner |
| SS-07: không kiểm được phiên (mất mạng, API lỗi) thì hiện lỗi tải kèm nút thử lại; [[5, ADR-001]](#ref-5) `705a1ad` | Không có | — | — | Ready | Product owner |
| SS-08: không giới hạn số phiên đồng thời của một tài khoản; [[2]](#ref-2) `705a1ad` | Không có | RF-09 | — | Ready | Product owner |
| SEC-01: cookie `HttpOnly`, `SameSite=Lax`, thêm `Secure` ở production; [[2]](#ref-2) `705a1ad` | Không có | — | — | Ready | Product owner |
| SEC-02: chỉ chấp nhận origin và callback URL thuộc `BETTER_AUTH_URL`; [[2]](#ref-2) `705a1ad` | Không có | — | — | Ready | Product owner |
| SEC-03: Create account và Reset password trả cùng nội dung và status; thời gian phản hồi không được kiểm (rủi ro chấp nhận); [[2]](#ref-2) `705a1ad` | Không có | RF-04 | — | Ready | Product owner |
| SEC-04: bộ đếm rate limit lưu trong PostgreSQL; [[2]](#ref-2) `705a1ad` | Không có | — | — | Ready | Product owner |
| SEC-05: ràng buộc deploy cho `X-Forwarded-For`; [[2]](#ref-2) `705a1ad` | — | — | — | Ngoài phạm vi | Product owner |
| SEC-06: dev in email ra console; production không khởi động khi thiếu biến email; [[2]](#ref-2) `705a1ad` | Không có | — | — | Ready | Product owner |
| SEC-07: giới hạn gửi link 3 lần/60 giây/IP, Create account 3 lần/10 giây/IP; [[2]](#ref-2) `705a1ad` | Không có | — | — | Ready | Product owner |
| SEC-08: header bảo mật trên mọi response API, `no-store` cho `/api/auth/*`; [[2]](#ref-2) `705a1ad` | Không có | — | — | Ready | Product owner |
| SEC-09: gửi email lỗi thì chỉ ghi log, response giống khi gửi thành công; [[2]](#ref-2) `705a1ad` | Không có | RF-01 | — | Ready | Product owner |
| SEC-10: điều kiện trước khi deploy public: giới hạn theo email, giới hạn tổng theo ngày, dọn tài khoản chưa xác minh; [[2]](#ref-2) `705a1ad` | — | — | — | Ngoài phạm vi | Product owner |
| ASVS-6.2.7: ô password cho dán, cho trình duyệt và password manager điền; [[5, ADR-002]](#ref-5) `705a1ad`, [[9, 6.2.7]](#ref-9) | Không có | RF-11 | — | Ready | Product owner |
| ASVS-6.3.2: không có tài khoản mặc định như root, admin, sa; [[5, ADR-002]](#ref-5) `705a1ad`, [[9, 6.3.2]](#ref-9) | Không có | RF-11 | — | Ready | Product owner |
| ASVS-7.2.2: token phiên được sinh động, không phải secret tĩnh; [[5, ADR-002]](#ref-5) `705a1ad`, [[10, 7.2.2]](#ref-10) | Không có | RF-11 | — | Ready | Product owner |
| ASVS-7.2.3: token phiên duy nhất, sinh bằng CSPRNG, ít nhất 128 bit entropy; [[5, ADR-002]](#ref-5) `705a1ad`, [[10, 7.2.3]](#ref-10) | Không có | RF-11 | — | Ready | Product owner |
| ASVS-7.2.4: đăng nhập thì cấp token phiên mới và hủy token đang có; [[5, ADR-002]](#ref-5) `705a1ad`, [[10, 7.2.4]](#ref-10) | Không có | RF-11 | — | Ready | Product owner |
| ASVS-3.4.2: `Access-Control-Allow-Origin` cố định hoặc kiểm theo allowlist; [[5, ADR-002]](#ref-5) `705a1ad`, [[11, 3.4.2]](#ref-11) | Không có | RF-11 | — | Ready | Product owner |
| A11Y-01: lỗi form dưới trường, có `aria-describedby`, `aria-invalid`, focus trường lỗi đầu tiên, danh sách lỗi; [[4]](#ref-4) `dbbaafe` | Không có | — | — | Ready | Product owner |
| A11Y-02: quét accessibility tự động 6 màn hình Auth (Sign in, Create account, Check your email, Forgot password, Choose a new password, trang link hết hạn), kể cả trạng thái lỗi; không đạt khi có vi phạm `serious` hoặc `critical`; [[6]](#ref-6) `705a1ad` | Không có | RF-05 | — | Ready | Product owner |

Product owner xác nhận ba requirement Ngoài phạm vi ngày 2026-11-17:

- RD-03: Strategy Engine chưa được build.
- SEC-05: chỉ kiểm được trên môi trường deploy có reverse proxy.
- SEC-10: Security ghi đây là điều kiện trước khi deploy public [[2, Giới hạn gửi email]](#ref-2).

| Trạng thái | Định nghĩa |
| --- | --- |
| Ready | Đạt mọi tiêu chí sẵn sàng |
| Ready với giả định | Chưa đạt một tiêu chí, người giữ requirement đã chấp nhận giả định cụ thể; giả định được ghi ở finding tương ứng |
| Chờ câu hỏi mở | Chưa xác định được expected behavior cho đến khi câu hỏi mở được chốt |
| Chưa Ready | Có finding chưa được xử lý |
| Ngoài phạm vi | Có quyết định loại khỏi phạm vi, kèm người quyết định |

| Trạng thái | Số requirement |
| --- | --- |
| Ready | 81 |
| Ready với giả định | 0 |
| Chờ câu hỏi mở | 0 |
| Chưa Ready | 0 |
| Ngoài phạm vi | 3 |
| **Tổng** | **84** |


## 4. Khác biệt giữa requirement và implementation

| Requirement ID / version | Requirement quy định | Implementation hiện tại | Nguồn quan sát | Quyết định |
| --- | --- | --- | --- | --- |
| SI-06; `705a1ad` | Tối đa 3 lần bấm từ một IP; bộ đếm về 0 sau 10 giây không bấm | Giới hạn riêng 5 lần trong 15 phút | `apps/api/src/configs/auth.ts:13`, `:86` tại `b4ca981` | Giữ requirement, implementation cần sửa ([OQ-078](../../../../../open-questions.md#oq-078)) |
| GO-03; `705a1ad` | Tài khoản chưa xác minh: báo email đã đăng ký, gợi ý Sign in hoặc Reset password | Không có xử lý riêng cho lỗi `account_not_linked` trong `apps/` | grep tại `b4ca981` | Giữ requirement, implementation cần sửa ([OQ-077](../../../../../open-questions.md#oq-077)) |
| GO-06; `705a1ad` | Luôn hiện màn chọn tài khoản | Không đặt `prompt=select_account` | `apps/api/src/configs/auth.ts:77–80` tại `b4ca981` | Giữ requirement, implementation cần sửa (spec ghi **Confirmed**) |
| CA-13, CM-02; `705a1ad` | Full name tối đa 100, password tối đa 128 ký tự | Schema chỉ có giới hạn dưới | `packages/shared/src/schemas/auth.schema.ts` tại `b4ca981` | Giữ requirement, implementation cần sửa ([OQ-080](../../../../../open-questions.md#oq-080)) |
| CA-14; `705a1ad` | Từ chối password phổ biến hoặc đã bị lộ | Không có kiểm tra nào | `apps/api/src/configs/auth.ts` tại `b4ca981` | Giữ requirement, implementation cần sửa ([[5, ADR-002]](#ref-5)) |
| RP-08; `705a1ad` | Link reset mang theo đích chờ | `redirectTo: '/reset-password'` cố định | `apps/web/app/api/auth.ts:88` tại `b4ca981` | Giữ requirement, implementation cần sửa (spec ghi **Confirmed**) |
| SEC-08; `705a1ad` | Header bảo mật và `no-store` | Không có header nào trong số đó | grep `nosniff` trong `apps/` tại `b4ca981` | Giữ requirement, implementation cần sửa ([[5, ADR-002]](#ref-5)) |
| SS-05; `705a1ad` | Phiên bị từ chối sau 30 ngày | Chỉ có `expiresIn` 7 ngày và `updateAge` 1 ngày | `apps/api/src/configs/auth.ts:82` tại `b4ca981` | Giữ requirement, implementation cần sửa ([[5, ADR-002]](#ref-5)) |
| SS-06; `705a1ad` | Giữ phiên hiện tại | `autoSignInAfterVerification: true`, không có điều kiện | `apps/api/src/configs/auth.ts:70` tại `b4ca981` | Giữ requirement, implementation cần sửa (spec ghi **Confirmed**) |
Implementation không được dùng làm nguồn của expected behavior. Khi requirement và implementation khác nhau, người giữ requirement quyết định bên nào đúng.

## 5. Tiêu chí đạt

| ID | Tiêu chí | Điều kiện đầu vào | Kết quả |
| --- | --- | --- | --- |
| Q1-01 | Tài liệu requirement và tiêu chí sẵn sàng được ghi kèm version | RC-01, RC-02 | Đạt |
| Q1-02 | Mỗi requirement trong phạm vi có một dòng ở mục 3; tổng ở bảng số lượng bằng số requirement trong tài liệu | RC-01 | Đạt: 84 dòng, tổng 84. Danh sách được lập lại từ commit `705a1ad` của tài liệu nguồn, gồm 6 mục ASVS L1 mà ADR-002 áp dụng nhưng spec không nêu hành vi (RF-11) |
| Q1-03 | Requirement chỉ được ghi Ready khi đạt mọi tiêu chí; Ready với giả định có người giữ requirement chấp nhận | RC-02, RC-04 | Đạt |
| Q1-04 | Requirement Chờ câu hỏi mở dẫn tới ID câu hỏi; nội dung câu hỏi không được chép vào file này | RC-05 | Đạt: không có requirement ở trạng thái này |
| Q1-05 | Giá trị cụ thể trong requirement có nguồn; giá trị do người phân tích đề xuất được ghi lý do và được duyệt riêng từng giá trị | IN-06 | Đạt: giá trị của requirement Ready đều có trong tài liệu nguồn; danh sách màn hình của A11Y-02 có trong quyết định RF-05 |
| Q1-06 | Mọi khác biệt giữa requirement và implementation có quyết định của người giữ requirement hoặc dẫn tới câu hỏi mở | IN-08 | Đạt |
| Q1-07 | Mọi tiền tố của requirement ID có trong bảng tiền tố ở mục 3, kèm nhóm và section nguồn; không tiền tố nào trùng với tiền tố ID của template STLC | — | Đạt: `pnpm check:docs` pass |

**Người review / ngày:** Product owner, 2026-11-17

## References

1. <a id="ref-1"></a>[Authentication](../../../../../design/prototype/docs/requirements/authentication.md) — commit `705a1ad`, 2026-11-17
2. <a id="ref-2"></a>[Security](../../../../../architecture/23-security.md) — commit `d6c0541`, 2026-11-17
3. <a id="ref-3"></a>[Workspace](../../../../../design/prototype/docs/requirements/workspace.md) — commit `bd0ecff`, 2026-11-16
4. <a id="ref-4"></a>[Crypto Force UI Prototype](../../../../../design/prototype/README.md) — commit `dbbaafe`, 2026-11-16
5. <a id="ref-5"></a>[Architectural Decisions](../../../../../architecture/30-decisions.md) — commit `705a1ad`, 2026-11-17
6. <a id="ref-6"></a>[Test Strategy](../../../../../testing/test-strategy.md) — commit `705a1ad`, 2026-11-17
7. <a id="ref-7"></a>[Open Questions](../../../../../open-questions.md) — commit `ac49066`, 2026-11-16
8. <a id="ref-8"></a>[ISTQB Certified Tester Foundation Level Syllabus v4.0.1](https://www.istqb.org/wp-content/uploads/2024/11/ISTQB_CTFL_Syllabus_v4.0.1.pdf) — v4.0.1, 2024-09-15
9. <a id="ref-9"></a>OWASP ASVS 5.0, V6 Authentication. <https://raw.githubusercontent.com/OWASP/ASVS/master/5.0/en/0x15-V6-Authentication.md> — truy cập 2026-11-17
10. <a id="ref-10"></a>OWASP ASVS 5.0, V7 Session Management. <https://raw.githubusercontent.com/OWASP/ASVS/master/5.0/en/0x16-V7-Session-Management.md> — truy cập 2026-11-17
11. <a id="ref-11"></a>OWASP ASVS 5.0, V3 Web Frontend Security. <https://raw.githubusercontent.com/OWASP/ASVS/master/5.0/en/0x12-V3-Web-Frontend-Security.md> — truy cập 2026-11-17
