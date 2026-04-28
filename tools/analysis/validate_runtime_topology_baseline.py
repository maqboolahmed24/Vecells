#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path

from build_runtime_topology_baseline import (
    ACTING_SCOPE_CSV_PATH,
    ATLAS_HTML_PATH,
    ATLAS_MARKERS,
    AUDIENCE_SURFACE_PATH,
    BOUNDARY_CSV_PATH,
    DECISION_LOG_DOC_PATH,
    ENVIRONMENT_RINGS,
    GATEWAY_CSV_PATH,
    GATEWAY_DOC_PATH,
    MERMAID_PATH,
    REGION_DOC_PATH,
    RESILIENCE_DOC_PATH,
    RESILIENCE_JSON_PATH,
    ROUTE_FAMILY_PATH,
    SOURCE_PRECEDENCE,
    TENANT_CSV_PATH,
    TENANT_DOC_PATH,
    TENANT_SCOPE_MODES,
    TRUST_ZONE_DOC_PATH,
    WORKLOAD_JSON_PATH,
    ALLOWED_FAMILY_CODES,
    build_bundle,
    ensure_prerequisites,
    load_csv,
    load_json,
    region_roles_by_ring,
)


DELIVERABLES = [
    WORKLOAD_JSON_PATH,
    BOUNDARY_CSV_PATH,
    GATEWAY_CSV_PATH,
    TENANT_CSV_PATH,
    ACTING_SCOPE_CSV_PATH,
    RESILIENCE_JSON_PATH,
    REGION_DOC_PATH,
    TENANT_DOC_PATH,
    TRUST_ZONE_DOC_PATH,
    GATEWAY_DOC_PATH,
    RESILIENCE_DOC_PATH,
    DECISION_LOG_DOC_PATH,
    ATLAS_HTML_PATH,
    MERMAID_PATH,
]


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def canonicalize(value):
    return json.loads(json.dumps(value))


def split_semicolon(value: str) -> list[str]:
    return [item.strip() for item in value.split(";") if item.strip()]


def load_text(path: Path) -> str:
    assert_true(path.exists(), f"Missing text artifact: {path}")
    return path.read_text()


def validate_deliverables() -> None:
    for path in DELIVERABLES:
        assert_true(path.exists(), f"Missing seq_011 deliverable: {path}")


