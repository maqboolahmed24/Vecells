#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"
TOOLS_ARCH_DIR = ROOT / "tools" / "architecture"

MANIFEST_PATH = DATA_DIR / "repo_topology_manifest.json"
BOUNDARY_CSV_PATH = DATA_DIR / "package_boundary_rules.csv"
CONTRACTS_JSON_PATH = DATA_DIR / "context_boundary_contracts.json"
TOPOLOGY_RULES_MD_PATH = DOCS_DIR / "41_repository_topology_rules.md"
BOUNDARY_RULES_MD_PATH = DOCS_DIR / "41_package_boundary_rules.md"
ATLAS_HTML_PATH = DOCS_DIR / "41_repo_topology_atlas.html"
ATLAS_MMD_PATH = DOCS_DIR / "41_repo_topology_atlas.mmd"
DEPENDENCY_RULES_JSON_PATH = TOOLS_ARCH_DIR / "dependency_boundary_rules.json"

SHELL_MAP_PATH = DATA_DIR / "shell_ownership_map.json"
GATEWAY_MATRIX_PATH = DATA_DIR / "gateway_surface_matrix.csv"

EXPECTED_SUMMARY = {
    "artifact_count": 39,
    "app_count": 7,
    "service_count": 5,
    "package_count": 22,
    "special_workspace_count": 5,
    "context_count": 22,
    "shell_family_count": 8,
    "route_family_count": 20,
    "gateway_surface_count": 22,
    "boundary_rule_count": 19,
    "context_boundary_contract_count": 17,
    "topology_defect_count": 2,
    "resolved_defect_count": 3,
    "conditional_surface_count": 1,
    "upstream_import_rule_count": 15,
}

EXPECTED_DOMAIN_PACKAGES = {
    "packages/domains/intake_safety",
    "packages/domains/identity_access",
    "packages/domains/triage_workspace",
    "packages/domains/booking",
    "packages/domains/hub_coordination",
    "packages/domains/pharmacy",
    "packages/domains/communications",
    "packages/domains/support",
    "packages/domains/operations",
    "packages/domains/governance_admin",
    "packages/domains/analytics_assurance",
    "packages/domains/audit_compliance",
    "packages/domains/release_control",
}

HTML_MARKERS = [
    'data-testid="topology-shell"',
    'data-testid="context-rail"',
    'data-testid="graph-canvas"',
    'data-testid="filter-artifact"',
    'data-testid="filter-context"',
    'data-testid="filter-defect"',
    'data-testid="node-table"',
    'data-testid="parity-table"',
    'data-testid="inspector"',
    'data-testid="defect-strip"',
]

CSV_REQUIRED_FIELDS = {
    "rule_id",
    "rule_scope",
    "from_selector",
    "to_selector",
    "verdict",
    "allowed_access",
    "description",
    "enforcement_layers",
    "source_refs",
}


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def load_json(path: Path) -> Any:
    return json.loads(path.read_text())


def load_csv(path: Path) -> list[dict[str, str]]:
    with path.open() as handle:
        return list(csv.DictReader(handle))


def ensure_deliverables() -> None:
    required = [
        MANIFEST_PATH,
        BOUNDARY_CSV_PATH,
        CONTRACTS_JSON_PATH,
        TOPOLOGY_RULES_MD_PATH,
        BOUNDARY_RULES_MD_PATH,
        ATLAS_HTML_PATH,
        ATLAS_MMD_PATH,
        DEPENDENCY_RULES_JSON_PATH,
    ]
    missing = [str(path) for path in required if not path.exists()]
    assert_true(not missing, "Missing seq_041 deliverables:\n" + "\n".join(missing))


def validate_manifest() -> dict[str, Any]:
    manifest = load_json(MANIFEST_PATH)
    assert_true(manifest["task_id"] == "seq_041", "Manifest task id drifted")
    assert_true(manifest["visual_mode"] == "Topology_Atlas", "Manifest visual mode drifted")
    for key, value in EXPECTED_SUMMARY.items():
        assert_true(manifest["summary"][key] == value, f"Manifest summary drifted for {key}: {manifest['summary'][key]}")

    artifacts = manifest["artifacts"]
    assert_true(len(artifacts) == EXPECTED_SUMMARY["artifact_count"], "Artifact count drifted")
    artifact_ids = [artifact["artifact_id"] for artifact in artifacts]
    repo_paths = [artifact["repo_path"] for artifact in artifacts]
    assert_true(len(artifact_ids) == len(set(artifact_ids)), "Artifact ids lost uniqueness")
    assert_true(len(repo_paths) == len(set(repo_paths)), "Repo paths lost uniqueness")

    patient = next(artifact for artifact in artifacts if artifact["artifact_id"] == "app_patient_web")
    patient_routes = {route["route_family_id"] for route in patient["route_families_owned"]}
    assert_true("rf_patient_embedded_channel" in patient_routes, "Patient app lost embedded channel ownership")
    assert_true(patient["defect_state"] == "watch", "Patient app lost watch posture for derived ingress routes")

    assistive = next(artifact for artifact in artifacts if artifact["artifact_id"] == "tool_assistive_control_lab")
    assert_true(assistive["artifact_type"] == "tools-only", "Assistive lab changed artifact type")
    assert_true(assistive["topology_status"] == "conditional_reserved", "Assistive lab lost conditional posture")

    domain_paths = {artifact["repo_path"] for artifact in artifacts if artifact["repo_path"].startswith("packages/domains/")}
    assert_true(domain_paths == EXPECTED_DOMAIN_PACKAGES, "Domain package paths drifted")

    route_ids = {route["route_family_id"] for artifact in artifacts for route in artifact["route_families_owned"]}
    shell_types = {shell for artifact in artifacts for shell in artifact["shell_types_owned"]}
    gateway_ids = {surface["gateway_surface_id"] for artifact in artifacts for surface in artifact["gateway_surfaces_owned"]}

    shell_map = load_json(SHELL_MAP_PATH)
    expected_route_ids = {claim["route_family_id"] for claim in shell_map["route_family_claims"]}
    expected_shell_types = {shell["shell_type"] for shell in shell_map["shells"]}
    expected_gateway_ids = {row["gateway_surface_id"] for row in load_csv(GATEWAY_MATRIX_PATH)}

    assert_true(route_ids == expected_route_ids, "Manifest route-family ownership drifted")
    assert_true(shell_types == expected_shell_types, "Manifest shell-family ownership drifted")
    assert_true(gateway_ids == expected_gateway_ids, "Manifest gateway ownership drifted")
    return manifest


