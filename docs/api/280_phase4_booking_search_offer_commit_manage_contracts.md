# 280 Phase 4 booking search, offer, commit, and manage contracts

Later runtime work must consume these contracts directly. It may not invent new slot, hold, pending, confirmation, or manage meaning in code or UI.

## Route-family contract

| Route family | Governing authority | Allowed calm posture | Same-shell recovery |
| --- | --- | --- | --- |
| `/booking/search` | `SlotSetSnapshot` + `SlotSnapshotRecoveryState` | only when `viewState = renderable` | partial, stale-refresh, no-supply, or support-fallback in place |
| `/booking/offers` | `OfferSession` + `CapacityRankProof` + `ReservationTruthProjection` | selection may persist | selection freezes or recovery routes in place |
| `/booking/confirm` | `BookingTransaction` + `ReservationTruthProjection` + `BookingConfirmationTruthProjection` | none before authoritative confirmation truth | provisional receipt, pending, or reconciliation in place |
| `/booking/manage` | `BookingConfirmationTruthProjection` + `BookingContinuityEvidenceProjection` | only while confirmed + writable + continuity trusted | stale, unsupported, safety-preempted, or reconciliation in place |
| `/booking/reminders` | `BookingConfirmationTruthProjection` + `ReminderPlan` | only while reminder exposure is scheduled | blocked or summary-only |
| `/booking/artifacts` | `BookingConfirmationTruthProjection` + `AppointmentPresentationArtifact` | only while artifact exposure is handoff-ready | summary-only or recovery-only |

## Confirmation and manage exposure

Patient and staff shells may render actionability only from the current truth projections.

- `ReservationTruthProjection` controls exclusivity and hold wording.
- `BookingConfirmationTruthProjection` controls booked summary, manage exposure, artifact exposure, and reminder exposure.
- `BookingManageSettlement` controls same-shell manage results.

Manage exposure is live only while the current capability tuple, binding, route publication, runtime publication bundle, shell consistency, and continuity evidence still validate the same appointment lineage.

## Contract refs consumed from 279

- `BookingCapabilityResolution.capabilityTupleHash`
- `BookingProviderAdapterBinding.bookingProviderAdapterBindingId`
- `BookingProviderAdapterBinding.bindingHash`
- `BookingProviderAdapterBinding.commitContractRef`
- `BookingProviderAdapterBinding.authoritativeReadContractRef`
- `BookingProviderAdapterBinding.manageSupportContractRef`

If any of those refs drift, selection, commit, or manage must degrade to stale or recovery posture instead of inventing a local interpretation.
