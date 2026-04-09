#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from collections import defaultdict
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "analysis"

REQUIRED_INPUTS = {
    "requirements": DATA_DIR / "requirement_registry.jsonl",
    "task_map": DATA_DIR / "task_to_milestone_map.csv",
    "state_machines": DATA_DIR / "state_machines.json",
    "external_dependencies": DATA_DIR / "external_dependencies.json",
}

DELIVERABLES = [
    DOCS_DIR / "19_requirement_to_task_traceability_map.md",
    DOCS_DIR / "19_traceability_rules_and_coverage_model.md",
    DOCS_DIR / "19_requirement_coverage_gap_report.md",
    DOCS_DIR / "19_traceability_decision_log.md",
    DOCS_DIR / "19_traceability_explorer.html",
    DATA_DIR / "requirement_task_traceability.csv",
    DATA_DIR / "task_requirement_traceability.csv",
    DATA_DIR / "coverage_summary.json",
    DATA_DIR / "orphan_requirements.csv",
    DATA_DIR / "orphan_tasks.csv",
    DATA_DIR / "coverage_by_phase.csv",
    DATA_DIR / "coverage_by_domain.csv",
]

TRACEABILITY_REQUIRED_FIELDS = {
    "traceability_id",
    "requirement_id",
    "task_id",
    "task_title",
    "task_prompt_ref",
    "mapping_type",
    "coverage_strength",
    "baseline_scope",
    "phase_ref",
    "domain_ref",
    "persona_refs",
    "channel_refs",
    "object_refs",
    "state_or_invariant_refs",
    "dependency_refs",
    "risk_refs",
    "source_requirement_refs",
    "reason",
    "notes",
}

TASK_SUMMARY_FIELDS = {
    "task_id",
    "task_title",
    "total_requirement_count",
    "direct_requirement_count",
    "test_requirement_count",
    "gate_requirement_count",
    "assurance_requirement_count",
    "orphan_state",
    "notes",
}

HTML_MARKERS = [
    'data-testid="trace-filter-rail"',
    'data-testid="trace-graph-canvas"',
    'data-testid="trace-matrix-table"',
    'data-testid="coverage-summary-panel"',
    'data-testid="trace-inspector"',
    "data-requirement-id",
    "data-task-id",
    "data-mapping-type",
    "data-baseline-scope",
    "data-coverage-strength",
]

MUTATION_TERMS = [
    "route",
    "shell",
    "writable",
    "mutation",
    "settlement",
    "trust",
    "continuity",
    "design contract",
]


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def load_json(path: Path) -> Any:
    return json.loads(path.read_text())


def load_jsonl(path: Path) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    with path.open() as handle:
        for line in handle:
            line = line.strip()
            if line:
                rows.append(json.loads(line))
    return rows


def load_csv(path: Path) -> list[dict[str, str]]:
    with path.open() as handle:
        return list(csv.DictReader(handle))


def list_from_pipe(value: str) -> list[str]:
    if not value:
        return []
    return [item for item in value.split("|") if item]


def ensure_inputs() -> dict[str, Any]:
    missing = [name for name, path in REQUIRED_INPUTS.items() if not path.exists()]
    assert_true(not missing, "Missing seq_019 prerequisites: " + ", ".join(sorted(missing)))
    return {
        "requirements": load_jsonl(REQUIRED_INPUTS["requirements"]),
        "task_map": load_csv(REQUIRED_INPUTS["task_map"]),
        "state_machines": load_json(REQUIRED_INPUTS["state_machines"]),
        "external_dependencies": load_json(REQUIRED_INPUTS["external_dependencies"]),
    }


def ensure_deliverables() -> None:
    missing = [str(path) for path in DELIVERABLES if not path.exists()]
    assert_true(not missing, "Missing seq_019 deliverables:\n" + "\n".join(missing))


