# Patient Linker And Match Pipeline Design

Task: `par_178_phase2_track_identity_build_patient_linker_and_match_confidence_pipeline`

## Purpose

`PatientLinker` is the single Phase 2 boundary for bounded local patient search, deterministic feature extraction, calibrated match scoring, ambiguity handling, optional PDS enrichment, and binding-authority intent emission. It produces `PatientLinkDecision` records for `IdentityBindingAuthority`; it never mutates `Request.patientRef`, `Episode.patientRef`, or binding truth directly.

The implementation lives in `services/command-api/src/patient-linker.ts` and exposes `createPatientLinkerApplication()`.

## Authoritative Objects

| Object | Rule |
| --- | --- |
| `CandidateSearchSpec` | Freezes allowed search keys, ignored search keys, provenance, bounded candidate count, PDS seam posture, and the rule that scoring happens only after the candidate set is frozen. |
| `MatchEvidenceBasis` | Stores normalized features, missingness, provenance penalties, drift score, calibrator refs, threshold refs, and raw evidence refs. It does not store raw claim, phone, or PDS payload values. |
| `PatientLinkDecision` | Stores calibrated `P_link`, `LCB_link_alpha`, `UCB_link_alpha`, `P_subject`, `LCB_subject_alpha`, `runnerUpProbabilityUpperBound`, `gap_logit`, `confidenceModelState`, decision class, link state, and `identityBindingAuthorityIntent`. |
| `PatientLinkCalibrationProfile` | Versioned calibrator and threshold policy. Missing profiles fail closed with `LINK_172_CALIBRATION_MISSING_FAIL_CLOSED`. |
| `PatientLinkerAuthorityIntent` | The only output that asks `IdentityBindingAuthority` to settle candidate refresh, provisional verify, verified bind, repair signal, or revocation signal. |
| `PdsEnrichmentProvider` | Optional provider port for governed PDS enrichment. It returns references and outcome codes only. |

## Pipeline

1. `evaluatePatientLink()` receives `PatientLinkSubjectEvidence` containing only evidence refs, provenance sources, normalized search attributes, and source reliability.
2. The PDS seam is invoked through `PdsEnrichmentProvider`. The default provider is disabled, records `LINK_172_PDS_DISABLED_OR_UNAVAILABLE`, and preserves local matching.
3. `CandidateSearchSpec` is built from frozen task-172 search keys. `patientPreferredComms` is always ignored with `LINK_172_PATIENT_PREFS_DO_NOT_PROVE_IDENTITY`.
4. The local patient index adapter returns at most 12 candidates and freezes `candidateSetRef` before scoring.
5. `MatchEvidenceBasis` records normalized feature values: NHS-number hash agreement, date-of-birth agreement, name similarity, postcode similarity, contact-claim agreement with provenance penalty, address-token similarity, source reliability, and step-up support.
6. The calibration repository loads the route-specific `PatientLinkCalibrationProfile`; missing calibration creates out-of-domain scores and no verified or provisional link.
7. The scorer computes `P_link`, confidence bounds, `P_subject`, subject lower bound, runner-up upper bound, and `gap_logit`.
8. Threshold policy evaluates durable auto-link, provisional verification, ambiguous/manual review, no-candidate, and out-of-domain postures.
9. The service appends a `PatientLinkerAuthorityIntent` and calls the authority intent port. The linker recommends only; the authority later settles binding truth.

## Calibrator And Threshold Loading

`createSeedPatientLinkCalibrationProfiles()` publishes versioned seed profiles derived from task 172 threshold policy:

| Route family | Threshold ref | Minimum posture |
| --- | --- | --- |
| `public_intake` | `LINK_THRESH_172_PUBLIC_V1` | `manual_review_only` |
| `signed_in_draft_start` | `LINK_THRESH_172_AUTH_DRAFT_V1` | `provisional_only` |
| `authenticated_request_status` | `LINK_THRESH_172_STATUS_V1` | `auto_link_allowed` |
| `post_sign_in_attachment_write` | `LINK_THRESH_172_ATTACHMENT_V1` | `auto_link_allowed` |
| `sms_continuation` | `LINK_THRESH_172_SMS_V1` | `provisional_only` |
| `identity_repair` | `LINK_THRESH_172_REPAIR_V1` | `manual_review_only` |
| `future_protected_records` | `LINK_THRESH_172_FUTURE_RECORDS_V1` | `manual_review_only` |
| `future_booking_surfaces` | `LINK_THRESH_172_FUTURE_BOOKING_V1` | `manual_review_only` |

