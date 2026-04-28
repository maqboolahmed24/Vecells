# 321 Hub Commit And Confirmation API

The executable API is exposed from [phase5-hub-commit-engine.ts](/Users/test/Code/V/packages/domains/hub_coordination/src/phase5-hub-commit-engine.ts).

## Primary service

`createPhase5HubCommitEngineService(...)`

Dependencies:

- `Phase5HubCommitEngineRepositories`
- `Phase5HubCaseKernelService`
- `Phase5AlternativeOfferEngineRepositories`
- `Phase5NetworkCapacityPipelineRepositories`
- `Phase5EnhancedAccessPolicyService`
- optional `Phase5ActingScopeVisibilityService`
- canonical Phase 0 reservation and confirmation dependencies

## Authoritative commands

### `beginCommitAttempt`

Required inputs:

- current case id
- commit mode
- command metadata and idempotency key
- provider adapter binding snapshot
- presented truth tuple hash
- selected candidate ref

Returns:

- `HubActionRecord`
- fenced `HubCommitAttempt`
- reservation snapshot
- current truth projection
- policy evaluation
- case transition into `candidate_revalidating` and `native_booking_pending`

### `submitNativeApiCommit`

Required inputs:

- current attempt id
- presented truth tuple hash
- presented provider binding hash
- presented reservation fence token
- supplier response class and evidence families

Supported response classes:

- `accepted_pending`
- `authoritative_confirmed`
- `timeout_unknown`
- `rejected`
- `split_brain_uncertain`

Effects:

- refreshes `ExternalConfirmationGate`
- writes `HubBookingEvidenceBundle`
- returns `pending_confirmation`, `confirmation_disputed`, `confirmation_expired`, `reconciliation_required`, or `booked_pending_ack`

### `captureManualBookingEvidence`

Persists structured manual evidence and refreshes the same canonical gate.

Weak evidence remains provisional until corroboration clears the gate.

### `ingestImportedConfirmation`

Supports both:

- attaching to an existing imported attempt, or
- auto-beginning the imported flow when only a valid case/candidate tuple is supplied

Correlation checks include:

- source version
- selected candidate
- duplicate booking reference reuse
- supplier appointment reference

### `recomputeConfirmationGate`

Replays the gate from stored evidence.

Optional `autoFinalizeWhenConfirmed` permits same-call promotion into booked-pending-ack posture.

### `finalizeBookedPendingPracticeAck`

Creates appointment truth once the gate is already confirmed and the live tuple still matches.

### `recordReconciliationRequired`

Writes split-brain recovery posture without retrying supplier booking.

### `startSupplierMirrorMonitoring`

Creates the aligned supplier mirror state for a booked appointment.

### `recordSupplierMirrorObservation`

Refreshes mirror truth from supplier observation and emits typed drift hooks when cancellation or reschedule is observed.

### `queryCurrentCommitState`

Returns the current live attempt, evidence bundle, appointment, latest settlement, continuity projection, mirror state, and truth projection for a case.

## Stable snapshots

The runtime persists these 321-owned snapshots:

- `HubActionRecordSnapshot`
- `HubCommitAttemptSnapshot`
- `HubBookingEvidenceBundleSnapshot`
- `HubAppointmentRecordSnapshot`
- `HubCommitSettlementSnapshot`
- `HubContinuityEvidenceProjectionSnapshot`
- `HubCommitReconciliationRecordSnapshot`
- `HubSupplierMirrorStateSnapshot`
- `HubSupplierDriftHookSnapshot`
