#!/usr/bin/env python3
from __future__ import annotations

import csv
import hashlib
import json
from collections import OrderedDict, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from textwrap import dedent
from typing import Any

from root_script_updates import ROOT_SCRIPT_UPDATES as SHARED_ROOT_SCRIPT_UPDATES


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"
TESTS_DIR = ROOT / "tests" / "playwright"

LEGACY_TENANT_MATRIX_PATH = DATA_DIR / "tenant_isolation_matrix.csv"
LEGACY_SCOPE_MATRIX_PATH = DATA_DIR / "acting_scope_tuple_matrix.csv"
ROUTE_MATRIX_INPUT_PATH = DATA_DIR / "gateway_route_family_matrix.csv"
RUNTIME_TOPOLOGY_PATH = DATA_DIR / "runtime_topology_manifest.json"
GATEWAY_SURFACES_PATH = DATA_DIR / "gateway_bff_surfaces.json"
FRONTEND_MANIFEST_PATH = DATA_DIR / "frontend_contract_manifests.json"
RELEASE_PARITY_PATH = DATA_DIR / "release_publication_parity_rules.json"
AUDIT_PATH = DATA_DIR / "audit_admissibility_dependencies.json"

TENANT_ISOLATION_OUTPUT_PATH = DATA_DIR / "tenant_isolation_modes.json"
ACTING_SCOPE_SCHEMA_PATH = DATA_DIR / "acting_scope_tuple_schema.json"
ROUTE_SCOPE_MATRIX_PATH = DATA_DIR / "route_to_scope_requirements.csv"
DRIFT_TRIGGER_PATH = DATA_DIR / "acting_context_drift_triggers.json"
SURFACE_BLAST_RADIUS_PATH = DATA_DIR / "surface_to_blast_radius_matrix.csv"

TENANT_STRATEGY_DOC_PATH = DOCS_DIR / "54_tenant_isolation_strategy.md"
SCOPE_MODEL_DOC_PATH = DOCS_DIR / "54_acting_scope_tuple_model.md"
ATLAS_PATH = DOCS_DIR / "54_scope_and_isolation_atlas.html"

VALIDATOR_PATH = ROOT / "tools" / "analysis" / "validate_tenant_scope_model.py"
SPEC_PATH = TESTS_DIR / "scope-isolation-atlas.spec.js"
ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = TESTS_DIR / "package.json"

ENGINEERING_BUILDER_PATH = ROOT / "tools" / "analysis" / "build_engineering_standards.py"

TASK_ID = "seq_054"
VISUAL_MODE = "Scope_Atlas"
TIMESTAMP = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
CAPTURED_ON = TIMESTAMP[:10]
MISSION = (
    "Define the tenant-isolation and ActingScopeTuple authority model so runtime isolation, "
    "audience visibility, purpose-of-use, organisation context, elevation, break-glass "
    "posture, and blast radius stay bound to one machine-checkable scope contract."
)

SOURCE_PRECEDENCE = [
    "prompt/054.md",
    "prompt/shared_operating_contract_046_to_055.md",
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "docs/architecture/04_audience_surface_inventory.md",
    "docs/architecture/10_break_glass_and_investigation_scope_rules.md",
    "docs/architecture/11_tenant_model_and_acting_scope_strategy.md",
    "blueprint/phase-0-the-foundation-protocol.md#StaffIdentityContext",
    "blueprint/phase-0-the-foundation-protocol.md#ActingContext",
    "blueprint/phase-0-the-foundation-protocol.md#ActingScopeTuple",
    "blueprint/phase-0-the-foundation-protocol.md#ActingContextDriftRecord",
    "blueprint/phase-0-the-foundation-protocol.md#1.17C MinimumNecessaryContract",
    "blueprint/phase-0-the-foundation-protocol.md#1.17D AudienceVisibilityCoverage",
    "blueprint/phase-0-the-foundation-protocol.md#2.6A ActingContextGovernor",
    "blueprint/phase-0-the-foundation-protocol.md#23A",
    "blueprint/phase-0-the-foundation-protocol.md#23B",
    "blueprint/phase-0-the-foundation-protocol.md#44D",
    "blueprint/phase-0-the-foundation-protocol.md#44E",
    "blueprint/phase-0-the-foundation-protocol.md#4.5 Command-following read rule",
    "blueprint/platform-runtime-and-release-blueprint.md#RuntimeTopologyManifest",
    "blueprint/platform-runtime-and-release-blueprint.md#GatewayBffSurface",
    "blueprint/platform-runtime-and-release-blueprint.md#AudienceSurfaceRuntimeBinding",
    "blueprint/platform-runtime-and-release-blueprint.md#ReleaseWatchTuple",
    "blueprint/platform-frontend-blueprint.md#Shell specialization linkage",
    "blueprint/platform-frontend-blueprint.md#Browser boundary and BFF law",
    "blueprint/staff-operations-and-support-blueprint.md",
    "blueprint/governance-admin-console-frontend-blueprint.md#1A. GovernanceScopeToken",
    "blueprint/platform-admin-and-config-blueprint.md#ConfigWorkspaceContext",
    "blueprint/phase-5-the-network-horizon.md",
    "blueprint/forensic-audit-findings.md#Finding 114",
    "data/analysis/tenant_isolation_matrix.csv",
    "data/analysis/acting_scope_tuple_matrix.csv",
    "data/analysis/runtime_topology_manifest.json",
    "data/analysis/gateway_bff_surfaces.json",
    "data/analysis/frontend_contract_manifests.json",
    "data/analysis/release_publication_parity_rules.json",
    "data/analysis/audit_admissibility_dependencies.json",
]

ROOT_SCRIPT_UPDATES = {
    "bootstrap": (
        "pnpm install && node ./tools/dev-bootstrap/index.mjs && pnpm codegen && "
        "pnpm validate:topology && pnpm validate:runtime-topology && pnpm validate:gateway-surface && "
        "pnpm validate:events && pnpm validate:fhir && pnpm validate:frontend && "
        "pnpm validate:release-parity && pnpm validate:design-publication && pnpm validate:audit-worm && "
        "pnpm validate:tenant-scope && pnpm validate:scaffold && pnpm validate:services && "
        "pnpm validate:domains && pnpm validate:standards"
    ),
    "check": (
        "pnpm lint && pnpm format:check && pnpm typecheck && pnpm test && "
        "pnpm validate:topology && pnpm validate:runtime-topology && pnpm validate:gateway-surface && "
        "pnpm validate:events && pnpm validate:fhir && pnpm validate:frontend && "
        "pnpm validate:release-parity && pnpm validate:design-publication && pnpm validate:audit-worm && "
        "pnpm validate:tenant-scope && pnpm validate:scaffold && pnpm validate:services && "
        "pnpm validate:domains && pnpm validate:standards"
    ),
    "codegen": (
        "python3 ./tools/analysis/build_monorepo_scaffold.py && "
        "python3 ./tools/analysis/build_runtime_service_scaffold.py && "
        "python3 ./tools/analysis/build_domain_package_scaffold.py && "
        "python3 ./tools/analysis/build_runtime_topology_manifest.py && "
        "python3 ./tools/analysis/build_gateway_surface_map.py && "
        "python3 ./tools/analysis/build_event_registry.py && "
        "python3 ./tools/analysis/build_fhir_representation_contracts.py && "
        "python3 ./tools/analysis/build_frontend_contract_manifests.py && "
        "python3 ./tools/analysis/build_release_freeze_and_parity.py && "
        "python3 ./tools/analysis/build_design_contract_publication.py && "
        "python3 ./tools/analysis/build_audit_and_worm_strategy.py && "
        "python3 ./tools/analysis/build_tenant_scope_model.py && "
        "python3 ./tools/analysis/build_engineering_standards.py && pnpm format"
    ),
    "validate:tenant-scope": "python3 ./tools/analysis/validate_tenant_scope_model.py",
}
ROOT_SCRIPT_UPDATES = SHARED_ROOT_SCRIPT_UPDATES

PLAYWRIGHT_SCRIPT_UPDATES = {
    "build": (
        "node --check foundation-shell-gallery.spec.js && "
        "node --check runtime-topology-atlas.spec.js && "
        "node --check gateway-surface-studio.spec.js && "
        "node --check event-registry-studio.spec.js && "
        "node --check fhir-representation-atlas.spec.js && "
        "node --check frontend-contract-studio.spec.js && "
        "node --check release-parity-cockpit.spec.js && "
        "node --check design-contract-studio.spec.js && "
        "node --check audit-ledger-explorer.spec.js && "
        "node --check scope-isolation-atlas.spec.js"
    ),
    "lint": (
        "eslint foundation-shell-gallery.spec.js runtime-topology-atlas.spec.js "
        "gateway-surface-studio.spec.js event-registry-studio.spec.js "
        "fhir-representation-atlas.spec.js frontend-contract-studio.spec.js "
        "release-parity-cockpit.spec.js design-contract-studio.spec.js "
        "audit-ledger-explorer.spec.js scope-isolation-atlas.spec.js"
    ),
    "test": (
        "node foundation-shell-gallery.spec.js && "
        "node runtime-topology-atlas.spec.js && "
        "node gateway-surface-studio.spec.js && "
        "node event-registry-studio.spec.js && "
        "node fhir-representation-atlas.spec.js && "
        "node frontend-contract-studio.spec.js && "
        "node release-parity-cockpit.spec.js && "
        "node design-contract-studio.spec.js && "
        "node audit-ledger-explorer.spec.js && "
        "node scope-isolation-atlas.spec.js"
    ),
    "typecheck": (
        "node --check foundation-shell-gallery.spec.js && "
        "node --check runtime-topology-atlas.spec.js && "
        "node --check gateway-surface-studio.spec.js && "
        "node --check event-registry-studio.spec.js && "
        "node --check fhir-representation-atlas.spec.js && "
        "node --check frontend-contract-studio.spec.js && "
        "node --check release-parity-cockpit.spec.js && "
        "node --check design-contract-studio.spec.js && "
        "node --check audit-ledger-explorer.spec.js && "
        "node --check scope-isolation-atlas.spec.js"
    ),
    "e2e": (
        "node foundation-shell-gallery.spec.js --run && "
        "node runtime-topology-atlas.spec.js --run && "
        "node gateway-surface-studio.spec.js --run && "
        "node event-registry-studio.spec.js --run && "
        "node fhir-representation-atlas.spec.js --run && "
        "node frontend-contract-studio.spec.js --run && "
        "node release-parity-cockpit.spec.js --run && "
        "node design-contract-studio.spec.js --run && "
        "node audit-ledger-explorer.spec.js --run && "
        "node scope-isolation-atlas.spec.js --run"
    ),
}

MANDATORY_DRIFT_CLASSES = [
    "organisation_switch",
    "tenant_scope_change",
    "environment_change",
    "policy_plane_change",
    "purpose_of_use_change",
    "elevation_expired",
    "break_glass_revoked",
    "visibility_contract_drift",
]

ASSUMPTIONS = [
    OrderedDict(
        [
            ("assumptionId", "ASSUMPTION_054_SAMPLE_TUPLES_USE_DECLARED_PHASE0_COUNTS"),
            (
                "statement",
                "The tuple and blast-radius counts in this Phase 0 contract are declared authority counts "
                "for route classes and sample tuples; runtime issuance may refresh the exact live count later, "
                "but it may not omit or infer the fields.",
            ),
            ("source_refs", ["prompt/054.md", "blueprint/phase-0-the-foundation-protocol.md#44E"]),
        ]
    ),
    OrderedDict(
        [
            ("assumptionId", "ASSUMPTION_054_ASSISTIVE_NEVER_MINTS_STANDALONE_SCOPE"),
            (
                "statement",
                "Assistive sidecar work inherits the owner shell tuple and may not widen tenant, organisation, "
                "or purpose scope through a local selector or adjunct-only token.",
            ),
            ("source_refs", ["prompt/054.md", "blueprint/phase-8-the-assistive-layer.md"]),
        ]
    ),
]

DEFECTS = [
    OrderedDict(
        [
            ("defectId", "DRIFT_054_AMBIENT_ROLE_SELECTOR_BLOCKED"),
            ("state", "blocked_by_contract"),
            (
                "summary",
                "Ambient role strings, remembered organisation selectors, and browser-local tenant state cannot "
                "substitute for one current ActingScopeTuple.",
            ),
            (
                "source_refs",
                [
                    "prompt/054.md",
                    "blueprint/phase-0-the-foundation-protocol.md#23A",
                    "blueprint/forensic-audit-findings.md#Finding 114",
                ],
            ),
        ]
    ),
    OrderedDict(
        [
            ("defectId", "DRIFT_054_SPLIT_RUNTIME_BROWSER_SCOPE_BLOCKED"),
            ("state", "blocked_by_contract"),
            (
                "summary",
                "Runtime tenant isolation and browser route authority are explicitly joined through one runtime-browser authority binding.",
            ),
            (
                "source_refs",
                [
                    "prompt/054.md",
                    "blueprint/platform-runtime-and-release-blueprint.md#RuntimeTopologyManifest",
                    "blueprint/platform-runtime-and-release-blueprint.md#AudienceSurfaceRuntimeBinding",
                ],
            ),
        ]
    ),
    OrderedDict(
        [
            ("defectId", "DRIFT_054_IMPLIED_BLAST_RADIUS_BLOCKED"),
            ("state", "blocked_by_contract"),
            (
                "summary",
                "Multi-tenant and platform work can no longer imply blast radius from route names or cohorts; affected tenant and organisation counts are first-class fields.",
            ),
            (
                "source_refs",
                [
                    "prompt/054.md",
                    "blueprint/phase-0-the-foundation-protocol.md#44E",
                    "blueprint/platform-admin-and-config-blueprint.md#ConfigWorkspaceContext",
                ],
            ),
        ]
    ),
    OrderedDict(
        [
            ("defectId", "DRIFT_054_LOCAL_GOVERNANCE_SCOPE_TOKEN_BLOCKED"),
            ("state", "blocked_by_contract"),
            (
                "summary",
                "Governance scope tokens now derive from the same tuple and hash as cross-organisation support, hub, and release work.",
            ),
            (
                "source_refs",
                [
                    "blueprint/governance-admin-console-frontend-blueprint.md#1A. GovernanceScopeToken",
                    "blueprint/forensic-audit-findings.md#Finding 114",
                ],
            ),
        ]
    ),
]

