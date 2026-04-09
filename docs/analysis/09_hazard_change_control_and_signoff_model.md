# 09 Hazard, Change Control, and Signoff Model

The change-control model routes concrete implementation deltas into hazard-log updates, safety-case deltas, privacy review, DTAC refresh, release freezes, and partner-specific RFC or SCAL work where the corpus requires them.

## Hazard seed

| Hazard | Scope | Change classes | Controls | Evidence |
| --- | --- | --- | --- | --- |
| Wrong-patient binding or correction failure | Baseline Required | CHG_IDENTITY_BINDING_OR_SESSION, CHG_PARTNER_CONFIGURATION_OR_REDIRECTS | HazardLog delta packet, Identity repair evidence bundle, DPIA delta packet | SafetyCase delta packet, Session and binding regression suites |
| Urgent diversion under-triage or over-triage | Baseline Required | CHG_SAFETY_RULE_PACK, CHG_TELEPHONY_CAPTURE_OR_CONTINUATION | HazardLog delta packet, SafetyDecisionRecord regression, Deployment safety monitoring pack | same_facts_same_safety_outcome regression, urgent diversion decision-versus-settlement proof |
| Telephony evidence inadequacy | Baseline Required | CHG_TELEPHONY_CAPTURE_OR_CONTINUATION | DeploymentSafetyCase annex, Telephony evidence readiness gate, Operational safety monitoring pack | telephony-evidence-readiness gating tests, recording and transcript readiness proof |
| Duplicate suppression or merge hazard | Baseline Required | CHG_IDENTITY_BINDING_OR_SESSION, CHG_TELEPHONY_CAPTURE_OR_CONTINUATION | HazardLog delta packet, Interop conformance matrix, Policy-watch compatibility review | duplicate-resolution tests, cross-channel candidate competition tests |
| Stale projection or false reassurance | Baseline Required | CHG_RUNTIME_TOPOLOGY_OR_DEPENDENCY_ORDER, CHG_PUBLIC_EMBEDDED_SURFACE_OR_ROUTE, CHG_POLICY_OR_STANDARDS_BASELINE_UPDATE | Release publication parity record, Continuity evidence bundle, Recovery evidence pack | continuity-evidence convergence checks, route-contract parity tests |
| False booking confirmation | Baseline Required | CHG_BOOKING_CONFIRMATION_OR_WAITLIST, CHG_HUB_COORDINATION_OR_ACK | Interop conformance matrix, HazardLog delta packet, Release publication parity record | booking confirmation ambiguity regression, practice acknowledgement debt proof |
| Pharmacy dispatch or outcome ambiguity | Baseline Required | CHG_PHARMACY_DISPATCH_OR_OUTCOME | Interop conformance matrix, HazardLog delta packet, Recovery evidence pack | pharmacy outcome reconciliation tests, proof-versus-transport regression |
| Cross-organisation visibility widening | Baseline Required | CHG_PUBLIC_EMBEDDED_SURFACE_OR_ROUTE, CHG_TELEMETRY_OR_DISCLOSURE_SCHEMA, CHG_PARTNER_CONFIGURATION_OR_REDIRECTS | DPIA delta packet, Standards and dependency watchlist snapshot, Retention and disclosure review | visibility and masking tests, acting-scope drift freeze proof |
| Assistive hallucination, overreach, or silent degradation | Assistive Optional | CHG_ASSISTIVE_INTENDED_USE_OR_BOUNDARY, CHG_ASSISTIVE_VISIBLE_WORKFLOW_EFFECT, CHG_ASSISTIVE_VENDOR_MODEL_OR_SUBPROCESSOR, CHG_ASSISTIVE_ROLLOUT_OR_SLICE_EXPOSURE | Assistive release candidate and regulatory routing pack, Intended-use baseline, Supplier assurance freshness snapshot | shadow-versus-human comparison suites, freeze disposition and rollback rehearsal |
| Retention or deletion of still-required artifacts | Ongoing Bau | CHG_RETENTION_POLICY_OR_ARTIFACT_CLASS, CHG_OPERATIONAL_INCIDENT_OR_NEAR_MISS_LEARNING | Retention schedule, Disposition eligibility evidence, Evidence graph completeness review | retention dry-run tests, delete-versus-hold conflict tests |
| Restore failure or dependency recovery-order defect | Baseline Required | CHG_RUNTIME_TOPOLOGY_OR_DEPENDENCY_ORDER, CHG_POLICY_OR_STANDARDS_BASELINE_UPDATE | Recovery evidence and readiness pack, Standards watchlist snapshot | clean-environment restore rehearsal, synthetic constrained recovery journeys |

