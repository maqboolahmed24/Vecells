#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from textwrap import dedent
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DOCS_DIR = ROOT / "docs" / "tests"
DATA_TEST_DIR = ROOT / "data" / "test"
DATA_ANALYSIS_DIR = ROOT / "data" / "analysis"
PLAYWRIGHT_DIR = ROOT / "tests" / "playwright"

SUITE_DOC_PATH = DOCS_DIR / "136_shell_accessibility_preview_smoke_suite.md"
PREVIEW_MATRIX_DOC_PATH = DOCS_DIR / "136_preview_environment_shell_matrix.md"
ACCESSIBILITY_MATRIX_DOC_PATH = DOCS_DIR / "136_accessibility_semantic_coverage_matrix.md"
ATLAS_PATH = DOCS_DIR / "136_shell_conformance_atlas.html"

PREVIEW_CASES_PATH = DATA_TEST_DIR / "136_preview_shell_cases.csv"
ACCESSIBILITY_CASES_PATH = DATA_TEST_DIR / "136_accessibility_cases.csv"
SMOKE_EXPECTATIONS_PATH = DATA_TEST_DIR / "136_shell_smoke_expectations.json"
SUITE_RESULTS_PATH = DATA_TEST_DIR / "136_preview_environment_suite_results.json"

PERSISTENT_SHELL_CONTRACTS_PATH = DATA_ANALYSIS_DIR / "persistent_shell_contracts.json"
SHELL_TOPOLOGY_BREAKPOINT_MATRIX_PATH = DATA_ANALYSIS_DIR / "shell_topology_breakpoint_matrix.csv"
SELECTED_ANCHOR_POLICY_PATH = DATA_ANALYSIS_DIR / "selected_anchor_policy_matrix.csv"
ROUTE_ADJACENCY_PATH = DATA_ANALYSIS_DIR / "route_adjacency_matrix.csv"
RESTORE_ORDER_PATH = DATA_ANALYSIS_DIR / "navigation_restore_order_matrix.csv"
ROUTE_RESIDENCY_PATH = DATA_ANALYSIS_DIR / "shell_route_residency_map.json"
SHELL_OWNERSHIP_MATRIX_PATH = DATA_ANALYSIS_DIR / "shell_family_ownership_matrix.csv"
PREVIEW_MANIFEST_PATH = DATA_ANALYSIS_DIR / "preview_environment_manifest.json"
ACCESSIBILITY_PROFILES_PATH = DATA_ANALYSIS_DIR / "accessibility_semantic_coverage_profiles.json"
FRONTEND_ACCESSIBILITY_PATH = DATA_ANALYSIS_DIR / "frontend_accessibility_and_automation_profiles.json"
AUDIENCE_SURFACE_BINDINGS_PATH = DATA_ANALYSIS_DIR / "audience_surface_runtime_bindings.json"

PATIENT_ROUTE_CONTRACT_PATH = DATA_ANALYSIS_DIR / "patient_route_contract_seed.csv"
STAFF_ROUTE_CONTRACT_PATH = DATA_ANALYSIS_DIR / "staff_route_contract_seed.csv"
OPERATIONS_ROUTE_CONTRACT_PATH = DATA_ANALYSIS_DIR / "operations_route_contract_seed.csv"
HUB_ROUTE_CONTRACT_PATH = DATA_ANALYSIS_DIR / "hub_route_contract_seed.csv"
GOVERNANCE_ROUTE_CONTRACT_PATH = DATA_ANALYSIS_DIR / "governance_route_contract_seed.csv"
PHARMACY_ROUTE_CONTRACT_PATH = DATA_ANALYSIS_DIR / "pharmacy_route_contract_seed.csv"

PATIENT_MOCK_PATH = DATA_ANALYSIS_DIR / "patient_mock_projection_examples.json"
STAFF_MOCK_PATH = DATA_ANALYSIS_DIR / "staff_mock_projection_examples.json"
OPERATIONS_MOCK_PATH = DATA_ANALYSIS_DIR / "operations_mock_projection_examples.json"
HUB_MOCK_PATH = DATA_ANALYSIS_DIR / "hub_mock_projection_examples.json"
GOVERNANCE_MOCK_PATH = DATA_ANALYSIS_DIR / "governance_mock_projection_examples.json"
PHARMACY_MOCK_PATH = DATA_ANALYSIS_DIR / "pharmacy_mock_projection_examples.json"

TASK_ID = "seq_136"
VISUAL_MODE = "Shell_Conformance_Atlas"

SOURCE_PRECEDENCE = [
    "prompt/136.md",
    "prompt/shared_operating_contract_136_to_145.md",
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "blueprint/phase-cards.md#card-1-mandatory-phase-0-tests",
    "blueprint/platform-frontend-blueprint.md#PersistentShell",
    "blueprint/platform-frontend-blueprint.md#SelectedAnchor",
    "blueprint/platform-frontend-blueprint.md#RouteContinuityEvidenceContract",
    "blueprint/patient-portal-experience-architecture-blueprint.md",
    "blueprint/staff-operations-and-support-blueprint.md",
    "blueprint/operations-console-frontend-blueprint.md",
    "blueprint/governance-admin-console-frontend-blueprint.md",
    "blueprint/pharmacy-console-frontend-architecture.md",
    "blueprint/phase-0-the-foundation-protocol.md",
    "blueprint/forensic-audit-findings.md",
    "data/analysis/persistent_shell_contracts.json",
    "data/analysis/preview_environment_manifest.json",
    "data/analysis/accessibility_semantic_coverage_profiles.json",
    "data/analysis/frontend_accessibility_and_automation_profiles.json",
    "data/analysis/audience_surface_runtime_bindings.json",
    "data/analysis/selected_anchor_policy_matrix.csv",
    "data/analysis/route_adjacency_matrix.csv",
    "data/analysis/navigation_restore_order_matrix.csv",
    "data/analysis/shell_topology_breakpoint_matrix.csv",
    "data/analysis/patient_route_contract_seed.csv",
    "data/analysis/staff_route_contract_seed.csv",
    "data/analysis/operations_route_contract_seed.csv",
    "data/analysis/hub_route_contract_seed.csv",
    "data/analysis/governance_route_contract_seed.csv",
    "data/analysis/pharmacy_route_contract_seed.csv",
]

FAILURE_CLASS_CATALOG = [
    {
        "failureClass": "landmark_failure",
        "summary": "Shell landmarks or heading hierarchy fail whole-surface accessibility proof.",
    },
    {
        "failureClass": "focus_order_failure",
        "summary": "Keyboard traversal or focus restore breaks selected-anchor or same-shell law.",
    },
    {
        "failureClass": "continuity_failure",
        "summary": "Same-shell continuity, selected-anchor preservation, or recovery-in-place truth breaks.",
    },
    {
        "failureClass": "publication_tuple_failure",
        "summary": "Preview/runtime/publication/accessibility tuple is not exact, so smoke proof is withheld.",
    },
    {
        "failureClass": "responsive_fold_failure",
        "summary": "Compact or reflow posture forks the IA or breaks the same shell.",
    },
    {
        "failureClass": "reduced_motion_failure",
        "summary": "Reduced-motion posture changes semantic outcome instead of only changing animation.",
    },
    {
        "failureClass": "diagram_parity_failure",
        "summary": "Visual proof carries meaning that is not repeated in adjacent tables or textual parity.",
    },
]

