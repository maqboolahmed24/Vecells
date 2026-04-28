#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"

REFERENCE_CASE_PATH = DATA_DIR / "reference_case_catalog.json"
SEED_MATRIX_PATH = DATA_DIR / "seed_dataset_matrix.csv"
SIMULATOR_CATALOG_PATH = DATA_DIR / "simulator_contract_catalog.json"
FAULT_MATRIX_PATH = DATA_DIR / "simulator_fault_injection_matrix.csv"
CONTINUITY_MATRIX_PATH = DATA_DIR / "reference_case_to_continuity_control_matrix.csv"

REQUIRED_CASE_CODES = {
    "clean_self_service_submit",
    "duplicate_retry_return_prior_accepted",
    "duplicate_collision_open_review",
    "fallback_review_after_accepted_progress_degrades",
    "wrong_patient_identity_repair_hold",
    "urgent_diversion_required_then_issued",
    "telephony_urgent_live_only_capture",
    "telephony_seeded_vs_challenge_continuation",
    "booking_confirmation_pending_ambiguity",
    "pharmacy_dispatch_proof_pending_weak_match",
    "support_replay_restore_same_shell_recovery",
}
REQUIRED_SIMULATORS = {
    "sim_nhs_login_auth_session_twin",
    "sim_im1_principal_system_emis_twin",
    "sim_im1_principal_system_tpp_twin",
    "sim_mesh_message_path_twin",
    "sim_telephony_ivr_twin",
    "sim_email_notification_twin",
    "sim_sms_delivery_twin",
}
REQUIRED_FAULTS = {
    "timeout",
    "replay",
    "duplicate",
    "stale_callback",
    "disputed_receipt",
    "ordering_inversion",
    "partial_outage",
}
REQUIRED_CONTROLS = {
    "patient_nav",
    "more_info_reply",
    "conversation_settlement",
    "intake_resume",
    "booking_manage",
    "hub_booking_manage",
    "support_replay_restore",
    "workspace_task_completion",
    "pharmacy_console_settlement",
}


def read_json(path: Path):
    return json.loads(path.read_text())


def read_csv(path: Path):
    with path.open() as handle:
        return list(csv.DictReader(handle))


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def main() -> None:
    case_pack = read_json(REFERENCE_CASE_PATH)
    simulator_pack = read_json(SIMULATOR_CATALOG_PATH)
    seed_rows = read_csv(SEED_MATRIX_PATH)
    fault_rows = read_csv(FAULT_MATRIX_PATH)
    continuity_rows = read_csv(CONTINUITY_MATRIX_PATH)

    reference_cases = case_pack["referenceCases"]
    simulators = simulator_pack["simulators"]

    require(case_pack["summary"]["reference_case_count"] == 11, "Reference case count drifted.")
    require(
        {row["caseCode"] for row in reference_cases} == REQUIRED_CASE_CODES,
        "Required Phase 0 reference cases drifted.",
    )
    require(
        REQUIRED_SIMULATORS.issubset({row["simulatorId"] for row in simulators}),
        "Simulator coverage drifted below the required Phase 0 boundaries.",
    )
    require(
        REQUIRED_FAULTS.issubset({row["fault_mode"] for row in fault_rows}),
        "Fault injection coverage lost a mandatory fault mode.",
    )
    require(
        REQUIRED_CONTROLS.issubset({row["continuity_control_code"] for row in continuity_rows}),
        "Continuity-control matrix no longer covers the required families.",
    )
    require(
        {row["releaseVerificationUse"] for row in reference_cases}
        == {"preview", "integration", "preprod", "wave_probe"},
        "Release verification reuse no longer covers every required ring-facing mode.",
    )

    seed_ids = {row["seed_object_id"] for row in seed_rows}
    simulator_ids = {row["simulatorId"] for row in simulators}
    continuity_refs = {row["continuity_coverage_record_ref"] for row in continuity_rows}

    for row in reference_cases:
        require(row["requiredSeedObjects"], f"{row['referenceCaseId']} lost seed objects.")
        require(row["requiredSimulatorRefs"], f"{row['referenceCaseId']} lost simulator refs.")
        require(
            row["requiredContinuityControlRefs"],
            f"{row['referenceCaseId']} lost continuity control refs.",
        )
        for seed_ref in row["requiredSeedObjects"]:
            require(seed_ref in seed_ids, f"{row['referenceCaseId']} references unknown seed row {seed_ref}.")
        for simulator_ref in row["requiredSimulatorRefs"]:
            require(
                simulator_ref in simulator_ids,
                f"{row['referenceCaseId']} references unknown simulator {simulator_ref}.",
            )
        for continuity_ref in row["continuityCoverageRecordRefs"]:
            require(
                continuity_ref in continuity_refs,
                f"{row['referenceCaseId']} references unknown continuity coverage {continuity_ref}.",
            )

    live_credential_rows = [
        row for row in seed_rows if row["requires_live_credentials"].strip().lower() != "no"
    ]
    require(
        not live_credential_rows,
        "Seed matrix drifted into live credential or live side-effect dependence.",
    )

    for simulator in simulators:
        require(
            simulator["mock_now_execution"]["fault_injection"],
            f"{simulator['simulatorId']} lost fault injection coverage.",
        )
        require(
            simulator["actual_provider_strategy_later"]["secret_classes"],
            f"{simulator['simulatorId']} lost secret class documentation.",
        )
        require(
            simulator["actual_provider_strategy_later"]["semantic_preservation_rules"],
            f"{simulator['simulatorId']} lost semantic preservation rules.",
        )

    for control in REQUIRED_CONTROLS:
        require(
            any(row["continuity_control_code"] == control for row in continuity_rows),
            f"Continuity control {control} lost case coverage.",
        )

    print("seq_059 seed and simulator strategy validation passed")


if __name__ == "__main__":
    main()
