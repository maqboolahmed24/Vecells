# 405 Algorithm Alignment Notes

Reviewed on 2026-04-27.

## Local Source Alignment

| Source requirement | Frozen artifact |
| --- | --- |
| Phase 8 8H requires formal model-change control before AI changes become operationally real. | `data/contracts/405_assistive_release_candidate_contracts.json` defines `ModelChangeRequest`, `ChangeImpactAssessment`, `AssistiveReleaseCandidate`, and assurance baseline objects. |
| Approval must bind to an immutable candidate, not loose version refs. | `AssistiveReleaseCandidate.candidateHash` is computed from model, prompt, policy, schema, calibration, runtime, route, evaluation, subprocessor, baseline, and rollback refs. |
| Regulatory routing must distinguish IM1 RFC, SCAL, DTAC, DCB0129, DCB0160, DPIA, and MHRA or medical-device reassessment. | `data/contracts/405_regulatory_change_control_rules.json` defines the decision outputs, trigger matrix, `RFCBundle`, `RegulatoryTriggerRule`, and `RegulatoryChangeDecision`. |
| Medical-purpose boundaries must distinguish transcription, summarisation/inference, and endpoint suggestion/decision support. | The release candidate contract includes boundary states and fail-closed escalation; the trigger matrix escalates endpoint suggestion and intended-use changes to the highest assurance profile. |
| No-self-approval and independent safety/deployment signoff are mandatory. | `data/contracts/405_release_approval_graph_contract.json` freezes `ReleaseApprovalGraph`, `NoSelfApprovalCheck`, role assignments, approval profiles, and action settlement. |
| Supplier and subprocessor assurance must have freshness and drift semantics. | `SubprocessorAssuranceRef`, `SupplierDriftGate`, and `AssuranceFreshnessGate` block promotion on stale, drifted, suspended, withdrawn, or blocked assurance. |
| Rollback readiness must be first-class. | `data/contracts/405_rollback_and_assurance_freeze_contracts.json` defines `RollbackReadinessBundle` and `RollbackCompatibilityAssessment` with explicit data, policy, runtime, schema, kill-switch, runbook, and verification requirements. |
| Freeze and rollback actions must chain through route intent, action record, settlement, and recovery disposition. | `AssistiveReleaseActionRecord`, `AssistiveReleaseActionSettlement`, `AssuranceFreezeState`, and `AssuranceFreezeLiftRecord` require settlement refs and recovery disposition. |

## Support Objects Added

- `RegulatoryTriggerRule`: keeps the trigger matrix versioned and fail-closed.
- `RegulatoryChangeDecision`: preserves the resolved decision outputs behind each impact assessment.
- `ProductDocumentationDelta`: binds SCAL, DTAC, DPIA, safety, product wording, and regulatory documentation updates to the candidate hash.
- `ReleaseApprovalRoleAssignment`: makes actor-role conflicts machine-checkable.
- `ReleaseSignoffRecord`: binds role signoff to one candidate hash.
- `NoSelfApprovalCheck`: prevents maker/requester/deployment conflicts from satisfying independent review.
- `AssistiveReleaseActionSettlement`: prevents UI acknowledgement or command dispatch from implying authoritative completion.
- `RollbackCompatibilityAssessment`: provides repeatable proof behind rollback readiness.
- `AssuranceFreezeLiftRecord`: makes freeze lifting explicit and auditable.
- `SupplierDriftGate` and `AssuranceFreshnessGate`: make stale assurance a hard promotion blocker.

## Boundary Confirmations

- Actual RFC submission remains out of scope.
- Approval workflow UI remains out of scope.
- Vendor provisioning and deployment remain out of scope.
- Task `417` owns executable evidence pipeline implementation for DTAC, DCB, RFC, and change-control artifacts.
- Task `410` will consume candidate and release state to implement invocation eligibility and kill switches.
- Task `416` will consume freeze and policy freshness semantics.

## Gap Status

No blocking interface gap remains for task `405`. The conservative support objects above are recorded in `data/analysis/405_dependency_and_gap_register.json`, so the fallback file `PHASE8_BATCH_404_411_INTERFACE_GAP_RELEASE_CANDIDATE_AND_CHANGE_CONTROL.json` is not required.
