#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.path.insert(0, str(ROOT / "tools" / "analysis"))

from clinical_signoff_seed_pack import (  # noqa: E402
    CADENCE_DOC_PATH,
    CALENDAR_PATH,
    CHANGE_CLASSES,
    GATE_REQUIREMENTS_PATH,
    GAP_CATALOG,
    GRAPH_DOC_PATH,
    NO_SELF_APPROVAL_RULES,
    PREREQUISITE_SNAPSHOT,
    RACI_COLUMNS,
    RACI_MATRIX,
    RACI_PATH,
    RELEASE_GATE_REQUIREMENTS,
    REVIEW_EVENTS,
    ROLE_CATALOG,
    RULES_DOC_PATH,
    SIGNOFF_DOC_PATH,
    STATE_MACHINE_PATH,
    STANDARDS_VERSION,
    TASK_ID,
    TRIGGER_MATRIX_COLUMNS,
    TRIGGER_MATRIX_PATH,
    TRIGGERS_DOC_PATH,
)
from root_script_updates import ROOT_SCRIPT_UPDATES  # noqa: E402


PACKAGE_JSON_PATH = ROOT / "package.json"

EXPECTED_CHANGE_CLASSES = {row["change_class"] for row in CHANGE_CLASSES}
EXPECTED_REVIEW_EVENTS = {row["review_event_id"] for row in REVIEW_EVENTS}
EXPECTED_ROLE_IDS = {row["role_id"] for row in ROLE_CATALOG}
HIGH_IMPACT_BANDS = {"high", "critical"}
DOC_PATHS = [
    CADENCE_DOC_PATH,
    SIGNOFF_DOC_PATH,
    TRIGGERS_DOC_PATH,
    GRAPH_DOC_PATH,
    RULES_DOC_PATH,
]
DELIVERABLES = [
    *DOC_PATHS,
    RACI_PATH,
    TRIGGER_MATRIX_PATH,
    STATE_MACHINE_PATH,
    GATE_REQUIREMENTS_PATH,
    CALENDAR_PATH,
    Path(__file__).resolve(),
]


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def read_text(path: Path) -> str:
    require(path.exists(), f"Missing par_125 deliverable: {path}")
    return path.read_text(encoding="utf-8")


def read_json(path: Path) -> Any:
    return json.loads(read_text(path))


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def validate_deliverables() -> None:
    missing = [str(path) for path in DELIVERABLES if not path.exists()]
    require(not missing, "Missing par_125 deliverables:\n" + "\n".join(missing))


def validate_docs() -> None:
    for path in DOC_PATHS:
        lowered = read_text(path).lower()
        require("mock_now_execution" in lowered, f"{path.name} is missing Mock_now_execution")
        require(
            "actual_production_strategy_later" in lowered,
            f"{path.name} is missing Actual_production_strategy_later",
        )

    graph_text = read_text(GRAPH_DOC_PATH)
    require("ReleaseApprovalFreeze" in graph_text, "approval graph doc is missing ReleaseApprovalFreeze")
    require("AssuranceSliceTrustRecord" in graph_text, "approval graph doc is missing AssuranceSliceTrustRecord")
    rules_text = read_text(RULES_DOC_PATH)
    require("no self approval" in rules_text.lower(), "rules doc is missing no-self-approval language")
    require("independent" in rules_text.lower(), "rules doc is missing independent review language")


