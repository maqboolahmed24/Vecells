#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import ast
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "programme"

REQUIRED_INPUTS = {
    "product_scope": DATA_DIR / "product_scope_matrix.json",
    "adr_index": DATA_DIR / "adr_index.json",
    "programme_milestones": DATA_DIR / "programme_milestones.json",
    "merge_gate_matrix": DATA_DIR / "merge_gate_matrix.csv",
    "master_risk_register": DATA_DIR / "master_risk_register.json",
    "dependency_watchlist": DATA_DIR / "dependency_watchlist.json",
}

DELIVERABLES = [
    DOCS_DIR / "20_phase0_entry_criteria_and_foundation_gate.md",
    DOCS_DIR / "20_phase0_readiness_matrix.md",
    DOCS_DIR / "20_phase0_gate_verdict_and_blockers.md",
    DOCS_DIR / "20_phase0_evidence_pack_index.md",
    DOCS_DIR / "20_phase0_foundation_gate_runbook.md",
    DOCS_DIR / "20_phase0_foundation_gate_cockpit.html",
    DOCS_DIR / "20_phase0_foundation_gate_sequence.mmd",
    DATA_DIR / "phase0_entry_criteria_matrix.csv",
    DATA_DIR / "phase0_gate_blockers.csv",
    DATA_DIR / "phase0_evidence_index.json",
    DATA_DIR / "phase0_gate_verdict.json",
    DATA_DIR / "phase0_subphase_gate_map.csv",
]

REQUIRED_CLASSES = {
    "source_truth",
    "scope",
    "architecture",
    "dependency_readiness",
    "assurance_readiness",
    "privacy_security",
    "runtime_baseline",
    "frontend_baseline",
    "tooling_baseline",
    "risk_posture",
    "traceability",
    "conformance",
}

HTML_MARKERS = [
    'data-testid="gate-verdict-banner"',
    'data-testid="criteria-rail"',
    'data-testid="readiness-matrix"',
    'data-testid="blocker-table"',
    'data-testid="evidence-index-table"',
    'data-testid="subphase-gate-map"',
    'data-testid="gate-inspector"',
    "data-criterion-id",
    "data-verdict",
    "data-blocker-state",
    "data-evidence-ref",
]

MANDATORY_CONTROL_PLANE_OBLIGATIONS = {
    "LifecycleCoordinator",
    "RouteIntentBinding",
    "CommandSettlementRecord",
    "RuntimePublicationBundle",
    "DesignContractPublicationBundle",
    "ReleasePublicationParityRecord",
    "AudienceSurfaceRuntimeBinding",
    "ReleaseWatchTuple",
    "AssuranceSliceTrustRecord",
    "ExperienceContinuityControlEvidence",
}


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def load_json(path: Path) -> Any:
    return json.loads(path.read_text())


def load_csv(path: Path) -> list[dict[str, str]]:
    with path.open() as handle:
        return list(csv.DictReader(handle))


def parse_json_list(cell: str) -> list[str]:
    if not cell:
        return []
    try:
        payload = json.loads(cell)
    except json.JSONDecodeError:
        payload = ast.literal_eval(cell)
    assert_true(isinstance(payload, list), f"Expected JSON list cell, got: {cell}")
    return payload


def ensure_prerequisites() -> dict[str, Any]:
    missing = [str(path) for path in REQUIRED_INPUTS.values() if not path.exists()]
    assert_true(not missing, "Missing seq_020 prerequisites:\n" + "\n".join(missing))

    product_scope = load_json(REQUIRED_INPUTS["product_scope"])
    adr_index = load_json(REQUIRED_INPUTS["adr_index"])
    programme = load_json(REQUIRED_INPUTS["programme_milestones"])

    assert_true("phase_7" not in product_scope["baseline_phases"], "Phase 7 drifted into the current baseline")
    assert_true(product_scope["deferred_phases"] == ["phase_7"], "Deferred-scope baseline drifted away from phase_7 only")
    assert_true(adr_index["deferred_baseline"] == "phase 7 embedded NHS App channel", "ADR deferred baseline drifted")
    assert_true(len(programme["phase0_subphases"]) == 7, "Programme milestone pack no longer names seven Phase 0 sub-phases")

    return {
        "product_scope": product_scope,
        "adr_index": adr_index,
        "programme": programme,
        "merge_gates": {row["merge_gate_id"]: row for row in load_csv(REQUIRED_INPUTS["merge_gate_matrix"])},
        "risk_ids": {row["risk_id"] for row in load_json(REQUIRED_INPUTS["master_risk_register"])["risks"]},
        "dependency_ids": {row["dependency_id"] for row in load_json(REQUIRED_INPUTS["dependency_watchlist"])["dependencies"]},
    }


