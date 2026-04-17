#!/usr/bin/env python3
from __future__ import annotations

import csv
import hashlib
import json
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from textwrap import dedent
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_ANALYSIS_DIR = ROOT / "data" / "analysis"
DATA_TEST_DIR = ROOT / "data" / "test"
DOCS_TEST_DIR = ROOT / "docs" / "tests"

STATE_TRANSITION_TABLE_PATH = DATA_ANALYSIS_DIR / "state_transition_table.csv"
ILLEGAL_TRANSITIONS_PATH = DATA_ANALYSIS_DIR / "illegal_transitions.json"
REQUEST_LINEAGE_TRANSITIONS_PATH = DATA_ANALYSIS_DIR / "request_lineage_transitions.json"
CANONICAL_EVENT_CONTRACTS_PATH = DATA_ANALYSIS_DIR / "canonical_event_contracts.json"
CANONICAL_EVENT_SCHEMA_VERSIONS_PATH = DATA_ANALYSIS_DIR / "canonical_event_schema_versions.json"
CANONICAL_EVENT_NORMALIZATION_RULES_PATH = (
    DATA_ANALYSIS_DIR / "canonical_event_normalization_rules.json"
)
CANONICAL_EVENT_TO_TRANSPORT_PATH = DATA_ANALYSIS_DIR / "canonical_event_to_transport_mapping.json"
EVENT_APPLIER_DISPATCH_MATRIX_PATH = DATA_ANALYSIS_DIR / "event_applier_dispatch_matrix.csv"
FHIR_REPRESENTATION_CONTRACTS_PATH = DATA_ANALYSIS_DIR / "fhir_representation_contracts.json"
REPLAY_CLASSIFICATION_MATRIX_PATH = DATA_ANALYSIS_DIR / "replay_classification_matrix.csv"
REPLAY_COLLISION_CASEBOOK_PATH = DATA_ANALYSIS_DIR / "replay_collision_casebook.json"
CLOSURE_BLOCKER_CASEBOOK_PATH = DATA_ANALYSIS_DIR / "closure_blocker_casebook.json"
IDENTITY_REPAIR_CASEBOOK_PATH = DATA_ANALYSIS_DIR / "identity_repair_casebook.json"
LIFECYCLE_COORDINATOR_CASEBOOK_PATH = DATA_ANALYSIS_DIR / "lifecycle_coordinator_casebook.json"

CANONICAL_EVENT_ENVELOPE_SCHEMA_PATH = (
    ROOT / "packages" / "event-contracts" / "schemas" / "canonical-event-envelope.v1.schema.json"
)

TRANSITION_MATRIX_CSV_PATH = DATA_TEST_DIR / "domain_transition_matrix.csv"
SCHEMA_MATRIX_CSV_PATH = DATA_TEST_DIR / "event_schema_compatibility_matrix.csv"
ALIAS_CASES_JSON_PATH = DATA_TEST_DIR / "event_alias_normalization_cases.json"
FHIR_REPLAY_CASES_JSON_PATH = DATA_TEST_DIR / "fhir_representation_replay_cases.json"
SUITE_RESULTS_JSON_PATH = DATA_TEST_DIR / "transition_suite_results.json"

OVERVIEW_DOC_PATH = DOCS_TEST_DIR / "133_domain_transition_and_event_schema_compatibility.md"
TRANSITION_DOC_PATH = DOCS_TEST_DIR / "133_transition_matrix.md"
SCHEMA_DOC_PATH = DOCS_TEST_DIR / "133_schema_compatibility_matrix.md"
LAB_HTML_PATH = DOCS_TEST_DIR / "133_transition_lab.html"

TASK_ID = "seq_133"
VISUAL_MODE = "Transition_Schema_Lab"

SOURCE_PRECEDENCE = [
    "prompt/133.md",
    "prompt/shared_operating_contract_126_to_135.md",
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "blueprint/phase-0-the-foundation-protocol.md#0B Mandatory Phase 0 tests",
    "blueprint/phase-cards.md#card-1-phase-0-the-foundation-protocol",
    "blueprint/phase-1-the-red-flag-gate.md#Replay duplicate and safety-preemption law",
    "blueprint/forensic-audit-findings.md#Finding 48",
    "blueprint/forensic-audit-findings.md#Finding 49",
    "blueprint/forensic-audit-findings.md#Finding 50",
    "blueprint/forensic-audit-findings.md#Finding 51",
    "blueprint/forensic-audit-findings.md#Finding 52",
    "blueprint/forensic-audit-findings.md#Finding 53",
    "blueprint/forensic-audit-findings.md#Finding 54",
    "blueprint/forensic-audit-findings.md#Finding 55",
    "blueprint/forensic-audit-findings.md#Finding 56",
    "blueprint/forensic-audit-findings.md#Finding 65",
    "blueprint/forensic-audit-findings.md#Finding 83",
    "blueprint/forensic-audit-findings.md#Finding 91",
    "data/analysis/state_transition_table.csv",
    "data/analysis/illegal_transitions.json",
    "data/analysis/request_lineage_transitions.json",
    "data/analysis/canonical_event_contracts.json",
    "data/analysis/canonical_event_schema_versions.json",
    "data/analysis/canonical_event_normalization_rules.json",
    "data/analysis/canonical_event_to_transport_mapping.json",
    "data/analysis/event_applier_dispatch_matrix.csv",
    "data/analysis/fhir_representation_contracts.json",
    "data/analysis/replay_classification_matrix.csv",
    "data/analysis/replay_collision_casebook.json",
    "data/analysis/closure_blocker_casebook.json",
    "data/analysis/identity_repair_casebook.json",
    "data/analysis/lifecycle_coordinator_casebook.json",
]

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

AUTHORITY_BY_CANONICAL = {
    "SubmissionEnvelope.state": "SubmissionEnvelopeAggregate",
    "Request.workflowState": "LifecycleCoordinator",
    "Request.safetyState": "SafetyOrchestrator",
    "Request.identityState": "IdentityBindingAuthority",
    "DuplicateCluster.reviewStatus": "DuplicateReviewCoordinator",
    "FallbackReviewCase.patientVisibleState": "FallbackReviewCoordinator",
    "RequestClosureRecord.decision": "LifecycleCoordinator",
    "IdentityBinding.bindingState": "IdentityBindingAuthority",
    "Request.closureBlockerSet": "LifecycleCoordinator",
    "ReplayCollisionReview.lifecycle": "ReplayCollisionReview",
    "IdentityRepairCase.state": "IdentityRepairGovernor",
}

IN_SCOPE_EVENT_NAMES = [
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

GAP_EVENT_ROWS = [
    {
        "eventName": "intake.promotion.started",
        "eventFamily": "intake",
        "gapCode": "GAP_TRANSITION_OR_SCHEMA_INTAKE_PROMOTION_STARTED_UNPUBLISHED",
        "producerServiceRefs": ["service_command_api"],
        "sourceRefs": [
            "packages/event-contracts/src/submission-lineage-events.ts",
            "data/analysis/submission_promotion_record_manifest.json",
            "docs/architecture/62_submission_and_lineage_state_rules.md",
        ],
        "notes": "The interface seam is documented, but the canonical contract row and schema artifact are not published yet.",
    },
    {
        "eventName": "intake.promotion.committed",
        "eventFamily": "intake",
        "gapCode": "GAP_TRANSITION_OR_SCHEMA_INTAKE_PROMOTION_COMMITTED_UNPUBLISHED",
        "producerServiceRefs": ["service_command_api"],
        "sourceRefs": [
            "packages/event-contracts/src/submission-lineage-events.ts",
            "data/analysis/submission_promotion_record_manifest.json",
            "docs/architecture/62_submission_and_lineage_state_rules.md",
        ],
        "notes": "The interface seam is documented, but the canonical contract row and schema artifact are not published yet.",
    },
    {
        "eventName": "intake.promotion.replay_returned",
        "eventFamily": "intake",
        "gapCode": "GAP_TRANSITION_OR_SCHEMA_INTAKE_PROMOTION_REPLAY_RETURNED_UNPUBLISHED",
        "producerServiceRefs": ["service_command_api"],
        "sourceRefs": [
            "packages/event-contracts/src/submission-lineage-events.ts",
            "data/analysis/submission_promotion_record_manifest.json",
            "docs/architecture/62_submission_and_lineage_state_rules.md",
        ],
        "notes": "Replay-safe promotion return is source-implied, but the exact canonical event contract has not been published.",
    },
    {
        "eventName": "request.lineage.branched",
        "eventFamily": "request",
        "gapCode": "GAP_TRANSITION_OR_SCHEMA_REQUEST_LINEAGE_BRANCH_EVENT_UNPUBLISHED",
        "producerServiceRefs": ["service_command_api"],
        "sourceRefs": [
            "packages/event-contracts/src/submission-lineage-events.ts",
            "data/analysis/submission_promotion_record_manifest.json",
            "docs/architecture/62_submission_and_lineage_state_rules.md",
        ],
        "notes": "Lineage branching remains a bounded seam until the canonical request lineage event family is fully published.",
    },
    {
        "eventName": "request.lineage.case_link.changed",
        "eventFamily": "request",
        "gapCode": "GAP_TRANSITION_OR_SCHEMA_REQUEST_LINEAGE_CASE_LINK_EVENT_UNPUBLISHED",
        "producerServiceRefs": ["service_command_api"],
        "sourceRefs": [
            "packages/event-contracts/src/submission-lineage-events.ts",
            "data/analysis/submission_promotion_record_manifest.json",
            "docs/architecture/62_submission_and_lineage_state_rules.md",
        ],
        "notes": "The case-link change seam is documented but not yet serialized into the canonical registry.",
    },
]

FORBIDDEN_PAYLOAD_KEYS = [
    "rawPhoneNumber",
    "rawMessageBody",
    "rawTranscriptText",
    "binaryArtifactPayload",
    "freeTextPhi",
]

TRANSITION_HEADERS = [
    "matrixRowId",
    "rowKind",
    "transitionVerdict",
    "canonicalName",
    "machineId",
    "machineFamily",
    "stateAxisType",
    "fromState",
    "toState",
    "owningAuthority",
    "coordinatorOwned",
    "trigger",
    "guards",
    "authoritativeProofs",
    "relatedObjects",
    "degradedPosture",
    "closureBlockerInteractions",
    "blockerSemanticsState",
    "coverageSource",
    "gapCode",
    "sourceRefs",
    "notes",
]

SCHEMA_HEADERS = [
    "schemaRowId",
    "rowKind",
    "eventName",
    "eventFamily",
    "canonicalEventContractRef",
    "schemaVersionRef",
    "schemaSemver",
    "compatibilityMode",
    "replaySemantics",
    "replayProofClass",
    "contractState",
    "transportState",
    "producerServiceRefs",
    "consumerHandlerCount",
    "consumerProjectionRefs",
    "transportQueueRefs",
    "transportConsumerGroupRefs",
    "requiredIdentifierRefs",
    "requiredCausalityRefs",
    "requiredPrivacyRefs",
    "requiredPayloadRefs",
    "envelopeRequiredFieldsPresent",
    "payloadContractShape",
    "privacySafePayload",
    "aliasNormalizationState",
    "aliasRuleRefs",
    "edgeCorrelationRequired",
    "causalTokenRequired",
    "governingJoinRequired",
    "rawAggregateInternalDependencyState",
    "projectionConsumerState",
    "replayDeterminismState",
    "schemaArtifactPath",
    "gapCode",
    "sourceRefs",
    "notes",
]


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def load_json(path: Path) -> Any:
    return json.loads(path.read_text())


def load_csv_rows(path: Path) -> list[dict[str, str]]:
    with path.open(newline="") as handle:
        return list(csv.DictReader(handle))


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n")


def write_csv(path: Path, rows: list[dict[str, Any]], headers: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=headers)
        writer.writeheader()
        writer.writerows(rows)


def write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text.rstrip() + "\n")