PROFILE_CATALOG = {
    "ACT_PATIENT_PUBLIC_INTAKE": {
        "display_name": "Patient public intake",
        "tuple_requirement": "not_required",
        "scope_mode": "tenant",
        "purpose_of_use_ref": "purpose://public_status",
        "visibility_ref": "AVC_054_PATIENT_PUBLIC_ENTRY_V1",
        "minimum_necessary_ref": "MNC_054_PATIENT_PUBLIC_ENTRY_V1",
        "drift_triggers": ["runtime_binding_drift", "release_freeze", "channel_freeze"],
        "drift_posture": "placeholder_only",
        "blast_radius_class": "pending_subject",
        "source_refs": [
            "docs/architecture/11_tenant_model_and_acting_scope_strategy.md",
            "data/analysis/tenant_isolation_matrix.csv#TIM_PUBLIC_PRE_IDENTITY",
        ],
        "rationale": "Public intake remains pre-tenant and may not acquire staff authority semantics.",
    },
    "ACT_PATIENT_GRANT_RECOVERY": {
        "display_name": "Patient grant-scoped recovery",
        "tuple_requirement": "not_required",
        "scope_mode": "tenant",
        "purpose_of_use_ref": "purpose://secure_link_recovery",
        "visibility_ref": "AVC_054_PATIENT_GRANT_RECOVERY_V1",
        "minimum_necessary_ref": "MNC_054_PATIENT_GRANT_RECOVERY_V1",
        "drift_triggers": ["grant_expired", "runtime_binding_drift", "route_intent_drift"],
        "drift_posture": "recovery_only",
        "blast_radius_class": "single_subject",
        "source_refs": [
            "docs/architecture/11_tenant_model_and_acting_scope_strategy.md",
            "data/analysis/acting_scope_tuple_matrix.csv#ACT_PATIENT_GRANT_RECOVERY",
        ],
        "rationale": "Secure-link recovery is narrower than a normal patient shell and cannot widen to staff scope.",
    },
    "ACT_PATIENT_AUTHENTICATED": {
        "display_name": "Authenticated patient self-service",
        "tuple_requirement": "not_required",
        "scope_mode": "tenant",
        "purpose_of_use_ref": "purpose://authenticated_self_service",
        "visibility_ref": "AVC_054_PATIENT_AUTHENTICATED_V1",
        "minimum_necessary_ref": "MNC_054_PATIENT_AUTHENTICATED_V1",
        "drift_triggers": ["subject_binding_drift", "runtime_binding_drift", "writable_eligibility_drift"],
        "drift_posture": "read_only",
        "blast_radius_class": "single_tenant",
        "source_refs": [
            "docs/architecture/11_tenant_model_and_acting_scope_strategy.md",
            "data/analysis/acting_scope_tuple_matrix.csv#ACT_PATIENT_AUTHENTICATED",
        ],
        "rationale": "Patient self-service remains subject-bound and does not use a staff ActingScopeTuple.",
    },
    "ACT_PATIENT_EMBEDDED": {
        "display_name": "Embedded patient channel",
        "tuple_requirement": "not_required",
        "scope_mode": "tenant",
        "purpose_of_use_ref": "purpose://authenticated_self_service",
        "visibility_ref": "AVC_054_PATIENT_EMBEDDED_V1",
        "minimum_necessary_ref": "MNC_054_PATIENT_EMBEDDED_V1",
        "drift_triggers": ["embedded_manifest_drift", "runtime_binding_drift", "channel_freeze"],
        "drift_posture": "handoff_only",
        "blast_radius_class": "single_subject",
        "source_refs": [
            "docs/architecture/11_tenant_model_and_acting_scope_strategy.md",
            "data/analysis/acting_scope_tuple_matrix.csv#ACT_PATIENT_EMBEDDED",
        ],
        "rationale": "Embedded patient routes preserve subject scope and degrade through channel-specific recovery instead of widening authority.",
    },
    "ACT_STAFF_SINGLE_ORG": {
        "display_name": "Staff single-organisation operations",
        "tuple_requirement": "required",
        "scope_mode": "organisation",
        "purpose_of_use_ref": "purpose://operational_care_delivery",
        "visibility_ref": "AVC_054_STAFF_SINGLE_ORG_V1",
        "minimum_necessary_ref": "MNC_054_STAFF_SINGLE_ORG_V1",
        "drift_triggers": MANDATORY_DRIFT_CLASSES,
        "drift_posture": "stale_recoverable",
        "blast_radius_class": "single_tenant",
        "source_refs": [
            "docs/architecture/11_tenant_model_and_acting_scope_strategy.md",
            "data/analysis/acting_scope_tuple_matrix.csv#ACT_STAFF_SINGLE_ORG",
            "blueprint/phase-0-the-foundation-protocol.md#23A",
        ],
        "rationale": "Clinical and practice operations work must bind one current tuple and freeze on any scope drift.",
    },
    "ACT_SUPPORT_TICKET_WORKSPACE": {
        "display_name": "Support ticket workspace",
        "tuple_requirement": "required",
        "scope_mode": "tenant",
        "purpose_of_use_ref": "purpose://support_workflow",
        "visibility_ref": "AVC_054_SUPPORT_WORKSPACE_V1",
        "minimum_necessary_ref": "MNC_054_SUPPORT_WORKSPACE_V1",
        "drift_triggers": MANDATORY_DRIFT_CLASSES,
        "drift_posture": "read_only_same_shell",
        "blast_radius_class": "single_tenant",
        "source_refs": [
            "prompt/054.md",
            "blueprint/staff-operations-and-support-blueprint.md",
            "blueprint/phase-0-the-foundation-protocol.md#44D",
        ],
        "rationale": "Support action work remains tuple-bound even when operating against a single ticket and tenant.",
    },
    "ACT_SUPPORT_ASSISTED_CAPTURE": {
        "display_name": "Support-assisted capture",
        "tuple_requirement": "required",
        "scope_mode": "tenant",
        "purpose_of_use_ref": "purpose://support_assisted_capture",
        "visibility_ref": "AVC_054_SUPPORT_ASSISTED_CAPTURE_V1",
        "minimum_necessary_ref": "MNC_054_SUPPORT_ASSISTED_CAPTURE_V1",
        "drift_triggers": MANDATORY_DRIFT_CLASSES,
        "drift_posture": "capture_recovery_only",
        "blast_radius_class": "single_tenant",
        "source_refs": [
            "docs/architecture/11_tenant_model_and_acting_scope_strategy.md",
            "data/analysis/acting_scope_tuple_matrix.csv#ACT_SUPPORT_ASSISTED_CAPTURE",
        ],
        "rationale": "Support-assisted capture can help inside a ticket scope but may not inherit replay or governance authority.",
    },
    "ACT_SUPPORT_REPLAY_RESTORE": {
        "display_name": "Support replay and restore",
        "tuple_requirement": "required",
        "scope_mode": "tenant",
        "purpose_of_use_ref": "purpose://support_recovery",
        "visibility_ref": "AVC_054_SUPPORT_REPLAY_V1",
        "minimum_necessary_ref": "MNC_054_SUPPORT_REPLAY_V1",
        "drift_triggers": MANDATORY_DRIFT_CLASSES,
        "drift_posture": "masked_read_only",
        "blast_radius_class": "single_tenant",
        "source_refs": [
            "docs/architecture/11_tenant_model_and_acting_scope_strategy.md",
            "data/analysis/acting_scope_tuple_matrix.csv#ACT_SUPPORT_REPLAY_RESTORE",
            "blueprint/phase-9-the-assurance-ledger.md#9C. Audit explorer, break-glass review, and support replay",
        ],
        "rationale": "Support replay binds one selected anchor, evidence envelope, and tuple; restore freezes immediately on drift.",
    },
    "ACT_HUB_CROSS_ORG": {
        "display_name": "Hub cross-organisation coordination",
        "tuple_requirement": "required",
        "scope_mode": "organisation_group",
        "purpose_of_use_ref": "purpose://operational_care_delivery",
        "visibility_ref": "AVC_054_HUB_CROSS_ORG_V1",
        "minimum_necessary_ref": "MNC_054_HUB_CROSS_ORG_V1",
        "drift_triggers": MANDATORY_DRIFT_CLASSES,
        "drift_posture": "summary_only",
        "blast_radius_class": "cross_org",
        "source_refs": [
            "docs/architecture/11_tenant_model_and_acting_scope_strategy.md",
            "data/analysis/acting_scope_tuple_matrix.csv#ACT_HUB_CROSS_ORG",
            "blueprint/forensic-audit-findings.md#Finding 114",
        ],
        "rationale": "Hub work is lawful only through an explicit declared organisation subset and one tuple hash.",
    },
    "ACT_PHARMACY_SERVICING": {
        "display_name": "Pharmacy servicing",
        "tuple_requirement": "required",
        "scope_mode": "organisation",
        "purpose_of_use_ref": "purpose://operational_care_delivery",
        "visibility_ref": "AVC_054_PHARMACY_SERVICING_V1",
        "minimum_necessary_ref": "MNC_054_PHARMACY_SERVICING_V1",
        "drift_triggers": MANDATORY_DRIFT_CLASSES,
        "drift_posture": "read_only",
        "blast_radius_class": "single_tenant",
        "source_refs": [
            "docs/architecture/11_tenant_model_and_acting_scope_strategy.md",
            "data/analysis/acting_scope_tuple_matrix.csv#ACT_PHARMACY_SERVICING",
        ],
        "rationale": "Servicing-site work keeps provider and dispatch scope separate from general staff routing.",
    },
    "ACT_OPERATIONS_WATCH": {
        "display_name": "Operations watch and intervention",
        "tuple_requirement": "required",
        "scope_mode": "multi_tenant",
        "purpose_of_use_ref": "purpose://operational_control",
        "visibility_ref": "AVC_054_OPERATIONS_WATCH_V1",
        "minimum_necessary_ref": "MNC_054_OPERATIONS_WATCH_V1",
        "drift_triggers": MANDATORY_DRIFT_CLASSES,
        "drift_posture": "diagnostic_copy_only",
        "blast_radius_class": "multi_tenant",
        "source_refs": [
            "docs/architecture/11_tenant_model_and_acting_scope_strategy.md",
            "data/analysis/acting_scope_tuple_matrix.csv#ACT_OPERATIONS_WATCH",
            "blueprint/platform-runtime-and-release-blueprint.md#ReleaseWatchTuple",
        ],
        "rationale": "Operations watch is broad by design but must surface explicit tenant and organisation counts before any control settles.",
    },
    "ACT_GOVERNANCE_PLATFORM": {
        "display_name": "Governance and platform release control",
        "tuple_requirement": "required",
        "scope_mode": "platform",
        "purpose_of_use_ref": "purpose://governance_review",
        "visibility_ref": "AVC_054_GOVERNANCE_PLATFORM_V1",
        "minimum_necessary_ref": "MNC_054_GOVERNANCE_PLATFORM_V1",
        "drift_triggers": MANDATORY_DRIFT_CLASSES,
        "drift_posture": "handoff_only",
        "blast_radius_class": "platform",
        "source_refs": [
            "docs/architecture/11_tenant_model_and_acting_scope_strategy.md",
            "data/analysis/acting_scope_tuple_matrix.csv#ACT_GOVERNANCE_PLATFORM",
            "blueprint/governance-admin-console-frontend-blueprint.md#1A. GovernanceScopeToken",
        ],
        "rationale": "Platform governance binds one scope token and one tuple so release and access work cannot stay writable under stale scope.",
    },
    "ACT_ASSISTIVE_ADJUNCT": {
        "display_name": "Assistive adjunct inherited scope",
        "tuple_requirement": "inherited_owner",
        "scope_mode": "organisation",
        "purpose_of_use_ref": "purpose://adjunct_assistance",
        "visibility_ref": "AVC_054_ASSISTIVE_ADJUNCT_V1",
        "minimum_necessary_ref": "MNC_054_ASSISTIVE_ADJUNCT_V1",
        "drift_triggers": ["owner_scope_drift", "rollout_cohort_drift", "visibility_contract_drift"],
        "drift_posture": "owner_scope_freeze",
        "blast_radius_class": "owner_scope",
        "source_refs": [
            "docs/architecture/11_tenant_model_and_acting_scope_strategy.md",
            "data/analysis/acting_scope_tuple_matrix.csv#ACT_ASSISTIVE_ADJUNCT",
        ],
        "rationale": "Assistive surfaces inherit the owner shell tuple and may never mint a shadow scope.",
    },
}


def read_json(path: Path) -> Any:
    return json.loads(path.read_text())


def write_json(path: Path, payload: Any) -> None:
    path.write_text(json.dumps(payload, indent=2) + "\n")


def write_text(path: Path, content: str) -> None:
    path.write_text(content)


def write_csv(path: Path, fieldnames: list[str], rows: list[dict[str, Any]]) -> None:
    with path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open() as handle:
        return list(csv.DictReader(handle))


def split_semicolon(value: str) -> list[str]:
    if not value:
        return []
    return [item.strip() for item in value.split(";") if item.strip()]


