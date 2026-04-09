#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path

from build_regulatory_workstreams import (
    ALLOWED_SCHEDULE_CLASSES,
    ALLOWED_TRIGGER_FLAGS,
    ALLOWED_WORKSTREAM_SCOPES,
    ATLAS_MARKERS,
    BOARD_HTML_PATH,
    CHANGE_TRIGGER_CSV_PATH,
    CLINICAL_SAFETY_DOC_PATH,
    EVIDENCE_DOC_PATH,
    EVIDENCE_SCHEDULE_CSV_PATH,
    FRAMEWORK_DOC_PATH,
    FRAMEWORK_MAPPING_CSV_PATH,
    HAZARD_DOC_PATH,
    HAZARD_REGISTER_CSV_PATH,
    MANDATORY_ASSISTIVE_TRIGGER_IDS,
    MANDATORY_FRAMEWORK_CODES,
    MANDATORY_WORKSTREAM_IDS,
    REGULATORY_DOC_PATH,
    WORKSTREAMS_JSON_PATH,
    build_bundle,
    external_dependency_ids,
    load_csv,
    load_json,
)


DELIVERABLES = [
    WORKSTREAMS_JSON_PATH,
    FRAMEWORK_MAPPING_CSV_PATH,
    EVIDENCE_SCHEDULE_CSV_PATH,
    HAZARD_REGISTER_CSV_PATH,
    CHANGE_TRIGGER_CSV_PATH,
    REGULATORY_DOC_PATH,
    CLINICAL_SAFETY_DOC_PATH,
    FRAMEWORK_DOC_PATH,
    EVIDENCE_DOC_PATH,
    HAZARD_DOC_PATH,
    BOARD_HTML_PATH,
]


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def canonicalize(value):
    return json.loads(json.dumps(value))


def load_text(path: Path) -> str:
    assert_true(path.exists(), f"Missing text artifact: {path}")
    return path.read_text()


def validate_deliverables() -> None:
    for path in DELIVERABLES:
        assert_true(path.exists(), f"Missing seq_009 deliverable: {path}")


