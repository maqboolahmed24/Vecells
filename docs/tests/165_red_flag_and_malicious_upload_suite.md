# 165 Red-Flag And Malicious Upload Suite

Task `seq_165` proves the Phase 1 safety gate against the current simulator-backed stack. The suite is grounded in the frozen rule pack at `data/contracts/150_safety_rule_pack_registry.json` and the attachment policy at `data/contracts/141_attachment_acceptance_policy.json`; it does not copy external spreadsheets or fetch live malicious content.

## Proof Surfaces

| Surface       | Artifact                                                  | Purpose                                                                                                                                                                   |
| ------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rule corpus   | `data/test/165_red_flag_decision_cases.csv`               | Row-level expected outcomes for every current safety rule plus boundary, dependency, degraded evidence, and urgent-settlement separation cases.                           |
| Upload corpus | `data/test/165_malicious_upload_cases.csv`                | Deterministic safe fixtures for unsupported, unreadable, oversized, duplicate, extension-mismatched, policy-disallowed, scanner-timeout, and mixed-batch unsafe evidence. |
| Event chains  | `data/test/165_expected_settlement_and_event_chains.json` | Expected upload events, fallback-review continuity, and urgent diversion settlement distinctions.                                                                         |
| Browser lab   | `docs/tests/165_red_flag_and_upload_lab.html`             | Same-shell `Safety_Gate_Lab` with decision ladder, evidence classifier ribbon, urgent settlement ladder, and parity tables.                                               |
| Validator     | `tools/test/validate_red_flag_and_upload_suite.py`        | Drift checks across source artifacts, machine-readable fixtures, docs, scripts, and browser parity.                                                                       |

## Automated Enforcement

`packages/domains/intake_safety/tests/165_red_flag_decision_cases.test.ts` runs the real synchronous safety engine for every decision row and asserts:

| Invariant                                                 | Enforcement                                                                                                                  |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Every frozen rule row has an automated assertion          | Rule IDs from `phase1SynchronousSafetyRulePackRegistry` must equal the rule-level rows in `165_red_flag_decision_cases.csv`. |
| Expected decision class and requested state match runtime | `decisionOutcome` and `requestedSafetyState` are asserted for every row.                                                     |
| Rule contribution lists are exact                         | Hard-stop, urgent, residual, and reachability contributing IDs must match each row.                                          |
| Degraded evidence fails closed                            | Manual-review evidence stays `potentially_clinical`, `fail_closed_review`, and `blocked_manual_review`.                      |
| Urgent required is not urgent issued                      | The safety engine cannot create `UrgentDiversionSettlement` as part of red-flag evaluation.                                  |

`services/command-api/tests/165_red_flag_and_upload_suite.integration.test.js` runs the command-api attachment seam and asserts:

| Invariant                                     | Enforcement                                                                                                   |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Uploads are not trusted before scan promotion | Pending, rejected, quarantined, and retryable states expose no governed preview grant.                        |
| Quarantine is explicit                        | Unsafe scanner verdicts emit `intake.attachment.quarantined` and settle `replace_or_remove_then_review`.      |
| Fallback review remains visible               | Unresolved or unsafe evidence cannot produce `routine_submit_allowed` for the triggering batch.               |
| Duplicate evidence is idempotent              | Duplicate upload replay points at the existing attachment lineage rather than creating a second trusted file. |
| Mixed batch is not falsely calm               | One unsafe file in a batch blocks calm routine submit for the whole active attachment batch.                  |

`tests/playwright/165_red_flag_and_upload_lab.spec.js` verifies the browser-visible proof:

| Browser Requirement                         | Enforcement                                                                                     |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Decision-table rendering and row sync       | Selecting rule cases updates the ladder, classifier ribbon, inspector, and parity rows.         |
| Urgent-required vs urgent-issued separation | Pending and issued settlement buttons expose different visual and semantic states.              |
| Failed-safe upload continuity               | Quarantined and unresolved upload cases remain same-shell with review-required posture.         |
| Keyboard traversal and landmarks            | Rail traversal supports arrow, home, and end keys; header/nav/main/aside landmarks are present. |
| Responsive and reduced-motion equivalence   | Mobile, tablet, desktop, and reduced-motion runs keep diagram/table parity.                     |

## Gap Closures

| Gap                                       | Closure                                                                                                                      |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Decision table checked only happy paths   | The suite asserts every current rule-pack rule ID and selected boundary/dependency rows.                                     |
| Urgent advice implied issuance            | Settlement chains and the lab keep `urgent_diversion_required`, `pending`, `issued`, `failed`, and `superseded` distinct.    |
| Unsafe uploads treated as backend-only    | Upload fixtures assert quarantine events, submit dispositions, preview/grant posture, and same-shell continuity.             |
| Dangerous or drifting external files      | Fixtures are repository-local strings and simulator scenario IDs; no live malware is fetched.                                |
| Failed-safe evidence could appear routine | Validator and integration tests reject calm routine receipts for quarantined, unresolved, rejected, or mixed unsafe batches. |
