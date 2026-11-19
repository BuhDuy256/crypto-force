# Upstream

## Skill

- Repository: https://github.com/vercel-labs/agent-skills
- Path: `skills/web-design-guidelines`
- Pinned commit: `1a2c79d4e6c4a2283dc2c614b6538cbe1ed5ca62` (last commit touching the path: `ba46938889d4e58635362fb8f618e1178ac3ec46`, 2026-01-16)
- License: MIT, as declared in the repository `README.md` ("## License: MIT"). The repository ships no license file, so no copyright line is available to copy.

## Guidelines

- Repository: https://github.com/vercel-labs/web-interface-guidelines
- File: `command.md`, copied as `guidelines.md`
- Pinned commit: `434b7f91364665f2f733b310ec54809bf8f37937` (last commit touching the file: `4ecfb9fb8d1d3b7009674869b3aaee2f904042e1`, 2026-10-05)
- License: MIT, `LICENSE` copied from this repository ("Copyright (c) 2025 Vercel Labs")

## Modifications

### 1. Guidelines read from a pinned local copy

- Original: "How It Works" step 1, "Guidelines Source" and "Usage" step 1 told the agent to fetch the latest `command.md` from the `main` branch with WebFetch before each review.
- Reason: review results changed whenever upstream changed, and a fetched page may be summarized rather than returned verbatim.
- Change: added `guidelines.md` (the pinned `command.md`) and changed the three steps to read it.
- Impact: no network access during reviews; new upstream rules arrive only when the pin is updated.
