#!/usr/bin/env python3
from __future__ import annotations

import csv
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from textwrap import dedent
from typing import Any

from root_script_updates import ROOT_SCRIPT_UPDATES


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"
TESTS_DIR = ROOT / "tests" / "playwright"
API_CONTRACTS_DIR = ROOT / "packages" / "api-contracts"
RELEASE_CONTROLS_DIR = ROOT / "packages" / "release-controls"
API_GATEWAY_DIR = ROOT / "services" / "api-gateway"

ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = TESTS_DIR / "package.json"
API_CONTRACTS_PACKAGE_PATH = API_CONTRACTS_DIR / "package.json"
API_CONTRACTS_PUBLIC_API_TEST_PATH = API_CONTRACTS_DIR / "tests" / "public-api.test.ts"
RELEASE_CONTROLS_INDEX_PATH = RELEASE_CONTROLS_DIR / "src" / "index.ts"
RELEASE_CONTROLS_PUBLIC_API_TEST_PATH = RELEASE_CONTROLS_DIR / "tests" / "public-api.test.ts"
API_GATEWAY_SERVICE_DEFINITION_PATH = API_GATEWAY_DIR / "src" / "service-definition.ts"
API_GATEWAY_RUNTIME_PATH = API_GATEWAY_DIR / "src" / "runtime.ts"

API_REGISTRY_PATH = DATA_DIR / "api_contract_registry_manifest.json"
FRONTEND_MANIFESTS_PATH = DATA_DIR / "frontend_contract_manifests.json"
RUNTIME_BUNDLES_PATH = DATA_DIR / "runtime_publication_bundles.json"
PARITY_RECORDS_PATH = DATA_DIR / "release_publication_parity_records.json"

CACHE_CATALOG_PATH = DATA_DIR / "client_cache_policy_catalog.json"
LIVE_CHANNEL_CATALOG_PATH = DATA_DIR / "live_update_channel_contract_catalog.json"
BROWSER_RECOVERY_MATRIX_PATH = DATA_DIR / "browser_recovery_posture_matrix.csv"

CACHE_SCHEMA_PATH = API_CONTRACTS_DIR / "schemas" / "client-cache-policy.schema.json"
LIVE_CHANNEL_SCHEMA_PATH = API_CONTRACTS_DIR / "schemas" / "live-update-channel-contract.schema.json"
BROWSER_RECOVERY_SCHEMA_PATH = (
    API_CONTRACTS_DIR / "schemas" / "browser-recovery-posture.schema.json"
)

BROWSER_GOVERNOR_CATALOG_TS_PATH = (
    RELEASE_CONTROLS_DIR / "src" / "browser-runtime-governor.catalog.ts"
)

DESIGN_DOC_PATH = DOCS_DIR / "96_client_cache_and_live_update_design.md"
RECOVERY_DOC_PATH = DOCS_DIR / "96_recovery_posture_and_staleness_disclosure.md"
MATRIX_DOC_PATH = DOCS_DIR / "96_browser_freshness_and_recovery_matrix.md"
STUDIO_PATH = DOCS_DIR / "96_cache_channel_contract_studio.html"
SPEC_PATH = TESTS_DIR / "cache-channel-contract-studio.spec.js"

TASK_ID = "par_096"
VISUAL_MODE = "Cache_Channel_Contract_Studio"
GENERATED_AT = datetime.now(timezone.utc).replace(microsecond=0).isoformat()

SOURCE_PRECEDENCE = [
    "prompt/096.md",
    "prompt/shared_operating_contract_096_to_105.md",
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "blueprint/phase-0-the-foundation-protocol.md#Visibility law, continuity law, authority-freeze law",
    "blueprint/platform-runtime-and-release-blueprint.md#LiveUpdateChannelContract",
    "blueprint/platform-runtime-and-release-blueprint.md#ClientCachePolicy",
    "blueprint/platform-runtime-and-release-blueprint.md#RuntimePublicationBundle",
    "blueprint/platform-runtime-and-release-blueprint.md#ReleasePublicationParityRecord",
    "blueprint/platform-runtime-and-release-blueprint.md#ReleaseRecoveryDisposition",
    "blueprint/platform-frontend-blueprint.md#ProjectionFreshnessEnvelope",
    "blueprint/platform-frontend-blueprint.md#ProjectionSubscription",
    "blueprint/platform-frontend-blueprint.md#CalmDegradedStateContract",
    "blueprint/patient-account-and-communications-blueprint.md#Patient-safe continuity and recovery",
    "blueprint/staff-workspace-interface-architecture.md#Workspace trust envelopes",
    "blueprint/staff-operations-and-support-blueprint.md#Support replay and stale review posture",
    "blueprint/operations-console-frontend-blueprint.md#Diagnostic read-only posture",
    "blueprint/accessibility-and-content-system-contract.md#Freshness, timeout, and recovery disclosure",
    "blueprint/forensic-audit-findings.md#Finding 87",
    "blueprint/forensic-audit-findings.md#Finding 88",
    "blueprint/forensic-audit-findings.md#Finding 91",
    "blueprint/forensic-audit-findings.md#Finding 97",
    "blueprint/forensic-audit-findings.md#Finding 101",
    "blueprint/forensic-audit-findings.md#Finding 116",
    "blueprint/forensic-audit-findings.md#Finding 120",
    "data/analysis/frontend_contract_manifests.json",
    "data/analysis/api_contract_registry_manifest.json",
    "data/analysis/runtime_publication_bundles.json",
    "data/analysis/release_publication_parity_records.json",
]

ALLOWED_LIVE_ABSENCE_ROUTE_REFS = {
    "rf_intake_self_service",
    "rf_intake_telephony_capture",
    "rf_patient_health_record",
    "rf_patient_secure_link_recovery",
}

PRIMARY_CACHE_POLICY_BY_ROUTE = {
    "rf_staff_workspace_child": "CP_WORKSPACE_CHILD_PRIVATE_EPHEMERAL",
    "rf_support_ticket_workspace": "CP_SUPPORT_CAPTURE_PRIVATE_EPHEMERAL",
}

CACHE_POLICY_PROFILE = {
    "CP_ASSISTIVE_ADJUNCT_NO_PERSIST": {
        "cacheScope": "entity",
        "ttlSeconds": 25,
        "refetchOnWindowFocus": False,
        "refetchOnReconnect": True,
        "staleWhileRevalidateMode": "disabled",
        "offlineReuseDisposition": "assistive_sidecar_summary_only",
        "sensitiveFieldHandling": "adjunct_prompt_only_no_browser_persist",
        "stalenessDisclosureMode": "workspace_status_strip",
    },
    "CP_CONSTRAINED_CAPTURE_NO_BROWSER_CACHE": {
        "cacheScope": "route_family",
        "ttlSeconds": 15,
        "refetchOnWindowFocus": True,
        "refetchOnReconnect": True,
        "staleWhileRevalidateMode": "disabled",
        "offlineReuseDisposition": "telephony_resume_required",
        "sensitiveFieldHandling": "capture_fields_no_browser_cache",
        "stalenessDisclosureMode": "public_entry_recovery_banner",
    },
    "CP_EMBEDDED_HOST_SCOPED_EPHEMERAL": {
        "cacheScope": "entity",
        "ttlSeconds": 30,
        "refetchOnWindowFocus": True,
        "refetchOnReconnect": True,
        "staleWhileRevalidateMode": "background_rebind",
        "offlineReuseDisposition": "embedded_handoff_only",
        "sensitiveFieldHandling": "grant_scoped_memory_only",
        "stalenessDisclosureMode": "embedded_recovery_banner",
    },
    "CP_GOVERNANCE_CONTROL_EPHEMERAL": {
        "cacheScope": "route_family",
        "ttlSeconds": 45,
        "refetchOnWindowFocus": True,
        "refetchOnReconnect": True,
        "staleWhileRevalidateMode": "background_rebind",
        "offlineReuseDisposition": "governance_last_safe_read_only",
        "sensitiveFieldHandling": "platform_scope_memory_only",
        "stalenessDisclosureMode": "governance_control_notice",
    },
    "CP_GRANT_SCOPED_EPHEMERAL": {
        "cacheScope": "entity",
        "ttlSeconds": 20,
        "refetchOnWindowFocus": True,
        "refetchOnReconnect": True,
        "staleWhileRevalidateMode": "disabled",
        "offlineReuseDisposition": "secure_link_recovery_only",
        "sensitiveFieldHandling": "grant_scoped_memory_only",
        "stalenessDisclosureMode": "embedded_recovery_banner",
    },
    "CP_HUB_CASE_PRIVATE_EPHEMERAL": {
        "cacheScope": "entity",
        "ttlSeconds": 35,
        "refetchOnWindowFocus": True,
        "refetchOnReconnect": True,
        "staleWhileRevalidateMode": "background_rebind",
        "offlineReuseDisposition": "hub_case_last_anchor_read_only",
        "sensitiveFieldHandling": "cross_org_masked_summary",
        "stalenessDisclosureMode": "workspace_status_strip",
    },
    "CP_HUB_QUEUE_PRIVATE_SUMMARY": {
        "cacheScope": "query_result",
        "ttlSeconds": 40,
        "refetchOnWindowFocus": True,
        "refetchOnReconnect": True,
        "staleWhileRevalidateMode": "background_rebind",
        "offlineReuseDisposition": "hub_queue_summary_only",
        "sensitiveFieldHandling": "queue_summary_only",
        "stalenessDisclosureMode": "workspace_status_strip",
    },
    "CP_OPERATIONS_CONTROL_EPHEMERAL": {
        "cacheScope": "route_family",
        "ttlSeconds": 30,
        "refetchOnWindowFocus": True,
        "refetchOnReconnect": True,
        "staleWhileRevalidateMode": "background_rebind",
        "offlineReuseDisposition": "operations_last_safe_diagnostic",
        "sensitiveFieldHandling": "diagnostic_memory_only",
        "stalenessDisclosureMode": "operations_diagnostic_ribbon",
    },
    "CP_OPERATIONS_WATCH_NO_SHARED_CACHE": {
        "cacheScope": "shell",
        "ttlSeconds": 45,
        "refetchOnWindowFocus": True,
        "refetchOnReconnect": True,
        "staleWhileRevalidateMode": "background_rebind",
        "offlineReuseDisposition": "operations_last_safe_diagnostic",
        "sensitiveFieldHandling": "diagnostic_summary_no_shared_cache",
        "stalenessDisclosureMode": "operations_diagnostic_ribbon",
    },
    "CP_PATIENT_ARTIFACT_SUMMARY_NO_STORE": {
        "cacheScope": "query_result",
        "ttlSeconds": 20,
        "refetchOnWindowFocus": True,
        "refetchOnReconnect": True,
        "staleWhileRevalidateMode": "disabled",
        "offlineReuseDisposition": "artifact_summary_only",
        "sensitiveFieldHandling": "artifact_summary_no_store",
        "stalenessDisclosureMode": "patient_status_strip",
    },
    "CP_PATIENT_BOOKING_PRIVATE_EPHEMERAL": {
        "cacheScope": "entity",
        "ttlSeconds": 35,
        "refetchOnWindowFocus": True,
        "refetchOnReconnect": True,
        "staleWhileRevalidateMode": "background_rebind",
        "offlineReuseDisposition": "booking_anchor_read_only",
        "sensitiveFieldHandling": "patient_private_memory_only",
        "stalenessDisclosureMode": "patient_status_strip",
    },
    "CP_PATIENT_ROUTE_INTENT_PRIVATE": {
        "cacheScope": "route_family",
        "ttlSeconds": 30,
        "refetchOnWindowFocus": True,
        "refetchOnReconnect": True,
        "staleWhileRevalidateMode": "background_rebind",
        "offlineReuseDisposition": "request_anchor_read_only",
        "sensitiveFieldHandling": "patient_private_memory_only",
        "stalenessDisclosureMode": "patient_status_strip",
    },
    "CP_PATIENT_SUMMARY_PRIVATE_SHORT": {
        "cacheScope": "query_result",
        "ttlSeconds": 45,
        "refetchOnWindowFocus": True,
        "refetchOnReconnect": True,
        "staleWhileRevalidateMode": "background_rebind",
        "offlineReuseDisposition": "patient_summary_only",
        "sensitiveFieldHandling": "patient_summary_private_short_lived",
        "stalenessDisclosureMode": "patient_status_strip",
    },
    "CP_PATIENT_THREAD_PRIVATE_EPHEMERAL": {
        "cacheScope": "entity",
        "ttlSeconds": 30,
        "refetchOnWindowFocus": True,
        "refetchOnReconnect": True,
        "staleWhileRevalidateMode": "background_rebind",
        "offlineReuseDisposition": "conversation_anchor_read_only",
        "sensitiveFieldHandling": "message_thread_memory_only",
        "stalenessDisclosureMode": "patient_status_strip",
    },
    "CP_PHARMACY_CASE_PRIVATE": {
        "cacheScope": "entity",
        "ttlSeconds": 35,
        "refetchOnWindowFocus": True,
        "refetchOnReconnect": True,
        "staleWhileRevalidateMode": "background_rebind",
        "offlineReuseDisposition": "pharmacy_case_last_safe_read_only",
        "sensitiveFieldHandling": "servicing_case_memory_only",
        "stalenessDisclosureMode": "workspace_status_strip",
    },
    "CP_PUBLIC_NO_PERSISTED_PHI": {
        "cacheScope": "shell",
        "ttlSeconds": 25,
        "refetchOnWindowFocus": True,
        "refetchOnReconnect": True,
        "staleWhileRevalidateMode": "disabled",
        "offlineReuseDisposition": "public_placeholder_only",
        "sensitiveFieldHandling": "public_summary_no_persisted_phi",
        "stalenessDisclosureMode": "public_entry_recovery_banner",
    },
    "CP_SUPPORT_CAPTURE_PRIVATE_EPHEMERAL": {
        "cacheScope": "entity",
        "ttlSeconds": 25,
        "refetchOnWindowFocus": True,
        "refetchOnReconnect": True,
        "staleWhileRevalidateMode": "background_rebind",
        "offlineReuseDisposition": "support_capture_recovery_only",
        "sensitiveFieldHandling": "delegate_capture_memory_only",
        "stalenessDisclosureMode": "support_recovery_notice",
    },
    "CP_SUPPORT_MASKED_PRIVATE": {
        "cacheScope": "query_result",
        "ttlSeconds": 25,
        "refetchOnWindowFocus": True,
        "refetchOnReconnect": True,
        "staleWhileRevalidateMode": "background_rebind",
        "offlineReuseDisposition": "support_masked_read_only",
        "sensitiveFieldHandling": "masked_summary_only",
        "stalenessDisclosureMode": "support_recovery_notice",
    },
    "CP_SUPPORT_REPLAY_FROZEN_NO_STORE": {
        "cacheScope": "route_family",
        "ttlSeconds": 15,
        "refetchOnWindowFocus": False,
        "refetchOnReconnect": True,
        "staleWhileRevalidateMode": "disabled",
        "offlineReuseDisposition": "support_replay_restore_only",
        "sensitiveFieldHandling": "masked_replay_no_store",
        "stalenessDisclosureMode": "support_replay_notice",
    },
    "CP_WORKSPACE_CHILD_PRIVATE_EPHEMERAL": {
        "cacheScope": "entity",
        "ttlSeconds": 30,
        "refetchOnWindowFocus": True,
        "refetchOnReconnect": True,
        "staleWhileRevalidateMode": "background_rebind",
        "offlineReuseDisposition": "workspace_child_anchor_read_only",
        "sensitiveFieldHandling": "task_child_memory_only",
        "stalenessDisclosureMode": "workspace_status_strip",
    },
    "CP_WORKSPACE_SINGLE_ORG_PRIVATE": {
        "cacheScope": "route_family",
        "ttlSeconds": 40,
        "refetchOnWindowFocus": True,
        "refetchOnReconnect": True,
        "staleWhileRevalidateMode": "background_rebind",
        "offlineReuseDisposition": "workspace_anchor_read_only",
        "sensitiveFieldHandling": "single_org_memory_only",
        "stalenessDisclosureMode": "workspace_status_strip",
    },
}

