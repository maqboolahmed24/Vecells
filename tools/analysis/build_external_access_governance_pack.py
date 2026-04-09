#!/usr/bin/env python3
from __future__ import annotations

import csv
import html
import json
import textwrap
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "external"
PROMPT_DIR = ROOT / "prompt"

REQUIRED_INPUTS = {
    "external_dependencies": DATA_DIR / "external_dependencies.json",
    "integration_priority_matrix": DATA_DIR / "integration_priority_matrix.json",
    "mock_live_lane_assignments": DATA_DIR / "mock_live_lane_assignments.json",
    "provider_family_scorecards": DATA_DIR / "provider_family_scorecards.json",
    "runtime_workload_families": DATA_DIR / "runtime_workload_families.json",
    "security_control_matrix": DATA_DIR / "security_control_matrix.csv",
    "master_risk_register": DATA_DIR / "master_risk_register.json",
    "phase0_gate_verdict": DATA_DIR / "phase0_gate_verdict.json",
    "coverage_summary": DATA_DIR / "coverage_summary.json",
}

STRATEGY_MD_PATH = DOCS_DIR / "23_sandbox_account_strategy.md"
ROTATION_MD_PATH = DOCS_DIR / "23_secret_ownership_and_rotation_model.md"
MOCK_MD_PATH = DOCS_DIR / "23_mock_account_bootstrap_plan.md"
GOVERNANCE_MD_PATH = DOCS_DIR / "23_actual_partner_account_governance.md"
RUNBOOK_MD_PATH = DOCS_DIR / "23_credential_ingest_and_redaction_runbook.md"
COCKPIT_HTML_PATH = DOCS_DIR / "23_external_access_governance_cockpit.html"

INVENTORY_CSV_PATH = DATA_DIR / "external_account_inventory.csv"
CLASSIFICATION_CSV_PATH = DATA_DIR / "secret_classification_matrix.csv"
OWNERSHIP_JSON_PATH = DATA_DIR / "secret_ownership_map.json"
SEED_PLAN_JSON_PATH = DATA_DIR / "mock_account_seed_plan.json"
CAPTURE_CHECKLIST_CSV_PATH = DATA_DIR / "credential_capture_checklist.csv"

MISSION = (
    "Freeze the authoritative sandbox-account, test-account, environment-credential, "
    "vault-ingest, and owner-chain model for Vecells external integrations across "
    "mock-now execution and later real-provider onboarding."
)

VISUAL_MODE = "Credential_Observatory"

SOURCE_PRECEDENCE = [
    "prompt/023.md",
    "prompt/shared_operating_contract_021_to_025.md",
    "blueprint/phase-0-the-foundation-protocol.md",
    "blueprint/phase-2-the-identity-and-echoes.md",
    "blueprint/phase-4-the-booking-engine.md",
    "blueprint/phase-6-the-pharmacy-loop.md",
    "blueprint/phase-7-inside-the-nhs-app.md",
    "blueprint/platform-runtime-and-release-blueprint.md",
    "blueprint/forensic-audit-findings.md",
    "data/analysis/external_dependencies.json",
    "data/analysis/integration_priority_matrix.json",
    "data/analysis/mock_live_lane_assignments.json",
    "data/analysis/provider_family_scorecards.json",
    "data/analysis/runtime_workload_families.json",
    "data/analysis/security_control_matrix.csv",
    "data/analysis/master_risk_register.json",
    "data/analysis/phase0_gate_verdict.json",
]

ENVIRONMENT_ORDER = [
    "local_mock",
    "ci_mock",
    "shared_dev",
    "sandpit",
    "integration",
    "preprod",
    "production",
]

RECORD_CLASS_ORDER = [
    "account",
    "test_user",
    "service_principal",
    "client_registration",
    "client_secret",
    "private_key",
    "public_key",
    "webhook_secret",
    "mailbox_credential",
    "phone_number",
    "sender_identity",
    "signing_key",
    "sandbox_dataset",
    "other",
]

HTML_MARKERS = [
    'data-testid="access-gov-shell"',
    'data-testid="access-posture-banner"',
    'data-testid="access-family-filter"',
    'data-testid="access-environment-filter"',
    'data-testid="access-inventory-table"',
    'data-testid="secret-class-matrix"',
    'data-testid="rotation-schedule-strip"',
    'data-testid="access-inspector"',
    'data-testid="credential-flow-diagram"',
    'data-testid="credential-flow-parity-table"',
]

INTEGRATION_LINKS = {
    "identity_auth": "int_identity_nhs_login_core",
    "patient_data_enrichment": "int_identity_pds_optional_enrichment",
    "telephony": "int_telephony_capture_evidence_backplane",
    "transcription": "int_telephony_capture_evidence_backplane",
    "sms": "int_sms_continuation_delivery",
    "email": "int_email_notification_delivery",
    "malware_scanning": "int_telephony_capture_evidence_backplane",
    "gp_system": "int_im1_pairing_and_capability_prereq",
    "booking_supplier": "int_local_booking_provider_truth",
    "network_capacity": "int_network_capacity_and_practice_ack",
    "messaging_transport": "int_cross_org_secure_messaging",
    "pharmacy_directory": "int_pharmacy_directory_and_choice",
    "pharmacy_transport": "int_pharmacy_dispatch_and_urgent_return",
    "pharmacy_outcome": "int_pharmacy_outcome_reconciliation",
    "embedded_channel": "int_nhs_app_embedded_channel",
    "model_vendor": "int_assistive_vendor_boundary",
}

ROLE_CATALOG = {
    "ROLE_IDENTITY_PARTNER_MANAGER": "Owns NHS login and identity-partner account posture.",
    "ROLE_INTEROPERABILITY_LEAD": "Owns NHS and partner interoperability onboarding across IM1, MESH, PDS, and route proofs.",
    "ROLE_COMMUNICATIONS_PLATFORM_LEAD": "Owns telephony, notifications, transcript, and scanning provider posture.",
    "ROLE_BOOKING_DOMAIN_LEAD": "Owns booking-supplier policy and confirmation-truth gates.",
    "ROLE_NETWORK_COORDINATION_OWNER": "Owns network-capacity and practice acknowledgement bindings.",
    "ROLE_PHARMACY_PARTNER_OWNER": "Owns pharmacy directory and transport partner posture.",
    "ROLE_PHARMACY_DOMAIN_LEAD": "Owns pharmacy outcome and professional-route semantics.",
    "ROLE_EMBEDDED_CHANNEL_LEAD": "Owns deferred NHS App channel onboarding posture.",
    "ROLE_AI_GOVERNANCE_LEAD": "Owns future-optional model vendor onboarding posture.",
    "ROLE_PARTNER_ONBOARDING_LEAD": "Creates partner account requests and coordinates capture sessions.",
    "ROLE_SECURITY_LEAD": "Owns secret-handling policy, vault law, and revocation approval.",
    "ROLE_OPERATIONS_LEAD": "Owns live operational runbooks, phone-number control, and mailbox escalation posture.",
    "ROLE_GOVERNANCE_LEAD": "Approves regulated or policy-sensitive widening actions.",
    "ROLE_MANUFACTURER_CSO": "Approves clinically sensitive transcript and safety-bearing provider changes.",
    "ROLE_DPO": "Approves privacy-sensitive enrichment or model-vendor access changes.",
    "ROLE_PROGRAMME_ARCHITECT": "Owns exact publication, route, and environment-parity law.",
    "ROLE_SUPPORT_LEAD": "Owns wrong-recipient, bounced-delivery, and recovery pathways.",
}

STORAGE_BACKENDS = [
    {
        "storage_backend": "local_ephemeral_secret_store",
        "trust_zone": "tz_stateful_data",
        "usage_class": "local_mock_only",
        "summary": "Developer-machine secret store outside the repository and outside captured test artifacts.",
    },
    {
        "storage_backend": "ci_ephemeral_secret_store",
        "trust_zone": "tz_assurance_security",
        "usage_class": "ci_mock_only",
        "summary": "Short-lived CI secret injection, reset every run, never written into build output.",
    },
    {
        "storage_backend": "shared_nonprod_fixture_registry",
        "trust_zone": "tz_stateful_data",
        "usage_class": "mock_metadata_and_synthetic_fixture",
        "summary": "Synthetic test-user, fixture-pack, sender, and reserved-number registry for shared non-production rehearsal.",
    },
    {
        "storage_backend": "shared_nonprod_vault",
        "trust_zone": "tz_assurance_security",
        "usage_class": "shared_nonprod_secret_material",
        "summary": "Managed non-production vault for simulator credentials, shared webhook secrets, and mailbox placeholders.",
    },
    {
        "storage_backend": "partner_capture_quarantine",
        "trust_zone": "tz_assurance_security",
        "usage_class": "temporary_landing_zone",
        "summary": "Write-only temporary landing zone for newly captured live credentials before ingest into the permanent vault.",
    },
    {
        "storage_backend": "partner_metadata_registry",
        "trust_zone": "tz_assurance_security",
        "usage_class": "non-secret_partner_metadata",
        "summary": "Registry for redirect inventories, sender identities, phone numbers, client-registration metadata, and site-link placeholders.",
    },
    {
        "storage_backend": "nonprod_hsm_keyring",
        "trust_zone": "tz_assurance_security",
        "usage_class": "nonprod_private_key_custody",
        "summary": "Non-production HSM or KMS-backed custody for private keys and certificate material.",
    },
    {
        "storage_backend": "preprod_vault",
        "trust_zone": "tz_assurance_security",
        "usage_class": "preprod_secret_material",
        "summary": "Pre-production vault for live-like secret handling before release widening.",
    },
    {
        "storage_backend": "production_vault",
        "trust_zone": "tz_assurance_security",
        "usage_class": "production_secret_material",
        "summary": "Production vault with dual-control rotation, revocation, and access-audit obligations.",
    },
    {
        "storage_backend": "production_hsm_keyring",
        "trust_zone": "tz_assurance_security",
        "usage_class": "production_private_key_custody",
        "summary": "Production HSM or KMS-backed custody for identity, mailbox, and signing private keys.",
    },
]

LIVE_GATES = {
    "GATE_EXTERNAL_TO_FOUNDATION": {
        "label": "External readiness to foundation gate",
        "summary": "No live-provider capture may claim Phase 0 readiness until the external-readiness chain clears.",
    },
    "LIVE_GATE_NHS_LOGIN_PARTNER_APPROVED": {
        "label": "NHS login partner approval",
        "summary": "Real NHS login credentials require approved partner onboarding and named approver identity.",
    },
    "LIVE_GATE_REDIRECT_URI_REVIEW": {
        "label": "Redirect and environment review",
        "summary": "Redirect URI, route family, and environment additions require review against the canonical route inventory.",
    },
    "LIVE_GATE_IDENTITY_SESSION_PARITY": {
        "label": "Identity and session parity proof",
        "summary": "No real identity credential is admissible until local-session proof and callback parity are current.",
    },
    "LIVE_GATE_TELEPHONY_RECORDING_APPROVED": {
        "label": "Telephony recording and escalation review",
        "summary": "Live telephony numbers and recording credentials require safety, retention, and urgent-escalation sign-off.",
    },
    "LIVE_GATE_TRANSCRIPT_SAFETY_REVIEW": {
        "label": "Transcript and derived-facts safety review",
        "summary": "Transcript or scan credentials stay blocked until clinical-safety and masking policy review is current.",
    },
    "LIVE_GATE_VENDOR_SENDER_REVIEW": {
        "label": "Sender identity and wrong-recipient review",
        "summary": "Email or SMS sender identities require wrong-recipient, dispute, and support runbook sign-off.",
    },
    "LIVE_GATE_IM1_SCAL_APPROVED": {
        "label": "IM1 and SCAL approval",
        "summary": "GP supplier and pairing credentials remain placeholders until IM1 and SCAL evidence is current.",
    },
    "LIVE_GATE_SUPPLIER_CAPABILITY_REVIEW": {
        "label": "Supplier capability evidence review",
        "summary": "Live booking or GP supplier accounts require explicit capability-matrix and fallback review.",
    },
    "LIVE_GATE_NETWORK_FEED_TRUST_REVIEW": {
        "label": "Network feed trust review",
        "summary": "Capacity feeds require source freshness, trust posture, and policy tuple review.",
    },
    "LIVE_GATE_CROSS_ORG_TRANSPORT_APPROVED": {
        "label": "Cross-organisation transport approval",
        "summary": "Mailbox or transport credentials need cross-organisation approval and minimum-necessary payload review.",
    },
    "LIVE_GATE_PHARMACY_DIRECTORY_REVIEW": {
        "label": "Pharmacy directory access-path review",
        "summary": "Directory accounts remain blocked until access-path and patient-choice compliance review are current.",
    },
    "LIVE_GATE_PHARMACY_TRANSPORT_REVIEW": {
        "label": "Pharmacy transport and urgent-return review",
        "summary": "Transport credentials require professional-route ownership and redispatch policy sign-off.",
    },
    "LIVE_GATE_PHARMACY_OUTCOME_REVIEW": {
        "label": "Pharmacy outcome acceptance review",
        "summary": "Outcome credentials require parser quality, reconciliation, and manual-review thresholds.",
    },
    "LIVE_GATE_PDS_LEGAL_BASIS_APPROVED": {
        "label": "PDS legal basis and feature-flag approval",
        "summary": "PDS access is blocked until legal basis, tenant feature flag, and enrichment posture are approved.",
    },
    "LIVE_GATE_NHS_APP_DEFERRED_ONLY": {
        "label": "NHS App deferred-channel gate",
        "summary": "Embedded-channel placeholders stay non-live until the deferred Phase 7 channel opens.",
    },
    "LIVE_GATE_ASSISTIVE_INTENDED_USE_REVIEW": {
        "label": "Assistive intended-use and subprocessor review",
        "summary": "Future model-vendor secrets stay blocked until intended use, rollback, and subprocessor review are complete.",
    },
}

