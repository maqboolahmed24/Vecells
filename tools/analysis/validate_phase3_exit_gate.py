#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "analysis"))

from root_script_updates import ROOT_SCRIPT_UPDATES

DOCS_GOVERNANCE_DIR = ROOT / "docs" / "governance"
DOCS_FRONTEND_DIR = ROOT / "docs" / "frontend"
DATA_ANALYSIS_DIR = ROOT / "data" / "analysis"
DATA_TEST_DIR = ROOT / "data" / "test"
PLAYWRIGHT_DIR = ROOT / "tests" / "playwright"
TOOLS_ANALYSIS_DIR = ROOT / "tools" / "analysis"
PACKAGE_PATH = ROOT / "package.json"

PACK_PATH = DOCS_GOVERNANCE_DIR / "277_phase3_exit_gate_pack.md"
DECISION_DOC_PATH = DOCS_GOVERNANCE_DIR / "277_phase3_go_no_go_decision.md"
SCORECARD_DOC_PATH = DOCS_GOVERNANCE_DIR / "277_phase3_conformance_scorecard.md"
BOUNDARY_DOC_PATH = DOCS_GOVERNANCE_DIR / "277_phase3_to_phase4_boundary.md"
BETA_BOUNDARY_DOC_PATH = DOCS_GOVERNANCE_DIR / "277_phase3_clinical_beta_and_live_later_boundary.md"
BOARD_PATH = DOCS_FRONTEND_DIR / "277_phase3_exit_board.html"

REFERENCE_NOTES_PATH = DATA_ANALYSIS_DIR / "277_visual_reference_notes.json"
DECISION_JSON_PATH = DATA_ANALYSIS_DIR / "277_phase3_exit_gate_decision.json"
ROWS_JSON_PATH = DATA_ANALYSIS_DIR / "277_phase3_conformance_rows.json"
MANIFEST_CSV_PATH = DATA_ANALYSIS_DIR / "277_phase3_evidence_manifest.csv"
INVARIANTS_JSON_PATH = DATA_ANALYSIS_DIR / "277_phase3_invariant_proof_map.json"
OPEN_ITEMS_JSON_PATH = DATA_ANALYSIS_DIR / "277_phase3_open_items_and_phase4_carry_forward.json"

BUILDER_PATH = TOOLS_ANALYSIS_DIR / "build_277_phase3_exit_gate_pack.py"
VALIDATOR_PATH = TOOLS_ANALYSIS_DIR / "validate_phase3_exit_gate.py"
PLAYWRIGHT_PATH = PLAYWRIGHT_DIR / "277_phase3_exit_board.spec.ts"

SUITE_RESULT_PATHS = {
    "seq_272": DATA_TEST_DIR / "272_suite_results.json",
    "seq_273": DATA_TEST_DIR / "273_suite_results.json",
    "seq_274": DATA_TEST_DIR / "274_suite_results.json",
    "seq_275": DATA_TEST_DIR / "275_suite_results.json",
    "seq_276": DATA_TEST_DIR / "276_suite_results.json",
}


def fail(message: str) -> None:
    raise SystemExit(message)


def require(condition: bool, message: str) -> None:
    if not condition:
        fail(message)


def read_text(path: Path) -> str:
    require(path.exists(), f"MISSING_REQUIRED_FILE:{path}")
    return path.read_text(encoding="utf-8")


def load_json(path: Path):
    return json.loads(read_text(path))