LIVE_CHANNEL_PROFILE = {
    "LCC_050_RF_GOVERNANCE_SHELL_V1": {
        "reconnectPolicyRef": "GAP_RESOLUTION_RECONNECT_POLICY_GOVERNANCE_SSE_V1",
        "reconnectInitialDelayMs": 3000,
        "reconnectMaxDelayMs": 60000,
        "reconnectWindowSeconds": 180,
        "maxReplayGapEvents": 12,
        "stalenessDisclosureMode": "governance_control_notice",
        "downgradeDisposition": "governance_handoff_required",
        "replayGapDisposition": "manual_recovery_only",
        "offlineReconnectDisposition": "manual_recovery_only",
    },
    "LCC_050_RF_HUB_CASE_MANAGEMENT_V1": {
        "reconnectPolicyRef": "GAP_RESOLUTION_RECONNECT_POLICY_HUB_SSE_V1",
        "reconnectInitialDelayMs": 1500,
        "reconnectMaxDelayMs": 30000,
        "reconnectWindowSeconds": 180,
        "maxReplayGapEvents": 25,
        "stalenessDisclosureMode": "workspace_status_strip",
        "downgradeDisposition": "hub_case_read_only",
        "replayGapDisposition": "suspend_and_recover",
        "offlineReconnectDisposition": "retry_with_replay",
    },
    "LCC_050_RF_HUB_QUEUE_V1": {
        "reconnectPolicyRef": "GAP_RESOLUTION_RECONNECT_POLICY_HUB_SSE_V1",
        "reconnectInitialDelayMs": 1500,
        "reconnectMaxDelayMs": 30000,
        "reconnectWindowSeconds": 180,
        "maxReplayGapEvents": 30,
        "stalenessDisclosureMode": "workspace_status_strip",
        "downgradeDisposition": "hub_queue_summary_only",
        "replayGapDisposition": "suspend_and_recover",
        "offlineReconnectDisposition": "retry_with_replay",
    },
    "LCC_050_RF_OPERATIONS_BOARD_V1": {
        "reconnectPolicyRef": "GAP_RESOLUTION_RECONNECT_POLICY_OPERATIONS_WS_V1",
        "reconnectInitialDelayMs": 1000,
        "reconnectMaxDelayMs": 20000,
        "reconnectWindowSeconds": 120,
        "maxReplayGapEvents": 60,
        "stalenessDisclosureMode": "operations_diagnostic_ribbon",
        "downgradeDisposition": "operations_diagnostic_only",
        "replayGapDisposition": "suspend_and_recover",
        "offlineReconnectDisposition": "retry_with_replay",
    },
    "LCC_050_RF_OPERATIONS_DRILLDOWN_V1": {
        "reconnectPolicyRef": "GAP_RESOLUTION_RECONNECT_POLICY_OPERATIONS_WS_V1",
        "reconnectInitialDelayMs": 1000,
        "reconnectMaxDelayMs": 20000,
        "reconnectWindowSeconds": 120,
        "maxReplayGapEvents": 60,
        "stalenessDisclosureMode": "operations_diagnostic_ribbon",
        "downgradeDisposition": "operations_diagnostic_only",
        "replayGapDisposition": "suspend_and_recover",
        "offlineReconnectDisposition": "retry_with_replay",
    },
    "LCC_050_RF_PATIENT_APPOINTMENTS_V1": {
        "reconnectPolicyRef": "GAP_RESOLUTION_RECONNECT_POLICY_PATIENT_SSE_V1",
        "reconnectInitialDelayMs": 2000,
        "reconnectMaxDelayMs": 45000,
        "reconnectWindowSeconds": 180,
        "maxReplayGapEvents": 20,
        "stalenessDisclosureMode": "patient_status_strip",
        "downgradeDisposition": "patient_appointment_read_only",
        "replayGapDisposition": "suspend_and_recover",
        "offlineReconnectDisposition": "retry_with_replay",
    },
    "LCC_050_RF_PATIENT_EMBEDDED_CHANNEL_V1": {
        "reconnectPolicyRef": "GAP_RESOLUTION_RECONNECT_POLICY_EMBEDDED_SSE_V1",
        "reconnectInitialDelayMs": 1500,
        "reconnectMaxDelayMs": 30000,
        "reconnectWindowSeconds": 180,
        "maxReplayGapEvents": 15,
        "stalenessDisclosureMode": "embedded_recovery_banner",
        "downgradeDisposition": "embedded_handoff_required",
        "replayGapDisposition": "suspend_and_recover",
        "offlineReconnectDisposition": "retry_with_replay",
    },
    "LCC_050_RF_PATIENT_HOME_V1": {
        "reconnectPolicyRef": "GAP_RESOLUTION_RECONNECT_POLICY_PATIENT_SSE_V1",
        "reconnectInitialDelayMs": 2000,
        "reconnectMaxDelayMs": 45000,
        "reconnectWindowSeconds": 180,
        "maxReplayGapEvents": 20,
        "stalenessDisclosureMode": "patient_status_strip",
        "downgradeDisposition": "patient_home_read_only",
        "replayGapDisposition": "suspend_and_recover",
        "offlineReconnectDisposition": "retry_with_replay",
    },
    "LCC_050_RF_PATIENT_MESSAGES_V1": {
        "reconnectPolicyRef": "GAP_RESOLUTION_RECONNECT_POLICY_PATIENT_SSE_V1",
        "reconnectInitialDelayMs": 2000,
        "reconnectMaxDelayMs": 45000,
        "reconnectWindowSeconds": 180,
        "maxReplayGapEvents": 25,
        "stalenessDisclosureMode": "patient_status_strip",
        "downgradeDisposition": "patient_messages_read_only",
        "replayGapDisposition": "suspend_and_recover",
        "offlineReconnectDisposition": "retry_with_replay",
    },
    "LCC_050_RF_PATIENT_REQUESTS_V1": {
        "reconnectPolicyRef": "GAP_RESOLUTION_RECONNECT_POLICY_PATIENT_SSE_V1",
        "reconnectInitialDelayMs": 2000,
        "reconnectMaxDelayMs": 45000,
        "reconnectWindowSeconds": 180,
        "maxReplayGapEvents": 25,
        "stalenessDisclosureMode": "patient_status_strip",
        "downgradeDisposition": "patient_request_read_only",
        "replayGapDisposition": "suspend_and_recover",
        "offlineReconnectDisposition": "retry_with_replay",
    },
    "LCC_050_RF_PHARMACY_CONSOLE_V1": {
        "reconnectPolicyRef": "GAP_RESOLUTION_RECONNECT_POLICY_PHARMACY_SSE_V1",
        "reconnectInitialDelayMs": 1500,
        "reconnectMaxDelayMs": 30000,
        "reconnectWindowSeconds": 180,
        "maxReplayGapEvents": 30,
        "stalenessDisclosureMode": "workspace_status_strip",
        "downgradeDisposition": "pharmacy_read_only",
        "replayGapDisposition": "suspend_and_recover",
        "offlineReconnectDisposition": "retry_with_replay",
    },
    "LCC_050_RF_STAFF_WORKSPACE_V1": {
        "reconnectPolicyRef": "GAP_RESOLUTION_RECONNECT_POLICY_WORKSPACE_SSE_V1",
        "reconnectInitialDelayMs": 1500,
        "reconnectMaxDelayMs": 30000,
        "reconnectWindowSeconds": 180,
        "maxReplayGapEvents": 35,
        "stalenessDisclosureMode": "workspace_status_strip",
        "downgradeDisposition": "workspace_read_only",
        "replayGapDisposition": "suspend_and_recover",
        "offlineReconnectDisposition": "retry_with_replay",
    },
    "LCC_050_RF_STAFF_WORKSPACE_CHILD_V1": {
        "reconnectPolicyRef": "GAP_RESOLUTION_RECONNECT_POLICY_WORKSPACE_SSE_V1",
        "reconnectInitialDelayMs": 1500,
        "reconnectMaxDelayMs": 30000,
        "reconnectWindowSeconds": 180,
        "maxReplayGapEvents": 35,
        "stalenessDisclosureMode": "workspace_status_strip",
        "downgradeDisposition": "workspace_child_read_only",
        "replayGapDisposition": "suspend_and_recover",
        "offlineReconnectDisposition": "retry_with_replay",
    },
    "LCC_050_RF_SUPPORT_REPLAY_OBSERVE_V1": {
        "reconnectPolicyRef": "GAP_RESOLUTION_RECONNECT_POLICY_SUPPORT_REPLAY_SSE_V1",
        "reconnectInitialDelayMs": 1500,
        "reconnectMaxDelayMs": 30000,
        "reconnectWindowSeconds": 180,
        "maxReplayGapEvents": 12,
        "stalenessDisclosureMode": "support_replay_notice",
        "downgradeDisposition": "support_replay_restore_frozen",
        "replayGapDisposition": "manual_recovery_only",
        "offlineReconnectDisposition": "suspend_and_recover",
    },
    "LCC_050_RF_SUPPORT_TICKET_WORKSPACE_V1": {
        "reconnectPolicyRef": "GAP_RESOLUTION_RECONNECT_POLICY_SUPPORT_SSE_V1",
        "reconnectInitialDelayMs": 1500,
        "reconnectMaxDelayMs": 30000,
        "reconnectWindowSeconds": 180,
        "maxReplayGapEvents": 25,
        "stalenessDisclosureMode": "support_recovery_notice",
        "downgradeDisposition": "support_capture_read_only",
        "replayGapDisposition": "suspend_and_recover",
        "offlineReconnectDisposition": "retry_with_replay",
    },
}

