# 285 Capacity Rank And Offer Session

`par_285` implements the executable Phase 4 ranking and offer-session layer against the frozen contracts from `280`, the booking-case tuple from `282`, the capability tuple from `283`, and the snapshot/search outputs from `284`.

Runtime surfaces landed in:

- `/Users/test/Code/V/packages/domains/booking/src/phase4-capacity-rank-offer-engine.ts`
- `/Users/test/Code/V/services/command-api/src/phase4-capacity-rank-offers.ts`
- `/Users/test/Code/V/services/command-api/migrations/134_phase4_capacity_rank_and_offer_session.sql`

## What 285 owns

The repository now owns durable, replay-safe ranking and offer objects for:

- `RankPlan`
- `CapacityRankDisclosurePolicy`
- `CapacityRankProof`
- `CapacityRankExplanation`
- `RankedOfferCandidate`
- `OfferSession`

Ranking is no longer inferred from raw supplier order or from browser sorting. The authoritative order comes from one persisted `CapacityRankProof` per lawful snapshot and audience.

## Input boundary

`285` ranks only from the frozen `SlotSetSnapshot` and `SnapshotCandidateIndex` produced by `284`.

The command-api wrapper derives the live tuple from:

- the current `BookingCase`
- the current `SearchPolicy`
- the current `BookingCapabilityResolution`
- the current `BookingProviderAdapterBinding`
- the current `SlotSetSnapshot`

If any of those refs drift, reads become non-selectable instead of rescoring an ad hoc candidate list.

## RankPlan compilation

`RankPlan` is compiled from the current `SearchPolicy` and persisted with:

- `rankPlanVersion`
- `policyBundleHash`
- preferred and acceptable window minutes
- `sameBandReorderSlackMinutesByWindow`
- normalized feature weights
- explicit `tau_delay`, `tau_tod`, and `tau_travel`
- the stable tie-break rule ref

The implementation uses one fixed version string:

- `285.rank-plan.local-booking.v1`

This version is reused by the rank proof, explanation rows, offer candidates, and offer session.

## Hard filters before scoring

Before any soft score is computed, `285` removes candidates that are:

- beyond the clinically safe latest date
- wrong modality
- wrong clinician type
- incompatible with accessibility needs
- not bookable by the current actor mode
- blocked by patient exclusions or linkage restrictions

That means the ranking layer never reintroduces candidates that `284` or the active audience tuple already made unlawful.

## Frontier and ordering law

The implementation follows the frozen frontier rules directly:

- `windowClass = 2` for preferred-window candidates
- `windowClass = 1` for acceptable-window candidates
- `windowClass = 0` only for non-surfaceable outside-window rows

For each band, the engine computes the earliest start time and then the frontier cutoff from `sameBandReorderSlackMinutesByWindow`.

Only candidates inside `Frontier_b` may be preference-reordered by soft score.

Ordering is then deterministic:

1. higher `windowClass` first
2. inside the frontier: `softScoreMicros` descending, then `startAtEpoch` ascending, then `canonicalTieBreakKey`
3. outside the frontier: `startAtEpoch` ascending, then `softScoreMicros`, then `canonicalTieBreakKey`

The implementation quantizes feature inputs to integer micros and uses `BigInt` for the weighted sum before rounding back to integer micros. That keeps replay stable across runs and avoids using floating-point tie noise as hidden ordering law.

## Explanations and reason cues

Each surfaced candidate now receives one `CapacityRankExplanation` carrying:

- `windowClass`
- `frontierState`
- normalized feature values
- `softScoreMicros`
- `reasonCodeRefs`
- patient-safe reason cues
- richer staff and support explanation refs
- the canonical tie-break key

Patient cues are derived from structured evidence only. The current cue set includes:

- `cue_soonest`
- `cue_best_match`
- `cue_preferred_site`
- `cue_accessibility_fit`
- `cue_time_of_day_fit`
- `cue_closest_suitable_site`

## OfferSession law

`OfferSession` is the authoritative ranked interaction object. It carries:

- the snapshot ref
- the proof ref
- the disclosure-policy ref
- capability and binding refs plus hashes
- offered candidate refs
- the dominant action ref
- selection token and selection-proof hash
- truthful hold support state
- interaction expiry

`OfferSession.expiresAt` is an interaction TTL only. It is not exclusivity proof and does not authorize countdown-style hold language.

Truth posture is explicit:

- `truthful_nonexclusive` for normal live ranking
- `degraded_manual_pending` only when the binding says reservation semantics are degraded

`exclusive_hold` is not minted by `285`.

## Refresh and supersession

Refreshing from a newer lawful snapshot compiles a new `OfferSession`, supersedes the previous session in the 285 store, and updates the current offer-session ref for the booking-case-and-audience scope key.

The wrapper only calls the `282` `publishOffersReady` transition on the first compile from `searching_local`.
When the case is already in `offers_ready`, refresh stays inside the 285 offer-session layer and does not replay the `offers_ready -> offers_ready` state edge.

This preserves the frozen 278 state graph while still making the refreshed session the authoritative current read.

## Selection posture

Selection is verified by:

- offer-session id
- selection token
- current tuple hashes
- selected candidate hash
- selected canonical slot identity ref
- `selectionProofHash`

On success, `285` marks the offer session as `selected`, emits `booking.slot.selected`, and asks `282` to move the case into `selecting`.

Selection does not create a hold, a reservation, or commit truth. Those later truths remain owned by `286` and `287`.

## Branch-only continuation

If no acceptable local slot survives ranking, `285` returns a typed `branch_only` session with governed continuation branches:

- `join_local_waitlist`
- `assisted_callback`
- `fallback_to_hub`

The repository no longer returns a quiet empty list for this state.

## Event ownership

`285` uses the already-published event contracts:

- `booking.offers.created`
- `booking.slot.selected`

It does not claim reservation, hold, commit, booked, waitlist, reminder, or manage truth.

## Later-owned seams

This slice intentionally does not own:

- live reservation lock or hold conversion
- booking commit and reconciliation
- waitlist object execution
- appointment manage execution
- patient or staff UI ranking presentation

Those seams remain later-owned by the Phase 4 tracks after `285`.