def dedupe(values: list[str]) -> list[str]:
    seen: set[str] = set()
    ordered: list[str] = []
    for value in values:
        if value and value not in seen:
            seen.add(value)
            ordered.append(value)
    return ordered


def semijoin(values: list[str]) -> str:
    return "; ".join(dedupe(values))


def short_hash(*parts: str) -> str:
    digest = hashlib.sha256("||".join(parts).encode("utf8")).hexdigest()
    return digest[:12]


def markdown_table(headers: list[str], rows: list[list[str]]) -> str:
    table = [
        "| " + " | ".join(headers) + " |",
        "| " + " | ".join(["---"] * len(headers)) + " |",
    ]
    for row in rows:
        table.append("| " + " | ".join(cell.replace("|", "\\|") for cell in row) + " |")
    return "\n".join(table)


def event_family(event_name: str) -> str:
    return event_name.split(".", 1)[0]


def ordered_states(canonical_name: str, rows: list[dict[str, str]], state_axes: dict[str, list[str]]) -> list[str]:
    if canonical_name in STATE_ORDER_OVERRIDES:
        return STATE_ORDER_OVERRIDES[canonical_name]
    if canonical_name in state_axes:
        return state_axes[canonical_name]
    values: list[str] = []
    for row in rows:
        values.append(row["from_state"])
        values.append(row["to_state"])
    return dedupe(values)


def transition_row_id(prefix: str, canonical_name: str, from_state: str, to_state: str) -> str:
    safe_name = canonical_name.replace(".", "_")
    return f"{prefix}_{safe_name}_{from_state}_{to_state}_{short_hash(prefix, canonical_name, from_state, to_state)}"


def schema_row_id(event_name: str) -> str:
    return f"SCHEMA_{event_name.replace('.', '_')}_{short_hash(event_name)}"


def load_state_axis_map(request_lineage_payload: dict[str, Any]) -> dict[str, list[str]]:
    mapping: dict[str, list[str]] = {}
    for row in request_lineage_payload.get("state_axes", []):
        governing_object = row.get("governing_object")
        allowed_values = row.get("allowed_values")
        if governing_object and isinstance(allowed_values, list):
            mapping[governing_object] = allowed_values
    return mapping


def infer_blocker_semantics_state(canonical_name: str, issue: dict[str, Any] | None) -> str:
    if issue and issue.get("issue_type") == "overloaded_canonical_state":
        return "rejected_blocker_overload"
    if canonical_name == "Request.workflowState":
        return "orthogonal_blockers"
    if canonical_name in {"Request.safetyState", "Request.identityState"}:
        return "orthogonal_axes"
    return "explicit_machine"


