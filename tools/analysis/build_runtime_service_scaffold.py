#!/usr/bin/env python3
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from textwrap import dedent
from typing import Any

from root_script_updates import ROOT_SCRIPT_UPDATES as SHARED_ROOT_SCRIPT_UPDATES


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"
TOPOLOGY_PATH = DATA_DIR / "repo_topology_manifest.json"
DEGRADED_DEFAULTS_PATH = DATA_DIR / "degraded_mode_defaults.json"
ROOT_PACKAGE_PATH = ROOT / "package.json"
OUTPUT_MANIFEST_PATH = DATA_DIR / "service_interface_manifest.json"
MAP_PATH = DOCS_DIR / "43_service_scaffold_map.md"
SEQUENCE_PATH = DOCS_DIR / "43_runtime_service_sequence.mmd"

TASK_ID = "seq_043"
CAPTURED_ON = "2026-04-11"
VISUAL_MODE = "Runtime_Service_Map"
GENERATED_AT = datetime.now(timezone.utc).isoformat(timespec="seconds")
MISSION = (
    "Scaffold the canonical runtime service skeletons for the API gateway, command API, "
    "projection worker, and notification worker with explicit runtime boundaries, typed "
    "configuration, observability hooks, and readiness-first contract seams."
)

ROOT_SCRIPT_UPDATES = {
    "bootstrap": "pnpm install && node ./tools/dev-bootstrap/index.mjs && pnpm codegen && pnpm validate:topology && pnpm validate:runtime-topology && pnpm validate:gateway-surface && pnpm validate:events && pnpm validate:fhir && pnpm validate:frontend && pnpm validate:release-parity && pnpm validate:design-publication && pnpm validate:audit-worm && pnpm validate:scaffold && pnpm validate:services && pnpm validate:domains && pnpm validate:standards",
    "check": "pnpm lint && pnpm format:check && pnpm typecheck && pnpm test && pnpm validate:topology && pnpm validate:runtime-topology && pnpm validate:gateway-surface && pnpm validate:events && pnpm validate:fhir && pnpm validate:frontend && pnpm validate:release-parity && pnpm validate:design-publication && pnpm validate:audit-worm && pnpm validate:scaffold && pnpm validate:services && pnpm validate:domains && pnpm validate:standards",
    "codegen": "python3 ./tools/analysis/build_monorepo_scaffold.py && python3 ./tools/analysis/build_runtime_service_scaffold.py && python3 ./tools/analysis/build_domain_package_scaffold.py && python3 ./tools/analysis/build_runtime_topology_manifest.py && python3 ./tools/analysis/build_gateway_surface_map.py && python3 ./tools/analysis/build_event_registry.py && python3 ./tools/analysis/build_fhir_representation_contracts.py && python3 ./tools/analysis/build_frontend_contract_manifests.py && python3 ./tools/analysis/build_release_freeze_and_parity.py && python3 ./tools/analysis/build_design_contract_publication.py && python3 ./tools/analysis/build_audit_and_worm_strategy.py && python3 ./tools/analysis/build_engineering_standards.py && pnpm format",
    "format": "prettier --write . --ignore-unknown",
    "format:check": "prettier --check . --ignore-unknown",
    "validate:runtime-topology": "python3 ./tools/analysis/validate_runtime_topology_manifest.py",
    "validate:gateway-surface": "python3 ./tools/analysis/validate_gateway_surface_map.py",
    "validate:events": "python3 ./tools/analysis/validate_event_registry.py",
    "validate:fhir": "python3 ./tools/analysis/validate_fhir_representation_contracts.py",
    "validate:frontend": "python3 ./tools/analysis/validate_frontend_contract_manifests.py",
    "validate:release-parity": "python3 ./tools/analysis/validate_release_freeze_and_parity.py",
    "validate:design-publication": "python3 ./tools/analysis/validate_design_contract_publication.py",
    "validate:audit-worm": "python3 ./tools/analysis/validate_audit_and_worm_strategy.py",
    "validate:services": "python3 ./tools/analysis/validate_service_scaffold.py",
    "validate:domains": "python3 ./tools/analysis/validate_domain_packages.py",
    "validate:standards": "python3 ./tools/analysis/validate_engineering_standards.py",
    "branch:check": "node ./tools/git-hooks/validate-branch-name.mjs --current",
    "commit:check": "node ./tools/git-hooks/validate-commit-message.mjs",
}
ROOT_SCRIPT_UPDATES = SHARED_ROOT_SCRIPT_UPDATES