def stable_hash(payload: Any) -> str:
    return hashlib.sha256(json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")).hexdigest()


def short_hash(payload: Any) -> str:
    return stable_hash(payload)[:16]


def ordered_unique(values: list[str]) -> list[str]:
    seen: set[str] = set()
    ordered: list[str] = []
    for value in values:
        if value and value not in seen:
            seen.add(value)
            ordered.append(value)
    return ordered


def route_group_for_row(row: dict[str, str]) -> str:
    audience = row["audience"]
    shell_type = row["shell_type"]
    route_family_id = row["route_family_id"]
    gateway_surface_id = row["gateway_surface_id"]
    if route_family_id.startswith("rf_patient_") or route_family_id.startswith("rf_intake_"):
        return "patient"
    if gateway_surface_id == "gws_practice_ops_workspace":
        return "practice_ops"
    if gateway_surface_id in {"gws_clinician_workspace", "gws_clinician_workspace_child"}:
        return "clinical"
    if gateway_surface_id == "gws_assistive_sidecar":
        return "assistive"
    if shell_type == "support":
        return "support"
    if shell_type == "hub":
        return "hub"
    if shell_type == "pharmacy":
        return "pharmacy"
    if shell_type == "operations":
        return "operations"
    if audience == "governance_review":
        return "governance"
    return "other"


def runtime_binding_for_route(
    frontend_payload: dict[str, Any],
    route_family_id: str,
    gateway_surface_id: str,
) -> tuple[list[str], list[str]]:
    if gateway_surface_id == "gws_assistive_sidecar":
        return ["ASRB_050_CLINICAL_WORKSPACE_V1"], ["audsurf_clinical_workspace"]
    binding_ids: list[str] = []
    surface_refs: list[str] = []
    for binding in frontend_payload["audienceSurfaceRuntimeBindings"]:
        if route_family_id in binding["routeFamilyRefs"]:
            gateway_refs = binding.get("gatewaySurfaceRefs", [])
            if gateway_surface_id in gateway_refs or not gateway_refs:
                binding_ids.append(binding["audienceSurfaceRuntimeBindingId"])
                surface_refs.append(binding["audienceSurface"])
    return ordered_unique(binding_ids), ordered_unique(surface_refs)


def authority_binding_id(binding_id: str) -> str:
    suffix = binding_id.replace("ASRB_050_", "")
    return f"RBA_054_{suffix}"


def legacy_lookup(rows: list[dict[str, str]], key: str) -> dict[str, dict[str, str]]:
    return {row[key]: row for row in rows}


def load_context() -> dict[str, Any]:
    route_rows = read_csv(ROUTE_MATRIX_INPUT_PATH)
    tenant_rows = read_csv(LEGACY_TENANT_MATRIX_PATH)
    scope_rows = read_csv(LEGACY_SCOPE_MATRIX_PATH)
    runtime_payload = read_json(RUNTIME_TOPOLOGY_PATH)
    gateway_payload = read_json(GATEWAY_SURFACES_PATH)
    frontend_payload = read_json(FRONTEND_MANIFEST_PATH)
    release_payload = read_json(RELEASE_PARITY_PATH)
    audit_payload = read_json(AUDIT_PATH)

    gateway_surfaces = {
        row["surfaceId"]: row
        for row in gateway_payload["gateway_surfaces"]
    }
    route_rows_sorted = sorted(
        route_rows,
        key=lambda row: (
            row["shell_type"],
            row["audience"],
            row["route_family_id"],
            row["gateway_surface_id"],
        ),
    )

    return {
        "route_rows": route_rows_sorted,
        "legacy_tenant_rows": tenant_rows,
        "legacy_scope_rows": scope_rows,
        "runtime": runtime_payload,
        "gateway": gateway_payload,
        "gateway_surfaces": gateway_surfaces,
        "frontend": frontend_payload,
        "release": release_payload,
        "audit": audit_payload,
        "legacy_tenant_lookup": legacy_lookup(tenant_rows, "isolation_row_id"),
        "legacy_scope_lookup": legacy_lookup(scope_rows, "acting_scope_profile_id"),
    }


def build_staff_identity_contexts() -> list[OrderedDict[str, Any]]:
    common_refs = [
        "blueprint/phase-0-the-foundation-protocol.md#StaffIdentityContext",
        "prompt/054.md",
    ]
    return [
        OrderedDict(
            [
                ("staffIdentityContextId", "SIC_054_CLINICAL_ALPHA_V1"),
                ("staffUserId", "usr://clinical-alpha"),
                ("homeOrganisationRef", "org://alpha-practice"),
                ("affiliatedOrganisationRefs", ["org://alpha-practice", "org://alpha-network"]),
                ("tenantGrantRefs", ["tenant://north-alpha"]),
                ("nationalRbacRefs", ["rbac://gp_clinician"]),
                ("localRoleRefs", ["role://clinical_workspace_reviewer"]),
                ("sessionAssurance", "staff_mfa"),
                ("identityState", "authenticated"),
                ("authenticatedAt", "2026-04-12T08:00:00+00:00"),
                ("expiresAt", "2026-04-12T18:00:00+00:00"),
                ("source_refs", common_refs),
            ]
        ),
        OrderedDict(
            [
                ("staffIdentityContextId", "SIC_054_PRACTICE_OPS_ALPHA_V1"),
                ("staffUserId", "usr://practice-ops-alpha"),
                ("homeOrganisationRef", "org://alpha-practice"),
                ("affiliatedOrganisationRefs", ["org://alpha-practice"]),
                ("tenantGrantRefs", ["tenant://north-alpha"]),
                ("nationalRbacRefs", ["rbac://gp_admin"]),
                ("localRoleRefs", ["role://practice_ops_workspace"]),
                ("sessionAssurance", "staff_mfa"),
                ("identityState", "authenticated"),
                ("authenticatedAt", "2026-04-12T08:05:00+00:00"),
                ("expiresAt", "2026-04-12T18:05:00+00:00"),
                ("source_refs", common_refs),
            ]
        ),
        OrderedDict(
            [
                ("staffIdentityContextId", "SIC_054_SUPPORT_PLATFORM_V1"),
                ("staffUserId", "usr://support-platform"),
                ("homeOrganisationRef", "org://vecells-support"),
                ("affiliatedOrganisationRefs", ["org://vecells-support", "org://alpha-practice"]),
                ("tenantGrantRefs", ["tenant://north-alpha"]),
                ("nationalRbacRefs", ["rbac://support_delegate"]),
                ("localRoleRefs", ["role://support_agent"]),
                ("sessionAssurance", "staff_step_up"),
                ("identityState", "authenticated"),
                ("authenticatedAt", "2026-04-12T08:10:00+00:00"),
                ("expiresAt", "2026-04-12T17:10:00+00:00"),
                ("source_refs", common_refs),
            ]
        ),
        OrderedDict(
            [
                ("staffIdentityContextId", "SIC_054_HUB_NETWORK_V1"),
                ("staffUserId", "usr://hub-network"),
                ("homeOrganisationRef", "org://north-hub"),
                ("affiliatedOrganisationRefs", ["org://north-hub", "org://alpha-practice", "org://beta-practice", "org://gamma-practice"]),
                ("tenantGrantRefs", ["tenant://north-alpha"]),
                ("nationalRbacRefs", ["rbac://hub_coordinator"]),
                ("localRoleRefs", ["role://hub_queue_operator"]),
                ("sessionAssurance", "staff_mfa"),
                ("identityState", "authenticated"),
                ("authenticatedAt", "2026-04-12T08:15:00+00:00"),
                ("expiresAt", "2026-04-12T18:15:00+00:00"),
                ("source_refs", common_refs),
            ]
        ),
        OrderedDict(
            [
                ("staffIdentityContextId", "SIC_054_PHARMACY_ALPHA_V1"),
                ("staffUserId", "usr://pharmacy-alpha"),
                ("homeOrganisationRef", "org://alpha-pharmacy"),
                ("affiliatedOrganisationRefs", ["org://alpha-pharmacy"]),
                ("tenantGrantRefs", ["tenant://north-alpha"]),
                ("nationalRbacRefs", ["rbac://pharmacy_dispatch"]),
                ("localRoleRefs", ["role://pharmacy_console_operator"]),
                ("sessionAssurance", "staff_mfa"),
                ("identityState", "authenticated"),
                ("authenticatedAt", "2026-04-12T08:20:00+00:00"),
                ("expiresAt", "2026-04-12T18:20:00+00:00"),
                ("source_refs", common_refs),
            ]
        ),
        OrderedDict(
            [
                ("staffIdentityContextId", "SIC_054_OPS_PLATFORM_V1"),
                ("staffUserId", "usr://ops-platform"),
                ("homeOrganisationRef", "org://vecells-ops"),
                ("affiliatedOrganisationRefs", ["org://vecells-ops"]),
                ("tenantGrantRefs", ["tenant://north-alpha", "tenant://north-beta", "tenant://midlands", "tenant://south"]),
                ("nationalRbacRefs", ["rbac://ops_control"]),
                ("localRoleRefs", ["role://ops_watch"]),
                ("sessionAssurance", "staff_step_up"),
                ("identityState", "authenticated"),
                ("authenticatedAt", "2026-04-12T08:25:00+00:00"),
                ("expiresAt", "2026-04-12T16:25:00+00:00"),
                ("source_refs", common_refs),
            ]
        ),
        OrderedDict(
            [
                ("staffIdentityContextId", "SIC_054_GOVERNANCE_PLATFORM_V1"),
                ("staffUserId", "usr://governance-platform"),
                ("homeOrganisationRef", "org://vecells-governance"),
                ("affiliatedOrganisationRefs", ["org://vecells-governance"]),
                ("tenantGrantRefs", ["tenant://north-alpha", "tenant://north-beta", "tenant://midlands", "tenant://south", "tenant://london", "tenant://east", "tenant://west", "tenant://national"]),
                ("nationalRbacRefs", ["rbac://platform_admin"]),
                ("localRoleRefs", ["role://governance_release_manager", "role://access_reviewer"]),
                ("sessionAssurance", "staff_step_up"),
                ("identityState", "authenticated"),
                ("authenticatedAt", "2026-04-12T08:30:00+00:00"),
                ("expiresAt", "2026-04-12T15:30:00+00:00"),
                ("source_refs", common_refs),
            ]
        ),
    ]


def build_acting_contexts() -> list[OrderedDict[str, Any]]:
    return [
        OrderedDict(
            [
                ("actingContextId", "AC_054_CLINICAL_WORKSPACE_V1"),
                ("staffIdentityContextRef", "SIC_054_CLINICAL_ALPHA_V1"),
                ("activeOrganisationRef", "org://alpha-practice"),
                ("activeOrganisationScopeRefs", ["org://alpha-practice"]),
                ("tenantScopeMode", "single_tenant"),
                ("tenantScopeRefs", ["tenant://north-alpha"]),
                ("environmentRef", "env://prod"),
                ("policyPlaneRef", "policy://care_delivery"),
                ("actingRoleRef", "role://clinical_workspace_reviewer"),
                ("purposeOfUseRef", "purpose://operational_care_delivery"),
                ("audienceTierRef", "origin_practice_clinical"),
                ("elevationState", "active"),
                ("breakGlassState", "eligible"),
                ("visibilityCoverageRef", "AVC_054_STAFF_SINGLE_ORG_V1"),
                ("minimumNecessaryContractRef", "MNC_054_STAFF_SINGLE_ORG_V1"),
                ("contextState", "current"),
                ("switchGeneration", 12),
                ("issuedAt", "2026-04-12T08:35:00+00:00"),
                ("expiresAt", "2026-04-12T12:35:00+00:00"),
                ("revokedAt", None),
                ("source_refs", PROFILE_CATALOG["ACT_STAFF_SINGLE_ORG"]["source_refs"]),
            ]
        ),
        OrderedDict(
            [
                ("actingContextId", "AC_054_PRACTICE_OPS_V1"),
                ("staffIdentityContextRef", "SIC_054_PRACTICE_OPS_ALPHA_V1"),
                ("activeOrganisationRef", "org://alpha-practice"),
                ("activeOrganisationScopeRefs", ["org://alpha-practice"]),
                ("tenantScopeMode", "single_tenant"),
                ("tenantScopeRefs", ["tenant://north-alpha"]),
                ("environmentRef", "env://prod"),
                ("policyPlaneRef", "policy://care_delivery"),
                ("actingRoleRef", "role://practice_ops_workspace"),
                ("purposeOfUseRef", "purpose://operational_care_delivery"),
                ("audienceTierRef", "origin_practice_operations"),
                ("elevationState", "active"),
                ("breakGlassState", "eligible"),
                ("visibilityCoverageRef", "AVC_054_STAFF_SINGLE_ORG_V1"),
                ("minimumNecessaryContractRef", "MNC_054_STAFF_SINGLE_ORG_V1"),
                ("contextState", "current"),
                ("switchGeneration", 6),
                ("issuedAt", "2026-04-12T08:40:00+00:00"),
                ("expiresAt", "2026-04-12T12:40:00+00:00"),
                ("revokedAt", None),
                ("source_refs", PROFILE_CATALOG["ACT_STAFF_SINGLE_ORG"]["source_refs"]),
            ]
        ),
        OrderedDict(
            [
                ("actingContextId", "AC_054_SUPPORT_WORKSPACE_V1"),
                ("staffIdentityContextRef", "SIC_054_SUPPORT_PLATFORM_V1"),
                ("activeOrganisationRef", "org://alpha-practice"),
                ("activeOrganisationScopeRefs", ["org://alpha-practice"]),
                ("tenantScopeMode", "single_tenant"),
                ("tenantScopeRefs", ["tenant://north-alpha"]),
                ("environmentRef", "env://prod"),
                ("policyPlaneRef", "policy://support_service"),
                ("actingRoleRef", "role://support_agent"),
                ("purposeOfUseRef", "purpose://support_workflow"),
                ("audienceTierRef", "support"),
                ("elevationState", "active"),
                ("breakGlassState", "eligible"),
                ("visibilityCoverageRef", "AVC_054_SUPPORT_WORKSPACE_V1"),
                ("minimumNecessaryContractRef", "MNC_054_SUPPORT_WORKSPACE_V1"),
                ("contextState", "current"),
                ("switchGeneration", 3),
                ("issuedAt", "2026-04-12T08:45:00+00:00"),
                ("expiresAt", "2026-04-12T11:45:00+00:00"),
                ("revokedAt", None),
                ("source_refs", PROFILE_CATALOG["ACT_SUPPORT_TICKET_WORKSPACE"]["source_refs"]),
            ]
        ),
        OrderedDict(
            [
                ("actingContextId", "AC_054_SUPPORT_ASSISTED_CAPTURE_V1"),
                ("staffIdentityContextRef", "SIC_054_SUPPORT_PLATFORM_V1"),
                ("activeOrganisationRef", "org://alpha-practice"),
                ("activeOrganisationScopeRefs", ["org://alpha-practice"]),
                ("tenantScopeMode", "single_tenant"),
                ("tenantScopeRefs", ["tenant://north-alpha"]),
                ("environmentRef", "env://prod"),
                ("policyPlaneRef", "policy://support_service"),
                ("actingRoleRef", "role://support_assisted_capture"),
                ("purposeOfUseRef", "purpose://support_assisted_capture"),
                ("audienceTierRef", "support"),
                ("elevationState", "active"),
                ("breakGlassState", "eligible"),
                ("visibilityCoverageRef", "AVC_054_SUPPORT_ASSISTED_CAPTURE_V1"),
                ("minimumNecessaryContractRef", "MNC_054_SUPPORT_ASSISTED_CAPTURE_V1"),
                ("contextState", "current"),
                ("switchGeneration", 4),
                ("issuedAt", "2026-04-12T08:47:00+00:00"),
                ("expiresAt", "2026-04-12T11:47:00+00:00"),
                ("revokedAt", None),
                ("source_refs", PROFILE_CATALOG["ACT_SUPPORT_ASSISTED_CAPTURE"]["source_refs"]),
            ]
        ),
        OrderedDict(
            [
                ("actingContextId", "AC_054_SUPPORT_REPLAY_V1"),
                ("staffIdentityContextRef", "SIC_054_SUPPORT_PLATFORM_V1"),
                ("activeOrganisationRef", "org://alpha-practice"),
                ("activeOrganisationScopeRefs", ["org://alpha-practice"]),
                ("tenantScopeMode", "single_tenant"),
                ("tenantScopeRefs", ["tenant://north-alpha"]),
                ("environmentRef", "env://prod"),
                ("policyPlaneRef", "policy://support_service"),
                ("actingRoleRef", "role://support_replay_reviewer"),
                ("purposeOfUseRef", "purpose://support_recovery"),
                ("audienceTierRef", "support"),
                ("elevationState", "active"),
                ("breakGlassState", "active"),
                ("visibilityCoverageRef", "AVC_054_SUPPORT_REPLAY_V1"),
                ("minimumNecessaryContractRef", "MNC_054_SUPPORT_REPLAY_V1"),
                ("contextState", "current"),
                ("switchGeneration", 5),
                ("issuedAt", "2026-04-12T08:49:00+00:00"),
                ("expiresAt", "2026-04-12T10:49:00+00:00"),
                ("revokedAt", None),
                ("source_refs", PROFILE_CATALOG["ACT_SUPPORT_REPLAY_RESTORE"]["source_refs"]),
            ]
        ),
        OrderedDict(
            [
                ("actingContextId", "AC_054_HUB_COORDINATION_V1"),
                ("staffIdentityContextRef", "SIC_054_HUB_NETWORK_V1"),
                ("activeOrganisationRef", "org://north-hub"),
                ("activeOrganisationScopeRefs", ["org://alpha-practice", "org://beta-practice", "org://gamma-practice", "org://delta-practice"]),
                ("tenantScopeMode", "organisation_group"),
                ("tenantScopeRefs", ["tenant://north-alpha"]),
                ("environmentRef", "env://prod"),
                ("policyPlaneRef", "policy://cross_org_coordination"),
                ("actingRoleRef", "role://hub_queue_operator"),
                ("purposeOfUseRef", "purpose://operational_care_delivery"),
                ("audienceTierRef", "hub_desk"),
                ("elevationState", "active"),
                ("breakGlassState", "eligible"),
                ("visibilityCoverageRef", "AVC_054_HUB_CROSS_ORG_V1"),
                ("minimumNecessaryContractRef", "MNC_054_HUB_CROSS_ORG_V1"),
                ("contextState", "current"),
                ("switchGeneration", 9),
                ("issuedAt", "2026-04-12T08:52:00+00:00"),
                ("expiresAt", "2026-04-12T11:52:00+00:00"),
                ("revokedAt", None),
                ("source_refs", PROFILE_CATALOG["ACT_HUB_CROSS_ORG"]["source_refs"]),
            ]
        ),
        OrderedDict(
            [
                ("actingContextId", "AC_054_PHARMACY_SERVICING_V1"),
                ("staffIdentityContextRef", "SIC_054_PHARMACY_ALPHA_V1"),
                ("activeOrganisationRef", "org://alpha-pharmacy"),
                ("activeOrganisationScopeRefs", ["org://alpha-pharmacy"]),
                ("tenantScopeMode", "single_tenant"),
                ("tenantScopeRefs", ["tenant://north-alpha"]),
                ("environmentRef", "env://prod"),
                ("policyPlaneRef", "policy://servicing_site_delivery"),
                ("actingRoleRef", "role://pharmacy_console_operator"),
                ("purposeOfUseRef", "purpose://operational_care_delivery"),
                ("audienceTierRef", "servicing_site"),
                ("elevationState", "active"),
                ("breakGlassState", "eligible"),
                ("visibilityCoverageRef", "AVC_054_PHARMACY_SERVICING_V1"),
                ("minimumNecessaryContractRef", "MNC_054_PHARMACY_SERVICING_V1"),
                ("contextState", "current"),
                ("switchGeneration", 2),
                ("issuedAt", "2026-04-12T08:55:00+00:00"),
                ("expiresAt", "2026-04-12T12:55:00+00:00"),
                ("revokedAt", None),
                ("source_refs", PROFILE_CATALOG["ACT_PHARMACY_SERVICING"]["source_refs"]),
            ]
        ),
        OrderedDict(
            [
                ("actingContextId", "AC_054_OPERATIONS_WATCH_V1"),
                ("staffIdentityContextRef", "SIC_054_OPS_PLATFORM_V1"),
                ("activeOrganisationRef", "org://vecells-ops"),
                ("activeOrganisationScopeRefs", ["org://alpha-practice", "org://beta-practice", "org://gamma-practice", "org://delta-practice", "org://central-ops", "org://south-ops"]),
                ("tenantScopeMode", "multi_tenant"),
                ("tenantScopeRefs", ["tenant://north-alpha", "tenant://north-beta", "tenant://midlands", "tenant://south"]),
                ("environmentRef", "env://prod"),
                ("policyPlaneRef", "policy://operational_control"),
                ("actingRoleRef", "role://ops_watch"),
                ("purposeOfUseRef", "purpose://operational_control"),
                ("audienceTierRef", "operations_control"),
                ("elevationState", "active"),
                ("breakGlassState", "eligible"),
                ("visibilityCoverageRef", "AVC_054_OPERATIONS_WATCH_V1"),
                ("minimumNecessaryContractRef", "MNC_054_OPERATIONS_WATCH_V1"),
                ("contextState", "current"),
                ("switchGeneration", 7),
                ("issuedAt", "2026-04-12T09:00:00+00:00"),
                ("expiresAt", "2026-04-12T10:30:00+00:00"),
                ("revokedAt", None),
                ("source_refs", PROFILE_CATALOG["ACT_OPERATIONS_WATCH"]["source_refs"]),
            ]
        ),
        OrderedDict(
            [
                ("actingContextId", "AC_054_GOVERNANCE_PLATFORM_V1"),
                ("staffIdentityContextRef", "SIC_054_GOVERNANCE_PLATFORM_V1"),
                ("activeOrganisationRef", "org://vecells-governance"),
                ("activeOrganisationScopeRefs", ["org://vecells-governance"]),
                ("tenantScopeMode", "platform"),
                ("tenantScopeRefs", ["tenant://north-alpha", "tenant://north-beta", "tenant://midlands", "tenant://south", "tenant://london", "tenant://east", "tenant://west", "tenant://national"]),
                ("environmentRef", "env://prod"),
                ("policyPlaneRef", "policy://governance_review"),
                ("actingRoleRef", "role://governance_release_manager"),
                ("purposeOfUseRef", "purpose://governance_review"),
                ("audienceTierRef", "governance_review"),
                ("elevationState", "active"),
                ("breakGlassState", "eligible"),
                ("visibilityCoverageRef", "AVC_054_GOVERNANCE_PLATFORM_V1"),
                ("minimumNecessaryContractRef", "MNC_054_GOVERNANCE_PLATFORM_V1"),
                ("contextState", "current"),
                ("switchGeneration", 14),
                ("issuedAt", "2026-04-12T09:05:00+00:00"),
                ("expiresAt", "2026-04-12T10:05:00+00:00"),
                ("revokedAt", None),
                ("source_refs", PROFILE_CATALOG["ACT_GOVERNANCE_PLATFORM"]["source_refs"]),
            ]
        ),
    ]


def tuple_record(
    acting_scope_tuple_id: str,
    staff_identity_context_ref: str,
    acting_context_ref: str,
    scope_mode: str,
    tenant_refs: list[str],
    organisation_refs: list[str],
    environment_ref: str,
    policy_plane_ref: str,
    purpose_of_use_ref: str,
    elevation_state: str,
    break_glass_state: str,
    required_visibility_coverage_refs: list[str],
    required_runtime_binding_refs: list[str],
    required_trust_refs: list[str],
    affected_tenant_count: int,
    affected_organisation_count: int,
    issued_at: str,
    expires_at: str,
    source_refs: list[str],
    rationale: str,
) -> OrderedDict[str, Any]:
    tuple_hash_input = OrderedDict(
        [
            ("staffIdentityContextRef", staff_identity_context_ref),
            ("actingContextRef", acting_context_ref),
            ("scopeMode", scope_mode),
            ("tenantRefs", tenant_refs),
            ("organisationRefs", organisation_refs),
            ("environmentRef", environment_ref),
            ("policyPlaneRef", policy_plane_ref),
            ("purposeOfUseRef", purpose_of_use_ref),
            ("elevationState", elevation_state),
            ("breakGlassState", break_glass_state),
            ("requiredVisibilityCoverageRefs", required_visibility_coverage_refs),
            ("requiredRuntimeBindingRefs", required_runtime_binding_refs),
            ("requiredTrustRefs", required_trust_refs),
            ("affectedTenantCount", affected_tenant_count),
            ("affectedOrganisationCount", affected_organisation_count),
        ]
    )
    return OrderedDict(
        [
            ("actingScopeTupleId", acting_scope_tuple_id),
            ("staffIdentityContextRef", staff_identity_context_ref),
            ("actingContextRef", acting_context_ref),
            ("scopeMode", scope_mode),
            ("tenantRefs", tenant_refs),
            ("organisationRefs", organisation_refs),
            ("environmentRef", environment_ref),
            ("policyPlaneRef", policy_plane_ref),
            ("purposeOfUseRef", purpose_of_use_ref),
            ("elevationState", elevation_state),
            ("breakGlassState", break_glass_state),
            ("requiredVisibilityCoverageRefs", required_visibility_coverage_refs),
            ("requiredRuntimeBindingRefs", required_runtime_binding_refs),
            ("requiredTrustRefs", required_trust_refs),
            ("affectedTenantCount", affected_tenant_count),
            ("affectedOrganisationCount", affected_organisation_count),
            ("tupleHashAlgorithm", "sha256:c14n_json_scope_tuple"),
            ("tupleHash", short_hash(tuple_hash_input)),
            ("issuanceMode", "acting_context_governor_issued"),
            ("supersessionMode", "append_only_supersede_prior_tuple"),
            ("freezeBehavior", "same_shell_mutation_frozen_until_revalidated"),
            ("issuedAt", issued_at),
            ("expiresAt", expires_at),
            ("source_refs", source_refs),
            ("rationale", rationale),
        ]
    )


def build_acting_scope_tuples() -> list[OrderedDict[str, Any]]:
    return [
        tuple_record(
            "AST_054_CLINICAL_WORKSPACE_V1",
            "SIC_054_CLINICAL_ALPHA_V1",
            "AC_054_CLINICAL_WORKSPACE_V1",
            "organisation",
            ["tenant://north-alpha"],
            ["org://alpha-practice"],
            "env://prod",
            "policy://care_delivery",
            "purpose://operational_care_delivery",
            "active",
            "eligible",
            ["AVC_054_STAFF_SINGLE_ORG_V1"],
            ["ASRB_050_CLINICAL_WORKSPACE_V1"],
            ["asr_runtime_topology_tuple", "RTFV_PROD_WORKSPACE_LIVE_V1"],
            1,
            1,
            "2026-04-12T08:35:00+00:00",
            "2026-04-12T12:35:00+00:00",
            PROFILE_CATALOG["ACT_STAFF_SINGLE_ORG"]["source_refs"],
            "Clinical workspace routes bind one current organisation-scoped tuple and freeze on any scope or visibility drift.",
        ),
        tuple_record(
            "AST_054_PRACTICE_OPS_V1",
            "SIC_054_PRACTICE_OPS_ALPHA_V1",
            "AC_054_PRACTICE_OPS_V1",
            "organisation",
            ["tenant://north-alpha"],
            ["org://alpha-practice"],
            "env://prod",
            "policy://care_delivery",
            "purpose://operational_care_delivery",
            "active",
            "eligible",
            ["AVC_054_STAFF_SINGLE_ORG_V1"],
            ["ASRB_050_CLINICAL_WORKSPACE_V1"],
            ["asr_runtime_topology_tuple", "RTFV_PROD_WORKSPACE_LIVE_V1"],
            1,
            1,
            "2026-04-12T08:40:00+00:00",
            "2026-04-12T12:40:00+00:00",
            PROFILE_CATALOG["ACT_STAFF_SINGLE_ORG"]["source_refs"],
            "Practice operations uses the same single-org scope law but with a distinct acting role and tuple hash.",
        ),
        tuple_record(
            "AST_054_SUPPORT_WORKSPACE_V1",
            "SIC_054_SUPPORT_PLATFORM_V1",
            "AC_054_SUPPORT_WORKSPACE_V1",
            "tenant",
            ["tenant://north-alpha"],
            ["org://alpha-practice"],
            "env://prod",
            "policy://support_service",
            "purpose://support_workflow",
            "active",
            "eligible",
            ["AVC_054_SUPPORT_WORKSPACE_V1"],
            ["ASRB_050_SUPPORT_WORKSPACE_V1"],
            ["asr_runtime_topology_tuple", "asr_restore_readiness", "RTFV_PROD_SUPPORT_LIVE_V1"],
            1,
            1,
            "2026-04-12T08:45:00+00:00",
            "2026-04-12T11:45:00+00:00",
            PROFILE_CATALOG["ACT_SUPPORT_TICKET_WORKSPACE"]["source_refs"],
            "Standard support ticket work uses one current tenant-scoped tuple and may not widen into replay or governance scope.",
        ),
        tuple_record(
            "AST_054_SUPPORT_ASSISTED_CAPTURE_V1",
            "SIC_054_SUPPORT_PLATFORM_V1",
            "AC_054_SUPPORT_ASSISTED_CAPTURE_V1",
            "tenant",
            ["tenant://north-alpha"],
            ["org://alpha-practice"],
            "env://prod",
            "policy://support_service",
            "purpose://support_assisted_capture",
            "active",
            "eligible",
            ["AVC_054_SUPPORT_ASSISTED_CAPTURE_V1"],
            ["ASRB_050_SUPPORT_WORKSPACE_V1"],
            ["asr_runtime_topology_tuple", "RTFV_PROD_SUPPORT_LIVE_V1"],
            1,
            1,
            "2026-04-12T08:47:00+00:00",
            "2026-04-12T11:47:00+00:00",
            PROFILE_CATALOG["ACT_SUPPORT_ASSISTED_CAPTURE"]["source_refs"],
            "Support-assisted capture reuses the support surface but stays purpose-bound and tuple-distinct from replay or governance work.",
        ),
        tuple_record(
            "AST_054_SUPPORT_REPLAY_V1",
            "SIC_054_SUPPORT_PLATFORM_V1",
            "AC_054_SUPPORT_REPLAY_V1",
            "tenant",
            ["tenant://north-alpha"],
            ["org://alpha-practice"],
            "env://prod",
            "policy://support_service",
            "purpose://support_recovery",
            "active",
            "active",
            ["AVC_054_SUPPORT_REPLAY_V1"],
            ["ASRB_050_SUPPORT_WORKSPACE_V1"],
            ["AEGS_053_CURRENT", "AGCV_053_CURRENT", "asr_restore_readiness"],
            1,
            1,
            "2026-04-12T08:49:00+00:00",
            "2026-04-12T10:49:00+00:00",
            PROFILE_CATALOG["ACT_SUPPORT_REPLAY_RESTORE"]["source_refs"],
            "Support replay restore must keep selected-anchor scope, evidence admissibility, and break-glass posture inside one exact tuple.",
        ),
        tuple_record(
            "AST_054_HUB_COORDINATION_V1",
            "SIC_054_HUB_NETWORK_V1",
            "AC_054_HUB_COORDINATION_V1",
            "organisation_group",
            ["tenant://north-alpha"],
            ["org://alpha-practice", "org://beta-practice", "org://gamma-practice", "org://delta-practice"],
            "env://prod",
            "policy://cross_org_coordination",
            "purpose://operational_care_delivery",
            "active",
            "eligible",
            ["AVC_054_HUB_CROSS_ORG_V1"],
            ["ASRB_050_HUB_DESK_V1"],
            ["asr_runtime_topology_tuple", "RTFV_PROD_HUB_LIVE_V1", "scope://hub/cross_org_visibility"],
            1,
            4,
            "2026-04-12T08:52:00+00:00",
            "2026-04-12T11:52:00+00:00",
            PROFILE_CATALOG["ACT_HUB_CROSS_ORG"]["source_refs"],
            "Hub coordination uses an explicit organisation-group tuple so cross-organisation visibility and mutation freeze together.",
        ),
        tuple_record(
            "AST_054_PHARMACY_SERVICING_V1",
            "SIC_054_PHARMACY_ALPHA_V1",
            "AC_054_PHARMACY_SERVICING_V1",
            "organisation",
            ["tenant://north-alpha"],
            ["org://alpha-pharmacy"],
            "env://prod",
            "policy://servicing_site_delivery",
            "purpose://operational_care_delivery",
            "active",
            "eligible",
            ["AVC_054_PHARMACY_SERVICING_V1"],
            ["ASRB_050_PHARMACY_CONSOLE_V1"],
            ["asr_runtime_topology_tuple", "RTFV_PROD_PHARMACY_LIVE_V1"],
            1,
            1,
            "2026-04-12T08:55:00+00:00",
            "2026-04-12T12:55:00+00:00",
            PROFILE_CATALOG["ACT_PHARMACY_SERVICING"]["source_refs"],
            "Servicing-site work binds one current tuple and may not widen through queue, support, or return-path convenience.",
        ),
        tuple_record(
            "AST_054_OPERATIONS_WATCH_V1",
            "SIC_054_OPS_PLATFORM_V1",
            "AC_054_OPERATIONS_WATCH_V1",
            "multi_tenant",
            ["tenant://north-alpha", "tenant://north-beta", "tenant://midlands", "tenant://south"],
            ["org://alpha-practice", "org://beta-practice", "org://gamma-practice", "org://delta-practice", "org://central-ops", "org://south-ops", "org://release-review", "org://governance"],
            "env://prod",
            "policy://operational_control",
            "purpose://operational_control",
            "active",
            "eligible",
            ["AVC_054_OPERATIONS_WATCH_V1"],
            ["ASRB_050_OPERATIONS_CONSOLE_V1"],
            ["RWT_PROD_V1", "WGS_PROD_V1", "RTFV_PROD_OPERATIONS_DIAGNOSTIC_V1"],
            4,
            8,
            "2026-04-12T09:00:00+00:00",
            "2026-04-12T10:30:00+00:00",
            PROFILE_CATALOG["ACT_OPERATIONS_WATCH"]["source_refs"],
            "Operations watch and intervention work remains broad-scope and must surface explicit blast radius before control settles.",
        ),
        tuple_record(
            "AST_054_GOVERNANCE_PLATFORM_V1",
            "SIC_054_GOVERNANCE_PLATFORM_V1",
            "AC_054_GOVERNANCE_PLATFORM_V1",
            "platform",
            ["tenant://north-alpha", "tenant://north-beta", "tenant://midlands", "tenant://south", "tenant://london", "tenant://east", "tenant://west", "tenant://national"],
            ["org://vecells-governance", "org://release-review", "org://north-hub", "org://alpha-practice", "org://beta-practice", "org://gamma-practice", "org://delta-practice", "org://alpha-pharmacy", "org://central-ops", "org://south-ops", "org://policy-review", "org://audit-review", "org://access-admin", "org://communications-admin", "org://platform-security", "org://platform-compliance", "org://tenant-admin", "org://regional-admin", "org://ops-control", "org://release-control", "org://authority-links", "org://service-desk", "org://business-owner", "org://risk-review", "org://board-observer", "org://incident-command", "org://restore-review", "org://watch-approver", "org://approval-a", "org://approval-b", "org://approval-c", "org://approval-d"],
            "env://prod",
            "policy://governance_review",
            "purpose://governance_review",
            "active",
            "eligible",
            ["AVC_054_GOVERNANCE_PLATFORM_V1"],
            ["ASRB_050_GOVERNANCE_ADMIN_V1"],
            ["GST_054_GOVERNANCE_PLATFORM_V1", "RWT_PROD_V1", "RTFV_PROD_GOVERNANCE_LIVE_V1"],
            8,
            32,
            "2026-04-12T09:05:00+00:00",
            "2026-04-12T10:05:00+00:00",
            PROFILE_CATALOG["ACT_GOVERNANCE_PLATFORM"]["source_refs"],
            "Governance and release control derive from one current tuple and one governance scope token with explicit blast radius.",
        ),
    ]


def governance_scope_token(tuple_row: dict[str, Any]) -> OrderedDict[str, Any]:
    token_hash_input = OrderedDict(
        [
            ("actingScopeTupleRef", tuple_row["actingScopeTupleId"]),
            ("tupleHash", tuple_row["tupleHash"]),
            ("tenantRefs", tuple_row["tenantRefs"]),
            ("organisationRefs", tuple_row["organisationRefs"]),
            ("environmentRef", tuple_row["environmentRef"]),
            ("policyPlaneRef", tuple_row["policyPlaneRef"]),
            ("purposeOfUseRef", tuple_row["purposeOfUseRef"]),
        ]
    )
    return OrderedDict(
        [
            ("governanceScopeTokenId", "GST_054_GOVERNANCE_PLATFORM_V1"),
            ("actingScopeTupleRef", tuple_row["actingScopeTupleId"]),
            ("scopeTupleHash", tuple_row["tupleHash"]),
            ("tenantRefs", tuple_row["tenantRefs"]),
            ("organisationRefs", tuple_row["organisationRefs"]),
            ("environmentRef", tuple_row["environmentRef"]),
            ("policyPlaneRef", tuple_row["policyPlaneRef"]),
            ("purposeOfUseRef", tuple_row["purposeOfUseRef"]),
            ("routeFamilyRefs", ["rf_governance_shell"]),
            ("affectedTenantCount", tuple_row["affectedTenantCount"]),
            ("affectedOrganisationCount", tuple_row["affectedOrganisationCount"]),
            ("tokenHash", short_hash(token_hash_input)),
            ("issuedAt", tuple_row["issuedAt"]),
            ("expiresAt", tuple_row["expiresAt"]),
            (
                "source_refs",
                [
                    "blueprint/governance-admin-console-frontend-blueprint.md#1A. GovernanceScopeToken",
                    "blueprint/platform-admin-and-config-blueprint.md#ConfigWorkspaceContext",
                    "blueprint/forensic-audit-findings.md#Finding 114",
                ],
            ),
            (
                "rationale",
                "Governance scope tokens are derived from the same ActingScopeTuple hash so governance scope cannot drift independently from live route authority.",
            ),
        ]
    )


def build_runtime_browser_bindings(context: dict[str, Any]) -> list[OrderedDict[str, Any]]:
    rows: list[OrderedDict[str, Any]] = []
    gateway_surfaces = context["gateway_surfaces"]
    for binding in context["frontend"]["audienceSurfaceRuntimeBindings"]:
        gateway_refs = binding["gatewaySurfaceRefs"]
        boundary_refs = ordered_unique(
            [
                boundary
                for gateway_ref in gateway_refs
                for boundary in gateway_surfaces[gateway_ref]["trustZoneBoundaryRefs"]
            ]
        )
        tenant_modes = ordered_unique(
            [gateway_surfaces[gateway_ref]["tenantIsolationMode"] for gateway_ref in gateway_refs]
        )
        rows.append(
            OrderedDict(
                [
                    ("runtimeBrowserAuthorityBindingId", authority_binding_id(binding["audienceSurfaceRuntimeBindingId"])),
                    ("audienceSurfaceRuntimeBindingRef", binding["audienceSurfaceRuntimeBindingId"]),
                    ("audienceSurface", binding["audienceSurface"]),
                    ("routeFamilyRefs", binding["routeFamilyRefs"]),
                    ("gatewaySurfaceRefs", gateway_refs),
                    ("tenantIsolationModes", tenant_modes),
                    ("bindingState", binding["bindingState"]),
                    ("surfaceAuthorityState", binding["surfaceAuthorityState"]),
                    ("requiredTrustZoneBoundaryRefs", boundary_refs),
                    (
                        "runtimeEnvironmentRefs",
                        [manifest["environment_ring"] for manifest in context["runtime"]["environment_manifests"]],
                    ),
                    (
                        "browserIsolationLaw",
                        "Browser route authority is valid only while the current AudienceSurfaceRuntimeBinding and published gateway surface set remain exact.",
                    ),
                    (
                        "runtimeIsolationLaw",
                        "Runtime topology, trust-zone crossings, gateway exposure, and tenant isolation stay bound to the same binding generation and may not be inferred separately.",
                    ),
                    (
                        "source_refs",
                        ordered_unique(
                            binding["source_refs"]
                            + ["data/analysis/gateway_bff_surfaces.json", "data/analysis/runtime_topology_manifest.json"]
                        ),
                    ),
                ]
            )
        )
    rows.sort(key=lambda row: row["audienceSurface"])
    return rows


def tuple_ref_for_gateway(gateway_surface_id: str) -> str:
    mapping = {
        "gws_clinician_workspace": "AST_054_CLINICAL_WORKSPACE_V1",
        "gws_clinician_workspace_child": "AST_054_CLINICAL_WORKSPACE_V1",
        "gws_practice_ops_workspace": "AST_054_PRACTICE_OPS_V1",
        "gws_support_ticket_workspace": "AST_054_SUPPORT_WORKSPACE_V1",
        "gws_support_assisted_capture": "AST_054_SUPPORT_ASSISTED_CAPTURE_V1",
        "gws_support_replay_observe": "AST_054_SUPPORT_REPLAY_V1",
        "gws_hub_queue": "AST_054_HUB_COORDINATION_V1",
        "gws_hub_case_management": "AST_054_HUB_COORDINATION_V1",
        "gws_pharmacy_console": "AST_054_PHARMACY_SERVICING_V1",
        "gws_operations_board": "AST_054_OPERATIONS_WATCH_V1",
        "gws_operations_drilldown": "AST_054_OPERATIONS_WATCH_V1",
        "gws_governance_shell": "AST_054_GOVERNANCE_PLATFORM_V1",
        "gws_assistive_sidecar": "AST_054_CLINICAL_WORKSPACE_V1",
    }
    return mapping.get(gateway_surface_id, "")


def profile_for_route(row: dict[str, str]) -> str:
    audience = row["audience"]
    gateway_surface_id = row["gateway_surface_id"]
    route_family_id = row["route_family_id"]
    if audience == "patient_public":
        return "ACT_PATIENT_PUBLIC_INTAKE"
    if route_family_id == "rf_patient_secure_link_recovery":
        return "ACT_PATIENT_GRANT_RECOVERY"
    if audience == "patient_authenticated":
        return "ACT_PATIENT_AUTHENTICATED"
    if audience == "patient_embedded_authenticated":
        return "ACT_PATIENT_EMBEDDED"
    if gateway_surface_id in {"gws_clinician_workspace", "gws_clinician_workspace_child", "gws_practice_ops_workspace"}:
        return "ACT_STAFF_SINGLE_ORG"
    if gateway_surface_id == "gws_support_ticket_workspace":
        return "ACT_SUPPORT_TICKET_WORKSPACE"
    if gateway_surface_id == "gws_support_assisted_capture":
        return "ACT_SUPPORT_ASSISTED_CAPTURE"
    if gateway_surface_id == "gws_support_replay_observe":
        return "ACT_SUPPORT_REPLAY_RESTORE"
    if gateway_surface_id in {"gws_hub_queue", "gws_hub_case_management"}:
        return "ACT_HUB_CROSS_ORG"
    if gateway_surface_id == "gws_pharmacy_console":
        return "ACT_PHARMACY_SERVICING"
    if gateway_surface_id in {"gws_operations_board", "gws_operations_drilldown"}:
        return "ACT_OPERATIONS_WATCH"
    if gateway_surface_id == "gws_governance_shell":
        return "ACT_GOVERNANCE_PLATFORM"
    if gateway_surface_id == "gws_assistive_sidecar":
        return "ACT_ASSISTIVE_ADJUNCT"
    raise KeyError(f"No scope profile mapping for {gateway_surface_id}.")


def counts_for_profile(profile_id: str) -> tuple[int, int, str]:
    if profile_id == "ACT_PATIENT_PUBLIC_INTAKE":
        return 0, 0, "pending_subject"
    if profile_id in {"ACT_PATIENT_GRANT_RECOVERY", "ACT_PATIENT_EMBEDDED"}:
        return 1, 1, "single_subject"
    if profile_id in {"ACT_PATIENT_AUTHENTICATED", "ACT_STAFF_SINGLE_ORG", "ACT_SUPPORT_TICKET_WORKSPACE", "ACT_SUPPORT_ASSISTED_CAPTURE", "ACT_SUPPORT_REPLAY_RESTORE", "ACT_PHARMACY_SERVICING"}:
        return 1, 1, "single_tenant"
    if profile_id == "ACT_HUB_CROSS_ORG":
        return 1, 4, "cross_org"
    if profile_id == "ACT_OPERATIONS_WATCH":
        return 4, 8, "multi_tenant"
    if profile_id == "ACT_GOVERNANCE_PLATFORM":
        return 8, 32, "platform"
    if profile_id == "ACT_ASSISTIVE_ADJUNCT":
        return 1, 1, "owner_scope"
    raise KeyError(profile_id)


def governance_scope_requirement(profile_id: str) -> str:
    return "required" if profile_id == "ACT_GOVERNANCE_PLATFORM" else "not_required"


def trust_refs_for_route(profile_id: str, tuple_lookup: dict[str, dict[str, Any]]) -> list[str]:
    if profile_id == "ACT_GOVERNANCE_PLATFORM":
        return tuple_lookup["AST_054_GOVERNANCE_PLATFORM_V1"]["requiredTrustRefs"]
    if profile_id == "ACT_OPERATIONS_WATCH":
        return tuple_lookup["AST_054_OPERATIONS_WATCH_V1"]["requiredTrustRefs"]
    if profile_id == "ACT_HUB_CROSS_ORG":
        return tuple_lookup["AST_054_HUB_COORDINATION_V1"]["requiredTrustRefs"]
    if profile_id == "ACT_PHARMACY_SERVICING":
        return tuple_lookup["AST_054_PHARMACY_SERVICING_V1"]["requiredTrustRefs"]
    if profile_id == "ACT_SUPPORT_TICKET_WORKSPACE":
        return tuple_lookup["AST_054_SUPPORT_WORKSPACE_V1"]["requiredTrustRefs"]
    if profile_id == "ACT_SUPPORT_ASSISTED_CAPTURE":
        return tuple_lookup["AST_054_SUPPORT_ASSISTED_CAPTURE_V1"]["requiredTrustRefs"]
    if profile_id == "ACT_SUPPORT_REPLAY_RESTORE":
        return tuple_lookup["AST_054_SUPPORT_REPLAY_V1"]["requiredTrustRefs"]
    if profile_id == "ACT_STAFF_SINGLE_ORG":
        return tuple_lookup["AST_054_CLINICAL_WORKSPACE_V1"]["requiredTrustRefs"]
    return []


def drift_state_for_profile(profile_id: str) -> str:
    mapping = {
        "ACT_PATIENT_PUBLIC_INTAKE": "placeholder_only",
        "ACT_PATIENT_GRANT_RECOVERY": "recovery_only",
        "ACT_PATIENT_AUTHENTICATED": "read_only",
        "ACT_PATIENT_EMBEDDED": "handoff_only",
        "ACT_STAFF_SINGLE_ORG": "stale_recoverable",
        "ACT_SUPPORT_TICKET_WORKSPACE": "read_only_same_shell",
        "ACT_SUPPORT_ASSISTED_CAPTURE": "capture_recovery_only",
        "ACT_SUPPORT_REPLAY_RESTORE": "masked_read_only",
        "ACT_HUB_CROSS_ORG": "summary_only",
        "ACT_PHARMACY_SERVICING": "read_only",
        "ACT_OPERATIONS_WATCH": "diagnostic_copy_only",
        "ACT_GOVERNANCE_PLATFORM": "handoff_only",
        "ACT_ASSISTIVE_ADJUNCT": "owner_scope_freeze",
    }
    return mapping[profile_id]


def same_shell_posture_for_profile(profile_id: str) -> str:
    mapping = {
        "ACT_PATIENT_PUBLIC_INTAKE": "placeholder_or_safe_receipt",
        "ACT_PATIENT_GRANT_RECOVERY": "recovery_only",
        "ACT_PATIENT_AUTHENTICATED": "read_only_or_recovery_only",
        "ACT_PATIENT_EMBEDDED": "handoff_only_or_read_only",
        "ACT_STAFF_SINGLE_ORG": "stale_recoverable_or_denied_scope",
        "ACT_SUPPORT_TICKET_WORKSPACE": "read_only_same_shell_until_revalidated",
        "ACT_SUPPORT_ASSISTED_CAPTURE": "capture_recovery_same_shell",
        "ACT_SUPPORT_REPLAY_RESTORE": "masked_replay_visible_but_restore_frozen",
        "ACT_HUB_CROSS_ORG": "summary_only_or_denied_scope",
        "ACT_PHARMACY_SERVICING": "read_only_or_blocked",
        "ACT_OPERATIONS_WATCH": "diagnostic_copy_only_or_controls_frozen",
        "ACT_GOVERNANCE_PLATFORM": "read_only_or_handoff_only",
        "ACT_ASSISTIVE_ADJUNCT": "freeze_with_owner_shell",
    }
    return mapping[profile_id]


def build_route_scope_rows(
    context: dict[str, Any],
    tuples: list[dict[str, Any]],
    runtime_browser_bindings: list[dict[str, Any]],
) -> list[OrderedDict[str, Any]]:
    tuple_lookup = {row["actingScopeTupleId"]: row for row in tuples}
    binding_lookup = {
        row["audienceSurfaceRuntimeBindingRef"]: row["runtimeBrowserAuthorityBindingId"]
        for row in runtime_browser_bindings
    }
    rows: list[OrderedDict[str, Any]] = []
    for route_row in context["route_rows"]:
        profile_id = profile_for_route(route_row)
        profile = PROFILE_CATALOG[profile_id]
        tuple_requirement = profile["tuple_requirement"]
        acting_scope_tuple_ref = tuple_ref_for_gateway(route_row["gateway_surface_id"])
        tuple_row = tuple_lookup.get(acting_scope_tuple_ref)
        runtime_binding_ids, audience_surface_refs = runtime_binding_for_route(
            context["frontend"],
            route_row["route_family_id"],
            route_row["gateway_surface_id"],
        )
        runtime_browser_binding_refs = [binding_lookup[binding_id] for binding_id in runtime_binding_ids]
        affected_tenant_count, affected_org_count, blast_radius_class = counts_for_profile(profile_id)
        if tuple_requirement == "required" and tuple_row is None:
            raise ValueError(f"Missing tuple for route {route_row['gateway_surface_id']}.")
        scope_tuple_hash = tuple_row["tupleHash"] if tuple_row else ""
        governance_requirement = governance_scope_requirement(profile_id)
        if route_row["gateway_surface_id"] == "gws_assistive_sidecar":
            governance_requirement = "not_required"
        rows.append(
            OrderedDict(
                [
                    (
                        "route_scope_requirement_id",
                        f"RSR_054_{route_row['gateway_surface_id'].upper()}_{route_row['route_family_id'].upper()}",
                    ),
                    ("route_family_id", route_row["route_family_id"]),
                    ("route_family", route_row["route_family"]),
                    ("gateway_surface_id", route_row["gateway_surface_id"]),
                    ("audience_surface_ref", route_row["audience_surface_ref"]),
                    ("audience", route_row["audience"]),
                    ("shell_type", route_row["shell_type"]),
                    ("route_group", route_group_for_row(route_row)),
                    ("scope_mode", profile["scope_mode"]),
                    ("tenant_isolation_mode", route_row["tenant_isolation_mode"]),
                    ("acting_scope_profile_id", profile_id),
                    ("acting_scope_tuple_requirement", tuple_requirement),
                    ("governance_scope_token_requirement", governance_requirement),
                    ("purpose_of_use_ref", profile["purpose_of_use_ref"]),
                    ("audience_visibility_coverage_ref", profile["visibility_ref"]),
                    ("minimum_necessary_contract_ref", profile["minimum_necessary_ref"]),
                    ("required_runtime_binding_refs", "; ".join(runtime_binding_ids)),
                    ("runtime_browser_authority_binding_refs", "; ".join(runtime_browser_binding_refs)),
                    ("required_trust_refs", "; ".join(trust_refs_for_route(profile_id, tuple_lookup))),
                    ("route_intent_binding_required", "yes" if tuple_requirement != "not_required" else "conditional"),
                    ("governing_object_version_required", "yes" if route_row["browser_visible"] == "yes" else "conditional"),
                    ("sample_acting_scope_tuple_ref", acting_scope_tuple_ref),
                    ("scope_tuple_hash", scope_tuple_hash),
                    ("affected_tenant_count", affected_tenant_count),
                    ("affected_organisation_count", affected_org_count),
                    ("blast_radius_class", blast_radius_class),
                    ("drift_state", drift_state_for_profile(profile_id)),
                    ("same_shell_freeze_posture", same_shell_posture_for_profile(profile_id)),
                    (
                        "writable_scope_rule",
                        (
                            "one_current_tuple_across_visibility_runtime_route_intent_and_object_version"
                            if tuple_requirement == "required"
                            else "browser_authority_tuple_only"
                        ),
                    ),
                    ("audience_surface_refs", "; ".join(audience_surface_refs)),
                    (
                        "source_refs",
                        "; ".join(
                            ordered_unique(
                                split_semicolon(route_row["source_refs"])
                                + profile["source_refs"]
                                + ["prompt/054.md"]
                            )
                        ),
                    ),
                    (
                        "rationale",
                        profile["rationale"],
                    ),
                ]
            )
        )
    rows.sort(
        key=lambda row: (
            row["shell_type"],
            row["audience"],
            row["route_family_id"],
            row["gateway_surface_id"],
        )
    )
    return rows


def build_tenant_isolation_modes(
    context: dict[str, Any],
    route_rows: list[dict[str, Any]],
    runtime_browser_bindings: list[dict[str, Any]],
    tuples: list[dict[str, Any]],
    staff_identity_contexts: list[dict[str, Any]],
    acting_contexts: list[dict[str, Any]],
    governance_tokens: list[dict[str, Any]],
) -> dict[str, Any]:
    modes: list[OrderedDict[str, Any]] = []
    grouped_routes: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in route_rows:
        grouped_routes[row["tenant_isolation_mode"]].append(row)

    legacy_tenant_lookup = {row["tenant_isolation_mode"]: row for row in context["legacy_tenant_rows"]}
    for mode, group_rows in sorted(grouped_routes.items()):
        legacy_row = legacy_tenant_lookup.get(mode)
        scope_modes = ordered_unique([row["scope_mode"] for row in group_rows])
        gateway_refs = ordered_unique([row["gateway_surface_id"] for row in group_rows])
        route_family_refs = ordered_unique([row["route_family_id"] for row in group_rows])
        binding_refs = ordered_unique(
            [
                ref
                for row in group_rows
                for ref in split_semicolon(row["runtime_browser_authority_binding_refs"])
            ]
        )
        affected_tenant_count = max(int(row["affected_tenant_count"]) for row in group_rows)
        affected_org_count = max(int(row["affected_organisation_count"]) for row in group_rows)
        tuple_requirement = ordered_unique([row["acting_scope_tuple_requirement"] for row in group_rows])
        modes.append(
            OrderedDict(
                [
                    ("tenantIsolationModeId", legacy_row["isolation_row_id"] if legacy_row else f"TIM_054_{mode.upper()}"),
                    ("tenantIsolationMode", mode),
                    ("scopeModes", scope_modes),
                    ("gatewaySurfaceRefs", gateway_refs),
                    ("routeFamilyRefs", route_family_refs),
                    ("runtimeBrowserAuthorityBindingRefs", binding_refs),
                    ("tupleRequirementModes", tuple_requirement),
                    ("browserAudienceRefs", ordered_unique([row["audience_surface_ref"] for row in group_rows])),
                    ("defaultBlastRadiusClass", max(group_rows, key=lambda row: row["affected_organisation_count"])["blast_radius_class"]),
                    ("defaultAffectedTenantCount", affected_tenant_count),
                    ("defaultAffectedOrganisationCount", affected_org_count),
                    (
                        "browserIsolationLaw",
                        "Browser surfaces remain lawful only through the published runtime binding and current route-to-scope requirement row for this isolation mode.",
                    ),
                    (
                        "runtimeIsolationLaw",
                        "Gateway surface, trust-zone boundaries, runtime binding, and tenant-isolation mode must agree; no shell-local selector may widen them.",
                    ),
                    (
                        "driftFreezeLaw",
                        "Any change to organisation scope, tenant scope, purpose, policy plane, visibility, elevation, or break-glass posture supersedes the current tuple and freezes mutation in place.",
                    ),
                    (
                        "source_refs",
                        ordered_unique(
                            split_semicolon(legacy_row["source_refs"]) if legacy_row else []
                            + ["prompt/054.md", "blueprint/forensic-audit-findings.md#Finding 114"]
                        ),
                    ),
                ]
            )
        )

    broad_scope_route_count = sum(
        1
        for row in route_rows
        if row["blast_radius_class"] in {"cross_org", "multi_tenant", "platform"}
    )
    return {
        "task_id": TASK_ID,
        "generated_at": TIMESTAMP,
        "captured_on": CAPTURED_ON,
        "visual_mode": VISUAL_MODE,
        "mission": MISSION,
        "source_precedence": SOURCE_PRECEDENCE,
        "upstream_inputs": {
            "legacy_tenant_isolation_row_count": len(context["legacy_tenant_rows"]),
            "legacy_scope_profile_row_count": len(context["legacy_scope_rows"]),
            "runtime_environment_manifest_count": len(context["runtime"]["environment_manifests"]),
            "gateway_surface_count": len(context["gateway"]["gateway_surfaces"]),
            "frontend_runtime_binding_count": len(context["frontend"]["audienceSurfaceRuntimeBindings"]),
            "release_watch_tuple_count": len(context["release"]["releaseWatchTuples"]),
            "audit_record_count": context["audit"]["summary"]["audit_record_count"],
        },
        "summary": {
            "tenant_isolation_mode_count": len(modes),
            "scope_profile_count": len(PROFILE_CATALOG),
            "staff_identity_context_count": len(staff_identity_contexts),
            "acting_context_count": len(acting_contexts),
            "acting_scope_tuple_count": len(tuples),
            "governance_scope_token_count": len(governance_tokens),
            "runtime_browser_binding_count": len(runtime_browser_bindings),
            "route_scope_requirement_count": len(route_rows),
            "broad_scope_route_count": broad_scope_route_count,
        },
        "assumptions": ASSUMPTIONS,
        "defects": DEFECTS,
        "scopeProfileCatalog": [
            OrderedDict(
                [
                    ("actingScopeProfileId", key),
                    ("displayName", value["display_name"]),
                    ("tupleRequirement", value["tuple_requirement"]),
                    ("scopeMode", value["scope_mode"]),
                    ("purposeOfUseRef", value["purpose_of_use_ref"]),
                    ("visibilityCoverageRef", value["visibility_ref"]),
                    ("minimumNecessaryContractRef", value["minimum_necessary_ref"]),
                    ("driftTriggers", value["drift_triggers"]),
                    ("driftPosture", value["drift_posture"]),
                    ("blastRadiusClass", value["blast_radius_class"]),
                    ("source_refs", value["source_refs"]),
                    ("rationale", value["rationale"]),
                ]
            )
            for key, value in sorted(PROFILE_CATALOG.items())
        ],
        "tenantIsolationModes": modes,
        "staffIdentityContexts": staff_identity_contexts,
        "actingContexts": acting_contexts,
        "actingScopeTuples": tuples,
        "governanceScopeTokenBindings": governance_tokens,
        "runtimeBrowserAuthorityBindings": runtime_browser_bindings,
    }


def build_drift_trigger_payload(
    route_scope_rows: list[dict[str, Any]],
    tuples: list[dict[str, Any]],
) -> dict[str, Any]:
    tuple_lookup = {row["actingScopeTupleId"]: row for row in tuples}
    trigger_policies = [
        OrderedDict(
            [
                ("driftTriggerId", f"DTP_054_{change_class.upper()}"),
                ("detectedChangeClass", change_class),
                (
                    "label",
                    change_class.replace("_", " "),
                ),
                (
                    "invalidatedFields",
                    {
                        "organisation_switch": ["organisationRefs", "activeOrganisationRef", "switchGeneration"],
                        "tenant_scope_change": ["tenantRefs", "tenantScopeRefs", "affectedTenantCount"],
                        "environment_change": ["environmentRef", "requiredRuntimeBindingRefs"],
                        "policy_plane_change": ["policyPlaneRef", "requiredTrustRefs"],
                        "purpose_of_use_change": ["purposeOfUseRef", "minimumNecessaryContractRef"],
                        "elevation_expired": ["elevationState", "requiredTrustRefs"],
                        "break_glass_revoked": ["breakGlassState", "requiredVisibilityCoverageRefs"],
                        "visibility_contract_drift": ["requiredVisibilityCoverageRefs", "minimumNecessaryContractRef"],
                    }[change_class],
                ),
                (
                    "sameShellFreezeDisposition",
                    {
                        "organisation_switch": "stale_recoverable",
                        "tenant_scope_change": "stale_recoverable",
                        "environment_change": "denied_scope",
                        "policy_plane_change": "handoff_only",
                        "purpose_of_use_change": "read_only_same_shell",
                        "elevation_expired": "controls_frozen_same_shell",
                        "break_glass_revoked": "masked_read_only",
                        "visibility_contract_drift": "summary_only",
                    }[change_class],
                ),
                ("requiresTupleSupersession", True),
                ("requiresFreshRouteIntentBinding", True),
                (
                    "requiredRevalidationRefs",
                    [
                        "ActingScopeTuple",
                        "AudienceVisibilityCoverage",
                        "MinimumNecessaryContract",
                        "AudienceSurfaceRuntimeBinding",
                        "RouteIntentBinding",
                    ],
                ),
                (
                    "source_refs",
                    [
                        "prompt/054.md",
                        "blueprint/phase-0-the-foundation-protocol.md#ActingContextDriftRecord",
                        "blueprint/phase-0-the-foundation-protocol.md#23B",
                    ],
                ),
            ]
        )
        for change_class in MANDATORY_DRIFT_CLASSES
    ]
    sample_records = [
        OrderedDict(
            [
                ("actingContextDriftRecordId", "DCR_054_CLINICAL_ORG_SWITCH_V1"),
                ("priorActingContextRef", "AC_054_CLINICAL_WORKSPACE_V1"),
                ("priorActingScopeTupleRef", "AST_054_CLINICAL_WORKSPACE_V1"),
                ("detectedChangeClass", "organisation_switch"),
                ("affectedRouteIntentRefs", ["rib::workspace::task::alpha-114"]),
                ("affectedLeaseRefs", ["lease::workspace::alpha-114"]),
                ("recoveryDispositionRef", "RRD_WORKSPACE_CHILD_RECOVERY_ONLY"),
                ("detectedAt", "2026-04-12T09:12:00+00:00"),
                ("resolvedAt", None),
                ("freezeState", "mutation_frozen_same_shell"),
                ("source_refs", ["prompt/054.md", "blueprint/forensic-audit-findings.md#Finding 114"]),
            ]
        ),
        OrderedDict(
            [
                ("actingContextDriftRecordId", "DCR_054_OPERATIONS_TENANT_SCOPE_V1"),
                ("priorActingContextRef", "AC_054_OPERATIONS_WATCH_V1"),
                ("priorActingScopeTupleRef", "AST_054_OPERATIONS_WATCH_V1"),
                ("detectedChangeClass", "tenant_scope_change"),
                ("affectedRouteIntentRefs", ["rib::ops::incident::wave-7"]),
                ("affectedLeaseRefs", ["lease::ops::incident::wave-7"]),
                ("recoveryDispositionRef", "RRD_OPERATIONS_BOARD_FROZEN"),
                ("detectedAt", "2026-04-12T09:14:00+00:00"),
                ("resolvedAt", None),
                ("freezeState", "mutation_frozen_same_shell"),
                ("source_refs", ["prompt/054.md", "blueprint/phase-0-the-foundation-protocol.md#44E"]),
            ]
        ),
        OrderedDict(
            [
                ("actingContextDriftRecordId", "DCR_054_GOVERNANCE_ENVIRONMENT_V1"),
                ("priorActingContextRef", "AC_054_GOVERNANCE_PLATFORM_V1"),
                ("priorActingScopeTupleRef", "AST_054_GOVERNANCE_PLATFORM_V1"),
                ("detectedChangeClass", "environment_change"),
                ("affectedRouteIntentRefs", ["rib::governance::release::candidate-3"]),
                ("affectedLeaseRefs", ["lease::governance::release::candidate-3"]),
                ("recoveryDispositionRef", "RRD_GOVERNANCE_HANDOFF_ONLY"),
                ("detectedAt", "2026-04-12T09:16:00+00:00"),
                ("resolvedAt", None),
                ("freezeState", "mutation_frozen_same_shell"),
                ("source_refs", ["prompt/054.md", "blueprint/platform-admin-and-config-blueprint.md#ConfigWorkspaceContext"]),
            ]
        ),
        OrderedDict(
            [
                ("actingContextDriftRecordId", "DCR_054_GOVERNANCE_POLICY_PLANE_V1"),
                ("priorActingContextRef", "AC_054_GOVERNANCE_PLATFORM_V1"),
                ("priorActingScopeTupleRef", "AST_054_GOVERNANCE_PLATFORM_V1"),
                ("detectedChangeClass", "policy_plane_change"),
                ("affectedRouteIntentRefs", ["rib::governance::authority-links::batch-9"]),
                ("affectedLeaseRefs", ["lease::governance::authority-links::batch-9"]),
                ("recoveryDispositionRef", "RRD_GOVERNANCE_READ_ONLY"),
                ("detectedAt", "2026-04-12T09:18:00+00:00"),
                ("resolvedAt", None),
                ("freezeState", "mutation_frozen_same_shell"),
                ("source_refs", ["prompt/054.md", "blueprint/governance-admin-console-frontend-blueprint.md#Governance operating law"]),
            ]
        ),
        OrderedDict(
            [
                ("actingContextDriftRecordId", "DCR_054_SUPPORT_PURPOSE_CHANGE_V1"),
                ("priorActingContextRef", "AC_054_SUPPORT_ASSISTED_CAPTURE_V1"),
                ("priorActingScopeTupleRef", "AST_054_SUPPORT_ASSISTED_CAPTURE_V1"),
                ("detectedChangeClass", "purpose_of_use_change"),
                ("affectedRouteIntentRefs", ["rib::support::ticket::capture-44"]),
                ("affectedLeaseRefs", ["lease::support::ticket::capture-44"]),
                ("recoveryDispositionRef", "RRD_SUPPORT_CAPTURE_RECOVERY"),
                ("detectedAt", "2026-04-12T09:20:00+00:00"),
                ("resolvedAt", None),
                ("freezeState", "mutation_frozen_same_shell"),
                ("source_refs", ["prompt/054.md", "blueprint/phase-0-the-foundation-protocol.md#23B"]),
            ]
        ),
        OrderedDict(
            [
                ("actingContextDriftRecordId", "DCR_054_OPS_ELEVATION_EXPIRED_V1"),
                ("priorActingContextRef", "AC_054_OPERATIONS_WATCH_V1"),
                ("priorActingScopeTupleRef", "AST_054_OPERATIONS_WATCH_V1"),
                ("detectedChangeClass", "elevation_expired"),
                ("affectedRouteIntentRefs", ["rib::ops::resilience::restore-2"]),
                ("affectedLeaseRefs", ["lease::ops::resilience::restore-2"]),
                ("recoveryDispositionRef", "RRD_RESILIENCE_CONTROL_FROZEN"),
                ("detectedAt", "2026-04-12T09:22:00+00:00"),
                ("resolvedAt", None),
                ("freezeState", "controls_frozen_same_shell"),
                ("source_refs", ["prompt/054.md", "blueprint/platform-runtime-and-release-blueprint.md#ReleaseWatchTuple"]),
            ]
        ),
        OrderedDict(
            [
                ("actingContextDriftRecordId", "DCR_054_SUPPORT_BREAK_GLASS_REVOKED_V1"),
                ("priorActingContextRef", "AC_054_SUPPORT_REPLAY_V1"),
                ("priorActingScopeTupleRef", "AST_054_SUPPORT_REPLAY_V1"),
                ("detectedChangeClass", "break_glass_revoked"),
                ("affectedRouteIntentRefs", ["rib::support::replay::ticket-11"]),
                ("affectedLeaseRefs", ["lease::support::replay::ticket-11"]),
                ("recoveryDispositionRef", "RRD_SUPPORT_REPLAY_RESTORE_FROZEN"),
                ("detectedAt", "2026-04-12T09:24:00+00:00"),
                ("resolvedAt", None),
                ("freezeState", "masked_read_only"),
                ("source_refs", ["prompt/054.md", "blueprint/phase-9-the-assurance-ledger.md#9C. Audit explorer, break-glass review, and support replay"]),
            ]
        ),
        OrderedDict(
            [
                ("actingContextDriftRecordId", "DCR_054_HUB_VISIBILITY_DRIFT_V1"),
                ("priorActingContextRef", "AC_054_HUB_COORDINATION_V1"),
                ("priorActingScopeTupleRef", "AST_054_HUB_COORDINATION_V1"),
                ("detectedChangeClass", "visibility_contract_drift"),
                ("affectedRouteIntentRefs", ["rib::hub::case::north-33"]),
                ("affectedLeaseRefs", ["lease::hub::case::north-33"]),
                ("recoveryDispositionRef", "RRD_HUB_CASE_RECOVERY_ONLY"),
                ("detectedAt", "2026-04-12T09:26:00+00:00"),
                ("resolvedAt", None),
                ("freezeState", "summary_only"),
                ("source_refs", ["prompt/054.md", "blueprint/forensic-audit-findings.md#Finding 114"]),
            ]
        ),
    ]
    freeze_rules = []
    for route_row in route_scope_rows:
        tuple_ref = route_row["sample_acting_scope_tuple_ref"]
        if not tuple_ref:
            continue
        tuple_row = tuple_lookup[tuple_ref]
        freeze_rules.append(
            OrderedDict(
                [
                    ("routeScopeRequirementId", route_row["route_scope_requirement_id"]),
                    ("routeFamilyId", route_row["route_family_id"]),
                    ("gatewaySurfaceId", route_row["gateway_surface_id"]),
                    ("actingScopeTupleRef", tuple_ref),
                    ("scopeTupleHash", tuple_row["tupleHash"]),
                    ("driftState", route_row["drift_state"]),
                    ("sameShellFreezePosture", route_row["same_shell_freeze_posture"]),
                    ("requiresFreshTuple", route_row["acting_scope_tuple_requirement"] in {"required", "inherited_owner"}),
                    ("source_refs", split_semicolon(route_row["source_refs"])),
                ]
            )
        )
    return {
        "task_id": TASK_ID,
        "generated_at": TIMESTAMP,
        "captured_on": CAPTURED_ON,
        "visual_mode": VISUAL_MODE,
        "mission": MISSION,
        "source_precedence": SOURCE_PRECEDENCE,
        "summary": {
            "drift_trigger_count": len(trigger_policies),
            "sample_drift_record_count": len(sample_records),
            "frozen_route_count": len(freeze_rules),
        },
        "driftTriggerPolicies": trigger_policies,
        "sampleDriftRecords": sample_records,
        "sameShellFreezeRules": freeze_rules,
    }


def build_surface_blast_rows(route_scope_rows: list[dict[str, Any]]) -> list[OrderedDict[str, Any]]:
    grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in route_scope_rows:
        grouped[row["gateway_surface_id"]].append(row)
    rows: list[OrderedDict[str, Any]] = []
    for gateway_surface_id, group_rows in sorted(grouped.items()):
        lead_row = sorted(group_rows, key=lambda row: row["route_scope_requirement_id"])[0]
        rows.append(
            OrderedDict(
                [
                    ("surface_blast_radius_id", f"SBR_054_{gateway_surface_id.upper()}"),
                    ("gateway_surface_id", gateway_surface_id),
                    ("audience", lead_row["audience"]),
                    ("shell_type", lead_row["shell_type"]),
                    ("route_family_ids", "; ".join(ordered_unique([row["route_family_id"] for row in group_rows]))),
                    ("tenant_isolation_mode", lead_row["tenant_isolation_mode"]),
                    ("scope_mode", lead_row["scope_mode"]),
                    ("acting_scope_tuple_requirement", lead_row["acting_scope_tuple_requirement"]),
                    ("governance_scope_token_requirement", lead_row["governance_scope_token_requirement"]),
                    ("affected_tenant_count", max(int(row["affected_tenant_count"]) for row in group_rows)),
                    ("affected_organisation_count", max(int(row["affected_organisation_count"]) for row in group_rows)),
                    ("blast_radius_class", lead_row["blast_radius_class"]),
                    (
                        "pre_settlement_display_required",
                        "yes"
                        if lead_row["blast_radius_class"] in {"cross_org", "multi_tenant", "platform"}
                        else "bounded_single_scope",
                    ),
                    ("same_shell_freeze_posture", lead_row["same_shell_freeze_posture"]),
                    (
                        "runtime_browser_authority_binding_refs",
                        "; ".join(
                            ordered_unique(
                                [
                                    ref
                                    for row in group_rows
                                    for ref in split_semicolon(row["runtime_browser_authority_binding_refs"])
                                ]
                            )
                        ),
                    ),
                    ("source_refs", lead_row["source_refs"]),
                ]
            )
        )
    return rows


def build_schema() -> dict[str, Any]:
    scalar_array = {"type": "array", "items": {"type": "string"}}
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://vecells.example/schemas/acting-scope-tuple.schema.json",
        "title": "Vecells staff acting scope authority schema",
        "type": "object",
        "required": ["staffIdentityContext", "actingContext", "actingScopeTuple", "actingContextDriftRecord"],
        "properties": {
            "staffIdentityContext": {"$ref": "#/$defs/staffIdentityContext"},
            "actingContext": {"$ref": "#/$defs/actingContext"},
            "actingScopeTuple": {"$ref": "#/$defs/actingScopeTuple"},
            "actingContextDriftRecord": {"$ref": "#/$defs/actingContextDriftRecord"},
        },
        "$defs": {
            "staffIdentityContext": {
                "type": "object",
                "required": [
                    "staffIdentityContextId",
                    "staffUserId",
                    "homeOrganisationRef",
                    "affiliatedOrganisationRefs",
                    "tenantGrantRefs",
                    "nationalRbacRefs",
                    "localRoleRefs",
                    "sessionAssurance",
                    "identityState",
                    "authenticatedAt",
                    "expiresAt",
                ],
                "properties": {
                    "staffIdentityContextId": {"type": "string"},
                    "staffUserId": {"type": "string"},
                    "homeOrganisationRef": {"type": "string"},
                    "affiliatedOrganisationRefs": scalar_array,
                    "tenantGrantRefs": scalar_array,
                    "nationalRbacRefs": scalar_array,
                    "localRoleRefs": scalar_array,
                    "sessionAssurance": {"type": "string"},
                    "identityState": {"type": "string", "enum": ["authenticated", "reauth_required", "revoked"]},
                    "authenticatedAt": {"type": "string"},
                    "expiresAt": {"type": "string"},
                },
            },
            "actingContext": {
                "type": "object",
                "required": [
                    "actingContextId",
                    "staffIdentityContextRef",
                    "activeOrganisationRef",
                    "activeOrganisationScopeRefs",
                    "tenantScopeMode",
                    "tenantScopeRefs",
                    "environmentRef",
                    "policyPlaneRef",
                    "actingRoleRef",
                    "purposeOfUseRef",
                    "audienceTierRef",
                    "elevationState",
                    "breakGlassState",
                    "visibilityCoverageRef",
                    "minimumNecessaryContractRef",
                    "contextState",
                    "switchGeneration",
                    "issuedAt",
                    "expiresAt",
                ],
                "properties": {
                    "actingContextId": {"type": "string"},
                    "staffIdentityContextRef": {"type": "string"},
                    "activeOrganisationRef": {"type": "string"},
                    "activeOrganisationScopeRefs": scalar_array,
                    "tenantScopeMode": {
                        "type": "string",
                        "enum": ["single_tenant", "organisation_group", "multi_tenant", "platform"],
                    },
                    "tenantScopeRefs": scalar_array,
                    "environmentRef": {"type": "string"},
                    "policyPlaneRef": {"type": "string"},
                    "actingRoleRef": {"type": "string"},
                    "purposeOfUseRef": {"type": "string"},
                    "audienceTierRef": {"type": "string"},
                    "elevationState": {"type": "string", "enum": ["none", "requested", "active", "expiring", "revoked"]},
                    "breakGlassState": {"type": "string", "enum": ["forbidden", "eligible", "active", "expiring", "revoked"]},
                    "visibilityCoverageRef": {"type": "string"},
                    "minimumNecessaryContractRef": {"type": "string"},
                    "contextState": {"type": "string", "enum": ["current", "stale", "blocked", "superseded"]},
                    "switchGeneration": {"type": "integer"},
                    "issuedAt": {"type": "string"},
                    "expiresAt": {"type": "string"},
                    "revokedAt": {"type": ["string", "null"]},
                },
            },
            "actingScopeTuple": {
                "type": "object",
                "required": [
                    "actingScopeTupleId",
                    "staffIdentityContextRef",
                    "actingContextRef",
                    "scopeMode",
                    "tenantRefs",
                    "organisationRefs",
                    "environmentRef",
                    "policyPlaneRef",
                    "purposeOfUseRef",
                    "elevationState",
                    "breakGlassState",
                    "requiredVisibilityCoverageRefs",
                    "requiredRuntimeBindingRefs",
                    "requiredTrustRefs",
                    "affectedTenantCount",
                    "affectedOrganisationCount",
                    "tupleHash",
                    "issuedAt",
                    "expiresAt",
                ],
                "properties": {
                    "actingScopeTupleId": {"type": "string"},
                    "staffIdentityContextRef": {"type": "string"},
                    "actingContextRef": {"type": "string"},
                    "scopeMode": {"type": "string", "enum": ["tenant", "organisation", "organisation_group", "multi_tenant", "platform"]},
                    "tenantRefs": scalar_array,
                    "organisationRefs": scalar_array,
                    "environmentRef": {"type": "string"},
                    "policyPlaneRef": {"type": "string"},
                    "purposeOfUseRef": {"type": "string"},
                    "elevationState": {"type": "string"},
                    "breakGlassState": {"type": "string"},
                    "requiredVisibilityCoverageRefs": scalar_array,
                    "requiredRuntimeBindingRefs": scalar_array,
                    "requiredTrustRefs": scalar_array,
                    "affectedTenantCount": {"type": "integer"},
                    "affectedOrganisationCount": {"type": "integer"},
                    "tupleHashAlgorithm": {"type": "string"},
                    "tupleHash": {"type": "string"},
                    "issuanceMode": {"type": "string"},
                    "supersessionMode": {"type": "string"},
                    "freezeBehavior": {"type": "string"},
                    "issuedAt": {"type": "string"},
                    "expiresAt": {"type": "string"},
                },
            },
            "actingContextDriftRecord": {
                "type": "object",
                "required": [
                    "actingContextDriftRecordId",
                    "priorActingContextRef",
                    "priorActingScopeTupleRef",
                    "detectedChangeClass",
                    "affectedRouteIntentRefs",
                    "affectedLeaseRefs",
                    "recoveryDispositionRef",
                    "detectedAt",
                ],
                "properties": {
                    "actingContextDriftRecordId": {"type": "string"},
                    "priorActingContextRef": {"type": "string"},
                    "priorActingScopeTupleRef": {"type": "string"},
                    "detectedChangeClass": {"type": "string", "enum": MANDATORY_DRIFT_CLASSES},
                    "affectedRouteIntentRefs": scalar_array,
                    "affectedLeaseRefs": scalar_array,
                    "recoveryDispositionRef": {"type": "string"},
                    "detectedAt": {"type": "string"},
                    "resolvedAt": {"type": ["string", "null"]},
                    "freezeState": {"type": "string"},
                },
            },
        },
    }


