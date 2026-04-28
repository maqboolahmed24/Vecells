#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "external"
TESTS_DIR = ROOT / "tests" / "playwright"


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def require(path: Path) -> Path:
    assert_true(path.exists(), f"Missing required seq_034 output: {path}")
    return path


def load_json(path: Path):
    return json.loads(path.read_text())


def load_jsonl(path: Path):
    return [json.loads(line) for line in path.read_text().splitlines() if line.strip()]


def load_csv(path: Path):
    with path.open() as handle:
        return list(csv.DictReader(handle))


def validate() -> None:
    universe_path = require(DATA_DIR / "34_vendor_universe.csv")
    shortlist_path = require(DATA_DIR / "34_vendor_shortlist.json")
    evidence_path = require(DATA_DIR / "34_vendor_research_evidence.jsonl")
    lane_matrix_path = require(DATA_DIR / "34_mock_vs_actual_vendor_lane_matrix.csv")
    kill_switches_path = require(DATA_DIR / "34_vendor_kill_switches.csv")

    require(DOCS_DIR / "34_vendor_universe_transcription_and_scanning.md")
    require(DOCS_DIR / "34_mock_provider_lane_for_evidence_processing.md")
    require(DOCS_DIR / "34_actual_provider_shortlist_and_due_diligence.md")
    require(DOCS_DIR / "34_vendor_selection_decision_log.md")
    require(DOCS_DIR / "34_vendor_research_evidence_register.md")
    atlas_path = require(DOCS_DIR / "34_evidence_signal_atlas.html")
    require(TESTS_DIR / "34_evidence_signal_atlas.spec.js")

    universe_rows = load_csv(universe_path)
    shortlist = load_json(shortlist_path)
    evidence_rows = load_jsonl(evidence_path)
    lane_rows = load_csv(lane_matrix_path)
    kill_rows = load_csv(kill_switches_path)
    atlas_html = atlas_path.read_text()

    assert_true(shortlist["task_id"] == "seq_034", "Unexpected task_id in seq_034 shortlist")
    assert_true(shortlist["visual_mode"] == "Evidence_Signal_Atlas", "Unexpected visual mode")
    assert_true(
        shortlist["recommended_strategy"]["strategy_id"] == "split_vendor_preferred_with_local_scan_bias",
        "Unexpected recommended strategy",
    )
    assert_true(shortlist["phase0_gate_posture"]["verdict"] == "withheld", "Phase 0 posture must remain withheld")

    required_columns = {
        "vendor_id",
        "vendor_name",
        "provider_family",
        "vendor_lane",
        "supports_async_jobs",
        "supports_partial_results",
        "supports_confidence_or_quality_bands",
        "supports_webhooks",
        "supports_replay_protection",
        "supports_region_controls",
        "retention_and_deletion_notes",
        "quarantine_fit_score",
        "mock_now_fit_score",
        "actual_later_fit_score",
        "kill_switch_reason_if_any",
        "source_refs",
        "notes",
    }
    assert_true(required_columns.issubset(universe_rows[0].keys()), "Universe CSV is missing required columns")

    families = {row["provider_family"] for row in universe_rows}
    assert_true(families == {"transcription", "artifact_scanning", "combined"}, "Unexpected family coverage")

    lane_counts = shortlist["summary"]["lane_counts"]
    assert_true(lane_counts["shortlisted"] == 4, "Expected four shortlisted rows")
    assert_true(lane_counts["candidate"] == 3, "Expected three candidate rows")
    assert_true(lane_counts["mock_only"] == 3, "Expected three mock-only rows")
    assert_true(lane_counts["rejected"] == 3, "Expected three rejected rows")

    shortlist_by_family = shortlist["shortlist_by_family"]
    assert_true(
        [row["vendor_id"] for row in shortlist_by_family["transcription"]]
        == ["assemblyai_transcription", "deepgram_transcription"],
        "Transcription shortlist drifted",
    )
    assert_true(
        [row["vendor_id"] for row in shortlist_by_family["artifact_scanning"]]
        == ["aws_guardduty_s3_scan", "opswat_metadefender_cloud"],
        "Artifact scanning shortlist drifted",
    )
    assert_true(shortlist_by_family["combined"] == [], "Combined shortlist must stay empty")

    rejected_ids = {
        row["vendor_id"]
        for family_rows in shortlist["rejected_by_family"].values()
        for row in family_rows
    }
    assert_true(
        {"google_speech_transcription", "virustotal_private_scanning", "aws_evidence_stack"}.issubset(rejected_ids),
        "Expected rejected vendors are missing",
    )

    universe_by_id = {row["vendor_id"]: row for row in universe_rows}
    assert_true(
        universe_by_id["google_speech_transcription"]["vendor_lane"] == "rejected",
        "Google row must stay rejected",
    )
    assert_true(
        universe_by_id["aws_guardduty_s3_scan"]["supports_webhooks"] == "yes",
        "GuardDuty webhook posture drifted",
    )
    assert_true(
        universe_by_id["vecells_artifact_quarantine_twin"]["vendor_lane"] == "mock_only",
        "Artifact twin must stay mock-only",
    )

    assert_true(len(evidence_rows) >= 20, "Expected at least 20 official evidence rows")
    official_hosts = (
        "developers.deepgram.com",
        "deepgram.com",
        "assemblyai.com",
        "learn.microsoft.com",
        "docs.aws.amazon.com",
        "cloud.google.com",
        "opswat.com",
        "cloudmersive.com",
        "api.cloudmersive.com",
        "docs.virustotal.com",
    )
    assert_true(
        all(any(host in row["url"] for host in official_hosts) for row in evidence_rows),
        "Evidence register contains a non-official host",
    )

    assert_true(len(lane_rows) == 3, "Expected one lane matrix row per family")
    lane_by_family = {row["provider_family"]: row for row in lane_rows}
    assert_true(
        lane_by_family["transcription"]["mock_provider_ids"] == "vecells_transcript_readiness_twin",
        "Transcription mock lane drifted",
    )
    assert_true(
        lane_by_family["artifact_scanning"]["actual_shortlisted_vendor_ids"]
        == "aws_guardduty_s3_scan;opswat_metadefender_cloud",
        "Artifact scanning shortlist in lane matrix drifted",
    )
    assert_true(
        "ALLOW_REAL_PROVIDER_MUTATION" in lane_by_family["artifact_scanning"]["live_gate_refs"],
        "Live gate refs must carry mutation gate",
    )

    assert_true(len(kill_rows) >= 8, "Expected at least eight kill-switch rows")
    kill_ids = {row["kill_switch_id"] for row in kill_rows}
    assert_true("KS_EVID_006" in kill_ids, "Combined-suite kill switch missing")

    required_markers = [
        'data-testid="vendor-atlas-shell"',
        'data-testid="sticky-header"',
        'data-testid="tab-transcription"',
        'data-testid="tab-artifact_scanning"',
        'data-testid="tab-mock_lane"',
        'data-testid="tab-actual_lane"',
        'data-testid="provider-grid"',
        'data-testid="lane-toggle"',
        'data-testid="coverage-diagram"',
        'data-testid="dimension-chart"',
        'data-testid="dimension-table"',
        'data-testid="evidence-drawer"',
        "Evidence_Signal_Atlas",
    ]
    for marker in required_markers:
        assert_true(marker in atlas_html, f"Atlas HTML is missing marker: {marker}")

    assert_true(shortlist["summary"]["selected_access_row_count"] == 4, "Expected four selected access rows")

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
