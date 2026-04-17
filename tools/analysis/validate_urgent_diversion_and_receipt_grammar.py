#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]

CONTRACT_PATH = ROOT / "data" / "contracts" / "151_outcome_grammar_contract.json"
MATRIX_PATH = ROOT / "data" / "analysis" / "151_outcome_state_matrix.csv"
REASONS_PATH = ROOT / "data" / "analysis" / "151_urgent_settlement_reason_codes.json"
DOC_PATHS = [
    ROOT / "docs" / "architecture" / "151_urgent_diversion_and_receipt_grammar_design.md",
    ROOT / "docs" / "architecture" / "151_outcome_artifact_and_navigation_contracts.md",
]
MIGRATION_PATH = (
    ROOT / "services" / "command-api" / "migrations" / "086_phase1_outcome_grammar_and_urgent_diversion.sql"
)
RUNTIME_PATHS = [
    ROOT / "packages" / "domains" / "intake_safety" / "src" / "urgent-diversion-settlement.ts",
    ROOT / "packages" / "domains" / "intake_request" / "src" / "outcome-grammar.ts",
    ROOT / "services" / "command-api" / "src" / "intake-outcome.ts",
    ROOT / "services" / "command-api" / "src" / "intake-submit.ts",
]
TEST_PATHS = [
    ROOT / "packages" / "domains" / "intake_safety" / "tests" / "urgent-diversion-settlement.test.ts",
    ROOT / "packages" / "domains" / "intake_request" / "tests" / "outcome-grammar.test.ts",
    ROOT / "services" / "command-api" / "tests" / "intake-submit.integration.test.js",
]

REQUIRED_RESULTS = {
    "urgent_diversion",
    "triage_ready",
    "stale_recoverable",
    "failed_safe",
    "denied_scope",
}
REQUIRED_REASON_CODES = {
    "GAP_RESOLVED_RECEIPT_GRAMMAR_OBJECTS_151_V1",
    "PHASE1_URGENT_DIVERSION_PENDING",
    "PHASE1_URGENT_DIVERSION_ISSUED",
    "PHASE1_OUTCOME_TRIAGE_READY",
    "PHASE1_OUTCOME_STALE_RECOVERY",
    "PHASE1_OUTCOME_FAILED_SAFE",
    "PHASE1_OUTCOME_DENIED_SCOPE",
    "PHASE1_OUTCOME_ARTIFACT_GOVERNED",
    "PHASE1_OUTBOUND_NAVIGATION_GOVERNED",
}


