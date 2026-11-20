# Lean Testing Workflow (v1)

Đọc file này để biết cách test một feature với chi phí thấp mà vẫn tìm được defect quan trọng và chặn regression.

> Trạng thái: v1, chờ người dùng duyệt. Đã đối chiếu với Bước 1–3 của [[1, §5]](#ref-1).

## Nguyên tắc

- Mỗi việc phải giúp **tìm**, **sửa** hoặc **chặn lại** defect. Việc không giúp được điều nào thì bỏ.
- Bằng chứng nằm trong test code và commit, không nằm trong report.
- Lỗi lặp lại được chặn bằng check tự động (type, lint, test), không chặn bằng văn bản.

## Phân vai người và agent

Code và report rẻ; quyết định "thế nào là đúng" thì không. Vì vậy thời gian của người dùng đặt vào đây:

| Người dùng | Agent |
|---|---|
| Chốt rule và quyết định gap ở bước 1 (định nghĩa "đúng") | Soạn danh sách rule, tìm gap, đối chiếu baseline, đề xuất giá trị kèm nguồn |
| Duyệt danh sách vùng **high blast radius** của feature (auth, tiền, xóa dữ liệu, quyền) | Viết code, test, chạy check, ghi defect |
| Review diff **chỉ ở vùng high blast radius** và kết quả exploratory | Tự review phần còn lại bằng check tự động và `/code-review` |

Spec là nguồn sự thật; code chỉ là một bản chiếu của spec. Mỗi rule đã chốt phải đi thành ít nhất một test tự động (acceptance criteria dạng Given/When/Then, skill `deliver-acceptance-criteria`), không dừng ở văn bản.

## Chọn mức theo rủi ro

| Mức | Khi nào | Làm gì thêm |
|---|---|---|
| **Cao** | Auth, quyền truy cập, tiền/P&L, `packages/engine`, dữ liệu người dùng | Checklist bảo mật (OWASP ASVS) cho luồng liên quan; boundary cho mọi giới hạn số; mutant check cho test quan trọng |
| **Thường** | UI, màn hình đọc dữ liệu, tính năng phụ | Chỉ test hành vi chính và lỗi người dùng hay gặp |

Agent tự chọn mức và ghi một dòng lý do trong PR. Người dùng chỉ cần quyết khi feature nằm giữa hai mức.

## Các bước

| # | Bước | Đầu ra | Thời gian gợi ý |
|---|---|---|---|
| 1 | **Requirement gap analysis.** Review từng rule: có số đo được không, có mâu thuẫn không, thiếu trường hợp nào (lỗi, giới hạn, trạng thái, đồng thời). Mức Cao: đối chiếu với baseline độc lập (ví dụ OWASP ASVS cho auth). Gap → hỏi người dùng trước khi code; dùng skill `stlc-requirement-analysis` khi cần | Danh sách rule đã chốt + danh sách gap đã giải quyết | Ngắn – trung bình. Round 1 cho thấy đây là nguồn defect lớn nhất |
| 2 | **Chọn test level, type và technique theo rủi ro.** Với mỗi nhóm rule: level (unit / integration / E2E), type (functional, security, accessibility, performance), technique (EP/BVA, state transition, decision table, scenario, threat model, exploratory). Dùng các skill `test-technique-*` | Bảng ngắn: rule → level → type → technique | Ngắn |
| 3 | **Thiết kế interface trước.** Với logic phức tạp, dùng Deep Module: interface nhỏ, ẩn chi tiết bên trong. Chỉ export những gì caller cần | Chữ ký public của module | Ngắn |
| 4 | **Viết test trước code (TDD), black-box qua public interface hoặc UI.** Test case lấy từ technique ở bước 2; expected value lấy từ rule ở bước 1, không lấy từ code. Assertion kiểm tra kết quả chính xác. White-box (branch coverage) chỉ dùng sau để tìm vùng code chưa có test | Test fail (red) rồi pass (green) | Phần lớn thời gian |
| 5 | **Mutant check** (chỉ mức Cao). Làm hỏng code có chủ đích; mỗi test quan trọng phải fail ít nhất một lần, rồi revert | Ghi chú ngắn trong commit hoặc PR | Ngắn |
| 6 | **Exploratory testing — không bắt buộc.** Người dùng tự quyết khi nào chạy. Agent không chặn việc đóng feature vì chưa chạy bước này | Defect mới (nếu có) | Tùy người dùng |
| 7 | **Tạo GitHub issue** cho mỗi defect (label `bug`, thêm label severity): mô tả, expected, actual, test liên quan, commit. Không tạo file defect trong `docs/` | 1 issue mỗi defect | Theo số defect |
| 8 | **Sửa và đóng.** Sửa theo TDD, một commit cho mỗi defect; `pnpm check` pass ở mọi commit. Chạy test từng file với `--workers=1`, không chạy toàn bộ E2E song song (máy giới hạn RAM). Commit ghi `Fixes #<issue>` để issue tự đóng | Commit `fix(...)` cho từng defect | — |
| 9 | **`/code-review` rồi retro.** Retro chỉ đề xuất check tự động cho lỗi lặp lại | Lint rule, type hoặc test mới | Ngắn |

## Ba anti-pattern phải tránh

Các rule này đã có trong Coding Guidelines [[2]](#ref-2); đây chỉ là nhắc lại để nhận diện nhanh.

| Anti-pattern | Dấu hiệu | Cách chặn |
|---|---|---|
| Tautological test | Expected value copy từ code hoặc import hằng số từ code đang test | Expected value viết literal từ spec |
| Structure-sensitive test | Test vỡ khi đổi tên, tách file mà hành vi không đổi | Test qua public interface; không export nội bộ |
| Test that can't fail | Assertion lỏng (`not 429`), mock bỏ qua ràng buộc thật | Assertion chính xác; mutant check |
| Test phụ thuộc thời gian thật (thêm ở v1) | Test dùng đồng hồ thật hoặc timeout cố định; fail khi máy chậm mà product không sai (TC-005, TC-172 ở round 2) | Điều khiển thời gian trong test (fake clock hoặc inject clock); chờ theo điều kiện, không chờ theo số giây |

## Khác gì STLC đầy đủ

Workflow này giữ các **hoạt động** có giá trị của STLC (requirement analysis, chọn technique theo rủi ro, test design, execution, defect tracking) và bỏ các **artifact** không giúp tìm, sửa hay chặn defect (test plan riêng, execution status, summary, closure, residual risk).

## Không làm

- Không viết test plan, execution status, test summary, closure, residual risk riêng.
- Không viết checker cho tài liệu.
- Không review độc lập một tài liệu quá 1 lượt.
- Không đưa lựa chọn cho người dùng khi lựa chọn đó không đổi hành vi của product hoặc phạm vi.

## Khi nào dùng STLC đầy đủ

Chỉ khi có yêu cầu rõ ràng cần bằng chứng chính thức (ví dụ bên thứ ba audit, hoặc người dùng yêu cầu). Khi đó dùng các skill `stlc-*` hiện có.

## Đo gì

Ghi 4 số cho mỗi feature, trong commit cuối hoặc PR. Không tạo report riêng.

- Defect tìm được, theo nguồn: requirement review, test tự động, exploratory, người dùng.
- Defect lọt ra sau khi đóng feature.
- Thời gian hoặc token, tách theo: phân tích requirement, code + test, tài liệu.
- Số lần người dùng phải quyết định, và bao nhiêu lần quyết định đó đổi hành vi product.

Mục đích: biết nút thắt hiện ở đâu để tối ưu đúng chỗ. Round 1 không có số đo effort, nên không xác định được chỗ tốn.

## Quyết định ở v1

- **Defect tracking:** feature mới dùng GitHub issue. Khi app đã deploy và có người dùng thật, defect bảo mật chưa sửa dùng GitHub Security Advisory (private), không mở issue public. TS-001 giữ defect report hiện có.
- **Mutant check:** giữ làm thủ công, chỉ cho mức Cao. Chưa thêm Stryker; xem lại khi `packages/engine` có test (engine thuần, không I/O, phù hợp mutation tool).

## Điều chưa chắc (xem lại ở v2)

- Bốn số đo ở mục "Đo gì" chưa được thu ở round 2. Feature tiếp theo là lần đầu thu số.

## References

1. <a id="ref-1"></a>[Testing Approach Update](testing-approach-update.md)
2. <a id="ref-2"></a>[Coding Guidelines](../../development/coding-guidelines.md)
