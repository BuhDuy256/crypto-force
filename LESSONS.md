# Lessons Learned

Đọc file này để biết những lỗi đã gặp trong project Crypto Force và quy tắc cụ thể để tránh lặp lại các lỗi đó.

File này là nguồn dữ liệu chính (single source of truth) cho Lesson Learned. Chỉ thêm hoặc sửa bài học khi người dùng đã chấp thuận, thông qua Skill `correct` (`.agents/skills/correct/SKILL.md`). Chỉ ghi bài học cho lỗi trong quá trình làm việc mà nhìn file kết quả không thấy được, và không chặn được bằng kiến trúc, type, lint hoặc test. Quy tắc kiểm được trên file kết quả thuộc [Conventions](docs/conventions/README.md).

## Quy ước

- **ID** có dạng `LL-XXX`, tăng dần, không đổi và không tái sử dụng, kể cả khi bài học bị loại bỏ.
- Bài học không có dòng `Status` là còn hiệu lực. Khi bài học không còn áp dụng, thêm dòng `- **Status:** Deprecated — <lý do>`, không xóa khỏi file.
- **Scope** dùng một trong các giá trị: `Documentation`, `Code`, `Testing`, `General`.

Mỗi bài học theo mẫu:

```markdown
### LL-XXX: <Title>

- **Scope:** <Documentation | Code | Testing | General>
- **Status:** Deprecated — <lý do> (tùy chọn, chỉ thêm khi bài học không còn áp dụng)
- **Problem:** <Lỗi đã gặp và vì sao lỗi đó gây ra vấn đề>
- **Rule:** <Quy tắc cụ thể, có thể kiểm tra được>
- **Examples:** (khi phù hợp)
  - Before: ...
  - After: ...
```

## Lessons

### LL-001: Ambiguous References

