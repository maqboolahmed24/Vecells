# 307 Phase 4 Booking Core Test Plan

This plan binds the first release-grade Phase 4 booking-core proof battery to the governing algorithm objects from `blueprint/phase-4-the-booking-engine.md` and the replay primitives from `blueprint/phase-0-the-foundation-protocol.md`.

## Scope

- Capability matrix proof: `ProviderCapabilityMatrixRow`, provider evidence capture, environment posture, and unsupported-path handling.
- Slot snapshot truth: `SlotSetSnapshot`, `ProviderSearchSlice`, freshness, coverage, and `SlotSnapshotRecoveryState`.
- Reservation and hold truth: `ReservationTruthProjection`, truthful nonexclusive wording, exclusive hold lawfulness, expiry, replacement, and unavailable recovery.
- Commit, replay, and fencing: `BookingTransaction`, idempotency replay, preflight revalidation, stale selection proof rejection, and replay-safe authoritative observation.
- Ambiguous confirmation and compensation: `ExternalConfirmationGate`, receipt assimilation, read-after-write ordering, manual dispute resolution, and append-only failed-transaction supersession.

## Suite Map

| Suite | Files | Governing objects | Failure modes closed |
| --- | --- | --- | --- |
| Capability matrix | `tests/integration/307_capability_matrix.spec.ts` | `ProviderCapabilityMatrixRow`, provider evidence registry | Supported row without evidence, review-required drift, unsupported path silently treated as live |
| Slot snapshot truth | `tests/integration/307_slot_snapshot_truth.spec.ts` | `SlotSetSnapshot`, `ProviderSearchSlice`, `SlotSnapshotRecoveryState` | Browser copy diverges from projection truth, no-supply and support fallback collapse together, stale snapshot treated as fresh |
| Reservation and hold truth | `tests/integration/307_reservation_and_hold_truth.spec.ts` | `ReservationTruthProjection`, `ReservationAuthority`, `ReservationFenceRecord` | Truthful nonexclusive mislabeled as held, exclusive hold countdown drift, replacement/expiry/unavailable states hidden |
| Commit replay and fencing | `tests/integration/307_commit_replay_and_fencing.spec.ts` | `BookingTransaction`, idempotency records, selection proof hash | Duplicate submit widens the chain, stale selection proof accepted, stale snapshot dispatches optimistically |
| Callback reorder and ambiguous confirmation | `tests/integration/307_callback_reorder_and_ambiguous_confirmation.spec.ts` | `ExternalConfirmationGate`, receipt checkpoints, reconciliation attempts | Callback reorder accidentally confirms, stale or duplicate callbacks widen history, secure callback failure hides manual attention |
| Compensation and recovery | `tests/integration/307_compensation_and_recovery.spec.ts` | `BookingException`, `BookingTransaction`, release/supersede path | Failed remote outcome leaves contradictory local calmness, recovery chain rewrites history, failed transaction loses exception provenance |
| Browser truth | `tests/playwright/307_booking_core_browser_truth.spec.ts` | Patient booking workspace, slot results, confirmation shell | Capability live/blocked drift, truthful hold copy drift, pending vs confirmed vs recovery posture drift |
| Accessibility and status | `tests/playwright/307_booking_core_accessibility_and_status.spec.ts` | Same-shell status surfaces, polite live regions, mobile parity | Hidden status semantics, overflow on mobile, landmarks/live regions dropped under booking-core pressure |
| Property permutations | `tests/property/307_booking_core_properties.spec.ts` | Callback ordering, read-after-write convergence | Event ordering accidentally creates a second appointment or leaves false calmness |
| Contention probe | `tests/load/307_booking_core_contention_probe.ts` | Replay-safe commit admission | Parallel replay widens the transaction chain after the first stable pending transaction exists |

## Case IDs

- `CAP307_001`: current live provider rows remain evidence-backed.
- `CAP307_002`: review-required and manual-only rows stay blocked or unsupported, never silently live.
- `SNAP307_001`: renderable snapshot pagination and day buckets remain truthful.
- `SNAP307_002`: partial coverage and stale invalidation stay explicit.
- `SNAP307_003`: no-supply and support fallback remain distinct recovery postures.
- `HOLD307_001`: truthful nonexclusive selection stays explicitly nonexclusive.
- `HOLD307_002`: exclusive hold lifecycle stays lawful through pending confirmation and confirmed truth.
- `HOLD307_003`: replacement, expiry, and unavailable paths stay visible without false exclusivity.
- `COMMIT307_001`: duplicate pending submit replays onto one `BookingTransaction`.
- `COMMIT307_002`: stale selection proof and stale snapshot preflight fail closed.
- `COMMIT307_003`: authoritative observation replay does not create a second appointment record.
- `RECON307_001`: callback-before-read remains pending until authoritative read confirms.
- `RECON307_002`: duplicate and stale callbacks collapse onto one pending chain.
- `RECON307_003`: secure callback failure opens manual attention and manual resolution closes it with one final booking.
- `COMP307_001`: ambiguous pending transaction can reconcile to failed truth with an open `BookingException`.
- `COMP307_002`: failed transaction supersession remains append-only.
- `BROWSER307_001`: browser-visible capability, snapshot, hold, and confirmation semantics stay truthful.
- `A11Y307_001`: booking-core status surfaces retain live-region and landmark semantics on desktop and mobile.
- `PROP307_001`: callback-order permutations converge to one authoritative appointment chain.
- `LOAD307_001`: post-admission replay contention stays single-chain.

## Run Commands

```bash
pnpm exec vitest run \
  /Users/test/Code/V/tests/integration/307_capability_matrix.spec.ts \
  /Users/test/Code/V/tests/integration/307_slot_snapshot_truth.spec.ts \
  /Users/test/Code/V/tests/integration/307_reservation_and_hold_truth.spec.ts \
  /Users/test/Code/V/tests/integration/307_commit_replay_and_fencing.spec.ts \
  /Users/test/Code/V/tests/integration/307_callback_reorder_and_ambiguous_confirmation.spec.ts \
  /Users/test/Code/V/tests/integration/307_compensation_and_recovery.spec.ts \
  /Users/test/Code/V/tests/property/307_booking_core_properties.spec.ts
pnpm exec tsx /Users/test/Code/V/tests/playwright/307_booking_core_browser_truth.spec.ts --run
pnpm exec tsx /Users/test/Code/V/tests/playwright/307_booking_core_accessibility_and_status.spec.ts --run
pnpm exec tsx /Users/test/Code/V/tests/load/307_booking_core_contention_probe.ts --run
pnpm validate:307-phase4-booking-core-matrix
```

## Evidence Bundle Requirements

The machine-readable bundle in `data/test-reports/307_booking_core_matrix_results.json` must record, for every case:

- `providerRef`
- `environmentId`
- `seed`
- `artifactRefs`
- `status` from `passed`, `failed`, `blocked`, or `unsupported`

The companion `data/test-reports/307_booking_core_failure_clusters.json` must cluster unsupported or blocked paths instead of hiding them behind passes.
