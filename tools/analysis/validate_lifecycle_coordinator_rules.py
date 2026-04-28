#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"

INPUTS_PATH = DATA_DIR / "lifecycle_coordinator_inputs.csv"
SCHEMA_PATH = DATA_DIR / "request_closure_record_schema.json"
TAXONOMY_PATH = DATA_DIR / "closure_blocker_taxonomy.json"
SIGNAL_PATH = DATA_DIR / "milestone_signal_matrix.csv"
REOPEN_PATH = DATA_DIR / "reopen_trigger_matrix.csv"
ROUTE_SCOPE_PATH = DATA_DIR / "route_to_scope_requirements.csv"
EVENT_CONTRACTS_PATH = DATA_DIR / "canonical_event_contracts.json"
TENANT_SCOPE_PATH = DATA_DIR / "tenant_isolation_modes.json"

MANDATORY_SCHEMA_FIELDS = {
    "closureRecordId",
    "episodeId",
    "requestId",
    "requestLineageRef",
    "evaluatedAt",
    "requiredLineageEpoch",
    "blockingLeaseRefs",
    "blockingPreemptionRefs",
    "blockingApprovalRefs",
    "blockingReconciliationRefs",
    "blockingConfirmationRefs",
    "blockingLineageCaseLinkRefs",
    "blockingDuplicateClusterRefs",
    "blockingFallbackCaseRefs",
    "blockingIdentityRepairRefs",
    "blockingGrantRefs",
    "blockingReachabilityRefs",
    "blockingDegradedPromiseRefs",
    "decision",
    "closedByMode",
    "deferReasonCodes",
}

MANDATORY_BLOCKER_KEYS = {
    "lease_conflict": "blockingLeaseRefs[]",
    "safety_preemption": "blockingPreemptionRefs[]",
    "approval_checkpoint": "blockingApprovalRefs[]",
    "outcome_reconciliation": "blockingReconciliationRefs[]",
    "confirmation_gate": "blockingConfirmationRefs[]",
    "lineage_case_link_active": "blockingLineageCaseLinkRefs[]",
    "duplicate_review": "blockingDuplicateClusterRefs[]",
    "fallback_review": "blockingFallbackCaseRefs[]",
    "identity_repair": "blockingIdentityRepairRefs[]",
    "live_phi_grant": "blockingGrantRefs[]",
    "reachability_dependency": "blockingReachabilityRefs[]",
    "degraded_promise": "blockingDegradedPromiseRefs[]",
}