## Change-trigger matrix

| Change class | Hazard log | Safety case | DPIA | DTAC | Release freeze | Partner RFC/SCAL |
| --- | --- | --- | --- | --- | --- | --- |
| Safety rules, clinical thresholds, or red-flag policy change | yes | yes | conditional | conditional | yes | no |
| Identity binding, NHS login callback, secure-link, or local session ownership change | yes | yes | yes | conditional | yes | conditional |
| Telephony capture, recording, transcript, continuation, or callback-flow change | yes | yes | conditional | conditional | yes | no |
| Local booking confirmation, waitlist, or supplier reconciliation change | yes | yes | no | conditional | yes | no |
| Hub coordination, practice visibility, or acknowledgement behavior change | yes | yes | no | conditional | yes | no |
| Pharmacy dispatch, provider choice, or outcome-reconciliation change | yes | yes | no | conditional | yes | no |
| Notification copy, reminder policy, or channel-specific recovery behavior change | conditional | conditional | conditional | no | conditional | conditional |
| Public, patient, embedded, or governance surface route and shell behavior change | conditional | conditional | conditional | conditional | yes | conditional |
| Runtime topology, trust-zone, workload family, or dependency recovery-order change | conditional | conditional | conditional | yes | yes | no |
| Retention rule, legal-hold behavior, or durable artifact-class change | no | conditional | conditional | no | conditional | no |
| Telemetry, disclosure fence, or audit/export schema change | conditional | conditional | yes | conditional | yes | conditional |
| Assistive intended-use wording, medical-purpose boundary, or capability-family change | yes | yes | yes | yes | yes | yes |
| Assistive visible summary, insertion, endpoint suggestion, or workflow-effect change | yes | yes | conditional | yes | yes | conditional |
| Assistive model, prompt, supplier, or subprocessor change | conditional | conditional | yes | yes | yes | conditional |
| Assistive rollout rung, cohort exposure, or slice-contract change | conditional | conditional | conditional | conditional | yes | conditional |
| Partner redirect, scope, sandbox, or approved-portal configuration change | conditional | conditional | conditional | conditional | yes | yes |
| NHS App manifest, route exposure, Sandpit/AOS profile, or SCAL-related channel change | conditional | conditional | conditional | conditional | yes | yes |
| Standards refresh, watchlist finding, or dependency/documentation baseline change | conditional | conditional | conditional | yes | yes | conditional |
| Incident learning or near-miss-driven control update | conditional | conditional | conditional | conditional | conditional | no |

## Signoff roles

| Role | Domain | Independence group | Notes |
| --- | --- | --- | --- |
| Service Owner | service_accountability | governance | Owns service consequence and phase signoff burden. |
| Manufacturer Clinical Safety Officer | clinical_safety | clinical_safety_manufacturer | Independent safety approval for manufacturer-side changes. |
| Deployment and Use Clinical Safety Lead | clinical_safety | clinical_safety_deployment | Independent deployment/use safety approval for live rollout changes. |
| Data Protection Officer | privacy | privacy | Approves DPIA and privacy-impactful changes. |
| Security Lead | technical_security | security | Approves trust-zone, secrets, and supplier-security posture. |
| Interoperability Lead | interop | interoperability | Approves adapter and proof-chain conformance. |
| Accessibility and Content Lead | experience_assurance | experience | Approves route-level accessibility and content evidence. |
| Records Governance Lead | records | records | Approves retention and disposition controls. |
| Incident Manager | incident | incident | Owns incident and near-miss workflow decisions. |
| Partner Onboarding Lead | partner | partner | Owns partner-specific onboarding evidence and RFC routing. |
| AI Governance Lead | assistive | assistive | Owns intended-use freeze, assistive rollout, and model-governance review. |
| Release Manager | release | release | Final release approver after independent domain approvals complete. |

