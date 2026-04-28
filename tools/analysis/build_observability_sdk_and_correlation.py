#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"

RUNTIME_TOPOLOGY_PATH = DATA_DIR / "runtime_topology_manifest.json"
GATEWAY_SURFACE_PATH = DATA_DIR / "gateway_surface_manifest.json"
API_REGISTRY_PATH = DATA_DIR / "api_contract_registry_manifest.json"
LIVE_TRANSPORT_PATH = DATA_DIR / "live_transport_topology_manifest.json"
CACHE_NAMESPACE_PATH = DATA_DIR / "cache_namespace_manifest.json"
EVENT_BROKER_PATH = DATA_DIR / "event_broker_topology_manifest.json"
PREVIEW_MANIFEST_PATH = DATA_DIR / "preview_environment_manifest.json"
PREVIEW_SEED_PATH = DATA_DIR / "preview_seed_pack_manifest.json"
SUPPLY_CHAIN_PATH = DATA_DIR / "supply_chain_and_provenance_matrix.json"
AUDIT_DISCLOSURE_PATH = DATA_DIR / "audit_event_disclosure_matrix.csv"

OBSERVABILITY_MANIFEST_PATH = DATA_DIR / "observability_event_schema_manifest.json"
CORRELATION_MATRIX_PATH = DATA_DIR / "correlation_propagation_matrix.csv"
REDACTION_POLICY_PATH = DATA_DIR / "telemetry_redaction_policy.json"

TASK_ID = "par_093"
VISUAL_MODE = "Edge_Correlation_Spine_Explorer"
GENERATED_AT = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
CAPTURED_ON = GENERATED_AT[:10]

SOURCE_PRECEDENCE = [
    "prompt/093.md",
    "prompt/shared_operating_contract_086_to_095.md",
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "blueprint/phase-0-the-foundation-protocol.md#0G. Observability, security plumbing, and operational controls",
    "blueprint/phase-0-the-foundation-protocol.md#UIEventCausalityFrame",
    "blueprint/phase-0-the-foundation-protocol.md#UITransitionSettlementRecord",
    "blueprint/phase-0-the-foundation-protocol.md#UIProjectionVisibilityReceipt",
    "blueprint/phase-0-the-foundation-protocol.md#UIEventEmissionCheckpoint",
    "blueprint/platform-runtime-and-release-blueprint.md#Operational readiness contract",
    "blueprint/platform-runtime-and-release-blueprint.md#Runtime publication and controlled migrations",
    "blueprint/platform-frontend-blueprint.md#Canonical real-time interaction, motion, and live-projection experience algorithm",
    "blueprint/patient-portal-experience-architecture-blueprint.md#Requests surface contract",
    "blueprint/staff-operations-and-support-blueprint.md#Support continuity",
    "blueprint/forensic-audit-findings.md#Finding 86",
    "blueprint/forensic-audit-findings.md#Finding 87",
    "blueprint/forensic-audit-findings.md#Finding 91",
    "blueprint/forensic-audit-findings.md#Finding 92",
    "blueprint/forensic-audit-findings.md#Finding 96",
    "blueprint/forensic-audit-findings.md#Finding 100",
    "blueprint/forensic-audit-findings.md#Finding 102",
    "blueprint/forensic-audit-findings.md#Finding 105",
    "blueprint/forensic-audit-findings.md#Finding 112",
    "data/analysis/runtime_topology_manifest.json",
    "data/analysis/gateway_surface_manifest.json",
    "data/analysis/api_contract_registry_manifest.json",
    "data/analysis/live_transport_topology_manifest.json",
    "data/analysis/cache_namespace_manifest.json",
    "data/analysis/event_broker_topology_manifest.json",
    "data/analysis/preview_environment_manifest.json",
    "data/analysis/preview_seed_pack_manifest.json",
    "data/analysis/supply_chain_and_provenance_matrix.json",
]

