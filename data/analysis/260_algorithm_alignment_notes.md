# 260 Algorithm Alignment Notes

## Surface mapping

| Blueprint posture | Authoritative object | Route | Surface region | DOM marker |
| --- | --- | --- | --- | --- |
| Approval pending | `ApprovalCheckpoint.state = pending` | `/workspace/approvals` | `ApprovalReviewStage` | `data-approval-state="pending"` |
| Approval superseded | `ApprovalCheckpoint.state = superseded` | `/workspace/approvals?state=stale` | freeze frame + authority summary | `data-approval-state="superseded"` |
| Approval recovery only | `DecisionCommitEnvelope = recovery_required` | `/workspace/approvals?state=read-only` | review plane preserved, action fenced | `data-approval-state="pending"` + `data-commit-state="recovery_required"` |
| Escalation active | `DutyEscalationRecord.escalationState = contact_in_progress` | `/workspace/escalations` | `EscalationCommandSurface` | `data-urgent-stage="active"` |
| Escalation blocked | `DutyEscalationRecord.escalationState = handoff_pending` | `/workspace/escalations` row select `task-507` | stage + timeline | `data-escalation-state="handoff_pending"` |
| Escalation reopened | `DutyEscalationRecord.escalationState = returned_to_triage` | `/workspace/escalations?state=stale` | stage + recorder | `data-urgent-stage="relief_pending"` |
| Escalation recovery only | `DutyEscalationRecord` preserved under recovery | `/workspace/escalations?state=blocked` | quiet urgent preserve | `data-urgent-stage="recovery_only"` |

## Region rules

1. The lane is always the route-local scanner. It never becomes the source of truth for approval or escalation state.
2. The stage is always the current consequence checkpoint, rooted in the active `DecisionEpoch`.
3. The side stage carries authority or urgent attempt truth, but never hides source evidence.
4. Reload and back/forward rely on the existing route-family continuity key from `255`, plus the selected peer-route anchor preserved in local storage.

## Freeze rules

- Approval commit controls freeze on `DecisionEpoch` supersession or tuple drift.
- Escalation action controls freeze on recovery-only or returned-to-triage posture.
- Freeze posture preserves the last safe summary, rationale, and provenance instead of blanking the stage.

## Chrome collapse rules

- While escalation is active, the route suppresses the general queue scanner and promotes one urgent stage.
- Routine details remain visible only as bounded excerpts inside the stage or side stage.

## Reopen law

- Returned-to-triage posture keeps the prior urgent reason and timeline visible in the stage summary.
- The escalation route therefore acts as a lineage-visible checkpoint rather than a generic alert page.
