# Test Data & Environment Requirements

Đọc file này để biết các test case cần dữ liệu và môi trường có đặc điểm gì, ai chịu trách nhiệm, cần trong bao lâu, và cách reset.

## 1. Yêu cầu test data

Mọi email test dùng domain `example.com` hoặc `example.test` và có phần riêng cho mỗi lần chạy, trừ DR-12. Không dùng tài khoản hay dữ liệu cá nhân thật.

| Data requirement ID | Test case IDs | Mô tả | Người chịu trách nhiệm | Thời gian cần | Yêu cầu reset | Lưu trữ hoặc huỷ |
| --- | --- | --- | --- | --- | --- | --- |
| DR-01 | TC-001, TC-002, TC-013, TC-014, TC-021, TC-030, TC-031, TC-033 đến TC-042, TC-046 đến TC-050, TC-060 đến TC-069, TC-071, TC-076, TC-078, TC-092, TC-093, TC-097, TC-102, TC-110 đến TC-114, TC-120, TC-121, TC-123, TC-125, TC-126, TC-133, TC-135, TC-137, TC-142, TC-143, TC-146, TC-150, TC-160, TC-170, TC-171, TC-173, TC-175, TC-182, TC-186 đến TC-188, TC-190 đến TC-194, TC-205, TC-208, TC-220, TC-221, TC-223, TC-224, TC-229 đến TC-231, TC-243 đến TC-245 | Tài khoản email/password đã xác minh (A, và B khi test cần hai tài khoản). Password `Correct-Horse-91`; password mới dùng `New-Horse-92`, `Other-Horse-93`; password sai `Wrong-Horse-00`. Các password này không có trong danh sách của BD-11, và stub Pwned Passwords trả "chưa lộ" cho chúng | Agent (Phase 04) | Phase 04 đến hết Phase 05 | Tạo mới trong mỗi test; email duy nhất nên chạy song song không đụng nhau | Xóa cùng database test |
| DR-02 | TC-011, TC-012, TC-021, TC-044, TC-045, TC-070 đến TC-078, TC-103, TC-145, TC-150, TC-174, TC-183, TC-199, TC-229 | Tài khoản email/password chưa xác minh (U, hoặc B trước khi xác minh), password `Correct-Horse-91`, có ít nhất một link xác minh trong mailer | Agent (Phase 04) | Phase 04 đến hết Phase 05 | Tạo mới trong mỗi test | Xóa cùng database test |
| DR-03 | TC-100, TC-104, TC-150 | Tài khoản chỉ đăng nhập bằng Google (G), email `g1@example.test` kèm phần riêng của lần chạy, liên kết với `sub` S1 của OAuth provider giả, không có password | Agent (Phase 04) | Phase 04 đến hết Phase 05 | Tạo mới trong mỗi test | Xóa cùng database test |
| DR-04 | TC-043, TC-100 đến TC-104, TC-199, TC-232 | Profile do OAuth provider giả trả về: `sub`, email, `email_verified: true`, theo từng cột của MD-08 | Agent (Phase 04) | Phase 04 đến hết Phase 05 | Cấu hình cho từng test | Không lưu |
| DR-05 | TC-090 đến TC-093, TC-096, TC-097, TC-201, TC-203 | Password theo độ dài: ASCII dài 6, 7, 8, 9, 127, 128, 129, 130 ký tự, sinh từ một chuỗi không có trong danh sách của BD-11; emoji `😀` lặp 4, 8, 65, 129 lần; `qzmvbtkw`; `  Pass Word Ab9  ` (2 khoảng trắng ở đầu và cuối) | Agent (Phase 04) | Phase 04 đến hết Phase 05 | Sinh trong test, không phụ thuộc trạng thái | Không lưu |
| DR-06 | TC-110 đến TC-114 | Password trong danh sách phổ biến: `password`, `12345678` (BD-11). Password không có trong danh sách: chuỗi ngẫu nhiên 20 ký tự sinh mỗi lần chạy | Agent (Phase 04) | Phase 04 đến hết Phase 05 | Sinh trong test | Không lưu |
| DR-07 | TC-001 đến TC-021, TC-041, TC-138, TC-175 | Địa chỉ IP riêng cho mỗi test case, đặt qua `x-forwarded-for`, lấy từ dải tài liệu `198.51.100.0/24` và `203.0.113.0/24` | Agent (Phase 04) | Phase 04 đến hết Phase 05 | Mỗi test case một IP; không xóa cả bảng `rate_limit` (Test Approach mục 6) | Xóa cùng database test |
| DR-08 | TC-039, TC-044 đến TC-046, TC-060 đến TC-078, TC-092, TC-093, TC-097, TC-110 đến TC-114, TC-135, TC-142, TC-143, TC-145, TC-146, TC-176 đến TC-180, TC-186 đến TC-188, TC-190, TC-191, TC-199, TC-230, TC-243 đến TC-245 | Link xác minh và link reset lấy từ mailer ghi bộ nhớ (CI) hoặc từ console của API (S): URL đầy đủ, token, thời điểm gửi. Có thể sửa token (TC-145, TC-146) | Agent (Phase 04) | Phase 04 đến hết Phase 05 | Lấy mới trong mỗi test | Không lưu |
| DR-09 | TC-160 | Giá trị `next`: `/backtest`, `https://evil.example/`, `//evil.example`, `/\evil.example`, `javascript:alert(1)`, `/sign-in`, không có `next` | Agent (Phase 04) | Phase 04 đến hết Phase 05 | Không cần | Không lưu |
| DR-10 | TC-094, TC-095, TC-098, TC-144 | Full name ASCII dài 0, 1, 2, 99, 100, 101, 102 ký tự; emoji `😀` lặp 51 và 101 lần; 3 khoảng trắng; `An Nguyen` | Agent (Phase 04) | Phase 04 đến hết Phase 05 | Sinh trong test | Không lưu |
| DR-11 | TC-015, TC-016, TC-130 đến TC-133, TC-136, TC-172, TC-176 đến TC-181, TC-184, TC-185, TC-189 | Giá trị email theo MD-11: ``, `an.example.com`, `an@`, `an@example`, `an@@example.com`, `an example@example.com`, `an@example.com` và các dạng ` an@example.com `, `An@Example.com`, `an+test@example.com`; email mới duy nhất cho Create account; `none@example.test` không có tài khoản | Agent (Phase 04) | Phase 04 đến hết Phase 05 | Email có tài khoản được tạo mới trong mỗi test | Xóa cùng database test |
| DR-12 | TC-195 đến TC-198, TC-103 phần S | Một tài khoản Google dùng để test (PJ-04); hộp thư của chủ tài khoản Resend, dùng dạng `+tag` mới cho mỗi lần chạy | Product owner | Session thủ công ở Phase 05 | Tài khoản Crypto Force tạo trong session được xóa sau session | Không ghi email hay mật khẩu vào tài liệu |

