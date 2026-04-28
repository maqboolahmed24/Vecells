# 294 Algorithm Alignment Notes

## Governing local contracts

- `SlotSetSnapshot` remains the only lawful source for visible slot rows.
- `SlotSnapshotRecoveryState` remains the only lawful source for freshness and coverage posture.
- `CapacityRankExplanation.patientReasonCueRefs[]` remains the only lawful source for patient-safe reason chips.

## UI-region mapping

| Contract field | UI region | Render rule |
| --- | --- | --- |
| `SlotSetSnapshot.slotCount` | `ResultCountAndAnchorBar` | Shows the total ranked results frozen in the snapshot |
| `SlotSetSnapshot.coverageState` | `SnapshotCoverageRibbon` | Always visible beside fetched and expiry times |
| `SlotSnapshotRecoveryState.viewState` | `SnapshotCoverageRibbon`, `SlotSnapshotRecoveryPanel` | Switches tone, copy, and whether selection is frozen |
| `SlotSnapshotRecoveryState.anchorDayKey` | Day jump pills, active day group | Preserved across reload and stale refresh when lawful |
| `CapacityRankExplanation.patientReasonCueRefs[]` | `SlotSummaryRow` | One short chip in the compact row summary; full list inside disclosure |

## Frontend laws carried from the blueprint

- Use a ranked, day-grouped list as the default browsing mode.
- Keep one expanded disclosure at a time for clarity.
- Preserve the selected day anchor through refresh or stale recovery when the refreshed snapshot still contains that day.
- Never collapse partial, stale, and true no-supply into the same empty-state copy.
- Keep support visible whenever partial coverage, no supply, or fallback posture is active.

## What the browser may do

- Narrow the visible list with local refine toggles.
- Preserve day anchor, expanded slot, and filters in session storage.
- Route to the existing confirmation host when the slot remains selectable.

## What the browser may not do

- Re-rank slot order.
- Invent fresh patient reason cues.
- Claim that a live supplier check has occurred.
- Convert stale or failed supplier coverage into a calm no-results message.