def build_transition_rows(
    state_rows: list[dict[str, str]],
    illegal_transitions_payload: dict[str, Any],
    request_lineage_payload: dict[str, Any],
    replay_casebook: dict[str, Any],
    replay_matrix_rows: list[dict[str, str]],
    identity_repair_casebook: dict[str, Any],
    lifecycle_casebook: dict[str, Any],
) -> tuple[list[dict[str, str]], list[dict[str, Any]], list[dict[str, Any]]]:
    illegal_rows = illegal_transitions_payload.get("illegal_transition_rows", [])
    illegal_lookup = {
        (row["machine_id"], row["from_state"], row["to_state"]): row for row in illegal_rows
    }
    state_axes = load_state_axis_map(request_lineage_payload)

    grouped: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in state_rows:
        if row["canonical_name"] in REQUIRED_TRANSITION_CANONICALS:
            grouped[row["canonical_name"]].append(row)

    transition_rows: list[dict[str, str]] = []
    coverage_rows: list[dict[str, Any]] = []
    gap_rows: list[dict[str, Any]] = []

    for canonical_name in REQUIRED_TRANSITION_CANONICALS:
        rows = grouped[canonical_name]
        states = ordered_states(canonical_name, rows, state_axes)
        allowed_lookup = {(row["from_state"], row["to_state"]): row for row in rows}

        allowed_count = 0
        forbidden_count = 0
        for from_state in states:
            for to_state in states:
                if from_state == to_state:
                    continue
                allowed_row = allowed_lookup.get((from_state, to_state))
                if allowed_row:
                    allowed_count += 1
                    transition_rows.append(
                        {
                            "matrixRowId": transition_row_id("TRN", canonical_name, from_state, to_state),
                            "rowKind": "transition_row",
                            "transitionVerdict": "allowed",
                            "canonicalName": canonical_name,
                            "machineId": allowed_row["machine_id"],
                            "machineFamily": allowed_row["machine_family"],
                            "stateAxisType": allowed_row["state_axis_type"],
                            "fromState": from_state,
                            "toState": to_state,
                            "owningAuthority": AUTHORITY_BY_CANONICAL[canonical_name],
                            "coordinatorOwned": allowed_row["coordinator_owned"],
                            "trigger": allowed_row["trigger"],
                            "guards": allowed_row["guards"],
                            "authoritativeProofs": allowed_row["authoritative_proofs"],
                            "relatedObjects": allowed_row["related_objects"],
                            "degradedPosture": allowed_row["degraded_posture"],
                            "closureBlockerInteractions": allowed_row["closure_blocker_interactions"],
                            "blockerSemanticsState": infer_blocker_semantics_state(canonical_name, None),
                            "coverageSource": "state_transition_table",
                            "gapCode": "",
                            "sourceRefs": allowed_row["source_refs"],
                            "notes": allowed_row["notes"],
                        }
                    )
                    continue

                forbidden_count += 1
                machine_id = rows[0]["machine_id"]
                machine_family = rows[0]["machine_family"]
                state_axis_type = rows[0]["state_axis_type"]
                issue = illegal_lookup.get((machine_id, from_state, to_state))
                notes = (
                    issue["canonical_correction"]
                    if issue
                    else "Derived forbidden complement of the published transition table."
                )
                guards = (
                    issue["dangerous_interpretation"]
                    if issue
                    else "No authoritative state-transition row exists for this state pair."
                )
                transition_rows.append(
                    {
                        "matrixRowId": transition_row_id("TRN", canonical_name, from_state, to_state),
                        "rowKind": "transition_row",
                        "transitionVerdict": "forbidden",
                        "canonicalName": canonical_name,
                        "machineId": machine_id,
                        "machineFamily": machine_family,
                        "stateAxisType": state_axis_type,
                        "fromState": from_state,
                        "toState": to_state,
                        "owningAuthority": AUTHORITY_BY_CANONICAL[canonical_name],
                        "coordinatorOwned": rows[0]["coordinator_owned"],
                        "trigger": "Forbidden complement of the published machine.",
                        "guards": guards,
                        "authoritativeProofs": "",
                        "relatedObjects": rows[0]["related_objects"],
                        "degradedPosture": "",
                        "closureBlockerInteractions": rows[0]["closure_blocker_interactions"],
                        "blockerSemanticsState": infer_blocker_semantics_state(canonical_name, issue),
                        "coverageSource": "illegal_transition_register"
                        if issue
                        else "derived_forbidden_complement",
                        "gapCode": "",
                        "sourceRefs": semijoin(issue["source_refs"]) if issue else rows[0]["source_refs"],
                        "notes": notes,
                    }
                )

        coverage_rows.append(
            {
                "canonicalName": canonical_name,
                "owningAuthority": AUTHORITY_BY_CANONICAL[canonical_name],
                "states": states,
                "allowedRowCount": allowed_count,
                "forbiddenRowCount": forbidden_count,
                "gapRowCount": 0,
            }
        )

    derived_transition_gaps = [
        {
            "canonicalName": "Request.closureBlockerSet",
            "machineId": "GAP_REQUEST_CLOSURE_BLOCKER_SET",
            "machineFamily": "derived_gap",
            "stateAxisType": "gate",
            "fromState": "materialized_non_empty",
            "toState": "materialized_empty",
            "owningAuthority": "LifecycleCoordinator",
            "coordinatorOwned": "yes",
            "trigger": "LifecycleCoordinator clears every blocker ref on the current lineage epoch and persists the empty blocker set.",
            "guards": "Published closure-blocker change events exist, but the blocker-set state machine is not serialized as a standalone transition table row.",
            "authoritativeProofs": "RequestClosureRecord(decision = close); request.closure_blockers.changed",
            "relatedObjects": "RequestClosureRecord; DuplicateCluster; FallbackReviewCase; IdentityRepairCase; ExternalConfirmationGate",
            "degradedPosture": "defer",
            "closureBlockerInteractions": "All blocker families must be empty before this transition is legal.",
            "blockerSemanticsState": "orthogonal_blockers",
            "coverageSource": "source_implied_gap_row",
            "gapCode": "GAP_TRANSITION_OR_SCHEMA_REQUEST_CLOSURE_BLOCKER_SET",
            "sourceRefs": "phase-0-the-foundation-protocol.md#1.12 RequestClosureRecord; data/analysis/lifecycle_coordinator_casebook.json",
            "notes": "The canonical closure blocker set is evented but not published as its own machine-readable state table.",
        },
        {
            "canonicalName": "ReplayCollisionReview.lifecycle",
            "machineId": "GAP_REPLAY_COLLISION_REVIEW_LIFECYCLE",
            "machineFamily": "derived_gap",
            "stateAxisType": "review",
            "fromState": "ingress_received",
            "toState": "exact_replay_returned",
            "owningAuthority": "ReplayCollisionReview",
            "coordinatorOwned": "no",
            "trigger": "Replay classification returns the prior settlement without new mutation.",
            "guards": "decision_class = exact_replay in the published replay classification matrix.",
            "authoritativeProofs": "IdempotencyRecord; returned_settlement_ref",
            "relatedObjects": "ReplayCollisionReview; CommandSettlementRecord",
            "degradedPosture": "",
            "closureBlockerInteractions": "No new blocker opens for exact replay.",
            "blockerSemanticsState": "explicit_machine_gap",
            "coverageSource": "source_implied_gap_row",
            "gapCode": "GAP_TRANSITION_OR_SCHEMA_REPLAY_COLLISION_REVIEW_EXACT_REPLAY",
            "sourceRefs": "phase-0-the-foundation-protocol.md#1.23A ReplayCollisionReview; data/analysis/replay_classification_matrix.csv",
            "notes": "Replay review exists in casebooks and matrices, but its lifecycle is not serialized as a transition table.",
        },
        {
            "canonicalName": "ReplayCollisionReview.lifecycle",
            "machineId": "GAP_REPLAY_COLLISION_REVIEW_LIFECYCLE",
            "machineFamily": "derived_gap",
            "stateAxisType": "review",
            "fromState": "ingress_received",
            "toState": "semantic_replay_returned",
            "owningAuthority": "ReplayCollisionReview",
            "coordinatorOwned": "no",
            "trigger": "Semantic replay collapses transport variance onto the prior authoritative settlement.",
            "guards": "decision_class = semantic_replay in the published replay classification matrix.",
            "authoritativeProofs": "IdempotencyRecord; returned_settlement_ref",
            "relatedObjects": "ReplayCollisionReview; CommandSettlementRecord",
            "degradedPosture": "",
            "closureBlockerInteractions": "No new blocker opens for semantic replay.",
            "blockerSemanticsState": "explicit_machine_gap",
            "coverageSource": "source_implied_gap_row",
            "gapCode": "GAP_TRANSITION_OR_SCHEMA_REPLAY_COLLISION_REVIEW_SEMANTIC_REPLAY",
            "sourceRefs": "phase-0-the-foundation-protocol.md#1.23A ReplayCollisionReview; data/analysis/replay_classification_matrix.csv",
            "notes": "Semantic replay is published as a decision class but not as a serialized lifecycle machine.",
        },
        {
            "canonicalName": "ReplayCollisionReview.lifecycle",
            "machineId": "GAP_REPLAY_COLLISION_REVIEW_LIFECYCLE",
            "machineFamily": "derived_gap",
            "stateAxisType": "review",
            "fromState": "ingress_received",
            "toState": "collision_review_open",
            "owningAuthority": "ReplayCollisionReview",
            "coordinatorOwned": "no",
            "trigger": "A divergent replay collision opens manual review instead of mutating automatically.",
            "guards": "decision_class = collision_review and blocked_automatic_mutation = true in the replay classification matrix.",
            "authoritativeProofs": "ReplayCollisionReview; returned_settlement_ref",
            "relatedObjects": "ReplayCollisionReview; DuplicateResolutionDecision",
            "degradedPosture": "review_required",
            "closureBlockerInteractions": "Replay review remains explicit until reviewed settlement is returned.",
            "blockerSemanticsState": "explicit_machine_gap",
            "coverageSource": "source_implied_gap_row",
            "gapCode": "GAP_TRANSITION_OR_SCHEMA_REPLAY_COLLISION_REVIEW_OPEN",
            "sourceRefs": "phase-0-the-foundation-protocol.md#1.23A ReplayCollisionReview; data/analysis/replay_collision_casebook.json",
            "notes": "Collision review is a first-class proof obligation, but its open state is not yet serialized in the shared transition table.",
        },
        {
            "canonicalName": "ReplayCollisionReview.lifecycle",
            "machineId": "GAP_REPLAY_COLLISION_REVIEW_LIFECYCLE",
            "machineFamily": "derived_gap",
            "stateAxisType": "review",
            "fromState": "collision_review_open",
            "toState": "settled_after_review",
            "owningAuthority": "ReplayCollisionReview",
            "coordinatorOwned": "no",
            "trigger": "Manual replay review returns the authoritative settlement or a bounded recovery disposition.",
            "guards": "returned_settlement_ref is present on the reviewed collision case.",
            "authoritativeProofs": "ReplayCollisionReview; CommandSettlementRecord",
            "relatedObjects": "ReplayCollisionReview; CommandSettlementRecord",
            "degradedPosture": "",
            "closureBlockerInteractions": "Review closure clears the replay blocker without mutating canonical workflow directly.",
            "blockerSemanticsState": "explicit_machine_gap",
            "coverageSource": "source_implied_gap_row",
            "gapCode": "GAP_TRANSITION_OR_SCHEMA_REPLAY_COLLISION_REVIEW_CLOSE",
            "sourceRefs": "phase-0-the-foundation-protocol.md#1.23A ReplayCollisionReview; data/analysis/replay_collision_casebook.json",
            "notes": "The review close path is source-implied but not yet serialized as a shared state machine.",
        },
        {
            "canonicalName": "IdentityRepairCase.state",
            "machineId": "GAP_IDENTITY_REPAIR_CASE_STATE",
            "machineFamily": "derived_gap",
            "stateAxisType": "repair",
            "fromState": "opened",
            "toState": "freeze_committed",
            "owningAuthority": "IdentityRepairGovernor",
            "coordinatorOwned": "no",
            "trigger": "Identity repair opens and freezes affected continuity on the current lineage fence epoch.",
            "guards": "identity.repair_case.opened and identity.repair_case.freeze_committed are both present in the repair casebook.",
            "authoritativeProofs": "IdentityRepairCase; IdentityRepairFreezeRecord",
            "relatedObjects": "IdentityRepairCase; IdentityBinding",
            "degradedPosture": "identity_hold",
            "closureBlockerInteractions": "Identity repair blocks closure and writable posture while active.",
            "blockerSemanticsState": "orthogonal_blockers",
            "coverageSource": "source_implied_gap_row",
            "gapCode": "GAP_TRANSITION_OR_SCHEMA_IDENTITY_REPAIR_OPEN_TO_FREEZE",
            "sourceRefs": "phase-0-the-foundation-protocol.md#1.5 IdentityRepairCase; data/analysis/identity_repair_casebook.json",
            "notes": "Identity repair lifecycle is evented and casebook-backed, but not yet serialized as a shared transition table.",
        },
        {
            "canonicalName": "IdentityRepairCase.state",
            "machineId": "GAP_IDENTITY_REPAIR_CASE_STATE",
            "machineFamily": "derived_gap",
            "stateAxisType": "repair",
            "fromState": "freeze_committed",
            "toState": "downstream_quarantined",
            "owningAuthority": "IdentityRepairGovernor",
            "coordinatorOwned": "no",
            "trigger": "Repair branches remain quarantined while contradictory downstream visibility is contained.",
            "guards": "repairCase.state = downstream_quarantined in the published casebook.",
            "authoritativeProofs": "IdentityRepairCase; IdentityRepairBranchDisposition",
            "relatedObjects": "IdentityRepairCase; IdentityRepairBranchDisposition",
            "degradedPosture": "summary_only",
            "closureBlockerInteractions": "Quarantined repair branches keep closure blocked.",
            "blockerSemanticsState": "orthogonal_blockers",
            "coverageSource": "source_implied_gap_row",
            "gapCode": "GAP_TRANSITION_OR_SCHEMA_IDENTITY_REPAIR_FREEZE_TO_QUARANTINED",
            "sourceRefs": "phase-0-the-foundation-protocol.md#1.5 IdentityRepairCase; data/analysis/identity_repair_casebook.json",
            "notes": "Quarantine posture is casebook-backed, but not yet serialized as a shared machine row.",
        },
        {
            "canonicalName": "IdentityRepairCase.state",
            "machineId": "GAP_IDENTITY_REPAIR_CASE_STATE",
            "machineFamily": "derived_gap",
            "stateAxisType": "repair",
            "fromState": "freeze_committed",
            "toState": "corrected",
            "owningAuthority": "IdentityRepairGovernor",
            "coordinatorOwned": "no",
            "trigger": "IdentityBindingAuthority settles a corrected patient binding under release settlement.",
            "guards": "identity.repair_case.corrected and identity.repair_release.settled are published event contracts.",
            "authoritativeProofs": "IdentityRepairReleaseSettlement; IdentityBinding(bindingState = corrected)",
            "relatedObjects": "IdentityRepairReleaseSettlement; IdentityBinding",
            "degradedPosture": "",
            "closureBlockerInteractions": "Correction is still not canonical closure; it only clears the repair blocker.",
            "blockerSemanticsState": "orthogonal_blockers",
            "coverageSource": "source_implied_gap_row",
            "gapCode": "GAP_TRANSITION_OR_SCHEMA_IDENTITY_REPAIR_FREEZE_TO_CORRECTED",
            "sourceRefs": "phase-0-the-foundation-protocol.md#1.5C IdentityRepairReleaseSettlement; data/analysis/identity_repair_casebook.json",
            "notes": "Corrected identity repair flow is source-traceable but not yet represented in the shared transition table.",
        },
        {
            "canonicalName": "IdentityRepairCase.state",
            "machineId": "GAP_IDENTITY_REPAIR_CASE_STATE",
            "machineFamily": "derived_gap",
            "stateAxisType": "repair",
            "fromState": "corrected",
            "toState": "closed",
            "owningAuthority": "IdentityRepairGovernor",
            "coordinatorOwned": "no",
            "trigger": "Repair release settles and the branch dispositions finish releasing or compensating affected paths.",
            "guards": "identity.repair_case.closed is present in the repair casebook and canonical event registry.",
            "authoritativeProofs": "IdentityRepairReleaseSettlement; identity.repair_case.closed",
            "relatedObjects": "IdentityRepairCase; IdentityRepairBranchDisposition",
            "degradedPosture": "",
            "closureBlockerInteractions": "Repair closure removes the repair blocker but does not close the request directly.",
            "blockerSemanticsState": "orthogonal_blockers",
            "coverageSource": "source_implied_gap_row",
            "gapCode": "GAP_TRANSITION_OR_SCHEMA_IDENTITY_REPAIR_CORRECTED_TO_CLOSED",
            "sourceRefs": "phase-0-the-foundation-protocol.md#1.5 IdentityRepairCase; data/analysis/identity_repair_casebook.json",
            "notes": "The repaired-close path is canonical in events and casebooks, but not yet serialized as a shared machine row.",
        },
    ]

    for gap_row in derived_transition_gaps:
        row = {
            "matrixRowId": transition_row_id(
                "GAP", gap_row["canonicalName"], gap_row["fromState"], gap_row["toState"]
            ),
            "rowKind": "gap_transition_or_schema",
            "transitionVerdict": "gap_transition_or_schema",
            **gap_row,
        }
        transition_rows.append(row)
        gap_rows.append(
            {
                "rowId": row["matrixRowId"],
                "area": "transition",
                "gapCode": row["gapCode"],
                "subject": f"{row['canonicalName']} {row['fromState']} -> {row['toState']}",
                "sourceRefs": row["sourceRefs"].split("; "),
            }
        )

    for coverage_row in coverage_rows:
        coverage_row["gapRowCount"] = len(
            [row for row in transition_rows if row["canonicalName"] == coverage_row["canonicalName"] and row["rowKind"] == "gap_transition_or_schema"]
        )

    transition_rows.sort(
        key=lambda row: (
            REQUIRED_TRANSITION_CANONICALS.index(row["canonicalName"])
            if row["canonicalName"] in REQUIRED_TRANSITION_CANONICALS
            else 999,
            row["canonicalName"],
            {"allowed": 0, "forbidden": 1, "gap_transition_or_schema": 2}.get(
                row["transitionVerdict"], 3
            ),
            row["fromState"],
            row["toState"],
        )
    )
    return transition_rows, coverage_rows, gap_rows


def schema_has_envelope_fields(schema_payload: dict[str, Any], envelope_required: list[str]) -> bool:
    schema_required = set(schema_payload.get("required", []))
    return set(envelope_required).issubset(schema_required)


def schema_payload_shape(schema_payload: dict[str, Any]) -> tuple[str, list[str]]:
    payload = schema_payload.get("properties", {}).get("payload", {})
    required = payload.get("required", [])
    if {"governingRef", "governingVersionRef", "previousState", "nextState", "stateAxis"}.issubset(
        set(required)
    ):
        return "state_transition", required
    if {"governingRef", "blockerReasonCode", "blockerSetHash", "recoveryMode"}.issubset(set(required)):
        return "blocker_transition", required
    if {"governingRef", "recoveryMode", "supersedesRef", "evidenceBoundaryRef"}.issubset(set(required)):
        return "recovery_transition", required
    return "published_other", required


def schema_has_privacy_guard(schema_payload: dict[str, Any]) -> bool:
    for clause in schema_payload.get("allOf", []):
        payload = clause.get("not", {}).get("properties", {}).get("payload", {})
        any_of = payload.get("anyOf", [])
        required_keys = {
            option.get("required", [None])[0]
            for option in any_of
            if isinstance(option.get("required"), list) and option["required"]
        }
        if set(FORBIDDEN_PAYLOAD_KEYS).issubset(required_keys):
            return True
    return False


