#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path

from build_data_classification_model import (
    ALLOWED_ARTIFACT_CEILINGS,
    ALLOWED_AUDIT_REPLAY_CEILINGS,
    ALLOWED_BREAK_GLASS_BEHAVIORS,
    ALLOWED_DETAIL_CEILINGS,
    ALLOWED_LOG_CEILINGS,
    ALLOWED_MATERIALIZATION_RULES,
    ALLOWED_PHI_FLAGS,
    ALLOWED_POST_DELIVERY_WIDENING,
    ALLOWED_PREVIEW_CEILINGS,
    ALLOWED_SENSITIVITY_CLASSES,
    ALLOWED_TELEMETRY_CEILINGS,
    ALLOWED_WRONG_PATIENT_RULES,
    ARTIFACT_SENSITIVITY_PATH,
    ATLAS_HTML_PATH,
    ATLAS_MARKERS,
    AUDIENCE_SURFACE_PATH,
    AUDIT_DISCLOSURE_PATH,
    AUDIT_DOC_PATH,
    BREAK_GLASS_DOC_PATH,
    BREAK_GLASS_PATH,
    CLASSIFICATION_DOC_PATH,
    CLASSIFICATION_MATRIX_PATH,
    FIELD_SENSITIVITY_PATH,
    MASKING_DOC_PATH,
    REDACTION_POLICY_PATH,
    RETENTION_DOC_PATH,
    build_bundle,
    csv_rowify,
    load_csv,
    load_json,
)


DELIVERABLES = [
    CLASSIFICATION_MATRIX_PATH,
    FIELD_SENSITIVITY_PATH,
    REDACTION_POLICY_PATH,
    AUDIT_DISCLOSURE_PATH,
    BREAK_GLASS_PATH,
    ARTIFACT_SENSITIVITY_PATH,
    CLASSIFICATION_DOC_PATH,
    MASKING_DOC_PATH,
    AUDIT_DOC_PATH,
    BREAK_GLASS_DOC_PATH,
    RETENTION_DOC_PATH,
    ATLAS_HTML_PATH,
]


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def load_text(path: Path) -> str:
    assert_true(path.exists(), f"Missing text artifact: {path}")
    return path.read_text()


def canonicalize(value):
    return json.loads(json.dumps(value))


def validate_deliverables() -> None:
    for path in DELIVERABLES:
        assert_true(path.exists(), f"Missing seq_010 deliverable: {path}")


