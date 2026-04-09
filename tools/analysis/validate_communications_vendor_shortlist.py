#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "external"


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def require(path: Path) -> Path:
    assert_true(path.exists(), f"Missing required seq_031 output: {path}")
    return path


def load_json(path: Path):
    return json.loads(path.read_text())


def load_jsonl(path: Path):
    return [json.loads(line) for line in path.read_text().splitlines() if line.strip()]


def load_csv(path: Path):
    with path.open() as handle:
        return list(csv.DictReader(handle))


def validate() -> None:
    universe_path = require(DATA_DIR / "31_vendor_universe.csv")
    shortlist_path = require(DATA_DIR / "31_vendor_shortlist.json")
    evidence_path = require(DATA_DIR / "31_vendor_research_evidence.jsonl")
    lane_matrix_path = require(DATA_DIR / "31_mock_vs_actual_vendor_lane_matrix.csv")
    kill_switches_path = require(DATA_DIR / "31_vendor_kill_switches.csv")

    require(DOCS_DIR / "31_vendor_universe_telephony_sms_email.md")
    require(DOCS_DIR / "31_mock_provider_lane_for_communications.md")
    require(DOCS_DIR / "31_actual_provider_shortlist_and_due_diligence.md")
    require(DOCS_DIR / "31_vendor_selection_decision_log.md")
    require(DOCS_DIR / "31_vendor_research_evidence_register.md")
    atlas_path = require(DOCS_DIR / "31_vendor_signal_fabric_atlas.html")

    universe_rows = load_csv(universe_path)
    shortlist = load_json(shortlist_path)
    evidence_rows = load_jsonl(evidence_path)
    lane_rows = load_csv(lane_matrix_path)
    kill_switch_rows = load_csv(kill_switches_path)
    atlas_html = atlas_path.read_text()

    assert_true(shortlist["task_id"] == "seq_031", "Unexpected task_id in seq_031 shortlist")
    assert_true(shortlist["visual_mode"] == "Signal_Fabric_Atlas", "Unexpected seq_031 visual mode")
    assert_true(shortlist["recommended_strategy"]["strategy_id"] == "split_vendor_preferred", "Unexpected seq_031 strategy")
    assert_true(shortlist["phase0_gate_posture"]["verdict"] == "withheld", "Phase 0 gate posture must remain withheld")

    required_columns = {
        "vendor_id",
        "vendor_name",
        "provider_family",
        "vendor_lane",
        "supports_test_mode",
        "supports_webhooks",
        "supports_replay_protection",
        "supports_delivery_callbacks",
        "supports_recording_or_attachment_references",
        "uk_or_required_region_support_summary",
        "trust_and_compliance_evidence_refs",
        "cost_governance_notes",
        "lock_in_risk",
        "mock_now_fit_score",
        "actual_later_fit_score",
        "kill_switch_reason_if_any",
        "source_refs",
        "notes",
    }
    assert_true(required_columns.issubset(universe_rows[0].keys()), "Vendor universe CSV is missing required columns")

    families = {row["provider_family"] for row in universe_rows}
    assert_true(families == {"telephony_ivr", "sms", "email", "combined"}, "Unexpected seq_031 family coverage")

    lane_counts = shortlist["summary"]["lane_counts"]
    assert_true(lane_counts["mock_only"] == 4, "Expected four mock-only rows")
    assert_true(lane_counts["shortlisted"] == 6, "Expected six shortlisted rows")
    assert_true(lane_counts["candidate"] >= 4, "Expected at least four candidate rows")
    assert_true(lane_counts["rejected"] >= 2, "Expected at least two rejected rows")

    shortlist_by_family = shortlist["shortlist_by_family"]
    assert_true([row["vendor_id"] for row in shortlist_by_family["telephony_ivr"]] == ["twilio_telephony_ivr", "vonage_telephony_ivr"], "Telephony shortlist drifted")
    assert_true([row["vendor_id"] for row in shortlist_by_family["sms"]] == ["twilio_sms", "vonage_sms"], "SMS shortlist drifted")
    assert_true([row["vendor_id"] for row in shortlist_by_family["email"]] == ["mailgun_email", "sendgrid_email"], "Email shortlist drifted")
    assert_true(shortlist_by_family["combined"] == [], "Combined shortlist must stay empty")

    rejected_email = shortlist["rejected_by_family"]["email"]
    assert_true(rejected_email[0]["vendor_id"] == "postmark_email", "Postmark rejection drifted")

    universe_by_id = {row["vendor_id"]: row for row in universe_rows}
    assert_true(universe_by_id["postmark_email"]["vendor_lane"] == "rejected", "Postmark must stay rejected")
    assert_true(universe_by_id["postmark_email"]["supports_replay_protection"] == "no", "Postmark replay posture drifted")
    assert_true(universe_by_id["vonage_single_suite"]["vendor_lane"] == "rejected", "Vonage single-suite row must stay rejected")
    assert_true(universe_by_id["vecells_signal_fabric"]["vendor_lane"] == "mock_only", "Internal combined mock lane must stay selected")

    assert_true(len(evidence_rows) >= 30, "Expected at least 30 official evidence rows")
    official_hosts = (
        "twilio.com",
        "developer.vonage.com",
        "vonage.com",
        "developers.sinch.com",
        "sinch.com",
        "documentation.mailgun.com",
        "postmarkapp.com",
    )
    assert_true(all(any(host in row["url"] for host in official_hosts) for row in evidence_rows), "Evidence register contains a non-official host")

    assert_true(len(lane_rows) == 4, "Expected one lane matrix row per family")
    lane_by_family = {row["provider_family"]: row for row in lane_rows}
    assert_true(lane_by_family["telephony_ivr"]["mock_provider_id"] == "vecells_signal_twin_voice", "Telephony mock lane drifted")
    assert_true(lane_by_family["email"]["shortlisted_vendor_ids"] == "mailgun_email;sendgrid_email", "Email lane matrix drifted")
    assert_true("ALLOW_REAL_PROVIDER_MUTATION" in lane_by_family["sms"]["live_gate_refs"], "SMS lane matrix must carry live-gate refs")

    assert_true(len(kill_switch_rows) >= 10, "Expected at least ten kill-switch rows")
    kill_ids = {row["kill_switch_id"] for row in kill_switch_rows}
    assert_true("KS_COMMS_010" in kill_ids, "Explicit Postmark rejection kill switch is missing")

    required_markers = [
        'data-testid="vendor-atlas-shell"',
        'data-testid="sticky-header"',
        'data-testid="tab-telephony_ivr"',
        'data-testid="tab-sms"',
        'data-testid="tab-email"',
        'data-testid="tab-mock_lane"',
        'data-testid="tab-actual_lane"',
        'data-testid="provider-grid"',
        'data-testid="lane-toggle"',
        'data-testid="coverage-diagram"',
        'data-testid="dimension-chart"',
        'data-testid="dimension-table"',
        'data-testid="evidence-drawer"',
        "Signal_Fabric_Atlas",
    ]
    for marker in required_markers:
        assert_true(marker in atlas_html, f"Atlas HTML is missing marker: {marker}")

    print(
        json.dumps(
            {
                "task_id": shortlist["task_id"],
                "vendors": shortlist["summary"]["vendor_rows"],
                "shortlisted": shortlist["summary"]["actual_shortlisted_vendor_count"],
                "rejected": shortlist["summary"]["lane_counts"]["rejected"],
                "evidence_rows": len(evidence_rows),
                "strategy": shortlist["recommended_strategy"]["strategy_id"],
            }
        )
    )


if __name__ == "__main__":
    validate()
