#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import re
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"

REQUIRED_INPUTS = {
    "requirement_registry": DATA_DIR / "requirement_registry.jsonl",
    "summary_reconciliation": DATA_DIR / "summary_reconciliation_matrix.csv",
    "product_scope": DATA_DIR / "product_scope_matrix.csv",
    "audience_surface_inventory": DATA_DIR / "audience_surface_inventory.csv",
    "route_family_inventory": DATA_DIR / "route_family_inventory.csv",
    "endpoint_matrix": DATA_DIR / "endpoint_matrix.csv",
    "object_catalog": DATA_DIR / "object_catalog.json",
    "state_machines": DATA_DIR / "state_machines.json",
    "external_dependencies": DATA_DIR / "external_dependencies.json",
    "regulatory_workstreams": DATA_DIR / "regulatory_workstreams.json",
    "data_classification": DATA_DIR / "data_classification_matrix.csv",
    "audit_disclosure": DATA_DIR / "audit_event_disclosure_matrix.csv",
    "runtime_topology": DATA_DIR / "runtime_workload_families.json",
    "gateway_matrix": DATA_DIR / "gateway_surface_matrix.csv",
    "workspace_graph": DATA_DIR / "workspace_package_graph.json",
    "service_runtime": DATA_DIR / "service_runtime_matrix.csv",
    "frontend_stack": DATA_DIR / "frontend_stack_scorecard.csv",
    "ui_contract_publication": DATA_DIR / "ui_contract_publication_matrix.csv",
}

DELIVERABLES = [
    DOCS_DIR / "15_observability_baseline.md",
    DOCS_DIR / "15_security_control_and_secret_management_baseline.md",
    DOCS_DIR / "15_release_and_supply_chain_tooling_baseline.md",
    DOCS_DIR / "15_verification_ladder_and_quality_gate_strategy.md",
    DOCS_DIR / "15_operational_readiness_and_resilience_tooling.md",
    DOCS_DIR / "15_incident_audit_and_assurance_tooling.md",
    DOCS_DIR / "15_release_evidence_cockpit_atlas.html",
    DATA_DIR / "tooling_scorecard.csv",
    DATA_DIR / "observability_signal_matrix.csv",
    DATA_DIR / "security_control_matrix.csv",
    DATA_DIR / "release_gate_matrix.csv",
    DATA_DIR / "supply_chain_and_provenance_matrix.json",
    DATA_DIR / "essential_function_slo_matrix.csv",
    DATA_DIR / "incident_and_alert_routing_matrix.csv",
]

ATLAS_MARKERS = [
    'data-testid="cockpit-shell"',
    'data-testid="left-rail"',
    'data-testid="rail-toggle"',
    'data-testid="hero-strip"',
    'data-testid="filter-gate"',
    'data-testid="filter-tooling-family"',
    'data-testid="filter-essential-function"',
    'data-testid="filter-tenant-scope"',
    'data-testid="filter-trust-slice"',
    'data-testid="filter-gap"',
    'data-testid="gate-matrix"',
    'data-testid="watch-tuple-inspector"',
    'data-testid="essential-function-panel"',
    'data-testid="provenance-panel"',
    'data-testid="incident-panel"',
    'data-testid="selection-state"',
    "data-selected-gate",
    "data-watch-tuple-hash",
    "data-selected-essential-function",
    "data-alert-state",
    "data-provenance-state",
    "data-breakpoint-class",
]

