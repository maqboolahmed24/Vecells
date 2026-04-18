# 261 Changed Review Resume Spec

Task: `par_261_phase3_track_Playwright_or_other_appropriate_tooling_frontend_build_changed_since_seen_and_review_resumed_recovery_flow`

## Surface intent

`ChangedWorkRoute` and `DeltaFirstResumeShell` turn changed-since-seen work into a governed re-entry instrument instead of a generic badge or detached diff tool.

The route and task shell now share one visible changed-evidence contract:

- `EvidenceDeltaPacket`
- `DecisionEpoch`
- `TaskWorkspaceProjection`

## Route family

- `/workspace/changed`
- `/workspace/task/:taskId`
- `/workspace/task/:taskId/more-info`
- `/workspace/task/:taskId/decision`

The route family stays same-shell and browser-history-safe.

## Required components

- `ChangedWorkRoute`
- `DeltaFirstResumeShell`
- `EvidenceDeltaSummary`
- `InlineChangedRegionMarkers`
- `SupersededContextCompare`
- `ResumeReviewGate`

## Interaction law

1. Changed lane rows are derived from the authoritative delta packet, not ad hoc timestamps.
2. Resumed review lands on the highest-value changed surface first.
3. `decisive` and `consequential` deltas publish `data-recommit-required="true"` and visibly freeze commit posture.
4. `contextual` and `clerical` deltas annotate without pretending they are equal to decisive contradiction.
5. Superseded context stays reachable as comparison rather than sending the reviewer to a detached diff page.
6. If the task now belongs in urgent recovery, the changed lane may still summarize the delta, but opening the task shell re-enters the urgent path.

## DOM contract

- `data-delta-class`
- `data-resume-state`
- `data-recommit-required`
- `data-superseded-context`

## Visual mode

`Delta_Reentry_Compass`

The route uses a calm, dense layout with:

- a changed-work lane
- a delta-first review plane
- a quieter compare/provenance lane

This is intentionally serious and operational, not chat-like, analytics-heavy, or source-control-styled.
