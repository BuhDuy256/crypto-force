# Strategy and Backtest Implementation Plan

Read this file to learn the goal, decisions, global constraints, phase roadmap, and active tasks for Strategy and Backtest.

> **For executors:** Do one task at a time, in the order of the [Tasks](#tasks) table. Read Global Constraints in this file and your task file only. Do every step in order. When you complete a step, change its `- [ ]` to `- [x]` in the task file. After all checks of a task pass, update its row to `Done` with the report link in this file. Write the task report file in `reports/`. When a STOP condition occurs, stop and send the report. Do not start the next task until a person approves the report.

**Goal:** Deliver the complete Strategy and Backtest flow with an extensible zero-I/O engine, versioned strategy persistence, async worker execution, and verified benchmark evidence.

**Approach:** Follow six independent phases from stubbed UI and domain rules to a verified pure engine, backend orchestration, and benchmark evidence. Write detailed task files only for the active phase after the previous phase closes its open decisions.

**Tech stack:** TypeScript (strict), Node.js `>=22.22` (ESM), `pnpm` 9, React Router 8, TanStack Query, React Hook Form, Zod, Tailwind CSS, shadcn/ui, Lightweight Charts. Backend uses Express, `ws`, PostgreSQL, Drizzle ORM, `pg-boss`, `worker_threads`, Vitest, and Playwright.

**Spec:** [Knowledge and CV Goals](cv-goal.md), [Project Brief](../../../../UCs/sources/project-brief.md), [Strategy Engine Requirements](../../../../design/prototype/docs/requirements/strategy-engine.md), [Backtest Requirements](../../../../design/prototype/docs/requirements/backtest.md), and [Open Questions](../../../../open-questions.md).

## Decisions

| Topic | Decision |
| --- | --- |
| Plan location | Store this plan in `docs/build/01-prototype-to-implementation/strategy-backtest/implementation/`. Store task files in `plan/` and execution reports in `reports/` inside this folder. |
| Independent phase model | Organize the roadmap into six self-contained phases. Keep phase names independent from external roadmap labels. |
| Just-in-time task creation | Generate `plan/task-NN-<slug>.md` files only for the active phase. Do not generate tasks for future phases before earlier decisions close. |
| Strategy definition boundary | Execute the backtest engine on structured Zod strategy definitions (MA, RSI, Bollinger Bands, Support/Resistance, and Composite). Keep natural-language and URL extraction on controlled stubs or deterministic templates until Phase 2 resolves `OQ-021`. |
| Pure engine boundary | Keep `packages/engine` free of I/O, system clock reads, database access, network calls, and unseeded randomness. |
| Numeric representation | Compute indicators, signals, and trade simulation in `float64` inside `packages/engine`. Store prices, fees, and P/L as PostgreSQL `NUMERIC`. Round values only for display. |
| Async execution model | Enqueue backtest jobs in `pg-boss` from `apps/api`. Execute `packages/engine` inside Node.js `worker_threads` in `apps/worker` with timeout and cooperative cancellation. |
| Queue and progress bus ports | Hide `pg-boss` and cross-process progress transport behind `BacktestJobQueue` and `BacktestProgressBus` interfaces. Use PostgreSQL (`pg-boss` and `LISTEN/NOTIFY`) in this plan so later Discovery work can use Redis (`BullMQ` and Pub/Sub) without changing engine or service logic. |
| Reproducibility model | Save an immutable snapshot of strategy rules, strategy version, and run configuration on each `backtest_runs` record. Edits, renames, or deletions in Strategy Library do not change stored runs. |
| Evidence integrity | Record only measured benchmark numbers from reproducible runs in `cv-goal.md`. Never fabricate baselines or estimate metrics. |
| Phase 1 Library route | Serve Strategy Library at `/library` inside `workspace-layout.tsx`, matching `DESTINATION_LABELS.library` in `apps/web/app/utils/auth-redirect.ts`. Keep the `Strategy Engine` tab active on `/library`. |
| Phase 1 HTTP stubbing | Stub Strategy and Backtest HTTP endpoints with stateful MSW handlers under `apps/web/mocks/` behind `VITE_API_MOCKING=true`. Keep `apps/web/app/` free of mock data and MSW imports. |
| Phase 1 header fallback | Treat a `404` from `GET /api/backtests/active` as no active run so existing workspace routes stay quiet until Phase 5 adds the real API. |

## Global Constraints

- Operating system: Windows. Run commands from the repository root (`C:\Users\Duy\Desktop\crypto-force`).
- Runtime and package manager: Use Node.js `>=22.22` (ESM) and `pnpm` 9.
- Dependency boundaries: Put shared Zod contracts in `packages/shared`. Put zero-I/O computation in `packages/engine`. Never import `apps/api` or `apps/worker` source inside `apps/web`.
- Scoped verification: Run ESLint, workspace typecheck, targeted tests, `pnpm exec prettier --check <changed-files>`, and `pnpm check:docs` for changed docs. Do not run `pnpm check` unless a person asks for it.
- Rule enforcement: Never add `eslint-disable`, `@ts-expect-error`, or warning comments (`todo`, `fixme`, `hack`, `xxx`).
- No git side effects: Never commit or push changes inside a task.
- Language rules: Write plan files and task reports in English using short active sentences and strict ASD-STE100 rules. Write repository docs under `docs/UCs/` and `docs/architecture/` in Vietnamese per `docs/conventions/docs.md`.
- Plan integrity: Do not change the phase order in this file without user approval.

## Review Focus

- **Look-ahead bias in signal generation:** Check that changing any candle after index `t` never changes the strategy signal at index `t`. Owned by Phase 3.
- **Accounting invariance under fee and slippage:** Check that every completed run obeys `grossPnl - totalFee - totalSlippage = netPnl` within defined tolerance. Owned by Phase 3.
- **Immutable run snapshot isolation:** Check that editing, renaming, or deleting a Strategy Library item never changes stored run rules, version, or replay results. Owned by Phase 5.
- **Concurrent run guard and cancellation race:** Check that a second manual backtest triggers the active-run conflict flow. Check that cancelling a finishing job leaves a consistent terminal state. Owned by Phase 5.
- **API event-loop isolation under backtest load:** Check that running concurrent backtest jobs inside `worker_threads` keeps API HTTP p95 latency and event-loop lag within target thresholds. Owned by Phase 6.

## Phases

Each phase runs in order. Generate concrete `plan/task-NN-<slug>.md` files for one phase only when that phase becomes `Active`.

| Phase | Name | Status | Scope and Exit Gate |
| --- | --- | --- | --- |
| 1 | Scope and Stubbed UI | Active | Lock the initial user flow across Strategy Engine, Strategy Library, and Backtest. Implement interactive views in `apps/web` with stubs for loading, empty, error, validation, draft recovery, and active-run conflict states. Draft observable user behavior in `docs/UCs/`. |
| 2 | Requirements and Domain Rules | Pending | Complete use cases in `docs/UCs/` and quality targets in `docs/UCs/quality-attributes.md`. Resolve High and Medium open questions that block the engine, database schema, and job lifecycle (`OQ-001` to `OQ-010`, `OQ-021` to `OQ-026`, `OQ-066`, `OQ-067`). Record requirement gap analysis against an independent baseline. |
| 3 | Pure Engine Design and Core | Pending | Write architecture docs `11-strategy.md` to `14-evaluation.md` and ADRs in `30-decisions.md`. Define shared contracts in `packages/shared`. Implement zero-I/O indicators, strategy plugin registry (MA, RSI, Bollinger Bands, Support/Resistance), composite combiner, trade simulator, and evaluator in `packages/engine`. Pass golden tests and property tests for determinism, zero look-ahead bias, and P/L accounting. |
| 4 | Persistence, API, and Async Worker Design | Pending | Update `20-state-machine.md`, `21-database.md`, `22-api-endpoints.md`, `23-security.md`, and `30-decisions.md`. Define versioned library tables, immutable run snapshots, REST endpoints, WebSocket progress events, run state transitions, cooperative cancellation, authorization limits, observability fields, and integration test scenarios. |
| 5 | Backend, Worker, and End-to-End Integration | Pending | Write failing integration and contract tests first. Implement Drizzle migrations, Strategy Library API, historical candle loader, `pg-boss` queue producer, `apps/worker` job handler using `worker_threads`, and WebSocket progress notifications. Connect `apps/web` to real APIs and WebSocket events and pass Playwright E2E tests. |
| 6 | Extensibility Proof, Benchmarks, and CV Evidence | Pending | Add a fifth plugin strategy (for example `MACDStrategy`) and prove zero edits to core backtester, evaluator, worker, and API layers. Run reproducible CPU throughput, concurrent job, and API isolation benchmarks. Record verified metrics in `cv-goal.md` and write a demo guide. |

## Tasks

Execute Phase 1 tasks in order. Do not start Task N+1 until a person approves the report of Task N.

| Task | Phase | Status | File | Report |
| --- | --- | --- | --- | --- |
| 1 | 1 | Done | [Shared Strategy and Backtest Contracts and MSW Stubs](plan/task-01-shared-contracts-and-msw-stubs.md) | [Task 1 report](reports/task-01-shared-contracts-and-msw-stubs.md) |
| 2 | 1 | Pending | [Web API Clients, Hooks, Draft Helpers, and Dialog Primitives](plan/task-02-web-api-hooks-and-primitives.md) | — |
| 3 | 1 | Pending | [Strategy Engine Screen](plan/task-03-strategy-engine-screen.md) | — |
| 4 | 1 | Pending | [Strategy Library Screen and Workspace Navigation](plan/task-04-strategy-library-and-navigation.md) | — |
| 5 | 1 | Pending | [Backtest Setup, Active Run Lifecycle, Conflict Dialog, and Runs Views](plan/task-05-backtest-setup-and-runs.md) | — |
| 6 | 1 | Pending | [Backtest Results Visualization (Charts, Trades Table, Cost Breakdown)](plan/task-06-backtest-results-visualization.md) | — |
| 7 | 1 | Pending | [Browser Verification Suite and Production Build Check](plan/task-07-browser-verification-suite.md) | — |
| 8 | 1 | Pending | [Draft Observable Use Cases in `docs/UCs/`](plan/task-08-draft-use-cases.md) | — |

## Next Phase

- **Phase 2 (Requirements and Domain Rules):** After Task 8 closes Phase 1, run a baseline gap analysis. Resolve High and Medium open questions (`OQ-001` to `OQ-010`, `OQ-021` to `OQ-026`, `OQ-066`, `OQ-067`). Then generate Phase 2 task files.