## Signoff topology

| From | To | Applies to | Independence rule | Artifacts |
| --- | --- | --- | --- | --- |
| ROLE_MANUFACTURER_CSO | ROLE_RELEASE_MANAGER | WS_CLINICAL_MANUFACTURER, WS_RELEASE_RUNTIME_PUBLICATION_PARITY | The release approver must not treat engineering authorship as a substitute for independent safety signoff. | SafetyCase delta packet, HazardLog delta packet |
| ROLE_DEPLOYMENT_CSO | ROLE_RELEASE_MANAGER | WS_CLINICAL_DEPLOYMENT_USE, WS_OPERATIONAL_RESILIENCE_RESTORE | Deployment/use safety approval must be distinct from runtime implementation ownership. | Deployment safety and go-live pack, Recovery evidence and readiness pack |
| ROLE_DPO | ROLE_RELEASE_MANAGER | WS_DATA_PROTECTION_PRIVACY, WS_RECORDS_RETENTION_GOVERNANCE | Privacy approval cannot be implied by security or product signoff alone. | DPIA packet, Retention schedule |
| ROLE_SECURITY_LEAD | ROLE_RELEASE_MANAGER | WS_TECHNICAL_SECURITY_ASSURANCE, WS_RELEASE_RUNTIME_PUBLICATION_PARITY | Security review must remain independent of the team authoring the runtime or dependency change. | Threat model delta, RuntimeTopologyManifest, Standards and dependency watchlist snapshot |
| ROLE_INTEROPERABILITY_LEAD | ROLE_RELEASE_MANAGER | WS_INTEROPERABILITY_EVIDENCE | Adapter owners cannot self-approve changed proof semantics without interoperability review. | Interop conformance packet |
| ROLE_ACCESSIBILITY_CONTENT_LEAD | ROLE_RELEASE_MANAGER | WS_ACCESSIBILITY_CONTENT_SERVICE_STANDARD, WS_NHS_APP_SCAL_CHANNEL | Accessibility/content evidence cannot be collapsed into visual QA or product intent alone. | Accessibility audit pack, Content QA pack, SCAL bundle and NHS App channel evidence pack |
| ROLE_PARTNER_ONBOARDING_LEAD | ROLE_RELEASE_MANAGER | WS_PARTNER_ONBOARDING_EVIDENCE, WS_NHS_APP_SCAL_CHANNEL | Partner-pack completeness must be checked by the owner of the onboarding lane, not inferred from deployment readiness alone. | NHS login partner onboarding pack, IM1 pairing and material-change RFC bundle, SCAL bundle and NHS App channel evidence pack |
| ROLE_AI_GOVERNANCE_LEAD | ROLE_RELEASE_MANAGER | WS_ASSISTIVE_AI_GOVERNANCE | Assistive rollout cannot self-approve intended-use changes, visible workflow effects, or supplier drift. | Assistive release candidate and regulatory routing pack, Assistive intended-use and boundary baseline |
| ROLE_SERVICE_OWNER | ROLE_RELEASE_MANAGER | WS_CLINICAL_MANUFACTURER, WS_DATA_PROTECTION_PRIVACY, WS_OPERATIONAL_RESILIENCE_RESTORE, WS_RELEASE_RUNTIME_PUBLICATION_PARITY | Service accountability is required, but it does not replace independent domain approvals. | Monthly assurance pack, Release publication parity record |
