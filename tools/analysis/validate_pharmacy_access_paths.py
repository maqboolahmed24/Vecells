#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "external"

REQUIRED_INPUTS = {
    "phase0_gate_verdict": DATA_DIR / "phase0_gate_verdict.json",
    "integration_priority_matrix": DATA_DIR / "integration_priority_matrix.json",
    "provider_family_scorecards": DATA_DIR / "provider_family_scorecards.json",
    "external_dependencies": DATA_DIR / "external_dependencies.json",
    "master_risk_register": DATA_DIR / "master_risk_register.json",
    "mesh_execution_pack": DATA_DIR / "mesh_execution_pack.json",
    "gp_provider_decision_register": DATA_DIR / "gp_provider_decision_register.json",
    "coverage_summary": DATA_DIR / "coverage_summary.json",
}

DELIVERABLES = [
    DOCS_DIR / "37_pharmacy_access_paths_mock_strategy.md",
    DOCS_DIR / "37_pharmacy_access_paths_actual_strategy.md",
    DOCS_DIR / "37_directory_and_update_record_decision_pack.md",
    DOCS_DIR / "37_pharmacy_provider_gap_and_watch_register.md",
    DOCS_DIR / "37_pharmacy_route_observatory.html",
    DATA_DIR / "pharmacy_directory_access_matrix.csv",
    DATA_DIR / "pharmacy_update_record_path_matrix.csv",
    DATA_DIR / "pharmacy_referral_transport_decision_register.json",
    DATA_DIR / "pharmacy_provider_assurance_gaps.json",
]

MANDATORY_ROUTE_IDS = {
    "service_search_v3_primary_candidate",
    "dos_urgent_rest_watch_or_supporting_route",
    "eps_dos_supporting_route",
    "dispatch_transport_primary_candidate",
    "gp_update_record_assured_path",
    "mesh_or_transport_observation_dependency",
    "manual_nhsmail_or_phone_fallback",
    "practice_disabled_update_record_fallback",
}

MANDATORY_UPDATE_PATH_IDS = {
    "gp_update_record_assured_path",
    "mesh_or_transport_observation_dependency",
    "practice_disabled_update_record_fallback",
    "manual_nhsmail_or_phone_fallback",
}

HTML_MARKERS = [
    'data-testid="observatory-shell"',
    'data-testid="route-rail"',
    'data-testid="route-matrix"',
    'data-testid="proof-ladder"',
    'data-testid="route-inspector"',
    'data-testid="gap-strip"',
    'data-testid="filter-purpose"',
    'data-testid="filter-maturity"',
    'data-testid="filter-consent"',
    'data-testid="parity-table"',
]

REQUIRED_GATE_IDS = {
    "LIVE_GATE_PHARMACY_PROVIDER_SCORECARDS_APPROVED",
    "LIVE_GATE_PHARMACY_TRANSPORT_SCORECARDS_APPROVED",
    "LIVE_GATE_PHARMACY_MVP_APPROVED",
    "LIVE_GATE_PHARMACY_CONSENT_AND_DISPATCH_MODELS_IMPLEMENTED",
    "LIVE_GATE_PHARMACY_NAMED_APPROVER_AND_ENVIRONMENT",
    "LIVE_GATE_PHARMACY_MUTATION_FLAG_ENABLED",
    "LIVE_GATE_PHARMACY_WATCH_REGISTER_CLEAR",
    "LIVE_GATE_PHARMACY_UPDATE_RECORD_COMBINATION_NAMED",
    "LIVE_GATE_PHARMACY_URGENT_RETURN_OWNERSHIP_REHEARSED",
    "LIVE_GATE_PHASE0_EXTERNAL_FOUNDATION",
}


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def load_json(path: Path) -> Any:
    return json.loads(path.read_text())


def load_csv(path: Path) -> list[dict[str, str]]:
    with path.open() as handle:
        return list(csv.DictReader(handle))


