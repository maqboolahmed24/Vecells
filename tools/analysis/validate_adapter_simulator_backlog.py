#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "external"
SERVICES_DIR = ROOT / "services" / "adapter-simulators" / "manifests"

REQUIRED_INPUTS = {
    "phase0_gate_verdict": DATA_DIR / "phase0_gate_verdict.json",
    "coverage_summary": DATA_DIR / "coverage_summary.json",
    "external_dependencies": DATA_DIR / "external_dependencies.json",
    "integration_priority_matrix": DATA_DIR / "integration_priority_matrix.json",
    "provider_family_scorecards": DATA_DIR / "provider_family_scorecards.json",
    "master_risk_register": DATA_DIR / "master_risk_register.json",
    "nhs_login_capture_pack": DATA_DIR / "nhs_login_capture_pack.json",
    "im1_pairing_pack": DATA_DIR / "im1_pairing_pack.json",
    "pds_access_pack": DATA_DIR / "pds_access_pack.json",
    "mesh_execution_pack": DATA_DIR / "mesh_execution_pack.json",
    "telephony_lab_pack": DATA_DIR / "32_telephony_lab_pack.json",
    "notification_studio_pack": DATA_DIR / "33_notification_studio_pack.json",
    "evidence_processing_lab_pack": DATA_DIR / "35_evidence_processing_lab_pack.json",
    "gp_provider_decision_register": DATA_DIR / "gp_provider_decision_register.json",
    "pharmacy_referral_transport_decision_register": DATA_DIR / "pharmacy_referral_transport_decision_register.json",
    "nhs_app_live_gate_checklist": DATA_DIR / "nhs_app_live_gate_checklist.json",
}

DELIVERABLES = [
    DOCS_DIR / "38_local_adapter_simulator_backlog.md",
    DOCS_DIR / "38_local_adapter_simulator_execution_order.md",
    DOCS_DIR / "38_real_provider_delta_register.md",
    DOCS_DIR / "38_simulator_fidelity_policy.md",
    DOCS_DIR / "38_simulator_backlog_studio.html",
    DATA_DIR / "adapter_simulator_backlog.csv",
    DATA_DIR / "adapter_simulator_priority_scores.json",
    DATA_DIR / "adapter_simulator_contract_manifest.json",
    DATA_DIR / "adapter_real_provider_gap_map.json",
    SERVICES_DIR / "README.md",
]

MANDATORY_SIMULATOR_IDS = {
    "sim_pharmacy_dispatch_transport_twin",
    "sim_nhs_login_auth_session_twin",
    "sim_booking_provider_confirmation_twin",
    "sim_telephony_ivr_twin",
    "sim_pharmacy_visibility_update_record_twin",
    "sim_mesh_message_path_twin",
    "sim_booking_capacity_feed_twin",
    "sim_im1_principal_system_emis_twin",
    "sim_im1_principal_system_tpp_twin",
    "sim_pharmacy_directory_choice_twin",
    "sim_email_notification_twin",
    "sim_support_replay_resend_twin",
    "sim_sms_delivery_twin",
    "sim_transcription_processing_twin",
    "sim_malware_artifact_scan_twin",
    "sim_nhs_app_embedded_bridge_twin",
    "sim_optional_pds_enrichment_twin",
}

HTML_MARKERS = [
    'data-testid="studio-shell"',
    'data-testid="filter-rail"',
    'data-testid="backlog-table"',
    'data-testid="fidelity-legend"',
    'data-testid="simulator-inspector"',
    'data-testid="execution-strip"',
    'data-testid="filter-priority"',
    'data-testid="filter-fidelity"',
    'data-testid="filter-phase"',
    'data-testid="filter-family"',
    'data-testid="parity-table"',
]


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def load_json(path: Path) -> Any:
    return json.loads(path.read_text())


def load_csv(path: Path) -> list[dict[str, str]]:
    with path.open() as handle:
        return list(csv.DictReader(handle))


def ensure_inputs() -> None:
    missing = [name for name, path in REQUIRED_INPUTS.items() if not path.exists()]
    assert_true(not missing, "Missing seq_038 prerequisites: " + ", ".join(sorted(missing)))
    coverage = load_json(REQUIRED_INPUTS["coverage_summary"])
    assert_true(
        coverage["summary"]["requirements_with_gaps_count"] == 0,
        "Seq_019 coverage summary drifted; seq_038 requires zero requirement gaps",
    )


def ensure_deliverables() -> None:
    missing = [str(path) for path in DELIVERABLES if not path.exists()]
    assert_true(not missing, "Missing seq_038 deliverables:\n" + "\n".join(missing))


