# 308 Phase 4 Manage, Waitlist, Assisted Booking, and Reconciliation Test Plan

This plan binds the second release-grade Phase 4 proof battery to the remaining booking-engine surfaces that can still create false calmness after the core 307 suite: appointment manage truth, waitlist continuity truth, staff-assisted booking lineage, and reconciliation or disputed-confirmation posture.

## Scope

- Appointment manage command truth: `PatientAppointmentManageProjection`, `AppointmentManageCommand`, capability tuple freshness, confirmation-truth gating, and route-continuity fences.
- Waitlist continuity truth: `WaitlistEntry`, `WaitlistOffer`, `WaitlistDeadlineEvaluation`, `WaitlistFallbackObligation`, and `WaitlistContinuationTruthProjection`.
- Staff-assisted booking lineage: `StaffBookingHandoffProjection`, handoff-panel ownership, decision epoch, lease fences, compare anchors, and stale-owner recovery.
- Reconciliation and dispute truth: `ExternalConfirmationGate`, append-only callback handling, disputed confirmation posture, patient and staff status parity, and recovery-only artifact posture.
- Browser-visible proofs: Playwright traces, accessibility snapshots, status-region assertions, and same-shell route markers for the highest-risk patient and staff surfaces.

## Suite Map

| Suite                                      | Files                                                                    | Governing objects                                                                                 | Failure modes closed                                                                                                                                                          |
| ------------------------------------------ | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Manage command truth                       | `tests/integration/308_manage_command_truth.spec.ts`                     | `AppointmentManageCommand`, `PatientAppointmentManageProjection`, capability tuple hash           | Stale calmness reopens cancel or reschedule, stale tuple drift permits reminder or detail mutation, replay widens cancel or reschedule settlement                             |
| Waitlist deadline and fallback             | `tests/integration/308_waitlist_deadline_and_fallback.spec.ts`           | `WaitlistDeadlineEvaluation`, `WaitlistFallbackObligation`, `WaitlistContinuationTruthProjection` | Offer expiry or supersession resets fallback debt, callback or hub fallback loses authoritative deadline, route-local heuristics mint a calmer truth than the waitlist engine |
| Assisted booking handoff and lease         | `tests/integration/308_assisted_booking_handoff_and_lease.spec.ts`       | assisted booking handoff rules, decision epoch, review lease, lineage fence                       | Staff handoff loses lineage, stale epoch still mutates, stale lease reopens compare controls, linkage blocker degrades into ordinary booking UI                               |
| Reconciliation and dispute truth           | `tests/integration/308_reconciliation_and_dispute_truth.spec.ts`         | `ExternalConfirmationGate`, reconciliation attempts, disputed confirmation posture                | Callback-before-read produces quiet success, duplicate callbacks widen booking history, manual attention is hidden, duplicate calm confirmations appear                       |
| Waitlist property permutations             | `tests/property/308_waitlist_truth_properties.spec.ts`                   | deadline monotonicity, fallback monotonicity                                                      | Revalidation or supersession resets deadline authority, callback and hub fallback drift away from the current waitlist truth                                                  |
| Manage browser truth                       | `tests/playwright/308_patient_manage_truth.spec.ts`                      | patient manage shell, capability markers, stale and pending postures                              | Browser-visible manage posture diverges from capability or confirmation truth, focus or target safety regresses on destructive controls                                       |
| Waitlist browser truth                     | `tests/playwright/308_waitlist_offer_and_fallback.spec.ts`               | patient waitlist stage, expiry and fallback markers                                               | Offer available, expired, superseded, and callback fallback wording drift from the active `WaitlistContinuationTruthProjection`                                               |
| Staff-assisted browser truth               | `tests/playwright/308_staff_assisted_booking_and_recovery.spec.ts`       | `StaffBookingHandoffProjection`, compare anchors, stale-owner recovery                            | Assisted booking appears as an unfenced UI panel, stale-owner drift still permits mutation, pending confirmation looks booked                                                 |
| Reconciliation browser and artifact parity | `tests/playwright/308_reconciliation_status_and_artifact_parity.spec.ts` | patient confirmation shell, artifact parity frame, staff reconciliation shell                     | Recovery wording diverges across patient, staff, and artifact surfaces, disputed confirmation still grants export or handoff calmness                                         |

