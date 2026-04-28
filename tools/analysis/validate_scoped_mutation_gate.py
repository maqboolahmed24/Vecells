#!/usr/bin/env python3
from __future__ import annotations

import csv
import hashlib
import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
PACKAGE_SCHEMA_DIR = ROOT / "packages" / "api-contracts" / "schemas"

DECISION_PATH = DATA_DIR / "scoped_mutation_gate_decision_table.csv"
ACTION_SCOPE_PATH = DATA_DIR / "action_scope_to_governing_object_matrix.csv"
SETTLEMENT_PATH = DATA_DIR / "command_settlement_result_matrix.csv"
RECOVERY_PATH = DATA_DIR / "mutation_recovery_and_freeze_matrix.csv"
ROUTE_INTENT_SCHEMA_PATH = DATA_DIR / "route_intent_binding_schema.json"
PACKAGE_ROUTE_SCHEMA_PATH = PACKAGE_SCHEMA_DIR / "route-intent-binding.schema.json"
PACKAGE_SETTLEMENT_SCHEMA_PATH = PACKAGE_SCHEMA_DIR / "command-settlement-record.schema.json"

ROUTE_FAMILY_PATH = DATA_DIR / "route_family_inventory.csv"
ROUTE_SCOPE_PATH = DATA_DIR / "route_to_scope_requirements.csv"
GATEWAY_MATRIX_PATH = DATA_DIR / "gateway_route_family_matrix.csv"
FRONTEND_MANIFEST_PATH = DATA_DIR / "frontend_contract_manifests.json"
TENANT_SCOPE_PATH = DATA_DIR / "tenant_isolation_modes.json"

REQUIRED_ACTION_SCOPES = {
    "claim",
    "respond_more_info",
    "reply_message",
    "respond_callback",
    "manage_booking",
    "accept_waitlist_offer",
    "accept_network_alternative",
    "pharmacy_choice",
    "pharmacy_consent",
    "support_repair_action",
    "ops_resilience_action",
}

EXPECTED_BINDING_STATES = {"live", "stale", "superseded", "recovery_only"}
RECOVERY_RESULT_CLASSES = {
    "stale_recoverable",
    "blocked_policy",
    "denied_scope",
    "expired",
    "review_required",
    "reconciliation_required",
}
ALLOWED_PACKAGE_SETTLEMENT_SCHEMA_TASK_IDS = {"seq_056", "par_072"}


def read_json(path: Path) -> Any:
    return json.loads(path.read_text())


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open() as handle:
        return list(csv.DictReader(handle))


def split_refs(value: str) -> list[str]:
    if not value:
        return []
    return [item.strip() for item in value.split(";") if item.strip()]


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def short_hash(payload: Any) -> str:
    return hashlib.sha256(
        json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
    ).hexdigest()[:16]


def tuple_hash_payload(row: dict[str, str]) -> dict[str, Any]:
    return {
        "audienceSurface": row["audienceSurface"],
        "shellType": row["shellType"],
        "routeFamily": row["routeFamily"],
        "actionScope": row["actionScope"],
        "governingObjectType": row["governingObjectType"],
        "governingObjectRef": row["governingObjectRef"],
        "canonicalObjectDescriptorRef": row["canonicalObjectDescriptorRef"],
        "governingBoundedContextRef": row["governingBoundedContextRef"],
        "governingObjectVersionRef": row["governingObjectVersionRef"],
        "lineageScope": row["lineageScope"],
        "requiredContextBoundaryRefs": split_refs(row["requiredContextBoundaryRefs"]),
        "parentAnchorRef": row["parentAnchorRef"],
        "subjectRef": row["subjectRef"],
        "grantFamily": row["grantFamily"],
        "sessionEpochRef": row["sessionEpochRef"],
        "subjectBindingVersionRef": row["subjectBindingVersionRef"],
        "actingScopeTupleRequirementRef": row["actingScopeTupleRequirementRef"],
        "audienceSurfaceRuntimeBindingRef": row["audienceSurfaceRuntimeBindingRef"],
        "releaseApprovalFreezeRef": row["releaseApprovalFreezeRef"],
        "channelReleaseFreezeState": row["channelReleaseFreezeState"],
        "routeContractDigestRef": row["routeContractDigestRef"],
    }