def validate_manifest() -> dict[str, Any]:
    manifest = load_json(DATA_DIR / "adapter_simulator_contract_manifest.json")
    rows = manifest["simulators"]
    simulator_ids = {row["simulator_id"] for row in rows}

    assert_true(manifest["task_id"] == "seq_038", "Manifest task id drifted")
    assert_true(manifest["visual_mode"] == "Simulator_Foundry_Board", "Manifest visual mode drifted")
    assert_true(manifest["phase0_entry_verdict"] == "withheld", "Phase 0 verdict drifted")
    assert_true(simulator_ids == MANDATORY_SIMULATOR_IDS, "Simulator id set drifted")

    summary = manifest["summary"]
    assert_true(summary["simulator_count"] == 17, "Simulator count drifted")
    assert_true(summary["baseline_critical_count"] == 14, "Baseline critical count drifted")
    assert_true(summary["proof_twin_count"] == 4, "Proof-twin count drifted")
    assert_true(summary["fault_injection_twin_count"] == 3, "Fault-injection count drifted")
    assert_true(summary["near_live_contract_twin_count"] == 5, "Near-live count drifted")
    assert_true(summary["replace_with_live_guarded_count"] == 2, "Replace-with-live count drifted")
    assert_true(summary["hybrid_contract_twin_count"] == 13, "Hybrid count drifted")
    assert_true(summary["permanent_fallback_count"] == 2, "Permanent fallback count drifted")
    assert_true(summary["execution_phase_count"] == 4, "Execution phase count drifted")

    rows_by_id = {row["simulator_id"]: row for row in rows}
    assert_true(rows_by_id["sim_pharmacy_dispatch_transport_twin"]["priority_rank"] == 1, "Dispatch twin lost top priority rank")
    assert_true(
        rows_by_id["sim_pharmacy_dispatch_transport_twin"]["minimum_fidelity_class"] == "near-live_contract_twin",
        "Dispatch twin fidelity drifted",
    )
    assert_true(
        "PharmacyDispatchEnvelope" in rows_by_id["sim_pharmacy_dispatch_transport_twin"]["authoritative_proof_semantics"],
        "Dispatch twin lost PharmacyDispatchEnvelope",
    )
    assert_true(
        rows_by_id["sim_nhs_login_auth_session_twin"]["minimum_fidelity_class"] == "proof_twin",
        "NHS login twin fidelity drifted",
    )
    assert_true(
        "SessionEstablishmentDecision"
        in rows_by_id["sim_nhs_login_auth_session_twin"]["authoritative_proof_semantics"],
        "NHS login twin lost session proof",
    )
    assert_true(
        rows_by_id["sim_support_replay_resend_twin"]["permanent_fallback"] is True,
        "Support replay twin lost permanent-fallback posture",
    )
    assert_true(
        rows_by_id["sim_support_replay_resend_twin"]["replacement_mode"] == "permanent_fallback",
        "Support replay twin replacement mode drifted",
    )
    assert_true(
        rows_by_id["sim_pharmacy_directory_choice_twin"]["replacement_mode"] == "replace_with_live_guarded",
        "Pharmacy directory twin replacement posture drifted",
    )
    assert_true(
        rows_by_id["sim_optional_pds_enrichment_twin"]["priority_tier"] == "watch",
        "Optional PDS twin priority tier drifted",
    )

    matrix = manifest["priority_fidelity_matrix"]
    matrix_ids = {row["fidelity_class"] for row in matrix}
    assert_true(
        matrix_ids == {"workflow_twin", "proof_twin", "fault_injection_twin", "near-live_contract_twin"},
        "Priority/fidelity matrix classes drifted",
    )
    return manifest


def validate_csv(manifest: dict[str, Any]) -> None:
    rows = load_csv(DATA_DIR / "adapter_simulator_backlog.csv")
    assert_true(len(rows) == manifest["summary"]["simulator_count"], "CSV row count drifted")
    csv_ids = {row["simulator_id"] for row in rows}
    assert_true(csv_ids == MANDATORY_SIMULATOR_IDS, "CSV simulator ids drifted")

    rows_by_id = {row["simulator_id"]: row for row in rows}
    assert_true(rows_by_id["sim_pharmacy_dispatch_transport_twin"]["priority_rank"] == "1", "CSV priority rank drifted")
    assert_true(
        rows_by_id["sim_nhs_login_auth_session_twin"]["minimum_fidelity_class"] == "proof_twin",
        "CSV NHS login fidelity drifted",
    )
    assert_true(
        rows_by_id["sim_support_replay_resend_twin"]["permanent_fallback"] == "yes",
        "CSV support replay fallback posture drifted",
    )
    assert_true(
        rows_by_id["sim_optional_pds_enrichment_twin"]["priority_tier"] == "watch",
        "CSV PDS priority tier drifted",
    )


