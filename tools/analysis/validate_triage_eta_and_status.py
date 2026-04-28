#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "analysis"))

from root_script_updates import ROOT_SCRIPT_UPDATES


PACKAGE_JSON_PATH = ROOT / "package.json"
ROOT_SCRIPT_UPDATES_PATH = ROOT / "tools" / "analysis" / "root_script_updates.py"
MIGRATION_PATH = ROOT / "services" / "command-api" / "migrations" / "088_phase1_triage_task_eta_and_status.sql"

TRIAGE_RUNTIME_PATH = ROOT / "packages" / "domains" / "triage_workspace" / "src" / "phase1-triage-task.ts"
TRIAGE_INDEX_PATH = ROOT / "packages" / "domains" / "triage_workspace" / "src" / "index.ts"
TRIAGE_TEST_PATH = ROOT / "packages" / "domains" / "triage_workspace" / "tests" / "phase1-triage-task.test.ts"
TRIAGE_PUBLIC_API_TEST_PATH = ROOT / "packages" / "domains" / "triage_workspace" / "tests" / "public-api.test.ts"

OUTCOME_GRAMMAR_PATH = ROOT / "packages" / "domains" / "intake_request" / "src" / "outcome-grammar.ts"
OUTCOME_GRAMMAR_TEST_PATH = ROOT / "packages" / "domains" / "intake_request" / "tests" / "outcome-grammar.test.ts"

INTAKE_TRIAGE_PATH = ROOT / "services" / "command-api" / "src" / "intake-triage.ts"
INTAKE_SUBMIT_PATH = ROOT / "services" / "command-api" / "src" / "intake-submit.ts"
INTAKE_SUBMIT_TEST_PATH = ROOT / "services" / "command-api" / "tests" / "intake-submit.integration.test.js"

TRIAGE_CONTRACT_PATH = ROOT / "data" / "contracts" / "152_triage_task_contract.json"
RECEIPT_CONTRACT_PATH = ROOT / "data" / "contracts" / "152_patient_receipt_consistency_envelope.json"
ETA_MATRIX_PATH = ROOT / "data" / "analysis" / "152_eta_bucket_calibration_matrix.csv"
STATUS_MATRIX_PATH = ROOT / "data" / "analysis" / "152_status_mapping_matrix.csv"
DESIGN_DOC_PATH = ROOT / "docs" / "architecture" / "152_triage_task_and_eta_design.md"
STATUS_DOC_PATH = ROOT / "docs" / "architecture" / "152_receipt_consistency_and_status_mapping.md"


