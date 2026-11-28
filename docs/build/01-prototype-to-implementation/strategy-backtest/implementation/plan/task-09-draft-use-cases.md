# Task 9: Draft Observable Use Cases in `docs/UCs/`

Read this file to learn Task 9 steps, which draft Vietnamese use cases for Strategy Engine, Strategy Library, and Backtest in `docs/UCs/`.

**Read first:**

- [Global Constraints](../README.md#global-constraints) in `../README.md`
- `docs/conventions/docs.md` (lines 1-86)
- `docs/conventions/use-cases.md` (lines 1-75)
- `docs/UCs/README.md` (lines 1-42)
- `docs/UCs/market-data.md` (lines 1-120)
- `docs/design/prototype/docs/requirements/strategy-engine.md` (lines 1-161)
- `docs/design/prototype/docs/requirements/backtest.md` (lines 1-134)
- `docs/open-questions.md` (lines 15-58)
- `.agents/skills/write-use-case/SKILL.md`

**Files:**

- Create: `docs/UCs/strategy-engine.md`
- Create: `docs/UCs/backtest.md`
- Change: `docs/UCs/README.md` (lines 28-42)
- Change: `docs/build/01-prototype-to-implementation/strategy-backtest/implementation/README.md`
- Change: `docs/build/01-prototype-to-implementation/strategy-backtest/implementation/plan/task-09-draft-use-cases.md`
- Create: `docs/build/01-prototype-to-implementation/strategy-backtest/implementation/reports/task-09-draft-use-cases.md`

**Interfaces:**

- Produces in `docs/UCs/strategy-engine.md`:
  - Declared ID prefixes: `SE` (Strategy Engine) and `SL` (Strategy Library)
  - Black-box `flowchart` and `sequenceDiagram` diagrams (zero internal component names)
- Produces in `docs/UCs/backtest.md`:
  - Declared ID prefix: `BT` (Backtest)
  - Black-box `flowchart`, `sequenceDiagram`, and `stateDiagram-v2` diagrams (zero internal component names)

**STOP when:**

- The output of a command does not match `Expected`.
- A file is different from the description in this task.
- This task needs a decision that this task does not contain.
- The same step fails two times.

**Forbidden:**

- Change a file that is not in the `Files` block.
- Mention internal mechanisms (`API`, `Web`, `Worker`, `PostgreSQL`, `Drizzle`, `Express`, `pg-boss`, `WebSocket`, `MSW`, `/api/`) inside `docs/UCs/` prose or Mermaid diagrams.
- Mark unapproved rules as `Confirmed` without a citation that supports them.
- Resolve Phase 2 open questions (`OQ-001`..`OQ-010`, `OQ-021`..`OQ-026`) without user approval.
- Delete, skip, or weaken a check.
- Commit or push.

- [x] **Step 1: Create draft `docs/UCs/strategy-engine.md`**

Create `docs/UCs/strategy-engine.md` in Vietnamese obeying `docs/conventions/docs.md` and `docs/conventions/use-cases.md`:

- Line 1: `# Strategy Engine và Strategy Library`
- Purpose line starting with `Đọc file này để biết ...`
- `## Tổng quan`:
  - Actor (`Người dùng đã đăng nhập`), in-scope behaviors (create, preview, save, edit, draft recovery, list, filter, search, drawer, rename, duplicate, delete with Undo). List out-of-scope items (Discovery Composite builder, News sentiment, Realtime live signals).
  - Prefix table with `SE` (`Strategy Engine`) and `SL` (`Strategy Library`) citing `[[1]](#ref-1)`.
  - Black-box Mermaid `flowchart LR` mapping actor to use cases.
- Use case sections:
  - `## Tạo và lưu strategy` (`sequenceDiagram`, numbered steps, measurable rule table `SE-01`..`SE-10`, alternative/exception table `SE-11`..`SE-15`).
  - `## Khôi phục bản nháp và sửa strategy` (numbered steps, rule table `SE-16`..`SE-19`, alternative/exception table `SE-20`..`SE-21`).
  - `## Quản lý Strategy Library` (`sequenceDiagram`, numbered steps, rule table `SL-01`..`SL-10`, alternative/exception table `SL-11`..`SL-14`).
- Mark prototype rules labeled `**Confirmed**` as `Confirmed` with citation. Mark other prototype rules as `Inferred`. Mark UI loading and error stub states as `Proposed`.
- `## Gap analysis`:
  - State that Phase 1 drafts observable UI flows and that Phase 2 completes the independent baseline comparison (for example ISO/IEC 25010 and WCAG 2.2 AA).
  - Table `ID | Gap | Baseline | Quyết định | Trạng thái` linking open gaps to `../open-questions.md#oq-021` through `../open-questions.md#oq-026` with status `Open`.
- `## References`: paper-style anchors `#ref-1` onward.

- [x] **Step 2: Create draft `docs/UCs/backtest.md`**

Create `docs/UCs/backtest.md` in Vietnamese obeying `docs/conventions/docs.md` and `docs/conventions/use-cases.md`:

- Line 1: `# Backtest`
- Purpose line starting with `Đọc file này để biết ...`
- `## Tổng quan`:
  - Actor (`Người dùng đã đăng nhập`), in-scope behaviors (configure and run backtest, active-run conflict dialog, monitor and cancel, Runs list, details, drift notices, charts, trades, costs). List out-of-scope items (Discovery search backtests, automated ranking).
  - Prefix table with `BT` (`Backtest`) citing `[[1]](#ref-1)`.
  - Black-box Mermaid `flowchart LR`.
- Use case sections:
  - `## Cấu hình và chạy backtest thủ công` (`sequenceDiagram`, `stateDiagram-v2` with `Running`, `Completed`, `Failed`, `Cancelled`, numbered steps, measurable rule table `BT-01`..`BT-12`, alternative/exception table `BT-13`..`BT-17`).
  - `## Xử lý xung đột run đang chạy và hủy run` (numbered steps, rule table `BT-18`..`BT-22`, alternative/exception table `BT-23`..`BT-24`).
  - `## Xem danh sách Runs, chi tiết run và kết quả` (numbered steps, rule table `BT-25`..`BT-32`, alternative/exception table `BT-33`..`BT-35`).
- `## Gap analysis`:
  - State that Phase 1 drafts observable UI flows and that Phase 2 completes the independent baseline comparison.
  - Table `ID | Gap | Baseline | Quyết định | Trạng thái` linking open gaps to `../open-questions.md#oq-001` through `../open-questions.md#oq-010` with status `Open`.
- `## References`: paper-style anchors `#ref-1` onward.

- [x] **Step 3: Update `docs/UCs/README.md`**

Add rows for `[strategy-engine.md](strategy-engine.md)` and `[backtest.md](backtest.md)` in the `## Danh sách file` table of `docs/UCs/README.md`.

- [x] **Step 4: Run `pnpm check:docs` and Prettier check**

Run: `pnpm check:docs && pnpm exec prettier --check docs/UCs/strategy-engine.md docs/UCs/backtest.md docs/UCs/README.md`
Expected: PASS. `pnpm check:docs` reports zero errors and Prettier reports all files formatted.

- [x] **Step 5: Write the report file and close Phase 1**

1. Mark Steps 1 to 4 as `- [x]` in this file.
2. In `docs/build/01-prototype-to-implementation/strategy-backtest/implementation/README.md`, change its row status to `Done` and link `reports/task-09-draft-use-cases.md` in the `Report` column.
3. Change Phase 1 status in `docs/build/01-prototype-to-implementation/strategy-backtest/implementation/README.md` from `Active` to `Done`.
4. Create `docs/build/01-prototype-to-implementation/strategy-backtest/implementation/reports/task-09-draft-use-cases.md` with:
   - One-sentence purpose line after H1 (`Read this file to ...`)
   - Files changed
   - Commands run, with exit codes and key output
   - What the commands do not prove
5. Run `pnpm exec prettier --check docs/build/01-prototype-to-implementation/strategy-backtest/implementation/README.md docs/build/01-prototype-to-implementation/strategy-backtest/implementation/plan/task-09-draft-use-cases.md docs/build/01-prototype-to-implementation/strategy-backtest/implementation/reports/task-09-draft-use-cases.md`.
6. Mark Step 5 as `- [x]`, stop, and send the report summary.
