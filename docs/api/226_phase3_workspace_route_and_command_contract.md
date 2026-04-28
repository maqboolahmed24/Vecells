# 226 Phase 3 Workspace Route And Command Contract

Task: `seq_226`

Primary registry: `data/contracts/226_workspace_route_family_registry.yaml`

Primary command contract: `data/contracts/226_task_command_settlement.schema.json`

## Route family

The Phase 3 staff workspace family is one governed shell rooted under `/workspace`.

| Route | Class | Adjacency | History | TaskLaunchContext required | Notes |
| --- | --- | --- | --- | --- | --- |
| `/workspace` | `shell_root` | `same_shell_queue_switch` | `replace` | no | Role-specific start surface from `WorkspaceHomeProjection` |
| `/workspace/queue/:queueKey` | `same_shell_peer` | `same_shell_queue_switch` | `push` | no | Summary-first queue browse and preview |
| `/workspace/task/:taskId` | `same_shell_task_root` | `same_shell_task_switch` | `push` | yes | Canonical task root for active review |
| `/workspace/task/:taskId/more-info` | `same_task_child` | `same_task_child` | `push` | yes | Same-shell child route, not a detached compose app |
| `/workspace/task/:taskId/decision` | `same_task_child` | `same_task_child` | `push` | yes | Same-shell child route, not a detached decision app |
| `/workspace/approvals` | `same_shell_peer` | `same_shell_queue_switch` | `push` | no | Bounded list route or inline side stage |
| `/workspace/escalations` | `same_shell_peer` | `same_shell_queue_switch` | `push` | no | Bounded list route or inline side stage |
| `/workspace/changed` | `same_shell_peer` | `same_shell_queue_switch` | `push` | no | Changed-since-seen worklist |
| `/workspace/search` | `same_shell_peer` | `same_shell_queue_switch` | `push` | no | Conservative placeholder so Phase 3 does not invent an unregistered route later |

## Route laws

1. `same_task_child` routes preserve task identity, selected anchor, and same-shell recovery posture.
2. `same_shell_task_switch` may swap the active task canvas, but queue context, workboard scroll, and continuity key stay intact.
3. `same_shell_queue_switch` may change worklist context, but it does not create a new shell family.
4. Hard refresh, reconnect, browser back or forward, and reopen must restore queue, active task, child route, and anchor from `TaskLaunchContext` and `WorkspaceNavigationLedger`.

## Command endpoints

The first governed Phase 3 command set is:

- `GET /v1/workspace/queues/{queueKey}`
- `GET /v1/workspace/tasks/{taskId}`
- `POST /v1/workspace/tasks/{taskId}:claim`
- `POST /v1/workspace/tasks/{taskId}:release`
- `POST /v1/workspace/tasks/{taskId}:start-review`
- `POST /v1/workspace/tasks/{taskId}:resume-review`
- `POST /v1/workspace/tasks/{taskId}:request-more-info`
- `POST /v1/workspace/tasks/{taskId}:resolve-duplicate`
- `POST /v1/workspace/tasks/{taskId}:select-endpoint`
- `POST /v1/workspace/tasks/{taskId}:approve`
- `POST /v1/workspace/tasks/{taskId}:escalate`
- `POST /v1/workspace/tasks/{taskId}:reopen`
- `POST /v1/workspace/tasks/{taskId}:close`

All mutating routes must traverse `ScopedMutationGate`. No task canvas or same-shell child route may write canonical lifecycle state directly.

## Command algorithm

Every mutating route must follow this sequence:

1. Resolve one `RouteIntentBinding` and one `actionScope`.
2. Resolve exactly one governing object and exactly one governing-object version or fence.
3. Validate the current policy tuple, publication tuple, route family, ownership epoch, fencing token, review version, selected-anchor tuple, lineage fence, trust tuple, and any live focus-protection or decision-epoch fence.
4. If any drift is authoritative, return `TaskCommandSettlement.result = stale_recoverable` with the current `TransitionEnvelope` and `ReleaseRecoveryDisposition`.
5. If safety or evidence assimilation is pending, return `TaskCommandSettlement.result = review_required`.
6. Persist one canonical `CommandActionRecord` with idempotency, correlation, fence, and route-intent data.
7. Derive `TaskCommandSettlement` only after canonical `CommandSettlementRecord` creation.

## TaskLaunchContext contract

Primary contract: `data/contracts/226_task_launch_context.schema.json`

`TaskLaunchContext` is mandatory for:

- queue preview to task open
- queue-to-task browser-back restore
- same-shell child route restore
- reopen
- next-task readiness
- next-task launch
- departing-task return stub restore

The following fields are the minimum continuity basis:

- `sourceQueueRankSnapshotRef`
- `returnAnchorRef`
- `returnAnchorTupleHash`
- `selectedAnchorRef`
- `selectedAnchorTupleHash`
- `nextTaskCandidateRefs`
- `nextTaskRankSnapshotRef`
- `nextTaskBlockingReasonRefs[]`
- `nextTaskLaunchState`
- `departingTaskReturnStubState`

## TaskCommandSettlement contract

`TaskCommandSettlement` is frozen so UI optimism cannot claim authoritative success.

The contract always distinguishes:

| Concern | Field |
| --- | --- |
| Local click feedback | `localAckState` |
| Accepted for processing | `processingAcceptanceState` |
| Projection or external visibility | `externalObservationState` |
| Canonical outcome | `authoritativeOutcomeState` |

That separation is required for:

- more-info send
- endpoint choice
- approval
- escalation
- reopen
- close
- next-task launch

## Event vocabulary

The first Phase 3 event vocabulary is frozen in `data/analysis/226_workspace_event_catalog.csv`.

Important constraint:

- events may derive request lifecycle truth indirectly through the coordinator
- events may never let the frontend redefine lifecycle truth locally

This is why event rows explicitly mark `canonical_request_lifecycle_effect = derived_only`.
