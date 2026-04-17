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

from im1_readiness_pack import (  # noqa: E402
    ACTUAL_TRACK,
    ARTIFACT_INDEX_PATH,
    DEFAULT_REVIEW_DUE_AT,
    DEFAULT_SUBMISSION_REVIEW_DUE_AT,
    DOC_ACTUAL_PATH,
    DOC_MOCK_PATH,
    DOC_READINESS_PATH,
    DOC_SCAL_PATH,
    DOC_SUPPLIER_PATH,
    GAP_REGISTER_PATH,
    MOCK_TRACK,
    OFFICIAL_STAGE_FLOW,
    PAIRING_PACK_PATH,
    PREREQUISITE_MATRIX_PATH,
    PREREQUISITES_FIELD_MAP_PATH,
    REQUIRED_MACHINE_FIELDS,
    REVIEWED_AT,
    SCAL_DOMAIN_SPECS,
    SCAL_QUESTION_BANK_PATH,
    SOURCE_PRECEDENCE,
    STANDARDS_VERSION,
    SUPPLIER_CAPABILITY_FAMILIES,
    SUPPLIER_FAMILIES,
    SUPPLIER_MATRIX_PATH,
    TASK_ID,
)
from root_script_updates import ROOT_SCRIPT_UPDATES  # noqa: E402


PACKAGE_JSON_PATH = ROOT / "package.json"
ROOT_SCRIPT_UPDATES_PATH = ROOT / "tools" / "analysis" / "root_script_updates.py"

DELIVERABLES = [
    DOC_READINESS_PATH,
    DOC_MOCK_PATH,
    DOC_ACTUAL_PATH,
    DOC_SCAL_PATH,
    DOC_SUPPLIER_PATH,
    PREREQUISITE_MATRIX_PATH,
    SCAL_QUESTION_BANK_PATH,
    ARTIFACT_INDEX_PATH,
    SUPPLIER_MATRIX_PATH,
    GAP_REGISTER_PATH,
    ROOT / "tools" / "assurance" / "im1_readiness_pack.py",
    ROOT / "tools" / "assurance" / "validate_im1_readiness_pack.py",
]


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


def split_pipe(value: str | None) -> list[str]:
    if not value:
        return []
    return [part for part in value.split("|") if part]


def path_from_ref(ref: str) -> Path:
    path_str = ref.split("#", 1)[0]
    require(path_str, f"Invalid evidence ref: {ref}")
    return ROOT / path_str


def validate_deliverables() -> None:
    missing = [str(path) for path in DELIVERABLES if not path.exists()]
    require(not missing, "Missing par_123 deliverables:\n" + "\n".join(missing))


def validate_package_scripts() -> None:
    package_json = read_json(PACKAGE_JSON_PATH)
    expected = "python3 ./tools/assurance/validate_im1_readiness_pack.py"
    require(
        package_json["scripts"].get("validate:im1-readiness-pack") == expected,
        "package.json is missing validate:im1-readiness-pack",
    )
    for script_name in ["bootstrap", "check"]:
        require(
            "pnpm validate:im1-readiness-pack" in package_json["scripts"].get(script_name, ""),
            f"package.json script {script_name} is missing pnpm validate:im1-readiness-pack",
        )
    require(
        "python3 ./tools/assurance/im1_readiness_pack.py" in package_json["scripts"].get("codegen", ""),
        "package.json codegen is missing the IM1 readiness builder",
    )
    require(
        ROOT_SCRIPT_UPDATES.get("validate:im1-readiness-pack") == expected,
        "root_script_updates.py is missing validate:im1-readiness-pack",
    )
    for script_name in ["bootstrap", "check"]:
        require(
            "pnpm validate:im1-readiness-pack" in ROOT_SCRIPT_UPDATES.get(script_name, ""),
            f"root_script_updates.py {script_name} is missing pnpm validate:im1-readiness-pack",
        )
    require(
        "python3 ./tools/assurance/im1_readiness_pack.py" in ROOT_SCRIPT_UPDATES.get("codegen", ""),
        "root_script_updates.py codegen is missing the IM1 readiness builder",
    )