SERVICE_BLUEPRINTS: list[dict[str, Any]] = [
    {
        "artifact_id": "service_api_gateway",
        "slug": "api-gateway",
        "env_prefix": "API_GATEWAY",
        "service_port_default": 7100,
        "admin_port_default": 7200,
        "workload_family": "gateway_ingress",
        "purpose": "Own ingress HTTP, auth/session edge adapters, request correlation, rate limiting, and release-aware route-to-BFF handoff without becoming a hidden truth owner.",
        "truth_boundary": "Ingress policy only. The gateway does not own mutation settlement, projection freshness truth, or provider delivery truth.",
        "routes": [
            {
                "route_id": "list_ingress_surfaces",
                "method": "GET",
                "path": "/ingress/surfaces",
                "contract_family": "GatewayBffSurface",
                "purpose": "Expose shell-facing gateway surfaces, route families, and ingress policy seams.",
                "body_required": False,
                "idempotency_required": False,
            },
            {
                "route_id": "get_release_awareness",
                "method": "GET",
                "path": "/ingress/release-awareness",
                "contract_family": "ReleaseGateEvidence",
                "purpose": "Expose release ring, publication watch, and route-freeze awareness hooks.",
                "body_required": False,
                "idempotency_required": False,
            },
        ],
        "topics": {
            "consumes": [],
            "publishes": ["gateway.request.observed", "gateway.freeze.reviewed"],
        },
        "contract_packages": [
            "@vecells/api-contracts",
            "@vecells/authz-policy",
            "@vecells/observability",
            "@vecells/release-controls",
        ],
        "domain_packages": [],
        "dependencies": [
            "@vecells/api-contracts",
            "@vecells/authz-policy",
            "@vecells/observability",
            "@vecells/release-controls",
        ],
        "readiness_checks": [
            {
                "name": "shell_surface_contracts",
                "detail": "Published gateway surface contracts load from the shared API contract package.",
                "failure_mode": "Fail closed to read-only ingress if route surface inventory cannot load.",
            },
            {
                "name": "auth_edge_mode",
                "detail": "Auth/session edge mode remains explicit and never implies writable authority by callback alone.",
                "failure_mode": "Return claim-pending or auth-read-only posture instead of promoting to full access.",
            },
            {
                "name": "release_publication_watch",
                "detail": "Publication and route-freeze awareness hooks remain wired before ingress proceeds.",
                "failure_mode": "Downgrade to observe-only freeze posture and require operator review.",
            },
        ],
        "retry_profiles": [
            {
                "class": "transient_backoff",
                "triggers": ["downstream surface timeout", "auth edge simulator jitter"],
                "outcome": "Retry inside ingress guard window and emit gateway.request.observed watch events.",
            },
            {
                "class": "permanent_freeze",
                "triggers": ["publication drift", "route freeze enforcement"],
                "outcome": "Hold ingress at the edge and expose release-aware freeze status instead of forwarding.",
            },
        ],
        "secret_refs": [
            "AUTH_EDGE_SESSION_SECRET_REF",
            "AUTH_EDGE_SIGNING_KEY_REF",
        ],
        "env": [
            {
                "key": "RATE_LIMIT_PER_MINUTE",
                "property": "rateLimitPerMinute",
                "type": "number",
                "default": 180,
                "minimum": 1,
                "description": "Ingress allowance before gateway rate limiting becomes active.",
            },
            {
                "key": "AUTH_EDGE_MODE",
                "property": "authEdgeMode",
                "type": "enum",
                "values": ["simulator", "watch", "hybrid"],
                "default": "hybrid",
                "description": "Controls whether auth/session edge adapters run in simulator-only, watch-only, or hybrid posture.",
            },
            {
                "key": "ROUTE_FREEZE_MODE",
                "property": "routeFreezeMode",
                "type": "enum",
                "values": ["observe", "enforce"],
                "default": "observe",
                "description": "Controls whether route-freeze awareness is advisory or enforcement-based at ingress.",
            },
        ],
        "dependency_ids": ["dep_nhs_login_rail"],
    },
    {
        "artifact_id": "service_command_api",
        "slug": "command-api",
        "env_prefix": "COMMAND_API",
        "service_port_default": 7101,
        "admin_port_default": 7201,
        "workload_family": "mutation_command_ingress",
        "purpose": "Own mutation command ingress, validation, idempotency envelope reservation, route-intent hooks, mutation gates, and outbox publication seams without implementing feature logic yet.",
        "truth_boundary": "Command acceptance is not settlement truth. Finality requires downstream settlement, projection freshness, and external proof where contracts demand it.",
        "routes": [
            {
                "route_id": "submit_command",
                "method": "POST",
                "path": "/commands/submit",
                "contract_family": "MutationCommandContract",
                "purpose": "Reserve idempotency, validate route-intent hooks, and queue outbox publication.",
                "body_required": True,
                "idempotency_required": True,
            },
            {
                "route_id": "describe_command_contracts",
                "method": "GET",
                "path": "/commands/contracts",
                "contract_family": "MutationCommandContract",
                "purpose": "Expose the mutation contract seam, settlement ladder, and outbox publication shape.",
                "body_required": False,
                "idempotency_required": False,
            },
        ],
        "topics": {
            "consumes": [],
            "publishes": ["command.accepted", "command.outbox.pending"],
        },
        "contract_packages": [
            "@vecells/api-contracts",
            "@vecells/authz-policy",
            "@vecells/event-contracts",
            "@vecells/observability",
            "@vecells/release-controls",
            "@vecells/domain-kernel",
        ],
        "domain_packages": [
            "@vecells/domain-analytics-assurance",
            "@vecells/domain-identity-access",
            "@vecells/domain-intake-safety",
        ],
        "dependencies": [
            "@vecells/api-contracts",
            "@vecells/authz-policy",
            "@vecells/event-contracts",
            "@vecells/fhir-mapping",
            "@vecells/observability",
            "@vecells/release-controls",
            "@vecells/domain-kernel",
            "@vecells/domain-analytics-assurance",
            "@vecells/domain-identity-access",
            "@vecells/domain-intake-safety",
        ],
        "readiness_checks": [
            {
                "name": "idempotency_envelope",
                "detail": "An explicit idempotency reservation seam exists before commands are accepted.",
                "failure_mode": "Reject command ingress rather than creating duplicate or ambiguous mutation attempts.",
            },
            {
                "name": "route_intent_hook",
                "detail": "Route-intent validation remains explicit before a command is queued.",
                "failure_mode": "Hold the command in validation-required posture instead of inferring caller intent.",
            },
            {
                "name": "outbox_publication",
                "detail": "Outbox publication remains a separate seam from command acceptance and settlement.",
                "failure_mode": "Keep the command in accepted-but-unpublished posture and surface it via readiness manifests.",
            },
        ],
        "retry_profiles": [
            {
                "class": "transient_command_retry",
                "triggers": ["idempotency store contention", "outbox append timeout"],
                "outcome": "Retry within the bounded command window while keeping a single idempotency key in control.",
            },
            {
                "class": "manual_settlement_review",
                "triggers": ["scope mismatch", "route-intent ambiguity"],
                "outcome": "Escalate to named review rather than marking the command settled.",
            },
        ],
        "secret_refs": [
            "COMMAND_IDEMPOTENCY_STORE_REF",
            "COMMAND_MUTATION_GATE_SECRET_REF",
        ],
        "env": [
            {
                "key": "IDEMPOTENCY_TTL_SECONDS",
                "property": "idempotencyTtlSeconds",
                "type": "number",
                "default": 900,
                "minimum": 30,
                "description": "Time-to-live for reserved idempotency keys.",
            },
            {
                "key": "OUTBOX_TOPIC",
                "property": "outboxTopic",
                "type": "string",
                "default": "command.outbox.pending",
                "description": "Event topic used for deferred outbox publication.",
            },
            {
                "key": "MUTATION_GATE_MODE",
                "property": "mutationGateMode",
                "type": "enum",
                "values": ["observe", "enforce", "named_review"],
                "default": "named_review",
                "description": "Controls whether mutation gates observe, enforce, or require named review.",
            },
            {
                "key": "ROUTE_INTENT_MODE",
                "property": "routeIntentMode",
                "type": "enum",
                "values": ["required", "warn", "disabled"],
                "default": "required",
                "description": "Controls route-intent hook strictness at command ingress.",
            },
        ],
        "dependency_ids": ["dep_nhs_login_rail", "dep_pds_fhir_enrichment"],
    },
    {
        "artifact_id": "service_projection_worker",
        "slug": "projection-worker",
        "env_prefix": "PROJECTION_WORKER",
        "service_port_default": 7102,
        "admin_port_default": 7202,
        "workload_family": "projection_read_derivation",
        "purpose": "Own event consumption, rebuild/backfill hooks, projection freshness markers, stale-read posture, and dead-letter seams for derived read models.",
        "truth_boundary": "Projection output is derived read state only. It never becomes the write authority and it never hides freshness or continuity debt.",
        "routes": [
            {
                "route_id": "intake_event",
                "method": "POST",
                "path": "/events/intake",
                "contract_family": "ProjectionContractFamily",
                "purpose": "Accept an event-envelope placeholder, stage projection rebuild work, and expose dead-letter posture.",
                "body_required": True,
                "idempotency_required": False,
            },
            {
                "route_id": "projection_freshness",
                "method": "GET",
                "path": "/projections/freshness",
                "contract_family": "ProjectionQueryContract",
                "purpose": "Expose freshness budgets, stale-read posture, continuity watch, and backfill hooks.",
                "body_required": False,
                "idempotency_required": False,
            },
        ],
        "topics": {
            "consumes": ["command.accepted", "projection.rebuild.requested", "projection.backfill.requested"],
            "publishes": ["projection.updated", "projection.dead-lettered"],
        },
        "contract_packages": [
            "@vecells/api-contracts",
            "@vecells/event-contracts",
            "@vecells/fhir-mapping",
            "@vecells/observability",
            "@vecells/release-controls",
        ],
        "domain_packages": [
            "@vecells/domain-analytics-assurance",
            "@vecells/domain-operations",
        ],
        "dependencies": [
            "@vecells/api-contracts",
            "@vecells/event-contracts",
            "@vecells/fhir-mapping",
            "@vecells/observability",
            "@vecells/release-controls",
            "@vecells/domain-analytics-assurance",
            "@vecells/domain-operations",
        ],
        "readiness_checks": [
            {
                "name": "projection_freshness_budget",
                "detail": "Projection freshness budget exists before derived reads are exposed as current.",
                "failure_mode": "Shift to stale-read posture with explicit freshness markers.",
            },
            {
                "name": "dead_letter_seam",
                "detail": "Poison event and dead-letter seams exist before worker intake proceeds.",
                "failure_mode": "Divert poison events and preserve continuity evidence instead of silently dropping work.",
            },
            {
                "name": "backfill_hooks",
                "detail": "Rebuild and backfill hooks stay wired for later catch-up work.",
                "failure_mode": "Surface backfill debt explicitly rather than allowing projection drift to accumulate invisibly.",
            },
        ],
        "retry_profiles": [
            {
                "class": "transient_projection_retry",
                "triggers": ["consumer batch timeout", "projection write contention"],
                "outcome": "Retry within the freshness budget and preserve the original event lineage.",
            },
            {
                "class": "poison_event_dead_letter",
                "triggers": ["schema mismatch", "trust or continuity contradiction"],
                "outcome": "Route the event to dead-letter review and mark affected read models stale.",
            },
        ],
        "secret_refs": [
            "PROJECTION_CURSOR_STORE_REF",
            "PROJECTION_DEAD_LETTER_STORE_REF",
        ],
        "env": [
            {
                "key": "CONSUMER_BATCH_SIZE",
                "property": "consumerBatchSize",
                "type": "number",
                "default": 25,
                "minimum": 1,
                "description": "Maximum event count consumed per placeholder worker batch.",
            },
            {
                "key": "FRESHNESS_BUDGET_SECONDS",
                "property": "freshnessBudgetSeconds",
                "type": "number",
                "default": 45,
                "minimum": 1,
                "description": "Freshness budget before a projection is explicitly considered stale.",
            },
            {
                "key": "DEAD_LETTER_TOPIC",
                "property": "deadLetterTopic",
                "type": "string",
                "default": "projection.dead-lettered",
                "description": "Topic used for poison events and dead-letter review.",
            },
            {
                "key": "REBUILD_WINDOW_MODE",
                "property": "rebuildWindowMode",
                "type": "enum",
                "values": ["scheduled", "operator_only"],
                "default": "scheduled",
                "description": "Controls whether rebuild work may be scheduled automatically or requires an operator.",
            },
            {
                "key": "POISON_RETRY_LIMIT",
                "property": "poisonRetryLimit",
                "type": "number",
                "default": 3,
                "minimum": 1,
                "description": "Number of retry attempts before a poison event is dead-lettered.",
            },
        ],
        "dependency_ids": ["dep_pds_fhir_enrichment"],
    },
    {
        "artifact_id": "service_notification_worker",
        "slug": "notification-worker",
        "env_prefix": "NOTIFICATION_WORKER",
        "service_port_default": 7103,
        "admin_port_default": 7203,
        "workload_family": "notification_dispatch_and_settlement",
        "purpose": "Own dispatch envelopes, provider adapter boundaries, settlement callbacks, controlled resend hooks, and secret-safe delivery seams without embedding live provider credentials.",
        "truth_boundary": "Dispatch acceptance is not delivery truth. Provider callbacks, resend policy, and settlement evidence stay explicit and can fail closed.",
        "routes": [
            {
                "route_id": "dispatch_envelope",
                "method": "POST",
                "path": "/dispatch/envelopes",
                "contract_family": "CanonicalEventContract",
                "purpose": "Accept a placeholder dispatch envelope and expose provider/settlement seams.",
                "body_required": True,
                "idempotency_required": True,
            },
            {
                "route_id": "dispatch_settlement",
                "method": "GET",
                "path": "/dispatch/settlement",
                "contract_family": "DependencyDegradationProfile",
                "purpose": "Expose delivery settlement ladder, resend controls, and safe provider boundary posture.",
                "body_required": False,
                "idempotency_required": False,
            },
        ],
        "topics": {
            "consumes": [
                "notification.dispatch.requested",
                "notification.resend.requested",
                "notification.provider.callback",
            ],
            "publishes": [
                "notification.dispatch.accepted",
                "notification.delivery.settled",
                "notification.delivery.dead-lettered",
            ],
        },
        "contract_packages": [
            "@vecells/api-contracts",
            "@vecells/authz-policy",
            "@vecells/event-contracts",
            "@vecells/observability",
            "@vecells/release-controls",
        ],
        "domain_packages": [
            "@vecells/domain-communications",
            "@vecells/domain-identity-access",
            "@vecells/domain-support",
        ],
        "dependencies": [
            "@vecells/api-contracts",
            "@vecells/authz-policy",
            "@vecells/event-contracts",
            "@vecells/observability",
            "@vecells/release-controls",
            "@vecells/domain-communications",
            "@vecells/domain-identity-access",
            "@vecells/domain-support",
        ],
        "readiness_checks": [
            {
                "name": "provider_secret_boundary",
                "detail": "Provider credentials and webhook material remain env-ref-only and never land in fixtures or manifests.",
                "failure_mode": "Fail closed before any placeholder provider action is attempted.",
            },
            {
                "name": "delivery_settlement",
                "detail": "Delivery callbacks and settlement status remain separate from dispatch acceptance.",
                "failure_mode": "Mark the envelope awaiting_settlement and hold resend review open.",
            },
            {
                "name": "controlled_resend",
                "detail": "Resend is an explicit hook with cooldown or named-review posture, not an automatic blind retry.",
                "failure_mode": "Escalate to review-required resend posture.",
            },
        ],
        "retry_profiles": [
            {
                "class": "transient_provider_retry",
                "triggers": ["provider timeout", "callback jitter", "temporary suppression"],
                "outcome": "Retry inside the delivery window while preserving envelope lineage and idempotency.",
            },
            {
                "class": "permanent_delivery_review",
                "triggers": ["hard bounce", "invalid destination", "provider suppression"],
                "outcome": "Escalate to settlement review or manual resend rather than inferring recovery.",
            },
        ],
        "secret_refs": [
            "NOTIFICATION_PROVIDER_SECRET_REF",
            "NOTIFICATION_WEBHOOK_SECRET_REF",
            "NOTIFICATION_SIGNING_KEY_REF",
        ],
        "env": [
            {
                "key": "DISPATCH_BATCH_SIZE",
                "property": "dispatchBatchSize",
                "type": "number",
                "default": 50,
                "minimum": 1,
                "description": "Maximum number of envelopes staged in one placeholder dispatch batch.",
            },
            {
                "key": "PROVIDER_MODE",
                "property": "providerMode",
                "type": "enum",
                "values": ["simulator", "shadow", "hybrid"],
                "default": "simulator",
                "description": "Controls whether provider adapters run in simulator, shadow, or hybrid posture.",
            },
            {
                "key": "CALLBACK_SETTLEMENT_WINDOW_SECONDS",
                "property": "callbackSettlementWindowSeconds",
                "type": "number",
                "default": 300,
                "minimum": 1,
                "description": "How long the worker waits before delivery becomes explicitly settlement-pending.",
            },
            {
                "key": "RESEND_GUARD_MODE",
                "property": "resendGuardMode",
                "type": "enum",
                "values": ["manual_review", "cooldown_only"],
                "default": "manual_review",
                "description": "Controls whether resend requires named review or a cooldown-only gate.",
            },
        ],
        "dependency_ids": ["dep_sms_notification_provider", "dep_email_notification_provider"],
    },
]


