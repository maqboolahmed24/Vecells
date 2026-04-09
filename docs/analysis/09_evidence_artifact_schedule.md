# 09 Evidence Artifact Schedule

The evidence model is intentionally multi-temporal: creation-time, phase-exit, pre-release, continuous operational, and periodic publication evidence are distinct obligations.

## Creation Time

| Artifact | Workstream | Trigger | Cadence | Gate |
| --- | --- | --- | --- | --- |
| ClinicalRiskManagementPlan baseline | WS_CLINICAL_MANUFACTURER | initial capability activation | Once per new clinical capability family, then supersede on formal restructuring. | initial_capability_gate |
| DPIA baseline packet | WS_DATA_PROTECTION_PRIVACY | new personal-data processing capability | At first activation of a new identity, embedded, messaging, or assistive data-processing pattern. | privacy_gate |
| Retention schedule and artifact class map | WS_RECORDS_RETENTION_GOVERNANCE | new durable artifact family | At creation of any new durable artifact family. | new_artifact_class_gate |
| Assistive intended-use and boundary baseline | WS_ASSISTIVE_AI_GOVERNANCE | first assistive capability activation | Once per capability family before shadow or visible rollout begins. | assistive_boundary_gate |

## Phase Exit

| Artifact | Workstream | Trigger | Cadence | Gate |
| --- | --- | --- | --- | --- |
| Deployment safety and go-live pack | WS_CLINICAL_DEPLOYMENT_USE | phase exit or new live rollout class | At Phase 2 exit, at channel expansions, and before assistive visible rollout. | go_live_safety_gate |
| Interoperability conformance packet | WS_INTEROPERABILITY_EVIDENCE | phase capability exit or new external rail | At phase exits that open new partner or adapter rails, then on material conformance drift. | interop_gate |
| SCAL bundle and NHS App channel evidence pack | WS_NHS_APP_SCAL_CHANNEL | Phase 7 channel activation | Only when Phase 7 becomes active, then before Sandpit, AOS, limited release, and full release transitions. | phase7_scal_submission_gate |

## Pre Release

| Artifact | Workstream | Trigger | Cadence | Gate |
| --- | --- | --- | --- | --- |
| SafetyCase delta packet | WS_CLINICAL_MANUFACTURER | release candidate with changed clinical behavior | Before any candidate that changes clinical behavior can move to release approval. | release_candidate_safety_gate |
| DPIA delta packet | WS_DATA_PROTECTION_PRIVACY | identity, telemetry, embedded, or assistive change | Before any release that changes identity proof, messaging, embedded delivery, telemetry, or assistive subprocessor posture. | privacy_gate, partner_material_change_gate |
| Accessibility audit and semantic coverage pack | WS_ACCESSIBILITY_CONTENT_SERVICE_STANDARD | route, shell, or embedded behavior change | Before any release changing patient, embedded, or governance-facing routes that carry new semantics or recovery posture. | accessibility_gate |
| NHS login partner onboarding pack | WS_PARTNER_ONBOARDING_EVIDENCE | partner configuration or live onboarding movement | Before non-mock onboarding, redirect changes, or live partner expansion. | partner_readiness_gate |
| IM1 pairing and material-change RFC bundle | WS_PARTNER_ONBOARDING_EVIDENCE | material product or AI change affecting IM1 posture | Before any IM1-relevant material change reaches the paired product surface. | partner_material_change_gate |
| Assistive release candidate and regulatory routing pack | WS_ASSISTIVE_AI_GOVERNANCE | assistive material change or visible rollout step | Before every visible rollout step and any material assistive change. | assistive_visible_rollout_gate |
| Release publication parity record | WS_RELEASE_RUNTIME_PUBLICATION_PARITY | release candidate creation | For every release candidate before canary or channel exposure. | release_tuple_gate |
| Recovery evidence and readiness pack | WS_OPERATIONAL_RESILIENCE_RESTORE | pre-release readiness review | Before canary, before widening on materially changed tuples, and before live recovery activation on changed domains. | pre_canary_readiness_gate, widen_resume_gate |

## Continuous Operational

| Artifact | Workstream | Trigger | Cadence | Gate |
| --- | --- | --- | --- | --- |
| HazardLog delta packet | WS_CLINICAL_MANUFACTURER | material clinical behavior change | On every material change to rules, identity, telephony, booking, hub, pharmacy, or assistive behavior. | release_candidate_safety_gate, incident_followup_gate |
| Vendor and subprocessor assurance freshness snapshot | WS_TECHNICAL_SECURITY_ASSURANCE | supplier or subprocessor drift | Continuously monitored with release-time freshness checks for affected dependencies. | security_gate, assistive_visible_rollout_gate |
| Content QA and service-standard review pack | WS_ACCESSIBILITY_CONTENT_SERVICE_STANDARD | copy or patient guidance change | On every patient-facing copy, error, recovery, or channel-specific content delta. | content_and_service_gate |
| Incident, near-miss, and CAPA evidence chain | WS_INCIDENT_NEAR_MISS_REPORTABILITY | incident or near-miss occurrence | On every incident, near miss, and reportability assessment. | incident_command_gate |
| Assistive supplier assurance freshness snapshot | WS_ASSISTIVE_AI_GOVERNANCE | vendor or subprocessor freshness drift | Continuously monitored and checked before widening or resume. | assistive_trust_degradation_gate |
| Standards and dependency watchlist snapshot | WS_RELEASE_RUNTIME_PUBLICATION_PARITY | standards refresh or dependency lifecycle drift | Continuously regenerated when standards or dependency posture changes. | watchlist_clean_gate |

## Periodic Publication

| Artifact | Workstream | Trigger | Cadence | Gate |
| --- | --- | --- | --- | --- |
| Disposition, archive, and deletion governance pack | WS_RECORDS_RETENTION_GOVERNANCE | periodic governance review | Monthly governance pack with additional publication before major retention-rule changes. | governance_pack_gate |
| Training drill and reportability rehearsal record | WS_INCIDENT_NEAR_MISS_REPORTABILITY | scheduled operational rehearsal | Quarterly drills or faster when incident debt or risk posture demands. | operational_readiness_gate |
| Monthly assurance pack | WS_RELEASE_RUNTIME_PUBLICATION_PARITY | period close | Monthly, with additional on-demand packs after major incidents or regulatory changes. | governance_pack_gate |
