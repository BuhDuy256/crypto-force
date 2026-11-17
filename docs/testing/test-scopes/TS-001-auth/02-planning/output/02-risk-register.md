# Risk Register

Đọc file này để biết các rủi ro sản phẩm và rủi ro dự án của đợt kiểm thử Authentication, mức rủi ro của từng rủi ro, và cách mỗi rủi ro được xử lý.

## 1. Cách đánh giá

| Trường | Nội dung |
| --- | --- |
| Cách xác định rủi ro | Rà soát requirement Ready và khác biệt giữa requirement và implementation [[2]](#ref-2); đối chiếu OWASP ASVS 5.0 [[6]](#ref-6); rủi ro chấp nhận của ADR-002 [[3]](#ref-3); rà soát testware hiện có tại commit `393e2b8` |
| Thang khả năng xảy ra | **Cao:** Requirement Readiness mục 4 ghi implementation tại `b4ca981` khác requirement. **Trung bình:** hành vi do code hoặc cấu hình riêng của dự án tạo ra và chưa có test tự động kiểm hành vi đó. **Thấp:** hành vi mặc định của Better Auth không bị cấu hình thay đổi, hoặc đã có test tự động trong repo kiểm hành vi đó |
| Thang mức ảnh hưởng | **Cao:** người khác chiếm hoặc dùng được tài khoản hoặc phiên của người dùng. **Trung bình:** lộ việc một email đã đăng ký; người dùng không hoàn thành được một luồng Auth; hoặc thiếu một lớp phòng thủ mà ADR-002 yêu cầu. **Thấp:** người dùng vẫn hoàn thành luồng nhưng gặp thông báo sai, đích chuyển tiếp sai hoặc phải thao tác thêm |
| Cách tính mức rủi ro | Ma trận khả năng × ảnh hưởng [[1, §5.2.3]](#ref-1). **Cao:** một yếu tố Cao và yếu tố kia từ Trung bình trở lên. **Trung bình:** cả hai Trung bình, hoặc một Cao và một Thấp. **Thấp:** các trường hợp còn lại |
| Người tham gia | Agent đề xuất; product owner review |

Thang khả năng, thang ảnh hưởng và ma trận là đề xuất của người lập plan; product owner duyệt ngày 2026-11-17. Lý do: dự án chưa có dữ liệu defect (IN-07), nên khả năng xảy ra dựa trên bằng chứng có thể kiểm tra trong repo thay vì ý kiến.

Khi không có dữ liệu để ước lượng khả năng xảy ra, ghi "Chưa xác định" thay vì tự gán một mức.

## 2. Rủi ro sản phẩm

| Risk ID | Rủi ro | Đặc tính chất lượng | Test basis item / feature | Khả năng | Ảnh hưởng | Mức rủi ro | Căn cứ đánh giá | Xử lý |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PR-01 | Giới hạn số lần Sign in hoặc gửi email sai, nên kẻ tấn công thử được nhiều password hoặc gửi nhiều email từ một IP | Security | SI-06, GO-08, SEC-04, SEC-07; `705a1ad` | Cao | Cao | Cao | SI-06: code giới hạn 5 lần/15 phút, requirement là 3 lần/10 giây [[2, mục 4]](#ref-2) | Giảm bằng testing, xem Test Approach |
| PR-02 | Response, thông báo hoặc email làm lộ việc một email đã đăng ký | Security | SI-04, SI-12, CA-04, CA-16, RP-03, SEC-03, SEC-09; `705a1ad` | Trung bình | Trung bình | Trung bình | Đã có test cho response của Create account và Reset password (`apps/api/test/auth.test.ts`). Chưa có test cho SEC-09 (gửi email lỗi) và SI-12 | Giảm bằng testing, xem Test Approach |
| PR-03 | Phiên tồn tại lâu hơn quy định hoặc không kết thúc khi cần, nên người khác dùng được phiên trên máy dùng chung | Security, Functional suitability | SI-09, SI-10, SI-11, SS-01, SS-05, SS-08, GO-10, ASVS-7.2.4; `705a1ad`, `bd0ecff` | Cao | Cao | Cao | SS-05: code không có thời hạn tuyệt đối 30 ngày [[2, mục 4]](#ref-2) | Giảm bằng testing, xem Test Approach |
| PR-04 | Origin, callback URL hoặc đích chuyển tiếp ngoài app được chấp nhận, dẫn tới open redirect hoặc request giả mạo | Security | RD-06, SEC-02, ASVS-3.4.2; `705a1ad` | Trung bình | Cao | Cao | Đã có test từ chối callback URL ngoài app. RD-06 là logic của `apps/web`, chưa có test | Giảm bằng testing, xem Test Approach |
| PR-05 | Cookie phiên hoặc header bảo mật thiếu thuộc tính, nên phiên dễ bị đánh cắp hoặc trang bị nhúng vào site khác | Security | SEC-01, SEC-08; `705a1ad` | Cao | Trung bình | Cao | SEC-08: không có header nào trong số đã yêu cầu [[2, mục 4]](#ref-2) | Giảm bằng testing, xem Test Approach |
| PR-06 | Link reset password dùng lại được, không hết hạn, không đăng xuất các phiên cũ, hoặc làm mất đích chờ | Security, Functional suitability | RP-04, RP-06, RP-07, RP-08; `705a1ad` | Trung bình | Cao | Cao | Đã có test "dùng một lần" và "đăng xuất phiên cũ". Chưa có test hết hạn 1 giờ. RP-08 khác implementation [[2, mục 4]](#ref-2) | Giảm bằng testing, xem Test Approach |
| PR-07 | Link xác minh email tạo phiên sai: thay phiên của tài khoản khác đang đăng nhập, tạo phiên ở lần mở thứ hai, hoặc báo lỗi sai | Security, Functional suitability | CA-05, CA-06, CA-12, CA-17, SS-06; `705a1ad` | Cao | Trung bình | Cao | SS-06: `autoSignInAfterVerification: true` không có điều kiện [[2, mục 4]](#ref-2) | Giảm bằng testing, xem Test Approach |
| PR-08 | Continue with Google liên kết sai tài khoản hoặc tạo tài khoản sai, nên người khác chiếm được tài khoản đã có | Security, Functional suitability | GO-01 đến GO-07, GO-09; `705a1ad` | Cao | Cao | Cao | GO-03 và GO-06 khác implementation [[2, mục 4]](#ref-2) | Giảm bằng testing, xem Test Approach |
| PR-09 | Quy tắc password sai: nhận password quá dài, cắt bớt, nhận password phổ biến hoặc đã bị lộ, chặn dán password | Security | CM-02, CA-13, CA-14, RP-05, ASVS-6.2.7; `705a1ad` | Cao | Trung bình | Cao | CA-13 và CA-14 khác implementation [[2, mục 4]](#ref-2) | Giảm bằng testing, xem Test Approach |
| PR-10 | Validation form, thông báo lỗi hoặc điều hướng giữa các bước sai, nên người dùng không hoàn thành Sign in, Create account hoặc Reset password | Functional suitability | CM-01, SI-01 đến SI-05, SI-07, SI-08, CA-01 đến CA-03, CA-07 đến CA-10, CA-15, RP-01 đến RP-03; `705a1ad` | Trung bình | Trung bình | Trung bình | Code UI riêng của dự án. E2E hiện có chỉ kiểm luồng chính, form trống và tab | Giảm bằng testing, xem Test Approach |
| PR-11 | Chuyển tiếp sau khi đăng nhập tới sai đích hoặc làm mất đích chờ | Functional suitability | RD-01, RD-02, RD-04, RD-05, RD-07, RD-08, SI-11, GO-05, CA-09, CA-10, RP-08; `705a1ad` | Cao | Thấp | Trung bình | RP-08 khác implementation [[2, mục 4]](#ref-2) | Giảm bằng testing, xem Test Approach |
| PR-12 | Màn chặn, lỗi tải phiên, lỗi Sign out hoặc lỗi mạng không hiện đúng, nên người dùng không biết phải làm gì | Functional suitability, Reliability | CM-03, SS-02, SS-03, SS-04, SS-07; `705a1ad`, `bd0ecff` | Trung bình | Trung bình | Trung bình | SS-02, SS-03, SS-04, SS-07 có E2E trong `apps/web/e2e/workspace.spec.ts`. CM-03 chưa có test | Giảm bằng testing, xem Test Approach |
| PR-13 | Trang Auth không dùng được bằng bàn phím hoặc screen reader | Usability (interaction capability) | A11Y-01, A11Y-02, CA-11, SI-08; `705a1ad`, `dbbaafe` | Trung bình | Trung bình | Trung bình | Chưa từng quét accessibility; chưa cài `@axe-core/playwright` | Giảm bằng testing, xem Test Approach |
| PR-14 | Production khởi động khi thiếu cấu hình email, lỗi gửi email làm hỏng luồng, hoặc email thật không tới hộp thư hay chứa link sai | Reliability | SEC-06, SEC-09, CA-03, CA-05, RP-01, RP-04; `705a1ad` | Trung bình | Trung bình | Trung bình | Kiểm biến môi trường, xử lý lỗi gửi và nội dung email là code riêng của dự án (`apps/api/src/services/mailer.ts`, `auth-email.service.ts`), chưa có test với Resend thật | Giảm bằng testing, xem Test Approach |
| PR-15 | Có tài khoản mặc định, hoặc token phiên là secret tĩnh hay không đủ ngẫu nhiên | Security | ASVS-6.3.2, ASVS-7.2.2, ASVS-7.2.3; `705a1ad` | Thấp | Cao | Trung bình | Hành vi mặc định của Better Auth; repo không có seed tài khoản | Giảm bằng testing, xem Test Approach |
| PR-16 | Reverse proxy cấu hình sai `X-Forwarded-For`, nên client tự đặt IP và vượt giới hạn Sign in | Security | SEC-05; `705a1ad` | Chưa xác định | Cao | Chưa xác định | Chưa có môi trường deploy. Ở local, test hiện có tự đặt `x-forwarded-for` cho từng request | Chuyển giao: kiểm trên môi trường deploy, trước khi deploy public. Risk owner: product owner |
| PR-17 | Thiếu giới hạn theo email, giới hạn tổng theo ngày và việc dọn tài khoản chưa xác minh khi deploy public | Security | SEC-10; `705a1ad` | Chưa xác định | Trung bình | Chưa xác định | Security ghi đây là điều kiện trước khi deploy public [[4, Giới hạn gửi email]](#ref-4) | Chuyển giao: điều kiện deploy public. Risk owner: product owner |
| PR-18 | Chuyển tiếp từ Backtest this idea sai đích | Functional suitability | RD-03; `705a1ad` | Chưa xác định | Thấp | Chưa xác định | Strategy Engine chưa được build | Chấp nhận trong đợt này. Product owner quyết định Ngoài phạm vi ngày 2026-11-17 [[2, mục 3]](#ref-2) |
| PR-19 | Các rủi ro chấp nhận của ADR-002: không có MFA, giới hạn đăng nhập chỉ theo IP, không có idle timeout, phần mềm quét mở link xác minh, thời gian phản hồi khác nhau, không kiểm chữ ký id_token | Security | ADR-002 [[3]](#ref-3); `705a1ad` | Chưa xác định | Trung bình | Chưa xác định | Rủi ro đã được ghi và chấp nhận trong ADR-002 | Chấp nhận. Product owner chấp nhận trong ADR-002 (Accepted) |
| PR-20 | App header, menu tài khoản, drawer và hộp thoại khi Sign out sai | Functional suitability, Usability | Workspace [[5]](#ref-5); `bd0ecff` | Thấp | Thấp | Thấp | Thuộc test scope workspace. Đã có E2E trong `apps/web/e2e/workspace.spec.ts` | Chuyển giao: test scope workspace (chưa tạo). Risk owner: product owner |
| PR-21 | Auth hoạt động khác trên trình duyệt ngoài Chromium, ví dụ cookie `SameSite` hoặc password manager | Compatibility | SEC-01, ASVS-6.2.7; `705a1ad` | Chưa xác định | Trung bình | Chưa xác định | Test basis không nêu trình duyệt được hỗ trợ. Playwright chỉ cấu hình Chromium | Chấp nhận trong đợt này. Product owner quyết định ngày 2026-11-17 |

Rủi ro sản phẩm gắn với đặc tính chất lượng theo ISO/IEC 25010 [[1, §5.2.2]](#ref-1).

Mỗi requirement Ready thuộc ít nhất một rủi ro từ PR-01 đến PR-15. PR-16 đến PR-21 là rủi ro của hạng mục Out of scope và của đặc tính chất lượng không được test.

## 3. Rủi ro dự án

Mức của rủi ro dự án dùng cùng ma trận ở mục 1; khả năng và ảnh hưởng được đánh giá theo tác động lên đợt kiểm thử.

| Risk ID | Rủi ro | Loại | Khả năng | Ảnh hưởng | Mức rủi ro | Biện pháp giảm thiểu / dự phòng | Owner |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PJ-01 | 9 khác biệt giữa requirement và implementation chưa có người và hạn sửa, nên test của chúng fail và đợt kiểm thử không đạt exit criteria | Tổ chức | Cao | Cao | Cao | Chạy test trên `b4ca981` và ghi defect cho từng khác biệt; lên lịch sửa trước vòng confirmation (Estimates & Schedule M-07) | Product owner |
| PJ-02 | CI không chạy `pnpm test` và `pnpm test:e2e`, nên regression sau khi sửa code không được phát hiện | Kỹ thuật | Cao | Trung bình | Cao | Thêm job chạy integration test với PostgreSQL vào CI trước Phase 05; trong lúc chưa có, chạy cả hai lệnh ở local trước mỗi commit chạm Auth | Product owner |
| PJ-03 | E2E dùng database dev và xóa cả bảng `rate_limit`, nên test giới hạn Sign in bị ảnh hưởng chéo và dữ liệu dev bị thay đổi | Kỹ thuật | Cao | Trung bình | Cao | Phase 04 tạo database riêng cho E2E và cách cô lập IP cho từng test | Agent (Phase 04) |
| PJ-04 | Cấu hình Google OAuth cho localhost không chạy được (ví dụ redirect URI chưa đăng ký trên Google Cloud), nên GO-01, GO-05, GO-06 không kiểm được với Google thật | Nhà cung cấp | Thấp | Trung bình | Thấp | `.env` đã có client ID và secret cho `http://localhost:5173`; product owner xác nhận ngày 2026-11-17. EN-07 kiểm lại trước session Google thật; integration test dùng OAuth provider giả nên không phụ thuộc Google | Product owner |
| PJ-05 | Thiếu công cụ: `@axe-core/playwright`, Vitest cho `packages/shared` và `apps/web`, cách điều khiển thời gian cho giới hạn 10 giây, link 1 giờ và phiên 30 ngày | Kỹ thuật | Cao | Trung bình | Cao | Phase 04 cài và cấu hình; mỗi công cụ mới được product owner duyệt khi thêm dependency | Agent (Phase 04) |
| PJ-06 | Agent vừa thiết kế vừa chạy test, nên lỗi trong cách hiểu requirement của agent không được phát hiện | Con người | Trung bình | Trung bình | Trung bình | Product owner review test condition và test case ở Phase 03 trước khi viết test | Product owner |
| PJ-07 | Không có dữ liệu effort và không có mốc thời gian, nên estimate có sai số lớn | Tổ chức | Cao | Thấp | Trung bình | Ghi effort thực tế từng phase để hiệu chỉnh cho test scope sau | Agent |
| PJ-08 | `better-auth` khai báo `^1.7.25`. `pnpm-lock.yaml` khóa ở `1.7.25` và CI cài bằng `--frozen-lockfile`, nhưng khi có người chạy update hoặc thêm dependency, version 1.x mới có thể có hành vi khác spec (spec ghi theo Better Auth 1.7.25 ở RF-02, RF-03) | Nhà cung cấp | Thấp | Trung bình | Thấp | Ghi version thực tế đã cài trong test log; chạy lại toàn bộ regression khi version thay đổi (SR-05) | Product owner |
| PJ-09 | `.env` local có `RESEND_API_KEY`, nên mỗi lần chạy E2E gọi Resend thật với địa chỉ `@example.com` và bị Resend từ chối. Test vẫn pass vì helper đánh dấu email đã xác minh trong database, nhưng E2E phụ thuộc mạng và sinh log lỗi | Kỹ thuật | Cao | Thấp | Trung bình | Phase 04 chạy E2E với `RESEND_API_KEY` để trống (AS-06) | Agent (Phase 04) |

## 4. Tiêu chí đạt

| ID | Tiêu chí | Điều kiện đầu vào | Kết quả |
| --- | --- | --- | --- |
| Q2-01 | Mỗi rủi ro sản phẩm dẫn tới test basis item hoặc feature trong phạm vi và tới một đặc tính chất lượng | RC-01 | Đạt |
| Q2-02 | Khả năng và ảnh hưởng có căn cứ; không có căn cứ thì ghi "Chưa xác định" | IN-07, IN-08 | Đạt: khả năng dựa trên khác biệt đã biết và testware hiện có, vì IN-07 Chưa có |
| Q2-03 | Rủi ro từ chuẩn bắt buộc được xác định theo version và mức áp dụng lấy từ bản gốc | RC-04 | Đạt |
| Q2-04 | Mỗi rủi ro sản phẩm có cách xử lý; rủi ro được giảm bằng testing có mặt trong ma trận của Test Approach | — | Đạt |
| Q2-05 | Rủi ro sản phẩm có xử lý "Chấp nhận" ghi tên risk owner đã quyết định | RC-02 | Đạt: PR-18, PR-19, PR-21 |
| Q2-06 | Mỗi rủi ro dự án có owner và biện pháp giảm thiểu hoặc dự phòng | — | Đạt |
| Q2-07 | Rủi ro của các hạng mục Out of scope trong Test Plan đã được xem xét | — | Đạt: PR-16 đến PR-21 |

**Người review / ngày:** Product owner, 2026-11-17

## References

1. <a id="ref-1"></a>[ISTQB Certified Tester Foundation Level Syllabus v4.0.1](https://www.istqb.org/wp-content/uploads/2024/11/ISTQB_CTFL_Syllabus_v4.0.1.pdf) — v4.0.1, 2024-09-15
2. <a id="ref-2"></a>[Requirement Readiness](../../01-requirement-analysis/output/01-requirement-readiness.md) — commit `da6b261`, 2026-11-17
3. <a id="ref-3"></a>[Architectural Decisions](../../../../../architecture/30-decisions.md) — commit `705a1ad`, 2026-11-17
4. <a id="ref-4"></a>[Security](../../../../../architecture/23-security.md) — commit `705a1ad`, 2026-11-17
5. <a id="ref-5"></a>[Workspace](../../../../../design/prototype/docs/requirements/workspace.md) — commit `bd0ecff`, 2026-11-16
6. <a id="ref-6"></a>[Baseline Comparison](../../01-requirement-analysis/output/02-baseline-comparison.md) — commit `da6b261`, 2026-11-17
