# Call Session State Machine Design

`TelephonyCallSessionService` owns the Phase 2 `CallSession` aggregate after the `TelephonyEdgeService` has converted provider callbacks into `NormalizedTelephonyEvent` records. The service consumes provider-neutral refs only. Raw provider payloads, full phone numbers, recording URLs, and patient identifiers remain outside this boundary.

The service closes these Phase 2 gaps:

- `GAP_RESOLVED_PHASE2_CALL_SESSION_EVENT_TAXONOMY`
- `GAP_RESOLVED_PHASE2_CALL_SESSION_TIMEOUT_POLICY`
- `GAP_RESOLVED_PHASE2_CALL_SESSION_MENU_CORRECTION_APPEND_ONLY`
- `GAP_RESOLVED_PHASE2_CALL_SESSION_PROVIDER_COMPLETED_NOT_CLOSED`
- `GAP_RESOLVED_PHASE2_CALL_SESSION_URGENT_LIVE_CONTINUES_EVIDENCE`

No fallback gap artifact is required because task 187 provides a coherent normalized event envelope.

## Canonical Aggregate

`CallSessionAggregate` is a strict state machine, not a bag of booleans. Its canonical path is:

`initiated -> menu_selected -> identity_in_progress -> identity_resolved | identity_partial -> recording_expected -> recording_available -> evidence_preparing -> evidence_pending -> urgent_live_only | continuation_eligible | evidence_ready -> continuation_sent | request_seeded -> submitted -> closed`

The reserved side branches are:

- `identity_failed`
- `abandoned`
- `provider_error`
- `manual_followup_required`
- `manual_audio_review_required`
- `recording_missing`
- `transcript_degraded`

The aggregate stores append-only `canonicalEventRefs`, `eventIdempotencyKeys`, `menuCaptureRefs`, urgent-live assessment refs, recording refs, and later worker refs. The current projection is derived from those facts.

## Event Vocabulary

`CallSessionCanonicalEvent` freezes the internal event taxonomy for rebuild:

- `call_initiated`
- `call_answered`
- `menu_captured`
- `identity_step_started`
- `identity_resolved`
- `identity_partial`
- `identity_attempt_failed`
- `recording_promised`
- `recording_available`
- `provider_error`
- `call_abandoned`
- `call_completed`
- `urgent_live_signal_observed`
- `operator_override_requested`
- `manual_followup_requested`
- `transcript_readiness_recorded`
- `evidence_readiness_assessed`
- `continuation_eligibility_settled`
- `continuation_sent`
- `request_seeded`
- `submission_promoted`
- `call_closed`

The adapter `callSessionEventFromNormalizedTelephonyEvent` maps task 187 events into this vocabulary. Downstream code does not inspect provider callback names.

## Replay And Disorder

Rebuild uses `sequence`, then `occurredAt`, then event-type precedence, then event ref. Duplicates collapse by `idempotencyKey`. Provider completion is recorded as `call_completed` and reason `TEL_SESSION_188_PROVIDER_COMPLETION_NOT_PLATFORM_CLOSED`; it never means platform `closed`.

Promotion-relevant events fail closed unless an authoritative readiness ref exists. `request_seeded` and `submission_promoted` cannot advance from `recording_expected`, `recording_available`, `evidence_preparing`, `evidence_pending`, `urgent_live_only`, or `continuation_eligible`.

## Urgent-Live Handling

Call start creates one open `TelephonyUrgentLiveAssessment`. Menu capture refreshes that assessment. If urgent signals are present, the service appends a new urgent-live assessment, opens `SafetyPreemptionRecord(priority = urgent_live)`, and moves the call to `urgent_live_only`.

`urgent_live_only` blocks routine promotion but still allows later recording, transcript, evidence-readiness, continuation, and convergence refs to append. This preserves urgent handling without corrupting routine evidence work.

## Support Projection

`CallSessionSupportProjection` is derived. It shows only:

- current call state
- current menu path
- urgent-live posture
- last seen event
- next expected milestone
- active blocker or hold reason
- linked recording, verification, transcript, readiness, and continuation refs
- masked caller fragment

It never exposes raw provider payloads, full phone numbers, raw recording URLs, or raw patient identifiers.
