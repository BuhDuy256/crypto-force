# CI/CD

Đọc file này để biết quy trình CI/CD của Crypto Force.

## CI

Workflow [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) chạy trên GitHub Actions khi push lên `main` và khi mở hoặc cập nhật pull request. Một lần chạy mới trên cùng branch huỷ lần chạy cũ còn dang dở.

| Bước | Lệnh | Kiểm tra |
| --- | --- | --- |
| Cài dependencies | `pnpm install --frozen-lockfile` | `pnpm-lock.yaml` khớp với các `package.json` |
| Check | `pnpm check` | Typecheck, lint (gồm dependency boundaries và layer rules), test của các check, export chỉ test dùng, convention của tài liệu (`check:docs`), format |
| Build | `pnpm build` | Mọi app build được |

Phiên bản Node.js lấy từ `.nvmrc`, phiên bản pnpm lấy từ trường `packageManager` trong `package.json`, nên CI và môi trường local dùng cùng phiên bản.

CI chạy đúng lệnh `pnpm check` mà developer chạy trước khi commit. Khi thêm một loại kiểm tra mới (ví dụ test), thêm vào script `check` hoặc thêm bước vào workflow, không tạo lệnh chỉ chạy ở một nơi. Loại test nào chạy trên mỗi commit được theo dõi ở [OQ-068](../open-questions.md#oq-068).