SAFE_TELEMETRY_FIELDS = {
    "eventId",
    "edgeCorrelationId",
    "causalToken",
    "routeFamilyCode",
    "shellDecisionClass",
    "selectedAnchorChangeClass",
    "bridgeCapabilityClass",
    "artifactModeClass",
    "taskRef",
    "lineageRef",
    "maskScopeClass",
    "restoreState",
    "adminActionRef",
    "governancePackageHash",
    "releaseTupleHash",
    "watchTupleHash",
    "reviewState",
    "auditQueryHash",
    "breakGlassReasonClass",
    "exportArtifactClass",
    "controlObjectiveId",
    "graphHash",
    "packState",
    "restoreTupleHash",
    "failoverTupleHash",
    "chaosTupleHash",
    "recoveryPostureClass",
    "safeDescriptorHash",
    "safeRouteScopeHash",
    "tenantScopeClass",
    "trustSliceCode",
    "boardTupleHash",
    "releaseContractMatrixHash",
    "artifactDigestRef",
    "serviceClass",
    "sliCode",
    "channelFreezeClass",
    "parityState",
}

FORBIDDEN_FIELD_FRAGMENTS = {
    "patient",
    "phone",
    "narrative",
    "message",
    "jwt",
    "routeParams",
    "identity",
    "prompt",
    "artifactBytes",
}

REQUIRED_GATES = {
    "GATE_0_STATIC_AND_UNIT",
    "GATE_1_CONTRACT_AND_COMPONENT",
    "GATE_2_INTEGRATION_AND_E2E",
    "GATE_3_PERFORMANCE_AND_SECURITY",
    "GATE_4_RESILIENCE_AND_RECOVERY",
    "GATE_5_LIVE_WAVE_PROOF",
}

REQUIRED_OBJECTS = {
    "BuildProvenanceRecord",
    "RuntimePublicationBundle",
    "ReleasePublicationParityRecord",
    "VerificationScenario",
    "ReleaseContractVerificationMatrix",
    "ReleaseWatchTuple",
    "OperationalReadinessSnapshot",
    "EssentialFunctionHealthEnvelope",
}

REQUIRED_CONTROL_DOMAINS = {
    "ingress_hardening",
    "session_security",
    "browser_hardening",
    "secret_management",
    "telemetry_redaction",
    "service_identity",
    "supply_chain",
    "scanner_coverage",
    "policy_gate",
    "exception_governance",
    "heightened_audit",
    "incident_governance",
    "resilience_authority",
}

REQUIRED_ALERTS = {
    "ALERT_PATIENT_ENTRY_SLO",
    "ALERT_WORKSPACE_SETTLEMENT_SLO",
    "ALERT_BOOKING_AND_PARTNER_FLOW_SLO",
    "ALERT_WATCH_TUPLE_OR_PARITY_DRIFT",
    "ALERT_PROVENANCE_OR_SBOM_BLOCKED",
    "ALERT_DISCLOSURE_FENCE_BLOCKED",
    "ALERT_READINESS_OR_REHEARSAL_STALE",
    "ALERT_SECURITY_INCIDENT_OR_NEAR_MISS",
}


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def load_json(path: Path) -> Any:
    return json.loads(path.read_text())


def load_csv(path: Path) -> list[dict[str, str]]:
    with path.open() as handle:
        return list(csv.DictReader(handle))


def count_jsonl(path: Path) -> int:
    return sum(1 for line in path.read_text().splitlines() if line.strip())


def split_values(value: str) -> list[str]:
    return [item.strip() for item in value.split(";") if item.strip()]


