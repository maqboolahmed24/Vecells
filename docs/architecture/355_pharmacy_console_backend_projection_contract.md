# 355 Pharmacy Console Backend Projection Contract

## Purpose

`355` freezes the backend truth family that later Phase 6 pharmacy-console frontend tracks must consume. The authoritative runtime is `/Users/test/Code/V/packages/domains/pharmacy/src/phase6-pharmacy-console-engine.ts`.

The console is not allowed to assemble compare, supply, handoff, or assurance posture client-side. One canonical backend family now provides:

- queue summary and worklist truth
- case workbench and mission-frame truth
- medication validation and inventory support-region truth
- comparison fencing and supply computation truth
- handoff, settlement, continuity-evidence, and assurance truth

## Upstream authorities

The 355 service is a read-and-shape layer over the already-frozen Phase 6 authorities:

- `346` pharmacy case lifecycle, lineage, mutation fences, and close blockers
- `348` directory choice, selected-provider truth, and consent-stage bindings
- `350` dispatch truth, proof posture, and transport settlement
- `352` outcome truth, reconciliation gates, and review debt
- `353` bounce-back and reopen posture
- `354` operations and practice-visibility truth

`355` adds no competing calm-completion model. It translates these authorities into the future pharmacy-console mission frame.

## Same-shell mission laws

The backend follows the local blueprint laws:

- one case, one checkpoint, one dominant action, one promoted support region
- comparison, inventory review, handoff, and assurance remain same-shell postures of the current case
- only one support region is auto-promoted at a time
- calm release, handoff completion, reopen completion, or closure are forbidden while canonical settlement, continuity evidence, or outcome truth disagree
- stale fences or stale continuity proof must degrade the current path into review-required or blocked posture rather than silently rebinding to current defaults

## Service family

The module publishes the exact builder and service families required by the prompt:

- `PharmacyConsoleSummaryProjectionBuilder`
- `PharmacyConsoleWorklistProjectionBuilder`
- `PharmacyCaseWorkbenchProjectionBuilder`
- `MedicationValidationProjectionBuilder`
- `InventoryTruthProjectionBuilder`
- `InventoryComparisonProjectionBuilder`
- `InventoryComparisonFenceService`
- `SupplyComputationService`
- `PharmacyHandoffProjectionBuilder`
- `PharmacyActionSettlementProjectionBuilder`
- `PharmacyConsoleContinuityEvidenceProjectionBuilder`
- `PharmacyAssuranceProjectionBuilder`

The public factories are:

- `createPhase6PharmacyConsoleStore()`
- `createPhase6PharmacyConsoleBackendService()`

## Canonical projection inventory

The backend publishes these projection families exactly:

- `PharmacyConsoleSummaryProjection`
- `PharmacyConsoleWorklistProjection`
- `PharmacyCaseWorkbenchProjection`
- `PharmacyMissionProjection`
- `MedicationValidationProjection`
- `InventoryTruthProjection`
- `InventoryComparisonProjection`
- `PharmacyHandoffProjection`
- `PharmacyHandoffWatchProjection`
- `PharmacyActionSettlementProjection`
- `PharmacyChoiceTruthProjection`
- `PharmacyDispatchTruthProjection`
- `PharmacyOutcomeTruthProjection`
- `PharmacyConsentCheckpointProjection`
- `PharmacyConsoleContinuityEvidenceProjection`
- `PharmacyAssuranceProjection`

Each projection exposes explicit freshness, trust, actor, and settlement metadata so later UI work never infers calmness from timestamps, local command acknowledgement, or transport acceptance.

## Inventory support-region truth

`InventoryTruthProjection` is shaped for one promoted support region, not for a detached stock page. Per relevant inventory record it carries:

- product identity
- pack basis
- available and reserved quantity
- lot reference when policy allows
- expiry band
- storage requirement and governed-stock flags when relevant
- location reference when policy allows
- verification timestamps
- freshness confidence and freshness state
- quarantine and supervisor-hold posture

The frozen freshness model is enforced in backend truth:

- `freshnessRatio = clamp((now - verifiedAt) / max(1, staleAfterAt - verifiedAt), 0, 2)`
- `fresh` when ratio is below `0.67`
- `aging` when ratio is at least `0.67` and below `1`
- `stale` when ratio is at least `1`
- `unavailable` when timestamp or trust evidence is missing

If a hard-stop freshness boundary has been crossed, release, substitution, and partial-supply paths are blocked until refresh or governed override.

## Comparison fence and supply computation laws

`InventoryComparisonProjection` publishes typed candidate rows with the blueprint-required comparison fields, including:

- candidate identity and equivalence class
- inventory truth linkage
- freshness and expiry posture
- pack basis and selected quantity maths
- coverage and remaining-units maths
- substitution policy state
- approval burden, patient communication delta, and handoff consequence refs
- reservation state, rank, and rank-reason refs
- commit-ready or blocked posture

`InventoryComparisonFence` binds a candidate choice to one reviewed stock and policy snapshot. A fence is invalidated when any material comparison input drifts, including:

- availability
- expiry band
- freshness or trust posture
- quarantine or supervisor hold
- substitution policy

The previous fence is preserved as read-only evidence so the shell can explain the drift without pretending the old choice is still current.

`SupplyComputation` is the normalized fulfilment maths surface. It expresses:

- prescribed quantity
- pack basis
- selected pack count and selected base units
- quantity delta
- split-pack remainder
- substitution delta
- patient-facing consequence
- handoff impact

Later UI work may present this in cards or compare tables, but it may not recompute the numbers.

## Handoff, settlement, and assurance laws

`PharmacyHandoffProjection` and `PharmacyHandoffWatchProjection` expose the current same-shell handoff posture. `handoff_ready` may verify only when:

- every required medication line is verified or governed-resolved
- every supplied line has a bound `SupplyComputation`
- required communication deltas have been previewed
- inventory freshness is not stale
- no unresolved action settlement remains
- no active watch-window blocker or close blocker remains

`PharmacyActionSettlementProjection` is an adapter over canonical dispatch and outcome settlements. It must surface:

- `canonicalSettlementType`
- `canonicalSettlementRef`
- `mutationGateRef`
- `fenceEpoch`
- agreement or blocked posture

`PharmacyConsoleContinuityEvidenceProjection` is the pharmacy-shell bridge into the assurance spine. The console may preserve queue anchor and chosen support-region context locally, but it may not render quiet release or closure unless continuity evidence still validates the same case, mission scope, selected-anchor tuple, settlement chain, and publication tuple.

`PharmacyAssuranceProjection` is the final server-side statement of whether the case can be shown as routine, review-required, or blocked. Outcome review, stale continuity, consent drift, proof drift, or unresolved action settlement must all keep assurance non-calm.

## Persistence surface

The 163 migration publishes durable tables for:

- medication line support state
- inventory support records
- inventory comparison fences
- supply computations
- summary, worklist, workbench, mission, validation, inventory, comparison, handoff, continuity, action-settlement, and assurance projections
- pharmacy-console audit history

That persistence surface keeps later 356 to 365 frontend work on one frozen backend contract rather than ad hoc browser-local assembly.
