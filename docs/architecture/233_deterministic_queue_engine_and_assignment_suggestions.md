# 233 Deterministic Queue Engine And Assignment Suggestions

Task: `par_233`

This task implements the executable Phase 3 queue engine that `227` froze as contract law.

## Runtime surfaces

- shared queue contract runtime: `packages/api-contracts/src/queue-ranking.ts`
- reservation and queue coordinator bridge: `packages/domains/identity_access/src/reservation-queue-control-backbone.ts`
- phase3 queue command-api seam: `services/command-api/src/queue-ranking.ts`
- queue-control command-api seam: `services/command-api/src/reservation-queue-control.ts`
- route catalog: `services/command-api/src/service-definition.ts`
- queue contract tests: `packages/api-contracts/tests/queue-ranking.test.ts`
- domain queue-control tests: `packages/domains/identity_access/tests/reservation-queue-control-backbone.test.ts`
- command-api integrations: `services/command-api/tests/queue-ranking.integration.test.js`, `services/command-api/tests/reservation-queue-control.integration.test.js`

## Implemented queue objects

The executable stack now materializes and composes these governed objects directly:

| Object | Runtime responsibility |
| --- | --- |
| `QueueRankPlan` | versioned queue constants, formulas, fairness bands, overload policy, suggestion weights |
| `QueueRankSnapshot` | one replayable queue order for one fact cut and one plan version |
| `QueueRankEntry` | one persisted explanation row with tier inputs, normalized factors, blockers, fairness transition, and tie-break inputs |
| `QueueAssignmentSuggestionSnapshot` | downstream reviewer-fit view over the committed queue snapshot |

## Canonical ordering law

The runtime now uses the exact `227` precedence:

1. `escalated_i` descending
2. `slaClass_i` descending
3. `priority_i` descending
4. `max(residualBand_i, contactRiskBand_i)` descending
5. `duplicateReview_i` descending
6. `urgencyCarry_i` descending
7. `u_i` descending
8. `queueEnteredAt` ascending
9. `canonicalTieBreakKey_i` ascending

The within-tier urgency score is computed from the frozen Phase 3 formula and constant set, not from a local weighted-sum shortcut:

```text
u_i = 1 - exp(-(w_sla * slaPressure_i + w_age * ageLift_i + w_residual * residual_i + w_contact * contactRisk_i + w_return * returnLift_i + w_carry * urgencyCarry_i + w_vulnerability * vulnerability_i))
```

`queueDefaultPlan` now matches the Phase 3 `227` registry:

- `queueRankPlanId = queue_rank_plan::phase3_v1`
- `queueFamilyRef = staff_review_routine`
- frozen fairness bands:
  - `band_returned_review`
  - `band_risk_attention`
  - `band_routine`
  - `band_low_intensity`
- `rho_guard = 0.85`
- `epsilon_assign = 0.08`

## Fairness and overload

Routine fairness now uses the frozen deterministic service-cost-aware deficit round robin:

- `serviceCost(head_b) = max(1, expectedService_head_b / s_quantum_b)`
- `ageDebt_b = min(1, max(0, age(head_b) - A_b) / H_b)`
- `credit_b <- min(C_max, credit_b + q_b + gamma_age * ageDebt_b)`
- emit the eligible band with largest `credit_b / serviceCost(head_b)`
- break ties by fixed band order

Critical work and `slaClass_i = 3` bypass the fairness merge only while `rho_crit < rho_guard`.

When `rho_crit >= rho_guard`, the runtime:

- sets `QueueRankSnapshot.overloadState = overload_critical`
- marks explanation payload fairness promise state as `suppressed_overload`
- preserves canonical order but stops implying starvation-free service

## Reviewer suggestion separation

Reviewer fit remains downstream only.

The runtime now persists reviewer suggestions from the frozen Phase 3 formula:

```text
assignScore(i,r) = lambda_skill * skill_{i,r} + lambda_cont * continuity_{i,r} + lambda_load * loadHeadroom_r + lambda_sticky * sameContext_{i,r} - lambda_ctx * contextSwitchCost_{i,r} - lambda_focus * focusPenalty_{i,r}
```

The suggestion engine preserves:

- task ordinal
- canonical tie-break key
- explanation payload ref

It also enforces:

- `mayRewriteCanonicalOrder = false`
- `epsilon_assign` margin before governed auto-claim
- `softWipCapRatio` using reviewer load headroom

## Fenced soft claim

`services/command-api/src/queue-ranking.ts` now exposes `softClaimTask(...)`, which:

1. requires the latest committed `QueueRankSnapshot`
2. requires the target row to remain `eligible`
3. blocks when workspace mutation authority is not `live`
4. forwards the claim through `createPhase3TriageKernelApplication().claimTask(...)`

That means queue-originated claim proposals reuse the same `ownershipEpoch`, `fencingToken`, and `lineageFenceEpoch` law implemented in `231`.

## Query surfaces

The command-api seam now publishes Phase 3 queue query routes:

- `GET /v1/workspace/queues/{queueKey}`
- `GET /internal/v1/workspace/queues/{queueKey}/assignment-suggestions`
- `POST /internal/v1/workspace/queues/{queueKey}/refresh`
- `POST /v1/workspace/queues/{queueKey}/tasks/{taskId}/soft-claim`

The route catalog in `service-definition.ts` now reflects those surfaces explicitly so later workspace tasks consume stored queue truth rather than recomputing rank in the client.

## Fail-closed behavior

The runtime now fails closed when:

- a task references an unsupported fairness band
- queue trust inputs are missing under a plan that requires them
- assignment suggestions attempt to mutate canonical order
- a queue soft claim uses a stale rank snapshot ref
- a queue soft claim arrives while mutation authority is frozen or blocked

## Temporary seams

Two explicit seams remain documented instead of hidden:

1. duplicate-review truth is still supplied to the queue engine as a fact-cut input until `par_234` wires the live duplicate authority feed
2. returned-more-info and next-task continuity wiring remain typed queue inputs until `par_236` and `par_242` publish their authoritative runtime feeds
