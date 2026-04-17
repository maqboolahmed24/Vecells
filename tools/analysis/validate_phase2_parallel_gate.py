#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import re
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "analysis"))

from root_script_updates import ROOT_SCRIPT_UPDATES


CHECKLIST = ROOT / "prompt" / "checklist.md"
GATE_JSON = ROOT / "data" / "analysis" / "174_phase2_parallel_gate.json"
TRACK_MATRIX = ROOT / "data" / "analysis" / "174_phase2_track_matrix.csv"
SEAMS_JSON = ROOT / "data" / "analysis" / "174_phase2_shared_interface_seams.json"
MOCK_LIVE_MATRIX = ROOT / "data" / "analysis" / "174_phase2_mock_now_vs_live_provider_matrix.csv"
GATE_DOC = ROOT / "docs" / "programme" / "174_phase2_parallel_identity_and_telephony_gate.md"
MATRIX_DOC = ROOT / "docs" / "programme" / "174_phase2_track_dependency_matrix.md"
CLAIM_PROTOCOL_DOC = ROOT / "docs" / "programme" / "174_phase2_parallel_claim_protocol.md"
SEAM_DOC = ROOT / "docs" / "programme" / "174_phase2_shared_interface_registry.md"
BOARD_HTML = ROOT / "docs" / "programme" / "174_phase2_parallel_gate_board.html"
PLAYWRIGHT_SPEC = ROOT / "tests" / "playwright" / "174_phase2_parallel_gate_board.spec.js"
ROOT_PACKAGE = ROOT / "package.json"
PLAYWRIGHT_PACKAGE = ROOT / "tests" / "playwright" / "package.json"

EXPECTED_TASK_IDS = [f"par_{task_id}" for task_id in range(175, 195)]
IDENTITY_TASKS = {f"par_{task_id}" for task_id in range(175, 187)}
TELEPHONY_TASKS = {f"par_{task_id}" for task_id in range(187, 195)}
PREREQUISITE_TASKS = ["seq_170", "seq_171", "seq_172", "seq_173"]
EXPECTED_MERGE_GATES = {
    "MG_174_SHARED_CONTRACT",
    "MG_174_SECURITY_MASKING",
    "MG_174_RUNTIME_PUBLICATION",
    "MG_174_REQUEST_CONVERGENCE",
    "MG_174_BROWSER_ACCESSIBILITY",
}
REQUIRED_SEAM_FAMILIES = {
    "auth_transaction_callback_dtos",
    "post_auth_return_route_binding",
    "session_governor_ports",
    "identity_evidence_vault_ports",
    "patient_link_decision_calibration",
    "identity_binding_intent_decision",
    "telephony_normalized_event_envelope",
    "telephony_readiness_continuation_ports",
    "grant_service_claim_continuation",
}
REQUIRED_PROVIDER_FAMILIES = {
    "nhs_login",
    "pds",
    "telephony",
    "sms",
    "object_storage",
    "runtime_publication",
}
PROTECTED_TYPE_SINGLE_OWNER = {
    "AuthTransaction",
    "PostAuthReturnIntent",
    "RouteIntentBinding",
    "Session",
    "PatientLink",
    "PatientLinkDecision",
    "IdentityBinding",
    "CapabilityDecision",
    "AccessGrant",
    "AccessGrantScopeEnvelope",
    "TelephonyProviderEvent",
    "CallSession",
    "TelephonyEvidenceReadinessAssessment",
    "TelephonyContinuationEligibility",
}
REQUIRED_GAPS = {
    "PARALLEL_INTERFACE_GAP_PHASE2_PREREQ_FREEZE_GATE_V1",
    "PARALLEL_INTERFACE_GAP_PHASE2_SHARED_SEAM_REGISTRY_V1",
    "PARALLEL_INTERFACE_GAP_PHASE2_MOCK_LIVE_BOUNDARY_V1",
    "PARALLEL_INTERFACE_GAP_PHASE2_TASK_OWNERSHIP_MATRIX_V1",
    "PARALLEL_INTERFACE_GAP_PHASE2_IDENTITY_TELEPHONY_TOUCHPOINTS_V1",
}
REQUIRED_BOARD_MARKERS = {
    "Phase2_DualTrack_Gate_Board",
    "dual_track_gate_mark",
    "dual-lane-dependency-lattice",
    "shared-seam-ribbon",
    "merge-gate-strip",
    "track-matrix-table",
    "shared-interface-seams-table",
    "mock-live-provider-table",
    "parity-table",
    "inspector",
    "--masthead-height: 72px",
    "--left-rail-width: 300px",
    "--right-inspector-width: 404px",
    "--max-width: 1640px",
    "#f7f8fa",
    "#eef2f6",
    "#ffffff",
    "#f3f6f9",
    "#0f1720",
    "#24313d",
    "#5e6b78",
    "#2f6fed",
    "#0e7490",
    "#5b61f6",
    "#117a55",
    "#b42318",
    "#b7791f",
    "prefers-reduced-motion",
}
REQUIRED_SPEC_MARKERS = {
    "filter behavior",
    "task selection synchronization",
    "keyboard navigation and landmarks",
    "responsive layout",
    "reduced-motion equivalence",
    "diagram/table parity",
    "Phase2_DualTrack_Gate_Board",
}