def validate_payload(payload: dict, expected_payload: dict) -> None:
    assert_true(payload["inventory_id"] == "vecells_regulatory_workstreams_v1", "Unexpected inventory id.")
    assert_true(payload == expected_payload, "Generated seq_009 payload drifted from build output.")

    frameworks = payload["framework_catalog"]
    workstreams = payload["workstreams"]
    mappings = payload["framework_control_mapping"]
    evidence_rows = payload["evidence_artifact_schedule"]
    hazards = payload["safety_hazard_register_seed"]
    triggers = payload["change_control_trigger_matrix"]
    signoff = payload["signoff_topology"]

    framework_codes = {row["framework_code"] for row in frameworks}
    workstream_ids = {row["workstream_id"] for row in workstreams}
    mapping_frameworks = {row["framework_code"] for row in mappings}
    mapping_workstreams = {row["workstream_id"] for row in mappings}

    assert_true(MANDATORY_FRAMEWORK_CODES.issubset(framework_codes), "Mandatory framework coverage is incomplete.")
    assert_true(MANDATORY_WORKSTREAM_IDS.issubset(workstream_ids), "Mandatory workstream coverage is incomplete.")
    assert_true(mapping_frameworks == framework_codes, "Some framework contexts are unmapped.")
    assert_true(mapping_workstreams == workstream_ids, "Some workstreams have no control mappings.")

    assert_true(payload["summary"]["framework_count"] == len(frameworks), "Framework summary count mismatch.")
    assert_true(payload["summary"]["workstream_count"] == len(workstreams), "Workstream summary count mismatch.")
    assert_true(payload["summary"]["control_mapping_count"] == len(mappings), "Control mapping summary count mismatch.")
    assert_true(payload["summary"]["evidence_artifact_count"] == len(evidence_rows), "Evidence summary count mismatch.")
    assert_true(payload["summary"]["hazard_seed_count"] == len(hazards), "Hazard summary count mismatch.")
    assert_true(payload["summary"]["change_trigger_count"] == len(triggers), "Trigger summary count mismatch.")
    assert_true(payload["summary"]["signoff_role_count"] == len(signoff["nodes"]), "Signoff role count mismatch.")
    assert_true(payload["summary"]["signoff_edge_count"] == len(signoff["edges"]), "Signoff edge count mismatch.")
    assert_true(payload["summary"]["gap_count"] == 0, "Unexpected unresolved gaps in seq_009 payload.")

    dependency_ids = external_dependency_ids()
    for row in workstreams:
        assert_true(row["baseline_scope"] in ALLOWED_WORKSTREAM_SCOPES, f"Invalid workstream scope: {row['workstream_id']}")
        assert_true(row["framework_or_governance_basis"], f"Workstream missing framework basis: {row['workstream_id']}")
        assert_true(row["triggering_changes"], f"Workstream missing trigger classes: {row['workstream_id']}")
        assert_true(row["required_artifacts"], f"Workstream missing required artifacts: {row['workstream_id']}")
        assert_true(row["required_reviews_or_signoffs"], f"Workstream missing signoff path: {row['workstream_id']}")
        assert_true(row["blocking_release_conditions"], f"Workstream missing blocking conditions: {row['workstream_id']}")
        for ref in row["dependency_refs"]:
            if ref.startswith("WS_"):
                assert_true(ref in workstream_ids, f"Workstream dependency ref is unknown: {ref}")
            elif ref.startswith("dep_"):
                assert_true(ref in dependency_ids, f"External dependency ref is unknown: {ref}")

    deferred_rows = [row for row in workstreams if row["baseline_scope"] == "deferred_phase7"]
    assert_true(
        {row["workstream_id"] for row in deferred_rows} == {"WS_NHS_APP_SCAL_CHANNEL"},
        "Deferred Phase 7 labelling drifted outside the NHS App channel workstream.",
    )
    for row in mappings:
        assert_true(row["framework_code"] in framework_codes, f"Unknown mapping framework: {row['mapping_id']}")
        assert_true(row["workstream_id"] in workstream_ids, f"Unknown mapping workstream: {row['mapping_id']}")
        if row["framework_code"] in {"FW_SCAL", "FW_NHS_APP_WEB_INTEGRATION"}:
            assert_true(
                row["baseline_scope"] == "deferred_phase7",
                f"Deferred NHS App mapping mislabelled as baseline: {row['mapping_id']}",
            )

    trigger_ids = {row["change_trigger_id"] for row in triggers}
    assert_true(MANDATORY_ASSISTIVE_TRIGGER_IDS.issubset(trigger_ids), "Assistive trigger coverage is incomplete.")
    for row in triggers:
        assert_true(
            row["trigger_hazard_log_update"] in ALLOWED_TRIGGER_FLAGS
            and row["trigger_safety_case_delta"] in ALLOWED_TRIGGER_FLAGS
            and row["trigger_dpia_rerun"] in ALLOWED_TRIGGER_FLAGS
            and row["trigger_dtac_delta"] in ALLOWED_TRIGGER_FLAGS
            and row["trigger_release_freeze"] in ALLOWED_TRIGGER_FLAGS
            and row["trigger_partner_rfc_or_scal_update"] in ALLOWED_TRIGGER_FLAGS,
            f"Trigger row contains invalid flag values: {row['change_trigger_id']}",
        )
        assert_true(row["required_signoff_classes"], f"Trigger row missing signoff classes: {row['change_trigger_id']}")
        assert_true(row["required_rehearsal_classes"], f"Trigger row missing rehearsal classes: {row['change_trigger_id']}")

    for trigger_id in MANDATORY_ASSISTIVE_TRIGGER_IDS:
        row = next(item for item in triggers if item["change_trigger_id"] == trigger_id)
        assert_true(
            any(
                row[key] in {"yes", "conditional"}
                for key in (
                    "trigger_hazard_log_update",
                    "trigger_safety_case_delta",
                    "trigger_dpia_rerun",
                    "trigger_dtac_delta",
                    "trigger_release_freeze",
                    "trigger_partner_rfc_or_scal_update",
                )
            ),
            f"Assistive trigger has no routed actions: {trigger_id}",
        )

    evidence_by_id = {row["artifact_schedule_id"]: row for row in evidence_rows}
    for row in evidence_rows:
        assert_true(row["schedule_class"] in ALLOWED_SCHEDULE_CLASSES, f"Invalid schedule class: {row['artifact_schedule_id']}")
        assert_true(row["workstream_id"] in workstream_ids, f"Evidence row references unknown workstream: {row['artifact_schedule_id']}")
        assert_true(row["release_or_operational_gate"], f"Evidence row missing gate linkage: {row['artifact_schedule_id']}")
    assert_true(
        any(
            row["workstream_id"] == "WS_CLINICAL_MANUFACTURER" and row["schedule_class"] == "pre_release"
            for row in evidence_rows
        ),
        "Baseline release evidence omits pre-release clinical safety artifacts.",
    )
    assert_true(
        any(
            row["workstream_id"] == "WS_RELEASE_RUNTIME_PUBLICATION_PARITY" and row["schedule_class"] == "pre_release"
            for row in evidence_rows
        ),
        "Baseline release evidence omits release/publication parity artifacts.",
    )
    assert_true(
        any(
            row["workstream_id"] == "WS_OPERATIONAL_RESILIENCE_RESTORE" and row["schedule_class"] == "pre_release"
            for row in evidence_rows
        ),
        "Baseline release evidence omits restore/recovery artifacts.",
    )

    hazard_ids = {row["hazard_id"] for row in hazards}
    assert_true(len(hazard_ids) >= 11, "Hazard seed is unexpectedly small.")
    for row in hazards:
        assert_true(row["required_controls"], f"Hazard row missing required controls: {row['hazard_id']}")
        assert_true(row["required_evidence"], f"Hazard row missing evidence: {row['hazard_id']}")
        assert_true(row["primary_workstream_ids"], f"Hazard row missing workstream ownership: {row['hazard_id']}")

    signoff_nodes = {row["role_code"] for row in signoff["nodes"]}
    assert_true("ROLE_RELEASE_MANAGER" in signoff_nodes, "Release Manager role missing from signoff topology.")
    for row in signoff["edges"]:
        assert_true(row["from_role_code"] in signoff_nodes, f"Unknown signoff source role: {row['edge_id']}")
        assert_true(row["to_role_code"] in signoff_nodes, f"Unknown signoff target role: {row['edge_id']}")
        assert_true(
            row["from_role_code"] != row["to_role_code"],
            f"Signoff edge collapses into self-approval: {row['edge_id']}",
        )
        assert_true(row["independence_rule"], f"Signoff edge missing independence rule: {row['edge_id']}")