CLASS_PROFILES = {
    "account": {
        "class_kind": "governed_partner_identity",
        "secret_presence": "no",
        "dual_control_default": "policy_conditioned",
        "mock_allowed": "yes",
        "production_allowed": "yes",
        "browser_trace_policy": "placeholder_or_hash_only",
        "log_redaction_policy": "identifier_hash_only",
        "notes": "Partner console identities are governed metadata and may never be the only proof of runtime authority.",
    },
    "test_user": {
        "class_kind": "synthetic_or_partner_test_principal",
        "secret_presence": "yes",
        "dual_control_default": "nonprod_only",
        "mock_allowed": "yes",
        "production_allowed": "no",
        "browser_trace_policy": "masked_test_identity_only",
        "log_redaction_policy": "redact_username_and_password",
        "notes": "Test-user credentials remain synthetic or partner-issued test-only material and may never widen into production privilege.",
    },
    "service_principal": {
        "class_kind": "runtime_secret",
        "secret_presence": "yes",
        "dual_control_default": "yes",
        "mock_allowed": "yes",
        "production_allowed": "yes",
        "browser_trace_policy": "never_capture_value",
        "log_redaction_policy": "full_secret_mask",
        "notes": "Service principals are always runtime-only and injected through workload-bound secret retrieval.",
    },
    "client_registration": {
        "class_kind": "partner_metadata",
        "secret_presence": "no",
        "dual_control_default": "policy_conditioned",
        "mock_allowed": "yes",
        "production_allowed": "yes",
        "browser_trace_policy": "placeholder_or_hash_only",
        "log_redaction_policy": "identifier_hash_only",
        "notes": "Client IDs and redirect metadata remain governed configuration, not loose developer state.",
    },
    "client_secret": {
        "class_kind": "runtime_secret",
        "secret_presence": "yes",
        "dual_control_default": "yes",
        "mock_allowed": "yes",
        "production_allowed": "yes",
        "browser_trace_policy": "never_capture_value",
        "log_redaction_policy": "full_secret_mask",
        "notes": "Client secrets are dual-controlled outside mock-only environments and never rendered into traces, screenshots, or markdown.",
    },
    "private_key": {
        "class_kind": "key_material",
        "secret_presence": "yes",
        "dual_control_default": "yes",
        "mock_allowed": "yes",
        "production_allowed": "yes",
        "browser_trace_policy": "never_capture_value",
        "log_redaction_policy": "full_secret_mask",
        "notes": "Private keys stay in HSM or KMS-backed custody when the environment is not mock-only.",
    },
    "public_key": {
        "class_kind": "partner_metadata",
        "secret_presence": "no",
        "dual_control_default": "policy_conditioned",
        "mock_allowed": "yes",
        "production_allowed": "yes",
        "browser_trace_policy": "placeholder_or_hash_only",
        "log_redaction_policy": "identifier_hash_only",
        "notes": "Public keys, JWKS references, and certificate chains may be published only through the governed metadata registry.",
    },
    "webhook_secret": {
        "class_kind": "runtime_secret",
        "secret_presence": "yes",
        "dual_control_default": "yes",
        "mock_allowed": "yes",
        "production_allowed": "yes",
        "browser_trace_policy": "never_capture_value",
        "log_redaction_policy": "full_secret_mask",
        "notes": "Webhook shared secrets must bind replay control, callback authenticity, and revocation proof.",
    },
    "mailbox_credential": {
        "class_kind": "runtime_secret",
        "secret_presence": "yes",
        "dual_control_default": "yes",
        "mock_allowed": "yes",
        "production_allowed": "yes",
        "browser_trace_policy": "never_capture_value",
        "log_redaction_policy": "full_secret_mask",
        "notes": "Mailbox credentials imply transport authority and must bind certificate, mailbox, and escalation ownership together.",
    },
    "phone_number": {
        "class_kind": "service_endpoint_metadata",
        "secret_presence": "no",
        "dual_control_default": "policy_conditioned",
        "mock_allowed": "yes",
        "production_allowed": "yes",
        "browser_trace_policy": "placeholder_or_hash_only",
        "log_redaction_policy": "identifier_hash_only",
        "notes": "Phone numbers are operational identifiers and must never silently cross mock, test, and live cohorts.",
    },
    "sender_identity": {
        "class_kind": "service_endpoint_metadata",
        "secret_presence": "no",
        "dual_control_default": "policy_conditioned",
        "mock_allowed": "yes",
        "production_allowed": "yes",
        "browser_trace_policy": "placeholder_or_hash_only",
        "log_redaction_policy": "identifier_hash_only",
        "notes": "Sender identities carry wrong-recipient and dispute-handling obligations even when no secret value is present.",
    },
    "signing_key": {
        "class_kind": "key_material",
        "secret_presence": "yes",
        "dual_control_default": "yes",
        "mock_allowed": "yes",
        "production_allowed": "yes",
        "browser_trace_policy": "never_capture_value",
        "log_redaction_policy": "full_secret_mask",
        "notes": "Signing keys require the same custody and incident handling as private keys.",
    },
    "sandbox_dataset": {
        "class_kind": "synthetic_fixture_pack",
        "secret_presence": "no",
        "dual_control_default": "no",
        "mock_allowed": "yes",
        "production_allowed": "no",
        "browser_trace_policy": "synthetic_only",
        "log_redaction_policy": "synthetic_identifier_only",
        "notes": "Sandbox datasets remain synthetic and deterministic and may never absorb live partner credentials.",
    },
    "other": {
        "class_kind": "governed_metadata_or_placeholder",
        "secret_presence": "no",
        "dual_control_default": "policy_conditioned",
        "mock_allowed": "yes",
        "production_allowed": "yes",
        "browser_trace_policy": "placeholder_only",
        "log_redaction_policy": "identifier_hash_only",
        "notes": "Miscellaneous metadata classes remain placeholders until later onboarding tasks publish a stricter profile.",
    },
}

