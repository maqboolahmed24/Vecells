#!/usr/bin/env python3
from __future__ import annotations

import csv
import hashlib
import json
from collections import OrderedDict
from datetime import datetime, timezone
from pathlib import Path
from textwrap import dedent
from typing import Any

from root_script_updates import ROOT_SCRIPT_UPDATES as SHARED_ROOT_SCRIPT_UPDATES


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"
TESTS_DIR = ROOT / "tests" / "playwright"
PACKAGE_DIR = ROOT / "packages" / "api-contracts"
SCHEMA_DIR = PACKAGE_DIR / "schemas"
PACKAGE_SOURCE_PATH = PACKAGE_DIR / "src" / "index.ts"
PACKAGE_TEST_PATH = PACKAGE_DIR / "tests" / "public-api.test.ts"
PACKAGE_PACKAGE_JSON_PATH = PACKAGE_DIR / "package.json"

SHELL_OWNERSHIP_PATH = DATA_DIR / "shell_ownership_map.json"
ROUTE_FAMILY_PATH = DATA_DIR / "route_family_inventory.csv"
AUDIENCE_SURFACE_PATH = DATA_DIR / "audience_surface_inventory.csv"
GATEWAY_SURFACES_PATH = DATA_DIR / "gateway_bff_surfaces.json"
RUNTIME_TOPOLOGY_PATH = DATA_DIR / "runtime_topology_manifest.json"
EVENT_REGISTRY_PATH = DATA_DIR / "canonical_event_contracts.json"
FHIR_CONTRACTS_PATH = DATA_DIR / "fhir_representation_contracts.json"

MANIFEST_PATH = DATA_DIR / "frontend_contract_manifests.json"
MATRIX_PATH = DATA_DIR / "frontend_route_to_query_command_channel_cache_matrix.csv"
PROFILE_PATH = DATA_DIR / "frontend_accessibility_and_automation_profiles.json"
RULES_PATH = DATA_DIR / "frontend_manifest_generation_rules.json"

STRATEGY_DOC_PATH = DOCS_DIR / "50_frontend_contract_manifest_strategy.md"
CATALOG_DOC_PATH = DOCS_DIR / "50_frontend_contract_manifest_catalog.md"
MATRIX_DOC_PATH = DOCS_DIR / "50_route_contract_to_manifest_matrix.md"
STUDIO_PATH = DOCS_DIR / "50_frontend_contract_studio.html"

SCHEMA_PATH = SCHEMA_DIR / "frontend-contract-manifest.schema.json"
VALIDATOR_PATH = ROOT / "tools" / "analysis" / "validate_frontend_contract_manifests.py"
SPEC_PATH = TESTS_DIR / "frontend-contract-studio.spec.js"
ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = TESTS_DIR / "package.json"

PACKAGE_FRONTEND_EXPORTS_START = "// seq_050_frontend_contract_manifest_exports:start"
PACKAGE_FRONTEND_EXPORTS_END = "// seq_050_frontend_contract_manifest_exports:end"

TASK_ID = "seq_050"
VISUAL_MODE = "Manifest_Studio"
TIMESTAMP = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
CAPTURED_ON = TIMESTAMP[:10]
MISSION = (
    "Define the canonical FrontendContractManifest strategy so every browser-visible Vecells "
    "surface consumes one generated authority tuple for route, runtime, design, projection, "
    "cache, accessibility, automation, and recovery posture."
)

SOURCE_PRECEDENCE = [
    "prompt/050.md",
    "prompt/shared_operating_contract_046_to_055.md",
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "blueprint/platform-runtime-and-release-blueprint.md#FrontendContractManifest",
    "blueprint/platform-runtime-and-release-blueprint.md#ProjectionContractFamily",
    "blueprint/platform-runtime-and-release-blueprint.md#ProjectionContractVersion",
    "blueprint/platform-runtime-and-release-blueprint.md#ProjectionContractVersionSet",
    "blueprint/platform-runtime-and-release-blueprint.md#ProjectionQueryContract",
    "blueprint/platform-runtime-and-release-blueprint.md#MutationCommandContract",
    "blueprint/platform-runtime-and-release-blueprint.md#LiveUpdateChannelContract",
    "blueprint/platform-runtime-and-release-blueprint.md#ClientCachePolicy",
    "blueprint/platform-runtime-and-release-blueprint.md#GatewayBffSurface",
    "blueprint/platform-runtime-and-release-blueprint.md#AudienceSurfaceRuntimeBinding",
    "blueprint/platform-frontend-blueprint.md#Browser boundary and BFF law",
    "blueprint/platform-frontend-blueprint.md#Shared IA rules",
    "blueprint/platform-frontend-blueprint.md#Shared visibility, hydration, and empty-state rules",
    "blueprint/design-token-foundation.md#Machine-readable export contract",
    "blueprint/canonical-ui-contract-kernel.md#Canonical contracts",
    "blueprint/accessibility-and-content-system-contract.md#Canonical accessibility and content objects",
    "blueprint/ux-quiet-clarity-redesign.md#Control priorities",
    "blueprint/forensic-audit-findings.md#Finding 86",
    "blueprint/forensic-audit-findings.md#Finding 87",
    "blueprint/forensic-audit-findings.md#Finding 88",
    "blueprint/forensic-audit-findings.md#Finding 91",
    "blueprint/forensic-audit-findings.md#Finding 97",
    "blueprint/forensic-audit-findings.md#Finding 101",
    "blueprint/forensic-audit-findings.md#Finding 116",
    "blueprint/forensic-audit-findings.md#Finding 117",
    "blueprint/forensic-audit-findings.md#Finding 118",
    "blueprint/forensic-audit-findings.md#Finding 119",
    "blueprint/forensic-audit-findings.md#Finding 120",
    "data/analysis/shell_ownership_map.json",
    "data/analysis/route_family_inventory.csv",
    "data/analysis/audience_surface_inventory.csv",
    "data/analysis/gateway_bff_surfaces.json",
    "data/analysis/runtime_topology_manifest.json",
    "data/analysis/canonical_event_contracts.json",
    "data/analysis/fhir_representation_contracts.json",
]

TOKEN_KERNEL_LAYERING_POLICY_REF = "TKLP_SIGNAL_ATLAS_LIVE_V1"
DESIGN_EXPORT_ARTIFACT_REF = "DTEA_SIGNAL_ATLAS_LIVE_V1"

ROOT_SCRIPT_UPDATES = {
    "bootstrap": (
        "pnpm install && node ./tools/dev-bootstrap/index.mjs && pnpm codegen && "
        "pnpm validate:topology && pnpm validate:runtime-topology && pnpm validate:gateway-surface && "
        "pnpm validate:events && pnpm validate:fhir && pnpm validate:frontend && "
        "pnpm validate:release-parity && pnpm validate:design-publication && pnpm validate:audit-worm && "
        "pnpm validate:scaffold && pnpm validate:services && pnpm validate:domains && "
        "pnpm validate:standards"
    ),
    "check": (
        "pnpm lint && pnpm format:check && pnpm typecheck && pnpm test && "
        "pnpm validate:topology && pnpm validate:runtime-topology && pnpm validate:gateway-surface && "
        "pnpm validate:events && pnpm validate:fhir && pnpm validate:frontend && "
        "pnpm validate:release-parity && pnpm validate:design-publication && pnpm validate:audit-worm && "
        "pnpm validate:scaffold && pnpm validate:services && pnpm validate:domains && "
        "pnpm validate:standards"
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
        "python3 ./tools/analysis/build_design_contract_publication.py && python3 ./tools/analysis/build_audit_and_worm_strategy.py && "
        "python3 ./tools/analysis/build_engineering_standards.py && pnpm format"
    ),
    "validate:frontend": "python3 ./tools/analysis/validate_frontend_contract_manifests.py",
    "validate:release-parity": "python3 ./tools/analysis/validate_release_freeze_and_parity.py",
    "validate:design-publication": "python3 ./tools/analysis/validate_design_contract_publication.py",
    "validate:audit-worm": "python3 ./tools/analysis/validate_audit_and_worm_strategy.py",
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
        "node --check design-contract-studio.spec.js && node --check audit-ledger-explorer.spec.js"
    ),
    "lint": (
        "eslint foundation-shell-gallery.spec.js runtime-topology-atlas.spec.js "
        "gateway-surface-studio.spec.js event-registry-studio.spec.js "
        "fhir-representation-atlas.spec.js frontend-contract-studio.spec.js "
        "release-parity-cockpit.spec.js design-contract-studio.spec.js audit-ledger-explorer.spec.js"
    ),
    "test": (
        "node foundation-shell-gallery.spec.js && "
        "node runtime-topology-atlas.spec.js && "
        "node gateway-surface-studio.spec.js && "
        "node event-registry-studio.spec.js && "
        "node fhir-representation-atlas.spec.js && "
        "node frontend-contract-studio.spec.js && "
        "node release-parity-cockpit.spec.js && "
        "node design-contract-studio.spec.js && node audit-ledger-explorer.spec.js"
    ),
    "typecheck": (
        "node --check foundation-shell-gallery.spec.js && "
        "node --check runtime-topology-atlas.spec.js && "
        "node --check gateway-surface-studio.spec.js && "
        "node --check event-registry-studio.spec.js && "
        "node --check fhir-representation-atlas.spec.js && "
        "node --check frontend-contract-studio.spec.js && "
        "node --check release-parity-cockpit.spec.js && "
        "node --check design-contract-studio.spec.js && node --check audit-ledger-explorer.spec.js"
    ),
    "e2e": (
        "node foundation-shell-gallery.spec.js --run && "
        "node runtime-topology-atlas.spec.js --run && "
        "node gateway-surface-studio.spec.js --run && "
        "node event-registry-studio.spec.js --run && "
        "node fhir-representation-atlas.spec.js --run && "
        "node frontend-contract-studio.spec.js --run && "
        "node release-parity-cockpit.spec.js --run && "
        "node design-contract-studio.spec.js --run && node audit-ledger-explorer.spec.js --run"
    ),
}

