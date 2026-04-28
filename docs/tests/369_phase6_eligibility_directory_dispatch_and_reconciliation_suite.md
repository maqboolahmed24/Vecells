# 369 Phase 6 Eligibility, Directory, Dispatch, And Reconciliation Suite

Task `seq_369` adds a release-gating proof pack for the first Phase 6 pharmacy loop battery. The suite covers browser-visible patient and staff truth plus backend chains that the browser cannot observe directly.

## Scope

The proof pack covers:

- eligibility pass, fallback, and fail-closed branches
- full provider-choice law, including recommended providers, warned choices, hidden unsafe options, stale proof, and mobile parity
- directory-source and ODS-capability edge cases, including zero-provider and stale/superseded snapshots
- dispatch plan reuse, idempotent resend, proof-risk states, consent drift, and authoritative proof gating
- outcome ingest, replay, weak match, contradiction, unmatched evidence, manual-review gates, and closure blocking

## Executable Proof

Backend proof is in `tests/integration/369_phase6_core_suite.spec.ts`. It composes the existing Phase 6 services and helpers from tasks 347, 348, 350, 351, and 352, so the suite exercises repository-owned behavior rather than a detached mock.

Browser proof is split by user-visible surface:

- `tests/playwright/369_patient_provider_choice_and_dispatch.spec.ts`
- `tests/playwright/369_staff_dispatch_and_pending_proof.spec.ts`
- `tests/playwright/369_outcome_review_and_reconciliation.spec.ts`

The machine-readable proof pack lives in `data/test/369_*` and is validated by `tools/test/validate_369_phase6_core_suite.ts`.

## Release Signal

The local suite is designed to fail the phase honestly. A passing result means the repository-owned deterministic proof is coherent for this slice. It does not claim live NHS onboarding approval, live MESH mailbox approval, or live GP Connect Update Record certification.
