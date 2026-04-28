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

QUEUE_RANK_PLAN = ROOT / "data" / "contracts" / "227_queue_rank_plan.schema.json"
QUEUE_RANK_SNAPSHOT = ROOT / "data" / "contracts" / "227_queue_rank_snapshot.schema.json"
QUEUE_RANK_ENTRY = ROOT / "data" / "contracts" / "227_queue_rank_entry.schema.json"
QUEUE_ASSIGNMENT_SUGGESTION = ROOT / "data" / "contracts" / "227_queue_assignment_suggestion_snapshot.schema.json"
DUPLICATE_REVIEW = ROOT / "data" / "contracts" / "227_duplicate_review_snapshot.schema.json"
MORE_INFO_CYCLE = ROOT / "data" / "contracts" / "227_more_info_cycle.schema.json"
MORE_INFO_CHECKPOINT = ROOT / "data" / "contracts" / "227_more_info_reply_window_checkpoint.schema.json"
MORE_INFO_REMINDER = ROOT / "data" / "contracts" / "227_more_info_reminder_schedule.schema.json"
MORE_INFO_DISPOSITION = ROOT / "data" / "contracts" / "227_more_info_response_disposition.schema.json"
CONSTANTS_REGISTRY = ROOT / "data" / "contracts" / "227_queue_constants_and_threshold_registry.yaml"

QUEUE_MATRIX = ROOT / "data" / "analysis" / "227_queue_sort_and_fairness_matrix.csv"
CHECKPOINT_CASES = ROOT / "data" / "analysis" / "227_more_info_checkpoint_and_disposition_cases.csv"
DUPLICATE_CASES = ROOT / "data" / "analysis" / "227_duplicate_authority_and_relation_cases.json"
GAP_LOG = ROOT / "data" / "analysis" / "227_phase3_queue_more_info_gap_log.json"

ARCH_DOC = ROOT / "docs" / "architecture" / "227_phase3_queue_ranking_fairness_duplicate_and_more_info_contracts.md"
API_DOC = ROOT / "docs" / "api" / "227_queue_rank_and_more_info_contract_registry.md"
SECURITY_DOC = ROOT / "docs" / "security" / "227_overload_honesty_duplicate_authority_and_reply_window_rules.md"
ATLAS = ROOT / "docs" / "frontend" / "227_queue_fairness_duplicate_more_info_atlas.html"
PLAYWRIGHT_SPEC = ROOT / "tests" / "playwright" / "227_queue_fairness_duplicate_more_info_atlas.spec.js"


def fail(message: str) -> None:
    raise SystemExit(f"[227-phase3-queue-more-info] {message}")


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
    for task_id in range(220, 227):
        pattern = rf"^- \[[Xx]\] (?:seq|par)_{task_id:03d}_"
        if not re.search(pattern, checklist, re.MULTILINE):
            fail(f"task {task_id:03d} must be complete before 227")
    if not re.search(
        r"^- \[[Xx-]\] seq_227_phase3_freeze_queue_ranking_fairness_duplicate_cluster_and_more_info_contracts",
        checklist,
        re.MULTILINE,
    ):
        fail("task 227 must be claimed or complete")


