# 342 Phase 6 Pharmacy Case And Rules API

The first API surface exists to let `346` and `347` implement against one shared command vocabulary.

## Command surface

| Operation | Route | Primary preconditions | Primary exits |
| --- | --- | --- | --- |
| createPharmacyCase | POST /v1/pharmacy/cases | A pharmacy-suitable source decision exists on the current request lineage.<br>A new or reused pharmacy LineageCaseLink(caseFamily = pharmacy) can be acknowledged without violating lineage fences. | candidate_received |
| getPharmacyCase | GET /v1/pharmacy/cases/{pharmacyCaseId} | The caller has a minimum-necessary audience view for the pharmacy case. | read_only |
| evaluatePharmacyCase | POST /v1/pharmacy/cases/{pharmacyCaseId}:evaluate | Current status is candidate_received or rules_evaluating.<br>The active PharmacyRulePack and threshold family registry are resolvable for the evaluation instant. | rules_evaluating<br>ineligible_returned<br>eligible_choice_pending |
| choosePharmacyProvider | POST /v1/pharmacy/cases/{pharmacyCaseId}:choose-provider | Current status is eligible_choice_pending or consent_pending.<br>The selected provider is still present in the current choice proof and any override acknowledgement requirement is satisfied. | provider_selected<br>consent_pending<br>package_ready |
| dispatchPharmacyReferral | POST /v1/pharmacy/cases/{pharmacyCaseId}:dispatch | Current status is package_ready or consent_pending.<br>The current PharmacyConsentCheckpoint.checkpointState is satisfied at command time. | dispatch_pending<br>referred<br>consent_pending |
| capturePharmacyOutcome | POST /v1/pharmacy/cases/{pharmacyCaseId}:capture-outcome | Current status is referred, consultation_outcome_pending, or outcome_reconciliation_pending.<br>The governing dispatch tuple and continuity evidence remain current for the case. | consultation_outcome_pending<br>outcome_reconciliation_pending<br>resolved_by_pharmacy<br>unresolved_returned<br>urgent_bounce_back<br>no_contact_return_pending |
| reopenPharmacyCase | POST /v1/pharmacy/cases/{pharmacyCaseId}:reopen | Current status is unresolved_returned, urgent_bounce_back, no_contact_return_pending, or outcome_reconciliation_pending.<br>Any reopened branch binds back to the same RequestLineage and current pharmacy child link. | candidate_received<br>rules_evaluating<br>consent_pending |
| closePharmacyCase | POST /v1/pharmacy/cases/{pharmacyCaseId}:close | Current status is resolved_by_pharmacy.<br>currentConfirmationGateRefs, currentClosureBlockerRefs, and activeReachabilityDependencyRefs are all empty or settled. | closed |

## Failure-class law

- `duplicate_case_conflict`
- `illegal_transition`
- `missing_threshold_family`
- `pack_mutation_rejected`
- `choice_proof_superseded`
- `override_ack_missing`
- `consent_invalid`
- `route_intent_drift`
- `outcome_match_ambiguous`
- `closure_blocker_open`
- `reachability_dependency_open`
- `stale_write`

## Idempotency and stale-write rules

- Every POST command binds an exact idempotency tuple to the current case, pack, selection, package, or outcome evidence hash.
- Stale writes fail closed. They may not silently overwrite the current owner epoch or calm the visible state.
- Audit append requirements are part of the command contract, not implementation detail.

See the machine-readable source of truth in [342_phase6_api_surface.yaml](/Users/test/Code/V/data/contracts/342_phase6_api_surface.yaml).