ROUTE_RECOVERY_POLICY = {
    "rf_governance_shell": {
        "default": "RRD_GOVERNANCE_READ_ONLY",
        "read_only": "RRD_GOVERNANCE_READ_ONLY",
        "recovery_only": "RRD_GOVERNANCE_HANDOFF_ONLY",
        "blocked": "RRD_GOVERNANCE_HANDOFF_ONLY",
        "disclosure": "governance_control_notice",
    },
    "rf_hub_case_management": {
        "default": "RRD_HUB_CASE_READ_ONLY",
        "read_only": "RRD_HUB_CASE_READ_ONLY",
        "recovery_only": "RRD_HUB_CASE_RECOVERY_ONLY",
        "blocked": "RRD_HUB_CASE_RECOVERY_ONLY",
        "disclosure": "workspace_status_strip",
    },
    "rf_hub_queue": {
        "default": "RRD_HUB_QUEUE_READ_ONLY",
        "read_only": "RRD_HUB_QUEUE_READ_ONLY",
        "recovery_only": "RRD_HUB_QUEUE_SUMMARY_ONLY",
        "blocked": "RRD_HUB_QUEUE_SUMMARY_ONLY",
        "disclosure": "workspace_status_strip",
    },
    "rf_intake_self_service": {
        "default": "RRD_PATIENT_INTAKE_RECOVERY",
        "read_only": "RRD_PATIENT_PUBLIC_PLACEHOLDER",
        "recovery_only": "RRD_PATIENT_INTAKE_RECOVERY",
        "blocked": "RRD_PATIENT_INTAKE_RECOVERY",
        "disclosure": "public_entry_recovery_banner",
    },
    "rf_intake_telephony_capture": {
        "default": "RRD_TELEPHONY_CAPTURE_RECOVERY",
        "read_only": "RRD_PATIENT_PUBLIC_PLACEHOLDER",
        "recovery_only": "RRD_TELEPHONY_CAPTURE_RECOVERY",
        "blocked": "RRD_TELEPHONY_CAPTURE_RECOVERY",
        "disclosure": "public_entry_recovery_banner",
    },
    "rf_operations_board": {
        "default": "RRD_OPERATIONS_DIAGNOSTIC_ONLY",
        "read_only": "RRD_OPERATIONS_DIAGNOSTIC_ONLY",
        "recovery_only": "RRD_OPERATIONS_DIAGNOSTIC_ONLY",
        "blocked": "RRD_OPERATIONS_BOARD_FROZEN",
        "disclosure": "operations_diagnostic_ribbon",
    },
    "rf_operations_drilldown": {
        "default": "RRD_OPERATIONS_DIAGNOSTIC_ONLY",
        "read_only": "RRD_OPERATIONS_DIAGNOSTIC_ONLY",
        "recovery_only": "RRD_OPERATIONS_DIAGNOSTIC_ONLY",
        "blocked": "RRD_OPERATIONS_BOARD_FROZEN",
        "disclosure": "operations_diagnostic_ribbon",
    },
    "rf_patient_appointments": {
        "default": "RRD_PATIENT_APPOINTMENT_READ_ONLY",
        "read_only": "RRD_PATIENT_APPOINTMENT_READ_ONLY",
        "recovery_only": "RRD_BOOKING_CONFIRMATION_PLACEHOLDER",
        "blocked": "RRD_BOOKING_CONFIRMATION_PLACEHOLDER",
        "disclosure": "patient_status_strip",
    },
    "rf_patient_embedded_channel": {
        "default": "RRD_EMBEDDED_READ_ONLY",
        "read_only": "RRD_EMBEDDED_READ_ONLY",
        "recovery_only": "RRD_EMBEDDED_HANDOFF_ONLY",
        "blocked": "RRD_EMBEDDED_HANDOFF_ONLY",
        "disclosure": "embedded_recovery_banner",
    },
    "rf_patient_health_record": {
        "default": "RRD_PATIENT_RECORD_SUMMARY_ONLY",
        "read_only": "RRD_PATIENT_RECORD_SUMMARY_ONLY",
        "recovery_only": "RRD_ARTIFACT_HANDOFF_REQUIRED",
        "blocked": "RRD_ARTIFACT_HANDOFF_REQUIRED",
        "disclosure": "patient_status_strip",
    },
    "rf_patient_home": {
        "default": "RRD_PATIENT_HOME_READ_ONLY",
        "read_only": "RRD_PATIENT_HOME_READ_ONLY",
        "recovery_only": "RRD_PATIENT_HOME_PLACEHOLDER",
        "blocked": "RRD_PATIENT_HOME_PLACEHOLDER",
        "disclosure": "patient_status_strip",
    },
    "rf_patient_messages": {
        "default": "RRD_PATIENT_MESSAGES_READ_ONLY",
        "read_only": "RRD_PATIENT_MESSAGES_READ_ONLY",
        "recovery_only": "RRD_CONVERSATION_RECOVERY_ONLY",
        "blocked": "RRD_CONVERSATION_RECOVERY_ONLY",
        "disclosure": "patient_status_strip",
    },
    "rf_patient_requests": {
        "default": "RRD_PATIENT_REQUEST_READ_ONLY",
        "read_only": "RRD_PATIENT_REQUEST_READ_ONLY",
        "recovery_only": "RRD_PATIENT_REQUEST_RECOVERY_ONLY",
        "blocked": "RRD_PATIENT_REQUEST_RECOVERY_ONLY",
        "disclosure": "patient_status_strip",
    },
    "rf_patient_secure_link_recovery": {
        "default": "RRD_SECURE_LINK_RECOVERY_ONLY",
        "read_only": "RRD_EMBEDDED_READ_ONLY",
        "recovery_only": "RRD_SECURE_LINK_RECOVERY_ONLY",
        "blocked": "RRD_EMBEDDED_HANDOFF_ONLY",
        "disclosure": "embedded_recovery_banner",
    },
    "rf_pharmacy_console": {
        "default": "RRD_PHARMACY_READ_ONLY",
        "read_only": "RRD_PHARMACY_READ_ONLY",
        "recovery_only": "RRD_PHARMACY_DISPATCH_RECOVERY",
        "blocked": "RRD_PHARMACY_DISPATCH_RECOVERY",
        "disclosure": "workspace_status_strip",
    },
    "rf_staff_workspace": {
        "default": "RRD_WORKSPACE_READ_ONLY",
        "read_only": "RRD_WORKSPACE_READ_ONLY",
        "recovery_only": "RRD_WORKSPACE_QUEUE_PLACEHOLDER",
        "blocked": "RRD_WORKSPACE_QUEUE_PLACEHOLDER",
        "disclosure": "workspace_status_strip",
    },
    "rf_staff_workspace_child": {
        "default": "RRD_WORKSPACE_CHILD_READ_ONLY",
        "read_only": "RRD_WORKSPACE_CHILD_READ_ONLY",
        "recovery_only": "RRD_WORKSPACE_CHILD_RECOVERY_ONLY",
        "blocked": "RRD_WORKSPACE_CHILD_RECOVERY_ONLY",
        "disclosure": "workspace_status_strip",
    },
    "rf_support_replay_observe": {
        "default": "RRD_SUPPORT_REPLAY_MASKED",
        "read_only": "RRD_SUPPORT_REPLAY_MASKED",
        "recovery_only": "RRD_SUPPORT_REPLAY_RESTORE_FROZEN",
        "blocked": "RRD_SUPPORT_REPLAY_RESTORE_FROZEN",
        "disclosure": "support_replay_notice",
    },
    "rf_support_ticket_workspace": {
        "default": "RRD_SUPPORT_CAPTURE_READ_ONLY",
        "read_only": "RRD_SUPPORT_WORKSPACE_READ_ONLY",
        "recovery_only": "RRD_SUPPORT_CAPTURE_RECOVERY",
        "blocked": "RRD_SUPPORT_CAPTURE_RECOVERY",
        "disclosure": "support_recovery_notice",
    },
}

AUDIENCE_POSTURE_PROFILE = {
    "audsurf_patient_public_entry": {
        "transient": "recovery_only",
        "replay_gap": "recovery_only",
        "stale": "recovery_only",
        "freeze": "recovery_only",
        "trust": "recovery_only",
        "manifest": "recovery_only",
        "offline": "recovery_only",
    },
    "audsurf_patient_authenticated_portal": {
        "transient": "read_only",
        "replay_gap": "recovery_only",
        "stale": "read_only",
        "freeze": "read_only",
        "trust": "read_only",
        "manifest": "recovery_only",
        "offline": "read_only",
    },
    "audsurf_patient_transaction_recovery": {
        "transient": "recovery_only",
        "replay_gap": "recovery_only",
        "stale": "recovery_only",
        "freeze": "recovery_only",
        "trust": "recovery_only",
        "manifest": "recovery_only",
        "offline": "recovery_only",
    },
    "audsurf_clinical_workspace": {
        "transient": "read_only",
        "replay_gap": "recovery_only",
        "stale": "read_only",
        "freeze": "read_only",
        "trust": "recovery_only",
        "manifest": "recovery_only",
        "offline": "read_only",
    },
    "audsurf_support_workspace": {
        "transient": "recovery_only",
        "replay_gap": "recovery_only",
        "stale": "recovery_only",
        "freeze": "recovery_only",
        "trust": "recovery_only",
        "manifest": "recovery_only",
        "offline": "recovery_only",
    },
    "audsurf_hub_desk": {
        "transient": "read_only",
        "replay_gap": "recovery_only",
        "stale": "read_only",
        "freeze": "read_only",
        "trust": "recovery_only",
        "manifest": "recovery_only",
        "offline": "read_only",
    },
    "audsurf_pharmacy_console": {
        "transient": "read_only",
        "replay_gap": "recovery_only",
        "stale": "read_only",
        "freeze": "read_only",
        "trust": "recovery_only",
        "manifest": "recovery_only",
        "offline": "read_only",
    },
    "audsurf_operations_console": {
        "transient": "recovery_only",
        "replay_gap": "recovery_only",
        "stale": "recovery_only",
        "freeze": "recovery_only",
        "trust": "recovery_only",
        "manifest": "recovery_only",
        "offline": "read_only",
    },
    "audsurf_governance_admin": {
        "transient": "read_only",
        "replay_gap": "blocked",
        "stale": "read_only",
        "freeze": "read_only",
        "trust": "blocked",
        "manifest": "blocked",
        "offline": "read_only",
    },
}

FOLLOW_ON_DEPENDENCIES = [
    {
        "dependencyId": "FOLLOW_ON_DEPENDENCY_CONTENT_PATIENT_FRESHNESS_COPY_V1",
        "title": "Patient-safe stale copy remains explicit placeholder law",
        "boundedSeam": (
            "par_096 publishes stable disclosure modes and recovery posture now, but later shell work "
            "can refine the final audience copy without changing the underlying contract tuple."
        ),
    },
    {
        "dependencyId": "FOLLOW_ON_DEPENDENCY_CONTENT_WORKSPACE_STALE_COPY_V1",
        "title": "Workspace stale explanations can refine later",
        "boundedSeam": (
            "Workspace and pharmacy surfaces already degrade deterministically here; later shell "
            "iterations may refine phrasing only."
        ),
    },
    {
        "dependencyId": "FOLLOW_ON_DEPENDENCY_CONTENT_OPERATIONS_STALE_COPY_V1",
        "title": "Operations and governance diagnostic wording can refine later",
        "boundedSeam": (
            "The downgrade law is published here. Later content work may refine diagnostics or "
            "handoff wording, but not the runtime posture transitions."
        ),
    },
]

GAP_RESOLUTIONS = [
    {
        "gapId": "GAP_RESOLUTION_RECONNECT_POLICY_PATIENT_SSE_V1",
        "kind": "reconnect_policy",
        "notes": "Bounded SSE reconnect defaults for patient routes until transport tuning is validated in production.",
    },
    {
        "gapId": "GAP_RESOLUTION_RECONNECT_POLICY_EMBEDDED_SSE_V1",
        "kind": "reconnect_policy",
        "notes": "Embedded and secure-link channels use short replay windows and fail closed on ambiguity.",
    },
    {
        "gapId": "GAP_RESOLUTION_RECONNECT_POLICY_WORKSPACE_SSE_V1",
        "kind": "reconnect_policy",
        "notes": "Workspace routes preserve anchor context but freeze writes until projection freshness is re-established.",
    },
    {
        "gapId": "GAP_RESOLUTION_RECONNECT_POLICY_HUB_SSE_V1",
        "kind": "reconnect_policy",
        "notes": "Hub queues and case views favor summary continuity with explicit recovery on replay gaps.",
    },
    {
        "gapId": "GAP_RESOLUTION_RECONNECT_POLICY_PHARMACY_SSE_V1",
        "kind": "reconnect_policy",
        "notes": "Pharmacy fan-out keeps same-shell continuity while suppressing dispatch mutation until replay completes.",
    },
    {
        "gapId": "GAP_RESOLUTION_RECONNECT_POLICY_SUPPORT_SSE_V1",
        "kind": "reconnect_policy",
        "notes": "Support ticket workspace reconnects may recover in place but stay explicit about masked or delegated truth.",
    },
    {
        "gapId": "GAP_RESOLUTION_RECONNECT_POLICY_SUPPORT_REPLAY_SSE_V1",
        "kind": "reconnect_policy",
        "notes": "Support replay observe routes suspend live continuity on ambiguity and require manual restore.",
    },
    {
        "gapId": "GAP_RESOLUTION_RECONNECT_POLICY_GOVERNANCE_SSE_V1",
        "kind": "reconnect_policy",
        "notes": "Governance routes fail closed to operator handoff on manifest or trust ambiguity.",
    },
    {
        "gapId": "GAP_RESOLUTION_RECONNECT_POLICY_OPERATIONS_WS_V1",
        "kind": "reconnect_policy",
        "notes": "Operations websocket defaults allow fast replay-safe reconnect but never imply restored freshness by transport alone.",
    },
]


def require(condition: bool, code: str) -> None:
    if not condition:
        raise RuntimeError(code)


def load_json(path: Path) -> Any:
    require(path.exists(), f"PREREQUISITE_GAP_096_MISSING::{path}")
    return json.loads(path.read_text(encoding="utf-8"))


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n", encoding="utf-8")


def write_json(path: Path, payload: Any) -> None:
    write_text(path, json.dumps(payload, indent=2))


