#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from textwrap import dedent
from typing import Any

from root_script_updates import ROOT_SCRIPT_UPDATES


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"
TESTS_DIR = ROOT / "tests" / "playwright"
INFRA_DIR = ROOT / "infra" / "event-spine"
DOMAIN_KERNEL_INDEX_PATH = ROOT / "packages" / "domain-kernel" / "src" / "index.ts"
ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = TESTS_DIR / "package.json"
RUNTIME_TOPOLOGY_PATH = DATA_DIR / "runtime_topology_manifest.json"
EVENT_REGISTRY_PATH = DATA_DIR / "canonical_event_contracts.json"
DEGRADATION_PROFILES_PATH = DATA_DIR / "dependency_degradation_profiles.json"

BROKER_MANIFEST_PATH = DATA_DIR / "event_broker_topology_manifest.json"
POLICY_MATRIX_PATH = DATA_DIR / "outbox_inbox_policy_matrix.csv"
TRANSPORT_MAPPING_PATH = DATA_DIR / "canonical_event_to_transport_mapping.json"

DESIGN_DOC_PATH = DOCS_DIR / "87_event_spine_and_queueing_design.md"
RULES_DOC_PATH = DOCS_DIR / "87_outbox_inbox_ordering_and_correlation_rules.md"
ATLAS_PATH = DOCS_DIR / "87_event_spine_topology_atlas.html"
SPEC_PATH = TESTS_DIR / "event-spine-topology-atlas.spec.js"

README_PATH = INFRA_DIR / "README.md"
TERRAFORM_MAIN_PATH = INFRA_DIR / "terraform" / "main.tf"
TERRAFORM_VARIABLES_PATH = INFRA_DIR / "terraform" / "variables.tf"
TERRAFORM_OUTPUTS_PATH = INFRA_DIR / "terraform" / "outputs.tf"
BROKER_MODULE_MAIN_PATH = (
    INFRA_DIR / "terraform" / "modules" / "broker_namespace" / "main.tf"
)
BROKER_MODULE_VARIABLES_PATH = (
    INFRA_DIR / "terraform" / "modules" / "broker_namespace" / "variables.tf"
)
BROKER_MODULE_OUTPUTS_PATH = (
    INFRA_DIR / "terraform" / "modules" / "broker_namespace" / "outputs.tf"
)
SUBSCRIPTION_MODULE_MAIN_PATH = (
    INFRA_DIR / "terraform" / "modules" / "subscription_group" / "main.tf"
)
SUBSCRIPTION_MODULE_VARIABLES_PATH = (
    INFRA_DIR / "terraform" / "modules" / "subscription_group" / "variables.tf"
)
SUBSCRIPTION_MODULE_OUTPUTS_PATH = (
    INFRA_DIR / "terraform" / "modules" / "subscription_group" / "outputs.tf"
)

ENVIRONMENT_FILE_PATHS = {
    "local": INFRA_DIR / "environments" / "local.auto.tfvars.json",
    "ci-preview": INFRA_DIR / "environments" / "ci-preview.auto.tfvars.json",
    "integration": INFRA_DIR / "environments" / "integration.auto.tfvars.json",
    "preprod": INFRA_DIR / "environments" / "preprod.auto.tfvars.json",
    "production": INFRA_DIR / "environments" / "production.auto.tfvars.json",
}

LOCAL_COMPOSE_PATH = INFRA_DIR / "local" / "event-spine-emulator.compose.yaml"
LOCAL_POLICY_PATH = INFRA_DIR / "local" / "broker-access-policy.json"
LOCAL_BOOTSTRAP_PATH = INFRA_DIR / "local" / "bootstrap-event-spine.mjs"
LOCAL_RESET_PATH = INFRA_DIR / "local" / "reset-event-spine.mjs"
SMOKE_TEST_PATH = INFRA_DIR / "tests" / "event-spine-smoke.test.mjs"

TASK_ID = "par_087"
VISUAL_MODE = "Event_Spine_Topology_Atlas"
GENERATED_AT = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
CAPTURED_ON = GENERATED_AT[:10]

QUEUE_GROUPS = [
    {
        "queueRef": "q_event_projection_live",
        "displayName": "Projection live apply",
        "queueClass": "projection_live",
        "consumerGroupRef": "cg_projection_live",
        "retryPosture": "checkpoint_resume",
        "dlqRef": "dlq_projection_live",
        "orderingMode": "namespace_partition_ordered",
        "workloadFamilyRefs": ["wf_projection_read_models"],
        "notes": "Live projection consumers replay from immutable canonical events only.",
    },
    {
        "queueRef": "q_event_projection_replay",
        "displayName": "Projection replay and rebuild",
        "queueClass": "projection_replay",
        "consumerGroupRef": "cg_projection_replay",
        "retryPosture": "resume_from_checkpoint_only",
        "dlqRef": "dlq_projection_replay",
        "orderingMode": "stream_position_strict",
        "workloadFamilyRefs": ["wf_projection_read_models"],
        "notes": "Cold rebuild and dry-run replay stay separate from live projection apply.",
    },
    {
        "queueRef": "q_event_integration_effects",
        "displayName": "Integration effect dispatch",
        "queueClass": "integration_effect_dispatch",
        "consumerGroupRef": "cg_integration_dispatch",
        "retryPosture": "dependency_profile_bound_retry",
        "dlqRef": "dlq_integration_effects",
        "orderingMode": "effect_scope_ordered",
        "workloadFamilyRefs": ["wf_integration_dispatch"],
        "notes": "External effects publish only after durable outbox checkpoint and effect-key reservation.",
    },
    {
        "queueRef": "q_event_notification_effects",
        "displayName": "Notification delivery and resend",
        "queueClass": "notification_dispatch",
        "consumerGroupRef": "cg_notification_dispatch",
        "retryPosture": "delivery_receipt_window",
        "dlqRef": "dlq_notification_effects",
        "orderingMode": "recipient_and_route_scope",
        "workloadFamilyRefs": ["wf_integration_dispatch"],
        "notes": "Delivery posture preserves receipt ambiguity and callback repair without silent resend loops.",
    },
    {
        "queueRef": "q_event_callback_correlation",
        "displayName": "Callback correlation and receipt checkpoints",
        "queueClass": "callback_checkpoint",
        "consumerGroupRef": "cg_callback_receipt_ingest",
        "retryPosture": "correlation_checkpoint_retry",
        "dlqRef": "dlq_callback_correlation",
        "orderingMode": "callback_correlation_window",
        "workloadFamilyRefs": ["wf_integration_dispatch", "wf_command_orchestration"],
        "notes": "Provider callbacks bind to explicit correlation keys and ordered receipt windows.",
    },
    {
        "queueRef": "q_event_assurance_audit",
        "displayName": "Assurance observation",
        "queueClass": "assurance_observe",
        "consumerGroupRef": "cg_assurance_observe",
        "retryPosture": "audit_append_then_alert",
        "dlqRef": "dlq_assurance_audit",
        "orderingMode": "causal_token_observe",
        "workloadFamilyRefs": ["wf_assurance_security_control"],
        "notes": "Assurance slices observe the same canonical events without shadow audit traffic.",
    },
    {
        "queueRef": "q_event_replay_quarantine",
        "displayName": "Replay quarantine and manual review",
        "queueClass": "replay_quarantine",
        "consumerGroupRef": "cg_replay_quarantine_review",
        "retryPosture": "manual_resume_only",
        "dlqRef": "dlq_replay_quarantine",
        "orderingMode": "identity_preserving_quarantine",
        "workloadFamilyRefs": ["wf_assurance_security_control", "wf_command_orchestration"],
        "notes": "Identity-preserving quarantine routes hold canonical events for governed replay review.",
    },
]

QUEUE_ORDER = [row["queueRef"] for row in QUEUE_GROUPS]
QUEUE_GROUP_BY_REF = {row["queueRef"]: row for row in QUEUE_GROUPS}

MISSION = (
    "Provision the canonical event spine, queueing substrate, and durable outbox and inbox "
    "infrastructure for Vecells so canonical events map to concrete broker topology, explicit "
    "retry and DLQ posture, and replay-safe command and callback checkpoints."
)

SOURCE_PRECEDENCE = [
    "prompt/087.md",
    "prompt/shared_operating_contract_086_to_095.md",
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "data/analysis/canonical_event_contracts.json",
    "data/analysis/dependency_degradation_profiles.json",
    "data/analysis/runtime_topology_manifest.json",
    "data/analysis/projection_checkpoint_manifest.json",
    "data/analysis/simulator_contract_manifest.json",
    "docs/architecture/13_outbox_inbox_callback_replay_and_idempotency.md",
    "docs/architecture/82_projection_rebuild_and_event_applier_design.md",
    "docs/architecture/83_simulator_backplane_design.md",
    "docs/architecture/84_runtime_topology_and_trust_boundary_realization.md",
    "docs/architecture/85_domain_transaction_store_and_fhir_storage_design.md",
    "docs/architecture/86_object_storage_and_retention_design.md",
    "blueprint/phase-0-the-foundation-protocol.md#CanonicalEventContract",
    "blueprint/phase-0-the-foundation-protocol.md#CanonicalEventEnvelope",
    "blueprint/platform-runtime-and-release-blueprint.md#Runtime topology contract",
    "blueprint/platform-runtime-and-release-blueprint.md#DependencyDegradationProfile",
    "blueprint/forensic-audit-findings.md#Finding-61",
    "blueprint/forensic-audit-findings.md#Finding-62",
    "blueprint/forensic-audit-findings.md#Finding-63",
    "blueprint/forensic-audit-findings.md#Finding-66",
    "blueprint/forensic-audit-findings.md#Finding-67",
    "blueprint/forensic-audit-findings.md#Finding-68",
    "blueprint/forensic-audit-findings.md#Finding-81",
    "blueprint/forensic-audit-findings.md#Finding-82",
    "blueprint/forensic-audit-findings.md#Finding-83",
    "blueprint/forensic-audit-findings.md#Finding-84",
]

ASSUMPTIONS = [
    {
        "assumption_ref": "ASSUMPTION_087_NATS_JETSTREAM_COMPATIBLE_LOCAL_EMULATION",
        "value": "nats_jetstream_compatible_local_broker",
        "reason": (
            "The mock-now path needs durable streams, queue groups, and replay-safe consumers "
            "without requiring a live managed broker during local or CI runs."
        ),
    },
    {
        "assumption_ref": "ASSUMPTION_087_EVENT_NAME_IS_CANONICAL_SUBJECT",
        "value": "transport_subject_equals_event_name",
        "reason": (
            "Canonical event names remain canonical; the broker may group them by namespace stream "
            "but may not invent transport aliases."
        ),
    },
]

FOLLOW_ON_DEPENDENCIES = [
    {
        "dependency_ref": "FOLLOW_ON_DEPENDENCY_088_CACHE_LIVE_UPDATE_OVERLAYS",
        "owning_task_ref": "par_088",
        "scope": "Cache invalidation and live-update fan-out overlays consume the same event spine later.",
    },
    {
        "dependency_ref": "FOLLOW_ON_DEPENDENCY_093_CORRELATION_AND_OBSERVABILITY_EXPORT",
        "owning_task_ref": "par_093",
        "scope": "Distributed tracing and correlation telemetry may extend these checkpoints but not change queue law.",
    },
    {
        "dependency_ref": "FOLLOW_ON_DEPENDENCY_095_MIGRATION_AND_BACKFILL_EXECUTION",
        "owning_task_ref": "par_095",
        "scope": "Migration and projection backfill runners consume the published replay queue and checkpoint manifests.",
    },
]

