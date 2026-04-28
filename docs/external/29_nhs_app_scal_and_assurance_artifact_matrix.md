# 29 NHS App SCAL And Assurance Artifact Matrix

        This matrix keeps the assurance bundle explicit before any live provider work begins.

        | Artifact ID | Artifact | Family | Required stages | Mock now | Actual later | Notes |
        | --- | --- | --- | --- | --- | --- | --- |
        | art_eoi_dossier | Expression of interest dossier | eligibility | nhs_app_stage_eoi_eligibility;nhs_app_stage_product_review | generated | placeholder | Mock dossier exists now; real portal submission remains blocked. |
| art_eligibility_evidence_pack | Eligibility evidence pack | eligibility | nhs_app_stage_eoi_eligibility;nhs_app_stage_product_review | generated | partial | Captures commissioning, framework, and patient-facing eligibility evidence. |
| art_nhs_login_dependency_summary | NHS login dependency summary | identity_dependency | nhs_app_stage_eoi_eligibility;nhs_app_stage_solution_design | generated | review_required | Links NHS App onboarding to seq_024 and seq_025 rather than duplicating identity logic. |
| art_route_manifest | NHS App route manifest and jump-off inventory | solution_design | nhs_app_stage_solution_design;nhs_app_stage_sandpit_delivery;nhs_app_stage_aos_delivery | generated | review_required | Manifest must stay pinned to release tuple and environment values. |
| art_solution_design | Solution design document | solution_design | nhs_app_stage_solution_design | generated | review_required | The NHS App technical team expects a solution design document in step 3. |
| art_embedded_preview_board | Embedded preview board | design_readiness | nhs_app_stage_solution_design;nhs_app_stage_sandpit_delivery | generated | generated | Proves hidden header, embedded-safe navigation, and route parity before real environments exist. |
| art_demo_environment_brief | Demo environment brief | demo_readiness | nhs_app_stage_product_review;nhs_app_stage_sandpit_delivery | generated | review_required | The NHS App team reviews the product assessment on the demo environment. |
| art_research_pack | Recent user research pack | design_readiness | nhs_app_stage_product_review | placeholder | review_required | Explicit placeholder keeps the gap visible. |
| art_accessibility_audit | WCAG 2.2 accessibility audit | assurance | nhs_app_stage_product_review;nhs_app_stage_scal_assurance;nhs_app_stage_full_release | planned | review_required | Required by standards page and reviewed during step 4 evidence submission. |
| art_service_support_pack | NHS Service Support Guidance pack | operational_readiness | nhs_app_stage_solution_design;nhs_app_stage_scal_assurance;nhs_app_stage_limited_release | planned | review_required | Service Management schedules the support guidance walkthrough in step 3. |
| art_implementation_approach | Implementation approach document | release_readiness | nhs_app_stage_solution_design;nhs_app_stage_limited_release | generated | review_required | Must include limited versus full release rationale. |
| art_clinical_safety_bundle | Clinical safety bundle (DCB0129/DCB0160) | assurance | nhs_app_stage_scal_assurance;nhs_app_stage_connection_agreement | planned | review_required | Uploaded through SCAL and reviewed before go-live. |
| art_privacy_and_service_standard | Privacy and NHS service standard bundle | assurance | nhs_app_stage_scal_assurance;nhs_app_stage_connection_agreement | planned | review_required | Includes GDPR, PECR, and service-standard evidence. |
| art_scal_workspace | SCAL workspace and upload map | assurance | nhs_app_stage_scal_assurance | generated | review_required | Maps each evidence family to its SCAL position. |
| art_incident_rehearsal_pack | Incident rehearsal pack | operational_readiness | nhs_app_stage_sandpit_delivery;nhs_app_stage_aos_delivery;nhs_app_stage_limited_release | planned | review_required | Step 4 requires an incident rehearsal with the service management team. |
| art_connection_agreement | Connection agreement readiness pack | release_readiness | nhs_app_stage_connection_agreement | placeholder | blocked | Contract signature remains a human-only later gate. |
| art_design_capacity_plan | Dedicated design resource plan | delivery_capacity | nhs_app_stage_product_review;nhs_app_stage_solution_design | planned | review_required | Explicit requirement in the EOI read-and-commit step. |
| art_delivery_capacity_plan | Dedicated development resource plan | delivery_capacity | nhs_app_stage_product_review;nhs_app_stage_solution_design | planned | review_required | Explicit requirement in the EOI read-and-commit step. |
| art_scope_boundary_guard | Deferred scope boundary guard | scope_control | nhs_app_stage_eoi_eligibility;nhs_app_stage_full_release | generated | pass | Prevents NHS App work from becoming a hidden current-baseline gate. |

        ## Assurance discipline

        - Accessibility, clinical safety, privacy, and service-standard evidence are first-class deliverables.
        - SCAL is the upload and review envelope, not the source of truth for the underlying evidence.
        - Connection agreement, incident rehearsal, and release rollout remain later human-controlled steps.
