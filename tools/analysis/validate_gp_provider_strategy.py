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
    "im1_provider_supplier_register": DATA_DIR / "im1_provider_supplier_register.json",
    "coverage_summary": DATA_DIR / "coverage_summary.json",
}

DELIVERABLES = [
    DOCS_DIR / "36_gp_system_pathways_mock_strategy.md",
    DOCS_DIR / "36_gp_system_pathways_actual_strategy.md",
    DOCS_DIR / "36_booking_capability_evidence_dossier.md",
    DOCS_DIR / "36_gp_provider_gap_and_watch_register.md",
    DOCS_DIR / "36_gp_provider_pathfinder.html",
    DATA_DIR / "gp_principal_system_path_matrix.csv",
    DATA_DIR / "gp_booking_capability_evidence.json",
    DATA_DIR / "gp_provider_decision_register.json",
    DATA_DIR / "gp_provider_sandbox_gap_register.csv",
]

MANDATORY_PATH_IDS = {
    "im1_pairing_optum_emisweb",
    "im1_pairing_tpp_systmone",
    "gp_connect_appointment_management_watch_only",
    "bars_watch_only",
    "local_adapter_simulator_required",
    "manual_practice_handoff_only",
}

HTML_MARKERS = [
    'data-testid="pathfinder-shell"',
    'data-testid="provider-rail"',
    'data-testid="path-matrix"',
    'data-testid="proof-ladder"',
    'data-testid="path-inspector"',
    'data-testid="gap-strip"',
    'data-testid="filter-actor-mode"',
    'data-testid="filter-maturity"',
    'data-testid="filter-proof-class"',
    'data-testid="sort-freshness"',
]

