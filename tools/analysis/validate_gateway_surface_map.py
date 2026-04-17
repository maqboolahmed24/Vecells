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

TRUST_BOUNDARY_PATH = DATA_DIR / "trust_zone_boundaries.json"
GATEWAY_SURFACE_PATH = DATA_DIR / "gateway_bff_surfaces.json"
ROUTE_MATRIX_PATH = DATA_DIR / "gateway_route_family_matrix.csv"
CONTRACT_MATRIX_PATH = DATA_DIR / "gateway_surface_contract_matrix.csv"
RUNTIME_MANIFEST_PATH = DATA_DIR / "runtime_topology_manifest.json"
ROUTE_INVENTORY_PATH = DATA_DIR / "route_family_inventory.csv"
ROOT_PACKAGE_PATH = ROOT / "package.json"
STRATEGY_PATH = DOCS_DIR / "47_trust_zone_boundary_strategy.md"
SURFACE_MAP_PATH = DOCS_DIR / "47_gateway_surface_map.md"
DECISION_PATH = DOCS_DIR / "47_gateway_surface_split_decisions.md"
STUDIO_PATH = DOCS_DIR / "47_trust_zone_and_gateway_studio.html"
GRAPH_PATH = DOCS_DIR / "47_trust_zone_gateway_graph.mmd"
SPEC_PATH = TESTS_DIR / "gateway-surface-studio.spec.js"

EXPECTED_TRUST_SUMMARY = {
    "trust_zone_count": 7,
    "boundary_count": 20,
    "allowed_boundary_count": 10,
    "blocked_boundary_count": 10,
}

EXPECTED_GATEWAY_SUMMARY = {
    "gateway_surface_count": 22,
    "candidate_group_count": 9,
    "route_family_count": 20,
    "primary_route_owner_count": 20,
    "secondary_route_exception_count": 3,
    "browser_visible_route_coverage_percent": 100,
    "assurance_surface_count": 5,
    "contract_matrix_count": 22,
}

