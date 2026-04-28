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

GATE_DOC = ROOT / "docs" / "programme" / "209_crosscutting_patient_account_and_support_gate.md"
MATRIX_DOC = ROOT / "docs" / "programme" / "209_crosscutting_track_dependency_matrix.md"
CLAIM_DOC = ROOT / "docs" / "programme" / "209_crosscutting_parallel_claim_protocol.md"
REGISTRY_DOC = ROOT / "docs" / "programme" / "209_crosscutting_shared_interface_registry.md"
BOARD = ROOT / "docs" / "frontend" / "209_crosscutting_gate_board.html"
TRACK_MATRIX = ROOT / "data" / "analysis" / "209_crosscutting_track_matrix.csv"
GATE_JSON = ROOT / "data" / "analysis" / "209_crosscutting_parallel_gate.json"
REGISTRY_JSON = ROOT / "data" / "analysis" / "209_crosscutting_shared_interface_seams.json"
MOCK_ACTUAL = ROOT / "data" / "analysis" / "209_crosscutting_mock_now_vs_actual_later_matrix.csv"
BUILDER = ROOT / "tools" / "analysis" / "build_crosscutting_parallel_gate.py"
PLAYWRIGHT_SPEC = ROOT / "tests" / "playwright" / "209_crosscutting_gate_board.spec.js"

EXPECTED_TASK_NUMBERS = {str(number) for number in range(210, 223)}
EXPECTED_TASK_IDS = {f"par_{number}" for number in range(210, 223)}
EXPECTED_LANE_COUNTS = {
    "patient_backend": 5,
    "patient_frontend": 3,
    "support_backend": 2,
    "support_frontend": 3,
}
EXPECTED_SCRIPT = "python3 ./tools/analysis/validate_crosscutting_parallel_gate.py"
REQUIRED_GAP_FIELDS = {
    "taskId",
    "missingSurface",
    "expectedOwnerTask",
    "temporaryFallback",
    "riskIfUnresolved",
    "followUpAction",
}
REQUIRED_INTERFACES = {
    "PatientSpotlightDecisionProjection",
    "PatientSpotlightDecisionUseWindow",
    "PatientQuietHomeDecision",
    "PatientPortalNavigationProjection",
    "PatientNavUrgencyDigest",
    "PatientNavReturnContract",
    "PatientRequestsIndexProjection",
    "PatientRequestLineageProjection",
    "PatientRequestDetailProjection",
    "PatientRequestDownstreamProjection",
    "PatientRequestReturnBundle",
    "PatientNextActionProjection",
    "PatientActionRoutingProjection",
    "PatientActionSettlementProjection",
    "PatientSafetyInterruptionProjection",
    "PatientCallbackStatusProjection",
    "PatientCommunicationVisibilityProjection",
    "ConversationThreadProjection",
    "ConversationSubthreadProjection",
    "SupportTicketWorkspaceProjection",
    "SupportLineageBinding",
    "SupportLineageArtifactBinding",
    "SupportOmnichannelTimelineProjection",
    "SupportReadOnlyFallbackProjection",
    "SupportReplayEvidenceBoundary",
    "SupportContinuityEvidenceProjection",
}
REQUIRED_FAMILIES = {
    "patient_home_spotlight_family",
    "patient_request_action_family",
    "callback_and_clinician_message_projection_family",
    "communications_timeline_and_visibility_family",
    "support_ticket_and_omnichannel_timeline_family",
    "support_masking_and_replay_diff_family",
    "shared_continuity_evidence_and_reachability_truth_family",
}
REQUIRED_LAWS = {
    "IDENTITY_BINDING_TRUTH",
    "SESSION_TRUTH",
    "RELEASE_TRUST_FREEZES",
    "SAME_SHELL_CONTINUITY",
    "RETURN_CONTRACTS",
    "CANONICAL_REQUEST_AND_DUPLICATE_TRUTH",
}


def fail(message: str) -> None:
    raise SystemExit(f"[209-crosscutting-parallel-gate] {message}")


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


def split_list(value: str) -> list[str]:
    return [part for part in value.split(";") if part]


def resolve_ref(ref: str) -> Path:
    path_part = ref.split("#", 1)[0]
    if not path_part:
        return ROOT
    return ROOT / path_part


def validate_refs(refs: list[str], context: str) -> None:
    for ref in refs:
        path = resolve_ref(ref)
        if not path.exists():
            fail(f"{context} references missing artifact {ref}")


def validate_checklist() -> None:
    checklist = read(CHECKLIST)
    if not re.search(r"^- \[[Xx]\] seq_208_", checklist, re.MULTILINE):
        fail("seq_208 must be complete before this gate")
    if not re.search(r"^- \[[Xx-]\] seq_209_", checklist, re.MULTILINE):
        fail("seq_209 must be claimed or complete")