def build_tenant_strategy_doc(payload: dict[str, Any], route_rows: list[dict[str, Any]], blast_rows: list[dict[str, Any]]) -> str:
    broad_rows = [
        row
        for row in blast_rows
        if row["blast_radius_class"] in {"cross_org", "multi_tenant", "platform"}
    ]
    mode_lines = "\n".join(
        f"| `{row['tenantIsolationModeId']}` | `{row['tenantIsolationMode']}` | `{', '.join(row['scopeModes'])}` | `{row['defaultAffectedTenantCount']}` | `{row['defaultAffectedOrganisationCount']}` |"
        for row in payload["tenantIsolationModes"]
    )
    return dedent(
        f"""
        # 54 Tenant Isolation Strategy

        `seq_054` publishes one current tenant-isolation and acting-scope authority model for Vecells. Runtime topology, gateway exposure, browser route authority, purpose-of-use, and blast radius are explicitly bound together instead of being reconstructed from remembered selectors, ambient roles, or detached governance scope.

        ## Summary

        - Tenant isolation modes: {payload['summary']['tenant_isolation_mode_count']}
        - Runtime-browser authority bindings: {payload['summary']['runtime_browser_binding_count']}
        - Route scope requirement rows: {payload['summary']['route_scope_requirement_count']}
        - Broad-scope routes: {payload['summary']['broad_scope_route_count']}

        ## Isolation modes

        | Mode ID | Tenant isolation mode | Scope modes | Default tenant count | Default organisation count |
        | --- | --- | --- | --- | --- |
        {mode_lines}

        ## Runtime/browser binding law

        - Runtime topology and browser authority now meet at one generated runtime-browser authority binding for every published audience surface.
        - A route cannot remain writable if tenant isolation, trust-zone boundaries, runtime binding, visibility coverage, minimum-necessary contract, route intent, and governing object version no longer resolve the same tuple.
        - Governance, support, hub, servicing-site, and cross-organisation work require one current `ActingScopeTuple`; governance also requires one current `GovernanceScopeToken`.

        ## Broad-scope surfaces

        {chr(10).join(f"- `{row['gateway_surface_id']}` surfaces `{row['affected_tenant_count']}` tenants and `{row['affected_organisation_count']}` organisations before mutation may settle." for row in broad_rows)}

        ## Mandatory gap closures

        - Finding 114 is closed by deriving governance scope tokens, hub work, support replay, and release blast radius from one shared tuple hash.
        - Organisation switching, purpose-of-use drift, environment drift, policy-plane drift, elevation expiry, break-glass revocation, and visibility drift now supersede the tuple and freeze same-shell mutation.
        - Browser surfaces no longer tell a different isolation story than gateways and runtime topology; the route matrix and authority bindings point back to the same tenant-isolation contract.
        - Multi-tenant and platform-scoped work can no longer imply blast radius from a route family name, watch cohort, or dashboard label; affected counts are explicit fields.

        ## Source anchors

        - `prompt/054.md`
        - `blueprint/phase-0-the-foundation-protocol.md#StaffIdentityContext`
        - `blueprint/phase-0-the-foundation-protocol.md#ActingScopeTuple`
        - `blueprint/phase-0-the-foundation-protocol.md#23A`
        - `blueprint/phase-0-the-foundation-protocol.md#23B`
        - `blueprint/phase-0-the-foundation-protocol.md#44D`
        - `blueprint/phase-0-the-foundation-protocol.md#44E`
        - `blueprint/platform-runtime-and-release-blueprint.md#RuntimeTopologyManifest`
        - `blueprint/platform-runtime-and-release-blueprint.md#AudienceSurfaceRuntimeBinding`
        - `blueprint/forensic-audit-findings.md#Finding 114`
        """
    ).strip() + "\n"


