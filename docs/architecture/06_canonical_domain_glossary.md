# 06 Canonical Domain Glossary

The machine-readable glossary is authoritative in `data/analysis/canonical_domain_glossary.csv`. This document summarizes the semantic atlas that later architecture and code-generation work should consume.

## Summary

| Measure | Count |
| --- | --- |
| Catalogued objects | 950 |
| Glossary rows | 1092 |
| Alias rows | 90 |
| Glossary-only control concepts | 52 |
| Gap objects | 0 |

## High-Risk Alias Resolutions

| Alias | Resolution class | Preferred term / object | Related objects |
| --- | --- | --- | --- |
| SubmissionEnvelope.state owns draft and pre-promotion lifecycle | ambiguous_phrase_requiring_context | SubmissionEnvelope.state owns draft and pre-promotion lifecycle | SubmissionEnvelope |
| draft request | ambiguous_phrase_requiring_context | SubmissionEnvelope.state owns draft and pre-promotion lifecycle | SubmissionEnvelope |
| request draft state | ambiguous_phrase_requiring_context | SubmissionEnvelope.state owns draft and pre-promotion lifecycle | SubmissionEnvelope |
| Request(workflowState = draft) | deprecated_shorthand | SubmissionEnvelope.state owns draft and pre-promotion lifecycle | SubmissionEnvelope |
| Request.workflowState is milestone-only | ambiguous_phrase_requiring_context | Request.workflowState is milestone-only | Request |
| workflow status | ambiguous_phrase_requiring_context | Request.workflowState is milestone-only | Request |
| reconciliation_required | ambiguous_phrase_requiring_context | Request.workflowState is milestone-only | Request |
| identity_hold | ambiguous_phrase_requiring_context | Request.workflowState is milestone-only | Request |
| reconciliation_required | deprecated_shorthand | Request.workflowState is milestone-only | Request |
| identity_hold | deprecated_shorthand | Request.workflowState is milestone-only | Request |
| Request.safetyState is a persisted orthogonal axis | ambiguous_phrase_requiring_context | Request.safetyState is a persisted orthogonal axis | SafetyDecisionRecord |
| urgent or not urgent | ambiguous_phrase_requiring_context | Request.safetyState is a persisted orthogonal axis | SafetyDecisionRecord |
| binary urgent state | ambiguous_phrase_requiring_context | Request.safetyState is a persisted orthogonal axis | SafetyDecisionRecord |
| identityState plus nullable patientRef derived from IdentityBinding | ambiguous_phrase_requiring_context | identityState plus nullable patientRef derived from IdentityBinding | IdentityBinding |
| ownershipState | ambiguous_phrase_requiring_context | identityState plus nullable patientRef derived from IdentityBinding | IdentityBinding |
| ownershipState | deprecated_shorthand | identityState plus nullable patientRef derived from IdentityBinding | IdentityBinding |
| blockers remain orthogonal to workflow milestones | ambiguous_phrase_requiring_context | blockers remain orthogonal to workflow milestones | RequestClosureRecord |
| workflow holds | ambiguous_phrase_requiring_context | blockers remain orthogonal to workflow milestones | RequestClosureRecord |
| reconciliation workflow state | ambiguous_phrase_requiring_context | blockers remain orthogonal to workflow milestones | RequestClosureRecord |
| identity_hold | deprecated_shorthand | blockers remain orthogonal to workflow milestones | RequestClosureRecord |
| reconciliation_required | deprecated_shorthand | blockers remain orthogonal to workflow milestones | RequestClosureRecord |
| SubmissionEnvelope, Request, RequestLineage, and child cases have separate ownership | ambiguous_phrase_requiring_context | SubmissionEnvelope, Request, RequestLineage, and child cases have separate ownership | SubmissionEnvelope |
| single request shell | ambiguous_phrase_requiring_context | SubmissionEnvelope, Request, RequestLineage, and child cases have separate ownership | SubmissionEnvelope |
| same request lineage shell | ambiguous_phrase_requiring_context | SubmissionEnvelope, Request, RequestLineage, and child cases have separate ownership | SubmissionEnvelope |