def fail(message: str) -> None:
    raise SystemExit(f"[phase2-parallel-gate] {message}")


def require_file(path: Path) -> str:
    if not path.exists():
        fail(f"missing required artifact: {path.relative_to(ROOT)}")
    return path.read_text(encoding="utf-8")


def load_json(path: Path) -> Any:
    try:
        return json.loads(require_file(path))
    except json.JSONDecodeError as error:
        fail(f"{path.relative_to(ROOT)} is invalid JSON: {error}")


def load_csv(path: Path) -> list[dict[str, str]]:
    try:
        return list(csv.DictReader(require_file(path).splitlines()))
    except csv.Error as error:
        fail(f"{path.relative_to(ROOT)} is invalid CSV: {error}")


def checklist_state(task_prefix: str) -> str:
    pattern = re.compile(r"- \[([ Xx\-])\] ([^ ]+)")
    for line in require_file(CHECKLIST).splitlines():
        match = pattern.match(line.strip())
        if match and match.group(2).startswith(f"{task_prefix}_"):
            marker = match.group(1)
            return "X" if marker == "x" else marker
    fail(f"checklist row missing for {task_prefix}")


def require_markers(label: str, text: str, markers: set[str]) -> None:
    missing = sorted(marker for marker in markers if marker not in text)
    if missing:
        fail(f"{label} missing markers: {', '.join(missing)}")


def ensure_prerequisites_complete(gate: dict[str, Any]) -> None:
    if gate.get("hardPrerequisiteTasks") != PREREQUISITE_TASKS:
        fail("hard prerequisite task list drifted")
    for task_id in PREREQUISITE_TASKS:
        if checklist_state(task_id) != "X":
            fail(f"gate may not open while {task_id} is incomplete")
    proof = gate.get("hardPrerequisiteProof", [])
    if [entry.get("taskId") for entry in proof] != PREREQUISITE_TASKS:
        fail("hard prerequisite proof ordering drifted")
    for entry in proof:
        if entry.get("state") != "complete":
            fail(f"{entry.get('taskId')} prerequisite proof is not complete")
        if not entry.get("validationCommand", "").startswith("pnpm validate:phase2-"):
            fail(f"{entry.get('taskId')} prerequisite proof lacks validator command")
        for evidence_ref in entry.get("evidenceRefs", []):
            if not (ROOT / evidence_ref).exists():
                fail(f"prerequisite evidence ref missing: {evidence_ref}")


def validate_gate(gate: dict[str, Any]) -> None:
    if gate.get("taskId") != "seq_174":
        fail("gate taskId must be seq_174")
    if gate.get("visualMode") != "Phase2_DualTrack_Gate_Board":
        fail("gate board mode drifted")
    if gate.get("gateVerdict") != "parallel_block_open":
        fail("gate must remain parallel_block_open")
    if gate.get("openTrackCount") != 20 or gate.get("blockedTrackCount") != 0:
        fail("gate open/blocked counts drifted")
    bundle_hash = gate.get("contractBundleHash", "")
    if not re.fullmatch(r"[a-f0-9]{64}", bundle_hash):
        fail("contract bundle hash must be a sha256 hex string")
    for source_ref in gate.get("contractBundle", {}).get("bundleSourceRefs", []):
        if not (ROOT / source_ref).exists():
            fail(f"contract bundle source ref missing: {source_ref}")
    if {item["mergeGateId"] for item in gate.get("mergeGates", [])} != EXPECTED_MERGE_GATES:
        fail("merge gate IDs drifted")
    gap_ids = {gap.get("gapId") for gap in gate.get("parallelInterfaceGaps", [])}
    if not REQUIRED_GAPS.issubset(gap_ids):
        fail("mandatory PARALLEL_INTERFACE_GAP_PHASE2_* closures are missing")
    forbidden = "\n".join(gate.get("forbiddenParallelActions", []))
    for term in [
        "IdentityBinding",
        "PatientLink",
        "AuthTransaction",
        "Session",
        "AccessGrant",
        "telephony readiness",
        "evidence vault",
        "PostAuthReturnIntent",
        "TelephonyContinuationEligibility",
    ]:
        if term not in forbidden:
            fail(f"forbidden parallel actions do not mention {term}")


