#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "analysis"))

from root_script_updates import ROOT_SCRIPT_UPDATES


DATA_ANALYSIS_DIR = ROOT / "data" / "analysis"
DATA_CONTRACTS_DIR = ROOT / "data" / "contracts"
DOCS_PROGRAMME_DIR = ROOT / "docs" / "programme"
DOCS_FRONTEND_DIR = ROOT / "docs" / "frontend"
PLAYWRIGHT_DIR = ROOT / "tests" / "playwright"

CHECKLIST_PATH = ROOT / "prompt" / "checklist.md"
BUILDER_PATH = ROOT / "tools" / "analysis" / "build_phase1_parallel_gate.py"

GATE_JSON_PATH = DATA_ANALYSIS_DIR / "143_phase1_parallel_gate.json"
SEAMS_JSON_PATH = DATA_ANALYSIS_DIR / "143_phase1_shared_interface_seams.json"
TRACK_MATRIX_PATH = DATA_ANALYSIS_DIR / "143_phase1_parallel_track_matrix.csv"

GATE_DOC_PATH = DOCS_PROGRAMME_DIR / "143_phase1_parallel_intake_gate.md"
MATRIX_DOC_PATH = DOCS_PROGRAMME_DIR / "143_phase1_track_dependency_matrix.md"
CLAIM_PROTOCOL_DOC_PATH = DOCS_PROGRAMME_DIR / "143_phase1_parallel_claim_protocol.md"
BOARD_HTML_PATH = DOCS_FRONTEND_DIR / "143_phase1_gate_board.html"
SPEC_PATH = PLAYWRIGHT_DIR / "143_phase1_gate_board.spec.js"

PACKAGE_JSON_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_JSON_PATH = PLAYWRIGHT_DIR / "package.json"

EVENT_CATALOG_PATH = DATA_CONTRACTS_DIR / "139_intake_event_catalog.json"
REQUEST_TYPE_TAXONOMY_PATH = DATA_CONTRACTS_DIR / "140_request_type_taxonomy.json"
ATTACHMENT_POLICY_PATH = DATA_CONTRACTS_DIR / "141_attachment_acceptance_policy.json"
OUTCOME_COPY_PATH = DATA_CONTRACTS_DIR / "142_outcome_copy_contract.json"

EXPECTED_TRACK_IDS = [f"par_{index}" for index in range(144, 164)]
EXPECTED_MERGE_GATES = {
    "MG_143_BACKEND_CONTRACT",
    "MG_143_RUNTIME_PUBLICATION",
    "MG_143_PATIENT_SHELL_INTEGRATION",
    "MG_143_TEST_ACCESSIBILITY",
}
EXPECTED_TRACK_FAMILY_COUNTS = {
    "backend_foundation": 6,
    "backend_outcome": 5,
    "frontend_capture": 5,
    "frontend_outcome": 4,
}
REQUIRED_BOARD_MARKERS = [
    'data-testid="phase1-parallel-gate-board"',
    'data-testid="board-masthead"',
    'data-testid="track-family-filter"',
    'data-testid="gate-filter"',
    'data-testid="state-filter"',
    'data-testid="dependency-lattice"',
    'data-testid="merge-gate-strip"',
    'data-testid="inspector"',
    'data-testid="track-matrix-table"',
    'data-testid="shared-seam-table"',
    'data-testid="dependency-edge-table"',
    'data-testid="merge-gate-table"',
]


def fail(message: str) -> None:
    print(message, file=sys.stderr)
    raise SystemExit(1)


def assert_exists(path: Path) -> None:
    if not path.exists():
        fail(f"Missing seq_143 artifact: {path}")


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


def extract_embedded_json(html: str, script_id: str):
    match = re.search(
        rf'<script id="{re.escape(script_id)}" type="application/json">([\s\S]*?)</script>',
        html,
    )
    if not match:
        fail(f"Board HTML is missing embedded JSON for {script_id}.")
    return json.loads(match.group(1))