def validate_priority_scores(manifest: dict[str, Any]) -> None:
    payload = load_json(DATA_DIR / "adapter_simulator_priority_scores.json")
    assert_true(payload["task_id"] == "seq_038", "Priority score task id drifted")
    assert_true(payload["summary"]["simulator_count"] == 17, "Priority score simulator count drifted")
    assert_true(payload["summary"]["critical_count"] == 6, "Critical tier count drifted")
    assert_true(payload["summary"]["high_count"] == 8, "High tier count drifted")
    assert_true(payload["summary"]["medium_count"] == 2, "Medium tier count drifted")
    assert_true(payload["summary"]["watch_count"] == 1, "Watch tier count drifted")
    assert_true(payload["rows"][0]["simulator_id"] == "sim_pharmacy_dispatch_transport_twin", "Priority ranking drifted")
    assert_true(len(payload["rows"]) == manifest["summary"]["simulator_count"], "Priority score row count drifted")


def validate_gap_map(manifest: dict[str, Any]) -> None:
    payload = load_json(DATA_DIR / "adapter_real_provider_gap_map.json")
    assert_true(payload["task_id"] == "seq_038", "Gap map task id drifted")
    assert_true(payload["summary"]["simulator_count"] == 17, "Gap map simulator count drifted")
    assert_true(payload["summary"]["replace_with_live_guarded_count"] == 2, "Gap map replace count drifted")
    assert_true(payload["summary"]["hybrid_contract_twin_count"] == 13, "Gap map hybrid count drifted")
    assert_true(payload["summary"]["permanent_fallback_count"] == 2, "Gap map permanent fallback count drifted")
    assert_true(len(payload["gap_rows"]) == manifest["summary"]["simulator_count"], "Gap map row count drifted")

    rows_by_id = {row["simulator_id"]: row for row in payload["gap_rows"]}
    assert_true(
        rows_by_id["sim_support_replay_resend_twin"]["replacement_mode"] == "permanent_fallback",
        "Gap map support replay replacement mode drifted",
    )
    assert_true(
        len(rows_by_id["sim_pharmacy_dispatch_transport_twin"]["blocked_live_gates"]) >= 6,
        "Gap map dispatch blocked-gate count drifted",
    )
    assert_true(
        rows_by_id["sim_pharmacy_directory_choice_twin"]["replacement_mode"] == "replace_with_live_guarded",
        "Gap map pharmacy directory replacement mode drifted",
    )


def validate_docs() -> None:
    backlog_doc = (DOCS_DIR / "38_local_adapter_simulator_backlog.md").read_text()
    execution_doc = (DOCS_DIR / "38_local_adapter_simulator_execution_order.md").read_text()
    delta_doc = (DOCS_DIR / "38_real_provider_delta_register.md").read_text()
    fidelity_doc = (DOCS_DIR / "38_simulator_fidelity_policy.md").read_text()
    readme = (SERVICES_DIR / "README.md").read_text()

    assert_true("## Mock_now_execution" in backlog_doc, "Backlog doc lost Mock_now_execution section")
    assert_true("### Top execution order" in backlog_doc, "Backlog doc lost top execution order section")
    assert_true("## Execution discipline" in execution_doc, "Execution order doc lost execution discipline section")
    assert_true("## Actual_provider_strategy_later" in delta_doc, "Delta register lost Actual_provider_strategy_later section")
    assert_true("## Class catalogue" in fidelity_doc, "Fidelity policy lost class catalogue section")
    assert_true("## Non-negotiable rules" in readme, "Manifest README lost non-negotiable rules section")


def validate_html() -> None:
    html = (DOCS_DIR / "38_simulator_backlog_studio.html").read_text()
    assert_true("Simulator Foundry Board" in html, "HTML lost page title copy")
    assert_true("SIM_FOUNDRY" in html, "HTML lost SIM_FOUNDRY branding")
    for marker in HTML_MARKERS:
        assert_true(marker in html, f"HTML lost marker: {marker}")


def main() -> None:
    ensure_inputs()
    ensure_deliverables()
    manifest = validate_manifest()
    validate_csv(manifest)
    validate_priority_scores(manifest)
    validate_gap_map(manifest)
    validate_docs()
    validate_html()


if __name__ == "__main__":
    main()
