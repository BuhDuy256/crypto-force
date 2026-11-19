---
name: review-change
description: Use before you report that a change is complete, when the change adds or changes code or tests. A new subagent reviews the diff against the coding guidelines and the testware rules. It looks only for the mistakes that `pnpm check` cannot find. Examples: a test that cannot fail, a test name that tells more than its assertions, a test that waits for real time. Use also when the user asks to "review this change" in this repo. Do not use to fix the findings.
---

# Review Change

The agent that made a change also believes it. A reviewer with a new context has time to check each claim. Thus, a different agent does the review. That agent sees only the diff, the standards, and this checklist.

## Steps

1. Run `pnpm check`. Fix each error before the review. The review does not repeat what lint, types and the checks already find.
2. Start one new subagent (Agent tool, `general-purpose`). Do not use a fork, because a fork gets your context. Give the subagent only:
   - The commands that show the change: `git diff`, `git diff --cached`, and `git status --short` for new files.
   - The standards: `docs/development/coding-guidelines.md` and the lessons in `LESSONS.md` with a scope that applies.
   - The evidence that you have for your claims: commands that you ran and their results, and the faults or mutants that made a test fail. Give the facts, not your reasons for the change.
   - The checklist below, and the output format.
3. Do not change files during the review. When the subagent reports, fix each finding that it reports, or tell the user why you keep it.
4. If one finding can happen again, run the `correct` skill for its class. A check stops the next one. A comment in a review does not.

## Checklist for the reviewer

- **Tests that cannot fail.** Each new or changed test needs evidence: it failed once on a defect or a mutant of the product. A changed expected value in the test is not evidence. Report each test with no such evidence.
- **Simulations.** Each stub, mock or driver loses the state that the real event loses. The comment at the top of the test file names the fault that made a test with the double fail. Report a double with no such fault, for example a restart in the same process.
- **Expected values.** Each expected value comes from a test case or a requirement. Report a test that computes the result again with the same logic as the code, because lint cannot find this. Some statuses come from a library and not from a requirement. A test of such a status must also check the effect that the requirement gives, for example a sent email. Report a test that checks only such a status.
- **Real time and order.** Lint finds fixed waits (`testware/no-real-time-wait`). Find what lint cannot find: a timeout that is too short for a slow machine, a test that depends on a real-time timer in the product, and a test that uses mutable data that another test changes.
- **Test names and comments.** Each name and comment tells only what the assertions check.
- **Exports for tests.** Report an export of the product that only a test uses. Make the test use the public interface of the module.
- **Claims.** Find each claim about state in a test comment, a commit message or the report to the user: a version, a configuration, "verified", "ready". Each claim needs a source that the author checked: a command output, a file, a test result.

## Output format

A table with these columns: file and line, finding, evidence, severity (high, medium, low). Give "No finding" for each item of the checklist with no problem. Do not give findings about style that `pnpm check` already enforces.