def build_schema_rows(
    contracts_payload: dict[str, Any],
    schema_versions_payload: dict[str, Any],
    normalization_payload: dict[str, Any],
    transport_payload: dict[str, Any],
    dispatch_rows: list[dict[str, str]],
    envelope_schema_payload: dict[str, Any],
) -> tuple[list[dict[str, str]], list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]]]:
    contracts = {
        row["eventName"]: row
        for row in contracts_payload.get("contracts", [])
        if row["eventName"] in IN_SCOPE_EVENT_NAMES
    }
    schema_versions = {
        row["eventName"]: row
        for row in schema_versions_payload.get("schemaVersions", [])
        if row["eventName"] in IN_SCOPE_EVENT_NAMES
    }
    normalization_rules_by_target: dict[str, list[dict[str, Any]]] = defaultdict(list)
    alias_cases: list[dict[str, Any]] = []
    for index, row in enumerate(normalization_payload.get("normalizationRules", []), start=1):
        target_contract_ref = row["targetCanonicalEventContractRef"]
        target_event_name = next(
            (
                contract_row["eventName"]
                for contract_row in contracts_payload.get("contracts", [])
                if contract_row["canonicalEventContractId"] == target_contract_ref
            ),
            None,
        )
        if target_event_name:
            normalization_rules_by_target[target_event_name].append(row)
        alias_cases.append(
            {
                "aliasCaseId": f"ALIAS_{index:03d}_{short_hash(row['sourceProducerRef'], row['sourceNamespacePattern'], row['sourceEventPattern'])}",
                "sourceProducerRef": row["sourceProducerRef"],
                "sourceAliasEventName": f"{row['sourceNamespacePattern']}.{row['sourceEventPattern']}",
                "sourceNamespacePattern": row["sourceNamespacePattern"],
                "sourceEventPattern": row["sourceEventPattern"],
                "targetCanonicalEventName": target_event_name,
                "targetCanonicalEventContractRef": target_contract_ref,
                "targetEventFamily": event_family(target_event_name) if target_event_name else "gap",
                "normalizationVersionRef": row["normalizationVersionRef"],
                "payloadRewritePolicyRef": row["payloadRewritePolicyRef"],
                "privacyRewritePolicyRef": row["privacyRewritePolicyRef"],
                "ruleState": row["ruleState"],
                "compatibilityExpectation": "normalize_before_ingestion",
                "sourceRefs": row["source_refs"],
            }
        )

    transport_rows = {row["eventName"]: row for row in transport_payload.get("transportMappings", [])}
    dispatch_rows_by_event: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in dispatch_rows:
        dispatch_rows_by_event[row["eventName"]].append(row)

    envelope_required = envelope_schema_payload.get("required", [])
    schema_rows: list[dict[str, str]] = []
    coverage_rows: list[dict[str, Any]] = []
    gap_rows: list[dict[str, Any]] = []

    for event_name in IN_SCOPE_EVENT_NAMES:
        contract = contracts[event_name]
        schema_version = schema_versions[event_name]
        schema_path = ROOT / schema_version["artifactPath"]
        schema_payload = load_json(schema_path)
        transport_row = transport_rows.get(event_name, {})
        dispatch_hits = dispatch_rows_by_event.get(event_name, [])
        payload_shape, payload_required = schema_payload_shape(schema_payload)
        alias_rule_refs = [
            row["canonicalEventNormalizationRuleId"] for row in normalization_rules_by_target.get(event_name, [])
        ]

        row = {
            "schemaRowId": schema_row_id(event_name),
            "rowKind": "published_contract",
            "eventName": event_name,
            "eventFamily": event_family(event_name),
            "canonicalEventContractRef": contract["canonicalEventContractId"],
            "schemaVersionRef": schema_version["schemaVersionRef"],
            "schemaSemver": schema_version["schemaSemver"],
            "compatibilityMode": schema_version["compatibilityMode"],
            "replaySemantics": schema_version["replaySemantics"],
            "replayProofClass": schema_version["replayProofClass"],
            "contractState": contract["contractState"],
            "transportState": transport_row.get("eventState", "unmapped"),
            "producerServiceRefs": semijoin(contract.get("activeProducerServiceRefs", [])),
            "consumerHandlerCount": str(len(dispatch_hits)),
            "consumerProjectionRefs": semijoin(
                [
                    f"{dispatch_row['projectionFamilyRef']}:{dispatch_row['projectionVersionRef']}"
                    for dispatch_row in dispatch_hits
                ]
            ),
            "transportQueueRefs": semijoin(transport_row.get("queueRefs", [])),
            "transportConsumerGroupRefs": semijoin(transport_row.get("consumerGroupRefs", [])),
            "requiredIdentifierRefs": semijoin(contract.get("requiredIdentifierRefs", [])),
            "requiredCausalityRefs": semijoin(contract.get("requiredCausalityRefs", [])),
            "requiredPrivacyRefs": semijoin(contract.get("requiredPrivacyRefs", [])),
            "requiredPayloadRefs": semijoin(contract.get("requiredPayloadRefs", [])),
            "envelopeRequiredFieldsPresent": "yes"
            if schema_has_envelope_fields(schema_payload, envelope_required)
            else "no",
            "payloadContractShape": payload_shape,
            "privacySafePayload": "yes" if schema_has_privacy_guard(schema_payload) else "no",
            "aliasNormalizationState": "covered_by_rule" if alias_rule_refs else "not_required",
            "aliasRuleRefs": semijoin(alias_rule_refs),
            "edgeCorrelationRequired": "yes" if transport_row.get("edgeCorrelationRequired") else "no",
            "causalTokenRequired": "yes" if transport_row.get("causalTokenRequired") else "no",
            "governingJoinRequired": "yes"
            if {"governingAggregateRef", "governingLineageRef"}.issubset(schema_payload.get("required", []))
            else "no",
            "rawAggregateInternalDependencyState": "forbidden_by_schema"
            if schema_has_privacy_guard(schema_payload)
            else "not_proven",
            "projectionConsumerState": "dispatch_rows_present"
            if dispatch_hits
            else "no_declared_projection_dispatch",
            "replayDeterminismState": "covered_by_edge_correlation_and_governing_joins"
            if transport_row.get("edgeCorrelationRequired")
            and transport_row.get("causalTokenRequired")
            and {"governingAggregateRef", "governingLineageRef"}.issubset(schema_payload.get("required", []))
            else "not_proven",
            "schemaArtifactPath": schema_version["artifactPath"],
            "gapCode": "",
            "sourceRefs": semijoin(schema_version.get("source_refs", [])),
            "notes": "No projection dispatch row is declared yet."
            if not dispatch_hits
            else "",
        }
        schema_rows.append(row)
        coverage_rows.append(
            {
                "eventName": event_name,
                "eventFamily": event_family(event_name),
                "consumerHandlerCount": len(dispatch_hits),
                "aliasRuleCount": len(alias_rule_refs),
                "verdict": row["rowKind"],
                "projectionConsumerState": row["projectionConsumerState"],
            }
        )

    for gap in GAP_EVENT_ROWS:
        row = {
            "schemaRowId": schema_row_id(gap["eventName"]),
            "rowKind": "gap_transition_or_schema",
            "eventName": gap["eventName"],
            "eventFamily": gap["eventFamily"],
            "canonicalEventContractRef": "",
            "schemaVersionRef": "",
            "schemaSemver": "",
            "compatibilityMode": "source_implied_unpublished",
            "replaySemantics": "source_implied",
            "replayProofClass": "source_implied",
            "contractState": "gap",
            "transportState": "gap",
            "producerServiceRefs": semijoin(gap["producerServiceRefs"]),
            "consumerHandlerCount": "0",
            "consumerProjectionRefs": "",
            "transportQueueRefs": "",
            "transportConsumerGroupRefs": "",
            "requiredIdentifierRefs": "",
            "requiredCausalityRefs": "",
            "requiredPrivacyRefs": "",
            "requiredPayloadRefs": "",
            "envelopeRequiredFieldsPresent": "gap",
            "payloadContractShape": "gap_transition_or_schema",
            "privacySafePayload": "gap",
            "aliasNormalizationState": "gap",
            "aliasRuleRefs": "",
            "edgeCorrelationRequired": "source_implied",
            "causalTokenRequired": "source_implied",
            "governingJoinRequired": "source_implied",
            "rawAggregateInternalDependencyState": "gap",
            "projectionConsumerState": "gap",
            "replayDeterminismState": "gap_transition_or_schema",
            "schemaArtifactPath": "",
            "gapCode": gap["gapCode"],
            "sourceRefs": semijoin(gap["sourceRefs"]),
            "notes": gap["notes"],
        }
        schema_rows.append(row)
        gap_rows.append(
            {
                "rowId": row["schemaRowId"],
                "area": "schema",
                "gapCode": row["gapCode"],
                "subject": row["eventName"],
                "sourceRefs": row["sourceRefs"].split("; "),
            }
        )

    schema_rows.sort(
        key=lambda row: (
            0 if row["rowKind"] == "published_contract" else 1,
            row["eventFamily"],
            row["eventName"],
        )
    )
    alias_cases.sort(key=lambda row: (row["targetEventFamily"], row["targetCanonicalEventName"] or ""))
    return schema_rows, coverage_rows, gap_rows, alias_cases


def build_fhir_replay_cases(fhir_contracts_payload: dict[str, Any]) -> list[dict[str, Any]]:
    contracts = {
        row["fhirRepresentationContractId"]: row for row in fhir_contracts_payload.get("contracts", [])
    }

    request_external = contracts["FRC_049_REQUEST_EXTERNAL_INTERCHANGE_V1"]
    request_clinical = contracts["FRC_049_REQUEST_CLINICAL_PERSISTENCE_V1"]
    evidence_snapshot = contracts["FRC_049_EVIDENCE_SNAPSHOT_CLINICAL_PERSISTENCE_V1"]

    return [
        {
            "caseId": "FHIR_REPLAY_133_REQUEST_EXTERNAL_STABLE",
            "expectedOutcome": "stable_replay",
            "representationContractRef": request_external["fhirRepresentationContractId"],
            "bundlePolicyRef": request_external["declaredBundlePolicyRefs"][0],
            "adapterContractProfileRef": "ACP_049_CLINICAL_REQUEST_INTERCHANGE",
            "aggregate": {
                "governingAggregateType": request_external["governingAggregateType"],
                "aggregateRef": "request_133_external_stable",
                "aggregateVersionRef": "request_133_external_stable_v1",
                "lineageRef": "lineage_133_external_stable",
                "aggregateState": "submitted",
                "subjectRef": "patient_133_external_stable",
                "evidenceSnapshotRef": "snapshot_133_external_stable_v1",
                "payload": {
                    "messageText": "Stable replay must rematerialize the same outbound request interchange bundle."
                },
                "availableEvidenceRefs": request_external["requiredEvidenceRefs"],
            },
            "generatedAt": "2026-04-14T10:00:00Z",
            "replayGeneratedAt": "2026-04-14T10:01:00Z",
        },
        {
            "caseId": "FHIR_REPLAY_133_REQUEST_EXTERNAL_SUPERSEDE",
            "expectedOutcome": "supersedes_append_only",
            "representationContractRef": request_external["fhirRepresentationContractId"],
            "bundlePolicyRef": request_external["declaredBundlePolicyRefs"][0],
            "adapterContractProfileRef": "ACP_049_CLINICAL_REQUEST_INTERCHANGE",
            "aggregate": {
                "governingAggregateType": request_external["governingAggregateType"],
                "aggregateRef": "request_133_external_supersede",
                "aggregateVersionRef": "request_133_external_supersede_v1",
                "lineageRef": "lineage_133_external_supersede",
                "aggregateState": "submitted",
                "subjectRef": "patient_133_external_supersede",
                "evidenceSnapshotRef": "snapshot_133_external_supersede_v1",
                "payload": {"messageText": "Version one request interchange bundle."},
                "availableEvidenceRefs": request_external["requiredEvidenceRefs"],
            },
            "nextAggregate": {
                "governingAggregateType": request_external["governingAggregateType"],
                "aggregateRef": "request_133_external_supersede",
                "aggregateVersionRef": "request_133_external_supersede_v2",
                "lineageRef": "lineage_133_external_supersede",
                "aggregateState": "triage_ready",
                "subjectRef": "patient_133_external_supersede",
                "evidenceSnapshotRef": "snapshot_133_external_supersede_v2",
                "payload": {"messageText": "Version two request interchange bundle."},
                "availableEvidenceRefs": request_external["requiredEvidenceRefs"],
            },
            "generatedAt": "2026-04-14T10:05:00Z",
            "nextGeneratedAt": "2026-04-14T10:06:00Z",
        },
        {
            "caseId": "FHIR_REPLAY_133_REQUEST_CLINICAL_STABLE",
            "expectedOutcome": "stable_replay",
            "representationContractRef": request_clinical["fhirRepresentationContractId"],
            "aggregate": {
                "governingAggregateType": request_clinical["governingAggregateType"],
                "aggregateRef": "request_133_clinical_stable",
                "aggregateVersionRef": "request_133_clinical_stable_v1",
                "lineageRef": "lineage_133_clinical_stable",
                "aggregateState": "outcome_recorded",
                "subjectRef": "patient_133_clinical_stable",
                "evidenceSnapshotRef": "snapshot_133_clinical_stable_v1",
                "payload": {"summary": "Clinical persistence replay should be deterministic for the same aggregate version."},
                "availableEvidenceRefs": request_clinical["requiredEvidenceRefs"],
            },
            "generatedAt": "2026-04-14T10:10:00Z",
            "replayGeneratedAt": "2026-04-14T10:11:00Z",
        },
        {
            "caseId": "FHIR_REPLAY_133_EVIDENCE_SNAPSHOT_STABLE",
            "expectedOutcome": "stable_replay",
            "representationContractRef": evidence_snapshot["fhirRepresentationContractId"],
            "aggregate": {
                "governingAggregateType": evidence_snapshot["governingAggregateType"],
                "aggregateRef": "snapshot_133_evidence_stable",
                "aggregateVersionRef": "snapshot_133_evidence_stable_v1",
                "lineageRef": "lineage_133_evidence_stable",
                "aggregateState": "captured",
                "subjectRef": "patient_133_evidence_stable",
                "evidenceSnapshotRef": "snapshot_133_evidence_stable_v1",
                "payload": {"artifactDigest": "artifact_digest_133_evidence_stable"},
                "availableEvidenceRefs": evidence_snapshot["requiredEvidenceRefs"],
            },
            "generatedAt": "2026-04-14T10:15:00Z",
            "replayGeneratedAt": "2026-04-14T10:16:00Z",
        },
    ]