def validate_payload(payload: dict[str, object], expected_payload: dict[str, object], audience_rows: list[dict[str, str]]) -> None:
    assert_true(payload["topology_id"] == "vecells_runtime_topology_baseline_v1", "Unexpected topology_id.")
    assert_true(payload["source_precedence"] == SOURCE_PRECEDENCE, "Source precedence drifted.")
    assert_true(payload["upstream_inputs"] == ensure_prerequisites(), "Upstream prerequisite summary drifted.")
    assert_true(canonicalize(payload) == canonicalize(expected_payload), "Generated topology payload drifted from build output.")

    summary = payload["summary"]
    trust_zones = payload["trust_zones"]
    workload_rows = payload["runtime_workload_families"]
    boundary_rows = payload["trust_zone_boundaries"]
    gateway_rows = payload["gateway_surface_matrix"]
    tenant_rows = payload["tenant_isolation_matrix"]
    acting_rows = payload["acting_scope_tuple_matrix"]
    resilience = payload["region_resilience_matrix"]

    assert_true(summary["workload_family_count"] == len(workload_rows), "Workload summary mismatch.")
    assert_true(summary["trust_zone_count"] == len(trust_zones), "Trust-zone summary mismatch.")
    assert_true(summary["boundary_count"] == len(boundary_rows), "Boundary summary mismatch.")
    assert_true(summary["gateway_surface_count"] == len(gateway_rows), "Gateway summary mismatch.")
    assert_true(summary["tenant_isolation_pattern_count"] == len(tenant_rows), "Tenant summary mismatch.")
    assert_true(summary["acting_scope_profile_count"] == len(acting_rows), "Acting scope summary mismatch.")
    assert_true(summary["unresolved_gap_count"] == 0, "Unexpected unresolved gaps.")
    assert_true(payload["chosen_baseline"]["option_id"] == "OPT_HYBRID_SHARED_PLATFORM_TENANT_SLICES", "Chosen baseline drifted.")
    assert_true(len(payload["gaps"]) == 0, "Unexpected topology gaps.")

    trust_zone_ids = {zone["trust_zone_ref"] for zone in trust_zones}
    assert_true("tz_shell_delivery" in trust_zone_ids, "Shell delivery trust zone missing.")

    expected_workload_count = len(ALLOWED_FAMILY_CODES) * sum(len(roles) for roles in region_roles_by_ring().values())
    assert_true(len(workload_rows) == expected_workload_count, "Unexpected workload row count.")

    zone_by_family: dict[str, str] = {}
    for row in workload_rows:
        assert_true(row["family_code"] in ALLOWED_FAMILY_CODES, f"Invalid family code: {row['family_code']}")
        assert_true(row["environment_ring"] in ENVIRONMENT_RINGS, f"Invalid environment ring: {row['workload_family_id']}")
        assert_true(row["trust_zone_ref"] in trust_zone_ids, f"Unknown trust zone: {row['workload_family_id']}")
        assert_true(row["failure_domain_ref"], f"Missing failure domain: {row['workload_family_id']}")
        assert_true(row["source_refs"], f"Missing source refs: {row['workload_family_id']}")
        assert_true(row["uk_region_role"] in {"primary", "secondary", "nonprod_local"}, f"Invalid region role: {row['workload_family_id']}")
        if row["family_code"] in zone_by_family:
            assert_true(zone_by_family[row["family_code"]] == row["trust_zone_ref"], f"Family code maps to multiple trust zones: {row['family_code']}")
        else:
            zone_by_family[row["family_code"]] = row["trust_zone_ref"]
        if row["browser_reachable"] == "yes":
            assert_true(row["family_code"] in {"public_edge", "shell_delivery"}, f"Unexpected browser-reachable family: {row['family_code']}")
        if row["family_code"] == "data":
            assert_true(row["browser_reachable"] == "no", "Data family became browser reachable.")
        if row["family_code"] in {"integration", "data"}:
            assert_true(len(row["gateway_surface_refs"]) == 0, f"{row['family_code']} should not expose gateway refs.")

    audience_surface_ids = {row["surface_id"] for row in audience_rows}
    gateway_surface_ids = [row["audience_surface_id"] for row in gateway_rows]
    assert_true(set(gateway_surface_ids) == audience_surface_ids, "Audience surface coverage is incomplete.")
    assert_true(len(gateway_surface_ids) == len(set(gateway_surface_ids)), "Audience surfaces map to multiple gateways.")

    gateway_ids = {row["gateway_surface_id"] for row in gateway_rows}
    assert_true(len(gateway_rows) == len(gateway_ids), "Gateway ids are not unique.")

    acting_scope_ids = {row["acting_scope_profile_id"] for row in acting_rows}
    tenant_row_ids = {row["isolation_row_id"] for row in tenant_rows}
    assert_true({"ACT_GOVERNANCE_PLATFORM", "ACT_HUB_CROSS_ORG", "ACT_SUPPORT_REPLAY_RESTORE"}.issubset(acting_scope_ids), "Critical acting scope profiles missing.")

    tenant_scope_values = {row["tenant_scope_mode"] for row in gateway_rows}
    assert_true(tenant_scope_values.issubset(TENANT_SCOPE_MODES), "Unexpected tenant scope mode present.")

    boundary_ids = {row["boundary_id"] for row in boundary_rows}
    boundary_pairs = {(row["source_trust_zone_ref"], row["target_trust_zone_ref"]) for row in boundary_rows}
    assert_true(len(boundary_ids) == len(boundary_rows), "Boundary ids are not unique.")
    for row in boundary_rows:
        assert_true(row["source_trust_zone_ref"] in trust_zone_ids, f"Unknown boundary source zone: {row['boundary_id']}")
        assert_true(row["target_trust_zone_ref"] in trust_zone_ids, f"Unknown boundary target zone: {row['boundary_id']}")
        assert_true(row["allowed_protocols"], f"Boundary missing protocols: {row['boundary_id']}")
        assert_true(row["allowed_service_identity_refs"], f"Boundary missing service identities: {row['boundary_id']}")
        assert_true(row["allowed_data_classification_refs"], f"Boundary missing data classes: {row['boundary_id']}")
        assert_true(row["allowed_tenant_transfer_mode"], f"Boundary missing tenant transfer mode: {row['boundary_id']}")
        assert_true(row["assurance_trust_transfer_mode"], f"Boundary missing assurance transfer mode: {row['boundary_id']}")
        assert_true(row["boundary_failure_mode"], f"Boundary missing failure mode: {row['boundary_id']}")

    required_zone_pairs = {
        ("tz_public_edge", "tz_shell_delivery"),
        ("tz_public_edge", "tz_published_gateway"),
        ("tz_published_gateway", "tz_application_core"),
        ("tz_published_gateway", "tz_assurance_security"),
        ("tz_application_core", "tz_stateful_data"),
        ("tz_application_core", "tz_integration_perimeter"),
        ("tz_application_core", "tz_assurance_security"),
        ("tz_integration_perimeter", "tz_stateful_data"),
        ("tz_integration_perimeter", "tz_assurance_security"),
        ("tz_assurance_security", "tz_stateful_data"),
    }
    assert_true(required_zone_pairs.issubset(boundary_pairs), "Some required cross-zone boundaries are missing.")

    for row in gateway_rows:
        downstream = set(row["downstream_family_refs"])
        assert_true("data" not in downstream, f"Gateway directly reaches data: {row['gateway_surface_id']}")
        assert_true("integration" not in downstream, f"Gateway directly reaches integration: {row['gateway_surface_id']}")
        assert_true(row["browser_workload_family_code"] == "shell_delivery", f"Unexpected browser workload family: {row['gateway_surface_id']}")
        assert_true(row["tenant_scope_mode"], f"Gateway missing tenant scope mode: {row['gateway_surface_id']}")
        assert_true(row["tenant_isolation_mode"], f"Gateway missing tenant isolation mode: {row['gateway_surface_id']}")
        assert_true(row["trust_zone_boundary_refs"], f"Gateway missing trust boundaries: {row['gateway_surface_id']}")
        assert_true(row["recovery_disposition_refs"], f"Gateway missing recovery dispositions: {row['gateway_surface_id']}")
        assert_true(set(row["trust_zone_boundary_refs"]).issubset(boundary_ids), f"Gateway references unknown boundary: {row['gateway_surface_id']}")
        assert_true(set(row["acting_scope_profile_refs"]).issubset(acting_scope_ids), f"Gateway references unknown acting scope profile: {row['gateway_surface_id']}")
        if row["tenant_scope_mode"] in {
            "cross_org_hub_scope",
            "support_tenant_delegate",
            "support_investigation_scope",
            "multi_tenant_operational_watch",
            "platform_governance_scope",
        }:
            assert_true(row["blast_radius_mode"], f"Cross-tenant or platform gateway missing blast radius: {row['gateway_surface_id']}")
            assert_true(row["audit_posture"], f"Cross-tenant or platform gateway missing audit posture: {row['gateway_surface_id']}")
            assert_true(row["acting_scope_profile_refs"], f"Cross-tenant or platform gateway missing acting scope profile: {row['gateway_surface_id']}")

    covered_surfaces = set()
    for row in tenant_rows:
        assert_true(row["scope_mode"] in TENANT_SCOPE_MODES, f"Unexpected tenant scope matrix mode: {row['isolation_row_id']}")
        assert_true(row["surface_refs"], f"Tenant isolation row missing surfaces: {row['isolation_row_id']}")
        assert_true(set(row["surface_refs"]).issubset(audience_surface_ids), f"Tenant isolation row references unknown surface: {row['isolation_row_id']}")
        assert_true(set(row["required_acting_scope_profile_refs"]).issubset(acting_scope_ids), f"Tenant isolation row references unknown acting scope: {row['isolation_row_id']}")
        covered_surfaces.update(row["surface_refs"])
    assert_true(covered_surfaces == audience_surface_ids, "Tenant isolation matrix does not cover all surfaces.")
    assert_true("TIM_GOVERNANCE_PLATFORM" in tenant_row_ids, "Governance tenant isolation row missing.")

    for row in acting_rows:
        assert_true(row["tuple_required"] in {"no", "yes", "inherits"}, f"Unexpected tuple_required value: {row['acting_scope_profile_id']}")
        assert_true(row["tenant_scope_mode"] in TENANT_SCOPE_MODES, f"Unexpected acting scope tenant mode: {row['acting_scope_profile_id']}")
        assert_true(row["runtime_binding_requirement"], f"Acting scope row missing runtime binding requirement: {row['acting_scope_profile_id']}")
        assert_true(row["drift_triggers"], f"Acting scope row missing drift triggers: {row['acting_scope_profile_id']}")
        assert_true(row["on_drift_posture"], f"Acting scope row missing drift posture: {row['acting_scope_profile_id']}")
        assert_true(row["audit_posture"], f"Acting scope row missing audit posture: {row['acting_scope_profile_id']}")

    managed_regions = {row["region_ref"]: row["residency"] for row in resilience["regions"]}
    assert_true(managed_regions["uk_primary_region"] == "United Kingdom", "Primary region is not UK-hosted.")
    assert_true(managed_regions["uk_secondary_region"] == "United Kingdom", "Secondary region is not UK-hosted.")

    bindings = {row["environment_ring"]: row for row in resilience["environment_region_bindings"]}
    assert_true(set(bindings.keys()) == set(ENVIRONMENT_RINGS), "Environment region binding coverage is incomplete.")
    for ring in {"preprod", "production"}:
        assert_true("uk_secondary_region" in bindings[ring]["allowed_regions"], f"{ring} does not allow secondary UK region.")
    for row in resilience["store_classes"]:
        assert_true(row["residency_rule"] == "uk_only" or row["store_class_id"] == "STORE_CACHE", f"Store class violates UK residency rule: {row['store_class_id']}")
        assert_true("writable" not in row["failover_user_posture"].lower(), f"Failover posture widens writable state: {row['store_class_id']}")
    for row in resilience["degraded_user_postures"]:
        assert_true("live" not in row["posture"].lower(), f"Degraded posture leaves live authority implied: {row['surface_class']}")