def validate_queue_rank_plan_schema(schema: dict[str, Any]) -> None:
    required = set(schema.get("required", []))
    for field in [
        "queueRankPlanId",
        "queueFamilyRef",
        "lexicographicTierPolicy",
        "withinTierFormula",
        "withinTierWeightSet",
        "thresholdSet",
        "fairnessMergePolicy",
        "overloadGuardPolicy",
        "assignmentSuggestionPolicy",
        "explanationSchema",
        "canonicalTieBreakPolicy",
        "planHash",
        "effectiveAt",
    ]:
        if field not in required:
            fail(f"QueueRankPlan schema missing required field {field}")

    threshold_required = set(schema["properties"]["thresholdSet"]["required"])
    expected_thresholds = {
        "s_min_minutes",
        "theta_sla_critical_minutes",
        "theta_sla_warn_minutes",
        "tau_sla_minutes",
        "tau_late_minutes",
        "H_late_minutes",
        "tau_age_minutes",
        "A_cap_minutes",
        "r_base",
        "r_delta",
        "r_wait",
        "tau_return_minutes",
        "H_return_minutes",
    }
    if threshold_required != expected_thresholds:
        fail("QueueRankPlan.thresholdSet drifted from the frozen constant family")

    suggestion_required = set(schema["properties"]["assignmentSuggestionPolicy"]["required"])
    for field in ["epsilon_assign", "softWipCapRatio", "mayRewriteCanonicalOrder"]:
        if field not in suggestion_required:
            fail(f"QueueRankPlan.assignmentSuggestionPolicy missing required field {field}")
    if schema["properties"]["assignmentSuggestionPolicy"]["properties"]["mayRewriteCanonicalOrder"].get("const") is not False:
        fail("QueueRankPlan.assignmentSuggestionPolicy must freeze mayRewriteCanonicalOrder = false")

    invariants = schema.get("x-governedInvariants", [])
    required_invariants = {
        "QueueRankPlan is the only versioned source of canonical queue ordering.",
        "overload honesty must suppress starvation promises when rho_crit >= rho_guard.",
    }
    if not required_invariants.issubset(set(invariants)):
        fail("QueueRankPlan governed invariants drifted")


def validate_queue_rank_snapshot_schema(schema: dict[str, Any]) -> None:
    required = set(schema.get("required", []))
    for field in ["asOfAt", "sourceFactCutRef", "overloadState", "rowOrderHash"]:
        if field not in required:
            fail(f"QueueRankSnapshot schema missing required field {field}")
    overload_states = set(schema["properties"]["overloadState"]["enum"])
    if overload_states != {"nominal", "overload_critical"}:
        fail("QueueRankSnapshot.overloadState enum drifted")


def validate_queue_rank_entry_schema(schema: dict[str, Any]) -> None:
    required = set(schema.get("required", []))
    for field in [
        "ordinal",
        "lexicographicTier",
        "urgencyScore",
        "residualBand",
        "contactRiskBand",
        "duplicateReviewFlag",
        "urgencyCarry",
        "fairnessBandRef",
        "canonicalTieBreakKey",
        "explanationPayload",
    ]:
        if field not in required:
            fail(f"QueueRankEntry schema missing required field {field}")

    payload_required = set(schema["properties"]["explanationPayload"]["required"])
    for field in [
        "ageMinutes",
        "returnAgeMinutes",
        "expectedServiceMinutes",
        "d_sla_minutes",
        "laxity_minutes",
        "slaClass",
        "slaWarn",
        "slaLate",
        "slaPressure",
        "priorityOrdinal",
        "residual",
        "contactRisk",
        "returnedFlag",
        "evidenceDeltaSeverity",
        "returnLift",
        "urgencyCarry",
        "vulnerability",
        "coverageFit",
        "routingGap",
        "duplicateReviewFlag",
    ]:
        if field not in payload_required:
            fail(f"QueueRankEntry explanationPayload missing required field {field}")


def validate_queue_assignment_suggestion_schema(schema: dict[str, Any]) -> None:
    required = set(schema.get("required", []))
    for field in [
        "rankSnapshotRef",
        "candidateWindowSize",
        "suggestionRows",
        "governedAutoClaimRefs",
        "authorityBoundary",
    ]:
        if field not in required:
            fail(f"QueueAssignmentSuggestionSnapshot schema missing required field {field}")
    boundary = schema["properties"]["authorityBoundary"]["properties"]["mayRewriteCanonicalOrder"]
    if boundary.get("const") is not False:
        fail("QueueAssignmentSuggestionSnapshot must freeze mayRewriteCanonicalOrder = false")