REQUIRED_LIVE_GATES = {
    "LIVE_GATE_PROVIDER_PATH_EVIDENCE_PUBLISHED",
    "LIVE_GATE_APPROVED_PROVIDER_SCORECARDS",
    "LIVE_GATE_ARCHITECTURE_AND_DATA_FLOW_CURRENT",
    "LIVE_GATE_CREDIBLE_BOOKING_MVP",
    "LIVE_GATE_SPONSOR_AND_COMMISSIONING_POSTURE",
    "LIVE_GATE_NAMED_APPROVER_AND_ENVIRONMENT",
    "LIVE_GATE_MUTATION_FLAG_ENABLED",
    "LIVE_GATE_WATCH_REGISTER_CLEAR",
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
    assert_true(not missing, "Missing seq_036 prerequisites: " + ", ".join(sorted(missing)))
    payload = {name: load_json(path) for name, path in REQUIRED_INPUTS.items() if path.suffix == ".json"}
    assert_true(
        payload["coverage_summary"]["summary"]["requirements_with_gaps_count"] == 0,
        "Seq_019 baseline requirement gap count drifted",
    )
    return payload


def ensure_deliverables() -> None:
    missing = [str(path) for path in DELIVERABLES if not path.exists()]
    assert_true(not missing, "Missing seq_036 deliverables:\n" + "\n".join(missing))


def validate_path_matrix(inputs: dict[str, Any]) -> None:
    rows = load_csv(DATA_DIR / "gp_principal_system_path_matrix.csv")
    assert_true(len(rows) == 6, "Path matrix row count drifted")
    path_ids = {row["path_id"] for row in rows}
    assert_true(path_ids == MANDATORY_PATH_IDS, "Mandatory path ids are missing or extra")

    phase0_verdict = inputs["phase0_gate_verdict"]["summary"]["phase0_entry_verdict"]
    assert_true(phase0_verdict == "withheld", "Seq_020 Phase 0 entry verdict drifted")
    im1_register = inputs["im1_provider_supplier_register"]
    targeted_suppliers = {row["provider_supplier_id"] for row in im1_register["providers"] if row["targeted_for_vecells"]}
    assert_true(targeted_suppliers == {"ps_optum_emisweb", "ps_tpp_systmone"}, "Targeted IM1 suppliers drifted")

    by_id = {row["path_id"]: row for row in rows}
    im1_optum = by_id["im1_pairing_optum_emisweb"]
    im1_tpp = by_id["im1_pairing_tpp_systmone"]
    gp_connect = by_id["gp_connect_appointment_management_watch_only"]
    bars = by_id["bars_watch_only"]
    simulator = by_id["local_adapter_simulator_required"]
    manual = by_id["manual_practice_handoff_only"]

    for row in (im1_optum, im1_tpp):
        assert_true(row["maturity"] == "actual_later_gated", f"{row['path_id']} lost actual-later status")
        assert_true(row["proof_class"] == "authoritative_commit_or_read_after_write", f"{row['path_id']} proof class drifted")
        assert_true("BookingConfirmationTruthProjection" in row["exact_proof_object_required"], f"{row['path_id']} lost confirmation truth requirement")
        assert_true("AppointmentRecord" in row["exact_proof_object_required"], f"{row['path_id']} lost AppointmentRecord requirement")

    assert_true(gp_connect["maturity"] == "watch_only", "GP Connect row lost watch-only posture")
    assert_true("paused" in gp_connect["official_status"] or "paused" in gp_connect["watch_summary"], "GP Connect pause posture drifted")
    assert_true(gp_connect["patient_booking_search"] == "not_baseline_for_vecells", "GP Connect patient-search posture drifted")

    assert_true(bars["maturity"] == "watch_only", "BaRS row lost watch-only posture")
    assert_true("principal" in bars["watch_summary"].lower(), "BaRS watch summary drifted away from boundary warning")
    assert_true(bars["patient_booking_search"] == "out_of_scope_for_baseline_principal_gp_booking", "BaRS patient-search posture drifted")

    assert_true(simulator["maturity"] == "mock_now_executable", "Simulator row lost mock-now posture")
    assert_true(simulator["current_execution"] == "required_now", "Simulator current execution drifted")
    assert_true(simulator["proof_class"] == "simulated_authoritative_truth", "Simulator proof class drifted")

    assert_true(manual["maturity"] == "manual_only", "Manual path lost manual-only posture")
    assert_true(manual["patient_booking_search"] == "not_supported", "Manual path unexpectedly widened into patient self-service")
    assert_true("ExternalConfirmationGate" in manual["exact_proof_object_required"], "Manual path lost ExternalConfirmationGate requirement")

    for row in rows:
        assert_true(row["actor_modes"].strip(), f"{row['path_id']} is missing actor modes")
        assert_true(row["slot_freshness_proof"].strip(), f"{row['path_id']} is missing slot freshness proof text")
        assert_true(row["authoritative_commit_proof"].strip(), f"{row['path_id']} is missing authoritative commit proof text")
        assert_true(row["ambiguity_mode"].strip(), f"{row['path_id']} is missing ambiguity mode text")
        assert_true(row["degraded_fallback_mode"].strip(), f"{row['path_id']} is missing degraded fallback text")
        assert_true(row["source_refs"].strip(), f"{row['path_id']} is missing source refs")


def validate_evidence_and_decisions(inputs: dict[str, Any]) -> None:
    evidence = load_json(DATA_DIR / "gp_booking_capability_evidence.json")
    decision_register = load_json(DATA_DIR / "gp_provider_decision_register.json")
    gaps = load_csv(DATA_DIR / "gp_provider_sandbox_gap_register.csv")

    assert_true(evidence["task_id"] == "seq_036", "Evidence pack task id drifted")
    assert_true(evidence["visual_mode"] == "Principal_System_Pathfinder", "Visual mode drifted")
    assert_true(evidence["summary"]["path_count"] == 6, "Evidence pack path count drifted")
    assert_true(evidence["summary"]["capability_dimension_count"] == 13, "Capability dimension count drifted")
    assert_true(evidence["summary"]["canonical_proof_object_count"] == 8, "Canonical proof object count drifted")
    assert_true(evidence["summary"]["proof_class_count"] == 5, "Proof class count drifted")
    assert_true(len(evidence["official_guidance"]) == 5, "Official guidance count drifted")

    proof_classes = {row["proof_class"] for row in evidence["proof_ladders"]}
    assert_true(
        proof_classes
        == {
            "authoritative_commit_or_read_after_write",
            "watch_only_consumer_truth",
            "inter_provider_referral_standard",
            "simulated_authoritative_truth",
            "manual_handoff_acknowledgement",
        },
        "Proof ladder classes drifted",
    )

    assert_true(decision_register["summary"]["path_count"] == 6, "Decision register path count drifted")
    assert_true(decision_register["summary"]["decision_count"] == 7, "Decision count drifted")
    assert_true(decision_register["summary"]["live_gate_count"] == 9, "Live gate count drifted")
    assert_true(decision_register["summary"]["blocked_live_gate_count"] == 6, "Blocked live gate count drifted")
    assert_true(decision_register["summary"]["review_required_gate_count"] == 1, "Review-required gate count drifted")
    assert_true(decision_register["summary"]["gap_row_count"] == 10, "Gap row count drifted")
    assert_true(decision_register["summary"]["phase0_entry_verdict"] == "withheld", "Phase 0 verdict drifted in decision register")
    assert_true(decision_register["summary"]["actual_provider_strategy_state"] == "blocked", "Actual provider strategy drifted open")

    gate_ids = {row["gate_id"] for row in decision_register["live_gates"]}
    assert_true(gate_ids == REQUIRED_LIVE_GATES, "Live gate set drifted")
    required_env = set(decision_register["dry_run_harness"]["required_env"])
    assert_true("ALLOW_REAL_PROVIDER_MUTATION" in required_env, "Dry-run harness lost mutation flag gate")
    assert_true("GP_PROVIDER_NAMED_APPROVER" in required_env, "Dry-run harness lost approver env requirement")
    assert_true("GP_PROVIDER_ENVIRONMENT_TARGET" in required_env, "Dry-run harness lost environment env requirement")

    gp_family = next(
        family
        for family in inputs["provider_family_scorecards"]["families"]
        if family["provider_family"] == "gp_im1_and_booking_supplier"
    )
    assert_true(
        decision_register["scorecard_digest"]["recommended_lane"] == gp_family["recommended_lane"],
        "Scorecard digest drifted from seq_022",
    )

    integration_row = next(
        row
        for row in inputs["integration_priority_matrix"]["integration_families"]
        if row["integration_id"] == "int_local_booking_provider_truth"
    )
    assert_true(
        decision_register["integration_priority_digest"]["mock_now_execution_rank"] == integration_row["mock_now_execution_rank"],
        "Integration priority digest drifted",
    )

    assert_true(len(gaps) == 10, "Gap CSV row count drifted")
    assert_true(any(row["blocks_actual_strategy"] == "yes" for row in gaps), "Gap register lost blocking rows")
    gap_ids = {row["gap_id"] for row in gaps}
    assert_true("GAP_GP_003" in gap_ids and "GAP_GP_005" in gap_ids, "Gap register lost official watch rows")


def validate_markdown_and_html() -> None:
    mock_doc = (DOCS_DIR / "36_gp_system_pathways_mock_strategy.md").read_text()
    actual_doc = (DOCS_DIR / "36_gp_system_pathways_actual_strategy.md").read_text()
    evidence_doc = (DOCS_DIR / "36_booking_capability_evidence_dossier.md").read_text()
    gap_doc = (DOCS_DIR / "36_gp_provider_gap_and_watch_register.md").read_text()
    html = (DOCS_DIR / "36_gp_provider_pathfinder.html").read_text()

    assert_true("## Mock_now_execution" in mock_doc, "Mock strategy doc lost the explicit Mock_now_execution section")
    assert_true("## Actual_provider_strategy_later" in actual_doc, "Actual strategy doc lost the explicit Actual_provider_strategy_later section")
    assert_true("## Canonical proof objects" in evidence_doc, "Evidence dossier lost canonical proof objects section")
    assert_true("## Gap and watch matrix" in gap_doc, "Gap register doc lost gap matrix section")

    for marker in HTML_MARKERS:
        assert_true(marker in html, f"HTML marker missing: {marker}")
    assert_true("Principal System Pathfinder" in html, "HTML title drifted")
    assert_true("GP Provider Path Classification" in html, "HTML heading drifted")
    assert_true("IM1 Pairing / Optum (EMISWeb)" in html, "HTML lost Optum row")
    assert_true("GP Connect Appointment Management / Watch only" in html, "HTML lost GP Connect row")
    assert_true("Local adapter simulator / Required" in html, "HTML lost simulator row")


def main() -> None:
    inputs = ensure_inputs()
    ensure_deliverables()
    validate_path_matrix(inputs)
    validate_evidence_and_decisions(inputs)
    validate_markdown_and_html()
    print("seq_036 validation passed")


if __name__ == "__main__":
    main()
