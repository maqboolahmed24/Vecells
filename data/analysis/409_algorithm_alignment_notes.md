# 409 Algorithm Alignment Notes

## Blueprint Alignment

The implementation follows Phase 8E in `blueprint/phase-8-the-assistive-layer.md`:

- The runtime is a bounded suggestion orchestrator, not a monolithic model call.
- `RuleGuardResult` is computed before visible suggestions, top hypothesis selection, or one-click draft insertion.
- `SuggestionCalibrationBundle` pins the fixed full hypothesis space, release cohort, watch tuple, calibration version, risk matrix, uncertainty selector, conformal bundle, threshold set, and loss matrix.
- full-space calibrated probabilities are required for every endpoint before rule masking or allowed-set renormalization.
- `EndpointHypothesis` carries rationale refs, evidence coverage, expected harm, confidence descriptor, prediction-set state, rule-guard state, and insert eligibility.
- `AbstentionRecord` is first class for hard stops, weak evidence, high epistemic uncertainty, collapsed allowed-set mass, unsafe residual mass, and empty conformal allowed intersection.
- `SuggestionDraftInsertionLease`, `SuggestionActionRecord`, and `SuggestionActionSettlement` keep one-click insert as a draft proposal path, not authoritative workflow mutation.
- `SuggestionPresentationArtifact` uses artifact presentation contracts and outbound navigation grants instead of raw URLs.

## Probability And Masking

The ranking path validates the fixed full hypothesis space before any masking:

```text
A(x,c) = allowedSuggestionSet from RuleGuardResult
M_A = sum p_full(y | x,c) for y in A(x,c)
p_A(y) = p_full(y | x,c) / max(1e-8, M_A)
coverage = supportedEvidenceWeight / max(1e-6, requiredEvidenceWeight)
H(h) = sum L_c(h,y) * p_full(y | x,c)
Gamma = { y : nonconformityScore(y,x) <= qAlpha }
```

`EndpointHypothesis.posteriorProbability` remains `p_full`. Blocked endpoints retain their full-space probability and prediction-set state so disallowed or higher-severity residual mass cannot be hidden by allowed-set renormalization.

## Abstention Rules

The runtime full-abstains when:

- a rule guard hard stop is present
- `allowedSetMass < gammaFloor`
- `epistemicUncertainty > uBlock`
- the conformal prediction set has no allowed endpoint intersection

The runtime review-only downgrades when:

- calibration visibility is suppressed
- active release cohort or watch tuple differs from the calibration bundle
- disallowed or higher-severity mass remains above `disallowedMassFloor`
- the visible candidate set is not sharp enough to select one supported hypothesis

This is intentionally conservative. A missing or stale calibration window never produces visible confidence or one-click insert.

## Action Settlement

`SuggestionDraftInsertionLease` binds draft insertion to the envelope, decision dock, selected anchor, review version, policy bundle, lineage fence, allowed-set hash, and expiry. `insert_draft` requires a live matching lease.

`SuggestionActionRecord` records the reviewer action, while `SuggestionActionSettlement` records the authoritative settlement through `CommandSettlementRecord`, `TransitionEnvelope`, and `ReleaseRecoveryDisposition`. Settlement preserves the action identity and downgrades stale or invalidated insert attempts to `stale_recoverable`.

## Relationship To 408

Task 408 produces evidence-backed documentation context and artifacts. Task 409 consumes frozen refs such as `DocumentationContextSnapshot` and evidence span refs; it does not reopen transcript or documentation generation, and it does not write generated advice into the record.

## Non-Goals Kept Out

- No `EndpointDecision` creation.
- No autonomous triage, booking, pharmacy, or escalation mutation.
- No free-form chatbot surface.
- No local default calibration thresholds.
- No visible confidence from masked-subset calibration.
- No raw rationale text or raw artifact URL in routine APIs.
- No external handoff without an outbound navigation grant.
