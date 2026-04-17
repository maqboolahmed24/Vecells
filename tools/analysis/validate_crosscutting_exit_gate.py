#!/usr/bin/env python3
from __future__ import annotations

import csv
import html
import json
import re
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]

CHECKLIST = ROOT / "prompt" / "checklist.md"
PACKAGE_JSON = ROOT / "package.json"
ROOT_SCRIPT_UPDATES = ROOT / "tools" / "analysis" / "root_script_updates.py"

DECISION = ROOT / "data" / "analysis" / "225_crosscutting_exit_gate_decision.json"
ROWS = ROOT / "data" / "analysis" / "225_conformance_rows.json"
EVIDENCE = ROOT / "data" / "analysis" / "225_evidence_manifest.csv"
OPEN_ITEMS = ROOT / "data" / "analysis" / "225_open_items_and_phase3_carry_forward.json"

EXIT_PACK = ROOT / "docs" / "governance" / "225_crosscutting_exit_gate_pack.md"
GO_NO_GO = ROOT / "docs" / "governance" / "225_portal_and_support_go_no_go_decision.md"
SCORECARD = ROOT / "docs" / "governance" / "225_portal_and_support_conformance_scorecard.md"
BOUNDARY = ROOT / "docs" / "governance" / "225_phase3_carry_forward_boundary.md"
BOARD = ROOT / "docs" / "frontend" / "225_portal_support_exit_board.html"
BUILDER = ROOT / "tools" / "analysis" / "build_crosscutting_exit_gate.py"
PLAYWRIGHT_SPEC = ROOT / "tests" / "playwright" / "225_portal_support_exit_board.spec.js"

PHASE2_BOUNDARY = ROOT / "docs" / "governance" / "208_phase2_mock_now_vs_crosscutting_boundary.md"
PHASE2_PACK = ROOT / "docs" / "governance" / "208_phase2_exit_gate_pack.md"
MERGE_GAP_LOG = ROOT / "data" / "analysis" / "223_merge_gap_log.json"
SUITE_RESULTS = ROOT / "data" / "test" / "224_suite_results.json"
DEFECT_LOG = ROOT / "data" / "test" / "224_defect_log_and_remediation.json"

REQUIRED_FAMILIES = {
    "patient_home_and_requests",
    "request_detail_and_typed_patient_action_routing",
    "more_info_callback_and_contact_repair",
    "records_and_communications",
    "support_entry_and_inbox",
    "support_ticket_shell_and_omnichannel_timeline",
    "support_masking_knowledge_history_replay_and_read_only_fallback",
    "patient_support_identity_and_status_integration",
    "continuity_and_artifact_parity_test_evidence",
}

REQUIRED_INVARIANTS = {
    "patientAndSupportConsumeSamePhase2Truth",
    "sameShellContinuityAcrossPortalAndSupportRoutes",
    "requestAndSupportLineageStayShared",
    "patientAndSupportRepairParityMaintained",
    "recordArtifactParityAndRestrictionFallbackFailClosed",
    "maskingDisclosureReplayAndReadOnlyPreserveChronology",
    "supportDoesNotBecomeSecondSystemOfRecord",
    "continuityEvidenceIsMachineReadable",
    "repositoryOwnedDefectsResolvedBeforeExit",
    "baselineApprovalDoesNotClaimProductionReadiness",
}

ALLOWED_ROW_PROOF_BASES = {"repository_run", "mixed", "simulator_backed", "future_live"}


def fail(message: str) -> None:
    raise SystemExit(f"[225-crosscutting-exit-gate] {message}")


def read(path: Path) -> str:
    if not path.exists():
        fail(f"missing required file {path.relative_to(ROOT)}")
    return path.read_text(encoding="utf-8")


def load_json(path: Path) -> Any:
    try:
        return json.loads(read(path))
    except json.JSONDecodeError as exc:
        fail(f"invalid JSON in {path.relative_to(ROOT)}: {exc}")


