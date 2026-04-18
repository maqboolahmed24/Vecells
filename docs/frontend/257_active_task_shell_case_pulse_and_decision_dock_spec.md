# 257 Active Task Shell Case Pulse And Decision Dock Spec

Task: `par_257_phase3_track_Playwright_or_other_appropriate_tooling_frontend_build_active_task_shell_case_pulse_and_decision_dock`

## Visual mode

`CasePulse_Instrument_Panel`

The active task surface is now one bounded review plane inside the existing `/workspace*` shell. Queue continuity stays visible, but the task plane becomes the dominant reading and action surface.

## Production components

- `ActiveTaskShell`
- `CasePulseBand`
- `TaskStatusStrip`
- `TaskCanvas`
- `SummaryStack`
- `DeltaStack`
- `EvidenceStack`
- `ConsequenceStack`
- `ReferenceStack`
- `DecisionDock`
- `PromotedSupportRegion`

## Core contract

The shell renders one authoritative `TaskWorkspaceProjection` that binds:

- `WorkspaceTrustEnvelope`
- `StaffWorkspaceConsistencyProjection`
- `WorkspaceSliceTrustProjection`
- `DecisionDockFocusLease`
- `ReviewActionLease`
- `DecisionEpoch`
- `QuietSettlementEnvelope`
- `EvidenceDeltaPacket`

No task region may appear calmer, more writable, or more settled than that tuple allows.

## Layout law

Desktop and wide tablet:

1. `CasePulseBand`
2. `TaskStatusStrip`
3. `TaskCanvas`
4. `DecisionDock`

The dock remains sticky and is the only dominant commit-ready action region. The queue still remains present in the same shell.

Narrow layouts fold into one mission stack:

1. `CasePulseBand`
2. `TaskStatusStrip`
3. `TaskCanvas`
4. bottom-sticky `DecisionDock`

## Stack law

`TaskCanvasFrame` is structured, not tabbed:

1. `SummaryStack`
2. `DeltaStack`
3. `EvidenceStack`
4. `ConsequenceStack`
5. `ReferenceStack`

`ReferenceStack` stays collapsed by default.

`DeltaStack` is the only changed-evidence authority surface and must be bound to the current `EvidenceDeltaPacket`.

## Opening-mode law

Opening mode is derived from authoritative task truth:

- `first_review`
- `resumed_review`
- `approval_review`
- `handoff_review`

Rules:

- `first_review` leads with summary, then delta
- `resumed_review` opens delta-first
- `approval_review` keeps approval detail in one promoted support region
- `handoff_review` keeps escalation or blocked posture in one promoted support region

## Superseded context

Prior judgement context is never silently replaced.

`DeltaStack` keeps superseded endpoint, approval, or ownership context visible until the reviewer recommits or the shell receives a lawful quiet settlement.

## Promoted support region

At most one promoted support region may be visible at a time.

Allowed promoted region states in this slice:

- `approval_review`
- `handoff_review`
- `more_info_stage`
- `decision_stage`

This closes the banner-wall failure mode. Support detail is promoted through one bounded region, not through multiple competing alerts.

## Decision dock law

`DecisionDock` is the single dominant action lane while the task is open.

It owns:

- dominant next action label
- decision shortlist
- child-route entry
- commit fencing explanation
- consequence preview summary

The dock may show blocked, invalidated, or pending posture, but commit-ready action does not fragment into the canvas or support region.

## Same-shell law

`/workspace/task/:taskId`
`/workspace/task/:taskId/more-info`
`/workspace/task/:taskId/decision`

all remain inside the same route family and preserve:

- `workspaceShellContinuityKey`
- selected anchor
- queue visibility
- `CasePulseBand`
- `DecisionDock`

## Current boundary

`257` establishes the real active review shell.

`258` still owns the richer rapid-entry, more-info, and endpoint reasoning layer.
`259` still owns the heavy attachment viewer and patient-response thread depth.
