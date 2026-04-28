#!/usr/bin/env python3
from __future__ import annotations

import csv
import html
import json
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "analysis"))

from root_script_updates import ROOT_SCRIPT_UPDATES


TASK_ID = "seq_281"
CONTRACT_VERSION = "281.phase4.parallel-gate.v1"
VISUAL_MODE = "Phase4_Parallel_Gate_Board"
SCRIPT_NAME = "validate:281-phase4-parallel-gate"
SCRIPT_VALUE = "python3 ./tools/analysis/validate_phase4_parallel_gate.py"

ARCHITECTURE_PATH = ROOT / "docs" / "architecture" / "281_phase4_parallel_track_gate_and_dependency_map.md"
RELEASE_PATH = ROOT / "docs" / "release" / "281_phase4_parallel_open_gate.md"
API_DOC_PATH = ROOT / "docs" / "api" / "281_phase4_track_interface_registry.md"
BOARD_PATH = ROOT / "docs" / "frontend" / "281_phase4_parallel_tracks_gate_board.html"
READINESS_PATH = ROOT / "data" / "contracts" / "281_phase4_track_readiness_registry.json"
DEPENDENCY_MAP_PATH = ROOT / "data" / "contracts" / "281_phase4_dependency_interface_map.yaml"
VISUAL_NOTES_PATH = ROOT / "data" / "analysis" / "281_visual_reference_notes.json"
CONSISTENCY_PATH = ROOT / "data" / "analysis" / "281_phase4_contract_consistency_matrix.csv"
OWNER_MATRIX_PATH = ROOT / "data" / "analysis" / "281_phase4_track_owner_matrix.csv"
GAP_LOG_PATH = ROOT / "data" / "analysis" / "281_phase4_parallel_gap_log.json"
LAUNCH_282_PATH = ROOT / "data" / "launchpacks" / "281_track_launch_packet_282.json"
LAUNCH_283_PATH = ROOT / "data" / "launchpacks" / "281_track_launch_packet_283.json"
PLAYWRIGHT_PATH = ROOT / "tests" / "playwright" / "281_phase4_parallel_tracks_gate_board.spec.ts"
BUILDER_PATH = ROOT / "tools" / "analysis" / "build_281_phase4_parallel_gate_pack.py"
PACKAGE_PATH = ROOT / "package.json"
ROOT_SCRIPT_UPDATES_PATH = ROOT / "tools" / "analysis" / "root_script_updates.py"
INTERFACE_GAP_FILES = [
    ROOT / "data" / "analysis" / "PHASE4_PARALLEL_INTERFACE_GAP_EVENT_OWNER_DRIFT.json",
    ROOT / "data" / "analysis" / "PHASE4_PARALLEL_INTERFACE_GAP_WAITLIST_FALLBACK_OWNER_MAP.json",
    ROOT / "data" / "analysis" / "PHASE4_PARALLEL_INTERFACE_GAP_LIVE_PROVIDER_AND_FETCH_ADOPTION.json",
]

EXPECTED_READY = ["par_282", "par_283"]
EXPECTED_STATUS_COUNTS = {"ready": 2, "blocked": 18, "deferred": 9}
EXPECTED_TRACK_COUNT = 29
EXPECTED_TRACK_STATUSES = {
    **{f"par_{index}": "ready" if index in {282, 283} else "blocked" for index in range(282, 302)},
    **{f"par_{index}": "deferred" for index in range(302, 304)},
    **{f"seq_{index}": "deferred" for index in range(304, 311)},
}

REQUIRED_VISUAL_SOURCES = {
    "Playwright Trace Viewer",
    "Playwright Visual comparisons",
    "Playwright Accessibility testing",
    "Linear changelog",
    "Vercel Academy nested layouts",
    "Vercel dashboard navigation",
    "IBM Carbon data table usage",
    "NHS Service Manual content",
    "NHS Service Manual typography",
    "GP Connect Appointment Management",
}

REQUIRED_BOARD_TEST_IDS = [
    "Phase4ParallelGateBoard",
    "GateSummaryStrip",
    "StatusFilter",
    "OwnerFilter",
    "ObjectFamilyFilter",
    "ChainFilter",
    "TrackRail",
    "DependencyLattice",
    "DependencyLatticeTable",
    "ReadinessMatrixTable",
    "InvalidationBraidTable",
    "LaunchPacketInspector",
    "EvidenceTable",
    "GapTable",
]

REQUIRED_BOARD_TOKENS = [
    'data-visual-mode="Phase4_Parallel_Gate_Board"',
    "grid-template-columns: 300px minmax(0, 1fr) 420px;",
    "max-width: 1680px;",
    "--canvas: #F7F8FA;",
    "--shell: #EEF2F6;",
    "--accent-ready: #0F766E;",
    "--accent-blocked: #B42318;",
    "--accent-deferred: #B7791F;",
    "--accent-dependency: #3158E0;",
    "--accent-risk: #5B61F6;",
]