def validate_duplicate_review_schema(schema: dict[str, Any]) -> None:
    required = set(schema.get("required", []))
    for field in [
        "duplicateClusterRef",
        "pairEvidenceRefs",
        "currentResolutionDecisionRef",
        "authorityBoundary",
    ]:
        if field not in required:
            fail(f"DuplicateReviewSnapshot schema missing required field {field}")

    boundary = schema["properties"]["authorityBoundary"]["properties"]
    if boundary["duplicateClusterAuthority"].get("const") != "DuplicateCluster":
        fail("DuplicateReviewSnapshot must keep DuplicateCluster as the duplicate authority")
    if boundary["sameRequestAttachAuthority"].get("const") != "DuplicateResolutionDecision":
        fail("DuplicateReviewSnapshot must keep DuplicateResolutionDecision as attach authority")
    if boundary["replayAuthority"].get("const") != "IdempotencyRecord":
        fail("DuplicateReviewSnapshot must keep IdempotencyRecord as replay authority")


def validate_more_info_schemas(
    cycle: dict[str, Any],
    checkpoint: dict[str, Any],
    reminder: dict[str, Any],
    disposition: dict[str, Any],
) -> None:
    cycle_required = set(cycle.get("required", []))
    for field in ["replyWindowCheckpointRef", "reminderScheduleRef", "supersedesCycleRef", "supersededByCycleRef"]:
        if field not in cycle["properties"] and field not in cycle_required:
            fail(f"MoreInfoCycle must publish {field}")
    if cycle.get("x-dueAuthority") != "MoreInfoReplyWindowCheckpoint":
        fail("MoreInfoCycle must name MoreInfoReplyWindowCheckpoint as due authority")

    checkpoint_states = set(checkpoint["properties"]["replyWindowState"]["enum"])
    expected_checkpoint_states = {
        "open",
        "reminder_due",
        "late_review",
        "expired",
        "superseded",
        "settled",
        "blocked_repair",
    }
    if checkpoint_states != expected_checkpoint_states:
        fail("MoreInfoReplyWindowCheckpoint.replyWindowState enum drifted")
    checkpoint_invariants = checkpoint.get("x-governedInvariants", [])
    if not any("sole authority" in invariant for invariant in checkpoint_invariants):
        fail("MoreInfoReplyWindowCheckpoint must freeze sole-authority wording")

    reminder_states = set(reminder["properties"]["scheduleState"]["enum"])
    if reminder_states != {"scheduled", "suppressed", "exhausted", "completed", "cancelled"}:
        fail("MoreInfoReminderSchedule.scheduleState enum drifted")

    disposition_enum = set(disposition["properties"]["disposition"]["enum"])
    expected_dispositions = {
        "accepted_in_window",
        "accepted_late_review",
        "superseded_duplicate",
        "expired_rejected",
        "blocked_repair",
    }
    if disposition_enum != expected_dispositions:
        fail("MoreInfoResponseDisposition.disposition enum drifted")


