#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import textwrap
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
ANALYSIS_DIR = ROOT / "data" / "analysis"
TEST_DATA_DIR = ROOT / "data" / "test"
TEST_DOCS_DIR = ROOT / "docs" / "tests"

ROUTE_INTENT_PATH = ANALYSIS_DIR / "scoped_mutation_gate_decision_table.csv"
FRESHNESS_PATH = ANALYSIS_DIR / "freshness_envelope_examples.json"
AUDIENCE_BINDINGS_PATH = ANALYSIS_DIR / "audience_surface_runtime_bindings.json"
SURFACE_VERDICTS_PATH = ANALYSIS_DIR / "surface_authority_verdicts.json"
ROUTE_RECOVERY_PATH = ANALYSIS_DIR / "route_recovery_disposition_matrix.csv"
ROUTE_FREEZE_PATH = ANALYSIS_DIR / "route_freeze_and_recovery_matrix.csv"
SELECTED_ANCHOR_PATH = ANALYSIS_DIR / "selected_anchor_policy_matrix.csv"
ROUTE_GUARD_EXAMPLES_PATH = ANALYSIS_DIR / "runtime_binding_guard_examples.json"
RETURN_CONTRACT_PATH = ANALYSIS_DIR / "return_contract_examples.json"

SUITE_DOC_PATH = TEST_DOCS_DIR / "134_route_intent_projection_freshness_scoped_mutation_suite.md"
CONTINUITY_DOC_PATH = TEST_DOCS_DIR / "134_surface_authority_and_continuity_cases.md"
LAB_PATH = TEST_DOCS_DIR / "134_continuity_gate_lab.html"

ROUTE_TUPLE_CASES_PATH = TEST_DATA_DIR / "route_intent_tuple_parity_cases.csv"
PROJECTION_CASES_PATH = TEST_DATA_DIR / "projection_freshness_cases.csv"
SCOPED_MUTATION_CASES_PATH = TEST_DATA_DIR / "scoped_mutation_gate_cases.csv"
SUITE_RESULTS_PATH = TEST_DATA_DIR / "continuity_gate_suite_results.json"


SOURCE_PRECEDENCE = [
    "prompt/134.md",
    "prompt/shared_operating_contract_126_to_135.md",
    "blueprint/phase-0-the-foundation-protocol.md#1.7A ProjectionFreshnessEnvelope",
    "blueprint/phase-0-the-foundation-protocol.md#1.17 SelectedAnchor",
    "blueprint/phase-0-the-foundation-protocol.md#1.21 RouteIntentBinding",
    "blueprint/phase-0-the-foundation-protocol.md#1.38A AudienceSurfaceRuntimeBinding",
    "blueprint/phase-0-the-foundation-protocol.md#1.39 ReleaseRecoveryDisposition",
    "blueprint/phase-0-the-foundation-protocol.md#1.41 RouteFreezeDisposition",
    "blueprint/phase-0-the-foundation-protocol.md#2.8 ScopedMutationGate",
    "blueprint/platform-frontend-blueprint.md#ProjectionFreshnessEnvelope",
    "blueprint/platform-frontend-blueprint.md#SelectedAnchorPolicy",
    "blueprint/platform-runtime-and-release-blueprint.md#AudienceSurfaceRuntimeBinding",
    "blueprint/platform-runtime-and-release-blueprint.md#ReleaseRecoveryDisposition",
    "blueprint/phase-1-the-red-flag-gate.md#RouteIntentBinding",
    "blueprint/forensic-audit-findings.md#Finding 91",
    "blueprint/forensic-audit-findings.md#Finding 92",
    "blueprint/forensic-audit-findings.md#Finding 95",
    "blueprint/forensic-audit-findings.md#Finding 118",
    "blueprint/forensic-audit-findings.md#Finding 119",
    "blueprint/forensic-audit-findings.md#Finding 120",
    "data/analysis/scoped_mutation_gate_decision_table.csv",
    "data/analysis/freshness_envelope_examples.json",
    "data/analysis/audience_surface_runtime_bindings.json",
    "data/analysis/route_recovery_disposition_matrix.csv",
    "data/analysis/route_freeze_and_recovery_matrix.csv",
    "data/analysis/selected_anchor_policy_matrix.csv",
    "data/analysis/runtime_binding_guard_examples.json",
]

REQUIRED_CASE_FAMILIES = [
    "stale_governing_object_version",
    "stale_identity_binding_or_subject_version",
    "stale_release_publication_runtime_binding",
    "channel_or_embedded_capability_drift",
    "transport_live_but_freshness_not_authoritative",
    "reachability_or_contact_repair_suppresses_mutation",
    "acting_scope_or_break_glass_drift",
    "same_shell_recovery_preserves_selected_anchor",
]

BROWSER_SPECIMEN_ROUTE_FAMILIES = {
    "rf_patient_home",
    "rf_patient_requests",
    "rf_patient_appointments",
    "rf_patient_health_record",
    "rf_patient_messages",
    "rf_patient_secure_link_recovery",
    "rf_patient_embedded_channel",
    "rf_staff_workspace",
    "rf_staff_workspace_child",
    "rf_operations_board",
    "rf_operations_drilldown",
    "rf_hub_queue",
    "rf_hub_case_management",
    "rf_governance_shell",
    "rf_pharmacy_console",
}