SHELL_FAMILY_CONFIG = {
    "patient": {
        "shellSlug": "patient-web",
        "accent": "#2F6FED",
        "ownerRef": "team_patient_web",
        "previewEnvironmentRef": "pev_branch_patient_care",
        "routeContractPath": PATIENT_ROUTE_CONTRACT_PATH,
        "mockPath": PATIENT_MOCK_PATH,
        "audienceSurfaceRef": "audsurf_patient_authenticated_portal",
        "playwrightProofRef": "tests/playwright/patient-shell-seed-routes.spec.js",
        "docsRef": "docs/architecture/115_patient_shell_seed_routes.md",
        "galleryRef": "docs/architecture/115_patient_shell_gallery.html",
        "launchPath": "/home",
        "suppressionPath": "/home/embedded",
        "appDir": "apps/patient-web",
        "rootTestId": "patient-shell-root",
        "primaryRouteFamilyRef": "rf_patient_home",
        "embeddedRouteFamilyRef": "rf_patient_embedded_channel",
        "previewSharedRouteFamilies": {
            "rf_patient_home",
            "rf_patient_appointments",
            "rf_patient_health_record",
            "rf_patient_messages",
            "rf_patient_embedded_channel",
        },
    },
    "staff": {
        "shellSlug": "clinical-workspace",
        "accent": "#117A55",
        "ownerRef": "team_clinical_hub",
        "previewEnvironmentRef": "pev_branch_clinical_hub",
        "routeContractPath": STAFF_ROUTE_CONTRACT_PATH,
        "mockPath": STAFF_MOCK_PATH,
        "audienceSurfaceRef": "audsurf_clinical_workspace",
        "playwrightProofRef": "tests/playwright/staff-shell-seed-routes.spec.js",
        "docsRef": "docs/architecture/116_staff_shell_seed_routes.md",
        "galleryRef": "docs/architecture/116_staff_shell_gallery.html",
        "launchPath": "/workspace",
        "suppressionPath": "/workspace/task/task-412/decision",
        "appDir": "apps/clinical-workspace",
        "rootTestId": "staff-shell-root",
        "primaryRouteFamilyRef": "rf_staff_workspace",
        "previewSharedRouteFamilies": set(),
    },
    "operations": {
        "shellSlug": "ops-console",
        "accent": "#B7791F",
        "ownerRef": "team_ops_console",
        "previewEnvironmentRef": "pev_branch_ops_control",
        "routeContractPath": OPERATIONS_ROUTE_CONTRACT_PATH,
        "mockPath": OPERATIONS_MOCK_PATH,
        "audienceSurfaceRef": "audsurf_operations_console",
        "playwrightProofRef": "tests/playwright/operations-shell-seed-routes.spec.js",
        "docsRef": "docs/architecture/117_operations_shell_seed_routes.md",
        "galleryRef": "docs/architecture/117_operations_shell_gallery.html",
        "launchPath": "/ops/overview",
        "suppressionPath": "/ops/compare",
        "appDir": "apps/ops-console",
        "rootTestId": "ops-shell-root",
        "primaryRouteFamilyRef": "rf_operations_board",
        "previewSharedRouteFamilies": {"rf_operations_drilldown"},
    },
    "hub": {
        "shellSlug": "hub-desk",
        "accent": "#9B4D16",
        "ownerRef": "team_clinical_hub",
        "previewEnvironmentRef": "pev_branch_clinical_hub",
        "routeContractPath": HUB_ROUTE_CONTRACT_PATH,
        "mockPath": HUB_MOCK_PATH,
        "audienceSurfaceRef": "audsurf_hub_desk",
        "playwrightProofRef": "tests/playwright/hub-shell-seed-routes.spec.js",
        "docsRef": "docs/architecture/118_hub_shell_seed_routes.md",
        "galleryRef": "docs/architecture/118_hub_shell_gallery.html",
        "launchPath": "/hub/queue",
        "suppressionPath": "/hub/exceptions",
        "appDir": "apps/hub-desk",
        "rootTestId": "hub-shell-root",
        "primaryRouteFamilyRef": "rf_hub_queue",
        "previewSharedRouteFamilies": {"rf_hub_queue"},
    },
    "governance": {
        "shellSlug": "governance-console",
        "accent": "#5B61F6",
        "ownerRef": "team_governance_admin",
        "previewEnvironmentRef": "pev_rc_governance_audit",
        "routeContractPath": GOVERNANCE_ROUTE_CONTRACT_PATH,
        "mockPath": GOVERNANCE_MOCK_PATH,
        "audienceSurfaceRef": "audsurf_governance_admin",
        "playwrightProofRef": "tests/playwright/governance-shell-seed-routes.spec.js",
        "docsRef": "docs/architecture/119_governance_shell_seed_routes.md",
        "galleryRef": "docs/architecture/119_governance_shell_gallery.html",
        "launchPath": "/ops/governance",
        "suppressionPath": "/ops/governance/compliance",
        "appDir": "apps/governance-console",
        "rootTestId": "governance-shell-root",
        "primaryRouteFamilyRef": "rf_governance_shell",
        "previewSharedRouteFamilies": set(),
    },
    "pharmacy": {
        "shellSlug": "pharmacy-console",
        "accent": "#0F766E",
        "ownerRef": "team_pharmacy_console",
        "previewEnvironmentRef": "pev_rc_pharmacy_dispatch",
        "routeContractPath": PHARMACY_ROUTE_CONTRACT_PATH,
        "mockPath": PHARMACY_MOCK_PATH,
        "audienceSurfaceRef": "audsurf_pharmacy_console",
        "playwrightProofRef": "tests/playwright/pharmacy-shell-seed-routes.spec.js",
        "docsRef": "docs/architecture/120_pharmacy_shell_seed_routes.md",
        "galleryRef": "docs/architecture/120_pharmacy_shell_gallery.html",
        "launchPath": "/workspace/pharmacy",
        "suppressionPath": "/workspace/pharmacy/PHC-2103/assurance",
        "appDir": "apps/pharmacy-console",
        "rootTestId": "pharmacy-shell-root",
        "primaryRouteFamilyRef": "rf_pharmacy_console",
        "previewSharedRouteFamilies": set(),
    },
}

def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def require(condition: bool, message: str) -> None:
    if not condition:
        raise RuntimeError(message)


def load_json(path: Path) -> Any:
    require(path.exists(), f"PREREQUISITE_GAP_136_MISSING::{path.name}")
    return json.loads(path.read_text(encoding="utf-8"))


