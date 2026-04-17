# 79 Evidence Assimilation And Safety Design

## Core Law

`EvidenceAssimilationCoordinator` is the sole gateway for post-submit evidence on active lineages, and `SafetyOrchestrator` is the sole owner of canonical classification, preemption, and re-safety.

Every active-lineage ingress must settle:

1. one append-only `EvidenceAssimilationRecord`
2. one append-only `MaterialDeltaAssessment`
3. one append-only `EvidenceClassificationDecision`
4. when required, one append-only `SafetyPreemptionRecord`
5. when required, one append-only `SafetyDecisionRecord`
6. when urgent handling is required, one distinct `UrgentDiversionSettlement`

The implementation in [assimilation-safety-backbone.ts](/Users/test/Code/V/packages/domains/intake_safety/src/assimilation-safety-backbone.ts) composes task 063 immutable evidence storage and snapshot services rather than replacing them. New clinical or contact-safety meaning creates a superseding immutable `EvidenceSnapshot`; technical-only or operational-only change stays derivative-only; unresolved or degraded evidence may remain `hold_pending_review`.

## Coordinator Flow

1. Freeze the ingress boundary as immutable evidence or derivation-backed candidate snapshot intent.
2. Derive canonical `MaterialDeltaAssessment` from changed evidence, feature, dependency, chronology, and fail-closed signals.
3. Set `attachmentDisposition` to `new_snapshot`, `derivative_only`, `replay_existing`, or `hold_pending_review`.
4. Settle one immutable `EvidenceClassificationDecision` over the batch.
5. Invoke `SafetyOrchestrator` only when `triggerDecision = re_safety_required | blocked_manual_review`.
6. Coalesce exact replay and overlapping in-flight assimilation so routine flow cannot fork a second safety epoch.

## Incremental Re-Safety

The rule engine keeps one in-memory cache per request containing:

- feature-support vector
- prior rule-hit bitmap
- prior rule-pack and calibrator versions
- last decision tuple hash

On bounded change it reevaluates only:

- all hard-stop rules
- rules whose antecedent graph touches `Delta_F`
- active reachability rules touched by `Delta_D`

This implements the Phase 0 `O(|Delta_F| + |adj(Delta_F)| + |Delta_D|)` recomputation law instead of full-pack rescoring on every ingress.

## Event Boundary

The command-api seam publishes explicit event catalog entries for:

- `evidence.assimilation.recorded`
- `evidence.material_delta.assessed`
- `evidence.classification.applied`
- `safety.preemption.opened`
- `safety.decision.recorded`
- `safety.urgent_diversion.settled`
- `request.safety_blockers.changed`

These events close the gap where callback, support, booking, pharmacy, or enrichment flows could previously mutate local state without one canonical evidence and safety chain.

## Gap Closures

- Post-submit evidence no longer enters through local feature code. Every simulated ingress uses the same coordinator.
- Immutable snapshot supersession is preserved. New snapshot truth is append-only and linked by supersession through task 063 services.
- Low-assurance contradiction can no longer clear urgent truth implicitly. Hard-stop and contradiction rules still force urgent handling or fail-closed review.
- `urgent_diversion_required` and issued urgent action stay distinct because `SafetyDecisionRecord` and `UrgentDiversionSettlement` persist separately.
- Routine continuation is fenced by `assertRoutineContinuationAllowed`, which blocks stale calm action whenever assimilation, preemption, safety decision, or urgent issuance is unresolved.

## Scenario Coverage

The simulation harness covers:

- post-submit operational-only reply with no re-safety
- clinically material reply that mints a new immutable snapshot and residual review
- low-assurance contradiction that preserves urgent truth
- callback outcome that issues urgent diversion
- support-side contact-safety change
- weak pharmacy outcome and consent withdrawal forcing fallback manual review
- exact replay returning the existing assimilation chain
- overlapping in-flight assimilation coalescing to the same pending preemption
