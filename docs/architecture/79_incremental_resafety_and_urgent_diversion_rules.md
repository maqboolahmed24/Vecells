# 79 Incremental Re-Safety And Urgent Diversion Rules

## Rule Pack

Task 079 ships one versioned static rule pack and calibrator seam:

- `safety_rule_pack_v1`
- `safety_calibrator_v1`

The pack separates:

- hard-stop rules
- urgent contributor rules
- residual contributor rules
- dependency-group caps

The rule dependency inventory is published in [safety_rule_dependency_matrix.csv](/Users/test/Code/V/data/analysis/safety_rule_dependency_matrix.csv).

## Incremental Engine

`IncrementalSafetyRuleEvaluator` maintains a request-scoped cache keyed by:

- `requestId`
- `rulePackVersionRef`
- `calibratorVersionRef`

On new evidence it recomputes:

- all hard-stop rules
- rules touching changed feature refs
- rules touching changed dependency refs

This keeps replay-safe safety law deterministic while avoiding full rescoring for bounded deltas.

## Classification Rules

- Explicit allow-list items are the only path to `technical_metadata`.
- Active dependency invalidation upgrades evidence to `contact_safety_relevant`.
- All other evidence defaults to `potentially_clinical`.
- Low-confidence degraded batches fail closed through `misclassificationRiskState = fail_closed_review`.
- Low-assurance contradiction on a live urgent antecedent may open `urgent_hold`, but it may not silently clear urgent truth.

## Material Delta Rules

- `technical_only` and `operational_nonclinical` yield `triggerDecision = no_re_safety`.
- `safety_material` and `contact_safety_material` yield `re_safety_required` unless a pending preemption already owns the lineage.
- `unresolved` yields `blocked_manual_review`.
- `coalesced_with_pending_preemption` preserves one live pending preemption instead of minting a second epoch.

## Urgent Diversion Rules

- `SafetyDecisionRecord` owns `urgent_diversion_required`.
- `UrgentDiversionSettlement` owns whether urgent action is still `pending` or already `issued`.
- `urgent_diverted` is illegal until an issued settlement exists.
- `urgent_live`, `urgent_required`, and `urgent_review` all block routine continuation immediately.
- `fallback_manual_review` keeps preemption open or blocked and still suppresses calm completion.

## Manual Review And Replay Rules

- Exact replay returns the existing `EvidenceAssimilationRecord` and settled safety chain.
- Overlapping in-flight assimilation returns the same append-only assimilation record with `replayDisposition = coalesced_inflight`.
- Weak pharmacy evidence, degraded parsing, or unresolved meaning fail closed to `fallback_manual_review`.
- Pending assimilation, pending preemption, and unsettled urgent issuance all trigger the same routine-continuation fence.
