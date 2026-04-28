# 355 Inventory Freshness, Fence, and Handoff Rules

## Inventory freshness law

The pharmacy console backend computes freshness explicitly. It does not infer freshness from a UI timer.

Frozen model:

- `freshnessRatio = clamp((now - verifiedAt) / max(1, staleAfterAt - verifiedAt), 0, 2)`
- `fresh` when ratio is below `0.67`
- `aging` when ratio is at least `0.67` and below `1`
- `stale` when ratio is at least `1`
- `unavailable` when verification or trust evidence is missing

Operational effect:

- `aging` may remain reviewable but is not quiet
- `stale` blocks reserve, substitute, partial-supply, and handoff-ready posture
- `unavailable` fails closed

If `hardStopAfterAt` has been crossed, the backend must block the stock-sensitive path until inventory truth is refreshed or governed override is recorded upstream.

## Controlled and governed stock posture

Where stock is controlled or otherwise governed, the backend keeps explicit flags for:

- governed-stock classification
- quarantine or supervisor hold
- location disclosure posture
- trust and verification recency

This follows official operational guidance that controlled-drug handling requires end-to-end SOP coverage, periodic stock checks, safe storage, transport, and auditability. The console therefore exposes a governed posture instead of treating these records as ordinary interchangeable stock.

## Support-region rule

Inventory review is a same-shell promoted support region. It is not a detached stock page.

Operational consequences:

- the current case anchor remains visible while comparison and handoff posture change
- the queue row, workbench, compare surface, and handoff summary must read from the same current fence and supply truth
- when truth drifts, the backend preserves read-only evidence of the previous choice and returns review-required or blocked posture instead of a silent reset

## Fence rules

`InventoryComparisonFence` is required for:

- substitution
- partial supply
- reserve or release inventory actions

The backend invalidates the active fence immediately when any material comparison input changes, including:

- lot or batch availability
- freshness state
- expiry band
- quarantine or supervisor-hold posture
- substitution-policy posture
- selected-candidate digest mismatch

Required invalidation behaviour:

- preserve the previous fence as explainable read-only context
- clear the active commit-ready path
- reopen the case into comparison or inventory review posture

## Supply computation rules

Every commit-worthy stock action must bind to a current `SupplyComputation`.

The computation must expose:

- prescribed quantity
- pack basis
- selected pack count
- selected base units
- quantity delta
- split-pack remainder
- substitution delta
- patient communication consequences
- handoff consequences

Split-pack, therapeutic substitute, or partial-supply flows are not allowed to arm a fence without this normalized maths.

## Handoff readiness rules

`handoff_ready` is only lawful when:

- every required medication line is verified or governed-resolved
- supplied lines have current supply computations
- communication previews have been completed where required
- inventory freshness is not stale
- no unresolved action settlement remains
- no active watch-window blocker or close blocker remains

Examples of blocker codes expected in 355 truth:

- `LINE_VERIFICATION_INCOMPLETE`
- `INVENTORY_FRESHNESS_BLOCKED`
- `ACTION_SETTLEMENT_UNRESOLVED`
- `OUTCOME_REVIEW_ACTIVE`
- `CONTINUITY_EVIDENCE_STALE`

## Settlement and calmness rules

The console may not show quiet release, handoff completion, or calm closure merely because a local mutation was acknowledged.

The path remains non-calm while any of the following hold:

- dispatch settlement is provisional
- outcome truth is under review or gated
- action settlement is blocked or unconverged
- continuity evidence is stale, blocked, or mismatched
- consent checkpoint is non-satisfied

If the action should never proceed, block it. Do not soften that into a warning-only posture.

## Same-shell degraded recovery rules

When drift happens, the backend must keep the same case shell and return one governed degraded posture:

- `review_required` when the user can refresh or re-enter comparison safely
- `not_ready` when stock freshness, settlement, or outcome truth blocks safe handoff
- preserved read-only context when a previous choice or fence is no longer current

The next track may render interruption or error-summary patterns, but the backend already decides whether the case is blocked, review-required, or quiet.
