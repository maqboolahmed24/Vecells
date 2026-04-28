# 182 Wrong-Patient Freeze, Release, and Compensation Controls

## Security Posture

Wrong-patient repair is treated as a freeze-first security incident. `IdentityRepairOrchestrator` records immutable `IdentityRepairSignal` inputs, reuses one active `IdentityRepairCase` per frozen binding, and commits a single `IdentityRepairFreezeRecord` before correction or release can occur.

The freeze blocks stale authority immediately:

- `SessionGovernor` terminates or rotates stale sessions for the frozen binding.
- `AccessGrantService` supersedes PHI and transaction grants with identity-repair cause.
- Stale `RouteIntentBinding` records are superseded with the new identity-repair lineage fence.
- Non-essential outbound communications are frozen so wrong-patient delivery cannot continue.
- `PatientIdentityHoldProjection` and `PatientActionRecoveryProjection` degrade views to safe summary-only, read-only, or recovery-only posture.

## Release Controls

Release is intentionally slower than freeze. A case cannot release until all of the following are true:

- The exact-once freeze is active and has an `issuedFor=identity_repair` lineage fence.
- A supervisor approval and independent review are both recorded.
- `IdentityBindingAuthority` accepts a `correction_applied` or `revoked` binding settlement.
- All `IdentityRepairBranchDisposition` records are closed as quarantined, compensated, rebuilt, terminally suppressed, already safe, or manual-review closed.
- Projection rebuild and communication release are attached to one `IdentityRepairReleaseSettlement`.

Fresh sessions, grants, route intents, and non-essential communications resume only after that release settlement. This prevents unreviewed release, partial freezes, and second-case duplication.

## Compensation And Branch Controls

Downstream branches are enumerated because wrong-patient leakage is rarely contained to one request shell. The implementation inventories request shell, episode state, conversation/callback, external message delivery, file/artifact visibility, support workspace continuity, telephony continuation, and analytics/event branches. Each branch is assigned one of the required dispositions: `suppress_visibility`, `revalidate_under_new_binding`, `compensate_external`, `manual_review_only`, `already_safe`, or `rebuild_required`.

External side effects are never silently reopened. They must be compensated or manually reviewed. Local staged artifacts can be suppressed, rebuilt, or released only after authority correction and branch settlement.

## OWASP And Privacy Notes

The chain reduces OWASP access-control and insecure direct object reference risk by refusing route-local patient identity mutation. Patient identifiers and PHI are not taken from stale request/session/grant posture during repair. The hold projection blocks stale PHI details rather than returning a 404, a generic redirect, or a stale detail page.

The controls close:

- `PARALLEL_INTERFACE_GAP_PHASE2_IDENTITY_REPAIR_SIGNAL_CONVERGENCE_V1`
- `PARALLEL_INTERFACE_GAP_PHASE2_IDENTITY_REPAIR_FREEZE_FIRST_V1`
- `PARALLEL_INTERFACE_GAP_PHASE2_IDENTITY_REPAIR_BRANCH_DISPOSITION_V1`
- `PARALLEL_INTERFACE_GAP_PHASE2_IDENTITY_REPAIR_AUTHORITY_CORRECTION_V1`
- `PARALLEL_INTERFACE_GAP_PHASE2_IDENTITY_REPAIR_HOLD_PROJECTION_V1`
- `PARALLEL_INTERFACE_GAP_PHASE2_IDENTITY_REPAIR_RELEASE_SETTLEMENT_V1`