def validate_constants_registry(registry: dict[str, Any]) -> None:
    if registry.get("taskId") != "seq_227":
        fail("constants registry taskId drifted")
    if registry.get("registryVersion") != "227.queue-more-info.v1":
        fail("constants registry version drifted")

    queue = registry.get("queueRankPlan", {})
    if queue.get("withinTierFormula") != (
        "u_i = 1 - exp(-(w_sla * slaPressure_i + w_age * ageLift_i + w_residual * residual_i + "
        "w_contact * contactRisk_i + w_return * returnLift_i + w_carry * urgencyCarry_i + "
        "w_vulnerability * vulnerability_i))"
    ):
        fail("constants registry within-tier urgency formula drifted")

    expected_sort_order = [
        "escalated_i desc",
        "slaClass_i desc",
        "priority_i desc",
        "max(residualBand_i, contactRiskBand_i) desc",
        "duplicateReview_i desc",
        "urgencyCarry_i desc",
        "u_i desc",
        "queueEnteredAt asc",
        "canonicalTieBreakKey_i asc",
    ]
    if queue.get("sortOrder") != expected_sort_order:
        fail("constants registry sortOrder drifted")

    weights = queue.get("weights", {})
    expected_weight_keys = {
        "w_sla",
        "w_age",
        "w_residual",
        "w_contact",
        "w_return",
        "w_carry",
        "w_vulnerability",
        "beta_warn",
        "beta_late",
    }
    if set(weights) != expected_weight_keys:
        fail("constants registry weight set drifted")
    weighted_sum = sum(weights[key] for key in ["w_sla", "w_age", "w_residual", "w_contact", "w_return", "w_carry", "w_vulnerability"])
    if abs(weighted_sum - 1.0) > 1e-9:
        fail("queue urgency weights must still sum to 1.0")
    if abs(weights["beta_warn"] + weights["beta_late"] - 1.0) > 1e-9:
        fail("slaPressure beta weights must still sum to 1.0")

    thresholds = queue.get("thresholds", {})
    expected_threshold_keys = {
        "s_min_minutes",
        "theta_sla_critical_minutes",
        "theta_sla_warn_minutes",
        "tau_sla_minutes",
        "tau_late_minutes",
        "H_late_minutes",
        "tau_age_minutes",
        "A_cap_minutes",
        "r_base",
        "r_delta",
        "r_wait",
        "tau_return_minutes",
        "H_return_minutes",
    }
    if set(thresholds) != expected_threshold_keys:
        fail("constants registry threshold set drifted")

    fairness = queue.get("fairnessMergePolicy", {})
    if fairness.get("algorithm") != "deterministic_service_cost_aware_deficit_round_robin":
        fail("constants registry fairness algorithm drifted")
    bands = fairness.get("bands", [])
    if [band["fairnessBandRef"] for band in bands] != [
        "band_returned_review",
        "band_risk_attention",
        "band_routine",
        "band_low_intensity",
    ]:
        fail("constants registry fairness band order drifted")

    overload = queue.get("overloadGuardPolicy", {})
    if overload.get("formula") != "rho_crit = lambdaHat_crit * mean(expectedService_i | escalated_i = 1 or slaClass_i = 3) / (m * muHat)":
        fail("constants registry overload formula drifted")
    if overload.get("rho_guard") != 0.85:
        fail("constants registry rho_guard drifted")
    if set(overload.get("triggeredResponses", [])) != {"staffing", "diversion", "sla_rebasing"}:
        fail("constants registry overload response set drifted")
    if set(overload.get("suppressedPromises", [])) != {
        "starvation_free_copy",
        "routine_eta_promises",
        "fairness_floor_reassurance",
    }:
        fail("constants registry suppressed promises drifted")

    assignment = queue.get("assignmentSuggestionPolicy", {})
    if assignment.get("mayRewriteCanonicalOrder") is not False:
        fail("constants registry must freeze mayRewriteCanonicalOrder = false")
    if assignment.get("epsilon_assign") != 0.08:
        fail("constants registry epsilon_assign drifted")

    duplicate_bridge = registry.get("duplicateAuthorityBridge", {})
    if duplicate_bridge.get("phase0CanonicalAuthority") != "DuplicateCluster":
        fail("constants registry must keep DuplicateCluster as phase0CanonicalAuthority")
    if duplicate_bridge.get("reviewProjection") != "DuplicateReviewSnapshot":
        fail("constants registry must keep DuplicateReviewSnapshot as review projection")
    if duplicate_bridge.get("thresholdPolicy", {}).get("policyRef") != "duplicate_threshold_policy::2026-04-12":
        fail("constants registry duplicate threshold policy ref drifted")

    more_info = registry.get("moreInfoPolicies", {})
    if more_info.get("checkpointAuthority") != "MoreInfoReplyWindowCheckpoint":
        fail("constants registry checkpointAuthority drifted")
    if more_info.get("responseDispositionAuthority") != "MoreInfoResponseDisposition":
        fail("constants registry responseDispositionAuthority drifted")
    if more_info.get("reopenGuard") != {"N_reopen_max": 3, "W_reopen_hours": 24}:
        fail("constants registry reopen guard drifted")


