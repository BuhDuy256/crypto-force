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

Product owner đã duyệt sáu interface ngày 2026-11-20 theo yêu cầu của kế hoạch và skill `tdd`. Interface dùng để thiết kế và viết test ở các Task tiếp theo. Kết quả Task 2–3 nằm bên dưới. Các Task 4–5 chưa triển khai.

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

## Task 2: Kịch bản và dữ liệu đối chiếu

Ngày thực hiện: 2026-11-20. Phạm vi chỉ là thiết kế kiểm chứng trong tài liệu [[2]](#ref-2). Chưa viết test, fixture code hoặc production. Chưa chạy browser, mutation hoặc baseline.

Đã thiết kế cách chọn level/type/technique, partitions và giá trị biên, fixture có MA/OHLCV literal, mô hình cache/cooldown, decision table phiên/query và threat model REST. Ma trận gắn requirement với precondition, thao tác, expected, test file dự kiến và evidence cần lưu. E2E tách phần DOM, canvas và screen reader. Mutation/fault gắn với kịch bản cụ thể, chỉ thực hiện sau khi test gốc green.

Kiểm tra hiện diện ID trong ma trận tìm đủ 49 rule Confirmed của vòng REST: lấy các dòng Confirmed trong use case, loại rule refresh chỉ từ polling (MK-13), rồi tìm từng ID trong phần ma trận. Đây chỉ là kiểm traceability bằng tên, không chứng minh 49 requirement đã được kiểm hành vi. Đã đọc từng nhóm expected trong quá trình thiết kế.

Các gate trước khi viết assertion tương ứng:

- Mốc bắt đầu TTL và hết hạn đúng biên đang Proposed. Đã gửi lựa chọn tới product owner. Chưa coi đề xuất là quyết định sản phẩm.
- Ưu tiên 401 khi cả phiên và query đều sai đang Proposed. Case đã có expected tối thiểu là từ chối và không gọi provider.
- Chuỗi giá theo số chữ số thập phân chờ metadata có nguồn theo quyết định đã chốt. Không tự đặt tick size trong fixture.
- Hành vi khi provider trả vượt limit và mã lỗi HTTP cho payload upstream không parse được chưa có oracle cụ thể. Phải xác nhận trong lát contract/adapter trước assertion tương ứng. Các nhóm dữ liệu domain sai đã có expected 502.

Các gate này không chặn ghi thiết kế case hoặc expected đã có nguồn. Chúng chặn assertion áp quyết định chưa được duyệt. Workload và protocol baseline vẫn thuộc Task 3. Task 4 tạo test/harness từ thiết kế, không gọi Binance trong regression.

Kiểm tra tài liệu: Prettier qua CLI trực tiếp đạt cho các file Task 2. `pnpm check:docs` trả `check-docs: docs OK`. `git diff --check` đạt. Reviewer độc lập dùng `review-change` không có finding cho thiết kế và cập nhật tiến độ. Không chạy test app, build, `pnpm check` hoặc Graphify vì chỉ sửa Markdown.

Task 2 được lưu bằng commit riêng cùng cập nhật plan, scope README, tracker và changelog. Mã commit được xác nhận trong Git và báo cho product owner sau khi tạo thành công.

## Task 3: Protocol baseline REST

Ngày thực hiện: 2026-11-20. Đã thiết kế protocol trong tài liệu kiểm chứng [[2, Protocol baseline REST]](#ref-2). Protocol phân biệt chỉ số tải lịch sử, chỉ số cập nhật từ polling và chỉ số subscription/phục hồi từ WebSocket. Chưa chạy benchmark, smoke Binance thật hoặc test app. Chưa sửa production, quality attributes hoặc abstract plan.

Protocol giữ thời gian chart đầu tiên/đủ bốn chart/đổi timeframe, latency HTTP, tỷ lệ lỗi, đối chiếu nến đóng và request count/weight riêng. Thiết kế tách rỗng/hit/single-flight, giữ TTL production 5 giây. Replay đi qua adapter thật, có oracle độc lập và ledger upstream. Môi trường, raw samples, lỗi, tài nguyên và command được lưu theo từng lượt khi chạy ở Bước 08.

Workload do agent đề xuất có nguồn, lý do và tác động riêng cho từng giá trị. Product owner đã duyệt ngày 2026-11-20 các giá trị trong bảng workload, micro-batch 100 lượt mỗi state/lần lặp với ba lần lặp và smoke một request lịch sử cùng một summary [[2, Workload đã duyệt]](#ref-2). Product owner đồng ý giữ ngưỡng mở Realtime/đổi timeframe ở Proposed để đo mô tả trước. Quyết định này không chốt ngưỡng thành tiêu chí đạt. Không ghi Passed hoặc capacity đã đạt. Chỉ chạy workload khi có implementation và harness tương ứng.

Task 4 tiếp tục test/harness theo thiết kế chức năng. Công cụ phát tải, instrumentation vẽ chart và script benchmark phải được cụ thể hóa trước khi chạy baseline. Nếu chưa chứng minh canvas đã vẽ, chỉ báo thời gian apply dữ liệu và ghi thời gian hiển thị là Inconclusive.

Kiểm tra tài liệu: Prettier kiểm sáu file Task 3 đạt. `pnpm check:docs` trả `check-docs: docs OK`. `git diff --check` đạt. Review độc lập theo skill `review-change` phát hiện barrier single-flight chưa phân biệt request vào API với caller đã join pending key. Đã sửa điều kiện thả barrier và yêu cầu log chứng minh join. Đây là sửa protocol, chưa phải bằng chứng single-flight đã chạy. Không phát sinh lớp lỗi lặp lại cần thêm rule hoặc Lesson Learned.

Không chạy test app, build, browser, baseline, `pnpm check` hoặc Graphify vì chỉ sửa Markdown. Task 3 được lưu bằng commit riêng gồm protocol và các cập nhật tiến độ. Mã commit được xác nhận trong Git sau khi tạo thành công.

## References

1. <a id="ref-1"></a>[Kế hoạch kiểm chứng REST và baseline](plan.md)
2. <a id="ref-2"></a>[Kiểm chứng REST tải lịch sử](../../../../../testing/test-scopes/TS-002-market-data/rest-verification.md)
3. <a id="ref-3"></a>[REST Requirement Gap Analysis](../../../../../testing/test-scopes/TS-002-market-data/rest-requirement-gap-analysis.md)
4. <a id="ref-4"></a>[API bootstrap](../../../../../../apps/api/src/index.ts)
5. <a id="ref-5"></a>[Mailer](../../../../../../apps/api/src/services/mailer.ts)