FAMILY_PROFILES = {
    "identity_auth": {
        "title": "NHS login identity rail",
        "dependency_refs": ["dep_nhs_login_rail"],
        "owner_role": "ROLE_IDENTITY_PARTNER_MANAGER",
        "backup_owner_role": "ROLE_SECURITY_LEAD",
        "creator_role": "ROLE_PARTNER_ONBOARDING_LEAD",
        "approver_role": "ROLE_INTEROPERABILITY_LEAD",
        "integration_ref": INTEGRATION_LINKS["identity_auth"],
        "live_gate_refs": [
            "GATE_EXTERNAL_TO_FOUNDATION",
            "LIVE_GATE_NHS_LOGIN_PARTNER_APPROVED",
            "LIVE_GATE_REDIRECT_URI_REVIEW",
            "LIVE_GATE_IDENTITY_SESSION_PARITY",
        ],
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#1.4D AuthTransaction",
            "blueprint/phase-0-the-foundation-protocol.md#1.4G SessionEstablishmentDecision",
            "blueprint/phase-2-the-identity-and-echoes.md#2B. NHS login bridge and local session engine",
        ],
        "mock_surfaces": [
            "mock_nhs_login_service",
            "mock_nhs_login_admin_console",
            "tests_playwright_identity",
            "svc_identity_bridge",
        ],
        "actual_surfaces": [
            "browser_automation_dry_run",
            "svc_identity_bridge",
            "partner_onboarding_control_plane",
        ],
        "notes": "Auth success never implies writable authority; redirect and key changes are route-law changes, not mere config edits.",
    },
    "patient_data_enrichment": {
        "title": "Optional PDS enrichment seam",
        "dependency_refs": ["dep_pds_fhir_enrichment"],
        "owner_role": "ROLE_INTEROPERABILITY_LEAD",
        "backup_owner_role": "ROLE_DPO",
        "creator_role": "ROLE_PARTNER_ONBOARDING_LEAD",
        "approver_role": "ROLE_GOVERNANCE_LEAD",
        "integration_ref": INTEGRATION_LINKS["patient_data_enrichment"],
        "live_gate_refs": [
            "LIVE_GATE_PDS_LEGAL_BASIS_APPROVED",
            "GATE_EXTERNAL_TO_FOUNDATION",
        ],
        "source_refs": [
            "blueprint/phase-2-the-identity-and-echoes.md#2C. Patient linkage, demographic confidence, and optional PDS enrichment",
            "data/analysis/external_dependencies.json#dep_pds_fhir_enrichment",
        ],
        "mock_surfaces": [
            "identity_enrichment_simulator",
            "governance_feature_flag_console",
        ],
        "actual_surfaces": [
            "browser_automation_dry_run",
            "svc_identity_bridge",
            "governance_feature_flag_console",
        ],
        "notes": "This family stays optional and gated by legal basis, feature flags, and minimal-data disclosure.",
    },
    "telephony": {
        "title": "Telephony, IVR, and recording rail",
        "dependency_refs": ["dep_telephony_ivr_recording_provider"],
        "owner_role": "ROLE_COMMUNICATIONS_PLATFORM_LEAD",
        "backup_owner_role": "ROLE_SECURITY_LEAD",
        "creator_role": "ROLE_PARTNER_ONBOARDING_LEAD",
        "approver_role": "ROLE_OPERATIONS_LEAD",
        "integration_ref": INTEGRATION_LINKS["telephony"],
        "live_gate_refs": [
            "GATE_EXTERNAL_TO_FOUNDATION",
            "LIVE_GATE_TELEPHONY_RECORDING_APPROVED",
        ],
        "source_refs": [
            "blueprint/phase-2-the-identity-and-echoes.md#2E. Telephony edge, IVR choreography, and call-session persistence",
            "blueprint/phase-2-the-identity-and-echoes.md#2F. Caller verification, voice capture, transcript stub, and SMS continuation",
        ],
        "mock_surfaces": [
            "telephony_simulator",
            "svc_telephony_edge",
            "tests_playwright_external",
        ],
        "actual_surfaces": [
            "svc_telephony_edge",
            "browser_automation_dry_run",
            "ops_vendor_control_plane",
        ],
        "notes": "Live phone-number ownership and recording policy must stay explicit and revocable.",
    },
    "transcription": {
        "title": "Transcript processing provider",
        "dependency_refs": ["dep_transcription_processing_provider"],
        "owner_role": "ROLE_COMMUNICATIONS_PLATFORM_LEAD",
        "backup_owner_role": "ROLE_SECURITY_LEAD",
        "creator_role": "ROLE_PARTNER_ONBOARDING_LEAD",
        "approver_role": "ROLE_MANUFACTURER_CSO",
        "integration_ref": INTEGRATION_LINKS["transcription"],
        "live_gate_refs": [
            "GATE_EXTERNAL_TO_FOUNDATION",
            "LIVE_GATE_TRANSCRIPT_SAFETY_REVIEW",
        ],
        "source_refs": [
            "blueprint/phase-2-the-identity-and-echoes.md#2F. Caller verification, voice capture, transcript stub, and SMS continuation",
            "data/analysis/external_dependencies.json#dep_transcription_processing_provider",
        ],
        "mock_surfaces": [
            "telephony_simulator",
            "artifact_scan_simulator",
            "svc_evidence_pipeline",
        ],
        "actual_surfaces": [
            "svc_evidence_pipeline",
            "browser_automation_dry_run",
        ],
        "notes": "Transcript credentials stay blocked until derived-facts and masking posture are reviewed.",
    },
    "sms": {
        "title": "SMS continuation delivery",
        "dependency_refs": ["dep_sms_notification_provider"],
        "owner_role": "ROLE_COMMUNICATIONS_PLATFORM_LEAD",
        "backup_owner_role": "ROLE_SUPPORT_LEAD",
        "creator_role": "ROLE_PARTNER_ONBOARDING_LEAD",
        "approver_role": "ROLE_SECURITY_LEAD",
        "integration_ref": INTEGRATION_LINKS["sms"],
        "live_gate_refs": [
            "LIVE_GATE_VENDOR_SENDER_REVIEW",
        ],
        "source_refs": [
            "data/analysis/external_dependencies.json#dep_sms_notification_provider",
            "data/analysis/provider_family_scorecards.json#notifications_sms",
        ],
        "mock_surfaces": [
            "notification_simulator",
            "tests_playwright_external",
            "svc_notification_worker",
        ],
        "actual_surfaces": [
            "svc_notification_worker",
            "browser_automation_dry_run",
            "ops_vendor_control_plane",
        ],
        "notes": "SMS remains optional and must stay segregated from email, telephony, and production patient-contact authority.",
    },
    "email": {
        "title": "Email and secure-link notification rail",
        "dependency_refs": ["dep_email_notification_provider"],
        "owner_role": "ROLE_COMMUNICATIONS_PLATFORM_LEAD",
        "backup_owner_role": "ROLE_SUPPORT_LEAD",
        "creator_role": "ROLE_PARTNER_ONBOARDING_LEAD",
        "approver_role": "ROLE_SECURITY_LEAD",
        "integration_ref": INTEGRATION_LINKS["email"],
        "live_gate_refs": [
            "GATE_EXTERNAL_TO_FOUNDATION",
            "LIVE_GATE_VENDOR_SENDER_REVIEW",
        ],
        "source_refs": [
            "data/analysis/external_dependencies.json#dep_email_notification_provider",
            "data/analysis/provider_family_scorecards.json#notifications_email",
        ],
        "mock_surfaces": [
            "notification_simulator",
            "tests_playwright_external",
            "svc_notification_worker",
        ],
        "actual_surfaces": [
            "svc_notification_worker",
            "browser_automation_dry_run",
            "ops_vendor_control_plane",
        ],
        "notes": "Email sender and webhook posture must stay compatible with wrong-recipient repair and secure-link truth.",
    },
    "malware_scanning": {
        "title": "Artifact scanning provider",
        "dependency_refs": ["dep_malware_scanning_provider"],
        "owner_role": "ROLE_SECURITY_LEAD",
        "backup_owner_role": "ROLE_OPERATIONS_LEAD",
        "creator_role": "ROLE_PARTNER_ONBOARDING_LEAD",
        "approver_role": "ROLE_SECURITY_LEAD",
        "integration_ref": INTEGRATION_LINKS["malware_scanning"],
        "live_gate_refs": [
            "GATE_EXTERNAL_TO_FOUNDATION",
            "LIVE_GATE_TRANSCRIPT_SAFETY_REVIEW",
        ],
        "source_refs": [
            "data/analysis/external_dependencies.json#dep_malware_scanning_provider",
            "data/analysis/provider_family_scorecards.json#telephony_voice_and_recording",
        ],
        "mock_surfaces": [
            "artifact_scan_simulator",
            "svc_evidence_pipeline",
        ],
        "actual_surfaces": [
            "svc_evidence_pipeline",
            "browser_automation_dry_run",
        ],
        "notes": "Scanner credentials must stay quarantined from ordinary file-upload traces and seed packs.",
    },
    "gp_system": {
        "title": "GP system and IM1 programme boundary",
        "dependency_refs": ["dep_im1_pairing_programme", "dep_gp_system_supplier_paths"],
        "owner_role": "ROLE_INTEROPERABILITY_LEAD",
        "backup_owner_role": "ROLE_SECURITY_LEAD",
        "creator_role": "ROLE_PARTNER_ONBOARDING_LEAD",
        "approver_role": "ROLE_GOVERNANCE_LEAD",
        "integration_ref": INTEGRATION_LINKS["gp_system"],
        "live_gate_refs": [
            "GATE_EXTERNAL_TO_FOUNDATION",
            "LIVE_GATE_IM1_SCAL_APPROVED",
            "LIVE_GATE_SUPPLIER_CAPABILITY_REVIEW",
        ],
        "source_refs": [
            "data/analysis/external_dependencies.json#dep_im1_pairing_programme",
            "data/analysis/external_dependencies.json#dep_gp_system_supplier_paths",
        ],
        "mock_surfaces": [
            "booking_supplier_simulator",
            "interoperability_partner_console",
        ],
        "actual_surfaces": [
            "browser_automation_dry_run",
            "svc_booking_adapter",
            "interoperability_partner_console",
        ],
        "notes": "IM1 credentials and supplier-path credentials remain distinct and may not silently inherit each other.",
    },
    "booking_supplier": {
        "title": "Booking supplier boundary",
        "dependency_refs": ["dep_local_booking_supplier_adapters"],
        "owner_role": "ROLE_BOOKING_DOMAIN_LEAD",
        "backup_owner_role": "ROLE_INTEROPERABILITY_LEAD",
        "creator_role": "ROLE_PARTNER_ONBOARDING_LEAD",
        "approver_role": "ROLE_GOVERNANCE_LEAD",
        "integration_ref": INTEGRATION_LINKS["booking_supplier"],
        "live_gate_refs": [
            "GATE_EXTERNAL_TO_FOUNDATION",
            "LIVE_GATE_SUPPLIER_CAPABILITY_REVIEW",
        ],
        "source_refs": [
            "blueprint/phase-4-the-booking-engine.md#4B. Provider capability matrix and adapter seam",
            "data/analysis/external_dependencies.json#dep_local_booking_supplier_adapters",
        ],
        "mock_surfaces": [
            "booking_supplier_simulator",
            "svc_booking_adapter",
        ],
        "actual_surfaces": [
            "svc_booking_adapter",
            "browser_automation_dry_run",
        ],
        "notes": "Booking supplier credentials remain adapter-bound and never migrate into browser-delivered surfaces.",
    },
    "network_capacity": {
        "title": "Network capacity partner feed",
        "dependency_refs": ["dep_network_capacity_partner_feeds"],
        "owner_role": "ROLE_NETWORK_COORDINATION_OWNER",
        "backup_owner_role": "ROLE_INTEROPERABILITY_LEAD",
        "creator_role": "ROLE_PARTNER_ONBOARDING_LEAD",
        "approver_role": "ROLE_GOVERNANCE_LEAD",
        "integration_ref": INTEGRATION_LINKS["network_capacity"],
        "live_gate_refs": [
            "LIVE_GATE_NETWORK_FEED_TRUST_REVIEW",
        ],
        "source_refs": [
            "data/analysis/external_dependencies.json#dep_network_capacity_partner_feeds",
            "blueprint/phase-5-the-network-horizon.md#5C. Enhanced Access policy engine and network capacity ingestion",
        ],
        "mock_surfaces": [
            "capacity_feed_simulator",
            "network_policy_console",
        ],
        "actual_surfaces": [
            "svc_capacity_ingest",
            "browser_automation_dry_run",
            "network_policy_console",
        ],
        "notes": "Feed credentials are non-authoritative without current freshness, trust, and fallback review.",
    },
    "messaging_transport": {
        "title": "Cross-organisation messaging transport",
        "dependency_refs": [
            "dep_cross_org_secure_messaging_mesh",
            "dep_origin_practice_ack_rail",
            "dep_pharmacy_urgent_return_professional_routes",
        ],
        "owner_role": "ROLE_INTEROPERABILITY_LEAD",
        "backup_owner_role": "ROLE_SECURITY_LEAD",
        "creator_role": "ROLE_PARTNER_ONBOARDING_LEAD",
        "approver_role": "ROLE_OPERATIONS_LEAD",
        "integration_ref": INTEGRATION_LINKS["messaging_transport"],
        "live_gate_refs": [
            "GATE_EXTERNAL_TO_FOUNDATION",
            "LIVE_GATE_CROSS_ORG_TRANSPORT_APPROVED",
        ],
        "source_refs": [
            "data/analysis/external_dependencies.json#dep_cross_org_secure_messaging_mesh",
            "data/analysis/external_dependencies.json#dep_origin_practice_ack_rail",
            "data/analysis/external_dependencies.json#dep_pharmacy_urgent_return_professional_routes",
        ],
        "mock_surfaces": [
            "mesh_simulator",
            "svc_secure_message_adapter",
            "ops_vendor_control_plane",
        ],
        "actual_surfaces": [
            "svc_secure_message_adapter",
            "browser_automation_dry_run",
            "ops_vendor_control_plane",
        ],
        "notes": "Mailbox, certificate, and endpoint changes are transport-truth changes and require revocation proof.",
    },
    "pharmacy_directory": {
        "title": "Pharmacy directory seam",
        "dependency_refs": ["dep_pharmacy_directory_dohs"],
        "owner_role": "ROLE_PHARMACY_PARTNER_OWNER",
        "backup_owner_role": "ROLE_PHARMACY_DOMAIN_LEAD",
        "creator_role": "ROLE_PARTNER_ONBOARDING_LEAD",
        "approver_role": "ROLE_GOVERNANCE_LEAD",
        "integration_ref": INTEGRATION_LINKS["pharmacy_directory"],
        "live_gate_refs": [
            "LIVE_GATE_PHARMACY_DIRECTORY_REVIEW",
        ],
        "source_refs": [
            "blueprint/phase-6-the-pharmacy-loop.md#6C. Pharmacy discovery, provider choice, and directory abstraction",
            "data/analysis/external_dependencies.json#dep_pharmacy_directory_dohs",
        ],
        "mock_surfaces": [
            "pharmacy_directory_simulator",
            "svc_pharmacy_adapter",
        ],
        "actual_surfaces": [
            "svc_pharmacy_adapter",
            "browser_automation_dry_run",
        ],
        "notes": "Directory accounts remain separate from dispatch or outcome credentials so patient-choice review stays explicit.",
    },
    "pharmacy_transport": {
        "title": "Pharmacy dispatch transport",
        "dependency_refs": ["dep_pharmacy_referral_transport"],
        "owner_role": "ROLE_PHARMACY_PARTNER_OWNER",
        "backup_owner_role": "ROLE_INTEROPERABILITY_LEAD",
        "creator_role": "ROLE_PARTNER_ONBOARDING_LEAD",
        "approver_role": "ROLE_OPERATIONS_LEAD",
        "integration_ref": INTEGRATION_LINKS["pharmacy_transport"],
        "live_gate_refs": [
            "GATE_EXTERNAL_TO_FOUNDATION",
            "LIVE_GATE_PHARMACY_TRANSPORT_REVIEW",
        ],
        "source_refs": [
            "blueprint/phase-6-the-pharmacy-loop.md#6D. Referral pack composer, dispatch adapters, and transport contract",
            "data/analysis/external_dependencies.json#dep_pharmacy_referral_transport",
        ],
        "mock_surfaces": [
            "pharmacy_transport_simulator",
            "svc_pharmacy_adapter",
            "ops_vendor_control_plane",
        ],
        "actual_surfaces": [
            "svc_pharmacy_adapter",
            "browser_automation_dry_run",
            "ops_vendor_control_plane",
        ],
        "notes": "Dispatch transport credentials must stay separate from authoritative dispatch proof and urgent-return policy.",
    },
    "pharmacy_outcome": {
        "title": "Pharmacy outcome observation",
        "dependency_refs": ["dep_pharmacy_outcome_observation"],
        "owner_role": "ROLE_PHARMACY_DOMAIN_LEAD",
        "backup_owner_role": "ROLE_PHARMACY_PARTNER_OWNER",
        "creator_role": "ROLE_PARTNER_ONBOARDING_LEAD",
        "approver_role": "ROLE_GOVERNANCE_LEAD",
        "integration_ref": INTEGRATION_LINKS["pharmacy_outcome"],
        "live_gate_refs": [
            "LIVE_GATE_PHARMACY_OUTCOME_REVIEW",
        ],
        "source_refs": [
            "blueprint/phase-6-the-pharmacy-loop.md#6F. Outcome ingest, Update Record observation, and reconciliation",
            "data/analysis/external_dependencies.json#dep_pharmacy_outcome_observation",
        ],
        "mock_surfaces": [
            "pharmacy_outcome_simulator",
            "svc_pharmacy_adapter",
        ],
        "actual_surfaces": [
            "svc_pharmacy_adapter",
            "browser_automation_dry_run",
        ],
        "notes": "Outcome credentials stay separate from parser or reconciliation truth so weak matches remain reviewable.",
    },
    "embedded_channel": {
        "title": "Deferred NHS App embedded channel",
        "dependency_refs": ["dep_nhs_app_embedded_channel_ecosystem"],
        "owner_role": "ROLE_EMBEDDED_CHANNEL_LEAD",
        "backup_owner_role": "ROLE_SECURITY_LEAD",
        "creator_role": "ROLE_PARTNER_ONBOARDING_LEAD",
        "approver_role": "ROLE_GOVERNANCE_LEAD",
        "integration_ref": INTEGRATION_LINKS["embedded_channel"],
        "live_gate_refs": [
            "LIVE_GATE_NHS_APP_DEFERRED_ONLY",
        ],
        "source_refs": [
            "blueprint/phase-7-inside-the-nhs-app.md#7H. Sandpit, AOS, SCAL, and operational delivery pipeline",
            "data/analysis/external_dependencies.json#dep_nhs_app_embedded_channel_ecosystem",
        ],
        "mock_surfaces": [
            "embedded_channel_placeholder_console",
        ],
        "actual_surfaces": [
            "browser_automation_dry_run",
            "embedded_channel_placeholder_console",
        ],
        "notes": "This family stays deferred and placeholder-only until the Phase 7 gate opens.",
    },
    "model_vendor": {
        "title": "Future-optional assistive vendor boundary",
        "dependency_refs": ["dep_assistive_model_vendor_family"],
        "owner_role": "ROLE_AI_GOVERNANCE_LEAD",
        "backup_owner_role": "ROLE_SECURITY_LEAD",
        "creator_role": "ROLE_PARTNER_ONBOARDING_LEAD",
        "approver_role": "ROLE_DPO",
        "integration_ref": INTEGRATION_LINKS["model_vendor"],
        "live_gate_refs": [
            "LIVE_GATE_ASSISTIVE_INTENDED_USE_REVIEW",
        ],
        "source_refs": [
            "data/analysis/external_dependencies.json#dep_assistive_model_vendor_family",
            "docs/analysis/09_regulatory_workstreams.md#WS_ASSISTIVE_AI_GOVERNANCE",
        ],
        "mock_surfaces": [
            "assistive_vendor_placeholder_console",
        ],
        "actual_surfaces": [
            "browser_automation_dry_run",
            "assistive_vendor_placeholder_console",
        ],
        "notes": "Future-optional only; no live vendor secret is admissible until intended-use, rollback, and subprocessor posture are approved.",
    },
}

NON_NEGOTIABLE_RULES = [
    {
        "rule_id": "RULE_NO_REPO_CREDENTIALS",
        "summary": "No real credential or secret may be committed to the repository, markdown examples, screenshots, or Playwright artifacts.",
    },
    {
        "rule_id": "RULE_NO_BROWSER_TO_PROVIDER_SECRET_FLOW",
        "summary": "Browsers may never hold long-lived provider secrets; browser automation consumes brokered values only during gated dry runs.",
    },
    {
        "rule_id": "RULE_NO_ENVIRONMENT_INHERITANCE",
        "summary": "Environments do not inherit secrets from each other; every widen, redirect, key, sender, mailbox, or number change requires explicit governance.",
    },
    {
        "rule_id": "RULE_NO_SINGLE_OWNER_SHARED_PROD_CREDENTIAL",
        "summary": "Shared production credentials must always have a named owner, backup owner, approver, rotation proof, and revocation path.",
    },
    {
        "rule_id": "RULE_NO_TEST_TO_PROD_PRIVILEGE_DRIFT",
        "summary": "Test users, sandpit accounts, and shared-dev fixtures may never silently gain production privilege or live patient authority.",
    },
]

ASSUMPTIONS = [
    {
        "assumption_id": "ASSUMPTION_023_SHARED_NONPROD_VAULT",
        "summary": "Shared dev, sandpit, and integration environments use one managed non-production vault boundary with environment-specific paths and access policy.",
    },
    {
        "assumption_id": "ASSUMPTION_023_PARTNER_QUARANTINE",
        "summary": "All real later credentials land first in a temporary quarantine before ingest into the permanent vault or metadata registry.",
    },
    {
        "assumption_id": "ASSUMPTION_023_BROWSER_REDACTION_DEFAULT",
        "summary": "Live dry-run browser automation defaults to redacted screenshots, no traces, and no video until seq_024-025 deliberately widen capture posture.",
    },
]

CHANGE_CONTROL_RULES = [
    {
        "change_id": "CHG_REDIRECT_URI",
        "summary": "Redirect URI or route-family addition",
        "roles": "ROLE_IDENTITY_PARTNER_MANAGER + ROLE_SECURITY_LEAD + ROLE_PROGRAMME_ARCHITECT",
        "evidence": "Updated redirect matrix, route-family owner confirmation, dry-run callback proof, approval tuple",
    },
    {
        "change_id": "CHG_KEY_ROTATION",
        "summary": "Client secret, private key, certificate, or mailbox credential rotation",
        "roles": "owner + backup owner + ROLE_SECURITY_LEAD",
        "evidence": "Rotation settlement record, vault version diff, replay and callback verification, revocation proof",
    },
    {
        "change_id": "CHG_ENVIRONMENT_WIDEN",
        "summary": "Sandpit to integration, preprod, or production environment addition",
        "roles": "owner + approver + ROLE_PROGRAMME_ARCHITECT",
        "evidence": "Environment parity checklist, control-plane publication proof, gate clearance, fresh runbook binding",
    },
    {
        "change_id": "CHG_SENDER_OR_NUMBER",
        "summary": "Sender identity or phone-number transfer",
        "roles": "owner + ROLE_OPERATIONS_LEAD + ROLE_SUPPORT_LEAD",
        "evidence": "Wrong-recipient or wrong-number drill, support path confirmation, rollback number or sender plan",
    },
    {
        "change_id": "CHG_MAILBOX_OR_ENDPOINT",
        "summary": "Mailbox or endpoint identifier change",
        "roles": "owner + ROLE_SECURITY_LEAD + ROLE_OPERATIONS_LEAD",
        "evidence": "Transport authenticity proof, endpoint registry diff, replay-safe redrive plan",
    },
    {
        "change_id": "CHG_PROVIDER_OFFBOARD",
        "summary": "Provider offboarding or emergency revoke",
        "roles": "owner + backup owner + approver",
        "evidence": "Revocation bundle, degraded-mode posture confirmation, published fallback activation, audit export",
    },
]