def build_scope_model_doc(payload: dict[str, Any], drift_payload: dict[str, Any]) -> str:
    tuple_lines = "\n".join(
        f"| `{row['actingScopeTupleId']}` | `{row['scopeMode']}` | `{row['affectedTenantCount']}` | `{row['affectedOrganisationCount']}` | `{row['tupleHash']}` |"
        for row in payload["actingScopeTuples"]
    )
    drift_lines = "\n".join(
        f"| `{row['detectedChangeClass']}` | `{row['sameShellFreezeDisposition']}` | `yes` |"
        for row in drift_payload["driftTriggerPolicies"]
    )
    return dedent(
        f"""
        # 54 Acting Scope Tuple Model

        The `ActingScopeTuple` is the machine-checkable fence that binds staff identity, acting context, tenant scope, organisation scope, environment, policy plane, purpose-of-use, elevation, break-glass posture, required visibility coverage, runtime binding, trust, and blast radius into one authority row.

        ## Hash semantics

        - `tupleHashAlgorithm = sha256:c14n_json_scope_tuple`
        - The hash covers staff identity ref, acting context ref, scope mode, tenant refs, organisation refs, environment, policy plane, purpose-of-use, elevation state, break-glass state, required visibility coverage refs, required runtime binding refs, required trust refs, and affected counts.
        - Tuple supersession is append-only. Drift does not mutate the old tuple; it writes `ActingContextDriftRecord`, freezes writable posture, and requires a fresh tuple.

        ## Sample tuples

        | Tuple | Scope mode | Tenant count | Organisation count | Tuple hash |
        | --- | --- | --- | --- | --- |
        {tuple_lines}

        ## Drift and freeze

        | Drift trigger | Same-shell freeze disposition | Fresh tuple required |
        | --- | --- | --- |
        {drift_lines}

        ## Route law

        - Any writable governance, support, hub, servicing-site, or cross-organisation route must bind the same current tuple across `AudienceVisibilityCoverage`, `MinimumNecessaryContract`, runtime binding, route intent, and governing object version.
        - Assistive adjunct routes inherit the owner shell tuple and must freeze whenever the owner tuple or rollout cohort drifts.
        - Patient and public routes remain browser-authority-bound rather than staff-tuple-bound, but they still fail closed on runtime, grant, or channel drift.

        ## Source anchors

        - `prompt/054.md`
        - `blueprint/phase-0-the-foundation-protocol.md#ActingContext`
        - `blueprint/phase-0-the-foundation-protocol.md#ActingScopeTuple`
        - `blueprint/phase-0-the-foundation-protocol.md#ActingContextDriftRecord`
        - `blueprint/phase-0-the-foundation-protocol.md#2.6A ActingContextGovernor`
        - `blueprint/phase-0-the-foundation-protocol.md#44D`
        - `blueprint/governance-admin-console-frontend-blueprint.md#1A. GovernanceScopeToken`
        """
    ).strip() + "\n"