CASE_SPECS = [
    {
        "caseId": "CG_134_PATIENT_MESSAGE_CURRENT",
        "title": "Current patient message tuple stays visible while publication truth remains read-only",
        "caseFamily": "baseline_current_tuple_under_partial_surface_truth",
        "routeFamilyRef": "rf_patient_messages",
        "actionScope": "reply_message",
        "routeIntentId": "RIB_056_PATIENT_MESSAGE_REPLY_V1",
        "freshnessExampleId": "patient_pending_confirmation",
        "surfaceAuthorityVerdictId": "ASV_130_SURF_PATIENT_MESSAGES_V1",
        "guardScenarioId": "SCN_DIAGNOSTIC_READ_ONLY_PATIENT_REQUESTS",
        "selectedAnchorKey": "messages-thread",
        "expectedRouteDecision": "allow",
        "expectedMutationDecision": "blocked",
        "expectedShellPosture": "read_only",
        "expectedSameShellDisposition": "downgrade_read_only",
        "expectedSelectedAnchorDisposition": "preserve",
        "browserSpecimenState": "available",
        "nextSafeActionLabel": "Review the current thread summary before issuing a fresh reply tuple.",
        "statusSummary": "The current message thread remains visible, but writable reply posture stays suppressed until runtime and release truth are exact.",
        "notes": "A current route-intent tuple alone is insufficient to reopen writable posture while the current surface authority row remains partial and read-only.",
    },
    {
        "caseId": "CG_134_PATIENT_MESSAGE_SUPERSEDED",
        "title": "Superseded patient message tuple falls back to same-shell thread recovery",
        "caseFamily": "stale_governing_object_version",
        "routeFamilyRef": "rf_patient_messages",
        "actionScope": "reply_message",
        "routeIntentId": "RIB_056_PATIENT_MESSAGE_REPLY_SUPERSEDED_V1",
        "freshnessOverride": {
            "projectionFreshnessState": "stale_review",
            "transportState": "live",
            "actionabilityState": "frozen",
            "scope": "shell",
            "expectedSummary": "The visible thread is stale and must rebind before any reply can remain safe.",
            "expectedFreshnessLabel": "Stale review",
            "expectedActionabilityLabel": "Frozen",
            "expectedRenderMode": "integrated_status_strip",
            "sourceRefs": [
                "blueprint/platform-frontend-blueprint.md#1.7A ProjectionFreshnessEnvelope",
                "blueprint/forensic-audit-findings.md#Finding 95",
            ],
        },
        "surfaceAuthorityVerdictId": "ASV_130_SURF_PATIENT_MESSAGES_V1",
        "selectedAnchorKey": "messages-thread",
        "expectedRouteDecision": "reissue-required",
        "expectedMutationDecision": "blocked",
        "expectedShellPosture": "recovery_only",
        "expectedSameShellDisposition": "downgrade_recovery_only",
        "expectedSelectedAnchorDisposition": "freeze",
        "browserSpecimenState": "available",
        "nextSafeActionLabel": "Resume on the latest thread inside the same shell before replying.",
        "statusSummary": "The thread tuple is superseded, so the shell preserves orientation and points back to the latest safe conversation target.",
        "notes": "Stale thread tuples must not silently send on a superseded governing object even when transport is live.",
    },
    {
        "caseId": "CG_134_PATIENT_CLAIM_PARTIAL_IDENTITY",
        "title": "Legacy claim binding requires claim reissue before writable posture can resume",
        "caseFamily": "stale_identity_binding_or_subject_version",
        "routeFamilyRef": "rf_patient_secure_link_recovery",
        "actionScope": "claim",
        "routeIntentId": "RIB_056_PATIENT_CLAIM_LEGACY_PARTIAL_V1",
        "freshnessOverride": {
            "projectionFreshnessState": "blocked_recovery",
            "transportState": "paused",
            "actionabilityState": "recovery_only",
            "scope": "shell",
            "expectedSummary": "The claim shell must reissue its subject-bound tuple before a writable recovery action can continue.",
            "expectedFreshnessLabel": "Recovery only",
            "expectedActionabilityLabel": "Recovery only",
            "expectedRenderMode": "promoted_banner",
            "sourceRefs": [
                "blueprint/phase-2-identity-and-echoes.md#Continuation authority and claim law",
                "blueprint/platform-frontend-blueprint.md#1.7A ProjectionFreshnessEnvelope",
            ],
        },
        "surfaceAuthorityVerdictId": "ASV_130_SURF_PATIENT_SECURE_LINK_RECOVERY_V1",
        "selectedAnchorKey": "messages-return",
        "expectedRouteDecision": "reissue-required",
        "expectedMutationDecision": "blocked",
        "expectedShellPosture": "blocked",
        "expectedSameShellDisposition": "downgrade_blocked",
        "expectedSelectedAnchorDisposition": "freeze",
        "browserSpecimenState": "available",
        "nextSafeActionLabel": "Reissue the claim tuple in place and keep the last safe request summary visible.",
        "statusSummary": "Identity-bound recovery stays same-shell, but no claim completion can remain writable on a partial subject binding.",
        "notes": "Identity or subject-binding drift must not be masked by cached recovery UI or copied link state.",
    },
    {
        "caseId": "CG_134_PATIENT_REQUESTS_PENDING_BINDING",
        "title": "Live transport without a hydrated runtime binding keeps requests in recovery-only posture",
        "caseFamily": "stale_release_publication_runtime_binding",
        "routeFamilyRef": "rf_patient_requests",
        "actionScope": "pharmacy_choice",
        "routeIntentId": "RIB_056_PATIENT_PHARMACY_CHOICE_V1",
        "freshnessOverride": {
            "projectionFreshnessState": "updating",
            "transportState": "live",
            "actionabilityState": "guarded",
            "scope": "shell",
            "expectedSummary": "Transport is live, but the current runtime tuple is still settling and ordinary mutation remains guarded.",
            "expectedFreshnessLabel": "Guarded update",
            "expectedActionabilityLabel": "Guarded",
            "expectedRenderMode": "integrated_status_strip",
            "sourceRefs": [
                "blueprint/platform-frontend-blueprint.md#1.7A ProjectionFreshnessEnvelope",
                "blueprint/forensic-audit-findings.md#Finding 92",
            ],
        },
        "surfaceAuthorityVerdictId": "ASV_130_SURF_PATIENT_REQUESTS_V1",
        "guardScenarioId": "SCN_PENDING_BINDING_PATIENT_REQUESTS",
        "selectedAnchorKey": "request-lineage",
        "expectedRouteDecision": "allow",
        "expectedMutationDecision": "recovery-only",
        "expectedShellPosture": "recovery_only",
        "expectedSameShellDisposition": "downgrade_recovery_only",
        "expectedSelectedAnchorDisposition": "freeze",
        "browserSpecimenState": "available",
        "nextSafeActionLabel": "Refresh the runtime binding and preserve the current request anchor.",
        "statusSummary": "Fresh transport is not fresh truth; requests stay guarded until the runtime tuple becomes authoritative again.",
        "notes": "Runtime, publication, or release drift must fail closed into same-shell recovery instead of silently reopening ordinary reply or pharmacy actions.",
    },
    {
        "caseId": "CG_134_EMBEDDED_CAPABILITY_DRIFT",
        "title": "Embedded capability drift keeps the route bounded to a governed handoff",
        "caseFamily": "channel_or_embedded_capability_drift",
        "routeFamilyRef": "rf_patient_embedded_channel",
        "actionScope": "route_entry",
        "routeIntentId": None,
        "freshnessOverride": {
            "projectionFreshnessState": "blocked_recovery",
            "transportState": "live",
            "actionabilityState": "recovery_only",
            "scope": "shell",
            "expectedSummary": "Embedded delivery may continue only through the governed handoff path because the host capability floor is incomplete.",
            "expectedFreshnessLabel": "Recovery only",
            "expectedActionabilityLabel": "Recovery only",
            "expectedRenderMode": "promoted_banner",
            "sourceRefs": [
                "blueprint/platform-frontend-blueprint.md#Browser boundary recovery law",
                "blueprint/forensic-audit-findings.md#Finding 118",
            ],
        },
        "surfaceAuthorityVerdictId": "ASV_130_SURF_PATIENT_EMBEDDED_SHELL_V1",
        "guardScenarioId": "SCN_EMBEDDED_CAPABILITY_RECOVERY",
        "selectedAnchorKey": "embedded-capabilities",
        "expectedRouteDecision": "recovery-only",
        "expectedMutationDecision": "blocked",
        "expectedShellPosture": "recovery_only",
        "expectedSameShellDisposition": "downgrade_recovery_only",
        "expectedSelectedAnchorDisposition": "freeze",
        "browserSpecimenState": "available",
        "nextSafeActionLabel": "Open the governed handoff and preserve the embedded return anchor.",
        "statusSummary": "Channel capability drift is recoverable, but never through a silent local enablement or shell replacement.",
        "notes": "Embedded or constrained routes must prove the required capability floor before any live action posture remains legal.",
    },
    {
        "caseId": "CG_134_STAFF_LIVE_TRANSPORT_STALE_TRUTH",
        "title": "Workspace transport may be live while stale projection truth keeps actionability frozen",
        "caseFamily": "transport_live_but_freshness_not_authoritative",
        "routeFamilyRef": "rf_staff_workspace_child",
        "actionScope": "staff_claim_task",
        "routeIntentId": "RIB_056_STAFF_CLAIM_TASK_V1",
        "freshnessExampleId": "workspace_stale_review",
        "surfaceAuthorityVerdictId": "ASV_130_SURF_CLINICIAN_WORKSPACE_CHILD_V1",
        "selectedAnchorKey": "queue-evidence",
        "expectedRouteDecision": "allow",
        "expectedMutationDecision": "blocked",
        "expectedShellPosture": "recovery_only",
        "expectedSameShellDisposition": "downgrade_recovery_only",
        "expectedSelectedAnchorDisposition": "freeze",
        "browserSpecimenState": "available",
        "nextSafeActionLabel": "Restore the current queue evidence row before issuing a new claim or decision.",
        "statusSummary": "Transport health alone cannot reopen a workspace action when authoritative projection truth is still stale.",
        "notes": "Command-following freshness must remain visibly provisional until the queue row, task detail, and route tuple converge again.",
    },
    {
        "caseId": "CG_134_SUPPORT_CONTACT_REPAIR",
        "title": "Support mutation remains fenced until contact-route repair clears",
        "caseFamily": "reachability_or_contact_repair_suppresses_mutation",
        "routeFamilyRef": "rf_support_ticket_workspace",
        "actionScope": "support_repair_action",
        "routeIntentId": "RIB_056_SUPPORT_REPAIR_ACTION_V1",
        "freshnessOverride": {
            "projectionFreshnessState": "blocked_recovery",
            "transportState": "live",
            "actionabilityState": "recovery_only",
            "scope": "shell",
            "expectedSummary": "Contact-route repair is now the dominant truth; ordinary support mutation remains fenced in place.",
            "expectedFreshnessLabel": "Recovery only",
            "expectedActionabilityLabel": "Recovery only",
            "expectedRenderMode": "promoted_banner",
            "sourceRefs": [
                "blueprint/staff-operations-and-support-blueprint.md#Support mutation contract",
                "blueprint/forensic-audit-findings.md#Finding 119",
            ],
        },
        "surfaceAuthorityVerdictId": "ASV_130_SURF_SUPPORT_TICKET_WORKSPACE_V1",
        "selectedAnchorKey": "ticket-timeline",
        "expectedRouteDecision": "recovery-only",
        "expectedMutationDecision": "recovery-only",
        "expectedShellPosture": "recovery_only",
        "expectedSameShellDisposition": "downgrade_recovery_only",
        "expectedSelectedAnchorDisposition": "freeze",
        "browserSpecimenState": "gap",
        "gapRef": "GAP_BROWSER_SPECIMEN_RF_SUPPORT_TICKET_WORKSPACE",
        "nextSafeActionLabel": "Repair the contact route and then resume from the preserved ticket timeline.",
        "statusSummary": "The support repair path stays machine-readable even though a dedicated browser specimen is still missing.",
        "notes": "Support route law exists, so the suite keeps the case in the machine-readable matrix and flags the missing browser specimen explicitly.",
    },
    {
        "caseId": "CG_134_HUB_SCOPE_DRIFT",
        "title": "Cross-organisation acting-scope drift freezes hub booking posture in place",
        "caseFamily": "acting_scope_or_break_glass_drift",
        "routeFamilyRef": "rf_hub_case_management",
        "actionScope": "hub_manage_booking",
        "routeIntentId": "RIB_056_HUB_MANAGE_BOOKING_V1",
        "freshnessExampleId": "hub_guarded_pending",
        "surfaceAuthorityVerdictId": "ASV_130_SURF_HUB_CASE_MANAGEMENT_V1",
        "selectedAnchorKey": "hub-settlement",
        "expectedRouteDecision": "recovery-only",
        "expectedMutationDecision": "blocked",
        "expectedShellPosture": "recovery_only",
        "expectedSameShellDisposition": "downgrade_recovery_only",
        "expectedSelectedAnchorDisposition": "freeze",
        "browserSpecimenState": "available",
        "nextSafeActionLabel": "Re-issue the hub scope tuple before managing booking or alternatives.",
        "statusSummary": "Scope drift never resolves through a hidden disable or redirect; the shell must remain oriented and explicitly guarded.",
        "notes": "Acting-scope or break-glass drift freezes writable hub posture in place and requires a new governed scope tuple.",
    },
    {
        "caseId": "CG_134_STAFF_SELECTED_ANCHOR_RECOVERY",
        "title": "Workspace child recovery preserves the selected anchor and next safe action",
        "caseFamily": "same_shell_recovery_preserves_selected_anchor",
        "routeFamilyRef": "rf_staff_workspace_child",
        "actionScope": "staff_claim_task",
        "routeIntentId": "RIB_056_STAFF_CLAIM_TASK_V1",
        "freshnessOverride": {
            "projectionFreshnessState": "updating",
            "transportState": "live",
            "actionabilityState": "recovery_only",
            "scope": "shell",
            "expectedSummary": "The child route stays in the same shell, preserves the queue anchor, and arms the next safe recovery action.",
            "expectedFreshnessLabel": "Guarded update",
            "expectedActionabilityLabel": "Recovery only",
            "expectedRenderMode": "integrated_status_strip",
            "sourceRefs": [
                "blueprint/platform-frontend-blueprint.md#SelectedAnchorPolicy",
                "blueprint/staff-workspace-interface-architecture.md#Active task shell",
            ],
        },
        "surfaceAuthorityVerdictId": "ASV_130_SURF_CLINICIAN_WORKSPACE_CHILD_V1",
        "selectedAnchorKey": "queue-evidence",
        "expectedRouteDecision": "recovery-only",
        "expectedMutationDecision": "recovery-only",
        "expectedShellPosture": "recovery_only",
        "expectedSameShellDisposition": "downgrade_recovery_only",
        "expectedSelectedAnchorDisposition": "freeze",
        "browserSpecimenState": "available",
        "nextSafeActionLabel": "Restore the draft and review the queue evidence row before continuing.",
        "statusSummary": "Same-shell recovery must preserve orientation and the nearest safe queue anchor instead of collapsing to a generic workspace redirect.",
        "notes": "Selected-anchor preservation is a proof obligation, not a best-effort convenience.",
    },
    {
        "caseId": "CG_134_PUBLIC_ENTRY_TELEPHONY_GAP",
        "title": "Telephony intake authority remains matrix-visible while the browser specimen is still missing",
        "caseFamily": "browser_specimen_gap_public_entry",
        "routeFamilyRef": "rf_intake_telephony_capture",
        "actionScope": "route_entry",
        "routeIntentId": None,
        "freshnessOverride": {
            "projectionFreshnessState": "blocked_recovery",
            "transportState": "paused",
            "actionabilityState": "recovery_only",
            "scope": "shell",
            "expectedSummary": "Telephony intake remains recovery-only until the current constrained-browser tuple is republished.",
            "expectedFreshnessLabel": "Recovery only",
            "expectedActionabilityLabel": "Recovery only",
            "expectedRenderMode": "promoted_banner",
            "sourceRefs": [
                "blueprint/platform-runtime-and-release-blueprint.md#AudienceSurfaceRuntimeBinding",
                "blueprint/forensic-audit-findings.md#Finding 120",
            ],
        },
        "surfaceAuthorityVerdictId": "ASV_130_SURF_PATIENT_INTAKE_PHONE_V1",
        "selectedAnchorKey": "request-proof",
        "expectedRouteDecision": "recovery-only",
        "expectedMutationDecision": "blocked",
        "expectedShellPosture": "recovery_only",
        "expectedSameShellDisposition": "downgrade_recovery_only",
        "expectedSelectedAnchorDisposition": "freeze",
        "browserSpecimenState": "gap",
        "gapRef": "GAP_BROWSER_SPECIMEN_RF_INTAKE_TELEPHONY_CAPTURE",
        "nextSafeActionLabel": "Resume the governed capture route instead of inferring live authority from transport health.",
        "statusSummary": "The public-entry route remains in the parity matrix, but current browser proof is still a bounded gap rather than a silent omission.",
        "notes": "Routes with published authority law but no specimen must remain explicit in the suite.",
    },
]


