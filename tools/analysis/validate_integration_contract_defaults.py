#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import re
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "external"

ASSUMPTION_LEDGER_CSV_PATH = DATA_DIR / "integration_assumption_ledger.csv"
DEGRADED_DEFAULTS_JSON_PATH = DATA_DIR / "degraded_mode_defaults.json"
PROVIDER_CONTRACT_DEFAULTS_YAML_PATH = DATA_DIR / "provider_contract_defaults.yaml"
CONFLICT_REGISTER_JSON_PATH = DATA_DIR / "integration_contract_conflict_register.json"

ASSUMPTIONS_DOC_PATH = DOCS_DIR / "40_integration_contract_assumptions.md"
DEGRADED_DOC_PATH = DOCS_DIR / "40_degraded_mode_defaults.md"
MOCK_VS_ACTUAL_DOC_PATH = DOCS_DIR / "40_mock_vs_actual_contract_delta.md"
CONFLICT_DOC_PATH = DOCS_DIR / "40_integration_contract_conflict_register.md"
COCKPIT_HTML_PATH = DOCS_DIR / "40_integration_contract_cockpit.html"

EXPECTED_SUMMARY = {
    "dependency_count": 20,
    "family_count": 8,
    "ambiguous_default_count": 20,
    "degraded_default_count": 20,
    "simulator_bound_count": 17,
    "watch_contract_only_count": 3,
    "hard_blocker_count": 14,
    "operational_blocker_count": 2,
    "watch_only_count": 4,
    "conflict_count": 20,
    "unresolved_conflict_count": 16,
    "watch_conflict_count": 4,
}

HTML_MARKERS = [
    'data-testid="cockpit-shell"',
    'data-testid="rail"',
    'data-testid="filter-family"',
    'data-testid="filter-ambiguity"',
    'data-testid="filter-blocker"',
    'data-testid="ledger-table"',
    'data-testid="proof-card"',
    'data-testid="ambiguity-card"',
    'data-testid="inspector"',
    'data-testid="conflict-strip"',
    'data-testid="parity-table"',
    'data-testid="sort-freshness"',
    'data-testid="sort-blocker"',
]

CSV_REQUIRED_FIELDS = {
    "dependency_id",
    "dependency_name",
    "dependency_family",
    "baseline_scope",
    "blocker_impact",
    "freshness_window_days",
    "canonical_purpose",
    "authoritative_success_proof",
    "authoritative_proof_objects",
    "insufficient_evidence_patterns",
    "ambiguity_class",
    "degraded_mode_default",
    "manual_fallback_default",
    "patient_visible_posture_default",
    "staff_visible_posture_default",
    "support_visible_posture_default",
    "closure_blocker_implications",
    "simulator_counterparts",
    "live_upgrade_evidence",
    "non_negotiable_assumptions",
    "provider_variability_envelope",
    "live_gate_or_approval_required",
    "explicit_override_rule",
    "source_references",
}


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def load_json(path: Path) -> Any:
    return json.loads(path.read_text())


def load_csv(path: Path) -> list[dict[str, str]]:
    with path.open() as handle:
        return list(csv.DictReader(handle))


def ensure_deliverables() -> None:
    required = [
        ASSUMPTION_LEDGER_CSV_PATH,
        DEGRADED_DEFAULTS_JSON_PATH,
        PROVIDER_CONTRACT_DEFAULTS_YAML_PATH,
        CONFLICT_REGISTER_JSON_PATH,
        ASSUMPTIONS_DOC_PATH,
        DEGRADED_DOC_PATH,
        MOCK_VS_ACTUAL_DOC_PATH,
        CONFLICT_DOC_PATH,
        COCKPIT_HTML_PATH,
    ]
    missing = [str(path) for path in required if not path.exists()]
    assert_true(not missing, "Missing seq_040 deliverables:\n" + "\n".join(missing))


def validate_degraded_defaults() -> dict[str, Any]:
    payload = load_json(DEGRADED_DEFAULTS_JSON_PATH)
    assert_true(payload["task_id"] == "seq_040", "Degraded defaults task id drifted")
    assert_true(payload["visual_mode"] == "Contract_Cockpit", "Degraded defaults visual mode drifted")
    summary = payload["summary"]
    for key, value in EXPECTED_SUMMARY.items():
        assert_true(summary[key] == value, f"Summary drifted for {key}: expected {value}, found {summary[key]}")

    rows = payload["dependencies"]
    assert_true(len(rows) == EXPECTED_SUMMARY["dependency_count"], "Dependency row count drifted")
    ids = [row["dependency_id"] for row in rows]
    assert_true(len(ids) == len(set(ids)), "Dependency ids lost uniqueness")

    required_scalar_fields = [
        "canonical_purpose",
        "authoritative_success_proof",
        "ambiguity_class",
        "degraded_mode_default",
        "manual_fallback_default",
        "patient_visible_posture_default",
        "staff_visible_posture_default",
        "support_visible_posture_default",
        "closure_blocker_implications",
        "explicit_override_rule",
    ]
    required_list_fields = [
        "authoritative_proof_objects",
        "insufficient_evidence_patterns",
        "simulator_counterparts",
        "live_upgrade_evidence",
        "non_negotiable_assumptions",
        "provider_variability_envelope",
        "live_gate_or_approval_required",
        "source_references",
    ]

    for row in rows:
        for field in required_scalar_fields:
            assert_true(bool(row[field]), f"{row['dependency_id']} lost required field {field}")
        for field in required_list_fields:
            assert_true(bool(row[field]), f"{row['dependency_id']} lost required list field {field}")
        assert_true(row["explicit_override_required"] is True, f"{row['dependency_id']} lost explicit override requirement")

    urgent = next(row for row in rows if row["dependency_id"] == "dep_pharmacy_urgent_return_professional_routes")
    assert_true(
        "human-operated safety net" in " ".join(urgent["non_negotiable_assumptions"]),
        "Urgent-return row lost explicit human-operated non-negotiables",
    )

    standards = next(row for row in rows if row["dependency_id"] == "dep_nhs_assurance_and_standards_sources")
    assert_true(standards["freshness_window_days"] == 7, "Standards row freshness window drifted")
    assert_true(not standards["simulator_bound"], "Standards row unexpectedly gained simulator binding")
    return payload


