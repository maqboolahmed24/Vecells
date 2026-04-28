# 295 Offer selection truthful hold spec

`OfferSelectionStage` in `Offer_Selection_Studio` is the patient-facing decision layer that sits on top of the frozen 294 results shell.

## Route

- `/bookings/:bookingCaseId/select`

## Required regions

- `SelectedSlotPin`
- `ReservationTruthBanner`
- `SlotCompareDrawer`
- `SlotReasonCueChip`
- `StickyConfirmTray`
- `SelectionRecoveryPanel`

## Behavior

- Keep one selected slot pinned while the patient scans other ranked rows.
- Keep row disclosure in essential mode: one expanded row at a time.
- Treat `truthful_nonexclusive` as selected but not held.
- Show a countdown only when the selected truth is `exclusive_held` and `countdownMode=hold_expiry`.
- Treat `pending_confirmation` and `revalidation_required` as checking posture, not booked reassurance.
- Keep compare mode explicit and temporary. Compare cards keep the original ranked order while the selected slot remains marked.
- Preserve an unavailable or expired selected slot as read-only provenance until the patient chooses another safe action.

## Copy law

- Action labels stay short and verb-first.
- Reservation copy is factual and consequence-aware.
- Rank cues come only from `CapacityRankExplanation.patientReasonCueRefs[]`.

## Reference posture

- Linear informs the calm hierarchy and low-noise selection rail.
- Carbon informs the read-only versus disabled distinction and bounded compare surface.
- NHS informs short transactional copy.
- WCAG 2.2 and Playwright govern focus, sticky-action visibility, aria snapshots, and interaction proof.

## Recovery law

- `stale_refresh_required` freezes continue actions and routes to refresh.
- `no_supply_confirmed` removes active selection and keeps support visible.
- `support_fallback` suppresses writable selection entirely and routes to the governed fallback.
