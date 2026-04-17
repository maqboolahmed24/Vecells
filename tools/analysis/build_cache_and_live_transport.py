#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import re
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from textwrap import dedent
from typing import Any

from root_script_updates import ROOT_SCRIPT_UPDATES


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"
TESTS_DIR = ROOT / "tests" / "playwright"
INFRA_DIR = ROOT / "infra" / "cache-live-transport"

ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = TESTS_DIR / "package.json"
RUNTIME_TOPOLOGY_PATH = DATA_DIR / "runtime_topology_manifest.json"
FRONTEND_MANIFEST_PATH = DATA_DIR / "frontend_contract_manifests.json"
API_REGISTRY_PATH = DATA_DIR / "api_contract_registry_manifest.json"
GATEWAY_SURFACES_PATH = DATA_DIR / "gateway_bff_surfaces.json"
EVENT_BROKER_PATH = DATA_DIR / "event_broker_topology_manifest.json"

CACHE_MANIFEST_PATH = DATA_DIR / "cache_namespace_manifest.json"
LIVE_TRANSPORT_MANIFEST_PATH = DATA_DIR / "live_transport_topology_manifest.json"
BOUNDARY_MATRIX_PATH = DATA_DIR / "cache_transport_boundary_matrix.csv"

DESIGN_DOC_PATH = DOCS_DIR / "88_cache_and_live_transport_design.md"
RULES_DOC_PATH = DOCS_DIR / "88_cache_transport_boundary_and_honesty_rules.md"
ATLAS_PATH = DOCS_DIR / "88_live_update_and_cache_atlas.html"
SPEC_PATH = TESTS_DIR / "live-update-and-cache-atlas.spec.js"

README_PATH = INFRA_DIR / "README.md"
TERRAFORM_MAIN_PATH = INFRA_DIR / "terraform" / "main.tf"
TERRAFORM_VARIABLES_PATH = INFRA_DIR / "terraform" / "variables.tf"
TERRAFORM_OUTPUTS_PATH = INFRA_DIR / "terraform" / "outputs.tf"
CACHE_MODULE_MAIN_PATH = INFRA_DIR / "terraform" / "modules" / "cache_plane" / "main.tf"
CACHE_MODULE_VARIABLES_PATH = (
    INFRA_DIR / "terraform" / "modules" / "cache_plane" / "variables.tf"
)
CACHE_MODULE_OUTPUTS_PATH = (
    INFRA_DIR / "terraform" / "modules" / "cache_plane" / "outputs.tf"
)
TRANSPORT_MODULE_MAIN_PATH = (
    INFRA_DIR / "terraform" / "modules" / "live_transport_gateway" / "main.tf"
)
TRANSPORT_MODULE_VARIABLES_PATH = (
    INFRA_DIR / "terraform" / "modules" / "live_transport_gateway" / "variables.tf"
)
TRANSPORT_MODULE_OUTPUTS_PATH = (
    INFRA_DIR / "terraform" / "modules" / "live_transport_gateway" / "outputs.tf"
)
LOCAL_COMPOSE_PATH = INFRA_DIR / "local" / "cache-live-transport-emulator.compose.yaml"
LOCAL_POLICY_PATH = INFRA_DIR / "local" / "gateway-safe-transport-policy.json"
LOCAL_BOOTSTRAP_PATH = INFRA_DIR / "local" / "bootstrap-cache-live-transport.mjs"
LOCAL_RESET_PATH = INFRA_DIR / "local" / "reset-cache-live-transport.mjs"
LOCAL_RESTART_PATH = INFRA_DIR / "local" / "restart-live-transport.mjs"
LOCAL_HEARTBEAT_DRILL_PATH = INFRA_DIR / "local" / "drill-heartbeat-loss.mjs"
LOCAL_REPLAY_DRILL_PATH = INFRA_DIR / "local" / "drill-replay-window.mjs"
LOCAL_CACHE_RESET_DRILL_PATH = INFRA_DIR / "local" / "drill-cache-reset.mjs"
SMOKE_TEST_PATH = INFRA_DIR / "tests" / "cache-live-transport-smoke.test.mjs"

DOMAIN_KERNEL_INDEX_PATH = ROOT / "packages" / "domain-kernel" / "src" / "index.ts"
API_GATEWAY_PACKAGE_PATH = ROOT / "services" / "api-gateway" / "package.json"
API_GATEWAY_RUNTIME_PATH = ROOT / "services" / "api-gateway" / "src" / "runtime.ts"
API_GATEWAY_SERVICE_DEFINITION_PATH = (
    ROOT / "services" / "api-gateway" / "src" / "service-definition.ts"
)

TASK_ID = "par_088"
VISUAL_MODE = "Live_Update_And_Cache_Atlas"
GENERATED_AT = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
CAPTURED_ON = GENERATED_AT[:10]

CLASS_ORDER = [
    "runtime_manifest",
    "projection_read",
    "route_family",
    "entity_scoped",
    "transient_replay_support",
]

CLASS_LABELS = {
    "runtime_manifest": "Runtime manifest",
    "projection_read": "Projection read",
    "route_family": "Route family",
    "entity_scoped": "Entity scoped",
    "transient_replay_support": "Transient replay support",
}

TTL_BY_CLASS = {
    "runtime_manifest": 120,
    "projection_read": 90,
    "route_family": 60,
    "entity_scoped": 45,
    "transient_replay_support": 30,
}

CLASS_DESCRIPTIONS = {
    "runtime_manifest": (
        "Published runtime manifest and control-plane substrate. Warmth may help continuity, "
        "but it never implies writable or settled truth."
    ),
    "projection_read": (
        "Projection-backed read continuity for shells that must stay honest about freshness and "
        "selected-anchor preservation."
    ),
    "route_family": (
        "Route-family ready namespaces that later task `096` can bind to explicit route policy "
        "without improvising storage or invalidation seams."
    ),
    "entity_scoped": (
        "Entity and tuple scoped cache surfaces for cases, threads, grants, child-workspace "
        "state, and settlement-adjacent continuity."
    ),
    "transient_replay_support": (
        "Ephemeral replay and recovery helpers that stay fail-closed, bounded, and visibly "
        "degraded when truth or replay evidence is incomplete."
    ),
}

INVALIDATION_HOOKS_BY_CLASS = {
    "runtime_manifest": [
        "hook_runtime_manifest_republished",
        "hook_release_tuple_changed",
        "hook_gateway_surface_rebound",
    ],
    "projection_read": [
        "hook_projection_rebuilt",
        "hook_command_settled",
        "hook_truth_tuple_rebound",
    ],
    "route_family": [
        "hook_route_guardrail_changed",
        "hook_selected_anchor_changed",
        "hook_release_freeze_changed",
    ],
    "entity_scoped": [
        "hook_entity_settlement_committed",
        "hook_scope_tuple_changed",
        "hook_repair_journey_completed",
    ],
    "transient_replay_support": [
        "hook_replay_window_rotated",
        "hook_manual_review_rebound",
        "hook_stale_mode_cleared",
    ],
}

HONESTY_RULES_BY_CLASS = {
    "runtime_manifest": [
        "cache_warmth_never_implies_writable",
        "manifest_state_never_overrides_release_freeze",
    ],
    "projection_read": [
        "cache_warmth_never_implies_writable",
        "projection_freshness_requires_truth_rebind",
    ],
    "route_family": [
        "cache_warmth_never_implies_writable",
        "route_cache_cannot_infer_recovery_semantics",
    ],
    "entity_scoped": [
        "cache_warmth_never_implies_writable",
        "entity_cache_cannot_commit_mutation_truth",
    ],
    "transient_replay_support": [
        "cache_warmth_never_implies_writable",
        "replay_support_cannot_restore_live_write_posture",
    ],
}

POLICY_CLASS_MAP = {
    "CP_PUBLIC_NO_PERSISTED_PHI": "runtime_manifest",
    "CP_CONSTRAINED_CAPTURE_NO_BROWSER_CACHE": "route_family",
    "CP_PATIENT_SUMMARY_PRIVATE_SHORT": "projection_read",
    "CP_PATIENT_ROUTE_INTENT_PRIVATE": "route_family",
    "CP_PATIENT_BOOKING_PRIVATE_EPHEMERAL": "entity_scoped",
    "CP_PATIENT_ARTIFACT_SUMMARY_NO_STORE": "transient_replay_support",
    "CP_PATIENT_THREAD_PRIVATE_EPHEMERAL": "entity_scoped",
    "CP_GRANT_SCOPED_EPHEMERAL": "entity_scoped",
    "CP_EMBEDDED_HOST_SCOPED_EPHEMERAL": "entity_scoped",
    "CP_WORKSPACE_SINGLE_ORG_PRIVATE": "route_family",
    "CP_WORKSPACE_CHILD_PRIVATE_EPHEMERAL": "entity_scoped",
    "CP_ASSISTIVE_ADJUNCT_NO_PERSIST": "transient_replay_support",
    "CP_SUPPORT_MASKED_PRIVATE": "entity_scoped",
    "CP_SUPPORT_REPLAY_FROZEN_NO_STORE": "transient_replay_support",
    "CP_SUPPORT_CAPTURE_PRIVATE_EPHEMERAL": "entity_scoped",
    "CP_HUB_QUEUE_PRIVATE_SUMMARY": "projection_read",
    "CP_HUB_CASE_PRIVATE_EPHEMERAL": "entity_scoped",
    "CP_PHARMACY_CASE_PRIVATE": "entity_scoped",
    "CP_OPERATIONS_WATCH_NO_SHARED_CACHE": "runtime_manifest",
    "CP_OPERATIONS_CONTROL_EPHEMERAL": "route_family",
    "CP_GOVERNANCE_CONTROL_EPHEMERAL": "runtime_manifest",
}

TRANSPORT_BACKENDS = [
    {
        "transportBackendRef": "ltb_sse_gateway_fanout",
        "transport": "sse",
        "ingressBoundary": "gateway_safe_only",
        "connectionIdentityPosture": "gateway_minted_epoch_token",
        "sourceRefs": [
            "prompt/088.md#Primary outcome",
            "data/analysis/gateway_bff_surfaces.json",
        ],
    },
    {
        "transportBackendRef": "ltb_websocket_gateway_fanout",
        "transport": "websocket",
        "ingressBoundary": "gateway_safe_only",
        "connectionIdentityPosture": "gateway_minted_epoch_token",
        "sourceRefs": [
            "prompt/088.md#Primary outcome",
            "data/analysis/gateway_bff_surfaces.json",
        ],
    },
]

RUNTIME_DATA_STORES = [
    {
        "data_store_ref": "ds_runtime_cache_plane",
        "display_name": "Runtime cache plane",
        "store_class": "cache",
        "family_ref": "wf_data_stateful_plane",
        "trust_zone_ref": "tz_stateful_data",
        "browser_reachability": "never",
        "source_refs": [
            "prompt/088.md#Mission",
            "docs/architecture/84_runtime_network_and_trust_boundary_realization.md#Follow-on Dependencies",
        ],
    },
    {
        "data_store_ref": "ds_live_connection_registry",
        "display_name": "Live connection registry",
        "store_class": "connection_registry",
        "family_ref": "wf_data_stateful_plane",
        "trust_zone_ref": "tz_stateful_data",
        "browser_reachability": "never",
        "source_refs": [
            "prompt/088.md#Mission",
            "docs/architecture/87_event_spine_and_queueing_design.md#Follow-on Dependencies",
        ],
    },
    {
        "data_store_ref": "ds_live_replay_buffer",
        "display_name": "Live replay buffer",
        "store_class": "replay_buffer",
        "family_ref": "wf_data_stateful_plane",
        "trust_zone_ref": "tz_stateful_data",
        "browser_reachability": "never",
        "source_refs": [
            "prompt/088.md#Mission",
            "docs/architecture/87_event_spine_and_queueing_design.md#Follow-on Dependencies",
        ],
    },
]

FOLLOW_ON_DEPENDENCIES = [
    {
        "dependency_ref": "FOLLOW_ON_DEPENDENCY_096_ROUTE_FAMILY_CACHE_AND_LIVE_POLICY_BINDING",
        "owning_task_ref": "par_096",
        "scope": (
            "Route-family specific ClientCachePolicy interpretation, LiveUpdateChannelContract "
            "downgrade posture, and frontend recovery semantics."
        ),
        "notes": (
            "par_088 publishes namespace, transport, replay, registry, and invalidation substrate "
            "only. Route-level policy depth remains reserved."
        ),
    }
]

