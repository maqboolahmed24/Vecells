#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]

DECISION = ROOT / "data/analysis/169_phase1_exit_gate_decision.json"
ROWS = ROOT / "data/analysis/169_phase1_conformance_rows.json"
EVIDENCE = ROOT / "data/analysis/169_phase1_evidence_manifest.csv"
OPEN_ITEMS = ROOT / "data/analysis/169_phase1_open_items_and_phase2_carry_forward.json"
EXIT_PACK = ROOT / "docs/governance/169_phase1_exit_gate_pack.md"
GO_NO_GO = ROOT / "docs/governance/169_phase1_go_no_go_decision.md"
SCORECARD = ROOT / "docs/governance/169_phase1_conformance_scorecard.md"
BOUNDARY = ROOT / "docs/governance/169_phase1_mock_now_vs_phase2_boundary.md"
BOARD = ROOT / "docs/governance/169_phase1_gate_review_board.html"
PLAYWRIGHT_SPEC = ROOT / "tests/playwright/169_phase1_gate_review_board.spec.js"
CHECKLIST = ROOT / "prompt/checklist.md"
ROOT_PACKAGE = ROOT / "package.json"
PLAYWRIGHT_PACKAGE = ROOT / "tests/playwright/package.json"
ROOT_SCRIPT_UPDATES = ROOT / "tools/analysis/root_script_updates.py"

REQUIRED_FAMILIES = {
    "public_intake_contract_question_flow",
    "autosave_lease_resume_substrate",
    "attachment_quarantine_evidence_classification",
    "immutable_promotion_and_normalization",
    "synchronous_safety_urgent_diversion",
    "triage_receipt_eta_tracking",
    "confirmation_notification_truth",
    "stale_token_post_promotion_recovery",
    "browser_continuity_accessibility_reduced_motion",
    "replay_duplicate_collision_proof",
    "performance_resilience_proof",
}

REQUIRED_BOARD_MARKERS = {
    "Red_Flag_Gate_Review_Board",
    "gate_dossier_mark",
    "phase-braid",
    "phase-braid-table",
    "conformance-score-ladder",
    "conformance-score-table",
    "open-items-boundary-map",
    "open-items-table",
    "evidence-manifest-table",
    "parity-table",
    "--masthead-height: 72px",
    "--left-rail-width: 280px",
    "--right-inspector-width: 408px",
    "max-width: 1600px",
    "prefers-reduced-motion",
}


def fail(message: str) -> None:
    raise SystemExit(f"[phase1-exit-gate] {message}")


def require_file(path: Path) -> str:
    if not path.exists():
        fail(f"missing required file: {path.relative_to(ROOT)}")
    return path.read_text(encoding="utf-8")


def load_json(path: Path):
    require_file(path)
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as error:
        fail(f"{path.relative_to(ROOT)} is invalid JSON: {error}")


def load_csv(path: Path) -> list[dict[str, str]]:
    text = require_file(path)
    return list(csv.DictReader(text.splitlines()))


def require_markers(label: str, text: str, markers: set[str]) -> None:
    missing = sorted(marker for marker in markers if marker not in text)
    if missing:
        fail(f"{label} missing markers: {', '.join(missing)}")


def validate_checklist() -> None:
    checklist = require_file(CHECKLIST)
    for task_id in range(139, 144):
        pattern = rf"- \[[Xx]\] seq_{task_id:03d}_"
        if not re.search(pattern, checklist):
            fail(f"seq_{task_id:03d} is not complete in prompt/checklist.md")
    for task_id in range(144, 164):
        pattern = rf"- \[[Xx]\] par_{task_id:03d}_"
        if not re.search(pattern, checklist):
            fail(f"par_{task_id:03d} is not complete in prompt/checklist.md")
    for task_id in range(164, 169):
        pattern = rf"- \[[Xx]\] seq_{task_id:03d}_"
        if not re.search(pattern, checklist):
            fail(f"seq_{task_id:03d} is not complete in prompt/checklist.md")
    if not re.search(r"- \[(?:-|X)\] seq_169_", checklist):
        fail("seq_169 is not claimed or complete in prompt/checklist.md")