def validate_payload(payload: dict[str, object]) -> None:
    assert_true(payload["model_id"] == "vecells_data_classification_model_v1", "Unexpected model id for seq_010.")

    summary = payload["summary"]
    matrix_rows = payload["data_classification_matrix"]
    surface_rows = payload["surface_policy_rows"]
    field_catalog = payload["field_sensitivity_catalog"]
    field_rows = field_catalog["fields"]
    policies = payload["redaction_policy_matrix"]
    audit_rows = payload["audit_event_disclosure_matrix"]
    artifact_rows = payload["artifact_sensitivity_matrix"]
    break_glass = payload["break_glass_scope_rules"]

    assert_true(summary["matrix_row_count"] == len(matrix_rows), "Matrix row summary mismatch.")
    assert_true(summary["surface_policy_count"] == len(surface_rows), "Surface policy summary mismatch.")
    assert_true(summary["field_catalog_count"] == len(field_rows), "Field catalog summary mismatch.")
    assert_true(summary["artifact_family_count"] == len(artifact_rows), "Artifact summary mismatch.")
    assert_true(summary["audit_family_count"] == len(audit_rows), "Audit family summary mismatch.")
    assert_true(summary["redaction_policy_count"] == len(policies), "Redaction policy summary mismatch.")
    assert_true(summary["unresolved_gap_count"] == 0, "Unexpected unresolved gaps remain in seq_010.")
    assert_true(field_catalog["summary"]["field_count"] == len(field_rows), "Field catalog JSON summary mismatch.")

    surface_inventory = load_csv(AUDIENCE_SURFACE_PATH)
    expected_surface_ids = {row["surface_id"] for row in surface_inventory}
    actual_surface_ids = {row["surface_id"] for row in surface_rows}
    assert_true(actual_surface_ids == expected_surface_ids, "Audience-surface coverage is incomplete or drifted.")

    policy_refs = {row["redaction_policy_ref"] for row in policies}

    for row in matrix_rows:
        assert_true(row["sensitivity_class"] in ALLOWED_SENSITIVITY_CLASSES, f"Invalid sensitivity class: {row['classification_row_id']}")
        assert_true(row["contains_phi"] in ALLOWED_PHI_FLAGS, f"Invalid PHI flag: {row['classification_row_id']}")
        assert_true(row["preview_ceiling"] in ALLOWED_PREVIEW_CEILINGS, f"Invalid preview ceiling: {row['classification_row_id']}")
        assert_true(row["detail_ceiling"] in ALLOWED_DETAIL_CEILINGS, f"Invalid detail ceiling: {row['classification_row_id']}")
        assert_true(row["artifact_ceiling"] in ALLOWED_ARTIFACT_CEILINGS, f"Invalid artifact ceiling: {row['classification_row_id']}")
        assert_true(row["telemetry_ceiling"] in ALLOWED_TELEMETRY_CEILINGS, f"Invalid telemetry ceiling: {row['classification_row_id']}")
        assert_true(row["log_ceiling"] in ALLOWED_LOG_CEILINGS, f"Invalid log ceiling: {row['classification_row_id']}")
        assert_true(row["audit_replay_ceiling"] in ALLOWED_AUDIT_REPLAY_CEILINGS, f"Invalid audit ceiling: {row['classification_row_id']}")
        assert_true(row["break_glass_behavior"] in ALLOWED_BREAK_GLASS_BEHAVIORS, f"Invalid break-glass behavior: {row['classification_row_id']}")
        assert_true(row["materialization_rule"] in ALLOWED_MATERIALIZATION_RULES, f"Invalid materialization rule: {row['classification_row_id']}")
        assert_true(row["post_delivery_widening"] in ALLOWED_POST_DELIVERY_WIDENING, f"Invalid widening posture: {row['classification_row_id']}")
        assert_true(row["wrong_patient_hold_behavior"] in ALLOWED_WRONG_PATIENT_RULES, f"Invalid wrong-patient posture: {row['classification_row_id']}")
        assert_true(row["redaction_policy_ref"] in policy_refs, f"Missing policy ref on matrix row: {row['classification_row_id']}")
        if row["contains_phi"] != "no" or row["sensitivity_class"] not in {"public_safe", "operational_internal_non_phi"}:
            assert_true(row["redaction_policy_ref"], f"Sensitive row missing policy ref: {row['classification_row_id']}")
        if row["classification_scope"] == "surface_projection":
            assert_true(len(row["allowed_audience_tiers"]) == 1, f"Surface row should bind one audience tier: {row['classification_row_id']}")
            assert_true(len(row["allowed_purposes_of_use"]) == 1, f"Surface row should bind one purpose of use: {row['classification_row_id']}")

    patient_public_rows = [row for row in surface_rows if row["allowed_audience_tiers"] == ["patient_public"]]
    grant_rows = [row for row in surface_rows if row["allowed_audience_tiers"] == ["patient_grant_scoped"]]
    assert_true(patient_public_rows, "patient_public coverage is missing.")
    assert_true(grant_rows, "patient_grant_scoped coverage is missing.")
    assert_true(
        all(row["detail_ceiling"] in {"summary_only", "recovery_only"} for row in patient_public_rows),
        "patient_public rows widened beyond summary-safe detail.",
    )
    assert_true(
        all(row["preview_ceiling"] in {"masked_summary", "awareness_only"} for row in patient_public_rows),
        "patient_public previews drifted beyond summary-safe posture.",
    )

    embedded_row = next((row for row in surface_rows if row["surface_id"] == "surf_patient_embedded_shell"), None)
    assert_true(embedded_row is not None, "Embedded patient surface is missing.")
    assert_true(
        embedded_row["artifact_ceiling"] != "governed_download",
        "Embedded patient surface illegally allows ordinary governed download posture.",
    )

    for surface_id in [
        "surf_patient_home",
        "surf_patient_requests",
        "surf_patient_appointments",
        "surf_patient_health_record",
        "surf_patient_messages",
        "surf_patient_embedded_shell",
        "surf_support_ticket_workspace",
        "surf_support_replay_observe",
    ]:
        row = next(item for item in surface_rows if item["surface_id"] == surface_id)
        assert_true(
            row["wrong_patient_hold_behavior"] != "not_applicable",
            f"Wrong-patient cache suppression missing on {surface_id}.",
        )

    support_replay = next(item for item in surface_rows if item["surface_id"] == "surf_support_replay_observe")
    assert_true(
        support_replay["break_glass_behavior"] == "pivot_to_governance_investigation",
        "Support replay must pivot to governance investigation rather than widening in place.",
    )

    governance_row = next(item for item in surface_rows if item["surface_id"] == "surf_governance_shell")
    assert_true(
        governance_row["audit_replay_ceiling"] == "full_evidence_with_scope",
        "Governance shell must carry full evidence with scope for investigation/export.",
    )

    for row in artifact_rows:
        assert_true(row["redaction_policy_ref"] in policy_refs, f"Artifact row missing redaction policy: {row['artifact_class_id']}")
        assert_true(row["retention_class_ref"], f"Artifact row missing retention class: {row['artifact_class_id']}")

    deletion_row = next(item for item in artifact_rows if item["artifact_class_id"] == "ART_DELETION_CERTIFICATE")
    archive_row = next(item for item in artifact_rows if item["artifact_class_id"] == "ART_ARCHIVE_MANIFEST")
    assert_true(
        deletion_row["sensitivity_class"] == "retention_governance_restricted"
        and archive_row["sensitivity_class"] == "retention_governance_restricted",
        "Retention witnesses drifted into ordinary artifact sensitivity classes.",
    )

    for row in audit_rows:
        assert_true(row["redaction_policy_ref"] in policy_refs, f"Audit row missing policy ref: {row['event_family_id']}")
        assert_true(row["telemetry_ceiling"], f"Audit row missing telemetry ceiling: {row['event_family_id']}")
        assert_true(row["log_ceiling"], f"Audit row missing log ceiling: {row['event_family_id']}")
        assert_true(row["audit_replay_ceiling"], f"Audit row missing replay ceiling: {row['event_family_id']}")
        assert_true(row["prohibited_identifiers"], f"Audit row missing prohibited identifiers: {row['event_family_id']}")

    prohibited_union = {item.lower() for row in audit_rows for item in row["prohibited_identifiers"]}
    for required_marker in ["raw jwt", "raw phone number", "secret"]:
        assert_true(
            any(required_marker in item for item in prohibited_union),
            f"Audit disclosure posture no longer forbids {required_marker}.",
        )

    assert_true(
        break_glass["distinct_purpose_of_use"] == "investigation_break_glass",
        "Break-glass no longer binds a distinct purpose-of-use row.",
    )
    assert_true(
        break_glass["governing_object_id"] == "OBJ_INVESTIGATIONSCOPEENVELOPE",
        "Break-glass payload drifted away from InvestigationScopeEnvelope authority.",
    )
    for rule in break_glass["rules"]:
        assert_true(
            rule["distinct_purpose_of_use"] == "investigation_break_glass",
            f"Break-glass rule lacks the distinct purpose row: {rule['rule_id']}",
        )
        assert_true(
            "read-only" in rule["mutation_rule"].lower(),
            f"Break-glass rule allows mutation drift: {rule['rule_id']}",
        )
        assert_true(
            "expire" in rule["expiry_rule"].lower() or "auto-revoke" in rule["expiry_rule"].lower(),
            f"Break-glass rule is not time-bound: {rule['rule_id']}",
        )


