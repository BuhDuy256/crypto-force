---
name: stlc-test-design
description: Use only when the user asks for the full STLC process for a test scope in docs/testing/test-scopes/. Then use this skill to do test analysis and test design (STLC phase 3). Covers test conditions from a versioned test basis, technique selection, test models and coverage items. Also covers test cases and exploratory charters with concrete inputs and expected results. Do not use to write test scripts or to run tests. Do not use when the user asks only for test cases for a feature.
---

# Test Analysis and Design (STLC Phase 3)

Test analysis answers "what to test". Test design answers "how to test". Use one chain that a reviewer can check step by step:

```
test basis → test condition → test model → coverage item → test case
```

An error in a test model goes into every test case that comes from it. Thus, review the model before you design test cases.

## Ground rules

1. Project rules have priority. If the project has templates for this phase, use their structure, IDs and acceptance criteria. Use the default outputs in this skill only when the project has no template.
2. Give a source for each requirement, value or decision. A source is a versioned document, a standard with its section number, or a tool output.
3. Do not invent values. An expected result must come from the test basis. If the test basis does not give it, write "ORACLE NEEDED" and report a test basis defect.
4. An expected result tells what the result is. "Not 429" or "no error" is not an expected result: give the response that the request gets when it passes the check.
5. Do not change requirements. Do not write scripts or test data. Do not run tests.
6. Report the facts. If a check fails or you skip a step, say so.

## Entry check

- The test basis items are versioned and their readiness is known.
- The test plan gives the coverage criterion for each risk level.
- Information about the test object is versioned when you use white-box or state-based techniques.

## Steps

1. **Derive test conditions.** A test condition is a testable aspect of the test basis, for example "reject a password shorter than the minimum length". For each test condition, record the test basis item it comes from and its priority from the risk level. You can use an acceptance criterion directly as a test condition. Then link to its ID. Do not rewrite it.
2. **Compare with an independent baseline.** Find test conditions that the test basis omits (see `stlc-requirement-analysis`, step 4). Report each gap as a test basis defect immediately. Do not wait for the end of the phase.
3. **Select a technique for each test condition.** Use the table below. Record why the condition has the property that selects the technique.
4. **Build the test model.** Use the technique skill. Each element of the model must link to a source. An element with no source is a test basis defect.
5. **Have the model reviewed.** A person who is not the author reviews it before test case design.
6. **Derive coverage items.** Apply the rule of the coverage criterion that the test plan sets. Another person must get the same count. Give each coverage item an ID that shows its model, for example `MD-01-CI-03`.
7. **Design test cases.** One test case covers one or more coverage items. Each test case has preconditions, inputs, actions, an expected result, and the IDs of its coverage items. Use one invalid input in each test case, so that one defect cannot hide another. Some properties cannot be seen from outside the product, for example that a token generator uses a CSPRNG. For such a property, design a Review test case. A test of the output can check only its format.
8. **Write exploratory charters** for areas that you cannot model. See `test-technique-experience-based`.
9. **Record test data and environment requirements.** State what each test case needs. Do not create the data or the environment.
10. **Write the design status last.** Show traceability from test basis to test case, the coverage of each model, and the work that remains.

## Technique selection

| Property of the test condition | Technique skill |
| --- | --- |
| A set of values gets the same processing, or the values have an order | `test-technique-equivalence-partitioning-bva` |
| The result depends on a combination of conditions | `test-technique-decision-table` |
| The behavior depends on the previous state or on event history | `test-technique-state-transition` |
| A business flow with many steps and alternative paths | `test-technique-scenario` |
| Code exists and you must measure code coverage | `test-technique-white-box` |
| Knowledge of typical failures, a checklist or a standard, or a weak test basis | `test-technique-experience-based` |
| Response time, throughput, capacity or resource use | `test-technique-performance-workload` |
| Threats to assets, or a security standard | `test-technique-security-threat-model` |
| A rule that must hold for all inputs, a parser, or a large input space | `test-technique-fuzz-property-based` |

A test condition can need more than one technique. Test level and test type are independent: most test types apply at each test level.

## Default outputs

Use these only when the project has no template.

1. Test conditions: ID, test basis item and version, priority, technique.
2. Test models: model ID, technique, coverage criterion, model, coverage items.
3. Test cases and charters.
4. Test data and environment requirements.
5. Design status: traceability and coverage per model.

## Exit check

- Each test condition links to a versioned test basis item.
- Each model has a recorded reason for its technique, and someone other than the author reviewed it.
- The count of coverage items can be reproduced.
- Each coverage item has at least one test case, or a recorded reason why not.
- Each expected result comes from a source, or is marked "ORACLE NEEDED" with a reported defect.
- You ran the `correct` skill in sweep mode on the changes of this phase. Each mistake class that it found has a check that stops it, or the user decided to accept it.

## Anti-patterns

- You write test cases directly from the requirement, with no condition or model. Nobody can check coverage.
- You take an expected result from the current behavior of the code.
- An expected result that tells only what the result is not.
- A dynamic test case for a property that only a review can show, for example the source of randomness.
- You put many invalid inputs into one test case.
- "Works correctly" as an expected result.

## Sources

- ISTQB CTFL Syllabus v4.0.1, §1.4.1 Test Activities and Tasks, §4 Test Analysis and Design, §4.5.2 Acceptance Criteria.