RUNBOOK_STEPS = [
    "Confirm the target family, environment, named approver, and live gates before touching any provider portal or partner email.",
    "Capture credentials or metadata only into the temporary quarantine or metadata review queue; never paste directly into the repo, chat, ticket text, or markdown.",
    "Redact screenshots immediately and keep Playwright traces, videos, and console logs disabled unless the value path is demonstrably secret-free.",
    "Ingest secret material into the correct vault or HSM path, then bind only the reference handle into runtime manifests or partner metadata registries.",
    "Run post-ingest verification: ownership chain, gate references, redirect or endpoint parity, workload access policy, and audit-event emission.",
    "Record rotation or revocation evidence in the external access lifecycle ledger and publish the updated runtime or metadata tuple only after approval.",
    "On incident, revoke in the provider console first when necessary, rotate vault material second, invalidate runtime handles third, then append the incident evidence pack.",
]


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def load_json(path: Path) -> Any:
    return json.loads(path.read_text())


def load_csv(path: Path) -> list[dict[str, str]]:
    with path.open() as handle:
        return list(csv.DictReader(handle))


def ensure_inputs() -> dict[str, Any]:
    missing = [name for name, path in REQUIRED_INPUTS.items() if not path.exists()]
    assert_true(not missing, "PREREQUISITE_GAP_023_MISSING_INPUTS: " + ", ".join(sorted(missing)))

    prereqs = {
        "external_dependencies": load_json(REQUIRED_INPUTS["external_dependencies"]),
        "integration_priority_matrix": load_json(REQUIRED_INPUTS["integration_priority_matrix"]),
        "mock_live_lane_assignments": load_json(REQUIRED_INPUTS["mock_live_lane_assignments"]),
        "provider_family_scorecards": load_json(REQUIRED_INPUTS["provider_family_scorecards"]),
        "runtime_workload_families": load_json(REQUIRED_INPUTS["runtime_workload_families"]),
        "security_control_matrix": load_csv(REQUIRED_INPUTS["security_control_matrix"]),
        "master_risk_register": load_json(REQUIRED_INPUTS["master_risk_register"]),
        "phase0_gate_verdict": load_json(REQUIRED_INPUTS["phase0_gate_verdict"]),
        "coverage_summary": load_json(REQUIRED_INPUTS["coverage_summary"]),
    }

    assert_true(
        prereqs["integration_priority_matrix"]["summary"]["integration_family_count"] == 15,
        "PREREQUISITE_GAP_023_SEQ021_DRIFT: integration family count changed",
    )
    assert_true(
        prereqs["provider_family_scorecards"]["summary"]["provider_family_count"] == 8,
        "PREREQUISITE_GAP_023_SEQ022_DRIFT: provider family count changed",
    )
    assert_true(
        prereqs["coverage_summary"]["summary"]["requirements_with_gaps_count"] == 0,
        "PREREQUISITE_GAP_023_TRACEABILITY_REOPENED: current baseline coverage gaps returned",
    )
    assert_true(
        prereqs["phase0_gate_verdict"]["gate_verdicts"][0]["verdict"] == "withheld",
        "PREREQUISITE_GAP_023_PHASE0_VERDICT_DRIFT: expected withheld gate posture from seq_020",
    )
    return prereqs


def spec(
    account_or_secret_id: str,
    dependency_family: str,
    environment: str,
    record_class: str,
    current_lane: str,
    *,
    mock_equivalent_ref: str = "",
    manual_checkpoint_required: str | None = None,
    extra_live_gate_refs: list[str] | None = None,
    extra_surfaces: list[str] | None = None,
    origin_source: str = "",
    notes: str = "",
) -> dict[str, Any]:
    return {
        "account_or_secret_id": account_or_secret_id,
        "dependency_family": dependency_family,
        "environment": environment,
        "record_class": record_class,
        "current_lane": current_lane,
        "mock_equivalent_ref": mock_equivalent_ref,
        "manual_checkpoint_required": manual_checkpoint_required,
        "extra_live_gate_refs": extra_live_gate_refs or [],
        "extra_surfaces": extra_surfaces or [],
        "origin_source": origin_source,
        "notes": notes,
    }


def mock(
    account_or_secret_id: str,
    dependency_family: str,
    environment: str,
    record_class: str,
    **kwargs: Any,
) -> dict[str, Any]:
    return spec(account_or_secret_id, dependency_family, environment, record_class, "mock_now", **kwargs)


def actual(
    account_or_secret_id: str,
    dependency_family: str,
    environment: str,
    record_class: str,
    **kwargs: Any,
) -> dict[str, Any]:
    return spec(account_or_secret_id, dependency_family, environment, record_class, "actual_later", **kwargs)


def hybrid(
    account_or_secret_id: str,
    dependency_family: str,
    environment: str,
    record_class: str,
    **kwargs: Any,
) -> dict[str, Any]:
    return spec(account_or_secret_id, dependency_family, environment, record_class, "hybrid", **kwargs)


ACCESS_SPECS = [
    mock("ACC_NHS_LOGIN_LOCAL_CLIENT_REG", "identity_auth", "local_mock", "client_registration", notes="Deterministic mock OIDC client registry for developer-only rehearsal."),
    mock("KEY_NHS_LOGIN_LOCAL_SIGNING", "identity_auth", "local_mock", "private_key", notes="Local signing key for mock OIDC authorize, token, and logout flow."),
    mock("ACC_NHS_LOGIN_CI_CLIENT_REG", "identity_auth", "ci_mock", "client_registration", notes="Ephemeral CI client registry seeded per test run."),
    mock("KEY_NHS_LOGIN_CI_SIGNING", "identity_auth", "ci_mock", "private_key", notes="Ephemeral CI signing key discarded after each pipeline run."),
    hybrid("USER_NHS_LOGIN_SHARED_DEV_TEST_SET", "identity_auth", "shared_dev", "test_user", notes="Synthetic identity pack for shared-dev rehearsal and later field-map parity."),
    hybrid("DATA_NHS_LOGIN_SHARED_DEV_FIXTURES", "identity_auth", "shared_dev", "sandbox_dataset", notes="Shared synthetic claims, scopes, and callback race fixtures."),
    hybrid("PUB_NHS_LOGIN_SHARED_DEV_JWKS", "identity_auth", "shared_dev", "public_key", notes="Published mock JWKS metadata used by both simulator and later capture templates."),
    mock("ACC_TEL_LOCAL_SIM_PRINCIPAL", "telephony", "local_mock", "service_principal", notes="Local simulator principal for inbound webhooks and IVR state tests."),
    mock("SEC_TEL_LOCAL_WEBHOOK", "telephony", "local_mock", "webhook_secret", notes="Deterministic local callback authenticity secret."),
    mock("NUM_TEL_SHARED_DEV_TEST_RANGE", "telephony", "shared_dev", "phone_number", notes="Reserved synthetic number range for shared-dev IVR and callback rehearsal."),
    mock("DATA_TEL_SHARED_DEV_FIXTURES", "telephony", "shared_dev", "sandbox_dataset", notes="Synthetic call recordings, transcript placeholders, and call-session timelines."),
    mock("ACC_EMAIL_LOCAL_SIM_PRINCIPAL", "email", "local_mock", "service_principal", notes="Local email simulator principal for secure-link and delivery-state testing."),
    mock("ID_EMAIL_LOCAL_SENDER", "email", "local_mock", "sender_identity", notes="Local-only sender identity placeholder."),
    mock("SEC_EMAIL_CI_WEBHOOK", "email", "ci_mock", "webhook_secret", notes="CI-only email callback secret."),
    mock("ACC_SMS_LOCAL_SIM_PRINCIPAL", "sms", "local_mock", "service_principal", notes="Optional SMS simulator principal kept separate from email delivery."),
    mock("ID_SMS_LOCAL_SENDER", "sms", "local_mock", "sender_identity", notes="Mock SMS sender used for seeded continuation rehearsal only."),
    mock("SEC_SMS_CI_WEBHOOK", "sms", "ci_mock", "webhook_secret", notes="CI-only SMS callback authenticity secret."),
    mock("ACC_BOOKING_LOCAL_SIM_PRINCIPAL", "booking_supplier", "local_mock", "service_principal", notes="Mock booking adapter principal for slot, revalidation, and confirmation-truth tests."),
    mock("SEC_BOOKING_CI_CALLBACK", "booking_supplier", "ci_mock", "webhook_secret", notes="Mock booking callback secret for duplicate and stale-candidate replay tests."),
    mock("DATA_BOOKING_SHARED_DEV_CAPABILITY_PACK", "booking_supplier", "shared_dev", "sandbox_dataset", notes="Supplier capability matrix and slot-snapshot fixtures."),
    mock("ACC_PHARMACY_DIRECTORY_SHARED_DEV_PRINCIPAL", "pharmacy_directory", "shared_dev", "service_principal", notes="Mock directory access principal for patient-choice rehearsal."),
    mock("DATA_PHARMACY_DIRECTORY_SHARED_DEV_FIXTURES", "pharmacy_directory", "shared_dev", "sandbox_dataset", notes="Synthetic pharmacy listings, availability, and professional-route fixtures."),
    mock("ACC_PHARMACY_DISPATCH_LOCAL_MAILBOX", "pharmacy_transport", "local_mock", "mailbox_credential", notes="Local transport mailbox credential for dispatch proof rehearsal."),
    mock("SEC_PHARMACY_DISPATCH_CI_WEBHOOK", "pharmacy_transport", "ci_mock", "webhook_secret", notes="CI-only dispatch callback secret for redispatch and bounce-back tests."),
    mock("ACC_PHARMACY_OUTCOME_SHARED_DEV_MAILBOX", "pharmacy_outcome", "shared_dev", "mailbox_credential", notes="Mock outcome mailbox used for weak-match and replay-safe ingest tests."),
    mock("ACC_MESH_SHARED_DEV_MAILBOX", "messaging_transport", "shared_dev", "mailbox_credential", notes="Shared-dev MESH-like mailbox credential for cross-org message replay rehearsal."),
    mock("KEY_MESH_SHARED_DEV_TRANSPORT_CERT", "messaging_transport", "shared_dev", "private_key", notes="Mock certificate material for authenticated transport tests."),
    mock("ACC_TRANSCRIPT_SHARED_DEV_PRINCIPAL", "transcription", "shared_dev", "service_principal", notes="Mock transcription project principal for readiness-state rehearsal."),
    mock("SEC_TRANSCRIPT_SHARED_DEV_WEBHOOK", "transcription", "shared_dev", "webhook_secret", notes="Mock transcript completion callback secret."),
    mock("ACC_SCAN_SHARED_DEV_PRINCIPAL", "malware_scanning", "shared_dev", "service_principal", notes="Mock scanning project principal for quarantine workflow rehearsal."),
    mock("DATA_SCAN_SHARED_DEV_SIGNATURE_PACK", "malware_scanning", "shared_dev", "sandbox_dataset", notes="Synthetic malware-signature corpus and known-bad evidence pack."),
    actual("ACC_NHS_LOGIN_SANDPIT_CLIENT_REG", "identity_auth", "sandpit", "client_registration", mock_equivalent_ref="ACC_NHS_LOGIN_LOCAL_CLIENT_REG", notes="Placeholder sandpit client registration metadata."),
    actual("SEC_NHS_LOGIN_SANDPIT_CLIENT_SECRET", "identity_auth", "sandpit", "client_secret", mock_equivalent_ref="KEY_NHS_LOGIN_LOCAL_SIGNING", notes="Real sandpit client secret captured later under dual control."),
    actual("KEY_NHS_LOGIN_SANDPIT_PRIVATE_KEY", "identity_auth", "sandpit", "private_key", mock_equivalent_ref="KEY_NHS_LOGIN_LOCAL_SIGNING", notes="Sandpit private key material for callback and token proof."),
    actual("PUB_NHS_LOGIN_SANDPIT_JWKS", "identity_auth", "sandpit", "public_key", mock_equivalent_ref="PUB_NHS_LOGIN_SHARED_DEV_JWKS", notes="Published sandpit JWKS metadata under redirect-review control."),
    actual("USER_NHS_LOGIN_SANDPIT_TEST_USER", "identity_auth", "sandpit", "test_user", mock_equivalent_ref="USER_NHS_LOGIN_SHARED_DEV_TEST_SET", notes="Partner-issued sandpit test user kept separate from local mock packs."),
    actual("ACC_NHS_LOGIN_INTEGRATION_CLIENT_REG", "identity_auth", "integration", "client_registration", mock_equivalent_ref="ACC_NHS_LOGIN_CI_CLIENT_REG", notes="Integration client registration metadata held under route-parity review."),
    actual("SEC_NHS_LOGIN_INTEGRATION_CLIENT_SECRET", "identity_auth", "integration", "client_secret", mock_equivalent_ref="KEY_NHS_LOGIN_CI_SIGNING", notes="Integration client secret issued only after named approver and environment target exist."),
    actual("KEY_NHS_LOGIN_PREPROD_PRIVATE_KEY", "identity_auth", "preprod", "private_key", mock_equivalent_ref="KEY_NHS_LOGIN_LOCAL_SIGNING", notes="Preprod identity key bound to publication parity and rollback evidence."),
    actual("SEC_NHS_LOGIN_PRODUCTION_CLIENT_SECRET", "identity_auth", "production", "client_secret", mock_equivalent_ref="KEY_NHS_LOGIN_LOCAL_SIGNING", notes="Production secret requires dual control and incident-grade revocation proof."),
    actual("KEY_NHS_LOGIN_PRODUCTION_PRIVATE_KEY", "identity_auth", "production", "private_key", mock_equivalent_ref="KEY_NHS_LOGIN_LOCAL_SIGNING", notes="Production private key lives only in the production HSM keyring."),
    actual("ACC_PDS_SANDPIT_PRINCIPAL", "patient_data_enrichment", "sandpit", "service_principal", notes="Optional PDS service principal remains placeholder until legal basis and feature flag approval."),
    actual("KEY_PDS_SANDPIT_CERT", "patient_data_enrichment", "sandpit", "private_key", notes="Optional PDS certificate material is blocked until governance signs off."),
    actual("ACC_IM1_PROGRAMME_INTEGRATION_ACCOUNT", "gp_system", "integration", "account", notes="Programme account metadata for IM1 pairing and supplier readiness."),
    actual("KEY_IM1_PROGRAMME_CERT", "gp_system", "integration", "private_key", notes="Certificate material for IM1 pairing path remains gated by SCAL readiness."),
    actual("ACC_GP_SUPPLIER_INTEGRATION_PRINCIPAL", "gp_system", "integration", "service_principal", notes="Supplier-path principal for governed GP-system access."),
    actual("KEY_GP_SUPPLIER_MTLS", "gp_system", "integration", "private_key", notes="Mutual TLS material for GP supplier path."),
    actual("ACC_BOOKING_SUPPLIER_INTEGRATION_PRINCIPAL", "booking_supplier", "integration", "service_principal", mock_equivalent_ref="ACC_BOOKING_LOCAL_SIM_PRINCIPAL", notes="Live booking supplier principal requires capability-matrix parity and fallback review."),
    actual("ACC_NETWORK_FEED_INTEGRATION_PRINCIPAL", "network_capacity", "integration", "service_principal", notes="Partner-feed principal kept separate from booking supplier truth."),
    actual("ACC_PRACTICE_ACK_INTEGRATION_MAILBOX", "messaging_transport", "integration", "mailbox_credential", mock_equivalent_ref="ACC_MESH_SHARED_DEV_MAILBOX", notes="Practice acknowledgement mailbox credential for origin-practice updates."),
    actual("ACC_TELEPHONY_PREPROD_PRINCIPAL", "telephony", "preprod", "service_principal", mock_equivalent_ref="ACC_TEL_LOCAL_SIM_PRINCIPAL", notes="Preprod telephony account for live-like webhook, recording, and urgent-escalation rehearsal."),
    actual("SEC_TELEPHONY_PREPROD_WEBHOOK", "telephony", "preprod", "webhook_secret", mock_equivalent_ref="SEC_TEL_LOCAL_WEBHOOK", notes="Preprod telephony webhook secret captured only after recording review."),
    actual("NUM_TELEPHONY_PRODUCTION_RANGE", "telephony", "production", "phone_number", mock_equivalent_ref="NUM_TEL_SHARED_DEV_TEST_RANGE", notes="Production number range requires operational owner and backup owner before activation."),
    actual("ACC_EMAIL_PREPROD_PROJECT", "email", "preprod", "service_principal", mock_equivalent_ref="ACC_EMAIL_LOCAL_SIM_PRINCIPAL", notes="Preprod email project principal for secure-link delivery validation."),
    actual("ID_EMAIL_PRODUCTION_SENDER", "email", "production", "sender_identity", mock_equivalent_ref="ID_EMAIL_LOCAL_SENDER", notes="Production sender identity requires wrong-recipient drill and support routing."),
    actual("SEC_EMAIL_PRODUCTION_WEBHOOK", "email", "production", "webhook_secret", mock_equivalent_ref="SEC_EMAIL_CI_WEBHOOK", notes="Production email callback secret remains dual controlled."),
    actual("ACC_SMS_INTEGRATION_PROJECT", "sms", "integration", "service_principal", mock_equivalent_ref="ACC_SMS_LOCAL_SIM_PRINCIPAL", notes="Optional SMS project principal remains blocked until continuation cohorts are approved."),
    actual("ID_SMS_INTEGRATION_SENDER", "sms", "integration", "sender_identity", mock_equivalent_ref="ID_SMS_LOCAL_SENDER", notes="Optional SMS sender identity needs wrong-recipient and opt-in review."),
    actual("ACC_MESH_PREPROD_MAILBOX", "messaging_transport", "preprod", "mailbox_credential", mock_equivalent_ref="ACC_MESH_SHARED_DEV_MAILBOX", notes="Preprod MESH mailbox for cross-org dispatch rehearsal."),
    actual("KEY_MESH_PRODUCTION_TRANSPORT_CERT", "messaging_transport", "production", "private_key", mock_equivalent_ref="KEY_MESH_SHARED_DEV_TRANSPORT_CERT", notes="Production transport certificate lives only in the production HSM keyring."),
    actual("ACC_PHARMACY_DIRECTORY_INTEGRATION_PRINCIPAL", "pharmacy_directory", "integration", "service_principal", mock_equivalent_ref="ACC_PHARMACY_DIRECTORY_SHARED_DEV_PRINCIPAL", notes="Directory principal for live access-path evaluation."),
    actual("ACC_PHARMACY_DISPATCH_PREPROD_MAILBOX", "pharmacy_transport", "preprod", "mailbox_credential", mock_equivalent_ref="ACC_PHARMACY_DISPATCH_LOCAL_MAILBOX", notes="Preprod transport mailbox for dispatch and urgent-return rehearsal."),
    actual("SEC_PHARMACY_DISPATCH_PRODUCTION_WEBHOOK", "pharmacy_transport", "production", "webhook_secret", mock_equivalent_ref="SEC_PHARMACY_DISPATCH_CI_WEBHOOK", notes="Production dispatch callback secret requires redispatch and bounce-back proof."),
    actual("ACC_PHARMACY_OUTCOME_INTEGRATION_MAILBOX", "pharmacy_outcome", "integration", "mailbox_credential", mock_equivalent_ref="ACC_PHARMACY_OUTCOME_SHARED_DEV_MAILBOX", notes="Outcome mailbox for authoritative and weak-match ingestion."),
    actual("ACC_NHS_APP_SANDPIT_SITE_LINK", "embedded_channel", "sandpit", "other", notes="Deferred placeholder for site-link metadata and embedded manifest control."),
    actual("SEC_ASSISTIVE_PREPROD_VENDOR_KEY", "model_vendor", "preprod", "client_secret", notes="Future-optional model vendor key remains blocked until intended-use review and rollback proof exist."),
]


