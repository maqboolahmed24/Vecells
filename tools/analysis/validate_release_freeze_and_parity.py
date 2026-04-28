#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Any

from build_release_freeze_and_parity import (
    COCKPIT_PATH,
    FREEZE_MATRIX_PATH,
    FREEZE_STRATEGY_DOC_PATH,
    MATRIX_GROUPS,
    PARITY_RULES,
    PARITY_RULES_PATH,
    PARITY_STRATEGY_DOC_PATH,
    PLAYWRIGHT_PACKAGE_PATH,
    RELEASE_CANDIDATE_SCHEMA_PATH,
    RELEASE_FREEZE_SCHEMA_PATH,
    ROOT_PACKAGE_PATH,
    SPEC_PATH,
    TASK_ID,
    VALIDATOR_PATH,
    VISUAL_MODE,
    WATCH_EVIDENCE_KINDS,
    WATCH_EVIDENCE_PATH,
    build_release_approval_freeze_schema,
    build_release_candidate_schema,
)


README_MARKERS = [
    "# 51 Release Candidate Freeze Strategy",
    "# 51 Publication Parity Strategy",
]

HTML_MARKERS = [
    'data-testid="cockpit-masthead"',
    'data-testid="candidate-rail"',
    'data-testid="tuple-strip"',
    'data-testid="parity-matrix"',
    'data-testid="inspector"',
    'data-testid="defect-strip"',
    "prefers-reduced-motion: reduce",
]

SPEC_MARKERS = [
    "candidate filtering",
    "candidate selection",
    "matrix and inspector parity",
    "drift-state visibility",
    "keyboard navigation",
    "responsive behavior",
    "reduced motion",
    "accessibility smoke checks",
    "filter-environment",
    "filter-parity",
]


def fail(message: str) -> None:
    raise SystemExit(message)


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        fail(message)


def read_json(path: Path) -> Any:
    return json.loads(path.read_text())


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open() as handle:
        return list(csv.DictReader(handle))


def ensure_deliverables() -> None:
    required = [
        RELEASE_CANDIDATE_SCHEMA_PATH,
        RELEASE_FREEZE_SCHEMA_PATH,
        PARITY_RULES_PATH,
        FREEZE_MATRIX_PATH,
        WATCH_EVIDENCE_PATH,
        FREEZE_STRATEGY_DOC_PATH,
        PARITY_STRATEGY_DOC_PATH,
        COCKPIT_PATH,
        SPEC_PATH,
        ROOT_PACKAGE_PATH,
        PLAYWRIGHT_PACKAGE_PATH,
        VALIDATOR_PATH,
    ]
    missing = [str(path) for path in required if not path.exists()]
    assert_true(not missing, "Missing seq_051 deliverables:\n" + "\n".join(missing))


def validate_required_shape(row: dict[str, Any], schema: dict[str, Any], label: str) -> None:
    for key in schema["required"]:
        assert_true(key in row, f"{label} lost required property {key}")
    for key, value in row.items():
        property_schema = schema["properties"].get(key)
        if not property_schema:
            continue
        expected_type = property_schema.get("type")
        if expected_type == "string":
            assert_true(isinstance(value, str) and value != "", f"{label} property {key} must be a non-empty string")
        elif expected_type == "array":
            assert_true(isinstance(value, list), f"{label} property {key} must be an array")
            min_items = property_schema.get("minItems", 0)
            assert_true(len(value) >= min_items, f"{label} property {key} fell below minItems")
        elif isinstance(expected_type, list) and "string" in expected_type and value is not None:
            assert_true(isinstance(value, str), f"{label} property {key} must be string or null")
        if "enum" in property_schema and value is not None:
            assert_true(value in property_schema["enum"], f"{label} property {key} drifted outside enum")


