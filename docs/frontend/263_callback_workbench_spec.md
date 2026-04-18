# 263 Callback Workbench Spec

## Task

- taskId: `par_263_phase3_track_Playwright_or_other_appropriate_tooling_frontend_build_callback_management_views_and_attempt_outcome_capture`
- visual mode: `Callback_Operations_Deck`

## Core outcome

This slice turns callback promises into a first-class workspace surface. The shell now shows:

- which callback promise is current through `CallbackExpectationEnvelope`
- whether the active `CallbackIntentLease` allows scheduling, rescheduling, cancel, or a governed attempt
- which `CallbackAttemptRecord` is current and whether duplicate taps are fenced out
- whether the `CallbackOutcomeEvidenceBundle` is still missing, partial, or durable
- whether `CallbackResolutionGate` allows retry, cancel, complete, escalate, or requires route repair instead

## Production components

- `CallbackWorklistRoute`
- `CallbackDetailSurface`
- `CallbackExpectationCard`
- `CallbackAttemptTimeline`
- `CallbackOutcomeCapture`
- `CallbackRouteRepairPrompt`

## Authoritative contracts consumed

- `CallbackCase`
- `CallbackIntentLease`
- `CallbackAttemptRecord`
- `CallbackExpectationEnvelope`
- `CallbackOutcomeEvidenceBundle`
- `CallbackResolutionGate`
- `WorkspaceFocusProtectionLease`
- `ProtectedCompositionState`
- `QueueChangeBatch`
- `TaskWorkspaceProjection`

## Route coverage

- `/workspace/callbacks`
- `/workspace/task/:taskId`

## Interaction laws

1. Same-shell continuity remains authoritative. Callback list, detail, route repair, and outcome capture stay in the workspace shell.
2. Duplicate attempts are blocked in the UI. Once a live attempt starts, the trigger is no longer writable and the shell keeps one visible attempt fence.
3. Patient promise copy comes only from `CallbackExpectationEnvelope`. The UI does not infer windows from local timers.
4. Route repair dominates when route health drifts or fails. Stale callback promise language stays revoked in place.
5. Voicemail is never calm completion by itself. Evidence and a gate decision are still required before closure or retry posture becomes legal.

## Visual posture

`Callback_Operations_Deck` uses:

- a dense worklist lane for promise window, urgency, route state, and next legal action
- a calm central detail plane with expectation, attempt ladder, and source context
- a bounded side-stage for evidence capture or route repair
- restrained chips, thin rails, and low-noise contrast instead of dialer or CRM tropes

## DOM contract

- `data-callback-state`
- `data-intent-lease-state`
- `data-attempt-state`
- `data-route-health`
- `data-resolution-gate`

## Responsive posture

- desktop: three-plane callback desk with list, detail, and bounded stage
- tablet: list folds into a narrow lane while the stage drops beneath the detail plane when needed
- mobile: expectation, attempt ladder, repair, and evidence capture stack in one flow with a sticky dominant action band

## Proof expectations

- Playwright proves same-shell row selection and callback-detail continuity
- duplicate attempt controls stay fenced to one live record
- route repair suppresses stale promise language and becomes the dominant action
- answered, no-answer, and voicemail evidence sets gate the record action correctly
- reload and history preserve callback selection, selected attempt anchor, and stage posture when recoverable
