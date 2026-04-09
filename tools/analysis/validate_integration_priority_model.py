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
    "external_dependencies": DATA_DIR / "external_dependencies.json",
    "dependency_watchlist": DATA_DIR / "dependency_watchlist.json",
    "master_risk_register": DATA_DIR / "master_risk_register.json",
    "phase0_gate_verdict": DATA_DIR / "phase0_gate_verdict.json",
    "coverage_summary": DATA_DIR / "coverage_summary.json",
}

DELIVERABLES = [
    DOCS_DIR / "21_integration_priority_and_execution_matrix.md",
    DOCS_DIR / "21_mock_first_vs_actual_later_strategy.md",
    DOCS_DIR / "21_integration_priority_rationale.md",
    DOCS_DIR / "21_mock_live_divergence_register.md",
    DOCS_DIR / "21_external_integration_priority_cockpit.html",
    DATA_DIR / "integration_priority_matrix.csv",
    DATA_DIR / "integration_priority_matrix.json",
    DATA_DIR / "integration_priority_scores.csv",
    DATA_DIR / "mock_live_lane_assignments.json",
    DATA_DIR / "integration_divergence_register.csv",
]

ALLOWED_BASELINE_ROLES = {
    "baseline_required",
    "baseline_mock_required",
    "optional_flagged",
    "deferred_channel",
    "future_optional",
    "prohibited",
}

ALLOWED_IMPACTS = {"none", "low", "medium", "high", "critical"}
ALLOWED_LINEAGE_IMPACTS = {"none", "indirect", "direct"}
ALLOWED_MOCK_FEASIBILITY = {"high", "medium", "low", "unacceptable"}
ALLOWED_LATENCY_BANDS = {"unknown", "short", "medium", "long", "contract_heavy"}
ALLOWED_GATE_BANDS = {"none", "likely", "required"}
ALLOWED_LANES = {"mock_now", "hybrid_mock_then_live", "actual_later", "deferred"}

MANDATORY_FAMILY_IDS = {
    "int_identity_nhs_login_core",
    "int_identity_pds_optional_enrichment",
    "int_telephony_capture_evidence_backplane",
    "int_sms_continuation_delivery",
    "int_email_notification_delivery",
    "int_im1_pairing_and_capability_prereq",
    "int_local_booking_provider_truth",
    "int_cross_org_secure_messaging",
    "int_pharmacy_directory_and_choice",
    "int_pharmacy_dispatch_and_urgent_return",
    "int_pharmacy_outcome_reconciliation",
    "int_nhs_app_embedded_channel",
    "int_assistive_vendor_boundary",
}

REQUIRED_MATRIX_FIELDS = {
    "integration_id",
    "integration_family",
    "integration_name",
    "source_dependency_ids",
    "baseline_role",
    "authoritative_truth_class",
    "patient_safety_impact",
    "control_plane_impact",
    "lineage_or_closure_dependency",
    "channel_dependency_classes",
    "bounded_context_refs",
    "current_mock_feasibility",
    "live_onboarding_latency_band",
    "sponsor_or_assurance_gate",
    "recommended_lane",
    "why_mock_now",
    "why_actual_later",
    "minimum_mock_fidelity",
    "minimum_live_readiness_conditions",
    "later_task_refs",
    "risk_refs",
    "notes",
    "mock_now_execution_score",
    "mock_now_execution_rank",
    "actual_provider_strategy_later_score",
    "actual_provider_strategy_later_rank",
}

HTML_MARKERS = [
    'data-testid="priority-cockpit-shell"',
    'data-testid="priority-filter-rail"',
    'data-testid="priority-quadrant-chart"',
    'data-testid="priority-quadrant-table"',
    'data-testid="priority-lane-board"',
    'data-testid="priority-inspector"',
    'data-testid="priority-divergence-table"',
    'data-testid="priority-task-linkage-table"',
    'data-testid="priority-risk-list"',
]


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def load_json(path: Path) -> Any:
    return json.loads(path.read_text())