- **Scope:** Documentation
- **Status:** Deprecated — quy tắc là convention của file tài liệu, nay nằm trong [Nhắc tới đối tượng](docs/conventions/docs.md#nhắc-tới-đối-tượng); `review-change` kiểm.
- **Problem:** Tài liệu dùng các cụm như "đề xuất của nhóm", "cách tiếp cận này", "cơ chế trên", "phương án đã chọn" hoặc "hệ thống xử lý phù hợp" mà không xác định chúng chỉ đến điều gì. Người đọc phải tự đoán đối tượng, dễ hiểu sai quyết định hoặc hành vi đang được mô tả, và không thể kiểm tra nội dung.
- **Rule:** Mọi câu phải xác định rõ đối tượng, hành động hoặc quyết định được đề cập. Khi nhắc đến một quyết định, giải pháp hoặc hành vi, nêu nội dung cụ thể hoặc tham chiếu đến nơi đã định nghĩa. Áp dụng cho toàn bộ tài liệu, kể cả heading, bảng, bullet và chú thích hình. Được phép dùng cụm như "cơ chế này" hoặc "phương án trên" khi đối tượng đã được xác định rõ trong ngữ cảnh gần nhất; chỉ viết lại khi người đọc phải suy đoán.
- **Examples:** (chỉ minh họa cách viết, không phải quyết định kiến trúc của Crypto Force)
  - Tham chiếu đến phương án chưa xác định
    - Before: "Hệ thống sử dụng phương án được nhóm đề xuất."
    - After: "Hệ thống sử dụng Weighted Voting để kết hợp tín hiệu từ các Strategy."
  - Mô tả hành vi thiếu cụ thể
    - Before: "Khi xảy ra lỗi, hệ thống sẽ xử lý phù hợp."
    - After: "Khi kết nối Binance bị gián đoạn, hệ thống đánh dấu kết nối là `DISCONNECTED` và thử kết nối lại theo chính sách retry đã cấu hình."
  - Không xác định được cơ chế
    - Before: "Cơ chế này giúp cải thiện hiệu năng."
    - After: "Việc chạy nhiều Backtest Worker cho phép xử lý đồng thời các Backtest Job, thay vì thực hiện tuần tự."

### LL-002: Process Notes in Document Content

- **Scope:** Documentation
- **Status:** Deprecated — quy tắc là convention của file tài liệu, nay nằm trong [Chỉ ghi nội dung của chủ đề](docs/conventions/docs.md#chỉ-ghi-nội-dung-của-chủ-đề).
- **Problem:** Agent chèn vào tài liệu các ghi chú về quá trình chỉnh sửa, chẳng hạn nội dung được chuyển từ đâu, vì sao được sắp xếp lại, hoặc trạng thái "chưa chuẩn hoá". Những ghi chú này giống log thay đổi, không giúp người đọc hiểu chủ đề của tài liệu, và sẽ lỗi thời ngay sau khi task kết thúc.
- **Rule:** Tài liệu chỉ chứa nội dung về chủ đề của nó. Không ghi vào file nguồn gốc, lịch sử chỉnh sửa, lý do sắp xếp hoặc trạng thái hoàn thiện của nội dung. Những thông tin này chỉ báo cáo trong câu trả lời gửi người dùng. Không thêm câu dẫn hoặc disclaimer mà người dùng không yêu cầu, trừ khi câu đó cung cấp thông tin người đọc cần để hiểu đúng nội dung.
- **Examples:**
  - Ghi chú nguồn gốc nội dung
    - Before: "> **Ghi chú tạm:** Các mục dưới đây được chuyển từ `system-description.md`… Nội dung chưa được chuẩn hoá thành từng requirement có ID."
    - After: Không có ghi chú. Thông tin này được báo cáo trong câu trả lời gửi người dùng.
  - Câu dẫn không mang giá trị
    - Before: "Tình huống và số liệu trong file chỉ để minh họa… Yêu cầu chi tiết nằm ở [Functional Requirements](functional-requirements.md)."
    - After: Không có câu này; nội dung chính bắt đầu ngay sau dòng mô tả mục đích file.

### LL-003: Requirement Completeness Without an Independent Baseline

- **Scope:** Testing
- **Problem:** Khi đánh giá một bộ requirement đã đủ để thiết kế test hay chưa, agent chỉ so các tài liệu và sản phẩm có cùng nguồn gốc với nhau, ví dụ spec viết lại từ prototype, chính prototype đó, code và test viết theo spec. So như vậy chỉ thấy chỗ chúng lệch nhau, không thấy những tình huống mà tất cả cùng bỏ sót. Kết quả là requirement được coi là đầy đủ trong khi còn thiếu luồng thay thế, luồng ngoại lệ và yêu cầu bảo mật. Agent cũng trích ID và mức của chuẩn từ bản tóm tắt, nên gán sai mức cho yêu cầu.
- **Rule:** Trước khi kết luận một bộ requirement đã đủ để thiết kế test, đối chiếu nó với ít nhất một baseline độc lập với nguồn đã sinh ra nó: chuẩn ngành của domain (ví dụ OWASP ASVS cho authentication và session, WCAG cho accessibility), hoặc use case do tác giả chưa đọc spec viết. Ghi trong tài liệu phân tích: baseline đã dùng, mức áp dụng và danh sách gap tìm được. ID và mức của yêu cầu trong chuẩn phải lấy từ bản gốc, không lấy từ bản tóm tắt.
- **Examples:**
  - Before: "Đối chiếu spec Authentication với prototype và code: 43/49 requirement đã đủ để viết test."
  - After: "Baseline độc lập: OWASP ASVS 5.0 L1 (V6, V7, V3.3–3.7) và bộ use case viết độc lập. Kết quả: 14 nhóm gap, một trong số đó là lỗi đang có trong code. Requirement chỉ được coi là đủ sau khi đã chốt các gap."

### LL-004: Unsourced Agent-Proposed Values

- **Scope:** General
- **Problem:** Agent đề xuất giá trị cụ thể (ngưỡng rate limit, thời hạn, giới hạn độ dài) mà không ghi nguồn hay lý do, rồi gộp chung với nhiều quyết định khác để người dùng duyệt một lần. Giá trị đó được ghi vào spec như đã chốt dù không có requirement nào sinh ra nó. Khi thay giá trị cũ, agent còn âm thầm đổi ý nghĩa của hành vi gốc, ví dụ từ đếm lần nhập sai sang đếm mọi lần bấm. Người dùng không có căn cứ để đánh giá con số, nên quyết định phải mở lại sau khi đã implement.
- **Rule:** Mỗi giá trị cụ thể do agent đề xuất phải ghi kèm ba thông tin: nguồn (requirement, prototype, chuẩn ngành kèm số mục, mặc định của thư viện, hoặc "agent đề xuất"), lý do chọn giá trị đó, và hành vi thay đổi thế nào so với nguồn hiện có. Khi trình nhiều quyết định cùng lúc, tách riêng các giá trị do agent đề xuất để người dùng duyệt từng giá trị.
- **Examples:**
  - Before: "D3: Giới hạn Sign in 5 lần trong 15 phút theo IP (Recommended)."
  - After: "Giới hạn Sign in. Prototype: khóa sau 3 lần sai. Mặc định của Better Auth: 3 request/10 giây/IP. Agent đề xuất: 5 request/15 phút/IP, đếm mọi lần bấm, tức là khác prototype ở cách đếm. Lý do: …"

### LL-005: Undeclared Requirement ID Prefixes

- **Scope:** Testing
- **Status:** Deprecated — quy tắc là convention của file tài liệu, nay nằm trong [ID](docs/conventions/docs.md#id); `pnpm check:stlc` kiểm tiền tố trong test scope; `pnpm check:docs` kiểm tiền tố chưa khai báo và ID lặp trong `docs/UCs/`.
- **Problem:** Agent đặt requirement ID theo nhóm chức năng (`SI`, `GO`, `SU`) nhưng không ghi tiền tố nghĩa là gì và lấy từ section nào của nguồn, nên người đọc thấy ID như đánh ngẫu nhiên. Tiền tố còn trùng với ID mà template STLC dùng cho đối tượng khác: requirement `SU` (Sign up) trùng `SU-01` (test suite), requirement `RD` (Redirect) trùng `RD-01` (tiêu chí sẵn sàng). Khi đó cùng một ID chỉ hai thứ khác nhau trong một test scope. `pnpm check:docs` chặn tiền tố chưa khai báo, tiền tố trùng template và ID trùng; quy tắc dưới đây là phần check không kiểm được.
- **Rule:** Mỗi tiền tố ứng với đúng một nhóm requirement trong một section của tài liệu nguồn, và cột Nguồn của bảng tiền tố dẫn tới section đó. Không đánh lại số của ID đã cấp; requirement mới nhận số kế tiếp trong nhóm, kể cả khi thứ tự số không còn theo thứ tự của luồng. Chỉ được đổi tiền tố khi chưa có test case, defect hay tài liệu ngoài Phase 01 nào trỏ tới ID đó.
- **Examples:**
  - Before: `| SU-17: phiên chỉ được tạo ở lần mở link đầu tiên; … |`, không có bảng tiền tố.
  - After: bảng tiền tố có dòng `` | `CA` | Create account và Verify email | [[1, Create account và Verify email]](#ref-1) | `` và requirement là `| CA-17: … |`.

### LL-006: Unverified Claims About Environment State

- **Scope:** General
- **Problem:** Agent ghi vào test plan rằng Google OAuth client cho localhost "chưa được xác nhận", rằng dev in email ra console nên test không gọi Resend, và rằng `better-auth` `^1.7.25` có thể tự lên version mới khi cài lại. Cả ba đều sai: `.env` đã có `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` và `RESEND_API_KEY`; `apps/api/src/services/mailer.ts` gửi qua Resend khi có key; `pnpm-lock.yaml` khóa version. Agent lấy trạng thái hiện tại từ tài liệu mô tả hành vi mong muốn và từ khai báo trong `package.json`, không từ nơi quyết định trạng thái. Phạm vi, rủi ro và estimate của plan sai, và plan phải sửa sau khi đã được duyệt.
- **Rule:** Trước khi ghi một khẳng định về trạng thái môi trường (dịch vụ ngoài đã cấu hình chưa, công cụ đã cài chưa, version đang dùng, hành vi khi chạy local), kiểm tra nơi quyết định trạng thái đó và ghi nơi đó làm nguồn: `.env` (chỉ xem biến có giá trị hay không, không in giá trị), code đọc biến đó, `pnpm-lock.yaml`, file cấu hình CI. Tài liệu requirement và architecture mô tả hành vi mong muốn, không phải nguồn của trạng thái hiện tại. Khi không kiểm tra được, ghi "Chưa kiểm tra" kèm lý do, không ghi "chưa có" hay "chưa xác nhận".
- **Examples:**
  - Before: "Việc có Google OAuth client cho localhost chưa được xác nhận."
  - After: "`.env` có `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `BETTER_AUTH_URL=http://localhost:5173`; chưa chạy thử luồng Google (EN-07)."
  - Before: "`better-auth` khai báo `^1.7.25`, nên khi cài lại có thể lên version mới."
  - After: "`pnpm-lock.yaml` khóa `better-auth@1.7.25`; CI cài bằng `--frozen-lockfile`."

### LL-007: Result Reports That Claim More Than the Evidence

- **Scope:** Testing
- **Problem:** Execution Status của TS-001 ghi 299 Passed và 368 instance, nhưng số này gồm 2 smoke test và 15 test workspace không thuộc TS-001. TC-200 ghi Passed trong khi ASVS 6.4.2 chỉ được đọc từ source, không mở giao diện. Khi thêm bullet mới vào CHANGELOG, bullet cũ vẫn nói "Chưa có Execution Readiness, Execution Status và Defect Reports". Hai reviewer độc lập bắt cả ba lỗi, agent tác giả không thấy.
- **Rule:** (1) Trước khi ghi một tổng số, liệt kê tên test thuộc phạm vi và loại test ngoài phạm vi; ghi công thức kèm số loại trừ. (2) Chỉ ghi `Passed` cho một test case khi evidence chứng minh từng điều trong expected result. Phần chỉ đọc source hoặc tìm từ khóa thì ghi `Inconclusive`, hoặc ghi rõ phần chưa kiểm. (3) Sau khi thêm một kết quả mới, tìm trong tài liệu các câu cũ mà kết quả đó làm sai và sửa chúng trong cùng thay đổi.
- **Examples:**
  - Before: "299 Passed (152 + 141 + 6)".
  - After: "276 test tự động của TS-001 (152 + 141 − 2 smoke − 15 workspace) và 6 test case thủ công".
  - Before: "TC-200 Passed" khi 6.4.2 chỉ đọc `SignUpPage.tsx`.
  - After: "TC-200 Inconclusive: 6.4.2 chỉ đọc source" cho tới khi mở giao diện thật.