def read_json(path: Path) -> Any:
    return json.loads(path.read_text())


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n")


def write_json(path: Path, payload: Any) -> None:
    write_text(path, json.dumps(payload, indent=2))


def package_name_for_artifact(artifact: dict[str, Any]) -> str:
    repo_path = artifact["repo_path"]
    if repo_path.startswith("packages/domains/"):
        return f"@vecells/domain-{Path(repo_path).name.replace('_', '-')}"
    return f"@vecells/{Path(repo_path).name}"


def sync_root_package_json() -> None:
    package_json = read_json(ROOT_PACKAGE_PATH)
    scripts = package_json.setdefault("scripts", {})
    scripts.update(ROOT_SCRIPT_UPDATES)
    write_json(ROOT_PACKAGE_PATH, package_json)


def load_topology_artifacts() -> dict[str, dict[str, Any]]:
    topology = read_json(TOPOLOGY_PATH)
    return {artifact["artifact_id"]: artifact for artifact in topology["artifacts"]}


def load_dependency_index() -> dict[str, dict[str, Any]]:
    payload = read_json(DEGRADED_DEFAULTS_PATH)
    return {dependency["dependency_id"]: dependency for dependency in payload["dependencies"]}


def build_manifest(artifacts: dict[str, dict[str, Any]], dependency_index: dict[str, dict[str, Any]]) -> dict[str, Any]:
    services: list[dict[str, Any]] = []
    unique_topics: set[str] = set()
    unique_dependencies: set[str] = set()
    unique_packages: set[str] = set()

    for blueprint in SERVICE_BLUEPRINTS:
        artifact = artifacts[blueprint["artifact_id"]]
        dependency_profiles = []
        for dependency_id in blueprint["dependency_ids"]:
            dependency = dependency_index[dependency_id]
            dependency_profiles.append(
                {
                    "dependency_id": dependency["dependency_id"],
                    "dependency_name": dependency["dependency_name"],
                    "blocker_label": dependency["blocker_label"],
                    "ambiguity_label": dependency["ambiguity_label"],
                    "degraded_mode_default": dependency["degraded_mode_default"],
                    "manual_fallback_default": dependency["manual_fallback_default"],
                    "default_contract_axis": dependency["default_contract_axis"],
                }
            )
            unique_dependencies.add(dependency_id)

        all_packages = blueprint["contract_packages"] + blueprint["domain_packages"]
        unique_packages.update(all_packages)
        unique_topics.update(blueprint["topics"]["consumes"])
        unique_topics.update(blueprint["topics"]["publishes"])

        services.append(
            {
                "artifact_id": artifact["artifact_id"],
                "service_slug": blueprint["slug"],
                "display_name": artifact["display_name"],
                "package_name": package_name_for_artifact(artifact),
                "repo_path": artifact["repo_path"],
                "owner_context_code": artifact["owner_context_code"],
                "owner_context_label": artifact["owner_context_label"],
                "workload_family": blueprint["workload_family"],
                "purpose": blueprint["purpose"],
                "truth_boundary": blueprint["truth_boundary"],
                "ports": {
                    "service": {
                        "env_keys": [f"{blueprint['env_prefix']}_SERVICE_PORT", f"{blueprint['env_prefix']}_PORT"],
                        "default": blueprint["service_port_default"],
                    },
                    "admin": {
                        "env_keys": [f"{blueprint['env_prefix']}_ADMIN_PORT"],
                        "default": blueprint["admin_port_default"],
                    },
                },
                "routes": blueprint["routes"],
                "topics": blueprint["topics"],
                "contract_packages": blueprint["contract_packages"],
                "domain_packages": blueprint["domain_packages"],
                "dependency_packages": blueprint["dependencies"],
                "allowed_dependency_rules": artifact["allowed_dependencies"],
                "forbidden_dependency_rules": artifact["forbidden_dependencies"],
                "readiness_checks": blueprint["readiness_checks"],
                "retry_profiles": blueprint["retry_profiles"],
                "secret_refs": blueprint["secret_refs"],
                "env_contract": blueprint["env"],
                "dependency_profiles": dependency_profiles,
                "admin_routes": ["/health", "/ready", "/manifest"],
                "test_harnesses": [
                    {"kind": "unit", "path": f"{artifact['repo_path']}/tests/config.test.js"},
                    {"kind": "integration", "path": f"{artifact['repo_path']}/tests/runtime.integration.test.js"},
                ],
                "composition_root": f"{artifact['repo_path']}/src/runtime.ts#createRuntime",
            }
        )

    return {
        "task_id": TASK_ID,
        "generated_at": GENERATED_AT,
        "captured_on": CAPTURED_ON,
        "visual_mode": VISUAL_MODE,
        "mission": MISSION,
        "source_precedence": [
            "prompt/043.md",
            "prompt/shared_operating_contract_036_to_045.md",
            "prompt/AGENT.md",
            "prompt/checklist.md",
            "data/analysis/repo_topology_manifest.json",
            "data/analysis/degraded_mode_defaults.json",
            "data/analysis/monorepo_scaffold_manifest.json",
            "docs/architecture/41_repository_topology_rules.md",
            "docs/architecture/42_monorepo_scaffold_plan.md",
            "blueprint/phase-0-the-foundation-protocol.md",
            "blueprint/platform-runtime-and-release-blueprint.md",
            "blueprint/platform-frontend-blueprint.md",
            "blueprint/forensic-audit-findings.md",
        ],
        "summary": {
            "service_count": len(services),
            "route_count": sum(len(service["routes"]) for service in services),
            "topic_count": len(unique_topics),
            "package_count": len(unique_packages),
            "degraded_dependency_count": len(unique_dependencies),
        },
        "services": services,
    }


def build_service_scripts() -> dict[str, str]:
    return {
        "build": "tsc -p tsconfig.json",
        "lint": "eslint src tests --ext .ts,.js",
        "test": "vitest run",
        "typecheck": "tsc -p tsconfig.json --noEmit",
        "dev": "tsx watch src/index.ts",
    }


def build_service_package_json(service: dict[str, Any]) -> dict[str, Any]:
    return {
        "name": service["package_name"],
        "private": True,
        "version": "0.0.0",
        "type": "module",
        "description": f"{service['display_name']} runtime scaffold with typed config, readiness endpoints, and contract seams.",
        "scripts": build_service_scripts(),
        "dependencies": {package_name: "workspace:*" for package_name in service["dependency_packages"]},
    }


def build_service_readme(service: dict[str, Any]) -> str:
    route_rows = "\n".join(
        f"| `{route['method']}` | `{route['path']}` | `{route['contract_family']}` | {route['purpose']} |"
        for route in service["routes"]
    )
    topic_lines = "\n".join(f"- `{topic}`" for topic in service["topics"]["publishes"]) or "- none"
    consume_lines = "\n".join(f"- `{topic}`" for topic in service["topics"]["consumes"]) or "- none"
    allowed = "\n".join(f"- `{item}`" for item in service["allowed_dependency_rules"]) or "- none"
    forbidden = "\n".join(f"- `{item}`" for item in service["forbidden_dependency_rules"]) or "- none"
    secret_refs = "\n".join(f"- `{item}`" for item in service["secret_refs"])
    test_lines = "\n".join(f"- `{item['kind']}`: `{item['path']}`" for item in service["test_harnesses"])
    env_rows = "\n".join(
        f"| `{service['service_slug'].replace('-', '_').upper()}_{item['key']}` | `{item['type']}` | `{item['default']}` | {item['description']} |"
        for item in service["env_contract"]
    )
    dependency_rows = "\n".join(
        f"| `{item['dependency_id']}` | {item['dependency_name']} | {item['degraded_mode_default']} | {item['manual_fallback_default']} |"
        for item in service["dependency_profiles"]
    ) or "| none | none | none | none |"
    return dedent(
        f"""
        # {service['display_name']}

        - Package: `{service['package_name']}`
        - Repo path: `{service['repo_path']}`
        - Owner: `{service['owner_context_label']}` (`{service['owner_context_code']}`)
        - Workload family: `{service['workload_family']}`

        ## Purpose

        {service['purpose']}

        ## Truth Boundary

        {service['truth_boundary']}

        ## Port Contract

        - Service port env keys: `{service['ports']['service']['env_keys'][0]}`, compatibility fallback `{service['ports']['service']['env_keys'][1]}`
        - Admin port env key: `{service['ports']['admin']['env_keys'][0]}`
        - Default ports: service `{service['ports']['service']['default']}`, admin `{service['ports']['admin']['default']}`

        ## Route Catalog

        | Method | Path | Contract family | Purpose |
        | --- | --- | --- | --- |
        {route_rows}

        ## Topics Consumed

        {consume_lines}

        ## Topics Published

        {topic_lines}

        ## Allowed Dependencies

        {allowed}

        ## Forbidden Dependencies

        {forbidden}

        ## Secret Boundaries

        {secret_refs}

        ## Environment Contract

        | Env key | Type | Default | Purpose |
        | --- | --- | --- | --- |
        {env_rows}

        ## Degraded Dependency Profiles

        | Dependency id | Dependency | Degraded default | Manual fallback |
        | --- | --- | --- | --- |
        {dependency_rows}

        ## Test Harnesses

        {test_lines}
        """
    ).strip()


def ts_literal_for_type(env_row: dict[str, Any]) -> str:
    field_type = env_row["type"]
    if field_type == "number":
        return "number"
    if field_type == "string":
        return "string"
    if field_type == "enum":
        return " | ".join(json.dumps(value) for value in env_row["values"])
    raise ValueError(f"Unsupported env type {field_type}")


