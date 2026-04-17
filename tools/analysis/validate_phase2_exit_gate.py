#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import re
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]

CHECKLIST = ROOT / "prompt" / "checklist.md"
PACKAGE_JSON = ROOT / "package.json"
ROOT_SCRIPT_UPDATES = ROOT / "tools" / "analysis" / "root_script_updates.py"

DECISION = ROOT / "data" / "analysis" / "208_phase2_exit_gate_decision.json"
ROWS = ROOT / "data" / "analysis" / "208_phase2_conformance_rows.json"
EVIDENCE = ROOT / "data" / "analysis" / "208_phase2_evidence_manifest.csv"
OPEN_ITEMS = ROOT / "data" / "analysis" / "208_phase2_open_items_and_crosscutting_carry_forward.json"

EXIT_PACK = ROOT / "docs" / "governance" / "208_phase2_exit_gate_pack.md"
GO_NO_GO = ROOT / "docs" / "governance" / "208_phase2_go_no_go_decision.md"
SCORECARD = ROOT / "docs" / "governance" / "208_phase2_conformance_scorecard.md"
BOUNDARY = ROOT / "docs" / "governance" / "208_phase2_mock_now_vs_crosscutting_boundary.md"
BOARD = ROOT / "docs" / "frontend" / "208_phase2_exit_board.html"
BUILDER = ROOT / "tools" / "analysis" / "build_phase2_exit_gate.py"
PLAYWRIGHT_SPEC = ROOT / "tests" / "playwright" / "208_phase2_exit_board.spec.js"

SUITE_RESULTS = {
    "seq_204": ROOT / "data" / "test" / "204_suite_results.json",
    "seq_205": ROOT / "data" / "test" / "205_suite_results.json",
    "seq_206": ROOT / "data" / "test" / "206_suite_results.json",
    "seq_207": ROOT / "data" / "test" / "207_suite_results.json",
}

REQUIRED_FAMILIES = {
    "trust_contract_and_capability_gates",
    "auth_bridge_and_local_session_engine",
    "patient_linkage_optional_pds_seam",
    "authenticated_request_ownership_and_portal_access",
    "telephony_edge_call_session_state_machine",
    "caller_verification_recording_custody_readiness",
    "continuation_grants_and_supersession",
    "one_pipeline_convergence",
    "duplicate_followup_and_resafety_handling",
    "audit_and_masking",
    "browser_facing_patient_experiences",
    "provider_configuration_discipline",
    "hardening_and_regression_evidence",
}

REQUIRED_INVARIANTS = {
    "nhsLoginAndTelephonyConvergeOnCanonicalIntake",
    "localSessionAndLogoutOwnedAtRelyingServiceBoundary",
    "subjectSwitchWrongPatientHoldAndBindingSupersessionFailClosed",
    "seededAndChallengeContinuationGrantsBoundedAndExactlyOnce",
    "webAndPhoneEquivalentFactsProduceSameTruthAndSafetyOutcome",
    "duplicateFollowupAndLateEvidenceReenterSafetyCorrectly",
    "authenticatedPortalRecoveryAndIdentityHoldPreserveSameShellContinuity",
    "optionalPdsNeverBecomesHiddenTruthOrHardDependency",
    "simulatorBackedEvidenceNotDisguisedAsLiveProviderProof",
    "clinicalSecurityOperationalCarryForwardExplicit",
}


def fail(message: str) -> None:
    raise SystemExit(f"[208-phase2-exit-gate] {message}")


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
    for task_id in range(170, 209):
        marker = r"[Xx]" if task_id < 208 else r"[Xx-]"
        pattern = rf"^- \[{marker}\] (?:seq|par)_{task_id:03d}_"
        if not re.search(pattern, checklist, re.MULTILINE):
            fail(f"task {task_id:03d} is not complete or claimed as required")


def validate_suite_results(decision: dict[str, Any]) -> None:
    suite_ids = {suite["suiteId"] for suite in decision.get("mandatorySuites", [])}
    if suite_ids != set(SUITE_RESULTS):
        fail("mandatory suites must be exactly seq_204 through seq_207")
    for suite in decision["mandatorySuites"]:
        if suite.get("verificationOutcome") != "passed":
            fail(f"{suite['suiteId']} is not passed")
        validate_refs(suite.get("artifactRefs", []), suite["suiteId"])
        result = load_json(SUITE_RESULTS[suite["suiteId"]])
        if result.get("overallStatus") != "passed":
            fail(f"{suite['suiteId']} result file is not passed")
        if result.get("liveProviderEvidenceStatus") not in {"not_applicable", None}:
            fail(f"{suite['suiteId']} must not claim live provider evidence")
        statuses = {case.get("status") for case in result.get("caseResults", [])}
        if "failed" in statuses:
            fail(f"{suite['suiteId']} contains failed case results")