def build_atlas_html() -> str:
    return dedent(
        """
        <!doctype html>
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>Vecells Scope and Isolation Atlas</title>
            <style>
              :root {
                color-scheme: light;
                --canvas: #F7F8FC;
                --rail: #EEF2F8;
                --panel: #FFFFFF;
                --inset: #F4F6FB;
                --text-strong: #0F172A;
                --text: #1E293B;
                --muted: #667085;
                --border-subtle: #E2E8F0;
                --border: #CBD5E1;
                --primary: #3559E6;
                --scope: #0EA5A4;
                --governance: #6E59D9;
                --warning: #C98900;
                --blocked: #C24141;
                --shadow: 0 22px 40px rgba(15, 23, 42, 0.07);
                font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
              }
              * { box-sizing: border-box; }
              body {
                margin: 0;
                background:
                  radial-gradient(circle at 12% 0%, rgba(53, 89, 230, 0.06), transparent 26%),
                  radial-gradient(circle at 88% 12%, rgba(14, 165, 164, 0.06), transparent 26%),
                  linear-gradient(180deg, #FAFBFE, var(--canvas));
                color: var(--text);
              }
              .app { max-width: 1500px; margin: 0 auto; padding: 18px; }
              .masthead {
                position: sticky;
                top: 0;
                z-index: 10;
                min-height: 72px;
                display: flex;
                align-items: center;
                gap: 18px;
                padding: 12px 16px;
                border: 1px solid var(--border-subtle);
                border-radius: 28px;
                background: rgba(255, 255, 255, 0.94);
                backdrop-filter: blur(12px);
                box-shadow: var(--shadow);
              }
              .brand { display: flex; align-items: center; gap: 12px; min-width: 244px; }
              .mark {
                width: 42px;
                height: 42px;
                border-radius: 14px;
                border: 1px solid rgba(15, 23, 42, 0.08);
                background: linear-gradient(180deg, rgba(255,255,255,0.96), rgba(244,246,251,0.96));
                display: grid;
                place-items: center;
                color: var(--scope);
              }
              .brand small,
              .metric span,
              .eyebrow,
              .label {
                display: block;
                font-size: 11px;
                letter-spacing: 0.08em;
                text-transform: uppercase;
                color: var(--muted);
              }
              .brand strong { display: block; font-size: 16px; color: var(--text-strong); }
              .metrics { display: grid; grid-template-columns: repeat(4, minmax(132px, 1fr)); gap: 12px; flex: 1; }
              .metric {
                padding: 12px 14px;
                border-radius: 18px;
                border: 1px solid var(--border-subtle);
                background: rgba(255, 255, 255, 0.84);
              }
              .metric strong { display: block; font-size: 22px; color: var(--text-strong); }
              .layout {
                display: grid;
                grid-template-columns: 296px minmax(0, 1fr) 392px;
                gap: 18px;
                margin-top: 18px;
                align-items: start;
              }
              .rail, .center, .inspector {
                border-radius: 28px;
                border: 1px solid var(--border-subtle);
                background: var(--panel);
                box-shadow: var(--shadow);
              }
              .rail {
                padding: 18px;
                background: linear-gradient(180deg, rgba(255,255,255,0.97), var(--rail));
              }
              .filters { display: grid; gap: 12px; }
              label { display: grid; gap: 6px; font-size: 13px; color: var(--text-strong); }
              select {
                height: 44px;
                border-radius: 14px;
                border: 1px solid var(--border);
                background: var(--panel);
                color: var(--text);
                padding: 0 12px;
              }
              .rail-copy {
                margin-top: 16px;
                padding: 14px;
                border-radius: 18px;
                border: 1px solid var(--border-subtle);
                background: rgba(255,255,255,0.88);
              }
              .center { padding: 18px; display: grid; gap: 18px; min-height: 580px; }
              .panel {
                padding: 18px;
                border-radius: 24px;
                border: 1px solid var(--border-subtle);
                background: linear-gradient(180deg, rgba(255,255,255,0.97), rgba(244,246,251,0.94));
              }
              .braid-grid {
                display: grid;
                grid-template-columns: minmax(0, 1fr) minmax(260px, 0.42fr);
                gap: 16px;
                align-items: center;
              }
              .braid {
                padding: 12px;
                border-radius: 20px;
                border: 1px solid var(--border-subtle);
                background: rgba(255,255,255,0.92);
              }
              .braid svg { width: 100%; height: 180px; }
              .braid-node {
                fill: rgba(255,255,255,0.98);
                stroke: rgba(53, 89, 230, 0.28);
                stroke-width: 1.4;
              }
              .braid-node.scope { stroke: rgba(14, 165, 164, 0.48); }
              .braid-node.governance { stroke: rgba(110, 89, 217, 0.42); }
              .braid-edge {
                stroke: rgba(148,163,184,0.92);
                stroke-width: 1.6;
              }
              .braid-label { fill: var(--text-strong); font-size: 11px; font-weight: 600; }
              .braid-sub { fill: var(--muted); font-size: 10px; }
              .mono {
                font-family: ui-monospace, "SFMono-Regular", "SF Mono", Consolas, monospace;
                font-size: 12px;
              }
              table { width: 100%; border-collapse: collapse; }
              th, td {
                text-align: left;
                padding: 12px 10px;
                border-bottom: 1px solid var(--border-subtle);
                vertical-align: top;
                font-size: 13px;
              }
              th {
                font-size: 11px;
                letter-spacing: 0.06em;
                text-transform: uppercase;
                color: var(--muted);
              }
              .card-grid {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 14px;
              }
              .route-card {
                min-height: 148px;
                display: grid;
                gap: 10px;
                padding: 16px;
                border-radius: 22px;
                border: 1px solid var(--border-subtle);
                background: rgba(255,255,255,0.94);
                cursor: pointer;
                transition: transform 180ms ease, border-color 120ms ease, box-shadow 180ms ease;
              }
              .route-card:hover,
              .route-card:focus-visible,
              .route-card[data-selected="true"] {
                transform: translateY(-1px);
                border-color: rgba(53, 89, 230, 0.28);
                box-shadow: 0 14px 28px rgba(53, 89, 230, 0.08);
                outline: none;
              }
              .chip-row { display: flex; flex-wrap: wrap; gap: 8px; }
              .chip {
                display: inline-flex;
                align-items: center;
                min-height: 26px;
                padding: 0 10px;
                border-radius: 999px;
                border: 1px solid rgba(15,23,42,0.08);
                background: rgba(15,23,42,0.04);
                color: var(--text);
                font-size: 12px;
              }
              .chip.scope { background: rgba(14,165,164,0.14); color: var(--scope); }
              .chip.governance { background: rgba(110,89,217,0.14); color: var(--governance); }
              .chip.warning { background: rgba(201,137,0,0.14); color: var(--warning); }
              .chip.blocked { background: rgba(194,65,65,0.14); color: var(--blocked); }
              .lower {
                display: grid;
                grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
                gap: 18px;
              }
              .inspector {
                position: sticky;
                top: 90px;
                padding: 18px;
                display: grid;
                gap: 18px;
              }
              .inspector-section {
                display: grid;
                gap: 10px;
                padding-bottom: 16px;
                border-bottom: 1px solid var(--border-subtle);
              }
              .inspector-section:last-child { border-bottom: 0; padding-bottom: 0; }
              .definition-grid {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 10px 12px;
              }
              .definition-grid div {
                padding: 10px 12px;
                border-radius: 14px;
                border: 1px solid var(--border-subtle);
                background: rgba(255,255,255,0.9);
              }
              .defect-strip { display: grid; gap: 10px; }
              .defect-card {
                padding: 14px;
                border-radius: 18px;
                border: 1px solid var(--border-subtle);
                background: rgba(255,255,255,0.9);
              }
              @media (prefers-reduced-motion: reduce) {
                * {
                  animation: none !important;
                  transition-duration: 0ms !important;
                  scroll-behavior: auto !important;
                }
              }
              @media (max-width: 1260px) {
                .layout { grid-template-columns: 1fr; }
                .inspector { position: static; }
              }
              @media (max-width: 980px) {
                .braid-grid,
                .lower,
                .card-grid,
                .metrics { grid-template-columns: 1fr; }
              }
              @media (max-width: 640px) {
                .definition-grid { grid-template-columns: 1fr; }
              }
            </style>
          </head>
          <body>
            <div class="app">
              <header class="masthead" data-testid="masthead">
                <div class="brand">
                  <div class="mark" aria-hidden="true">
                    <svg viewBox="0 0 32 32" fill="none">
                      <path d="M8 9.5c0-1.4 1.1-2.5 2.5-2.5h8.5a5 5 0 0 1 0 10H14" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"></path>
                      <path d="M14 17H9.5A2.5 2.5 0 0 0 7 19.5v0A2.5 2.5 0 0 0 9.5 22H18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"></path>
                      <path d="M18 7v18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"></path>
                    </svg>
                  </div>
                  <div>
                    <small>Vecells</small>
                    <strong>Scope and Isolation Atlas</strong>
                  </div>
                </div>
                <div class="metrics" id="metrics"></div>
              </header>
              <div class="layout">
                <aside class="rail" data-testid="route-rail">
                  <div class="filters">
                    <label><span class="label">Audience</span><select id="filter-audience" data-testid="filter-audience"></select></label>
                    <label><span class="label">Shell type</span><select id="filter-shell" data-testid="filter-shell"></select></label>
                    <label><span class="label">Scope mode</span><select id="filter-scope-mode" data-testid="filter-scope-mode"></select></label>
                    <label><span class="label">Drift state</span><select id="filter-drift-state" data-testid="filter-drift-state"></select></label>
                    <label><span class="label">Blast radius</span><select id="filter-blast-radius" data-testid="filter-blast-radius"></select></label>
                    <label><span class="label">Route group</span><select id="filter-route-group" data-testid="filter-route-group"></select></label>
                  </div>
                  <div class="rail-copy">
                    <div class="eyebrow">Fail-closed posture</div>
                    <p>Writable routes freeze in place when tuple, visibility, runtime binding, purpose-of-use, environment, or blast radius drift from the current authority row.</p>
                  </div>
                </aside>
                <main class="center">
                  <section class="panel" data-testid="tuple-braid">
                    <div class="eyebrow">Tuple braid</div>
                    <div class="braid-grid">
                      <div class="braid" id="tuple-braid-graphic"></div>
                      <div>
                        <table>
                          <thead>
                            <tr><th>Stage</th><th>Ref</th></tr>
                          </thead>
                          <tbody id="tuple-braid-table"></tbody>
                        </table>
                      </div>
                    </div>
                  </section>
                  <section class="panel" data-testid="route-matrix">
                    <div class="eyebrow">Route-to-scope matrix</div>
                    <div class="card-grid" id="route-cards"></div>
                  </section>
                  <div class="lower">
                    <section class="panel" data-testid="drift-table">
                      <div class="eyebrow">Drift trigger table</div>
                      <table>
                        <thead>
                          <tr><th>Trigger</th><th>Freeze</th><th>Tuple</th></tr>
                        </thead>
                        <tbody id="drift-body"></tbody>
                      </table>
                    </section>
                    <section class="panel" data-testid="blast-matrix">
                      <div class="eyebrow">Surface-to-blast-radius matrix</div>
                      <table>
                        <thead>
                          <tr><th>Surface</th><th>Blast radius</th><th>Counts</th></tr>
                        </thead>
                        <tbody id="blast-body"></tbody>
                      </table>
                    </section>
                  </div>
                  <section class="panel" data-testid="defect-strip">
                    <div class="eyebrow">Defect strip</div>
                    <div class="defect-strip" id="defect-body"></div>
                  </section>
                </main>
                <aside class="inspector" data-testid="inspector" id="inspector"></aside>
              </div>
            </div>
            <script type="module">
              const DATA_PATHS = {
                tenant: "../../data/analysis/tenant_isolation_modes.json",
                route: "../../data/analysis/route_to_scope_requirements.csv",
                drift: "../../data/analysis/acting_context_drift_triggers.json",
                blast: "../../data/analysis/surface_to_blast_radius_matrix.csv",
              };

              const state = {
                audience: "all",
                shell: "all",
                scopeMode: "all",
                driftState: "all",
                blastRadius: "all",
                routeGroup: "all",
                selectedRequirementId: null,
              };

              const ids = {
                metrics: document.getElementById("metrics"),
                routeCards: document.getElementById("route-cards"),
                inspector: document.getElementById("inspector"),
                braidGraphic: document.getElementById("tuple-braid-graphic"),
                braidTable: document.getElementById("tuple-braid-table"),
                driftBody: document.getElementById("drift-body"),
                blastBody: document.getElementById("blast-body"),
                defectBody: document.getElementById("defect-body"),
                filterAudience: document.getElementById("filter-audience"),
                filterShell: document.getElementById("filter-shell"),
                filterScopeMode: document.getElementById("filter-scope-mode"),
                filterDriftState: document.getElementById("filter-drift-state"),
                filterBlastRadius: document.getElementById("filter-blast-radius"),
                filterRouteGroup: document.getElementById("filter-route-group"),
              };

              const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
              document.body.dataset.reducedMotion = motionQuery.matches ? "true" : "false";
              motionQuery.addEventListener("change", (event) => {
                document.body.dataset.reducedMotion = event.matches ? "true" : "false";
              });

              function escapeHtml(value) {
                return String(value)
                  .replaceAll("&", "&amp;")
                  .replaceAll("<", "&lt;")
                  .replaceAll(">", "&gt;")
                  .replaceAll('"', "&quot;")
                  .replaceAll("'", "&#39;");
              }

              function toTestId(value) {
                return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
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

              function splitList(value) {
                if (!value) {
                  return [];
                }
                return String(value).split(";").map((item) => item.trim()).filter(Boolean);
              }

              async function loadData() {
                const [tenant, routeText, drift, blastText] = await Promise.all([
                  fetch(DATA_PATHS.tenant).then((response) => response.json()),
                  fetch(DATA_PATHS.route).then((response) => response.text()),
                  fetch(DATA_PATHS.drift).then((response) => response.json()),
                  fetch(DATA_PATHS.blast).then((response) => response.text()),
                ]);
                return {
                  tenant,
                  routeRows: parseCsv(routeText),
                  drift,
                  blastRows: parseCsv(blastText),
                };
              }

              function fillSelect(select, values, currentValue) {
                const options = ["all", ...values];
                select.innerHTML = options
                  .map((value) => {
                    const label = value === "all" ? "All" : value;
                    return `<option value="${escapeHtml(value)}" ${value === currentValue ? "selected" : ""}>${escapeHtml(label)}</option>`;
                  })
                  .join("");
              }

              function filteredRouteRows(data) {
                return data.routeRows.filter((row) => {
                  return (
                    (state.audience === "all" || row.audience === state.audience) &&
                    (state.shell === "all" || row.shell_type === state.shell) &&
                    (state.scopeMode === "all" || row.scope_mode === state.scopeMode) &&
                    (state.driftState === "all" || row.drift_state === state.driftState) &&
                    (state.blastRadius === "all" || row.blast_radius_class === state.blastRadius) &&
                    (state.routeGroup === "all" || row.route_group === state.routeGroup)
                  );
                });
              }

              function selectedRouteRow(data) {
                const rows = filteredRouteRows(data);
                if (!rows.length) {
                  return null;
                }
                return rows.find((row) => row.route_scope_requirement_id === state.selectedRequirementId) ?? rows[0];
              }

              function selectedTuple(data) {
                const selected = selectedRouteRow(data);
                if (!selected || !selected.sample_acting_scope_tuple_ref) {
                  return null;
                }
                return data.tenant.actingScopeTuples.find(
                  (row) => row.actingScopeTupleId === selected.sample_acting_scope_tuple_ref,
                ) ?? null;
              }

              function selectedActingContext(data) {
                const tuple = selectedTuple(data);
                if (!tuple) {
                  return null;
                }
                return data.tenant.actingContexts.find((row) => row.actingContextId === tuple.actingContextRef) ?? null;
              }

              function selectedIdentity(data) {
                const tuple = selectedTuple(data);
                if (!tuple) {
                  return null;
                }
                return data.tenant.staffIdentityContexts.find(
                  (row) => row.staffIdentityContextId === tuple.staffIdentityContextRef,
                ) ?? null;
              }

              function renderFilters(data) {
                fillSelect(ids.filterAudience, [...new Set(data.routeRows.map((row) => row.audience))], state.audience);
                fillSelect(ids.filterShell, [...new Set(data.routeRows.map((row) => row.shell_type))], state.shell);
                fillSelect(ids.filterScopeMode, [...new Set(data.routeRows.map((row) => row.scope_mode))], state.scopeMode);
                fillSelect(ids.filterDriftState, [...new Set(data.routeRows.map((row) => row.drift_state))], state.driftState);
                fillSelect(ids.filterBlastRadius, [...new Set(data.routeRows.map((row) => row.blast_radius_class))], state.blastRadius);
                fillSelect(ids.filterRouteGroup, [...new Set(data.routeRows.map((row) => row.route_group))], state.routeGroup);
              }

              function renderMetrics(data) {
                ids.metrics.innerHTML = [
                  ["Scope tuples", data.tenant.summary.acting_scope_tuple_count],
                  ["Drift triggers", data.drift.summary.drift_trigger_count],
                  ["Routes with coverage", data.tenant.summary.route_scope_requirement_count],
                  ["Broad-scope routes", data.tenant.summary.broad_scope_route_count],
                ]
                  .map(
                    ([label, value]) => `
                      <div class="metric">
                        <span>${escapeHtml(label)}</span>
                        <strong>${escapeHtml(value)}</strong>
                      </div>`,
                  )
                  .join("");
              }

              function renderRouteCards(data) {
                const rows = filteredRouteRows(data);
                if (!rows.length) {
                  state.selectedRequirementId = null;
                  ids.routeCards.innerHTML = "<p>No routes match the current filters.</p>";
                  return;
                }
                if (!rows.some((row) => row.route_scope_requirement_id === state.selectedRequirementId)) {
                  state.selectedRequirementId = rows[0].route_scope_requirement_id;
                }
                ids.routeCards.innerHTML = rows
                  .map(
                    (row) => `
                      <article
                        tabindex="0"
                        class="route-card"
                        data-testid="route-card-${toTestId(row.route_scope_requirement_id)}"
                        data-selected="${row.route_scope_requirement_id === state.selectedRequirementId}"
                        data-requirement-id="${escapeHtml(row.route_scope_requirement_id)}"
                      >
                        <div>
                          <div class="eyebrow">${escapeHtml(row.audience)}</div>
                          <h3>${escapeHtml(row.route_family)}</h3>
                        </div>
                        <div class="chip-row">
                          <span class="chip scope">${escapeHtml(row.scope_mode)}</span>
                          <span class="chip">${escapeHtml(row.tenant_isolation_mode)}</span>
                          <span class="chip ${row.blast_radius_class === "platform" ? "governance" : row.blast_radius_class === "cross_org" || row.blast_radius_class === "multi_tenant" ? "warning" : ""}">${escapeHtml(row.blast_radius_class)}</span>
                        </div>
                        <div class="mono">${escapeHtml(row.gateway_surface_id)}</div>
                        <div>${escapeHtml(row.same_shell_freeze_posture)}</div>
                      </article>`,
                  )
                  .join("");
                ids.routeCards.querySelectorAll(".route-card").forEach((node) => {
                  node.addEventListener("click", () => {
                    state.selectedRequirementId = node.dataset.requirementId;
                    renderAll(data);
                  });
                  node.addEventListener("keydown", (event) => {
                    const nodes = [...ids.routeCards.querySelectorAll(".route-card")];
                    const index = nodes.indexOf(node);
                    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                      event.preventDefault();
                      const nextIndex =
                        event.key === "ArrowDown"
                          ? Math.min(nodes.length - 1, index + 1)
                          : Math.max(0, index - 1);
                      state.selectedRequirementId = nodes[nextIndex].dataset.requirementId;
                      renderAll(data);
                      ids.routeCards.querySelectorAll(".route-card")[nextIndex]?.focus();
                    }
                  });
                });
              }

              function renderBraid(data) {
                const route = selectedRouteRow(data);
                const tuple = selectedTuple(data);
                const actingContext = selectedActingContext(data);
                const identity = selectedIdentity(data);
                ids.braidGraphic.innerHTML = `
                  <svg viewBox="0 0 560 180" role="img" aria-label="Identity to route authority tuple braid">
                    <line class="braid-edge" x1="56" y1="90" x2="176" y2="54"></line>
                    <line class="braid-edge" x1="176" y1="54" x2="316" y2="90"></line>
                    <line class="braid-edge" x1="316" y1="90" x2="468" y2="54"></line>
                    <circle class="braid-node" cx="56" cy="90" r="28"></circle>
                    <circle class="braid-node" cx="176" cy="54" r="28"></circle>
                    <circle class="braid-node scope" cx="316" cy="90" r="28"></circle>
                    <circle class="braid-node governance" cx="468" cy="54" r="28"></circle>
                    <text class="braid-label" x="56" y="86" text-anchor="middle">Identity</text>
                    <text class="braid-sub" x="56" y="102" text-anchor="middle">${escapeHtml(identity ? identity.staffUserId.split("://").pop() : "browser")}</text>
                    <text class="braid-label" x="176" y="50" text-anchor="middle">Context</text>
                    <text class="braid-sub" x="176" y="66" text-anchor="middle">${escapeHtml(actingContext ? actingContext.purposeOfUseRef.split("://").pop() : route ? route.purpose_of_use_ref.split("://").pop() : "none")}</text>
                    <text class="braid-label" x="316" y="86" text-anchor="middle">Tuple</text>
                    <text class="braid-sub" x="316" y="102" text-anchor="middle">${escapeHtml(tuple ? tuple.tupleHash : "no_tuple")}</text>
                    <text class="braid-label" x="468" y="50" text-anchor="middle">Authority</text>
                    <text class="braid-sub" x="468" y="66" text-anchor="middle">${escapeHtml(route ? route.gateway_surface_id : "none")}</text>
                  </svg>`;
                const braidRows = [
                  ["Identity", identity ? identity.staffIdentityContextId : "browser_authority"],
                  ["Acting context", actingContext ? actingContext.actingContextId : route ? route.acting_scope_profile_id : "none"],
                  ["Scope tuple", tuple ? tuple.actingScopeTupleId : "not_required"],
                  ["Route authority", route ? route.route_scope_requirement_id : "none"],
                ];
                ids.braidTable.innerHTML = braidRows
                  .map(([label, value]) => `<tr><td>${escapeHtml(label)}</td><td class="mono">${escapeHtml(value)}</td></tr>`)
                  .join("");
              }

              function renderDriftTable(data) {
                const route = selectedRouteRow(data);
                const tuple = selectedTuple(data);
                ids.driftBody.innerHTML = data.drift.sampleDriftRecords
                  .map((record) => {
                    const linked = tuple ? record.priorActingScopeTupleRef === tuple.actingScopeTupleId : false;
                    return `
                      <tr data-testid="drift-row-${toTestId(record.actingContextDriftRecordId)}" data-linked="${linked}">
                        <td>
                          <div>${escapeHtml(record.detectedChangeClass)}</div>
                          <div class="mono">${escapeHtml(record.actingContextDriftRecordId)}</div>
                        </td>
                        <td>${escapeHtml(record.freezeState)}</td>
                        <td class="mono">${escapeHtml(record.priorActingScopeTupleRef)}</td>
                      </tr>`;
                  })
                  .join("");
              }

              function renderBlastTable(data) {
                const route = selectedRouteRow(data);
                ids.blastBody.innerHTML = data.blastRows
                  .map((row) => {
                    const linked = route ? row.gateway_surface_id === route.gateway_surface_id : false;
                    return `
                      <tr data-testid="blast-row-${toTestId(row.surface_blast_radius_id)}" data-linked="${linked}">
                        <td>
                          <div>${escapeHtml(row.gateway_surface_id)}</div>
                          <div class="mono">${escapeHtml(row.audience)}</div>
                        </td>
                        <td>${escapeHtml(row.blast_radius_class)}</td>
                        <td class="mono">${escapeHtml(row.affected_tenant_count)}/${escapeHtml(row.affected_organisation_count)}</td>
                      </tr>`;
                  })
                  .join("");
              }

              function renderDefects(data) {
                ids.defectBody.innerHTML = data.tenant.defects
                  .map(
                    (defect) => `
                      <article class="defect-card" data-testid="defect-${toTestId(defect.defectId)}">
                        <div class="chip-row">
                          <span class="chip blocked">${escapeHtml(defect.state)}</span>
                        </div>
                        <h3>${escapeHtml(defect.defectId)}</h3>
                        <p>${escapeHtml(defect.summary)}</p>
                      </article>`,
                  )
                  .join("");
              }

              function renderInspector(data) {
                const route = selectedRouteRow(data);
                if (!route) {
                  ids.inspector.innerHTML = "<p>No route selected.</p>";
                  return;
                }
                const tuple = selectedTuple(data);
                const actingContext = selectedActingContext(data);
                const identity = selectedIdentity(data);
                ids.inspector.innerHTML = `
                  <section class="inspector-section">
                    <div class="eyebrow">Selected route</div>
                    <h2>${escapeHtml(route.route_family)}</h2>
                    <div class="chip-row">
                      <span class="chip scope">${escapeHtml(route.scope_mode)}</span>
                      <span class="chip">${escapeHtml(route.tenant_isolation_mode)}</span>
                      <span class="chip ${route.blast_radius_class === "platform" ? "governance" : route.blast_radius_class === "cross_org" || route.blast_radius_class === "multi_tenant" ? "warning" : ""}">${escapeHtml(route.blast_radius_class)}</span>
                    </div>
                    <div class="definition-grid">
                      <div><span class="eyebrow">Gateway surface</span><div class="mono">${escapeHtml(route.gateway_surface_id)}</div></div>
                      <div><span class="eyebrow">Audience</span><strong>${escapeHtml(route.audience)}</strong></div>
                      <div><span class="eyebrow">Tuple requirement</span><strong>${escapeHtml(route.acting_scope_tuple_requirement)}</strong></div>
                      <div><span class="eyebrow">Governance token</span><strong>${escapeHtml(route.governance_scope_token_requirement)}</strong></div>
                    </div>
                  </section>
                  <section class="inspector-section">
                    <div class="eyebrow">Visibility and runtime binding</div>
                    <div class="definition-grid">
                      <div><span class="eyebrow">Visibility coverage</span><div class="mono">${escapeHtml(route.audience_visibility_coverage_ref)}</div></div>
                      <div><span class="eyebrow">Minimum necessary</span><div class="mono">${escapeHtml(route.minimum_necessary_contract_ref)}</div></div>
                      <div><span class="eyebrow">Runtime binding</span><div class="mono">${escapeHtml(route.required_runtime_binding_refs)}</div></div>
                      <div><span class="eyebrow">Authority binding</span><div class="mono">${escapeHtml(route.runtime_browser_authority_binding_refs)}</div></div>
                    </div>
                  </section>
                  <section class="inspector-section">
                    <div class="eyebrow">Tuple and blast radius</div>
                    <div class="definition-grid">
                      <div><span class="eyebrow">Sample tuple</span><div class="mono">${escapeHtml(route.sample_acting_scope_tuple_ref || "not_required")}</div></div>
                      <div><span class="eyebrow">Tuple hash</span><div class="mono">${escapeHtml(route.scope_tuple_hash || "n/a")}</div></div>
                      <div><span class="eyebrow">Affected tenants</span><strong>${escapeHtml(route.affected_tenant_count)}</strong></div>
                      <div><span class="eyebrow">Affected organisations</span><strong>${escapeHtml(route.affected_organisation_count)}</strong></div>
                    </div>
                  </section>
                  <section class="inspector-section">
                    <div class="eyebrow">Acting context</div>
                    <div class="definition-grid">
                      <div><span class="eyebrow">Identity</span><div class="mono">${escapeHtml(identity ? identity.staffIdentityContextId : "browser_authority")}</div></div>
                      <div><span class="eyebrow">Acting context</span><div class="mono">${escapeHtml(actingContext ? actingContext.actingContextId : route.acting_scope_profile_id)}</div></div>
                      <div><span class="eyebrow">Purpose of use</span><div class="mono">${escapeHtml(route.purpose_of_use_ref)}</div></div>
                      <div><span class="eyebrow">Freeze posture</span><strong>${escapeHtml(route.same_shell_freeze_posture)}</strong></div>
                    </div>
                  </section>
                  <section class="inspector-section">
                    <div class="eyebrow">Trust refs</div>
                    <div class="mono">${escapeHtml(route.required_trust_refs || "none")}</div>
                  </section>`;
              }

              function renderAll(data) {
                renderFilters(data);
                renderMetrics(data);
                renderRouteCards(data);
                renderBraid(data);
                renderDriftTable(data);
                renderBlastTable(data);
                renderDefects(data);
                renderInspector(data);
              }

              function bindFilters(data) {
                [
                  [ids.filterAudience, "audience"],
                  [ids.filterShell, "shell"],
                  [ids.filterScopeMode, "scopeMode"],
                  [ids.filterDriftState, "driftState"],
                  [ids.filterBlastRadius, "blastRadius"],
                  [ids.filterRouteGroup, "routeGroup"],
                ].forEach(([node, key]) => {
                  node.addEventListener("change", (event) => {
                    state[key] = event.target.value;
                    renderAll(data);
                  });
                });
              }

              loadData().then((data) => {
                window.__scopeAtlasData = data;
                bindFilters(data);
                renderAll(data);
              });
            </script>
          </body>
        </html>
        """
    ).strip() + "\n"


