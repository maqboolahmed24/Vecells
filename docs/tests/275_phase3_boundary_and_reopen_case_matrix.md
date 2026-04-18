# 275 Phase 3 Boundary And Reopen Case Matrix

This matrix lists `16` explicit case rows across the canonical consequence families.

## Boundary classification

- `BAR275_001` self-care informational advice remains `self_care`
- `BAR275_002` bounded admin-resolution remains `admin_resolution`
- `BAR275_003` reopened boundary requires clinician review and freezes admin mutation
- `BAR275_004` stale `DecisionEpoch` invalidates the current boundary
- `BAR275_005` soft copy drift does not widen `clinicalMeaningState` or `operationalFollowUpScope`

## Advice render, waiting, and completion artifacts

- `BAR275_006` renderable advice requires current approval, bundle, and patient expectation tuple
- `BAR275_007` stale approval or invalidated evidence freezes fresh advice issue
- `BAR275_008` release-watch or trust quarantine suppresses fresh patient-facing consequence
- `BAR275_009` bounded admin completion requires the current `AdminResolutionCompletionArtifact`

## Dependency, release-watch, and reopen

- `BAR275_010` identity verification dependency freezes the consequence lane
- `BAR275_011` reachability repair points back to the correct recovery journey
- `BAR275_012` invalidated advice settlement drives `reopen_required`
- `BAR275_013` new symptom or material evidence preserves provenance and reopens the boundary

## Patient, staff, and support parity

- `BAR275_014` patient and staff summaries stay aligned for self-care advice
- `BAR275_015` patient and staff summaries stay aligned for admin waiting and completion
- `BAR275_016` patient, staff, and support summaries keep reopened consequence posture visible without relabeling it as complete