def load_csv(path: Path) -> list[dict[str, str]]:
    with path.open() as handle:
        return list(csv.DictReader(handle))


def json_list(cell: str) -> list[Any]:
    return json.loads(cell)


def ensure_inputs() -> dict[str, Any]:
    missing = [name for name, path in REQUIRED_INPUTS.items() if not path.exists()]
    assert_true(not missing, "Missing seq_021 prerequisites: " + ", ".join(sorted(missing)))
    return {
        "external_dependencies": load_json(REQUIRED_INPUTS["external_dependencies"]),
        "dependency_watchlist": load_json(REQUIRED_INPUTS["dependency_watchlist"]),
        "master_risk_register": load_json(REQUIRED_INPUTS["master_risk_register"]),
        "phase0_gate_verdict": load_json(REQUIRED_INPUTS["phase0_gate_verdict"]),
        "coverage_summary": load_json(REQUIRED_INPUTS["coverage_summary"]),
    }


def ensure_deliverables() -> None:
    missing = [str(path) for path in DELIVERABLES if not path.exists()]
    assert_true(not missing, "Missing seq_021 deliverables:\n" + "\n".join(missing))


def validate_payloads(prereqs: dict[str, Any]) -> None:
    matrix_csv = load_csv(DATA_DIR / "integration_priority_matrix.csv")
    scores_csv = load_csv(DATA_DIR / "integration_priority_scores.csv")
    divergence_csv = load_csv(DATA_DIR / "integration_divergence_register.csv")
    payload = load_json(DATA_DIR / "integration_priority_matrix.json")
    lane_assignments = load_json(DATA_DIR / "mock_live_lane_assignments.json")
    html = (DOCS_DIR / "21_external_integration_priority_cockpit.html").read_text()

    assert_true(matrix_csv, "integration_priority_matrix.csv is empty")
    assert_true(scores_csv, "integration_priority_scores.csv is empty")
    assert_true(divergence_csv, "integration_divergence_register.csv is empty")

    families = payload["integration_families"]
    assert_true(len(families) == len(matrix_csv), "Matrix CSV and JSON family counts differ")
    assert_true(payload["summary"]["integration_family_count"] == len(families), "Summary family count drifted")
    assert_true(payload["summary"]["source_dependency_count"] == len(prereqs["external_dependencies"]["dependencies"]), "Source dependency count drifted")
    assert_true(payload["visual_mode"] == "Integration_Constellation_Board", "Visual mode drifted")
    assert_true(payload["summary"]["phase0_entry_verdict"] == "withheld", "Seq_020 gate posture drifted")
    assert_true(prereqs["phase0_gate_verdict"]["gate_verdicts"][0]["verdict"] == "withheld", "Upstream Phase 0 verdict drifted")
    assert_true(prereqs["coverage_summary"]["summary"]["requirements_with_gaps_count"] == 0, "Current baseline traceability gaps reopened")

    integration_ids = set()
    mock_ranks = set()
    live_ranks = set()
    source_dependency_ids = set()

    risk_ids = {row["risk_id"] for row in prereqs["master_risk_register"]["risks"]}
    checklist_task_refs = {f"seq_{idx:03d}" for idx in range(1, 41)}

    by_id = {}
    for row in matrix_csv:
        missing = REQUIRED_MATRIX_FIELDS - set(row)
        assert_true(not missing, f"{row.get('integration_id', 'UNKNOWN')} missing required fields: {sorted(missing)}")
        integration_id = row["integration_id"]
        assert_true(integration_id not in integration_ids, f"Duplicate integration id {integration_id}")
        integration_ids.add(integration_id)
        by_id[integration_id] = row
        assert_true(row["baseline_role"] in ALLOWED_BASELINE_ROLES, f"{integration_id} has invalid baseline role")
        assert_true(row["patient_safety_impact"] in ALLOWED_IMPACTS, f"{integration_id} has invalid patient safety impact")
        assert_true(row["control_plane_impact"] in ALLOWED_IMPACTS, f"{integration_id} has invalid control plane impact")
        assert_true(row["lineage_or_closure_dependency"] in ALLOWED_LINEAGE_IMPACTS, f"{integration_id} has invalid lineage dependency")
        assert_true(row["current_mock_feasibility"] in ALLOWED_MOCK_FEASIBILITY, f"{integration_id} has invalid mock feasibility")
        assert_true(row["live_onboarding_latency_band"] in ALLOWED_LATENCY_BANDS, f"{integration_id} has invalid latency band")
        assert_true(row["sponsor_or_assurance_gate"] in ALLOWED_GATE_BANDS, f"{integration_id} has invalid sponsor gate")
        assert_true(row["recommended_lane"] in ALLOWED_LANES, f"{integration_id} has invalid lane")
        assert_true(row["why_mock_now"].strip(), f"{integration_id} is missing why_mock_now")
        assert_true(row["why_actual_later"].strip(), f"{integration_id} is missing why_actual_later")
        assert_true(row["minimum_mock_fidelity"].strip(), f"{integration_id} is missing minimum_mock_fidelity")
        source_ids = json_list(row["source_dependency_ids"])
        later_task_refs = json_list(row["later_task_refs"])
        risk_refs = json_list(row["risk_refs"])
        source_dependency_ids.update(source_ids)
        assert_true(source_ids, f"{integration_id} has no source dependency ids")
        assert_true(later_task_refs, f"{integration_id} has no later task refs")
        for task_ref in later_task_refs:
            assert_true(task_ref in checklist_task_refs, f"{integration_id} references invalid task {task_ref}")
        for risk_ref in risk_refs:
            assert_true(risk_ref in risk_ids, f"{integration_id} references unknown risk {risk_ref}")
        mock_rank = int(row["mock_now_execution_rank"])
        live_rank = int(row["actual_provider_strategy_later_rank"])
        assert_true(mock_rank not in mock_ranks, f"Duplicate mock rank {mock_rank}")
        assert_true(live_rank not in live_ranks, f"Duplicate live rank {live_rank}")
        mock_ranks.add(mock_rank)
        live_ranks.add(live_rank)
        assert_true(int(row["mock_now_execution_score"]) > 0, f"{integration_id} has non-positive mock score")
        assert_true(int(row["actual_provider_strategy_later_score"]) > 0, f"{integration_id} has non-positive live score")

    assert_true(MANDATORY_FAMILY_IDS.issubset(integration_ids), "Mandatory integration families are missing")
    expected_dependency_ids = {row["dependency_id"] for row in prereqs["external_dependencies"]["dependencies"]}
    assert_true(source_dependency_ids == expected_dependency_ids, "Source dependency coverage drifted away from seq_008 inventory")

    assert_true(len(scores_csv) == len(matrix_csv) * 2, "Score CSV should contain exactly two rows per integration")
    score_modes = {row["score_mode"] for row in scores_csv}
    assert_true(score_modes == {"mock_now_execution", "actual_provider_strategy_later"}, "Unexpected score modes present")

    lane_ids = set(lane_assignments["integration_lanes"])
    assert_true(lane_ids == integration_ids, "Lane assignments drifted from the matrix")
    task_link_refs = {row["task_ref"] for row in payload["task_links"]}
    for required_task in {f"seq_{idx:03d}" for idx in range(22, 41)}:
        assert_true(required_task in task_link_refs, f"Task linkage table omitted {required_task}")

    nhs_login = by_id["int_identity_nhs_login_core"]
    pds = by_id["int_identity_pds_optional_enrichment"]
    im1 = by_id["int_im1_pairing_and_capability_prereq"]
    email = by_id["int_email_notification_delivery"]
    sms = by_id["int_sms_continuation_delivery"]
    booking = by_id["int_local_booking_provider_truth"]
    pharmacy_dispatch = by_id["int_pharmacy_dispatch_and_urgent_return"]
    pharmacy_outcome = by_id["int_pharmacy_outcome_reconciliation"]
    nhs_app = by_id["int_nhs_app_embedded_channel"]
    assistive = by_id["int_assistive_vendor_boundary"]

    assert_true(int(nhs_login["mock_now_execution_rank"]) < int(pds["mock_now_execution_rank"]), "PDS outranked NHS login in mock ranking")
    assert_true(int(nhs_login["actual_provider_strategy_later_rank"]) < int(pds["actual_provider_strategy_later_rank"]), "PDS outranked NHS login in live ranking")
    assert_true(int(nhs_login["actual_provider_strategy_later_rank"]) <= int(im1["actual_provider_strategy_later_rank"]), "IM1 outranked NHS login in live ranking")
    assert_true("critical path" in im1["notes"].lower(), "IM1 row no longer records the Phase 2 critical-path exception")
    assert_true(email["recommended_lane"] in {"mock_now", "hybrid_mock_then_live"}, "Email rail lost its mock-first posture")
    assert_true(int(email["mock_now_execution_rank"]) > int(booking["mock_now_execution_rank"]), "Email outranked booking truth in mock ranking")
    assert_true(int(email["mock_now_execution_rank"]) > int(pharmacy_dispatch["mock_now_execution_rank"]), "Email outranked pharmacy dispatch truth in mock ranking")
    assert_true(int(sms["mock_now_execution_rank"]) > int(pharmacy_outcome["mock_now_execution_rank"]), "SMS outranked pharmacy outcome truth in mock ranking")
    assert_true(nhs_app["baseline_role"] == "deferred_channel" and nhs_app["recommended_lane"] == "deferred", "NHS App lost deferred posture")
    assert_true(assistive["baseline_role"] == "future_optional" and assistive["recommended_lane"] == "deferred", "Assistive family lost optional posture")

    for integration_id in (
        "int_local_booking_provider_truth",
        "int_cross_org_secure_messaging",
        "int_pharmacy_dispatch_and_urgent_return",
        "int_pharmacy_outcome_reconciliation",
    ):
        fidelity = by_id[integration_id]["minimum_mock_fidelity"].lower()
        assert_true("proof" in fidelity or "confirmation" in fidelity, f"{integration_id} lost proof language in mock fidelity")
        assert_true("fallback" in fidelity or "reopen" in fidelity or "ambigu" in fidelity, f"{integration_id} lost fallback or ambiguity language in mock fidelity")

    for row in matrix_csv:
        if row["recommended_lane"] == "deferred":
            assert_true(
                row["baseline_role"] in {"deferred_channel", "future_optional"},
                f"{row['integration_id']} uses deferred lane without deferred/future baseline role",
            )

    assert_true(payload["summary"]["lane_counts"]["deferred"] == 2, "Deferred lane count drifted")
    assert_true(payload["summary"]["baseline_role_counts"]["optional_flagged"] == 2, "Optional-flagged count drifted")

    for marker in HTML_MARKERS:
        assert_true(marker in html, f"HTML cockpit missing marker {marker}")
    assert_true("Integration_Constellation_Board" in html, "HTML cockpit lost visual mode label")
    assert_true("@media (prefers-reduced-motion: reduce)" in html, "HTML cockpit lacks reduced-motion support")
    remote_asset_tokens = ['src="http://', 'src="https://', "src='http://", "src='https://", 'href="http://', 'href="https://', "href='http://", "href='https://", "url(http://", "url(https://"]
    assert_true(not any(token in html for token in remote_asset_tokens), "HTML cockpit pulls remote assets")


def main() -> None:
    prereqs = ensure_inputs()
    ensure_deliverables()
    validate_payloads(prereqs)


if __name__ == "__main__":
    main()