def ensure_prerequisites() -> dict[str, Any]:
    for name, path in REQUIRED_INPUTS.items():
        assert_true(path.exists(), f"Missing seq_015 prerequisite {name}: {path}")

    summary_rows = load_csv(REQUIRED_INPUTS["summary_reconciliation"])
    scope_rows = load_csv(REQUIRED_INPUTS["product_scope"])
    surface_rows = load_csv(REQUIRED_INPUTS["audience_surface_inventory"])
    route_rows = load_csv(REQUIRED_INPUTS["route_family_inventory"])
    endpoint_rows = load_csv(REQUIRED_INPUTS["endpoint_matrix"])
    object_payload = load_json(REQUIRED_INPUTS["object_catalog"])
    machine_payload = load_json(REQUIRED_INPUTS["state_machines"])
    dependency_payload = load_json(REQUIRED_INPUTS["external_dependencies"])
    regulatory_payload = load_json(REQUIRED_INPUTS["regulatory_workstreams"])
    classification_rows = load_csv(REQUIRED_INPUTS["data_classification"])
    disclosure_rows = load_csv(REQUIRED_INPUTS["audit_disclosure"])
    topology_payload = load_json(REQUIRED_INPUTS["runtime_topology"])
    gateway_rows = load_csv(REQUIRED_INPUTS["gateway_matrix"])
    workspace_payload = load_json(REQUIRED_INPUTS["workspace_graph"])
    service_rows = load_csv(REQUIRED_INPUTS["service_runtime"])
    frontend_rows = load_csv(REQUIRED_INPUTS["frontend_stack"])
    contract_rows = load_csv(REQUIRED_INPUTS["ui_contract_publication"])

    assert_true(len(summary_rows) >= 25, "Summary reconciliation prerequisite drifted.")
    assert_true(len(scope_rows) >= 30, "Product scope prerequisite drifted.")
    assert_true(len(surface_rows) == 22, "Audience surface prerequisite count drifted.")
    assert_true(len(route_rows) == 20, "Route family prerequisite count drifted.")
    assert_true(len(endpoint_rows) == 15, "Endpoint matrix prerequisite count drifted.")
    assert_true(object_payload["summary"]["object_count"] >= 900, "Object catalog prerequisite looks incomplete.")
    assert_true(machine_payload["summary"]["machine_count"] >= 40, "State machine prerequisite looks incomplete.")
    assert_true(dependency_payload["summary"]["dependency_count"] == 20, "External dependency prerequisite drifted.")
    assert_true(regulatory_payload["summary"]["workstream_count"] >= 13, "Regulatory workstream prerequisite drifted.")
    assert_true(len(classification_rows) >= 70, "Data classification prerequisite looks incomplete.")
    assert_true(len(disclosure_rows) >= 10, "Audit disclosure prerequisite looks incomplete.")
    assert_true(topology_payload["summary"]["gateway_surface_count"] == 22, "Runtime topology prerequisite drifted.")
    assert_true(len(gateway_rows) == 22, "Gateway matrix prerequisite drifted.")
    assert_true(workspace_payload["summary"]["node_count"] >= 50, "Workspace graph prerequisite looks incomplete.")
    assert_true(len(service_rows) == 21, "Service runtime prerequisite drifted.")
    assert_true(len(frontend_rows) == 3, "Frontend stack prerequisite drifted.")
    assert_true(len(contract_rows) == 8, "UI contract publication prerequisite drifted.")

    return {
        "requirement_registry_rows": count_jsonl(REQUIRED_INPUTS["requirement_registry"]),
        "route_family_count": len(route_rows),
        "audience_surface_count": len(surface_rows),
        "endpoint_count": len(endpoint_rows),
        "service_runtime_count": len(service_rows),
        "external_dependency_count": dependency_payload["summary"]["dependency_count"],
        "workstream_count": regulatory_payload["summary"]["workstream_count"],
    }


def ensure_deliverables() -> None:
    for path in DELIVERABLES:
        assert_true(path.exists(), f"Missing seq_015 deliverable: {path}")