def env_sort_key(value: str) -> int:
    return ENVIRONMENT_ORDER.index(value)


def record_class_sort_key(value: str) -> int:
    return RECORD_CLASS_ORDER.index(value)


def class_is_secret(record_class: str) -> bool:
    return CLASS_PROFILES[record_class]["secret_presence"] == "yes"


def storage_backend_for(environment: str, record_class: str, current_lane: str) -> str:
    metadata_classes = {"account", "client_registration", "public_key", "phone_number", "sender_identity", "other"}
    if environment == "local_mock":
        return "local_ephemeral_secret_store"
    if environment == "ci_mock":
        return "ci_ephemeral_secret_store"
    if environment == "shared_dev":
        if record_class in {"sandbox_dataset", "test_user", "phone_number", "sender_identity", "client_registration", "public_key", "account"}:
            return "shared_nonprod_fixture_registry"
        if record_class in {"private_key", "signing_key"}:
            return "nonprod_hsm_keyring"
        return "shared_nonprod_vault"
    if environment in {"sandpit", "integration"}:
        if record_class in {"private_key", "signing_key"}:
            return "nonprod_hsm_keyring"
        if record_class in metadata_classes:
            return "partner_metadata_registry"
        return "shared_nonprod_vault"
    if environment == "preprod":
        if record_class in {"private_key", "signing_key"}:
            return "nonprod_hsm_keyring"
        if record_class in metadata_classes:
            return "partner_metadata_registry"
        return "preprod_vault"
    if record_class in {"private_key", "signing_key"}:
        return "production_hsm_keyring"
    if record_class in metadata_classes:
        return "partner_metadata_registry"
    return "production_vault"


def distribution_method_for(environment: str, record_class: str, current_lane: str) -> str:
    if current_lane == "mock_now":
        if environment == "ci_mock":
            return "short_lived_ci_secret_injection"
        return "deterministic_seed_bootstrap"
    if record_class in {"account", "client_registration", "public_key", "phone_number", "sender_identity", "other"}:
        return "approved_metadata_publish"
    if record_class in {"test_user", "sandbox_dataset"}:
        return "partner_test_pack_ingest"
    return "dual_control_capture_then_vault_ingest"


def rotation_policy_for(environment: str, record_class: str, current_lane: str) -> str:
    if current_lane == "mock_now":
        if environment in {"local_mock", "ci_mock"}:
            return "per_spin_up_or_pipeline_run"
        return "daily_shared_reset_or_on_contract_change"
    if record_class in {"client_secret", "service_principal", "webhook_secret", "mailbox_credential"}:
        if environment == "production":
            return "dual_control_every_60_days_or_on_incident"
        if environment == "preprod":
            return "every_90_days_or_before_release_candidate_widen"
        return "every_90_days_or_provider_maximum"
    if record_class in {"private_key", "signing_key"}:
        if environment == "production":
            return "dual_control_every_60_days_or_on_redirect_or_certificate_change"
        return "every_90_days_or_on_environment_change"
    if record_class in {"test_user"}:
        return "quarterly_or_on_partner_refresh"
    if record_class in {"sandbox_dataset"}:
        return "every_shared_reset_and_before_evidence_capture"
    return "quarterly_recertification_and_on_topology_change"


def revocation_policy_for(record_class: str, current_lane: str) -> str:
    if current_lane == "mock_now":
        return "destroy_seed_material_reset_environment_append_mock_audit"
    if record_class in {"account", "client_registration", "public_key", "phone_number", "sender_identity", "other"}:
        return "remove_from_partner_registry_republish_runtime_metadata_append_audit"
    if record_class in {"test_user", "sandbox_dataset"}:
        return "revoke_partner_test_pack_reset_fixture_registry_append_audit"
    return "disable_at_provider_rotate_dependent_handles_republish_runtime_append_audit"


def audit_sink_for(current_lane: str) -> str:
    return "MockCredentialSeedAudit" if current_lane == "mock_now" else "ExternalAccessLifecycleLedger"


def origin_source_for(spec_row: dict[str, Any]) -> str:
    if spec_row["origin_source"]:
        return spec_row["origin_source"]
    record_class = spec_row["record_class"]
    environment = spec_row["environment"]
    lane = spec_row["current_lane"]
    if lane == "mock_now":
        if environment == "ci_mock":
            return "ci_seed_and_runtime_bootstrap"
        return "deterministic_seed_generator"
    if record_class in {"account", "client_registration", "public_key", "phone_number", "sender_identity", "other"}:
        return "provider_admin_console_or_partner_form"
    if record_class in {"test_user", "sandbox_dataset"}:
        return "partner_test_pack_or_synthetic_dataset_delivery"
    return "partner_portal_download_or_secure_operator_capture"


def landing_zone_for(spec_row: dict[str, Any]) -> str:
    if spec_row["current_lane"] == "mock_now":
        return "seed_bootstrap_outside_repo"
    if spec_row["record_class"] in {"account", "client_registration", "public_key", "phone_number", "sender_identity", "other"}:
        return "partner_metadata_review_queue"
    if spec_row["record_class"] in {"test_user", "sandbox_dataset"}:
        return "partner_test_pack_quarantine"
    return "partner_capture_quarantine"


def runtime_injection_path_for(spec_row: dict[str, Any]) -> str:
    record_class = spec_row["record_class"]
    env = spec_row["environment"]
    if record_class in {"account", "client_registration", "public_key", "phone_number", "sender_identity", "other"}:
        return "control_plane_metadata_publication"
    if record_class in {"sandbox_dataset", "test_user"}:
        return "seed_fixture_sync_and_environment_reset"
    if env in {"local_mock", "ci_mock"}:
        return "ephemeral_runtime_secret_mount"
    if env in {"shared_dev", "sandpit", "integration"}:
        return "nonprod_workload_identity_fetch"
    if env == "preprod":
        return "preprod_workload_identity_fetch"
    return "production_workload_identity_fetch"


def dual_control_required(spec_row: dict[str, Any]) -> str:
    record_class = spec_row["record_class"]
    lane = spec_row["current_lane"]
    env = spec_row["environment"]
    if lane == "mock_now":
        return "no"
    if class_is_secret(record_class):
        return "yes"
    if env == "production" and record_class in {"account", "client_registration", "public_key", "phone_number", "sender_identity"}:
        return "yes"
    return "no"


def exposure_constraints_for(record_class: str) -> str:
    if class_is_secret(record_class):
        return (
            "No markdown literals, no console echo, no trace/video capture, "
            "screenshots only after explicit redaction, runtime reference handles only."
        )
    if record_class == "test_user":
        return "Credentials masked; usernames and identifiers appear only as redacted placeholders."
    if record_class == "sandbox_dataset":
        return "Synthetic-only material; never mix with live partner outputs or live patient-like identifiers."
    return "Metadata may appear only as placeholder, hash, or approved identifier digest; never adjacent to live secret values."


def redaction_profile_for(record_class: str) -> str:
    if class_is_secret(record_class):
        return "full_secret_mask_and_capture_block"
    if record_class in {"test_user", "phone_number", "sender_identity"}:
        return "masked_identifier_and_placeholder_render"
    if record_class == "sandbox_dataset":
        return "synthetic_only_render"
    return "identifier_hash_or_placeholder"


def usage_surfaces_for(spec_row: dict[str, Any]) -> list[str]:
    profile = FAMILY_PROFILES[spec_row["dependency_family"]]
    base = list(profile["mock_surfaces"] if spec_row["current_lane"] == "mock_now" else profile["actual_surfaces"])
    record_class = spec_row["record_class"]
    if record_class in {"sandbox_dataset", "test_user"}:
        base.append("seed_reset_job")
    if record_class in {"sender_identity"}:
        base.append("notification_template_registry")
    if record_class in {"phone_number"}:
        base.append("telephony_number_registry")
    if record_class in {"client_registration", "public_key"}:
        base.append("redirect_and_key_inventory")
    base.extend(spec_row["extra_surfaces"])
    deduped: list[str] = []
    for item in base:
        if item not in deduped:
            deduped.append(item)
    return deduped


