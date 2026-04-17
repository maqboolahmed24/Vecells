#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "analysis"))

from root_script_updates import ROOT_SCRIPT_UPDATES


DOCS_DIR = ROOT / "docs" / "governance"
DATA_DIR = ROOT / "data" / "analysis"
PLAYWRIGHT_DIR = ROOT / "tests" / "playwright"

PACK_DOC_PATH = DOCS_DIR / "138_phase0_exit_gate_pack.md"
DECISION_DOC_PATH = DOCS_DIR / "138_phase0_go_no_go_decision.md"
CONFORMANCE_DOC_PATH = DOCS_DIR / "138_phase0_conformance_scorecard.md"
BOUNDARY_DOC_PATH = DOCS_DIR / "138_phase0_mock_now_vs_actual_later_boundary.md"
BOARD_PATH = DOCS_DIR / "138_phase0_gate_review_board.html"

DECISION_JSON_PATH = DATA_DIR / "138_phase0_exit_gate_decision.json"
ROWS_JSON_PATH = DATA_DIR / "138_phase0_conformance_rows.json"
EVIDENCE_MANIFEST_PATH = DATA_DIR / "138_phase0_evidence_manifest.csv"
OPEN_ITEMS_JSON_PATH = DATA_DIR / "138_phase0_open_items_and_deferred_live_provider_work.json"

SPEC_PATH = PLAYWRIGHT_DIR / "138_phase0_gate_review_board.spec.js"
ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = PLAYWRIGHT_DIR / "package.json"
BUILDER_PATH = ROOT / "tools" / "analysis" / "build_phase0_exit_gate.py"

REQUIRED_CAPABILITY_FAMILIES = {
    "canonical_request_intake_backbone",
    "replay_and_duplicate_handling",
    "identity_access_substrate",
    "runtime_publication_and_freeze_control",
    "shell_and_continuity_infrastructure",
    "simulator_estate_and_degraded_defaults",
    "observability_and_audit",
    "backup_restore_and_canary_rehearsal",
    "accessibility_and_shell_smoke_proof",
    "assurance_privacy_and_clinical_safety_seed_artifacts",
}
REQUIRED_SUITES = {"seq_133", "seq_134", "seq_135", "seq_136", "seq_137"}


def fail(message: str) -> None:
    print(message, file=sys.stderr)
    raise SystemExit(1)


def assert_exists(path: Path) -> None:
    if not path.exists():
        fail(f"Missing seq_138 artifact: {path}")


def read_json(path: Path):
    assert_exists(path)
    return json.loads(path.read_text(encoding="utf-8"))


def read_csv(path: Path) -> list[dict[str, str]]:
    assert_exists(path)
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def assert_contains(path: Path, fragment: str) -> None:
    assert_exists(path)
    if fragment not in path.read_text(encoding="utf-8"):
        fail(f"{path} is missing required fragment: {fragment}")


def resolve_ref(ref: str) -> Path:
    return ROOT / ref.split("#", 1)[0]


def validate_refs(refs: list[str], context: str) -> None:
    for ref in refs:
        path = resolve_ref(ref)
        if not path.exists():
            fail(f"{context} points to missing ref: {ref}")