def validate_files(payload: dict[str, object]) -> None:
    matrix_csv = load_csv(CLASSIFICATION_MATRIX_PATH)
    redaction_csv = load_csv(REDACTION_POLICY_PATH)
    audit_csv = load_csv(AUDIT_DISCLOSURE_PATH)
    artifact_csv = load_csv(ARTIFACT_SENSITIVITY_PATH)

    assert_true(
        matrix_csv == csv_rowify(payload["data_classification_matrix"]),
        "Classification matrix CSV drifted from builder output.",
    )
    assert_true(
        redaction_csv == csv_rowify(payload["redaction_policy_matrix"]),
        "Redaction policy CSV drifted from builder output.",
    )
    assert_true(
        audit_csv == csv_rowify(payload["audit_event_disclosure_matrix"]),
        "Audit disclosure CSV drifted from builder output.",
    )
    assert_true(
        artifact_csv == csv_rowify(payload["artifact_sensitivity_matrix"]),
        "Artifact sensitivity CSV drifted from builder output.",
    )

    field_json = load_json(FIELD_SENSITIVITY_PATH)
    break_glass_json = load_json(BREAK_GLASS_PATH)
    assert_true(
        field_json == canonicalize(payload["field_sensitivity_catalog"]),
        "Field sensitivity JSON drifted from builder output.",
    )
    assert_true(
        break_glass_json == canonicalize(payload["break_glass_scope_rules"]),
        "Break-glass JSON drifted from builder output.",
    )

    for path in [
        CLASSIFICATION_DOC_PATH,
        MASKING_DOC_PATH,
        AUDIT_DOC_PATH,
        BREAK_GLASS_DOC_PATH,
        RETENTION_DOC_PATH,
    ]:
        text = load_text(path)
        assert_true(text.startswith("# "), f"Documentation file missing heading: {path}")
        assert_true(len(text.splitlines()) >= 8, f"Documentation file looks unexpectedly short: {path}")

    html_text = load_text(ATLAS_HTML_PATH)
    for marker in ATLAS_MARKERS:
        assert_true(marker in html_text, f"Missing atlas marker: {marker}")
    assert_true("__EMBEDDED_JSON__" not in html_text, "Atlas still contains an unresolved JSON placeholder.")
    assert_true("__SURFACE_SPEC_MAP__" not in html_text, "Atlas still contains an unresolved surface placeholder.")
    assert_true("@media print" in html_text, "Atlas is missing print CSS despite print-safe rendering support.")


def main() -> None:
    validate_deliverables()
    payload = build_bundle()
    validate_payload(payload)
    validate_files(payload)
    print("Validated seq_010 data classification model.")


if __name__ == "__main__":
    main()
