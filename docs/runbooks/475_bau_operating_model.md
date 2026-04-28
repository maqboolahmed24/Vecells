# Task 475 BAU Operating Model

Readiness state: `complete_with_constraints`
BAU model hash: `6ecbb1a661b452add868d83cb6b6e8134197cc3783b23ff196788f088a74b6c7`
Release candidate: `RC_LOCAL_V1`
Runtime publication bundle: `rpb::local::authoritative`

## Operating Rule

BAU readiness evidence may feed future release-wave decisions, but it cannot promote a release wave by itself. Training completion, runbook ownership, escalation paths, governance cadence, and WORM-linked evidence must all remain current.

## Launch Roles

| Role | Responsibility | State | Blockers |
| --- | --- | --- | --- |
| Clinician | Human clinical decision and assistive output approval | complete | None |
| Care Navigator | Patient support routing and safe handoff wording | complete | None |
| Admin | Administrative queue support and channel scripts | complete | None |
| Hub Operator | Network coordination support and transfer acceptance | complete | None |
| Pharmacist | Pharmacy exception review and assistive-seeded content check | complete | None |
| Support Analyst | Support ticket triage, replay, handoff, and escalation | complete | None |
| Governance Admin | Evidence pack, cadence, and scope-safe governance records | complete | None |
| Clinical Safety Officer | Clinical risk, hazard, and assistive incident ownership | complete | None |
| Security Privacy Owner | Security, privacy, redaction, and DSPT-linked training | complete | None |
| Incident Commander | Incident command, out-of-hours rota, and near-miss review | complete | None |
| Service Owner | BAU acceptance and launch operating model ownership | complete | None |
| Release Manager | Release tuple, rollback, and migration support governance | complete | None |
| Supplier Contact | NHS App supplier liaison while channel remains deferred | complete_with_constraints | constraint:475:phase7-channel-deferred |

## Runbooks

| Runbook | Owner | Review cadence | State | Escalation path |
| --- | --- | --- | --- | --- |
| Clinical operations launch huddle | service_owner | 14 days | complete | ep_475_support_ops_out_of_hours |
| Support triage, lineage, and handoff | support_analyst | 30 days | complete | ep_475_support_ops_out_of_hours |
| Assistive human review and incident path | clinical_safety_officer | 30 days | complete | ep_475_clinical_safety |
| NHS App deferred-channel support | service_owner | 30 days | complete_with_constraints | ep_475_nhs_app_supplier_deferred |
| Security and privacy incident response | security_privacy_owner | 30 days | complete | ep_475_security_privacy_incident |
| Rollback rehearsal and release tuple check | release_manager | 14 days | complete_with_constraints | ep_475_release_rollback |
| Accessible training artifact delivery | governance_admin | 60 days | complete | ep_475_support_ops_out_of_hours |
| Governance cadence and assurance pack | governance_admin | 30 days | complete | ep_475_clinical_safety |

## Governance Cadence

| Event | Cadence | Owner | State |
| --- | --- | --- | --- |
| Daily launch and support huddle | daily during launch window | service_owner | complete |
| Weekly clinical safety and assistive review | weekly | clinical_safety_officer | complete |
| Monthly assurance pack and conformance review | monthly | governance_admin | complete |
| NHS App monthly data pack readiness | monthly after future channel activation | service_owner | complete_with_constraints |
| Quarterly incident and rollback rehearsal | quarterly | incident_commander | complete |
| Annual NHS App and NHS login assurance review readiness | annual after future channel activation | service_owner | complete_with_constraints |
