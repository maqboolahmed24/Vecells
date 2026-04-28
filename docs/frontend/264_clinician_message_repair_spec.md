# 264 Clinician Message Repair Spec

## Task

- taskId: `par_264_phase3_track_Playwright_or_other_appropriate_tooling_frontend_build_clinician_messaging_thread_and_delivery_repair_views`
- visual mode: `Thread_Repair_Studio`

## Core outcome

This slice makes clinician-message delivery truth visible inside the staff workspace shell. The route now shows:

- which `MessageDispatchEnvelope` is current
- whether `MessageDeliveryEvidenceBundle` actually supports delivered truth
- which `ThreadExpectationEnvelope` currently governs patient-facing meaning
- whether `ThreadResolutionGate` allows resend, reissue, route repair, callback fallback, or attachment recovery
- whether contradictory same-fence receipts or tuple drift have frozen the thread into stale-recoverable or recovery-only posture

## Production components

- `ClinicianMessageThreadSurface`
- `MessageThreadMasthead`
- `DeliveryTruthLadder`
- `DeliveryDisputeStage`
- `MessageRepairWorkbench`
- `AttachmentRecoveryPrompt`

## Authoritative contracts consumed

- `ClinicianMessageThread`
- `MessageDispatchEnvelope`
- `MessageDeliveryEvidenceBundle`
- `ThreadExpectationEnvelope`
- `ThreadResolutionGate`
- `WorkspaceFocusProtectionLease`
- `ProtectedCompositionState`
- `QueueChangeBatch`
- `TaskWorkspaceProjection`

## Route coverage

- `/workspace/messages`
- `/workspace/task/:taskId`

## Interaction laws

1. Same-shell continuity remains authoritative. Message chronology, dispute review, and repair stay inside the workspace shell.
2. Provider acceptance is never rendered as final delivery. Only the current evidence bundle can move the ladder to durable delivery.
3. Contradictory same-fence receipts freeze quiet success immediately and make repair or callback fallback dominant.
4. Repair actions are shown even when blocked, with the current gate reason rendered in place.
5. Attachment recovery remains visible as a first-class repair path when the current failure mode is missing or stripped artifacts.

## Visual posture

`Thread_Repair_Studio` uses:

- a dense thread list lane for patient, route, truth posture, and next legal action
- a calm central chronology plane with grouped message and repair events
- a bounded repair lane that stays visible without replacing the evidence chain
- restrained chips, rails, and evidence cards instead of chat bubbles or CRM ticket chrome

## DOM contract

- `data-thread-state`
- `data-delivery-truth`
- `data-repair-kind`
- `data-thread-tuple`
- `data-dispute-stage`

## Responsive posture

- desktop: list lane plus chronology plane plus bounded repair lane
- tablet: chronology remains primary while repair compresses beneath or beside the masthead
- mobile: thread list, ladder, chronology, and repair stack in one flow with anchor-stable stages

## Proof expectations

- Playwright proves thread open, same-shell repair-stage continuity, and history-safe anchor restore
- transport accepted does not visually imply durable delivery
- contradictory receipts freeze the route into stale-recoverable or blocked repair posture
- resend, reissue, channel change, callback fallback, and attachment recovery unlock only when the gate and evidence state permit them