## 2. Yêu cầu môi trường

| Env requirement ID | Test case IDs | Thành phần | Mô tả | Thật / được phép mock | Người chịu trách nhiệm | Thời gian cần |
| --- | --- | --- | --- | --- | --- | --- |
| ER-01 | TC-001 đến TC-020, TC-032 đến TC-036, TC-039, TC-041 đến TC-050, TC-063, TC-066, TC-068, TC-069, TC-077, TC-090 đến TC-093, TC-096, TC-097, TC-100 đến TC-104, TC-110 đến TC-114, TC-133, TC-150, TC-185, TC-192, TC-199, TC-201, TC-203 đến TC-206, TC-208, TC-220 đến TC-224, TC-229, TC-231, TC-232 | PostgreSQL và Better Auth | Database `<POSTGRES_DB>_test` tạo lại từ migration mỗi lần chạy (`pnpm test`); gọi `auth.handler` với cấu hình của `createAuth` | Thật | Agent | Phase 04 đến hết Phase 05 |
| ER-02 | TC-021, TC-030, TC-031, TC-037, TC-038, TC-040, TC-060 đến TC-062, TC-064, TC-065, TC-067, TC-070 đến TC-076, TC-078, TC-094, TC-095, TC-098, TC-103, TC-120 đến TC-126, TC-130 đến TC-146, TC-150, TC-160, TC-170 đến TC-184, TC-186 đến TC-191, TC-193, TC-194, TC-202, TC-207, TC-220, TC-221, TC-225, TC-227, TC-228, TC-230, TC-240 đến TC-246 | PostgreSQL cho E2E | Database riêng cho E2E, không dùng database dev (PJ-03) | Thật | Agent | Phase 04 đến hết Phase 05 |
| ER-03 | TC-011 đến TC-014, TC-039, TC-044 đến TC-046, TC-063, TC-066, TC-068, TC-069, TC-077, TC-101, TC-185, TC-192, TC-199, TC-208, TC-222, TC-229, TC-231 | Mailer giả | Ghi email vào bộ nhớ để test đọc người nhận, nội dung và link; có chế độ trả lỗi khi gửi | Mock. Mất: render email trong mail client, độ trễ và lỗi thật của Resend; bù bằng TC-197, TC-198 | Agent | Phase 04 đến hết Phase 05 |
| ER-04 | TC-009, TC-010, TC-017 đến TC-019, TC-043, TC-100 đến TC-104, TC-141, TC-199, TC-222, TC-232 | OAuth provider giả cho Google | Trả `code`, profile và `sub` theo test; trả `error=access_denied`, `error=server_error`; kiểm được `state` | Mock. Mất: màn chọn tài khoản, id_token thật, đóng cửa sổ Google; bù bằng TC-195, TC-196 và CHR-02 | Agent | Phase 04 đến hết Phase 05 |
| ER-05 | TC-090 đến TC-093, TC-096, TC-097, TC-110 đến TC-114, TC-201 | Stub API Pwned Passwords | Trả "đã lộ", "chưa lộ", 503, hoặc giữ request 10 giây không trả lời; không gửi tiền tố hash của password test ra ngoài | Mock. Mất: định dạng response thật và mạng thật | Agent | Phase 04 đến hết Phase 05 |
| ER-06 | TC-001, TC-002, TC-004 đến TC-020, TC-034 đến TC-036, TC-042, TC-045 đến TC-050, TC-062, TC-066, TC-067, TC-069, TC-072, TC-077, TC-078, TC-191 | Điều khiển thời gian | Đặt đồng hồ của API trong test (CI), hoặc sửa thời điểm hết hạn trong database (S), với độ chính xác tới 0,5 giây (TC-020) | Mock đồng hồ; không mất hành vi | Agent | Phase 04 đến hết Phase 05 |
| ER-07 | Như ER-02 | Web, API, Worker và Chromium | `pnpm dev` (web cổng 5173, API cổng 3000), Playwright với Chromium; `RESEND_API_KEY` trống nên email in ra console | Thật | Agent | Phase 04 đến hết Phase 05 |
| ER-08 | TC-244, TC-245 | `@axe-core/playwright` | Cài vào `apps/web` (PJ-05) | Thật | Agent | Phase 04 đến hết Phase 05 |
| ER-09 | TC-195 đến TC-198, TC-103 phần S | Google OAuth và Resend thật | OAuth client trong `.env` cho `http://localhost:5173`; `RESEND_API_KEY` và `EMAIL_FROM` (domain `resend.dev`) có giá trị | Thật | Product owner | Session thủ công ở Phase 05 |
| ER-10 | TC-003, TC-005 | Khởi động lại API | Tạo lại instance của Better Auth trên cùng database trong một test | Thật | Agent | Phase 04 đến hết Phase 05 |
| ER-11 | TC-140, TC-220, TC-226 | Cấu hình môi trường | Chạy với `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` trống; với `NODE_ENV=production` thiếu `RESEND_API_KEY` hoặc `EMAIL_FROM` | Thật | Agent | Phase 04 đến hết Phase 05 |
| ER-12 | TC-038, TC-123, TC-124, TC-142, TC-194 | Lỗi mạng và lỗi API cho web | Chặn request trong Playwright để trả 500 hoặc mất mạng, cho `get-session`, `sign-out` và các request của Auth | Mock. Mất: lỗi thật của proxy Vite và mạng | Agent | Phase 04 đến hết Phase 05 |
| ER-13 | TC-090 đến TC-098, TC-160 | Component test | Vitest cho schema trong `packages/shared` và hàm chọn đích trong `apps/web` | Thật | Agent | Phase 04 đến hết Phase 05 |