HTML_MARKERS = [
    'data-testid="river-diagram"',
    'data-testid="queue-chart"',
    'data-testid="trace-strip"',
    'data-testid="topology-table"',
    'data-testid="checkpoint-table"',
    'data-testid="inspector"',
]

POLICY_ROWS_SEED = [
    {
        "policy_ref": "OP_087_COMMAND_CANONICAL_OUTBOX",
        "component_kind": "outbox",
        "component_ref": "service_command_api",
        "queue_ref": "q_event_integration_effects",
        "consumer_group_ref": "cg_integration_dispatch",
        "ordering_scope": "tenantId|requestLineageRef",
        "dedupe_formula": "effectKey",
        "effect_key_formula": "actionRecordRef|queueRef|governingObjectRef|causalToken",
        "correlation_formula": "edgeCorrelationId|causalToken",
        "checkpoint_rule": "publish only after durable command checkpoint",
        "retry_policy_ref": "capture_evidence_then_stop",
        "dlq_ref": "dlq_integration_effects",
        "degradation_profile_code": "dep_nhs_login_rail",
        "replay_posture": "return_existing_or_resume",
        "notes": "Command ingress may not publish directly from browser or route handlers.",
    },
    {
        "policy_ref": "OP_087_CONFIRMATION_GATE_OUTBOX",
        "component_kind": "outbox",
        "component_ref": "service_command_api",
        "queue_ref": "q_event_callback_correlation",
        "consumer_group_ref": "cg_callback_receipt_ingest",
        "ordering_scope": "tenantId|confirmationGateRef",
        "dedupe_formula": "effectKey",
        "effect_key_formula": "confirmationGateRef|queueRef|causalToken",
        "correlation_formula": "edgeCorrelationId|callbackCorrelationKey",
        "checkpoint_rule": "hold publication until confirmation gate write settles",
        "retry_policy_ref": "resume_from_checkpoint_only",
        "dlq_ref": "dlq_callback_correlation",
        "degradation_profile_code": "dep_telephony_ivr_recording_provider",
        "replay_posture": "resume_same_gate_chain",
        "notes": "Callback checkpoints keep gate and receipt ordering explicit.",
    },
    {
        "policy_ref": "OP_087_COMMUNICATION_DELIVERY_OUTBOX",
        "component_kind": "outbox",
        "component_ref": "service_notification_worker",
        "queue_ref": "q_event_notification_effects",
        "consumer_group_ref": "cg_notification_dispatch",
        "ordering_scope": "tenantId|communicationChainRef",
        "dedupe_formula": "effectKey",
        "effect_key_formula": "communicationChainRef|recipientRef|queueRef|intentGeneration",
        "correlation_formula": "edgeCorrelationId|deliveryReceiptRef",
        "checkpoint_rule": "delivery effects dispatch only from outbox checkpoints",
        "retry_policy_ref": "never_auto_repeat",
        "dlq_ref": "dlq_notification_effects",
        "degradation_profile_code": "dep_email_notification_provider",
        "replay_posture": "resume_or_manual_reissue",
        "notes": "Notification dispatch preserves receipt ambiguity and resend fences.",
    },
    {
        "policy_ref": "OP_087_REACHABILITY_EFFECT_OUTBOX",
        "component_kind": "outbox",
        "component_ref": "service_adapter_simulators",
        "queue_ref": "q_event_callback_correlation",
        "consumer_group_ref": "cg_callback_receipt_ingest",
        "ordering_scope": "tenantId|dependencyRef",
        "dedupe_formula": "effectKey",
        "effect_key_formula": "dependencyRef|queueRef|causalToken",
        "correlation_formula": "edgeCorrelationId|dependencyRef|callbackCorrelationKey",
        "checkpoint_rule": "callback effects publish only after attempt ledger append",
        "retry_policy_ref": "resume_from_checkpoint_only",
        "dlq_ref": "dlq_callback_correlation",
        "degradation_profile_code": "dep_telephony_ivr_recording_provider",
        "replay_posture": "gap_review_then_resume",
        "notes": "Reachability repairs stay on the same ordered callback chain.",
    },
    {
        "policy_ref": "OP_087_ASSURANCE_REVIEW_OUTBOX",
        "component_kind": "outbox",
        "component_ref": "service_command_api",
        "queue_ref": "q_event_assurance_audit",
        "consumer_group_ref": "cg_assurance_observe",
        "ordering_scope": "tenantId|causalToken",
        "dedupe_formula": "effectKey",
        "effect_key_formula": "queueRef|eventName|causalToken",
        "correlation_formula": "edgeCorrelationId|causalToken",
        "checkpoint_rule": "assurance append is mandatory before release of manual review notices",
        "retry_policy_ref": "audit_append_then_alert",
        "dlq_ref": "dlq_assurance_audit",
        "degradation_profile_code": "dep_pds_fhir_enrichment",
        "replay_posture": "append_only",
        "notes": "Assurance observation uses the same canonical envelope and effect key chain.",
    },
    {
        "policy_ref": "OP_087_REPLAY_QUARANTINE_OUTBOX",
        "component_kind": "outbox",
        "component_ref": "service_command_api",
        "queue_ref": "q_event_replay_quarantine",
        "consumer_group_ref": "cg_replay_quarantine_review",
        "ordering_scope": "tenantId|eventName|causalToken",
        "dedupe_formula": "effectKey",
        "effect_key_formula": "queueRef|eventName|edgeCorrelationId|causalToken",
        "correlation_formula": "edgeCorrelationId|causalToken|effectKey",
        "checkpoint_rule": "quarantine keeps canonical identity and settlement linkage intact",
        "retry_policy_ref": "manual_resume_only",
        "dlq_ref": "dlq_replay_quarantine",
        "degradation_profile_code": "dep_sms_notification_provider",
        "replay_posture": "manual_review_required",
        "notes": "Safety and replay disputes may not flatten into anonymous dead letters.",
    },
    {
        "policy_ref": "IP_087_PROJECTION_LIVE_INBOX",
        "component_kind": "inbox",
        "component_ref": "service_projection_worker",
        "queue_ref": "q_event_projection_live",
        "consumer_group_ref": "cg_projection_live",
        "ordering_scope": "tenantId|namespaceStream",
        "dedupe_formula": "consumerGroupRef|eventId|queueRef",
        "effect_key_formula": "eventId|queueRef|causalToken",
        "correlation_formula": "edgeCorrelationId|causalToken",
        "checkpoint_rule": "checkpoint every accepted apply and fail closed on gaps",
        "retry_policy_ref": "checkpoint_resume",
        "dlq_ref": "dlq_projection_live",
        "degradation_profile_code": "dep_transcription_processing_provider",
        "replay_posture": "exact_sequence_resume",
        "notes": "Live projections may never skip or reorder canonical stream positions.",
    },
    {
        "policy_ref": "IP_087_PROJECTION_REPLAY_INBOX",
        "component_kind": "inbox",
        "component_ref": "service_projection_worker",
        "queue_ref": "q_event_projection_replay",
        "consumer_group_ref": "cg_projection_replay",
        "ordering_scope": "tenantId|namespaceStream",
        "dedupe_formula": "consumerGroupRef|eventId|queueRef",
        "effect_key_formula": "eventId|queueRef|causalToken",
        "correlation_formula": "edgeCorrelationId|causalToken",
        "checkpoint_rule": "checkpoint per replay cursor and preserve dry-run compare tokens",
        "retry_policy_ref": "resume_from_checkpoint_only",
        "dlq_ref": "dlq_projection_replay",
        "degradation_profile_code": "dep_transcription_processing_provider",
        "replay_posture": "deterministic_rebuild_resume",
        "notes": "Replay workers reuse immutable events and never derive from read models.",
    },
    {
        "policy_ref": "IP_087_CALLBACK_RECEIPT_INBOX",
        "component_kind": "inbox",
        "component_ref": "service_notification_worker",
        "queue_ref": "q_event_callback_correlation",
        "consumer_group_ref": "cg_callback_receipt_ingest",
        "ordering_scope": "tenantId|callbackCorrelationKey",
        "dedupe_formula": "consumerGroupRef|eventId|queueRef",
        "effect_key_formula": "eventId|callbackCorrelationKey|queueRef",
        "correlation_formula": "edgeCorrelationId|callbackCorrelationKey|causalToken",
        "checkpoint_rule": "accept exact next receipt only and open replay review on gaps",
        "retry_policy_ref": "correlation_checkpoint_retry",
        "dlq_ref": "dlq_callback_correlation",
        "degradation_profile_code": "dep_telephony_ivr_recording_provider",
        "replay_posture": "receipt_window_enforced",
        "notes": "Callback consumers use explicit correlation keys and receipt windows.",
    },
    {
        "policy_ref": "IP_087_NOTIFICATION_RECEIPT_INBOX",
        "component_kind": "inbox",
        "component_ref": "service_notification_worker",
        "queue_ref": "q_event_notification_effects",
        "consumer_group_ref": "cg_notification_dispatch",
        "ordering_scope": "tenantId|recipientRef|routeFamilyRef",
        "dedupe_formula": "consumerGroupRef|eventId|queueRef",
        "effect_key_formula": "eventId|recipientRef|queueRef",
        "correlation_formula": "edgeCorrelationId|causalToken|deliveryReceiptRef",
        "checkpoint_rule": "duplicate deliveries return existing settlement chain",
        "retry_policy_ref": "delivery_receipt_window",
        "dlq_ref": "dlq_notification_effects",
        "degradation_profile_code": "dep_email_notification_provider",
        "replay_posture": "dedupe_then_manual_reissue",
        "notes": "Delivery receipts may not widen into silent repeat sends.",
    },
    {
        "policy_ref": "IP_087_ASSURANCE_OBSERVER_INBOX",
        "component_kind": "inbox",
        "component_ref": "service_command_api",
        "queue_ref": "q_event_assurance_audit",
        "consumer_group_ref": "cg_assurance_observe",
        "ordering_scope": "tenantId|causalToken",
        "dedupe_formula": "consumerGroupRef|eventId|queueRef",
        "effect_key_formula": "eventId|queueRef|causalToken",
        "correlation_formula": "edgeCorrelationId|causalToken",
        "checkpoint_rule": "assurance observers append or alert and never drop identity",
        "retry_policy_ref": "audit_append_then_alert",
        "dlq_ref": "dlq_assurance_audit",
        "degradation_profile_code": "dep_nhs_login_rail",
        "replay_posture": "append_only",
        "notes": "Audit consumers preserve event identity and settlement chain refs.",
    },
    {
        "policy_ref": "IP_087_REPLAY_QUARANTINE_INBOX",
        "component_kind": "inbox",
        "component_ref": "service_command_api",
        "queue_ref": "q_event_replay_quarantine",
        "consumer_group_ref": "cg_replay_quarantine_review",
        "ordering_scope": "tenantId|eventName|causalToken",
        "dedupe_formula": "consumerGroupRef|eventId|queueRef",
        "effect_key_formula": "eventId|queueRef|causalToken",
        "correlation_formula": "edgeCorrelationId|causalToken|effectKey",
        "checkpoint_rule": "quarantine opens replay review before any second effect can occur",
        "retry_policy_ref": "manual_resume_only",
        "dlq_ref": "dlq_replay_quarantine",
        "degradation_profile_code": "dep_sms_notification_provider",
        "replay_posture": "manual_reconcile_then_resume",
        "notes": "Replay quarantine remains canonical identity preserving and review driven.",
    },
]


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n", encoding="utf-8")


