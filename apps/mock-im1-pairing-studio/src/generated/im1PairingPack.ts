export const im1PairingPack = {
  "task_id": "seq_026",
  "visual_mode": "Interface_Proof_Atelier",
  "mission": "Create the IM1 Pairing execution pack with two explicit parts: a rehearsal-grade IM1 pairing control tower now, and a gated prerequisites, SCAL, supplier, licence, and RFC strategy for later real provider execution.",
  "generated_at": "2026-04-09T17:58:18.704611+00:00",
  "phase0_verdict": "withheld",
  "source_precedence": [
    "prompt/026.md",
    "prompt/shared_operating_contract_026_to_035.md",
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "blueprint/blueprint-init.md",
    "blueprint/phase-0-the-foundation-protocol.md",
    "blueprint/phase-2-identity-and-echoes.md",
    "blueprint/phase-4-the-booking-engine.md",
    "blueprint/phase-5-the-network-horizon.md",
    "blueprint/phase-8-the-assistive-layer.md",
    "blueprint/platform-runtime-and-release-blueprint.md",
    "blueprint/forensic-audit-findings.md",
    "docs/external/21_integration_priority_and_execution_matrix.md",
    "docs/external/22_provider_selection_scorecards.md",
    "docs/external/23_actual_partner_account_governance.md",
    "docs/external/23_secret_ownership_and_rotation_model.md",
    "docs/external/24_nhs_login_actual_onboarding_strategy.md",
    "docs/external/25_nhs_login_environment_profile_pack.md",
    "https://digital.nhs.uk/services/digital-services-for-integrated-care/im1-pairing-integration",
    "https://digital.nhs.uk/services/digital-services-for-integrated-care/im1-pairing-integration/im1-prerequisites-form",
    "https://digital.nhs.uk/developer/assurance/scal-process-for-apis-and-services",
    "https://digital.nhs.uk/developer/api-catalogue/interface-mechanism-1-standards"
  ],
  "official_guidance": [
    {
      "source_id": "official_im1_pairing_process",
      "title": "IM1 Pairing integration",
      "url": "https://digital.nhs.uk/services/digital-services-for-integrated-care/im1-pairing-integration",
      "captured_on": "2026-04-09",
      "summary": "Defines the IM1 initiation, unsupported test, supported test, assurance, live, and RFC process. It also names the current provider suppliers as Optum (EMISWeb) and TPP (SystmOne).",
      "grounding": [
        "Suppliers complete the IM1 Clinical and Information Governance prerequisites form first.",
        "Stage one SCAL is issued when prerequisites are confirmed and compatibility is assessed.",
        "Model Interface Licence execution precedes access to provider supplier mock APIs.",
        "Supported Test Environment access requires a fully completed SCAL.",
        "Recommended to Connect, Plan to Connect, and live rollout follow assurance acceptance.",
        "RFC is required where the product evolves from its originally assured IM1 use case, especially with AI or other significant enhancements."
      ]
    },
    {
      "source_id": "official_im1_prerequisites_form",
      "title": "IM1 prerequisites form",
      "url": "https://digital.nhs.uk/services/digital-services-for-integrated-care/im1-pairing-integration/im1-prerequisites-form",
      "captured_on": "2026-04-09",
      "summary": "Publishes the exact public prerequisite form structure covering supplier identity, clinical safety declarations, information-governance commitments, and provider supplier selection.",
      "grounding": [
        "All fields are mandatory.",
        "Clinical safety prerequisites must already be in place at the time of initial SCAL submission and reflected in the SCAL.",
        "Information governance prerequisites are commitments that must be in place by go live.",
        "The public provider supplier options are EMIS (EMIS Web) and TPP (SystmOne)."
      ]
    },
    {
      "source_id": "official_scal_process",
      "title": "Supplier Conformance Assessment List (SCAL)",
      "url": "https://digital.nhs.uk/developer/assurance/scal-process-for-apis-and-services",
      "captured_on": "2026-04-09",
      "summary": "SCAL is a document-based assurance process for NHS services. Each SCAL has supplier and product information plus one or more service-specific tabs.",
      "grounding": [
        "SCAL captures declarations and evidence across technical conformance, clinical safety, information governance and security, and organisational and business process risks.",
        "You complete one SCAL for each individual product.",
        "The supplier and product information tab exists even when multiple services are involved."
      ]
    },
    {
      "source_id": "official_im1_api_standards",
      "title": "Interface Mechanism 1 API standards",
      "url": "https://digital.nhs.uk/developer/api-catalogue/interface-mechanism-1-standards",
      "captured_on": "2026-04-09",
      "summary": "Explains that IM1 pairing is supplier specific, technical specifications become available after feasibility assessment, and some appointments data may only be available via GP Connect per supplier PIP.",
      "grounding": [
        "Consumers pair with the specific API for each GP practice system supplier.",
        "Technical specifications and PIPs are available after supplier feasibility assessment.",
        "Appointments access may vary by supplier and can require supplier PIPs rather than generic assumptions."
      ]
    }
  ],
  "assumptions": [
    {
      "assumption_id": "ASSUMPTION_IM1_STAGE_ONE_SCAL_FIELDS",
      "summary": "The public IM1 pages do not enumerate every stage-one SCAL column, so the derived SCAL input fields below model the minimum product, capability, evidence, and safety inputs Vecells must already have ready before submission.",
      "consequence": "The pack distinguishes exact public prerequisites-form fields from derived stage-one SCAL dossier fields."
    },
    {
      "assumption_id": "ASSUMPTION_IM1_LICENCE_SIGNATORIES_PLACEHOLDER_ONLY",
      "summary": "Provider-supplier legal names, consumer legal names, and named signatories are not yet approved for repo storage. The licence register therefore carries role-owned placeholder slots only.",
      "consequence": "The rehearsal studio tracks licence readiness without storing secrets or real legal details."
    },
    {
      "assumption_id": "ASSUMPTION_IM1_REAL_SUBMISSION_REMAINS_BLOCKED",
      "summary": "Phase 0 remains withheld and the current-baseline external-readiness chain is not yet cleared. Real IM1 submission therefore stays fail-closed in this pack.",
      "consequence": "Actual-provider mode shows blocker truth and dry-run preparation only."
    }
  ],
  "summary": {
    "stage_count": 21,
    "rehearsal_stage_count": 9,
    "exact_public_field_count": 16,
    "field_count": 25,
    "artifact_count": 15,
    "provider_supplier_count": 2,
    "route_family_matrix_count": 12,
    "live_gate_count": 10,
    "blocked_live_gate_count": 7,
    "rfc_watch_count": 7,
    "phase0_entry_verdict": "withheld"
  },
  "routes": [
    {
      "route_family_id": "rf_intake_self_service",
      "route_family": "Intake / self-service form (derived)",
      "shell_type": "patient",
      "ownership_mode": "shell_root",
      "primary_surface_name": "Patient intake entry",
      "audience_tiers": "patient_public",
      "primary_personas": "Patient - Anonymous intake starter",
      "channel_profiles": "browser",
      "ingress_channels": "Browser web",
      "owning_blueprints": "blueprint-init.md; phase-0-the-foundation-protocol.md",
      "governing_objects": "SubmissionEnvelope; IntakeConvergenceContract; SubmissionIngressRecord; SubmissionPromotionRecord",
      "control_plane_rules": "AudienceVisibilityCoverage(patient_public); VisibilityProjectionPolicy; FallbackReviewCase; Artifact quarantine rules",
      "identity_posture": "Anonymous or partially identified patient until claim or sign-in uplift occurs.",
      "visibility_policy_posture": "Public-safe summary and governed recovery only before authenticated or grant-scoped expansion.",
      "allowed_mutations": "Capture and update SubmissionEnvelope content.; Submit for governed promotion.",
      "continuity_expectations": "The same envelope lineage survives channel switches and later same-shell recovery.",
      "degraded_recovery_states": "Fallback review, artifact quarantine, or degraded receipt without shell replacement.",
      "external_dependency_touchpoints": "Binary artifact store; Optional NHS login uplift",
      "scope_posture": "baseline",
      "explicit_route_contract": "derived",
      "notes": "The corpus names the intake lineage and controls, but not a final URL contract, so this route family label is derived for inventory purposes.",
      "source_refs": "blueprint-init.md#2. Core product surfaces; phase-0-the-foundation-protocol.md#12.1 Mandatory audience tiers"
    },
    {
      "route_family_id": "rf_patient_secure_link_recovery",
      "route_family": "Secure-link recovery and claim resume (derived)",
      "shell_type": "patient",
      "ownership_mode": "same_shell_child",
      "primary_surface_name": "Secure-link recovery and claim resume",
      "audience_tiers": "patient_grant_scoped",
      "primary_personas": "Patient - Grant-scoped patient resuming a specific lineage",
      "channel_profiles": "constrained_browser",
      "ingress_channels": "SMS continuation / secure-link continuation",
      "owning_blueprints": "patient-account-and-communications-blueprint.md; phase-0-the-foundation-protocol.md",
      "governing_objects": "AccessGrantRedemptionRecord; PatientSecureLinkSessionProjection; PatientActionRecoveryProjection; PatientDegradedModeProjection; RouteIntentBinding",
      "control_plane_rules": "AudienceVisibilityCoverage(patient_public / secure_link_recovery); VisibilityProjectionPolicy; RouteFreezeDisposition; ReleaseRecoveryDisposition",
      "identity_posture": "Grant-scoped patient continuation before or alongside authenticated uplift.",
      "visibility_policy_posture": "Summary-only or suppressed-recovery-only posture until route intent, grant, and publication checks pass.",
      "allowed_mutations": "Redeem minimal grant, claim, re-auth, and resume the specific lineage action.",
      "continuity_expectations": "Preserve the same request or child-route anchor through secure-link redemption and step-up.",
      "degraded_recovery_states": "Expired-link recovery, identity hold, or safe-browser handoff without losing the active anchor.",
      "external_dependency_touchpoints": "SMS secure-link delivery; NHS login step-up",
      "scope_posture": "baseline",
      "explicit_route_contract": "derived",
      "notes": "Derived label used until later endpoint mapping publishes concrete URLs.",
      "source_refs": "patient-account-and-communications-blueprint.md#Patient audience coverage contract; phase-0-the-foundation-protocol.md#5.4 Claim, secure-link, and embedded access algorithm"
    },
    {
      "route_family_id": "rf_patient_home",
      "route_family": "Home",
      "shell_type": "patient",
      "ownership_mode": "shell_root",
      "primary_surface_name": "Patient home and spotlight",
      "audience_tiers": "patient_authenticated",
      "primary_personas": "Patient - Authenticated portal user",
      "channel_profiles": "browser",
      "ingress_channels": "Browser web",
      "owning_blueprints": "patient-portal-experience-architecture-blueprint.md; patient-account-and-communications-blueprint.md",
      "governing_objects": "PatientPortalEntryProjection; PatientHomeProjection; PatientSpotlightDecisionProjection; PatientPortalNavigationLedger; PatientExperienceContinuityEvidenceProjection",
      "control_plane_rules": "PatientDegradedModeProjection; PatientAttentionCuePolicy; PatientTrustCueContract; VisibilityProjectionPolicy",
      "identity_posture": "Signed-in patient self-service context.",
      "visibility_policy_posture": "Authenticated patient summary, spotlight, and section-level entry posture only after current visibility and continuity checks pass.",
      "allowed_mutations": "No direct consequence-bearing mutation; launches the next safe child action in the current shell.",
      "continuity_expectations": "Home spotlight, nav return, and selected anchor must stay stable through refresh and adjacent child work.",
      "degraded_recovery_states": "Read-only, placeholder, bounded recovery, or identity-hold posture inside the same shell.",
      "external_dependency_touchpoints": "NHS login; Notification delivery rails",
      "scope_posture": "baseline",
      "explicit_route_contract": "yes",
      "notes": "",
      "source_refs": "patient-portal-experience-architecture-blueprint.md#Portal entry and shell topology; patient-account-and-communications-blueprint.md#Patient home contract"
    },
    {
      "route_family_id": "rf_patient_requests",
      "route_family": "Requests",
      "shell_type": "patient",
      "ownership_mode": "same_shell_peer",
      "primary_surface_name": "Request list and detail",
      "audience_tiers": "patient_authenticated",
      "primary_personas": "Patient - Authenticated portal user",
      "channel_profiles": "browser",
      "ingress_channels": "Browser web",
      "owning_blueprints": "patient-account-and-communications-blueprint.md; patient-portal-experience-architecture-blueprint.md",
      "governing_objects": "PatientRequestsIndexProjection; PatientRequestLineageProjection; PatientRequestDetailProjection; PatientExperienceContinuityEvidenceProjection; RouteIntentBinding; CommandActionRecord; CommandSettlementRecord",
      "control_plane_rules": "VisibilityProjectionPolicy; PatientStatusPresentationContract; PatientNavReturnContract",
      "identity_posture": "Authenticated or grant-scoped patient request work depending on the route and proof posture.",
      "visibility_policy_posture": "Request summary, child-lineage chips, and downstream placeholders remain visibility-governed and continuity-bound.",
      "allowed_mutations": "Route-bound request follow-up such as more-info reply, recovery, and child-work entry.",
      "continuity_expectations": "Request list rows, detail, and child anchors must stay on the same request shell when continuity is unchanged.",
      "degraded_recovery_states": "Recovery-required, placeholder-only, or stale-row downgrade instead of detached request pages.",
      "external_dependency_touchpoints": "Messaging, callback, booking, hub, and pharmacy child projections",
      "scope_posture": "baseline",
      "explicit_route_contract": "yes",
      "notes": "",
      "source_refs": "patient-account-and-communications-blueprint.md#Requests browsing contract; patient-account-and-communications-blueprint.md#Request detail contract"
    },
    {
      "route_family_id": "rf_patient_appointments",
      "route_family": "Appointments",
      "shell_type": "patient",
      "ownership_mode": "same_shell_peer",
      "primary_surface_name": "Appointments and manage",
      "audience_tiers": "patient_authenticated",
      "primary_personas": "Patient - Authenticated portal user",
      "channel_profiles": "browser",
      "ingress_channels": "Browser web",
      "owning_blueprints": "patient-account-and-communications-blueprint.md; phase-4-the-booking-engine.md",
      "governing_objects": "PatientAppointmentWorkspaceProjection; PatientAppointmentManageProjection; PatientManageCapabilitiesProjection; ExternalConfirmationGate; PatientExperienceContinuityEvidenceProjection; RouteIntentBinding; CommandActionRecord; CommandSettlementRecord",
      "control_plane_rules": "VisibilityProjectionPolicy; BookingContinuityEvidenceProjection; ReservationAuthority",
      "identity_posture": "Authenticated or grant-scoped patient manage posture under current booking truth.",
      "visibility_policy_posture": "Patient may see confirmed, pending-confirmation, waitlist, callback fallback, or recovery posture without false reassurance.",
      "allowed_mutations": "Manage appointment, accept waitlist or hub alternative, respond to callback fallback, and continue booking-safe actions.",
      "continuity_expectations": "Booking and manage work remains inside the same request shell and preserves the selected option anchor.",
      "degraded_recovery_states": "Pending confirmation, waitlist fallback, read-only, or bounded recovery instead of detached success pages.",
      "external_dependency_touchpoints": "Booking provider adapters; External confirmation gates",
      "scope_posture": "baseline",
      "explicit_route_contract": "yes",
      "notes": "",
      "source_refs": "phase-0-the-foundation-protocol.md#5.6 Booking, waitlist, hub, and pharmacy continuity algorithm; patient-account-and-communications-blueprint.md#Core projections"
    },
    {
      "route_family_id": "rf_staff_workspace",
      "route_family": "/workspace, /workspace/queue/:queueKey, /workspace/task/:taskId",
      "shell_type": "staff",
      "ownership_mode": "shell_root",
      "primary_surface_name": "Clinical Workspace queue and task canvas",
      "audience_tiers": "origin_practice_clinical; origin_practice_operations",
      "primary_personas": "Staff - Clinician or designated reviewer in Clinical Workspace; Staff - Practice operational staff",
      "channel_profiles": "browser",
      "ingress_channels": "Browser web",
      "owning_blueprints": "staff-workspace-interface-architecture.md; staff-operations-and-support-blueprint.md",
      "governing_objects": "WorkspaceNavigationLedger; StaffAudienceCoverageProjection; StaffWorkspaceConsistencyProjection; WorkspaceTrustEnvelope; ReviewActionLease; WorkspaceSelectedAnchorPolicy",
      "control_plane_rules": "AudienceSurfaceRuntimeBinding; VisibilityProjectionPolicy; RouteIntentBinding; CommandActionRecord; CommandSettlementRecord",
      "identity_posture": "Practice-scoped clinical or operational review posture inside the staff shell.",
      "visibility_policy_posture": "Practice-only detail and decision context without hub, support, or governance payload leakage.",
      "allowed_mutations": "Claim, review, issue direct outcomes, and launch child actions within current role scope.",
      "continuity_expectations": "Same request lineage, same staff shell; queue, task, and selected anchor remain stable across switches and refresh.",
      "degraded_recovery_states": "Observe-only, reassigned, or recovery-required task posture that preserves the last safe task summary.",
      "external_dependency_touchpoints": "Staff auth rail; Downstream booking, callback, pharmacy, and admin-resolution services",
      "scope_posture": "baseline",
      "explicit_route_contract": "yes",
      "notes": "",
      "source_refs": "staff-workspace-interface-architecture.md#Route family; staff-workspace-interface-architecture.md#Workspace shell-family ownership is explicit"
    }
  ],
  "gateway_surfaces": [
    {
      "gateway_surface_id": "gws_patient_intake_web",
      "gateway_surface_name": "Patient intake entry gateway",
      "audience_surface_id": "surf_patient_intake_web",
      "route_family_id": "rf_intake_self_service",
      "shell_type": "patient",
      "app_package_id": "app_patient_web",
      "stack_option_id": "OPT_REACT_TS_VITE_TANSTACK",
      "bff_pattern_option_id": "BFF_ROUTE_FAMILY_SPLIT",
      "session_policy_ref": "SP_PATIENT_PUBLIC_EPHEMERAL",
      "tenant_isolation_mode": "shared_public_pre_tenant",
      "blast_radius_mode": "pending_subject_lineage_only",
      "downstream_family_refs": "projection; command",
      "trust_zone_boundary_refs": "tzb_public_edge_to_published_gateway; tzb_published_gateway_to_application_core",
      "acting_scope_profile_refs": "ACT_PATIENT_PUBLIC_INTAKE",
      "contract_manifest_id": "fcm_intake_self_service",
      "route_runtime_shape": "typed_query_plus_mutation_plus_live_contracts",
      "split_reason": "Public pre-identity routes stay narrow so intake and telephony parity cannot inherit authenticated cache or session assumptions.",
      "notes": "Web intake remains in the same lineage until claim or promotion, so the gateway stays narrow and intake-specific.",
      "source_refs": "blueprint-init.md#2. Core product surfaces; phase-0-the-foundation-protocol.md#12.1 Mandatory audience tiers; platform-runtime-and-release-blueprint.md#GatewayBffSurface"
    },
    {
      "gateway_surface_id": "gws_patient_secure_link_recovery",
      "gateway_surface_name": "Secure-link recovery and claim resume gateway",
      "audience_surface_id": "surf_patient_secure_link_recovery",
      "route_family_id": "rf_patient_secure_link_recovery",
      "shell_type": "patient",
      "app_package_id": "app_patient_web",
      "stack_option_id": "OPT_REACT_TS_VITE_TANSTACK",
      "bff_pattern_option_id": "BFF_ROUTE_FAMILY_SPLIT",
      "session_policy_ref": "SP_GRANT_SCOPED_RECOVERY",
      "tenant_isolation_mode": "tenant_scoped_lineage_grant",
      "blast_radius_mode": "single_subject_single_lineage",
      "downstream_family_refs": "projection; command",
      "trust_zone_boundary_refs": "tzb_public_edge_to_published_gateway; tzb_published_gateway_to_application_core",
      "acting_scope_profile_refs": "ACT_PATIENT_GRANT_RECOVERY",
      "contract_manifest_id": "fcm_patient_secure_link_recovery",
      "route_runtime_shape": "typed_query_plus_mutation_plus_live_contracts",
      "split_reason": "Secure-link recovery needs its own grant-scoped boundary and recovery-only fallback posture.",
      "notes": "Secure-link recovery is deliberately isolated from the broader authenticated patient gateway posture.",
      "source_refs": "patient-account-and-communications-blueprint.md#Patient audience coverage contract; phase-0-the-foundation-protocol.md#5.4 Claim, secure-link, and embedded access algorithm; platform-runtime-and-release-blueprint.md#GatewayBffSurface"
    },
    {
      "gateway_surface_id": "gws_patient_home",
      "gateway_surface_name": "Patient home and spotlight gateway",
      "audience_surface_id": "surf_patient_home",
      "route_family_id": "rf_patient_home",
      "shell_type": "patient",
      "app_package_id": "app_patient_web",
      "stack_option_id": "OPT_REACT_TS_VITE_TANSTACK",
      "bff_pattern_option_id": "BFF_ROUTE_FAMILY_SPLIT",
      "session_policy_ref": "SP_PATIENT_AUTHENTICATED_SHELL",
      "tenant_isolation_mode": "tenant_scoped_subject",
      "blast_radius_mode": "single_tenant_subject_projection",
      "downstream_family_refs": "projection",
      "trust_zone_boundary_refs": "tzb_public_edge_to_published_gateway; tzb_published_gateway_to_application_core",
      "acting_scope_profile_refs": "ACT_PATIENT_AUTHENTICATED",
      "contract_manifest_id": "fcm_patient_home",
      "route_runtime_shape": "typed_query_plus_mutation_plus_live_contracts",
      "split_reason": "Read-dominant surfaces stay split from writable peers because session and cache scope differ.",
      "notes": "Home is projection-only because it orients and launches follow-up work but does not itself settle commands.",
      "source_refs": "patient-portal-experience-architecture-blueprint.md#Portal entry and shell topology; patient-account-and-communications-blueprint.md#Patient home contract; platform-runtime-and-release-blueprint.md#GatewayBffSurface"
    },
    {
      "gateway_surface_id": "gws_patient_requests",
      "gateway_surface_name": "Request list and detail gateway",
      "audience_surface_id": "surf_patient_requests",
      "route_family_id": "rf_patient_requests",
      "shell_type": "patient",
      "app_package_id": "app_patient_web",
      "stack_option_id": "OPT_REACT_TS_VITE_TANSTACK",
      "bff_pattern_option_id": "BFF_ROUTE_FAMILY_SPLIT",
      "session_policy_ref": "SP_PATIENT_AUTHENTICATED_SHELL",
      "tenant_isolation_mode": "tenant_scoped_subject",
      "blast_radius_mode": "single_tenant_subject_request_family",
      "downstream_family_refs": "projection; command",
      "trust_zone_boundary_refs": "tzb_public_edge_to_published_gateway; tzb_published_gateway_to_application_core",
      "acting_scope_profile_refs": "ACT_PATIENT_AUTHENTICATED",
      "contract_manifest_id": "fcm_patient_requests",
      "route_runtime_shape": "typed_query_plus_mutation_plus_live_contracts",
      "split_reason": "Split remains published because SP_PATIENT_AUTHENTICATED_SHELL and tenant_scoped_subject must stay auditable at the route-family tuple level.",
      "notes": "Request detail, more-info reply, and child-work entry require a narrower gateway than patient home.",
      "source_refs": "patient-account-and-communications-blueprint.md#Requests browsing contract; patient-account-and-communications-blueprint.md#Request detail contract; platform-runtime-and-release-blueprint.md#GatewayBffSurface"
    },
    {
      "gateway_surface_id": "gws_patient_appointments",
      "gateway_surface_name": "Appointments and manage gateway",
      "audience_surface_id": "surf_patient_appointments",
      "route_family_id": "rf_patient_appointments",
      "shell_type": "patient",
      "app_package_id": "app_patient_web",
      "stack_option_id": "OPT_REACT_TS_VITE_TANSTACK",
      "bff_pattern_option_id": "BFF_ROUTE_FAMILY_SPLIT",
      "session_policy_ref": "SP_PATIENT_AUTHENTICATED_SHELL",
      "tenant_isolation_mode": "tenant_scoped_subject",
      "blast_radius_mode": "single_tenant_subject_booking_family",
      "downstream_family_refs": "projection; command",
      "trust_zone_boundary_refs": "tzb_public_edge_to_published_gateway; tzb_published_gateway_to_application_core",
      "acting_scope_profile_refs": "ACT_PATIENT_AUTHENTICATED",
      "contract_manifest_id": "fcm_patient_appointments",
      "route_runtime_shape": "typed_query_plus_mutation_plus_live_contracts",
      "split_reason": "Split remains published because SP_PATIENT_AUTHENTICATED_SHELL and tenant_scoped_subject must stay auditable at the route-family tuple level.",
      "notes": "Booking manage and confirmation truth stay distinct from general request detail and require their own recovery posture.",
      "source_refs": "phase-0-the-foundation-protocol.md#5.6 Booking, waitlist, hub, and pharmacy continuity algorithm; patient-account-and-communications-blueprint.md#Core projections; platform-runtime-and-release-blueprint.md#GatewayBffSurface"
    },
    {
      "gateway_surface_id": "gws_clinician_workspace",
      "gateway_surface_name": "Clinical Workspace queue and task canvas gateway",
      "audience_surface_id": "surf_clinician_workspace",
      "route_family_id": "rf_staff_workspace",
      "shell_type": "staff",
      "app_package_id": "app_clinical_workspace",
      "stack_option_id": "OPT_REACT_TS_VITE_TANSTACK",
      "bff_pattern_option_id": "BFF_ROUTE_FAMILY_SPLIT",
      "session_policy_ref": "SP_STAFF_SSO_SINGLE_ORG",
      "tenant_isolation_mode": "tenant_org_partition",
      "blast_radius_mode": "single_tenant_single_org_operational_slice",
      "downstream_family_refs": "projection; command",
      "trust_zone_boundary_refs": "tzb_public_edge_to_published_gateway; tzb_published_gateway_to_application_core",
      "acting_scope_profile_refs": "ACT_STAFF_SINGLE_ORG",
      "contract_manifest_id": "fcm_staff_workspace",
      "route_runtime_shape": "typed_query_plus_mutation_plus_live_contracts",
      "split_reason": "Split remains published because SP_STAFF_SSO_SINGLE_ORG and tenant_org_partition must stay auditable at the route-family tuple level.",
      "notes": "Clinical workspace command authority remains single-organisation unless hub or governance tuple changes prove otherwise.",
      "source_refs": "staff-workspace-interface-architecture.md#Route family; staff-operations-and-support-blueprint.md#Clinical Workspace specialization; platform-runtime-and-release-blueprint.md#GatewayBffSurface"
    },
    {
      "gateway_surface_id": "gws_practice_ops_workspace",
      "gateway_surface_name": "Practice operations workspace gateway",
      "audience_surface_id": "surf_practice_ops_workspace",
      "route_family_id": "rf_staff_workspace",
      "shell_type": "staff",
      "app_package_id": "app_clinical_workspace",
      "stack_option_id": "OPT_REACT_TS_VITE_TANSTACK",
      "bff_pattern_option_id": "BFF_ROUTE_FAMILY_SPLIT",
      "session_policy_ref": "SP_STAFF_SSO_SINGLE_ORG",
      "tenant_isolation_mode": "tenant_org_partition",
      "blast_radius_mode": "single_tenant_single_org_operational_slice",
      "downstream_family_refs": "projection; command",
      "trust_zone_boundary_refs": "tzb_public_edge_to_published_gateway; tzb_published_gateway_to_application_core",
      "acting_scope_profile_refs": "ACT_STAFF_SINGLE_ORG",
      "contract_manifest_id": "fcm_staff_workspace",
      "route_runtime_shape": "typed_query_plus_mutation_plus_live_contracts",
      "split_reason": "Split remains published because SP_STAFF_SSO_SINGLE_ORG and tenant_org_partition must stay auditable at the route-family tuple level.",
      "notes": "Practice operations stays separate from clinician workspace because minimum-necessary scope and task mix differ.",
      "source_refs": "staff-workspace-interface-architecture.md#Route family; staff-operations-and-support-blueprint.md#Staff audience coverage contract; platform-runtime-and-release-blueprint.md#GatewayBffSurface"
    }
  ],
  "fields": [
    {
      "field_id": "fld_contact_name",
      "section": "Exact public prerequisites form",
      "label": "Name",
      "field_type": "text",
      "origin_class": "exact_public_form",
      "mock_value": "Vecells interoperability lead",
      "actual_placeholder": "Named form submitter full name.",
      "required_for": [
        "product_profile_defined",
        "official_prerequisites_form_submitted"
      ],
      "source_refs": [
        "official_im1_prerequisites_form"
      ]
    },
    {
      "field_id": "fld_contact_email",
      "section": "Exact public prerequisites form",
      "label": "Email",
      "field_type": "email",
      "origin_class": "exact_public_form",
      "mock_value": "interoperability@vecells.example",
      "actual_placeholder": "Named form submitter email address.",
      "required_for": [
        "product_profile_defined",
        "official_prerequisites_form_submitted"
      ],
      "source_refs": [
        "official_im1_prerequisites_form"
      ]
    },
    {
      "field_id": "fld_organisation_name",
      "section": "Exact public prerequisites form",
      "label": "Organisation name",
      "field_type": "text",
      "origin_class": "exact_public_form",
      "mock_value": "Vecells Ltd",
      "actual_placeholder": "Consumer supplier legal entity name approved for submission.",
      "required_for": [
        "product_profile_defined",
        "official_prerequisites_form_submitted"
      ],
      "source_refs": [
        "official_im1_prerequisites_form"
      ]
    },
    {
      "field_id": "fld_product_name",
      "section": "Exact public prerequisites form",
      "label": "Product name",
      "field_type": "text",
      "origin_class": "exact_public_form",
      "mock_value": "Vecells",
      "actual_placeholder": "Named IM1 product or system name exactly as submitted.",
      "required_for": [
        "product_profile_defined",
        "official_prerequisites_form_submitted"
      ],
      "source_refs": [
        "official_im1_prerequisites_form"
      ]
    },
    {
      "field_id": "fld_cso_confirmed",
      "section": "Clinical safety prerequisites",
      "label": "Qualified Clinical Safety Officer in place",
      "field_type": "yes_no",
      "origin_class": "exact_public_form",
      "mock_value": "yes",
      "actual_placeholder": "Yes only when the named CSO appointment exists and is current.",
      "required_for": [
        "prerequisites_drafted",
        "official_prerequisites_form_submitted"
      ],
      "source_refs": [
        "official_im1_prerequisites_form"
      ]
    },
    {
      "field_id": "fld_use_case_description_confirmed",
      "section": "Clinical safety prerequisites",
      "label": "Detailed use case description covering the whole product",
      "field_type": "yes_no",
      "origin_class": "exact_public_form",
      "mock_value": "yes",
      "actual_placeholder": "Yes only when the bounded IM1 use case dossier exists and matches the full product scope.",
      "required_for": [
        "product_profile_defined",
        "prerequisites_drafted",
        "official_prerequisites_form_submitted"
      ],
      "source_refs": [
        "official_im1_prerequisites_form"
      ]
    },
    {
      "field_id": "fld_clinical_safety_process_confirmed",
      "section": "Clinical safety prerequisites",
      "label": "Written clinical safety process and uplift commitment",
      "field_type": "yes_no",
      "origin_class": "exact_public_form",
      "mock_value": "yes",
      "actual_placeholder": "Yes only when the current clinical safety process and uplift cadence exist.",
      "required_for": [
        "prerequisites_drafted",
        "official_prerequisites_form_submitted"
      ],
      "source_refs": [
        "official_im1_prerequisites_form"
      ]
    },
    {
      "field_id": "fld_hazard_log_commitment_confirmed",
      "section": "Clinical safety prerequisites",
      "label": "Hazard log capability and uplift commitment",
      "field_type": "yes_no",
      "origin_class": "exact_public_form",
      "mock_value": "yes",
      "actual_placeholder": "Yes only when the hazard log template is active and reviewable.",
      "required_for": [
        "prerequisites_drafted",
        "official_prerequisites_form_submitted"
      ],
      "source_refs": [
        "official_im1_prerequisites_form"
      ]
    },
    {
      "field_id": "fld_samd_scrutiny_confirmed",
      "section": "Clinical safety prerequisites",
      "label": "SaMD additional scrutiny understood where applicable",
      "field_type": "yes_no",
      "origin_class": "exact_public_form",
      "mock_value": "yes",
      "actual_placeholder": "Yes only when medical-device posture has been reviewed against the IM1 use case.",
      "required_for": [
        "prerequisites_drafted",
        "official_prerequisites_form_submitted",
        "official_rfc_submitted_for_significant_change"
      ],
      "source_refs": [
        "official_im1_prerequisites_form",
        "official_im1_pairing_process"
      ]
    },
    {
      "field_id": "fld_dspt_commitment_confirmed",
      "section": "Information governance prerequisites",
      "label": "DSPT annual assessment commitment",
      "field_type": "yes_no",
      "origin_class": "exact_public_form",
      "mock_value": "yes",
      "actual_placeholder": "Yes only when the DSPT ownership and timeline are named.",
      "required_for": [
        "prerequisites_drafted",
        "official_prerequisites_form_submitted"
      ],
      "source_refs": [
        "official_im1_prerequisites_form"
      ]
    },
    {
      "field_id": "fld_dpia_commitment_confirmed",
      "section": "Information governance prerequisites",
      "label": "DPIA and transparency notice commitment",
      "field_type": "yes_no",
      "origin_class": "exact_public_form",
      "mock_value": "yes",
      "actual_placeholder": "Yes only when DPIA scope, privacy notice, and application/service coverage are current.",
      "required_for": [
        "prerequisites_drafted",
        "official_prerequisites_form_submitted",
        "assurance_pack_in_progress"
      ],
      "source_refs": [
        "official_im1_prerequisites_form"
      ]
    },
    {
      "field_id": "fld_isms_commitment_confirmed",
      "section": "Information governance prerequisites",
      "label": "ISMS / ISO 27001 commitment",
      "field_type": "yes_no",
      "origin_class": "exact_public_form",
      "mock_value": "yes",
      "actual_placeholder": "Yes only when the ISMS owner and control posture are named.",
      "required_for": [
        "prerequisites_drafted",
        "official_prerequisites_form_submitted"
      ],
      "source_refs": [
        "official_im1_prerequisites_form"
      ]
    },
    {
      "field_id": "fld_pen_test_commitment_confirmed",
      "section": "Information governance prerequisites",
      "label": "CHECK / CREST penetration-test commitment",
      "field_type": "yes_no",
      "origin_class": "exact_public_form",
      "mock_value": "yes",
      "actual_placeholder": "Yes only when penetration-test planning, cadence, and evidence sink are named.",
      "required_for": [
        "prerequisites_drafted",
        "official_prerequisites_form_submitted",
        "assurance_pack_in_progress"
      ],
      "source_refs": [
        "official_im1_prerequisites_form"
      ]
    },
    {
      "field_id": "fld_uk_processing_confirmed",
      "section": "Information governance prerequisites",
      "label": "UK location for patient-data processing",
      "field_type": "yes_no",
      "origin_class": "exact_public_form",
      "mock_value": "yes",
      "actual_placeholder": "Yes only when the UK processing statement and residency posture are current.",
      "required_for": [
        "prerequisites_drafted",
        "official_prerequisites_form_submitted"
      ],
      "source_refs": [
        "official_im1_prerequisites_form"
      ]
    },
    {
      "field_id": "fld_supplier_emis_selected",
      "section": "Provider suppliers",
      "label": "Integrate with EMIS (EMIS Web)",
      "field_type": "yes_no",
      "origin_class": "exact_public_form",
      "mock_value": "yes",
      "actual_placeholder": "Yes only when EMIS remains in the current official provider-supplier roster and the route-family matrix supports it.",
      "required_for": [
        "provider_supplier_targeting_ready",
        "official_prerequisites_form_submitted"
      ],
      "source_refs": [
        "official_im1_prerequisites_form",
        "official_im1_pairing_process"
      ]
    },
    {
      "field_id": "fld_supplier_tpp_selected",
      "section": "Provider suppliers",
      "label": "Integrate with TPP (SystmOne)",
      "field_type": "yes_no",
      "origin_class": "exact_public_form",
      "mock_value": "yes",
      "actual_placeholder": "Yes only when TPP remains in the current official provider-supplier roster and the route-family matrix supports it.",
      "required_for": [
        "provider_supplier_targeting_ready",
        "official_prerequisites_form_submitted"
      ],
      "source_refs": [
        "official_im1_prerequisites_form",
        "official_im1_pairing_process"
      ]
    },
    {
      "field_id": "fld_bounded_im1_use_case",
      "section": "Derived stage-one SCAL dossier",
      "label": "Bounded IM1 use case narrative",
      "field_type": "textarea",
      "origin_class": "derived_scal_input",
      "mock_value": "Local booking capability rehearsal for supplier-specific appointment access while keeping identity and request continuity independent of IM1.",
      "actual_placeholder": "Bounded IM1 scope statement that excludes Phase 2 identity shortcuts and names the exact patient and staff booking surfaces.",
      "required_for": [
        "stage_one_scal_stub_ready",
        "official_stage_one_scal_issued"
      ],
      "source_refs": [
        "official_im1_pairing_process",
        "official_scal_process",
        "ASSUMPTION_IM1_STAGE_ONE_SCAL_FIELDS"
      ]
    },
    {
      "field_id": "fld_capability_matrix_digest",
      "section": "Derived stage-one SCAL dossier",
      "label": "ProviderCapabilityMatrix digest",
      "field_type": "text",
      "origin_class": "derived_scal_input",
      "mock_value": "PCM-SEQ026-DIGEST-001",
      "actual_placeholder": "Published provider capability matrix hash or immutable reference for the submitted scope.",
      "required_for": [
        "stage_one_scal_stub_ready",
        "provider_supplier_targeting_ready",
        "compatibility_claim_ready"
      ],
      "source_refs": [
        "official_scal_process",
        "phase-0-the-foundation-protocol.md#1.13A ProviderCapabilityMatrix",
        "ASSUMPTION_IM1_STAGE_ONE_SCAL_FIELDS"
      ]
    },
    {
      "field_id": "fld_route_family_matrix_digest",
      "section": "Derived stage-one SCAL dossier",
      "label": "Route-family compatibility digest",
      "field_type": "text",
      "origin_class": "derived_scal_input",
      "mock_value": "RFCOMP-SEQ026-001",
      "actual_placeholder": "Immutable reference for the submitted route-family-to-supplier compatibility matrix.",
      "required_for": [
        "provider_supplier_targeting_ready",
        "compatibility_claim_ready"
      ],
      "source_refs": [
        "official_im1_api_standards",
        "phase-4-the-booking-engine.md#4B. Provider capability matrix and adapter seam",
        "ASSUMPTION_IM1_STAGE_ONE_SCAL_FIELDS"
      ]
    },
    {
      "field_id": "fld_booking_truth_guardrails",
      "section": "Derived stage-one SCAL dossier",
      "label": "Booking truth and ambiguity guardrails",
      "field_type": "textarea",
      "origin_class": "derived_scal_input",
      "mock_value": "Queue acceptance, supplier processing, or mock-API access never imply booked truth; only authoritative confirmation proof may do that.",
      "actual_placeholder": "Submission-ready statement showing how supplier truth, ambiguity, and fallback remain separate from canonical booking state.",
      "required_for": [
        "compatibility_claim_ready",
        "provider_mock_api_rehearsal_ready"
      ],
      "source_refs": [
        "official_im1_pairing_process",
        "phase-4-the-booking-engine.md#4E. Commit path, revalidation, booking record, and compensation",
        "blueprint/forensic-audit-findings.md#Finding 72 - The booking commit path did not bind ambiguous supplier truth to canonical confirmation gates strongly enough"
      ]
    },
    {
      "field_id": "fld_architecture_artifact_set",
      "section": "Derived stage-one SCAL dossier",
      "label": "Current architecture and data-flow artifact set",
      "field_type": "textarea",
      "origin_class": "derived_scal_input",
      "mock_value": "Architecture ADR pack, runtime topology, data classification pack, and backend/frontend baseline references current on 2026-04-09.",
      "actual_placeholder": "Exact architecture, data-flow, and runtime artifact references attached to the IM1 submission pack.",
      "required_for": [
        "stage_one_scal_stub_ready",
        "assurance_pack_in_progress",
        "ready_for_real_im1_submission"
      ],
      "source_refs": [
        "official_scal_process",
        "ASSUMPTION_IM1_STAGE_ONE_SCAL_FIELDS"
      ]
    },
    {
      "field_id": "fld_named_sponsor_placeholder",
      "section": "Derived live-gate dossier",
      "label": "Named sponsor / commercial owner posture",
      "field_type": "textarea",
      "origin_class": "derived_live_gate",
      "mock_value": "ASSUMPTION_IM1_REAL_SUBMISSION_REMAINS_BLOCKED: sponsor and commercial owner placeholders only.",
      "actual_placeholder": "Named sponsor, commercial owner, and contact chain approved for real submission.",
      "required_for": [
        "ready_for_real_im1_submission",
        "official_prerequisites_form_submitted"
      ],
      "source_refs": [
        "official_im1_pairing_process",
        "ASSUMPTION_IM1_REAL_SUBMISSION_REMAINS_BLOCKED"
      ]
    },
    {
      "field_id": "fld_named_approver_placeholder",
      "section": "Derived live-gate dossier",
      "label": "Named approver",
      "field_type": "text",
      "origin_class": "derived_live_gate",
      "mock_value": "BLOCKED_UNTIL_REAL_APPROVER",
      "actual_placeholder": "Named approver required for any real submission or portal mutation.",
      "required_for": [
        "ready_for_real_im1_submission",
        "official_prerequisites_form_submitted"
      ],
      "source_refs": [
        "prompt/026.md",
        "ASSUMPTION_IM1_REAL_SUBMISSION_REMAINS_BLOCKED"
      ]
    },
    {
      "field_id": "fld_environment_target_placeholder",
      "section": "Derived live-gate dossier",
      "label": "Environment target",
      "field_type": "text",
      "origin_class": "derived_live_gate",
      "mock_value": "supported_test",
      "actual_placeholder": "Named target such as initiation, unsupported test, supported test, or assurance evidence refresh.",
      "required_for": [
        "ready_for_real_im1_submission",
        "official_supported_test_environment_requested"
      ],
      "source_refs": [
        "official_im1_pairing_process",
        "prompt/026.md"
      ]
    },
    {
      "field_id": "fld_rfc_change_class_digest",
      "section": "Derived RFC watch dossier",
      "label": "RFC change-class digest",
      "field_type": "textarea",
      "origin_class": "derived_live_gate",
      "mock_value": "AI expansion, new route families, wider booking mutations, new suppliers, or significant medical-device changes require updated SCAL and documentation.",
      "actual_placeholder": "Current change-class summary tied to the latest assured IM1 scope and RFC pack.",
      "required_for": [
        "rfc_watch_registered",
        "official_rfc_submitted_for_significant_change"
      ],
      "source_refs": [
        "official_im1_pairing_process",
        "blueprint/phase-8-the-assistive-layer.md"
      ]
    }
  ],
  "artifacts": [
    {
      "artifact_id": "ART_PRODUCT_PROFILE_DOSSIER",
      "artifact_name": "Product profile dossier",
      "artifact_group": "initiation",
      "required_for_stage_ids": [
        "product_profile_defined",
        "official_prerequisites_form_submitted"
      ],
      "mock_status": "ready",
      "actual_status": "placeholder_only",
      "freshness_posture": "fresh",
      "owner_role": "ROLE_PROGRAMME_ARCHITECT",
      "source_refs": [
        "prompt/026.md",
        "official_im1_prerequisites_form"
      ],
      "notes": "Names the bounded Vecells IM1 use case and explicitly excludes Phase 2 identity shortcuts."
    },
    {
      "artifact_id": "ART_PROVIDER_CAPABILITY_MATRIX_DIGEST",
      "artifact_name": "ProviderCapabilityMatrix digest",
      "artifact_group": "initiation",
      "required_for_stage_ids": [
        "stage_one_scal_stub_ready",
        "provider_supplier_targeting_ready",
        "compatibility_claim_ready"
      ],
      "mock_status": "ready",
      "actual_status": "ready_for_refresh",
      "freshness_posture": "fresh",
      "owner_role": "ROLE_BOOKING_DOMAIN_LEAD",
      "source_refs": [
        "phase-0-the-foundation-protocol.md#1.13A ProviderCapabilityMatrix",
        "phase-4-the-booking-engine.md#4B. Provider capability matrix and adapter seam"
      ],
      "notes": "Every IM1 submission claim must bind back to the capability matrix rather than prose promises."
    },
    {
      "artifact_id": "ART_ROUTE_FAMILY_COMPATIBILITY_MATRIX",
      "artifact_name": "Route-family compatibility matrix",
      "artifact_group": "initiation",
      "required_for_stage_ids": [
        "provider_supplier_targeting_ready",
        "compatibility_claim_ready"
      ],
      "mock_status": "ready",
      "actual_status": "ready_for_refresh",
      "freshness_posture": "fresh",
      "owner_role": "ROLE_INTEROPERABILITY_LEAD",
      "source_refs": [
        "phase-4-the-booking-engine.md#4B. Provider capability matrix and adapter seam",
        "official_im1_api_standards"
      ],
      "notes": "Shows which route families remain IM1-independent and which booking surfaces need supplier-specific pairing evidence."
    },
    {
      "artifact_id": "ART_STAGE_ONE_SCAL_STUB",
      "artifact_name": "Stage-one SCAL stub",
      "artifact_group": "initiation",
      "required_for_stage_ids": [
        "stage_one_scal_stub_ready",
        "official_stage_one_scal_issued"
      ],
      "mock_status": "ready",
      "actual_status": "blocked_until_live_gate",
      "freshness_posture": "attention",
      "owner_role": "ROLE_INTEROPERABILITY_LEAD",
      "source_refs": [
        "official_im1_pairing_process",
        "official_scal_process",
        "ASSUMPTION_IM1_STAGE_ONE_SCAL_FIELDS"
      ],
      "notes": "Built from the bounded product dossier plus supplier/product/service-specific tabs."
    },
    {
      "artifact_id": "ART_CLINICAL_SAFETY_DECLARATION",
      "artifact_name": "Clinical safety prerequisites declaration",
      "artifact_group": "initiation",
      "required_for_stage_ids": [
        "prerequisites_drafted",
        "official_prerequisites_form_submitted"
      ],
      "mock_status": "ready",
      "actual_status": "ready_for_refresh",
      "freshness_posture": "fresh",
      "owner_role": "ROLE_MANUFACTURER_CSO",
      "source_refs": [
        "official_im1_prerequisites_form",
        "official_scal_process"
      ],
      "notes": "Captures the public prerequisite confirmations that must already be true at initial SCAL submission time."
    },
    {
      "artifact_id": "ART_HAZARD_LOG",
      "artifact_name": "Hazard log and safety-case digest",
      "artifact_group": "assurance",
      "required_for_stage_ids": [
        "prerequisites_drafted",
        "assurance_pack_in_progress",
        "official_assurance_completed",
        "official_rfc_submitted_for_significant_change"
      ],
      "mock_status": "ready",
      "actual_status": "ready_for_refresh",
      "freshness_posture": "attention",
      "owner_role": "ROLE_MANUFACTURER_CSO",
      "source_refs": [
        "official_im1_prerequisites_form",
        "official_im1_pairing_process"
      ],
      "notes": "AI or major functional expansion reopens this pack and must not piggyback on stale approval."
    },
    {
      "artifact_id": "ART_DPIA_AND_PRIVACY_NOTICE",
      "artifact_name": "DPIA and privacy-notice digest",
      "artifact_group": "assurance",
      "required_for_stage_ids": [
        "prerequisites_drafted",
        "assurance_pack_in_progress",
        "official_assurance_completed"
      ],
      "mock_status": "ready",
      "actual_status": "ready_for_refresh",
      "freshness_posture": "attention",
      "owner_role": "ROLE_DPO",
      "source_refs": [
        "official_im1_prerequisites_form",
        "official_scal_process"
      ],
      "notes": "Must stay current with the exact IM1 use case and supplier data-flow posture."
    },
    {
      "artifact_id": "ART_DSPT_ISMS_PEN_TEST_PLAN",
      "artifact_name": "DSPT / ISMS / pen-test plan",
      "artifact_group": "assurance",
      "required_for_stage_ids": [
        "prerequisites_drafted",
        "assurance_pack_in_progress",
        "official_assurance_completed"
      ],
      "mock_status": "ready",
      "actual_status": "ready_for_refresh",
      "freshness_posture": "attention",
      "owner_role": "ROLE_SECURITY_LEAD",
      "source_refs": [
        "official_im1_prerequisites_form",
        "official_scal_process"
      ],
      "notes": "A governance artifact, not a hidden side-note to the pairing form."
    },
    {
      "artifact_id": "ART_MODEL_INTERFACE_LICENCE_PLACEHOLDERS",
      "artifact_name": "Model Interface Licence placeholder register",
      "artifact_group": "initiation",
      "required_for_stage_ids": [
        "model_interface_licence_placeholder_ready",
        "official_model_interface_licence_executed"
      ],
      "mock_status": "ready",
      "actual_status": "placeholder_only",
      "freshness_posture": "fresh",
      "owner_role": "ROLE_INTEROPERABILITY_LEAD",
      "source_refs": [
        "official_im1_pairing_process",
        "ASSUMPTION_IM1_LICENCE_SIGNATORIES_PLACEHOLDER_ONLY"
      ],
      "notes": "Tracks licence readiness without storing real legal names or signatory details in the repo."
    },
    {
      "artifact_id": "ART_PROVIDER_MOCK_API_REHEARSAL_LOG",
      "artifact_name": "Provider mock-API rehearsal log",
      "artifact_group": "unsupported_test",
      "required_for_stage_ids": [
        "provider_mock_api_rehearsal_ready",
        "official_provider_mock_api_accessed"
      ],
      "mock_status": "ready",
      "actual_status": "blocked_until_live_gate",
      "freshness_posture": "fresh",
      "owner_role": "ROLE_BOOKING_DOMAIN_LEAD",
      "source_refs": [
        "official_im1_pairing_process",
        "phase-4-the-booking-engine.md#4E. Commit path, revalidation, booking record, and compensation"
      ],
      "notes": "Must preserve unsupported-test truth without claiming live admissibility or canonical booking success."
    },
    {
      "artifact_id": "ART_PAIRING_INTEGRATION_PACK_REGISTER",
      "artifact_name": "Pairing and Integration Pack register",
      "artifact_group": "unsupported_test",
      "required_for_stage_ids": [
        "provider_mock_api_rehearsal_ready",
        "official_supported_test_environment_requested"
      ],
      "mock_status": "ready",
      "actual_status": "blocked_until_supplier_access",
      "freshness_posture": "attention",
      "owner_role": "ROLE_INTEROPERABILITY_LEAD",
      "source_refs": [
        "official_im1_pairing_process",
        "official_im1_api_standards"
      ],
      "notes": "Captures the supplier-specific documentation bundle required for unsupported test work."
    },
    {
      "artifact_id": "ART_SUPPORTED_TEST_REQUEST_CHECKLIST",
      "artifact_name": "Supported Test Environment request checklist",
      "artifact_group": "supported_test",
      "required_for_stage_ids": [
        "supported_test_readiness_blocked",
        "official_supported_test_environment_requested",
        "official_supported_test_environment_granted"
      ],
      "mock_status": "blocked",
      "actual_status": "blocked_until_live_gate",
      "freshness_posture": "blocked",
      "owner_role": "ROLE_INTEROPERABILITY_LEAD",
      "source_refs": [
        "official_im1_pairing_process"
      ],
      "notes": "Cannot progress until the full SCAL, named sponsor, and provider-specific evidence are current."
    },
    {
      "artifact_id": "ART_ASSURANCE_EVIDENCE_INDEX",
      "artifact_name": "Assurance evidence index",
      "artifact_group": "assurance",
      "required_for_stage_ids": [
        "assurance_pack_in_progress",
        "official_assurance_completed"
      ],
      "mock_status": "in_progress",
      "actual_status": "blocked_until_live_gate",
      "freshness_posture": "attention",
      "owner_role": "ROLE_GOVERNANCE_LEAD",
      "source_refs": [
        "official_im1_pairing_process",
        "official_scal_process"
      ],
      "notes": "Carries the evidence sequence for test proof, witness tests, and assurance acceptance."
    },
    {
      "artifact_id": "ART_RFC_TRIGGER_REGISTER",
      "artifact_name": "RFC trigger register",
      "artifact_group": "rfc_watch",
      "required_for_stage_ids": [
        "rfc_watch_registered",
        "official_rfc_submitted_for_significant_change"
      ],
      "mock_status": "ready",
      "actual_status": "ready",
      "freshness_posture": "fresh",
      "owner_role": "ROLE_PROGRAMME_ARCHITECT",
      "source_refs": [
        "official_im1_pairing_process",
        "blueprint/phase-8-the-assistive-layer.md"
      ],
      "notes": "Explicitly fences AI and other major feature changes so stale IM1 posture cannot be silently reused."
    },
    {
      "artifact_id": "ART_PROVIDER_ROSTER_REFRESH_EVIDENCE",
      "artifact_name": "Provider roster refresh evidence",
      "artifact_group": "initiation",
      "required_for_stage_ids": [
        "provider_supplier_targeting_ready",
        "ready_for_real_im1_submission"
      ],
      "mock_status": "ready",
      "actual_status": "runtime_fetch_required",
      "freshness_posture": "attention",
      "owner_role": "ROLE_INTEROPERABILITY_LEAD",
      "source_refs": [
        "official_im1_pairing_process"
      ],
      "notes": "The actual-later workflow must fetch the current public roster at runtime instead of hard-coding stale supplier assumptions."
    }
  ],
  "stage_rows": [
    {
      "stage_id": "product_profile_defined",
      "stage_name": "Product profile defined",
      "stage_group": "initiation",
      "stage_class": "internal_rehearsal",
      "entry_conditions": [
        "Bound the IM1 use case to booking-capability work only.",
        "Record that NHS login and patient continuity remain admissible without IM1."
      ],
      "required_artifacts": [
        "ART_PRODUCT_PROFILE_DOSSIER"
      ],
      "manual_checkpoints": [
        "Architect and interoperability lead agree the IM1 scope stays bounded."
      ],
      "browser_automation_possible": "yes",
      "mock_now_action": "Capture the internal product profile and IM1 disclaimers inside the rehearsal studio.",
      "actual_later_action": "Use the same bounded profile as the basis of later prerequisites-form preparation.",
      "outputs": [
        "Bounded IM1 use-case summary",
        "Stage unlock for prerequisites drafting"
      ],
      "safety_and_privacy_dependencies": [
        "RISK_EXT_IM1_SCAL_DELAY",
        "HZ_WRONG_PATIENT_BINDING"
      ],
      "risk_refs": [
        "RISK_EXT_IM1_SCAL_DELAY",
        "HZ_WRONG_PATIENT_BINDING"
      ],
      "notes": "This is where the pack closes the critical-path contradiction: IM1 is prepared early but remains non-authoritative for Phase 2 identity.",
      "source_refs": [
        "blueprint/phase-2-the-identity-and-echoes.md#Rule 5: keep IM1 out of the critical path for this phase",
        "prompt/026.md"
      ],
      "prerequisite_stage_ids": [],
      "live_gate_refs": []
    },
    {
      "stage_id": "prerequisites_drafted",
      "stage_name": "Prerequisites drafted",
      "stage_group": "initiation",
      "stage_class": "internal_rehearsal",
      "entry_conditions": [
        "The exact public prerequisites-form fields are mapped.",
        "Clinical safety and IG prerequisites are linked to current Vecells artifacts."
      ],
      "required_artifacts": [
        "ART_CLINICAL_SAFETY_DECLARATION",
        "ART_HAZARD_LOG",
        "ART_DPIA_AND_PRIVACY_NOTICE",
        "ART_DSPT_ISMS_PEN_TEST_PLAN"
      ],
      "manual_checkpoints": [
        "Clinical safety, privacy, and security owners confirm placeholder posture is current."
      ],
      "browser_automation_possible": "yes",
      "mock_now_action": "Fill the rehearsal dossier from the exact public field map and show blockers where the product still carries placeholders.",
      "actual_later_action": "Use the same field map as the browser-automation dry-run profile before any real form interaction.",
      "outputs": [
        "Complete prerequisites field map",
        "Draft readiness notes per field"
      ],
      "safety_and_privacy_dependencies": [
        "RISK_EXT_IM1_SCAL_DELAY",
        "RISK_RUNTIME_001"
      ],
      "risk_refs": [
        "RISK_EXT_IM1_SCAL_DELAY",
        "RISK_RUNTIME_001"
      ],
      "notes": "The rehearsal twin must show exact public prerequisites truth, not a simplified narrative checklist.",
      "source_refs": [
        "official_im1_prerequisites_form",
        "official_scal_process"
      ],
      "prerequisite_stage_ids": [
        "product_profile_defined"
      ],
      "live_gate_refs": []
    },
    {
      "stage_id": "stage_one_scal_stub_ready",
      "stage_name": "Stage-one SCAL stub ready",
      "stage_group": "initiation",
      "stage_class": "internal_rehearsal",
      "entry_conditions": [
        "A supplier/product/service dossier exists for stage-one SCAL preparation.",
        "Capability, route-family, and architecture digests are current."
      ],
      "required_artifacts": [
        "ART_STAGE_ONE_SCAL_STUB",
        "ART_PROVIDER_CAPABILITY_MATRIX_DIGEST",
        "ART_ROUTE_FAMILY_COMPATIBILITY_MATRIX",
        "ART_PRODUCT_PROFILE_DOSSIER"
      ],
      "manual_checkpoints": [
        "Interoperability lead confirms the stage-one stub stays aligned to the bounded use case."
      ],
      "browser_automation_possible": "yes",
      "mock_now_action": "Generate the internal stage-one SCAL skeleton and link every claim back to a Vecells artifact.",
      "actual_later_action": "Freeze the dossier so a future form run can populate product information without reinterpreting the architecture.",
      "outputs": [
        "Stage-one SCAL stub",
        "Artifact traceability map"
      ],
      "safety_and_privacy_dependencies": [
        "RISK_EXT_IM1_SCAL_DELAY",
        "RISK_RUNTIME_001"
      ],
      "risk_refs": [
        "RISK_EXT_IM1_SCAL_DELAY",
        "RISK_RUNTIME_001"
      ],
      "notes": "The public IM1 page names stage-one SCAL but not every field, so the stub stays explicit about what is derived.",
      "source_refs": [
        "official_im1_pairing_process",
        "official_scal_process",
        "ASSUMPTION_IM1_STAGE_ONE_SCAL_FIELDS"
      ],
      "prerequisite_stage_ids": [
        "prerequisites_drafted"
      ],
      "live_gate_refs": []
    },
    {
      "stage_id": "provider_supplier_targeting_ready",
      "stage_name": "Provider supplier targeting ready",
      "stage_group": "initiation",
      "stage_class": "internal_rehearsal",
      "entry_conditions": [
        "The current public provider roster has a fetch-at-runtime source.",
        "Each targeted route family has supplier-specific compatibility notes."
      ],
      "required_artifacts": [
        "ART_PROVIDER_CAPABILITY_MATRIX_DIGEST",
        "ART_ROUTE_FAMILY_COMPATIBILITY_MATRIX",
        "ART_PROVIDER_ROSTER_REFRESH_EVIDENCE"
      ],
      "manual_checkpoints": [
        "Interoperability lead confirms the target suppliers still match the current public roster."
      ],
      "browser_automation_possible": "partial",
      "mock_now_action": "Select providers in the rehearsal matrix and capture route-family compatibility notes.",
      "actual_later_action": "Fetch the current roster at runtime before any real portal preparation and block if the official roster no longer matches the pack.",
      "outputs": [
        "Provider-targeting matrix",
        "Runtime roster refresh rule"
      ],
      "safety_and_privacy_dependencies": [
        "RISK_EXT_BOOKING_PROVIDER_GAP",
        "RISK_EXT_IM1_SCAL_DELAY"
      ],
      "risk_refs": [
        "RISK_EXT_BOOKING_PROVIDER_GAP",
        "RISK_EXT_IM1_SCAL_DELAY"
      ],
      "notes": "This stage exists specifically to stop provider paperwork drifting away from actual supplier capability evidence.",
      "source_refs": [
        "official_im1_pairing_process",
        "official_im1_prerequisites_form",
        "official_im1_api_standards"
      ],
      "prerequisite_stage_ids": [
        "stage_one_scal_stub_ready"
      ],
      "live_gate_refs": [
        "LIVE_GATE_PROVIDER_ROSTER_REFRESH_REQUIRED"
      ]
    },
    {
      "stage_id": "compatibility_claim_ready",
      "stage_name": "Compatibility claim ready",
      "stage_group": "initiation",
      "stage_class": "internal_rehearsal",
      "entry_conditions": [
        "Compatibility claims are tied to ProviderCapabilityMatrix and BookingProviderAdapterBinding evidence.",
        "The booking truth guardrail statement is current."
      ],
      "required_artifacts": [
        "ART_PROVIDER_CAPABILITY_MATRIX_DIGEST",
        "ART_ROUTE_FAMILY_COMPATIBILITY_MATRIX",
        "ART_STAGE_ONE_SCAL_STUB"
      ],
      "manual_checkpoints": [
        "Booking domain lead signs off that compatibility does not overclaim booked truth or live reach."
      ],
      "browser_automation_possible": "yes",
      "mock_now_action": "Render route-family compatibility claims and explicit unsupported states in the control tower.",
      "actual_later_action": "Carry the same claims into later supplier conversations and reject any step that asks for broader capability than the matrix allows.",
      "outputs": [
        "Compatibility claim digest",
        "Supplier-specific caveat notes"
      ],
      "safety_and_privacy_dependencies": [
        "RISK_EXT_BOOKING_PROVIDER_GAP",
        "RISK_MUTATION_003"
      ],
      "risk_refs": [
        "RISK_EXT_BOOKING_PROVIDER_GAP",
        "RISK_MUTATION_003"
      ],
      "notes": "Compatibility readiness is not the same as live approval or technical acceptance.",
      "source_refs": [
        "official_im1_pairing_process",
        "phase-0-the-foundation-protocol.md#1.13B BookingProviderAdapterBinding"
      ],
      "prerequisite_stage_ids": [
        "provider_supplier_targeting_ready"
      ],
      "live_gate_refs": []
    },
    {
      "stage_id": "model_interface_licence_placeholder_ready",
      "stage_name": "Model Interface Licence placeholder ready",
      "stage_group": "initiation",
      "stage_class": "internal_rehearsal",
      "entry_conditions": [
        "Provider-specific licence slots exist for each targeted supplier.",
        "Named signatory placeholders are tracked by role instead of repo fixture."
      ],
      "required_artifacts": [
        "ART_MODEL_INTERFACE_LICENCE_PLACEHOLDERS"
      ],
      "manual_checkpoints": [
        "Commercial and governance leads confirm placeholder-only posture."
      ],
      "browser_automation_possible": "no",
      "mock_now_action": "Track licence readiness and signatory placeholders without storing real legal or signing details.",
      "actual_later_action": "Populate the real licence pack only after named sponsor, commercial owner, and approver details exist outside the repo.",
      "outputs": [
        "Licence placeholder register",
        "Role-owned signatory slots"
      ],
      "safety_and_privacy_dependencies": [
        "RISK_EXT_IM1_SCAL_DELAY"
      ],
      "risk_refs": [
        "RISK_EXT_IM1_SCAL_DELAY"
      ],
      "notes": "Licence readiness exists early, but licence execution remains a later human-governed checkpoint.",
      "source_refs": [
        "official_im1_pairing_process",
        "ASSUMPTION_IM1_LICENCE_SIGNATORIES_PLACEHOLDER_ONLY"
      ],
      "prerequisite_stage_ids": [
        "compatibility_claim_ready"
      ],
      "live_gate_refs": [
        "LIVE_GATE_NAMED_SPONSOR_AND_COMMERCIAL_OWNER",
        "LIVE_GATE_NAMED_APPROVER_PRESENT"
      ]
    },
    {
      "stage_id": "provider_mock_api_rehearsal_ready",
      "stage_name": "Provider mock API rehearsal ready",
      "stage_group": "unsupported_test",
      "stage_class": "internal_rehearsal",
      "entry_conditions": [
        "The unsupported-test simulator preserves supplier truth, ambiguity, and fallback semantics.",
        "PIP placeholder registry and provider mock-API rehearsal log are current."
      ],
      "required_artifacts": [
        "ART_PROVIDER_MOCK_API_REHEARSAL_LOG",
        "ART_PAIRING_INTEGRATION_PACK_REGISTER"
      ],
      "manual_checkpoints": [
        "Booking domain lead confirms the simulator is stricter than a typical happy-path vendor stub."
      ],
      "browser_automation_possible": "yes",
      "mock_now_action": "Exercise unsupported-test behavior entirely inside the rehearsal studio and local simulators.",
      "actual_later_action": "Use the same capability and artifact model when real provider mock-API access is later granted.",
      "outputs": [
        "Unsupported-test rehearsal evidence",
        "PIP placeholder list"
      ],
      "safety_and_privacy_dependencies": [
        "RISK_EXT_BOOKING_PROVIDER_GAP",
        "RISK_RUNTIME_001"
      ],
      "risk_refs": [
        "RISK_EXT_BOOKING_PROVIDER_GAP",
        "RISK_RUNTIME_001"
      ],
      "notes": "Access to a provider mock API is never treated as live or authoritative booking truth.",
      "source_refs": [
        "official_im1_pairing_process",
        "official_im1_api_standards"
      ],
      "prerequisite_stage_ids": [
        "model_interface_licence_placeholder_ready"
      ],
      "live_gate_refs": []
    },
    {
      "stage_id": "supported_test_readiness_blocked",
      "stage_name": "Supported-test readiness blocked",
      "stage_group": "supported_test",
      "stage_class": "blocked_until_mvp",
      "entry_conditions": [
        "The full SCAL is complete.",
        "Named sponsor, commercial owner, approver, and environment target are present.",
        "Provider-specific evidence and assurance freshness are current."
      ],
      "required_artifacts": [
        "ART_SUPPORTED_TEST_REQUEST_CHECKLIST",
        "ART_ASSURANCE_EVIDENCE_INDEX"
      ],
      "manual_checkpoints": [
        "Human review confirms the supported-test request is admissible."
      ],
      "browser_automation_possible": "partial",
      "mock_now_action": "Show the blocked state explicitly with machine-readable blocker chips.",
      "actual_later_action": "Request Supported Test Environment access only after the live-gate pack turns green.",
      "outputs": [
        "Supported-test blocker digest",
        "Live-gate dependency list"
      ],
      "safety_and_privacy_dependencies": [
        "RISK_EXT_IM1_SCAL_DELAY",
        "RISK_EXT_BOOKING_PROVIDER_GAP",
        "HZ_WRONG_PATIENT_BINDING"
      ],
      "risk_refs": [
        "RISK_EXT_IM1_SCAL_DELAY",
        "RISK_EXT_BOOKING_PROVIDER_GAP",
        "HZ_WRONG_PATIENT_BINDING"
      ],
      "notes": "The pack intentionally keeps this blocked today so the studio cannot be mistaken for approval.",
      "source_refs": [
        "official_im1_pairing_process",
        "prompt/026.md"
      ],
      "prerequisite_stage_ids": [
        "provider_mock_api_rehearsal_ready"
      ],
      "live_gate_refs": [
        "LIVE_GATE_PROVIDER_CAPABILITY_MODEL_FROZEN",
        "LIVE_GATE_SAFETY_PRIVACY_ARCHITECTURE_CURRENT",
        "LIVE_GATE_NAMED_SPONSOR_AND_COMMERCIAL_OWNER",
        "LIVE_GATE_NAMED_APPROVER_PRESENT",
        "LIVE_GATE_ENVIRONMENT_TARGET_PRESENT"
      ]
    },
    {
      "stage_id": "assurance_pack_in_progress",
      "stage_name": "Assurance pack in progress",
      "stage_group": "assurance",
      "stage_class": "internal_rehearsal",
      "entry_conditions": [
        "The assurance evidence index exists.",
        "Safety, privacy, architecture, and runtime artifacts are linked into the IM1 pack."
      ],
      "required_artifacts": [
        "ART_ASSURANCE_EVIDENCE_INDEX",
        "ART_HAZARD_LOG",
        "ART_DPIA_AND_PRIVACY_NOTICE",
        "ART_DSPT_ISMS_PEN_TEST_PLAN"
      ],
      "manual_checkpoints": [
        "Governance lead confirms freshness posture and missing evidence list."
      ],
      "browser_automation_possible": "yes",
      "mock_now_action": "Track evidence freshness and blocker counts in the control tower header and inspector.",
      "actual_later_action": "Use the same evidence ordering when the later SCAL and assurance review run begins.",
      "outputs": [
        "Assurance evidence freshness index",
        "Evidence-gap list"
      ],
      "safety_and_privacy_dependencies": [
        "RISK_RUNTIME_001",
        "RISK_MUTATION_003"
      ],
      "risk_refs": [
        "RISK_RUNTIME_001",
        "RISK_MUTATION_003"
      ],
      "notes": "Assurance is represented as an explicit workstream, not a hidden endnote after technical pairing.",
      "source_refs": [
        "official_im1_pairing_process",
        "official_scal_process"
      ],
      "prerequisite_stage_ids": [
        "stage_one_scal_stub_ready"
      ],
      "live_gate_refs": [
        "LIVE_GATE_SAFETY_PRIVACY_ARCHITECTURE_CURRENT"
      ]
    },
    {
      "stage_id": "rfc_watch_registered",
      "stage_name": "RFC watch registered",
      "stage_group": "rfc_watch",
      "stage_class": "internal_rehearsal",
      "entry_conditions": [
        "AI, major function, supplier, route-family, and medical-device change classes are named.",
        "Each class maps to an updated SCAL and documentation expectation."
      ],
      "required_artifacts": [
        "ART_RFC_TRIGGER_REGISTER"
      ],
      "manual_checkpoints": [
        "Programme architect confirms the watch register stays aligned with Phase 8 and later scope changes."
      ],
      "browser_automation_possible": "yes",
      "mock_now_action": "Track RFC trigger classes in the rehearsal studio and make them visible in the licence watch view.",
      "actual_later_action": "Use the same trigger register when product scope evolves after assurance or live rollout.",
      "outputs": [
        "RFC trigger register",
        "AI and major-change watchpoints"
      ],
      "safety_and_privacy_dependencies": [
        "RISK_MUTATION_003"
      ],
      "risk_refs": [
        "RISK_MUTATION_003"
      ],
      "notes": "This closes the gap where assistive or AI expansion might otherwise ride through stale IM1 paperwork.",
      "source_refs": [
        "official_im1_pairing_process",
        "blueprint/phase-8-the-assistive-layer.md"
      ],
      "prerequisite_stage_ids": [
        "product_profile_defined"
      ],
      "live_gate_refs": []
    },
    {
      "stage_id": "ready_for_real_im1_submission",
      "stage_name": "Ready for real IM1 submission",
      "stage_group": "live",
      "stage_class": "blocked_until_mvp",
      "entry_conditions": [
        "All rehearsal dossier stages are complete.",
        "Every live gate is pass.",
        "ALLOW_REAL_PROVIDER_MUTATION=true is explicitly set."
      ],
      "required_artifacts": [
        "ART_STAGE_ONE_SCAL_STUB",
        "ART_PROVIDER_ROSTER_REFRESH_EVIDENCE",
        "ART_MODEL_INTERFACE_LICENCE_PLACEHOLDERS",
        "ART_ASSURANCE_EVIDENCE_INDEX"
      ],
      "manual_checkpoints": [
        "Named approver explicitly authorises real submission against a current environment target."
      ],
      "browser_automation_possible": "partial",
      "mock_now_action": "Stay fail-closed and show why the product is not yet admissible for real submission.",
      "actual_later_action": "Open the later dry-run harness only after the gates pass and an approver confirms mutation.",
      "outputs": [
        "Final live-gate verdict",
        "Dry-run manifest"
      ],
      "safety_and_privacy_dependencies": [
        "RISK_EXT_IM1_SCAL_DELAY",
        "RISK_MUTATION_003",
        "HZ_WRONG_PATIENT_BINDING"
      ],
      "risk_refs": [
        "RISK_EXT_IM1_SCAL_DELAY",
        "RISK_MUTATION_003",
        "HZ_WRONG_PATIENT_BINDING"
      ],
      "notes": "Current state is intentionally blocked because Phase 0 and external-readiness gates are still withheld.",
      "source_refs": [
        "prompt/026.md",
        "official_im1_pairing_process",
        "data/analysis/phase0_gate_verdict.json#GATE_P0_FOUNDATION_ENTRY"
      ],
      "prerequisite_stage_ids": [
        "product_profile_defined",
        "prerequisites_drafted",
        "stage_one_scal_stub_ready",
        "provider_supplier_targeting_ready",
        "compatibility_claim_ready",
        "model_interface_licence_placeholder_ready",
        "provider_mock_api_rehearsal_ready",
        "assurance_pack_in_progress",
        "rfc_watch_registered"
      ],
      "live_gate_refs": [
        "LIVE_GATE_EXTERNAL_FOUNDATION_WITHHELD",
        "LIVE_GATE_CREDIBLE_MVP_AND_BOUNDED_USE_CASE",
        "LIVE_GATE_PROVIDER_CAPABILITY_MODEL_FROZEN",
        "LIVE_GATE_SAFETY_PRIVACY_ARCHITECTURE_CURRENT",
        "LIVE_GATE_NAMED_SPONSOR_AND_COMMERCIAL_OWNER",
        "LIVE_GATE_IM1_NOT_PHASE2_IDENTITY_SHORTCUT",
        "LIVE_GATE_NAMED_APPROVER_PRESENT",
        "LIVE_GATE_ENVIRONMENT_TARGET_PRESENT",
        "LIVE_GATE_PROVIDER_ROSTER_REFRESH_REQUIRED",
        "LIVE_GATE_MUTATION_FLAG_ENABLED"
      ]
    },
    {
      "stage_id": "official_prerequisites_form_submitted",
      "stage_name": "Official prerequisites form submitted",
      "stage_group": "initiation",
      "stage_class": "official_process",
      "entry_conditions": [
        "The exact public form fields are populated with current approved values.",
        "The named approver and environment target are present."
      ],
      "required_artifacts": [
        "ART_PRODUCT_PROFILE_DOSSIER",
        "ART_CLINICAL_SAFETY_DECLARATION",
        "ART_PROVIDER_ROSTER_REFRESH_EVIDENCE"
      ],
      "manual_checkpoints": [
        "Human confirms the form contents before submission."
      ],
      "browser_automation_possible": "partial",
      "mock_now_action": "Dry-run only against the internal rehearsal studio.",
      "actual_later_action": "Use the gated dry-run harness and stop before final submission unless mutation is explicitly authorised.",
      "outputs": [
        "Submission draft evidence",
        "Screenshots or redacted capture evidence"
      ],
      "safety_and_privacy_dependencies": [
        "RISK_EXT_IM1_SCAL_DELAY",
        "RISK_MUTATION_003"
      ],
      "risk_refs": [
        "RISK_EXT_IM1_SCAL_DELAY",
        "RISK_MUTATION_003"
      ],
      "notes": "This stage stays unreachable in current defaults.",
      "source_refs": [
        "official_im1_prerequisites_form",
        "official_im1_pairing_process"
      ],
      "prerequisite_stage_ids": [
        "ready_for_real_im1_submission"
      ],
      "live_gate_refs": [
        "LIVE_GATE_MUTATION_FLAG_ENABLED"
      ]
    },
    {
      "stage_id": "official_stage_one_scal_issued",
      "stage_name": "Official stage-one SCAL issued",
      "stage_group": "initiation",
      "stage_class": "official_process",
      "entry_conditions": [
        "Prerequisites have been accepted by the IM1 team.",
        "The product is being assessed for compatibility against provider APIs."
      ],
      "required_artifacts": [
        "ART_STAGE_ONE_SCAL_STUB"
      ],
      "manual_checkpoints": [
        "Await IM1 team confirmation."
      ],
      "browser_automation_possible": "no",
      "mock_now_action": "Represent the stage as a blocked official checkpoint only.",
      "actual_later_action": "Track issuance date and evidence hash once the IM1 team issues stage-one SCAL.",
      "outputs": [
        "Stage-one SCAL issued by NHS England"
      ],
      "safety_and_privacy_dependencies": [
        "RISK_EXT_IM1_SCAL_DELAY"
      ],
      "risk_refs": [
        "RISK_EXT_IM1_SCAL_DELAY"
      ],
      "notes": "Issued by the external process, not by Vecells.",
      "source_refs": [
        "official_im1_pairing_process"
      ],
      "prerequisite_stage_ids": [
        "official_prerequisites_form_submitted"
      ],
      "live_gate_refs": []
    },
    {
      "stage_id": "official_product_viability_confirmed",
      "stage_name": "Official product viability confirmed",
      "stage_group": "initiation",
      "stage_class": "official_process",
      "entry_conditions": [
        "NHS England confirms the product is viable via API."
      ],
      "required_artifacts": [
        "ART_STAGE_ONE_SCAL_STUB",
        "ART_ROUTE_FAMILY_COMPATIBILITY_MATRIX"
      ],
      "manual_checkpoints": [
        "Await external viability decision."
      ],
      "browser_automation_possible": "no",
      "mock_now_action": "Track as a future checkpoint only.",
      "actual_later_action": "Record the official decision and any required scope changes.",
      "outputs": [
        "Viability confirmation or rejection"
      ],
      "safety_and_privacy_dependencies": [
        "RISK_EXT_IM1_SCAL_DELAY"
      ],
      "risk_refs": [
        "RISK_EXT_IM1_SCAL_DELAY"
      ],
      "notes": "This confirms feasibility, not assurance or live approval.",
      "source_refs": [
        "official_im1_pairing_process"
      ],
      "prerequisite_stage_ids": [
        "official_stage_one_scal_issued"
      ],
      "live_gate_refs": []
    },
    {
      "stage_id": "official_model_interface_licence_executed",
      "stage_name": "Official Model Interface Licence executed",
      "stage_group": "initiation",
      "stage_class": "provider_supplier_specific",
      "entry_conditions": [
        "Product viability is confirmed.",
        "Provider-supplier licence documents are executed by both consumer and provider suppliers."
      ],
      "required_artifacts": [
        "ART_MODEL_INTERFACE_LICENCE_PLACEHOLDERS"
      ],
      "manual_checkpoints": [
        "Provider supplier and consumer signatories execute the licence."
      ],
      "browser_automation_possible": "no",
      "mock_now_action": "Keep this as a placeholder-only register entry.",
      "actual_later_action": "Track execution state per supplier after legal completion outside the repo.",
      "outputs": [
        "Provider-specific licence execution state"
      ],
      "safety_and_privacy_dependencies": [
        "RISK_EXT_IM1_SCAL_DELAY"
      ],
      "risk_refs": [
        "RISK_EXT_IM1_SCAL_DELAY"
      ],
      "notes": "Supplier specific and human governed.",
      "source_refs": [
        "official_im1_pairing_process"
      ],
      "prerequisite_stage_ids": [
        "official_product_viability_confirmed"
      ],
      "live_gate_refs": [
        "LIVE_GATE_NAMED_SPONSOR_AND_COMMERCIAL_OWNER"
      ]
    },
    {
      "stage_id": "official_provider_mock_api_accessed",
      "stage_name": "Official provider mock API accessed",
      "stage_group": "unsupported_test",
      "stage_class": "provider_supplier_specific",
      "entry_conditions": [
        "Model Interface Licence has been executed.",
        "Provider supplier grants access to the test environment and documentation."
      ],
      "required_artifacts": [
        "ART_PROVIDER_MOCK_API_REHEARSAL_LOG",
        "ART_PAIRING_INTEGRATION_PACK_REGISTER"
      ],
      "manual_checkpoints": [
        "Provider supplier confirms credentials and environment access."
      ],
      "browser_automation_possible": "partial",
      "mock_now_action": "Only the internal rehearsal twin is available today.",
      "actual_later_action": "Track provider-specific access details in a vault-backed, non-repo register.",
      "outputs": [
        "Provider-specific unsupported-test access details"
      ],
      "safety_and_privacy_dependencies": [
        "RISK_EXT_BOOKING_PROVIDER_GAP"
      ],
      "risk_refs": [
        "RISK_EXT_BOOKING_PROVIDER_GAP"
      ],
      "notes": "Mock API access is still not live approval or canonical truth.",
      "source_refs": [
        "official_im1_pairing_process"
      ],
      "prerequisite_stage_ids": [
        "official_model_interface_licence_executed"
      ],
      "live_gate_refs": []
    },
    {
      "stage_id": "official_supported_test_environment_requested",
      "stage_name": "Official Supported Test Environment requested",
      "stage_group": "supported_test",
      "stage_class": "official_process",
      "entry_conditions": [
        "Development is complete.",
        "The full SCAL is complete and can be submitted."
      ],
      "required_artifacts": [
        "ART_SUPPORTED_TEST_REQUEST_CHECKLIST",
        "ART_ASSURANCE_EVIDENCE_INDEX"
      ],
      "manual_checkpoints": [
        "Human confirms STE request contents and provider alignment."
      ],
      "browser_automation_possible": "partial",
      "mock_now_action": "Display the step as blocked with current blocker chips.",
      "actual_later_action": "Submit the STE request only once the pack turns green.",
      "outputs": [
        "STE request prepared or submitted"
      ],
      "safety_and_privacy_dependencies": [
        "RISK_EXT_IM1_SCAL_DELAY",
        "HZ_WRONG_PATIENT_BINDING"
      ],
      "risk_refs": [
        "RISK_EXT_IM1_SCAL_DELAY",
        "HZ_WRONG_PATIENT_BINDING"
      ],
      "notes": "Submitting a full SCAL is the official prerequisite to STE access.",
      "source_refs": [
        "official_im1_pairing_process"
      ],
      "prerequisite_stage_ids": [
        "official_provider_mock_api_accessed"
      ],
      "live_gate_refs": [
        "LIVE_GATE_PROVIDER_CAPABILITY_MODEL_FROZEN",
        "LIVE_GATE_SAFETY_PRIVACY_ARCHITECTURE_CURRENT"
      ]
    },
    {
      "stage_id": "official_supported_test_environment_granted",
      "stage_name": "Official Supported Test Environment granted",
      "stage_group": "supported_test",
      "stage_class": "provider_supplier_specific",
      "entry_conditions": [
        "Provider supplier grants STE access.",
        "Assurance approach is agreed with the provider supplier."
      ],
      "required_artifacts": [
        "ART_SUPPORTED_TEST_REQUEST_CHECKLIST"
      ],
      "manual_checkpoints": [
        "Provider supplier confirms STE access and assurance path."
      ],
      "browser_automation_possible": "no",
      "mock_now_action": "Keep the state blocked and documentary only.",
      "actual_later_action": "Capture the granted environment details outside the repo and update the evidence index.",
      "outputs": [
        "STE access grant",
        "Provider assurance approach"
      ],
      "safety_and_privacy_dependencies": [
        "RISK_EXT_IM1_SCAL_DELAY"
      ],
      "risk_refs": [
        "RISK_EXT_IM1_SCAL_DELAY"
      ],
      "notes": "Provider supplier specific and not directly automatable from the repo.",
      "source_refs": [
        "official_im1_pairing_process"
      ],
      "prerequisite_stage_ids": [
        "official_supported_test_environment_requested"
      ],
      "live_gate_refs": []
    },
    {
      "stage_id": "official_assurance_completed",
      "stage_name": "Official assurance completed",
      "stage_group": "assurance",
      "stage_class": "official_process",
      "entry_conditions": [
        "SCAL is reviewed and agreed.",
        "Test evidence is agreed or witness test is undertaken."
      ],
      "required_artifacts": [
        "ART_ASSURANCE_EVIDENCE_INDEX",
        "ART_HAZARD_LOG",
        "ART_DPIA_AND_PRIVACY_NOTICE"
      ],
      "manual_checkpoints": [
        "NHS England assurance acceptance is recorded."
      ],
      "browser_automation_possible": "no",
      "mock_now_action": "Track as a blocked external checkpoint.",
      "actual_later_action": "Update the assurance evidence pack and acceptance state after external review.",
      "outputs": [
        "Recommended to Connect",
        "Plan to Connect",
        "Model Interface Licence uplift state"
      ],
      "safety_and_privacy_dependencies": [
        "RISK_EXT_IM1_SCAL_DELAY",
        "RISK_MUTATION_003"
      ],
      "risk_refs": [
        "RISK_EXT_IM1_SCAL_DELAY",
        "RISK_MUTATION_003"
      ],
      "notes": "Assurance completion is where RTC and PTC appear in the official flow.",
      "source_refs": [
        "official_im1_pairing_process"
      ],
      "prerequisite_stage_ids": [
        "official_supported_test_environment_granted"
      ],
      "live_gate_refs": []
    },
    {
      "stage_id": "official_live_rollout_authorised",
      "stage_name": "Official live rollout authorised",
      "stage_group": "live",
      "stage_class": "official_process",
      "entry_conditions": [
        "Assurance is accepted by NHS England.",
        "Provider supplier issues Plan to Connect."
      ],
      "required_artifacts": [
        "ART_ASSURANCE_EVIDENCE_INDEX",
        "ART_MODEL_INTERFACE_LICENCE_PLACEHOLDERS"
      ],
      "manual_checkpoints": [
        "Consumer and provider agree the rollout window."
      ],
      "browser_automation_possible": "no",
      "mock_now_action": "Not reachable in the rehearsal studio.",
      "actual_later_action": "Track rollout by supplier and organisation after official approvals land.",
      "outputs": [
        "Live rollout authorisation",
        "Assured licence uplift"
      ],
      "safety_and_privacy_dependencies": [
        "RISK_EXT_IM1_SCAL_DELAY",
        "RISK_EXT_BOOKING_PROVIDER_GAP"
      ],
      "risk_refs": [
        "RISK_EXT_IM1_SCAL_DELAY",
        "RISK_EXT_BOOKING_PROVIDER_GAP"
      ],
      "notes": "Live rollout remains later and explicitly outside current baseline execution.",
      "source_refs": [
        "official_im1_pairing_process"
      ],
      "prerequisite_stage_ids": [
        "official_assurance_completed"
      ],
      "live_gate_refs": []
    },
    {
      "stage_id": "official_rfc_submitted_for_significant_change",
      "stage_name": "Official RFC submitted for significant change",
      "stage_group": "rfc_watch",
      "stage_class": "official_process",
      "entry_conditions": [
        "The product has evolved from the originally assured IM1 use case.",
        "Updated SCAL and documentation are available."
      ],
      "required_artifacts": [
        "ART_RFC_TRIGGER_REGISTER",
        "ART_STAGE_ONE_SCAL_STUB",
        "ART_HAZARD_LOG"
      ],
      "manual_checkpoints": [
        "Human determines that the change class is material enough to require RFC."
      ],
      "browser_automation_possible": "partial",
      "mock_now_action": "Surface the trigger classes and associated documentation deltas.",
      "actual_later_action": "Submit the RFC via the customer service portal only after the updated pack is current and mutation is authorised.",
      "outputs": [
        "RFC packet",
        "Updated SCAL and documentation"
      ],
      "safety_and_privacy_dependencies": [
        "RISK_MUTATION_003",
        "RISK_RUNTIME_001"
      ],
      "risk_refs": [
        "RISK_MUTATION_003",
        "RISK_RUNTIME_001"
      ],
      "notes": "AI or other major feature expansion is explicitly fenced here.",
      "source_refs": [
        "official_im1_pairing_process",
        "blueprint/phase-8-the-assistive-layer.md"
      ],
      "prerequisite_stage_ids": [
        "official_live_rollout_authorised"
      ],
      "live_gate_refs": [
        "LIVE_GATE_MUTATION_FLAG_ENABLED"
      ]
    }
  ],
  "provider_register": {
    "task_id": "seq_026",
    "visual_mode": "Interface_Proof_Atelier",
    "generated_at": "2026-04-09T17:58:18.704403+00:00",
    "providers": [
      {
        "provider_supplier_id": "ps_optum_emisweb",
        "provider_supplier_name": "Optum (EMISWeb)",
        "supplier_code": "OPTUM_EMISWEB",
        "current_public_status": "listed_on_im1_pairing_page_2026_04_09",
        "targeted_for_vecells": true,
        "roster_source_url": "https://digital.nhs.uk/services/digital-services-for-integrated-care/im1-pairing-integration",
        "notes": [
          "Current official pairing page names Optum (EMISWeb) as one of the 2 existing provider suppliers.",
          "Appointments details may depend on provider-specific PIPs and cannot be assumed generically."
        ],
        "source_refs": [
          "official_im1_pairing_process",
          "official_im1_api_standards"
        ]
      },
      {
        "provider_supplier_id": "ps_tpp_systmone",
        "provider_supplier_name": "TPP (SystmOne)",
        "supplier_code": "TPP_SYSTMONE",
        "current_public_status": "listed_on_im1_pairing_page_2026_04_09",
        "targeted_for_vecells": true,
        "roster_source_url": "https://digital.nhs.uk/services/digital-services-for-integrated-care/im1-pairing-integration",
        "notes": [
          "Current official pairing page names TPP (SystmOne) as one of the 2 existing provider suppliers.",
          "Supplier-specific appointment and booking behavior still has to be evidenced through capability and PIP review."
        ],
        "source_refs": [
          "official_im1_pairing_process",
          "official_im1_api_standards"
        ]
      }
    ],
    "route_family_matrix": [
      {
        "compatibility_row_id": "cmp_intake_optum",
        "provider_supplier_id": "ps_optum_emisweb",
        "route_family_id": "rf_intake_self_service",
        "route_family_name": "Intake / self-service form (derived)",
        "gateway_surface_name": "Patient intake entry gateway",
        "im1_role": "not_required",
        "current_mock_position": "rehearse IM1 disclaimer only",
        "actual_later_position": "do not widen IM1 into public intake",
        "capability_note": "Public intake remains independent of IM1 so the product never makes pairing a hidden baseline gate.",
        "truth_guardrail": "Intake capture and submit remain canonical without IM1.",
        "source_refs": [
          "blueprint/phase-2-the-identity-and-echoes.md#Rule 5: keep IM1 out of the critical path for this phase"
        ]
      },
      {
        "compatibility_row_id": "cmp_intake_tpp",
        "provider_supplier_id": "ps_tpp_systmone",
        "route_family_id": "rf_intake_self_service",
        "route_family_name": "Intake / self-service form (derived)",
        "gateway_surface_name": "Patient intake entry gateway",
        "im1_role": "not_required",
        "current_mock_position": "rehearse IM1 disclaimer only",
        "actual_later_position": "do not widen IM1 into public intake",
        "capability_note": "Public intake remains independent of IM1 so the product never makes pairing a hidden baseline gate.",
        "truth_guardrail": "Intake capture and submit remain canonical without IM1.",
        "source_refs": [
          "blueprint/phase-2-the-identity-and-echoes.md#Rule 5: keep IM1 out of the critical path for this phase"
        ]
      },
      {
        "compatibility_row_id": "cmp_recovery_optum",
        "provider_supplier_id": "ps_optum_emisweb",
        "route_family_id": "rf_patient_secure_link_recovery",
        "route_family_name": "Secure-link recovery and claim resume (derived)",
        "gateway_surface_name": "Secure-link recovery and claim resume gateway",
        "im1_role": "not_required",
        "current_mock_position": "show explicit recovery independence",
        "actual_later_position": "keep grant recovery and claim resume outside IM1 authority",
        "capability_note": "Grant-scoped recovery must survive without IM1-backed writable authority.",
        "truth_guardrail": "IM1 is never a shortcut to patient ownership or grant redemption.",
        "source_refs": [
          "blueprint/phase-2-the-identity-and-echoes.md#Rule 5: keep IM1 out of the critical path for this phase"
        ]
      },
      {
        "compatibility_row_id": "cmp_recovery_tpp",
        "provider_supplier_id": "ps_tpp_systmone",
        "route_family_id": "rf_patient_secure_link_recovery",
        "route_family_name": "Secure-link recovery and claim resume (derived)",
        "gateway_surface_name": "Secure-link recovery and claim resume gateway",
        "im1_role": "not_required",
        "current_mock_position": "show explicit recovery independence",
        "actual_later_position": "keep grant recovery and claim resume outside IM1 authority",
        "capability_note": "Grant-scoped recovery must survive without IM1-backed writable authority.",
        "truth_guardrail": "IM1 is never a shortcut to patient ownership or grant redemption.",
        "source_refs": [
          "blueprint/phase-2-the-identity-and-echoes.md#Rule 5: keep IM1 out of the critical path for this phase"
        ]
      },
      {
        "compatibility_row_id": "cmp_home_optum",
        "provider_supplier_id": "ps_optum_emisweb",
        "route_family_id": "rf_patient_home",
        "route_family_name": "Home",
        "gateway_surface_name": "Patient home and spotlight gateway",
        "im1_role": "not_required",
        "current_mock_position": "show read-only independence",
        "actual_later_position": "do not claim IM1 as a patient-home authority rail",
        "capability_note": "Authenticated home remains NHS-login-governed, not IM1-governed.",
        "truth_guardrail": "Authenticated home remains NHS-login-governed and publication-governed.",
        "source_refs": [
          "blueprint/phase-2-the-identity-and-echoes.md#2B. NHS login bridge and local session engine"
        ]
      },
      {
        "compatibility_row_id": "cmp_home_tpp",
        "provider_supplier_id": "ps_tpp_systmone",
        "route_family_id": "rf_patient_home",
        "route_family_name": "Home",
        "gateway_surface_name": "Patient home and spotlight gateway",
        "im1_role": "not_required",
        "current_mock_position": "show read-only independence",
        "actual_later_position": "do not claim IM1 as a patient-home authority rail",
        "capability_note": "Authenticated home remains NHS-login-governed, not IM1-governed.",
        "truth_guardrail": "Authenticated home remains NHS-login-governed and publication-governed.",
        "source_refs": [
          "blueprint/phase-2-the-identity-and-echoes.md#2B. NHS login bridge and local session engine"
        ]
      },
      {
        "compatibility_row_id": "cmp_requests_optum",
        "provider_supplier_id": "ps_optum_emisweb",
        "route_family_id": "rf_patient_requests",
        "route_family_name": "Requests",
        "gateway_surface_name": "Request list and detail gateway",
        "im1_role": "not_required",
        "current_mock_position": "show request-tracker independence",
        "actual_later_position": "keep request tracking and more-info flows independent of IM1",
        "capability_note": "Request tracking and more-info reply stay decoupled from IM1 pairing.",
        "truth_guardrail": "Request lineage truth remains canonical without IM1.",
        "source_refs": [
          "blueprint/phase-0-the-foundation-protocol.md#5.5 Unified care conversation algorithm"
        ]
      },
      {
        "compatibility_row_id": "cmp_requests_tpp",
        "provider_supplier_id": "ps_tpp_systmone",
        "route_family_id": "rf_patient_requests",
        "route_family_name": "Requests",
        "gateway_surface_name": "Request list and detail gateway",
        "im1_role": "not_required",
        "current_mock_position": "show request-tracker independence",
        "actual_later_position": "keep request tracking and more-info flows independent of IM1",
        "capability_note": "Request tracking and more-info reply stay decoupled from IM1 pairing.",
        "truth_guardrail": "Request lineage truth remains canonical without IM1.",
        "source_refs": [
          "blueprint/phase-0-the-foundation-protocol.md#5.5 Unified care conversation algorithm"
        ]
      },
      {
        "compatibility_row_id": "cmp_appointments_optum",
        "provider_supplier_id": "ps_optum_emisweb",
        "route_family_id": "rf_patient_appointments",
        "route_family_name": "Appointments",
        "gateway_surface_name": "Appointments and manage gateway",
        "im1_role": "blocked_without_pairing",
        "current_mock_position": "simulate unsupported, pending, and ambiguous booking states locally",
        "actual_later_position": "requires paired supplier capability evidence, PIP review, licence execution, and assurance",
        "capability_note": "Patient-facing local booking is the primary IM1-sensitive route family.",
        "truth_guardrail": "No search result, queue acceptance, or provider 202 response implies booked truth.",
        "source_refs": [
          "official_im1_api_standards",
          "phase-4-the-booking-engine.md#4E. Commit path, revalidation, booking record, and compensation"
        ]
      },
      {
        "compatibility_row_id": "cmp_appointments_tpp",
        "provider_supplier_id": "ps_tpp_systmone",
        "route_family_id": "rf_patient_appointments",
        "route_family_name": "Appointments",
        "gateway_surface_name": "Appointments and manage gateway",
        "im1_role": "blocked_without_pairing",
        "current_mock_position": "simulate unsupported, pending, and ambiguous booking states locally",
        "actual_later_position": "requires paired supplier capability evidence, PIP review, licence execution, and assurance",
        "capability_note": "Patient-facing local booking is the primary IM1-sensitive route family.",
        "truth_guardrail": "No search result, queue acceptance, or provider 202 response implies booked truth.",
        "source_refs": [
          "official_im1_api_standards",
          "phase-4-the-booking-engine.md#4E. Commit path, revalidation, booking record, and compensation"
        ]
      },
      {
        "compatibility_row_id": "cmp_workspace_optum",
        "provider_supplier_id": "ps_optum_emisweb",
        "route_family_id": "rf_staff_workspace",
        "route_family_name": "/workspace, /workspace/queue/:queueKey, /workspace/task/:taskId",
        "gateway_surface_name": "Practice operations workspace gateway",
        "im1_role": "supplier_specific_review",
        "current_mock_position": "show blocked supplier reach with manual fallback and review states",
        "actual_later_position": "requires explicit provider reach proof before staff actions widen",
        "capability_note": "Operational booking work can review IM1 state but may not flatten supplier truth into canonical success.",
        "truth_guardrail": "Staff tools may review supplier posture but may not write canonical request state directly from supplier acceptance.",
        "source_refs": [
          "phase-0-the-foundation-protocol.md#1.13B BookingProviderAdapterBinding",
          "blueprint/forensic-audit-findings.md#Finding 72 - The booking commit path did not bind ambiguous supplier truth to canonical confirmation gates strongly enough"
        ]
      },
      {
        "compatibility_row_id": "cmp_workspace_tpp",
        "provider_supplier_id": "ps_tpp_systmone",
        "route_family_id": "rf_staff_workspace",
        "route_family_name": "/workspace, /workspace/queue/:queueKey, /workspace/task/:taskId",
        "gateway_surface_name": "Practice operations workspace gateway",
        "im1_role": "supplier_specific_review",
        "current_mock_position": "show blocked supplier reach with manual fallback and review states",
        "actual_later_position": "requires explicit provider reach proof before staff actions widen",
        "capability_note": "Operational booking work can review IM1 state but may not flatten supplier truth into canonical success.",
        "truth_guardrail": "Staff tools may review supplier posture but may not write canonical request state directly from supplier acceptance.",
        "source_refs": [
          "phase-0-the-foundation-protocol.md#1.13B BookingProviderAdapterBinding",
          "blueprint/forensic-audit-findings.md#Finding 72 - The booking commit path did not bind ambiguous supplier truth to canonical confirmation gates strongly enough"
        ]
      }
    ],
    "licence_register": [
      {
        "licence_row_id": "lic_optum_placeholder",
        "provider_supplier_id": "ps_optum_emisweb",
        "licence_state": "placeholder_only",
        "consumer_entity_placeholder": "VECELLS_CONSUMER_ENTITY_PLACEHOLDER",
        "provider_entity_placeholder": "OPTUM_PROVIDER_ENTITY_PLACEHOLDER",
        "consumer_signatory_role": "ROLE_COMMERCIAL_OWNER",
        "provider_signatory_role": "provider_supplier_signatory",
        "approver_role": "ROLE_GOVERNANCE_LEAD",
        "notes": "No real legal names or signatories stored in repo fixtures."
      },
      {
        "licence_row_id": "lic_tpp_placeholder",
        "provider_supplier_id": "ps_tpp_systmone",
        "licence_state": "placeholder_only",
        "consumer_entity_placeholder": "VECELLS_CONSUMER_ENTITY_PLACEHOLDER",
        "provider_entity_placeholder": "TPP_PROVIDER_ENTITY_PLACEHOLDER",
        "consumer_signatory_role": "ROLE_COMMERCIAL_OWNER",
        "provider_signatory_role": "provider_supplier_signatory",
        "approver_role": "ROLE_GOVERNANCE_LEAD",
        "notes": "No real legal names or signatories stored in repo fixtures."
      }
    ],
    "roster_refresh": {
      "roster_source_url": "https://digital.nhs.uk/services/digital-services-for-integrated-care/im1-pairing-integration",
      "known_provider_suppliers_on_capture": [
        "Optum (EMISWeb)",
        "TPP (SystmOne)"
      ],
      "fetch_rule": "The actual-provider dry-run harness must fetch the current IM1 Pairing page at runtime and confirm the provider supplier roster before preparing any real submission payload.",
      "selector_hints": {
        "provider_roster_heading": "##  IM1 live suppliers",
        "pairing_process_heading": "##  Process"
      },
      "captured_on": "2026-04-09"
    },
    "summary": {
      "provider_supplier_count": 2,
      "route_family_matrix_count": 12,
      "licence_placeholder_count": 2
    }
  },
  "live_gate_pack": {
    "task_id": "seq_026",
    "visual_mode": "Interface_Proof_Atelier",
    "generated_at": "2026-04-09T17:58:18.704598+00:00",
    "summary": {
      "live_gate_count": 10,
      "blocked_count": 7,
      "review_required_count": 2,
      "pass_count": 1,
      "current_submission_posture": "blocked"
    },
    "live_gates": [
      {
        "gate_id": "LIVE_GATE_EXTERNAL_FOUNDATION_WITHHELD",
        "gate_title": "External-readiness chain remains withheld",
        "status": "blocked",
        "reason": "Seq_020 still reports the downstream external-readiness gate as withheld.",
        "source_refs": [
          "data/analysis/phase0_gate_verdict.json#GATE_P0_FOUNDATION_ENTRY"
        ]
      },
      {
        "gate_id": "LIVE_GATE_CREDIBLE_MVP_AND_BOUNDED_USE_CASE",
        "gate_title": "Credible MVP/demo and bounded IM1 use case",
        "status": "blocked",
        "reason": "The rehearsal dossier is ready, but the pack still treats the real provider path as later and gated.",
        "source_refs": [
          "prompt/026.md",
          "docs/external/21_integration_priority_and_execution_matrix.md"
        ]
      },
      {
        "gate_id": "LIVE_GATE_PROVIDER_CAPABILITY_MODEL_FROZEN",
        "gate_title": "Provider capability model frozen enough for submission",
        "status": "review_required",
        "reason": "The capability model is defined, but supplier-path evidence and seq_036 freeze work are not complete yet.",
        "source_refs": [
          "docs/external/21_integration_priority_and_execution_matrix.md",
          "docs/external/22_provider_selection_scorecards.md"
        ]
      },
      {
        "gate_id": "LIVE_GATE_SAFETY_PRIVACY_ARCHITECTURE_CURRENT",
        "gate_title": "Safety, privacy, DPIA, architecture, and data-flow artifacts current",
        "status": "review_required",
        "reason": "Current artifacts exist, but the IM1-specific evidence bundle still needs later approval freshness.",
        "source_refs": [
          "official_scal_process",
          "official_im1_pairing_process"
        ]
      },
      {
        "gate_id": "LIVE_GATE_NAMED_SPONSOR_AND_COMMERCIAL_OWNER",
        "gate_title": "Named sponsor and commercial owner posture known",
        "status": "blocked",
        "reason": "The pack carries placeholders only for sponsor and commercial owner.",
        "source_refs": [
          "prompt/026.md",
          "ASSUMPTION_IM1_REAL_SUBMISSION_REMAINS_BLOCKED"
        ]
      },
      {
        "gate_id": "LIVE_GATE_IM1_NOT_PHASE2_IDENTITY_SHORTCUT",
        "gate_title": "IM1 not being used to bypass Phase 2 identity law",
        "status": "pass",
        "reason": "The pack explicitly fences IM1 away from patient ownership, grant redemption, and baseline continuity.",
        "source_refs": [
          "blueprint/phase-2-the-identity-and-echoes.md#Rule 5: keep IM1 out of the critical path for this phase",
          "prompt/026.md"
        ]
      },
      {
        "gate_id": "LIVE_GATE_NAMED_APPROVER_PRESENT",
        "gate_title": "Named approver present",
        "status": "blocked",
        "reason": "The dry-run profile still uses an approver placeholder.",
        "source_refs": [
          "prompt/026.md"
        ]
      },
      {
        "gate_id": "LIVE_GATE_ENVIRONMENT_TARGET_PRESENT",
        "gate_title": "Environment target present",
        "status": "blocked",
        "reason": "The pack defaults to placeholder environment labels and requires explicit later confirmation.",
        "source_refs": [
          "prompt/026.md",
          "official_im1_pairing_process"
        ]
      },
      {
        "gate_id": "LIVE_GATE_PROVIDER_ROSTER_REFRESH_REQUIRED",
        "gate_title": "Current provider-supplier roster fetched at runtime",
        "status": "blocked",
        "reason": "The actual-provider dry-run must fetch the current official roster before any real preparation occurs.",
        "source_refs": [
          "official_im1_pairing_process"
        ]
      },
      {
        "gate_id": "LIVE_GATE_MUTATION_FLAG_ENABLED",
        "gate_title": "ALLOW_REAL_PROVIDER_MUTATION=true explicitly set",
        "status": "blocked",
        "reason": "Real provider mutation remains disabled by default.",
        "source_refs": [
          "prompt/026.md",
          "prompt/shared_operating_contract_026_to_035.md"
        ]
      }
    ],
    "selector_map": {
      "base_profile": {
        "mode_toggle_actual": "[data-testid='mode-toggle-actual']",
        "page_tab_prerequisites": "[data-testid='page-tab-Prerequisites_Dossier']",
        "page_tab_licence": "[data-testid='page-tab-Licence_and_RFC_Watch']",
        "evidence_drawer": "[data-testid='evidence-drawer']",
        "redaction_notice": "[data-testid='redaction-notice']",
        "provider_matrix_first_row": "[data-testid='provider-matrix-row-cmp_appointments_optum']",
        "field_mvp_evidence_url": "[data-testid='actual-field-mvp-evidence-url']",
        "field_sponsor_name": "[data-testid='actual-field-sponsor-name']",
        "field_commercial_owner": "[data-testid='actual-field-commercial-owner']",
        "field_named_approver": "[data-testid='actual-field-named-approver']",
        "field_environment_target": "[data-testid='actual-field-environment-target']",
        "field_allow_mutation": "[data-testid='actual-field-allow-mutation']",
        "refresh_provider_roster": "[data-testid='refresh-provider-roster']",
        "final_submit": "[data-testid='dry-run-submit']"
      }
    },
    "dry_run_defaults": {
      "default_target_url": "http://127.0.0.1:4175/?mode=actual&page=Prerequisites_Dossier",
      "allow_real_provider_mutation": false,
      "default_selector_profile": "base_profile"
    },
    "runtime_roster_refresh": {
      "url": "https://digital.nhs.uk/services/digital-services-for-integrated-care/im1-pairing-integration",
      "expected_provider_suppliers": [
        "Optum (EMISWeb)",
        "TPP (SystmOne)"
      ],
      "required_before_real_submission": true
    },
    "required_env": [
      "IM1_NAMED_APPROVER",
      "IM1_ENVIRONMENT_TARGET",
      "IM1_SPONSOR_NAME",
      "IM1_COMMERCIAL_OWNER",
      "ALLOW_REAL_PROVIDER_MUTATION"
    ]
  },
  "rfc_watch": [
    {
      "watch_id": "RFC_AI_EXPANSION",
      "change_class": "AI or assistive decision support added to an assured IM1 flow",
      "rfc_required": true,
      "required_delta": "Updated SCAL, hazard log, DPIA, and model/supplier assurance documentation.",
      "reason": "Official IM1 guidance names AI and significant functional enhancements as explicit RFC triggers.",
      "source_refs": [
        "official_im1_pairing_process",
        "blueprint/phase-8-the-assistive-layer.md"
      ]
    },
    {
      "watch_id": "RFC_ROUTE_FAMILY_WIDEN",
      "change_class": "New patient or staff route family begins using the assured IM1 capability set",
      "rfc_required": true,
      "required_delta": "Updated route-family matrix, capability digest, and booking-truth guardrail statement.",
      "reason": "Route widening changes the assured use case and can invalidate earlier pairing posture.",
      "source_refs": [
        "official_im1_pairing_process",
        "phase-4-the-booking-engine.md#4B. Provider capability matrix and adapter seam"
      ]
    },
    {
      "watch_id": "RFC_NEW_PROVIDER_SUPPLIER",
      "change_class": "A new provider supplier or foundation supplier is targeted",
      "rfc_required": true,
      "required_delta": "Refreshed roster evidence, supplier-specific compatibility review, and updated licence register.",
      "reason": "Supplier-specific pairing posture cannot be inferred from an earlier supplier.",
      "source_refs": [
        "official_im1_pairing_process",
        "official_im1_api_standards"
      ]
    },
    {
      "watch_id": "RFC_MUTATION_SCOPE_WIDEN",
      "change_class": "Writable booking or manage actions widen beyond the earlier assured surface",
      "rfc_required": true,
      "required_delta": "Updated BookingProviderAdapterBinding evidence, control-plane proof, and degraded-mode review.",
      "reason": "Widening mutable scope changes truth, safety, and rollback semantics.",
      "source_refs": [
        "official_im1_pairing_process",
        "phase-4-the-booking-engine.md#4E. Commit path, revalidation, booking record, and compensation"
      ]
    },
    {
      "watch_id": "RFC_SAMD_BOUNDARY_CHANGE",
      "change_class": "Medical-device or SaMD boundary changes",
      "rfc_required": true,
      "required_delta": "Updated clinical safety case, hazard log, and regulatory evidence.",
      "reason": "The public prerequisites form explicitly calls out added scrutiny for software as a medical device.",
      "source_refs": [
        "official_im1_prerequisites_form",
        "official_im1_pairing_process"
      ]
    },
    {
      "watch_id": "RFC_DATA_FLOW_OR_SUBPROCESSOR_CHANGE",
      "change_class": "New patient-data processing path, UK processing statement change, or material subprocessor change",
      "rfc_required": true,
      "required_delta": "Updated DPIA, privacy notice, DSPT/ISMS posture, and residency statement.",
      "reason": "Changes to the information-governance pack can invalidate the earlier assured posture.",
      "source_refs": [
        "official_im1_prerequisites_form",
        "official_scal_process"
      ]
    },
    {
      "watch_id": "RFC_NO_CHANGE",
      "change_class": "Documentation refresh only with no use-case or functional change",
      "rfc_required": false,
      "required_delta": "Refresh the evidence index only.",
      "reason": "Not every evidence refresh is an RFC, but freshness must still be tracked.",
      "source_refs": [
        "official_im1_pairing_process"
      ]
    }
  ],
  "risk_digest": [
    {
      "risk_id": "HZ_WRONG_PATIENT_BINDING",
      "risk_title": "Wrong-patient binding or correction failure",
      "status": "mitigating",
      "owner_role": "ROLE_MANUFACTURER_CSO"
    },
    {
      "risk_id": "RISK_EXT_BOOKING_PROVIDER_GAP",
      "risk_title": "Booking supplier capability evidence remains ambiguous too late in the programme",
      "status": "watching",
      "owner_role": "ROLE_BOOKING_DOMAIN_LEAD"
    },
    {
      "risk_id": "RISK_EXT_IM1_SCAL_DELAY",
      "risk_title": "IM1 and SCAL readiness lag blocks Phase 0 assurance merge and later booking reach",
      "status": "open",
      "owner_role": "ROLE_INTEROPERABILITY_LEAD"
    },
    {
      "risk_id": "RISK_MUTATION_003",
      "risk_title": "CommandSettlementRecord is the authoritative outcome for visible mutation state",
      "status": "watching",
      "owner_role": "ROLE_RELEASE_MANAGER"
    },
    {
      "risk_id": "RISK_RUNTIME_001",
      "risk_title": "RuntimePublicationBundle and DesignContractPublicationBundle publish one coherent surface tuple",
      "status": "watching",
      "owner_role": "ROLE_RELEASE_MANAGER"
    }
  ]
} as const;