HTML_MARKERS = [
    'data-testid="boundary-masthead"',
    'data-testid="filter-zone"',
    'data-testid="filter-audience"',
    'data-testid="filter-shell"',
    'data-testid="filter-route"',
    'data-testid="filter-defect"',
    'data-testid="gateway-list"',
    'data-testid="boundary-list"',
    'data-testid="map-canvas"',
    'data-testid="lane-diagram"',
    'data-testid="inspector"',
    'data-testid="route-matrix"',
    'data-testid="boundary-matrix"',
    'data-testid="split-strip"',
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


def split_list(value: str) -> list[str]:
    return [item.strip() for item in value.split(";") if item.strip()]


def ensure_deliverables() -> None:
    required = [
        TRUST_BOUNDARY_PATH,
        GATEWAY_SURFACE_PATH,
        ROUTE_MATRIX_PATH,
        CONTRACT_MATRIX_PATH,
        STRATEGY_PATH,
        SURFACE_MAP_PATH,
        DECISION_PATH,
        STUDIO_PATH,
        GRAPH_PATH,
        SPEC_PATH,
        ROOT_PACKAGE_PATH,
    ]
    missing = [str(path) for path in required if not path.exists()]
    assert_true(not missing, "Missing seq_047 deliverables:\n" + "\n".join(missing))


def validate_trust_payload(runtime_manifest: dict[str, Any]) -> dict[str, Any]:
    payload = read_json(TRUST_BOUNDARY_PATH)
    assert_true(payload["task_id"] == "seq_047", "Trust payload task id drifted")
    assert_true(payload["visual_mode"] == "Boundary_Studio", "Trust payload visual mode drifted")
    for key, expected in EXPECTED_TRUST_SUMMARY.items():
        assert_true(payload["summary"][key] == expected, f"Trust summary drifted for {key}")

    runtime_family_refs = {
        row["runtime_workload_family_ref"] for row in runtime_manifest["workload_family_catalog"]
    }
    zone_refs = {row["trust_zone_ref"] for row in runtime_manifest["trust_zones"]}
    boundary_ids = []
    allowed_count = 0
    blocked_count = 0
    for row in payload["trust_zone_boundaries"]:
        boundary_ids.append(row["trustZoneBoundaryId"])
        assert_true(
            row["sourceTrustZoneRef"] in zone_refs and row["targetTrustZoneRef"] in zone_refs,
            f"Unknown trust zone on boundary {row['trustZoneBoundaryId']}",
        )
        assert_true(
            set(row["sourceWorkloadFamilyRefs"]).issubset(runtime_family_refs),
            f"Unknown source workload family on {row['trustZoneBoundaryId']}",
        )
        assert_true(
            set(row["targetWorkloadFamilyRefs"]).issubset(runtime_family_refs),
            f"Unknown target workload family on {row['trustZoneBoundaryId']}",
        )
        assert_true(bool(row["validatedAt"]), f"validatedAt missing on {row['trustZoneBoundaryId']}")
        assert_true(bool(row["source_refs"]), f"source refs missing on {row['trustZoneBoundaryId']}")
        if row["boundaryState"] == "allowed":
            allowed_count += 1
        if row["boundaryState"] == "blocked":
            blocked_count += 1
            assert_true(
                row["tenantTransferMode"] == "forbidden",
                f"Blocked boundary {row['trustZoneBoundaryId']} lost forbidden tenant posture",
            )
    assert_true(len(boundary_ids) == len(set(boundary_ids)), "Boundary ids lost uniqueness")
    assert_true(allowed_count == 10 and blocked_count == 10, "Allowed or blocked boundary counts drifted")
    return payload


def validate_gateway_payload(runtime_manifest: dict[str, Any]) -> dict[str, Any]:
    payload = read_json(GATEWAY_SURFACE_PATH)
    assert_true(payload["task_id"] == "seq_047", "Gateway payload task id drifted")
    assert_true(payload["visual_mode"] == "Boundary_Studio", "Gateway payload visual mode drifted")
    for key, expected in EXPECTED_GATEWAY_SUMMARY.items():
        assert_true(payload["summary"][key] == expected, f"Gateway summary drifted for {key}")

    boundary_refs = {
        row["trustZoneBoundaryId"] for row in read_json(TRUST_BOUNDARY_PATH)["trust_zone_boundaries"]
    }
    surfaces = payload["gateway_surfaces"]
    surface_ids = [row["surfaceId"] for row in surfaces]
    assert_true(len(surface_ids) == len(set(surface_ids)), "Gateway surface ids lost uniqueness")
    allowed_downstream = {
        "wf_projection_read_models",
        "wf_command_orchestration",
        "wf_assurance_security_control",
    }
    for row in surfaces:
        assert_true(
            row["entryWorkloadFamilyRef"] == "wf_shell_delivery_published_gateway",
            f"Surface {row['surfaceId']} lost gateway entry family",
        )
        assert_true(
            set(row["downstreamWorkloadFamilyRefs"]).issubset(allowed_downstream),
            f"Surface {row['surfaceId']} declared forbidden downstream workload",
        )
        assert_true(
            set(row["trustZoneBoundaryRefs"]).issubset(boundary_refs),
            f"Surface {row['surfaceId']} references unknown trust boundary",
        )
        assert_true(bool(row["surfaceAuthorityTupleHash"]), f"Surface hash missing for {row['surfaceId']}")
        assert_true(bool(row["runtimePublicationBundleRef"]), f"Runtime publication ref missing for {row['surfaceId']}")
        assert_true(bool(row["openApiRef"]), f"OpenAPI ref missing for {row['surfaceId']}")
        assert_true(bool(row["cachePolicyRef"]), f"Cache policy missing for {row['surfaceId']}")
        assert_true(bool(row["sessionPolicyRef"]), f"Session policy missing for {row['surfaceId']}")
        assert_true(
            set(row["mutatingBoundedContextRefs"]).issubset(set(row["servedBoundedContextRefs"])),
            f"Mutating contexts drifted outside served contexts for {row['surfaceId']}",
        )
        assert_true(
            row["source_refs"],
            f"Source refs missing for {row['surfaceId']}",
        )
        assert_true(
            "tzb_public_edge_to_published_gateway" in row["trustZoneBoundaryRefs"],
            f"Surface {row['surfaceId']} lost browser-to-gateway boundary",
        )
        if "wf_assurance_security_control" in row["downstreamWorkloadFamilyRefs"]:
            assert_true(
                "tzb_published_gateway_to_assurance_security" in row["trustZoneBoundaryRefs"],
                f"Surface {row['surfaceId']} reaches assurance without the assurance boundary",
            )
    return payload


def validate_route_matrix(route_inventory: list[dict[str, str]], gateway_payload: dict[str, Any]) -> None:
    rows = load_csv(ROUTE_MATRIX_PATH)
    route_ids = [row["route_family_id"] for row in route_inventory]
    matrix_route_ids = {row["route_family_id"] for row in rows}
    assert_true(matrix_route_ids == set(route_ids), "Route matrix no longer covers every route family")
    primary_counts: dict[str, int] = {}
    browser_visible_primary: set[str] = set()
    browser_visible_inventory = {
        row["route_family_id"]
        for row in rows
        if row["browser_visible"] == "yes"
    }
    for row in rows:
        primary_counts[row["route_family_id"]] = primary_counts.get(row["route_family_id"], 0) + (
            1 if row["ownership_role"] == "primary" else 0
        )
        if row["ownership_role"] != "primary":
            assert_true(
                bool(row["explicit_exception_ref"]),
                f"Secondary route ownership lost explicit exception for {row['gateway_surface_id']}",
            )
        if row["ownership_role"] == "primary" and row["browser_visible"] == "yes":
            browser_visible_primary.add(row["route_family_id"])
    for route_id in route_ids:
        assert_true(primary_counts.get(route_id, 0) == 1, f"Route {route_id} lost unique primary ownership")
    assert_true(
        browser_visible_primary == browser_visible_inventory,
        "Browser-visible route coverage drifted",
    )

    expected_secondary = {
        "EXC_ROUTE_STAFF_WORKSPACE_PRACTICE_OPS_VARIANT",
        "EXC_ROUTE_STAFF_CHILD_ASSISTIVE_SIDE_CAR",
        "EXC_ROUTE_SUPPORT_TICKET_ASSISTED_CAPTURE",
    }
    actual_secondary = {row["explicit_exception_ref"] for row in rows if row["explicit_exception_ref"]}
    assert_true(actual_secondary == expected_secondary, "Secondary route exception set drifted")

    surface_ids = {row["surfaceId"] for row in gateway_payload["gateway_surfaces"]}
    assert_true(
        {row["gateway_surface_id"] for row in rows}.issubset(surface_ids),
        "Route matrix references unknown surfaces",
    )


def validate_contract_matrix(gateway_payload: dict[str, Any]) -> None:
    rows = load_csv(CONTRACT_MATRIX_PATH)
    assert_true(len(rows) == 22, "Contract matrix row count drifted")
    surface_ids = {row["surfaceId"] for row in gateway_payload["gateway_surfaces"]}
    assert_true(
        {row["surface_id"] for row in rows} == surface_ids,
        "Contract matrix no longer covers every surface",
    )
    for row in rows:
        assert_true(bool(row["served_bounded_context_refs"]), f"Served contexts missing for {row['surface_id']}")
        assert_true(bool(row["required_context_boundary_refs"]), f"Context boundaries missing for {row['surface_id']}")
        assert_true(bool(row["surface_authority_tuple_hash"]), f"Tuple hash missing for {row['surface_id']}")
        assert_true(
            "tzb_public_edge_to_published_gateway" in split_list(row["trust_zone_boundary_refs"]),
            f"Surface contract row {row['surface_id']} lost browser boundary",
        )


def validate_docs_and_view() -> None:
    strategy = STRATEGY_PATH.read_text()
    surface_map = SURFACE_MAP_PATH.read_text()
    decisions = DECISION_PATH.read_text()
    html = STUDIO_PATH.read_text()
    graph = GRAPH_PATH.read_text()
    package_json = read_json(ROOT_PACKAGE_PATH)

    assert_true("20" in strategy, "Strategy doc lost expected boundary counts")
    assert_true("gws_patient_requests" in surface_map, "Surface map doc lost patient requests surface")
    assert_true("DEC_047_OPS_VS_GOVERNANCE" in decisions, "Split decision doc lost governance split")
    assert_true("<title>47 Trust Zone And Gateway Studio</title>" in html, "Studio title drifted")
    for marker in HTML_MARKERS:
        assert_true(marker in html, f"Studio lost HTML marker {marker}")
    assert_true("gws_governance_shell" in graph, "Mermaid graph lost governance shell node")

    scripts = package_json["scripts"]
    assert_true(
        "build_gateway_surface_map.py" in scripts["codegen"],
        "Root codegen lost seq_047 builder wiring",
    )
    assert_true(
        scripts["validate:gateway-surface"] == "python3 ./tools/analysis/validate_gateway_surface_map.py",
        "Root validate:gateway-surface script drifted",
    )
    assert_true(
        "validate:gateway-surface" in scripts["bootstrap"]
        and "validate:gateway-surface" in scripts["check"],
        "Root bootstrap/check lost gateway validation",
    )


def main() -> None:
    ensure_deliverables()
    runtime_manifest = read_json(RUNTIME_MANIFEST_PATH)
    route_inventory = load_csv(ROUTE_INVENTORY_PATH)
    validate_trust_payload(runtime_manifest)
    gateway_payload = validate_gateway_payload(runtime_manifest)
    validate_route_matrix(route_inventory, gateway_payload)
    validate_contract_matrix(gateway_payload)
    validate_docs_and_view()


if __name__ == "__main__":
    main()