def load_csv(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        fail(f"missing required file {path.relative_to(ROOT)}")
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def resolve_ref(ref: str) -> Path:
    return ROOT / ref.split("#", 1)[0]


def validate_refs(refs: list[str], context: str) -> None:
    for ref in refs:
        if not ref:
            fail(f"{context} contains an empty ref")
        path = resolve_ref(ref)
        if not path.exists():
            fail(f"{context} references missing artifact {ref}")


def validate_checklist() -> None:
    checklist = read(CHECKLIST)
    for task_id in range(210, 225):
        pattern = rf"^- \[[Xx]\] (?:seq|par)_{task_id:03d}_"
        if not re.search(pattern, checklist, re.MULTILINE):
            fail(f"task {task_id:03d} is not complete")
    if not re.search(
        r"^- \[[Xx-]\] seq_225_crosscutting_exit_gate_approve_portal_and_support_baseline_completion",
        checklist,
        re.MULTILINE,
    ):
        fail("task 225 is not claimed or complete")


def validate_suite_inputs() -> None:
    suite = load_json(SUITE_RESULTS)
    if suite.get("overallStatus") != "passed":
        fail("seq_224 suite results are not passed")
    if suite.get("repositoryOwnedDefectFinding") != "resolved_in_seq_224":
        fail("seq_224 suite does not report resolved repository-owned defects")
    if not suite.get("fixedDefectIds"):
        fail("seq_224 suite must record fixed defect ids")

    defect_log = load_json(DEFECT_LOG)
    if defect_log.get("status") != "resolved":
        fail("seq_224 defect log must be resolved")
    if any(defect.get("status") != "resolved" for defect in defect_log.get("defects", [])):
        fail("all seq_224 defects must be resolved")

    merge_gap = load_json(MERGE_GAP_LOG)
    if merge_gap.get("openGaps") != []:
        fail("seq_223 merge gap log must have no open gaps")


def validate_decision(decision: dict[str, Any], rows: list[dict[str, Any]], open_items: list[dict[str, Any]]) -> None:
    if decision.get("taskId") != "seq_225":
        fail("decision taskId drifted")
    if decision.get("visualMode") != "Portal_Support_Baseline_Exit_Board":
        fail("visualMode drifted")
    if decision.get("gateVerdict") not in {"approved", "go_with_constraints", "withheld"}:
        fail("gateVerdict is invalid")
    if decision.get("liveEnvironmentReadinessState") != "deferred_explicitly_not_approved":
        fail("liveEnvironmentReadinessState must stay explicitly deferred")
    if set(decision.get("canonicalInvariants", {})) != REQUIRED_INVARIANTS:
        fail("canonical invariant set drifted")
    if any(value is not True for value in decision["canonicalInvariants"].values()):
        fail("all canonical invariants must be true for the approved baseline")

    summary = decision.get("summary", {})
    approved_count = sum(1 for row in rows if row["status"] == "approved")
    constrained_count = sum(1 for row in rows if row["status"] == "go_with_constraints")
    withheld_count = sum(1 for row in rows if row["status"] == "withheld")
    phase3_count = sum(1 for item in open_items if item["carryForwardClass"] == "phase3_contract_publication")
    future_live_count = sum(1 for item in open_items if item["carryForwardClass"] == "future_live_boundary")

    if summary.get("completedTaskCount210To224") != 15:
        fail("summary completed task count must stay 15")
    if summary.get("conformanceRowCount") != len(rows):
        fail("conformance row count summary drifted")
    if summary.get("approvedRowCount") != approved_count:
        fail("approved row count summary drifted")
    if summary.get("goWithConstraintsRowCount") != constrained_count:
        fail("go-with-constraints row count summary drifted")
    if summary.get("withheldRowCount") != withheld_count:
        fail("withheld row count summary drifted")
    if summary.get("openItemCount") != len(open_items):
        fail("open item count summary drifted")
    if summary.get("phase3CarryForwardItemCount") != phase3_count:
        fail("phase3 carry-forward item count summary drifted")
    if summary.get("futureLiveBoundaryItemCount") != future_live_count:
        fail("future-live boundary item count summary drifted")
    if summary.get("mandatorySuiteCount") != 1 or summary.get("mandatorySuitePassCount") != 1:
        fail("mandatory suite count drifted")
    if summary.get("blockingItemCount") != 0:
        fail("approved gate cannot report blocking items")
    if summary.get("unresolvedContradictionCount") != 0:
        fail("approved gate cannot report unresolved contradictions")

    if decision["gateVerdict"] == "approved":
        if constrained_count or withheld_count:
            fail("approved verdict cannot have constrained or withheld rows")
        if any(item.get("isExitBlocker") for item in open_items):
            fail("approved verdict cannot include exit blockers")
    elif decision["gateVerdict"] == "go_with_constraints":
        if constrained_count == 0:
            fail("go_with_constraints verdict requires at least one constrained row")
    elif decision["gateVerdict"] == "withheld" and summary["blockingItemCount"] == 0:
        fail("withheld verdict requires a blocker")

    mandatory_suites = decision.get("mandatorySuites", [])
    if len(mandatory_suites) != 1 or mandatory_suites[0].get("suiteId") != "seq_224":
        fail("mandatory suite set must contain only seq_224")
    if mandatory_suites[0].get("verificationOutcome") != "passed":
        fail("mandatory suite must be passed")
    validate_refs(mandatory_suites[0].get("artifactRefs", []), "mandatory suite seq_224")

    if len(decision.get("gateQuestions", [])) != 7:
        fail("gate question set must answer all seven prompt questions")
    if any(check.get("state") != "aligned" for check in decision.get("contradictionChecks", [])):
        fail("all contradiction checks must be aligned")
    if set(decision.get("deferredOpenItemRefs", [])) != {item["itemId"] for item in open_items}:
        fail("deferredOpenItemRefs drifted from open items")
    if decision.get("blockerRefs"):
        fail("approved gate must not hide blocker refs")
    if decision.get("unresolvedDefects"):
        fail("approved gate must not hide unresolved defects")


def validate_rows(rows: list[dict[str, Any]], evidence_rows: list[dict[str, str]]) -> None:
    family_ids = {row["capabilityFamilyId"] for row in rows}
    if family_ids != REQUIRED_FAMILIES:
        fail(f"capability family coverage drifted: {sorted(REQUIRED_FAMILIES - family_ids)}")

    evidence_by_family: dict[str, list[dict[str, str]]] = {}
    for evidence in evidence_rows:
        family = evidence.get("capability_family_id", "")
        evidence_by_family.setdefault(family, []).append(evidence)
        validate_refs([evidence.get("artifact_ref", "")], f"evidence row {family}")

    if set(evidence_by_family) != REQUIRED_FAMILIES:
        fail("evidence manifest family coverage drifted")

    for row in rows:
        family = row["capabilityFamilyId"]
        if row["status"] not in {"approved", "go_with_constraints", "withheld"}:
            fail(f"{family} has invalid status")
        if row["proofBasis"] not in ALLOWED_ROW_PROOF_BASES:
            fail(f"{family} has invalid proofBasis")
        if not row.get("summary"):
            fail(f"{family} is missing summary")
        if not row.get("owningTasks"):
            fail(f"{family} is missing owningTasks")
        if row.get("blockerClass") is None:
            fail(f"{family} is missing blockerClass")
        validate_refs(row.get("sourceRefs", []), family)
        validate_refs(row.get("implementationEvidence", []), family)
        validate_refs(row.get("automatedProofArtifacts", []), family)
        validate_refs(row.get("evidenceFiles", []), family)
        if not row.get("suiteRefs"):
            fail(f"{family} is missing suiteRefs")
        if not row.get("invariantRefs"):
            fail(f"{family} is missing invariantRefs")

        kinds = {item["evidence_kind"] for item in evidence_by_family[family]}
        if kinds != {"implementation", "automated_proof", "suite_binding"}:
            fail(f"{family} evidence kinds drifted")


def validate_open_items(open_items: list[dict[str, Any]]) -> None:
    if len(open_items) != 5:
        fail("open item count must stay 5")
    for item in open_items:
        for field in [
            "itemId",
            "title",
            "priority",
            "deferredState",
            "carryForwardClass",
            "currentBoundaryState",
            "risk",
            "impact",
            "blockingClass",
            "nextOwningTask",
            "whyNotExitBlocker",
            "futureTaskRefs",
            "sourceRefs",
        ]:
            if not item.get(field):
                fail(f"{item.get('itemId')} missing {field}")
        if item.get("deferredState") != "deferred_non_blocking":
            fail(f"{item['itemId']} must stay deferred_non_blocking")
        if item.get("isExitBlocker") is not False:
            fail(f"{item['itemId']} must stay non-blocking")
        validate_refs(item["futureTaskRefs"], item["itemId"])
        validate_refs(item["sourceRefs"], item["itemId"])


def validate_docs() -> None:
    for path in [EXIT_PACK, GO_NO_GO, SCORECARD, BOUNDARY, BOARD, BUILDER, PHASE2_BOUNDARY, PHASE2_PACK]:
        read(path)

    exit_pack = read(EXIT_PACK)
    for token in [
        "Portal_Support_Baseline_Exit_Board",
        "Verdict: `approved`",
        "Design Research References",
        "Carry-Forward Boundary",
        "Machine-Readable Artifacts",
    ]:
        if token not in exit_pack:
            fail(f"exit pack missing token {token}")

    go_no_go = read(GO_NO_GO)
    for token in [
        "The portal and support baseline is `approved` for Phase 3 entry.",
        "live-provider and production-signoff proof are still out of scope",
        "Q225_007",
        "Approval Statement",
    ]:
        if token not in go_no_go:
            fail(f"go/no-go decision missing token {token}")

    scorecard = read(SCORECARD)
    for token in [
        "Patient home and requests",
        "Support ticket shell and omnichannel timeline",
        "Continuity and parity test evidence",
        "`repository_run`",
    ]:
        if token not in scorecard:
            fail(f"scorecard missing token {token}")

    boundary = read(BOUNDARY)
    for token in [
        "Non-Reopening Laws",
        "seq_226",
        "seq_227",
        "future production release gate",
    ]:
        if token not in boundary and token != "future production release gate":
            fail(f"boundary doc missing token {token}")
        if token == "future production release gate" and "future production release gate" not in boundary:
            fail("boundary doc missing future production release gate token")


def validate_board_embedded_payload(decision: dict[str, Any], rows: list[dict[str, Any]], evidence_rows: list[dict[str, str]], open_items: list[dict[str, Any]]) -> None:
    board = read(BOARD)
    for test_id in [
        "Portal_Support_Baseline_Exit_Board",
        "VerdictBand",
        "CapabilityConformanceLadder",
        "EvidenceManifestPanel",
        "PatientSupportBoundaryMap",
        "OpenItemsCarryForwardTable",
    ]:
        if f"data-testid=\"{test_id}\"" not in board:
            fail(f"board missing data-testid {test_id}")

    match = re.search(
        r'<script id="portal-support-exit-data" type="application/json">(.*?)</script>',
        board,
        re.DOTALL,
    )
    if not match:
        fail("board missing embedded data payload")

    embedded = json.loads(html.unescape(match.group(1)))
    if embedded.get("decision") != decision:
        fail("board embedded decision drifted from machine-readable decision")
    if embedded.get("rows") != rows:
        fail("board embedded rows drifted from machine-readable rows")
    if embedded.get("evidence") != evidence_rows:
        fail("board embedded evidence drifted from machine-readable evidence manifest")
    if embedded.get("openItems") != open_items:
        fail("board embedded open items drifted from machine-readable open items")

    for token in [
        "Approved state",
        "Go-with-constraints state",
        "Withheld state",
        "selected-evidence-count",
        "open-items-table-body",
    ]:
        if token not in board:
            fail(f"board missing token {token}")


def validate_script_registration() -> None:
    package = json.loads(read(PACKAGE_JSON))
    scripts = package.get("scripts", {})
    expected = "python3 ./tools/analysis/validate_crosscutting_exit_gate.py"
    if scripts.get("validate:crosscutting-exit-gate") != expected:
        fail("package.json missing validate:crosscutting-exit-gate script")

    root_updates = read(ROOT_SCRIPT_UPDATES)
    if '"validate:crosscutting-exit-gate": "python3 ./tools/analysis/validate_crosscutting_exit_gate.py"' not in root_updates:
        fail("root_script_updates.py missing crosscutting exit gate validator script")


def main() -> None:
    validate_checklist()
    validate_suite_inputs()

    decision = load_json(DECISION)
    rows = load_json(ROWS)
    evidence_rows = load_csv(EVIDENCE)
    open_items = load_json(OPEN_ITEMS)

    validate_decision(decision, rows, open_items)
    validate_rows(rows, evidence_rows)
    validate_open_items(open_items)
    validate_docs()
    validate_board_embedded_payload(decision, rows, evidence_rows, open_items)
    validate_script_registration()


if __name__ == "__main__":
    main()