## Case IDs

- `MANAGE308_001`: live manage posture remains writable only while the current capability tuple and confirmation truth stay current.
- `MANAGE308_002`: cancel replay, detail update, and reminder mutation fail closed on stale tuple or stale publication drift.
- `MANAGE308_003`: stale or summary-only manage postures never reopen ordinary manage controls.
- `WAIT308_001`: booked acceptance preserves authoritative waitlist deadline and fallback debt.
- `WAIT308_002`: expiry and supersession preserve provenance and never reset fallback authority.
- `WAIT308_003`: callback and hub fallback stay monotone under repeated refresh and supersession.
- `ASSIST308_001`: staff handoff preserves one governing lineage and decision epoch from compare entry onward.
- `ASSIST308_002`: stale review lease and stale-owner drift freeze mutation until explicit reacquire.
- `ASSIST308_003`: linkage blockers and pending settlement remain explicit and non-booked.
- `RECON308_001`: out-of-order callbacks remain pending until authoritative read confirms the booking.
- `RECON308_002`: duplicate or stale callbacks collapse onto one booking chain and one manual-attention posture.
- `RECON308_003`: manual reconciliation closes disputed truth without minting duplicate calm confirmations.
- `BROWSER308_001`: patient manage browser posture stays aligned with the governing capability and confirmation truth.
- `BROWSER308_002`: waitlist browser posture stays aligned with the active offer, expiry, supersession, and callback fallback truth.
- `BROWSER308_003`: staff-assisted booking browser posture preserves lineage, focus protection, and stale-owner fencing.
- `BROWSER308_004`: reconciliation-required patient, staff, and artifact postures remain monotone and recovery-only where required.
- `PROP308_001`: waitlist deadline and fallback authority stay monotone across booked, callback, and hub continuations.

## Evidence Lab

`docs/testing/308_phase4_manage_waitlist_truth_lab.html` is the reviewer-facing evidence surface for this battery. It keeps one scenario rail, one synchronized truth canvas for manage, waitlist, assisted booking, and reconciliation, plus an inspector and evidence table that mirror the machine-readable bundle.

## Run Commands

```bash
pnpm exec vitest run \
  /Users/test/Code/V/tests/integration/308_manage_command_truth.spec.ts \
  /Users/test/Code/V/tests/integration/308_waitlist_deadline_and_fallback.spec.ts \
  /Users/test/Code/V/tests/integration/308_assisted_booking_handoff_and_lease.spec.ts \
  /Users/test/Code/V/tests/integration/308_reconciliation_and_dispute_truth.spec.ts \
  /Users/test/Code/V/tests/property/308_waitlist_truth_properties.spec.ts
pnpm exec tsx /Users/test/Code/V/tests/playwright/308_patient_manage_truth.spec.ts --run
pnpm exec tsx /Users/test/Code/V/tests/playwright/308_waitlist_offer_and_fallback.spec.ts --run
pnpm exec tsx /Users/test/Code/V/tests/playwright/308_staff_assisted_booking_and_recovery.spec.ts --run
pnpm exec tsx /Users/test/Code/V/tests/playwright/308_reconciliation_status_and_artifact_parity.spec.ts --run
pnpm validate:308-phase4-manage-waitlist-assisted-matrix
```

## Evidence Bundle Requirements

The machine-readable bundle in `data/test-reports/308_manage_waitlist_assisted_results.json` must record, for every case:

- `providerRef`
- `environmentId`
- `seed`
- `artifactRefs`
- `status` from `passed`, `failed`, `blocked`, or `unsupported`

The companion `data/test-reports/308_manage_waitlist_assisted_failure_clusters.json` must preserve any blocked or unsupported paths explicitly instead of collapsing them into passes. An empty cluster array is acceptable only if every case remains either passed or intentionally represented elsewhere in the status counts.
