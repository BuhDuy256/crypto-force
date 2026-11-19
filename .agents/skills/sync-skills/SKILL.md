---
name: sync-skills
description: Sync project skills from .agents/skills to .claude/skills and .codex/skills after creating, installing, or editing skills, or check whether the copies match.
---

# Sync skills

Treat `.agents/skills/` as the source of truth. Create, install, and edit skills there first.

Run `pnpm skills:sync` from the repository root, then `pnpm skills:check`.
The sync copies changed and missing files, including references, scripts, licenses, and assets.
It only updates the two skills directories, preserving all other configuration and hooks. Destination-only files are reported and preserved;
resolve them deliberately before claiming the copies match. Never import destination changes back automatically.

Use `pnpm skills:check` for a comparison without copying files.
Keep upstream provenance and licenses when installing third-party skills.