def validate_matrix(rows: list[dict[str, str]], gate: dict[str, Any]) -> None:
    if [row.get("task_id") for row in rows] != EXPECTED_TASK_IDS:
        fail("track matrix must contain par_175 through par_194 in order")
    if sum(row.get("eligibility_state") == "open" for row in rows) != gate["openTrackCount"]:
        fail("matrix open count does not match gate JSON")
    if sum(row.get("eligibility_state") == "blocked" for row in rows) != gate["blockedTrackCount"]:
        fail("matrix blocked count does not match gate JSON")
    authority_owners: dict[str, str] = {}
    for row in rows:
        task_id = row["task_id"]
        expected_family = "identity" if task_id in IDENTITY_TASKS else "telephony"
        if row.get("track_family") != expected_family:
            fail(f"{task_id} has wrong track family")
        for column in [
            "capability_owned",
            "required_upstream_contracts",
            "produced_downstream_artifacts",
            "shared_packages_or_interfaces",
            "authority_boundary_owned",
            "blocking_merge_dependencies",
            "allowed_parallel_neighbors",
            "board_eligibility_reason_codes",
        ]:
            if not row.get(column):
                fail(f"{task_id} missing matrix column {column}")
        previous = authority_owners.get(row["authority_boundary_owned"])
        if previous:
            fail(f"duplicate authority boundary {row['authority_boundary_owned']} owned by {previous} and {task_id}")
        authority_owners[row["authority_boundary_owned"]] = task_id
        gates = {item.strip() for item in row["blocking_merge_dependencies"].split(";")}
        if not gates.issubset(EXPECTED_MERGE_GATES):
            fail(f"{task_id} references unknown merge gate")
        neighbors = {item.strip() for item in row["allowed_parallel_neighbors"].split(";") if item.strip()}
        if not neighbors.issubset(set(EXPECTED_TASK_IDS)):
            fail(f"{task_id} references a neighbor outside the 175-194 block")
        if task_id in neighbors:
            fail(f"{task_id} may not list itself as an allowed parallel neighbor")
        if "PARALLEL_INTERFACE_GAP_PHASE2_" not in row["board_eligibility_reason_codes"]:
            fail(f"{task_id} lacks Phase 2 gap/eligibility reason code")


def validate_seams(payload: dict[str, Any], rows: list[dict[str, str]]) -> None:
    seams = payload.get("seams", [])
    if len(seams) < 12:
        fail("shared seam registry is too small for the Phase 2 block")
    seam_ids = {seam.get("seamId") for seam in seams}
    matrix_seams: set[str] = set()
    for row in rows:
        for column in ["owned_interface_seams", "consumed_interface_seams"]:
            matrix_seams.update(item.strip() for item in row.get(column, "").split(";") if item.strip())
    missing_from_registry = matrix_seams - seam_ids
    if missing_from_registry:
        fail(f"matrix references seams missing from registry: {', '.join(sorted(missing_from_registry))}")
    families = {seam.get("seamFamily") for seam in seams}
    if not REQUIRED_SEAM_FAMILIES.issubset(families):
        fail("shared interface seams are missing major integration touchpoints")
    valid_owners = set(EXPECTED_TASK_IDS)
    type_owners: dict[str, str] = {}
    for seam in seams:
        seam_id = seam["seamId"]
        owner = seam.get("ownerTaskId")
        if owner not in valid_owners:
            fail(f"{seam_id} owner must be in par_175-par_194")
        if seam.get("allowedWriters") != [owner]:
            fail(f"{seam_id} must allow only its owner task to write")
        if seam.get("forbiddenLocalCopies") is not True:
            fail(f"{seam_id} must forbid local copies")
        if not set(seam.get("mergeGateRefs", [])).issubset(EXPECTED_MERGE_GATES):
            fail(f"{seam_id} references unknown merge gate")
        if not seam.get("portName") or not seam.get("authoritativeContracts"):
            fail(f"{seam_id} missing portName or authoritativeContracts")
        for contract_ref in seam.get("authoritativeContracts", []):
            if contract_ref.startswith("blueprint/"):
                if not (ROOT / contract_ref).exists():
                    fail(f"{seam_id} blueprint contract ref missing: {contract_ref}")
            elif not (ROOT / contract_ref).exists():
                fail(f"{seam_id} authoritative contract ref missing: {contract_ref}")
        for type_name in seam.get("canonicalTypeNames", []):
            if type_name in PROTECTED_TYPE_SINGLE_OWNER:
                previous = type_owners.get(type_name)
                if previous and previous != seam_id:
                    fail(f"protected type {type_name} has multiple seam owners: {previous}, {seam_id}")
                type_owners[type_name] = seam_id
    for type_name in PROTECTED_TYPE_SINGLE_OWNER:
        if type_name not in type_owners:
            fail(f"protected type {type_name} lacks a seam owner")


