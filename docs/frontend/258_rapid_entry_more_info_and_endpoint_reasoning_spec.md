# 258 Rapid Entry More Info And Endpoint Reasoning Spec

Task: `par_258_phase3_track_Playwright_or_other_appropriate_tooling_frontend_build_rapid_entry_notes_more_info_and_endpoint_reasoning_layer`

## Visual mode

`Reasoning_Dock_Composer`

The active task shell now has one governed composition layer inside `DecisionDock`. The fast path remains inline, while richer `more-info` and endpoint reasoning states promote bounded side stages in the same shell.

## Production components

- `QuickCaptureTray`
- `ReasonChipGroup`
- `QuestionSetPicker`
- `RapidEntryNoteField`
- `MoreInfoInlineSideStage`
- `EndpointReasoningStage`
- `ConsequencePreviewSurface`
- `ProtectedCompositionFreezeFrame`

## Core contract

The reasoning layer is resolved from one `ReasoningLayerProjection` nested under `TaskWorkspaceProjection`.

It binds:

- `RapidEntryDraft`
- `MoreInfoStatusDigest`
- `MoreInfoCycle`
- `DecisionEpoch`
- `EndpointDecisionBinding`
- `ReviewActionLease`
- `WorkspaceFocusProtectionLease`
- `ProtectedCompositionState`

No child-route composer or preview may appear calmer, fresher, or more writable than that tuple allows.

## Dock law

`QuickCaptureTray` lives inside the existing `DecisionDock`.

Rules:

1. rapid entry stays inline
2. `more-info` and endpoint reasoning stay same-shell child routes
3. local autosave acknowledges draft persistence only
4. irreversible preview remains visible before commit

## More-info law

`MoreInfoInlineSideStage` must resume the current `MoreInfoCycle` when one already exists for the lineage.

The task shell may not silently fabricate a new cycle just because the reviewer entered the `more-info` child route.

## Freeze law

`ProtectedCompositionFreezeFrame` is the in-place recovery surface for:

- stale `DecisionEpoch`
- review-lease or ownership drift
- selected-anchor drift
- trust or publication drift

When frozen:

- the draft stays visible
- send and commit controls disable in place
- the preserved anchor and decision epoch remain named
- the shell does not retarget to another row or task

## Same-shell law

`/workspace/task/:taskId`
`/workspace/task/:taskId/more-info`
`/workspace/task/:taskId/decision`

all preserve:

- `workspaceShellContinuityKey`
- selected anchor
- `TaskCanvasFrame`
- `DecisionDock`
- the current rapid-entry draft

## Current boundary

`258` closes the rapid-entry and reasoning gap for the active task shell.

`259` still owns heavy attachment viewing and patient-response thread depth.