def build_config_source(service: dict[str, Any]) -> str:
    interface_fields = []
    parse_fields = []
    redacted_fields = []
    helper_blocks = []
    for env_row in service["env_contract"]:
        property_name = env_row["property"]
        interface_fields.append(f"  {property_name}: {ts_literal_for_type(env_row)};")
        env_key = f"{service['service_slug'].replace('-', '_').upper()}_{env_row['key']}"
        if env_row["type"] == "number":
            parse_fields.append(
                f'    {property_name}: readNumber(env, "{env_key}", {env_row["default"]}, {env_row["minimum"]}),'
            )
        elif env_row["type"] == "string":
            parse_fields.append(
                f'    {property_name}: readString(env, "{env_key}", {json.dumps(env_row["default"])}),'
            )
        elif env_row["type"] == "enum":
            values_literal = "[" + ", ".join(json.dumps(value) for value in env_row["values"]) + "] as const"
            parse_fields.append(
                f'    {property_name}: readEnum(env, "{env_key}", {values_literal}, {json.dumps(env_row["default"])}),'
            )
        redacted_fields.append(f"    {property_name}: config.{property_name},")

    env_prefix = service["service_slug"].replace("-", "_").upper()
    secret_refs_literal = json.dumps(service["secret_refs"], indent=2)
    if any(row["type"] == "string" for row in service["env_contract"]):
        helper_blocks.append(
            dedent(
                """
                function readString(env: Record<string, string | undefined>, key: string, fallback: string): string {
                  const value = env[key];
                  return value && value.trim().length > 0 ? value.trim() : fallback;
                }
                """
            ).strip()
        )
    return dedent(
        f"""
        export type ServiceEnvironment = "local" | "test" | "ci" | "staging" | "production";
        export type LogLevel = "debug" | "info" | "warn" | "error";

        export interface ServiceConfig {{
          serviceName: "{service['service_slug']}";
          environment: ServiceEnvironment;
          logLevel: LogLevel;
          servicePort: number;
          adminPort: number;
          maxPayloadBytes: number;
          gracefulShutdownMs: number;
          otelEnabled: boolean;
          secretRefs: readonly string[];
        {chr(10).join(interface_fields)}
        }}

        const SERVICE_SECRET_REFS = {secret_refs_literal} as const;

        {chr(10).join(helper_blocks)}

        function readNumber(
          env: Record<string, string | undefined>,
          key: string,
          fallback: number,
          minimum: number,
        ): number {{
          const raw = env[key];
          if (!raw) {{
            return fallback;
          }}
          const parsed = Number(raw);
          if (!Number.isFinite(parsed) || parsed < minimum) {{
            throw new Error(`Invalid ${{key}} value: expected number >= ${{minimum}}`);
          }}
          return parsed;
        }}

        function readNumberFromKeys(
          env: Record<string, string | undefined>,
          keys: readonly string[],
          fallback: number,
          minimum: number,
        ): number {{
          for (const key of keys) {{
            const raw = env[key];
            if (raw) {{
              return readNumber(env, key, fallback, minimum);
            }}
          }}
          return fallback;
        }}

        function readBoolean(env: Record<string, string | undefined>, key: string, fallback: boolean): boolean {{
          const raw = env[key];
          if (!raw) {{
            return fallback;
          }}
          if (raw === "true") {{
            return true;
          }}
          if (raw === "false") {{
            return false;
          }}
          throw new Error(`Invalid ${{key}} value: expected true or false`);
        }}

        function readEnum<TValue extends string>(
          env: Record<string, string | undefined>,
          key: string,
          values: readonly TValue[],
          fallback: TValue,
        ): TValue {{
          const raw = env[key];
          if (!raw) {{
            return fallback;
          }}
          if (!values.includes(raw as TValue)) {{
            throw new Error(`Invalid ${{key}} value: expected one of ${{values.join(", ")}}`);
          }}
          return raw as TValue;
        }}

        export function loadConfig(env: Record<string, string | undefined> = process.env): ServiceConfig {{
          const config: ServiceConfig = {{
            serviceName: "{service['service_slug']}",
            environment: readEnum(env, "VECELLS_ENVIRONMENT", ["local", "test", "ci", "staging", "production"] as const, "local"),
            logLevel: readEnum(env, "{env_prefix}_LOG_LEVEL", ["debug", "info", "warn", "error"] as const, "info"),
            servicePort: readNumberFromKeys(env, ["{env_prefix}_SERVICE_PORT", "{env_prefix}_PORT"], {service['ports']['service']['default']}, 0),
            adminPort: readNumber(env, "{env_prefix}_ADMIN_PORT", {service['ports']['admin']['default']}, 0),
            maxPayloadBytes: readNumber(env, "{env_prefix}_MAX_PAYLOAD_BYTES", 65536, 1),
            gracefulShutdownMs: readNumber(env, "{env_prefix}_GRACEFUL_SHUTDOWN_MS", 5000, 1),
            otelEnabled: readBoolean(env, "{env_prefix}_ENABLE_OTEL", False),
            secretRefs: SERVICE_SECRET_REFS,
        {chr(10).join(parse_fields)}
          }};

          if (config.servicePort == config.adminPort && config.servicePort !== 0) {{
            throw new Error("Service and admin ports must remain distinct");
          }}

          return config;
        }}

        export function redactConfig(config: ServiceConfig): Record<string, unknown> {{
          return {{
            serviceName: config.serviceName,
            environment: config.environment,
            logLevel: config.logLevel,
            servicePort: config.servicePort,
            adminPort: config.adminPort,
            maxPayloadBytes: config.maxPayloadBytes,
            gracefulShutdownMs: config.gracefulShutdownMs,
            otelEnabled: config.otelEnabled,
            secretRefs: [...config.secretRefs],
        {chr(10).join(redacted_fields)}
          }};
        }}
        """
    ).strip().replace("False", "false")


