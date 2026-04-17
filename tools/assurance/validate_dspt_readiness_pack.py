#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DOCS_DIR = ROOT / "docs" / "assurance"
DATA_DIR = ROOT / "data" / "assurance"

CONTROL_MATRIX_PATH = DATA_DIR / "dspt_control_matrix.csv"
GAP_REGISTER_PATH = DATA_DIR / "dspt_gap_register.json"
EVIDENCE_CATALOG_PATH = DATA_DIR / "dspt_evidence_catalog.json"
FUNCTION_MAP_PATH = DATA_DIR / "essential_function_dependency_map.json"
RACI_PATH = DATA_DIR / "dspt_owner_raci.csv"

DOC_PATHS = [
    DOCS_DIR / "122_dspt_scope_and_responsibility_boundary.md",
    DOCS_DIR / "122_dspt_gap_assessment.md",
    DOCS_DIR / "122_dspt_evidence_plan.md",
    DOCS_DIR / "122_essential_functions_and_dependency_restore_order.md",
    DOCS_DIR / "122_incident_response_and_recovery_evidence_plan.md",
]

ROOT_PACKAGE_PATH = ROOT / "package.json"
ROOT_SCRIPT_UPDATES_PATH = ROOT / "tools" / "analysis" / "root_script_updates.py"

EXPECTED_CONTROL_CODES = {
    "DSPT-BOUNDARY-01",
    "DSPT-DATA-01",
    "DSPT-SEC-01",
    "DSPT-ACC-01",
    "DSPT-AUD-01",
    "DSPT-RUN-01",
    "DSPT-RES-01",
    "DSPT-RES-02",
    "DSPT-IR-01",
    "DSPT-SUP-01",
    "DSPT-CLIN-01",
    "DSPT-DEPLOY-01",
    "DSPT-COMM-01",
    "DSPT-NONPROD-01",
}
EXPECTED_ESSENTIAL_FUNCTIONS = {
    "EF_122_SAFE_INTAKE_AND_URGENT_DIVERSION",
    "EF_122_IDENTITY_SESSION_AND_CONTROLLED_RECOVERY",
    "EF_122_STAFF_REVIEW_AND_MUTATION_SAFETY",
    "EF_122_PATIENT_VISIBILITY_AND_COMMUNICATION_CONTINUITY",
    "EF_122_BOOKING_NETWORK_AND_PHARMACY_TRUTHFUL_STATUS",
    "EF_122_AUDIT_BACKUP_AND_OPERATIONAL_RECOVERY",
}
ALLOWED_BOUNDARIES = {
    "supplier_manufacturer",
    "hosting_operator",
    "end_user_org_deployer",
    "shared_joint_evidence",
    "deployer_detail_pending",
}
EXERCISE_EVIDENCE_FAMILIES = {
    "restore_exercise",
    "incident_exercise_plan",
    "incident_response_plan",
    "recovery_artifact_catalog",
}
EXERCISE_TYPES = {
    "restore_rehearsal",
    "tabletop_planned_not_run",
    "incident_runbook",
}


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def read_text(path: Path) -> str:
    require(path.exists(), f"Missing required artifact: {path}")
    return path.read_text(encoding="utf-8")


def load_json(path: Path):
    return json.loads(read_text(path))


def load_csv(path: Path) -> list[dict[str, str]]:
    return list(csv.DictReader(read_text(path).splitlines()))


def split_pipe(value: str | None) -> list[str]:
    if not value:
        return []
    return [part for part in value.split("|") if part]


