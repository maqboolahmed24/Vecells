# 09 Clinical Safety Workstreams

The corpus separates manufacturer-side safety, deployment/use safety, and optional assistive safety governance. Those approvals intersect, but they do not collapse into one generic approval state.

## Safety workstreams

### Manufacturer clinical safety workstream

- Scope: Baseline Required
- Why it exists: Vecells changes patient safety posture whenever rule packs, identity binding, telephony evidence, booking confirmation, pharmacy outcomes, or assistive workflow effects change. The corpus requires those deltas to update the hazard log and safety case incrementally.
- Triggering changes: CHG_SAFETY_RULE_PACK, CHG_IDENTITY_BINDING_OR_SESSION, CHG_TELEPHONY_CAPTURE_OR_CONTINUATION, CHG_BOOKING_CONFIRMATION_OR_WAITLIST, CHG_HUB_COORDINATION_OR_ACK, CHG_PHARMACY_DISPATCH_OR_OUTCOME, CHG_ASSISTIVE_INTENDED_USE_OR_BOUNDARY, CHG_ASSISTIVE_VISIBLE_WORKFLOW_EFFECT
- Required artifacts: ClinicalRiskManagementPlan baseline and delta log, HazardLog delta packet, SafetyCase delta packet, MaterialDeltaAssessment-linked re-safety evidence, ReleaseCandidate safety gate summary
- Independent review path: Independent manufacturer Clinical Safety Officer signoff, Clinical safety engineering review, Release approval evidence bundle linkage
- Blocking conditions: Missing hazard-log or safety-case delta for a material clinical change, Unresolved safety preemption or urgent-diversion drift, Safety signoff attached to the wrong release candidate or stale evidence tuple

### Deployment and use clinical risk workstream

- Scope: Baseline Required
- Why it exists: Live rollout, local session ownership, telephony capture, embedded-channel behavior, and assistive visibility all change the deployment-side risk picture. The corpus requires a separate deployment/use safety burden rather than only manufacturer documentation.
- Triggering changes: CHG_IDENTITY_BINDING_OR_SESSION, CHG_TELEPHONY_CAPTURE_OR_CONTINUATION, CHG_RUNTIME_TOPOLOGY_OR_DEPENDENCY_ORDER, CHG_PARTNER_CONFIGURATION_OR_REDIRECTS, CHG_ASSISTIVE_ROLLOUT_OR_SLICE_EXPOSURE
- Required artifacts: DeploymentSafetyCase annex, Go-live clinical risk assessment delta, Operational safety monitoring pack, Rollback and recovery clinical impact review
- Independent review path: Deployment/use Clinical Safety Lead signoff, Release Manager readiness signoff, Service Owner deployment approval
- Blocking conditions: Live rollout changes without deployment-side safety review, Material incident learnings not reflected in deployment safety posture, Rollback or recovery posture not clinically reviewed for changed flows

### Assistive and AI governance plus change-control workstream

- Scope: Assistive Optional
- Why it exists: The corpus rejects the idea that assistive regulation is only model QA. Intended-use wording, medical-purpose boundary, visible workflow effect, supplier freshness, rollout slices, and rollback evidence all belong to one governed workstream.
- Triggering changes: CHG_ASSISTIVE_INTENDED_USE_OR_BOUNDARY, CHG_ASSISTIVE_VISIBLE_WORKFLOW_EFFECT, CHG_ASSISTIVE_VENDOR_MODEL_OR_SUBPROCESSOR, CHG_ASSISTIVE_ROLLOUT_OR_SLICE_EXPOSURE, CHG_TELEMETRY_OR_DISCLOSURE_SCHEMA
- Required artifacts: IntendedUseProfile and capability manifest set, MedicalDeviceAssessment record, AssistiveReleaseCandidate and ChangeImpactAssessment, RFCBundle and SCAL delta where required, RollbackReadinessBundle and supplier assurance snapshot
- Independent review path: AI Governance Lead signoff, Independent manufacturer Clinical Safety Officer signoff, Data Protection Officer signoff, Release Manager approval after independent approvals complete
- Blocking conditions: Visible or widened assistive capability without frozen intended use and current regulatory routing assessment, Supplier assurance freshness drift unresolved, Required RFC, SCAL delta, DTAC delta, DPIA rerun, or safety-case delta not completed for the change class

## Seed hazards

| Hazard | Change classes | Controls | Independent signoff |
| --- | --- | --- | --- |
| Wrong-patient binding or correction failure | CHG_IDENTITY_BINDING_OR_SESSION, CHG_PARTNER_CONFIGURATION_OR_REDIRECTS | HazardLog delta packet, Identity repair evidence bundle, DPIA delta packet | ROLE_MANUFACTURER_CSO, ROLE_DPO |
| Urgent diversion under-triage or over-triage | CHG_SAFETY_RULE_PACK, CHG_TELEPHONY_CAPTURE_OR_CONTINUATION | HazardLog delta packet, SafetyDecisionRecord regression, Deployment safety monitoring pack | ROLE_MANUFACTURER_CSO, ROLE_DEPLOYMENT_CSO |
| Telephony evidence inadequacy | CHG_TELEPHONY_CAPTURE_OR_CONTINUATION | DeploymentSafetyCase annex, Telephony evidence readiness gate, Operational safety monitoring pack | ROLE_MANUFACTURER_CSO, ROLE_DEPLOYMENT_CSO |
| Duplicate suppression or merge hazard | CHG_IDENTITY_BINDING_OR_SESSION, CHG_TELEPHONY_CAPTURE_OR_CONTINUATION | HazardLog delta packet, Interop conformance matrix, Policy-watch compatibility review | ROLE_MANUFACTURER_CSO |
| False booking confirmation | CHG_BOOKING_CONFIRMATION_OR_WAITLIST, CHG_HUB_COORDINATION_OR_ACK | Interop conformance matrix, HazardLog delta packet, Release publication parity record | ROLE_MANUFACTURER_CSO, ROLE_INTEROPERABILITY_LEAD |
| Pharmacy dispatch or outcome ambiguity | CHG_PHARMACY_DISPATCH_OR_OUTCOME | Interop conformance matrix, HazardLog delta packet, Recovery evidence pack | ROLE_MANUFACTURER_CSO, ROLE_INTEROPERABILITY_LEAD |
| Assistive hallucination, overreach, or silent degradation | CHG_ASSISTIVE_INTENDED_USE_OR_BOUNDARY, CHG_ASSISTIVE_VISIBLE_WORKFLOW_EFFECT, CHG_ASSISTIVE_VENDOR_MODEL_OR_SUBPROCESSOR, CHG_ASSISTIVE_ROLLOUT_OR_SLICE_EXPOSURE | Assistive release candidate and regulatory routing pack, Intended-use baseline, Supplier assurance freshness snapshot | ROLE_AI_GOVERNANCE_LEAD, ROLE_MANUFACTURER_CSO, ROLE_DPO |

## Signoff rule

Manufacturer safety approval, deployment/use approval, privacy review, and release approval are adjacent but independent. A single implementation owner cannot self-certify the whole chain.
