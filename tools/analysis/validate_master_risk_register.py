#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "risk"

REQUIRED_INPUTS = {
    "programme": DATA_DIR / "programme_milestones.json",
    "critical_path": DATA_DIR / "critical_path_summary.json",
    "external_dependencies": DATA_DIR / "external_dependencies.json",
    "summary_conflicts": DATA_DIR / "summary_conflicts.json",
}

DELIVERABLES = [
    DOCS_DIR / "18_master_risk_register.md",
    DOCS_DIR / "18_dependency_watchlist.md",
    DOCS_DIR / "18_risk_treatment_matrix.md",
    DOCS_DIR / "18_risk_review_operating_model.md",
    DOCS_DIR / "18_watchlist_decision_log.md",
    DOCS_DIR / "18_risk_watchtower.html",
    DATA_DIR / "master_risk_register.csv",
    DATA_DIR / "master_risk_register.json",
    DATA_DIR / "dependency_watchlist.csv",
    DATA_DIR / "dependency_watchlist.json",
    DATA_DIR / "risk_heatmap.json",
    DATA_DIR / "risk_task_links.csv",
    DATA_DIR / "risk_gate_links.csv",
]

HTML_MARKERS = [
    'data-testid="risk-summary-band"',
    'data-testid="risk-heatmap"',
    'data-testid="dependency-watch-panel"',
    'data-testid="risk-table"',
    'data-testid="risk-inspector"',
    "data-risk-id",
    "data-dependency-id",
    "data-risk-class",
    "data-lifecycle-state",
    "data-gate-impact",
]

REQUIRED_FINDINGS = {
    "FINDING_091",
    "FINDING_095",
    "FINDING_104",
    "FINDING_105",
    "FINDING_106",
    "FINDING_107",
    "FINDING_108",
    "FINDING_109",
    "FINDING_110",
    "FINDING_111",
    "FINDING_112",
    "FINDING_113",
    "FINDING_114",
    "FINDING_115",
    "FINDING_116",
    "FINDING_117",
    "FINDING_118",
    "FINDING_119",
    "FINDING_120",
}

RISK_REQUIRED_FIELDS = {
    "risk_id",
    "risk_title",
    "risk_class",
    "source_type",
    "source_refs",
    "finding_refs",
    "problem_statement",
    "failure_mode",
    "leading_indicators",
    "trigger_conditions",
    "affected_phase_refs",
    "affected_requirement_ids",
    "affected_task_refs",
    "affected_gate_refs",
    "affected_dependency_refs",
    "affected_persona_refs",
    "affected_channel_refs",
    "likelihood",
    "impact_patient_safety",
    "impact_service",
    "impact_privacy",
    "impact_delivery",
    "impact_release",
    "detectability",
    "risk_score",
    "current_control_refs",
    "control_strength",
    "mitigation_actions",
    "contingency_actions",
    "target_due_ref",
    "owner_role",
    "status",
    "critical_path_relevance",
    "gate_impact",
}

DEPENDENCY_REQUIRED_FIELDS = {
    "dependency_id",
    "dependency_name",
    "dependency_type",
    "baseline_scope",
    "source_refs",
    "linked_external_inventory_refs",
    "linked_adapter_profile_refs",
    "linked_standards_watch_refs",
    "lifecycle_state",
    "required_for_milestone_refs",
    "required_for_gate_refs",
    "blast_radius_scope",
    "monitoring_signals",
    "degradation_mode",
    "fallback_strategy",
    "owner_role",
    "next_review_ref",
    "notes",
}


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def load_json(path: Path) -> Any:
    return json.loads(path.read_text())


def load_csv(path: Path) -> list[dict[str, str]]:
    with path.open() as handle:
        return list(csv.DictReader(handle))


def ensure_prerequisites() -> dict[str, Any]:
    missing = [name for name, path in REQUIRED_INPUTS.items() if not path.exists()]
    assert_true(not missing, "Missing seq_018 prerequisites: " + ", ".join(missing))
    return {
        "programme": load_json(REQUIRED_INPUTS["programme"]),
        "critical_path": load_json(REQUIRED_INPUTS["critical_path"]),
        "external_dependencies": load_json(REQUIRED_INPUTS["external_dependencies"]),
        "summary_conflicts": load_json(REQUIRED_INPUTS["summary_conflicts"]),
    }


def ensure_deliverables() -> None:
    missing = [str(path) for path in DELIVERABLES if not path.exists()]
    assert_true(not missing, "Missing seq_018 deliverables:\n" + "\n".join(missing))