def main() -> None:
    control_rows = load_csv(CONTROL_MATRIX_PATH)
    gap_register = load_json(GAP_REGISTER_PATH)
    evidence_catalog = load_json(EVIDENCE_CATALOG_PATH)
    function_map = load_json(FUNCTION_MAP_PATH)
    raci_rows = load_csv(RACI_PATH)

    for doc_path in DOC_PATHS:
        text = read_text(doc_path)
        lowered = text.lower()
        require("mock now execution" in lowered, f"{doc_path.name} is missing Mock Now Execution")
        require(
            "actual production strategy later" in lowered,
            f"{doc_path.name} is missing Actual Production Strategy Later",
        )

    require(gap_register["task_id"] == "par_122", "gap register task_id drifted")
    require(evidence_catalog["task_id"] == "par_122", "evidence catalog task_id drifted")
    require(function_map["task_id"] == "par_122", "essential function map task_id drifted")

    control_codes = {row["control_code"] for row in control_rows}
    require(control_codes == EXPECTED_CONTROL_CODES, "control matrix control set drifted")
    require(len(control_rows) == len(EXPECTED_CONTROL_CODES), "control matrix row count drifted")

    required_columns = {
        "framework_code",
        "framework_version",
        "reviewed_at",
        "control_code",
        "control_title",
        "control_family",
        "supplier_or_deployer_boundary",
        "essential_function_refs",
        "current_state",
        "gap_type",
        "required_evidence_refs",
        "architectural_source_refs",
        "runtime_or_operational_refs",
        "owner_role",
        "due_at",
        "review_cycle",
        "blocking_severity",
        "notes",
    }
    require(required_columns <= set(control_rows[0].keys()), "control matrix is missing required columns")

    evidence_items = evidence_catalog["evidence_items"]
    evidence_by_ref = {item["evidence_ref"]: item for item in evidence_items}
    require(
        evidence_catalog["summary"]["evidence_item_count"] == len(evidence_items),
        "evidence item count drifted",
    )
    seeded_count = sum(1 for item in evidence_items if item["state"] == "seeded_in_repo")
    partial_count = sum(
        1
        for item in evidence_items
        if item["state"] in {"partial_seeded", "placeholder_seeded", "seeded_nonprod_exercise"}
    )
    blocked_count = sum(1 for item in evidence_items if item["state"] == "blocked_on_parallel_task")
    open_count = sum(1 for item in evidence_items if item["state"] == "open_dependency")
    require(evidence_catalog["summary"]["seeded_in_repo_count"] == seeded_count, "seeded evidence count drifted")
    require(
        evidence_catalog["summary"]["partial_or_placeholder_count"] == partial_count,
        "partial or placeholder evidence count drifted",
    )
    require(
        evidence_catalog["summary"]["blocked_dependency_count"] == blocked_count,
        "blocked evidence count drifted",
    )
    require(
        evidence_catalog["summary"]["open_dependency_count"] == open_count,
        "open evidence count drifted",
    )

    boundaries_seen = set()
    for row in control_rows:
        boundary = row["supplier_or_deployer_boundary"]
        require(boundary in ALLOWED_BOUNDARIES, f"Unexpected boundary value: {boundary}")
        boundaries_seen.add(boundary)
        require(row["owner_role"], f"{row['control_code']} is missing owner_role")
        require(row["supplier_or_deployer_boundary"], f"{row['control_code']} is missing boundary")
        require(row["due_at"], f"{row['control_code']} is missing due_at")
        require(row["review_cycle"], f"{row['control_code']} is missing review_cycle")
        evidence_refs = split_pipe(row["required_evidence_refs"])
        require(evidence_refs, f"{row['control_code']} is missing required_evidence_refs")
        for evidence_ref in evidence_refs:
            require(evidence_ref in evidence_by_ref, f"{row['control_code']} references unknown evidence {evidence_ref}")

    require("supplier_manufacturer" in boundaries_seen, "supplier boundary coverage is missing")
    require("end_user_org_deployer" in boundaries_seen, "deployer boundary coverage is missing")
    require("shared_joint_evidence" in boundaries_seen, "shared boundary coverage is missing")
    require(
        all(row["supplier_or_deployer_boundary"] != "supplier_or_deployer" for row in control_rows),
        "supplier and deployer obligations were conflated",
    )

    for item in evidence_items:
        require(item["responsibility_boundary"] in ALLOWED_BOUNDARIES, f"{item['evidence_ref']} has invalid boundary")
        require(item["owner_role"], f"{item['evidence_ref']} is missing owner_role")
        require(item["reviewed_at"], f"{item['evidence_ref']} is missing reviewed_at")
        require(item["artifact_refs"], f"{item['evidence_ref']} is missing artifact_refs")

    function_rows = function_map["essential_functions"]
    dependency_rows = function_map["dependency_catalog"]
    dependency_refs = {row["dependency_ref"] for row in dependency_rows}
    require(
        function_map["summary"]["essential_function_count"] == len(function_rows),
        "essential function count drifted",
    )
    require(
        function_map["summary"]["dependency_count"] == len(dependency_rows),
        "dependency count drifted",
    )
    require(
        {row["essential_function_ref"] for row in function_rows} == EXPECTED_ESSENTIAL_FUNCTIONS,
        "essential function set drifted",
    )
    require(
        len(function_map["restore_order"]) == len(EXPECTED_ESSENTIAL_FUNCTIONS),
        "restore order coverage drifted",
    )

    for row in function_rows:
        require(row["supporting_system_refs"], f"{row['essential_function_ref']} is missing supporting systems")
        require(row["dependency_refs"], f"{row['essential_function_ref']} is missing dependency refs")
        require(row["current_evidence_refs"], f"{row['essential_function_ref']} is missing current evidence refs")
        for dependency_ref in row["dependency_refs"]:
            require(
                dependency_ref in dependency_refs,
                f"{row['essential_function_ref']} references unknown dependency {dependency_ref}",
            )
        for evidence_ref in row["current_evidence_refs"]:
            require(
                evidence_ref in evidence_by_ref,
                f"{row['essential_function_ref']} references unknown evidence {evidence_ref}",
            )

    gaps = gap_register["gaps"]
    require(gap_register["summary"]["gap_count"] == len(gaps), "gap count drifted")
    gap_by_id = {gap["gap_id"]: gap for gap in gaps}
    require(
        "PREREQUISITE_GAP_121_DCB0129_SEED_PACK_PENDING" in gap_by_id,
        "required prerequisite gap is missing",
    )
    require(
        gap_by_id["PREREQUISITE_GAP_121_DCB0129_SEED_PACK_PENDING"]["status"] == "blocked",
        "prerequisite gap lost blocked status",
    )

    for gap in gaps:
        require(gap["responsibility_boundary"] in ALLOWED_BOUNDARIES, f"{gap['gap_id']} has invalid boundary")
        require(gap["owner_role"], f"{gap['gap_id']} is missing owner_role")
        require(gap["reviewed_at"], f"{gap['gap_id']} is missing reviewed_at")
        for control_ref in gap["control_refs"]:
            require(control_ref in EXPECTED_CONTROL_CODES, f"{gap['gap_id']} references unknown control {control_ref}")
        for evidence_ref in gap["required_evidence_refs"]:
            require(evidence_ref in evidence_by_ref, f"{gap['gap_id']} references unknown evidence {evidence_ref}")

    incident_restore_rows = [
        row for row in control_rows if row["control_family"] in {"incident_response", "resilience_and_restore"}
    ]
    for row in incident_restore_rows:
        evidence_refs = split_pipe(row["required_evidence_refs"])
        matched = [
            evidence_by_ref[evidence_ref]
            for evidence_ref in evidence_refs
            if evidence_by_ref[evidence_ref]["evidence_family"] in EXERCISE_EVIDENCE_FAMILIES
            or evidence_by_ref[evidence_ref]["exercise_type"] in EXERCISE_TYPES
        ]
        require(
            bool(matched),
            f"{row['control_code']} must map to at least one incident or restore exercise evidence row",
        )

    require(len(raci_rows) >= 6, "RACI matrix is unexpectedly sparse")
    for row in raci_rows:
        require(row["responsible_role"], f"RACI row {row['artifact_or_control_ref']} is missing responsible_role")
        require(row["accountable_role"], f"RACI row {row['artifact_or_control_ref']} is missing accountable_role")
        require(
            row["responsibility_boundary"] in ALLOWED_BOUNDARIES,
            f"RACI row {row['artifact_or_control_ref']} has invalid boundary",
        )

    scope_doc = read_text(DOC_PATHS[0])
    require("deployer_detail_pending" in scope_doc, "scope boundary doc lost deployer_detail_pending")
    require(
        "PREREQUISITE_GAP_121_DCB0129_SEED_PACK_PENDING" in scope_doc,
        "scope boundary doc lost the explicit prerequisite gap",
    )

    root_package = json.loads(read_text(ROOT_PACKAGE_PATH))
    require(
        root_package["scripts"].get("validate:dspt-readiness-pack")
        == "python3 ./tools/assurance/validate_dspt_readiness_pack.py",
        "root package is missing validate:dspt-readiness-pack",
    )
    root_script_updates_text = read_text(ROOT_SCRIPT_UPDATES_PATH)
    require(
        '"validate:dspt-readiness-pack": "python3 ./tools/assurance/validate_dspt_readiness_pack.py"'
        in root_script_updates_text,
        "root_script_updates.py is missing validate:dspt-readiness-pack",
    )

    print(
        json.dumps(
            {
                "task_id": "par_122",
                "control_count": len(control_rows),
                "evidence_count": len(evidence_items),
                "gap_count": len(gaps),
                "essential_function_count": len(function_rows),
                "boundaries": sorted(boundaries_seen),
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