def validate_matrix(rows: list[dict[str, str]]) -> None:
    task_numbers = {row.get("taskNumber", "") for row in rows}
    if task_numbers != EXPECTED_TASK_NUMBERS:
        fail(f"track matrix task coverage drifted: {sorted(EXPECTED_TASK_NUMBERS - task_numbers)}")
    task_ids = {row.get("taskId", "") for row in rows}
    if task_ids != EXPECTED_TASK_IDS:
        fail("track matrix task ids must be par_210 through par_222")
    lane_counts = {lane: 0 for lane in EXPECTED_LANE_COUNTS}
    required_columns = [
        "taskNumber",
        "taskId",
        "taskName",
        "domainLane",
        "promptRef",
        "sourceSections",
        "hardPrerequisites",
        "softPrerequisites",
        "sharedInterfacesConsumed",
        "sharedInterfacesProduced",
        "allowedParallelNeighbors",
        "forbiddenOverlap",
        "mergeGateRequirements",
        "mockNowVsActualLaterAssumptions",
        "gapArtifactRefs",
    ]
    for row in rows:
        for column in required_columns:
            if not row.get(column):
                fail(f"{row.get('taskId', 'unknown')} missing matrix column {column}")
        lane = row["domainLane"]
        if lane not in lane_counts:
            fail(f"{row['taskId']} has unknown lane {lane}")
        lane_counts[lane] += 1
        validate_refs([row["promptRef"]], row["taskId"])
        if not {"seq_208", "seq_209"}.issubset(set(split_list(row["hardPrerequisites"]))):
            fail(f"{row['taskId']} must hard depend on seq_208 and seq_209")
        hard_sibling_prereqs = set(split_list(row["hardPrerequisites"])) & EXPECTED_TASK_IDS
        if hard_sibling_prereqs:
            fail(f"{row['taskId']} hard-blocks parallel siblings: {sorted(hard_sibling_prereqs)}")
        if not set(split_list(row["allowedParallelNeighbors"])).issubset(EXPECTED_TASK_IDS):
            fail(f"{row['taskId']} has invalid parallel neighbor")
        if len(row["forbiddenOverlap"]) < 20:
            fail(f"{row['taskId']} forbidden overlap is not explicit")
        boundary_text = row["mockNowVsActualLaterAssumptions"].lower()
        if not any(token in boundary_text for token in ["actual", "later", "future"]):
            fail(f"{row['taskId']} mock-now vs actual-later assumption is unclear")
        validate_refs(split_list(row["gapArtifactRefs"]), row["taskId"])
    if lane_counts != EXPECTED_LANE_COUNTS:
        fail(f"lane counts drifted: {lane_counts}")


def validate_gate(gate: dict[str, Any], matrix_rows: list[dict[str, str]], registry: dict[str, Any], mock_rows: list[dict[str, str]]) -> None:
    if gate.get("taskId") != "seq_209":
        fail("gate taskId drifted")
    if gate.get("visualMode") != "Patient_Account_Support_Gate_Board":
        fail("visualMode drifted")
    if gate.get("gateState") != "opened_with_explicit_parallel_seams":
        fail("gateState must open with explicit parallel seams")
    summary = gate.get("summary", {})
    if summary.get("taskCount") != len(matrix_rows) or summary.get("taskCount") != 13:
        fail("gate task summary drifted")
    if summary.get("sharedInterfaceCount") != len(registry.get("interfaces", [])):
        fail("shared interface summary drifted")
    if summary.get("mockActualBoundaryCount") != len(mock_rows):
        fail("mock/actual boundary summary drifted")
    for key, value in {
        "canvas": "#F5F7FB",
        "panel": "#FFFFFF",
        "inset": "#EEF2F7",
        "strongText": "#0F172A",
        "defaultText": "#334155",
        "mutedText": "#64748B",
        "border": "#D7DFEA",
        "patientBackend": "#3158E0",
        "patientFrontend": "#5B61F6",
        "supportBackend": "#0F766E",
        "supportFrontend": "#B7791F",
        "conflict": "#B42318",
    }.items():
        if gate.get("designTokens", {}).get(key) != value:
            fail(f"design token {key} drifted")
    if {law["lawId"] for law in gate.get("continuityLaws", [])} < REQUIRED_LAWS:
        fail("continuity laws are incomplete")
    if len(gate.get("mergeGates", [])) < 7:
        fail("merge gates are incomplete")
    if len(gate.get("forbiddenOverlaps", [])) < 6:
        fail("forbidden overlap controls are incomplete")
    for gate_row in gate.get("mergeGates", []):
        if not gate_row.get("requirement") or not gate_row.get("evidenceRefs"):
            fail(f"{gate_row.get('gateId')} missing merge gate details")
        validate_refs(gate_row["evidenceRefs"], gate_row["gateId"])
    for overlap in gate.get("forbiddenOverlaps", []):
        for field in ["ownerBoundary", "risk", "mergeCheck"]:
            if not overlap.get(field):
                fail(f"{overlap.get('overlapId')} missing {field}")
    if set(gate.get("requiredBoardRegions", [])) != {
        "TrackLaneGrid",
        "SharedSeamRibbon",
        "MergeGateStrip",
        "OwnershipConflictPanel",
        "MockVsActualBoundaryMap",
    }:
        fail("required board regions drifted")
    validate_refs(gate.get("sourcePrecedence", []), "gate source precedence")
    validate_refs(gate.get("gapArtifacts", []), "gate gap artifacts")