def validate_package_scripts() -> None:
    package_json = read_json(PACKAGE_JSON_PATH)
    expected_validator = "python3 ./tools/assurance/validate_clinical_signoff_matrix.py"
    require(
        package_json["scripts"].get("validate:clinical-signoff-matrix") == expected_validator,
        "package.json is missing validate:clinical-signoff-matrix",
    )
    require(
        ROOT_SCRIPT_UPDATES.get("validate:clinical-signoff-matrix") == expected_validator,
        "root_script_updates.py is missing validate:clinical-signoff-matrix",
    )
    for script_name in ["bootstrap", "check"]:
        require(
            "pnpm validate:clinical-signoff-matrix" in package_json["scripts"].get(script_name, ""),
            f"package.json script {script_name} is missing pnpm validate:clinical-signoff-matrix",
        )
        require(
            "pnpm validate:clinical-signoff-matrix" in ROOT_SCRIPT_UPDATES.get(script_name, ""),
            f"root_script_updates.py script {script_name} is missing pnpm validate:clinical-signoff-matrix",
        )
    require(
        "python3 ./tools/assurance/clinical_signoff_seed_pack.py" in package_json["scripts"].get("codegen", ""),
        "package.json codegen is missing the clinical signoff seed pack builder",
    )
    require(
        "python3 ./tools/assurance/clinical_signoff_seed_pack.py" in ROOT_SCRIPT_UPDATES.get("codegen", ""),
        "root_script_updates.py codegen is missing the clinical signoff seed pack builder",
    )


def validate_gate_requirements(payload: dict[str, Any]) -> None:
    require(payload["task_id"] == TASK_ID, "gate requirements task_id drifted")
    require(payload["standards_version"] == STANDARDS_VERSION, "standards version drifted")
    require(
        set(payload["summary"].keys())
        == {"role_count", "review_event_count", "change_class_count", "high_or_critical_change_count", "blocked_prerequisite_count"},
        "gate requirement summary fields drifted",
    )
    require(payload["summary"]["role_count"] == len(ROLE_CATALOG), "role count drifted")
    require(payload["summary"]["review_event_count"] == len(REVIEW_EVENTS), "review event count drifted")
    require(payload["summary"]["change_class_count"] == len(CHANGE_CLASSES), "change class count drifted")

    roles = payload["role_catalog"]
    require({row["role_id"] for row in roles} == EXPECTED_ROLE_IDS, "role catalog drifted")

    review_events = payload["review_event_catalog"]
    require({row["review_event_id"] for row in review_events} == EXPECTED_REVIEW_EVENTS, "review event set drifted")

    gaps = {row["gap_id"] for row in payload["gap_catalog"]}
    require(
        "PREREQUISITE_GAP_123_IM1_SCAL_READINESS_PACK_PENDING" in gaps,
        "required par_123 prerequisite gap is missing",
    )
    require(
        {row["gap_id"] for row in GAP_CATALOG} == gaps,
        "gap catalog drifted",
    )

    prereqs = payload["prerequisite_snapshot"]
    require(len(prereqs) == len(PREREQUISITE_SNAPSHOT), "prerequisite snapshot length drifted")
    prereq_by_id = {row["prerequisite_id"]: row for row in prereqs}
    require(
        prereq_by_id["PREREQ_123_IM1_SCAL_COMPANION"]["status"] == "blocked_on_parallel_task",
        "par_123 prerequisite should remain explicitly blocked",
    )
    for row in prereqs:
        if row["status"] == "available":
            require(row["path_exists"], f"available prerequisite path missing: {row['prerequisite_id']}")

    change_classes = payload["change_classes"]
    require(
        {row["change_class"] for row in change_classes} == EXPECTED_CHANGE_CLASSES,
        "change class set drifted",
    )

    release_gate_ids = {row["gate_id"] for row in payload["release_candidate_gate_requirements"]}
    require(
        release_gate_ids == {row["gate_id"] for row in RELEASE_GATE_REQUIREMENTS},
        "release gate requirement set drifted",
    )

    rule_ids = {row["rule_id"] for row in payload["no_self_approval_rules"]}
    require(
        rule_ids == {row["rule_id"] for row in NO_SELF_APPROVAL_RULES},
        "no-self-approval rule set drifted",
    )

    for row in change_classes:
        for field in [
            "change_class",
            "change_example",
            "safety_impact_band",
            "required_review_events",
            "required_roles",
            "independent_reviewer_required",
            "no_self_approval",
            "required_evidence_refs",
            "required_freeze_or_trust_refs",
            "required_pack_or_delta_refs",
            "approval_state_sequence",
            "blocked_conditions",
            "notes",
        ]:
            require(field in row, f"{row.get('change_class', 'unknown')} is missing {field}")
        require(row["required_review_events"], f"{row['change_class']} has no review events")
        require(row["required_roles"], f"{row['change_class']} has no required roles")
        require(
            set(row["required_review_events"]) <= EXPECTED_REVIEW_EVENTS,
            f"{row['change_class']} references unknown review events",
        )
        require(
            set(row["required_roles"]) <= EXPECTED_ROLE_IDS,
            f"{row['change_class']} references unknown roles",
        )
        if row["safety_impact_band"] in HIGH_IMPACT_BANDS:
            require(
                row["independent_reviewer_required"],
                f"{row['change_class']} lacks independent review despite high safety impact",
            )
            require(
                row["no_self_approval"],
                f"{row['change_class']} may bypass no-self-approval despite high safety impact",
            )
            require(
                "ROLE_INDEPENDENT_SAFETY_REVIEWER" in row["required_roles"],
                f"{row['change_class']} high-impact path is missing ROLE_INDEPENDENT_SAFETY_REVIEWER",
            )
        if row["change_class"] == "cc_release_runtime_publication_manifest":
            required_refs = set(row["required_freeze_or_trust_refs"])
            for ref in {
                "REF_RELEASE_APPROVAL_FREEZE",
                "REF_RUNTIME_PUBLICATION_BUNDLE",
                "REF_RELEASE_PUBLICATION_PARITY",
                "REF_ASSURANCE_SLICE_TRUST_RECORD",
                "REF_GOVERNANCE_REVIEW_PACKAGE",
                "REF_STANDARDS_DEPENDENCY_WATCHLIST",
            }:
                require(ref in required_refs, f"release/runtime class is missing required ref {ref}")
            require(
                "REV_125_RELEASE_CANDIDATE_SAFETY_SIGNOFF" in row["required_review_events"],
                "release/runtime class is missing release-candidate signoff event",
            )

        blocker_ids = [item["blocker_id"] for item in row["blocked_conditions"]]
        require(blocker_ids, f"{row['change_class']} has no blocked conditions")
        for blocker_id in blocker_ids:
            require(
                blocker_id.startswith("missing_evidence:")
                or blocker_id.startswith("stale_authority:")
                or blocker_id.startswith("forbidden_self_approval:"),
                f"{row['change_class']} has ambiguous blocker id {blocker_id}",
            )