def validate_tooling_scorecard() -> list[dict[str, str]]:
    rows = load_csv(DATA_DIR / "tooling_scorecard.csv")
    assert_true(len(rows) == 24, "Tooling scorecard row count drifted.")
    family_ids = {row["tooling_family_id"] for row in rows}
    assert_true(len(family_ids) == 8, "Expected eight tooling families in scorecard.")

    for family_id in family_ids:
        family_rows = [row for row in rows if row["tooling_family_id"] == family_id]
        assert_true(len(family_rows) == 3, f"Expected three scorecard options for {family_id}.")
        chosen_rows = [row for row in family_rows if row["decision"] == "chosen"]
        assert_true(len(chosen_rows) == 1, f"Expected exactly one chosen scorecard row for {family_id}.")
        chosen = chosen_rows[0]
        assert_true(
            chosen["option_id"] == "OPT_PROTOCOL_FIRST_PUBLISHED_TUPLE",
            f"Chosen tooling scorecard option drifted for {family_id}.",
        )
        chosen_score = int(chosen["total_score"])
        rejected_scores = [int(row["total_score"]) for row in family_rows if row["decision"] == "rejected"]
        assert_true(all(chosen_score > score for score in rejected_scores), f"Chosen score is not dominant for {family_id}.")
        assert_true(bool(chosen["chosen_components"]), f"Chosen components missing for {family_id}.")
        assert_true(bool(chosen["decision_summary"]), f"Decision summary missing for {family_id}.")
    return rows


def validate_observability_signal_matrix() -> list[dict[str, str]]:
    rows = load_csv(DATA_DIR / "observability_signal_matrix.csv")
    assert_true(len(rows) >= 14, "Observability signal matrix looks incomplete.")
    families = {row["signal_family"] for row in rows}
    for required in {"trace", "metric", "log", "ui_telemetry", "audit", "evidence"}:
        assert_true(required in families, f"Missing observability signal family: {required}")

    ceilings = {row["telemetry_ceiling"] for row in rows}
    assert_true("descriptor_and_hash_only" in ceilings, "Expected descriptor-and-hash telemetry ceiling.")
    assert_true("masked_scope_and_refs_only" in ceilings, "Expected masked-scope telemetry ceiling.")

    for row in rows:
        allowed = split_values(row["allowed_identifier_fields"])
        assert_true(allowed, f"Allowed identifier fields missing for {row['signal_id']}.")
        for field in allowed:
            assert_true(field in SAFE_TELEMETRY_FIELDS, f"Unsafe telemetry identifier proposed in {row['signal_id']}: {field}")
            lowered = field.lower()
            assert_true(
                all(fragment.lower() not in lowered for fragment in FORBIDDEN_FIELD_FRAGMENTS),
                f"Forbidden field fragment leaked into telemetry allow-list in {row['signal_id']}: {field}",
            )
        assert_true(bool(row["required_object_refs"]), f"Required object refs missing for {row['signal_id']}.")
        assert_true(bool(row["authoritative_lane"]), f"Authoritative lane missing for {row['signal_id']}.")
    return rows


def validate_security_control_matrix() -> list[dict[str, str]]:
    rows = load_csv(DATA_DIR / "security_control_matrix.csv")
    assert_true(len(rows) >= 13, "Security control matrix looks incomplete.")
    domains = {row["control_domain"] for row in rows}
    for domain in REQUIRED_CONTROL_DOMAINS:
        assert_true(domain in domains, f"Missing required security control domain: {domain}")
    for row in rows:
        assert_true(bool(row["authoritative_object_refs"]), f"Authoritative object refs missing for control {row['control_id']}.")
        assert_true(bool(row["evidence_refs"]), f"Evidence refs missing for control {row['control_id']}.")
    return rows


def validate_release_gate_matrix() -> list[dict[str, str]]:
    rows = load_csv(DATA_DIR / "release_gate_matrix.csv")
    gate_ids = {row["gate_id"] for row in rows}
    assert_true(gate_ids == REQUIRED_GATES, "Release gate matrix does not contain the exact six required gates.")
    for row in rows:
        assert_true(
            row["verification_scenario_binding"] == "exact_required",
            f"Gate {row['gate_id']} is not bound to one exact VerificationScenario.",
        )
        assert_true(
            row["contract_matrix_binding"] == "exact_required",
            f"Gate {row['gate_id']} is not bound to one exact ReleaseContractVerificationMatrix.",
        )
        assert_true(bool(row["must_publish_object_refs"]), f"Gate {row['gate_id']} is missing published objects.")
        assert_true(bool(row["blocking_condition"]), f"Gate {row['gate_id']} is missing blocking condition text.")
    live_gate = next(row for row in rows if row["gate_id"] == "GATE_5_LIVE_WAVE_PROOF")
    assert_true(live_gate["linked_watch_tuple_state"] == "exact_required", "Gate 5 watch tuple requirement drifted.")
    return rows