def write_csv(path: Path, rows: list[dict[str, Any]]) -> None:
    if not rows:
        raise SystemExit(f"Cannot write empty CSV to {path}")
    path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames: list[str] = []
    for row in rows:
        for key in row:
            if key not in fieldnames:
                fieldnames.append(key)
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def stable_stringify(value: Any) -> str:
    if value is None or not isinstance(value, (dict, list)):
        return json.dumps(value, sort_keys=True)
    if isinstance(value, list):
        return "[" + ",".join(stable_stringify(item) for item in value) + "]"
    return "{" + ",".join(
        f"{json.dumps(key)}:{stable_stringify(value[key])}" for key in sorted(value)
    ) + "}"


def stable_digest(value: Any) -> str:
    text = stable_stringify(value)
    left = 0x811C9DC5 ^ len(text)
    right = 0x9E3779B9 ^ len(text)
    upper = 0xC2B2AE35 ^ len(text)
    lower = 0x27D4EB2F ^ len(text)
    for char in text:
        code = ord(char)
        left = ((left ^ code) * 0x01000193) & 0xFFFFFFFF
        right = ((right ^ code) * 0x85EBCA6B) & 0xFFFFFFFF
        upper = ((upper ^ code) * 0xC2B2AE35) & 0xFFFFFFFF
        lower = ((lower ^ code) * 0x27D4EB2F) & 0xFFFFFFFF
    return "".join(f"{segment:08x}" for segment in (left, right, upper, lower))


def ensure_domain_kernel_export() -> None:
    source = DOMAIN_KERNEL_INDEX_PATH.read_text(encoding="utf-8")
    export_line = 'export * from "./event-spine";'
    if export_line not in source:
        source = source.replace(
            'export function makeFoundationRef(family: string, key: string): FoundationRef {\n  return { family, key };\n}\n\n',
            'export function makeFoundationRef(family: string, key: string): FoundationRef {\n  return { family, key };\n}\n\n'
            + export_line
            + "\n",
        )
        write_text(DOMAIN_KERNEL_INDEX_PATH, source)


def update_root_package() -> None:
    package = load_json(ROOT_PACKAGE_PATH)
    package.setdefault("scripts", {}).update(ROOT_SCRIPT_UPDATES)
    write_json(ROOT_PACKAGE_PATH, package)


def ensure_command(script: str, command: str) -> str:
    return script if command in script else script + " && " + command


def update_playwright_package() -> None:
    package = load_json(PLAYWRIGHT_PACKAGE_PATH)
    description = package.get("description", "").rstrip(".")
    suffix = "event spine topology atlas browser checks"
    if suffix not in description:
        description = (description + ", " + suffix).replace(",,", ",")
    package["description"] = description + "."
    scripts = package.setdefault("scripts", {})
    scripts["build"] = ensure_command(
        scripts["build"], "node --check event-spine-topology-atlas.spec.js"
    )
    scripts["lint"] = ensure_command(scripts["lint"], "eslint event-spine-topology-atlas.spec.js")
    scripts["test"] = ensure_command(scripts["test"], "node event-spine-topology-atlas.spec.js")
    scripts["typecheck"] = ensure_command(
        scripts["typecheck"], "node --check event-spine-topology-atlas.spec.js"
    )
    scripts["e2e"] = ensure_command(
        scripts["e2e"], "node event-spine-topology-atlas.spec.js --run"
    )
    write_json(PLAYWRIGHT_PACKAGE_PATH, package)


def normalize_event_state(contract: dict[str, Any]) -> str:
    if contract["defectState"] != "declared":
        return "watch_or_review"
    if any(
        token in contract["eventName"]
        for token in ("quarantined", "degraded", "review_required", "closure_blockers", "expired", "disputed")
    ):
        return "watch_or_review"
    return "steady"


def queue_refs_for_contract(contract: dict[str, Any]) -> list[str]:
    namespace = contract["namespaceCode"]
    event_name = contract["eventName"]
    refs = ["q_event_projection_live", "q_event_projection_replay", "q_event_assurance_audit"]
    if namespace in {"communication", "telephony", "pharmacy", "confirmation", "reachability", "capacity"} or any(
        token in event_name for token in ("delivery", "dispatch", "confirmation", "callback", "receipt", "reachability")
    ):
        refs.append("q_event_integration_effects")
    if namespace in {"communication", "patient", "support", "access"} or any(
        token in event_name for token in ("delivery", "receipt", "grant", "queued")
    ):
        refs.append("q_event_notification_effects")
    if namespace in {"communication", "telephony", "reachability", "confirmation", "pharmacy"} or any(
        token in event_name for token in ("callback", "receipt", "confirmation", "reachability")
    ):
        refs.append("q_event_callback_correlation")
    if normalize_event_state(contract) == "watch_or_review":
        refs.append("q_event_replay_quarantine")
    return [queue_ref for queue_ref in QUEUE_ORDER if queue_ref in set(refs)]


def outbox_policy_refs_for_contract(contract: dict[str, Any]) -> list[str]:
    event_name = contract["eventName"]
    namespace = contract["namespaceCode"]
    refs = ["OP_087_COMMAND_CANONICAL_OUTBOX"]
    if namespace in {"communication", "telephony"} or "delivery" in event_name:
        refs.append("OP_087_COMMUNICATION_DELIVERY_OUTBOX")
    if namespace in {"reachability"} or "reachability" in event_name:
        refs.append("OP_087_REACHABILITY_EFFECT_OUTBOX")
    if namespace in {"confirmation", "capacity"} or "confirmation" in event_name:
        refs.append("OP_087_CONFIRMATION_GATE_OUTBOX")
    if normalize_event_state(contract) == "watch_or_review":
        refs.append("OP_087_REPLAY_QUARANTINE_OUTBOX")
    refs.append("OP_087_ASSURANCE_REVIEW_OUTBOX")
    return refs


def inbox_policy_refs_for_queues(queue_refs: list[str]) -> list[str]:
    policy_by_queue = {
        "q_event_projection_live": "IP_087_PROJECTION_LIVE_INBOX",
        "q_event_projection_replay": "IP_087_PROJECTION_REPLAY_INBOX",
        "q_event_callback_correlation": "IP_087_CALLBACK_RECEIPT_INBOX",
        "q_event_notification_effects": "IP_087_NOTIFICATION_RECEIPT_INBOX",
        "q_event_assurance_audit": "IP_087_ASSURANCE_OBSERVER_INBOX",
        "q_event_replay_quarantine": "IP_087_REPLAY_QUARANTINE_INBOX",
        "q_event_integration_effects": "IP_087_CALLBACK_RECEIPT_INBOX",
    }
    seen: list[str] = []
    for queue_ref in queue_refs:
        policy_ref = policy_by_queue[queue_ref]
        if policy_ref not in seen:
            seen.append(policy_ref)
    return seen


def build_policy_rows(profile_lookup: dict[str, str]) -> list[dict[str, Any]]:
    rows = []
    for row in POLICY_ROWS_SEED:
        rows.append(
            {
                **row,
                "degradation_profile_ref": profile_lookup[row["degradation_profile_code"]],
                "source_refs": ";".join(
                    [
                        "prompt/087.md",
                        "docs/architecture/13_outbox_inbox_callback_replay_and_idempotency.md",
                        "data/analysis/dependency_degradation_profiles.json",
                    ]
                ),
            }
        )
    return rows


