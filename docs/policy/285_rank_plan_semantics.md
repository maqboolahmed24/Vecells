# 285 Rank Plan Semantics

This note freezes the ranking semantics that backend and later UI consumers must reuse.

## Input law

Rank only from the current lawful `SlotSetSnapshot` and `SnapshotCandidateIndex`.

Do not:

- rank raw supplier rows
- rescore in the browser
- infer order from supplier payload order
- infer order from page slicing or compare mode

## Hard filters

Reject a candidate before scoring when any of the following is true:

- `startAt > timeframeLatest`
- modality is incompatible
- clinician type is incompatible
- accessibility needs are not satisfied
- the current audience cannot book the candidate
- patient-specific exclusion or linkage restriction is active

## Window classes

`windowClass` is ordinal and fixed:

- `2`: inside the preferred window
- `1`: inside the acceptable window but outside the preferred window
- `0`: outside the acceptable window

Only classes `2` and `1` may surface as live local offers.

## Frontier rule

For each band `b`, compute:

- `Frontier_b = earliestStart_b + Delta_reorder_b`
- `Delta_reorder_b` comes from `SearchPolicy.sameBandReorderSlackMinutesByWindow`

Only candidates inside `Frontier_b` may be preference-reordered by soft score.
Candidates outside the frontier stay timeliness-first even if their preference fit is higher.

## Soft features

`285` persists normalized feature evidence for:

- delay
- continuity
- site preference
- time-of-day preference
- travel burden proxy
- modality preference

Scoring must remain numerically stable and replayable. The repository uses quantized micros and `BigInt`-based weighted aggregation before rounding back to integer micros.

## Stable order

The stable order is:

1. higher `windowClass` first
2. inside the frontier: `softScoreMicros` descending, then `startAtEpoch`, then `canonicalTieBreakKey`
3. outside the frontier: `startAtEpoch`, then `softScoreMicros`, then `canonicalTieBreakKey`

No other hidden tie-break is allowed.

## Reason-cue law

Patient-safe cues must derive from `CapacityRankExplanation.patientReasonCueRefs`, not from late presentation heuristics.

Current patient cues:

- `cue_soonest`
- `cue_best_match`
- `cue_preferred_site`
- `cue_accessibility_fit`
- `cue_time_of_day_fit`
- `cue_closest_suitable_site`

Staff and support may see richer explanation refs, but they must still derive from the same explanation row.

## Audience law

Patient self-service may surface only:

- `patient_self_service`
- `staff_and_patient`

Staff may also surface:

- `staff_assist_only`

The patient and staff routes may differ in bookability surface, but they may not differ in the underlying proof order for the shared lawful candidate set.

## OfferSession law

`OfferSession` is the only ranked interaction surface.
It must carry the proof ref, selection token, selection-proof hash, dominant action, and truthful reservation posture.

`OfferSession.expiresAt` is an interaction TTL, not proof of exclusivity.

Allowed truthful postures:

- `truthful_nonexclusive`
- `degraded_manual_pending`

`exclusive_hold` requires later reservation truth and is not created by `285`.

## Branch law

If no acceptable local candidate remains, the repository must return one `branch_only` offer session with typed continuation branches:

- `join_local_waitlist`
- `assisted_callback`
- `fallback_to_hub`

## Refresh law

Refresh compiles a new proof and supersedes the old offer session.
Later reads must use the current 285 offer-session scope ref and may not reconstruct order from stale candidate arrays.