def ensure_inputs() -> dict[str, Any]:
    missing = [name for name, path in REQUIRED_INPUTS.items() if not path.exists()]
    assert_true(not missing, "Missing seq_037 prerequisites: " + ", ".join(sorted(missing)))
    payload = {name: load_json(path) for name, path in REQUIRED_INPUTS.items()}
    assert_true(
        payload["coverage_summary"]["summary"]["requirements_with_gaps_count"] == 0,
        "Seq_019 baseline requirement gap count drifted",
    )
    return payload


def ensure_deliverables() -> None:
    missing = [str(path) for path in DELIVERABLES if not path.exists()]
    assert_true(not missing, "Missing seq_037 deliverables:\n" + "\n".join(missing))


def validate_directory_matrix() -> None:
    rows = load_csv(DATA_DIR / "pharmacy_directory_access_matrix.csv")
    assert_true(len(rows) == 8, "Directory matrix row count drifted")
    route_ids = {row["route_id"] for row in rows}
    assert_true(route_ids == MANDATORY_ROUTE_IDS, "Directory matrix route ids drifted")
    by_id = {row["route_id"]: row for row in rows}

    service_search = by_id["service_search_v3_primary_candidate"]
    assert_true(service_search["maturity"] == "actual_later_gated", "Service Search row lost actual-later posture")
    assert_true("v3" in service_search["official_version_posture"], "Service Search row lost v3 posture")
    assert_true("2 February 2026" in service_search["official_version_posture"], "Service Search row lost deprecation date")
    assert_true(service_search["patient_choice_support"] == "yes_primary_when_choice_proof_current", "Service Search choice posture drifted")

    dos_watch = by_id["dos_urgent_rest_watch_or_supporting_route"]
    assert_true(dos_watch["maturity"] == "watch_only_supporting", "UEC DoS row lost watch-only posture")
    assert_true("urgent" in dos_watch["purpose_class"], "UEC DoS purpose class drifted")
    assert_true("not_referral_send" in dos_watch["urgent_referral_suitability"], "UEC DoS urgent-use boundary drifted")

    eps = by_id["eps_dos_supporting_route"]
    assert_true(eps["maturity"] == "watch_only_supporting", "EPS DoS row lost watch posture")
    assert_true("supporting" in eps["patient_choice_support"], "EPS DoS lost supporting-only posture")

    dispatch = by_id["dispatch_transport_primary_candidate"]
    assert_true("DispatchProofEnvelope" in dispatch["dispatch_proof_requirement"], "Dispatch route lost DispatchProofEnvelope requirement")
    assert_true("ExternalConfirmationGate" in dispatch["dispatch_proof_requirement"], "Dispatch route lost ExternalConfirmationGate requirement")
    assert_true("accepted" in dispatch["acknowledgement_or_expiry_semantics"], "Dispatch route lost acknowledgement semantics")

    update_record = by_id["gp_update_record_assured_path"]
    assert_true(update_record["maturity"] == "actual_later_gated", "Update Record row lost actual-later posture")
    assert_true("never urgent return" in update_record["update_record_eligibility_scope"].lower(), "Update Record row drifted into urgent-return semantics")
    assert_true("not auto-close" in update_record["closure_blocker_implications"].lower(), "Update Record closure blocker drifted")

    mesh_dep = by_id["mesh_or_transport_observation_dependency"]
    assert_true(mesh_dep["maturity"] == "supporting_dependency", "Transport dependency row lost supporting posture")
    assert_true("supporting receipts only" in mesh_dep["dispatch_proof_requirement"].lower(), "Transport dependency drifted toward authoritative proof")

    urgent_manual = by_id["manual_nhsmail_or_phone_fallback"]
    assert_true(urgent_manual["maturity"] == "manual_only", "Manual urgent fallback lost manual-only posture")
    assert_true(urgent_manual["urgent_referral_suitability"] == "yes_manual_only", "Manual urgent fallback lost urgent-only posture")

    disabled_update = by_id["practice_disabled_update_record_fallback"]
    assert_true(disabled_update["maturity"] == "fallback_only", "Practice-disabled fallback lost fallback posture")
    assert_true("disabled" in disabled_update["update_record_eligibility_scope"].lower(), "Practice-disabled fallback lost disabled-route note")