def build_manifests() -> tuple[dict[str, Any], dict[str, Any], list[dict[str, Any]]]:
    event_registry = load_json(EVENT_REGISTRY_PATH)
    degradation_payload = load_json(DEGRADATION_PROFILES_PATH)
    runtime_topology = load_json(RUNTIME_TOPOLOGY_PATH)
    contracts = sorted(
        event_registry["contracts"],
        key=lambda row: (row["namespaceCode"], row["ordinalWithinNamespace"], row["eventName"]),
    )

    namespaces = []
    streams = []
    contracts_by_namespace: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for contract in contracts:
        contracts_by_namespace[contract["namespaceCode"]].append(contract)

    for namespace in sorted(contracts_by_namespace):
        rows = contracts_by_namespace[namespace]
        namespaces.append(
            {
                "namespaceCode": namespace,
                "canonicalEventNamespaceId": rows[0]["namespaceRef"],
                "owningBoundedContextRef": rows[0]["owningBoundedContextRef"],
                "canonicalEventCount": len(rows),
            }
        )
        stream_ref = f"stream_{namespace}"
        consumer_queue_refs = []
        for contract in rows:
            for queue_ref in queue_refs_for_contract(contract):
                if queue_ref not in consumer_queue_refs:
                    consumer_queue_refs.append(queue_ref)
        streams.append(
            {
                "streamRef": stream_ref,
                "streamName": f"vecells.{namespace}.stream",
                "namespaceCode": namespace,
                "canonicalEventCount": len(rows),
                "subjectPattern": f"{namespace}.*",
                "routingRule": "publish subject equals canonical eventName",
                "consumerQueueRefs": consumer_queue_refs,
                "source_refs": [
                    "data/analysis/canonical_event_contracts.json",
                    "prompt/087.md",
                ],
            }
        )

    profile_lookup = {
        row["dependencyCode"]: row["profileId"] for row in degradation_payload["profiles"]
    }
    policy_rows = build_policy_rows(profile_lookup)

    queue_event_counts: dict[str, int] = {row["queueRef"]: 0 for row in QUEUE_GROUPS}
    subscription_counts: dict[tuple[str, str], int] = defaultdict(int)
    transport_mappings = []
    for contract in contracts:
        queue_refs = queue_refs_for_contract(contract)
        consumer_group_refs = [QUEUE_GROUP_BY_REF[queue_ref]["consumerGroupRef"] for queue_ref in queue_refs]
        queue_class_refs = [QUEUE_GROUP_BY_REF[queue_ref]["queueClass"] for queue_ref in queue_refs]
        retry_postures = [QUEUE_GROUP_BY_REF[queue_ref]["retryPosture"] for queue_ref in queue_refs]
        stream_ref = f"stream_{contract['namespaceCode']}"
        for queue_ref in queue_refs:
            queue_event_counts[queue_ref] += 1
            subscription_counts[(stream_ref, queue_ref)] += 1
        transport_mappings.append(
            {
                "canonicalEventContractRef": contract["canonicalEventContractId"],
                "eventName": contract["eventName"],
                "namespaceCode": contract["namespaceCode"],
                "streamRef": stream_ref,
                "streamName": f"vecells.{contract['namespaceCode']}.stream",
                "routingSubject": contract["eventName"],
                "queueRefs": queue_refs,
                "consumerGroupRefs": consumer_group_refs,
                "queueClassRefs": queue_class_refs,
                "retryPostures": retry_postures,
                "eventState": normalize_event_state(contract),
                "defectState": contract["defectState"],
                "outboxPolicyRefs": outbox_policy_refs_for_contract(contract),
                "inboxPolicyRefs": inbox_policy_refs_for_queues(queue_refs),
                "edgeCorrelationRequired": True,
                "causalTokenRequired": True,
                "requiredIdentifierRefs": contract["requiredIdentifierRefs"],
                "source_refs": contract["source_refs"],
            }
        )

    subscription_bindings = []
    for stream in streams:
        for queue_ref in stream["consumerQueueRefs"]:
            queue_group = QUEUE_GROUP_BY_REF[queue_ref]
            subscription_bindings.append(
                {
                    "subscriptionRef": f"sub_{stream['namespaceCode']}_{queue_ref}",
                    "streamRef": stream["streamRef"],
                    "queueRef": queue_ref,
                    "consumerGroupRef": queue_group["consumerGroupRef"],
                    "queueClass": queue_group["queueClass"],
                    "retryPosture": queue_group["retryPosture"],
                    "dlqRef": queue_group["dlqRef"],
                    "matchedEventCount": subscription_counts[(stream["streamRef"], queue_ref)],
                    "acknowledgementRule": "durable_inbox_checkpoint_or_quarantine",
                }
            )

    service_bindings = {
        row["service_identity_ref"]: row for row in runtime_topology["service_runtime_bindings"]
    }
    access_controls = [
        {
            "serviceIdentityRef": "sid_command_api",
            "publishQueueRefs": [
                "q_event_integration_effects",
                "q_event_callback_correlation",
                "q_event_assurance_audit",
                "q_event_replay_quarantine",
            ],
            "consumeQueueRefs": ["q_event_callback_correlation", "q_event_replay_quarantine"],
            "policyMode": "outbox_only_and_no_browser_publish",
            "blockedQueueRefs": ["q_event_projection_live", "q_event_projection_replay"],
        },
        {
            "serviceIdentityRef": "sid_projection_worker",
            "publishQueueRefs": [],
            "consumeQueueRefs": ["q_event_projection_live", "q_event_projection_replay"],
            "policyMode": "inbox_checkpoint_only",
            "blockedQueueRefs": ["q_event_integration_effects", "q_event_notification_effects"],
        },
        {
            "serviceIdentityRef": "sid_integration_dispatch",
            "publishQueueRefs": [
                "q_event_notification_effects",
                "q_event_callback_correlation",
                "q_event_assurance_audit",
            ],
            "consumeQueueRefs": [
                "q_event_integration_effects",
                "q_event_notification_effects",
                "q_event_callback_correlation",
            ],
            "policyMode": "outbox_then_callback_checkpoint",
            "blockedQueueRefs": ["q_event_projection_replay"],
        },
        {
            "serviceIdentityRef": "sid_adapter_simulators",
            "publishQueueRefs": ["q_event_callback_correlation", "q_event_assurance_audit"],
            "consumeQueueRefs": ["q_event_integration_effects", "q_event_notification_effects"],
            "policyMode": "simulator_parity_only",
            "blockedQueueRefs": ["q_event_projection_live", "q_event_projection_replay"],
        },
        {
            "serviceIdentityRef": "sid_assurance_control",
            "publishQueueRefs": [],
            "consumeQueueRefs": ["q_event_assurance_audit", "q_event_replay_quarantine"],
            "policyMode": "observe_and_replay_review",
            "blockedQueueRefs": ["q_event_notification_effects"],
        },
        {
            "serviceIdentityRef": "browser",
            "publishQueueRefs": [],
            "consumeQueueRefs": [],
            "policyMode": "blocked",
            "blockedQueueRefs": QUEUE_ORDER,
        },
    ]

    broker_manifest = {
        "task_id": TASK_ID,
        "generated_at": GENERATED_AT,
        "captured_on": CAPTURED_ON,
        "visual_mode": VISUAL_MODE,
        "mission": MISSION,
        "source_precedence": SOURCE_PRECEDENCE,
        "assumptions": ASSUMPTIONS,
        "follow_on_dependencies": FOLLOW_ON_DEPENDENCIES,
        "canonicalEnvelopeRequirements": [
            "tenantId",
            "eventName",
            "schemaVersionRef",
            "sourceBoundedContextRef",
            "governingBoundedContextRef",
            "edgeCorrelationId",
            "causalToken",
        ],
        "summary": {
            "namespace_count": len(namespaces),
            "stream_count": len(streams),
            "transport_mapping_count": len(transport_mappings),
            "queue_group_count": len(QUEUE_GROUPS),
            "subscription_count": len(subscription_bindings),
            "policy_count": len(policy_rows),
            "access_control_count": len(access_controls),
            "watch_or_review_event_count": sum(
                1 for row in transport_mappings if row["eventState"] == "watch_or_review"
            ),
        },
        "namespaces": namespaces,
        "namespaceStreams": streams,
        "queueGroups": [
            {
                **row,
                "matchedEventCount": queue_event_counts[row["queueRef"]],
                "source_refs": [
                    "prompt/087.md",
                    "data/analysis/canonical_event_contracts.json",
                    "data/analysis/dependency_degradation_profiles.json",
                ],
            }
            for row in QUEUE_GROUPS
        ],
        "subscriptionBindings": subscription_bindings,
        "accessControls": access_controls,
        "localBrokerEnvironments": [
            {
                "environmentRing": ring,
                "brokerRef": f"broker_{ring.replace('-', '_')}",
                "streamRefs": [row["streamRef"] for row in streams],
                "queueRefs": QUEUE_ORDER,
                "bootstrapScriptRef": "infra/event-spine/local/bootstrap-event-spine.mjs",
                "resetScriptRef": "infra/event-spine/local/reset-event-spine.mjs",
                "policyRef": "infra/event-spine/local/broker-access-policy.json",
                "dlqRetentionHours": 168 if ring in {"preprod", "production"} else 24,
            }
            for ring in ("local", "ci-preview", "integration", "preprod", "production")
        ],
        "manifest_tuple_hash": stable_digest(
            {
                "streams": streams,
                "queueGroups": QUEUE_GROUPS,
                "policies": policy_rows,
                "transportMappings": transport_mappings,
            }
        ),
    }

    mapping_payload = {
        "task_id": TASK_ID,
        "generated_at": GENERATED_AT,
        "captured_on": CAPTURED_ON,
        "visual_mode": VISUAL_MODE,
        "mission": MISSION,
        "source_precedence": SOURCE_PRECEDENCE,
        "summary": {
            "mapping_count": len(transport_mappings),
            "namespace_count": len(namespaces),
            "stream_count": len(streams),
            "queue_group_count": len(QUEUE_GROUPS),
        },
        "transportMappings": transport_mappings,
    }
    return broker_manifest, mapping_payload, policy_rows


def update_runtime_topology() -> None:
    topology = load_json(RUNTIME_TOPOLOGY_PATH)
    existing_queue_refs = {row["queue_ref"] for row in topology["queue_catalog"]}
    for queue_group in QUEUE_GROUPS:
        if queue_group["queueRef"] not in existing_queue_refs:
            topology["queue_catalog"].append(
                {
                    "queue_ref": queue_group["queueRef"],
                    "display_name": queue_group["displayName"],
                    "family_ref": "wf_data_stateful_plane",
                    "consumed_by_family_refs": queue_group["workloadFamilyRefs"],
                    "source_refs": [
                        "prompt/087.md",
                        "data/analysis/event_broker_topology_manifest.json",
                    ],
                }
            )

    for environment_manifest in topology["environment_manifests"]:
        queue_refs = environment_manifest.get("queue_refs", [])
        for queue_ref in QUEUE_ORDER:
            if queue_ref not in queue_refs:
                queue_refs.append(queue_ref)
        environment_manifest["queue_refs"] = queue_refs

    topology["event_broker_topology_manifest_ref"] = "data/analysis/event_broker_topology_manifest.json"
    topology["outbox_inbox_policy_matrix_ref"] = "data/analysis/outbox_inbox_policy_matrix.csv"
    topology["canonical_event_to_transport_mapping_ref"] = (
        "data/analysis/canonical_event_to_transport_mapping.json"
    )
    write_json(RUNTIME_TOPOLOGY_PATH, topology)


def write_docs(broker_manifest: dict[str, Any], mapping_payload: dict[str, Any], policy_rows: list[dict[str, Any]]) -> None:
    queue_lines = "\n".join(
        f"| `{row['queueRef']}` | {row['queueClass']} | `{row['consumerGroupRef']}` | `{row['retryPosture']}` | `{row['dlqRef']}` |"
        for row in broker_manifest["queueGroups"]
    )
    design_doc = dedent(
        f"""
        # 87 Event Spine And Queueing Design

        `par_087` turns the canonical event registry into a concrete broker and queueing substrate.

        ## Frozen Outcome

        - namespace streams: {broker_manifest['summary']['stream_count']}
        - canonical transport mappings: {broker_manifest['summary']['transport_mapping_count']}
        - queue groups: {broker_manifest['summary']['queue_group_count']}
        - subscription bindings: {broker_manifest['summary']['subscription_count']}
        - outbox and inbox policies: {broker_manifest['summary']['policy_count']}

        The transport subject remains the canonical event name. Namespace streams group events for durability and replay, but no transport alias replaces the event contract.

        ## Queue Groups

        | Queue Ref | Queue Class | Consumer Group | Retry Posture | DLQ |
        | --- | --- | --- | --- | --- |
        {queue_lines}

        ## Runtime Law

        - Browsers and published gateway surfaces do not publish directly to the broker.
        - Command and integration services publish only from durable outbox checkpoints.
        - Consumers settle only from durable inbox checkpoints and preserved callback-correlation windows.
        - DLQ and quarantine routes preserve `edgeCorrelationId`, `causalToken`, and effect-key lineage.
        - Projection rebuild and replay consume the same canonical events as live apply.

        ## Follow-on Dependencies

        {"".join(f"- `{row['dependency_ref']}` owned by `{row['owning_task_ref']}`: {row['scope']}\n" for row in FOLLOW_ON_DEPENDENCIES)}
        """
    ).strip()

    rule_lines = "\n".join(
        f"| `{row['policy_ref']}` | {row['component_kind']} | `{row['queue_ref']}` | `{row['ordering_scope']}` | `{row['correlation_formula']}` | `{row['replay_posture']}` |"
        for row in policy_rows
    )
    rules_doc = dedent(
        f"""
        # 87 Outbox Inbox Ordering And Correlation Rules

        The outbox and inbox substrate is authoritative runtime law. Handler-local retries or callback heuristics are forbidden.

        ## Non-negotiable Rules

        - Canonical event names remain canonical subjects on the broker.
        - Every external effect requires an outbox checkpoint and effect key before dispatch.
        - Every consumer requires an inbox receipt checkpoint and dedupe key before it can settle.
        - Callback or webhook consumers bind to explicit correlation keys and ordered receipt windows.
        - Quarantine and DLQ routes remain identity preserving; they do not erase event, settlement, or causal lineage.

        ## Policy Matrix

        | Policy Ref | Kind | Queue | Ordering Scope | Correlation Formula | Replay Posture |
        | --- | --- | --- | --- | --- | --- |
        {rule_lines}

        ## Flow Guarantees

        - `q_event_projection_live` and `q_event_projection_replay` preserve namespace ordering and checkpoint on every accepted apply.
        - `q_event_callback_correlation` enforces callback ordering windows and opens replay review on gaps.
        - `q_event_replay_quarantine` is manual-resume-only and preserves the original canonical subject.
        """
    ).strip()

    write_text(DESIGN_DOC_PATH, design_doc)
    write_text(RULES_DOC_PATH, rules_doc)