def validate_decision(decision: dict[str, Any], rows: list[dict[str, Any]], open_items: list[dict[str, Any]]) -> None:
    if decision.get("taskId") != "seq_208":
        fail("decision taskId drifted")
    if decision.get("visualMode") != "Identity_Echoes_Exit_Board":
        fail("visualMode drifted")
    if decision.get("gateVerdict") not in {"approved", "go_with_constraints", "withheld"}:
        fail("gateVerdict is invalid")
    if decision.get("liveProviderReadinessState") != "deferred_explicitly_not_approved":
        fail("liveProviderReadinessState must be explicitly deferred")
    if "live" in decision.get("baselineScope", ""):
        fail("baselineScope must not claim live-provider readiness")

    invariants = decision.get("canonicalInvariants", {})
    if set(invariants) != REQUIRED_INVARIANTS:
        fail("canonical invariant set drifted")
    if any(value is not True for value in invariants.values()):
        fail("all Phase 2 canonical invariants must be true for this constrained exit")

    summary = decision["summary"]
    approved_count = sum(1 for row in rows if row["status"] == "approved")
    constrained_count = sum(1 for row in rows if row["status"] == "go_with_constraints")
    withheld_count = sum(1 for row in rows if row["status"] == "withheld")
    if summary["conformanceRowCount"] != len(rows):
        fail("conformance row count summary drifted")
    if summary["approvedRowCount"] != approved_count:
        fail("approved row count summary drifted")
    if summary["goWithConstraintsRowCount"] != constrained_count:
        fail("constrained row count summary drifted")
    if summary["withheldRowCount"] != withheld_count:
        fail("withheld row count summary drifted")
    if summary["carryForwardItemCount"] != len(open_items):
        fail("carry-forward item count summary drifted")
    if summary["mandatorySuitePassCount"] != summary["mandatorySuiteCount"]:
        fail("mandatory suite pass count must match mandatory suite count")
    if summary["blockingItemCount"] != 0:
        fail("this gate must not report blocking open items")

    if decision["gateVerdict"] == "approved":
        if constrained_count or decision.get("deferredOpenItemRefs"):
            fail("approved verdict cannot have constrained rows or deferred open items")
    if decision["gateVerdict"] == "go_with_constraints" and constrained_count == 0:
        fail("go_with_constraints verdict must have at least one constrained row")
    if decision["gateVerdict"] == "withheld" and summary["blockingItemCount"] == 0:
        fail("withheld verdict must identify a blocker")

    if set(decision.get("deferredOpenItemRefs", [])) != {item["itemId"] for item in open_items}:
        fail("decision deferredOpenItemRefs drifted from open items")
    if decision.get("blockerRefs"):
        fail("go_with_constraints exit must not hide blocker refs")
    if decision.get("unresolvedDefects"):
        fail("go_with_constraints exit must not hide unresolved defects")
    if len(decision.get("gateQuestions", [])) != 6:
        fail("gate question set must answer the six prompt questions")
    if any(check.get("state") != "aligned" for check in decision.get("contradictionChecks", [])):
        fail("contradiction checks must be aligned")


def validate_rows(rows: list[dict[str, Any]], evidence: list[dict[str, str]], open_items: list[dict[str, Any]]) -> None:
    family_ids = {row["capabilityFamilyId"] for row in rows}
    if family_ids != REQUIRED_FAMILIES:
        fail(f"capability family coverage drifted: {sorted(REQUIRED_FAMILIES - family_ids)}")

    open_item_ids = {item["itemId"] for item in open_items}
    evidence_by_family: dict[str, list[dict[str, str]]] = {}
    for item in evidence:
        family = item.get("capability_family_id", "")
        evidence_by_family.setdefault(family, []).append(item)
        validate_refs([item.get("artifact_ref", "")], f"evidence row {family}")

    if set(evidence_by_family) != REQUIRED_FAMILIES:
        fail("evidence manifest family coverage drifted")

    for row in rows:
        family = row["capabilityFamilyId"]
        if row["status"] not in {"approved", "go_with_constraints", "withheld"}:
            fail(f"{family} has invalid status")
        if row["proofBasis"] not in {"mock_now", "live_later", "mixed"}:
            fail(f"{family} has invalid proofBasis")
        validate_refs(row.get("sourceRefs", []), family)
        validate_refs(row.get("implementationEvidence", []), family)
        validate_refs(row.get("automatedProofArtifacts", []), family)
        if not row.get("owningTasks"):
            fail(f"{family} missing owningTasks")
        if not row.get("suiteRefs"):
            fail(f"{family} missing suiteRefs")
        if not row.get("invariantRefs"):
            fail(f"{family} missing invariantRefs")
        if not set(row.get("deferredRefs", [])).issubset(open_item_ids):
            fail(f"{family} references unknown carry-forward item")

        kinds = {item["evidence_kind"] for item in evidence_by_family.get(family, [])}
        if "implementation" not in kinds:
            fail(f"{family} lacks implementation evidence")
        if "automated_proof" not in kinds:
            fail(f"{family} lacks automated proof evidence")
        if "suite_binding" not in kinds:
            fail(f"{family} lacks suite binding evidence")


