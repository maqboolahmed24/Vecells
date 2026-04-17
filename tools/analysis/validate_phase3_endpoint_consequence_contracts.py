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

ENDPOINT_DECISION = ROOT / "data" / "contracts" / "228_endpoint_decision.schema.json"
DECISION_EPOCH = ROOT / "data" / "contracts" / "228_decision_epoch.schema.json"
DECISION_SUPERSESSION = ROOT / "data" / "contracts" / "228_decision_supersession_record.schema.json"
ENDPOINT_BINDING = ROOT / "data" / "contracts" / "228_endpoint_decision_binding.schema.json"
ENDPOINT_ACTION = ROOT / "data" / "contracts" / "228_endpoint_decision_action_record.schema.json"
ENDPOINT_SETTLEMENT = ROOT / "data" / "contracts" / "228_endpoint_decision_settlement.schema.json"
ENDPOINT_PREVIEW = ROOT / "data" / "contracts" / "228_endpoint_outcome_preview_artifact.schema.json"
APPROVAL_CHECKPOINT = ROOT / "data" / "contracts" / "228_approval_checkpoint.schema.json"
APPROVAL_POLICY_MATRIX = ROOT / "data" / "contracts" / "228_approval_policy_matrix.yaml"
APPROVAL_ASSESSMENT = ROOT / "data" / "contracts" / "228_approval_requirement_assessment.schema.json"
DUTY_ESCALATION = ROOT / "data" / "contracts" / "228_duty_escalation_record.schema.json"
URGENT_CONTACT_ATTEMPT = ROOT / "data" / "contracts" / "228_urgent_contact_attempt.schema.json"
URGENT_ESCALATION_OUTCOME = ROOT / "data" / "contracts" / "228_urgent_escalation_outcome.schema.json"
BOOKING_INTENT = ROOT / "data" / "contracts" / "228_booking_intent.schema.json"
PHARMACY_INTENT = ROOT / "data" / "contracts" / "228_pharmacy_intent.schema.json"
TRIAGE_REOPEN = ROOT / "data" / "contracts" / "228_triage_reopen_record.schema.json"
TRIAGE_PRESENTATION = ROOT / "data" / "contracts" / "228_triage_outcome_presentation_artifact.schema.json"

PAYLOAD_MATRIX = ROOT / "data" / "analysis" / "228_endpoint_payload_matrix.csv"
EPOCH_CASES = ROOT / "data" / "analysis" / "228_decision_epoch_supersession_cases.csv"
GAP_LOG = ROOT / "data" / "analysis" / "228_approval_and_escalation_gap_log.json"

ARCH_DOC = ROOT / "docs" / "architecture" / "228_phase3_endpoint_decision_approval_and_escalation_contracts.md"
API_DOC = ROOT / "docs" / "api" / "228_phase3_decision_epoch_and_consequence_registry.md"
SECURITY_DOC = ROOT / "docs" / "security" / "228_phase3_consequence_approval_and_escalation_rules.md"
ATLAS = ROOT / "docs" / "frontend" / "228_phase3_endpoint_approval_escalation_atlas.html"
PLAYWRIGHT_SPEC = ROOT / "tests" / "playwright" / "228_phase3_endpoint_approval_escalation_atlas.spec.js"