def validate_docs() -> None:
    for doc_path in [DOC_READINESS_PATH, DOC_MOCK_PATH, DOC_ACTUAL_PATH, DOC_SCAL_PATH, DOC_SUPPLIER_PATH]:
        text = read_text(doc_path)
        lowered = text.lower()
        require("mock_now_execution".lower() in lowered, f"{doc_path.name} is missing Mock_now_execution")
        require(
            "actual_production_strategy_later".lower() in lowered,
            f"{doc_path.name} is missing Actual_production_strategy_later",
        )
        require(REVIEWED_AT in text, f"{doc_path.name} is missing the reviewed-at date")
    require("GAP_IM1_DSPT_REFRESH_REQUIRED_AFTER_PAR_121" in read_text(DOC_ACTUAL_PATH), "Actual strategy lost the DSPT refresh blocker")
    require("provider-specific" in read_text(DOC_SUPPLIER_PATH).lower(), "Supplier assumptions doc lost provider-specific wording")


def validate_gap_register(gap_register: dict[str, Any]) -> None:
    require(gap_register["task_id"] == TASK_ID, "Gap register task_id drifted")
    require(gap_register["standards_version"]["baseline_id"] == STANDARDS_VERSION["baseline_id"], "Standards baseline drifted")
    gaps = gap_register["gaps"]
    require(gap_register["summary"]["gap_count"] == len(gaps), "Gap count drifted")
    gap_ids = {gap["gap_id"] for gap in gaps}
    required_ids = {
        "GAP_IM1_NAMED_SUBMITTER_AND_SPONSOR_NOT_FIXED",
        "GAP_IM1_PROVIDER_PACK_EMIS_PENDING",
        "GAP_IM1_PROVIDER_PACK_TPP_PENDING",
        "GAP_IM1_DSPT_REFRESH_REQUIRED_AFTER_PAR_121",
        "GAP_IM1_STAGE_ONE_SCAL_TEMPLATE_AND_COMPATIBILITY_ISSUANCE_PENDING",
        "GAP_IM1_MODEL_INTERFACE_LICENCE_SIGNATORIES_PENDING",
        "GAP_IM1_SUPPORTED_TEST_ENTRY_CRITERIA_PENDING",
        "GAP_IM1_AI_OR_MATERIAL_CHANGE_RFC_WATCH_REQUIRED",
    }
    require(required_ids <= gap_ids, "Required IM1 gaps are missing")
    for gap in gaps:
        for field in [
            "gap_id",
            "title",
            "status",
            "priority",
            "supplier_scope",
            "capability_family",
            "official_process_stage",
            "required_prerequisite",
            "current_evidence_ref",
            "owner_role",
            "review_due_at",
            "source_blueprint_refs",
            "notes",
        ]:
            require(field in gap, f"Gap {gap.get('gap_id', '<unknown>')} is missing field {field}")
        require(gap["source_blueprint_refs"], f"Gap {gap['gap_id']} has no source refs")
        require(path_from_ref(gap["current_evidence_ref"]).exists(), f"Gap {gap['gap_id']} has missing evidence ref")


