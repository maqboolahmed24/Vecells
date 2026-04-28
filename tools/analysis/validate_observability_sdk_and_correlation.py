#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"

OBSERVABILITY_MANIFEST_PATH = DATA_DIR / "observability_event_schema_manifest.json"
CORRELATION_MATRIX_PATH = DATA_DIR / "correlation_propagation_matrix.csv"
REDACTION_POLICY_PATH = DATA_DIR / "telemetry_redaction_policy.json"
RUNTIME_TOPOLOGY_PATH = DATA_DIR / "runtime_topology_manifest.json"

DESIGN_DOC_PATH = ROOT / "docs" / "architecture" / "93_observability_sdk_and_edge_correlation_design.md"
RULES_DOC_PATH = ROOT / "docs" / "architecture" / "93_phi_safe_telemetry_and_causality_rules.md"
HTML_PATH = ROOT / "docs" / "architecture" / "93_edge_correlation_spine_explorer.html"
SPEC_PATH = ROOT / "tests" / "playwright" / "edge-correlation-spine-explorer.spec.js"

ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = ROOT / "tests" / "playwright" / "package.json"
ROOT_SCRIPT_UPDATES_PATH = ROOT / "tools" / "analysis" / "root_script_updates.py"
PARALLEL_GATE_PATH = ROOT / "tools" / "analysis" / "build_parallel_foundation_tracks_gate.py"

OBSERVABILITY_INDEX_PATH = ROOT / "packages" / "observability" / "src" / "index.ts"
CORRELATION_SPINE_PATH = ROOT / "packages" / "observability" / "src" / "correlation-spine.ts"
TELEMETRY_PATH = ROOT / "packages" / "observability" / "src" / "telemetry.ts"
UI_CAUSALITY_PATH = ROOT / "packages" / "observability" / "src" / "ui-causality.ts"

API_GATEWAY_RUNTIME_PATH = ROOT / "services" / "api-gateway" / "src" / "runtime.ts"
COMMAND_API_RUNTIME_PATH = ROOT / "services" / "command-api" / "src" / "runtime.ts"
PROJECTION_WORKER_RUNTIME_PATH = ROOT / "services" / "projection-worker" / "src" / "runtime.ts"
NOTIFICATION_WORKER_RUNTIME_PATH = ROOT / "services" / "notification-worker" / "src" / "runtime.ts"


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def read_json(path: Path) -> dict:
    require(path.exists(), f"missing required file: {path.relative_to(ROOT)}")
    return json.loads(path.read_text(encoding="utf-8"))


def read_csv(path: Path) -> list[dict[str, str]]:
    require(path.exists(), f"missing required file: {path.relative_to(ROOT)}")
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def require_tokens(path: Path, tokens: list[str]) -> None:
    text = path.read_text(encoding="utf-8")
    for token in tokens:
        require(token in text, f"missing token `{token}` in {path.relative_to(ROOT)}")


