# Residual Risks

Đọc file này để biết những rủi ro còn lại sau vòng 1 của TS-001, đề xuất xử lý từng rủi ro và quyết định của product owner.

## 1. Cách đánh giá

| Trường | Nội dung |
| --- | --- |
| Đối tượng được đánh giá / thời điểm chốt | Commit `7cdb0f5`; 2026-11-19 08:25 (UTC+7) |
| Thang khả năng xảy ra | Risk Register mục 1 [[1]](#ref-1). Với defect: hành vi sai xảy ra mỗi lần điều kiện kích hoạt xảy ra (test tái hiện được). Tần suất của điều kiện kích hoạt ghi "Chưa xác định" khi không có dữ liệu sử dụng |
| Thang mức ảnh hưởng | Risk Register mục 1 [[1]](#ref-1); giữ mức ảnh hưởng của product risk liên quan |
| Cách xếp hạng | Ma trận khả năng × ảnh hưởng của Risk Register |
| Người tham gia đánh giá | Agent đề xuất; product owner chưa review |

## 2. Danh sách rủi ro

| Risk ID | Nguồn | Sự kiện có thể xảy ra và ảnh hưởng | Khả năng / ảnh hưởng | Căn cứ đánh giá | Biện pháp giảm thiểu đã có | Owner |
| --- | --- | --- | --- | --- | --- | --- |
| R-01 | DEF-01; PR-01 | Kẻ tấn công thử 5 password mỗi 15 phút từ một IP thay vì 3 mỗi 10 giây; người dùng bị khóa không thấy thông báo | Chắc chắn khi có lần thử liên tiếp / Cao | TC-001 đến TC-008, TC-020, TC-138, TC-175 Failed | Giới hạn 5 lần / 15 phút của Better Auth vẫn chặn brute force ở mức thấp hơn | Product owner |
| R-02 | DEF-02, DEF-03; PR-03 | Phiên cũ còn dùng được sau khi Sign in lại (session fixation); phiên không hết hạn sau 30 ngày trên máy dùng chung | Chắc chắn khi điều kiện xảy ra; tần suất Chưa xác định / Cao | TC-033, TC-036, TC-049 Failed | Phiên vẫn hết hạn sau 7 ngày không dùng | Product owner |
| R-03 | DEF-05, DEF-18; PR-06 | Link reset cũ còn đặt được password sau khi đã đổi; token reset lộ qua `Referer` tới site bên ngoài | Chắc chắn khi điều kiện xảy ra; tần suất Chưa xác định / Cao | TC-068, TC-230 Failed | Link reset hết hạn sau 1 giờ và dùng một lần | Product owner |
| R-04 | DEF-06; PR-09 | Người dùng đặt được password phổ biến hoặc đã lộ | Chắc chắn khi người dùng chọn password như vậy / Trung bình | TC-110, TC-111, TC-113, TC-114 Failed | Độ dài tối thiểu 8 ký tự | Product owner |
| R-05 | DEF-09; PR-07 | Mở link xác minh của B khi đang đăng nhập A làm phiên chuyển sang B mà không báo; người dùng thao tác nhầm tài khoản | Chắc chắn khi điều kiện xảy ra; tần suất Chưa xác định / Trung bình | TC-071 Failed | Không có | Product owner |
| R-06 | DEF-04; PR-03, PR-06 | Phiên và link reset được chấp nhận đúng tại giây hết hạn | Chắc chắn tại giây đó / Thấp | TC-046, TC-047, TC-050 Failed; lệch một giây | Không có | Product owner |
| R-07 | DEF-07, DEF-08; PR-09 | Password có ký tự ngoài BMP bị đếm sai độ dài; form nhận password trên 128 ký tự và Full name trên 100 ký tự | Chắc chắn khi nhập giá trị đó / Thấp | TC-090 đến TC-098 Failed | API từ chối password trên 128 đơn vị UTF-16 (Actual của DEF-07). Không có dữ liệu cho Full name | Product owner |
| R-08 | DEF-10, DEF-12 đến DEF-16; PR-10, PR-11 | Người dùng không biết cách gửi lại link xác minh lỗi, mất email đã nhập, nhận email hướng dẫn thiếu, kẹt ở Check your email, hoặc tới sai đích sau Reset password | Chắc chắn khi điều kiện xảy ra / Thấp | TC-072, TC-078, TC-135, TC-141, TC-145, TC-183, TC-184, TC-187 Failed | Người dùng vẫn đi được luồng chính | Product owner |
| R-09 | DEF-11; PR-13 | Người dùng screen reader không có danh sách lỗi ở Forgot password và Choose a new password | Chắc chắn / Trung bình | TC-242, TC-243 Failed; quét axe (TC-244, TC-245) Passed | Chưa xác định: Actual của DEF-11 chỉ ghi thiếu danh sách lỗi | Product owner |
| R-10 | DEF-17; PR-05 | Response của API thiếu header bảo mật, nên trình duyệt không chặn MIME sniffing và nhúng frame | Chưa xác định / Trung bình | TC-227 Failed | Cookie phiên có `HttpOnly`, `SameSite` (TC-220 Passed) | Product owner |
| R-11 | DEF-19, GAP-05; PR-08 | Người có tài khoản chưa xác minh dùng Google thấy thông báo chung; Google có thể không hiện màn chọn tài khoản khi trình duyệt chỉ có một phiên, nên người dùng vào nhầm tài khoản | DEF-19: chắc chắn khi điều kiện xảy ra. GO-06: Chưa xác định / Trung bình | TC-103 Failed (RUN-007, input IN-06); GAP-05 | Không có | Product owner |
| R-12 | GAP-04; TD-20 | Lỗi ngoài test case trong giới hạn số lần, phiên, Google, link và redirect không được tìm, vì 4 exploratory session chưa chạy | Chưa xác định / Cao | 0 / 4 session; charter nhắm vào PR-01 đến PR-08 | Test có kịch bản phủ 421 / 427 coverage item | Product owner |
| R-13 | GAP-01, GAP-02 | HSTS, Sign out từ mọi màn hình, chung bộ đếm IP sau proxy và log bảo mật chưa được kiểm | Chưa xác định / Cao | Product owner quyết định không test trong TS-001, ngày 2026-11-17 | Kiểm khi có môi trường deploy (TD-02, TD-03, TD-06) | Product owner |
| R-14 | GAP-06, GAP-07, TD-16, TD-24; input IN-06, RC-05 | Một kết quả Passed sai: email thật không tới hộp thư (TC-197, TC-198), build của working tree khác commit, 12 test chưa kiểm bằng mutant, test chập chờn che lỗi thật | Chưa xác định / Trung bình | Evidence yếu hoặc thiếu, ghi ở từng nguồn | Test tự động khác của cùng hành vi Passed trên `7cdb0f5` | Product owner (PROC-17); agent (TD-16, TD-24) |

Không tạo rủi ro mới cho phần ngoài phạm vi (SC-10 đến SC-16, SC-18): PR-16 đến PR-21 giữ quyết định của Phase 02, file này không đánh giá lại. TD-18 và TD-19 là test chờ bản sửa của DEF-10 và DEF-19, nằm trong R-08 và R-11.

## 3. Quyết định xử lý

| Risk ID | Đề xuất | Quyết định | Người quyết định, ngày, link | Điều kiện / thời điểm review lại |
| --- | --- | --- | --- | --- |
| R-01 | Sửa | Chưa quyết định | | Sau vòng 2 |
| R-02 | Sửa | Chưa quyết định | | Sau vòng 2 |
| R-03 | Sửa | Chưa quyết định | | Sau vòng 2 |
| R-04 | Sửa | Chưa quyết định | | Sau vòng 2 |
| R-05 | Sửa | Chưa quyết định | | Sau vòng 2 |
| R-06 | Sửa hoặc chấp nhận | Chưa quyết định | | Sau vòng 2 |
| R-07 | Sửa | Chưa quyết định | | Sau vòng 2 |
| R-08 | Sửa; DEF-12 có thể chấp nhận | Chưa quyết định | | Sau vòng 2 |
| R-09 | Sửa | Chưa quyết định | | Sau vòng 2 |
| R-10 | Sửa | Chưa quyết định | | Sau vòng 2 |
| R-11 | Sửa DEF-19; test thêm cho GO-06 (ACT-03) | Chưa quyết định | | Sau vòng 2 |
| R-12 | Test thêm: chạy ít nhất CHR-01 và CHR-03 (rủi ro Cao) sau vòng sửa | Chưa quyết định; product owner đã hoãn session vô thời hạn | | Trước khi đóng TS-001 |
| R-13 | Chuyển giao sang kiểm thử khi deploy | Chưa quyết định cho Phase 06; quyết định "không test trong TS-001" có từ 2026-11-17 | | Khi có môi trường deploy |
| R-14 | Test thêm: chạy lại PROC-17 có log hoặc video; TD-16, TD-24 | Chưa quyết định | | Vòng 2 |

## 4. Tiêu chí đạt

| ID | Tiêu chí | Điều kiện đầu vào | Kết quả |
| --- | --- | --- | --- |
| Q4-01 | Mọi defect ở mục 4 của file Defects và mọi coverage gap đã được xem xét: có Risk ID, hoặc có lý do không tạo rủi ro | — | Đạt: DEF-01 đến DEF-19 và GAP-01 đến GAP-07 đều có Risk ID; GAP-03 là tổng của R-01 đến R-11 |
| Q4-02 | Mọi thông tin ở trạng thái Giả định và mọi điều kiện không đạt trong input đã được xem xét như trên | IN-01 → IN-13, RC-01 → RC-05 | Đạt: IN-06, RC-02, RC-05 ở R-14. IN-11 và IN-13 không tạo rủi ro sản phẩm: chúng chỉ ảnh hưởng Lessons Learned và mục 4.3 của báo cáo |
| Q4-03 | Mức khả năng và ảnh hưởng có căn cứ; không có căn cứ thì ghi "Chưa xác định" | IN-09 | Đạt |
| Q4-04 | Mọi rủi ro có owner | — | Đạt |
| Q4-05 | Mọi quyết định chấp nhận có người có thẩm quyền, ngày và bằng chứng | IN-10 | Đạt: chưa có quyết định chấp nhận nào; mọi dòng ghi Chưa quyết định |

**Người review / ngày:** chưa có.

## References

1. <a id="ref-1"></a>[Risk Register](../../02-planning/output/02-risk-register.md) — 2026-11-17
