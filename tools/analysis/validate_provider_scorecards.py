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
    "integration_priority_matrix": DATA_DIR / "integration_priority_matrix.json",
    "master_risk_register": DATA_DIR / "master_risk_register.json",
    "phase0_gate_verdict": DATA_DIR / "phase0_gate_verdict.json",
    "coverage_summary": DATA_DIR / "coverage_summary.json",
}

DELIVERABLES = [
    DOCS_DIR / "22_provider_selection_scorecards.md",
    DOCS_DIR / "22_mock_provider_design_briefs.md",
    DOCS_DIR / "22_actual_provider_due_diligence_playbook.md",
    DOCS_DIR / "22_provider_score_weight_rationale.md",
    DOCS_DIR / "22_provider_scorecard_studio.html",
    DATA_DIR / "provider_family_scorecards.json",
    DATA_DIR / "provider_dimension_weights.csv",
    DATA_DIR / "mock_provider_minimum_bars.csv",
    DATA_DIR / "actual_provider_kill_switches.csv",
    DATA_DIR / "provider_due_diligence_questions.csv",
]

MANDATORY_PROVIDER_FAMILIES = {
    "identity_auth",
    "telephony_voice_and_recording",
    "notifications_sms",
    "notifications_email",
    "gp_im1_and_booking_supplier",
    "pharmacy_directory",
    "pharmacy_dispatch_transport",
    "pharmacy_outcome_observation",
}

ALLOWED_DIMENSION_CLASSES = {
    "capability",
    "proof_truth",
    "ambiguity_handling",
    "security",
    "privacy",
    "compliance",
    "onboarding_friction",
    "sandbox_quality",
    "test_data_quality",
    "observability",
    "operational_support",
    "cost_governance",
    "portability",
    "resilience",
    "ui_brand_constraints",
    "mock_fidelity",
}

HTML_MARKERS = [
    'data-testid="provider-scorecard-shell"',
    'data-testid="provider-family-ribbon"',
    'data-testid="provider-dimension-rail"',
    'data-testid="provider-comparison-canvas"',
    'data-testid="provider-dimension-table"',
    'data-testid="provider-inspector"',
    'data-testid="provider-brief-summary"',
    'data-testid="provider-question-bank"',
    'data-testid="provider-risk-notes"',
]

