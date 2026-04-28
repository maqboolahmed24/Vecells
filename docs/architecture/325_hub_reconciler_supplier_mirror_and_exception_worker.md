# 325 Hub Reconciler, Supplier Mirror, And Exception Worker

`par_325` makes Phase 5 background integrity executable instead of narrative.

## Scope

The canonical worker layer now consists of:

- `services/hub-booking-reconciler`
- `services/hub-supplier-mirror`
- `services/hub-exception-worker`
- `packages/domains/hub_coordination/src/phase5-hub-background-integrity-engine.ts`

The domain engine owns the durable ledgers and monotone law. The service packages expose focused worker surfaces and do not re-implement truth logic.

## Durable Objects

The worker-owned object family is:

- `HubReconciliationWorkLease`
- `HubImportedConfirmationCorrelation`
- `HubSupplierObservation`
- `HubSupplierMirrorCheckpoint`
- `HubExceptionWorkItem`
- `HubExceptionAuditRow`
- `HubProjectionBackfillCursor`

The worker also consumes existing authoritative objects:

- `HubCommitReconciliationRecord`
- `HubSupplierMirrorState`
- `HubSupplierDriftHook`
- `HubCoordinationException`
- `HubOfferToConfirmationTruthProjection`
- `PracticeContinuityMessage`
- `PracticeAcknowledgementRecord`
- `PracticeVisibilityProjection`

## Reconciliation Model

`HubReconciliationWorkLease` is the single-owner lease for one `reconciliation_required` `HubCommitAttempt`.

Rules:

- only one active lease may exist per commit attempt
- a stale lease is expired before a new claimant can proceed
- a stale lease opens `HubCoordinationException(exceptionClass = stale_owner_or_stale_lease)`
- a claimed reconciliation may resolve to:
  - `confirmed_from_imported_evidence`
  - `duplicate_no_truth`
  - `manual_dispute`
  - `stalled_retryable`

When authoritative imported evidence settles the attempt, the worker converts the same live attempt into `commitMode = imported_confirmation` and reuses the existing fenced reservation lineage. It does not create a parallel live attempt.

## Imported Confirmation Correlation

`HubImportedConfirmationCorrelation` is evidence first.

It records:

- the dedupe key
- imported evidence ref
- supplier booking reference
- matched attempt or appointment refs
- provider binding hash
- current truth tuple
- the final correlation state

Correlation may only land in `accepted` when the current case, live binding, selected candidate, and truth tuple are still lawful. Binding drift, tuple drift, wrong-case booking references, and candidate drift remain `evidence_only` or `disputed` and open typed exception work.

## Supplier Mirror

`HubSupplierObservation` captures the raw worker judgement for one payload.
`HubSupplierMirrorCheckpoint` captures the post-write mirror posture.

The mirror path is monotone-safe:

- stale payload IDs replay safely
- older observations cannot replace newer checkpoints
- weaker `booked` payloads cannot thaw a frozen mirror
- supplier cancellation or reschedule freezes manage posture
- supplier drift refreshes continuity evidence
- supplier drift can reopen practice acknowledgement debt without calming the confirmation truth

## Exception Work

`HubCoordinationException` is now operational work, not a generic log row.

`HubExceptionWorkItem` persists:

- retry count
- retry-after time
- escalation time
- active lease posture
- the latest audit row

`HubExceptionAuditRow` is append-only and records every worker action:

- `opened`
- `claimed`
- `retried`
- `escalated`
- `resolved`
- `suppressed`
- `expired_lease`
- `stale_owner_detected`

The minimum typed classes now supported are:

- `reconciliation_stalled`
- `imported_confirmation_disputed`
- `supplier_drift_detected`
- `callback_transfer_blocked`
- `practice_acknowledgement_overdue`
- `stale_owner_or_stale_lease`
- `backfill_ambiguity_supervision`

## Projection Backfill

`HubProjectionBackfillCursor` rebuilds the current `HubOfferToConfirmationTruthProjection` from durable lineage, not UI state.

Backfill is intentionally asymmetric:

- it may restore missing refs such as `hubAppointmentId`
- it may widen recovery when supplier drift is already durable
- it may not infer a calmer booked posture from ambiguous lineage

Ambiguity routes to:

- `confirmationTruthState = disputed`
- `practiceVisibilityState = recovery_required`
- `HubCoordinationException(exceptionClass = backfill_ambiguity_supervision)`

## Service Boundaries

`services/hub-booking-reconciler` owns claim, resolve, and backfill entry points.

`services/hub-supplier-mirror` owns observation ingestion and mirror checkpoint publication.

`services/hub-exception-worker` owns typed retry, escalation, and resolution of the durable exception backlog.
