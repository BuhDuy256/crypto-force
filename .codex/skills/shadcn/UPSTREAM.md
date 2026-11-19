# Upstream

- Repository: https://github.com/shadcn-ui/ui
- Path: `skills/shadcn`
- Pinned commit: `e62c9435fff729a175f38983dee73b2cb4f6a069` (last commit touching the path: `4233ed1caded8c38f4bc14b14afe1f93ebcaf966`, 2026-10-14)
- Matching CLI: `shadcn` 4.23.0 (`packages/shadcn/package.json` at the pinned commit)
- License: MIT, `LICENSE` copied from the repository root (`LICENSE.md`)

## Files

Included: `SKILL.md`, `cli.md`, `customization.md`, `registry.md`, `mcp.md`, `design-system.md`, `design-system-page.md`, `rules/*`, `assets/showcase/*`, `scripts/showcase-coverage.mjs`.

Not included: `evals/` (upstream test fixtures), `agents/openai.yml` and `assets/shadcn*.png` (metadata and icons for another agent runtime).

## Modifications

### 1. Project context is fetched explicitly

- Original: the "Current Project Context" section injected ``!`npx shadcn@latest info --json` `` when the skill loaded; the Workflow and Key Fields sections referred to the "injected" context.
- Reason: the command runs at load time in the session's working directory. When `components.json` is not in that directory (e.g. an app inside a monorepo), the command fails and the whole skill fails to load. It also downloads the CLI without a prompt each time the skill loads.
- Change: replaced the injection with an instruction to run `info --json` first, passing `--cwd <dir>` when needed; updated the two references to the injected context.
- Impact: one extra explicit command per session; the skill loads regardless of the working directory.

### 2. `allowed-tools` removed

- Original: `allowed-tools: Bash(npx shadcn@latest *), Bash(pnpm dlx shadcn@latest *), Bash(bunx --bun shadcn@latest *)`
- Reason: pre-approves file-writing commands (`add`, `apply`, `init --force`) without a permission prompt.
- Change: removed the field.
- Impact: shadcn CLI commands go through the normal permission rules.