def build_runtime_source() -> str:
    return dedent(
        """
        import http, { type IncomingMessage, type ServerResponse } from "node:http";
        import { randomUUID } from "node:crypto";
        import {
          advanceCorrelationHop,
          mintEdgeCorrelation,
          readCorrelationFromHeaders,
          serializeCorrelationHeaders,
          type EdgeCorrelationContext,
        } from "@vecells/observability";
        import { redactConfig, type ServiceConfig } from "./config";
        import {
          buildWorkloadResponse,
          serviceDefinition,
          type ServiceRouteDefinition,
          type WorkloadRequestContext,
        } from "./service-definition";

        interface LogFields {
          [key: string]: unknown;
        }

        export interface StructuredLogger {
          info(event: string, fields?: LogFields): void;
          warn(event: string, fields?: LogFields): void;
          error(event: string, fields?: LogFields): void;
        }

        export interface RuntimePorts {
          service: number;
          admin: number;
        }

        export interface ReadinessState {
          name: string;
          detail: string;
          failureMode: string;
          status: "ready";
        }

        export interface ServiceRuntime {
          readonly definition: typeof serviceDefinition;
          readonly config: ServiceConfig;
          readonly logger: StructuredLogger;
          readonly readiness: ReadinessState[];
          readonly ports: RuntimePorts;
          start(): Promise<void>;
          stop(): Promise<void>;
        }

        function createLogger(config: ServiceConfig): StructuredLogger {
          const emit = (level: string, event: string, fields: LogFields = {}): void => {
            console.log(
              JSON.stringify({
                level,
                event,
                service: config.serviceName,
                environment: config.environment,
                otelHook: config.otelEnabled ? "stubbed_http_span_emitter" : "disabled",
                ...fields,
              }),
            );
          };

          return {
            info(event: string, fields?: LogFields) {
              emit("info", event, fields);
            },
            warn(event: string, fields?: LogFields) {
              emit("warn", event, fields);
            },
            error(event: string, fields?: LogFields) {
              emit("error", event, fields);
            },
          };
        }

        function normalizeHeaders(request: IncomingMessage): Record<string, string> {
          const pairs = Object.entries(request.headers).map(([key, value]) => {
            if (Array.isArray(value)) {
              return [key, value.join(",")] as const;
            }
            return [key, value ?? ""] as const;
          });
          return Object.fromEntries(pairs);
        }

        function resolveCorrelationId(headers: Record<string, string>): string {
          return headers["x-correlation-id"] || headers["x-request-id"] || randomUUID();
        }

        function resolveTraceId(headers: Record<string, string>, correlationId: string): string {
          return headers["x-trace-id"] || correlationId;
        }

        function resolveRuntimeHopKind(): "gateway" | "command_handler" | "worker" {
          const workloadFamily = serviceDefinition.workloadFamily as string;
          if (workloadFamily === "gateway_ingress") {
            return "gateway";
          }
          if (workloadFamily === "mutation_command_ingress") {
            return "command_handler";
          }
          return "worker";
        }

        function buildEdgeCorrelation(
          headers: Record<string, string>,
          method: string,
          pathname: string,
          config: ServiceConfig,
        ): EdgeCorrelationContext {
          const emittedAt = new Date().toISOString();
          const hopKind = resolveRuntimeHopKind();

          if (hopKind === "gateway") {
            const incoming = readCorrelationFromHeaders(headers);
            if (incoming) {
              return advanceCorrelationHop(incoming, {
                hopKind,
                serviceRef: serviceDefinition.service,
                environment: config.environment,
                emittedAt,
                requestMethod: method,
                requestPath: pathname,
              });
            }
            return mintEdgeCorrelation({
              environment: config.environment,
              serviceRef: serviceDefinition.service,
              hopKind,
              requestMethod: method,
              requestPath: pathname,
              issuedAt: emittedAt,
            });
          }

          const incoming = readCorrelationFromHeaders(headers, { requireContext: true });
          if (!incoming) {
            throw new Error("EDGE_CORRELATION_CONTEXT_REQUIRED");
          }
          return advanceCorrelationHop(incoming, {
            hopKind,
            serviceRef: serviceDefinition.service,
            environment: config.environment,
            emittedAt,
            requestMethod: method,
            requestPath: pathname,
          });
        }

        async function readRequestBody(request: IncomingMessage, maxPayloadBytes: number): Promise<unknown> {
          if (request.method === "GET" || request.method === "HEAD") {
            return undefined;
          }

          const chunks: Buffer[] = [];
          let size = 0;
          for await (const chunk of request) {
            const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
            size += buffer.length;
            if (size > maxPayloadBytes) {
              throw new Error("PAYLOAD_TOO_LARGE");
            }
            chunks.push(buffer);
          }

          if (chunks.length === 0) {
            return undefined;
          }

          const raw = Buffer.concat(chunks).toString("utf8").trim();
          if (!raw) {
            return undefined;
          }

          try {
            return JSON.parse(raw);
          } catch {
            throw new Error("INVALID_JSON_BODY");
          }
        }

        function respondJson(
          response: ServerResponse,
          statusCode: number,
          correlationId: string,
          traceId: string,
          edgeCorrelation: EdgeCorrelationContext | undefined,
          body: unknown,
        ): void {
          response.writeHead(statusCode, {
            "content-type": "application/json; charset=utf-8",
            "cache-control": "no-store",
            "x-correlation-id": correlationId,
            "x-trace-id": traceId,
            ...(edgeCorrelation ? serializeCorrelationHeaders(edgeCorrelation) : {}),
          });
          response.end(JSON.stringify(body));
        }

        function matchRoute(method: string, pathname: string): ServiceRouteDefinition | undefined {
          return serviceDefinition.routeCatalog.find((route) => route.method === method && route.path === pathname);
        }

        function listen(server: http.Server, port: number): Promise<void> {
          return new Promise((resolve, reject) => {
            server.once("error", reject);
            server.listen(port, "127.0.0.1", () => {
              server.removeListener("error", reject);
              resolve();
            });
          });
        }

        function getBoundPort(server: http.Server): number {
          const address = server.address();
          if (!address || typeof address === "string") {
            throw new Error("Server address unavailable");
          }
          return address.port;
        }

        function closeServer(server: http.Server, timeoutMs: number): Promise<void> {
          return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
              reject(new Error(`Server close exceeded ${timeoutMs}ms`));
            }, timeoutMs);
            server.close((error) => {
              clearTimeout(timer);
              if (error) {
                reject(error);
                return;
              }
              resolve();
            });
          });
        }

        export function createRuntime(config: ServiceConfig): ServiceRuntime {
          const logger = createLogger(config);
          const readiness: ReadinessState[] = serviceDefinition.readinessChecks.map((check) => ({
            name: check.name,
            detail: check.detail,
            failureMode: check.failureMode,
            status: "ready",
          }));

          let serviceServer: http.Server | undefined;
          let adminServer: http.Server | undefined;
          const ports: RuntimePorts = {
            service: config.servicePort,
            admin: config.adminPort,
          };

          const runtime: ServiceRuntime = {
            definition: serviceDefinition,
            config,
            logger,
            readiness,
            ports,
            async start(): Promise<void> {
              if (serviceServer || adminServer) {
                return;
              }

              serviceServer = http.createServer(async (request, response) => {
                const method = request.method?.toUpperCase() ?? "GET";
                const pathname = new URL(request.url ?? "/", "http://127.0.0.1").pathname;
                const headers = normalizeHeaders(request);
                const correlationId = resolveCorrelationId(headers);
                const traceId = resolveTraceId(headers, correlationId);
                const route = matchRoute(method, pathname);

                if (!route) {
                  respondJson(response, 404, correlationId, traceId, undefined, {
                    ok: false,
                    error: "ROUTE_NOT_FOUND",
                    availableRoutes: serviceDefinition.routeCatalog.map((item) => ({
                      method: item.method,
                      path: item.path,
                    })),
                  });
                  return;
                }

                const edgeCorrelation = buildEdgeCorrelation(headers, method, pathname, config);

                if (route.idempotencyRequired && !headers["idempotency-key"]) {
                  respondJson(response, 400, correlationId, traceId, edgeCorrelation, {
                    ok: false,
                    error: "IDEMPOTENCY_KEY_REQUIRED",
                    routeId: route.routeId,
                  });
                  return;
                }

                try {
                  const requestBody = await readRequestBody(request, config.maxPayloadBytes);
                  if (route.bodyRequired && requestBody === undefined) {
                    respondJson(response, 400, correlationId, traceId, edgeCorrelation, {
                      ok: false,
                      error: "REQUEST_BODY_REQUIRED",
                      routeId: route.routeId,
                    });
                    return;
                  }

                  const context: WorkloadRequestContext = {
                    correlationId,
                    traceId,
                    config,
                    headers,
                    requestBody,
                    readiness,
                  };

                  const payload = buildWorkloadResponse(route, context);
                  logger.info("service_request_completed", {
                    routeId: route.routeId,
                    correlationId,
                    traceId,
                    edgeCorrelationId: edgeCorrelation.edgeCorrelationId,
                    causalToken: edgeCorrelation.causalToken,
                    statusCode: payload.statusCode,
                  });
                  respondJson(
                    response,
                    payload.statusCode,
                    correlationId,
                    traceId,
                    edgeCorrelation,
                    payload.body,
                  );
                } catch (error) {
                  const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
                  const statusCode = message === "PAYLOAD_TOO_LARGE" ? 413 : 400;
                  logger.warn("service_request_rejected", {
                    routeId: route.routeId,
                    correlationId,
                    traceId,
                    error: message,
                  });
                  respondJson(response, statusCode, correlationId, traceId, undefined, {
                    ok: false,
                    error: message,
                    routeId: route.routeId,
                  });
                }
              });

              adminServer = http.createServer((request, response) => {
                const pathname = new URL(request.url ?? "/", "http://127.0.0.1").pathname;
                const headers = normalizeHeaders(request);
                const correlationId = resolveCorrelationId(headers);
                const traceId = resolveTraceId(headers, correlationId);

                if (pathname === "/health") {
                  respondJson(response, 200, correlationId, traceId, undefined, {
                    ok: true,
                    service: serviceDefinition.service,
                    workloadFamily: serviceDefinition.workloadFamily,
                    ports,
                    uptimeSeconds: Math.floor(process.uptime()),
                  });
                  return;
                }

                if (pathname === "/ready") {
                  respondJson(response, 200, correlationId, traceId, undefined, {
                    ok: readiness.every((item) => item.status === "ready"),
                    service: serviceDefinition.service,
                    readiness,
                  });
                  return;
                }

                if (pathname === "/manifest") {
                  respondJson(response, 200, correlationId, traceId, undefined, {
                    definition: serviceDefinition,
                    config: redactConfig(config),
                  });
                  return;
                }

                respondJson(response, 404, correlationId, traceId, undefined, {
                  ok: false,
                  error: "ADMIN_ROUTE_NOT_FOUND",
                  adminRoutes: serviceDefinition.adminRoutes,
                });
              });

              await Promise.all([listen(serviceServer, config.servicePort), listen(adminServer, config.adminPort)]);
              ports.service = getBoundPort(serviceServer);
              ports.admin = getBoundPort(adminServer);

              logger.info("service_runtime_started", {
                servicePort: ports.service,
                adminPort: ports.admin,
                routeCount: serviceDefinition.routeCatalog.length,
              });
            },
            async stop(): Promise<void> {
              const closers: Promise<void>[] = [];
              if (serviceServer) {
                closers.push(closeServer(serviceServer, config.gracefulShutdownMs));
              }
              if (adminServer) {
                closers.push(closeServer(adminServer, config.gracefulShutdownMs));
              }
              await Promise.all(closers);
              serviceServer = undefined;
              adminServer = undefined;
              logger.info("service_runtime_stopped", {
                servicePort: ports.service,
                adminPort: ports.admin,
              });
            },
          };

          return runtime;
        }
        """
    ).strip()


def build_index_source() -> str:
    return dedent(
        """
        import { fileURLToPath } from "node:url";
        import { loadConfig } from "./config";
        import { createRuntime } from "./runtime";

        type ShutdownSignal = "SIGINT" | "SIGTERM";

        export async function main(): Promise<void> {
          const runtime = createRuntime(loadConfig());
          await runtime.start();

          let stopping = false;
          const shutdown = async (signal: ShutdownSignal): Promise<void> => {
            if (stopping) {
              return;
            }
            stopping = true;
            runtime.logger.info("shutdown_signal_received", { signal });
            await runtime.stop();
            process.exit(0);
          };

          process.on("SIGINT", () => {
            void shutdown("SIGINT");
          });
          process.on("SIGTERM", () => {
            void shutdown("SIGTERM");
          });
        }

        const entrypoint = process.argv[1];
        if (entrypoint && fileURLToPath(import.meta.url) === entrypoint) {
          void main().catch((error: unknown) => {
            console.error(error);
            process.exit(1);
          });
        }
        """
    ).strip()


def build_config_test_source(service: dict[str, Any]) -> str:
    prefix = service["service_slug"].replace("-", "_").upper()
    env_asserts = "\n".join(
        f'    expect(config.{item["property"]}).toBe({json.dumps(item["default"])});'
        for item in service["env_contract"]
    )
    first_env = service["env_contract"][0]
    invalid_key = f"{prefix}_{first_env['key']}"
    invalid_value = '"invalid"' if first_env["type"] == "number" else json.dumps("not-valid")
    return dedent(
        f"""
        import {{ describe, expect, it }} from "vitest";
        import {{ loadConfig, redactConfig }} from "../src/config.ts";

        describe("{service['service_slug']} config", () => {{
          it("loads secure defaults", () => {{
            const config = loadConfig({{
              VECELLS_ENVIRONMENT: "test",
            }});

            expect(config.serviceName).toBe("{service['service_slug']}");
            expect(config.servicePort).toBe({service['ports']['service']['default']});
            expect(config.adminPort).toBe({service['ports']['admin']['default']});
            expect(config.secretRefs.length).toBe({len(service['secret_refs'])});
        {env_asserts}

            const redacted = redactConfig(config);
            expect(redacted.secretRefs).toEqual([...config.secretRefs]);
          }});

          it("fails closed on invalid env", () => {{
            expect(() =>
              loadConfig({{
                VECELLS_ENVIRONMENT: "test",
                {invalid_key}: {invalid_value},
              }})
            ).toThrow(/Invalid/);
          }});
        }});
        """
    ).strip()