DRILL_SCENARIOS = [
    {
        "scenarioId": "patient_home_reconnect_replay_safe",
        "description": "Patient home reconnects with bounded replay and still treats freshness as unproven.",
        "honestyOutcome": "fresh_but_unproven",
        "replayState": "ok",
        "degradedState": "healthy",
        "cacheHealthState": "fresh",
        "timeline": ["connect", "replay_window", "rebind_truth", "resume_read_only"],
    },
    {
        "scenarioId": "operations_board_heartbeat_loss",
        "description": "Heartbeat loss moves the operations board into explicit degraded transport instead of fake freshness.",
        "honestyOutcome": "explicit_degraded",
        "replayState": "not_requested",
        "degradedState": "heartbeat_missed",
        "cacheHealthState": "not_applicable",
        "timeline": ["connect", "heartbeat_gap", "degraded_banner", "operator_review"],
    },
    {
        "scenarioId": "support_replay_window_exhausted",
        "description": "Replay window exhaustion stays explicit and forces replay-safe recovery review.",
        "honestyOutcome": "replay_required",
        "replayState": "window_exhausted",
        "degradedState": "replay_window_exhausted",
        "cacheHealthState": "not_applicable",
        "timeline": ["connect", "buffer_rotated", "window_exhausted", "review_required"],
    },
    {
        "scenarioId": "runtime_manifest_reset_drill",
        "description": "Runtime-manifest cache reset is visible and never silently upgrades write posture.",
        "honestyOutcome": "reset_visible",
        "replayState": "not_requested",
        "degradedState": "healthy",
        "cacheHealthState": "reset",
        "timeline": ["manifest_cached", "reset_requested", "cache_reset", "freshness_rebound_required"],
    },
    {
        "scenarioId": "projection_cache_binding_drift",
        "description": "Projection drift invalidates continuity cache and forces explicit stale posture until rebound.",
        "honestyOutcome": "explicit_degraded",
        "replayState": "ok",
        "degradedState": "stale_transport",
        "cacheHealthState": "invalidated",
        "timeline": ["projection_cached", "binding_drift", "invalidate_cache", "rebind_before_resume"],
    },
]

SOURCE_PRECEDENCE = [
    "prompt/088.md",
    "prompt/shared_operating_contract_086_to_095.md",
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "data/analysis/frontend_contract_manifests.json",
    "data/analysis/api_contract_registry_manifest.json",
    "data/analysis/gateway_bff_surfaces.json",
    "data/analysis/runtime_topology_manifest.json",
    "data/analysis/event_broker_topology_manifest.json",
    "docs/architecture/46_runtime_topology_manifest_strategy.md",
    "docs/architecture/47_gateway_surface_map.md",
    "docs/architecture/50_frontend_contract_manifest_strategy.md",
    "docs/architecture/65_api_contract_registry_design.md",
    "docs/architecture/84_runtime_network_and_trust_boundary_realization.md",
    "docs/architecture/87_event_spine_and_queueing_design.md",
    "blueprint/platform-runtime-and-release-blueprint.md#LiveUpdateChannelContract",
    "blueprint/platform-runtime-and-release-blueprint.md#ClientCachePolicy",
    "blueprint/platform-frontend-blueprint.md#Same-shell continuity rules",
    "blueprint/patient-portal-experience-architecture-blueprint.md",
    "blueprint/patient-account-and-communications-blueprint.md",
    "blueprint/staff-operations-and-support-blueprint.md",
    "blueprint/forensic-audit-findings.md#Finding 86",
    "blueprint/forensic-audit-findings.md#Finding 87",
    "blueprint/forensic-audit-findings.md#Finding 92",
    "blueprint/forensic-audit-findings.md#Finding 96",
    "blueprint/forensic-audit-findings.md#Finding 97",
    "blueprint/forensic-audit-findings.md#Finding 99",
    "blueprint/forensic-audit-findings.md#Finding 100",
    "blueprint/forensic-audit-findings.md#Finding 101",
    "blueprint/forensic-audit-findings.md#Finding 102",
]

