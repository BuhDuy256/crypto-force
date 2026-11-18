# TS-001: Authentication

Đọc file này để biết TS-001 kiểm thử đối tượng nào, dựa trên test basis nào, và từng phase đang ở trạng thái nào.

## Đối tượng kiểm thử

| Mục | Nội dung |
| --- | --- |
| Test object | Luồng Authentication của Crypto Force: Sign in, Continue with Google, Create account và Verify email, Reset password, chuyển tiếp sau khi đăng nhập, vòng đời phiên và Sign out. Code tại commit `b4ca981` |
| Test basis | Authentication [[1]](#ref-1), Security [[2]](#ref-2), Workspace [[3]](#ref-3) phần Điều kiện đăng nhập và Sign out, quy ước lỗi form của prototype [[4]](#ref-4), ADR-002 [[5]](#ref-5) |
| Trong phạm vi | Hành vi chức năng của các luồng trên; các yêu cầu bảo mật của OWASP ASVS 5.0 ở mức đã chọn trong ADR-002; accessibility của các trang Auth |
| Ngoài phạm vi | Chuyển tiếp từ Backtest this idea, vì Strategy Engine chưa được build. UI của App header, menu tài khoản, drawer và các hộp thoại khi Sign out, vì chúng thuộc test scope của workspace. Các ràng buộc chỉ kiểm được khi deploy |
| Test plan | Riêng: `02-planning/` trong thư mục này |
| Code test | `apps/api/test/`, `apps/web/e2e/` |

## Trạng thái phase

| Phase | Thư mục | Trạng thái | Kết luận |
| --- | --- | --- | --- |
| 01 Requirement Analysis | [01-requirement-analysis/](01-requirement-analysis/) | Đạt | [Requirement Readiness](01-requirement-analysis/output/01-requirement-readiness.md) |
| 02 Test Planning | [02-planning/](02-planning/) | Đạt | [Test Plan](02-planning/output/01-test-plan.md) |
| 03 Test Analysis & Design | [03-design/](03-design/) | Đạt | [Test Design Status](03-design/output/01-design-status.md) |
| 04 Test Implementation | [04-implementation/](04-implementation/) | Chờ review | [Implementation Status](04-implementation/output/01-implementation-status.md) |
| 05 Test Execution | `05-execution/` | Chưa bắt đầu | |
| 06 Test Summary & Closure | `06-report/` | Chưa bắt đầu | |

Một phase có trạng thái Đạt khi mọi tiêu chí đạt trong các file output của phase đó đều đạt.

## References

1. <a id="ref-1"></a>[Authentication](../../../design/prototype/docs/requirements/authentication.md) — commit `c23d848`, 2026-11-17
2. <a id="ref-2"></a>[Security](../../../architecture/23-security.md) — commit `c23d848`, 2026-11-17
3. <a id="ref-3"></a>[Workspace](../../../design/prototype/docs/requirements/workspace.md) — commit `bd0ecff`, 2026-11-16
4. <a id="ref-4"></a>[Crypto Force UI Prototype](../../../design/prototype/README.md) — commit `dbbaafe`, 2026-11-16
5. <a id="ref-5"></a>[Architectural Decisions](../../../architecture/30-decisions.md) — commit `705a1ad`, 2026-11-17
