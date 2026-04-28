# 408 Phase 8 Structured Documentation Composer

## Scope

Task 408 builds the backend documentation composer for Phase 8D. It creates sectioned artifacts for structured draft notes and message drafts from frozen context snapshots, approved templates, immutable evidence maps, contradiction checks, and pinned calibration bundles.

The composer is not a free-form chat generator. It stores references, lineage, support posture, missing-info flags, and presentation state. It does not store raw generated clinical text, decoder probabilities, or direct final-record writeback targets.

## Runtime Package

Package: `@vecells/domain-assistive-documentation`

Source root: `packages/domains/assistive_documentation/src`

Factory: `createAssistiveDocumentationComposerPlane`

Services:

- `DocumentationContextSnapshotService`
- `DraftComposerOrchestrator`
- `DraftTemplateResolver`
- `DraftNoteArtifactService`
- `MessageDraftArtifactService`
- `EvidenceMapService`
- `ContradictionCheckEngine`
- `DocumentationCalibrationResolver`

## Persisted Objects

- `DocumentationContextSnapshot`: frozen request, task, review bundle, transcript, attachment, history, template, policy, release, and surface refs plus a context hash.
- `DraftTemplate`: approved structured template for one of the supported draft families.
- `DocumentationCalibrationBundle`: render thresholds, risk weights, confidence buckets, release cohort, watch tuple, and validation window state.
- `EvidenceMapSet`: immutable same-artifact map set for an artifact revision and context snapshot.
- `EvidenceMap`: output span to source evidence refs with support and required weights.
- `ContradictionCheckResult`: contradiction flags, unsupported assertion flags, template conformance state, and risk score.
- `DraftSection`: section-level support posture, evidence coverage, unsupported assertion risk, confidence descriptor, and abstention or missing-info state.
- `DraftNoteArtifact`: draft-level support posture, minimum required-section support, abstention state, calibration pins, evidence map ref, and review state.
- `MessageDraftArtifact`: message body ref, single-span support posture, calibration pins, evidence map ref, and review state.
- `DocumentationPresentationArtifact`: summary-first presentation posture with outbound navigation grant checks for external handoff.
- `DocumentationAuditRecord`: actor, route intent, purpose of use, outcome, and reason codes.

## Supported Draft Families

- `triage_summary`
- `clinician_note_draft`
- `patient_message_draft`
- `callback_summary`
- `pharmacy_or_booking_handoff_summary`

The runtime rejects unapproved templates and template family mismatches. Required template sections are always represented in the draft output; missing required inputs become `missing_info` sections.

## Composition Flow

1. `DocumentationContextSnapshotService.createContextSnapshot` freezes context refs and computes `contextHash`.
2. `DraftTemplateResolver.resolveTemplate` loads the approved template for the requested draft family.
3. `DocumentationCalibrationResolver.resolveCalibration` loads the active calibration bundle pinned by release cohort and watch tuple.
4. `EvidenceMapService.createEvidenceMapSet` creates an immutable evidence map set for the draft artifact revision.
5. `ContradictionCheckEngine.recordContradictionCheck` records contradiction, unsupported assertion, and template conformance checks.
6. `DraftComposerOrchestrator.composeDraftNote` computes section support and abstains unsafe sections.
7. `DraftNoteArtifactService.generatePresentationArtifact` creates summary-first presentation artifacts and blocks raw external URLs, direct writeback, or external handoff without an outbound navigation grant.

## Support Computation

The composer uses calibrated verifier outputs only. `decoder_probability_forbidden` is a hard failure.

For each output span:

```text
cov = supportWeight / max(1e-6, requiredWeight)
U = 1 - p_sup
    + lambda_conflict * contradiction
    + lambda_unsup * unsupportedAssertionRate
    + lambda_miss * (1 - cov)
confidenceScore = min(p_sup, cov, 1 - U)
```

`cov` and `U` are clipped to `[0, 1]`. A section renders only when:

- `cov >= cDocRender`
- `U <= thetaDocRender`
- template conformance is not `non_conformant`
- a calibrated verifier output exists
- a `generatedTextRef` exists

Otherwise the section is withheld and receives missing-info flags such as `evidence_coverage_below_threshold`, `unsupported_assertion_risk_above_threshold`, `contradiction_flag_present`, or `required_template_section_missing`.

`minimumSectionSupport` is the minimum coverage over required rendered sections only. Optional rendered sections do not inflate the required-section floor.

## Calibration And Confidence

All render thresholds, risk weights, and confidence buckets come from `DocumentationCalibrationBundle`. There are no local default thresholds.

Visible confidence is suppressed and visible presentation is blocked when:

- the validation window is `missing`, `expired`, or `invalid`
- the active release cohort does not match the calibration bundle
- the active watch tuple does not match the calibration bundle
- `visibleConfidenceAllowed` is false

Shadow composition can still produce auditable artifacts, but `overallConfidenceDescriptor` is `suppressed` and visible inline presentation is blocked.

## Human Control And Writeback

Draft artifacts remain in `draft_pending_review` unless blocked. They do not settle workflow state, write final records, or commit generated content. Presentation artifacts block direct writeback targets and raw external URLs. External preview or browser handoff requires an outbound navigation grant.

## Verification

Primary verification commands:

```bash
pnpm --filter @vecells/domain-assistive-documentation typecheck
pnpm exec vitest run tests/unit/408_draft_section_support_and_abstention.spec.ts tests/integration/408_documentation_context_and_evidence_map.spec.ts tests/integration/408_contradiction_and_calibration_bundle_pinning.spec.ts
pnpm validate:408-phase8-documentation-composer
```