def ensure(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def read_csv_rows(path: Path) -> list[dict[str, str]]:
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def main() -> None:
    required_paths = [
      PACKAGE_JSON_PATH,
      ROOT_SCRIPT_UPDATES_PATH,
      MIGRATION_PATH,
      TRIAGE_RUNTIME_PATH,
      TRIAGE_INDEX_PATH,
      TRIAGE_TEST_PATH,
      TRIAGE_PUBLIC_API_TEST_PATH,
      OUTCOME_GRAMMAR_PATH,
      OUTCOME_GRAMMAR_TEST_PATH,
      INTAKE_TRIAGE_PATH,
      INTAKE_SUBMIT_PATH,
      INTAKE_SUBMIT_TEST_PATH,
      TRIAGE_CONTRACT_PATH,
      RECEIPT_CONTRACT_PATH,
      ETA_MATRIX_PATH,
      STATUS_MATRIX_PATH,
      DESIGN_DOC_PATH,
      STATUS_DOC_PATH,
    ]
    for path in required_paths:
        ensure(path.exists(), f"Missing par_152 artifact: {path}")

    package_json = read_json(PACKAGE_JSON_PATH)
    triage_contract = read_json(TRIAGE_CONTRACT_PATH)
    receipt_contract = read_json(RECEIPT_CONTRACT_PATH)
    eta_rows = read_csv_rows(ETA_MATRIX_PATH)
    status_rows = read_csv_rows(STATUS_MATRIX_PATH)

    triage_runtime_text = TRIAGE_RUNTIME_PATH.read_text(encoding="utf-8")
    triage_index_text = TRIAGE_INDEX_PATH.read_text(encoding="utf-8")
    triage_test_text = TRIAGE_TEST_PATH.read_text(encoding="utf-8")
    triage_public_api_test_text = TRIAGE_PUBLIC_API_TEST_PATH.read_text(encoding="utf-8")
    outcome_grammar_text = OUTCOME_GRAMMAR_PATH.read_text(encoding="utf-8")
    outcome_grammar_test_text = OUTCOME_GRAMMAR_TEST_PATH.read_text(encoding="utf-8")
    intake_triage_text = INTAKE_TRIAGE_PATH.read_text(encoding="utf-8")
    intake_submit_text = INTAKE_SUBMIT_PATH.read_text(encoding="utf-8")
    intake_submit_test_text = INTAKE_SUBMIT_TEST_PATH.read_text(encoding="utf-8")
    migration_text = MIGRATION_PATH.read_text(encoding="utf-8")
    docs_text = DESIGN_DOC_PATH.read_text(encoding="utf-8") + "\n" + STATUS_DOC_PATH.read_text(
        encoding="utf-8"
    )

    ensure(
        package_json["scripts"].get("validate:triage-eta-status")
        == "python3 ./tools/analysis/validate_triage_eta_and_status.py",
        "package.json is missing validate:triage-eta-status.",
    )
    ensure(
        ROOT_SCRIPT_UPDATES["validate:triage-eta-status"]
        == "python3 ./tools/analysis/validate_triage_eta_and_status.py",
        "root_script_updates.py is missing validate:triage-eta-status.",
    )
    ensure(
        "pnpm validate:triage-eta-status" in ROOT_SCRIPT_UPDATES["bootstrap"]
        and "pnpm validate:triage-eta-status" in ROOT_SCRIPT_UPDATES["check"],
        "Root script update strings must include validate:triage-eta-status.",
    )

    for token in [
        "Phase1TriageTaskDocument",
        "Phase1TriageEtaForecastDocument",
        "Phase1PatientStatusProjectionDocument",
        "Phase1EtaEngine",
        "materialImprovementWorkingMinutes",
        "conformalPaddingWorkingMinutes",
        "held_prior_bucket",
        "frozen_at_risk",
    ]:
        ensure(token in triage_runtime_text, f"phase1-triage-task.ts is missing {token}.")

    ensure(
        'export * from "./phase1-triage-task";' in triage_index_text,
        "triage workspace index must export phase1-triage-task.",
    )
    ensure(
        "createPhase1TriageStore" in triage_public_api_test_text
        and "createPhase1EtaEngine" in triage_public_api_test_text
        and "createPhase1TriageHandoffService" in triage_public_api_test_text,
        "triage workspace public-api test must cover the par_152 exports.",
    )
    for token in [
        "monotone median and upper bounds",
        "hysteresis",
        "stale",
    ]:
        ensure(token in triage_test_text, f"Phase1 triage tests lost {token}.")

    ensure(
        "receiptEnvelopeOverride" in outcome_grammar_text,
        "outcome-grammar.ts must support receiptEnvelopeOverride.",
    )
    ensure(
        "honours the authoritative receipt override" in outcome_grammar_test_text,
        "outcome grammar tests must cover the authoritative receipt override.",
    )

    for token in [
        "createIntakeTriageApplication",
        "phase1_triage_tasks",
        "phase1_triage_eta_forecasts",
        "phase1_patient_status_projections",
    ]:
        ensure(token in intake_triage_text, f"intake-triage.ts is missing {token}.")

    for token in [
        'nextState: "intake_normalized"',
        'nextState: "triage_ready"',
        "receiptEnvelopeOverride",
        'makeFoundationEvent("triage.task.created"',
        'makeFoundationEvent("communication.queued"',
        "triageTask",
        "triageEtaForecast",
        "patientStatusProjection",
    ]:
        ensure(token in intake_submit_text, f"intake-submit.ts is missing {token}.")

    for token in [
        'workflowState).toBe("triage_ready")',
        "latestTriageTaskRef",
        '"triage.task.created"',
        '"communication.queued"',
        'workflowState).toBe("intake_normalized")',
    ]:
        ensure(token in intake_submit_test_text, f"intake-submit integration test is missing {token}.")

    for required_table in [
        "phase1_triage_tasks",
        "phase1_triage_eta_forecasts",
        "phase1_patient_status_projections",
    ]:
        ensure(required_table in migration_text, f"Migration must create {required_table}.")

    ensure(triage_contract["taskId"] == "par_152", "Triage contract must declare taskId par_152.")
    ensure(
        triage_contract["contractId"] == "PHASE1_TRIAGE_TASK_CONTRACT_V1",
        "Triage contract ID drifted.",
    )
    ensure(
        triage_contract["requestWorkflowRule"]["triageReadyRequiresCanonicalTask"] is True,
        "Triage contract must require a real task before triage_ready.",
    )
    ensure(
        triage_contract["residualRiskPolicy"]["residual_risk_flagged"]["residualRiskRuleIdsRequired"] is True,
        "Residual-risk routine tasks must carry rule IDs.",
    )

    ensure(
        receipt_contract["taskId"] == "par_152",
        "Receipt consistency contract must declare taskId par_152.",
    )
    ensure(
        receipt_contract["contractId"] == "PHASE1_PATIENT_RECEIPT_CONSISTENCY_ENVELOPE_V1",
        "Receipt consistency contract ID drifted.",
    )
    ensure(
        receipt_contract["consistencyLaw"]["appendOnlyRevisionHistory"] is True,
        "Receipt consistency contract must keep append-only revisions.",
    )
    ensure(
        receipt_contract["consistencyLaw"]["publicStatusMustReuseSameEnvelope"] is True,
        "Status truth must reuse the same authoritative envelope.",
    )

    ensure(eta_rows, "ETA calibration matrix must contain rows.")
    eta_buckets = {row["bucket"] for row in eta_rows}
    ensure(
        eta_buckets
        == {"same_day", "next_working_day", "within_2_working_days", "after_2_working_days"},
        "ETA calibration matrix must cover all patient receipt buckets.",
    )
    ensure(
        any(row["admissibility_rule"].startswith("upper_bound") for row in eta_rows),
        "ETA calibration matrix must document upper-bound admissibility rules.",
    )

    ensure(status_rows, "Status mapping matrix must contain rows.")
    macro_states = {row["macro_state"] for row in status_rows}
    ensure(
        macro_states == {"received", "in_review", "we_need_you", "completed", "urgent_action"},
        "Status mapping matrix must cover the full minimal Phase 1 macro-state set.",
    )
    ensure(
        all(row["patient_visible_queue_metadata"] == "false" for row in status_rows),
        "Status mapping matrix must keep raw queue metadata hidden from patients.",
    )

    for token in [
        "triage_ready",
        "monotone",
        "hysteresis",
        "PatientReceiptConsistencyEnvelope",
        "received",
        "we_need_you",
        "urgent_action",
    ]:
        ensure(token in docs_text, f"par_152 docs are missing {token}.")

    print("validate_triage_eta_and_status: ok")


if __name__ == "__main__":
    main()
