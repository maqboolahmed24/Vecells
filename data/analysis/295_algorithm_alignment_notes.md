# 295 Algorithm alignment

`par_295` keeps every visible selection posture subordinate to the frozen authorities from `280`, `285`, `286`, and `294`.

## Governing inputs

- `ReservationTruthProjection.truthState` governs reservation wording, hold posture, and whether a countdown can appear.
- `ReservationTruthProjection.countdownMode` governs whether urgency is lawful.
- `CapacityRankExplanation.patientReasonCueRefs[]` governs the short reason chips shown in the row, selected-slot pin, and compare drawer.
- `BookingSlotResultsProjection.viewState` governs whether selection remains writable, partially degraded, stale, no-supply, or fallback-bound.

## Mapping

| Visible posture | Governing proof | Local UI law |
| --- | --- | --- |
| Selected, not held | `truthful_nonexclusive` | Keep the slot pinned, show calm nonexclusive wording, allow continue, no countdown |
| Real supplier hold | `exclusive_held` + `countdownMode=hold_expiry` | Allow held-for-you copy and real expiry countdown only here |
| Checking | `pending_confirmation` | Preserve selection anchor, disable continue, explain that the supplier check is still settling |
| Stale selection | `revalidation_required` or `viewState=stale_refresh_required` | Freeze selection and confirm affordances in place until refresh |
| Unavailable selection | `released`, `expired`, `disputed`, `unavailable` | Keep the selected slot as read-only provenance and route toward choose-another or support |
| No supply | `viewState=no_supply_confirmed` | Remove active selection, keep support path visible, do not imply hidden self-service supply |
| Supported fallback | `viewState=support_fallback` | Suppress writable selection and route to the governed assisted path |

## Specific closures

- Close the selected-means-held gap: row selection, selected-slot pin, and compare mode always separate selection chrome from reservation truth.
- Close the fake-countdown gap: the only scenario with countdown is `booking_case_295_exclusive_hold`, where the selected truth is `exclusive_held`.
- Close the local-rank gap: `SlotReasonCueChip` reads only the first persisted patient cue and compare cards keep proof order.
- Close the compare-context gap: compare mode is opened explicitly from the action bar or pin and never removes the selected-slot rail.
- Close the quiet-unavailable gap: expired or unavailable selected slots trigger `SelectionRecoveryPanel` and keep the old slot visible.
