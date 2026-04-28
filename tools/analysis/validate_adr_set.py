#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"

REQUIRED_INPUTS = {
    "requirement_registry": DATA_DIR / "requirement_registry.jsonl",
    "product_scope": DATA_DIR / "product_scope_matrix.json",
    "runtime_topology": DATA_DIR / "runtime_workload_families.json",
    "workspace_graph": DATA_DIR / "workspace_package_graph.json",
    "service_runtime": DATA_DIR / "service_runtime_matrix.csv",
    "frontend_stack": DATA_DIR / "frontend_stack_scorecard.csv",
    "tooling_scorecard": DATA_DIR / "tooling_scorecard.csv",
    "supply_chain": DATA_DIR / "supply_chain_and_provenance_matrix.json",
}

DELIVERABLES = [
    DOCS_DIR / "16_adr_index.md",
    DOCS_DIR / "16_target_architecture_adr_set.md",
    DOCS_DIR / "16_system_context_and_container_model.md",
    DOCS_DIR / "16_domain_runtime_and_control_plane_architecture.md",
    DOCS_DIR / "16_frontend_gateway_and_design_contract_architecture.md",
    DOCS_DIR / "16_data_event_storage_and_integration_architecture.md",
    DOCS_DIR / "16_release_assurance_and_resilience_architecture.md",
    DOCS_DIR / "16_architecture_decision_matrix.md",
    DOCS_DIR / "16_architecture_decision_studio.html",
    DOCS_DIR / "16_architecture_views.mmd",
    DATA_DIR / "adr_index.json",
    DATA_DIR / "adr_decision_matrix.csv",
    DATA_DIR / "architecture_contract_binding_matrix.csv",
    DATA_DIR / "architecture_gap_register.json",
]

STUDIO_MARKERS = [
    'data-testid="adr-rail"',
    'data-testid="adr-summary-strip"',
    'data-testid="adr-filter-bar"',
    'data-testid="architecture-canvas"',
    'data-testid="contract-binding-table"',
    'data-testid="adr-inspector"',
    "data-adr-id",
    "data-view-id",
    "data-contract-ref",
]

REQUIRED_FAMILIES = {
    "product_shape",
    "repository_shape",
    "tenant_acting_scope",
    "runtime_topology",
    "gateway_bff",
    "state_and_event",
    "evidence_and_artifact",
    "lifecycle_control",
    "integration",
    "frontend_shell",
    "release_and_trust",
    "assurance_and_resilience",
    "data_privacy_disclosure",
    "bounded_assistive",
}

REQUIRED_VIEW_IDS = {
    "view_system_context",
    "view_container_topology",
    "view_domain_runtime_control_plane",
    "view_frontend_gateway_design_contract",
    "view_data_event_storage_integration",
    "view_release_assurance_resilience",
}

REQUIRED_CONTRACT_REFS = {
    "RuntimeTopologyManifest",
    "GatewayBffSurface",
    "FrontendContractManifest",
    "AudienceSurfaceRuntimeBinding",
    "DesignContractPublicationBundle",
    "RouteIntentBinding",
    "CommandSettlementRecord",
    "ReleaseApprovalFreeze",
    "ChannelReleaseFreezeRecord",
    "AssuranceSliceTrustRecord",
    "ReleaseWatchTuple",
    "WaveObservationPolicy",
    "OperationalReadinessSnapshot",
    "RecoveryControlPosture",
}

REQUIRED_GAP_IDS = {
    "GAP_016_SCATTERED_DECISION_FREEZE",
    "GAP_016_PHASE0_CONTROL_PLANE_LOCALITY",
    "GAP_016_DESIGN_RUNTIME_PUBLICATION_DRIFT",
    "GAP_016_OPS_GOVERNANCE_CONTINUITY_SPLIT",
    "GAP_016_ASSISTIVE_CENTRALITY",
    "GAP_016_TENANT_SCOPE_DRIFT",
    "GAP_016_ARTIFACT_MODE_TRUTH",
    "GAP_016_PATIENT_DEGRADED_ROUTE_LOCALITY",
    "GAP_016_PHASE7_DEFERRED_CHANNEL",
}

REQUIRED_KEY_OBJECTS = {
    "BuildProvenanceRecord",
    "RuntimePublicationBundle",
    "ReleasePublicationParityRecord",
    "ReleaseWatchTuple",
    "OperationalReadinessSnapshot",
}


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def load_json(path: Path) -> Any:
    return json.loads(path.read_text())


def load_csv(path: Path) -> list[dict[str, str]]:
    with path.open() as handle:
        return list(csv.DictReader(handle))


def load_jsonl_count(path: Path) -> int:
    return sum(1 for line in path.read_text().splitlines() if line.strip())


def split_values(value: Any) -> list[str]:
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    if not value:
        return []
    return [item.strip() for item in str(value).split(";") if item.strip()]