def main() -> None:
    observability_manifest = read_json(OBSERVABILITY_MANIFEST_PATH)
    redaction_policy = read_json(REDACTION_POLICY_PATH)
    runtime_topology = read_json(RUNTIME_TOPOLOGY_PATH)
    matrix_rows = read_csv(CORRELATION_MATRIX_PATH)

    require(
        observability_manifest["task_id"] == "par_093",
        "observability manifest task id drifted",
    )
    require(
        observability_manifest["visual_mode"] == "Edge_Correlation_Spine_Explorer",
        "observability manifest visual mode drifted",
    )

    manifest_summary = observability_manifest["summary"]
    expected_manifest_counts = {
        "event_schema_count": 12,
        "trace_run_count": 4,
        "correlation_hop_row_count": 30,
        "hop_kind_count": 8,
        "policy_rule_count": 7,
        "masked_trace_count": 2,
        "blocked_trace_count": 1,
        "missing_correlation_trace_count": 1,
        "settled_trace_count": 2,
        "live_channel_count": 15,
        "preview_environment_count": 6,
    }
    for key, value in expected_manifest_counts.items():
        require(manifest_summary[key] == value, f"observability manifest summary `{key}` drifted")

    expected_trace_refs = {
        "trace_patient_live_settled",
        "trace_support_restore_visible",
        "trace_ops_missing_correlation",
        "trace_governance_blocked_disclosure",
    }
    trace_runs = observability_manifest["trace_runs"]
    require(
        {trace["traceRef"] for trace in trace_runs} == expected_trace_refs,
        "observability trace refs drifted",
    )

    expected_trace_states = {
        "trace_patient_live_settled": ("verified", "masked", "settled", "settled", 8),
        "trace_support_restore_visible": ("verified", "masked", "restored", "settled", 8),
        "trace_ops_missing_correlation": ("missing", "verified", "live", "blocked", 6),
        "trace_governance_blocked_disclosure": ("verified", "blocked", "stale", "blocked", 8),
    }
    for trace in trace_runs:
        expected = expected_trace_states[trace["traceRef"]]
        require(
            (
                trace["correlationState"],
                trace["disclosureState"],
                trace["replayState"],
                trace["settlementState"],
                len(trace["hops"]),
            )
            == expected,
            f"trace state drifted for {trace['traceRef']}",
        )

    expected_event_schema_refs = {
        "obs_gateway_request_completed",
        "obs_command_request_completed",
        "obs_event_spine_published",
        "obs_projection_worker_applied",
        "obs_projection_materialized",
        "obs_ui_transition_server_accepted",
        "obs_ui_restore_applied",
        "obs_ui_freshness_stale_visible",
        "obs_ui_projection_seen",
        "obs_ui_settlement",
        "obs_audit_correlation_bound",
        "obs_disclosure_blocked",
    }
    require(
        {row["eventSchemaRef"] for row in observability_manifest["event_schemas"]}
        == expected_event_schema_refs,
        "observability event schema refs drifted",
    )

    require(len(matrix_rows) == 30, "correlation propagation matrix row count drifted")
    require(
        {row["traceRef"] for row in matrix_rows} == expected_trace_refs,
        "correlation propagation matrix trace refs drifted",
    )
    require(
        {
            "browser",
            "gateway",
            "command_handler",
            "event_bus",
            "worker",
            "projection",
            "ui_visibility_receipt",
            "audit",
        }
        == {row["hopKind"] for row in matrix_rows},
        "correlation propagation matrix hop kinds drifted",
    )
    require(
        any(row["traceCorrelationState"] == "missing" for row in matrix_rows),
        "missing-correlation coverage drifted from correlation matrix",
    )
    require(
        any(row["disclosureState"] == "blocked" for row in matrix_rows),
        "blocked disclosure coverage drifted from correlation matrix",
    )
    require(
        any(row["replayState"] == "restored" for row in matrix_rows),
        "restored replay coverage drifted from correlation matrix",
    )
    require(
        any(row["settlementState"] == "settled" for row in matrix_rows),
        "settled coverage drifted from correlation matrix",
    )

    require(redaction_policy["task_id"] == "par_093", "redaction policy task id drifted")
    require(
        redaction_policy["visual_mode"] == "Edge_Correlation_Spine_Explorer",
        "redaction policy visual mode drifted",
    )

    expected_policy_summary = {
        "rule_count": 7,
        "blocked_class_count": 1,
        "masked_class_count": 3,
        "permitted_event_family_count": 6,
    }
    for key, value in expected_policy_summary.items():
        require(redaction_policy["summary"][key] == value, f"redaction policy `{key}` drifted")

    expected_disclosure_classes = {
        "control_plane_safe",
        "public_descriptor",
        "phi_reference_only",
        "masked_contact_descriptor",
        "masked_route_descriptor",
        "audit_link_only",
        "blocked_raw_phi",
    }
    rule_map = {rule["disclosureClass"]: rule for rule in redaction_policy["rules"]}
    require(set(rule_map.keys()) == expected_disclosure_classes, "redaction classes drifted")
    require(
        rule_map["blocked_raw_phi"]["allowedEventFamilies"] == [],
        "blocked_raw_phi rule drifted",
    )

    event_family_policy_map = {
        row["eventFamily"]: set(row["permittedClasses"])
        for row in redaction_policy["event_family_policies"]
    }
    require(
        event_family_policy_map["ui_visibility_receipt"]
        == {"control_plane_safe", "public_descriptor", "audit_link_only"},
        "ui_visibility_receipt permitted classes drifted",
    )
    require(
        redaction_policy["bounded_gaps"]
        == [
            "FOLLOW_ON_DEPENDENCY_097_WAVE_OBSERVATION_POLICY_PENDING",
            "FOLLOW_ON_DEPENDENCY_094_RUNTIME_PUBLICATION_BUNDLE_PENDING",
        ],
        "observability bounded gaps drifted",
    )

    require(
        runtime_topology.get("observability_event_schema_manifest_ref")
        == "data/analysis/observability_event_schema_manifest.json",
        "runtime topology missing observability manifest ref",
    )
    require(
        runtime_topology.get("correlation_propagation_matrix_ref")
        == "data/analysis/correlation_propagation_matrix.csv",
        "runtime topology missing correlation matrix ref",
    )
    require(
        runtime_topology.get("telemetry_redaction_policy_ref")
        == "data/analysis/telemetry_redaction_policy.json",
        "runtime topology missing redaction policy ref",
    )

    require_tokens(
        DESIGN_DOC_PATH,
        [
            "edgeCorrelationId",
            "causalToken",
            "PHI-safe telemetry SDK",
            "observability_event_schema_manifest.json",
            "correlation_propagation_matrix.csv",
            "telemetry_redaction_policy.json",
        ],
    )
    require_tokens(
        RULES_DOC_PATH,
        [
            "control_plane_safe",
            "blocked_raw_phi",
            "UIEventCausalityFrame",
            "UIProjectionVisibilityReceipt",
            "UITransitionSettlementRecord",
            "Protected internal runtime routes require propagated edge correlation context.",
        ],
    )
    require_tokens(
        HTML_PATH,
        [
            "Edge_Correlation_Spine_Explorer",
            'data-testid="causality-river"',
            'data-testid="disclosure-matrix"',
            'data-testid="settlement-timeline"',
            'data-testid="event-table"',
            'data-testid="policy-table"',
            'data-testid="inspector"',
            'data-testid="filter-environment"',
            'data-testid="filter-hop-type"',
            'data-testid="filter-event-family"',
            'data-testid="filter-disclosure-state"',
            'data-testid="filter-replay-state"',
            "Replay Health",
            "stat-replay",
            "data-hop",
            "state-missing",
            "state-blocked",
        ],
    )
    require_tokens(
        SPEC_PATH,
        [
            "filter behavior and synchronized selection",
            "keyboard navigation and focus management",
            "reduced-motion handling",
            "responsive layout at desktop and tablet widths",
            "accessibility smoke checks and landmark verification",
            "verification that missing-correlation and blocked-disclosure states are visibly distinct from verified states",
            "trace_support_restore_visible",
            "trace_governance_blocked_disclosure",
            "Replay health stat drifted",
            "Selected hop no longer synchronizes the causality river.",
        ],
    )
    require_tokens(
        OBSERVABILITY_INDEX_PATH,
        [
            'export * from "./correlation-spine";',
            'export * from "./telemetry";',
            'export * from "./ui-causality";',
        ],
    )
    require_tokens(
        CORRELATION_SPINE_PATH,
        [
            "mintEdgeCorrelation",
            "advanceCorrelationHop",
            "serializeCorrelationHeaders",
            "x-vecells-edge-correlation-id",
            "x-vecells-causal-token",
            "x-vecells-hop-sequence",
            "x-vecells-replay-state",
        ],
    )
    require_tokens(
        TELEMETRY_PATH,
        [
            "blockedRawPhiField",
            "createStructuredTelemetryLogger",
            "InMemoryTelemetrySink",
            "ConsoleTelemetrySink",
            "recordTraceSpan",
            "recordMetricSample",
            "reconstructCorrelationChain",
        ],
    )
    require_tokens(
        UI_CAUSALITY_PATH,
        [
            "createUIEventCausalityFrame",
            "createUIEventEmissionCheckpoint",
            "createUIProjectionVisibilityReceipt",
            "createUITransitionSettlementRecord",
            "createUITelemetryDisclosureFence",
            "emitProjectionVisibilityReceipt",
            "emitTransitionSettlement",
            "emitAuditCorrelationRecord",
        ],
    )
    require_tokens(
        API_GATEWAY_RUNTIME_PATH,
        [
            "mintEdgeCorrelation",
            "advanceCorrelationHop",
            "serializeCorrelationHeaders",
            "readCorrelationFromHeaders",
        ],
    )
    for path in [
        COMMAND_API_RUNTIME_PATH,
        PROJECTION_WORKER_RUNTIME_PATH,
        NOTIFICATION_WORKER_RUNTIME_PATH,
    ]:
        require_tokens(
            path,
            [
                "advanceCorrelationHop",
                "readCorrelationFromHeaders(headers, { requireContext: true })",
                "serializeCorrelationHeaders",
            ],
        )

    require_tokens(
        ROOT_PACKAGE_PATH,
        [
            "validate:observability",
            "build_observability_sdk_and_correlation.py",
        ],
    )
    require_tokens(
        PLAYWRIGHT_PACKAGE_PATH,
        [
            "observability spine",
            "edge-correlation-spine-explorer.spec.js",
        ],
    )
    require_tokens(
        ROOT_SCRIPT_UPDATES_PATH,
        [
            "validate:observability",
            "build_observability_sdk_and_correlation.py",
        ],
    )
    require_tokens(PARALLEL_GATE_PATH, ["edge-correlation-spine-explorer.spec.js"])

    print("observability sdk and correlation validation passed")


if __name__ == "__main__":
    main()