def validate_csv_outputs(payload: dict[str, object]) -> None:
    boundary_csv = load_csv(BOUNDARY_CSV_PATH)
    gateway_csv = load_csv(GATEWAY_CSV_PATH)
    tenant_csv = load_csv(TENANT_CSV_PATH)
    acting_csv = load_csv(ACTING_SCOPE_CSV_PATH)

    assert_true(len(boundary_csv) == len(payload["trust_zone_boundaries"]), "Boundary CSV row count mismatch.")
    assert_true(len(gateway_csv) == len(payload["gateway_surface_matrix"]), "Gateway CSV row count mismatch.")
    assert_true(len(tenant_csv) == len(payload["tenant_isolation_matrix"]), "Tenant CSV row count mismatch.")
    assert_true(len(acting_csv) == len(payload["acting_scope_tuple_matrix"]), "Acting-scope CSV row count mismatch.")

    for row in gateway_csv:
        assert_true(row["audience_surface_id"], "Gateway CSV missing audience surface id.")
        assert_true("data" not in split_semicolon(row["downstream_family_refs"]), f"Gateway CSV leaks data reachability: {row['gateway_surface_id']}")
        assert_true("integration" not in split_semicolon(row["downstream_family_refs"]), f"Gateway CSV leaks integration reachability: {row['gateway_surface_id']}")