def validate_queue_matrix(rows: list[dict[str, str]]) -> None:
    if len(rows) != 7:
        fail("queue sort matrix must publish exactly seven coverage rows")
    scenario_ids = {row["scenario_id"] for row in rows}
    expected = {
        "CASE_ESCALATED_ALWAYS_FIRST",
        "CASE_SLA_CLASS_BEATS_ROUTINE",
        "CASE_DUPLICATE_REVIEW_PROMOTED_WITHIN_TIER",
        "CASE_RETURN_LIFT_REQUEUE",
        "CASE_FAIRNESS_FLOOR_SERVICE_COST",
        "CASE_ASSIGNMENT_ISOLATED",
        "CASE_OVERLOAD_SUPPRESSES_PROMISES",
    }
    if scenario_ids != expected:
        fail("queue sort matrix scenario set drifted")
    if any(row["assignmentSuggestionCanRewriteOrder"] != "false" for row in rows):
        fail("queue sort matrix must keep assignmentSuggestionCanRewriteOrder false for every scenario")
    if not any(row["overloadState"] == "overload_critical" for row in rows):
        fail("queue sort matrix must contain overload_critical coverage")


def validate_checkpoint_cases(rows: list[dict[str, str]]) -> None:
    if len(rows) < 8:
        fail("checkpoint case matrix must publish at least eight rows")
    case_ids = {row["case_id"] for row in rows}
    required_cases = {
        "CASE_ACTIVE_REPLY_OPEN",
        "CASE_REMINDER_DUE_ACCEPTED",
        "CASE_LATE_REVIEW_ACCEPTED",
        "CASE_SUPERSEDED_REPLY",
        "CASE_EXPIRED_REJECTED",
        "CASE_BLOCKED_REPAIR",
        "CASE_GRANT_EXPIRED_BUT_CYCLE_LIVE",
        "CASE_SETTLED_NO_REMINDER",
    }
    if not required_cases.issubset(case_ids):
        fail("checkpoint case matrix drifted")
    if not any(row["reply_window_state"] == "blocked_repair" and row["response_disposition"] == "blocked_repair" for row in rows):
        fail("checkpoint case matrix must prove blocked_repair disposition")
    if not any(row["grant_posture"] == "expired_session" and row["reply_window_state"] == "open" for row in rows):
        fail("checkpoint case matrix must prove grant expiry does not redefine the live cycle")


def validate_duplicate_cases(payload: dict[str, Any]) -> None:
    if payload.get("taskId") != "seq_227":
        fail("duplicate authority casebook taskId drifted")
    if len(payload.get("authoritySeparation", [])) != 4:
        fail("duplicate authority casebook must publish four authority boundaries")
    cases = payload.get("cases", [])
    if len(cases) < 5:
        fail("duplicate authority casebook must publish at least five cases")
    dominant_authorities = {case["dominantAuthority"] for case in cases}
    if dominant_authorities != {"IdempotencyRecord", "DuplicateResolutionDecision", "DuplicateCluster"}:
        fail("duplicate authority casebook must demonstrate replay, attach, and cluster ownership")


def validate_gap_log(gap_log: dict[str, Any]) -> None:
    if gap_log.get("status") != "closed":
        fail("gap log must be closed")
    if gap_log.get("openGaps") != []:
        fail("gap log must not contain open gaps")
    gaps = gap_log.get("gaps", [])
    if len(gaps) != 8:
        fail("gap log must contain exactly the eight mandatory closures")
    for gap in gaps:
        if gap.get("status") != "closed":
            fail(f"gap {gap.get('gapId')} is not closed")