def validate_payload() -> None:
    payload = read_json(PARITY_RULES_PATH)
    candidate_schema = read_json(RELEASE_CANDIDATE_SCHEMA_PATH)
    freeze_schema = read_json(RELEASE_FREEZE_SCHEMA_PATH)
    matrix_rows = read_csv(FREEZE_MATRIX_PATH)
    watch_rows = read_csv(WATCH_EVIDENCE_PATH)
    root_package = read_json(ROOT_PACKAGE_PATH)
    playwright_package = read_json(PLAYWRIGHT_PACKAGE_PATH)

    assert_true(payload["task_id"] == TASK_ID, "Parity payload task id drifted")
    assert_true(payload["visual_mode"] == VISUAL_MODE, "Parity payload visual mode drifted")
    assert_true(candidate_schema == build_release_candidate_schema(), "Release candidate schema drifted from generator")
    assert_true(freeze_schema == build_release_approval_freeze_schema(), "Release freeze schema drifted from generator")

    assert_true(
        payload["summary"]["candidate_count"] == len(payload["releaseCandidates"]),
        "Candidate count summary drifted",
    )
    assert_true(
        payload["summary"]["release_approval_freeze_count"] == len(payload["releaseApprovalFreezes"]),
        "Freeze count summary drifted",
    )
    assert_true(
        payload["summary"]["runtime_publication_bundle_count"] == len(payload["runtimePublicationBundles"]),
        "Runtime publication count summary drifted",
    )
    assert_true(
        payload["summary"]["publication_parity_record_count"] == len(payload["releasePublicationParityRecords"]),
        "Parity record count summary drifted",
    )
    assert_true(payload["summary"]["matrix_row_count"] == len(matrix_rows), "Matrix row count summary drifted")
    assert_true(
        payload["summary"]["watch_required_evidence_count"] == len(watch_rows),
        "Watch evidence row count summary drifted",
    )
    assert_true(
        payload["summary"]["watch_tuple_count"] == len(payload["releaseWatchTuples"]),
        "Watch tuple count summary drifted",
    )
    assert_true(
        payload["summary"]["observation_policy_count"] == len(payload["waveObservationPolicies"]),
        "Observation policy count summary drifted",
    )

    release_map = {row["releaseId"]: row for row in payload["releaseCandidates"]}
    freeze_map = {row["releaseCandidateRef"]: row for row in payload["releaseApprovalFreezes"]}
    parity_map = {row["releaseRef"]: row for row in payload["releasePublicationParityRecords"]}
    publication_map = {row["releaseRef"]: row for row in payload["runtimePublicationBundles"]}
    watch_map = {row["releaseRef"]: row for row in payload["releaseWatchTuples"]}
    observation_map = {row["releaseRef"]: row for row in payload["waveObservationPolicies"]}

    for candidate in payload["releaseCandidates"]:
        release_id = candidate["releaseId"]
        validate_required_shape(candidate, candidate_schema, release_id)
        assert_true(
            candidate["releaseApprovalFreezeRef"] in {row["releaseApprovalFreezeId"] for row in payload["releaseApprovalFreezes"]},
            f"{release_id} points at unknown release approval freeze",
        )
        assert_true(release_id in freeze_map, f"{release_id} has no freeze tuple")
        assert_true(release_id in parity_map, f"{release_id} has no parity record")
        assert_true(release_id in publication_map, f"{release_id} has no runtime publication bundle")
        assert_true(release_id in watch_map, f"{release_id} has no watch tuple")
        assert_true(release_id in observation_map, f"{release_id} has no observation policy")
        assert_true(candidate["bundleHashRefs"], f"{release_id} lost bundle hash refs")
        assert_true(candidate["artifactDigests"], f"{release_id} lost artifact digests")
        assert_true(candidate["requiredAssuranceSliceRefs"], f"{release_id} lost required assurance slices")

    for freeze in payload["releaseApprovalFreezes"]:
        freeze_id = freeze["releaseApprovalFreezeId"]
        validate_required_shape(freeze, freeze_schema, freeze_id)
        assert_true(bool(freeze["baselineTupleHash"]), f"{freeze_id} lost baseline tuple hash")
        assert_true(bool(freeze["scopeTupleHash"]), f"{freeze_id} lost scope tuple hash")
        assert_true(bool(freeze["standardsWatchlistHash"]), f"{freeze_id} lost standards watchlist hash")
        assert_true(bool(freeze["migrationPlanHash"]), f"{freeze_id} lost migration plan hash")

    required_groups = {row["matrixGroup"] for row in MATRIX_GROUPS}
    matrix_group_map: dict[str, list[dict[str, str]]] = {}
    for row in matrix_rows:
        matrix_group_map.setdefault(row["release_id"], []).append(row)
    for release_id, rows in matrix_group_map.items():
        assert_true(
            {row["matrix_group"] for row in rows} == required_groups,
            f"{release_id} matrix rows drifted away from the required group set",
        )

    expected_evidence_kinds = {row["evidenceKind"] for row in WATCH_EVIDENCE_KINDS}
    watch_row_map: dict[str, list[dict[str, str]]] = {}
    for row in watch_rows:
        watch_row_map.setdefault(row["release_id"], []).append(row)
    for release_id, rows in watch_row_map.items():
        assert_true(
            {row["evidence_kind"] for row in rows} == expected_evidence_kinds,
            f"{release_id} watch evidence set drifted from the required evidence kinds",
        )

    surface_rows = payload["surfaceBindingOutcomes"]
    for release_id, parity in parity_map.items():
        binding_rows = [row for row in surface_rows if row["releaseRef"] == release_id]
        assert_true(binding_rows, f"{release_id} lost surface binding outcomes")
        publication = publication_map[release_id]
        assert_true(
            publication["publicationParityRef"] == parity["publicationParityRecordId"],
            f"{release_id} runtime publication lost parity linkage",
        )
        assert_true(
            publication["publicationState"] != "published" or parity["parityState"] in {"exact", "stale", "conflict", "withdrawn"},
            f"{release_id} published runtime bundle lacks a usable parity verdict",
        )
        non_exact_rows = [
            row for row in matrix_group_map[release_id] if row["comparison_state"] != "exact"
        ]
        if parity["parityState"] == "exact":
            assert_true(not parity["driftReasonIds"], f"{release_id} exact parity still carries drift reasons")
            assert_true(not non_exact_rows, f"{release_id} exact parity lost exact matrix coverage")
            assert_true(
                parity["provenanceVerificationState"] == "verified" and parity["provenanceConsumptionState"] == "publishable",
                f"{release_id} exact parity must keep publishable verified provenance",
            )
        else:
            assert_true(parity["driftReasonIds"], f"{release_id} non-exact parity lost drift reasons")
            assert_true(non_exact_rows, f"{release_id} non-exact parity has no non-exact matrix rows")
            assert_true(
                all(row["bindingState"] != "publishable_live" for row in binding_rows),
                f"{release_id} still leaves publishable_live surfaces under non-exact parity",
            )

    assert_true(
        payload["summary"]["publishable_live_binding_count"] == 0,
        "Seq_051 should not claim publishable_live browser bindings while seq_050 ceilings remain present",
    )
    assert_true(
        payload["summary"]["exact_parity_count"] >= 1,
        "Seq_051 should model at least one exact parity path for later release work",
    )

    scripts = root_package["scripts"]
    assert_true(
        "build_release_freeze_and_parity.py" in scripts["codegen"],
        "Root codegen script no longer runs seq_051",
    )
    assert_true(
        "validate:release-parity" in scripts and "validate_release_freeze_and_parity.py" in scripts["validate:release-parity"],
        "Root package lost the release parity validator script",
    )
    assert_true(
        "release-parity-cockpit.spec.js" in playwright_package["scripts"]["e2e"],
        "Playwright package no longer runs the release parity cockpit spec",
    )


def validate_docs_and_browser_artifacts() -> None:
    doc_text = FREEZE_STRATEGY_DOC_PATH.read_text() + PARITY_STRATEGY_DOC_PATH.read_text()
    for marker in README_MARKERS:
        assert_true(marker in doc_text, f"Docs lost expected marker: {marker}")

    html = COCKPIT_PATH.read_text()
    for marker in HTML_MARKERS:
        assert_true(marker in html, f"Cockpit HTML lost expected marker: {marker}")

    spec = SPEC_PATH.read_text()
    for marker in SPEC_MARKERS:
        assert_true(marker in spec, f"Cockpit spec lost expected marker: {marker}")


def main() -> None:
    ensure_deliverables()
    validate_payload()
    validate_docs_and_browser_artifacts()
    print("seq_051 release freeze and parity validation passed")


if __name__ == "__main__":
    main()
