#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]

STATE_TRANSITION_TABLE_PATH = ROOT / "data" / "analysis" / "state_transition_table.csv"
ILLEGAL_TRANSITIONS_PATH = ROOT / "data" / "analysis" / "illegal_transitions.json"
REQUEST_LINEAGE_TRANSITIONS_PATH = ROOT / "data" / "analysis" / "request_lineage_transitions.json"

TRANSITION_MATRIX_CSV_PATH = ROOT / "data" / "test" / "domain_transition_matrix.csv"
SCHEMA_MATRIX_CSV_PATH = ROOT / "data" / "test" / "event_schema_compatibility_matrix.csv"
ALIAS_CASES_JSON_PATH = ROOT / "data" / "test" / "event_alias_normalization_cases.json"
FHIR_REPLAY_CASES_JSON_PATH = ROOT / "data" / "test" / "fhir_representation_replay_cases.json"
SUITE_RESULTS_JSON_PATH = ROOT / "data" / "test" / "transition_suite_results.json"

REQUIRED_TRANSITION_CANONICALS = [
    "SubmissionEnvelope.state",
    "Request.workflowState",
    "Request.safetyState",
    "Request.identityState",
    "DuplicateCluster.reviewStatus",
    "FallbackReviewCase.patientVisibleState",
    "RequestClosureRecord.decision",
    "IdentityBinding.bindingState",
]

REQUIRED_PUBLISHED_EVENT_NAMES = [
    "request.workflow.changed",
    "request.safety.changed",
    "request.identity.changed",
    "request.closure_blockers.changed",
    "request.duplicate.review_required",
    "request.duplicate.attach_applied",
    "request.duplicate.retry_collapsed",
    "request.duplicate.resolved",
    "request.duplicate.separated",
    "exception.review_case.opened",
    "exception.review_case.recovered",
    "identity.repair_case.opened",
    "identity.repair_case.freeze_committed",
    "identity.repair_branch.quarantined",
    "identity.repair_case.corrected",
    "identity.repair_release.settled",
    "identity.repair_case.closed",
    "confirmation.gate.created",
    "confirmation.gate.confirmed",
    "confirmation.gate.disputed",
    "confirmation.gate.expired",
    "confirmation.gate.cancelled",
    "intake.promotion.settled",
]

REQUIRED_GAP_CODES = {
    "GAP_TRANSITION_OR_SCHEMA_REQUEST_CLOSURE_BLOCKER_SET",
    "GAP_TRANSITION_OR_SCHEMA_REPLAY_COLLISION_REVIEW_EXACT_REPLAY",
    "GAP_TRANSITION_OR_SCHEMA_REPLAY_COLLISION_REVIEW_SEMANTIC_REPLAY",
    "GAP_TRANSITION_OR_SCHEMA_REPLAY_COLLISION_REVIEW_OPEN",
    "GAP_TRANSITION_OR_SCHEMA_REPLAY_COLLISION_REVIEW_CLOSE",
    "GAP_TRANSITION_OR_SCHEMA_IDENTITY_REPAIR_OPEN_TO_FREEZE",
    "GAP_TRANSITION_OR_SCHEMA_IDENTITY_REPAIR_FREEZE_TO_QUARANTINED",
    "GAP_TRANSITION_OR_SCHEMA_IDENTITY_REPAIR_FREEZE_TO_CORRECTED",
    "GAP_TRANSITION_OR_SCHEMA_IDENTITY_REPAIR_CORRECTED_TO_CLOSED",
    "GAP_TRANSITION_OR_SCHEMA_INTAKE_PROMOTION_STARTED_UNPUBLISHED",
    "GAP_TRANSITION_OR_SCHEMA_INTAKE_PROMOTION_COMMITTED_UNPUBLISHED",
    "GAP_TRANSITION_OR_SCHEMA_INTAKE_PROMOTION_REPLAY_RETURNED_UNPUBLISHED",
    "GAP_TRANSITION_OR_SCHEMA_REQUEST_LINEAGE_BRANCH_EVENT_UNPUBLISHED",
    "GAP_TRANSITION_OR_SCHEMA_REQUEST_LINEAGE_CASE_LINK_EVENT_UNPUBLISHED",
}

STATE_ORDER_OVERRIDES = {
    "SubmissionEnvelope.state": [
        "draft",
        "evidence_pending",
        "ready_to_promote",
        "promoted",
        "abandoned",
        "expired",
    ],
    "Request.workflowState": [
        "submitted",
        "intake_normalized",
        "triage_ready",
        "triage_active",
        "handoff_active",
        "outcome_recorded",
        "closed",
    ],
    "Request.safetyState": [
        "not_screened",
        "screen_clear",
        "residual_risk_flagged",
        "urgent_diversion_required",
        "urgent_diverted",
    ],
    "Request.identityState": ["anonymous", "partial_match", "matched", "claimed"],
}


