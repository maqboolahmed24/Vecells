# 227 Overload Honesty, Duplicate Authority, And Reply Window Rules

Task: `seq_227`

Primary rules source: `data/contracts/227_queue_constants_and_threshold_registry.yaml`

## Overload honesty

Fairness claims are security-relevant because they shape operator trust and prioritization behavior.

The frozen overload rule is:

```text
rho_crit = lambdaHat_crit * mean(expectedService_i | escalated_i = 1 or slaClass_i = 3) / (m * muHat)
```

When `rho_crit >= rho_guard`:

- publish `overload_critical`
- emit `triage.queue.overload_critical`
- suppress starvation-free or routine ETA promises
- switch to explicit staffing, diversion, or SLA rebasing posture

This prevents the system from presenting mathematically dishonest fairness guarantees during critical overload.

## Duplicate authority

Duplicate safety is also authority separation.

Frozen rule set:

1. `IdempotencyRecord` owns replay.
2. `ReplayCollisionReview` owns same-fence divergence.
3. `DuplicateCluster` owns review-safe ambiguity and closure-blocking duplicate review.
4. `DuplicateResolutionDecision` owns attach, link, and separate outcomes.

Consequences:

- queue rows may flag `duplicateReview_i`
- queue rows may not imply attach or collapse truth
- operator review may inspect candidate clusters
- operator review may not settle on row adjacency or stale memory

## More-info reply window

The reply window is deny-by-default on drift.

`MoreInfoReplyWindowCheckpoint` is the sole authority for:

- due date
- reminder eligibility
- late-review grace
- expiry posture
- same-shell reply eligibility

This closes three unsafe shortcuts:

1. browser-local countdown timers acting as authority
2. secure-link TTL acting as cycle expiry
3. stale request-summary copy acting as reply posture

## More-info supersession

Exactly one active actionable checkpoint may govern a lineage at a time.

When a replacement cycle is issued:

- append `supersedesCycleRef`
- mark the older checkpoint `superseded`
- cancel the older reminder schedule
- revoke older reply grants
- preserve the older cycle as visible superseded history

That prevents parallel active patient loops.

## Response disposition before assimilation

Every reply must first classify to one and only one `MoreInfoResponseDisposition`:

- `accepted_in_window`
- `accepted_late_review`
- `superseded_duplicate`
- `expired_rejected`
- `blocked_repair`

Only the two accepted states may continue into evidence assimilation and re-safety.

That means:

- `superseded_duplicate` may not mint a second snapshot
- `expired_rejected` may not reopen routine workflow
- `blocked_repair` may not silently disappear into UI recovery

## Grant expiry versus cycle expiry

Secure-link or session TTL may narrow entry.

It may not:

- extend the active cycle
- redefine due state
- redefine late-review grace
- redefine expiry posture

If the grant expires while the checkpoint is still `open`, `reminder_due`, or `late_review`, the same shell must recover to the current cycle summary or step-up path.

## Re-safety churn guard

The frozen churn protection rule is:

- `N_reopen_max = 3`
- `W_reopen = 24h`

If more than three re-safety cycles occur within 24 hours without a stable clear or clinician-resolution event, automatic routine requeue is suppressed and supervisor review is escalated.