def build_spec_js() -> str:
    return dedent(
        """
        import fs from "node:fs";
        import http from "node:http";
        import path from "node:path";
        import { fileURLToPath } from "node:url";

        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const ROOT = path.resolve(__dirname, "..", "..");
        const HTML_PATH = path.join(ROOT, "docs", "architecture", "54_scope_and_isolation_atlas.html");
        const TENANT_PATH = path.join(ROOT, "data", "analysis", "tenant_isolation_modes.json");
        const ROUTE_PATH = path.join(ROOT, "data", "analysis", "route_to_scope_requirements.csv");
        const BLAST_PATH = path.join(ROOT, "data", "analysis", "surface_to_blast_radius_matrix.csv");

        const TENANT_PAYLOAD = JSON.parse(fs.readFileSync(TENANT_PATH, "utf8"));

        export const scopeIsolationAtlasCoverage = [
          "scope filtering",
          "route selection",
          "matrix and inspector parity",
          "drift-trigger visibility",
          "keyboard navigation",
          "responsive behavior",
          "reduced motion",
          "accessibility smoke checks",
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

        function toTestId(value) {
          return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        }

        async function importPlaywright() {
          try {
            return await import("playwright");
          } catch (error) {
            if (!process.argv.includes("--run")) {
              return null;
            }
            throw error;
          }
        }

        function serve(rootDir) {
          const server = http.createServer((request, response) => {
            const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
            let pathname = decodeURIComponent(requestUrl.pathname);
            if (pathname === "/") {
              pathname = "/docs/architecture/54_scope_and_isolation_atlas.html";
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
                url: `http://127.0.0.1:${address.port}/docs/architecture/54_scope_and_isolation_atlas.html`,
              });
            });
          });
        }

        export async function run() {
          assertCondition(fs.existsSync(HTML_PATH), "Scope atlas HTML is missing.");
          const routeRows = parseCsv(fs.readFileSync(ROUTE_PATH, "utf8"));
          const blastRows = parseCsv(fs.readFileSync(BLAST_PATH, "utf8"));
          assertCondition(
            routeRows.length === TENANT_PAYLOAD.summary.route_scope_requirement_count,
            "Route coverage drifted from the expected baseline.",
          );
          assertCondition(
            blastRows.length >= 10,
            "Surface blast-radius matrix unexpectedly shrank.",
          );

          const playwright = await importPlaywright();
          if (!playwright) {
            return;
          }

          const { server, url } = await serve(ROOT);
          const browser = await playwright.chromium.launch({ headless: true });

          try {
            const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
            const page = await context.newPage();
            await page.goto(url, { waitUntil: "networkidle" });

            await page.locator("[data-testid='route-rail']").waitFor();
            await page.locator("[data-testid='tuple-braid']").waitFor();
            await page.locator("[data-testid='inspector']").waitFor();
            await page.locator("[data-testid='drift-table']").waitFor();
            await page.locator("[data-testid='defect-strip']").waitFor();

            const initialCards = await page.locator("[data-testid^='route-card-']").count();
            assertCondition(
              initialCards === TENANT_PAYLOAD.summary.route_scope_requirement_count,
              `Expected ${TENANT_PAYLOAD.summary.route_scope_requirement_count} route cards, found ${initialCards}.`,
            );

            await page.locator("[data-testid='filter-audience']").selectOption("support");
            const supportCards = await page.locator("[data-testid^='route-card-']").count();
            assertCondition(supportCards === 3, `Support filter expected 3 cards, found ${supportCards}.`);

            await page.locator("[data-testid='filter-audience']").selectOption("all");
            await page.locator("[data-testid='filter-scope-mode']").selectOption("platform");
            const platformCards = await page.locator("[data-testid^='route-card-']").count();
            assertCondition(platformCards === 1, `Platform scope filter expected 1 card, found ${platformCards}.`);

            await page.locator("[data-testid='filter-scope-mode']").selectOption("all");
            await page.locator("[data-testid='filter-blast-radius']").selectOption("cross_org");
            const crossOrgCards = await page.locator("[data-testid^='route-card-']").count();
            assertCondition(crossOrgCards === 2, `Cross-org blast filter expected 2 cards, found ${crossOrgCards}.`);

            await page.locator("[data-testid='filter-blast-radius']").selectOption("all");
            const governanceRequirementId = "RSR_054_GWS_GOVERNANCE_SHELL_RF_GOVERNANCE_SHELL";
            await page.locator(`[data-testid='route-card-${toTestId(governanceRequirementId)}']`).click();
            const inspectorText = await page.locator("[data-testid='inspector']").innerText();
            assertCondition(
              inspectorText.includes("AST_054_GOVERNANCE_PLATFORM_V1") &&
                inspectorText.includes("32") &&
                inspectorText.includes("required"),
              "Inspector lost tuple or blast-radius parity for governance.",
            );

            const linkedBlast = await page
              .locator("[data-testid='blast-row-sbr-054-gws-governance-shell']")
              .getAttribute("data-linked");
            assertCondition(linkedBlast === "true", "Blast-radius table did not link the selected governance surface.");

            await page.locator("[data-testid='filter-audience']").selectOption("hub_desk");
            const hubCards = page.locator("[data-testid^='route-card-']");
            const firstHubCard = hubCards.nth(0);
            const secondHubCard = hubCards.nth(1);
            await firstHubCard.focus();
            await page.keyboard.press("ArrowDown");
            const hubSelected = await secondHubCard.getAttribute("data-selected");
            assertCondition(hubSelected === "true", "ArrowDown did not advance hub route selection.");

            const linkedDrift = await page
              .locator("[data-testid='drift-row-dcr-054-hub-visibility-drift-v1']")
              .getAttribute("data-linked");
            assertCondition(linkedDrift === "true", "Drift table did not reflect the selected tuple.");

            await page.setViewportSize({ width: 390, height: 844 });
            const inspectorVisible = await page.locator("[data-testid='inspector']").isVisible();
            assertCondition(inspectorVisible, "Inspector disappeared at mobile width.");

            const reducedContext = await browser.newContext({
              viewport: { width: 1280, height: 900 },
              reducedMotion: "reduce",
            });
            const reducedPage = await reducedContext.newPage();
            try {
              await reducedPage.goto(url, { waitUntil: "networkidle" });
              const reducedMotion = await reducedPage.evaluate(() => document.body.dataset.reducedMotion);
              assertCondition(reducedMotion === "true", "Reduced-motion posture did not activate.");
            } finally {
              await reducedContext.close();
            }

            const landmarks = await page.locator("header, main, aside, section").count();
            assertCondition(landmarks >= 8, `Accessibility smoke failed: expected landmarks, found ${landmarks}.`);
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

        export const scopeIsolationAtlasManifest = {
          task: TENANT_PAYLOAD.task_id,
          tuples: TENANT_PAYLOAD.summary.acting_scope_tuple_count,
          routes: TENANT_PAYLOAD.summary.route_scope_requirement_count,
          broadScopeRoutes: TENANT_PAYLOAD.summary.broad_scope_route_count,
        };
        """
    ).strip() + "\n"


