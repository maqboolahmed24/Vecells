# 227 Phase 3 Queue Ranking, Fairness, Duplicate, And More-Info Contracts

Task: `seq_227`

Visual mode: `Queue_Fairness_Duplicate_MoreInfo_Atlas`

This task freezes the second Phase 3 contract pack. It publishes the deterministic queue engine, fairness and overload rules, duplicate-review projection boundary, and more-info reply-window contracts that later implementation work must consume directly.

## Machine-readable sources

- `data/contracts/227_queue_rank_plan.schema.json`
- `data/contracts/227_queue_rank_snapshot.schema.json`
- `data/contracts/227_queue_rank_entry.schema.json`
- `data/contracts/227_queue_assignment_suggestion_snapshot.schema.json`
- `data/contracts/227_duplicate_review_snapshot.schema.json`
- `data/contracts/227_more_info_cycle.schema.json`
- `data/contracts/227_more_info_reply_window_checkpoint.schema.json`
- `data/contracts/227_more_info_reminder_schedule.schema.json`
- `data/contracts/227_more_info_response_disposition.schema.json`
- `data/contracts/227_queue_constants_and_threshold_registry.yaml`
- `data/analysis/227_queue_sort_and_fairness_matrix.csv`
- `data/analysis/227_more_info_checkpoint_and_disposition_cases.csv`
- `data/analysis/227_duplicate_authority_and_relation_cases.json`
- `data/analysis/227_phase3_queue_more_info_gap_log.json`

## Queue ranking

Phase 3 queue order is not a weighted-sum list. It is a deterministic, replayable ordering system with four layers:

1. `QueueRankPlan`
2. `QueueRankSnapshot`
3. `QueueRankEntry`
4. `QueueAssignmentSuggestionSnapshot`

The canonical within-tier formula is frozen exactly:

```text
u_i = 1 - exp(-(w_sla * slaPressure_i + w_age * ageLift_i + w_residual * residual_i + w_contact * contactRisk_i + w_return * returnLift_i + w_carry * urgencyCarry_i + w_vulnerability * vulnerability_i))
```

The canonical stable sort order is frozen exactly:

1. `escalated_i` descending
2. `slaClass_i` descending
3. `priority_i` descending
4. `max(residualBand_i, contactRiskBand_i)` descending
5. `duplicateReview_i` descending
6. `urgencyCarry_i` descending
7. `u_i` descending
8. `queueEnteredAt` ascending
9. `canonicalTieBreakKey_i` ascending

## Versioned constants

`data/contracts/227_queue_constants_and_threshold_registry.yaml` is the authoritative constant set for this freeze.

Key defaults:

| Constant | Value |
| --- | --- |
| `s_min_minutes` | `5` |
| `theta_sla_critical_minutes` | `120` |
| `theta_sla_warn_minutes` | `480` |
| `tau_sla_minutes` | `90` |
| `tau_late_minutes` | `60` |
| `H_late_minutes` | `480` |
| `tau_age_minutes` | `240` |
| `A_cap_minutes` | `1440` |
| `r_base` | `0.35` |
| `r_delta` | `0.40` |
| `r_wait` | `0.25` |
| `tau_return_minutes` | `120` |
| `H_return_minutes` | `720` |
| `rho_guard` | `0.85` |
| `epsilon_assign` | `0.08` |

The within-tier weights are also frozen there. They are repo-runnable defaults for Phase 3 opening. They may be tuned only by issuing a new versioned plan, not by route-local heuristics.

## Fairness and overload honesty

Fairness exists only while the system can honestly sustain it.

Non-critical bands use deterministic service-cost-aware deficit round robin. The current version freezes four non-critical fairness bands:

- `band_returned_review`
- `band_risk_attention`
- `band_routine`
- `band_low_intensity`

Critical work or `slaClass_i = 3` bypasses fairness merge only while `rho_crit < rho_guard`.

When `rho_crit >= rho_guard`:

- emit `triage.queue.overload_critical`
- suppress starvation-free copy
- suppress routine ETA promises
- trigger staffing, diversion, or SLA rebasing policy

That closes the gap where the product could claim fairness guarantees during critical overload.

## Reviewer suggestion separation

Reviewer fit remains downstream only.

`QueueAssignmentSuggestionSnapshot` may optimize:

- skill fit
- continuity
- load headroom
- sticky same-context preference
- context-switch cost
- focus penalty

It may not rewrite:

- canonical task ordinals
- queue eligibility
- source explanation payloads

That boundary is frozen both in schema and in the constant registry.

## Duplicate authority boundary

Phase 3 does not redefine duplicate truth. It reuses the canonical Phase 0 authorities:

| Concern | Authority |
| --- | --- |
| exact or semantic replay | `IdempotencyRecord` |
| divergent same-fence replay | `ReplayCollisionReview` |
| review-safe ambiguity | `DuplicateCluster` |
| attach, link, or separate decision | `DuplicateResolutionDecision` |

`DuplicateReviewSnapshot` is only the staff-facing projection over that authority family.

The key rule is simple:

- queue proximity is not authority
- pairwise similarity is not authority
- the cluster is the review container, not the settlement

## More-info loop

Phase 3 more-info is now a first-class workflow family:

- `MoreInfoCycle`
- `MoreInfoReplyWindowCheckpoint`
- `MoreInfoReminderSchedule`
- `MoreInfoResponseDisposition`

Two laws matter most:

1. `MoreInfoReplyWindowCheckpoint` is the only source of due-state truth.
2. `MoreInfoResponseDisposition` classifies the reply before evidence assimilation and re-safety.

That means:

- client timers are not authority
- secure-link TTL is not cycle expiry
- stale request rows are not authority
- late, expired, superseded, and repair-blocked reply meaning is not inferred later

## More-info policy defaults

The frozen registry publishes two reply-window policies:

| Policy | Due | Late review grace | Reminder offsets |
| --- | --- | --- | --- |
| `more_info_policy::routine_clinical_followup_v1` | `72h` | `48h` | `24h`, `4h` before due |
| `more_info_policy::urgent_clarification_v1` | `24h` | `12h` | `8h`, `1h` before due |

The registry also freezes:

- `N_reopen_max = 3`
- `W_reopen = 24h`

for re-safety churn protection.

## Gap closures

The mandatory queue and more-info gap set is closed in `data/analysis/227_phase3_queue_more_info_gap_log.json`.

- weighted-sum-only queue logic: closed
- reviewer fit rewrites order: closed
- starvation promises survive overload: closed
- duplicate review inferred from proximity: closed
- replay, attach, and duplicate review collapse together: closed
- reply window from client timers: closed
- multiple active more-info loops: closed
- disposition inferred after assimilation: closed

## What later tasks may extend

Later Phase 3 tasks may implement queue engines, duplicate review UI, more-info orchestration, reminder workers, and re-safety execution. They may not replace the formulas, authority boundaries, checkpoint laws, or disposition vocabulary frozen here.
