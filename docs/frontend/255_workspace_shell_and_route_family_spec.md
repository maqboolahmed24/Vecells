# 255 Workspace Shell And Route Family Spec

Task: `par_255_phase3_track_Playwright_or_other_appropriate_tooling_frontend_build_workspace_home_queue_and_task_route_family`

## Scope

This slice turns `/workspace*` into one explicit same-shell staff workbench:

- `/workspace`
- `/workspace/queue/:queueKey`
- `/workspace/task/:taskId`
- `/workspace/task/:taskId/more-info`
- `/workspace/task/:taskId/decision`
- `/workspace/approvals`
- `/workspace/escalations`
- `/workspace/changed`
- `/workspace/search`

The shell is owned by `WorkspaceRouteFamilyController` and rendered through:

- `WorkspaceShell`
- `WorkspaceNavRail`
- `WorkspaceHeaderBand`
- `WorkspaceStatusStrip`
- `WorkspaceHome`

## Shell law

The production shell keeps one staff route family live while the `workspaceShellContinuityKey` remains valid. Task switches, child-route morphs, queue switches, approvals, escalations, changed, and search all stay inside the same staff shell and only replace the primary region.

`WorkspaceHomeProjection` is the only legal source for the home route orientation modules and start-of-day shell summary.

Child-route rules:

- `/workspace/task/:taskId/more-info` is a same-shell child route
- `/workspace/task/:taskId/decision` is a same-shell child route
- both preserve queue context, selected anchor, and quiet-return posture

## Continuity keys

- `workspaceShellContinuityKey = workspace::role.clinical_reviewer::channel.browser::<frontendContractManifestId>`
- `entityContinuityKey = staff_task::<taskId>::<patientRef>` when a task is active
- non-task peer routes keep the same shell key and use `staff_workspace_scope::<routeKind>::<queueKey>` for the inner region

## DOM contract

The root shell publishes these canonical markers:

- `data-shell-type="staff"`
- `data-route-family`
- `data-workspace-shell-continuity-key`
- `data-entity-continuity-key`
- `data-design-contract-state`
- `data-dominant-action`
- `data-anchor-posture`
- `data-design-mode="Quiet_Clinical_Mission_Control"`

It also preserves the existing automation-surface markers from the seed ledger and route-authority plumbing.

## Route wrappers

Primary route wrappers are published through `data-testid` on the primary pane:

- `WorkspaceHomeRoute`
- `WorkspaceQueueRoute`
- `WorkspaceTaskRoute`
- `WorkspaceMoreInfoChildRoute`
- `WorkspaceDecisionChildRoute`
- `WorkspaceApprovalsRoute`
- `WorkspaceEscalationsRoute`
- `WorkspaceChangedRoute`
- `WorkspaceSearchRoute`

## Visual posture

`Quiet_Clinical_Mission_Control` is intentionally:

- dense, but not chart-heavy
- neutral-first with restrained green, amber, and rose accents
- sidebar and header led, not card-grid led
- summary-first in queue and degraded states
- explicit about trust and continuity without adding security theatre

The home route uses only the blueprint modules:

- `TodayWorkbenchHero`
- `InterruptionDigest`
- `TeamRiskDigest`
- `RecentResumptionStrip`

## Recovery behavior

If trust, publication, or continuity drift:

- the shell remains in place
- the last safe summary remains visible
- the status strip and header reflect degraded posture
- no route redirects back to a generic home page

## Temporary seam

`255` ships the real route family and shell contract, but queue-row depth, preview-pocket depth, active task shell depth, rapid-entry detail, and attachment/thread depth still use the existing bounded seed surfaces until `256` to `259` land.
