---
name: stlc-test-implementation
description: Use only when the user asks for the full STLC process for a test scope in docs/testing/test-scopes/. Then use this skill to prepare testware for execution (STLC phase 4). Covers test procedures, manual and automated test scripts, test suites, and the execution schedule. Also covers test data, the test environment with stubs, drivers and service virtualization, and verification of each item before execution. Do not use to design test cases or to evaluate the product. Do not use when the user asks only if the tests are ready to run.
---

# Test Implementation (STLC Phase 4)

This phase makes the testware that execution needs. Each item must exist, have a version, trace to the test cases it implements, and be verified to work. A test case is ready only when its procedure, its data and its environment are all ready.

## Ground rules

1. Project rules have priority. If the project has templates for this phase, use their structure, IDs and acceptance criteria. Use the default outputs in this skill only when the project has no template.
2. Give a source for each requirement, value or decision. A source is a versioned document, a standard with its section number, or a tool output.
3. Do not change test case design or expected results. If a test case is wrong, send it back to test design.
4. Do not run tests to evaluate the product. A dry run checks the testware, not the product.
5. Report the facts. If a check fails or you skip a step, say so.

## Entry check

- The test cases are reviewed and have IDs.
- The test data and environment requirements are known.
- The tools, frameworks and access rights are available.

## Steps

1. **Prepare test data.** For each data requirement, record the data set, how you create it (fixture, factory, seed, copy of production with anonymization), and how you reset it. Tests must not depend on data that another test changes. Do not put personal data or secrets in test data.
2. **Build the test environment.** Record each component and its version. For each external dependency, choose a stub, a driver, a mock, a simulator, or service virtualization. Record what each replacement does not simulate, because those gaps limit the results.
   - Check each simulated event once with the fault that the real event causes. For example, a restart must lose the memory of the process: put a counter in memory and see that the restart test fails. Do not record a simulated behavior that you did not check.
3. **Write test procedures and scripts.** Group test cases into procedures in the order that the preconditions need. For an automated script:
   - Assert the expected result from the test case. A script that only runs steps is not a test.
   - Assert the exact result: the status, body or side effect that the test case gives. "Not 429" or "status below 400" also passes for a 500.
   - Write the expected value from the test case. Do not compute it with the code under test, and do not read it from a constant or a setting of that code.
   - Replace only external boundaries (network, email, clock). Do not mock a module of the product.
   - Make the test name and comments tell only what the assertions show.
   - Make it deterministic: control time, random seeds, network and order.
   - Make each test independent of the others.
   - Keep the test case ID in the script name or metadata, for traceability.
   - Test the behavior in the test basis, not the current code. If the environment cannot make a precondition that a real user can make, change the environment (a variable, a second server, a separate database). Do not change the step to go around it.
   - If a step must still change, record it as a change from the test design. Each record tells what the test case says, what stops it, what the script does instead, and why the script still checks the expected result. A reviewer must understand the record without other files.
4. **Build test suites and the execution schedule.** Put high-priority and high-risk tests first. Show dependencies between suites. Include the smoke suite that shows whether the build is testable.
5. **Verify the testware.** Do a dry run on a known build:
   - The script runs to the end.
   - The script fails when the product breaks the behavior that the test case checks. Check this once with a known defect or with a mutant. A mutant is a small fault in the product that breaks only that behavior, for example a changed setting. A test that cannot fail gives no information.
   - A changed expected value in the script is not sufficient. It shows that the assertion runs, but not that the test finds a defect.
   - If the mutant behaves the same as the product without the fault (an equivalent mutant), the result shows nothing. Use a different mutant.
   - The data and the environment pass their readiness checks.
6. **Write the implementation status last.** For each test case: ready, or blocked with the reason (procedure, data or environment).

## Default outputs

Use these only when the project has no template.

1. Implementation status: readiness of each test case, changes from the test design, work that remains.
2. Procedures and suites: procedures, scripts, suites, schedule, runbook, testware verification results.
3. Test data: data sets and readiness checks.
4. Test environment: components, stubs and mocks, readiness checks.

## Exit check

- Each test case in scope is ready, or is blocked with a reason.
- Each automated script asserts the expected result and was seen to fail at least once on a known defect or a mutant of the product.
- Each data set and environment component has a version and a reset method.
- The schedule puts high-risk tests first.
- You ran the `correct` skill in sweep mode on the changes of this phase. Each mistake class that it found has a check that stops it, or the user decided to accept it.

## Anti-patterns

- A script with no assertion, or one that asserts only "status 200".
- An assertion that tells only what the result is not, for example "status is not 429".
- An expected value from the code under test: an imported constant, or a call to the function that the test checks.
- A mock of a product module. The test then fails when the code is only reorganized.
- A simulation that keeps the state that the real event loses, for example a "restart" in the same process.
- A test name that tells more than the assertions check, for example "128 bits of entropy" for a check of length and alphabet.
- Tests that pass only in a fixed order.
- Shared mutable test data between tests.
- A mock that returns success for every call, so the test cannot fail.

## Sources

- ISTQB CTFL Syllabus v4.0.1, §1.4.1 Test Activities and Tasks (test implementation), §1.4.3 Testware.