def write_csv(path: Path, rows: list[dict[str, Any]], fieldnames: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def stable_json(value: Any) -> str:
    return json.dumps(value, separators=(",", ":"), sort_keys=True)


def stable_hash(value: Any) -> str:
    return hashlib.sha256(stable_json(value).encode("utf-8")).hexdigest()[:16]


def unique_sorted(values: list[str]) -> list[str]:
    return sorted(dict.fromkeys(values))


def title_from_ref(value: str) -> str:
    return value.replace("rf_", "").replace("CP_", "").replace("LCC_050_", "").replace("_", " ").title()


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def patch_release_controls_index() -> None:
    source = read_text(RELEASE_CONTROLS_INDEX_PATH)
    export_line = 'export * from "./browser-runtime-governor";'
    if export_line in source:
        return
    marker = '// par_094_runtime_publication_exports:end\n'
    require(marker in source, "PREREQUISITE_GAP_096_RELEASE_CONTROLS_INDEX_MARKER")
    source = source.replace(
        marker,
        marker
        + "\n"
        + "// par_096_browser_runtime_governor_exports:start\n"
        + export_line
        + "\n"
        + "// par_096_browser_runtime_governor_exports:end\n",
        1,
    )
    write_text(RELEASE_CONTROLS_INDEX_PATH, source)


def patch_release_controls_public_api_test() -> None:
    source = read_text(RELEASE_CONTROLS_PUBLIC_API_TEST_PATH)
    if "createBrowserRuntimeSimulationHarness" not in source:
        source = source.replace(
            "  createRuntimePublicationSimulationHarness,\n",
            "  createRuntimePublicationSimulationHarness,\n"
            "  createBrowserRuntimeSimulationHarness,\n",
            1,
        )
    if 'it("runs the browser runtime governor simulation harness"' not in source:
        source = source.replace(
            '  it("runs the projection rebuild simulation harness", () => {\n',
            dedent(
                """
                  it("runs the browser runtime governor simulation harness", () => {
                    const harness = createBrowserRuntimeSimulationHarness();
                    expect(harness.catalog.taskId).toBe("par_096");
                    expect(harness.scenarios).toHaveLength(5);
                    expect(harness.telemetryEvents).toHaveLength(5);
                  });

                  it("runs the projection rebuild simulation harness", () => {
                """
            ),
            1,
        )
    write_text(RELEASE_CONTROLS_PUBLIC_API_TEST_PATH, source)


def patch_api_contracts_package_json() -> None:
    package = load_json(API_CONTRACTS_PACKAGE_PATH)
    exports = package.setdefault("exports", {})
    exports["./schemas/browser-recovery-posture.schema.json"] = (
        "./schemas/browser-recovery-posture.schema.json"
    )
    write_json(API_CONTRACTS_PACKAGE_PATH, package)


def patch_api_contracts_public_api_test() -> None:
    source = read_text(API_CONTRACTS_PUBLIC_API_TEST_PATH)
    test_snippet = dedent(
        """
          it("publishes the par_096 browser recovery schema surface", () => {
            const schemaPath = path.join(
              ROOT,
              "packages",
              "api-contracts",
              "schemas",
              "browser-recovery-posture.schema.json",
            );
            expect(fs.existsSync(schemaPath)).toBe(true);
          });
        """
    ).strip()
    if test_snippet not in source:
        source = source.replace(
            '  it("publishes the par_065 api contract registry schema surface", () => {\n',
            test_snippet + "\n\n  it(\"publishes the par_065 api contract registry schema surface\", () => {\n",
            1,
        )
    write_text(API_CONTRACTS_PUBLIC_API_TEST_PATH, source)


def patch_root_package_json() -> None:
    package = load_json(ROOT_PACKAGE_PATH)
    package["scripts"].update(ROOT_SCRIPT_UPDATES)
    write_json(ROOT_PACKAGE_PATH, package)


def patch_playwright_package_json() -> None:
    package = load_json(PLAYWRIGHT_PACKAGE_PATH)
    spec_name = "cache-channel-contract-studio.spec.js"
    tokens = {
        "build": f"node --check {spec_name}",
        "lint": f"eslint {spec_name}",
        "test": f"node {spec_name}",
        "typecheck": f"node --check {spec_name}",
        "e2e": f"node {spec_name} --run",
    }
    for script_name, token in tokens.items():
        command = package["scripts"][script_name]
        if token not in command:
            package["scripts"][script_name] = f"{command} && {token}"
    description = package.get("description", "").rstrip(".")
    fragment = "cache-channel contract browser checks"
    if fragment not in description:
        description = (description + ", cache-channel contract browser checks").strip(", ")
    package["description"] = description + "."
    write_json(PLAYWRIGHT_PACKAGE_PATH, package)


def patch_api_gateway_service_definition() -> None:
    source = read_text(API_GATEWAY_SERVICE_DEFINITION_PATH)
    if "/runtime/cache-channel-contracts" not in source:
        route_block = dedent(
            """
                {
                  routeId: "get_cache_channel_contracts",
                  method: "GET",
                  path: "/runtime/cache-channel-contracts",
                  contractFamily: "BrowserRecoveryPostureContract",
                  purpose:
                    "Resolve route-family cache, live-channel, freshness, parity, and recovery posture from the published runtime tuple without implying fresh truth from warm caches or open transports.",
                  bodyRequired: false,
                  idempotencyRequired: false,
                },
            """
        )
        source = source.replace(
            "  ] as const satisfies readonly ServiceRouteDefinition[],",
            route_block + "  ] as const satisfies readonly ServiceRouteDefinition[],",
            1,
        )

    if "cache_channel_contract_governor" not in source:
        readiness_block = dedent(
            """
                {
                  name: "cache_channel_contract_governor",
                  detail:
                    "Published cache, live-update, freshness, and recovery posture tuples resolve from the shared release-controls governor before route-local shells consume them.",
                  failureMode:
                    "Fail closed to explicit recovery posture lookup errors instead of inferring fresh or writable truth from transport health or cached payloads.",
                },
            """
        )
        source = source.replace(
            "  ] as const,\n  retryProfiles:",
            readiness_block + "  ] as const,\n  retryProfiles:",
            1,
        )

    if "tests/cache-channel-contracts.integration.test.js" not in source:
        source = source.replace(
            '    "tests/cache-live-transport.integration.test.js",\n',
            '    "tests/cache-live-transport.integration.test.js",\n'
            '    "tests/cache-channel-contracts.integration.test.js",\n',
            1,
        )

    write_text(API_GATEWAY_SERVICE_DEFINITION_PATH, source)


def patch_api_gateway_runtime() -> None:
    source = read_text(API_GATEWAY_RUNTIME_PATH)
    if 'from "./cache-channel-contracts";' not in source:
        source = source.replace(
            'import { buildCacheLiveTransportResponse } from "./cache-live-transport";\n',
            'import { buildCacheLiveTransportResponse } from "./cache-live-transport";\n'
            'import { buildCacheChannelContractsResponse } from "./cache-channel-contracts";\n',
            1,
        )
    if 'route.routeId === "get_cache_channel_contracts"' not in source:
        handler_block = dedent(
            """
                      if (route.routeId === "get_cache_channel_contracts") {
                        const payload = buildCacheChannelContractsResponse(requestUrl.searchParams);
                        logger.info("service_request_completed", {
                          routeId: route.routeId,
                          correlationId,
                          traceId,
                          edgeCorrelationId: edgeCorrelation.edgeCorrelationId,
                          causalToken: edgeCorrelation.causalToken,
                          statusCode: payload.statusCode,
                        });
                        respondJson(
                          response,
                          payload.statusCode,
                          correlationId,
                          traceId,
                          edgeCorrelation,
                          payload.body,
                        );
                        return;
                      }

            """
        )
        context_anchor = '          const context: WorkloadRequestContext = {\n'
        require(
            context_anchor in source,
            "PREREQUISITE_GAP_096_API_GATEWAY_RUNTIME_CONTEXT_ANCHOR",
        )
        source = source.replace(context_anchor, handler_block + context_anchor, 1)
    write_text(API_GATEWAY_RUNTIME_PATH, source)


def resolve_primary_cache_policy(route_bundle: dict[str, Any]) -> tuple[str, list[str]]:
    route_ref = route_bundle["routeFamilyRef"]
    refs = list(route_bundle["clientCachePolicyRefs"])
    if route_ref in PRIMARY_CACHE_POLICY_BY_ROUTE:
        primary = PRIMARY_CACHE_POLICY_BY_ROUTE[route_ref]
        secondary = [ref for ref in refs if ref != primary]
        return primary, secondary
    return refs[0], refs[1:]


def posture_for_audience(audience_surface: str, key: str) -> str:
    require(
        audience_surface in AUDIENCE_POSTURE_PROFILE,
        f"PREREQUISITE_GAP_096_AUDIENCE_PROFILE::{audience_surface}",
    )
    return AUDIENCE_POSTURE_PROFILE[audience_surface][key]


def build_publication_rings(
    bundle_rows: list[dict[str, Any]],
    parity_rows: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    parity_by_ref = {row["publicationParityRecordId"]: row for row in parity_rows}
    rows: list[dict[str, Any]] = []
    for bundle in sorted(bundle_rows, key=lambda row: row["environmentRing"]):
        parity = parity_by_ref[bundle["publicationParityRef"]]
        rows.append(
            {
                "environmentRing": bundle["environmentRing"],
                "runtimePublicationBundleRef": bundle["runtimePublicationBundleId"],
                "releasePublicationParityRecordRef": parity["publicationParityRecordId"],
                "runtimePublicationState": bundle["publicationState"],
                "parityState": parity["parityState"],
                "routeExposureState": parity["routeExposureState"],
                "activeChannelFreezeRefs": parity["activeChannelFreezeRefs"],
                "recoveryDispositionRefs": parity["recoveryDispositionRefs"],
                "watchTupleHash": bundle["watchTupleHash"],
                "bundleTupleHash": bundle["bundleTupleHash"],
                "refusalReasonRefs": unique_sorted(
                    list(bundle.get("refusalReasonRefs", []))
                    + list(parity.get("refusalReasonRefs", []))
                ),
                "sourceRefs": unique_sorted(
                    list(bundle.get("source_refs", [])) + list(parity.get("source_refs", []))
                ),
            }
        )
    return rows


def build_cache_catalog(
    api_registry: dict[str, Any],
    route_bundles: list[dict[str, Any]],
    frontend_manifests: list[dict[str, Any]],
) -> dict[str, Any]:
    route_bundle_by_ref = {row["routeFamilyRef"]: row for row in route_bundles}
    manifest_by_id = {
        row["frontendContractManifestId"]: row for row in frontend_manifests
    }
    rows: list[dict[str, Any]] = []
    for base_row in sorted(api_registry["clientCachePolicies"], key=lambda row: row["clientCachePolicyId"]):
        policy_id = base_row["clientCachePolicyId"]
        profile = CACHE_POLICY_PROFILE[policy_id]
        route_refs = list(base_row["routeFamilyRefs"])
        route_ref = route_refs[0]
        route_policy = ROUTE_RECOVERY_POLICY[route_ref]
        invalidation_rule_refs = unique_sorted(
            [
                rule_ref
                for ref in route_refs
                for rule_ref in (
                    f"MIR_096_{ref.upper()}_SETTLEMENT",
                    f"MIR_096_{ref.upper()}_FREEZE",
                )
            ]
        )
        audience_surface_refs = unique_sorted(
            [
                route_bundle_by_ref[ref]["manifestAudienceSurface"]
                for ref in route_refs
            ]
        )
        manifest_labels = unique_sorted(
            [
                manifest_by_id[manifest_ref]["audienceSurfaceLabel"]
                for manifest_ref in base_row["frontendContractManifestRefs"]
            ]
        )
        rows.append(
            {
                **base_row,
                "taskId": TASK_ID,
                "audienceSurfaceRefs": audience_surface_refs,
                "audienceSurfaceLabels": manifest_labels,
                "cacheScope": profile["cacheScope"],
                "ttlSeconds": profile["ttlSeconds"],
                "refetchOnWindowFocus": profile["refetchOnWindowFocus"],
                "refetchOnReconnect": profile["refetchOnReconnect"],
                "staleWhileRevalidateMode": profile["staleWhileRevalidateMode"],
                "offlineReuseDisposition": profile["offlineReuseDisposition"],
                "sensitiveFieldHandling": profile["sensitiveFieldHandling"],
                "mutationInvalidationRuleRefs": invalidation_rule_refs,
            }
        )
        rows[-1]["staleProjectionDisposition"] = posture_for_audience(
            audience_surface_refs[0], "stale"
        )
        rows[-1]["manifestDriftDisposition"] = posture_for_audience(
            audience_surface_refs[0], "manifest"
        )
        rows[-1]["trustDriftDisposition"] = posture_for_audience(
            audience_surface_refs[0], "trust"
        )
        rows[-1]["freezeDisposition"] = posture_for_audience(
            audience_surface_refs[0], "freeze"
        )
        rows[-1]["stalenessDisclosureMode"] = profile["stalenessDisclosureMode"]
        rows[-1]["requiredReleaseRecoveryDispositionRef"] = route_policy["default"]
        rows[-1]["gapResolutionRefs"] = unique_sorted(
            [
                f"FOLLOW_ON_DEPENDENCY_CONTENT_{audience_surface_refs[0].upper()}_V1",
            ]
            + (
                [f"GAP_ROUTE_CACHE_OR_CHANNEL_BINDING_{route_ref.upper()}_LIVE_CHANNEL_ABSENT"]
                if route_ref in ALLOWED_LIVE_ABSENCE_ROUTE_REFS
                else []
            )
        )

    return {
        "task_id": TASK_ID,
        "generated_at": GENERATED_AT,
        "source_precedence": SOURCE_PRECEDENCE,
        "summary": {
            "client_cache_policy_count": len(rows),
            "route_family_coverage_count": len(
                unique_sorted([ref for row in rows for ref in row["routeFamilyRefs"]])
            ),
            "audience_surface_count": len(
                unique_sorted([ref for row in rows for ref in row["audienceSurfaceRefs"]])
            ),
            "offline_reuse_disposition_count": len(
                unique_sorted([row["offlineReuseDisposition"] for row in rows])
            ),
        },
        "follow_on_dependencies": FOLLOW_ON_DEPENDENCIES,
        "gap_resolutions": GAP_RESOLUTIONS,
        "clientCachePolicies": rows,
    }


def build_live_channel_catalog(
    api_registry: dict[str, Any],
    route_bundles: list[dict[str, Any]],
) -> dict[str, Any]:
    route_bundle_by_ref = {row["routeFamilyRef"]: row for row in route_bundles}
    rows: list[dict[str, Any]] = []
    for base_row in sorted(
        api_registry["liveUpdateChannelContracts"],
        key=lambda row: row["liveUpdateChannelContractId"],
    ):
        channel_id = base_row["liveUpdateChannelContractId"]
        profile = LIVE_CHANNEL_PROFILE[channel_id]
        route_ref = base_row["routeFamilyRef"]
        route_policy = ROUTE_RECOVERY_POLICY[route_ref]
        audience_surface = route_bundle_by_ref[route_ref]["manifestAudienceSurface"]
        rows.append(
            {
                **base_row,
                "taskId": TASK_ID,
                "messageSchemaRef": f"schema://{route_ref}/live-update-delta",
                "reconnectPolicyRef": profile["reconnectPolicyRef"],
                "reconnectInitialDelayMs": profile["reconnectInitialDelayMs"],
                "reconnectMaxDelayMs": profile["reconnectMaxDelayMs"],
                "reconnectWindowSeconds": profile["reconnectWindowSeconds"],
                "maxReplayGapEvents": profile["maxReplayGapEvents"],
                "stalenessDisclosureMode": profile["stalenessDisclosureMode"],
                "downgradeDisposition": profile["downgradeDisposition"],
                "replayGapDisposition": profile["replayGapDisposition"],
                "offlineReconnectDisposition": profile["offlineReconnectDisposition"],
                "requiredProjectionReadinessRefs": [
                    ref
                    for ref in base_row["requiredRuntimeReadinessRefs"]
                    if ref.startswith("WRCCR_058_")
                    or ref.startswith("ASPR_")
                    or ref.startswith("ASRB_")
                ],
                "requiredAssuranceSliceTrustRefs": unique_sorted(
                    ["ASSURANCE_BROWSER_RUNTIME_TUPLE_V1"]
                    + (
                        ["ASSURANCE_SUPPORT_REPLAY_SLICE_V1"]
                        if route_ref.startswith("rf_support")
                        else ["ASSURANCE_OPERATIONS_DIAGNOSTIC_SLICE_V1"]
                        if route_ref.startswith("rf_operations")
                        else ["ASSURANCE_GOVERNANCE_REVIEW_SLICE_V1"]
                        if route_ref.startswith("rf_governance")
                        else []
                    )
                ),
                "requiredReleaseRecoveryDispositionRef": route_policy["default"],
                "requiredRouteFreezeDispositionRefs": [
                    route_policy["blocked"],
                    route_policy["read_only"],
                ],
                "gapResolutionRefs": unique_sorted(
                    [
                        profile["reconnectPolicyRef"],
                        f"FOLLOW_ON_DEPENDENCY_CONTENT_{audience_surface.upper()}_V1",
                    ]
                ),
            }
        )
    return {
        "task_id": TASK_ID,
        "generated_at": GENERATED_AT,
        "source_precedence": SOURCE_PRECEDENCE,
        "summary": {
            "live_update_channel_contract_count": len(rows),
            "route_family_coverage_count": len(unique_sorted([row["routeFamilyRef"] for row in rows])),
            "transport_count": len(unique_sorted([row["transport"] for row in rows])),
            "reconnect_policy_count": len(unique_sorted([row["reconnectPolicyRef"] for row in rows])),
        },
        "follow_on_dependencies": FOLLOW_ON_DEPENDENCIES,
        "gap_resolutions": GAP_RESOLUTIONS,
        "liveUpdateChannelContracts": rows,
    }


def derive_publication_drift_posture(
    audience_surface: str, ring: dict[str, Any], baseline: str
) -> str:
    if ring["runtimePublicationState"] == "withdrawn" or ring["parityState"] == "withdrawn":
        return "blocked"
    if ring["runtimePublicationState"] == "conflict" or ring["parityState"] == "conflict":
        return "blocked"
    if ring["runtimePublicationState"] == "stale" or ring["parityState"] == "stale":
        return posture_for_audience(audience_surface, "manifest")
    return baseline


def derive_freeze_posture(audience_surface: str, ring: dict[str, Any], baseline: str) -> str:
    if ring["routeExposureState"] == "withdrawn":
        return "blocked"
    if ring["routeExposureState"] == "frozen":
        return posture_for_audience(audience_surface, "freeze")
    return baseline


def build_browser_recovery_matrix(
    route_bundles: list[dict[str, Any]],
    publication_rings: list[dict[str, Any]],
    cache_catalog: dict[str, Any],
    live_catalog: dict[str, Any],
) -> list[dict[str, Any]]:
    cache_by_ref = {
        row["clientCachePolicyId"]: row for row in cache_catalog["clientCachePolicies"]
    }
    live_by_ref = {
        row["liveUpdateChannelContractId"]: row
        for row in live_catalog["liveUpdateChannelContracts"]
    }
    rows: list[dict[str, Any]] = []
    for ring in publication_rings:
        for route_bundle in sorted(route_bundles, key=lambda row: row["routeFamilyRef"]):
            route_ref = route_bundle["routeFamilyRef"]
            audience_surface = route_bundle["manifestAudienceSurface"]
            baseline = route_bundle["browserPostureState"]
            recovery_policy = ROUTE_RECOVERY_POLICY[route_ref]
            cache_policy_ref, secondary_cache_policy_refs = resolve_primary_cache_policy(route_bundle)
            live_channel_ref = route_bundle["liveUpdateChannelContractRef"]
            cache_policy = cache_by_ref[cache_policy_ref]
            live_channel = live_by_ref.get(live_channel_ref) if live_channel_ref else None
            gap_refs = []
            if route_ref in ALLOWED_LIVE_ABSENCE_ROUTE_REFS:
                gap_refs.append(
                    f"GAP_ROUTE_CACHE_OR_CHANNEL_BINDING_{route_ref.upper()}_LIVE_CHANNEL_ABSENT"
                )
            gap_refs.extend(cache_policy["gapResolutionRefs"])
            if live_channel:
                gap_refs.extend(live_channel["gapResolutionRefs"])
            row = {
                "browserRecoveryPostureId": f"BRP_096_{ring['environmentRing'].replace('-', '_').upper()}_{route_ref.upper()}_V1",
                "environmentRing": ring["environmentRing"],
                "routeFamilyRef": route_ref,
                "routeFamilyLabel": route_bundle["routeFamilyLabel"],
                "audienceSurfaceRef": audience_surface,
                "gatewaySurfaceRef": route_bundle["primaryGatewaySurfaceRef"],
                "runtimePublicationBundleRef": ring["runtimePublicationBundleRef"],
                "releasePublicationParityRecordRef": ring["releasePublicationParityRecordRef"],
                "cachePolicyRef": cache_policy_ref,
                "secondaryCachePolicyRefs": secondary_cache_policy_refs,
                "liveUpdateChannelContractRef": live_channel_ref,
                "baselineBrowserPosture": baseline,
                "transientDisconnectPosture": posture_for_audience(audience_surface, "transient"),
                "replayGapPosture": posture_for_audience(audience_surface, "replay_gap"),
                "staleProjectionPosture": posture_for_audience(audience_surface, "stale"),
                "publicationDriftPosture": derive_publication_drift_posture(
                    audience_surface, ring, baseline
                ),
                "releaseOrChannelFreezePosture": derive_freeze_posture(
                    audience_surface, ring, baseline
                ),
                "assuranceTrustDriftPosture": posture_for_audience(audience_surface, "trust"),
                "manifestDriftPosture": posture_for_audience(audience_surface, "manifest"),
                "offlineReusePosture": posture_for_audience(audience_surface, "offline"),
                "runtimePublicationState": ring["runtimePublicationState"],
                "parityState": ring["parityState"],
                "routeExposureState": ring["routeExposureState"],
                "staleDisclosureMode": recovery_policy["disclosure"],
                "defaultRecoveryDispositionRef": recovery_policy["default"],
                "readOnlyRecoveryDispositionRef": recovery_policy["read_only"],
                "recoveryOnlyRecoveryDispositionRef": recovery_policy["recovery_only"],
                "blockedRecoveryDispositionRef": recovery_policy["blocked"],
                "offlineReuseDisposition": cache_policy["offlineReuseDisposition"],
                "reconnectPolicyRef": live_channel["reconnectPolicyRef"] if live_channel else "not_applicable",
                "gapResolutionRefs": unique_sorted(gap_refs),
                "source_refs": unique_sorted(
                    list(route_bundle.get("source_refs", []))
                    + list(cache_policy.get("source_refs", []))
                    + (list(live_channel.get("source_refs", [])) if live_channel else [])
                    + ring["sourceRefs"]
                ),
            }
            rows.append(row)
    return rows


def write_browser_governor_catalog(
    publication_rings: list[dict[str, Any]],
    cache_catalog: dict[str, Any],
    live_catalog: dict[str, Any],
    matrix_rows: list[dict[str, Any]],
) -> None:
    payload = {
        "taskId": TASK_ID,
        "generatedAt": GENERATED_AT,
        "visualMode": VISUAL_MODE,
        "summary": {
            "publicationRingCount": len(publication_rings),
            "clientCachePolicyCount": len(cache_catalog["clientCachePolicies"]),
            "liveUpdateChannelContractCount": len(live_catalog["liveUpdateChannelContracts"]),
            "browserRecoveryPostureRowCount": len(matrix_rows),
        },
        "sourcePrecedence": SOURCE_PRECEDENCE,
        "followOnDependencies": FOLLOW_ON_DEPENDENCIES,
        "gapResolutions": GAP_RESOLUTIONS,
        "publicationRings": publication_rings,
        "clientCachePolicies": cache_catalog["clientCachePolicies"],
        "liveUpdateChannelContracts": live_catalog["liveUpdateChannelContracts"],
        "browserRecoveryPostureRows": matrix_rows,
    }
    source = dedent(
        f"""
        export const browserRuntimeGovernorCatalog = {json.dumps(payload, indent=2)} as const;

        export type BrowserRuntimeGovernorCatalog = typeof browserRuntimeGovernorCatalog;
        export type BrowserRuntimeGovernorPublicationRing =
          BrowserRuntimeGovernorCatalog["publicationRings"][number];
        export type BrowserRuntimeGovernorCachePolicy =
          BrowserRuntimeGovernorCatalog["clientCachePolicies"][number];
        export type BrowserRuntimeGovernorLiveChannelContract =
          BrowserRuntimeGovernorCatalog["liveUpdateChannelContracts"][number];
        export type BrowserRecoveryPostureMatrixRow =
          BrowserRuntimeGovernorCatalog["browserRecoveryPostureRows"][number];
        """
    )
    write_text(BROWSER_GOVERNOR_CATALOG_TS_PATH, source)


def build_cache_schema() -> dict[str, Any]:
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "title": "ClientCachePolicy",
        "description": "Authoritative browser runtime client-cache policy row enriched by par_096.",
        "type": "object",
        "required": [
            "clientCachePolicyId",
            "routeFamilyRefs",
            "audienceSurfaceRefs",
            "cacheScope",
            "ttlSeconds",
            "refetchOnWindowFocus",
            "refetchOnReconnect",
            "staleWhileRevalidateMode",
            "offlineReuseDisposition",
            "sensitiveFieldHandling",
            "staleProjectionDisposition",
            "manifestDriftDisposition",
            "trustDriftDisposition",
            "freezeDisposition",
            "stalenessDisclosureMode",
            "requiredReleaseRecoveryDispositionRef",
            "mutationInvalidationRuleRefs",
            "contractDigestRef",
            "registryDigestRef",
            "validationState",
            "source_refs",
        ],
        "properties": {
            "clientCachePolicyId": {"type": "string"},
            "routeFamilyRefs": {"type": "array", "items": {"type": "string"}, "minItems": 1},
            "audienceSurfaceRefs": {"type": "array", "items": {"type": "string"}, "minItems": 1},
            "cacheScope": {
                "type": "string",
                "enum": ["shell", "route_family", "entity", "query_result"],
            },
            "ttlSeconds": {"type": "integer", "minimum": 0},
            "refetchOnWindowFocus": {"type": "boolean"},
            "refetchOnReconnect": {"type": "boolean"},
            "staleWhileRevalidateMode": {"type": "string"},
            "offlineReuseDisposition": {"type": "string"},
            "sensitiveFieldHandling": {"type": "string"},
            "mutationInvalidationRuleRefs": {
                "type": "array",
                "items": {"type": "string"},
                "minItems": 1,
            },
            "staleProjectionDisposition": {"type": "string"},
            "manifestDriftDisposition": {"type": "string"},
            "trustDriftDisposition": {"type": "string"},
            "freezeDisposition": {"type": "string"},
            "stalenessDisclosureMode": {"type": "string"},
            "requiredReleaseRecoveryDispositionRef": {"type": "string"},
            "gapResolutionRefs": {"type": "array", "items": {"type": "string"}},
            "contractDigestRef": {"type": "string"},
            "registryDigestRef": {"type": "string"},
            "validationState": {
                "type": "string",
                "enum": ["valid", "warning", "exception", "blocked"],
            },
            "source_refs": {"type": "array", "items": {"type": "string"}, "minItems": 1},
        },
    }


def build_live_channel_schema() -> dict[str, Any]:
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "title": "LiveUpdateChannelContract",
        "description": "Authoritative browser runtime live-update channel contract row enriched by par_096.",
        "type": "object",
        "required": [
            "liveUpdateChannelContractId",
            "routeFamilyRef",
            "channelCode",
            "transport",
            "messageSchemaRef",
            "reconnectPolicyRef",
            "reconnectInitialDelayMs",
            "reconnectMaxDelayMs",
            "reconnectWindowSeconds",
            "maxReplayGapEvents",
            "stalenessDisclosureMode",
            "downgradeDisposition",
            "replayGapDisposition",
            "offlineReconnectDisposition",
            "requiredProjectionReadinessRefs",
            "requiredAssuranceSliceTrustRefs",
            "requiredReleaseRecoveryDispositionRef",
            "requiredRouteFreezeDispositionRefs",
            "requiredTrustBoundaryRefs",
            "requiredRuntimeReadinessRefs",
            "contractDigestRef",
            "registryDigestRef",
            "validationState",
            "source_refs",
        ],
        "properties": {
            "liveUpdateChannelContractId": {"type": "string"},
            "routeFamilyRef": {"type": "string"},
            "channelCode": {"type": "string"},
            "transport": {"type": "string", "enum": ["sse", "websocket"]},
            "messageSchemaRef": {"type": "string"},
            "reconnectPolicyRef": {"type": "string"},
            "reconnectInitialDelayMs": {"type": "integer", "minimum": 0},
            "reconnectMaxDelayMs": {"type": "integer", "minimum": 0},
            "reconnectWindowSeconds": {"type": "integer", "minimum": 0},
            "maxReplayGapEvents": {"type": "integer", "minimum": 0},
            "stalenessDisclosureMode": {"type": "string"},
            "downgradeDisposition": {"type": "string"},
            "replayGapDisposition": {"type": "string"},
            "offlineReconnectDisposition": {"type": "string"},
            "requiredProjectionReadinessRefs": {
                "type": "array",
                "items": {"type": "string"},
                "minItems": 1,
            },
            "requiredAssuranceSliceTrustRefs": {
                "type": "array",
                "items": {"type": "string"},
                "minItems": 1,
            },
            "requiredReleaseRecoveryDispositionRef": {"type": "string"},
            "requiredRouteFreezeDispositionRefs": {
                "type": "array",
                "items": {"type": "string"},
                "minItems": 1,
            },
            "requiredTrustBoundaryRefs": {
                "type": "array",
                "items": {"type": "string"},
                "minItems": 1,
            },
            "requiredRuntimeReadinessRefs": {
                "type": "array",
                "items": {"type": "string"},
                "minItems": 1,
            },
            "contractDigestRef": {"type": "string"},
            "registryDigestRef": {"type": "string"},
            "validationState": {
                "type": "string",
                "enum": ["valid", "warning", "exception", "blocked"],
            },
            "gapResolutionRefs": {"type": "array", "items": {"type": "string"}},
            "source_refs": {"type": "array", "items": {"type": "string"}, "minItems": 1},
        },
    }