def load_csv(path: Path) -> list[dict[str, str]]:
    require(path.exists(), f"MISSING_REQUIRED_FILE:{path}")
    with path.open("r", encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def normalize_repo_ref(value: str) -> Path:
    return Path(value.split("#", 1)[0])


def main() -> None:
    for path in [
        PACK_PATH,
        DECISION_DOC_PATH,
        SCORECARD_DOC_PATH,
        BOUNDARY_DOC_PATH,
        BETA_BOUNDARY_DOC_PATH,
        BOARD_PATH,
        REFERENCE_NOTES_PATH,
        DECISION_JSON_PATH,
        ROWS_JSON_PATH,
        MANIFEST_CSV_PATH,
        INVARIANTS_JSON_PATH,
        OPEN_ITEMS_JSON_PATH,
        BUILDER_PATH,
        VALIDATOR_PATH,
        PLAYWRIGHT_PATH,
        PACKAGE_PATH,
    ] + list(SUITE_RESULT_PATHS.values()):
        require(path.exists(), f"MISSING_REQUIRED_FILE:{path}")

    pack_text = read_text(PACK_PATH)
    decision_doc = read_text(DECISION_DOC_PATH)
    scorecard_doc = read_text(SCORECARD_DOC_PATH)
    boundary_doc = read_text(BOUNDARY_DOC_PATH)
    beta_boundary_doc = read_text(BETA_BOUNDARY_DOC_PATH)
    board_html = read_text(BOARD_PATH)
    spec_text = read_text(PLAYWRIGHT_PATH)
    package_text = read_text(PACKAGE_PATH)

    references = load_json(REFERENCE_NOTES_PATH)
    decision = load_json(DECISION_JSON_PATH)
    rows = load_json(ROWS_JSON_PATH)
    invariants = load_json(INVARIANTS_JSON_PATH)
    open_items = load_json(OPEN_ITEMS_JSON_PATH)
    manifest = load_csv(MANIFEST_CSV_PATH)
    suite_results = {task_id: load_json(path) for task_id, path in SUITE_RESULT_PATHS.items()}

    require(references["taskId"] == "seq_277", "277_REFERENCE_NOTES_TASK_ID_DRIFT")
    require(references["reviewedOn"] == "2026-04-18", "277_REFERENCE_NOTES_DATE_DRIFT")
    require(len(references["references"]) >= 9, "277_REFERENCE_COUNT_TOO_LOW")
    require(
        all(entry["borrowed"] and entry["rejected"] for entry in references["references"]),
        "277_REFERENCE_BORROW_REJECT_DRIFT",
    )

    require(decision["taskId"] == "seq_277", "277_DECISION_TASK_ID_DRIFT")
    require(decision["visualMode"] == "Human_Checkpoint_Exit_Board", "277_VISUAL_MODE_DRIFT")
    require(decision["verdict"] == "go_with_constraints", "277_VERDICT_DRIFT")
    require(decision["phase4EntryVerdict"] == "approved", "277_PHASE4_VERDICT_DRIFT")
    require(decision["clinicalBetaVerdict"] == "approved", "277_BETA_VERDICT_DRIFT")
    require(decision["liveProviderRolloutVerdict"] == "withheld", "277_LIVE_PROVIDER_VERDICT_DRIFT")
    require(decision["scorecardSummary"]["rowCount"] == 12, "277_ROW_COUNT_DRIFT")
    require(decision["scorecardSummary"]["approvedCount"] == 8, "277_APPROVED_COUNT_DRIFT")
    require(
        decision["scorecardSummary"]["goWithConstraintsCount"] == 4,
        "277_CONSTRAINED_COUNT_DRIFT",
    )
    require(decision["scorecardSummary"]["withheldCount"] == 0, "277_WITHHELD_COUNT_DRIFT")
    require(len(decision["constraints"]) == 3, "277_CONSTRAINT_COUNT_DRIFT")
    require(len(decision["mandatoryQuestions"]) == 6, "277_QUESTION_COUNT_DRIFT")
    require(len(decision["decisiveSuites"]) == 5, "277_DECISIVE_SUITE_COUNT_DRIFT")

    require(len(rows) == 12, "277_ROWS_LENGTH_DRIFT")
    require(
        [row["rowId"] for row in rows]
        == [
            "PH3_ROW_01",
            "PH3_ROW_02",
            "PH3_ROW_03",
            "PH3_ROW_04",
            "PH3_ROW_05",
            "PH3_ROW_06",
            "PH3_ROW_07",
            "PH3_ROW_08",
            "PH3_ROW_09",
            "PH3_ROW_10",
            "PH3_ROW_11",
            "PH3_ROW_12",
        ],
        "277_ROW_ORDER_DRIFT",
    )
    require(
        {row["status"] for row in rows} == {"approved", "go_with_constraints"},
        "277_ROW_STATUS_SET_DRIFT",
    )
    require(
        [row["rowId"] for row in rows if row["status"] == "go_with_constraints"]
        == ["PH3_ROW_03", "PH3_ROW_05", "PH3_ROW_06", "PH3_ROW_07"],
        "277_CONSTRAINED_ROW_SET_DRIFT",
    )
    require(
        any("Deterministic queue" in row["capabilityFamily"] for row in rows),
        "277_QUEUE_ROW_MISSING",
    )
    require(
        any("Self-care" in row["capabilityFamily"] for row in rows),
        "277_SELFCARE_ROW_MISSING",
    )
    require(
        any("Accessibility" in row["capabilityFamily"] for row in rows),
        "277_ACCESSIBILITY_ROW_MISSING",
    )

    require(len(manifest) == 38, "277_MANIFEST_COUNT_DRIFT")
    require(
        {entry["proofMode"] for entry in manifest} == {"mock_now", "mixed"},
        "277_MANIFEST_PROOF_MODE_DRIFT",
    )
    for entry in manifest:
        artifact_path = normalize_repo_ref(entry["artifactPath"])
        require(artifact_path.exists(), f"277_MANIFEST_ARTIFACT_MISSING:{artifact_path}")

    require(invariants["taskId"] == "seq_277", "277_INVARIANT_TASK_ID_DRIFT")
    require(len(invariants["invariants"]) == 7, "277_INVARIANT_COUNT_DRIFT")
    require(
        all(entry["status"] == "approved" for entry in invariants["invariants"]),
        "277_INVARIANT_STATUS_DRIFT",
    )

    require(len(open_items) == 10, "277_OPEN_ITEM_COUNT_DRIFT")
    require(
        [item["ownerTask"] for item in open_items[:6]]
        == ["seq_278", "seq_279", "seq_280", "seq_281", "par_282", "par_283"],
        "277_PHASE4_OWNER_ORDER_DRIFT",
    )
    require(
        {item["category"] for item in open_items}
        == {"phase4_boundary", "phase4_execution", "live_later"},
        "277_OPEN_ITEM_CATEGORY_DRIFT",
    )

    for task_id, result in suite_results.items():
        matching = next((entry for entry in decision["decisiveSuites"] if entry["taskId"] == task_id), None)
        require(matching is not None, f"277_DECISIVE_SUITE_MISSING:{task_id}")
        require(matching["visualMode"] == result["visualMode"], f"277_SUITE_VISUAL_MODE_DRIFT:{task_id}")
        require(matching["suiteVerdict"] == result["suiteVerdict"], f"277_SUITE_VERDICT_DRIFT:{task_id}")
        require(matching["summary"] == result["summary"], f"277_SUITE_SUMMARY_DRIFT:{task_id}")

    for path_string in [
        decision["evidenceManifestRef"],
        decision["conformanceRowsRef"],
        decision["openItemsRef"],
        decision["invariantProofMapRef"],
    ]:
        require(normalize_repo_ref(path_string).exists(), f"277_DECISION_REF_MISSING:{path_string}")

    for token in [
        "Human Checkpoint exit verdict: `go_with_constraints`",
        "Phase 4 entry verdict: `approved`",
        "Live-provider rollout verdict: `withheld`",
        "Machine-auditable artifacts",
        "277_phase3_exit_gate_decision.json",
    ]:
        require(token in pack_text, f"277_PACK_MARKER_MISSING:{token}")

    for token in [
        "The authoritative verdict is `go_with_constraints`.",
        "This is a **go** for:",
        "This is a **no-go** for:",
        "Why the verdict is not `approved`",
        "Mandatory question ledger",
    ]:
        require(token in decision_doc, f"277_DECISION_DOC_MARKER_MISSING:{token}")

    for token in [
        "277 Phase 3 Conformance Scorecard",
        "PH3_ROW_03",
        "PH3_ROW_07",
        "go_with_constraints",
        "Automated proof",
    ]:
        require(token in scorecard_doc, f"277_SCORECARD_MARKER_MISSING:{token}")

    for token in [
        "Phase 4 entry tasks",
        "BookingIntent",
        "`LifecycleCoordinator` remains the only request-closure authority",
        "seq_278",
        "par_283",
    ]:
        require(token in boundary_doc, f"277_BOUNDARY_DOC_MARKER_MISSING:{token}")

    for token in [
        "Mock-now execution accepted now",
        "Live-later boundaries",
        "future_live_provider_activation",
        "future_phase3_live_projection_fetch_hardening",
        "future_phase9_control_plane_activation",
    ]:
        require(token in beta_boundary_doc, f"277_BETA_BOUNDARY_MARKER_MISSING:{token}")

    for token in [
        "data-testid=\"Phase3ExitBoard\"",
        "data-testid=\"VerdictBand\"",
        "data-testid=\"PhaseBraid\"",
        "data-testid=\"ConformanceLadder\"",
        "data-testid=\"EvidenceManifestPanel\"",
        "data-testid=\"CarryForwardBoundaryMap\"",
        "data-testid=\"RiskAndConstraintPanel\"",
        "data-testid=\"DecisionLedger\"",
        "previewVerdict",
        "Current verdict:",
    ]:
        require(token in board_html, f"277_BOARD_MARKER_MISSING:{token}")

    for token in [
        "277-phase3-exit-board-approved.png",
        "277-phase3-exit-board-go-with-constraints.png",
        "277-phase3-exit-board-withheld.png",
        "277-phase3-exit-board-mobile-reduced.png",
        "277-phase3-exit-board-aria-snapshots.json",
        "previewVerdict=withheld",
        "ConformanceLadder",
        "CarryForwardBoundaryMap",
    ]:
        require(token in spec_text, f"277_SPEC_MARKER_MISSING:{token}")

    require(
        '"validate:277-phase3-exit-gate": "python3 ./tools/analysis/validate_phase3_exit_gate.py"'
        in package_text,
        "277_PACKAGE_SCRIPT_MISSING",
    )
    require(
        ROOT_SCRIPT_UPDATES.get("validate:277-phase3-exit-gate")
        == "python3 ./tools/analysis/validate_phase3_exit_gate.py",
        "277_ROOT_SCRIPT_UPDATE_MISSING",
    )


if __name__ == "__main__":
    main()
