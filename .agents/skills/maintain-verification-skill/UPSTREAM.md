# Upstream

- Repository: https://github.com/cursor/plugins
- Path: `pstack/skills/maintain-verification-skill`
- Pinned commit: `bf0c7cd80abdbf7fe47b634978a7d1b4071f71a7` (last commit touching the path: `6714489fa233263f00e419f6cfc4759b07c81056`, 2026-07-12; pstack 0.15.42)
- License: MIT, `LICENSE` copied from `pstack/LICENSE`

## Files

Included: `SKILL.md`.

## Modifications

### 1. Skill location

- Original: target skill is "usually `.cursor/skills/verify-*/`".
- Reason: Claude Code loads project skills from `.claude/skills/`.
- Change: `.claude/skills/verify-*/`.
- Impact: none on the method.

### 2. Shipping corrections

- Original: outcomes and step 6 ship corrections as "one PR"; clean runs have "No branch, no PR".
- Reason: the project commits only when the user asks (`CLAUDE.md` Safety Rules 02) and works on the current branch.
- Change: "PR" replaced with "change set", left uncommitted for the user to review; commit only if the user asks.
- Impact: the user decides when and where corrections are committed.