def validate_docs_and_visuals(payload: dict[str, object]) -> None:
    for path in [REGION_DOC_PATH, TENANT_DOC_PATH, TRUST_ZONE_DOC_PATH, GATEWAY_DOC_PATH, RESILIENCE_DOC_PATH, DECISION_LOG_DOC_PATH]:
        text = load_text(path)
        assert_true(text.startswith("# "), f"Documentation file missing heading: {path}")
        assert_true("Vecells" in text or "gateway" in text.lower() or "tenant" in text.lower(), f"Documentation file looks empty: {path}")

    mermaid_text = load_text(MERMAID_PATH)
    assert_true("flowchart" in mermaid_text, "Mermaid topology file missing flowchart.")
    assert_true("uk_primary_region" in mermaid_text, "Mermaid topology file missing primary region.")
    assert_true("uk_secondary_region" in mermaid_text, "Mermaid topology file missing secondary region.")

    html_text = load_text(ATLAS_HTML_PATH)
    for marker in ATLAS_MARKERS:
        assert_true(marker in html_text, f"Missing atlas marker: {marker}")
    assert_true("__EMBEDDED_JSON__" not in html_text, "Atlas still contains unresolved JSON placeholder.")
    assert_true("Vecells Runtime Topology Atlas" in html_text, "Atlas title missing.")
    assert_true(payload["topology_id"] in html_text, "Atlas does not embed the payload.")
    assert_true('data-selected-region' in html_text, "Atlas missing selected-region DOM marker.")
    assert_true('data-selected-trust-zone' in html_text, "Atlas missing selected-trust-zone DOM marker.")
    assert_true('data-selected-workload-family' in html_text, "Atlas missing selected-workload DOM marker.")
    assert_true('data-selected-gateway-surface' in html_text, "Atlas missing selected-gateway DOM marker.")
    assert_true('data-selected-boundary-state' in html_text, "Atlas missing selected-boundary DOM marker.")


def main() -> None:
    validate_deliverables()
    payload = load_json(WORKLOAD_JSON_PATH)
    expected_payload = build_bundle()
    audience_rows = load_csv(AUDIENCE_SURFACE_PATH)
    route_rows = load_csv(ROUTE_FAMILY_PATH)
    assert_true(len(route_rows) >= 20, "Route family inventory drifted before validation.")

    validate_payload(payload, expected_payload, audience_rows)
    validate_csv_outputs(payload)
    validate_docs_and_visuals(payload)
    print(
        "Validated seq_011 runtime topology baseline with "
        f"{payload['summary']['workload_family_count']} workload rows, "
        f"{payload['summary']['boundary_count']} trust boundaries, and "
        f"{payload['summary']['gateway_surface_count']} gateway surfaces."
    )


if __name__ == "__main__":
    main()
