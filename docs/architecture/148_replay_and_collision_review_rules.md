# 148 Replay And Collision Review Rules

`par_148` classifies submit attempts into six authoritative outcomes:

- `new_lineage`
- `exact_replay`
- `semantic_replay`
- `collision_review`
- `stale_recoverable`
- `submit_blocked`

## Replay rules

- `exact_replay`: raw and semantic payload hashes match the accepted command. Return the prior authoritative `IntakeSubmitSettlement`.
- `semantic_replay`: raw payload drifted, but semantic submit meaning is unchanged. Return the prior authoritative `IntakeSubmitSettlement`.
- `collision_review`: replay identifiers resolve to an existing command but semantic meaning changed. Freeze immutable evidence, persist review state, and stop ordinary promotion.

## Fail-closed rules

- No replay path may create a second `Request`, `EvidenceSnapshot`, or `SubmissionPromotionRecord`.
- No patient-visible receipt may infer success from browser-local state.
- If the draft lease, resume token, or version is stale before the first accepted submit, return `stale_recoverable` instead of opening a hidden second mutable lane.
- If submit readiness is not authoritative, return `submit_blocked` instead of widening truth.

## Same-request attach

The same-request-attach continuation remains a bounded future seam. `par_148` does not invent a second ordinary submit path for it. Any later attach-or-continue flow must reuse this same immutable settlement chain or fail closed into explicit review.
