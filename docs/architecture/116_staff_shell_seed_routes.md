# 116 Staff Shell Seed Routes

## Intent

Task `par_116` establishes the first authoritative `shellType = staff` route family for Vecells. The clinical workspace is deliberately not a dashboard, not a detached list/detail prototype, and not a placeholder around the existing persistent-shell specimen. It is a continuity-safe reviewer workbench that proves one shell can hold queue scan, task review, child composition, and guarded recovery without resetting identity.

The implemented seed routes are:

| Route | Kind | Route family | Primary surface |
| --- | --- | --- | --- |
| `/workspace` | home | `rf_staff_workspace` | `TodayWorkbenchHero` plus summary modules |
| `/workspace/queue/:queueKey` | queue | `rf_staff_workspace` | queue workboard and preview digest |
| `/workspace/task/:taskId` | task | `rf_staff_workspace` | active task shell |
| `/workspace/task/:taskId/more-info` | child | `rf_staff_workspace_child` | bounded more-info composition |
| `/workspace/task/:taskId/decision` | child | `rf_staff_workspace_child` | decision preview inside `DecisionDock` |
| `/workspace/approvals` | peer child | `rf_staff_workspace_child` | consequence-aware approval preview |
| `/workspace/escalations` | peer child | `rf_staff_workspace_child` | urgent but low-noise escalation workboard |
| `/workspace/changed` | peer child | `rf_staff_workspace_child` | delta-first resumed review landing |
| `/workspace/search` | peer child | `rf_staff_workspace_child` | search inside shell memory |
| `/workspace/support-handoff` | bounded stub | `rf_staff_workspace_child` | truthful support boundary placeholder |

## Shell Law

The shell uses the same top stack on every route:

1. utility masthead
2. `CasePulse`
3. shared status strip
4. route-resident body

That order matters. It keeps shell truth, task truth, and continuity truth visible even when the body morphs between queue, child composition, approvals, or recovery posture.

Wide layouts default to `two_plane`. `three_plane` is reserved for escalation posture only. Narrow layouts fold to `mission_stack` without discarding the selected anchor, dominant action, or child-route posture.

## Workspace Home

`WorkspaceHome` follows the exact module order required by the prompt:

1. `TodayWorkbenchHero`
2. `InterruptionDigest`
3. `TeamRiskDigest`
4. `RecentResumptionStrip`

The recommended queue is expanded by default in the adjacent workboard plane. Home stays calm and sentence-driven. There are no decorative charts, tile dashboards, or ornamental KPIs. When the shell is quiet, the copy explains why it is quiet and what the safest next action is.

## Queue Workboard

The queue workboard is separator-first rather than card-first:

- left signal rail encodes urgency
- one-line primary reason owns the scan surface
- one-line metadata strip keeps secondary detail readable
- right action cluster stays reserved for pin/open actions

`QueuePreviewDigest` opens after the required `80-120ms` delay and remains summary-only. Pinned preview, task open, and child routes all preserve the current shell identity and the route-memory ledger. Re-ranks never steal the active row.

## Task Plane

The active task surface keeps the canonical anatomy:

- `SummaryStack`
- `DeltaStack`
- `EvidenceStack`
- `ConsequenceStack`
- `ReferenceStack`

`SummaryStack` and `DeltaStack` own the first meaningful read. `ReferenceStack` stays collapsed. `DecisionDock` remains visually quiet until a real action is selected. `QuickCaptureTray` lives inside the dock and only expands for the more-info and decision child routes.

## Boundaries And Gaps

The support boundary is kept explicit through the read-only stub route. That route preserves staff shell ownership and records `GAP_BOUNDARY_SUPPORT_SHELL_READ_ONLY_STUB` rather than smuggling support work into the staff shell.

Future specialization is deferred without route churn:

- `GAP_FUTURE_TASK_SPECIALIZATION_MORE_INFO_FRAME`
- `GAP_FUTURE_TASK_SPECIALIZATION_DECISION_FRAME`
- `GAP_RESOLUTION_STAFF_COPY_APPROVAL_PREVIEW`

Those gaps are intentionally copy or depth gaps, not topology gaps. The route family, continuity ledger, selected-anchor policy, and task anatomy are already stable.