def write_infra(broker_manifest: dict[str, Any]) -> None:
    write_text(
        README_PATH,
        dedent(
            """
            # Event Spine Infrastructure

            This directory contains the provider-neutral Phase 0 event-spine baseline for `par_087`.

            It freezes:
            - namespace streams aligned to the canonical event registry
            - queue groups and DLQ routes
            - access-control posture for runtime identities
            - local bootstrap and reset flows that preserve the same queue law used in non-production
            """
        ).strip(),
    )

    write_text(
        TERRAFORM_MAIN_PATH,
        dedent(
            """
            terraform {
              required_version = ">= 1.7.0"
            }

            locals {
              broker_manifest = jsondecode(file("${path.module}/../../data/analysis/event_broker_topology_manifest.json"))
            }

            module "broker_namespace" {
              for_each = var.environments
              source = "./modules/broker_namespace"

              environment_ring = each.key
              broker_ref        = each.value.broker_ref
              stream_refs       = each.value.stream_refs
              queue_refs        = each.value.queue_refs
              dlq_retention_hours = each.value.dlq_retention_hours
            }

            module "subscription_group" {
              for_each = {
                for binding in local.broker_manifest.subscriptionBindings :
                binding.subscriptionRef => binding
              }
              source = "./modules/subscription_group"

              subscription_ref = each.value.subscriptionRef
              stream_ref       = each.value.streamRef
              queue_ref        = each.value.queueRef
              consumer_group_ref = each.value.consumerGroupRef
              retry_posture    = each.value.retryPosture
              dlq_ref          = each.value.dlqRef
              matched_event_count = each.value.matchedEventCount
            }
            """
        ).strip(),
    )
    write_text(
        TERRAFORM_VARIABLES_PATH,
        dedent(
            """
            variable "environments" {
              type = map(object({
                broker_ref          = string
                stream_refs         = list(string)
                queue_refs          = list(string)
                dlq_retention_hours = number
              }))
            }
            """
        ).strip(),
    )
    write_text(
        TERRAFORM_OUTPUTS_PATH,
        dedent(
            """
            output "broker_namespace_refs" {
              value = { for key, module_ref in module.broker_namespace : key => module_ref.namespace_ref }
            }

            output "subscription_refs" {
              value = { for key, module_ref in module.subscription_group : key => module_ref.subscription_ref }
            }
            """
        ).strip(),
    )
    write_text(
        BROKER_MODULE_MAIN_PATH,
        dedent(
            """
            locals {
              namespace_ref = "${var.environment_ring}:${var.broker_ref}"
            }
            """
        ).strip(),
    )
    write_text(
        BROKER_MODULE_VARIABLES_PATH,
        dedent(
            """
            variable "environment_ring" { type = string }
            variable "broker_ref" { type = string }
            variable "stream_refs" { type = list(string) }
            variable "queue_refs" { type = list(string) }
            variable "dlq_retention_hours" { type = number }
            """
        ).strip(),
    )
    write_text(
        BROKER_MODULE_OUTPUTS_PATH,
        dedent(
            """
            output "namespace_ref" {
              value = local.namespace_ref
            }
            """
        ).strip(),
    )
    write_text(
        SUBSCRIPTION_MODULE_MAIN_PATH,
        dedent(
            """
            locals {
              binding_ref = "${var.stream_ref}:${var.queue_ref}:${var.consumer_group_ref}"
            }
            """
        ).strip(),
    )
    write_text(
        SUBSCRIPTION_MODULE_VARIABLES_PATH,
        dedent(
            """
            variable "subscription_ref" { type = string }
            variable "stream_ref" { type = string }
            variable "queue_ref" { type = string }
            variable "consumer_group_ref" { type = string }
            variable "retry_posture" { type = string }
            variable "dlq_ref" { type = string }
            variable "matched_event_count" { type = number }
            """
        ).strip(),
    )
    write_text(
        SUBSCRIPTION_MODULE_OUTPUTS_PATH,
        dedent(
            """
            output "subscription_ref" {
              value = var.subscription_ref
            }
            """
        ).strip(),
    )

    for ring, path in ENVIRONMENT_FILE_PATHS.items():
        write_json(
            path,
            {
                "broker_ref": f"broker_{ring.replace('-', '_')}",
                "stream_refs": [row["streamRef"] for row in broker_manifest["namespaceStreams"]],
                "queue_refs": QUEUE_ORDER,
                "dlq_retention_hours": 168 if ring in {"preprod", "production"} else 24,
            },
        )

    write_text(
        LOCAL_COMPOSE_PATH,
        dedent(
            """
            services:
              event-spine:
                image: nats:2.11-alpine
                command: ["-js", "-sd", "/data", "-m", "8222"]
                ports:
                  - "4222:4222"
                  - "8222:8222"
            """
        ).strip(),
    )

    write_json(
        LOCAL_POLICY_PATH,
        {
            "browser_direct_publish_blocked": True,
            "browser_direct_consume_blocked": True,
            "blocked_browser_targets": QUEUE_ORDER,
            "allowed_service_identities": [
                "sid_command_api",
                "sid_projection_worker",
                "sid_integration_dispatch",
                "sid_adapter_simulators",
                "sid_assurance_control",
            ],
            "callback_queue_ref": "q_event_callback_correlation",
            "replay_quarantine_ref": "q_event_replay_quarantine",
        },
    )

    write_text(
        LOCAL_BOOTSTRAP_PATH,
        dedent(
            """
            import fs from "node:fs";
            import path from "node:path";
            import { fileURLToPath } from "node:url";

            const __filename = fileURLToPath(import.meta.url);
            const __dirname = path.dirname(__filename);
            const ROOT = path.resolve(__dirname, "..", "..", "..");
            const manifest = JSON.parse(
              fs.readFileSync(
                path.join(ROOT, "data", "analysis", "event_broker_topology_manifest.json"),
                "utf8",
              ),
            );

            const args = new Map();
            for (let index = 2; index < process.argv.length; index += 2) {
              args.set(process.argv[index], process.argv[index + 1] ?? "true");
            }

            const stateDir = args.get("--state-dir") ?? path.join(ROOT, ".tmp", "event-spine-state");
            const dryRun = args.has("--dry-run");
            const plan = {
              brokerCount: manifest.localBrokerEnvironments.length,
              streamCount: manifest.namespaceStreams.length,
              queueCount: manifest.queueGroups.length,
              dlqRefs: manifest.queueGroups.map((row) => row.dlqRef),
              stateDir,
            };

            if (dryRun) {
              process.stdout.write(JSON.stringify(plan));
              process.exit(0);
            }

            fs.mkdirSync(stateDir, { recursive: true });
            for (const folder of ["streams", "queues", "dlq"]) {
              fs.mkdirSync(path.join(stateDir, folder), { recursive: true });
            }
            for (const stream of manifest.namespaceStreams) {
              fs.mkdirSync(path.join(stateDir, "streams", stream.streamRef), { recursive: true });
            }
            for (const queue of manifest.queueGroups) {
              const queueDir = path.join(stateDir, "queues", queue.queueRef);
              fs.mkdirSync(queueDir, { recursive: true });
              fs.writeFileSync(
                path.join(queueDir, "subscription.json"),
                JSON.stringify(
                  {
                    consumerGroupRef: queue.consumerGroupRef,
                    retryPosture: queue.retryPosture,
                    dlqRef: queue.dlqRef,
                  },
                  null,
                  2,
                ),
              );
              fs.mkdirSync(path.join(stateDir, "dlq", queue.dlqRef), { recursive: true });
            }
            process.stdout.write(JSON.stringify(plan));
            """
        ).strip(),
    )
    write_text(
        LOCAL_RESET_PATH,
        dedent(
            """
            import fs from "node:fs";
            import path from "node:path";

            const args = new Map();
            for (let index = 2; index < process.argv.length; index += 2) {
              args.set(process.argv[index], process.argv[index + 1] ?? "true");
            }

            const stateDir = args.get("--state-dir");
            const dryRun = args.has("--dry-run");
            const plan = {
              action: "reset",
              stateDir,
              removedPaths: stateDir ? [path.join(stateDir, "streams"), path.join(stateDir, "queues"), path.join(stateDir, "dlq")] : [],
            };

            if (dryRun || !stateDir) {
              process.stdout.write(JSON.stringify(plan));
              process.exit(0);
            }

            fs.rmSync(stateDir, { recursive: true, force: true });
            fs.mkdirSync(stateDir, { recursive: true });
            process.stdout.write(JSON.stringify(plan));
            """
        ).strip(),
    )
    write_text(
        SMOKE_TEST_PATH,
        dedent(
            """
            import assert from "node:assert/strict";
            import fs from "node:fs";
            import os from "node:os";
            import path from "node:path";
            import test from "node:test";
            import { spawnSync } from "node:child_process";
            import { fileURLToPath } from "node:url";

            const __filename = fileURLToPath(import.meta.url);
            const __dirname = path.dirname(__filename);
            const ROOT = path.resolve(__dirname, "..", "..", "..");

            const topology = JSON.parse(
              fs.readFileSync(path.join(ROOT, "data", "analysis", "runtime_topology_manifest.json"), "utf8"),
            );
            const manifest = JSON.parse(
              fs.readFileSync(path.join(ROOT, "data", "analysis", "event_broker_topology_manifest.json"), "utf8"),
            );
            const policy = JSON.parse(
              fs.readFileSync(path.join(ROOT, "infra", "event-spine", "local", "broker-access-policy.json"), "utf8"),
            );

            test("runtime topology binds the event spine manifests", () => {
              assert.equal(
                topology.event_broker_topology_manifest_ref,
                "data/analysis/event_broker_topology_manifest.json",
              );
              assert.equal(
                topology.outbox_inbox_policy_matrix_ref,
                "data/analysis/outbox_inbox_policy_matrix.csv",
              );
              assert.equal(
                topology.canonical_event_to_transport_mapping_ref,
                "data/analysis/canonical_event_to_transport_mapping.json",
              );
            });

            test("browser access remains blocked for every broker queue", () => {
              assert.equal(policy.browser_direct_publish_blocked, true);
              assert.equal(policy.browser_direct_consume_blocked, true);
              assert.equal(policy.blocked_browser_targets.includes("q_event_integration_effects"), true);
              assert.equal(policy.blocked_browser_targets.includes("q_event_replay_quarantine"), true);
            });

            test("bootstrap and reset flows remain deterministic", () => {
              const bootstrap = path.join(ROOT, "infra", "event-spine", "local", "bootstrap-event-spine.mjs");
              const reset = path.join(ROOT, "infra", "event-spine", "local", "reset-event-spine.mjs");
              const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "vecells-event-spine-"));

              const bootstrapResult = spawnSync(process.execPath, [bootstrap, "--state-dir", stateDir], {
                encoding: "utf8",
              });
              assert.equal(bootstrapResult.status, 0, bootstrapResult.stderr);
              const plan = JSON.parse(bootstrapResult.stdout);
              assert.equal(plan.streamCount, manifest.summary.stream_count);
              assert.equal(fs.existsSync(path.join(stateDir, "streams", "stream_request")), true);
              assert.equal(fs.existsSync(path.join(stateDir, "queues", "q_event_callback_correlation")), true);

              const resetResult = spawnSync(process.execPath, [reset, "--state-dir", stateDir], {
                encoding: "utf8",
              });
              assert.equal(resetResult.status, 0, resetResult.stderr);
              assert.equal(fs.existsSync(path.join(stateDir, "streams")), false);

              fs.rmSync(stateDir, { recursive: true, force: true });
            });
            """
        ).strip(),
    )