## 3. Tiêu chí đạt

| ID | Tiêu chí | Điều kiện đầu vào | Kết quả |
| --- | --- | --- | --- |
| Q5-01 | Mọi yêu cầu data và môi trường của test case trong file Test Cases có dòng tương ứng ở đây | — | Đạt |
| Q5-02 | Yêu cầu data mô tả đặc điểm cần có của dữ liệu, không chỉ tên file hoặc bảng | — | Đạt |
| Q5-03 | Mỗi yêu cầu có người chịu trách nhiệm, thời gian cần và yêu cầu reset | — | Đạt |
| Q5-04 | Thành phần được phép mock ghi rõ hành vi thật bị mất khi mock, và ràng buộc đã biết được phản ánh | IN-10 | Đạt: AS-06 (không gọi dịch vụ ngoài thật trong test tự động), PJ-03, PJ-05, PJ-09 có ở ER-02 đến ER-08 |
| Q5-05 | Không có secrets hoặc dữ liệu cá nhân thật trong file này | — | Đạt: password test là giá trị tự đặt; DR-12 không ghi tài khoản |

**Người review / ngày:** Product owner, 2026-11-17

## References

1. <a id="ref-1"></a>[Test Cases](04-test-cases.md) — 2026-11-17
2. <a id="ref-2"></a>[Test Approach](../../02-planning/output/03-test-approach.md) — commit `341584a`, 2026-11-17