SCHEMA_DEFINITIONS = [
    {
        "eventSchemaRef": "obs_gateway_request_completed",
        "eventName": "gateway.request.accepted",
        "eventFamily": "structured_log",
        "hopKind": "gateway",
        "requiredFields": [
            "edgeCorrelationId",
            "causalToken",
            "traceId",
            "hopSequence",
            "routeId",
            "statusCode",
            "requestPath",
        ],
        "disclosureClasses": [
            "control_plane_safe",
            "public_descriptor",
            "phi_reference_only",
        ],
        "sourceRefs": [
            "packages/observability/src/telemetry.ts",
            "services/api-gateway/src/runtime.ts",
        ],
    },
    {
        "eventSchemaRef": "obs_command_request_completed",
        "eventName": "command.accepted",
        "eventFamily": "structured_log",
        "hopKind": "command_handler",
        "requiredFields": [
            "edgeCorrelationId",
            "causalToken",
            "traceId",
            "hopSequence",
            "routeId",
            "statusCode",
            "requestPath",
        ],
        "disclosureClasses": [
            "control_plane_safe",
            "phi_reference_only",
            "masked_route_descriptor",
        ],
        "sourceRefs": [
            "packages/observability/src/telemetry.ts",
            "services/command-api/src/runtime.ts",
        ],
    },
    {
        "eventSchemaRef": "obs_event_spine_published",
        "eventName": "event_spine.publish.latency_ms",
        "eventFamily": "metric",
        "hopKind": "event_bus",
        "requiredFields": [
            "edgeCorrelationId",
            "causalToken",
            "traceId",
            "hopSequence",
            "metricValue",
            "unit",
            "queueRef",
        ],
        "disclosureClasses": ["control_plane_safe"],
        "sourceRefs": [
            "packages/observability/src/telemetry.ts",
            "packages/domain-kernel/src/event-spine.ts",
        ],
    },
    {
        "eventSchemaRef": "obs_projection_worker_applied",
        "eventName": "projection.worker.applied",
        "eventFamily": "structured_log",
        "hopKind": "worker",
        "requiredFields": [
            "edgeCorrelationId",
            "causalToken",
            "traceId",
            "hopSequence",
            "projectionName",
            "projectionVersionRef",
        ],
        "disclosureClasses": ["control_plane_safe", "public_descriptor"],
        "sourceRefs": [
            "packages/observability/src/telemetry.ts",
            "services/projection-worker/src/runtime.ts",
        ],
    },
    {
        "eventSchemaRef": "obs_projection_materialized",
        "eventName": "projection.materialized",
        "eventFamily": "structured_log",
        "hopKind": "projection",
        "requiredFields": [
            "edgeCorrelationId",
            "causalToken",
            "traceId",
            "hopSequence",
            "projectionVersionRef",
            "projectionState",
        ],
        "disclosureClasses": ["control_plane_safe", "public_descriptor"],
        "sourceRefs": [
            "packages/observability/src/telemetry.ts",
            "blueprint/platform-frontend-blueprint.md#UIProjectionVisibilityReceipt",
        ],
    },
    {
        "eventSchemaRef": "obs_ui_transition_server_accepted",
        "eventName": "ui.transition.server_accepted",
        "eventFamily": "ui_event",
        "hopKind": "browser",
        "requiredFields": [
            "continuityFrameRef",
            "edgeCorrelationId",
            "causalToken",
            "eventSequence",
            "selectedAnchorRef",
            "shellSlug",
        ],
        "disclosureClasses": ["control_plane_safe", "public_descriptor"],
        "sourceRefs": [
            "packages/observability/src/ui-causality.ts",
            "blueprint/platform-frontend-blueprint.md#UIEventEmissionCheckpoint",
        ],
    },
    {
        "eventSchemaRef": "obs_ui_restore_applied",
        "eventName": "ui.restore.applied",
        "eventFamily": "ui_event",
        "hopKind": "browser",
        "requiredFields": [
            "continuityFrameRef",
            "edgeCorrelationId",
            "causalToken",
            "eventSequence",
            "selectedAnchorRef",
            "continuityState",
        ],
        "disclosureClasses": ["control_plane_safe", "public_descriptor"],
        "sourceRefs": [
            "packages/observability/src/ui-causality.ts",
            "blueprint/platform-frontend-blueprint.md#UIEventCausalityFrame",
        ],
    },
    {
        "eventSchemaRef": "obs_ui_freshness_stale_visible",
        "eventName": "ui.freshness.stale_visible",
        "eventFamily": "ui_event",
        "hopKind": "browser",
        "requiredFields": [
            "continuityFrameRef",
            "edgeCorrelationId",
            "causalToken",
            "eventSequence",
            "projectionVersionRef",
            "visibilityState",
        ],
        "disclosureClasses": ["control_plane_safe", "public_descriptor"],
        "sourceRefs": [
            "packages/observability/src/ui-causality.ts",
            "blueprint/platform-frontend-blueprint.md#UIProjectionVisibilityReceipt",
        ],
    },
    {
        "eventSchemaRef": "obs_ui_projection_seen",
        "eventName": "ui.transition.projection_seen",
        "eventFamily": "ui_visibility_receipt",
        "hopKind": "ui_visibility_receipt",
        "requiredFields": [
            "visibilityReceiptRef",
            "edgeCorrelationId",
            "causalToken",
            "projectionVersionRef",
            "visibilityState",
            "shellDecisionClass",
        ],
        "disclosureClasses": ["control_plane_safe", "public_descriptor", "audit_link_only"],
        "sourceRefs": [
            "packages/observability/src/ui-causality.ts",
            "blueprint/phase-0-the-foundation-protocol.md#UIProjectionVisibilityReceipt",
        ],
    },
    {
        "eventSchemaRef": "obs_ui_settlement",
        "eventName": "ui.transition.settled",
        "eventFamily": "ui_transition_settlement",
        "hopKind": "ui_visibility_receipt",
        "requiredFields": [
            "settlementRef",
            "edgeCorrelationId",
            "causalToken",
            "projectionVisibilityRef",
            "authoritativeSource",
            "authoritativeOutcomeState",
        ],
        "disclosureClasses": ["control_plane_safe", "audit_link_only", "public_descriptor"],
        "sourceRefs": [
            "packages/observability/src/ui-causality.ts",
            "blueprint/phase-0-the-foundation-protocol.md#UITransitionSettlementRecord",
        ],
    },
    {
        "eventSchemaRef": "obs_audit_correlation_bound",
        "eventName": "audit.correlation.bound",
        "eventFamily": "audit",
        "hopKind": "audit",
        "requiredFields": [
            "auditRecordRef",
            "edgeCorrelationId",
            "causalToken",
            "visibilityReceiptRef",
            "settlementRef",
        ],
        "disclosureClasses": ["audit_link_only", "control_plane_safe"],
        "sourceRefs": [
            "packages/observability/src/ui-causality.ts",
            "data/analysis/audit_event_disclosure_matrix.csv",
        ],
    },
    {
        "eventSchemaRef": "obs_disclosure_blocked",
        "eventName": "ui.disclosure.blocked",
        "eventFamily": "structured_log",
        "hopKind": "ui_visibility_receipt",
        "requiredFields": [
            "edgeCorrelationId",
            "causalToken",
            "traceId",
            "hopSequence",
            "blockedField",
            "auditRecordRef",
        ],
        "disclosureClasses": ["blocked_raw_phi", "audit_link_only"],
        "sourceRefs": [
            "packages/observability/src/telemetry.ts",
            "packages/observability/tests/correlation-spine.test.ts",
        ],
    },
]