MANIFEST_GROUPS = [
    {
        "group_id": "patient_public_entry",
        "audience_surface": "audsurf_patient_public_entry",
        "label": "Patient public entry",
        "shell_type": "patient",
        "route_family_refs": ["rf_intake_self_service", "rf_intake_telephony_capture"],
        "gateway_surface_refs": ["gws_patient_intake_web", "gws_patient_intake_phone"],
        "primary_gateway_surface_ref": "gws_patient_intake_web",
        "browser_posture_state": "recovery_only",
        "drift_state": "planned_publication_gap",
        "design_group_ref": "dcpb::patient_public_entry::planned",
        "rationale": "Public intake may render governed placeholder and recovery posture only until exact publication, design, and parity tuples exist.",
        "source_refs": [
            "blueprint/platform-runtime-and-release-blueprint.md#FrontendContractManifest",
            "blueprint/platform-frontend-blueprint.md#Browser boundary and BFF law",
            "data/analysis/gateway_bff_surfaces.json#gws_patient_intake_web",
            "data/analysis/gateway_bff_surfaces.json#gws_patient_intake_phone",
        ],
    },
    {
        "group_id": "patient_authenticated_portal",
        "audience_surface": "audsurf_patient_authenticated_portal",
        "label": "Authenticated patient portal",
        "shell_type": "patient",
        "route_family_refs": [
            "rf_patient_home",
            "rf_patient_requests",
            "rf_patient_appointments",
            "rf_patient_health_record",
            "rf_patient_messages",
        ],
        "gateway_surface_refs": [
            "gws_patient_home",
            "gws_patient_requests",
            "gws_patient_appointments",
            "gws_patient_health_record",
            "gws_patient_messages",
        ],
        "primary_gateway_surface_ref": "gws_patient_home",
        "browser_posture_state": "read_only",
        "drift_state": "design_publication_pending",
        "design_group_ref": "dcpb::patient_authenticated_shell::planned",
        "rationale": "Authenticated patient reads are routable, but writable posture stays frozen until design publication, runtime publication, and exact projection tuple evidence are current.",
        "source_refs": [
            "blueprint/patient-portal-experience-architecture-blueprint.md#Portal entry and shell topology",
            "blueprint/patient-account-and-communications-blueprint.md#Patient home contract",
            "data/analysis/gateway_bff_surfaces.json#gws_patient_home",
        ],
    },
    {
        "group_id": "patient_transaction_recovery",
        "audience_surface": "audsurf_patient_transaction_recovery",
        "label": "Grant-scoped patient transaction and recovery",
        "shell_type": "patient",
        "route_family_refs": ["rf_patient_secure_link_recovery", "rf_patient_embedded_channel"],
        "gateway_surface_refs": ["gws_patient_secure_link_recovery", "gws_patient_embedded_shell"],
        "primary_gateway_surface_ref": "gws_patient_secure_link_recovery",
        "browser_posture_state": "recovery_only",
        "drift_state": "deferred_channel_mixed",
        "design_group_ref": "dcpb::patient_transaction_recovery::planned",
        "rationale": "Grant-scoped recovery stays same-shell and route-bound, but deferred embedded parity keeps the grouped surface out of calm live posture.",
        "source_refs": [
            "blueprint/platform-runtime-and-release-blueprint.md#FrontendContractManifest",
            "blueprint/patient-account-and-communications-blueprint.md#Patient audience coverage contract",
            "data/analysis/gateway_bff_surfaces.json#gws_patient_secure_link_recovery",
            "data/analysis/gateway_bff_surfaces.json#gws_patient_embedded_shell",
        ],
    },
    {
        "group_id": "clinical_workspace",
        "audience_surface": "audsurf_clinical_workspace",
        "label": "Clinical workspace",
        "shell_type": "staff",
        "route_family_refs": ["rf_staff_workspace", "rf_staff_workspace_child"],
        "gateway_surface_refs": [
            "gws_clinician_workspace",
            "gws_clinician_workspace_child",
            "gws_practice_ops_workspace",
            "gws_assistive_sidecar",
        ],
        "primary_gateway_surface_ref": "gws_clinician_workspace",
        "browser_posture_state": "read_only",
        "drift_state": "planned_exactness_gap",
        "design_group_ref": "dcpb::clinical_workspace::planned",
        "rationale": "Workspace route families remain one shell and one contract tuple even though clinician, practice, and assistive sidecar gateways specialize the same workspace truth.",
        "source_refs": [
            "blueprint/staff-workspace-interface-architecture.md",
            "blueprint/platform-frontend-blueprint.md#Shared IA rules",
            "data/analysis/gateway_bff_surfaces.json#gws_clinician_workspace",
        ],
    },
    {
        "group_id": "support_workspace",
        "audience_surface": "audsurf_support_workspace",
        "label": "Support routes",
        "shell_type": "support",
        "route_family_refs": ["rf_support_ticket_workspace", "rf_support_replay_observe"],
        "gateway_surface_refs": [
            "gws_support_ticket_workspace",
            "gws_support_replay_observe",
            "gws_support_assisted_capture",
        ],
        "primary_gateway_surface_ref": "gws_support_ticket_workspace",
        "browser_posture_state": "recovery_only",
        "drift_state": "replay_restore_guarded",
        "design_group_ref": "dcpb::support_workspace::planned",
        "rationale": "Support routes preserve ticket continuity and replay-safe recovery, so the manifest freezes live repair posture until replay and publication tuples are exact together.",
        "source_refs": [
            "blueprint/staff-operations-and-support-blueprint.md#Support route contract",
            "blueprint/platform-runtime-and-release-blueprint.md#FrontendContractManifest",
            "data/analysis/gateway_bff_surfaces.json#gws_support_ticket_workspace",
        ],
    },
    {
        "group_id": "hub_desk",
        "audience_surface": "audsurf_hub_desk",
        "label": "Hub desk routes",
        "shell_type": "hub",
        "route_family_refs": ["rf_hub_queue", "rf_hub_case_management"],
        "gateway_surface_refs": ["gws_hub_queue", "gws_hub_case_management"],
        "primary_gateway_surface_ref": "gws_hub_queue",
        "browser_posture_state": "read_only",
        "drift_state": "planned_exactness_gap",
        "design_group_ref": "dcpb::hub_desk::planned",
        "rationale": "Queue and case-management work stay in the same hub shell, but writable posture remains frozen until route, design, and runtime tuples are exact together.",
        "source_refs": [
            "blueprint/phase-5-the-network-horizon.md#Frontend work",
            "data/analysis/gateway_bff_surfaces.json#gws_hub_queue",
            "data/analysis/gateway_bff_surfaces.json#gws_hub_case_management",
        ],
    },
    {
        "group_id": "pharmacy_console",
        "audience_surface": "audsurf_pharmacy_console",
        "label": "Pharmacy console routes",
        "shell_type": "pharmacy",
        "route_family_refs": ["rf_pharmacy_console"],
        "gateway_surface_refs": ["gws_pharmacy_console"],
        "primary_gateway_surface_ref": "gws_pharmacy_console",
        "browser_posture_state": "read_only",
        "drift_state": "planned_exactness_gap",
        "design_group_ref": "dcpb::pharmacy_console::planned",
        "rationale": "Servicing-site case work must not remain actionable until dispatch, accessibility, and design publication tuples are aligned for the same shell.",
        "source_refs": [
            "blueprint/pharmacy-console-frontend-architecture.md#Mission frame",
            "data/analysis/gateway_bff_surfaces.json#gws_pharmacy_console",
        ],
    },
    {
        "group_id": "operations_console",
        "audience_surface": "audsurf_operations_console",
        "label": "Operations console routes",
        "shell_type": "operations",
        "route_family_refs": ["rf_operations_board", "rf_operations_drilldown"],
        "gateway_surface_refs": ["gws_operations_board", "gws_operations_drilldown"],
        "primary_gateway_surface_ref": "gws_operations_board",
        "browser_posture_state": "recovery_only",
        "drift_state": "watch_tuple_guarded",
        "design_group_ref": "dcpb::operations_console::planned",
        "rationale": "Operations board and drill-down stay same-shell, but exact watch tuple, parity, and accessibility evidence are prerequisites before live intervention posture returns.",
        "source_refs": [
            "blueprint/operations-console-frontend-blueprint.md#Canonical route family",
            "data/analysis/gateway_bff_surfaces.json#gws_operations_board",
            "data/analysis/gateway_bff_surfaces.json#gws_operations_drilldown",
        ],
    },
    {
        "group_id": "governance_admin",
        "audience_surface": "audsurf_governance_admin",
        "label": "Governance and admin routes",
        "shell_type": "governance",
        "route_family_refs": ["rf_governance_shell"],
        "gateway_surface_refs": ["gws_governance_shell"],
        "primary_gateway_surface_ref": "gws_governance_shell",
        "browser_posture_state": "read_only",
        "drift_state": "release_parity_pending",
        "design_group_ref": "dcpb::governance_admin::planned",
        "rationale": "Governance routes remain one dedicated control surface, but route-local calmness cannot outrun parity, release, accessibility, or design publication truth.",
        "source_refs": [
            "blueprint/governance-admin-console-frontend-blueprint.md#Shell and route topology",
            "data/analysis/gateway_bff_surfaces.json#gws_governance_shell",
        ],
    },
]

ARTIFACT_ROUTE_IDS = {
    "rf_patient_health_record",
    "rf_support_replay_observe",
    "rf_operations_board",
    "rf_governance_shell",
}

LIVE_CHANNEL_DISABLED_ROUTE_IDS = {
    "rf_intake_self_service",
    "rf_intake_telephony_capture",
    "rf_patient_secure_link_recovery",
    "rf_patient_health_record",
}

ASSUMPTIONS = [
    {
        "assumptionId": "ASSUMPTION_050_RUNTIME_PUBLICATION_REMAINS_PLACEHOLDER_UNTIL_SEQ_051",
        "state": "watch",
        "statement": (
            "Seq_050 binds every manifest to a stable RuntimePublicationBundle ref and AudienceSurfaceRuntimeBinding ref, "
            "but exact freeze and parity publication remains deferred to seq_051."
        ),
        "source_refs": [
            "prompt/051.md",
            "blueprint/platform-runtime-and-release-blueprint.md#FrontendContractManifest",
        ],
    },
    {
        "assumptionId": "ASSUMPTION_050_DESIGN_BUNDLE_REFS_PREDECLARE_SEQ_052_GROUPING",
        "state": "watch",
        "statement": (
            "Seq_050 publishes stable design bundle and lint refs per audience-surface group so seq_052 can harden the bundle content without changing manifest identity."
        ),
        "source_refs": [
            "prompt/052.md",
            "blueprint/canonical-ui-contract-kernel.md#Canonical contracts",
        ],
    },
]

DEFECTS = [
    {
        "defectId": "DRIFT_050_BROWSER_AUTHORITY_WAS_PREVIOUSLY_SPLIT",
        "state": "resolved",
        "severity": "high",
        "statement": "Browser authority previously existed only as fragments across route inventory, gateway surfaces, cache refs, and future design/runtime placeholders.",
    },
    {
        "defectId": "DRIFT_050_ROUTE_LOCAL_A11Y_AND_AUTOMATION_COULD_DRIFT",
        "state": "resolved",
        "severity": "high",
        "statement": "Route-local ARIA and test markers could replace published accessibility and automation truth instead of sharing one coverage tuple.",
    },
    {
        "defectId": "BLOCKER_050_EMBEDDED_CHANNEL_IS_DEFERRED",
        "state": "watch",
        "severity": "medium",
        "statement": "Embedded patient channel parity remains deferred and therefore keeps the grouped patient transaction/recovery manifest out of publishable_live posture.",
    },
]


def split_list(value: str) -> list[str]:
    if not value:
        return []
    return [item.strip() for item in value.split(";") if item.strip()]


def read_json(path: Path) -> Any:
    return json.loads(path.read_text())


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open() as handle:
        return list(csv.DictReader(handle))


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n")


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content)


def slug(value: str) -> str:
    cleaned = []
    for char in value.lower():
        cleaned.append(char if char.isalnum() else "_")
    result = "".join(cleaned)
    while "__" in result:
        result = result.replace("__", "_")
    return result.strip("_")


