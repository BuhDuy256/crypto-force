# Upstream

- Repository: https://github.com/cursor/plugins
- Path: `pstack/skills/create-verification-skill`
- Pinned commit: `bf0c7cd80abdbf7fe47b634978a7d1b4071f71a7` (last commit touching the path: `c49b37a2c0e7bede60a71ad7322e3f12c337a3da`, 2026-10-12; pstack 0.15.42)
- License: MIT, `LICENSE` copied from `pstack/LICENSE`

## Files

Included: `SKILL.md`, `references/feature-map-example/*`.

## Modifications

### 1. Skill location

- Original: the generated skill is written to `.cursor/skills/verify-<app>/`.
- Reason: Claude Code loads project skills from `.claude/skills/`.
- Change: `.cursor/skills/verify-<app>/` replaced with `.claude/skills/verify-<app>/` (3 occurrences).
- Impact: none on the method.
