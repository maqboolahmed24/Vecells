#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"

GROUPS_PATH = DATA_DIR / "parallel_foundation_track_groups.json"
ELIGIBILITY_PATH = DATA_DIR / "parallel_track_eligibility.csv"
EDGES_PATH = DATA_DIR / "parallel_track_prerequisite_edges.csv"
SEAMS_PATH = DATA_DIR / "parallel_track_shared_seams.json"
VERDICT_PATH = DATA_DIR / "parallel_foundation_gate_verdict.json"


def read_json(path: Path):
    return json.loads(path.read_text())


def read_csv(path: Path):
    with path.open() as handle:
        return list(csv.DictReader(handle))


groups = read_json(GROUPS_PATH)
rows = read_csv(ELIGIBILITY_PATH)
edges = read_csv(EDGES_PATH)
seams = read_json(SEAMS_PATH)
verdict = read_json(VERDICT_PATH)

assert groups["task_id"] == "seq_061"
assert verdict["gateId"] == "GATE_P0_PARALLEL_FOUNDATION_OPEN"
assert verdict["gateVerdict"] == "conditional"
assert groups["summary"]["candidate_track_count"] == 65
assert groups["summary"]["eligible_track_count"] == 43
assert groups["summary"]["conditional_track_count"] == 21
assert groups["summary"]["blocked_track_count"] == 0
assert len(rows) == 65
assert len(groups["trackGroups"]) == 4
assert len(groups["trackShards"]) == 7
assert seams["summary"]["shared_seam_count"] == 12
assert seams["summary"]["interface_stub_count"] == 11
assert len(verdict["eligibleTrackTaskRefs"]) == 43
assert len(verdict["conditionalTrackTaskRefs"]) == 21
assert len(verdict["blockedTrackTaskRefs"]) == 0
assert len(verdict["requiredSharedSeamRefs"]) == 12

row_map = {row["trackTaskId"]: row for row in rows}
assert row_map["par_062"]["claimableMode"] == "eligible"
assert row_map["par_077"]["claimableMode"] == "conditional"
assert row_map["par_084"]["claimableMode"] == "eligible"
assert row_map["par_094"]["claimableMode"] == "conditional"
assert row_map["par_103"]["claimableMode"] == "eligible"
assert row_map["par_115"]["claimableMode"] == "conditional"
assert row_map["par_121"]["claimableMode"] == "eligible"

frontend_rows = [row for row in rows if row["trackGroup"] == "frontend_shells"]
assert len(frontend_rows) == 18
for row in frontend_rows:
    packages = row["requiredSharedPackageRefs"]
    schemas = row["requiredSchemaRefs"]
    assert "@vecells/design-system" in packages
    assert "schema::frontend-contract-manifest" in schemas
    assert "schema::release-contract-verification-matrix" in schemas
    assert "schema::recovery-control-posture" in schemas

backend_rows = [row for row in rows if row["trackGroup"] == "backend_kernel"]
assert len(backend_rows) == 22
for row in backend_rows:
    packages = row["requiredSharedPackageRefs"]
    schemas = row["requiredSchemaRefs"]
    assert "@vecells/domain-kernel" in packages
    assert "@vecells/event-contracts" in packages
    assert "schema::route-intent-binding" in schemas
    assert "schema::command-settlement-record" in schemas
    assert "schema::adapter-contract-profile" in schemas
    assert "schema::recovery-control-posture" in schemas

must_be_simulator_backed = {
    "par_068",
    "par_069",
    "par_074",
    "par_083",
    "par_090",
    "par_092",
    "par_098",
    "par_101",
    "par_102",
    "par_115",
    "par_116",
    "par_117",
    "par_118",
    "par_119",
    "par_120",
    "par_123",
    "par_124",
}
for task_id in must_be_simulator_backed:
    assert row_map[task_id]["requiredSimulatorRefs"], task_id
    assert "live_" not in row_map[task_id]["requiredSimulatorRefs"].lower(), task_id

eligible_rows = [row for row in rows if row["claimableMode"] == "eligible"]
for row in eligible_rows:
    assert row["requiredSeqTaskRefs"], row["trackTaskId"]
    assert row["requiredSharedPackageRefs"], row["trackTaskId"]
    assert row["requiredSchemaRefs"], row["trackTaskId"]
    assert row["requiredSharedSeamRefs"], row["trackTaskId"]

conditional_rows = [row for row in rows if row["claimableMode"] == "conditional"]
for row in conditional_rows:
    assert row["parallelInterfaceStubRefs"], row["trackTaskId"]
    assert row["blockingReasonRefs"], row["trackTaskId"]

edge_task_refs = {edge["trackTaskId"] for edge in edges}
assert edge_task_refs == set(row_map)

print("seq_061 parallel foundation gate validation passed")
