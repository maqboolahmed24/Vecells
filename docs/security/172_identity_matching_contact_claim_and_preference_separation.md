# Identity Matching Contact Claim And Preference Separation

Status: frozen for Phase 2 patient-link implementation  
Primary artifacts: `172_contact_claim_and_preference_separation_rules.json`, `172_match_evidence_basis.schema.json`, `172_pds_enrichment_seam.yaml`

## Domain Separation

The platform keeps three domains separate:

| Domain                  | Owner                      | Allowed use                                                   | Forbidden use                                                        |
| ----------------------- | -------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------- |
| `contactClaims`         | `IdentityEvidenceVault`    | Matching evidence, reachability signal, masked recovery hint. | Overwriting `patientPreferredComms` or proving preference truth.     |
| `pdsDemographics`       | `PdsEnrichmentProvider`    | Candidate enrichment and provenance-sensitive match evidence. | Updating patient communication preferences or writing binding truth. |
| `patientPreferredComms` | `PatientPreferenceService` | Notification routing and patient-chosen preference display.   | Proving identity or overwriting auth/PDS evidence.                   |

This separation is mandatory because auth and PDS contact details are evidence domains, while patient communication preferences are a patient-controlled routing domain.

## Evidence Storage

`MatchEvidenceBasis.rawEvidenceRefs` stores only references. Feature values are normalized and bounded:

- no raw identifiers in logs, metrics labels, DOM attributes, URLs, screenshots, or general operational rows
- no NHS number, phone number, email address, or address line outside vault/provider references
- no mutable local match notes as evidence
- no route-local heuristic fields that are absent from `CandidateSearchSpec`
- no PDS payload values stored as hot-row truth

Security events may record the candidate set reference, threshold version, calibrator version, reason codes, and masked display hints.

## Fail-Closed Rules

| Failure                                     | Required posture                                          |
| ------------------------------------------- | --------------------------------------------------------- |
| Missing calibrator version                  | `ambiguous` or `manual_review_only`                       |
| `confidenceModelState = drift_review`       | no durable auto-link                                      |
| `confidenceModelState = out_of_domain`      | bounded recovery or manual review                         |
| Runner-up above ceiling                     | `ambiguous`                                               |
| `gap_logit` below threshold                 | `ambiguous`                                               |
| Subject-proof lower bound below route floor | `provisional_verified` or `ambiguous`, never durable bind |
| PDS legal basis missing                     | `local_matching_only` fallback                            |
| PDS onboarding incomplete                   | `local_matching_only` fallback                            |
| Contact claim conflicts with preference     | preserve preference; open reachability or repair posture  |

The top candidate is never enough by itself. Durable auto-link requires winner lower bound, runner-up ceiling, subject-proof lower bound, and gap-logit separation.

## PDS Controls

The optional PDS seam is blocked unless all of these pass:

1. feature flag `identity.pds_enrichment.enabled`
2. legal-basis evidence reference
3. onboarding and API access approval
4. approved environment
5. secure connectivity and managed secret reference

If any gate fails, the system must continue with local matching only. PDS unavailability must not block public intake or authenticated recovery by itself.

## Repair And Correction

Subject conflict, wrong-patient suspicion, contradictory support correction, or PDS/local mismatch emits a repair signal. It must not rewrite the prior binding. The only legal correction path is:

1. append `IdentityRepairSignal`
2. open or reuse an active repair case
3. freeze writable posture
4. let `IdentityBindingAuthority` append a correction or revocation binding version after governed review
5. release or continue bounded recovery through the authority-owned settlement

## Patient Disclosure

Patient-facing states must be calm and bounded. They may say that details were found, that another confirmation is needed, or that the record could not be matched confidently. They must not expose model probabilities, candidate ranks, demographic comparisons, PDS lookup details, or raw technical identifiers.
