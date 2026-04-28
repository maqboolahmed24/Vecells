# Patient Linkage Match Model And PDS Seam

Status: frozen for Phase 2 patient-link implementation  
Primary artifacts: `172_candidate_search_spec.schema.json`, `172_patient_link_decision.schema.json`, `172_link_threshold_matrix.csv`, `172_pds_enrichment_seam.yaml`

## Boundary

Patient linkage is a separate authority path from authentication, ownership claim, contact preference, and local session creation.

| Input authority | May do | Must not do |
| --- | --- | --- |
| `AuthBridge` | Submit NHS login evidence refs and subject refs to `CandidateSearchSpec`. | Create `IdentityBinding`, set `Request.patientRef`, or imply ownership. |
| `PatientLinker` | Build candidate set, score candidates, emit `PatientLinkDecision`. | Advance lineage binding or write `Episode.patientRef`. |
| `IdentityBindingAuthority` | Append binding versions and compare-and-set current lineage binding. | Read raw evidence values outside vault references. |
| `SessionGovernor` | Consume the current `PatientLink` and binding fence when deciding projection posture. | Treat session creation as patient linkage. |
| `PdsEnrichmentProvider` | Enrich candidate search when all gates pass. | Become an ambient side effect or communication-preference writer. |

`PatientLink` is derived from the latest settled `IdentityBinding` version and calibrated evidence. It is not a rival writer for binding truth.

## Candidate Search

`CandidateSearchSpec` freezes the candidate universe before scoring. The allowed search sequence is:

1. Use `nhs_number_hash_exact` only when permitted, present, and evidence-vault referenced.
2. If the exact identifier is absent or unusable, use the bounded demographic set: date of birth, normalized names, postcode prefix, address tokens, and contact-claim digest with provenance penalty.
3. Include `pds_demographic_ref` only through `PDS_ENRICHMENT_SEAM_172` after feature flag, legal basis, onboarding, and secure connectivity all pass.
4. Stop at the frozen candidate set and candidate limit. Free-text rummaging, browser-memory keys, route-local heuristics, and local controller widening are forbidden.

Every candidate set must be immutable for the associated `MatchEvidenceBasis`. Later demographic refresh creates a new candidate set; it does not rewrite the prior basis.

## Calibrated Decision Model

`PatientLinkDecision` records probability semantics explicitly:

| Field | Meaning |
| --- | --- |
| `P_link` | Calibrated posterior for the winning candidate, not a raw score. |
| `LCB_link_alpha` and `UCB_link_alpha` | Link confidence interval at the profile alpha. |
| `P_subject` and `LCB_subject_alpha` | Independent subject-to-patient proof. |
| `runnerUpProbabilityUpperBound` | Upper confidence bound for the nearest rival candidate. |
| `gap_logit` | Log-odds separation between winner and runner-up. |
| `confidenceModelState` | `calibrated`, `drift_review`, or `out_of_domain`. |

Durable auto-link is allowed only when the route row in `172_link_threshold_matrix.csv` permits it and all checks pass:

- `confidenceModelState = calibrated`
- `LCB_link_alpha >= auto_link_lcb_min`
- `runnerUpProbabilityUpperBound <= runner_up_ucb_max`
- `gap_logit >= gap_logit_min`
- `LCB_subject_alpha >= subject_lcb_min`
- policy allows automatic linking for that route sensitivity

If the winner is strong enough for safe progress but not durable auto-link, emit `provisional_verified`. If the runner-up is close, model state drifts, legal basis is missing, or calibration is unavailable, fail closed to `ambiguous`, `correction_pending`, or manual-review-only posture.

## Link State Mapping

| `PatientLink.linkState` | Binding intent | Patient posture | Capability effect |
| --- | --- | --- | --- |
| `none` | `submit_candidate_refresh` | limited or provisional mode | no patient-specific reveal |
| `candidate` | `submit_candidate_refresh` | details may be searched, not trusted | step-up or recovery only |
| `provisional_verified` | `submit_provisional_verify` | details found, confirmation needed | non-irreversible actions only |
| `verified_patient` | `submit_verified_bind` | signed in and ready | route ceiling may allow read/write |
| `ambiguous` | `submit_candidate_refresh` | unable to confidently match | bounded recovery or manual review |
| `correction_pending` | `submit_repair_signal` | identity hold | writable access blocked |
| `revoked` | `submit_revocation_signal` | identity hold | deny or recovery only |

`Request.patientRef` and `Episode.patientRef` derive only from the current authority-settled binding. No route, controller, session, PDS adapter, support tool, or projection may mutate those fields independently.

## Optional PDS Seam

`172_pds_enrichment_seam.yaml` freezes PDS as an optional enrichment provider port:

- `enabledByDefault: false`
- legal basis evidence is required
- NHS onboarding and API access approval are required
- secure connectivity and managed secret references are required
- timeout fallback is `local_matching_only`
- response can supply `pdsDemographicsRef`, lookup outcome, provenance penalty, and unavailable reason only

PDS can improve candidate evidence, but it does not replace local matching, establish identity binding, create sessions, or update communication preferences.

## IM1 And GP-Link Posture

GP linkage-key and IM1-derived behavior remain disabled unless live IM1 prerequisites and policy approval exist. The seam may be represented as `disabled_until_live_im1_prerequisites`; there is no fake always-on GP-link shortcut.

## Gap Closures

This pack closes:

- `GAP_RESOLVED_PHASE2_LINK_AUTH_NOT_BINDING_V1`
- `GAP_RESOLVED_PHASE2_LINK_CALIBRATED_PROBABILITY_V1`
- `GAP_RESOLVED_PHASE2_LINK_RUNNER_UP_SEPARATION_V1`
- `GAP_RESOLVED_PHASE2_LINK_PDS_GOVERNED_SEAM_V1`
- `GAP_RESOLVED_PHASE2_LINK_CONTACT_PREFERENCE_SEPARATION_V1`
- `GAP_RESOLVED_PHASE2_LINK_UI_STATE_GRAMMAR_V1`
- `GAP_RESOLVED_PHASE2_LINK_THRESHOLD_PLACEHOLDERS_V1`
