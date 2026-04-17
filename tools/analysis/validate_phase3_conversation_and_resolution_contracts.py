#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import re
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]

CHECKLIST = ROOT / "prompt" / "checklist.md"
PACKAGE_JSON = ROOT / "package.json"
ROOT_SCRIPT_UPDATES = ROOT / "tools" / "analysis" / "root_script_updates.py"

CALLBACK_CASE = ROOT / "data" / "contracts" / "229_callback_case.schema.json"
CALLBACK_EXPECTATION = ROOT / "data" / "contracts" / "229_callback_expectation_envelope.schema.json"
CALLBACK_EVIDENCE = ROOT / "data" / "contracts" / "229_callback_outcome_evidence_bundle.schema.json"
CALLBACK_GATE = ROOT / "data" / "contracts" / "229_callback_resolution_gate.schema.json"
MESSAGE_THREAD = ROOT / "data" / "contracts" / "229_clinician_message_thread.schema.json"
MESSAGE_DISPATCH = ROOT / "data" / "contracts" / "229_message_dispatch_envelope.schema.json"
MESSAGE_EVIDENCE = ROOT / "data" / "contracts" / "229_message_delivery_evidence_bundle.schema.json"
THREAD_EXPECTATION = ROOT / "data" / "contracts" / "229_thread_expectation_envelope.schema.json"
THREAD_GATE = ROOT / "data" / "contracts" / "229_thread_resolution_gate.schema.json"
CONVERSATION_SETTLEMENT = ROOT / "data" / "contracts" / "229_conversation_command_settlement.schema.json"
CONVERSATION_CLUSTER = ROOT / "data" / "contracts" / "229_patient_conversation_cluster.schema.json"
COMPOSER_LEASE = ROOT / "data" / "contracts" / "229_patient_composer_lease.schema.json"
URGENT_DIVERSION = ROOT / "data" / "contracts" / "229_patient_urgent_diversion_state.schema.json"
BOUNDARY_DECISION = ROOT / "data" / "contracts" / "229_self_care_boundary_decision.schema.json"
ADVICE_DEPENDENCY = ROOT / "data" / "contracts" / "229_advice_admin_dependency_set.schema.json"
ADMIN_CASE = ROOT / "data" / "contracts" / "229_admin_resolution_case.schema.json"
ADMIN_SUBTYPES = ROOT / "data" / "contracts" / "229_admin_resolution_subtype_profiles.yaml"
ADMIN_COMPLETION = ROOT / "data" / "contracts" / "229_admin_resolution_completion_artifact.schema.json"
ADMIN_SETTLEMENT = ROOT / "data" / "contracts" / "229_admin_resolution_settlement.schema.json"
ADMIN_EXPERIENCE = ROOT / "data" / "contracts" / "229_admin_resolution_experience_projection.schema.json"

STATE_MATRIX = ROOT / "data" / "analysis" / "229_callback_and_message_state_matrix.csv"
BOUNDARY_CASES = ROOT / "data" / "analysis" / "229_selfcare_admin_boundary_cases.csv"
GAP_LOG = ROOT / "data" / "analysis" / "229_conversation_resolution_gap_log.json"
CONTACT_REPAIR_GAP = ROOT / "data" / "analysis" / "PARALLEL_INTERFACE_GAP_PHASE3_CONTACT_REPAIR.json"

ARCH_DOC = ROOT / "docs" / "architecture" / "229_phase3_callback_message_selfcare_admin_boundaries.md"
API_DOC = ROOT / "docs" / "api" / "229_phase3_conversation_resolution_and_boundary_registry.md"
SECURITY_DOC = ROOT / "docs" / "security" / "229_phase3_callback_message_admin_reconciliation_rules.md"
ATLAS = ROOT / "docs" / "frontend" / "229_phase3_conversation_resolution_boundary_atlas.html"
PLAYWRIGHT_SPEC = ROOT / "tests" / "playwright" / "229_phase3_conversation_resolution_boundary_atlas.spec.js"

