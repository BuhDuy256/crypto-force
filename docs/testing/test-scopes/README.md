# Test Scopes

Đọc file này để biết cách tạo thư mục cho một đối tượng kiểm thử, cách đặt ID, và tìm các test scope hiện có.

Một test scope là một feature hoặc epic có test basis riêng, ví dụ Authentication. Mỗi test scope có một thư mục. Thư mục này chứa các file của [STLC template](../stlc-template/) đã được điền cho đối tượng đó.

## Cấu trúc thư mục

```
test-scopes/
└── TS-001-auth/
    ├── README.md                 ← tạo từ stlc-template/scope-readme.md
    ├── 01-requirement-analysis/  ← copy từ stlc-template khi bắt đầu phase
    │   ├── input/
    │   └── output/
    └── 02-planning/
        └── ...
```

## Quy ước

1. Tên thư mục có dạng `TS-XXX-<slug>`.
   * `XXX` là số có 3 chữ số, tăng dần. ID không đổi và không được dùng lại, kể cả khi test scope bị huỷ.
   * `<slug>` là tên ngắn bằng tiếng Anh, viết kebab-case, ví dụ `auth`, `backtest`, `strategy-search`.
2. Mỗi test scope có một file `README.md`, tạo từ [scope-readme.md](../stlc-template/scope-readme.md). File này nêu đối tượng kiểm thử, test basis, phạm vi và trạng thái của từng phase.
3. Khi bắt đầu một phase, copy cả thư mục phase đó từ `stlc-template/`, giữ nguyên tên thư mục và tên file. Không tạo thư mục cho phase chưa bắt đầu. Phase không áp dụng cho test scope thì ghi lý do trong bảng trạng thái của `README.md`.
4. Khi nhiều test scope dùng chung một test plan, chỉ một test scope có thư mục `02-planning/`. Các test scope khác link tới thư mục đó trong `README.md`.
5. ID trong file (ví dụ `IN-01`, `RC-02`, `MD-01`, `MD-01-CI-03`) chỉ có hiệu lực trong test scope chứa file đó. Khi tham chiếu tới ID của test scope khác, thêm ID của test scope làm prefix, ví dụ `TS-001/MD-01`.
6. Thư mục test scope chỉ chứa tài liệu. Code test nằm trong các workspace theo [Project Structure](../../development/project-structure.md); test log và tool report link tới code test và evidence.

## Phase, template và skill

Agent thực hiện một phase theo skill tương ứng trong `.claude/skills/`. Skill mô tả phương pháp. Template trong `stlc-template/` quy định nội dung và định dạng của kết quả. Khi skill và template khác nhau, áp dụng template.

| Phase | Template | Skill |
| --- | --- | --- |
| 01 Requirement Analysis | [01-requirement-analysis](../stlc-template/01-requirement-analysis/README.md) | `stlc-requirement-analysis` |
| 02 Test Planning | [02-planning](../stlc-template/02-planning/README.md) | `stlc-test-planning` |
| 03 Test Analysis & Design | [03-design](../stlc-template/03-design/README.md) | `stlc-test-design` |
| 04 Test Implementation | [04-implementation](../stlc-template/04-implementation/README.md) | `stlc-test-implementation` |
| 05 Test Execution | [05-execution](../stlc-template/05-execution/README.md) | `stlc-test-execution` |
| 06 Test Summary & Closure | [06-report](../stlc-template/06-report/README.md) | `stlc-test-completion` |

Phase skill gọi tới các skill về technique (`test-technique-*`) và các skill về rủi ro, ước lượng và phân loại defect (`test-risk-analysis`, `test-estimation`, `test-defect-classification`) khi cần.

## Danh sách test scope

| ID | Thư mục | Đối tượng kiểm thử |
| --- | --- | --- |
| TS-001 | [TS-001-auth/](TS-001-auth/README.md) | Authentication: Sign in, Google, Create account và Verify email, Reset password, phiên và Sign out |