def short_hash(value: Any) -> str:
    serialized = json.dumps(value, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()[:16]


def ref(prefix: str, token: str) -> str:
    return f"{prefix}_{slug(token).upper()}_V1"


def now_iso() -> str:
    return TIMESTAMP


def route_behavior(route_row: dict[str, str]) -> dict[str, Any]:
    route_id = route_row["route_family_id"]
    route_slug = slug(route_id.replace("rf_", ""))
    allowed_mutations = route_row["allowed_mutations"].strip()
    has_mutation = bool(allowed_mutations) and not allowed_mutations.lower().startswith("no direct mutation")
    has_live = route_id not in LIVE_CHANNEL_DISABLED_ROUTE_IDS
    zero_result = "recovery_only" if any(
        token in route_id for token in ("recovery", "embedded", "replay", "telephony")
    ) else "authoritative_empty"
    artifact_modes = ["summary", "preview", "handoff"] if route_id in ARTIFACT_ROUTE_IDS else ["summary"]
    return {
        "routeSlug": route_slug,
        "hasMutation": has_mutation,
        "hasLive": has_live,
        "zeroResultDisposition": zero_result,
        "artifactModes": artifact_modes,
        "queryCode": f"{route_slug}.primary_read",
        "commandCode": f"{route_slug}.primary_mutation" if has_mutation else "",
        "channelCode": f"{route_slug}.state_updates" if has_live else "",
        "commandSettlementSchemaRef": f"CommandSettlementSchema::{route_slug}::v1",
        "transitionEnvelopeSchemaRef": f"TransitionEnvelopeSchema::{route_slug}::v1",
        "readinessFenceRef": f"PRF_050_{route_slug.upper()}_V1",
        "compatibilityWindowRef": f"RPW_050_{route_slug.upper()}_V1",
        "projectionSchemaRef": f"ProjectionSchema::{route_slug}::v1",
    }


def choose_keyboard_model(route_id: str, shell_type: str) -> str:
    if route_id in {"rf_operations_board", "rf_support_ticket_workspace"}:
        return "grid"
    if route_id in {"rf_staff_workspace", "rf_hub_queue"}:
        return "listbox"
    if route_id in {"rf_patient_messages", "rf_governance_shell"}:
        return "tabs"
    if shell_type in {"operations", "governance"}:
        return "grid"
    return "tab_ring"


def choose_focus_scope(route_id: str) -> str:
    if "workspace" in route_id or "queue" in route_id:
        return "selected_anchor_preserve"
    if "messages" in route_id:
        return "thread_focus_restore"
    if "appointments" in route_id or "requests" in route_id:
        return "detail_child_return"
    if "recovery" in route_id or "replay" in route_id:
        return "same_shell_recovery"
    return "surface_root"


def choose_landmarks(group_label: str, route_id: str) -> list[str]:
    landmarks = ["banner", "navigation", "main"]
    if route_id in {"rf_operations_board", "rf_governance_shell", "rf_support_replay_observe"}:
        landmarks.append("complementary")
    if "messages" in route_id or "health_record" in route_id:
        landmarks.append("region")
    if "intake" in route_id:
        landmarks.append("form")
    return landmarks


def purpose_of_use_refs(route_row: dict[str, str]) -> list[str]:
    route_id = route_row["route_family_id"]
    shell_type = route_row["shell_type"]
    if shell_type == "patient":
        return ["POU_050_PATIENT_SELF_SERVICE_V1"]
    if shell_type == "staff":
        return ["POU_050_CLINICAL_REVIEW_V1"]
    if shell_type == "support":
        return ["POU_050_SUPPORT_REPAIR_V1"]
    if shell_type == "hub":
        return ["POU_050_COORDINATION_SETTLEMENT_V1"]
    if shell_type == "pharmacy":
        return ["POU_050_PHARMACY_DISPATCH_V1"]
    if shell_type == "operations":
        return ["POU_050_OPERATIONS_WATCH_V1"]
    if shell_type == "governance":
        return ["POU_050_GOVERNANCE_RELEASE_V1"]
    return [f"POU_050_{slug(route_id).upper()}_V1"]


def load_context() -> dict[str, Any]:
    shell_ownership = read_json(SHELL_OWNERSHIP_PATH)
    route_rows = read_csv(ROUTE_FAMILY_PATH)
    surface_rows = read_csv(AUDIENCE_SURFACE_PATH)
    gateway_payload = read_json(GATEWAY_SURFACES_PATH)
    runtime_payload = read_json(RUNTIME_TOPOLOGY_PATH)
    event_payload = read_json(EVENT_REGISTRY_PATH)
    fhir_payload = read_json(FHIR_CONTRACTS_PATH)
    route_map = {row["route_family_id"]: row for row in route_rows}
    surface_map = {row["surface_id"]: row for row in surface_rows}
    gateway_map = {row["surfaceId"]: row for row in gateway_payload["gateway_surfaces"]}
    return {
        "shellOwnership": shell_ownership,
        "routeRows": route_rows,
        "routeMap": route_map,
        "surfaceRows": surface_rows,
        "surfaceMap": surface_map,
        "gatewayPayload": gateway_payload,
        "gatewayMap": gateway_map,
        "runtimePayload": runtime_payload,
        "eventPayload": event_payload,
        "fhirPayload": fhir_payload,
    }


def build_profile_catalog(context: dict[str, Any], browser_route_ids: set[str]) -> dict[str, Any]:
    route_profiles = []
    for route_id in sorted(browser_route_ids):
        row = context["routeMap"][route_id]
        behavior = route_behavior(row)
        shell_type = row["shell_type"]
        coverage_state = "blocked" if row["scope_posture"] == "deferred" else "degraded"
        accessibility_ref = ref("ASCP_050", route_id)
        automation_ref = ref("AAP_050", route_id)
        automation_map_ref = ref("AAM_050", route_id)
        state_semantics_ref = ref("SSSP_050", route_id)
        kernel_binding_ref = ref("SSKB_050", route_id)
        selection_refs = [
            ref("PSR_050", shell_type),
            ref("PSR_050", route_id),
        ]
        required_markers = [
            f"{slug(route_id)}-root",
            "surface-state",
            "dominant-action",
            "selected-anchor",
            "accessibility-coverage-state",
            "semantic-surface",
            "keyboard-model",
            "focus-transition-scope",
            "live-announce-state",
        ]
        profile = {
            "routeFamilyRef": route_id,
            "routeFamilyLabel": row["route_family"],
            "shellType": shell_type,
            "profileSelectionResolutionRefs": selection_refs,
            "accessibilitySemanticCoverageProfileRef": accessibility_ref,
            "accessibilityCoverageState": coverage_state,
            "coverageTupleHash": short_hash(
                {
                    "routeFamilyRef": route_id,
                    "selectionRefs": selection_refs,
                    "landmarks": choose_landmarks(row["primary_surface_name"], route_id),
                    "keyboardModel": choose_keyboard_model(route_id, shell_type),
                    "focusScope": choose_focus_scope(route_id),
                }
            ),
            "automationAnchorProfileRef": automation_ref,
            "automationAnchorMapRef": automation_map_ref,
            "surfaceStateSemanticsProfileRef": state_semantics_ref,
            "surfaceStateKernelBindingRef": kernel_binding_ref,
            "keyboardModel": choose_keyboard_model(route_id, shell_type),
            "focusTransitionScope": choose_focus_scope(route_id),
            "landmarks": choose_landmarks(row["primary_surface_name"], route_id),
            "breakpointCoverageRefs": ["compact", "narrow", "medium", "expanded", "wide"],
            "modeCoverageRefs": ["theme_light", "contrast_standard", "density_balanced", "motion_reduced"],
            "requiredDomMarkers": required_markers,
            "requiredDataAttributes": [
                "data-surface-state",
                "data-state-owner",
                "data-state-reason",
                "data-dominant-action",
                "data-accessibility-coverage-state",
                "data-semantic-surface",
                "data-keyboard-model",
                "data-focus-transition-scope",
                "data-live-announce-state",
            ],
            "verificationState": "planned_exactness_gap" if coverage_state == "degraded" else "blocked",
            "source_refs": split_list(row["source_refs"])
            + [
                "blueprint/platform-frontend-blueprint.md#Shared IA rules",
                "blueprint/accessibility-and-content-system-contract.md#Canonical accessibility and content objects",
            ],
            "generatedAt": now_iso(),
        }
        route_profiles.append(profile)
    payload = {
        "task_id": TASK_ID,
        "generated_at": now_iso(),
        "captured_on": CAPTURED_ON,
        "summary": {
            "route_profile_count": len(route_profiles),
            "coverage_state_counts": OrderedDict(
                (
                    state,
                    sum(1 for row in route_profiles if row["accessibilityCoverageState"] == state),
                )
                for state in ["complete", "degraded", "blocked"]
            ),
        },
        "routeProfiles": route_profiles,
    }
    return payload


def build_contract_catalog(
    context: dict[str, Any],
    profile_payload: dict[str, Any],
    browser_route_ids: set[str],
) -> dict[str, Any]:
    route_profiles = {row["routeFamilyRef"]: row for row in profile_payload["routeProfiles"]}
    projection_contract_families = []
    projection_contract_versions = []
    projection_query_contracts = []
    mutation_command_contracts = []
    live_update_channel_contracts = []
    route_contracts = {}
    mutation_map: dict[str, str] = {}
    query_map: dict[str, str] = {}
    live_map: dict[str, str] = {}
    version_map: dict[str, str] = {}

    for route_id in sorted(browser_route_ids):
        row = context["routeMap"][route_id]
        behavior = route_behavior(row)
        route_slug = behavior["routeSlug"]
        family_id = ref("PCF_050", route_id)
        version_id = ref("PCV_050", route_id)
        query_id = ref("PQC_050", route_id)
        query_map[route_id] = query_id
        version_map[route_id] = version_id

        projection_contract_families.append(
            {
                "projectionContractFamilyId": family_id,
                "audienceSurface": row["shell_type"],
                "routeFamilyRefs": [route_id],
                "queryCode": behavior["queryCode"],
                "projectionFamilyRefs": split_list(row["governing_objects"]),
                "canonicalObjectDescriptorRefs": split_list(row["governing_objects"]),
                "compatibilityPolicyRef": "PCOMP_050_ADDITIVE_SAFE_V1",
                "currentProjectionContractVersionRef": version_id,
                "defaultRecoveryDispositionRef": ref("RRD_050", route_id),
                "familyState": "active",
                "publishedAt": now_iso(),
                "source_refs": split_list(row["source_refs"])
                + ["blueprint/platform-runtime-and-release-blueprint.md#ProjectionContractFamily"],
            }
        )
        projection_contract_versions.append(
            {
                "projectionContractVersionId": version_id,
                "projectionContractFamilyRef": family_id,
                "versionOrdinal": 1,
                "responseSchemaRef": behavior["projectionSchemaRef"],
                "contractDigestRef": short_hash([family_id, behavior["projectionSchemaRef"], query_id]),
                "changeClass": "additive_with_placeholder",
                "supersedesProjectionContractVersionRef": None,
                "compatiblePredecessorRefs": [],
                "minimumConsumerManifestRef": None,
                "summaryFallbackDispositionRef": ref("RRD_050", route_id),
                "introducedInReleaseRef": "REL_050_FOUNDATION_PLACEHOLDER",
                "deprecatedAfterReleaseRef": None,
                "publishedAt": now_iso(),
                "source_refs": split_list(row["source_refs"])
                + ["blueprint/platform-runtime-and-release-blueprint.md#ProjectionContractVersion"],
            }
        )
        projection_query_contracts.append(
            {
                "projectionQueryContractId": query_id,
                "routeFamilyRef": route_id,
                "queryCode": behavior["queryCode"],
                "projectionContractFamilyRef": family_id,
                "projectionContractVersionRef": version_id,
                "projectionSourceRef": split_list(row["governing_objects"])[0],
                "responseSchemaRef": behavior["projectionSchemaRef"],
                "visibilityCoverageRefs": [f"AVC_050_{route_slug.upper()}_V1"],
                "allowedPurposeOfUseRefs": purpose_of_use_refs(row),
                "requiredReadPathCompatibilityWindowRef": behavior["compatibilityWindowRef"],
                "requiredProjectionReadinessRefs": [behavior["readinessFenceRef"]],
                "zeroResultDisposition": behavior["zeroResultDisposition"],
                "freshnessContractRef": route_profiles[route_id]["accessibilitySemanticCoverageProfileRef"],
                "clientCachePolicyRef": "",
                "artifactModeRefs": behavior["artifactModes"],
                "contractDigestRef": short_hash([query_id, family_id, version_id]),
                "generatedAt": now_iso(),
                "source_refs": split_list(row["source_refs"])
                + ["blueprint/platform-runtime-and-release-blueprint.md#ProjectionQueryContract"],
            }
        )
        if behavior["hasMutation"]:
            mutation_id = ref("MCC_050", route_id)
            mutation_map[route_id] = mutation_id
            mutation_command_contracts.append(
                {
                    "mutationCommandContractId": mutation_id,
                    "routeFamilyRef": route_id,
                    "commandCode": behavior["commandCode"],
                    "commandSettlementSchemaRef": behavior["commandSettlementSchemaRef"],
                    "transitionEnvelopeSchemaRef": behavior["transitionEnvelopeSchemaRef"],
                    "requiredRouteIntentBindingRef": ref("RIB_050", route_id),
                    "requiredAudienceSurfaceRuntimeBindingRef": ref("ASRB_050", route_id),
                    "requiredReleaseRecoveryDispositionRef": ref("RRD_050", route_id),
                    "contractDigestRef": short_hash([mutation_id, behavior["commandCode"]]),
                    "generatedAt": now_iso(),
                    "source_refs": split_list(row["source_refs"])
                    + ["blueprint/platform-runtime-and-release-blueprint.md#MutationCommandContract"],
                }
            )
        if behavior["hasLive"]:
            live_id = ref("LCC_050", route_id)
            live_map[route_id] = live_id
            live_update_channel_contracts.append(
                {
                    "liveUpdateChannelContractId": live_id,
                    "routeFamilyRef": route_id,
                    "channelCode": behavior["channelCode"],
                    "transport": "sse" if row["shell_type"] != "operations" else "websocket",
                    "channelPosture": "buffered_replay_safe",
                    "continuityBindingRef": ref("CCB_050", route_id),
                    "contractDigestRef": short_hash([live_id, behavior["channelCode"]]),
                    "generatedAt": now_iso(),
                    "source_refs": split_list(row["source_refs"])
                    + ["blueprint/platform-runtime-and-release-blueprint.md#LiveUpdateChannelContract"],
                }
            )
        route_contracts[route_id] = {
            "routeFamilyRef": route_id,
            "surfaceStateKernelBindingRef": route_profiles[route_id]["surfaceStateKernelBindingRef"],
            "surfaceStateSemanticsProfileRef": route_profiles[route_id]["surfaceStateSemanticsProfileRef"],
            "automationAnchorProfileRef": route_profiles[route_id]["automationAnchorProfileRef"],
            "accessibilitySemanticCoverageProfileRef": route_profiles[route_id]["accessibilitySemanticCoverageProfileRef"],
            "projectionQueryContractRef": query_id,
            "mutationCommandContractRef": mutation_map.get(route_id),
            "liveUpdateChannelContractRef": live_map.get(route_id),
            "commandSettlementSchemaRef": behavior["commandSettlementSchemaRef"],
            "transitionEnvelopeSchemaRef": behavior["transitionEnvelopeSchemaRef"],
        }
    return {
        "projectionContractFamilies": projection_contract_families,
        "projectionContractVersions": projection_contract_versions,
        "projectionQueryContracts": projection_query_contracts,
        "mutationCommandContracts": mutation_command_contracts,
        "liveUpdateChannelContracts": live_update_channel_contracts,
        "routeContractMap": route_contracts,
        "queryMap": query_map,
        "mutationMap": mutation_map,
        "liveMap": live_map,
        "versionMap": version_map,
    }


def build_cache_policies(groups: list[dict[str, Any]], gateway_map: dict[str, Any]) -> list[dict[str, Any]]:
    policies: OrderedDict[str, dict[str, Any]] = OrderedDict()
    for group in groups:
        for gateway_id in group["gateway_surface_refs"]:
            gateway = gateway_map[gateway_id]
            ref_id = gateway["cachePolicyRef"]
            policy = policies.setdefault(
                ref_id,
                {
                    "clientCachePolicyId": ref_id,
                    "storageMode": "memory_only",
                    "scopeMode": gateway["tenantScopeMode"],
                    "freshnessModel": "binding_rechecked",
                    "degradeOnDrift": True,
                    "sourceGatewayRefs": [],
                    "source_refs": [],
                },
            )
            if "PUBLIC" in ref_id:
                policy["storageMode"] = "public_safe_memory_only"
            elif "REPLAY" in ref_id or "MASK" in ref_id:
                policy["storageMode"] = "masked_session_only"
            elif "OPERATIONS" in ref_id or "GOVERNANCE" in ref_id:
                policy["storageMode"] = "tuple_scoped_memory"
            else:
                policy["storageMode"] = "tenant_scoped_session_memory"
            policy["sourceGatewayRefs"].append(gateway_id)
            policy["source_refs"].extend(split_list("; ".join(gateway["source_refs"])))
    for value in policies.values():
        value["source_refs"] = sorted(set(value["source_refs"]))
        value["generatedAt"] = now_iso()
    return list(policies.values())


def aggregate_source_refs(*collections: list[str]) -> list[str]:
    flattened: list[str] = []
    for collection in collections:
        flattened.extend(collection)
    return sorted(dict.fromkeys(flattened))


def build_manifest_payload(
    context: dict[str, Any],
    profile_payload: dict[str, Any],
    contract_catalog: dict[str, Any],
) -> tuple[dict[str, Any], list[dict[str, str]]]:
    gateway_map = context["gatewayMap"]
    route_map = context["routeMap"]
    route_contract_map = contract_catalog["routeContractMap"]
    query_map = contract_catalog["queryMap"]
    mutation_map = contract_catalog["mutationMap"]
    live_map = contract_catalog["liveMap"]
    version_map = contract_catalog["versionMap"]
    profile_map = {row["routeFamilyRef"]: row for row in profile_payload["routeProfiles"]}
    client_cache_policies = build_cache_policies(MANIFEST_GROUPS, gateway_map)
    cache_policy_map = {row["clientCachePolicyId"]: row for row in client_cache_policies}

    surface_route_contracts = []
    surface_publications = []
    runtime_bindings = []
    projection_version_sets = []
    manifests = []
    matrix_rows: list[dict[str, str]] = []

    for group in MANIFEST_GROUPS:
        route_refs = group["route_family_refs"]
        route_rows = [route_map[route_id] for route_id in route_refs]
        gateway_rows = [gateway_map[gateway_id] for gateway_id in group["gateway_surface_refs"]]
        primary_gateway = gateway_map[group["primary_gateway_surface_ref"]]

        profile_selection_refs = [ref("PSR_050", group["group_id"])] + [
            profile_ref
            for route_id in route_refs
            for profile_ref in profile_map[route_id]["profileSelectionResolutionRefs"]
        ]
        profile_selection_refs = list(dict.fromkeys(profile_selection_refs))
        accessibility_refs = [profile_map[route_id]["accessibilitySemanticCoverageProfileRef"] for route_id in route_refs]
        automation_refs = [profile_map[route_id]["automationAnchorProfileRef"] for route_id in route_refs]
        state_semantics_refs = [profile_map[route_id]["surfaceStateSemanticsProfileRef"] for route_id in route_refs]
        kernel_binding_refs = [profile_map[route_id]["surfaceStateKernelBindingRef"] for route_id in route_refs]
        query_refs = [query_map[route_id] for route_id in route_refs]
        mutation_refs = [mutation_map[route_id] for route_id in route_refs if route_id in mutation_map]
        live_refs = [live_map[route_id] for route_id in route_refs if route_id in live_map]
        required_versions = [version_map[route_id] for route_id in route_refs]
        cache_refs = sorted({gateway["cachePolicyRef"] for gateway in gateway_rows})
        command_schema_refs = sorted(
            {
                route_contract_map[route_id]["commandSettlementSchemaRef"]
                for route_id in route_refs
            }
        )
        transition_schema_refs = sorted(
            {
                route_contract_map[route_id]["transitionEnvelopeSchemaRef"]
                for route_id in route_refs
            }
        )
        recovery_refs = sorted(
            {
                ref_id
                for gateway in gateway_rows
                for ref_id in gateway["recoveryDispositionRefs"]
            }
        )
        publication_state = "stale"
        coverage_state = (
            "blocked"
            if any(profile_map[route_id]["accessibilityCoverageState"] == "blocked" for route_id in route_refs)
            else "degraded"
        )

        manifest_id = ref("FCM_050", group["group_id"])
        route_contract_ref = ref("ASRC_050", group["group_id"])
        publication_ref = ref("ASPR_050", group["group_id"])
        binding_ref = ref("ASRB_050", group["group_id"])
        version_set_ref = ref("PCVS_050", group["group_id"])
        runtime_bundle_ref = f"rpb::{group['group_id']}::planned"
        lint_ref = f"dclv::{group['group_id']}::pending"
        route_freeze_ref = ref("RFD_050", group["group_id"])

        design_digest = short_hash(
            [
                group["design_group_ref"],
                TOKEN_KERNEL_LAYERING_POLICY_REF,
                profile_selection_refs,
                accessibility_refs,
                automation_refs,
                state_semantics_refs,
            ]
        )
        frontend_digest = short_hash(
            [
                manifest_id,
                route_refs,
                group["gateway_surface_refs"],
                query_refs,
                mutation_refs,
                live_refs,
                cache_refs,
            ]
        )
        profile_layering_digest = short_hash([TOKEN_KERNEL_LAYERING_POLICY_REF, profile_selection_refs])
        kernel_digest = short_hash(kernel_binding_refs)
        accessibility_digest = short_hash([accessibility_refs, automation_refs, state_semantics_refs])
        projection_digest = short_hash([version_set_ref, required_versions, query_refs])
        surface_tuple_hash = short_hash(
            [
                manifest_id,
                route_contract_ref,
                publication_ref,
                binding_ref,
                group["design_group_ref"],
                runtime_bundle_ref,
                profile_layering_digest,
                kernel_digest,
                accessibility_digest,
                projection_digest,
                group["browser_posture_state"],
            ]
        )

        projection_version_sets.append(
            {
                "projectionContractVersionSetId": version_set_ref,
                "audienceSurface": group["audience_surface"],
                "routeFamilyRef": route_refs[0],
                "routeFamilyRefs": route_refs,
                "projectionContractFamilyRefs": [ref("PCF_050", route_id) for route_id in route_refs],
                "requiredProjectionContractVersionRefs": required_versions,
                "allowedAdditiveCompatibilityRefs": ["PCOMP_050_ADDITIVE_SAFE_V1"],
                "routeContractDigestRef": frontend_digest,
                "frontendContractManifestRef": manifest_id,
                "readPathCompatibilityWindowRef": ref("RPCW_050", group["group_id"]),
                "compatibilityState": "constrained" if group["browser_posture_state"] == "read_only" else "recovery_only",
                "projectionCompatibilityDigestRef": projection_digest,
                "generatedAt": now_iso(),
                "source_refs": aggregate_source_refs(
                    group["source_refs"],
                    ["blueprint/platform-runtime-and-release-blueprint.md#ProjectionContractVersionSet"],
                ),
            }
        )

        surface_route_contracts.append(
            {
                "audienceSurfaceRouteContractId": route_contract_ref,
                "audienceSurface": group["audience_surface"],
                "routeFamilyRefs": route_refs,
                "routePathsByFamily": {
                    route_id: route_map[route_id]["route_family"] for route_id in route_refs
                },
                "shellType": group["shell_type"],
                "continuityContractRef": ref("SCF_050", group["group_id"]),
                "hydrationContractRefs": [ref("SHC_050", route_id) for route_id in route_refs],
                "selectedAnchorPolicyRefs": [ref("SAP_050", route_id) for route_id in route_refs],
                "source_refs": aggregate_source_refs(
                    group["source_refs"],
                    *[split_list(route_row["source_refs"]) for route_row in route_rows],
                    ["blueprint/platform-frontend-blueprint.md#Shared visibility, hydration, and empty-state rules"],
                ),
            }
        )
        surface_publications.append(
            {
                "audienceSurfacePublicationRef": publication_ref,
                "audienceSurface": group["audience_surface"],
                "routeFamilyRefs": route_refs,
                "gatewaySurfaceRefs": group["gateway_surface_refs"],
                "designContractPublicationBundleRef": group["design_group_ref"],
                "runtimePublicationBundleRef": runtime_bundle_ref,
                "publicationState": publication_state,
                "designContractLintVerdictRef": lint_ref,
                "publicationDigestRef": short_hash(
                    [publication_ref, group["design_group_ref"], runtime_bundle_ref, frontend_digest]
                ),
                "publishedAt": now_iso(),
                "source_refs": aggregate_source_refs(
                    group["source_refs"],
                    ["blueprint/platform-runtime-and-release-blueprint.md#FrontendContractManifest"],
                ),
            }
        )
        runtime_bindings.append(
            {
                "audienceSurfaceRuntimeBindingId": binding_ref,
                "audienceSurface": group["audience_surface"],
                "routeFamilyRefs": route_refs,
                "gatewaySurfaceRefs": group["gateway_surface_refs"],
                "surfaceRouteContractRef": route_contract_ref,
                "surfacePublicationRef": publication_ref,
                "runtimePublicationBundleRef": runtime_bundle_ref,
                "designContractPublicationBundleRef": group["design_group_ref"],
                "bindingState": group["browser_posture_state"],
                "surfaceAuthorityState": group["drift_state"],
                "releaseRecoveryDispositionRefs": recovery_refs,
                "routeFreezeDispositionRefs": [route_freeze_ref],
                "surfaceTupleHash": surface_tuple_hash,
                "generatedAt": now_iso(),
                "source_refs": aggregate_source_refs(
                    group["source_refs"],
                    ["blueprint/platform-runtime-and-release-blueprint.md#AudienceSurfaceRuntimeBinding"],
                ),
            }
        )

        manifests.append(
            {
                "frontendContractManifestId": manifest_id,
                "manifestState": "active",
                "audienceSurface": group["audience_surface"],
                "audienceSurfaceLabel": group["label"],
                "shellType": group["shell_type"],
                "routeFamilyRefs": route_refs,
                "gatewaySurfaceRef": group["primary_gateway_surface_ref"],
                "gatewaySurfaceRefs": group["gateway_surface_refs"],
                "surfaceRouteContractRef": route_contract_ref,
                "surfacePublicationRef": publication_ref,
                "audienceSurfaceRuntimeBindingRef": binding_ref,
                "designContractPublicationBundleRef": group["design_group_ref"],
                "tokenKernelLayeringPolicyRef": TOKEN_KERNEL_LAYERING_POLICY_REF,
                "profileSelectionResolutionRefs": profile_selection_refs,
                "surfaceStateKernelBindingRefs": kernel_binding_refs,
                "projectionContractVersionSetRef": version_set_ref,
                "runtimePublicationBundleRef": runtime_bundle_ref,
                "projectionQueryContractRefs": query_refs,
                "mutationCommandContractRefs": mutation_refs,
                "liveUpdateChannelContractRefs": live_refs,
                "clientCachePolicyRef": primary_gateway["cachePolicyRef"],
                "clientCachePolicyRefs": cache_refs,
                "commandSettlementSchemaRef": command_schema_refs[0],
                "commandSettlementSchemaRefs": command_schema_refs,
                "transitionEnvelopeSchemaRef": transition_schema_refs[0],
                "transitionEnvelopeSchemaRefs": transition_schema_refs,
                "releaseRecoveryDispositionRef": recovery_refs[0],
                "releaseRecoveryDispositionRefs": recovery_refs,
                "routeFreezeDispositionRef": route_freeze_ref,
                "routeFreezeDispositionRefs": [route_freeze_ref],
                "browserPostureState": group["browser_posture_state"],
                "driftState": group["drift_state"],
                "frontendContractDigestRef": frontend_digest,
                "designContractDigestRef": design_digest,
                "designContractLintVerdictRef": lint_ref,
                "profileLayeringDigestRef": profile_layering_digest,
                "kernelPropagationDigestRef": kernel_digest,
                "accessibilitySemanticCoverageProfileRefs": accessibility_refs,
                "automationAnchorProfileRefs": automation_refs,
                "surfaceStateSemanticsProfileRefs": state_semantics_refs,
                "accessibilityCoverageDigestRef": accessibility_digest,
                "accessibilityCoverageState": coverage_state,
                "projectionCompatibilityDigestRef": projection_digest,
                "surfaceAuthorityTupleHash": surface_tuple_hash,
                "generatedAt": now_iso(),
                "publishableLiveRequirements": [
                    "Current RuntimePublicationBundle with exact parity",
                    "Published DesignContractPublicationBundle with passing lint verdict",
                    "AccessibilitySemanticCoverageProfile.coverageState = complete",
                    "ProjectionContractVersionSet.compatibilityState = exact or additive_compatible",
                ],
                "readOnlyTriggers": [
                    "Design bundle or lint verdict stale",
                    "Projection compatibility constrained",
                    "Mutating controls frozen by RouteIntent or publication drift",
                ],
                "recoveryOnlyTriggers": [
                    "Route recovery, replay, grant re-entry, or watch tuple restore required",
                    "Runtime binding exactness unavailable but same-shell recovery must stay visible",
                ],
                "blockedTriggers": [
                    "Deferred or withdrawn channel profile",
                    "Missing runtime publication bundle or blocked accessibility coverage",
                ],
                "rationale": group["rationale"],
                "source_refs": aggregate_source_refs(
                    group["source_refs"],
                    *[split_list(route_row["source_refs"]) for route_row in route_rows],
                    ["blueprint/platform-runtime-and-release-blueprint.md#FrontendContractManifest"],
                ),
            }
        )

        for route_id in route_refs:
            matrix_rows.append(
                {
                    "frontend_contract_manifest_id": manifest_id,
                    "audience_surface": group["audience_surface"],
                    "route_family_id": route_id,
                    "gateway_surface_refs": ";".join(
                        [
                            gateway_id
                            for gateway_id in group["gateway_surface_refs"]
                            if route_id in gateway_map[gateway_id]["routeFamilies"]
                        ]
                    ),
                    "projection_query_contract_refs": query_map[route_id],
                    "mutation_command_contract_refs": mutation_map.get(route_id, ""),
                    "live_update_channel_contract_refs": live_map.get(route_id, ""),
                    "client_cache_policy_ref": next(
                        gateway_map[gateway_id]["cachePolicyRef"]
                        for gateway_id in group["gateway_surface_refs"]
                        if route_id in gateway_map[gateway_id]["routeFamilies"]
                    ),
                    "projection_contract_version_set_ref": version_set_ref,
                    "command_settlement_schema_ref": route_contract_map[route_id]["commandSettlementSchemaRef"],
                    "transition_envelope_schema_ref": route_contract_map[route_id]["transitionEnvelopeSchemaRef"],
                    "release_recovery_disposition_ref": recovery_refs[0],
                    "route_freeze_disposition_ref": route_freeze_ref,
                    "browser_posture_state": group["browser_posture_state"],
                    "accessibility_profile_ref": profile_map[route_id]["accessibilitySemanticCoverageProfileRef"],
                    "automation_anchor_profile_ref": profile_map[route_id]["automationAnchorProfileRef"],
                    "surface_state_semantics_profile_ref": profile_map[route_id]["surfaceStateSemanticsProfileRef"],
                    "drift_state": group["drift_state"],
                }
            )

    payload = {
        "task_id": TASK_ID,
        "generated_at": now_iso(),
        "captured_on": CAPTURED_ON,
        "visual_mode": VISUAL_MODE,
        "mission": MISSION,
        "source_precedence": SOURCE_PRECEDENCE,
        "upstream_inputs": [
            "data/analysis/shell_ownership_map.json",
            "data/analysis/route_family_inventory.csv",
            "data/analysis/audience_surface_inventory.csv",
            "data/analysis/gateway_bff_surfaces.json",
            "data/analysis/runtime_topology_manifest.json",
            "data/analysis/canonical_event_contracts.json",
            "data/analysis/fhir_representation_contracts.json",
        ],
        "summary": {
            "manifest_count": len(manifests),
            "browser_visible_route_family_count": sum(len(row["routeFamilyRefs"]) for row in manifests),
            "gateway_surface_count": sum(len(row["gatewaySurfaceRefs"]) for row in manifests),
            "projection_query_contract_count": len(contract_catalog["projectionQueryContracts"]),
            "mutation_command_contract_count": len(contract_catalog["mutationCommandContracts"]),
            "live_update_channel_contract_count": len(contract_catalog["liveUpdateChannelContracts"]),
            "client_cache_policy_count": len(client_cache_policies),
            "read_only_manifest_count": sum(1 for row in manifests if row["browserPostureState"] == "read_only"),
            "recovery_only_manifest_count": sum(
                1 for row in manifests if row["browserPostureState"] == "recovery_only"
            ),
            "blocked_manifest_count": sum(1 for row in manifests if row["browserPostureState"] == "blocked"),
        },
        "assumptions": ASSUMPTIONS,
        "defects": DEFECTS,
        "frontendContractManifests": manifests,
        "surfaceRouteContracts": surface_route_contracts,
        "surfacePublications": surface_publications,
        "audienceSurfaceRuntimeBindings": runtime_bindings,
        "projectionContractFamilies": contract_catalog["projectionContractFamilies"],
        "projectionContractVersions": contract_catalog["projectionContractVersions"],
        "projectionContractVersionSets": projection_version_sets,
        "projectionQueryContracts": contract_catalog["projectionQueryContracts"],
        "mutationCommandContracts": contract_catalog["mutationCommandContracts"],
        "liveUpdateChannelContracts": contract_catalog["liveUpdateChannelContracts"],
        "clientCachePolicies": client_cache_policies,
    }

    for query_contract in payload["projectionQueryContracts"]:
        for matrix_row in matrix_rows:
            if matrix_row["projection_query_contract_refs"] == query_contract["projectionQueryContractId"]:
                query_contract["clientCachePolicyRef"] = matrix_row["client_cache_policy_ref"]
                break

    return payload, matrix_rows


def build_generation_rules(payload: dict[str, Any]) -> dict[str, Any]:
    return {
        "task_id": TASK_ID,
        "generated_at": now_iso(),
        "source_precedence": SOURCE_PRECEDENCE,
        "generatorInputs": [
            "shell_ownership_map.json",
            "route_family_inventory.csv",
            "audience_surface_inventory.csv",
            "gateway_bff_surfaces.json",
            "runtime_topology_manifest.json",
            "canonical_event_contracts.json",
            "fhir_representation_contracts.json",
        ],
        "groupingLaw": [
            "One active manifest row groups exactly one audience-surface class plus one declared browser-visible route-family set.",
            "Each browser-visible route family may appear in exactly one active manifest row.",
            "Grouped manifests may bind multiple gateway surfaces, but only one primary gatewaySurfaceRef is exposed as the manifest anchor.",
        ],
        "digestInputs": {
            "frontendContractDigestRef": [
                "routeFamilyRefs",
                "gatewaySurfaceRefs",
                "projectionQueryContractRefs",
                "mutationCommandContractRefs",
                "liveUpdateChannelContractRefs",
                "clientCachePolicyRefs",
            ],
            "designContractDigestRef": [
                "designContractPublicationBundleRef",
                "tokenKernelLayeringPolicyRef",
                "profileSelectionResolutionRefs",
                "accessibilitySemanticCoverageProfileRefs",
                "automationAnchorProfileRefs",
                "surfaceStateSemanticsProfileRefs",
            ],
            "surfaceAuthorityTupleHash": [
                "surfaceRouteContractRef",
                "surfacePublicationRef",
                "audienceSurfaceRuntimeBindingRef",
                "designContractPublicationBundleRef",
                "runtimePublicationBundleRef",
                "profileLayeringDigestRef",
                "kernelPropagationDigestRef",
                "accessibilityCoverageDigestRef",
                "projectionCompatibilityDigestRef",
                "browserPostureState",
            ],
        },
        "regenerationTriggers": [
            "Route family inventory changes",
            "Gateway surface ownership or cache policy changes",
            "Runtime topology manifest hash changes",
            "Projection contract family or version-set changes",
            "Design bundle grouping or lint refs change",
            "Accessibility or automation coverage refs change",
        ],
        "browserPostureDecisionRules": [
            "publishable_live requires exact runtime publication, exact projection compatibility, published design bundle, passing lint, and complete accessibility coverage",
            "read_only is used when a surface may still show authoritative summaries but mutation or calm trust is frozen",
            "recovery_only is used when the same shell must preserve recovery, replay, or re-entry posture while writable state is withheld",
            "blocked is used when channel posture is deferred, withdrawn, or lacks a legal runtime/design tuple",
        ],
        "schemaRefs": [str(SCHEMA_PATH.relative_to(ROOT))],
        "assumptions": ASSUMPTIONS,
        "defects": DEFECTS,
        "summary": payload["summary"],
    }


def build_schema() -> dict[str, Any]:
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://vecells.local/schemas/frontend-contract-manifest.schema.json",
        "title": "FrontendContractManifest",
        "type": "object",
        "additionalProperties": True,
        "required": [
            "frontendContractManifestId",
            "audienceSurface",
            "routeFamilyRefs",
            "gatewaySurfaceRef",
            "surfaceRouteContractRef",
            "surfacePublicationRef",
            "audienceSurfaceRuntimeBindingRef",
            "designContractPublicationBundleRef",
            "tokenKernelLayeringPolicyRef",
            "profileSelectionResolutionRefs",
            "surfaceStateKernelBindingRefs",
            "projectionContractVersionSetRef",
            "runtimePublicationBundleRef",
            "projectionQueryContractRefs",
            "mutationCommandContractRefs",
            "liveUpdateChannelContractRefs",
            "clientCachePolicyRef",
            "commandSettlementSchemaRef",
            "transitionEnvelopeSchemaRef",
            "releaseRecoveryDispositionRef",
            "routeFreezeDispositionRef",
            "browserPostureState",
            "frontendContractDigestRef",
            "designContractDigestRef",
            "designContractLintVerdictRef",
            "profileLayeringDigestRef",
            "kernelPropagationDigestRef",
            "accessibilitySemanticCoverageProfileRefs",
            "automationAnchorProfileRefs",
            "surfaceStateSemanticsProfileRefs",
            "accessibilityCoverageDigestRef",
            "accessibilityCoverageState",
            "projectionCompatibilityDigestRef",
            "surfaceAuthorityTupleHash",
            "generatedAt",
            "source_refs",
        ],
        "properties": {
            "frontendContractManifestId": {"type": "string"},
            "audienceSurface": {"type": "string"},
            "routeFamilyRefs": {"type": "array", "items": {"type": "string"}, "minItems": 1},
            "gatewaySurfaceRef": {"type": "string"},
            "gatewaySurfaceRefs": {"type": "array", "items": {"type": "string"}, "minItems": 1},
            "surfaceRouteContractRef": {"type": "string"},
            "surfacePublicationRef": {"type": "string"},
            "audienceSurfaceRuntimeBindingRef": {"type": "string"},
            "designContractPublicationBundleRef": {"type": "string"},
            "tokenKernelLayeringPolicyRef": {"type": "string"},
            "profileSelectionResolutionRefs": {"type": "array", "items": {"type": "string"}},
            "surfaceStateKernelBindingRefs": {"type": "array", "items": {"type": "string"}},
            "projectionContractVersionSetRef": {"type": "string"},
            "runtimePublicationBundleRef": {"type": "string"},
            "projectionQueryContractRefs": {"type": "array", "items": {"type": "string"}},
            "mutationCommandContractRefs": {"type": "array", "items": {"type": "string"}},
            "liveUpdateChannelContractRefs": {"type": "array", "items": {"type": "string"}},
            "clientCachePolicyRef": {"type": "string"},
            "clientCachePolicyRefs": {"type": "array", "items": {"type": "string"}},
            "commandSettlementSchemaRef": {"type": "string"},
            "transitionEnvelopeSchemaRef": {"type": "string"},
            "releaseRecoveryDispositionRef": {"type": "string"},
            "routeFreezeDispositionRef": {"type": "string"},
            "browserPostureState": {
                "type": "string",
                "enum": ["publishable_live", "read_only", "recovery_only", "blocked"],
            },
            "frontendContractDigestRef": {"type": "string"},
            "designContractDigestRef": {"type": "string"},
            "designContractLintVerdictRef": {"type": "string"},
            "profileLayeringDigestRef": {"type": "string"},
            "kernelPropagationDigestRef": {"type": "string"},
            "accessibilitySemanticCoverageProfileRefs": {"type": "array", "items": {"type": "string"}},
            "automationAnchorProfileRefs": {"type": "array", "items": {"type": "string"}},
            "surfaceStateSemanticsProfileRefs": {"type": "array", "items": {"type": "string"}},
            "accessibilityCoverageDigestRef": {"type": "string"},
            "accessibilityCoverageState": {
                "type": "string",
                "enum": ["complete", "degraded", "blocked"],
            },
            "projectionCompatibilityDigestRef": {"type": "string"},
            "surfaceAuthorityTupleHash": {"type": "string"},
            "generatedAt": {"type": "string"},
            "source_refs": {"type": "array", "items": {"type": "string"}, "minItems": 1},
        },
    }