def build_browser_recovery_schema() -> dict[str, Any]:
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "title": "BrowserRecoveryPosture",
        "description": "Authoritative route-family and ring scoped browser recovery posture row published by par_096.",
        "type": "object",
        "required": [
            "browserRecoveryPostureId",
            "environmentRing",
            "routeFamilyRef",
            "audienceSurfaceRef",
            "gatewaySurfaceRef",
            "runtimePublicationBundleRef",
            "releasePublicationParityRecordRef",
            "cachePolicyRef",
            "baselineBrowserPosture",
            "transientDisconnectPosture",
            "replayGapPosture",
            "staleProjectionPosture",
            "publicationDriftPosture",
            "releaseOrChannelFreezePosture",
            "assuranceTrustDriftPosture",
            "manifestDriftPosture",
            "offlineReusePosture",
            "staleDisclosureMode",
            "defaultRecoveryDispositionRef",
            "readOnlyRecoveryDispositionRef",
            "recoveryOnlyRecoveryDispositionRef",
            "blockedRecoveryDispositionRef",
            "source_refs",
        ],
        "properties": {
            "browserRecoveryPostureId": {"type": "string"},
            "environmentRing": {"type": "string"},
            "routeFamilyRef": {"type": "string"},
            "audienceSurfaceRef": {"type": "string"},
            "gatewaySurfaceRef": {"type": "string"},
            "runtimePublicationBundleRef": {"type": "string"},
            "releasePublicationParityRecordRef": {"type": "string"},
            "cachePolicyRef": {"type": "string"},
            "secondaryCachePolicyRefs": {"type": "array", "items": {"type": "string"}},
            "liveUpdateChannelContractRef": {"type": ["string", "null"]},
            "baselineBrowserPosture": {"type": "string"},
            "transientDisconnectPosture": {"type": "string"},
            "replayGapPosture": {"type": "string"},
            "staleProjectionPosture": {"type": "string"},
            "publicationDriftPosture": {"type": "string"},
            "releaseOrChannelFreezePosture": {"type": "string"},
            "assuranceTrustDriftPosture": {"type": "string"},
            "manifestDriftPosture": {"type": "string"},
            "offlineReusePosture": {"type": "string"},
            "staleDisclosureMode": {"type": "string"},
            "defaultRecoveryDispositionRef": {"type": "string"},
            "readOnlyRecoveryDispositionRef": {"type": "string"},
            "recoveryOnlyRecoveryDispositionRef": {"type": "string"},
            "blockedRecoveryDispositionRef": {"type": "string"},
            "gapResolutionRefs": {"type": "array", "items": {"type": "string"}},
            "source_refs": {"type": "array", "items": {"type": "string"}, "minItems": 1},
        },
    }


