# Test Conditions

Đọc file này để biết từ test basis Authentication cần kiểm tra những gì, theo thứ tự ưu tiên nào, test basis còn thiếu gì so với baseline độc lập, và những lỗi test basis đã được báo.

## 1. Phạm vi

| Trường | Nội dung |
| --- | --- |
| Test basis | Requirement Readiness [[1]](#ref-1) `6c7bbd7`: 81 requirement Ready. Tài liệu nguồn: Authentication [[2]](#ref-2) `705a1ad`, Security [[3]](#ref-3) `d6c0541`, Workspace [[4]](#ref-4) `bd0ecff`, Crypto Force UI Prototype [[5]](#ref-5) `dbbaafe`, Architectural Decisions [[6]](#ref-6) `705a1ad`, Test Strategy [[7]](#ref-7) `705a1ad` |
| Baseline độc lập | OWASP ASVS 5.0, L1 cộng các mục L2 đã chọn trong ADR-002, 70 mục [[8]](#ref-8); threat model STRIDE trên 4 data flow ([Test Models](03-test-models.md), MD-16) |
| Thời điểm chốt | 2026-11-17 (GMT+7) |

## 2. Test conditions

Requirement Ready được dùng trực tiếp làm test condition [[9, §4.5.2]](#ref-9): cột "Điều cần kiểm tra" dẫn tới ID của requirement ở Requirement Readiness, không viết lại nội dung. Rủi ro lấy từ Risk Register [[10]](#ref-10). Một requirement thuộc nhiều rủi ro thì ưu tiên theo rủi ro có mức cao nhất. Test level theo ranh giới ở Test Approach mục 1.2 [[11]](#ref-11): Component (C), Component integration (CI), System (S), System integration (SI).

| Condition ID | Test basis item / version | Điều cần kiểm tra | Nguồn | Rủi ro / ưu tiên | Test level / type |
| --- | --- | --- | --- | --- | --- |
| COND-01 | RD-01; `705a1ad` | Dùng trực tiếp RD-01 | Test basis | PR-11; Trung bình | S; Functional |
| COND-02 | RD-02; `705a1ad` | Dùng trực tiếp RD-02 | Test basis | PR-11; Trung bình | S; Functional |
| COND-03 | RD-04; `705a1ad` | Dùng trực tiếp RD-04 | Test basis | PR-11; Trung bình | S; Functional |
| COND-04 | RD-05; `705a1ad` | Dùng trực tiếp RD-05 | Test basis | PR-11; Trung bình | S; Functional |
| COND-05 | RD-06; `705a1ad` | Dùng trực tiếp RD-06 | Test basis | PR-04; Cao | C, S; Security |
| COND-06 | RD-07; `705a1ad` | Dùng trực tiếp RD-07 | Test basis | PR-11; Trung bình | S; Functional |
| COND-07 | RD-08; `705a1ad` | Dùng trực tiếp RD-08 | Test basis | PR-11; Trung bình | S; Functional |
| COND-08 | CM-01; `705a1ad` | Dùng trực tiếp CM-01 | Test basis | PR-10; Trung bình | C, CI; Functional |
| COND-09 | CM-02; `705a1ad` | Dùng trực tiếp CM-02 | Test basis | PR-09; Cao | C, CI; Security |
| COND-10 | CM-03; `705a1ad` | Dùng trực tiếp CM-03 | Test basis | PR-12; Trung bình | S; Reliability |
| COND-11 | SI-01; `705a1ad` | Dùng trực tiếp SI-01 | Test basis | PR-10; Trung bình | S; Functional |
| COND-12 | SI-02; `705a1ad` | Dùng trực tiếp SI-02 | Test basis | PR-10; Trung bình | C, S; Functional |
| COND-13 | SI-03; `705a1ad` | Dùng trực tiếp SI-03 | Test basis | PR-10; Trung bình | S; Functional |
| COND-14 | SI-04; `705a1ad` | Dùng trực tiếp SI-04 | Test basis | PR-02; Trung bình | CI, S; Security |
| COND-15 | SI-05; `705a1ad` | Dùng trực tiếp SI-05 | Test basis | PR-10; Trung bình | CI, S; Functional |
| COND-16 | SI-06; `705a1ad` | Dùng trực tiếp SI-06 | Test basis | PR-01; Cao | CI, S; Security |
| COND-17 | SI-07; `705a1ad` | Dùng trực tiếp SI-07 | Test basis | PR-10; Trung bình | S; Functional |
| COND-18 | SI-08; `705a1ad` | Dùng trực tiếp SI-08 | Test basis | PR-10, PR-13; Trung bình | S; Functional, Usability |
| COND-19 | SI-09; `705a1ad` | Dùng trực tiếp SI-09 | Test basis | PR-03; Cao | CI; Security |
| COND-20 | SI-10; `705a1ad` | Dùng trực tiếp SI-10 | Test basis | PR-03; Cao | CI; Security |
| COND-21 | SI-11; `705a1ad` | Dùng trực tiếp SI-11 | Test basis | PR-03; Cao | CI, S; Functional |
| COND-22 | SI-12; `705a1ad` | Dùng trực tiếp SI-12 | Test basis | PR-02; Trung bình | CI; Security |
| COND-23 | GO-01; `705a1ad` | Dùng trực tiếp GO-01 | Test basis | PR-08; Cao | S, SI; Functional |
| COND-24 | GO-02; `705a1ad` | Dùng trực tiếp GO-02 | Test basis | PR-08; Cao | CI; Security |
| COND-25 | GO-03; `705a1ad` | Dùng trực tiếp GO-03 | Test basis | PR-08; Cao | CI, S; Security |
| COND-26 | GO-04; `705a1ad` | Dùng trực tiếp GO-04 | Test basis | PR-08; Cao | S; Functional |
| COND-27 | GO-05; `705a1ad` | Dùng trực tiếp GO-05 | Test basis | PR-08; Cao | S, SI; Functional |
| COND-28 | GO-06; `705a1ad` | Dùng trực tiếp GO-06 | Test basis | PR-08; Cao | SI; Functional |
| COND-29 | GO-07; `705a1ad` | Dùng trực tiếp GO-07 | Test basis | PR-08; Cao | CI; Security |
| COND-30 | GO-08; `705a1ad` | Dùng trực tiếp GO-08 | Test basis | PR-01; Cao | CI; Security |
| COND-31 | GO-09; `705a1ad` | Dùng trực tiếp GO-09 | Test basis | PR-08; Cao | CI; Security |
| COND-32 | GO-10; `705a1ad` | Dùng trực tiếp GO-10 | Test basis | PR-03; Cao | SI; Security |
| COND-33 | CA-01; `705a1ad` | Dùng trực tiếp CA-01 | Test basis | PR-10; Trung bình | S; Functional |
| COND-34 | CA-02; `705a1ad` | Dùng trực tiếp CA-02 | Test basis | PR-10; Trung bình | C, S; Functional |
| COND-35 | CA-03; `705a1ad` | Dùng trực tiếp CA-03 | Test basis | PR-10, PR-14; Trung bình | S, SI; Functional |
| COND-36 | CA-04; `705a1ad` | Dùng trực tiếp CA-04 | Test basis | PR-02; Trung bình | CI; Security |
| COND-37 | CA-05; `705a1ad` | Dùng trực tiếp CA-05 | Test basis | PR-07; Cao | CI, S, SI; Functional |
| COND-38 | CA-06; `705a1ad` | Dùng trực tiếp CA-06 | Test basis | PR-07; Cao | CI, S; Functional |
| COND-39 | CA-07; `705a1ad` | Dùng trực tiếp CA-07 | Test basis | PR-10; Trung bình | S; Functional |
| COND-40 | CA-08; `705a1ad` | Dùng trực tiếp CA-08 | Test basis | PR-10; Trung bình | S; Functional |
| COND-41 | CA-09; `705a1ad` | Dùng trực tiếp CA-09 | Test basis | PR-10, PR-11; Trung bình | S; Functional |
| COND-42 | CA-10; `705a1ad` | Dùng trực tiếp CA-10 | Test basis | PR-10, PR-11; Trung bình | S; Functional |
| COND-43 | CA-11; `705a1ad` | Dùng trực tiếp CA-11 | Test basis | PR-13; Trung bình | S; Usability |
| COND-44 | CA-12; `705a1ad` | Dùng trực tiếp CA-12 | Test basis | PR-07; Cao | CI; Security |
| COND-45 | CA-13; `705a1ad` | Dùng trực tiếp CA-13 | Test basis | PR-09; Cao | C, CI; Security |
| COND-46 | CA-14; `705a1ad`, Security `d6c0541` | Dùng trực tiếp CA-14 | Test basis | PR-09; Cao | CI; Security |
| COND-47 | CA-15; `705a1ad` | Dùng trực tiếp CA-15 | Test basis | PR-10; Trung bình | S; Functional |
| COND-48 | CA-16; `705a1ad` | Dùng trực tiếp CA-16 | Test basis | PR-02; Trung bình | CI; Security |
| COND-49 | CA-17; `705a1ad` | Dùng trực tiếp CA-17 | Test basis | PR-07; Cao | CI, S; Security |
| COND-50 | RP-01; `705a1ad` | Dùng trực tiếp RP-01 | Test basis | PR-10, PR-14; Trung bình | S, SI; Functional |
| COND-51 | RP-02; `705a1ad` | Dùng trực tiếp RP-02 | Test basis | PR-10; Trung bình | S; Functional |
| COND-52 | RP-03; `705a1ad` | Dùng trực tiếp RP-03 | Test basis | PR-02; Trung bình | CI, S; Security |
| COND-53 | RP-04; `705a1ad` | Dùng trực tiếp RP-04 | Test basis | PR-06; Cao | CI, SI; Security |
| COND-54 | RP-05; `705a1ad` | Dùng trực tiếp RP-05 | Test basis | PR-09; Cao | C, S; Security |
| COND-55 | RP-06; `705a1ad` | Dùng trực tiếp RP-06 | Test basis | PR-06; Cao | CI, S; Security |
| COND-56 | RP-07; `705a1ad` | Dùng trực tiếp RP-07 | Test basis | PR-06; Cao | S; Functional |
| COND-57 | RP-08; `705a1ad` | Dùng trực tiếp RP-08 | Test basis | PR-06; Cao | S; Functional |
| COND-58 | SS-01; `bd0ecff` | Dùng trực tiếp SS-01 | Test basis | PR-03; Cao | S; Security |
| COND-59 | SS-02; `bd0ecff` | Dùng trực tiếp SS-02 | Test basis | PR-12; Trung bình | S; Reliability |
| COND-60 | SS-03; `bd0ecff` | Dùng trực tiếp SS-03 | Test basis | PR-12; Trung bình | S; Functional |
| COND-61 | SS-04; `bd0ecff` | Dùng trực tiếp SS-04 | Test basis | PR-12; Trung bình | S; Functional |
| COND-62 | SS-05; Security `d6c0541` | Dùng trực tiếp SS-05 | Test basis | PR-03; Cao | CI; Security |
| COND-63 | SS-06; `705a1ad` | Dùng trực tiếp SS-06 | Test basis | PR-07; Cao | CI, S; Security |
| COND-64 | SS-07; ADR-001 `705a1ad` | Dùng trực tiếp SS-07 | Test basis | PR-12; Trung bình | S; Reliability |
| COND-65 | SS-08; Security `d6c0541` | Dùng trực tiếp SS-08 | Test basis | PR-03; Cao | CI; Security |
| COND-66 | SEC-01; Security `d6c0541` | Dùng trực tiếp SEC-01 | Test basis | PR-05; Cao | CI; Security |
| COND-67 | SEC-02; Security `d6c0541` | Dùng trực tiếp SEC-02 | Test basis | PR-04; Cao | CI; Security |
| COND-68 | SEC-03; Security `d6c0541` | Dùng trực tiếp SEC-03 | Test basis | PR-02; Trung bình | CI; Security |
| COND-69 | SEC-04; Security `d6c0541` | Dùng trực tiếp SEC-04 | Test basis | PR-01; Cao | CI; Security |
| COND-70 | SEC-06; Security `d6c0541` | Dùng trực tiếp SEC-06 | Test basis | PR-14; Trung bình | CI; Reliability |
| COND-71 | SEC-07; Security `d6c0541` | Dùng trực tiếp SEC-07 | Test basis | PR-01; Cao | CI; Security |
| COND-72 | SEC-08; Security `d6c0541` | Dùng trực tiếp SEC-08 | Test basis | PR-05; Cao | S; Security |
| COND-73 | SEC-09; Security `d6c0541` | Dùng trực tiếp SEC-09 | Test basis | PR-02, PR-14; Trung bình | CI; Reliability, Security |
| COND-74 | ASVS-6.2.7; ADR-002 `705a1ad` | Dùng trực tiếp ASVS-6.2.7 | Test basis | PR-09; Cao | S; Security |
| COND-75 | ASVS-6.3.2; ADR-002 `705a1ad` | Dùng trực tiếp ASVS-6.3.2 | Test basis | PR-15; Trung bình | CI; Security |
| COND-76 | ASVS-7.2.2; ADR-002 `705a1ad` | Dùng trực tiếp ASVS-7.2.2 | Test basis | PR-15; Trung bình | CI; Security |
| COND-77 | ASVS-7.2.3; ADR-002 `705a1ad` | Dùng trực tiếp ASVS-7.2.3 | Test basis | PR-15; Trung bình | CI; Security |
| COND-78 | ASVS-7.2.4; ADR-002 `705a1ad` | Dùng trực tiếp ASVS-7.2.4 | Test basis | PR-03; Cao | CI; Security |
| COND-79 | ASVS-3.4.2; ADR-002 `705a1ad` | Dùng trực tiếp ASVS-3.4.2 | Test basis | PR-04; Cao | S; Security |
| COND-80 | A11Y-01; `dbbaafe` | Dùng trực tiếp A11Y-01 | Test basis | PR-13; Trung bình | S; Usability |
| COND-81 | A11Y-02; Test Strategy `705a1ad` | Dùng trực tiếp A11Y-02 | Test basis | PR-13; Trung bình | S; Usability |
| COND-82 | SS-01, SS-03; `bd0ecff` | Sau Sign out, nút Back của trình duyệt không hiện lại nội dung workspace đã tải. Expected result lấy từ SS-01 (dữ liệu đã tải bị xóa) và SS-03 (không có phiên thì hiện màn chặn) | Error guessing: trình duyệt hiển thị lại trang từ back/forward cache sau khi đăng xuất là lỗi thường gặp của SPA | PR-03; Cao | S; Security |
| COND-83 | BD-15; mục 4.1, 2026-11-17 | Dùng trực tiếp quyết định BD-15: callback Google thiếu hoặc sai `state` không tạo phiên | Quyết định của product owner cho lỗi test basis | PR-08; Cao | CI; Security |
| COND-84 | BD-16; mục 4.1, 2026-11-17 | Dùng trực tiếp quyết định BD-16: link trong email dùng origin của `BETTER_AUTH_URL` | Quyết định của product owner cho lỗi test basis | PR-06, PR-07; Cao | CI; Security |
| COND-85 | BD-17; mục 4.1, 2026-11-17 | Dùng trực tiếp quyết định BD-17: trang web có token trong URL dùng `Referrer-Policy: no-referrer` | Quyết định của product owner cho lỗi test basis | PR-06; Cao | S; Security |

Mỗi test condition dẫn tới một nguồn có version. Hành vi không có trong nguồn nào được báo thành lỗi test basis ở mục 4, không được ghi thành test condition với expected result tự đặt. COND-83 đến COND-85 dẫn tới quyết định của lỗi test basis ở mục 4.1.

## 3. Đối chiếu baseline độc lập

Bảng dưới gồm 40 mục ASVS có kết quả Đủ hoặc Một phần ở Baseline Comparison [[8]](#ref-8). 30 mục còn lại của phần áp dụng có kết quả Không áp dụng ở Baseline Comparison, kèm lý do: 6.1.2, 6.2.2, 6.2.3, 6.2.11, 6.3.3, 6.4.3, 6.4.4, 6.5.1–6.5.5, 6.6.1–6.6.3, 6.8.2–6.8.4, 7.3.1, 7.4.2, 7.4.5, 7.5.1, 7.5.2, 7.6.2, 3.3.3, 3.4.3, 3.5.2, 3.5.4, 3.5.5, 3.7.1. Coverage item của từng mục nằm ở MD-14.

| Baseline item | Version / mức | Test condition IDs | Kết quả |
| --- | --- | --- | --- |
| 6.1.1 | ASVS 5.0; L1 | COND-16, COND-71 | Đã phủ |
| 6.1.3 | ASVS 5.0; L2 | COND-16, COND-30 | Đã phủ |
| 6.2.1 | ASVS 5.0; L1 | COND-09 | Đã phủ |
| 6.2.4 | ASVS 5.0; L1 | COND-46 | Đã phủ; dữ liệu test theo BD-11 |
| 6.2.5 | ASVS 5.0; L1 | COND-09 | Đã phủ |
| 6.2.6 | ASVS 5.0; L1 | COND-18 | Đã phủ |
| 6.2.7 | ASVS 5.0; L1 | COND-74 | Đã phủ |
| 6.2.8 | ASVS 5.0; L1 | COND-09 | Đã phủ |
| 6.2.9 | ASVS 5.0; L2 | COND-09 | Đã phủ |
| 6.2.10 | ASVS 5.0; L2 | COND-09 | Đã phủ |
| 6.2.12 | ASVS 5.0; L2 | COND-46 | Đã phủ |
| 6.3.1 | ASVS 5.0; L1 | COND-16 | Đã phủ |
| 6.3.2 | ASVS 5.0; L1 | COND-75 | Đã phủ |
| 6.3.4 | ASVS 5.0; L2 | COND-30 | Đã phủ |
| 6.4.1 | ASVS 5.0; L1 | COND-44, COND-53 | Đã phủ |
| 6.4.2 | ASVS 5.0; L1 | COND-11 đến COND-22 | Đã phủ |
| 6.8.1 | ASVS 5.0; L2 | COND-31 | Đã phủ; tổ hợp R5 của MD-08 theo BD-13 |
| 7.1.1 | ASVS 5.0; L2 | COND-19, COND-62 | Đã phủ |
| 7.1.2 | ASVS 5.0; L2 | COND-65 | Đã phủ |
| 7.1.3 | ASVS 5.0; L2 | COND-32 | Đã phủ |
| 7.2.1 | ASVS 5.0; L1 | COND-60 | Đã phủ |
| 7.2.2 | ASVS 5.0; L1 | COND-76 | Đã phủ |
| 7.2.3 | ASVS 5.0; L1 | COND-77 | Đã phủ |
| 7.2.4 | ASVS 5.0; L1 | COND-78 | Đã phủ |
| 7.3.2 | ASVS 5.0; L2 | COND-62 | Đã phủ |
| 7.4.1 | ASVS 5.0; L1 | COND-58 | Đã phủ |
| 7.4.3 | ASVS 5.0; L2 | COND-55 | Đã phủ |
| 7.4.4 | ASVS 5.0; L2 | COND-58 | Một phần: Sign out từ một màn hình workspace đã phủ. Nút Sign out trên từng màn hình thuộc App header (SC-14): không test trong TS-001, chuyển cho test scope của workspace (mục 4.1) |
| 7.6.1 | ASVS 5.0; L2 | COND-32 | Đã phủ |
| 3.3.1 | ASVS 5.0; L1 | COND-66 | Đã phủ |
| 3.3.2 | ASVS 5.0; L2 | COND-66 | Đã phủ |
| 3.3.4 | ASVS 5.0; L2 | COND-66 | Đã phủ |
| 3.4.1 | ASVS 5.0; L1 | COND-72 | Không test trong TS-001: Security đặt `Strict-Transport-Security` ở reverse proxy khi deploy; việc kiểm chuyển cho bước deploy (mục 4.1) |
| 3.4.2 | ASVS 5.0; L1 | COND-79 | Đã phủ |
| 3.4.4 | ASVS 5.0; L2 | COND-72 | Đã phủ |
| 3.4.5 | ASVS 5.0; L2 | COND-72, COND-85 | Đã phủ: response của API qua COND-72; trang web có token trong URL qua COND-85 (BD-17) |
| 3.4.6 | ASVS 5.0; L2 | COND-72 | Đã phủ |
| 3.5.1 | ASVS 5.0; L1 | COND-67 | Đã phủ |
| 3.5.3 | ASVS 5.0; L1 | COND-37, COND-49 | Một phần: link xác minh dùng GET là rủi ro chấp nhận của ADR-002; các request thay đổi trạng thái khác của Auth được kiểm ở MD-14 |
| 3.7.2 | ASVS 5.0; L2 | COND-05, COND-67 | Đã phủ |

ID và mức yêu cầu của chuẩn lấy từ bản gốc, không lấy từ bản tóm tắt.

## 4. Lỗi test basis

Mức ảnh hưởng theo rủi ro của test condition bị chặn. Product owner nhận báo cáo trong phiên làm việc ngày 2026-11-17 (Test Plan mục 6) và giao cho agent đề xuất và chốt quyết định cho cả 17 lỗi. Quyết định ở mục 4.1 là nguồn expected result cho các phần tử của test model dẫn tới lỗi đó.

| ID | Test basis item | Loại | Mô tả | Báo cho / link | Trạng thái | Test condition liên quan |
| --- | --- | --- | --- | --- | --- | --- |
| BD-01 | SI-04, SI-05; `705a1ad` | Mơ hồ | Bảng kiểm tra của Sign in có dòng "Email và password không khớp" và dòng "Email chưa được xác minh", nhưng không nêu thông báo khi cả hai cùng đúng: email chưa xác minh và password sai. Nếu Auth báo "cần xác nhận email" trong trường hợp này, thông báo cho biết email đã đăng ký mà không cần biết password (PR-02) | Product owner, phiên làm việc 2026-11-17 | Đã trả lời (mục 4.1) | COND-14, COND-15: MD-12-CI-04 |
| BD-02 | SEC-07, CA-03, RP-03, CA-07; Security `d6c0541`, `705a1ad` | Thiếu | Security nêu giới hạn 3 request/60 giây cho gửi lại link xác minh và gửi link reset, 3 request/10 giây cho Create account. Không tài liệu nào nêu người dùng thấy gì khi bị chặn. CA-03 và RP-03 yêu cầu luôn hiện cùng một màn hình để không lộ email đã đăng ký; không rõ yêu cầu này có giữ khi bị chặn không. Ví dụ: lần bấm Send reset link thứ 4 trong 60 giây hiện "If an account exists for …" hay một thông báo đợi | Product owner, phiên làm việc 2026-11-17 | Đã trả lời (mục 4.1) | COND-71: phần UI của MD-05-CI-17 đến MD-05-CI-40 |
| BD-03 | SI-06, SEC-07, GO-08; Security `d6c0541` | Mơ hồ | Ba chi tiết về thời gian của giới hạn số lần không có trong nguồn. (a) Với 3 request/60 giây, 3 request/10 giây của Create account và 100 request/10 giây của callback Google, cửa sổ tính từ request nào; Security chỉ mô tả cách tính này cho Sign in. (b) `X-Retry-After` được làm tròn thế nào khi thời gian còn lại không phải số giây nguyên. (c) "dùng cùng giới hạn với Sign in" của `/api/auth/sign-in/social` nghĩa là cùng quy tắc với bộ đếm riêng, hay chung bộ đếm với `/api/auth/sign-in/email` | Product owner, phiên làm việc 2026-11-17 | Đã trả lời (mục 4.1) | COND-16 (giá trị `X-Retry-After`), COND-30, COND-71: MD-05-CI-21 đến MD-05-CI-24, MD-05-CI-29 đến MD-05-CI-32, MD-05-CI-37 đến MD-05-CI-40, MD-05-CI-49 đến MD-05-CI-52 |
| BD-04 | CA-12, RP-04, SI-09, SS-05; `705a1ad`, Security `d6c0541` | Mơ hồ | Nguồn ghi thời hạn "1 giờ", "7 ngày", "tự gia hạn mỗi ngày", "30 ngày" nhưng không nêu tại đúng mốc đó link hoặc phiên còn hiệu lực hay đã hết. Ví dụ: link xác minh mở đúng 3.600 giây sau khi gửi | Product owner, phiên làm việc 2026-11-17 | Đã trả lời (mục 4.1) | COND-19, COND-44, COND-53, COND-62: MD-07-CI-02, MD-07-CI-05, MD-07-CI-08, MD-07-CI-11, MD-07-CI-14 |
| BD-05 | SI-09, SI-10, GO-05, CA-05; `705a1ad`, Security `d6c0541` | Thiếu | Thời hạn phiên chỉ được nêu cho phiên tạo từ form Sign in, theo lựa chọn Keep me signed in. (a) Phiên tạo bởi Continue with Google và bởi link xác minh không có lựa chọn này; nguồn không nêu cookie của chúng có `Max-Age` 7 ngày hay hết khi đóng trình duyệt. (b) Với Keep me signed in tắt, nguồn chỉ nêu cookie không có `Max-Age`; không nêu phiên phía server hết hạn khi nào và có tự gia hạn không. Ví dụ: trình duyệt bật khôi phục phiên giữ cookie 10 ngày, request ở ngày thứ 10 được chấp nhận hay bị từ chối | Product owner, phiên làm việc 2026-11-17 | Đã trả lời (mục 4.1) | COND-20, COND-27, COND-37: MD-02-CI-17, MD-02-CI-19 |
| BD-06 | CA-06, RP-07, RP-04; `705a1ad` | Thiếu | Nguồn nêu màn hình cho link hết hạn và link reset đã dùng, nhưng không nêu: (a) màn hình khi token trong link bị sửa hoặc không hợp lệ; (b) phản hồi khi người dùng bấm lưu trên form Choose a new password đã mở trước đó, sau khi link đã hết hạn hoặc đã được dùng ở tab khác. Password không đổi là kết quả có nguồn (RP-04); thông báo hiển thị thì không | Product owner, phiên làm việc 2026-11-17 | Đã trả lời (mục 4.1) | COND-38, COND-56: phần UI của MD-03-CI-08, MD-03-CI-11 |
| BD-07 | RP-04; `705a1ad` | Thiếu | "Chỉ dùng được một lần" không nêu: (a) link reset cũ còn hiệu lực không khi người dùng yêu cầu link mới; (b) mở link mà chưa lưu password có tính là đã dùng không, tức là mở lại link lần hai có còn tới form Choose a new password | Product owner, phiên làm việc 2026-11-17 | Đã trả lời (mục 4.1) | COND-53: MD-03-CI-06; trạng thái sau MD-03-CI-02 |
| BD-08 | RP-02, RP-05; `705a1ad` | Thiếu | Hai trường trống không có thông báo: Email trống ở Forgot password (RP-02 chỉ nêu email sai định dạng) và New password trống ở Choose a new password (RF-10 chỉ chốt Confirm trống). Theo quy tắc của Create account, New password trống thuộc trường hợp ngắn hơn 8 ký tự ("Use at least 8 characters."), nhưng "Fill in both fields." cũng khớp với câu chữ của RP-05 | Product owner, phiên làm việc 2026-11-17 | Đã trả lời (mục 4.1) | COND-51, COND-54: MD-11-CI-09, MD-11-CI-19 |
| BD-09 | SI-02, CA-02; `705a1ad` | Mơ hồ | (a) Định dạng email hợp lệ chỉ được mô tả qua thông báo "Check for a missing @ or domain". Các dạng khác không có kết quả, ví dụ `an@example` (không có dấu chấm), `an@@example.com`, `an example@example.com`. (b) Full name chỉ có khoảng trắng chưa được nêu là "trống" hay hợp lệ | Product owner, phiên làm việc 2026-11-17 | Đã trả lời (mục 4.1) | COND-12, COND-34: các giá trị email ngoài MD-11-CI-02, MD-11-CI-03; giá trị Full name chỉ có khoảng trắng |
| BD-10 | CM-02, CA-13; `705a1ad` | Mơ hồ | Giới hạn "8 đến 128 ký tự" và "100 ký tự" không nêu đơn vị đếm khi giá trị có ký tự ngoài ASCII: code point, đơn vị UTF-16 hay ký tự hiển thị. Ví dụ: password gồm 64 emoji là 64 code point nhưng 128 đơn vị UTF-16 | Product owner, phiên làm việc 2026-11-17 | Đã trả lời (mục 4.1) | COND-09, COND-45: giá trị biên có ký tự ngoài ASCII; MD-06 hiện chỉ dùng ký tự ASCII |
| BD-11 | CA-14; Security `d6c0541` | Thiếu | Security yêu cầu từ chối "danh sách 3.000 password phổ biến nhất" nhưng không nêu danh sách nào. Test cần một password chắc chắn có trong danh sách và một password chắc chắn không có | Product owner, phiên làm việc 2026-11-17 | Đã trả lời (mục 4.1) | COND-46: dữ liệu test của MD-09-CI-01, MD-09-CI-06 |
| BD-12 | CA-14; Security `d6c0541` | Thiếu | Security nêu hành vi khi API Pwned Passwords "lỗi hoặc không phản hồi", nhưng không nêu sau bao lâu thì coi là không phản hồi | Product owner, phiên làm việc 2026-11-17 | Đã trả lời (mục 4.1) | COND-46: MD-09-CI-05, MD-09-CI-10 |
| BD-13 | GO-03, GO-09; `705a1ad`, Security `d6c0541` | Thiếu | GO-03 nêu kết quả khi email Google trùng với tài khoản email/password. Nguồn không nêu kết quả khi email trùng với tài khoản chỉ đăng nhập bằng Google, liên kết với `sub` khác. Ví dụ: người dùng đổi địa chỉ Gmail sang tài khoản Google khác rồi dùng Continue with Google | Product owner, phiên làm việc 2026-11-17 | Đã trả lời (mục 4.1) | COND-25, COND-31: MD-08-CI-05 |
| BD-14 | RD-06; `705a1ad`, Security `d6c0541` | Thiếu | Tham số `next` trỏ tới chính một trang Auth, ví dụ `/sign-in`, là đường dẫn nội bộ nên được nhận theo RD-06. Nguồn không nêu kết quả: người dùng được chuyển tới trang Auth sau khi đăng nhập, hay `next` bị thay bằng Realtime | Product owner, phiên làm việc 2026-11-17 | Đã trả lời (mục 4.1) | COND-05: MD-18-CI-06 |
| BD-15 | GO-05, SEC-02; Security `d6c0541` | Thiếu | Threat TH-12 (MD-16): trang khác dẫn trình duyệt của nạn nhân tới callback của Google với mã của tài khoản kẻ tấn công, làm nạn nhân đăng nhập vào tài khoản đó. Test basis không có requirement callback phải thuộc đúng request đăng nhập đã bắt đầu ở trình duyệt đó (tham số `state`). OAuth thuộc ASVS V10, không thuộc phần áp dụng của ADR-002 | Product owner, phiên làm việc 2026-11-17 | Đã trả lời (mục 4.1) | Không có test condition; MD-16-CI-12 |
| BD-16 | CA-05, RP-04, SEC-02; `705a1ad`, Security `d6c0541` | Thiếu | Threat TH-18 và TH-27 (MD-16): request Create account hoặc Forgot password có header `Host` hoặc `Origin` của domain khác. Test basis không nêu link trong email phải luôn dùng origin của `BETTER_AUTH_URL`. SEC-02 chỉ nêu request và callback URL được chấp nhận | Product owner, phiên làm việc 2026-11-17 | Đã trả lời (mục 4.1) | Không có test condition; MD-16-CI-18, MD-16-CI-27 |
| BD-17 | SEC-08; Security `d6c0541` | Thiếu | Threat TH-19 (MD-16) và ASVS 3.4.5: `Referrer-Policy` chỉ được yêu cầu trên response của API. Trang web Choose a new password và trang mở link xác minh có token trong URL; test basis không nêu `Referrer-Policy` của các trang web này | Product owner, phiên làm việc 2026-11-17 | Đã trả lời (mục 4.1) | COND-72: phần trang web của MD-14-CI-36; MD-16-CI-19 |

### 4.1. Quyết định

Người quyết định: product owner, ngày 2026-11-17, theo đề xuất của agent. Cột "Nguồn và lý do" ghi giá trị lấy từ đâu; "agent đề xuất" nghĩa là không có nguồn ngoài, chỉ có lý do ghi kèm. Cột cuối ghi điểm khác với test basis hiện có, hoặc với hành vi mặc định của Better Auth 1.7.25 khi đã kiểm trong code của thư viện. Test basis (Authentication, Security) chưa được sửa theo các quyết định này; việc sửa thuộc người giữ requirement ([Design Status](01-design-status.md) mục 4).

| ID | Quyết định | Nguồn và lý do | Khác với test basis hoặc Better Auth 1.7.25 |
| --- | --- | --- | --- |
| BD-01 | Email chưa xác minh và password sai: Auth báo như SI-04 (lỗi không khớp kèm link Reset password). Auth không báo cần xác nhận email và không tạo phiên | Agent đề xuất. Chỉ người biết password mới được biết email chưa xác minh, nên thông báo không cho biết email đã đăng ký (PR-02) | Thêm thứ tự kiểm: password trước, trạng thái xác minh sau. Chưa kiểm hành vi của Better Auth |
| BD-02 | Request gửi email bị chặn (Create account, Resend the link, nút gửi lại link ở Sign in, Send reset link): Auth giữ nguyên bước hiện tại và hiện thông báo lỗi kèm gợi ý đợi rồi thử lại. Auth không chuyển sang Check your email hay "If an account exists for …", và nút Resend the link không đổi thành "Sent again". Câu cụ thể không cố định, như CM-03; nội dung giống nhau cho email đã và chưa đăng ký | Agent đề xuất. Giới hạn tính theo IP, không theo email, nên thông báo chặn không lộ email đã đăng ký. Hiện màn thành công khi không có email nào được gửi làm người dùng chờ một email không tới | CA-03 và RP-03 ("luôn cùng một màn hình") áp dụng giữa email đã và chưa đăng ký, không áp dụng khi request bị chặn |
| BD-03 | (a) Mọi giới hạn trong Security dùng cùng cách tính với Sign in: request bị chặn khi đã có đủ số request được chấp nhận và request mới cách lần được chấp nhận cuối dưới độ dài cửa sổ. Bộ đếm về 0 khi request mới cách lần được chấp nhận cuối từ độ dài cửa sổ trở lên. Request bị chặn không được đếm và không kéo dài thời gian chặn. (b) `X-Retry-After` là số giây còn lại tới khi hết chặn, làm tròn lên. Ví dụ: còn 1,5 giây thì giá trị là `2`. (c) Mỗi endpoint có bộ đếm riêng cho mỗi IP: `/api/auth/sign-in/social` không dùng chung bộ đếm với `/api/auth/sign-in/email` | Hành vi của Better Auth 1.7.25 (`dist/api/rate-limiter/index.mjs`: khóa đếm là IP cộng path; `getRetryAfter` dùng `Math.ceil`). Cùng cách chốt của RF-03 cho SI-06 | Không khác Better Auth. Thêm chi tiết cho SEC-07, GO-08 |
| BD-04 | Tại đúng mốc thời hạn, link và phiên đã hết hiệu lực: link mở đúng 3.600 giây sau khi gửi là link hết hạn; request đúng 7 ngày sau lần gia hạn cuối, hoặc đúng 30 ngày sau khi tạo phiên, bị từ chối. Request cách lần gia hạn cuối từ đúng 1 ngày trở lên thì phiên được gia hạn | Agent đề xuất. "Hiệu lực 1 giờ" được hiểu là khoảng từ 0 tới trước 1 giờ; cách hiểu này chặt hơn về bảo mật. Mốc gia hạn khớp E3 của MD-02 | Better Auth 1.7.25 so sánh `expiresAt < now` cho link reset và phiên, nên tại đúng mốc (tới mili giây) link và phiên vẫn còn hiệu lực; link xác minh (JWT, `jose`) hết hạn tại đúng mốc. Chênh lệch dưới 1 giây; test fail ở mốc này là defect mức Thấp |
| BD-05 | (a) Phiên tạo bởi Continue with Google và bởi link xác minh có thời hạn như Keep me signed in bật: cookie 7 ngày, tự gia hạn mỗi ngày, tối đa 30 ngày. (b) Keep me signed in tắt: phiên phía server hết hạn 1 ngày sau khi tạo và không tự gia hạn; cookie không có `Max-Age` hay `Expires` | Mặc định của Better Auth 1.7.25 (`dist/db/internal-adapter.mjs` `createSession`; `dist/api/routes/session.mjs` không gia hạn phiên `dontRememberMe`). (a): hai luồng không có lựa chọn này, nên dùng giá trị mặc định của Sign in là bật. (b): trình duyệt khôi phục phiên làm việc có thể giữ cookie nhiều ngày; giới hạn phía server ngăn phiên "không ghi nhớ" sống lâu hơn phiên "ghi nhớ" | Thêm thời hạn phía server 1 ngày cho phiên Keep me signed in tắt. Không khác Better Auth |
| BD-06 | (a) Token trong link bị sửa hoặc không hợp lệ: link reset hiện màn link hết hạn hoặc đã dùng (RP-07); link xác minh hiện lỗi và cho gửi lại link như link hết hạn (CA-06). Không tạo phiên, trạng thái tài khoản không đổi. (b) Bấm lưu trên form Choose a new password đã mở, khi link đã hết hạn hoặc đã dùng: password không đổi, Auth hiện màn link hết hạn hoặc đã dùng (RP-07) | Agent đề xuất. Dùng lại màn hình đã có trong test basis; một thông báo chung cho mọi lý do không cho biết token nào từng hợp lệ | Thêm hai trường hợp vào RP-07 và CA-06 |
| BD-07 | (a) Gửi link reset mới không làm link cũ hết hiệu lực; mỗi link còn hạn đều dùng được. Khi password được đặt lại bằng một link, mọi link reset còn hạn khác của tài khoản hết hiệu lực. (b) Mở link mà chưa lưu password không tính là đã dùng: mở lại link còn hạn vẫn tới form Choose a new password | Agent đề xuất. (a): email có thể tới không theo thứ tự gửi, nên link nào cũng dùng được; sau một lần đặt password, không link nào trong hộp thư đặt lại password được nữa. (b): phần mềm quét email có thể mở link trước người dùng | Thêm quy tắc cho RP-04. Chưa kiểm Better Auth có vô hiệu các link còn lại sau khi đặt password không |
| BD-08 | Email trống ở Forgot password: "Enter your email address.", như Sign in. New password trống ở Choose a new password: "Fill in both fields.", như Confirm trống (RF-10) | Agent đề xuất. Dùng thông báo đã có cho cùng điều kiện | Thêm vào RP-02, RP-05 |
| BD-09 | (a) Email hợp lệ có đúng một `@`, phần trước `@` không rỗng, phần domain có ít nhất một dấu chấm nằm giữa hai phần không rỗng, và không có khoảng trắng bên trong. Giá trị sai bất kỳ điều kiện nào hiện "That doesn’t look like an email address. Check for a missing @ or domain." Ví dụ: `an@example`, `an@@example.com`, `an example@example.com`. (b) Full name chỉ gồm khoảng trắng được coi là trống: "Enter your full name." | Agent đề xuất. (a): quy tắc tối thiểu để một địa chỉ gửi được email, và khớp gợi ý "missing @ or domain" của thông báo. (b): tên chỉ có khoảng trắng không hiển thị được | Thêm định nghĩa cho SI-02, CA-02 |
| BD-10 | "Ký tự" trong giới hạn độ dài của password và Full name là Unicode code point. Ví dụ: password gồm 8 emoji `😀` dài 8 ký tự | NIST SP 800-63B, §5.1.1.2: mỗi Unicode code point được tính là một ký tự | `String.length` của JavaScript đếm đơn vị UTF-16, nên 4 emoji có `length` là 8. Chưa kiểm code đếm theo đơn vị nào |
| BD-11 | Danh sách 3.000 password phổ biến là 3.000 dòng đầu của `Passwords/Common-Credentials/10-million-password-list-top-10000.txt` trong SecLists. Developer ghi commit của SecLists khi đưa danh sách vào code. Dữ liệu test: `password` và `12345678` có trong danh sách | Agent đề xuất. Danh sách công khai, có version, xếp theo tần suất | Thêm nguồn cho CA-14 |
| BD-12 | API Pwned Passwords không trả lời trong 3 giây thì coi là không phản hồi | Agent đề xuất, không có số liệu đo. Lý do: giới hạn thời gian chờ thêm của Create account và Reset password khi API không phản hồi | Thêm ngưỡng cho CA-14 |
| BD-13 | Email Google trùng tài khoản chỉ đăng nhập bằng Google, liên kết với `sub` khác: liên kết `sub` mới vào tài khoản đó và đăng nhập, như R3 của MD-08. Liên kết cũ được giữ | Agent đề xuất. Tài khoản đó có email đã xác minh, và Google xác nhận người dùng giữ cùng email; đây là điều kiện của R3. Người giữ hộp thư lấy lại được tài khoản bằng Reset password, nên mức tin cậy không thấp hơn | GO-09 vẫn đúng cho `sub` đã liên kết (R1); quyết định chỉ thêm liên kết |
| BD-14 | `next` trỏ tới một route của Auth (`/sign-in`, `/sign-up`, `/sign-up/verify`, `/forgot-password`, `/reset-password`) bị thay bằng Realtime | Agent đề xuất. Người đã đăng nhập mở Auth bị chuyển tới đích (RD-07), nên đích là trang Auth tạo vòng lặp | Thêm vào RD-06 |
| BD-15 | Callback của Google chỉ tạo phiên khi tham số `state` khớp với request Continue with Google đã bắt đầu ở cùng trình duyệt. Thiếu `state` hoặc `state` không khớp: không tạo phiên, không liên kết tài khoản; Auth hiện lỗi như khi Google báo lỗi (MD-11 tập L) | Agent đề xuất theo RFC 6749 §10.12 (Cross-Site Request Forgery). Requirement mới: COND-83 | Better Auth 1.7.25 có kiểm `state` (`dist/state.mjs`); chưa chạy kiểm |
| BD-16 | Link trong email xác minh, email reset và email báo đã có tài khoản luôn dùng origin của `BETTER_AUTH_URL`, bất kể header `Host`, `X-Forwarded-Host` hay `Origin` của request | Agent đề xuất. Chặn link trỏ tới domain của kẻ tấn công qua header của request. Requirement mới: COND-84 | API cấu hình `baseURL` từ `BETTER_AUTH_URL` (`apps/api/src/configs/auth.ts`); chưa chạy kiểm |
| BD-17 | Trang web có token trong URL, gồm Choose a new password (`/reset-password`), dùng `Referrer-Policy: no-referrer`, qua header HTTP hoặc thẻ `<meta name="referrer" content="no-referrer">` | Agent đề xuất, cùng giá trị với SEC-08; ASVS 3.4.5. Requirement mới: COND-85 | Thêm vào SEC-08 cho trang web |

Ba item không kiểm được trong phạm vi TS-001 có quyết định của product owner ngày 2026-11-17, theo đề xuất của agent:

- ASVS 3.4.1 (`Strict-Transport-Security`): không test trong TS-001. Header đặt ở reverse proxy khi deploy; việc kiểm chuyển cho bước deploy, như SEC-05.
- ASVS 7.4.4, phần nút Sign out trên mọi màn hình workspace: không test trong TS-001. Nút thuộc App header (SC-14); việc kiểm chuyển cho test scope của workspace. Sign out từ một màn hình workspace vẫn được kiểm (COND-58).
- TH-29 (Repudiation): không test. Test basis không yêu cầu log bảo mật, và ASVS V16 Security Logging không thuộc phần áp dụng của ADR-002.

## 5. Tiêu chí đạt

| ID | Tiêu chí | Điều kiện đầu vào | Kết quả |
| --- | --- | --- | --- |
| Q2-01 | Mỗi test condition dẫn tới test basis item có version, hoặc tới baseline item | RC-01 | Đạt: COND-01 đến COND-81 dẫn tới 81 requirement Ready; COND-82 dẫn tới SS-01, SS-03; COND-83 đến COND-85 dẫn tới quyết định của BD-15, BD-16, BD-17 |
| Q2-02 | Ưu tiên của mỗi test condition lấy từ mức rủi ro của test basis item | RC-02 | Đạt |
| Q2-03 | Không test condition nào chứa expected behavior không có trong nguồn; hành vi chưa có nguồn đã được báo ở mục 4 | IN-09 | Đạt: 17 lỗi test basis ở mục 4, đều có quyết định ở mục 4.1 |
| Q2-04 | Mọi baseline item trong mức áp dụng có kết quả đối chiếu; item thiếu trong test basis có dòng ở mục 4 | RC-04 | Đạt: 40 mục ở bảng mục 3, 30 mục Không áp dụng có lý do ở Baseline Comparison; 3.4.5 có BD-17 |
| Q2-05 | Mỗi lỗi test basis có nơi báo, trạng thái và danh sách test condition bị chặn | RC-05 | Đạt |

**Người review / ngày:** Product owner, 2026-11-17

## References

1. <a id="ref-1"></a>[Requirement Readiness](../../01-requirement-analysis/output/01-requirement-readiness.md) — commit `6c7bbd7`, 2026-11-17
2. <a id="ref-2"></a>[Authentication](../../../../../design/prototype/docs/requirements/authentication.md) — commit `705a1ad`, 2026-11-17
3. <a id="ref-3"></a>[Security](../../../../../architecture/23-security.md) — commit `d6c0541`, 2026-11-17
4. <a id="ref-4"></a>[Workspace](../../../../../design/prototype/docs/requirements/workspace.md) — commit `bd0ecff`, 2026-11-16
5. <a id="ref-5"></a>[Crypto Force UI Prototype](../../../../../design/prototype/README.md) — commit `dbbaafe`, 2026-11-16
6. <a id="ref-6"></a>[Architectural Decisions](../../../../../architecture/30-decisions.md) — commit `705a1ad`, 2026-11-17
7. <a id="ref-7"></a>[Test Strategy](../../../../test-strategy.md) — commit `705a1ad`, 2026-11-17
8. <a id="ref-8"></a>[Baseline Comparison](../../01-requirement-analysis/output/02-baseline-comparison.md) — commit `da6b261`, 2026-11-17
9. <a id="ref-9"></a>[ISTQB Certified Tester Foundation Level Syllabus v4.0.1](https://www.istqb.org/wp-content/uploads/2024/11/ISTQB_CTFL_Syllabus_v4.0.1.pdf) — v4.0.1, 2024-09-15
10. <a id="ref-10"></a>[Risk Register](../../02-planning/output/02-risk-register.md) — commit `341584a`, 2026-11-17
11. <a id="ref-11"></a>[Test Approach](../../02-planning/output/03-test-approach.md) — commit `341584a`, 2026-11-17
