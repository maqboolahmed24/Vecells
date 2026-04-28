# Patient Matching Drift And Fail-Closed Rules

Task: `par_178_phase2_track_identity_build_patient_linker_and_match_confidence_pipeline`

## Boundary Rules

`PatientLinker` may recommend `candidate_refresh`, `provisional_verify`, `verified_bind`, or repair-oriented intents, but it may not settle binding truth. `IdentityBindingAuthority` remains the only component allowed to create or supersede binding versions. The linker may not mutate `Request.patientRef`, `Episode.patientRef`, current binding pointers, session state, communication preferences, or PDS records.

Raw claims, phone numbers, caller identifiers, handset proofs, and raw PDS payloads remain behind the `IdentityEvidenceVault` or provider references. `MatchEvidenceBasis.rawEvidenceRefs` stores only opaque refs.

## Calibrated Decision Requirements

Every scored candidate must carry:

| Field                           | Security meaning                                                           |
| ------------------------------- | -------------------------------------------------------------------------- |
| `P_link`                        | Calibrated probability for candidate-patient linkage.                      |
| `LCB_link_alpha`                | Lower confidence bound used for durable auto-link and provisional checks.  |
| `UCB_link_alpha`                | Upper confidence bound used for runner-up competition checks.              |
| `P_subject`                     | Probability that the subject proof supports the same patient relationship. |
| `LCB_subject_alpha`             | Lower confidence bound for subject-proof floor.                            |
| `runnerUpProbabilityUpperBound` | Upper-bound risk that another candidate remains competitive.               |
| `gap_logit`                     | Explicit winner/runner-up separation in logit space.                       |
| `confidenceModelState`          | `calibrated`, `drift_review`, or `out_of_domain`.                          |

Auto-link requires the lower bound, subject proof floor, runner-up ceiling, `gap_logit`, drift, and route policy checks to pass. A strong top score alone is insufficient.

## Drift And Missing Calibration

Missing calibration returns `LINK_172_CALIBRATION_MISSING_FAIL_CLOSED` and `confidenceModelState = out_of_domain`. It cannot produce `verified_patient` or `provisional_verified`.

Out-of-domain drift returns `LINK_172_MODEL_OUT_OF_DOMAIN_FAIL_CLOSED`. The service emits a bounded authority intent, usually `submit_repair_signal` or `submit_candidate_refresh`, rather than treating the score as authoritative.

Runner-up competition returns `LINK_172_RUNNER_UP_TOO_CLOSE` when the runner-up upper bound or `gap_logit` check fails. This prevents a high top probability from hiding ambiguity.

No candidate returns `LINK_172_NO_CANDIDATE_LIMITED_MODE`, `linkState = none`, and `submit_candidate_refresh`.

## PDS And Domain Separation

PDS enrichment is disabled by default through `PDS_ENRICHMENT_SEAM_172`. It requires feature-flag enablement and legal-basis evidence. If unavailable, local matching continues with `LINK_172_PDS_DISABLED_OR_UNAVAILABLE`.

Domain separation is enforced by `CONTACT_PREF_SEPARATION_172`:

| Domain                  | Allowed use                                   | Forbidden use                                    |
| ----------------------- | --------------------------------------------- | ------------------------------------------------ |
| `contactClaims`         | Match evidence and reachability signal only.  | Overwrite `patientPreferredComms`.               |
| `pdsDemographics`       | Candidate enrichment and match evidence only. | Overwrite contact claims or patient preferences. |
| `patientPreferredComms` | Notification routing and reachability only.   | Prove identity or contact claims.                |

The implementation explicitly ignores `patientPreferredComms` as a search key with `LINK_172_PATIENT_PREFS_DO_NOT_PROVE_IDENTITY`.

## Observability And Data Handling

Logs, metrics, events, DTOs, screenshots, and DOM attributes may contain:

| Allowed                               | Forbidden                                   |
| ------------------------------------- | ------------------------------------------- |
| `patientLinkDecisionId`               | Raw claims or tokens                        |
| `candidateSearchSpecId`               | Raw phone numbers or caller identifiers     |
| `matchEvidenceBasisId`                | Raw PDS demographics                        |
| `candidatePatientRef`                 | Browser memory or free-text notes           |
| reason codes and confidence summaries | Patient preference values as identity proof |

Candidate search uses only frozen keys from `CandidateSearchSpec`; free-text rummaging and route-local heuristics are forbidden.

## Gap Closures

| Gap                                                               | Security closure                                                                           |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PARALLEL_INTERFACE_GAP_PHASE2_LINKER_CALIBRATED_DECISION_V1`     | Versioned calibration and threshold refs are required for scored decisions.                |
| `PARALLEL_INTERFACE_GAP_PHASE2_LINKER_RUNNER_UP_COMPETITION_V1`   | Runner-up upper bound and `gap_logit` are evaluated before verified or provisional output. |
| `PARALLEL_INTERFACE_GAP_PHASE2_LINKER_DRIFT_FAIL_CLOSED_V1`       | Missing or out-of-domain calibration blocks authoritative linking.                         |
| `PARALLEL_INTERFACE_GAP_PHASE2_LINKER_PDS_OPTIONAL_SEAM_V1`       | PDS is optional, legal-basis-gated, and never a binding writer.                            |
| `PARALLEL_INTERFACE_GAP_PHASE2_LINKER_CONTACT_PREF_SEPARATION_V1` | Contact claims, PDS demographics, and patient preferences remain separate.                 |
| `PARALLEL_INTERFACE_GAP_PHASE2_LINKER_AUTHORITY_INTENT_PORT_V1`   | Binding truth and derived patient refs are reserved for `IdentityBindingAuthority`.        |

## External Alignment

The fail-closed posture aligns with OWASP logging guidance for sensitive-data exclusion and NHS England PDS onboarding expectations that live PDS access requires approved legal basis, governed connectivity, and bounded provider behavior.