def validate_docs_and_atlas() -> None:
    require_text(
        ARCH_DOC,
        [
            "QueueRankPlan",
            "QueueRankSnapshot",
            "QueueAssignmentSuggestionSnapshot",
            "DuplicateReviewSnapshot",
            "MoreInfoReplyWindowCheckpoint",
            "u_i = 1 - exp(",
        ],
    )
    require_text(
        API_DOC,
        [
            "/v1/workspace/queues/{queueKey}/rank-snapshot",
            "/v1/workspace/queues/{queueKey}/assignment-suggestions",
            "/v1/workspace/tasks/{taskId}/duplicates",
            "/v1/workspace/tasks/{taskId}/more-info",
            "MoreInfoReplyWindowCheckpoint",
        ],
    )
    require_text(
        SECURITY_DOC,
        [
            "deny-by-default",
            "rho_crit",
            "rho_guard",
            "IdempotencyRecord",
            "DuplicateCluster",
            "MoreInfoReplyWindowCheckpoint",
            "accepted_in_window",
            "blocked_repair",
        ],
    )
    require_text(
        ATLAS,
        [
            "Queue_Fairness_Duplicate_MoreInfo_Atlas",
            "Vecells",
            "QueueOrderLadder",
            "FairnessBandMergeDiagram",
            "DuplicateAuthorityBraid",
            "MoreInfoCheckpointLadder",
            "FormulaRegistryTable",
            "ThresholdRegistryTable",
            "QueueCaseParityTable",
            "DuplicateCaseTable",
            "CheckpointCaseTable",
            "../../data/contracts/227_queue_constants_and_threshold_registry.yaml",
            "../../data/contracts/227_queue_rank_plan.schema.json",
            "../../data/contracts/227_more_info_reply_window_checkpoint.schema.json",
            "../../data/analysis/227_queue_sort_and_fairness_matrix.csv",
            "../../data/analysis/227_duplicate_authority_and_relation_cases.json",
            "../../data/analysis/227_more_info_checkpoint_and_disposition_cases.csv",
        ],
    )


def validate_script_registry() -> None:
    package = load_json(PACKAGE_JSON)
    scripts = package.get("scripts", {})
    expected = "python3 ./tools/analysis/validate_phase3_queue_more_info_contracts.py"
    if scripts.get("validate:phase3-queue-more-info-contracts") != expected:
        fail("package.json missing validate:phase3-queue-more-info-contracts")

    root_updates = read(ROOT_SCRIPT_UPDATES)
    if '"validate:phase3-queue-more-info-contracts": "python3 ./tools/analysis/validate_phase3_queue_more_info_contracts.py"' not in root_updates:
        fail("root_script_updates.py missing validate:phase3-queue-more-info-contracts")


def main() -> None:
    validate_checklist()
    queue_rank_plan = load_json(QUEUE_RANK_PLAN)
    queue_rank_snapshot = load_json(QUEUE_RANK_SNAPSHOT)
    queue_rank_entry = load_json(QUEUE_RANK_ENTRY)
    queue_assignment_suggestion = load_json(QUEUE_ASSIGNMENT_SUGGESTION)
    duplicate_review = load_json(DUPLICATE_REVIEW)
    more_info_cycle = load_json(MORE_INFO_CYCLE)
    more_info_checkpoint = load_json(MORE_INFO_CHECKPOINT)
    more_info_reminder = load_json(MORE_INFO_REMINDER)
    more_info_disposition = load_json(MORE_INFO_DISPOSITION)
    constants_registry = load_yaml_like_json(CONSTANTS_REGISTRY)
    queue_matrix = load_csv(QUEUE_MATRIX)
    checkpoint_cases = load_csv(CHECKPOINT_CASES)
    duplicate_cases = load_json(DUPLICATE_CASES)
    gap_log = load_json(GAP_LOG)

    validate_queue_rank_plan_schema(queue_rank_plan)
    validate_queue_rank_snapshot_schema(queue_rank_snapshot)
    validate_queue_rank_entry_schema(queue_rank_entry)
    validate_queue_assignment_suggestion_schema(queue_assignment_suggestion)
    validate_duplicate_review_schema(duplicate_review)
    validate_more_info_schemas(
        more_info_cycle,
        more_info_checkpoint,
        more_info_reminder,
        more_info_disposition,
    )
    validate_constants_registry(constants_registry)
    validate_queue_matrix(queue_matrix)
    validate_checkpoint_cases(checkpoint_cases)
    validate_duplicate_cases(duplicate_cases)
    validate_gap_log(gap_log)
    validate_docs_and_atlas()
    validate_script_registry()

    if not PLAYWRIGHT_SPEC.exists():
        fail(f"missing required artifact {PLAYWRIGHT_SPEC.relative_to(ROOT)}")

    print("227 phase3 queue, fairness, duplicate, and more-info contracts validated")


if __name__ == "__main__":
    main()
