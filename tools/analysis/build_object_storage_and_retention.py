#!/usr/bin/env python3
from __future__ import annotations

import csv
import hashlib
import json
import shutil
from datetime import datetime, timezone
from pathlib import Path
from textwrap import dedent
from typing import Any

from root_script_updates import ROOT_SCRIPT_UPDATES


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"
TESTS_DIR = ROOT / "tests" / "playwright"
INFRA_DIR = ROOT / "infra" / "object-storage"

ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = TESTS_DIR / "package.json"
RUNTIME_TOPOLOGY_PATH = DATA_DIR / "runtime_topology_manifest.json"
DOMAIN_STORE_MANIFEST_PATH = DATA_DIR / "domain_store_manifest.json"
EVIDENCE_OBJECT_MANIFEST_PATH = DATA_DIR / "evidence_object_manifest.json"
WORM_RETENTION_PATH = DATA_DIR / "worm_retention_classes.json"
RECOVERY_POSTURE_PATH = DATA_DIR / "recovery_control_posture_rules.json"

CLASS_MANIFEST_PATH = DATA_DIR / "object_storage_class_manifest.json"
RETENTION_MATRIX_PATH = DATA_DIR / "object_retention_policy_matrix.csv"
KEY_RULES_PATH = DATA_DIR / "object_key_manifest_rules.json"

DESIGN_DOC_PATH = DOCS_DIR / "86_object_storage_and_retention_design.md"
RULES_DOC_PATH = DOCS_DIR / "86_artifact_storage_classes_and_visibility_rules.md"
ATLAS_PATH = DOCS_DIR / "86_object_storage_retention_atlas.html"
SPEC_PATH = TESTS_DIR / "object-storage-retention-atlas.spec.js"

README_PATH = INFRA_DIR / "README.md"
TERRAFORM_MAIN_PATH = INFRA_DIR / "terraform" / "main.tf"
TERRAFORM_VARIABLES_PATH = INFRA_DIR / "terraform" / "variables.tf"
TERRAFORM_OUTPUTS_PATH = INFRA_DIR / "terraform" / "outputs.tf"
NAMESPACE_MODULE_MAIN_PATH = (
    INFRA_DIR / "terraform" / "modules" / "object_storage_namespace" / "main.tf"
)
NAMESPACE_MODULE_VARIABLES_PATH = (
    INFRA_DIR / "terraform" / "modules" / "object_storage_namespace" / "variables.tf"
)
NAMESPACE_MODULE_OUTPUTS_PATH = (
    INFRA_DIR / "terraform" / "modules" / "object_storage_namespace" / "outputs.tf"
)
CLASS_MODULE_MAIN_PATH = (
    INFRA_DIR / "terraform" / "modules" / "storage_class_bucket" / "main.tf"
)
CLASS_MODULE_VARIABLES_PATH = (
    INFRA_DIR / "terraform" / "modules" / "storage_class_bucket" / "variables.tf"
)
CLASS_MODULE_OUTPUTS_PATH = (
    INFRA_DIR / "terraform" / "modules" / "storage_class_bucket" / "outputs.tf"
)

ENVIRONMENT_FILE_PATHS = {
    "local": INFRA_DIR / "environments" / "local.auto.tfvars.json",
    "ci-preview": INFRA_DIR / "environments" / "ci-preview.auto.tfvars.json",
    "integration": INFRA_DIR / "environments" / "integration.auto.tfvars.json",
    "preprod": INFRA_DIR / "environments" / "preprod.auto.tfvars.json",
    "production": INFRA_DIR / "environments" / "production.auto.tfvars.json",
}

BOOTSTRAP_CATALOG_PATH = INFRA_DIR / "bootstrap" / "object-storage-seed-catalog.json"
LOCAL_COMPOSE_PATH = INFRA_DIR / "local" / "object-storage-emulator.compose.yaml"
LOCAL_POLICY_PATH = INFRA_DIR / "local" / "object-storage-policy.json"
LOCAL_HANDOFF_PATH = INFRA_DIR / "local" / "malware-scan-handoff.json"
LOCAL_BOOTSTRAP_SCRIPT_PATH = INFRA_DIR / "local" / "bootstrap-object-storage.mjs"
SMOKE_TEST_PATH = INFRA_DIR / "tests" / "object-storage-smoke.test.mjs"

TASK_ID = "par_086"
VISUAL_MODE = "Object_Storage_Retention_Atlas"
GENERATED_AT = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
CAPTURED_ON = GENERATED_AT[:10]

STORE_REF = "store_object_artifact_plane"
DATA_STORE_REF = "ds_object_artifact_store"
HOLD_PATTERN = "short_lived_manifest_bound_download_ticket"
CLASS_ORDER = [
    "quarantine_raw",
    "evidence_source_immutable",
    "derived_internal",
    "redacted_presentation",
    "outbound_ephemeral",
    "ops_recovery_staging",
]
ENVIRONMENT_ORDER = ["local", "ci-preview", "integration", "preprod", "production"]
ENVIRONMENT_LABELS = {
    "local": "Local",
    "ci-preview": "CI preview",
    "integration": "Integration",
    "preprod": "Preprod",
    "production": "Production",
}
WORKLOAD_LABELS = {
    "wf_command_orchestration": "Command orchestration",
    "wf_projection_read_models": "Projection and derivation",
    "wf_integration_dispatch": "Integration dispatch",
    "wf_shell_delivery_published_gateway": "Published gateway",
    "wf_assurance_security_control": "Assurance and security",
    "wf_data_stateful_plane": "Stateful data plane",
    "wf_integration_simulation_lab": "Simulator backplane",
}
ACCENT_BY_CLASS = {
    "quarantine_raw": "quarantine",
    "evidence_source_immutable": "trusted",
    "derived_internal": "derived",
    "redacted_presentation": "redacted",
    "outbound_ephemeral": "ephemeral",
    "ops_recovery_staging": "hold",
}
ACCENT_COLOR = {
    "quarantine": "#C24141",
    "trusted": "#2563EB",
    "derived": "#0EA5A4",
    "redacted": "#7C3AED",
    "ephemeral": "#D97706",
    "hold": "#059669",
}
FLOW_ORDER = [
    "quarantine_raw",
    "evidence_source_immutable",
    "derived_internal",
    "redacted_presentation",
    "outbound_ephemeral",
    "ops_recovery_staging",
]

MISSION = (
    "Provision the governed object-storage substrate for quarantined uploads, immutable source "
    "evidence, derived packages, redacted presentation artifacts, outbound handoff bundles, and "
    "recovery staging without letting bucket paths or object metadata become visibility authority."
)

SOURCE_PRECEDENCE = [
    "prompt/086.md",
    "prompt/shared_operating_contract_086_to_095.md",
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "data/analysis/runtime_topology_manifest.json",
    "data/analysis/domain_store_manifest.json",
    "data/analysis/evidence_object_manifest.json",
    "data/analysis/worm_retention_classes.json",
    "data/analysis/recovery_control_posture_rules.json",
    "docs/architecture/84_runtime_topology_and_trust_boundary_realization.md",
    "docs/architecture/85_domain_transaction_store_and_fhir_storage_design.md",
    "blueprint/phase-0-the-foundation-protocol.md#4.3B Evidence immutability, derivation, and parity",
    "blueprint/phase-0-the-foundation-protocol.md#ArtifactSurfaceFrame",
    "blueprint/platform-runtime-and-release-blueprint.md#Data persistence and migration contract",
    "blueprint/platform-runtime-and-release-blueprint.md#Security baseline contract",
    "blueprint/platform-runtime-and-release-blueprint.md#Operational readiness contract",
    "blueprint/forensic-audit-findings.md#Finding-09",
    "blueprint/forensic-audit-findings.md#Finding-61",
    "blueprint/forensic-audit-findings.md#Finding-81",
    "blueprint/forensic-audit-findings.md#Finding-88",
    "blueprint/forensic-audit-findings.md#Finding-112",
]

ASSUMPTIONS = [
    {
        "assumption_ref": "ASSUMPTION_086_S3_COMPATIBLE_EMULATION",
        "value": "minio_s3_compatible_local_plane",
        "reason": (
            "The local and CI path must preserve bucket classes, object-key law, private-only "
            "posture, and manifest-bound delivery without taking a dependency on live cloud "
            "credentials or managed malware services."
        ),
    },
    {
        "assumption_ref": "ASSUMPTION_086_OBJECT_KEYS_USE_DIGEST_SEGMENTS",
        "value": "tenant_lineage_artifact_digests_only",
        "reason": (
            "Artifact refs remain traceable through manifests and digests, but object keys must not "
            "embed PHI, patient identifiers, or stable public handles."
        ),
    },
]

FOLLOW_ON_DEPENDENCIES = [
    {
        "dependency_ref": "FOLLOW_ON_DEPENDENCY_086_ARTIFACT_PRESENTATION_CONTRACT_EXPANSION",
        "owning_task_ref": "later_artifact_presentation_track",
        "scope": "Browser-safe rendering, preview, and delivery UX remain governed by later publication work.",
    },
    {
        "dependency_ref": "FOLLOW_ON_DEPENDENCY_086_MANAGED_SCAN_PROVIDER_CUTOVER",
        "owning_task_ref": "later_security_provider_track",
        "scope": "Live malware-scanning, KMS, and replication providers may replace the emulator, but not the class taxonomy or manifest law.",
    },
    {
        "dependency_ref": "FOLLOW_ON_DEPENDENCY_086_RESTORE_AND_HOLD_AUTOMATION",
        "owning_task_ref": "later_recovery_governance_track",
        "scope": "Recurring restore drills, legal-hold assertion workflows, and archive promotion remain downstream control-plane work.",
    },
]

ENVIRONMENT_DEFINITIONS = {
    "local": {
        "provider_baseline": "minio_s3_compatible",
        "namespace_id": "vecells-local-artifacts",
        "regions": ["local_nonprod"],
        "private_endpoint_ref": "ope_086_local_artifact_plane",
        "kms_mode": "emulated_sse_s3",
        "versioning_mode": "enabled",
        "signed_access_ttl_seconds": 300,
        "stale_policy_alert_count": 0,
    },
    "ci-preview": {
        "provider_baseline": "minio_s3_compatible",
        "namespace_id": "vecells-ci-artifacts",
        "regions": ["uk_primary_region"],
        "private_endpoint_ref": "ope_086_ci_artifact_plane",
        "kms_mode": "emulated_sse_s3",
        "versioning_mode": "enabled",
        "signed_access_ttl_seconds": 300,
        "stale_policy_alert_count": 0,
    },
    "integration": {
        "provider_baseline": "managed_s3_compatible",
        "namespace_id": "vecells-integration-artifacts",
        "regions": ["uk_primary_region"],
        "private_endpoint_ref": "ope_086_integration_artifact_plane",
        "kms_mode": "kms_ready_single_region",
        "versioning_mode": "enabled",
        "signed_access_ttl_seconds": 240,
        "stale_policy_alert_count": 0,
    },
    "preprod": {
        "provider_baseline": "managed_s3_compatible",
        "namespace_id": "vecells-preprod-artifacts",
        "regions": ["uk_primary_region", "uk_secondary_region"],
        "private_endpoint_ref": "ope_086_preprod_artifact_plane",
        "kms_mode": "kms_ready_multi_region",
        "versioning_mode": "enabled",
        "signed_access_ttl_seconds": 180,
        "stale_policy_alert_count": 0,
    },
    "production": {
        "provider_baseline": "managed_s3_compatible",
        "namespace_id": "vecells-production-artifacts",
        "regions": ["uk_primary_region", "uk_secondary_region"],
        "private_endpoint_ref": "ope_086_production_artifact_plane",
        "kms_mode": "kms_required_multi_region",
        "versioning_mode": "enabled",
        "signed_access_ttl_seconds": 120,
        "stale_policy_alert_count": 0,
    },
}

