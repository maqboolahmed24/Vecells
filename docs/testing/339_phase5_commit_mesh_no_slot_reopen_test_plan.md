# 339 Phase 5 Commit, MESH, No-Slot, and Reopen Test Plan

This plan binds the second final release-grade Phase 5 proof battery to the post-selection surfaces where false calmness, hidden acknowledgement debt, or broken reopen continuity would be most dangerous once a patient has already been offered or booked network care.

## Scope

- Commit and confirmation truth: `HubOfferToConfirmationTruthProjection`, native pending receipts, manual proof, imported confirmation review, and supplier-drift posture.
- Practice continuity and messaging debt: MESH dispatch, delivery, current-generation acknowledgement, explicit `practice informed` versus `practice acknowledged` state, reminder failure, and `PracticeVisibilityProjection` parity.
- Patient parity: network confirmation and network manage routes under pending, confirmed, disputed, drifted, and reopened truth.
- Recovery and reopen continuity: `HubFallbackRecord`, `CallbackFallbackRecord`, `HubReturnToPracticeRecord`, urgent bounce-back, exception selection, and diff-first reopen.
- Evidence publication: one machine-readable result bundle, one failure-cluster report, one reviewer lab, and trace-backed browser artifacts.

## Suite Map

| Suite | Files | Governing objects | Failure modes closed |
| --- | --- | --- | --- |
| Commit truth and confirmation gate | `tests/integration/339_commit_truth_and_confirmation_gate.spec.ts` | `HubOfferToConfirmationTruthProjection`, `ExternalConfirmationGate`, `HubBookingEvidenceBundle` | Raw transport or weak manual evidence widens into booked calmness; imported proof mints final booking truth; supplier drift looks closable |
| MESH route visibility and acknowledgement debt | `tests/integration/339_mesh_route_visibility_and_ack_debt.spec.ts` | `PracticeContinuityPayload`, dispatch attempts, delivery evidence, `PracticeVisibilityProjection` | Practice informed equals practice acknowledged; reminder failures fail to reopen acknowledgement debt; transport state replaces truth state |
| No-slot, callback, return, and reopen continuity | `tests/integration/339_no_slot_callback_return_and_reopen.spec.ts` | `HubFallbackRecord`, `CallbackFallbackRecord`, `HubReturnToPracticeRecord`, supervisor escalation | Callback fallback closes too early; return-to-practice loses provenance; repeated low-novelty bounce silently churns instead of escalating |
| Monotone truth and fallback properties | `tests/property/339_monotone_truth_and_fallback_properties.spec.ts` | truth projection ordering, fallback lead-time law, loop-prevention threshold | Weaker evidence widens to `confirmed`; callback remains available outside the remaining clinical window; escalation threshold drifts |
| Hub commit confirmation and drift browser proof | `tests/playwright/339_hub_commit_confirmation_and_drift.spec.ts` | hub commit pane, continuity drawer, manual proof modal, practice panel | Browser-visible calmness drifts from the governing truth projection; supplier drift hides current acknowledgement state |
| Patient confirmation and manage browser proof | `tests/playwright/339_patient_network_confirmation_and_manage.spec.ts` | patient confirmation route, manage route, embedded mode, repair posture | Patient confirmation and manage views drift apart under pending, disputed, or repair-required truth |
| Practice visibility and acknowledgement browser proof | `tests/playwright/339_practice_visibility_and_acknowledgement.spec.ts` | practice visibility panel, acknowledgement indicator, continuity drawer | Practice informed, acknowledgement pending, and reopened-by-drift collapse into one generic status |
| Hub recovery and reopen browser proof | `tests/playwright/339_hub_recovery_and_reopen.spec.ts` | callback recovery canvas, urgent bounce-back banner, exception queue, reopen diff strip | No-slot recovery loses provenance, exception selection drops the current case anchor, reopen stops being diff-first |

## Case IDs

