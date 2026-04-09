#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path

from build_external_dependency_inventory import (
    ALLOWED_BASELINE_SCOPES,
    ALLOWED_DEPENDENCY_CLASSES,
    ALLOWED_LAYERS,
    ASSURANCE_CSV_PATH,
    ASSURANCE_DOC_PATH,
    ATLAS_HTML_PATH,
    ATLAS_MARKERS,
    AUTOMATION_BACKLOG_CSV_PATH,
    BACKLOG_DOC_PATH,
    DEPENDENCIES_JSON_PATH,
    EXTERNAL_TOUCHPOINT_PATH,
    INVENTORY_CSV_PATH,
    INVENTORY_DOC_PATH,
    MANDATORY_DEPENDENCY_IDS,
    MISSION,
    SIMULATOR_DOC_PATH,
    SIMULATOR_JSON_PATH,
    SCOPE_LOCKS,
    SOURCE_PRECEDENCE,
    TAXONOMY_DOC_PATH,
    TRUTH_DOC_PATH,
    TRUTH_MATRIX_CSV_PATH,
    build_bundle,
    ensure_prerequisites,
    load_csv,
    load_json,
)


DELIVERABLES = [
    DEPENDENCIES_JSON_PATH,
    INVENTORY_CSV_PATH,
    ASSURANCE_CSV_PATH,
    TRUTH_MATRIX_CSV_PATH,
    SIMULATOR_JSON_PATH,
    AUTOMATION_BACKLOG_CSV_PATH,
    INVENTORY_DOC_PATH,
    TAXONOMY_DOC_PATH,
    ASSURANCE_DOC_PATH,
    TRUTH_DOC_PATH,
    SIMULATOR_DOC_PATH,
    BACKLOG_DOC_PATH,
    ATLAS_HTML_PATH,
]


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def canonicalize(value):
    return json.loads(json.dumps(value))


def load_csv_checked(path: Path) -> list[dict[str, str]]:
    assert_true(path.exists(), f"Missing CSV artifact: {path}")
    return load_csv(path)


def load_text(path: Path) -> str:
    assert_true(path.exists(), f"Missing text artifact: {path}")
    return path.read_text()


def validate_deliverables() -> None:
    for path in DELIVERABLES:
        assert_true(path.exists(), f"Missing seq_008 deliverable: {path}")


def validate_payload(payload: dict, expected_payload: dict, touchpoints: list[dict[str, str]]) -> None:
    assert_true(payload["inventory_id"] == "vecells_external_dependency_inventory_v1", "Unexpected inventory_id.")
    assert_true(payload["mission"] == MISSION, "Mission drifted.")
    assert_true(payload["source_precedence"] == SOURCE_PRECEDENCE, "Source precedence drifted.")
    assert_true(payload["upstream_inputs"] == ensure_prerequisites(), "Upstream input metadata drifted.")
    assert_true(payload == expected_payload, "Generated inventory payload drifted from build output.")

    dependencies = payload["dependencies"]
    summary = payload["summary"]
    dependency_ids = {dependency["dependency_id"] for dependency in dependencies}
    assert_true(MANDATORY_DEPENDENCY_IDS.issubset(dependency_ids), "Mandatory dependency coverage is incomplete.")
    assert_true(summary["dependency_count"] == len(dependencies), "Dependency summary count mismatch.")
    assert_true(
        summary["touchpoint_resolution_count"] == len(payload["touchpoint_resolution"]),
        "Touchpoint resolution summary count mismatch.",
    )
    assert_true(
        summary["assurance_obligation_count"] == len(payload["assurance_obligations"]),
        "Assurance summary count mismatch.",
    )
    assert_true(
        summary["browser_automation_backlog_count"] == len(payload["future_browser_automation_backlog"]),
        "Backlog summary count mismatch.",
    )

    touchpoint_ids = {row["touchpoint_id"] for row in touchpoints}
    exclusion_ids = {row["exclusion_id"] for row in payload["internal_exclusions"]}
    covered_touchpoints = {row["touchpoint_id"] for row in payload["touchpoint_resolution"]}
    assert_true(touchpoint_ids.issubset(covered_touchpoints), "Some external touchpoints are unresolved.")

    resolutions_by_touchpoint: dict[str, list[dict]] = {}
    for resolution in payload["touchpoint_resolution"]:
        resolutions_by_touchpoint.setdefault(resolution["touchpoint_id"], []).append(resolution)
        assert_true(
            resolution["resolution_type"] in {"dependency", "internal_exclusion"},
            f"Unknown resolution type: {resolution['resolution_type']}",
        )
        if resolution["resolution_type"] == "dependency":
            assert_true(
                resolution["dependency_id"] in dependency_ids,
                f"Resolution references unknown dependency: {resolution['dependency_id']}",
            )
        else:
            assert_true(
                resolution["exclusion_id"] in exclusion_ids,
                f"Resolution references unknown internal exclusion: {resolution['exclusion_id']}",
            )

    for touchpoint_id in touchpoint_ids:
        assert_true(
            len(resolutions_by_touchpoint.get(touchpoint_id, [])) >= 1,
            f"Touchpoint has no resolution rows: {touchpoint_id}",
        )

    backlog_by_dependency: dict[str, list[dict]] = {}
    for row in payload["future_browser_automation_backlog"]:
        backlog_by_dependency.setdefault(row["dependency_id"], []).append(row)
        assert_true(row["dependency_id"] in dependency_ids, f"Backlog row references unknown dependency: {row['dependency_id']}")

    for dependency in dependencies:
        assert_true(dependency["dependency_class"] in ALLOWED_DEPENDENCY_CLASSES, f"Invalid dependency class: {dependency['dependency_id']}")
        assert_true(dependency["dependency_layer"] in ALLOWED_LAYERS, f"Invalid dependency layer: {dependency['dependency_id']}")
        assert_true(dependency["baseline_scope"] in ALLOWED_BASELINE_SCOPES, f"Invalid dependency scope: {dependency['dependency_id']}")
        assert_true(dependency["source_file_refs"], f"Dependency missing source refs: {dependency['dependency_id']}")
        assert_true(dependency["authoritative_success_proof"], f"Dependency missing authoritative proof: {dependency['dependency_id']}")
        assert_true(dependency["fallback_or_recovery_modes"], f"Dependency missing fallback posture: {dependency['dependency_id']}")
        assert_true(dependency["assurance_or_onboarding_obligations"], f"Dependency missing assurance obligations: {dependency['dependency_id']}")
        if dependency["affects_patient_visible_truth"]:
            assert_true(dependency["ambiguity_modes"], f"Patient-visible dependency missing ambiguity posture: {dependency['dependency_id']}")
            assert_true(
                dependency["fallback_or_recovery_modes"],
                f"Patient-visible dependency missing degraded posture: {dependency['dependency_id']}",
            )
        if dependency["future_browser_automation_required"]:
            assert_true(
                backlog_by_dependency.get(dependency["dependency_id"]),
                f"Dependency requires browser automation but has no backlog rows: {dependency['dependency_id']}",
            )
            assert_true(
                dependency["browser_automation_candidate_portal_or_console"],
                f"Dependency requires browser automation but names no portal: {dependency['dependency_id']}",
            )
        if dependency["touchpoint_ids"]:
            assert_true(
                set(dependency["touchpoint_ids"]).issubset(touchpoint_ids),
                f"Dependency references unknown touchpoint: {dependency['dependency_id']}",
            )

    for dependency_id, expected_scope in SCOPE_LOCKS.items():
        row = next(dependency for dependency in dependencies if dependency["dependency_id"] == dependency_id)
        assert_true(
            row["baseline_scope"] == expected_scope,
            f"Dependency scope mislabelled: {dependency_id} should be {expected_scope}",
        )


