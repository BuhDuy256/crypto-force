---
name: stlc-test-implementation
description: Use when you prepare testware for execution (STLC phase 4). Covers test procedures, manual and automated test scripts, test suites, and the execution schedule. Also covers test data, the test environment with stubs, drivers and service virtualization, and verification of each item before execution. Use also when the user asks "are we ready to run the tests?". Do not use to design test cases or to evaluate the product.
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
3. **Write test procedures and scripts.** Group test cases into procedures in the order that the preconditions need. For an automated script:
   - Assert the expected result from the test case. A script that only runs steps is not a test.
   - Make it deterministic: control time, random seeds, network and order.
   - Make each test independent of the others.
   - Keep the test case ID in the script name or metadata, for traceability.
4. **Build test suites and the execution schedule.** Put high-priority and high-risk tests first. Show dependencies between suites. Include the smoke suite that shows whether the build is testable.
5. **Verify the testware.** Do a dry run on a known build:
   - The script runs to the end.
   - The script fails when the expected result is not met. Check this once, for example with a changed expected value or a known defect. A test that cannot fail gives no information.
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
- Each automated script asserts the expected result and was seen to fail at least once.
- Each data set and environment component has a version and a reset method.
- The schedule puts high-risk tests first.

## Anti-patterns

- A script with no assertion, or one that asserts only "status 200".
- Tests that pass only in a fixed order.
- Shared mutable test data between tests.
- A mock that returns success for every call, so the test cannot fail.

## Sources

- ISTQB CTFL Syllabus v4.0.1, §1.4.1 Test Activities and Tasks (test implementation), §1.4.3 Testware.
