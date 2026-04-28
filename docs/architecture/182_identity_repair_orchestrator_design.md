# 182 Identity Repair Orchestrator Design

## Scope

`IdentityRepairOrchestrator` owns the Phase 2 wrong-patient repair chain. It consumes `IdentityRepairSignal` records from patient reports, support reports, auth subject conflicts, secure-link subject conflicts, telephony contradictions, downstream contradictions, delivery disputes, and audit replay. It creates or reuses one active `IdentityRepairCase` per frozen identity binding and drives the case through exact-once freeze, downstream quarantine, supervised correction, projection rebuild, and `IdentityRepairReleaseSettlement`.

Wrong-patient correction is not a request state. The orchestrator attaches repair blockers and references to the affected request and episode lineage, but it does not encode repair as `Request.workflowState` or `Episode.state`. That closes the prior repair-as-workflow-state gap and keeps request milestones from being rewritten during identity repair.

## State Model

The durable chain is:

1. `IdentityRepairSignal` is append-only and idempotent by both idempotency key and signal digest.
2. `IdentityRepairCase` is active per `frozenIdentityBindingRef`; repeated credible drift reuses the active case instead of opening a duplicate.
3. `IdentityRepairFreezeRecord` is committed once per case. It advances a lineage fence with `issuedFor=identity_repair`.
4. `IdentityRepairBranchDisposition` enumerates downstream request shell, episode state, conversation/callback, external message delivery, file/artifact visibility, support workspace continuity, telephony continuation, and analytics/event branches.
5. Dual review records supervisor approval and independent review before correction.
6. Corrected or revoked binding posture is settled only through `IdentityBindingAuthority`.
7. `IdentityRepairReleaseSettlement` is the only control point that permits fresh sessions, fresh grants, fresh route intents, communication release, and projection rebuild.

## Seam Consumption

The orchestrator is production-shaped but seam-driven:

| Seam | Responsibility |
| --- | --- |
| `SessionGovernor` | Terminates or rotates stale local sessions for the frozen binding and returns session termination settlements. |
| `AccessGrantService` | Supersedes PHI and transaction grants with cause `identity_repair`; stale grants can only land in recovery. |
| `RouteIntentBinding` supersession | Supersedes route intents that were derived from the wrong binding or stale lineage fence. |
| Communication freeze port | Freezes non-essential patient communications while support and repair channels remain available. |
| Projection degradation port | Materializes `PatientIdentityHoldProjection` and `PatientActionRecoveryProjection` with summary-only, read-only, or recovery-only posture. |
| `IdentityBindingAuthority` | Applies `correction_applied` or `revoked` binding decisions after freeze and review; no route or request writes patient identity directly. |

## Projection Rules

Patient and operator views degrade to safe hold or recovery surfaces:

- `PatientIdentityHoldProjection` hides stale PHI details, blocks stale grant redemption, blocks stale route intent resume, and exposes only a summary reason plus support/recovery actions.
- `PatientActionRecoveryProjection` routes exact replay during active repair to a recovery workspace; it forbids generic 404s, generic redirects, and stale PHI detail leakage.
- Hold posture can leave only through `IdentityRepairReleaseSettlement` after freeze release, authority correction/revocation, projection rebuild, and branch disposition closure.

## Release Modes

`IdentityRepairReleaseSettlement` supports four controlled modes:

| Release mode | Session/grant posture |
| --- | --- |
| `read_only_resume` | Fresh grants and route intents may resume safe read-only surfaces. |
| `claim_pending_resume` | Fresh session establishment may restart a claim-pending posture. |
| `writable_resume` | Fresh session, grant, and route intent authority can resume writable patient actions. |
| `manual_follow_up_only` | No fresh self-service authority is issued; support remains the recovery path. |

## Gap Closures

The implementation explicitly closes:

- `PARALLEL_INTERFACE_GAP_PHASE2_IDENTITY_REPAIR_SIGNAL_CONVERGENCE_V1`
- `PARALLEL_INTERFACE_GAP_PHASE2_IDENTITY_REPAIR_FREEZE_FIRST_V1`
- `PARALLEL_INTERFACE_GAP_PHASE2_IDENTITY_REPAIR_BRANCH_DISPOSITION_V1`
- `PARALLEL_INTERFACE_GAP_PHASE2_IDENTITY_REPAIR_AUTHORITY_CORRECTION_V1`
- `PARALLEL_INTERFACE_GAP_PHASE2_IDENTITY_REPAIR_HOLD_PROJECTION_V1`
- `PARALLEL_INTERFACE_GAP_PHASE2_IDENTITY_REPAIR_RELEASE_SETTLEMENT_V1`

These controls consume the coherent Phase 2 outputs from 176 `SessionGovernor`, 179 `IdentityBindingAuthority`, 180 route capability/scope decisions, and 181 `AccessGrantService` supersession rather than publishing a `PARALLEL_INTERFACE_GAP_PHASE2_IDENTITY_REPAIR.json` placeholder.