def validate_payloads(prereqs: dict[str, Any]) -> None:
    trace_rows = load_csv(DATA_DIR / "requirement_task_traceability.csv")
    task_rows = load_csv(DATA_DIR / "task_requirement_traceability.csv")
    orphan_requirements = load_csv(DATA_DIR / "orphan_requirements.csv")
    orphan_tasks = load_csv(DATA_DIR / "orphan_tasks.csv")
    coverage = load_json(DATA_DIR / "coverage_summary.json")
    html = (DOCS_DIR / "19_traceability_explorer.html").read_text()

    assert_true(trace_rows, "requirement_task_traceability.csv is empty")
    assert_true(task_rows, "task_requirement_traceability.csv is empty")

    for row in trace_rows:
        missing = sorted(TRACEABILITY_REQUIRED_FIELDS - set(row))
        assert_true(not missing, f"{row.get('traceability_id', 'UNKNOWN')} missing fields: {missing}")
        assert_true(row["reason"], f"{row['traceability_id']} lacks mapping rationale")
        assert_true(row["source_requirement_refs"], f"{row['traceability_id']} lacks source requirement refs")

    for row in task_rows:
        missing = sorted(TASK_SUMMARY_FIELDS - set(row))
        assert_true(not missing, f"{row.get('task_id', 'UNKNOWN')} missing task summary fields: {missing}")
        assert_true(
            row["orphan_state"] in {"none", "weakly_grounded", "ungrounded"},
            f"{row['task_id']} has invalid orphan state {row['orphan_state']}",
        )
        assert_true(row["orphan_state"] != "ungrounded", f"{row['task_id']} remains ungrounded")
        if row["orphan_state"] != "none":
            assert_true(row["notes"], f"{row['task_id']} is weakly grounded without explanation")

    traceability_ids = [row["traceability_id"] for row in trace_rows]
    assert_true(len(traceability_ids) == len(set(traceability_ids)), "Duplicate traceability ids detected")

    requirement_ids = {row["requirement_id"] for row in prereqs["requirements"]}
    mapped_requirement_ids = {row["requirement_id"] for row in trace_rows}
    assert_true(requirement_ids == mapped_requirement_ids, "Every canonical requirement must have at least one trace row")

    task_ids = {row["task_id"] for row in prereqs["task_map"]}
    mapped_task_ids = {row["task_id"] for row in task_rows}
    assert_true(task_ids == mapped_task_ids, "Every checklist task must have a task summary row")

    rows_by_requirement: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in trace_rows:
        rows_by_requirement[row["requirement_id"]].append(row)

    requirement_index = {row["requirement_id"]: row for row in prereqs["requirements"]}
    stateful_requirements = {
        row["requirement_id"]
        for row in prereqs["requirements"]
        if row["requirement_id"].startswith("REQ-INV")
        or row["requirement_type"] in {"test", "invariant", "state_machine"}
    }
    for requirement_id in stateful_requirements:
        mapping_types = {row["mapping_type"] for row in rows_by_requirement[requirement_id]}
        assert_true(
            {"test", "gate"} & mapping_types,
            f"{requirement_id} is invariant or test-like but has no test or gate coverage",
        )

    deferred_requirements = {
        row["requirement_id"]
        for row in prereqs["requirements"]
        if "phase_7" in row.get("affected_phases", []) or row["source_file"].startswith("phase-7-")
    }
    for requirement_id in deferred_requirements:
        scopes = {row["baseline_scope"] for row in rows_by_requirement[requirement_id]}
        assert_true(scopes == {"deferred"}, f"{requirement_id} leaks deferred coverage into a non-deferred scope: {scopes}")

    dependency_ids = {row["dependency_id"] for row in prereqs["external_dependencies"]["dependencies"]}
    for requirement in prereqs["requirements"]:
        dependency_refs = set(requirement.get("external_dependencies", []))
        if not dependency_refs:
            continue
        if "phase_7" in requirement.get("affected_phases", []) or requirement["source_file"].startswith("phase-7-"):
            continue
        mapping_types = {row["mapping_type"] for row in rows_by_requirement[requirement["requirement_id"]]}
        assert_true(
            "integrate" in mapping_types,
            f"{requirement['requirement_id']} references external dependencies but has no integrate coverage",
        )

    for requirement in prereqs["requirements"]:
        search_text = " ".join(
            [
                requirement["requirement_title"],
                requirement.get("expected_behavior", ""),
                requirement.get("failure_or_degraded_behavior", ""),
            ]
        ).lower()
        if not any(term in search_text for term in MUTATION_TERMS):
            continue
        mapping_types = {row["mapping_type"] for row in rows_by_requirement[requirement["requirement_id"]]}
        assert_true(
            {"test", "gate"} & mapping_types and {"release", "frontend_surface", "architecture_decision", "implement"} & mapping_types,
            f"{requirement['requirement_id']} lacks route or trust verification coverage",
        )

    weak_task_ids = {row["task_id"] for row in orphan_tasks}
    for row in orphan_tasks:
        assert_true(row["notes"], f"{row['task_id']} orphan row is missing notes")
    task_summary_weak_ids = {row["task_id"] for row in task_rows if row["orphan_state"] != "none"}
    assert_true(task_summary_weak_ids == weak_task_ids, "Weak task summary rows and orphan_tasks.csv are out of parity")

    assert_true(coverage["summary"]["requirement_count"] == len(requirement_ids), "Coverage summary requirement count mismatch")
    assert_true(coverage["summary"]["task_count"] == len(task_ids), "Coverage summary task count mismatch")
    assert_true(coverage["summary"]["traceability_row_count"] == len(trace_rows), "Coverage summary traceability count mismatch")
    assert_true(coverage["summary"]["requirements_with_gaps_count"] == 0, "Current traceability output still reports unresolved requirement gaps")

    orphan_req_ids = {row["requirement_id"] for row in orphan_requirements}
    assert_true(orphan_req_ids.issubset(requirement_ids), "orphan_requirements.csv contains unknown requirement ids")
    for row in orphan_requirements:
        assert_true(row["gap_state"], f"{row['requirement_id']} lacks a gap state")

    for marker in HTML_MARKERS:
        assert_true(marker in html, f"Missing HTML marker: {marker}")
    assert_true("@media (prefers-reduced-motion: reduce)" in html, "Reduced-motion support missing from explorer HTML")
    assert_true("https://" not in html and "http://" not in html, "Explorer HTML must not pull remote assets")


def main() -> None:
    prereqs = ensure_inputs()
    ensure_deliverables()
    validate_payloads(prereqs)


if __name__ == "__main__":
    main()
