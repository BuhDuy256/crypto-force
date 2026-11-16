# Architectural Decisions

Đọc file này để biết danh sách Architectural Decision Record và lý do chọn từng quyết định.

## ADR-001: Chặn màn hình workspace bằng route middleware ở web

**Status:** Accepted (2026-11-16)

### Bối cảnh

Mọi màn hình workspace chỉ mở được khi có phiên. Khi không có phiên, màn hình hiện lời mời đăng nhập ngay tại URL đó, và đăng nhập xong thì quay lại đúng màn hình [[1, Điều kiện đăng nhập]](#ref-1). Lớp chặn này chỉ phục vụ hiển thị; API vẫn tự kiểm phiên ở từng request [[2]](#ref-2).

Web chạy ở chế độ SPA, nên phiên được kiểm ở trình duyệt bằng `GET /api/auth/get-session`. Loader của từng màn hình không được chạy khi chưa có phiên, vì nó sẽ gọi API và nhận lỗi 401 hàng loạt.

### Quyết định

- Các màn hình workspace nằm dưới một layout route chung. Layout này khai báo `clientMiddleware`, chạy trước mọi loader con.
- Middleware gọi `get-session`:
  - không có phiên thì ném `data(null, { status: 401 })`;
  - không gọi được (mất mạng, API lỗi) thì ném status 503;
  - có phiên thì đưa phiên vào router context để loader dùng lại, không gọi `get-session` lần nữa.
- `ErrorBoundary` của root hiển thị theo status: 401 là màn chặn đăng nhập, 503 là lỗi tải kèm nút thử lại. Layout không có `ErrorBoundary` riêng.
- Khi tab hiện lại (`visibilitychange`), layout chạy lại loader, nên phiên kết thúc ở tab khác sẽ hiện màn chặn ngay tại URL hiện tại.

### Lý do

Middleware chặn được loader con trong cả hai trường hợp: mở thẳng URL và điều hướng trong app. Kiểm phiên trong component (hoặc trong loader của layout) không làm được điều này, vì loader con chạy song song với loader cha.

Màn chặn đặt ở root vì spike trên React Router 8.5.1 cho thấy lỗi từ middleware rơi vào boundary khác nhau. Khi mở thẳng URL, lỗi rơi vào boundary của root. Khi điều hướng trong app, lỗi rơi vào boundary của layout. Xử lý ở root cho cùng một kết quả trong cả hai trường hợp.

### Hệ quả

- Màn hình workspace mới chỉ cần thêm route vào layout; không tự kiểm phiên.
- Màn chặn hiện toàn trang, không có App header. Điều này khớp với yêu cầu, vì khi chưa đăng nhập thì không có gì để hiện trong header.
- Status khác 401 và 503 từ loader con vẫn rơi vào phần hiển thị lỗi chung của root.
- Nếu sau này bật SSR, phải xét lại quyết định này, vì middleware phía server chạy theo cách khác.

## References

1. <a id="ref-1"></a>[Workspace](../design/prototype/docs/requirements/workspace.md)
2. <a id="ref-2"></a>[Security](23-security.md)
