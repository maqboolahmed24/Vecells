# par_150 Synchronous Safety Engine Design

`par_150` adds the real Phase 1 synchronous safety pass on the immutable submit boundary.

## Runtime path

1. `/Users/test/Code/V/services/command-api/src/intake-submit.ts` promotes the immutable frozen submit cut.
2. The promoted `Request` is screened through `/Users/test/Code/V/services/command-api/src/synchronous-safety.ts`.
3. `/Users/test/Code/V/packages/domains/intake_safety/src/synchronous-safety-engine.ts` derives tri-state features from the canonical `NormalizedSubmission` plus `SubmissionSnapshotFreeze`.
4. The engine appends exactly one `EvidenceClassificationDecision`, one `SafetyPreemptionRecord`, and one `SafetyDecisionRecord`.
5. The same pass updates `Request.currentEvidenceClassificationRef`, `currentSafetyPreemptionRef`, `currentSafetyDecisionRef`, and `safetyDecisionEpoch`.

## Outcome law

The only legal Phase 1 synchronous outcomes remain:

- `urgent_diversion_required`
- `residual_risk_flagged`
- `screen_clear`
- fail-closed `fallback_manual_review`

The engine never issues urgent guidance directly. `urgent_diversion_required` is persisted now; `UrgentDiversionSettlement` is still a separate later settlement owned by the urgent-path track.

## Determinism

- rule-pack version is fixed at `RFRP_142_PHASE1_SYNCHRONOUS_SAFETY_V1@1.0.0`
- calibrator version is fixed at `SCAL_150_IDENTITY_CALIBRATOR_V1`
- record IDs are derived from `requestId`, frozen snapshot ref, epoch, and decision tuple hash
- exact replay returns the existing immutable safety chain instead of writing a second one

## Fail-closed behavior

The pass settles `fallback_manual_review` whenever evidence or runtime trust is not good enough to distinguish calm routine flow safely. Concrete triggers include:

- `evidenceReadinessState = manual_review_only | urgent_live_only`
- blocked contact-authority posture
- blocked mutating resume posture
- critical missingness at or above the authored threshold

Hard-stop rules still dominate any softer urgent or residual score.