EXPECTED_ENDPOINTS = [
    "admin_resolution",
    "self_care_and_safety_net",
    "clinician_message",
    "clinician_callback",
    "appointment_required",
    "pharmacy_first_candidate",
    "duty_clinician_escalation",
]
EXPECTED_ACTION_TYPES = [
    "select_endpoint",
    "update_payload",
    "preview_outcome",
    "submit_endpoint",
    "regenerate_preview",
]
EXPECTED_SETTLEMENT_RESULTS = [
    "draft_saved",
    "preview_ready",
    "submitted",
    "stale_recoverable",
    "blocked_policy",
    "blocked_approval_gate",
    "failed",
]
EXPECTED_APPROVAL_STATES = [
    "not_required",
    "required",
    "pending",
    "approved",
    "rejected",
    "superseded",
]
EXPECTED_SUPERSESSION_REASONS = [
    "evidence_delta",
    "safety_delta",
    "duplicate_resolution",
    "approval_invalidation",
    "policy_drift",
    "publication_drift",
    "trust_downgrade",
    "identity_drift",
    "ownership_drift",
    "reopen",
    "manual_replace",
]
EXPECTED_GAP_IDS = {
    "GAP_228_LOCAL_FORM_SUBMIT",
    "GAP_228_STALE_DRAFT_LIVE",
    "GAP_228_APPROVAL_GENERIC_CONTEXT",
    "GAP_228_BOUNDARY_DRIFT",
    "GAP_228_ESCALATION_NOTE_ONLY",
    "GAP_228_STALE_HANDOFF_SEEDS",
    "GAP_228_ASSISTIVE_BYPASS",
    "GAP_228_DETACHED_OUTCOME_PREVIEW",
}
EXPECTED_APPROVAL_RULE_IDS = {
    "AP_228_ADMIN_SENSITIVE",
    "AP_228_SELF_CARE_CLOSURE",
    "AP_228_MESSAGE_CLOSURE",
    "AP_228_CALLBACK_ROUTINE",
    "AP_228_APPOINTMENT_HANDOFF",
    "AP_228_PHARMACY_OVERRIDE",
    "AP_228_DUTY_ESCALATION",
    "AP_228_ASSISTIVE_SEEDED_SUBMIT",
}


def fail(message: str) -> None:
    raise SystemExit(f"[228-phase3-endpoint-consequence] {message}")


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
    for task_id in range(220, 228):
        pattern = rf"^- \[[Xx]\] (?:seq|par)_{task_id:03d}_"
        if not re.search(pattern, checklist, re.MULTILINE):
            fail(f"task {task_id:03d} must be complete before 228")
    if not re.search(
        r"^- \[[Xx-]\] seq_228_phase3_freeze_endpoint_decision_approval_and_escalation_contracts",
        checklist,
        re.MULTILINE,
    ):
        fail("task 228 must be claimed or complete")


def validate_endpoint_decision(schema: dict[str, Any]) -> None:
    required = set(schema.get("required", []))
    for field in [
        "decisionId",
        "taskId",
        "decisionEpochRef",
        "chosenEndpoint",
        "payload",
        "requiredApprovalMode",
        "previewArtifactRef",
        "decisionState",
        "createdAt",
    ]:
        if field not in required:
            fail(f"EndpointDecision schema missing required field {field}")

    endpoint_enum = schema["$defs"]["endpointClass"]["enum"]
    if endpoint_enum != EXPECTED_ENDPOINTS:
        fail("EndpointDecision endpoint taxonomy drifted")

    approval_enum = set(schema["$defs"]["approvalMode"]["enum"])
    if approval_enum != {"not_required", "required"}:
        fail("EndpointDecision.requiredApprovalMode enum drifted")

    decision_states = set(schema["properties"]["decisionState"]["enum"])
    if decision_states != {
        "drafting",
        "preview_ready",
        "awaiting_approval",
        "submitted",
        "superseded",
        "abandoned",
    }:
        fail("EndpointDecision.decisionState enum drifted")


def validate_decision_epoch(schema: dict[str, Any]) -> None:
    required = set(schema.get("required", []))
    for field in [
        "reviewVersionRef",
        "selectedAnchorRef",
        "selectedAnchorTupleHashRef",
        "workspaceSliceTrustProjectionRef",
        "releasePublicationParityRef",
        "epochState",
    ]:
        if field not in required:
            fail(f"DecisionEpoch schema missing required field {field}")

    if set(schema["properties"]["epochState"]["enum"]) != {"live", "superseded", "committed", "blocked"}:
        fail("DecisionEpoch.epochState enum drifted")


def validate_decision_supersession(schema: dict[str, Any]) -> None:
    required = set(schema.get("required", []))
    for field in [
        "supersededDecisionEpochRef",
        "replacementDecisionEpochRef",
        "supersededDecisionRef",
        "reasonClass",
        "reasonRefs",
        "triggeringArtifactRefs",
    ]:
        if field not in required:
            fail(f"DecisionSupersessionRecord schema missing required field {field}")

    reason_enum = schema["properties"]["reasonClass"]["enum"]
    if reason_enum != EXPECTED_SUPERSESSION_REASONS:
        fail("DecisionSupersessionRecord.reasonClass enum drifted")


