# 346 Pharmacy Case State Machine And Lineage Linkage

`par_346` makes `PharmacyCase` the executable Phase 6 branch authority instead of leaving pharmacy work as a detached referral thread.

## What is authoritative

- [phase6-pharmacy-case-kernel.ts](/Users/test/Code/V/packages/domains/pharmacy/src/phase6-pharmacy-case-kernel.ts) is the only mutation authority for Phase 6 pharmacy case movement.
- The kernel creates one canonical `LineageCaseLink(caseFamily = pharmacy)` on the active request lineage.
- Every mutating command verifies the current `RequestLifecycleLease`, `ownershipEpoch`, `LineageFence`, and `ScopedMutationGate` admission posture before applying state changes.
- Stale or superseded writes mint or refresh a `StaleOwnershipRecoveryRecord` and append a rejected transition audit instead of mutating silently.

## State machine

The executable status vocabulary is frozen to:

- `candidate_received`
- `rules_evaluating`
- `ineligible_returned`
- `eligible_choice_pending`
- `provider_selected`
- `consent_pending`
- `package_ready`
- `dispatch_pending`
- `referred`
- `consultation_outcome_pending`
- `outcome_reconciliation_pending`
- `resolved_by_pharmacy`
- `unresolved_returned`
- `urgent_bounce_back`
- `no_contact_return_pending`
- `closed`

The kernel centralises legality through one transition index derived from the `342` freeze pack. Commands may request movement, but they do not define their own status graph.

## Lineage and closure posture

- Creation writes the case and its `LineageCaseLink` together, keeping the pharmacy branch on the same request lineage as the source request.
- `LineageCaseLink.currentConfirmationGateRefs` mirrors the case’s confirmation gates.
- `LineageCaseLink.currentClosureBlockerRefs` mirrors closure blockers, reachability dependencies, and any active stale-owner recovery.
- `LifecycleCoordinator` remains the only request-closure authority. The pharmacy kernel can settle a pharmacy case to `closed`, but it still requires an explicit lifecycle-close approval input and refuses closure while confirmation, blocker, reachability, or identity-repair debt remains.

## Reserved seams respected here

- `choiceSessionRef`, `selectedProviderRef`, `activeConsentRef`, `activeDispatchAttemptRef`, `outcomeRef`, and `bounceBackRef` remain typed first-class references.
- `346` stores and validates those references but does not implement the full `343` or `344` business algorithms behind them.
- `reopen` is supported as an explicit governed command so later return, bounce-back, and frontend tracks inherit a stable case identity instead of re-inventing reopen semantics.