ROUTE_TUPLE_FIELDS = [
    "case_id",
    "title",
    "case_family",
    "route_family",
    "action_scope",
    "governing_object_ref",
    "governing_object_version_ref",
    "required_identity_tuple_members",
    "required_session_tuple_members",
    "required_release_tuple_members",
    "required_channel_tuple_members",
    "required_runtime_tuple_members",
    "audience_surface_runtime_binding_ref",
    "expected_decision",
    "same_shell_recovery_required",
    "selected_anchor_policy_ref",
    "browser_specimen_state",
    "gap_ref",
    "source_refs",
    "rationale",
]

PROJECTION_FIELDS = [
    "case_id",
    "title",
    "case_family",
    "route_family",
    "transport_state",
    "projection_freshness_state",
    "actionability_state",
    "scope",
    "status_summary",
    "expected_freshness_label",
    "expected_actionability_label",
    "expected_render_mode",
    "expected_shell_posture",
    "expected_mutation_decision",
    "transport_live_insufficient",
    "selected_anchor_disposition",
    "next_safe_action_label",
    "browser_specimen_state",
    "gap_ref",
    "source_refs",
    "rationale",
]

SCOPED_MUTATION_FIELDS = [
    "case_id",
    "title",
    "case_family",
    "route_family",
    "action_scope",
    "drift_dimension",
    "acting_scope_tuple_requirement_ref",
    "governing_object_ref",
    "governing_object_version_ref",
    "subject_binding_version_ref",
    "lineage_fence_epoch_requirement",
    "release_binding_ref",
    "runtime_binding_ref",
    "ordinary_mutation_state",
    "expected_route_decision",
    "allowed_command_settlement_results",
    "same_shell_recovery_envelope_ref",
    "selected_anchor_disposition",
    "browser_specimen_state",
    "gap_ref",
    "source_refs",
    "rationale",
]


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def split_refs(value: Any) -> list[str]:
    if value is None:
        return []
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    text = str(value).strip()
    if not text:
        return []
    normalized = text.replace("|", ";")
    return [chunk.strip() for chunk in normalized.split(";") if chunk.strip()]


def uniq(items: list[str]) -> list[str]:
    seen: set[str] = set()
    ordered: list[str] = []
    for item in items:
        if item not in seen:
            ordered.append(item)
            seen.add(item)
    return ordered


def slug(value: str) -> str:
    return value.lower().replace("_", "-")


def csv_join(items: list[str]) -> str:
    return "; ".join(items)


def markdown_table(headers: list[str], rows: list[list[str]]) -> str:
    lines = [
        "| " + " | ".join(headers) + " |",
        "| " + " | ".join("---" for _ in headers) + " |",
    ]
    for row in rows:
        escaped = [cell.replace("|", "\\|") for cell in row]
        lines.append("| " + " | ".join(escaped) + " |")
    return "\n".join(lines)


def ensure_dirs() -> None:
    TEST_DATA_DIR.mkdir(parents=True, exist_ok=True)
    TEST_DOCS_DIR.mkdir(parents=True, exist_ok=True)


def write_csv(path: Path, fieldnames: list[str], rows: list[dict[str, str]]) -> None:
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


def build_runtime_sources() -> tuple[
    dict[str, dict[str, str]],
    dict[str, dict[str, Any]],
    dict[str, dict[str, Any]],
    dict[str, dict[str, str]],
    dict[tuple[str, str], dict[str, str]],
    dict[str, dict[str, Any]],
]:
    route_intent_rows = {
        row["routeIntentId"]: row for row in read_csv(ROUTE_INTENT_PATH)
    }
    freshness_payload = read_json(FRESHNESS_PATH)
    freshness_examples = {
        row["example_id"]: row for row in freshness_payload["examples"]
    }
    audience_payload = read_json(AUDIENCE_BINDINGS_PATH)
    surface_rows = {
        row["surfaceAuthorityVerdictId"]: row
        for row in audience_payload["surfaceAuthorityRows"]
    }
    selected_anchor_rows = {
        row["route_family_ref"]: row for row in read_csv(SELECTED_ANCHOR_PATH)
    }
    route_freeze_rows = {
        (row["route_family_ref"], row["scenario_label"]): row
        for row in read_csv(ROUTE_FREEZE_PATH)
    }
    guard_payload = read_json(ROUTE_GUARD_EXAMPLES_PATH)
    guard_examples = {
        row["scenarioId"]: row for row in guard_payload["scenarios"]
    }
    return (
        route_intent_rows,
        freshness_examples,
        surface_rows,
        selected_anchor_rows,
        route_freeze_rows,
        guard_examples,
    )


def infer_drift_dimension(case_family: str) -> str:
    mapping = {
        "baseline_current_tuple_under_partial_surface_truth": "none_current_tuple",
        "stale_governing_object_version": "governing_object_version",
        "stale_identity_binding_or_subject_version": "subject_binding_version",
        "stale_release_publication_runtime_binding": "runtime_binding",
        "channel_or_embedded_capability_drift": "channel_capability",
        "transport_live_but_freshness_not_authoritative": "projection_freshness",
        "reachability_or_contact_repair_suppresses_mutation": "reachability_contact_route",
        "acting_scope_or_break_glass_drift": "acting_scope_tuple",
        "same_shell_recovery_preserves_selected_anchor": "selected_anchor_recovery",
        "browser_specimen_gap_public_entry": "browser_specimen_gap",
    }
    return mapping[case_family]