STORAGE_CLASS_DEFINITIONS = {
    "quarantine_raw": {
        "display_name": "Quarantine raw",
        "purpose": "Unsafe uploads and telephony recordings remain unreadable until scan and manifest review settle.",
        "encryption_posture": "at_rest_tls_private",
        "immutability_mode": "write_once_pending_scan",
        "retention_state": "scan_hold",
        "default_retention_days": {
            "local": 14,
            "ci-preview": 7,
            "integration": 21,
            "preprod": 30,
            "production": 30,
        },
        "legal_hold_ready": True,
        "browser_delivery_posture": "forbidden",
        "signed_access_ttl_seconds": 0,
        "workload_family_refs": [
            "wf_command_orchestration",
            "wf_integration_dispatch",
            "wf_assurance_security_control",
            "wf_integration_simulation_lab",
        ],
        "service_identity_refs": [
            "sid_command_api",
            "sid_integration_dispatch",
            "sid_assurance_control",
            "sid_adapter_simulators",
        ],
        "manifest_rule_ref": "okr_086_scan_pending",
        "retention_policy_ref": "ret_086_quarantine_raw",
        "hold_ref": "hold_086_quarantine_raw",
        "purge_mode": "blocked_until_scan_and_manifest_settle",
        "governing_object_refs": ["OBJ_063_CAPTURE_BUNDLE"],
        "artifact_kind_refs": ["upload_attachment", "telephony_recording"],
        "visibility_authority": "never_browser_visible",
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#CaptureBundle",
            "blueprint/phase-0-the-foundation-protocol.md#4.3A Artifact quarantine and fallback review",
        ],
    },
    "evidence_source_immutable": {
        "display_name": "Evidence source immutable",
        "purpose": "Cleared source evidence stays immutable and content-traceable for parity and review.",
        "encryption_posture": "at_rest_tls_private",
        "immutability_mode": "worm_ready_write_once",
        "retention_state": "immutable_source_retention",
        "default_retention_days": {
            "local": 30,
            "ci-preview": 30,
            "integration": 180,
            "preprod": 730,
            "production": 2555,
        },
        "legal_hold_ready": True,
        "browser_delivery_posture": "forbidden",
        "signed_access_ttl_seconds": 0,
        "workload_family_refs": [
            "wf_command_orchestration",
            "wf_assurance_security_control",
            "wf_data_stateful_plane",
        ],
        "service_identity_refs": ["sid_command_api", "sid_assurance_control", "sid_data_plane"],
        "manifest_rule_ref": "okr_086_source_immutable",
        "retention_policy_ref": "ret_086_evidence_source",
        "hold_ref": "hold_086_source_evidence",
        "purge_mode": "governed_purge_only",
        "governing_object_refs": ["OBJ_063_CAPTURE_BUNDLE", "OBJ_063_EVIDENCE_SNAPSHOT"],
        "artifact_kind_refs": ["source_bundle", "capture_archive"],
        "visibility_authority": "evidence_manifest_and_presentation_contract",
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#EvidenceCaptureBundle",
            "blueprint/phase-0-the-foundation-protocol.md#EvidenceSnapshot",
            "data/analysis/worm_retention_classes.json",
        ],
    },
    "derived_internal": {
        "display_name": "Derived internal",
        "purpose": "Transcripts, extracted fact packs, and normalized packages stay internal and supersession-aware.",
        "encryption_posture": "at_rest_tls_private",
        "immutability_mode": "append_only_superseded_versions",
        "retention_state": "derived_internal_retention",
        "default_retention_days": {
            "local": 14,
            "ci-preview": 7,
            "integration": 60,
            "preprod": 180,
            "production": 365,
        },
        "legal_hold_ready": True,
        "browser_delivery_posture": "forbidden",
        "signed_access_ttl_seconds": 0,
        "workload_family_refs": [
            "wf_command_orchestration",
            "wf_projection_read_models",
            "wf_assurance_security_control",
        ],
        "service_identity_refs": ["sid_command_api", "sid_projection_worker", "sid_assurance_control"],
        "manifest_rule_ref": "okr_086_derived_internal",
        "retention_policy_ref": "ret_086_derived_internal",
        "hold_ref": "hold_086_derived_internal",
        "purge_mode": "purge_after_supersession_window",
        "governing_object_refs": ["OBJ_063_DERIVATION_PACKAGE"],
        "artifact_kind_refs": ["transcript", "fact_pack", "normalized_attachment"],
        "visibility_authority": "derivation_manifest_only",
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#EvidenceDerivationPackage",
            "data/analysis/evidence_object_manifest.json",
        ],
    },
    "redacted_presentation": {
        "display_name": "Redacted presentation",
        "purpose": "Presentation-safe artifacts stay separate from source bytes and are released only through governed preview and download seams.",
        "encryption_posture": "at_rest_tls_private",
        "immutability_mode": "append_only_policy_versioned",
        "retention_state": "governed_presentation_retention",
        "default_retention_days": {
            "local": 14,
            "ci-preview": 7,
            "integration": 60,
            "preprod": 180,
            "production": 365,
        },
        "legal_hold_ready": True,
        "browser_delivery_posture": "governed_presentation_only",
        "signed_access_ttl_seconds": 180,
        "workload_family_refs": [
            "wf_command_orchestration",
            "wf_projection_read_models",
            "wf_shell_delivery_published_gateway",
            "wf_assurance_security_control",
        ],
        "service_identity_refs": [
            "sid_command_api",
            "sid_projection_worker",
            "sid_published_gateway",
            "sid_assurance_control",
        ],
        "manifest_rule_ref": "okr_086_redacted_presentation",
        "retention_policy_ref": "ret_086_redacted_presentation",
        "hold_ref": "hold_086_redacted_presentation",
        "purge_mode": "purge_after_presentation_window",
        "governing_object_refs": ["OBJ_063_REDACTION_TRANSFORM", "OBJ_063_EVIDENCE_SNAPSHOT"],
        "artifact_kind_refs": ["redacted_pdf", "presentation_safe_attachment"],
        "visibility_authority": "artifact_presentation_contract_only",
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#EvidenceRedactionTransform",
            "blueprint/phase-0-the-foundation-protocol.md#ArtifactSurfaceFrame",
        ],
    },
    "outbound_ephemeral": {
        "display_name": "Outbound ephemeral",
        "purpose": "Governed handoff bundles and export artifacts remain short-lived, signed, and purge-first.",
        "encryption_posture": "at_rest_tls_private",
        "immutability_mode": "expiring_ticket_bound_copy",
        "retention_state": "ephemeral_purge_window",
        "default_retention_days": {
            "local": 2,
            "ci-preview": 1,
            "integration": 7,
            "preprod": 14,
            "production": 14,
        },
        "legal_hold_ready": True,
        "browser_delivery_posture": "governed_download_handoff_only",
        "signed_access_ttl_seconds": 120,
        "workload_family_refs": [
            "wf_command_orchestration",
            "wf_integration_dispatch",
            "wf_shell_delivery_published_gateway",
            "wf_assurance_security_control",
        ],
        "service_identity_refs": [
            "sid_command_api",
            "sid_integration_dispatch",
            "sid_published_gateway",
            "sid_assurance_control",
        ],
        "manifest_rule_ref": "okr_086_outbound_ephemeral",
        "retention_policy_ref": "ret_086_outbound_ephemeral",
        "hold_ref": "hold_086_outbound_ephemeral",
        "purge_mode": "purge_on_expiry_or_settlement",
        "governing_object_refs": ["OBJ_063_EVIDENCE_SNAPSHOT"],
        "artifact_kind_refs": ["download_bundle", "outbound_handoff_package"],
        "visibility_authority": "outbound_navigation_grant_only",
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#OutboundNavigationGrant",
            "blueprint/platform-runtime-and-release-blueprint.md#Security baseline contract",
        ],
    },
    "ops_recovery_staging": {
        "display_name": "Ops recovery staging",
        "purpose": "Restore rehearsals, rollback evidence, and sealed recovery staging objects remain private to data-plane and assurance operators.",
        "encryption_posture": "at_rest_tls_private",
        "immutability_mode": "restore_window_controlled",
        "retention_state": "recovery_staging_window",
        "default_retention_days": {
            "local": 7,
            "ci-preview": 3,
            "integration": 14,
            "preprod": 30,
            "production": 45,
        },
        "legal_hold_ready": True,
        "browser_delivery_posture": "forbidden",
        "signed_access_ttl_seconds": 0,
        "workload_family_refs": [
            "wf_assurance_security_control",
            "wf_data_stateful_plane",
        ],
        "service_identity_refs": ["sid_assurance_control", "sid_data_plane"],
        "manifest_rule_ref": "okr_086_ops_recovery",
        "retention_policy_ref": "ret_086_ops_recovery",
        "hold_ref": "hold_086_ops_recovery",
        "purge_mode": "purge_after_restore_evidence_window",
        "governing_object_refs": ["RCP_060_OBJECT_STORAGE_STAGING"],
        "artifact_kind_refs": ["restore_staging_package", "rollback_bundle"],
        "visibility_authority": "recovery_control_posture_only",
        "source_refs": [
            "data/analysis/recovery_control_posture_rules.json",
            "docs/architecture/60_restore_and_recovery_control_matrix.md",
        ],
    },
}

ACCESS_POLICY_DEFINITIONS = [
    {
        "policy_ref": "pol_086_quarantine_ingest",
        "storage_class_ref": "quarantine_raw",
        "service_identity_ref": "sid_command_api",
        "workload_family_ref": "wf_command_orchestration",
        "access_mode": "manifest_bound_write",
        "allowed_operations": ["put_object", "write_manifest", "transition_scan_state"],
    },
    {
        "policy_ref": "pol_086_quarantine_scan",
        "storage_class_ref": "quarantine_raw",
        "service_identity_ref": "sid_integration_dispatch",
        "workload_family_ref": "wf_integration_dispatch",
        "access_mode": "scan_and_release",
        "allowed_operations": ["get_object", "write_scan_verdict", "promote_clean_copy"],
    },
    {
        "policy_ref": "pol_086_source_evidence_authority",
        "storage_class_ref": "evidence_source_immutable",
        "service_identity_ref": "sid_command_api",
        "workload_family_ref": "wf_command_orchestration",
        "access_mode": "write_once_authority",
        "allowed_operations": ["put_object", "read_manifest", "set_chain_parent"],
    },
    {
        "policy_ref": "pol_086_source_hold_review",
        "storage_class_ref": "evidence_source_immutable",
        "service_identity_ref": "sid_assurance_control",
        "workload_family_ref": "wf_assurance_security_control",
        "access_mode": "hold_and_review",
        "allowed_operations": ["read_manifest", "assert_hold", "release_hold"],
    },
    {
        "policy_ref": "pol_086_derived_compile",
        "storage_class_ref": "derived_internal",
        "service_identity_ref": "sid_projection_worker",
        "workload_family_ref": "wf_projection_read_models",
        "access_mode": "append_only_derivation",
        "allowed_operations": ["get_object", "put_object", "write_supersession_manifest"],
    },
    {
        "policy_ref": "pol_086_derived_review",
        "storage_class_ref": "derived_internal",
        "service_identity_ref": "sid_assurance_control",
        "workload_family_ref": "wf_assurance_security_control",
        "access_mode": "review_only",
        "allowed_operations": ["read_manifest", "assert_hold"],
    },
    {
        "policy_ref": "pol_086_redacted_publish",
        "storage_class_ref": "redacted_presentation",
        "service_identity_ref": "sid_projection_worker",
        "workload_family_ref": "wf_projection_read_models",
        "access_mode": "presentation_publish",
        "allowed_operations": ["put_object", "read_manifest", "bind_presentation_contract"],
    },
    {
        "policy_ref": "pol_086_redacted_gateway_delivery",
        "storage_class_ref": "redacted_presentation",
        "service_identity_ref": "sid_published_gateway",
        "workload_family_ref": "wf_shell_delivery_published_gateway",
        "access_mode": "ticket_bound_read",
        "allowed_operations": ["read_manifest", "mint_download_ticket", "stream_object"],
    },
    {
        "policy_ref": "pol_086_outbound_dispatch",
        "storage_class_ref": "outbound_ephemeral",
        "service_identity_ref": "sid_integration_dispatch",
        "workload_family_ref": "wf_integration_dispatch",
        "access_mode": "external_handoff",
        "allowed_operations": ["put_object", "read_manifest", "expire_ticket"],
    },
    {
        "policy_ref": "pol_086_outbound_gateway_delivery",
        "storage_class_ref": "outbound_ephemeral",
        "service_identity_ref": "sid_published_gateway",
        "workload_family_ref": "wf_shell_delivery_published_gateway",
        "access_mode": "download_ticket_only",
        "allowed_operations": ["read_manifest", "mint_download_ticket", "stream_object"],
    },
    {
        "policy_ref": "pol_086_recovery_stage",
        "storage_class_ref": "ops_recovery_staging",
        "service_identity_ref": "sid_data_plane",
        "workload_family_ref": "wf_data_stateful_plane",
        "access_mode": "restore_window_control",
        "allowed_operations": ["put_object", "get_object", "set_restore_window"],
    },
    {
        "policy_ref": "pol_086_recovery_hold_review",
        "storage_class_ref": "ops_recovery_staging",
        "service_identity_ref": "sid_assurance_control",
        "workload_family_ref": "wf_assurance_security_control",
        "access_mode": "hold_and_restore_review",
        "allowed_operations": ["read_manifest", "assert_hold", "release_hold"],
    },
]

FIXTURE_DEFINITIONS = [
    {
        "fixture_ref": "fixture_086_upload_photo_pending_scan",
        "display_name": "Uploaded intake photo pending scan",
        "storage_class_ref": "quarantine_raw",
        "tenant_seed": "tenant-east-alpha",
        "lineage_seed": "lineage-photo-intake",
        "artifact_ref": "ART_086_INTAKE_PHOTO",
        "governing_object_ref": "OBJ_063_CAPTURE_BUNDLE",
        "payload_text": "pending scan image bytes",
        "content_type": "image/jpeg",
        "file_name": "capture.bin",
    },
    {
        "fixture_ref": "fixture_086_call_recording_pending_scan",
        "display_name": "Telephony recording pending scan",
        "storage_class_ref": "quarantine_raw",
        "tenant_seed": "tenant-east-alpha",
        "lineage_seed": "lineage-call-ivr",
        "artifact_ref": "ART_086_CALL_RECORDING",
        "governing_object_ref": "OBJ_063_CAPTURE_BUNDLE",
        "payload_text": "pending scan audio bytes",
        "content_type": "audio/wav",
        "file_name": "recording.bin",
    },
    {
        "fixture_ref": "fixture_086_clean_source_bundle",
        "display_name": "Cleared source bundle",
        "storage_class_ref": "evidence_source_immutable",
        "tenant_seed": "tenant-east-alpha",
        "lineage_seed": "lineage-source-bundle",
        "artifact_ref": "ART_086_SOURCE_BUNDLE",
        "governing_object_ref": "OBJ_063_CAPTURE_BUNDLE",
        "payload_text": "immutable source evidence bytes",
        "content_type": "application/octet-stream",
        "file_name": "source.bin",
    },
    {
        "fixture_ref": "fixture_086_transcript_package",
        "display_name": "Transcript derivation package",
        "storage_class_ref": "derived_internal",
        "tenant_seed": "tenant-east-alpha",
        "lineage_seed": "lineage-transcript",
        "artifact_ref": "ART_086_TRANSCRIPT",
        "governing_object_ref": "OBJ_063_DERIVATION_PACKAGE",
        "payload_text": "transcript package content",
        "content_type": "application/json",
        "file_name": "transcript.json",
    },
    {
        "fixture_ref": "fixture_086_fact_pack",
        "display_name": "Extracted fact pack",
        "storage_class_ref": "derived_internal",
        "tenant_seed": "tenant-east-alpha",
        "lineage_seed": "lineage-fact-pack",
        "artifact_ref": "ART_086_FACT_PACK",
        "governing_object_ref": "OBJ_063_DERIVATION_PACKAGE",
        "payload_text": "fact pack content",
        "content_type": "application/json",
        "file_name": "fact-pack.json",
    },
    {
        "fixture_ref": "fixture_086_redacted_pdf",
        "display_name": "Redacted PDF preview",
        "storage_class_ref": "redacted_presentation",
        "tenant_seed": "tenant-east-alpha",
        "lineage_seed": "lineage-redacted-pdf",
        "artifact_ref": "ART_086_REDACTED_PDF",
        "governing_object_ref": "OBJ_063_REDACTION_TRANSFORM",
        "payload_text": "redacted pdf bytes",
        "content_type": "application/pdf",
        "file_name": "preview.pdf",
    },
    {
        "fixture_ref": "fixture_086_outbound_bundle",
        "display_name": "Outbound export bundle",
        "storage_class_ref": "outbound_ephemeral",
        "tenant_seed": "tenant-east-alpha",
        "lineage_seed": "lineage-outbound",
        "artifact_ref": "ART_086_OUTBOUND",
        "governing_object_ref": "OBJ_063_EVIDENCE_SNAPSHOT",
        "payload_text": "outbound handoff bundle",
        "content_type": "application/zip",
        "file_name": "handoff.zip",
    },
    {
        "fixture_ref": "fixture_086_restore_staging",
        "display_name": "Recovery staging bundle",
        "storage_class_ref": "ops_recovery_staging",
        "tenant_seed": "tenant-east-alpha",
        "lineage_seed": "lineage-recovery-stage",
        "artifact_ref": "ART_086_RECOVERY_STAGE",
        "governing_object_ref": "RCP_060_OBJECT_STORAGE_STAGING",
        "payload_text": "restore staging bundle",
        "content_type": "application/octet-stream",
        "file_name": "recovery-stage.bin",
    },
]