def ensure_prerequisites() -> dict[str, Any]:
    for name, path in REQUIRED_INPUTS.items():
        assert_true(path.exists(), f"Missing seq_016 prerequisite {name}: {path}")
    product_scope = load_json(REQUIRED_INPUTS["product_scope"])
    baseline = set(product_scope.get("baseline_phases", []))
    deferred = set(product_scope.get("deferred_phases", []))
    assert_true("phase_7" not in baseline, "seq_016 scope baseline drift: phase_7 entered current baseline")
    assert_true("phase_7" in deferred, "seq_016 scope baseline drift: phase_7 is no longer deferred")
    return {
        "requirement_count": load_jsonl_count(REQUIRED_INPUTS["requirement_registry"]),
        "product_scope": product_scope,
        "runtime_topology": load_json(REQUIRED_INPUTS["runtime_topology"]),
        "workspace_graph": load_json(REQUIRED_INPUTS["workspace_graph"]),
        "supply_chain": load_json(REQUIRED_INPUTS["supply_chain"]),
    }


def ensure_deliverables() -> None:
    missing = [str(path) for path in DELIVERABLES if not path.exists()]
    assert_true(not missing, "Missing seq_016 deliverables:\n" + "\n".join(missing))


def validate_payload(prereqs: dict[str, Any]) -> dict[str, Any]:
    payload = load_json(DATA_DIR / "adr_index.json")
    matrix_rows = load_csv(DATA_DIR / "adr_decision_matrix.csv")
    contract_rows = load_csv(DATA_DIR / "architecture_contract_binding_matrix.csv")
    gap_register = load_json(DATA_DIR / "architecture_gap_register.json")
    studio_html = (DOCS_DIR / "16_architecture_decision_studio.html").read_text()
    mermaid = (DOCS_DIR / "16_architecture_views.mmd").read_text()

    assert_true(len(payload["adrs"]) == len(matrix_rows), "ADR JSON and CSV row counts diverge")
    assert_true(payload["summary"]["adr_count"] == len(payload["adrs"]), "ADR summary count is wrong")
    assert_true(payload["summary"]["contract_binding_count"] == len(contract_rows), "Contract binding count is wrong")

    families = {adr["decision_family"] for adr in payload["adrs"] if adr["status"] == "accepted"}
    assert_true(REQUIRED_FAMILIES.issubset(families), f"Missing required accepted ADR families: {sorted(REQUIRED_FAMILIES - families)}")

    adr_ids = {adr["adr_id"] for adr in payload["adrs"]}
    view_ids = {view["view_id"] for view in payload["views"]}
    assert_true(REQUIRED_VIEW_IDS.issubset(view_ids), f"Missing required architecture views: {sorted(REQUIRED_VIEW_IDS - view_ids)}")

    deferred_phase7 = [
        adr
        for adr in payload["adrs"]
        if adr["status"] == "deferred" and "phase_7" in adr["affected_phase_refs"]
    ]
    assert_true(deferred_phase7, "Missing deferred ADR for phase_7 embedded channel baseline")
    for adr in deferred_phase7:
        assert_true(
            "embedded_nhs_app" in adr["affected_channel_refs"] or "embedded_browser" in adr["affected_channel_refs"],
            "Deferred phase_7 ADR must reference embedded channel posture",
        )

    assistive_adrs = [adr for adr in payload["adrs"] if adr["decision_family"] == "bounded_assistive"]
    assert_true(assistive_adrs and assistive_adrs[0]["status"] == "accepted", "Bounded assistive ADR missing or not accepted")
    assistive_text = (assistive_adrs[0]["decision"] + " " + assistive_adrs[0]["notes"]).lower()
    assert_true("optional" in assistive_text and "sidecar" in assistive_text, "Assistive ADR must keep assistive capability optional and sidecar-bound")

    for adr in payload["adrs"]:
        assert_true(adr["source_refs"], f"{adr['adr_id']} lacks source refs")
        assert_true(adr["linked_requirement_ids"], f"{adr['adr_id']} lacks linked requirement ids")
        assert_true(adr["linked_view_ids"], f"{adr['adr_id']} lacks linked view ids")
        for view_id in adr["linked_view_ids"]:
            assert_true(view_id in view_ids, f"{adr['adr_id']} links unknown view {view_id}")
        if adr["status"] == "accepted":
            assert_true(adr["consequences_positive"] or adr["consequences_negative"], f"{adr['adr_id']} has no consequences")
            assert_true(adr["required_follow_on_task_refs"], f"{adr['adr_id']} has no follow-on tasks")
            assert_true(
                "phase_7" not in adr["affected_phase_refs"],
                f"{adr['adr_id']} reintroduces phase_7 into the accepted baseline",
            )
            assert_true(
                any(task.startswith("seq_") for task in adr["required_follow_on_task_refs"]),
                f"{adr['adr_id']} follow-on tasks are malformed",
            )

    contract_refs = {row["contract_ref"] for row in contract_rows}
    assert_true(REQUIRED_CONTRACT_REFS.issubset(contract_refs), f"Missing required contract bindings: {sorted(REQUIRED_CONTRACT_REFS - contract_refs)}")
    for row in contract_rows:
        assert_true(row["primary_adr_id"] in adr_ids, f"Contract {row['contract_ref']} points at unknown ADR")
        assert_true(row["bound_view_id"] in view_ids, f"Contract {row['contract_ref']} points at unknown view")
        assert_true(row["source_refs"], f"Contract {row['contract_ref']} lacks source refs")
        assert_true(row["binding_law"], f"Contract {row['contract_ref']} lacks binding law")

    all_linked_contracts = {
        contract
        for adr in payload["adrs"]
        for contract in split_values(adr["linked_contract_refs"])
    } | contract_refs
    missing_key_objects = REQUIRED_KEY_OBJECTS - all_linked_contracts
    assert_true(not missing_key_objects, f"ADR set omits key objects carried by seq_011-015 outputs: {sorted(missing_key_objects)}")

    for view in payload["views"]:
        assert_true(view["nodes"], f"{view['view_id']} lacks nodes")
        assert_true(view["edges"], f"{view['view_id']} lacks edges")
        for adr_id in view["linked_adr_ids"]:
            assert_true(adr_id in adr_ids, f"{view['view_id']} references unknown ADR {adr_id}")
        for node in view["nodes"]:
            assert_true(node["adr_id"] in adr_ids, f"{view['view_id']} node {node['node_id']} references unknown ADR")

    accepted_adrs = {adr["adr_id"] for adr in payload["adrs"] if adr["status"] == "accepted"}
    adrs_in_views = {node["adr_id"] for view in payload["views"] for node in view["nodes"]}
    assert_true(accepted_adrs.issubset(adrs_in_views), "At least one accepted ADR is missing from the architecture views")

    issues = gap_register["issues"]
    gap_ids = {issue["issue_id"] for issue in issues}
    assert_true(REQUIRED_GAP_IDS.issubset(gap_ids), f"Gap register is missing mandatory closures: {sorted(REQUIRED_GAP_IDS - gap_ids)}")
    for issue in issues:
        assert_true(issue["linked_adr_ids"], f"Gap {issue['issue_id']} lacks linked ADR ids")
        for adr_id in issue["linked_adr_ids"]:
            assert_true(adr_id in adr_ids, f"Gap {issue['issue_id']} links unknown ADR {adr_id}")

    resolved = {
        issue["issue_id"]
        for issue in issues
        if issue["status"] == "resolved"
    }
    must_be_resolved = REQUIRED_GAP_IDS - {"GAP_016_PHASE7_DEFERRED_CHANNEL"}
    assert_true(must_be_resolved.issubset(resolved), "Not all mandatory architecture closures were resolved")

    for marker in STUDIO_MARKERS:
        assert_true(marker in studio_html, f"Studio HTML missing marker {marker}")
    for view_id in REQUIRED_VIEW_IDS:
        assert_true(view_id in studio_html, f"Studio HTML is missing view marker content for {view_id}")
    assert_true("Architecture_Atelier" in studio_html, "Studio HTML is missing the required visual mode name")
    assert_true("vecells-monogram" in studio_html, "Studio HTML is missing the inline Vecells monogram marker")

    for required_view_id in REQUIRED_VIEW_IDS:
        assert_true(required_view_id in mermaid, f"Mermaid view pack omits {required_view_id}")

    assert_true(
        payload["upstream_input_summary"]["requirement_count"] == prereqs["requirement_count"],
        "ADR payload requirement count drifted from seq_001 output",
    )
    assert_true(
        payload["upstream_input_summary"]["workload_family_count"] == len(prereqs["runtime_topology"]["runtime_workload_families"]),
        "ADR payload workload count drifted from seq_011 output",
    )
    assert_true(
        payload["upstream_input_summary"]["workspace_package_count"] == len(prereqs["workspace_graph"]["workspace_packages"]),
        "ADR payload workspace package count drifted from seq_012 output",
    )
    assert_true(
        payload["upstream_input_summary"]["required_release_object_count"]
        == len(prereqs["supply_chain"]["required_object_bindings"]),
        "ADR payload release object count drifted from seq_015 output",
    )

    return {
        "payload": payload,
        "matrix_rows": matrix_rows,
        "contract_rows": contract_rows,
        "gap_register": gap_register,
    }


def main() -> None:
    prereqs = ensure_prerequisites()
    ensure_deliverables()
    validated = validate_payload(prereqs)
    payload = validated["payload"]
    result = {
        "architecture_freeze_id": payload["architecture_freeze_id"],
        "adr_count": payload["summary"]["adr_count"],
        "accepted_count": payload["summary"]["accepted_count"],
        "deferred_count": payload["summary"]["deferred_count"],
        "contract_binding_count": payload["summary"]["contract_binding_count"],
        "view_count": payload["summary"]["view_count"],
        "gap_issue_count": payload["summary"]["gap_issue_count"],
        "source_digest": payload["summary"]["source_digest"],
    }
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