EXPECTED_CALLBACK_LIFECYCLE = [
    "created",
    "queued",
    "scheduled",
    "ready_for_attempt",
    "attempt_in_progress",
    "awaiting_outcome_evidence",
    "answered",
    "no_answer",
    "voicemail_left",
    "contact_route_repair_pending",
    "awaiting_retry",
    "escalation_review",
    "completed",
    "cancelled",
    "expired",
    "closed",
]
EXPECTED_MESSAGE_PRIMARY = [
    "drafted",
    "approved",
    "sent",
    "delivered",
    "patient_replied",
    "awaiting_clinician_review",
    "closed",
]
EXPECTED_MESSAGE_REPAIR = [
    "sent",
    "delivery_failed",
    "contact_route_repair_pending",
    "approved",
    "sent",
]
EXPECTED_ADMIN_SUBTYPES = [
    "document_or_letter_workflow",
    "form_workflow",
    "result_follow_up_workflow",
    "medication_admin_query",
    "registration_or_demographic_update",
    "routed_admin_task",
]
EXPECTED_ADMIN_COMPLETION_TYPES = [
    "document_issued",
    "form_submitted",
    "result_notice_delivered",
    "medication_admin_answered",
    "demographics_updated",
    "routed_task_disposition_recorded",
]
EXPECTED_GAP_IDS = {
    "GAP_229_CALLBACK_PROMISE_ENVELOPE_ONLY",
    "GAP_229_MESSAGE_DELIVERY_EVIDENCE_REQUIRED",
    "GAP_229_SINGLE_FENCE_ATTEMPT_AND_DISPATCH",
    "GAP_229_REPLY_REQUIRES_SETTLEMENT_AND_RESAFETY",
    "GAP_229_BOUNDARY_DECISION_GOVERNS_MEANING",
    "GAP_229_ADMIN_WAITING_TYPED_AND_OWNED",
    "GAP_229_ADMIN_COMPLETION_REQUIRES_ARTIFACT",
    "GAP_229_SINGLE_LIVE_COMPOSER",
    "GAP_229_CONFIDENCE_CANNOT_MANUFACTURE_SUCCESS",
}


def fail(message: str) -> None:
    raise SystemExit(f"[229-phase3-conversation-resolution] {message}")


def read(path: Path) -> str:
    if not path.exists():
        fail(f"missing required file {path.relative_to(ROOT)}")
    return path.read_text(encoding="utf-8")


def load_json(path: Path) -> Any:
    try:
        return json.loads(read(path))
    except json.JSONDecodeError as exc:
        fail(f"invalid JSON in {path.relative_to(ROOT)}: {exc}")


def load_yaml_like_json(path: Path) -> Any:
    return load_json(path)


