# 75 Release Trust Verdict Rules

## Verdict rules
`ReleaseTrustFreezeVerdict` is the single machine-readable live-authority decision.

The verdict is `live` only when:
- the linked `ReleaseApprovalFreeze` remains active
- the linked `GovernanceReviewPackage` remains current
- the linked `StandardsDependencyWatchlist` remains current and pass/pass
- the release watch tuple is active
- the guardrail snapshot is green
- runtime publication is published
- release parity is exact
- provenance remains publishable
- every required channel freeze remains in monitoring or released posture
- every required assurance slice remains `trusted` with `completenessState = complete`

`diagnostic_only` is mandatory when the tuple is still exact enough for bounded diagnostics but one required slice is merely degraded or partial.

`recovery_only` is mandatory when a channel freeze activates, parity drifts, provenance blocks, or another governed recovery path is the only safe posture that preserves same-shell continuity.

`blocked` is mandatory when required verdict inputs are stale, missing, contradictory, or when no bounded recovery path remains.

## Fail-closed rules
`ReleaseApprovalFreeze` may not be reused after hash drift, watchlist drift, supersession, or expiry.

`ChannelReleaseFreezeRecord` may not be bypassed for channel-specific or embedded write posture.

`AssuranceSliceTrustRecord` is per-slice, scored, and thresholded; degraded or unknown slices may not silently inherit live authority from healthier neighbors.

Calm truth may remain allowed only while the verdict is `live`. `diagnostic_only`, `recovery_only`, and `blocked` must suppress calm success and writable affordances even when local projections still look green.

## Simulator contract
The local simulator must emit the same raw freeze rows, channel rows, trust rows, and final verdicts that later CI/CD, governance, canary, parity, and provenance inputs will enrich in production.
