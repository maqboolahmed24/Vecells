# 27 PDS Feature Flag Strategy

    Phase 0 entry remains `withheld`. This pack therefore encodes PDS as optional, bounded, and reversible rather than as a hidden baseline dependency.

    ## Summary

    - access rows: 9
    - route or global flags: 10
    - current submission posture: `blocked`
    - visual mode: `Identity_Trace_Studio`

    ## Section A — `Mock_now_execution`

    The local studio and mock sandbox exercise the flag lifecycle now without claiming that PDS is required for sign-in, ownership, or request progression.

    | Flag | Route | Default | Why Optional | Rollback Triggers |
| --- | --- | --- | --- | --- |
| pds.enrichment.route.secure_link_recovery | rf_patient_secure_link_recovery | internal_only | Local matching and governed IdentityBinding remain the baseline path even when the flag is on. | wrong_patient_signal_rate_exceeds_threshold, p95_latency_breach |
| pds.patient_access.route.patient_home_contact_refresh | rf_patient_home | off | Local matching and governed IdentityBinding remain the baseline path even when the flag is on. | wrong_patient_signal_rate_exceeds_threshold, p95_latency_breach |
| pds.patient_access.route.patient_home_nominated_pharmacy | rf_patient_home | off | Local matching and governed IdentityBinding remain the baseline path even when the flag is on. | wrong_patient_signal_rate_exceeds_threshold, p95_latency_breach |
| pds.healthcare_worker.route.staff_workspace_trace | rf_staff_workspace | internal_only | Local matching and governed IdentityBinding remain the baseline path even when the flag is on. | wrong_patient_signal_rate_exceeds_threshold, p95_latency_breach |
| pds.healthcare_worker.route.support_identity_review | rf_support_ticket_workspace | internal_only | Local matching and governed IdentityBinding remain the baseline path even when the flag is on. | wrong_patient_signal_rate_exceeds_threshold, p95_latency_breach |
| pds.healthcare_worker_update.route.support_contact_correction | rf_support_ticket_workspace | off | Local matching and governed IdentityBinding remain the baseline path even when the flag is on. | wrong_patient_signal_rate_exceeds_threshold, p95_latency_breach |
| pds.healthcare_worker.route.governance_trace | rf_governance_shell | internal_only | Local matching and governed IdentityBinding remain the baseline path even when the flag is on. | wrong_patient_signal_rate_exceeds_threshold, p95_latency_breach |
| pds.healthcare_worker_update.route.governance_correction | rf_governance_shell | off | Local matching and governed IdentityBinding remain the baseline path even when the flag is on. | wrong_patient_signal_rate_exceeds_threshold, p95_latency_breach |
| pds.application_restricted.route.requests_pharmacy_compare | rf_patient_requests | off | Local matching and governed IdentityBinding remain the baseline path even when the flag is on. | wrong_patient_signal_rate_exceeds_threshold, p95_latency_breach |
| pds.global.kill_switch | all_flagged_routes | internal_only | The kill switch exists so PDS can be removed instantly without taking baseline identity or request flows down. | manual_operator_trigger, provider_outage |

    Mandatory controls:

    - every PDS route remains `off` or `internal_only` by default
    - `pds.global.kill_switch` disables all PDS calls and rendering without breaking local matching
    - PDS success never writes `Request.patientRef`; it only creates supporting evidence for `IdentityBindingAuthority`
    - contradictory, stale, throttled, and degraded responses always preserve safe fallback copy

    ## Section B — `Actual_provider_strategy_later`

    The later live strategy uses the current official PDS FHIR onboarding mechanics:

    - digital onboarding is the primary route
    - the use case and legal basis stay structured per route family
    - one connecting-systems risk log is required for each access mode used
    - hazard-log and mitigation-evidence work are first-class readiness artifacts, not later paperwork
    - worker and update-capable access remains blocked until named approval, environment target, and explicit mutation consent exist

    Official guidance captured on 2026-04-09:

    | Source | Why it matters |
| --- | --- |
| PDS FHIR API onboarding support information | The onboarding support page states that PDS FHIR uses digital onboarding, requires a hazard log upload, and requires one connecting-systems risk log per access mode used. |
| Personal Demographics Service - FHIR API | The API catalogue defines PDS FHIR as the FHIR route for accessing demographics such as name, address, date of birth, related people, registered GP, nominated pharmacy, and NHS number. |
| Access data on the Personal Demographics Service | NHS England describes the PDS FHIR API as the newest and simplest integration route, states that requests are assessed case by case, and notes the secure-network expectation for smartcard-backed use. |
| Personal Demographics Service integration guidance | The integration guidance separates search, synchronisation, patient self-service, and patient updates. It explicitly says patient updates use NHS login and patient access mode. |
| PDS FHIR API - integrated products | The integrated-products page shows currently approved products and labels across application-restricted, healthcare worker, healthcare worker with update, patient access, and healthcare worker mode without update. |
| Supplier Conformance Assessment List (SCAL) | SCAL is the document-based assurance route and the page states DOS is the primary online route. It captures technical, clinical safety, information-governance, security, and organisational risk evidence. |
| Partner onboarding operations | The operations page lists PDS FHIR as a digital-onboarding service and names the four published access-mode families for that service. |