def build_case_rows() -> dict[str, Any]:
    (
        route_intent_rows,
        freshness_examples,
        surface_rows,
        selected_anchor_rows,
        route_freeze_rows,
        guard_examples,
    ) = build_runtime_sources()

    route_tuple_rows: list[dict[str, str]] = []
    projection_rows: list[dict[str, str]] = []
    mutation_rows: list[dict[str, str]] = []
    continuity_scenarios: list[dict[str, Any]] = []

    for spec in CASE_SPECS:
        route_family_ref = spec["routeFamilyRef"]
        route_row = route_intent_rows.get(spec["routeIntentId"]) if spec["routeIntentId"] else None
        surface_row = surface_rows[spec["surfaceAuthorityVerdictId"]]
        selected_anchor_row = selected_anchor_rows[route_family_ref]
        guard_row = guard_examples.get(spec.get("guardScenarioId"))
        freshness_row = (
            freshness_examples[spec["freshnessExampleId"]]
            if spec.get("freshnessExampleId")
            else None
        )
        freshness_payload = freshness_row or spec["freshnessOverride"]

        identity_members = []
        session_members = []
        release_members = []
        channel_members = []
        runtime_members = []
        source_refs = []

        if route_row:
            identity_members.extend(
                [
                    route_row["subjectRef"],
                    route_row["subjectBindingVersionRef"],
                    route_row["grantFamily"],
                    route_row["requiredGrantFamily"],
                ]
            )
            session_members.extend(
                [
                    route_row["sessionEpochRef"],
                    route_row["requiredActingContext"],
                    route_row["requiredActingScopeTuple"],
                ]
            )
            release_members.extend(
                [
                    route_row["releaseApprovalFreezeRef"],
                    route_row["requiredReleaseFreezeValidation"],
                    route_row["requiredParityValidation"],
                    route_row["routeContractDigestRef"],
                ]
            )
            channel_members.extend(
                [
                    route_row["audienceSurface"],
                    route_row["shellType"],
                    route_row["channelReleaseFreezeState"],
                    route_row["requiredChannelFreezeValidation"],
                ]
            )
            runtime_members.extend(
                [
                    route_row["audienceSurfaceRuntimeBindingRef"],
                    route_row["requiredRuntimePublicationBinding"],
                    route_row["publishedRuntimeBindingState"],
                ]
            )
            source_refs.extend(split_refs(route_row["source_refs"]))
        else:
            identity_members.extend(
                [
                    surface_row["audienceSurface"],
                    "route_entry_subject_validation",
                ]
            )
            session_members.extend(
                [
                    "route_entry_session_tuple",
                    "route_entry_scope_validation",
                ]
            )
            release_members.extend(
                [
                    surface_row["releaseRef"],
                    surface_row["releasePublicationParityRef"],
                    "current_release_parity_row",
                ]
            )
            channel_members.extend(
                [
                    surface_row["shellType"],
                    surface_row["browserPostureState"],
                    surface_row["routeExposureState"],
                ]
            )
            runtime_members.extend(
                [
                    surface_row["audienceSurfaceRuntimeBindingId"],
                    surface_row["runtimePublicationBundleRef"],
                    surface_row["bindingState"],
                ]
            )
            source_refs.extend(surface_row["sourceRefs"])

        source_refs.extend(freshness_payload["sourceRefs"] if "sourceRefs" in freshness_payload else freshness_payload["source_refs"])
        source_refs.extend(split_refs(selected_anchor_row["source_refs"]))
        if guard_row:
            source_refs.extend(
                guard_row.get("reasonRefs", []) + guard_row.get("sourceRefs", [])
            )

        browser_specimen_state = spec["browserSpecimenState"]
        gap_ref = spec.get("gapRef", "")
        selected_anchor_policy_ref = (
            f"SAP_108_{route_family_ref.upper()}_V1"
        )
        same_shell_disposition = (
            guard_row["sameShellDisposition"]
            if guard_row
            else spec["expectedSameShellDisposition"]
        )
        selected_anchor_disposition = (
            guard_row["selectedAnchorDisposition"]
            if guard_row
            else spec["expectedSelectedAnchorDisposition"]
        )
        recovery_action_label = (
            guard_row["recoveryAction"]["label"]
            if guard_row and guard_row.get("recoveryAction")
            else spec["nextSafeActionLabel"]
        )
        governing_object_ref = (
            route_row["governingObjectRef"] if route_row else f"routeEntry://{route_family_ref}"
        )
        governing_object_version_ref = (
            route_row["governingObjectVersionRef"]
            if route_row
            else f"{route_family_ref}.routeEntryVersion.current"
        )

        route_tuple_rows.append(
            {
                "case_id": spec["caseId"],
                "title": spec["title"],
                "case_family": spec["caseFamily"],
                "route_family": route_family_ref,
                "action_scope": spec["actionScope"],
                "governing_object_ref": governing_object_ref,
                "governing_object_version_ref": governing_object_version_ref,
                "required_identity_tuple_members": csv_join(uniq(identity_members)),
                "required_session_tuple_members": csv_join(uniq(session_members)),
                "required_release_tuple_members": csv_join(uniq(release_members)),
                "required_channel_tuple_members": csv_join(uniq(channel_members)),
                "required_runtime_tuple_members": csv_join(uniq(runtime_members)),
                "audience_surface_runtime_binding_ref": surface_row["audienceSurfaceRuntimeBindingId"],
                "expected_decision": spec["expectedRouteDecision"],
                "same_shell_recovery_required": "yes"
                if spec["expectedShellPosture"] in {"read_only", "recovery_only", "blocked"}
                else "no",
                "selected_anchor_policy_ref": selected_anchor_policy_ref,
                "browser_specimen_state": browser_specimen_state,
                "gap_ref": gap_ref,
                "source_refs": csv_join(uniq(source_refs)),
                "rationale": spec["notes"],
            }
        )

        projection_rows.append(
            {
                "case_id": spec["caseId"],
                "title": spec["title"],
                "case_family": spec["caseFamily"],
                "route_family": route_family_ref,
                "transport_state": freshness_payload["transportState"]
                if "transportState" in freshness_payload
                else freshness_payload["projectionFreshnessEnvelope"]["transportState"],
                "projection_freshness_state": freshness_payload["projectionFreshnessState"]
                if "projectionFreshnessState" in freshness_payload
                else freshness_payload["projectionFreshnessEnvelope"]["projectionFreshnessState"],
                "actionability_state": freshness_payload["actionabilityState"]
                if "actionabilityState" in freshness_payload
                else freshness_payload["projectionFreshnessEnvelope"]["actionabilityState"],
                "scope": freshness_payload["scope"]
                if "scope" in freshness_payload
                else freshness_payload["projectionFreshnessEnvelope"]["scope"],
                "status_summary": freshness_payload["expectedSummary"]
                if "expectedSummary" in freshness_payload
                else freshness_payload["expected_summary"],
                "expected_freshness_label": freshness_payload["expectedFreshnessLabel"]
                if "expectedFreshnessLabel" in freshness_payload
                else freshness_payload["expected_freshness_label"],
                "expected_actionability_label": freshness_payload["expectedActionabilityLabel"]
                if "expectedActionabilityLabel" in freshness_payload
                else freshness_payload["expected_actionability_label"],
                "expected_render_mode": freshness_payload["expectedRenderMode"]
                if "expectedRenderMode" in freshness_payload
                else freshness_payload["expected_render_mode"],
                "expected_shell_posture": spec["expectedShellPosture"],
                "expected_mutation_decision": spec["expectedMutationDecision"],
                "transport_live_insufficient": "yes"
                if (
                    (
                        freshness_payload["transportState"]
                        if "transportState" in freshness_payload
                        else freshness_payload["projectionFreshnessEnvelope"]["transportState"]
                    )
                    == "live"
                    and spec["expectedShellPosture"] != "live"
                )
                else "no",
                "selected_anchor_disposition": selected_anchor_disposition,
                "next_safe_action_label": spec["nextSafeActionLabel"],
                "browser_specimen_state": browser_specimen_state,
                "gap_ref": gap_ref,
                "source_refs": csv_join(uniq(source_refs)),
                "rationale": spec["notes"],
            }
        )

        mutation_rows.append(
            {
                "case_id": spec["caseId"],
                "title": spec["title"],
                "case_family": spec["caseFamily"],
                "route_family": route_family_ref,
                "action_scope": spec["actionScope"],
                "drift_dimension": infer_drift_dimension(spec["caseFamily"]),
                "acting_scope_tuple_requirement_ref": route_row["actingScopeTupleRequirementRef"]
                if route_row
                else "route_entry_scope_validation",
                "governing_object_ref": governing_object_ref,
                "governing_object_version_ref": governing_object_version_ref,
                "subject_binding_version_ref": route_row["subjectBindingVersionRef"]
                if route_row
                else "route_entry_subject_validation",
                "lineage_fence_epoch_requirement": route_row["requiredLineageFenceEpoch"]
                if route_row
                else "not_applicable_route_entry",
                "release_binding_ref": surface_row["releasePublicationParityRef"],
                "runtime_binding_ref": surface_row["audienceSurfaceRuntimeBindingId"],
                "ordinary_mutation_state": spec["expectedMutationDecision"],
                "expected_route_decision": spec["expectedRouteDecision"],
                "allowed_command_settlement_results": route_row["allowedCommandSettlementResults"]
                if route_row
                else "not_applicable_route_entry",
                "same_shell_recovery_envelope_ref": route_row["sameShellRecoveryEnvelopeRef"]
                if route_row
                else "same_shell_route_entry_recovery",
                "selected_anchor_disposition": selected_anchor_disposition,
                "browser_specimen_state": browser_specimen_state,
                "gap_ref": gap_ref,
                "source_refs": csv_join(uniq(source_refs)),
                "rationale": spec["notes"],
            }
        )

        continuity_scenarios.append(
            {
                "caseId": spec["caseId"],
                "caseSlug": slug(spec["caseId"]),
                "title": spec["title"],
                "caseFamily": spec["caseFamily"],
                "routeFamilyRef": route_family_ref,
                "audienceSurface": surface_row["audienceSurface"],
                "audienceSurfaceLabel": surface_row["audienceSurfaceLabel"],
                "shellSlug": selected_anchor_row["shell_slug"],
                "actionScope": spec["actionScope"],
                "routeIntentCaseRef": spec["caseId"],
                "projectionFreshnessCaseRef": spec["caseId"],
                "scopedMutationCaseRef": spec["caseId"],
                "surfaceAuthorityVerdictId": surface_row["surfaceAuthorityVerdictId"],
                "routeTupleDecision": spec["expectedRouteDecision"],
                "mutationDecision": spec["expectedMutationDecision"],
                "effectiveShellPosture": spec["expectedShellPosture"],
                "sameShellDisposition": same_shell_disposition,
                "selectedAnchorDisposition": selected_anchor_disposition,
                "browserSpecimenState": browser_specimen_state,
                "gapRef": gap_ref,
                "selectedAnchorKey": spec["selectedAnchorKey"],
                "selectedAnchorPolicyRef": selected_anchor_policy_ref,
                "selectedAnchorPolicyLabel": selected_anchor_row["invalidation_presentation_ref"],
                "nextSafeActionLabel": spec["nextSafeActionLabel"],
                "routeFreezeDispositionRefs": surface_row["routeFreezeDispositionRefs"],
                "recoveryDispositionRefs": surface_row["recoveryDispositionRefs"],
                "freshnessEnvelope": {
                    "projectionFreshnessState": projection_rows[-1]["projection_freshness_state"],
                    "transportState": projection_rows[-1]["transport_state"],
                    "actionabilityState": projection_rows[-1]["actionability_state"],
                    "scope": projection_rows[-1]["scope"],
                },
                "shellSnapshot": {
                    "header": spec["title"],
                    "summary": spec["statusSummary"],
                    "selectedAnchorLabel": spec["selectedAnchorKey"],
                    "nextSafeActionLabel": spec["nextSafeActionLabel"],
                    "recoveryActionLabel": recovery_action_label,
                    "browserSpecimenState": browser_specimen_state,
                    "sameShellMessage": (
                        "Same-shell recovery keeps the active header, selected anchor, and next safe action in place."
                        if browser_specimen_state == "available"
                        else "This route family remains in the suite as matrix-visible authority while browser specimen proof is still pending."
                    ),
                },
                "reasonRefs": uniq(
                    (guard_row.get("reasonRefs", []) if guard_row else [])
                    + surface_row["reasonRefs"]
                ),
                "sourceRefs": uniq(source_refs),
                "notes": spec["notes"],
            }
        )

    results_payload = {
        "task_id": "seq_134",
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "captured_on": "2026-04-14",
        "visual_mode": "Continuity_Gate_Lab",
        "mission": "Prove that stale route intent, stale projection truth, or widened mutation scope cannot silently remain writable or quiet.",
        "source_precedence": SOURCE_PRECEDENCE,
        "required_case_families": REQUIRED_CASE_FAMILIES,
        "summary": {
            "route_intent_case_count": len(route_tuple_rows),
            "projection_freshness_case_count": len(projection_rows),
            "scoped_mutation_case_count": len(mutation_rows),
            "continuity_scenario_count": len(continuity_scenarios),
            "browser_available_count": sum(
                1 for row in continuity_scenarios if row["browserSpecimenState"] == "available"
            ),
            "browser_gap_count": sum(
                1 for row in continuity_scenarios if row["browserSpecimenState"] == "gap"
            ),
            "transport_live_but_non_live_actionability_count": sum(
                1
                for row in projection_rows
                if row["transport_state"] == "live" and row["expected_shell_posture"] != "live"
            ),
            "required_family_coverage_count": len(
                {
                    row["caseFamily"]
                    for row in continuity_scenarios
                    if row["caseFamily"] in REQUIRED_CASE_FAMILIES
                }
            ),
        },
        "gap_resolutions": [
            {
                "gapId": "GAP_RESOLUTION_134_ROUTE_INTENT_ENFORCED_END_TO_END_V1",
                "statement": "Route-intent law now has one integrated suite that binds route tuples to runtime surface truth and same-shell recovery behavior.",
            },
            {
                "gapId": "GAP_RESOLUTION_134_FRESH_TRANSPORT_NOT_FRESH_TRUTH_V1",
                "statement": "Transport health and authoritative projection freshness are tested as separate dimensions so live transport cannot silently reopen writable posture.",
            },
            {
                "gapId": "GAP_RESOLUTION_134_SCOPE_DRIFT_REQUIRES_GOVERNED_RECOVERY_V1",
                "statement": "Scope drift now requires explicit same-shell recovery or reissue, never a hidden disable or generic redirect.",
            },
        ],
        "browser_gap_rows": [
            row
            for row in continuity_scenarios
            if row["browserSpecimenState"] == "gap"
        ],
        "routeIntentCases": route_tuple_rows,
        "projectionFreshnessCases": projection_rows,
        "scopedMutationCases": mutation_rows,
        "continuityScenarios": continuity_scenarios,
    }

    return {
        "route_tuple_rows": route_tuple_rows,
        "projection_rows": projection_rows,
        "mutation_rows": mutation_rows,
        "results_payload": results_payload,
    }