def validate_raci(rows: list[dict[str, str]]) -> None:
    require(len(rows) == len(RACI_MATRIX), "RACI row count drifted")
    require(set(rows[0].keys()) == set(RACI_COLUMNS), "RACI columns drifted")
    require({row["review_event_id"] for row in rows} == EXPECTED_REVIEW_EVENTS, "RACI review event set drifted")
    for row in rows:
        require(any(row[column] == "A" for column in RACI_COLUMNS if column in row), f"{row['review_event_id']} has no accountable role")
        require(any(row[column] == "R" for column in RACI_COLUMNS if column in row), f"{row['review_event_id']} has no responsible role")
        require(row["no_self_approval"] == "true", f"{row['review_event_id']} must preserve no-self-approval")


def validate_trigger_matrix(rows: list[dict[str, str]]) -> None:
    require(len(rows) == len(CHANGE_CLASSES), "trigger matrix row count drifted")
    require(set(rows[0].keys()) == set(TRIGGER_MATRIX_COLUMNS), "trigger matrix columns drifted")
    require({row["change_class"] for row in rows} == EXPECTED_CHANGE_CLASSES, "trigger matrix change class set drifted")
    for row in rows:
        require(row["required_review_events"], f"{row['change_class']} has empty required_review_events")
        require(row["required_roles"], f"{row['change_class']} has empty required_roles")
        if row["safety_impact_band"] in HIGH_IMPACT_BANDS:
            require(
                row["independent_reviewer_required"] == "true",
                f"{row['change_class']} trigger row lost independent reviewer requirement",
            )
            require(
                row["no_self_approval"] == "true",
                f"{row['change_class']} trigger row lost no-self-approval requirement",
            )
        if row["change_class"] == "cc_release_runtime_publication_manifest":
            require(
                "REF_RELEASE_APPROVAL_FREEZE" in row["required_freeze_or_trust_refs"].split("|"),
                "release/runtime trigger row is missing REF_RELEASE_APPROVAL_FREEZE",
            )
            require(
                "REF_RUNTIME_PUBLICATION_BUNDLE" in row["required_freeze_or_trust_refs"].split("|"),
                "release/runtime trigger row is missing REF_RUNTIME_PUBLICATION_BUNDLE",
            )
            require(
                "REF_RELEASE_PUBLICATION_PARITY" in row["required_freeze_or_trust_refs"].split("|"),
                "release/runtime trigger row is missing REF_RELEASE_PUBLICATION_PARITY",
            )
        for blocker in row["blocked_conditions"].split("|"):
            require(
                blocker.startswith("missing_evidence:")
                or blocker.startswith("stale_authority:")
                or blocker.startswith("forbidden_self_approval:"),
                f"trigger matrix blocker is ambiguous: {blocker}",
            )


