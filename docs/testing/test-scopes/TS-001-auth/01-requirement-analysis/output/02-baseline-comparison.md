# Baseline Comparison

Đọc file này để biết bộ requirement Authentication đã được đối chiếu với baseline độc lập nào, mỗi mục của baseline đã có requirement tương ứng hay chưa, và còn thiếu gì.

## 1. Baseline

| Baseline | Version | Mức áp dụng | Phần áp dụng | Vì sao độc lập với nguồn của requirement |
| --- | --- | --- | --- | --- |
| OWASP ASVS [[2]](#ref-2) [[3]](#ref-3) [[4]](#ref-4) | 5.0, file gốc trên nhánh `master`, truy cập 2026-11-17 | L1 cộng các mục L2 đã chọn [[5, ADR-002]](#ref-5) | V6 Authentication; V7 Session Management; các mục 3.3, 3.4, 3.5, 3.7 của V3 Web Frontend Security | Spec Authentication nằm trong tài liệu của prototype, và code được viết theo spec. ASVS là chuẩn ngành, không phụ thuộc prototype, spec hay code |

So các tài liệu có cùng nguồn gốc với nhau, ví dụ spec viết từ prototype với chính prototype đó, chỉ thấy chỗ chúng lệch nhau, không thấy những gì tất cả cùng bỏ sót [[1, LL-003]](#ref-1).

Mức áp dụng gồm L1 và một số mục L2 được chọn. Vì vậy mọi mục L1 và L2 trong phần áp dụng đều có kết quả: mục L2 không được chọn có kết quả Không áp dụng nếu ADR-002 đã ghi là rủi ro chấp nhận, hoặc có finding nếu chưa có quyết định.

## 2. Đối chiếu

Requirement ID dẫn tới [Requirement Readiness](01-requirement-readiness.md). ID dạng `ASVS-x.x.x` là requirement lấy trực tiếp từ mục ASVS, vì ADR-002 áp dụng toàn bộ L1 nhưng spec không nêu hành vi cụ thể (quyết định RF-11).

| Baseline item ID | Mức | Nội dung tóm tắt | Requirement IDs | Kết quả | Finding ID |
| --- | --- | --- | --- | --- | --- |
| 6.1.1 | L1 | Tài liệu mô tả rate limit, chống tự động hóa, tránh bị cố ý khóa tài khoản | SI-06, SEC-07 | Đủ | Không có |
| 6.1.2 | L2 | Danh sách từ theo ngữ cảnh bị cấm trong password. Rủi ro chấp nhận trong ADR-002 | Không có | Không áp dụng | Không có |
| 6.1.3 | L2 | Nhiều đường xác thực được ghi lại, control và độ mạnh nhất quán | SI-06, GO-08 | Đủ | RF-07 |
| 6.2.1 | L1 | Password tối thiểu 8 ký tự | CM-02 | Đủ | Không có |
| 6.2.2 | L1 | Người dùng đổi được password. Chức năng thuộc Settings, ngoài phạm vi TS-001 | Không có | Không áp dụng | Không có |
| 6.2.3 | L1 | Đổi password cần password hiện tại. Chức năng thuộc Settings, ngoài phạm vi TS-001 | Không có | Không áp dụng | Không có |
| 6.2.4 | L1 | Từ chối 3.000 password phổ biến khi đăng ký và đổi password | CA-14 | Đủ | Không có |
| 6.2.5 | L1 | Không ép quy tắc thành phần ký tự | CM-02 | Đủ | Không có |
| 6.2.6 | L1 | Ô password che ký tự bằng `type=password` | SI-08 | Đủ | Không có |
| 6.2.7 | L1 | Cho dán password và dùng password manager | ASVS-6.2.7 | Đủ | RF-11 |
| 6.2.8 | L1 | Kiểm password đúng như nhận được, không cắt bớt, không đổi hoa thường | CM-02 | Đủ | Không có |
| 6.2.9 | L2 | Cho password dài ít nhất 64 ký tự | CM-02 | Đủ | Không có |
| 6.2.10 | L2 | Không ép đổi password định kỳ. Spec không có luồng đổi định kỳ | CM-02 | Đủ | Không có |
| 6.2.11 | L2 | Dùng danh sách từ theo ngữ cảnh để chặn password. Rủi ro chấp nhận trong ADR-002 | Không có | Không áp dụng | Không có |
| 6.2.12 | L2 | Kiểm password đã bị lộ khi đăng ký và đổi password | CA-14 | Đủ | Không có |
| 6.3.1 | L1 | Control chống brute force chạy đúng như tài liệu | SI-06 | Đủ | Không có |
| 6.3.2 | L1 | Không có tài khoản mặc định (root, admin) | ASVS-6.3.2 | Đủ | RF-11 |
| 6.3.3 | L2 | Bắt buộc MFA. Rủi ro chấp nhận trong ADR-002 | Không có | Không áp dụng | Không có |
| 6.3.4 | L2 | Không có đường xác thực ngoài tài liệu; control nhất quán | GO-08 | Đủ | RF-07 |
| 6.4.1 | L1 | Mã kích hoạt ngẫu nhiên, hết hạn nhanh | CA-12, RP-04 | Đủ | Không có |
| 6.4.2 | L1 | Không có gợi ý password hay câu hỏi bí mật. Spec không có hai chức năng này | SI-01–SI-12 | Đủ | Không có |
| 6.4.3 | L2 | Reset password không vượt qua MFA. Không có MFA | Không có | Không áp dụng | Không có |
| 6.4.4 | L2 | Mất yếu tố MFA thì phải xác minh danh tính. Không có MFA | Không có | Không áp dụng | Không có |
| 6.5.1 | L2 | Lookup secret, mã OOB, TOTP chỉ dùng một lần. Không có các authenticator này | Không có | Không áp dụng | Không có |
| 6.5.2 | L2 | Lookup secret entropy thấp phải được hash. Không có lookup secret | Không có | Không áp dụng | Không có |
| 6.5.3 | L2 | Lookup secret, mã OOB, seed TOTP sinh bằng CSPRNG. Không có các authenticator này | Không có | Không áp dụng | Không có |
| 6.5.4 | L2 | Lookup secret và mã OOB có ít nhất 20 bit entropy. Không có các authenticator này | Không có | Không áp dụng | Không có |
| 6.5.5 | L2 | Request OOB sống tối đa 10 phút, TOTP 30 giây. Không có các authenticator này | Không có | Không áp dụng | Không có |
| 6.6.1 | L2 | OTP qua SMS chỉ cho số điện thoại đã xác minh. Không có SMS | Không có | Không áp dụng | Không có |
| 6.6.2 | L2 | Mã OOB gắn với request gốc. Không có xác thực OOB | Không có | Không áp dụng | Không có |
| 6.6.3 | L2 | Cơ chế OOB dùng mã có rate limit. Không có xác thực OOB | Không có | Không áp dụng | Không có |
| 6.8.1 | L2 | Có nhiều IdP thì không giả được danh tính giữa các provider | GO-09 | Đủ | RF-07 |
| 6.8.2 | L2 | Luôn kiểm chữ ký của assertion xác thực. Rủi ro chấp nhận trong ADR-002 | Không có | Không áp dụng | RF-07 |
| 6.8.3 | L2 | SAML assertion chỉ dùng một lần. Không dùng SAML | Không có | Không áp dụng | Không có |
| 6.8.4 | L2 | Kiểm độ mạnh xác thực do IdP trả về cho chức năng nhạy cảm. Không có chức năng cần mức này (đánh giá của agent) | Không có | Không áp dụng | Không có |
| 7.1.1 | L2 | Ghi rõ idle timeout và thời hạn tuyệt đối, kèm lý do khi khác NIST | SI-09, SS-05 | Đủ | Không có |
| 7.1.2 | L2 | Ghi rõ số phiên đồng thời và hành vi khi đạt tối đa | SS-08 | Đủ | RF-09 |
| 7.1.3 | L2 | Ghi rõ phiên liên kết với IdP: thời hạn và kết thúc phiên | GO-10 | Đủ | RF-07 |
| 7.2.1 | L1 | Token phiên được kiểm ở backend tin cậy | SS-03 | Đủ | Không có |
| 7.2.2 | L1 | Token phiên sinh động, không phải secret tĩnh | ASVS-7.2.2 | Đủ | RF-11 |
| 7.2.3 | L1 | Token tham chiếu duy nhất, sinh bằng CSPRNG, ít nhất 128 bit | ASVS-7.2.3 | Đủ | RF-11 |
| 7.2.4 | L1 | Đăng nhập thì cấp token mới, hủy token đang có | ASVS-7.2.4 | Đủ | RF-11 |
| 7.3.1 | L2 | Idle timeout. Rủi ro chấp nhận trong ADR-002 | Không có | Không áp dụng | Không có |
| 7.3.2 | L2 | Thời hạn phiên tuyệt đối | SS-05 | Đủ | Không có |
| 7.4.1 | L1 | Phiên đã kết thúc không dùng lại được | SS-01 | Đủ | Không có |
| 7.4.2 | L1 | Khóa hoặc xóa tài khoản thì kết thúc mọi phiên. Chức năng thuộc Settings, ngoài phạm vi TS-001 | Không có | Không áp dụng | Không có |
| 7.4.3 | L2 | Cho kết thúc phiên khác sau khi đổi yếu tố xác thực | RP-06 | Đủ | Không có |
| 7.4.4 | L2 | Có nút đăng xuất dễ thấy trên trang cần đăng nhập | SS-01 | Đủ | Không có |
| 7.4.5 | L2 | Admin kết thúc phiên của người dùng. Chưa có vai trò admin | Không có | Không áp dụng | Không có |
| 7.5.1 | L2 | Xác thực lại trước khi đổi email. Rủi ro chấp nhận trong ADR-002 | Không có | Không áp dụng | Không có |
| 7.5.2 | L2 | Xem và kết thúc từng phiên. Rủi ro chấp nhận trong ADR-002 | Không có | Không áp dụng | Không có |
| 7.6.1 | L2 | Thời hạn và kết thúc phiên giữa RP và IdP chạy đúng tài liệu | GO-10 | Đủ | RF-07 |
| 7.6.2 | L2 | Tạo phiên cần người dùng đồng ý hoặc có thao tác rõ ràng. Rủi ro chấp nhận trong ADR-002 | CA-05, CA-17 | Không áp dụng | RF-08 |
| 3.3.1 | L1 | Cookie có `Secure`; cookie không dùng `__Host-` thì dùng `__Secure-` | SEC-01 | Đủ | Không có |
| 3.3.2 | L2 | `SameSite` theo mục đích của cookie | SEC-01 | Đủ | Không có |
| 3.3.3 | L2 | Cookie dùng tiền tố `__Host-`. Rủi ro chấp nhận trong ADR-002 | Không có | Không áp dụng | Không có |
| 3.3.4 | L2 | Cookie phiên có `HttpOnly` | SEC-01 | Đủ | Không có |
| 3.4.1 | L1 | Mọi response có `Strict-Transport-Security`, `max-age` ít nhất 1 năm | SEC-08 | Đủ | Không có |
| 3.4.2 | L1 | `Access-Control-Allow-Origin` cố định hoặc theo allowlist | ASVS-3.4.2 | Đủ | RF-11 |
| 3.4.3 | L2 | CSP đầy đủ. Rủi ro chấp nhận trong ADR-002 | Không có | Không áp dụng | Không có |
| 3.4.4 | L2 | `X-Content-Type-Options: nosniff` | SEC-08 | Đủ | Không có |
| 3.4.5 | L2 | `Referrer-Policy` chặn lộ dữ liệu qua Referer | SEC-08 | Đủ | Không có |
| 3.4.6 | L2 | CSP `frame-ancestors` trên mọi response | SEC-08 | Đủ | Không có |
| 3.5.1 | L1 | Request nhạy cảm không qua preflight được kiểm origin | SEC-02 | Đủ | Không có |
| 3.5.2 | L1 | Chức năng dựa vào preflight không gọi được nếu bỏ preflight. Auth dùng origin check, không dựa vào preflight | Không có | Không áp dụng | Không có |
| 3.5.3 | L1 | Chức năng nhạy cảm dùng method không an toàn (không dùng GET) | CA-05 | Một phần | RF-08 |
| 3.5.4 | L2 | Các ứng dụng riêng nằm trên hostname riêng. Web và API là một ứng dụng, cùng origin qua proxy | Không có | Không áp dụng | Không có |
| 3.5.5 | L2 | Bỏ message `postMessage` có origin không tin cậy. Luồng Google dùng redirect, không dùng `postMessage` | GO-05 | Không áp dụng | RF-07 |
| 3.7.1 | L2 | Chỉ dùng công nghệ phía client được hỗ trợ và an toàn. Web chỉ dùng React, không dùng plugin | Không có | Không áp dụng | Không có |
| 3.7.2 | L2 | Chỉ tự chuyển hướng tới đích trong allowlist | RD-06, SEC-02 | Đủ | Không có |

| Kết quả | Số baseline item |
| --- | --- |
| Đủ | 39 |
| Một phần | 1 |
| Thiếu | 0 |
| Không áp dụng | 30 |
| **Tổng** | **70** |

Phần áp dụng có 70 mục: V6 có 35 mục (13 L1, 22 L2); V7 có 18 mục (6 L1, 12 L2); bốn mục của V3 có 17 mục (6 L1, 11 L2). Mục L3 không thuộc phần áp dụng.

## 3. Tiêu chí đạt

| ID | Tiêu chí | Điều kiện đầu vào | Kết quả |
| --- | --- | --- | --- |
| Q2-01 | Baseline độc lập với nguồn đã sinh ra requirement, và lý do độc lập được ghi | RC-03 | Đạt |
| Q2-02 | ID và mức của baseline item lấy từ bản gốc, không lấy từ bản tóm tắt | IN-05 | Đạt: lấy từ file gốc của OWASP ngày 2026-11-17 |
| Q2-03 | Mọi item trong phần áp dụng của baseline có kết quả; item Không áp dụng có lý do, dựa trên phạm vi và ràng buộc của domain | IN-09 | Đạt |
| Q2-04 | Mọi item Một phần hoặc Thiếu có finding tương ứng ở Review Findings | — | Đạt |
| Q2-05 | Tổng ở bảng số lượng bằng số item trong phần áp dụng của baseline | — | Đạt: 70 |

**Người review / ngày:** Product owner, 2026-11-17

## References

1. <a id="ref-1"></a>[Lessons Learned](../../../../../../LESSONS.md)
2. <a id="ref-2"></a>OWASP ASVS 5.0, V6 Authentication. <https://raw.githubusercontent.com/OWASP/ASVS/master/5.0/en/0x15-V6-Authentication.md> — truy cập 2026-11-17
3. <a id="ref-3"></a>OWASP ASVS 5.0, V7 Session Management. <https://raw.githubusercontent.com/OWASP/ASVS/master/5.0/en/0x16-V7-Session-Management.md> — truy cập 2026-11-17
4. <a id="ref-4"></a>OWASP ASVS 5.0, V3 Web Frontend Security. <https://raw.githubusercontent.com/OWASP/ASVS/master/5.0/en/0x12-V3-Web-Frontend-Security.md> — truy cập 2026-11-17
5. <a id="ref-5"></a>[Architectural Decisions](../../../../../architecture/30-decisions.md) — commit `705a1ad`, 2026-11-17