def validate_ledger_csv(payload: dict[str, Any]) -> None:
    rows = load_csv(ASSUMPTION_LEDGER_CSV_PATH)
    assert_true(len(rows) == payload["summary"]["dependency_count"], "Ledger CSV row count drifted")
    assert_true(CSV_REQUIRED_FIELDS.issubset(rows[0].keys()), "Ledger CSV columns drifted")

    csv_ids = {row["dependency_id"] for row in rows}
    json_ids = {row["dependency_id"] for row in payload["dependencies"]}
    assert_true(csv_ids == json_ids, "Ledger CSV dependency ids drifted from degraded defaults JSON")

    for row in rows:
        for field in CSV_REQUIRED_FIELDS:
            assert_true(bool(row[field]), f"Ledger CSV blank field {field} for {row['dependency_id']}")


def validate_provider_yaml() -> None:
    text = PROVIDER_CONTRACT_DEFAULTS_YAML_PATH.read_text()
    assert_true('task_id: "seq_040"' in text, "Provider YAML task id drifted")
    dependency_count = len(re.findall(r"^\s+dependency_id:\s", text, flags=re.MULTILINE))
    assert_true(dependency_count == EXPECTED_SUMMARY["dependency_count"], "Provider YAML dependency count drifted")
    override_count = text.count("explicit_override_required: true")
    assert_true(override_count == EXPECTED_SUMMARY["dependency_count"], "Provider YAML lost override flags")
    assert_true("dep_assistive_model_vendor_family" in text, "Provider YAML lost assistive vendor row")
    assert_true("dep_nhs_assurance_and_standards_sources" in text, "Provider YAML lost standards row")


def validate_conflict_register() -> None:
    payload = load_json(CONFLICT_REGISTER_JSON_PATH)
    assert_true(payload["task_id"] == "seq_040", "Conflict register task id drifted")
    assert_true(payload["visual_mode"] == "Contract_Cockpit", "Conflict register visual mode drifted")
    summary = payload["summary"]
    assert_true(summary["conflict_count"] == EXPECTED_SUMMARY["conflict_count"], "Conflict count drifted")
    assert_true(
        summary["unresolved_conflict_count"] == EXPECTED_SUMMARY["unresolved_conflict_count"],
        "Unresolved conflict count drifted",
    )
    assert_true(summary["watch_conflict_count"] == EXPECTED_SUMMARY["watch_conflict_count"], "Watch conflict count drifted")

    rows = payload["conflicts"]
    assert_true(len(rows) == EXPECTED_SUMMARY["conflict_count"], "Conflict row count drifted")
    statuses = {row["status"] for row in rows}
    assert_true(statuses == {"open", "watch"}, "Conflict statuses drifted")
    for row in rows:
        assert_true(bool(row["provider_pressure_summary"]), f"Conflict row missing provider pressure summary: {row['conflict_id']}")
        assert_true(bool(row["explicit_override_rule"]), f"Conflict row missing override rule: {row['conflict_id']}")
        assert_true(bool(row["live_gate_refs"]), f"Conflict row missing live gate refs: {row['conflict_id']}")


def validate_docs_and_html() -> None:
    for path in [ASSUMPTIONS_DOC_PATH, DEGRADED_DOC_PATH, MOCK_VS_ACTUAL_DOC_PATH, CONFLICT_DOC_PATH]:
        text = path.read_text()
        assert_true("## Mock_now_execution" in text, f"{path.name} lost Mock_now_execution section")
        assert_true("## Actual_provider_strategy_later" in text, f"{path.name} lost Actual_provider_strategy_later section")

    html = COCKPIT_HTML_PATH.read_text()
    assert_true("<title>40 Integration Contract Cockpit</title>" in html, "Cockpit title drifted")
    assert_true("Proof -> Ambiguity -> Degraded -> Manual Fallback" in html, "Cockpit lost fallback ladder heading")
    for marker in HTML_MARKERS:
        assert_true(marker in html, f"Missing cockpit marker: {marker}")


def main() -> None:
    ensure_deliverables()
    payload = validate_degraded_defaults()
    validate_ledger_csv(payload)
    validate_provider_yaml()
    validate_conflict_register()
    validate_docs_and_html()
    print("seq_040 validation passed")


if __name__ == "__main__":
    main()