def validate_registry(registry: dict[str, Any]) -> None:
    if registry.get("taskId") != "seq_209":
        fail("registry taskId drifted")
    interfaces = registry.get("interfaces", [])
    names = [item.get("interfaceName") for item in interfaces]
    if len(names) != len(set(names)):
        fail("registry contains duplicate interface names")
    if set(names) < REQUIRED_INTERFACES:
        fail(f"registry missing required interfaces: {sorted(REQUIRED_INTERFACES - set(names))}")
    families = {item.get("interfaceFamily") for item in interfaces}
    if not REQUIRED_FAMILIES.issubset(families):
        fail(f"registry missing required interface families: {sorted(REQUIRED_FAMILIES - families)}")
    for item in interfaces:
        name = item.get("interfaceName", "")
        owner = item.get("authoritativeOwnerTask", "")
        if owner not in EXPECTED_TASK_IDS:
            fail(f"{name} has invalid owner {owner}")
        consumers = set(item.get("consumingTasks", []))
        if not consumers:
            fail(f"{name} missing consumers")
        allowed_consumers = EXPECTED_TASK_IDS | {"par_223"}
        if not consumers.issubset(allowed_consumers):
            fail(f"{name} has invalid consumers {sorted(consumers - allowed_consumers)}")
        if not item.get("versioningRule", "").startswith("v1 is frozen by seq_209"):
            fail(f"{name} missing frozen versioning rule")
        if not item.get("temporaryFallbackIfOwnerNotLanded"):
            fail(f"{name} missing temporary fallback")
        validate_refs(item.get("sourceRefs", []), name)
        if item.get("gapArtifactAllowed"):
            gap_ref = item.get("gapArtifactRef", "")
            if not gap_ref:
                fail(f"{name} allows a gap artifact without naming it")
            validate_refs([gap_ref], name)


def validate_gap_artifacts(gate: dict[str, Any]) -> None:
    for ref in gate.get("gapArtifacts", []):
        payload = load_json(ROOT / ref)
        missing = REQUIRED_GAP_FIELDS - set(payload)
        if missing:
            fail(f"{ref} missing fields {sorted(missing)}")
        for field in REQUIRED_GAP_FIELDS:
            if not payload.get(field):
                fail(f"{ref} has empty {field}")
        if payload.get("taskId") != "seq_209":
            fail(f"{ref} taskId must remain seq_209")


def validate_mock_actual(rows: list[dict[str, str]]) -> None:
    if len(rows) < 10:
        fail("mock-now vs actual-later matrix must contain at least ten boundaries")
    required_columns = ["boundaryId", "surfaceArea", "mockNowAllowed", "actualLaterOwner", "temporaryFallback", "closeCondition", "riskIfBlurred", "artifactRef"]
    for row in rows:
        for column in required_columns:
            if not row.get(column):
                fail(f"{row.get('boundaryId', 'unknown')} missing {column}")
        validate_refs([row["artifactRef"]], row["boundaryId"])
    actual_later_text = " ".join(row["actualLaterOwner"] for row in rows).lower()
    for token in ["par_210", "par_211", "par_212", "par_213", "par_214", "par_218", "par_219"]:
        if token not in actual_later_text:
            fail(f"mock/actual matrix missing later owner {token}")


def extract_embedded_payload(board: str) -> dict[str, Any]:
    match = re.search(r'<script id="crosscutting-gate-data" type="application/json">(.*?)</script>', board, re.DOTALL)
    if not match:
        fail("board missing embedded gate JSON")
    try:
        return json.loads(match.group(1))
    except json.JSONDecodeError as exc:
        fail(f"board embedded JSON is invalid: {exc}")


