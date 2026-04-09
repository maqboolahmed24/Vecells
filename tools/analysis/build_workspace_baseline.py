#!/usr/bin/env python3
from __future__ import annotations

import csv
import html
import json
import textwrap
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"

REQUIREMENT_REGISTRY_PATH = DATA_DIR / "requirement_registry.jsonl"
SCOPE_MATRIX_PATH = DATA_DIR / "product_scope_matrix.csv"
AUDIENCE_SURFACE_PATH = DATA_DIR / "audience_surface_inventory.csv"
ROUTE_FAMILY_PATH = DATA_DIR / "route_family_inventory.csv"
ENDPOINT_MATRIX_PATH = DATA_DIR / "endpoint_matrix.csv"
OBJECT_CATALOG_PATH = DATA_DIR / "object_catalog.json"
STATE_MACHINES_PATH = DATA_DIR / "state_machines.json"
EXTERNAL_DEPENDENCIES_PATH = DATA_DIR / "external_dependencies.json"
REGULATORY_WORKSTREAMS_PATH = DATA_DIR / "regulatory_workstreams.json"
DATA_CLASSIFICATION_PATH = DATA_DIR / "data_classification_matrix.csv"
RUNTIME_TOPOLOGY_PATH = DATA_DIR / "runtime_workload_families.json"
GATEWAY_MATRIX_PATH = DATA_DIR / "gateway_surface_matrix.csv"

BUILD_SCORECARD_PATH = DATA_DIR / "build_system_scorecard.csv"
LANGUAGE_MATRIX_PATH = DATA_DIR / "language_standard_matrix.csv"
WORKSPACE_GRAPH_PATH = DATA_DIR / "workspace_package_graph.json"
IMPORT_RULES_PATH = DATA_DIR / "import_boundary_rules.json"
CODEOWNERS_PATH = DATA_DIR / "codeowners_matrix.csv"
CODEGEN_MATRIX_PATH = DATA_DIR / "contract_codegen_matrix.csv"
TEST_TOOLING_PATH = DATA_DIR / "test_tooling_matrix.csv"

BUILD_DECISION_DOC_PATH = DOCS_DIR / "12_monorepo_build_system_decision.md"
WORKSPACE_LAYOUT_DOC_PATH = DOCS_DIR / "12_workspace_layout_and_boundary_rules.md"
LANGUAGE_DOC_PATH = DOCS_DIR / "12_language_standards_and_allowed_toolchains.md"
CODEGEN_DOC_PATH = DOCS_DIR / "12_contract_codegen_and_publication_strategy.md"
TESTING_DOC_PATH = DOCS_DIR / "12_testing_toolchain_and_quality_gate_baseline.md"
DX_DOC_PATH = DOCS_DIR / "12_developer_experience_and_local_bootstrap.md"
BOUNDARY_DOC_PATH = DOCS_DIR / "12_import_boundary_and_codeowners_policy.md"
ATLAS_HTML_PATH = DOCS_DIR / "12_workspace_graph_atlas.html"

MISSION = (
    "Choose the enforceable Vecells monorepo baseline covering workspace graph law, import-boundary "
    "enforcement, primary implementation languages, generated-contract publication, and the "
    "developer workflow required for one-command local startup, contract-aware CI, and "
    "Playwright-verifiable shell delivery."
)

SOURCE_PRECEDENCE = [
    "phase-0-the-foundation-protocol.md",
    "platform-runtime-and-release-blueprint.md",
    "platform-frontend-blueprint.md",
    "canonical-ui-contract-kernel.md",
    "design-token-foundation.md",
    "accessibility-and-content-system-contract.md",
    "forensic-audit-findings.md",
    "workspace outputs 006_object_catalog.json, 007_state_machines.json, 010_data_classification_matrix.csv, 011_runtime_workload_families.json",
]

ATLAS_MARKERS = [
    'data-testid="atlas-shell"',
    'data-testid="nav-rail"',
    'data-testid="hero-strip"',
    'data-testid="filter-tag"',
    'data-testid="filter-owner"',
    'data-testid="filter-language"',
    'data-testid="filter-context"',
    'data-testid="filter-violation"',
    'data-testid="search-input"',
    'data-testid="graph-canvas"',
    'data-testid="edge-table"',
    'data-testid="package-inspector"',
    'data-testid="contract-panel"',
    'data-testid="test-panel"',
    'data-testid="selection-state"',
]

NODE_COLUMNS = [
    ("apps", "Apps"),
    ("services", "Services"),
    ("domains", "Domains"),
    ("contracts", "Contracts"),
    ("delivery", "Delivery"),
]

OWNER_DOMAIN_DEFS = [
    {
        "owner_domain_id": "own_patient_experience",
        "owner_domain_name": "Patient Experience",
        "review_handle": "@vecells/patient-experience",
        "color": "#145d7a",
    },
    {
        "owner_domain_id": "own_clinical_workspace",
        "owner_domain_name": "Clinical Workspace",
        "review_handle": "@vecells/clinical-workspace",
        "color": "#2f6a4f",
    },
    {
        "owner_domain_id": "own_booking_network",
        "owner_domain_name": "Booking And Network",
        "review_handle": "@vecells/booking-network",
        "color": "#866a16",
    },
    {
        "owner_domain_id": "own_pharmacy",
        "owner_domain_name": "Pharmacy",
        "review_handle": "@vecells/pharmacy",
        "color": "#7b4d2e",
    },
    {
        "owner_domain_id": "own_support_operations",
        "owner_domain_name": "Support Operations",
        "review_handle": "@vecells/support-operations",
        "color": "#85527d",
    },
    {
        "owner_domain_id": "own_operations_control",
        "owner_domain_name": "Operations Control",
        "review_handle": "@vecells/operations-control",
        "color": "#566474",
    },
    {
        "owner_domain_id": "own_governance_assurance",
        "owner_domain_name": "Governance And Assurance",
        "review_handle": "@vecells/governance-assurance",
        "color": "#9c4638",
    },
    {
        "owner_domain_id": "own_platform_runtime",
        "owner_domain_name": "Platform Runtime",
        "review_handle": "@vecells/platform-runtime",
        "color": "#385f94",
    },
    {
        "owner_domain_id": "own_design_system",
        "owner_domain_name": "Design System",
        "review_handle": "@vecells/design-system",
        "color": "#27686d",
    },
    {
        "owner_domain_id": "own_release_devex",
        "owner_domain_name": "Release And Developer Experience",
        "review_handle": "@vecells/release-devex",
        "color": "#574980",
    },
]

BUILD_SYSTEM_SCORECARD = [
    {
        "option_id": "OPT_PNPM_NX",
        "label": "pnpm + Nx",
        "package_manager": "pnpm",
        "workspace_orchestrator": "Nx",
        "explicit_workspace_graph": 5,
        "import_boundary_enforcement": 5,
        "local_determinism_without_remote_cache": 5,
        "incremental_builds": 5,
        "typed_codegen_orchestration": 5,
        "multiple_app_service_targets": 5,
        "playwright_integration": 5,
        "preview_environment_friendliness": 5,
        "provenance_sbom_policy_fit": 4,
        "autonomous_agent_complexity": 4,
        "total_score": 48,
        "decision": "chosen",
        "notes": (
            "Best fit for pnpm workspaces, graph-aware tags, CI-safe local determinism, and project-level "
            "ownership rules without pushing the repo into Bazel-level ceremony."
        ),
        "rejection_reason": "",
        "source_refs": (
            "phase-0-the-foundation-protocol.md#0A. Delivery skeleton and repository architecture; "
            "platform-runtime-and-release-blueprint.md#CI/CD and supply-chain pipeline contract"
        ),
    },
    {
        "option_id": "OPT_PNPM_TURBOREPO",
        "label": "pnpm + Turborepo",
        "package_manager": "pnpm",
        "workspace_orchestrator": "Turborepo",
        "explicit_workspace_graph": 4,
        "import_boundary_enforcement": 3,
        "local_determinism_without_remote_cache": 5,
        "incremental_builds": 5,
        "typed_codegen_orchestration": 4,
        "multiple_app_service_targets": 4,
        "playwright_integration": 4,
        "preview_environment_friendliness": 4,
        "provenance_sbom_policy_fit": 3,
        "autonomous_agent_complexity": 5,
        "total_score": 41,
        "decision": "rejected",
        "notes": "Fast task runner, but boundary enforcement would still rely on extra lint layers rather than first-class project graph rules.",
        "rejection_reason": "Rejected because the repo law depends on graph-native tags and machine-checkable boundary policy, not only task caching.",
        "source_refs": (
            "phase-0-the-foundation-protocol.md#0A. Delivery skeleton and repository architecture; "
            "forensic-audit-findings.md#Finding 118 - Token export and design-contract conformance could still drift outside the published runtime tuple"
        ),
    },
    {
        "option_id": "OPT_BAZEL_GRAPH_FIRST",
        "label": "Bazel or equivalent graph-first system",
        "package_manager": "standalone",
        "workspace_orchestrator": "Bazel",
        "explicit_workspace_graph": 5,
        "import_boundary_enforcement": 4,
        "local_determinism_without_remote_cache": 5,
        "incremental_builds": 5,
        "typed_codegen_orchestration": 5,
        "multiple_app_service_targets": 5,
        "playwright_integration": 4,
        "preview_environment_friendliness": 4,
        "provenance_sbom_policy_fit": 5,
        "autonomous_agent_complexity": 1,
        "total_score": 43,
        "decision": "rejected",
        "notes": "Strong graph and provenance posture, but materially more ceremony for an agent-heavy repo that still needs fast local bootstrap and human-readable workspace rules.",
        "rejection_reason": "Rejected because the accidental complexity cost is too high for the current Phase 0 baseline and would slow contract and shell iteration.",
        "source_refs": (
            "phase-0-the-foundation-protocol.md#0A. Delivery skeleton and repository architecture; "
            "platform-runtime-and-release-blueprint.md#Verification ladder contract"
        ),
    },
]

LANGUAGE_POSTURE_SCORECARD = [
    {
        "posture_id": "LANG_TS_ONLY",
        "label": "TypeScript everywhere",
        "runtime_languages": "TypeScript",
        "secondary_languages": "none",
        "shared_contract_types": 5,
        "deterministic_schema_codegen": 5,
        "runtime_validation": 4,
        "cross_language_impedance": 5,
        "frontend_reducer_fit": 5,
        "tooling_and_analysis_fit": 2,
        "polyglot_sprawl_resistance": 5,
        "total_score": 31,
        "decision": "rejected",
        "notes": "Strongest single-language posture, but it contradicts the already-established Python analysis/validator lane in tasks 001-011.",
        "rejection_reason": "Rejected because the repo already carries bounded Python analysis tooling and there is no architectural benefit in force-rewriting that lane into TS.",
        "source_refs": (
            "phase-0-the-foundation-protocol.md#0A. Delivery skeleton and repository architecture; "
            "platform-frontend-blueprint.md#4.1D Reference implementation shape"
        ),
    },
    {
        "posture_id": "LANG_TS_RUNTIME_PY_TOOLING",
        "label": "TypeScript-first runtime plus bounded Python tooling",
        "runtime_languages": "TypeScript",
        "secondary_languages": "Python in tools/analysis and validators only",
        "shared_contract_types": 5,
        "deterministic_schema_codegen": 5,
        "runtime_validation": 5,
        "cross_language_impedance": 5,
        "frontend_reducer_fit": 5,
        "tooling_and_analysis_fit": 5,
        "polyglot_sprawl_resistance": 5,
        "total_score": 35,
        "decision": "chosen",
        "notes": "Keeps all browser, gateway, service, contract, and shared truth in TypeScript while preserving the bounded Python analysis lane already proven in this repo.",
        "rejection_reason": "",
        "source_refs": (
            "platform-runtime-and-release-blueprint.md#Frontend and backend integration contract; "
            "platform-frontend-blueprint.md#7.8 Verification and Playwright contract"
        ),
    },
    {
        "posture_id": "LANG_POLYGLOT_SERVICE_SPLIT",
        "label": "Polyglot service family split",
        "runtime_languages": "TypeScript + Go / Python / JVM by service family",
        "secondary_languages": "unbounded",
        "shared_contract_types": 3,
        "deterministic_schema_codegen": 3,
        "runtime_validation": 4,
        "cross_language_impedance": 2,
        "frontend_reducer_fit": 4,
        "tooling_and_analysis_fit": 5,
        "polyglot_sprawl_resistance": 1,
        "total_score": 22,
        "decision": "rejected",
        "notes": "Could fit a larger platform later, but it raises immediate contract impedance and hidden truth risk before the runtime baseline is even frozen.",
        "rejection_reason": "Rejected because it would let service families drift into language-specific contract ownership and undercut the Phase 0 shared-truth law.",
        "source_refs": (
            "phase-0-the-foundation-protocol.md#0A. Delivery skeleton and repository architecture; "
            "forensic-audit-findings.md#Finding 91"
        ),
    },
]


def load_json(path: Path) -> Any:
    return json.loads(path.read_text())


def load_csv(path: Path) -> list[dict[str, str]]:
    with path.open() as handle:
        return list(csv.DictReader(handle))


def count_jsonl(path: Path) -> int:
    return sum(1 for line in path.read_text().splitlines() if line.strip())


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n")


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n")


