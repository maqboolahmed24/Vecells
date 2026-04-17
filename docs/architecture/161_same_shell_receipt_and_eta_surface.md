# par_161 Same-Shell Receipt And ETA Surface

`par_161` turns the Phase 1 routine submit outcome into a real same-shell receipt instead of a detached success page.

## Core law

- The receipt stays inside the `Quiet_Clarity_Mission_Frame`.
- Reference, macro state, ETA bucket, and promise state all come from one `PatientReceiptConsistencyEnvelope` shape.
- Communication posture remains separate from authoritative request outcome.
- The only track handoff is the governed request-lineage route to `/intake/requests/:requestPublicId/status`.

## Visible structure

- `ReceiptOutcomeCanvas`
- `ReferenceAndEtaFacts`
- `PromiseStateNote`
- `NextStepsTimeline`
- `ContactSummaryCard`
- `TrackRequestAnchorCard`

## Bounded copy posture

- Routine safe receipt uses the calm grammar from `COPYVAR_142_SAFE_CLEAR_V1`.
- Review-sensitive receipt uses `COPYVAR_142_SAFE_REVIEW_V1`.
- Promise states only use the canonical labels:
  - `on_track`
  - `improved`
  - `at_risk`
  - `revised_downward`
  - `recovery_required`
- Exact timestamps are forbidden in Phase 1.

## Short-term patch law

- The receipt may patch in place from `received` to `in_review` or another lawful Phase 1 macro state.
- That patch keeps the same route family and shell continuity key.
- The receipt does not navigate away or become a second page template when the current-state region updates.

## Communication truth boundary

- `queued` means a confirmation is planned, not delivered.
- `delivery_pending` means transport acceptance without delivery evidence.
- `delivered` requires delivery evidence.
- `recovery_required` must interrupt calm communication promises explicitly.
