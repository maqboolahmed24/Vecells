#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"
TESTS_DIR = ROOT / "tests" / "playwright"

WORKLOAD_PATH = DATA_DIR / "runtime_workload_families.json"
MANIFEST_PATH = DATA_DIR / "runtime_topology_manifest.json"
EDGES_PATH = DATA_DIR / "runtime_topology_edges.csv"
FAILURE_DOMAIN_PATH = DATA_DIR / "runtime_failure_domains.csv"
STRATEGY_PATH = DOCS_DIR / "46_runtime_topology_manifest_strategy.md"
CATALOG_PATH = DOCS_DIR / "46_workload_family_catalog.md"
FAILURE_POLICY_PATH = DOCS_DIR / "46_failure_domain_and_egress_policy.md"
ATLAS_PATH = DOCS_DIR / "46_runtime_topology_atlas.html"
MMD_PATH = DOCS_DIR / "46_runtime_topology_edges.mmd"
SPEC_PATH = TESTS_DIR / "runtime-topology-atlas.spec.js"
ROOT_PACKAGE_PATH = ROOT / "package.json"

EXPECTED_SUMMARY = {
    "trust_zone_count": 7,
    "trust_zone_boundary_count": 10,
    "family_code_count": 7,
    "workload_family_catalog_count": 9,
    "runtime_workload_instance_count": 59,
    "environment_manifest_count": 5,
    "service_binding_count": 5,
    "context_runtime_home_count": 22,
    "gateway_surface_count": 22,
    "edge_count": 100,
    "failure_domain_count": 59,
    "blocked_crossing_count": 10,
    "dependency_effect_budget_count": 4,
    "repo_artifact_count": 39,
}

HTML_MARKERS = [
    'data-testid="topology-masthead"',
    'data-testid="family-rail"',
    'data-testid="filter-environment"',
    'data-testid="filter-zone"',
    'data-testid="filter-family"',
    'data-testid="filter-tenant"',
    'data-testid="filter-defect"',
    'data-testid="graph-canvas"',
    'data-testid="failure-overlay"',
    'data-testid="family-table"',
    'data-testid="edge-table"',
    'data-testid="manifest-table"',
    'data-testid="defect-strip"',
    'data-testid="inspector"',
]


def fail(message: str) -> None:
    raise SystemExit(message)


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        fail(message)


def read_json(path: Path) -> Any:
    return json.loads(path.read_text())


def load_csv(path: Path) -> list[dict[str, str]]:
    with path.open() as handle:
        return list(csv.DictReader(handle))


def ensure_deliverables() -> None:
    required = [
        WORKLOAD_PATH,
        MANIFEST_PATH,
        EDGES_PATH,
        FAILURE_DOMAIN_PATH,
        STRATEGY_PATH,
        CATALOG_PATH,
        FAILURE_POLICY_PATH,
        ATLAS_PATH,
        MMD_PATH,
        SPEC_PATH,
    ]
    missing = [str(path) for path in required if not path.exists()]
    assert_true(not missing, "Missing seq_046 deliverables:\n" + "\n".join(missing))


