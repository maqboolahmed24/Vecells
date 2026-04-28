# 343 Phase 6 Discovery, Choice, Dispatch, And Outcome API

The first executable API surface for 343 is intentionally transport-neutral and replay-first.

## Discovery and choice commands

| Operation | Route | Primary preconditions | Primary exits |
| --- | --- | --- | --- |
| getPharmacyDirectory | GET /v1/pharmacy/cases/{pharmacyCaseId}/directory | Case is in `eligible_choice_pending`, `provider_selected`, or `consent_pending`.<br>Current rule pack and timing guardrail are resolvable. | read_only |
| refreshPharmacyDirectory | POST /v1/pharmacy/cases/{pharmacyCaseId}:refresh-directory | Active lease and fence are current.<br>Discovery adapters are configured. | directory snapshot, choice proof, disclosure policy |
| selectPharmacyProvider | POST /v1/pharmacy/cases/{pharmacyCaseId}:select-provider | Provider is present in the active visible set.<br>Selected explanation matches the current proof. | provider selection, selected_waiting_consent |
| acknowledgeChoiceOverride | POST /v1/pharmacy/cases/{pharmacyCaseId}:acknowledge-choice-override | Selected provider requires warned-choice or policy override acknowledgement. | override acknowledgement, selected_waiting_consent |
| capturePharmacyConsent | POST /v1/pharmacy/cases/{pharmacyCaseId}:capture-consent | Selected provider, proof, explanation, scope, and binding hash still agree. | consent record, consent checkpoint |

## Dispatch commands

| Operation | Route | Primary preconditions | Primary exits |
| --- | --- | --- | --- |
| composeReferralPackage | POST /v1/pharmacy/cases/{pharmacyCaseId}:compose-package | Consent checkpoint is `satisfied`.<br>Provider, pathway, scope, and selection binding remain current. | package_ready, referral package |
| dispatchPharmacyReferral | POST /v1/pharmacy/cases/{pharmacyCaseId}:dispatch | Frozen package, dispatch plan, and transport assurance profile all match the same tuple.<br>ScopedMutationGate admits the send. | dispatch attempt, proof envelope, settlement |
| recordManualDispatchAssist | POST /v1/pharmacy/dispatch/{dispatchAttemptId}:record-manual-assist | Transport mode is `manual_assisted_dispatch`.<br>Operator and review policy are current. | manual assistance record |

## Outcome and reconciliation commands

| Operation | Route | Primary preconditions | Primary exits |
| --- | --- | --- | --- |
| ingestPharmacyOutcome | POST /v1/pharmacy/outcomes:ingest | Immutable envelope can be formed and replay classified first. | ingest attempt, settlement, optional reconciliation gate |
| resolveOutcomeReconciliationGate | POST /v1/pharmacy/outcomes/{outcomeReconciliationGateId}:resolve | Gate is open or in review.<br>Resolution is one of apply, reopen, or unmatched. | gate resolution, settlement, truth projection refresh |

## Failure-class law

- `choice_provider_not_visible`
- `hidden_top_k_violation`
- `stale_choice_or_consent`
- `consent_binding_mismatch`
- `dispatch_plan_tuple_drift`
- `authoritative_proof_missing`
- `manual_attestation_required`
- `duplicate_outcome_replay`
- `outcome_collision_review_required`
- `weak_match_requires_reconciliation`
- `completion_inferred_from_silence`

## Idempotency and replay rules

- Discovery refresh is idempotent on case, lane, location tuple, and current guardrail.
- Provider selection is idempotent on choice proof, provider ref, and selection binding hash.
- Dispatch is idempotent on package hash, dispatch plan hash, route-intent tuple hash, and transport assurance profile.
- Outcome ingest is idempotent on `replayKey`, `rawPayloadHash`, `semanticPayloadHash`, and trusted correlation chain.
- Exact or semantic replay must settle back to the prior accepted outcome rather than mutating the case a second time.