def validate_artifact_index(artifact_index: dict[str, Any]) -> None:
    require(artifact_index["task_id"] == TASK_ID, "Artifact index task_id drifted")
    require(artifact_index["source_precedence"] == SOURCE_PRECEDENCE, "Source precedence drifted")
    require(artifact_index["standards_version"]["baseline_id"] == STANDARDS_VERSION["baseline_id"], "Artifact standards baseline drifted")
    artifacts = artifact_index["artifacts"]
    require(artifact_index["summary"]["artifact_count"] == len(artifacts), "Artifact count drifted")
    require(artifact_index["summary"]["mock_artifact_count"] == len([row for row in artifacts if row["mock_or_actual"] == MOCK_TRACK]), "Mock artifact count drifted")
    require(artifact_index["summary"]["actual_artifact_count"] == len([row for row in artifacts if row["mock_or_actual"] == ACTUAL_TRACK]), "Actual artifact count drifted")
    artifact_ids = set()
    for artifact in artifacts:
        for field in REQUIRED_MACHINE_FIELDS:
            require(field in artifact, f"Artifact {artifact.get('artifact_id', '<unknown>')} is missing field {field}")
        require(artifact["artifact_id"] not in artifact_ids, f"Duplicate artifact id {artifact['artifact_id']}")
        artifact_ids.add(artifact["artifact_id"])
        require(artifact["mock_or_actual"] in {MOCK_TRACK, ACTUAL_TRACK}, f"Invalid track on {artifact['artifact_id']}")
        require(artifact["source_blueprint_refs"], f"Artifact {artifact['artifact_id']} has no source refs")
        require(path_from_ref(artifact["current_evidence_ref"]).exists(), f"Artifact {artifact['artifact_id']} points to missing evidence")
        if artifact["mock_or_actual"] == ACTUAL_TRACK:
            require(
                "123_im1_mock_now_execution.md" not in artifact["current_evidence_ref"]
                and "MOCK_" not in artifact["current_evidence_ref"],
                f"Actual artifact {artifact['artifact_id']} depends on mock-only evidence",
            )
    conversion_steps = artifact_index["conversion_workflow"]
    require(artifact_index["summary"]["conversion_step_count"] == len(conversion_steps), "Conversion step count drifted")
    expected_stage_order = [stage["stage_id"] for stage in OFFICIAL_STAGE_FLOW]
    seen_stage_order = []
    for step in conversion_steps:
        require(step["blockers"], f"Conversion step {step['step_id']} has no blockers")
        seen_stage_order.append(step["official_process_stage"])
    stage_positions = [expected_stage_order.index(stage_id) for stage_id in seen_stage_order]
    require(stage_positions == sorted(stage_positions), "Conversion workflow stage order drifted")
    require(
        "GAP_IM1_PROVIDER_PACK_EMIS_PENDING" in json.dumps(conversion_steps)
        and "GAP_IM1_PROVIDER_PACK_TPP_PENDING" in json.dumps(conversion_steps),
        "Conversion workflow lost the provider-pack blockers",
    )


def validate_prerequisite_matrix(rows: list[dict[str, str]]) -> None:
    field_map = read_json(PREREQUISITES_FIELD_MAP_PATH)
    expected_rows = len(field_map["fields"]) * 2
    require(len(rows) == expected_rows, "Prerequisite matrix row count drifted")
    seen_pairs = set()
    for row in rows:
        for field in ["question_id", "question_group", "question_label", "response_value", *REQUIRED_MACHINE_FIELDS]:
            require(field in row, f"Prerequisite row is missing {field}")
        pair = (row["question_id"], row["mock_or_actual"])
        require(pair not in seen_pairs, f"Duplicate prerequisite row {pair}")
        seen_pairs.add(pair)
        require(path_from_ref(row["current_evidence_ref"]).exists(), f"Prerequisite row {pair} points to missing evidence")
        if row["mock_or_actual"] == ACTUAL_TRACK:
            require(
                "123_im1_mock_now_execution.md" not in row["current_evidence_ref"]
                and "MOCK_" not in row["current_evidence_ref"],
                f"Actual prerequisite row {pair} depends on mock-only evidence",
            )
    for field in field_map["fields"]:
        require((field["field_id"], MOCK_TRACK) in seen_pairs, f"Missing mock row for {field['field_id']}")
        require((field["field_id"], ACTUAL_TRACK) in seen_pairs, f"Missing actual row for {field['field_id']}")


