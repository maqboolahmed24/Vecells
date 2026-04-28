#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "analysis"))

from root_script_updates import ROOT_SCRIPT_UPDATES


REGISTRY = ROOT / "data" / "contracts" / "230_phase3_track_readiness_registry.json"
DEPENDENCY_MAP = ROOT / "data" / "contracts" / "230_phase3_dependency_interface_map.yaml"
CONSISTENCY_MATRIX = ROOT / "data" / "analysis" / "230_phase3_contract_consistency_matrix.csv"
OWNER_MATRIX = ROOT / "data" / "analysis" / "230_phase3_track_owner_matrix.csv"
GAP_LOG = ROOT / "data" / "analysis" / "230_phase3_parallel_gap_log.json"
PROMPT_GAP = ROOT / "data" / "analysis" / "PARALLEL_INTERFACE_GAP_PHASE3_PROMPT_DEPENDENCY_DRIFT.json"
LATE_PROMPT_GAP = ROOT / "data" / "analysis" / "PARALLEL_INTERFACE_GAP_PHASE3_LATE_TRACK_PROMPTS.json"
BOARD_HTML = ROOT / "docs" / "frontend" / "230_phase3_parallel_tracks_gate_board.html"
ARCH_DOC = ROOT / "docs" / "architecture" / "230_phase3_parallel_track_gate_and_dependency_map.md"
RELEASE_DOC = ROOT / "docs" / "release" / "230_phase3_parallel_open_gate.md"
API_DOC = ROOT / "docs" / "api" / "230_phase3_track_interface_registry.md"
PLAYWRIGHT_SPEC = ROOT / "tests" / "playwright" / "230_phase3_parallel_tracks_gate_board.spec.js"
PACKAGE_JSON = ROOT / "package.json"
PROMPT_252 = ROOT / "prompt" / "252.md"
PROMPT_253 = ROOT / "prompt" / "253.md"
PROMPT_254 = ROOT / "prompt" / "254.md"

EXPECTED_READY = [f"par_{task_id}" for task_id in range(231, 236)]
EXPECTED_DEFERRED = [f"par_{task_id}" for task_id in range(236, 252)]
EXPECTED_BLOCKED = [f"par_{task_id}" for task_id in range(252, 255)]
EXPECTED_TASKS = EXPECTED_READY + EXPECTED_DEFERRED + EXPECTED_BLOCKED
REQUIRED_GAP_IDS = {
    "PARALLEL_INTERFACE_GAP_PHASE3_PROMPT_DEPENDENCY_DRIFT_V1",
    "PARALLEL_INTERFACE_GAP_PHASE3_LATE_TRACK_PROMPTS_V1",
}
REQUIRED_BOARD_MARKERS = {
    "Phase3_Parallel_Gate_Board",
    "phase3_launch_grid_mark",
    "data-testid=\"summary-strip\"",
    "data-testid=\"track-rail\"",
    "data-testid=\"dependency-lattice\"",
    "data-testid=\"dependency-table\"",
    "data-testid=\"readiness-matrix\"",
    "data-testid=\"invalidation-braid\"",
    "data-testid=\"invalidation-table\"",
    "data-testid=\"launch-packet-inspector\"",
    "data-testid=\"evidence-table\"",
    "data-testid=\"gap-table\"",
    "--masthead-height: 72px",
    "--left-rail-width: 300px",
    "--right-inspector-width: 420px",
    "--max-width: 1680px",
    "#f7f8fa",
    "#eef2f6",
    "#ffffff",
    "#e8eef3",
    "#0f1720",
    "#24313d",
    "#5e6b78",
    "#0f766e",
    "#b42318",
    "#b7791f",
    "#3158e0",
    "#5b61f6",
    "prefers-reduced-motion",
    "../../data/contracts/230_phase3_track_readiness_registry.json",
    "../../data/contracts/230_phase3_dependency_interface_map.yaml",
    "../../data/analysis/230_phase3_contract_consistency_matrix.csv",
    "../../data/analysis/230_phase3_track_owner_matrix.csv",
    "../../data/analysis/230_phase3_parallel_gap_log.json",
}
REQUIRED_SPEC_MARKERS = {
    "Phase3_Parallel_Gate_Board",
    "track selection sync",
    "filter synchronization",
    "readiness state rendering",
    "blocked and deferred explanation rendering",
    "keyboard traversal and landmarks",
    "reduced-motion equivalence",
    "graph/table parity",
}
SCRIPT_NAME = "validate:phase3-parallel-gate"
SCRIPT_COMMAND = "python3 ./tools/analysis/validate_phase3_parallel_gate.py"


def fail(message: str) -> None:
    raise SystemExit(f"[phase3-parallel-gate] {message}")


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


def require_markers(label: str, text: str, markers: set[str]) -> None:
    missing = sorted(marker for marker in markers if marker not in text)
    if missing:
        fail(f"{label} missing markers: {', '.join(missing)}")


