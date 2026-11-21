# Test Models

Đọc file này để biết mỗi test condition Authentication được mô hình hóa bằng technique nào, vì sao chọn technique đó, test model cụ thể, và danh sách coverage item rút ra từ model.

## 1. Danh sách model

Coverage criterion và target lấy từ Test Approach mục 2 [[1]](#ref-1) theo mức rủi ro của test condition. Phần tử của model dẫn tới "BD-xx" lấy kết quả từ quyết định của lỗi test basis đó ở [Test Conditions](02-test-conditions.md) mục 4.1 [[13]](#ref-13).

| Model ID | Technique | Test condition IDs | Lý do chọn | Coverage criterion | Target / nguồn | Số coverage item |
| --- | --- | --- | --- | --- | --- | --- |
| MD-01 | State Transition | COND-16, COND-17, COND-69 | Kết quả của một lần bấm Sign in phụ thuộc số lần đã được chấp nhận và thời điểm của lần cuối, tức là phụ thuộc lịch sử event. PR-01 mức Cao | All transitions | 100% [[1]](#ref-1) | 14 |
| MD-02 | State Transition | COND-19, COND-20, COND-21, COND-55, COND-58, COND-62, COND-65, COND-78 | Một request được chấp nhận hay không phụ thuộc phiên đã tạo thế nào, đã gia hạn khi nào, đã Sign out chưa. PR-03 mức Cao | All transitions | 100% [[1]](#ref-1) | 26 |
| MD-03 | State Transition | COND-53, COND-55, COND-56 | Kết quả của việc mở hoặc dùng link reset phụ thuộc link đã dùng hay đã hết hạn chưa. PR-06 mức Cao | All transitions | 100% [[1]](#ref-1) | 15 |
| MD-04 | State Transition | COND-37, COND-38, COND-44, COND-49, COND-63 | Kết quả của việc mở link xác minh phụ thuộc email đã xác minh chưa, link còn hạn không và trình duyệt đang có phiên của ai. PR-07 mức Cao | All transitions | 100% [[1]](#ref-1) | 11 |
| MD-05 | Boundary Value Analysis | COND-16, COND-30, COND-71 | Giới hạn số lần là số đếm và khoảng thời gian, có thứ tự. PR-01 mức Cao | 3-value BVA | 100% [[1]](#ref-1) | 54 |
| MD-06 | Boundary Value Analysis | COND-09, COND-34, COND-45, COND-54 | Độ dài password và Full name có thứ tự, giới hạn có giá trị trong nguồn. PR-09 mức Cao | 3-value BVA; đơn vị đếm theo BD-10 | 100% [[1]](#ref-1) | 33 |
| MD-07 | Boundary Value Analysis | COND-19, COND-44, COND-53, COND-62 | Thời hạn link và phiên là khoảng thời gian có thứ tự. PR-03, PR-06, PR-07 mức Cao | 3-value BVA | 100% [[1]](#ref-1) | 24 |
| MD-08 | Decision Table | COND-24, COND-25, COND-29, COND-31 | Kết quả của Continue with Google phụ thuộc tổ hợp: `sub` đã liên kết chưa, email đã có tài khoản chưa, tài khoản có password không, email đã xác minh chưa. PR-08 mức Cao | All feasible columns | 100% [[1]](#ref-1) | 5 |
| MD-09 | Decision Table | COND-46 | Password bị từ chối hay không phụ thuộc tổ hợp: có trong danh sách phổ biến không và kết quả của API Pwned Passwords. PR-09 mức Cao | All feasible columns | 100% [[1]](#ref-1) | 10 |
| MD-10 | State Transition | COND-02, COND-03, COND-60, COND-61, COND-64 | Màn chặn hiện hay không phụ thuộc phiên và việc phiên kết thúc khi màn hình đang mở. PR-12 mức Trung bình | Valid transitions | 100% [[1]](#ref-1) | 13 |
| MD-11 | Equivalence Partitioning | COND-06, COND-08, COND-10, COND-11, COND-12, COND-13, COND-17, COND-18, COND-23, COND-26, COND-33, COND-34, COND-38, COND-51, COND-52, COND-54, COND-56 | Mỗi trường form và mỗi tình huống lỗi có nhóm giá trị được xử lý giống nhau, không có thứ tự. PR-10, PR-12 mức Trung bình; COND-23, COND-26 thuộc PR-08 mức Cao, nhưng mỗi tập chỉ có 2 partition nên mỗi partition đều được phủ | Each Choice | 100% [[1]](#ref-1) | 49 |
| MD-12 | Decision Table | COND-14, COND-15, COND-21, COND-22 | Kết quả Sign in phụ thuộc tổ hợp 4 điều kiện của tài khoản và password. Test Approach chọn EP cho PR-02; decision table phủ mọi partition của EP và thêm tổ hợp giữa các điều kiện, nơi có BD-01 | All feasible columns | 100% [[1]](#ref-1), criterion mạnh hơn EP | 6 |
| MD-13 | Scenario / use case | COND-01 đến COND-04, COND-07, COND-15, COND-16, COND-25, COND-27, COND-28, COND-29, COND-32, COND-35 đến COND-42, COND-47, COND-48, COND-50, COND-52, COND-55 đến COND-59, COND-73, COND-82 | Sign in, Create account và Verify email, Reset password, Sign out, Google là luồng nhiều bước có luồng thay thế và luồng ngoại lệ. PR-10, PR-11, PR-12, PR-14 mức Trung bình | Mỗi luồng | 100% [[1]](#ref-1) | 30 |
| MD-14 | Checklist-based | COND-74 đến COND-79, và mọi COND ở Test Conditions mục 3 | ADR-002 bắt buộc ASVS 5.0 ở mức đã chọn; mỗi mục ASVS là một điều kiện kiểm tra độc lập | Mỗi mục áp dụng | 100% mục áp dụng [[1]](#ref-1) | 40 |
| MD-15 | Checklist-based | COND-66, COND-67, COND-68, COND-70, COND-72, COND-73, COND-83, COND-84, COND-85 | Requirement SEC là danh sách thuộc tính cấu hình độc lập nhau: thuộc tính cookie, header, origin, xử lý lỗi gửi email. PR-05 mức Cao | Mỗi mục | 100%; người thiết kế đề xuất theo target của dòng Checklist OWASP ASVS [[1]](#ref-1), vì mỗi requirement SEC dẫn tới một mục ASVS | 28 |
| MD-16 | Threat model STRIDE | COND-05, COND-14, COND-16, COND-25, COND-31, COND-49, COND-53, COND-55, COND-63, COND-66, COND-67, COND-72, COND-78, COND-83, COND-84, COND-85 | Test Approach yêu cầu threat model trên 4 data flow để tìm threat mà checklist không nêu. PR-01 đến PR-08 | Mỗi threat có test case hoặc là rủi ro chấp nhận | 100% [[1]](#ref-1) | 29 |
| MD-17 | Checklist-based | COND-18, COND-43, COND-80, COND-81 | A11Y-01 là danh sách thuộc tính; A11Y-02 là quét tự động có ngưỡng; CA-11 là danh sách phím. PR-13 mức Trung bình | Mỗi mục; 6 màn hình kể cả trạng thái lỗi | 6/6 màn hình, 0 vi phạm `serious` hoặc `critical` [[1]](#ref-1) [[8]](#ref-8) | 33 |
| MD-18 | Equivalence Partitioning | COND-01, COND-05 | Giá trị của tham số `next` chia thành nhóm được xử lý giống nhau: đường dẫn nội bộ được nhận, đích ngoài app bị thay. PR-04 mức Cao | Mỗi partition | 100%; người thiết kế đề xuất: mỗi partition có nguồn riêng nên phủ hết partition là đủ | 7 |

## 2. Chi tiết từng model

### MD-01: Khóa Sign in theo IP

**Technique / coverage criterion:** State Transition; all transitions

**Test condition:** COND-16, COND-17, COND-69

**Model:**

Mọi model của file này dùng một IP cho mọi request, đặt qua `x-forwarded-for` (Test Approach mục 6). "Được chấp nhận" là request được xử lý bình thường: trả kết quả đăng nhập thành công hoặc lỗi đăng nhập, không trả 429. Mọi lần bấm đều được đếm, kể cả lần password đúng [[2, Sign in]](#ref-2) [[3, Giới hạn số lần đăng nhập]](#ref-3). `t` là thời gian từ lần được chấp nhận cuối tới lần bấm mới.

| Trạng thái | Định nghĩa | Nguồn |
| --- | --- | --- |
| L0 | Chưa có lần bấm nào được chấp nhận, hoặc lần cuối đã cách từ 10 giây trở lên | [[3, Giới hạn số lần đăng nhập]](#ref-3) |
| L1, L2, L3 | Có 1, 2, 3 lần được chấp nhận liên tiếp, mỗi lần cách lần trước dưới 10 giây | [[2, Sign in]](#ref-2) |
| LK | Đang khóa | [[2, Sign in]](#ref-2) |

| Event | Định nghĩa |
| --- | --- |
| E1 | Bấm Sign in, `t` < 10 giây |
| E2 | Bấm Sign in, `t` ≥ 10 giây, hoặc chưa có lần nào được chấp nhận |
| E3 | API khởi động lại |

| Trạng thái \ Event | E1 | E2 | E3 |
| --- | --- | --- | --- |
| L0 | N/A: không có lần được chấp nhận trước đó | → L1; chấp nhận | → L0 |
| L1 | → L2; chấp nhận | → L1; chấp nhận, bộ đếm về 0 rồi đếm lần này | → L1; bộ đếm giữ nguyên [[3, Giới hạn số lần đăng nhập]](#ref-3) |
| L2 | → L3; chấp nhận | → L1; chấp nhận | → L2; bộ đếm giữ nguyên |
| L3 | → LK; 429, `X-Retry-After` là số giây còn lại tới 10 giây sau lần được chấp nhận cuối; UI báo đợi rồi thử lại hoặc reset password | → L1; chấp nhận | → L3; bộ đếm giữ nguyên |
| LK | → LK; 429; không kéo dài thời gian khóa; UI vẫn báo khóa, kể cả khi người dùng sửa password (SI-07) | → L1; chấp nhận | → LK; vẫn 429 |

**Coverage items:**

| Coverage item ID | Phần tử của model | Mô tả |
| --- | --- | --- |
| MD-01-CI-01 | L0 –E2→ L1 | Lần bấm đầu tiên được chấp nhận |
| MD-01-CI-02 | L0 –E3→ L0 | Khởi động lại khi chưa có lần bấm nào; lần bấm sau được chấp nhận |
| MD-01-CI-03 | L1 –E1→ L2 | Lần bấm thứ 2 sau dưới 10 giây, với password đúng, được chấp nhận và được đếm |
| MD-01-CI-04 | L1 –E2→ L1 | Lần bấm sau ≥ 10 giây được chấp nhận; bộ đếm về 0 |
| MD-01-CI-05 | L1 –E3→ L1 | Bộ đếm giữ nguyên qua khởi động lại |
| MD-01-CI-06 | L2 –E1→ L3 | Lần thứ 3 được chấp nhận |
| MD-01-CI-07 | L2 –E2→ L1 | Ngừng ≥ 10 giây sau 2 lần; bộ đếm về 0 |
| MD-01-CI-08 | L2 –E3→ L2 | Bộ đếm giữ nguyên qua khởi động lại |
| MD-01-CI-09 | L3 –E1→ LK | Lần thứ 4 sau dưới 10 giây bị khóa; 429 kèm `X-Retry-After` |
| MD-01-CI-10 | L3 –E2→ L1 | Lần thứ 4 sau ≥ 10 giây được chấp nhận |
| MD-01-CI-11 | L3 –E3→ L3 | Sau 3 lần và khởi động lại, lần thứ 4 dưới 10 giây vẫn bị khóa (SEC-04) |
| MD-01-CI-12 | LK –E1→ LK | Bấm trong lúc khóa: vẫn 429, thời điểm mở khóa không đổi; sửa password không ẩn thông báo khóa |
| MD-01-CI-13 | LK –E2→ L1 | Bấm ≥ 10 giây sau lần được chấp nhận cuối: được chấp nhận |
| MD-01-CI-14 | LK –E3→ LK | Khởi động lại trong lúc khóa: vẫn 429 |

### MD-02: Vòng đời phiên

**Technique / coverage criterion:** State Transition; all transitions

**Test condition:** COND-19, COND-20, COND-21, COND-55, COND-58, COND-62, COND-65, COND-78

**Model:**

Model mô tả phiên của một tài khoản trên một trình duyệt. Phiên tạo bởi Continue with Google và bởi link xác minh là phiên ghi nhớ (BD-05(a)).

| Trạng thái | Định nghĩa | Nguồn |
| --- | --- | --- |
| P0 | Trình duyệt không có phiên hợp lệ | [[4, Điều kiện đăng nhập]](#ref-4) |
| P1 | Phiên ghi nhớ: Keep me signed in bật, hoặc phiên tạo bởi Google hay link xác minh; cookie có thời hạn 7 ngày | [[2, Sign in]](#ref-2) [[3, Authentication]](#ref-3); BD-05(a) |
| P2 | Phiên trình duyệt: Keep me signed in tắt, cookie không có `Max-Age` hay `Expires`; phiên phía server hết hạn 1 ngày sau khi tạo, không tự gia hạn | [[2, Sign in]](#ref-2); BD-05(b) |

| Event | Định nghĩa | Nguồn |
| --- | --- | --- |
| E1 | Sign in hợp lệ, Keep me signed in bật | [[2, Sign in]](#ref-2) |
| E2 | Sign in hợp lệ, Keep me signed in tắt | [[2, Sign in]](#ref-2) |
| E3 | Request cần phiên, ≥ 1 ngày từ lần gia hạn cuối, tuổi phiên < 30 ngày | [[3, Authentication]](#ref-3): "tự gia hạn mỗi ngày khi dùng" |
| E4 | Request cần phiên, < 1 ngày từ lần gia hạn cuối | [[3, Authentication]](#ref-3) |
| E5 | Không có request tới hết 7 ngày từ lần gia hạn cuối | [[2, Sign in]](#ref-2) |
| E6 | Tuổi phiên đạt 30 ngày, dù vẫn được dùng đều | [[3, Authentication]](#ref-3) |
| E7 | Sign out, request thành công | [[3, Authentication]](#ref-3) [[4, Sign out]](#ref-4) |
| E8 | Sign out, request lỗi | [[4, Sign out]](#ref-4) |
| E9 | Đặt password mới cho tài khoản, ở trình duyệt bất kỳ | [[2, Reset password]](#ref-2) |
| E10 | Đóng rồi mở lại trình duyệt, không khôi phục phiên làm việc | [[2, Sign in]](#ref-2) |
| E11 | Sign in cùng tài khoản ở trình duyệt khác | [[3, Authentication]](#ref-3): không giới hạn phiên đồng thời |
| E12 | Continue with Google thành công | [[2, Sign in]](#ref-2); BD-05(a) |
| E13 | Mở link xác minh lần đầu, trình duyệt không có phiên (MD-04-CI-01) | [[2, Create account và Verify email]](#ref-2); BD-05(a) |

E1 và E2 khi đã có phiên chỉ xảy ra ở mức API, vì UI chuyển người đã đăng nhập khỏi Auth (RD-07). ASVS 7.2.4 yêu cầu cấp token mới và hủy token đang có [[9]](#ref-9). E12 và E13 chỉ được xét từ P0: nút Continue with Google nằm trên Auth, mà người đã đăng nhập bị chuyển khỏi Auth (RD-07); link xác minh mở khi đã có phiên giữ phiên đang có (MD-04, SS-06, CA-17).

| Trạng thái \ Event | E1 | E2 | E3 | E4 | E5 | E6 | E7 | E8 | E9 | E10 | E11 | E12 | E13 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P0 | → P1 | → P2 | N/A: không có phiên | → P0; API từ chối, web hiện màn chặn | N/A | N/A | N/A: Sign out chỉ có trong menu tài khoản, màn chặn không có App header [[6, ADR-001]](#ref-6) | N/A | N/A: không đổi trạng thái quan sát được | N/A: như E9 | N/A: như E9 | → P1; cookie 7 ngày | → P1; cookie 7 ngày |
| P1 | → P1; token mới, token cũ bị từ chối | → P2; token mới, token cũ bị từ chối | → P1; thời hạn cookie thành 7 ngày từ lúc request | → P1; thời hạn không đổi | → P0; request bị từ chối | → P0; request bị từ chối | → P0; cookie bị xóa, token cũ bị từ chối | → P1; toast báo Sign out chưa thành công | → P0 | → P1; cookie còn | → P1; cả hai phiên đều hợp lệ | N/A | N/A |
| P2 | → P1; token mới, token cũ bị từ chối | → P2; token mới, token cũ bị từ chối | → P0; request bị từ chối, vì phiên đã quá 1 ngày (BD-05(b)) | → P2; request được chấp nhận, thời hạn phía server không đổi (BD-05(b)) | → P0; request bị từ chối | N/A: phiên P2 hết hạn sau 1 ngày, không tới được 30 ngày (BD-05(b)) | → P0 | → P2; toast | → P0 | → P0; cookie mất | → P2; cả hai phiên đều hợp lệ | N/A | N/A |

**Coverage items:**

| Coverage item ID | Phần tử của model | Mô tả |
| --- | --- | --- |
| MD-02-CI-01 | P0 –E1→ P1 | Cookie phiên có `Max-Age` hoặc `Expires` 7 ngày |
| MD-02-CI-02 | P0 –E2→ P2 | Cookie phiên không có `Max-Age` hay `Expires` |
| MD-02-CI-03 | P0 –E4→ P0 | Request cần phiên không có cookie bị từ chối |
| MD-02-CI-04 | P1 –E1→ P1 | Sign in lại ở mức API: token mới, token cũ bị từ chối |
| MD-02-CI-05 | P1 –E2→ P2 | Như CI-04, phiên mới là phiên trình duyệt |
| MD-02-CI-06 | P1 –E3→ P1 | Gia hạn: thời hạn mới là 7 ngày từ lúc request |
| MD-02-CI-07 | P1 –E4→ P1 | Không gia hạn khi chưa đủ 1 ngày |
| MD-02-CI-08 | P1 –E5→ P0 | Phiên hết hạn sau 7 ngày không dùng |
| MD-02-CI-09 | P1 –E6→ P0 | Phiên bị từ chối ở ngày 30 dù gia hạn đều |
| MD-02-CI-10 | P1 –E7→ P0 | Sign out xóa cookie; token cũ bị API từ chối |
| MD-02-CI-11 | P1 –E8→ P1 | Sign out lỗi: phiên còn, có toast |
| MD-02-CI-12 | P1 –E9→ P0 | Đặt password mới ở trình duyệt khác: phiên này bị từ chối |
| MD-02-CI-13 | P1 –E10→ P1 | Mở lại trình duyệt: vẫn đăng nhập |
| MD-02-CI-14 | P1 –E11→ P1 | Đăng nhập ở trình duyệt thứ hai: cả hai phiên dùng được |
| MD-02-CI-15 | P2 –E1→ P1 | Như CI-04, từ phiên trình duyệt |
| MD-02-CI-16 | P2 –E2→ P2 | Như CI-04, giữ phiên trình duyệt |
| MD-02-CI-17 | P2 –E3→ P0 | Request sau 1 ngày bị từ chối; phiên trình duyệt không tự gia hạn (BD-05(b)) |
| MD-02-CI-18 | P2 –E4→ P2 | Request trong ngày đầu được chấp nhận; thời hạn phía server không đổi |
| MD-02-CI-19 | P2 –E5→ P0 | Không có request trong 7 ngày: request sau đó bị từ chối |
| MD-02-CI-20 | Không dùng | Ô P2 –E6 không xảy ra sau BD-05(b); ID không được cấp lại và không tính vào N |
| MD-02-CI-21 | P2 –E7→ P0 | Sign out từ phiên trình duyệt |
| MD-02-CI-22 | P2 –E8→ P2 | Sign out lỗi từ phiên trình duyệt |
| MD-02-CI-23 | P2 –E9→ P0 | Đặt password mới: phiên trình duyệt bị từ chối |
| MD-02-CI-24 | P2 –E10→ P0 | Mở lại trình duyệt không khôi phục phiên: không còn đăng nhập |
| MD-02-CI-25 | P2 –E11→ P2 | Phiên trình duyệt và phiên ở trình duyệt khác cùng dùng được |
| MD-02-CI-26 | P0 –E12→ P1 | Phiên tạo bởi Google: cookie có `Max-Age` hoặc `Expires` 7 ngày |
| MD-02-CI-27 | P0 –E13→ P1 | Phiên tạo bởi link xác minh: cookie có `Max-Age` hoặc `Expires` 7 ngày |

### MD-03: Link reset password

**Technique / coverage criterion:** State Transition; all transitions

**Test condition:** COND-53, COND-55, COND-56

**Model:**

Trạng thái là của một link reset của một tài khoản có password.

| Trạng thái | Định nghĩa | Nguồn |
| --- | --- | --- |
| R0 | Chưa có link | — |
| R1 | Link còn hiệu lực, chưa dùng | [[2, Reset password]](#ref-2) |
| R2 | Link đã dùng, hoặc hết hiệu lực vì password đã được đặt bằng một link reset khác của tài khoản | [[2, Reset password]](#ref-2); BD-07(a) |
| R3 | Link hết hạn (quá 1 giờ) | [[2, Reset password]](#ref-2) [[3, Authentication]](#ref-3) |

| Event | Định nghĩa |
| --- | --- |
| E1 | Gửi reset link cho email của tài khoản |
| E2 | Mở link |
| E3 | Lưu password mới hợp lệ trên form Choose a new password |
| E4 | Lưu password mới không hợp lệ |
| E5 | Hết 1 giờ từ lúc gửi |
| E6 | Gửi reset link mới cho cùng tài khoản |
| E7 | Password của tài khoản được đặt lại bằng một link reset khác |

| Trạng thái \ Event | E1 | E2 | E3 | E4 | E5 | E6 | E7 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| R0 | → R1 | N/A: chưa có link | N/A | N/A | N/A | N/A: giống E1 | N/A |
| R1 | N/A: giống E6 | → R1; form Choose a new password; mở link chưa tính là đã dùng (BD-07(b)) | → R2; "Password updated."; mọi phiên của tài khoản bị đăng xuất | → R1; báo lỗi, password không đổi | → R3 | → R1; link cũ vẫn dùng được (BD-07(a)) | → R2; link này hết hiệu lực (BD-07(a)) |
| R2 | N/A | → R2; màn link hết hạn hoặc đã dùng, có Send a new link và Back to sign in | → R2; password không đổi (RP-04); màn link hết hạn hoặc đã dùng (BD-06(b)) | N/A: lỗi được báo trên form trước khi gửi (RP-05) | N/A: RP-07 hiện cùng một màn cho link hết hạn và đã dùng | → R2; link cũ vẫn bị từ chối | → R2; link vẫn bị từ chối |
| R3 | N/A | → R3; màn link hết hạn hoặc đã dùng | → R3; password không đổi; màn link hết hạn hoặc đã dùng (BD-06(b)) | N/A: như R2 | N/A | → R3; link cũ vẫn bị từ chối | → R3; link vẫn bị từ chối |

**Coverage items:**

| Coverage item ID | Phần tử của model | Mô tả |
| --- | --- | --- |
| MD-03-CI-01 | R0 –E1→ R1 | Email có link reset |
| MD-03-CI-02 | R1 –E2→ R1 | Mở link còn hiệu lực: form Choose a new password; mở lại lần hai vẫn tới form |
| MD-03-CI-03 | R1 –E3→ R2 | Lưu thành công; mọi phiên của tài khoản bị đăng xuất, kể cả phiên trên trình duyệt mở link |
| MD-03-CI-04 | R1 –E4→ R1 | Lưu password không hợp lệ: báo lỗi, link còn dùng được |
| MD-03-CI-05 | R1 –E5→ R3 | Link hết hạn sau 1 giờ |
| MD-03-CI-06 | R1 –E6→ R1 | Sau khi gửi link mới, link cũ vẫn đặt được password |
| MD-03-CI-07 | R2 –E2→ R2 | Mở link đã dùng: màn link hết hạn hoặc đã dùng |
| MD-03-CI-08 | R2 –E3→ R2 | Lưu từ form đã mở ở tab khác sau khi link đã dùng: password không đổi; màn link hết hạn hoặc đã dùng |
| MD-03-CI-09 | R2 –E6→ R2 | Gửi link mới không làm link đã dùng dùng lại được |
| MD-03-CI-10 | R3 –E2→ R3 | Mở link hết hạn: màn link hết hạn hoặc đã dùng |
| MD-03-CI-11 | R3 –E3→ R3 | Lưu từ form mở trước khi hết hạn: password không đổi; màn link hết hạn hoặc đã dùng |
| MD-03-CI-12 | R3 –E6→ R3 | Gửi link mới không làm link hết hạn dùng lại được |
| MD-03-CI-13 | R1 –E7→ R2 | Có hai link còn hạn; đặt password bằng link thứ hai; link thứ nhất mở ra màn link hết hạn hoặc đã dùng |
| MD-03-CI-14 | R2 –E7→ R2 | Link đã dùng vẫn bị từ chối sau khi password được đặt bằng link khác |
| MD-03-CI-15 | R3 –E7→ R3 | Link hết hạn vẫn bị từ chối sau khi password được đặt bằng link khác |

### MD-04: Link xác minh email

**Technique / coverage criterion:** State Transition; all transitions

**Test condition:** COND-37, COND-38, COND-44, COND-49, COND-63

**Model:**

| Trạng thái | Định nghĩa | Nguồn |
| --- | --- | --- |
| V1 | Tài khoản chưa xác minh, link còn hạn | [[2, Create account và Verify email]](#ref-2) |
| V2 | Tài khoản đã xác minh, link còn hạn | [[2, Create account và Verify email]](#ref-2) |
| V3 | Link hết hạn (quá 1 giờ) | [[2, Create account và Verify email]](#ref-2) [[3, Authentication]](#ref-3) |

| Event | Định nghĩa |
| --- | --- |
| E1 | Mở link, trình duyệt không có phiên |
| E2 | Mở link, trình duyệt có phiên của chính tài khoản đó |
| E3 | Mở link, trình duyệt có phiên của tài khoản khác |
| E4 | Hết 1 giờ từ lúc gửi |
| E5 | Email được xác minh qua một link khác hoặc ở trình duyệt khác |

| Trạng thái \ Event | E1 | E2 | E3 | E4 | E5 |
| --- | --- | --- | --- | --- | --- |
| V1 | → V2; tạo phiên, chuyển tới đích (CA-05) | N/A: tài khoản chưa xác minh không đăng nhập được [[3, Authentication]](#ref-3) | → V2; giữ phiên đang có; báo "{email} is verified. You’re still signed in as {email hiện tại}." (SS-06) | → V3 | → V2 |
| V2 | → V2; không tạo phiên, không báo lỗi; mở form Sign in (CA-17) | → V2; chuyển thẳng tới đích (CA-17) | → V2; chuyển thẳng tới đích, giữ phiên đang có (CA-17) | → V3 | N/A: đã xác minh |
| V3 | → V3; báo lỗi, cho gửi lại link (CA-06) | → V3; báo lỗi, cho gửi lại link | → V3; báo lỗi, cho gửi lại link | N/A | N/A |

**Coverage items:**

| Coverage item ID | Phần tử của model | Mô tả |
| --- | --- | --- |
| MD-04-CI-01 | V1 –E1→ V2 | Lần mở đầu tiên: xác minh, tạo phiên, chuyển tới đích |
| MD-04-CI-02 | V1 –E3→ V2 | Đang đăng nhập tài khoản A, mở link của B: B được xác minh, vẫn là A, có thông báo |
| MD-04-CI-03 | V1 –E4→ V3 | Link chưa dùng hết hạn |
| MD-04-CI-04 | V1 –E5→ V2 | Email đã xác minh bằng link khác; link này thành link của email đã xác minh |
| MD-04-CI-05 | V2 –E1→ V2 | Mở lần hai không có phiên: không tạo phiên, form Sign in |
| MD-04-CI-06 | V2 –E2→ V2 | Mở lần hai khi có phiên của chính tài khoản: tới đích |
| MD-04-CI-07 | V2 –E3→ V2 | Mở link của B đã xác minh khi đang là A: tới đích, vẫn là A |
| MD-04-CI-08 | V2 –E4→ V3 | Link của email đã xác minh hết hạn |
| MD-04-CI-09 | V3 –E1→ V3 | Link hết hạn, không có phiên: lỗi và gửi lại link |
| MD-04-CI-10 | V3 –E2→ V3 | Link hết hạn, có phiên của chính tài khoản: lỗi và gửi lại link |
| MD-04-CI-11 | V3 –E3→ V3 | Link hết hạn, có phiên tài khoản khác: lỗi; phiên đang có không đổi |

### MD-05: Giới hạn số lần theo IP

**Technique / coverage criterion:** Boundary Value Analysis; 3-value BVA

**Test condition:** COND-16, COND-30, COND-71

**Model:**

Bước nhỏ nhất của thời gian là 1 giây: người thiết kế đề xuất, vì nguồn ghi giới hạn bằng giây và `X-Retry-After` tính bằng giây. Mỗi cặp partition kề nhau có hai giá trị biên: giá trị lớn nhất của partition dưới và giá trị nhỏ nhất của partition trên. 3-value BVA lấy mỗi giá trị biên và hai giá trị kề, nên mỗi cặp cho 4 giá trị.

| Data element | Partition | Hợp lệ | Giá trị | Nguồn |
| --- | --- | --- | --- | --- |
| Sign in: số lần bấm liên tiếp, mỗi lần cách lần trước < 10 giây | 1–3 | Chấp nhận | 2, 3 | [[3, Giới hạn số lần đăng nhập]](#ref-3) |
| | ≥ 4 | Bị chặn, 429 | 4, 5 | |
| Sign in: `t` của lần thứ 4, sau 3 lần được chấp nhận | < 10 giây | Bị chặn | 8, 9 | [[3, Giới hạn số lần đăng nhập]](#ref-3) |
| | ≥ 10 giây | Chấp nhận, bộ đếm về 0 | 10, 11 | |
| Sign in: `t` của lần bấm khi đang khóa | < 10 giây | Bị chặn, không kéo dài khóa | 8, 9 | [[2, Sign in]](#ref-2) [[3, Giới hạn số lần đăng nhập]](#ref-3) |
| | ≥ 10 giây | Chấp nhận | 10, 11 | |
| `/sign-in/social`: số lần bắt đầu Continue with Google liên tiếp | 1–3; ≥ 4 | Chấp nhận; bị chặn | 2, 3; 4, 5 | [[3, Authentication]](#ref-3): dùng cùng giới hạn với Sign in |
| Gửi lại link xác minh: số request | 1–3; ≥ 4 | Chấp nhận; bị chặn | 2, 3; 4, 5 | [[3, Giới hạn gửi email]](#ref-3) |
| Gửi lại link xác minh: `t` của request thứ 4 | < 60 giây; ≥ 60 giây | Bị chặn; chấp nhận | 58, 59; 60, 61 | [[3, Giới hạn gửi email]](#ref-3); `t` tính từ request được chấp nhận cuối (BD-03(a)) |
| Gửi link reset: số request; thời gian | như dòng gửi lại link xác minh | | 2–5; 58–61 | [[3, Giới hạn gửi email]](#ref-3); BD-03(a) |
| Create account: số request; thời gian | 1–3, ≥ 4; < 10 giây, ≥ 10 giây | | 2–5; 8–11 | [[3, Giới hạn gửi email]](#ref-3); BD-03(a) |
| `/sign-in/social`: thời gian | như Sign in | | 8–11 | [[3, Authentication]](#ref-3) |
| Callback Google: số request; thời gian | 1–100, ≥ 101; < 10 giây, ≥ 10 giây | | 99–102; 8–11 | [[3, Authentication]](#ref-3); BD-03(a) |

Kết quả khi bị chặn ở mức API là 429 kèm `X-Retry-After` bằng số giây còn lại, làm tròn lên (BD-03(b)). Trên UI, request gửi email bị chặn giữ nguyên bước hiện tại và hiện thông báo đợi rồi thử lại (BD-02). Mỗi endpoint có bộ đếm riêng (BD-03(c)).

**Coverage items:**

| Coverage item ID | Phần tử của model | Mô tả |
| --- | --- | --- |
| MD-05-CI-01 đến MD-05-CI-04 | Sign in, số lần | Lần bấm thứ 2, 3 được chấp nhận; thứ 4, 5 bị chặn |
| MD-05-CI-05 đến MD-05-CI-08 | Sign in, `t` của lần thứ 4 | 8 và 9 giây bị chặn; 10 và 11 giây được chấp nhận |
| MD-05-CI-09 đến MD-05-CI-12 | Sign in, bấm khi đang khóa | 8 và 9 giây bị chặn; 10 và 11 giây được chấp nhận |
| MD-05-CI-13 đến MD-05-CI-16 | `/sign-in/social`, số lần | Lần thứ 2, 3 được chấp nhận; thứ 4, 5 bị chặn |
| MD-05-CI-17 đến MD-05-CI-20 | Gửi lại link xác minh, số lần | Request thứ 2, 3 được chấp nhận; thứ 4, 5 bị chặn |
| MD-05-CI-21 đến MD-05-CI-24 | Gửi lại link xác minh, thời gian | 58 và 59 giây bị chặn; 60 và 61 giây được chấp nhận |
| MD-05-CI-25 đến MD-05-CI-28 | Gửi link reset, số lần | Request thứ 2, 3 được chấp nhận; thứ 4, 5 bị chặn |
| MD-05-CI-29 đến MD-05-CI-32 | Gửi link reset, thời gian | 58 và 59 giây bị chặn; 60 và 61 giây được chấp nhận |
| MD-05-CI-33 đến MD-05-CI-36 | Create account, số lần | Request thứ 2, 3 được chấp nhận; thứ 4, 5 bị chặn |
| MD-05-CI-37 đến MD-05-CI-40 | Create account, thời gian | 8 và 9 giây bị chặn; 10 và 11 giây được chấp nhận |
| MD-05-CI-41 đến MD-05-CI-44 | `/sign-in/social`, thời gian | 8 và 9 giây bị chặn; 10 và 11 giây được chấp nhận |
| MD-05-CI-45 đến MD-05-CI-48 | Callback Google, số lần | Request thứ 99, 100 được chấp nhận; thứ 101, 102 bị chặn |
| MD-05-CI-49 đến MD-05-CI-52 | Callback Google, thời gian | 8 và 9 giây bị chặn; 10 và 11 giây được chấp nhận |
| MD-05-CI-53 | Bộ đếm riêng theo endpoint (BD-03(c)) | Sau 3 lần Sign in được chấp nhận trong dưới 10 giây, request `/sign-in/social` từ cùng IP được chấp nhận |
| MD-05-CI-54 | Làm tròn `X-Retry-After` (BD-03(b)) | Request bị chặn 8,5 giây sau lần được chấp nhận cuối có `X-Retry-After: 2` |

### MD-06: Độ dài password và Full name

**Technique / coverage criterion:** Boundary Value Analysis; 3-value BVA

**Test condition:** COND-09, COND-34, COND-45, COND-54

**Model:**

Độ dài đếm theo Unicode code point (BD-10). Giá trị biên của 3-value BVA dùng ký tự ASCII, nên mỗi ký tự là một code point và một đơn vị UTF-16. Một tập giá trị riêng dùng emoji `😀` (một code point, hai đơn vị UTF-16) để kiểm đơn vị đếm: mỗi giá trị cho kết quả khác nhau khi đếm theo code point và khi đếm theo đơn vị UTF-16. Password dùng ký tự không tạo thành password phổ biến hay đã bị lộ, để MD-09 không ảnh hưởng kết quả.

| Data element | Partition | Hợp lệ | Thông báo | Nguồn |
| --- | --- | --- | --- | --- |
| Password ở Create account | 0–7 ký tự | Không | "Use at least 8 characters." | [[2, Create account và Verify email]](#ref-2) |
| | 8–128 ký tự | Có | Không có lỗi độ dài | [[2, Quy tắc dùng chung]](#ref-2) |
| | ≥ 129 ký tự | Không | "Use 128 characters or fewer." | [[2, Create account và Verify email]](#ref-2) |
| New password ở Choose a new password | như Create account | | như Create account | [[2, Reset password]](#ref-2): "theo quy tắc password của Create account" |
| Full name | 0 ký tự | Không | "Enter your full name." | [[2, Create account và Verify email]](#ref-2) |
| | 1–100 ký tự | Có | Không có lỗi | |
| | ≥ 101 ký tự | Không | "Use 100 characters or fewer." | |

Password hợp lệ được lưu và kiểm đúng như người dùng nhập, không bị cắt bớt [[2, Quy tắc dùng chung]](#ref-2). Với giá trị 127 và 128, test case kiểm thêm: Sign in bằng password đó thành công, và Sign in bằng password đó bỏ ký tự cuối thất bại.

**Coverage items:**

| Coverage item ID | Phần tử của model | Mô tả |
| --- | --- | --- |
| MD-06-CI-01 đến MD-06-CI-04 | Password ở Create account, biên 7/8 | 6, 7 ký tự bị từ chối; 8, 9 ký tự được nhận |
| MD-06-CI-05 đến MD-06-CI-08 | Password ở Create account, biên 128/129 | 127, 128 ký tự được nhận; 129, 130 ký tự bị từ chối |
| MD-06-CI-09 đến MD-06-CI-12 | New password, biên 7/8 | 6, 7 bị từ chối; 8, 9 được nhận |
| MD-06-CI-13 đến MD-06-CI-16 | New password, biên 128/129 | 127, 128 được nhận; 129, 130 bị từ chối |
| MD-06-CI-17 đến MD-06-CI-19 | Full name, biên 0/1 | 0 ký tự: "Enter your full name."; 1, 2 ký tự được nhận |
| MD-06-CI-20 đến MD-06-CI-23 | Full name, biên 100/101 | 99, 100 được nhận; 101, 102 bị từ chối |
| MD-06-CI-24 đến MD-06-CI-27 | Password ở Create account, đơn vị đếm (BD-10) | 4 emoji (8 đơn vị UTF-16) bị từ chối với "Use at least 8 characters."; 8 emoji được nhận; 65 emoji (130 đơn vị UTF-16) được nhận; 129 emoji bị từ chối với "Use 128 characters or fewer." |
| MD-06-CI-28 đến MD-06-CI-31 | New password, đơn vị đếm (BD-10) | Như CI-24 đến CI-27 |
| MD-06-CI-32, MD-06-CI-33 | Full name, đơn vị đếm (BD-10) | 51 emoji (102 đơn vị UTF-16) được nhận; 101 emoji bị từ chối với "Use 100 characters or fewer." |

### MD-07: Thời hạn link và phiên

**Technique / coverage criterion:** Boundary Value Analysis; 3-value BVA

**Test condition:** COND-19, COND-44, COND-53, COND-62

**Model:**

Bước nhỏ nhất là 1 giây, theo lý do ở MD-05. Giá trị đúng mốc thuộc partition hết hạn, riêng mốc gia hạn thuộc partition được gia hạn (BD-04). Mỗi mốc có hai giá trị biên: mốc trừ 1 giây và đúng mốc. 3-value BVA cho 4 giá trị: mốc trừ 2 giây, trừ 1 giây, đúng mốc, cộng 1 giây.

| Data element | Partition | Kết quả | Nguồn |
| --- | --- | --- | --- |
| Tuổi link xác minh | < 1 giờ; ≥ 1 giờ | Còn hiệu lực; hết hạn (MD-04 V3) | [[3, Authentication]](#ref-3); BD-04 |
| Tuổi link reset | < 1 giờ; ≥ 1 giờ | Còn hiệu lực; hết hạn (MD-03 R3) | [[2, Reset password]](#ref-2); BD-04 |
| Thời gian từ lần gia hạn cuối, phiên P1 | < 7 ngày; ≥ 7 ngày | Request được chấp nhận; bị từ chối | [[2, Sign in]](#ref-2); BD-04 |
| Thời gian từ lần gia hạn cuối khi có request, phiên P1 | < 1 ngày; ≥ 1 ngày | Không gia hạn; gia hạn 7 ngày | [[3, Authentication]](#ref-3); BD-04 |
| Tuổi phiên từ lúc tạo, có request đều | < 30 ngày; ≥ 30 ngày | Chấp nhận; bị từ chối | [[3, Authentication]](#ref-3); BD-04 |
| Tuổi phiên P2 từ lúc tạo | < 1 ngày; ≥ 1 ngày | Chấp nhận; bị từ chối | BD-05(b), BD-04 |

**Coverage items:**

| Coverage item ID | Phần tử của model | Mô tả |
| --- | --- | --- |
| MD-07-CI-01 | Link xác minh, 3.599 giây | Còn hiệu lực |
| MD-07-CI-02 | Link xác minh, 3.600 giây | Hết hạn |
| MD-07-CI-03 | Link xác minh, 3.601 giây | Hết hạn |
| MD-07-CI-04 | Link reset, 3.599 giây | Còn hiệu lực |
| MD-07-CI-05 | Link reset, 3.600 giây | Hết hạn |
| MD-07-CI-06 | Link reset, 3.601 giây | Hết hạn |
| MD-07-CI-07 | Phiên P1, 7 ngày trừ 1 giây | Chấp nhận |
| MD-07-CI-08 | Phiên P1, đúng 7 ngày | Bị từ chối |
| MD-07-CI-09 | Phiên P1, 7 ngày cộng 1 giây | Bị từ chối |
| MD-07-CI-10 | Gia hạn, 1 ngày trừ 1 giây | Thời hạn không đổi |
| MD-07-CI-11 | Gia hạn, đúng 1 ngày | Thời hạn thành 7 ngày từ lúc request |
| MD-07-CI-12 | Gia hạn, 1 ngày cộng 1 giây | Thời hạn thành 7 ngày từ lúc request |
| MD-07-CI-13 | Tuổi phiên, 30 ngày trừ 1 giây | Chấp nhận |
| MD-07-CI-14 | Tuổi phiên, đúng 30 ngày | Bị từ chối |
| MD-07-CI-15 | Tuổi phiên, 30 ngày cộng 1 giây | Bị từ chối |
| MD-07-CI-16 | Link xác minh, 3.598 giây | Còn hiệu lực |
| MD-07-CI-17 | Link reset, 3.598 giây | Còn hiệu lực |
| MD-07-CI-18 | Phiên P1, 7 ngày trừ 2 giây | Chấp nhận |
| MD-07-CI-19 | Gia hạn, 1 ngày trừ 2 giây | Thời hạn không đổi |
| MD-07-CI-20 | Tuổi phiên, 30 ngày trừ 2 giây | Chấp nhận |
| MD-07-CI-21 | Phiên P2, 1 ngày trừ 2 giây | Chấp nhận |
| MD-07-CI-22 | Phiên P2, 1 ngày trừ 1 giây | Chấp nhận |
| MD-07-CI-23 | Phiên P2, đúng 1 ngày | Bị từ chối |
| MD-07-CI-24 | Phiên P2, 1 ngày cộng 1 giây | Bị từ chối |

### MD-08: Continue with Google theo tài khoản đã có

**Technique / coverage criterion:** Decision Table; all feasible columns

**Test condition:** COND-24, COND-25, COND-29, COND-31

**Model:**

| | R1 | R2 | R3 | R4 | R5 |
| --- | --- | --- | --- | --- | --- |
| C1: `sub` của Google đã liên kết với một tài khoản | T | F | F | F | F |
| C2: email Google đã có tài khoản | – | F | T | T | T |
| C3: tài khoản đó có password | – | N/A | T | T | F |
| C4: email của tài khoản đó đã xác minh | – | N/A | T | F | – |
| A1: đăng nhập vào tài khoản đã liên kết với `sub` | X | | | | |
| A2: tạo tài khoản mới, email đã xác minh, không qua Verify | | X | | | |
| A3: liên kết Google vào tài khoản đó và đăng nhập | | | X | | |
| A4: không đăng nhập; báo email đã đăng ký, gợi ý Sign in bằng password hoặc Reset password | | | | X | |
| A5: chuyển tới đích theo quy tắc chuyển tiếp | X | X | X | | X |
| A6: liên kết `sub` mới vào tài khoản chỉ có Google, giữ liên kết cũ, và đăng nhập | | | | | X |

Nguồn: C1 và A1 [[3, Authentication]](#ref-3) "xác định theo provider và `sub`, không theo email"; C2, C3, C4, A2, A3, A4, A5 [[2, Sign in]](#ref-2) đoạn Continue with Google; A6 theo BD-13.

Gộp và loại cột (16 tổ hợp): R1 gộp 8 tổ hợp có C1 = T, vì `sub` quyết định tài khoản bất kể email. R2 gộp 4 tổ hợp có C2 = F; C3 và C4 là N/A vì không có tài khoản. R5 gộp 2 tổ hợp có C2 = T, C3 = F. R3 và R4 mỗi cột một tổ hợp. Tổng 8 + 4 + 1 + 1 + 2 = 16.

GO-07 là chuỗi R4 → Reset password → R4 → xác nhận email → R3; chuỗi này được phủ ở MD-13-CI-30.

**Coverage items:**

| Coverage item ID | Phần tử của model | Mô tả |
| --- | --- | --- |
| MD-08-CI-01 | R1 | `sub` đã liên kết, email Google khác email của tài khoản: đăng nhập đúng tài khoản đã liên kết |
| MD-08-CI-02 | R2 | Email mới: tạo tài khoản đã xác minh, không qua Verify |
| MD-08-CI-03 | R3 | Tài khoản email/password đã xác minh: liên kết và đăng nhập |
| MD-08-CI-04 | R4 | Tài khoản email/password chưa xác minh: không đăng nhập, không liên kết, báo email đã đăng ký |
| MD-08-CI-05 | R5 | Tài khoản chỉ có Google, `sub` khác: liên kết `sub` mới, giữ liên kết cũ, đăng nhập (BD-13) |

### MD-09: Kiểm password phổ biến và đã bị lộ

**Technique / coverage criterion:** Decision Table; all feasible columns

**Test condition:** COND-46

**Model:**

Bảng chỉ áp dụng cho password có độ dài hợp lệ (MD-06). Bảng được áp dụng riêng cho Create account và cho Choose a new password, vì Security yêu cầu cả hai [[3, Authentication]](#ref-3).

| | R1 | R2 | R3 | R4 | R5 |
| --- | --- | --- | --- | --- | --- |
| C1: password có trong danh sách 3.000 password phổ biến | T | F | F | F | F |
| C2: kết quả API Pwned Passwords | – | Đã lộ | Chưa lộ | Lỗi | Không trả lời trong 3 giây (BD-12) |
| A1: từ chối, báo "This password is too common or has appeared in a data breach. Choose a different one." | X | X | | | |
| A2: chấp nhận password | | | X | X | X |
| A3: ghi log cảnh báo | | | | X | X |

Nguồn: [[2, Create account và Verify email]](#ref-2) cho thông báo; [[3, Authentication]](#ref-3) dòng Password cho C1, C2, A2, A3.

Gộp cột (8 tổ hợp): R1 gộp 4 tổ hợp có C1 = T, vì password trong danh sách bị từ chối bất kể API. Việc có ghi log cảnh báo ở R1 khi API lỗi không có trong nguồn, nên test case của R1 không kiểm log. Dữ liệu test của R1 theo BD-11; ngưỡng của R5 theo BD-12.

**Coverage items:**

| Coverage item ID | Phần tử của model | Mô tả |
| --- | --- | --- |
| MD-09-CI-01 đến MD-09-CI-05 | R1 đến R5 ở Create account | Mỗi coverage item là một cột |
| MD-09-CI-06 đến MD-09-CI-10 | R1 đến R5 ở Choose a new password | Mỗi coverage item là một cột |

### MD-10: Màn chặn workspace

**Technique / coverage criterion:** State Transition; valid transitions

**Test condition:** COND-02, COND-03, COND-60, COND-61, COND-64

**Model:**

| Trạng thái | Định nghĩa | Nguồn |
| --- | --- | --- |
| W0 | Chưa mở màn hình workspace | — |
| W1 | Nội dung màn hình workspace | [[4, Điều kiện đăng nhập]](#ref-4) |
| W2 | Màn chặn "Sign in to open {tên màn hình}", có Sign in to continue và Back to home | [[4, Điều kiện đăng nhập]](#ref-4) |
| W3 | Lỗi tải kèm nút thử lại | [[6, ADR-001]](#ref-6) |
| W4 | Auth, có dòng báo đích đến | [[2, Chuyển tiếp sau khi đăng nhập]](#ref-2) |
| W5 | Landing | [[4, Điều kiện đăng nhập]](#ref-4) |

| Từ | Event [guard] | Tới | Nguồn |
| --- | --- | --- | --- |
| W0 | Mở URL workspace [có phiên] | W1 | [[4, Điều kiện đăng nhập]](#ref-4) |
| W0 | Mở URL workspace [không có phiên] | W2 | [[4, Điều kiện đăng nhập]](#ref-4) |
| W0 | Mở URL workspace [không kiểm được phiên] | W3 | [[6, ADR-001]](#ref-6) |
| W1 | Chuyển màn hình [có phiên] | W1 | [[4, Điều kiện đăng nhập]](#ref-4) |
| W1 | Chuyển màn hình [phiên đã kết thúc] | W2 tại màn hình đang mở | [[4, Điều kiện đăng nhập]](#ref-4) |
| W1 | Tab hiện lại [phiên đã kết thúc] | W2 tại màn hình đang mở | [[4, Điều kiện đăng nhập]](#ref-4) [[6, ADR-001]](#ref-6) |
| W1 | Sign out thành công | W5 | [[4, Sign out]](#ref-4) |
| W2 | Sign in to continue | W4, dòng báo nêu màn hình đó | [[4, Điều kiện đăng nhập]](#ref-4) [[2, Chuyển tiếp sau khi đăng nhập]](#ref-2) |
| W2 | Back to home | W5 | [[4, Điều kiện đăng nhập]](#ref-4) |
| W4 | Đăng nhập thành công | W1 tại đúng màn hình đó | [[4, Điều kiện đăng nhập]](#ref-4) |
| W3 | Thử lại [có phiên] | W1 | [[6, ADR-001]](#ref-6) |
| W3 | Thử lại [không có phiên] | W2 | [[6, ADR-001]](#ref-6) |
| W3 | Thử lại [vẫn không kiểm được phiên] | W3 | [[6, ADR-001]](#ref-6) |

**Coverage items:**

| Coverage item ID | Phần tử của model | Mô tả |
| --- | --- | --- |
| MD-10-CI-01 | W0 → W1 | Có phiên: nội dung hiện |
| MD-10-CI-02 | W0 → W2 | Không phiên: màn chặn ghi tên màn hình |
| MD-10-CI-03 | W0 → W3 | `get-session` lỗi: lỗi tải kèm nút thử lại, không phải màn chặn |
| MD-10-CI-04 | W1 → W1 | Chuyển màn hình khi còn phiên |
| MD-10-CI-05 | W1 → W2, chuyển màn | Phiên kết thúc ở tab khác, chuyển màn: màn chặn tại màn hình mới |
| MD-10-CI-06 | W1 → W2, tab hiện lại | Phiên kết thúc ở tab khác, quay lại tab: màn chặn tại màn hình đang mở |
| MD-10-CI-07 | W1 → W5 | Sign out mở Landing |
| MD-10-CI-08 | W2 → W4 | Auth hiện dòng báo đích |
| MD-10-CI-09 | W2 → W5 | Back to home mở Landing |
| MD-10-CI-10 | W4 → W1 | Đăng nhập xong về đúng màn hình |
| MD-10-CI-11 | W3 → W1 | Thử lại khi API đã hoạt động, có phiên |
| MD-10-CI-12 | W3 → W2 | Thử lại khi API đã hoạt động, không phiên |
| MD-10-CI-13 | W3 → W3 | Thử lại khi API vẫn lỗi |

### MD-11: Trường form và phản hồi của Auth

**Technique / coverage criterion:** Equivalence Partitioning; Each Choice

**Test condition:** COND-06, COND-08, COND-10, COND-11, COND-12, COND-13, COND-17, COND-18, COND-23, COND-26, COND-33, COND-34, COND-38, COND-51, COND-52, COND-54, COND-56

**Model:**

Mỗi dòng có chữ cái riêng là một tập partition. Độ dài password và Full name ở MD-06.

| Tập | Partition | Hợp lệ | Ví dụ giá trị | Kết quả | Nguồn |
| --- | --- | --- | --- | --- | --- |
| A: Email ở Sign in | Trống | Không | `` | "Enter your email address." | [[2, Sign in]](#ref-2) |
| | Thiếu @ | Không | `an.example.com` | "That doesn’t look like an email address. Check for a missing @ or domain." | [[2, Sign in]](#ref-2) |
| | Thiếu domain | Không | `an@` | Như dòng trên | [[2, Sign in]](#ref-2) |
| | Hợp lệ | Có | `an@example.com` | Không có lỗi trường email | |
| B: Email ở Create account | 4 partition như tập A | | | Như tập A | [[2, Create account và Verify email]](#ref-2) |
| C: Email ở Forgot password | Trống | Không | `` | "Enter your email address." | BD-08 |
| | Thiếu @; Thiếu domain | Không | như tập A | Như Sign in | [[2, Reset password]](#ref-2) |
| | Hợp lệ | Có | `an@example.com` | "If an account exists for …" | [[2, Reset password]](#ref-2) |
| D: Dạng nhập của email đã đăng ký `an@example.com` | Có khoảng trắng đầu và cuối | Có | ` an@example.com ` | Cùng tài khoản | [[2, Quy tắc dùng chung]](#ref-2) |
| | Khác chữ hoa chữ thường | Có | `An@Example.com` | Cùng tài khoản | |
| | Có `+tag` | Có | `an+test@example.com` | Tài khoản khác | |
| | Nguyên dạng | Có | `an@example.com` | Cùng tài khoản | |
| E: Password ở Sign in | Trống; có giá trị | Không; có | | "Enter your password."; không có lỗi trường | [[2, Sign in]](#ref-2) |
| A, B, C: Email ở Sign in, Create account, Forgot password | Sai định dạng khác | Không | `an@example`, `an@@example.com`, `an example@example.com` | "That doesn’t look like an email address. Check for a missing @ or domain." | BD-09(a) |
| F: New password | Trống | Không | `` | "Fill in both fields." | BD-08 |
| G: Confirm | Trống; khác New password; khớp | Không; không; có | | "Fill in both fields."; "The two passwords don’t match."; không có lỗi. Lỗi hiện ngay khi gõ | [[2, Reset password]](#ref-2) |
| H: Checkbox xác nhận | Chưa tick; đã tick | Không; có | | "Please confirm to create your account."; không có lỗi | [[2, Create account và Verify email]](#ref-2) |
| I: Sửa password sau thông báo lỗi | Sau lỗi SI-04; đang khóa | | | Thông báo bị ẩn; thông báo khóa vẫn hiện | [[2, Sign in]](#ref-2) |
| J: Nút hiện password | Bật; tắt | | | Hiện ký tự; che ký tự (`type=password`) | [[2, Sign in]](#ref-2) [[9]](#ref-9) 6.2.6 |
| K: Cấu hình Google OAuth | Có; không | | | Nút Continue with Google hiện; không hiện | [[2, Sign in]](#ref-2) |
| L: Luồng Google không hoàn tất | Người dùng hủy ở Google; Google trả lỗi | | | Auth hiện lỗi, giữ form email | [[2, Sign in]](#ref-2) |
| M: Bước gặp lỗi server hoặc mất mạng | Sign in; Create account; Send reset link; lưu password mới; Resend the link | | | Thông báo lỗi chung kèm gợi ý thử lại; câu cụ thể không cố định | [[2, Quy tắc dùng chung]](#ref-2) |
| N: Loại lỗi | Mất mạng; server trả 5xx | | | Như tập M | [[2, Quy tắc dùng chung]](#ref-2) |
| P: Trạng thái khi mở Auth | Chưa đăng nhập; đã đăng nhập, mở Sign in; đã đăng nhập, mở link reset | | | Auth hiện; chuyển thẳng tới đích; form Choose a new password | [[2, Chuyển tiếp sau khi đăng nhập]](#ref-2) |
| Q: Full name theo nội dung | Chỉ khoảng trắng; có ký tự khác khoảng trắng | Không; có | `   `; `An Nguyen` | "Enter your full name."; không có lỗi | BD-09(b) |
| R: Token trong link bị sửa | Link xác minh; link reset | Không | Đổi một ký tự của token | Lỗi và cho gửi lại link (CA-06); màn link hết hạn hoặc đã dùng (RP-07). Không tạo phiên | BD-06(a) |

Partition "Sai định dạng khác" của tập A, B, C gồm mọi giá trị sai quy tắc của BD-09(a) mà không thuộc thiếu @ hay thiếu domain; test case chạy cả ba ví dụ.

**Coverage items:**

| Coverage item ID | Phần tử của model | Mô tả |
| --- | --- | --- |
| MD-11-CI-01 đến MD-11-CI-04 | Tập A | Trống, thiếu @, thiếu domain, hợp lệ |
| MD-11-CI-05 đến MD-11-CI-08 | Tập B | Trống, thiếu @, thiếu domain, hợp lệ |
| MD-11-CI-09 | Tập C, trống | "Enter your email address." (BD-08) |
| MD-11-CI-10 đến MD-11-CI-12 | Tập C | Thiếu @, thiếu domain, hợp lệ |
| MD-11-CI-13 đến MD-11-CI-16 | Tập D | Khoảng trắng, chữ hoa, `+tag`, nguyên dạng |
| MD-11-CI-17, MD-11-CI-18 | Tập E | Trống, có giá trị |
| MD-11-CI-19 | Tập F | "Fill in both fields." (BD-08) |
| MD-11-CI-20 đến MD-11-CI-22 | Tập G | Trống, không khớp, khớp |
| MD-11-CI-23, MD-11-CI-24 | Tập H | Chưa tick, đã tick |
| MD-11-CI-25, MD-11-CI-26 | Tập I | Sau lỗi SI-04, đang khóa |
| MD-11-CI-27, MD-11-CI-28 | Tập J | Bật, tắt |
| MD-11-CI-29, MD-11-CI-30 | Tập K | Có cấu hình, không có cấu hình |
| MD-11-CI-31, MD-11-CI-32 | Tập L | Hủy ở Google, Google trả lỗi |
| MD-11-CI-33 đến MD-11-CI-37 | Tập M | Sign in, Create account, Send reset link, lưu password mới, Resend the link |
| MD-11-CI-38, MD-11-CI-39 | Tập N | Mất mạng, 5xx |
| MD-11-CI-40 đến MD-11-CI-42 | Tập P | Chưa đăng nhập; đã đăng nhập mở Sign in; đã đăng nhập mở link reset |
| MD-11-CI-43 đến MD-11-CI-45 | Tập A, B, C, sai định dạng khác | Sign in, Create account, Forgot password (BD-09(a)) |
| MD-11-CI-46, MD-11-CI-47 | Tập Q | Chỉ khoảng trắng; có ký tự khác khoảng trắng (BD-09(b)) |
| MD-11-CI-48, MD-11-CI-49 | Tập R | Link xác minh; link reset (BD-06(a)) |

### MD-12: Kết quả Sign in theo tài khoản

**Technique / coverage criterion:** Decision Table; all feasible columns

**Test condition:** COND-14, COND-15, COND-21, COND-22

**Model:**

Bảng áp dụng cho request không bị giới hạn số lần (MD-01) và có email, password đúng định dạng (MD-11).

| | R1 | R2 | R3 | R4 | R5 | R6 |
| --- | --- | --- | --- | --- | --- | --- |
| C1: email có tài khoản | F | T | T | T | T | T |
| C2: tài khoản có password | N/A | F | T | T | T | T |
| C3: password đúng | – | – | F | F | T | T |
| C4: email đã xác minh | N/A | – | T | F | F | T |
| A1: báo lỗi không khớp kèm link Reset password; không tạo phiên | X | X | X | X | | |
| A2: báo cần xác nhận email, kèm nút gửi lại link; không tạo phiên | | | | | X | |
| A3: ghi phiên, chuyển tới đích | | | | | | X |

Nguồn: [[2, Sign in]](#ref-2); C2 và R2 theo câu "Tài khoản chỉ đăng nhập bằng Google mà nhập password cũng nhận thông báo này"; R4 theo BD-01.

Gộp và loại cột (16 tổ hợp): R1 gộp 8 tổ hợp có C1 = F; C2 và C4 là N/A vì không có tài khoản. R2 gộp 4 tổ hợp có C1 = T, C2 = F. R3 đến R6 mỗi cột một tổ hợp. Tổng 8 + 4 + 4 = 16.

**Coverage items:**

| Coverage item ID | Phần tử của model | Mô tả |
| --- | --- | --- |
| MD-12-CI-01 | R1 | Email chưa đăng ký |
| MD-12-CI-02 | R2 | Tài khoản chỉ có Google, nhập password (SI-12) |
| MD-12-CI-03 | R3 | Password sai, email đã xác minh |
| MD-12-CI-04 | R4 | Password sai, email chưa xác minh: báo như R3 (BD-01) |
| MD-12-CI-05 | R5 | Password đúng, email chưa xác minh |
| MD-12-CI-06 | R6 | Password đúng, email đã xác minh |

### MD-13: Luồng Auth

**Technique / coverage criterion:** Scenario / use case; mỗi luồng

**Test condition:** xem mục 1

**Model:**

Mỗi coverage item là một luồng: luồng chính, luồng thay thế (vẫn đạt mục tiêu) hoặc luồng ngoại lệ (không đạt mục tiêu). Cột Kết quả kiểm cuối luồng là postcondition quan sát được. Luồng SI là System integration với Google hoặc Resend thật, chạy thủ công (Test Approach mục 1.2).

**Coverage items:**

| Coverage item ID | Loại | Luồng | Postcondition | Nguồn |
| --- | --- | --- | --- | --- |
| MD-13-CI-01 | Chính | Sign in không có đích chờ | Có phiên; mở Realtime | [[2, Chuyển tiếp sau khi đăng nhập]](#ref-2) |
| MD-13-CI-02 | Thay thế | Từ màn chặn của Backtest: Auth hiện dòng báo, Sign in | Mở Backtest; mở lại Auth không còn dòng báo | [[2, Chuyển tiếp sau khi đăng nhập]](#ref-2) [[4, Điều kiện đăng nhập]](#ref-4) |
| MD-13-CI-03 | Thay thế | Nhập email ở Sign in, chuyển sang Create account, sang Sign in, sang Forgot password | Email còn nguyên ở mỗi bước | [[2]](#ref-2) |
| MD-13-CI-04 | Ngoại lệ | Sign in sai password, bấm link Reset password trong thông báo | Không có phiên; Forgot password có email đã nhập | [[2, Sign in]](#ref-2) |
| MD-13-CI-05 | Ngoại lệ | Sign in email chưa xác minh, bấm gửi lại link | Không có phiên; có email xác minh mới | [[2, Sign in]](#ref-2) |
| MD-13-CI-06 | Ngoại lệ | Sign in bị khóa | Không có phiên; thông báo gợi ý đợi hoặc reset password | [[2, Sign in]](#ref-2) |
| MD-13-CI-07 | Chính | Create account, Check your email, mở link trên cùng trình duyệt | Tài khoản đã xác minh; có phiên; mở Realtime | [[2, Create account và Verify email]](#ref-2) |
| MD-13-CI-08 | Thay thế | Create account từ màn chặn của Backtest | Nút I've confirmed ghi tên Backtest; mở link xong về Backtest | [[2, Create account và Verify email]](#ref-2) |
| MD-13-CI-09 | Thay thế | Mở link ở trình duyệt khác, rồi bấm I've confirmed ở trình duyệt đầu | Form Sign in có email điền sẵn | [[2, Create account và Verify email]](#ref-2) |
| MD-13-CI-10 | Thay thế | Mở link ở tab khác cùng trình duyệt, rồi bấm I've confirmed | Mở đích | [[2, Create account và Verify email]](#ref-2) |
| MD-13-CI-11 | Thay thế | Resend the link | Nút thành "Sent again" và bị vô hiệu; link mới xác minh được | [[2, Create account và Verify email]](#ref-2) |
| MD-13-CI-12 | Thay thế | Use a different email | Form Create account | [[2, Create account và Verify email]](#ref-2) |
| MD-13-CI-13 | Thay thế | Create account với email của tài khoản đã xác minh | Check your email như email mới; chủ tài khoản nhận email "đã có tài khoản" có link Sign in và Reset password; không có tài khoản mới | [[2, Create account và Verify email]](#ref-2) |
| MD-13-CI-14 | Thay thế | Create account với email của tài khoản chưa xác minh | Như CI-13; email hướng dẫn Reset password rồi xác nhận email | [[2, Create account và Verify email]](#ref-2) |
| MD-13-CI-15 | Ngoại lệ | Tải lại Check your email | Form Create account | [[2, Create account và Verify email]](#ref-2) |
| MD-13-CI-16 | Ngoại lệ | Create account khi gửi email lỗi | Check your email như khi gửi thành công; log có lỗi gửi | [[3, Giới hạn gửi email]](#ref-3) |
| MD-13-CI-17 | Chính | Forgot password từ Sign in, mở link, đặt password mới, Sign in | "Password updated."; Sign in bằng password mới thành công, password cũ thất bại | [[2, Reset password]](#ref-2) |
| MD-13-CI-18 | Thay thế | Như CI-17, bắt đầu từ màn chặn của Backtest | Sign in sau reset mở Backtest | [[2, Reset password]](#ref-2) |
| MD-13-CI-19 | Thay thế | Mở link reset khi đang đăng nhập cùng tài khoản, đặt password mới | Form hiện; sau khi lưu, phiên trên trình duyệt đó bị đăng xuất | [[2, Reset password]](#ref-2) |
| MD-13-CI-20 | Thay thế | Forgot password với email chưa đăng ký | Cùng thông báo "If an account exists for …"; không có email nào được gửi | [[2, Reset password]](#ref-2) |
| MD-13-CI-21 | Ngoại lệ | Mở link đã dùng, bấm Send a new link | Bước nhập email | [[2, Reset password]](#ref-2) |
| MD-13-CI-22 | Ngoại lệ | Mở link hết hạn, bấm Back to sign in | Form Sign in | [[2, Reset password]](#ref-2) |
| MD-13-CI-23 | Ngoại lệ | Send reset link khi gửi email lỗi | Cùng thông báo như gửi thành công; log có lỗi gửi | [[3, Giới hạn gửi email]](#ref-3) |
| MD-13-CI-24 | Chính | Sign out từ một màn hình workspace, rồi bấm Back | Không có phiên; đích chờ bị xóa; mở Landing; Back hiện màn chặn, không hiện dữ liệu đã tải (COND-82) | [[4, Sign out]](#ref-4) [[4, Điều kiện đăng nhập]](#ref-4) |
| MD-13-CI-25 | Ngoại lệ | Sign out khi request lỗi | Vẫn đăng nhập, ở lại màn hình; toast báo chưa thành công | [[4, Sign out]](#ref-4) |
| MD-13-CI-26 | Chính (SI) | Continue with Google với Google thật | Google hiện màn chọn tài khoản; đăng nhập xong mở đích | [[2, Sign in]](#ref-2) |
| MD-13-CI-27 | Thay thế (SI) | Sign out, rồi Continue with Google lần nữa | Google vẫn hiện màn chọn tài khoản; phiên Google vẫn còn sau Sign out | [[2, Sign in]](#ref-2) [[3, Authentication]](#ref-3) |
| MD-13-CI-28 | Chính (SI) | Create account với Resend thật | Email tới hộp thư của chủ tài khoản Resend; link xác minh được tài khoản | Test Plan SC-17 [[10]](#ref-10) |
| MD-13-CI-29 | Chính (SI) | Forgot password với Resend thật | Email tới hộp thư; link mở form Choose a new password | Test Plan SC-17 [[10]](#ref-10) |
| MD-13-CI-30 | Thay thế | Tài khoản email/password chưa xác minh: Google bị từ chối, Reset password, Google vẫn bị từ chối, xác nhận email, Google | Lần cuối Google được liên kết và đăng nhập | [[2, Sign in]](#ref-2) |

### MD-14: OWASP ASVS 5.0

**Technique / coverage criterion:** Checklist-based; mỗi mục áp dụng

**Test condition:** COND-74 đến COND-79, và COND ở Test Conditions mục 3

**Model:**

Checklist là 40 mục có kết quả Đủ hoặc Một phần ở Baseline Comparison [[7]](#ref-7), ID và mức lấy từ file gốc [[9]](#ref-9) [[11]](#ref-11) [[12]](#ref-12). Mục đã có coverage item ở model khác được phủ bởi coverage item đó; mục không có model khác được kiểm trực tiếp theo cột Cách kiểm.

**Coverage items:**

| Coverage item ID | Mục ASVS / mức | Cách kiểm |
| --- | --- | --- |
| MD-14-CI-01 | 6.1.1; L1 | Review tài liệu: Security mô tả rate limit và lý do giới hạn theo IP. Hành vi: MD-01, MD-05 |
| MD-14-CI-02 | 6.1.3; L2 | Review tài liệu: Security mô tả Sign in và Google; hành vi: MD-05-CI-13 đến MD-05-CI-16 |
| MD-14-CI-03 | 6.2.1; L1 | MD-06-CI-01 đến MD-06-CI-04 |
| MD-14-CI-04 | 6.2.4; L1 | MD-09-CI-01, MD-09-CI-06; danh sách theo BD-11 |
| MD-14-CI-05 | 6.2.5; L1 | Password 8 ký tự chỉ có chữ thường được nhận ở Create account |
| MD-14-CI-06 | 6.2.6; L1 | MD-11-CI-28 |
| MD-14-CI-07 | 6.2.7; L1 | Dán password vào các ô password của Auth thành công; ô password không có `autocomplete="off"` |
| MD-14-CI-08 | 6.2.8; L1 | Password có khoảng trắng đầu, cuối và chữ hoa: Sign in với đúng giá trị thành công; với giá trị bỏ khoảng trắng hoặc đổi chữ hoa thất bại |
| MD-14-CI-09 | 6.2.9; L2 | MD-06-CI-05, MD-06-CI-06 |
| MD-14-CI-10 | 6.2.10; L2 | Review: không có luồng nào yêu cầu đổi password theo thời gian |
| MD-14-CI-11 | 6.2.12; L2 | MD-09-CI-02, MD-09-CI-07 |
| MD-14-CI-12 | 6.3.1; L1 | MD-01 |
| MD-14-CI-13 | 6.3.2; L1 | Database tạo từ migration không có tài khoản nào; Sign in với `root`, `admin`, `sa` thất bại |
| MD-14-CI-14 | 6.3.4; L2 | MD-05-CI-13 đến MD-05-CI-16 |
| MD-14-CI-15 | 6.4.1; L1 | MD-07-CI-01 đến MD-07-CI-06 |
| MD-14-CI-16 | 6.4.2; L1 | Review UI: Sign in, Create account, Forgot password không có gợi ý password hay câu hỏi bí mật |
| MD-14-CI-17 | 6.8.1; L2 | MD-08-CI-01, MD-08-CI-05 |
| MD-14-CI-18 | 7.1.1; L2 | Review tài liệu: Security ghi thời hạn 7 ngày, 30 ngày và không có idle timeout |
| MD-14-CI-19 | 7.1.2; L2 | Review tài liệu: Security ghi không giới hạn phiên đồng thời; hành vi: MD-02-CI-14 |
| MD-14-CI-20 | 7.1.3; L2 | Review tài liệu: Security dòng Google; hành vi: MD-13-CI-27 |
| MD-14-CI-21 | 7.2.1; L1 | MD-02-CI-03 |
| MD-14-CI-22 | 7.2.2; L1 | Hai lần Sign in cùng tài khoản cho hai token khác nhau |
| MD-14-CI-23 | 7.2.3; L1 | Token của mọi phiên tạo trong một lần chạy test là khác nhau; độ dài và bảng ký tự của token cho ít nhất 128 bit (TC-206). Token lấy từ CSPRNG, kiểm bằng review code của dependency vì test không phân biệt được CSPRNG với bộ đếm (TC-209) |
| MD-14-CI-24 | 7.2.4; L1 | MD-02-CI-04, MD-02-CI-05 |
| MD-14-CI-25 | 7.3.2; L2 | MD-02-CI-09, MD-07-CI-13 đến MD-07-CI-15 |
| MD-14-CI-26 | 7.4.1; L1 | MD-02-CI-10 |
| MD-14-CI-27 | 7.4.3; L2 | MD-03-CI-03 |
| MD-14-CI-28 | 7.4.4; L2 | MD-13-CI-24 phủ Sign out từ một màn hình. Nút Sign out trên mọi màn hình thuộc App header (SC-14): không test trong TS-001, chuyển cho test scope của workspace ([Test Conditions](02-test-conditions.md) mục 4.1) |
| MD-14-CI-29 | 7.6.1; L2 | MD-13-CI-27 |
| MD-14-CI-30 | 3.3.1; L1 | MD-15-CI-03 |
| MD-14-CI-31 | 3.3.2; L2 | MD-15-CI-02 |
| MD-14-CI-32 | 3.3.4; L2 | MD-15-CI-01 |
| MD-14-CI-33 | 3.4.1; L1 | Không test trong TS-001: Security đặt `Strict-Transport-Security` ở reverse proxy khi deploy; việc kiểm chuyển cho bước deploy ([Test Conditions](02-test-conditions.md) mục 4.1) |
| MD-14-CI-34 | 3.4.2; L1 | Request từ origin khác tới `/api/auth/*` và route API khác: response không có `Access-Control-Allow-Origin`, hoặc có giá trị cố định là origin của `BETTER_AUTH_URL` |
| MD-14-CI-35 | 3.4.4; L2 | MD-15-CI-12 đến MD-15-CI-14 |
| MD-14-CI-36 | 3.4.5; L2 | MD-15-CI-15 đến MD-15-CI-17 cho API; MD-15-CI-25 cho trang web có token (BD-17) |
| MD-14-CI-37 | 3.4.6; L2 | MD-15-CI-18 đến MD-15-CI-20 |
| MD-14-CI-38 | 3.5.1; L1 | MD-15-CI-04, MD-15-CI-06 |
| MD-14-CI-39 | 3.5.3; L1 | Sign in, Create account, Sign out, gửi link, đặt password mới dùng POST; GET tới các endpoint này không thay đổi trạng thái. Link xác minh dùng GET là rủi ro chấp nhận của ADR-002 |
| MD-14-CI-40 | 3.7.2; L2 | MD-18 |

### MD-15: Cấu hình bảo mật

**Technique / coverage criterion:** Checklist-based; mỗi mục

**Test condition:** COND-66, COND-67, COND-68, COND-70, COND-72, COND-73

**Model:**

Nguồn của mục CI-01 đến CI-24: Security [[3]](#ref-3), dòng ghi trong cột Nguồn. Nguồn của CI-25 đến CI-28: quyết định của lỗi test basis ghi trong cột Nguồn. SEC-04 được phủ ở MD-01 (E3) và SEC-07 ở MD-05.

**Coverage items:**

| Coverage item ID | Mục kiểm tra | Nguồn |
| --- | --- | --- |
| MD-15-CI-01 | Cookie phiên có `HttpOnly` | Cookie session |
| MD-15-CI-02 | Cookie phiên có `SameSite=Lax` | Cookie session |
| MD-15-CI-03 | Cookie phiên có `Secure` khi `NODE_ENV=production` | Cookie session |
| MD-15-CI-04 | Request Sign in có `Origin` khác `BETTER_AUTH_URL` bị từ chối, không tạo phiên | Origin và callback URL |
| MD-15-CI-05 | `callbackURL` ngoài `BETTER_AUTH_URL` bị từ chối | Origin và callback URL |
| MD-15-CI-06 | Origin check vẫn từ chối request của CI-04 khi `NODE_ENV=test` | Origin và callback URL |
| MD-15-CI-07 | Create account với email mới và email đã có trả cùng nội dung và status | Lộ email đã đăng ký |
| MD-15-CI-08 | Gửi link reset với email có và không có tài khoản trả cùng nội dung và status | Lộ email đã đăng ký |
| MD-15-CI-09 | Thiếu `RESEND_API_KEY` và `EMAIL_FROM` ở development: email, kể cả link, được in ra console | Email trong môi trường development |
| MD-15-CI-10 | `NODE_ENV=production` thiếu `RESEND_API_KEY`: API không khởi động | Email trong môi trường development |
| MD-15-CI-11 | `NODE_ENV=production` thiếu `EMAIL_FROM`: API không khởi động | Email trong môi trường development |
| MD-15-CI-12 đến MD-15-CI-14 | `X-Content-Type-Options: nosniff` trên: response của `/api/auth/*`; response 2xx của route API khác; response 404 của API | Header bảo mật |
| MD-15-CI-15 đến MD-15-CI-17 | `Referrer-Policy: no-referrer` trên ba loại response như CI-12 đến CI-14 | Header bảo mật |
| MD-15-CI-18 đến MD-15-CI-20 | CSP `frame-ancestors 'none'` trên ba loại response như CI-12 đến CI-14 | Header bảo mật |
| MD-15-CI-21 | `Cache-Control: no-store` trên response của `/api/auth/*` | Header bảo mật |
| MD-15-CI-22 | Gửi email lỗi khi Create account: response như khi gửi thành công; log có lỗi | Giới hạn gửi email |
| MD-15-CI-23 | Gửi email lỗi khi gửi lại link xác minh: như CI-22 | Giới hạn gửi email |
| MD-15-CI-24 | Gửi email lỗi khi gửi link reset: như CI-22 | Giới hạn gửi email |
| MD-15-CI-25 | Trang `/reset-password?token=…` có `Referrer-Policy: no-referrer` qua header hoặc thẻ `meta` | BD-17 |
| MD-15-CI-26 | Create account với `Host` và `X-Forwarded-Host` là `evil.example`: link trong email xác minh bắt đầu bằng origin của `BETTER_AUTH_URL` | BD-16 |
| MD-15-CI-27 | Forgot password với `Host` và `X-Forwarded-Host` là `evil.example`: link trong email reset bắt đầu bằng origin của `BETTER_AUTH_URL` | BD-16 |
| MD-15-CI-28 | Callback Google thiếu `state`, hoặc có `state` của trình duyệt khác: không tạo phiên, không liên kết tài khoản | BD-15 |

### MD-16: Threat model STRIDE

**Technique / coverage criterion:** Threat model STRIDE; mỗi threat có test case hoặc là rủi ro chấp nhận

**Test condition:** xem mục 1

**Model:**

Tài sản: password, token phiên, token trong link xác minh và link reset, quyền sở hữu tài khoản, việc một email đã đăng ký hay chưa, khả năng đăng nhập của người dùng. Trust boundary: trình duyệt với API; API với Google; API với hộp thư qua Resend.

| Data flow | Đường đi |
| --- | --- |
| F1 Sign in | Trình duyệt → `POST /api/auth/sign-in/email` → bảng `rate_limit`, session → cookie phiên → trình duyệt chuyển tới `next` |
| F2 Callback Google | Trình duyệt → `/api/auth/sign-in/social` → Google → callback của Google → tài khoản, liên kết, session → cookie |
| F3 Reset password | Trình duyệt → gửi link reset → email → trình duyệt mở link → đặt password mới → xóa session |
| F4 Link xác minh | Create account → email → trình duyệt mở link → xác minh tài khoản → session |

Threat có dạng: tài sản; đường tấn công; control hiện có. Cột Coverage dẫn tới coverage item kiểm control đó, hoặc ghi rủi ro chấp nhận và nơi chấp nhận.

**Coverage items:**

| Coverage item ID | Threat | STRIDE | Flow | Tài sản; đường tấn công | Control | Coverage |
| --- | --- | --- | --- | --- | --- | --- |
| MD-16-CI-01 | TH-01 | S | F1 | Password; script thử password liên tục từ một IP | SI-06 | MD-01, MD-05-CI-01 đến MD-05-CI-12 |
| MD-16-CI-02 | TH-02 | S | F1 | Password; thử password từ nhiều IP | Không có | Rủi ro chấp nhận: ADR-002, mục 6.3.1 |
| MD-16-CI-03 | TH-03 | S | F1 | Token phiên; kẻ tấn công đặt sẵn cookie phiên vào trình duyệt nạn nhân trước khi nạn nhân đăng nhập | ASVS-7.2.4 | MD-02-CI-04, MD-02-CI-05 |
| MD-16-CI-04 | TH-04 | I | F1 | Email đã đăng ký; so sánh thông báo của Sign in | SI-04, SI-12, BD-01 | MD-12 |
| MD-16-CI-05 | TH-05 | I | F1 | Token phiên; script trên trang đọc cookie | SEC-01 | MD-15-CI-01 |
| MD-16-CI-06 | TH-06 | T | F1 | Phiên; trang khác gửi form Sign in bằng trình duyệt nạn nhân | SEC-02 | MD-15-CI-04 |
| MD-16-CI-07 | TH-07 | I | F1 | Dữ liệu phiên; cache trung gian lưu response Auth | SEC-08 | MD-15-CI-21 |
| MD-16-CI-08 | TH-08 | D | F1 | Khả năng đăng nhập; request không có IP hợp lệ dùng chung bộ đếm | SEC-05 | Ngoài phạm vi: SC-11, PR-16 |
| MD-16-CI-09 | TH-09 | T | F1 | Người dùng; `next` dẫn ra site khác sau đăng nhập | RD-06 | MD-18 |
| MD-16-CI-10 | TH-10 | S | F2 | Quyền sở hữu tài khoản; tạo trước tài khoản email/password chưa xác minh với email nạn nhân, đợi nạn nhân dùng Google | GO-03 | MD-08-CI-04 |
| MD-16-CI-11 | TH-11 | S | F2 | Quyền sở hữu tài khoản; tài khoản Google khác có cùng email | GO-09, BD-13 | MD-08-CI-01, MD-08-CI-05 |
| MD-16-CI-12 | TH-12 | T | F2 | Phiên; dẫn nạn nhân tới callback với mã của tài khoản kẻ tấn công | BD-15 (COND-83) | MD-15-CI-28 |
| MD-16-CI-13 | TH-13 | T | F2 | Người dùng; `callbackURL` ngoài app | SEC-02 | MD-15-CI-05 |
| MD-16-CI-14 | TH-14 | D | F2 | Khả năng đăng nhập; gửi liên tục tới callback | GO-08 | MD-05-CI-45 đến MD-05-CI-52 |
| MD-16-CI-15 | TH-15 | S | F2 | Quyền sở hữu tài khoản; id_token giả | Không kiểm chữ ký | Rủi ro chấp nhận: ADR-002, mục 6.8.2 |
| MD-16-CI-16 | TH-16 | S | F3 | Quyền sở hữu tài khoản; dùng lại link reset | RP-04 | MD-03-CI-07, MD-03-CI-08 |
| MD-16-CI-17 | TH-17 | S | F3 | Quyền sở hữu tài khoản; dùng link reset quá hạn | RP-04 | MD-03-CI-10, MD-03-CI-11, MD-07-CI-04 đến MD-07-CI-06 |
| MD-16-CI-18 | TH-18 | S | F3 | Token reset; request Forgot password có `Host` của domain khác, link trong email trỏ tới domain đó | BD-16 (COND-84) | MD-15-CI-27 |
| MD-16-CI-19 | TH-19 | I | F3 | Token reset; trang Choose a new password gửi URL có token qua `Referer` | BD-17 (COND-85) | MD-15-CI-25 |
| MD-16-CI-20 | TH-20 | I | F3 | Email đã đăng ký; so sánh response của Forgot password | RP-03, SEC-03, SEC-09 | MD-15-CI-08, MD-15-CI-24, MD-13-CI-20 |
| MD-16-CI-21 | TH-21 | E | F3 | Phiên; kẻ đã chiếm phiên giữ phiên sau khi chủ tài khoản đặt password mới | RP-06 | MD-02-CI-12, MD-02-CI-23 |
| MD-16-CI-22 | TH-22 | D | F3 | Hộp thư; gửi nhiều email reset | SEC-07; giới hạn theo email là SEC-10 | MD-05-CI-25 đến MD-05-CI-28; phần theo email ngoài phạm vi (SC-12) |
| MD-16-CI-23 | TH-23 | S | F4 | Phiên; link xác minh của tài khoản B đổi phiên của trình duyệt đang đăng nhập A | SS-06 | MD-04-CI-02 |
| MD-16-CI-24 | TH-24 | S | F4 | Phiên; mở link xác minh lần hai để có phiên | CA-17 | MD-04-CI-05 |
| MD-16-CI-25 | TH-25 | S | F4 | Phiên; phần mềm quét mở link trước người dùng | Không có | Rủi ro chấp nhận: ADR-002, mục 3.5.3, 7.6.2 |
| MD-16-CI-26 | TH-26 | T | F4 | Tài khoản; sửa token trong link xác minh | BD-06(a) | MD-11-CI-48 |
| MD-16-CI-27 | TH-27 | S | F4 | Token xác minh; request Create account có `Host` của domain khác | BD-16 (COND-84) | MD-15-CI-26 |
| MD-16-CI-28 | TH-28 | I | F4 | Email đã đăng ký; so sánh response của Create account | CA-04, CA-16, SEC-03 | MD-15-CI-07, MD-13-CI-13, MD-13-CI-14 |
| MD-16-CI-29 | TH-29 | R | F1–F4 | Không có bản ghi các lần Sign in, Reset password để truy vết | Không có requirement | Không test: test basis không yêu cầu log bảo mật; ASVS V16 Security Logging không thuộc phần áp dụng của ADR-002. Product owner quyết định ngày 2026-11-17 ([Test Conditions](02-test-conditions.md) mục 4.1) |

### MD-17: Accessibility

**Technique / coverage criterion:** Checklist-based; mỗi mục

**Test condition:** COND-18, COND-43, COND-80, COND-81

**Model:**

A11Y-01 [[5, Pattern dùng chung]](#ref-5) gồm 5 mục: (a) lỗi hiện ngay dưới trường; (b) liên kết bằng `aria-describedby`; (c) đánh dấu `aria-invalid`; (d) bấm submit khi còn lỗi thì focus chuyển tới trường lỗi đầu tiên; (e) form nhiều trường có danh sách lỗi, chọn một lỗi thì focus trường đó. Forgot password chỉ có một trường nên mục (e) không áp dụng. A11Y-02 [[8]](#ref-8): quét bằng axe, không đạt khi có vi phạm `serious` hoặc `critical`.

**Coverage items:**

| Coverage item ID | Mục | Màn hình hoặc phím |
| --- | --- | --- |
| MD-17-CI-01 đến MD-17-CI-05 | A11Y-01 (a)–(e) | Sign in |
| MD-17-CI-06 đến MD-17-CI-10 | A11Y-01 (a)–(e) | Create account |
| MD-17-CI-11 đến MD-17-CI-14 | A11Y-01 (a)–(d) | Forgot password |
| MD-17-CI-15 đến MD-17-CI-19 | A11Y-01 (a)–(e) | Choose a new password |
| MD-17-CI-20 đến MD-17-CI-25 | A11Y-02, trạng thái mặc định | Sign in, Create account, Check your email, Forgot password, Choose a new password, trang link hết hạn |
| MD-17-CI-26 đến MD-17-CI-29 | A11Y-02, trạng thái lỗi | Sign in, Create account, Forgot password, Choose a new password |
| MD-17-CI-30 đến MD-17-CI-33 | CA-11 | Mũi tên phải, mũi tên trái, Home, End trên tab Sign in và Create account |

### MD-18: Tham số `next`

**Technique / coverage criterion:** Equivalence Partitioning; mỗi partition

**Test condition:** COND-01, COND-05

**Model:**

| Partition | Hợp lệ | Ví dụ giá trị | Kết quả sau khi đăng nhập | Nguồn |
| --- | --- | --- | --- | --- |
| Đường dẫn nội bộ | Có | `/backtest` | Mở Backtest | [[2, Chuyển tiếp sau khi đăng nhập]](#ref-2) |
| URL tuyệt đối | Không | `https://evil.example/` | Mở Realtime | [[3, Authentication]](#ref-3) dòng Đích sau đăng nhập |
| Dạng `//host` | Không | `//evil.example` | Mở Realtime | [[3, Authentication]](#ref-3) |
| Dạng bắt đầu bằng `/\` | Không | `/\evil.example` | Mở Realtime | [[2, Chuyển tiếp sau khi đăng nhập]](#ref-2): đích trỏ ra ngoài ứng dụng bị thay bằng Realtime. Trình duyệt hiểu giá trị này là `//evil.example` |
| Scheme khác `http` | Không | `javascript:alert(1)` | Mở Realtime, không chạy script | [[3, Authentication]](#ref-3): URL tuyệt đối |
| Route của Auth | Không | `/sign-in` | Mở Realtime | BD-14 |
| Không có `next` | Có | — | Mở Realtime | [[2, Chuyển tiếp sau khi đăng nhập]](#ref-2) |

**Coverage items:**

| Coverage item ID | Phần tử của model | Mô tả |
| --- | --- | --- |
| MD-18-CI-01 | Đường dẫn nội bộ | `/backtest` |
| MD-18-CI-02 | URL tuyệt đối | `https://evil.example/` |
| MD-18-CI-03 | `//host` | `//evil.example` |
| MD-18-CI-04 | `/\` | `/\evil.example` |
| MD-18-CI-05 | Scheme khác | `javascript:alert(1)` |
| MD-18-CI-06 | Route của Auth | `/sign-in` |
| MD-18-CI-07 | Không có `next` | Realtime |

## 3. Dạng model theo technique

| Technique | Dạng model | Kiểm tra model trước khi dùng |
| --- | --- | --- |
| Equivalence Partitioning | Bảng: data element, partition, hợp lệ / không hợp lệ, định nghĩa giá trị, nguồn | Partition không chồng lấn và không rỗng; có partition không hợp lệ; mọi giá trị của data element thuộc một partition |
| Boundary Value Analysis | Bảng: partition, giá trị biên, giá trị kề theo 2-value hoặc 3-value | Chỉ áp dụng cho partition có thứ tự; biên lấy từ nguồn, không suy từ code |
| Decision Table | Bảng: hàng điều kiện và hành động; cột là rule; điều kiện dùng T, F, –, N/A; hành động dùng X hoặc để trống | Đủ tổ hợp điều kiện; cột bị loại vì không khả thi hoặc được gộp có lý do |
| State Transition | State table: hàng là trạng thái, cột là event (kèm guard); ô trống là transition không hợp lệ | Mọi trạng thái và event trong nguồn đều có mặt; transition không hợp lệ được liệt kê khi dùng all transitions |
| Statement / Branch | Control flow graph hoặc danh sách statement, branch từ công cụ đo | Ghi version của code và phạm vi loại trừ |
| Error guessing | Danh sách lỗi, defect, failure dự đoán, kèm căn cứ: lỗi cũ, lỗi thường gặp | Mỗi mục có căn cứ |
| Checklist-based | Checklist có version; mỗi mục kiểm tra được độc lập và trực tiếp | Mục quá chung hoặc tự động kiểm tra được thì tách ra |
| Scenario / use case | Luồng chính, luồng thay thế, luồng ngoại lệ, mỗi luồng là chuỗi bước | Mọi luồng thay thế và ngoại lệ trong nguồn đều có mặt |
| Performance | Workload model: scenario, load profile, thời lượng, ngưỡng | Ngưỡng có nguồn; load profile dựa trên số liệu hoặc giả định đã ghi rõ |
| Security | Threat model và/hoặc checklist có version | Mỗi threat dẫn tới tài sản và đường tấn công cụ thể; ID mục checklist lấy từ bản gốc |
| Fuzz / property-based | Input grammar hoặc danh sách property | Mỗi property dẫn tới test basis item |

Exploratory testing không có model ở file này; charter nằm ở [Test Cases](04-test-cases.md#3-exploratory-charters).

## 4. Tiêu chí đạt

| ID | Tiêu chí | Điều kiện đầu vào | Kết quả |
| --- | --- | --- | --- |
| Q3-01 | Mỗi model có lý do chọn technique dựa trên đặc điểm của test condition và mức rủi ro | IN-03, IN-04 | Đạt |
| Q3-02 | Mỗi model đã qua các kiểm tra ở mục 3 cho technique tương ứng; model white-box hoặc state transition dùng thông tin test object có version | IN-06, RC-01 | Đạt: state model lấy trạng thái và event từ test basis có version; ô không có nguồn trong test basis dẫn tới BD có quyết định ở Test Conditions mục 4.1 |
| Q3-03 | Mỗi phần tử của model dẫn tới nguồn có version; phần tử không có nguồn đã được báo thành lỗi test basis | IN-09 | Đạt: phần tử không có nguồn dẫn tới BD-01 đến BD-17 |
| Q3-04 | Coverage item được rút theo luật của coverage criterion đã chọn; người khác đếm lại được cùng số lượng | RC-03 | Đạt: luật gộp cột và luật 3-value được ghi trong từng model; tổng 427 coverage item. Phần tử không có nguồn trong test basis lấy kết quả từ quyết định ở Test Conditions mục 4.1. 2 item có quyết định Không test của product owner: MD-14-CI-33, MD-16-CI-29; MD-14-CI-28 chỉ được phủ một phần |
| Q3-05 | Model đã được review bởi người khác tác giả trước khi thiết kế test case | — | Đạt: product owner duyệt 18 model ngày 2026-11-17. Coverage item rút từ quyết định của BD (MD-02-CI-26, MD-02-CI-27, MD-03-CI-13 đến MD-03-CI-15, MD-05-CI-53, MD-05-CI-54, MD-06-CI-24 đến MD-06-CI-33, MD-07-CI-16 đến MD-07-CI-24, MD-11-CI-43 đến MD-11-CI-49, MD-15-CI-25 đến MD-15-CI-28) được review cùng Test Cases |
| Q3-06 | Mọi coverage item ID có dạng `<Model ID>-CI-<số>` | IN-08 | Đạt |

**Người review / ngày:** Product owner, 2026-11-17

## References

1. <a id="ref-1"></a>[Test Approach](../../02-planning/output/03-test-approach.md) — commit `341584a`, 2026-11-17
2. <a id="ref-2"></a>[Authentication](../../../../../UCs/authentication.md) — commit `705a1ad`, khi đó tại `docs/design/prototype/docs/requirements/authentication.md`, 2026-11-17
3. <a id="ref-3"></a>[Security](../../../../../architecture/23-security.md) — commit `d6c0541`, 2026-11-17
4. <a id="ref-4"></a>[Workspace](../../../../../design/prototype/docs/requirements/workspace.md) — commit `bd0ecff`, 2026-11-16
5. <a id="ref-5"></a>[Crypto Force UI Prototype](../../../../../design/prototype/README.md) — commit `dbbaafe`, 2026-11-16
6. <a id="ref-6"></a>[Architectural Decisions](../../../../../architecture/30-decisions.md) — commit `705a1ad`, 2026-11-17
7. <a id="ref-7"></a>[Baseline Comparison](../../01-requirement-analysis/output/02-baseline-comparison.md) — commit `da6b261`, 2026-11-17
8. <a id="ref-8"></a>[Test Strategy](../../../../test-strategy.md) — commit `705a1ad`, 2026-11-17
9. <a id="ref-9"></a>OWASP ASVS 5.0, V6 Authentication. <https://raw.githubusercontent.com/OWASP/ASVS/master/5.0/en/0x15-V6-Authentication.md> — truy cập 2026-11-17
10. <a id="ref-10"></a>[Test Plan](../../02-planning/output/01-test-plan.md) — version 1.1, commit `341584a`, 2026-11-17
11. <a id="ref-11"></a>OWASP ASVS 5.0, V7 Session Management. <https://raw.githubusercontent.com/OWASP/ASVS/master/5.0/en/0x16-V7-Session-Management.md> — truy cập 2026-11-17
12. <a id="ref-12"></a>OWASP ASVS 5.0, V3 Web Frontend Security. <https://raw.githubusercontent.com/OWASP/ASVS/master/5.0/en/0x12-V3-Web-Frontend-Security.md> — truy cập 2026-11-17
13. <a id="ref-13"></a>[Test Conditions](02-test-conditions.md) — 2026-11-17, mục 4.1
