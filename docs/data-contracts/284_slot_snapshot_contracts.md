# 284 Slot Snapshot Contracts

## Domain contracts implemented

The executable runtime now implements the frozen `280` slot-search contract family through these domain snapshots:

- `SlotSearchSessionSnapshot`
- `ProviderSearchSliceSnapshot`
- `TemporalNormalizationEnvelopeSnapshot`
- `CanonicalSlotIdentitySnapshot`
- `NormalizedSlotSnapshot`
- `SnapshotCandidateIndexSnapshot`
- `SlotSnapshotRecoveryStateSnapshot`
- `SlotSetSnapshotSnapshot`

Source:

- `/Users/test/Code/V/packages/domains/booking/src/phase4-slot-search-snapshot-pipeline.ts`

## Command-api surfaces

Read surfaces:

- `GET /v1/bookings/cases/{bookingCaseId}/slot-search/current`
- `GET /v1/bookings/slot-snapshots/{slotSetSnapshotId}/pages/{pageNumber}`
- `GET /v1/bookings/slot-snapshots/{slotSetSnapshotId}/days/{localDayKey}`

Mutation surfaces:

- `POST /internal/v1/bookings/cases/{bookingCaseId}:start-slot-search`
- `POST /internal/v1/bookings/slot-snapshots/{slotSetSnapshotId}:refresh`
- `POST /internal/v1/bookings/slot-snapshots/{slotSetSnapshotId}:invalidate`

Source:

- `/Users/test/Code/V/services/command-api/src/phase4-slot-search.ts`

## Durability model

The migration creates durable tables for:

- `phase4_slot_search_sessions`
- `phase4_provider_search_slices`
- `phase4_temporal_normalization_envelopes`
- `phase4_canonical_slot_identities`
- `phase4_normalized_slots`
- `phase4_snapshot_candidate_indices`
- `phase4_slot_snapshot_recovery_states`
- `phase4_slot_set_snapshots`

Source:

- `/Users/test/Code/V/services/command-api/migrations/133_phase4_slot_search_snapshot_pipeline.sql`

## Selectability predicate

The implemented read-time predicate is:

`SnapshotSelectable(q,t) = 1[t <= q.expiresAt] * 1[q.caseVersionRef == current case version] * 1[q.policyBundleHash == current policy bundle hash] * 1[q.providerAdapterBindingHash == current binding hash] * 1[q.capabilityTupleHash == current capability tuple hash] * 1[q.coverageState in {complete, partial_coverage}] * 1[effective recovery state != stale_refresh_required]`

The application computes the current tuple from live `282` and `283` authorities, then the domain service applies the predicate when paging or reading day buckets.

## Event contract

`284` consumes the already-published event contract:

- `booking.slots.fetched`
- schema path: `/Users/test/Code/V/packages/event-contracts/schemas/booking/booking.slots.fetched.v1.schema.json`

`284` does not publish later-owned offer, reservation, commit, waitlist, or manage events.
