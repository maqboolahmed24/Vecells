# 232 Workspace Consistency Projection And Trust Envelope

## Scope

`par_232` publishes the backend read model that turns task, lease, trust, publication, anchor, and completion drift into one canonical staff-workspace posture. The implementation lives in:

- `packages/domains/identity_access/src/workspace-consistency-projection-backbone.ts`
- `services/command-api/src/workspace-consistency-projection.ts`
- `services/command-api/src/service-definition.ts`

## Source anchors

The projector follows these local sections:

1. `blueprint/phase-0-the-foundation-protocol.md#1.44 StaffWorkspaceConsistencyProjection`
2. `blueprint/phase-0-the-foundation-protocol.md#1.45 WorkspaceSliceTrustProjection`
3. `blueprint/phase-0-the-foundation-protocol.md#1.45A WorkspaceTrustEnvelope`
4. `blueprint/phase-0-the-foundation-protocol.md#1.47A ProtectedCompositionState`
5. `blueprint/staff-workspace-interface-architecture.md#StaffWorkspaceConsistencyProjection`
6. `blueprint/staff-workspace-interface-architecture.md#WorkspaceTrustEnvelope`
7. `blueprint/staff-workspace-interface-architecture.md#WorkspaceContinuityEvidenceProjection`
8. `blueprint/phase-3-the-human-checkpoint.md#3A`
9. `docs/architecture/226_phase3_triage_contract_and_workspace_state_model.md`
10. `docs/architecture/228_phase3_endpoint_decision_approval_and_escalation_contracts.md`

## Projection family

The stack now materializes one bundle per task-context query:

- `StaffWorkspaceConsistencyProjection`
- `WorkspaceSliceTrustProjection`
- `ProtectedCompositionState`
- `WorkspaceContinuityEvidenceProjection`
- `WorkspaceTrustEnvelope`

The query surface is `GET /v1/workspace/tasks/{taskId}/context`. A narrower internal read is also published at `GET /internal/v1/workspace/tasks/{taskId}/trust-envelope`.

## Assembly model

### 1. Consistency first

`StaffWorkspaceConsistencyProjection` binds:

- task id and request id
- current review version
- workspace snapshot version
- governing object refs
- entity version refs
- route-family match
- route-contract match
- publication tuple parity
- anchor continuity class
- consequence drift class

It emits one `causalConsistencyState`:

- `consistent`
- `stale_recoverable`
- `recovery_required`

That state is necessary but never sufficient for writability.

### 2. Trust stays separate from visibility

`WorkspaceSliceTrustProjection` resolves queue, task, attachment, assistive, and dependency trust independently. The render mode is derived from the worst current slice:

- `interactive`
- `observe_only`
- `recovery_required`

This closes the old shortcut where a visible task route could be misread as a healthy task surface.

### 3. Protected composition is explicit

`ProtectedCompositionState` is published only when focus-protected work exists. It keeps:

- draft artifact refs
- primary selected anchor
- compare anchors
- insertion point
- reading target
- quiet return target
- release gate

Trust drift, publication drift, anchor invalidation, and settlement drift downgrade this state to `stale_recoverable`; ownership or lineage invalidation downgrades it to `recovery_only`. In both cases the work stays visible as frozen provenance.

### 4. Continuity evidence governs same-shell completion

`WorkspaceContinuityEvidenceProjection` carries:

- selected-anchor tuple
- route-family binding
- source queue snapshot
- latest completion settlement ref
- latest prefetch window ref
- latest next-task launch lease ref
- publication tuple
- deterministic `continuityTupleHash`

Anchor drift is explicit:

- `confirmed`
- `stale_remappable`
- `lost_recovery_required`

Completion and next-task posture are derived from this projection, not from route transitions or local success banners.

### 5. Trust envelope is the only writable truth

`WorkspaceTrustEnvelope` is now the sole authority for:

- `envelopeState`
- `mutationAuthorityState`
- `interruptionPacingState`
- `completionCalmState`
- `blockingReasonRefs[]`
- `requiredRecoveryAction`

The envelope hashes the current coherence tuple through `consistencyTupleHash` and `trustTupleHash`. Downstream UI work can render from this one object without recomputing mutability from route presence, local cache, or optimistic draft state.

## Envelope laws implemented

### Writability

`mutationAuthorityState = live` is legal only when:

- the consistency projection is effectively current
- slice trust remains interactive
- both review and lifecycle leases are live
- continuity evidence is trusted
- no ownership tuple drift exists

Otherwise the envelope falls to `frozen` or `blocked`.

### Interruptions

`interruptionPacingState` is derived from:

- focus protection presence
- protected-composition validity
- continuity blockers
- recovery posture

The resulting states are:

- `live`
- `buffered`
- `blocking_only`
- `recovery_only`

### Calm completion

`completionCalmState` is derived from:

- authoritative completion settlement class
- continuity validation
- next-task launch readiness
- live lease and trust posture

The workspace therefore cannot quietly complete or surface next-task readiness while continuity or settlement is stale.

## Same-shell recovery outcomes

The projector keeps the current shell and exposes the shortest safe recovery step:

- `refresh_projection`
- `repair_anchor`
- `reacquire_lease`
- `supervised_takeover`
- `review_consequence_drift`

That closes the detaching-page failure mode described in the Phase 0 and Phase 3 workspace laws.

## Current explicit seams

Two temporary seams remain explicit and machine-readable:

1. `WorkspaceFocusProtectionLease` still enters the projector through typed placeholder refs until its dedicated writer lands.
2. `DecisionEpoch` and duplicate invalidation still enter as typed consequence-state inputs until the sibling Phase 3 consequence tracks publish live feeds.

Those seams are recorded in `data/analysis/PARALLEL_INTERFACE_GAP_PHASE3_WORKSPACE_TRUST_ENVELOPE.json`.
