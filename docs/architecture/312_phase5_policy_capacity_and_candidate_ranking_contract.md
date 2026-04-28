# 312 Phase 5 Policy Capacity And Candidate Ranking Contract

Contract version: `312.phase5.policy-capacity-ranking-freeze.v1`

This document freezes the Phase 5 policy tuple, source-admission, and candidate-ranking contract pack. The tuple exists to stop policy and ranking drift from hiding inside search code, practice-visibility rules, or stale-feed copy.

## Compiled policy tuple

One explicit compiled tuple carries:

1. `HubRoutingPolicyPack`
2. `HubVarianceWindowPolicy`
3. `HubServiceObligationPolicy`
4. `HubPracticeVisibilityPolicy`
5. `HubCapacityIngestionPolicy`
6. the current `rankPlanVersionRef`
7. the current `uncertaintyModelVersionRef`

The tuple is identified by one `policyTupleHash`. All candidate normalization, frontiers, rank proofs, and later offer or queue consumers must bind that exact hash.

## Policy-family boundary matrix

| Family | May change patient-offerable? | May change direct commit? | May rescore rank? | May mint ledger? | May create ack debt? |
| --- | --- | --- | --- | --- | --- |
| Routing pack | Yes | Yes | No | No | No |
| Variance window pack | Yes | Yes | No | No | No |
| Service obligation pack | No | No | No | Yes | No |
| Practice visibility pack | No | No | No | No | Yes |
| Capacity ingestion pack | Yes | Yes | No | No | No |

## Non-negotiable policy law

1. Routing, approved variance, and capacity admission decide patient-offerable and direct-commit frontiers.
2. Service-obligation and practice-visibility rules may mint ledgers, exception records, visibility deltas, and acknowledgement debt, but they may not silently re-score, hide, or reorder candidates.
3. Quarantined-source candidates may never become bookable or patient-offerable.
4. Degraded-source candidates may remain visible only for diagnostic or callback reasoning, not ordinary direct-booking truth.

## Ranking formula pack

| Formula | Expression | Units | Range |
| --- | --- | --- | --- |
| `windowClass(c,s)` | `requiredWindowFit(c,s)` | ordinal band | {2,1,0} |
| `u_modality(c,s)` | `1 when modality is compatible, otherwise 0` | unitless | {0,1} |
| `u_access(c,s)` | `accessibilityFit(c,s)` | unitless | [0,1] |
| `u_travel(c,s)` | `exp(-travelMinutes(c,s) / tau_travel)` | unitless | (0,1] |
| `u_wait(c,s)` | `exp(-waitMinutes(s) / tau_wait)` | unitless | (0,1] |
| `u_fresh(c,s)` | `exp(-stalenessMinutes(s) / tau_fresh)` | unitless | (0,1] |
| `baseUtility(c,s)` | `w_modality * u_modality(c,s) + w_access * u_access(c,s) + w_travel * u_travel(c,s) + w_wait * u_wait(c,s) + w_fresh * u_fresh(c,s)` | unitless | [0,1] |
| `uncertaintyRadius(c,s)` | `epsilon_alpha(c,s)` | unitless risk radius | [0,+inf) |
| `robustFit(c,s)` | `baseUtility(c,s) - lambda_uncertainty * uncertaintyRadius(c,s)` | unitless | (-inf,1] |

Persisted ordering law:

1. `windowClass` descending
2. source trust tier descending
3. `robustFit` descending
4. `travelMinutes` ascending
5. `startAt` ascending
6. `candidateId` ascending

## Source-trust and admission law

| Trust state | Tier | Patient-offerable | Direct commit | Diagnostic visibility |
| --- | --- | --- | --- | --- |
| trusted | 2 | yes | yes | yes |
| degraded | 1 | no | no | callback_only_or_diagnostic_only |
| quarantined | 0 | no | no | ops_only_diagnostic |

## Snapshot, decision plan, and ledgers

- `NetworkCoordinationPolicyEvaluation` binds the five-family pack refs and separate disposition vocabularies under one `policyTupleHash`.
- `NetworkCandidateSnapshot` binds all normalized candidates, the current rank plan, the uncertainty model, and the generated proof refs.
- `CrossSiteDecisionPlan` persists ordered candidates, dominance removals, and the direct-commit, patient-offerable, callback-only, and diagnostic-only frontier slices.
- `EnhancedAccessMinutesLedger` and `CancellationMakeUpLedger` track operational obligations without altering rank.

## Later-owned typed seams

| Typed seam file | Owner | Purpose |
| --- | --- | --- |
| PHASE5_INTERFACE_GAP_POLICY_CAPACITY_QUEUE_AND_SLA.json | `future_phase5_queue_and_sla_track` | Freeze the later-owned queue risk and workbench consumers that must reuse the persisted 312 candidate proof instead of re-ranking cases from raw candidate fields. |
| PHASE5_INTERFACE_GAP_POLICY_CAPACITY_PATIENT_CHOICE_AND_DISCLOSURE.json | `seq_313` | Freeze the later-owned patient-choice and disclosure consumers that must preserve the same ordered frontier and explanation tuple produced by 312. |