def validate_state_machine(payload: dict[str, Any]) -> None:
    require(payload["task_id"] == TASK_ID, "state machine task_id drifted")
    states = {row["state_id"] for row in payload["states"]}
    require(
        states
        == {
            "submitted",
            "evidence_delta_required",
            "advisory_review_pending",
            "clinical_safety_review_pending",
            "independent_safety_review_pending",
            "privacy_security_review_pending",
            "release_approval_pending",
            "approved",
            "blocked",
            "superseded",
        },
        "state machine states drifted",
    )
    require(payload["approval_graph"]["nodes"], "approval graph nodes missing")
    require(payload["approval_graph"]["edges"], "approval graph edges missing")
    rule_ids = {row["rule_id"] for row in payload["actor_separation_rules"]}
    require(
        rule_ids == {row["rule_id"] for row in NO_SELF_APPROVAL_RULES},
        "state machine actor separation rules drifted",
    )
    require(
        set(payload["release_gate_requirement_ids"]) == {row["gate_id"] for row in RELEASE_GATE_REQUIREMENTS},
        "state machine release gate links drifted",
    )


def validate_calendar(payload: dict[str, Any]) -> None:
    require(payload["task_id"] == TASK_ID, "calendar task_id drifted")
    recurring_ids = {row["review_event_id"] for row in payload["recurring_reviews"]}
    event_ids = {row["review_event_id"] for row in payload["event_driven_reviews"]}
    require(
        "REV_125_MONTHLY_CLINICAL_RISK_STANDING" in recurring_ids,
        "calendar is missing monthly standing review",
    )
    require(
        "REV_125_SPRINT_HAZARD_CONTROL_UPDATE" in recurring_ids,
        "calendar is missing sprint hazard update review",
    )
    for required in {
        "REV_125_PREMERGE_MATERIAL_CHANGE",
        "REV_125_RELEASE_CANDIDATE_SAFETY_SIGNOFF",
        "REV_125_POST_INCIDENT_NEAR_MISS",
        "REV_125_STANDARDS_OR_ONBOARDING_DELTA",
        "REV_125_URGENT_OUT_OF_BAND_BLOCKER",
    }:
        require(required in event_ids, f"calendar is missing event-driven review {required}")


def main() -> None:
    validate_deliverables()
    validate_docs()
    validate_package_scripts()

    gate_payload = read_json(GATE_REQUIREMENTS_PATH)
    raci_rows = read_csv(RACI_PATH)
    trigger_rows = read_csv(TRIGGER_MATRIX_PATH)
    state_machine = read_json(STATE_MACHINE_PATH)
    calendar = read_json(CALENDAR_PATH)

    validate_gate_requirements(gate_payload)
    validate_raci(raci_rows)
    validate_trigger_matrix(trigger_rows)
    validate_state_machine(state_machine)
    validate_calendar(calendar)


if __name__ == "__main__":
    main()