- `COMMIT339_001`: native pending and weak manual proof remain below booked calmness until corroboration or authoritative confirmation clears the gate.
- `COMMIT339_002`: imported disputes and supplier drift remain weaker than final booked calmness and reopen recovery explicitly.
- `MESH339_001`: MESH transport reachability, delivered-to-practice posture, and explicit acknowledgement debt remain separate.
- `MESH339_002`: later reminder-route failure reopens practice visibility debt and patient/manage recovery posture.
- `FALLBACK339_001`: callback fallback keeps linkage debt explicit until the callback transfer is durably linked.
- `FALLBACK339_002`: return-to-practice reopen continuity persists and repeated low-novelty bounce-back escalates instead of silently retrying.
- `PROP339_001`: weaker evidence classes never widen into `confirmed_pending_practice_ack`, `confirmed`, or `closable`.
- `PROP339_002`: callback cannot outlive the remaining clinical window and loop escalation flips at the required threshold.
- `BROWSER339_001`: hub commit pending, booked, disputed, and supplier-drift postures remain tied to truth projections rather than transport toasts.
- `BROWSER339_002`: patient confirmation and manage routes stay aligned under pending, confirmed, and repair-required truth.
- `BROWSER339_003`: practice visibility and acknowledgement indicators remain distinct across pending acknowledgement and reopened-by-drift postures.
- `BROWSER339_004`: callback recovery, urgent bounce-back, exceptions, and reopen remain provenance-preserving and diff-first.

## Environment Labels

- `hub_commit_truth_local`
- `mesh_continuity_local`
- `hub_recovery_local`
- `hub_shell_desktop_local`
- `patient_network_browser_local`

## Evidence Lab

`docs/testing/339_phase5_commit_mesh_no_slot_reopen_lab.html` is the reviewer-facing operational evidence surface for this battery. It synchronizes one scenario rail, one truth ladder, one central recovery canvas, one right-side inspector, and one lower evidence table so reviewers can inspect the governing truth, route receipts, visibility debt, and artifact links without hover-only disclosure.

## Reviewer Scenarios

- Commit pending without false calmness
- Practice informed but acknowledgement still pending
- Callback transfer pending with explicit linkage debt
- Supplier drift reopening continuity and practice acknowledgement
- Diff-first reopen after new evidence and new capacity

## Run Commands

```bash
pnpm exec tsc -p /Users/test/Code/V/packages/domains/hub_coordination/tsconfig.json --noEmit
pnpm --dir /Users/test/Code/V/apps/hub-desk build
pnpm --dir /Users/test/Code/V/apps/patient-web build
pnpm exec vitest run \
  /Users/test/Code/V/tests/integration/339_commit_truth_and_confirmation_gate.spec.ts \
  /Users/test/Code/V/tests/integration/339_mesh_route_visibility_and_ack_debt.spec.ts \
  /Users/test/Code/V/tests/integration/339_no_slot_callback_return_and_reopen.spec.ts \
  /Users/test/Code/V/tests/property/339_monotone_truth_and_fallback_properties.spec.ts
pnpm exec tsx /Users/test/Code/V/tests/playwright/339_hub_commit_confirmation_and_drift.spec.ts --run
pnpm exec tsx /Users/test/Code/V/tests/playwright/339_patient_network_confirmation_and_manage.spec.ts --run
pnpm exec tsx /Users/test/Code/V/tests/playwright/339_practice_visibility_and_acknowledgement.spec.ts --run
pnpm exec tsx /Users/test/Code/V/tests/playwright/339_hub_recovery_and_reopen.spec.ts --run
pnpm validate:339-commit-mesh-no-slot-reopen
```

## Evidence Bundle Requirements

The machine-readable bundle in `data/test-reports/339_commit_mesh_no_slot_reopen_results.json` must record, for every suite and case:

- `providerRef`
- `environmentId`
- `seed`
- `artifactRefs`
- `status` from `passed`, `failed`, `blocked`, or `unsupported`

The companion `data/test-reports/339_commit_mesh_no_slot_reopen_failure_clusters.json` must preserve repository-owned defect clusters explicitly. For 339 that includes the false-calmness correction in the commit gate and the recorded-at fence correction in alternative-offer expiry evaluation.