def build_transition_doc(transition_rows: list[dict[str, Any]]) -> str:
    headers = [
        "Verdict",
        "Canonical",
        "From",
        "To",
        "Authority",
        "Coverage",
        "Gap",
    ]
    rows = [
        [
            row["transitionVerdict"],
            row["canonicalName"],
            row["fromState"],
            row["toState"],
            row["owningAuthority"],
            row["coverageSource"],
            row["gapCode"] or "",
        ]
        for row in transition_rows
    ]
    return dedent(
        f"""
        # 133 Transition Matrix

        Generated from the authoritative transition table, illegal-transition register, lifecycle/repair/replay casebooks, and bounded gap derivations required by prompt `133.md`.

        {markdown_table(headers, rows)}
        """
    ).strip()


def build_schema_doc(schema_rows: list[dict[str, Any]]) -> str:
    headers = [
        "Row",
        "Event",
        "Family",
        "Compatibility",
        "Consumers",
        "Alias",
        "Gap",
    ]
    rows = [
        [
            row["rowKind"],
            row["eventName"],
            row["eventFamily"],
            row["compatibilityMode"],
            row["consumerHandlerCount"],
            row["aliasNormalizationState"],
            row["gapCode"] or "",
        ]
        for row in schema_rows
    ]
    return dedent(
        f"""
        # 133 Schema Compatibility Matrix

        Generated from the canonical event contract registry, schema-version catalog, normalization rules, transport mapping, and explicit gap seams.

        {markdown_table(headers, rows)}
        """
    ).strip()


def build_overview_doc(
    transition_coverage: list[dict[str, Any]],
    schema_coverage: list[dict[str, Any]],
    gap_rows: list[dict[str, Any]],
    alias_cases: list[dict[str, Any]],
    fhir_replay_cases: list[dict[str, Any]],
    summary: dict[str, Any],
) -> str:
    transition_headers = ["Canonical", "Allowed", "Forbidden", "Gap", "Authority"]
    transition_rows = [
        [
            row["canonicalName"],
            str(row["allowedRowCount"]),
            str(row["forbiddenRowCount"]),
            str(row["gapRowCount"]),
            row["owningAuthority"],
        ]
        for row in transition_coverage
    ]
    schema_headers = ["Event", "Family", "Consumers", "Alias Rules", "Projection State"]
    schema_rows = [
        [
            row["eventName"],
            row["eventFamily"],
            str(row["consumerHandlerCount"]),
            str(row["aliasRuleCount"]),
            row["projectionConsumerState"],
        ]
        for row in schema_coverage
    ]
    gap_headers = ["Area", "Gap Code", "Subject"]
    gap_table_rows = [
        [row["area"], row["gapCode"], row["subject"]]
        for row in gap_rows
    ]

    outputs = [
        "docs/tests/133_domain_transition_and_event_schema_compatibility.md",
        "docs/tests/133_transition_matrix.md",
        "docs/tests/133_schema_compatibility_matrix.md",
        "docs/tests/133_transition_lab.html",
        "data/test/domain_transition_matrix.csv",
        "data/test/event_schema_compatibility_matrix.csv",
        "data/test/event_alias_normalization_cases.json",
        "data/test/fhir_representation_replay_cases.json",
        "data/test/transition_suite_results.json",
    ]
    output_rows = [[path] for path in outputs]

    return dedent(
        f"""
        # 133 Domain Transition And Event Schema Compatibility

        This pack publishes one exact transition and schema-compatibility harness for the canonical request model, closure/blocker law, alias normalization, replay joins, and FHIR representation replay determinism.

        ## Summary

        - Suite verdict: `{summary["suiteVerdict"]}`
        - Transition rows: `{summary["transitionMatrixRows"]}`
        - Schema rows: `{summary["schemaMatrixRows"]}`
        - Alias normalization cases: `{len(alias_cases)}`
        - FHIR replay cases: `{len(fhir_replay_cases)}`

        ## Published Outputs

        {markdown_table(["Path"], output_rows)}

        ## Transition Coverage

        {markdown_table(transition_headers, transition_rows)}

        ## Event Compatibility Coverage

        {markdown_table(schema_headers, schema_rows)}

        ## Bounded Gaps

        {markdown_table(gap_headers, gap_table_rows)}

        ## Source Precedence

        {'\n'.join(f'- `{source}`' for source in SOURCE_PRECEDENCE)}
        """
    ).strip()