def validate_update_record_matrix() -> None:
    rows = load_csv(DATA_DIR / "pharmacy_update_record_path_matrix.csv")
    assert_true(len(rows) == 4, "Update-record path matrix row count drifted")
    path_ids = {row["path_id"] for row in rows}
    assert_true(path_ids == MANDATORY_UPDATE_PATH_IDS, "Update-record path ids drifted")
    by_id = {row["path_id"]: row for row in rows}

    update_record = by_id["gp_update_record_assured_path"]
    assert_true(update_record["vecells_direct_write"] == "no", "Update Record row drifted into direct-write posture")
    assert_true(update_record["urgent_use"] == "no", "Update Record row drifted into urgent use")
    assert_true("MESH" in update_record["transport_dependency"], "Update Record row lost MESH dependency")

    transport_dep = by_id["mesh_or_transport_observation_dependency"]
    assert_true("supporting" in transport_dep["path_role"], "Transport dependency path role drifted")
    assert_true("cannot close" in transport_dep["closure_policy"], "Transport dependency closure policy drifted")

    manual_visibility = by_id["practice_disabled_update_record_fallback"]
    assert_true("manual" in manual_visibility["path_role"], "Practice-disabled fallback lost manual role")
    assert_true("no auto-close" in manual_visibility["closure_policy"], "Practice-disabled fallback lost no-auto-close law")

    manual_urgent = by_id["manual_nhsmail_or_phone_fallback"]
    assert_true(manual_urgent["urgent_use"] == "yes_manual_only", "Manual urgent path lost urgent-use posture")
    assert_true("reopened request lineage" in manual_urgent["correlation_requirement"], "Manual urgent path correlation drifted")


def validate_json_packs(inputs: dict[str, Any]) -> None:
    decision_register = load_json(DATA_DIR / "pharmacy_referral_transport_decision_register.json")
    gap_register = load_json(DATA_DIR / "pharmacy_provider_assurance_gaps.json")

    assert_true(decision_register["task_id"] == "seq_037", "Decision register task id drifted")
    assert_true(decision_register["visual_mode"] == "Pharmacy_Route_Observatory", "Visual mode drifted")
    assert_true(decision_register["summary"]["route_count"] == 8, "Route count drifted")
    assert_true(decision_register["summary"]["update_record_path_count"] == 4, "Update-record path count drifted")
    assert_true(decision_register["summary"]["discovery_route_count"] == 3, "Discovery route count drifted")
    assert_true(decision_register["summary"]["transport_route_count"] == 2, "Transport route count drifted")
    assert_true(decision_register["summary"]["visibility_route_count"] == 2, "Visibility route count drifted")
    assert_true(decision_register["summary"]["blocking_gap_count"] == 6, "Blocking gap count drifted")
    assert_true(decision_register["summary"]["live_gate_count"] == 10, "Live gate count drifted")
    assert_true(decision_register["summary"]["blocked_live_gate_count"] == 7, "Blocked live gate count drifted")
    assert_true(decision_register["summary"]["review_required_gate_count"] == 1, "Review-required gate count drifted")
    assert_true(decision_register["summary"]["actual_provider_strategy_state"] == "blocked", "Actual provider strategy drifted open")
    assert_true(decision_register["phase0_entry_verdict"] == "withheld", "Phase 0 verdict drifted")

    gate_ids = {row["gate_id"] for row in decision_register["live_gates"]}
    assert_true(gate_ids == REQUIRED_GATE_IDS, "Live gate ids drifted")

    required_env = set(decision_register["dry_run_harness"]["required_env"])
    for env_var in [
        "PHARMACY_ROUTE_ATTEMPT",
        "PHARMACY_MVP_REF",
        "PHARMACY_NAMED_APPROVER",
        "PHARMACY_TARGET_ENVIRONMENT",
        "PHARMACY_UPDATE_RECORD_COMBINATION_REF",
        "PHARMACY_URGENT_RETURN_REHEARSAL_REF",
        "ALLOW_REAL_PROVIDER_MUTATION",
    ]:
        assert_true(env_var in required_env, f"Dry-run harness lost env requirement: {env_var}")

    guidance_ids = {row["source_id"] for row in decision_register["official_guidance"]}
    assert_true(
        guidance_ids
        == {
            "official_service_search_v3",
            "official_service_search_codes",
            "official_uec_rest_api",
            "official_eps_dos_posture",
            "official_gp_connect_update_record",
            "official_gp_connect_programme_news",
        },
        "Official guidance ids drifted",
    )

    directory_integration = next(
        row
        for row in inputs["integration_priority_matrix"]["integration_families"]
        if row["integration_id"] == "int_pharmacy_directory_and_choice"
    )
    assert_true(
        decision_register["integration_priority_digest"]["directory"]["mock_now_execution_rank"]
        == directory_integration["mock_now_execution_rank"],
        "Directory integration digest drifted",
    )
    directory_family = next(
        row
        for row in inputs["provider_family_scorecards"]["families"]
        if row["provider_family"] == "pharmacy_directory"
    )
    assert_true(
        decision_register["scorecard_digest"]["directory"]["recommended_lane"] == directory_family["recommended_lane"],
        "Directory scorecard digest drifted",
    )

    assert_true(gap_register["task_id"] == "seq_037", "Gap register task id drifted")
    assert_true(gap_register["summary"]["gap_count"] == 8, "Gap count drifted")
    assert_true(gap_register["summary"]["blocking_gap_count"] == 6, "Blocking gap count drifted in gap register")
    gap_ids = {row["gap_id"] for row in gap_register["gaps"]}
    assert_true(
        gap_ids
        == {
            "GAP_PHARM_001",
            "GAP_PHARM_002",
            "GAP_PHARM_003",
            "GAP_PHARM_004",
            "GAP_PHARM_005",
            "GAP_PHARM_006",
            "GAP_PHARM_007",
            "GAP_PHARM_008",
        },
        "Gap ids drifted",
    )


