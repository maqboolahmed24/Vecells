#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "external"
APP_DIR = ROOT / "apps" / "mock-nhs-app-onboarding-studio"


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def load_json(path: Path):
    return json.loads(path.read_text())


def load_csv(path: Path):
    with path.open() as handle:
        return list(csv.DictReader(handle))


def require(path: Path) -> Path:
    assert_true(path.exists(), f"Missing required seq_029 output: {path}")
    return path


def validate_pack() -> None:
    eligibility_csv = require(DATA_DIR / "nhs_app_eligibility_matrix.csv")
    stage_json = require(DATA_DIR / "nhs_app_stage_progression.json")
    assurance_csv = require(DATA_DIR / "nhs_app_assurance_artifact_matrix.csv")
    live_gates_json = require(DATA_DIR / "nhs_app_live_gate_checklist.json")

    require(DOCS_DIR / "29_nhs_app_onboarding_strategy.md")
    require(DOCS_DIR / "29_nhs_app_expression_of_interest_and_eligibility_matrix.md")
    require(DOCS_DIR / "29_nhs_app_sandpit_to_aos_progression_pack.md")
    require(DOCS_DIR / "29_nhs_app_scal_and_assurance_artifact_matrix.md")
    require(DOCS_DIR / "29_nhs_app_live_gate_and_release_strategy.md")

    require(APP_DIR / "README.md")
    require(APP_DIR / "src" / "generated" / "nhsAppPack.ts")
    require(APP_DIR / "public" / "nhs-app-stage-progression.json")

    eligibility_rows = load_csv(eligibility_csv)
    assurance_rows = load_csv(assurance_csv)
    pack = load_json(stage_json)
    live_gates = load_json(live_gates_json)

    assert_true(pack["task_id"] == "seq_029", "Unexpected task_id in seq_029 pack")
    assert_true(pack["visual_mode"] == "Embedded_Channel_Atelier", "Unexpected visual mode")
    assert_true(pack["summary"]["stage_count"] >= 10, "Expected at least 10 stage rows")
    assert_true(pack["summary"]["eligibility_row_count"] >= 12, "Expected at least 12 eligibility rows")
    assert_true(pack["summary"]["assurance_artifact_count"] >= 12, "Expected at least 12 assurance rows")
    assert_true(pack["summary"]["preview_route_count"] >= 5, "Expected at least 5 preview routes")
    assert_true(pack["summary"]["live_gate_count"] >= 8, "Expected at least 8 live gates")

    category_ids = {row["category_id"] for row in pack["stage_categories"]}
    assert_true(
        category_ids == {"eligibility", "review", "design", "sandpit", "aos", "assurance", "release"},
        "Stage categories must match the required rail",
    )

    stage_ids = set()
    for stage in pack["stages"]:
        stage_ids.add(stage["nhs_app_stage_id"])
        for key in (
            "nhs_app_stage_id",
            "nhs_app_stage_name",
            "entry_requirements",
            "required_documents",
            "demo_expectations",
            "technical_expectations",
            "design_expectations",
            "browser_automation_possible",
            "mock_now_action",
            "actual_later_action",
            "blocking_dependencies",
            "notes",
        ):
            assert_true(key in stage, f"Stage missing required key: {key}")
        assert_true(
            stage["browser_automation_possible"] in {"yes", "partial", "no"},
            f"Invalid browser_automation_possible for {stage['nhs_app_stage_id']}",
        )

    assert_true(
        {"nhs_app_stage_sandpit_delivery", "nhs_app_stage_aos_delivery", "nhs_app_stage_scal_assurance"}.issubset(stage_ids),
        "Sandpit, AOS, and assurance stages are required",
    )

    preview_route_ids = {row["route_family_ref"] for row in pack["preview_routes"]}
    assert_true(
        {
            "rf_intake_self_service",
            "rf_patient_secure_link_recovery",
            "rf_patient_requests",
            "rf_patient_appointments",
            "rf_patient_health_record",
            "rf_patient_messages",
        }.issubset(preview_route_ids),
        "Preview routes must stay tied to the approved patient route families",
    )

    eligibility_ids = {row["criterion_id"] for row in eligibility_rows}
    assert_true("crit_deferred_scope_boundary" in eligibility_ids, "Missing deferred-scope control row")
    assert_true("crit_one_portal_two_shells" in eligibility_ids, "Missing one-portal/two-shells row")

    artifact_ids = {row["artifact_id"] for row in assurance_rows}
    assert_true("art_scal_workspace" in artifact_ids, "Missing SCAL workspace artifact")
    assert_true("art_connection_agreement" in artifact_ids, "Missing connection agreement artifact")
    assert_true("art_embedded_preview_board" in artifact_ids, "Missing embedded preview artifact")

    gate_rows = live_gates["live_gates"]
    blocked_gate_ids = {row["gate_id"] for row in gate_rows if row["status"] == "blocked"}
    assert_true("LIVE_GATE_PHASE7_SCOPE_WINDOW" in blocked_gate_ids, "Phase 7 scope gate must stay blocked")
    assert_true("LIVE_GATE_MUTATION_FLAG_ENABLED" in blocked_gate_ids, "Mutation flag gate must stay blocked")
    assert_true(
        live_gates["verdict"] == "blocked",
        "The seq_029 live-later path must remain blocked by default",
    )

    default_target = live_gates["dry_run_defaults"]["default_target_url"]
    assert_true(default_target.endswith("SCAL_and_Release_Gates"), "Dry-run default URL should open release gates")

    pack_public = load_json(APP_DIR / "public" / "nhs-app-stage-progression.json")
    assert_true(pack_public["summary"] == pack["summary"], "Public pack summary drifted from analysis pack")

    print(
        json.dumps(
            {
                "task_id": pack["task_id"],
                "stage_count": pack["summary"]["stage_count"],
                "eligibility_row_count": len(eligibility_rows),
                "assurance_artifact_count": len(assurance_rows),
                "live_gate_count": len(gate_rows),
                "verdict": live_gates["verdict"],
            }
        )
    )


if __name__ == "__main__":
    validate_pack()
