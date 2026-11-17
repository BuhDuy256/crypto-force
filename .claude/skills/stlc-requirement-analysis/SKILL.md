---
name: stlc-requirement-analysis
description: Use when you review requirements before test planning or test design (STLC phase 1, static testing of the test basis). Covers readiness criteria, review of each requirement for completeness, correctness, consistency and testability, comparison with an independent baseline, and anomaly reports. Use also when the user asks "are these requirements ready to test?". Do not use to write or fix requirements, or to design test cases.
---

# Requirement Analysis (STLC Phase 1)

This phase is static testing of the test basis. You examine requirements without running the software. The result serves three readers. The requirement owner learns which requirements are missing, ambiguous or contradictory. The test planner learns which scope is ready. The test designer gets a versioned and confirmed test basis.

## Ground rules

1. Project rules have priority. If the project has templates for this phase, use their structure, IDs and acceptance criteria. Use the default outputs in this skill only when the project has no template.
2. Give a source for each requirement, value or decision. A source is a versioned document, a standard with its section number, or a tool output.
3. Do not invent values. When you propose a value, label it "agent proposal", give the reason, and get approval from the owner.
4. Do not write or change requirements. Do not close open questions for the owner. Report each issue to the requirement owner.
5. Report the facts. If a check fails or you skip a step, say so.

## Entry check

Before you start, check these items. If an item is missing, stop and report it.

- The scope: which requirements, at which version.
- The readiness criteria that the team agreed on. If none exist, propose criteria from step 2 and get approval.
- The owner of each requirement source, who decides on anomalies.
- At least one independent baseline (step 4).

## Steps

1. **List the requirements in scope.** Give each requirement an ID and the version of its source. A requirement without an ID cannot have a traceable result.
2. **Review each requirement against readiness criteria.** Use these default criteria when the project has none:
   - Complete: inputs, outputs, error behavior and constraints are stated.
   - Unambiguous: two readers get the same meaning. Flag vague words such as "fast", "user-friendly", "appropriate", "etc.", "and/or".
   - Consistent: no conflict with other requirements, the domain model or the glossary.
   - Correct: agrees with the source of truth (business rule, standard, regulation).
   - Testable: an observable expected result exists. A number has a unit and a measurement condition.
   - Traceable: links to its origin and has a unique ID.
3. **Record findings as anomalies.** Use these defect types for requirements: inconsistency, ambiguity, contradiction, omission, inaccuracy, redundancy. For each anomaly, record the requirement ID, the type, the evidence (quote the text), the impact on testing, and a recommendation.
4. **Compare with an independent baseline.** Comparing documents that come from the same origin (a spec, the prototype it came from, code written from that spec) only shows where they disagree. It does not show what they all omit. Use a baseline that is independent of that origin:
   - An industry standard for the domain, for example OWASP ASVS for authentication and session, WCAG for accessibility, ISO/IEC 25010 for quality characteristics.
   - Use cases written by a person who did not read the spec.
   Record the baseline, its version and the level you apply. Take IDs and levels from the original standard, not from a summary. Each gap becomes an anomaly in step 3.
5. **Compare requirements with the current implementation, if one exists.** Record each difference. A difference is not automatically a requirement defect. The owner decides which side is correct.
6. **Send anomalies to the owners and track decisions.** Each anomaly gets one decision: fix the requirement, accept as is, defer, or reject. Record open questions in the place where the project manages them.
7. **Set the readiness status of each requirement.** Ready, Ready with accepted limits, or Not ready. Give the anomaly IDs that block it.

## Review organization

Choose the review type by risk and by the formality you need:

| Review type | Use when |
| --- | --- |
| Informal review | Low risk. You need fast feedback |
| Walkthrough | The author leads. The aim is shared understanding |
| Technical review | Technical experts must reach a decision |
| Inspection | High risk. You need metrics and a formal process with entry and exit criteria |

A review has these activities: planning, initiation, individual review, communication and analysis, fixing and reporting. Record who reviewed which requirements, and when.

## Default outputs

Use these only when the project has no template.

1. Requirement readiness: ID, source and version, status, blocking anomalies.
2. Baseline comparison: baseline and level, mapping from baseline items to requirement IDs, list of gaps.
3. Review findings: review type and participants, anomalies, recommendations, decisions.

## Exit check

- Every requirement in scope has a status and a reason.
- Every anomaly has a decision, or is recorded as open in the right place.
- At least one independent baseline was used, and its gaps are recorded.
- Each item in the applicable part of the baseline has a result: covered, partly covered, missing, or not applicable with a reason. At a level with selected items (for example "L1 plus selected L2 items"), each item of that higher level also has a result. An item that is not on the list is a gap in the comparison, not a decision.
- Each "Ready" requirement has a version that test design can cite.
- The requirement list agrees with the current version of each source. If a source changed after you set a status, list the requirements again from the new version, and check each status again. A behavior that a new version adds and that has no requirement ID is an omission.

## Anti-patterns

- You mark the requirements complete because the spec, the prototype and the code agree with each other.
- You fix a requirement yourself instead of reporting the anomaly.
- You report "requirement is unclear" with no quote and no question that the owner can answer.
- You cite a standard ID from a blog or summary instead of the original.

## Sources

- ISTQB CTFL Syllabus v4.0.1, §3 Static Testing (review process §3.2.2, review types §3.2.4, typical defects §3.1.3).