def validate_board(gate: dict[str, Any], registry: dict[str, Any], mock_rows: list[dict[str, str]]) -> None:
    board = read(BOARD)
    for token in [
        'data-testid="Patient_Account_Support_Gate_Board"',
        'data-testid="TrackLaneGrid"',
        'data-testid="SharedSeamRibbon"',
        'data-testid="MergeGateStrip"',
        'data-testid="OwnershipConflictPanel"',
        'data-testid="MockVsActualBoundaryMap"',
        'data-testid="lane-filter"',
        'data-testid="detail-drawer"',
        "--top-band-height: 72px",
        "max-width: 1600px",
        "#F5F7FB",
        "#3158E0",
        "#5B61F6",
        "#0F766E",
        "#B7791F",
        "#B42318",
        "grid-template-columns: repeat(4, minmax(0, 1fr))",
        "grid-template-columns: repeat(2, minmax(0, 1fr))",
        "prefers-reduced-motion: reduce",
        "data-seam-button",
        "data-merge-gate",
        "data-lane-filter",
        "document.documentElement.dataset.ready = \"true\"",
    ]:
        if token not in board:
            fail(f"board missing marker {token}")
    embedded = extract_embedded_payload(board)
    embedded_gate = embedded.get("gate", {})
    embedded_registry = embedded.get("registry", [])
    if embedded_gate.get("summary") != gate.get("summary"):
        fail("embedded board gate summary drifted from gate JSON")
    registry_pairs = {(item["interfaceName"], item["authoritativeOwnerTask"]) for item in registry["interfaces"]}
    embedded_pairs = {(item["interfaceName"], item["authoritativeOwnerTask"]) for item in embedded_registry}
    if embedded_pairs != registry_pairs:
        fail("embedded board registry drifted from machine-readable registry")
    if len(embedded.get("mockActualRows", [])) != len(mock_rows):
        fail("embedded board mock/actual rows drifted")


def validate_documents() -> None:
    for path in [GATE_DOC, MATRIX_DOC, CLAIM_DOC, REGISTRY_DOC, BUILDER]:
        read(path)
    gate_doc = read(GATE_DOC)
    for token in [
        "Patient_Account_Support_Gate_Board",
        "Dashboard drift",
        "Route-local patient action drift",
        "Support ownership creep",
        "data/analysis/209_crosscutting_parallel_gate.json",
    ]:
        if token not in gate_doc:
            fail(f"gate doc missing {token}")
    matrix_doc = read(MATRIX_DOC)
    for token in ["par_210", "par_222", "Mock-now vs actual-later", "Forbidden overlap"]:
        if token not in matrix_doc:
            fail(f"matrix doc missing {token}")
    claim_doc = read(CLAIM_DOC)
    for token in [
        "PARALLEL_INTERFACE_GAP_CROSSCUTTING_<AREA>.json",
        "`seq_208` and this gate as hard prerequisites",
        "may not mark a task complete",
    ]:
        if token not in claim_doc:
            fail(f"claim protocol missing {token}")
    registry_doc = read(REGISTRY_DOC)
    for token in ["one authoritative owner", "PatientSpotlightDecisionProjection", "SupportReplayEvidenceBoundary"]:
        if token not in registry_doc:
            fail(f"registry doc missing {token}")


def validate_playwright_spec() -> None:
    spec = read(PLAYWRIGHT_SPEC)
    for token in [
        "Patient_Account_Support_Gate_Board",
        "209-crosscutting-desktop.png",
        "209-crosscutting-mobile-lane-filter.png",
        "209-crosscutting-seam-detail.png",
        "209-crosscutting-merge-gate-detail.png",
        "TrackLaneGrid",
        "SharedSeamRibbon",
        "ariaSnapshot",
        "reducedMotion",
        "assertNoOverflow",
        "keyboard navigation",
        "zoom",
        "lane-filter",
        "MockVsActualBoundaryMap",
    ]:
        if token not in spec:
            fail(f"Playwright spec missing marker {token}")


def validate_package_script() -> None:
    package = load_json(PACKAGE_JSON)
    if package.get("scripts", {}).get("validate:crosscutting-parallel-gate") != EXPECTED_SCRIPT:
        fail("package.json missing validate:crosscutting-parallel-gate")
    root_updates = read(ROOT_SCRIPT_UPDATES)
    if '"validate:crosscutting-parallel-gate": "python3 ./tools/analysis/validate_crosscutting_parallel_gate.py"' not in root_updates:
        fail("root_script_updates.py missing crosscutting validator script")


def main() -> None:
    validate_checklist()
    matrix_rows = load_csv(TRACK_MATRIX)
    gate = load_json(GATE_JSON)
    registry = load_json(REGISTRY_JSON)
    mock_rows = load_csv(MOCK_ACTUAL)
    validate_matrix(matrix_rows)
    validate_registry(registry)
    validate_mock_actual(mock_rows)
    validate_gate(gate, matrix_rows, registry, mock_rows)
    validate_gap_artifacts(gate)
    validate_board(gate, registry, mock_rows)
    validate_documents()
    validate_playwright_spec()
    validate_package_script()


if __name__ == "__main__":
    main()
