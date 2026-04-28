#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from collections import defaultdict
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
PROMPT_DIR = ROOT / "prompt"
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "programme"

CHECKLIST_PATH = PROMPT_DIR / "checklist.md"

REQUIRED_INPUTS = {
    "requirement_registry": DATA_DIR / "requirement_registry.jsonl",
    "product_scope": DATA_DIR / "product_scope_matrix.json",
    "external_dependencies": DATA_DIR / "external_dependencies.json",
    "cross_phase_conformance_seed": DATA_DIR / "cross_phase_conformance_seed.json",
    "adr_index": DATA_DIR / "adr_index.json",
}

DELIVERABLES = [
    DOCS_DIR / "17_programme_milestones_and_gate_model.md",
    DOCS_DIR / "17_parallel_track_plan.md",
    DOCS_DIR / "17_merge_gate_policy.md",
    DOCS_DIR / "17_phase0_subphase_execution_plan.md",
    DOCS_DIR / "17_critical_path_and_long_lead_plan.md",
    DOCS_DIR / "17_programme_decision_log.md",
    DOCS_DIR / "17_programme_control_tower.html",
    DOCS_DIR / "17_programme_dependency_graph.mmd",
    DOCS_DIR / "17_programme_timeline.mmd",
    DATA_DIR / "programme_milestones.json",
    DATA_DIR / "task_to_milestone_map.csv",
    DATA_DIR / "milestone_dependency_edges.csv",
    DATA_DIR / "parallel_track_matrix.csv",
    DATA_DIR / "merge_gate_matrix.csv",
    DATA_DIR / "critical_path_summary.json",
]

HTML_MARKERS = [
    'data-testid="programme-summary-band"',
    'data-testid="milestone-filter-rail"',
    'data-testid="timeline-canvas"',
    'data-testid="dependency-graph-canvas"',
    'data-testid="milestone-table"',
    'data-testid="merge-gate-table"',
    'data-testid="programme-inspector"',
    "data-milestone-id",
    "data-gate-id",
    "data-critical-path",
    "data-baseline-scope",
]

REQUIRED_GATES = {
    "GATE_PLAN_EXTERNAL_ENTRY",
    "GATE_EXTERNAL_TO_FOUNDATION",
    "GATE_P0_PARALLEL_FOUNDATION_OPEN",
    "GATE_P0_LONG_LEAD_ASSURANCE_MERGE",
    "GATE_P0_EXIT",
    "GATE_P1_PARALLEL_MERGE",
    "GATE_P2_PARALLEL_MERGE",
    "GATE_XC_PARALLEL_MERGE",
    "GATE_P3_PARALLEL_MERGE",
    "GATE_P4_PARALLEL_MERGE",
    "GATE_P5_PARALLEL_MERGE",
    "GATE_P6_PARALLEL_MERGE",
    "GATE_P8_PARALLEL_MERGE",
    "GATE_P9_PARALLEL_MERGE",
    "GATE_CURRENT_BASELINE_CONFORMANCE",
    "GATE_RELEASE_READINESS",
    "GATE_WAVE1_OBSERVATION",
    "GATE_BAU_TRANSFER",
}

REQUIRED_PHASE0_SUBPHASES = {"0A", "0B", "0C", "0D", "0E", "0F", "0G"}
REQUIRED_LONG_LEAD_MILESTONES = {
    "MS_EXT_NHS_LOGIN_ONBOARDING",
    "MS_EXT_IM1_SCAL_READINESS",
    "MS_EXT_MESH_ACCESS",
    "MS_EXT_COMMS_AND_SCAN_VENDORS",
    "MS_EXT_PROVIDER_PATHS_AND_EVIDENCE",
    "MS_P0_0G_DCB0129_SAFETY_CASE",
    "MS_P0_0G_DSPT_READINESS",
    "MS_P0_0G_IM1_SCAL_ASSURANCE",
    "MS_P0_0G_NHS_LOGIN_ONBOARDING_EVIDENCE",
}
REQUIRED_CURRENT_SCORECARD_REF = "CROSS_PHASE_CONFORMANCE_SCORECARD_CURRENT_BASELINE"
REQUIRED_DEFERRED_SCORECARD_REF = "CROSS_PHASE_CONFORMANCE_SCORECARD_FULL_PROGRAMME"


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def load_json(path: Path) -> Any:
    return json.loads(path.read_text())