def fail(code: str, message: str) -> None:
    raise SystemExit(f"{code}: {message}")


def require(path: Path, code: str) -> dict[str, Any]:
    if not path.exists():
        fail(code, f"Missing prerequisite {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n", encoding="utf-8")


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def write_csv(path: Path, rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)


def append_script_step(current: str, step: str) -> str:
    parts = [part.strip() for part in current.split("&&") if part.strip()]
    if step not in parts:
        parts.append(step)
    return " && ".join(parts)


def digest_token(value: str, length: int = 12) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()[:length]


def stable_hash(payload: Any) -> str:
    return hashlib.sha256(
        json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")
    ).hexdigest()


def build_seed_catalog() -> list[dict[str, Any]]:
    catalog = []
    for fixture in FIXTURE_DEFINITIONS:
        tenant_digest = digest_token(fixture["tenant_seed"], 16)
        lineage_digest = digest_token(fixture["lineage_seed"], 16)
        artifact_digest = digest_token(fixture["artifact_ref"], 16)
        payload_sha = hashlib.sha256(fixture["payload_text"].encode("utf-8")).hexdigest()
        object_key = (
            f"tenant/{tenant_digest}/lineage/{lineage_digest}/artifact/{artifact_digest}/"
            f"sha/{payload_sha[:20]}/{fixture['file_name']}"
        )
        catalog.append(
            {
                "fixture_ref": fixture["fixture_ref"],
                "display_name": fixture["display_name"],
                "storage_class_ref": fixture["storage_class_ref"],
                "tenant_scope_digest": tenant_digest,
                "lineage_scope_digest": lineage_digest,
                "artifact_ref": fixture["artifact_ref"],
                "artifact_ref_digest": artifact_digest,
                "governing_object_ref": fixture["governing_object_ref"],
                "content_type": fixture["content_type"],
                "payload_sha256": payload_sha,
                "file_name": fixture["file_name"],
                "object_key": object_key,
                "sample_manifest_ref": f"manifest_{fixture['fixture_ref']}",
            }
        )
    return catalog


def build_storage_classes(seed_catalog: list[dict[str, Any]]) -> list[dict[str, Any]]:
    classes = []
    for class_ref in CLASS_ORDER:
        definition = STORAGE_CLASS_DEFINITIONS[class_ref]
        fixtures = [row["fixture_ref"] for row in seed_catalog if row["storage_class_ref"] == class_ref]
        classes.append(
            {
                "storage_class_ref": class_ref,
                "display_name": definition["display_name"],
                "accent_ref": ACCENT_BY_CLASS[class_ref],
                "purpose": definition["purpose"],
                "encryption_posture": definition["encryption_posture"],
                "immutability_mode": definition["immutability_mode"],
                "retention_state": definition["retention_state"],
                "retention_policy_ref": definition["retention_policy_ref"],
                "hold_ref": definition["hold_ref"],
                "legal_hold_ready": definition["legal_hold_ready"],
                "browser_delivery_posture": definition["browser_delivery_posture"],
                "signed_access_ttl_seconds": definition["signed_access_ttl_seconds"],
                "workload_family_refs": definition["workload_family_refs"],
                "service_identity_refs": definition["service_identity_refs"],
                "manifest_rule_ref": definition["manifest_rule_ref"],
                "purge_mode": definition["purge_mode"],
                "governing_object_refs": definition["governing_object_refs"],
                "artifact_kind_refs": definition["artifact_kind_refs"],
                "visibility_authority": definition["visibility_authority"],
                "seed_fixture_refs": fixtures,
                "source_refs": definition["source_refs"],
            }
        )
    return classes


def build_retention_rows() -> list[dict[str, Any]]:
    rows = []
    for environment_ring in ENVIRONMENT_ORDER:
        environment = ENVIRONMENT_DEFINITIONS[environment_ring]
        for class_ref in CLASS_ORDER:
            definition = STORAGE_CLASS_DEFINITIONS[class_ref]
            bucket_name = (
                f"{environment['namespace_id']}-"
                f"{class_ref.replace('_', '-')}"
            )
            rows.append(
                {
                    "environment_ring": environment_ring,
                    "storage_class_ref": class_ref,
                    "display_name": definition["display_name"],
                    "bucket_name": bucket_name,
                    "retention_policy_ref": definition["retention_policy_ref"],
                    "retention_state": definition["retention_state"],
                    "default_retention_days": definition["default_retention_days"][environment_ring],
                    "immutability_mode": definition["immutability_mode"],
                    "legal_hold_ready": str(definition["legal_hold_ready"]).lower(),
                    "purge_mode": definition["purge_mode"],
                    "browser_delivery_posture": definition["browser_delivery_posture"],
                    "signed_access_ttl_seconds": definition["signed_access_ttl_seconds"]
                    or environment["signed_access_ttl_seconds"],
                    "private_endpoint_ref": environment["private_endpoint_ref"],
                    "allowed_workload_family_refs": "|".join(definition["workload_family_refs"]),
                    "source_refs": "|".join(definition["source_refs"]),
                }
            )
    return rows


def build_access_policies() -> list[dict[str, Any]]:
    return [
        {
            **policy,
            "allowed_operations": policy["allowed_operations"],
        }
        for policy in ACCESS_POLICY_DEFINITIONS
    ]


def build_environment_realizations() -> list[dict[str, Any]]:
    realizations = []
    for environment_ring in ENVIRONMENT_ORDER:
        definition = ENVIRONMENT_DEFINITIONS[environment_ring]
        realizations.append(
            {
                "environment_ring": environment_ring,
                "environment_label": ENVIRONMENT_LABELS[environment_ring],
                "provider_baseline": definition["provider_baseline"],
                "namespace_id": definition["namespace_id"],
                "private_endpoint_ref": definition["private_endpoint_ref"],
                "kms_mode": definition["kms_mode"],
                "versioning_mode": definition["versioning_mode"],
                "signed_access_ttl_seconds": definition["signed_access_ttl_seconds"],
                "stale_policy_alert_count": definition["stale_policy_alert_count"],
                "region_placements": [
                    {
                        "region_ref": region_ref,
                        "bucket_namespace": definition["namespace_id"],
                        "private_endpoint_ref": definition["private_endpoint_ref"],
                    }
                    for region_ref in definition["regions"]
                ],
            }
        )
    return realizations


