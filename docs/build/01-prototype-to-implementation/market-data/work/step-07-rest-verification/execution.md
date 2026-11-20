# Kết quả kiểm chứng REST và baseline

Đọc file này để biết đầu ra từng Task của Bước 07, bằng chứng đã kiểm tra và phần còn phải thực hiện.

## Task 1: Test basis, interface và harness

Ngày thực hiện: 2026-11-20. Source và test basis nội bộ được đọc tại commit `652f1bfa9e324bd11a086b005ecd6e962d40f9dd`. Phạm vi Task nằm trong kế hoạch Bước 07 [[1]](#ref-1).

Đã tạo test basis, phân loại requirements/gap, bảng chênh lệch mock, sáu điểm kiểm thử, signature đề xuất, invariant, lỗi, thời gian, dependency thay được và cách chạy trong tài liệu kiểm chứng [[2]](#ref-2). Đã đọc nguyên văn sáu SC WCAG và cập nhật kết luận accessibility trong gap analysis [[3]](#ref-3). Chưa viết hoặc sửa code test/production.

### Môi trường đã kiểm tra

Chỉ kiểm tra biến có giá trị, không in hoặc lưu giá trị. Kết quả dưới đây là kiểm tra tĩnh ngày thực hiện, không phải kết quả thử kết nối dịch vụ.

| Kiểm tra | Kết quả |
| --- | --- |
| `.env`: `DATABASE_URL`, `POSTGRES_DB`, `BETTER_AUTH_SECRET` | Có giá trị |
| `.env`: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`, `VITE_API_MOCKING` | Có giá trị; không suy ra giá trị bật/tắt của cờ mock |
| Process của shell: các biến nêu trên | Không có giá trị; runtime có thể nạp `.env` theo entrypoint |
| Runtime Node.js | `C:/dev_env/nvm/v22.23.5/node.exe --version`: `v22.23.5`; PATH ban đầu không tìm thấy `node`/`pnpm`. Đọc/chạy runtime cần quyền ngoài sandbox |
| Package manager | `pnpm --version`: `9.15.9` khi thêm thư mục runtime vào PATH |
| Hành vi email dev từ source | `src/index.ts` truyền cấu hình vào `createMailer`; có cả key và from thì dùng Resend. Không giả định dev chỉ in email [[4]](#ref-4) [[5]](#ref-5) |
| Chặn outbound và DB/E2E từ source | Đã đọc config, global setup, outbound stub, Auth harness và E2E server; chi tiết và giới hạn trong tài liệu kiểm chứng [[2, Harness và cách chạy]](#ref-2) |
| PostgreSQL, Docker, quyền tạo DB, cổng server, browser, OAuth, Resend, Binance | Chưa kiểm tra runtime: Task 1 chỉ khảo sát source và thiết kế kiểm chứng; không khởi động dịch vụ hoặc gọi các dịch vụ này |

### Review và phần chuyển tiếp

Product owner đã duyệt sáu interface ngày 2026-11-20 theo yêu cầu của kế hoạch và skill `tdd`. Interface dùng để thiết kế và viết test ở các Task tiếp theo. Các Task 2–5 chưa triển khai.

Các việc cần cho Bước 08 đã ghi theo điểm kiểm thử: đổi shared contract, dựng provider/service và route có phiên, cập nhật Web và mock, bổ sung harness đi qua API thật. Timeout cụ thể, protocol baseline, fixtures và ma trận kịch bản được xử lý ở các Task sau của Bước 07 [[1]](#ref-1) [[2]](#ref-2).

### Kiểm tra tài liệu

| Kiểm tra | Kết quả |
| --- | --- |
| Prettier cho bảy file Markdown thuộc Task 1 | Đạt; chạy trực tiếp CLI Prettier bằng Node đã cài để có output kiểm chứng |
| `pnpm check:docs` | Đạt: `check-docs: docs OK` |
| `git diff --check` | Đạt |
| `review-change`, reviewer độc lập | Không có finding; đã đối chiếu interface/harness với source. Review này không thay thế product owner review interface |
| Test app, build và baseline | Không chạy: chỉ thay đổi tài liệu; chưa có test REST mới hoặc implementation |

Không chạy `pnpm check`. Không cập nhật Graphify vì không sửa code.

Task 1 được lưu trong commit riêng chứa bảy file tài liệu đã kiểm tra. Xác nhận mã commit bằng lịch sử Git và báo cho product owner trước khi chuyển Task tiếp theo [[1, Commit khi hoàn tất Task]](#ref-1).

## References

1. <a id="ref-1"></a>[Kế hoạch kiểm chứng REST và baseline](plan.md)
2. <a id="ref-2"></a>[Kiểm chứng REST tải lịch sử](../../../../../testing/test-scopes/TS-002-market-data/rest-verification.md)
3. <a id="ref-3"></a>[REST Requirement Gap Analysis](../../../../../testing/test-scopes/TS-002-market-data/rest-requirement-gap-analysis.md)
4. <a id="ref-4"></a>[API bootstrap](../../../../../../apps/api/src/index.ts)
5. <a id="ref-5"></a>[Mailer](../../../../../../apps/api/src/services/mailer.ts)
