---
name: lesson-manager
description: Capture, review, and update Lesson Learned entries for the Crypto Force project in LESSONS.md. Use when the user points out a mistake and wants to learn from it, asks to record or edit a Lesson Learned, or asks to review LESSONS.md. Never writes files without the user's approval.
---

# Lesson Manager

This skill manages Lesson Learned entries in `LESSONS.md` (repository root). `LESSONS.md` is the single source of truth; do not store any rules inside this skill.

## General Principles

- **Never write to `LESSONS.md` until the user has explicitly approved** the specific content to add or change.
- Write Lesson Learned entries only to `LESSONS.md`, never to `AGENTS.md` or `CLAUDE.md`.
- Not every piece of feedback becomes a Lesson Learned. Propose one only when:
  - A real mistake actually occurred (not a hypothetical one), and
  - The mistake is likely to recur in other tasks, and
  - The specific behavior that needs to change can be identified.
- Feedback that applies only to the current task, or a temporary preference → fix it within the task and do not create a lesson. Briefly explain why to the user.
- Rules must be specific and verifiable; avoid overly broad rules that make the agent lose flexibility.
- Prefer updating an existing lesson over creating a duplicate.
- Do not convert existing conventions in `CLAUDE.md` / `AGENTS.md` into Lesson Learned entries unless the user asks.
- IDs (`LL-XXX`) never change and are never reused. Do not delete lessons; mark a lesson that no longer applies with `Status: Deprecated` and a reason.
- Do not commit or push. Leave all changes for the user to review via `git diff`.

## Workflow: Capture

Use when the user points out a mistake or asks to learn from one.

1. Identify the undesired behavior or outcome (quote it specifically when possible).
2. Analyze the cause based on actual evidence; clearly separate what is known from what is inferred.
3. Decide whether it should become a Lesson Learned using the criteria in "General Principles". If not, explain briefly and stop.
4. Determine the Scope: `Documentation`, `Code`, `Testing`, or `General`.
5. Read `LESSONS.md` to find similar or conflicting rules. If an existing rule already covers the content, do not create a new lesson; only propose amending that rule when truly necessary.
6. Propose one of the following:
   - A new lesson with the next ID (highest existing ID + 1), or
   - An edit to an existing lesson (state the ID and the changed parts).
   Present it in full using the template in `LESSONS.md`.
7. Ask the user for approval. Do not write the file at this step.

## Workflow: Review

Use when the user asks to review Lesson Learned entries.

1. Read all of `LESSONS.md`.
2. Check each lesson for:
   - Duplication of or conflict with another lesson (or with `AGENTS.md`).
   - Rules that are vague, overly broad, or hard to verify.
   - Missing Problem/Rule, or missing examples where examples are needed.
   - No longer fitting the current state of the project.
3. Report as a table: ID, issue, specific proposed change.
4. Do not edit anything until approved.

## Workflow: Update

Use after the user approves a proposal from Capture or Review.

1. Identify exactly which lesson to add or edit, and the approved scope of the change.
2. Write to the `## Lessons` section of `LESSONS.md`:
   - New lesson: append to the end of the list; remove the placeholder line if one remains.
   - Existing lesson: keep its ID and change only the approved parts.
3. Do not touch unrelated lessons.
4. Show the changes to the user (run `git diff -- LESSONS.md`).
