# Review Findings

Đọc file này để biết requirement Authentication đã được review thế nào, những anomaly, recommendation và câu hỏi đã tìm thấy, và quyết định xử lý cho từng finding.

## 1. Cách tổ chức review

| Trường | Nội dung |
| --- | --- |
| Mục đích | Đánh giá requirement Authentication có đủ để lập test plan và thiết kế test không |
| Tài liệu được review | Lần đầu: Authentication [[2]](#ref-2), Security [[3]](#ref-3), Architectural Decisions [[5]](#ref-5) tại `ac49066`; Workspace [[4]](#ref-4) tại `bd0ecff`; Test Strategy [[6]](#ref-6) tại `b995a8a`. Kiểm lại: commit `705a1ad` của Authentication, Security, Architectural Decisions và Test Strategy |
| Đặc tính được đánh giá | Completeness, correctness, consistency, testability, readability, traceability (CR-01 đến CR-06 trong [Requirement Readiness](01-requirement-readiness.md)) |
| Loại review | Informal |
| Kỹ thuật review | Checklist-based: tiêu chí CR-01 đến CR-06 và OWASP ASVS 5.0 ([Baseline Comparison](02-baseline-comparison.md)) |
| Vai trò | Author: product owner. Reviewer: agent. Không có moderator và scribe |
| Exit criteria của review | Mọi finding có quyết định; không còn finding mức Cao chưa xử lý |

Loại review chọn theo mục tiêu, mức độ quan trọng của tài liệu, yêu cầu pháp lý và nhu cầu lưu vết [[1, §3.2.4]](#ref-1). Trong inspection, author không đóng vai review leader hoặc scribe [[1, §3.2.4]](#ref-1).

## 2. Findings

Mức độ (đề xuất của agent; product owner duyệt ngày 2026-11-17): **Cao** là finding làm requirement chưa có expected result; **Trung bình** là finding làm một phần hành vi hoặc baseline item chưa có requirement; **Thấp** là finding chỉ ảnh hưởng một chi tiết.

| Finding ID | Requirement ID / version | Loại | Mô tả | Mức độ | Quyết định | Owner | Hành động | Kết quả |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| RF-01 | CM-01, CM-02, CM-03, SI-12, GO-07, SU-15, SU-16, SU-17, SEC-09; `ac49066` | Recommendation | Spec không có requirement ID. ID chỉ có trong tài liệu phân tích, nên khi spec thêm hành vi thì không có gì cho thấy cần thêm ID. Ví dụ: câu "Địa chỉ có `+tag` (ví dụ `an+test@example.com`) là một địa chỉ riêng" trong Quy tắc dùng chung không có ID trước đợt review này | Trung bình | Từ chối. Lý do: skill `stlc-requirement-analysis` bắt buộc liệt kê lại requirement từ version mới mỗi khi tài liệu nguồn đổi, nên không cần ID trong spec | Product owner | Liệt kê lại requirement từ commit `705a1ad` | Đã làm: thêm SS-08, GO-08, GO-09, GO-10; tổng 78 requirement |
| RF-02 | SU-06, SU-17; `ac49066` | Anomaly: mâu thuẫn | Create account và Verify email, bước 4: "Link hết hạn hoặc đã dùng thì Auth báo lỗi và cho gửi lại link." Câu tiếp theo: phần mềm quét đã mở link trước thì "email vẫn được xác minh nhưng người dùng phải tự Sign in". Khi người dùng mở link mà máy quét đã dùng, tài khoản đã được xác minh, nên gửi lại link xác minh không có tác dụng. Câu hỏi: người dùng thấy gì khi mở link xác minh đã dùng của một tài khoản đã xác minh? | Cao | Chấp nhận: spec theo hành vi của Better Auth 1.7.25. Link xác minh là JWT, không có trạng thái "đã dùng"; link còn hạn của email đã xác minh không báo lỗi, không tạo phiên | Product owner | Sửa bước 4 của Create account và Verify email | Authentication tại `705a1ad`. Kiểm lại: SU-06 và SU-17 Ready |
| RF-03 | SI-06; `ac49066` | Anomaly: mơ hồ | Sign in: "Các lần bấm sau vẫn hiện thông báo khóa cho tới hết thời gian khóa". Spec và Security không nêu thời gian khóa. Câu hỏi: khóa kéo dài bao lâu, và tính từ lần bấm nào? | Trung bình | Chấp nhận: ghi đúng cách Better Auth 1.7.25 đếm và mở khóa | Product owner | Sửa dòng khóa trong Sign in và mục Giới hạn số lần đăng nhập của Security | Authentication và Security tại `705a1ad`. Kiểm lại: SI-06 Ready |
| RF-04 | SEC-03; `ac49066` | Anomaly: không nhất quán | Security: "Email được gửi nền để thời gian phản hồi không khác nhau". ADR-002 ghi rủi ro chấp nhận: "Thời gian phản hồi có thể khác nhau giữa email đã và chưa đăng ký" (6.3.8). Câu hỏi: câu trong Security là biện pháp thiết kế hay kết quả phải kiểm? Nếu là kết quả thì ngưỡng là bao nhiêu? | Thấp | Chấp nhận: Security theo ADR-002; SEC-03 chỉ kiểm nội dung và status | Product owner | Sửa dòng Lộ email đã đăng ký của Security | Security tại `705a1ad`. Kiểm lại: SEC-03 Ready |
| RF-05 | A11Y-02; `b995a8a` | Anomaly: thiếu | Test Strategy: "Quét tự động trên các màn hình chính". Không nêu màn hình Auth nào được quét và mức vi phạm nào làm test không đạt | Thấp | Chấp nhận: quét 6 màn hình Auth (Sign in, Create account, Check your email, Forgot password, Choose a new password, trang link hết hạn), kể cả trạng thái lỗi; không đạt khi có vi phạm `serious` hoặc `critical` | Product owner | Ghi ngưỡng vào dòng Accessibility của Test Strategy | Test Strategy tại `705a1ad`. Kiểm lại: A11Y-02 Ready |
| RF-06 | CM-03; `ac49066` | Anomaly: mơ hồ | Quy tắc dùng chung: "hiện thông báo chung kèm gợi ý thử lại, ví dụ "We couldn’t sign you in right now. Check your connection and try again."" Chỉ có ví dụ cho Sign in. Câu hỏi: Create account, Reset password và Google dùng câu nào? Test kiểm nguyên văn hay chỉ kiểm có gợi ý thử lại? | Thấp | Chấp nhận: câu cụ thể không cố định; test kiểm có thông báo lỗi kèm gợi ý thử lại | Product owner | Ghi rõ trong Quy tắc dùng chung | Authentication tại `705a1ad`. Kiểm lại: CM-03 Ready |
| RF-07 | GO-02, GO-03; `ac49066` | Anomaly: thiếu | Các mục ASVS L2 liên quan tới đăng nhập bằng Google không được chọn và không có trong bảng rủi ro chấp nhận của ADR-002: 6.1.3, 6.3.4, 6.8.1, 6.8.2, 7.1.3, 7.6.1, 3.5.5. Ví dụ: Security ghi rate limit cho `/sign-in/email` và các endpoint gửi email, nhưng không nói gì về callback của Google (6.1.3, 6.3.4) | Trung bình | Chấp nhận: ghi hành vi hiện có của Better Auth vào Security; không kiểm chữ ký id_token là rủi ro chấp nhận | Product owner | Thêm dòng Google vào Security; thêm dòng 6.8.2 vào ADR-002 | Security và ADR-002 tại `705a1ad`. Kiểm lại: thêm GO-08, GO-09, GO-10, đều Ready |
| RF-08 | SU-05, SU-17; `ac49066` | Anomaly: thiếu | ADR-002 ghi rủi ro phần mềm quét mở link xác minh dưới mục 3.5.3. Mục 7.6.2 (L2: tạo phiên cần người dùng đồng ý hoặc có thao tác rõ ràng) cũng áp dụng cho hành vi này nhưng không được nhắc | Thấp | Chấp nhận | Product owner | Thêm 7.6.2 vào dòng rủi ro đó trong ADR-002 | ADR-002 tại `705a1ad` |
| RF-09 | Không có; Security `ac49066` | Anomaly: thiếu | ADR-002 chọn 7.1.2: "ghi rõ thời hạn phiên cùng số phiên đồng thời". Security không ghi số phiên đồng thời và hành vi khi đạt tối đa | Trung bình | Chấp nhận: không giới hạn số phiên đồng thời | Product owner | Thêm dòng Phiên đồng thời vào Security | Security tại `705a1ad`. Kiểm lại: thêm SS-08, Ready |
| RF-10 | RP-05; `ac49066` | Anomaly: thiếu | Reset password chỉ nêu trường hợp Confirm không khớp, không nêu trường hợp Confirm để trống. Code hiện báo "Fill in both fields." (`packages/shared/src/schemas/auth.schema.ts`). Câu hỏi: có chốt hành vi này làm requirement không? | Thấp | Chấp nhận: chốt "Fill in both fields." khi Confirm để trống | Product owner | Ghi vào bước 3 của Reset password | Authentication tại `705a1ad`. Kiểm lại: RP-05 Ready |
| RF-11 | Không có; ADR-002 `ac49066` | Anomaly: thiếu | Các mục L1 6.2.7, 6.3.2, 7.2.2, 7.2.3, 7.2.4, 3.4.2 chỉ được áp dụng qua câu "Nền là ASVS 5.0 L1" của ADR-002. Spec và Security không nêu hành vi quan sát được. Ví dụ 6.2.7: không tài liệu nào nói ô password cho dán và cho password manager điền | Thấp | Chấp nhận: dùng trực tiếp ASVS ID làm test basis cho 6 mục này | Product owner | Thêm 6 requirement dạng `ASVS-x.x.x` vào Requirement Readiness; ghi kết quả vào Baseline Comparison | Đã làm: 6 requirement Ready; 6 mục có kết quả Đủ |

Mỗi finding cần quyết định về trạng thái, người chịu trách nhiệm và hành động [[1, §3.2.2]](#ref-1). Question được ghi vào nơi quản lý câu hỏi mở; file này chỉ dẫn tới ID câu hỏi.

## 3. Kết quả review

**Exit criteria của review:** Đạt. RF-01 đến RF-11 có quyết định của product owner ngày 2026-11-17; không còn finding mức Cao chưa xử lý.

**Cần review lại:** Không. Các requirement bị ảnh hưởng đã được kiểm lại trên commit `705a1ad`.

## 4. Tiêu chí đạt

| ID | Tiêu chí | Điều kiện đầu vào | Kết quả |
| --- | --- | --- | --- |
| Q3-01 | Cách tổ chức review được ghi đủ các trường ở mục 1, kèm version của tài liệu; mục đích khớp với mục tiêu của đợt phân tích; loại review và reviewer khớp với nguồn lực đã xác định | IN-01, IN-10, RC-01 | Đạt |
| Q3-02 | Review dùng tiêu chí sẵn sàng đã thống nhất | RC-02 | Đạt: tiêu chí được duyệt sau lần review đầu; findings được đánh giá lại theo bộ tiêu chí đã duyệt |
| Q3-03 | Mỗi finding dẫn tới requirement có version, có loại và có ví dụ cụ thể | — | Đạt |
| Q3-04 | Mỗi finding có quyết định, owner và hành động; quyết định Từ chối có lý do | RC-04 | Đạt |
| Q3-05 | Question được ghi ở nơi quản lý câu hỏi mở và dẫn bằng ID; nội dung không bị chép vào file này | RC-05 | Đạt: chưa có finding nào được chuyển thành câu hỏi mở |
| Q3-06 | Finding đã sửa dẫn tới version mới của requirement và đã được kiểm tra lại trên version đó | — | Đạt: kiểm lại tại commit `705a1ad` |
| Q3-07 | Exit criteria của review có kết quả đánh giá | — | Đạt |

**Người review / ngày:** Product owner, 2026-11-17

## References

1. <a id="ref-1"></a>[ISTQB Certified Tester Foundation Level Syllabus v4.0.1](https://www.istqb.org/wp-content/uploads/2024/11/ISTQB_CTFL_Syllabus_v4.0.1.pdf) — v4.0.1, 2024-09-15
2. <a id="ref-2"></a>[Authentication](../../../../../design/prototype/docs/requirements/authentication.md) — commit `705a1ad`, 2026-11-17
3. <a id="ref-3"></a>[Security](../../../../../architecture/23-security.md) — commit `705a1ad`, 2026-11-17
4. <a id="ref-4"></a>[Workspace](../../../../../design/prototype/docs/requirements/workspace.md) — commit `bd0ecff`, 2026-11-16
5. <a id="ref-5"></a>[Architectural Decisions](../../../../../architecture/30-decisions.md) — commit `705a1ad`, 2026-11-17
6. <a id="ref-6"></a>[Test Strategy](../../../../../testing/test-strategy.md) — commit `705a1ad`, 2026-11-17