MANDATORY_EVENT_NAMES = {
    "confirmation.gate.created",
    "confirmation.gate.confirmed",
    "confirmation.gate.disputed",
    "request.closure_blockers.changed",
    "request.close.evaluated",
    "request.closed",
    "request.reopened",
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


def stable_hash(payload: Any) -> str:
    return __import__("hashlib").sha256(
        json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
    ).hexdigest()


def short_hash(payload: Any) -> str:
    return stable_hash(payload)[:16]


def main() -> None:
    inputs = read_csv(INPUTS_PATH)
    schema = read_json(SCHEMA_PATH)
    taxonomy = read_json(TAXONOMY_PATH)
    signals = read_csv(SIGNAL_PATH)
    reopen_rows = read_csv(REOPEN_PATH)
    route_rows = read_csv(ROUTE_SCOPE_PATH)
    event_payload = read_json(EVENT_CONTRACTS_PATH)
    tenant_payload = read_json(TENANT_SCOPE_PATH)

    require(taxonomy["task_id"] == "seq_055", "seq_055 taxonomy payload missing or stale.")
    require(schema["task_id"] == "seq_055", "seq_055 schema payload missing or stale.")

    require(
        len(inputs) == taxonomy["summary"]["coordinator_input_count"],
        "Coordinator input count drifted from taxonomy summary.",
    )
    require(
        len(signals) == taxonomy["summary"]["milestone_signal_count"],
        "Milestone signal count drifted from taxonomy summary.",
    )
    require(
        len(reopen_rows) == taxonomy["summary"]["reopen_trigger_count"],
        "Reopen trigger count drifted from taxonomy summary.",
    )

    schema_required = set(schema["required"])
    require(
        MANDATORY_SCHEMA_FIELDS.issubset(schema_required),
        "Request closure schema is missing mandatory fields.",
    )
    require(
        schema["properties"]["decision"]["enum"] == ["close", "defer"],
        "Closure decision enum drifted.",
    )
    require(
        schema["properties"]["closedByMode"]["enum"][-1] == "not_closed",
        "closedByMode must retain not_closed for defer verdicts.",
    )

    blocker_lookup = {
        row["blockerClassKey"]: row for row in taxonomy["blockerClasses"]
    }
    require(
        set(blocker_lookup.keys()) == set(MANDATORY_BLOCKER_KEYS.keys()),
        "Blocker taxonomy keys drifted from the expected set.",
    )
    for key, expected_field in MANDATORY_BLOCKER_KEYS.items():
        row = blocker_lookup[key]
        require(
            row["requestClosureRecordField"] == expected_field,
            f"Blocker class {key} no longer maps to {expected_field}.",
        )
        require(
            row["workflowStateEncodingForbidden"] is True,
            f"Blocker class {key} may no longer be encoded as workflow state.",
        )

    event_lookup = {
        row["eventName"]: row["canonicalEventContractId"]
        for row in event_payload["contracts"]
    }
    require(
        MANDATORY_EVENT_NAMES.issubset(set(event_lookup.keys())),
        "Event catalogue lost a mandatory lifecycle event family.",
    )
    coordinator_events = {
        row["eventName"]: row["eventContractRef"]
        for row in taxonomy["coordinatorEventContracts"]
    }
    for name in MANDATORY_EVENT_NAMES - {"confirmation.gate.created", "confirmation.gate.confirmed", "confirmation.gate.disputed", "request.closure_blockers.changed"}:
        require(
            coordinator_events[name] == event_lookup[name],
            f"Coordinator event {name} drifted from the seq_048 registry.",
        )

    route_family_ids = {row["route_family_id"] for row in route_rows}
    tuple_ids = {row["actingScopeTupleId"] for row in tenant_payload["actingScopeTuples"]}

    for row in signals:
        require(
            row["may_write_request_workflow_directly"] == "no",
            f"Signal {row['milestone_signal_id']} may not write Request.workflowState directly.",
        )
        require(
            row["may_write_request_closed_directly"] == "no",
            f"Signal {row['milestone_signal_id']} may not close requests directly.",
        )
        require(
            row["coordinator_consumption_mode"],
            f"Signal {row['milestone_signal_id']} lost coordinator consumption mode.",
        )
        for route_family_ref in split_semicolon(row["route_family_refs"]):
            require(
                route_family_ref in route_family_ids,
                f"Signal {row['milestone_signal_id']} references unknown route family {route_family_ref}.",
            )
        for tuple_ref in split_semicolon(row["acting_scope_tuple_refs"]):
            require(
                tuple_ref in tuple_ids,
                f"Signal {row['milestone_signal_id']} references unknown acting scope tuple {tuple_ref}.",
            )
        require(
            row["coordinator_close_event_ref"] == event_lookup["request.close.evaluated"],
            f"Signal {row['milestone_signal_id']} lost request.close.evaluated parity.",
        )
        require(
            row["coordinator_closed_event_ref"] == event_lookup["request.closed"],
            f"Signal {row['milestone_signal_id']} lost request.closed parity.",
        )
        require(
            row["coordinator_reopened_event_ref"] == event_lookup["request.reopened"],
            f"Signal {row['milestone_signal_id']} lost request.reopened parity.",
        )

    input_ids = {row["lifecycle_input_id"] for row in inputs}
    require(
        len(input_ids) == len(inputs),
        "Lifecycle input identifiers must remain unique.",
    )
    for row in inputs:
        require(
            row["required_lineage_epoch"] == "yes",
            f"Lifecycle input {row['lifecycle_input_id']} lost lineage epoch enforcement.",
        )

    scenarios = taxonomy["verdictScenarios"]
    scenario_hashes = {row["scenarioInputHash"] for row in scenarios}
    require(
        len(scenarios) == len(scenario_hashes),
        "Verdict scenario input hashes must stay unique.",
    )
    decisions = {row["expectedDecision"] for row in scenarios}
    require(
        decisions == {"close", "defer"},
        "Verdict scenarios must include both close and defer outcomes.",
    )
    for row in scenarios:
        require(
            row["scenarioInputHash"] == short_hash(row["inputVector"]),
            f"Scenario {row['scenarioId']} hash drifted from its input vector.",
        )

    evaluation_check_ids = {row["checkId"] for row in taxonomy["evaluationChecks"]}
    require(
        "CHECK_055_09_MATERIALIZED_SETS_EMPTY" in evaluation_check_ids,
        "Lifecycle taxonomy lost the materialized blocker set emptiness check.",
    )
    require(
        "CHECK_055_12_TERMINAL_OUTCOME_PRESENT" in evaluation_check_ids,
        "Lifecycle taxonomy lost the terminal outcome presence check.",
    )

    print("seq_055 lifecycle coordinator rule validation passed")


if __name__ == "__main__":
    main()