def load_csv(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        fail(f"missing required file {path.relative_to(ROOT)}")
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def require_text(path: Path, snippets: list[str]) -> None:
    text = read(path)
    for snippet in snippets:
        if snippet not in text:
            fail(f"{path.relative_to(ROOT)} is missing required text: {snippet}")


def validate_checklist() -> None:
    checklist = read(CHECKLIST)
    for task_id in range(220, 229):
        pattern = rf"^- \[[Xx]\] (?:seq|par)_{task_id:03d}_"
        if not re.search(pattern, checklist, re.MULTILINE):
            fail(f"task {task_id:03d} must be complete before 229")
    if not re.search(
        r"^- \[[Xx-]\] seq_229_phase3_freeze_callback_clinician_messaging_and_admin_resolution_boundaries",
        checklist,
        re.MULTILINE,
    ):
        fail("task 229 must be claimed or complete")


def validate_callback_contracts() -> None:
    callback_case = load_json(CALLBACK_CASE)
    expectation = load_json(CALLBACK_EXPECTATION)
    evidence = load_json(CALLBACK_EVIDENCE)
    gate = load_json(CALLBACK_GATE)

    if callback_case.get("x-canonicalLifecycle") != EXPECTED_CALLBACK_LIFECYCLE:
        fail("Callback lifecycle drifted")

    if expectation["properties"]["patientVisibleState"]["enum"] != [
        "queued",
        "scheduled",
        "attempting_now",
        "retry_planned",
        "route_repair_required",
        "escalated",
        "closed",
    ]:
        fail("CallbackExpectationEnvelope patient-visible states drifted")

    invariant_text = " ".join(expectation.get("x-governedInvariants", []))
    if "sole patient-facing callback promise" not in invariant_text:
        fail("CallbackExpectationEnvelope no longer claims sole patient-facing truth")

    if set(evidence["properties"]["outcome"]["enum"]) != {
        "answered",
        "no_answer",
        "voicemail_left",
        "route_invalid",
        "provider_failure",
    }:
        fail("CallbackOutcomeEvidenceBundle outcome enum drifted")

    if set(gate["properties"]["decision"]["enum"]) != {"retry", "escalate", "complete", "cancel", "expire"}:
        fail("CallbackResolutionGate decision enum drifted")

    gate_invariants = " ".join(gate.get("x-governedInvariants", []))
    if "sole authority" not in gate_invariants or "stale callback promise" not in gate_invariants:
        fail("CallbackResolutionGate invariants no longer freeze callback closure correctly")


def validate_message_contracts() -> None:
    thread = load_json(MESSAGE_THREAD)
    dispatch = load_json(MESSAGE_DISPATCH)
    evidence = load_json(MESSAGE_EVIDENCE)
    expectation = load_json(THREAD_EXPECTATION)
    gate = load_json(THREAD_GATE)

    if thread.get("x-canonicalPrimaryPath") != EXPECTED_MESSAGE_PRIMARY:
        fail("ClinicianMessageThread primary path drifted")
    if thread.get("x-canonicalRepairPath") != EXPECTED_MESSAGE_REPAIR:
        fail("ClinicianMessageThread repair path drifted")

    if dispatch["properties"]["repairIntent"]["enum"] != [
        "initial_send",
        "controlled_resend",
        "channel_change",
        "attachment_recovery",
    ]:
        fail("MessageDispatchEnvelope repair intents drifted")

    if set(evidence["properties"]["deliveryState"]["enum"]) != {"delivered", "disputed", "failed", "expired"}:
        fail("MessageDeliveryEvidenceBundle deliveryState enum drifted")
    evidence_invariants = " ".join(evidence.get("x-governedInvariants", []))
    if "only durable source" not in evidence_invariants:
        fail("MessageDeliveryEvidenceBundle no longer claims delivery truth correctly")

    expectation_invariants = " ".join(expectation.get("x-governedInvariants", []))
    if "sole patient-facing reply" not in expectation_invariants:
        fail("ThreadExpectationEnvelope no longer claims sole patient-facing truth")

    if set(gate["properties"]["decision"]["enum"]) != {
        "await_reply",
        "review_pending",
        "escalate_to_callback",
        "close",
        "reopen",
        "repair_route",
    }:
        fail("ThreadResolutionGate decision enum drifted")


def validate_conversation_contracts() -> None:
    settlement = load_json(CONVERSATION_SETTLEMENT)
    cluster = load_json(CONVERSATION_CLUSTER)
    composer = load_json(COMPOSER_LEASE)
    urgent = load_json(URGENT_DIVERSION)

    if set(settlement["properties"]["actionScope"]["enum"]) != {
        "message_reply",
        "message_send",
        "message_repair",
        "callback_schedule",
        "callback_reschedule",
        "callback_cancel",
        "callback_acknowledgement",
        "contact_route_repair",
    }:
        fail("ConversationCommandSettlement action scope drifted")

    if "one authoritative conversation cluster" not in " ".join(cluster.get("x-governedInvariants", [])):
        fail("PatientConversationCluster no longer freezes a single authoritative reply path")
    if "one live patient composer" not in " ".join(composer.get("x-governedInvariants", [])):
        fail("PatientComposerLease no longer freezes single-composer behaviour")
    if "preempts unsafe async interaction" not in " ".join(urgent.get("x-governedInvariants", [])):
        fail("PatientUrgentDiversionState no longer freezes unsafe async interaction")


def validate_boundary_and_admin_contracts() -> None:
    boundary = load_json(BOUNDARY_DECISION)
    dependency = load_json(ADVICE_DEPENDENCY)
    admin_case = load_json(ADMIN_CASE)
    subtype_registry = load_yaml_like_json(ADMIN_SUBTYPES)
    completion = load_json(ADMIN_COMPLETION)
    settlement = load_json(ADMIN_SETTLEMENT)
    experience = load_json(ADMIN_EXPERIENCE)

    if boundary["properties"]["decisionState"]["enum"] != [
        "self_care",
        "admin_resolution",
        "clinician_review_required",
        "blocked_pending_review",
    ]:
        fail("SelfCareBoundaryDecision decisionState drifted")

    boundary_invariants = " ".join(boundary.get("x-governedInvariants", []))
    if "sole classifier" not in boundary_invariants:
        fail("SelfCareBoundaryDecision no longer claims sole classifier status")

    if dependency["properties"]["dependencyState"]["enum"] != [
        "clear",
        "repair_required",
        "disputed",
        "blocked_pending_identity",
        "blocked_pending_consent",
        "blocked_pending_external_confirmation",
    ]:
        fail("AdviceAdminDependencySet dependencyState drifted")

    if admin_case.get("x-canonicalPrimaryPath") != [
        "queued",
        "in_progress",
        "awaiting_internal_action",
        "awaiting_external_dependency",
        "awaiting_practice_action",
        "patient_notified",
        "completed",
        "closed",
    ]:
        fail("AdminResolutionCase primary path drifted")

    subtype_ids = [row["adminResolutionSubtypeRef"] for row in subtype_registry["subtypes"]]
    if subtype_ids != EXPECTED_ADMIN_SUBTYPES:
        fail("AdminResolutionSubtypeProfile registry drifted")

    completion_types = completion["properties"]["completionType"]["enum"]
    if completion_types != EXPECTED_ADMIN_COMPLETION_TYPES:
        fail("AdminResolutionCompletionArtifact completionType drifted")

    if set(settlement["properties"]["result"]["enum"]) != {
        "queued",
        "patient_notified",
        "waiting_dependency",
        "completed",
        "reopened_for_review",
        "blocked_pending_safety",
        "stale_recoverable",
    }:
        fail("AdminResolutionSettlement result enum drifted")

    settlement_invariants = " ".join(settlement.get("x-governedInvariants", []))
    if "completed requires a matching AdminResolutionCompletionArtifact" not in settlement_invariants:
        fail("AdminResolutionSettlement no longer requires typed completion proof")

    if set(experience["properties"]["projectionState"]["enum"]) != {"fresh", "stale", "recovery_required"}:
        fail("AdminResolutionExperienceProjection projection states drifted")


def validate_analysis_files() -> None:
    matrix = load_csv(STATE_MATRIX)
    boundary_cases = load_csv(BOUNDARY_CASES)
    gap_log = load_json(GAP_LOG)
    contact_gap = load_json(CONTACT_REPAIR_GAP)

    callback_rows = [row for row in matrix if row["domain"] == "callback"]
    message_rows = [row for row in matrix if row["domain"] == "message"]
    if not callback_rows or not message_rows:
        fail("229_callback_and_message_state_matrix.csv must cover both callback and message domains")

    callback_states = {row["stateId"] for row in callback_rows}
    if not set(EXPECTED_CALLBACK_LIFECYCLE).issubset(callback_states):
        fail("Callback state matrix is missing canonical callback lifecycle states")

    if not any(
        row["stateId"] == "delivered" and row["evidenceRequirement"] == "message_delivery_evidence_bundle"
        for row in message_rows
    ):
        fail("Message delivered state must require message_delivery_evidence_bundle in the state matrix")

    if not any(
        row["stateId"] == "answered" and row["evidenceRequirement"] == "callback_outcome_evidence_bundle"
        for row in callback_rows
    ):
        fail("Callback answered state must require callback_outcome_evidence_bundle in the state matrix")

    if len(boundary_cases) < 7:
        fail("Boundary case matrix is too small")
    boundary_case_ids = {row["caseId"] for row in boundary_cases}
    for required in {
        "BOUNDARY_SELF_CARE_GUIDANCE",
        "BOUNDARY_ADMIN_DOCUMENT",
        "BOUNDARY_ADMIN_FORM",
        "BOUNDARY_ADMIN_RESULT",
        "BOUNDARY_ADMIN_MEDICATION",
        "BOUNDARY_ADMIN_DEMOGRAPHIC",
        "BOUNDARY_ADMIN_ROUTED",
        "BOUNDARY_CLINICIAN_REENTRY",
    }:
        if required not in boundary_case_ids:
            fail(f"Boundary case matrix is missing {required}")

    gap_ids = {row["id"] for row in gap_log["gaps"]}
    if gap_ids != EXPECTED_GAP_IDS:
        fail("Gap log no longer closes the mandatory nine gaps")
    if any(row["status"] != "closed" for row in gap_log["gaps"]):
        fail("All mandatory 229 gaps must be closed")

    for field in [
        "taskId",
        "missingSurface",
        "expectedOwnerTask",
        "temporaryFallback",
        "riskIfUnresolved",
        "followUpAction",
    ]:
        if field not in contact_gap:
            fail(f"PARALLEL_INTERFACE_GAP_PHASE3_CONTACT_REPAIR.json is missing {field}")


def validate_docs_and_atlas() -> None:
    require_text(
        ARCH_DOC,
        [
            "CallbackExpectationEnvelope is the sole patient-facing callback promise",
            "MessageDeliveryEvidenceBundle is the only durable delivery truth",
            "SelfCareBoundaryDecision is the sole classifier",
            "PARALLEL_INTERFACE_GAP_PHASE3_CONTACT_REPAIR.json",
        ],
    )
    require_text(
        API_DOC,
        [
            "ConversationCommandSettlement",
            "document_or_letter_workflow",
            "drafted -> approved -> sent -> delivered -> patient_replied -> awaiting_clinician_review -> closed",
        ],
    )
    require_text(
        SECURITY_DOC,
        [
            "AdapterReceiptCheckpoint",
            "same-fence retries",
            "AdminResolutionCompletionArtifact",
        ],
    )
    require_text(
        ATLAS,
        [
            "Conversation_Resolution_Boundary_Atlas",
            "CallbackLifecycleLadder",
            "MessageThreadLadder",
            "PatientConversationBraid",
            "SelfCareBoundaryTriad",
            "AdminSubtypeCompletionLadder",
            "CallbackStateParityTable",
            "MessageStateParityTable",
            "BoundaryCaseTable",
            "AdminSubtypeParityTable",
            "SchemaParityTable",
            "GapClosureTable",
            "ArtifactRegistryTable",
            "#3158E0",
            "#5B61F6",
            "#0F766E",
            "#B7791F",
            "#B42318",
        ],
    )
    require_text(
        PLAYWRIGHT_SPEC,
        [
            "Conversation_Resolution_Boundary_Atlas",
            "reduced-motion equivalence",
            "keyboard traversal and landmarks",
            "diagram/table parity",
        ],
    )


def validate_script_registry() -> None:
    package_text = read(PACKAGE_JSON)
    root_script_text = read(ROOT_SCRIPT_UPDATES)
    for text, label in [(package_text, "package.json"), (root_script_text, "root_script_updates.py")]:
        if '"validate:phase3-conversation-resolution-contracts"' not in text:
            fail(f"{label} is missing the 229 validation script")
        if "validate:phase3-endpoint-consequence-contracts" not in text:
            fail(f"{label} lost the 228 validation chain")


def main() -> None:
    validate_checklist()
    validate_callback_contracts()
    validate_message_contracts()
    validate_conversation_contracts()
    validate_boundary_and_admin_contracts()
    validate_analysis_files()
    validate_docs_and_atlas()
    validate_script_registry()
    print("229 phase3 conversation and resolution contracts validated")


if __name__ == "__main__":
    main()