def main() -> None:
    for path in [
        PACK_DOC_PATH,
        DECISION_DOC_PATH,
        CONFORMANCE_DOC_PATH,
        BOUNDARY_DOC_PATH,
        BOARD_PATH,
        DECISION_JSON_PATH,
        ROWS_JSON_PATH,
        EVIDENCE_MANIFEST_PATH,
        OPEN_ITEMS_JSON_PATH,
        SPEC_PATH,
        ROOT_PACKAGE_PATH,
        PLAYWRIGHT_PACKAGE_PATH,
        BUILDER_PATH,
    ]:
        assert_exists(path)

    decision = read_json(DECISION_JSON_PATH)
    rows = read_json(ROWS_JSON_PATH)
    open_items = read_json(OPEN_ITEMS_JSON_PATH)
    evidence_rows = read_csv(EVIDENCE_MANIFEST_PATH)
    root_package = read_json(ROOT_PACKAGE_PATH)
    playwright_package = read_json(PLAYWRIGHT_PACKAGE_PATH)

    if decision["task_id"] != "seq_138":
        fail("seq_138 decision task id drifted.")
    if decision["visual_mode"] != "Foundation_Gate_Board":
        fail("seq_138 visual mode drifted.")
    if decision["gateVerdict"] != "go_with_constraints":
        fail("seq_138 gate verdict drifted.")
    if decision["baselineScope"] != "simulator_first_foundation":
        fail("seq_138 baseline scope drifted.")
    if decision["liveProviderReadinessState"] != "deferred_explicitly_not_approved":
        fail("seq_138 live-provider readiness state drifted.")

    summary = decision["summary"]
    if summary["approved_row_count"] != 5 or summary["constrained_row_count"] != 5:
        fail("seq_138 row-status counts drifted.")
    if summary["blocked_row_count"] != 0:
        fail("seq_138 must not report blocked capability rows for the simulator-first go-with-constraints gate.")
    if summary["mandatory_suite_count"] != 5 or summary["mandatory_suite_pass_count"] != 5:
        fail("seq_138 mandatory suite summary drifted.")
    if summary["publishable_live_surface_count"] != 0:
        fail("seq_138 must keep publishable live surface count at zero.")
    if summary["live_control_reopened_count"] != 0:
        fail("seq_138 must keep live control reopening at zero.")

    if len(rows) != 10:
        fail("seq_138 must publish 10 capability-family rows.")
    families = {row["capabilityFamilyId"] for row in rows}
    if families != REQUIRED_CAPABILITY_FAMILIES:
        fail("seq_138 capability-family coverage drifted.")

    row_ids = {row["rowId"] for row in rows}
    if row_ids != set(decision["capabilityRowRefs"]):
        fail("seq_138 capability row refs drifted.")

    open_item_ids = {item["itemId"] for item in open_items}
    if len(open_items) < 7:
        fail("seq_138 must publish explicit deferred/open-item rows.")
    if any(item["deferredState"] != "deferred_non_blocking" for item in open_items):
        fail("seq_138 open items must remain deferred_non_blocking for this gate.")
    if open_item_ids != set(decision["openItemRefs"]):
        fail("seq_138 open item refs drifted.")

    for row in rows:
        if row["status"] not in {"approved", "constrained"}:
            fail(f"Unexpected seq_138 row status: {row['rowId']} -> {row['status']}")
        if not row["sourceRefs"] or not row["implementationEvidenceRefs"] or not row["automatedProofRefs"]:
            fail(f"seq_138 row {row['rowId']} is missing source/evidence/proof refs.")
        validate_refs(row["sourceRefs"], row["rowId"])
        validate_refs(row["implementationEvidenceRefs"], row["rowId"])
        validate_refs(row["automatedProofRefs"], row["rowId"])
        if not set(row["openItemRefs"]).issubset(open_item_ids):
            fail(f"seq_138 row {row['rowId']} references unknown open items.")
        if len(row["signalRows"]) < 3:
            fail(f"seq_138 row {row['rowId']} must expose machine signals.")

    suite_ids = {suite["suiteId"] for suite in decision["mandatorySuites"]}
    if suite_ids != REQUIRED_SUITES:
        fail("seq_138 mandatory suite ids drifted.")
    for suite in decision["mandatorySuites"]:
        if suite["verificationOutcome"] != "passed":
            fail(f"seq_138 suite is not passed: {suite['suiteId']}")
        validate_refs(suite["artifactRefs"], suite["suiteId"])

    if len(decision["gateQuestions"]) != 6:
        fail("seq_138 gate questions drifted.")
    if any(question["answerState"] not in {"approved", "constrained"} for question in decision["gateQuestions"]):
        fail("seq_138 question answer states drifted.")

    if len(decision["contradictionChecks"]) != 3:
        fail("seq_138 contradiction checks drifted.")
    if any(check["state"] != "aligned" for check in decision["contradictionChecks"]):
        fail("seq_138 contradiction checks must remain aligned.")

    if len(evidence_rows) < 45:
        fail("seq_138 evidence manifest is unexpectedly sparse.")
    family_counts: dict[str, int] = {}
    for evidence in evidence_rows:
        family_counts[evidence["capability_family_id"]] = family_counts.get(evidence["capability_family_id"], 0) + 1
        path = resolve_ref(evidence["artifact_ref"])
        if not path.exists():
            fail(f"seq_138 evidence manifest points to missing artifact: {evidence['artifact_ref']}")
    if set(family_counts) != REQUIRED_CAPABILITY_FAMILIES:
        fail("seq_138 evidence manifest family coverage drifted.")
    if any(count < 6 for count in family_counts.values()):
        fail("seq_138 evidence manifest lost per-family density.")

    assert_contains(PACK_DOC_PATH, "simulator-first foundation readiness")
    assert_contains(DECISION_DOC_PATH, "not live-provider readiness")
    assert_contains(DECISION_DOC_PATH, "go_with_constraints")
    assert_contains(CONFORMANCE_DOC_PATH, "Canonical request-intake backbone")
    assert_contains(BOUNDARY_DOC_PATH, "Mock Now Execution")
    assert_contains(BOUNDARY_DOC_PATH, "Actual Production Strategy Later")

    for marker in [
        'data-testid="foundation-gate-board"',
        'data-testid="board-masthead"',
        'data-testid="filter-status"',
        'data-testid="filter-family"',
        'data-testid="suite-strip"',
        'data-testid="suite-table"',
        'data-testid="heat-strip"',
        'data-testid="scorecard-table"',
        'data-testid="evidence-timeline"',
        'data-testid="evidence-table"',
        'data-testid="open-items-table"',
        'data-testid="inspector"',
        "prefers-reduced-motion: reduce",
    ]:
        assert_contains(BOARD_PATH, marker)

    for fragment in [
        "filter by capability family and decision state",
        "selection sync across heat strip, inspector, evidence and open-item tables",
        "keyboard navigation and landmarks",
        "responsive layout and reduced-motion equivalence",
        "heat strip/table parity and evidence timeline/table parity",
        "simulator-first boundary and deferred live-provider notes",
        "run()",
    ]:
        assert_contains(SPEC_PATH, fragment)

    package_scripts = root_package["scripts"]
    if package_scripts.get("validate:phase0-exit-gate") != "python3 ./tools/analysis/validate_phase0_exit_gate.py":
        fail("package.json is missing validate:phase0-exit-gate.")
    if "python3 ./tools/analysis/build_phase0_exit_gate.py" not in package_scripts.get("codegen", ""):
        fail("package.json codegen is missing build_phase0_exit_gate.py.")
    if "pnpm validate:phase0-exit-gate" not in package_scripts.get("bootstrap", ""):
        fail("package.json bootstrap is missing validate:phase0-exit-gate.")
    if "pnpm validate:phase0-exit-gate" not in package_scripts.get("check", ""):
        fail("package.json check is missing validate:phase0-exit-gate.")

    if ROOT_SCRIPT_UPDATES.get("validate:phase0-exit-gate") != "python3 ./tools/analysis/validate_phase0_exit_gate.py":
        fail("root_script_updates.py is missing validate:phase0-exit-gate.")
    if "python3 ./tools/analysis/build_phase0_exit_gate.py" not in ROOT_SCRIPT_UPDATES.get("codegen", ""):
        fail("root_script_updates.py codegen is missing build_phase0_exit_gate.py.")
    if "pnpm validate:phase0-exit-gate" not in ROOT_SCRIPT_UPDATES.get("bootstrap", ""):
        fail("root_script_updates.py bootstrap is missing validate:phase0-exit-gate.")
    if "pnpm validate:phase0-exit-gate" not in ROOT_SCRIPT_UPDATES.get("check", ""):
        fail("root_script_updates.py check is missing validate:phase0-exit-gate.")

    playwright_scripts = playwright_package["scripts"]
    for script_name in ["build", "lint", "test", "typecheck", "e2e"]:
        if "138_phase0_gate_review_board.spec.js" not in playwright_scripts.get(script_name, ""):
            fail(f"tests/playwright/package.json missing 138 spec in {script_name}.")

    print(
        json.dumps(
            {
                "task_id": "seq_138",
                "gate_verdict": decision["gateVerdict"],
                "approved_rows": summary["approved_row_count"],
                "constrained_rows": summary["constrained_row_count"],
                "open_items": summary["deferred_open_item_count"],
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