def validate_manifest() -> dict[str, Any]:
    manifest = read_json(MANIFEST_PATH)
    assert_true(manifest["task_id"] == "seq_046", "Manifest task id drifted")
    assert_true(manifest["visual_mode"] == "Runtime_Topology_Atlas", "Manifest visual mode drifted")
    for key, value in EXPECTED_SUMMARY.items():
        assert_true(manifest["summary"][key] == value, f"Manifest summary drifted for {key}")

    trust_zone_refs = {row["trust_zone_ref"] for row in manifest["trust_zones"]}
    assert_true(len(trust_zone_refs) == EXPECTED_SUMMARY["trust_zone_count"], "Trust zone refs lost uniqueness")

    family_catalog = manifest["workload_family_catalog"]
    family_refs = [row["runtime_workload_family_ref"] for row in family_catalog]
    assert_true(len(family_refs) == len(set(family_refs)), "Runtime family refs lost uniqueness")
    assert_true(
        {"public_edge", "shell_delivery", "command", "projection", "integration", "data", "assurance_security"}
        == {row["family_code"] for row in family_catalog},
        "Family-code baseline drifted",
    )
    for row in family_catalog:
        assert_true(row["trust_zone_ref"] in trust_zone_refs, f"Unknown trust zone for {row['runtime_workload_family_ref']}")
        assert_true(bool(row["service_identity_ref"]), f"Missing service identity for {row['runtime_workload_family_ref']}")
        assert_true(bool(row["egress_allowlist_ref"]), f"Missing egress allowlist for {row['runtime_workload_family_ref']}")

    service_bindings = manifest["service_runtime_bindings"]
    service_ids = [row["artifact_id"] for row in service_bindings]
    assert_true(len(service_ids) == len(set(service_ids)), "Service bindings lost uniqueness")
    required_services = {
        "service_api_gateway": "wf_shell_delivery_published_gateway",
        "service_command_api": "wf_command_orchestration",
        "service_projection_worker": "wf_projection_read_models",
        "service_notification_worker": "wf_integration_dispatch",
        "service_adapter_simulators": "wf_integration_simulation_lab",
    }
    for service_id, family_ref in required_services.items():
        binding = next(row for row in service_bindings if row["artifact_id"] == service_id)
        assert_true(
            binding["runtime_workload_family_ref"] == family_ref,
            f"Service binding drifted for {service_id}",
        )

    context_homes = manifest["context_runtime_homes"]
    assert_true(len(context_homes) == EXPECTED_SUMMARY["context_runtime_home_count"], "Context runtime homes drifted")
    required_contexts = {"support", "operations", "governance_admin", "analytics_assurance", "audit_compliance", "release_control"}
    home_contexts = {row["context_code"] for row in context_homes}
    assert_true(required_contexts.issubset(home_contexts), "Explicit platform control contexts lost runtime homes")

    runtime_instances = manifest["runtime_workload_families"]
    runtime_ids = [row["runtime_workload_family_id"] for row in runtime_instances]
    assert_true(len(runtime_ids) == len(set(runtime_ids)), "Runtime workload instance ids lost uniqueness")
    assert_true(
        all(row["runtime_workload_family_ref"] in family_refs for row in runtime_instances),
        "Runtime instances reference unknown family refs",
    )
    by_ring = {}
    for row in runtime_instances:
        by_ring.setdefault(row["environment_ring"], []).append(row)
        assert_true(row["trust_zone_ref"] in trust_zone_refs, f"Runtime instance lost trust zone: {row['runtime_workload_family_id']}")

    expected_ring_counts = {"local": 9, "ci-preview": 9, "integration": 9, "preprod": 16, "production": 16}
    actual_ring_counts = {ring: len(rows) for ring, rows in by_ring.items()}
    assert_true(actual_ring_counts == expected_ring_counts, f"Ring counts drifted: {actual_ring_counts}")
    assert_true(
        not any(
            row["environment_ring"] in {"preprod", "production"}
            and row["runtime_workload_family_ref"] == "wf_integration_simulation_lab"
            for row in runtime_instances
        ),
        "Simulator family must not appear in preprod or production",
    )

    environment_manifests = manifest["environment_manifests"]
    assert_true(len(environment_manifests) == EXPECTED_SUMMARY["environment_manifest_count"], "Environment manifest count drifted")
    env_lookup = {row["environment_ring"]: row for row in environment_manifests}
    for ring, expected_count in expected_ring_counts.items():
        env = env_lookup[ring]
        assert_true(len(env["runtime_workload_family_ids"]) == expected_count, f"Environment family count drifted for {ring}")
        assert_true(bool(env["topology_tuple_hash"]), f"Topology tuple hash missing for {ring}")
    assert_true(env_lookup["production"]["publication_state"] == "pending_release_binding", "Production publication state drifted")
    return manifest


def validate_edges(manifest: dict[str, Any]) -> None:
    rows = load_csv(EDGES_PATH)
    assert_true(len(rows) == EXPECTED_SUMMARY["edge_count"], "Runtime edge count drifted")
    family_types = {}
    for row in manifest["workload_family_catalog"]:
        family_types[row["runtime_workload_family_ref"]] = {
            "family_code": row["family_code"],
            "browser_reachable": row["browser_reachable"],
        }

    edge_ids = {row["edge_id"] for row in rows}
    assert_true(len(edge_ids) == len(rows), "Edge ids lost uniqueness")
    assert_true(
        "rte_local_nonprod_local_gateway_to_command" in edge_ids,
        "Expected local gateway-to-command edge missing",
    )
    assert_true(
        "rte_production_primary_gateway_to_command" in edge_ids,
        "Expected production gateway-to-command edge missing",
    )

    for row in rows:
        source_ref = row["source_runtime_workload_family_ref"]
        target_ref = row["target_runtime_workload_family_ref"]
        source_meta = family_types[source_ref]
        target_meta = family_types[target_ref]
        if source_meta["browser_reachable"] == "yes" and target_meta["family_code"] in {"command", "projection", "integration", "data"}:
            assert_true(
                row["bridge_mode"] == "published_gateway_surface_placeholder" or source_ref == "wf_command_orchestration",
                f"Browser bridge law drifted for edge {row['edge_id']}",
            )

    forbidden_pairs = {
        ("wf_public_edge_ingress", "wf_command_orchestration"),
        ("wf_public_edge_ingress", "wf_projection_read_models"),
        ("wf_public_edge_ingress", "wf_integration_dispatch"),
        ("wf_public_edge_ingress", "wf_data_stateful_plane"),
        ("wf_shell_delivery_static_publication", "wf_command_orchestration"),
        ("wf_shell_delivery_published_gateway", "wf_data_stateful_plane"),
        ("wf_shell_delivery_published_gateway", "wf_integration_dispatch"),
    }
    actual_pairs = {(row["source_runtime_workload_family_ref"], row["target_runtime_workload_family_ref"]) for row in rows}
    assert_true(forbidden_pairs.isdisjoint(actual_pairs), "Forbidden browser-to-core/runtime edges appeared")