The default calibrator uses deterministic logistic scoring over normalized feature families. It is intentionally replaceable: live adjudicated calibrators must preserve the same output fields, threshold refs, confidence bounds, drift behavior, and authority-intent contract.

## Decision Rules

Durable auto-link requires all checks in `autoLinkChecks`:

| Check | Meaning |
| --- | --- |
| `winnerLowerBoundPass` | `LCB_link_alpha` meets the route auto-link floor. |
| `runnerUpCeilingPass` | Runner-up upper bound is below the route ceiling. |
| `gapLogitPass` | Winner/runner-up separation meets `gap_logit` minimum. |
| `subjectProofFloorPass` | `LCB_subject_alpha` meets the subject-proof floor. |
| `driftPass` | `confidenceModelState` is `calibrated`. |
| `policyAllowsAutoLink` | The route calibration posture allows auto-link. |

If these fail but provisional checks pass, the linker emits `provisional_verified` and `submit_provisional_verify`. If runner-up competition is too close, the decision remains `ambiguous` with `LINK_172_RUNNER_UP_TOO_CLOSE`. Missing calibration or out-of-domain drift fail closed and never auto-link.

## PDS Seam

PDS is optional and disabled by default through `createDisabledPdsEnrichmentProvider()`. Enabling PDS still requires legal-basis evidence and returns only `pdsDemographicsRef`, `pdsLookupOutcome`, penalty, and reason codes. PDS output may enrich `CandidateSearchSpec` and `MatchEvidenceBasis`; it cannot overwrite contact claims, patient preferences, session state, or binding truth.

## Persistence

Migration `services/command-api/migrations/093_phase2_patient_linker.sql` adds:

| Table | Purpose |
| --- | --- |
| `patient_link_calibration_profiles` | Versioned calibrators, thresholds, metrics, and coefficients. |
| `patient_link_candidate_search_specs` | Frozen search contracts and ignored-key decisions. |
| `patient_link_candidate_sets` | Candidate-set freeze records. |
| `patient_match_evidence_basis` | Feature, drift, missingness, and provenance basis per candidate. |
| `patient_link_decisions` | Calibrated decisions and authority-intent posture. |
| `patient_link_binding_intents` | Outbound authority recommendations for task 179. |
| `patient_link_pds_enrichment_audit` | PDS disabled/unavailable/enriched audit outcomes. |

## Gap Closures

| Gap | Closure |
| --- | --- |
| `PARALLEL_INTERFACE_GAP_PHASE2_LINKER_CALIBRATED_DECISION_V1` | Scores are emitted as calibrated probabilities with confidence bounds and versioned threshold refs. |
| `PARALLEL_INTERFACE_GAP_PHASE2_LINKER_RUNNER_UP_COMPETITION_V1` | Runner-up upper bound and `gap_logit` are mandatory decision inputs. |
| `PARALLEL_INTERFACE_GAP_PHASE2_LINKER_DRIFT_FAIL_CLOSED_V1` | Missing calibration and out-of-domain drift fail closed. |
| `PARALLEL_INTERFACE_GAP_PHASE2_LINKER_PDS_OPTIONAL_SEAM_V1` | Local matching remains primary; PDS is a disabled-by-default provider port. |
| `PARALLEL_INTERFACE_GAP_PHASE2_LINKER_CONTACT_PREF_SEPARATION_V1` | `contactClaims`, `pdsDemographics`, and `patientPreferredComms` remain separate domains. |
| `PARALLEL_INTERFACE_GAP_PHASE2_LINKER_AUTHORITY_INTENT_PORT_V1` | The linker emits authority intents and never settles binding truth or patient refs. |

## References

- Task 172 contracts: `CandidateSearchSpec`, `MatchEvidenceBasis`, `PatientLinkDecision`, `LinkCalibrationProfile`, `PDS_ENRICHMENT_SEAM_172`, and `CONTACT_PREF_SEPARATION_172`.
- Task 170 contract: `PLB_170_NO_BINDING_MUTATION`, `PLB_170_VAULT_REFERENCE_ONLY`, and `IdentityContext`.
- OWASP logging guidance for keeping sensitive evidence out of logs.
- NHS England API catalogue and PDS onboarding posture for the optional PDS seam.
