# 145 Submission Envelope Validation Design

`par_145` implements `SEAM_143_VALIDATION_AND_REQUIRED_FIELD_DISCIPLINE` as one exact backend validation layer over the canonical `SubmissionEnvelope`. Required-field truth, conditional visibility, hidden-answer supersession, and submit readiness are server-pinned to the frozen `Phase1IntakeExperienceBundle` from seq_140 instead of inferred from browser heuristics.

## Runtime stance

- `Mock_now_execution`: validation runs against simulator-backed `IntakeDraftView`, `Phase1QuestionDefinitionSet`, attachment settlements, and browser/self-service contact-authority assumptions. The backend already enforces the real submit law even while live identity providers and embedded hosts remain deferred.
- `Actual_production_strategy_later`: authenticated and embedded routes must reuse the same required-field evaluator, supersession exclusion, verdict hash, and submit-readiness rules. Later providers may add better identity or contact proof, but they may not redefine field meaning.

## Canonical objects

- `SubmissionEnvelopeValidationVerdict`: one deterministic verdict envelope for both `draft_save` and `submit`.
- `RequiredFieldMeaningMap`: one machine-readable rendering of question visibility, requiredness, answer state, and payload inclusion.
- `SubmissionEnvelopeValidationIssue`: one stable error/warning/info grammar grouped by field, field group, step, attachment, contact authority, or submit preflight.
- `SubmitReadinessState`: one canonical promotion-oriented summary with blocker codes, missing keys, invalid keys, attachment blockers, contact-authority posture, urgent-state posture, and open gap refs.

## Validation law

1. The service loads the frozen `Phase1QuestionDefinitionSet` and rejects contradictory authoring early.
2. `requiredWhen` and `visibilityPredicate` are evaluated against the server-owned draft answers for the active request type.
3. Hidden branch answers remain in audit history but move to `superseded`; they are removed from `activeStructuredAnswers`, summary truth, and `normalizedSubmissionCandidate`.
4. Draft-save validation is permissive for missing required fields but still fail-fast on shape drift, unknown question keys, enum drift, or invalid cardinality.
5. Submit validation is broader than “all visible fields look filled”. It also checks:
   - `IntakeConvergenceContract` validity
   - contact-preference completeness from seq_139
   - contact-authority posture
   - channel capability ceiling
   - attachment/quarantine state
   - urgent decision posture
   - identity and resume blocking posture

## Gap posture

- `GAP_RESOLVED_CONTACT_AUTHORITY_PHASE1_SELF_SERVICE_MINIMUM_V1`: par_145 resolves the bounded self-service browser contact-authority minimum directly from the frozen Phase 1 contact-preference triple.
- `PARALLEL_INTERFACE_GAP_145_ATTACHMENT_SCAN_PIPELINE_PENDING`: unresolved attachment settlement fails closed and may not look submit-ready.
- `PARALLEL_INTERFACE_GAP_145_SYNCHRONOUS_SAFETY_ENGINE_PENDING`: missing urgent decision truth blocks routine submit.
- `PARALLEL_INTERFACE_GAP_145_EMBEDDED_CONTACT_AUTHORITY_DEFERRED`: embedded paths remain fail-closed until a real authority seam lands.

## Query and projection seam

- `DraftContinuityEvidenceProjectionDocument` is the authoritative query hook for current draft answers, current step, attachment refs, contact preferences, identity posture, and channel capability ceiling.
- `services/command-api/src/submission-envelope-validation.ts` adapts that projection into the canonical validation input and exposes both `evaluateDraftValidation` and `evaluateSubmitReadiness`.
- The projection seam is explicit in `submissionEnvelopeValidationProjectionHookRefs`; par_145 adds no new public event names.

## Event stance

- Public event ownership stays with `SEAM_143_PUBLIC_JOURNEY_AND_EVENT_SPINE` from seq_139.
- par_145 does not mint new public events for validation state transitions. Validation truth is returned synchronously and may be logged or projected by later tracks without changing the public event catalog.

## Determinism requirements

- Verdict hashes are stable across replay of the same validation input.
- Issues are sorted into a deterministic order.
- `RequiredFieldMeaningMap` and `SubmissionEnvelopeValidationVerdict` are machine-readable contracts with no presentation-copy dependence.

## Produced artifacts

- `data/contracts/145_validation_error_contract.json`
- `data/contracts/145_submission_envelope_validation_verdict.schema.json`
- `data/contracts/145_required_field_meaning_map.schema.json`
- `data/analysis/145_required_field_matrix.csv`
- `data/analysis/145_submit_readiness_cases.json`