def build_runtime_integration_test_source(service: dict[str, Any]) -> str:
    route = service["routes"][0]
    prefix = service["service_slug"].replace("-", "_").upper()
    extra_env = service["env_contract"][0]
    payload = {"routeIntent": "rf_patient_home", "channel": "test-envelope"}
    if service["service_slug"] == "projection-worker":
        payload = {"eventType": "projection.placeholder.rebuild", "projectionName": "patient-home"}
    if service["service_slug"] == "notification-worker":
        payload = {"channel": "email", "template": "support-follow-up"}
    headers = '{"x-correlation-id": correlationId, "content-type": "application/json"}'
    if route["idempotency_required"]:
        headers = '{"x-correlation-id": correlationId, "idempotency-key": "idem-test-001", "content-type": "application/json"}'
    request_body = f", body: JSON.stringify({json.dumps(payload)})" if route["method"] == "POST" else ""
    route_assert = "expect(body.service).toBe(serviceDefinition.service);"
    if service["service_slug"] == "api-gateway":
        route_assert = "expect(body.rateLimitPerMinute).toBe(config.rateLimitPerMinute);"
    elif service["service_slug"] == "command-api":
        route_assert = "expect(body.outbox.topic).toBe(config.outboxTopic);"
    elif service["service_slug"] == "projection-worker":
        route_assert = "expect(body.deadLetter.topic).toBe(config.deadLetterTopic);"
    elif service["service_slug"] == "notification-worker":
        route_assert = "expect(body.providerAdapter.mode).toBe(config.providerMode);"
    return dedent(
        f"""
        import {{ afterEach, describe, expect, it }} from "vitest";
        import {{ loadConfig }} from "../src/config.ts";
        import {{ createRuntime }} from "../src/runtime.ts";
        import {{ serviceDefinition }} from "../src/service-definition.ts";

        describe("{service['service_slug']} runtime", () => {{
          let runtime;

          afterEach(async () => {{
            if (runtime) {{
              await runtime.stop();
              runtime = undefined;
            }}
          }});

          it("serves health, readiness, and correlation-aware workload routes", async () => {{
            const config = loadConfig({{
              VECELLS_ENVIRONMENT: "test",
              {prefix}_SERVICE_PORT: "0",
              {prefix}_ADMIN_PORT: "0",
              {prefix}_{extra_env['key']}: {json.dumps(str(extra_env['default']))},
            }});

            runtime = createRuntime(config);
            await runtime.start();

            const healthResponse = await fetch(`http://127.0.0.1:${{runtime.ports.admin}}/health`);
            expect(healthResponse.status).toBe(200);
            const healthBody = await healthResponse.json();
            expect(healthBody.service).toBe(serviceDefinition.service);

            const readyResponse = await fetch(`http://127.0.0.1:${{runtime.ports.admin}}/ready`);
            expect(readyResponse.status).toBe(200);
            const readyBody = await readyResponse.json();
            expect(readyBody.ok).toBe(true);

            const correlationId = "corr-{service['service_slug']}";
            const routeResponse = await fetch(`http://127.0.0.1:${{runtime.ports.service}}{route['path']}`, {{
              method: "{route['method']}",
              headers: {headers},
              {f"body: JSON.stringify({json.dumps(payload)})," if route['method'] == 'POST' else ""}
            }});
            expect(routeResponse.status).toBe(200);
            expect(routeResponse.headers.get("x-correlation-id")).toBe(correlationId);
            const body = await routeResponse.json();
            {route_assert}
          }});
        }});
        """
    ).strip()


