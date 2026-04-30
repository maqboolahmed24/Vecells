export const siteLinkPack = {
  "task_id": "seq_030",
  "generated_at": "2026-04-09T20:18:54+00:00",
  "captured_on": "2026-04-09",
  "visual_mode": "Linkloom_Metadata_Studio",
  "mission": "Create the NHS App site-link metadata execution pack with one rehearsal-grade placeholder generator now and one gated environment-specific registration strategy later, while keeping site links bound to route families, continuity law, and safe return.",
  "source_precedence": [
    "prompt/030.md",
    "prompt/029.md",
    "prompt/shared_operating_contract_026_to_035.md",
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "blueprint/phase-0-the-foundation-protocol.md#1.43 OutboundNavigationGrant",
    "blueprint/phase-0-the-foundation-protocol.md#40A Patient route entry, refresh, back-forward restore, deep-link resolution, step-up return, and recovery resume",
    "blueprint/phase-2-the-identity-and-echoes.md",
    "blueprint/phase-7-inside-the-nhs-app.md#7D. Deep links, site links, and return-to-journey continuity",
    "blueprint/phase-7-inside-the-nhs-app.md#7E. NHS App bridge API, navigation model, and embedded behaviours",
    "blueprint/phase-7-inside-the-nhs-app.md#7F. Webview limitations, file handling, and resilient error UX",
    "blueprint/platform-frontend-blueprint.md#OutboundNavigationGrant",
    "blueprint/patient-portal-experience-architecture-blueprint.md#1. Shell and route map",
    "blueprint/patient-account-and-communications-blueprint.md",
    "blueprint/accessibility-and-content-system-contract.md",
    "blueprint/forensic-audit-findings.md#Finding 90 - The audit still omitted the hardened NHS App embedded-channel control plane",
    "blueprint/forensic-audit-findings.md#Finding 120 - Patient-facing degraded mode could still fragment across entry, section, recovery, embedded, and artifact shells",
    "docs/architecture/04_audience_surface_inventory.md",
    "docs/architecture/14_shell_and_route_runtime_architecture.md",
    "docs/architecture/14_gateway_bff_pattern_and_surface_split.md",
    "docs/external/29_nhs_app_onboarding_strategy.md",
    "https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/nhs-app-web-integration",
    "https://nhsconnect.github.io/nhsapp-developer-documentation/web-integration-overview/",
    "https://nhsconnect.github.io/nhsapp-developer-documentation/web-integration-guidance/",
    "https://nhsconnect.github.io/nhsapp-developer-documentation/js-v2-api-specification/"
  ],
  "official_guidance": [
    {
      "source_id": "official_nhs_app_web_integration",
      "title": "NHS App web integration",
      "url": "https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/nhs-app-web-integration",
      "captured_on": "2026-04-09",
      "summary": "The NHS App process page remains the external owner for onboarding, environment progression, and change coordination. Site-link registration belongs inside that later onboarding lane rather than as a stand-alone shortcut.",
      "grounding": [
        "NHS App integration remains a managed onboarding path rather than an ad hoc supplier-side toggle.",
        "Environment progression still sits behind product review, design, sandpit, AOS, and later release gates.",
        "Channel rollout remains later and coordinated with the NHS App team."
      ]
    },
    {
      "source_id": "official_web_integration_overview",
      "title": "Web Integration Overview",
      "url": "https://nhsconnect.github.io/nhsapp-developer-documentation/web-integration-overview/",
      "captured_on": "2026-04-09",
      "summary": "The overview page confirms that supplier journeys run inside a tailored NHS App webview with NHS App-managed jump-off points rather than a separate supplier-owned app.",
      "grounding": [
        "NHS App jump-off points remain coordinated with the onboarding team.",
        "Supplier journeys stay web-based and embedded rather than becoming a second mobile product."
      ]
    },
    {
      "source_id": "official_web_integration_guidance",
      "title": "Web Integration Guidance",
      "url": "https://nhsconnect.github.io/nhsapp-developer-documentation/web-integration-guidance/",
      "captured_on": "2026-04-09",
      "summary": "The guidance page is the current source for supplier-side site-link mechanics and embedded traffic hints, including `from=nhsApp`, `assetlinks.json`, `apple-app-site-association`, and NHS App team-supplied environment values.",
      "grounding": [
        "Traffic hints like `from=nhsApp` are guidance for styling and recognition, not standalone trust proof.",
        "Suppliers can enable links from SMS or email to open in NHS App through site links, but changes are required on both sides and must be coordinated with the onboarding team.",
        "Android requires `/.well-known/assetlinks.json` with environment-specific package name and certificate fingerprint supplied by the NHS App team.",
        "iOS requires `/.well-known/apple-app-site-association` with environment-specific `appID` and an explicit path list.",
        "Conventional file download does not work in the webview and browser print is not supported, so raw artifact URLs are not safe site-link targets."
      ]
    },
    {
      "source_id": "official_js_api_v2",
      "title": "Javascript API v2 Specification",
      "url": "https://nhsconnect.github.io/nhsapp-developer-documentation/js-v2-api-specification/",
      "captured_on": "2026-04-09",
      "summary": "The JS API v2 spec defines the embedded navigation and byte-delivery bridge, which shapes which linked routes are safe once the site link resolves into the embedded shell.",
      "grounding": [
        "The current JS API exposes `goToPage`, `openBrowserOverlay`, `openExternalBrowser`, and `downloadFromBytes`.",
        "The embedded route still needs bridge capability and safe-return proof after the site link lands.",
        "The JS API should be loaded inline from the NHS App environment rather than bundled into the client."
      ]
    }
  ],
  "upstream_inputs": {
    "phase0_entry_verdict": "withheld",
    "phase0_planning_readiness": "ready_for_external_readiness",
    "seq_029_task_id": "seq_029",
    "seq_029_live_gate_verdict": "blocked"
  },
  "summary": {
    "route_count": 18,
    "approved_count": 7,
    "conditional_count": 8,
    "rejected_count": 3,
    "environment_count": 4,
    "live_gate_count": 9,
    "default_ios_path_count": 11
  },
  "environment_profiles": [
    {
      "env_id": "local_mock",
      "label": "Local mock",
      "registration_stage": "rehearsal_only",
      "actual_registration_allowed": false,
      "official_values_supplied": false,
      "values_source": "placeholder_only",
      "served_origin": "http://127.0.0.1:4181",
      "domain_placeholder": "links.local.service.test",
      "host_status": "local_preview_only",
      "host_notes": "Local hosting proves path shape and asset structure only; it does not prove production DNS or certificate posture.",
      "android_package_name": "__NHS_APP_ANDROID_PACKAGE_LOCAL_MOCK__",
      "android_cert_fingerprints": [
        "__NHS_APP_ANDROID_SHA256_LOCAL_MOCK__"
      ],
      "ios_app_id": "__NHS_APP_IOS_APP_ID_LOCAL_MOCK__",
      "android_relation": "delegate_permission/common.handle_all_urls",
      "cache_control": "public, max-age=60, must-revalidate",
      "content_type_requirement": "application/json",
      "supplied_by": "Service placeholder generator only",
      "notes": "Used for local `.well-known` hosting validation and UI rehearsal."
    },
    {
      "env_id": "sandpit_like",
      "label": "Sandpit-like",
      "registration_stage": "sandpit",
      "actual_registration_allowed": false,
      "official_values_supplied": false,
      "values_source": "awaiting_nhs_app_team",
      "served_origin": "https://links-sandpit.service.example",
      "domain_placeholder": "links-sandpit.service.example",
      "host_status": "placeholder_only",
      "host_notes": "The real host must be owned, approved, and coordinated with the onboarding team before registration.",
      "android_package_name": "__NHS_APP_ANDROID_PACKAGE_SANDPIT__",
      "android_cert_fingerprints": [
        "__NHS_APP_ANDROID_SHA256_SANDPIT__"
      ],
      "ios_app_id": "__NHS_APP_IOS_APP_ID_SANDPIT__",
      "android_relation": "delegate_permission/common.handle_all_urls",
      "cache_control": "public, max-age=300, must-revalidate",
      "content_type_requirement": "application/json",
      "supplied_by": "NHS App onboarding team",
      "notes": "The first real environment where the NHS App team-supplied values become mandatory."
    },
    {
      "env_id": "aos_like",
      "label": "AOS-like",
      "registration_stage": "aos",
      "actual_registration_allowed": false,
      "official_values_supplied": false,
      "values_source": "awaiting_nhs_app_team",
      "served_origin": "https://links-aos.service.example",
      "domain_placeholder": "links-aos.service.example",
      "host_status": "placeholder_only",
      "host_notes": "AOS remains blocked until sandpit evidence and environment-specific values are current.",
      "android_package_name": "__NHS_APP_ANDROID_PACKAGE_AOS__",
      "android_cert_fingerprints": [
        "__NHS_APP_ANDROID_SHA256_AOS__"
      ],
      "ios_app_id": "__NHS_APP_IOS_APP_ID_AOS__",
      "android_relation": "delegate_permission/common.handle_all_urls",
      "cache_control": "public, max-age=300, must-revalidate",
      "content_type_requirement": "application/json",
      "supplied_by": "NHS App onboarding team",
      "notes": "AOS should reuse the same path discipline while carrying different official mobile values."
    },
    {
      "env_id": "live_placeholder",
      "label": "Live placeholder",
      "registration_stage": "live",
      "actual_registration_allowed": false,
      "official_values_supplied": false,
      "values_source": "awaiting_nhs_app_team",
      "served_origin": "https://links.service.example",
      "domain_placeholder": "links.service.example",
      "host_status": "placeholder_only",
      "host_notes": "Production registration stays blocked until limited-release readiness, domain ownership proof, and official values all line up.",
      "android_package_name": "__NHS_APP_ANDROID_PACKAGE_LIVE__",
      "android_cert_fingerprints": [
        "__NHS_APP_ANDROID_SHA256_LIVE__"
      ],
      "ios_app_id": "__NHS_APP_IOS_APP_ID_LIVE__",
      "android_relation": "delegate_permission/common.handle_all_urls",
      "cache_control": "public, max-age=600, must-revalidate",
      "content_type_requirement": "application/json",
      "supplied_by": "NHS App onboarding team",
      "notes": "The placeholder profile exists so final hosting and review can be prepared without claiming live values are already known."
    }
  ],
  "route_allowlist": [
    {
      "path_id": "sl_start_request",
      "allowlist_decision": "approved",
      "route_family_ref": "rf_intake_self_service",
      "route_family_label": "Intake / self-service form (derived)",
      "path_pattern": "/start-request",
      "patient_visible_purpose": "Start a new request in the same portal without inventing a second NHS App-only intake flow.",
      "embedded_safe": "yes",
      "requires_outbound_navigation_grant": "no",
      "requires_authenticated_session": "no",
      "allows_secure_link_entry": "no",
      "allows_from_nhs_app_query_marker": "yes",
      "placeholder_in_mock": "yes",
      "include_by_default": true,
      "ios_path_pattern": "/start-request",
      "selected_anchor_ref": "start_request_cta",
      "return_contract_ref": "PatientNavReturnContract(intake_entry)",
      "real_registration_gate_refs": [
        "LIVE_GATE_PHASE7_SCOPE_WINDOW",
        "LIVE_GATE_ENVIRONMENT_VALUES_SUPPLIED",
        "LIVE_GATE_PATH_ALLOWLIST_APPROVED"
      ],
      "source_refs": [
        "docs/external/29_nhs_app_onboarding_strategy.md",
        "blueprint/phase-7-inside-the-nhs-app.md#7D. Deep links, site links, and return-to-journey continuity"
      ],
      "notes": "Derived stable entry path for the rehearsal studio; no patient-specific data belongs in the URL."
    },
    {
      "path_id": "sl_secure_recovery",
      "allowlist_decision": "approved",
      "route_family_ref": "rf_patient_secure_link_recovery",
      "route_family_label": "Secure-link recovery and claim resume (derived)",
      "path_pattern": "/recovery/:recoveryToken",
      "patient_visible_purpose": "Resume a specific lineage from a secure continuation link while preserving same-shell recovery.",
      "embedded_safe": "conditional",
      "requires_outbound_navigation_grant": "no",
      "requires_authenticated_session": "no",
      "allows_secure_link_entry": "yes",
      "allows_from_nhs_app_query_marker": "yes",
      "placeholder_in_mock": "yes",
      "include_by_default": true,
      "ios_path_pattern": "/recovery/*",
      "selected_anchor_ref": "recovery_resume_banner",
      "return_contract_ref": "PatientNavReturnContract(recovery_resume)",
      "real_registration_gate_refs": [
        "LIVE_GATE_PHASE7_SCOPE_WINDOW",
        "LIVE_GATE_ENVIRONMENT_VALUES_SUPPLIED",
        "LIVE_GATE_PATH_ALLOWLIST_APPROVED",
        "LIVE_GATE_CONTINUITY_EVIDENCE_CURRENT"
      ],
      "source_refs": [
        "blueprint/patient-portal-experience-architecture-blueprint.md#1. Shell and route map",
        "blueprint/phase-7-inside-the-nhs-app.md#7D. Deep links, site links, and return-to-journey continuity"
      ],
      "notes": "The token is a grant envelope and must not be logged, copied into analytics, or treated as route truth on its own."
    },
    {
      "path_id": "sl_requests_index",
      "allowlist_decision": "approved",
      "route_family_ref": "rf_patient_requests",
      "route_family_label": "Requests",
      "path_pattern": "/requests",
      "patient_visible_purpose": "Open the patient\u2019s request list with bounded summary and same-shell request continuity.",
      "embedded_safe": "yes",
      "requires_outbound_navigation_grant": "no",
      "requires_authenticated_session": "yes",
      "allows_secure_link_entry": "no",
      "allows_from_nhs_app_query_marker": "yes",
      "placeholder_in_mock": "yes",
      "include_by_default": true,
      "ios_path_pattern": "/requests",
      "selected_anchor_ref": "request_list_primary",
      "return_contract_ref": "PatientNavReturnContract(requests_index)",
      "real_registration_gate_refs": [
        "LIVE_GATE_PHASE7_SCOPE_WINDOW",
        "LIVE_GATE_ENVIRONMENT_VALUES_SUPPLIED",
        "LIVE_GATE_PATH_ALLOWLIST_APPROVED",
        "LIVE_GATE_CONTINUITY_EVIDENCE_CURRENT"
      ],
      "source_refs": [
        "blueprint/patient-portal-experience-architecture-blueprint.md#1. Shell and route map",
        "docs/architecture/14_shell_and_route_runtime_architecture.md"
      ],
      "notes": "This is a safe summary path, not a detached action URL."
    },
    {
      "path_id": "sl_request_detail",
      "allowlist_decision": "approved",
      "route_family_ref": "rf_patient_requests",
      "route_family_label": "Requests",
      "path_pattern": "/requests/:requestId",
      "patient_visible_purpose": "Open one request detail route after auth or governed recovery.",
      "embedded_safe": "yes",
      "requires_outbound_navigation_grant": "no",
      "requires_authenticated_session": "yes",
      "allows_secure_link_entry": "no",
      "allows_from_nhs_app_query_marker": "yes",
      "placeholder_in_mock": "yes",
      "include_by_default": true,
      "ios_path_pattern": "/requests/*",
      "selected_anchor_ref": "request_detail_anchor",
      "return_contract_ref": "PatientNavReturnContract(request_detail)",
      "real_registration_gate_refs": [
        "LIVE_GATE_PHASE7_SCOPE_WINDOW",
        "LIVE_GATE_ENVIRONMENT_VALUES_SUPPLIED",
        "LIVE_GATE_PATH_ALLOWLIST_APPROVED",
        "LIVE_GATE_CONTINUITY_EVIDENCE_CURRENT"
      ],
      "source_refs": [
        "blueprint/patient-portal-experience-architecture-blueprint.md#1. Shell and route map",
        "blueprint/phase-7-inside-the-nhs-app.md#7D. Deep links, site links, and return-to-journey continuity"
      ],
      "notes": "Raw request identifiers remain placeholders in the mock and must never carry PHI-bearing query fragments."
    },
    {
      "path_id": "sl_request_conversation",
      "allowlist_decision": "conditional",
      "route_family_ref": "rf_patient_requests",
      "route_family_label": "Requests",
      "path_pattern": "/requests/:requestId/conversation",
      "patient_visible_purpose": "Resume more-info or request conversation work inside the owning request shell.",
      "embedded_safe": "conditional",
      "requires_outbound_navigation_grant": "no",
      "requires_authenticated_session": "yes",
      "allows_secure_link_entry": "no",
      "allows_from_nhs_app_query_marker": "yes",
      "placeholder_in_mock": "yes",
      "include_by_default": true,
      "ios_path_pattern": "/requests/*",
      "selected_anchor_ref": "request_conversation_anchor",
      "return_contract_ref": "PatientNavReturnContract(request_conversation)",
      "real_registration_gate_refs": [
        "LIVE_GATE_PHASE7_SCOPE_WINDOW",
        "LIVE_GATE_ENVIRONMENT_VALUES_SUPPLIED",
        "LIVE_GATE_PATH_ALLOWLIST_APPROVED",
        "LIVE_GATE_CONTINUITY_EVIDENCE_CURRENT"
      ],
      "source_refs": [
        "blueprint/patient-account-and-communications-blueprint.md",
        "blueprint/patient-portal-experience-architecture-blueprint.md#1. Shell and route map"
      ],
      "notes": "The site link may land on the owning request shell, but live reply posture still depends on the current cycle-specific projection."
    },
    {
      "path_id": "sl_appointments_index",
      "allowlist_decision": "approved",
      "route_family_ref": "rf_patient_appointments",
      "route_family_label": "Appointments",
      "path_pattern": "/appointments",
      "patient_visible_purpose": "Open the appointment list with same-shell continuity and no detached booking fork.",
      "embedded_safe": "yes",
      "requires_outbound_navigation_grant": "no",
      "requires_authenticated_session": "yes",
      "allows_secure_link_entry": "no",
      "allows_from_nhs_app_query_marker": "yes",
      "placeholder_in_mock": "yes",
      "include_by_default": true,
      "ios_path_pattern": "/appointments",
      "selected_anchor_ref": "appointment_list_primary",
      "return_contract_ref": "PatientNavReturnContract(appointments_index)",
      "real_registration_gate_refs": [
        "LIVE_GATE_PHASE7_SCOPE_WINDOW",
        "LIVE_GATE_ENVIRONMENT_VALUES_SUPPLIED",
        "LIVE_GATE_PATH_ALLOWLIST_APPROVED",
        "LIVE_GATE_CONTINUITY_EVIDENCE_CURRENT"
      ],
      "source_refs": [
        "blueprint/patient-portal-experience-architecture-blueprint.md#1. Shell and route map"
      ],
      "notes": "This is the calm summary path for booking and manage work."
    },
    {
      "path_id": "sl_appointment_manage",
      "allowlist_decision": "approved",
      "route_family_ref": "rf_patient_appointments",
      "route_family_label": "Appointments",
      "path_pattern": "/appointments/:appointmentId/manage",
      "patient_visible_purpose": "Resume appointment manage, reminder, or calendar actions within the same appointment shell.",
      "embedded_safe": "conditional",
      "requires_outbound_navigation_grant": "yes",
      "requires_authenticated_session": "yes",
      "allows_secure_link_entry": "no",
      "allows_from_nhs_app_query_marker": "yes",
      "placeholder_in_mock": "yes",
      "include_by_default": true,
      "ios_path_pattern": "/appointments/*",
      "selected_anchor_ref": "appointment_manage_panel",
      "return_contract_ref": "PatientNavReturnContract(appointment_manage)",
      "real_registration_gate_refs": [
        "LIVE_GATE_PHASE7_SCOPE_WINDOW",
        "LIVE_GATE_ENVIRONMENT_VALUES_SUPPLIED",
        "LIVE_GATE_PATH_ALLOWLIST_APPROVED",
        "LIVE_GATE_CONTINUITY_EVIDENCE_CURRENT"
      ],
      "source_refs": [
        "blueprint/patient-portal-experience-architecture-blueprint.md#1. Shell and route map",
        "blueprint/phase-7-inside-the-nhs-app.md#7E. NHS App bridge API, navigation model, and embedded behaviours"
      ],
      "notes": "Calendar or browser-handoff actions stay secondary and require the current embedded capability and return-safe grant."
    },
    {
      "path_id": "sl_booking_select",
      "allowlist_decision": "conditional",
      "route_family_ref": "rf_patient_appointments",
      "route_family_label": "Appointments",
      "path_pattern": "/bookings/:bookingCaseId/select",
      "patient_visible_purpose": "Review waitlist or alternative slot selection inside the governed booking shell.",
      "embedded_safe": "conditional",
      "requires_outbound_navigation_grant": "no",
      "requires_authenticated_session": "yes",
      "allows_secure_link_entry": "no",
      "allows_from_nhs_app_query_marker": "yes",
      "placeholder_in_mock": "yes",
      "include_by_default": true,
      "ios_path_pattern": "/bookings/*",
      "selected_anchor_ref": "booking_select_anchor",
      "return_contract_ref": "PatientNavReturnContract(booking_select)",
      "real_registration_gate_refs": [
        "LIVE_GATE_PHASE7_SCOPE_WINDOW",
        "LIVE_GATE_ENVIRONMENT_VALUES_SUPPLIED",
        "LIVE_GATE_PATH_ALLOWLIST_APPROVED",
        "LIVE_GATE_CONTINUITY_EVIDENCE_CURRENT"
      ],
      "source_refs": [
        "blueprint/patient-portal-experience-architecture-blueprint.md#1. Shell and route map",
        "blueprint/phase-4-the-booking-engine.md"
      ],
      "notes": "This placeholder path covers waitlist-offer and hub-alternative review without claiming a final mobile path taxonomy is already frozen."
    },
    {
      "path_id": "sl_booking_confirm",
      "allowlist_decision": "conditional",
      "route_family_ref": "rf_patient_appointments",
      "route_family_label": "Appointments",
      "path_pattern": "/bookings/:bookingCaseId/confirm",
      "patient_visible_purpose": "Continue confirmation inside the booking shell without exposing a direct raw accept URL.",
      "embedded_safe": "conditional",
      "requires_outbound_navigation_grant": "no",
      "requires_authenticated_session": "yes",
      "allows_secure_link_entry": "no",
      "allows_from_nhs_app_query_marker": "yes",
      "placeholder_in_mock": "yes",
      "include_by_default": true,
      "ios_path_pattern": "/bookings/*",
      "selected_anchor_ref": "booking_confirm_anchor",
      "return_contract_ref": "PatientNavReturnContract(booking_confirm)",
      "real_registration_gate_refs": [
        "LIVE_GATE_PHASE7_SCOPE_WINDOW",
        "LIVE_GATE_ENVIRONMENT_VALUES_SUPPLIED",
        "LIVE_GATE_PATH_ALLOWLIST_APPROVED",
        "LIVE_GATE_CONTINUITY_EVIDENCE_CURRENT"
      ],
      "source_refs": [
        "blueprint/patient-portal-experience-architecture-blueprint.md#1. Shell and route map",
        "blueprint/phase-4-the-booking-engine.md"
      ],
      "notes": "Confirmation remains inside the same shell and must not become an action-only deep link."
    },
    {
      "path_id": "sl_record_result",
      "allowlist_decision": "conditional",
      "route_family_ref": "rf_patient_health_record",
      "route_family_label": "Health record",
      "path_pattern": "/records/results/:resultId",
      "patient_visible_purpose": "Open a result summary route that can degrade to summary-first if byte delivery is not safe.",
      "embedded_safe": "conditional",
      "requires_outbound_navigation_grant": "yes",
      "requires_authenticated_session": "yes",
      "allows_secure_link_entry": "no",
      "allows_from_nhs_app_query_marker": "yes",
      "placeholder_in_mock": "yes",
      "include_by_default": true,
      "ios_path_pattern": "/records/results/*",
      "selected_anchor_ref": "record_result_summary",
      "return_contract_ref": "PatientNavReturnContract(record_result)",
      "real_registration_gate_refs": [
        "LIVE_GATE_PHASE7_SCOPE_WINDOW",
        "LIVE_GATE_ENVIRONMENT_VALUES_SUPPLIED",
        "LIVE_GATE_PATH_ALLOWLIST_APPROVED",
        "LIVE_GATE_CONTINUITY_EVIDENCE_CURRENT"
      ],
      "source_refs": [
        "blueprint/patient-portal-experience-architecture-blueprint.md#1. Shell and route map",
        "blueprint/platform-frontend-blueprint.md#OutboundNavigationGrant"
      ],
      "notes": "The linked route is safe; any later document handoff still needs artifact-mode truth and an outbound grant."
    },
    {
      "path_id": "sl_record_document",
      "allowlist_decision": "conditional",
      "route_family_ref": "rf_patient_health_record",
      "route_family_label": "Health record",
      "path_pattern": "/records/documents/:documentId",
      "patient_visible_purpose": "Open one document summary route inside the record shell, with byte-safe preview only when allowed.",
      "embedded_safe": "conditional",
      "requires_outbound_navigation_grant": "yes",
      "requires_authenticated_session": "yes",
      "allows_secure_link_entry": "no",
      "allows_from_nhs_app_query_marker": "yes",
      "placeholder_in_mock": "yes",
      "include_by_default": true,
      "ios_path_pattern": "/records/documents/*",
      "selected_anchor_ref": "record_document_summary",
      "return_contract_ref": "PatientNavReturnContract(record_document)",
      "real_registration_gate_refs": [
        "LIVE_GATE_PHASE7_SCOPE_WINDOW",
        "LIVE_GATE_ENVIRONMENT_VALUES_SUPPLIED",
        "LIVE_GATE_PATH_ALLOWLIST_APPROVED",
        "LIVE_GATE_CONTINUITY_EVIDENCE_CURRENT"
      ],
      "source_refs": [
        "blueprint/patient-portal-experience-architecture-blueprint.md#1. Shell and route map",
        "blueprint/patient-account-and-communications-blueprint.md"
      ],
      "notes": "Structured same-shell summary is the default; raw file or print exits remain secondary and governed."
    },
    {
      "path_id": "sl_messages_cluster",
      "allowlist_decision": "approved",
      "route_family_ref": "rf_patient_messages",
      "route_family_label": "Messages",
      "path_pattern": "/messages/:clusterId",
      "patient_visible_purpose": "Open a message cluster summary with bounded reply and callback continuity.",
      "embedded_safe": "yes",
      "requires_outbound_navigation_grant": "no",
      "requires_authenticated_session": "yes",
      "allows_secure_link_entry": "no",
      "allows_from_nhs_app_query_marker": "yes",
      "placeholder_in_mock": "yes",
      "include_by_default": true,
      "ios_path_pattern": "/messages/*",
      "selected_anchor_ref": "message_cluster_anchor",
      "return_contract_ref": "PatientNavReturnContract(messages_cluster)",
      "real_registration_gate_refs": [
        "LIVE_GATE_PHASE7_SCOPE_WINDOW",
        "LIVE_GATE_ENVIRONMENT_VALUES_SUPPLIED",
        "LIVE_GATE_PATH_ALLOWLIST_APPROVED",
        "LIVE_GATE_CONTINUITY_EVIDENCE_CURRENT"
      ],
      "source_refs": [
        "blueprint/patient-portal-experience-architecture-blueprint.md#1. Shell and route map"
      ],
      "notes": "Cluster-level entry preserves the owning conversation shell."
    },
    {
      "path_id": "sl_message_thread",
      "allowlist_decision": "conditional",
      "route_family_ref": "rf_patient_messages",
      "route_family_label": "Messages",
      "path_pattern": "/messages/:clusterId/thread/:threadId",
      "patient_visible_purpose": "Resume a specific thread inside the owning message cluster shell.",
      "embedded_safe": "conditional",
      "requires_outbound_navigation_grant": "no",
      "requires_authenticated_session": "yes",
      "allows_secure_link_entry": "no",
      "allows_from_nhs_app_query_marker": "yes",
      "placeholder_in_mock": "yes",
      "include_by_default": true,
      "ios_path_pattern": "/messages/*",
      "selected_anchor_ref": "message_thread_anchor",
      "return_contract_ref": "PatientNavReturnContract(message_thread)",
      "real_registration_gate_refs": [
        "LIVE_GATE_PHASE7_SCOPE_WINDOW",
        "LIVE_GATE_ENVIRONMENT_VALUES_SUPPLIED",
        "LIVE_GATE_PATH_ALLOWLIST_APPROVED",
        "LIVE_GATE_CONTINUITY_EVIDENCE_CURRENT"
      ],
      "source_refs": [
        "blueprint/patient-portal-experience-architecture-blueprint.md#1. Shell and route map"
      ],
      "notes": "The route may be linked, but return-safe resolution still belongs to the same cluster shell."
    },
    {
      "path_id": "sl_message_callback",
      "allowlist_decision": "conditional",
      "route_family_ref": "rf_patient_messages",
      "route_family_label": "Messages",
      "path_pattern": "/messages/:clusterId/callback/:callbackCaseId",
      "patient_visible_purpose": "Resume callback or live-contact instructions within the owning message shell.",
      "embedded_safe": "conditional",
      "requires_outbound_navigation_grant": "no",
      "requires_authenticated_session": "yes",
      "allows_secure_link_entry": "no",
      "allows_from_nhs_app_query_marker": "yes",
      "placeholder_in_mock": "yes",
      "include_by_default": true,
      "ios_path_pattern": "/messages/*",
      "selected_anchor_ref": "callback_case_anchor",
      "return_contract_ref": "PatientNavReturnContract(callback_case)",
      "real_registration_gate_refs": [
        "LIVE_GATE_PHASE7_SCOPE_WINDOW",
        "LIVE_GATE_ENVIRONMENT_VALUES_SUPPLIED",
        "LIVE_GATE_PATH_ALLOWLIST_APPROVED",
        "LIVE_GATE_CONTINUITY_EVIDENCE_CURRENT"
      ],
      "source_refs": [
        "blueprint/patient-portal-experience-architecture-blueprint.md#1. Shell and route map",
        "blueprint/patient-account-and-communications-blueprint.md"
      ],
      "notes": "Callback posture may still downgrade to repair or recovery inside the same shell."
    },
    {
      "path_id": "sl_contact_repair",
      "allowlist_decision": "conditional",
      "route_family_ref": "rf_patient_messages",
      "route_family_label": "Messages",
      "path_pattern": "/contact-repair/:repairCaseId",
      "patient_visible_purpose": "Repair reachability or recipient issues while preserving the blocked action context.",
      "embedded_safe": "conditional",
      "requires_outbound_navigation_grant": "no",
      "requires_authenticated_session": "yes",
      "allows_secure_link_entry": "no",
      "allows_from_nhs_app_query_marker": "yes",
      "placeholder_in_mock": "yes",
      "include_by_default": true,
      "ios_path_pattern": "/contact-repair/*",
      "selected_anchor_ref": "contact_repair_anchor",
      "return_contract_ref": "PatientNavReturnContract(contact_repair)",
      "real_registration_gate_refs": [
        "LIVE_GATE_PHASE7_SCOPE_WINDOW",
        "LIVE_GATE_ENVIRONMENT_VALUES_SUPPLIED",
        "LIVE_GATE_PATH_ALLOWLIST_APPROVED",
        "LIVE_GATE_CONTINUITY_EVIDENCE_CURRENT"
      ],
      "source_refs": [
        "blueprint/patient-portal-experience-architecture-blueprint.md#1. Shell and route map",
        "blueprint/patient-account-and-communications-blueprint.md"
      ],
      "notes": "Reachability repair stays in-shell and must not break the blocked offer or callback context."
    },
    {
      "path_id": "sl_raw_document_download",
      "allowlist_decision": "rejected",
      "route_family_ref": "rf_patient_health_record",
      "route_family_label": "Health record",
      "path_pattern": "/records/documents/:documentId/download",
      "patient_visible_purpose": "Direct raw byte or detached export endpoint.",
      "embedded_safe": "no",
      "requires_outbound_navigation_grant": "yes",
      "requires_authenticated_session": "yes",
      "allows_secure_link_entry": "no",
      "allows_from_nhs_app_query_marker": "no",
      "placeholder_in_mock": "no",
      "include_by_default": false,
      "ios_path_pattern": "",
      "selected_anchor_ref": "artifact_summary_panel",
      "return_contract_ref": "PatientNavReturnContract(record_document)",
      "real_registration_gate_refs": [
        "LIVE_GATE_PHASE7_SCOPE_WINDOW",
        "LIVE_GATE_ENVIRONMENT_VALUES_SUPPLIED",
        "LIVE_GATE_PATH_ALLOWLIST_APPROVED",
        "LIVE_GATE_CONTINUITY_EVIDENCE_CURRENT"
      ],
      "source_refs": [
        "blueprint/platform-frontend-blueprint.md#OutboundNavigationGrant",
        "blueprint/patient-account-and-communications-blueprint.md"
      ],
      "notes": "Rejected: raw artifact URLs and detached export routes are forbidden; patients must land in the record shell first."
    },
    {
      "path_id": "sl_detached_message_alias",
      "allowlist_decision": "rejected",
      "route_family_ref": "rf_patient_messages",
      "route_family_label": "Messages",
      "path_pattern": "/messages/:threadId",
      "patient_visible_purpose": "Detached alias directly to a thread without the owning cluster shell.",
      "embedded_safe": "no",
      "requires_outbound_navigation_grant": "no",
      "requires_authenticated_session": "yes",
      "allows_secure_link_entry": "no",
      "allows_from_nhs_app_query_marker": "no",
      "placeholder_in_mock": "no",
      "include_by_default": false,
      "ios_path_pattern": "",
      "selected_anchor_ref": "message_thread_anchor",
      "return_contract_ref": "PatientNavReturnContract(message_thread)",
      "real_registration_gate_refs": [
        "LIVE_GATE_PHASE7_SCOPE_WINDOW",
        "LIVE_GATE_ENVIRONMENT_VALUES_SUPPLIED",
        "LIVE_GATE_PATH_ALLOWLIST_APPROVED",
        "LIVE_GATE_CONTINUITY_EVIDENCE_CURRENT"
      ],
      "source_refs": [
        "blueprint/patient-portal-experience-architecture-blueprint.md#1. Shell and route map"
      ],
      "notes": "Rejected: aliases must resolve into the owning cluster shell rather than exposing a second detached message entry contract."
    },
    {
      "path_id": "sl_raw_accept_action",
      "allowlist_decision": "rejected",
      "route_family_ref": "rf_patient_appointments",
      "route_family_label": "Appointments",
      "path_pattern": "/bookings/:bookingCaseId/accept",
      "patient_visible_purpose": "Direct mutation-style booking acceptance URL.",
      "embedded_safe": "no",
      "requires_outbound_navigation_grant": "no",
      "requires_authenticated_session": "yes",
      "allows_secure_link_entry": "no",
      "allows_from_nhs_app_query_marker": "no",
      "placeholder_in_mock": "no",
      "include_by_default": false,
      "ios_path_pattern": "",
      "selected_anchor_ref": "booking_confirm_anchor",
      "return_contract_ref": "PatientNavReturnContract(booking_confirm)",
      "real_registration_gate_refs": [
        "LIVE_GATE_PHASE7_SCOPE_WINDOW",
        "LIVE_GATE_ENVIRONMENT_VALUES_SUPPLIED",
        "LIVE_GATE_PATH_ALLOWLIST_APPROVED",
        "LIVE_GATE_CONTINUITY_EVIDENCE_CURRENT"
      ],
      "source_refs": [
        "blueprint/phase-4-the-booking-engine.md",
        "blueprint/phase-7-inside-the-nhs-app.md#7D. Deep links, site links, and return-to-journey continuity"
      ],
      "notes": "Rejected: direct action URLs would overexpose live mutation and bypass the governed booking shell."
    }
  ],
  "placeholder_registry": {
    "task_id": "seq_030",
    "captured_on": "2026-04-09",
    "visual_mode": "Linkloom_Metadata_Studio",
    "placeholder_domains": [
      "links.local.service.test",
      "links-sandpit.service.example",
      "links-aos.service.example",
      "links.service.example"
    ],
    "template_tokens": {
      "ANDROID_PACKAGE_NAME": "Environment-specific Android package name supplied by the NHS App team",
      "ANDROID_SHA256_CERT_FINGERPRINT": "Environment-specific Android certificate fingerprint supplied by the NHS App team",
      "IOS_APP_ID": "Environment-specific iOS appID supplied by the NHS App team",
      "IOS_PATHS_ALLOWLIST": "Expanded from the approved route path allowlist for the selected environment"
    },
    "host_management_defaults": {
      "local_mock": "127.0.0.1:4181",
      "sandpit_like": "links-sandpit.service.example",
      "aos_like": "links-aos.service.example",
      "live_placeholder": "links.service.example"
    },
    "guardrails": [
      "No real package IDs, fingerprints, or appIDs are stored in repo outputs.",
      "No wildcard route registration is allowed.",
      "No PHI-bearing query parameters may appear in registered paths.",
      "Placeholder files do not prove production hosting readiness."
    ]
  },
  "live_gate_pack": {
    "planning_readiness": "ready_for_external_readiness",
    "phase0_entry_verdict": "withheld",
    "verdict": "blocked",
    "live_gates": [
      {
        "gate_id": "LIVE_GATE_PHASE7_SCOPE_WINDOW",
        "label": "Phase 7 approved scope window",
        "status": "blocked",
        "summary": "Site-link registration stays deferred until the NHS App channel is inside an approved scope window."
      },
      {
        "gate_id": "LIVE_GATE_EXTERNAL_FOUNDATION_WITHHELD",
        "label": "External readiness chain clear",
        "status": "blocked",
        "summary": "Phase 0 planning is ready for external-readiness work, but the current-baseline external gate remains withheld and still blocks any real NHS App mutation."
      },
      {
        "gate_id": "LIVE_GATE_ENVIRONMENT_VALUES_SUPPLIED",
        "label": "Environment-specific package, certificate, and appID values supplied",
        "status": "blocked",
        "summary": "Android package name, Android certificate fingerprint, and iOS appID must come from the NHS App team per environment."
      },
      {
        "gate_id": "LIVE_GATE_PATH_ALLOWLIST_APPROVED",
        "label": "Path allowlist approved and traceable",
        "status": "review_required",
        "summary": "Every registered path must map back to one approved route family, safe return contract, and embedded-safe posture."
      },
      {
        "gate_id": "LIVE_GATE_CONTINUITY_EVIDENCE_CURRENT",
        "label": "Route continuity and embedded evidence current",
        "status": "review_required",
        "summary": "Linked routes must already satisfy session, continuity, artifact, and return-safe laws before registration."
      },
      {
        "gate_id": "LIVE_GATE_DOMAIN_OWNERSHIP_PROVEN",
        "label": "Domain ownership, hosting path, and cache controls proven",
        "status": "review_required",
        "summary": "Real `.well-known` hosting requires owned HTTPS domains, exact paths, no hidden redirects, and governed cache controls."
      },
      {
        "gate_id": "LIVE_GATE_NAMED_APPROVER_PRESENT",
        "label": "Named approver present",
        "status": "blocked",
        "summary": "No named approver is stored in repo fixtures or allowed by default in the rehearsal pack."
      },
      {
        "gate_id": "LIVE_GATE_ENVIRONMENT_TARGET_PRESENT",
        "label": "Environment target present",
        "status": "blocked",
        "summary": "Real registration must target exactly one environment: sandpit, AOS, or live."
      },
      {
        "gate_id": "LIVE_GATE_MUTATION_FLAG_ENABLED",
        "label": "ALLOW_REAL_PROVIDER_MUTATION=true",
        "status": "blocked",
        "summary": "Dry-run remains the only default; real mutation is fail-closed until the explicit flag is set."
      }
    ],
    "selector_map": {
      "studio_profile": {
        "environment_switcher": "[data-testid='environment-switcher']",
        "platform_switcher": "[data-testid='platform-switcher']",
        "route_tree": "[data-testid='route-tree']",
        "route_filter": "[data-testid='route-filter']",
        "page_allowlist": "[data-testid='page-tab-Route_Path_Allowlist']",
        "page_android": "[data-testid='page-tab-Android_Assetlinks_Generator']",
        "page_ios": "[data-testid='page-tab-iOS_AASA_Generator']",
        "page_hosting": "[data-testid='page-tab-Local_Hosting_Validator']",
        "page_gates": "[data-testid='page-tab-Real_Registration_Gates']",
        "hosting_panel": "[data-testid='local-hosting-panel']",
        "gate_board": "[data-testid='live-gate-board']",
        "mode_toggle_actual": "[data-testid='mode-toggle-actual']",
        "actual_notice": "[data-testid='actual-submission-notice']",
        "actual_submit": "[data-testid='actual-submit-button']"
      }
    },
    "dry_run_defaults": {
      "default_target_url": "http://127.0.0.1:4181/?page=Real_Registration_Gates&mode=actual",
      "local_assetlinks_url": "http://127.0.0.1:4181/.well-known/assetlinks.json",
      "local_aasa_url": "http://127.0.0.1:4181/.well-known/apple-app-site-association"
    }
  },
  "local_hosting_profile": {
    "hosted_environment_id": "local_mock",
    "assetlinks_path": "/.well-known/assetlinks.json",
    "aasa_path": "/.well-known/apple-app-site-association",
    "generated_assetlinks": [
      {
        "relation": [
          "delegate_permission/common.handle_all_urls"
        ],
        "target": {
          "namespace": "android_app",
          "package_name": "__NHS_APP_ANDROID_PACKAGE_LOCAL_MOCK__",
          "sha256_cert_fingerprints": [
            "__NHS_APP_ANDROID_SHA256_LOCAL_MOCK__"
          ]
        }
      }
    ],
    "generated_aasa": {
      "applinks": {
        "apps": [],
        "details": [
          {
            "appID": "__NHS_APP_IOS_APP_ID_LOCAL_MOCK__",
            "paths": [
              "/appointments",
              "/appointments/*",
              "/bookings/*",
              "/contact-repair/*",
              "/messages/*",
              "/records/documents/*",
              "/records/results/*",
              "/recovery/*",
              "/requests",
              "/requests/*",
              "/start-request"
            ]
          }
        ]
      }
    },
    "validation_rules": [
      "reachable over the local preview server",
      "parseable JSON payloads",
      "same generator model as the studio preview",
      "placeholder-only values, never real NHS App environment values"
    ]
  }
} as const;