def load_csv(path: Path) -> list[dict[str, str]]:
    with path.open() as handle:
        return list(csv.DictReader(handle))


def load_jsonl_ids(path: Path) -> set[str]:
    ids: set[str] = set()
    for line in path.read_text().splitlines():
        line = line.strip()
        if line:
            payload = json.loads(line)
            ids.add(payload["requirement_id"])
    return ids


def ensure_prerequisites() -> dict[str, Any]:
    for name, path in REQUIRED_INPUTS.items():
        assert_true(path.exists(), f"Missing seq_017 prerequisite {name}: {path}")

    product_scope = load_json(REQUIRED_INPUTS["product_scope"])
    baseline = set(product_scope.get("baseline_phases", []))
    deferred = set(product_scope.get("deferred_phases", []))
    assert_true("phase_7" not in baseline, "seq_017 baseline drift: phase_7 entered the current baseline")
    assert_true("phase_7" in deferred, "seq_017 deferred-scope drift: phase_7 left the deferred baseline")

    return {
        "requirement_ids": load_jsonl_ids(REQUIRED_INPUTS["requirement_registry"]),
        "dependency_ids": {row["dependency_id"] for row in load_json(REQUIRED_INPUTS["external_dependencies"])["dependencies"]},
        "conformance_phase_ids": {row["phase_id"] for row in load_json(REQUIRED_INPUTS["cross_phase_conformance_seed"])["rows"]},
        "adr_count": len(load_json(REQUIRED_INPUTS["adr_index"])["adrs"]),
    }


def ensure_deliverables() -> None:
    missing = [str(path) for path in DELIVERABLES if not path.exists()]
    assert_true(not missing, "Missing seq_017 deliverables:\n" + "\n".join(missing))


def load_payloads() -> dict[str, Any]:
    programme = load_json(DATA_DIR / "programme_milestones.json")
    task_rows = load_csv(DATA_DIR / "task_to_milestone_map.csv")
    edge_rows = load_csv(DATA_DIR / "milestone_dependency_edges.csv")
    track_rows = load_csv(DATA_DIR / "parallel_track_matrix.csv")
    gate_rows = load_csv(DATA_DIR / "merge_gate_matrix.csv")
    critical_path = load_json(DATA_DIR / "critical_path_summary.json")
    html = (DOCS_DIR / "17_programme_control_tower.html").read_text()
    return {
        "programme": programme,
        "task_rows": task_rows,
        "edge_rows": edge_rows,
        "track_rows": track_rows,
        "gate_rows": gate_rows,
        "critical_path": critical_path,
        "html": html,
    }