def build_service_definition_source(service: dict[str, Any]) -> str:
    if service["service_slug"] == "api-gateway":
        return dedent(
            """
            import { shellSurfaceContracts } from "@vecells/api-contracts";
            import { foundationPolicyScopes } from "@vecells/authz-policy";
            import { createShellSignal } from "@vecells/observability";
            import { foundationReleasePosture } from "@vecells/release-controls";
            import type { ServiceConfig } from "./config";

            export interface ServiceRouteDefinition {
              routeId: string;
              method: "GET" | "POST";
              path: string;
              contractFamily: string;
              purpose: string;
              bodyRequired: boolean;
              idempotencyRequired: boolean;
            }

            export interface WorkloadRequestContext {
              correlationId: string;
              traceId: string;
              config: ServiceConfig;
              headers: Record<string, string>;
              requestBody: unknown;
              readiness: ReadonlyArray<{ name: string; status: "ready" }>;
            }

            export interface WorkloadResponse {
              statusCode: number;
              body: unknown;
            }

            const surfaceLedger = Object.values(shellSurfaceContracts).map((contract) => ({
              shellSlug: contract.shellSlug,
              routeFamilyIds: [...contract.routeFamilyIds],
              gatewaySurfaceIds: [...contract.gatewaySurfaceIds],
              publication: foundationReleasePosture[contract.shellSlug].publication,
              watchSignal: createShellSignal(contract.shellSlug, contract.routeFamilyIds, contract.gatewaySurfaceIds),
            }));

            export const serviceDefinition = {
              service: "api-gateway",
              packageName: "@vecells/api-gateway",
              ownerContext: "platform_runtime",
              workloadFamily: "gateway_ingress",
              purpose:
                "Own ingress HTTP, auth/session edge adapters, request correlation, rate limiting, and release-aware route-to-BFF handoff without becoming a hidden truth owner.",
              truthBoundary:
                "Ingress policy only. The gateway does not own mutation settlement, projection freshness truth, or provider delivery truth.",
              adminRoutes: ["/health", "/ready", "/manifest"],
              routeCatalog: [
                {
                  routeId: "list_ingress_surfaces",
                  method: "GET",
                  path: "/ingress/surfaces",
                  contractFamily: "GatewayBffSurface",
                  purpose: "Expose shell-facing gateway surfaces, route families, and ingress policy seams.",
                  bodyRequired: false,
                  idempotencyRequired: false,
                },
                {
                  routeId: "get_release_awareness",
                  method: "GET",
                  path: "/ingress/release-awareness",
                  contractFamily: "ReleaseGateEvidence",
                  purpose: "Expose release ring, publication watch, and route-freeze awareness hooks.",
                  bodyRequired: false,
                  idempotencyRequired: false,
                },
              ] as const satisfies readonly ServiceRouteDefinition[],
              topics: {
                consumes: [],
                publishes: ["gateway.request.observed", "gateway.freeze.reviewed"],
              },
              readinessChecks: [
                {
                  name: "shell_surface_contracts",
                  detail: "Published gateway surface contracts load from the shared API contract package.",
                  failureMode: "Fail closed to read-only ingress if route surface inventory cannot load.",
                },
                {
                  name: "auth_edge_mode",
                  detail: "Auth/session edge mode remains explicit and never implies writable authority by callback alone.",
                  failureMode: "Return claim-pending or auth-read-only posture instead of promoting to full access.",
                },
                {
                  name: "release_publication_watch",
                  detail: "Publication and route-freeze awareness hooks remain wired before ingress proceeds.",
                  failureMode: "Downgrade to observe-only freeze posture and require operator review.",
                },
              ] as const,
              retryProfiles: [
                {
                  class: "transient_backoff",
                  triggers: ["downstream surface timeout", "auth edge simulator jitter"],
                  outcome: "Retry inside ingress guard window and emit gateway.request.observed watch events.",
                },
                {
                  class: "permanent_freeze",
                  triggers: ["publication drift", "route freeze enforcement"],
                  outcome: "Hold ingress at the edge and expose release-aware freeze status instead of forwarding.",
                },
              ] as const,
              secretBoundaries: ["AUTH_EDGE_SESSION_SECRET_REF", "AUTH_EDGE_SIGNING_KEY_REF"] as const,
              testHarnesses: ["tests/config.test.js", "tests/runtime.integration.test.js"] as const,
            } as const;

            export function buildWorkloadResponse(
              route: ServiceRouteDefinition,
              context: WorkloadRequestContext,
            ): WorkloadResponse {
              if (route.routeId === "list_ingress_surfaces") {
                return {
                  statusCode: 200,
                  body: {
                    service: serviceDefinition.service,
                    correlationId: context.correlationId,
                    traceId: context.traceId,
                    rateLimitPerMinute: context.config.rateLimitPerMinute,
                    authEdgeMode: context.config.authEdgeMode,
                    routeFreezeMode: context.config.routeFreezeMode,
                    policyScopes: Object.keys(foundationPolicyScopes),
                    surfaces: surfaceLedger,
                  },
                };
              }

              return {
                statusCode: 200,
                body: {
                  service: serviceDefinition.service,
                  correlationId: context.correlationId,
                  traceId: context.traceId,
                  releaseFreezeMode: context.config.routeFreezeMode,
                  publicationMatrix: surfaceLedger.map((surface) => ({
                    shellSlug: surface.shellSlug,
                    publication: surface.publication,
                    gatewaySurfaceCount: surface.gatewaySurfaceIds.length,
                  })),
                  watchSignals: surfaceLedger.map((surface) => surface.watchSignal),
                },
              };
            }
            """
        ).strip()

    if service["service_slug"] == "command-api":
        return dedent(
            """
            import { shellSurfaceContracts } from "@vecells/api-contracts";
            import { foundationPolicyScopes } from "@vecells/authz-policy";
            import { domainModule as identityAccessDomain } from "@vecells/domain-identity-access";
            import { domainModule as intakeSafetyDomain } from "@vecells/domain-intake-safety";
            import { packageMetadata as kernelMetadata } from "@vecells/domain-kernel";
            import { makeFoundationEvent } from "@vecells/event-contracts";
            import { foundationReleasePosture } from "@vecells/release-controls";
            import type { ServiceConfig } from "./config";

            export interface ServiceRouteDefinition {
              routeId: string;
              method: "GET" | "POST";
              path: string;
              contractFamily: string;
              purpose: string;
              bodyRequired: boolean;
              idempotencyRequired: boolean;
            }

            export interface WorkloadRequestContext {
              correlationId: string;
              traceId: string;
              config: ServiceConfig;
              headers: Record<string, string>;
              requestBody: unknown;
              readiness: ReadonlyArray<{ name: string; status: "ready" }>;
            }

            export interface WorkloadResponse {
              statusCode: number;
              body: unknown;
            }

            const routeIntentFamilies = [
              ...shellSurfaceContracts["patient-web"].routeFamilyIds,
              ...shellSurfaceContracts["clinical-workspace"].routeFamilyIds,
            ];

            export const serviceDefinition = {
              service: "command-api",
              packageName: "@vecells/command-api",
              ownerContext: "platform_runtime",
              workloadFamily: "mutation_command_ingress",
              purpose:
                "Own mutation command ingress, validation, idempotency envelope reservation, route-intent hooks, mutation gates, and outbox publication seams without implementing feature logic yet.",
              truthBoundary:
                "Command acceptance is not settlement truth. Finality requires downstream settlement, projection freshness, and external proof where contracts demand it.",
              adminRoutes: ["/health", "/ready", "/manifest"],
              routeCatalog: [
                {
                  routeId: "submit_command",
                  method: "POST",
                  path: "/commands/submit",
                  contractFamily: "MutationCommandContract",
                  purpose: "Reserve idempotency, validate route-intent hooks, and queue outbox publication.",
                  bodyRequired: true,
                  idempotencyRequired: true,
                },
                {
                  routeId: "describe_command_contracts",
                  method: "GET",
                  path: "/commands/contracts",
                  contractFamily: "MutationCommandContract",
                  purpose: "Expose the mutation contract seam, settlement ladder, and outbox publication shape.",
                  bodyRequired: false,
                  idempotencyRequired: false,
                },
              ] as const satisfies readonly ServiceRouteDefinition[],
              topics: {
                consumes: [],
                publishes: ["command.accepted", "command.outbox.pending"],
              },
              readinessChecks: [
                {
                  name: "idempotency_envelope",
                  detail: "An explicit idempotency reservation seam exists before commands are accepted.",
                  failureMode: "Reject command ingress rather than creating duplicate or ambiguous mutation attempts.",
                },
                {
                  name: "route_intent_hook",
                  detail: "Route-intent validation remains explicit before a command is queued.",
                  failureMode: "Hold the command in validation-required posture instead of inferring caller intent.",
                },
                {
                  name: "outbox_publication",
                  detail: "Outbox publication remains a separate seam from command acceptance and settlement.",
                  failureMode: "Keep the command in accepted-but-unpublished posture and surface it via readiness manifests.",
                },
              ] as const,
              retryProfiles: [
                {
                  class: "transient_command_retry",
                  triggers: ["idempotency store contention", "outbox append timeout"],
                  outcome: "Retry within the bounded command window while keeping a single idempotency key in control.",
                },
                {
                  class: "manual_settlement_review",
                  triggers: ["scope mismatch", "route-intent ambiguity"],
                  outcome: "Escalate to named review rather than marking the command settled.",
                },
              ] as const,
              secretBoundaries: ["COMMAND_IDEMPOTENCY_STORE_REF", "COMMAND_MUTATION_GATE_SECRET_REF"] as const,
              testHarnesses: ["tests/config.test.js", "tests/runtime.integration.test.js"] as const,
            } as const;

            export function buildWorkloadResponse(
              route: ServiceRouteDefinition,
              context: WorkloadRequestContext,
            ): WorkloadResponse {
              if (route.routeId === "describe_command_contracts") {
                return {
                  statusCode: 200,
                  body: {
                    service: serviceDefinition.service,
                    contractFamily: route.contractFamily,
                    idempotencyTtlSeconds: context.config.idempotencyTtlSeconds,
                    outboxTopic: context.config.outboxTopic,
                    mutationGateMode: context.config.mutationGateMode,
                    routeIntentMode: context.config.routeIntentMode,
                    supportedRouteFamilies: routeIntentFamilies,
                    kernelMetadata,
                    domainPackages: [identityAccessDomain, intakeSafetyDomain],
                  },
                };
              }

              const requestBody =
                typeof context.requestBody === "object" && context.requestBody !== null
                  ? (context.requestBody as Record<string, unknown>)
                  : {};
              const routeIntent = typeof requestBody.routeIntent === "string" ? requestBody.routeIntent : null;

              return {
                statusCode: 200,
                body: {
                  service: serviceDefinition.service,
                  accepted: true,
                  correlationId: context.correlationId,
                  traceId: context.traceId,
                  envelope: makeFoundationEvent("command.placeholder.accepted", {
                    idempotencyKey: context.headers["idempotency-key"],
                    routeIntent,
                    kernelMetadata,
                  }),
                  idempotency: {
                    key: context.headers["idempotency-key"],
                    ttlSeconds: context.config.idempotencyTtlSeconds,
                    status: "reserved",
                  },
                  mutationGate: {
                    mode: context.config.mutationGateMode,
                    releaseRing: foundationReleasePosture["clinical-workspace"].ring,
                    requiredScope: foundationPolicyScopes.triage_review,
                  },
                  routeIntentValidation: {
                    mode: context.config.routeIntentMode,
                    observedRouteIntent: routeIntent,
                    supportedRouteFamilies: routeIntentFamilies,
                    status: routeIntent ? "observed" : "missing_but_stubbed",
                  },
                  settlement: {
                    state: "awaiting_settlement_evidence",
                    note: "Acceptance never implies settlement truth.",
                  },
                  outbox: {
                    topic: context.config.outboxTopic,
                    status: "queued_stub",
                  },
                },
              };
            }
            """
        ).strip()

    if service["service_slug"] == "projection-worker":
        return dedent(
            """
            import { shellSurfaceContracts } from "@vecells/api-contracts";
            import { domainModule as analyticsDomain } from "@vecells/domain-analytics-assurance";
            import { domainModule as operationsDomain } from "@vecells/domain-operations";
            import { makeFoundationEvent } from "@vecells/event-contracts";
            import { foundationFhirMappings } from "@vecells/fhir-mapping";
            import { createShellSignal } from "@vecells/observability";
            import { foundationReleasePosture } from "@vecells/release-controls";
            import type { ServiceConfig } from "./config";

            export interface ServiceRouteDefinition {
              routeId: string;
              method: "GET" | "POST";
              path: string;
              contractFamily: string;
              purpose: string;
              bodyRequired: boolean;
              idempotencyRequired: boolean;
            }

            export interface WorkloadRequestContext {
              correlationId: string;
              traceId: string;
              config: ServiceConfig;
              headers: Record<string, string>;
              requestBody: unknown;
              readiness: ReadonlyArray<{ name: string; status: "ready" }>;
            }

            export interface WorkloadResponse {
              statusCode: number;
              body: unknown;
            }

            const patientSignal = createShellSignal(
              "patient-web",
              shellSurfaceContracts["patient-web"].routeFamilyIds,
              shellSurfaceContracts["patient-web"].gatewaySurfaceIds,
            );
            const opsSignal = createShellSignal(
              "ops-console",
              shellSurfaceContracts["ops-console"].routeFamilyIds,
              shellSurfaceContracts["ops-console"].gatewaySurfaceIds,
            );

            export const serviceDefinition = {
              service: "projection-worker",
              packageName: "@vecells/projection-worker",
              ownerContext: "platform_runtime",
              workloadFamily: "projection_read_derivation",
              purpose:
                "Own event consumption, rebuild/backfill hooks, projection freshness markers, stale-read posture, and dead-letter seams for derived read models.",
              truthBoundary:
                "Projection output is derived read state only. It never becomes the write authority and it never hides freshness or continuity debt.",
              adminRoutes: ["/health", "/ready", "/manifest"],
              routeCatalog: [
                {
                  routeId: "intake_event",
                  method: "POST",
                  path: "/events/intake",
                  contractFamily: "ProjectionContractFamily",
                  purpose: "Accept an event-envelope placeholder, stage projection rebuild work, and expose dead-letter posture.",
                  bodyRequired: true,
                  idempotencyRequired: false,
                },
                {
                  routeId: "projection_freshness",
                  method: "GET",
                  path: "/projections/freshness",
                  contractFamily: "ProjectionQueryContract",
                  purpose: "Expose freshness budgets, stale-read posture, continuity watch, and backfill hooks.",
                  bodyRequired: false,
                  idempotencyRequired: false,
                },
              ] as const satisfies readonly ServiceRouteDefinition[],
              topics: {
                consumes: ["command.accepted", "projection.rebuild.requested", "projection.backfill.requested"],
                publishes: ["projection.updated", "projection.dead-lettered"],
              },
              readinessChecks: [
                {
                  name: "projection_freshness_budget",
                  detail: "Projection freshness budget exists before derived reads are exposed as current.",
                  failureMode: "Shift to stale-read posture with explicit freshness markers.",
                },
                {
                  name: "dead_letter_seam",
                  detail: "Poison event and dead-letter seams exist before worker intake proceeds.",
                  failureMode: "Divert poison events and preserve continuity evidence instead of silently dropping work.",
                },
                {
                  name: "backfill_hooks",
                  detail: "Rebuild and backfill hooks stay wired for later catch-up work.",
                  failureMode: "Surface backfill debt explicitly rather than allowing projection drift to accumulate invisibly.",
                },
              ] as const,
              retryProfiles: [
                {
                  class: "transient_projection_retry",
                  triggers: ["consumer batch timeout", "projection write contention"],
                  outcome: "Retry within the freshness budget and preserve the original event lineage.",
                },
                {
                  class: "poison_event_dead_letter",
                  triggers: ["schema mismatch", "trust or continuity contradiction"],
                  outcome: "Route the event to dead-letter review and mark affected read models stale.",
                },
              ] as const,
              secretBoundaries: ["PROJECTION_CURSOR_STORE_REF", "PROJECTION_DEAD_LETTER_STORE_REF"] as const,
              testHarnesses: ["tests/config.test.js", "tests/runtime.integration.test.js"] as const,
            } as const;

            export function buildWorkloadResponse(
              route: ServiceRouteDefinition,
              context: WorkloadRequestContext,
            ): WorkloadResponse {
              if (route.routeId === "projection_freshness") {
                return {
                  statusCode: 200,
                  body: {
                    service: serviceDefinition.service,
                    freshnessBudgetSeconds: context.config.freshnessBudgetSeconds,
                    rebuildWindowMode: context.config.rebuildWindowMode,
                    projections: [
                      {
                        name: "patient-home",
                        freshnessState: "within_budget",
                        staleAfterSeconds: context.config.freshnessBudgetSeconds,
                        continuitySignal: patientSignal,
                      },
                      {
                        name: "ops-telemetry",
                        freshnessState: "watch",
                        staleAfterSeconds: context.config.freshnessBudgetSeconds,
                        continuitySignal: opsSignal,
                      },
                    ],
                    releaseWatch: foundationReleasePosture["ops-console"],
                    domainPackages: [analyticsDomain, operationsDomain],
                  },
                };
              }

              const requestBody =
                typeof context.requestBody === "object" && context.requestBody !== null
                  ? (context.requestBody as Record<string, unknown>)
                  : {};
              const projectionName =
                typeof requestBody.projectionName === "string" ? requestBody.projectionName : "patient-home";

              return {
                statusCode: 200,
                body: {
                  service: serviceDefinition.service,
                  accepted: true,
                  correlationId: context.correlationId,
                  traceId: context.traceId,
                  eventEnvelope: makeFoundationEvent("projection.placeholder.accepted", {
                    projectionName,
                    mappings: foundationFhirMappings,
                  }),
                  worker: {
                    consumerBatchSize: context.config.consumerBatchSize,
                    rebuildWindowMode: context.config.rebuildWindowMode,
                  },
                  deadLetter: {
                    topic: context.config.deadLetterTopic,
                    poisonRetryLimit: context.config.poisonRetryLimit,
                    status: "armed",
                  },
                  continuity: {
                    patientSignal,
                    opsSignal,
                    posture: "stale-read-explicit",
                  },
                },
              };
            }
            """
        ).strip()

    return dedent(
        """
        import { shellSurfaceContracts } from "@vecells/api-contracts";
        import { foundationPolicyScopes } from "@vecells/authz-policy";
        import { domainModule as communicationsDomain } from "@vecells/domain-communications";
        import { domainModule as identityAccessDomain } from "@vecells/domain-identity-access";
        import { domainModule as supportDomain } from "@vecells/domain-support";
        import { makeFoundationEvent } from "@vecells/event-contracts";
        import { foundationReleasePosture } from "@vecells/release-controls";
        import type { ServiceConfig } from "./config";

        export interface ServiceRouteDefinition {
          routeId: string;
          method: "GET" | "POST";
          path: string;
          contractFamily: string;
          purpose: string;
          bodyRequired: boolean;
          idempotencyRequired: boolean;
        }

        export interface WorkloadRequestContext {
          correlationId: string;
          traceId: string;
          config: ServiceConfig;
          headers: Record<string, string>;
          requestBody: unknown;
          readiness: ReadonlyArray<{ name: string; status: "ready" }>;
        }

        export interface WorkloadResponse {
          statusCode: number;
          body: unknown;
        }

        const replayFamilies = shellSurfaceContracts["support-workspace"].routeFamilyIds;

        export const serviceDefinition = {
          service: "notification-worker",
          packageName: "@vecells/notification-worker",
          ownerContext: "platform_integration",
          workloadFamily: "notification_dispatch_and_settlement",
          purpose:
            "Own dispatch envelopes, provider adapter boundaries, settlement callbacks, controlled resend hooks, and secret-safe delivery seams without embedding live provider credentials.",
          truthBoundary:
            "Dispatch acceptance is not delivery truth. Provider callbacks, resend policy, and settlement evidence stay explicit and can fail closed.",
          adminRoutes: ["/health", "/ready", "/manifest"],
          routeCatalog: [
            {
              routeId: "dispatch_envelope",
              method: "POST",
              path: "/dispatch/envelopes",
              contractFamily: "CanonicalEventContract",
              purpose: "Accept a placeholder dispatch envelope and expose provider and settlement seams.",
              bodyRequired: true,
              idempotencyRequired: true,
            },
            {
              routeId: "dispatch_settlement",
              method: "GET",
              path: "/dispatch/settlement",
              contractFamily: "DependencyDegradationProfile",
              purpose: "Expose delivery settlement ladder, resend controls, and safe provider boundary posture.",
              bodyRequired: false,
              idempotencyRequired: false,
            },
          ] as const satisfies readonly ServiceRouteDefinition[],
          topics: {
            consumes: [
              "notification.dispatch.requested",
              "notification.resend.requested",
              "notification.provider.callback",
            ],
            publishes: [
              "notification.dispatch.accepted",
              "notification.delivery.settled",
              "notification.delivery.dead-lettered",
            ],
          },
          readinessChecks: [
            {
              name: "provider_secret_boundary",
              detail: "Provider credentials and webhook material remain env-ref-only and never land in fixtures or manifests.",
              failureMode: "Fail closed before any placeholder provider action is attempted.",
            },
            {
              name: "delivery_settlement",
              detail: "Delivery callbacks and settlement status remain separate from dispatch acceptance.",
              failureMode: "Mark the envelope awaiting_settlement and hold resend review open.",
            },
            {
              name: "controlled_resend",
              detail: "Resend is an explicit hook with cooldown or named-review posture, not an automatic blind retry.",
              failureMode: "Escalate to review-required resend posture.",
            },
          ] as const,
          retryProfiles: [
            {
              class: "transient_provider_retry",
              triggers: ["provider timeout", "callback jitter", "temporary suppression"],
              outcome: "Retry inside the delivery window while preserving envelope lineage and idempotency.",
            },
            {
              class: "permanent_delivery_review",
              triggers: ["hard bounce", "invalid destination", "provider suppression"],
              outcome: "Escalate to settlement review or manual resend rather than inferring recovery.",
            },
          ] as const,
          secretBoundaries: [
            "NOTIFICATION_PROVIDER_SECRET_REF",
            "NOTIFICATION_WEBHOOK_SECRET_REF",
            "NOTIFICATION_SIGNING_KEY_REF",
          ] as const,
          testHarnesses: ["tests/config.test.js", "tests/runtime.integration.test.js"] as const,
        } as const;

        export function buildWorkloadResponse(
          route: ServiceRouteDefinition,
          context: WorkloadRequestContext,
        ): WorkloadResponse {
          if (route.routeId === "dispatch_settlement") {
            return {
              statusCode: 200,
              body: {
                service: serviceDefinition.service,
                providerMode: context.config.providerMode,
                callbackSettlementWindowSeconds: context.config.callbackSettlementWindowSeconds,
                resendGuardMode: context.config.resendGuardMode,
                replayRouteFamilies: replayFamilies,
                deliverySettlementStates: ["awaiting_callback", "delivered", "failed", "review_required"],
                releaseWatch: foundationReleasePosture["support-workspace"],
                domainPackages: [communicationsDomain, identityAccessDomain, supportDomain],
              },
            };
          }

          const requestBody =
            typeof context.requestBody === "object" && context.requestBody !== null
              ? (context.requestBody as Record<string, unknown>)
              : {};
          const channel = typeof requestBody.channel === "string" ? requestBody.channel : "email";

          return {
            statusCode: 200,
            body: {
              service: serviceDefinition.service,
              accepted: true,
              correlationId: context.correlationId,
              traceId: context.traceId,
              dispatchBatchSize: context.config.dispatchBatchSize,
              providerAdapter: {
                mode: context.config.providerMode,
                channel,
                secretBoundary: "env-ref-only",
              },
              resendPolicy: {
                mode: context.config.resendGuardMode,
                governanceScope: foundationPolicyScopes.governance_release,
              },
              settlement: {
                state: "awaiting_provider_callback",
                callbackWindowSeconds: context.config.callbackSettlementWindowSeconds,
              },
              outboxEnvelope: makeFoundationEvent("notification.placeholder.dispatch.accepted", {
                channel,
                idempotencyKey: context.headers["idempotency-key"],
              }),
            },
          };
        }
        """
    ).strip()