REQUIRED_DOC_TOKENS = {
    ARCHITECTURE_PATH: [
        "Only `par_282` and `par_283` are approved to mutate new production code surfaces immediately.",
        "Event owner overrides",
        "No later track may fork workflow state vocabulary.",
    ],
    RELEASE_PATH: [
        "This is not a symbolic launch.",
        "Only `282` and `283` are approved to mutate new production code surfaces immediately.",
        "Future prompts must consume the launch packets",
    ],
    API_DOC_PATH: [
        "Object ownership",
        "Event owner overrides",
        "Production code surface roots by track",
    ],
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


def parse_board_payload(html_text: str):
    match = re.search(r'<script id="atlas-data" type="application/json">(.*?)</script>', html_text, re.S)
    require(match is not None, "BOARD_ATLAS_DATA_MISSING")
    payload = html.unescape(match.group(1))
    return json.loads(payload)


def check_files() -> None:
    for path in [
        ARCHITECTURE_PATH,
        RELEASE_PATH,
        API_DOC_PATH,
        BOARD_PATH,
        READINESS_PATH,
        DEPENDENCY_MAP_PATH,
        VISUAL_NOTES_PATH,
        CONSISTENCY_PATH,
        OWNER_MATRIX_PATH,
        GAP_LOG_PATH,
        LAUNCH_282_PATH,
        LAUNCH_283_PATH,
        PLAYWRIGHT_PATH,
        BUILDER_PATH,
        ROOT_SCRIPT_UPDATES_PATH,
        PACKAGE_PATH,
        *INTERFACE_GAP_FILES,
    ]:
        require(path.exists(), f"MISSING_REQUIRED_FILE:{path}")


def check_docs() -> None:
    for path, tokens in REQUIRED_DOC_TOKENS.items():
        text = read_text(path)
        for token in tokens:
            require(token in text, f"DOC_TOKEN_MISSING:{path.name}:{token}")


def check_visual_notes() -> None:
    payload = load_json(VISUAL_NOTES_PATH)
    require(payload["taskId"] == TASK_ID, "VISUAL_NOTES_TASK_ID_DRIFT")
    names = {entry["name"] for entry in payload["sources"]}
    missing = REQUIRED_VISUAL_SOURCES - names
    require(not missing, f"VISUAL_NOTE_SOURCE_MISSING:{sorted(missing)}")
    for source in payload["sources"]:
        require(source["borrowed"], f"VISUAL_NOTE_EMPTY_BORROWED:{source['name']}")
        require(source["rejected"], f"VISUAL_NOTE_EMPTY_REJECTED:{source['name']}")


def check_registry() -> dict:
    payload = load_json(READINESS_PATH)
    require(payload["taskId"] == TASK_ID, "READINESS_TASK_ID_DRIFT")
    require(payload["contractVersion"] == CONTRACT_VERSION, "READINESS_CONTRACT_VERSION_DRIFT")
    require(payload["visualMode"] == VISUAL_MODE, "READINESS_VISUAL_MODE_DRIFT")
    require(payload["firstWaveTrackIds"] == EXPECTED_READY, "FIRST_WAVE_TRACKS_DRIFT")
    require(payload["statusCounts"] == EXPECTED_STATUS_COUNTS, "STATUS_COUNTS_DRIFT")
    require(payload["trackCount"] == EXPECTED_TRACK_COUNT, "TRACK_COUNT_DRIFT")

    tracks = payload["tracks"]
    require(len(tracks) == EXPECTED_TRACK_COUNT, "TRACK_ARRAY_COUNT_DRIFT")
    index = {track["trackId"]: track for track in tracks}
    require(sorted(index) == sorted(EXPECTED_TRACK_STATUSES), "TRACK_ID_SET_DRIFT")
    for track_id, expected_status in EXPECTED_TRACK_STATUSES.items():
        require(index[track_id]["status"] == expected_status, f"TRACK_STATUS_DRIFT:{track_id}")

    require(index["par_282"]["parallelSafeWith"] == ["par_283"], "282_PARALLEL_HANDSHAKE_DRIFT")
    require(index["par_283"]["parallelSafeWith"] == ["par_282"], "283_PARALLEL_HANDSHAKE_DRIFT")
    require(index["par_284"]["upstreamTrackRefs"] == ["par_282", "par_283"], "284_UPSTREAM_DRIFT")
    require(index["par_285"]["upstreamTrackRefs"] == ["par_284"], "285_UPSTREAM_DRIFT")
    require(index["par_286"]["upstreamTrackRefs"] == ["par_285"], "286_UPSTREAM_DRIFT")
    require(index["par_287"]["upstreamTrackRefs"] == ["par_286"], "287_UPSTREAM_DRIFT")
    require(index["par_290"]["upstreamTrackRefs"] == ["par_286", "par_287"], "290_UPSTREAM_DRIFT")
    require(index["seq_304"]["status"] == "deferred", "304_STATUS_DRIFT")
    require(index["seq_310"]["status"] == "deferred", "310_STATUS_DRIFT")

    return payload


def check_dependency_map(registry: dict) -> None:
    text = read_text(DEPENDENCY_MAP_PATH)
    require(f"taskId: {TASK_ID}" in text, "DEPENDENCY_MAP_TASK_ID_DRIFT")
    require(f"contractVersion: {CONTRACT_VERSION}" in text, "DEPENDENCY_MAP_VERSION_DRIFT")
    require(text.count("trackId:") == EXPECTED_TRACK_COUNT, "DEPENDENCY_MAP_TRACK_COUNT_DRIFT")
    for track_id in EXPECTED_READY:
        require(track_id in text, f"DEPENDENCY_MAP_READY_TRACK_MISSING:{track_id}")
    for chain in registry["invalidationChains"]:
        require(chain["chainId"] in text, f"DEPENDENCY_MAP_CHAIN_MISSING:{chain['chainId']}")


def check_owner_matrix() -> None:
    rows = load_csv(OWNER_MATRIX_PATH)
    require(len(rows) >= 40, "OWNER_MATRIX_TOO_SMALL")
    artifact_ids = [row["artifactId"] for row in rows]
    require(len(artifact_ids) == len(set(artifact_ids)), "OWNER_MATRIX_DUPLICATE_ARTIFACT")
    row_index = {row["artifactId"]: row for row in rows}
    expected_owners = {
        "BookingCase": "par_282",
        "BookingCapabilityResolution": "par_283",
        "SlotSetSnapshot": "par_284",
        "OfferSession": "par_285",
        "ReservationTruthProjection": "par_286",
        "BookingTransaction": "par_287",
        "BookingManageSettlement": "par_288",
        "ReminderPlan": "par_289",
        "WaitlistEntry": "par_290",
        "AssistedBookingSession": "par_291",
        "PatientAppointmentWorkspaceProjection": "par_293",
        "PatientAppointmentManageProjection": "par_297",
        "PatientAppointmentArtifactProjection": "par_303",
        "ProviderSandboxConfiguration": "seq_304",
        "Phase4BookingExitGate": "seq_310",
    }
    for artifact_id, owner in expected_owners.items():
        require(row_index[artifact_id]["ownerTrack"] == owner, f"OWNER_MATRIX_OWNER_DRIFT:{artifact_id}")


def check_consistency_matrix() -> None:
    rows = load_csv(CONSISTENCY_PATH)
    require(len(rows) >= 20, "CONSISTENCY_MATRIX_TOO_SMALL")
    row_index = {row["rowId"]: row for row in rows}
    require(row_index["CC_281_017"]["ownerTrack"] == "par_284", "SLOTS_FETCHED_REMAP_DRIFT")
    require(row_index["CC_281_018"]["ownerTrack"] == "par_285", "OFFERS_CREATED_REMAP_DRIFT")
    require(row_index["CC_281_019"]["ownerTrack"] == "par_289", "REMINDERS_REMAP_DRIFT")
    require(row_index["CC_281_020"]["consistencyStatus"] == "deferred_by_scope", "PROVIDER_SCOPE_STATUS_DRIFT")


def check_gap_logs() -> None:
    gap_log = load_json(GAP_LOG_PATH)
    require(gap_log["taskId"] == TASK_ID, "GAP_LOG_TASK_ID_DRIFT")
    require(len(gap_log["gaps"]) == 4, "GAP_LOG_COUNT_DRIFT")
    for path in INTERFACE_GAP_FILES:
        payload = load_json(path)
        for field in ["taskId", "missingSurface", "expectedOwnerTask", "temporaryFallback", "riskIfUnresolved", "followUpAction"]:
            require(field in payload, f"INTERFACE_GAP_FIELD_MISSING:{path.name}:{field}")


def check_event_override_map(registry: dict) -> None:
    overrides = {row["eventName"]: row for row in registry["eventOwnerOverrides"]}
    require(overrides["booking.slots.fetched"]["gateOwner"] == "par_284", "EVENT_OWNER_SLOTS_FETCHED_DRIFT")
    require(overrides["booking.offers.created"]["gateOwner"] == "par_285", "EVENT_OWNER_OFFERS_CREATED_DRIFT")
    require(overrides["booking.reminders.scheduled"]["gateOwner"] == "par_289", "EVENT_OWNER_REMINDERS_DRIFT")
    require(overrides["booking.confirmation.truth.updated"]["gateOwner"] == "par_292", "EVENT_OWNER_CONFIRMATION_TRUTH_DRIFT")
    require(
        sum(1 for row in overrides.values() if row["status"] == "collision_remediated") >= 10,
        "EVENT_OWNER_REMEDIATION_COUNT_TOO_LOW",
    )


def check_launch_packets() -> None:
    for path, track_id in [(LAUNCH_282_PATH, "par_282"), (LAUNCH_283_PATH, "par_283")]:
        payload = load_json(path)
        require(payload["taskId"] == track_id, f"LAUNCH_PACKET_TASK_ID_DRIFT:{path.name}")
        for field in [
            "objective",
            "authoritativeSourceSections",
            "objectOwnership",
            "inputContracts",
            "forbiddenLocalShortcuts",
            "expectedFiles",
            "mandatoryTests",
            "expectedDownstreamDependents",
            "failClosedConditions",
            "currentGapsAndTemporarySeams",
            "mergeCriteria",
        ]:
            require(field in payload and payload[field], f"LAUNCH_PACKET_FIELD_MISSING:{path.name}:{field}")
    packet_282 = load_json(LAUNCH_282_PATH)
    packet_283 = load_json(LAUNCH_283_PATH)
    require(packet_282["parallelHandshake"]["safeWith"] == ["par_283"], "LAUNCH_282_HANDSHAKE_DRIFT")
    require(packet_283["parallelHandshake"]["safeWith"] == ["par_282"], "LAUNCH_283_HANDSHAKE_DRIFT")


def check_board(registry: dict) -> None:
    text = read_text(BOARD_PATH)
    for token in REQUIRED_BOARD_TOKENS:
        require(token in text, f"BOARD_TOKEN_MISSING:{token}")
    for test_id in REQUIRED_BOARD_TEST_IDS:
        require(f'data-testid="{test_id}"' in text or f"data-testid='{test_id}'" in text, f"BOARD_TEST_ID_MISSING:{test_id}")

    payload = parse_board_payload(text)
    require(payload["taskId"] == TASK_ID, "BOARD_PAYLOAD_TASK_ID_DRIFT")
    require(payload["visualMode"] == VISUAL_MODE, "BOARD_PAYLOAD_VISUAL_MODE_DRIFT")
    require(payload["firstWaveTrackIds"] == EXPECTED_READY, "BOARD_FIRST_WAVE_DRIFT")
    require(len(payload["tracks"]) == EXPECTED_TRACK_COUNT, "BOARD_TRACK_COUNT_DRIFT")
    require(len(payload["summaryBands"]) == 4, "BOARD_SUMMARY_BAND_COUNT_DRIFT")
    require(len(payload["invalidationChains"]) == len(registry["invalidationChains"]), "BOARD_CHAIN_COUNT_DRIFT")
    require(len(payload["consistencyRows"]) >= 20, "BOARD_CONSISTENCY_COUNT_DRIFT")
    allowed_waves = {"first_wave", "backend_wave", "frontend_wave", "deferred_activation", "deferred_assurance"}
    for track in payload["tracks"]:
        require("wave" in track, f"BOARD_TRACK_WAVE_MISSING:{track.get('trackId', 'unknown')}")
        require(track["wave"] in allowed_waves, f"BOARD_TRACK_WAVE_DRIFT:{track['trackId']}:{track['wave']}")
    require("function render()" in text, "BOARD_RENDER_FUNCTION_MISSING")


def check_scripts() -> None:
    package_payload = load_json(PACKAGE_PATH)
    require(package_payload["scripts"].get(SCRIPT_NAME) == SCRIPT_VALUE, "PACKAGE_SCRIPT_DRIFT")
    require(ROOT_SCRIPT_UPDATES.get(SCRIPT_NAME) == SCRIPT_VALUE, "ROOT_SCRIPT_UPDATE_DRIFT")
    root_script_text = read_text(ROOT_SCRIPT_UPDATES_PATH)
    require(SCRIPT_NAME in root_script_text, "ROOT_SCRIPT_TEXT_MISSING")


def main() -> None:
    check_files()
    check_docs()
    check_visual_notes()
    registry = check_registry()
    check_dependency_map(registry)
    check_owner_matrix()
    check_consistency_matrix()
    check_gap_logs()
    check_event_override_map(registry)
    check_launch_packets()
    check_board(registry)
    check_scripts()


if __name__ == "__main__":
    main()