def validate_registry(registry: dict[str, Any]) -> dict[str, dict[str, Any]]:
    if registry.get("taskId") != "seq_230":
        fail("readiness registry taskId must be seq_230")
    if registry.get("visualMode") != "Phase3_Parallel_Gate_Board":
        fail("visualMode drifted")
    if registry.get("gateVerdict") != "first_wave_parallel_open":
        fail("gate verdict drifted")
    if registry.get("hardPrerequisiteTasks") != ["seq_226", "seq_227", "seq_228", "seq_229"]:
        fail("hard prerequisite task list drifted")

    tracks = registry.get("tracks", [])
    if [track.get("taskId") for track in tracks] != EXPECTED_TASKS:
        fail("track ordering must stay par_231 through par_254")

    by_id = {track["taskId"]: track for track in tracks}
    ready = [track["taskId"] for track in tracks if track["readiness"] == "ready"]
    deferred = [track["taskId"] for track in tracks if track["readiness"] == "deferred"]
    blocked = [track["taskId"] for track in tracks if track["readiness"] == "blocked"]
    if ready != EXPECTED_READY:
        fail("ready track set drifted")
    if deferred != EXPECTED_DEFERRED:
        fail("deferred track set drifted")
    if blocked != EXPECTED_BLOCKED:
        fail("blocked track set drifted")

    summary = registry.get("summary", {})
    if summary.get("readyTrackCount") != len(EXPECTED_READY):
        fail("summary readyTrackCount drifted")
    if summary.get("deferredTrackCount") != len(EXPECTED_DEFERRED):
        fail("summary deferredTrackCount drifted")
    if summary.get("blockedTrackCount") != len(EXPECTED_BLOCKED):
        fail("summary blockedTrackCount drifted")
    if summary.get("firstWaveLaunchTracks") != EXPECTED_READY:
        fail("summary firstWaveLaunchTracks drifted")

    for track in tracks:
        for key in [
            "title",
            "wave",
            "ownerTask",
            "ownerArea",
            "objectFamily",
            "objective",
            "readinessReasonCode",
            "readinessReason",
        ]:
            if not track.get(key):
                fail(f"{track['taskId']} missing {key}")
        if track["ownerTask"] != track["taskId"]:
            fail(f"{track['taskId']} must own itself in the readiness registry")
        if track["readiness"] == "ready":
            if not track.get("requiredMergeChecks"):
                fail(f"{track['taskId']} missing requiredMergeChecks")
            for dependency in track.get("launchDependsOnTasks", []):
                if dependency.startswith("par_"):
                    if by_id.get(dependency, {}).get("readiness") == "blocked":
                        fail(f"ready track {track['taskId']} depends on blocked launch track {dependency}")
                elif dependency not in registry["hardPrerequisiteTasks"] and dependency != "seq_230":
                    fail(f"ready track {track['taskId']} references unexpected launch dependency {dependency}")
        if track["readiness"] == "blocked" and "MISSING_PROMPT_BODY" not in track["readinessReasonCode"]:
            fail(f"blocked track {track['taskId']} must be blocked by missing prompt body in this gate")

    gap_ids = {item.get("gapId") for item in registry.get("collisionResolutions", []) if item.get("status")}
    if "COL_230_PROMPT_CHAIN_DRIFT" not in {item.get("collisionId") for item in registry.get("collisionResolutions", [])}:
        fail("prompt-chain drift collision resolution is missing")

    return by_id


def validate_owner_matrix(owner_rows: list[dict[str, str]], track_by_id: dict[str, dict[str, Any]]) -> None:
    if not owner_rows:
        fail("owner matrix is empty")

    owners_by_object: dict[str, str] = {}
    for row in owner_rows:
        for key in [
            "object_id",
            "object_name",
            "owning_task",
            "production_surfaces",
            "upstream_contract_refs",
            "invalidation_chain",
        ]:
            if not row.get(key):
                fail(f"owner matrix row missing {key}")
        if row["object_id"] in owners_by_object:
            fail(f"material object {row['object_id']} has more than one owner")
        owners_by_object[row["object_id"]] = row["owning_task"]
        if row["owning_task"] not in track_by_id:
            fail(f"owner matrix references unknown track {row['owning_task']}")
        if not row["mutating_tracks"]:
            fail(f"{row['object_id']} is missing mutating track list")
        if row["owning_task"] not in row["mutating_tracks"].split(";"):
            fail(f"{row['object_id']} mutating track list does not include its owner")


def validate_dependency_map(dependency_map: dict[str, Any], owner_rows: list[dict[str, str]]) -> None:
    if dependency_map.get("taskId") != "seq_230":
        fail("dependency map taskId drifted")
    launch_truth = dependency_map.get("launchDependencyTruth", {})
    if launch_truth.get("firstWaveParallelTracks") != EXPECTED_READY:
        fail("dependency map first-wave launch set drifted")
    if not launch_truth.get("supersedesPromptHeaderDrift"):
        fail("dependency map must explicitly supersede prompt-header drift")

    owner_by_name = {row["object_name"]: row["owning_task"] for row in owner_rows}
    for interface in dependency_map.get("interfaces", []):
        for key in ["interfaceId", "producerTask", "consumerTasks", "objectIds", "mutationAuthority", "requiredContracts", "productionSurfaces", "mergeCriteria"]:
            if not interface.get(key):
                fail(f"interface missing {key}")
        if interface["producerTask"] != interface["mutationAuthority"]:
            fail(f"{interface['interfaceId']} mutationAuthority drifted")
        for object_name in interface["objectIds"]:
            owner = owner_by_name.get(object_name)
            if owner and owner != interface["producerTask"]:
                fail(f"{interface['interfaceId']} claims {object_name}, but owner matrix assigns it to {owner}")

    chains = dependency_map.get("invalidationChains", [])
    if len(chains) < 4:
        fail("dependency map must publish the mandatory invalidation chains")
    for chain in chains:
        if not chain.get("chainId") or not chain.get("ownerTask") or not chain.get("invalidatesObjectIds"):
            fail("invalidation chain missing required fields")


