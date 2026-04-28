#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SPEC_PATH = ROOT / "docs" / "frontend" / "269_workspace_support_metrics_and_validation_spec.md"
BOARD_PATH = ROOT / "docs" / "frontend" / "269_clinical_beta_validation_board.html"
RUNBOOK_PATH = ROOT / "docs" / "operations" / "269_phase3_observability_and_redaction_runbook.md"
CATALOG_PATH = ROOT / "data" / "contracts" / "269_ui_event_contract_catalog.json"
MATRIX_PATH = ROOT / "data" / "contracts" / "269_transition_and_disclosure_matrix.json"
ALIGNMENT_PATH = ROOT / "data" / "analysis" / "269_algorithm_alignment_notes.md"
REFERENCE_PATH = ROOT / "data" / "analysis" / "269_visual_reference_notes.json"
METRIC_PATH = ROOT / "data" / "analysis" / "269_metric_definitions_and_guardrails.csv"
FAILURE_PATH = ROOT / "data" / "analysis" / "269_event_quality_failure_modes.json"
EXAMPLES_PATH = ROOT / "data" / "test" / "269_expected_metric_and_event_examples.json"
PACKAGE_PATH = ROOT / "package.json"
ROOT_SCRIPT_UPDATES_PATH = ROOT / "tools" / "analysis" / "root_script_updates.py"
PLAYWRIGHT_PATHS = [
    ROOT / "tests" / "playwright" / "269_validation_board.spec.ts",
    ROOT / "tests" / "playwright" / "269_ui_event_redaction.spec.ts",
    ROOT / "tests" / "playwright" / "269_workspace_support_event_chains.spec.ts",
    ROOT / "tests" / "playwright" / "269_validation_board.visual.spec.ts",
]
APP_PATHS = [
    ROOT / "apps" / "clinical-workspace" / "src" / "workspace-support-observability.ts",
    ROOT / "apps" / "clinical-workspace" / "src" / "workspace-validation-board.tsx",
    ROOT / "apps" / "clinical-workspace" / "src" / "staff-shell-seed.tsx",
    ROOT / "apps" / "clinical-workspace" / "src" / "support-workspace-shell.tsx",
    ROOT / "apps" / "clinical-workspace" / "src" / "workspace-shell.css",
    ROOT / "apps" / "clinical-workspace" / "src" / "workspace-shell.data.ts",
]


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def read_text(path: Path) -> str:
    require(path.exists(), f"Missing required file: {path}")
    return path.read_text(encoding="utf-8")


