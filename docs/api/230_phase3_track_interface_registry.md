# 230 Phase 3 Track Interface Registry

## Purpose

This document is the prose companion to [230_phase3_dependency_interface_map.yaml](/Users/test/Code/V/data/contracts/230_phase3_dependency_interface_map.yaml).
The machine-readable file is authoritative.
This page explains the intended use of each interface and the mutation boundary each producer owns.

## Launch authority

For `par_231` to `par_235`, launch authority comes from:

1. the frozen contract packs from `226` to `229`
2. the `230` owner registry
3. the `230` dependency interface map
4. the track-specific `230` launch packets

Prompt-header consume order is not launch authority.

## Interface registry

### `IF_230_TRIAGE_RUNTIME_KERNEL`

- producer: `par_231`
- consumers: `par_232`, `par_233`, `par_234`, `par_235`, `par_241`, `par_242`
- objects:
  - `TriageTask`
  - `ReviewSession`
  - `TaskLaunchContext`
  - `TaskCommandSettlement`

Use:

- consume stable claim and settlement interfaces
- do not redefine claim, release, stale-owner recovery, or task-local fencing outside `par_231`

### `IF_230_WORKSPACE_TRUST_PROJECTIONS`

- producer: `par_232`
- consumers: `par_233`, `par_235`, `par_242`, `par_250`
- objects:
  - `StaffWorkspaceConsistencyProjection`
  - `WorkspaceSliceTrustProjection`
  - `WorkspaceTrustEnvelope`
  - `WorkspaceContinuityEvidenceProjection`
  - `ProtectedCompositionState`

Use:

- consume canonical writability, trust, and continuity truth
- do not let later completion or advice tasks co-own the projection family

### `IF_230_QUEUE_ENGINE`

- producer: `par_233`
- consumers: `par_236`, `par_242`, `par_235`
- objects:
  - `QueueRankPlan`
  - `QueueRankSnapshot`
  - `QueueRankEntry`
  - `QueueAssignmentSuggestionSnapshot`

Use:

- read canonical queue order
- consume reviewer-fit suggestions as hints only
- do not rewrite order downstream

### `IF_230_DUPLICATE_INVALIDATION`

- producer: `par_234`
- consumers: `par_238`, `par_239`, `par_240`, `par_243`, `par_244`, `par_249`, `par_251`
- objects:
  - `DuplicatePairEvidence`
  - `DuplicateReviewSnapshot`
  - `DuplicateResolutionDecision`

Use:

- consume explicit invalidation when stale duplicate assumptions are overturned
- never use duplicate review as a substitute for replay authority

### `IF_230_REVIEW_BUNDLE`

- producer: `par_235`
- consumers: `par_238`, `par_243`, `par_244`, `par_246`
- objects:
  - `ReviewBundle`
  - `SuggestionEnvelope`
  - `EvidenceDeltaPacket`

Use:

- consume deterministic staff-ready summaries
- keep suggestion seams non-authoritative

### `IF_230_ENDPOINT_DECISION_KERNEL`

- producer: `par_238`
- consumers: `par_239`, `par_240`, `par_249`, `par_251`
- objects:
  - `EndpointDecision`
  - `DecisionEpoch`
  - endpoint bindings, settlements, previews, and supersession records

Use:

- treat `DecisionEpoch` as the sole consequence fence
- invalidate stale previews and consequence work through explicit supersession

### `IF_230_APPROVAL_AND_URGENT`

- producer: `par_239`
- consumers: `par_240`
- objects:
  - `ApprovalCheckpoint`
  - `ApprovalRequirementAssessment`
  - `DutyEscalationRecord`
  - `UrgentContactAttempt`
  - `UrgentEscalationOutcome`

Use:

- bind approval and urgent escalation to a live unsuperseded `DecisionEpoch`

### `IF_230_DIRECT_RESOLUTION_AND_SEEDS`

- producer: `par_240`
- consumers: `par_241`, `par_243`, `par_244`, `par_249`, `par_251`
- objects:
  - `BookingIntent`
  - `PharmacyIntent`
  - `LineageCaseLink`
  - `TriageOutcomePresentationArtifact`

Use:

- create direct continuation seeds
- never let seeds escape the invalidation chains from duplicate drift or decision supersession

## Invalidation registry

The gate publishes four cross-track invalidation chains:

1. `duplicate_resolution`
2. `decision_supersession`
3. `workspace_trust_downgrade`
4. `contact_route_repair`

No track may claim readiness if it mutates supersedable or staleable objects without one of those chains declared.

## Consumer rule

Consumer tracks may:

- read
- project
- validate
- refuse stale work

Consumer tracks may not:

- redefine the producer’s state vocabulary
- mutate the producer-owned record directly
- silently downgrade audit or invalidation rules to get parallel work moving