def validate_open_items(open_items: list[dict[str, Any]]) -> None:
    allowed_states = {"deferred_non_blocking", "crosscutting_ready"}
    for item in open_items:
        if item.get("deferredState") not in allowed_states:
            fail(f"{item.get('itemId')} has invalid deferredState")
        for field in [
            "title",
            "priority",
            "workClass",
            "ownerTask",
            "currentBoundaryState",
            "whyNonBlockingNow",
            "futureTaskRefs",
            "riskIfMissed",
            "closeCondition",
            "sourceRefs",
        ]:
            if not item.get(field):
                fail(f"{item.get('itemId')} missing {field}")
        validate_refs(item["futureTaskRefs"], item["itemId"])
        validate_refs(item["sourceRefs"], item["itemId"])


def validate_documents() -> None:
    for path in [EXIT_PACK, GO_NO_GO, SCORECARD, BOUNDARY, BUILDER]:
        read(path)

    exit_pack = read(EXIT_PACK)
    for token in [
        "go_with_constraints",
        "Design Research References",
        "https://carbondesignsystem.com/data-visualization/dashboards/",
        "data/analysis/208_phase2_exit_gate_decision.json",
        "tests/playwright/208_phase2_exit_board.spec.js",
    ]:
        if token not in exit_pack:
            fail(f"exit pack missing {token}")

    go_no_go = read(GO_NO_GO)
    for token in ["Formal decision: `go_with_constraints`", "does not approve", "credentialled live NHS login evidence"]:
        if token not in go_no_go:
            fail(f"go/no-go document missing {token}")

    boundary = read(BOUNDARY)
    for token in ["Mock Now Execution", "Cross-Cutting Consumption In 209+", "Actual Production Strategy Later"]:
        if token not in boundary:
            fail(f"boundary document missing {token}")


def validate_board() -> None:
    board = read(BOARD)
    for token in [
        'data-testid="Identity_Echoes_Exit_Board"',
        'data-testid="VerdictBand"',
        'data-testid="PhaseBraid"',
        'data-testid="ConformanceLadder"',
        'data-testid="BoundaryMap"',
        'data-testid="EvidenceManifestPanel"',
        'data-testid="RiskCarryForwardTable"',
        'data-testid="phase-braid-table"',
        'data-testid="conformance-score-table"',
        'data-testid="parity-table"',
        "--masthead-height: 72px",
        "max-width: 1560px",
        "grid-template-columns: minmax(0, 8fr) minmax(340px, 4fr)",
        "prefers-reduced-motion: reduce",
        "data-preview-button",
        "aria-pressed",
        "go_with_constraints",
        "deferred_explicitly_not_approved",
    ]:
        if token not in board:
            fail(f"exit board missing marker {token}")


def validate_playwright_spec() -> None:
    spec = read(PLAYWRIGHT_SPEC)
    for token in [
        "Identity_Echoes_Exit_Board",
        "208-approved-state.png",
        "208-go-with-constraints-state.png",
        "208-withheld-state.png",
        "ariaSnapshot",
        "reducedMotion",
        "assertNoOverflow",
        "assertContrast",
        "keyboard accessibility",
        "zoom",
        "VerdictBand",
        "PhaseBraid",
        "ConformanceLadder",
        "BoundaryMap",
        "RiskCarryForwardTable",
    ]:
        if token not in spec:
            fail(f"Playwright spec missing token {token}")


def validate_package_chain() -> None:
    package = load_json(PACKAGE_JSON)
    scripts = package.get("scripts", {})
    expected_script = "python3 ./tools/analysis/validate_phase2_exit_gate.py"
    if scripts.get("validate:phase2-exit-gate") != expected_script:
        fail("package.json missing validate:phase2-exit-gate")

    expected_chain = (
        "pnpm validate:phase2-auth-session-suite && "
        "pnpm validate:phase2-telephony-integrity-suite && "
        "pnpm validate:phase2-parity-repair-suite && "
        "pnpm validate:phase2-enrichment-resafety-suite && "
        "pnpm validate:phase2-exit-gate && "
        "pnpm validate:audit-worm"
    )
    for script_name in ["bootstrap", "check"]:
        if expected_chain not in scripts.get(script_name, ""):
            fail(f"package.json {script_name} missing Phase 2 exit gate chain")

    root_updates = read(ROOT_SCRIPT_UPDATES)
    if '"validate:phase2-exit-gate": "python3 ./tools/analysis/validate_phase2_exit_gate.py"' not in root_updates:
        fail("root_script_updates.py missing Phase 2 exit validator script")
    if expected_chain not in root_updates:
        fail("root_script_updates.py missing Phase 2 exit validator chain")


def main() -> None:
    validate_checklist()
    decision = load_json(DECISION)
    rows = load_json(ROWS)
    evidence = load_csv(EVIDENCE)
    open_items = load_json(OPEN_ITEMS)
    validate_suite_results(decision)
    validate_decision(decision, rows, open_items)
    validate_rows(rows, evidence, open_items)
    validate_open_items(open_items)
    validate_documents()
    validate_board()
    validate_playwright_spec()
    validate_package_chain()
    print("208 phase2 exit gate validation passed")


if __name__ == "__main__":
    main()