def validate_scal_question_bank(payload: dict[str, Any]) -> None:
    require(payload["task_id"] == TASK_ID, "SCAL question bank task_id drifted")
    questions = payload["questions"]
    require(payload["summary"]["question_count"] == len(questions), "Question count drifted")
    require(
        {question["question_id"] for question in questions} == {item["question_id"] for item in SCAL_DOMAIN_SPECS},
        "SCAL question ids drifted",
    )
    require(
        payload["summary"]["domain_count"] == len({item["assurance_domain"] for item in SCAL_DOMAIN_SPECS}),
        "SCAL domain count drifted",
    )
    required_domains = {
        "architecture_and_product_scope",
        "technical_conformance",
        "clinical_safety",
        "information_governance_and_security",
        "test_evidence_and_simulator_evidence",
        "release_and_change_control_evidence",
        "provider_compatibility_and_licence_gating",
        "supported_test_and_assurance_entry_criteria",
    }
    require({question["assurance_domain"] for question in questions} == required_domains, "SCAL domain coverage drifted")
    for question in questions:
        require(question["source_blueprint_refs"], f"{question['question_id']} has no source refs")
        for track in [MOCK_TRACK, ACTUAL_TRACK]:
            track_payload = question[track]
            for field in REQUIRED_MACHINE_FIELDS:
                require(field in track_payload, f"{question['question_id']} {track} is missing field {field}")
            require(path_from_ref(track_payload["current_evidence_ref"]).exists(), f"{question['question_id']} {track} points to missing evidence")
            if "covered" in track_payload["gap_state"] or "conversion" in track_payload["gap_state"] or "ready" in track_payload["gap_state"]:
                require(track_payload["current_evidence_ref"], f"{question['question_id']} {track} is marked covered without evidence")
            if track == ACTUAL_TRACK:
                require(
                    "123_im1_mock_now_execution.md" not in track_payload["current_evidence_ref"]
                    and "MOCK_" not in track_payload["current_evidence_ref"],
                    f"{question['question_id']} actual track depends on mock-only evidence",
                )


def validate_supplier_matrix(rows: list[dict[str, str]]) -> None:
    expected_rows = len(SUPPLIER_FAMILIES) * len(SUPPLIER_CAPABILITY_FAMILIES) * 2
    require(len(rows) == expected_rows, "Supplier matrix row count drifted")
    seen_pairs = set()
    for row in rows:
        for field in [
            "artifact_id",
            "artifact_type",
            "mock_or_actual",
            "supplier_scope",
            "provider_supplier_name",
            "capability_family",
            "vecells_target_posture",
            "current_track_claim",
            "assumption_note",
            "source_blueprint_refs",
            "current_evidence_ref",
            "gap_state",
            "owner_role",
            "review_due_at",
            "notes",
        ]:
            require(row.get(field), f"Supplier matrix row is missing {field}")
        pair = (row["supplier_scope"], row["capability_family"], row["mock_or_actual"])
        require(pair not in seen_pairs, f"Duplicate supplier matrix row {pair}")
        seen_pairs.add(pair)
        require(path_from_ref(row["current_evidence_ref"]).exists(), f"Supplier row {pair} points to missing evidence")
        require(split_pipe(row["source_blueprint_refs"]), f"Supplier row {pair} has no source refs")
        if row["mock_or_actual"] == ACTUAL_TRACK:
            require(
                "123_im1_mock_now_execution.md" not in row["current_evidence_ref"]
                and "MOCK_" not in row["current_evidence_ref"],
                f"Actual supplier row {pair} depends on mock-only evidence",
            )
    for supplier in SUPPLIER_FAMILIES:
        for capability in SUPPLIER_CAPABILITY_FAMILIES:
            require((supplier["supplier_scope"], capability["capability_family"], MOCK_TRACK) in seen_pairs, "Missing mock supplier coverage")
            require((supplier["supplier_scope"], capability["capability_family"], ACTUAL_TRACK) in seen_pairs, "Missing actual supplier coverage")


def main() -> None:
    validate_deliverables()
    validate_package_scripts()
    validate_docs()
    validate_gap_register(read_json(GAP_REGISTER_PATH))
    validate_artifact_index(read_json(ARTIFACT_INDEX_PATH))
    validate_prerequisite_matrix(read_csv(PREREQUISITE_MATRIX_PATH))
    validate_scal_question_bank(read_json(SCAL_QUESTION_BANK_PATH))
    validate_supplier_matrix(read_csv(SUPPLIER_MATRIX_PATH))


if __name__ == "__main__":
    main()