def build_service_files(manifest: dict[str, Any]) -> None:
    for service in manifest["services"]:
        repo_root = ROOT / service["repo_path"]
        write_json(repo_root / "package.json", build_service_package_json(service))
        write_text(repo_root / "README.md", build_service_readme(service))
        write_text(repo_root / "src" / "config.ts", build_config_source(service))
        write_text(repo_root / "src" / "runtime.ts", build_runtime_source())
        write_text(repo_root / "src" / "service-definition.ts", build_service_definition_source(service))
        write_text(repo_root / "src" / "index.ts", build_index_source())
        write_text(repo_root / "tests" / "config.test.js", build_config_test_source(service))
        write_text(repo_root / "tests" / "runtime.integration.test.js", build_runtime_integration_test_source(service))


def build_map_doc(manifest: dict[str, Any]) -> str:
    summary = manifest["summary"]
    service_rows = "\n".join(
        f"| `{service['service_slug']}` | `{service['owner_context_code']}` | `{service['workload_family']}` | `{service['ports']['service']['default']}` / `{service['ports']['admin']['default']}` | `{len(service['routes'])}` | `{len(service['topics']['publishes'])}` | {service['truth_boundary']} |"
        for service in manifest["services"]
    )
    sections = []
    for service in manifest["services"]:
        route_rows = "\n".join(
            f"| `{route['method']}` | `{route['path']}` | `{route['contract_family']}` | {route['purpose']} |"
            for route in service["routes"]
        )
        dependency_rows = "\n".join(
            f"| `{item['dependency_id']}` | {item['ambiguity_label']} | {item['degraded_mode_default']} | {item['manual_fallback_default']} |"
            for item in service["dependency_profiles"]
        ) or "| none | none | none | none |"
        sections.append(
            dedent(
                f"""
                ### {service['display_name']}

                - Repo path: `{service['repo_path']}`
                - Purpose: {service['purpose']}
                - Truth boundary: {service['truth_boundary']}
                - Composition root: `{service['composition_root']}`

                | Method | Path | Contract family | Purpose |
                | --- | --- | --- | --- |
                {route_rows}

                | Dependency id | Ambiguity class | Degraded default | Manual fallback |
                | --- | --- | --- | --- |
                {dependency_rows}
                """
            ).strip()
        )

    return dedent(
        f"""
        # 43 Service Scaffold Map

        ## Mission

        {manifest['mission']}

        ## Summary

        - Visual mode: `{manifest['visual_mode']}`
        - Service count: `{summary['service_count']}`
        - Route count: `{summary['route_count']}`
        - Topic count: `{summary['topic_count']}`
        - Package count: `{summary['package_count']}`
        - Degraded dependency count: `{summary['degraded_dependency_count']}`

        ## Service Register

        | Service | Owner | Workload family | Ports (service/admin) | Routes | Publishes | Truth boundary |
        | --- | --- | --- | --- | --- | --- | --- |
        {service_rows}

        ## Runtime Conventions

        - Every service owns separate service and admin ports and exposes `/health`, `/ready`, and `/manifest` from the admin listener.
        - Every work route propagates `x-correlation-id` and `x-trace-id` headers and emits structured JSON logs.
        - No service reaches into another context's private internals; imports remain pinned to shared contracts or public domain entrypoints only.
        - Command acceptance, projection update, and notification dispatch remain seams, not proof of final truth.

        ## Service Detail

        {"\n\n".join(sections)}
        """
    ).strip()


def build_sequence_doc() -> str:
    return dedent(
        """
        sequenceDiagram
          autonumber
          actor Shell as Shell Client
          participant Gateway as API Gateway
          participant Command as Command API
          participant Bus as Outbox and Event Bus
          participant Projection as Projection Worker
          participant ReadModel as Projection Freshness Cache
          participant Notification as Notification Worker
          participant Provider as Provider Adapter Twin
          participant Ops as Ops and Governance

          Shell->>Gateway: HTTP request with route intent and correlation headers
          Gateway->>Gateway: Auth edge, rate limit, release watch, route freeze awareness
          Gateway->>Command: Mutation envelope or route-scoped handoff
          Command->>Command: Validation, idempotency reservation, mutation gate, settlement seam
          Command-->>Bus: command.accepted and command.outbox.pending
          Bus-->>Projection: Event intake, rebuild request, or backfill request
          Projection->>Projection: Freshness budget, stale-read markers, dead-letter seam
          Projection-->>ReadModel: projection.updated with continuity and trust posture
          Bus-->>Notification: notification.dispatch.requested or notification.resend.requested
          Notification->>Notification: Provider boundary, secret refs, resend guard, settlement window
          Notification->>Provider: Placeholder email or SMS adapter call
          Provider-->>Notification: Delivery callback or permanent failure signal
          Notification-->>Bus: notification.delivery.settled or notification.delivery.dead-lettered
          Ops->>Gateway: /ready and /manifest probe
          Ops->>Projection: /projections/freshness probe
          Ops->>Notification: /dispatch/settlement probe
        """
    ).strip()


def main() -> None:
    sync_root_package_json()
    artifacts = load_topology_artifacts()
    dependency_index = load_dependency_index()
    manifest = build_manifest(artifacts, dependency_index)
    write_json(OUTPUT_MANIFEST_PATH, manifest)
    write_text(MAP_PATH, build_map_doc(manifest))
    write_text(SEQUENCE_PATH, build_sequence_doc())
    build_service_files(manifest)
    print(f"{TASK_ID} service scaffold generated")


if __name__ == "__main__":
    main()