def validate_consistency_matrix(rows: list[dict[str, str]]) -> None:
    if not rows:
        fail("consistency matrix is empty")
    by_area = {row["consistency_area"]: row for row in rows}
    for area in [
        "triage_state_and_lease_authority",
        "workspace_continuity_projection_ownership",
        "queue_order_authority",
        "duplicate_review_versus_replay",
        "decision_epoch_consequence_fence",
        "first_wave_prompt_chain_drift",
        "late_wave_prompt_publication",
    ]:
        if area not in by_area:
            fail(f"consistency area missing: {area}")
    if by_area["late_wave_prompt_publication"]["status"] != "blocked":
        fail("late-wave prompt publication row must stay blocked")


def validate_gaps(gap_log: dict[str, Any]) -> None:
    gaps = gap_log.get("gaps", [])
    if {gap.get("gapId") for gap in gaps} != REQUIRED_GAP_IDS:
        fail("gap ids drifted")
    prompt_gap = load_json(PROMPT_GAP)
    late_prompt_gap = load_json(LATE_PROMPT_GAP)
    if "authoritative launch dependency truth" not in prompt_gap.get("missingSurface", "").lower():
        fail("prompt dependency drift gap file drifted")
    if late_prompt_gap.get("tracks") != EXPECTED_BLOCKED:
        fail("late prompt gap file must enumerate par_252 to par_254")
    for prompt_file in (PROMPT_252, PROMPT_253, PROMPT_254):
        if require_file(prompt_file).strip():
            fail(f"{prompt_file.name} is no longer empty; blocked readiness must be revisited")


def validate_launch_packets(track_by_id: dict[str, dict[str, Any]]) -> None:
    for task_id in EXPECTED_READY:
        packet = load_json(ROOT / "data" / "launchpacks" / f"230_track_launch_packet_{task_id.split('_')[1]}.json")
        if packet.get("taskId") != task_id:
            fail(f"launch packet taskId drifted for {task_id}")
        for key in [
            "packetId",
            "objective",
            "authoritativeSourceSections",
            "objectOwnershipList",
            "inputContracts",
            "forbiddenLocalShortcuts",
            "exactFilesOrModulesExpectedToChange",
            "mandatoryTests",
            "expectedDownstreamDependents",
            "failClosedConditions",
            "requiredMergeChecks",
        ]:
            if not packet.get(key):
                fail(f"{task_id} launch packet missing {key}")
        track_object_set = set(track_by_id[task_id]["mutatesObjectIds"])
        if set(packet["objectOwnershipList"]) != track_object_set:
            fail(f"{task_id} launch packet ownership list drifted from readiness registry")


def validate_docs_and_board() -> None:
    for path in [ARCH_DOC, RELEASE_DOC, API_DOC]:
        text = require_file(path)
        if "seq_230" not in text and "230" not in text:
            fail(f"{path.relative_to(ROOT)} does not appear to describe seq_230")
    board_text = require_file(BOARD_HTML).lower()
    require_markers("board html", board_text, {marker.lower() for marker in REQUIRED_BOARD_MARKERS})


def validate_playwright_spec() -> None:
    spec_text = require_file(PLAYWRIGHT_SPEC)
    require_markers("playwright spec", spec_text, REQUIRED_SPEC_MARKERS)


def validate_scripts() -> None:
    package_data = load_json(PACKAGE_JSON)
    if package_data.get("scripts", {}).get(SCRIPT_NAME) != SCRIPT_COMMAND:
        fail("package.json missing validate:phase3-parallel-gate")
    if ROOT_SCRIPT_UPDATES.get(SCRIPT_NAME) != SCRIPT_COMMAND:
        fail("root_script_updates missing validate:phase3-parallel-gate")


def main() -> None:
    track_by_id = validate_registry(load_json(REGISTRY))
    owner_rows = load_csv(OWNER_MATRIX)
    validate_owner_matrix(owner_rows, track_by_id)
    validate_dependency_map(load_json(DEPENDENCY_MAP), owner_rows)
    validate_consistency_matrix(load_csv(CONSISTENCY_MATRIX))
    validate_gaps(load_json(GAP_LOG))
    validate_launch_packets(track_by_id)
    validate_docs_and_board()
    validate_playwright_spec()
    validate_scripts()
    print("seq_230 phase3 parallel gate artifacts validated")


if __name__ == "__main__":
    main()