def validate_supply_chain_matrix() -> dict[str, Any]:
    payload = load_json(DATA_DIR / "supply_chain_and_provenance_matrix.json")
    assert_true(payload["hidden_ci_only_state_forbidden"] is True, "Hidden CI-only state must be forbidden.")
    assert_true(payload["stale_rehearsal_blocks_live_authority"] is True, "Stale rehearsal authority rule drifted.")
    stage_codes = {row["stage_code"] for row in payload["pipeline_stage_chain"]}
    required_stage_codes = {
        "dependency_resolve",
        "static_gate",
        "sbom_sign",
        "runtime_publish",
        "preview_validate",
        "integration_validate",
        "preprod_validate",
        "canary_promote",
        "wave_control",
        "history_append",
    }
    assert_true(stage_codes == required_stage_codes, "Supply-chain stage chain drifted.")
    bindings = payload["required_object_bindings"]
    binding_objects = {row["object_ref"] for row in bindings}
    assert_true(REQUIRED_OBJECTS.issubset(binding_objects), "Required object bindings are incomplete.")
    for row in bindings:
        assert_true(row["produced_by"], f"Produced-by list missing for {row['object_ref']}.")
        assert_true(row["consumed_by"], f"Consumed-by list missing for {row['object_ref']}.")
        assert_true(bool(row["state_rule"]), f"State rule missing for {row['object_ref']}.")
    return payload


def validate_essential_function_matrix() -> list[dict[str, str]]:
    rows = load_csv(DATA_DIR / "essential_function_slo_matrix.csv")
    assert_true(len(rows) >= 8, "Essential function matrix looks incomplete.")
    for row in rows:
        for key in [
            "slo_target",
            "alert_route_ref",
            "dashboard_pack_ref",
            "synthetic_journey_ref",
            "fallback_sufficiency_state",
            "required_recovery_control_refs",
            "required_restore_evidence_refs",
            "required_failover_evidence_refs",
            "required_chaos_evidence_refs",
        ]:
            assert_true(bool(row[key]), f"Missing {key} for essential function {row['essential_function_id']}.")
    return rows


def validate_incident_routing_matrix() -> list[dict[str, str]]:
    rows = load_csv(DATA_DIR / "incident_and_alert_routing_matrix.csv")
    routing_ids = {row["routing_id"] for row in rows}
    assert_true(REQUIRED_ALERTS.issubset(routing_ids), "Required alert routes are missing.")
    break_glass = next(row for row in rows if row["routing_id"] == "ALERT_BREAK_GLASS_OR_TENANT_SWITCH")
    assert_true(break_glass["immutable_audit_required"] == "yes", "Break-glass alert must require immutable audit.")
    assert_true(break_glass["reportability_assessment_required"] == "yes", "Break-glass alert must require reportability review.")
    incident = next(row for row in rows if row["routing_id"] == "ALERT_SECURITY_INCIDENT_OR_NEAR_MISS")
    assert_true(incident["near_miss_allowed"] == "yes", "Near miss must remain first-class in incident routing.")
    for row in rows:
        assert_true(bool(row["capa_workstream_ref"]), f"CAPA workstream missing for alert route {row['routing_id']}.")
        assert_true(bool(row["containment_playbook_ref"]), f"Containment playbook missing for alert route {row['routing_id']}.")
    return rows


