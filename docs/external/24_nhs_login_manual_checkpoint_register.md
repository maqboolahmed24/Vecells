# 24 NHS Login Manual Checkpoint Register

        This register names the product demonstration, assurance, legal, and service-desk steps that must not be silently automated end-to-end.

        ## Section A — `Mock_now_execution`

        Each checkpoint is simulated inside the mock as an explicit unresolved review item so the team can rehearse rejection reasons and see where progression halts.

        ## Section B — `Actual_provider_strategy_later`

        Each checkpoint remains a human-owned gate even when dry-run browser automation is available.

        | Checkpoint | Stage | Label | Automation posture | Roles | Rejection reasons |
        | --- | --- | --- | --- | --- | --- |
        | `chk_internal_eligibility_review` | `product_fit_review` | Internal eligibility review | manual_review_required | ROLE_IDENTITY_PARTNER_MANAGER; ROLE_PROGRAMME_ARCHITECT | Service is not commissioned or sponsored. / Route logic suggests NHS login is being treated as authorization. / Commissioner or sponsor posture is still unknown. |
| `chk_preparation_call_ready` | `demo_prep` | Preparation call readiness | manual_review_required | ROLE_IDENTITY_PARTNER_MANAGER; ROLE_PROGRAMME_ARCHITECT | Architecture or data-flow artefacts are stale. / User journeys do not include consent-denied or repeat sign-in flows. / Demo attendees do not cover technical, privacy, and clinical safety responsibilities. |
| `chk_product_demo_outcome` | `integration_request_blocked_until_demo` | Product demonstration outcome | manual_review_required | ROLE_IDENTITY_PARTNER_MANAGER; ROLE_PROGRAMME_ARCHITECT; ROLE_SECURITY_LEAD | Product demo has not happened yet. / Vector of Trust or scopes remain unresolved. / Commercial, legal, or AI questions remain open. |
| `chk_security_privacy_review` | `assurance_bundle_in_progress` | Security and privacy review | manual_review_required | ROLE_SECURITY_LEAD; ROLE_DPO | Privacy notice is missing or not NHS login compliant. / Evidence pack is stale or not scoped to the NHS login feature. / Data-transfer and hosting posture are unclear. |
| `chk_clinical_safety_review` | `assurance_bundle_in_progress` | Clinical safety review | manual_review_required | ROLE_MANUFACTURER_CSO | Clinical safety case is missing. / Hazard log is missing or unsigned. / Medical device assessment is not current. |
| `chk_special_terms_review` | `connection_agreement_pending` | Connection agreement and special terms review | manual_review_required | ROLE_GOVERNANCE_LEAD; ROLE_SECURITY_LEAD | Signatory is not confirmed. / Commissioner ownership model remains unclear. / Special terms or GDPR relationship questions are unresolved. |
| `chk_signatory_confirmed` | `connection_agreement_pending` | Signatory confirmed | manual_review_required | ROLE_GOVERNANCE_LEAD | No legal signatory has been identified. / Commissioner ownership model is still placeholder-only. |
| `chk_service_desk_registration_review` | `service_desk_registration_pending` | Service desk registration review | manual_review_required | ROLE_OPERATIONS_LEAD; ROLE_SUPPORT_LEAD | No named incident contacts or escalation path exist. / Service Bridge handoff details are incomplete. |
| `chk_live_submit_pause` | `ready_for_real_submission` | Pause-and-confirm before final submission | explicit_pause_required | ROLE_IDENTITY_PARTNER_MANAGER; ROLE_SECURITY_LEAD; ROLE_PROGRAMME_ARCHITECT | ALLOW_REAL_PROVIDER_MUTATION is not enabled. / Named approver, target environment, or current evidence bundle is missing. / Phase 0 external-readiness gate is still withheld. |
