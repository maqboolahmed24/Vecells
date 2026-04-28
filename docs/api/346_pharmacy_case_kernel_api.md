# 346 Pharmacy Case Kernel API

The executable API surface lives in [phase6-pharmacy-case-kernel.ts](/Users/test/Code/V/packages/domains/pharmacy/src/phase6-pharmacy-case-kernel.ts).

## Public service entry points

- `createPhase6PharmacyCaseKernelStore()`
- `createPhase6PharmacyCaseKernelService()`
- `service.createPharmacyCase()`
- `service.getPharmacyCase()`
- `service.verifyMutationAuthority()`
- `service.reserveMutationAuthority()`
- `service.transitionPharmacyCase()`
- `service.evaluatePharmacyCase()`
- `service.choosePharmacyProvider()`
- `service.dispatchPharmacyReferral()`
- `service.capturePharmacyOutcome()`
- `service.reopenPharmacyCase()`
- `service.closePharmacyCase()`

## Command rules

### `createPharmacyCase`

- Idempotent on `originRequestId + pharmacyIntentId + sourceDecisionEpochRef`
- Creates the `PharmacyCase`
- Creates the canonical pharmacy `LineageCaseLink`
- Binds the initial lease, ownership epoch, and lineage fence
- Emits `pharmacy.case.created`

### `evaluatePharmacyCase`

- Requires `candidate_received` or `rules_evaluating`
- Verifies lease, epoch, fence, and gate admission
- Emits `pharmacy.service_type.resolved`
- Emits `pharmacy.pathway.evaluated`
- Settles only to `eligible_choice_pending` or `ineligible_returned`

### `choosePharmacyProvider`

- Requires `eligible_choice_pending` or `consent_pending`
- Persists `choiceSessionRef` and `selectedProviderRef`
- Refreshes `activeConsentCheckpointRef`
- Emits `pharmacy.provider.selected`
- Moves to `provider_selected`, `consent_pending`, or `package_ready`

### `dispatchPharmacyReferral`

- Requires `package_ready` or governed recovery from `consent_pending`
- Never bypasses an unsatisfied checkpoint
- Persists `activeDispatchAttemptRef` and optional confirmation-gate refs
- Emits `pharmacy.dispatch.started`
- Emits `pharmacy.dispatch.confirmed` when proof is strong enough
- Emits `pharmacy.dispatch.proof_missing` when proof remains incomplete

### `capturePharmacyOutcome`

- Requires `referred`, `consultation_outcome_pending`, or `outcome_reconciliation_pending`
- Persists `outcomeRef` and optional `bounceBackRef`
- Emits `pharmacy.outcome.received`, `pharmacy.case.resolved`, `pharmacy.case.bounce_back`, or `pharmacy.reachability.blocked` according to the outcome posture

### `reopenPharmacyCase`

- Requires `unresolved_returned`, `urgent_bounce_back`, `no_contact_return_pending`, or `outcome_reconciliation_pending`
- Rebinds the same governed `PharmacyCase` identity to a lawful reopen target
- Emits `pharmacy.case.reopened`

### `closePharmacyCase`

- Requires `resolved_by_pharmacy`
- Requires lifecycle-close approval
- Refuses close while any confirmation gate, closure blocker, reachability dependency, or unreleased identity-repair branch is active
- Emits `pharmacy.case.closed`