def validate_csv_artifacts(payload: dict) -> None:
    dependencies = payload["dependencies"]
    assurance_rows = payload["assurance_obligations"]
    truth_rows = payload["truth_and_fallback_matrix"]
    backlog_rows = payload["future_browser_automation_backlog"]

    inventory_csv = load_csv_checked(INVENTORY_CSV_PATH)
    assurance_csv = load_csv_checked(ASSURANCE_CSV_PATH)
    truth_csv = load_csv_checked(TRUTH_MATRIX_CSV_PATH)
    backlog_csv = load_csv_checked(AUTOMATION_BACKLOG_CSV_PATH)

    assert_true(len(inventory_csv) == len(dependencies), "Inventory CSV row count mismatch.")
    assert_true(len(assurance_csv) == len(assurance_rows), "Assurance CSV row count mismatch.")
    assert_true(len(truth_csv) == len(truth_rows), "Truth matrix CSV row count mismatch.")
    assert_true(len(backlog_csv) == len(backlog_rows), "Backlog CSV row count mismatch.")

    inventory_ids = {row["dependency_id"] for row in inventory_csv}
    assert_true(inventory_ids == {dependency["dependency_id"] for dependency in dependencies}, "Inventory CSV dependency ids drifted.")
    truth_ids = {row["dependency_id"] for row in truth_csv}
    assert_true(truth_ids == inventory_ids, "Truth matrix dependency ids drifted.")
    backlog_ids = {row["dependency_id"] for row in backlog_csv}
    assert_true(backlog_ids.issubset(inventory_ids), "Backlog CSV references unknown dependencies.")


def validate_docs_and_html(payload: dict) -> None:
    for path in [
        INVENTORY_DOC_PATH,
        TAXONOMY_DOC_PATH,
        ASSURANCE_DOC_PATH,
        TRUTH_DOC_PATH,
        SIMULATOR_DOC_PATH,
        BACKLOG_DOC_PATH,
    ]:
        text = load_text(path)
        assert_true(text.startswith("# "), f"Documentation file missing heading: {path}")
        assert_true("Vecells" in text or "dependency" in text.lower(), f"Documentation file looks empty: {path}")

    html_text = load_text(ATLAS_HTML_PATH)
    for marker in ATLAS_MARKERS:
        assert_true(marker in html_text, f"Missing atlas marker: {marker}")
    assert_true("Dependency Constellation" in html_text, "Atlas hero heading missing.")
    assert_true("topology map" in html_text.lower(), "Atlas topology label missing.")
    assert_true(payload["inventory_id"] in html_text, "Atlas does not embed the generated payload.")


def main() -> None:
    validate_deliverables()
    touchpoints = load_csv_checked(EXTERNAL_TOUCHPOINT_PATH)
    expected_bundle = build_bundle()
    payload = load_json(DEPENDENCIES_JSON_PATH)
    validate_payload(payload, canonicalize(expected_bundle["inventory_payload"]), touchpoints)
    validate_csv_artifacts(payload)
    validate_docs_and_html(payload)
    print(
        f"Validated seq_008 dependency inventory with {payload['summary']['dependency_count']} dependencies and "
        f"{payload['summary']['browser_automation_backlog_count']} backlog rows."
    )


if __name__ == "__main__":
    main()