def build_inventory(prereqs: dict[str, Any]) -> list[dict[str, Any]]:
    risks = prereqs["master_risk_register"]["risks"]
    risk_index = defaultdict(list)
    for risk in risks:
        for dep in risk["affected_dependency_refs"]:
            risk_index[dep].append(risk["risk_id"])

    inventory: list[dict[str, Any]] = []
    for raw in ACCESS_SPECS:
        family = FAMILY_PROFILES[raw["dependency_family"]]
        record_class = raw["record_class"]
        manual_checkpoint_required = raw["manual_checkpoint_required"]
        if manual_checkpoint_required is None:
            manual_checkpoint_required = "no" if raw["current_lane"] == "mock_now" else "yes"
        source_refs = list(family["source_refs"])
        if raw["current_lane"] != "mock_now":
            source_refs.append("docs/external/21_integration_priority_and_execution_matrix.md#Scorecards And Secret Posture")
        risk_refs: list[str] = []
        for dep in family["dependency_refs"]:
            for risk_id in risk_index.get(dep, []):
                if risk_id not in risk_refs:
                    risk_refs.append(risk_id)
        live_gate_refs = list(family["live_gate_refs"])
        for gate in raw["extra_live_gate_refs"]:
            if gate not in live_gate_refs:
                live_gate_refs.append(gate)
        row = {
            "account_or_secret_id": raw["account_or_secret_id"],
            "dependency_family": raw["dependency_family"],
            "dependency_title": family["title"],
            "environment": raw["environment"],
            "record_class": record_class,
            "current_lane": raw["current_lane"],
            "owner_role": family["owner_role"],
            "backup_owner_role": family["backup_owner_role"],
            "creator_role": family["creator_role"],
            "approver_role": family["approver_role"],
            "storage_backend": storage_backend_for(raw["environment"], record_class, raw["current_lane"]),
            "distribution_method": distribution_method_for(raw["environment"], record_class, raw["current_lane"]),
            "rotation_policy": rotation_policy_for(raw["environment"], record_class, raw["current_lane"]),
            "revocation_policy": revocation_policy_for(record_class, raw["current_lane"]),
            "audit_sink": audit_sink_for(raw["current_lane"]),
            "exposure_constraints": exposure_constraints_for(record_class),
            "allowed_usage_surfaces": usage_surfaces_for(raw),
            "manual_checkpoint_required": manual_checkpoint_required,
            "live_gate_refs": live_gate_refs,
            "mock_equivalent_ref": raw["mock_equivalent_ref"],
            "origin_source": origin_source_for(raw),
            "landing_zone": landing_zone_for(raw),
            "runtime_injection_path": runtime_injection_path_for(raw),
            "dual_control_required": dual_control_required(raw),
            "redaction_profile": redaction_profile_for(record_class),
            "source_refs": source_refs,
            "risk_refs": risk_refs,
            "notes": raw["notes"] or family["notes"],
        }
        inventory.append(row)
    inventory.sort(
        key=lambda row: (
            row["dependency_family"],
            env_sort_key(row["environment"]),
            record_class_sort_key(row["record_class"]),
            row["account_or_secret_id"],
        )
    )
    return inventory


def build_classification_matrix() -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    for record_class in RECORD_CLASS_ORDER:
        profile = CLASS_PROFILES[record_class]
        rows.append(
            {
                "record_class": record_class,
                "class_kind": profile["class_kind"],
                "secret_presence": profile["secret_presence"],
                "dual_control_default": profile["dual_control_default"],
                "mock_allowed": profile["mock_allowed"],
                "production_allowed": profile["production_allowed"],
                "browser_trace_policy": profile["browser_trace_policy"],
                "log_redaction_policy": profile["log_redaction_policy"],
                "notes": profile["notes"],
                "source_refs": "; ".join(
                    [
                        "prompt/023.md",
                        "blueprint/platform-runtime-and-release-blueprint.md#Secrets must come from a managed secret store or KMS-backed mechanism, never from source control or long-lived CI variables.",
                        "docs/architecture/15_security_control_and_secret_management_baseline.md",
                    ]
                ),
            }
        )
    return rows


def build_seed_plan(inventory: list[dict[str, Any]]) -> dict[str, Any]:
    seed_rows = [row for row in inventory if row["current_lane"] in {"mock_now", "hybrid"}]
    family_groups: dict[str, list[str]] = defaultdict(list)
    for row in seed_rows:
        family_groups[row["dependency_family"]].append(row["account_or_secret_id"])
    plans = []
    for family_key in sorted(family_groups):
        environment_mix = sorted({row["environment"] for row in seed_rows if row["dependency_family"] == family_key}, key=env_sort_key)
        plans.append(
            {
                "seed_plan_id": f"SEED_{family_key.upper()}",
                "dependency_family": family_key,
                "dependency_title": FAMILY_PROFILES[family_key]["title"],
                "seed_scope": environment_mix,
                "seed_material_refs": family_groups[family_key],
                "seed_generation_mode": "deterministic_fixture_generator",
                "reset_trigger": "per_spin_up_or_shared_reset",
                "storage_targets": sorted({row["storage_backend"] for row in seed_rows if row["dependency_family"] == family_key}),
                "required_controls": [
                    "synthetic_only_material",
                    "repo_exclusion",
                    "seed_hash_manifest",
                    "playwright_trace_redaction",
                ],
                "notes": FAMILY_PROFILES[family_key]["notes"],
            }
        )
    return {
        "seed_plan_id": "seq_023_mock_account_seed_plan_v1",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "summary": {
            "seed_family_count": len(plans),
            "mock_or_hybrid_inventory_rows": len(seed_rows),
            "local_mock_rows": sum(1 for row in seed_rows if row["environment"] == "local_mock"),
            "ci_mock_rows": sum(1 for row in seed_rows if row["environment"] == "ci_mock"),
            "shared_dev_rows": sum(1 for row in seed_rows if row["environment"] == "shared_dev"),
        },
        "global_rules": [
            "No real provider secrets enter the seed plan.",
            "Local and CI seed material resets independently; shared-dev resets are explicit and audited.",
            "Playwright and CI consume brokered mock references, never repo fixtures with live-like secret values.",
        ],
        "fixture_packs": [
            "synthetic_identity_claims_and_test_users",
            "telephony_call_recording_and_transcript_placeholders",
            "notification_sender_and_delivery_webhook_states",
            "booking_capability_matrix_and_slot_snapshots",
            "pharmacy_directory_dispatch_and_outcome_packages",
            "secure_message_mailbox_and_transport_replay_fixtures",
        ],
        "seed_plans": plans,
    }


def build_capture_checklist(inventory: list[dict[str, Any]]) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    for item in inventory:
        if item["current_lane"] == "mock_now":
            continue
        capture_type = "metadata_capture" if not class_is_secret(item["record_class"]) else "secret_capture"
        rows.append(
            {
                "checklist_id": f"CAPTURE_{item['account_or_secret_id']}",
                "dependency_family": item["dependency_family"],
                "environment": item["environment"],
                "target_account_or_secret_id": item["account_or_secret_id"],
                "capture_type": capture_type,
                "initiator_role": item["creator_role"],
                "approver_role": item["approver_role"],
                "manual_checkpoint_required": item["manual_checkpoint_required"],
                "gate_refs": "; ".join(item["live_gate_refs"]),
                "prerequisite_artifacts": "named approver; environment target; current route or endpoint inventory; current runbook binding",
                "landing_zone": item["landing_zone"],
                "redaction_steps": "disable trace/video; redact screenshots; capture placeholder only in notes; ingest actual value into vault or metadata registry immediately",
                "vault_ingest_target": item["storage_backend"],
                "runtime_binding_target": item["runtime_injection_path"],
                "verification_evidence": "owner-chain confirmation; access audit; runtime handle proof; publication or metadata parity",
                "incident_or_revocation_path": item["revocation_policy"],
                "source_refs": "; ".join(item["source_refs"]),
                "notes": item["notes"],
            }
        )
    return rows


def summarize_families(inventory: list[dict[str, Any]]) -> list[dict[str, Any]]:
    grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in inventory:
        grouped[row["dependency_family"]].append(row)
    summary = []
    for family_key in sorted(grouped):
        rows = grouped[family_key]
        summary.append(
            {
                "dependency_family": family_key,
                "dependency_title": FAMILY_PROFILES[family_key]["title"],
                "mock_now": sum(1 for row in rows if row["current_lane"] == "mock_now"),
                "actual_later": sum(1 for row in rows if row["current_lane"] == "actual_later"),
                "hybrid": sum(1 for row in rows if row["current_lane"] == "hybrid"),
                "manual_checkpoints": sum(1 for row in rows if row["manual_checkpoint_required"] == "yes"),
                "dual_control": sum(1 for row in rows if row["dual_control_required"] == "yes"),
                "environments": ", ".join(sorted({row["environment"] for row in rows}, key=env_sort_key)),
            }
        )
    return summary


def build_ownership_payload(prereqs: dict[str, Any], inventory: list[dict[str, Any]], classifications: list[dict[str, str]], seed_plan: dict[str, Any], capture_checklist: list[dict[str, str]]) -> dict[str, Any]:
    family_summary = summarize_families(inventory)
    summary = {
        "inventory_row_count": len(inventory),
        "family_count": len({row["dependency_family"] for row in inventory}),
        "mock_now_count": sum(1 for row in inventory if row["current_lane"] == "mock_now"),
        "actual_later_count": sum(1 for row in inventory if row["current_lane"] == "actual_later"),
        "hybrid_count": sum(1 for row in inventory if row["current_lane"] == "hybrid"),
        "dual_control_count": sum(1 for row in inventory if row["dual_control_required"] == "yes"),
        "manual_checkpoint_count": sum(1 for row in inventory if row["manual_checkpoint_required"] == "yes"),
        "missing_owner_count": sum(
            1
            for row in inventory
            if not row["owner_role"] or not row["backup_owner_role"] or not row["creator_role"] or not row["approver_role"]
        ),
        "phase0_entry_verdict": prereqs["phase0_gate_verdict"]["gate_verdicts"][0]["verdict"],
    }
    return {
        "map_id": "seq_023_secret_ownership_map_v1",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "mission": MISSION,
        "visual_mode": VISUAL_MODE,
        "source_precedence": SOURCE_PRECEDENCE,
        "upstream_inputs": {
            "integration_priority_model": prereqs["integration_priority_matrix"]["model_id"],
            "lane_assignment_id": prereqs["mock_live_lane_assignments"]["lane_assignment_id"],
            "provider_scorecard_model": prereqs["provider_family_scorecards"]["model_id"],
            "runtime_topology_id": prereqs["runtime_workload_families"]["topology_id"],
            "risk_register_id": prereqs["master_risk_register"]["register_id"],
        },
        "summary": summary,
        "non_negotiable_rules": NON_NEGOTIABLE_RULES,
        "assumptions": ASSUMPTIONS,
        "role_catalog": ROLE_CATALOG,
        "storage_backends": STORAGE_BACKENDS,
        "live_gate_catalog": LIVE_GATES,
        "family_profiles": FAMILY_PROFILES,
        "family_summary": family_summary,
        "change_control_rules": CHANGE_CONTROL_RULES,
        "runbook_steps": RUNBOOK_STEPS,
        "secret_classification_matrix": classifications,
        "mock_seed_plan": seed_plan,
        "capture_checklist": capture_checklist,
        "account_inventory": inventory,
    }


def csv_rows_for_inventory(inventory: list[dict[str, Any]]) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    for item in inventory:
        rows.append(
            {
                "account_or_secret_id": item["account_or_secret_id"],
                "dependency_family": item["dependency_family"],
                "dependency_title": item["dependency_title"],
                "environment": item["environment"],
                "record_class": item["record_class"],
                "current_lane": item["current_lane"],
                "owner_role": item["owner_role"],
                "backup_owner_role": item["backup_owner_role"],
                "creator_role": item["creator_role"],
                "approver_role": item["approver_role"],
                "storage_backend": item["storage_backend"],
                "distribution_method": item["distribution_method"],
                "rotation_policy": item["rotation_policy"],
                "revocation_policy": item["revocation_policy"],
                "audit_sink": item["audit_sink"],
                "exposure_constraints": item["exposure_constraints"],
                "allowed_usage_surfaces": "; ".join(item["allowed_usage_surfaces"]),
                "manual_checkpoint_required": item["manual_checkpoint_required"],
                "live_gate_refs": "; ".join(item["live_gate_refs"]),
                "mock_equivalent_ref": item["mock_equivalent_ref"],
                "origin_source": item["origin_source"],
                "landing_zone": item["landing_zone"],
                "runtime_injection_path": item["runtime_injection_path"],
                "dual_control_required": item["dual_control_required"],
                "redaction_profile": item["redaction_profile"],
                "risk_refs": "; ".join(item["risk_refs"]),
                "source_refs": "; ".join(item["source_refs"]),
                "notes": item["notes"],
            }
        )
    return rows