POLICY_RULES = [
    {
        "ruleRef": "trp_control_plane_safe_passthrough",
        "disclosureClass": "control_plane_safe",
        "handling": "emit_verbatim",
        "allowedEventFamilies": ["structured_log", "metric", "trace_span", "audit"],
    },
    {
        "ruleRef": "trp_public_descriptor_passthrough",
        "disclosureClass": "public_descriptor",
        "handling": "emit_verbatim",
        "allowedEventFamilies": ["structured_log", "ui_event", "ui_visibility_receipt"],
    },
    {
        "ruleRef": "trp_phi_reference_digest",
        "disclosureClass": "phi_reference_only",
        "handling": "hash_reference",
        "allowedEventFamilies": ["structured_log"],
    },
    {
        "ruleRef": "trp_mask_contact_descriptor",
        "disclosureClass": "masked_contact_descriptor",
        "handling": "mask_contact",
        "allowedEventFamilies": ["structured_log"],
    },
    {
        "ruleRef": "trp_mask_route_descriptor",
        "disclosureClass": "masked_route_descriptor",
        "handling": "hash_route_descriptor",
        "allowedEventFamilies": ["structured_log"],
    },
    {
        "ruleRef": "trp_audit_link_only",
        "disclosureClass": "audit_link_only",
        "handling": "emit_immutable_ref_only",
        "allowedEventFamilies": ["audit", "ui_transition_settlement", "ui_visibility_receipt"],
    },
    {
        "ruleRef": "trp_block_raw_phi",
        "disclosureClass": "blocked_raw_phi",
        "handling": "block_and_fail_closed",
        "allowedEventFamilies": [],
    },
]


