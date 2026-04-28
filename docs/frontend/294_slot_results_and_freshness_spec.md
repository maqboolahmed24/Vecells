# 294 Slot Results And Freshness Spec

Visual mode: `Snapshot_Result_Studio`

## Purpose

This surface is the patient-facing slot-results host inside `/bookings/:bookingCaseId/select`.
It renders one frozen slot snapshot, never a live supplier list.

The surface keeps five truths explicit:

- ranked results come from the persisted snapshot
- day grouping is the default browsing mode
- coverage and freshness posture are always visible
- support stays nearby whenever self-service confidence drops
- stale or partial results do not collapse into a generic empty state

## UI primitives

- `BookingSlotResultsStage`
- `SnapshotCoverageRibbon`
- `DayGroupedSlotList`
- `SlotDayHeader`
- `SlotSummaryRow`
- `RefineOptionsDrawer`
- `SlotSnapshotRecoveryPanel`
- `BookingSupportFallbackStub`

## Layout

- The shared booking shell remains intact from `293`.
- `SnapshotCoverageRibbon` sits first inside the content stage.
- `ResultCountAndAnchorBar` stays sticky inside the results stage and exposes result counts, visible counts, day jumps, and the refine drawer trigger.
- `DayGroupedSlotList` is the primary browsing region.
- `RefineOptionsDrawer` is secondary and only narrows what is already in the snapshot.
- `SlotSnapshotRecoveryPanel` appears in place for stale, no-supply, and support-fallback states.
- `BookingSupportFallbackStub` remains visible for partial, no-supply, and assisted-fallback postures.

## Snapshot truth mapping

- `SlotSetSnapshot.slotCount` and `candidateCount` drive the count bar.
- `SlotSnapshotRecoveryState.viewState` drives the ribbon tone and recovery panel.
- `SlotSnapshotRecoveryState.coverageState` stays visible beside fetched and expiry times.
- `SlotSnapshotRecoveryState.anchorDayKey` drives the active day anchor.
- `CapacityRankExplanation.patientReasonCueRefs[]` feeds one short reason chip per row.

## View-state rules

### `renderable`

- Show day groups normally.
- Keep row disclosures and continue actions active.

### `partial_coverage`

- Keep visible results available.
- Keep support help visible.
- Do not claim that the absence of more rows means no supply.

### `stale_refresh_required`

- Preserve the current day anchor.
- Keep rows readable as provenance.
- Freeze continue actions until refresh completes in place.

### `no_supply_confirmed`

- Replace the list with a true no-supply explanation.
- Keep support next steps visible.

### `support_fallback`

- Explain that self-service stopped because the snapshot did not complete cleanly enough.
- Promote the supported assisted route instead of retry theater.

## Interaction rules

- The ranked list is list-first; there is no default month calendar.
- Only one row is expanded at a time.
- Refine toggles are local to the frozen snapshot and do not fetch.
- Day jump updates the active anchor and survives refresh when the resulting day still exists.
- Refresh from stale state keeps the preserved day anchor when the refreshed snapshot still contains that day.

## Copy rules

- Use short sentence-case labels.
- Use verb-first actions.
- Keep support copy explicit and operational.
- Avoid optimistic language about current availability when the snapshot is partial or stale.

## Playwright proof

The `294` Playwright suite covers:

- renderable browsing and in-shell continue flow
- partial coverage posture
- stale refresh with anchor preservation
- no-supply confirmed posture
- supported fallback posture
- reduced-motion and accessibility snapshots
- refresh and reload persistence of the active day anchor

## Reference posture

- Linear informed the quiet hierarchy and compact list framing.
- Carbon informed the empty, loading, and dense-row presentation discipline.
- NHS guidance informed the sentence-case action language.