def validate_boundary_csv() -> None:
    rows = load_csv(BOUNDARY_CSV_PATH)
    assert_true(len(rows) == EXPECTED_SUMMARY["boundary_rule_count"], "Boundary CSV row count drifted")
    assert_true(CSV_REQUIRED_FIELDS.issubset(rows[0].keys()), "Boundary CSV columns drifted")
    rule_ids = {row["rule_id"] for row in rows}
    assert_true("RULE_041_NO_APP_OWNS_TRUTH" in rule_ids, "Boundary CSV lost no-app-truth rule")
    assert_true(
        "RULE_041_CONDITIONAL_ASSISTIVE_STANDALONE_STAYS_TOOLS_ONLY" in rule_ids,
        "Boundary CSV lost assistive conditional rule",
    )


def validate_contracts() -> None:
    payload = load_json(CONTRACTS_JSON_PATH)
    assert_true(payload["task_id"] == "seq_041", "Contract payload task id drifted")
    assert_true(payload["visual_mode"] == "Topology_Atlas", "Contract payload visual mode drifted")
    assert_true(payload["summary"]["contract_count"] == EXPECTED_SUMMARY["context_boundary_contract_count"], "Contract count drifted")
    contract_ids = {contract["contract_id"] for contract in payload["contracts"]}
    assert_true("CBC_041_SHELLS_TO_API_CONTRACTS" in contract_ids, "Missing shell-to-api contract")
    assert_true("CBC_041_ASSISTIVE_LAB_TO_CONTRACTS_AND_RELEASE_CONTROLS" in contract_ids, "Missing assistive-lab contract")


def validate_dependency_rule_payload() -> None:
    payload = load_json(DEPENDENCY_RULES_JSON_PATH)
    assert_true(payload["task_id"] == "seq_041", "Dependency rules task id drifted")
    assert_true(payload["visual_mode"] == "Topology_Atlas", "Dependency rules visual mode drifted")
    assert_true(payload["summary"]["artifact_count"] == EXPECTED_SUMMARY["artifact_count"], "Dependency rules artifact count drifted")
    assert_true(payload["summary"]["boundary_rule_count"] == EXPECTED_SUMMARY["boundary_rule_count"], "Dependency rules count drifted")
    assert_true(
        payload["summary"]["context_boundary_contract_count"] == EXPECTED_SUMMARY["context_boundary_contract_count"],
        "Dependency rules contract count drifted",
    )
    shared_classes = set(payload["shared_kernel_classes"])
    assert_true("shared_domain_kernel" in shared_classes, "Dependency rules lost shared kernel")
    assert_true("assistive_lab" in shared_classes, "Dependency rules lost assistive lab")


def validate_docs_and_views() -> None:
    topology_md = TOPOLOGY_RULES_MD_PATH.read_text()
    boundary_md = BOUNDARY_RULES_MD_PATH.read_text()
    html = ATLAS_HTML_PATH.read_text()
    mmd = ATLAS_MMD_PATH.read_text()

    assert_true("Topology_Atlas" in topology_md, "Topology rules doc lost visual mode")
    assert_true("No app owns truth." in topology_md, "Topology rules doc lost no-app-truth statement")
    assert_true("tools/assistive-control-lab" in topology_md, "Topology rules doc lost assistive-lab decision")
    assert_true("packages/domains/<context-code>" in boundary_md, "Boundary rules doc lost domain namespace freeze")
    assert_true("Context Boundary Contracts" in boundary_md, "Boundary rules doc lost contract table")

    assert_true("<title>41 Repo Topology Atlas</title>" in html, "Atlas title drifted")
    assert_true("Topology_Atlas" in html, "Atlas lost visual mode title")
    assert_true("published contracts only" in html, "Atlas boundary diagram text drifted")
    for marker in HTML_MARKERS:
        assert_true(marker in html, f"Atlas missing marker: {marker}")

    assert_true("flowchart LR" in mmd, "Mermaid topology view drifted")
    assert_true("app_app_patient_web" in mmd, "Mermaid topology lost patient app node")
    assert_true("tool_tool_assistive_control_lab" in mmd, "Mermaid topology lost assistive lab node")


def main() -> None:
    ensure_deliverables()
    validate_manifest()
    validate_boundary_csv()
    validate_contracts()
    validate_dependency_rule_payload()
    validate_docs_and_views()
    print("seq_041 validation passed")


if __name__ == "__main__":
    main()
