# 238 Endpoint Decision Engine And Epoch Fencing

`238` turns the frozen Phase 3 consequence model into an executable backend kernel.

## Scope

The live backend objects are:

- `DecisionEpoch`
- `EndpointDecision`
- `EndpointDecisionBinding`
- `EndpointDecisionActionRecord`
- `EndpointDecisionSettlement`
- `EndpointOutcomePreviewArtifact`
- `ApprovalRequirementAssessment`
- `EndpointBoundaryTuple`

`DecisionSupersessionRecord` remains a Phase 0 object family, but `238` now appends and consumes it as the authoritative invalidation path for endpoint work.

## Endpoint Taxonomy

The kernel freezes one authoritative endpoint family:

- `admin_resolution`
- `self_care_and_safety_net`
- `clinician_message`
- `clinician_callback`
- `appointment_required`
- `pharmacy_first_candidate`
- `duty_clinician_escalation`

No alias taxonomy exists in the command-api layer or the domain package.

## Decision Epoch Law

The first material endpoint mutation mints one live `DecisionEpoch`.
Further payload edits and preview regeneration reuse that epoch while the tuple remains current.

The epoch supersession evaluator rotates the epoch when the active fence tuple drifts on:

- evidence snapshot drift
- safety epoch drift
- duplicate-lineage drift
- ownership epoch drift
- review-version drift
- selected-anchor drift
- trust posture drift
- publication tuple drift
- approval burden drift
- manual replacement

When supersession fires:

1. the old epoch becomes `superseded`
2. one `DecisionSupersessionRecord` is appended
3. stale preview posture degrades to `recovery_only`
4. a replacement live epoch is minted

## Binding And Route Fence

`EndpointDecisionBinding.bindingState` is explicit:

- `live`
- `preview_only`
- `stale`
- `blocked`

The binding evaluation uses the current review tuple, selected anchor, route contract, publication refs, trust projection, and continuity evidence ref.
Route visibility alone does not grant writable posture.

Selected-anchor drift is first-class. A stale selected anchor cannot commit.
When the only drift is lifecycle-lease expiry on the current task authority tuple, the command-api performs a same-shell lease reacquire before endpoint mutation and then rebinds the command chain to the refreshed ownership epoch and lineage fence.

## Preview Model

Preview generation is deterministic and summary-first.
The preview builder reuses the `235` deterministic summary seam by composing preview text through `renderDeterministicReviewSummary` and `stableReviewDigest`.

Superseded or stale previews remain visible only as provenance:

- they may stay readable
- they become `recovery_only`
- they may not remain writable or submit-ready

## Approval And Boundary Hooks

`ApprovalRequirementAssessment` is durable and epoch-bound.
`appointment_required`, `pharmacy_first_candidate`, `duty_clinician_escalation`, and explicit sensitive or high-risk overrides resolve to `required`.

`admin_resolution` and `self_care_and_safety_net` mint an `EndpointBoundaryTuple` bound to the same `DecisionEpoch`.
If the boundary tuple drifts from the endpoint decision, the binding fails closed.

## Submit Boundary

`238` stops at:

- endpoint selection
- payload update
- preview generation
- preview regeneration
- approval-burden evaluation
- epoch supersession
- submit-safe commitment
- triage transition to `endpoint_selected`

It does not emit booking, pharmacy, callback, message, self-care publication, or admin-resolution side effects.
Those remain future seams for `239` and `240`.