def validate_csv_artifacts(payload: dict) -> None:
    mapping_csv = load_csv(FRAMEWORK_MAPPING_CSV_PATH)
    evidence_csv = load_csv(EVIDENCE_SCHEDULE_CSV_PATH)
    hazard_csv = load_csv(HAZARD_REGISTER_CSV_PATH)
    trigger_csv = load_csv(CHANGE_TRIGGER_CSV_PATH)

    assert_true(
        len(mapping_csv) == len(payload["framework_control_mapping"]),
        "Framework mapping CSV row count mismatch.",
    )
    assert_true(
        len(evidence_csv) == len(payload["evidence_artifact_schedule"]),
        "Evidence schedule CSV row count mismatch.",
    )
    assert_true(
        len(hazard_csv) == len(payload["safety_hazard_register_seed"]),
        "Hazard register CSV row count mismatch.",
    )
    assert_true(
        len(trigger_csv) == len(payload["change_control_trigger_matrix"]),
        "Trigger matrix CSV row count mismatch.",
    )

    assert_true(
        {row["mapping_id"] for row in mapping_csv} == {row["mapping_id"] for row in payload["framework_control_mapping"]},
        "Framework mapping CSV identifiers drifted.",
    )
    assert_true(
        {row["artifact_schedule_id"] for row in evidence_csv} == {row["artifact_schedule_id"] for row in payload["evidence_artifact_schedule"]},
        "Evidence CSV identifiers drifted.",
    )
    assert_true(
        {row["hazard_id"] for row in hazard_csv} == {row["hazard_id"] for row in payload["safety_hazard_register_seed"]},
        "Hazard CSV identifiers drifted.",
    )
    assert_true(
        {row["change_trigger_id"] for row in trigger_csv} == {row["change_trigger_id"] for row in payload["change_control_trigger_matrix"]},
        "Trigger CSV identifiers drifted.",
    )


def validate_docs_and_html(payload: dict) -> None:
    for path in [
        REGULATORY_DOC_PATH,
        CLINICAL_SAFETY_DOC_PATH,
        FRAMEWORK_DOC_PATH,
        EVIDENCE_DOC_PATH,
        HAZARD_DOC_PATH,
    ]:
        text = load_text(path)
        assert_true(text.startswith("# "), f"Documentation file missing heading: {path}")
        assert_true(len(text.splitlines()) >= 6, f"Documentation file looks empty: {path}")

    html_text = load_text(BOARD_HTML_PATH)
    for marker in ATLAS_MARKERS:
        assert_true(marker in html_text, f"Missing board marker: {marker}")
    assert_true(payload["inventory_id"] in html_text, "Board does not embed the seq_009 payload.")
    assert_true("Regulatory and clinical-safety workstreams" in html_text, "Board title missing.")
    assert_true("Editorial operating model, not a checklist" in html_text, "Board hero copy missing.")
    assert_true("Deferred NHS App obligations stay visually separate" in html_text, "Board does not call out deferred Phase 7 posture.")


def main() -> None:
    validate_deliverables()
    expected_bundle = build_bundle()
    payload = load_json(WORKSTREAMS_JSON_PATH)
    validate_payload(payload, canonicalize(expected_bundle["payload"]))
    validate_csv_artifacts(payload)
    validate_docs_and_html(payload)
    print(
        f"Validated seq_009 regulatory workstreams with "
        f"{payload['summary']['workstream_count']} workstreams, "
        f"{payload['summary']['framework_count']} frameworks, and "
        f"{payload['summary']['hazard_seed_count']} seeded hazards."
    )


if __name__ == "__main__":
    main()