def load_json(path: Path) -> Any:
    return json.loads(path.read_text())


def load_csv_rows(path: Path) -> list[dict[str, str]]:
    with path.open(newline="") as handle:
        return list(csv.DictReader(handle))


def ensure(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def ordered_states(canonical_name: str, state_rows: list[dict[str, str]], state_axes: dict[str, list[str]]) -> list[str]:
    if canonical_name in STATE_ORDER_OVERRIDES:
        return STATE_ORDER_OVERRIDES[canonical_name]
    if canonical_name in state_axes:
        return state_axes[canonical_name]
    ordered: list[str] = []
    seen: set[str] = set()
    for row in state_rows:
        for value in (row["from_state"], row["to_state"]):
            if value not in seen:
                seen.add(value)
                ordered.append(value)
    return ordered


def main() -> None:
    for required_path in [
        TRANSITION_MATRIX_CSV_PATH,
        SCHEMA_MATRIX_CSV_PATH,
        ALIAS_CASES_JSON_PATH,
        FHIR_REPLAY_CASES_JSON_PATH,
        SUITE_RESULTS_JSON_PATH,
    ]:
        ensure(required_path.exists(), f"Missing seq_133 artifact: {required_path}")

    suite_results = load_json(SUITE_RESULTS_JSON_PATH)
    transition_rows = suite_results["transitionRows"]
    schema_rows = suite_results["schemaRows"]
    alias_cases = suite_results["aliasCases"]
    fhir_replay_cases = suite_results["fhirReplayCases"]

    transition_csv_rows = load_csv_rows(TRANSITION_MATRIX_CSV_PATH)
    schema_csv_rows = load_csv_rows(SCHEMA_MATRIX_CSV_PATH)

    ensure(
        len(transition_rows) == len(transition_csv_rows) == suite_results["summary"]["transitionMatrixRows"],
        "Transition matrix row count drifted.",
    )
    ensure(
        len(schema_rows) == len(schema_csv_rows) == suite_results["summary"]["schemaMatrixRows"],
        "Schema matrix row count drifted.",
    )

    state_rows = load_csv_rows(STATE_TRANSITION_TABLE_PATH)
    illegal_payload = load_json(ILLEGAL_TRANSITIONS_PATH)
    request_lineage_payload = load_json(REQUEST_LINEAGE_TRANSITIONS_PATH)
    state_axes = {
        row["governing_object"]: row["allowed_values"]
        for row in request_lineage_payload.get("state_axes", [])
        if row.get("governing_object") and isinstance(row.get("allowed_values"), list)
    }

    grouped_source_rows: dict[str, list[dict[str, str]]] = {}
    for canonical_name in REQUIRED_TRANSITION_CANONICALS:
        grouped_source_rows[canonical_name] = [
            row for row in state_rows if row["canonical_name"] == canonical_name
        ]

    for coverage_row in suite_results["transitionCoverage"]:
        canonical_name = coverage_row["canonicalName"]
        ensure(canonical_name in REQUIRED_TRANSITION_CANONICALS, f"Unexpected transition coverage row {canonical_name}")
        source_rows = grouped_source_rows[canonical_name]
        states = ordered_states(canonical_name, source_rows, state_axes)
        expected_allowed = len(source_rows)
        expected_forbidden = len(states) * (len(states) - 1) - expected_allowed
        ensure(
            coverage_row["allowedRowCount"] == expected_allowed,
            f"Allowed transition count drifted for {canonical_name}.",
        )
        ensure(
            coverage_row["forbiddenRowCount"] == expected_forbidden,
            f"Forbidden transition count drifted for {canonical_name}.",
        )
        ensure(
            coverage_row["allowedRowCount"] > 0 and coverage_row["forbiddenRowCount"] > 0,
            f"{canonical_name} lacks allowed or forbidden coverage.",
        )

    illegal_rows = illegal_payload.get("illegal_transition_rows", [])
    required_machine_ids = {
        row["machine_id"]
        for row in state_rows
        if row["canonical_name"] in REQUIRED_TRANSITION_CANONICALS
    }
    transition_lookup = {
        (row["canonicalName"], row["fromState"], row["toState"], row["transitionVerdict"]): row
        for row in transition_rows
    }
    for illegal_row in illegal_rows:
        if illegal_row["machine_id"] not in required_machine_ids:
            continue
        matching_canonical = next(
            row["canonical_name"]
            for row in state_rows
            if row["machine_id"] == illegal_row["machine_id"]
        )
        suite_states = ordered_states(
            matching_canonical,
            grouped_source_rows[matching_canonical],
            state_axes,
        )
        if (
            illegal_row["from_state"] not in suite_states
            or illegal_row["to_state"] not in suite_states
        ):
            continue
        if illegal_row["from_state"] == illegal_row["to_state"]:
            continue
        key = (
            matching_canonical,
            illegal_row["from_state"],
            illegal_row["to_state"],
            "forbidden",
        )
        ensure(key in transition_lookup, f"Illegal transition {key} is missing from the matrix.")

    workflow_allowed_states = {
        row["toState"]
        for row in transition_rows
        if row["canonicalName"] == "Request.workflowState" and row["transitionVerdict"] == "allowed"
    } | {
        row["fromState"]
        for row in transition_rows
        if row["canonicalName"] == "Request.workflowState" and row["transitionVerdict"] == "allowed"
    }
    ensure(
        workflow_allowed_states == set(STATE_ORDER_OVERRIDES["Request.workflowState"]),
        "Request.workflowState allowed states drifted.",
    )
    forbidden_terms = ["confirmation_pending", "identity_hold", "review_required", "fallback", "repair"]
    ensure(
        not any(term in " ".join(workflow_allowed_states) for term in forbidden_terms),
        "Workflow milestones now encode blocker semantics directly.",
    )

    gap_codes = {row["gapCode"] for row in suite_results["gapRows"]}
    ensure(REQUIRED_GAP_CODES.issubset(gap_codes), "One or more required seq_133 bounded gaps are missing.")

    schema_by_event = {row["eventName"]: row for row in schema_rows}
    for event_name in REQUIRED_PUBLISHED_EVENT_NAMES:
        ensure(event_name in schema_by_event, f"Missing schema coverage row for {event_name}.")
        row = schema_by_event[event_name]
        ensure(row["rowKind"] == "published_contract", f"{event_name} is not published in the schema matrix.")
        ensure(
            row["envelopeRequiredFieldsPresent"] == "yes",
            f"{event_name} no longer carries the full canonical envelope requirement set.",
        )
        ensure(
            row["privacySafePayload"] == "yes",
            f"{event_name} lost its privacy-safe payload guard.",
        )
        ensure(
            row["edgeCorrelationRequired"] == "yes" and row["causalTokenRequired"] == "yes",
            f"{event_name} lost replay-critical join requirements.",
        )
        ensure(
            row["governingJoinRequired"] == "yes",
            f"{event_name} no longer requires governing joins.",
        )
        ensure(
            row["rawAggregateInternalDependencyState"] == "forbidden_by_schema",
            f"{event_name} relies on unpublished raw aggregate internals.",
        )
        ensure(
            row["replayDeterminismState"].startswith("covered"),
            f"{event_name} no longer proves replay determinism.",
        )

    for gap_event_name in [
        "intake.promotion.started",
        "intake.promotion.committed",
        "intake.promotion.replay_returned",
        "request.lineage.branched",
        "request.lineage.case_link.changed",
    ]:
        ensure(
            schema_by_event[gap_event_name]["rowKind"] == "gap_transition_or_schema",
            f"{gap_event_name} should remain a bounded gap row.",
        )

    ensure(alias_cases, "Alias normalization cases are missing.")
    ensure(
        all(case["targetCanonicalEventName"] for case in alias_cases),
        "Alias normalization cases lost their canonical targets.",
    )
    ensure(
        any(case["sourceAliasEventName"].startswith("fallback.review_case.") for case in alias_cases),
        "Fallback-review alias normalization coverage is missing.",
    )

    ensure(len(fhir_replay_cases) >= 4, "FHIR replay cases are incomplete.")
    replay_outcomes = {case["expectedOutcome"] for case in fhir_replay_cases}
    ensure("stable_replay" in replay_outcomes, "FHIR stable replay coverage is missing.")
    ensure("supersedes_append_only" in replay_outcomes, "FHIR supersession replay coverage is missing.")

    print(
        json.dumps(
            {
                "task_id": suite_results["task_id"],
                "suite_verdict": suite_results["summary"]["suiteVerdict"],
                "transition_rows": len(transition_rows),
                "schema_rows": len(schema_rows),
                "alias_cases": len(alias_cases),
                "fhir_replay_cases": len(fhir_replay_cases),
                "gap_rows": len(suite_results["gapRows"]),
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
