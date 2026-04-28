# 408 Algorithm Alignment Notes

## Blueprint Alignment

The implementation follows Phase 8D in `blueprint/phase-8-the-assistive-layer.md`:

- The runtime builds a `DocumentationContextSnapshot` before composition.
- Draft outputs are sectioned artifacts, not free-form chat blobs.
- Templates are approved and family-specific.
- Evidence spans are attached through immutable `EvidenceMapSet` and `EvidenceMap` rows.
- Contradiction and unsupported assertion checks feed section risk.
- Support probabilities come from verifier outputs, not decoder probabilities.
- Unsupported sections abstain or become missing-info sections.
- Confidence descriptors are bucketed from calibrated support, coverage, and unsupported-risk values.
- Presentation uses artifact contracts and blocks external handoff without an outbound navigation grant.

## Support Formula

For each output span the runtime computes:

```text
cov = supportWeight / max(1e-6, requiredWeight)
U = 1 - p_sup
    + lambda_conflict * contradiction
    + lambda_unsup * unsupportedAssertionRate
    + lambda_miss * (1 - cov)
confidenceScore = min(p_sup, cov, 1 - U)
```

`p_sup` is `calibratedSupportProbability` from `CalibratedVerifierOutput`. Commands carrying `decoderProbability` are rejected with `decoder_probability_forbidden`.

## Abstention Rules

A section renders only when all render gates pass:

- evidence coverage meets `cDocRender`
- unsupported assertion risk is at or below `thetaDocRender`
- no contradiction or unsupported assertion flag makes the span unsafe
- template conformance is not `non_conformant`
- the section has both a `generatedTextRef` and a calibrated verifier output

Missing required sections are emitted as `missing_info`. Unsafe generated sections are emitted as `abstained` and do not retain a renderable text ref.

Draft abstention is:

- `none` when all required sections render
- `partial` when at least one section renders and a required section is withheld
- `full` when no section renders

`minimumSectionSupport` is calculated only over required rendered sections.

## Calibration Pinning

The runtime has no local fallback thresholds. `DocumentationCalibrationBundle` supplies `cDocRender`, `thetaDocRender`, risk lambdas, confidence buckets, `releaseCohortRef`, `watchTupleRef`, and `calibrationVersion`.

If the active release cohort or watch tuple does not match, or if `validatedWindowState` is not `validated`, the draft may remain as shadow evidence but visible confidence is suppressed and visible presentation is blocked.

## Relationship To 407

Task 407 emits transcript readiness only after immutable derivation and settled redaction. Task 408 treats those transcript artifacts as frozen refs inside `DocumentationContextSnapshot`; it does not reopen transcript derivation, expose raw transcript text, or bypass retention and presentation controls.

## Non-Goals Kept Out

- No final clinical-record writeback.
- No patient-facing AI-authored content.
- No unstructured prompt or chat transcript artifact.
- No raw generated text in command payloads.
- No raw URL export or browser handoff without an outbound navigation grant.