def main() -> None:
    catalog = json.loads(read_text(CATALOG_PATH))
    entries = catalog["entries"]
    require(catalog["visualMode"] == "Clinical_Beta_Validation_Deck", "269 visual mode drifted")
    require(len(entries) >= 20, "269 event catalog unexpectedly thin")
    require(
        {
            "claim",
            "release",
            "start_review",
            "request_more_info",
            "approve",
            "escalate",
            "reopen",
            "close",
            "stale_recovery",
            "handoff",
            "support_replay",
            "support_restore",
            "knowledge_reveal",
            "history_reveal",
            "callback_action",
            "message_action",
            "self_care_action",
            "admin_resolution_action",
        }
        <= {entry["actionFamily"] for entry in entries},
        "269 catalog lost required action families",
    )

    matrix = json.loads(read_text(MATRIX_PATH))
    require(len(matrix["entries"]) >= 4, "269 transition matrix unexpectedly thin")

    with METRIC_PATH.open(encoding="utf-8", newline="") as handle:
        metric_rows = list(csv.DictReader(handle))
    require(len(metric_rows) >= 10, "269 metric table unexpectedly thin")
    require(
        {
            "queue_depth_high_band",
            "median_claim_to_review_minutes",
            "keyboard_only_completion_rate_percent",
            "support_replay_restore_block_rate_percent",
            "support_repair_join_rate_percent",
        }
        <= {row["metricId"] for row in metric_rows},
        "269 metric table drifted",
    )

    failures = json.loads(read_text(FAILURE_PATH))
    require(
        {
            "missing_settlement_join",
            "duplicate_event_emission",
            "stale_route_contract_mismatch",
            "invalid_sequence_ordering",
            "disclosure_fence_failure",
        }
        <= {row["className"] for row in failures["failureModes"]},
        "269 failure mode catalog drifted",
    )

    examples = json.loads(read_text(EXAMPLES_PATH))
    require(len(examples["expectedEvents"]) >= 4, "269 expected event examples drifted")

    spec = read_text(SPEC_PATH).lower()
    for token in [
        "clinical_beta_validation_deck",
        "validationnorthstarband",
        "metricguardrailmatrix",
        "eventchaininspector",
        "redactionfenceverifier",
        "routecontractdriftpanel",
        "supportflowintegrityboard",
        "defectandremediationledger",
        "phase3_internal_validation",
    ]:
        require(token in spec, f"269 spec lost token: {token}")

    board = read_text(BOARD_PATH)
    for token in [
        "269-clinical-beta-validation-board-root",
        "Clinical_Beta_Validation_Deck",
        "ValidationNorthStarBand",
        "MetricGuardrailMatrix",
        "EventChainInspector",
        "RedactionFenceVerifier",
        "RouteContractDriftPanel",
        "SupportFlowIntegrityBoard",
        "DefectAndRemediationLedger",
    ]:
        require(token in board, f"269 board html lost token: {token}")

    runbook = read_text(RUNBOOK_PATH).lower()
    for token in [
        "missing settlement joins",
        "contract drift procedure",
        "support parity procedure",
        "redaction procedure",
    ]:
        require(token in runbook, f"269 runbook lost token: {token}")

    alignment = read_text(ALIGNMENT_PATH).lower()
    for token in [
        "optimistic-success-metric gap",
        "phi-in-selectors-and-traces gap",
        "route-contract-drift gap",
        "support-observability-parity gap",
        "metric-bloat gap",
    ]:
        require(token in alignment, f"269 alignment notes lost token: {token}")

    references = json.loads(read_text(REFERENCE_PATH))
    require(
        {
            "IBM Carbon Dashboards",
            "IBM Carbon Data Table",
            "Linear UI refresh",
            "Vercel New dashboard navigation available",
            "The New Side of Vercel",
            "NHS How we write",
            "Playwright Trace viewer",
            "Playwright Screenshots",
            "Playwright Aria snapshots",
        }
        <= {item["source"] for item in references["references"]},
        "269 visual references drifted",
    )

    package_text = read_text(PACKAGE_PATH)
    root_script_updates_text = read_text(ROOT_SCRIPT_UPDATES_PATH)
    token = '"validate:269-workspace-support-observability": "python3 ./tools/analysis/validate_269_workspace_support_observability.py"'
    require(token in package_text, "package.json missing 269 validator script")
    require(token in root_script_updates_text, "root_script_updates missing 269 validator script")

    app_text = "\n".join(read_text(path) for path in APP_PATHS)
    for token in [
        'CLINICAL_BETA_VALIDATION_VISUAL_MODE = "Clinical_Beta_Validation_Deck"',
        "recordWorkspaceSupportUiEvent",
        "buildClinicalValidationDeckModel",
        'parseStaffPath("/workspace/validation")',
        "WorkspaceValidationRoute",
        "ValidationNorthStarBand",
        "MetricGuardrailMatrix",
        "SupportFlowIntegrityBoard",
        "vecells.phase3.workspace_support_observability",
    ]:
        require(token in app_text, f"app source missing 269 token: {token}")

    for path in PLAYWRIGHT_PATHS:
        require(path.exists(), f"Missing 269 Playwright proof: {path}")

    print(
        json.dumps(
            {
                "catalogEntries": len(entries),
                "metricRows": len(metric_rows),
                "failureModes": len(failures["failureModes"]),
                "references": len(references["references"]),
                "playwrightSpecCount": len(PLAYWRIGHT_PATHS),
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