def extract_cockpit_payload(html: str) -> dict[str, Any]:
    match = re.search(r'<script id="cockpit-data" type="application/json">([\s\S]*?)</script>', html)
    assert_true(match is not None, "Cockpit JSON payload script tag is missing.")
    return json.loads(match.group(1))


def validate_html_payload(
    html: str,
    payload: dict[str, Any],
    tooling_rows: list[dict[str, str]],
    signal_rows: list[dict[str, str]],
    security_rows: list[dict[str, str]],
    gate_rows: list[dict[str, str]],
    essential_rows: list[dict[str, str]],
    incident_rows: list[dict[str, str]],
) -> None:
    assert_true("Vecells Release Evidence Cockpit" in html, "Cockpit HTML title missing.")
    assert_true("__EMBEDDED_JSON__" not in html, "Cockpit HTML still contains JSON placeholder.")
    for marker in ATLAS_MARKERS:
        assert_true(marker in html, f"Cockpit HTML missing required marker: {marker}")
    for forbidden in ["https://", "http://", "cdn.", "fonts.googleapis", "unpkg.com"]:
        assert_true(forbidden not in html, f"Cockpit HTML contains forbidden remote reference: {forbidden}")

    summary = payload["summary"]
    assert_true(summary["tooling_option_count"] == len(tooling_rows), "Payload tooling option count drifted.")
    assert_true(summary["observability_signal_count"] == len(signal_rows), "Payload observability signal count drifted.")
    assert_true(summary["security_control_count"] == len(security_rows), "Payload security control count drifted.")
    assert_true(summary["release_gate_count"] == len(gate_rows), "Payload release gate count drifted.")
    assert_true(summary["essential_function_count"] == len(essential_rows), "Payload essential function count drifted.")
    assert_true(summary["alert_route_count"] == len(incident_rows), "Payload alert route count drifted.")
    assert_true(summary["active_watch_tuple_count"] == 2, "Payload active watch tuple count drifted.")
    assert_true(summary["unresolved_gap_count"] == 2, "Payload unresolved gap count drifted.")
    assert_true(summary["unresolved_risk_count"] == 3, "Payload unresolved risk count drifted.")

    assert_true(len(payload["tooling_families"]) == 8, "Cockpit payload tooling family count drifted.")
    assert_true(len(payload["watch_tuples"]) == 3, "Cockpit payload watch tuple count drifted.")
    assert_true(len(payload["readiness_snapshots"]) == 2, "Cockpit payload readiness snapshot count drifted.")
    assert_true(len(payload["gaps"]) == 2, "Cockpit payload gaps drifted.")
    assert_true(len(payload["risks"]) == 1, "Cockpit payload risks drifted.")


def main() -> None:
    prerequisites = ensure_prerequisites()
    ensure_deliverables()
    tooling_rows = validate_tooling_scorecard()
    signal_rows = validate_observability_signal_matrix()
    security_rows = validate_security_control_matrix()
    gate_rows = validate_release_gate_matrix()
    supply_chain_payload = validate_supply_chain_matrix()
    essential_rows = validate_essential_function_matrix()
    incident_rows = validate_incident_routing_matrix()

    html = (DOCS_DIR / "15_release_evidence_cockpit_atlas.html").read_text()
    cockpit_payload = extract_cockpit_payload(html)
    validate_html_payload(
        html,
        cockpit_payload,
        tooling_rows,
        signal_rows,
        security_rows,
        gate_rows,
        essential_rows,
        incident_rows,
    )

    print(
        json.dumps(
            {
                "status": "ok",
                "prerequisites": prerequisites,
                "summary": {
                    "tooling_option_count": len(tooling_rows),
                    "observability_signal_count": len(signal_rows),
                    "security_control_count": len(security_rows),
                    "release_gate_count": len(gate_rows),
                    "essential_function_count": len(essential_rows),
                    "incident_route_count": len(incident_rows),
                    "object_binding_count": len(supply_chain_payload["required_object_bindings"]),
                },
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