REQUIRED_ROW_FIELDS = {
    "provider_family",
    "dimension_id",
    "dimension_title",
    "dimension_class",
    "weight_mock_now",
    "weight_actual_later",
    "minimum_bar_mock_now",
    "minimum_bar_actual_later",
    "evidence_required_mock_now",
    "evidence_required_actual_later",
    "kill_switch_if_failed_mock_now",
    "kill_switch_if_failed_actual_later",
    "source_refs",
    "notes",
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
    assert_true(not missing, "Missing seq_022 prerequisites: " + ", ".join(sorted(missing)))
    return {
        "integration_priority_matrix": load_json(REQUIRED_INPUTS["integration_priority_matrix"]),
        "master_risk_register": load_json(REQUIRED_INPUTS["master_risk_register"]),
        "phase0_gate_verdict": load_json(REQUIRED_INPUTS["phase0_gate_verdict"]),
        "coverage_summary": load_json(REQUIRED_INPUTS["coverage_summary"]),
    }


def ensure_deliverables() -> None:
    missing = [str(path) for path in DELIVERABLES if not path.exists()]
    assert_true(not missing, "Missing seq_022 deliverables:\n" + "\n".join(missing))


def validate_payload(prereqs: dict[str, Any]) -> None:
    payload = load_json(DATA_DIR / "provider_family_scorecards.json")
    weights_csv = load_csv(DATA_DIR / "provider_dimension_weights.csv")
    mock_bars_csv = load_csv(DATA_DIR / "mock_provider_minimum_bars.csv")
    actual_kills_csv = load_csv(DATA_DIR / "actual_provider_kill_switches.csv")
    questions_csv = load_csv(DATA_DIR / "provider_due_diligence_questions.csv")
    html = (DOCS_DIR / "22_provider_scorecard_studio.html").read_text()

    assert_true(payload["visual_mode"] == "Provider_Atelier", "Visual mode drifted")
    assert_true(payload["summary"]["provider_family_count"] == 8, "Provider family count drifted")
    assert_true(payload["summary"]["dimension_count"] == 16, "Dimension count drifted")
    assert_true(payload["summary"]["scorecard_row_count"] == 128, "Scorecard row count drifted")
    assert_true(payload["summary"]["question_count"] == 128, "Question count drifted")
    assert_true(payload["summary"]["phase0_entry_verdict"] == "withheld", "Seq_020 gate posture drifted")
    assert_true(prereqs["phase0_gate_verdict"]["gate_verdicts"][0]["verdict"] == "withheld", "Upstream Phase 0 verdict drifted")
    assert_true(prereqs["coverage_summary"]["summary"]["requirements_with_gaps_count"] == 0, "Current baseline traceability gaps reopened")
    assert_true(prereqs["integration_priority_matrix"]["summary"]["integration_family_count"] == 15, "Seq_021 prerequisite drifted")

    families = payload["families"]
    family_ids = {family["provider_family"] for family in families}
    assert_true(family_ids == MANDATORY_PROVIDER_FAMILIES, "Mandatory provider families are missing or extra")
    assert_true(len(weights_csv) == 128, "Weight CSV row count drifted")
    assert_true(len(mock_bars_csv) == 128, "Mock minimum-bars CSV row count drifted")
    assert_true(len(actual_kills_csv) == 128, "Actual kill-switch CSV row count drifted")
    assert_true(len(questions_csv) == 128, "Due-diligence question CSV row count drifted")

    dimension_classes = {dimension["dimension_class"] for dimension in payload["dimension_catalog"]}
    assert_true(dimension_classes == ALLOWED_DIMENSION_CLASSES, "Dimension catalog no longer covers the allowed classes exactly")

    row_keys: set[tuple[str, str]] = set()
    risk_ids = {row["risk_id"] for row in prereqs["master_risk_register"]["risks"]}

    for family in families:
        rows = family["scorecard_rows"]
        assert_true(len(rows) == 16, f"{family['provider_family']} no longer has 16 dimensions")
        family_dimension_classes = {row["dimension_class"] for row in rows}
        assert_true(
            {"proof_truth", "ambiguity_handling", "mock_fidelity"}.issubset(family_dimension_classes),
            f"{family['provider_family']} lost a mandatory dimension class",
        )
        assert_true(family["mock_design_brief"]["must_emulate"], f"{family['provider_family']} is missing mock brief states")
        assert_true(family["actual_provider_strategy"]["gating_conditions"], f"{family['provider_family']} is missing actual-provider gating conditions")
        for risk in family["risk_notes"]:
            assert_true(risk["risk_id"] in risk_ids, f"{family['provider_family']} references unknown risk {risk['risk_id']}")
        for row in rows:
            missing = REQUIRED_ROW_FIELDS - set(row)
            assert_true(not missing, f"{family['provider_family']}:{row.get('dimension_id', 'UNKNOWN')} missing fields {sorted(missing)}")
            key = (row["provider_family"], row["dimension_id"])
            assert_true(key not in row_keys, f"Duplicate row {key}")
            row_keys.add(key)
            assert_true(row["dimension_class"] in ALLOWED_DIMENSION_CLASSES, f"{key} has invalid class")
            assert_true(1 <= row["weight_mock_now"] <= 12, f"{key} has invalid mock weight")
            assert_true(1 <= row["weight_actual_later"] <= 12, f"{key} has invalid actual weight")
            assert_true(1 <= row["minimum_bar_mock_now"] <= 5, f"{key} has invalid mock minimum bar")
            assert_true(1 <= row["minimum_bar_actual_later"] <= 5, f"{key} has invalid actual minimum bar")
            assert_true(row["evidence_required_mock_now"], f"{key} is missing mock evidence")
            assert_true(row["evidence_required_actual_later"], f"{key} is missing actual evidence")
            assert_true(row["kill_switch_if_failed_mock_now"].strip(), f"{key} is missing mock kill-switch text")
            assert_true(row["kill_switch_if_failed_actual_later"].strip(), f"{key} is missing actual kill-switch text")
            assert_true(row["source_refs"], f"{key} is missing source refs")
            assert_true(row["notes"].strip(), f"{key} is missing notes")

    identity = next(f for f in families if f["provider_family"] == "identity_auth")
    telephony = next(f for f in families if f["provider_family"] == "telephony_voice_and_recording")
    sms = next(f for f in families if f["provider_family"] == "notifications_sms")
    gp = next(f for f in families if f["provider_family"] == "gp_im1_and_booking_supplier")
    pharmacy_dispatch = next(f for f in families if f["provider_family"] == "pharmacy_dispatch_transport")
    pharmacy_outcome = next(f for f in families if f["provider_family"] == "pharmacy_outcome_observation")

    def row_by_id(family: dict[str, Any], dimension_id: str) -> dict[str, Any]:
        return next(row for row in family["scorecard_rows"] if row["dimension_id"] == dimension_id)

    identity_ui = row_by_id(identity, "experience_and_brand_constraints")
    telephony_sim = row_by_id(telephony, "simulator_fidelity")
    gp_contract = row_by_id(gp, "contract_shape")
    gp_sandbox = row_by_id(gp, "sandbox_depth")
    dispatch_truth = row_by_id(pharmacy_dispatch, "authoritative_truth")
    dispatch_ambiguity = row_by_id(pharmacy_dispatch, "ambiguity_handling")
    outcome_truth = row_by_id(pharmacy_outcome, "authoritative_truth")
    sms_truth = row_by_id(sms, "authoritative_truth")

    assert_true(identity_ui["minimum_bar_actual_later"] == 5, "Identity UI/brand constraint bar drifted")
    assert_true("redirect" in identity_ui["notes"].lower() or "redirect" in identity_ui["due_diligence_question"].lower(), "Identity UI row lost redirect emphasis")
    assert_true(telephony_sim["minimum_bar_mock_now"] == 5, "Telephony simulator fidelity bar drifted")
    assert_true(gp_contract["weight_actual_later"] >= 11, "GP contract-shape weight drifted too low")
    assert_true(gp_sandbox["minimum_bar_mock_now"] == 5, "GP sandbox minimum bar drifted")
    assert_true(dispatch_truth["minimum_bar_actual_later"] == 5, "Pharmacy dispatch truth bar drifted")
    assert_true(dispatch_ambiguity["minimum_bar_mock_now"] == 5, "Pharmacy dispatch ambiguity bar drifted")
    assert_true(outcome_truth["minimum_bar_actual_later"] == 5, "Pharmacy outcome truth bar drifted")
    assert_true(sms["baseline_role"] == "optional_flagged", "SMS family lost optional-flagged posture")
    assert_true(sms_truth["weight_mock_now"] >= sms_truth["weight_actual_later"], "SMS truth unexpectedly became more live-heavy than mock-heavy")

    markdown_scorecards = (DOCS_DIR / "22_provider_selection_scorecards.md").read_text()
    markdown_mock = (DOCS_DIR / "22_mock_provider_design_briefs.md").read_text()
    markdown_playbook = (DOCS_DIR / "22_actual_provider_due_diligence_playbook.md").read_text()
    markdown_rationale = (DOCS_DIR / "22_provider_score_weight_rationale.md").read_text()

    assert_true("Mock_now_execution" in markdown_scorecards, "Scorecard markdown lost Mock_now_execution section")
    assert_true("Actual_provider_strategy_later" in markdown_scorecards, "Scorecard markdown lost Actual_provider_strategy_later section")
    assert_true("Section A — `Mock_now_execution`" in markdown_mock, "Mock briefs markdown lost section A label")
    assert_true("Section B — `Actual_provider_strategy_later`" in markdown_playbook, "Due-diligence markdown lost section B label")
    assert_true(
        "Mock_now_execution" in markdown_rationale and "Actual_provider_strategy_later" in markdown_rationale,
        "Rationale markdown lost lane explanation",
    )

    for marker in HTML_MARKERS:
        assert_true(marker in html, f"Studio HTML missing marker {marker}")
    assert_true("Provider_Atelier" in html, "Studio HTML lost visual mode label")
    assert_true("@media (prefers-reduced-motion: reduce)" in html, "Studio HTML lacks reduced-motion support")
    remote_asset_tokens = ['src="http://', 'src="https://', "src='http://", "src='https://", 'href="http://', 'href="https://', "href='http://", "href='https://", "url(http://", "url(https://"]
    assert_true(not any(token in html for token in remote_asset_tokens), "Studio HTML pulls remote assets")


def main() -> None:
    prereqs = ensure_inputs()
    ensure_deliverables()
    validate_payload(prereqs)


if __name__ == "__main__":
    main()
