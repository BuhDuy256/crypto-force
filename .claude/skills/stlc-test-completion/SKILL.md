---
name: stlc-test-completion
description: Use when you summarize and close a test cycle (STLC phase 6). Covers the test summary report, execution and coverage results, defect summary, and exit criteria. Also covers residual risks, recommendation, lessons learned, and handover of testware and environments. Use also when the user asks "can we release?" and needs evidence. Do not use to run more tests or to decide a release for the decision maker.
---

# Test Summary and Closure (STLC Phase 6)

Give the decision maker a conclusion about the quality of the test object within the agreed scope, with evidence and a recommendation. Give the risk owner the residual risks to accept or reject. Give the next team the testware and the open work.

## Ground rules

1. Project rules have priority. If the project has templates for this phase, use their structure, IDs and acceptance criteria. Use the default outputs in this skill only when the project has no template.
2. Give a source for each number and claim. A source is a test log, a defect report, a tool output, or a versioned document.
3. Do not make a conclusion about the parts of the product that are out of scope.
4. Do not decide a release. Do not accept a risk for the risk owner. Give a recommendation.
5. Report the facts. Show failed criteria and gaps as they are.

## Entry check

- A cut-off time for the data is set.
- The execution status, the defect list and the tool reports exist for that cut-off time.
- The exit criteria from the test plan are known.

## Steps

1. **Set the counting rules first.** State what you count: test cases or test instances, the last run or all runs, how you count retests. Without fixed rules, two people get different numbers.
2. **Summarize execution and coverage.** Give the status counts, the coverage for each test model and coverage criterion, and the coverage gaps. A gap is a coverage item with no passed test, or a test condition with no test.
3. **Summarize defects.** Give the defects at the cut-off time by severity and status, the quality of fixes (reopened defects), and the regression results.
4. **Write lessons learned.** Record what worked and what did not, with evidence, and one action item with an owner for each.
5. **Derive residual risks.** Each coverage gap and each unresolved defect can leave a risk. For each residual risk: the product risk it relates to, the evidence, a proposed treatment, and the decision of the risk owner.
6. **Check the exit criteria.** For each criterion: the target, the actual value, met or not met, and the source. Do not round a "not met" up to "met".
7. **Write the test summary report last.** Give the context, the scope, the test object version, the exit criteria results and the residual risks. Give the deviations from the plan in scope, schedule and effort. Give the recommendation. A recommendation is one of: continue to the next step, continue with stated conditions, or do not continue. Give the reason.
8. **Close and hand over, when the cycle ends.** Archive the testware with its versions. Hand over the environments and the data. Raise change requests for open work.

## Default outputs

Use these only when the project has no template.

1. Test summary report: context, exit criteria, recommendation, sign-off.
2. Execution and coverage: counting rules, statuses, coverage, gaps.
3. Defects: open and closed by severity, fix quality, regression.
4. Residual risks: risk, evidence, proposed treatment, decision.
5. Lessons learned: observations and action items.
6. Closure and handover: archive, handover, change requests.

## Exit check

- Each number in the report traces to a source at the cut-off time.
- Each exit criterion has an actual value and a result.
- Each residual risk has a decision from the risk owner, or is marked as waiting for one.
- The recommendation states its limits.

## Anti-patterns

- "All tests passed" with no statement of what was not run or not covered.
- You hide a not-met exit criterion in an appendix.
- You report a pass rate with no coverage. A high pass rate on a small part of the scope says little.
- Lessons learned with no owner and no action.

## Sources

- ISTQB CTFL Syllabus v4.0.1, §1.4.1 Test Activities and Tasks (test completion), §5.3 Test Monitoring, Test Control and Test Completion.
- ISO/IEC/IEEE 29119-3:2021, Test Completion Report.
