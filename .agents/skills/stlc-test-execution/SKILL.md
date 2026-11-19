---
name: stlc-test-execution
description: Use only when the user asks for the full STLC process for a test scope in docs/testing/test-scopes/. Then use this skill to run tests and record results (STLC phase 5). Covers manual, automated and exploratory execution, test logs with evidence, and actual versus expected results. Also covers defect reports, confirmation and regression testing, suspension and resumption, and execution status at a cut-off time. Do not use to fix defects, to design new test cases, or to decide that exit criteria are met. Do not use when the user asks only which tests failed.
---

# Test Execution (STLC Phase 5)

Run the tests on a known test object. For each run, record the actual result, compare it with the expected result, set a status, and keep evidence. Report each anomaly. At each cut-off time, the current status of each test instance must be known.

## Ground rules

1. Project rules have priority. If the project has templates for this phase, use their structure, IDs and acceptance criteria. Use the default outputs in this skill only when the project has no template.
2. Give a source for each value or decision. A source is a versioned document, a standard with its section number, or a tool output.
3. Do not change an expected result to make a test pass. Do not fix the product.
4. Do not decide that exit criteria are met, accept a risk, or decide a release.
5. Report the facts. A test that you did not run is "Not run", not "Passed". If you skip a step, say so.

## Entry check

- The entry criteria from the test plan are met. If you start when an entry criterion is not met, record it as a deviation, with the person who approved it.
- The test object is identified: build, commit or version, and the environment.
- The testware is ready (see `stlc-test-implementation`).

## Steps

1. **Run the smoke suite first.** If it fails, the build is not testable. Apply the suspension criteria.
2. **Run tests in the order of the schedule.** For each run, record the test case ID, the test object version, the environment, the time, and the tester or the job. Also record the actual result, the status, and the evidence.
3. **Use exact statuses.** Passed, Failed, Blocked, Not run, Inconclusive. A "Passed" run without the required evidence is not a valid pass.
4. **Analyze each failure before you report a defect.** A failure is not always a product defect. The cause can be the test, the data, the environment or the test basis. Record the analysis. Report a product defect only when the evidence points to the product.
5. **Report defects.** Use `test-defect-classification` for severity, priority and status. A report must let a developer reproduce the failure. It contains minimal steps from a known state, exact data, and the expected and actual result. It also contains the environment, the version, and evidence (logs, screenshots, trace) with secrets removed. Put one defect in one report.
6. **Run exploratory sessions** from their charters. Record the session notes, the time, the areas covered and not covered, and the defects found.
7. **Do confirmation testing after a fix.** Run again the tests that failed, on the build that contains the fix. Then do regression testing in the areas that the change can affect.
8. **Run measurement tools when the plan needs them:** code coverage, performance, security scanners. Record the tool, its version, its configuration and the raw result.
9. **Write the execution status at each cut-off time.** Show the current status of each test instance and coverage item, deviations, suspensions, and the work that remains. Results from an older build are valid only if the change cannot affect them. Record that reason.

## Default outputs

Use these only when the project has no template.

1. Execution status at a cut-off time.
2. Test log: each run, each exploratory session, evidence.
3. Defect reports, confirmation tests and regression tests.
4. Tool reports.

## Exit check

- Each failed or inconclusive run links to a defect report or to a recorded analysis.
- Each passed run has its evidence.
- Each fixed defect has a confirmation test result.
- The execution status gives a cut-off time and a test object version.
- You ran the `correct` skill in sweep mode on the changes of this phase. Each mistake class that it found has a check that stops it, or the user decided to accept it.

## Anti-patterns

- You run the test again until it passes, and record only the pass.
- You report a flaky test as Passed.
- You mix two defects in one report, or you blame a person in a report.
- You compare results from different builds as if they came from one build.

## Sources

- ISTQB CTFL Syllabus v4.0.1, §1.4.1 Test Activities and Tasks (test execution), §2.2.3 Confirmation Testing and Regression Testing, §5.5 Defect Management.
