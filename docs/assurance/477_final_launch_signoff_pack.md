# Task 477 Final Launch Signoff Pack

This pack is a human-readable index over the canonical signed evidence register. The source of truth is `data/signoff/477_final_signoff_register.json`.

## Launch Decision

- Release candidate: `RC_LOCAL_V1`
- Runtime bundle: `rpb::local::authoritative`
- Wave manifest: `prwm_476_rc_local_v1`
- Signoff blockers: `0`
- Constraint count: `2`
- Backend settlement: `pending`
- Launch approval permitted: `false`

## Authority Tuples

| Lane | Authority | Signer | State | Expiry | Tuple hash |
| --- | --- | --- | --- | --- | --- |
| Security | Security lead | Security Privacy Owner | signed | 2026-07-27T23:59:59.000Z | authority_477_security_lead:7590bff9998049f5 |
| Clinical Safety | Clinical safety officer delegate | Clinical Safety Officer | signed_with_constraints | 2026-06-27T23:59:59.000Z | authority_477_clinical_safety_cso:a570ba2b5f6ae67a |
| Privacy & Records | Data protection officer delegate | Data Protection Officer | signed | 2026-07-27T23:59:59.000Z | authority_477_privacy_dpo:c356b1e2967b7f8f |
| Regulatory/DTAC | Regulatory and DTAC owner | Regulatory DTAC Owner | signed_with_constraints | 2026-06-12T23:59:59.000Z | authority_477_regulatory_dtac:012cc2514050a491 |
| Accessibility & Usability | Accessibility and usability approver | Accessibility Usability Approver | signed_with_constraints | 2026-06-27T23:59:59.000Z | authority_477_accessibility_usability:fe466527e3b82dda |

## Open Exceptions

| Exception | Effective classification | Owner | Expiry | Scope |
| --- | --- | --- | --- | --- |
| ex_477_backend_command_settlement_pending | launch-with-constraint | Release deployment approver | 2026-05-05T23:59:59.000Z | all launch approval mutations |
| ex_477_nhs_app_channel_scal_deferred | launch-with-constraint | NHS App channel owner | 2026-05-12T23:59:59.000Z | NHS App embedded channel only |
| ex_477_assistive_visible_mode_future_scope | not-applicable | Clinical safety officer delegate | not applicable | future assistive visible mode waves |

## Canonical Artifacts

- `data/signoff/477_security_assurance_matrix.json`
- `data/signoff/477_clinical_safety_case_delta.json`
- `data/signoff/477_privacy_dpia_and_records_matrix.json`
- `data/signoff/477_regulatory_and_dtac_evidence_matrix.json`
- `data/signoff/477_accessibility_and_usability_attestation.json`
- `data/signoff/477_supplier_and_dependency_signoff_register.json`
- `data/signoff/477_open_exception_register.json`
