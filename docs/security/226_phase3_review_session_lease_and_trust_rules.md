# 226 Phase 3 Review Session Lease And Trust Rules

Task: `seq_226`

Primary rules artifact: `data/contracts/226_workspace_trust_and_focus_rules.json`

## Security posture

The Phase 3 staff workspace is deny-by-default on drift.

Writable review posture is legal only when all of the following still agree:

- current `ReviewActionLease`
- current `RequestLifecycleLease`
- current `StaffWorkspaceConsistencyProjection`
- current `WorkspaceSliceTrustProjection`
- current `WorkspaceTrustEnvelope`
- current route-intent tuple
- current selected-anchor tuple
- current review version
- current lineage fence
- current publication tuple

If those producers drift, the shell stays in place and freezes mutation.

## ReviewActionLease

The review action lease is the first writable fence for staff mutation.

Frozen action family:

- `claim`
- `start_review`
- `request_more_info`
- `send_more_info`
- `draft_insert`
- `commit_decision`
- `issue_advice`
- `complete_admin_resolution`
- `send_message`
- `next_task_launch`

Required fence fields:

- `ownershipEpochRef`
- `fencingToken`
- `reviewVersionRef`
- `lineageFenceEpoch`
- `selectedAnchorRef`

Practical rule:

1. a stale lease may preserve draft and context
2. a stale lease may not preserve mutation authority

## WorkspaceTrustEnvelope

The workspace envelope is the sole authority for calmness and writability.

Frozen posture states:

| Field | States |
| --- | --- |
| `envelopeState` | `interactive`, `observe_only`, `stale_recoverable`, `recovery_required`, `reassigned` |
| `mutationAuthorityState` | `live`, `frozen`, `blocked` |
| `interruptionPacingState` | `live`, `buffered`, `blocking_only`, `recovery_only` |
| `completionCalmState` | `not_eligible`, `pending_settlement`, `eligible`, `blocked` |

Derived security law:

- queue rows, child routes, assistive panes, previews, and warmed next-task candidates may not appear healthier or more actionable than the current envelope

## Focus protection and protected composition

Protected work requires both:

- one live `WorkspaceFocusProtectionLease`
- one live `ProtectedCompositionState`

Frozen focus reasons:

- `composing`
- `comparing`
- `confirming`
- `assistive_review`
- `reading_delta`
- `delivery_dispute_review`

Invalidating drift causes:

- `ownership`
- `lineage`
- `review_version`
- `publication`
- `trust`
- `anchor_invalidated`
- `compare_target_invalidated`
- `settlement_drift`

When drift happens during protected work:

1. set `WorkspaceFocusProtectionLease.leaseState = invalidated`
2. set protected state validity to `stale_recoverable` or `recovery_only`
3. keep draft, compare target, insertion point, and quiet-return target visible
4. freeze mutation in place

## Stale-owner recovery

`ownershipState = expired | broken` is not a soft warning. It is governed recovery.

Frozen stale-owner rules:

1. lease expiry may not silently return a task to the queue
2. stale-owner posture requires a canonical stale-owner recovery artifact
3. reacquire or supervised takeover must happen in the same shell
4. queue context and selected anchor stay recoverable during reacquire

## Safety and review-required posture

When evidence, safety, duplicate, approval, or consequence truth becomes materially stale:

- keep the task in place
- set `reviewFreshnessState = review_required`
- freeze consequence-bearing mutation
- preserve same-shell recheck posture

That rule prevents stale direct resolution, stale escalation, stale approval, and stale more-info send from slipping through routine UI continuity.

## Next-task security boundary

Next-task movement is not a convenience shortcut. It is a governed mutation surface.

Launch is legal only when:

- `TaskCompletionSettlementEnvelope.authoritativeSettlementState` is already authoritative or governed-recoverable
- `TaskCompletionSettlementEnvelope.nextTaskLaunchState = ready`
- current continuity evidence is still trusted
- current queue snapshot still matches the launch context
- current trust envelope still allows launch

Auto-advance after local success remains forbidden.
