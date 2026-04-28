# 427 Assistive Queue And Assurance Merge Spec

Visual mode: `Assistive_Queue_Assurance_Continuum`

## Product Intent

Task 427 connects assistive awareness across queue scan, same-shell task review, Assistive Ops oversight, and Release Admin assurance without turning the queue into an AI dashboard.

## Components

- `AssistiveQueueCue`: compact queue row cue capped at 140px.
- `AssistiveQueueTrustBadge`: posture badge using the same trust vocabulary as task 422.
- `AssistiveQueueContextPocket`: 280px queue detail pocket that preserves selected anchor and queue context.
- `AssistiveQueueOpenToStageBridge`: same-shell bridge from queue open to promoted or downgraded assistive stage.
- `AssistiveOpsTrustSummaryCard`: dense ops trust summary.
- `AssistiveOpsIncidentAndFreezeStrip`: freeze and incident posture strip.
- `AssistiveReleaseAssuranceSummaryCard`: release/admin baseline summary.
- `AssistiveReleaseCandidateDeltaBadge`: rollout-rung cue.
- `AssistiveCrossSurfaceRecoveryFrame`: queue, task, ops, and release recovery vocabulary.
- `AssistiveQueueAndAssuranceMergeAdapter`: shared dock adapter for ops and release cards.

## Invariants

- Queue rows show capability family, trust posture, and actionability ceiling only.
- No raw confidence percentage appears in queue rows.
- Task open remains same-shell and preserves the selected queue anchor.
- Ops and release surfaces reuse the same posture names: `shadow_only`, `observe_only`, `degraded`, `quarantined`, `frozen`, `blocked_by_policy`.
- Release cards bind to task 426 audit and safety baselines.
- Recovery language is identical across queue, task, ops, and release.

## Route Wiring

The merge is wired into the clinical workspace shell:

- queue rows render `AssistiveQueueCue`
- queue preview renders `AssistiveQueueContextPocket` and `AssistiveQueueOpenToStageBridge`
- active task routes render `AssistiveQueueOpenToStageBridge`
- non-task dock pane renders `AssistiveQueueAndAssuranceMergeAdapter`