def validate_failure_domains(manifest: dict[str, Any]) -> None:
    rows = load_csv(FAILURE_DOMAIN_PATH)
    assert_true(len(rows) == EXPECTED_SUMMARY["failure_domain_count"], "Failure domain row count drifted")
    failure_ids = [row["failure_domain_ref"] for row in rows]
    assert_true(len(failure_ids) == len(set(failure_ids)), "Failure domain ids lost uniqueness")
    runtime_ids = {row["runtime_workload_family_id"] for row in manifest["runtime_workload_families"]}
    assert_true(
        {row["runtime_workload_family_id"] for row in rows} == runtime_ids,
        "Failure domains no longer cover every runtime workload instance",
    )


def validate_workload_payload(manifest: dict[str, Any]) -> None:
    workload_payload = read_json(WORKLOAD_PATH)
    assert_true(workload_payload["task_id"] == "seq_046", "Workload payload task id drifted")
    assert_true(workload_payload["visual_mode"] == "Runtime_Topology_Atlas", "Workload payload visual mode drifted")
    assert_true(
        workload_payload["summary"]["runtime_workload_instance_count"] == EXPECTED_SUMMARY["runtime_workload_instance_count"],
        "Workload payload runtime count drifted",
    )
    assert_true(
        workload_payload["manifest_tuple_hash"] == manifest["manifest_tuple_hash"],
        "Manifest tuple hash drifted between workload and topology payloads",
    )


def validate_docs_and_view(manifest: dict[str, Any]) -> None:
    strategy = STRATEGY_PATH.read_text()
    catalog = CATALOG_PATH.read_text()
    failure_policy = FAILURE_POLICY_PATH.read_text()
    html = ATLAS_PATH.read_text()
    mmd = MMD_PATH.read_text()

    assert_true("59" in strategy, "Strategy doc lost expected runtime counts")
    assert_true("wf_shell_delivery_published_gateway" in catalog, "Catalog doc lost published gateway split")
    assert_true("wf_integration_simulation_lab" in catalog, "Catalog doc lost simulator split")
    assert_true("Egress Allowlist Posture" in failure_policy, "Failure policy doc lost egress section")
    assert_true("<title>46 Runtime Topology Atlas</title>" in html, "Atlas title drifted")
    assert_true("Runtime Topology Atlas" in html, "Atlas lost headline")
    for marker in HTML_MARKERS:
        assert_true(marker in html, f"Atlas missing marker {marker}")
    assert_true("prefers-reduced-motion" in html, "Atlas lost reduced-motion handling")
    assert_true("flowchart LR" in mmd, "Mermaid graph lost flowchart marker")
    assert_true("wf_shell_delivery_published_gateway" in mmd, "Mermaid graph lost published gateway node")
    assert_true("wf_integration_simulation_lab" in mmd, "Mermaid graph lost simulator node")

    package_json = read_json(ROOT_PACKAGE_PATH)
    scripts = package_json.get("scripts", {})
    assert_true(
        scripts.get("validate:runtime-topology") == "python3 ./tools/analysis/validate_runtime_topology_manifest.py",
        "Root package lost runtime-topology validator script",
    )
    assert_true(
        "build_runtime_topology_manifest.py" in scripts.get("codegen", ""),
        "Root codegen no longer regenerates seq_046 outputs",
    )
    assert_true(
        "validate:runtime-topology" in scripts.get("check", ""),
        "Root check script lost runtime-topology validation",
    )
    assert_true(
        "validate:runtime-topology" in scripts.get("bootstrap", ""),
        "Root bootstrap script lost runtime-topology validation",
    )


def main() -> None:
    ensure_deliverables()
    manifest = validate_manifest()
    validate_edges(manifest)
    validate_failure_domains(manifest)
    validate_workload_payload(manifest)
    validate_docs_and_view(manifest)
    print("seq_046 validation passed")


if __name__ == "__main__":
    main()