def build_design_doc(
    cache_catalog: dict[str, Any], live_catalog: dict[str, Any], matrix_rows: list[dict[str, Any]]
) -> str:
    patient_rows = [
        row
        for row in matrix_rows
        if row["audienceSurfaceRef"].startswith("audsurf_patient")
    ]
    workspace_rows = [
        row
        for row in matrix_rows
        if row["audienceSurfaceRef"] in {"audsurf_clinical_workspace", "audsurf_hub_desk", "audsurf_pharmacy_console"}
    ]
    return dedent(
        f"""
        # par_096 Client Cache And Live Update Design

        `par_096` publishes the authoritative browser runtime tuple for cache semantics, live-update channels, freshness disclosure, and safe downgrade posture. The catalog is derived from the validated route inventory in `par_065` plus the ring publication truth from `par_094`.

        ## Summary

        - Client cache policies: {cache_catalog["summary"]["client_cache_policy_count"]}
        - Live-update channel contracts: {live_catalog["summary"]["live_update_channel_contract_count"]}
        - Browser recovery posture rows: {len(matrix_rows)}
        - Audience surfaces covered: {cache_catalog["summary"]["audience_surface_count"]}
        - Allowed live-channel absences remain bounded to the four route families already declared in `par_065`

        ## Runtime Law

        - Every route family resolves one primary `ClientCachePolicy` for the browser runtime decision.
        - Live channel reconnect never implies fresh truth. Projection freshness, parity, freeze, and trust still gate the effective posture.
        - Patient continuity preserves summaries or anchors but suppresses writable CTAs when freshness or tuple truth drifts.
        - Workspace, hub, pharmacy, support, operations, and governance surfaces each degrade through one published posture lane instead of generic banners or framework defaults.

        ## Audience Coverage

        - Patient-facing rows: {len(patient_rows)}
        - Workspace and servicing rows: {len(workspace_rows)}
        - Operations and governance rows: {len(matrix_rows) - len(patient_rows) - len(workspace_rows)}

        ## Published Artifacts

        - `data/analysis/client_cache_policy_catalog.json`
        - `data/analysis/live_update_channel_contract_catalog.json`
        - `data/analysis/browser_recovery_posture_matrix.csv`
        - `packages/release-controls/src/browser-runtime-governor.catalog.ts`
        - `docs/architecture/96_cache_channel_contract_studio.html`

        ## Follow-on Dependencies

        {chr(10).join(f"- `{row['dependencyId']}`: {row['boundedSeam']}" for row in FOLLOW_ON_DEPENDENCIES)}
        """
    )


def build_recovery_doc(matrix_rows: list[dict[str, Any]]) -> str:
    disclosure_modes = unique_sorted([row["staleDisclosureMode"] for row in matrix_rows])
    blocked_rows = [row for row in matrix_rows if row["blockedRecoveryDispositionRef"]]
    return dedent(
        f"""
        # par_096 Recovery Posture And Staleness Disclosure

        The browser runtime now treats stale, frozen, blocked, replay-gap, and manifest-drift posture as first-class runtime truth. Reconnect only restores transport. It does not restore writable or reassuring truth on its own.

        ## Disclosure Modes

        {chr(10).join(f"- `{mode}`" for mode in disclosure_modes)}

        ## Downgrade Rules

        - `transientDisconnectPosture` preserves anchor continuity only where the audience profile explicitly allows it.
        - `replayGapPosture` forces recovery-only or blocked behavior and suspends stale optimistic interaction.
        - `publicationDriftPosture` follows the published runtime bundle and parity tuple rather than route-local opinion.
        - `manifestDriftPosture` and `assuranceTrustDriftPosture` fail closed to the safest audience-appropriate state.
        - `offlineReusePosture` preserves context only through the published offline reuse disposition of the selected cache policy.

        ## Boundaries

        - Patient routes default to summary-preserving or recovery-only posture.
        - Workspace and servicing routes preserve selected anchor and explanation while freezing writes.
        - Operations routes preserve diagnostic summaries but do not imply live control authority.
        - Governance routes fail closed to explicit review posture on trust or manifest ambiguity.

        ## Matrix Integrity

        - Total recovery posture rows: {len(matrix_rows)}
        - Rows with explicit blocked disposition: {len(blocked_rows)}
        """
    )


def build_matrix_doc(matrix_rows: list[dict[str, Any]]) -> str:
    rows_by_ring: dict[str, list[dict[str, Any]]] = {}
    for row in matrix_rows:
        rows_by_ring.setdefault(row["environmentRing"], []).append(row)
    sections = []
    for ring, ring_rows in rows_by_ring.items():
        posture_counts: dict[str, int] = {}
        for row in ring_rows:
            posture_counts[row["baselineBrowserPosture"]] = posture_counts.get(
                row["baselineBrowserPosture"], 0
            ) + 1
        sections.append(
            f"### {ring}\n\n"
            + "\n".join(
                f"- `{posture}` baseline rows: {count}" for posture, count in sorted(posture_counts.items())
            )
        )
    return dedent(
        f"""
        # par_096 Browser Freshness And Recovery Matrix

        The recovery matrix is published as one row per environment ring and route family. Each row joins:

        - the route-family browser posture floor from `par_065`
        - the publication/parity tuple from `par_094`
        - one primary cache policy
        - one live-update channel contract when present
        - one audience-safe disclosure and downgrade posture

        ## Matrix Row Count

        - Environment rings: {len(rows_by_ring)}
        - Route families: {len(matrix_rows) // max(len(rows_by_ring), 1)}
        - Total rows: {len(matrix_rows)}

        {"\n\n".join(sections)}
        """
    )


