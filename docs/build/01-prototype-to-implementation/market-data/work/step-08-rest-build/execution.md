# Kết quả build REST Market Data

Đọc file này để biết kết quả thực chạy và phần còn lại của Bước 08.

## Task 1: Shared contract và Web

HEAD bắt đầu: `be781f3aa9b5e65ec4ad7cc314bad570175c8195`.

Môi trường đã chạy: Node `22.23.5`, pnpm `9.15.9`, Docker Compose `5.1.4`. Node và pnpm cần quyền chạy ngoài sandbox tại `C:/dev_env/nvm/v22.23.5`. Chưa kiểm kết nối PostgreSQL trong Task 1.

- Red: ba file test shared Market Data có 116 test, 38 pass và 78 fail. Hai file REST mới có 115 test. Test nháp có một test. Các test REST tới assertion. Summary query lỗi tại `safeParse` vì thiếu public export.
- Green: `pnpm --filter @crypto-force/shared test` pass 149/149 test toàn package, gồm 116 test Market Data. Không gộp 33 test còn lại vào kết quả Market Data.
- `pnpm --filter @crypto-force/web test` pass 10/10 test. Có thêm một test cho 519 nến: chỉ vẽ 500 nến và MA đầu dùng đủ 20 close.
- Mutation strict query: thay `strictObject` bằng `object` làm 6/115 test fail tại assertion. Mutation căn mốc UTC: bỏ kiểm alignment làm 7/108 test fail tại assertion. Đã khôi phục code và shared pass 149/149.
- Mutation warm-up: bỏ cắt nến warm-up làm test mới fail, 1 fail và 9 pass. Đã khôi phục code và Web pass 10/10.
- Typecheck shared và Web đạt. `pnpm check:exports` đạt. Typecheck API còn 8 lỗi import module provider/cache/service chưa có, thuộc Task 2–4.
- Mock E2E MSW: 1/1 pass. Spec UI: 9/9 pass, chạy riêng file với `--workers=1`.
- Lượt E2E trước có lỗi do fixture cũ, định dạng giá cũ, và lỗi encoding/locator khi chuyển test. Các lỗi này đã được sửa. Không dùng các lượt bị dừng làm kết quả cuối.

### Thay đổi testware

Nguồn: contract trong `docs/architecture/10-market-data.md`, ADR-004 và quyết định định dạng giá trong Bước 07.

| File | Loại | Thay đổi |
| --- | --- | --- |
| `packages/shared/src/schemas/market-data.schema.test.ts` | T1 | Chuyển snapshot sang metadata mới. Giữ case giá và thứ tự. Bỏ case MA trong response vì ADR-004 giao Web tính MA. |
| `apps/web/app/utils/market-chart.test.ts` | T1 và thêm test | Một nến không đủ MA20. Thêm case warm-up với expected tính tay: 1..20 có mean 10.5, 500..519 có mean 509.5. |
| `apps/web/mocks/market-data.test.ts` | T1 | Giữ các mean tính tay và kiểm qua mapper Web. Bổ sung timeframe 1d. |
| `apps/web/e2e/market-data/realtime.spec.ts` | T1 | Payload không có MA, có metadata. End chọn 1d theo MK-30. MA hiển thị đủ hai chữ số. Giữ các assertion flow. |
| `apps/web/e2e/market-data/msw-smoke.spec.ts` | T1 | Kiểm metadata thay MA trong HTTP response. Vẫn kiểm MA hiển thị trên UI. |

`as UTCTimestamp` mới trong mapper đổi milliseconds đã kiểm ở contract sang kiểu seconds có brand của Lightweight Charts. Giá trị không bị làm tròn trong mapper.

Vitest không đặt `allowOnly` trong config shared. Source Vitest 5.1.0 mặc định `allowOnly: !isCI`. Config Playwright Market Data chưa đặt `forbidOnly`. Source Playwright 1.65.1 tại `lib/common/index.js` mặc định `forbidOnly: false`. Chưa thay config trong Task 1.

Graphify đã chạy query và affected cho ba schema trước khi sửa. Lượt update trong sandbox bị chặn đọc git ignore toàn cục. Đã chạy lại với quyền ngoài sandbox.

## Phần còn lại

Review độc lập không thấy lỗi production. Finding về evidence test fixture đã xử lý: mutant chia MA cho 19 thay 20 làm test fixture và warm-up fail. Khôi phục code, Web pass 10/10. Task 1 đã hoàn tất đầu ra và kiểm chứng. Task 2–10 chưa thực hiện. Ba quyết định vận hành của Task 6 đang chờ product owner duyệt. Không đánh dấu Bước 08 hoàn thành.