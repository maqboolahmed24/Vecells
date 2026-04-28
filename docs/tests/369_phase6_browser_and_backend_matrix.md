# 369 Browser And Backend Matrix

| Family                          | Browser proof                                                                                                             | Backend proof                                                                                                                                | Machine-readable evidence                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Eligibility and provider choice | Patient chooser proves visible provider set, warned-choice acknowledgement, stale proof recovery, and mobile parity.      | `369_phase6_core_suite` proves eligible and ineligible dispositions using the rule-pack engine.                                              | `data/test/369_eligibility_and_provider_choice_cases.csv` |
| Directory and capability        | Patient chooser exposes valid, warned, and stale choice states.                                                           | Directory harness proves DoHS-style source success, zero-provider response, capability states, and source failure classification.            | `data/test/369_directory_drift_and_capability_cases.csv`  |
| Dispatch and proof              | Patient status and staff workbench prove pending, guarded, and contradiction postures without calm completion.            | Dispatch harness proves plan reuse, idempotent resend, stale consent fail-closed behavior, proof expiry, and authoritative proof settlement. | `data/test/369_dispatch_idempotency_and_proof_cases.csv`  |
| Outcome reconciliation          | Staff assurance workbench proves weak-match and unmatched review gates remain visible.                                    | Outcome harness proves structured ingest, replay duplicate handling, weak-match review, urgent contradiction reopen, and closure gating.     | `data/test/369_outcome_reconciliation_cases.csv`          |
| Cross-surface truth             | Patient status, request-child lineage from task 368, and pharmacy console proof states are checked for non-contradiction. | Integration tests assert patient projection does not outrun authoritative dispatch or outcome truth.                                         | `data/test/369_suite_results.json`                        |

## Commands

```bash
pnpm exec vitest run tests/integration/369_phase6_core_suite.spec.ts
pnpm exec tsx tests/playwright/369_patient_provider_choice_and_dispatch.spec.ts --run
pnpm exec tsx tests/playwright/369_staff_dispatch_and_pending_proof.spec.ts --run
pnpm exec tsx tests/playwright/369_outcome_review_and_reconciliation.spec.ts --run
pnpm validate:369-phase6-core-suite
```
