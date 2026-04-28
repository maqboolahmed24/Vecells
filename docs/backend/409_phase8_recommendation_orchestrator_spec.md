# 409 Phase 8 Recommendation Orchestrator

## Scope

Task 409 builds the backend bounded suggestion orchestrator for Phase 8E. It creates typed, review-only `SuggestionEnvelope` records with risk signals, question recommendations, endpoint hypotheses, conformal prediction sets, abstention records, draft insertion leases, action settlements, and governed presentation artifacts.

The orchestrator is decision support. It does not create `EndpointDecision` records, route patients, commit booking or pharmacy state, or mutate authoritative workflow state. Suggestions remain subordinate to frozen context, review version, decision epoch, policy bundle, lineage fence, and surface binding.

## Runtime Package

Package: `@vecells/domain-assistive-suggestion`

Source root: `packages/domains/assistive_suggestion/src`

Factory: `createAssistiveSuggestionOrchestratorPlane`

Services:

- `SuggestionEnvelopeService`
- `RuleGuardEngine`
- `RiskSignalExtractor`
- `QuestionRecommendationService`
- `EndpointHypothesisRanker`
- `ConformalPredictionSetService`
- `AbstentionService`
- `SuggestionActionService`
- `SuggestionPresentationArtifactService`

## Persisted Objects

- `SuggestionCalibrationBundle`: fixed hypothesis space, release cohort, watch tuple, calibration version, risk matrix, uncertainty selector, conformal bundle, threshold set, and loss matrix.
- `RuleGuardResult`: explicit hard-stop, conflict flags, blocked endpoint codes, allowed suggestion set, and allowed-set hash.
- `RiskSignal`: typed signal with severity, evidence refs, posterior probability, evidence coverage, confidence descriptor, and rule guard state.
- `QuestionSetRecommendation`: typed recommendation with trigger reason, evidence refs, coverage, posterior probability, and confidence descriptor.
- `EndpointHypothesis`: ranked endpoint candidate with rationale ref, support refs, full-space posterior, allowed conditional probability, expected harm, evidence coverage, margin, prediction-set state, and rule-guard state.
- `ConformalPredictionSet`: prediction set built from pinned nonconformity version and `qAlpha`.
- `AbstentionRecord`: first-class abstention for weak evidence, hard stops, high uncertainty, collapsed allowed-set mass, or empty conformal allowed intersection.
- `SuggestionEnvelope`: frozen context-bound envelope with risk refs, hypothesis refs, question refs, confidence descriptor, allowed-set mass, epistemic uncertainty, prediction set, abstention state, calibration pins, policy refs, surface binding, and one-click insert posture.
- `SuggestionDraftInsertionLease`: live draft-only insert lease bound to session, envelope, decision dock, selected anchor, review version, policy bundle, lineage fence, allowed-set hash, and expiry.
- `SuggestionSurfaceBinding`: same-shell surface binding and recovery posture.
- `SuggestionActionRecord`: typed insert, regenerate, dismiss, or abstention acknowledgement action bound to `RouteIntentBinding` and `CommandActionRecord`.
- `SuggestionActionSettlement`: authoritative settlement preserving the action identity through `CommandSettlementRecord`, `TransitionEnvelope`, and recovery disposition refs.
- `SuggestionPresentationArtifact`: summary-first artifact that requires `ArtifactPresentationContract`, masking policy, and outbound navigation grant for external handoff.
- `SuggestionAuditRecord`: actor, route intent, purpose of use, outcome, reason codes, and audit correlation.

## Orchestrator Flow

1. `SuggestionCalibrationBundleService` resolves a pinned calibration bundle for the capability, release cohort, and watch tuple.
2. `RuleGuardEngine` computes `RuleGuardResult` before visible output or draft insertion eligibility.
3. `ConformalPredictionSetService` constructs `ConformalPredictionSet` from full hypothesis scores and the pinned nonconformity threshold.
4. `EndpointHypothesisRanker` validates that every endpoint in the fixed full hypothesis space has a full-space calibrated probability before masking.
5. `RiskSignalExtractor` and `QuestionRecommendationService` persist bounded supporting suggestions with evidence refs and coverage.
6. `SuggestionEnvelopeService` calculates allowed-set mass, derives abstention or review-only posture, resolves surface binding, and emits the `SuggestionEnvelope`.
7. `SuggestionActionService` issues live draft insertion leases, submits typed actions, and settles through authoritative command settlement refs.
8. `SuggestionPresentationArtifactService` emits governed summary artifacts and blocks raw artifact URLs or external handoff without an outbound navigation grant.

## Calibration, Allowed Set, And Harm

The runtime calibrates before masking:

```text
A(x,c) = allowedSuggestionSet from RuleGuardResult
M_A = sum p_full(y | x,c) for y in A(x,c)
p_A(y) = p_full(y | x,c) / max(1e-8, M_A)
coverage = supportedEvidenceWeight / max(1e-6, requiredEvidenceWeight)
H(h) = sum L_c(h,y) * p_full(y | x,c)
Gamma = { y : nonconformityScore(y,x) <= qAlpha }
```

`EndpointHypothesis.posteriorProbability` stores the full-space calibrated probability. `allowedConditionalProbability` is derived only after `M_A` is calculated. Blocked or disallowed endpoints retain their full-space posterior and prediction-set state so material residual risk is not hidden by renormalization.

## Abstention And Review-Only Downgrade

`AbstentionRecord` is first class. The runtime full-abstains when:

- a rule guard hard stop fires
- `M_A < gammaFloor`
- epistemic uncertainty exceeds `uBlock`
- `Gamma` has no allowed endpoint intersection

The runtime downgrades to review-only when:

- calibration, uncertainty selector, or conformal window is not validated
- active release cohort or watch tuple does not match the bundle
- disallowed or higher-severity endpoint mass remains material
- the visible candidate set is not sharp enough for a top hypothesis

Visible confidence and one-click insert are suppressed whenever calibration visibility is not valid. One-click insert is armed only when exactly one visible endpoint is insert-eligible, the envelope is not abstained, and the surface binding is live.

## Draft Action Settlement

`SuggestionDraftInsertionLease` is a draft aid only. `insert_draft` requires a live lease matching the envelope, decision epoch, selected anchor, decision dock, review version, policy bundle, lineage fence, and allowed-set hash.

`SuggestionActionRecord` captures the local action intent. `SuggestionActionSettlement` is the authoritative settlement shape and preserves action identity:

- `insert_draft` may settle as `draft_inserted`
- `regenerate` may settle as `regenerated`
- `dismiss` may settle as `dismissed`
- `acknowledge_abstain` may settle as `abstention_acknowledged`

Stale, expired, invalidated, or mismatched state downgrades to `stale_recoverable`, `blocked_policy`, `blocked_posture`, or `failed`. A panel acknowledgement never becomes workflow truth by itself.

## Presentation And Recovery

Presentation artifacts are summary-first and governed by `ArtifactPresentationContract`. External handoff requires an outbound navigation grant. Raw artifact URLs are blocked. If publication, policy, context, or workspace posture drifts, the backend can return observe-only, recovery-only, placeholder, or blocked posture for the same shell.

## Verification

Primary verification commands:

```bash
pnpm --filter @vecells/domain-assistive-suggestion typecheck
pnpm exec vitest run tests/unit/409_rule_guard_and_abstention_logic.spec.ts tests/integration/409_suggestion_envelope_and_prediction_set.spec.ts tests/integration/409_insert_draft_settlement_and_recovery.spec.ts
pnpm validate:409-phase8-recommendation-orchestrator
```
