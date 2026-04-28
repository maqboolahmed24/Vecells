# 284 Slot Search Snapshot Pipeline

## Scope

`par_284` implements the backend slot-search snapshot pipeline frozen by the Phase 4 contracts from `280`, consuming the executable `BookingCase` and capability tuple surfaces from `282` and `283`.

Runtime surfaces landed in:

- `/Users/test/Code/V/packages/domains/booking/src/phase4-slot-search-snapshot-pipeline.ts`
- `/Users/test/Code/V/services/command-api/src/phase4-slot-search.ts`
- `/Users/test/Code/V/services/command-api/migrations/133_phase4_slot_search_snapshot_pipeline.sql`

## What the pipeline owns

The repository now owns durable, replay-safe search and snapshot objects for:

- `SlotSearchSession`
- `ProviderSearchSlice`
- `TemporalNormalizationEnvelope`
- `CanonicalSlotIdentity`
- repository-owned `NormalizedSlot`
- `SnapshotCandidateIndex`
- `SlotSnapshotRecoveryState`
- `SlotSetSnapshot`

Search is now a bounded snapshot operation. The supplier list is no longer treated as the live booking truth source after search execution.

## Controlling tuple

Every search execution is pinned to:

- `bookingCaseId`
- `caseVersionRef`
- `SearchPolicy.policyBundleHash`
- `selectionAudience`
- `BookingCapabilityResolution.capabilityTupleHash`
- `BookingProviderAdapterBinding.bindingHash`
- the route and publication tuple from the active capability resolution

The command-api application derives those refs from the current `282` booking-case bundle and `283` capability diagnostics rather than accepting caller-supplied hashes.

## Execution law

1. The application requires a live `BookingCase` in `searching_local` or `offers_ready`.
2. The current `SearchPolicy` must exist on the case.
3. The current capability diagnostics must still be current for `search_slots`.
4. The active capability and binding refs on the case must match the current diagnostics tuple.
5. Each supplier window mints one `ProviderSearchSlice`.
6. Rows are normalized, filtered, deduplicated on canonical slot identity, and frozen into one `SlotSetSnapshot`.
7. One `SnapshotCandidateIndex` is written with ordered refs and day buckets.
8. One `booking.slots.fetched` event is emitted for the frozen snapshot.

## Temporal handling

Temporal normalization is explicit and fail-closed:

- timestamps must be parseable ISO-8601 values
- offset-free date-time rows are rejected unless a later bridge is added
- supplier timezone and display timezone are both persisted
- `dstBoundaryState` is computed and recorded
- ambiguous or missing timezone conditions stay visible through reject counters and recovery reasons

This intentionally avoids inventing confidence around DST and local-time ambiguity.

## Filtering and counters

The pipeline keeps separate counters for:

- raw returned
- normalized
- deduplicated
- filtered
- surfaced

Hard filters currently cover:

- outside timeframe
- incompatible modality
- incompatible clinician type
- site or accessibility mismatch
- expired slots
- unsupported `bookabilityMode`
- provider restrictions not satisfied
- duplicate aliases resolving to the same canonical identity

## Recovery states

`SlotSnapshotRecoveryState.viewState` is implemented with the frozen vocabulary:

- `renderable`
- `partial_coverage`
- `stale_refresh_required`
- `no_supply_confirmed`
- `support_fallback`

Read-time selectability rechecks the active case and capability tuple. Drift does not mutate the snapshot; it materializes a stale effective recovery state.

## Explicit boundary to 285

`284` does **not** mint an `OfferSession` and does **not** force the `BookingCase` into `offers_ready`.

The search pipeline freezes searchable supply and recovery truth only. Ranked offer creation stays owned by `285`. This preserves the 280 state law instead of fabricating later-owned offer semantics inside the search pipeline.

## Known carried seam

The repository still lacks a first-class case-version field on `BookingCase`. `284` currently bridges that requirement through the current capability resolution’s `governingObjectVersionRef`. The seam is documented explicitly in:

- `/Users/test/Code/V/data/analysis/PHASE4_BATCH_284_291_INTERFACE_GAP_BOOKING_CASE_VERSION_REF.json`
