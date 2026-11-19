# Test Approach

Đọc file này để biết mỗi rủi ro Authentication được giảm bằng test level và test type nào, dùng technique và coverage target nào theo mức rủi ro, phần nào được automation, và các số liệu cần thu thập.

## 1. Test type và test level

### 1.1. Test type đã xem xét

Mỗi dòng là một đặc tính chất lượng theo ISO/IEC 25010 [[1, §2.2.2]](#ref-1). Mọi dòng đều có quyết định, kể cả khi quyết định là Out.

| Đặc tính chất lượng | Có rủi ro trong phạm vi | Quyết định | Lý do / Risk IDs |
| --- | --- | --- | --- |
| Functional suitability | Có | In | PR-03, PR-06, PR-07, PR-08, PR-10, PR-11, PR-12 |
| Performance efficiency | Không | Out | Test basis không có requirement về thời gian phản hồi hay tải cho Auth. Thời gian phản hồi giữa email đã và chưa đăng ký là rủi ro chấp nhận (PR-19) |
| Compatibility | Chưa xác định | Out | Test basis không nêu trình duyệt được hỗ trợ; rủi ro ghi ở PR-21 |
| Usability (interaction capability) | Có | In | PR-13: accessibility theo A11Y-01, A11Y-02, CA-11 |
| Reliability | Có | In | PR-12, PR-14: xử lý lỗi mạng, lỗi API, lỗi gửi email |
| Security | Có | In | PR-01 đến PR-09, PR-15 |
| Maintainability | Không | Out | Test basis không có requirement về maintainability của Auth |
| Portability (flexibility) | Không | Out | Test basis không có requirement về môi trường cài đặt |
| Safety | Không | Out | Sản phẩm không giữ tiền và không đặt lệnh [[3, ADR-002]](#ref-3) |

Đặc tính có rủi ro nhưng quyết định Out được ghi vào [Risk Register](02-risk-register.md) với cách xử lý khác testing.

### 1.2. Ma trận test level × test type

| Test level | Functional | Security | Usability | Reliability | White-box |
| --- | --- | --- | --- | --- | --- |
| Component | In; PR-09, PR-10, PR-11; Vitest | In; PR-04 (RD-06), PR-09; Vitest | Out | Out | Out |
| Component integration | In; PR-03, PR-06, PR-07, PR-08; Vitest + PostgreSQL | In; PR-01 đến PR-09, PR-15; Vitest + PostgreSQL | Out | In; PR-02 (SEC-09), PR-14; Vitest | Out |
| System | In; PR-07 (SS-06), PR-10, PR-11, PR-12; Playwright | In; PR-03, PR-04, PR-05 (SEC-08); Playwright | In; PR-13; Playwright + `@axe-core/playwright` | In; PR-12 (CM-03, SS-07); Playwright | Out |
| System integration | In; PR-08 (GO-01, GO-05, GO-06) với Google thật; thủ công | Out | Out | In; PR-14 với Resend thật; thủ công | Out |
| Acceptance | Out | Out | Out | Out | Out |

Test level theo Test Strategy [[2, Test levels]](#ref-2): Component tương ứng Unit, Component integration tương ứng Integration, System tương ứng System / E2E.

Acceptance là Out (đề xuất của người lập plan; product owner duyệt ngày 2026-11-17): không có UAT riêng; product owner quyết định dựa trên Test Summary Report ở Phase 06. White-box là Out (đề xuất của người lập plan; product owner duyệt ngày 2026-11-17): phần lớn hành vi Auth do cấu hình Better Auth tạo ra, nên coverage theo requirement và theo mục ASVS đo được rủi ro trực tiếp hơn code coverage; repo cũng chưa có công cụ đo coverage (PJ-05).

**Ranh giới giữa các test level:**

- Component: hàm thuần, không I/O. Schema Zod trong `packages/shared/src/schemas/auth.schema.ts` (CM-01, CM-02, CA-13, RP-05) và logic chọn đích chuyển tiếp trong `apps/web` (RD-06).
- Component integration: gọi `auth.handler` của Better Auth trực tiếp với PostgreSQL thật, như `apps/api/test/auth.test.ts`. Không đi qua Express, nên middleware của Express (header bảo mật của SEC-08) không có ở level này.
- System: trình duyệt Chromium qua `pnpm dev` (Web, API, Worker, PostgreSQL). SEC-08 được kiểm ở level này, trên response thật của API.
- System integration: với Google OAuth thật và Resend thật, theo `.env` local. Email chỉ gửi tới hộp thư của chủ tài khoản Resend, vì `EMAIL_FROM` dùng domain `resend.dev`. Việc gửi email ở production thuộc deploy.

Thành phần được mock và hành vi thật bị mất:

| Thành phần | Thay bằng | Hành vi thật bị mất | Bù bằng |
| --- | --- | --- | --- |
| Gửi email (Resend) | Component integration: mailer ghi vào bộ nhớ, như `apps/api/test/auth.test.ts`. System: `RESEND_API_KEY` để trống, mailer in email ra console | Render email trong mail client, độ trễ và lỗi của Resend | SEC-09 kiểm bằng mailer giả trả lỗi; bước thủ công với Resend thật (System integration) |
| Google OAuth | OAuth provider giả trả profile và `sub` theo test | Màn chọn tài khoản, id_token thật, đóng cửa sổ Google | Session thủ công với Google thật (System integration) |
| API Pwned Passwords | Stub trả kết quả lộ / không lộ | Định dạng response thật và trường hợp API không truy cập được | Một test kiểm hành vi khi stub trả lỗi |
| Đồng hồ | Điều khiển thời gian trong test hoặc sửa thời điểm hết hạn trong database | Không mất hành vi; chỉ không chờ thời gian thật | — |

**Confirmation testing và regression testing:** Sau mỗi bản sửa defect, chạy lại test đã fail, rồi chạy `pnpm test` và `pnpm test:e2e` đầy đủ. Khi version `better-auth` thay đổi, chạy toàn bộ regression và session Google thủ công (SR-05). Mọi test của Component, Component integration và System là test tự động, nên cả bộ là regression suite; chỉ session Google và Resend thật và exploratory session là thủ công.

## 2. Technique và coverage theo mức rủi ro

| Mức rủi ro | Test type | Technique | Coverage criterion | Coverage target | Nguồn của giá trị |
| --- | --- | --- | --- | --- | --- |
| Cao | Functional, Security | State Transition: trạng thái khóa Sign in (PR-01), vòng đời phiên (PR-03), link reset (PR-06), link xác minh (PR-07) | All transitions: mọi chuyển trạng thái hợp lệ và không hợp lệ | 100% | Người lập plan đề xuất: mặc định cho rủi ro Cao của skill `stlc-test-planning`; mỗi model có ít trạng thái, nên 100% làm được |
| Cao | Functional, Security | Boundary Value Analysis cho các giới hạn số: số lần bấm và cửa sổ 10 giây (SI-06), 3 lần/60 giây (SEC-07), password 8 và 128 ký tự, Full name 100 ký tự, link 1 giờ, phiên 7 và 30 ngày | 3-value BVA | 100% giá trị biên | Người lập plan đề xuất: mặc định cho rủi ro Cao; mọi giới hạn trong dòng này đã có giá trị trong requirement |
| Cao | Functional, Security | Decision Table: Continue with Google theo email đã có / chưa có, đã xác minh / chưa, đã liên kết Google / chưa (GO-02, GO-03, GO-07, GO-09); kiểm password theo độ dài, danh sách phổ biến, Pwned Passwords (CA-14) | All feasible columns | 100% | Người lập plan đề xuất: mặc định cho rủi ro Cao |
| Cao | Security | Checklist OWASP ASVS 5.0 theo mục 3 | Mỗi mục áp dụng có ít nhất một test case, hoặc là rủi ro chấp nhận của ADR-002 | 100% mục áp dụng | ADR-002 [[3]](#ref-3); danh sách mục từ Baseline Comparison [[4]](#ref-4) |
| Cao | Security | Threat model STRIDE trên 4 data flow: Sign in, callback Google, Reset password, link xác minh | Mỗi threat có test case hoặc là rủi ro chấp nhận | 100% threat | Người lập plan đề xuất: skill `test-technique-security-threat-model`; bổ sung threat mà checklist không nêu |
| Cao | Functional, Security | Exploratory testing | Charter time-box 60 phút, một charter cho mỗi nhóm: giới hạn và phiên (PR-01, PR-03); Google (PR-08); link email (PR-06, PR-07); origin và chuyển tiếp (PR-04, PR-05) | 4 session, mỗi session có debrief | Người lập plan đề xuất: một session cho mỗi nhóm rủi ro Cao có chung data flow |
| Trung bình | Functional, Reliability | Scenario testing cho Sign in, Create account và Verify email, Reset password, Sign out (PR-10, PR-11, PR-12, PR-14) | Mỗi luồng chính, luồng thay thế và luồng ngoại lệ | 100% luồng | Người lập plan đề xuất: mặc định cho rủi ro Trung bình |
| Trung bình | Functional, Security | Equivalence Partitioning và 2-value BVA cho trường form (PR-10) và email đã / chưa đăng ký / chưa xác minh (PR-02); State Transition cho màn chặn (PR-12) | Mỗi partition; 2-value BVA; valid transitions | 100% | Người lập plan đề xuất: mặc định cho rủi ro Trung bình |
| Trung bình | Security | Checklist ASVS cho PR-15 | Mỗi mục ASVS-6.3.2, ASVS-7.2.2, ASVS-7.2.3 có một test case | 100% | ADR-002 [[3]](#ref-3) |
| Trung bình | Usability | Quét tự động bằng axe; checklist A11Y-01; điều hướng bàn phím (CA-11, PR-13) | 6 màn hình Auth, kể cả trạng thái lỗi | 6/6 màn hình; 0 vi phạm `serious` hoặc `critical` | Test Strategy [[2, Test types theo rủi ro]](#ref-2); product owner duyệt ở RF-05 ngày 2026-11-17 |

Không có rủi ro mức Thấp trong phạm vi được giảm bằng testing.

Mỗi giá trị target ghi nguồn. Giá trị do người lập plan đề xuất được duyệt riêng từng giá trị, kèm lý do chọn. Product owner duyệt mọi giá trị "Người lập plan đề xuất" trong bảng trên ngày 2026-11-17.

## 3. Chuẩn bắt buộc

| Chuẩn | Version | Mức áp dụng | Phần áp dụng | Risk IDs |
| --- | --- | --- | --- | --- |
| OWASP ASVS | 5.0 | L1, cộng các mục L2 đã chọn trong ADR-002 (7.1.1, 7.1.2, 7.3.2, 6.2.12, 3.4.4–3.4.6, 7.4.4) | V6 Authentication [[5]](#ref-5); V7 Session Management [[6]](#ref-6); 3.3, 3.4, 3.5, 3.7 của V3 Web Frontend Security [[7]](#ref-7) | PR-01 đến PR-09, PR-15 |

## 4. Automation và phân bổ test

| Test level | Automated / Manual | Công cụ | Chạy ở đâu | Khi nào chạy |
| --- | --- | --- | --- | --- |
| Component | Automated | Vitest | Local; CI sau khi xử lý PJ-02 | Mỗi commit chạm `packages/shared` hoặc `apps/web/app` liên quan Auth |
| Component integration | Automated | Vitest, PostgreSQL qua Docker Compose (`pnpm test`) | Local; CI sau khi xử lý PJ-02 | Mỗi commit chạm `apps/api` hoặc `packages/shared` |
| System | Automated | Playwright (Chromium), `@axe-core/playwright` (`pnpm test:e2e`) | Local | Trước khi merge vào `main` |
| System integration | Manual | Trình duyệt, Google OAuth thật, Resend thật | Local | Một lần mỗi đợt kiểm thử; khi đổi cấu hình OAuth, cấu hình email hoặc version `better-auth` |
| Exploratory | Manual | Trình duyệt, DevTools | Local | Phase 05, sau vòng test tự động đầu tiên |

**Phân bổ theo test pyramid:** Phần lớn test nằm ở Component integration, ít test ở Component, số test System vừa phải. Phân bổ này lệch khỏi dạng kim tự tháp vì phần lớn hành vi Auth là cấu hình của Better Auth: không tách được thành hàm thuần để test ở Component, nhưng kiểm được nhanh qua `auth.handler` với PostgreSQL thật. Test System chỉ dành cho hành vi chỉ có trong trình duyệt: UI, chuyển tiếp, cookie trong trình duyệt, header qua API thật, accessibility.

## 5. Độc lập trong testing

| Hoạt động | Ai thực hiện | Mức độc lập |
| --- | --- | --- |
| Thiết kế test condition và test case | Agent | Tác giả tự test |
| Review test condition và test case | Product owner | Người khác trong nhóm |
| Viết và chạy test tự động | Agent | Tác giả tự test |
| Session Google và Resend thật | Product owner | Người khác trong nhóm |
| Exploratory session | Agent | Tác giả tự test |
| Quyết định exit criteria và rủi ro còn lại | Product owner | Người khác trong nhóm |

## 6. Yêu cầu test data và môi trường

| Yêu cầu | Test level | Thật / được phép mock | Ràng buộc |
| --- | --- | --- | --- |
| PostgreSQL | Component integration, System | Thật | Integration dùng `<POSTGRES_DB>_test`, tạo lại mỗi lần chạy. E2E cần database riêng, không dùng database dev (PJ-03) |
| Địa chỉ IP của client | Component integration, System | Đặt qua `x-forwarded-for` | Mỗi test giới hạn Sign in dùng IP riêng, không xóa cả bảng `rate_limit` |
| Dịch vụ email | Component integration, System: mock. System integration: Resend thật | Xem mục 1.2 | Test tự động không gửi email thật (PJ-09). Bước thủ công chỉ gửi tới hộp thư của chủ tài khoản Resend |
| Google OAuth | Component integration: mock. System integration: thật | Xem mục 1.2 | Dùng OAuth client trong `.env` cho `http://localhost:5173` và một tài khoản Google để test (PJ-04) |
| API Pwned Passwords | Component integration | Mock | Không gửi tiền tố hash của password test ra ngoài trong test tự động |
| Thời gian | Component integration, System | Điều khiển trong test | Áp dụng cho cửa sổ 10 giây, 60 giây, link 1 giờ, phiên 7 và 30 ngày |
| Tài khoản test | Mọi level | Tạo trong test, email duy nhất | Không dùng tài khoản thật |

Chi tiết từng yêu cầu được xác định ở bước thiết kế test.

## 7. Metrics

| Metric | Loại | Định nghĩa: tử số / mẫu số | Nguồn dữ liệu | Tần suất |
| --- | --- | --- | --- | --- |
| Requirement coverage | Coverage | Requirement Ready có ít nhất một test case đã chạy / 81 | Bảng truy vết của Phase 03, test log của Phase 05 | Mỗi lần cập nhật execution status |
| Risk coverage | Rủi ro | Rủi ro có mọi test case đã lên kế hoạch đã chạy / số rủi ro giảm bằng testing (15), tách theo mức Cao và Trung bình | Risk Register, test log | Mỗi lần cập nhật execution status |
| ASVS coverage | Coverage | Mục ASVS áp dụng có test case đã chạy hoặc là rủi ro chấp nhận / số mục ASVS áp dụng | Baseline Comparison, test log | Cuối Phase 05 |
| Tiến độ chạy test | Tiến độ | Test case đã chạy / test case đã lên kế hoạch | Test log | Mỗi lần chạy |
| Tỷ lệ pass | Chất lượng sản phẩm | Test case pass / test case đã chạy | Output của Vitest và Playwright | Mỗi lần chạy |
| Defect đang mở theo severity | Defect | Số defect chưa đóng, tách theo severity | Defect Reports của Phase 05 | Mỗi lần cập nhật execution status |
| Khác biệt đã biết đã đóng | Defect | Khác biệt ở Requirement Readiness mục 4 đã sửa và confirmation test pass / 9 | Defect Reports, test log | Mỗi vòng confirmation |
| Effort thực tế | Chi phí | Giờ thực tế / giờ estimate, theo hoạt động | Estimates & Schedule, ghi chép từng phase | Cuối mỗi phase |

## 8. Deliverables

| Deliverable | Phase tạo ra | Nơi lưu |
| --- | --- | --- |
| Test condition, test model, test case, exploratory charter | 03 | `03-design/` |
| Test procedure, test suite, test data, môi trường test | 04 | `04-implementation/` |
| Code test | 04 | `apps/api/test/`, `apps/web/e2e/`, test của `packages/shared` |
| Execution status, test log, defect report, tool report | 05 | `05-execution/` |
| Test Summary Report, rủi ro còn lại, lessons learned | 06 | `06-report/` |

## 9. Khác biệt so với test policy và test strategy

| Nội dung trong policy hoặc strategy | Khác biệt trong plan này | Lý do | Người duyệt |
| --- | --- | --- | --- |
| [[2, Rủi ro chất lượng]](#ref-2) R-13 ưu tiên Medium | 8 rủi ro sản phẩm của Auth có mức Cao | Test Strategy đánh giá ở mức cả hệ thống. Plan này đánh giá từng rủi ro theo thang ở Risk Register, và 8 rủi ro có khác biệt đã biết hoặc ảnh hưởng chiếm tài khoản | Product owner, 2026-11-17 |
| [[2, Tiêu chí vào và ra]](#ref-2) tiêu chí ở trạng thái Proposed | Plan đặt entry và exit criteria riêng cho TS-001 | Test Strategy chưa chốt tiêu chí | Product owner, 2026-11-17 |
| [[2, Công cụ]](#ref-2) `Testcontainers` cho integration test | Không dùng; giữ PostgreSQL qua Docker Compose | Integration test hiện có đã dùng database `_test` tạo lại mỗi lần chạy; Testcontainers vẫn là Proposed | Product owner, 2026-11-17 |
| [[2, Công cụ]](#ref-2) `OWASP ZAP`, `pnpm audit` cho R-13 | Không dùng trong đợt này | SEC-08 và SEC-01 được kiểm trực tiếp bằng test tự động; quét ZAP có giá trị hơn trên môi trường deploy; quét dependency không gắn với requirement nào của TS-001 | Product owner, 2026-11-17 |

## 10. Tiêu chí đạt

| ID | Tiêu chí | Điều kiện đầu vào | Kết quả |
| --- | --- | --- | --- |
| Q3-01 | Mỗi rủi ro sản phẩm có xử lý "Giảm bằng testing" xuất hiện ở ít nhất một ô của ma trận; mỗi ô "In" có Risk IDs | — | Đạt: PR-01 đến PR-15 |
| Q3-02 | Ranh giới test level khớp với kiến trúc; thành phần được mock ghi rõ hành vi thật bị mất | RC-05 | Đạt |
| Q3-03 | Mỗi coverage target có nguồn; giá trị do người lập plan đề xuất được ghi lý do và đã được duyệt riêng | RC-02 | Đạt |
| Q3-04 | Chuẩn bắt buộc có version, mức áp dụng và phần áp dụng lấy từ bản gốc | RC-04 | Đạt |
| Q3-05 | Lựa chọn automation ghi công cụ, nơi chạy và thời điểm chạy, dựa trên hạ tầng hiện có | IN-09 | Đạt: công cụ chưa có được ghi ở PJ-05; CI chưa chạy test được ghi ở PJ-02 |
| Q3-06 | Mỗi metric có tử số, mẫu số và nguồn dữ liệu | — | Đạt |
| Q3-07 | Khác biệt so với test policy hoặc test strategy có lý do và người duyệt | IN-03 | Đạt |
| Q3-08 | Mọi đặc tính chất lượng ở mục 1.1 có quyết định và lý do; đặc tính có rủi ro nhưng quyết định Out có mặt trong Risk Register | IN-08 | Đạt: Compatibility ở PR-21 |

**Người review / ngày:** Product owner, 2026-11-17

## References

1. <a id="ref-1"></a>[ISTQB Certified Tester Foundation Level Syllabus v4.0.1](https://www.istqb.org/wp-content/uploads/2024/11/ISTQB_CTFL_Syllabus_v4.0.1.pdf) — v4.0.1, 2024-09-15
2. <a id="ref-2"></a>[Test Strategy](../../../../test-strategy.md) — commit `705a1ad`, 2026-11-17
3. <a id="ref-3"></a>[Architectural Decisions](../../../../../architecture/30-decisions.md) — commit `705a1ad`, 2026-11-17
4. <a id="ref-4"></a>[Baseline Comparison](../../01-requirement-analysis/output/02-baseline-comparison.md) — commit `da6b261`, 2026-11-17
5. <a id="ref-5"></a>OWASP ASVS 5.0, V6 Authentication. <https://raw.githubusercontent.com/OWASP/ASVS/master/5.0/en/0x15-V6-Authentication.md> — truy cập 2026-11-17
6. <a id="ref-6"></a>OWASP ASVS 5.0, V7 Session Management. <https://raw.githubusercontent.com/OWASP/ASVS/master/5.0/en/0x16-V7-Session-Management.md> — truy cập 2026-11-17
7. <a id="ref-7"></a>OWASP ASVS 5.0, V3 Web Frontend Security. <https://raw.githubusercontent.com/OWASP/ASVS/master/5.0/en/0x12-V3-Web-Frontend-Security.md> — truy cập 2026-11-17