def validate_mock_live(rows: list[dict[str, str]]) -> None:
    if {row.get("provider_family") for row in rows} != REQUIRED_PROVIDER_FAMILIES:
        fail("mock-now/live-provider matrix provider families drifted")
    for row in rows:
        if row.get("allowed_now") != "true":
            fail(f"{row.get('provider_family')} must be allowed in mock-now execution")
        if row.get("semantic_change_allowed") != "false":
            fail(f"{row.get('provider_family')} must not allow semantic change during live onboarding")
        for column in ["mock_now_source", "live_provider_later", "owned_by_tasks", "contract_refs", "live_prerequisites", "reason_codes"]:
            if not row.get(column):
                fail(f"{row.get('provider_family')} missing mock/live column {column}")


def validate_docs_and_board(rows: list[dict[str, str]], seams: dict[str, Any]) -> None:
    for path in [GATE_DOC, MATRIX_DOC, CLAIM_PROTOCOL_DOC, SEAM_DOC]:
        text = require_file(path)
        for marker in ["PARALLEL_INTERFACE_GAP_PHASE2_", "MG_174_", "par_175", "par_194"]:
            if marker not in text:
                fail(f"{path.relative_to(ROOT)} missing marker {marker}")
    board = require_file(BOARD_HTML)
    require_markers("board HTML", board, REQUIRED_BOARD_MARKERS)
    for data_ref in [
        "/data/analysis/174_phase2_parallel_gate.json",
        "/data/analysis/174_phase2_track_matrix.csv",
        "/data/analysis/174_phase2_shared_interface_seams.json",
        "/data/analysis/174_phase2_mock_now_vs_live_provider_matrix.csv",
    ]:
        if data_ref not in board:
            fail(f"board does not load backing data source {data_ref}")
    if "state.matrix = parseCsv(matrixText)" not in board:
        fail("board eligibility must be rendered from the machine-readable matrix")
    if "state.seams = seamsPayload.seams" not in board:
        fail("board seam ribbon must be rendered from the machine-readable seam registry")


def validate_script_wiring() -> None:
    package = load_json(ROOT_PACKAGE)
    playwright_package = load_json(PLAYWRIGHT_PACKAGE)
    scripts = package.get("scripts", {})
    if scripts.get("validate:phase2-parallel-gate") != "python3 ./tools/analysis/validate_phase2_parallel_gate.py":
        fail("root package missing validate:phase2-parallel-gate script")
    for chain_name in ["bootstrap", "check"]:
        chain = scripts.get(chain_name, "")
        if "pnpm validate:phase2-telephony-contracts && pnpm validate:phase2-parallel-gate && pnpm validate:domain-transition-schema" not in chain:
            fail(f"root package {chain_name} chain does not run seq174 validator after telephony")
        root_update_chain = ROOT_SCRIPT_UPDATES.get(chain_name, "")
        if "pnpm validate:phase2-telephony-contracts && pnpm validate:phase2-parallel-gate && pnpm validate:domain-transition-schema" not in root_update_chain:
            fail(f"root_script_updates {chain_name} chain does not run seq174 validator after telephony")
    if ROOT_SCRIPT_UPDATES.get("validate:phase2-parallel-gate") != "python3 ./tools/analysis/validate_phase2_parallel_gate.py":
        fail("root_script_updates missing validate:phase2-parallel-gate")
    for script_name in ["build", "lint", "test", "typecheck", "e2e"]:
        if "174_phase2_parallel_gate_board.spec.js" not in playwright_package.get("scripts", {}).get(script_name, ""):
            fail(f"playwright package {script_name} script missing seq174 spec")


def validate_spec() -> None:
    spec = require_file(PLAYWRIGHT_SPEC)
    require_markers("Playwright spec", spec, REQUIRED_SPEC_MARKERS)


def main() -> None:
    for path in [
        GATE_JSON,
        TRACK_MATRIX,
        SEAMS_JSON,
        MOCK_LIVE_MATRIX,
        GATE_DOC,
        MATRIX_DOC,
        CLAIM_PROTOCOL_DOC,
        SEAM_DOC,
        BOARD_HTML,
        PLAYWRIGHT_SPEC,
        ROOT_PACKAGE,
        PLAYWRIGHT_PACKAGE,
        CHECKLIST,
    ]:
        require_file(path)

    gate = load_json(GATE_JSON)
    rows = load_csv(TRACK_MATRIX)
    seams = load_json(SEAMS_JSON)
    providers = load_csv(MOCK_LIVE_MATRIX)

    ensure_prerequisites_complete(gate)
    validate_gate(gate)
    validate_matrix(rows, gate)
    validate_seams(seams, rows)
    validate_mock_live(providers)
    validate_docs_and_board(rows, seams)
    validate_script_wiring()
    validate_spec()

    print("Phase 2 parallel identity/telephony gate validated.")


if __name__ == "__main__":
    main()
