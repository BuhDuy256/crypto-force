---
name: stlc-test-planning
description: Use only when the user asks for the full STLC process for a test scope in docs/testing/test-scopes/. Then use this skill to write a test plan (STLC phase 2). Covers test objectives and scope, product and project risks, and the test approach (test levels, test types, techniques, coverage targets by risk level, automation). Also covers entry, exit, suspension and resumption criteria, estimates and schedule. Do not use to design test cases or to decide a release. Do not use when the user asks only what to test and how much.
---

# Test Planning (STLC Phase 2)

The test plan serves four readers. The approver learns what the team will test and when testing is done. The test designer learns the coverage target for each risk. The test executor learns the entry, exit and suspension criteria. The risk owner learns which risks testing reduces and which it does not.

## Ground rules

1. Project rules have priority. If the project has templates for this phase, use their structure, IDs and acceptance criteria. Use the default outputs in this skill only when the project has no template.
2. Give a source for each requirement, value or decision. A source is a versioned document, a standard with its section number, or a tool output.
3. Do not invent values. A coverage target, a threshold or an estimate that you propose is an "agent proposal". Give the reason and get approval from the owner.
4. Do not accept a risk for the risk owner. Do not decide a release. Do not design test cases.
5. Report the facts. If a check fails or you skip a step, say so.

## Entry check

- The test basis is reviewed, or its readiness status is known (see `stlc-requirement-analysis`).
- The test object and its boundaries are known.
- The people who approve the plan and who own each risk are known.
- The constraints are known: time, people, environments, tools, budget.
- Check each claim about the environment at its source. The sources are `.env` (only whether a variable has a value), the code that reads it, the lockfile, and the CI config. A requirement document gives the target behavior, not the current state.

## Steps

Do the steps in this order. The approach depends on the risks, so identify risks first.

1. **Analyze risks.** Use `test-risk-analysis`. Identify product risks and project risks. Give each risk a risk level from likelihood and impact.
2. **Define the test approach from the product risks.** For each risk, decide:
   - The test levels: component, component integration, system, system integration, acceptance.
   - The test types: functional, non-functional (by ISO/IEC 25010 characteristic), white-box, confirmation, regression.
   - The techniques and the coverage criterion. See "Coverage by risk level" below.
   - The automation level. Use the test pyramid: many fast low-level tests, few slow high-level tests. Use the testing quadrants to check that you cover both business-facing and technology-facing tests.
   A test type with no risk is waste. A high risk with no test approach must go back to the risk owner as "not mitigated by testing".
3. **Define entry, exit, suspension and resumption criteria.** Each criterion must be measurable. Bad: "testing is mostly done". Good: "100% of risk-level-high test cases executed, and no open defect with severity critical". Typical exit criteria are coverage reached, defect counts by severity, and residual risk accepted by the risk owner.
4. **Estimate and schedule.** Use `test-estimation`. Schedule high-risk tests first. Show dependencies on environments, test data and builds.
5. **Write the test plan last.** Add context, objectives, scope and out of scope, assumptions and constraints, stakeholders, communication, deliverables and approval. Submit the full set for approval.

## Coverage by risk level

Link the coverage criterion to the risk level. Use this as the default pattern, and label any concrete number as an agent proposal:

| Risk level | Black-box coverage | Other |
| --- | --- | --- |
| High | Stronger criterion: 3-value BVA, all transitions, all feasible decision-table columns | Branch coverage where code-level risk exists, plus exploratory sessions |
| Medium | Standard criterion: 2-value BVA, valid transitions, each choice | Statement coverage if measured |
| Low | Minimum criterion: each partition, all states | Smoke tests, checklist |

Subsumption: all transitions includes valid transitions, which includes all states. 3-value BVA is stronger than 2-value BVA. Branch coverage includes statement coverage.

## Default outputs

Use these only when the project has no template.

1. Test plan: context, objectives, scope, assumptions, stakeholders, communication, approval.
2. Risk register (from `test-risk-analysis`).
3. Test approach: test level × test type matrix, technique and coverage per risk, automation, metrics, deliverables.
4. Entry, exit, suspension and resumption criteria.
5. Estimates and schedule (from `test-estimation`).

## Exit check

- Each high product risk has a test approach, or the risk owner knows it is not mitigated by testing.
- Each criterion is measurable and has a source or an approved agent proposal.
- The estimate shows its technique and its assumptions.
- The approver approved the plan.
- You ran the `correct` skill in sweep mode on the changes of this phase. Each mistake class that it found has a check that stops it, or the user decided to accept it.

## Anti-patterns

- You select tools before you know the risks.
- You set "100% coverage" as a target without a coverage criterion.
- You copy a test plan from another project without new risk analysis.
- You write exit criteria that nobody can measure.

## Sources

- ISTQB CTFL Syllabus v4.0.1, §5.1 Test Planning: test plan §5.1.1, entry and exit criteria §5.1.3, test pyramid §5.1.6, testing quadrants §5.1.7.
- ISTQB CTFL Syllabus v4.0.1, §5.2 Risk Management, §2.2 Test Levels and Test Types.
