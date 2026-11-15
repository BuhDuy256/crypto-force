# Crypto Force: hành vi sản phẩm theo UI

Đọc file này để biết bộ tài liệu gồm những gì và nên mở file nào cho từng nhóm tác vụ.

Crypto Force là công cụ nghiên cứu giao dịch crypto: người dùng mô tả hoặc import strategy, chạy backtest, tìm biến thể tốt hơn bằng Discovery và xem tin tức kèm sentiment. Sản phẩm không kết nối tài khoản sàn và không đặt lệnh thật.

Mỗi file mô tả tác vụ, chuyển màn hình và thay đổi dữ liệu. Các điểm UI chưa xác định được quản lý trong [Open Questions](../../open-questions.md). Nhãn dùng trong tài liệu:

- **Confirmed**: đã được chủ sản phẩm xác nhận.
- **Inferred**: suy ra từ thiết kế, chưa được xác nhận.
- **Proposed**: hành vi đề xuất, chưa được xác nhận.

Nội dung không có nhãn mô tả đúng những gì UI thể hiện.

| File | Nội dung |
| --- | --- |
| [public-pages.md](public-pages.md) | Landing, các điểm vào ứng dụng, trang 404 |
| [authentication.md](authentication.md) | Sign in, Create account, Verify email, Reset password, chuyển tiếp sau đăng nhập |
| [workspace.md](workspace.md) | App header, điều kiện đăng nhập, Search, Notifications, chuyển ngữ cảnh giữa các màn hình, quy tắc dùng chung |
| [realtime.md](realtime.md) | Chart, timeframe, signal source, cập nhật live, trạng thái kết nối, onboarding |
| [strategy-engine.md](strategy-engine.md) | Tạo, sửa và lưu strategy và composite; Strategy library; bản nháp |
| [discovery.md](discovery.md) | Cấu hình Search, vòng đời một phiên Search, leaderboard |
| [backtest.md](backtest.md) | Cấu hình và chạy backtest, Runs, chi tiết run, kết quả và trades |
| [news.md](news.md) | Crawl, feed, chi tiết bài, sentiment, nguồn tin, đưa sentiment vào strategy |
| [settings.md](settings.md) | Profile, bảo mật, tài khoản liên kết, thông báo, dữ liệu, xóa tài khoản |

Thứ tự đọc gợi ý cho người mới: `workspace.md` → `strategy-engine.md` → `backtest.md` → `discovery.md`, sau đó tới các file còn lại khi cần.
