#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]

PREVIEW_MANIFEST_PATH = ROOT / "data" / "analysis" / "preview_environment_manifest.json"
SEED_PACK_PATH = ROOT / "data" / "analysis" / "preview_seed_pack_manifest.json"
RESET_MATRIX_PATH = ROOT / "data" / "analysis" / "preview_reset_matrix.csv"
RUNTIME_TOPOLOGY_PATH = ROOT / "data" / "analysis" / "runtime_topology_manifest.json"
HTML_PATH = ROOT / "docs" / "architecture" / "92_preview_environment_control_room.html"
SPEC_PATH = ROOT / "tests" / "playwright" / "preview-environment-control-room.spec.js"
ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = ROOT / "tests" / "playwright" / "package.json"
ROOT_SCRIPT_UPDATES_PATH = ROOT / "tools" / "analysis" / "root_script_updates.py"
PARALLEL_GATE_PATH = ROOT / "tools" / "analysis" / "build_parallel_foundation_tracks_gate.py"
README_PATH = ROOT / "infra" / "preview-environments" / "README.md"
SMOKE_TEST_PATH = ROOT / "infra" / "preview-environments" / "tests" / "preview-environment-smoke.test.mjs"


def read_json(path: Path) -> dict:
    if not path.exists():
        raise SystemExit(f"missing required file: {path.relative_to(ROOT)}")
    return json.loads(path.read_text(encoding="utf-8"))


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def main() -> None:
    preview_manifest = read_json(PREVIEW_MANIFEST_PATH)
    seed_manifest = read_json(SEED_PACK_PATH)
    runtime_topology = read_json(RUNTIME_TOPOLOGY_PATH)
    reset_rows = list(csv.DictReader(RESET_MATRIX_PATH.open(encoding="utf-8")))

    require(preview_manifest["task_id"] == "par_092", "preview manifest task id drifted")
    require(seed_manifest["task_id"] == "par_092", "seed manifest task id drifted")

    preview_summary = preview_manifest["summary"]
    require(preview_summary["preview_environment_count"] == 6, "preview environment count drifted")
    require(preview_summary["seed_pack_count"] == 5, "preview seed pack count drifted")
    require(preview_summary["scenario_count"] == 15, "preview scenario count drifted")
    require(preview_summary["reset_event_count"] == 7, "preview reset event count drifted")
    require(preview_summary["reset_matrix_row_count"] == 48, "preview reset matrix count drifted")
    require(preview_summary["ready_environment_count"] == 3, "preview ready count drifted")
    require(preview_summary["drifted_environment_count"] == 1, "preview drifted count drifted")
    require(preview_summary["expiring_environment_count"] == 1, "preview expiring count drifted")
    require(preview_summary["expired_environment_count"] == 1, "preview expired count drifted")
    require(preview_summary["drift_alert_count"] == 2, "preview drift alert count drifted")

    seed_summary = seed_manifest["summary"]
    require(seed_summary["seed_pack_count"] == 5, "seed pack manifest count drifted")
    require(seed_summary["scenario_count"] == 15, "seed pack scenario count drifted")
    require(seed_summary["structure_only_scenario_count"] == 5, "structure-only scenario count drifted")
    require(seed_summary["substrate_fixture_count"] == 40, "substrate fixture count drifted")

    require(len(reset_rows) == 48, "reset matrix row count drifted")
    require(
        any(row["teardown_after_expiry"] == "true" for row in reset_rows),
        "expired teardown row missing from reset matrix",
    )

    preview_refs = {row["previewEnvironmentRef"] for row in preview_manifest["preview_environments"]}
    require(
        {
            "pev_branch_patient_care",
            "pev_branch_support_replay",
            "pev_branch_clinical_hub",
            "pev_rc_pharmacy_dispatch",
            "pev_branch_ops_control",
            "pev_rc_governance_audit",
        }
        == preview_refs,
        "preview environment refs drifted",
    )
    require(
        any(
            "PARALLEL_INTERFACE_GAP_092_CLINICAL_WORKSPACE_REFERENCE_CASE_PENDING"
            in row["parallelInterfaceGapRefs"]
            for row in preview_manifest["preview_environments"]
        ),
        "clinical workspace preview gap missing",
    )
    require(
        any(
            "FOLLOW_ON_DEPENDENCY_091_NONPROD_PROMOTION_ATTESTATION_PENDING"
            in row["followOnDependencyRefs"]
            for row in preview_manifest["preview_environments"]
        ),
        "preview promotion follow-on dependency missing",
    )

    require(
        runtime_topology.get("preview_environment_manifest_ref")
        == "data/analysis/preview_environment_manifest.json",
        "runtime topology missing preview environment manifest ref",
    )
    require(
        runtime_topology.get("preview_seed_pack_manifest_ref")
        == "data/analysis/preview_seed_pack_manifest.json",
        "runtime topology missing preview seed pack ref",
    )
    require(
        runtime_topology.get("preview_reset_matrix_ref")
        == "data/analysis/preview_reset_matrix.csv",
        "runtime topology missing preview reset matrix ref",
    )

    html_text = HTML_PATH.read_text(encoding="utf-8")
    for token in [
        "Preview_Environment_Control_Room",
        'data-testid="environment-grid"',
        'data-testid="seed-matrix"',
        'data-testid="ttl-timeline"',
        'data-testid="manifest-table"',
        'data-testid="reset-table"',
        'data-testid="inspector"',
        "filter-owner",
        "filter-env-state",
        "filter-seed-pack",
        "filter-drift-state",
        "filter-expiry-window",
    ]:
        require(token in html_text, f"missing control room html token: {token}")

    spec_text = SPEC_PATH.read_text(encoding="utf-8")
    for token in [
        "filter behavior and synchronized selection",
        "keyboard navigation and focus management",
        "reduced-motion handling",
        "responsive layout at desktop and tablet widths",
        "accessibility smoke checks and landmark verification",
        "verification that expired or drifted environments are visibly and semantically distinct from ready ones",
        "team_support_workspace",
        "pev_rc_pharmacy_dispatch",
        "pev_rc_governance_audit",
    ]:
        require(token in spec_text, f"missing control room spec token: {token}")

    for path, token in [
        (ROOT_PACKAGE_PATH, "validate:preview-env-reset"),
        (ROOT_PACKAGE_PATH, "build_preview_environment_and_reset.py"),
        (PLAYWRIGHT_PACKAGE_PATH, "preview-environment-control-room.spec.js"),
        (ROOT_SCRIPT_UPDATES_PATH, "validate:preview-env-reset"),
        (PARALLEL_GATE_PATH, "preview-environment-control-room.spec.js"),
        (README_PATH, "deterministic bootstrap, reset, drift-detect, and teardown flows"),
        (SMOKE_TEST_PATH, "local bootstrap, drift detect, reset, and teardown remain deterministic"),
    ]:
        require(token in path.read_text(encoding="utf-8"), f"missing token {token} in {path.relative_to(ROOT)}")

    print("preview environment and reset validation passed")


if __name__ == "__main__":
    main()
