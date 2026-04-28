# 323 No-Slot Callback Return And Reopen Workflows

`par_323` turns hub failure posture into a governed runtime instead of an operator-side convention.

## Core objects

- `HubFallbackRecord` is the parent continuity object for every no-slot outcome that leaves ordinary offer flow.
- `CallbackFallbackRecord` is the callback child record. It remains pending until the fallback is linked to the current `CallbackCase` and current `CallbackExpectationEnvelope`.
- `HubReturnToPracticeRecord` is the return child record. It carries urgency, breach, trust, and reopen linkage evidence for the originating practice path.
- `HubCoordinationException` captures closed-world failure states such as loop prevention, missing callback linkage, or illegal fallback posture.
- `HubFallbackCycleCounter` and `HubFallbackSupervisorEscalation` make repeated hub-practice bounce explicit and reviewable.

## Decision law

`createPhase5HubFallbackEngineService().resolveNoSlotFallback(...)` enforces one lead-time law:

1. `alternatives` are legal only when the trusted frontier exists and `offerLeadMinutes <= remainingClinicalWindowMinutes`
2. `callback` is legal only when callback is requested or policy-required and `callbackLeadMinutes <= remainingClinicalWindowMinutes`
3. otherwise the case must move to `return_to_practice` or `urgent_return_to_practice`

Degraded or quarantined supply may explain a fallback choice, but it may not satisfy the trusted frontier needed for a patient-offerable alternative.

## Callback path

The callback path has two stages:

1. create `HubFallbackRecord` plus `CallbackFallbackRecord`
2. move the hub case only to `callback_transfer_pending`

Only `linkCallbackFallback(...)` may promote the case to `callback_offered`, and only after the governed callback bridge returns both:

- `callbackCaseRef`
- `callbackExpectationEnvelopeRef`

If a live `AlternativeOfferSession` exists, the engine preserves the open-choice shell as `read_only_provenance`, updates the fallback card with `sourceFallbackRef`, and blocks stale accept or callback mutations on the old session.

## Return-to-practice path

The return path also has two stages:

1. create `HubFallbackRecord` plus `HubReturnToPracticeRecord`
2. move the hub case to `escalated_back`

`urgencyCarryFloor` is raised to `max(pBreach, trustGap, currentUrgencyCarry)`. The reopen is not treated as a direct parent-state write. Instead, the engine waits for the governed reopen bridge to materialise:

- `reopenedWorkflowRef`
- `reopenedLineageCaseLinkRef`
- `reopenedLeaseRef`

Only after that linkage is durable does the fallback become `transferred` and the truth projection become closable.

## Loop prevention

Repeated hub-practice recirculation is tracked by `HubFallbackCycleCounter`. Novelty is derived from:

- change in best trusted fit
- priority-band improvement
- explicit new-clinical-context score

When `bounceCount >= 3` and `noveltyScore < 0.35`, the engine raises `HubCoordinationException(exceptionClass = loop_prevention)`, writes `HubFallbackSupervisorEscalation`, and freezes the return path in `supervisor_review_required` instead of silently bouncing the case back again.

## Truth and closure

Every fallback mutation updates `HubOfferToConfirmationTruthProjection`:

- `fallbackLinkState` becomes `callback_pending_link`, `callback_linked`, `return_pending_link`, or `return_linked`
- `closureState` stays blocked until downstream linkage is durable
- patient visibility stays aligned with fallback posture
- stale offer shells are preserved as provenance, not deleted

`completeHubFallback(...)` may close the hub only after the active fallback is already `transferred` or `completed`.

## Current seam

The callback link is proved against the existing callback kernel. The practice reopen path is intentionally explicit as `Phase5PracticeReopenBridge`, with the repo-level seam note in `PHASE5_BATCH_316_323_INTERFACE_GAP_FALLBACK_REOPEN_LIFECYCLE_COORDINATOR.json`. That keeps the fallback state machine fixed while later lifecycle integration replaces the adapter.