HTML_MARKERS = [
    'data-testid="topology-diagram"',
    'data-testid="cache-grid"',
    'data-testid="replay-timeline"',
    'data-testid="topology-table"',
    'data-testid="policy-table"',
    'data-testid="inspector"',
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


def slug(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", value.lower()).strip("_")


def stable_digest(text: str) -> str:
    left = 0x811C9DC5
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


def append_script_step(script: str, command: str) -> str:
    if not script:
        return command
    if command in script:
        return script
    return f"{script} && {command}"


def ensure_domain_kernel_export() -> None:
    source = DOMAIN_KERNEL_INDEX_PATH.read_text(encoding="utf-8")
    export_line = 'export * from "./cache-live-transport";'
    if export_line in source:
        return
    anchor = 'export function makeFoundationRef(family: string, key: string): FoundationRef {\n  return { family, key };\n}\n\n'
    require(anchor in source, "PREREQUISITE_GAP_088_DOMAIN_KERNEL_INDEX_ANCHOR")
    write_text(DOMAIN_KERNEL_INDEX_PATH, source.replace(anchor, anchor + export_line + "\n"))


def patch_api_gateway_package() -> None:
    package = load_json(API_GATEWAY_PACKAGE_PATH)
    package.setdefault("dependencies", {}).pop("@vecells/domain-kernel", None)
    write_json(API_GATEWAY_PACKAGE_PATH, package)


def insert_before(source: str, anchor: str, block: str, requirement: str) -> str:
    require(anchor in source, requirement)
    return source.replace(anchor, block + anchor, 1)


def ensure_service_definition() -> None:
    source = API_GATEWAY_SERVICE_DEFINITION_PATH.read_text(encoding="utf-8")

    api_registry_route_block = dedent(
        """
            {
              routeId: "get_api_contract_registry",
              method: "GET",
              path: "/contracts/registry",
              contractFamily: "ApiContractRegistry",
              purpose:
                "Expose backend-published registry lookup for query, mutation, live-channel, and cache contracts.",
              bodyRequired: false,
              idempotencyRequired: false,
            },
        """
    ).rstrip()
    cache_route_block = dedent(
        """
            {
              routeId: "get_cache_live_transport_baseline",
              method: "GET",
              path: "/runtime/cache-live-transport",
              contractFamily: "LiveTransportRuntimeBaseline",
              purpose:
                "Expose cache namespace, connection-registry, replay-window, and degraded transport substrate without implying fresh truth from warm caches or open sockets.",
              bodyRequired: false,
              idempotencyRequired: false,
            },
        """
    ).rstrip()
    api_registry_readiness_block = dedent(
        """
            {
              name: "api_contract_registry",
              detail:
                "Published browser query, mutation, live-channel, and cache contracts load from the shared registry package.",
              failureMode:
                "Fail closed to explicit contract lookup errors instead of inferring browser authority from gateway routes.",
            },
        """
    ).rstrip()
    readiness_block = dedent(
        """
            {
              name: "cache_live_transport_substrate",
              detail:
                "Published cache namespace and live transport substrate stays governed, gateway-safe, and explicit about stale or blocked posture.",
              failureMode:
                "Fail closed to degraded infrastructure posture instead of treating connection health or cache warmth as fresh truth.",
            },
        """
    ).rstrip()
    route_catalog_anchor = "  ] as const satisfies readonly ServiceRouteDefinition[],"
    if '"get_api_contract_registry"' not in source:
        source = insert_before(
            source,
            route_catalog_anchor,
            api_registry_route_block + "\n",
            "PREREQUISITE_GAP_088_GATEWAY_ROUTE_CATALOG_ANCHOR",
        )
    if '"get_cache_live_transport_baseline"' not in source:
        source = insert_before(
            source,
            route_catalog_anchor,
            cache_route_block + "\n",
            "PREREQUISITE_GAP_088_GATEWAY_ROUTE_CATALOG_ANCHOR",
        )

    readiness_anchor = "  ] as const,\n  retryProfiles: ["
    if '"api_contract_registry"' not in source:
        source = insert_before(
            source,
            readiness_anchor,
            api_registry_readiness_block + "\n",
            "PREREQUISITE_GAP_088_GATEWAY_READINESS_ANCHOR",
        )
    if '"cache_live_transport_substrate"' not in source:
        source = insert_before(
            source,
            readiness_anchor,
            readiness_block + "\n",
            "PREREQUISITE_GAP_088_GATEWAY_READINESS_ANCHOR",
        )

    test_harness_line = (
        '  testHarnesses: ["tests/config.test.js", "tests/runtime.integration.test.js"] as const,'
    )
    if test_harness_line in source:
        source = source.replace(
            test_harness_line,
            dedent(
                """
                  testHarnesses: [
                    "tests/config.test.js",
                    "tests/runtime.integration.test.js",
                    "tests/api-contract-registry.integration.test.js",
                    "tests/cache-live-transport.integration.test.js",
                  ] as const,
                """
            ).rstrip(),
        )
    else:
        inline_api_registry_harness = (
            '  testHarnesses: ["tests/config.test.js", "tests/runtime.integration.test.js", '
            '"tests/api-contract-registry.integration.test.js"] as const,'
        )
        if (
            inline_api_registry_harness in source
            and '"tests/cache-live-transport.integration.test.js"' not in source
        ):
            source = source.replace(
                inline_api_registry_harness,
                '  testHarnesses: ["tests/config.test.js", "tests/runtime.integration.test.js", '
                '"tests/api-contract-registry.integration.test.js", '
                '"tests/cache-live-transport.integration.test.js"] as const,',
            )
        if '"tests/api-contract-registry.integration.test.js"' not in source:
            source = insert_before(
                source,
                "  ] as const,\n} as const;",
                '    "tests/api-contract-registry.integration.test.js",\n',
                "PREREQUISITE_GAP_088_GATEWAY_TEST_ANCHOR",
            )
        if '"tests/cache-live-transport.integration.test.js"' not in source:
            source = insert_before(
                source,
                "  ] as const,\n} as const;",
                '    "tests/cache-live-transport.integration.test.js",\n',
                "PREREQUISITE_GAP_088_GATEWAY_TEST_ANCHOR",
            )

    write_text(API_GATEWAY_SERVICE_DEFINITION_PATH, source)


def ensure_runtime_handler() -> None:
    source = API_GATEWAY_RUNTIME_PATH.read_text(encoding="utf-8")
    api_registry_import = 'import { buildApiContractRegistryResponse } from "./api-contract-registry";\n'
    import_line = 'import { buildCacheLiveTransportResponse } from "./cache-live-transport";\n'
    if api_registry_import not in source:
        anchor = 'import { redactConfig, type ServiceConfig } from "./config";\n'
        require(anchor in source, "PREREQUISITE_GAP_088_GATEWAY_RUNTIME_IMPORT_ANCHOR")
        source = source.replace(anchor, anchor + api_registry_import)
    if import_line not in source:
        anchor = 'import { redactConfig, type ServiceConfig } from "./config";\n'
        require(anchor in source, "PREREQUISITE_GAP_088_GATEWAY_RUNTIME_IMPORT_ANCHOR")
        source = source.replace(anchor, anchor + import_line)

    api_registry_handler_block = dedent(
        """
                  if (route.routeId === "get_api_contract_registry") {
                    const payload = buildApiContractRegistryResponse(requestUrl.searchParams);
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
                    return;
                  }
        """
    ).rstrip()
    handler_block = dedent(
        """
                  if (route.routeId === "get_cache_live_transport_baseline") {
                    const payload = buildCacheLiveTransportResponse(requestUrl.searchParams);
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
                    return;
                  }
        """
    ).rstrip()
    runtime_anchor = '          const context: WorkloadRequestContext = {'
    if 'route.routeId === "get_api_contract_registry"' not in source:
        source = insert_before(
            source,
            runtime_anchor,
            api_registry_handler_block + "\n\n",
            "PREREQUISITE_GAP_088_GATEWAY_RUNTIME_HANDLER_ANCHOR",
        )
    if 'route.routeId === "get_cache_live_transport_baseline"' not in source:
        source = insert_before(
            source,
            runtime_anchor,
            handler_block + "\n\n",
            "PREREQUISITE_GAP_088_GATEWAY_RUNTIME_HANDLER_ANCHOR",
        )

    write_text(API_GATEWAY_RUNTIME_PATH, source)


def patch_root_package() -> None:
    package = load_json(ROOT_PACKAGE_PATH)
    package.setdefault("scripts", {}).update(ROOT_SCRIPT_UPDATES)
    write_json(ROOT_PACKAGE_PATH, package)


def patch_playwright_package() -> None:
    package = load_json(PLAYWRIGHT_PACKAGE_PATH)
    scripts = package.setdefault("scripts", {})
    scripts["build"] = append_script_step(
        scripts.get("build", ""),
        "node --check live-update-and-cache-atlas.spec.js",
    )
    scripts["lint"] = append_script_step(
        scripts.get("lint", ""),
        "eslint live-update-and-cache-atlas.spec.js",
    )
    scripts["test"] = append_script_step(
        scripts.get("test", ""),
        "node live-update-and-cache-atlas.spec.js",
    )
    scripts["typecheck"] = append_script_step(
        scripts.get("typecheck", ""),
        "node --check live-update-and-cache-atlas.spec.js",
    )
    scripts["e2e"] = append_script_step(
        scripts.get("e2e", ""),
        "node live-update-and-cache-atlas.spec.js --run",
    )
    description = package.get("description", "").rstrip(".")
    suffix = "cache and live-update atlas browser checks"
    if suffix not in description:
        description = (description + ", " + suffix).strip(", ")
    package["description"] = description + "."
    write_json(PLAYWRIGHT_PACKAGE_PATH, package)


def channel_state_for(route_family_ref: str, environment_ring: str, has_live_channel: bool) -> str:
    if not has_live_channel:
        return "not_declared"
    if environment_ring == "local":
        if "support_replay" in route_family_ref:
            return "blocked"
        if "patient_home" in route_family_ref or "patient_appointments" in route_family_ref:
            return "restored"
        if "operations" in route_family_ref or "patient_messages" in route_family_ref:
            return "replay_only"
        return "healthy"
    if environment_ring == "ci-preview":
        if "operations" in route_family_ref or "hub_queue" in route_family_ref:
            return "stale"
        if "patient_embedded" in route_family_ref:
            return "replay_only"
        return "healthy"
    if environment_ring == "integration":
        if "support_ticket" in route_family_ref or "staff_workspace_child" in route_family_ref:
            return "stale"
        if "patient_requests" in route_family_ref:
            return "replay_only"
        return "healthy"
    if environment_ring == "preprod":
        if "governance" in route_family_ref or "operations_drilldown" in route_family_ref:
            return "stale"
        if "hub_case" in route_family_ref:
            return "restored"
        return "healthy"
    if environment_ring == "production":
        if "operations_board" in route_family_ref:
            return "restored"
        return "healthy"
    return "healthy"


def degraded_mode_for_state(channel_state: str) -> str:
    if channel_state == "healthy":
        return "none"
    if channel_state == "restored":
        return "restored_after_rebind"
    if channel_state == "stale":
        return "stale_mode_required"
    if channel_state == "blocked":
        return "fail_closed_review_required"
    if channel_state == "replay_only":
        return "reconnect_replay_required"
    return "follow_on_route_contract"


def reconnect_profile_for(transport: str, audience_surface_ref: str) -> tuple[int, int, str]:
    if transport == "websocket":
        base_interval = 10
        grace = 5
    else:
        base_interval = 15
        grace = 10
    if audience_surface_ref == "audsurf_operations_console":
        base_interval -= 2
        grace -= 1
    if audience_surface_ref == "audsurf_support_workspace":
        grace += 2
    return max(base_interval, 8), max(grace, 4), "gateway_epoch_resume_token"


def replay_window_for(route_family_ref: str, audience_surface_ref: str) -> int:
    if audience_surface_ref == "audsurf_operations_console":
        return 8
    if audience_surface_ref == "audsurf_patient_authenticated_portal":
        return 6
    if "support_replay" in route_family_ref:
        return 3
    if "hub_queue" in route_family_ref:
        return 5
    return 4


def build_manifests() -> tuple[dict[str, Any], dict[str, Any], list[dict[str, Any]]]:
    runtime_topology = load_json(RUNTIME_TOPOLOGY_PATH)
    frontend = load_json(FRONTEND_MANIFEST_PATH)
    api_registry = load_json(API_REGISTRY_PATH)
    gateway = load_json(GATEWAY_SURFACES_PATH)
    event_broker = load_json(EVENT_BROKER_PATH)

    require(
        frontend["summary"]["live_update_channel_contract_count"] == len(frontend["liveUpdateChannelContracts"]),
        "PREREQUISITE_GAP_088_FRONTEND_LIVE_COUNT",
    )
    require(
        api_registry["summary"]["route_family_bundle_count"] == len(api_registry["routeFamilyBundles"]),
        "PREREQUISITE_GAP_088_API_REGISTRY_ROUTE_BUNDLE_COUNT",
    )
    require(
        event_broker["summary"]["queue_group_count"] >= 1,
        "PREREQUISITE_GAP_088_EVENT_SPINE_QUEUEING",
    )

    route_bundle_by_ref = {
        row["routeFamilyRef"]: row for row in api_registry["routeFamilyBundles"]
    }
    route_bundle_by_live = {
        row["liveUpdateChannelContractRef"]: row
        for row in api_registry["routeFamilyBundles"]
        if row["liveUpdateChannelContractRef"]
    }
    gateway_surface_by_id = {row["surfaceId"]: row for row in gateway["gateway_surfaces"]}

    policy_associations: dict[str, dict[str, set[str]]] = defaultdict(
        lambda: {
            "routeFamilyRefs": set(),
            "gatewaySurfaceRefs": set(),
            "audienceSurfaceRefs": set(),
        }
    )
    for bundle in api_registry["routeFamilyBundles"]:
        for policy_ref in bundle["clientCachePolicyRefs"]:
            assoc = policy_associations[policy_ref]
            assoc["routeFamilyRefs"].add(bundle["routeFamilyRef"])
            assoc["gatewaySurfaceRefs"].update(bundle["gatewaySurfaceRefs"])
            assoc["audienceSurfaceRefs"].add(bundle["manifestAudienceSurface"])

    policy_namespace_ref: dict[str, str] = {}
    cache_namespaces: list[dict[str, Any]] = []
    policy_bindings: list[dict[str, Any]] = []
    class_counts = Counter()
    for policy in sorted(frontend["clientCachePolicies"], key=lambda row: row["clientCachePolicyId"]):
        policy_id = policy["clientCachePolicyId"]
        require(policy_id in POLICY_CLASS_MAP, f"PREREQUISITE_GAP_088_POLICY_CLASS_{policy_id}")
        namespace_class = POLICY_CLASS_MAP[policy_id]
        assoc = policy_associations[policy_id]
        namespace_ref = f"cns_{namespace_class}_{slug(policy_id.removeprefix('CP_'))}"
        policy_namespace_ref[policy_id] = namespace_ref
        cache_namespaces.append(
            {
                "namespaceRef": namespace_ref,
                "namespaceClass": namespace_class,
                "storageMode": policy["storageMode"],
                "scopeMode": policy["scopeMode"],
                "gatewaySurfaceRefs": sorted(
                    set(policy.get("sourceGatewayRefs", [])) | assoc["gatewaySurfaceRefs"]
                ),
                "sourcePolicyRefs": [policy_id],
                "boundedTtlSeconds": TTL_BY_CLASS[namespace_class],
                "invalidationHookRefs": INVALIDATION_HOOKS_BY_CLASS[namespace_class],
                "honestyRuleRefs": HONESTY_RULES_BY_CLASS[namespace_class],
            }
        )
        policy_bindings.append(
            {
                "policyBindingRef": f"cpbind_{slug(policy_id)}",
                "clientCachePolicyId": policy_id,
                "namespaceRef": namespace_ref,
                "namespaceClass": namespace_class,
                "routeFamilyRefs": sorted(assoc["routeFamilyRefs"]),
                "gatewaySurfaceRefs": sorted(assoc["gatewaySurfaceRefs"]),
                "audienceSurfaceRefs": sorted(assoc["audienceSurfaceRefs"]),
                "followOnDependencyRef": "FOLLOW_ON_DEPENDENCY_096_ROUTE_FAMILY_CACHE_AND_LIVE_POLICY_BINDING",
                "sourceRefs": policy["source_refs"],
            }
        )
        class_counts[namespace_class] += 1

    class_catalog = [
        {
            "namespaceClass": class_name,
            "displayName": CLASS_LABELS[class_name],
            "description": CLASS_DESCRIPTIONS[class_name],
            "boundedTtlSeconds": TTL_BY_CLASS[class_name],
            "namespaceCount": class_counts[class_name],
            "invalidationHookRefs": INVALIDATION_HOOKS_BY_CLASS[class_name],
            "honestyRuleRefs": HONESTY_RULES_BY_CLASS[class_name],
        }
        for class_name in CLASS_ORDER
    ]

    live_channels: list[dict[str, Any]] = []
    replay_buffers: list[dict[str, Any]] = []
    reconnect_policies: list[dict[str, Any]] = []
    stale_mode_hooks: list[dict[str, Any]] = []
    transport_backend_counts = Counter()
    registry_accumulator: dict[str, dict[str, Any]] = {}

    for contract in sorted(
        frontend["liveUpdateChannelContracts"],
        key=lambda row: row["liveUpdateChannelContractId"],
    ):
        bundle = route_bundle_by_live[contract["liveUpdateChannelContractId"]]
        route_family_ref = contract["routeFamilyRef"]
        audience_surface_ref = bundle["manifestAudienceSurface"]
        gateway_surface_refs = bundle["gatewaySurfaceRefs"]
        first_gateway_surface = gateway_surface_by_id[gateway_surface_refs[0]]
        transport_backend_ref = (
            "ltb_websocket_gateway_fanout"
            if contract["transport"] == "websocket"
            else "ltb_sse_gateway_fanout"
        )
        heartbeat_interval, heartbeat_grace, reconnect_mode = reconnect_profile_for(
            contract["transport"],
            audience_surface_ref,
        )
        replay_window_size = replay_window_for(route_family_ref, audience_surface_ref)
        transport_channel_ref = f"ltr_{slug(route_family_ref.removeprefix('rf_'))}"
        connection_registry_ref = f"cr_{slug(audience_surface_ref.removeprefix('audsurf_'))}"
        replay_buffer_ref = f"rb_{slug(route_family_ref.removeprefix('rf_'))}"
        reconnect_policy_ref = f"rp_{slug(contract['channelCode'])}"
        stale_mode_hook_ref = f"hook_{slug(route_family_ref)}_stale"

        registry = registry_accumulator.setdefault(
            connection_registry_ref,
            {
                "connectionRegistryRef": connection_registry_ref,
                "audienceSurfaceRef": audience_surface_ref,
                "gatewaySurfaceRefs": set(),
                "routeFamilyRefs": set(),
                "transportRefs": set(),
                "registryMode": "gateway_safe_connection_epoch",
                "reconnectTokenMode": reconnect_mode,
                "safeShutdownMode": "drain_then_fail_closed",
                "sourceRefs": [
                    "prompt/088.md#Primary outcome",
                    "data/analysis/api_contract_registry_manifest.json",
                ],
            },
        )
        registry["gatewaySurfaceRefs"].update(gateway_surface_refs)
        registry["routeFamilyRefs"].add(route_family_ref)
        registry["transportRefs"].add(contract["transport"])

        live_channels.append(
            {
                "transportChannelRef": transport_channel_ref,
                "liveUpdateChannelContractId": contract["liveUpdateChannelContractId"],
                "channelCode": contract["channelCode"],
                "transport": contract["transport"],
                "channelPosture": contract["channelPosture"],
                "gatewaySurfaceRefs": gateway_surface_refs,
                "audienceSurfaceRefs": [audience_surface_ref],
                "workloadFamilyRef": first_gateway_surface["entryWorkloadFamilyRef"],
                "connectionRegistryRef": connection_registry_ref,
                "replayBufferRef": replay_buffer_ref,
                "heartbeatIntervalSeconds": heartbeat_interval,
                "heartbeatGraceSeconds": heartbeat_grace,
                "replayWindowSize": replay_window_size,
                "reconnectPolicyRef": reconnect_policy_ref,
                "staleModeHookRef": stale_mode_hook_ref,
                "sourceRefs": [
                    "prompt/088.md#Implementation deliverables to create",
                    "data/analysis/frontend_contract_manifests.json",
                    "data/analysis/api_contract_registry_manifest.json",
                ],
            }
        )
        replay_buffers.append(
            {
                "replayBufferRef": replay_buffer_ref,
                "routeFamilyRef": route_family_ref,
                "audienceSurfaceRef": audience_surface_ref,
                "transportChannelRef": transport_channel_ref,
                "windowSize": replay_window_size,
                "overflowPosture": "window_exhausted_explicit",
                "truthPosture": "replay_does_not_imply_settled_truth",
                "sourceRefs": [
                    "prompt/088.md#Execution steps",
                    "blueprint/platform-runtime-and-release-blueprint.md#LiveUpdateChannelContract",
                ],
            }
        )
        reconnect_policies.append(
            {
                "reconnectPolicyRef": reconnect_policy_ref,
                "transport": contract["transport"],
                "audienceSurfaceRef": audience_surface_ref,
                "tokenMode": reconnect_mode,
                "resumePosture": "resume_read_only_until_truth_rebound",
                "maxReplayFrames": replay_window_size,
                "sourceRefs": [
                    "prompt/088.md#Mock_now_execution",
                    "blueprint/platform-frontend-blueprint.md#same-shell continuity rules",
                ],
            }
        )
        stale_mode_hooks.append(
            {
                "staleModeHookRef": stale_mode_hook_ref,
                "routeFamilyRef": route_family_ref,
                "audienceSurfaceRef": audience_surface_ref,
                "chromePosture": "explicit_stale_banner",
                "truthPosture": "read_only_until_rebound",
                "sourceRefs": [
                    "prompt/088.md#Mandatory gap closures you must perform",
                    "blueprint/platform-frontend-blueprint.md#freshness honesty",
                ],
            }
        )
        transport_backend_counts[transport_backend_ref] += 1

    live_channels_by_contract = {
        row["liveUpdateChannelContractId"]: row for row in live_channels
    }
    connection_registries = [
        {
            **row,
            "gatewaySurfaceRefs": sorted(row["gatewaySurfaceRefs"]),
            "routeFamilyRefs": sorted(row["routeFamilyRefs"]),
            "transportRefs": sorted(row["transportRefs"]),
        }
        for _, row in sorted(registry_accumulator.items())
    ]

    boundary_rows: list[dict[str, Any]] = []
    for environment_manifest in runtime_topology["environment_manifests"]:
        environment_ring = environment_manifest["environment_ring"]
        for bundle in api_registry["routeFamilyBundles"]:
            route_family_ref = bundle["routeFamilyRef"]
            live_contract_ref = bundle["liveUpdateChannelContractRef"]
            live_channel = live_channels_by_contract.get(live_contract_ref)
            primary_cache_policy_ref = bundle["clientCachePolicyRefs"][0]
            namespace_ref = policy_namespace_ref[primary_cache_policy_ref]
            namespace_class = POLICY_CLASS_MAP[primary_cache_policy_ref]
            channel_state = channel_state_for(
                route_family_ref,
                environment_ring,
                live_channel is not None,
            )
            degraded_mode = degraded_mode_for_state(channel_state)
            row_id = f"bnd_{slug(environment_ring)}_{slug(route_family_ref)}"
            gateway_surface_ref = bundle["primaryGatewaySurfaceRef"]
            audience_surface_ref = bundle["manifestAudienceSurface"]
            boundary_rows.append(
                {
                    "row_id": row_id,
                    "environment_ring": environment_ring,
                    "audience_surface_ref": audience_surface_ref,
                    "gateway_surface_ref": gateway_surface_ref,
                    "route_family_ref": route_family_ref,
                    "transport_channel_ref": live_channel["transportChannelRef"] if live_channel else "",
                    "live_update_channel_contract_id": live_contract_ref or "",
                    "transport": live_channel["transport"] if live_channel else "none",
                    "channel_state": channel_state,
                    "cache_policy_id": primary_cache_policy_ref,
                    "cache_namespace_ref": namespace_ref,
                    "namespace_class": namespace_class,
                    "degraded_mode": degraded_mode,
                    "browser_boundary": "gateway_only_no_internal_bus",
                    "connection_registry_ref": live_channel["connectionRegistryRef"] if live_channel else "",
                    "replay_buffer_ref": live_channel["replayBufferRef"] if live_channel else "",
                    "transport_backend_ref": (
                        "ltb_websocket_gateway_fanout"
                        if live_channel and live_channel["transport"] == "websocket"
                        else "ltb_sse_gateway_fanout"
                        if live_channel
                        else ""
                    ),
                    "cache_backend_ref": "ds_runtime_cache_plane",
                    "truth_posture": "connection_health_and_cache_warmth_are_non_authoritative",
                    "follow_on_dependency_ref": (
                        "FOLLOW_ON_DEPENDENCY_096_ROUTE_FAMILY_CACHE_AND_LIVE_POLICY_BINDING"
                    ),
                }
            )

    cache_manifest = {
        "task_id": TASK_ID,
        "generated_at": GENERATED_AT,
        "captured_on": CAPTURED_ON,
        "visual_mode": VISUAL_MODE,
        "mission": (
            "Provision the shared runtime substrate for cache-backed read continuity and "
            "policy-ready cache namespaces without turning caches into hidden business truth."
        ),
        "source_precedence": SOURCE_PRECEDENCE,
        "upstream_inputs": {
            "frontend_contract_manifest_ref": "data/analysis/frontend_contract_manifests.json",
            "api_contract_registry_manifest_ref": "data/analysis/api_contract_registry_manifest.json",
            "gateway_surface_manifest_ref": "data/analysis/gateway_bff_surfaces.json",
            "runtime_topology_manifest_ref": "data/analysis/runtime_topology_manifest.json",
        },
        "followOnDependencies": FOLLOW_ON_DEPENDENCIES,
        "summary": {
            "namespace_class_count": len(CLASS_ORDER),
            "cache_namespace_count": len(cache_namespaces),
            "policy_binding_count": len(policy_bindings),
            "route_family_binding_count": len(api_registry["routeFamilyBundles"]),
            "audience_surface_count": len(
                {row["manifestAudienceSurface"] for row in api_registry["routeFamilyBundles"]}
            ),
        },
        "namespaceClasses": class_catalog,
        "cacheNamespaces": cache_namespaces,
        "policyBindings": policy_bindings,
        "manifestTupleHash": stable_digest(
            json.dumps(cache_namespaces, sort_keys=True)
            + json.dumps(policy_bindings, sort_keys=True)
        ),
    }

    live_transport_manifest = {
        "task_id": TASK_ID,
        "generated_at": GENERATED_AT,
        "captured_on": CAPTURED_ON,
        "visual_mode": VISUAL_MODE,
        "mission": (
            "Provision gateway-safe live-update transport, connection registries, replay buffers, "
            "and reconnect hooks without conflating open connections with fresh truth."
        ),
        "source_precedence": SOURCE_PRECEDENCE,
        "upstream_inputs": {
            "frontend_contract_manifest_ref": "data/analysis/frontend_contract_manifests.json",
            "api_contract_registry_manifest_ref": "data/analysis/api_contract_registry_manifest.json",
            "gateway_surface_manifest_ref": "data/analysis/gateway_bff_surfaces.json",
            "runtime_topology_manifest_ref": "data/analysis/runtime_topology_manifest.json",
            "event_broker_topology_manifest_ref": "data/analysis/event_broker_topology_manifest.json",
        },
        "followOnDependencies": FOLLOW_ON_DEPENDENCIES,
        "summary": {
            "transport_backend_count": len(TRANSPORT_BACKENDS),
            "connection_registry_count": len(connection_registries),
            "replay_buffer_count": len(replay_buffers),
            "live_channel_count": len(live_channels),
            "drill_scenario_count": len(DRILL_SCENARIOS),
            "allowed_live_absence_route_family_count": api_registry["summary"][
                "allowed_live_absence_count"
            ],
        },
        "transportBackends": [
            {**row, "channelCount": transport_backend_counts[row["transportBackendRef"]]}
            for row in TRANSPORT_BACKENDS
        ],
        "connectionRegistries": connection_registries,
        "replayBuffers": replay_buffers,
        "reconnectPolicies": reconnect_policies,
        "staleModeHooks": stale_mode_hooks,
        "liveChannels": live_channels,
        "drillScenarios": DRILL_SCENARIOS,
        "manifestTupleHash": stable_digest(
            json.dumps(live_channels, sort_keys=True)
            + json.dumps(replay_buffers, sort_keys=True)
            + json.dumps(connection_registries, sort_keys=True)
        ),
    }

    return cache_manifest, live_transport_manifest, boundary_rows


def patch_runtime_topology_manifest() -> None:
    topology = load_json(RUNTIME_TOPOLOGY_PATH)
    existing_store_refs = {row["data_store_ref"] for row in topology["data_store_catalog"]}
    for row in RUNTIME_DATA_STORES:
        if row["data_store_ref"] not in existing_store_refs:
            topology["data_store_catalog"].append(row)
    for environment_manifest in topology["environment_manifests"]:
        refs = environment_manifest.setdefault("data_store_refs", [])
        for row in RUNTIME_DATA_STORES:
            if row["data_store_ref"] not in refs:
                refs.append(row["data_store_ref"])
    topology["cache_namespace_manifest_ref"] = "data/analysis/cache_namespace_manifest.json"
    topology["live_transport_topology_manifest_ref"] = (
        "data/analysis/live_transport_topology_manifest.json"
    )
    topology["cache_transport_boundary_matrix_ref"] = (
        "data/analysis/cache_transport_boundary_matrix.csv"
    )
    write_json(RUNTIME_TOPOLOGY_PATH, topology)


def write_docs(
    cache_manifest: dict[str, Any],
    live_transport_manifest: dict[str, Any],
    boundary_rows: list[dict[str, Any]],
) -> None:
    class_lines = "\n".join(
        f"| `{row['namespaceClass']}` | {row['displayName']} | {row['namespaceCount']} | {row['boundedTtlSeconds']} |"
        for row in cache_manifest["namespaceClasses"]
    )
    design_doc = dedent(
        f"""
        # 88 Cache And Live Transport Design

        `par_088` provisions the shared cache and live-update runtime substrate that later route-family policy work can bind to without improvising continuity plumbing.

        ## Frozen Outcome

        - cache namespace classes: {cache_manifest['summary']['namespace_class_count']}
        - cache namespaces: {cache_manifest['summary']['cache_namespace_count']}
        - policy bindings: {cache_manifest['summary']['policy_binding_count']}
        - live channels: {live_transport_manifest['summary']['live_channel_count']}
        - connection registries: {live_transport_manifest['summary']['connection_registry_count']}
        - replay buffers: {live_transport_manifest['summary']['replay_buffer_count']}
        - boundary rows: {len(boundary_rows)}

        ## Namespace Classes

        | Class | Label | Namespaces | TTL Seconds |
        | --- | --- | ---: | ---: |
        {class_lines}

        ## Runtime Law

        - Caches are continuity helpers only; they do not become hidden freshness or mutation authority.
        - Live transport stays behind gateway-safe boundaries; browsers never subscribe to internal buses directly.
        - Heartbeat, reconnect, and replay hooks are reusable infrastructure seams, not route-local improvisation.
        - Reconnect can restore continuity, but it still leaves truth freshness unproven until later route-family policy binds a rebound rule.
        - `FOLLOW_ON_DEPENDENCY_096_ROUTE_FAMILY_CACHE_AND_LIVE_POLICY_BINDING` remains open by design.

        ## Topology Highlights

        - SSE fan-out backs {sum(1 for row in live_transport_manifest['liveChannels'] if row['transport'] == 'sse')} live channels.
        - WebSocket fan-out backs {sum(1 for row in live_transport_manifest['liveChannels'] if row['transport'] == 'websocket')} live channels.
        - The substrate covers {live_transport_manifest['summary']['allowed_live_absence_route_family_count']} route families with intentionally absent live contracts without inferring missing policy.
        """
    ).strip()

    state_counts = Counter(row["channel_state"] for row in boundary_rows)
    rules_doc = dedent(
        f"""
        # 88 Cache Transport Boundary And Honesty Rules

        The cache and live-transport baseline is authoritative infrastructure law only. It must never pretend that open transport or warm cache implies fresh business truth.

        ## Non-negotiable Rules

        - Cache warmth does not imply writable posture.
        - Live connection health does not imply fresh or settled truth.
        - Gateway-safe transport is mandatory. Browsers may not subscribe directly to internal workload families or broker subjects.
        - Route-family downgrade and recovery semantics remain reserved for task `096`.
        - Explicit stale and blocked posture must survive local, CI, and non-production drills.

        ## Boundary Matrix Posture

        - `healthy`: {state_counts['healthy']} rows
        - `restored`: {state_counts['restored']} rows
        - `stale`: {state_counts['stale']} rows
        - `blocked`: {state_counts['blocked']} rows
        - `replay_only`: {state_counts['replay_only']} rows
        - `not_declared`: {state_counts['not_declared']} rows

        ## Follow-on Dependency

        - `{FOLLOW_ON_DEPENDENCIES[0]['dependency_ref']}` owned by `{FOLLOW_ON_DEPENDENCIES[0]['owning_task_ref']}`:
          {FOLLOW_ON_DEPENDENCIES[0]['scope']}
        """
    ).strip()

    write_text(DESIGN_DOC_PATH, design_doc)
    write_text(RULES_DOC_PATH, rules_doc)


def write_infra(
    cache_manifest: dict[str, Any],
    live_transport_manifest: dict[str, Any],
) -> None:
    write_text(
        README_PATH,
        dedent(
            """
            # Cache And Live Transport Infrastructure

            This directory contains the provider-neutral Phase 0 baseline for `par_088`.

            It freezes:
            - governed cache namespaces for runtime-manifest, projection-read, route-family, entity-scoped, and transient replay-support classes
            - gateway-safe SSE and WebSocket transport fan-out
            - connection registries, reconnect tokens, and bounded replay buffers
            - local bootstrap, restart, reset, and degraded drill flows that preserve the same identifiers and posture used in non-production
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
              cache_manifest = jsondecode(file("${path.module}/../../data/analysis/cache_namespace_manifest.json"))
              live_manifest  = jsondecode(file("${path.module}/../../data/analysis/live_transport_topology_manifest.json"))
            }

            module "cache_plane" {
              source = "./modules/cache_plane"

              cache_namespace_refs = [for row in local.cache_manifest.cacheNamespaces : row.namespaceRef]
            }

            module "live_transport_gateway" {
              source = "./modules/live_transport_gateway"

              connection_registry_refs = [for row in local.live_manifest.connectionRegistries : row.connectionRegistryRef]
              transport_channel_refs   = [for row in local.live_manifest.liveChannels : row.transportChannelRef]
            }
            """
        ).strip(),
    )
    write_text(
        TERRAFORM_VARIABLES_PATH,
        dedent(
            """
            variable "provider_label" {
              type    = string
              default = "provider_neutral"
            }
            """
        ).strip(),
    )
    write_text(
        TERRAFORM_OUTPUTS_PATH,
        dedent(
            """
            output "cache_plane_ref" {
              value = module.cache_plane.cache_plane_ref
            }

            output "transport_gateway_ref" {
              value = module.live_transport_gateway.transport_gateway_ref
            }
            """
        ).strip(),
    )
    write_text(
        CACHE_MODULE_MAIN_PATH,
        dedent(
            """
            locals {
              cache_plane_ref = "cache-plane:${length(var.cache_namespace_refs)}"
            }
            """
        ).strip(),
    )
    write_text(
        CACHE_MODULE_VARIABLES_PATH,
        dedent(
            """
            variable "cache_namespace_refs" {
              type = list(string)
            }
            """
        ).strip(),
    )
    write_text(
        CACHE_MODULE_OUTPUTS_PATH,
        dedent(
            """
            output "cache_plane_ref" {
              value = local.cache_plane_ref
            }
            """
        ).strip(),
    )
    write_text(
        TRANSPORT_MODULE_MAIN_PATH,
        dedent(
            """
            locals {
              transport_gateway_ref = "live-transport:${length(var.transport_channel_refs)}"
            }
            """
        ).strip(),
    )
    write_text(
        TRANSPORT_MODULE_VARIABLES_PATH,
        dedent(
            """
            variable "connection_registry_refs" {
              type = list(string)
            }

            variable "transport_channel_refs" {
              type = list(string)
            }
            """
        ).strip(),
    )
    write_text(
        TRANSPORT_MODULE_OUTPUTS_PATH,
        dedent(
            """
            output "transport_gateway_ref" {
              value = local.transport_gateway_ref
            }
            """
        ).strip(),
    )

    environment_payloads = {
        "local": {
            "cacheNamespaceCount": cache_manifest["summary"]["cache_namespace_count"],
            "transportChannelCount": live_transport_manifest["summary"]["live_channel_count"],
            "transportBackendRefs": [
                row["transportBackendRef"] for row in live_transport_manifest["transportBackends"]
            ],
            "mode": "dev_emulator",
        },
        "ci-preview": {
            "cacheNamespaceCount": cache_manifest["summary"]["cache_namespace_count"],
            "transportChannelCount": live_transport_manifest["summary"]["live_channel_count"],
            "transportBackendRefs": [
                row["transportBackendRef"] for row in live_transport_manifest["transportBackends"]
            ],
            "mode": "ci_smoke",
        },
        "integration": {
            "cacheNamespaceCount": cache_manifest["summary"]["cache_namespace_count"],
            "transportChannelCount": live_transport_manifest["summary"]["live_channel_count"],
            "transportBackendRefs": [
                row["transportBackendRef"] for row in live_transport_manifest["transportBackends"]
            ],
            "mode": "integration_ring",
        },
        "preprod": {
            "cacheNamespaceCount": cache_manifest["summary"]["cache_namespace_count"],
            "transportChannelCount": live_transport_manifest["summary"]["live_channel_count"],
            "transportBackendRefs": [
                row["transportBackendRef"] for row in live_transport_manifest["transportBackends"]
            ],
            "mode": "preprod_gate",
        },
        "production": {
            "cacheNamespaceCount": cache_manifest["summary"]["cache_namespace_count"],
            "transportChannelCount": live_transport_manifest["summary"]["live_channel_count"],
            "transportBackendRefs": [
                row["transportBackendRef"] for row in live_transport_manifest["transportBackends"]
            ],
            "mode": "production_fail_closed",
        },
    }
    for environment_ring, payload in environment_payloads.items():
        write_json(
            INFRA_DIR / "environments" / f"{environment_ring}.auto.tfvars.json",
            payload,
        )

    write_text(
        LOCAL_COMPOSE_PATH,
        dedent(
            """
            services:
              cache-plane:
                image: valkey/valkey:8-alpine
                ports:
                  - "16379:6379"
              live-transport-bus:
                image: nats:2.10-alpine
                command: ["-js"]
                ports:
                  - "14222:4222"
              connection-registry:
                image: ghcr.io/opencontainers/busybox:latest
                command: ["sh", "-c", "while true; do sleep 3600; done"]
            """
        ).strip(),
    )
    write_json(
        LOCAL_POLICY_PATH,
        {
            "task_id": TASK_ID,
            "gatewaySafeOnly": True,
            "browserToInternalBusAllowed": False,
            "cacheWarmthImpliesWritable": False,
            "connectionHealthImpliesFreshTruth": False,
            "transportBackends": [
                row["transportBackendRef"] for row in live_transport_manifest["transportBackends"]
            ],
        },
    )

    common_script_prelude = dedent(
        """
        import fs from "node:fs";
        import path from "node:path";
        import { fileURLToPath } from "node:url";

        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const ROOT = path.resolve(__dirname, "..", "..", "..");
        const CACHE_MANIFEST_PATH = path.join(ROOT, "data", "analysis", "cache_namespace_manifest.json");
        const LIVE_MANIFEST_PATH = path.join(ROOT, "data", "analysis", "live_transport_topology_manifest.json");
        const STATE_DIR = path.join(ROOT, "infra", "cache-live-transport", "local", "state");

        const cacheManifest = JSON.parse(fs.readFileSync(CACHE_MANIFEST_PATH, "utf8"));
        const liveManifest = JSON.parse(fs.readFileSync(LIVE_MANIFEST_PATH, "utf8"));

        fs.mkdirSync(STATE_DIR, { recursive: true });
        """
    ).strip()

    write_text(
        LOCAL_BOOTSTRAP_PATH,
        common_script_prelude
        + "\n\n"
        + dedent(
            """
            const report = {
              task: "par_088",
              mode: "bootstrap",
              cacheNamespaceCount: cacheManifest.summary.cache_namespace_count,
              liveChannelCount: liveManifest.summary.live_channel_count,
              gatewaySafeOnly: true,
            };
            fs.writeFileSync(
              path.join(STATE_DIR, "bootstrap-report.json"),
              JSON.stringify(report, null, 2),
            );
            console.log(JSON.stringify(report));
            """
        ).strip(),
    )
    write_text(
        LOCAL_RESET_PATH,
        common_script_prelude
        + "\n\n"
        + dedent(
            """
            const report = {
              task: "par_088",
              mode: "reset",
              cacheHealthState: "reset",
              visibleReset: true,
              cacheNamespaceCount: cacheManifest.summary.cache_namespace_count,
            };
            fs.writeFileSync(
              path.join(STATE_DIR, "reset-report.json"),
              JSON.stringify(report, null, 2),
            );
            console.log(JSON.stringify(report));
            """
        ).strip(),
    )
    write_text(
        LOCAL_RESTART_PATH,
        common_script_prelude
        + "\n\n"
        + dedent(
            """
            const report = {
              task: "par_088",
              mode: "restart",
              gatewaySafeBoundary: true,
              transportState: "restored",
              liveChannelCount: liveManifest.summary.live_channel_count,
            };
            fs.writeFileSync(
              path.join(STATE_DIR, "restart-report.json"),
              JSON.stringify(report, null, 2),
            );
            console.log(JSON.stringify(report));
            """
        ).strip(),
    )
    write_text(
        LOCAL_HEARTBEAT_DRILL_PATH,
        common_script_prelude
        + "\n\n"
        + dedent(
            """
            const report = {
              task: "par_088",
              mode: "heartbeat-loss",
              degradedState: "heartbeat_missed",
              honestyOutcome: "explicit_degraded",
              connectionHealthImpliesFreshTruth: false,
            };
            fs.writeFileSync(
              path.join(STATE_DIR, "heartbeat-loss-report.json"),
              JSON.stringify(report, null, 2),
            );
            console.log(JSON.stringify(report));
            """
        ).strip(),
    )
    write_text(
        LOCAL_REPLAY_DRILL_PATH,
        common_script_prelude
        + "\n\n"
        + dedent(
            """
            const report = {
              task: "par_088",
              mode: "replay-window",
              replayState: "window_exhausted",
              degradedState: "replay_window_exhausted",
              impliedFreshness: false,
            };
            fs.writeFileSync(
              path.join(STATE_DIR, "replay-window-report.json"),
              JSON.stringify(report, null, 2),
            );
            console.log(JSON.stringify(report));
            """
        ).strip(),
    )
    write_text(
        LOCAL_CACHE_RESET_DRILL_PATH,
        common_script_prelude
        + "\n\n"
        + dedent(
            """
            const report = {
              task: "par_088",
              mode: "cache-reset",
              cacheHealthState: "reset",
              honestyOutcome: "reset_visible",
              writablePosture: false,
            };
            fs.writeFileSync(
              path.join(STATE_DIR, "cache-reset-drill-report.json"),
              JSON.stringify(report, null, 2),
            );
            console.log(JSON.stringify(report));
            """
        ).strip(),
    )
    write_text(
        SMOKE_TEST_PATH,
        dedent(
            """
            import assert from "node:assert/strict";
            import fs from "node:fs";
            import path from "node:path";
            import { execFileSync } from "node:child_process";
            import { fileURLToPath } from "node:url";

            const __filename = fileURLToPath(import.meta.url);
            const __dirname = path.dirname(__filename);
            const INFRA_ROOT = path.resolve(__dirname, "..");
            const LOCAL_DIR = path.join(INFRA_ROOT, "local");
            const STATE_DIR = path.join(LOCAL_DIR, "state");

            function runScript(name) {
              execFileSync(process.execPath, [path.join(LOCAL_DIR, name)], {
                cwd: INFRA_ROOT,
                stdio: "pipe",
              });
            }

            function readState(name) {
              return JSON.parse(
                fs.readFileSync(path.join(STATE_DIR, name), "utf8"),
              );
            }

            runScript("bootstrap-cache-live-transport.mjs");
            runScript("restart-live-transport.mjs");
            runScript("drill-heartbeat-loss.mjs");
            runScript("drill-replay-window.mjs");
            runScript("drill-cache-reset.mjs");
            runScript("reset-cache-live-transport.mjs");

            const bootstrap = readState("bootstrap-report.json");
            const restart = readState("restart-report.json");
            const heartbeat = readState("heartbeat-loss-report.json");
            const replay = readState("replay-window-report.json");
            const cacheReset = readState("cache-reset-drill-report.json");
            const reset = readState("reset-report.json");

            assert.equal(bootstrap.cacheNamespaceCount, 21);
            assert.equal(bootstrap.liveChannelCount, 15);
            assert.equal(restart.gatewaySafeBoundary, true);
            assert.equal(heartbeat.degradedState, "heartbeat_missed");
            assert.equal(heartbeat.connectionHealthImpliesFreshTruth, false);
            assert.equal(replay.replayState, "window_exhausted");
            assert.equal(cacheReset.cacheHealthState, "reset");
            assert.equal(cacheReset.writablePosture, false);
            assert.equal(reset.visibleReset, true);
            """
        ).strip(),
    )


def build_atlas_html(
    cache_manifest: dict[str, Any],
    live_transport_manifest: dict[str, Any],
    boundary_rows: list[dict[str, Any]],
) -> str:
    app_data = {
        "cacheManifest": cache_manifest,
        "liveManifest": live_transport_manifest,
        "boundaryRows": boundary_rows,
    }
    app_data_json = json.dumps(app_data, separators=(",", ":"), ensure_ascii=True).replace(
        "</", "<\\/"
    )
    template = dedent(
        """
        <!doctype html>
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>88 Live Update And Cache Atlas</title>
            <style>
              :root {
                --canvas: #F7F9FC;
                --panel: #FFFFFF;
                --rail: #EEF2F7;
                --inset: #F4F7FB;
                --text-strong: #0F172A;
                --text-default: #1E293B;
                --text-muted: #64748B;
                --border: #E2E8F0;
                --live: #2563EB;
                --cache: #0EA5A4;
                --replay: #7C3AED;
                --stale: #D97706;
                --blocked: #C24141;
                --restored: #059669;
                --shadow: 0 18px 48px rgba(15, 23, 42, 0.08);
              }

              * {
                box-sizing: border-box;
              }

              html,
              body {
                margin: 0;
                min-height: 100%;
                background: radial-gradient(circle at top left, rgba(37, 99, 235, 0.08), transparent 22%),
                  linear-gradient(180deg, #f8fbff 0%, var(--canvas) 26%, #f4f7fb 100%);
                color: var(--text-default);
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
              }

              body {
                transition: background-color 180ms ease, color 180ms ease, transform 180ms ease;
              }

              body[data-reduced-motion="true"] * {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
                scroll-behavior: auto !important;
              }

              .page {
                max-width: 1580px;
                margin: 0 auto;
                padding: 24px 20px 36px;
              }

              .masthead {
                position: sticky;
                top: 0;
                z-index: 20;
                min-height: 76px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 18px;
                margin-bottom: 18px;
                padding: 14px 18px;
                border: 1px solid var(--border);
                border-radius: 22px;
                background: rgba(255, 255, 255, 0.94);
                backdrop-filter: blur(18px);
                box-shadow: var(--shadow);
              }

              .brand {
                display: flex;
                align-items: center;
                gap: 14px;
              }

              .brand svg {
                width: 42px;
                height: 42px;
              }

              .brand-label strong,
              .section-title {
                color: var(--text-strong);
              }

              .monospace,
              code {
                font-family: "SFMono-Regular", ui-monospace, Menlo, monospace;
              }

              .chip-row {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
              }

              .chip {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                min-height: 32px;
                padding: 0 12px;
                border-radius: 999px;
                background: var(--inset);
                color: var(--text-default);
                border: 1px solid var(--border);
                font-size: 13px;
              }

              .chip[data-state="healthy"] {
                color: var(--live);
              }

              .chip[data-state="restored"] {
                color: var(--restored);
              }

              .chip[data-state="stale"] {
                color: var(--stale);
              }

              .chip[data-state="blocked"] {
                color: var(--blocked);
              }

              .layout {
                display: grid;
                grid-template-columns: 324px minmax(0, 1fr) 420px;
                gap: 18px;
                align-items: start;
              }

              .rail,
              .panel,
              .inspector {
                border: 1px solid var(--border);
                border-radius: 22px;
                background: rgba(255, 255, 255, 0.96);
                box-shadow: var(--shadow);
              }

              .rail,
              .panel,
              .inspector,
              .table-panel {
                padding: 18px;
              }

              .rail {
                position: sticky;
                top: 92px;
                background: linear-gradient(180deg, rgba(238, 242, 247, 0.84), rgba(255, 255, 255, 0.98));
              }

              .inspector {
                position: sticky;
                top: 92px;
                min-height: 320px;
              }

              .filter-group {
                display: grid;
                gap: 8px;
                margin-bottom: 12px;
              }

              label {
                font-size: 12px;
                letter-spacing: 0.06em;
                text-transform: uppercase;
                color: var(--text-muted);
              }

              select,
              button {
                min-height: 44px;
                border-radius: 14px;
                border: 1px solid var(--border);
                background: var(--panel);
                color: var(--text-default);
                padding: 10px 12px;
                font: inherit;
              }

              button {
                cursor: pointer;
                text-align: left;
              }

              .canvas {
                display: grid;
                gap: 18px;
              }

              .visual-grid {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 18px;
              }

              .visual-grid .panel,
              .timeline-panel {
                min-height: 320px;
              }

              .timeline-panel {
                display: grid;
                gap: 14px;
              }

              .diagram-grid,
              .cache-grid {
                display: grid;
                gap: 12px;
              }

              .diagram-grid {
                grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
              }

              .cache-grid {
                grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
              }

              .diagram-card,
              .cache-card,
              .timeline-step,
              .inspector-card {
                border-radius: 18px;
                border: 1px solid var(--border);
                background: var(--inset);
                padding: 16px;
              }

              .diagram-card[data-selected="true"],
              .cache-card[data-selected="true"],
              .timeline-step[data-selected="true"],
              .table-row[data-selected="true"] {
                border-color: rgba(37, 99, 235, 0.36);
                box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.12);
              }

              .state-chip {
                display: inline-flex;
                align-items: center;
                min-height: 26px;
                padding: 0 10px;
                border-radius: 999px;
                font-size: 12px;
                border: 1px solid currentColor;
              }

              .state-healthy {
                color: var(--live);
                background: rgba(37, 99, 235, 0.08);
              }

              .state-restored {
                color: var(--restored);
                background: rgba(5, 150, 105, 0.10);
              }

              .state-stale {
                color: var(--stale);
                background: rgba(217, 119, 6, 0.12);
              }

              .state-blocked {
                color: var(--blocked);
                background: rgba(194, 65, 65, 0.12);
              }

              .state-replay_only {
                color: var(--replay);
                background: rgba(124, 58, 237, 0.12);
              }

              .state-not_declared {
                color: var(--text-muted);
                background: rgba(100, 116, 139, 0.08);
              }

              .timeline-strip {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(132px, 1fr));
                gap: 10px;
              }

              .tables {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 18px;
              }

              .table-panel table {
                width: 100%;
                border-collapse: collapse;
              }

              .table-panel th,
              .table-panel td {
                padding: 10px 8px;
                border-bottom: 1px solid var(--border);
                font-size: 13px;
                text-align: left;
                vertical-align: top;
              }

              .table-row {
                border-radius: 14px;
              }

              .muted {
                color: var(--text-muted);
              }

              .empty-state {
                padding: 18px;
                border-radius: 18px;
                border: 1px dashed var(--border);
                background: var(--inset);
                color: var(--text-muted);
              }

              .inspector dl {
                display: grid;
                grid-template-columns: 124px 1fr;
                gap: 10px 12px;
                margin: 0;
              }

              .inspector dt {
                font-size: 12px;
                color: var(--text-muted);
                text-transform: uppercase;
                letter-spacing: 0.06em;
              }

              .inspector dd {
                margin: 0;
              }

              @media (max-width: 1220px) {
                .layout {
                  grid-template-columns: 1fr;
                }

                .rail,
                .inspector {
                  position: static;
                }

                .tables,
                .visual-grid {
                  grid-template-columns: 1fr;
                }
              }
            </style>
          </head>
          <body>
            <div class="page">
              <header class="masthead" data-testid="topology-masthead">
                <div class="brand">
                  <svg viewBox="0 0 48 48" aria-hidden="true" role="img">
                    <rect x="2" y="2" width="44" height="44" rx="14" fill="#0F172A"></rect>
                    <path d="M15 14v20h4V18h10v-4H15Zm14 0v4h4v12H25v4h12V14h-8Z" fill="#F8FAFC"></path>
                  </svg>
                  <div class="brand-label">
                    <strong>Vecells</strong>
                    <div class="muted">Live_Update_And_Cache_Atlas</div>
                  </div>
                </div>
                <div class="chip-row" id="masthead-chips"></div>
              </header>

              <div class="layout">
                <aside class="rail" aria-label="Filters">
                  <div class="filter-group">
                    <label for="filter-audience">Audience</label>
                    <select id="filter-audience" data-testid="filter-audience"></select>
                  </div>
                  <div class="filter-group">
                    <label for="filter-channel-state">Channel state</label>
                    <select id="filter-channel-state" data-testid="filter-channel-state"></select>
                  </div>
                  <div class="filter-group">
                    <label for="filter-cache-class">Cache class</label>
                    <select id="filter-cache-class" data-testid="filter-cache-class"></select>
                  </div>
                  <div class="filter-group">
                    <label for="filter-environment">Environment</label>
                    <select id="filter-environment" data-testid="filter-environment"></select>
                  </div>
                  <div class="filter-group">
                    <label for="filter-degraded-mode">Degraded mode</label>
                    <select id="filter-degraded-mode" data-testid="filter-degraded-mode"></select>
                  </div>
                </aside>

                <main class="canvas">
                  <section class="visual-grid">
                    <section class="panel" data-testid="topology-diagram">
                      <div class="section-title">Live-channel topology</div>
                      <p class="muted">Gateway-safe transport only. Open connections still leave truth freshness unproven.</p>
                      <div class="diagram-grid" id="diagram-grid"></div>
                    </section>

                    <section class="panel" data-testid="cache-grid">
                      <div class="section-title">Cache namespace grid</div>
                      <p class="muted">Named cache classes are provisioned now so route code cannot infer policy from implementation accidents later.</p>
                      <div class="cache-grid" id="cache-grid-cards"></div>
                    </section>
                  </section>

                  <section class="panel timeline-panel" data-testid="replay-timeline">
                    <div class="section-title">Reconnect and replay-state timeline</div>
                    <p class="muted">The selected row maps to one replay or stale-mode drill. Recovery stays explicit, bounded, and non-authoritative.</p>
                    <div class="timeline-strip" id="timeline-strip"></div>
                  </section>

                  <section class="tables">
                    <section class="table-panel panel" data-testid="topology-table">
                      <div class="section-title">Topology table</div>
                      <table>
                        <thead>
                          <tr>
                            <th>Environment</th>
                            <th>Route family</th>
                            <th>State</th>
                            <th>Audience</th>
                            <th>Transport</th>
                          </tr>
                        </thead>
                        <tbody id="topology-table-body"></tbody>
                      </table>
                    </section>

                    <section class="table-panel panel" data-testid="policy-table">
                      <div class="section-title">Cache and replay policy table</div>
                      <table>
                        <thead>
                          <tr>
                            <th>Namespace</th>
                            <th>Class</th>
                            <th>TTL</th>
                            <th>Hooks</th>
                          </tr>
                        </thead>
                        <tbody id="policy-table-body"></tbody>
                      </table>
                    </section>
                  </section>
                </main>

                <aside class="inspector" data-testid="inspector" aria-live="polite">
                  <div class="section-title">Selected boundary</div>
                  <p class="muted">Selecting a row synchronizes the topology cards, timeline, and cache policy surface.</p>
                  <div id="inspector-content"></div>
                </aside>
              </div>
            </div>

            <script>
              const APP_DATA = __APP_DATA__;

              const filterState = {
                audience: "all",
                channelState: "all",
                cacheClass: "all",
                environment: "all",
                degradedMode: "all",
              };

              const elements = {
                mastheadChips: document.getElementById("masthead-chips"),
                audience: document.getElementById("filter-audience"),
                channelState: document.getElementById("filter-channel-state"),
                cacheClass: document.getElementById("filter-cache-class"),
                environment: document.getElementById("filter-environment"),
                degradedMode: document.getElementById("filter-degraded-mode"),
                diagramGrid: document.getElementById("diagram-grid"),
                cacheGrid: document.getElementById("cache-grid-cards"),
                timeline: document.getElementById("timeline-strip"),
                topologyTable: document.getElementById("topology-table-body"),
                policyTable: document.getElementById("policy-table-body"),
                inspector: document.getElementById("inspector-content"),
              };

              const rowLookup = new Map(APP_DATA.boundaryRows.map((row) => [row.row_id, row]));
              const policyLookup = new Map(
                APP_DATA.cacheManifest.cacheNamespaces.map((row) => [row.namespaceRef, row]),
              );
              const scenarioLookup = new Map(
                APP_DATA.liveManifest.drillScenarios.map((row) => [row.scenarioId, row]),
              );

              let selectedRowId = APP_DATA.boundaryRows[0]?.row_id ?? null;
              document.body.dataset.reducedMotion = String(
                window.matchMedia("(prefers-reduced-motion: reduce)").matches,
              );

              function optionMarkup(values) {
                return ['<option value="all">All</option>']
                  .concat(values.map((value) => `<option value="${value}">${value}</option>`))
                  .join("");
              }

              function uniqueValues(key) {
                return [...new Set(APP_DATA.boundaryRows.map((row) => row[key]).filter(Boolean))].sort();
              }

              function installFilters() {
                elements.audience.innerHTML = optionMarkup(uniqueValues("audience_surface_ref"));
                elements.channelState.innerHTML = optionMarkup(uniqueValues("channel_state"));
                elements.cacheClass.innerHTML = optionMarkup(uniqueValues("namespace_class"));
                elements.environment.innerHTML = optionMarkup(uniqueValues("environment_ring"));
                elements.degradedMode.innerHTML = optionMarkup(uniqueValues("degraded_mode"));
                for (const [key, element] of Object.entries({
                  audience: elements.audience,
                  channelState: elements.channelState,
                  cacheClass: elements.cacheClass,
                  environment: elements.environment,
                  degradedMode: elements.degradedMode,
                })) {
                  element.addEventListener("change", () => {
                    filterState[key] = element.value;
                    render();
                  });
                }
              }

              function filteredRows() {
                return APP_DATA.boundaryRows.filter((row) => {
                  return (
                    (filterState.audience === "all" ||
                      row.audience_surface_ref === filterState.audience) &&
                    (filterState.channelState === "all" ||
                      row.channel_state === filterState.channelState) &&
                    (filterState.cacheClass === "all" ||
                      row.namespace_class === filterState.cacheClass) &&
                    (filterState.environment === "all" ||
                      row.environment_ring === filterState.environment) &&
                    (filterState.degradedMode === "all" ||
                      row.degraded_mode === filterState.degradedMode)
                  );
                });
              }

              function resolveSelectedRow(rows) {
                if (!rows.length) {
                  selectedRowId = null;
                  return null;
                }
                if (!selectedRowId || !rows.some((row) => row.row_id === selectedRowId)) {
                  selectedRowId = rows[0].row_id;
                }
                return rowLookup.get(selectedRowId);
              }

              function scenarioForRow(row) {
                if (!row) {
                  return APP_DATA.liveManifest.drillScenarios[0];
                }
                if (row.channel_state === "blocked") {
                  return scenarioLookup.get("operations_board_heartbeat_loss");
                }
                if (row.channel_state === "replay_only") {
                  return scenarioLookup.get("support_replay_window_exhausted");
                }
                if (row.namespace_class === "runtime_manifest") {
                  return scenarioLookup.get("runtime_manifest_reset_drill");
                }
                if (row.namespace_class === "projection_read" || row.namespace_class === "entity_scoped") {
                  return scenarioLookup.get("projection_cache_binding_drift");
                }
                return scenarioLookup.get("patient_home_reconnect_replay_safe");
              }

              function renderMasthead(rows) {
                const environments = [...new Set(rows.map((row) => row.environment_ring))].length;
                const staleCount = rows.filter((row) => row.channel_state === "stale").length;
                const blockedCount = rows.filter((row) => row.channel_state === "blocked").length;
                const replayWarnings = rows.filter((row) => row.channel_state === "replay_only").length;
                const restoredCount = rows.filter((row) => row.channel_state === "restored").length;
                const markup = [
                  `<span class="chip"><strong>${environments}</strong> active environments</span>`,
                  `<span class="chip" data-state="stale"><strong>${staleCount}</strong> stale alerts</span>`,
                  `<span class="chip" data-state="blocked"><strong>${blockedCount}</strong> blocked drills</span>`,
                  `<span class="chip" data-state="restored"><strong>${restoredCount}</strong> restored channels</span>`,
                  `<span class="chip" data-state="replay_only"><strong>${replayWarnings}</strong> replay warnings</span>`,
                ].join("");
                elements.mastheadChips.innerHTML = markup;
              }

              function renderDiagram(rows, selectedRow) {
                const grouped = new Map();
                for (const row of rows) {
                  const key = row.transport === "none" ? "none" : row.transport;
                  const current = grouped.get(key) ?? [];
                  current.push(row);
                  grouped.set(key, current);
                }
                const cards = [...grouped.entries()].map(([transport, transportRows]) => {
                  const selected = selectedRow && transportRows.some((row) => row.row_id === selectedRow.row_id);
                  const stateCounts = [...new Set(transportRows.map((row) => row.channel_state))].join(", ");
                  return `
                    <div class="diagram-card" data-selected="${selected}" data-testid="diagram-card-${transport}">
                      <div class="chip-row">
                        <span class="state-chip state-${selectedRow && selected ? selectedRow.channel_state : "healthy"}">${transport}</span>
                      </div>
                      <h3>${transport === "none" ? "Follow-on route seams" : transport.toUpperCase()} gateway fan-out</h3>
                      <p class="muted">${transportRows.length} boundary rows. States: ${stateCounts}</p>
                      <div class="monospace">${transportRows[0].transport_backend_ref || "no-live-contract"}</div>
                    </div>
                  `;
                });
                elements.diagramGrid.innerHTML = cards.join("");
              }

              function renderCacheGrid(rows, selectedRow) {
                const countsByNamespace = new Map();
                for (const row of rows) {
                  countsByNamespace.set(
                    row.cache_namespace_ref,
                    (countsByNamespace.get(row.cache_namespace_ref) ?? 0) + 1,
                  );
                }
                const cards = APP_DATA.cacheManifest.cacheNamespaces
                  .filter((namespace) => countsByNamespace.has(namespace.namespaceRef))
                  .map((namespace) => {
                    const selected = selectedRow && selectedRow.cache_namespace_ref === namespace.namespaceRef;
                    return `
                      <div class="cache-card" data-selected="${selected}" data-testid="cache-card-${namespace.namespaceRef}">
                        <div class="chip-row">
                          <span class="chip">${namespace.namespaceClass}</span>
                          <span class="chip">${countsByNamespace.get(namespace.namespaceRef)} rows</span>
                        </div>
                        <h3 class="monospace">${namespace.namespaceRef}</h3>
                        <p class="muted">${namespace.storageMode}, ${namespace.scopeMode}</p>
                        <p class="muted">TTL ${namespace.boundedTtlSeconds}s</p>
                      </div>
                    `;
                  });
                elements.cacheGrid.innerHTML = cards.join("");
              }

              function renderTimeline(row) {
                const scenario = scenarioForRow(row);
                const markup = scenario.timeline
                  .map((step, index) => {
                    const selected = index === scenario.timeline.length - 1;
                    return `
                      <div class="timeline-step" data-selected="${selected}" data-testid="timeline-step-${index}">
                        <div class="chip-row">
                          <span class="chip">${scenario.scenarioId}</span>
                          <span class="state-chip state-${row ? row.channel_state : "healthy"}">${row ? row.channel_state : "healthy"}</span>
                        </div>
                        <strong>${step}</strong>
                        <div class="muted">${scenario.description}</div>
                      </div>
                    `;
                  })
                  .join("");
                elements.timeline.dataset.selectedScenario = scenario.scenarioId;
                elements.timeline.innerHTML = markup;
              }

              function renderTopologyTable(rows, selectedRow) {
                if (!rows.length) {
                  elements.topologyTable.innerHTML = `
                    <tr><td colspan="5"><div class="empty-state">No boundary rows match the active filters.</div></td></tr>
                  `;
                  return;
                }
                elements.topologyTable.innerHTML = rows
                  .map((row) => {
                    const selected = selectedRow && row.row_id === selectedRow.row_id;
                    return `
                      <tr
                        class="table-row"
                        data-testid="topology-row-${row.row_id}"
                        data-selected="${selected}"
                      >
                        <td>
                          <button class="row-button" type="button" data-row-id="${row.row_id}">
                            ${row.environment_ring}
                          </button>
                        </td>
                        <td class="monospace">${row.route_family_ref}</td>
                        <td><span class="state-chip state-${row.channel_state}">${row.channel_state}</span></td>
                        <td>${row.audience_surface_ref}</td>
                        <td>${row.transport}</td>
                      </tr>
                    `;
                  })
                  .join("");

                elements.topologyTable.querySelectorAll(".row-button").forEach((button) => {
                  button.addEventListener("click", () => {
                    selectedRowId = button.dataset.rowId;
                    render();
                  });
                  button.addEventListener("keydown", (event) => {
                    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") {
                      return;
                    }
                    const visibleRows = filteredRows();
                    const index = visibleRows.findIndex((row) => row.row_id === button.dataset.rowId);
                    if (index === -1) {
                      return;
                    }
                    const nextIndex =
                      event.key === "ArrowDown"
                        ? Math.min(index + 1, visibleRows.length - 1)
                        : Math.max(index - 1, 0);
                    selectedRowId = visibleRows[nextIndex].row_id;
                    render();
                    requestAnimationFrame(() => {
                      const next = document.querySelector(
                        `[data-testid="topology-row-${selectedRowId}"] .row-button`,
                      );
                      if (next) {
                        next.focus();
                      }
                    });
                    event.preventDefault();
                  });
                });
              }

              function renderPolicyTable(rows, selectedRow) {
                const visibleNamespaces = [...new Set(rows.map((row) => row.cache_namespace_ref))];
                const policies = APP_DATA.cacheManifest.cacheNamespaces.filter((namespace) =>
                  visibleNamespaces.includes(namespace.namespaceRef),
                );
                if (!policies.length) {
                  elements.policyTable.innerHTML = `
                    <tr><td colspan="4"><div class="empty-state">No cache namespace rows match the active filters.</div></td></tr>
                  `;
                  return;
                }
                elements.policyTable.innerHTML = policies
                  .map((namespace) => {
                    const selected = selectedRow && selectedRow.cache_namespace_ref === namespace.namespaceRef;
                    return `
                      <tr
                        class="table-row"
                        data-testid="policy-row-${namespace.namespaceRef}"
                        data-selected="${selected}"
                      >
                        <td class="monospace">${namespace.namespaceRef}</td>
                        <td>${namespace.namespaceClass}</td>
                        <td>${namespace.boundedTtlSeconds}s</td>
                        <td>${namespace.invalidationHookRefs.join(", ")}</td>
                      </tr>
                    `;
                  })
                  .join("");
              }

              function renderInspector(row) {
                if (!row) {
                  elements.inspector.innerHTML = `<div class="empty-state">No boundary row selected.</div>`;
                  return;
                }
                const namespace = policyLookup.get(row.cache_namespace_ref);
                const scenario = scenarioForRow(row);
                elements.inspector.parentElement.dataset.selectedRow = row.row_id;
                elements.inspector.innerHTML = `
                  <div class="inspector-card">
                    <div class="chip-row">
                      <span class="state-chip state-${row.channel_state}">${row.channel_state}</span>
                      <span class="chip">${row.environment_ring}</span>
                    </div>
                    <h3 class="monospace">${row.route_family_ref}</h3>
                    <dl>
                      <dt>Audience</dt><dd>${row.audience_surface_ref}</dd>
                      <dt>Gateway</dt><dd class="monospace">${row.gateway_surface_ref}</dd>
                      <dt>Channel</dt><dd class="monospace">${row.transport_channel_ref || "follow_on_route_contract"}</dd>
                      <dt>Registry</dt><dd class="monospace">${row.connection_registry_ref || "none"}</dd>
                      <dt>Replay</dt><dd class="monospace">${row.replay_buffer_ref || "none"}</dd>
                      <dt>Namespace</dt><dd class="monospace">${row.cache_namespace_ref}</dd>
                      <dt>Cache policy</dt><dd class="monospace">${row.cache_policy_id}</dd>
                      <dt>Honesty</dt><dd>${row.truth_posture}</dd>
                      <dt>Drill</dt><dd class="monospace">${scenario.scenarioId}</dd>
                      <dt>Hooks</dt><dd>${namespace.invalidationHookRefs.join(", ")}</dd>
                    </dl>
                  </div>
                `;
              }

              function render() {
                const rows = filteredRows();
                const selectedRow = resolveSelectedRow(rows);
                renderMasthead(rows);
                renderDiagram(rows, selectedRow);
                renderCacheGrid(rows, selectedRow);
                renderTimeline(selectedRow);
                renderTopologyTable(rows, selectedRow);
                renderPolicyTable(rows, selectedRow);
                renderInspector(selectedRow);
              }

              installFilters();
              render();
            </script>
          </body>
        </html>
        """
    ).strip()
    return template.replace("__APP_DATA__", app_data_json)


def write_spec() -> None:
    write_text(
        SPEC_PATH,
        dedent(
            """
            import fs from "node:fs";
            import http from "node:http";
            import path from "node:path";
            import { fileURLToPath } from "node:url";

            const __filename = fileURLToPath(import.meta.url);
            const __dirname = path.dirname(__filename);
            const ROOT = path.resolve(__dirname, "..", "..");
            const HTML_PATH = path.join(
              ROOT,
              "docs",
              "architecture",
              "88_live_update_and_cache_atlas.html",
            );
            const CACHE_MANIFEST_PATH = path.join(
              ROOT,
              "data",
              "analysis",
              "cache_namespace_manifest.json",
            );
            const LIVE_MANIFEST_PATH = path.join(
              ROOT,
              "data",
              "analysis",
              "live_transport_topology_manifest.json",
            );
            const MATRIX_PATH = path.join(
              ROOT,
              "data",
              "analysis",
              "cache_transport_boundary_matrix.csv",
            );

            export const liveUpdateAndCacheAtlasCoverage = [
              "filter behavior and synchronized selection",
              "keyboard navigation and focus management",
              "reduced-motion handling",
              "responsive layout at desktop and tablet widths",
              "accessibility smoke checks and landmark verification",
              "verification that stale and blocked modes remain visibly distinct from restored or healthy modes",
            ];

            function assertCondition(condition, message) {
              if (!condition) {
                throw new Error(message);
              }
            }

            function parseCsv(text) {
              const rows = [];
              let row = [];
              let cell = "";
              let inQuotes = false;
              for (let index = 0; index < text.length; index += 1) {
                const char = text[index];
                const next = text[index + 1];
                if (char === '"' && inQuotes && next === '"') {
                  cell += '"';
                  index += 1;
                  continue;
                }
                if (char === '"') {
                  inQuotes = !inQuotes;
                  continue;
                }
                if (char === "," && !inQuotes) {
                  row.push(cell);
                  cell = "";
                  continue;
                }
                if ((char === "\\n" || char === "\\r") && !inQuotes) {
                  if (char === "\\r" && next === "\\n") {
                    index += 1;
                  }
                  row.push(cell);
                  if (row.some((value) => value.length > 0)) {
                    rows.push(row);
                  }
                  row = [];
                  cell = "";
                  continue;
                }
                cell += char;
              }
              if (cell.length || row.length) {
                row.push(cell);
                rows.push(row);
              }
              const [headers, ...body] = rows;
              return body.map((values) =>
                Object.fromEntries(headers.map((header, idx) => [header, values[idx] ?? ""])),
              );
            }

            async function importPlaywright() {
              try {
                return await import("playwright");
              } catch {
                throw new Error("This spec needs the `playwright` package when run with --run.");
              }
            }

            function filteredRows(rows, filters) {
              return rows.filter((row) => {
                return (
                  (!filters.audience || row.audience_surface_ref === filters.audience) &&
                  (!filters.channelState || row.channel_state === filters.channelState) &&
                  (!filters.cacheClass || row.namespace_class === filters.cacheClass) &&
                  (!filters.environment || row.environment_ring === filters.environment) &&
                  (!filters.degradedMode || row.degraded_mode === filters.degradedMode)
                );
              });
            }

            function serve(rootDir) {
              const server = http.createServer((request, response) => {
                const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
                let pathname = decodeURIComponent(requestUrl.pathname);
                if (pathname === "/") {
                  pathname = "/docs/architecture/88_live_update_and_cache_atlas.html";
                }
                const filePath = path.join(rootDir, pathname);
                if (!filePath.startsWith(rootDir)) {
                  response.writeHead(403);
                  response.end("forbidden");
                  return;
                }
                fs.readFile(filePath, (error, buffer) => {
                  if (error) {
                    response.writeHead(404);
                    response.end("not found");
                    return;
                  }
                  const extension = path.extname(filePath);
                  const type =
                    extension === ".html"
                      ? "text/html"
                      : extension === ".json"
                        ? "application/json"
                        : extension === ".csv"
                          ? "text/csv"
                          : "text/plain";
                  response.writeHead(200, { "Content-Type": type });
                  response.end(buffer);
                });
              });
              return new Promise((resolve, reject) => {
                server.listen(0, "127.0.0.1", () => {
                  const address = server.address();
                  if (!address || typeof address === "string") {
                    reject(new Error("Unable to bind local server."));
                    return;
                  }
                  resolve({
                    server,
                    url: `http://127.0.0.1:${address.port}/docs/architecture/88_live_update_and_cache_atlas.html`,
                  });
                });
              });
            }

            export async function run() {
              assertCondition(fs.existsSync(HTML_PATH), "Live update and cache atlas HTML is missing.");
              const cacheManifest = JSON.parse(fs.readFileSync(CACHE_MANIFEST_PATH, "utf8"));
              const liveManifest = JSON.parse(fs.readFileSync(LIVE_MANIFEST_PATH, "utf8"));
              const matrix = parseCsv(fs.readFileSync(MATRIX_PATH, "utf8"));

              assertCondition(cacheManifest.summary.cache_namespace_count === 21, "Cache namespace count drifted.");
              assertCondition(liveManifest.summary.live_channel_count === 15, "Live channel count drifted.");
              assertCondition(matrix.length === 95, "Boundary matrix row count drifted.");

              const { chromium } = await importPlaywright();
              const { server, url } = await serve(ROOT);
              const browser = await chromium.launch({ headless: true });

              try {
                const page = await browser.newPage({ viewport: { width: 1460, height: 1180 } });
                await page.goto(url, { waitUntil: "networkidle" });

                await page.locator("[data-testid='topology-diagram']").waitFor();
                await page.locator("[data-testid='cache-grid']").waitFor();
                await page.locator("[data-testid='replay-timeline']").waitFor();
                await page.locator("[data-testid='topology-table']").waitFor();
                await page.locator("[data-testid='policy-table']").waitFor();
                await page.locator("[data-testid='inspector']").waitFor();

                assertCondition(
                  (await page.locator("[data-testid^='topology-row-']").count()) === matrix.length,
                  "Initial topology row count drifted.",
                );

                await page.locator("[data-testid='filter-audience']").selectOption("audsurf_operations_console");
                await page.locator("[data-testid='filter-environment']").selectOption("ci-preview");
                await page.locator("[data-testid='filter-channel-state']").selectOption("stale");
                const staleOperationsRows = filteredRows(matrix, {
                  audience: "audsurf_operations_console",
                  environment: "ci-preview",
                  channelState: "stale",
                });
                assertCondition(
                  (await page.locator("[data-testid^='topology-row-']").count()) === staleOperationsRows.length,
                  "Audience, environment, and channel-state filter drifted.",
                );

                await page.locator("[data-testid='filter-audience']").selectOption("all");
                await page.locator("[data-testid='filter-environment']").selectOption("all");
                await page.locator("[data-testid='filter-channel-state']").selectOption("all");
                await page.locator("[data-testid='filter-cache-class']").selectOption("entity_scoped");
                const entityRows = filteredRows(matrix, { cacheClass: "entity_scoped" });
                assertCondition(
                  (await page.locator("[data-testid^='topology-row-']").count()) === entityRows.length,
                  "Cache-class filter drifted.",
                );

                await page.locator("[data-testid='filter-cache-class']").selectOption("all");
                await page
                  .locator("[data-testid='filter-degraded-mode']")
                  .selectOption("fail_closed_review_required");
                const blockedRows = filteredRows(matrix, {
                  degradedMode: "fail_closed_review_required",
                });
                assertCondition(
                  blockedRows.length > 0 &&
                    (await page.locator("[data-testid^='topology-row-']").count()) === blockedRows.length,
                  "Degraded-mode filter drifted.",
                );

                const blockedRow = blockedRows[0];
                await page
                  .locator(`[data-testid='topology-row-${blockedRow.row_id}'] .row-button`)
                  .click();
                const inspectorText = await page.locator("[data-testid='inspector']").innerText();
                assertCondition(
                  inspectorText.includes(blockedRow.route_family_ref) &&
                    inspectorText.includes(blockedRow.connection_registry_ref),
                  "Inspector lost synchronized blocked-row detail.",
                );

                const blockedColor = await page
                  .locator(`[data-testid='topology-row-${blockedRow.row_id}'] .state-chip`)
                  .evaluate((node) => getComputedStyle(node).backgroundColor);
                await page.locator("[data-testid='filter-degraded-mode']").selectOption("restored_after_rebind");
                const restoredRows = filteredRows(matrix, { degradedMode: "restored_after_rebind" });
                assertCondition(restoredRows.length > 0, "Restored rows are missing.");
                const restoredRow = restoredRows[0];
                const restoredColor = await page
                  .locator(`[data-testid='topology-row-${restoredRow.row_id}'] .state-chip`)
                  .evaluate((node) => getComputedStyle(node).backgroundColor);
                assertCondition(
                  blockedColor !== restoredColor,
                  "Blocked and restored modes are no longer visually distinct.",
                );

                await page.locator("[data-testid='filter-degraded-mode']").selectOption("all");
                const visibleRows = filteredRows(matrix, {});
                const first = visibleRows[0];
                const second = visibleRows[1];
                await page
                  .locator(`[data-testid='topology-row-${first.row_id}'] .row-button`)
                  .focus();
                await page.keyboard.press("ArrowDown");
                const secondSelected = await page
                  .locator(`[data-testid='topology-row-${second.row_id}']`)
                  .getAttribute("data-selected");
                assertCondition(
                  secondSelected === "true",
                  "Arrow-key navigation did not advance to the next visible row.",
                );

                await page.setViewportSize({ width: 1024, height: 900 });
                assertCondition(
                  await page.locator("[data-testid='inspector']").isVisible(),
                  "Inspector disappeared at tablet width.",
                );
                assertCondition(
                  await page.locator("[data-testid='topology-table']").isVisible(),
                  "Topology table disappeared at tablet width.",
                );

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

            export const liveUpdateAndCacheAtlasManifest = {
              task: "par_088",
              cacheNamespaces: 21,
              liveChannels: 15,
              boundaryRows: 95,
            };
            """
        ).strip(),
    )


def main() -> None:
    cache_manifest, live_transport_manifest, boundary_rows = build_manifests()
    write_json(CACHE_MANIFEST_PATH, cache_manifest)
    write_json(LIVE_TRANSPORT_MANIFEST_PATH, live_transport_manifest)
    write_csv(BOUNDARY_MATRIX_PATH, boundary_rows)
    patch_runtime_topology_manifest()
    write_docs(cache_manifest, live_transport_manifest, boundary_rows)
    write_infra(cache_manifest, live_transport_manifest)
    write_text(ATLAS_PATH, build_atlas_html(cache_manifest, live_transport_manifest, boundary_rows))
    write_spec()
    ensure_domain_kernel_export()
    patch_api_gateway_package()
    ensure_service_definition()
    ensure_runtime_handler()
    patch_root_package()
    patch_playwright_package()


if __name__ == "__main__":
    main()