def validate_endpoint_binding(schema: dict[str, Any]) -> None:
    required = set(schema.get("required", []))
    for field in [
        "decisionEpochRef",
        "boundaryTupleHash",
        "reviewVersionRef",
        "selectedAnchorTupleHashRef",
        "workspaceSliceTrustProjectionRef",
        "surfacePublicationRef",
        "releaseRecoveryDispositionRef",
        "bindingState",
    ]:
        if field not in required:
            fail(f"EndpointDecisionBinding schema missing required field {field}")

    if set(schema["properties"]["bindingState"]["enum"]) != {"live", "preview_only", "stale", "blocked"}:
        fail("EndpointDecisionBinding.bindingState enum drifted")


def validate_endpoint_action(schema: dict[str, Any]) -> None:
    required = set(schema.get("required", []))
    for field in [
        "routeIntentBindingRef",
        "actionType",
        "assistiveSeedMode",
        "assistiveSourceRefs",
        "commandActionRecordRef",
        "selectedAnchorTupleHashRef",
    ]:
        if field not in required:
            fail(f"EndpointDecisionActionRecord schema missing required field {field}")

    if schema["properties"]["actionType"]["enum"] != EXPECTED_ACTION_TYPES:
        fail("EndpointDecisionActionRecord.actionType enum drifted")

    assistive_modes = set(schema["properties"]["assistiveSeedMode"]["enum"])
    if assistive_modes != {"absent", "present"}:
        fail("EndpointDecisionActionRecord.assistiveSeedMode enum drifted")

    rules = schema.get("allOf", [])
    if not rules:
        fail("EndpointDecisionActionRecord must publish assistive submit requirements")
    assistive_rule = rules[0]
    required_on_submit = set(assistive_rule["then"]["required"])
    for field in [
        "assistiveSessionRef",
        "assistiveCapabilityTrustEnvelopeRef",
        "assistiveFeedbackChainRef",
        "humanApprovalGateAssessmentRef",
        "finalHumanArtifactRef",
        "approvalGatePolicyBundleRef",
    ]:
        if field not in required_on_submit:
            fail(f"assistive-seeded submit must require {field}")
    if assistive_rule["then"]["properties"]["assistiveSourceRefs"].get("minItems") != 1:
        fail("assistive-seeded submit must require at least one assistiveSourceRef")


def validate_endpoint_settlement(schema: dict[str, Any]) -> None:
    required = set(schema.get("required", []))
    for field in [
        "endpointDecisionActionRecordRef",
        "decisionEpochRef",
        "commandSettlementRecordRef",
        "transitionEnvelopeRef",
        "releaseRecoveryDispositionRef",
        "result",
    ]:
        if field not in required:
            fail(f"EndpointDecisionSettlement schema missing required field {field}")

    if schema["properties"]["result"]["enum"] != EXPECTED_SETTLEMENT_RESULTS:
        fail("EndpointDecisionSettlement.result enum drifted")


def validate_preview_and_presentation(
    preview: dict[str, Any], presentation: dict[str, Any], reopen: dict[str, Any]
) -> None:
    preview_required = set(preview.get("required", []))
    presentation_required = set(presentation.get("required", []))
    reopen_required = set(reopen.get("required", []))

    for field in [
        "decisionEpochRef",
        "artifactPresentationContractRef",
        "outboundNavigationGrantPolicyRef",
        "runtimePublicationBundleRef",
        "artifactState",
    ]:
        if field not in preview_required:
            fail(f"EndpointOutcomePreviewArtifact missing required field {field}")
        if field not in presentation_required:
            fail(f"TriageOutcomePresentationArtifact missing required field {field}")

    if set(preview["properties"]["artifactState"]["enum"]) != {
        "summary_only",
        "interactive_same_shell",
        "external_handoff_ready",
        "recovery_only",
    }:
        fail("EndpointOutcomePreviewArtifact.artifactState enum drifted")
    if set(presentation["properties"]["artifactState"]["enum"]) != {
        "summary_only",
        "interactive_same_shell",
        "external_handoff_ready",
        "recovery_only",
    }:
        fail("TriageOutcomePresentationArtifact.artifactState enum drifted")

    for field in ["supersededDecisionEpochRef", "decisionSupersessionRecordRef"]:
        if field not in reopen_required:
            fail(f"TriageReopenRecord missing required field {field}")