def write_atlas(broker_manifest: dict[str, Any], mapping_payload: dict[str, Any], policy_rows: list[dict[str, Any]]) -> None:
    payload = {
        "meta": broker_manifest["summary"],
        "queueGroups": broker_manifest["queueGroups"],
        "streams": broker_manifest["namespaceStreams"],
        "mappings": mapping_payload["transportMappings"],
        "policies": policy_rows,
        "environmentCount": len(broker_manifest["localBrokerEnvironments"]),
        "queueClassOptions": sorted({row["queueClass"] for row in broker_manifest["queueGroups"]}),
        "retryOptions": sorted({row["retryPosture"] for row in broker_manifest["queueGroups"]}),
        "consumerGroupOptions": sorted(
            {row["consumerGroupRef"] for row in broker_manifest["queueGroups"]}
        ),
    }
    payload_json = json.dumps(payload)
    html = f"""
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>87 Event Spine Topology Atlas</title>
    <style>
      :root {{
        --canvas: #F7F9FC;
        --panel: #FFFFFF;
        --rail: #EEF2F7;
        --inset: #F4F7FB;
        --text-strong: #0F172A;
        --text-default: #1E293B;
        --text-muted: #64748B;
        --border-subtle: #E2E8F0;
        --event: #2563EB;
        --queue: #0EA5A4;
        --replay: #7C3AED;
        --warning: #D97706;
        --dlq: #C24141;
        --verified: #059669;
        --shadow: 0 18px 42px rgba(15, 23, 42, 0.08);
        --radius: 20px;
      }}
      * {{ box-sizing: border-box; }}
      html, body {{
        margin: 0;
        background: var(--canvas);
        color: var(--text-default);
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }}
      body[data-reduced-motion="true"] * {{
        transition-duration: 1ms !important;
        animation-duration: 1ms !important;
        scroll-behavior: auto !important;
      }}
      button, select {{ font: inherit; }}
      button {{
        background: transparent;
        border: 0;
        color: inherit;
        text-align: left;
        cursor: pointer;
      }}
      select {{
        min-height: 44px;
        width: 100%;
        border: 1px solid var(--border-subtle);
        border-radius: 14px;
        background: var(--panel);
        padding: 0 12px;
      }}
      :focus-visible {{
        outline: 2px solid var(--event);
        outline-offset: 2px;
      }}
      .app {{
        max-width: 1580px;
        margin: 0 auto;
        padding: 24px;
        display: grid;
        gap: 24px;
      }}
      .masthead {{
        position: sticky;
        top: 0;
        z-index: 10;
        min-height: 76px;
        border: 1px solid var(--border-subtle);
        border-radius: 24px;
        background: linear-gradient(140deg, rgba(37, 99, 235, 0.08), rgba(124, 58, 237, 0.08), rgba(255,255,255,0.95));
        box-shadow: var(--shadow);
        padding: 18px 20px;
        display: grid;
        gap: 14px;
      }}
      .masthead-top {{
        display: flex;
        justify-content: space-between;
        gap: 16px;
        align-items: start;
      }}
      .wordmark {{
        display: inline-flex;
        align-items: center;
        gap: 12px;
        font-weight: 800;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--text-strong);
      }}
      .wordmark svg {{
        width: 40px;
        height: 40px;
      }}
      .masthead h1 {{
        margin: 8px 0 0;
        font-size: clamp(1.7rem, 2.8vw, 2.4rem);
        line-height: 1.05;
        color: var(--text-strong);
      }}
      .masthead p {{
        margin: 0;
        max-width: 74ch;
        line-height: 1.55;
        color: var(--text-muted);
      }}
      .summary-strip {{
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px;
      }}
      .summary-card {{
        background: rgba(255,255,255,0.88);
        border: 1px solid var(--border-subtle);
        border-radius: 16px;
        padding: 14px 16px;
        display: grid;
        gap: 4px;
      }}
      .summary-label {{
        color: var(--text-muted);
        font-size: 0.76rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }}
      .summary-value {{
        color: var(--text-strong);
        font-size: 1.46rem;
        font-weight: 800;
      }}
      .layout {{
        display: grid;
        grid-template-columns: 324px minmax(0, 1fr) 420px;
        gap: 24px;
        align-items: start;
      }}
      .panel {{
        background: var(--panel);
        border: 1px solid var(--border-subtle);
        border-radius: var(--radius);
        box-shadow: var(--shadow);
        overflow: hidden;
      }}
      .panel-header {{
        padding: 18px 18px 12px;
        border-bottom: 1px solid var(--border-subtle);
        background: linear-gradient(180deg, rgba(244,247,251,0.9), rgba(255,255,255,0.96));
      }}
      .panel-title {{
        margin: 0;
        font-size: 0.95rem;
        font-weight: 800;
        color: var(--text-strong);
      }}
      .rail-body, .panel-body, .inspector-body {{
        padding: 16px;
        display: grid;
        gap: 14px;
      }}
      .rail-body {{
        background: var(--rail);
        max-height: calc(100vh - 160px);
        overflow: auto;
      }}
      .filter-group {{
        background: var(--panel);
        border: 1px solid var(--border-subtle);
        border-radius: 16px;
        padding: 14px;
        display: grid;
        gap: 8px;
      }}
      .filter-group h3 {{
        margin: 0;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-size: 0.76rem;
      }}
      .center-stack {{
        display: grid;
        gap: 24px;
      }}
      .diagram-grid {{
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 16px;
        min-height: 320px;
      }}
      .diagram-card {{
        border: 1px solid var(--border-subtle);
        border-radius: 18px;
        background: var(--inset);
        padding: 16px;
        display: grid;
        gap: 12px;
      }}
      .diagram-card h3 {{
        margin: 0;
        color: var(--text-strong);
        font-size: 0.92rem;
      }}
      .river-grid, .queue-grid, .trace-grid {{
        display: grid;
        gap: 10px;
      }}
      .river-grid {{ grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); }}
      .queue-grid {{ grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); }}
      .trace-grid {{ grid-template-columns: repeat(4, minmax(0, 1fr)); }}
      .river-card, .queue-card, .trace-step {{
        background: var(--panel);
        border: 1px solid var(--border-subtle);
        border-radius: 16px;
        padding: 14px;
        display: grid;
        gap: 8px;
        transition: transform 120ms ease, border-color 120ms ease, box-shadow 180ms ease;
      }}
      .river-card[data-selected="true"], .queue-card[data-selected="true"], .trace-step[data-selected="true"] {{
        border-color: rgba(37, 99, 235, 0.4);
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
      }}
      .queue-card[data-tone="dlq"] {{
        border-color: rgba(194, 65, 65, 0.34);
        box-shadow: inset 0 0 0 1px rgba(194, 65, 65, 0.22);
      }}
      .queue-chip {{
        display: inline-flex;
        align-items: center;
        min-height: 28px;
        padding: 0 10px;
        border-radius: 999px;
        font-size: 0.78rem;
        font-weight: 800;
      }}
      .queue-chip-dlq {{
        background: rgba(194, 65, 65, 0.12);
        color: var(--dlq);
      }}
      .queue-chip-queue {{
        background: rgba(14, 165, 164, 0.12);
        color: var(--queue);
      }}
      .mono {{
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        font-size: 0.84rem;
      }}
      .parity {{
        color: var(--text-muted);
        line-height: 1.5;
      }}
      table {{
        width: 100%;
        border-collapse: collapse;
      }}
      th, td {{
        padding: 12px 10px;
        border-bottom: 1px solid var(--border-subtle);
        text-align: left;
        vertical-align: top;
      }}
      th {{
        font-size: 0.76rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--text-muted);
      }}
      .row-button {{
        width: 100%;
        display: grid;
        gap: 2px;
      }}
      .row-selected {{
        background: rgba(37, 99, 235, 0.06);
      }}
      .inspector {{
        position: sticky;
        top: 92px;
      }}
      .inspector dl {{
        margin: 0;
        display: grid;
        gap: 12px;
      }}
      .inspector dt {{
        color: var(--text-muted);
        font-size: 0.74rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }}
      .inspector dd {{
        margin: 4px 0 0;
        color: var(--text-strong);
      }}
      @media (max-width: 1180px) {{
        .layout {{
          grid-template-columns: 1fr;
        }}
        .diagram-grid {{
          grid-template-columns: 1fr;
        }}
        .inspector {{
          position: static;
        }}
      }}
    </style>
  </head>
  <body>
    <main class="app">
      <header class="masthead" data-testid="topology-masthead">
        <div class="masthead-top">
          <div>
            <div class="wordmark">
              <svg viewBox="0 0 64 64" aria-hidden="true">
                <rect x="6" y="6" width="52" height="52" rx="16" fill="#2563EB"></rect>
                <path d="M18 18h20l-12 14 12 14H18l12-14z" fill="white"></path>
                <path d="M34 18h12v28H34" fill="white"></path>
              </svg>
              <span>Vecells</span>
            </div>
            <h1>Event Spine Topology Atlas</h1>
            <p>
              Canonical event names, queue groups, retry posture, and outbox and inbox checkpoints are frozen
              as one runtime contract. No browser or handler may improvise transport semantics.
            </p>
          </div>
          <div class="mono">mode :: {VISUAL_MODE}</div>
        </div>
        <div class="summary-strip">
          <div class="summary-card"><span class="summary-label">Namespaces</span><strong id="metric-namespaces" class="summary-value"></strong></div>
          <div class="summary-card"><span class="summary-label">Mappings</span><strong id="metric-mappings" class="summary-value"></strong></div>
          <div class="summary-card"><span class="summary-label">Queue Groups</span><strong id="metric-queues" class="summary-value"></strong></div>
          <div class="summary-card"><span class="summary-label">Watch Events</span><strong id="metric-watch" class="summary-value"></strong></div>
        </div>
      </header>

      <section class="layout">
        <aside class="panel" aria-label="Filters">
          <div class="panel-header"><h2 class="panel-title">Filters</h2></div>
          <div class="rail-body">
            <div class="filter-group">
              <h3>Namespace</h3>
              <select id="filter-namespace">
                <option value="all">All namespaces</option>
              </select>
            </div>
            <div class="filter-group">
              <h3>Queue Class</h3>
              <select id="filter-queue-class">
                <option value="all">All queue classes</option>
              </select>
            </div>
            <div class="filter-group">
              <h3>Retry Posture</h3>
              <select id="filter-retry">
                <option value="all">All retry posture</option>
              </select>
            </div>
            <div class="filter-group">
              <h3>Consumer Group</h3>
              <select id="filter-consumer-group">
                <option value="all">All consumer groups</option>
              </select>
            </div>
            <div class="filter-group">
              <h3>Event State</h3>
              <select id="filter-event-state">
                <option value="all">All event states</option>
                <option value="steady">Steady</option>
                <option value="watch_or_review">Watch or review</option>
              </select>
            </div>
          </div>
        </aside>

        <section class="center-stack">
          <section class="panel">
            <div class="panel-header"><h2 class="panel-title">Flow Observatory</h2></div>
            <div class="panel-body diagram-grid">
              <article class="diagram-card">
                <h3>Namespace To Topic River</h3>
                <div id="river-diagram" class="river-grid" data-testid="river-diagram"></div>
                <p id="river-parity" class="parity"></p>
              </article>
              <article class="diagram-card">
                <h3>Queue And Retry Topology</h3>
                <div id="queue-chart" class="queue-grid" data-testid="queue-chart"></div>
                <p id="queue-parity" class="parity"></p>
              </article>
              <article class="diagram-card">
                <h3>Outbox Inbox Correlation Trace</h3>
                <div id="trace-strip" class="trace-grid" data-testid="trace-strip"></div>
                <p id="trace-parity" class="parity"></p>
              </article>
            </div>
          </section>

          <section class="panel">
            <div class="panel-header"><h2 class="panel-title">Topology Table</h2></div>
            <div class="panel-body">
              <table data-testid="topology-table">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Namespace</th>
                    <th>Queues</th>
                    <th>State</th>
                  </tr>
                </thead>
                <tbody id="topology-body"></tbody>
              </table>
            </div>
          </section>

          <section class="panel">
            <div class="panel-header"><h2 class="panel-title">Checkpoint And Policy Table</h2></div>
            <div class="panel-body">
              <table data-testid="checkpoint-table">
                <thead>
                  <tr>
                    <th>Policy</th>
                    <th>Kind</th>
                    <th>Queue</th>
                    <th>Replay</th>
                  </tr>
                </thead>
                <tbody id="checkpoint-body"></tbody>
              </table>
            </div>
          </section>
        </section>

        <aside class="panel inspector" data-testid="inspector">
          <div class="panel-header"><h2 class="panel-title">Inspector</h2></div>
          <div class="inspector-body" id="inspector-body"></div>
        </aside>
      </section>
    </main>

    <script>
      const payload = {payload_json};
      const namespaceFilter = document.getElementById("filter-namespace");
      const queueClassFilter = document.getElementById("filter-queue-class");
      const retryFilter = document.getElementById("filter-retry");
      const consumerGroupFilter = document.getElementById("filter-consumer-group");
      const eventStateFilter = document.getElementById("filter-event-state");
      const topologyBody = document.getElementById("topology-body");
      const checkpointBody = document.getElementById("checkpoint-body");
      const riverDiagram = document.getElementById("river-diagram");
      const queueChart = document.getElementById("queue-chart");
      const traceStrip = document.getElementById("trace-strip");
      const inspectorBody = document.getElementById("inspector-body");
      const riverParity = document.getElementById("river-parity");
      const queueParity = document.getElementById("queue-parity");
      const traceParity = document.getElementById("trace-parity");

      const state = {{
        namespace: "all",
        queueClass: "all",
        retryPosture: "all",
        consumerGroup: "all",
        eventState: "all",
        selectedMappingRef: payload.mappings[0]?.canonicalEventContractRef ?? null,
      }};

      if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {{
        document.body.setAttribute("data-reduced-motion", "true");
      }}

      function setOptions(select, values) {{
        values.forEach((value) => {{
          const option = document.createElement("option");
          option.value = value;
          option.textContent = value;
          select.appendChild(option);
        }});
      }}

      setOptions(namespaceFilter, [...new Set(payload.mappings.map((row) => row.namespaceCode))].sort());
      setOptions(queueClassFilter, payload.queueClassOptions);
      setOptions(retryFilter, payload.retryOptions);
      setOptions(consumerGroupFilter, payload.consumerGroupOptions);

      function mappingMatchesFilters(row) {{
        return (
          (state.namespace === "all" || row.namespaceCode === state.namespace) &&
          (state.queueClass === "all" || row.queueClassRefs.includes(state.queueClass)) &&
          (state.retryPosture === "all" || row.retryPostures.includes(state.retryPosture)) &&
          (state.consumerGroup === "all" || row.consumerGroupRefs.includes(state.consumerGroup)) &&
          (state.eventState === "all" || row.eventState === state.eventState)
        );
      }}

      function filteredMappings() {{
        return payload.mappings.filter(mappingMatchesFilters);
      }}

      function filteredQueues() {{
        const queueRefs = new Set(filteredMappings().flatMap((row) => row.queueRefs));
        return payload.queueGroups.filter((row) => queueRefs.has(row.queueRef));
      }}

      function selectedMapping() {{
        return filteredMappings().find((row) => row.canonicalEventContractRef === state.selectedMappingRef) ?? filteredMappings()[0] ?? null;
      }}

      function ensureSelection() {{
        const current = selectedMapping();
        if (!current) {{
          state.selectedMappingRef = null;
          return;
        }}
        state.selectedMappingRef = current.canonicalEventContractRef;
      }}

      function onRowKeydown(event, rows, currentRef) {{
        if (event.key !== "ArrowDown" && event.key !== "ArrowUp") {{
          return;
        }}
        event.preventDefault();
        const index = rows.findIndex((row) => row.canonicalEventContractRef === currentRef);
        const nextIndex = event.key === "ArrowDown"
          ? Math.min(index + 1, rows.length - 1)
          : Math.max(index - 1, 0);
        const next = rows[nextIndex];
        if (!next) {{
          return;
        }}
        state.selectedMappingRef = next.canonicalEventContractRef;
        render();
        document.querySelector(`[data-focus-ref="${{next.canonicalEventContractRef}}"]`)?.focus();
      }}

      function renderMetrics() {{
        document.getElementById("metric-namespaces").textContent = String(payload.meta.namespace_count);
        document.getElementById("metric-mappings").textContent = String(filteredMappings().length);
        document.getElementById("metric-queues").textContent = String(filteredQueues().length);
        document.getElementById("metric-watch").textContent = String(
          payload.mappings.filter((row) => row.eventState === "watch_or_review").length,
        );
      }}

      function renderRiver() {{
        const mappings = filteredMappings();
        const counts = new Map();
        mappings.forEach((row) => {{
          counts.set(row.namespaceCode, (counts.get(row.namespaceCode) ?? 0) + 1);
        }});
        const selected = selectedMapping();
        riverDiagram.innerHTML = payload.streams
          .filter((stream) => counts.has(stream.namespaceCode))
          .map((stream) => `
            <div class="river-card" data-testid="river-card-${{stream.streamRef}}" data-selected="${{String(selected?.namespaceCode === stream.namespaceCode)}}">
              <strong>${{stream.namespaceCode}}</strong>
              <span class="mono">${{stream.streamName}}</span>
              <span>${{counts.get(stream.namespaceCode)}} mapped events</span>
            </div>
          `)
          .join("");
        riverParity.textContent = selected
          ? `${{selected.eventName}} flows on ${{selected.streamName}} and keeps the canonical subject unchanged.`
          : "No event matches the current filter set.";
      }}

      function renderQueues() {{
        const queues = filteredQueues();
        const selected = selectedMapping();
        const selectedQueueRefs = new Set(selected?.queueRefs ?? []);
        queueChart.innerHTML = queues
          .map((queue) => `
            <div
              class="queue-card"
              data-testid="queue-card-${{queue.queueRef}}"
              data-selected="${{String(selectedQueueRefs.has(queue.queueRef))}}"
              data-tone="${{queue.dlqRef ? "dlq" : "queue"}}"
            >
              <strong>${{queue.displayName}}</strong>
              <span class="mono">${{queue.queueRef}}</span>
              <span class="queue-chip queue-chip-queue">${{queue.retryPosture}}</span>
              <span class="queue-chip queue-chip-dlq">DLQ :: ${{queue.dlqRef}}</span>
            </div>
          `)
          .join("");
        queueParity.textContent = selected
          ? `${{selected.eventName}} fans into ${{selected.queueRefs.length}} declared queue groups and every queue keeps a distinct DLQ route.`
          : "Queue parity is waiting for a selected event.";
      }}

      function renderTrace() {{
        const selected = selectedMapping();
        if (!selected) {{
          traceStrip.innerHTML = "";
          traceParity.textContent = "No trace is available.";
          return;
        }}
        const firstPolicy = payload.policies.find((row) => selected.outboxPolicyRefs.includes(row.policy_ref));
        traceStrip.innerHTML = [
          ["Outbox", firstPolicy?.policy_ref ?? selected.outboxPolicyRefs[0] ?? "n/a"],
          ["Stream", selected.streamRef],
          ["Queues", selected.queueRefs.join(" + ")],
          ["Inbox", selected.inboxPolicyRefs.join(" + ")],
        ]
          .map(([label, value], index) => `
            <div class="trace-step" data-testid="trace-step-${{index}}" data-selected="true">
              <strong>${{label}}</strong>
              <span class="mono">${{value}}</span>
            </div>
          `)
          .join("");
        traceParity.textContent = `${{selected.eventName}} keeps edgeCorrelationId and causalToken from outbox reservation through inbox checkpoint and replay review.`;
      }}

      function renderTopologyTable() {{
        const rows = filteredMappings();
        topologyBody.innerHTML = rows
          .map((row) => `
            <tr class="${{row.canonicalEventContractRef === state.selectedMappingRef ? "row-selected" : ""}}" data-testid="topology-row-${{row.canonicalEventContractRef}}">
              <td>
                <button class="row-button" data-focus-ref="${{row.canonicalEventContractRef}}">
                  <strong>${{row.eventName}}</strong>
                  <span class="mono">${{row.canonicalEventContractRef}}</span>
                </button>
              </td>
              <td>${{row.namespaceCode}}</td>
              <td class="mono">${{row.queueRefs.join(", ")}}</td>
              <td>${{row.eventState}}</td>
            </tr>
          `)
          .join("");
        Array.from(topologyBody.querySelectorAll(".row-button")).forEach((button, index) => {{
          const row = rows[index];
          button.addEventListener("click", () => {{
            state.selectedMappingRef = row.canonicalEventContractRef;
            render();
          }});
          button.addEventListener("keydown", (event) => onRowKeydown(event, rows, row.canonicalEventContractRef));
        }});
      }}

      function renderCheckpointTable() {{
        const selected = selectedMapping();
        const rows = selected
          ? payload.policies.filter(
              (row) =>
                selected.outboxPolicyRefs.includes(row.policy_ref) ||
                selected.inboxPolicyRefs.includes(row.policy_ref),
            )
          : [];
        checkpointBody.innerHTML = rows
          .map((row) => `
            <tr data-testid="checkpoint-row-${{row.policy_ref}}">
              <td><strong>${{row.policy_ref}}</strong></td>
              <td>${{row.component_kind}}</td>
              <td class="mono">${{row.queue_ref}}</td>
              <td>${{row.replay_posture}}</td>
            </tr>
          `)
          .join("");
      }}

      function renderInspector() {{
        const selected = selectedMapping();
        if (!selected) {{
          inspectorBody.innerHTML = "<p>No filtered event is available.</p>";
          return;
        }}
        inspectorBody.innerHTML = `
          <dl>
            <div><dt>Event</dt><dd class="mono">${{selected.eventName}}</dd></div>
            <div><dt>Stream</dt><dd class="mono">${{selected.streamName}}</dd></div>
            <div><dt>Queues</dt><dd class="mono">${{selected.queueRefs.join(", ")}}</dd></div>
            <div><dt>Consumer groups</dt><dd class="mono">${{selected.consumerGroupRefs.join(", ")}}</dd></div>
            <div><dt>Retry posture</dt><dd>${{selected.retryPostures.join(" | ")}}</dd></div>
            <div><dt>Event state</dt><dd>${{selected.eventState}}</dd></div>
            <div><dt>Outbox policies</dt><dd class="mono">${{selected.outboxPolicyRefs.join(", ")}}</dd></div>
            <div><dt>Inbox policies</dt><dd class="mono">${{selected.inboxPolicyRefs.join(", ")}}</dd></div>
          </dl>
        `;
      }}

      function render() {{
        ensureSelection();
        renderMetrics();
        renderRiver();
        renderQueues();
        renderTrace();
        renderTopologyTable();
        renderCheckpointTable();
        renderInspector();
      }}

      namespaceFilter.addEventListener("change", () => {{
        state.namespace = namespaceFilter.value;
        render();
      }});
      queueClassFilter.addEventListener("change", () => {{
        state.queueClass = queueClassFilter.value;
        render();
      }});
      retryFilter.addEventListener("change", () => {{
        state.retryPosture = retryFilter.value;
        render();
      }});
      consumerGroupFilter.addEventListener("change", () => {{
        state.consumerGroup = consumerGroupFilter.value;
        render();
      }});
      eventStateFilter.addEventListener("change", () => {{
        state.eventState = eventStateFilter.value;
        render();
      }});

      render();
    </script>
  </body>
</html>
""".strip()
    write_text(ATLAS_PATH, html)