def write_csv(path: Path, rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n")


def markdown_table(rows: list[dict[str, Any]], columns: list[tuple[str, str]]) -> str:
    header = "| " + " | ".join(label for _, label in columns) + " |"
    divider = "| " + " | ".join("---" for _ in columns) + " |"
    body = []
    for row in rows:
        body.append("| " + " | ".join(str(row[key]) for key, _ in columns) + " |")
    return "\n".join([header, divider, *body])


def render_strategy_markdown(payload: dict[str, Any]) -> str:
    family_rows = payload["family_summary"]
    summary = payload["summary"]
    rules = "\n".join(f"- {rule['summary']}" for rule in payload["non_negotiable_rules"])
    return textwrap.dedent(
        f"""
        # 23 Sandbox Account Strategy

        Current gate posture from seq_020 remains `{summary['phase0_entry_verdict']}`. This pack closes the account-and-secret governance gap by freezing one ownership, storage, ingest, and revocation model across mock-now execution and later real-provider onboarding.

        ## Summary

        - inventory rows: {summary['inventory_row_count']}
        - dependency families: {summary['family_count']}
        - mock rows: {summary['mock_now_count']}
        - actual-later rows: {summary['actual_later_count']}
        - hybrid rows: {summary['hybrid_count']}
        - dual-control rows: {summary['dual_control_count']}
        - manual checkpoint rows: {summary['manual_checkpoint_count']}
        - missing-owner rows: {summary['missing_owner_count']}

        ## Section A — `Mock_now_execution`

        Mock accounts and secrets are deterministic, synthetic, and environment-scoped. Local and CI rows reset automatically; shared-dev rows remain synthetic but auditable so Playwright, contract tests, and seed jobs can rehearse the same flow without borrowing any live partner material.

        {markdown_table(
            family_rows,
            [
                ("dependency_title", "Family"),
                ("mock_now", "Mock now"),
                ("hybrid", "Hybrid"),
                ("environments", "Environments"),
            ],
        )}

        Mock-now law:
        {rules}

        ## Section B — `Actual_provider_strategy_later`

        Later real-provider onboarding is pre-modeled but still blocked behind explicit live gates. Every live row has a named owner, backup owner, approver, storage backend, ingest path, and revocation path before seq_024-040 touch any provider portal or live credentials.

        {markdown_table(
            family_rows,
            [
                ("dependency_title", "Family"),
                ("actual_later", "Actual later"),
                ("manual_checkpoints", "Manual checkpoints"),
                ("dual_control", "Dual control"),
            ],
        )}

        Live-provider posture:
        - Every live capture lands first in `partner_capture_quarantine` or the metadata review queue.
        - Every production secret row is dual controlled and has both owner and backup owner.
        - Redirect URI, key, mailbox, sender, phone number, and environment changes are treated as governed change events, not operator convenience edits.
        - Deferred NHS App and future-optional assistive vendor rows stay placeholder-only and never rebaseline the current path.
        """
    ).strip() + "\n"


def render_rotation_markdown(payload: dict[str, Any]) -> str:
    rows = []
    for family_key, profile in sorted(payload["family_profiles"].items()):
        rows.append(
            {
                "family": profile["title"],
                "owner": profile["owner_role"],
                "backup": profile["backup_owner_role"],
                "creator": profile["creator_role"],
                "approver": profile["approver_role"],
                "gates": ", ".join(profile["live_gate_refs"][:2]),
            }
        )
    backends = []
    for item in payload["storage_backends"]:
        backends.append(
            {
                "storage_backend": item["storage_backend"],
                "trust_zone": item["trust_zone"],
                "usage_class": item["usage_class"],
            }
        )
    return textwrap.dedent(
        f"""
        # 23 Secret Ownership And Rotation Model

        This model separates partner-console metadata from runtime secret material, then assigns owner, backup owner, creator, and approver chains before any account or credential enters the system.

        ## Owner Chain Matrix

        {markdown_table(
            rows,
            [
                ("family", "Family"),
                ("owner", "Owner"),
                ("backup", "Backup owner"),
                ("creator", "Creator"),
                ("approver", "Approver"),
                ("gates", "Representative gates"),
            ],
        )}

        ## Storage And Custody

        {markdown_table(
            backends,
            [
                ("storage_backend", "Storage backend"),
                ("trust_zone", "Trust zone"),
                ("usage_class", "Usage class"),
            ],
        )}

        Rotation law:
        - Mock-only secret rows rotate per spin-up or per shared reset.
        - Live secret rows rotate on a fixed cadence plus every environment, redirect, endpoint, incident, or ownership change that could invalidate trust.
        - Metadata rows such as sender identities, phone numbers, client registrations, and public keys recertify on every topology change and at least quarterly.
        - Revocation always appends audit evidence and republishes runtime or metadata truth; no stale reference is allowed to linger as an implicit allow.
        """
    ).strip() + "\n"


def render_mock_markdown(payload: dict[str, Any]) -> str:
    seed_plan = payload["mock_seed_plan"]
    plan_rows = []
    for item in seed_plan["seed_plans"]:
        plan_rows.append(
            {
                "family": item["dependency_title"],
                "scope": ", ".join(item["seed_scope"]),
                "seed_generation_mode": item["seed_generation_mode"],
                "reset_trigger": item["reset_trigger"],
            }
        )
    return textwrap.dedent(
        f"""
        # 23 Mock Account Bootstrap Plan

        ## Section A — `Mock_now_execution`

        Mock credentials are seeded from deterministic generators and never sourced from real partner consoles. The bootstrap law splits local, CI, and shared-dev paths so mocks remain realistic without creating loose operational state.

        {markdown_table(
            plan_rows,
            [
                ("family", "Family"),
                ("scope", "Seed scope"),
                ("seed_generation_mode", "Generation"),
                ("reset_trigger", "Reset trigger"),
            ],
        )}

        Mock fixture packs:
        - {seed_plan['fixture_packs'][0]}
        - {seed_plan['fixture_packs'][1]}
        - {seed_plan['fixture_packs'][2]}
        - {seed_plan['fixture_packs'][3]}
        - {seed_plan['fixture_packs'][4]}
        - {seed_plan['fixture_packs'][5]}

        ## Section B — `Actual_provider_strategy_later`

        Real later rows never backfill the mock bootstrap path. Instead, each live row points to its mock equivalent where one exists, so later onboarding can prove contract parity without reusing the mock secret itself.

        Later bootstrap rules:
        - shared-dev retains synthetic accounts even after sandpit or production partners exist
        - CI remains secret-brokered and ephemeral, never seeded from live vault values
        - any mock fixture that becomes misleading after real onboarding must be superseded with a documented `MOCK_DRIFT_*` update instead of silent mutation
        """
    ).strip() + "\n"


def render_governance_markdown(payload: dict[str, Any]) -> str:
    rows = []
    for rule in payload["change_control_rules"]:
        rows.append(
            {
                "change": rule["summary"],
                "roles": rule["roles"],
                "evidence": rule["evidence"],
            }
        )
    return textwrap.dedent(
        f"""
        # 23 Actual Partner Account Governance

        ## Section A — `Mock_now_execution`

        Mock execution proves the same change seams now: redirect inventory, key custody, sender and number ownership, mailbox binding, and route publication. That rehearsal is what prevents later live onboarding from improvising security posture.

        ## Section B — `Actual_provider_strategy_later`

        Later live-provider setup follows one governed lifecycle:
        1. request and approval
        2. capture into quarantine or metadata review
        3. vault or registry ingest
        4. runtime or publication binding
        5. rotation or revocation evidence

        {markdown_table(
            rows,
            [
                ("change", "Change event"),
                ("roles", "Required roles"),
                ("evidence", "Required evidence"),
            ],
        )}

        Governance consequences:
        - test and production accounts are segregated by environment, storage backend, and approval chain
        - redirect, sender, mailbox, and number changes are publication-affecting changes, not ticket-only updates
        - no shared production credential may remain single-owner or un-audited
        """
    ).strip() + "\n"


def render_runbook_markdown(payload: dict[str, Any], capture_checklist: list[dict[str, str]]) -> str:
    excerpt = capture_checklist[:12]
    excerpt_rows = []
    for item in excerpt:
        excerpt_rows.append(
            {
                "target": item["target_account_or_secret_id"],
                "family": item["dependency_family"],
                "environment": item["environment"],
                "capture_type": item["capture_type"],
                "landing_zone": item["landing_zone"],
            }
        )
    steps = "\n".join(f"{idx}. {step}" for idx, step in enumerate(payload["runbook_steps"], start=1))
    return textwrap.dedent(
        f"""
        # 23 Credential Ingest And Redaction Runbook

        ## Section A — `Mock_now_execution`

        Mock capture is still audited. Seed material lands outside the repo, Playwright consumes brokered handles, and any screenshot or trace created during rehearsal must remain secret-free.

        ## Section B — `Actual_provider_strategy_later`

        Capture and ingest sequence:
        {steps}

        Checklist excerpt:

        {markdown_table(
            excerpt_rows,
            [
                ("target", "Target"),
                ("family", "Family"),
                ("environment", "Environment"),
                ("capture_type", "Capture type"),
                ("landing_zone", "Landing zone"),
            ],
        )}

        Browser-automation redaction law:
        - live dry runs default to no trace, no video, and redacted screenshots only
        - raw values may enter only brokered input channels and may never be echoed back into DOM assertions or logs
        - generated markdown and HTML stay placeholder-only even after a real capture session occurs
        """
    ).strip() + "\n"


def render_html(payload: dict[str, Any]) -> str:
    data_json = json.dumps(payload, separators=(",", ":")).replace("</", "<\\/")
    return textwrap.dedent(
        f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>23 External Access Governance Cockpit</title>
          <style>
            :root {{
              --canvas: #F6F8FB;
              --shell: #FFFFFF;
              --inset: #EEF2F7;
              --text-strong: #0F172A;
              --text-default: #1E293B;
              --text-muted: #64748B;
              --border-subtle: #E2E8F0;
              --border-default: #CBD5E1;
              --ownership: #335CFF;
              --vault: #7C3AED;
              --rotation: #0F9D58;
              --warning: #C98900;
              --blocked: #C24141;
              --radius: 18px;
              --shadow: 0 18px 48px rgba(15, 23, 42, 0.08);
            }}
            * {{ box-sizing: border-box; }}
            body {{
              margin: 0;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
              background: linear-gradient(180deg, #F6F8FB 0%, #EEF2F7 100%);
              color: var(--text-default);
            }}
            .page {{
              max-width: 1440px;
              margin: 0 auto;
              padding: 24px;
              display: grid;
              gap: 24px;
            }}
            .panel {{
              background: var(--shell);
              border: 1px solid var(--border-subtle);
              border-radius: var(--radius);
              box-shadow: var(--shadow);
            }}
            .hero {{
              padding: 24px;
              display: grid;
              gap: 20px;
            }}
            .hero-head {{
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              gap: 24px;
            }}
            .hero-title {{
              display: grid;
              gap: 8px;
            }}
            .eyebrow {{
              letter-spacing: 0.18em;
              text-transform: uppercase;
              color: var(--vault);
              font-size: 12px;
              font-weight: 700;
            }}
            .hero h1 {{
              margin: 0;
              font-size: clamp(28px, 4vw, 42px);
              color: var(--text-strong);
            }}
            .hero p {{
              margin: 0;
              max-width: 860px;
              color: var(--text-muted);
              line-height: 1.55;
            }}
            .orbit {{
              width: 96px;
              height: 96px;
              border-radius: 50%;
              background: radial-gradient(circle at 30% 30%, rgba(124,58,237,0.12), rgba(51,92,255,0.08));
              display: grid;
              place-items: center;
            }}
            .banner-grid {{
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
              gap: 16px;
            }}
            .banner-card {{
              min-width: 160px;
              padding: 18px;
              border: 1px solid var(--border-subtle);
              border-radius: 16px;
              background: var(--shell);
              display: grid;
              gap: 8px;
            }}
            .banner-card strong {{
              color: var(--text-strong);
              font-size: 28px;
            }}
            .workspace {{
              display: grid;
              grid-template-columns: 280px minmax(0, 1fr) 360px;
              gap: 24px;
              align-items: start;
            }}
            .rail, .center, .inspector {{
              padding: 20px;
            }}
            .rail {{
              display: grid;
              gap: 16px;
            }}
            .filter-group {{
              display: grid;
              gap: 10px;
            }}
            .filter-group h2, .center h2, .inspector h2 {{
              margin: 0;
              color: var(--text-strong);
              font-size: 16px;
            }}
            .family-buttons {{
              display: grid;
              gap: 10px;
            }}
            button, select {{
              min-height: 44px;
              border-radius: 14px;
              border: 1px solid var(--border-default);
              background: var(--shell);
              color: var(--text-default);
              font: inherit;
              cursor: pointer;
              transition: background 120ms ease, border-color 120ms ease, transform 120ms ease;
            }}
            button:hover, select:hover {{
              border-color: var(--ownership);
              transform: translateY(-1px);
            }}
            button[data-active="true"] {{
              background: rgba(51, 92, 255, 0.08);
              border-color: var(--ownership);
              color: var(--text-strong);
            }}
            button:focus-visible, select:focus-visible {{
              outline: 2px solid var(--ownership);
              outline-offset: 2px;
            }}
            .family-button {{
              padding: 12px 14px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              text-align: left;
            }}
            .family-button small {{
              color: var(--text-muted);
            }}
            .center {{
              display: grid;
              gap: 18px;
            }}
            .rotation-strip {{
              display: grid;
              gap: 12px;
            }}
            .rotation-grid {{
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
              gap: 12px;
            }}
            .rotation-card {{
              background: var(--inset);
              border: 1px solid var(--border-subtle);
              border-radius: 14px;
              padding: 14px;
              display: grid;
              gap: 6px;
            }}
            .table-shell {{
              border: 1px solid var(--border-subtle);
              border-radius: 16px;
              overflow: hidden;
              background: var(--shell);
              min-height: 420px;
            }}
            table {{
              width: 100%;
              border-collapse: collapse;
            }}
            thead {{
              background: var(--inset);
              position: sticky;
              top: 0;
            }}
            th, td {{
              padding: 12px 14px;
              border-bottom: 1px solid var(--border-subtle);
              font-size: 14px;
              vertical-align: top;
            }}
            th {{
              color: var(--text-strong);
              text-align: left;
            }}
            .row-button {{
              width: 100%;
              text-align: left;
              border: 0;
              background: transparent;
              min-height: 0;
              padding: 0;
              color: inherit;
              border-radius: 8px;
            }}
            .row-button[data-selected="true"] {{
              color: var(--ownership);
              font-weight: 700;
            }}
            .pill {{
              display: inline-flex;
              align-items: center;
              gap: 6px;
              padding: 4px 10px;
              border-radius: 999px;
              font-size: 12px;
              border: 1px solid var(--border-default);
              background: var(--shell);
            }}
            .inspector {{
              min-width: 320px;
              max-width: 440px;
              display: grid;
              gap: 16px;
            }}
            .detail-block {{
              border: 1px solid var(--border-subtle);
              border-radius: 14px;
              background: var(--inset);
              padding: 14px;
              display: grid;
              gap: 8px;
            }}
            .detail-grid {{
              display: grid;
              gap: 10px;
            }}
            .detail-grid div {{
              display: grid;
              gap: 4px;
            }}
            .label {{
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 0.08em;
              color: var(--text-muted);
            }}
            .flow-panel {{
              padding: 20px;
              display: grid;
              gap: 18px;
            }}
            .flow-diagram {{
              min-height: 280px;
              border: 1px solid var(--border-subtle);
              border-radius: 16px;
              background: linear-gradient(180deg, rgba(124,58,237,0.04), rgba(51,92,255,0.03));
              padding: 18px;
              display: grid;
              gap: 12px;
            }}
            .flow-track {{
              display: grid;
              grid-template-columns: repeat(5, minmax(0, 1fr));
              gap: 12px;
              align-items: center;
            }}
            .flow-stage {{
              min-height: 88px;
              border-radius: 16px;
              border: 1px solid var(--border-default);
              background: var(--shell);
              padding: 14px;
              display: grid;
              gap: 6px;
            }}
            .flow-arrow {{
              align-self: center;
              justify-self: center;
              color: var(--text-muted);
              font-weight: 700;
            }}
            .parity-table {{
              border: 1px solid var(--border-subtle);
              border-radius: 16px;
              overflow: hidden;
            }}
            .muted {{
              color: var(--text-muted);
            }}
            .warning {{
              color: var(--warning);
            }}
            .blocked {{
              color: var(--blocked);
            }}
            @media (max-width: 1180px) {{
              .workspace {{
                grid-template-columns: 1fr;
              }}
              .inspector {{
                max-width: none;
              }}
            }}
            @media (max-width: 860px) {{
              .page {{
                padding: 16px;
              }}
              .flow-track {{
                grid-template-columns: 1fr;
              }}
              .flow-arrow {{
                transform: rotate(90deg);
              }}
            }}
            @media (prefers-reduced-motion: reduce) {{
              * {{
                scroll-behavior: auto !important;
                transition-duration: 0ms !important;
                animation-duration: 0ms !important;
              }}
            }}
          </style>
        </head>
        <body>
          <script id="access-governance-data" type="application/json">{data_json}</script>
          <div class="page" data-testid="access-gov-shell">
            <section class="panel hero">
              <div class="hero-head">
                <div class="hero-title">
                  <div class="eyebrow">Credential_Observatory</div>
                  <h1>External Access Governance Cockpit</h1>
                  <p>One ownership, capture, rotation, and revocation model for mock-now execution and later real-provider onboarding. Live posture remains fail-closed until the required external gates and evidence chains clear.</p>
                </div>
                <div class="orbit" aria-hidden="true">
                  <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
                    <circle cx="36" cy="36" r="22" stroke="#335CFF" stroke-width="1.5" stroke-dasharray="5 4"/>
                    <circle cx="36" cy="36" r="10" fill="#7C3AED" fill-opacity="0.15" stroke="#7C3AED" stroke-width="1.5"/>
                    <circle cx="56" cy="28" r="4" fill="#0F9D58"/>
                    <circle cx="18" cy="44" r="3.5" fill="#C98900"/>
                    <path d="M20 24C28 17 41 16 50 23" stroke="#CBD5E1" stroke-width="1.5" stroke-linecap="round"/>
                    <path d="M22 50C31 57 45 56 52 48" stroke="#CBD5E1" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>
                </div>
              </div>
              <div class="banner-grid" data-testid="access-posture-banner"></div>
            </section>

            <section class="workspace">
              <aside class="panel rail">
                <div class="filter-group">
                  <h2>Dependency Family</h2>
                  <div class="family-buttons" data-testid="access-family-filter"></div>
                </div>
                <div class="filter-group">
                  <h2>Environment</h2>
                  <select data-testid="access-environment-filter" aria-label="Environment filter"></select>
                </div>
                <div class="filter-group">
                  <h2>Rules</h2>
                  <div id="rule-list" class="muted"></div>
                </div>
              </aside>

              <main class="panel center">
                <section class="rotation-strip" data-testid="rotation-schedule-strip">
                  <h2>Rotation Schedule Strip</h2>
                  <div class="rotation-grid" id="rotation-grid"></div>
                </section>
                <section class="table-shell" data-testid="access-inventory-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Account or Secret</th>
                        <th>Family</th>
                        <th>Env</th>
                        <th>Class</th>
                        <th>Lane</th>
                        <th>Owner</th>
                        <th>Storage</th>
                      </tr>
                    </thead>
                    <tbody id="inventory-body"></tbody>
                  </table>
                </section>
                <section class="table-shell" data-testid="secret-class-matrix">
                  <table>
                    <thead>
                      <tr>
                        <th>Record class</th>
                        <th>Kind</th>
                        <th>Secret</th>
                        <th>Dual control</th>
                        <th>Trace policy</th>
                      </tr>
                    </thead>
                    <tbody id="class-body"></tbody>
                  </table>
                </section>
              </main>

              <aside class="panel inspector" data-testid="access-inspector">
                <h2>Lifecycle Inspector</h2>
                <div class="detail-block">
                  <div id="inspector-title" class="detail-grid"></div>
                </div>
                <div class="detail-block">
                  <strong>Owner Chain</strong>
                  <div id="owner-chain" class="detail-grid"></div>
                </div>
                <div class="detail-block">
                  <strong>Allowed Surfaces</strong>
                  <div id="surface-list" class="detail-grid"></div>
                </div>
                <div class="detail-block">
                  <strong>Capture And Revocation Notes</strong>
                  <div id="capture-notes" class="detail-grid"></div>
                </div>
              </aside>
            </section>

            <section class="panel flow-panel">
              <h2>Credential Flow</h2>
              <div class="flow-diagram" data-testid="credential-flow-diagram">
                <div class="flow-track" id="flow-track"></div>
              </div>
              <div class="parity-table" data-testid="credential-flow-parity-table">
                <table>
                  <thead>
                    <tr>
                      <th>Stage</th>
                      <th>Value</th>
                    </tr>
                  </thead>
                  <tbody id="flow-parity-body"></tbody>
                </table>
              </div>
            </section>
          </div>
          <script>
            const payload = JSON.parse(document.getElementById('access-governance-data').textContent);
            const envOrder = {json.dumps(ENVIRONMENT_ORDER)};
            const state = {{
              family: 'all',
              environment: 'all',
              selectedId: payload.account_inventory[0]?.account_or_secret_id ?? null,
            }};

            function filteredRows() {{
              return payload.account_inventory.filter((row) => {{
                const familyOk = state.family === 'all' || row.dependency_family === state.family;
                const envOk = state.environment === 'all' || row.environment === state.environment;
                return familyOk && envOk;
              }});
            }}

            function currentRow() {{
              const rows = filteredRows();
              if (!rows.some((row) => row.account_or_secret_id === state.selectedId)) {{
                state.selectedId = rows[0]?.account_or_secret_id ?? payload.account_inventory[0]?.account_or_secret_id ?? null;
              }}
              return payload.account_inventory.find((row) => row.account_or_secret_id === state.selectedId) ?? payload.account_inventory[0];
            }}

            function renderBanner() {{
              const summary = payload.summary;
              const cards = [
                ['Mock rows', summary.mock_now_count, 'Deterministic local, CI, and shared-dev rehearsal material.'],
                ['Live pending', summary.actual_later_count, 'Placeholder live-provider rows still blocked behind gates.'],
                ['Dual control', summary.dual_control_count, 'Rows that require capture and rotation under more than one operator.'],
                ['Missing owner', summary.missing_owner_count, 'Expected to stay at zero; any non-zero value is a governance defect.'],
              ];
              const container = document.querySelector('[data-testid="access-posture-banner"]');
              container.innerHTML = cards.map(([label, value, detail]) => `
                <div class="banner-card">
                  <span class="label">${{label}}</span>
                  <strong>${{value}}</strong>
                  <span class="muted">${{detail}}</span>
                </div>
              `).join('');
            }}

            function renderFilters() {{
              const familyContainer = document.querySelector('[data-testid="access-family-filter"]');
              const counts = Object.fromEntries(payload.family_summary.map((row) => [row.dependency_family, row.mock_now + row.actual_later + row.hybrid]));
              const buttons = [{{ key: 'all', label: 'All families', count: payload.summary.inventory_row_count }}]
                .concat(payload.family_summary.map((row) => ({{ key: row.dependency_family, label: row.dependency_title, count: counts[row.dependency_family] }})));
              familyContainer.innerHTML = buttons.map((entry) => `
                <button class="family-button" type="button" data-family="${{entry.key}}" data-active="${{state.family === entry.key}}" aria-pressed="${{state.family === entry.key}}">
                  <span>${{entry.label}}</span>
                  <small>${{entry.count}}</small>
                </button>
              `).join('');
              familyContainer.querySelectorAll('button').forEach((button) => {{
                button.addEventListener('click', () => {{
                  state.family = button.dataset.family;
                  renderAll();
                }});
              }});

              const envSelect = document.querySelector('[data-testid="access-environment-filter"]');
              envSelect.innerHTML = ['all', ...envOrder].map((environment) => {{
                const label = environment === 'all' ? 'All environments' : environment;
                return `<option value="${{environment}}" ${{state.environment === environment ? 'selected' : ''}}>${{label}}</option>`;
              }}).join('');
              envSelect.onchange = (event) => {{
                state.environment = event.target.value;
                renderAll();
              }};

              document.getElementById('rule-list').innerHTML = payload.non_negotiable_rules.map((rule) => `<div class="detail-block"><strong>${{rule.rule_id}}</strong><span class="muted">${{rule.summary}}</span></div>`).join('');
            }}

            function renderRotation() {{
              const rows = filteredRows();
              const buckets = new Map();
              rows.forEach((row) => {{
                const key = row.rotation_policy;
                if (!buckets.has(key)) buckets.set(key, []);
                buckets.get(key).push(row.account_or_secret_id);
              }});
              const entries = Array.from(buckets.entries()).slice(0, 6);
              document.getElementById('rotation-grid').innerHTML = entries.map(([policy, refs]) => `
                <div class="rotation-card">
                  <span class="label">Rotation policy</span>
                  <strong>${{refs.length}}</strong>
                  <span>${{policy.replaceAll('_', ' ')}}</span>
                </div>
              `).join('');
            }}

            function renderInventory() {{
              const rows = filteredRows();
              const tbody = document.getElementById('inventory-body');
              tbody.innerHTML = rows.map((row) => `
                <tr>
                  <td>
                    <button class="row-button" type="button" data-row-id="${{row.account_or_secret_id}}" data-selected="${{row.account_or_secret_id === state.selectedId}}">
                      ${{row.account_or_secret_id}}
                    </button>
                  </td>
                  <td>${{row.dependency_title}}</td>
                  <td><span class="pill">${{row.environment}}</span></td>
                  <td>${{row.record_class}}</td>
                  <td>${{row.current_lane}}</td>
                  <td>${{row.owner_role}}</td>
                  <td>${{row.storage_backend}}</td>
                </tr>
              `).join('');
              tbody.querySelectorAll('button').forEach((button) => {{
                button.addEventListener('click', () => {{
                  state.selectedId = button.dataset.rowId;
                  renderAll();
                }});
              }});
            }}

            function renderClassMatrix() {{
              const classes = new Set(filteredRows().map((row) => row.record_class));
              const rows = payload.secret_classification_matrix.filter((row) => classes.has(row.record_class));
              document.getElementById('class-body').innerHTML = rows.map((row) => `
                <tr>
                  <td>${{row.record_class}}</td>
                  <td>${{row.class_kind}}</td>
                  <td>${{row.secret_presence}}</td>
                  <td>${{row.dual_control_default}}</td>
                  <td>${{row.browser_trace_policy}}</td>
                </tr>
              `).join('');
            }}

            function renderInspector() {{
              const row = currentRow();
              if (!row) return;
              document.getElementById('inspector-title').innerHTML = `
                <div>
                  <span class="label">Selected row</span>
                  <strong>${{row.account_or_secret_id}}</strong>
                </div>
                <div>
                  <span>${{row.dependency_title}} · ${{row.environment}} · ${{row.record_class}}</span>
                  <div class="muted">${{row.notes}}</div>
                </div>
              `;
              document.getElementById('owner-chain').innerHTML = [
                ['Owner', row.owner_role],
                ['Backup owner', row.backup_owner_role],
                ['Creator', row.creator_role],
                ['Approver', row.approver_role],
                ['Dual control', row.dual_control_required],
              ].map(([label, value]) => `<div><span class="label">${{label}}</span><span>${{value}}</span></div>`).join('');
              document.getElementById('surface-list').innerHTML = row.allowed_usage_surfaces.map((surface) => `<span class="pill">${{surface}}</span>`).join(' ');
              document.getElementById('capture-notes').innerHTML = [
                ['Origin', row.origin_source],
                ['Landing zone', row.landing_zone],
                ['Runtime path', row.runtime_injection_path],
                ['Rotation', row.rotation_policy],
                ['Revocation', row.revocation_policy],
                ['Audit sink', row.audit_sink],
              ].map(([label, value]) => `<div><span class="label">${{label}}</span><span>${{value}}</span></div>`).join('');
            }}

            function renderFlow() {{
              const row = currentRow();
              if (!row) return;
              const stages = [
                ['Origin', row.origin_source],
                ['Landing', row.landing_zone],
                ['Vault or registry', row.storage_backend],
                ['Runtime injection', row.runtime_injection_path],
                ['Audit', row.audit_sink],
              ];
              const track = document.getElementById('flow-track');
              track.innerHTML = stages.map((stage, index) => `
                <div class="flow-stage">
                  <span class="label">${{stage[0]}}</span>
                  <strong>${{stage[1]}}</strong>
                </div>
                ${{index < stages.length - 1 ? '<div class="flow-arrow">→</div>' : ''}}
              `).join('');
              document.getElementById('flow-parity-body').innerHTML = stages.map((stage) => `
                <tr>
                  <td>${{stage[0]}}</td>
                  <td>${{stage[1]}}</td>
                </tr>
              `).join('');
            }}

            function renderAll() {{
              renderFilters();
              renderRotation();
              renderInventory();
              renderClassMatrix();
              renderInspector();
              renderFlow();
            }}

            renderBanner();
            renderAll();
          </script>
        </body>
        </html>
        """
    ).strip() + "\n"


def main() -> None:
    prereqs = ensure_inputs()
    inventory = build_inventory(prereqs)
    classifications = build_classification_matrix()
    seed_plan = build_seed_plan(inventory)
    capture_checklist = build_capture_checklist(inventory)
    payload = build_ownership_payload(prereqs, inventory, classifications, seed_plan, capture_checklist)

    write_csv(INVENTORY_CSV_PATH, csv_rows_for_inventory(inventory))
    write_csv(CLASSIFICATION_CSV_PATH, classifications)
    write_csv(CAPTURE_CHECKLIST_CSV_PATH, capture_checklist)
    write_json(OWNERSHIP_JSON_PATH, payload)
    write_json(SEED_PLAN_JSON_PATH, seed_plan)

    STRATEGY_MD_PATH.write_text(render_strategy_markdown(payload))
    ROTATION_MD_PATH.write_text(render_rotation_markdown(payload))
    MOCK_MD_PATH.write_text(render_mock_markdown(payload))
    GOVERNANCE_MD_PATH.write_text(render_governance_markdown(payload))
    RUNBOOK_MD_PATH.write_text(render_runbook_markdown(payload, capture_checklist))
    COCKPIT_HTML_PATH.write_text(render_html(payload))


if __name__ == "__main__":
    main()