def build_strategy_doc(payload: dict[str, Any], rules_payload: dict[str, Any]) -> str:
    summary = payload["summary"]
    manifest_lines = []
    for manifest in payload["frontendContractManifests"]:
        manifest_lines.append(
            "| "
            + " | ".join(
                [
                    manifest["audienceSurfaceLabel"],
                    ", ".join(manifest["routeFamilyRefs"]),
                    manifest["gatewaySurfaceRef"],
                    manifest["browserPostureState"],
                    manifest["driftState"],
                ]
            )
            + " |"
        )
    return "\n".join(
        [
            "# 50 Frontend Contract Manifest Strategy",
            "",
            "## Purpose",
            "",
            MISSION,
            "",
            "## Summary",
            "",
            f"- Active manifests: `{summary['manifest_count']}`",
            f"- Browser-visible route families covered exactly once: `{summary['browser_visible_route_family_count']}`",
            f"- Projection query contracts: `{summary['projection_query_contract_count']}`",
            f"- Mutation command contracts: `{summary['mutation_command_contract_count']}`",
            f"- Live update channel contracts: `{summary['live_update_channel_contract_count']}`",
            "",
            "## Manifest Generation Law",
            "",
            *[f"- {line}" for line in rules_payload["groupingLaw"]],
            "",
            "## Gap Closures",
            "",
            "- Browser authority is now generated from one manifest tuple instead of reconstructed from route files, gateway code, and cache conventions.",
            "- Accessibility and automation coverage now travel with the manifest tuple instead of route-local ARIA or brittle selectors.",
            "- Projection version compatibility is explicit at the route-family set level through one generated `ProjectionContractVersionSet`.",
            "- Cache behavior is published as manifest authority, not a client-side convenience.",
            "- Design publication and lint refs are bound into each manifest so seq_052 can harden bundle publication without changing manifest identity.",
            "",
            "## Browser Posture Law",
            "",
            "- `publishable_live` requires exact runtime publication, exact projection compatibility, a published design bundle, passing design lint, and complete accessibility coverage.",
            "- `read_only` preserves summary truth while mutating or calm-trust posture is frozen.",
            "- `recovery_only` preserves same-shell repair, replay, re-entry, or watch posture while live mutation remains frozen.",
            "- `blocked` is reserved for deferred or withdrawn channel posture and missing required runtime/design tuples.",
            "",
            "## Manifest Groups",
            "",
            "| Audience Surface | Route Families | Primary Gateway | Browser Posture | Drift State |",
            "| --- | --- | --- | --- | --- |",
            *manifest_lines,
            "",
            "## Assumptions",
            "",
            *[f"- `{row['assumptionId']}`: {row['statement']}" for row in payload["assumptions"]],
            "",
            "## Generated Artifacts",
            "",
            "- `data/analysis/frontend_contract_manifests.json`",
            "- `data/analysis/frontend_route_to_query_command_channel_cache_matrix.csv`",
            "- `data/analysis/frontend_accessibility_and_automation_profiles.json`",
            "- `data/analysis/frontend_manifest_generation_rules.json`",
            "- `packages/api-contracts/schemas/frontend-contract-manifest.schema.json`",
            "- `docs/architecture/50_frontend_contract_studio.html`",
        ]
    ) + "\n"