def main() -> None:
    decision_rows = read_csv(DECISION_PATH)
    action_scope_rows = read_csv(ACTION_SCOPE_PATH)
    settlement_rows = read_csv(SETTLEMENT_PATH)
    recovery_rows = read_csv(RECOVERY_PATH)
    route_intent_schema = read_json(ROUTE_INTENT_SCHEMA_PATH)
    package_route_schema = read_json(PACKAGE_ROUTE_SCHEMA_PATH)
    package_settlement_schema = read_json(PACKAGE_SETTLEMENT_SCHEMA_PATH)
    route_inventory = {row["route_family_id"]: row for row in read_csv(ROUTE_FAMILY_PATH)}
    route_scope = {row["route_family_id"]: row for row in read_csv(ROUTE_SCOPE_PATH)}
    gateway_matrix = {row["route_family_id"]: row for row in read_csv(GATEWAY_MATRIX_PATH)}
    frontend_payload = read_json(FRONTEND_MANIFEST_PATH)
    tenant_payload = read_json(TENANT_SCOPE_PATH)

    require(route_intent_schema["task_id"] == "seq_056", "Route intent schema task id drifted.")
    require(package_route_schema["task_id"] == "seq_056", "Package route intent schema task id drifted.")
    require(
        package_settlement_schema["task_id"] in ALLOWED_PACKAGE_SETTLEMENT_SCHEMA_TASK_IDS,
        "Package settlement schema task id drifted.",
    )
    require(len(decision_rows) == 16, f"Expected 16 decision rows, found {len(decision_rows)}.")
    require(len(action_scope_rows) == 14, f"Expected 14 action-scope rows, found {len(action_scope_rows)}.")
    require(len(settlement_rows) == 10, f"Expected 10 settlement rows, found {len(settlement_rows)}.")
    require(len(recovery_rows) == 8, f"Expected 8 recovery rows, found {len(recovery_rows)}.")

    mutation_contracts = {
        row["routeFamilyRef"]: row for row in frontend_payload["mutationCommandContracts"]
    }
    acting_scope_tuples = {
        row["actingScopeTupleId"] for row in tenant_payload["actingScopeTuples"]
    }

    route_intent_ids = {row["routeIntentId"] for row in decision_rows}
    require(len(route_intent_ids) == len(decision_rows), "routeIntentId values must stay unique.")

    route_intent_required = set(route_intent_schema["required"])
    for field in [
        "routeIntentId",
        "routeFamily",
        "actionScope",
        "canonicalObjectDescriptorRef",
        "governingObjectVersionRef",
        "parentAnchorRef",
        "routeIntentTupleHash",
    ]:
        require(field in route_intent_required, f"Route intent schema lost required field {field}.")

    action_scope_set = {row["actionScope"] for row in decision_rows}
    require(
        REQUIRED_ACTION_SCOPES.issubset(action_scope_set),
        "Decision table no longer covers the required canonical action scopes.",
    )

    binding_states = {row["bindingState"] for row in decision_rows}
    require(binding_states == EXPECTED_BINDING_STATES, "Decision table lost one or more binding states.")

    settlement_results = {row["result"] for row in settlement_rows}
    for row in decision_rows:
        require(row["routeFamily"] in route_inventory, f"Unknown route family {row['routeFamily']}.")
        require(
            row["routeFamily"] in mutation_contracts,
            f"Route family {row['routeFamily']} lost its seq_050 mutation contract binding.",
        )
        require(
            row["audienceSurfaceRuntimeBindingRef"]
            == mutation_contracts[row["routeFamily"]]["requiredAudienceSurfaceRuntimeBindingRef"],
            f"Route family {row['routeFamily']} drifted from the published runtime binding ref.",
        )
        require(
            row["publishedRouteIntentBindingRequirementRef"]
            == mutation_contracts[row["routeFamily"]]["requiredRouteIntentBindingRef"],
            f"Route family {row['routeFamily']} drifted from the published route-intent requirement ref.",
        )
        require(
            row["mustWriteCommandActionRecord"] == "yes"
            and row["mustWriteCommandSettlementRecord"] == "yes",
            f"{row['routeIntentId']} no longer writes both command ledgers.",
        )
        forbidden = split_refs(row["authorityReconstructionForbiddenFrom"])
        require(
            {"url_params", "cached_projection_fragment", "detached_cta_state"}.issubset(set(forbidden)),
            f"{row['routeIntentId']} lost a forbidden local-authority source.",
        )
        require(
            row["ambiguousTargetDisposition"] == "same_shell_disambiguation_or_reissue",
            f"{row['routeIntentId']} no longer fails closed on ambiguous target selection.",
        )
        require(
            row["routeIntentTupleHash"] == short_hash(tuple_hash_payload(row)),
            f"{row['routeIntentId']} tuple hash drifted from its authoritative members.",
        )
        require(
            row["governingObjectVersionRef"] and row["parentAnchorRef"] and row["canonicalObjectDescriptorRef"],
            f"{row['routeIntentId']} lost mandatory target tuple members.",
        )
        require(
            row["routeContractDigestRef"],
            f"{row['routeIntentId']} lost route contract digest parity.",
        )
        allowed_results = set(split_refs(row["allowedCommandSettlementResults"]))
        require(
            allowed_results.issubset(settlement_results),
            f"{row['routeIntentId']} references unknown settlement results.",
        )
        require(
            split_refs(row["requiredContextBoundaryRefs"]),
            f"{row['routeIntentId']} must carry required context boundary refs.",
        )
        gateway_boundaries = set(
            split_refs(gateway_matrix[row["routeFamily"]]["required_context_boundary_refs"])
        )
        require(
            gateway_boundaries.issubset(set(split_refs(row["requiredContextBoundaryRefs"]))),
            f"{row['routeIntentId']} no longer carries the route family's published context-boundary refs.",
        )
        route_trust_refs = set(split_refs(route_scope[row["routeFamily"]].get("required_trust_refs", "")))
        if route_trust_refs:
            require(
                route_trust_refs.issubset(set(split_refs(row["requiredAssuranceSliceTrustRefs"]))),
                f"{row['routeIntentId']} drifted from published trust requirements.",
            )
        required_tuple = row["requiredActingScopeTuple"]
        if required_tuple.startswith("AST_054_"):
            require(
                required_tuple in acting_scope_tuples,
                f"{row['routeIntentId']} references unknown acting scope tuple {required_tuple}.",
            )
        if row["bindingState"] == "recovery_only":
            require(
                row["partialTupleDisposition"] in {"recovery_only", "reissue_only"},
                f"{row['routeIntentId']} recovery-only row must carry a recovery-only partial tuple disposition.",
            )

    settlement_by_result = {row["result"]: row for row in settlement_rows}
    require(
        settlement_by_result["applied"]["authoritativeOutcomeState"] in {"projection_pending", "settled"},
        "Applied settlement rows must model projection-pending vs settled outcome separation.",
    )
    for row in settlement_rows:
        calm = row["sameShellCalmReturnEligible"] == "yes"
        require(
            (not calm) or row["authoritativeOutcomeState"] == "settled",
            f"Settlement row {row['settlementResultId']} allows calm return without authoritative settlement.",
        )
        if row["coarseResultClass"] in {"blocked", "recoverable_review", "recoverable_reconciliation", "recoverable_stale"}:
            require(
                row["sameShellRecoveryAllowed"] == "yes",
                f"Settlement row {row['settlementResultId']} lost same-shell recovery parity.",
            )

    recovery_classes = {row["resultClass"] for row in recovery_rows}
    require(
        RECOVERY_RESULT_CLASSES.issubset(recovery_classes),
        "Recovery matrix lost one or more mandatory governed recovery result classes.",
    )

    action_scope_lookup = {row["actionScope"]: row for row in action_scope_rows}
    require(
        REQUIRED_ACTION_SCOPES.issubset(set(action_scope_lookup.keys())),
        "Action-scope matrix lost one or more required action scopes.",
    )
    for row in decision_rows:
        require(
            row["actionScope"] in action_scope_lookup,
            f"{row['routeIntentId']} no longer resolves into the action-scope matrix.",
        )

    print("seq_056 scoped mutation gate validation passed")


if __name__ == "__main__":
    main()