def build_studio_html() -> str:
    template = """
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>par_096 Cache Channel Contract Studio</title>
    <style>
      :root {
        color-scheme: light;
        --ink: #12202f;
        --muted: #5e6d7b;
        --line: #cad5df;
        --panel: #f6f8fb;
        --panel-strong: #edf3f8;
        --accent: #0b6a86;
        --ok: #0a6f45;
        --warn: #9b5b00;
        --danger: #8f2d2d;
        --blocked: #5c1f1f;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "IBM Plex Sans", "Avenir Next", "Segoe UI", sans-serif;
        color: var(--ink);
        background:
          radial-gradient(circle at top left, rgba(11, 106, 134, 0.08), transparent 32rem),
          linear-gradient(180deg, #fdfefe, #eef4f8 48%, #edf2f6 100%);
      }
      body[data-reduced-motion="true"] * {
        animation: none !important;
        transition: none !important;
        scroll-behavior: auto !important;
      }
      header {
        padding: 2rem 2rem 1rem;
        border-bottom: 1px solid rgba(18, 32, 47, 0.08);
        background: rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(12px);
        position: sticky;
        top: 0;
        z-index: 3;
      }
      .eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.75rem;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        color: var(--accent);
      }
      h1 {
        margin: 0.5rem 0 0.4rem;
        font-size: clamp(2rem, 3vw, 3rem);
        line-height: 1.05;
      }
      .lede {
        max-width: 72rem;
        color: var(--muted);
        font-size: 1rem;
      }
      nav {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
        gap: 0.8rem;
        padding: 1rem 2rem 1.5rem;
      }
      label {
        display: grid;
        gap: 0.35rem;
        font-size: 0.8rem;
        color: var(--muted);
      }
      select {
        appearance: none;
        border: 1px solid var(--line);
        border-radius: 0.9rem;
        background: #fff;
        padding: 0.8rem 0.9rem;
        font: inherit;
        color: var(--ink);
      }
      main {
        display: grid;
        grid-template-columns: minmax(0, 1.4fr) minmax(18rem, 0.9fr);
        gap: 1rem;
        padding: 0 2rem 2rem;
      }
      .panel {
        border: 1px solid rgba(18, 32, 47, 0.08);
        border-radius: 1.25rem;
        background: rgba(255, 255, 255, 0.9);
        box-shadow: 0 18px 48px rgba(18, 32, 47, 0.08);
      }
      .summary-strip {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr));
        gap: 0.8rem;
        padding: 1rem;
      }
      .summary-card {
        padding: 0.9rem 1rem;
        background: var(--panel);
        border-radius: 1rem;
      }
      .summary-card strong {
        display: block;
        font-size: 1.3rem;
      }
      .table-shell {
        padding: 0 1rem 1rem;
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th {
        text-align: left;
        font-size: 0.78rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--muted);
        padding: 0.8rem 0.7rem;
        border-bottom: 1px solid var(--line);
      }
      td {
        padding: 0.2rem 0.7rem;
        border-bottom: 1px solid rgba(202, 213, 223, 0.65);
        vertical-align: top;
      }
      tr[data-selected="true"] td {
        background: rgba(11, 106, 134, 0.08);
      }
      .matrix-button {
        width: 100%;
        border: 0;
        background: transparent;
        padding: 0.8rem 0;
        text-align: left;
        font: inherit;
        color: inherit;
        cursor: pointer;
      }
      .matrix-button:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: 3px;
        border-radius: 0.75rem;
      }
      .row-title {
        font-weight: 700;
      }
      .row-meta {
        color: var(--muted);
        font-size: 0.85rem;
      }
      .chip {
        display: inline-flex;
        align-items: center;
        padding: 0.25rem 0.65rem;
        border-radius: 999px;
        font-size: 0.76rem;
        font-weight: 700;
      }
      .chip-live { background: rgba(10, 111, 69, 0.12); color: var(--ok); }
      .chip-read_only { background: rgba(11, 106, 134, 0.12); color: var(--accent); }
      .chip-recovery_only { background: rgba(155, 91, 0, 0.14); color: var(--warn); }
      .chip-blocked { background: rgba(143, 45, 45, 0.14); color: var(--danger); }
      .chip-published { background: rgba(10, 111, 69, 0.12); color: var(--ok); }
      .chip-stale, .chip-constrained, .chip-frozen { background: rgba(155, 91, 0, 0.14); color: var(--warn); }
      .chip-conflict, .chip-withdrawn { background: rgba(143, 45, 45, 0.14); color: var(--danger); }
      aside {
        padding: 1rem;
        position: sticky;
        top: 10rem;
        align-self: start;
      }
      .inspector-block + .inspector-block {
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid rgba(202, 213, 223, 0.75);
      }
      .inspector-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
        gap: 0.7rem;
      }
      .inspector-card {
        background: var(--panel);
        border-radius: 0.95rem;
        padding: 0.8rem;
      }
      .stack {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
      }
      .empty {
        padding: 2rem 1rem;
        color: var(--muted);
        text-align: center;
      }
      @media (max-width: 980px) {
        main {
          grid-template-columns: 1fr;
        }
        aside {
          position: static;
        }
      }
    </style>
  </head>
  <body data-task-id="__TASK_ID__">
    <header>
      <div class="eyebrow">Signal Atlas Live / par_096</div>
      <h1>Cache Channel Contract Studio</h1>
      <p class="lede">
        One published browser runtime plane for cache policy, live channel law, freshness disclosure,
        and downgrade posture. Transport health does not imply fresh or writable truth.
      </p>
    </header>
    <nav aria-label="Runtime contract filters">
      <label>
        Audience
        <select data-testid="filter-audience"></select>
      </label>
      <label>
        Environment ring
        <select data-testid="filter-environment"></select>
      </label>
      <label>
        Baseline posture
        <select data-testid="filter-posture"></select>
      </label>
      <label>
        Live channel
        <select data-testid="filter-live"></select>
      </label>
    </nav>
    <main>
      <section class="panel" aria-labelledby="matrix-heading">
        <div class="summary-strip" data-testid="summary-strip"></div>
        <div class="table-shell">
          <h2 id="matrix-heading">Route To Cache / Channel / Recovery Matrix</h2>
          <table data-testid="matrix-table">
            <thead>
              <tr>
                <th>Route</th>
                <th>Posture</th>
                <th>Ring</th>
                <th>Cache</th>
                <th>Live</th>
              </tr>
            </thead>
            <tbody data-testid="matrix-body"></tbody>
          </table>
        </div>
      </section>
      <aside class="panel" data-testid="inspector">
        <div class="inspector-block">
          <h2>Inspector</h2>
          <p class="row-meta" data-testid="inspector-subtitle">Select a route/ring row.</p>
        </div>
        <div class="inspector-block" data-testid="inspector-body"></div>
      </aside>
    </main>
    <script type="module">
      const paths = {
        cache: "__CACHE_PATH__",
        live: "__LIVE_PATH__",
        matrix: "__MATRIX_PATH__",
        registry: "__REGISTRY_PATH__",
        bundles: "__BUNDLES_PATH__",
        parity: "__PARITY_PATH__",
      };

      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
      document.body.dataset.reducedMotion = reducedMotion.matches ? "true" : "false";
      reducedMotion.addEventListener("change", (event) => {
        document.body.dataset.reducedMotion = event.matches ? "true" : "false";
      });

      function parseCsv(text) {
        const rows = [];
        let row = [];
        let cell = "";
        let inQuotes = false;
        for (let index = 0; index < text.length; index += 1) {
          const char = text[index];
          const next = text[index + 1];
          if (char === '"' && inQuotes && next === '"') {
            cell += '"';
            index += 1;
            continue;
          }
          if (char === '"') {
            inQuotes = !inQuotes;
            continue;
          }
          if (char === "," && !inQuotes) {
            row.push(cell);
            cell = "";
            continue;
          }
          if ((char === "\\n" || char === "\\r") && !inQuotes) {
            if (char === "\\r" && next === "\\n") {
              index += 1;
            }
            row.push(cell);
            if (row.some((value) => value.length > 0)) {
              rows.push(row);
            }
            row = [];
            cell = "";
            continue;
          }
          cell += char;
        }
        if (cell.length || row.length) {
          row.push(cell);
          rows.push(row);
        }
        const [headers, ...body] = rows;
        return body.map((values) =>
          Object.fromEntries(headers.map((header, idx) => [header, values[idx] ?? ""])),
        );
      }

      function csvList(value) {
        if (!value) return [];
        return value.split("|").filter(Boolean);
      }

      function chipClass(value) {
        return `chip chip-${value}`;
      }

      function optionMarkup(value, label) {
        return `<option value="${value}">${label}</option>`;
      }

      async function loadData() {
        const [cache, live, matrixText, registry, bundles, parity] = await Promise.all([
          fetch(paths.cache).then((response) => response.json()),
          fetch(paths.live).then((response) => response.json()),
          fetch(paths.matrix).then((response) => response.text()),
          fetch(paths.registry).then((response) => response.json()),
          fetch(paths.bundles).then((response) => response.json()),
          fetch(paths.parity).then((response) => response.json()),
        ]);
        const matrix = parseCsv(matrixText).map((row) => ({
          ...row,
          secondaryCachePolicyRefs: csvList(row.secondaryCachePolicyRefs),
          gapResolutionRefs: csvList(row.gapResolutionRefs),
          source_refs: csvList(row.source_refs),
        }));
        return { cache, live, matrix, registry, bundles, parity };
      }

      const state = {
        filters: {
          audience: "all",
          environment: "all",
          posture: "all",
          live: "all",
        },
        selectedId: null,
      };

      function filteredRows(matrix) {
        return matrix.filter((row) => {
          return (
            (state.filters.audience === "all" || row.audienceSurfaceRef === state.filters.audience) &&
            (state.filters.environment === "all" || row.environmentRing === state.filters.environment) &&
            (state.filters.posture === "all" || row.baselineBrowserPosture === state.filters.posture) &&
            (state.filters.live === "all" ||
              (state.filters.live === "live" && row.liveUpdateChannelContractRef) ||
              (state.filters.live === "no_live" && !row.liveUpdateChannelContractRef))
          );
        });
      }

      function renderSummary(data, rows) {
        const summary = [
          ["Rows", String(rows.length)],
          ["Cache policies", String(data.cache.summary.client_cache_policy_count)],
          ["Live channels", String(data.live.summary.live_update_channel_contract_count)],
          ["Rings", String(data.bundles.summary.runtime_publication_bundle_count)],
        ];
        document.querySelector("[data-testid='summary-strip']").innerHTML = summary
          .map(
            ([label, value]) =>
              `<article class="summary-card"><span class="row-meta">${label}</span><strong>${value}</strong></article>`,
          )
          .join("");
      }

      function renderFilters(data) {
        const audiences = Array.from(new Set(data.matrix.map((row) => row.audienceSurfaceRef))).sort();
        const environments = Array.from(new Set(data.matrix.map((row) => row.environmentRing))).sort();
        const postures = Array.from(new Set(data.matrix.map((row) => row.baselineBrowserPosture))).sort();
        document.querySelector("[data-testid='filter-audience']").innerHTML =
          optionMarkup("all", "All audiences") +
          audiences.map((value) => optionMarkup(value, value)).join("");
        document.querySelector("[data-testid='filter-environment']").innerHTML =
          optionMarkup("all", "All rings") +
          environments.map((value) => optionMarkup(value, value)).join("");
        document.querySelector("[data-testid='filter-posture']").innerHTML =
          optionMarkup("all", "All postures") +
          postures.map((value) => optionMarkup(value, value)).join("");
        document.querySelector("[data-testid='filter-live']").innerHTML =
          optionMarkup("all", "Any live posture") +
          optionMarkup("live", "Has live channel") +
          optionMarkup("no_live", "No live channel");
      }

      function resolveSelection(rows) {
        if (!rows.length) {
          state.selectedId = null;
          return null;
        }
        if (!state.selectedId || !rows.some((row) => row.browserRecoveryPostureId === state.selectedId)) {
          state.selectedId = rows[0].browserRecoveryPostureId;
        }
        return rows.find((row) => row.browserRecoveryPostureId === state.selectedId) ?? rows[0];
      }

      function renderTable(data, rows) {
        const tbody = document.querySelector("[data-testid='matrix-body']");
        if (!rows.length) {
          tbody.innerHTML = `<tr><td colspan="5"><div class="empty">No rows match the current filters.</div></td></tr>`;
          return;
        }
        const selectedId = state.selectedId;
        tbody.innerHTML = rows
          .map((row) => {
            const selected = row.browserRecoveryPostureId === selectedId;
            return `
              <tr data-testid="matrix-record-${row.browserRecoveryPostureId}" data-selected="${selected}">
                <td>
                  <button
                    class="matrix-button"
                    data-testid="matrix-row-${row.browserRecoveryPostureId}"
                    data-row-id="${row.browserRecoveryPostureId}"
                  >
                    <div class="row-title">${row.routeFamilyLabel}</div>
                    <div class="row-meta">${row.routeFamilyRef}</div>
                  </button>
                </td>
                <td><span class="${chipClass(row.baselineBrowserPosture)}">${row.baselineBrowserPosture}</span></td>
                <td>
                  <div class="row-title">${row.environmentRing}</div>
                  <div class="row-meta">${row.runtimePublicationState} / ${row.parityState}</div>
                </td>
                <td>
                  <div class="row-title">${row.cachePolicyRef}</div>
                  <div class="row-meta">${row.offlineReuseDisposition}</div>
                </td>
                <td>
                  <div class="row-title">${row.liveUpdateChannelContractRef || "none"}</div>
                  <div class="row-meta">${row.reconnectPolicyRef}</div>
                </td>
              </tr>
            `;
          })
          .join("");

        const buttons = Array.from(document.querySelectorAll(".matrix-button"));
        for (const button of buttons) {
          button.addEventListener("click", () => {
            state.selectedId = button.dataset.rowId;
            render(data);
          });
          button.addEventListener("keydown", (event) => {
            if (event.key !== "ArrowDown" && event.key !== "ArrowUp") {
              return;
            }
            event.preventDefault();
            const visibleButtons = Array.from(document.querySelectorAll(".matrix-button"));
            const index = visibleButtons.indexOf(button);
            const nextIndex =
              event.key === "ArrowDown"
                ? Math.min(index + 1, visibleButtons.length - 1)
                : Math.max(index - 1, 0);
            const nextButton = visibleButtons[nextIndex];
            if (nextButton) {
              state.selectedId = nextButton.dataset.rowId;
              render(data);
              requestAnimationFrame(() => nextButton.focus());
            }
          });
        }
      }

      function renderInspector(data, row) {
        const container = document.querySelector("[data-testid='inspector-body']");
        const subtitle = document.querySelector("[data-testid='inspector-subtitle']");
        if (!row) {
          subtitle.textContent = "No matching row.";
          container.innerHTML = `<div class="empty">Adjust filters to inspect a route/ring tuple.</div>`;
          return;
        }
        subtitle.textContent = `${row.routeFamilyRef} / ${row.environmentRing}`;
        const cacheRow = data.cache.clientCachePolicies.find(
          (candidate) => candidate.clientCachePolicyId === row.cachePolicyRef,
        );
        const liveRow = row.liveUpdateChannelContractRef
          ? data.live.liveUpdateChannelContracts.find(
              (candidate) => candidate.liveUpdateChannelContractId === row.liveUpdateChannelContractRef,
            )
          : null;
        const routeBundle = data.registry.routeFamilyBundles.find(
          (candidate) => candidate.routeFamilyRef === row.routeFamilyRef,
        );
        const ring = data.parity.releasePublicationParityRecords.find(
          (candidate) => candidate.publicationParityRecordId === row.releasePublicationParityRecordRef,
        );
        container.innerHTML = `
          <section class="inspector-block">
            <div class="stack">
              <span class="${chipClass(row.baselineBrowserPosture)}">${row.baselineBrowserPosture}</span>
              <span class="${chipClass(row.runtimePublicationState)}">${row.runtimePublicationState}</span>
              <span class="${chipClass(row.parityState)}">${row.parityState}</span>
              <span class="${chipClass(row.routeExposureState)}">${row.routeExposureState}</span>
            </div>
          </section>
          <section class="inspector-block">
            <div class="inspector-grid">
              <article class="inspector-card"><strong>Audience</strong><div class="row-meta">${row.audienceSurfaceRef}</div></article>
              <article class="inspector-card"><strong>Gateway</strong><div class="row-meta">${row.gatewaySurfaceRef}</div></article>
              <article class="inspector-card"><strong>Cache</strong><div class="row-meta">${row.cachePolicyRef}</div></article>
              <article class="inspector-card"><strong>Live</strong><div class="row-meta">${row.liveUpdateChannelContractRef || "none"}</div></article>
            </div>
          </section>
          <section class="inspector-block">
            <h3>Recovery posture</h3>
            <div class="inspector-grid">
              <article class="inspector-card"><strong>Transient</strong><div class="row-meta">${row.transientDisconnectPosture}</div></article>
              <article class="inspector-card"><strong>Replay gap</strong><div class="row-meta">${row.replayGapPosture}</div></article>
              <article class="inspector-card"><strong>Manifest drift</strong><div class="row-meta">${row.manifestDriftPosture}</div></article>
              <article class="inspector-card"><strong>Offline reuse</strong><div class="row-meta">${row.offlineReusePosture}</div></article>
            </div>
          </section>
          <section class="inspector-block">
            <h3>Published bindings</h3>
            <div class="row-meta">Route bundle: ${routeBundle?.apiContractRouteBundleId || "n/a"}</div>
            <div class="row-meta">Parity record: ${row.releasePublicationParityRecordRef}</div>
            <div class="row-meta">Active freeze refs: ${(ring?.activeChannelFreezeRefs || []).join(", ") || "none"}</div>
          </section>
          <section class="inspector-block">
            <h3>Cache policy details</h3>
            <div class="row-meta">${cacheRow?.cacheScope || "n/a"} / ttl ${cacheRow?.ttlSeconds || "n/a"}s / ${cacheRow?.offlineReuseDisposition || "n/a"}</div>
            <div class="row-meta">${(cacheRow?.mutationInvalidationRuleRefs || []).join(", ")}</div>
          </section>
          <section class="inspector-block">
            <h3>Live channel details</h3>
            <div class="row-meta">${liveRow ? `${liveRow.transport} / ${liveRow.reconnectPolicyRef}` : "No live channel bound for this route family."}</div>
            <div class="row-meta">${liveRow ? `replay gap ${liveRow.maxReplayGapEvents} events` : "Allowed fail-closed absence."}</div>
          </section>
          <section class="inspector-block">
            <h3>Gap and follow-on refs</h3>
            <div class="stack">
              ${row.gapResolutionRefs.map((value) => `<span class="chip chip-read_only">${value}</span>`).join("") || '<span class="row-meta">none</span>'}
            </div>
          </section>
        `;
      }

      function render(data) {
        const rows = filteredRows(data.matrix);
        const selectedRow = resolveSelection(rows);
        renderSummary(data, rows);
        renderTable(data, rows);
        renderInspector(data, selectedRow);
      }

      loadData().then((data) => {
        renderFilters(data);
        for (const [name, key] of [
          ["filter-audience", "audience"],
          ["filter-environment", "environment"],
          ["filter-posture", "posture"],
          ["filter-live", "live"],
        ]) {
          document.querySelector(`[data-testid="${name}"]`).addEventListener("change", (event) => {
            state.filters[key] = event.target.value;
            render(data);
          });
        }
        render(data);
      });
    </script>
  </body>
</html>
    """
    return (
        template.replace("__TASK_ID__", TASK_ID)
        .replace("__CACHE_PATH__", "/data/analysis/client_cache_policy_catalog.json")
        .replace("__LIVE_PATH__", "/data/analysis/live_update_channel_contract_catalog.json")
        .replace("__MATRIX_PATH__", "/data/analysis/browser_recovery_posture_matrix.csv")
        .replace("__REGISTRY_PATH__", "/data/analysis/api_contract_registry_manifest.json")
        .replace("__BUNDLES_PATH__", "/data/analysis/runtime_publication_bundles.json")
        .replace("__PARITY_PATH__", "/data/analysis/release_publication_parity_records.json")
    )