def validate_suite_artifacts(decision: dict) -> None:
    suites = {suite["suiteId"]: suite for suite in decision["mandatorySuites"]}
    if set(suites) != {"seq_165", "seq_166", "seq_167", "seq_168"}:
        fail("mandatory suite set must be exactly seq_165 through seq_168")
    for suite in suites.values():
        if suite.get("verificationOutcome") != "passed":
            fail(f"{suite['suiteId']} is not passed")
        for artifact in suite.get("artifactRefs", []):
            if not (ROOT / artifact).exists():
                fail(f"{suite['suiteId']} references missing artifact {artifact}")

    suite_165 = load_json(ROOT / "data/test/165_suite_results.json")
    if suite_165.get("status") != "expected_pass":
        fail("seq_165 suite result is not expected_pass")
    if any(item.get("status") != "expected_pass" for item in suite_165.get("invariants", [])):
        fail("seq_165 has a non-passing invariant")

    suite_166 = load_json(ROOT / "data/test/166_expected_idempotency_and_side_effect_counts.json")
    invariants_166 = suite_166.get("globalInvariants", {})
    for key in [
        "duplicateVisibleSuccessAllowed",
        "duplicateNotificationAllowed",
        "stalePromotedDraftReopensMutableEditing",
        "collisionReviewSilentlySucceeds",
    ]:
        if invariants_166.get(key) is not False:
            fail(f"seq_166 invariant {key} must be false")

    suite_167 = load_json(ROOT / "data/test/167_regression_results.json")
    invariants_167 = suite_167.get("globalInvariants", {})
    if invariants_167.get("allRoutesSameShellContinuity") is not True:
        fail("seq_167 same-shell continuity invariant is not true")
    for key in [
        "duplicateLiveAnnouncementsAllowed",
        "visualOnlyEvidenceAllowed",
        "stickyFooterMayObscureFocus",
        "reducedMotionMayChangeSemanticOrder",
        "transportAcceptanceMayReassurePatient",
    ]:
        if invariants_167.get(key) is not False:
            fail(f"seq_167 invariant {key} must be false")

    suite_168 = load_json(ROOT / "data/performance/168_suite_results.json")
    invariants_168 = suite_168.get("globalInvariants", {})
    for key in [
        "duplicateAuthoritativeSideEffectsAllowed",
        "calmWritableDuringDegradationAllowed",
        "proseOnlyBudgetsAllowed",
        "visualMeaningWithoutParityTablesAllowed",
        "unresolvedDefectsWithoutRationaleAllowed",
        "prematureNotificationReassuranceAllowed",
        "genericDetachedErrorsAllowed",
    ]:
        if invariants_168.get(key) is not False:
            fail(f"seq_168 invariant {key} must be false")


def validate_decision(decision: dict, rows: list[dict], open_items: list[dict]) -> None:
    if decision.get("gateVerdict") not in {"approved", "go_with_constraints", "withheld"}:
        fail("gateVerdict is not valid")
    if decision.get("visualMode") != "Red_Flag_Gate_Review_Board":
        fail("visualMode must be Red_Flag_Gate_Review_Board")
    if "live" in decision.get("baselineScope", ""):
        fail("baselineScope must not claim live readiness")
    if decision.get("liveProviderReadinessState") != "deferred_explicitly_not_approved":
        fail("live provider readiness must be explicitly deferred")

    summary = decision["summary"]
    approved_count = sum(1 for row in rows if row["status"] == "approved")
    withheld_count = sum(1 for row in rows if row["status"] == "withheld")
    constrained_count = sum(1 for row in rows if row["status"] == "go_with_constraints")
    if summary["conformanceRowCount"] != len(rows):
        fail("conformance row count summary drifted")
    if summary["approvedRowCount"] != approved_count:
        fail("approved row count summary drifted")
    if summary["withheldRowCount"] != withheld_count:
        fail("withheld row count summary drifted")
    if summary["goWithConstraintsRowCount"] != constrained_count:
        fail("constrained row count summary drifted")
    if summary["deferredNonBlockingItemCount"] != len(open_items):
        fail("deferred open item count summary drifted")
    if summary["mandatorySuitePassCount"] != summary["mandatorySuiteCount"]:
        fail("mandatory suite pass count does not match suite count")

    if decision["gateVerdict"] == "approved":
        if decision.get("blockerRefs"):
            fail("approved verdict cannot have blocker refs")
        if decision.get("unresolvedDefects"):
            fail("approved verdict cannot have unresolved defects")
        if any(value is not True for value in decision["canonicalInvariants"].values()):
            fail("approved verdict has a false canonical invariant")
        if any(row["status"] != "approved" for row in rows):
            fail("approved verdict has a non-approved conformance row")
        if summary["blockingItemCount"] != 0:
            fail("approved verdict has blocking items")


