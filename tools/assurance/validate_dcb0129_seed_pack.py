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

from dcb0129_seed_pack import (  # noqa: E402
    CHANGE_CONTROL_PATHS,
    CONTROL_CATALOG,
    EVIDENCE_CATALOG,
    GAP_RESOLUTIONS,
    HAZARD_CSV_COLUMNS,
    HAZARDS,
    HAZARD_TAXONOMY,
    NON_APPLICABILITY_RECORD_ID,
    PREREQUISITES,
    PROCEDURE_CATALOG,
    REQUIRED_HAZARD_FIELDS,
    REVIEW_EVENTS,
    ROLE_PLACEHOLDERS,
    TASK_ID,
    TRACEABILITY_CSV_COLUMNS,
)
from root_script_updates import ROOT_SCRIPT_UPDATES  # noqa: E402


DOCS_DIR = ROOT / "docs" / "assurance"
DATA_DIR = ROOT / "data" / "assurance"
TOOLS_DIR = ROOT / "tools" / "assurance"
PACKAGE_JSON_PATH = ROOT / "package.json"
ROOT_SCRIPT_UPDATES_PATH = ROOT / "tools" / "analysis" / "root_script_updates.py"

DELIVERABLES = [
    DOCS_DIR / "121_dcb0129_clinical_risk_management_plan.md",
    DOCS_DIR / "121_dcb0129_hazard_log_structure.md",
    DOCS_DIR / "121_dcb0129_clinical_safety_case_structure.md",
    DOCS_DIR / "121_hazard_identification_and_control_taxonomy.md",
    DOCS_DIR / "121_change_control_and_safety_update_workflow.md",
    DATA_DIR / "dcb0129_hazard_register.csv",
    DATA_DIR / "dcb0129_hazard_register.json",
    DATA_DIR / "dcb0129_hazard_to_control_traceability.csv",
    DATA_DIR / "dcb0129_safety_case_outline.json",
    DATA_DIR / "dcb0129_review_events.json",
    TOOLS_DIR / "validate_dcb0129_seed_pack.py",
]

HIGH_SEVERITY_BANDS = {"high", "critical"}
REQUIRED_CLOSE_TOKENS = {"hazard_register_updated", "non_applicability_recorded"}


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def read_text(path: Path) -> str:
    require(path.exists(), f"Missing required file: {path}")
    return path.read_text(encoding="utf-8")


def read_json(path: Path) -> Any:
    return json.loads(read_text(path))


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def validate_deliverables() -> None:
    missing = [str(path) for path in DELIVERABLES if not path.exists()]
    require(not missing, "Missing par_121 deliverables:\n" + "\n".join(missing))


def validate_package_scripts() -> None:
    package_json = read_json(PACKAGE_JSON_PATH)
    expected = "python3 ./tools/assurance/validate_dcb0129_seed_pack.py"
    require(
        package_json["scripts"].get("validate:dcb0129-seed-pack") == expected,
        "package.json is missing validate:dcb0129-seed-pack",
    )
    for script_name in ["bootstrap", "check"]:
        require(
            "pnpm validate:dcb0129-seed-pack" in package_json["scripts"].get(script_name, ""),
            f"package.json script {script_name} is missing pnpm validate:dcb0129-seed-pack",
        )
    require(
        package_json["scripts"].get("codegen", "").find("python3 ./tools/assurance/dcb0129_seed_pack.py") >= 0,
        "package.json codegen is missing the DCB0129 seed pack builder",
    )
    require(
        ROOT_SCRIPT_UPDATES.get("validate:dcb0129-seed-pack") == expected,
        "root_script_updates.py is missing validate:dcb0129-seed-pack",
    )
    for script_name in ["bootstrap", "check", "codegen"]:
        require(
            "dcb0129_seed_pack.py" in ROOT_SCRIPT_UPDATES.get(script_name, "") or script_name != "codegen",
            f"root_script_updates.py {script_name} is missing the DCB0129 builder",
        )
        if script_name in {"bootstrap", "check"}:
            require(
                "pnpm validate:dcb0129-seed-pack" in ROOT_SCRIPT_UPDATES.get(script_name, ""),
                f"root_script_updates.py {script_name} is missing the DCB0129 validator",
            )