def validate_approval(schema: dict[str, Any], assessment: dict[str, Any], matrix: dict[str, Any]) -> None:
    required = set(schema.get("required", []))
    for field in [
        "decisionEpochRef",
        "approvalRequirementAssessmentRef",
        "state",
        "lifecycleLeaseRef",
        "leaseAuthorityRef",
        "fencingToken",
        "ownershipEpoch",
    ]:
        if field not in required:
            fail(f"ApprovalCheckpoint schema missing required field {field}")

    if schema["properties"]["state"]["enum"] != EXPECTED_APPROVAL_STATES:
        fail("ApprovalCheckpoint.state enum drifted")

    invalidation_reasons = {
        value for value in schema["properties"]["invalidationReasonClass"]["enum"] if value is not None
    }
    if invalidation_reasons != {
        "endpoint_changed",
        "payload_changed",
        "patient_reply",
        "duplicate_resolution",
        "publication_drift",
        "trust_drift",
        "epoch_superseded",
        "manual_replace",
    }:
        fail("ApprovalCheckpoint invalidationReasonClass drifted")

    assessment_required = set(assessment.get("required", []))
    for field in [
        "decisionEpochRef",
        "endpointDecisionRef",
        "approvalPolicyMatrixRef",
        "matchedPolicyRuleRefs",
        "requiredApprovalMode",
        "checkpointState",
    ]:
        if field not in assessment_required:
            fail(f"ApprovalRequirementAssessment missing required field {field}")
    if set(assessment["properties"]["requiredApprovalMode"]["enum"]) != {"not_required", "required"}:
        fail("ApprovalRequirementAssessment.requiredApprovalMode enum drifted")
    if assessment["properties"]["checkpointState"]["enum"] != EXPECTED_APPROVAL_STATES:
        fail("ApprovalRequirementAssessment.checkpointState enum drifted")

    if matrix.get("taskId") != "seq_228":
        fail("ApprovalPolicyMatrix must be tagged to seq_228")
    if matrix.get("checkpointStateMachine") != EXPECTED_APPROVAL_STATES:
        fail("ApprovalPolicyMatrix checkpoint state machine drifted")

    rules = matrix.get("rules", [])
    rule_ids = {rule["ruleId"] for rule in rules}
    if rule_ids != EXPECTED_APPROVAL_RULE_IDS:
        fail("ApprovalPolicyMatrix rule coverage drifted")
    for rule in rules:
        if rule.get("requiredApprovalMode") not in {"required", "not_required"}:
            fail(f"ApprovalPolicyMatrix rule {rule['ruleId']} has unsupported requiredApprovalMode")
        if "approverRoleRefs" not in rule:
            fail(f"ApprovalPolicyMatrix rule {rule['ruleId']} is missing approverRoleRefs")


