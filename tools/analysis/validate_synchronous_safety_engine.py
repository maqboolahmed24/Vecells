#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path("/Users/test/Code/V")
SCHEMA_PATH = ROOT / "data/contracts/150_safety_rule_pack_schema.json"
REGISTRY_PATH = ROOT / "data/contracts/150_safety_rule_pack_registry.json"
REASONS_PATH = ROOT / "data/analysis/150_safety_reason_codes.json"
MATRIX_PATH = ROOT / "data/analysis/150_safety_decision_matrix.csv"
CORPUS_PATH = ROOT / "data/analysis/150_challenge_case_corpus.jsonl"
DOC_PATHS = [
    ROOT / "docs/architecture/150_synchronous_safety_engine_design.md",
    ROOT / "docs/architecture/150_rule_pack_and_calibration_strategy.md",
]

REQUIRED_RULE_IDS = {
    "RF142_HS_ACUTE_CHEST_BREATHING",
    "RF142_HS_STROKE_COLLAPSE_OR_SEIZURE",
    "RF142_HS_ANAPHYLAXIS_OR_SEVERE_MED_REACTION",
    "RF142_HS_HEAVY_BLEEDING_OR_PREGNANCY_RED_FLAG",
    "RF142_HS_SELF_HARM_OR_SAFEGUARDING_SIGNAL",
    "RF142_UC_SEVERE_PAIN_ESCALATION",
    "RF142_UC_RAPID_WORSENING_RECENT_ONSET",
    "RF142_UC_HIGH_RISK_RESULT_WITH_CURRENT_SYMPTOMS",
    "RF142_UC_HIGH_RISK_MED_INTERRUPTION",
    "RF142_RC_MODERATE_PERSISTENT_SYMPTOMS",
    "RF142_RC_RESULTS_UNCLEAR_FOLLOW_UP",
    "RF142_RC_ADMIN_TIME_DEPENDENT_CLINICAL_FORM",
    "RF142_RCH_NO_SAFE_CALLBACK_WINDOW",
}
REQUIRED_REASON_CODES = {
    "GAP_RESOLVED_PHASE1_SAFETY_WEIGHT_SEEDS_V1",
    "GAP_RESOLVED_PHASE1_SAFETY_IDENTITY_CALIBRATOR_V1",
    "PHASE1_SYNC_SAFETY_CLASSIFIER_CONTENT_SIGNAL_V1",
    "PHASE1_SYNC_SAFETY_FAIL_CLOSED_MANUAL_REVIEW",
    "PHASE1_SYNC_SAFETY_URGENT_REQUIRED",
    "PHASE1_SYNC_SAFETY_RESIDUAL_RISK",
    "PHASE1_SYNC_SAFETY_SCREEN_CLEAR",
    "PHASE1_SYNC_SAFETY_HARD_STOP_DOMINANT",
    "PHASE1_SYNC_SAFETY_CONTACT_TRUST_UNSAFE",
    "PHASE1_SYNC_SAFETY_EVIDENCE_READINESS_UNTRUSTED",
}
LEGAL_OUTCOMES = {
    "urgent_required",
    "residual_review",
    "clear_routine",
    "fallback_manual_review",
}
LEGAL_REQUESTED_STATES = {
    "urgent_diversion_required",
    "residual_risk_flagged",
    "screen_clear",
}


def expect(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def load_json(path: Path) -> object:
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> None:
    for path in [SCHEMA_PATH, REGISTRY_PATH, REASONS_PATH, MATRIX_PATH, CORPUS_PATH, *DOC_PATHS]:
      expect(path.exists(), f"Missing required par_150 artifact: {path}")

    schema = load_json(SCHEMA_PATH)
    expect(
        isinstance(schema, dict)
        and schema.get("title") == "Phase 1 Synchronous Safety Rule Pack",
        "150 rule-pack schema title drifted.",
    )

    registry = load_json(REGISTRY_PATH)
    expect(
        isinstance(registry, dict)
        and registry.get("schemaVersion") == "PHASE1_SYNCHRONOUS_SAFETY_RULE_PACK_REGISTRY_V1",
        "150 rule-pack registry schemaVersion drifted.",
    )
    packs = registry.get("packs")
    expect(isinstance(packs, list) and len(packs) == 1, "Expected exactly one Phase 1 safety pack.")
    pack = packs[0]
    expect(
        pack.get("rulePackId") == "RFRP_142_PHASE1_SYNCHRONOUS_SAFETY_V1",
        "Unexpected par_150 rulePackId.",
    )
    expect(pack.get("thresholdUrgent") == 0.083333, "theta_U drifted from seq_142.")
    expect(pack.get("thresholdResidual") == 0.285714, "theta_R drifted from seq_142.")
    expect(pack.get("contradictionThreshold") == 0.55, "theta_conf drifted from seq_142.")
    expect(pack.get("missingnessThreshold") == 0.6, "theta_miss drifted from seq_142.")
    rules = pack.get("rules")
    expect(isinstance(rules, list) and len(rules) >= len(REQUIRED_RULE_IDS), "Rule pack is incomplete.")
    rule_ids = {rule["ruleId"] for rule in rules if isinstance(rule, dict) and "ruleId" in rule}
    expect(REQUIRED_RULE_IDS.issubset(rule_ids), "Phase 1 rule pack is missing required rule IDs.")

    reasons = load_json(REASONS_PATH)
    reason_codes = {
        row["reasonCode"]
        for row in reasons.get("reasonCodes", [])
        if isinstance(row, dict) and "reasonCode" in row
    }
    expect(REQUIRED_REASON_CODES.issubset(reason_codes), "Reason-code catalog is incomplete.")

    matrix_case_ids = set()
    with MATRIX_PATH.open(encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))
    expect(rows, "Decision matrix is empty.")
    for row in rows:
        matrix_case_ids.add(row["case_id"])
        expect(row["decision_outcome"] in LEGAL_OUTCOMES, f"Illegal decision outcome {row['decision_outcome']}.")
        expect(
            row["requested_safety_state"] in LEGAL_REQUESTED_STATES,
            f"Illegal requested safety state {row['requested_safety_state']}.",
        )

    corpus_case_ids = set()
    with CORPUS_PATH.open(encoding="utf-8") as handle:
        for line in handle:
            if not line.strip():
                continue
            row = json.loads(line)
            corpus_case_ids.add(row["caseId"])
            expect(row["expectedDecisionOutcome"] in LEGAL_OUTCOMES, "Challenge corpus outcome drifted.")
            expect(
                row["expectedRequestedSafetyState"] in LEGAL_REQUESTED_STATES,
                "Challenge corpus requested state drifted.",
            )
    expect(matrix_case_ids == corpus_case_ids, "Decision matrix and challenge corpus case IDs differ.")

    for doc_path in DOC_PATHS:
        text = doc_path.read_text(encoding="utf-8")
        expect("SCAL_150_IDENTITY_CALIBRATOR_V1" in text, f"Missing calibrator ref in {doc_path}.")
        expect("RFRP_142_PHASE1_SYNCHRONOUS_SAFETY_V1" in text, f"Missing pack ref in {doc_path}.")

    print("par_150 synchronous safety artifacts validated")


if __name__ == "__main__":
    main()
