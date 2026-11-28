# Task 9 Report: Draft Observable Use Cases in `docs/UCs/`

Đọc file này để biết kết quả Task 9, quyết định đã chốt và giới hạn kiểm chứng.

## Files changed

- `docs/UCs/strategy-engine.md`: use case Strategy Engine và Library, gồm rule, luồng ngoại lệ và gap analysis.
- `docs/UCs/backtest.md`: use case cấu hình, chạy, hủy và xem Backtest, gồm vòng đời run và quy tắc mô phỏng.
- `docs/UCs/README.md`: thêm hai file vào chỉ mục.
- `docs/open-questions.md`: chuyển các câu hỏi được ủy quyền sang Resolved, kèm tham chiếu tới rule sở hữu quyết định.
- `implementation/README.md`: Task 9 và Phase 1 là Done.
- `implementation/plan/task-09-draft-use-cases.md`: đánh dấu các bước đã thực hiện.
- `implementation/reports/task-09-draft-use-cases.md`: kết quả và kiểm chứng.

## Phê duyệt và phạm vi

Ngày 2026-11-28, product owner duyệt 10 rule Proposed. Product owner cũng giao agent tự chốt câu hỏi còn lại thuộc Task 9.

| Nội dung đã duyệt | Rule |
| --- | --- |
| Lỗi preview | SE-14 |
| Thông báo preview cho trình đọc màn hình | SE-27 |
| Chống lưu lặp | SE-32 |
| Lỗi tải Library | SL-13 |
| Chi phí giao dịch | BT-31 |
| Lỗi tải danh sách Runs | BT-34 |
| Thông báo run cho trình đọc màn hình | BT-46 |
| Chống chạy lặp | BT-47 |
| Không dùng dữ liệu tương lai | BT-48 |
| Khóa nút khi gửi yêu cầu | BT-63 |

Các rule trong bảng nay là Confirmed. Rule suy ra từ prototype vẫn giữ Inferred khi chưa có xác nhận tương ứng.

Agent đã chốt các nhóm câu hỏi OQ-001 đến OQ-011, OQ-021 đến OQ-026, OQ-029, OQ-053 và OQ-088 đến OQ-099. Mỗi quyết định được ủy quyền ghi ngày và lý do. Hai file UC không còn rule Proposed hoặc gap Open.

ID hiện có thuộc ba nhóm: Strategy Engine (SE-01 đến SE-56), Library (SL-01 đến SL-28), Backtest (BT-01 đến BT-100). ID của gap được giữ nguyên. Rule mới nhận số tiếp theo trong nhóm.

Task 9 hoàn tất tài liệu hành vi. Code Phase 1 chưa triển khai các quyết định mới. Các phase sau xử lý timeframe 1d, banner không có trade, giới hạn Library và cảnh báo Sign out khi còn nháp.

## Baseline và khác biệt so với task ban đầu

- Bộ use case độc lập do subagent viết từ mục tiêu và actor, không đọc spec.
- WCAG 2.2 mức A và AA: từng file UC liệt kê tiêu chí trong Gap analysis.

Các gap được đóng bằng rule hoặc chấp nhận kèm lý do. Kết quả này không chứng minh toàn bộ sản phẩm tuân thủ WCAG.

Task ban đầu cấm chốt câu hỏi Phase 2 và không liệt kê `docs/open-questions.md` trong phạm vi sửa. Ủy quyền tiếp theo cho phép giải quyết câu hỏi liên quan và sửa file đó. Các bảng rule mở rộng để ghi quyết định mới. Quy tắc dùng chung tránh lặp nội dung.

## Review

Theo bàn giao của Claude, các lượt review trước sửa lỗi Score và việc nháp có thể lộ sang tài khoản khác.

Lượt review độc lập tiếp nối ngày 2026-11-28 phát hiện ba vấn đề:

- Xử lý gap tại giá mở xung đột với SL-first trong nến. Rule đã xác định xử lý giá mở trước. Chỉ xét SL-first nếu lệnh vẫn mở.
- Khôi phục nháp và cảnh báo Sign out chưa bao gồm Composite builder dù câu hỏi đã đóng hứa hành vi đó. Hai rule đã mở rộng phạm vi.
- Report vẫn ghi Proposed và Open. Report đã cập nhật theo ủy quyền và tài liệu hiện tại.

Reviewer đã kiểm lại ba bản sửa. Lượt kiểm lại tìm thêm mô tả sai trong bảng phê duyệt: lỗi tải danh sách Runs (BT-34). Bảng đã sửa mô tả đó.

## Kiểm chứng

| Lệnh | Exit code | Kết quả |
| --- | --- | --- |
| `node scripts/check-docs.mjs` | 1 | 28 lỗi, đều trong `docs/knowledge/261125-market-data-deep-dive/self-resolve/`. Không có lỗi thuộc file Task 9. |
| `node node_modules/prettier/bin/prettier.cjs --check` với 7 file Task 9 | 0 | Tất cả file đúng định dạng. |
| `uv run python -I` với `ste-lint-vi.py` và report này | 0 | Không có finding. |

Lệnh trên dùng Node.js đã cài. Lệnh chạy cùng script với `pnpm check:docs` trong `package.json`. PATH của phiên Codex không tìm thấy `pnpm`. Sandbox ban đầu cũng chặn thư mục Node.js.

## Giới hạn

- Kiểm tra docs không chứng minh công thức và hành vi đúng trong mọi tình huống.
- Không chạy test app hoặc kiểm tra trình duyệt vì Task 9 chỉ sửa tài liệu.
- Implementation của các phase sau cần kiểm chứng các quyết định đã chốt.
- Thay đổi chưa commit hoặc push.