def validate_rows_and_evidence(rows: list[dict], evidence: list[dict], open_items: list[dict]) -> None:
    family_ids = {row["capabilityFamilyId"] for row in rows}
    missing = sorted(REQUIRED_FAMILIES - family_ids)
    if missing:
        fail(f"missing conformance families: {', '.join(missing)}")

    evidence_by_family: dict[str, list[dict[str, str]]] = {}
    for row in evidence:
        family = row.get("capability_family_id", "")
        evidence_by_family.setdefault(family, []).append(row)
        artifact = row.get("artifact_ref", "")
        path = ROOT / artifact
        if not path.exists():
            fail(f"evidence artifact is missing: {artifact}")

    open_item_ids = {item["itemId"] for item in open_items}
    for row in rows:
        family = row["capabilityFamilyId"]
        family_evidence = evidence_by_family.get(family, [])
        if not family_evidence:
            fail(f"{family} has no evidence manifest rows")
        kinds = {item["evidence_kind"] for item in family_evidence}
        if "implementation" not in kinds:
            fail(f"{family} lacks implementation evidence")
        if not ({"automated_proof", "suite_binding"} & kinds):
            fail(f"{family} lacks automated proof or suite binding evidence")
        if row["status"] == "approved" and row.get("blockingRationale"):
            fail(f"{family} is approved but has blocking rationale")
        for field in ["sourceRefs", "implementationEvidence", "automatedProofArtifacts", "suiteRefs", "invariantRefs"]:
            if not row.get(field):
                fail(f"{family} missing {field}")
        for ref in row.get("deferredRefs", []):
            if ref not in open_item_ids:
                fail(f"{family} references missing deferred item {ref}")

    for item in open_items:
        if item.get("deferredState") != "deferred_non_blocking":
            fail(f"{item['itemId']} is not deferred_non_blocking")
        for field in ["ownerPhase", "workClass", "currentBoundaryState", "whyNonBlockingNow", "sourceRefs"]:
            if not item.get(field):
                fail(f"{item['itemId']} missing {field}")


def validate_documents() -> None:
    doc_markers = {
        "approved",
        "simulator-first",
        "not approve live",
        "deferred_non_blocking",
        "machine-readable",
    }
    for path in [EXIT_PACK, GO_NO_GO, SCORECARD, BOUNDARY]:
        text = require_file(path)
        require_markers(str(path.relative_to(ROOT)), text, doc_markers & set(text.split()))

    boundary = require_file(BOUNDARY)
    require_markers(
        "boundary document",
        boundary,
        {"Mock Now Execution", "Actual Production Strategy Later", "data/analysis/169_phase1_open_items_and_phase2_carry_forward.json"},
    )
    exit_pack = require_file(EXIT_PACK)
    require_markers(
        "exit gate pack",
        exit_pack,
        {
            "data/analysis/169_phase1_exit_gate_decision.json",
            "data/analysis/169_phase1_evidence_manifest.csv",
            "tests/playwright/169_phase1_gate_review_board.spec.js",
        },
    )


def validate_board() -> None:
    board = require_file(BOARD)
    require_markers("gate review board", board, REQUIRED_BOARD_MARKERS)
    for visual, table in [
        ("phase-braid", "phase-braid-table"),
        ("conformance-score-ladder", "conformance-score-table"),
        ("open-items-boundary-map", "open-items-table"),
        ("gate_dossier_mark", "decision-verdict"),
    ]:
        if visual not in board or table not in board:
            fail(f"board parity missing {visual} -> {table}")


def validate_package_scripts() -> None:
    root_package = load_json(ROOT_PACKAGE)
    scripts = root_package.get("scripts", {})
    expected = "python3 ./tools/analysis/validate_phase1_exit_gate.py"
    if scripts.get("validate:phase1-exit-gate") != expected:
        fail("root package missing validate:phase1-exit-gate")
    for chain in ["bootstrap", "check"]:
        value = scripts.get(chain, "")
        if "pnpm validate:phase1-performance-suite && pnpm validate:phase1-exit-gate" not in value:
            fail(f"{chain} chain does not run phase1 exit gate after phase1 performance suite")

    playwright_package = load_json(PLAYWRIGHT_PACKAGE)
    for script_name, script_value in playwright_package.get("scripts", {}).items():
        if script_name in {"build", "lint", "test", "typecheck", "e2e"}:
            if "169_phase1_gate_review_board.spec.js" not in script_value:
                fail(f"tests/playwright {script_name} script missing 169 spec")

    root_updates = require_file(ROOT_SCRIPT_UPDATES)
    require_markers(
        "root script update manifest",
        root_updates,
        {
            '"validate:phase1-exit-gate"',
            "validate_phase1_exit_gate.py",
            "validate:phase1-performance-suite && pnpm validate:phase1-exit-gate",
        },
    )


def validate_playwright_spec() -> None:
    spec = require_file(PLAYWRIGHT_SPEC)
    require_markers(
        "playwright spec",
        spec,
        {
            "family selection sync",
            "blocked/open-item visibility",
            "keyboard navigation",
            "reducedMotion",
            "diagram/table parity",
            "Red_Flag_Gate_Review_Board",
        },
    )


def main() -> int:
    validate_checklist()
    decision = load_json(DECISION)
    rows = load_json(ROWS)
    open_items = load_json(OPEN_ITEMS)
    evidence = load_csv(EVIDENCE)
    validate_suite_artifacts(decision)
    validate_decision(decision, rows, open_items)
    validate_rows_and_evidence(rows, evidence, open_items)
    validate_documents()
    validate_board()
    validate_playwright_spec()
    validate_package_scripts()
    print("Phase 1 exit gate validation passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