def build_suite_doc(results_payload: dict[str, Any]) -> str:
    route_rows = results_payload["routeIntentCases"]
    projection_rows = results_payload["projectionFreshnessCases"]
    mutation_rows = results_payload["scopedMutationCases"]

    return textwrap.dedent(
        f"""\
        # 134 Route Intent, Projection Freshness, and Scoped Mutation Suite

        `seq_134` publishes one exact verification harness for stale route context, stale projection truth, and widened mutation scope. The suite proves that route-intent tuples, runtime surface authority, freshness envelopes, and selected-anchor recovery remain joined instead of drifting into independent local guesses.

        ## Summary

        - Route-intent tuple cases: `{results_payload["summary"]["route_intent_case_count"]}`
        - Projection-freshness cases: `{results_payload["summary"]["projection_freshness_case_count"]}`
        - Scoped-mutation cases: `{results_payload["summary"]["scoped_mutation_case_count"]}`
        - Browser-verifiable continuity scenarios: `{results_payload["summary"]["browser_available_count"]}`
        - Explicit browser specimen gaps: `{results_payload["summary"]["browser_gap_count"]}`
        - transport-live but non-live-actionability cases: `{results_payload["summary"]["transport_live_but_non_live_actionability_count"]}`

        ## Covered Families

        {markdown_table(
            ["Case Family", "Covered"],
            [
                [family, "yes" if family in {row["caseFamily"] for row in results_payload["continuityScenarios"]} else "no"]
                for family in REQUIRED_CASE_FAMILIES
            ],
        )}

        ## Route-Intent Tuple Highlights

        {markdown_table(
            ["Case", "Route", "Action Scope", "Decision", "Browser"],
            [
                [
                    row["case_id"],
                    row["route_family"],
                    row["action_scope"],
                    row["expected_decision"],
                    row["browser_specimen_state"],
                ]
                for row in route_rows
            ],
        )}

        ## Projection Freshness Highlights

        {markdown_table(
            ["Case", "Transport", "Freshness", "Actionability", "Shell Posture"],
            [
                [
                    row["case_id"],
                    row["transport_state"],
                    row["projection_freshness_state"],
                    row["actionability_state"],
                    row["expected_shell_posture"],
                ]
                for row in projection_rows
            ],
        )}

        ## Scoped Mutation Highlights

        {markdown_table(
            ["Case", "Drift Dimension", "Ordinary Mutation", "Route Decision", "Recovery Envelope"],
            [
                [
                    row["case_id"],
                    row["drift_dimension"],
                    row["ordinary_mutation_state"],
                    row["expected_route_decision"],
                    row["same_shell_recovery_envelope_ref"],
                ]
                for row in mutation_rows
            ],
        )}
        """
    ).strip() + "\n"


def build_continuity_doc(results_payload: dict[str, Any]) -> str:
    continuity_rows = results_payload["continuityScenarios"]
    return textwrap.dedent(
        f"""\
        # 134 Surface Authority and Continuity Cases

        The continuity cases below bind route-intent parity, projection freshness, scoped mutation law, current `AudienceSurfaceRuntimeBinding`, declared recovery or freeze dispositions, and selected-anchor preservation into one reviewed table.

        ## Continuity Cases

        {markdown_table(
            [
                "Case",
                "Route",
                "Shell",
                "Route Decision",
                "Mutation",
                "Shell Posture",
                "Selected Anchor",
                "Browser",
            ],
            [
                [
                    row["caseId"],
                    row["routeFamilyRef"],
                    row["shellSlug"],
                    row["routeTupleDecision"],
                    row["mutationDecision"],
                    row["effectiveShellPosture"],
                    row["selectedAnchorDisposition"],
                    row["browserSpecimenState"],
                ]
                for row in continuity_rows
            ],
        )}

        ## Explicit Browser Gaps

        {markdown_table(
            ["Case", "Route", "Gap Ref", "Next Safe Action"],
            [
                [
                    row["caseId"],
                    row["routeFamilyRef"],
                    row["gapRef"] or "n/a",
                    row["nextSafeActionLabel"],
                ]
                for row in continuity_rows
                if row["browserSpecimenState"] == "gap"
            ],
        )}
        """
    ).strip() + "\n"


