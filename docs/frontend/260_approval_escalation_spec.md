# 260 Approval Escalation Spec

## Intent

`par_260` turns `/workspace/approvals` and `/workspace/escalations` into first-class same-shell control-room routes. Approval review, supersession, urgent contact, and escalation outcome capture stay inside the workspace shell so the operator never loses source evidence, queue continuity, or the last safe consequence summary.

## Visual mode

- `Quiet_Escalation_Control_Room`

## Authoritative surfaces

- `ApprovalInboxRoute`
- `ApprovalReviewStage`
- `ApprovalAuthoritySummary`
- `EscalationCommandSurface`
- `UrgentContactTimeline`
- `EscalationOutcomeRecorder`

## Authoritative contracts

- `ApprovalCheckpoint`
- `DecisionCommitEnvelope`
- `DecisionEpoch`
- `DutyEscalationRecord`
- `UrgentContactAttempt`
- `UrgentEscalationOutcome`
- `TaskWorkspaceProjection`

## Interaction laws

1. Approval and escalation remain route-local shell extensions, not detached apps or takeover pages.
2. `ApprovalReviewStage` is always bound to the active `ApprovalCheckpoint` and current `DecisionEpoch`.
3. If the approval tuple drifts or is superseded, commit posture freezes immediately and points to replacement authority instead of leaving an optimistic submit path.
4. Escalation promotes one urgent stage at a time. Routine chrome stays present but quiet, and contact attempts remain visible as first-class stage truth.
5. Reopen from escalation keeps the urgency reason, prior attempts, and outcome summary lineage-visible inside the same shell.
6. Refresh, reconnect, and browser history preserve the selected anchor, the route, and the last safe stage.

## Layout

- Desktop `xl/2xl`: 3-zone layout with approval or escalation lane, review plane, and authority/timeline side stage.
- Desktop `lg`: same shell with the urgent lane compressed before the review plane collapses.
- Tablet `md`: lane remains first, review plane stays dominant, side content collapses under the stage.
- Mobile `xs/sm`: one shell and one reading order, with the dominant action band and stage context preserved in vertical flow.

## Approval route behavior

- The inbox lane stays dense and serious: patient label, consequence, approver role, changed-since-last-review, timestamp, and commit posture.
- `ApprovalReviewStage` keeps the consequence rationale, irreversible effects, evidence excerpt, delta excerpt, and the current commit lifecycle in one review plane.
- `ApprovalAuthoritySummary` keeps checkpoint ref, decision epoch, approver role, audit trail label, and replacement authority visible.
- Superseded and recovery posture remain readable in place and never render a live-looking commit action.

## Escalation route behavior

- The escalation lane shows urgency reason, current urgent state, severity band, and next governed action.
- `EscalationCommandSurface` owns the dominant urgent explanation, next action, freeze reason, and lineage-visible reopen law.
- `UrgentContactTimeline` shows attempts and outcomes as an operational record, not as a decorative history feed.
- `EscalationOutcomeRecorder` captures the bounded next outcome while preserving provenance and current settlement posture.

## DOM markers

- `data-approval-state`
- `data-decision-epoch`
- `data-approval-role`
- `data-urgent-stage`
- `data-escalation-state`
- route-family continuity markers already owned by `255`

## Continuity

- Selecting an approval or escalation row updates the active review plane without leaving the current route.
- Opening the task shell preserves the originating anchor ref so the operator can return to the same lane row.
- Reload preserves the same child route, shell continuity key, and selected anchor whenever the row still belongs to the current peer route.