def write_spec(mapping_payload: dict[str, Any]) -> None:
    spec = dedent(
        """
        import fs from "node:fs";
        import http from "node:http";
        import path from "node:path";
        import { fileURLToPath } from "node:url";

        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const ROOT = path.resolve(__dirname, "..", "..");
        const HTML_PATH = path.join(ROOT, "docs", "architecture", "87_event_spine_topology_atlas.html");
        const MANIFEST_PATH = path.join(ROOT, "data", "analysis", "event_broker_topology_manifest.json");
        const MAPPING_PATH = path.join(ROOT, "data", "analysis", "canonical_event_to_transport_mapping.json");

        const MANIFEST = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
        const MAPPING = JSON.parse(fs.readFileSync(MAPPING_PATH, "utf8"));

        export const eventSpineAtlasCoverage = [
          "filter behavior and synchronized selection",
          "keyboard navigation and focus management",
          "reduced-motion handling",
          "responsive layout at desktop and tablet widths",
          "accessibility smoke checks and landmark verification",
          "verification that DLQ or quarantine routes remain visibly distinct from ordinary delivery",
        ];

        function assertCondition(condition, message) {
          if (!condition) {
            throw new Error(message);
          }
        }

        async function importPlaywright() {
          try {
            return await import("playwright");
          } catch {
            throw new Error("This spec needs the `playwright` package when run with --run.");
          }
        }

        function filteredMappings({
          namespace = "all",
          queueClass = "all",
          retryPosture = "all",
          consumerGroup = "all",
          eventState = "all",
        }) {
          return MAPPING.transportMappings.filter((row) => {
            return (
              (namespace === "all" || row.namespaceCode === namespace) &&
              (queueClass === "all" || row.queueClassRefs.includes(queueClass)) &&
              (retryPosture === "all" || row.retryPostures.includes(retryPosture)) &&
              (consumerGroup === "all" || row.consumerGroupRefs.includes(consumerGroup)) &&
              (eventState === "all" || row.eventState === eventState)
            );
          });
        }

        function startStaticServer() {
          return new Promise((resolve, reject) => {
            const server = http.createServer((req, res) => {
              const rawUrl = req.url ?? "/";
              const urlPath =
                rawUrl === "/" ? "/docs/architecture/87_event_spine_topology_atlas.html" : rawUrl.split("?")[0];
              const safePath = decodeURIComponent(urlPath).replace(/^\\/+/, "");
              const filePath = path.join(ROOT, safePath);
              if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath)) {
                res.writeHead(404);
                res.end("Not found");
                return;
              }
              const body = fs.readFileSync(filePath);
              const contentType = filePath.endsWith(".html")
                ? "text/html; charset=utf-8"
                : filePath.endsWith(".json")
                  ? "application/json; charset=utf-8"
                  : "text/plain; charset=utf-8";
              res.writeHead(200, { "Content-Type": contentType });
              res.end(body);
            });
            server.once("error", reject);
            server.listen(4387, "127.0.0.1", () => resolve(server));
          });
        }

        async function run() {
          assertCondition(fs.existsSync(HTML_PATH), `Missing event spine atlas HTML: ${HTML_PATH}`);
          const { chromium } = await importPlaywright();
          const server = await startStaticServer();
          const browser = await chromium.launch({ headless: true });
          const page = await browser.newPage({ viewport: { width: 1460, height: 1180 } });
          const url =
            process.env.EVENT_SPINE_ATLAS_URL ??
            "http://127.0.0.1:4387/docs/architecture/87_event_spine_topology_atlas.html";

          try {
            await page.goto(url, { waitUntil: "networkidle" });
            await page.locator("[data-testid='river-diagram']").waitFor();
            await page.locator("[data-testid='queue-chart']").waitFor();
            await page.locator("[data-testid='trace-strip']").waitFor();
            await page.locator("[data-testid='topology-table']").waitFor();
            await page.locator("[data-testid='checkpoint-table']").waitFor();
            await page.locator("[data-testid='inspector']").waitFor();

            const initialRows = await page.locator("[data-testid^='topology-row-']").count();
            assertCondition(
              initialRows === filteredMappings({}).length,
              `Initial topology row count drifted: expected ${filteredMappings({}).length}, found ${initialRows}`,
            );

            await page.locator("#filter-namespace").selectOption("communication");
            const communicationRows = await page.locator("[data-testid^='topology-row-']").count();
            assertCondition(
              communicationRows === filteredMappings({ namespace: "communication" }).length,
              "Namespace filter drifted.",
            );

            await page.locator("#filter-queue-class").selectOption("callback_checkpoint");
            const callbackRows = await page.locator("[data-testid^='topology-row-']").count();
            assertCondition(
              callbackRows ===
                filteredMappings({ namespace: "communication", queueClass: "callback_checkpoint" }).length,
              "Queue class filter drifted.",
            );

            await page.locator("#filter-retry").selectOption("correlation_checkpoint_retry");
            const retryRows = await page.locator("[data-testid^='topology-row-']").count();
            assertCondition(
              retryRows ===
                filteredMappings({
                  namespace: "communication",
                  queueClass: "callback_checkpoint",
                  retryPosture: "correlation_checkpoint_retry",
                }).length,
              "Retry posture filter drifted.",
            );

            await page.locator("#filter-namespace").selectOption("all");
            await page.locator("#filter-queue-class").selectOption("all");
            await page.locator("#filter-retry").selectOption("all");
            await page.locator("#filter-consumer-group").selectOption("cg_notification_dispatch");
            await page.locator("#filter-event-state").selectOption("watch_or_review");

            const target = MAPPING.transportMappings.find(
              (row) => row.eventName === "patient.receipt.degraded",
            );
            assertCondition(Boolean(target), "Missing patient.receipt.degraded mapping.");

            await page
              .locator(`[data-testid='topology-row-${target.canonicalEventContractRef}'] .row-button`)
              .click();
            const inspectorText = await page.locator("[data-testid='inspector']").innerText();
            assertCondition(
              inspectorText.includes("patient.receipt.degraded") &&
                inspectorText.includes("q_event_notification_effects"),
              "Inspector lost expected degraded receipt detail.",
            );

            const dlqCards = await page.locator("[data-testid^='queue-card-'] [class*='queue-chip-dlq']").count();
            assertCondition(
              dlqCards > 0,
              "DLQ chips are no longer visibly distinct from ordinary queue posture.",
            );

            await page.locator("#filter-consumer-group").selectOption("all");
            await page.locator("#filter-event-state").selectOption("all");
            const rows = filteredMappings({});
            const first = rows[0];
            const second = rows[1];
            const firstRow = page.locator(`[data-testid='topology-row-${first.canonicalEventContractRef}'] .row-button`);
            await firstRow.focus();
            await page.keyboard.press("ArrowDown");
            const secondSelected = await page
              .locator(`[data-testid='topology-row-${second.canonicalEventContractRef}']`)
              .getAttribute("class");
            assertCondition(
              secondSelected?.includes("row-selected") === true,
              "Arrow-down navigation no longer advances to the next topology row.",
            );

            await page.setViewportSize({ width: 960, height: 1080 });
            await page.locator("[data-testid='inspector']").waitFor();

            const motionPage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
            try {
              await motionPage.emulateMedia({ reducedMotion: "reduce" });
              await motionPage.goto(url, { waitUntil: "networkidle" });
              const reducedMotion = await motionPage.locator("body").getAttribute("data-reduced-motion");
              assertCondition(reducedMotion === "true", "Reduced-motion posture did not activate.");
            } finally {
              await motionPage.close();
            }

            const landmarks = await page.locator("header, main, aside, section").count();
            assertCondition(landmarks >= 6, `Accessibility smoke failed: found ${landmarks} landmarks.`);
          } finally {
            await browser.close();
            await new Promise((resolve, reject) =>
              server.close((error) => (error ? reject(error) : resolve())),
            );
          }
        }

        if (process.argv.includes("--run")) {
          run().catch((error) => {
            console.error(error);
            process.exitCode = 1;
          });
        }

        export const eventSpineAtlasManifest = {
          task: MANIFEST.task_id,
          streams: MANIFEST.summary.stream_count,
          mappings: MANIFEST.summary.transport_mapping_count,
          queueGroups: MANIFEST.summary.queue_group_count,
        };
        """
    ).strip()
    write_text(SPEC_PATH, spec)


def main() -> None:
    broker_manifest, mapping_payload, policy_rows = build_manifests()
    ensure_domain_kernel_export()
    update_runtime_topology()
    write_json(BROKER_MANIFEST_PATH, broker_manifest)
    write_json(TRANSPORT_MAPPING_PATH, mapping_payload)
    write_csv(POLICY_MATRIX_PATH, policy_rows)
    write_docs(broker_manifest, mapping_payload, policy_rows)
    write_infra(broker_manifest)
    write_atlas(broker_manifest, mapping_payload, policy_rows)
    write_spec(mapping_payload)
    update_root_package()
    update_playwright_package()


if __name__ == "__main__":
    main()