def validate_payload(prereqs: dict[str, Any], payloads: dict[str, Any]) -> None:
    programme = payloads["programme"]
    milestone_rows = programme["milestones"]
    gate_rows_json = programme["merge_gates"]
    phase0_rows = programme["phase0_subphases"]
    task_rows = payloads["task_rows"]
    edge_rows = payloads["edge_rows"]
    track_rows = payloads["track_rows"]
    gate_rows = payloads["gate_rows"]
    critical_path = payloads["critical_path"]
    html = payloads["html"]

    assert_true(programme["summary"]["milestone_count"] == len(milestone_rows), "Programme summary milestone count is wrong")
    assert_true(programme["summary"]["gate_count"] == len(gate_rows_json), "Programme summary gate count is wrong")
    assert_true(programme["summary"]["parallel_track_count"] == len(track_rows), "Programme summary parallel-track count is wrong")

    milestone_ids = [row["milestone_id"] for row in milestone_rows]
    gate_ids = {row["merge_gate_id"] for row in gate_rows_json}
    assert_true(len(milestone_ids) == len(set(milestone_ids)), "Duplicate milestone ids detected")
    assert_true(len(gate_rows_json) == len(gate_ids), "Duplicate gate ids detected")
    assert_true(REQUIRED_GATES.issubset(gate_ids), f"Missing required gates: {sorted(REQUIRED_GATES - gate_ids)}")

    task_orders = [int(row["task_order"]) for row in task_rows]
    assert_true(task_orders == list(range(1, 490)), "Task map does not preserve canonical checklist order")
    assert_true(len(task_rows) == 489, "Task-to-milestone map must contain all 489 checklist tasks")

    grouped_task_ids = defaultdict(list)
    for row in task_rows:
        grouped_task_ids[row["milestone_id"]].append(row["task_id"])
    for milestone in milestone_rows:
        assert_true(milestone["source_task_refs"] == grouped_task_ids[milestone["milestone_id"]], f"Task map diverges for {milestone['milestone_id']}")

    all_requirement_ids = prereqs["requirement_ids"]
    for milestone in milestone_rows:
        for requirement_id in milestone["required_requirement_ids"]:
            assert_true(requirement_id in all_requirement_ids, f"{milestone['milestone_id']} references unknown requirement id {requirement_id}")
        assert_true(
            milestone["milestone_class"] in {
                "planning",
                "dependency_readiness",
                "foundation",
                "phase_delivery",
                "cross_phase_control",
                "release_gate",
                "assurance_gate",
                "deferred_channel",
            },
            f"{milestone['milestone_id']} uses an invalid milestone class",
        )
        assert_true(
            milestone["baseline_scope"] in {"current", "deferred", "optional"},
            f"{milestone['milestone_id']} uses an invalid baseline scope",
        )
        assert_true(
            milestone["critical_path_state"] in {"on_path", "near_path", "off_path"},
            f"{milestone['milestone_id']} uses an invalid critical-path state",
        )
        assert_true(
            milestone["status_model"] in {"not_started", "enabled", "blocked", "merge_ready", "complete"},
            f"{milestone['milestone_id']} uses an invalid status model",
        )
        if milestone["baseline_scope"] == "current":
            assert_true(
                "MS_P7" not in " ".join(milestone["required_artifact_refs"]),
                f"{milestone['milestone_id']} uses deferred Phase 7 artifacts as current-baseline proof",
            )
        if milestone["milestone_class"] in {"release_gate", "assurance_gate"}:
            assert_true(milestone["conformance_row_refs"], f"{milestone['milestone_id']} lacks conformance refs for a gate milestone")

    for gate in gate_rows_json:
        assert_true(gate["required_artifact_refs"], f"{gate['merge_gate_id']} has no required artifact refs")
        for dep_id in gate["required_dependency_refs"]:
            assert_true(dep_id in prereqs["dependency_ids"], f"{gate['merge_gate_id']} references unknown dependency {dep_id}")
        assert_true(
            gate["gate_type"] in {
                "seq_release",
                "par_block_merge",
                "external_readiness",
                "phase_entry",
                "phase_exit",
                "programme_conformance",
            },
            f"{gate['merge_gate_id']} uses an invalid gate type",
        )

    required_phase_refs = {f"PHASE_CONFORMANCE_ROW_{phase_id.upper()}" for phase_id in prereqs["conformance_phase_ids"]}
    all_conformance_refs = {
        ref
        for milestone in milestone_rows
        for ref in milestone["conformance_row_refs"]
    } | {
        ref
        for gate in gate_rows_json
        for ref in gate["required_conformance_refs"]
    }
    assert_true(REQUIRED_CURRENT_SCORECARD_REF in all_conformance_refs, "Current-baseline scorecard ref is missing")
    assert_true(REQUIRED_DEFERRED_SCORECARD_REF in all_conformance_refs, "Full-programme scorecard ref is missing")
    assert_true(required_phase_refs.issubset(all_conformance_refs), "At least one phase conformance row ref is missing")

    phase0_codes = {row["subphase_code"] for row in phase0_rows}
    assert_true(REQUIRED_PHASE0_SUBPHASES == phase0_codes, f"Phase 0 subphases are incomplete: {sorted(REQUIRED_PHASE0_SUBPHASES - phase0_codes)}")
    for row in phase0_rows:
        assert_true(row["hard_gate_ref"] in gate_ids, f"Phase 0 subphase {row['subphase_code']} references unknown gate {row['hard_gate_ref']}")
        assert_true(row["task_refs"], f"Phase 0 subphase {row['subphase_code']} has no task refs")

    track_ids = {row["track_id"] for row in track_rows}
    for milestone in milestone_rows:
        for track_id in milestone["allowed_parallel_track_refs"]:
            assert_true(track_id in track_ids, f"{milestone['milestone_id']} references unknown parallel track {track_id}")

    assert_true(REQUIRED_LONG_LEAD_MILESTONES.issubset(set(milestone_ids)), "Long-lead dependency milestones are missing")
    assert_true(set(critical_path["long_lead_milestone_ids"]).issuperset(REQUIRED_LONG_LEAD_MILESTONES), "Critical-path summary omits required long-lead milestones")

    edge_pairs = {(row["from_milestone_id"], row["to_milestone_id"]) for row in edge_rows}
    assert_true(("MS_PRG_CURRENT_BASELINE_CONFORMANCE", "MS_PRG_RELEASE_READINESS") in edge_pairs, "Missing current-baseline conformance to release-readiness edge")
    assert_true(("MS_PRG_MULTIWAVE_RELEASE", "MS_PRG_BAU_HANDOVER_AND_ARCHIVE") in edge_pairs, "Missing widening to BAU edge")
    assert_true(("MS_PRG_MULTIWAVE_RELEASE", "MS_PRG_OPTIONAL_ASSISTIVE_VISIBLE_ENABLEMENT") in edge_pairs, "Missing optional assistive branch")
    assert_true(("MS_POST6_SCOPE_SPLIT_GATE", "MS_P8_DEFINITION_AND_ENTRY") in edge_pairs, "Missing post-Phase-6 current baseline fanout edge")
    assert_true(("MS_POST6_SCOPE_SPLIT_GATE", "MS_P7_DEFINITION_AND_ENTRY") in edge_pairs, "Missing post-Phase-6 deferred fanout edge")
    assert_true(("MS_EXT_IM1_SCAL_READINESS", "MS_EXT_MESH_ACCESS") in edge_pairs, "Missing current external sequencing edge after IM1")
    assert_true(("MS_EXT_MESH_ACCESS", "MS_EXT_COMMS_AND_SCAN_VENDORS") in edge_pairs, "Missing current external sequencing edge after MESH")
    assert_true(("MS_EXT_IM1_SCAL_READINESS", "MS_EXT_OPTIONAL_PDS_ENRICHMENT") in edge_pairs, "Missing optional PDS branch edge")
    assert_true(("MS_EXT_MESH_ACCESS", "MS_EXT_DEFERRED_NHSAPP_ECOSYSTEM") in edge_pairs, "Missing deferred NHS App external branch edge")

    critical_nodes = critical_path["critical_path_milestone_ids"]
    assert_true(critical_nodes[0] == "MS_PLAN_DISCOVERY_BASELINE", "Critical path should start at planning baseline")
    assert_true(critical_nodes[-1] == "MS_PRG_BAU_HANDOVER_AND_ARCHIVE", "Critical path should end at BAU handover")
    assert_true("MS_P7_DEFINITION_AND_ENTRY" not in critical_nodes, "Deferred Phase 7 must not appear on the current-baseline critical path")
    assert_true("MS_PRG_DEFERRED_NHSAPP_ENABLEMENT" not in critical_nodes, "Deferred NHS App enablement must not appear on the current-baseline critical path")
    assert_true("MS_PRG_OPTIONAL_ASSISTIVE_VISIBLE_ENABLEMENT" not in critical_nodes, "Optional visible assistive enablement must not appear on the current-baseline critical path")

    for row in gate_rows:
        assert_true(row["required_artifact_refs"], f"{row['merge_gate_id']} CSV row has no required artifacts")
        if row["merge_gate_id"] == "GATE_RELEASE_READINESS":
            artifacts = row["required_artifact_refs"]
            assert_true("production_readiness_pack" in artifacts, "Release-readiness gate must require the production readiness pack")
        if row["merge_gate_id"] == "GATE_BAU_TRANSFER":
            artifacts = row["required_artifact_refs"]
            assert_true("bau_readiness_pack" in artifacts and "release_to_bau_record" in artifacts, "BAU gate must require BAU readiness and release-to-BAU artifacts")

    for marker in HTML_MARKERS:
        assert_true(marker in html, f"Programme control tower is missing HTML marker: {marker}")


def main() -> None:
    prereqs = ensure_prerequisites()
    ensure_deliverables()
    payloads = load_payloads()
    validate_payload(prereqs, payloads)


if __name__ == "__main__":
    main()
