# 347 Pharmacy Rules And Evaluation API

This task exposes one production-shaped service surface from `packages/domains/pharmacy/src/phase6-pharmacy-eligibility-engine.ts`.

## Rule-pack lifecycle

### `importDraftRulePack(input)`

- Accepts a full `PharmacyRulePackDraftInput`.
- Normalises ordering, refs, thresholds, and text catalogs.
- Stores the draft as `packState = draft`.

### `validateRulePack(rulePackId, validatedAt)`

- Returns `PharmacyRulePackValidationResult`.
- Fails when any frozen pathway is missing, thresholds are incomplete, precedence is non-deterministic, display text is missing, timing guardrails are misbound, or fallback could bypass a global block.

### `compileRulePack(rulePackId, compiledAt)`

- Emits `CompiledPharmacyRulePackSnapshot`.
- Computes one canonical `compileHash` over the stable payload.
- Produces a threshold snapshot that is replay-safe and order-stable.

### `promoteRulePack({ rulePackId, promotedAt, promotedByRef, promotionReason })`

- Re-validates and recompiles before promotion.
- Runs golden-case regression and rejects unsafe candidates.
- Rejects overlapping effective windows unless `overlapStrategy = machine_resolved_supersede_previous`.
- Never edits a promoted version in place.

### `retireRulePack({ rulePackId, retiredAt, retiredByRef, retirementReason, supersededByRulePackId? })`

- Transitions compiled/promoted packs to `retired` or `superseded`.
- Seals the effective window and supersession metadata.

## Evaluation and replay

### `evaluateEvidence({ pharmacyCaseId, evidence, evaluatedAt, rulePackId?, evaluationId?, replayKey? })`

- Resolves the active promoted pack for `evaluatedAt` when `rulePackId` is omitted.
- Returns:
  - `evaluation: PathwayEligibilityEvaluationSnapshot`
  - `explanationBundle: EligibilityExplanationBundleSnapshot`
  - `compiledRulePack: CompiledPharmacyRulePackSnapshot`
  - `replayed: boolean`
- Persists a replay key so equivalent evaluations return the original record instead of minting duplicates.

### `replayHistoricalEvaluation({ evaluationId, replayRulePackId? })`

- Reuses the historical evidence snapshot from the stored evaluation.
- Replays against the original pack or a candidate pack.

### `comparePackVersions({ baselineRulePackId, candidateRulePackId, pharmacyCaseId, evidence, evaluatedAt })`

- Evaluates the same evidence against both packs.
- Returns threshold deltas, behaviour-change flag, both evaluations, and the candidate explanation bundle.

### `runGoldenCaseRegression({ candidateRulePackId, baselineRulePackId? })`

- Replays all frozen golden cases.
- Fails on any expected disposition/pathway/lane/gate drift.
- Adds `forbidden_behavior_drift` when a protected case diverges from the baseline pack.

## Case-kernel seam

### `evaluateCurrentPharmacyCase(input)`

- Accepts `EvaluateCurrentPharmacyCaseInput`.
- Runs eligibility evaluation and then calls `346`’s `evaluatePharmacyCase()`.
- Writes:
  - `eligibilityRef`
  - `candidatePathway`
  - `serviceType`
  - `evaluationOutcome`
- Returns the evaluation bundle plus the `PharmacyCase` mutation result.

## Core persisted outputs

### `PathwayEligibilityEvaluationSnapshot`

Carries the replay-critical fields frozen by `342`:

- `rulePackVersion`
- `evaluatedPathways`
- `matchedRuleIds`
- `thresholdSnapshot`
- `pathwayGateResult`
- `recommendedLane`
- `finalDisposition`
- `unsafeFallbackReasonCode`
- `timingGuardrailRef`
- `fallbackScore`
- `sharedEvidenceHash`
- `evidenceSnapshot`

### `EligibilityExplanationBundleSnapshot`

Always emits:

- one patient-facing explanation
- one staff-facing explanation
- matched-rule refs
- threshold snapshot strings
- one next-best endpoint suggestion

## Determinism contract

- All `alpha_*`, `eta_*`, `xi_*`, and `tau_*` inputs come from the selected pack version.
- Pathway order is compile-time stable.
- Replay keys are canonical over evidence and selected pack.
- A compile hash exists for every compiled/promoted pack and is the promotion evidence for the exact compiled rule set.