def update_root_package() -> None:
    package = read_json(ROOT_PACKAGE_PATH)
    package.setdefault("scripts", {}).update(ROOT_SCRIPT_UPDATES)
    write_json(ROOT_PACKAGE_PATH, package)


def update_playwright_package() -> None:
    package = read_json(PLAYWRIGHT_PACKAGE_PATH)
    package["description"] = (
        "Foundation, runtime topology, gateway, event, FHIR, frontend manifest, release parity, "
        "design contract, audit ledger, and scope/isolation browser checks."
    )
    package["scripts"] = PLAYWRIGHT_SCRIPT_UPDATES
    write_json(PLAYWRIGHT_PACKAGE_PATH, package)


def patch_engineering_builder() -> None:
    text = ENGINEERING_BUILDER_PATH.read_text()
    old_codegen = (
        "python3 ./tools/analysis/build_design_contract_publication.py && "
        "python3 ./tools/analysis/build_audit_and_worm_strategy.py && "
        "python3 ./tools/analysis/build_engineering_standards.py && pnpm format"
    )
    new_codegen = (
        "python3 ./tools/analysis/build_design_contract_publication.py && "
        "python3 ./tools/analysis/build_audit_and_worm_strategy.py && "
        "python3 ./tools/analysis/build_tenant_scope_model.py && "
        "python3 ./tools/analysis/build_engineering_standards.py && pnpm format"
    )
    text = text.replace(old_codegen, new_codegen)
    text = text.replace("pnpm validate:audit-worm && pnpm validate:scaffold", "pnpm validate:audit-worm && pnpm validate:tenant-scope && pnpm validate:scaffold")
    text = text.replace(
        '"validate:audit-worm": "python3 ./tools/analysis/validate_audit_and_worm_strategy.py",\n'
        '    "validate:standards": "python3 ./tools/analysis/validate_engineering_standards.py",',
        '"validate:audit-worm": "python3 ./tools/analysis/validate_audit_and_worm_strategy.py",\n'
        '    "validate:tenant-scope": "python3 ./tools/analysis/validate_tenant_scope_model.py",\n'
        '    "validate:standards": "python3 ./tools/analysis/validate_engineering_standards.py",',
    )
    ENGINEERING_BUILDER_PATH.write_text(text)


def main() -> None:
    context = load_context()
    staff_identity_contexts = build_staff_identity_contexts()
    acting_contexts = build_acting_contexts()
    tuples = build_acting_scope_tuples()
    governance_tokens = [governance_scope_token(tuples[-1])]
    runtime_browser_bindings = build_runtime_browser_bindings(context)
    route_scope_rows = build_route_scope_rows(context, tuples, runtime_browser_bindings)
    drift_payload = build_drift_trigger_payload(route_scope_rows, tuples)
    surface_blast_rows = build_surface_blast_rows(route_scope_rows)
    tenant_payload = build_tenant_isolation_modes(
        context,
        route_scope_rows,
        runtime_browser_bindings,
        tuples,
        staff_identity_contexts,
        acting_contexts,
        governance_tokens,
    )
    schema = build_schema()

    route_fields = list(route_scope_rows[0].keys())
    blast_fields = list(surface_blast_rows[0].keys())

    write_json(TENANT_ISOLATION_OUTPUT_PATH, tenant_payload)
    write_json(ACTING_SCOPE_SCHEMA_PATH, schema)
    write_csv(ROUTE_SCOPE_MATRIX_PATH, route_fields, route_scope_rows)
    write_json(DRIFT_TRIGGER_PATH, drift_payload)
    write_csv(SURFACE_BLAST_RADIUS_PATH, blast_fields, surface_blast_rows)
    write_text(TENANT_STRATEGY_DOC_PATH, build_tenant_strategy_doc(tenant_payload, route_scope_rows, surface_blast_rows))
    write_text(SCOPE_MODEL_DOC_PATH, build_scope_model_doc(tenant_payload, drift_payload))
    write_text(ATLAS_PATH, build_atlas_html())
    write_text(SPEC_PATH, build_spec_js())
    update_root_package()
    update_playwright_package()
    patch_engineering_builder()

    print(
        "seq_054 tenant scope artifacts generated: "
        f"{tenant_payload['summary']['acting_scope_tuple_count']} tuples, "
        f"{tenant_payload['summary']['route_scope_requirement_count']} route scope rows, "
        f"{drift_payload['summary']['drift_trigger_count']} drift triggers."
    )


if __name__ == "__main__":
    main()