def build_lab_html(results_payload: dict[str, Any]) -> str:
    embedded_json = json.dumps(results_payload).replace("</", "<\\/")
    return dedent(
        """
        <!doctype html>
        <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>133 Transition Schema Lab</title>
          <style>
            :root {
              color-scheme: light;
              --canvas: #F7F8FA;
              --panel: #FFFFFF;
              --inset: #E8EEF3;
              --line: #D7E0E8;
              --text-strong: #0F1720;
              --text-default: #24313D;
              --text-muted: #5E6B78;
              --accent-allowed: #117A55;
              --accent-forbidden: #B42318;
              --accent-schema: #2F6FED;
              --accent-replay: #5B61F6;
              --accent-review: #B7791F;
              --radius-lg: 22px;
              --radius-md: 16px;
              --radius-sm: 12px;
              --shadow: 0 18px 48px rgba(15, 23, 32, 0.08);
            }

            * { box-sizing: border-box; }
            html, body { margin: 0; padding: 0; background: var(--canvas); color: var(--text-default); font-family: "IBM Plex Sans", "Segoe UI", sans-serif; }
            body { min-height: 100vh; }
            button, select { font: inherit; }
            .page {
              max-width: 1560px;
              margin: 0 auto;
              padding: 24px;
              display: grid;
              gap: 18px;
            }
            .masthead {
              min-height: 72px;
              background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,255,255,0.92));
              border: 1px solid var(--line);
              border-radius: 28px;
              box-shadow: var(--shadow);
              padding: 18px 22px;
              display: grid;
              grid-template-columns: auto 1fr auto;
              gap: 18px;
              align-items: center;
            }
            .brand {
              display: inline-flex;
              align-items: center;
              gap: 12px;
              color: var(--text-strong);
              font-weight: 700;
              letter-spacing: 0.02em;
            }
            .brand svg {
              width: 42px;
              height: 42px;
              border-radius: 12px;
              background: var(--inset);
              padding: 6px;
            }
            .masthead-copy h1 {
              margin: 0;
              font-size: 1.35rem;
              line-height: 1.1;
              color: var(--text-strong);
            }
            .masthead-copy p {
              margin: 6px 0 0;
              color: var(--text-muted);
              max-width: 72ch;
            }
            .summary-strip {
              display: flex;
              gap: 12px;
              flex-wrap: wrap;
              justify-content: flex-end;
            }
            .summary-pill {
              background: var(--inset);
              border-radius: 999px;
              padding: 10px 14px;
              color: var(--text-strong);
              font-weight: 600;
            }
            .layout {
              display: grid;
              grid-template-columns: 280px minmax(0, 1fr) 400px;
              gap: 18px;
              align-items: start;
            }
            .panel {
              background: var(--panel);
              border: 1px solid var(--line);
              border-radius: var(--radius-lg);
              box-shadow: var(--shadow);
              min-width: 0;
            }
            .rail, .inspector { padding: 18px; position: sticky; top: 24px; }
            .rail h2, .canvas h2, .inspector h2, .tables h2 {
              margin: 0 0 12px;
              font-size: 0.95rem;
              letter-spacing: 0.03em;
              text-transform: uppercase;
              color: var(--text-muted);
            }
            .filter-group {
              display: grid;
              gap: 8px;
              margin-bottom: 14px;
            }
            .filter-group label {
              font-size: 0.88rem;
              color: var(--text-strong);
              font-weight: 600;
            }
            .filter-group select {
              width: 100%;
              border-radius: var(--radius-sm);
              border: 1px solid var(--line);
              background: var(--panel);
              padding: 10px 12px;
              color: var(--text-default);
            }
            .legend {
              margin-top: 20px;
              display: grid;
              gap: 10px;
            }
            .legend-row {
              display: grid;
              grid-template-columns: 14px 1fr;
              gap: 10px;
              align-items: center;
              color: var(--text-muted);
              font-size: 0.88rem;
            }
            .swatch {
              width: 14px;
              height: 14px;
              border-radius: 999px;
            }
            .canvas {
              padding: 18px;
              display: grid;
              gap: 18px;
            }
            .canvas-grid {
              display: grid;
              gap: 18px;
            }
            .diagram {
              background: linear-gradient(180deg, rgba(247,248,250,0.92), rgba(232,238,243,0.72));
              border: 1px solid var(--line);
              border-radius: var(--radius-lg);
              padding: 16px;
              scroll-margin-top: 96px;
            }
            .diagram-head {
              display: flex;
              justify-content: space-between;
              align-items: baseline;
              gap: 12px;
              margin-bottom: 12px;
            }
            .diagram-head h3 {
              margin: 0;
              font-size: 1rem;
              color: var(--text-strong);
            }
            .diagram-head p {
              margin: 0;
              color: var(--text-muted);
              font-size: 0.88rem;
            }
            .matrix-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
              gap: 10px;
            }
            .heatmap-grid, .flow-grid {
              display: grid;
              gap: 10px;
            }
            .matrix-button, .heatmap-button, .flow-button, .table-row-button, .tab-button {
              width: 100%;
              border: 1px solid transparent;
              border-radius: var(--radius-md);
              background: rgba(255, 255, 255, 0.92);
              color: var(--text-default);
              text-align: left;
              cursor: pointer;
              transition: transform 120ms ease, border-color 120ms ease, box-shadow 120ms ease;
            }
            .matrix-button:hover, .heatmap-button:hover, .flow-button:hover, .table-row-button:hover, .tab-button:hover {
              transform: translateY(-1px);
              box-shadow: 0 10px 24px rgba(15, 23, 32, 0.08);
            }
            .matrix-button:focus-visible, .heatmap-button:focus-visible, .flow-button:focus-visible, .table-row-button:focus-visible, .tab-button:focus-visible, select:focus-visible {
              outline: 3px solid rgba(47, 111, 237, 0.22);
              outline-offset: 2px;
            }
            .matrix-button[data-verdict="allowed"] { border-color: rgba(17, 122, 85, 0.28); }
            .matrix-button[data-verdict="forbidden"] { border-color: rgba(180, 35, 24, 0.24); }
            .matrix-button[data-verdict="gap_transition_or_schema"] { border-color: rgba(91, 97, 246, 0.24); }
            .matrix-button[data-selected="true"], .heatmap-button[data-selected="true"], .flow-button[data-selected="true"], .table-row-button[data-selected="true"] {
              border-color: var(--accent-schema);
              box-shadow: 0 0 0 1px rgba(47, 111, 237, 0.22);
            }
            .matrix-button { padding: 12px; }
            .matrix-button strong { display: block; color: var(--text-strong); }
            .matrix-button span { display: block; margin-top: 4px; color: var(--text-muted); font-size: 0.84rem; }
            .pill-row { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
            .pill {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              padding: 4px 8px;
              border-radius: 999px;
              background: var(--inset);
              font-size: 0.76rem;
              color: var(--text-muted);
            }
            .heatmap-button {
              padding: 12px;
              display: grid;
              gap: 10px;
            }
            .heatmap-head {
              display: flex;
              justify-content: space-between;
              gap: 12px;
              align-items: center;
            }
            .heatmap-title {
              font-weight: 700;
              color: var(--text-strong);
              overflow-wrap: anywhere;
            }
            .heatmap-cells {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 8px;
            }
            .heat-cell {
              border-radius: 12px;
              min-height: 48px;
              padding: 8px;
              font-size: 0.78rem;
              color: white;
              display: flex;
              align-items: end;
            }
            .heat-cell.schema { background: var(--accent-schema); }
            .heat-cell.replay { background: var(--accent-replay); }
            .heat-cell.consumer { background: #325B88; }
            .heat-cell.alias { background: var(--accent-review); }
            .heat-cell.gap { background: var(--accent-forbidden); }
            .flow-button {
              padding: 12px;
              display: grid;
              gap: 10px;
            }
            .flow-line {
              display: grid;
              grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
              gap: 10px;
              align-items: center;
            }
            .flow-node {
              background: var(--panel);
              border: 1px solid var(--line);
              border-radius: 14px;
              padding: 10px;
              overflow-wrap: anywhere;
            }
            .flow-arrow {
              color: var(--accent-schema);
              font-size: 1.1rem;
              font-weight: 700;
            }
            .inspector-metadata {
              display: grid;
              gap: 8px;
            }
            .inspector-card {
              background: var(--inset);
              border-radius: var(--radius-md);
              padding: 14px;
              display: grid;
              gap: 8px;
            }
            .inspector-card h3 {
              margin: 0;
              font-size: 1.02rem;
              color: var(--text-strong);
              overflow-wrap: anywhere;
            }
            .inspector-card p, .inspector-card ul {
              margin: 0;
              color: var(--text-muted);
            }
            .tab-list {
              display: flex;
              gap: 8px;
              margin: 14px 0 12px;
            }
            .tab-button {
              padding: 10px 12px;
              background: var(--inset);
              color: var(--text-strong);
            }
            .tab-button[aria-selected="true"] {
              background: var(--text-strong);
              color: white;
            }
            .tab-panel {
              display: none;
              background: rgba(255,255,255,0.88);
              border: 1px solid var(--line);
              border-radius: var(--radius-md);
              padding: 14px;
              overflow-wrap: anywhere;
            }
            .tab-panel[data-active="true"] { display: block; }
            .tab-panel ul { margin: 0; padding-left: 18px; color: var(--text-default); }
            .tables {
              padding: 18px;
              display: grid;
              gap: 18px;
            }
            .table-card {
              border: 1px solid var(--line);
              border-radius: var(--radius-lg);
              overflow: hidden;
              background: rgba(255,255,255,0.9);
            }
            .table-card header {
              padding: 12px 14px;
              background: var(--inset);
              display: flex;
              justify-content: space-between;
              align-items: center;
              gap: 12px;
            }
            .table-card h3 {
              margin: 0;
              color: var(--text-strong);
              font-size: 0.98rem;
            }
            .table-body {
              display: grid;
            }
            .table-row-button {
              border-radius: 0;
              border-top: 1px solid var(--line);
              padding: 12px 14px;
              background: transparent;
              display: grid;
              gap: 4px;
            }
            .table-row-button:first-child { border-top: 0; }
            .row-topline {
              display: flex;
              justify-content: space-between;
              gap: 12px;
              align-items: baseline;
            }
            .row-topline strong {
              color: var(--text-strong);
              overflow-wrap: anywhere;
            }
            .row-meta {
              color: var(--text-muted);
              font-size: 0.84rem;
              overflow-wrap: anywhere;
            }
            .badge {
              display: inline-flex;
              align-items: center;
              padding: 4px 8px;
              border-radius: 999px;
              font-size: 0.76rem;
              font-weight: 700;
            }
            .badge.allowed { background: rgba(17, 122, 85, 0.12); color: var(--accent-allowed); }
            .badge.forbidden { background: rgba(180, 35, 24, 0.12); color: var(--accent-forbidden); }
            .badge.gap_transition_or_schema { background: rgba(91, 97, 246, 0.14); color: var(--accent-replay); }
            .table-empty {
              padding: 18px;
              color: var(--text-muted);
            }
            @media (max-width: 1260px) {
              .layout {
                grid-template-columns: 1fr;
              }
              .rail, .inspector {
                position: static;
              }
            }
            @media (max-width: 760px) {
              .page { padding: 14px; }
              .masthead {
                grid-template-columns: 1fr;
              }
              .summary-strip {
                justify-content: flex-start;
              }
            }
            @media (prefers-reduced-motion: reduce) {
              *, *::before, *::after {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
                scroll-behavior: auto !important;
              }
            }
          </style>
        </head>
        <body>
          <script id="suite-data" type="application/json">__EMBEDDED_JSON__</script>
          <div class="page" data-testid="transition-schema-lab">
            <header class="masthead" aria-labelledby="lab-title">
              <div class="brand" aria-label="Vecells">
                <svg viewBox="0 0 64 64" aria-hidden="true">
                  <circle cx="18" cy="18" r="6" fill="#117A55"></circle>
                  <circle cx="46" cy="18" r="6" fill="#2F6FED"></circle>
                  <circle cx="18" cy="46" r="6" fill="#B42318"></circle>
                  <circle cx="46" cy="46" r="6" fill="#5B61F6"></circle>
                  <path d="M18 18 L46 18 L46 46 L18 46 Z" fill="none" stroke="#24313D" stroke-width="3" stroke-linecap="round"></path>
                  <path d="M18 18 L46 46" stroke="#24313D" stroke-width="3" stroke-linecap="round"></path>
                </svg>
                <span>Vecells</span>
              </div>
              <div class="masthead-copy">
                <h1 id="lab-title">Transition Schema Lab</h1>
                <p>Phase 0 proof surface for canonical state-axis transitions, event-schema compatibility, alias normalization, and deterministic replay joins.</p>
              </div>
              <div class="summary-strip">
                <div class="summary-pill" data-testid="summary-transition-count"></div>
                <div class="summary-pill" data-testid="summary-schema-count"></div>
                <div class="summary-pill" data-testid="summary-gap-count"></div>
              </div>
            </header>

            <div class="layout">
              <nav class="panel rail" aria-label="Filters">
                <h2>Filters</h2>
                <div class="filter-group">
                  <label for="aggregate-filter">Aggregate</label>
                  <select id="aggregate-filter" data-testid="aggregate-filter"></select>
                </div>
                <div class="filter-group">
                  <label for="axis-filter">State Axis</label>
                  <select id="axis-filter" data-testid="axis-filter"></select>
                </div>
                <div class="filter-group">
                  <label for="verdict-filter">Verdict</label>
                  <select id="verdict-filter" data-testid="verdict-filter"></select>
                </div>
                <div class="filter-group">
                  <label for="event-family-filter">Event Family</label>
                  <select id="event-family-filter" data-testid="event-family-filter"></select>
                </div>
                <div class="legend">
                  <div class="legend-row"><span class="swatch" style="background:#117A55"></span><span>Allowed transition rows</span></div>
                  <div class="legend-row"><span class="swatch" style="background:#B42318"></span><span>Forbidden complements and explicit rejection law</span></div>
                  <div class="legend-row"><span class="swatch" style="background:#2F6FED"></span><span>Published schema compatibility rows</span></div>
                  <div class="legend-row"><span class="swatch" style="background:#5B61F6"></span><span>Replay-sensitive or bounded gap seams</span></div>
                  <div class="legend-row"><span class="swatch" style="background:#B7791F"></span><span>Alias normalization before canonical ingestion</span></div>
                </div>
              </nav>

              <main class="panel canvas">
                <h2>Proof Canvases</h2>
                <div class="canvas-grid">
                  <section class="diagram" aria-labelledby="lattice-title">
                    <div class="diagram-head">
                      <div>
                        <h3 id="lattice-title">State-Axis Lattice</h3>
                        <p>Allowed, forbidden, and bounded gap transitions stay visible with table parity.</p>
                      </div>
                      <p data-testid="lattice-count"></p>
                    </div>
                    <div class="matrix-grid" data-testid="state-lattice" id="state-lattice"></div>
                  </section>

                  <section class="diagram" aria-labelledby="heatmap-title">
                    <div class="diagram-head">
                      <div>
                        <h3 id="heatmap-title">Event Compatibility Heatmap</h3>
                        <p>Schema, replay, consumer, and alias-normalization readiness by canonical event row.</p>
                      </div>
                      <p data-testid="heatmap-count"></p>
                    </div>
                    <div class="heatmap-grid" data-testid="event-compatibility-heatmap" id="event-compatibility-heatmap"></div>
                  </section>

                  <section class="diagram" aria-labelledby="flow-title">
                    <div class="diagram-head">
                      <div>
                        <h3 id="flow-title">Alias-Normalization Flow</h3>
                        <p>Legacy and adapter-local aliases normalize before projection, assurance, or replay ingestion.</p>
                      </div>
                      <p data-testid="flow-count"></p>
                    </div>
                    <div class="flow-grid" data-testid="alias-normalization-flow" id="alias-normalization-flow"></div>
                  </section>
                </div>
              </main>

              <aside class="panel inspector" aria-labelledby="inspector-title">
                <h2 id="inspector-title">Inspector</h2>
                <div class="inspector-metadata">
                  <div class="inspector-card" data-testid="inspector">
                    <h3 id="inspector-name"></h3>
                    <p id="inspector-subtitle"></p>
                    <div class="pill-row" id="inspector-pills"></div>
                  </div>
                </div>
                <div class="tab-list" role="tablist" aria-label="Inspector tabs">
                  <button class="tab-button" data-testid="tab-summary" id="tab-summary" role="tab" aria-selected="true" aria-controls="panel-summary">Summary</button>
                  <button class="tab-button" data-testid="tab-guards" id="tab-guards" role="tab" aria-selected="false" aria-controls="panel-guards">Guards</button>
                  <button class="tab-button" data-testid="tab-sources" id="tab-sources" role="tab" aria-selected="false" aria-controls="panel-sources">Sources</button>
                </div>
                <section class="tab-panel" id="panel-summary" role="tabpanel" aria-labelledby="tab-summary" data-active="true"></section>
                <section class="tab-panel" id="panel-guards" role="tabpanel" aria-labelledby="tab-guards" data-active="false"></section>
                <section class="tab-panel" id="panel-sources" role="tabpanel" aria-labelledby="tab-sources" data-active="false"></section>
              </aside>
            </div>

            <section class="panel tables">
              <h2>Table Parity</h2>
              <div class="table-card">
                <header>
                  <h3>Transition Rows</h3>
                  <span data-testid="transition-table-count"></span>
                </header>
                <div class="table-body" data-testid="transition-table" id="transition-table"></div>
              </div>
              <div class="table-card">
                <header>
                  <h3>Schema Rows</h3>
                  <span data-testid="schema-table-count"></span>
                </header>
                <div class="table-body" data-testid="schema-table" id="schema-table"></div>
              </div>
              <div class="table-card">
                <header>
                  <h3>Alias Rows</h3>
                  <span data-testid="alias-table-count"></span>
                </header>
                <div class="table-body" data-testid="alias-table" id="alias-table"></div>
              </div>
            </section>
          </div>

          <script>
            const results = JSON.parse(document.getElementById("suite-data").textContent);
            const transitionRows = results.transitionRows;
            const schemaRows = results.schemaRows;
            const aliasCases = results.aliasCases;
            const filters = {
              aggregate: "all",
              axis: "all",
              verdict: "all",
              eventFamily: "all",
              selectedType: "transition",
              selectedId: transitionRows[0]?.matrixRowId ?? schemaRows[0]?.schemaRowId ?? aliasCases[0]?.aliasCaseId ?? null,
              inspectorTab: "summary",
            };

            const aggregateOptions = ["all", ...new Set(transitionRows.map((row) => row.canonicalName.split(".")[0]))];
            const axisOptions = ["all", ...new Set(transitionRows.map((row) => row.stateAxisType))];
            const verdictOptions = ["all", "allowed", "forbidden", "gap_transition_or_schema"];
            const eventFamilyOptions = ["all", ...new Set([...schemaRows.map((row) => row.eventFamily), ...aliasCases.map((row) => row.targetEventFamily || "gap")])];

            function applyOptions(select, options) {
              select.innerHTML = "";
              for (const option of options) {
                const el = document.createElement("option");
                el.value = option;
                el.textContent = option === "all" ? "All" : option;
                select.appendChild(el);
              }
            }

            function filteredTransitions() {
              return transitionRows.filter((row) => {
                const aggregate = row.canonicalName.split(".")[0];
                return (filters.aggregate === "all" || aggregate === filters.aggregate)
                  && (filters.axis === "all" || row.stateAxisType === filters.axis)
                  && (filters.verdict === "all" || row.transitionVerdict === filters.verdict);
              });
            }

            function filteredSchemas() {
              return schemaRows.filter((row) => {
                return (filters.eventFamily === "all" || row.eventFamily === filters.eventFamily)
                  && (filters.verdict === "all" || row.rowKind === filters.verdict || row.notes.includes(filters.verdict));
              });
            }

            function filteredAliases() {
              return aliasCases.filter((row) => filters.eventFamily === "all" || row.targetEventFamily === filters.eventFamily);
            }

            function ensureSelection() {
              const transitions = filteredTransitions();
              const schemas = filteredSchemas();
              const aliases = filteredAliases();
              const currentSet = [
                ...transitions.map((row) => ["transition", row.matrixRowId]),
                ...schemas.map((row) => ["schema", row.schemaRowId]),
                ...aliases.map((row) => ["alias", row.aliasCaseId]),
              ];
              const hasCurrent = currentSet.some(([type, id]) => type === filters.selectedType && id === filters.selectedId);
              if (!hasCurrent) {
                if (transitions[0]) {
                  filters.selectedType = "transition";
                  filters.selectedId = transitions[0].matrixRowId;
                } else if (schemas[0]) {
                  filters.selectedType = "schema";
                  filters.selectedId = schemas[0].schemaRowId;
                } else if (aliases[0]) {
                  filters.selectedType = "alias";
                  filters.selectedId = aliases[0].aliasCaseId;
                } else {
                  filters.selectedId = null;
                }
              }
            }

            function verdictBadge(verdict) {
              const label = verdict === "gap_transition_or_schema" ? "gap" : verdict;
              return `<span class="badge ${verdict}">${label}</span>`;
            }

            function renderTransitions() {
              const rows = filteredTransitions();
              const lattice = document.getElementById("state-lattice");
              const table = document.getElementById("transition-table");
              document.querySelector("[data-testid='lattice-count']").textContent = `${rows.length} visible`;
              document.querySelector("[data-testid='transition-table-count']").textContent = `${rows.length} rows`;
              lattice.innerHTML = "";
              table.innerHTML = "";
              if (!rows.length) {
                lattice.innerHTML = `<div class="table-empty">No transition rows match the current filters.</div>`;
                table.innerHTML = `<div class="table-empty">No transition rows match the current filters.</div>`;
                return;
              }
              rows.forEach((row, index) => {
                const selected = filters.selectedType === "transition" && filters.selectedId === row.matrixRowId;
                const buttonHtml = `
                  <button type="button" class="matrix-button" data-testid="lattice-cell-${row.matrixRowId}" data-verdict="${row.transitionVerdict}" data-selected="${selected}" data-kind="transition" data-id="${row.matrixRowId}" data-index="${index}">
                    <strong>${row.fromState} → ${row.toState}</strong>
                    <span>${row.canonicalName}</span>
                    <div class="pill-row">
                      <span class="pill">${row.owningAuthority}</span>
                      <span class="pill">${row.stateAxisType}</span>
                    </div>
                  </button>`;
                lattice.insertAdjacentHTML("beforeend", buttonHtml);
                table.insertAdjacentHTML(
                  "beforeend",
                  `<button type="button" class="table-row-button" data-testid="transition-row-${row.matrixRowId}" data-selected="${selected}" data-kind="transition" data-id="${row.matrixRowId}" data-index="${index}">
                    <div class="row-topline"><strong>${row.canonicalName}</strong>${verdictBadge(row.transitionVerdict)}</div>
                    <div class="row-meta">${row.fromState} → ${row.toState} · ${row.owningAuthority}</div>
                  </button>`,
                );
              });
            }

            function schemaHeatClass(row, key) {
              if (row.rowKind === "gap_transition_or_schema") return "heat-cell gap";
              if (key === "schema") return "heat-cell schema";
              if (key === "replay") return row.replayDeterminismState.startsWith("covered") ? "heat-cell replay" : "heat-cell gap";
              if (key === "consumer") return row.projectionConsumerState === "dispatch_rows_present" ? "heat-cell consumer" : "heat-cell gap";
              return row.aliasNormalizationState === "covered_by_rule" ? "heat-cell alias" : "heat-cell consumer";
            }

            function renderSchemas() {
              const rows = filteredSchemas();
              const heatmap = document.getElementById("event-compatibility-heatmap");
              const table = document.getElementById("schema-table");
              document.querySelector("[data-testid='heatmap-count']").textContent = `${rows.length} visible`;
              document.querySelector("[data-testid='schema-table-count']").textContent = `${rows.length} rows`;
              heatmap.innerHTML = "";
              table.innerHTML = "";
              if (!rows.length) {
                heatmap.innerHTML = `<div class="table-empty">No schema rows match the current filters.</div>`;
                table.innerHTML = `<div class="table-empty">No schema rows match the current filters.</div>`;
                return;
              }
              rows.forEach((row, index) => {
                const selected = filters.selectedType === "schema" && filters.selectedId === row.schemaRowId;
                heatmap.insertAdjacentHTML(
                  "beforeend",
                  `<button type="button" class="heatmap-button" data-testid="heatmap-row-${row.schemaRowId}" data-selected="${selected}" data-kind="schema" data-id="${row.schemaRowId}" data-index="${index}">
                    <div class="heatmap-head">
                      <span class="heatmap-title">${row.eventName}</span>
                      ${verdictBadge(row.rowKind)}
                    </div>
                    <div class="heatmap-cells">
                      <div class="${schemaHeatClass(row, "schema")}">schema</div>
                      <div class="${schemaHeatClass(row, "replay")}">replay</div>
                      <div class="${schemaHeatClass(row, "consumer")}">consumer</div>
                      <div class="${schemaHeatClass(row, "alias")}">alias</div>
                    </div>
                  </button>`,
                );
                table.insertAdjacentHTML(
                  "beforeend",
                  `<button type="button" class="table-row-button" data-testid="schema-row-${row.schemaRowId}" data-selected="${selected}" data-kind="schema" data-id="${row.schemaRowId}" data-index="${index}">
                    <div class="row-topline"><strong>${row.eventName}</strong>${verdictBadge(row.rowKind)}</div>
                    <div class="row-meta">${row.compatibilityMode || "gap"} · consumers ${row.consumerHandlerCount}</div>
                  </button>`,
                );
              });
            }

            function renderAliases() {
              const rows = filteredAliases();
              const flow = document.getElementById("alias-normalization-flow");
              const table = document.getElementById("alias-table");
              document.querySelector("[data-testid='flow-count']").textContent = `${rows.length} visible`;
              document.querySelector("[data-testid='alias-table-count']").textContent = `${rows.length} rows`;
              flow.innerHTML = "";
              table.innerHTML = "";
              if (!rows.length) {
                flow.innerHTML = `<div class="table-empty">No alias rows match the current filters.</div>`;
                table.innerHTML = `<div class="table-empty">No alias rows match the current filters.</div>`;
                return;
              }
              rows.forEach((row, index) => {
                const selected = filters.selectedType === "alias" && filters.selectedId === row.aliasCaseId;
                flow.insertAdjacentHTML(
                  "beforeend",
                  `<button type="button" class="flow-button" data-testid="normalization-flow-row-${row.aliasCaseId}" data-selected="${selected}" data-kind="alias" data-id="${row.aliasCaseId}" data-index="${index}">
                    <div class="flow-line">
                      <div class="flow-node">${row.sourceAliasEventName}</div>
                      <div class="flow-arrow">→</div>
                      <div class="flow-node">${row.targetCanonicalEventName}</div>
                    </div>
                    <div class="row-meta">${row.sourceProducerRef} · ${row.payloadRewritePolicyRef}</div>
                  </button>`,
                );
                table.insertAdjacentHTML(
                  "beforeend",
                  `<button type="button" class="table-row-button" data-testid="alias-row-${row.aliasCaseId}" data-selected="${selected}" data-kind="alias" data-id="${row.aliasCaseId}" data-index="${index}">
                    <div class="row-topline"><strong>${row.sourceAliasEventName}</strong><span class="badge allowed">normalized</span></div>
                    <div class="row-meta">${row.targetCanonicalEventName}</div>
                  </button>`,
                );
              });
            }

            function selectedItem() {
              if (!filters.selectedId) return null;
              if (filters.selectedType === "transition") {
                return filteredTransitions().find((row) => row.matrixRowId === filters.selectedId) ?? null;
              }
              if (filters.selectedType === "schema") {
                return filteredSchemas().find((row) => row.schemaRowId === filters.selectedId) ?? null;
              }
              return filteredAliases().find((row) => row.aliasCaseId === filters.selectedId) ?? null;
            }

            function renderInspector() {
              const item = selectedItem();
              document.getElementById("inspector-name").textContent = item ? (item.canonicalName || item.eventName || item.sourceAliasEventName) : "No selection";
              document.getElementById("inspector-subtitle").textContent = item
                ? (item.transitionVerdict || item.rowKind || item.compatibilityExpectation || "")
                : "Adjust filters to inspect a row.";
              const pillContainer = document.getElementById("inspector-pills");
              pillContainer.innerHTML = "";
              if (!item) {
                document.getElementById("panel-summary").innerHTML = "<p>No row is selected.</p>";
                document.getElementById("panel-guards").innerHTML = "<p>No row is selected.</p>";
                document.getElementById("panel-sources").innerHTML = "<p>No row is selected.</p>";
                return;
              }
              const pillValues = [];
              if (item.owningAuthority) pillValues.push(item.owningAuthority);
              if (item.stateAxisType) pillValues.push(item.stateAxisType);
              if (item.eventFamily) pillValues.push(item.eventFamily);
              if (item.compatibilityMode) pillValues.push(item.compatibilityMode);
              if (item.gapCode) pillValues.push(item.gapCode);
              pillContainer.innerHTML = pillValues.map((value) => `<span class="pill">${value}</span>`).join("");

              const summaryLines = [];
              if (item.fromState && item.toState) {
                summaryLines.push(`<p><strong>Transition:</strong> ${item.fromState} → ${item.toState}</p>`);
              }
              if (item.transportQueueRefs) {
                summaryLines.push(`<p><strong>Queues:</strong> ${item.transportQueueRefs || "none"}</p>`);
              }
              if (item.targetCanonicalEventName) {
                summaryLines.push(`<p><strong>Canonical target:</strong> ${item.targetCanonicalEventName}</p>`);
              }
              summaryLines.push(`<p><strong>Notes:</strong> ${item.notes || "No additional notes."}</p>`);
              document.getElementById("panel-summary").innerHTML = summaryLines.join("");

              const guardLines = [];
              if (item.guards) guardLines.push(`<p><strong>Guards:</strong> ${item.guards}</p>`);
              if (item.authoritativeProofs) guardLines.push(`<p><strong>Proofs:</strong> ${item.authoritativeProofs}</p>`);
              if (item.requiredIdentifierRefs) guardLines.push(`<p><strong>Identifiers:</strong> ${item.requiredIdentifierRefs}</p>`);
              if (item.requiredPayloadRefs) guardLines.push(`<p><strong>Payload refs:</strong> ${item.requiredPayloadRefs}</p>`);
              if (item.payloadRewritePolicyRef) guardLines.push(`<p><strong>Rewrite:</strong> ${item.payloadRewritePolicyRef}</p>`);
              document.getElementById("panel-guards").innerHTML = guardLines.join("") || "<p>No guard details for this row.</p>";

              const sourceRefs = Array.isArray(item.sourceRefs)
                ? item.sourceRefs
                : String(item.sourceRefs || "").split("; ").filter(Boolean);
              document.getElementById("panel-sources").innerHTML = sourceRefs.length
                ? `<ul>${sourceRefs.map((ref) => `<li>${ref}</li>`).join("")}</ul>`
                : "<p>No source refs recorded.</p>";
            }

            function renderSummaryStrip() {
              document.querySelector("[data-testid='summary-transition-count']").textContent = `${results.summary.transitionMatrixRows} transitions`;
              document.querySelector("[data-testid='summary-schema-count']").textContent = `${results.summary.schemaMatrixRows} schema rows`;
              document.querySelector("[data-testid='summary-gap-count']").textContent = `${results.summary.gapRows} bounded gaps`;
            }

            function setTab(tabId) {
              filters.inspectorTab = tabId;
              for (const name of ["summary", "guards", "sources"]) {
                const active = name === tabId;
                document.getElementById(`tab-${name}`).setAttribute("aria-selected", String(active));
                document.getElementById(`panel-${name}`).dataset.active = String(active);
              }
            }

            function wireSelection() {
              document.querySelectorAll("[data-kind]").forEach((button) => {
                button.addEventListener("click", () => {
                  filters.selectedType = button.dataset.kind;
                  filters.selectedId = button.dataset.id;
                  render();
                });
                button.addEventListener("keydown", (event) => {
                  if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
                  const peers = [...button.parentElement.querySelectorAll(`[data-kind='${button.dataset.kind}']`)];
                  const currentIndex = peers.indexOf(button);
                  let nextIndex = currentIndex;
                  if (event.key === "ArrowDown") nextIndex = Math.min(peers.length - 1, currentIndex + 1);
                  if (event.key === "ArrowUp") nextIndex = Math.max(0, currentIndex - 1);
                  if (event.key === "Home") nextIndex = 0;
                  if (event.key === "End") nextIndex = peers.length - 1;
                  if (nextIndex !== currentIndex) {
                    event.preventDefault();
                    peers[nextIndex].focus();
                    peers[nextIndex].click();
                  }
                });
              });
            }

            function wireTabs() {
              document.querySelectorAll(".tab-button").forEach((button) => {
                button.addEventListener("click", () => setTab(button.id.replace("tab-", "")));
                button.addEventListener("keydown", (event) => {
                  if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
                  const tabs = [...document.querySelectorAll(".tab-button")];
                  const currentIndex = tabs.indexOf(button);
                  let nextIndex = currentIndex;
                  if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabs.length;
                  if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
                  if (event.key === "Home") nextIndex = 0;
                  if (event.key === "End") nextIndex = tabs.length - 1;
                  event.preventDefault();
                  tabs[nextIndex].focus();
                  tabs[nextIndex].click();
                });
              });
            }

            function render() {
              ensureSelection();
              renderSummaryStrip();
              renderTransitions();
              renderSchemas();
              renderAliases();
              renderInspector();
              wireSelection();
              wireTabs();
            }

            const aggregateFilter = document.getElementById("aggregate-filter");
            const axisFilter = document.getElementById("axis-filter");
            const verdictFilter = document.getElementById("verdict-filter");
            const eventFamilyFilter = document.getElementById("event-family-filter");

            applyOptions(aggregateFilter, aggregateOptions);
            applyOptions(axisFilter, axisOptions);
            applyOptions(verdictFilter, verdictOptions);
            applyOptions(eventFamilyFilter, eventFamilyOptions);

            aggregateFilter.addEventListener("change", (event) => {
              filters.aggregate = event.target.value;
              render();
            });
            axisFilter.addEventListener("change", (event) => {
              filters.axis = event.target.value;
              render();
            });
            verdictFilter.addEventListener("change", (event) => {
              filters.verdict = event.target.value;
              render();
            });
            eventFamilyFilter.addEventListener("change", (event) => {
              filters.eventFamily = event.target.value;
              render();
            });

            render();
          </script>
        </body>
        </html>
        """
    ).replace("__EMBEDDED_JSON__", embedded_json)


