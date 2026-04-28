#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"

TENANT_PATH = DATA_DIR / "tenant_isolation_modes.json"
SCHEMA_PATH = DATA_DIR / "acting_scope_tuple_schema.json"
ROUTE_SCOPE_PATH = DATA_DIR / "route_to_scope_requirements.csv"
DRIFT_PATH = DATA_DIR / "acting_context_drift_triggers.json"
BLAST_PATH = DATA_DIR / "surface_to_blast_radius_matrix.csv"
INPUT_ROUTE_MATRIX_PATH = DATA_DIR / "gateway_route_family_matrix.csv"

MANDATORY_DRIFT_CLASSES = {
    "organisation_switch",
    "tenant_scope_change",
    "environment_change",
    "policy_plane_change",
    "purpose_of_use_change",
    "elevation_expired",
    "break_glass_revoked",
    "visibility_contract_drift",
}

MANDATORY_TUPLE_AUDIENCES = {
    "origin_practice_clinical",
    "origin_practice_operations",
    "support",
    "hub_desk",
    "servicing_site",
    "operations_control",
    "governance_review",
}


def read_json(path: Path) -> Any:
    return json.loads(path.read_text())


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open() as handle:
        return list(csv.DictReader(handle))


def split_semicolon(value: str) -> list[str]:
    if not value:
        return []
    return [item.strip() for item in value.split(";") if item.strip()]


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def main() -> None:
    tenant_payload = read_json(TENANT_PATH)
    schema = read_json(SCHEMA_PATH)
    route_rows = read_csv(ROUTE_SCOPE_PATH)
    drift_payload = read_json(DRIFT_PATH)
    blast_rows = read_csv(BLAST_PATH)
    input_route_rows = read_csv(INPUT_ROUTE_MATRIX_PATH)

    require(tenant_payload["task_id"] == "seq_054", "seq_054 payload missing or wrong task id.")
    require(schema["title"] == "Vecells staff acting scope authority schema", "Unexpected schema title.")

    defs = schema.get("$defs", {})
    for required_def in ("staffIdentityContext", "actingContext", "actingScopeTuple", "actingContextDriftRecord"):
        require(required_def in defs, f"Schema is missing $defs.{required_def}.")

    input_pairs = {
        (row["route_family_id"], row["gateway_surface_id"], row["audience"])
        for row in input_route_rows
    }
    output_pairs = {
        (row["route_family_id"], row["gateway_surface_id"], row["audience"])
        for row in route_rows
    }
    require(input_pairs == output_pairs, "Route scope matrix no longer covers every gateway route-family row.")

    tuple_lookup = {
        row["actingScopeTupleId"]: row for row in tenant_payload["actingScopeTuples"]
    }
    governance_tokens = {
        row["governanceScopeTokenId"]: row for row in tenant_payload["governanceScopeTokenBindings"]
    }
    runtime_browser_bindings = {
        row["runtimeBrowserAuthorityBindingId"]: row
        for row in tenant_payload["runtimeBrowserAuthorityBindings"]
    }
    acting_contexts = {
        row["actingContextId"]: row for row in tenant_payload["actingContexts"]
    }
    staff_contexts = {
        row["staffIdentityContextId"]: row for row in tenant_payload["staffIdentityContexts"]
    }

    require(len(tuple_lookup) == tenant_payload["summary"]["acting_scope_tuple_count"], "Tuple summary count drifted.")
    require(len(route_rows) == tenant_payload["summary"]["route_scope_requirement_count"], "Route summary count drifted.")
    require(len(runtime_browser_bindings) == tenant_payload["summary"]["runtime_browser_binding_count"], "Runtime-browser binding count drifted.")

    for tuple_row in tuple_lookup.values():
        require(tuple_row["staffIdentityContextRef"] in staff_contexts, f"Tuple {tuple_row['actingScopeTupleId']} points at a missing staff identity context.")
        require(tuple_row["actingContextRef"] in acting_contexts, f"Tuple {tuple_row['actingScopeTupleId']} points at a missing acting context.")
        require(tuple_row["affectedTenantCount"] >= 0, f"Tuple {tuple_row['actingScopeTupleId']} has a negative tenant count.")
        require(tuple_row["affectedOrganisationCount"] >= 0, f"Tuple {tuple_row['actingScopeTupleId']} has a negative organisation count.")

    for row in route_rows:
        tuple_requirement = row["acting_scope_tuple_requirement"]
        tuple_ref = row["sample_acting_scope_tuple_ref"]
        profile_id = row["acting_scope_profile_id"]
        runtime_binding_refs = split_semicolon(row["required_runtime_binding_refs"])
        authority_binding_refs = split_semicolon(row["runtime_browser_authority_binding_refs"])
        trust_refs = split_semicolon(row["required_trust_refs"])

        require(runtime_binding_refs, f"Route {row['route_scope_requirement_id']} is missing required runtime binding refs.")
        require(authority_binding_refs, f"Route {row['route_scope_requirement_id']} is missing runtime-browser authority binding refs.")
        for authority_binding_ref in authority_binding_refs:
            require(authority_binding_ref in runtime_browser_bindings, f"Route {row['route_scope_requirement_id']} references unknown runtime-browser authority binding {authority_binding_ref}.")

        if row["audience"] in MANDATORY_TUPLE_AUDIENCES and row["route_group"] != "assistive":
            require(tuple_requirement == "required", f"Route {row['route_scope_requirement_id']} must require one current ActingScopeTuple.")

        if tuple_requirement == "required":
            require(tuple_ref in tuple_lookup, f"Route {row['route_scope_requirement_id']} references missing tuple {tuple_ref}.")
            tuple_row = tuple_lookup[tuple_ref]
            require(row["scope_tuple_hash"] == tuple_row["tupleHash"], f"Route {row['route_scope_requirement_id']} does not pin the same tuple hash as {tuple_ref}.")
            require(row["audience_visibility_coverage_ref"] in tuple_row["requiredVisibilityCoverageRefs"], f"Route {row['route_scope_requirement_id']} uses visibility coverage outside tuple {tuple_ref}.")
            for runtime_binding_ref in runtime_binding_refs:
                require(runtime_binding_ref in tuple_row["requiredRuntimeBindingRefs"], f"Route {row['route_scope_requirement_id']} uses runtime binding {runtime_binding_ref} outside tuple {tuple_ref}.")
            for trust_ref in trust_refs:
                require(trust_ref in tuple_row["requiredTrustRefs"], f"Route {row['route_scope_requirement_id']} uses trust ref {trust_ref} outside tuple {tuple_ref}.")
            acting_context = acting_contexts[tuple_row["actingContextRef"]]
            require(row["minimum_necessary_contract_ref"] == acting_context["minimumNecessaryContractRef"], f"Route {row['route_scope_requirement_id']} minimum-necessary contract drifted from acting context {acting_context['actingContextId']}.")
            require(int(row["affected_tenant_count"]) == tuple_row["affectedTenantCount"], f"Route {row['route_scope_requirement_id']} tenant count drifted from tuple {tuple_ref}.")
            require(int(row["affected_organisation_count"]) == tuple_row["affectedOrganisationCount"], f"Route {row['route_scope_requirement_id']} organisation count drifted from tuple {tuple_ref}.")
            require(row["route_intent_binding_required"] == "yes", f"Tuple-bound route {row['route_scope_requirement_id']} must require route-intent binding.")
            require(row["governing_object_version_required"] == "yes", f"Tuple-bound route {row['route_scope_requirement_id']} must require governing object version binding.")

        if row["governance_scope_token_requirement"] == "required":
            require("GST_054_GOVERNANCE_PLATFORM_V1" in trust_refs, f"Governance route {row['route_scope_requirement_id']} must include the governance scope token in its trust refs.")

        if row["blast_radius_class"] in {"cross_org", "multi_tenant", "platform"}:
            require(int(row["affected_tenant_count"]) > 0, f"Broad-scope route {row['route_scope_requirement_id']} lacks an explicit affected tenant count.")
            require(int(row["affected_organisation_count"]) > 1, f"Broad-scope route {row['route_scope_requirement_id']} lacks an explicit affected organisation count.")

    policy_classes = {
        row["detectedChangeClass"] for row in drift_payload["driftTriggerPolicies"]
    }
    record_classes = {
        row["detectedChangeClass"] for row in drift_payload["sampleDriftRecords"]
    }
    require(policy_classes == MANDATORY_DRIFT_CLASSES, "Drift trigger policy set is incomplete.")
    require(record_classes == MANDATORY_DRIFT_CLASSES, "Sample drift records do not cover every mandatory drift class.")

    for record in drift_payload["sampleDriftRecords"]:
        tuple_ref = record["priorActingScopeTupleRef"]
        require(tuple_ref in tuple_lookup, f"Drift record {record['actingContextDriftRecordId']} points at missing tuple {tuple_ref}.")
        require(record["priorActingContextRef"] == tuple_lookup[tuple_ref]["actingContextRef"], f"Drift record {record['actingContextDriftRecordId']} no longer points at the correct acting context.")
        require(record["freezeState"], f"Drift record {record['actingContextDriftRecordId']} is missing freeze state.")

    broad_surface_count = 0
    for row in blast_rows:
        if row["blast_radius_class"] in {"cross_org", "multi_tenant", "platform"}:
            broad_surface_count += 1
            require(int(row["affected_tenant_count"]) > 0, f"Broad-scope surface {row['surface_blast_radius_id']} lacks tenant count.")
            require(int(row["affected_organisation_count"]) > 1, f"Broad-scope surface {row['surface_blast_radius_id']} lacks organisation count.")
            require(row["pre_settlement_display_required"] == "yes", f"Broad-scope surface {row['surface_blast_radius_id']} must require pre-settlement blast-radius display.")
        else:
            require(row["pre_settlement_display_required"] in {"bounded_single_scope", "yes"}, f"Unexpected blast-radius display mode for {row['surface_blast_radius_id']}.")

    require(
        broad_surface_count >= 5,
        "Expected at least five broad-scope surfaces across hub, operations, and governance.",
    )

    require(
        tenant_payload["summary"]["broad_scope_route_count"]
        == sum(
            1
            for row in route_rows
            if row["blast_radius_class"] in {"cross_org", "multi_tenant", "platform"}
        ),
        "Broad-scope route summary drifted.",
    )

    require(governance_tokens["GST_054_GOVERNANCE_PLATFORM_V1"]["scopeTupleHash"] == tuple_lookup["AST_054_GOVERNANCE_PLATFORM_V1"]["tupleHash"], "Governance scope token no longer pins the governance tuple hash.")

    print("seq_054 tenant scope model validation passed")


if __name__ == "__main__":
    main()