def build_lab_html(results_payload: dict[str, Any]) -> str:
    suite_json = json.dumps(results_payload, separators=(",", ":"))
    return textwrap.dedent(
        f"""\
        <!doctype html>
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>134 Continuity Gate Lab</title>
            <style>
              :root {{
                color-scheme: light;
                --canvas: #F7F8FA;
                --shell: #EEF2F6;
                --panel: #FFFFFF;
                --inset: #E8EEF3;
                --text-strong: #0F1720;
                --text: #24313D;
                --muted: #5E6B78;
                --live: #117A55;
                --provisional: #2F6FED;
                --recovery: #B7791F;
                --blocked: #B42318;
                --continuity: #5B61F6;
                --border: #D5DEE7;
                --shadow: 0 22px 44px rgba(15, 23, 32, 0.08);
                --radius: 24px;
              }}
              * {{ box-sizing: border-box; }}
              body {{
                margin: 0;
                background:
                  radial-gradient(circle at 12% 0%, rgba(91, 97, 246, 0.08), transparent 26%),
                  radial-gradient(circle at 86% 14%, rgba(47, 111, 237, 0.08), transparent 28%),
                  linear-gradient(180deg, #fbfcfd, var(--canvas));
                color: var(--text);
                font-family: "IBM Plex Sans", "Segoe UI", sans-serif;
              }}
              body[data-reduced-motion="true"] * {{
                animation-duration: 0.01ms !important;
                transition-duration: 0.01ms !important;
                scroll-behavior: auto !important;
              }}
              .app {{
                max-width: 1560px;
                width: min(100%, 1560px);
                margin: 0 auto;
                padding: 18px 18px 28px;
                overflow-x: clip;
              }}
              .masthead {{
                min-height: 72px;
                display: grid;
                grid-template-columns: minmax(280px, 1.2fr) repeat(4, minmax(0, 1fr));
                gap: 14px;
                align-items: stretch;
                margin-bottom: 18px;
              }}
              .brand,
              .metric,
              .rail,
              .canvas,
              .inspector,
              .panel {{
                border: 1px solid var(--border);
                border-radius: var(--radius);
                background: rgba(255, 255, 255, 0.94);
                box-shadow: var(--shadow);
              }}
              .brand {{
                display: flex;
                align-items: center;
                gap: 14px;
                padding: 16px 18px;
              }}
              .brand-mark {{
                width: 44px;
                height: 44px;
                border-radius: 14px;
                display: grid;
                place-items: center;
                background: linear-gradient(180deg, rgba(255,255,255,0.96), rgba(232,238,243,0.96));
                color: var(--continuity);
              }}
              .eyebrow,
              .metric span,
              .label {{
                display: block;
                font-size: 11px;
                letter-spacing: 0.08em;
                text-transform: uppercase;
                color: var(--muted);
              }}
              .brand strong,
              .metric strong,
              .panel h2,
              .inspector h2 {{
                color: var(--text-strong);
              }}
              .brand strong {{
                display: block;
                font-size: 18px;
              }}
              .brand p,
              .metric p,
              .panel p,
              .inspector p,
              .case-button small,
              .snapshot-copy,
              td,
              th {{
                margin: 0;
                color: var(--muted);
                line-height: 1.5;
              }}
              .metric {{
                padding: 14px 16px;
              }}
              .metric strong {{
                display: block;
                font-size: 24px;
              }}
              .layout {{
                display: grid;
                grid-template-columns: 280px minmax(0, 1fr) 404px;
                gap: 18px;
                align-items: start;
                min-width: 0;
              }}
              .rail {{
                padding: 18px;
                background: linear-gradient(180deg, rgba(255,255,255,0.98), var(--shell));
              }}
              .rail,
              .canvas,
              .inspector,
              .panel,
              .filters,
              .case-list,
              .case-button,
              label {{
                min-width: 0;
              }}
              .filters {{
                display: grid;
                gap: 12px;
              }}
              label {{
                display: grid;
                gap: 6px;
                font-size: 13px;
                color: var(--text-strong);
              }}
              select {{
                width: 100%;
                min-width: 0;
                height: 42px;
                padding: 0 12px;
                border-radius: 14px;
                border: 1px solid var(--border);
                background: var(--panel);
                color: var(--text);
                font: inherit;
              }}
              .case-list {{
                display: grid;
                gap: 10px;
                margin-top: 16px;
                max-height: 720px;
                overflow: auto;
              }}
              .case-button {{
                text-align: left;
                padding: 14px;
                border-radius: 18px;
                border: 1px solid var(--border);
                background: var(--panel);
                cursor: pointer;
                transition: transform 160ms ease, border-color 160ms ease, background-color 160ms ease;
              }}
              .case-button:hover,
              .case-button:focus-visible,
              .case-button[data-active="true"] {{
                transform: translateY(-1px);
                border-color: rgba(91, 97, 246, 0.28);
                background: var(--shell);
                outline: none;
              }}
              .badge-row,
              .chip-row,
              .tab-list {{
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
              }}
              .badge,
              .chip,
              .tab-button {{
                display: inline-flex;
                align-items: center;
                min-height: 28px;
                padding: 0 10px;
                border-radius: 999px;
                border: 1px solid var(--border);
                background: rgba(15, 23, 32, 0.04);
                font-size: 12px;
                color: var(--text);
              }}
              .badge[data-posture="live"] {{ color: var(--live); background: rgba(17,122,85,0.12); }}
              .badge[data-posture="read_only"] {{ color: var(--provisional); background: rgba(47,111,237,0.12); }}
              .badge[data-posture="recovery_only"] {{ color: var(--recovery); background: rgba(183,121,31,0.12); }}
              .badge[data-posture="blocked"] {{ color: var(--blocked); background: rgba(180,35,24,0.12); }}
              .badge[data-browser="gap"] {{ color: var(--blocked); background: rgba(180,35,24,0.08); }}
              .canvas {{
                padding: 18px;
                display: grid;
                gap: 18px;
              }}
              .panel {{
                padding: 18px;
                background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(232,238,243,0.72));
              }}
              .panel h2,
              .inspector h2 {{
                margin: 0 0 8px;
                font-size: 20px;
              }}
              .canvas-grid {{
                display: grid;
                grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
                gap: 18px;
              }}
              .diagram-card,
              .table-card,
              .snapshot-card,
              .inspector-section {{
                border: 1px solid var(--border);
                border-radius: 20px;
                background: rgba(255,255,255,0.9);
                padding: 14px;
              }}
              .lattice,
              .ladder,
              .braid {{
                display: grid;
                gap: 10px;
              }}
              .lattice-row,
              .ladder-row,
              .braid-row {{
                display: grid;
                grid-template-columns: 140px minmax(0, 1fr) 120px;
                gap: 10px;
                align-items: center;
              }}
              .node {{
                padding: 12px;
                border-radius: 16px;
                border: 1px solid var(--border);
                background: var(--panel);
              }}
              .node strong {{
                display: block;
                color: var(--text-strong);
              }}
              .braid-row .node:last-child {{
                text-align: right;
              }}
              .node[data-tone="route"] {{ border-color: rgba(91,97,246,0.24); }}
              .node[data-tone="freshness"] {{ border-color: rgba(47,111,237,0.24); }}
              .node[data-tone="mutation"] {{ border-color: rgba(183,121,31,0.24); }}
              .node[data-tone="blocked"] {{ border-color: rgba(180,35,24,0.28); }}
              .arrow {{
                height: 2px;
                background: linear-gradient(90deg, rgba(91,97,246,0.2), rgba(47,111,237,0.6));
                position: relative;
              }}
              .arrow::after {{
                content: "";
                position: absolute;
                right: -1px;
                top: -4px;
                width: 10px;
                height: 10px;
                border-top: 2px solid rgba(47,111,237,0.6);
                border-right: 2px solid rgba(47,111,237,0.6);
                transform: rotate(45deg);
              }}
              table {{
                width: 100%;
                table-layout: fixed;
                border-collapse: collapse;
              }}
              th,
              td {{
                padding: 10px 8px;
                border-bottom: 1px solid rgba(213, 222, 231, 0.9);
                vertical-align: top;
                font-size: 13px;
                text-align: left;
              }}
              th {{
                font-size: 11px;
                letter-spacing: 0.06em;
                text-transform: uppercase;
              }}
              .interactive-row {{
                cursor: pointer;
              }}
              .interactive-row:hover,
              .interactive-row:focus-visible,
              .interactive-row[data-active="true"] {{
                background: rgba(91, 97, 246, 0.06);
                outline: none;
              }}
              .inspector {{
                position: sticky;
                top: 16px;
                padding: 18px;
                display: grid;
                gap: 14px;
              }}
              .snapshot-shell {{
                border: 1px solid var(--border);
                border-radius: 18px;
                background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(238,242,246,0.86));
                padding: 14px;
                display: grid;
                gap: 10px;
              }}
              .snapshot-shell[data-posture="recovery_only"] {{
                border-color: rgba(183,121,31,0.3);
              }}
              .snapshot-shell[data-posture="blocked"] {{
                border-color: rgba(180,35,24,0.3);
              }}
              .snapshot-shell[data-posture="read_only"] {{
                border-color: rgba(47,111,237,0.3);
              }}
              .tab-button {{
                cursor: pointer;
                background: rgba(15,23,32,0.04);
              }}
              .tab-button[data-active="true"] {{
                background: rgba(91,97,246,0.12);
                color: var(--continuity);
                border-color: rgba(91,97,246,0.24);
              }}
              .mono {{
                font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
                font-size: 12px;
                word-break: break-word;
              }}
              @media (max-width: 1280px) {{
                .masthead {{
                  grid-template-columns: repeat(2, minmax(0, 1fr));
                }}
                .layout {{
                  grid-template-columns: 1fr;
                }}
                .inspector {{
                  position: static;
                }}
              }}
              @media (max-width: 880px) {{
                .masthead,
                .canvas-grid {{
                  grid-template-columns: 1fr;
                }}
                .lattice-row,
                .ladder-row,
                .braid-row {{
                  grid-template-columns: 1fr;
                }}
              }}
              @media (prefers-reduced-motion: reduce) {{
                body {{
                  scroll-behavior: auto;
                }}
              }}
            </style>
          </head>
          <body>
            <div class="app" data-testid="continuity-gate-lab">
              <header class="masthead">
                <section class="brand">
                  <div class="brand-mark" aria-hidden="true">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M4 12h5l2-6 3 12 2-6h4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
                      <circle cx="6" cy="12" r="1.2" fill="currentColor"/>
                      <circle cx="18" cy="12" r="1.2" fill="currentColor"/>
                    </svg>
                  </div>
                  <div>
                    <span class="eyebrow">Vecells Continuity Gate</span>
                    <strong>Continuity_Gate_Lab</strong>
                    <p>Route intent, freshness, mutation, runtime truth, and selected-anchor recovery in one same-shell proof surface.</p>
                  </div>
                </section>
                <section class="metric"><span>Scenarios</span><strong data-testid="summary-scenarios"></strong><p>Integrated continuity cases.</p></section>
                <section class="metric"><span>Browser Proof</span><strong data-testid="summary-browser"></strong><p>Current browser-verifiable routes.</p></section>
                <section class="metric"><span>Browser Gaps</span><strong data-testid="summary-gaps"></strong><p>Explicit matrix-only routes.</p></section>
                <section class="metric"><span>Live ≠ Fresh</span><strong data-testid="summary-live-not-fresh"></strong><p>Transport-live cases that still remain guarded.</p></section>
              </header>
              <main class="layout">
                <aside class="rail">
                  <div class="filters">
                    <label>
                      <span class="label">Case Family</span>
                      <select data-testid="case-family-filter"></select>
                    </label>
                    <label>
                      <span class="label">Browser Proof</span>
                      <select data-testid="browser-filter"></select>
                    </label>
                  </div>
                  <div class="case-list" data-testid="case-list" role="listbox" aria-label="Continuity cases"></div>
                </aside>
                <section class="canvas">
                  <div class="canvas-grid">
                    <section class="panel">
                      <h2>Route-Intent Lattice</h2>
                      <p>The governing object tuple, runtime authority, and final route verdict stay adjacent and inspectable.</p>
                      <div class="diagram-card lattice" data-testid="route-intent-lattice"></div>
                      <div class="table-card" data-testid="route-lattice-table"></div>
                    </section>
                    <section class="panel">
                      <h2>Freshness Ladder</h2>
                      <p>Transport health, authoritative freshness, and actionability are displayed as separate rungs.</p>
                      <div class="diagram-card ladder" data-testid="freshness-ladder"></div>
                      <div class="table-card" data-testid="freshness-table"></div>
                    </section>
                  </div>
                  <section class="panel">
                    <h2>Mutation-Gate Decision Braid</h2>
                    <p>Ordinary mutation, same-shell recovery, and selected-anchor preservation remain distinct and fail-closed.</p>
                    <div class="diagram-card braid" data-testid="mutation-braid"></div>
                    <div class="table-card" data-testid="mutation-table"></div>
                  </section>
                  <section class="panel">
                    <h2>Case Table and Shell Snapshots</h2>
                    <p>Every diagram has adjacent table parity, and every continuity scenario exposes a same-shell snapshot rather than a generic redirect.</p>
                    <div class="table-card" data-testid="case-table"></div>
                    <div class="tab-list" data-testid="shell-snapshot-tabs" role="tablist" aria-label="Shell snapshots">
                      <button type="button" class="tab-button" data-testid="snapshot-tab-current" data-tab="current" role="tab">Current</button>
                      <button type="button" class="tab-button" data-testid="snapshot-tab-recovery" data-tab="recovery" role="tab">Recovery</button>
                      <button type="button" class="tab-button" data-testid="snapshot-tab-tuple" data-tab="tuple" role="tab">Tuple</button>
                    </div>
                    <div class="snapshot-card" data-testid="shell-snapshot-panel"></div>
                  </section>
                </section>
                <aside class="inspector" data-testid="continuity-inspector">
                  <section class="inspector-section">
                    <h2 data-testid="inspector-title"></h2>
                    <p data-testid="inspector-summary"></p>
                    <div class="badge-row" data-testid="inspector-badges"></div>
                  </section>
                  <section class="inspector-section">
                    <div><span class="label">Selected Anchor</span><p data-testid="selected-anchor-detail"></p></div>
                    <div><span class="label">Next Safe Action</span><p data-testid="next-safe-action"></p></div>
                    <div><span class="label">Gap Ref</span><p class="mono" data-testid="gap-ref"></p></div>
                  </section>
                  <section class="inspector-section">
                    <span class="label">Reason Refs</span>
                    <div class="chip-row" data-testid="reason-refs"></div>
                  </section>
                  <section class="inspector-section">
                    <span class="label">Source Refs</span>
                    <div class="chip-row" data-testid="source-refs"></div>
                  </section>
                </aside>
              </main>
            </div>
            <script id="suite-data" type="application/json">{suite_json}</script>
            <script>
              const suite = JSON.parse(document.getElementById("suite-data").textContent);
              const state = {{
                caseFamily: "all",
                browser: "all",
                activeCaseId: suite.continuityScenarios[0].caseId,
                activeTab: "current",
              }};

              const els = {{
                body: document.body,
                familyFilter: document.querySelector("[data-testid='case-family-filter']"),
                browserFilter: document.querySelector("[data-testid='browser-filter']"),
                caseList: document.querySelector("[data-testid='case-list']"),
                routeIntentLattice: document.querySelector("[data-testid='route-intent-lattice']"),
                routeLatticeTable: document.querySelector("[data-testid='route-lattice-table']"),
                freshnessLadder: document.querySelector("[data-testid='freshness-ladder']"),
                freshnessTable: document.querySelector("[data-testid='freshness-table']"),
                mutationBraid: document.querySelector("[data-testid='mutation-braid']"),
                mutationTable: document.querySelector("[data-testid='mutation-table']"),
                caseTable: document.querySelector("[data-testid='case-table']"),
                snapshotPanel: document.querySelector("[data-testid='shell-snapshot-panel']"),
                inspectorTitle: document.querySelector("[data-testid='inspector-title']"),
                inspectorSummary: document.querySelector("[data-testid='inspector-summary']"),
                inspectorBadges: document.querySelector("[data-testid='inspector-badges']"),
                selectedAnchorDetail: document.querySelector("[data-testid='selected-anchor-detail']"),
                nextSafeAction: document.querySelector("[data-testid='next-safe-action']"),
                gapRef: document.querySelector("[data-testid='gap-ref']"),
                reasonRefs: document.querySelector("[data-testid='reason-refs']"),
                sourceRefs: document.querySelector("[data-testid='source-refs']"),
                summaryScenarios: document.querySelector("[data-testid='summary-scenarios']"),
                summaryBrowser: document.querySelector("[data-testid='summary-browser']"),
                summaryGaps: document.querySelector("[data-testid='summary-gaps']"),
                summaryLiveNotFresh: document.querySelector("[data-testid='summary-live-not-fresh']"),
                tabs: [...document.querySelectorAll("[data-testid^='snapshot-tab-']")],
              }};

              const routeCases = new Map(suite.routeIntentCases.map((row) => [row.case_id, row]));
              const projectionCases = new Map(suite.projectionFreshnessCases.map((row) => [row.case_id, row]));
              const mutationCases = new Map(suite.scopedMutationCases.map((row) => [row.case_id, row]));

              function filteredCases() {{
                return suite.continuityScenarios.filter((row) => {{
                  const familyOk = state.caseFamily === "all" || row.caseFamily === state.caseFamily;
                  const browserOk = state.browser === "all" || row.browserSpecimenState === state.browser;
                  return familyOk && browserOk;
                }});
              }}

              function activeCase() {{
                return filteredCases().find((row) => row.caseId === state.activeCaseId) || filteredCases()[0] || suite.continuityScenarios[0];
              }}

              function chip(text, attrs = {{}}, extraClass = "") {{
                const attrText = Object.entries(attrs).map(([key, value]) => ` ${{key}}="${{String(value)}}"`).join("");
                return `<span class="${{extraClass || "chip"}}"${{attrText}}>${{text}}</span>`;
              }}

              function renderFilters() {{
                const familyOptions = ["all", ...new Set(suite.continuityScenarios.map((row) => row.caseFamily))];
                els.familyFilter.innerHTML = familyOptions.map((option) => `<option value="${{option}}">${{option === "all" ? "All families" : option}}</option>`).join("");
                els.familyFilter.value = state.caseFamily;
                els.browserFilter.innerHTML = [
                  ["all", "All browser states"],
                  ["available", "Browser specimen available"],
                  ["gap", "Browser gap rows"],
                ].map(([value, label]) => `<option value="${{value}}">${{label}}</option>`).join("");
                els.browserFilter.value = state.browser;
              }}

              function renderCaseList() {{
                const cases = filteredCases();
                if (!cases.some((row) => row.caseId === state.activeCaseId)) {{
                  state.activeCaseId = cases[0].caseId;
                }}
                els.caseList.innerHTML = cases.map((row) => `
                  <button
                    type="button"
                    class="case-button"
                    data-testid="case-button-${{row.caseSlug}}"
                    data-case-id="${{row.caseId}}"
                    data-active="${{row.caseId === state.activeCaseId}}"
                    data-browser="${{row.browserSpecimenState}}"
                    role="option"
                    aria-selected="${{row.caseId === state.activeCaseId ? "true" : "false"}}"
                  >
                    <span class="eyebrow">${{row.routeFamilyRef}}</span>
                    <strong>${{row.title}}</strong>
                    <small>${{row.notes}}</small>
                    <div class="badge-row" style="margin-top:10px;">
                      <span class="badge" data-posture="${{row.effectiveShellPosture}}">${{row.effectiveShellPosture}}</span>
                      <span class="badge" data-browser="${{row.browserSpecimenState}}">${{row.browserSpecimenState}}</span>
                    </div>
                  </button>
                `).join("");
                const buttons = [...els.caseList.querySelectorAll(".case-button")];
                buttons.forEach((button, index) => {{
                  button.addEventListener("click", () => {{
                    state.activeCaseId = button.dataset.caseId;
                    render();
                  }});
                  button.addEventListener("keydown", (event) => {{
                    if (event.key === "ArrowDown") {{
                      event.preventDefault();
                      buttons[(index + 1) % buttons.length].focus();
                      state.activeCaseId = buttons[(index + 1) % buttons.length].dataset.caseId;
                      render();
                    }}
                    if (event.key === "ArrowUp") {{
                      event.preventDefault();
                      buttons[(index - 1 + buttons.length) % buttons.length].focus();
                      state.activeCaseId = buttons[(index - 1 + buttons.length) % buttons.length].dataset.caseId;
                      render();
                    }}
                  }});
                }});
              }}

              function renderRouteLattice(row) {{
                const routeCase = routeCases.get(row.routeIntentCaseRef);
                els.routeIntentLattice.innerHTML = `
                  <div class="lattice-row">
                    <div class="node" data-tone="route"><span class="label">Route Intent</span><strong>${{routeCase.expected_decision}}</strong><p>${{routeCase.action_scope}}</p></div>
                    <div class="arrow"></div>
                    <div class="node" data-tone="freshness"><span class="label">Runtime Binding</span><strong>${{row.surfaceAuthorityVerdictId}}</strong><p>${{row.audienceSurface}}</p></div>
                  </div>
                  <div class="lattice-row">
                    <div class="node" data-tone="route"><span class="label">Governing Ref</span><strong class="mono">${{routeCase.governing_object_ref}}</strong><p class="mono">${{routeCase.governing_object_version_ref}}</p></div>
                    <div class="arrow"></div>
                    <div class="node" data-tone="${{row.effectiveShellPosture === "blocked" ? "blocked" : "mutation"}}"><span class="label">Shell Posture</span><strong>${{row.effectiveShellPosture}}</strong><p>${{row.sameShellDisposition}}</p></div>
                  </div>
                `;
                els.routeLatticeTable.innerHTML = `
                  <table>
                    <thead><tr><th>Tuple Member</th><th>Value</th></tr></thead>
                    <tbody>
                      <tr><td>Identity</td><td>${{routeCase.required_identity_tuple_members}}</td></tr>
                      <tr><td>Session</td><td>${{routeCase.required_session_tuple_members}}</td></tr>
                      <tr><td>Release</td><td>${{routeCase.required_release_tuple_members}}</td></tr>
                      <tr><td>Channel</td><td>${{routeCase.required_channel_tuple_members}}</td></tr>
                      <tr><td>Runtime</td><td>${{routeCase.required_runtime_tuple_members}}</td></tr>
                    </tbody>
                  </table>
                `;
              }}

              function renderFreshnessLadder(row) {{
                const freshnessCase = projectionCases.get(row.projectionFreshnessCaseRef);
                els.freshnessLadder.innerHTML = `
                  <div class="ladder-row">
                    <div class="node" data-tone="freshness"><span class="label">Transport</span><strong>${{freshnessCase.transport_state}}</strong><p>Transport health stays separate.</p></div>
                    <div class="arrow"></div>
                    <div class="node" data-tone="freshness"><span class="label">Freshness</span><strong>${{freshnessCase.projection_freshness_state}}</strong><p>${{freshnessCase.expected_freshness_label}}</p></div>
                  </div>
                  <div class="ladder-row">
                    <div class="node" data-tone="freshness"><span class="label">Actionability</span><strong>${{freshnessCase.actionability_state}}</strong><p>${{freshnessCase.expected_actionability_label}}</p></div>
                    <div class="arrow"></div>
                    <div class="node" data-tone="${{row.effectiveShellPosture === "blocked" ? "blocked" : "mutation"}}"><span class="label">Outcome</span><strong>${{freshnessCase.expected_shell_posture}}</strong><p>${{freshnessCase.status_summary}}</p></div>
                  </div>
                `;
                els.freshnessTable.innerHTML = `
                  <table>
                    <thead><tr><th>Field</th><th>Value</th></tr></thead>
                    <tbody>
                      <tr><td>Transport state</td><td>${{freshnessCase.transport_state}}</td></tr>
                      <tr><td>Projection freshness</td><td>${{freshnessCase.projection_freshness_state}}</td></tr>
                      <tr><td>Actionability</td><td>${{freshnessCase.actionability_state}}</td></tr>
                      <tr><td>Shell posture</td><td>${{freshnessCase.expected_shell_posture}}</td></tr>
                      <tr><td>Transport live insufficient</td><td>${{freshnessCase.transport_live_insufficient}}</td></tr>
                    </tbody>
                  </table>
                `;
              }}

              function renderMutationBraid(row) {{
                const mutationCase = mutationCases.get(row.scopedMutationCaseRef);
                els.mutationBraid.innerHTML = `
                  <div class="braid-row">
                    <div class="node" data-tone="mutation"><span class="label">Drift Dimension</span><strong>${{mutationCase.drift_dimension}}</strong><p>${{mutationCase.action_scope}}</p></div>
                    <div class="arrow"></div>
                    <div class="node" data-tone="mutation"><span class="label">Ordinary Mutation</span><strong>${{mutationCase.ordinary_mutation_state}}</strong><p>${{mutationCase.expected_route_decision}}</p></div>
                  </div>
                  <div class="braid-row">
                    <div class="node" data-tone="mutation"><span class="label">Recovery Envelope</span><strong class="mono">${{mutationCase.same_shell_recovery_envelope_ref}}</strong><p>${{row.nextSafeActionLabel}}</p></div>
                    <div class="arrow"></div>
                    <div class="node" data-tone="${{row.effectiveShellPosture === "blocked" ? "blocked" : "route"}}"><span class="label">Selected Anchor</span><strong>${{mutationCase.selected_anchor_disposition}}</strong><p>${{row.selectedAnchorKey}}</p></div>
                  </div>
                `;
                els.mutationTable.innerHTML = `
                  <table>
                    <thead><tr><th>Field</th><th>Value</th></tr></thead>
                    <tbody>
                      <tr><td>Acting scope tuple</td><td>${{mutationCase.acting_scope_tuple_requirement_ref}}</td></tr>
                      <tr><td>Subject binding</td><td>${{mutationCase.subject_binding_version_ref}}</td></tr>
                      <tr><td>Lineage fence</td><td>${{mutationCase.lineage_fence_epoch_requirement}}</td></tr>
                      <tr><td>Release binding</td><td>${{mutationCase.release_binding_ref}}</td></tr>
                      <tr><td>Runtime binding</td><td>${{mutationCase.runtime_binding_ref}}</td></tr>
                    </tbody>
                  </table>
                `;
              }}

              function renderCaseTable(activeRow) {{
                const rows = filteredCases();
                els.caseTable.innerHTML = `
                  <table>
                    <thead><tr><th>Case</th><th>Route</th><th>Decision</th><th>Mutation</th><th>Browser</th></tr></thead>
                    <tbody>
                      ${{rows.map((row) => `
                        <tr class="interactive-row" tabindex="0" data-testid="case-table-row-${{row.caseSlug}}" data-case-id="${{row.caseId}}" data-active="${{row.caseId === activeRow.caseId}}">
                          <td>${{row.title}}</td>
                          <td class="mono">${{row.routeFamilyRef}}</td>
                          <td>${{row.routeTupleDecision}}</td>
                          <td>${{row.mutationDecision}}</td>
                          <td>${{row.browserSpecimenState}}</td>
                        </tr>
                      `).join("")}}
                    </tbody>
                  </table>
                `;
                [...els.caseTable.querySelectorAll(".interactive-row")].forEach((rowEl, index, list) => {{
                  rowEl.addEventListener("click", () => {{
                    state.activeCaseId = rowEl.dataset.caseId;
                    render();
                  }});
                  rowEl.addEventListener("keydown", (event) => {{
                    if (event.key === "Enter" || event.key === " ") {{
                      event.preventDefault();
                      state.activeCaseId = rowEl.dataset.caseId;
                      render();
                    }}
                    if (event.key === "ArrowDown") {{
                      event.preventDefault();
                      list[(index + 1) % list.length].focus();
                    }}
                    if (event.key === "ArrowUp") {{
                      event.preventDefault();
                      list[(index - 1 + list.length) % list.length].focus();
                    }}
                  }});
                }});
              }}

              function renderSnapshotPanel(row) {{
                const routeCase = routeCases.get(row.routeIntentCaseRef);
                const projectionCase = projectionCases.get(row.projectionFreshnessCaseRef);
                const mutationCase = mutationCases.get(row.scopedMutationCaseRef);
                els.tabs.forEach((button) => {{
                  button.dataset.active = button.dataset.tab === state.activeTab ? "true" : "false";
                  button.setAttribute("aria-selected", button.dataset.tab === state.activeTab ? "true" : "false");
                }});
                if (state.activeTab === "current") {{
                  els.snapshotPanel.innerHTML = `
                    <div class="snapshot-shell" data-testid="shell-snapshot-current" data-posture="${{row.effectiveShellPosture}}">
                      <span class="label">Shell Snapshot</span>
                      <strong>${{row.shellSnapshot.header}}</strong>
                      <p class="snapshot-copy">${{row.shellSnapshot.summary}}</p>
                      <div class="badge-row">
                        <span class="badge" data-posture="${{row.effectiveShellPosture}}">${{row.effectiveShellPosture}}</span>
                        <span class="badge" data-browser="${{row.browserSpecimenState}}">${{row.browserSpecimenState}}</span>
                      </div>
                      <p data-testid="snapshot-selected-anchor">Selected anchor: <span class="mono">${{row.selectedAnchorKey}}</span></p>
                      <p data-testid="snapshot-next-safe-action">Next safe action: ${{row.nextSafeActionLabel}}</p>
                    </div>
                  `;
                }} else if (state.activeTab === "recovery") {{
                  els.snapshotPanel.innerHTML = `
                    <div class="snapshot-shell" data-testid="shell-snapshot-recovery" data-posture="${{row.effectiveShellPosture}}">
                      <span class="label">Recovery Snapshot</span>
                      <strong>${{row.sameShellDisposition}}</strong>
                      <p class="snapshot-copy">${{row.shellSnapshot.sameShellMessage}}</p>
                      <p>Selected-anchor disposition: <span class="mono">${{row.selectedAnchorDisposition}}</span></p>
                      <p>Recovery action: ${{row.shellSnapshot.recoveryActionLabel}}</p>
                    </div>
                  `;
                }} else {{
                  els.snapshotPanel.innerHTML = `
                    <div class="snapshot-shell" data-testid="shell-snapshot-tuple" data-posture="${{row.effectiveShellPosture}}">
                      <span class="label">Tuple Snapshot</span>
                      <strong class="mono">${{routeCase.governing_object_ref}}</strong>
                      <p class="snapshot-copy">Release: <span class="mono">${{mutationCase.release_binding_ref}}</span></p>
                      <p class="snapshot-copy">Runtime: <span class="mono">${{mutationCase.runtime_binding_ref}}</span></p>
                      <p class="snapshot-copy">Freshness: <span class="mono">${{projectionCase.projection_freshness_state}}</span> / <span class="mono">${{projectionCase.transport_state}}</span></p>
                    </div>
                  `;
                }}
              }}

              function renderInspector(row) {{
                els.inspectorTitle.textContent = row.title;
                els.inspectorSummary.textContent = row.notes;
                els.inspectorBadges.innerHTML = [
                  chip(row.routeTupleDecision, {{ "data-posture": row.effectiveShellPosture }}, "badge"),
                  chip(row.mutationDecision, {{}}, "badge"),
                  chip(row.browserSpecimenState, {{ "data-browser": row.browserSpecimenState }}, "badge"),
                ].join("");
                els.selectedAnchorDetail.textContent = `${{row.selectedAnchorKey}} (${{row.selectedAnchorDisposition}})`;
                els.nextSafeAction.textContent = row.nextSafeActionLabel;
                els.gapRef.textContent = row.gapRef || "none";
                els.reasonRefs.innerHTML = row.reasonRefs.map((ref) => chip(ref)).join("");
                els.sourceRefs.innerHTML = row.sourceRefs.slice(0, 8).map((ref) => chip(ref)).join("");
              }}

              function renderSummary() {{
                els.summaryScenarios.textContent = String(suite.summary.continuity_scenario_count);
                els.summaryBrowser.textContent = String(suite.summary.browser_available_count);
                els.summaryGaps.textContent = String(suite.summary.browser_gap_count);
                els.summaryLiveNotFresh.textContent = String(suite.summary.transport_live_but_non_live_actionability_count);
              }}

              function render() {{
                renderCaseList();
                const row = activeCase();
                renderRouteLattice(row);
                renderFreshnessLadder(row);
                renderMutationBraid(row);
                renderCaseTable(row);
                renderSnapshotPanel(row);
                renderInspector(row);
                renderSummary();
              }}

              els.familyFilter.addEventListener("change", (event) => {{
                state.caseFamily = event.target.value;
                render();
              }});
              els.browserFilter.addEventListener("change", (event) => {{
                state.browser = event.target.value;
                render();
              }});
              els.tabs.forEach((button) => {{
                button.addEventListener("click", () => {{
                  state.activeTab = button.dataset.tab;
                  renderSnapshotPanel(activeCase());
                }});
                button.addEventListener("keydown", (event) => {{
                  const tabs = els.tabs;
                  const index = tabs.indexOf(button);
                  if (event.key === "ArrowRight") {{
                    event.preventDefault();
                    const next = tabs[(index + 1) % tabs.length];
                    state.activeTab = next.dataset.tab;
                    next.focus();
                    renderSnapshotPanel(activeCase());
                  }}
                  if (event.key === "ArrowLeft") {{
                    event.preventDefault();
                    const next = tabs[(index - 1 + tabs.length) % tabs.length];
                    state.activeTab = next.dataset.tab;
                    next.focus();
                    renderSnapshotPanel(activeCase());
                  }}
                }});
              }});

              renderFilters();
              render();
              document.body.dataset.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "true" : "false";
            </script>
          </body>
        </html>
        """
    )


def main() -> None:
    ensure_dirs()
    bundle = build_case_rows()
    write_csv(ROUTE_TUPLE_CASES_PATH, ROUTE_TUPLE_FIELDS, bundle["route_tuple_rows"])
    write_csv(PROJECTION_CASES_PATH, PROJECTION_FIELDS, bundle["projection_rows"])
    write_csv(SCOPED_MUTATION_CASES_PATH, SCOPED_MUTATION_FIELDS, bundle["mutation_rows"])
    SUITE_RESULTS_PATH.write_text(
        json.dumps(bundle["results_payload"], indent=2) + "\n", encoding="utf-8"
    )
    SUITE_DOC_PATH.write_text(
        build_suite_doc(bundle["results_payload"]), encoding="utf-8"
    )
    CONTINUITY_DOC_PATH.write_text(
        build_continuity_doc(bundle["results_payload"]), encoding="utf-8"
    )
    LAB_PATH.write_text(build_lab_html(bundle["results_payload"]), encoding="utf-8")


if __name__ == "__main__":
    main()