def main() -> None:
    state_rows = load_csv_rows(STATE_TRANSITION_TABLE_PATH)
    illegal_payload = load_json(ILLEGAL_TRANSITIONS_PATH)
    request_lineage_payload = load_json(REQUEST_LINEAGE_TRANSITIONS_PATH)
    contracts_payload = load_json(CANONICAL_EVENT_CONTRACTS_PATH)
    schema_versions_payload = load_json(CANONICAL_EVENT_SCHEMA_VERSIONS_PATH)
    normalization_payload = load_json(CANONICAL_EVENT_NORMALIZATION_RULES_PATH)
    transport_payload = load_json(CANONICAL_EVENT_TO_TRANSPORT_PATH)
    dispatch_rows = load_csv_rows(EVENT_APPLIER_DISPATCH_MATRIX_PATH)
    fhir_contracts_payload = load_json(FHIR_REPRESENTATION_CONTRACTS_PATH)
    replay_matrix_rows = load_csv_rows(REPLAY_CLASSIFICATION_MATRIX_PATH)
    replay_casebook = load_json(REPLAY_COLLISION_CASEBOOK_PATH)
    closure_casebook = load_json(CLOSURE_BLOCKER_CASEBOOK_PATH)
    identity_repair_casebook = load_json(IDENTITY_REPAIR_CASEBOOK_PATH)
    lifecycle_casebook = load_json(LIFECYCLE_COORDINATOR_CASEBOOK_PATH)
    envelope_schema_payload = load_json(CANONICAL_EVENT_ENVELOPE_SCHEMA_PATH)

    transition_rows, transition_coverage, transition_gap_rows = build_transition_rows(
        state_rows,
        illegal_payload,
        request_lineage_payload,
        replay_casebook,
        replay_matrix_rows,
        identity_repair_casebook,
        lifecycle_casebook,
    )
    schema_rows, schema_coverage, schema_gap_rows, alias_cases = build_schema_rows(
        contracts_payload,
        schema_versions_payload,
        normalization_payload,
        transport_payload,
        dispatch_rows,
        envelope_schema_payload,
    )
    fhir_replay_cases = build_fhir_replay_cases(fhir_contracts_payload)

    summary = {
        "suiteVerdict": "pass_with_bounded_gaps"
        if transition_gap_rows or schema_gap_rows
        else "pass_exact",
        "transitionMatrixRows": len(transition_rows),
        "allowedTransitionRows": len(
            [row for row in transition_rows if row["transitionVerdict"] == "allowed"]
        ),
        "forbiddenTransitionRows": len(
            [row for row in transition_rows if row["transitionVerdict"] == "forbidden"]
        ),
        "transitionGapRows": len(transition_gap_rows),
        "schemaMatrixRows": len(schema_rows),
        "publishedSchemaRows": len(
            [row for row in schema_rows if row["rowKind"] == "published_contract"]
        ),
        "schemaGapRows": len(schema_gap_rows),
        "aliasCases": len(alias_cases),
        "fhirReplayCases": len(fhir_replay_cases),
        "gapRows": len(transition_gap_rows) + len(schema_gap_rows),
    }

    results_payload = {
        "task_id": TASK_ID,
        "generated_at": now_iso(),
        "visual_mode": VISUAL_MODE,
        "source_precedence": SOURCE_PRECEDENCE,
        "summary": summary,
        "transitionCoverage": transition_coverage,
        "schemaCoverage": schema_coverage,
        "gapRows": [*transition_gap_rows, *schema_gap_rows],
        "transitionRows": transition_rows,
        "schemaRows": schema_rows,
        "aliasCases": alias_cases,
        "fhirReplayCases": fhir_replay_cases,
        "upstream_inputs": [
            str(STATE_TRANSITION_TABLE_PATH.relative_to(ROOT)),
            str(ILLEGAL_TRANSITIONS_PATH.relative_to(ROOT)),
            str(REQUEST_LINEAGE_TRANSITIONS_PATH.relative_to(ROOT)),
            str(CANONICAL_EVENT_CONTRACTS_PATH.relative_to(ROOT)),
            str(CANONICAL_EVENT_SCHEMA_VERSIONS_PATH.relative_to(ROOT)),
            str(CANONICAL_EVENT_NORMALIZATION_RULES_PATH.relative_to(ROOT)),
            str(CANONICAL_EVENT_TO_TRANSPORT_PATH.relative_to(ROOT)),
            str(EVENT_APPLIER_DISPATCH_MATRIX_PATH.relative_to(ROOT)),
            str(FHIR_REPRESENTATION_CONTRACTS_PATH.relative_to(ROOT)),
            str(REPLAY_CLASSIFICATION_MATRIX_PATH.relative_to(ROOT)),
            str(REPLAY_COLLISION_CASEBOOK_PATH.relative_to(ROOT)),
            str(CLOSURE_BLOCKER_CASEBOOK_PATH.relative_to(ROOT)),
            str(IDENTITY_REPAIR_CASEBOOK_PATH.relative_to(ROOT)),
            str(LIFECYCLE_COORDINATOR_CASEBOOK_PATH.relative_to(ROOT)),
        ],
    }

    transition_csv_rows = [
        {header: row.get(header, "") for header in TRANSITION_HEADERS} for row in transition_rows
    ]
    schema_csv_rows = [{header: row.get(header, "") for header in SCHEMA_HEADERS} for row in schema_rows]

    write_csv(TRANSITION_MATRIX_CSV_PATH, transition_csv_rows, TRANSITION_HEADERS)
    write_csv(SCHEMA_MATRIX_CSV_PATH, schema_csv_rows, SCHEMA_HEADERS)
    write_json(ALIAS_CASES_JSON_PATH, alias_cases)
    write_json(FHIR_REPLAY_CASES_JSON_PATH, fhir_replay_cases)
    write_json(SUITE_RESULTS_JSON_PATH, results_payload)
    write_text(TRANSITION_DOC_PATH, build_transition_doc(transition_rows))
    write_text(SCHEMA_DOC_PATH, build_schema_doc(schema_rows))
    write_text(
        OVERVIEW_DOC_PATH,
        build_overview_doc(
            transition_coverage,
            schema_coverage,
            [*transition_gap_rows, *schema_gap_rows],
            alias_cases,
            fhir_replay_cases,
            summary,
        ),
    )
    write_text(LAB_HTML_PATH, build_lab_html(results_payload))


if __name__ == "__main__":
    main()
