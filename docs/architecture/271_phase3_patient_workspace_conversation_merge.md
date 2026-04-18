# 271 Phase 3 Patient Workspace Conversation Merge

## Scope

`seq_271` closes the route-to-route gap between the staff workspace more-info, callback, and thread surfaces and the patient portal conversation family.

The canonical merge surface is `Phase3PatientWorkspaceConversationMergeApplication` in `/Users/test/Code/V/services/command-api/src/phase3-patient-workspace-conversation-merge.ts`.

This merge does not create a new inbox or detached portal product. It binds existing staff and patient routes to one `Phase3PatientWorkspaceConversationBundle`.

## Canonical Bundle

The canonical bundle is `Phase3PatientWorkspaceConversationBundle`.

It normalizes one same-lineage tuple for:

- `taskId`
- `requestRef`
- `requestLineageRef`
- `clusterRef`
- `threadId`
- `moreInfoCycleRef`
- `replyWindowCheckpointRef`
- `reminderScheduleRef`
- `callbackCaseRef`
- `evidenceDeltaPacketRef`
- `moreInfoResponseDispositionRef`
- `conversationSettlementRef`
- `secureLinkAccessState`

The parity projection inside the bundle is the source of truth for:

- `dueState`
- `replyEligibilityState`
- `deliveryPosture`
- `repairPosture`
- `dominantNextActionRef`

That closes the old drift where secure-link TTL, local portal state, or workspace-local wording could stand in for checkpoint truth.

## Service Surfaces

- `GET /v1/workspace/tasks/{taskId}/patient-workspace-conversation`
- `GET /v1/me/requests/{requestRef}/conversation-merge`
- `GET /v1/me/messages/{clusterId}/conversation-merge`

Published route ids:

- `workspace_task_phase3_patient_workspace_conversation_current`
- `patient_request_phase3_workspace_conversation_current`
- `patient_message_cluster_phase3_workspace_conversation_current`

## Route Families

Patient route family:

- `/requests/{requestRef}/conversation`
- `/requests/{requestRef}/conversation/more-info`
- `/requests/{requestRef}/conversation/callback`
- `/requests/{requestRef}/conversation/messages`
- `/requests/{requestRef}/conversation/repair`

Staff route family consumption:

- `/workspace/task/{taskId}`
- `/workspace/task/{taskId}/more-info`
- `/workspace/callbacks`

The staff task shell, `MoreInfoInlineSideStage`, `PatientResponseThreadPanel`, and `CallbackDetailSurface` now expose the same lineage and parity bundle markers the patient route exposes.

## Dominance Rules

1. `MoreInfoReplyWindowCheckpoint` and the current cycle control patient answerability. Link expiry may reduce access, but it may not extend or replace the cycle.
2. `EvidenceDeltaPacket` and `MoreInfoResponseDisposition` stay shared between patient reply history and staff resumed-review or changed-since-seen posture.
3. Callback repair remains dominant when route health drifts. The patient and staff routes both surface `repair_contact_route`.
4. `ConversationThreadProjection`, `PatientConversationPreviewDigest`, `PatientReceiptEnvelope`, and `ConversationCommandSettlement` remain authoritative for patient thread visibility. The browser does not infer message or callback truth from detached local endpoints.
5. Same-shell recovery is preserved for `expired_link`, `step_up_required`, `superseded`, and repair-required states.

## Seeded Lineages Proven Here

- `task-311` <-> `request_211_a` <-> `cluster_214_derm`
- `task-412` <-> `request_215_callback` <-> `cluster_214_callback`

`task-311` proves the staff more-info to patient more-info and patient thread journey.

`task-412` proves the callback seed, message-cluster launch, repair-dominant callback shell, and task-shell return journey.

## Accepted Gaps

Two bounded divergences stay explicit:

- live command-api consumption is still seed-backed in both shells
- external callback, reminder, secure-link step-up, and notification transport are still simulator-backed

Those gaps are recorded in `/Users/test/Code/V/data/analysis/271_phase3_integration_gap_log.json` and `/Users/test/Code/V/data/analysis/PHASE3_HARDENING_INTERFACE_GAP_PATIENT_WORKSPACE_CONVERSATION.json`.