def ensure_deliverables() -> None:
    missing = [str(path) for path in DELIVERABLES if not path.exists()]
    assert_true(not missing, "Missing seq_020 deliverables:\n" + "\n".join(missing))


def validate_artifacts(prereqs: dict[str, Any]) -> None:
    criteria_rows = load_csv(DATA_DIR / "phase0_entry_criteria_matrix.csv")
    blocker_rows = load_csv(DATA_DIR / "phase0_gate_blockers.csv")
    evidence_index = load_json(DATA_DIR / "phase0_evidence_index.json")
    verdict_payload = load_json(DATA_DIR / "phase0_gate_verdict.json")
    gate_rows = load_csv(DATA_DIR / "phase0_subphase_gate_map.csv")
    html = (DOCS_DIR / "20_phase0_foundation_gate_cockpit.html").read_text()

    assert_true(criteria_rows, "Criteria matrix is empty")
    assert_true(blocker_rows, "Blocker table is empty")
    assert_true(gate_rows, "Gate map is empty")

    classes = {row["criterion_class"] for row in criteria_rows}
    assert_true(REQUIRED_CLASSES.issubset(classes), f"Missing criterion classes: {sorted(REQUIRED_CLASSES - classes)}")

    criterion_ids = set()
    evidence_refs = {row["artifact_ref"]: row for row in evidence_index["artifacts"]}
    for row in criteria_rows:
        criterion_id = row["criterion_id"]
        assert_true(criterion_id not in criterion_ids, f"Duplicate criterion id: {criterion_id}")
        criterion_ids.add(criterion_id)
        assert_true(row["status"] in {"pass", "review_required", "blocked"}, f"Invalid criterion status for {criterion_id}")
        required_artifacts = parse_json_list(row["required_artifact_refs"])
        required_tasks = parse_json_list(row["required_task_refs"])
        required_risks = parse_json_list(row["required_risk_refs"])
        required_dependencies = parse_json_list(row["required_dependency_refs"])
        required_conformance = parse_json_list(row["required_conformance_refs"])

        assert_true(required_artifacts, f"{criterion_id} has no linked artifacts")
        assert_true(bool(row["auto_check_rule"].strip()), f"{criterion_id} is missing auto_check_rule")
        assert_true(bool(row["manual_review_rule"].strip()), f"{criterion_id} is missing manual_review_rule")
        assert_true(bool(row["blocker_if_failed"].strip()), f"{criterion_id} is missing blocker_if_failed")
        assert_true(bool(row["notes"].strip()), f"{criterion_id} is missing notes")

        for artifact_ref in required_artifacts:
            assert_true(artifact_ref in evidence_refs, f"{criterion_id} references unknown evidence artifact {artifact_ref}")
            artifact = evidence_refs[artifact_ref]
            assert_true(artifact["freshness_state"] == "current", f"{criterion_id} references non-current evidence {artifact_ref}")
            assert_true(artifact["contradiction_state"] == "clear", f"{criterion_id} references contradictory evidence {artifact_ref}")
            if artifact["baseline_scope"] == "deferred":
                assert_true(bool(row["waiver_ref"].strip()), f"{criterion_id} depends on deferred-only artifact {artifact_ref} without a waiver")

        for risk_id in required_risks:
            assert_true(risk_id in prereqs["risk_ids"], f"{criterion_id} references unknown risk {risk_id}")
        for dependency_id in required_dependencies:
            assert_true(dependency_id in prereqs["dependency_ids"], f"{criterion_id} references unknown dependency {dependency_id}")
        for conformance_ref in required_conformance:
            assert_true(conformance_ref.startswith("PHASE_CONFORMANCE_ROW_") or conformance_ref.startswith("CROSS_PHASE_CONFORMANCE_SCORECARD_"), f"{criterion_id} uses invalid conformance ref {conformance_ref}")
        assert_true(required_tasks, f"{criterion_id} has no task refs")

    blocker_ids = set()
    for row in blocker_rows:
        blocker_id = row["blocker_id"]
        assert_true(blocker_id not in blocker_ids, f"Duplicate blocker id: {blocker_id}")
        blocker_ids.add(blocker_id)
        assert_true(row["criterion_id"] in criterion_ids, f"Blocker {blocker_id} references unknown criterion {row['criterion_id']}")
        assert_true(row["blocker_state"] in {"blocked", "warning"}, f"Invalid blocker state for {blocker_id}")
        assert_true(bool(row["summary"].strip()), f"{blocker_id} is missing summary")
        assert_true(bool(row["required_action"].strip()), f"{blocker_id} is missing required_action")
        assert_true(parse_json_list(row["linked_artifact_refs"]), f"{blocker_id} has no linked artifacts")

    evidence_summary = evidence_index["summary"]
    assert_true(evidence_summary["artifact_count"] == len(evidence_index["artifacts"]), "Evidence summary artifact count is wrong")
    assert_true(evidence_summary["missing_count"] == 0, "Evidence pack still has missing artifacts")
    assert_true(evidence_summary["contradiction_count"] == 0, "Evidence pack still reports contradictory upstream artifacts")
    assert_true(all(check["status"] == "pass" for check in evidence_index["consistency_checks"]), "At least one evidence consistency check failed")

    for artifact in evidence_index["artifacts"]:
        artifact_path = ROOT / artifact["relative_path"]
        assert_true(artifact_path.exists(), f"Evidence path does not exist: {artifact_path}")
        current_sha = artifact_path.read_bytes()
        import hashlib
        assert_true(hashlib.sha256(current_sha).hexdigest() == artifact["sha256"], f"Evidence digest drift for {artifact['artifact_ref']}")

    gate_verdicts = verdict_payload["gate_verdicts"]
    assert_true(gate_verdicts, "Gate verdict payload is empty")
    entry_gate = gate_verdicts[0]
    blocked_criteria = [row["criterion_id"] for row in criteria_rows if row["status"] == "blocked"]
    if entry_gate["verdict"] == "approved":
        assert_true(not blocked_criteria, "Verdict is approved while blocking criteria remain")
    if blocked_criteria:
        assert_true(entry_gate["verdict"] == "withheld", "Main entry verdict must be withheld while blocking criteria remain")

    gate_ids = set()
    all_gate_obligations: set[str] = set()
    for row in gate_rows:
        gate_id = row["gate_id"]
        assert_true(gate_id not in gate_ids, f"Duplicate gate id {gate_id}")
        gate_ids.add(gate_id)
        assert_true(row["scope"] in {"phase0_entry", "phase0_internal_subphase", "phase0_parallel_open"}, f"Invalid gate scope for {gate_id}")
        obligations = set(parse_json_list(row["required_control_plane_obligations"]))
        assert_true(obligations, f"{gate_id} has no control-plane obligations")
        all_gate_obligations |= obligations
        assert_true(parse_json_list(row["required_criterion_refs"]), f"{gate_id} has no criterion refs")
        assert_true(parse_json_list(row["required_task_refs"]), f"{gate_id} has no task refs")
        assert_true(bool(row["blocking_rule"].strip()), f"{gate_id} is missing blocking rule")

    assert_true(MANDATORY_CONTROL_PLANE_OBLIGATIONS.issubset(all_gate_obligations), "Gate map omits required control-plane obligations")
    parallel_open = next(row for row in gate_rows if row["gate_id"] == "GATE_P0_PARALLEL_FOUNDATION_OPEN")
    parallel_obligations = set(parse_json_list(parallel_open["required_control_plane_obligations"]))
    assert_true(MANDATORY_CONTROL_PLANE_OBLIGATIONS.issubset(parallel_obligations), "Parallel-open gate omits release/publication/trust/continuity obligations")

    current_gate = prereqs["merge_gates"]["GATE_EXTERNAL_TO_FOUNDATION"]
    if current_gate["gate_status"] == "blocked":
        assert_true(entry_gate["verdict"] == "withheld", "Phase 0 entry must be withheld while GATE_EXTERNAL_TO_FOUNDATION is blocked")

    assert_true("prefers-reduced-motion" in html, "HTML cockpit lacks reduced-motion support")
    remote_asset_tokens = ['src="http://', 'src="https://', "src='http://", "src='https://", 'href="http://', 'href="https://', "href='http://", "href='https://", "url(http://", "url(https://"]
    assert_true(not any(token in html for token in remote_asset_tokens), "HTML cockpit pulls remote assets")
    for marker in HTML_MARKERS:
        assert_true(marker in html, f"HTML cockpit is missing marker {marker}")
    assert_true("Foundation_Gateboard" in html or verdict_payload["visual_mode"] == "Foundation_Gateboard", "Visual mode label is missing")
    assert_true("GATE_P0_FOUNDATION_ENTRY" in html, "HTML cockpit does not expose the main gate")


def main() -> None:
    prereqs = ensure_prerequisites()
    ensure_deliverables()
    validate_artifacts(prereqs)


if __name__ == "__main__":
    main()