def validate_hazard_register(register: dict[str, Any]) -> None:
    require(register["task_id"] == TASK_ID, "Hazard register task_id drifted")
    require(register["summary"]["hazard_count"] == len(HAZARDS), "Hazard count drifted")
    require(len(register["hazard_taxonomy"]) == len(HAZARD_TAXONOMY), "Hazard taxonomy count drifted")
    require(len(register["gap_resolutions"]) == len(GAP_RESOLUTIONS), "Gap resolution count drifted")
    require(len(register["prerequisite_snapshot"]) == len(PREREQUISITES), "Prerequisite snapshot count drifted")

    control_ids = {control["control_id"] for control in CONTROL_CATALOG}
    evidence_ids = {item["evidence_id"] for item in EVIDENCE_CATALOG}
    procedure_ids = {procedure["procedure_id"] for procedure in PROCEDURE_CATALOG}
    trigger_ids = {trigger["trigger_id"] for trigger in read_json(DATA_DIR / "dcb0129_review_events.json")["change_trigger_catalog"]}
    hazard_ids = {hazard["hazard_id"] for hazard in HAZARDS}

    require(
        {hazard["hazard_id"] for hazard in register["hazards"]} == hazard_ids,
        "Hazard register IDs drifted",
    )
    require(
        register["summary"]["future_detail_pending_count"]
        == len([hazard for hazard in HAZARDS if hazard["status"] == "future_detail_pending"]),
        "Future-detail count drifted",
    )

    for prerequisite in register["prerequisite_snapshot"]:
        require(prerequisite["status"] == "available", f"Prerequisite not available: {prerequisite['prerequisite_id']}")
        require(Path(prerequisite["absolute_path"]).exists(), f"Prerequisite path missing: {prerequisite['absolute_path']}")

    for hazard in register["hazards"]:
        for field in REQUIRED_HAZARD_FIELDS:
            require(field in hazard, f"Hazard {hazard['hazard_id']} is missing field {field}")
        require(hazard["source_blueprint_refs"], f"Hazard {hazard['hazard_id']} has no source reference")
        require(hazard["review_owner_role"], f"Hazard {hazard['hazard_id']} has no owner role")
        require(hazard["severity_band"], f"Hazard {hazard['hazard_id']} has no severity")
        require(hazard["next_review_due_at"], f"Hazard {hazard['hazard_id']} has no next review date")
        require(hazard["verification_evidence_refs"], f"Hazard {hazard['hazard_id']} has no evidence refs")
        require(hazard["change_trigger_refs"], f"Hazard {hazard['hazard_id']} has no change trigger refs")
        if hazard["severity_band"] in HIGH_SEVERITY_BANDS:
            require(
                hazard["independent_reviewer_role"],
                f"High-severity hazard {hazard['hazard_id']} lacks an independent reviewer role",
            )
        for control_ref in hazard["causal_controls_existing"] + hazard["causal_controls_required"]:
            require(control_ref in control_ids, f"Hazard {hazard['hazard_id']} references unknown control {control_ref}")
        for evidence_ref in hazard["verification_evidence_refs"]:
            require(
                evidence_ref in evidence_ids,
                f"Hazard {hazard['hazard_id']} references unknown evidence placeholder {evidence_ref}",
            )
        for trigger_ref in hazard["change_trigger_refs"]:
            require(trigger_ref in trigger_ids, f"Hazard {hazard['hazard_id']} references unknown trigger {trigger_ref}")
        for procedure_ref in hazard["operational_procedure_refs"]:
            require(
                procedure_ref in procedure_ids,
                f"Hazard {hazard['hazard_id']} references unknown procedure {procedure_ref}",
            )


def validate_csvs(register: dict[str, Any]) -> None:
    hazard_rows = read_csv(DATA_DIR / "dcb0129_hazard_register.csv")
    trace_rows = read_csv(DATA_DIR / "dcb0129_hazard_to_control_traceability.csv")
    require(
        list(hazard_rows[0].keys()) == HAZARD_CSV_COLUMNS,
        "Hazard register CSV columns drifted",
    )
    require(
        list(trace_rows[0].keys()) == TRACEABILITY_CSV_COLUMNS,
        "Traceability CSV columns drifted",
    )
    require(len(hazard_rows) == len(HAZARDS), "Hazard register CSV row count drifted")
    require(len(trace_rows) == len(HAZARDS), "Traceability CSV row count drifted")

    hazard_ids = {hazard["hazard_id"] for hazard in register["hazards"]}
    require({row["hazard_id"] for row in hazard_rows} == hazard_ids, "Hazard CSV IDs drifted")
    require({row["hazard_id"] for row in trace_rows} == hazard_ids, "Traceability CSV IDs drifted")

    control_ids = {control["control_id"] for control in CONTROL_CATALOG}
    evidence_ids = {item["evidence_id"] for item in EVIDENCE_CATALOG}
    procedure_ids = {procedure["procedure_id"] for procedure in PROCEDURE_CATALOG}
    review_event_ids = {event["review_event_id"] for event in REVIEW_EVENTS}

    for row in trace_rows:
        control_refs = [ref for ref in row["existing_control_refs"].split("|") if ref] + [
            ref for ref in row["required_control_refs"].split("|") if ref
        ]
        require(control_refs, f"Traceability row {row['hazard_id']} has no control refs")
        for control_ref in control_refs:
            require(control_ref in control_ids, f"Traceability row {row['hazard_id']} has unknown control {control_ref}")
        for evidence_ref in [ref for ref in row["verification_evidence_refs"].split("|") if ref]:
            require(
                evidence_ref in evidence_ids,
                f"Traceability row {row['hazard_id']} has unknown evidence placeholder {evidence_ref}",
            )
        for procedure_ref in [ref for ref in row["operational_procedure_refs"].split("|") if ref]:
            require(
                procedure_ref in procedure_ids,
                f"Traceability row {row['hazard_id']} has unknown procedure {procedure_ref}",
            )
        for review_event_ref in [ref for ref in row["review_event_refs"].split("|") if ref]:
            require(
                review_event_ref in review_event_ids,
                f"Traceability row {row['hazard_id']} has unknown review event {review_event_ref}",
            )


