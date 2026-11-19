# Upstream

- Repository: https://github.com/obra/superpowers
- Path: `skills/writing-plans`
- Pinned commit: `22f0b463e7a5e579904dd6211a520321035526f7` (last commit touching the path: `8ca22dba9a94f28898bbce59f2537ff4d87c747d`, release v6.4.2)
- License: MIT, `LICENSE` copied from the repository root

## Files

Included: `SKILL.md`.

## Modifications

Upstream references companion skills from the same repository (`superpowers:using-git-worktrees`, `superpowers:subagent-driven-development`, `superpowers:executing-plans`) that are not included here.

### 1. Plan location

- Original: "**Save plans to:** `docs/superpowers/plans/YYYY-MM-DD-<feature-name>.md`" with "(User preferences for plan location override this default)".
- Reason: a fixed default writes files into the repository's documentation tree even when the project keeps plans elsewhere.
- Change: save where the user or project instructions specify; otherwise present the plan in the response and ask before writing a file.
- Impact: no default file location.

### 2. Plan header

- Original: "> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking."
- Reason: the required skills are not included.
- Change: kept only "Steps use checkbox (`- [ ]`) syntax for tracking."
- Impact: plans no longer name an executor skill.

### 3. Worktree context

- Original: "**Context:** If working in an isolated worktree, it should have been created via the `superpowers:using-git-worktrees` skill at execution time."
- Reason: the referenced skill is not included.
- Change: removed the line.
- Impact: none on planning.

### 4. Execution handoff

- Original: after saving, ask the user to choose between "Subagent-driven" and "Native" execution, then require `superpowers:subagent-driven-development` or `superpowers:executing-plans`.
- Reason: the required skills are not included, and choosing an execution process is outside planning.
- Change: kept "present the plan, ask the user to review it, and wait before implementation"; removed the execution-method choice and the required skills; replaced the fixed path with `<plan location>`.
- Impact: the skill stops at plan review instead of proposing an execution method.