def validate_escalation(
    escalation: dict[str, Any], contact_attempt: dict[str, Any], outcome: dict[str, Any]
) -> None:
    escalation_required = set(escalation.get("required", []))
    for field in [
        "decisionEpochRef",
        "endpointDecisionRef",
        "triggerMode",
        "urgentTaskRef",
        "escalationState",
    ]:
        if field not in escalation_required:
            fail(f"DutyEscalationRecord missing required field {field}")
    if set(escalation["properties"]["escalationState"]["enum"]) != {
        "active",
        "contact_in_progress",
        "direct_outcome_recorded",
        "handoff_pending",
        "returned_to_triage",
        "cancelled",
        "expired",
    }:
        fail("DutyEscalationRecord.escalationState enum drifted")

    contact_required = set(contact_attempt.get("required", []))
    for field in ["dutyEscalationRecordRef", "decisionEpochRef", "contactRouteClass", "attemptState", "attemptedAt"]:
        if field not in contact_required:
            fail(f"UrgentContactAttempt missing required field {field}")
    if set(contact_attempt["properties"]["contactRouteClass"]["enum"]) != {
        "primary_phone",
        "secondary_phone",
        "practice_transfer",
        "secure_message_notice",
    }:
        fail("UrgentContactAttempt.contactRouteClass enum drifted")
    if set(contact_attempt["properties"]["attemptState"]["enum"]) != {
        "queued",
        "ringing",
        "voicemail_left",
        "connected",
        "no_answer",
        "failed",
        "cancelled",
    }:
        fail("UrgentContactAttempt.attemptState enum drifted")

    outcome_required = set(outcome.get("required", []))
    for field in ["dutyEscalationRecordRef", "decisionEpochRef", "outcomeClass", "recordedAt"]:
        if field not in outcome_required:
            fail(f"UrgentEscalationOutcome missing required field {field}")
    if set(outcome["properties"]["outcomeClass"]["enum"]) != {
        "direct_non_appointment",
        "downstream_handoff",
        "return_to_triage",
        "cancelled",
        "expired",
    }:
        fail("UrgentEscalationOutcome.outcomeClass enum drifted")


def validate_downstream_seeds(booking: dict[str, Any], pharmacy: dict[str, Any]) -> None:
    for schema, name in [(booking, "BookingIntent"), (pharmacy, "PharmacyIntent")]:
        required = set(schema.get("required", []))
        for field in ["createdFromDecisionId", "decisionEpochRef", "decisionSupersessionRecordRef"]:
            if field not in required:
                fail(f"{name} missing required field {field}")


def validate_payload_matrix(rows: list[dict[str, str]]) -> None:
    endpoint_ids = [row["endpoint_id"] for row in rows]
    if endpoint_ids != EXPECTED_ENDPOINTS:
        fail("endpoint payload matrix coverage drifted")

    for row in rows:
        if row["required_approval_mode"] not in {"required", "not_required"}:
            fail(f"unsupported approval mode in payload matrix row {row['endpoint_id']}")
        for field in [
            "payload_required_fields",
            "preview_artifact_type",
            "downstream_seed_contract",
            "approval_policy_rule",
            "notes",
        ]:
            if not row.get(field):
                fail(f"payload matrix row {row['endpoint_id']} is missing {field}")

    boundary_rows = {
        row["endpoint_id"]: row["boundary_dependency"]
        for row in rows
        if row["endpoint_id"] in {"admin_resolution", "self_care_and_safety_net"}
    }
    for endpoint_id, dependency in boundary_rows.items():
        if "boundaryTupleHash" not in dependency:
            fail(f"{endpoint_id} must stay boundary-coupled in the payload matrix")


def validate_epoch_case_matrix(rows: list[dict[str, str]]) -> None:
    if len(rows) != len(EXPECTED_SUPERSESSION_REASONS):
        fail("decision epoch supersession case count drifted")

    reason_classes = {row["reason_class"] for row in rows}
    if reason_classes != set(EXPECTED_SUPERSESSION_REASONS):
        fail("decision epoch supersession reason coverage drifted")

    case_lookup = {row["case_id"]: row for row in rows}
    approval_case = case_lookup.get("CASE_APPROVAL_INVALIDATION")
    if not approval_case:
        fail("missing CASE_APPROVAL_INVALIDATION in epoch case matrix")
    if approval_case["approval_checkpoint_state"] != "superseded":
        fail("approval invalidation must supersede approval checkpoint state")
    if approval_case["submit_result"] != "blocked_approval_gate":
        fail("approval invalidation must settle blocked_approval_gate")


def validate_gap_log(log: dict[str, Any]) -> None:
    if log.get("status") != "closed":
        fail("gap log must be closed")
    if log.get("openGaps") != []:
        fail("gap log must not retain open gaps")

    gap_ids = {gap["gapId"] for gap in log.get("gaps", [])}
    if gap_ids != EXPECTED_GAP_IDS:
        fail("gap log coverage drifted")
    for gap in log.get("gaps", []):
        if gap.get("status") != "closed":
            fail(f"gap {gap['gapId']} is not closed")
        if not gap.get("artifactRefs"):
            fail(f"gap {gap['gapId']} must publish artifactRefs")


