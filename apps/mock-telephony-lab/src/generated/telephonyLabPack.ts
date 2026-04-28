        export const telephonyLabPack = {
  "task_id": "seq_032",
  "generated_at": "2026-04-09T21:49:07.351277+00:00",
  "captured_on": "2026-04-09",
  "mission": "Create the telephony account-and-number provisioning pack with a high-fidelity local telephony lab and a gated real provider-later workspace, number, webhook, and recording strategy that preserves urgent-live preemption, evidence readiness, and SMS continuation law.",
  "visual_mode": "Voice_Fabric_Lab",
  "phase0_verdict": "withheld",
  "source_precedence": [
    "prompt/032.md",
    "prompt/031.md",
    "prompt/033.md",
    "prompt/shared_operating_contract_026_to_035.md",
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "data/analysis/31_vendor_shortlist.json",
    "data/analysis/external_account_inventory.csv",
    "data/analysis/phase0_gate_verdict.json",
    "docs/external/21_integration_priority_and_execution_matrix.md",
    "docs/external/23_actual_partner_account_governance.md",
    "docs/external/31_actual_provider_shortlist_and_due_diligence.md",
    "blueprint/phase-0-the-foundation-protocol.md",
    "blueprint/phase-2-identity-and-echoes.md",
    "blueprint/patient-account-and-communications-blueprint.md",
    "blueprint/callback-and-clinician-messaging-loop.md",
    "blueprint/platform-runtime-and-release-blueprint.md",
    "blueprint/forensic-audit-findings.md",
    "https://www.twilio.com/docs/iam/api-keys",
    "https://www.twilio.com/docs/iam/api/subaccounts",
    "https://www.twilio.com/docs/usage/webhooks/webhooks-security",
    "https://www.twilio.com/docs/phone-numbers/api/incomingphonenumber-resource",
    "https://www.twilio.com/docs/phone-numbers/api/availablephonenumberlocal-resource",
    "https://www.twilio.com/docs/voice/api/recording",
    "https://www.twilio.com/en-us/voice/pricing/gb",
    "https://developer.vonage.com/en/voice/voice-api/getting-started",
    "https://developer.vonage.com/en/application/overview",
    "https://developer.vonage.com/en/getting-started/concepts/webhooks",
    "https://developer.vonage.com/de/api/numbers",
    "https://www.vonage.com/communications-apis/pricing/"
  ],
  "assumptions": [
    {
      "assumption_id": "ASSUMPTION_MOCK_NUMBERS_USE_NON_ROUTABLE_PLACEHOLDER_FORMAT",
      "summary": "The lab uses `MOCK:+44-VC-XXXX` placeholders so operator screens can rehearse E.164-like handling without implying real PSTN routability.",
      "consequence": "Mock numbers remain visibly non-live while still exercising formatter, routing, and selector logic."
    },
    {
      "assumption_id": "ASSUMPTION_SERVICE_AND_APP_SHARE_ONE_PACK_BUT_KEEP_TRUTH_SEPARATION",
      "summary": "The mock carrier and the Voice_Fabric_Lab read one deterministic pack, but neither may treat transport acknowledgement, recording arrival, or SMS dispatch as authoritative request truth.",
      "consequence": "The local lab stays faithful to the blueprint without inventing a phone-only lifecycle."
    },
    {
      "assumption_id": "ASSUMPTION_PHASE0_WITHHELD_KEEPS_REAL_MUTATION_DISABLED",
      "summary": "Even with vendor shortlist, named approver, and environment data present, real account or number creation remains disabled while the Phase 0 external-readiness chain is withheld.",
      "consequence": "The dry-run harness can validate form and source mechanics without ever mutating live vendor state."
    }
  ],
  "official_vendor_guidance": [
    {
      "source_id": "twilio_api_keys_overview",
      "vendor": "Twilio",
      "title": "API keys overview | Twilio",
      "url": "https://www.twilio.com/docs/iam/api-keys",
      "captured_on": "2026-04-09",
      "summary": "Twilio positions API keys as the preferred REST authentication mechanism, warns that Account SID plus Auth Token are risky in production, and documents standard and restricted key types.",
      "grounding": [
        "API keys are the preferred way to authenticate with Twilio REST APIs.",
        "Twilio warns against using Account SID and Auth Token as production credentials.",
        "Restricted API keys allow minimum and specific access levels.",
        "API credentials are region-specific resources when Twilio Regions are in use."
      ]
    },
    {
      "source_id": "twilio_subaccounts",
      "vendor": "Twilio",
      "title": "REST API: Subaccounts | Twilio",
      "url": "https://www.twilio.com/docs/iam/api/subaccounts",
      "captured_on": "2026-04-09",
      "summary": "Twilio subaccounts segment usage, credentials, and historical data. Closed subaccounts stay visible and are deleted after closure only under specific settings.",
      "grounding": [
        "Main accounts can create and manage subaccounts for isolated workspaces.",
        "Twilio deletes closed subaccounts 30 days after closure by default.",
        "Historical data remains visible unless deletion of closed subaccounts is activated."
      ]
    },
    {
      "source_id": "twilio_webhooks_security",
      "vendor": "Twilio",
      "title": "Webhooks security | Twilio",
      "url": "https://www.twilio.com/docs/usage/webhooks/webhooks-security",
      "captured_on": "2026-04-09",
      "summary": "Twilio signs inbound callbacks and requires server-side validation over the request target plus parameter set, with `X-Twilio-Signature` as the primary integrity signal.",
      "grounding": [
        "Twilio sends an `X-Twilio-Signature` header on incoming webhook requests.",
        "Webhook validation must compare the full URL and request parameters with the signature.",
        "Signature validation is a transport-authenticity guard, not an authoritative business outcome."
      ]
    },
    {
      "source_id": "twilio_incoming_phone_numbers",
      "vendor": "Twilio",
      "title": "IncomingPhoneNumber resource | Twilio",
      "url": "https://www.twilio.com/docs/phone-numbers/api/incomingphonenumber-resource",
      "captured_on": "2026-04-09",
      "summary": "Provisioning is a two-step process: search available numbers, then POST to the IncomingPhoneNumbers resource. Numbers expose capability flags and per-number voice, fallback, SMS, and status callback fields.",
      "grounding": [
        "Provisioning a phone number is a two-step process: find then POST to IncomingPhoneNumbers.",
        "Capabilities explicitly separate Voice, SMS, and MMS booleans.",
        "Incoming phone numbers support `VoiceUrl`, `VoiceFallbackUrl`, `SmsUrl`, and `StatusCallback`.",
        "Numbers can be deleted and released through the same resource family."
      ]
    },
    {
      "source_id": "twilio_available_phone_numbers",
      "vendor": "Twilio",
      "title": "AvailablePhoneNumber Local resource | Twilio",
      "url": "https://www.twilio.com/docs/phone-numbers/api/availablephonenumberlocal-resource",
      "captured_on": "2026-04-09",
      "summary": "Twilio supports filtered local-number search by pattern, geography, and capabilities before purchase.",
      "grounding": [
        "Search can filter on phone-number pattern, geography, and supported features like SMS.",
        "Available numbers publish capability booleans for Voice, SMS, and MMS.",
        "The resource explicitly leads into the purchase flow."
      ]
    },
    {
      "source_id": "twilio_recordings_resource",
      "vendor": "Twilio",
      "title": "Recordings resource | Twilio",
      "url": "https://www.twilio.com/docs/voice/api/recording",
      "captured_on": "2026-04-09",
      "summary": "Twilio recordings expose status and metadata through a dedicated resource. The pack treats recording status as weaker than evidence readiness and never as submission truth.",
      "grounding": [
        "Recording lifecycle is managed through a dedicated resource.",
        "Recording state is separate from request promotion or callback completion.",
        "Recording events and URLs are transport artefacts that still require Vecells evidence checks."
      ]
    },
    {
      "source_id": "twilio_voice_pricing_gb",
      "vendor": "Twilio",
      "title": "Programmable Voice Pricing in United Kingdom | Twilio",
      "url": "https://www.twilio.com/en-us/voice/pricing/gb",
      "captured_on": "2026-04-09",
      "summary": "Twilio advertises UK phone-number pricing and notes that clean local numbers can be instantly provisioned through the console or number provisioning API.",
      "grounding": [
        "Twilio UK pricing includes monthly charges for local numbers.",
        "Twilio documents instant provisioning through the console or number provisioning API.",
        "Commercial number creation is therefore billable and must remain behind spend gates."
      ]
    },
    {
      "source_id": "vonage_voice_getting_started",
      "vendor": "Vonage",
      "title": "Getting Started with Voice API | Vonage",
      "url": "https://developer.vonage.com/en/voice/voice-api/getting-started",
      "captured_on": "2026-04-09",
      "summary": "Vonage requires an account with API key and secret, documents a demo or trial caller ID of `123456789`, and requires account credit before renting a number.",
      "grounding": [
        "A Vonage account yields an API key and secret for API access.",
        "The test number `123456789` may be used as caller ID for demo or trial accounts.",
        "Renting a number requires adding credit to the account.",
        "The dashboard exposes a Buy Numbers flow with Voice capability filtering."
      ]
    },
    {
      "source_id": "vonage_application_api_overview",
      "vendor": "Vonage",
      "title": "Application API Overview | Vonage",
      "url": "https://developer.vonage.com/en/application/overview",
      "captured_on": "2026-04-09",
      "summary": "Vonage applications hold security configuration, callbacks, and capability wiring for Voice, Messages, and RTC.",
      "grounding": [
        "A Vonage API application contains the security and configuration information needed to connect to endpoints.",
        "Applications configure authentication and callbacks.",
        "Applications may support Voice, Messages, and RTC capabilities."
      ]
    },
    {
      "source_id": "vonage_webhooks",
      "vendor": "Vonage",
      "title": "Webhooks | Vonage",
      "url": "https://developer.vonage.com/en/getting-started/concepts/webhooks",
      "captured_on": "2026-04-09",
      "summary": "Vonage documents application-level `answer_url`, `event_url`, and optional `fallback_answer_url` plus number-level status callbacks and recording event URLs.",
      "grounding": [
        "Linked numbers use `answer_url` to retrieve an NCCO and `event_url` for call-status information.",
        "An optional `fallback_answer_url` is used when `answer_url` or `event_url` is unavailable.",
        "Number-level status callbacks can be configured per purchased number.",
        "Recording event URLs are separate callback endpoints."
      ]
    },
    {
      "source_id": "vonage_numbers_api",
      "vendor": "Vonage",
      "title": "Numbers API Reference | Vonage",
      "url": "https://developer.vonage.com/de/api/numbers",
      "captured_on": "2026-04-09",
      "summary": "The Numbers API supports listing, searching, buying, cancelling, and updating numbers. Number updates carry app binding plus voice status callback configuration.",
      "grounding": [
        "The Numbers API supports search, buy, cancel, and update operations.",
        "Buy and cancel are explicit billable mutation surfaces.",
        "Number update supports `app_id`, `voiceStatusCallback`, and other callback fields."
      ]
    },
    {
      "source_id": "vonage_pricing",
      "vendor": "Vonage",
      "title": "API Pricing | Vonage",
      "url": "https://www.vonage.com/communications-apis/pricing/",
      "captured_on": "2026-04-09",
      "summary": "Vonage pricing confirms that voice and number provisioning are commercial actions and should stay behind named spend and procurement approval.",
      "grounding": [
        "Voice and number consumption are commercial API products.",
        "Spend control must be explicit before number purchase or live enablement."
      ]
    }
  ],
  "shortlisted_vendors": [
    {
      "vendor_id": "twilio_telephony_ivr",
      "vendor_name": "Twilio",
      "actual_later_fit_score": 80,
      "mock_now_fit_score": 82,
      "top_note": "Strong public sandbox and recording support, but callback authenticity relies on signature validation plus adapter-side dedupe rather than a first-class replay token.",
      "source_refs": [
        "https://www.twilio.com/docs/iam/test-credentials",
        "https://www.twilio.com/docs/iam/api/subaccounts",
        "https://www.twilio.com/docs/usage/webhooks/webhooks-security",
        "https://www.twilio.com/docs/voice/api/recording",
        "https://www.twilio.com/docs/global-infrastructure/understanding-twilio-regions"
      ],
      "handoff_task": "seq_032",
      "handoff_focus": "workspace, number, answer/event/fallback webhooks, recording, and spend gates"
    },
    {
      "vendor_id": "vonage_telephony_ivr",
      "vendor_name": "Vonage",
      "actual_later_fit_score": 80,
      "mock_now_fit_score": 80,
      "top_note": "Vonage scores well on signed callbacks, fallback webhooks, DTMF, and recording URLs. It remains slightly behind Twilio on public test-environment depth.",
      "source_refs": [
        "https://developer.vonage.com/en/voice/voice-api/webhook-reference",
        "https://developer.vonage.com/en/getting-started/concepts/webhooks",
        "https://www.vonage.com/communications-apis/pricing/"
      ],
      "handoff_task": "seq_032",
      "handoff_focus": "workspace, number, answer/event/fallback webhooks, recording, and spend gates"
    }
  ],
  "selected_secret_rows": [
    {
      "account_or_secret_id": "ACC_TEL_LOCAL_SIM_PRINCIPAL",
      "dependency_family": "telephony",
      "dependency_title": "Telephony, IVR, and recording rail",
      "environment": "local_mock",
      "record_class": "service_principal",
      "current_lane": "mock_now",
      "owner_role": "ROLE_COMMUNICATIONS_PLATFORM_LEAD",
      "backup_owner_role": "ROLE_SECURITY_LEAD",
      "creator_role": "ROLE_PARTNER_ONBOARDING_LEAD",
      "approver_role": "ROLE_OPERATIONS_LEAD",
      "storage_backend": "local_ephemeral_secret_store",
      "distribution_method": "deterministic_seed_bootstrap",
      "rotation_policy": "per_spin_up_or_pipeline_run",
      "revocation_policy": "destroy_seed_material_reset_environment_append_mock_audit",
      "audit_sink": "MockCredentialSeedAudit",
      "exposure_constraints": "No markdown literals, no console echo, no trace/video capture, screenshots only after explicit redaction, runtime reference handles only.",
      "allowed_usage_surfaces": "telephony_simulator; svc_telephony_edge; tests_playwright_external",
      "manual_checkpoint_required": "no",
      "live_gate_refs": "GATE_EXTERNAL_TO_FOUNDATION; LIVE_GATE_TELEPHONY_RECORDING_APPROVED",
      "mock_equivalent_ref": "",
      "origin_source": "deterministic_seed_generator",
      "landing_zone": "seed_bootstrap_outside_repo",
      "runtime_injection_path": "ephemeral_runtime_secret_mount",
      "dual_control_required": "no",
      "redaction_profile": "full_secret_mask_and_capture_block",
      "risk_refs": "HZ_TELEPHONY_EVIDENCE_INADEQUACY; HZ_URGENT_DIVERSION_UNDER_OR_OVER_TRIAGE; RISK_EXT_COMMS_VENDOR_DELAY; RISK_MUTATION_003; RISK_STATE_004; RISK_MUTATION_001",
      "source_refs": "blueprint/phase-2-the-identity-and-echoes.md#2E. Telephony edge, IVR choreography, and call-session persistence; blueprint/phase-2-the-identity-and-echoes.md#2F. Caller verification, voice capture, transcript stub, and SMS continuation",
      "notes": "Local simulator principal for inbound webhooks and IVR state tests."
    },
    {
      "account_or_secret_id": "SEC_TEL_LOCAL_WEBHOOK",
      "dependency_family": "telephony",
      "dependency_title": "Telephony, IVR, and recording rail",
      "environment": "local_mock",
      "record_class": "webhook_secret",
      "current_lane": "mock_now",
      "owner_role": "ROLE_COMMUNICATIONS_PLATFORM_LEAD",
      "backup_owner_role": "ROLE_SECURITY_LEAD",
      "creator_role": "ROLE_PARTNER_ONBOARDING_LEAD",
      "approver_role": "ROLE_OPERATIONS_LEAD",
      "storage_backend": "local_ephemeral_secret_store",
      "distribution_method": "deterministic_seed_bootstrap",
      "rotation_policy": "per_spin_up_or_pipeline_run",
      "revocation_policy": "destroy_seed_material_reset_environment_append_mock_audit",
      "audit_sink": "MockCredentialSeedAudit",
      "exposure_constraints": "No markdown literals, no console echo, no trace/video capture, screenshots only after explicit redaction, runtime reference handles only.",
      "allowed_usage_surfaces": "telephony_simulator; svc_telephony_edge; tests_playwright_external",
      "manual_checkpoint_required": "no",
      "live_gate_refs": "GATE_EXTERNAL_TO_FOUNDATION; LIVE_GATE_TELEPHONY_RECORDING_APPROVED",
      "mock_equivalent_ref": "",
      "origin_source": "deterministic_seed_generator",
      "landing_zone": "seed_bootstrap_outside_repo",
      "runtime_injection_path": "ephemeral_runtime_secret_mount",
      "dual_control_required": "no",
      "redaction_profile": "full_secret_mask_and_capture_block",
      "risk_refs": "HZ_TELEPHONY_EVIDENCE_INADEQUACY; HZ_URGENT_DIVERSION_UNDER_OR_OVER_TRIAGE; RISK_EXT_COMMS_VENDOR_DELAY; RISK_MUTATION_003; RISK_STATE_004; RISK_MUTATION_001",
      "source_refs": "blueprint/phase-2-the-identity-and-echoes.md#2E. Telephony edge, IVR choreography, and call-session persistence; blueprint/phase-2-the-identity-and-echoes.md#2F. Caller verification, voice capture, transcript stub, and SMS continuation",
      "notes": "Deterministic local callback authenticity secret."
    },
    {
      "account_or_secret_id": "NUM_TEL_SHARED_DEV_TEST_RANGE",
      "dependency_family": "telephony",
      "dependency_title": "Telephony, IVR, and recording rail",
      "environment": "shared_dev",
      "record_class": "phone_number",
      "current_lane": "mock_now",
      "owner_role": "ROLE_COMMUNICATIONS_PLATFORM_LEAD",
      "backup_owner_role": "ROLE_SECURITY_LEAD",
      "creator_role": "ROLE_PARTNER_ONBOARDING_LEAD",
      "approver_role": "ROLE_OPERATIONS_LEAD",
      "storage_backend": "shared_nonprod_fixture_registry",
      "distribution_method": "deterministic_seed_bootstrap",
      "rotation_policy": "daily_shared_reset_or_on_contract_change",
      "revocation_policy": "destroy_seed_material_reset_environment_append_mock_audit",
      "audit_sink": "MockCredentialSeedAudit",
      "exposure_constraints": "Metadata may appear only as placeholder, hash, or approved identifier digest; never adjacent to live secret values.",
      "allowed_usage_surfaces": "telephony_simulator; svc_telephony_edge; tests_playwright_external; telephony_number_registry",
      "manual_checkpoint_required": "no",
      "live_gate_refs": "GATE_EXTERNAL_TO_FOUNDATION; LIVE_GATE_TELEPHONY_RECORDING_APPROVED",
      "mock_equivalent_ref": "",
      "origin_source": "deterministic_seed_generator",
      "landing_zone": "seed_bootstrap_outside_repo",
      "runtime_injection_path": "control_plane_metadata_publication",
      "dual_control_required": "no",
      "redaction_profile": "masked_identifier_and_placeholder_render",
      "risk_refs": "HZ_TELEPHONY_EVIDENCE_INADEQUACY; HZ_URGENT_DIVERSION_UNDER_OR_OVER_TRIAGE; RISK_EXT_COMMS_VENDOR_DELAY; RISK_MUTATION_003; RISK_STATE_004; RISK_MUTATION_001",
      "source_refs": "blueprint/phase-2-the-identity-and-echoes.md#2E. Telephony edge, IVR choreography, and call-session persistence; blueprint/phase-2-the-identity-and-echoes.md#2F. Caller verification, voice capture, transcript stub, and SMS continuation",
      "notes": "Reserved synthetic number range for shared-dev IVR and callback rehearsal."
    },
    {
      "account_or_secret_id": "DATA_TEL_SHARED_DEV_FIXTURES",
      "dependency_family": "telephony",
      "dependency_title": "Telephony, IVR, and recording rail",
      "environment": "shared_dev",
      "record_class": "sandbox_dataset",
      "current_lane": "mock_now",
      "owner_role": "ROLE_COMMUNICATIONS_PLATFORM_LEAD",
      "backup_owner_role": "ROLE_SECURITY_LEAD",
      "creator_role": "ROLE_PARTNER_ONBOARDING_LEAD",
      "approver_role": "ROLE_OPERATIONS_LEAD",
      "storage_backend": "shared_nonprod_fixture_registry",
      "distribution_method": "deterministic_seed_bootstrap",
      "rotation_policy": "daily_shared_reset_or_on_contract_change",
      "revocation_policy": "destroy_seed_material_reset_environment_append_mock_audit",
      "audit_sink": "MockCredentialSeedAudit",
      "exposure_constraints": "Synthetic-only material; never mix with live partner outputs or live patient-like identifiers.",
      "allowed_usage_surfaces": "telephony_simulator; svc_telephony_edge; tests_playwright_external; seed_reset_job",
      "manual_checkpoint_required": "no",
      "live_gate_refs": "GATE_EXTERNAL_TO_FOUNDATION; LIVE_GATE_TELEPHONY_RECORDING_APPROVED",
      "mock_equivalent_ref": "",
      "origin_source": "deterministic_seed_generator",
      "landing_zone": "seed_bootstrap_outside_repo",
      "runtime_injection_path": "seed_fixture_sync_and_environment_reset",
      "dual_control_required": "no",
      "redaction_profile": "synthetic_only_render",
      "risk_refs": "HZ_TELEPHONY_EVIDENCE_INADEQUACY; HZ_URGENT_DIVERSION_UNDER_OR_OVER_TRIAGE; RISK_EXT_COMMS_VENDOR_DELAY; RISK_MUTATION_003; RISK_STATE_004; RISK_MUTATION_001",
      "source_refs": "blueprint/phase-2-the-identity-and-echoes.md#2E. Telephony edge, IVR choreography, and call-session persistence; blueprint/phase-2-the-identity-and-echoes.md#2F. Caller verification, voice capture, transcript stub, and SMS continuation",
      "notes": "Synthetic call recordings, transcript placeholders, and call-session timelines."
    },
    {
      "account_or_secret_id": "ACC_TELEPHONY_PREPROD_PRINCIPAL",
      "dependency_family": "telephony",
      "dependency_title": "Telephony, IVR, and recording rail",
      "environment": "preprod",
      "record_class": "service_principal",
      "current_lane": "actual_later",
      "owner_role": "ROLE_COMMUNICATIONS_PLATFORM_LEAD",
      "backup_owner_role": "ROLE_SECURITY_LEAD",
      "creator_role": "ROLE_PARTNER_ONBOARDING_LEAD",
      "approver_role": "ROLE_OPERATIONS_LEAD",
      "storage_backend": "preprod_vault",
      "distribution_method": "dual_control_capture_then_vault_ingest",
      "rotation_policy": "every_90_days_or_before_release_candidate_widen",
      "revocation_policy": "disable_at_provider_rotate_dependent_handles_republish_runtime_append_audit",
      "audit_sink": "ExternalAccessLifecycleLedger",
      "exposure_constraints": "No markdown literals, no console echo, no trace/video capture, screenshots only after explicit redaction, runtime reference handles only.",
      "allowed_usage_surfaces": "svc_telephony_edge; browser_automation_dry_run; ops_vendor_control_plane",
      "manual_checkpoint_required": "yes",
      "live_gate_refs": "GATE_EXTERNAL_TO_FOUNDATION; LIVE_GATE_TELEPHONY_RECORDING_APPROVED",
      "mock_equivalent_ref": "ACC_TEL_LOCAL_SIM_PRINCIPAL",
      "origin_source": "partner_portal_download_or_secure_operator_capture",
      "landing_zone": "partner_capture_quarantine",
      "runtime_injection_path": "preprod_workload_identity_fetch",
      "dual_control_required": "yes",
      "redaction_profile": "full_secret_mask_and_capture_block",
      "risk_refs": "HZ_TELEPHONY_EVIDENCE_INADEQUACY; HZ_URGENT_DIVERSION_UNDER_OR_OVER_TRIAGE; RISK_EXT_COMMS_VENDOR_DELAY; RISK_MUTATION_003; RISK_STATE_004; RISK_MUTATION_001",
      "source_refs": "blueprint/phase-2-the-identity-and-echoes.md#2E. Telephony edge, IVR choreography, and call-session persistence; blueprint/phase-2-the-identity-and-echoes.md#2F. Caller verification, voice capture, transcript stub, and SMS continuation; docs/external/21_integration_priority_and_execution_matrix.md#Scorecards And Secret Posture",
      "notes": "Preprod telephony account for live-like webhook, recording, and urgent-escalation rehearsal."
    },
    {
      "account_or_secret_id": "SEC_TELEPHONY_PREPROD_WEBHOOK",
      "dependency_family": "telephony",
      "dependency_title": "Telephony, IVR, and recording rail",
      "environment": "preprod",
      "record_class": "webhook_secret",
      "current_lane": "actual_later",
      "owner_role": "ROLE_COMMUNICATIONS_PLATFORM_LEAD",
      "backup_owner_role": "ROLE_SECURITY_LEAD",
      "creator_role": "ROLE_PARTNER_ONBOARDING_LEAD",
      "approver_role": "ROLE_OPERATIONS_LEAD",
      "storage_backend": "preprod_vault",
      "distribution_method": "dual_control_capture_then_vault_ingest",
      "rotation_policy": "every_90_days_or_before_release_candidate_widen",
      "revocation_policy": "disable_at_provider_rotate_dependent_handles_republish_runtime_append_audit",
      "audit_sink": "ExternalAccessLifecycleLedger",
      "exposure_constraints": "No markdown literals, no console echo, no trace/video capture, screenshots only after explicit redaction, runtime reference handles only.",
      "allowed_usage_surfaces": "svc_telephony_edge; browser_automation_dry_run; ops_vendor_control_plane",
      "manual_checkpoint_required": "yes",
      "live_gate_refs": "GATE_EXTERNAL_TO_FOUNDATION; LIVE_GATE_TELEPHONY_RECORDING_APPROVED",
      "mock_equivalent_ref": "SEC_TEL_LOCAL_WEBHOOK",
      "origin_source": "partner_portal_download_or_secure_operator_capture",
      "landing_zone": "partner_capture_quarantine",
      "runtime_injection_path": "preprod_workload_identity_fetch",
      "dual_control_required": "yes",
      "redaction_profile": "full_secret_mask_and_capture_block",
      "risk_refs": "HZ_TELEPHONY_EVIDENCE_INADEQUACY; HZ_URGENT_DIVERSION_UNDER_OR_OVER_TRIAGE; RISK_EXT_COMMS_VENDOR_DELAY; RISK_MUTATION_003; RISK_STATE_004; RISK_MUTATION_001",
      "source_refs": "blueprint/phase-2-the-identity-and-echoes.md#2E. Telephony edge, IVR choreography, and call-session persistence; blueprint/phase-2-the-identity-and-echoes.md#2F. Caller verification, voice capture, transcript stub, and SMS continuation; docs/external/21_integration_priority_and_execution_matrix.md#Scorecards And Secret Posture",
      "notes": "Preprod telephony webhook secret captured only after recording review."
    },
    {
      "account_or_secret_id": "NUM_TELEPHONY_PRODUCTION_RANGE",
      "dependency_family": "telephony",
      "dependency_title": "Telephony, IVR, and recording rail",
      "environment": "production",
      "record_class": "phone_number",
      "current_lane": "actual_later",
      "owner_role": "ROLE_COMMUNICATIONS_PLATFORM_LEAD",
      "backup_owner_role": "ROLE_SECURITY_LEAD",
      "creator_role": "ROLE_PARTNER_ONBOARDING_LEAD",
      "approver_role": "ROLE_OPERATIONS_LEAD",
      "storage_backend": "partner_metadata_registry",
      "distribution_method": "approved_metadata_publish",
      "rotation_policy": "quarterly_recertification_and_on_topology_change",
      "revocation_policy": "remove_from_partner_registry_republish_runtime_metadata_append_audit",
      "audit_sink": "ExternalAccessLifecycleLedger",
      "exposure_constraints": "Metadata may appear only as placeholder, hash, or approved identifier digest; never adjacent to live secret values.",
      "allowed_usage_surfaces": "svc_telephony_edge; browser_automation_dry_run; ops_vendor_control_plane; telephony_number_registry",
      "manual_checkpoint_required": "yes",
      "live_gate_refs": "GATE_EXTERNAL_TO_FOUNDATION; LIVE_GATE_TELEPHONY_RECORDING_APPROVED",
      "mock_equivalent_ref": "NUM_TEL_SHARED_DEV_TEST_RANGE",
      "origin_source": "provider_admin_console_or_partner_form",
      "landing_zone": "partner_metadata_review_queue",
      "runtime_injection_path": "control_plane_metadata_publication",
      "dual_control_required": "yes",
      "redaction_profile": "masked_identifier_and_placeholder_render",
      "risk_refs": "HZ_TELEPHONY_EVIDENCE_INADEQUACY; HZ_URGENT_DIVERSION_UNDER_OR_OVER_TRIAGE; RISK_EXT_COMMS_VENDOR_DELAY; RISK_MUTATION_003; RISK_STATE_004; RISK_MUTATION_001",
      "source_refs": "blueprint/phase-2-the-identity-and-echoes.md#2E. Telephony edge, IVR choreography, and call-session persistence; blueprint/phase-2-the-identity-and-echoes.md#2F. Caller verification, voice capture, transcript stub, and SMS continuation; docs/external/21_integration_priority_and_execution_matrix.md#Scorecards And Secret Posture",
      "notes": "Production number range requires operational owner and backup owner before activation."
    }
  ],
  "selected_risks": [
    {
      "risk_id": "HZ_TELEPHONY_EVIDENCE_INADEQUACY",
      "title": "Telephony evidence inadequacy",
      "severity": "high",
      "current_status": "open",
      "trigger_summary": "Recording, transcript, or structured capture is insufficient for routine promotion.",
      "linked_tasks": "seq_032; phase2_telephony_tracks",
      "linked_gates": "TEL_LIVE_GATE_RECORDING_REVIEW_APPROVED; TEL_LIVE_GATE_FINAL_POSTURE"
    },
    {
      "risk_id": "HZ_URGENT_DIVERSION_UNDER_OR_OVER_TRIAGE",
      "title": "Urgent diversion under or over triage",
      "severity": "high",
      "current_status": "open",
      "trigger_summary": "Urgent-live routing opens too late or too early relative to the current evidence and menu signal.",
      "linked_tasks": "seq_032; phase2_telephony_tracks",
      "linked_gates": "TEL_LIVE_GATE_WEBHOOK_SECURITY_PACK; TEL_LIVE_GATE_FINAL_POSTURE"
    },
    {
      "risk_id": "RISK_EXT_COMMS_VENDOR_DELAY",
      "title": "Communications vendor delay",
      "severity": "medium",
      "current_status": "tracked",
      "trigger_summary": "Real provider onboarding or number creation lags the internal simulator schedule.",
      "linked_tasks": "seq_031; seq_032; seq_033",
      "linked_gates": "TEL_LIVE_GATE_VENDOR_APPROVED; TEL_LIVE_GATE_PROCUREMENT_AND_SPEND_AUTHORITY"
    },
    {
      "risk_id": "RISK_MUTATION_003",
      "title": "Premature provider mutation",
      "severity": "high",
      "current_status": "open",
      "trigger_summary": "A real account, workspace, or number mutation is attempted before spend or security gates pass.",
      "linked_tasks": "seq_023; seq_031; seq_032",
      "linked_gates": "TEL_LIVE_GATE_MUTATION_AND_SPEND_FLAGS; TEL_LIVE_GATE_FINAL_POSTURE"
    },
    {
      "risk_id": "RISK_STATE_004",
      "title": "Transport success mistaken for authoritative truth",
      "severity": "high",
      "current_status": "open",
      "trigger_summary": "Provider status or recording callbacks are misread as routine request readiness or callback completion.",
      "linked_tasks": "seq_005; seq_007; seq_032",
      "linked_gates": "TEL_LIVE_GATE_WEBHOOK_SECURITY_PACK; TEL_LIVE_GATE_RECORDING_REVIEW_APPROVED"
    },
    {
      "risk_id": "RISK_MUTATION_001",
      "title": "Identifier or route mutation bypass",
      "severity": "medium",
      "current_status": "open",
      "trigger_summary": "Caller verification or continuation rails overwrite a superseded binding or stale route without guard checks.",
      "linked_tasks": "seq_023; seq_032; phase2_identity_tracks",
      "linked_gates": "TEL_LIVE_GATE_WEBHOOK_SECURITY_PACK; TEL_LIVE_GATE_FINAL_POSTURE"
    }
  ],
  "number_inventory": [
    {
      "number_id": "NUM_TEL_FRONTDOOR_GENERAL",
      "e164_or_placeholder": "MOCK:+44-VC-0001",
      "environment": "local_mock",
      "direction": "inbound",
      "voice_enabled": "yes",
      "sms_enabled": "no",
      "ivr_profile_ref": "ivr_frontdoor_general",
      "recording_policy_ref": "rec_default_dual_channel",
      "webhook_profile_ref": "wh_mock_inbound_stack",
      "urgent_preemption_mode": "assess_after_menu_then_escalate_if_required",
      "mock_now_use": "yes",
      "actual_later_use": "reserved",
      "notes": "Primary non-routable front-door number for general call rehearsal."
    },
    {
      "number_id": "NUM_TEL_FRONTDOOR_URGENT",
      "e164_or_placeholder": "MOCK:+44-VC-0002",
      "environment": "local_mock",
      "direction": "inbound",
      "voice_enabled": "yes",
      "sms_enabled": "no",
      "ivr_profile_ref": "ivr_frontdoor_urgent",
      "recording_policy_ref": "rec_urgent_immediate_fetch",
      "webhook_profile_ref": "wh_mock_inbound_stack",
      "urgent_preemption_mode": "immediate_urgent_live_branch",
      "mock_now_use": "yes",
      "actual_later_use": "reserved",
      "notes": "Urgent branch number where live preemption may begin before routine evidence readiness."
    },
    {
      "number_id": "NUM_TEL_CALLBACK_OUTBOUND",
      "e164_or_placeholder": "MOCK:+44-VC-0003",
      "environment": "shared_dev",
      "direction": "outbound",
      "voice_enabled": "yes",
      "sms_enabled": "no",
      "ivr_profile_ref": "ivr_callback_return",
      "recording_policy_ref": "rec_callback_summary_only",
      "webhook_profile_ref": "wh_mock_status_and_recording",
      "urgent_preemption_mode": "route_repair_before_repeat_attempt",
      "mock_now_use": "yes",
      "actual_later_use": "reserved",
      "notes": "Used for support-driven callback replay and outbound proof rehearsal."
    },
    {
      "number_id": "NUM_TEL_SUPPORT_REPAIR",
      "e164_or_placeholder": "MOCK:+44-VC-0004",
      "environment": "shared_dev",
      "direction": "both",
      "voice_enabled": "yes",
      "sms_enabled": "no",
      "ivr_profile_ref": "ivr_support_repair",
      "recording_policy_ref": "rec_default_dual_channel",
      "webhook_profile_ref": "wh_mock_status_and_recording",
      "urgent_preemption_mode": "manual_review_only_if_identity_or_route_drifts",
      "mock_now_use": "yes",
      "actual_later_use": "optional",
      "notes": "Support replay desk number for route-repair and stale callback handling."
    },
    {
      "number_id": "NUM_TEL_CONTINUATION_SMS",
      "e164_or_placeholder": "MOCK:+44-VC-0005",
      "environment": "local_mock",
      "direction": "outbound",
      "voice_enabled": "no",
      "sms_enabled": "yes",
      "ivr_profile_ref": "ivr_frontdoor_general",
      "recording_policy_ref": "rec_default_dual_channel",
      "webhook_profile_ref": "wh_mock_continuation_sms",
      "urgent_preemption_mode": "continuation_only_no_live_voice",
      "mock_now_use": "yes",
      "actual_later_use": "optional",
      "notes": "Explicit SMS-only continuation rail to prevent voice and SMS number conflation."
    },
    {
      "number_id": "NUM_TEL_DUAL_CONTINUITY",
      "e164_or_placeholder": "MOCK:+44-VC-0006",
      "environment": "provider_like_preprod",
      "direction": "both",
      "voice_enabled": "yes",
      "sms_enabled": "yes",
      "ivr_profile_ref": "ivr_frontdoor_general",
      "recording_policy_ref": "rec_default_dual_channel",
      "webhook_profile_ref": "wh_provider_like_twilio",
      "urgent_preemption_mode": "assess_after_menu_then_escalate_if_required",
      "mock_now_use": "yes",
      "actual_later_use": "reserved",
      "notes": "Provider-like dual-capability number used to test the shared number but separated voice and SMS behaviours."
    },
    {
      "number_id": "NUM_TEL_PROVIDER_TWILIO",
      "e164_or_placeholder": "MOCK:+44-VC-0007",
      "environment": "provider_like_preprod",
      "direction": "both",
      "voice_enabled": "yes",
      "sms_enabled": "yes",
      "ivr_profile_ref": "ivr_frontdoor_general",
      "recording_policy_ref": "rec_default_dual_channel",
      "webhook_profile_ref": "wh_provider_like_twilio",
      "urgent_preemption_mode": "assess_after_menu_then_escalate_if_required",
      "mock_now_use": "yes",
      "actual_later_use": "reserved",
      "notes": "Twilio-shaped placeholder profile for later account and number dry runs."
    },
    {
      "number_id": "NUM_TEL_PROVIDER_VONAGE",
      "e164_or_placeholder": "MOCK:+44-VC-0008",
      "environment": "provider_like_preprod",
      "direction": "both",
      "voice_enabled": "yes",
      "sms_enabled": "yes",
      "ivr_profile_ref": "ivr_frontdoor_general",
      "recording_policy_ref": "rec_default_dual_channel",
      "webhook_profile_ref": "wh_provider_like_vonage",
      "urgent_preemption_mode": "assess_after_menu_then_escalate_if_required",
      "mock_now_use": "yes",
      "actual_later_use": "reserved",
      "notes": "Vonage-shaped placeholder profile for later application, number, and callback dry runs."
    },
    {
      "number_id": "NUM_TEL_RECORDING_DEGRADED",
      "e164_or_placeholder": "MOCK:+44-VC-0009",
      "environment": "local_mock",
      "direction": "inbound",
      "voice_enabled": "yes",
      "sms_enabled": "no",
      "ivr_profile_ref": "ivr_support_repair",
      "recording_policy_ref": "rec_missing_blocks_routine",
      "webhook_profile_ref": "wh_mock_status_and_recording",
      "urgent_preemption_mode": "manual_review_only_if_recording_missing",
      "mock_now_use": "yes",
      "actual_later_use": "rejected",
      "notes": "Purpose-built degraded number for recording-missing and manual-audio-review rehearsal."
    },
    {
      "number_id": "NUM_TEL_OUTBOUND_ESCALATION",
      "e164_or_placeholder": "MOCK:+44-VC-0010",
      "environment": "shared_dev",
      "direction": "outbound",
      "voice_enabled": "yes",
      "sms_enabled": "no",
      "ivr_profile_ref": "ivr_callback_return",
      "recording_policy_ref": "rec_urgent_immediate_fetch",
      "webhook_profile_ref": "wh_mock_status_and_recording",
      "urgent_preemption_mode": "escalate_to_live_operator_if_safety_epoch_open",
      "mock_now_use": "yes",
      "actual_later_use": "optional",
      "notes": "Outbound number for urgent callback and live-handoff proof rehearsal."
    }
  ],
  "webhook_matrix": [
    {
      "webhook_row_id": "HOOK_MOCK_ANSWER",
      "webhook_profile_ref": "wh_mock_inbound_stack",
      "provider_vendor": "Vecells Internal Voice Twin",
      "environment": "local_mock",
      "endpoint_kind": "answer_or_route_intake",
      "configured_on": "mock carrier number profile",
      "method": "POST",
      "signature_scheme": "vecells-hmac-sha256",
      "retry_profile": "immediate_plus_15s_plus_90s",
      "out_of_order_risk": "yes",
      "replay_guard": "effect-key-plus-signature-window",
      "authoritative_truth_note": "Generates canonical telephony event only. Never implies evidence ready.",
      "source_refs": "blueprint/phase-2-identity-and-echoes.md#2E. Telephony edge, IVR choreography, and call-session persistence",
      "notes": "Equivalent of provider answer webhook for IVR start."
    },
    {
      "webhook_row_id": "HOOK_MOCK_STATUS",
      "webhook_profile_ref": "wh_mock_status_and_recording",
      "provider_vendor": "Vecells Internal Voice Twin",
      "environment": "shared_dev",
      "endpoint_kind": "call_status",
      "configured_on": "mock carrier event emitter",
      "method": "POST",
      "signature_scheme": "vecells-hmac-sha256",
      "retry_profile": "duplicate_and_disorder_fixture_enabled",
      "out_of_order_risk": "yes",
      "replay_guard": "adapter-receipt-checkpoint",
      "authoritative_truth_note": "Transport or call-end status does not settle callback or request truth.",
      "source_refs": "blueprint/callback-and-clinician-messaging-loop.md",
      "notes": "Used for duplicate, dropped-call, and replay tests."
    },
    {
      "webhook_row_id": "HOOK_MOCK_RECORDING",
      "webhook_profile_ref": "wh_mock_status_and_recording",
      "provider_vendor": "Vecells Internal Voice Twin",
      "environment": "shared_dev",
      "endpoint_kind": "recording_status",
      "configured_on": "mock carrier recording policy",
      "method": "POST",
      "signature_scheme": "vecells-hmac-sha256",
      "retry_profile": "15s_plus_120s",
      "out_of_order_risk": "yes",
      "replay_guard": "recording-artifact-hash-plus-call-id",
      "authoritative_truth_note": "Recording availability is weaker than evidence readiness.",
      "source_refs": "blueprint/phase-2-identity-and-echoes.md#2F. Caller verification, voice capture, transcript stub, and SMS continuation",
      "notes": "Feeds recording_expected to recording_available transitions."
    },
    {
      "webhook_row_id": "HOOK_MOCK_TRANSCRIPT",
      "webhook_profile_ref": "wh_mock_status_and_recording",
      "provider_vendor": "Vecells Internal Voice Twin",
      "environment": "shared_dev",
      "endpoint_kind": "transcript_hook",
      "configured_on": "mock transcript worker",
      "method": "POST",
      "signature_scheme": "vecells-hmac-sha256",
      "retry_profile": "60s_plus_manual_replay",
      "out_of_order_risk": "yes",
      "replay_guard": "transcript-job-ref-plus-coverage-hash",
      "authoritative_truth_note": "Transcript results are derivations and never replace source audio.",
      "source_refs": "blueprint/phase-0-the-foundation-protocol.md; blueprint/phase-2-identity-and-echoes.md#2F. Caller verification, voice capture, transcript stub, and SMS continuation",
      "notes": "Keeps transcript readiness separate from promotion readiness."
    },
    {
      "webhook_row_id": "HOOK_MOCK_CONTINUATION",
      "webhook_profile_ref": "wh_mock_continuation_sms",
      "provider_vendor": "Vecells Internal Signal Fabric",
      "environment": "local_mock",
      "endpoint_kind": "continuation_sms_dispatch",
      "configured_on": "continuation dispatcher",
      "method": "POST",
      "signature_scheme": "vecells-hmac-sha256",
      "retry_profile": "single_retry_then_repair_queue",
      "out_of_order_risk": "no",
      "replay_guard": "access-grant-supersession-check",
      "authoritative_truth_note": "Dispatch acknowledgement does not prove patient redemption.",
      "source_refs": "blueprint/phase-2-identity-and-echoes.md#2F. Caller verification, voice capture, transcript stub, and SMS continuation",
      "notes": "Continuation uses AccessGrant semantics and must not reopen superseded links."
    },
    {
      "webhook_row_id": "HOOK_TWILIO_VOICE_URL",
      "webhook_profile_ref": "wh_provider_like_twilio",
      "provider_vendor": "Twilio",
      "environment": "provider_like_preprod",
      "endpoint_kind": "voice_url",
      "configured_on": "IncomingPhoneNumber VoiceUrl",
      "method": "POST",
      "signature_scheme": "X-Twilio-Signature",
      "retry_profile": "provider-managed-plus-adapter-dedupe",
      "out_of_order_risk": "yes",
      "replay_guard": "signature-validation-plus-receipt-checkpoint",
      "authoritative_truth_note": "Twilio voice callbacks feed canonical events only after adapter validation.",
      "source_refs": "https://www.twilio.com/docs/usage/webhooks/webhooks-security; https://www.twilio.com/docs/phone-numbers/api/incomingphonenumber-resource",
      "notes": "Maps Twilio answer flow into the same internal event seam as mock mode."
    },
    {
      "webhook_row_id": "HOOK_TWILIO_RECORDING",
      "webhook_profile_ref": "wh_provider_like_twilio",
      "provider_vendor": "Twilio",
      "environment": "provider_like_preprod",
      "endpoint_kind": "recording_status_callback",
      "configured_on": "Twilio voice config",
      "method": "POST",
      "signature_scheme": "X-Twilio-Signature",
      "retry_profile": "provider-managed-plus-adapter-dedupe",
      "out_of_order_risk": "yes",
      "replay_guard": "recording-sid-plus-call-id",
      "authoritative_truth_note": "Recording events update availability, not request completion.",
      "source_refs": "https://www.twilio.com/docs/voice/api/recording",
      "notes": "Feeds the same recording availability state machine as mock mode."
    },
    {
      "webhook_row_id": "HOOK_VONAGE_ANSWER_EVENT",
      "webhook_profile_ref": "wh_provider_like_vonage",
      "provider_vendor": "Vonage",
      "environment": "provider_like_preprod",
      "endpoint_kind": "answer_and_event",
      "configured_on": "Application answer_url and event_url",
      "method": "POST",
      "signature_scheme": "application-signature-plus-jwt-posture",
      "retry_profile": "provider-timeout-plus-adapter-dedupe",
      "out_of_order_risk": "yes",
      "replay_guard": "request-signature-plus-causal-window",
      "authoritative_truth_note": "Answer and event callbacks remain transport observations until Vecells settlement occurs.",
      "source_refs": "https://developer.vonage.com/en/getting-started/concepts/webhooks; https://developer.vonage.com/en/application/overview",
      "notes": "Vonage exposes answer_url, event_url, and fallback_answer_url as distinct controls."
    },
    {
      "webhook_row_id": "HOOK_VONAGE_NUMBER_STATUS",
      "webhook_profile_ref": "wh_provider_like_vonage",
      "provider_vendor": "Vonage",
      "environment": "provider_like_preprod",
      "endpoint_kind": "voice_status_callback",
      "configured_on": "Numbers API update",
      "method": "POST",
      "signature_scheme": "application-signature-plus-jwt-posture",
      "retry_profile": "provider-managed",
      "out_of_order_risk": "yes",
      "replay_guard": "msisdn-plus-call-id",
      "authoritative_truth_note": "Call-end status is weaker than callback resolution or intake promotion.",
      "source_refs": "https://developer.vonage.com/de/api/numbers",
      "notes": "Per-number callback configured through `voiceStatusCallback`."
    },
    {
      "webhook_row_id": "HOOK_VONAGE_RECORD_EVENT",
      "webhook_profile_ref": "wh_provider_like_vonage",
      "provider_vendor": "Vonage",
      "environment": "provider_like_preprod",
      "endpoint_kind": "record_event_url",
      "configured_on": "Application voice capability",
      "method": "POST",
      "signature_scheme": "application-signature-plus-jwt-posture",
      "retry_profile": "provider-managed",
      "out_of_order_risk": "yes",
      "replay_guard": "recording-url-plus-call-id",
      "authoritative_truth_note": "Recording callbacks widen artefact availability but do not establish routine readiness.",
      "source_refs": "https://developer.vonage.com/en/getting-started/concepts/webhooks",
      "notes": "Aligns Vonage recording events with the same internal recording state machine."
    }
  ],
  "recording_policies": [
    {
      "recording_policy_ref": "rec_default_dual_channel",
      "label": "Default dual-channel recording",
      "retention_class": "telephony_sensitive_audio_nonprod_30d",
      "fetch_profile": "provider_callback_then_fetch",
      "transcript_floor": "keyword_or_partial_then_manual_if_needed",
      "manual_review_trigger": "contradictory_capture_or_identity_drift",
      "notes": "Default for front-door rehearsal. Recording availability is expected but not sufficient for routine promotion."
    },
    {
      "recording_policy_ref": "rec_urgent_immediate_fetch",
      "label": "Urgent immediate fetch",
      "retention_class": "urgent_live_audio_locked_until_review",
      "fetch_profile": "priority_fetch_worker",
      "transcript_floor": "partial_allowed_but_urgent_live_can_open_first",
      "manual_review_trigger": "recording_missing_or_live_handoff_gap",
      "notes": "Used when urgent-live preemption can begin before routine evidence readiness."
    },
    {
      "recording_policy_ref": "rec_callback_summary_only",
      "label": "Callback summary only",
      "retention_class": "support_callback_audio_short_retention",
      "fetch_profile": "callback_outcome_bound",
      "transcript_floor": "summary_stub_only",
      "manual_review_trigger": "outcome_dispute_or_route_repair",
      "notes": "For outbound callback confirmation and support replay lanes."
    },
    {
      "recording_policy_ref": "rec_missing_blocks_routine",
      "label": "Missing recording blocks routine",
      "retention_class": "missing_recording_incident_register",
      "fetch_profile": "simulate_timeout",
      "transcript_floor": "none",
      "manual_review_trigger": "recording_missing",
      "notes": "Purpose-built degraded policy that fails closed into manual audio review and blocks routine promotion."
    }
  ],
  "ivr_profiles": [
    {
      "ivr_profile_ref": "ivr_frontdoor_general",
      "label": "Front door general",
      "menu_path": "symptoms -> meds -> admin -> results",
      "dtmf_expectations": "single_digit_route_then_identity_fragment_capture",
      "urgent_live_branch": "enabled_after_menu_and_signal_assessment",
      "continuation_policy": "bounded_seeded_or_challenge_sms_when_eligible",
      "notes": "Primary intake IVR for normal call entry."
    },
    {
      "ivr_profile_ref": "ivr_frontdoor_urgent",
      "label": "Front door urgent",
      "menu_path": "urgent -> confirm -> live_handoff",
      "dtmf_expectations": "single_digit_then_confirmatory_digit",
      "urgent_live_branch": "immediate",
      "continuation_policy": "blocked_until_urgent_live_branch_resolved",
      "notes": "Urgent path exercises SafetyPreemptionRecord and live-transfer branch semantics."
    },
    {
      "ivr_profile_ref": "ivr_support_repair",
      "label": "Support repair",
      "menu_path": "repair -> callback -> evidence_review",
      "dtmf_expectations": "support-controlled",
      "urgent_live_branch": "manual_if_contact_safety_relevant",
      "continuation_policy": "manual_route_repair_before_sms_if_needed",
      "notes": "Used for support replay, route repair, and degraded recording handling."
    },
    {
      "ivr_profile_ref": "ivr_callback_return",
      "label": "Callback return",
      "menu_path": "identity_confirm -> callback_outcome -> close_or_retry",
      "dtmf_expectations": "identity_confirmation_then_outcome",
      "urgent_live_branch": "manual_if_signal_rises",
      "continuation_policy": "not_default",
      "notes": "Used for outbound callback proof and return-call handling."
    }
  ],
  "call_scenarios": [
    {
      "scenario_id": "inbound_standard_continuation",
      "label": "Inbound call with continuation eligibility",
      "direction": "inbound",
      "number_id": "NUM_TEL_FRONTDOOR_GENERAL",
      "summary": "Patient completes menu selection, partial identity, recording, and becomes continuation-eligible before routine evidence is ready.",
      "state_path": [
        "initiated",
        "menu_selected",
        "identity_in_progress",
        "identity_partial",
        "recording_expected",
        "recording_available",
        "evidence_preparing",
        "evidence_pending",
        "continuation_eligible",
        "continuation_sent"
      ],
      "terminal_state": "continuation_sent",
      "urgent_state": "routine_review",
      "recording_state": "available",
      "transcript_state": "partial",
      "continuation_state": "eligible_then_sent",
      "webhook_state": "healthy"
    },
    {
      "scenario_id": "urgent_live_preemption",
      "label": "Urgent live preemption",
      "direction": "inbound",
      "number_id": "NUM_TEL_FRONTDOOR_URGENT",
      "summary": "Urgent-live assessment opens immediately after menu selection while recording and transcript processing continue in the background.",
      "state_path": [
        "initiated",
        "menu_selected",
        "urgent_live_only",
        "recording_expected",
        "recording_available",
        "evidence_preparing",
        "manual_followup_required",
        "closed"
      ],
      "terminal_state": "closed",
      "urgent_state": "urgent_live_required",
      "recording_state": "available",
      "transcript_state": "queued",
      "continuation_state": "blocked",
      "webhook_state": "healthy"
    },
    {
      "scenario_id": "recording_missing_manual_review",
      "label": "Recording missing, manual review only",
      "direction": "inbound",
      "number_id": "NUM_TEL_RECORDING_DEGRADED",
      "summary": "Provider promises a recording that never arrives, forcing a manual-audio-review disposition and blocking routine promotion.",
      "state_path": [
        "initiated",
        "menu_selected",
        "identity_resolved",
        "recording_expected",
        "recording_missing",
        "manual_audio_review_required"
      ],
      "terminal_state": "manual_audio_review_required",
      "urgent_state": "routine_review",
      "recording_state": "missing",
      "transcript_state": "not_started",
      "continuation_state": "blocked",
      "webhook_state": "healthy"
    },
    {
      "scenario_id": "webhook_signature_retry",
      "label": "Webhook signature retry",
      "direction": "inbound",
      "number_id": "NUM_TEL_PROVIDER_TWILIO",
      "summary": "A provider-like callback lands with a failed signature check, then recovers on replay-safe retry.",
      "state_path": [
        "initiated",
        "menu_selected",
        "identity_partial",
        "recording_expected",
        "recording_available",
        "evidence_preparing",
        "webhook_signature_failed",
        "webhook_retry_pending"
      ],
      "terminal_state": "webhook_retry_pending",
      "urgent_state": "routine_review",
      "recording_state": "available",
      "transcript_state": "queued",
      "continuation_state": "blocked",
      "webhook_state": "signature_failed"
    },
    {
      "scenario_id": "outbound_callback_settled",
      "label": "Outbound callback settled",
      "direction": "outbound",
      "number_id": "NUM_TEL_CALLBACK_OUTBOUND",
      "summary": "Support-owned callback reaches a durable outcome with recording present and no continuation needed.",
      "state_path": [
        "initiated",
        "identity_in_progress",
        "identity_resolved",
        "recording_expected",
        "recording_available",
        "evidence_preparing",
        "evidence_ready",
        "submitted",
        "closed"
      ],
      "terminal_state": "closed",
      "urgent_state": "routine_review",
      "recording_state": "verified",
      "transcript_state": "ready",
      "continuation_state": "not_needed",
      "webhook_state": "healthy"
    },
    {
      "scenario_id": "provider_like_vonage_disorder",
      "label": "Provider-like disorder with Vonage fallback",
      "direction": "inbound",
      "number_id": "NUM_TEL_PROVIDER_VONAGE",
      "summary": "Vonage-shaped answer and event callbacks arrive out of order, with fallback answer handling still feeding the same canonical call session.",
      "state_path": [
        "initiated",
        "menu_selected",
        "identity_partial",
        "recording_expected",
        "provider_error",
        "recording_available",
        "evidence_preparing",
        "evidence_pending"
      ],
      "terminal_state": "evidence_pending",
      "urgent_state": "routine_review",
      "recording_state": "available",
      "transcript_state": "running",
      "continuation_state": "under_review",
      "webhook_state": "fallback_recovered"
    }
  ],
  "seeded_calls": [
    {
      "call_id": "CALL-LAB-4101",
      "scenario_id": "inbound_standard_continuation",
      "number_id": "NUM_TEL_FRONTDOOR_GENERAL",
      "direction": "inbound",
      "caller_ref": "synthetic-caller-alpha",
      "created_at": "2026-04-09T08:20:00Z",
      "status": "continuation_sent",
      "summary": "Standard front-door call with bounded continuation grant.",
      "ivr_profile_ref": "ivr_frontdoor_general",
      "recording_policy_ref": "rec_default_dual_channel",
      "webhook_profile_ref": "wh_mock_inbound_stack",
      "urgent_state": "routine_review",
      "recording_state": "available",
      "transcript_state": "partial",
      "continuation_state": "eligible_then_sent",
      "webhook_state": "healthy",
      "events": [
        {
          "event_id": "CALL-LAB-4101-1",
          "state": "initiated",
          "label": "initiated",
          "tone": "default",
          "detail": "Call session created and the telephony lineage opened.",
          "at": "2026-04-09T08:20:00Z"
        },
        {
          "event_id": "CALL-LAB-4101-2",
          "state": "menu_selected",
          "label": "menu selected",
          "tone": "default",
          "detail": "IVR route selected and urgent-live assessment refreshed.",
          "at": "2026-04-09T08:22:00Z"
        },
        {
          "event_id": "CALL-LAB-4101-3",
          "state": "identity_in_progress",
          "label": "identity in progress",
          "tone": "default",
          "detail": "Identity fragments are still being captured.",
          "at": "2026-04-09T08:24:00Z"
        },
        {
          "event_id": "CALL-LAB-4101-4",
          "state": "identity_partial",
          "label": "identity partial",
          "tone": "default",
          "detail": "Identity confidence is bounded but not final.",
          "at": "2026-04-09T08:26:00Z"
        },
        {
          "event_id": "CALL-LAB-4101-5",
          "state": "recording_expected",
          "label": "recording expected",
          "tone": "default",
          "detail": "Provider or mock carrier promised a recording artefact.",
          "at": "2026-04-09T08:28:00Z"
        },
        {
          "event_id": "CALL-LAB-4101-6",
          "state": "recording_available",
          "label": "recording available",
          "tone": "default",
          "detail": "Recording artefact landed and can feed transcript readiness.",
          "at": "2026-04-09T08:30:00Z"
        },
        {
          "event_id": "CALL-LAB-4101-7",
          "state": "evidence_preparing",
          "label": "evidence preparing",
          "tone": "default",
          "detail": "Transcript and structured fact extraction are running.",
          "at": "2026-04-09T08:32:00Z"
        },
        {
          "event_id": "CALL-LAB-4101-8",
          "state": "evidence_pending",
          "label": "evidence pending",
          "tone": "review",
          "detail": "Raw evidence exists but no safety-usable verdict is settled.",
          "at": "2026-04-09T08:34:00Z"
        },
        {
          "event_id": "CALL-LAB-4101-9",
          "state": "continuation_eligible",
          "label": "continuation eligible",
          "tone": "review",
          "detail": "SMS continuation may open, but routine promotion is still blocked.",
          "at": "2026-04-09T08:36:00Z"
        },
        {
          "event_id": "CALL-LAB-4101-10",
          "state": "continuation_sent",
          "label": "continuation sent",
          "tone": "review",
          "detail": "A bounded continuation AccessGrant was issued.",
          "at": "2026-04-09T08:38:00Z"
        }
      ],
      "can_advance": false,
      "can_retry_webhook": false
    },
    {
      "call_id": "CALL-LAB-4102",
      "scenario_id": "urgent_live_preemption",
      "number_id": "NUM_TEL_FRONTDOOR_URGENT",
      "direction": "inbound",
      "caller_ref": "synthetic-caller-bravo",
      "created_at": "2026-04-09T08:34:00Z",
      "status": "closed",
      "summary": "Urgent live branch opened before routine readiness.",
      "ivr_profile_ref": "ivr_frontdoor_urgent",
      "recording_policy_ref": "rec_urgent_immediate_fetch",
      "webhook_profile_ref": "wh_mock_inbound_stack",
      "urgent_state": "urgent_live_required",
      "recording_state": "available",
      "transcript_state": "queued",
      "continuation_state": "blocked",
      "webhook_state": "healthy",
      "events": [
        {
          "event_id": "CALL-LAB-4102-1",
          "state": "initiated",
          "label": "initiated",
          "tone": "default",
          "detail": "Call session created and the telephony lineage opened.",
          "at": "2026-04-09T08:34:00Z"
        },
        {
          "event_id": "CALL-LAB-4102-2",
          "state": "menu_selected",
          "label": "menu selected",
          "tone": "default",
          "detail": "IVR route selected and urgent-live assessment refreshed.",
          "at": "2026-04-09T08:36:00Z"
        },
        {
          "event_id": "CALL-LAB-4102-3",
          "state": "urgent_live_only",
          "label": "urgent live only",
          "tone": "blocked",
          "detail": "Urgent-live handling opened while routine promotion remains blocked.",
          "at": "2026-04-09T08:38:00Z"
        },
        {
          "event_id": "CALL-LAB-4102-4",
          "state": "recording_expected",
          "label": "recording expected",
          "tone": "default",
          "detail": "Provider or mock carrier promised a recording artefact.",
          "at": "2026-04-09T08:40:00Z"
        },
        {
          "event_id": "CALL-LAB-4102-5",
          "state": "recording_available",
          "label": "recording available",
          "tone": "default",
          "detail": "Recording artefact landed and can feed transcript readiness.",
          "at": "2026-04-09T08:42:00Z"
        },
        {
          "event_id": "CALL-LAB-4102-6",
          "state": "evidence_preparing",
          "label": "evidence preparing",
          "tone": "default",
          "detail": "Transcript and structured fact extraction are running.",
          "at": "2026-04-09T08:44:00Z"
        },
        {
          "event_id": "CALL-LAB-4102-7",
          "state": "manual_followup_required",
          "label": "manual followup required",
          "tone": "default",
          "detail": "Urgent-live assessment opens immediately after menu selection while recording and transcript processing continue in the background.",
          "at": "2026-04-09T08:46:00Z"
        },
        {
          "event_id": "CALL-LAB-4102-8",
          "state": "closed",
          "label": "closed",
          "tone": "success",
          "detail": "The current branch is closed without implying broader request closure authority.",
          "at": "2026-04-09T08:48:00Z"
        }
      ],
      "can_advance": false,
      "can_retry_webhook": false
    },
    {
      "call_id": "CALL-LAB-4103",
      "scenario_id": "recording_missing_manual_review",
      "number_id": "NUM_TEL_RECORDING_DEGRADED",
      "direction": "inbound",
      "caller_ref": "synthetic-caller-charlie",
      "created_at": "2026-04-09T09:02:00Z",
      "status": "manual_audio_review_required",
      "summary": "Recording timed out and blocked routine promotion.",
      "ivr_profile_ref": "ivr_support_repair",
      "recording_policy_ref": "rec_missing_blocks_routine",
      "webhook_profile_ref": "wh_mock_status_and_recording",
      "urgent_state": "routine_review",
      "recording_state": "missing",
      "transcript_state": "not_started",
      "continuation_state": "blocked",
      "webhook_state": "healthy",
      "events": [
        {
          "event_id": "CALL-LAB-4103-1",
          "state": "initiated",
          "label": "initiated",
          "tone": "default",
          "detail": "Call session created and the telephony lineage opened.",
          "at": "2026-04-09T09:02:00Z"
        },
        {
          "event_id": "CALL-LAB-4103-2",
          "state": "menu_selected",
          "label": "menu selected",
          "tone": "default",
          "detail": "IVR route selected and urgent-live assessment refreshed.",
          "at": "2026-04-09T09:04:00Z"
        },
        {
          "event_id": "CALL-LAB-4103-3",
          "state": "identity_resolved",
          "label": "identity resolved",
          "tone": "default",
          "detail": "Identity threshold cleared for this call session.",
          "at": "2026-04-09T09:06:00Z"
        },
        {
          "event_id": "CALL-LAB-4103-4",
          "state": "recording_expected",
          "label": "recording expected",
          "tone": "default",
          "detail": "Provider or mock carrier promised a recording artefact.",
          "at": "2026-04-09T09:08:00Z"
        },
        {
          "event_id": "CALL-LAB-4103-5",
          "state": "recording_missing",
          "label": "recording missing",
          "tone": "blocked",
          "detail": "Recording promise timed out or returned unusable media.",
          "at": "2026-04-09T09:10:00Z"
        },
        {
          "event_id": "CALL-LAB-4103-6",
          "state": "manual_audio_review_required",
          "label": "manual audio review required",
          "tone": "blocked",
          "detail": "Manual review is required before the normal intake path may continue.",
          "at": "2026-04-09T09:12:00Z"
        }
      ],
      "can_advance": false,
      "can_retry_webhook": false
    },
    {
      "call_id": "CALL-LAB-4104",
      "scenario_id": "webhook_signature_retry",
      "number_id": "NUM_TEL_PROVIDER_TWILIO",
      "direction": "inbound",
      "caller_ref": "synthetic-caller-delta",
      "created_at": "2026-04-09T09:19:00Z",
      "status": "webhook_retry_pending",
      "summary": "Signature failure waiting for retry-safe replay.",
      "ivr_profile_ref": "ivr_frontdoor_general",
      "recording_policy_ref": "rec_default_dual_channel",
      "webhook_profile_ref": "wh_provider_like_twilio",
      "urgent_state": "routine_review",
      "recording_state": "available",
      "transcript_state": "queued",
      "continuation_state": "blocked",
      "webhook_state": "signature_failed",
      "events": [
        {
          "event_id": "CALL-LAB-4104-1",
          "state": "initiated",
          "label": "initiated",
          "tone": "default",
          "detail": "Call session created and the telephony lineage opened.",
          "at": "2026-04-09T09:19:00Z"
        },
        {
          "event_id": "CALL-LAB-4104-2",
          "state": "menu_selected",
          "label": "menu selected",
          "tone": "default",
          "detail": "IVR route selected and urgent-live assessment refreshed.",
          "at": "2026-04-09T09:21:00Z"
        },
        {
          "event_id": "CALL-LAB-4104-3",
          "state": "identity_partial",
          "label": "identity partial",
          "tone": "default",
          "detail": "Identity confidence is bounded but not final.",
          "at": "2026-04-09T09:23:00Z"
        },
        {
          "event_id": "CALL-LAB-4104-4",
          "state": "recording_expected",
          "label": "recording expected",
          "tone": "default",
          "detail": "Provider or mock carrier promised a recording artefact.",
          "at": "2026-04-09T09:25:00Z"
        },
        {
          "event_id": "CALL-LAB-4104-5",
          "state": "recording_available",
          "label": "recording available",
          "tone": "default",
          "detail": "Recording artefact landed and can feed transcript readiness.",
          "at": "2026-04-09T09:27:00Z"
        },
        {
          "event_id": "CALL-LAB-4104-6",
          "state": "evidence_preparing",
          "label": "evidence preparing",
          "tone": "default",
          "detail": "Transcript and structured fact extraction are running.",
          "at": "2026-04-09T09:29:00Z"
        },
        {
          "event_id": "CALL-LAB-4104-7",
          "state": "webhook_signature_failed",
          "label": "webhook signature failed",
          "tone": "caution",
          "detail": "Incoming callback failed signature validation and opened replay-safe recovery.",
          "at": "2026-04-09T09:31:00Z"
        },
        {
          "event_id": "CALL-LAB-4104-8",
          "state": "webhook_retry_pending",
          "label": "webhook retry pending",
          "tone": "caution",
          "detail": "Webhook replay window is open but unsettled.",
          "at": "2026-04-09T09:33:00Z"
        }
      ],
      "can_advance": true,
      "can_retry_webhook": true
    },
    {
      "call_id": "CALL-LAB-4105",
      "scenario_id": "outbound_callback_settled",
      "number_id": "NUM_TEL_CALLBACK_OUTBOUND",
      "direction": "outbound",
      "caller_ref": "synthetic-caller-echo",
      "created_at": "2026-04-09T10:01:00Z",
      "status": "closed",
      "summary": "Support callback settled with durable recording proof.",
      "ivr_profile_ref": "ivr_callback_return",
      "recording_policy_ref": "rec_callback_summary_only",
      "webhook_profile_ref": "wh_mock_status_and_recording",
      "urgent_state": "routine_review",
      "recording_state": "verified",
      "transcript_state": "ready",
      "continuation_state": "not_needed",
      "webhook_state": "healthy",
      "events": [
        {
          "event_id": "CALL-LAB-4105-1",
          "state": "initiated",
          "label": "initiated",
          "tone": "default",
          "detail": "Call session created and the telephony lineage opened.",
          "at": "2026-04-09T10:01:00Z"
        },
        {
          "event_id": "CALL-LAB-4105-2",
          "state": "identity_in_progress",
          "label": "identity in progress",
          "tone": "default",
          "detail": "Identity fragments are still being captured.",
          "at": "2026-04-09T10:03:00Z"
        },
        {
          "event_id": "CALL-LAB-4105-3",
          "state": "identity_resolved",
          "label": "identity resolved",
          "tone": "default",
          "detail": "Identity threshold cleared for this call session.",
          "at": "2026-04-09T10:05:00Z"
        },
        {
          "event_id": "CALL-LAB-4105-4",
          "state": "recording_expected",
          "label": "recording expected",
          "tone": "default",
          "detail": "Provider or mock carrier promised a recording artefact.",
          "at": "2026-04-09T10:07:00Z"
        },
        {
          "event_id": "CALL-LAB-4105-5",
          "state": "recording_available",
          "label": "recording available",
          "tone": "default",
          "detail": "Recording artefact landed and can feed transcript readiness.",
          "at": "2026-04-09T10:09:00Z"
        },
        {
          "event_id": "CALL-LAB-4105-6",
          "state": "evidence_preparing",
          "label": "evidence preparing",
          "tone": "default",
          "detail": "Transcript and structured fact extraction are running.",
          "at": "2026-04-09T10:11:00Z"
        },
        {
          "event_id": "CALL-LAB-4105-7",
          "state": "evidence_ready",
          "label": "evidence ready",
          "tone": "success",
          "detail": "Support-owned callback reaches a durable outcome with recording present and no continuation needed.",
          "at": "2026-04-09T10:13:00Z"
        },
        {
          "event_id": "CALL-LAB-4105-8",
          "state": "submitted",
          "label": "submitted",
          "tone": "success",
          "detail": "Call evidence entered the canonical intake convergence path after readiness.",
          "at": "2026-04-09T10:15:00Z"
        },
        {
          "event_id": "CALL-LAB-4105-9",
          "state": "closed",
          "label": "closed",
          "tone": "success",
          "detail": "The current branch is closed without implying broader request closure authority.",
          "at": "2026-04-09T10:17:00Z"
        }
      ],
      "can_advance": false,
      "can_retry_webhook": false
    },
    {
      "call_id": "CALL-LAB-4106",
      "scenario_id": "provider_like_vonage_disorder",
      "number_id": "NUM_TEL_PROVIDER_VONAGE",
      "direction": "inbound",
      "caller_ref": "synthetic-caller-foxtrot",
      "created_at": "2026-04-09T10:21:00Z",
      "status": "evidence_pending",
      "summary": "Out-of-order provider-like callbacks preserved through one canonical event chain.",
      "ivr_profile_ref": "ivr_frontdoor_general",
      "recording_policy_ref": "rec_default_dual_channel",
      "webhook_profile_ref": "wh_provider_like_vonage",
      "urgent_state": "routine_review",
      "recording_state": "available",
      "transcript_state": "running",
      "continuation_state": "under_review",
      "webhook_state": "fallback_recovered",
      "events": [
        {
          "event_id": "CALL-LAB-4106-1",
          "state": "initiated",
          "label": "initiated",
          "tone": "default",
          "detail": "Call session created and the telephony lineage opened.",
          "at": "2026-04-09T10:21:00Z"
        },
        {
          "event_id": "CALL-LAB-4106-2",
          "state": "menu_selected",
          "label": "menu selected",
          "tone": "default",
          "detail": "IVR route selected and urgent-live assessment refreshed.",
          "at": "2026-04-09T10:23:00Z"
        },
        {
          "event_id": "CALL-LAB-4106-3",
          "state": "identity_partial",
          "label": "identity partial",
          "tone": "default",
          "detail": "Identity confidence is bounded but not final.",
          "at": "2026-04-09T10:25:00Z"
        },
        {
          "event_id": "CALL-LAB-4106-4",
          "state": "recording_expected",
          "label": "recording expected",
          "tone": "default",
          "detail": "Provider or mock carrier promised a recording artefact.",
          "at": "2026-04-09T10:27:00Z"
        },
        {
          "event_id": "CALL-LAB-4106-5",
          "state": "provider_error",
          "label": "provider error",
          "tone": "caution",
          "detail": "Provider-like callback sequence degraded and invoked fallback behavior.",
          "at": "2026-04-09T10:29:00Z"
        },
        {
          "event_id": "CALL-LAB-4106-6",
          "state": "recording_available",
          "label": "recording available",
          "tone": "default",
          "detail": "Recording artefact landed and can feed transcript readiness.",
          "at": "2026-04-09T10:31:00Z"
        },
        {
          "event_id": "CALL-LAB-4106-7",
          "state": "evidence_preparing",
          "label": "evidence preparing",
          "tone": "default",
          "detail": "Transcript and structured fact extraction are running.",
          "at": "2026-04-09T10:33:00Z"
        },
        {
          "event_id": "CALL-LAB-4106-8",
          "state": "evidence_pending",
          "label": "evidence pending",
          "tone": "review",
          "detail": "Raw evidence exists but no safety-usable verdict is settled.",
          "at": "2026-04-09T10:35:00Z"
        }
      ],
      "can_advance": true,
      "can_retry_webhook": false
    }
  ],
  "live_gate_pack": {
    "task_id": "seq_032",
    "generated_at": "2026-04-09T21:49:07.351267+00:00",
    "captured_on": "2026-04-09",
    "phase0_verdict": "withheld",
    "current_creation_posture": "blocked",
    "current_spend_posture": "blocked",
    "required_env": [
      "TELEPHONY_VENDOR_ID",
      "TELEPHONY_NAMED_APPROVER",
      "TELEPHONY_TARGET_ENVIRONMENT",
      "TELEPHONY_CALLBACK_BASE_URL",
      "TELEPHONY_RECORDING_POLICY_REF",
      "TELEPHONY_NUMBER_PROFILE_REF",
      "TELEPHONY_SPEND_CAP_GBP",
      "TELEPHONY_WEBHOOK_SECRET_REF",
      "ALLOW_REAL_PROVIDER_MUTATION",
      "ALLOW_SPEND"
    ],
    "allowed_vendor_ids": [
      "twilio_telephony_ivr",
      "vonage_telephony_ivr"
    ],
    "selector_map": {
      "base_profile": {
        "mode_toggle_actual": "[data-testid='mode-toggle-actual']",
        "page_tab_live_gates": "[data-testid='page-tab-Live_Gates_and_Spend_Controls']",
        "field_vendor": "[data-testid='actual-field-telephony-vendor-id']",
        "field_approver": "[data-testid='actual-field-named-approver']",
        "field_environment": "[data-testid='actual-field-target-environment']",
        "field_callback_base": "[data-testid='actual-field-callback-base-url']",
        "field_recording_policy": "[data-testid='actual-field-recording-policy-ref']",
        "field_number_profile": "[data-testid='actual-field-number-profile-ref']",
        "field_spend_cap": "[data-testid='actual-field-spend-cap-gbp']",
        "field_secret_ref": "[data-testid='actual-field-webhook-secret-ref']",
        "field_allow_mutation": "[data-testid='actual-field-allow-mutation']",
        "field_allow_spend": "[data-testid='actual-field-allow-spend']",
        "final_submit": "[data-testid='actual-submit-button']"
      }
    },
    "official_label_checks": {
      "twilio_subaccounts": {
        "url": "https://www.twilio.com/docs/iam/api/subaccounts",
        "expected": [
          "Twilio deletes closed subaccounts 30 days after closure."
        ]
      },
      "twilio_webhooks": {
        "url": "https://www.twilio.com/docs/usage/webhooks/webhooks-security",
        "expected": [
          "X-Twilio-Signature"
        ]
      },
      "twilio_number_pricing": {
        "url": "https://www.twilio.com/en-us/voice/pricing/gb",
        "expected": [
          "instantly provisioned via Twilio console or number provisioning API"
        ]
      },
      "vonage_voice_getting_started": {
        "url": "https://developer.vonage.com/en/voice/voice-api/getting-started",
        "expected": [
          "123456789",
          "add credit to your account"
        ]
      },
      "vonage_webhooks": {
        "url": "https://developer.vonage.com/en/getting-started/concepts/webhooks",
        "expected": [
          "answer_url",
          "event_url",
          "fallback_answer_url"
        ]
      },
      "vonage_numbers_api": {
        "url": "https://developer.vonage.com/de/api/numbers",
        "expected": [
          "Search available numbers",
          "Buy a number",
          "Cancel a number",
          "Update a number"
        ]
      }
    },
    "live_gates": [
      {
        "gate_id": "TEL_LIVE_GATE_PHASE0_EXTERNAL_READY",
        "status": "blocked",
        "class": "programme",
        "summary": "Phase 0 external-readiness chain is still withheld.",
        "reason": "Current baseline verdict remains withheld, so no live telephony mutation may start.",
        "required_evidence": "data/analysis/phase0_gate_verdict.json"
      },
      {
        "gate_id": "TEL_LIVE_GATE_VENDOR_APPROVED",
        "status": "review_required",
        "class": "vendor",
        "summary": "The target vendor must be one of the task 031 telephony shortlist entries.",
        "reason": "Shortlist exists, but a live target vendor has not been selected for mutation.",
        "required_evidence": "data/analysis/31_vendor_shortlist.json"
      },
      {
        "gate_id": "TEL_LIVE_GATE_WORKSPACE_OWNERSHIP",
        "status": "pass",
        "class": "governance",
        "summary": "Owner and backup owner roles are already defined for telephony accounts and numbers.",
        "reason": "Task 023 established owner and backup-owner roles for telephony secrets and number ranges.",
        "required_evidence": "data/analysis/external_account_inventory.csv"
      },
      {
        "gate_id": "TEL_LIVE_GATE_WEBHOOK_SECURITY_PACK",
        "status": "review_required",
        "class": "security",
        "summary": "Webhook base URLs, signature validation, replay defense, and endpoint mapping must be explicit.",
        "reason": "The pack defines the model, but no live callback base URL or vault-backed secret set is yet approved.",
        "required_evidence": "data/analysis/32_telephony_webhook_matrix.csv"
      },
      {
        "gate_id": "TEL_LIVE_GATE_RECORDING_REVIEW_APPROVED",
        "status": "review_required",
        "class": "safety",
        "summary": "Recording retention, transcript floor, and missing-recording posture must be reviewed.",
        "reason": "The retention and evidence-readiness model is defined but not approved for a real vendor environment.",
        "required_evidence": "docs/external/32_telephony_webhook_and_recording_config_strategy.md"
      },
      {
        "gate_id": "TEL_LIVE_GATE_PROCUREMENT_AND_SPEND_AUTHORITY",
        "status": "blocked",
        "class": "commercial",
        "summary": "Spend authority and procurement posture must be explicit before account or number creation.",
        "reason": "Both shortlisted vendors make number creation a commercial action.",
        "required_evidence": "docs/external/32_telephony_live_gate_and_spend_controls.md"
      },
      {
        "gate_id": "TEL_LIVE_GATE_NAMED_APPROVER",
        "status": "blocked",
        "class": "governance",
        "summary": "A named approver is required before any real mutation path.",
        "reason": "No named approver is currently bound to the telephony lane.",
        "required_evidence": "runtime env TELEPHONY_NAMED_APPROVER"
      },
      {
        "gate_id": "TEL_LIVE_GATE_ENVIRONMENT_TARGET",
        "status": "review_required",
        "class": "environment",
        "summary": "The target environment must be explicit and not inferred from provider defaults.",
        "reason": "The pack supports provider-like preprod and production, but no live target is approved.",
        "required_evidence": "runtime env TELEPHONY_TARGET_ENVIRONMENT"
      },
      {
        "gate_id": "TEL_LIVE_GATE_MUTATION_AND_SPEND_FLAGS",
        "status": "blocked",
        "class": "runtime_guard",
        "summary": "Live mutation and spend flags remain false by default.",
        "reason": "Real provider mutation stays fail-closed until explicit env gates are true.",
        "required_evidence": "ALLOW_REAL_PROVIDER_MUTATION=true; ALLOW_SPEND=true"
      },
      {
        "gate_id": "TEL_LIVE_GATE_FINAL_POSTURE",
        "status": "blocked",
        "class": "final",
        "summary": "Current real account and number creation posture is blocked.",
        "reason": "The local lab is ready now, but live account creation remains blocked until all gates pass.",
        "required_evidence": "All prior gates plus final governance acknowledgement."
      }
    ],
    "summary": {
      "live_gate_count": 10,
      "blocked_count": 5,
      "review_required_count": 4,
      "pass_count": 1
    }
  },
  "mock_service": {
    "base_url_default": "http://127.0.0.1:4180",
    "sandbox_path_default": "http://127.0.0.1:4180/",
    "non_routable_namespace": "MOCK:+44-VC-XXXX",
    "ports": {
      "carrier": 4180,
      "lab_preview": 4181
    }
  },
  "summary": {
    "number_count": 10,
    "field_count": 33,
    "webhook_row_count": 10,
    "recording_policy_count": 4,
    "ivr_profile_count": 4,
    "live_gate_count": 10,
    "blocked_live_gate_count": 5,
    "review_live_gate_count": 4,
    "pass_live_gate_count": 1,
    "scenario_count": 6,
    "seeded_call_count": 6,
    "selected_secret_count": 7,
    "selected_vendor_count": 2,
    "selected_risk_count": 6
  }
};
        export type TelephonyLabPack = typeof telephonyLabPack;