def build_class_realizations(retention_rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    realizations = []
    for row in retention_rows:
        environment = ENVIRONMENT_DEFINITIONS[row["environment_ring"]]
        definition = STORAGE_CLASS_DEFINITIONS[row["storage_class_ref"]]
        realizations.append(
            {
                "class_realization_ref": f"{row['environment_ring']}_{row['storage_class_ref']}",
                "environment_ring": row["environment_ring"],
                "storage_class_ref": row["storage_class_ref"],
                "bucket_name": row["bucket_name"],
                "namespace_id": environment["namespace_id"],
                "private_endpoint_ref": environment["private_endpoint_ref"],
                "replication_mode": (
                    "dual_region_ready"
                    if len(environment["regions"]) > 1
                    else "single_region_or_local"
                ),
                "retention_policy_ref": row["retention_policy_ref"],
                "default_retention_days": row["default_retention_days"],
                "browser_delivery_posture": row["browser_delivery_posture"],
                "legal_hold_ready": definition["legal_hold_ready"],
                "signed_access_ttl_seconds": row["signed_access_ttl_seconds"],
                "allowed_workload_family_refs": definition["workload_family_refs"],
                "service_identity_refs": definition["service_identity_refs"],
                "manifest_rule_ref": definition["manifest_rule_ref"],
                "sample_object_count": len(
                    [fixture for fixture in FIXTURE_DEFINITIONS if fixture["storage_class_ref"] == row["storage_class_ref"]]
                ),
            }
        )
    return realizations


def build_key_rules(seed_catalog: list[dict[str, Any]]) -> dict[str, Any]:
    sample_keys = {
        row["storage_class_ref"]: row["object_key"]
        for row in seed_catalog
        if row["storage_class_ref"] not in {}
    }
    return {
        "task_id": TASK_ID,
        "generated_at": GENERATED_AT,
        "captured_on": CAPTURED_ON,
        "visual_mode": VISUAL_MODE,
        "mission": MISSION,
        "runtime_topology_manifest_ref": "data/analysis/runtime_topology_manifest.json",
        "object_storage_class_manifest_ref": "data/analysis/object_storage_class_manifest.json",
        "source_precedence": SOURCE_PRECEDENCE,
        "path_segment_rules": [
            {
                "segment_ref": "seg_086_tenant_scope_digest",
                "position": 1,
                "render_template": "tenant/{tenant_scope_digest}",
                "derivation": "sha256(tenant_scope)[:16]",
            },
            {
                "segment_ref": "seg_086_lineage_scope_digest",
                "position": 2,
                "render_template": "lineage/{lineage_scope_digest}",
                "derivation": "sha256(lineage_scope)[:16]",
            },
            {
                "segment_ref": "seg_086_artifact_ref_digest",
                "position": 3,
                "render_template": "artifact/{artifact_ref_digest}",
                "derivation": "sha256(artifact_ref)[:16]",
            },
            {
                "segment_ref": "seg_086_payload_hash",
                "position": 4,
                "render_template": "sha/{payload_sha256[:20]}",
                "derivation": "sha256(payload_bytes)[:20]",
            },
        ],
        "manifest_required_fields": [
            "storage_class_ref",
            "governing_object_ref",
            "artifact_ref",
            "artifact_ref_digest",
            "tenant_scope_digest",
            "lineage_scope_digest",
            "payload_sha256",
            "source_hash_sha256",
            "retention_policy_ref",
            "hold_ref",
            "browser_delivery_posture",
            "signed_access_pattern",
        ],
        "class_rules": [
            {
                "storage_class_ref": class_ref,
                "manifest_rule_ref": STORAGE_CLASS_DEFINITIONS[class_ref]["manifest_rule_ref"],
                "sample_key": sample_keys.get(class_ref, ""),
                "bucket_authority_rule": "bucket_name_not_visibility_authority",
                "browser_delivery_rule": STORAGE_CLASS_DEFINITIONS[class_ref]["browser_delivery_posture"],
                "signed_access_pattern": HOLD_PATTERN,
            }
            for class_ref in CLASS_ORDER
        ],
        "prohibited_key_material": [
            "patient_name",
            "date_of_birth",
            "email_address",
            "phone_number",
            "nhs_number",
            "postal_address",
        ],
        "signed_access_pattern": {
            "pattern_ref": HOLD_PATTERN,
            "requirements": [
                "manifest_bound_subject",
                "visibility_check_completed",
                "short_lived_ticket",
                "no_bucket_path_reuse",
            ],
        },
        "tuple_hash": stable_hash(seed_catalog),
    }


def build_local_policy(storage_classes: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "task_id": TASK_ID,
        "store_ref": STORE_REF,
        "browser_addressable_services": [],
        "blocked_browser_targets": [DATA_STORE_REF] + CLASS_ORDER,
        "governed_delivery_classes": [
            row["storage_class_ref"]
            for row in storage_classes
            if row["browser_delivery_posture"] != "forbidden"
        ],
        "signed_access_pattern": HOLD_PATTERN,
        "public_url_policy": "forbidden",
        "quarantine_release_requires": [
            "scan_clean",
            "manifest_attached",
            "artifact_contract_bound",
            "visibility_authority_asserted",
        ],
    }


def build_malware_scan_handoff() -> dict[str, Any]:
    return {
        "task_id": TASK_ID,
        "handoff_ref": "msh_086_quarantine_release_gate",
        "source_storage_class_ref": "quarantine_raw",
        "clean_target_storage_class_ref": "evidence_source_immutable",
        "failed_target_storage_class_ref": "quarantine_raw",
        "event_refs": [
            "intake.attachment.quarantined",
            "intake.attachment.scan-cleared",
            "intake.attachment.scan-failed",
        ],
        "blocked_browser_paths": True,
        "required_verdicts": [
            "scan_clean",
            "hash_recorded",
            "manifest_attached",
            "lineage_bound",
        ],
        "notes": "Uploads and recordings must remain in quarantine until the scan seam and manifest gate both settle.",
    }


def build_manifest(
    runtime_topology: dict[str, Any],
    domain_store_manifest: dict[str, Any],
    evidence_manifest: dict[str, Any],
    storage_classes: list[dict[str, Any]],
    access_policies: list[dict[str, Any]],
    environment_realizations: list[dict[str, Any]],
    class_realizations: list[dict[str, Any]],
    seed_catalog: list[dict[str, Any]],
) -> dict[str, Any]:
    delivery_count = sum(
        1 for row in storage_classes if row["browser_delivery_posture"] != "forbidden"
    )
    quarantined_fixture_count = sum(
        1 for row in seed_catalog if row["storage_class_ref"] == "quarantine_raw"
    )
    payload = {
        "task_id": TASK_ID,
        "generated_at": GENERATED_AT,
        "captured_on": CAPTURED_ON,
        "visual_mode": VISUAL_MODE,
        "mission": MISSION,
        "runtime_topology_manifest_ref": "data/analysis/runtime_topology_manifest.json",
        "domain_store_manifest_ref": "data/analysis/domain_store_manifest.json",
        "evidence_object_manifest_ref": "data/analysis/evidence_object_manifest.json",
        "worm_retention_classes_ref": "data/analysis/worm_retention_classes.json",
        "recovery_control_posture_rules_ref": "data/analysis/recovery_control_posture_rules.json",
        "source_precedence": SOURCE_PRECEDENCE,
        "assumptions": ASSUMPTIONS,
        "follow_on_dependencies": FOLLOW_ON_DEPENDENCIES,
        "summary": {
            "storage_class_count": len(storage_classes),
            "access_policy_count": len(access_policies),
            "environment_realization_count": len(environment_realizations),
            "class_realization_count": len(class_realizations),
            "seed_fixture_count": len(seed_catalog),
            "quarantined_fixture_count": quarantined_fixture_count,
            "hold_ready_class_count": sum(1 for row in storage_classes if row["legal_hold_ready"]),
            "governed_delivery_class_count": delivery_count,
            "evidence_storage_binding_count": len(evidence_manifest["storage_classes"]),
            "runtime_data_store_catalog_count": len(runtime_topology["data_store_catalog"]),
            "domain_store_realization_count": domain_store_manifest["summary"]["store_realization_count"],
        },
        "store_descriptor": {
            "store_ref": STORE_REF,
            "data_store_ref": DATA_STORE_REF,
            "store_class": "object",
            "display_name": "Governed object artifact plane",
            "family_ref": "wf_data_stateful_plane",
            "trust_zone_ref": "tz_stateful_data",
            "browser_reachability": "never",
            "private_endpoint_mode": "required_all_environments",
            "object_identity_strategy": "hash_bound_manifest_identity",
            "signed_access_pattern": HOLD_PATTERN,
            "no_public_bucket_policy": True,
            "quarantine_handoff_ref": "msh_086_quarantine_release_gate",
        },
        "storage_classes": storage_classes,
        "access_policies": access_policies,
        "environment_realizations": environment_realizations,
        "class_realizations": class_realizations,
        "seed_catalog": seed_catalog,
    }
    payload["tuple_hash"] = stable_hash(payload["storage_classes"] + payload["class_realizations"])
    return payload


def build_design_doc(
    manifest: dict[str, Any],
    retention_rows: list[dict[str, Any]],
    access_policies: list[dict[str, Any]],
) -> str:
    class_table = "\n".join(
        f"| `{row['storage_class_ref']}` | {row['display_name']} | `{row['immutability_mode']}` | "
        f"`{row['retention_policy_ref']}` | `{row['browser_delivery_posture']}` |"
        for row in manifest["storage_classes"]
    )
    env_table = "\n".join(
        f"| `{row['environment_ring']}` | `{row['provider_baseline']}` | `{row['namespace_id']}` | "
        f"`{row['private_endpoint_ref']}` |"
        for row in manifest["environment_realizations"]
    )
    policy_table = "\n".join(
        f"| `{row['policy_ref']}` | `{row['storage_class_ref']}` | `{row['service_identity_ref']}` | "
        f"`{row['access_mode']}` | {', '.join(f'`{op}`' for op in row['allowed_operations'])} |"
        for row in access_policies
    )
    return dedent(
        f"""
        # 86 Object Storage And Retention Design

        Generated by `tools/analysis/build_object_storage_and_retention.py`.

        ## Mission

        {MISSION}

        ## Store Summary

        - Store ref: `{manifest['store_descriptor']['store_ref']}`
        - Data store ref: `{manifest['store_descriptor']['data_store_ref']}`
        - Storage classes: `{manifest['summary']['storage_class_count']}`
        - Class realizations: `{manifest['summary']['class_realization_count']}`
        - Seed fixtures: `{manifest['summary']['seed_fixture_count']}`

        ## Storage Classes

        | Storage class | Purpose | Immutability | Retention policy | Browser posture |
        | --- | --- | --- | --- | --- |
        {class_table}

        ## Environment Realizations

        | Environment | Provider baseline | Namespace | Private endpoint |
        | --- | --- | --- | --- |
        {env_table}

        ## Access Policies

        | Policy | Storage class | Service identity | Access mode | Operations |
        | --- | --- | --- | --- | --- |
        {policy_table}

        ## Retention Matrix Summary

        - Policy rows: `{len(retention_rows)}`
        - Hold-ready classes: `{manifest['summary']['hold_ready_class_count']}`
        - Governed delivery classes: `{manifest['summary']['governed_delivery_class_count']}`
        """
    ).strip()


def build_rules_doc(
    manifest: dict[str, Any],
    key_rules: dict[str, Any],
    handoff: dict[str, Any],
) -> str:
    key_table = "\n".join(
        f"| `{row['segment_ref']}` | `{row['render_template']}` | `{row['derivation']}` |"
        for row in key_rules["path_segment_rules"]
    )
    prohibited = ", ".join(f"`{item}`" for item in key_rules["prohibited_key_material"])
    hold_table = "\n".join(
        f"| `{row['storage_class_ref']}` | `{row['hold_ref']}` | `{row['visibility_authority']}` |"
        for row in manifest["storage_classes"]
    )
    return dedent(
        f"""
        # 86 Artifact Storage Classes And Visibility Rules

        ## Non-negotiable Rules

        - Quarantine, source evidence, derived artifacts, redacted presentation artifacts, outbound bundles, and recovery staging remain separate storage classes.
        - Raw and quarantined bytes are never browser-addressable.
        - Object keys are digest-based and may not embed PHI, channel identifiers, or stable public handles.
        - Visibility stays governed by `ArtifactPresentationContract`, `OutboundNavigationGrant`, or recovery posture, never by bucket paths or long-lived object URLs.
        - Retention and legal-hold changes never mutate artifact identity or checksum lineage.

        ## Object-Key Law

        | Segment | Render template | Derivation |
        | --- | --- | --- |
        {key_table}

        Prohibited key material: {prohibited}

        ## Hold And Visibility Matrix

        | Storage class | Hold ref | Visibility authority |
        | --- | --- | --- |
        {hold_table}

        ## Malware-Scan Handoff

        - Handoff ref: `{handoff['handoff_ref']}`
        - Source class: `{handoff['source_storage_class_ref']}`
        - Clean target: `{handoff['clean_target_storage_class_ref']}`
        - Blocked browser paths: `{str(handoff['blocked_browser_paths']).lower()}`
        - Required verdicts: {", ".join(f"`{item}`" for item in handoff['required_verdicts'])}
        """
    ).strip()


def build_html_bundle(
    manifest: dict[str, Any],
    retention_rows: list[dict[str, Any]],
    key_rules: dict[str, Any],
    local_policy: dict[str, Any],
    handoff: dict[str, Any],
) -> dict[str, Any]:
    return {
        "meta": {
            "taskId": TASK_ID,
            "visualMode": VISUAL_MODE,
            "generatedAt": GENERATED_AT,
            "activeEnvironmentCount": len(ENVIRONMENT_ORDER),
            "quarantinedFixtureCount": manifest["summary"]["quarantined_fixture_count"],
            "holdEnabledClassCount": manifest["summary"]["hold_ready_class_count"],
            "stalePolicyAlerts": sum(
                row["stale_policy_alert_count"] for row in manifest["environment_realizations"]
            ),
        },
        "storageClasses": manifest["storage_classes"],
        "classRealizations": manifest["class_realizations"],
        "accessPolicies": manifest["access_policies"],
        "retentionRows": retention_rows,
        "keyRules": key_rules["class_rules"],
        "pathSegmentRules": key_rules["path_segment_rules"],
        "localPolicy": local_policy,
        "handoff": handoff,
        "workloadLabels": WORKLOAD_LABELS,
        "environmentLabels": ENVIRONMENT_LABELS,
        "accentColor": ACCENT_COLOR,
        "flowOrder": FLOW_ORDER,
    }


def build_html(bundle: dict[str, Any]) -> str:
    payload = json.dumps(bundle, separators=(",", ":"))
    template = dedent(
        """
        <!doctype html>
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>86 Object Storage Retention Atlas</title>
            <style>
              :root {
                color-scheme: light;
                --canvas: #F7F9FC;
                --panel: #FFFFFF;
                --rail: #EEF2F7;
                --inset: #F4F7FB;
                --text-strong: #0F172A;
                --text-default: #1E293B;
                --text-muted: #64748B;
                --border: #E2E8F0;
                --quarantine: #C24141;
                --trusted: #2563EB;
                --derived: #0EA5A4;
                --redacted: #7C3AED;
                --ephemeral: #D97706;
                --hold: #059669;
                --radius: 22px;
                --shadow: 0 24px 72px rgba(15, 23, 42, 0.08);
              }
              * { box-sizing: border-box; }
              body {
                margin: 0;
                font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                color: var(--text-default);
                background:
                  radial-gradient(circle at top left, rgba(37, 99, 235, 0.08), transparent 26rem),
                  radial-gradient(circle at top right, rgba(124, 58, 237, 0.08), transparent 24rem),
                  var(--canvas);
              }
              body[data-reduced-motion="true"] * {
                transition-duration: 0.01ms !important;
                animation-duration: 0.01ms !important;
                scroll-behavior: auto !important;
              }
              .page {
                max-width: 1580px;
                margin: 0 auto;
                padding: 20px 24px 48px;
              }
              .masthead {
                position: sticky;
                top: 0;
                z-index: 20;
                min-height: 76px;
                display: grid;
                grid-template-columns: minmax(0, 1fr) auto;
                gap: 18px;
                align-items: center;
                padding: 18px 22px;
                margin-bottom: 18px;
                background: rgba(255, 255, 255, 0.94);
                backdrop-filter: blur(14px);
                border: 1px solid rgba(226, 232, 240, 0.92);
                border-radius: var(--radius);
                box-shadow: var(--shadow);
              }
              .brand {
                display: flex;
                align-items: center;
                gap: 14px;
              }
              .monogram {
                width: 44px;
                height: 44px;
                border-radius: 14px;
                display: grid;
                place-items: center;
                background: linear-gradient(135deg, rgba(37, 99, 235, 0.16), rgba(14, 165, 164, 0.18));
                color: var(--text-strong);
              }
              .monogram svg {
                width: 26px;
                height: 26px;
              }
              .brand-copy h1 {
                margin: 0;
                font-size: 1.08rem;
                color: var(--text-strong);
              }
              .brand-copy p {
                margin: 4px 0 0;
                color: var(--text-muted);
                font-size: 0.9rem;
              }
              .metrics {
                display: grid;
                grid-template-columns: repeat(4, minmax(0, 1fr));
                gap: 12px;
              }
              .metric {
                min-width: 132px;
                padding: 10px 12px;
                background: var(--inset);
                border: 1px solid var(--border);
                border-radius: 16px;
              }
              .metric strong {
                display: block;
                font-size: 1rem;
                color: var(--text-strong);
              }
              .metric span {
                font-size: 0.78rem;
                color: var(--text-muted);
              }
              .layout {
                display: grid;
                grid-template-columns: 324px minmax(0, 1fr) 420px;
                gap: 18px;
                align-items: start;
              }
              .panel {
                border: 1px solid var(--border);
                border-radius: var(--radius);
                background: var(--panel);
                box-shadow: var(--shadow);
              }
              .rail,
              .inspector {
                position: sticky;
                top: 92px;
              }
              .rail {
                padding: 18px;
                background: var(--rail);
              }
              .rail h2,
              .canvas h2,
              .inspector h2 {
                margin: 0;
                font-size: 0.96rem;
                color: var(--text-strong);
              }
              .filter-group {
                display: grid;
                gap: 12px;
                margin-top: 16px;
              }
              label {
                display: grid;
                gap: 6px;
                font-size: 0.82rem;
                color: var(--text-muted);
              }
              select {
                height: 44px;
                border-radius: 14px;
                border: 1px solid var(--border);
                background: var(--panel);
                color: var(--text-default);
                padding: 0 12px;
                transition: border-color 180ms ease, box-shadow 180ms ease;
              }
              select:focus-visible,
              button:focus-visible {
                outline: none;
                border-color: var(--trusted);
                box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.18);
              }
              .canvas {
                display: grid;
                gap: 18px;
              }
              .visual,
              .tables {
                padding: 20px;
              }
              .visual {
                min-height: 320px;
              }
              .visual-header,
              .tables-header {
                display: flex;
                justify-content: space-between;
                gap: 12px;
                align-items: flex-start;
                margin-bottom: 14px;
              }
              .visual-header p,
              .tables-header p,
              .inspector p {
                margin: 6px 0 0;
                font-size: 0.84rem;
                color: var(--text-muted);
              }
              .flow-grid {
                display: grid;
                grid-template-columns: repeat(3, minmax(0, 1fr));
                gap: 14px;
              }
              .flow-node {
                position: relative;
                padding: 16px;
                background: var(--inset);
                border: 1px solid var(--border);
                border-left: 6px solid var(--accent);
                border-radius: 18px;
                transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
              }
              .flow-node[data-selected="true"] {
                transform: translateY(-2px);
                border-color: var(--accent);
                box-shadow: 0 14px 36px rgba(15, 23, 42, 0.1);
              }
              .flow-node h3 {
                margin: 0 0 8px;
                font-size: 0.96rem;
                color: var(--text-strong);
              }
              .flow-node p {
                margin: 0;
                font-size: 0.82rem;
                color: var(--text-muted);
              }
              .flow-node .mono {
                display: inline-block;
                margin-top: 10px;
                font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
                font-size: 0.75rem;
              }
              .ribbon {
                display: grid;
                grid-template-columns: repeat(6, minmax(0, 1fr));
                gap: 10px;
              }
              .ribbon-step {
                padding: 12px;
                border-radius: 16px;
                background: var(--inset);
                border: 1px solid var(--border);
                border-top: 4px solid var(--accent);
              }
              .ribbon-step[data-selected="true"] {
                border-color: var(--accent);
                background: rgba(255, 255, 255, 0.92);
              }
              .matrix {
                display: grid;
                gap: 10px;
              }
              .matrix-head,
              .matrix-row {
                display: grid;
                grid-template-columns: 180px repeat(5, minmax(0, 1fr));
                gap: 8px;
              }
              .matrix-head span,
              .matrix-row span {
                padding: 10px 12px;
                border-radius: 14px;
                background: var(--inset);
                border: 1px solid var(--border);
                font-size: 0.8rem;
              }
              .matrix-row[data-selected="true"] span:first-child {
                border-color: var(--accent);
              }
              .matrix-cell[data-allowed="true"] {
                background: rgba(5, 150, 105, 0.08);
                color: var(--text-strong);
              }
              .matrix-cell[data-allowed="false"] {
                background: rgba(226, 232, 240, 0.55);
                color: var(--text-muted);
              }
              .tables {
                display: grid;
                gap: 18px;
              }
              .table-grid {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 18px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
              }
              caption {
                text-align: left;
                margin-bottom: 10px;
                font-weight: 600;
                color: var(--text-strong);
              }
              th,
              td {
                padding: 10px 12px;
                border-bottom: 1px solid var(--border);
                text-align: left;
                vertical-align: top;
                font-size: 0.8rem;
              }
              th {
                font-size: 0.72rem;
                text-transform: uppercase;
                letter-spacing: 0.04em;
                color: var(--text-muted);
              }
              .row-select {
                width: 100%;
                border: 0;
                background: transparent;
                color: inherit;
                text-align: left;
                padding: 0;
                font: inherit;
                cursor: pointer;
              }
              .row-selected td {
                background: rgba(15, 23, 42, 0.03);
              }
              .mono {
                font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
              }
              .inspector {
                padding: 20px;
              }
              .inspector-tabs {
                display: flex;
                gap: 8px;
                margin: 16px 0 18px;
              }
              .inspector-tab {
                height: 40px;
                padding: 0 14px;
                border-radius: 999px;
                border: 1px solid var(--border);
                background: var(--inset);
                color: var(--text-default);
                cursor: pointer;
                transition: transform 120ms ease, border-color 120ms ease;
              }
              .inspector-tab[data-active="true"] {
                border-color: var(--text-strong);
                background: var(--panel);
                transform: translateY(-1px);
              }
              .inspector-card {
                padding: 16px;
                border-radius: 18px;
                background: var(--inset);
                border: 1px solid var(--border);
              }
              .inspector-card dl {
                margin: 0;
                display: grid;
                gap: 10px;
              }
              .inspector-card dt {
                font-size: 0.72rem;
                text-transform: uppercase;
                letter-spacing: 0.04em;
                color: var(--text-muted);
              }
              .inspector-card dd {
                margin: 4px 0 0;
                color: var(--text-strong);
              }
              .visually-hidden {
                position: absolute;
                width: 1px;
                height: 1px;
                padding: 0;
                margin: -1px;
                overflow: hidden;
                clip: rect(0, 0, 0, 0);
                border: 0;
              }
              @media (max-width: 1280px) {
                .layout {
                  grid-template-columns: 1fr;
                }
                .rail,
                .inspector {
                  position: static;
                }
                .metrics {
                  grid-template-columns: repeat(2, minmax(0, 1fr));
                }
              }
              @media (max-width: 980px) {
                .flow-grid,
                .ribbon,
                .table-grid,
                .matrix-head,
                .matrix-row {
                  grid-template-columns: 1fr;
                }
                .masthead {
                  grid-template-columns: 1fr;
                }
              }
            </style>
          </head>
          <body>
            <div class="page">
              <header class="masthead" aria-label="Atlas masthead">
                <div class="brand">
                  <div class="monogram" aria-hidden="true">
                    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="2" y="2" width="28" height="28" rx="10" stroke="currentColor" stroke-width="1.4"/>
                      <path d="M11.3 12.2c.9-1 2.1-1.5 3.7-1.5 2.5 0 4.1 1.1 4.8 3.4h-2.6c-.4-.9-1.2-1.3-2.3-1.3-.8 0-1.5.2-2 .7-.5.5-.7 1.1-.7 1.8 0 1.8 1.4 2.8 4.1 3.2 2.8.4 4.2 1.8 4.2 4.1 0 1.3-.5 2.4-1.5 3.2-1 .8-2.3 1.2-4 1.2-2.8 0-4.6-1.1-5.6-3.4h2.8c.5.9 1.5 1.3 2.8 1.3.9 0 1.6-.2 2.1-.6.5-.4.8-.9.8-1.5 0-1-.8-1.7-2.5-2.1l-1.7-.3c-2.7-.5-4.1-1.9-4.1-4.3 0-1.2.4-2.3 1.3-3.2Z" fill="currentColor"/>
                    </svg>
                  </div>
                  <div class="brand-copy">
                    <h1>Vecells Object_Storage_Retention_Atlas</h1>
                    <p>Premium evidence-governance atlas for storage classes, retention law, and manifest-bound delivery.</p>
                  </div>
                </div>
                <div class="metrics" aria-label="Atlas metrics">
                  <div class="metric"><strong id="metric-environments">0</strong><span>Active environments</span></div>
                  <div class="metric"><strong id="metric-quarantine">0</strong><span>Quarantined-object count</span></div>
                  <div class="metric"><strong id="metric-hold">0</strong><span>Hold-enabled classes</span></div>
                  <div class="metric"><strong id="metric-alerts">0</strong><span>Stale-policy alerts</span></div>
                </div>
              </header>
              <div class="layout">
                <nav class="panel rail" aria-label="Atlas filters">
                  <h2>Filters</h2>
                  <div class="filter-group">
                    <label>Environment
                      <select id="filter-environment" data-testid="filter-environment"></select>
                    </label>
                    <label>Storage class
                      <select id="filter-class" data-testid="filter-class"></select>
                    </label>
                    <label>Retention state
                      <select id="filter-retention" data-testid="filter-retention"></select>
                    </label>
                    <label>Hold readiness
                      <select id="filter-hold" data-testid="filter-hold">
                        <option value="all">All</option>
                        <option value="ready">Hold-ready only</option>
                        <option value="not-ready">Not ready</option>
                      </select>
                    </label>
                    <label>Workload-family access
                      <select id="filter-workload" data-testid="filter-workload"></select>
                    </label>
                  </div>
                </nav>
                <main class="canvas" aria-label="Atlas canvas">
                  <section class="panel visual">
                    <div class="visual-header">
                      <div>
                        <h2>Artifact flow diagram</h2>
                        <p>Ingress, quarantine, trusted source, derived, redacted, outbound, and recovery paths stay separate and non-browser-addressable by default.</p>
                      </div>
                    </div>
                    <div class="flow-grid" data-testid="flow-diagram" id="flow-diagram"></div>
                    <p id="flow-parity">No selection.</p>
                  </section>
                  <section class="panel visual">
                    <div class="visual-header">
                      <div>
                        <h2>Retention lifecycle ribbon</h2>
                        <p>Each class carries a version-controlled retention state and hold-ready posture that survive provider cutover.</p>
                      </div>
                    </div>
                    <div class="ribbon" data-testid="lifecycle-ribbon" id="lifecycle-ribbon"></div>
                    <p id="ribbon-parity">No lifecycle selected.</p>
                  </section>
                  <section class="panel visual">
                    <div class="visual-header">
                      <div>
                        <h2>Access policy matrix</h2>
                        <p>Only published workload identities may touch storage classes, and browser surfaces can deliver only through governed contracts.</p>
                      </div>
                    </div>
                    <div class="matrix" data-testid="access-matrix" id="access-matrix"></div>
                    <p id="matrix-parity">Matrix parity pending.</p>
                  </section>
                  <section class="panel tables">
                    <div class="tables-header">
                      <div>
                        <h2>Manifest and retention tables</h2>
                        <p>Every visual has an adjacent textual fallback with deterministic row anchors.</p>
                      </div>
                    </div>
                    <div class="table-grid">
                      <div>
                        <table data-testid="manifest-table">
                          <caption>Storage class manifest</caption>
                          <thead>
                            <tr>
                              <th>Class</th>
                              <th>Immutability</th>
                              <th>Browser posture</th>
                            </tr>
                          </thead>
                          <tbody id="manifest-body"></tbody>
                        </table>
                      </div>
                      <div>
                        <table data-testid="retention-table">
                          <caption>Retention and access policy table</caption>
                          <thead>
                            <tr>
                              <th>Class</th>
                              <th>Environment</th>
                              <th>Retention</th>
                              <th>Hold</th>
                            </tr>
                          </thead>
                          <tbody id="retention-body"></tbody>
                        </table>
                      </div>
                    </div>
                  </section>
                </main>
                <aside class="panel inspector" aria-label="Inspector" data-testid="inspector">
                  <h2>Inspector</h2>
                  <p>Selected storage class, retention law, manifest rule, and delivery posture.</p>
                  <div class="inspector-tabs" role="tablist" aria-label="Inspector tabs">
                    <button class="inspector-tab" data-tab="summary" data-active="true" role="tab" aria-selected="true">Summary</button>
                    <button class="inspector-tab" data-tab="policy" data-active="false" role="tab" aria-selected="false">Policy</button>
                    <button class="inspector-tab" data-tab="keys" data-active="false" role="tab" aria-selected="false">Keys</button>
                  </div>
                  <div class="inspector-card" id="inspector-card"></div>
                </aside>
              </div>
            </div>
            <script>
              const payload = __PAYLOAD__;
              const workloadColumns = [
                "wf_command_orchestration",
                "wf_projection_read_models",
                "wf_integration_dispatch",
                "wf_shell_delivery_published_gateway",
                "wf_assurance_security_control",
              ];
              const state = {
                environment: "local",
                storageClass: "all",
                retentionState: "all",
                hold: "all",
                workload: "all",
                selectedClassRef: "quarantine_raw",
                selectedPolicyRef: "local_quarantine_raw",
                inspectorTab: "summary",
              };

              const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
              document.body.dataset.reducedMotion = String(prefersReducedMotion.matches);
              prefersReducedMotion.addEventListener("change", (event) => {
                document.body.dataset.reducedMotion = String(event.matches);
              });

              const metricEnvironments = document.getElementById("metric-environments");
              const metricQuarantine = document.getElementById("metric-quarantine");
              const metricHold = document.getElementById("metric-hold");
              const metricAlerts = document.getElementById("metric-alerts");
              const flowDiagram = document.getElementById("flow-diagram");
              const lifecycleRibbon = document.getElementById("lifecycle-ribbon");
              const accessMatrix = document.getElementById("access-matrix");
              const manifestBody = document.getElementById("manifest-body");
              const retentionBody = document.getElementById("retention-body");
              const inspectorCard = document.getElementById("inspector-card");
              const flowParity = document.getElementById("flow-parity");
              const ribbonParity = document.getElementById("ribbon-parity");
              const matrixParity = document.getElementById("matrix-parity");

              const filterEnvironment = document.getElementById("filter-environment");
              const filterClass = document.getElementById("filter-class");
              const filterRetention = document.getElementById("filter-retention");
              const filterHold = document.getElementById("filter-hold");
              const filterWorkload = document.getElementById("filter-workload");

              function setOptions(select, options, current) {
                select.innerHTML = options
                  .map((option) => `<option value="${option.value}" ${option.value === current ? "selected" : ""}>${option.label}</option>`)
                  .join("");
              }

              function getClassByRef(storageClassRef) {
                return payload.storageClasses.find((row) => row.storage_class_ref === storageClassRef);
              }

              function getSelectedRetentionRow() {
                const match = filteredRetentionRows().find(
                  (row) =>
                    `${row.environment_ring}_${row.storage_class_ref}` === state.selectedPolicyRef,
                );
                return match ?? filteredRetentionRows()[0] ?? null;
              }

              function filteredClasses() {
                return payload.storageClasses.filter((row) => {
                  if (state.storageClass !== "all" && row.storage_class_ref !== state.storageClass) {
                    return false;
                  }
                  if (state.retentionState !== "all" && row.retention_state !== state.retentionState) {
                    return false;
                  }
                  if (state.hold === "ready" && !row.legal_hold_ready) {
                    return false;
                  }
                  if (state.hold === "not-ready" && row.legal_hold_ready) {
                    return false;
                  }
                  if (
                    state.workload !== "all" &&
                    !row.workload_family_refs.includes(state.workload)
                  ) {
                    return false;
                  }
                  return true;
                });
              }

              function filteredRetentionRows() {
                return payload.retentionRows.filter((row) => {
                  if (row.environment_ring !== state.environment) {
                    return false;
                  }
                  if (state.storageClass !== "all" && row.storage_class_ref !== state.storageClass) {
                    return false;
                  }
                  if (state.retentionState !== "all" && row.retention_state !== state.retentionState) {
                    return false;
                  }
                  const classRecord = getClassByRef(row.storage_class_ref);
                  if (state.hold === "ready" && !classRecord.legal_hold_ready) {
                    return false;
                  }
                  if (state.hold === "not-ready" && classRecord.legal_hold_ready) {
                    return false;
                  }
                  if (
                    state.workload !== "all" &&
                    !classRecord.workload_family_refs.includes(state.workload)
                  ) {
                    return false;
                  }
                  return true;
                });
              }

              function ensureSelection() {
                const classes = filteredClasses();
                if (!classes.some((row) => row.storage_class_ref === state.selectedClassRef)) {
                  state.selectedClassRef = classes[0]?.storage_class_ref ?? null;
                }
                const rows = filteredRetentionRows();
                if (
                  !rows.some(
                    (row) =>
                      `${row.environment_ring}_${row.storage_class_ref}` === state.selectedPolicyRef,
                  )
                ) {
                  state.selectedPolicyRef = rows[0]
                    ? `${rows[0].environment_ring}_${rows[0].storage_class_ref}`
                    : null;
                }
              }

              function onRowKeydown(event, rows, currentRef, toRef) {
                if (event.key !== "ArrowDown" && event.key !== "ArrowUp") {
                  return;
                }
                event.preventDefault();
                const index = rows.findIndex((row) => toRef(row) === currentRef);
                const nextIndex =
                  event.key === "ArrowDown"
                    ? Math.min(index + 1, rows.length - 1)
                    : Math.max(index - 1, 0);
                const next = rows[nextIndex];
                if (!next) {
                  return;
                }
                state.selectedClassRef = next.storage_class_ref;
                state.selectedPolicyRef = `${state.environment}_${next.storage_class_ref}`;
                render();
                const button = document.querySelector(
                  `[data-focus-ref="${next.storage_class_ref}"]`,
                );
                button?.focus();
              }

              function renderFlow() {
                flowDiagram.innerHTML = payload.storageClasses
                  .filter((row) => filteredClasses().some((item) => item.storage_class_ref === row.storage_class_ref))
                  .map((row) => {
                    const accent = payload.accentColor[row.accent_ref];
                    return `
                      <div
                        class="flow-node"
                        data-testid="flow-node-${row.storage_class_ref}"
                        data-selected="${String(row.storage_class_ref === state.selectedClassRef)}"
                        data-accent="${row.accent_ref}"
                        style="--accent:${accent}"
                      >
                        <h3>${row.display_name}</h3>
                        <p>${row.purpose}</p>
                        <span class="mono">${row.retention_policy_ref}</span>
                      </div>
                    `;
                  })
                  .join("");
                const selected = getClassByRef(state.selectedClassRef);
                flowParity.textContent = selected
                  ? `${selected.display_name} routes through ${selected.browser_delivery_posture} and ${selected.visibility_authority}.`
                  : "No selection.";
              }

              function renderRibbon() {
                lifecycleRibbon.innerHTML = payload.flowOrder.filter((storageClassRef) =>
                  filteredClasses().some((row) => row.storage_class_ref === storageClassRef),
                )
                  .map((storageClassRef) => {
                    const row = getClassByRef(storageClassRef);
                    const accent = payload.accentColor[row.accent_ref];
                    return `
                      <div
                        class="ribbon-step"
                        data-testid="lifecycle-step-${row.storage_class_ref}"
                        data-selected="${String(row.storage_class_ref === state.selectedClassRef)}"
                        style="--accent:${accent}"
                      >
                        <strong>${row.display_name}</strong>
                        <div class="mono">${row.retention_state}</div>
                      </div>
                    `;
                  })
                  .join("");
                const selectedRow = getSelectedRetentionRow();
                ribbonParity.textContent = selectedRow
                  ? `${payload.environmentLabels[selectedRow.environment_ring]} keeps ${selectedRow.storage_class_ref} for ${selectedRow.default_retention_days} days with ${selectedRow.purge_mode}.`
                  : "No lifecycle selected.";
              }

              function renderMatrix() {
                const header = `
                  <div class="matrix-head">
                    <span>Storage class</span>
                    ${workloadColumns.map((column) => `<span>${payload.workloadLabels[column]}</span>`).join("")}
                  </div>
                `;
                const rows = filteredClasses()
                  .map((row) => {
                    const accent = payload.accentColor[row.accent_ref];
                    const cells = workloadColumns
                      .map((column) => {
                        const allowed = row.workload_family_refs.includes(column);
                        return `<span class="matrix-cell" data-allowed="${String(allowed)}">${allowed ? "Allowed" : "Blocked"}</span>`;
                      })
                      .join("");
                    return `
                      <div
                        class="matrix-row"
                        data-testid="matrix-row-${row.storage_class_ref}"
                        data-selected="${String(row.storage_class_ref === state.selectedClassRef)}"
                        style="--accent:${accent}"
                      >
                        <span>${row.display_name}</span>
                        ${cells}
                      </div>
                    `;
                  })
                  .join("");
                accessMatrix.innerHTML = header + rows;
                const selected = getClassByRef(state.selectedClassRef);
                matrixParity.textContent = selected
                  ? `${selected.display_name} allows ${selected.workload_family_refs.length} workload families and forbids direct browser paths.`
                  : "Matrix parity pending.";
              }

              function renderManifestTable() {
                const classes = filteredClasses();
                manifestBody.innerHTML = classes
                  .map((row) => {
                    const selected = row.storage_class_ref === state.selectedClassRef;
                    return `
                      <tr
                        class="${selected ? "row-selected" : ""}"
                        data-testid="manifest-row-${row.storage_class_ref}"
                      >
                        <td>
                          <button
                            class="row-select"
                            data-focus-ref="${row.storage_class_ref}"
                            aria-label="Select ${row.display_name}"
                            onkeydown="void(0)"
                          >${row.display_name}</button>
                        </td>
                        <td class="mono">${row.immutability_mode}</td>
                        <td>${row.browser_delivery_posture}</td>
                      </tr>
                    `;
                  })
                  .join("");
                Array.from(manifestBody.querySelectorAll(".row-select")).forEach((button, index) => {
                  const row = classes[index];
                  button.addEventListener("click", () => {
                    state.selectedClassRef = row.storage_class_ref;
                    state.selectedPolicyRef = `${state.environment}_${row.storage_class_ref}`;
                    state.inspectorTab = "summary";
                    render();
                  });
                  button.addEventListener("keydown", (event) =>
                    onRowKeydown(
                      event,
                      classes,
                      row.storage_class_ref,
                      (item) => item.storage_class_ref,
                    ),
                  );
                });
              }

              function renderRetentionTable() {
                const rows = filteredRetentionRows();
                retentionBody.innerHTML = rows
                  .map((row) => {
                    const key = `${row.environment_ring}_${row.storage_class_ref}`;
                    const selected = key === state.selectedPolicyRef;
                    return `
                      <tr
                        class="${selected ? "row-selected" : ""}"
                        data-testid="policy-row-${row.environment_ring}-${row.storage_class_ref}"
                      >
                        <td>
                          <button class="row-select" data-policy-ref="${key}">
                            ${getClassByRef(row.storage_class_ref).display_name}
                          </button>
                        </td>
                        <td>${payload.environmentLabels[row.environment_ring]}</td>
                        <td class="mono">${row.default_retention_days}d</td>
                        <td>${row.legal_hold_ready}</td>
                      </tr>
                    `;
                  })
                  .join("");
                Array.from(retentionBody.querySelectorAll(".row-select")).forEach((button, index) => {
                  const row = rows[index];
                  const key = `${row.environment_ring}_${row.storage_class_ref}`;
                  button.addEventListener("click", () => {
                    state.selectedPolicyRef = key;
                    state.selectedClassRef = row.storage_class_ref;
                    state.inspectorTab = "policy";
                    render();
                  });
                  button.addEventListener("keydown", (event) =>
                    onRowKeydown(event, rows, key, (item) => `${item.environment_ring}_${item.storage_class_ref}`),
                  );
                });
              }

              function renderInspector() {
                const selected = getClassByRef(state.selectedClassRef);
                const selectedPolicy = getSelectedRetentionRow();
                const keyRule = payload.keyRules.find(
                  (row) => row.storage_class_ref === state.selectedClassRef,
                );
                const tabs = Array.from(document.querySelectorAll(".inspector-tab"));
                tabs.forEach((button) => {
                  const active = button.dataset.tab === state.inspectorTab;
                  button.dataset.active = String(active);
                  button.setAttribute("aria-selected", String(active));
                });
                if (!selected || !selectedPolicy) {
                  inspectorCard.innerHTML = "<p>No filtered storage class is available.</p>";
                  return;
                }
                if (state.inspectorTab === "summary") {
                  inspectorCard.innerHTML = `
                    <dl>
                      <div><dt>Storage class</dt><dd>${selected.display_name}</dd></div>
                      <div><dt>Purpose</dt><dd>${selected.purpose}</dd></div>
                      <div><dt>Browser posture</dt><dd>${selected.browser_delivery_posture}</dd></div>
                      <div><dt>Allowed identities</dt><dd class="mono">${selected.service_identity_refs.join(", ")}</dd></div>
                    </dl>
                  `;
                } else if (state.inspectorTab === "policy") {
                  inspectorCard.innerHTML = `
                    <dl>
                      <div><dt>Retention policy</dt><dd class="mono">${selectedPolicy.retention_policy_ref}</dd></div>
                      <div><dt>Retention days</dt><dd>${selectedPolicy.default_retention_days}</dd></div>
                      <div><dt>Hold-ready</dt><dd>${selectedPolicy.legal_hold_ready}</dd></div>
                      <div><dt>Purge mode</dt><dd>${selectedPolicy.purge_mode}</dd></div>
                    </dl>
                  `;
                } else {
                  inspectorCard.innerHTML = `
                    <dl>
                      <div><dt>Manifest rule</dt><dd class="mono">${selected.manifest_rule_ref}</dd></div>
                      <div><dt>Sample key</dt><dd class="mono">${keyRule?.sample_key ?? "n/a"}</dd></div>
                      <div><dt>Signed access</dt><dd>${keyRule?.signed_access_pattern ?? "n/a"}</dd></div>
                      <div><dt>Visibility authority</dt><dd>${selected.visibility_authority}</dd></div>
                    </dl>
                  `;
                }
              }

              function renderMetrics() {
                metricEnvironments.textContent = String(payload.meta.activeEnvironmentCount);
                metricQuarantine.textContent = String(payload.meta.quarantinedFixtureCount);
                metricHold.textContent = String(payload.meta.holdEnabledClassCount);
                const currentEnv = payload.classRealizations.filter(
                  (row) => row.environment_ring === state.environment,
                );
                metricAlerts.textContent = String(
                  payload.meta.stalePolicyAlerts +
                    currentEnv.filter((row) => row.browser_delivery_posture === "forbidden").length * 0,
                );
              }

              function render() {
                ensureSelection();
                renderMetrics();
                renderFlow();
                renderRibbon();
                renderMatrix();
                renderManifestTable();
                renderRetentionTable();
                renderInspector();
              }

              function installInspectorTabs() {
                Array.from(document.querySelectorAll(".inspector-tab")).forEach((button) => {
                  button.addEventListener("click", () => {
                    state.inspectorTab = button.dataset.tab;
                    render();
                  });
                  button.addEventListener("keydown", (event) => {
                    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") {
                      return;
                    }
                    event.preventDefault();
                    const tabs = ["summary", "policy", "keys"];
                    const index = tabs.indexOf(state.inspectorTab);
                    const nextIndex =
                      event.key === "ArrowRight"
                        ? Math.min(index + 1, tabs.length - 1)
                        : Math.max(index - 1, 0);
                    state.inspectorTab = tabs[nextIndex];
                    render();
                    document.querySelector(`[data-tab="${state.inspectorTab}"]`)?.focus();
                  });
                });
              }

              function installFilters() {
                setOptions(
                  filterEnvironment,
                  ENVIRONMENT_OPTIONS,
                  state.environment,
                );
                setOptions(filterClass, CLASS_OPTIONS, state.storageClass);
                setOptions(filterRetention, RETENTION_OPTIONS, state.retentionState);
                setOptions(filterWorkload, WORKLOAD_OPTIONS, state.workload);
                filterEnvironment.addEventListener("change", (event) => {
                  state.environment = event.target.value;
                  state.selectedPolicyRef = `${state.environment}_${state.selectedClassRef}`;
                  render();
                });
                filterClass.addEventListener("change", (event) => {
                  state.storageClass = event.target.value;
                  render();
                });
                filterRetention.addEventListener("change", (event) => {
                  state.retentionState = event.target.value;
                  render();
                });
                filterHold.addEventListener("change", (event) => {
                  state.hold = event.target.value;
                  render();
                });
                filterWorkload.addEventListener("change", (event) => {
                  state.workload = event.target.value;
                  render();
                });
              }

              const ENVIRONMENT_OPTIONS = [
                { value: "local", label: "Local" },
                { value: "ci-preview", label: "CI preview" },
                { value: "integration", label: "Integration" },
                { value: "preprod", label: "Preprod" },
                { value: "production", label: "Production" },
              ];
              const CLASS_OPTIONS = [
                { value: "all", label: "All classes" },
                ...payload.storageClasses.map((row) => ({
                  value: row.storage_class_ref,
                  label: row.display_name,
                })),
              ];
              const RETENTION_OPTIONS = [
                { value: "all", label: "All retention states" },
                ...Array.from(new Set(payload.storageClasses.map((row) => row.retention_state))).map(
                  (value) => ({ value, label: value }),
                ),
              ];
              const WORKLOAD_OPTIONS = [
                { value: "all", label: "All workload families" },
                ...Object.entries(payload.workloadLabels).map(([value, label]) => ({ value, label })),
              ];

              installInspectorTabs();
              installFilters();
              render();
            </script>
          </body>
        </html>
        """
    ).strip()
    return template.replace("__PAYLOAD__", payload)


def build_playwright_spec() -> str:
    return dedent(
        """
        import fs from "node:fs";
        import http from "node:http";
        import path from "node:path";
        import { fileURLToPath } from "node:url";

        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const ROOT = path.resolve(__dirname, "..", "..");
        const HTML_PATH = path.join(
          ROOT,
          "docs",
          "architecture",
          "86_object_storage_retention_atlas.html",
        );
        const MANIFEST_PATH = path.join(
          ROOT,
          "data",
          "analysis",
          "object_storage_class_manifest.json",
        );
        const MATRIX_PATH = path.join(
          ROOT,
          "data",
          "analysis",
          "object_retention_policy_matrix.csv",
        );

        export const objectStorageRetentionAtlasCoverage = [
          "filter behavior and synchronized selection",
          "keyboard navigation and focus management",
          "reduced-motion handling",
          "responsive layout at desktop and tablet widths",
          "accessibility smoke checks and landmark verification",
          "verification that quarantine and trusted classes are visually and semantically distinct",
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

        function startStaticServer() {
          return new Promise((resolve, reject) => {
            const server = http.createServer((request, response) => {
              const rawUrl = request.url ?? "/";
              const urlPath =
                rawUrl === "/"
                  ? "/docs/architecture/86_object_storage_retention_atlas.html"
                  : rawUrl.split("?")[0];
              const filePath = path.join(ROOT, decodeURIComponent(urlPath).replace(/^\\/+/, ""));
              if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath)) {
                response.writeHead(404);
                response.end("Not found");
                return;
              }
              const body = fs.readFileSync(filePath);
              const contentType = filePath.endsWith(".html")
                ? "text/html; charset=utf-8"
                : filePath.endsWith(".json")
                  ? "application/json; charset=utf-8"
                  : filePath.endsWith(".csv")
                    ? "text/csv; charset=utf-8"
                    : "text/plain; charset=utf-8";
              response.writeHead(200, { "Content-Type": contentType });
              response.end(body);
            });
            server.once("error", reject);
            server.listen(4386, "127.0.0.1", () => resolve(server));
          });
        }

        async function run() {
          assertCondition(fs.existsSync(HTML_PATH), `Missing object storage atlas HTML: ${HTML_PATH}`);
          const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
          const matrix = parseCsv(fs.readFileSync(MATRIX_PATH, "utf8"));
          assertCondition(manifest.summary.storage_class_count === 6, "Storage class count drifted.");
          assertCondition(matrix.length === 30, "Retention matrix row count drifted.");

          const { chromium } = await importPlaywright();
          const server = await startStaticServer();
          const browser = await chromium.launch({ headless: true });
          const context = await browser.newContext({
            viewport: { width: 1480, height: 1100 },
            reducedMotion: "reduce",
          });
          const page = await context.newPage();
          const url =
            process.env.OBJECT_STORAGE_RETENTION_ATLAS_URL ??
            "http://127.0.0.1:4386/docs/architecture/86_object_storage_retention_atlas.html";

          try {
            await page.goto(url, { waitUntil: "networkidle" });
            await page.locator("[data-testid='flow-diagram']").waitFor();
            await page.locator("[data-testid='lifecycle-ribbon']").waitFor();
            await page.locator("[data-testid='access-matrix']").waitFor();
            await page.locator("[data-testid='manifest-table']").waitFor();
            await page.locator("[data-testid='retention-table']").waitFor();
            await page.locator("[data-testid='inspector']").waitFor();

            const landmarks = await Promise.all([
              page.locator("header[aria-label='Atlas masthead']").count(),
              page.locator("nav[aria-label='Atlas filters']").count(),
              page.locator("main[aria-label='Atlas canvas']").count(),
              page.locator("aside[aria-label='Inspector']").count(),
            ]);
            assertCondition(landmarks.every((count) => count === 1), "Landmark contract drifted.");

            assertCondition(
              (await page.locator("[data-testid^='manifest-row-']").count()) === 6,
              "Expected 6 manifest rows on initial render.",
            );
            assertCondition(
              (await page.locator("[data-testid^='policy-row-local-']").count()) === 6,
              "Expected 6 local policy rows on initial render.",
            );

            await page.locator("[data-testid='filter-environment']").selectOption("production");
            await page
              .locator("[data-testid='filter-workload']")
              .selectOption("wf_shell_delivery_published_gateway");
            assertCondition(
              (await page.locator("[data-testid^='manifest-row-']").count()) === 2,
              "Expected 2 classes for published gateway access.",
            );

            await page
              .locator("[data-testid='filter-retention']")
              .selectOption("governed_presentation_retention");
            assertCondition(
              (await page.locator("[data-testid^='manifest-row-']").count()) === 1,
              "Expected 1 governed presentation class.",
            );

            await page
              .locator("[data-testid='policy-row-production-redacted_presentation'] .row-select")
              .click();
            const inspectorText = await page.locator("[data-testid='inspector']").innerText();
            assertCondition(
              inspectorText.includes("ret_086_redacted_presentation"),
              "Inspector lost retention policy detail.",
            );

            await page.locator("[data-testid='filter-retention']").selectOption("all");
            await page.locator("[data-testid='filter-class']").selectOption("all");
            const firstButton = page.locator("[data-focus-ref='redacted_presentation']");
            await firstButton.focus();
            await page.keyboard.press("ArrowDown");
            const activeText = await page.evaluate(() => document.activeElement?.textContent ?? "");
            assertCondition(
              activeText.includes("Outbound ephemeral"),
              "ArrowDown should move focus to the next visible class row.",
            );

            const reducedMotion = await page.locator("body").getAttribute("data-reduced-motion");
            assertCondition(reducedMotion === "true", "Reduced motion state was not reflected in the DOM.");

            await page.locator("[data-testid='filter-workload']").selectOption("all");
            const quarantineAccent = await page
              .locator("[data-testid='flow-node-quarantine_raw']")
              .getAttribute("data-accent");
            const trustedAccent = await page
              .locator("[data-testid='flow-node-evidence_source_immutable']")
              .getAttribute("data-accent");
            assertCondition(
              quarantineAccent !== trustedAccent,
              "Quarantine and trusted classes must remain visually distinct.",
            );

            await page.setViewportSize({ width: 960, height: 1100 });
            assertCondition(
              (await page.locator("[data-testid='inspector']").isVisible()) === true,
              "Inspector should remain visible at tablet width.",
            );
          } finally {
            await page.close();
            await context.close();
            await browser.close();
            await new Promise((resolve, reject) => {
              server.close((error) => {
                if (error) {
                  reject(error);
                  return;
                }
                resolve();
              });
            });
          }
        }

        if (process.argv.includes("--run")) {
          run()
            .then(() => {
              process.exit(0);
            })
            .catch((error) => {
              console.error(error);
              process.exit(1);
            });
        } else {
          assertCondition(fs.existsSync(HTML_PATH), "Atlas HTML is missing.");
          assertCondition(fs.existsSync(MANIFEST_PATH), "Object storage manifest is missing.");
          assertCondition(fs.existsSync(MATRIX_PATH), "Retention matrix is missing.");
        }
        """
    ).strip()


def build_readme() -> str:
    return dedent(
        """
        # Object Storage Foundation

        This directory contains the provider-neutral Phase 0 object-storage baseline for `par_086`.

        - `terraform/` publishes the object-storage namespace and the six governed storage-class buckets.
        - `bootstrap/` contains the deterministic seed catalog used by local and CI bootstrap flows.
        - `local/` mirrors the same storage taxonomy for developer and CI use, including the emulator compose file, malware-scan handoff seam, and reset-safe seeding script.
        - `tests/` contains smoke checks that fail when quarantine, retention, key law, or browser blocking drift.
        """
    ).strip()


def build_terraform_main() -> str:
    return dedent(
        """
        terraform {
          required_version = ">= 1.6.0"
        }

        locals {
          topology_manifest = jsondecode(file("${path.module}/../../data/analysis/runtime_topology_manifest.json"))
          class_manifest    = jsondecode(file("${path.module}/../../data/analysis/object_storage_class_manifest.json"))
          key_rules         = jsondecode(file("${path.module}/../../data/analysis/object_key_manifest_rules.json"))
          retention_rows    = csvdecode(file("${path.module}/../../data/analysis/object_retention_policy_matrix.csv"))
          environment_realization = one([
            for row in local.class_manifest.environment_realizations : row
            if row.environment_ring == var.environment
          ])
          class_realizations = [
            for row in local.class_manifest.class_realizations : row
            if row.environment_ring == var.environment
          ]
        }

        module "object_storage_namespace" {
          source               = "./modules/object_storage_namespace"
          environment          = var.environment
          namespace_id         = local.environment_realization.namespace_id
          private_endpoint_ref = local.environment_realization.private_endpoint_ref
          kms_mode             = local.environment_realization.kms_mode
        }

        module "storage_class_buckets" {
          source               = "./modules/storage_class_bucket"
          for_each             = { for row in local.class_realizations : row.storage_class_ref => row }
          environment          = var.environment
          namespace_id         = local.environment_realization.namespace_id
          bucket_name          = each.value.bucket_name
          storage_class_ref    = each.value.storage_class_ref
          retention_policy_ref = each.value.retention_policy_ref
          default_retention_days = each.value.default_retention_days
          legal_hold_ready     = each.value.legal_hold_ready
          browser_delivery_posture = each.value.browser_delivery_posture
          manifest_rule_ref    = each.value.manifest_rule_ref
          private_endpoint_ref = each.value.private_endpoint_ref
          service_identity_refs = each.value.service_identity_refs
        }
        """
    ).strip()


def build_terraform_variables() -> str:
    return dedent(
        """
        variable "environment" {
          type = string
          validation {
            condition     = contains(["local", "ci-preview", "integration", "preprod", "production"], var.environment)
            error_message = "environment must be one of local, ci-preview, integration, preprod, or production"
          }
        }
        """
    ).strip()


def build_terraform_outputs() -> str:
    return dedent(
        """
        output "namespace_plan" {
          value = module.object_storage_namespace.namespace_plan
        }

        output "bucket_plans" {
          value = {
            for storage_class_ref, module_ref in module.storage_class_buckets :
            storage_class_ref => module_ref.bucket_plan
          }
        }
        """
    ).strip()


def build_namespace_module_main() -> str:
    return dedent(
        """
        locals {
          namespace_plan = {
            namespace_id         = var.namespace_id
            environment          = var.environment
            private_endpoint_ref = var.private_endpoint_ref
            kms_mode             = var.kms_mode
            public_access        = "forbidden"
          }
        }
        """
    ).strip()


def build_namespace_module_variables() -> str:
    return dedent(
        """
        variable "environment" { type = string }
        variable "namespace_id" { type = string }
        variable "private_endpoint_ref" { type = string }
        variable "kms_mode" { type = string }
        """
    ).strip()


def build_namespace_module_outputs() -> str:
    return dedent(
        """
        output "namespace_plan" {
          value = local.namespace_plan
        }
        """
    ).strip()


def build_class_module_main() -> str:
    return dedent(
        """
        locals {
          bucket_plan = {
            environment               = var.environment
            namespace_id              = var.namespace_id
            bucket_name               = var.bucket_name
            storage_class_ref         = var.storage_class_ref
            retention_policy_ref      = var.retention_policy_ref
            default_retention_days    = var.default_retention_days
            legal_hold_ready          = var.legal_hold_ready
            browser_delivery_posture  = var.browser_delivery_posture
            manifest_rule_ref         = var.manifest_rule_ref
            private_endpoint_ref      = var.private_endpoint_ref
            service_identity_refs     = var.service_identity_refs
            public_bucket             = false
          }
        }
        """
    ).strip()


def build_class_module_variables() -> str:
    return dedent(
        """
        variable "environment" { type = string }
        variable "namespace_id" { type = string }
        variable "bucket_name" { type = string }
        variable "storage_class_ref" { type = string }
        variable "retention_policy_ref" { type = string }
        variable "default_retention_days" { type = number }
        variable "legal_hold_ready" { type = bool }
        variable "browser_delivery_posture" { type = string }
        variable "manifest_rule_ref" { type = string }
        variable "private_endpoint_ref" { type = string }
        variable "service_identity_refs" { type = list(string) }
        """
    ).strip()


def build_class_module_outputs() -> str:
    return dedent(
        """
        output "bucket_plan" {
          value = local.bucket_plan
        }
        """
    ).strip()


def build_environment_tfvars(environment_ring: str) -> dict[str, Any]:
    definition = ENVIRONMENT_DEFINITIONS[environment_ring]
    return {
        "environment": environment_ring,
        "namespace_id": definition["namespace_id"],
        "provider_baseline": definition["provider_baseline"],
        "private_endpoint_ref": definition["private_endpoint_ref"],
        "kms_mode": definition["kms_mode"],
    }


def build_local_compose() -> str:
    return dedent(
        """
        services:
          artifact-store:
            image: minio/minio:RELEASE.2025-02-07T23-21-09Z
            container_name: vecells-object-storage-local
            command: server /data --console-address ":9001"
            environment:
              MINIO_ROOT_USER: vecells
              MINIO_ROOT_PASSWORD: vecellsminio
            ports:
              - "9000:9000"
              - "9001:9001"
            networks:
              - stateful_data
            volumes:
              - artifact_store:/data

        volumes:
          artifact_store: {}

        networks:
          stateful_data:
            internal: true
        """
    ).strip()


def build_local_bootstrap_script() -> str:
    return dedent(
        """
        import fs from "node:fs";
        import path from "node:path";
        import { fileURLToPath } from "node:url";

        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const ROOT = path.resolve(__dirname, "..", "..", "..");
        const catalog = JSON.parse(
          fs.readFileSync(
            path.join(ROOT, "infra", "object-storage", "bootstrap", "object-storage-seed-catalog.json"),
            "utf8",
          ),
        );
        const manifest = JSON.parse(
          fs.readFileSync(path.join(ROOT, "data", "analysis", "object_storage_class_manifest.json"), "utf8"),
        );

        const plan = {
          taskId: "par_086",
          mode: "Object_Storage_Retention_Atlas",
          storageClasses: manifest.storage_classes.map((row) => ({
            storageClassRef: row.storage_class_ref,
            manifestRuleRef: row.manifest_rule_ref,
            browserDeliveryPosture: row.browser_delivery_posture,
          })),
          fixtures: catalog,
        };

        function emitPlan() {
          process.stdout.write(JSON.stringify(plan, null, 2));
          process.stdout.write("\\n");
        }

        function ensureEmptyDirectory(targetPath) {
          fs.rmSync(targetPath, { recursive: true, force: true });
          fs.mkdirSync(targetPath, { recursive: true });
        }

        function writeFixture(seedDir, fixture) {
          const objectPath = path.join(seedDir, fixture.storage_class_ref, fixture.object_key);
          fs.mkdirSync(path.dirname(objectPath), { recursive: true });
          const bytes = Buffer.from(`${fixture.fixture_ref}:${fixture.payload_sha256}`, "utf8");
          fs.writeFileSync(objectPath, bytes);
          fs.writeFileSync(
            `${objectPath}.manifest.json`,
            JSON.stringify(
              {
                fixtureRef: fixture.fixture_ref,
                storageClassRef: fixture.storage_class_ref,
                governingObjectRef: fixture.governing_object_ref,
                artifactRef: fixture.artifact_ref,
                tenantScopeDigest: fixture.tenant_scope_digest,
                lineageScopeDigest: fixture.lineage_scope_digest,
                payloadSha256: fixture.payload_sha256,
                sampleManifestRef: fixture.sample_manifest_ref,
              },
              null,
              2,
            ) + "\\n",
            "utf8",
          );
        }

        if (process.argv.includes("--emit-plan")) {
          const index = process.argv.indexOf("--emit-plan");
          const outputPath = process.argv[index + 1];
          if (!outputPath) {
            throw new Error("Missing path after --emit-plan");
          }
          fs.writeFileSync(outputPath, JSON.stringify(plan, null, 2) + "\\n", "utf8");
        }

        if (process.argv.includes("--seed-dir")) {
          const index = process.argv.indexOf("--seed-dir");
          const seedDir = process.argv[index + 1];
          if (!seedDir) {
            throw new Error("Missing path after --seed-dir");
          }
          ensureEmptyDirectory(seedDir);
          for (const fixture of catalog) {
            writeFixture(seedDir, fixture);
          }
        }

        if (process.argv.includes("--dry-run") || !process.argv.includes("--seed-dir")) {
          emitPlan();
        }
        """
    ).strip()


def build_smoke_test() -> str:
    return dedent(
        """
        import assert from "node:assert/strict";
        import fs from "node:fs";
        import os from "node:os";
        import path from "node:path";
        import test from "node:test";
        import { spawnSync } from "node:child_process";
        import { fileURLToPath } from "node:url";

        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const ROOT = path.resolve(__dirname, "..", "..", "..");

        const runtimeTopology = JSON.parse(
          fs.readFileSync(path.join(ROOT, "data", "analysis", "runtime_topology_manifest.json"), "utf8"),
        );
        const manifest = JSON.parse(
          fs.readFileSync(path.join(ROOT, "data", "analysis", "object_storage_class_manifest.json"), "utf8"),
        );
        const keyRules = JSON.parse(
          fs.readFileSync(path.join(ROOT, "data", "analysis", "object_key_manifest_rules.json"), "utf8"),
        );
        const localPolicy = JSON.parse(
          fs.readFileSync(path.join(ROOT, "infra", "object-storage", "local", "object-storage-policy.json"), "utf8"),
        );
        const scanHandoff = JSON.parse(
          fs.readFileSync(path.join(ROOT, "infra", "object-storage", "local", "malware-scan-handoff.json"), "utf8"),
        );

        test("runtime topology binds the object storage manifests", () => {
          assert.equal(
            runtimeTopology.object_storage_class_manifest_ref,
            "data/analysis/object_storage_class_manifest.json",
          );
          assert.equal(
            runtimeTopology.object_retention_policy_matrix_ref,
            "data/analysis/object_retention_policy_matrix.csv",
          );
          assert.equal(
            runtimeTopology.object_key_manifest_rules_ref,
            "data/analysis/object_key_manifest_rules.json",
          );
        });

        test("browser delivery remains blocked for raw and quarantine classes", () => {
          assert.deepEqual(localPolicy.browser_addressable_services, []);
          assert.equal(localPolicy.blocked_browser_targets.includes("quarantine_raw"), true);
          assert.equal(localPolicy.blocked_browser_targets.includes("evidence_source_immutable"), true);
        });

        test("scan handoff preserves quarantine until verdict and manifest settle", () => {
          assert.equal(scanHandoff.source_storage_class_ref, "quarantine_raw");
          assert.equal(scanHandoff.clean_target_storage_class_ref, "evidence_source_immutable");
          assert.equal(scanHandoff.blocked_browser_paths, true);
        });

        test("bootstrap script seeds deterministic object fixtures", () => {
          const scriptPath = path.join(
            ROOT,
            "infra",
            "object-storage",
            "local",
            "bootstrap-object-storage.mjs",
          );
          const seedDir = fs.mkdtempSync(path.join(os.tmpdir(), "vecells-object-storage-"));
          const result = spawnSync(process.execPath, [scriptPath, "--seed-dir", seedDir], {
            encoding: "utf8",
          });
          assert.equal(result.status, 0, result.stderr);
          const seededClasses = fs
            .readdirSync(seedDir, { withFileTypes: true })
            .filter((entry) => entry.isDirectory())
            .map((entry) => entry.name)
            .sort();
          assert.deepEqual(seededClasses, [
            "derived_internal",
            "evidence_source_immutable",
            "ops_recovery_staging",
            "outbound_ephemeral",
            "quarantine_raw",
            "redacted_presentation",
          ]);
          fs.rmSync(seedDir, { recursive: true, force: true });
        });

        test("key rules forbid PHI-bearing segments", () => {
          assert.equal(keyRules.prohibited_key_material.includes("nhs_number"), true);
          assert.equal(keyRules.prohibited_key_material.includes("patient_name"), true);
        });
        """
    ).strip()


def patch_runtime_topology_manifest() -> None:
    topology = json.loads(RUNTIME_TOPOLOGY_PATH.read_text(encoding="utf-8"))
    updated_catalog = []
    entry_found = False
    for row in topology["data_store_catalog"]:
        if row["data_store_ref"] == DATA_STORE_REF:
            updated_catalog.append(
                {
                    "data_store_ref": DATA_STORE_REF,
                    "display_name": "Governed object artifact storage",
                    "store_class": "object",
                    "family_ref": "wf_data_stateful_plane",
                    "trust_zone_ref": "tz_stateful_data",
                    "browser_reachability": "never",
                    "manifest_ref": "data/analysis/object_storage_class_manifest.json",
                    "retention_matrix_ref": "data/analysis/object_retention_policy_matrix.csv",
                    "key_rules_ref": "data/analysis/object_key_manifest_rules.json",
                    "source_refs": [
                        "prompt/086.md#Mission",
                        "docs/architecture/85_domain_transaction_store_and_fhir_storage_design.md#Follow-on Dependencies",
                    ],
                }
            )
            entry_found = True
            continue
        updated_catalog.append(row)
    if not entry_found:
        fail(
            "PREREQUISITE_GAP_086_RUNTIME_DATA_STORE_CATALOG",
            "runtime topology does not declare ds_object_artifact_store",
        )
    topology["data_store_catalog"] = updated_catalog
    topology["object_storage_class_manifest_ref"] = "data/analysis/object_storage_class_manifest.json"
    topology["object_retention_policy_matrix_ref"] = "data/analysis/object_retention_policy_matrix.csv"
    topology["object_key_manifest_rules_ref"] = "data/analysis/object_key_manifest_rules.json"
    write_json(RUNTIME_TOPOLOGY_PATH, topology)


def patch_root_package() -> None:
    package = json.loads(ROOT_PACKAGE_PATH.read_text(encoding="utf-8"))
    package.setdefault("scripts", {}).update(ROOT_SCRIPT_UPDATES)
    write_json(ROOT_PACKAGE_PATH, package)


def patch_playwright_package() -> None:
    package = json.loads(PLAYWRIGHT_PACKAGE_PATH.read_text(encoding="utf-8"))
    scripts = package.setdefault("scripts", {})
    scripts["build"] = append_script_step(
        scripts.get("build", ""), "node --check object-storage-retention-atlas.spec.js"
    )
    if "eslint object-storage-retention-atlas.spec.js" not in scripts.get("lint", ""):
        scripts["lint"] = scripts.get("lint", "") + " && eslint object-storage-retention-atlas.spec.js"
        scripts["lint"] = scripts["lint"].lstrip(" &&")
    scripts["test"] = append_script_step(
        scripts.get("test", ""), "node object-storage-retention-atlas.spec.js"
    )
    scripts["typecheck"] = append_script_step(
        scripts.get("typecheck", ""), "node --check object-storage-retention-atlas.spec.js"
    )
    scripts["e2e"] = append_script_step(
        scripts.get("e2e", ""), "node object-storage-retention-atlas.spec.js --run"
    )
    description = package.get("description", "")
    if "object-storage retention" not in description:
        package["description"] = (
            description.rstrip(".") + ", object-storage retention atlas browser checks."
        ).strip(", ")
    write_json(PLAYWRIGHT_PACKAGE_PATH, package)


def main() -> None:
    runtime_topology = require(
        RUNTIME_TOPOLOGY_PATH, "PREREQUISITE_GAP_086_RUNTIME_TOPOLOGY"
    )
    require(DOMAIN_STORE_MANIFEST_PATH, "PREREQUISITE_GAP_086_DOMAIN_STORE")
    domain_store_manifest = json.loads(
        DOMAIN_STORE_MANIFEST_PATH.read_text(encoding="utf-8")
    )
    evidence_manifest = require(
        EVIDENCE_OBJECT_MANIFEST_PATH, "PREREQUISITE_GAP_086_EVIDENCE_MANIFEST"
    )
    require(WORM_RETENTION_PATH, "PREREQUISITE_GAP_086_WORM_RETENTION")
    require(RECOVERY_POSTURE_PATH, "PREREQUISITE_GAP_086_RECOVERY_POSTURE")

    seed_catalog = build_seed_catalog()
    storage_classes = build_storage_classes(seed_catalog)
    retention_rows = build_retention_rows()
    access_policies = build_access_policies()
    environment_realizations = build_environment_realizations()
    class_realizations = build_class_realizations(retention_rows)
    key_rules = build_key_rules(seed_catalog)
    local_policy = build_local_policy(storage_classes)
    handoff = build_malware_scan_handoff()
    manifest = build_manifest(
        runtime_topology,
        domain_store_manifest,
        evidence_manifest,
        storage_classes,
        access_policies,
        environment_realizations,
        class_realizations,
        seed_catalog,
    )
    bundle = build_html_bundle(manifest, retention_rows, key_rules, local_policy, handoff)

    write_json(CLASS_MANIFEST_PATH, manifest)
    write_csv(RETENTION_MATRIX_PATH, retention_rows)
    write_json(KEY_RULES_PATH, key_rules)
    write_text(DESIGN_DOC_PATH, build_design_doc(manifest, retention_rows, access_policies))
    write_text(RULES_DOC_PATH, build_rules_doc(manifest, key_rules, handoff))
    write_text(ATLAS_PATH, build_html(bundle))
    write_text(SPEC_PATH, build_playwright_spec())

    write_text(README_PATH, build_readme())
    write_text(TERRAFORM_MAIN_PATH, build_terraform_main())
    write_text(TERRAFORM_VARIABLES_PATH, build_terraform_variables())
    write_text(TERRAFORM_OUTPUTS_PATH, build_terraform_outputs())
    write_text(NAMESPACE_MODULE_MAIN_PATH, build_namespace_module_main())
    write_text(NAMESPACE_MODULE_VARIABLES_PATH, build_namespace_module_variables())
    write_text(NAMESPACE_MODULE_OUTPUTS_PATH, build_namespace_module_outputs())
    write_text(CLASS_MODULE_MAIN_PATH, build_class_module_main())
    write_text(CLASS_MODULE_VARIABLES_PATH, build_class_module_variables())
    write_text(CLASS_MODULE_OUTPUTS_PATH, build_class_module_outputs())
    for environment_ring, path in ENVIRONMENT_FILE_PATHS.items():
        write_json(path, build_environment_tfvars(environment_ring))
    write_json(BOOTSTRAP_CATALOG_PATH, seed_catalog)
    write_text(LOCAL_COMPOSE_PATH, build_local_compose())
    write_json(LOCAL_POLICY_PATH, local_policy)
    write_json(LOCAL_HANDOFF_PATH, handoff)
    write_text(LOCAL_BOOTSTRAP_SCRIPT_PATH, build_local_bootstrap_script())
    write_text(SMOKE_TEST_PATH, build_smoke_test())

    patch_runtime_topology_manifest()
    patch_root_package()
    patch_playwright_package()


if __name__ == "__main__":
    main()