def checklist_state(task_id: str) -> str:
    pattern = re.compile(r"- \[([ X\-])\] ([^ ]+)")
    for line in CHECKLIST_PATH.read_text(encoding="utf-8").splitlines():
        match = pattern.match(line.strip())
        if match and (match.group(2) == task_id or match.group(2).startswith(f"{task_id}_")):
            return match.group(1)
    fail(f"Checklist row missing for {task_id}.")


def ensure_hard_prerequisites_complete() -> None:
    for task_id in ["seq_139", "seq_140", "seq_141", "seq_142"]:
        if checklist_state(task_id) != "X":
            fail(f"seq_143 may not open while {task_id} is incomplete.")


def main() -> None:
    for path in [
        BUILDER_PATH,
        GATE_JSON_PATH,
        SEAMS_JSON_PATH,
        TRACK_MATRIX_PATH,
        GATE_DOC_PATH,
        MATRIX_DOC_PATH,
        CLAIM_PROTOCOL_DOC_PATH,
        BOARD_HTML_PATH,
        SPEC_PATH,
        PACKAGE_JSON_PATH,
        PLAYWRIGHT_PACKAGE_JSON_PATH,
        CHECKLIST_PATH,
        EVENT_CATALOG_PATH,
        REQUEST_TYPE_TAXONOMY_PATH,
        ATTACHMENT_POLICY_PATH,
        OUTCOME_COPY_PATH,
    ]:
        assert_exists(path)

    ensure_hard_prerequisites_complete()

    gate = read_json(GATE_JSON_PATH)
    seams_payload = read_json(SEAMS_JSON_PATH)
    matrix_rows = read_csv(TRACK_MATRIX_PATH)
    root_package = read_json(PACKAGE_JSON_PATH)
    playwright_package = read_json(PLAYWRIGHT_PACKAGE_JSON_PATH)
    board_html = BOARD_HTML_PATH.read_text(encoding="utf-8")
    event_catalog = read_json(EVENT_CATALOG_PATH)
    request_type_taxonomy = read_json(REQUEST_TYPE_TAXONOMY_PATH)
    attachment_policy = read_json(ATTACHMENT_POLICY_PATH)
    outcome_copy = read_json(OUTCOME_COPY_PATH)

    if gate["taskId"] != "seq_143":
        fail("seq_143 gate task id drifted.")
    if gate["visualMode"] != "Phase1_Parallel_Gate_Board":
        fail("seq_143 board mode drifted.")
    if gate["gateVerdict"] != "parallel_block_open":
        fail("seq_143 must keep the parallel block open.")
    if gate["openTrackCount"] != 20 or gate["blockedTrackCount"] != 0:
        fail("seq_143 track-open/blocked counts drifted.")
    if gate["hardPrerequisiteTasks"] != ["seq_139", "seq_140", "seq_141", "seq_142"]:
        fail("seq_143 hard prerequisite task list drifted.")
    if set(gate["summary"]["trackFamilyCounts"]) != set(EXPECTED_TRACK_FAMILY_COUNTS):
        fail("seq_143 track family coverage drifted.")
    if gate["summary"]["trackFamilyCounts"] != EXPECTED_TRACK_FAMILY_COUNTS:
        fail("seq_143 track family counts drifted.")
    if gate["summary"]["mergeGateCount"] != 4:
        fail("seq_143 merge gate count drifted.")
    if gate["summary"]["parallelInterfaceGapCount"] < 2:
        fail("seq_143 parallel interface gaps are unexpectedly sparse.")
    if len(gate["parallelInterfaceGaps"]) != gate["summary"]["parallelInterfaceGapCount"]:
        fail("seq_143 parallel interface gap summary drifted.")

    if event_catalog["canonicalSubmitEvent"] != "request.submitted":
        fail("seq_139 canonical submit event drifted underneath seq_143.")
    catalog_event_names = {row["eventName"] for row in event_catalog["eventCatalog"]}
    required_events = {
        "request.submitted",
        "safety.urgent_diversion.required",
        "safety.urgent_diversion.completed",
        "intake.attachment.quarantined",
    }
    if not required_events.issubset(catalog_event_names):
        fail("seq_139 event catalog no longer contains the required canonical event names.")

    request_types = [row["requestType"] for row in request_type_taxonomy["requestTypes"]]
    if request_types != ["Symptoms", "Meds", "Admin", "Results"]:
        fail("seq_140 request-type taxonomy drifted underneath seq_143.")

    attachment_event_names = {row["eventName"] for row in attachment_policy["eventPolicy"]}
    if "intake.attachment.quarantined" not in attachment_event_names:
        fail("seq_141 attachment policy lost intake.attachment.quarantined.")

    safety_states = set(outcome_copy["stateMachine"]["safetyStates"])
    if not {"urgent_diversion_required", "urgent_diverted"}.issubset(safety_states):
        fail("seq_142 outcome copy lost the urgent-diversion state split.")

    tracks = gate["tracks"]
    track_ids = [track["taskId"] for track in tracks]
    if track_ids != EXPECTED_TRACK_IDS:
        fail("seq_143 track ordering drifted.")
    if len(matrix_rows) != 20:
        fail("seq_143 track matrix row count drifted.")
    if [row["task_id"] for row in matrix_rows] != EXPECTED_TRACK_IDS:
        fail("seq_143 track matrix ordering drifted.")

    if {gate_row["mergeGateId"] for gate_row in gate["mergeGates"]} != EXPECTED_MERGE_GATES:
        fail("seq_143 merge gate ids drifted.")

    seam_ids = {seam["seamId"] for seam in seams_payload["seams"]}
    if seam_ids != set(gate["seamRefs"]):
        fail("seq_143 seam refs drifted between gate and seam payloads.")
    if len(seams_payload["seams"]) < 10:
        fail("seq_143 seam list is too small for the published parallel block.")

    reserved_schema_owners: dict[str, str] = {}
    reserved_event_owners: dict[str, str] = {}
    for seam in seams_payload["seams"]:
        if not seam["ownerTaskId"] or not seam["sourceRefs"]:
            fail(f"seq_143 seam is missing owner or source refs: {seam['seamId']}")
        for schema_name in seam["reservedPublicSchemaNames"]:
            previous = reserved_schema_owners.get(schema_name)
            if previous:
                fail(f"Duplicate seq_143 public schema owner: {schema_name} ({previous}, {seam['seamId']})")
            reserved_schema_owners[schema_name] = seam["seamId"]
        for event_name in seam["reservedEventNames"]:
            previous = reserved_event_owners.get(event_name)
            if previous:
                fail(f"Duplicate seq_143 public event owner: {event_name} ({previous}, {seam['seamId']})")
            reserved_event_owners[event_name] = seam["seamId"]
        if not set(seam["mergeGateRefs"]).issubset(EXPECTED_MERGE_GATES):
            fail(f"seq_143 seam references unknown merge gates: {seam['seamId']}")

    if reserved_event_owners.get("request.submitted") != "SEAM_143_PUBLIC_JOURNEY_AND_EVENT_SPINE":
        fail("seq_143 must keep request.submitted owned by the seq_139 public journey seam.")
    if reserved_event_owners.get("safety.urgent_diversion.required") != "SEAM_143_PUBLIC_JOURNEY_AND_EVENT_SPINE":
        fail("seq_143 must keep urgent_diversion.required owned by the seq_139 public journey seam.")
    if reserved_event_owners.get("safety.urgent_diversion.completed") != "SEAM_143_PUBLIC_JOURNEY_AND_EVENT_SPINE":
        fail("seq_143 must keep urgent_diversion.completed owned by the seq_139 public journey seam.")

    expected_contract_bundle_schemas = set(seams_payload["reservedPublicSchemaNames"])
    if set(gate["contractBundle"]["frozenPublicSchemaNames"]) != expected_contract_bundle_schemas:
        fail("seq_143 contract bundle schema set drifted from the seam catalog.")
    expected_contract_bundle_events = set(seams_payload["reservedEventNames"])
    if set(gate["contractBundle"]["canonicalEventNames"]) != expected_contract_bundle_events:
        fail("seq_143 contract bundle event set drifted from the seam catalog.")

    dependency_edges = gate["dependencyEdges"]
    if len(dependency_edges) != gate["summary"]["dependencyEdgeCount"]:
        fail("seq_143 dependency edge count drifted.")
    required_edges = {
        ("par_144", "par_145"),
        ("par_144", "par_146"),
        ("par_145", "par_148"),
        ("par_146", "par_148"),
        ("par_148", "par_149"),
        ("par_149", "par_150"),
        ("par_150", "par_151"),
        ("par_151", "par_152"),
        ("par_152", "par_153"),
        ("par_145", "par_156"),
        ("par_146", "par_158"),
        ("par_147", "par_159"),
        ("par_151", "par_160"),
        ("par_151", "par_161"),
        ("par_152", "par_162"),
        ("par_154", "par_163"),
    }
    observed_edges = {(edge["fromTaskId"], edge["toTaskId"]) for edge in dependency_edges}
    if not required_edges.issubset(observed_edges):
        fail("seq_143 dependency edges lost one or more critical track dependencies.")

    track_by_id = {track["taskId"]: track for track in tracks}
    for track in tracks:
        if track["eligibilityState"] != "open":
            fail(f"seq_143 unexpectedly blocked track {track['taskId']}.")
        if not track["requiredUpstreamContracts"]:
            fail(f"seq_143 track {track['taskId']} is missing required upstream contracts.")
        if not track["producedDownstreamArtifacts"]:
            fail(f"seq_143 track {track['taskId']} is missing downstream artifacts.")
        if not track["sharedPackagesOrInterfacesTouched"]:
            fail(f"seq_143 track {track['taskId']} is missing shared package/interface refs.")
        if not track["blockingMergeDependencies"]:
            fail(f"seq_143 track {track['taskId']} is missing merge gate refs.")
        if not set(track["blockingMergeDependencies"]).issubset(EXPECTED_MERGE_GATES):
            fail(f"seq_143 track {track['taskId']} references unknown merge gates.")
        if not set(track["consumedInterfaceSeamRefs"]).issubset(seam_ids):
            fail(f"seq_143 track {track['taskId']} consumes unknown seam refs.")
        if not set(track["ownedInterfaceSeamRefs"]).issubset(seam_ids):
            fail(f"seq_143 track {track['taskId']} owns unknown seam refs.")
        if track["dependsOnTasks"] and not set(track["dependsOnTasks"]).issubset(track_by_id):
            fail(f"seq_143 track {track['taskId']} depends on unknown tasks.")
        if track["allowedParallelNeighbors"] and not set(track["allowedParallelNeighbors"]).issubset(track_by_id):
            fail(f"seq_143 track {track['taskId']} allows unknown neighbor tracks.")

    matrix_by_id = {row["task_id"]: row for row in matrix_rows}
    for track in tracks:
        row = matrix_by_id[track["taskId"]]
        if row["track_family"] != track["trackFamily"]:
            fail(f"seq_143 matrix family drifted for {track['taskId']}.")
        if row["eligibility_state"] != track["eligibilityState"]:
            fail(f"seq_143 matrix state drifted for {track['taskId']}.")
        if row["owned_interface_seams"] != "; ".join(track["ownedInterfaceSeamRefs"]):
            fail(f"seq_143 matrix seam ownership drifted for {track['taskId']}.")
        if row["blocking_merge_dependencies"] != "; ".join(track["blockingMergeDependencies"]):
            fail(f"seq_143 matrix merge gates drifted for {track['taskId']}.")

    if gate["parallelInterfaceGaps"] != seams_payload["parallelInterfaceGaps"]:
        fail("seq_143 parallel interface gaps drifted between gate and seam payloads.")

    embedded_gate = extract_embedded_json(board_html, "gate-json")
    embedded_seams = extract_embedded_json(board_html, "seams-json")
    if embedded_gate != gate:
        fail("seq_143 board embedded gate JSON drifted from the machine-readable gate payload.")
    if embedded_seams != seams_payload:
        fail("seq_143 board embedded seam JSON drifted from the seam payload.")

    for marker in REQUIRED_BOARD_MARKERS:
        assert_contains(BOARD_HTML_PATH, marker)
    for fragment in [
        "--max-width: 1620px",
        "--masthead-height: 72px",
        "--left-rail-width: 300px",
        "--right-rail-width: 404px",
        "prefers-reduced-motion: reduce",
        "track_lattice",
        "Selecting a task synchronizes the lattice, merge-gate strip, inspector, and every lower table.",
    ]:
        assert_contains(BOARD_HTML_PATH, fragment)

    for fragment in [
        "filter behavior",
        "task selection synchronization",
        "keyboard navigation and landmarks",
        "responsive layout",
        "reduced-motion equivalence",
        "diagram/table parity",
        "track-family-filter",
        "state-filter",
        "dependency-edge-visual",
        "run()",
    ]:
        assert_contains(SPEC_PATH, fragment)

    for document_path, fragment in [
        (GATE_DOC_PATH, "parallel_block_open"),
        (GATE_DOC_PATH, "Hard Prerequisites"),
        (MATRIX_DOC_PATH, "Track Dependency Matrix"),
        (CLAIM_PROTOCOL_DOC_PATH, "Claim Rules"),
        (CLAIM_PROTOCOL_DOC_PATH, "PARALLEL_INTERFACE_GAP_143_AUTH_AND_EMBEDDED_ROUTE_ADAPTERS_DEFERRED"),
    ]:
        assert_contains(document_path, fragment)

    package_scripts = root_package["scripts"]
    if package_scripts.get("validate:phase1-parallel-gate") != "python3 ./tools/analysis/validate_phase1_parallel_gate.py":
        fail("package.json is missing validate:phase1-parallel-gate.")
    if "python3 ./tools/analysis/build_phase1_parallel_gate.py" not in package_scripts.get("codegen", ""):
        fail("package.json codegen is missing build_phase1_parallel_gate.py.")
    if "pnpm validate:phase1-parallel-gate" not in package_scripts.get("bootstrap", ""):
        fail("package.json bootstrap is missing validate:phase1-parallel-gate.")
    if "pnpm validate:phase1-parallel-gate" not in package_scripts.get("check", ""):
        fail("package.json check is missing validate:phase1-parallel-gate.")

    if ROOT_SCRIPT_UPDATES.get("validate:phase1-parallel-gate") != "python3 ./tools/analysis/validate_phase1_parallel_gate.py":
        fail("root_script_updates.py is missing validate:phase1-parallel-gate.")
    if "python3 ./tools/analysis/build_phase1_parallel_gate.py" not in ROOT_SCRIPT_UPDATES.get("codegen", ""):
        fail("root_script_updates.py codegen is missing build_phase1_parallel_gate.py.")
    if "pnpm validate:phase1-parallel-gate" not in ROOT_SCRIPT_UPDATES.get("bootstrap", ""):
        fail("root_script_updates.py bootstrap is missing validate:phase1-parallel-gate.")
    if "pnpm validate:phase1-parallel-gate" not in ROOT_SCRIPT_UPDATES.get("check", ""):
        fail("root_script_updates.py check is missing validate:phase1-parallel-gate.")

    playwright_scripts = playwright_package["scripts"]
    for script_name in ["build", "lint", "test", "typecheck", "e2e"]:
        if "143_phase1_gate_board.spec.js" not in playwright_scripts.get(script_name, ""):
            fail(f"tests/playwright/package.json missing 143 spec in {script_name}.")

    current_task_state = checklist_state("seq_143")
    if current_task_state not in {"-", "X"}:
        fail("seq_143 checklist row must be claimed or complete while validating.")

    print(
        json.dumps(
            {
                "taskId": "seq_143",
                "gateVerdict": gate["gateVerdict"],
                "openTrackCount": gate["openTrackCount"],
                "blockedTrackCount": gate["blockedTrackCount"],
                "mergeGateCount": gate["summary"]["mergeGateCount"],
                "seamCount": gate["summary"]["seamCount"],
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