def build_playwright_spec() -> str:
    template = """
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "architecture", "96_cache_channel_contract_studio.html");
const CACHE_PATH = path.join(ROOT, "data", "analysis", "client_cache_policy_catalog.json");
const LIVE_PATH = path.join(ROOT, "data", "analysis", "live_update_channel_contract_catalog.json");
const MATRIX_PATH = path.join(ROOT, "data", "analysis", "browser_recovery_posture_matrix.csv");

export const cacheChannelContractStudioCoverage = [
  "filter behavior and synchronized selection",
  "keyboard navigation and focus management",
  "reduced-motion handling",
  "responsive layout at desktop and tablet widths",
  "accessibility smoke checks and landmark verification",
  "verification that live, read-only, recovery-only, and blocked states remain visually distinct",
];

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      index += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }
    if ((char === "\\n" || char === "\\r") && !inQuotes) {
      if (char === "\\r" && next === "\\n") {
        index += 1;
      }
      row.push(cell);
      if (row.some((value) => value.length > 0)) {
        rows.push(row);
      }
      row = [];
      cell = "";
      continue;
    }
    cell += char;
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  const [headers, ...body] = rows;
  return body.map((values) =>
    Object.fromEntries(headers.map((header, idx) => [header, values[idx] ?? ""])),
  );
}

async function importPlaywright() {
  try {
    return await import("playwright");
  } catch {
    throw new Error("This spec needs the `playwright` package when run with --run.");
  }
}

function serve(rootDir) {
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    let pathname = decodeURIComponent(requestUrl.pathname);
    if (pathname === "/") {
      pathname = "/docs/architecture/96_cache_channel_contract_studio.html";
    }
    const filePath = path.join(rootDir, pathname);
    if (!filePath.startsWith(rootDir)) {
      response.writeHead(403);
      response.end("forbidden");
      return;
    }
    fs.readFile(filePath, (error, buffer) => {
      if (error) {
        response.writeHead(404);
        response.end("not found");
        return;
      }
      const extension = path.extname(filePath);
      const type =
        extension === ".html"
          ? "text/html"
          : extension === ".json"
            ? "application/json"
            : extension === ".csv"
              ? "text/csv"
              : "text/plain";
      response.writeHead(200, { "Content-Type": type });
      response.end(buffer);
    });
  });
  return new Promise((resolve, reject) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Unable to bind local server."));
        return;
      }
      resolve({
        server,
        url: `http://127.0.0.1:${address.port}/docs/architecture/96_cache_channel_contract_studio.html`,
      });
    });
  });
}

export async function run() {
  assertCondition(fs.existsSync(HTML_PATH), "Cache channel contract studio HTML is missing.");
  const cacheCatalog = JSON.parse(fs.readFileSync(CACHE_PATH, "utf8"));
  const liveCatalog = JSON.parse(fs.readFileSync(LIVE_PATH, "utf8"));
  const matrixRows = parseCsv(fs.readFileSync(MATRIX_PATH, "utf8")).map((row) => ({
    ...row,
    secondaryCachePolicyRefs: row.secondaryCachePolicyRefs ? row.secondaryCachePolicyRefs.split("|").filter(Boolean) : [],
  }));

  assertCondition(cacheCatalog.summary.client_cache_policy_count === 21, "Cache policy count drifted.");
  assertCondition(
    liveCatalog.summary.live_update_channel_contract_count === 15,
    "Live channel count drifted.",
  );
  assertCondition(matrixRows.length === 95, "Browser recovery matrix row count drifted.");

  const { chromium } = await importPlaywright();
  const { server, url } = await serve(ROOT);
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1460, height: 1120 } });
    await page.goto(url, { waitUntil: "networkidle" });

    await page.locator("[data-testid='summary-strip']").waitFor();
    await page.locator("[data-testid='matrix-table']").waitFor();
    await page.locator("[data-testid='inspector']").waitFor();

    assertCondition(
      (await page.locator("[data-testid^='matrix-record-']").count()) === matrixRows.length,
      "Initial matrix row count drifted.",
    );

    await page.locator("[data-testid='filter-audience']").selectOption("audsurf_support_workspace");
    await page.locator("[data-testid='filter-environment']").selectOption("local");
    const supportRows = matrixRows.filter(
      (row) => row.audienceSurfaceRef === "audsurf_support_workspace" && row.environmentRing === "local",
    );
    assertCondition(
      (await page.locator("[data-testid^='matrix-record-']").count()) === supportRows.length,
      "Audience and environment filter drifted.",
    );

    await page.locator("[data-testid='filter-posture']").selectOption("recovery_only");
    const supportRecoveryRows = supportRows.filter((row) => row.baselineBrowserPosture === "recovery_only");
    assertCondition(
      (await page.locator("[data-testid^='matrix-record-']").count()) === supportRecoveryRows.length,
      "Posture filter drifted.",
    );

    await page.locator("[data-testid='filter-live']").selectOption("live");
    const supportRecoveryLiveRows = supportRecoveryRows.filter((row) => row.liveUpdateChannelContractRef);
    assertCondition(
      (await page.locator("[data-testid^='matrix-record-']").count()) === supportRecoveryLiveRows.length,
      "Live filter drifted.",
    );

    const selected = supportRecoveryLiveRows[0];
    await page.locator(`[data-testid='matrix-row-${selected.browserRecoveryPostureId}']`).click();
    const inspectorText = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      inspectorText.includes(selected.cachePolicyRef) &&
        inspectorText.includes(selected.routeFamilyRef) &&
        inspectorText.includes(selected.releasePublicationParityRecordRef),
      "Inspector lost synchronized route/cache/parity detail.",
    );

    const liveColor = await page
      .locator(`tr[data-testid='matrix-record-${selected.browserRecoveryPostureId}'] .chip-recovery_only`)
      .evaluate((node) => getComputedStyle(node).backgroundColor);

    await page.locator("[data-testid='filter-audience']").selectOption("audsurf_governance_admin");
    await page.locator("[data-testid='filter-environment']").selectOption("production");
    await page.locator("[data-testid='filter-posture']").selectOption("read_only");
    await page.locator("[data-testid='filter-live']").selectOption("live");
    const governanceRow = matrixRows.find(
      (row) =>
        row.audienceSurfaceRef === "audsurf_governance_admin" &&
        row.environmentRing === "production" &&
        row.routeFamilyRef === "rf_governance_shell",
    );
    assertCondition(Boolean(governanceRow), "Governance production row is missing.");
    await page.locator(`[data-testid='matrix-row-${governanceRow.browserRecoveryPostureId}']`).click();
    const blockedColor = await page
      .locator(`tr[data-testid='matrix-record-${governanceRow.browserRecoveryPostureId}'] .chip-read_only`)
      .evaluate((node) => getComputedStyle(node).backgroundColor);
    assertCondition(liveColor !== blockedColor, "Recovery and read-only chips are no longer visually distinct.");

    await page.locator("[data-testid='filter-audience']").selectOption("all");
    await page.locator("[data-testid='filter-environment']").selectOption("all");
    await page.locator("[data-testid='filter-posture']").selectOption("all");
    await page.locator("[data-testid='filter-live']").selectOption("all");

    const visibleIds = await page.evaluate(() =>
      Array.from(document.querySelectorAll(".matrix-button")).map((node) => node.getAttribute("data-row-id")),
    );
    const firstId = visibleIds[0];
    const secondId = visibleIds[1];
    await page.locator(`[data-testid='matrix-row-${firstId}']`).focus();
    await page.keyboard.press("ArrowDown");
    const secondSelected = await page
      .locator(`[data-testid='matrix-record-${secondId}']`)
      .getAttribute("data-selected");
    assertCondition(secondSelected === "true", "ArrowDown did not advance selection.");

    await page.setViewportSize({ width: 980, height: 900 });
    assertCondition(await page.locator("[data-testid='inspector']").isVisible(), "Inspector disappeared at tablet width.");

    assertCondition(
      (await page.locator("header").count()) === 1 &&
        (await page.locator("nav").count()) === 1 &&
        (await page.locator("main").count()) === 1 &&
        (await page.locator("aside").count()) === 1,
      "Required landmarks are missing.",
    );

    const reducedMotionPage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    try {
      await reducedMotionPage.emulateMedia({ reducedMotion: "reduce" });
      await reducedMotionPage.goto(url, { waitUntil: "networkidle" });
      const reducedMotion = await reducedMotionPage.locator("body").getAttribute("data-reduced-motion");
      assertCondition(reducedMotion === "true", "Reduced-motion posture did not activate.");
    } finally {
      await reducedMotionPage.close();
    }
  } finally {
    await browser.close();
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
    """
    return template


def build_matrix_csv_rows(matrix_rows: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], list[str]]:
    fieldnames = [
        "browserRecoveryPostureId",
        "environmentRing",
        "routeFamilyRef",
        "routeFamilyLabel",
        "audienceSurfaceRef",
        "gatewaySurfaceRef",
        "runtimePublicationBundleRef",
        "releasePublicationParityRecordRef",
        "cachePolicyRef",
        "secondaryCachePolicyRefs",
        "liveUpdateChannelContractRef",
        "baselineBrowserPosture",
        "transientDisconnectPosture",
        "replayGapPosture",
        "staleProjectionPosture",
        "publicationDriftPosture",
        "releaseOrChannelFreezePosture",
        "assuranceTrustDriftPosture",
        "manifestDriftPosture",
        "offlineReusePosture",
        "runtimePublicationState",
        "parityState",
        "routeExposureState",
        "staleDisclosureMode",
        "defaultRecoveryDispositionRef",
        "readOnlyRecoveryDispositionRef",
        "recoveryOnlyRecoveryDispositionRef",
        "blockedRecoveryDispositionRef",
        "offlineReuseDisposition",
        "reconnectPolicyRef",
        "gapResolutionRefs",
        "source_refs",
    ]
    serialized_rows = []
    for row in matrix_rows:
        serialized = dict(row)
        serialized["secondaryCachePolicyRefs"] = "|".join(row["secondaryCachePolicyRefs"])
        serialized["gapResolutionRefs"] = "|".join(row["gapResolutionRefs"])
        serialized["source_refs"] = "|".join(row["source_refs"])
        serialized_rows.append(serialized)
    return serialized_rows, fieldnames


def main() -> None:
    api_registry = load_json(API_REGISTRY_PATH)
    frontend = load_json(FRONTEND_MANIFESTS_PATH)
    bundles = load_json(RUNTIME_BUNDLES_PATH)
    parity = load_json(PARITY_RECORDS_PATH)

    require(api_registry["task_id"] == "par_065", "PREREQUISITE_GAP_096_API_REGISTRY_TASK")
    require(frontend["task_id"] == "seq_050", "PREREQUISITE_GAP_096_FRONTEND_TASK")
    require(bundles["task_id"] == "par_094", "PREREQUISITE_GAP_096_RUNTIME_PUBLICATION_TASK")
    require(parity["task_id"] == "par_094", "PREREQUISITE_GAP_096_PARITY_TASK")

    route_bundles = api_registry["routeFamilyBundles"]
    frontend_manifests = frontend["frontendContractManifests"]
    publication_rings = build_publication_rings(
        bundles["runtimePublicationBundles"], parity["releasePublicationParityRecords"]
    )
    cache_catalog = build_cache_catalog(api_registry, route_bundles, frontend_manifests)
    live_catalog = build_live_channel_catalog(api_registry, route_bundles)
    matrix_rows = build_browser_recovery_matrix(
        route_bundles, publication_rings, cache_catalog, live_catalog
    )

    require(len(cache_catalog["clientCachePolicies"]) == 21, "PREREQUISITE_GAP_096_CACHE_COUNT")
    require(
        len(live_catalog["liveUpdateChannelContracts"]) == 15,
        "PREREQUISITE_GAP_096_LIVE_COUNT",
    )
    require(len(matrix_rows) == 95, "PREREQUISITE_GAP_096_MATRIX_COUNT")

    write_json(CACHE_CATALOG_PATH, cache_catalog)
    write_json(LIVE_CHANNEL_CATALOG_PATH, live_catalog)
    csv_rows, fieldnames = build_matrix_csv_rows(matrix_rows)
    write_csv(BROWSER_RECOVERY_MATRIX_PATH, csv_rows, fieldnames)

    write_json(CACHE_SCHEMA_PATH, build_cache_schema())
    write_json(LIVE_CHANNEL_SCHEMA_PATH, build_live_channel_schema())
    write_json(BROWSER_RECOVERY_SCHEMA_PATH, build_browser_recovery_schema())

    write_browser_governor_catalog(publication_rings, cache_catalog, live_catalog, matrix_rows)
    write_text(DESIGN_DOC_PATH, build_design_doc(cache_catalog, live_catalog, matrix_rows))
    write_text(RECOVERY_DOC_PATH, build_recovery_doc(matrix_rows))
    write_text(MATRIX_DOC_PATH, build_matrix_doc(matrix_rows))
    write_text(STUDIO_PATH, build_studio_html())
    write_text(SPEC_PATH, build_playwright_spec())

    patch_release_controls_index()
    patch_release_controls_public_api_test()
    patch_api_contracts_package_json()
    patch_api_contracts_public_api_test()
    patch_root_package_json()
    patch_playwright_package_json()
    patch_api_gateway_service_definition()
    patch_api_gateway_runtime()


if __name__ == "__main__":
    main()