def validate_payloads(prereqs: dict[str, Any]) -> None:
    risk_payload = load_json(DATA_DIR / "master_risk_register.json")
    dependency_payload = load_json(DATA_DIR / "dependency_watchlist.json")
    risk_heatmap = load_json(DATA_DIR / "risk_heatmap.json")
    risk_rows = risk_payload["risks"]
    dependency_rows = dependency_payload["dependencies"]
    risk_task_links = load_csv(DATA_DIR / "risk_task_links.csv")
    risk_gate_links = load_csv(DATA_DIR / "risk_gate_links.csv")
    html = (DOCS_DIR / "18_risk_watchtower.html").read_text()

    assert_true(risk_payload["summary"]["risk_count"] == len(risk_rows), "Risk summary count mismatch")
    assert_true(dependency_payload["summary"]["dependency_count"] == len(dependency_rows), "Dependency summary count mismatch")

    risk_ids = [row["risk_id"] for row in risk_rows]
    dependency_ids = [row["dependency_id"] for row in dependency_rows]
    assert_true(len(risk_ids) == len(set(risk_ids)), "Duplicate risk ids detected")
    assert_true(len(dependency_ids) == len(set(dependency_ids)), "Duplicate dependency ids detected")

    for row in risk_rows:
        missing = sorted(RISK_REQUIRED_FIELDS - set(row))
        assert_true(not missing, f"{row.get('risk_id', 'UNKNOWN')} missing risk fields: {missing}")
        assert_true(row["source_refs"], f"{row['risk_id']} has no source refs")
        assert_true(
            row["mitigation_actions"] or row["status"] == "accepted_with_guardrails",
            f"{row['risk_id']} has no mitigation actions or acceptance rationale",
        )
        if row["likelihood"] in {"high", "extreme"} and row["gate_impact"] == "blocking":
            assert_true(row["owner_role"], f"{row['risk_id']} is high-impact and ownerless")
        if row["gate_impact"] == "blocking":
            assert_true(
                row["affected_gate_refs"] or row["linked_milestone_refs"] or row["affected_task_refs"],
                f"{row['risk_id']} is blocking but not linked to a gate, milestone, or task",
            )

    external_dependency_ids = {row["dependency_id"] for row in prereqs["external_dependencies"]["dependencies"]}
    for row in dependency_rows:
        missing = sorted(DEPENDENCY_REQUIRED_FIELDS - set(row))
        assert_true(not missing, f"{row.get('dependency_id', 'UNKNOWN')} missing dependency fields: {missing}")
        assert_true(row["owner_role"], f"{row['dependency_id']} has no owner role")
        assert_true(row["degradation_mode"], f"{row['dependency_id']} lacks degradation mode")
        assert_true(row["fallback_strategy"], f"{row['dependency_id']} lacks fallback strategy")
        assert_true(row["next_review_ref"], f"{row['dependency_id']} lacks next review ref")
        if row["baseline_scope"] == "current" and row["dependency_id"] in external_dependency_ids:
            assert_true(row["fallback_strategy"], f"Current-baseline dependency {row['dependency_id']} has no fallback")
        if row["lifecycle_state"] in {"blocked", "degraded"}:
            assert_true(
                row["required_for_gate_refs"] or row["required_for_milestone_refs"],
                f"{row['dependency_id']} is blocked or degraded without milestone or gate links",
            )

    finding_status = {row["finding_id"]: row["status"] for row in risk_payload["forensic_finding_coverage"]}
    assert_true(REQUIRED_FINDINGS.issubset(finding_status), "High-impact forensic finding coverage is incomplete")
    for finding_id in REQUIRED_FINDINGS:
        assert_true(finding_status[finding_id] != "missing", f"{finding_id} is absent from the risk/control mapping")

    milestone_by_id = {row["milestone_id"]: row for row in prereqs["programme"]["milestones"]}
    critical_path_milestones = prereqs["critical_path"]["critical_path_milestone_ids"]
    for milestone_id in critical_path_milestones:
        milestone = milestone_by_id[milestone_id]
        matching = [
            row["risk_id"]
            for row in risk_rows
            if set(row["affected_task_refs"]) & set(milestone["source_task_refs"])
            or milestone_id in row.get("linked_milestone_refs", [])
            or milestone["merge_gate_ref"] in row["affected_gate_refs"]
            or set(row["affected_dependency_refs"]) & set(milestone["required_dependency_refs"])
        ]
        assert_true(matching, f"Critical-path milestone {milestone_id} has no linked risks")

    heatmap_ids = set()
    for cell in risk_heatmap["cells"]:
        for risk_id in cell["risk_ids"]:
            heatmap_ids.add(risk_id)
    assert_true(heatmap_ids == set(risk_ids), "Risk heatmap is not in parity with the risk register")

    task_link_ids = {row["risk_id"] for row in risk_task_links}
    gate_link_ids = {row["risk_id"] for row in risk_gate_links}
    assert_true(task_link_ids | gate_link_ids, "Risk link exports are empty")

    for marker in HTML_MARKERS:
        assert_true(marker in html, f"Missing HTML marker: {marker}")
    assert_true("https://" not in html and "http://" not in html, "Watchtower HTML must not pull remote assets")
    assert_true("@media (prefers-reduced-motion: reduce)" in html, "Reduced-motion support missing from watchtower HTML")


def main() -> None:
    prereqs = ensure_prerequisites()
    ensure_deliverables()
    validate_payloads(prereqs)


if __name__ == "__main__":
    main()