def read_json(path: Path) -> dict[str, Any]:
    if not path.exists():
        raise SystemExit(f"missing required file: {path.relative_to(ROOT)}")
    return json.loads(path.read_text(encoding="utf-8"))


def read_csv(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        raise SystemExit(f"missing required file: {path.relative_to(ROOT)}")
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def make_hop(
    trace_ref: str,
    hop_sequence: int,
    hop_kind: str,
    service_ref: str,
    event_name: str,
    event_family: str,
    correlation_state: str,
    disclosure_state: str,
    replay_state: str,
    settlement_state: str,
    note: str,
) -> dict[str, Any]:
    return {
        "hopRef": f"{trace_ref}_hop_{hop_sequence}",
        "hopSequence": hop_sequence,
        "hopKind": hop_kind,
        "serviceRef": service_ref,
        "eventName": event_name,
        "eventFamily": event_family,
        "correlationState": correlation_state,
        "disclosureState": disclosure_state,
        "replayState": replay_state,
        "settlementState": settlement_state,
        "note": note,
    }


def build_trace_runs() -> list[dict[str, Any]]:
    patient_hops = [
        make_hop("trace_patient_live_settled", 1, "browser", "patient-web", "ui.transition.server_accepted", "ui_event", "verified", "verified", "live", "accepted", "Browser creates the continuity frame."),
        make_hop("trace_patient_live_settled", 2, "gateway", "api-gateway", "gateway.request.accepted", "structured_log", "verified", "masked", "live", "accepted", "Edge correlation is first enforced at ingress."),
        make_hop("trace_patient_live_settled", 3, "command_handler", "command-api", "command.accepted", "structured_log", "verified", "masked", "live", "accepted", "Command ingress keeps PHI to digest-only references."),
        make_hop("trace_patient_live_settled", 4, "event_bus", "event-spine", "event_spine.publish.latency_ms", "metric", "verified", "verified", "live", "accepted", "Event publication keeps the same immutable edgeCorrelationId."),
        make_hop("trace_patient_live_settled", 5, "worker", "projection-worker", "projection.worker.applied", "structured_log", "verified", "verified", "live", "projection_visible", "Worker processing preserves the same causal token."),
        make_hop("trace_patient_live_settled", 6, "projection", "projection-store", "projection.materialized", "structured_log", "verified", "verified", "live", "projection_visible", "Projection materializes without inventing truth."),
        make_hop("trace_patient_live_settled", 7, "ui_visibility_receipt", "patient-web", "ui.transition.projection_seen", "ui_visibility_receipt", "verified", "verified", "live", "projection_visible", "UI visibility receipt captures what the user actually saw."),
        make_hop("trace_patient_live_settled", 8, "audit", "audit-ledger", "audit.correlation.bound", "audit", "verified", "verified", "settled", "settled", "Audit joins the same edge correlation chain before settlement is calm."),
    ]
    support_hops = [
        make_hop("trace_support_restore_visible", 1, "browser", "support-workspace", "ui.restore.applied", "ui_event", "verified", "verified", "restored", "accepted", "Support restore resumes from a prior continuity frame."),
        make_hop("trace_support_restore_visible", 2, "gateway", "api-gateway", "gateway.request.accepted", "structured_log", "verified", "masked", "restored", "accepted", "Gateway preserves the restored frame rather than minting a new trace."),
        make_hop("trace_support_restore_visible", 3, "command_handler", "command-api", "command.accepted", "structured_log", "verified", "masked", "restored", "accepted", "Restore-safe command replay stays PHI-light."),
        make_hop("trace_support_restore_visible", 4, "event_bus", "event-spine", "event_spine.publish.latency_ms", "metric", "verified", "verified", "restored", "accepted", "Replay-safe publication still carries the same edgeCorrelationId."),
        make_hop("trace_support_restore_visible", 5, "worker", "projection-worker", "projection.worker.applied", "structured_log", "verified", "verified", "restored", "projection_visible", "Worker observes restored-not-fresh posture."),
        make_hop("trace_support_restore_visible", 6, "projection", "projection-store", "projection.materialized", "structured_log", "verified", "verified", "restored", "projection_visible", "Projection marks restored continuity explicitly."),
        make_hop("trace_support_restore_visible", 7, "ui_visibility_receipt", "support-workspace", "ui.transition.projection_seen", "ui_visibility_receipt", "verified", "verified", "restored", "projection_visible", "UI receipt proves the replay result became visible."),
        make_hop("trace_support_restore_visible", 8, "audit", "audit-ledger", "audit.correlation.bound", "audit", "verified", "verified", "restored", "settled", "Audit records support replay continuity."),
    ]
    missing_hops = [
        make_hop("trace_ops_missing_correlation", 1, "browser", "ops-console", "ui.transition.server_accepted", "ui_event", "verified", "verified", "live", "accepted", "Operator action starts as normal."),
        make_hop("trace_ops_missing_correlation", 2, "gateway", "api-gateway", "gateway.request.accepted", "structured_log", "verified", "verified", "live", "accepted", "Ingress captures the request."),
        make_hop("trace_ops_missing_correlation", 3, "command_handler", "command-api", "command.accepted", "structured_log", "verified", "verified", "live", "accepted", "Command ingress accepts with a valid chain."),
        make_hop("trace_ops_missing_correlation", 4, "event_bus", "event-spine", "event_spine.publish.latency_ms", "metric", "missing", "verified", "live", "blocked", "The event bus sees a missing propagated context and blocks the chain."),
        make_hop("trace_ops_missing_correlation", 5, "worker", "projection-worker", "projection.worker.applied", "structured_log", "missing", "verified", "live", "blocked", "Downstream worker remains blocked because continuity is no longer provable."),
        make_hop("trace_ops_missing_correlation", 6, "audit", "audit-ledger", "audit.correlation.bound", "audit", "missing", "verified", "live", "blocked", "Audit stores the refusal, not a fake successful settlement."),
    ]
    blocked_hops = [
        make_hop("trace_governance_blocked_disclosure", 1, "browser", "governance-console", "ui.freshness.stale_visible", "ui_event", "verified", "verified", "stale", "accepted", "Governance surface is already stale-aware."),
        make_hop("trace_governance_blocked_disclosure", 2, "gateway", "api-gateway", "gateway.request.accepted", "structured_log", "verified", "verified", "stale", "accepted", "Ingress remains correlated."),
        make_hop("trace_governance_blocked_disclosure", 3, "command_handler", "command-api", "command.accepted", "structured_log", "verified", "verified", "stale", "accepted", "Command ingress still has valid correlation."),
        make_hop("trace_governance_blocked_disclosure", 4, "event_bus", "event-spine", "event_spine.publish.latency_ms", "metric", "verified", "verified", "stale", "accepted", "Event bus remains healthy."),
        make_hop("trace_governance_blocked_disclosure", 5, "worker", "projection-worker", "projection.worker.applied", "structured_log", "verified", "verified", "stale", "projection_visible", "Worker applies projection update."),
        make_hop("trace_governance_blocked_disclosure", 6, "projection", "projection-store", "projection.materialized", "structured_log", "verified", "blocked", "stale", "blocked", "A blocked disclosure fence stops raw PHI from being emitted."),
        make_hop("trace_governance_blocked_disclosure", 7, "ui_visibility_receipt", "governance-console", "ui.disclosure.blocked", "structured_log", "verified", "blocked", "stale", "blocked", "The UI surfaces a blocked-disclosure posture, not calm success."),
        make_hop("trace_governance_blocked_disclosure", 8, "audit", "audit-ledger", "audit.correlation.bound", "audit", "verified", "blocked", "stale", "blocked", "Audit joins the blocked state to the same correlation chain."),
    ]

    return [
        {
            "traceRef": "trace_patient_live_settled",
            "label": "Patient settled continuity chain",
            "environment": "ci-preview",
            "routeFamilyRef": "rf_patient_requests",
            "audienceSurfaceRef": "audsurf_patient_authenticated_portal",
            "correlationState": "verified",
            "disclosureState": "masked",
            "replayState": "settled",
            "settlementState": "settled",
            "traceFamily": "patient_continuity",
            "summary": "One end-to-end settled request chain from browser through audit with PHI-safe telemetry.",
            "hops": patient_hops,
            "disclosureFences": [
                {
                    "stage": "gateway",
                    "state": "masked",
                    "permittedClasses": ["control_plane_safe", "public_descriptor", "phi_reference_only"],
                    "observedClasses": ["control_plane_safe", "phi_reference_only"],
                },
                {
                    "stage": "command_handler",
                    "state": "masked",
                    "permittedClasses": ["control_plane_safe", "phi_reference_only", "masked_route_descriptor"],
                    "observedClasses": ["control_plane_safe", "phi_reference_only"],
                },
                {
                    "stage": "ui_visibility_receipt",
                    "state": "verified",
                    "permittedClasses": ["control_plane_safe", "public_descriptor", "audit_link_only"],
                    "observedClasses": ["control_plane_safe", "public_descriptor", "audit_link_only"],
                },
            ],
            "timeline": [
                {"step": "server_accepted", "state": "accepted"},
                {"step": "projection_seen", "state": "projection_visible"},
                {"step": "settled", "state": "settled"},
            ],
        },
        {
            "traceRef": "trace_support_restore_visible",
            "label": "Support restore replay chain",
            "environment": "integration",
            "routeFamilyRef": "rf_support_replay_observe",
            "audienceSurfaceRef": "audsurf_support_workspace",
            "correlationState": "verified",
            "disclosureState": "masked",
            "replayState": "restored",
            "settlementState": "settled",
            "traceFamily": "support_restore",
            "summary": "Replay-safe support restore with a visible continuity receipt and replay-aware audit link.",
            "hops": support_hops,
            "disclosureFences": [
                {
                    "stage": "gateway",
                    "state": "masked",
                    "permittedClasses": ["control_plane_safe", "public_descriptor", "phi_reference_only"],
                    "observedClasses": ["control_plane_safe", "phi_reference_only"],
                },
                {
                    "stage": "ui_visibility_receipt",
                    "state": "verified",
                    "permittedClasses": ["control_plane_safe", "public_descriptor", "audit_link_only"],
                    "observedClasses": ["control_plane_safe", "public_descriptor", "audit_link_only"],
                },
            ],
            "timeline": [
                {"step": "restore_started", "state": "accepted"},
                {"step": "projection_seen", "state": "projection_visible"},
                {"step": "restored_visible", "state": "settled"},
            ],
        },
        {
            "traceRef": "trace_ops_missing_correlation",
            "label": "Ops missing-correlation guard",
            "environment": "local",
            "routeFamilyRef": "rf_operations_board",
            "audienceSurfaceRef": "audsurf_ops_console",
            "correlationState": "missing",
            "disclosureState": "verified",
            "replayState": "live",
            "settlementState": "blocked",
            "traceFamily": "ops_guardrail",
            "summary": "Missing propagation is surfaced as a blocked chain rather than silently generating a new correlation ID.",
            "hops": missing_hops,
            "disclosureFences": [
                {
                    "stage": "event_bus",
                    "state": "verified",
                    "permittedClasses": ["control_plane_safe"],
                    "observedClasses": ["control_plane_safe"],
                }
            ],
            "timeline": [
                {"step": "server_accepted", "state": "accepted"},
                {"step": "correlation_missing", "state": "blocked"},
                {"step": "audit_recorded", "state": "blocked"},
            ],
        },
        {
            "traceRef": "trace_governance_blocked_disclosure",
            "label": "Governance blocked-disclosure chain",
            "environment": "preprod",
            "routeFamilyRef": "rf_governance_shell",
            "audienceSurfaceRef": "audsurf_governance_console",
            "correlationState": "verified",
            "disclosureState": "blocked",
            "replayState": "stale",
            "settlementState": "blocked",
            "traceFamily": "governance_disclosure",
            "summary": "Disclosure fencing stops raw PHI emission while preserving the same correlation chain and explicit blocked posture.",
            "hops": blocked_hops,
            "disclosureFences": [
                {
                    "stage": "projection",
                    "state": "blocked",
                    "permittedClasses": ["control_plane_safe", "audit_link_only"],
                    "observedClasses": ["blocked_raw_phi", "audit_link_only"],
                },
                {
                    "stage": "ui_visibility_receipt",
                    "state": "blocked",
                    "permittedClasses": ["control_plane_safe", "audit_link_only"],
                    "observedClasses": ["blocked_raw_phi", "audit_link_only"],
                },
            ],
            "timeline": [
                {"step": "stale_visible", "state": "accepted"},
                {"step": "disclosure_blocked", "state": "blocked"},
                {"step": "audit_recorded", "state": "blocked"},
            ],
        },
    ]


def write_json(path: Path, payload: Any) -> None:
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def write_csv(path: Path, rows: list[dict[str, Any]], fieldnames: list[str]) -> None:
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


def main() -> None:
    runtime_topology = read_json(RUNTIME_TOPOLOGY_PATH)
    gateway_manifest = read_json(GATEWAY_SURFACE_PATH)
    api_registry = read_json(API_REGISTRY_PATH)
    live_transport = read_json(LIVE_TRANSPORT_PATH)
    cache_manifest = read_json(CACHE_NAMESPACE_PATH)
    event_broker = read_json(EVENT_BROKER_PATH)
    preview_manifest = read_json(PREVIEW_MANIFEST_PATH)
    preview_seed = read_json(PREVIEW_SEED_PATH)
    supply_chain = read_json(SUPPLY_CHAIN_PATH)
    audit_disclosure_rows = read_csv(AUDIT_DISCLOSURE_PATH)

    trace_runs = build_trace_runs()
    correlation_rows: list[dict[str, Any]] = []
    for trace in trace_runs:
        for hop in trace["hops"]:
            correlation_rows.append(
                {
                    "traceRef": trace["traceRef"],
                    "environment": trace["environment"],
                    "routeFamilyRef": trace["routeFamilyRef"],
                    "audienceSurfaceRef": trace["audienceSurfaceRef"],
                    "traceFamily": trace["traceFamily"],
                    "traceCorrelationState": trace["correlationState"],
                    "traceDisclosureState": trace["disclosureState"],
                    "traceReplayState": trace["replayState"],
                    "hopSequence": hop["hopSequence"],
                    "hopKind": hop["hopKind"],
                    "serviceRef": hop["serviceRef"],
                    "eventName": hop["eventName"],
                    "eventFamily": hop["eventFamily"],
                    "correlationState": hop["correlationState"],
                    "disclosureState": hop["disclosureState"],
                    "replayState": hop["replayState"],
                    "settlementState": hop["settlementState"],
                    "note": hop["note"],
                }
            )

    manifest = {
        "task_id": TASK_ID,
        "generated_at": GENERATED_AT,
        "captured_on": CAPTURED_ON,
        "visual_mode": VISUAL_MODE,
        "mission": "Publish the authoritative edge-correlation spine, PHI-safe telemetry schema, and replay-safe UI causality substrate for all Phase 0 runtime and browser surfaces.",
        "source_precedence": SOURCE_PRECEDENCE,
        "upstream_inputs": {
            "runtime_workload_instance_count": runtime_topology["summary"]["runtime_workload_instance_count"],
            "gateway_surface_count": gateway_manifest["summary"]["gateway_surface_count"],
            "live_channel_count": live_transport["summary"]["live_channel_count"],
            "cache_namespace_count": cache_manifest["summary"]["cache_namespace_count"],
            "queue_group_count": event_broker["summary"]["queue_group_count"],
            "preview_environment_count": preview_manifest["summary"]["preview_environment_count"],
            "preview_seed_pack_count": preview_seed["summary"]["seed_pack_count"],
            "supply_chain_stage_count": len(supply_chain["pipeline_stage_chain"]),
            "audit_disclosure_row_count": len(audit_disclosure_rows),
            "api_registry_digest_record_count": api_registry["summary"]["digest_record_count"],
        },
        "summary": {
            "event_schema_count": len(SCHEMA_DEFINITIONS),
            "trace_run_count": len(trace_runs),
            "correlation_hop_row_count": len(correlation_rows),
            "hop_kind_count": len({row["hopKind"] for row in correlation_rows}),
            "policy_rule_count": len(POLICY_RULES),
            "masked_trace_count": sum(1 for trace in trace_runs if trace["disclosureState"] == "masked"),
            "blocked_trace_count": sum(1 for trace in trace_runs if trace["disclosureState"] == "blocked"),
            "missing_correlation_trace_count": sum(1 for trace in trace_runs if trace["correlationState"] == "missing"),
            "settled_trace_count": sum(1 for trace in trace_runs if trace["settlementState"] == "settled"),
            "live_channel_count": live_transport["summary"]["live_channel_count"],
            "preview_environment_count": preview_manifest["summary"]["preview_environment_count"],
        },
        "follow_on_dependencies": [
            "FOLLOW_ON_DEPENDENCY_094_RUNTIME_PUBLICATION_BUNDLE_PENDING",
            "FOLLOW_ON_DEPENDENCY_097_WAVE_OBSERVATION_POLICY_PENDING",
            "FOLLOW_ON_DEPENDENCY_102_NON_PRODUCTION_CANARY_PENDING",
        ],
        "event_schemas": SCHEMA_DEFINITIONS,
        "trace_runs": trace_runs,
    }

    policy = {
        "task_id": TASK_ID,
        "generated_at": GENERATED_AT,
        "captured_on": CAPTURED_ON,
        "visual_mode": VISUAL_MODE,
        "mission": "Define the typed PHI-safe telemetry disclosure classes, fail-closed redaction handling, and permitted family bindings for the edge-correlation spine.",
        "summary": {
            "rule_count": len(POLICY_RULES),
            "blocked_class_count": 1,
            "masked_class_count": 3,
            "permitted_event_family_count": 6,
        },
        "rules": POLICY_RULES,
        "event_family_policies": [
            {
                "eventFamily": "structured_log",
                "permittedClasses": [
                    "control_plane_safe",
                    "public_descriptor",
                    "phi_reference_only",
                    "masked_contact_descriptor",
                    "masked_route_descriptor",
                    "audit_link_only",
                ],
                "failureState": "blocked",
            },
            {
                "eventFamily": "metric",
                "permittedClasses": ["control_plane_safe"],
                "failureState": "blocked",
            },
            {
                "eventFamily": "trace_span",
                "permittedClasses": ["control_plane_safe", "public_descriptor"],
                "failureState": "blocked",
            },
            {
                "eventFamily": "ui_event",
                "permittedClasses": ["control_plane_safe", "public_descriptor"],
                "failureState": "blocked",
            },
            {
                "eventFamily": "ui_visibility_receipt",
                "permittedClasses": ["control_plane_safe", "public_descriptor", "audit_link_only"],
                "failureState": "blocked",
            },
            {
                "eventFamily": "audit",
                "permittedClasses": ["control_plane_safe", "audit_link_only"],
                "failureState": "blocked",
            },
        ],
        "bounded_gaps": [
            "FOLLOW_ON_DEPENDENCY_097_WAVE_OBSERVATION_POLICY_PENDING",
            "FOLLOW_ON_DEPENDENCY_094_RUNTIME_PUBLICATION_BUNDLE_PENDING",
        ],
    }

    write_json(OBSERVABILITY_MANIFEST_PATH, manifest)
    write_json(REDACTION_POLICY_PATH, policy)
    write_csv(
        CORRELATION_MATRIX_PATH,
        correlation_rows,
        [
            "traceRef",
            "environment",
            "routeFamilyRef",
            "audienceSurfaceRef",
            "traceFamily",
            "traceCorrelationState",
            "traceDisclosureState",
            "traceReplayState",
            "hopSequence",
            "hopKind",
            "serviceRef",
            "eventName",
            "eventFamily",
            "correlationState",
            "disclosureState",
            "replayState",
            "settlementState",
            "note",
        ],
    )

    runtime_topology["observability_event_schema_manifest_ref"] = (
        "data/analysis/observability_event_schema_manifest.json"
    )
    runtime_topology["correlation_propagation_matrix_ref"] = (
        "data/analysis/correlation_propagation_matrix.csv"
    )
    runtime_topology["telemetry_redaction_policy_ref"] = (
        "data/analysis/telemetry_redaction_policy.json"
    )
    write_json(RUNTIME_TOPOLOGY_PATH, runtime_topology)


if __name__ == "__main__":
    main()