def validate_docs_and_artifacts() -> None:
    require_text(
        ARCH_DOC,
        [
            "`DecisionEpoch` is the sole consequence fence.",
            "`ApprovalCheckpoint` then runs the fixed state machine:",
            "Urgent escalation is a typed peer domain, not a banner.",
        ],
    )
    require_text(
        API_DOC,
        [
            "The endpoint rail action vocabulary is frozen to:",
            "POST /v1/workspace/tasks/{taskId}:submit-endpoint",
            "`BookingIntent`, `PharmacyIntent`, urgent escalation outcomes, and reopen records must keep `decisionEpochRef` lineage-visible.",
        ],
    )
    require_text(
        SECURITY_DOC,
        [
            "`ApprovalCheckpoint` is bound to one exact `decisionEpochRef`.",
            "An assistive-seeded `submit_endpoint` must carry the current:",
            "Outcome previews and confirmations are governed artifacts, not detached pages.",
        ],
    )
    require_text(
        ATLAS,
        [
            "Endpoint_Approval_Escalation_Atlas",
            "EndpointTaxonomyLattice",
            "DecisionEpochBraid",
            "ApprovalCheckpointLadder",
            "UrgentEscalationLaneSet",
            "SchemaParityTable",
            "GapClosureTable",
            "ArtifactRegistryTable",
            "--endpoint: #3158e0;",
            "--approval: #5b61f6;",
            "--urgent: #b42318;",
            "--safe: #0f766e;",
            "--stale: #b7791f;",
        ],
    )
    require_text(
        PLAYWRIGHT_SPEC,
        [
            "phase3EndpointApprovalEscalationAtlasCoverage",
            "Endpoint_Approval_Escalation_Atlas",
            "keyboard traversal and landmarks",
            "reduced-motion equivalence",
            "228-phase3-endpoint-approval-escalation-atlas-default.png",
        ],
    )
    require_text(
        PACKAGE_JSON,
        ['"validate:phase3-endpoint-consequence-contracts": "python3 ./tools/analysis/validate_phase3_endpoint_consequence_contracts.py"'],
    )
    require_text(
        ROOT_SCRIPT_UPDATES,
        ['"validate:phase3-endpoint-consequence-contracts": "python3 ./tools/analysis/validate_phase3_endpoint_consequence_contracts.py"'],
    )


def main() -> None:
    validate_checklist()

    validate_endpoint_decision(load_json(ENDPOINT_DECISION))
    validate_decision_epoch(load_json(DECISION_EPOCH))
    validate_decision_supersession(load_json(DECISION_SUPERSESSION))
    validate_endpoint_binding(load_json(ENDPOINT_BINDING))
    validate_endpoint_action(load_json(ENDPOINT_ACTION))
    validate_endpoint_settlement(load_json(ENDPOINT_SETTLEMENT))
    validate_preview_and_presentation(
        load_json(ENDPOINT_PREVIEW),
        load_json(TRIAGE_PRESENTATION),
        load_json(TRIAGE_REOPEN),
    )
    validate_approval(
        load_json(APPROVAL_CHECKPOINT),
        load_json(APPROVAL_ASSESSMENT),
        load_yaml_like_json(APPROVAL_POLICY_MATRIX),
    )
    validate_escalation(
        load_json(DUTY_ESCALATION),
        load_json(URGENT_CONTACT_ATTEMPT),
        load_json(URGENT_ESCALATION_OUTCOME),
    )
    validate_downstream_seeds(load_json(BOOKING_INTENT), load_json(PHARMACY_INTENT))
    validate_payload_matrix(load_csv(PAYLOAD_MATRIX))
    validate_epoch_case_matrix(load_csv(EPOCH_CASES))
    validate_gap_log(load_json(GAP_LOG))
    validate_docs_and_artifacts()


if __name__ == "__main__":
    main()