def load_csv(path: Path) -> list[dict[str, str]]:
    require(path.exists(), f"PREREQUISITE_GAP_136_MISSING::{path.name}")
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def write_csv(path: Path, rows: list[dict[str, Any]], fieldnames: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n", encoding="utf-8")


def unique(values: list[str]) -> list[str]:
    return list(dict.fromkeys(value for value in values if value))


def markdown_table(headers: list[str], rows: list[list[str]]) -> str:
    def escape(value: str) -> str:
        return value.replace("|", "\\|")

    output = [
        "| " + " | ".join(escape(header) for header in headers) + " |",
        "| " + " | ".join("---" for _ in headers) + " |",
    ]
    for row in rows:
        output.append("| " + " | ".join(escape(cell) for cell in row) + " |")
    return "\n".join(output)


def normalize_patient_rows(rows: list[dict[str, str]]) -> list[dict[str, str]]:
    output: list[dict[str, str]] = []
    for row in rows:
        output.append(
            {
                "routeKey": row["route_key"],
                "routeFamilyRef": row["route_family_ref"],
                "path": row["path"],
                "routeKind": row["route_key"],
                "selectedAnchorPolicy": row["selected_anchor_key"],
                "dominantAction": row["dominant_action"],
                "summary": row["return_safe_rule"],
            }
        )
    return output


def normalize_staff_rows(rows: list[dict[str, str]]) -> list[dict[str, str]]:
    output: list[dict[str, str]] = []
    for row in rows:
        route_key = row["route_kind"].replace("-", "_")
        output.append(
            {
                "routeKey": route_key,
                "routeFamilyRef": row["route_family_ref"],
                "path": row["route_path"],
                "routeKind": row["route_kind"],
                "selectedAnchorPolicy": row["selected_anchor_policy"],
                "dominantAction": row["dominant_action"],
                "summary": row["continuity_posture"],
            }
        )
    return output


def normalize_operations_rows(rows: list[dict[str, str]]) -> list[dict[str, str]]:
    output: list[dict[str, str]] = []
    for row in rows:
        child = row["childRouteKind"].strip()
        route_key = row["lens"] if not child else f"{row['lens']}_{child}"
        output.append(
            {
                "routeKey": route_key,
                "routeFamilyRef": row["routeFamilyRef"],
                "path": row["path"],
                "routeKind": child or "resident",
                "selectedAnchorPolicy": row["selectedAnchorPolicy"],
                "dominantAction": row["lens"],
                "summary": row["summary"],
            }
        )
    return output


def normalize_hub_rows(rows: list[dict[str, str]]) -> list[dict[str, str]]:
    output: list[dict[str, str]] = []
    for row in rows:
        route_key = row["viewMode"]
        output.append(
            {
                "routeKey": route_key,
                "routeFamilyRef": row["routeFamilyRef"],
                "path": row["path"],
                "routeKind": row["viewMode"],
                "selectedAnchorPolicy": row["selectedAnchorPolicy"],
                "dominantAction": row["viewMode"],
                "summary": row["summary"],
            }
        )
    return output


def normalize_governance_rows(rows: list[dict[str, str]]) -> list[dict[str, str]]:
    output: list[dict[str, str]] = []
    for row in rows:
        output.append(
            {
                "routeKey": row["route_key"],
                "routeFamilyRef": row["continuity_key"] and "rf_governance_shell" or "rf_governance_shell",
                "path": row["route_path"],
                "routeKind": row["cluster"],
                "selectedAnchorPolicy": row["selected_anchor_policy"],
                "dominantAction": row["cluster"],
                "summary": row["summary"],
            }
        )
    return output


def normalize_pharmacy_rows(rows: list[dict[str, str]]) -> list[dict[str, str]]:
    output: list[dict[str, str]] = []
    for row in rows:
        output.append(
            {
                "routeKey": row["routeKey"],
                "routeFamilyRef": row["routeFamilyRef"],
                "path": row["path"],
                "routeKind": row["routeKey"],
                "selectedAnchorPolicy": row["selectedAnchorPolicy"],
                "dominantAction": row["routeKey"],
                "summary": row["summary"],
            }
        )
    return output


NORMALIZERS = {
    "patient": normalize_patient_rows,
    "staff": normalize_staff_rows,
    "operations": normalize_operations_rows,
    "hub": normalize_hub_rows,
    "governance": normalize_governance_rows,
    "pharmacy": normalize_pharmacy_rows,
}


def preferred_binding_row(
    rows: list[dict[str, Any]],
    shell_slug: str,
    audience_surface_ref: str,
) -> dict[str, Any]:
    require(rows, "PREREQUISITE_GAP_136_BINDING_ROW_MISSING")
    exact_match = [
        row
        for row in rows
        if row.get("shellSlug") == shell_slug and row.get("audienceSurface") == audience_surface_ref
    ]
    if exact_match:
        return exact_match[0]
    shell_rows = [row for row in rows if row.get("shellSlug") == shell_slug]
    if len(shell_rows) == 1:
        return shell_rows[0]
    non_assistive = [
        row for row in shell_rows if "assistive" not in (row.get("audienceSurface", "") or "")
    ]
    if non_assistive:
        return non_assistive[0]
    return rows[0]


def topology_for_case(shell_family: str, route_kind: str, route_family_ref: str) -> str:
    if shell_family == "patient":
        if route_family_ref == "rf_patient_embedded_channel":
            return "embedded_strip"
        return "focus_frame"
    if shell_family == "staff":
        if route_kind in {"more-info", "decision", "approvals", "escalations", "search"}:
            return "three_plane"
        return "two_plane"
    if shell_family == "operations":
        return "three_plane" if route_kind != "resident" else "two_plane"
    if shell_family == "hub":
        return "two_plane"
    if shell_family == "governance":
        return "three_plane"
    return "two_plane"


def stale_behavior_for_case(
    binding_state: str,
    calm_truth_state: str,
    preview_state: str,
    route_freeze_refs: list[str],
) -> str:
    if binding_state == "blocked":
        return "Fail closed in place and preserve a same-shell summary floor."
    if binding_state == "recovery_only":
        return "Hold the user inside the same shell with recovery-only posture and explicit continuity context."
    if preview_state in {"drifted", "expired"}:
        return "Downgrade to read-only or reset-required shell posture with fail-closed preview banner."
    if calm_truth_state == "suppressed" or route_freeze_refs:
        return "Suppress calm or writable posture and keep summary-first review inside the same shell."
    return "Permit governed live posture."


def preview_mode_for_case(route_family_ref: str, preview_env: dict[str, Any], shared_refs: set[str]) -> str:
    if route_family_ref in preview_env.get("routeFamilyRefs", []):
        return "direct_preview_bundle"
    if route_family_ref in shared_refs:
        return "shared_shell_preview_only"
    return "preview_gap"


def smoke_failure_classes(
    binding_state: str,
    preview_state: str,
    preview_mode: str,
    frontend_access_state: str,
) -> list[str]:
    failures: list[str] = []
    if (
        binding_state != "publishable_live"
        or preview_state != "ready"
        or preview_mode != "direct_preview_bundle"
        or frontend_access_state != "complete"
    ):
        failures.append("publication_tuple_failure")
    return failures


def smoke_verdict(failure_classes: list[str]) -> str:
    return "pass" if not failure_classes else "withheld"


def accessibility_verdict(frontend_access_state: str) -> str:
    if frontend_access_state == "complete":
        return "pass"
    if frontend_access_state == "blocked":
        return "blocked"
    return "guarded"


def compact_reflow_expectation(compact_topology: str) -> str:
    if compact_topology == "mission_stack":
        return "400% reflow must stay in the same shell using mission_stack rather than a new IA."
    return "Compact reflow must preserve the declared shell topology without detached routes."


def load_and_verify_upstream_payloads() -> dict[str, Any]:
    payloads = {
        "persistentShellContracts": load_json(PERSISTENT_SHELL_CONTRACTS_PATH),
        "previewManifest": load_json(PREVIEW_MANIFEST_PATH),
        "accessibilityProfiles": load_json(ACCESSIBILITY_PROFILES_PATH),
        "frontendAccessibilityProfiles": load_json(FRONTEND_ACCESSIBILITY_PATH),
        "audienceBindings": load_json(AUDIENCE_SURFACE_BINDINGS_PATH),
        "routeResidency": load_json(ROUTE_RESIDENCY_PATH),
    }
    require(
        payloads["persistentShellContracts"].get("task_id") == "par_106",
        "PREREQUISITE_GAP_136_TASK_DRIFT::persistent_shell_contracts.json",
    )
    require(
        payloads["previewManifest"].get("task_id") == "par_092",
        "PREREQUISITE_GAP_136_TASK_DRIFT::preview_environment_manifest.json",
    )
    require(
        payloads["audienceBindings"].get("task_id") == "seq_130",
        "PREREQUISITE_GAP_136_TASK_DRIFT::audience_surface_runtime_bindings.json",
    )
    require(
        payloads["accessibilityProfiles"].get("harness_task_id") == "par_111",
        "PREREQUISITE_GAP_136_ACCESSIBILITY_HARNESS_DRIFT",
    )
    require(
        payloads["frontendAccessibilityProfiles"].get("routeProfiles"),
        "PREREQUISITE_GAP_136_FRONTEND_ACCESSIBILITY_PROFILES_MISSING",
    )
    return payloads


def build_case_payload() -> dict[str, Any]:
    payloads = load_and_verify_upstream_payloads()
    persistent_shell_contracts = payloads["persistentShellContracts"]
    preview_manifest = payloads["previewManifest"]
    accessibility_profiles = payloads["accessibilityProfiles"]
    frontend_accessibility_profiles = payloads["frontendAccessibilityProfiles"]
    audience_bindings = payloads["audienceBindings"]
    route_residency = payloads["routeResidency"]["routes"]

    breakpoint_rows = load_csv(SHELL_TOPOLOGY_BREAKPOINT_MATRIX_PATH)
    selected_anchor_rows = load_csv(SELECTED_ANCHOR_POLICY_PATH)
    adjacency_rows = load_csv(ROUTE_ADJACENCY_PATH)
    restore_rows = load_csv(RESTORE_ORDER_PATH)
    shell_ownership_rows = load_csv(SHELL_OWNERSHIP_MATRIX_PATH)

    shells_by_slug = {
        row["shellSlug"]: row for row in persistent_shell_contracts["shells"]
    }
    ownership_by_slug = {row["shell_slug"]: row for row in shell_ownership_rows}

    preview_env_by_ref = {
        row["previewEnvironmentRef"]: row for row in preview_manifest["preview_environments"]
    }
    preview_env_by_owner = {
        row["ownerRef"]: row for row in preview_manifest["preview_environments"]
    }
    accessibility_by_route = {
        row["routeFamilyRef"]: row for row in accessibility_profiles["accessibilitySemanticCoverageProfiles"]
    }
    frontend_accessibility_by_route = {
        row["routeFamilyRef"]: row for row in frontend_accessibility_profiles["routeProfiles"]
    }

    bindings_by_route: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in audience_bindings["surfaceAuthorityRows"]:
        bindings_by_route[row["routeFamilyRef"]].append(row)

    breakpoint_lookup: dict[str, dict[str, str]] = defaultdict(dict)
    for row in breakpoint_rows:
        breakpoint_lookup[row["shell_slug"]][row["breakpoint"]] = row["resolved_topology"]

    selected_anchor_lookup = {row["route_family_ref"]: row for row in selected_anchor_rows}
    adjacency_lookup: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in adjacency_rows:
        adjacency_lookup[row["from_route_family_ref"]].append(row)
    restore_lookup: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in restore_rows:
        restore_lookup[row["route_family_ref"]].append(row)

    preview_case_rows: list[dict[str, Any]] = []
    accessibility_case_rows: list[dict[str, Any]] = []
    family_result_rows: list[dict[str, Any]] = []
    live_sweep_rows: list[dict[str, Any]] = []

    for family, config in SHELL_FAMILY_CONFIG.items():
        shell_slug = config["shellSlug"]
        shell_contract = shells_by_slug[shell_slug]
        ownership_row = ownership_by_slug[shell_slug]
        preview_env = preview_env_by_ref.get(config["previewEnvironmentRef"]) or preview_env_by_owner[config["ownerRef"]]
        route_rows = NORMALIZERS[family](load_csv(config["routeContractPath"]))
        mock_payload = load_json(config["mockPath"])
        mock_examples = mock_payload.get("examples", [])

        family_preview_rows: list[dict[str, Any]] = []
        family_accessibility_rows: list[dict[str, Any]] = []

        for index, route_row in enumerate(route_rows, start=1):
            route_family_ref = route_row["routeFamilyRef"]
            binding_row = preferred_binding_row(
                bindings_by_route[route_family_ref],
                shell_slug,
                config["audienceSurfaceRef"],
            )
            route_profile = frontend_accessibility_by_route[route_family_ref]
            accessibility_profile = accessibility_by_route[route_family_ref]
            selected_anchor_row = selected_anchor_lookup.get(route_family_ref)
            restore_order = " > ".join(
                row["step_key"] for row in sorted(restore_lookup.get(route_family_ref, []), key=lambda item: int(item["order"]))
            )
            adjacency_types = unique(
                [row["adjacency_type"] for row in adjacency_lookup.get(route_family_ref, [])]
            )
            compact_topology = breakpoint_lookup[shell_slug].get("xs", shell_contract["defaultTopology"])
            desktop_topology = breakpoint_lookup[shell_slug].get("lg", shell_contract["defaultTopology"])
            expected_topology = topology_for_case(
                family,
                route_row["routeKind"],
                route_family_ref,
            )
            preview_mode = preview_mode_for_case(
                route_family_ref,
                preview_env,
                config["previewSharedRouteFamilies"],
            )
            smoke_failures = smoke_failure_classes(
                binding_row["bindingState"],
                preview_env["state"],
                preview_mode,
                route_profile["accessibilityCoverageState"],
            )
            route_residency_row = route_residency.get(route_family_ref, {})
            continuity_summary = " ; ".join(
                unique(
                    [
                        route_row["selectedAnchorPolicy"],
                        selected_anchor_row["restore_order"] if selected_anchor_row else "",
                        restore_order,
                        ", ".join(adjacency_types),
                        route_residency_row.get("continuity_key", ""),
                    ]
                )
            )
            route_freeze_refs = binding_row.get("routeFreezeDispositionRefs") or []
            release_recovery_refs = binding_row.get("releaseRecoveryDispositionRefs") or []
            smoke_case_id = f"SCV_136_{family.upper()}_{index:03d}_V1"
            proof_refs = [
                config["playwrightProofRef"],
                config["docsRef"],
                config["galleryRef"],
                "tests/playwright/136_shell_accessibility_preview_smoke.spec.js",
            ]
            preview_row = {
                "caseId": smoke_case_id,
                "shellFamily": family,
                "shellSlug": shell_slug,
                "routeKey": route_row["routeKey"],
                "routeFamilyRef": route_family_ref,
                "path": route_row["path"],
                "previewEnvironmentRef": preview_env["previewEnvironmentRef"],
                "previewEnvironmentState": preview_env["state"],
                "previewDriftState": preview_env["driftState"],
                "previewEligibility": preview_mode,
                "expectedTopology": expected_topology,
                "compactTopology": compact_topology,
                "desktopTopology": desktop_topology,
                "continuityRequirements": continuity_summary,
                "selectedAnchorPolicy": route_row["selectedAnchorPolicy"],
                "restoreOrder": restore_order or "anchor > scroll > disclosure > focus",
                "accessibilityProfileRef": accessibility_profile["accessibilitySemanticCoverageProfileId"],
                "frontendAccessibilityCoverageState": route_profile["accessibilityCoverageState"],
                "bindingState": binding_row["bindingState"],
                "calmTruthState": binding_row["calmTruthState"],
                "writableTruthState": binding_row["writableTruthState"],
                "routeFreezeDispositionRefs": "|".join(route_freeze_refs),
                "releaseRecoveryDispositionRefs": "|".join(release_recovery_refs),
                "smokeVerdict": smoke_verdict(smoke_failures),
                "failureClasses": "|".join(smoke_failures),
                "staleBehavior": stale_behavior_for_case(
                    binding_row["bindingState"],
                    binding_row["calmTruthState"],
                    preview_env["state"],
                    route_freeze_refs,
                ),
                "proofRefs": "|".join(proof_refs),
            }
            accessibility_row = {
                "caseId": smoke_case_id.replace("SCV_", "ACV_"),
                "shellFamily": family,
                "shellSlug": shell_slug,
                "routeKey": route_row["routeKey"],
                "routeFamilyRef": route_family_ref,
                "path": route_row["path"],
                "landmarkExpectation": "banner + main + one route-local heading hierarchy",
                "headingExpectation": "one h1 with no heading-level jumps larger than one",
                "keyboardModel": route_profile["keyboardModel"],
                "focusTransitionContractCount": len(accessibility_profile["focusTransitionContractRefs"]),
                "announcementContractCount": len(accessibility_profile["assistiveAnnouncementContractRefs"]),
                "tableParityExpectation": "Every diagram or visual summary must repeat meaning in adjacent textual or tabular form.",
                "reducedMotionExpectation": "Reduced-motion must preserve the same semantic result with non-positional transitions.",
                "responsiveExpectation": compact_reflow_expectation(compact_topology),
                "coverageState": route_profile["accessibilityCoverageState"],
                "accessibilityVerdict": accessibility_verdict(route_profile["accessibilityCoverageState"]),
                "failureClasses": "",
                "proofRefs": "|".join(
                    unique(
                        proof_refs
                        + [
                            "tests/playwright/accessibility-semantic-coverage.spec.js",
                            "docs/architecture/111_accessibility_harness.html",
                        ]
                    )
                ),
            }
            preview_case_rows.append(preview_row)
            accessibility_case_rows.append(accessibility_row)
            family_preview_rows.append(preview_row)
            family_accessibility_rows.append(accessibility_row)

        family_smoke_failures = Counter()
        for row in family_preview_rows:
            for failure in row["failureClasses"].split("|"):
                if failure:
                    family_smoke_failures[failure] += 1

        family_smoke_verdict = "pass" if not family_smoke_failures else "withheld"
        family_accessibility_states = Counter(
            row["accessibilityVerdict"] for row in family_accessibility_rows
        )
        route_family_refs = unique([row["routeFamilyRef"] for row in family_preview_rows])
        binding_states = unique([row["bindingState"] for row in family_preview_rows])
        preview_modes = unique([row["previewEligibility"] for row in family_preview_rows])
        compact_topology = breakpoint_lookup[shell_slug].get("xs", shell_contract["defaultTopology"])
        family_result_rows.append(
            {
                "shellFamily": family,
                "shellSlug": shell_slug,
                "shellLabel": shell_contract["displayName"],
                "accent": config["accent"],
                "audienceSurfaceRef": config["audienceSurfaceRef"],
                "previewEnvironmentRef": preview_env["previewEnvironmentRef"],
                "previewEnvironmentState": preview_env["state"],
                "previewDriftState": preview_env["driftState"],
                "routeFamilyRefs": route_family_refs,
                "routeCount": len(family_preview_rows),
                "bindingStates": binding_states,
                "previewModes": preview_modes,
                "smokeVerdict": family_smoke_verdict,
                "smokeFailureClasses": sorted(family_smoke_failures.keys()),
                "accessibilityVerdict": "pass"
                if set(family_accessibility_states.keys()) == {"pass"}
                else "guarded",
                "accessibilityStates": dict(family_accessibility_states),
                "compactTopology": compact_topology,
                "desktopTopology": breakpoint_lookup[shell_slug].get("lg", shell_contract["defaultTopology"]),
                "defaultTopology": shell_contract["defaultTopology"],
                "allowedTopologies": shell_contract["allowedTopologies"],
                "missionStackSupported": compact_topology == "mission_stack",
                "embeddedCompatible": family == "patient",
                "suppressionRoutePath": config["suppressionPath"],
                "proofRefs": [
                    config["playwrightProofRef"],
                    config["docsRef"],
                    config["galleryRef"],
                    "docs/architecture/92_preview_environment_control_room.html",
                    "docs/architecture/111_accessibility_harness.html",
                    "tests/playwright/136_shell_accessibility_preview_smoke.spec.js",
                ],
                "previewOwnerRef": preview_env["ownerRef"],
                "previewSeedPackRef": preview_env["seedPackRef"],
                "browserAccessRules": [rule["ruleRef"] for rule in preview_manifest["browser_access_rules"]],
                "selectedAnchorRouteFamilyCount": sum(
                    1 for ref in route_family_refs if ref in selected_anchor_lookup
                ),
                "supportRegionBudget": ownership_row["support_region_budget"],
            }
        )
        live_sweep_rows.append(
            {
                "shellFamily": family,
                "shellSlug": shell_slug,
                "appDir": config["appDir"],
                "launchPath": config["launchPath"],
                "suppressionPath": config["suppressionPath"],
                "rootTestId": config["rootTestId"],
                "previewEnvironmentRef": preview_env["previewEnvironmentRef"],
                "expectedCompactTopology": compact_topology,
                "expectedHeadingLabel": shell_contract["displayName"],
                "proofRefs": [
                    config["playwrightProofRef"],
                    "tests/playwright/136_shell_accessibility_preview_smoke.spec.js",
                ],
            }
        )

    smoke_failure_counts = Counter()
    for row in preview_case_rows:
        for failure in row["failureClasses"].split("|"):
            if failure:
                smoke_failure_counts[failure] += 1

    family_failures = [row for row in family_result_rows if row["smokeVerdict"] != "pass"]
    summary = {
        "shell_family_count": len(family_result_rows),
        "preview_shell_case_count": len(preview_case_rows),
        "accessibility_case_count": len(accessibility_case_rows),
        "direct_preview_case_count": sum(
            1 for row in preview_case_rows if row["previewEligibility"] == "direct_preview_bundle"
        ),
        "shared_preview_case_count": sum(
            1 for row in preview_case_rows if row["previewEligibility"] == "shared_shell_preview_only"
        ),
        "preview_gap_case_count": sum(
            1 for row in preview_case_rows if row["previewEligibility"] == "preview_gap"
        ),
        "mission_stack_case_count": sum(
            1 for row in preview_case_rows if row["compactTopology"] == "mission_stack"
        ),
        "embedded_case_count": sum(
            1 for row in preview_case_rows if row["expectedTopology"] == "embedded_strip"
        ),
        "suppressed_shell_count": len(family_failures),
        "smoke_pass_count": sum(1 for row in preview_case_rows if row["smokeVerdict"] == "pass"),
        "smoke_withheld_count": sum(1 for row in preview_case_rows if row["smokeVerdict"] != "pass"),
        "accessibility_pass_count": sum(
            1 for row in accessibility_case_rows if row["accessibilityVerdict"] == "pass"
        ),
        "accessibility_guarded_count": sum(
            1 for row in accessibility_case_rows if row["accessibilityVerdict"] == "guarded"
        ),
        "accessibility_blocked_count": sum(
            1 for row in accessibility_case_rows if row["accessibilityVerdict"] == "blocked"
        ),
        "failure_class_counts": dict(smoke_failure_counts),
        "preview_environment_refs": [row["previewEnvironmentRef"] for row in family_result_rows],
    }

    suite_results = {
        "task_id": TASK_ID,
        "generated_at": now_iso(),
        "captured_on": now_iso()[:10],
        "visual_mode": VISUAL_MODE,
        "source_precedence": SOURCE_PRECEDENCE,
        "suiteVerdict": "release_withheld",
        "summary": summary,
        "failureClassCatalog": FAILURE_CLASS_CATALOG,
        "prerequisite_gaps": [],
        "shellFamilyResults": family_result_rows,
        "smokeResults": preview_case_rows,
        "accessibilityResults": accessibility_case_rows,
        "liveSweepCases": live_sweep_rows,
    }

    smoke_expectations = {
        "task_id": TASK_ID,
        "visual_mode": VISUAL_MODE,
        "generated_at": suite_results["generated_at"],
        "summary": {
            "shell_family_count": len(family_result_rows),
            "route_case_count": len(preview_case_rows),
            "failing_shell_count": len(family_failures),
        },
        "failureClassCatalog": FAILURE_CLASS_CATALOG,
        "shellFamilies": family_result_rows,
        "liveSweepCases": live_sweep_rows,
        "proofRefs": unique(
            [
                "tests/playwright/136_shell_accessibility_preview_smoke.spec.js",
                "tests/playwright/accessibility-semantic-coverage.spec.js",
                "tests/playwright/preview-environment-control-room.spec.js",
            ]
            + [
                config["playwrightProofRef"]
                for config in SHELL_FAMILY_CONFIG.values()
            ]
        ),
    }

    return {
        "suiteResults": suite_results,
        "smokeExpectations": smoke_expectations,
        "previewCases": preview_case_rows,
        "accessibilityCases": accessibility_case_rows,
        "familyResults": family_result_rows,
    }


def build_suite_doc(payload: dict[str, Any]) -> str:
    suite_results = payload["suiteResults"]
    family_results = payload["familyResults"]
    summary = suite_results["summary"]
    shell_table = markdown_table(
        [
            "Shell",
            "Preview environment",
            "Smoke verdict",
            "Accessibility",
            "Compact topology",
            "Failure classes",
        ],
        [
            [
                row["shellLabel"],
                f"{row['previewEnvironmentRef']} ({row['previewEnvironmentState']})",
                row["smokeVerdict"],
                row["accessibilityVerdict"],
                row["compactTopology"],
                ", ".join(row["smokeFailureClasses"]) or "none",
            ]
            for row in family_results
        ],
    )
    failure_table = markdown_table(
        ["Failure class", "Summary"],
        [[row["failureClass"], row["summary"]] for row in FAILURE_CLASS_CATALOG],
    )
    return dedent(
        f"""
        # 136 Shell Accessibility, Preview, and Smoke Suite

        `seq_136` creates one authoritative Phase 0 shell-proof harness that binds the patient, staff, operations, hub, governance, and pharmacy seed shells to the current preview, publication, accessibility, and continuity ceiling.

        Current suite verdict: `release_withheld`

        Summary:
        - shell families covered: `{summary['shell_family_count']}`
        - preview shell cases: `{summary['preview_shell_case_count']}`
        - accessibility cases: `{summary['accessibility_case_count']}`
        - failing shells: `{summary['suppressed_shell_count']}`
        - smoke pass count: `{summary['smoke_pass_count']}`
        - smoke withheld count: `{summary['smoke_withheld_count']}`
        - mission-stack-covered cases: `{summary['mission_stack_case_count']}`
        - embedded-compatible cases: `{summary['embedded_case_count']}`

        Why the suite is withheld:
        - The current audience-surface runtime bindings from `seq_130` still publish no `publishable_live` rows for the seeded shells.
        - Preview smoke is governed by tuple truth, so pages that load in simulator-backed preview but only carry `partial`, `recovery_only`, or `blocked` bindings remain withheld.
        - The suite still proves same-shell continuity, mission-stack folding, embedded-compatible posture, reduced-motion coherence, and table parity, but it does not rewrite the release ceiling.

        ## Shell Verdict Matrix

        {shell_table}

        ## Failure Classification Law

        {failure_table}

        ## Proof Inputs

        - `data/analysis/persistent_shell_contracts.json`
        - `data/analysis/preview_environment_manifest.json`
        - `data/analysis/accessibility_semantic_coverage_profiles.json`
        - `data/analysis/frontend_accessibility_and_automation_profiles.json`
        - `data/analysis/audience_surface_runtime_bindings.json`
        - `tests/playwright/patient-shell-seed-routes.spec.js`
        - `tests/playwright/staff-shell-seed-routes.spec.js`
        - `tests/playwright/operations-shell-seed-routes.spec.js`
        - `tests/playwright/hub-shell-seed-routes.spec.js`
        - `tests/playwright/governance-shell-seed-routes.spec.js`
        - `tests/playwright/pharmacy-shell-seed-routes.spec.js`
        - `tests/playwright/accessibility-semantic-coverage.spec.js`
        - `tests/playwright/preview-environment-control-room.spec.js`
        - `tests/playwright/136_shell_accessibility_preview_smoke.spec.js`
        """
    ).strip()


def build_preview_matrix_doc(payload: dict[str, Any]) -> str:
    preview_cases = payload["previewCases"]
    table = markdown_table(
        [
            "Shell",
            "Route key",
            "Path",
            "Preview",
            "Eligibility",
            "Binding",
            "Smoke",
            "Stale behavior",
        ],
        [
            [
                row["shellFamily"],
                row["routeKey"],
                row["path"],
                f"{row['previewEnvironmentRef']} / {row['previewEnvironmentState']}",
                row["previewEligibility"],
                row["bindingState"],
                row["smokeVerdict"],
                row["staleBehavior"],
            ]
            for row in preview_cases
        ],
    )
    return dedent(
        f"""
        # 136 Preview Environment Shell Matrix

        This matrix names, for every seeded shell route, the preview environment it binds to now, whether that binding is direct or only shared at the shell level, and the smoke verdict that follows from the current publication tuple.

        {table}
        """
    ).strip()


def build_accessibility_matrix_doc(payload: dict[str, Any]) -> str:
    accessibility_cases = payload["accessibilityCases"]
    table = markdown_table(
        [
            "Shell",
            "Route family",
            "Keyboard model",
            "Focus contracts",
            "Coverage state",
            "Verdict",
            "Responsive expectation",
        ],
        [
            [
                row["shellFamily"],
                row["routeFamilyRef"],
                row["keyboardModel"],
                str(row["focusTransitionContractCount"]),
                row["coverageState"],
                row["accessibilityVerdict"],
                row["responsiveExpectation"],
            ]
            for row in accessibility_cases
        ],
    )
    return dedent(
        f"""
        # 136 Accessibility Semantic Coverage Matrix

        This matrix records the whole-shell accessibility ceiling that seq_136 uses for landmark, heading, keyboard, reflow, reduced-motion, and diagram parity checks.

        {table}
        """
    ).strip()


def build_atlas_html(payload: dict[str, Any]) -> str:
    suite_results = payload["suiteResults"]
    suite_json = json.dumps(suite_results, separators=(",", ":"))
    html = dedent(
        """
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>136 Shell Conformance Atlas</title>
          <style>
            :root {{
              color-scheme: light;
              --canvas: #F7F8FA;
              --shell: #EEF2F6;
              --panel: #FFFFFF;
              --inset: #E8EEF3;
              --border: #D8E0E8;
              --text-strong: #0F1720;
              --text: #24313D;
              --text-muted: #5E6B78;
              --patient: #2F6FED;
              --staff: #117A55;
              --operations: #B7791F;
              --hub: #9B4D16;
              --governance: #5B61F6;
              --pharmacy: #0F766E;
              --blocked: #B42318;
              --shadow: 0 18px 48px rgba(15, 23, 32, 0.08);
              --radius: 22px;
              --transition-fast: 120ms ease;
              --transition-medium: 180ms ease;
              --transition-diagram: 220ms ease;
              font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            }}

            * {{
              box-sizing: border-box;
            }}

            body {{
              margin: 0;
              background: var(--canvas);
              color: var(--text);
            }}

            body[data-reduced-motion="true"] *,
            @media (prefers-reduced-motion: reduce) {{
              *,
              *::before,
              *::after {{
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                scroll-behavior: auto !important;
                transition-duration: 0.01ms !important;
              }}
            }}

            button,
            [tabindex="0"] {{
              transition:
                background var(--transition-fast),
                border-color var(--transition-fast),
                box-shadow var(--transition-fast),
                color var(--transition-fast),
                transform var(--transition-medium);
            }}

            button:focus-visible,
            [tabindex="0"]:focus-visible {{
              outline: 3px solid rgba(47, 111, 237, 0.22);
              outline-offset: 2px;
            }}

            .atlas-shell {{
              max-width: 1600px;
              margin: 0 auto;
              padding: 0 24px 32px;
            }}

            .masthead {{
              position: sticky;
              top: 0;
              z-index: 10;
              height: 72px;
              display: grid;
              grid-template-columns: minmax(0, 1.5fr) repeat(3, minmax(160px, 1fr));
              gap: 16px;
              align-items: center;
              padding: 14px 24px;
              background: rgba(247, 248, 250, 0.92);
              backdrop-filter: blur(12px);
              border-bottom: 1px solid rgba(216, 224, 232, 0.85);
            }}

            .brand {{
              display: flex;
              align-items: center;
              gap: 14px;
              min-width: 0;
            }}

            .brand-mark {{
              width: 34px;
              height: 34px;
              border-radius: 999px;
              background: linear-gradient(160deg, rgba(47, 111, 237, 0.16), rgba(91, 97, 246, 0.08));
              display: grid;
              place-items: center;
              flex: 0 0 auto;
            }}

            .brand-meta {{
              min-width: 0;
            }}

            .brand-title {{
              font-size: 17px;
              line-height: 1.1;
              font-weight: 700;
              color: var(--text-strong);
            }}

            .brand-subtitle {{
              margin-top: 2px;
              font-size: 13px;
              line-height: 1.35;
              color: var(--text-muted);
            }}

            .metric-card {{
              min-width: 0;
              border: 1px solid var(--border);
              border-radius: 18px;
              background: rgba(255, 255, 255, 0.88);
              padding: 10px 14px;
            }}

            .metric-label {{
              font-size: 12px;
              line-height: 1.3;
              color: var(--text-muted);
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }}

            .metric-value {{
              margin-top: 4px;
              font-size: 20px;
              line-height: 1.2;
              font-weight: 700;
              color: var(--text-strong);
            }}

            .layout {{
              display: grid;
              grid-template-columns: 288px minmax(0, 1fr) 404px;
              gap: 20px;
              margin-top: 24px;
              align-items: start;
            }}

            .panel {{
              background: var(--panel);
              border: 1px solid var(--border);
              border-radius: var(--radius);
              box-shadow: var(--shadow);
              min-width: 0;
            }}

            .panel-header {{
              padding: 18px 20px 12px;
              border-bottom: 1px solid rgba(216, 224, 232, 0.8);
            }}

            .panel-title {{
              margin: 0;
              font-size: 18px;
              line-height: 1.3;
              color: var(--text-strong);
            }}

            .panel-body {{
              padding: 18px 20px 20px;
            }}

            .rail-list {{
              display: grid;
              gap: 10px;
            }}

            .rail-button {{
              width: 100%;
              text-align: left;
              padding: 14px 16px;
              border: 1px solid var(--border);
              border-radius: 18px;
              background: var(--shell);
              cursor: pointer;
            }}

            .rail-button[data-selected="true"] {{
              background: rgba(47, 111, 237, 0.08);
              border-color: rgba(47, 111, 237, 0.35);
              box-shadow: inset 0 0 0 1px rgba(47, 111, 237, 0.15);
            }}

            .rail-shell {{
              font-size: 15px;
              font-weight: 700;
              color: var(--text-strong);
            }}

            .rail-meta {{
              margin-top: 6px;
              display: flex;
              flex-wrap: wrap;
              gap: 6px;
              font-size: 12px;
              color: var(--text-muted);
            }}

            .status-pill {{
              display: inline-flex;
              align-items: center;
              gap: 6px;
              padding: 3px 8px;
              border-radius: 999px;
              background: var(--inset);
            }}

            .canvas-stack {{
              display: grid;
              gap: 20px;
            }}

            .tab-row {{
              display: flex;
              gap: 10px;
              flex-wrap: wrap;
              margin-bottom: 16px;
            }}

            .tab-button {{
              border: 1px solid var(--border);
              border-radius: 999px;
              background: var(--shell);
              padding: 10px 14px;
              cursor: pointer;
            }}

            .tab-button[data-selected="true"] {{
              background: var(--panel);
              border-color: rgba(47, 111, 237, 0.4);
              color: var(--text-strong);
              box-shadow: inset 0 0 0 1px rgba(47, 111, 237, 0.12);
            }}

            .diagram-block {{
              display: grid;
              gap: 14px;
              margin-bottom: 18px;
              scroll-margin-top: 96px;
            }}

            .constellation {{
              border-radius: 22px;
              border: 1px solid var(--border);
              background:
                radial-gradient(circle at top, rgba(47, 111, 237, 0.08), transparent 36%),
                linear-gradient(180deg, rgba(232, 238, 243, 0.7), rgba(255, 255, 255, 0.98));
              padding: 18px;
              min-height: 280px;
              display: grid;
              place-items: center;
            }}

            .constellation-grid {{
              display: grid;
              grid-template-columns: repeat(3, minmax(0, 1fr));
              gap: 14px;
              width: 100%;
            }}

            .constellation-node {{
              border-radius: 18px;
              border: 1px solid rgba(216, 224, 232, 0.95);
              background: rgba(255, 255, 255, 0.82);
              padding: 12px;
              min-height: 92px;
            }}

            .constellation-node[data-current="true"] {{
              border-color: rgba(47, 111, 237, 0.4);
              box-shadow: 0 10px 24px rgba(47, 111, 237, 0.12);
              transform: translateY(-1px);
            }}

            .ladder {{
              display: grid;
              gap: 10px;
            }}

            .ladder-row {{
              display: grid;
              grid-template-columns: 80px minmax(0, 1fr) minmax(90px, 120px);
              gap: 12px;
              align-items: center;
              padding: 12px 14px;
              border-radius: 16px;
              border: 1px solid var(--border);
              background: rgba(238, 242, 246, 0.7);
            }}

            .ladder-topology {{
              font-weight: 700;
              color: var(--text-strong);
            }}

            .coverage-table,
            .result-table {{
              width: 100%;
              border-collapse: collapse;
              min-width: 0;
            }}

            .coverage-table th,
            .coverage-table td,
            .result-table th,
            .result-table td {{
              text-align: left;
              padding: 10px 12px;
              border-bottom: 1px solid rgba(216, 224, 232, 0.75);
              vertical-align: top;
              word-break: break-word;
            }}

            .result-table tr[data-selected="true"] {{
              background: rgba(47, 111, 237, 0.06);
            }}

            .result-table tr {{
              cursor: pointer;
            }}

            .inspector-list {{
              display: grid;
              gap: 10px;
            }}

            .inspector-item {{
              border-radius: 18px;
              border: 1px solid var(--border);
              background: var(--shell);
              padding: 12px 14px;
            }}

            .inspector-key {{
              font-size: 12px;
              line-height: 1.35;
              color: var(--text-muted);
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }}

            .inspector-value {{
              margin-top: 6px;
              font-size: 14px;
              line-height: 1.5;
              color: var(--text-strong);
            }}

            .lower-grid {{
              margin-top: 20px;
              display: grid;
              grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
              gap: 20px;
            }}

            .parity-note {{
              font-size: 13px;
              line-height: 1.5;
              color: var(--text-muted);
            }}

            .visually-hidden {{
              position: absolute;
              width: 1px;
              height: 1px;
              padding: 0;
              margin: -1px;
              overflow: hidden;
              clip: rect(0, 0, 0, 0);
              white-space: nowrap;
              border: 0;
            }}

            @media (max-width: 1320px) {{
              .layout {{
                grid-template-columns: 260px minmax(0, 1fr);
              }}
              .layout > :last-child {{
                grid-column: 1 / -1;
              }}
            }}

            @media (max-width: 980px) {{
              .masthead {{
                height: auto;
                grid-template-columns: 1fr;
              }}
              .layout,
              .lower-grid {{
                grid-template-columns: 1fr;
              }}
            }}
          </style>
        </head>
        <body>
          <div class="atlas-shell" data-testid="shell-conformance-atlas">
            <header class="masthead" data-testid="atlas-masthead">
              <div class="brand">
                <div class="brand-mark" aria-hidden="true">
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <circle cx="11" cy="11" r="3.2" fill="#2F6FED"></circle>
                    <circle cx="11" cy="11" r="7.2" stroke="#5B61F6" stroke-width="1.2"></circle>
                    <circle cx="11" cy="11" r="10.2" stroke="#0F766E" stroke-width="1" opacity="0.6"></circle>
                  </svg>
                </div>
                <div class="brand-meta">
                  <div class="brand-title">Vecells / Shell Conformance Atlas</div>
                  <div class="brand-subtitle">Phase 0 shell accessibility, preview, and smoke ceiling</div>
                </div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Suite verdict</div>
                <div class="metric-value" data-testid="masthead-verdict">release_withheld</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Failing shells</div>
                <div class="metric-value" data-testid="masthead-failing-shell-count"></div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Active preview</div>
                <div class="metric-value" data-testid="masthead-preview-label"></div>
              </div>
            </header>

            <section class="layout">
              <aside class="panel" data-testid="shell-family-rail">
                <div class="panel-header">
                  <h1 class="panel-title">Seeded shell families</h1>
                </div>
                <div class="panel-body">
                  <div class="rail-list" id="shell-family-buttons"></div>
                </div>
              </aside>

              <main class="canvas-stack">
                <section class="panel" data-testid="atlas-canvas">
                  <div class="panel-header">
                    <h2 class="panel-title">Topology and parity</h2>
                  </div>
                  <div class="panel-body">
                    <div class="tab-row" data-testid="atlas-tab-row">
                      <button class="tab-button" data-tab="topology" data-selected="true" data-testid="tab-topology">Constellation</button>
                      <button class="tab-button" data-tab="breakpoints" data-testid="tab-breakpoints">Breakpoint ladder</button>
                      <button class="tab-button" data-tab="accessibility" data-testid="tab-accessibility">Accessibility matrix</button>
                    </div>

                    <section class="diagram-block" data-tab-panel="topology" data-testid="topology-panel">
                      <div class="constellation" data-testid="topology-constellation"></div>
                      <div class="parity-note" data-testid="topology-parity-text"></div>
                      <table class="coverage-table" data-testid="topology-parity-table"></table>
                    </section>

                    <section class="diagram-block" data-tab-panel="breakpoints" hidden data-testid="breakpoint-panel">
                      <div class="ladder" data-testid="breakpoint-ladder"></div>
                      <div class="parity-note" data-testid="breakpoint-parity-text"></div>
                      <table class="coverage-table" data-testid="breakpoint-parity-table"></table>
                    </section>

                    <section class="diagram-block" data-tab-panel="accessibility" hidden data-testid="accessibility-panel">
                      <table class="coverage-table" data-testid="accessibility-coverage-matrix"></table>
                      <div class="parity-note" data-testid="accessibility-parity-text"></div>
                      <table class="coverage-table" data-testid="accessibility-parity-table"></table>
                    </section>
                  </div>
                </section>
              </main>

              <aside class="panel" data-testid="shell-inspector">
                <div class="panel-header">
                  <h2 class="panel-title">Inspector</h2>
                </div>
                <div class="panel-body">
                  <div class="inspector-list" id="inspector-list"></div>
                </div>
              </aside>
            </section>

            <section class="lower-grid">
              <section class="panel">
                <div class="panel-header">
                  <h2 class="panel-title">Smoke results</h2>
                </div>
                <div class="panel-body">
                  <table class="result-table" data-testid="smoke-results-table"></table>
                </div>
              </section>
              <section class="panel">
                <div class="panel-header">
                  <h2 class="panel-title">Accessibility results</h2>
                </div>
                <div class="panel-body">
                  <table class="result-table" data-testid="accessibility-results-table"></table>
                </div>
              </section>
            </section>
          </div>

          <script>
            const suite = __SUITE_JSON__;
            const familyButtons = document.getElementById("shell-family-buttons");
            const inspector = document.getElementById("inspector-list");
            const smokeTable = document.querySelector("[data-testid='smoke-results-table']");
            const accessibilityTable = document.querySelector("[data-testid='accessibility-results-table']");
            const topologyConstellation = document.querySelector("[data-testid='topology-constellation']");
            const topologyParityText = document.querySelector("[data-testid='topology-parity-text']");
            const topologyParityTable = document.querySelector("[data-testid='topology-parity-table']");
            const breakpointLadder = document.querySelector("[data-testid='breakpoint-ladder']");
            const breakpointParityText = document.querySelector("[data-testid='breakpoint-parity-text']");
            const breakpointParityTable = document.querySelector("[data-testid='breakpoint-parity-table']");
            const accessibilityMatrix = document.querySelector("[data-testid='accessibility-coverage-matrix']");
            const accessibilityParityText = document.querySelector("[data-testid='accessibility-parity-text']");
            const accessibilityParityTable = document.querySelector("[data-testid='accessibility-parity-table']");
            const failingShellCount = document.querySelector("[data-testid='masthead-failing-shell-count']");
            const previewLabel = document.querySelector("[data-testid='masthead-preview-label']");
            const tabButtons = [...document.querySelectorAll(".tab-button")];
            const tabPanels = [...document.querySelectorAll("[data-tab-panel]")];

            const familyByKey = Object.fromEntries(
              suite.shellFamilyResults.map((row) => [row.shellFamily, row]),
            );
            const familyOrder = suite.shellFamilyResults.map((row) => row.shellFamily);
            const state = {{
              shellFamily: familyOrder[0],
              smokeCaseId: suite.smokeResults.find((row) => row.shellFamily === familyOrder[0]).caseId,
              tab: "topology",
            }};

            document.body.dataset.reducedMotion = String(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
            failingShellCount.textContent = String(suite.summary.suppressed_shell_count);

            function renderFamilyButtons() {{
              familyButtons.innerHTML = "";
              suite.shellFamilyResults.forEach((row, index) => {{
                const button = document.createElement("button");
                button.type = "button";
                button.className = "rail-button";
                button.dataset.selected = String(row.shellFamily === state.shellFamily);
                button.dataset.testid = `shell-family-button-${{row.shellFamily}}`;
                button.setAttribute("data-testid", `shell-family-button-${{row.shellFamily}}`);
                button.tabIndex = row.shellFamily === state.shellFamily ? 0 : -1;
                button.innerHTML = `
                  <div class="rail-shell">${{row.shellLabel}}</div>
                  <div class="rail-meta">
                    <span class="status-pill">${{row.previewEnvironmentState}}</span>
                    <span class="status-pill">${{row.smokeVerdict}}</span>
                    <span class="status-pill">${{row.compactTopology}}</span>
                  </div>
                `;
                button.addEventListener("click", () => selectFamily(row.shellFamily));
                button.addEventListener("keydown", (event) => {{
                  if (event.key === "ArrowDown" || event.key === "ArrowRight") {{
                    event.preventDefault();
                    selectFamily(familyOrder[(index + 1) % familyOrder.length], true);
                  }}
                  if (event.key === "ArrowUp" || event.key === "ArrowLeft") {{
                    event.preventDefault();
                    selectFamily(familyOrder[(index - 1 + familyOrder.length) % familyOrder.length], true);
                  }}
                }});
                familyButtons.appendChild(button);
              }});
            }}

            function selectFamily(shellFamily, focusRail = false) {{
              state.shellFamily = shellFamily;
              const firstCase = suite.smokeResults.find((row) => row.shellFamily === shellFamily);
              if (firstCase) {{
                state.smokeCaseId = firstCase.caseId;
              }}
              render();
              if (focusRail) {{
                const active = document.querySelector(`[data-testid="shell-family-button-${{shellFamily}}"]`);
                active?.focus();
              }}
            }}

            function selectSmokeCase(caseId, focusRow = false) {{
              state.smokeCaseId = caseId;
              renderTables();
              renderInspector();
              if (focusRow) {{
                document.querySelector(`[data-testid="smoke-row-${{caseId}}"]`)?.focus();
              }}
            }}

            function selectTab(tab) {{
              state.tab = tab;
              tabButtons.forEach((button) => {{
                const selected = button.dataset.tab === tab;
                button.dataset.selected = String(selected);
              }});
              tabPanels.forEach((panel) => {{
                panel.hidden = panel.dataset.tabPanel !== tab;
              }});
            }}

            tabButtons.forEach((button, index) => {{
              button.addEventListener("click", () => selectTab(button.dataset.tab));
              button.addEventListener("keydown", (event) => {{
                if (event.key === "ArrowRight") {{
                  event.preventDefault();
                  const next = tabButtons[(index + 1) % tabButtons.length];
                  next.focus();
                  selectTab(next.dataset.tab);
                }}
                if (event.key === "ArrowLeft") {{
                  event.preventDefault();
                  const prev = tabButtons[(index - 1 + tabButtons.length) % tabButtons.length];
                  prev.focus();
                  selectTab(prev.dataset.tab);
                }}
              }});
            }});

            function rowsForCurrentFamily() {{
              return suite.smokeResults.filter((row) => row.shellFamily === state.shellFamily);
            }}

            function accessibilityRowsForCurrentFamily() {{
              return suite.accessibilityResults.filter((row) => row.shellFamily === state.shellFamily);
            }}

            function renderTopology() {{
              const currentFamily = familyByKey[state.shellFamily];
              const rows = rowsForCurrentFamily();
              topologyConstellation.innerHTML = `
                <div class="constellation-grid">
                  ${rows.slice(0, 9).map((row) => `
                    <div class="constellation-node" data-current="${{String(row.caseId === state.smokeCaseId)}}" data-testid="topology-node-${{row.caseId}}" tabindex="0">
                      <div class="metric-label">${{row.routeFamilyRef}}</div>
                      <div class="metric-value" style="font-size: 16px;">${{row.routeKey}}</div>
                      <div class="brand-subtitle">${{row.expectedTopology}} / ${{
                        row.smokeVerdict
                      }}</div>
                    </div>
                  `).join("")}
                </div>
              `;
              [...topologyConstellation.querySelectorAll(".constellation-node")].forEach((node, index) => {{
                node.addEventListener("click", () => selectSmokeCase(rows[index].caseId));
                node.addEventListener("keydown", (event) => {{
                  if (event.key === "Enter" || event.key === " ") {{
                    event.preventDefault();
                    selectSmokeCase(rows[index].caseId, true);
                  }}
                }});
              }});
              topologyParityText.textContent = `${{currentFamily.shellLabel}} keeps ${
                rows.length
              } seeded routes inside one governed shell family. Current smoke is withheld whenever preview or publication truth is not exact.`;
              topologyParityTable.innerHTML = `
                <thead>
                  <tr><th>Route</th><th>Topology</th><th>Compact fold</th><th>Smoke</th></tr>
                </thead>
                <tbody>
                  ${rows.map((row) => `
                    <tr>
                      <td>${{row.routeKey}}</td>
                      <td>${{row.expectedTopology}}</td>
                      <td>${{row.compactTopology}}</td>
                      <td>${{row.smokeVerdict}}</td>
                    </tr>
                  `).join("")}
                </tbody>
              `;
            }}

            function renderBreakpoints() {{
              const currentFamily = familyByKey[state.shellFamily];
              const ladderRows = [
                ["xs", currentFamily.compactTopology, "compact / mobile"],
                ["sm", currentFamily.compactTopology, "narrow / tablet fold"],
                ["md", currentFamily.defaultTopology, "medium"],
                ["lg", currentFamily.desktopTopology, "desktop"],
              ];
              breakpointLadder.innerHTML = ladderRows.map((row) => `
                <div class="ladder-row" data-testid="breakpoint-row-${{row[0]}}">
                  <div class="metric-label">${{row[0]}}</div>
                  <div class="ladder-topology">${{row[1]}}</div>
                  <div class="brand-subtitle">${{row[2]}}</div>
                </div>
              `).join("");
              breakpointParityText.textContent = `${{currentFamily.shellLabel}} must preserve one shell at compact, tablet, desktop, and 400% reflow. Mission-stack is the compact fold when supported.`;
              breakpointParityTable.innerHTML = `
                <thead>
                  <tr><th>Breakpoint</th><th>Resolved topology</th><th>Expectation</th></tr>
                </thead>
                <tbody>
                  ${ladderRows.map((row) => `
                    <tr>
                      <td>${{row[0]}}</td>
                      <td>${{row[1]}}</td>
                      <td>${{row[2]}}</td>
                    </tr>
                  `).join("")}
                </tbody>
              `;
            }}

            function renderAccessibilityMatrix() {{
              const rows = accessibilityRowsForCurrentFamily();
              accessibilityMatrix.innerHTML = `
                <thead>
                  <tr><th>Route family</th><th>Keyboard model</th><th>Focus contracts</th><th>Verdict</th></tr>
                </thead>
                <tbody>
                  ${rows.map((row) => `
                    <tr>
                      <td>${{row.routeFamilyRef}}</td>
                      <td>${{row.keyboardModel}}</td>
                      <td>${{row.focusTransitionContractCount}}</td>
                      <td>${{row.accessibilityVerdict}}</td>
                    </tr>
                  `).join("")}
                </tbody>
              `;
              accessibilityParityText.textContent = `Whole-shell accessibility proof stays tied to headings, landmarks, keyboard order, reduced-motion, reflow, and diagram parity instead of component-only checks.`;
              accessibilityParityTable.innerHTML = `
                <thead>
                  <tr><th>Route</th><th>Coverage</th><th>Reduced motion</th><th>Reflow</th></tr>
                </thead>
                <tbody>
                  ${rows.map((row) => `
                    <tr>
                      <td>${{row.routeKey}}</td>
                      <td>${{row.coverageState}}</td>
                      <td>${{row.reducedMotionExpectation}}</td>
                      <td>${{row.responsiveExpectation}}</td>
                    </tr>
                  `).join("")}
                </tbody>
              `;
            }}

            function renderInspector() {{
              const family = familyByKey[state.shellFamily];
              const smokeRow = suite.smokeResults.find((row) => row.caseId === state.smokeCaseId);
              previewLabel.textContent = family.previewEnvironmentRef;
              inspector.innerHTML = `
                <div class="inspector-item" data-testid="inspector-shell-summary">
                  <div class="inspector-key">Shell family</div>
                  <div class="inspector-value">${{family.shellLabel}} / ${{family.shellSlug}}</div>
                </div>
                <div class="inspector-item" data-testid="inspector-preview-summary">
                  <div class="inspector-key">Preview tuple</div>
                  <div class="inspector-value">${{family.previewEnvironmentRef}} / ${{family.previewEnvironmentState}} / ${{family.previewDriftState}}</div>
                </div>
                <div class="inspector-item" data-testid="inspector-case-summary">
                  <div class="inspector-key">Selected route</div>
                  <div class="inspector-value">${{smokeRow.routeKey}} / ${{smokeRow.path}}</div>
                </div>
                <div class="inspector-item" data-testid="inspector-continuity-summary">
                  <div class="inspector-key">Continuity law</div>
                  <div class="inspector-value">${{smokeRow.continuityRequirements}}</div>
                </div>
                <div class="inspector-item" data-testid="inspector-stale-summary">
                  <div class="inspector-key">Suppression posture</div>
                  <div class="inspector-value">${{smokeRow.staleBehavior}}</div>
                </div>
              `;
            }}

            function renderTables() {{
              const smokeRows = rowsForCurrentFamily();
              smokeTable.innerHTML = `
                <thead>
                  <tr><th>Route</th><th>Preview</th><th>Binding</th><th>Verdict</th><th>Failures</th></tr>
                </thead>
                <tbody>
                  ${smokeRows.map((row) => `
                    <tr data-testid="smoke-row-${{row.caseId}}" data-selected="${{String(row.caseId === state.smokeCaseId)}}" tabindex="0">
                      <td>${{row.routeKey}}</td>
                      <td>${{row.previewEnvironmentState}} / ${{row.previewEligibility}}</td>
                      <td>${{row.bindingState}}</td>
                      <td>${{row.smokeVerdict}}</td>
                      <td>${{row.failureClasses || "none"}}</td>
                    </tr>
                  `).join("")}
                </tbody>
              `;
              [...smokeTable.querySelectorAll("tbody tr")].forEach((row, index) => {{
                const caseId = smokeRows[index].caseId;
                row.addEventListener("click", () => selectSmokeCase(caseId));
                row.addEventListener("keydown", (event) => {{
                  if (event.key === "Enter" || event.key === " ") {{
                    event.preventDefault();
                    selectSmokeCase(caseId, true);
                  }}
                }});
              }});

              const accessRows = accessibilityRowsForCurrentFamily();
              accessibilityTable.innerHTML = `
                <thead>
                  <tr><th>Route</th><th>Keyboard</th><th>Coverage</th><th>Verdict</th></tr>
                </thead>
                <tbody>
                  ${accessRows.map((row) => `
                    <tr data-testid="accessibility-row-${{row.caseId}}">
                      <td>${{row.routeKey}}</td>
                      <td>${{row.keyboardModel}}</td>
                      <td>${{row.coverageState}}</td>
                      <td>${{row.accessibilityVerdict}}</td>
                    </tr>
                  `).join("")}
                </tbody>
              `;
            }}

            function render() {{
              renderFamilyButtons();
              renderTopology();
              renderBreakpoints();
              renderAccessibilityMatrix();
              renderTables();
              renderInspector();
              selectTab(state.tab);
            }}

            render();
          </script>
        </body>
        </html>
        """
    ).strip()
    html = html.replace("{{", "{").replace("}}", "}")
    return html.replace("__SUITE_JSON__", suite_json)


def main() -> None:
    payload = build_case_payload()

    write_csv(
        PREVIEW_CASES_PATH,
        payload["previewCases"],
        [
            "caseId",
            "shellFamily",
            "shellSlug",
            "routeKey",
            "routeFamilyRef",
            "path",
            "previewEnvironmentRef",
            "previewEnvironmentState",
            "previewDriftState",
            "previewEligibility",
            "expectedTopology",
            "compactTopology",
            "desktopTopology",
            "continuityRequirements",
            "selectedAnchorPolicy",
            "restoreOrder",
            "accessibilityProfileRef",
            "frontendAccessibilityCoverageState",
            "bindingState",
            "calmTruthState",
            "writableTruthState",
            "routeFreezeDispositionRefs",
            "releaseRecoveryDispositionRefs",
            "smokeVerdict",
            "failureClasses",
            "staleBehavior",
            "proofRefs",
        ],
    )
    write_csv(
        ACCESSIBILITY_CASES_PATH,
        payload["accessibilityCases"],
        [
            "caseId",
            "shellFamily",
            "shellSlug",
            "routeKey",
            "routeFamilyRef",
            "path",
            "landmarkExpectation",
            "headingExpectation",
            "keyboardModel",
            "focusTransitionContractCount",
            "announcementContractCount",
            "tableParityExpectation",
            "reducedMotionExpectation",
            "responsiveExpectation",
            "coverageState",
            "accessibilityVerdict",
            "failureClasses",
            "proofRefs",
        ],
    )
    write_json(SMOKE_EXPECTATIONS_PATH, payload["smokeExpectations"])
    write_json(SUITE_RESULTS_PATH, payload["suiteResults"])
    write_text(SUITE_DOC_PATH, build_suite_doc(payload))
    write_text(PREVIEW_MATRIX_DOC_PATH, build_preview_matrix_doc(payload))
    write_text(ACCESSIBILITY_MATRIX_DOC_PATH, build_accessibility_matrix_doc(payload))
    write_text(ATLAS_PATH, build_atlas_html(payload))


if __name__ == "__main__":
    main()