def write_csv(path: Path, rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if not rows:
        raise SystemExit(f"Cannot write empty CSV: {path}")
    fieldnames: list[str] = []
    for row in rows:
        for key in row:
            if key not in fieldnames:
                fieldnames.append(key)
    with path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def render_table(headers: list[str], rows: list[list[Any]]) -> str:
    def clean(value: Any) -> str:
        text = "" if value is None else str(value)
        return text.replace("|", "\\|").replace("\n", "<br>")

    head = "| " + " | ".join(headers) + " |"
    sep = "| " + " | ".join(["---"] * len(headers)) + " |"
    body = ["| " + " | ".join(clean(value) for value in row) + " |" for row in rows]
    return "\n".join([head, sep, *body])


def join_items(values: list[str] | tuple[str, ...]) -> str:
    return "; ".join(values)


def normalize_label(text: str) -> str:
    return (
        text.lower()
        .replace(" / ", "_")
        .replace(" ", "_")
        .replace("-", "_")
        .replace("&", "and")
        .replace(",", "")
    )


def ensure_prerequisites() -> dict[str, Any]:
    required = {
        REQUIREMENT_REGISTRY_PATH: "task 001 requirement registry",
        SCOPE_MATRIX_PATH: "task 003 scope boundary",
        AUDIENCE_SURFACE_PATH: "task 004 audience surface inventory",
        ROUTE_FAMILY_PATH: "task 004 route family inventory",
        ENDPOINT_MATRIX_PATH: "task 005 endpoint matrix",
        OBJECT_CATALOG_PATH: "task 006 object catalog",
        STATE_MACHINES_PATH: "task 007 state machine atlas",
        EXTERNAL_DEPENDENCIES_PATH: "task 008 external dependency inventory",
        REGULATORY_WORKSTREAMS_PATH: "task 009 regulatory workstreams",
        DATA_CLASSIFICATION_PATH: "task 010 data classification matrix",
        RUNTIME_TOPOLOGY_PATH: "task 011 runtime topology baseline",
        GATEWAY_MATRIX_PATH: "task 011 gateway surface matrix",
    }
    missing = [f"PREREQUISITE_GAP_SEQ_012 missing {label}: {path}" for path, label in required.items() if not path.exists()]
    if missing:
        raise SystemExit("\n".join(missing))

    object_payload = load_json(OBJECT_CATALOG_PATH)
    state_payload = load_json(STATE_MACHINES_PATH)
    dependency_payload = load_json(EXTERNAL_DEPENDENCIES_PATH)
    workstream_payload = load_json(REGULATORY_WORKSTREAMS_PATH)
    runtime_payload = load_json(RUNTIME_TOPOLOGY_PATH)

    audience_rows = load_csv(AUDIENCE_SURFACE_PATH)
    route_rows = load_csv(ROUTE_FAMILY_PATH)
    endpoint_rows = load_csv(ENDPOINT_MATRIX_PATH)
    classification_rows = load_csv(DATA_CLASSIFICATION_PATH)
    gateway_rows = load_csv(GATEWAY_MATRIX_PATH)

    checks = [
        (count_jsonl(REQUIREMENT_REGISTRY_PATH) >= 1400, "PREREQUISITE_GAP_SEQ_012 requirement registry looks incomplete."),
        (len(audience_rows) == 22, "PREREQUISITE_GAP_SEQ_012 audience surface inventory row count drifted."),
        (len(route_rows) >= 20, "PREREQUISITE_GAP_SEQ_012 route family inventory looks incomplete."),
        (len(endpoint_rows) >= 15, "PREREQUISITE_GAP_SEQ_012 endpoint matrix looks incomplete."),
        (len(classification_rows) >= 70, "PREREQUISITE_GAP_SEQ_012 data classification matrix looks incomplete."),
        (len(gateway_rows) == 22, "PREREQUISITE_GAP_SEQ_012 gateway surface matrix drifted."),
        (object_payload.get("summary", {}).get("object_count", 0) >= 900, "PREREQUISITE_GAP_SEQ_012 object catalog summary drifted."),
        (state_payload.get("summary", {}).get("machine_count", 0) >= 40, "PREREQUISITE_GAP_SEQ_012 state machine atlas summary drifted."),
        (dependency_payload.get("summary", {}).get("dependency_count", 0) >= 20, "PREREQUISITE_GAP_SEQ_012 external dependency summary drifted."),
        (workstream_payload.get("summary", {}).get("workstream_count", 0) >= 13, "PREREQUISITE_GAP_SEQ_012 regulatory workstream summary drifted."),
        (runtime_payload.get("summary", {}).get("workload_family_count", 0) == 49, "PREREQUISITE_GAP_SEQ_012 runtime topology summary drifted."),
    ]
    for condition, message in checks:
        if not condition:
            raise SystemExit(message)

    return {
        "requirement_registry_rows": count_jsonl(REQUIREMENT_REGISTRY_PATH),
        "audience_surface_count": len(audience_rows),
        "route_family_count": len(route_rows),
        "endpoint_count": len(endpoint_rows),
        "object_count": object_payload["summary"]["object_count"],
        "state_machine_count": state_payload["summary"]["machine_count"],
        "dependency_count": dependency_payload["summary"]["dependency_count"],
        "regulatory_workstream_count": workstream_payload["summary"]["workstream_count"],
        "classification_row_count": len(classification_rows),
        "runtime_workload_family_count": runtime_payload["summary"]["workload_family_count"],
        "gateway_surface_count": len(gateway_rows),
    }


def package_node(
    *,
    package_id: str,
    path: str,
    display_name: str,
    package_tag_class: str,
    atlas_column: str,
    owner_domain_id: str,
    bounded_context_ref: str,
    primary_language: str,
    language_posture: str,
    truth_role: str,
    workspace_status: str,
    public_entrypoints: list[str],
    notes: str,
    source_refs: list[str],
    runtime_plane_ref: str = "",
    trust_zone_ref: str = "",
    shell_types: list[str] | None = None,
    audience_tiers: list[str] | None = None,
    surface_refs: list[str] | None = None,
    route_family_refs: list[str] | None = None,
) -> dict[str, Any]:
    owner_lookup = {row["owner_domain_id"]: row for row in OWNER_DOMAIN_DEFS}
    owner = owner_lookup[owner_domain_id]
    tags = [
        f"class:{package_tag_class}",
        f"owner:{owner_domain_id}",
        f"context:{bounded_context_ref}",
        f"lang:{normalize_label(primary_language)}",
        f"status:{workspace_status}",
    ]
    return {
        "package_id": package_id,
        "path": path,
        "display_name": display_name,
        "package_tag_class": package_tag_class,
        "atlas_column": atlas_column,
        "owner_domain_id": owner_domain_id,
        "owner_domain_name": owner["owner_domain_name"],
        "owner_review_handle": owner["review_handle"],
        "owner_color": owner["color"],
        "bounded_context_ref": bounded_context_ref,
        "primary_language": primary_language,
        "language_posture": language_posture,
        "truth_role": truth_role,
        "workspace_status": workspace_status,
        "public_entrypoints": public_entrypoints,
        "runtime_plane_ref": runtime_plane_ref,
        "trust_zone_ref": trust_zone_ref,
        "shell_types": shell_types or [],
        "audience_tiers": audience_tiers or [],
        "surface_refs": surface_refs or [],
        "route_family_refs": route_family_refs or [],
        "tags": tags,
        "notes": notes,
        "source_refs": source_refs,
    }


def build_app_nodes(surface_rows: list[dict[str, str]]) -> list[dict[str, Any]]:
    surfaces_by_id = {row["surface_id"]: row for row in surface_rows}

    def attrs(surface_ids: list[str]) -> tuple[list[str], list[str], list[str]]:
        route_refs = sorted({surfaces_by_id[surface_id]["route_family_id"] for surface_id in surface_ids})
        audience_tiers = sorted({surfaces_by_id[surface_id]["audience_tier"] for surface_id in surface_ids})
        shell_types = sorted({surfaces_by_id[surface_id]["shell_type"] for surface_id in surface_ids})
        return route_refs, audience_tiers, shell_types

    patient_surfaces = [
        "surf_patient_intake_web",
        "surf_patient_intake_phone",
        "surf_patient_secure_link_recovery",
        "surf_patient_home",
        "surf_patient_requests",
        "surf_patient_appointments",
        "surf_patient_health_record",
        "surf_patient_messages",
        "surf_patient_embedded_shell",
    ]
    staff_surfaces = [
        "surf_clinician_workspace",
        "surf_clinician_workspace_child",
        "surf_practice_ops_workspace",
        "surf_assistive_sidecar",
    ]
    support_surfaces = [
        "surf_support_ticket_workspace",
        "surf_support_replay_observe",
        "surf_support_assisted_capture",
    ]
    hub_surfaces = ["surf_hub_queue", "surf_hub_case_management"]
    ops_surfaces = ["surf_operations_board", "surf_operations_drilldown"]
    governance_surfaces = ["surf_governance_shell"]
    pharmacy_surfaces = ["surf_pharmacy_console"]

    patient_route_refs, patient_audiences, patient_shells = attrs(patient_surfaces)
    staff_route_refs, staff_audiences, staff_shells = attrs(staff_surfaces)
    support_route_refs, support_audiences, support_shells = attrs(support_surfaces)
    hub_route_refs, hub_audiences, hub_shells = attrs(hub_surfaces)
    ops_route_refs, ops_audiences, ops_shells = attrs(ops_surfaces)
    governance_route_refs, governance_audiences, governance_shells = attrs(governance_surfaces)
    pharmacy_route_refs, pharmacy_audiences, pharmacy_shells = attrs(pharmacy_surfaces)

    return [
        package_node(
            package_id="app_patient_web",
            path="apps/patient-web",
            display_name="Patient Web",
            package_tag_class="app_shell",
            atlas_column="apps",
            owner_domain_id="own_patient_experience",
            bounded_context_ref="patient_experience",
            primary_language="TypeScript",
            language_posture="canonical_runtime",
            truth_role="shell_projection_only",
            workspace_status="baseline_required",
            public_entrypoints=["src/main.tsx", "src/routes/index.ts", "src/shell/index.ts"],
            runtime_plane_ref="shell_delivery",
            trust_zone_ref="tz_shell_delivery",
            shell_types=patient_shells,
            audience_tiers=patient_audiences,
            surface_refs=patient_surfaces,
            route_family_refs=patient_route_refs,
            notes="Owns all browser patient surfaces, including the embedded channel profile; still cannot own domain truth.",
            source_refs=[
                "phase-0-the-foundation-protocol.md#0A. Delivery skeleton and repository architecture",
                "platform-frontend-blueprint.md#Patient shell",
                "04_audience_surface_inventory.md",
            ],
        ),
        package_node(
            package_id="app_clinical_workspace",
            path="apps/clinical-workspace",
            display_name="Clinical Workspace",
            package_tag_class="app_shell",
            atlas_column="apps",
            owner_domain_id="own_clinical_workspace",
            bounded_context_ref="triage_human_checkpoint",
            primary_language="TypeScript",
            language_posture="canonical_runtime",
            truth_role="shell_projection_only",
            workspace_status="baseline_required",
            public_entrypoints=["src/main.tsx", "src/workspace/index.ts", "src/routes/index.ts"],
            runtime_plane_ref="shell_delivery",
            trust_zone_ref="tz_shell_delivery",
            shell_types=staff_shells,
            audience_tiers=staff_audiences,
            surface_refs=staff_surfaces,
            route_family_refs=staff_route_refs,
            notes="Includes the staff shell and bounded assistive sidecar inside the same continuity frame.",
            source_refs=[
                "phase-0-the-foundation-protocol.md#0A. Delivery skeleton and repository architecture",
                "platform-frontend-blueprint.md#Clinical workspace shell",
                "04_audience_surface_inventory.md",
            ],
        ),
        package_node(
            package_id="app_hub_desk",
            path="apps/hub-desk",
            display_name="Hub Desk",
            package_tag_class="app_shell",
            atlas_column="apps",
            owner_domain_id="own_booking_network",
            bounded_context_ref="hub_coordination",
            primary_language="TypeScript",
            language_posture="canonical_runtime",
            truth_role="shell_projection_only",
            workspace_status="baseline_required",
            public_entrypoints=["src/main.tsx", "src/hub/index.ts", "src/routes/index.ts"],
            runtime_plane_ref="shell_delivery",
            trust_zone_ref="tz_shell_delivery",
            shell_types=hub_shells,
            audience_tiers=hub_audiences,
            surface_refs=hub_surfaces,
            route_family_refs=hub_route_refs,
            notes="Owns hub queue and exception handling surfaces but only through published projection and command contracts.",
            source_refs=[
                "phase-0-the-foundation-protocol.md#0A. Delivery skeleton and repository architecture",
                "staff-operations-and-support-blueprint.md#Hub work",
                "04_audience_surface_inventory.md",
            ],
        ),
        package_node(
            package_id="app_pharmacy_console",
            path="apps/pharmacy-console",
            display_name="Pharmacy Console",
            package_tag_class="app_shell",
            atlas_column="apps",
            owner_domain_id="own_pharmacy",
            bounded_context_ref="pharmacy",
            primary_language="TypeScript",
            language_posture="canonical_runtime",
            truth_role="shell_projection_only",
            workspace_status="baseline_required",
            public_entrypoints=["src/main.tsx", "src/pharmacy/index.ts", "src/routes/index.ts"],
            runtime_plane_ref="shell_delivery",
            trust_zone_ref="tz_shell_delivery",
            shell_types=pharmacy_shells,
            audience_tiers=pharmacy_audiences,
            surface_refs=pharmacy_surfaces,
            route_family_refs=pharmacy_route_refs,
            notes="Covers the servicing-site shell and dispatch-proof workbench while keeping proof truth in backend contracts.",
            source_refs=[
                "pharmacy-console-frontend-architecture.md",
                "04_audience_surface_inventory.md",
            ],
        ),
        package_node(
            package_id="app_support_console",
            path="apps/support-console",
            display_name="Support Console",
            package_tag_class="app_shell",
            atlas_column="apps",
            owner_domain_id="own_support_operations",
            bounded_context_ref="staff_support_operations",
            primary_language="TypeScript",
            language_posture="canonical_runtime",
            truth_role="shell_projection_only",
            workspace_status="baseline_required",
            public_entrypoints=["src/main.tsx", "src/support/index.ts", "src/routes/index.ts"],
            runtime_plane_ref="shell_delivery",
            trust_zone_ref="tz_shell_delivery",
            shell_types=support_shells,
            audience_tiers=support_audiences,
            surface_refs=support_surfaces,
            route_family_refs=support_route_refs,
            notes="Separates delegate, replay, and assisted-capture support modes while still consuming the same runtime publication truth.",
            source_refs=[
                "staff-operations-and-support-blueprint.md#Support workspace",
                "04_audience_surface_inventory.md",
            ],
        ),
        package_node(
            package_id="app_ops_console",
            path="apps/ops-console",
            display_name="Operations Console",
            package_tag_class="app_shell",
            atlas_column="apps",
            owner_domain_id="own_operations_control",
            bounded_context_ref="runtime_release",
            primary_language="TypeScript",
            language_posture="canonical_runtime",
            truth_role="shell_projection_only",
            workspace_status="baseline_required",
            public_entrypoints=["src/main.tsx", "src/ops/index.ts", "src/routes/index.ts"],
            runtime_plane_ref="shell_delivery",
            trust_zone_ref="tz_shell_delivery",
            shell_types=ops_shells,
            audience_tiers=ops_audiences,
            surface_refs=ops_surfaces,
            route_family_refs=ops_route_refs,
            notes="Runs live watch, drill-down, and recovery posture surfaces against runtime publication and assurance tuples.",
            source_refs=[
                "operations-console-frontend-blueprint.md",
                "04_audience_surface_inventory.md",
            ],
        ),
        package_node(
            package_id="app_governance_admin",
            path="apps/governance-admin",
            display_name="Governance Admin",
            package_tag_class="app_shell",
            atlas_column="apps",
            owner_domain_id="own_governance_assurance",
            bounded_context_ref="assurance_and_governance",
            primary_language="TypeScript",
            language_posture="canonical_runtime",
            truth_role="shell_projection_only",
            workspace_status="baseline_required",
            public_entrypoints=["src/main.tsx", "src/governance/index.ts", "src/routes/index.ts"],
            runtime_plane_ref="shell_delivery",
            trust_zone_ref="tz_shell_delivery",
            shell_types=governance_shells,
            audience_tiers=governance_audiences,
            surface_refs=governance_surfaces,
            route_family_refs=governance_route_refs,
            notes="Holds governance and admin review work, but configuration truth still lives in published domain and release packages.",
            source_refs=[
                "governance-admin-console-frontend-blueprint.md",
                "04_audience_surface_inventory.md",
            ],
        ),
        package_node(
            package_id="app_assistive_control",
            path="apps/assistive-control",
            display_name="Assistive Control",
            package_tag_class="app_shell",
            atlas_column="apps",
            owner_domain_id="own_governance_assurance",
            bounded_context_ref="assistive",
            primary_language="TypeScript",
            language_posture="canonical_runtime",
            truth_role="shell_projection_only",
            workspace_status="conditional_future_optional",
            public_entrypoints=["src/main.tsx", "src/replay/index.ts", "src/routes/index.ts"],
            runtime_plane_ref="shell_delivery",
            trust_zone_ref="tz_shell_delivery",
            shell_types=["assistive"],
            audience_tiers=["assistive_adjunct"],
            surface_refs=[],
            route_family_refs=[],
            notes="Reserved only for future standalone evaluation, replay, or release-control work; it is not baseline live scope.",
            source_refs=[
                "platform-frontend-blueprint.md#Assistive control shell",
                "03_deferred_and_conditional_scope.md",
                "04_surface_conflict_and_gap_report.md",
            ],
        ),
    ]


def build_service_nodes() -> list[dict[str, Any]]:
    return [
        package_node(
            package_id="svc_api_gateway",
            path="services/api-gateway",
            display_name="API Gateway",
            package_tag_class="service_gateway",
            atlas_column="services",
            owner_domain_id="own_platform_runtime",
            bounded_context_ref="foundation_runtime_experience",
            primary_language="TypeScript",
            language_posture="canonical_runtime",
            truth_role="published_route_authority",
            workspace_status="baseline_required",
            public_entrypoints=["src/main.ts", "src/http/index.ts", "src/live/index.ts"],
            runtime_plane_ref="published_gateway",
            trust_zone_ref="tz_published_gateway",
            notes="Publishes audience-bound route and live-channel contracts, but may not import sibling domain internals.",
            source_refs=[
                "phase-0-the-foundation-protocol.md#0A. Delivery skeleton and repository architecture",
                "platform-runtime-and-release-blueprint.md#Frontend and backend integration contract",
            ],
        ),
        package_node(
            package_id="svc_command_api",
            path="services/command-api",
            display_name="Command API",
            package_tag_class="service_runtime",
            atlas_column="services",
            owner_domain_id="own_platform_runtime",
            bounded_context_ref="foundation_control_plane",
            primary_language="TypeScript",
            language_posture="canonical_runtime",
            truth_role="authoritative_mutation_orchestrator",
            workspace_status="baseline_required",
            public_entrypoints=["src/main.ts", "src/commands/index.ts", "src/settlement/index.ts"],
            runtime_plane_ref="application_core",
            trust_zone_ref="tz_application_core",
            notes="Owns mutation orchestration and settlement fences while composing published domain packages.",
            source_refs=[
                "phase-0-the-foundation-protocol.md#0B. Canonical domain kernel and state machine",
                "platform-runtime-and-release-blueprint.md#MutationCommandContract",
            ],
        ),
        package_node(
            package_id="svc_projection_worker",
            path="services/projection-worker",
            display_name="Projection Worker",
            package_tag_class="service_runtime",
            atlas_column="services",
            owner_domain_id="own_platform_runtime",
            bounded_context_ref="foundation_runtime_experience",
            primary_language="TypeScript",
            language_posture="canonical_runtime",
            truth_role="projection_materializer",
            workspace_status="baseline_required",
            public_entrypoints=["src/main.ts", "src/projections/index.ts", "src/rebuild/index.ts"],
            runtime_plane_ref="projection",
            trust_zone_ref="tz_application_core",
            notes="Rebuilds and publishes audience-safe projections from canonical events and contract digests.",
            source_refs=[
                "platform-runtime-and-release-blueprint.md#ProjectionContractFamily",
                "05_request_lineage_model.md",
            ],
        ),
        package_node(
            package_id="svc_notification_worker",
            path="services/notification-worker",
            display_name="Notification Worker",
            package_tag_class="service_runtime",
            atlas_column="services",
            owner_domain_id="own_platform_runtime",
            bounded_context_ref="callback_messaging",
            primary_language="TypeScript",
            language_posture="canonical_runtime",
            truth_role="communication_dispatch_orchestrator",
            workspace_status="baseline_required",
            public_entrypoints=["src/main.ts", "src/dispatch/index.ts", "src/receipts/index.ts"],
            runtime_plane_ref="application_core",
            trust_zone_ref="tz_application_core",
            notes="Processes message, callback, and reminder dispatch from durable settlement and outbox records only.",
            source_refs=[
                "callback-and-clinician-messaging-loop.md",
                "phase-0-the-foundation-protocol.md#6.6A Adapter outbox, inbox, and callback replay rule",
            ],
        ),
        package_node(
            package_id="svc_integration_worker",
            path="services/integration-worker",
            display_name="Integration Worker",
            package_tag_class="service_runtime",
            atlas_column="services",
            owner_domain_id="own_platform_runtime",
            bounded_context_ref="foundation_control_plane",
            primary_language="TypeScript",
            language_posture="canonical_runtime",
            truth_role="external_effect_adapter",
            workspace_status="baseline_required",
            public_entrypoints=["src/main.ts", "src/adapters/index.ts", "src/replay/index.ts"],
            runtime_plane_ref="integration",
            trust_zone_ref="tz_integration_perimeter",
            notes="Handles booking, hub, GP, pharmacy, messaging, and telephony adapters through durable inbox and outbox lanes.",
            source_refs=[
                "platform-runtime-and-release-blueprint.md#AdapterContractProfile",
                "08_external_dependency_inventory.md",
            ],
        ),
        package_node(
            package_id="svc_assurance_worker",
            path="services/assurance-worker",
            display_name="Assurance Worker",
            package_tag_class="service_runtime",
            atlas_column="services",
            owner_domain_id="own_platform_runtime",
            bounded_context_ref="assurance_and_governance",
            primary_language="TypeScript",
            language_posture="canonical_runtime",
            truth_role="assurance_evidence_ingestor",
            workspace_status="baseline_required",
            public_entrypoints=["src/main.ts", "src/evidence/index.ts", "src/watch/index.ts"],
            runtime_plane_ref="assurance_security",
            trust_zone_ref="tz_assurance_security",
            notes="Publishes evidence, watch tuples, and governance-protected verification state without widening shell truth.",
            source_refs=[
                "phase-9-the-assurance-ledger.md",
                "09_regulatory_workstreams.md",
            ],
        ),
        package_node(
            package_id="svc_timer_orchestrator",
            path="services/timer-orchestrator",
            display_name="Timer Orchestrator",
            package_tag_class="service_runtime",
            atlas_column="services",
            owner_domain_id="own_platform_runtime",
            bounded_context_ref="foundation_control_plane",
            primary_language="TypeScript",
            language_posture="canonical_runtime",
            truth_role="governed_deadline_scheduler",
            workspace_status="baseline_required",
            public_entrypoints=["src/main.ts", "src/timers/index.ts", "src/checkpoints/index.ts"],
            runtime_plane_ref="application_core",
            trust_zone_ref="tz_application_core",
            notes="Keeps more-info, callback, booking, hub, pharmacy, session, and grant timers out of handlers and browsers.",
            source_refs=[
                "phase-3-the-human-checkpoint.md",
                "phase-4-the-booking-engine.md",
                "phase-5-the-network-horizon.md",
                "phase-6-the-pharmacy-loop.md",
            ],
        ),
        package_node(
            package_id="svc_adapter_simulators",
            path="services/adapter-simulators",
            display_name="Adapter Simulators",
            package_tag_class="service_runtime",
            atlas_column="services",
            owner_domain_id="own_release_devex",
            bounded_context_ref="foundation_runtime_experience",
            primary_language="TypeScript",
            language_posture="canonical_runtime",
            truth_role="non_authoritative_local_simulation",
            workspace_status="baseline_required",
            public_entrypoints=["src/main.ts", "src/simulators/index.ts", "src/fixtures/index.ts"],
            runtime_plane_ref="integration",
            trust_zone_ref="tz_integration_perimeter",
            notes="Provides local-preview and CI simulation lanes for dependencies without becoming authoritative provider truth.",
            source_refs=[
                "phase-0-the-foundation-protocol.md#0A. Delivery skeleton and repository architecture",
                "08_simulator_and_local_stub_strategy.md",
            ],
        ),
    ]


def build_domain_nodes() -> list[dict[str, Any]]:
    domain_rows = [
        ("foundation-control-plane", "Foundation Control Plane", "foundation_control_plane", "own_platform_runtime"),
        ("foundation-identity-access", "Foundation Identity Access", "foundation_identity_access", "own_platform_runtime"),
        ("foundation-runtime-experience", "Foundation Runtime Experience", "foundation_runtime_experience", "own_platform_runtime"),
        ("patient-experience", "Patient Experience", "patient_experience", "own_patient_experience"),
        ("triage-human-checkpoint", "Triage Human Checkpoint", "triage_human_checkpoint", "own_clinical_workspace"),
        ("callback-messaging", "Callback Messaging", "callback_messaging", "own_patient_experience"),
        ("booking", "Booking", "booking", "own_booking_network"),
        ("hub-coordination", "Hub Coordination", "hub_coordination", "own_booking_network"),
        ("pharmacy", "Pharmacy", "pharmacy", "own_pharmacy"),
        ("staff-support-operations", "Staff Support Operations", "staff_support_operations", "own_support_operations"),
        ("assurance-and-governance", "Assurance And Governance", "assurance_and_governance", "own_governance_assurance"),
        ("platform-configuration", "Platform Configuration", "platform_configuration", "own_platform_runtime"),
        ("runtime-release", "Runtime Release", "runtime_release", "own_release_devex"),
        ("self-care-admin-resolution", "Self Care Admin Resolution", "self_care_admin_resolution", "own_patient_experience"),
        ("assistive", "Assistive", "assistive", "own_governance_assurance"),
    ]
    rows: list[dict[str, Any]] = []
    for folder, display_name, context_ref, owner_id in domain_rows:
        rows.append(
            package_node(
                package_id=f"pkg_dom_{normalize_label(context_ref)}",
                path=f"packages/domains/{folder}",
                display_name=display_name,
                package_tag_class="domain_context",
                atlas_column="domains",
                owner_domain_id=owner_id,
                bounded_context_ref=context_ref,
                primary_language="TypeScript",
                language_posture="canonical_runtime",
                truth_role="domain_truth_boundary",
                workspace_status="baseline_required",
                public_entrypoints=["src/index.ts", "src/contracts.ts", "package.json#exports"],
                notes="Published boundary package for one bounded context; external consumers may use only exported contracts and anti-corruption entrypoints.",
                source_refs=[
                    "phase-0-the-foundation-protocol.md#0A. Delivery skeleton and repository architecture",
                    "06_object_catalog.md",
                ],
            )
        )
    return rows


def build_contract_and_delivery_nodes() -> list[dict[str, Any]]:
    return [
        package_node(
            package_id="pkg_domain_kernel",
            path="packages/domain-kernel",
            display_name="Domain Kernel",
            package_tag_class="platform_shared_package",
            atlas_column="contracts",
            owner_domain_id="own_platform_runtime",
            bounded_context_ref="foundation_control_plane",
            primary_language="TypeScript",
            language_posture="canonical_runtime",
            truth_role="shared_kernel",
            workspace_status="baseline_required",
            public_entrypoints=["src/index.ts", "src/envelopes.ts", "package.json#exports"],
            notes="Canonical shared kernel for identifiers, envelopes, value objects, and anti-corruption seams.",
            source_refs=[
                "phase-0-the-foundation-protocol.md#0B. Canonical domain kernel and state machine",
            ],
        ),
        package_node(
            package_id="pkg_api_contracts",
            path="packages/api-contracts",
            display_name="API Contracts",
            package_tag_class="contract_package",
            atlas_column="contracts",
            owner_domain_id="own_platform_runtime",
            bounded_context_ref="foundation_runtime_experience",
            primary_language="TypeScript",
            language_posture="canonical_runtime",
            truth_role="published_sync_contract",
            workspace_status="baseline_required",
            public_entrypoints=["src/index.ts", "src/routes/index.ts", "dist/openapi/index.json"],
            notes="Holds route contracts as canonical sources for schema emission, typed clients, and coverage checks.",
            source_refs=[
                "phase-0-the-foundation-protocol.md#0A. Delivery skeleton and repository architecture",
                "platform-runtime-and-release-blueprint.md#Frontend and backend integration contract",
            ],
        ),
        package_node(
            package_id="pkg_live_channel_contracts",
            path="packages/live-channel-contracts",
            display_name="Live Channel Contracts",
            package_tag_class="contract_package",
            atlas_column="contracts",
            owner_domain_id="own_platform_runtime",
            bounded_context_ref="foundation_runtime_experience",
            primary_language="TypeScript",
            language_posture="canonical_runtime",
            truth_role="published_async_contract",
            workspace_status="baseline_required",
            public_entrypoints=["src/index.ts", "src/channels/index.ts", "package.json#exports"],
            notes="Versioned live update and webhook channel contracts tied to route-family and runtime publication tuples.",
            source_refs=[
                "platform-runtime-and-release-blueprint.md#LiveUpdateChannelContract",
            ],
        ),
        package_node(
            package_id="pkg_event_contracts",
            path="packages/event-contracts",
            display_name="Event Contracts",
            package_tag_class="contract_package",
            atlas_column="contracts",
            owner_domain_id="own_platform_runtime",
            bounded_context_ref="foundation_control_plane",
            primary_language="TypeScript",
            language_posture="canonical_runtime",
            truth_role="published_event_contract",
            workspace_status="baseline_required",
            public_entrypoints=["src/index.ts", "src/namespaces/index.ts", "package.json#exports"],
            notes="Canonical event namespace and envelope definitions for authoritative and observational streams.",
            source_refs=[
                "phase-0-the-foundation-protocol.md#CanonicalEventContract",
                "platform-runtime-and-release-blueprint.md#Canonical event baseline",
            ],
        ),
        package_node(
            package_id="pkg_fhir_mapping",
            path="packages/fhir-mapping",
            display_name="FHIR Mapping",
            package_tag_class="platform_shared_package",
            atlas_column="contracts",
            owner_domain_id="own_platform_runtime",
            bounded_context_ref="foundation_control_plane",
            primary_language="TypeScript",
            language_posture="canonical_runtime",
            truth_role="derived_representation_mapping",
            workspace_status="baseline_required",
            public_entrypoints=["src/index.ts", "src/mappers/index.ts", "package.json#exports"],
            notes="One-way Vecells-domain to FHIR mapping helpers; never the source of canonical runtime truth.",
            source_refs=[
                "phase-0-the-foundation-protocol.md#0B. Canonical domain kernel and state machine",
                "prompt/013.md",
            ],
        ),
        package_node(
            package_id="pkg_design_system",
            path="packages/design-system",
            display_name="Design System",
            package_tag_class="design_contract_package",
            atlas_column="contracts",
            owner_domain_id="own_design_system",
            bounded_context_ref="frontend_runtime",
            primary_language="TypeScript",
            language_posture="canonical_runtime",
            truth_role="design_token_source",
            workspace_status="baseline_required",
            public_entrypoints=["src/index.ts", "src/tokens/index.ts", "src/components/index.ts"],
            notes="First-class workspace home for token exports, primitives, and shell-safe components.",
            source_refs=[
                "design-token-foundation.md",
                "platform-frontend-blueprint.md#0.1A Canonical design-token and visual-language foundation",
            ],
        ),
        package_node(
            package_id="pkg_design_contracts",
            path="packages/design-contracts",
            display_name="Design Contracts",
            package_tag_class="design_contract_package",
            atlas_column="contracts",
            owner_domain_id="own_design_system",
            bounded_context_ref="frontend_runtime",
            primary_language="TypeScript",
            language_posture="canonical_runtime",
            truth_role="design_contract_bundle_source",
            workspace_status="baseline_required",
            public_entrypoints=["src/index.ts", "src/publication/index.ts", "src/anchors/index.ts"],
            notes="Hosts DesignContractPublicationBundle, lint verdict sources, automation anchors, and DOM vocabulary.",
            source_refs=[
                "canonical-ui-contract-kernel.md#DesignContractPublicationBundle",
                "platform-frontend-blueprint.md#2.15B DesignContractRegistry",
            ],
        ),
        package_node(
            package_id="pkg_accessibility_contracts",
            path="packages/accessibility-contracts",
            display_name="Accessibility Contracts",
            package_tag_class="design_contract_package",
            atlas_column="contracts",
            owner_domain_id="own_design_system",
            bounded_context_ref="frontend_runtime",
            primary_language="TypeScript",
            language_posture="canonical_runtime",
            truth_role="accessibility_coverage_source",
            workspace_status="baseline_required",
            public_entrypoints=["src/index.ts", "src/coverage/index.ts", "src/focus/index.ts"],
            notes="Publishes keyboard, focus, announcement, visualization parity, and timeout recovery contracts.",
            source_refs=[
                "accessibility-and-content-system-contract.md#AccessibilitySemanticCoverageProfile",
                "platform-frontend-blueprint.md#AccessibilitySemanticCoverageProfile",
            ],
        ),
        package_node(
            package_id="pkg_authz_policy",
            path="packages/authz-policy",
            display_name="Authorization Policy",
            package_tag_class="platform_shared_package",
            atlas_column="contracts",
            owner_domain_id="own_platform_runtime",
            bounded_context_ref="foundation_identity_access",
            primary_language="TypeScript",
            language_posture="canonical_runtime",
            truth_role="policy_contract",
            workspace_status="baseline_required",
            public_entrypoints=["src/index.ts", "src/policies/index.ts", "package.json#exports"],
            notes="Policy bundle sources for route, acting-scope, and release-control decisions.",
            source_refs=[
                "phase-0-the-foundation-protocol.md#0A. Delivery skeleton and repository architecture",
            ],
        ),
        package_node(
            package_id="pkg_observability",
            path="packages/observability",
            display_name="Observability",
            package_tag_class="platform_shared_package",
            atlas_column="contracts",
            owner_domain_id="own_release_devex",
            bounded_context_ref="runtime_release",
            primary_language="TypeScript",
            language_posture="canonical_runtime",
            truth_role="telemetry_contract",
            workspace_status="baseline_required",
            public_entrypoints=["src/index.ts", "src/events/index.ts", "src/redaction/index.ts"],
            notes="Structured logging, telemetry schemas, redaction helpers, and release evidence hooks.",
            source_refs=[
                "phase-9-the-assurance-ledger.md",
                "platform-frontend-blueprint.md#UIEventVisibilityProfile",
            ],
        ),
        package_node(
            package_id="pkg_release_controls",
            path="packages/release-controls",
            display_name="Release Controls",
            package_tag_class="platform_shared_package",
            atlas_column="contracts",
            owner_domain_id="own_release_devex",
            bounded_context_ref="runtime_release",
            primary_language="TypeScript",
            language_posture="canonical_runtime",
            truth_role="release_guardrail_contract",
            workspace_status="baseline_required",
            public_entrypoints=["src/index.ts", "src/freeze/index.ts", "src/verification/index.ts"],
            notes="Encodes freeze states, readiness tuples, provenance expectations, and release gates.",
            source_refs=[
                "platform-runtime-and-release-blueprint.md#Verification ladder contract",
                "platform-runtime-and-release-blueprint.md#CI/CD and supply-chain pipeline contract",
            ],
        ),
        package_node(
            package_id="pkg_runtime_publication",
            path="packages/runtime-publication",
            display_name="Runtime Publication",
            package_tag_class="platform_shared_package",
            atlas_column="contracts",
            owner_domain_id="own_platform_runtime",
            bounded_context_ref="runtime_release",
            primary_language="TypeScript",
            language_posture="canonical_runtime",
            truth_role="publication_tuple_contract",
            workspace_status="baseline_required",
            public_entrypoints=["src/index.ts", "src/manifests/index.ts", "src/parity/index.ts"],
            notes="Carries RuntimePublicationBundle, FrontendContractManifest, topology manifest, and parity tuple bindings.",
            source_refs=[
                "platform-runtime-and-release-blueprint.md#RuntimePublicationBundle",
                "11_runtime_topology_baseline.mmd",
            ],
        ),
        package_node(
            package_id="pkg_test_fixtures",
            path="packages/test-fixtures",
            display_name="Test Fixtures",
            package_tag_class="platform_shared_package",
            atlas_column="delivery",
            owner_domain_id="own_release_devex",
            bounded_context_ref="foundation_runtime_experience",
            primary_language="TypeScript",
            language_posture="canonical_runtime",
            truth_role="test_fixture_source",
            workspace_status="baseline_required",
            public_entrypoints=["src/index.ts", "src/contracts/index.ts", "src/snapshots/index.ts"],
            notes="Canonical contract and projection fixtures for unit, contract, and Playwright verification.",
            source_refs=[
                "phase-0-the-foundation-protocol.md#0A. Delivery skeleton and repository architecture",
            ],
        ),
        package_node(
            package_id="pkg_migrations",
            path="packages/migrations",
            display_name="Migrations",
            package_tag_class="platform_shared_package",
            atlas_column="delivery",
            owner_domain_id="own_release_devex",
            bounded_context_ref="runtime_release",
            primary_language="TypeScript",
            language_posture="canonical_runtime",
            truth_role="schema_migration_source",
            workspace_status="baseline_required",
            public_entrypoints=["src/index.ts", "src/runner/index.ts", "src/windows/index.ts"],
            notes="Expand-migrate-contract runner and compatibility window emitters; no snapshot-only schema jumps.",
            source_refs=[
                "phase-0-the-foundation-protocol.md#0A. Delivery skeleton and repository architecture",
                "platform-runtime-and-release-blueprint.md#Data persistence and migration contract",
            ],
        ),
        package_node(
            package_id="pkg_gen_api_clients",
            path="packages/generated/api-clients",
            display_name="Generated API Clients",
            package_tag_class="generated_contract_package",
            atlas_column="delivery",
            owner_domain_id="own_release_devex",
            bounded_context_ref="foundation_runtime_experience",
            primary_language="TypeScript",
            language_posture="generated_derivative",
            truth_role="generated_derivative_only",
            workspace_status="baseline_required",
            public_entrypoints=["src/index.ts", "generated-manifest.json"],
            notes="Generated, versioned API clients tied to route spec digests and contract tests.",
            source_refs=[
                "platform-runtime-and-release-blueprint.md#Frontend and backend integration contract",
            ],
        ),
        package_node(
            package_id="pkg_gen_live_channel_clients",
            path="packages/generated/live-channel-clients",
            display_name="Generated Live Channel Clients",
            package_tag_class="generated_contract_package",
            atlas_column="delivery",
            owner_domain_id="own_release_devex",
            bounded_context_ref="foundation_runtime_experience",
            primary_language="TypeScript",
            language_posture="generated_derivative",
            truth_role="generated_derivative_only",
            workspace_status="baseline_required",
            public_entrypoints=["src/index.ts", "generated-manifest.json"],
            notes="Generated live-update and webhook bindings published from versioned channel contracts.",
            source_refs=[
                "platform-runtime-and-release-blueprint.md#LiveUpdateChannelContract",
            ],
        ),
        package_node(
            package_id="pkg_gen_event_bindings",
            path="packages/generated/event-bindings",
            display_name="Generated Event Bindings",
            package_tag_class="generated_contract_package",
            atlas_column="delivery",
            owner_domain_id="own_release_devex",
            bounded_context_ref="foundation_control_plane",
            primary_language="TypeScript",
            language_posture="generated_derivative",
            truth_role="generated_derivative_only",
            workspace_status="baseline_required",
            public_entrypoints=["src/index.ts", "generated-manifest.json"],
            notes="Generated event envelopes, namespace maps, and compatibility fixtures from canonical event contracts.",
            source_refs=[
                "phase-0-the-foundation-protocol.md#CanonicalEventContract",
            ],
        ),
        package_node(
            package_id="pkg_gen_design_contract_bindings",
            path="packages/generated/design-contract-bindings",
            display_name="Generated Design Contract Bindings",
            package_tag_class="generated_contract_package",
            atlas_column="delivery",
            owner_domain_id="own_release_devex",
            bounded_context_ref="frontend_runtime",
            primary_language="TypeScript",
            language_posture="generated_derivative",
            truth_role="generated_derivative_only",
            workspace_status="baseline_required",
            public_entrypoints=["src/index.ts", "generated-manifest.json"],
            notes="Generated DOM marker maps, vocabulary unions, and bundle digests for app and Playwright consumption.",
            source_refs=[
                "canonical-ui-contract-kernel.md#DesignContractPublicationBundle",
                "platform-frontend-blueprint.md#7.8 Verification and Playwright contract",
            ],
        ),
        package_node(
            package_id="pkg_gen_migration_fixtures",
            path="packages/generated/migration-fixtures",
            display_name="Generated Migration Fixtures",
            package_tag_class="generated_contract_package",
            atlas_column="delivery",
            owner_domain_id="own_release_devex",
            bounded_context_ref="runtime_release",
            primary_language="TypeScript",
            language_posture="generated_derivative",
            truth_role="generated_derivative_only",
            workspace_status="baseline_required",
            public_entrypoints=["src/index.ts", "generated-manifest.json"],
            notes="Generated production-like snapshots and compatibility fixtures for expand-migrate-contract rehearsal.",
            source_refs=[
                "phase-0-the-foundation-protocol.md#0A. Delivery skeleton and repository architecture",
            ],
        ),
        package_node(
            package_id="tool_codegen",
            path="tools/codegen",
            display_name="Code Generation Tooling",
            package_tag_class="tooling_package",
            atlas_column="delivery",
            owner_domain_id="own_release_devex",
            bounded_context_ref="runtime_release",
            primary_language="TypeScript",
            language_posture="bounded_tooling",
            truth_role="non_authoritative_tooling",
            workspace_status="baseline_required",
            public_entrypoints=["src/index.ts", "src/pipelines/index.ts", "src/emitters/index.ts"],
            notes="Nx-invoked generators for route specs, clients, event bindings, design bundles, and fixture regeneration.",
            source_refs=[
                "phase-0-the-foundation-protocol.md#0A. Delivery skeleton and repository architecture",
                "platform-runtime-and-release-blueprint.md#CI/CD and supply-chain pipeline contract",
            ],
        ),
        package_node(
            package_id="tool_analysis",
            path="tools/analysis",
            display_name="Analysis Tooling",
            package_tag_class="tooling_package",
            atlas_column="delivery",
            owner_domain_id="own_release_devex",
            bounded_context_ref="runtime_release",
            primary_language="Python",
            language_posture="bounded_tooling",
            truth_role="non_authoritative_tooling",
            workspace_status="baseline_required",
            public_entrypoints=["*.py", "README.md"],
            notes="Bounded Python-only analysis and architecture synthesis lane; it may inspect truth but never become runtime truth owner.",
            source_refs=[
                "prompt/shared_operating_contract_011_to_015.md",
                "tasks 001-012 toolchain",
            ],
        ),
        package_node(
            package_id="tool_validators",
            path="tools/validators",
            display_name="Validator Tooling",
            package_tag_class="tooling_package",
            atlas_column="delivery",
            owner_domain_id="own_release_devex",
            bounded_context_ref="runtime_release",
            primary_language="Python",
            language_posture="bounded_tooling",
            truth_role="non_authoritative_tooling",
            workspace_status="baseline_required",
            public_entrypoints=["*.py", "*.ts"],
            notes="Cross-package graph, codegen drift, and contract compatibility validators; secondary language stays bounded to tooling.",
            source_refs=[
                "phase-0-the-foundation-protocol.md#0A. Delivery skeleton and repository architecture",
            ],
        ),
        package_node(
            package_id="tool_dev_bootstrap",
            path="tools/dev-bootstrap",
            display_name="Developer Bootstrap",
            package_tag_class="tooling_package",
            atlas_column="delivery",
            owner_domain_id="own_release_devex",
            bounded_context_ref="foundation_runtime_experience",
            primary_language="TypeScript",
            language_posture="bounded_tooling",
            truth_role="non_authoritative_tooling",
            workspace_status="baseline_required",
            public_entrypoints=["src/index.ts", "src/local-topology/index.ts", "src/env/index.ts"],
            notes="One-command local startup, env checks, simulator wiring, and preview bootstrap.",
            source_refs=[
                "phase-0-the-foundation-protocol.md#0A. Delivery skeleton and repository architecture",
            ],
        ),
        package_node(
            package_id="infra_environments",
            path="infra/environments",
            display_name="Infrastructure Environments",
            package_tag_class="delivery_control_artifact",
            atlas_column="delivery",
            owner_domain_id="own_release_devex",
            bounded_context_ref="runtime_release",
            primary_language="YAML",
            language_posture="bounded_tooling",
            truth_role="delivery_configuration_only",
            workspace_status="baseline_required",
            public_entrypoints=["*.yaml", "*.json", "*.template"],
            notes="Provider-neutral environment definitions, preview topology wiring, and deployment inputs. No secrets in source.",
            source_refs=[
                "phase-0-the-foundation-protocol.md#0A. Delivery skeleton and repository architecture",
            ],
        ),
        package_node(
            package_id="ops_runbooks",
            path="ops/runbooks",
            display_name="Ops Runbooks",
            package_tag_class="delivery_control_artifact",
            atlas_column="delivery",
            owner_domain_id="own_release_devex",
            bounded_context_ref="runtime_release",
            primary_language="Markdown",
            language_posture="bounded_tooling",
            truth_role="delivery_evidence_only",
            workspace_status="baseline_required",
            public_entrypoints=["*.md"],
            notes="Runbooks, rehearsal instructions, and evidence maps paired to release controls and runtime publication tuples.",
            source_refs=[
                "phase-0-the-foundation-protocol.md#0A. Delivery skeleton and repository architecture",
                "platform-runtime-and-release-blueprint.md#OperationalReadinessSnapshot",
            ],
        ),
    ]


def build_workspace_nodes(surface_rows: list[dict[str, str]]) -> list[dict[str, Any]]:
    rows = build_app_nodes(surface_rows)
    rows.extend(build_service_nodes())
    rows.extend(build_domain_nodes())
    rows.extend(build_contract_and_delivery_nodes())
    return rows


def edge(
    edge_id: str,
    from_id: str,
    to_id: str,
    edge_class: str,
    violation_state: str,
    rule_ref: str,
    rationale: str,
    source_refs: list[str],
) -> dict[str, Any]:
    return {
        "edge_id": edge_id,
        "from_package_id": from_id,
        "to_package_id": to_id,
        "edge_class": edge_class,
        "violation_state": violation_state,
        "rule_ref": rule_ref,
        "rationale": rationale,
        "source_refs": source_refs,
    }


def build_workspace_edges(nodes: list[dict[str, Any]]) -> list[dict[str, Any]]:
    edges: list[dict[str, Any]] = []

    def add_allowed(from_id: str, to_id: str, edge_class: str, rule_ref: str, rationale: str) -> None:
        edges.append(
            edge(
                f"{from_id}__{to_id}",
                from_id,
                to_id,
                edge_class,
                "allowed",
                rule_ref,
                rationale,
                ["phase-0-the-foundation-protocol.md#0A. Delivery skeleton and repository architecture"],
            )
        )

    def add_forbidden(from_id: str, to_id: str, rule_ref: str, rationale: str) -> None:
        edges.append(
            edge(
                f"forbid__{from_id}__{to_id}",
                from_id,
                to_id,
                "policy_violation_example",
                "forbidden",
                rule_ref,
                rationale,
                [
                    "phase-0-the-foundation-protocol.md#0A. Delivery skeleton and repository architecture",
                    "forensic-audit-findings.md#Finding 118 - Token export and design-contract conformance could still drift outside the published runtime tuple",
                ],
            )
        )

    app_ids = [
        "app_patient_web",
        "app_clinical_workspace",
        "app_hub_desk",
        "app_pharmacy_console",
        "app_support_console",
        "app_ops_console",
        "app_governance_admin",
        "app_assistive_control",
    ]
    for app_id in app_ids:
        for target in [
            "pkg_design_system",
            "pkg_design_contracts",
            "pkg_accessibility_contracts",
            "pkg_authz_policy",
            "pkg_observability",
            "pkg_runtime_publication",
            "pkg_gen_api_clients",
            "pkg_gen_live_channel_clients",
            "pkg_gen_design_contract_bindings",
        ]:
            add_allowed(
                app_id,
                target,
                "published_consumption",
                "RULE_APP_SHELL_CONSUMES_PUBLISHED_CONTRACTS_ONLY",
                "Shells consume published contracts, generated clients, and design/runtime publication packages only.",
            )

    for service_id, targets in {
        "svc_api_gateway": [
            "pkg_api_contracts",
            "pkg_live_channel_contracts",
            "pkg_authz_policy",
            "pkg_observability",
            "pkg_release_controls",
            "pkg_runtime_publication",
        ],
        "svc_command_api": [
            "pkg_domain_kernel",
            "pkg_event_contracts",
            "pkg_api_contracts",
            "pkg_authz_policy",
            "pkg_observability",
            "pkg_release_controls",
            "pkg_runtime_publication",
            "pkg_migrations",
            "pkg_dom_foundation_control_plane",
            "pkg_dom_foundation_identity_access",
            "pkg_dom_patient_experience",
            "pkg_dom_triage_human_checkpoint",
            "pkg_dom_callback_messaging",
            "pkg_dom_booking",
            "pkg_dom_hub_coordination",
            "pkg_dom_pharmacy",
            "pkg_dom_staff_support_operations",
            "pkg_dom_assurance_and_governance",
            "pkg_dom_platform_configuration",
            "pkg_dom_runtime_release",
            "pkg_dom_self_care_admin_resolution",
            "pkg_dom_assistive",
        ],
        "svc_projection_worker": [
            "pkg_domain_kernel",
            "pkg_event_contracts",
            "pkg_live_channel_contracts",
            "pkg_observability",
            "pkg_runtime_publication",
            "pkg_dom_patient_experience",
            "pkg_dom_triage_human_checkpoint",
            "pkg_dom_booking",
            "pkg_dom_hub_coordination",
            "pkg_dom_pharmacy",
            "pkg_dom_callback_messaging",
            "pkg_dom_staff_support_operations",
        ],
        "svc_notification_worker": [
            "pkg_domain_kernel",
            "pkg_event_contracts",
            "pkg_api_contracts",
            "pkg_observability",
            "pkg_release_controls",
            "pkg_dom_callback_messaging",
            "pkg_dom_patient_experience",
            "pkg_dom_staff_support_operations",
        ],
        "svc_integration_worker": [
            "pkg_domain_kernel",
            "pkg_event_contracts",
            "pkg_live_channel_contracts",
            "pkg_fhir_mapping",
            "pkg_observability",
            "pkg_release_controls",
            "pkg_runtime_publication",
            "pkg_dom_booking",
            "pkg_dom_hub_coordination",
            "pkg_dom_pharmacy",
            "pkg_dom_foundation_identity_access",
        ],
        "svc_assurance_worker": [
            "pkg_domain_kernel",
            "pkg_event_contracts",
            "pkg_observability",
            "pkg_release_controls",
            "pkg_runtime_publication",
            "pkg_dom_assurance_and_governance",
            "pkg_dom_runtime_release",
            "pkg_dom_platform_configuration",
        ],
        "svc_timer_orchestrator": [
            "pkg_domain_kernel",
            "pkg_event_contracts",
            "pkg_observability",
            "pkg_release_controls",
            "pkg_dom_foundation_identity_access",
            "pkg_dom_triage_human_checkpoint",
            "pkg_dom_callback_messaging",
            "pkg_dom_booking",
            "pkg_dom_hub_coordination",
            "pkg_dom_pharmacy",
            "pkg_dom_runtime_release",
        ],
        "svc_adapter_simulators": [
            "pkg_api_contracts",
            "pkg_live_channel_contracts",
            "pkg_event_contracts",
            "pkg_test_fixtures",
            "pkg_observability",
        ],
    }.items():
        for target in targets:
            add_allowed(
                service_id,
                target,
                "runtime_composition",
                "RULE_RUNTIME_SERVICES_COMPOSE_PUBLISHED_DOMAINS_ONLY",
                "Runtime services compose published domain and contract packages but do not read app internals or sibling package internals directly.",
            )

    for domain_id in [
        "pkg_dom_foundation_control_plane",
        "pkg_dom_foundation_identity_access",
        "pkg_dom_foundation_runtime_experience",
        "pkg_dom_patient_experience",
        "pkg_dom_triage_human_checkpoint",
        "pkg_dom_callback_messaging",
        "pkg_dom_booking",
        "pkg_dom_hub_coordination",
        "pkg_dom_pharmacy",
        "pkg_dom_staff_support_operations",
        "pkg_dom_assurance_and_governance",
        "pkg_dom_platform_configuration",
        "pkg_dom_runtime_release",
        "pkg_dom_self_care_admin_resolution",
        "pkg_dom_assistive",
    ]:
        for target in ["pkg_domain_kernel", "pkg_event_contracts", "pkg_authz_policy", "pkg_release_controls"]:
            add_allowed(
                domain_id,
                target,
                "shared_kernel_consumption",
                "RULE_DOMAIN_CONTEXTS_DO_NOT_IMPORT_SIBLING_DOMAIN_INTERNALS",
                "Domain packages depend only on the shared kernel and explicitly published contracts.",
            )

    for target in ["pkg_design_system", "pkg_accessibility_contracts"]:
        add_allowed(
            "pkg_design_contracts",
            target,
            "design_bundle_source",
            "RULE_DESIGN_AND_ACCESSIBILITY_ARE_FIRST_CLASS",
            "Design-contract publication composes the design system and accessibility coverage into one published bundle.",
        )

    for target in ["pkg_design_system", "pkg_design_contracts"]:
        add_allowed(
            "pkg_accessibility_contracts",
            target,
            "design_bundle_source",
            "RULE_DESIGN_AND_ACCESSIBILITY_ARE_FIRST_CLASS",
            "Accessibility coverage resolves against the same token and design bundle vocabulary.",
        )

    for target in ["pkg_domain_kernel", "pkg_authz_policy"]:
        add_allowed(
            "pkg_api_contracts",
            target,
            "contract_source",
            "RULE_CONTRACT_PACKAGES_DEFINE_PUBLISHED_TRUTH",
            "API contracts derive from the shared kernel and policy envelopes, not app-local types.",
        )

    add_allowed(
        "pkg_live_channel_contracts",
        "pkg_event_contracts",
        "contract_source",
        "RULE_CONTRACT_PACKAGES_DEFINE_PUBLISHED_TRUTH",
        "Live channels resolve from event and route contract truth.",
    )
    add_allowed(
        "pkg_live_channel_contracts",
        "pkg_api_contracts",
        "contract_source",
        "RULE_CONTRACT_PACKAGES_DEFINE_PUBLISHED_TRUTH",
        "Live channels stay bound to the published route family and route contract set.",
    )

    add_allowed(
        "pkg_event_contracts",
        "pkg_domain_kernel",
        "contract_source",
        "RULE_CONTRACT_PACKAGES_DEFINE_PUBLISHED_TRUTH",
        "Event envelopes use the canonical kernel identifiers and value objects.",
    )

    for target in [
        "pkg_api_contracts",
        "pkg_live_channel_contracts",
        "pkg_event_contracts",
        "pkg_design_contracts",
        "pkg_release_controls",
        "pkg_observability",
    ]:
        add_allowed(
            "pkg_runtime_publication",
            target,
            "publication_binding",
            "RULE_RUNTIME_PUBLICATION_BINDS_ROUTE_EVENT_DESIGN_AND_RELEASE_TRUTH",
            "Runtime publication ties route, event, design, and release digests into one tuple.",
        )

    for target in ["pkg_domain_kernel", "pkg_dom_patient_experience", "pkg_dom_booking", "pkg_dom_pharmacy"]:
        add_allowed(
            "pkg_fhir_mapping",
            target,
            "mapping_boundary",
            "RULE_FHIR_MAPPING_IS_DERIVED_ONLY",
            "FHIR mapping consumes domain truth but never owns it.",
        )

    for source_pkg, output_pkg, rule_ref in [
        ("pkg_api_contracts", "pkg_gen_api_clients", "RULE_GENERATED_ARTIFACTS_TRACE_TO_SOURCE_CONTRACTS"),
        ("pkg_live_channel_contracts", "pkg_gen_live_channel_clients", "RULE_GENERATED_ARTIFACTS_TRACE_TO_SOURCE_CONTRACTS"),
        ("pkg_event_contracts", "pkg_gen_event_bindings", "RULE_GENERATED_ARTIFACTS_TRACE_TO_SOURCE_CONTRACTS"),
        ("pkg_design_contracts", "pkg_gen_design_contract_bindings", "RULE_GENERATED_ARTIFACTS_TRACE_TO_SOURCE_CONTRACTS"),
        ("pkg_migrations", "pkg_gen_migration_fixtures", "RULE_GENERATED_ARTIFACTS_TRACE_TO_SOURCE_CONTRACTS"),
    ]:
        add_allowed(
            "tool_codegen",
            source_pkg,
            "tooling_generation",
            rule_ref,
            "Codegen tooling reads canonical contract sources and emits generated derivative packages with digest traceability.",
        )
        add_allowed(
            output_pkg,
            source_pkg,
            "generated_from",
            rule_ref,
            "Generated package stays explicitly traceable back to its source contract package.",
        )

    for target in ["pkg_gen_api_clients", "pkg_gen_live_channel_clients", "pkg_gen_event_bindings", "pkg_gen_design_contract_bindings", "pkg_gen_migration_fixtures"]:
        add_allowed(
            "tool_validators",
            target,
            "validation_consumption",
            "RULE_GENERATED_ARTIFACTS_TRACE_TO_SOURCE_CONTRACTS",
            "Validators compare generated outputs to their source digests and public manifests.",
        )

    for target in ["svc_adapter_simulators", "infra_environments", "pkg_test_fixtures"]:
        add_allowed(
            "tool_dev_bootstrap",
            target,
            "delivery_control",
            "RULE_ONE_COMMAND_LOCAL_STARTUP",
            "Bootstrap tooling orchestrates local services, environment loading, and simulator startup.",
        )

    for target in ["pkg_release_controls", "pkg_runtime_publication", "pkg_observability"]:
        add_allowed(
            "ops_runbooks",
            target,
            "evidence_reference",
            "RULE_RELEASE_AND_RECOVERY_EVIDENCE_STAY_BOUND",
            "Runbooks cite the same release control and publication artifacts used by live delivery.",
        )

    for target in ["pkg_release_controls", "pkg_runtime_publication"]:
        add_allowed(
            "infra_environments",
            target,
            "delivery_control",
            "RULE_RELEASE_AND_RECOVERY_EVIDENCE_STAY_BOUND",
            "Environment definitions remain bound to release controls and publication tuples.",
        )

    forbidden_examples = [
        ("app_patient_web", "pkg_dom_booking", "RULE_APP_SHELL_CONSUMES_PUBLISHED_CONTRACTS_ONLY", "Patient shell may not import booking internals directly."),
        ("app_clinical_workspace", "pkg_dom_patient_experience", "RULE_APP_SHELL_CONSUMES_PUBLISHED_CONTRACTS_ONLY", "Clinical shell may not reach through patient domain internals."),
        ("app_support_console", "pkg_dom_callback_messaging", "RULE_APP_SHELL_CONSUMES_PUBLISHED_CONTRACTS_ONLY", "Support shell must consume published replay and summary contracts, not callback internals."),
        ("app_ops_console", "svc_projection_worker", "RULE_APP_SHELL_CONSUMES_PUBLISHED_CONTRACTS_ONLY", "Shells never import runtime executables."),
        ("app_governance_admin", "pkg_fhir_mapping", "RULE_APP_SHELL_CONSUMES_PUBLISHED_CONTRACTS_ONLY", "Governance shell cannot interpret mapping internals as browser truth."),
        ("svc_api_gateway", "pkg_dom_booking", "RULE_GATEWAY_USES_CONTRACTS_NOT_DOMAIN_INTERNALS", "Gateway publishes routes from contracts and runtime bindings, not domain package internals."),
        ("svc_projection_worker", "app_patient_web", "RULE_RUNTIME_SERVICES_COMPOSE_PUBLISHED_DOMAINS_ONLY", "Workers never import shell code."),
        ("svc_integration_worker", "app_support_console", "RULE_RUNTIME_SERVICES_COMPOSE_PUBLISHED_DOMAINS_ONLY", "Integration code cannot depend on browser shells."),
        ("pkg_dom_booking", "pkg_dom_pharmacy", "RULE_DOMAIN_CONTEXTS_DO_NOT_IMPORT_SIBLING_DOMAIN_INTERNALS", "Sibling domains communicate through events or published contracts, not direct imports."),
        ("pkg_dom_assistive", "pkg_dom_patient_experience", "RULE_DOMAIN_CONTEXTS_DO_NOT_IMPORT_SIBLING_DOMAIN_INTERNALS", "Assistive logic may not reach into patient internals."),
        ("tool_analysis", "svc_command_api", "RULE_TOOLING_LANGUAGES_ARE_BOUNDED_AND_NON_AUTHORITATIVE", "Python analysis tooling may inspect outputs but never become a runtime dependency."),
        ("pkg_gen_api_clients", "app_patient_web", "RULE_GENERATED_PACKAGES_ARE_DERIVATIVE_ONLY", "Generated packages do not import consumer shells or become source-of-truth owners."),
    ]
    for from_id, to_id, rule_ref, rationale in forbidden_examples:
        add_forbidden(from_id, to_id, rule_ref, rationale)

    return edges


def build_import_rules() -> dict[str, Any]:
    return {
        "baseline_id": "vecells_workspace_boundary_rules_v1",
        "enforcement_stack": [
            {
                "layer": "workspace_graph",
                "tooling": "Nx project graph + project tags",
                "purpose": "Defines allowed project-to-project edges and affected-target execution.",
            },
            {
                "layer": "lint",
                "tooling": "ESLint boundary rules + export-map restrictions",
                "purpose": "Prevents deep imports into /src, /internal, /workers, /repositories, or /adapters subpaths.",
            },
            {
                "layer": "graph_parity",
                "tooling": "dependency graph parity checker",
                "purpose": "Stops TS path aliases or relative paths from bypassing the declared workspace graph.",
            },
            {
                "layer": "ownership",
                "tooling": "generated CODEOWNERS from codeowners_matrix.csv",
                "purpose": "Makes package ownership machine-checkable in review.",
            },
            {
                "layer": "validation",
                "tooling": "validate_workspace_baseline.py",
                "purpose": "Fails any owner drift, illegal edges, codegen traceability loss, or language sprawl.",
            },
        ],
        "rules": [
            {
                "rule_id": "RULE_ONE_OWNER_DOMAIN",
                "description": "Every package, app, service, tool, infra path, and generated package resolves to exactly one owner domain and one package-tag class.",
                "applies_to_tag_classes": ["app_shell", "service_gateway", "service_runtime", "domain_context", "contract_package", "design_contract_package", "platform_shared_package", "generated_contract_package", "tooling_package", "delivery_control_artifact"],
                "forbidden_subpaths": [],
                "source_refs": [
                    "phase-0-the-foundation-protocol.md#0A. Delivery skeleton and repository architecture",
                ],
            },
            {
                "rule_id": "RULE_APP_SHELL_CONSUMES_PUBLISHED_CONTRACTS_ONLY",
                "description": "Apps may import only shared contracts, design contracts, generated client bindings, and platform shared publication packages.",
                "from_tag_classes": ["app_shell"],
                "allow_to_tag_classes": ["contract_package", "design_contract_package", "platform_shared_package", "generated_contract_package"],
                "forbid_to_tag_classes": ["domain_context", "service_gateway", "service_runtime", "tooling_package", "delivery_control_artifact"],
                "forbidden_subpaths": ["/src/", "/internal/", "/workers/", "/repositories/", "/adapters/"],
                "source_refs": [
                    "phase-0-the-foundation-protocol.md#0A. Delivery skeleton and repository architecture",
                    "platform-frontend-blueprint.md#4101",
                ],
            },
            {
                "rule_id": "RULE_GATEWAY_USES_CONTRACTS_NOT_DOMAIN_INTERNALS",
                "description": "Gateway code publishes routes from contract packages and runtime publication bindings, never by importing domain internals.",
                "from_tag_classes": ["service_gateway"],
                "allow_to_tag_classes": ["contract_package", "platform_shared_package", "generated_contract_package"],
                "forbid_to_tag_classes": ["domain_context", "app_shell"],
                "forbidden_subpaths": ["/src/", "/internal/", "/workers/", "/repositories/"],
                "source_refs": [
                    "platform-runtime-and-release-blueprint.md#Frontend and backend integration contract",
                ],
            },
            {
                "rule_id": "RULE_RUNTIME_SERVICES_COMPOSE_PUBLISHED_DOMAINS_ONLY",
                "description": "Runtime services may compose multiple domain packages, but only through their published entrypoints and shared contracts.",
                "from_tag_classes": ["service_runtime"],
                "allow_to_tag_classes": ["domain_context", "contract_package", "platform_shared_package", "generated_contract_package"],
                "forbid_to_tag_classes": ["app_shell"],
                "forbidden_subpaths": ["/src/", "/internal/", "/workers/", "/repositories/"],
                "source_refs": [
                    "phase-0-the-foundation-protocol.md#0A. Delivery skeleton and repository architecture",
                ],
            },
            {
                "rule_id": "RULE_DOMAIN_CONTEXTS_DO_NOT_IMPORT_SIBLING_DOMAIN_INTERNALS",
                "description": "A domain package may depend on the shared kernel and published contracts, but not on sibling domain packages.",
                "from_tag_classes": ["domain_context"],
                "allow_to_tag_classes": ["platform_shared_package", "contract_package"],
                "forbid_to_tag_classes": ["domain_context", "app_shell"],
                "forbidden_subpaths": ["/src/", "/internal/", "/workers/", "/repositories/", "/projections/"],
                "source_refs": [
                    "phase-0-the-foundation-protocol.md#0A. Delivery skeleton and repository architecture",
                    "forensic-audit-findings.md#Finding 57",
                ],
            },
            {
                "rule_id": "RULE_CONTRACT_PACKAGES_DEFINE_PUBLISHED_TRUTH",
                "description": "Contract packages are the canonical source for route, live-channel, and event publication inputs; apps and ad hoc DTO files may not replace them.",
                "from_tag_classes": ["contract_package"],
                "allow_to_tag_classes": ["platform_shared_package", "contract_package"],
                "forbid_to_tag_classes": ["app_shell", "service_runtime"],
                "forbidden_subpaths": [],
                "source_refs": [
                    "platform-runtime-and-release-blueprint.md#Frontend and backend integration contract",
                    "phase-0-the-foundation-protocol.md#0A. Delivery skeleton and repository architecture",
                ],
            },
            {
                "rule_id": "RULE_RUNTIME_PUBLICATION_BINDS_ROUTE_EVENT_DESIGN_AND_RELEASE_TRUTH",
                "description": "Runtime publication binds route, event, design-contract, topology, and release-control digests into one bundle; no consumer may restitch them independently.",
                "from_tag_classes": ["platform_shared_package"],
                "allow_to_tag_classes": ["contract_package", "design_contract_package", "platform_shared_package"],
                "forbid_to_tag_classes": [],
                "forbidden_subpaths": [],
                "source_refs": [
                    "platform-runtime-and-release-blueprint.md#RuntimePublicationBundle",
                    "platform-runtime-and-release-blueprint.md#ReleasePublicationParityRecord",
                ],
            },
            {
                "rule_id": "RULE_FHIR_MAPPING_IS_DERIVED_ONLY",
                "description": "FHIR mapping code may consume domain packages, but it remains a one-way derived representation boundary and never canonical truth.",
                "from_tag_classes": ["platform_shared_package"],
                "allow_to_tag_classes": ["domain_context", "platform_shared_package"],
                "forbid_to_tag_classes": ["app_shell"],
                "forbidden_subpaths": [],
                "source_refs": [
                    "phase-0-the-foundation-protocol.md#0B. Canonical domain kernel and state machine",
                ],
            },
            {
                "rule_id": "RULE_GENERATED_ARTIFACTS_TRACE_TO_SOURCE_CONTRACTS",
                "description": "Generated artifacts live only in packages/generated or dist/publication and must carry source contract digests and generator manifests.",
                "from_tag_classes": ["generated_contract_package", "tooling_package"],
                "allow_to_tag_classes": ["contract_package", "design_contract_package", "platform_shared_package"],
                "forbid_to_tag_classes": ["app_shell", "service_runtime", "service_gateway"],
                "forbidden_subpaths": [],
                "source_refs": [
                    "platform-runtime-and-release-blueprint.md#1632",
                    "forensic-audit-findings.md#Finding 118 - Token export and design-contract conformance could still drift outside the published runtime tuple",
                ],
            },
            {
                "rule_id": "RULE_GENERATED_PACKAGES_ARE_DERIVATIVE_ONLY",
                "description": "Generated packages never import or own consumer shells or services; they are reviewed outputs, not upstream truth owners.",
                "from_tag_classes": ["generated_contract_package"],
                "allow_to_tag_classes": ["contract_package", "design_contract_package", "platform_shared_package"],
                "forbid_to_tag_classes": ["app_shell", "service_gateway", "service_runtime"],
                "forbidden_subpaths": [],
                "source_refs": [
                    "prompt/012.md",
                    "phase-0-the-foundation-protocol.md#0A. Delivery skeleton and repository architecture",
                ],
            },
            {
                "rule_id": "RULE_DESIGN_AND_ACCESSIBILITY_ARE_FIRST_CLASS",
                "description": "Design-system, design-contract, and accessibility-contract packages are first-class workspace citizens and may not be relegated to docs or test snapshots.",
                "applies_to_tag_classes": ["design_contract_package"],
                "forbidden_subpaths": [],
                "source_refs": [
                    "platform-frontend-blueprint.md#2.15B DesignContractRegistry",
                    "accessibility-and-content-system-contract.md#AccessibilitySemanticCoverageProfile",
                ],
            },
            {
                "rule_id": "RULE_TOOLING_LANGUAGES_ARE_BOUNDED_AND_NON_AUTHORITATIVE",
                "description": "Python is allowed only in tools/analysis and tools/validators; it may inspect, validate, and synthesize but never own canonical runtime truth.",
                "applies_to_tag_classes": ["tooling_package"],
                "forbidden_subpaths": [],
                "source_refs": [
                    "prompt/012.md",
                    "prompt/shared_operating_contract_011_to_015.md",
                ],
            },
            {
                "rule_id": "RULE_ONE_COMMAND_LOCAL_STARTUP",
                "description": "The workspace must support one-command local startup, preview boot, CI builds, contract tests, and Playwright runs from the same graph.",
                "applies_to_tag_classes": ["tooling_package", "delivery_control_artifact"],
                "forbidden_subpaths": [],
                "source_refs": [
                    "phase-0-the-foundation-protocol.md#0A. Delivery skeleton and repository architecture",
                ],
            },
            {
                "rule_id": "RULE_RELEASE_AND_RECOVERY_EVIDENCE_STAY_BOUND",
                "description": "Infra definitions, runbooks, and operational artifacts must stay bound to release controls and runtime publication tuples rather than drifting into detached documentation.",
                "applies_to_tag_classes": ["delivery_control_artifact"],
                "forbidden_subpaths": [],
                "source_refs": [
                    "phase-0-the-foundation-protocol.md#0A. Delivery skeleton and repository architecture",
                    "platform-runtime-and-release-blueprint.md#OperationalReadinessSnapshot",
                ],
            },
            {
                "rule_id": "RULE_NO_REMOTE_ASSETS_OR_SOURCE_SECRETS",
                "description": "No remote CDN assets, fonts, or browser scripts are allowed in baseline outputs, and secrets may not appear in committed source or generated artifacts.",
                "applies_to_tag_classes": ["app_shell", "service_gateway", "service_runtime", "contract_package", "design_contract_package", "platform_shared_package", "generated_contract_package", "tooling_package", "delivery_control_artifact"],
                "forbidden_subpaths": [],
                "source_refs": [
                    "prompt/012.md",
                    "phase-0-the-foundation-protocol.md#0A. Delivery skeleton and repository architecture",
                ],
            },
        ],
    }


def build_codegen_flows() -> list[dict[str, Any]]:
    return [
        {
            "codegen_flow_id": "CFG_ROUTE_SPEC_PUBLICATION",
            "contract_family": "sync_route_contracts",
            "source_package_id": "pkg_api_contracts",
            "generator_package_id": "tool_codegen",
            "output_target": "dist/publication/route-specs/*.openapi.json",
            "generated_package_id": "",
            "publication_artifact": "AudienceSurfaceRouteContract + OpenAPI spec bundle",
            "versioning_rule": "route family + semver + digest",
            "drift_gate": "Every route spec digest must match RuntimePublicationBundle and contract test fixtures.",
            "consuming_package_classes": "service_gateway; service_runtime; tooling_package",
            "source_refs": "platform-runtime-and-release-blueprint.md#Frontend and backend integration contract",
        },
        {
            "codegen_flow_id": "CFG_TYPED_API_CLIENTS",
            "contract_family": "typed_route_clients",
            "source_package_id": "pkg_api_contracts",
            "generator_package_id": "tool_codegen",
            "output_target": "packages/generated/api-clients",
            "generated_package_id": "pkg_gen_api_clients",
            "publication_artifact": "typed client bundle + generated-manifest.json",
            "versioning_rule": "inherits route contract digest",
            "drift_gate": "Generated API clients fail validation if source route contract digest or publication manifest hash changes without regeneration.",
            "consuming_package_classes": "app_shell; service_runtime; tooling_package",
            "source_refs": "platform-runtime-and-release-blueprint.md#Frontend and backend integration contract",
        },
        {
            "codegen_flow_id": "CFG_LIVE_CHANNEL_BINDINGS",
            "contract_family": "live_channel_contracts",
            "source_package_id": "pkg_live_channel_contracts",
            "generator_package_id": "tool_codegen",
            "output_target": "packages/generated/live-channel-clients",
            "generated_package_id": "pkg_gen_live_channel_clients",
            "publication_artifact": "live update binding bundle + compatibility fixtures",
            "versioning_rule": "channel contract version set + digest",
            "drift_gate": "Any live-channel contract without a generated manifest and compatibility fixture fails publication.",
            "consuming_package_classes": "app_shell; service_gateway; tooling_package",
            "source_refs": "platform-runtime-and-release-blueprint.md#LiveUpdateChannelContract",
        },
        {
            "codegen_flow_id": "CFG_EVENT_BINDINGS",
            "contract_family": "canonical_event_contracts",
            "source_package_id": "pkg_event_contracts",
            "generator_package_id": "tool_codegen",
            "output_target": "packages/generated/event-bindings",
            "generated_package_id": "pkg_gen_event_bindings",
            "publication_artifact": "event envelope bindings + schema compatibility fixtures",
            "versioning_rule": "namespace + event family + compatibility mode",
            "drift_gate": "Backward-compatibility failure or missing provenance digest blocks release verification.",
            "consuming_package_classes": "service_runtime; tooling_package",
            "source_refs": "phase-0-the-foundation-protocol.md#CanonicalEventContract",
        },
        {
            "codegen_flow_id": "CFG_DESIGN_CONTRACT_BINDINGS",
            "contract_family": "design_contract_publication",
            "source_package_id": "pkg_design_contracts",
            "generator_package_id": "tool_codegen",
            "output_target": "packages/generated/design-contract-bindings",
            "generated_package_id": "pkg_gen_design_contract_bindings",
            "publication_artifact": "DesignContractPublicationBundle + DesignContractLintVerdict + marker bindings",
            "versioning_rule": "design contract digest + token export digest",
            "drift_gate": "Blocked lint verdict, stale accessibility coverage, or marker vocabulary drift fails publication and shell write posture.",
            "consuming_package_classes": "app_shell; tooling_package",
            "source_refs": "canonical-ui-contract-kernel.md#DesignContractPublicationBundle",
        },
        {
            "codegen_flow_id": "CFG_MIGRATION_FIXTURES",
            "contract_family": "schema_migration_and_fixtures",
            "source_package_id": "pkg_migrations",
            "generator_package_id": "tool_codegen",
            "output_target": "packages/generated/migration-fixtures",
            "generated_package_id": "pkg_gen_migration_fixtures",
            "publication_artifact": "migration dry-run fixtures + compatibility window manifests",
            "versioning_rule": "migration sequence + store class digest",
            "drift_gate": "Expand-migrate-contract windows, route compatibility rows, and fixture digests must align or CI fails.",
            "consuming_package_classes": "tooling_package; service_runtime",
            "source_refs": "phase-0-the-foundation-protocol.md#0A. Delivery skeleton and repository architecture",
        },
    ]


def build_test_tooling_matrix() -> list[dict[str, Any]]:
    return [
        {
            "test_row_id": "TST_BOUNDARY_GRAPH",
            "coverage_kind": "workspace graph and boundary lint",
            "primary_toolchain": "Nx graph checks + boundary lint + export-map enforcement",
            "primary_targets": "all packages, apps, and services",
            "contract_aware": "yes",
            "blocking_gate": "yes",
            "notes": "Fails owner drift, forbidden edges, deep imports, and generated package misuse before build.",
            "source_refs": "phase-0-the-foundation-protocol.md#0A. Delivery skeleton and repository architecture",
        },
        {
            "test_row_id": "TST_UNIT_FAST",
            "coverage_kind": "unit tests",
            "primary_toolchain": "Vitest or equivalent fast TS runner",
            "primary_targets": "apps, services, domain packages, shared packages",
            "contract_aware": "partial",
            "blocking_gate": "yes",
            "notes": "Runs per-project unit suites under the Nx graph and TS project references.",
            "source_refs": "prompt/012.md",
        },
        {
            "test_row_id": "TST_ROUTE_CONTRACT",
            "coverage_kind": "sync route contract tests",
            "primary_toolchain": "generated route contract harness",
            "primary_targets": "svc_api_gateway, svc_command_api, pkg_api_contracts, pkg_gen_api_clients",
            "contract_aware": "yes",
            "blocking_gate": "yes",
            "notes": "Every published sync route must have a generated schema, typed client, and contract test.",
            "source_refs": "platform-runtime-and-release-blueprint.md#Frontend and backend integration contract",
        },
        {
            "test_row_id": "TST_EVENT_COMPAT",
            "coverage_kind": "event schema compatibility tests",
            "primary_toolchain": "event compatibility validator + generated event fixtures",
            "primary_targets": "pkg_event_contracts, pkg_gen_event_bindings, service_runtime",
            "contract_aware": "yes",
            "blocking_gate": "yes",
            "notes": "Backward compatibility is the default; breaking changes require a new published contract family.",
            "source_refs": "phase-0-the-foundation-protocol.md#CanonicalEventContract",
        },
        {
            "test_row_id": "TST_COMPONENT_A11Y",
            "coverage_kind": "component and accessibility smoke",
            "primary_toolchain": "component test runner + DOM/accessibility assertions",
            "primary_targets": "app_shell, pkg_design_system, pkg_design_contracts, pkg_accessibility_contracts",
            "contract_aware": "yes",
            "blocking_gate": "yes",
            "notes": "Uses generated design-contract bindings and accessibility coverage rows, not ad hoc selectors.",
            "source_refs": "accessibility-and-content-system-contract.md#AccessibilitySemanticCoverageProfile",
        },
        {
            "test_row_id": "TST_PLAYWRIGHT_SHELL",
            "coverage_kind": "shell-level end-to-end",
            "primary_toolchain": "Playwright",
            "primary_targets": "all baseline shells, preview environments, runtime publication markers",
            "contract_aware": "yes",
            "blocking_gate": "yes",
            "notes": "Verifies stable DOM markers, design contract digests, responsive behavior, and degraded shell posture.",
            "source_refs": "platform-frontend-blueprint.md#7.8 Verification and Playwright contract",
        },
        {
            "test_row_id": "TST_MIGRATION_DRY_RUN",
            "coverage_kind": "schema migration dry-run",
            "primary_toolchain": "migration runner + generated fixtures",
            "primary_targets": "pkg_migrations, pkg_gen_migration_fixtures, service_runtime",
            "contract_aware": "yes",
            "blocking_gate": "yes",
            "notes": "Runs expand-migrate-contract rehearsal against production-like snapshots before cutover.",
            "source_refs": "phase-0-the-foundation-protocol.md#0A. Delivery skeleton and repository architecture",
        },
        {
            "test_row_id": "TST_SUPPLY_CHAIN_RELEASE",
            "coverage_kind": "SBOM, provenance, and signed-artifact verification",
            "primary_toolchain": "release verification pipeline",
            "primary_targets": "all buildable apps and services",
            "contract_aware": "yes",
            "blocking_gate": "yes",
            "notes": "Publication parity, SBOM generation, provenance, and signature checks are mandatory release gates.",
            "source_refs": "platform-runtime-and-release-blueprint.md#CI/CD and supply-chain pipeline contract",
        },
    ]


def build_codeowners_rows(nodes: list[dict[str, Any]]) -> list[dict[str, Any]]:
    rows = []
    for node in nodes:
        rows.append(
            {
                "codeowners_row_id": f"CO_{node['package_id'].upper()}",
                "path": node["path"],
                "owner_domain_id": node["owner_domain_id"],
                "owner_domain_name": node["owner_domain_name"],
                "review_handle": node["owner_review_handle"],
                "package_tag_class": node["package_tag_class"],
                "bounded_context_ref": node["bounded_context_ref"],
                "primary_language": node["primary_language"],
                "workspace_status": node["workspace_status"],
                "approval_policy": "mandatory_owner_review",
                "protected_entrypoints": join_items(node["public_entrypoints"]),
                "source_refs": join_items(node["source_refs"]),
            }
        )
    return rows


def build_summary(
    nodes: list[dict[str, Any]],
    edges: list[dict[str, Any]],
    codegen_flows: list[dict[str, Any]],
    test_rows: list[dict[str, Any]],
    rule_count: int,
) -> dict[str, Any]:
    package_rows = [node for node in nodes if node["path"].startswith("packages/")]
    app_rows = [node for node in nodes if node["path"].startswith("apps/")]
    service_rows = [node for node in nodes if node["path"].startswith("services/")]
    conditional_apps = [node for node in app_rows if node["workspace_status"] != "baseline_required"]
    forbidden_edges = [edge for edge in edges if edge["violation_state"] == "forbidden"]
    language_counts = Counter(node["primary_language"] for node in nodes)
    tag_counts = Counter(node["package_tag_class"] for node in nodes)
    return {
        "node_count": len(nodes),
        "app_count": len(app_rows),
        "baseline_app_count": len(app_rows) - len(conditional_apps),
        "conditional_app_count": len(conditional_apps),
        "service_count": len(service_rows),
        "package_count": len(package_rows),
        "generated_contract_set_count": len(codegen_flows),
        "boundary_rule_count": rule_count,
        "owner_domain_count": len(OWNER_DOMAIN_DEFS),
        "edge_count": len(edges),
        "illegal_edge_count": len(forbidden_edges),
        "test_tooling_count": len(test_rows),
        "unresolved_gap_count": 0,
        "language_counts": dict(sorted(language_counts.items())),
        "tag_counts": dict(sorted(tag_counts.items())),
    }


def build_assumptions() -> list[dict[str, Any]]:
    return [
        {
            "record_id": "ASSUMPTION_SEQ_012_ASSISTIVE_STANDALONE_REMAINS_CONDITIONAL",
            "statement": "A standalone assistive control app remains conditional and does not enter baseline live scope until later endpoint and governance work lands.",
            "source_refs": ["03_deferred_and_conditional_scope.md", "04_surface_conflict_and_gap_report.md"],
        },
        {
            "record_id": "ASSUMPTION_SEQ_012_EMBEDDED_REUSES_PATIENT_WEB",
            "statement": "Phase 7 embedded delivery reuses the patient shell workspace rather than introducing a separate app package in the baseline.",
            "source_refs": ["04_audience_surface_inventory.md", "platform-frontend-blueprint.md#embedded is not a shell in this model"],
        },
        {
            "record_id": "ASSUMPTION_SEQ_012_TS_IS_CANONICAL_RUNTIME_LANGUAGE",
            "statement": "All browser, gateway, service, shared contract, and generated derivative code remains TypeScript unless a later ADR introduces a tightly bounded exception.",
            "source_refs": ["prompt/012.md", "platform-frontend-blueprint.md#4.1D Reference implementation shape"],
        },
    ]


def build_risks() -> list[dict[str, Any]]:
    return [
        {
            "record_id": "RISK_SEQ_012_EXPORT_MAP_DRIFT",
            "statement": "Nx tags alone are insufficient if package export maps and dependency-parity checks drift or are skipped in CI.",
            "mitigation": "Gate all merges on boundary lint, export-map checks, and validate_workspace_baseline.py.",
        },
        {
            "record_id": "RISK_SEQ_012_GENERATED_DIFF_NOISE",
            "statement": "Generated contract packages can create large diffs that obscure meaningful source changes.",
            "mitigation": "Partition generated outputs by contract family and require source digest manifests on every generated package.",
        },
        {
            "record_id": "RISK_SEQ_012_CONDITIONAL_APP_SCOPE_CREEP",
            "statement": "The conditional assistive control app could accidentally become baseline scope if its package exists without an explicit status fence.",
            "mitigation": "Keep workspace_status = conditional_future_optional and fail validation if it is treated as baseline in app counts or preview boot.",
        },
    ]


def build_bundle() -> dict[str, Any]:
    prereq_summary = ensure_prerequisites()
    surface_rows = load_csv(AUDIENCE_SURFACE_PATH)
    nodes = build_workspace_nodes(surface_rows)
    edges = build_workspace_edges(nodes)
    import_rules = build_import_rules()
    codegen_flows = build_codegen_flows()
    test_rows = build_test_tooling_matrix()
    codeowners_rows = build_codeowners_rows(nodes)
    summary = build_summary(nodes, edges, codegen_flows, test_rows, len(import_rules["rules"]))
    owner_domains = OWNER_DOMAIN_DEFS

    return {
        "workspace_baseline_id": "vecells_workspace_baseline_v1",
        "mission": MISSION,
        "source_precedence": SOURCE_PRECEDENCE,
        "upstream_inputs": prereq_summary,
        "chosen_build_system": {
            "option_id": "OPT_PNPM_NX",
            "package_manager": "pnpm",
            "workspace_orchestrator": "Nx",
            "boundary_enforcement": "project tags + export maps + graph parity validation",
            "rationale": "Strongest balance of graph law, deterministic local execution, and low accidental complexity.",
        },
        "chosen_language_posture": {
            "posture_id": "LANG_TS_RUNTIME_PY_TOOLING",
            "canonical_runtime_language": "TypeScript",
            "bounded_secondary_languages": [
                "Python in tools/analysis and tools/validators only",
                "YAML and Markdown for delivery control artifacts only",
            ],
            "forbidden_sprawl": "No Go, JVM, or Python service may own canonical runtime truth without a later explicit ADR.",
        },
        "owner_domains": owner_domains,
        "summary": summary,
        "build_system_scorecard": BUILD_SYSTEM_SCORECARD,
        "language_posture_scorecard": LANGUAGE_POSTURE_SCORECARD,
        "workspace_packages": nodes,
        "import_edges": edges,
        "import_boundary_rules": import_rules,
        "codeowners_matrix": codeowners_rows,
        "contract_codegen_flows": codegen_flows,
        "test_tooling_matrix": test_rows,
        "assumptions": build_assumptions(),
        "risks": build_risks(),
        "gaps": [],
    }


def build_workspace_tree(payload: dict[str, Any]) -> str:
    nodes = payload["workspace_packages"]
    groups: dict[str, list[str]] = defaultdict(list)
    for node in nodes:
        top = node["path"].split("/")[0]
        groups[top].append(node["path"])
    lines = ["apps/"]
    for path in sorted(groups["apps"]):
        lines.append(f"  {Path(path).name}/")
    lines.append("services/")
    for path in sorted(groups["services"]):
        lines.append(f"  {Path(path).name}/")
    lines.append("packages/")
    package_paths = sorted(path for path in groups["packages"] if not path.startswith("packages/generated/") and not path.startswith("packages/domains/"))
    for path in package_paths:
        lines.append(f"  {Path(path).name}/")
    lines.append("  domains/")
    domain_paths = sorted(path for path in groups["packages"] if path.startswith("packages/domains/"))
    for path in domain_paths:
        lines.append(f"    {Path(path).name}/")
    lines.append("  generated/")
    generated_paths = sorted(path for path in groups["packages"] if path.startswith("packages/generated/"))
    for path in generated_paths:
        lines.append(f"    {Path(path).name}/")
    lines.append("tools/")
    for path in sorted(groups["tools"]):
        lines.append(f"  {Path(path).name}/")
    lines.append("infra/")
    for path in sorted(groups["infra"]):
        lines.append(f"  {Path(path).name}/")
    lines.append("ops/")
    for path in sorted(groups["ops"]):
        lines.append(f"  {Path(path).name}/")
    return "\n".join(lines)


def render_build_system_doc(payload: dict[str, Any]) -> str:
    score_rows = [
        [
            row["label"],
            row["explicit_workspace_graph"],
            row["import_boundary_enforcement"],
            row["local_determinism_without_remote_cache"],
            row["typed_codegen_orchestration"],
            row["autonomous_agent_complexity"],
            row["total_score"],
            row["decision"],
        ]
        for row in payload["build_system_scorecard"]
    ]
    rejected = [row for row in payload["build_system_scorecard"] if row["decision"] == "rejected"]
    rejected_lines = [f"- `{row['label']}`: {row['rejection_reason']}" for row in rejected]
    return "\n".join(
        [
            "# 12 Monorepo Build System Decision",
            "",
            "Vecells now has one enforceable workspace baseline: `pnpm + Nx` with graph-tag boundary enforcement, generated CODEOWNERS, export-map restrictions, and contract-aware codegen targets.",
            "",
            "## Scorecard",
            "",
            render_table(
                ["Option", "Graph", "Boundary", "Local determinism", "Codegen", "Agent complexity", "Total", "Decision"],
                score_rows,
            ),
            "",
            "## Chosen Baseline",
            "",
            "- `pnpm` is the package manager and lockfile authority for deterministic local installs and workspace protocol references.",
            "- `Nx` is the graph authority, affected-target runner, and task orchestrator for build, lint, test, preview, codegen, and Playwright execution.",
            "- Remote cache is optional but never required for correctness; local execution must remain deterministic without it.",
            "- Export maps, boundary lint, and validator parity checks are part of the build-system contract rather than optional conventions.",
            "",
            "## Rejected Alternatives",
            "",
            *rejected_lines,
        ]
    )


def render_workspace_layout_doc(payload: dict[str, Any]) -> str:
    nodes = payload["workspace_packages"]
    class_counts = Counter(node["package_tag_class"] for node in nodes)
    class_rows = [[key, value] for key, value in sorted(class_counts.items())]
    return "\n".join(
        [
            "# 12 Workspace Layout And Boundary Rules",
            "",
            "The repo baseline now turns the Phase 0 skeleton into an explicit workspace graph: apps and services are thin shells over published domain and contract packages, every bounded context gets one owned package namespace, and generated artifacts live only in explicit `packages/generated/*` lanes.",
            "",
            "## Canonical Layout",
            "",
            "```text",
            build_workspace_tree(payload),
            "```",
            "",
            "## Package Class Counts",
            "",
            render_table(["Package tag class", "Count"], class_rows),
            "",
            "## Boundary Law",
            "",
            "- No app can own truth; browser shells consume generated clients, design contracts, and runtime publication bundles only.",
            "- Services may compose multiple domain packages, but only through published entrypoints and shared contracts.",
            "- Domain packages may depend on the shared kernel and published contracts, never sibling domain internals.",
            "- Generated packages are read-only derivatives with source digests and generator manifests.",
            "- Tools, infra, and ops artifacts may orchestrate delivery but may not silently become runtime truth owners.",
        ]
    )


def render_language_doc(payload: dict[str, Any]) -> str:
    score_rows = [
        [
            row["label"],
            row["shared_contract_types"],
            row["deterministic_schema_codegen"],
            row["runtime_validation"],
            row["cross_language_impedance"],
            row["tooling_and_analysis_fit"],
            row["polyglot_sprawl_resistance"],
            row["decision"],
        ]
        for row in payload["language_posture_scorecard"]
    ]
    return "\n".join(
        [
            "# 12 Language Standards And Allowed Toolchains",
            "",
            "The runtime and shared-workspace baseline is TypeScript-first. Python remains allowed only for bounded analysis and validator tooling; YAML and Markdown remain delivery-control artifacts, not runtime truth owners.",
            "",
            "## Language Posture Scorecard",
            "",
            render_table(
                ["Posture", "Shared contracts", "Codegen", "Validation", "Impedance", "Tooling fit", "Sprawl resistance", "Decision"],
                score_rows,
            ),
            "",
            "## TypeScript Runtime Standards",
            "",
            "- Compiler posture: strict mode, exact optional property types, unchecked index access disallowed, unknown-in-catch, composite projects, declaration output, and project references.",
            "- Contract posture: route, live-channel, and event contracts emit machine-readable schemas and generated clients from one canonical source package.",
            "- Runtime validation posture: published schemas compile to validators; ad hoc route-local parsing and hand-rolled DTO drift are forbidden.",
            "- Date and time posture: wire timestamps are explicit UTC instants; business-local schedules carry IANA timezone IDs and local calendar fields rather than ambiguous strings.",
            "- ID posture: opaque prefixed IDs and correlation IDs are typed value objects, not bare strings threaded by convention.",
            "- Numeric posture: currency, dosage, and exact-scale values serialize as strings or scaled integers; floating point arithmetic is never canonical business truth.",
            "- Error posture: structured error family, code, and recovery hints; UI or service branching on free-text messages is forbidden.",
            "",
            "## Allowed Secondary Toolchains",
            "",
            "- Python is allowed only in `tools/analysis` and `tools/validators`.",
            "- Shell scripts and YAML may bootstrap delivery or CI, but they may not own canonical contracts or state transitions.",
            "- Unbounded Go, JVM, or Python runtime services are outside the baseline and fail validation without a later explicit ADR.",
        ]
    )


def render_codegen_doc(payload: dict[str, Any]) -> str:
    rows = [
        [
            row["contract_family"],
            row["source_package_id"],
            row["generator_package_id"],
            row["generated_package_id"] or row["output_target"],
            row["publication_artifact"],
            row["drift_gate"],
        ]
        for row in payload["contract_codegen_flows"]
    ]
    return "\n".join(
        [
            "# 12 Contract Codegen And Publication Strategy",
            "",
            "Generated artifacts are reproducible and versioned, but they are never hand-maintained sources of truth. Every generated set traces back to one canonical contract package plus one generator manifest and digest.",
            "",
            "## Codegen Flows",
            "",
            render_table(
                ["Contract family", "Source package", "Generator", "Output", "Publication artifact", "Drift gate"],
                rows,
            ),
            "",
            "## Publication Law",
            "",
            "- Sync routes publish OpenAPI-style route specs and generated clients from `packages/api-contracts`.",
            "- Live channels publish versioned bindings and compatibility fixtures from `packages/live-channel-contracts`.",
            "- Canonical events publish schema compatibility fixtures from `packages/event-contracts`.",
            "- Design token exports, automation anchors, telemetry vocabulary, and accessibility coverage publish together as one design-contract bundle and lint verdict.",
            "- Migration and fixture generation stay tied to expand-migrate-contract windows and production-like snapshots.",
            "- Any generated output that cannot cite its source contract digest, generator manifest, and publication artifact fails validation.",
        ]
    )


def render_testing_doc(payload: dict[str, Any]) -> str:
    rows = [
        [
            row["coverage_kind"],
            row["primary_toolchain"],
            row["primary_targets"],
            row["contract_aware"],
            row["blocking_gate"],
        ]
        for row in payload["test_tooling_matrix"]
    ]
    return "\n".join(
        [
            "# 12 Testing Toolchain And Quality Gate Baseline",
            "",
            "The workspace now binds unit, contract, accessibility, Playwright, migration, and supply-chain checks into one graph-aware quality ladder. Route, event, design, and release tuples are verified by publication-aware tests rather than by convention.",
            "",
            "## Test Matrix",
            "",
            render_table(
                ["Coverage kind", "Toolchain", "Primary targets", "Contract aware", "Blocking gate"],
                rows,
            ),
            "",
            "## Gate Order",
            "",
            "1. Boundary and ownership checks.",
            "2. Typecheck and unit suites for affected projects.",
            "3. Route and event contract compatibility suites.",
            "4. Component and accessibility smoke on affected shells and design packages.",
            "5. Playwright shell verification on previewable surfaces.",
            "6. Migration dry-run rehearsal and supply-chain verification before release widening.",
        ]
    )


def render_dx_doc(payload: dict[str, Any]) -> str:
    return "\n".join(
        [
            "# 12 Developer Experience And Local Bootstrap",
            "",
            "Phase 0 requires one-command startup, preview rendering, and deterministic contract regeneration. The workspace baseline therefore makes local bootstrap a first-class graph target rather than a sidecar script collection.",
            "",
            "## Canonical Commands",
            "",
            "```bash",
            "pnpm bootstrap        # install, validate env, and regenerate generated packages",
            "pnpm dev              # boot the local topology: shells, gateway, services, workers, simulators",
            "pnpm check            # format, lint, typecheck, boundary validation, unit + contract tests",
            "pnpm codegen          # regenerate route, event, live-channel, design, and fixture artifacts",
            "pnpm test:e2e         # Playwright shell verification against local preview",
            "pnpm verify:release   # build, contract parity, migration dry-run, SBOM/provenance checks",
            "```",
            "",
            "## Local Bootstrap Law",
            "",
            "- `tools/dev-bootstrap` owns environment loading, secret presence checks, simulator wiring, and local service choreography.",
            "- Preview environments are graph targets, not bespoke shell scripts per app.",
            "- Generated packages must be reproducible from source contracts in local and CI flows.",
            "- Secrets, credentials, and provider-specific values are injected at runtime and never committed to source or generated artifacts.",
        ]
    )


def render_boundary_doc(payload: dict[str, Any]) -> str:
    rules = payload["import_boundary_rules"]["rules"]
    rule_rows = [
        [
            row["rule_id"],
            row["description"],
            join_items(row.get("from_tag_classes", row.get("applies_to_tag_classes", []))),
            join_items(row.get("forbid_to_tag_classes", [])),
        ]
        for row in rules
    ]
    owner_rows = [
        [owner["owner_domain_name"], owner["review_handle"], owner["color"]]
        for owner in OWNER_DOMAIN_DEFS
    ]
    return "\n".join(
        [
            "# 12 Import Boundary And Codeowners Policy",
            "",
            "Package ownership and boundary law are now machine-checkable. The repo no longer relies on naming conventions or reviewer memory to stop shells, adapters, or admin code from becoming hidden truth owners.",
            "",
            "## Import Boundary Rules",
            "",
            render_table(["Rule", "Description", "Applies from", "Forbidden targets"], rule_rows),
            "",
            "## Owner Domains",
            "",
            render_table(["Owner domain", "Review handle", "Atlas color"], owner_rows),
            "",
            "## CODEOWNERS Baseline",
            "",
            "- Every `apps/*`, `services/*`, `packages/*`, `tools/*`, `infra/*`, and `ops/*` path maps to exactly one owner domain.",
            "- CODEOWNERS is generated from `codeowners_matrix.csv`; manual drift is treated as configuration debt and must fail validation.",
            "- Public entrypoints are limited by package export maps so cross-context code cannot deep import `/src/*`, `/internal/*`, `/workers/*`, or `/repositories/*` paths.",
        ]
    )


def atlas_payload(payload: dict[str, Any]) -> dict[str, Any]:
    return {
        "baseline_id": payload["workspace_baseline_id"],
        "summary": payload["summary"],
        "nodes": payload["workspace_packages"],
        "edges": payload["import_edges"],
        "codegen_flows": payload["contract_codegen_flows"],
        "test_rows": payload["test_tooling_matrix"],
        "owner_domains": payload["owner_domains"],
        "node_columns": [{"column_id": key, "label": label} for key, label in NODE_COLUMNS],
    }


def render_atlas_html(payload: dict[str, Any]) -> str:
    data_json = json.dumps(atlas_payload(payload)).replace("</", "<\\/")
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Vecells Workspace Graph Atlas</title>
  <link rel="icon" href="data:,">
  <style>
    :root {{
      --bg: #eef2f5;
      --shell: #f7f9fb;
      --panel: #ffffff;
      --ink: #16212a;
      --muted: #566575;
      --line: #d1dae2;
      --accent: #145d7a;
      --accent-soft: rgba(20, 93, 122, 0.1);
      --warn: #a06814;
      --danger: #a24337;
      --success: #2d6f4a;
      --shadow: 0 12px 30px rgba(20, 33, 43, 0.08);
      --radius: 18px;
      --focus: 2px solid #145d7a;
      --rail: 280px;
      --max: 1440px;
    }}
    * {{ box-sizing: border-box; }}
    html, body {{
      margin: 0;
      padding: 0;
      background: linear-gradient(180deg, #f4f7fa 0%, #eef2f5 100%);
      color: var(--ink);
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }}
    body {{ min-height: 100vh; }}
    button, select, input {{ font: inherit; color: inherit; }}
    button {{
      cursor: pointer;
      border: 1px solid var(--line);
      background: var(--panel);
      border-radius: 12px;
    }}
    select, input {{
      width: 100%;
      min-height: 42px;
      border: 1px solid var(--line);
      border-radius: 12px;
      background: var(--panel);
      padding: 0 12px;
    }}
    :focus-visible {{
      outline: var(--focus);
      outline-offset: 2px;
    }}
    .shell {{
      max-width: var(--max);
      margin: 0 auto;
      padding: 24px 32px 40px;
      display: grid;
      gap: 24px;
      grid-template-columns: var(--rail) minmax(0, 1fr);
    }}
    .panel {{
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
    }}
    .nav {{
      position: sticky;
      top: 20px;
      align-self: start;
      display: grid;
      gap: 16px;
    }}
    .nav .panel, .main .panel {{ padding: 20px; }}
    .brand {{
      display: flex;
      gap: 14px;
      align-items: center;
      min-height: 72px;
    }}
    .brand strong {{
      display: block;
      font-size: 16px;
      line-height: 22px;
    }}
    .brand span {{
      display: block;
      color: var(--muted);
      font-size: 13px;
      line-height: 20px;
    }}
    .filters {{
      display: grid;
      gap: 10px;
    }}
    .filters label {{
      display: grid;
      gap: 6px;
      color: var(--muted);
      font-size: 13px;
      line-height: 18px;
    }}
    .nav h2, .panel h2 {{
      margin: 0 0 12px;
      font-size: 18px;
      line-height: 24px;
    }}
    .small-copy {{
      color: var(--muted);
      font-size: 13px;
      line-height: 20px;
    }}
    .main {{
      display: grid;
      gap: 20px;
    }}
    .hero {{
      display: grid;
      gap: 16px;
      grid-template-columns: minmax(0, 1.3fr) minmax(320px, 0.7fr);
    }}
    .hero h1 {{
      margin: 0 0 10px;
      font-size: 30px;
      line-height: 36px;
      font-weight: 650;
    }}
    .hero p {{
      margin: 0;
      color: var(--muted);
      font-size: 14px;
      line-height: 22px;
    }}
    .stats {{
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
    }}
    .stat {{
      padding: 14px;
      border-radius: 16px;
      background: linear-gradient(180deg, rgba(20, 93, 122, 0.08), rgba(255, 255, 255, 0.96));
      border: 1px solid rgba(20, 93, 122, 0.14);
    }}
    .stat strong {{
      display: block;
      font-size: 26px;
      line-height: 30px;
    }}
    .stat span {{
      display: block;
      color: var(--muted);
      font-size: 13px;
      line-height: 18px;
    }}
    .studio {{
      display: grid;
      gap: 20px;
      grid-template-columns: minmax(0, 1.55fr) minmax(320px, 0.45fr);
    }}
    .canvas-card {{
      display: grid;
      gap: 16px;
    }}
    .canvas-head {{
      display: flex;
      justify-content: space-between;
      gap: 16px;
      align-items: flex-start;
    }}
    .canvas-head h2 {{
      margin: 0 0 6px;
    }}
    .graph-wrap {{
      position: relative;
      border: 1px solid var(--line);
      border-radius: 18px;
      background: linear-gradient(180deg, #f9fbfd 0%, #f3f7fa 100%);
      padding: 18px;
      min-height: 560px;
      overflow: auto;
    }}
    .graph-overlay {{
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      overflow: visible;
    }}
    .lanes {{
      position: relative;
      display: grid;
      gap: 16px;
      grid-template-columns: repeat(5, minmax(210px, 1fr));
      min-width: 1150px;
      z-index: 1;
    }}
    .lane {{
      display: grid;
      gap: 12px;
      align-content: start;
    }}
    .lane h3 {{
      margin: 0;
      font-size: 13px;
      line-height: 18px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--muted);
    }}
    .node-list {{
      display: grid;
      gap: 10px;
    }}
    .node {{
      display: grid;
      gap: 6px;
      width: 100%;
      padding: 12px;
      text-align: left;
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.94);
      position: relative;
    }}
    .node::before {{
      content: "";
      position: absolute;
      inset: 0 auto 0 0;
      width: 4px;
      border-radius: 14px 0 0 14px;
      background: var(--node-color, var(--accent));
    }}
    .node.selected {{
      border-color: var(--accent);
      box-shadow: 0 0 0 2px rgba(20, 93, 122, 0.12);
      transform: translateY(-1px);
    }}
    .node small {{
      color: var(--muted);
      font-size: 11px;
      line-height: 16px;
    }}
    .chips {{
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }}
    .chip {{
      display: inline-flex;
      align-items: center;
      min-height: 24px;
      padding: 0 10px;
      border-radius: 999px;
      border: 1px solid rgba(20, 93, 122, 0.12);
      background: rgba(20, 93, 122, 0.06);
      color: var(--muted);
      font-size: 11px;
      line-height: 16px;
    }}
    .chip.warn {{
      border-color: rgba(160, 104, 20, 0.18);
      background: rgba(160, 104, 20, 0.08);
      color: var(--warn);
    }}
    .chip.bad {{
      border-color: rgba(162, 67, 55, 0.2);
      background: rgba(162, 67, 55, 0.08);
      color: var(--danger);
    }}
    .chip.good {{
      border-color: rgba(45, 111, 74, 0.18);
      background: rgba(45, 111, 74, 0.08);
      color: var(--success);
    }}
    .inspector, .subgrid {{
      display: grid;
      gap: 16px;
    }}
    .subgrid {{
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }}
    .detail-list {{
      display: grid;
      gap: 10px;
    }}
    .detail-row {{
      border: 1px solid var(--line);
      border-radius: 14px;
      padding: 12px;
      background: var(--shell);
    }}
    .detail-row strong {{
      display: block;
      font-size: 13px;
      line-height: 18px;
      margin-bottom: 4px;
    }}
    .detail-row span {{
      display: block;
      color: var(--muted);
      font-size: 12px;
      line-height: 18px;
    }}
    table {{
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      line-height: 18px;
    }}
    th, td {{
      padding: 10px 12px;
      border-bottom: 1px solid var(--line);
      text-align: left;
      vertical-align: top;
    }}
    th {{
      color: var(--muted);
      font-size: 11px;
      line-height: 16px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }}
    .tables {{
      display: grid;
      gap: 20px;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    }}
    .legend {{
      display: grid;
      gap: 8px;
    }}
    .legend-row {{
      display: flex;
      gap: 10px;
      align-items: center;
      color: var(--muted);
      font-size: 12px;
      line-height: 18px;
    }}
    .swatch {{
      width: 12px;
      height: 12px;
      border-radius: 999px;
      background: var(--swatch);
      flex: none;
    }}
    .edge-path {{
      fill: none;
      stroke-width: 2;
      opacity: 0.9;
    }}
    .edge-path.allowed {{
      stroke: rgba(20, 93, 122, 0.34);
    }}
    .edge-path.forbidden {{
      stroke: rgba(162, 67, 55, 0.75);
      stroke-dasharray: 7 6;
    }}
    .edge-label {{
      color: var(--muted);
      font-size: 11px;
      line-height: 16px;
    }}
    @media (max-width: 1180px) {{
      .shell {{
        grid-template-columns: 1fr;
      }}
      .nav {{
        position: static;
      }}
      .hero, .studio, .tables {{
        grid-template-columns: 1fr;
      }}
    }}
    @media (max-width: 900px) {{
      .graph-wrap {{
        min-height: auto;
        overflow: visible;
      }}
      .graph-overlay {{
        display: none;
      }}
      .lanes {{
        min-width: 0;
        grid-template-columns: 1fr;
      }}
    }}
    @media (max-width: 760px) {{
      .shell {{
        padding: 16px;
      }}
      .stats {{
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }}
      .subgrid {{
        grid-template-columns: 1fr;
      }}
    }}
    @media (prefers-reduced-motion: reduce) {{
      * {{
        scroll-behavior: auto !important;
        transition: none !important;
      }}
    }}
  </style>
</head>
<body>
  <div class="shell" data-testid="atlas-shell" data-selected-package="" data-selected-owner="" data-selected-language="" data-selected-edge-class="" data-selected-violation-state="">
    <aside class="nav" data-testid="nav-rail">
      <section class="panel brand">
        <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true">
          <rect x="2" y="2" width="40" height="40" rx="14" fill="#145d7a"></rect>
          <path d="M12 15h6.5l3.7 7.2 3.8-7.2H32l-7 14h-5.6z" fill="#f8fbfd"></path>
        </svg>
        <div>
          <strong>Vecells Workspace Graph Studio</strong>
          <span>Enforceable monorepo ownership, contract generation, and boundary law.</span>
        </div>
      </section>
      <section class="panel">
        <h2>Filters</h2>
        <div class="filters">
          <label>
            Search
            <input id="search-input" data-testid="search-input" type="search" placeholder="Package path or owner">
          </label>
          <label>
            Package Tag
            <select id="filter-tag" data-testid="filter-tag"></select>
          </label>
          <label>
            Owner Domain
            <select id="filter-owner" data-testid="filter-owner"></select>
          </label>
          <label>
            Language
            <select id="filter-language" data-testid="filter-language"></select>
          </label>
          <label>
            Context
            <select id="filter-context" data-testid="filter-context"></select>
          </label>
          <label>
            Violation State
            <select id="filter-violation" data-testid="filter-violation"></select>
          </label>
        </div>
      </section>
      <section class="panel">
        <h2>Legend</h2>
        <div id="legend" class="legend"></div>
      </section>
      <section class="panel small-copy">
        Forbidden edges are shown as dashed red paths and listed in the evidence table. Generated packages remain derivative only and must trace back to source contract digests.
      </section>
    </aside>
    <main class="main">
      <section class="panel hero" data-testid="hero-strip">
        <div>
          <h1>Workspace Baseline</h1>
          <p>
            `pnpm + Nx` is the graph and delivery baseline. TypeScript is the canonical runtime language for apps, services, contracts, and shared packages; Python remains bounded to architecture analysis and validators only.
          </p>
        </div>
        <div class="stats" id="hero-stats"></div>
      </section>
      <section class="studio">
        <section class="panel canvas-card">
          <div class="canvas-head">
            <div>
              <h2>Workspace Graph</h2>
              <p class="small-copy">Owner-colored nodes, allowed edges, and explicit violation examples. The canvas prefers the currently selected node so the graph stays readable.</p>
            </div>
            <div id="selection-state" data-testid="selection-state" class="chips"></div>
          </div>
          <div class="graph-wrap" data-testid="graph-canvas">
            <svg id="graph-overlay" class="graph-overlay" aria-hidden="true"></svg>
            <div id="lanes" class="lanes"></div>
          </div>
          <div class="tables">
            <section class="panel">
              <h2>Edge Evidence</h2>
              <table data-testid="edge-table">
                <thead>
                  <tr>
                    <th>From</th>
                    <th>To</th>
                    <th>Class</th>
                    <th>State</th>
                  </tr>
                </thead>
                <tbody id="edge-table-body"></tbody>
              </table>
            </section>
            <section class="panel">
              <h2>Codegen Flows</h2>
              <table data-testid="contract-panel">
                <thead>
                  <tr>
                    <th>Family</th>
                    <th>Source</th>
                    <th>Output</th>
                    <th>Gate</th>
                  </tr>
                </thead>
                <tbody id="codegen-table-body"></tbody>
              </table>
            </section>
          </div>
        </section>
        <aside class="inspector">
          <section class="panel" data-testid="package-inspector">
            <h2>Package Inspector</h2>
            <div id="package-inspector-body" class="detail-list"></div>
          </section>
          <section class="panel" data-testid="test-panel">
            <h2>Quality Gates</h2>
            <div id="test-panel-body" class="detail-list"></div>
          </section>
        </aside>
      </section>
    </main>
  </div>
  <script id="atlas-data" type="application/json">{data_json}</script>
  <script>
    const DATA = JSON.parse(document.getElementById("atlas-data").textContent);
    const root = document.querySelector("[data-testid='atlas-shell']");
    const controls = {{
      search: document.getElementById("search-input"),
      tag: document.getElementById("filter-tag"),
      owner: document.getElementById("filter-owner"),
      language: document.getElementById("filter-language"),
      context: document.getElementById("filter-context"),
      violation: document.getElementById("filter-violation"),
    }};
    const state = {{
      search: "",
      tag: "all",
      owner: "all",
      language: "all",
      context: "all",
      violation: "all",
      selectedPackageId: DATA.nodes.find((node) => node.package_id === "svc_command_api")?.package_id || DATA.nodes[0].package_id,
      selectedEdgeClass: "all",
    }};

    const byId = new Map(DATA.nodes.map((node) => [node.package_id, node]));
    const ownerById = new Map(DATA.owner_domains.map((owner) => [owner.owner_domain_id, owner]));
    const laneEls = document.getElementById("lanes");
    const overlay = document.getElementById("graph-overlay");
    const selectionState = document.getElementById("selection-state");
    const edgeTableBody = document.getElementById("edge-table-body");
    const inspectorBody = document.getElementById("package-inspector-body");
    const codegenBody = document.getElementById("codegen-table-body");
    const testBody = document.getElementById("test-panel-body");
    const heroStats = document.getElementById("hero-stats");
    const legend = document.getElementById("legend");

    function uniqueValues(key) {{
      return Array.from(new Set(DATA.nodes.map((node) => node[key]).filter(Boolean))).sort();
    }}

    function populateSelect(select, items, labelFn = (value) => value) {{
      select.innerHTML = "";
      const all = document.createElement("option");
      all.value = "all";
      all.textContent = "All";
      select.appendChild(all);
      for (const item of items) {{
        const option = document.createElement("option");
        option.value = item;
        option.textContent = labelFn(item);
        select.appendChild(option);
      }}
    }}

    populateSelect(controls.tag, uniqueValues("package_tag_class"), (value) => value.replaceAll("_", " "));
    populateSelect(controls.owner, DATA.owner_domains.map((owner) => owner.owner_domain_id), (value) => ownerById.get(value).owner_domain_name);
    populateSelect(controls.language, uniqueValues("primary_language"));
    populateSelect(controls.context, uniqueValues("bounded_context_ref"), (value) => value.replaceAll("_", " "));
    populateSelect(controls.violation, ["allowed", "forbidden"]);

    function stat(label, value) {{
      const wrapper = document.createElement("div");
      wrapper.className = "stat";
      wrapper.innerHTML = `<strong>${{value}}</strong><span>${{label}}</span>`;
      return wrapper;
    }}

    heroStats.append(
      stat("Apps", DATA.summary.app_count),
      stat("Services", DATA.summary.service_count),
      stat("Packages", DATA.summary.package_count),
      stat("Generated sets", DATA.summary.generated_contract_set_count),
      stat("Illegal edges", DATA.summary.illegal_edge_count),
      stat("Unresolved gaps", DATA.summary.unresolved_gap_count),
    );

    for (const owner of DATA.owner_domains) {{
      const row = document.createElement("div");
      row.className = "legend-row";
      row.innerHTML = `<span class="swatch" style="--swatch:${{owner.color}}"></span><span>${{owner.owner_domain_name}}</span>`;
      legend.appendChild(row);
    }}
    for (const extra of [
      ["Allowed edge", "rgba(20, 93, 122, 0.34)"],
      ["Forbidden edge", "rgba(162, 67, 55, 0.75)"],
    ]) {{
      const row = document.createElement("div");
      row.className = "legend-row";
      row.innerHTML = `<span class="swatch" style="--swatch:${{extra[1]}}"></span><span>${{extra[0]}}</span>`;
      legend.appendChild(row);
    }}

    function matchesNode(node) {{
      const term = state.search.trim().toLowerCase();
      if (state.tag !== "all" && node.package_tag_class !== state.tag) return false;
      if (state.owner !== "all" && node.owner_domain_id !== state.owner) return false;
      if (state.language !== "all" && node.primary_language !== state.language) return false;
      if (state.context !== "all" && node.bounded_context_ref !== state.context) return false;
      if (!term) return true;
      return [node.display_name, node.path, node.owner_domain_name, node.bounded_context_ref].join(" ").toLowerCase().includes(term);
    }}

    function visibleNodes() {{
      return DATA.nodes.filter(matchesNode);
    }}

    function relevantEdges(visibleIds) {{
      const selected = state.selectedPackageId;
      let rows = DATA.edges.filter((edge) => visibleIds.has(edge.from_package_id) && visibleIds.has(edge.to_package_id));
      if (state.violation !== "all") {{
        rows = rows.filter((edge) => edge.violation_state === state.violation);
      }}
      if (selected && visibleIds.has(selected)) {{
        const selectedRows = rows.filter((edge) => edge.from_package_id === selected || edge.to_package_id === selected);
        if (selectedRows.length > 0) {{
          rows = selectedRows;
        }}
      }}
      return rows;
    }}

    function chip(text, kind = "") {{
      const el = document.createElement("span");
      el.className = `chip${{kind ? ` ${{kind}}` : ""}}`;
      el.textContent = text;
      return el;
    }}

    function renderInspector(node, edges) {{
      inspectorBody.innerHTML = "";
      const incoming = edges.filter((edge) => edge.to_package_id === node.package_id);
      const outgoing = edges.filter((edge) => edge.from_package_id === node.package_id);
      const blocks = [
        ["Path", node.path],
        ["Owner", `${{node.owner_domain_name}} (${{node.owner_review_handle}})`],
        ["Class", node.package_tag_class.replaceAll("_", " ")],
        ["Language", `${{node.primary_language}} · ${{node.language_posture}}`],
        ["Truth role", node.truth_role.replaceAll("_", " ")],
        ["Status", node.workspace_status.replaceAll("_", " ")],
        ["Context", node.bounded_context_ref.replaceAll("_", " ")],
        ["Public entrypoints", node.public_entrypoints.join(", ")],
        ["Surfaces", node.surface_refs.length ? node.surface_refs.join(", ") : "None"],
        ["Routes", node.route_family_refs.length ? node.route_family_refs.join(", ") : "None"],
        ["Notes", node.notes],
        ["Incoming / outgoing", `${{incoming.length}} / ${{outgoing.length}}`],
      ];
      for (const [label, value] of blocks) {{
        const row = document.createElement("div");
        row.className = "detail-row";
        row.innerHTML = `<strong>${{label}}</strong><span>${{value}}</span>`;
        inspectorBody.appendChild(row);
      }}
    }}

    function renderTestPanel() {{
      testBody.innerHTML = "";
      for (const row of DATA.test_rows) {{
        const el = document.createElement("div");
        el.className = "detail-row";
        const gateClass = row.blocking_gate === "yes" ? "good" : "warn";
        el.appendChild(chip(row.coverage_kind, gateClass));
        el.innerHTML += `<strong>${{row.primary_toolchain}}</strong><span>${{row.primary_targets}}</span><span>${{row.notes}}</span>`;
        testBody.appendChild(el);
      }}
    }}

    function renderCodegenTable() {{
      codegenBody.innerHTML = "";
      for (const row of DATA.codegen_flows) {{
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${{row.contract_family}}</td><td>${{row.source_package_id}}</td><td>${{row.generated_package_id || row.output_target}}</td><td>${{row.drift_gate}}</td>`;
        codegenBody.appendChild(tr);
      }}
    }}

    function renderSelectionChips(node, edges) {{
      selectionState.innerHTML = "";
      selectionState.append(
        chip(`package:${{node.package_id}}`, "good"),
        chip(`owner:${{node.owner_domain_id}}`),
        chip(`lang:${{node.primary_language}}`),
        chip(`edge-class:${{state.selectedEdgeClass}}`),
        chip(`visible-edges:${{edges.length}}`, edges.some((edge) => edge.violation_state === "forbidden") ? "bad" : "good"),
      );
      root.dataset.selectedPackage = node.package_id;
      root.dataset.selectedOwner = node.owner_domain_id;
      root.dataset.selectedLanguage = node.primary_language;
      root.dataset.selectedEdgeClass = state.selectedEdgeClass;
      root.dataset.selectedViolationState = state.violation;
    }}

    function renderEdgeTable(edges) {{
      edgeTableBody.innerHTML = "";
      for (const edge of edges) {{
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${{edge.from_package_id}}</td>
          <td>${{edge.to_package_id}}</td>
          <td>${{edge.edge_class}}</td>
          <td>${{edge.violation_state}}</td>
        `;
        edgeTableBody.appendChild(tr);
      }}
    }}

    function laneFor(columnId, nodes) {{
      const lane = document.createElement("section");
      lane.className = "lane";
      lane.dataset.columnId = columnId;
      const heading = document.createElement("h3");
      const column = DATA.node_columns.find((item) => item.column_id === columnId);
      heading.textContent = column.label;
      lane.appendChild(heading);
      const list = document.createElement("div");
      list.className = "node-list";
      for (const node of nodes) {{
        const button = document.createElement("button");
        button.type = "button";
        button.className = "node" + (node.package_id === state.selectedPackageId ? " selected" : "");
        button.dataset.nodeId = node.package_id;
        button.style.setProperty("--node-color", node.owner_color);
        const surfaceCopy = node.surface_refs.length ? `${{node.surface_refs.length}} surfaces` : node.workspace_status.replaceAll("_", " ");
        button.innerHTML = `
          <strong>${{node.display_name}}</strong>
          <small>${{node.path}}</small>
          <div class="chips">
            <span class="chip">${{node.package_tag_class.replaceAll("_", " ")}}</span>
            <span class="chip">${{node.primary_language}}</span>
            <span class="chip">${{surfaceCopy}}</span>
          </div>
        `;
        button.addEventListener("click", () => {{
          state.selectedPackageId = node.package_id;
          render();
        }});
        list.appendChild(button);
      }}
      lane.appendChild(list);
      return lane;
    }}

    function drawEdges(edges) {{
      overlay.innerHTML = "";
      const wrap = document.querySelector(".graph-wrap");
      const wrapRect = wrap.getBoundingClientRect();
      overlay.setAttribute("viewBox", `0 0 ${{wrap.scrollWidth}} ${{wrap.scrollHeight}}`);
      if (window.innerWidth < 900) {{
        return;
      }}
      for (const edge of edges.slice(0, 24)) {{
        const fromEl = wrap.querySelector(`[data-node-id="${{edge.from_package_id}}"]`);
        const toEl = wrap.querySelector(`[data-node-id="${{edge.to_package_id}}"]`);
        if (!fromEl || !toEl) continue;
        const fromRect = fromEl.getBoundingClientRect();
        const toRect = toEl.getBoundingClientRect();
        const sx = fromRect.left - wrapRect.left + fromRect.width;
        const sy = fromRect.top - wrapRect.top + fromRect.height / 2;
        const tx = toRect.left - wrapRect.left;
        const ty = toRect.top - wrapRect.top + toRect.height / 2;
        const midX = sx + (tx - sx) / 2;
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", `M ${{sx}} ${{sy}} C ${{midX}} ${{sy}}, ${{midX}} ${{ty}}, ${{tx}} ${{ty}}`);
        path.setAttribute("class", `edge-path ${{edge.violation_state}}`);
        overlay.appendChild(path);
      }}
    }}

    function render() {{
      const visible = visibleNodes();
      const visibleIds = new Set(visible.map((node) => node.package_id));
      if (!visibleIds.has(state.selectedPackageId)) {{
        state.selectedPackageId = visible[0]?.package_id || DATA.nodes[0].package_id;
      }}
      const selectedNode = byId.get(state.selectedPackageId);
      const edges = relevantEdges(visibleIds);

      laneEls.innerHTML = "";
      for (const column of DATA.node_columns) {{
        const rows = visible.filter((node) => node.atlas_column === column.column_id);
        laneEls.appendChild(laneFor(column.column_id, rows));
      }}

      renderInspector(selectedNode, edges);
      renderSelectionChips(selectedNode, edges);
      renderEdgeTable(edges);
      drawEdges(edges);
    }}

    renderCodegenTable();
    renderTestPanel();
    for (const [key, control] of Object.entries(controls)) {{
      control.addEventListener(key === "search" ? "input" : "change", (event) => {{
        state[key] = event.target.value || "all";
        if (key === "search") {{
          state.search = event.target.value;
        }}
        render();
      }});
    }}
    window.addEventListener("resize", () => drawEdges(relevantEdges(new Set(visibleNodes().map((node) => node.package_id)))));
    render();
  </script>
</body>
</html>
"""


def main() -> None:
    payload = build_bundle()
    write_csv(BUILD_SCORECARD_PATH, payload["build_system_scorecard"])
    write_csv(LANGUAGE_MATRIX_PATH, payload["language_posture_scorecard"])
    write_json(WORKSPACE_GRAPH_PATH, payload)
    write_json(IMPORT_RULES_PATH, payload["import_boundary_rules"])
    write_csv(CODEOWNERS_PATH, payload["codeowners_matrix"])
    write_csv(CODEGEN_MATRIX_PATH, payload["contract_codegen_flows"])
    write_csv(TEST_TOOLING_PATH, payload["test_tooling_matrix"])

    write_text(BUILD_DECISION_DOC_PATH, render_build_system_doc(payload))
    write_text(WORKSPACE_LAYOUT_DOC_PATH, render_workspace_layout_doc(payload))
    write_text(LANGUAGE_DOC_PATH, render_language_doc(payload))
    write_text(CODEGEN_DOC_PATH, render_codegen_doc(payload))
    write_text(TESTING_DOC_PATH, render_testing_doc(payload))
    write_text(DX_DOC_PATH, render_dx_doc(payload))
    write_text(BOUNDARY_DOC_PATH, render_boundary_doc(payload))
    write_text(ATLAS_HTML_PATH, render_atlas_html(payload))


if __name__ == "__main__":
    main()