## Control Concepts

| Term | Entry type | Definition | Notes |
| --- | --- | --- | --- |
| assistive_adjunct | audience_tier | Assistive use is an adjunct posture inside the owning task unless the corpus explicitly calls for standalone evaluation or replay tooling. | Coverage basis: AssistiveSurfaceBinding bound to the owning shell and current audience coverage |
| governance_review | audience_tier | Governance/admin/config/comms/access work is a distinct control surface, not an operations subpanel. | Coverage basis: StaffAudienceCoverageProjection(purposeOfUse = governance_review) plus GovernanceScopeToken |
| hub_desk | audience_tier | Coordination-safe cross-site visibility for ranked offers, travel constraints, and practice-ack debt, without full clinical narrative. | Catalogued as an audience tier concept, not a domain aggregate. |
| operations_control | audience_tier | Operations is a control-room specialization that must not borrow ordinary practice, hub, or support payloads. | Coverage basis: purpose-of-use-specific control-plane rows for operations surfaces |
| origin_practice | audience_tier | Practice-owned operational and clinically necessary detail for the current organisation only. | Catalogued as an audience tier concept, not a domain aggregate. |
| origin_practice_clinical | audience_tier | Separates clinician/designated reviewer work from generic practice ops while preserving the same base visibility tier. | Coverage basis: origin_practice + StaffAudienceCoverageProjection(purposeOfUse = operational_execution) |
| origin_practice_operations | audience_tier | Keeps practice-operational actors distinct from clinical reviewers inside the shared workspace shell. | Coverage basis: origin_practice + StaffAudienceCoverageProjection(purposeOfUse = operational_execution) |
| patient_authenticated | audience_tier | Signed-in patient routes with richer request, booking, message, record, pharmacy, and document visibility after live checks pass. | Catalogued as an audience tier concept, not a domain aggregate. |
| patient_embedded_authenticated | audience_tier | Embedded patient use is a channel-constrained authenticated posture, not a second shell family. | Coverage basis: patient_authenticated + PatientAudienceCoverageProjection(purposeOfUse = embedded_authenticated) |
| patient_grant_scoped | audience_tier | The corpus distinguishes grant-scoped recovery posture without minting a separate Phase 0 base tier. | Coverage basis: patient_public + PatientAudienceCoverageProjection(purposeOfUse = secure_link_recovery) |
| patient_public | audience_tier | Public-safe patient status, secure-link entry before proof, and governed recovery only. | Catalogued as an audience tier concept, not a domain aggregate. |
| servicing_site | audience_tier | Service-delivery detail required to fulfil the booked or referred service for the site in scope. | Catalogued as an audience tier concept, not a domain aggregate. |
| support | audience_tier | Masked summary, chronology, and consequence-preview detail, with stronger gates for identity or access-affecting work. | Catalogued as an audience tier concept, not a domain aggregate. |
| Browser web | channel | This is the baseline shell posture for most surfaces. | Catalogued as a channel concept, not a domain aggregate. |
| Constrained browser posture | channel | The shell stays the same shell; only the channel profile changes. | Catalogued as a channel concept, not a domain aggregate. |
| Embedded webview / NHS App-style embedded channel | channel | Channel posture changes without changing shell ownership. | Catalogued as a channel concept, not a domain aggregate. |
| External delivery channels for callback and telephony outcomes | channel | Delivery evidence affects continuity and repair posture but does not redefine shell ownership. | Catalogued as a channel concept, not a domain aggregate. |
| External delivery channels for notifications and reminders | channel | Continuity-sensitive calmness must still come from authoritative settlement and evidence, not transport acceptance alone. | Catalogued as a channel concept, not a domain aggregate. |
| SMS continuation / secure-link continuation | channel | Preserves one specific lineage anchor rather than opening a generic portal shell from scratch. | Catalogued as a channel concept, not a domain aggregate. |
| Support-assisted capture | channel | This is still one governed intake lineage, not a separate support-only request system. | Catalogued as a channel concept, not a domain aggregate. |
| Telephony / IVR | channel | Telephony is an ingress channel, not a shell family. | Catalogued as a channel concept, not a domain aggregate. |
| browser | channel_profile | Channel profile `browser` as normalized by the audience-surface inventory. | Catalogued as a channel profile concept, not a domain aggregate. |
| constrained_browser | channel_profile | Channel profile `constrained_browser` as normalized by the audience-surface inventory. | Catalogued as a channel profile concept, not a domain aggregate. |
| embedded | channel_profile | Channel profile `embedded` as normalized by the audience-surface inventory. | Catalogued as a channel profile concept, not a domain aggregate. |
| /hub/case/:hubCoordinationCaseId, /hub/alternatives/:offerSessionId, /hub/exceptions, /hub/audit/:hubCoordinationCaseId | route_family | Hub case, alternatives, exception, and audit work | Catalogued as a route-family contract concept, not a domain aggregate. |
| /hub/queue | route_family | Hub queue | Catalogued as a route-family contract concept, not a domain aggregate. |
| /ops/:opsLens/investigations/:opsRouteIntentId, /interventions/:opsRouteIntentId, /compare/:opsRouteIntentId, /health/:opsRouteIntentId | route_family | Operations investigation and intervention drill-down | Catalogued as a route-family contract concept, not a domain aggregate. |
| /ops/governance/*, /ops/access/*, /ops/config/*, /ops/comms/*, /ops/release/* | route_family | Governance and Admin shell | Catalogued as a route-family contract concept, not a domain aggregate. |
| /ops/overview, /ops/queues, /ops/capacity, /ops/dependencies, /ops/audit, /ops/assurance, /ops/incidents, /ops/resilience | route_family | Operations board | Catalogued as a route-family contract concept, not a domain aggregate. |
| /ops/support, /ops/support/inbox/:viewKey, /ops/support/tickets/:supportTicketId, /conversation, /history, /knowledge, /actions/:actionKey, /handoff/:supportOwnershipTransferId | route_family | Support ticket workspace | Catalogued as a route-family contract concept, not a domain aggregate. |
| /ops/support/replay/:supportReplaySessionId and /ops/support/tickets/:supportTicketId/observe/:supportObserveSessionId | route_family | Support replay and observe | Catalogued as a route-family contract concept, not a domain aggregate. |
| /workspace, /workspace/queue/:queueKey, /workspace/task/:taskId | route_family | Clinical Workspace queue and task canvas | Catalogued as a route-family contract concept, not a domain aggregate. |
| /workspace/pharmacy, /workspace/pharmacy/:pharmacyCaseId, /validate, /inventory, /resolve, /handoff, /assurance | route_family | Pharmacy Console | Catalogued as a route-family contract concept, not a domain aggregate. |
| /workspace/task/:taskId/more-info, /workspace/task/:taskId/decision, /workspace/approvals, /workspace/escalations, /workspace/changed, /workspace/search | route_family | Clinical Workspace child review states | Catalogued as a route-family contract concept, not a domain aggregate. |
| Appointments | route_family | Appointments and manage | Catalogued as a route-family contract concept, not a domain aggregate. |
| Assistive evaluation, replay, monitoring, and release-control surfaces (derived) | route_family | Standalone assistive control shell | Catalogued as a route-family contract concept, not a domain aggregate. |
| Health record | route_family | Patient health record and documents | Catalogued as a route-family contract concept, not a domain aggregate. |
| Home | route_family | Patient home and spotlight | Catalogued as a route-family contract concept, not a domain aggregate. |
| Intake / self-service form (derived) | route_family | Patient intake entry | Catalogued as a route-family contract concept, not a domain aggregate. |
| Intake / telephony capture (derived) | route_family | Telephony / IVR intake capture | Catalogued as a route-family contract concept, not a domain aggregate. |