def build_catalog_doc(payload: dict[str, Any]) -> str:
    lines = [
        "# 50 Frontend Contract Manifest Catalog",
        "",
        "## Catalog",
        "",
        "| Manifest | Audience Surface | Routes | Queries | Commands | Channels | Cache | Coverage | Posture |",
        "| --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    ]
    for row in payload["frontendContractManifests"]:
        lines.append(
            "| "
            + " | ".join(
                [
                    row["frontendContractManifestId"],
                    row["audienceSurfaceLabel"],
                    ", ".join(row["routeFamilyRefs"]),
                    str(len(row["projectionQueryContractRefs"])),
                    str(len(row["mutationCommandContractRefs"])),
                    str(len(row["liveUpdateChannelContractRefs"])),
                    ", ".join(row["clientCachePolicyRefs"]),
                    row["accessibilityCoverageState"],
                    row["browserPostureState"],
                ]
            )
            + " |"
        )
    return "\n".join(lines) + "\n"


def build_matrix_doc(matrix_rows: list[dict[str, str]]) -> str:
    lines = [
        "# 50 Route Contract To Manifest Matrix",
        "",
        "## Route Coverage",
        "",
        "| Audience Surface | Route Family | Query Contract | Mutation Contract | Live Channel | Cache Policy | Posture |",
        "| --- | --- | --- | --- | --- | --- | --- |",
    ]
    for row in matrix_rows:
        lines.append(
            "| "
            + " | ".join(
                [
                    row["audience_surface"],
                    row["route_family_id"],
                    row["projection_query_contract_refs"],
                    row["mutation_command_contract_refs"] or "none",
                    row["live_update_channel_contract_refs"] or "none",
                    row["client_cache_policy_ref"],
                    row["browser_posture_state"],
                ]
            )
            + " |"
        )
    return "\n".join(lines) + "\n"


def build_studio_html() -> str:
    manifest_path = "../../data/analysis/frontend_contract_manifests.json"
    profile_path = "../../data/analysis/frontend_accessibility_and_automation_profiles.json"
    matrix_path = "../../data/analysis/frontend_route_to_query_command_channel_cache_matrix.csv"
    template = dedent(
        """
        <!doctype html>
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>Vecells Manifest Studio</title>
            <style>
              :root {{
                color-scheme: light;
                --canvas: #F6F8FB;
                --rail: #EEF2F7;
                --panel: #FFFFFF;
                --inset: #F3F5FA;
                --text-strong: #0F172A;
                --text: #1E293B;
                --muted: #667085;
                --border-subtle: #E2E8F0;
                --border: #CBD5E1;
                --primary: #3559E6;
                --design: #7C3AED;
                --a11y: #0EA5A4;
                --cache: #0F9D58;
                --warning: #C98900;
                --blocked: #C24141;
                --radius: 22px;
                --radius-sm: 14px;
                --shadow: 0 18px 48px rgba(15, 23, 42, 0.08);
              }}
              * {{ box-sizing: border-box; }}
              body {{
                margin: 0;
                font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                background:
                  radial-gradient(circle at top right, rgba(53, 89, 230, 0.10), transparent 32%),
                  radial-gradient(circle at left 20%, rgba(124, 58, 237, 0.08), transparent 28%),
                  var(--canvas);
                color: var(--text);
              }}
              body[data-reduced-motion="true"] * {{
                animation: none !important;
                transition-duration: 0ms !important;
                scroll-behavior: auto !important;
              }}
              .app {{
                max-width: 1500px;
                margin: 0 auto;
                padding: 20px;
              }}
              header {{
                position: sticky;
                top: 0;
                z-index: 10;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 18px;
                min-height: 72px;
                padding: 16px 20px;
                border: 1px solid rgba(255,255,255,0.5);
                border-radius: 26px;
                background: rgba(246, 248, 251, 0.88);
                backdrop-filter: blur(18px);
                box-shadow: var(--shadow);
              }}
              .brand {{
                display: flex;
                align-items: center;
                gap: 12px;
              }}
              .mark {{
                width: 42px;
                height: 42px;
                border-radius: 12px;
                background: linear-gradient(135deg, rgba(53, 89, 230, 0.15), rgba(124, 58, 237, 0.18));
                display: grid;
                place-items: center;
                color: var(--primary);
              }}
              .mark svg {{
                width: 28px;
                height: 28px;
              }}
              .brand-copy small, .metric-label, .rail-label, .eyebrow {{
                color: var(--muted);
                letter-spacing: 0.04em;
                text-transform: uppercase;
                font-size: 11px;
              }}
              .brand-copy strong {{
                display: block;
                font-size: 15px;
                color: var(--text-strong);
              }}
              .metrics {{
                display: grid;
                grid-template-columns: repeat(4, minmax(110px, 1fr));
                gap: 12px;
                flex: 1;
              }}
              .metric {{
                padding: 12px 14px;
                border-radius: 16px;
                background: rgba(255,255,255,0.82);
                border: 1px solid var(--border-subtle);
              }}
              .metric strong {{
                display: block;
                font-size: 22px;
                color: var(--text-strong);
              }}
              .layout {{
                display: grid;
                grid-template-columns: 300px minmax(0, 1fr) 388px;
                gap: 18px;
                margin-top: 18px;
                align-items: start;
              }}
              aside, main, .inspector-wrap, .panel {{
                background: var(--panel);
                border: 1px solid var(--border-subtle);
                border-radius: var(--radius);
                box-shadow: var(--shadow);
              }}
              aside {{
                padding: 18px;
                background: linear-gradient(180deg, rgba(255,255,255,0.92), var(--rail));
              }}
              .filters {{
                display: grid;
                gap: 12px;
              }}
              label {{
                display: grid;
                gap: 6px;
                font-size: 13px;
                color: var(--text-strong);
              }}
              select {{
                height: 44px;
                border-radius: 14px;
                border: 1px solid var(--border);
                background: var(--panel);
                color: var(--text);
                padding: 0 12px;
              }}
              .route-group-list {{
                margin-top: 18px;
                display: grid;
                gap: 10px;
              }}
              .route-chip {{
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 8px 10px;
                border-radius: 999px;
                background: rgba(53, 89, 230, 0.08);
                color: var(--primary);
                font-size: 12px;
              }}
              main {{
                padding: 18px;
                min-height: 580px;
                display: grid;
                gap: 18px;
              }}
              .braid {{
                border-radius: var(--radius);
                background: linear-gradient(135deg, rgba(53, 89, 230, 0.10), rgba(14, 165, 164, 0.08));
                border: 1px solid rgba(53, 89, 230, 0.14);
                padding: 18px;
              }}
              .braid-grid {{
                display: grid;
                grid-template-columns: repeat(4, minmax(0, 1fr));
                gap: 12px;
                align-items: center;
              }}
              .braid-box {{
                background: rgba(255,255,255,0.86);
                border: 1px solid rgba(203, 213, 225, 0.85);
                border-radius: 18px;
                padding: 16px;
                min-height: 132px;
              }}
              .braid-arrow {{
                display: flex;
                align-items: center;
                justify-content: center;
                color: var(--primary);
                font-weight: 700;
                font-size: 20px;
              }}
              .manifest-list {{
                display: grid;
                gap: 12px;
              }}
              .manifest-card {{
                border: 1px solid var(--border-subtle);
                border-radius: 20px;
                padding: 18px;
                background: linear-gradient(180deg, rgba(255,255,255,0.96), rgba(243,245,250,0.88));
                transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
                outline: none;
              }}
              .manifest-card:hover,
              .manifest-card:focus-visible,
              .manifest-card[data-selected="true"] {{
                transform: translateY(-1px);
                border-color: rgba(53, 89, 230, 0.45);
                box-shadow: 0 18px 36px rgba(53, 89, 230, 0.14);
              }}
              .card-top {{
                display: flex;
                justify-content: space-between;
                gap: 12px;
                align-items: start;
              }}
              .card-title {{
                margin: 4px 0 0;
                font-size: 18px;
                color: var(--text-strong);
              }}
              .chips {{
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                margin-top: 12px;
              }}
              .chip {{
                padding: 6px 10px;
                border-radius: 999px;
                font-size: 12px;
                background: var(--inset);
                color: var(--text);
              }}
              .chip.posture-read_only {{ background: rgba(53, 89, 230, 0.10); color: var(--primary); }}
              .chip.posture-recovery_only {{ background: rgba(201, 137, 0, 0.12); color: var(--warning); }}
              .chip.posture-blocked {{ background: rgba(194, 65, 65, 0.12); color: var(--blocked); }}
              .chip.coverage-degraded {{ background: rgba(14, 165, 164, 0.12); color: var(--a11y); }}
              .chip.coverage-blocked {{ background: rgba(194, 65, 65, 0.12); color: var(--blocked); }}
              .digest-row {{
                display: grid;
                grid-template-columns: repeat(3, minmax(0, 1fr));
                gap: 10px;
                margin-top: 14px;
              }}
              .digest-card {{
                padding: 10px 12px;
                border-radius: 14px;
                background: rgba(255,255,255,0.9);
                border: 1px solid var(--border-subtle);
              }}
              .mono {{
                font-family: ui-monospace, "SFMono-Regular", "SF Mono", Consolas, monospace;
                font-size: 12px;
                color: var(--text-strong);
                word-break: break-word;
              }}
              .inspector-wrap {{
                padding: 18px;
                position: sticky;
                top: 92px;
              }}
              .inspector-section {{
                display: grid;
                gap: 10px;
                padding-bottom: 18px;
                margin-bottom: 18px;
                border-bottom: 1px solid var(--border-subtle);
              }}
              .inspector-section:last-child {{
                border-bottom: 0;
                margin-bottom: 0;
                padding-bottom: 0;
              }}
              table {{
                width: 100%;
                border-collapse: collapse;
              }}
              th, td {{
                text-align: left;
                padding: 12px 10px;
                border-bottom: 1px solid var(--border-subtle);
                font-size: 13px;
                vertical-align: top;
              }}
              th {{
                color: var(--muted);
                font-weight: 600;
                font-size: 12px;
                letter-spacing: 0.02em;
                text-transform: uppercase;
              }}
              .matrix-row,
              .profile-row {{
                transition: background 180ms ease;
              }}
              .matrix-row[data-active="true"],
              .profile-row[data-active="true"] {{
                background: rgba(53, 89, 230, 0.06);
              }}
              .lower-grid {{
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 18px;
              }}
              .panel {{
                padding: 18px;
              }}
              .defects {{
                display: grid;
                gap: 10px;
              }}
              .defect {{
                padding: 14px;
                border-radius: 16px;
                background: var(--inset);
                border: 1px solid var(--border-subtle);
              }}
              @media (max-width: 1180px) {{
                .layout {{
                  grid-template-columns: 1fr;
                }}
                .inspector-wrap {{
                  position: static;
                }}
                .lower-grid {{
                  grid-template-columns: 1fr;
                }}
              }}
              @media (max-width: 820px) {{
                .metrics {{
                  grid-template-columns: repeat(2, minmax(0, 1fr));
                }}
                .braid-grid {{
                  grid-template-columns: 1fr;
                }}
                .braid-arrow {{
                  transform: rotate(90deg);
                }}
                .digest-row {{
                  grid-template-columns: 1fr;
                }}
              }}
            </style>
          </head>
          <body>
            <div class="app">
              <header data-testid="studio-masthead">
                <div class="brand">
                  <div class="mark" aria-hidden="true">
                    <svg viewBox="0 0 32 32" fill="none">
                      <path d="M6 24V8h5l5 7 5-7h5v16" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </div>
                  <div class="brand-copy">
                    <small>Vecells</small>
                    <strong>Manifest Studio</strong>
                  </div>
                </div>
                <div class="metrics" id="metrics"></div>
              </header>
              <div class="layout">
                <aside data-testid="surface-rail">
                  <div class="filters">
                    <label>
                      <span class="rail-label">Audience Surface</span>
                      <select id="filter-audience" data-testid="filter-audience"></select>
                    </label>
                    <label>
                      <span class="rail-label">Shell Type</span>
                      <select id="filter-shell" data-testid="filter-shell"></select>
                    </label>
                    <label>
                      <span class="rail-label">Route Family</span>
                      <select id="filter-route" data-testid="filter-route"></select>
                    </label>
                    <label>
                      <span class="rail-label">Browser Posture</span>
                      <select id="filter-posture" data-testid="filter-posture"></select>
                    </label>
                    <label>
                      <span class="rail-label">Drift State</span>
                      <select id="filter-drift" data-testid="filter-drift"></select>
                    </label>
                  </div>
                  <div class="route-group-list" id="route-groups"></div>
                </aside>
                <main>
                  <section class="braid" data-testid="manifest-braid">
                    <div class="eyebrow">Authority braid</div>
                    <div class="braid-grid" id="braid-grid"></div>
                  </section>
                  <section class="manifest-list" data-testid="manifest-list" id="manifest-list"></section>
                  <div class="lower-grid">
                    <section class="panel" data-testid="matrix-table">
                      <div class="eyebrow">Query / command / channel / cache matrix</div>
                      <table>
                        <thead>
                          <tr>
                            <th>Route</th>
                            <th>Query</th>
                            <th>Mutation</th>
                            <th>Channel</th>
                            <th>Cache</th>
                          </tr>
                        </thead>
                        <tbody id="matrix-body"></tbody>
                      </table>
                    </section>
                    <section class="panel" data-testid="profile-matrix">
                      <div class="eyebrow">Accessibility and automation profiles</div>
                      <table>
                        <thead>
                          <tr>
                            <th>Route</th>
                            <th>Coverage</th>
                            <th>Keyboard</th>
                            <th>Anchor</th>
                          </tr>
                        </thead>
                        <tbody id="profile-body"></tbody>
                      </table>
                    </section>
                  </div>
                  <section class="panel" data-testid="defect-strip">
                    <div class="eyebrow">Drift and defect strip</div>
                    <div class="defects" id="defect-body"></div>
                  </section>
                </main>
                <div class="inspector-wrap" data-testid="inspector">
                  <div id="inspector"></div>
                </div>
              </div>
            </div>
            <script type="module">
              const DATA_PATHS = {{
                manifests: "{manifest_path}",
                profiles: "{profile_path}",
                matrix: "{matrix_path}",
              }};

              const state = {{
                selectedManifestId: null,
                audience: "all",
                shell: "all",
                routeFamily: "all",
                posture: "all",
                drift: "all",
              }};

              const ids = {{
                metrics: document.getElementById("metrics"),
                braidGrid: document.getElementById("braid-grid"),
                manifestList: document.getElementById("manifest-list"),
                matrixBody: document.getElementById("matrix-body"),
                profileBody: document.getElementById("profile-body"),
                defectBody: document.getElementById("defect-body"),
                inspector: document.getElementById("inspector"),
                routeGroups: document.getElementById("route-groups"),
                filterAudience: document.getElementById("filter-audience"),
                filterShell: document.getElementById("filter-shell"),
                filterRoute: document.getElementById("filter-route"),
                filterPosture: document.getElementById("filter-posture"),
                filterDrift: document.getElementById("filter-drift"),
              }};

              const MOTION = window.matchMedia("(prefers-reduced-motion: reduce)");
              document.body.dataset.reducedMotion = MOTION.matches ? "true" : "false";
              MOTION.addEventListener("change", (event) => {{
                document.body.dataset.reducedMotion = event.matches ? "true" : "false";
              }});

              function parseCsv(text) {{
                const rows = [];
                let row = [];
                let cell = "";
                let quoted = false;
                for (let index = 0; index < text.length; index += 1) {{
                  const char = text[index];
                  if (quoted) {{
                    if (char === '"' && text[index + 1] === '"') {{
                      cell += '"';
                      index += 1;
                    }} else if (char === '"') {{
                      quoted = false;
                    }} else {{
                      cell += char;
                    }}
                    continue;
                  }}
                  if (char === '"') {{
                    quoted = true;
                  }} else if (char === ",") {{
                    row.push(cell);
                    cell = "";
                  }} else if (char === "\\n") {{
                    row.push(cell);
                    rows.push(row);
                    row = [];
                    cell = "";
                  }} else if (char !== "\\r") {{
                    cell += char;
                  }}
                }}
                if (cell.length || row.length) {{
                  row.push(cell);
                  rows.push(row);
                }}
                const [header, ...dataRows] = rows.filter((item) => item.length && item.some(Boolean));
                return dataRows.map((values) => Object.fromEntries(header.map((key, i) => [key, values[i] ?? ""])));
              }}

              function optionMarkup(values, current, allLabel = "All") {{
                return [`<option value="all">${{allLabel}}</option>`]
                  .concat(
                    values.map((value) => {{
                      const selected = value === current ? " selected" : "";
                      return `<option value="${{value}}"${{selected}}>${{value}}</option>`;
                    }}),
                  )
                  .join("");
              }}

              function chipClass(kind, value) {{
                return `chip ${{kind}}-${{value}}`;
              }}

              function filteredManifests(data) {{
                return data.manifests.frontendContractManifests.filter((manifest) => {{
                  const routeMatch =
                    state.routeFamily === "all" || manifest.routeFamilyRefs.includes(state.routeFamily);
                  return (
                    (state.audience === "all" || manifest.audienceSurface === state.audience) &&
                    (state.shell === "all" || manifest.shellType === state.shell) &&
                    routeMatch &&
                    (state.posture === "all" || manifest.browserPostureState === state.posture) &&
                    (state.drift === "all" || manifest.driftState === state.drift)
                  );
                }});
              }}

              function selectedManifest(data) {{
                const visible = filteredManifests(data);
                if (!visible.length) return null;
                if (!state.selectedManifestId || !visible.some((row) => row.frontendContractManifestId === state.selectedManifestId)) {{
                  state.selectedManifestId = visible[0].frontendContractManifestId;
                }}
                return visible.find((row) => row.frontendContractManifestId === state.selectedManifestId) ?? visible[0];
              }}

              function populateFilters(data) {{
                const manifests = data.manifests.frontendContractManifests;
                ids.filterAudience.innerHTML = optionMarkup(
                  [...new Set(manifests.map((row) => row.audienceSurface))],
                  state.audience,
                  "All surfaces",
                );
                ids.filterShell.innerHTML = optionMarkup(
                  [...new Set(manifests.map((row) => row.shellType))],
                  state.shell,
                  "All shells",
                );
                ids.filterRoute.innerHTML = optionMarkup(
                  [...new Set(manifests.flatMap((row) => row.routeFamilyRefs))],
                  state.routeFamily,
                  "All routes",
                );
                ids.filterPosture.innerHTML = optionMarkup(
                  [...new Set(manifests.map((row) => row.browserPostureState))],
                  state.posture,
                  "All postures",
                );
                ids.filterDrift.innerHTML = optionMarkup(
                  [...new Set(manifests.map((row) => row.driftState))],
                  state.drift,
                  "All drift states",
                );
              }}

              function renderMetrics(data) {{
                const manifests = filteredManifests(data);
                const counts = {{
                  active: manifests.length,
                  routes: manifests.reduce((sum, row) => sum + row.routeFamilyRefs.length, 0),
                  live: manifests.filter((row) => row.browserPostureState === "publishable_live").length,
                  drifted: manifests.filter((row) => row.driftState !== "planned_exactness_gap").length,
                }};
                ids.metrics.innerHTML = `
                  <div class="metric"><span class="metric-label">Active manifests</span><strong>${{counts.active}}</strong></div>
                  <div class="metric"><span class="metric-label">Route coverage</span><strong>${{counts.routes}}</strong></div>
                  <div class="metric"><span class="metric-label">Live posture</span><strong>${{counts.live}}</strong></div>
                  <div class="metric"><span class="metric-label">Drifted groups</span><strong>${{counts.drifted}}</strong></div>
                `;
              }}

              function renderRouteGroups(data) {{
                const selected = selectedManifest(data);
                if (!selected) {{
                  ids.routeGroups.innerHTML = "<div class=\\"defect\\">No manifest matches the current filters.</div>";
                  return;
                }}
                ids.routeGroups.innerHTML = [
                  `<div class="eyebrow">Route-family groups</div>`,
                  ...selected.routeFamilyRefs.map((routeId) => `<span class="route-chip">${{routeId}}</span>`),
                ].join("");
              }}

              function renderBraid(data) {{
                const manifest = selectedManifest(data);
                if (!manifest) {{
                  ids.braidGrid.innerHTML = "";
                  return;
                }}
                ids.braidGrid.innerHTML = `
                  <div class="braid-box">
                    <div class="eyebrow">Route contract</div>
                    <h3 class="card-title">${{manifest.surfaceRouteContractRef}}</h3>
                    <div class="mono">${{manifest.routeFamilyRefs.join("<br />")}}</div>
                  </div>
                  <div class="braid-arrow">→</div>
                  <div class="braid-box">
                    <div class="eyebrow">Design contract</div>
                    <h3 class="card-title">${{manifest.designContractPublicationBundleRef}}</h3>
                    <div class="mono">${{manifest.designContractDigestRef}}</div>
                  </div>
                  <div class="braid-arrow">→</div>
                  <div class="braid-box">
                    <div class="eyebrow">Runtime bundle</div>
                    <h3 class="card-title">${{manifest.runtimePublicationBundleRef}}</h3>
                    <div class="mono">${{manifest.projectionCompatibilityDigestRef}}</div>
                  </div>
                  <div class="braid-arrow">→</div>
                  <div class="braid-box">
                    <div class="eyebrow">Frontend manifest</div>
                    <h3 class="card-title">${{manifest.frontendContractManifestId}}</h3>
                    <div class="mono">${{manifest.surfaceAuthorityTupleHash}}</div>
                  </div>
                `;
              }}

              function renderManifestCards(data) {{
                const manifests = filteredManifests(data);
                ids.manifestList.innerHTML = manifests
                  .map((manifest) => {{
                    const selected = manifest.frontendContractManifestId === state.selectedManifestId;
                    return `
                      <article
                        class="manifest-card"
                        tabindex="0"
                        data-selected="${{selected ? "true" : "false"}}"
                        data-testid="manifest-card-${{manifest.frontendContractManifestId}}"
                      >
                        <div class="card-top">
                          <div>
                            <div class="eyebrow">${{manifest.audienceSurface}}</div>
                            <h2 class="card-title">${{manifest.audienceSurfaceLabel}}</h2>
                          </div>
                          <div class="chips">
                            <span class="${{chipClass("posture", manifest.browserPostureState)}}">${{manifest.browserPostureState}}</span>
                            <span class="${{chipClass("coverage", manifest.accessibilityCoverageState)}}">${{manifest.accessibilityCoverageState}}</span>
                          </div>
                        </div>
                        <div class="chips">
                          ${{manifest.routeFamilyRefs.map((route) => `<span class="chip">${{route}}</span>`).join("")}}
                        </div>
                        <div class="digest-row">
                          <div class="digest-card">
                            <div class="metric-label">Gateway</div>
                            <div class="mono">${{manifest.gatewaySurfaceRefs.length}}</div>
                          </div>
                          <div class="digest-card">
                            <div class="metric-label">Contracts</div>
                            <div class="mono">${{manifest.projectionQueryContractRefs.length}}Q / ${{manifest.mutationCommandContractRefs.length}}M / ${{manifest.liveUpdateChannelContractRefs.length}}L</div>
                          </div>
                          <div class="digest-card">
                            <div class="metric-label">Digest</div>
                            <div class="mono">${{manifest.frontendContractDigestRef}}</div>
                          </div>
                        </div>
                      </article>
                    `;
                  })
                  .join("");

                const cards = [...ids.manifestList.querySelectorAll(".manifest-card")];
                cards.forEach((card, index) => {{
                  const manifest = manifests[index];
                  card.addEventListener("click", () => {{
                    state.selectedManifestId = manifest.frontendContractManifestId;
                    renderAll(data);
                  }});
                  card.addEventListener("keydown", (event) => {{
                    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
                    event.preventDefault();
                    const nextIndex =
                      event.key === "ArrowDown"
                        ? Math.min(cards.length - 1, index + 1)
                        : Math.max(0, index - 1);
                    state.selectedManifestId = manifests[nextIndex].frontendContractManifestId;
                    renderAll(data);
                    ids.manifestList.querySelectorAll(".manifest-card")[nextIndex]?.focus();
                  }});
                }});
              }}

              function renderMatrix(data) {{
                const manifest = selectedManifest(data);
                if (!manifest) {{
                  ids.matrixBody.innerHTML = "";
                  return;
                }}
                const rows = data.matrix.filter(
                  (row) => row.frontend_contract_manifest_id === manifest.frontendContractManifestId,
                );
                ids.matrixBody.innerHTML = rows
                  .map(
                    (row) => `
                      <tr class="matrix-row" data-active="true" data-testid="matrix-row-${{row.frontend_contract_manifest_id}}-${{row.route_family_id}}">
                        <td class="mono">${{row.route_family_id}}</td>
                        <td class="mono">${{row.projection_query_contract_refs}}</td>
                        <td class="mono">${{row.mutation_command_contract_refs || "none"}}</td>
                        <td class="mono">${{row.live_update_channel_contract_refs || "none"}}</td>
                        <td class="mono">${{row.client_cache_policy_ref}}</td>
                      </tr>`,
                  )
                  .join("");
              }}

              function renderProfiles(data) {{
                const manifest = selectedManifest(data);
                if (!manifest) {{
                  ids.profileBody.innerHTML = "";
                  return;
                }}
                const rows = data.profiles.routeProfiles.filter((row) =>
                  manifest.routeFamilyRefs.includes(row.routeFamilyRef),
                );
                ids.profileBody.innerHTML = rows
                  .map(
                    (row) => `
                      <tr class="profile-row" data-active="true" data-testid="profile-row-${{row.routeFamilyRef}}">
                        <td class="mono">${{row.routeFamilyRef}}</td>
                        <td><span class="${{chipClass("coverage", row.accessibilityCoverageState)}}">${{row.accessibilityCoverageState}}</span></td>
                        <td class="mono">${{row.keyboardModel}}</td>
                        <td class="mono">${{row.automationAnchorProfileRef}}</td>
                      </tr>`,
                  )
                  .join("");
              }}

              function renderInspector(data) {{
                const manifest = selectedManifest(data);
                if (!manifest) {{
                  ids.inspector.innerHTML = "<h2>No manifest selected</h2>";
                  return;
                }}
                ids.inspector.innerHTML = `
                  <div class="inspector-section">
                    <div class="eyebrow">Selected manifest</div>
                    <h2 class="card-title">${{manifest.audienceSurfaceLabel}}</h2>
                    <div>${{manifest.rationale}}</div>
                    <div class="chips">
                      <span class="${{chipClass("posture", manifest.browserPostureState)}}">${{manifest.browserPostureState}}</span>
                      <span class="chip">${{manifest.driftState}}</span>
                    </div>
                  </div>
                  <div class="inspector-section">
                    <div class="eyebrow">Linked authority</div>
                    <div><strong>Gateway</strong><div class="mono">${{manifest.gatewaySurfaceRefs.join("<br />")}}</div></div>
                    <div><strong>Runtime bundle</strong><div class="mono">${{manifest.runtimePublicationBundleRef}}</div></div>
                    <div><strong>Design bundle</strong><div class="mono">${{manifest.designContractPublicationBundleRef}}</div></div>
                    <div><strong>Cache policy</strong><div class="mono">${{manifest.clientCachePolicyRefs.join("<br />")}}</div></div>
                  </div>
                  <div class="inspector-section">
                    <div class="eyebrow">Posture explanation</div>
                    <div><strong>Live requires</strong><div>${{manifest.publishableLiveRequirements.join("<br />")}}</div></div>
                    <div><strong>Read-only triggers</strong><div>${{manifest.readOnlyTriggers.join("<br />")}}</div></div>
                    <div><strong>Recovery triggers</strong><div>${{manifest.recoveryOnlyTriggers.join("<br />")}}</div></div>
                    <div><strong>Blocked triggers</strong><div>${{manifest.blockedTriggers.join("<br />")}}</div></div>
                  </div>
                  <div class="inspector-section">
                    <div class="eyebrow">Digest braid</div>
                    <div class="mono">${{manifest.frontendContractDigestRef}}</div>
                    <div class="mono">${{manifest.designContractDigestRef}}</div>
                    <div class="mono">${{manifest.surfaceAuthorityTupleHash}}</div>
                  </div>
                `;
              }}

              function renderDefects(data) {{
                const manifest = selectedManifest(data);
                const rows = [
                  ...data.manifests.defects,
                  {{
                    defectId: `ROW_${{manifest.frontendContractManifestId}}`,
                    state: manifest.driftState,
                    severity: manifest.browserPostureState === "read_only" ? "medium" : "high",
                    statement: `Current browser posture is ${{manifest.browserPostureState}} because the authority tuple is still ${{manifest.driftState}}.`,
                  }},
                ];
                ids.defectBody.innerHTML = rows
                  .map(
                    (row) => `
                      <article class="defect" data-testid="defect-${{row.defectId}}">
                        <div class="eyebrow">${{row.severity}} • ${{row.state}}</div>
                        <strong>${{row.defectId}}</strong>
                        <div>${{row.statement}}</div>
                      </article>`,
                  )
                  .join("");
              }}

              function renderAll(data) {{
                populateFilters(data);
                renderMetrics(data);
                renderRouteGroups(data);
                renderBraid(data);
                renderManifestCards(data);
                renderMatrix(data);
                renderProfiles(data);
                renderInspector(data);
                renderDefects(data);
              }}

              for (const control of [
                ids.filterAudience,
                ids.filterShell,
                ids.filterRoute,
                ids.filterPosture,
                ids.filterDrift,
              ]) {{
                control.addEventListener("change", () => {{
                  state.audience = ids.filterAudience.value;
                  state.shell = ids.filterShell.value;
                  state.routeFamily = ids.filterRoute.value;
                  state.posture = ids.filterPosture.value;
                  state.drift = ids.filterDrift.value;
                  renderAll(window.__manifestData);
                }});
              }}

              Promise.all([
                fetch(DATA_PATHS.manifests).then((response) => response.json()),
                fetch(DATA_PATHS.profiles).then((response) => response.json()),
                fetch(DATA_PATHS.matrix).then((response) => response.text()),
              ]).then(([manifests, profiles, matrixText]) => {{
                window.__manifestData = {{
                  manifests,
                  profiles,
                  matrix: parseCsv(matrixText),
                }};
                renderAll(window.__manifestData);
              }});
            </script>
          </body>
        </html>
        """
    ).strip()
    return (
        template.replace("{manifest_path}", manifest_path)
        .replace("{profile_path}", profile_path)
        .replace("{matrix_path}", matrix_path)
        .replace("{{", "{")
        .replace("}}", "}")
        + "\n"
    )


def build_spec() -> str:
    return dedent(
        """
        import fs from "node:fs";
        import http from "node:http";
        import path from "node:path";
        import { fileURLToPath } from "node:url";

        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const ROOT = path.resolve(__dirname, "..", "..");
        const HTML_PATH = path.join(ROOT, "docs", "architecture", "50_frontend_contract_studio.html");
        const MANIFEST_PATH = path.join(ROOT, "data", "analysis", "frontend_contract_manifests.json");
        const PROFILE_PATH = path.join(ROOT, "data", "analysis", "frontend_accessibility_and_automation_profiles.json");
        const MATRIX_PATH = path.join(ROOT, "data", "analysis", "frontend_route_to_query_command_channel_cache_matrix.csv");

        const MANIFEST_PAYLOAD = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
        const PROFILE_PAYLOAD = JSON.parse(fs.readFileSync(PROFILE_PATH, "utf8"));
        const MATRIX_ROWS = fs
          .readFileSync(MATRIX_PATH, "utf8")
          .trim()
          .split("\\n")
          .slice(1)
          .map((line) => line.split(","));

        export const frontendContractStudioCoverage = [
          "audience filtering",
          "manifest selection",
          "card and matrix parity",
          "inspector rendering",
          "keyboard navigation",
          "responsive behavior",
          "reduced motion handling",
        ];

        function assertCondition(condition, message) {
          if (!condition) {
            throw new Error(message);
          }
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
            const rootDir = ROOT;
            const server = http.createServer((req, res) => {
              const rawUrl = req.url ?? "/";
              const urlPath =
                rawUrl === "/"
                  ? "/docs/architecture/50_frontend_contract_studio.html"
                  : rawUrl.split("?")[0];
              const safePath = decodeURIComponent(urlPath).replace(/^\\/+/, "");
              const filePath = path.join(rootDir, safePath);
              if (!filePath.startsWith(rootDir) || !fs.existsSync(filePath)) {
                res.writeHead(404);
                res.end("Not found");
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
              res.writeHead(200, { "Content-Type": contentType });
              res.end(body);
            });
            server.once("error", reject);
            server.listen(4350, "127.0.0.1", () => resolve(server));
          });
        }

        async function run() {
          assertCondition(fs.existsSync(HTML_PATH), `Missing frontend contract studio HTML: ${HTML_PATH}`);
          const { chromium } = await importPlaywright();
          const server = await startStaticServer();
          const browser = await chromium.launch({ headless: true });
          const page = await browser.newPage({ viewport: { width: 1460, height: 1180 } });
          const url =
            process.env.FRONTEND_CONTRACT_STUDIO_URL ??
            "http://127.0.0.1:4350/docs/architecture/50_frontend_contract_studio.html";

          try {
            await page.goto(url, { waitUntil: "networkidle" });
            await page.locator("[data-testid='manifest-list']").waitFor();
            await page.locator("[data-testid='matrix-table']").waitFor();
            await page.locator("[data-testid='inspector']").waitFor();

            const initialCards = await page.locator("[data-testid^='manifest-card-']").count();
            assertCondition(
              initialCards === MANIFEST_PAYLOAD.frontendContractManifests.length,
              `Initial manifest-card parity drifted: expected ${MANIFEST_PAYLOAD.frontendContractManifests.length}, found ${initialCards}`,
            );

            await page.locator("[data-testid='filter-audience']").selectOption("audsurf_patient_authenticated_portal");
            const audienceCards = await page.locator("[data-testid^='manifest-card-']").count();
            assertCondition(audienceCards === 1, `Audience filtering drifted: expected 1 card, found ${audienceCards}`);

            const inspectorText = await page.locator("[data-testid='inspector']").innerText();
            assertCondition(
              inspectorText.includes("Authenticated patient portal") &&
                inspectorText.includes("gws_patient_home") &&
                inspectorText.includes("dcpb::patient_authenticated_shell::planned"),
              "Inspector lost expected patient-portal authority detail.",
            );

            const matrixRows = await page.locator("[data-testid^='matrix-row-']").count();
            assertCondition(matrixRows === 5, `Matrix parity drifted: expected 5 patient rows, found ${matrixRows}`);

            await page.locator("[data-testid='filter-audience']").selectOption("all");
            await page.locator("[data-testid='filter-shell']").selectOption("patient");
            const patientCards = await page.locator("[data-testid^='manifest-card-']").count();
            assertCondition(patientCards === 3, `Patient shell filtering drifted: expected 3 cards, found ${patientCards}`);

            await page.locator("[data-testid='manifest-card-FCM_050_PATIENT_PUBLIC_ENTRY_V1']").focus();
            await page.keyboard.press("ArrowDown");
            const secondSelected = await page
              .locator("[data-testid='manifest-card-FCM_050_PATIENT_AUTHENTICATED_PORTAL_V1']")
              .getAttribute("data-selected");
            assertCondition(secondSelected === "true", "Arrow-down navigation no longer advances manifest selection.");

            await page.locator("[data-testid='filter-shell']").selectOption("all");
            await page.locator("[data-testid='filter-drift']").selectOption("deferred_channel_mixed");
            const driftCards = await page.locator("[data-testid^='manifest-card-']").count();
            assertCondition(driftCards === 1, `Drift filtering drifted: expected 1 card, found ${driftCards}`);

            await page.setViewportSize({ width: 390, height: 844 });
            await page.locator("[data-testid='inspector']").waitFor();

            const motionPage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
            try {
              await motionPage.emulateMedia({ reducedMotion: "reduce" });
              await motionPage.goto(url, { waitUntil: "networkidle" });
              const reducedMotion = await motionPage.locator("body").getAttribute("data-reduced-motion");
              assertCondition(reducedMotion === "true", "Reduced-motion posture did not activate.");
            } finally {
              await motionPage.close();
            }

            const profileRows = await page.locator("[data-testid^='profile-row-']").count();
            assertCondition(profileRows >= 1, "Profile matrix failed to render any route coverage rows.");

            const landmarks = await page.locator("header, main, aside, section").count();
            assertCondition(
              landmarks >= 6,
              `Accessibility smoke failed: expected multiple landmarks, found ${landmarks}.`,
            );
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

        export const frontendContractStudioManifest = {
          task: MANIFEST_PAYLOAD.task_id,
          manifests: MANIFEST_PAYLOAD.summary.manifest_count,
          profiles: PROFILE_PAYLOAD.summary.route_profile_count,
          matrixRows: MATRIX_ROWS.length,
        };
        """
    ).strip() + "\n"


def upsert_marked_block(text: str, start_marker: str, end_marker: str, block: str) -> str:
    block = block.strip()
    if start_marker in text and end_marker in text:
        prefix, remainder = text.split(start_marker, 1)
        _, suffix = remainder.split(end_marker, 1)
        return prefix.rstrip() + "\n\n" + block + "\n" + suffix.lstrip("\n")
    return text.rstrip() + "\n\n" + block + "\n"


def build_package_source_block(
    manifest_payload: dict[str, Any],
    profile_payload: dict[str, Any],
) -> str:
    summary = manifest_payload["summary"]
    posture_states = sorted(
        {row["browserPostureState"] for row in manifest_payload["frontendContractManifests"]}
    )
    coverage_states = sorted(
        {row["accessibilityCoverageState"] for row in manifest_payload["frontendContractManifests"]}
    )
    return dedent(
        f"""
        {PACKAGE_FRONTEND_EXPORTS_START}
        export const frontendContractManifestCatalog = {{
          taskId: "{TASK_ID}",
          visualMode: "{VISUAL_MODE}",
          schemaArtifactPath: "packages/api-contracts/schemas/frontend-contract-manifest.schema.json",
          manifestCount: {summary["manifest_count"]},
          browserVisibleRouteFamilyCount: {summary["browser_visible_route_family_count"]},
          projectionQueryContractCount: {summary["projection_query_contract_count"]},
          mutationCommandContractCount: {summary["mutation_command_contract_count"]},
          liveUpdateChannelContractCount: {summary["live_update_channel_contract_count"]},
          accessibilityProfileCount: {profile_payload["summary"]["route_profile_count"]},
          browserPostureStates: {json.dumps(posture_states)},
          accessibilityCoverageStates: {json.dumps(coverage_states)},
          digestAlgorithm: "sha256:16",
        }} as const;

        export const frontendContractManifestSchemas = [
          {{
            schemaId: "FrontendContractManifest",
            artifactPath: "packages/api-contracts/schemas/frontend-contract-manifest.schema.json",
            generatedByTask: "{TASK_ID}",
            manifestCount: {summary["manifest_count"]},
            browserVisibleRouteFamilyCount: {summary["browser_visible_route_family_count"]},
          }},
        ] as const;
        {PACKAGE_FRONTEND_EXPORTS_END}
        """
    ).strip()


def build_package_public_api_test() -> str:
    return dedent(
        """
        import fs from "node:fs";
        import path from "node:path";
        import { fileURLToPath } from "node:url";
        import { describe, expect, it } from "vitest";
        import {
          bootstrapSharedPackage,
          frontendContractManifestCatalog,
          frontendContractManifestSchemas,
          ownedContractFamilies,
          ownedObjectFamilies,
          packageContract,
        } from "../src/index.ts";
        import { foundationKernelFamilies } from "@vecells/domain-kernel";
        import { publishedEventFamilies } from "@vecells/event-contracts";

        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const ROOT = path.resolve(__dirname, "..", "..", "..");

        describe("public package surface", () => {
          it("boots through documented public contracts", () => {
            expect(packageContract.packageName).toBe("@vecells/api-contracts");
            expect(bootstrapSharedPackage().contractFamilies).toBe(ownedContractFamilies.length);
            expect(Array.isArray(ownedObjectFamilies)).toBe(true);
            expect(Array.isArray(ownedContractFamilies)).toBe(true);
            expect(Array.isArray(foundationKernelFamilies)).toBe(true);
            expect(Array.isArray(publishedEventFamilies)).toBe(true);
          });

          it("publishes the seq_050 frontend manifest schema surface", () => {
            expect(frontendContractManifestCatalog.taskId).toBe("seq_050");
            expect(frontendContractManifestCatalog.manifestCount).toBe(9);
            expect(frontendContractManifestCatalog.browserVisibleRouteFamilyCount).toBe(19);
            expect(frontendContractManifestSchemas).toHaveLength(1);

            const schemaPath = path.join(ROOT, frontendContractManifestSchemas[0].artifactPath);
            expect(fs.existsSync(schemaPath)).toBe(true);
          });
        });
        """
    ).strip() + "\n"


def update_api_contract_package(
    manifest_payload: dict[str, Any],
    profile_payload: dict[str, Any],
) -> None:
    source = PACKAGE_SOURCE_PATH.read_text()
    source = upsert_marked_block(
        source,
        PACKAGE_FRONTEND_EXPORTS_START,
        PACKAGE_FRONTEND_EXPORTS_END,
        build_package_source_block(manifest_payload, profile_payload),
    )
    write_text(PACKAGE_SOURCE_PATH, source.rstrip() + "\n")
    write_text(PACKAGE_TEST_PATH, build_package_public_api_test())

    package = read_json(PACKAGE_PACKAGE_JSON_PATH)
    exports = package.setdefault("exports", {})
    exports["./schemas/frontend-contract-manifest.schema.json"] = "./schemas/frontend-contract-manifest.schema.json"
    write_json(PACKAGE_PACKAGE_JSON_PATH, package)


def update_root_package() -> None:
    package = read_json(ROOT_PACKAGE_PATH)
    scripts = package.setdefault("scripts", {})
    scripts.update(ROOT_SCRIPT_UPDATES)
    write_json(ROOT_PACKAGE_PATH, package)


def update_playwright_package() -> None:
    package = read_json(PLAYWRIGHT_PACKAGE_PATH)
    package["description"] = (
        "Foundation, runtime topology, gateway, event, FHIR, frontend manifest, release parity, "
        "design contract, and audit ledger browser checks."
    )
    package["scripts"] = PLAYWRIGHT_SCRIPT_UPDATES
    write_json(PLAYWRIGHT_PACKAGE_PATH, package)


def main() -> None:
    context = load_context()
    browser_route_ids = {route_id for group in MANIFEST_GROUPS for route_id in group["route_family_refs"]}
    profile_payload = build_profile_catalog(context, browser_route_ids)
    contract_catalog = build_contract_catalog(context, profile_payload, browser_route_ids)
    manifest_payload, matrix_rows = build_manifest_payload(context, profile_payload, contract_catalog)
    rules_payload = build_generation_rules(manifest_payload)

    fieldnames = [
        "frontend_contract_manifest_id",
        "audience_surface",
        "route_family_id",
        "gateway_surface_refs",
        "projection_query_contract_refs",
        "mutation_command_contract_refs",
        "live_update_channel_contract_refs",
        "client_cache_policy_ref",
        "projection_contract_version_set_ref",
        "command_settlement_schema_ref",
        "transition_envelope_schema_ref",
        "release_recovery_disposition_ref",
        "route_freeze_disposition_ref",
        "browser_posture_state",
        "accessibility_profile_ref",
        "automation_anchor_profile_ref",
        "surface_state_semantics_profile_ref",
        "drift_state",
    ]

    MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    with MATRIX_PATH.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(matrix_rows)

    write_json(MANIFEST_PATH, manifest_payload)
    write_json(PROFILE_PATH, profile_payload)
    write_json(RULES_PATH, rules_payload)
    write_json(SCHEMA_PATH, build_schema())
    write_text(STRATEGY_DOC_PATH, build_strategy_doc(manifest_payload, rules_payload))
    write_text(CATALOG_DOC_PATH, build_catalog_doc(manifest_payload))
    write_text(MATRIX_DOC_PATH, build_matrix_doc(matrix_rows))
    write_text(STUDIO_PATH, build_studio_html())
    write_text(SPEC_PATH, build_spec())
    update_api_contract_package(manifest_payload, profile_payload)
    update_root_package()
    update_playwright_package()
    print(
        "seq_050 frontend contract artifacts generated: "
        f"{manifest_payload['summary']['manifest_count']} manifests, "
        f"{manifest_payload['summary']['browser_visible_route_family_count']} browser-visible route families, "
        f"{manifest_payload['summary']['projection_query_contract_count']} query contracts."
    )


if __name__ == "__main__":
    main()
