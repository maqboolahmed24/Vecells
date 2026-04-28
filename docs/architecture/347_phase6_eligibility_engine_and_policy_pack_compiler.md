# 347 Phase 6 Eligibility Engine And Policy Pack Compiler

`par_347` turns Pharmacy First eligibility into immutable policy data plus deterministic compiled evaluation instead of inline branch logic.

## What is authoritative

- `packages/domains/pharmacy/src/phase6-pharmacy-eligibility-engine.ts` is the only mutation and evaluation authority for `PharmacyRulePack`, `PathwayDefinition`, `PathwayTimingGuardrail`, `EligibilityExplanationBundle`, and replayable `PathwayEligibilityEvaluation`.
- The engine consumes the frozen contracts from `342` and the launch boundary from `345`; later Phase 6 tracks must consume these outputs, not recompute pathway choice.
- `346` remains the `PharmacyCase` state-machine owner. `347` integrates through `evaluateCurrentPharmacyCase()` and writes the selected pathway, service lane, and eligibility reference back into the case kernel.

## Frozen object family

- `PharmacyRulePack` is immutable once promoted and carries effective dating, predecessor/supersession refs, compile evidence, validation history, promotion metadata, and retirement metadata.
- `PathwayDefinition` freezes the seven first-production pathways, required symptom inputs, pathway-specific exclusions, red-flag bridge references, fallback rule linkage, and supply/escalation posture.
- `PathwayTimingGuardrail` binds one guardrail per pathway/version so later provider-choice tracks inherit a deterministic timing source.
- `EligibilityExplanationBundle` emits one patient-facing explanation, one staff-facing explanation, matched-rule refs, threshold snapshot strings, and the next-best endpoint suggestion from the same evaluation facts.
- `PathwayEligibilityEvaluation` freezes the evidence snapshot, selected rule pack version, evaluated candidate set, matched rules, threshold snapshot, gate result, final disposition, fallback reason, and shared evidence hash.

## Pack lifecycle

1. `importDraftRulePack()` normalises and stores a draft version.
2. `validateRulePack()` checks schema completeness, threshold completeness, precedence uniqueness, explanation text coverage, timing-guardrail binding, and fallback global-block law.
3. `compileRulePack()` emits one deterministic compiled artifact with stable pathway order and a `compileHash`.
4. `runGoldenCaseRegression()` replays the frozen golden cases and blocks promotion when expected behaviour drifts.
5. `promoteRulePack()` promotes the immutable version and only machine-resolves overlaps when the pack explicitly declares `machine_resolved_supersede_previous`.
6. `retireRulePack()` or supersession closes the window without mutating already-promoted versions in place.

## Deterministic evaluation law

For each named pathway `p`, the engine computes:

- `a_p(x)` from the hard age/sex gate
- `s_req(p,x)` from weighted required-symptom support
- `s_comp(p,x)` from weighted completeness
- `s_excl(p,x)` from pathway-specific exclusion maxima
- `s_global(x)` from global exclusions plus red-flag bridges
- `s_contra(p,x)` from contradiction rule maxima
- `eligibilityConfidence(p,x)` from the frozen multiplicative formula and the pack-owned `eta_*` thresholds

Then it applies the frozen admission law:

- immediate ineligible return when `s_global(x) >= tau_global_block`
- pathway hard failure when age/sex, pathway exclusion, or contradiction thresholds are breached
- eligibility only when `tau_req_pass`, `tau_min_complete`, and `tau_eligible` are all satisfied
- deterministic selection by precedence ordinal first, then confidence descending, then lexical pathway code
- minor-illness fallback only when no named pathway is eligible, no global block is active, and all failures were pathway-specific

Fallback scoring uses the pack-owned feature catalog, `xi_minor_feature_weight`, `tau_minor_eligible`, and `epsilonFloor`. Negative-polarity features are inverted before scoring so penalties cannot accidentally improve fallback eligibility.

## Replay and comparison

- Replay keys are deterministic over pharmacy case, rule pack, and canonical evidence snapshot.
- `replayHistoricalEvaluation()` re-runs historical evidence against the original or a candidate pack.
- `comparePackVersions()` returns threshold deltas plus baseline/candidate evaluations from the same evidence snapshot.
- `runGoldenCaseRegression()` enforces the frozen expected outputs and can additionally mark `forbidden_behavior_drift` when a candidate diverges from a baseline pack on protected cases.

## Persistence shape

`services/command-api/migrations/155_phase6_pharmacy_eligibility_engine.sql` freezes production-shaped tables for:

- immutable rule packs
- threshold-set snapshots
- pathway definitions
- timing guardrails
- compiled artifacts
- golden cases
- explanation bundles
- evaluation history

The runtime repository in this task stays in-memory for local proofs, but the migration fixes the storage contract for later adapters.