def validate_safety_case(case_outline: dict[str, Any]) -> None:
    require(case_outline["task_id"] == TASK_ID, "Safety case task_id drifted")
    require(case_outline["summary"]["hazard_count"] == len(HAZARDS), "Safety case hazard count drifted")
    require(case_outline["summary"]["control_count"] == len(CONTROL_CATALOG), "Safety case control count drifted")
    require(case_outline["summary"]["evidence_count"] == len(EVIDENCE_CATALOG), "Safety case evidence count drifted")
    require(case_outline["summary"]["review_event_count"] == len(REVIEW_EVENTS), "Safety case review event count drifted")
    require(case_outline["summary"]["change_control_path_count"] == len(CHANGE_CONTROL_PATHS), "Safety case path count drifted")
    require(len(case_outline["role_placeholders"]) == len(ROLE_PLACEHOLDERS), "Role placeholder count drifted")
    require(len(case_outline["control_catalog"]) == len(CONTROL_CATALOG), "Control catalog drifted")
    require(len(case_outline["evidence_catalog"]) == len(EVIDENCE_CATALOG), "Evidence catalog drifted")


def validate_review_events(review_payload: dict[str, Any]) -> None:
    require(review_payload["task_id"] == TASK_ID, "Review event payload task_id drifted")
    require(review_payload["non_applicability_record_id"] == NON_APPLICABILITY_RECORD_ID, "Non-applicability record drifted")
    require(len(review_payload["review_events"]) == len(REVIEW_EVENTS), "Review event count drifted")
    require(len(review_payload["change_control_paths"]) == len(CHANGE_CONTROL_PATHS), "Change-control path count drifted")

    for event in review_payload["review_events"]:
        require(event["no_self_approval"], f"Review event {event['review_event_id']} lost no-self-approval")
        require(event["supports_non_applicability_record"], f"Review event {event['review_event_id']} lost non-applicability support")
        require(
            "hazard_register_updated" in event["required_close_tokens"],
            f"Review event {event['review_event_id']} lost hazard-update close token",
        )
        require(
            "non_applicability_recorded" in event["alternative_close_tokens"],
            f"Review event {event['review_event_id']} lost non-applicability close token",
        )

    for path in review_payload["change_control_paths"]:
        close_tokens = set(path["close_tokens"]) | set(path["alternative_close_tokens"])
        require(
            REQUIRED_CLOSE_TOKENS.issubset(close_tokens),
            f"Change-control path {path['path_id']} can close without hazard update or explicit non-applicability",
        )
        require(path["no_self_approval"], f"Change-control path {path['path_id']} lost no-self-approval")


def validate_docs() -> None:
    risk_plan = read_text(DOCS_DIR / "121_dcb0129_clinical_risk_management_plan.md")
    for token in [
        "Section A — `Mock_now_execution`",
        "Section B — `Actual_production_strategy_later`",
        "Manufacturer scope",
        "Deployer scope",
    ]:
        require(token in risk_plan, f"Risk management plan lost {token}")

    hazard_doc = read_text(DOCS_DIR / "121_dcb0129_hazard_log_structure.md")
    require("Hazard Register Fields" in hazard_doc, "Hazard log structure doc lost schema section")

    safety_case_doc = read_text(DOCS_DIR / "121_dcb0129_clinical_safety_case_structure.md")
    require("Control Strategy By Architecture Layer" in safety_case_doc, "Safety case doc lost architecture layer section")

    taxonomy_doc = read_text(DOCS_DIR / "121_hazard_identification_and_control_taxonomy.md")
    require("Control Catalog" in taxonomy_doc, "Taxonomy doc lost control catalog section")

    workflow_doc = read_text(DOCS_DIR / "121_change_control_and_safety_update_workflow.md")
    for token in [
        "Non-Negotiable Approval Rules",
        "High-severity hazards may not close without",
        "non_applicability_recorded",
    ]:
        require(token in workflow_doc, f"Workflow doc lost {token}")


def main() -> None:
    validate_deliverables()
    validate_package_scripts()

    register = read_json(DATA_DIR / "dcb0129_hazard_register.json")
    safety_case = read_json(DATA_DIR / "dcb0129_safety_case_outline.json")
    review_payload = read_json(DATA_DIR / "dcb0129_review_events.json")

    validate_hazard_register(register)
    validate_csvs(register)
    validate_safety_case(safety_case)
    validate_review_events(review_payload)
    validate_docs()

    print(
        json.dumps(
            {
                "task_id": TASK_ID,
                "hazard_count": len(register["hazards"]),
                "control_count": len(CONTROL_CATALOG),
                "review_event_count": len(review_payload["review_events"]),
                "prerequisite_count": len(PREREQUISITES),
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