def validate_markdown_and_html() -> None:
    mock_doc = (DOCS_DIR / "37_pharmacy_access_paths_mock_strategy.md").read_text()
    actual_doc = (DOCS_DIR / "37_pharmacy_access_paths_actual_strategy.md").read_text()
    decision_doc = (DOCS_DIR / "37_directory_and_update_record_decision_pack.md").read_text()
    gap_doc = (DOCS_DIR / "37_pharmacy_provider_gap_and_watch_register.md").read_text()
    html = (DOCS_DIR / "37_pharmacy_route_observatory.html").read_text()

    assert_true("## Mock_now_execution" in mock_doc, "Mock strategy doc lost Mock_now_execution section")
    assert_true("## Actual_provider_strategy_later" in actual_doc, "Actual strategy doc lost Actual_provider_strategy_later section")
    assert_true("## Decisions" in decision_doc, "Decision pack lost decisions section")
    assert_true("## Gap and watch matrix" in gap_doc, "Gap doc lost gap matrix section")

    for marker in HTML_MARKERS:
        assert_true(marker in html, f"HTML marker missing: {marker}")
    assert_true("Pharmacy Route Observatory" in html, "HTML title drifted")
    assert_true("Discovery" in html and "Choice" in html and "Reconciliation" in html, "Lane diagram labels drifted")
    assert_true("not for urgent use" in html, "HTML lost not-for-urgent-use chips")
    assert_true("manual fallback required" in html, "HTML lost manual-fallback chips")
    assert_true("GP Connect Update Record / assured path" in html, "HTML lost Update Record row")
    assert_true("Service Search v3 / primary candidate" in html, "HTML lost Service Search row")


def main() -> None:
    inputs = ensure_inputs()
    ensure_deliverables()
    validate_directory_matrix()
    validate_update_record_matrix()
    validate_json_packs(inputs)
    validate_markdown_and_html()
    print("seq_037 validation passed")


if __name__ == "__main__":
    main()