def ensure(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> None:
    for path in [
        CONTRACT_PATH,
        MATRIX_PATH,
        REASONS_PATH,
        MIGRATION_PATH,
        *DOC_PATHS,
        *RUNTIME_PATHS,
        *TEST_PATHS,
    ]:
        ensure(path.exists(), f"Missing required par_151 artifact: {path}")

    contract = read_json(CONTRACT_PATH)
    ensure(contract.get("taskId") == "par_151", "Outcome grammar contract must declare taskId par_151.")
    ensure(
        contract.get("outcomeGrammarContractRef") == "OGC_151_PHASE1_OUTCOME_GRAMMAR_V1",
        "Outcome grammar contract ref drifted.",
    )
    ensure(
        contract.get("gapResolutionRef") == "GAP_RESOLVED_RECEIPT_GRAMMAR_OBJECTS_151_V1",
        "Receipt grammar gap resolution ref drifted.",
    )
    results = contract.get("results")
    ensure(isinstance(results, list) and len(results) == 5, "Expected five authoritative outcome families.")
    result_names = {row["result"] for row in results if isinstance(row, dict) and "result" in row}
    ensure(result_names == REQUIRED_RESULTS, "Outcome grammar contract is missing required results.")

    urgent_policy = contract.get("urgentDiversionPolicy", {})
    ensure(
        urgent_policy.get("requiredRequestedSafetyState") == "urgent_diversion_required",
        "Urgent-diversion policy must require urgent_diversion_required.",
    )
    ensure(
        urgent_policy.get("terminalRequestSafetyState") == "urgent_diverted",
        "Urgent-diversion policy must terminate at urgent_diverted.",
    )
    ensure(
        set(urgent_policy.get("durableSettlementStates", []))
        == {"pending", "issued", "failed", "superseded"},
        "Urgent-diversion durable settlement states drifted.",
    )

    receipt_policy = contract.get("routineReceiptPolicy", {})
    ensure(
        receipt_policy.get("etaPromiseRef") == "ETA_151_CONSERVATIVE_AFTER_2_WORKING_DAYS_V1",
        "Receipt ETA promise ref drifted.",
    )
    ensure(
        receipt_policy.get("monotonePromiseRequired") is True,
        "Receipt policy must remain monotone.",
    )

    artifact_policy = contract.get("artifactAndNavigationPolicy", {})
    ensure(
        artifact_policy.get("artifactPresentationContractBindingRequired") is True,
        "Artifact presentation contract binding must remain mandatory.",
    )
    ensure(
        artifact_policy.get("surfacePublicationRef") == "ASPR_050_PATIENT_PUBLIC_ENTRY_V1",
        "Surface publication ref drifted.",
    )

    with MATRIX_PATH.open(encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))
    ensure(len(rows) >= 7, "Outcome state matrix must cover urgent, routine, and recovery rows.")
    matrix_results = {row["outcome_result"] for row in rows}
    ensure(REQUIRED_RESULTS.issubset(matrix_results), "Outcome state matrix is incomplete.")
    ensure(
        any(
            row["outcome_result"] == "urgent_diversion"
            and row["applies_to_state"] == "urgent_diverted"
            and row["requires_urgent_settlement"] == "true"
            for row in rows
        ),
        "Outcome matrix must prove urgent_diverted requires a durable urgent settlement.",
    )
    ensure(
        any(
            row["outcome_result"] == "triage_ready"
            and row["receipt_envelope_state"] == "on_track"
            for row in rows
        ),
        "Outcome matrix must prove routine receipt stays distinct from recovery grammar.",
    )
    ensure(
        any(
            row["outcome_result"] == "failed_safe"
            and row["continuity_posture"] == "recovery_same_shell"
            for row in rows
        ),
        "Outcome matrix must prove failed-safe recovery stays same-shell.",
    )

    reasons = read_json(REASONS_PATH)
    ensure(
        reasons.get("catalogId") == "PHASE1_OUTCOME_GRAMMAR_REASON_CODES_V1",
        "Outcome reason-code catalog id drifted.",
    )
    reason_codes = {
        row["reasonCode"]
        for row in reasons.get("reasonCodes", [])
        if isinstance(row, dict) and "reasonCode" in row
    }
    ensure(REQUIRED_REASON_CODES.issubset(reason_codes), "Outcome reason-code catalog is incomplete.")

    migration_text = MIGRATION_PATH.read_text(encoding="utf-8")
    for table_name in [
        "urgent_diversion_settlements",
        "patient_receipt_consistency_envelopes",
        "intake_outcome_presentation_artifacts",
        "outbound_navigation_grants",
        "phase1_outcome_tuples",
    ]:
        ensure(table_name in migration_text, f"Migration must create or anchor {table_name}.")

    runtime_expectations = {
        RUNTIME_PATHS[0]: [
            "issueSettlement(",
            "URGENT_DIVERSION_DECISION_NOT_URGENT",
            "supersedesSettlementRef",
        ],
        RUNTIME_PATHS[1]: [
            "settleOutcome(",
            "PatientReceiptConsistencyEnvelopeDocument",
            "OutcomeNavigationGrantDocument",
            "Phase1OutcomeTupleDocument",
            "GAP_RESOLVED_RECEIPT_GRAMMAR_OBJECTS_151_V1",
        ],
        RUNTIME_PATHS[2]: [
            "createIntakeOutcomeApplication",
            "createUrgentDiversionSettlementService",
            "createPhase1OutcomeGrammarService",
        ],
        RUNTIME_PATHS[3]: [
            "buildOutcomeChain",
            "buildOutcomeEvents",
            "safety.urgent_diversion.completed",
            "patient.receipt.issued",
            "patient.receipt.degraded",
        ],
    }
    for path, markers in runtime_expectations.items():
        text = path.read_text(encoding="utf-8")
        for marker in markers:
            ensure(marker in text, f"{path.name} is missing required marker {marker!r}.")

    for doc_path in DOC_PATHS:
        text = doc_path.read_text(encoding="utf-8")
        for marker in [
            "UrgentDiversionSettlement",
            "PatientReceiptConsistencyEnvelope",
            "IntakeOutcomePresentationArtifact",
            "OutcomeNavigationGrant",
            "OGC_151_PHASE1_OUTCOME_GRAMMAR_V1",
        ]:
            ensure(marker in text, f"Missing {marker} in {doc_path}.")

    print("validate_urgent_diversion_and_receipt_grammar: ok")


if __name__ == "__main__":
    main()
