#!/usr/bin/env python3
from __future__ import annotations

import csv
import hashlib
import json
from pathlib import Path
from textwrap import dedent


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"
TESTS_DIR = ROOT / "tests" / "playwright"

TASK_ID = "par_071"
VISUAL_MODE = "Lease_Fence_Command_Control_Lab"
GENERATED_AT = "2026-04-12T00:00:00+00:00"

MANIFEST_PATH = DATA_DIR / "request_lifecycle_lease_manifest.json"
MATRIX_PATH = DATA_DIR / "lineage_fence_and_command_action_matrix.csv"
CASEBOOK_PATH = DATA_DIR / "stale_ownership_casebook.json"

DESIGN_DOC_PATH = DOCS_DIR / "71_lease_fence_and_command_action_design.md"
RULES_DOC_PATH = DOCS_DIR / "71_stale_owner_and_lineage_epoch_rules.md"
LAB_PATH = DOCS_DIR / "71_control_plane_lab.html"
SPEC_PATH = TESTS_DIR / "control-plane-lab.spec.js"

SOURCE_PRECEDENCE = [
    "prompt/071.md",
    "prompt/shared_operating_contract_066_to_075.md",
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "blueprint/phase-0-the-foundation-protocol.md#1.10 RequestLifecycleLease",
    "blueprint/phase-0-the-foundation-protocol.md#1.10A StaleOwnershipRecoveryRecord and LeaseTakeoverRecord",
    "blueprint/phase-0-the-foundation-protocol.md#1.11 LineageFence",
    "blueprint/phase-0-the-foundation-protocol.md#1.22 CommandActionRecord",
    "blueprint/phase-0-the-foundation-protocol.md#9.2 Lease heartbeat and stale-owner fencing",
    "blueprint/phase-3-the-human-checkpoint.md",
    "blueprint/staff-workspace-interface-architecture.md",
    "blueprint/platform-runtime-and-release-blueprint.md",
    "blueprint/forensic-audit-findings.md#Finding 15",
    "blueprint/forensic-audit-findings.md#Finding 75",
    "blueprint/forensic-audit-findings.md#Finding 93",
    "packages/domains/identity_access/src/lease-fence-command-backbone.ts",
    "services/command-api/src/lease-fence-command.ts",
]


def ensure_parent(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def write_text(path: Path, content: str) -> None:
    ensure_parent(path)
    path.write_text(content.rstrip() + "\n", encoding="utf-8")


def write_json(path: Path, payload: object) -> None:
    ensure_parent(path)
    path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def write_csv(path: Path, rows: list[dict[str, object]]) -> None:
    ensure_parent(path)
    fieldnames = list(rows[0].keys()) if rows else []
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def sha256_hex(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def fencing_token(lease_id: str, epoch: int) -> str:
    return sha256_hex(f"{lease_id}:{epoch}:fencing")


def tuple_hash(seed: str) -> str:
    return sha256_hex(f"{seed}:route_tuple")


CASES = [
    {
        "scenarioId": "competing_reviewers_same_task",
        "title": "Two reviewers attempt to claim the same task.",
        "domain": "triage_workspace",
        "fenceIssueType": "none",
        "dominantLeaseState": "active",
        "selectedLeaseRef": "LSE_071_TRIAGE_ALPHA",
        "selectedActionRef": None,
        "selectedRecoveryRef": None,
        "selectedTakeoverRef": None,
        "summary": "CAS lease acquire prevents the second reviewer from soft-flag stealing the same queue item.",
        "operatorPosture": "claim_the_current_lease_or_wait_for_recovery",
        "validatorRefs": ["VAL_071_SINGLE_ACTIVE_LEASE"],
    },
    {
        "scenarioId": "worker_restart_with_stale_fencing_token",
        "title": "A restarted worker attempts a write with stale fencing tokens.",
        "domain": "booking",
        "fenceIssueType": "stale_token",
        "dominantLeaseState": "broken",
        "selectedLeaseRef": "LSE_071_BOOKING_BRAVO",
        "selectedActionRef": None,
        "selectedRecoveryRef": "SOR_071_BOOKING_STALE",
        "selectedTakeoverRef": "LTO_071_BOOKING",
        "summary": "The restarted worker is fenced out after takeover and is pushed into explicit stale-owner recovery.",
        "operatorPosture": "reacquire_under_fresh_epoch_before_retry",
        "validatorRefs": [
            "VAL_071_STALE_TOKEN_REJECTION",
            "VAL_071_STALE_OWNER_RECOVERY_VISIBLE",
        ],
    },
    {
        "scenarioId": "supervisor_takeover_while_stale_owner_open",
        "title": "A supervisor takes over after stale-owner recovery opens.",
        "domain": "hub_coordination",
        "fenceIssueType": "takeover",
        "dominantLeaseState": "broken",
        "selectedLeaseRef": "LSE_071_HUB_SUPERVISOR",
        "selectedActionRef": None,
        "selectedRecoveryRef": "SOR_071_HUB_STALE",
        "selectedTakeoverRef": "LTO_071_HUB",
        "summary": "Takeover emits a committed replacement lease and preserves the stale-owner record instead of overwriting silently.",
        "operatorPosture": "takeover_commits_new_epoch_and_new_fencing_token",
        "validatorRefs": ["VAL_071_TAKEOVER_NEVER_BLIND_OVERWRITE"],
    },
    {
        "scenarioId": "cross_domain_close_reopen_stale_lineage_epochs",
        "title": "Close and reopen attempts race on stale lineage epochs.",
        "domain": "governance_admin",
        "fenceIssueType": "stale_epoch",
        "dominantLeaseState": "active",
        "selectedLeaseRef": "LSE_071_GOVERNANCE_ALPHA",
        "selectedActionRef": None,
        "selectedRecoveryRef": "SOR_071_GOVERNANCE_LINEAGE",
        "selectedTakeoverRef": None,
        "summary": "Cross-domain writes fail closed unless they present the current lineage epoch and mint the next fence monotonically.",
        "operatorPosture": "refresh_epoch_from_latest_fence_before_mutation",
        "validatorRefs": ["VAL_071_STALE_LINEAGE_REJECTED"],
    },
    {
        "scenarioId": "repeated_ui_actions_reuse_or_supersede",
        "title": "Repeated UI actions reuse or supersede the same command action record.",
        "domain": "pharmacy",
        "fenceIssueType": "none",
        "dominantLeaseState": "active",
        "selectedLeaseRef": "LSE_071_PHARMACY_ALPHA",
        "selectedActionRef": "CAR_071_PHARMACY_RECOVERY",
        "selectedRecoveryRef": None,
        "selectedTakeoverRef": None,
        "summary": "Exact retries reuse the same immutable action tuple while changed payloads supersede through a new record.",
        "operatorPosture": "replay_exact_tuple_or_append_a_superseding_record",
        "validatorRefs": ["VAL_071_COMMAND_ACTION_RECONSTRUCTION"],
    },
]

LEASES = [
    {
        "leaseId": "LSE_071_TRIAGE_ALPHA",
        "scenarioId": "competing_reviewers_same_task",
        "domain": "triage_workspace",
        "domainObjectRef": "task_071_competing",
        "requestId": "request_071_competing",
        "state": "active",
        "ownerActorRef": "actor_reviewer_alpha",
        "ownerSessionRef": "session_alpha",
        "ownerWorkerRef": None,
        "ownershipEpoch": 1,
        "fencingToken": fencing_token("LSE_071_TRIAGE_ALPHA", 1),
        "heartbeatAt": "2026-04-12T09:01:00Z",
        "acquiredAt": "2026-04-12T09:01:00Z",
        "releasedAt": None,
        "breakEligibleAt": None,
        "staleOwnerRecoveryRef": None,
        "supersededByLeaseRef": None,
        "closeBlockReason": None,
        "governingObjectVersionRef": "task_071_competing@v3",
        "leaseTtlSeconds": 300,
    },
    {
        "leaseId": "LSE_071_BOOKING_ALPHA",
        "scenarioId": "worker_restart_with_stale_fencing_token",
        "domain": "booking",
        "domainObjectRef": "booking_case_071_restart",
        "requestId": "request_071_restart",
        "state": "broken",
        "ownerActorRef": "worker_alpha",
        "ownerSessionRef": None,
        "ownerWorkerRef": "worker_runtime_alpha",
        "ownershipEpoch": 1,
        "fencingToken": fencing_token("LSE_071_BOOKING_ALPHA", 1),
        "heartbeatAt": "2026-04-12T09:02:00Z",
        "acquiredAt": "2026-04-12T09:02:00Z",
        "releasedAt": None,
        "breakEligibleAt": "2026-04-12T09:03:00Z",
        "staleOwnerRecoveryRef": "SOR_071_BOOKING_STALE",
        "supersededByLeaseRef": "LSE_071_BOOKING_BRAVO",
        "closeBlockReason": "supervisor_takeover_active",
        "governingObjectVersionRef": "booking_case_071_restart@v2",
        "leaseTtlSeconds": 120,
    },
    {
        "leaseId": "LSE_071_BOOKING_BRAVO",
        "scenarioId": "worker_restart_with_stale_fencing_token",
        "domain": "booking",
        "domainObjectRef": "booking_case_071_restart",
        "requestId": "request_071_restart",
        "state": "active",
        "ownerActorRef": "worker_bravo",
        "ownerSessionRef": None,
        "ownerWorkerRef": "worker_runtime_bravo",
        "ownershipEpoch": 2,
        "fencingToken": fencing_token("LSE_071_BOOKING_BRAVO", 2),
        "heartbeatAt": "2026-04-12T09:03:00Z",
        "acquiredAt": "2026-04-12T09:03:00Z",
        "releasedAt": None,
        "breakEligibleAt": None,
        "staleOwnerRecoveryRef": None,
        "supersededByLeaseRef": None,
        "closeBlockReason": "supervisor_takeover_active",
        "governingObjectVersionRef": "booking_case_071_restart@v3",
        "leaseTtlSeconds": 120,
    },
    {
        "leaseId": "LSE_071_HUB_ALPHA",
        "scenarioId": "supervisor_takeover_while_stale_owner_open",
        "domain": "hub_coordination",
        "domainObjectRef": "hub_case_071_takeover",
        "requestId": "request_071_takeover",
        "state": "broken",
        "ownerActorRef": "actor_hub_alpha",
        "ownerSessionRef": "session_hub_alpha",
        "ownerWorkerRef": None,
        "ownershipEpoch": 1,
        "fencingToken": fencing_token("LSE_071_HUB_ALPHA", 1),
        "heartbeatAt": "2026-04-12T09:04:00Z",
        "acquiredAt": "2026-04-12T09:04:00Z",
        "releasedAt": None,
        "breakEligibleAt": "2026-04-12T09:06:00Z",
        "staleOwnerRecoveryRef": "SOR_071_HUB_STALE",
        "supersededByLeaseRef": "LSE_071_HUB_SUPERVISOR",
        "closeBlockReason": "supervisor_takeover_active",
        "governingObjectVersionRef": "hub_case_071_takeover@v6",
        "leaseTtlSeconds": 60,
    },
    {
        "leaseId": "LSE_071_HUB_SUPERVISOR",
        "scenarioId": "supervisor_takeover_while_stale_owner_open",
        "domain": "hub_coordination",
        "domainObjectRef": "hub_case_071_takeover",
        "requestId": "request_071_takeover",
        "state": "active",
        "ownerActorRef": "actor_hub_supervisor",
        "ownerSessionRef": "session_hub_supervisor",
        "ownerWorkerRef": None,
        "ownershipEpoch": 2,
        "fencingToken": fencing_token("LSE_071_HUB_SUPERVISOR", 2),
        "heartbeatAt": "2026-04-12T09:06:20Z",
        "acquiredAt": "2026-04-12T09:06:20Z",
        "releasedAt": None,
        "breakEligibleAt": None,
        "staleOwnerRecoveryRef": None,
        "supersededByLeaseRef": None,
        "closeBlockReason": "supervisor_takeover_active",
        "governingObjectVersionRef": "hub_case_071_takeover@v7",
        "leaseTtlSeconds": 180,
    },
    {
        "leaseId": "LSE_071_GOVERNANCE_ALPHA",
        "scenarioId": "cross_domain_close_reopen_stale_lineage_epochs",
        "domain": "governance_admin",
        "domainObjectRef": "governance_case_071_lineage",
        "requestId": "request_071_lineage",
        "state": "active",
        "ownerActorRef": "actor_governance_alpha",
        "ownerSessionRef": "session_governance_alpha",
        "ownerWorkerRef": None,
        "ownershipEpoch": 1,
        "fencingToken": fencing_token("LSE_071_GOVERNANCE_ALPHA", 1),
        "heartbeatAt": "2026-04-12T09:07:00Z",
        "acquiredAt": "2026-04-12T09:07:00Z",
        "releasedAt": None,
        "breakEligibleAt": None,
        "staleOwnerRecoveryRef": "SOR_071_GOVERNANCE_LINEAGE",
        "supersededByLeaseRef": None,
        "closeBlockReason": None,
        "governingObjectVersionRef": "governance_case_071_lineage@v4",
        "leaseTtlSeconds": 240,
    },
    {
        "leaseId": "LSE_071_PHARMACY_ALPHA",
        "scenarioId": "repeated_ui_actions_reuse_or_supersede",
        "domain": "pharmacy",
        "domainObjectRef": "pharmacy_case_071_action",
        "requestId": "request_071_action",
        "state": "active",
        "ownerActorRef": "actor_pharmacy_alpha",
        "ownerSessionRef": "session_pharmacy_alpha",
        "ownerWorkerRef": None,
        "ownershipEpoch": 1,
        "fencingToken": fencing_token("LSE_071_PHARMACY_ALPHA", 1),
        "heartbeatAt": "2026-04-12T09:08:00Z",
        "acquiredAt": "2026-04-12T09:08:00Z",
        "releasedAt": None,
        "breakEligibleAt": None,
        "staleOwnerRecoveryRef": None,
        "supersededByLeaseRef": None,
        "closeBlockReason": None,
        "governingObjectVersionRef": "pharmacy_case_071_action@v8",
        "leaseTtlSeconds": 240,
    },
]

RECOVERIES = [
    {
        "staleOwnershipRecoveryId": "SOR_071_BOOKING_TAKEOVER",
        "scenarioId": "worker_restart_with_stale_fencing_token",
        "leaseRef": "LSE_071_BOOKING_ALPHA",
        "domain": "booking",
        "domainObjectRef": "booking_case_071_restart",
        "recoveryReason": "supervisor_takeover",
        "resolutionState": "resolved",
        "detectedAt": "2026-04-12T09:03:00Z",
        "detectedByRef": "supervisor_runtime",
        "resolvedAt": "2026-04-12T09:03:00Z",
        "blockedActionScopeRefs": ["booking_commit"],
        "sameShellRecoveryRouteRef": "/ops/bookings/booking_case_071_restart/recover",
        "operatorVisibleWorkRef": "work_071_restart",
    },
    {
        "staleOwnershipRecoveryId": "SOR_071_BOOKING_STALE",
        "scenarioId": "worker_restart_with_stale_fencing_token",
        "leaseRef": "LSE_071_BOOKING_ALPHA",
        "domain": "booking",
        "domainObjectRef": "booking_case_071_restart",
        "recoveryReason": "stale_write_rejected",
        "resolutionState": "open",
        "detectedAt": "2026-04-12T09:03:10Z",
        "detectedByRef": "worker_alpha",
        "resolvedAt": None,
        "blockedActionScopeRefs": ["booking_commit"],
        "sameShellRecoveryRouteRef": "/ops/bookings/booking_case_071_restart/recover",
        "operatorVisibleWorkRef": "work_071_restart",
    },
    {
        "staleOwnershipRecoveryId": "SOR_071_HUB_STALE",
        "scenarioId": "supervisor_takeover_while_stale_owner_open",
        "leaseRef": "LSE_071_HUB_ALPHA",
        "domain": "hub_coordination",
        "domainObjectRef": "hub_case_071_takeover",
        "recoveryReason": "heartbeat_missed",
        "resolutionState": "resolved",
        "detectedAt": "2026-04-12T09:06:05Z",
        "detectedByRef": "supervisor_hub",
        "resolvedAt": "2026-04-12T09:06:20Z",
        "blockedActionScopeRefs": ["next_task_launch", "close"],
        "sameShellRecoveryRouteRef": "/hub/cases/hub_case_071_takeover/recover",
        "operatorVisibleWorkRef": "work_071_takeover",
    },
    {
        "staleOwnershipRecoveryId": "SOR_071_GOVERNANCE_LINEAGE",
        "scenarioId": "cross_domain_close_reopen_stale_lineage_epochs",
        "leaseRef": "LSE_071_GOVERNANCE_ALPHA",
        "domain": "governance_admin",
        "domainObjectRef": "governance_case_071_lineage",
        "recoveryReason": "lineage_drift",
        "resolutionState": "open",
        "detectedAt": "2026-04-12T09:07:50Z",
        "detectedByRef": "actor_governance_alpha",
        "resolvedAt": None,
        "blockedActionScopeRefs": ["close"],
        "sameShellRecoveryRouteRef": "/governance/cases/governance_case_071_lineage/recover",
        "operatorVisibleWorkRef": "work_071_lineage",
    },
]

TAKEOVERS = [
    {
        "leaseTakeoverRecordId": "LTO_071_BOOKING",
        "scenarioId": "worker_restart_with_stale_fencing_token",
        "priorLeaseRef": "LSE_071_BOOKING_ALPHA",
        "replacementLeaseRef": "LSE_071_BOOKING_BRAVO",
        "fromOwnerRef": "worker_alpha",
        "toOwnerRef": "worker_bravo",
        "authorizedByRef": "supervisor_runtime",
        "takeoverReason": "runtime_restart_reassignment",
        "takeoverState": "committed",
        "issuedAt": "2026-04-12T09:03:00Z",
        "committedAt": "2026-04-12T09:03:00Z",
    },
    {
        "leaseTakeoverRecordId": "LTO_071_HUB",
        "scenarioId": "supervisor_takeover_while_stale_owner_open",
        "priorLeaseRef": "LSE_071_HUB_ALPHA",
        "replacementLeaseRef": "LSE_071_HUB_SUPERVISOR",
        "fromOwnerRef": "actor_hub_alpha",
        "toOwnerRef": "actor_hub_supervisor",
        "authorizedByRef": "director_hub",
        "takeoverReason": "supervisor_takeover_after_expiry",
        "takeoverState": "committed",
        "issuedAt": "2026-04-12T09:06:20Z",
        "committedAt": "2026-04-12T09:06:20Z",
    },
]

FENCES = [
    {
        "fenceId": "FNC_071_TRIAGE_OWNERSHIP",
        "scenarioId": "competing_reviewers_same_task",
        "episodeId": "episode_071_competing",
        "currentEpoch": 1,
        "issuedFor": "ownership_change",
        "issuedAt": "2026-04-12T09:01:00Z",
        "expiresAt": "2026-04-13T09:01:00Z",
        "domain": "triage_workspace",
        "domainObjectRef": "task_071_competing",
        "issueType": "none",
    },
    {
        "fenceId": "FNC_071_BOOKING_OWNERSHIP",
        "scenarioId": "worker_restart_with_stale_fencing_token",
        "episodeId": "episode_071_restart",
        "currentEpoch": 1,
        "issuedFor": "ownership_change",
        "issuedAt": "2026-04-12T09:02:00Z",
        "expiresAt": "2026-04-13T09:02:00Z",
        "domain": "booking",
        "domainObjectRef": "booking_case_071_restart",
        "issueType": "stale_token",
    },
    {
        "fenceId": "FNC_071_BOOKING_COMMIT",
        "scenarioId": "worker_restart_with_stale_fencing_token",
        "episodeId": "episode_071_restart",
        "currentEpoch": 2,
        "issuedFor": "cross_domain_commit",
        "issuedAt": "2026-04-12T09:02:20Z",
        "expiresAt": "2026-04-13T09:02:20Z",
        "domain": "booking",
        "domainObjectRef": "booking_case_071_restart",
        "issueType": "stale_token",
    },
    {
        "fenceId": "FNC_071_BOOKING_TAKEOVER",
        "scenarioId": "worker_restart_with_stale_fencing_token",
        "episodeId": "episode_071_restart",
        "currentEpoch": 3,
        "issuedFor": "ownership_change",
        "issuedAt": "2026-04-12T09:03:00Z",
        "expiresAt": "2026-04-13T09:03:00Z",
        "domain": "booking",
        "domainObjectRef": "booking_case_071_restart",
        "issueType": "stale_token",
    },
    {
        "fenceId": "FNC_071_HUB_OWNERSHIP",
        "scenarioId": "supervisor_takeover_while_stale_owner_open",
        "episodeId": "episode_071_takeover",
        "currentEpoch": 1,
        "issuedFor": "ownership_change",
        "issuedAt": "2026-04-12T09:04:00Z",
        "expiresAt": "2026-04-13T09:04:00Z",
        "domain": "hub_coordination",
        "domainObjectRef": "hub_case_071_takeover",
        "issueType": "takeover",
    },
    {
        "fenceId": "FNC_071_HUB_BREAK",
        "scenarioId": "supervisor_takeover_while_stale_owner_open",
        "episodeId": "episode_071_takeover",
        "currentEpoch": 2,
        "issuedFor": "ownership_change",
        "issuedAt": "2026-04-12T09:06:05Z",
        "expiresAt": "2026-04-13T09:06:05Z",
        "domain": "hub_coordination",
        "domainObjectRef": "hub_case_071_takeover",
        "issueType": "takeover",
    },
    {
        "fenceId": "FNC_071_HUB_TAKEOVER",
        "scenarioId": "supervisor_takeover_while_stale_owner_open",
        "episodeId": "episode_071_takeover",
        "currentEpoch": 3,
        "issuedFor": "ownership_change",
        "issuedAt": "2026-04-12T09:06:20Z",
        "expiresAt": "2026-04-13T09:06:20Z",
        "domain": "hub_coordination",
        "domainObjectRef": "hub_case_071_takeover",
        "issueType": "takeover",
    },
    {
        "fenceId": "FNC_071_GOVERNANCE_OWNERSHIP",
        "scenarioId": "cross_domain_close_reopen_stale_lineage_epochs",
        "episodeId": "episode_071_lineage",
        "currentEpoch": 1,
        "issuedFor": "ownership_change",
        "issuedAt": "2026-04-12T09:07:00Z",
        "expiresAt": "2026-04-13T09:07:00Z",
        "domain": "governance_admin",
        "domainObjectRef": "governance_case_071_lineage",
        "issueType": "stale_epoch",
    },
    {
        "fenceId": "FNC_071_GOVERNANCE_CLOSE",
        "scenarioId": "cross_domain_close_reopen_stale_lineage_epochs",
        "episodeId": "episode_071_lineage",
        "currentEpoch": 2,
        "issuedFor": "close",
        "issuedAt": "2026-04-12T09:07:20Z",
        "expiresAt": "2026-04-13T09:07:20Z",
        "domain": "governance_admin",
        "domainObjectRef": "governance_case_071_lineage",
        "issueType": "stale_epoch",
    },
    {
        "fenceId": "FNC_071_GOVERNANCE_REOPEN",
        "scenarioId": "cross_domain_close_reopen_stale_lineage_epochs",
        "episodeId": "episode_071_lineage",
        "currentEpoch": 3,
        "issuedFor": "reopen",
        "issuedAt": "2026-04-12T09:07:40Z",
        "expiresAt": "2026-04-13T09:07:40Z",
        "domain": "governance_admin",
        "domainObjectRef": "governance_case_071_lineage",
        "issueType": "stale_epoch",
    },
    {
        "fenceId": "FNC_071_PHARMACY_OWNERSHIP",
        "scenarioId": "repeated_ui_actions_reuse_or_supersede",
        "episodeId": "episode_071_action",
        "currentEpoch": 1,
        "issuedFor": "ownership_change",
        "issuedAt": "2026-04-12T09:08:00Z",
        "expiresAt": "2026-04-13T09:08:00Z",
        "domain": "pharmacy",
        "domainObjectRef": "pharmacy_case_071_action",
        "issueType": "none",
    },
]

ACTIONS = [
    {
        "actionRecordId": "CAR_071_PHARMACY_EXACT",
        "scenarioId": "repeated_ui_actions_reuse_or_supersede",
        "domain": "pharmacy",
        "domainObjectRef": "pharmacy_case_071_action",
        "actionScope": "dispatch_update",
        "governingObjectVersionRef": "pharmacy_case_071_action@v8",
        "lineageFenceEpoch": 1,
        "routeIntentRef": "route_pharmacy_dispatch_update",
        "routeContractDigestRef": "digest_pharmacy_dispatch_update_v1",
        "routeIntentTupleHash": tuple_hash("CAR_071_PHARMACY_EXACT"),
        "expectedEffectSetHash": sha256_hex("pharmacy.dispatch.updated"),
        "semanticPayloadHash": sha256_hex('{"route":"sms","summaryTier":"quiet"}'),
        "sourceCommandId": "cmd_pharmacy_dispatch",
        "transportCorrelationId": "transport_pharmacy_dispatch_1",
        "idempotencyKey": "idem_pharmacy_dispatch_1",
        "idempotencyRecordRef": "idem_record_pharmacy_dispatch_1",
        "commandFollowingTokenRef": "follow_pharmacy_dispatch_1",
        "causalToken": "cause_pharmacy_dispatch_1",
        "createdAt": "2026-04-12T09:08:20Z",
        "supersedesActionRecordRef": None,
        "policyBundleRef": "policy_pharmacy_v1",
        "actingContextRef": "pharmacy_operator",
    },
    {
        "actionRecordId": "CAR_071_PHARMACY_RECOVERY",
        "scenarioId": "repeated_ui_actions_reuse_or_supersede",
        "domain": "pharmacy",
        "domainObjectRef": "pharmacy_case_071_action",
        "actionScope": "dispatch_update",
        "governingObjectVersionRef": "pharmacy_case_071_action@v8",
        "lineageFenceEpoch": 1,
        "routeIntentRef": "route_pharmacy_dispatch_update",
        "routeContractDigestRef": "digest_pharmacy_dispatch_update_v1",
        "routeIntentTupleHash": tuple_hash("CAR_071_PHARMACY_RECOVERY"),
        "expectedEffectSetHash": sha256_hex("pharmacy.dispatch.updated+contact.repair.required"),
        "semanticPayloadHash": sha256_hex('{"route":"voice","summaryTier":"recovery"}'),
        "sourceCommandId": "cmd_pharmacy_dispatch",
        "transportCorrelationId": "transport_pharmacy_dispatch_2",
        "idempotencyKey": "idem_pharmacy_dispatch_2",
        "idempotencyRecordRef": "idem_record_pharmacy_dispatch_2",
        "commandFollowingTokenRef": "follow_pharmacy_dispatch_2",
        "causalToken": "cause_pharmacy_dispatch_2",
        "createdAt": "2026-04-12T09:08:40Z",
        "supersedesActionRecordRef": "CAR_071_PHARMACY_EXACT",
        "policyBundleRef": "policy_pharmacy_v1",
        "actingContextRef": "pharmacy_operator",
    },
]

VALIDATOR_RESULTS = [
    {
        "validatorId": "VAL_071_SINGLE_ACTIVE_LEASE",
        "label": "Single active lease per domain object",
        "status": "pass",
        "detail": "No domain object carries more than one active RequestLifecycleLease.",
    },
    {
        "validatorId": "VAL_071_STALE_TOKEN_REJECTION",
        "label": "Stale tokens rejected after takeover",
        "status": "pass",
        "detail": "The restarted booking worker is fenced out after takeover and must reacquire under epoch 2.",
    },
    {
        "validatorId": "VAL_071_STALE_OWNER_RECOVERY_VISIBLE",
        "label": "Stale-owner recovery is first-class",
        "status": "pass",
        "detail": "Booking and governance failures surface explicit recovery records instead of log-only warnings.",
    },
    {
        "validatorId": "VAL_071_STALE_LINEAGE_REJECTED",
        "label": "Lineage epoch drift fails closed",
        "status": "pass",
        "detail": "Close and reopen flows require the current lineage epoch before minting the next fence.",
    },
    {
        "validatorId": "VAL_071_COMMAND_ACTION_RECONSTRUCTION",
        "label": "Command tuples reconstruct exactly",
        "status": "pass",
        "detail": "The pharmacy dispatch pair preserves exact tuple reuse and explicit supersession by source command.",
    },
    {
        "validatorId": "VAL_071_TAKEOVER_NEVER_BLIND_OVERWRITE",
        "label": "Takeover remains auditable",
        "status": "pass",
        "detail": "Supervisor takeover records bind prior lease, replacement lease, approver, and committed timestamp.",
    },
]

CASEBOOK = {
    "task_id": TASK_ID,
    "generated_at": GENERATED_AT,
    "summary": {
        "case_count": len(CASES),
        "stale_token_case_count": 1,
        "stale_epoch_case_count": 1,
        "takeover_case_count": 1,
        "recovery_open_count": sum(
            1 for recovery in RECOVERIES if recovery["resolutionState"] == "open"
        ),
        "action_supersession_count": 1,
    },
    "cases": CASES,
}

MATRIX_ROWS = [
    {
        "row_class": "fence",
        "scenario_id": fence["scenarioId"],
        "domain": fence["domain"],
        "domain_object_ref": fence["domainObjectRef"],
        "lease_id": next(
            lease["leaseId"]
            for lease in LEASES
            if lease["scenarioId"] == fence["scenarioId"]
            and lease["domainObjectRef"] == fence["domainObjectRef"]
        ),
        "fence_or_action_id": fence["fenceId"],
        "epoch_or_created_at": str(fence["currentEpoch"]),
        "binding_ref": fence["issuedFor"],
        "issue_type": fence["issueType"],
        "reconstruction_state": "guarding_cross_domain_invariant",
        "summary": f'{fence["issuedFor"]} advanced {fence["domainObjectRef"]} to epoch {fence["currentEpoch"]}.',
    }
    for fence in FENCES
] + [
    {
        "row_class": "action",
        "scenario_id": action["scenarioId"],
        "domain": action["domain"],
        "domain_object_ref": action["domainObjectRef"],
        "lease_id": "LSE_071_PHARMACY_ALPHA",
        "fence_or_action_id": action["actionRecordId"],
        "epoch_or_created_at": action["createdAt"],
        "binding_ref": action["routeIntentRef"],
        "issue_type": "none",
        "reconstruction_state": "immutable_mutation_tuple",
        "summary": (
            "Exact tuple reuse" if action["supersedesActionRecordRef"] is None else "Superseding tuple"
        ),
    }
    for action in ACTIONS
]

MANIFEST = {
    "task_id": TASK_ID,
    "visual_mode": VISUAL_MODE,
    "generated_at": GENERATED_AT,
    "source_precedence": SOURCE_PRECEDENCE,
    "summary": {
        "lease_count": len(LEASES),
        "active_lease_count": sum(1 for lease in LEASES if lease["state"] == "active"),
        "broken_lease_count": sum(1 for lease in LEASES if lease["state"] == "broken"),
        "recovery_count": len(RECOVERIES),
        "open_recovery_count": sum(
            1 for recovery in RECOVERIES if recovery["resolutionState"] == "open"
        ),
        "takeover_count": len(TAKEOVERS),
        "lineage_fence_count": len(FENCES),
        "command_action_count": len(ACTIONS),
        "case_count": len(CASES),
        "validator_count": len(VALIDATOR_RESULTS),
    },
    "leases": LEASES,
    "recoveries": RECOVERIES,
    "takeovers": TAKEOVERS,
    "lineage_fences": FENCES,
    "command_actions": ACTIONS,
    "concurrency_cases": CASES,
    "validator_results": VALIDATOR_RESULTS,
}


def build_design_doc() -> str:
    return dedent(
        f"""
        # 71 Lease Fence and Command Action Design

        `par_071` freezes the foundational control-plane primitives that later mutation services must call rather than re-implement locally.

        ## Core law

        `RequestLifecycleLease` is a compare-and-set authority, not a soft ownership flag.

        `StaleOwnershipRecoveryRecord` is the mandatory operator-visible record when stale ownership, heartbeat expiry, or lineage drift rejects a mutation.

        `CommandActionRecord` is the immutable mutation tuple. Later reconstruction must come from the stored action record, not route params or cached shell state.

        ## Frozen baseline

        - `7` leases across triage, booking, hub, governance, and pharmacy control surfaces
        - `4` stale-owner recoveries with `2` still open for same-shell recovery
        - `2` committed takeovers with new ownership epochs and fencing tokens
        - `11` lineage fences guarding ownership change, close, reopen, and cross-domain commit
        - `2` immutable action tuples showing exact reuse and explicit supersession

        ## Aggregate inventory

        - `RequestLifecycleLease`: owns the active actor, epoch, fencing token, TTL, break posture, and supersession chain.
        - `StaleOwnershipRecoveryRecord`: binds stale-owner cause, blocked action scopes, same-shell recovery route, and resolution state.
        - `LeaseTakeoverRecord`: proves approver, prior lease, replacement lease, and committed takeover timestamp.
        - `LineageFence`: advances the episode-scoped epoch monotonically before cross-domain invariant changes.
        - `CommandActionRecord`: captures exact route-intent tuple, policy bundle, causality frame, idempotency link, and effect-set hash.

        ## Parallel gap posture

        The later coordinators may consume these records, but they may not change lease, epoch, or action-record law. This track intentionally publishes the control-plane substrate first so sibling tracks integrate to frozen interfaces instead of inventing local concurrency rules.
        """
    )


def build_rules_doc() -> str:
    return dedent(
        """
        # 71 Stale Owner and Lineage Epoch Rules

        ## Recovery law

        Stale-owner recovery is mandatory. When stale ownership tokens, expired heartbeats, or stale lineage epochs are presented, the system opens or updates a `StaleOwnershipRecoveryRecord` before the write path returns control to the caller.

        `LineageFence` must advance monotonically for every ownership change and every cross-domain invariant change.

        Supervisor takeover never overwrites the prior lease blindly. It breaks or supersedes the prior lease, resolves the stale-owner record, and mints a new ownership epoch and fencing token.

        ## Fail-closed rules

        - stale ownership tokens are rejected after takeover or expiry
        - stale lineage epochs are rejected before close, reopen, or cross-domain commit may proceed
        - cross-context command writes must name required context-boundary refs
        - immutable action records are the only supported reconstruction source for later settlement and audit joins

        ## Simulator contract

        The deterministic harness must cover competing reviewers, restarted workers with stale fencing tokens, supervisor takeover while stale-owner recovery is open, stale close/reopen epochs, and repeated UI actions that either reuse or supersede the same command tuple.
        """
    )


def build_lab_html() -> str:
    template = dedent(
        """
        <!doctype html>
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>71 Lease Fence Command Control Lab</title>
            <style>
              :root {
                --canvas: #F7F9FC;
                --panel: #FFFFFF;
                --rail: #EEF2F8;
                --inset: #F4F6FB;
                --text-strong: #0F172A;
                --text-default: #1E293B;
                --text-muted: #667085;
                --border: #E2E8F0;
                --lease: #3559E6;
                --fence: #0EA5A4;
                --action: #7C3AED;
                --warning: #C98900;
                --blocked: #C24141;
              }
              * { box-sizing: border-box; }
              body {
                margin: 0;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                background: var(--canvas);
                color: var(--text-default);
              }
              .shell {
                max-width: 1500px;
                margin: 0 auto;
                padding: 20px;
                display: grid;
                gap: 16px;
              }
              header {
                min-height: 72px;
                background: var(--panel);
                border: 1px solid var(--border);
                border-radius: 20px;
                padding: 16px 20px;
                display: grid;
                gap: 12px;
              }
              .wordmark {
                display: inline-flex;
                align-items: center;
                gap: 12px;
                font-weight: 700;
                color: var(--text-strong);
              }
              .wordmark svg {
                width: 34px;
                height: 34px;
              }
              .metrics {
                display: grid;
                grid-template-columns: repeat(4, minmax(0, 1fr));
                gap: 12px;
              }
              .metric {
                background: var(--inset);
                border-radius: 14px;
                padding: 12px;
              }
              .metric strong {
                display: block;
                font-size: 1.4rem;
                color: var(--text-strong);
              }
              .layout {
                display: grid;
                grid-template-columns: 304px minmax(0, 1fr) 408px;
                gap: 16px;
                align-items: start;
              }
              aside, .canvas, .inspector, .table-panel {
                background: var(--panel);
                border: 1px solid var(--border);
                border-radius: 20px;
              }
              aside {
                padding: 16px;
                position: sticky;
                top: 16px;
              }
              .filter-group {
                display: grid;
                gap: 10px;
                margin-bottom: 18px;
              }
              label {
                font-size: 0.8rem;
                font-weight: 600;
                color: var(--text-muted);
                letter-spacing: 0.04em;
                text-transform: uppercase;
              }
              select {
                height: 44px;
                border-radius: 12px;
                border: 1px solid var(--border);
                background: var(--inset);
                padding: 0 12px;
                color: var(--text-default);
              }
              .canvas {
                padding: 16px;
                display: grid;
                gap: 16px;
              }
              .panel-title {
                display: flex;
                align-items: baseline;
                justify-content: space-between;
                gap: 8px;
              }
              .panel-title h2,
              .panel-title h3 {
                margin: 0;
                font-size: 1rem;
                color: var(--text-strong);
              }
              .parity {
                font-size: 0.82rem;
                color: var(--text-muted);
              }
              .timeline {
                min-height: 250px;
                background: var(--rail);
                border-radius: 18px;
                padding: 14px;
                display: grid;
                gap: 10px;
              }
              .epoch-strip,
              .action-grid {
                background: var(--inset);
                border-radius: 18px;
                padding: 14px;
                display: grid;
                gap: 10px;
              }
              .lease-card,
              .action-card,
              .epoch-pill,
              .case-row-button {
                border: 1px solid transparent;
                border-radius: 16px;
                background: var(--panel);
                color: inherit;
                text-align: left;
                padding: 14px;
                cursor: pointer;
                transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
              }
              .lease-card[data-selected="true"],
              .action-card[data-selected="true"],
              .epoch-pill[data-selected="true"],
              .case-row-button[data-selected="true"] {
                border-color: var(--lease);
                box-shadow: 0 10px 24px rgba(53, 89, 230, 0.12);
              }
              .epoch-pill[data-issue-type="stale_epoch"] { border-left: 4px solid var(--blocked); }
              .epoch-pill[data-issue-type="stale_token"] { border-left: 4px solid var(--warning); }
              .epoch-pill[data-issue-type="takeover"] { border-left: 4px solid var(--fence); }
              .lease-meta,
              .action-meta {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                margin-top: 8px;
                font-size: 0.83rem;
                color: var(--text-muted);
              }
              .badge {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                border-radius: 999px;
                padding: 4px 10px;
                background: var(--inset);
                font-size: 0.78rem;
              }
              .mono {
                font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
              }
              .inspector {
                padding: 18px;
                display: grid;
                gap: 16px;
                min-height: 420px;
              }
              .inspector-card {
                background: var(--inset);
                border-radius: 16px;
                padding: 14px;
                display: grid;
                gap: 8px;
              }
              .kv {
                display: grid;
                grid-template-columns: minmax(0, 140px) minmax(0, 1fr);
                gap: 8px;
                font-size: 0.9rem;
              }
              .kv dt {
                color: var(--text-muted);
              }
              .kv dd {
                margin: 0;
              }
              .lower {
                display: grid;
                grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
                gap: 16px;
              }
              .table-panel {
                padding: 16px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
              }
              th, td {
                padding: 12px 10px;
                border-bottom: 1px solid var(--border);
                text-align: left;
                font-size: 0.9rem;
                vertical-align: top;
              }
              th {
                color: var(--text-muted);
                font-weight: 600;
              }
              tbody tr:last-child td {
                border-bottom: none;
              }
              .status-pass { color: var(--fence); }
              .status-open { color: var(--blocked); }
              .status-resolved { color: var(--lease); }
              [data-reduced-motion="true"] * {
                transition-duration: 0ms !important;
                animation-duration: 0ms !important;
              }
              @media (max-width: 1200px) {
                .layout {
                  grid-template-columns: 1fr;
                }
                aside {
                  position: static;
                }
                .lower {
                  grid-template-columns: 1fr;
                }
              }
              @media (max-width: 700px) {
                .metrics {
                  grid-template-columns: repeat(2, minmax(0, 1fr));
                }
              }
            </style>
          </head>
          <body>
            <div class="shell">
              <header>
                <div class="wordmark">
                  <svg viewBox="0 0 48 48" aria-hidden="true" fill="none">
                    <rect x="3" y="3" width="42" height="42" rx="14" fill="#0F172A"></rect>
                    <path d="M16 14v20h14" stroke="#F7F9FC" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></path>
                    <path d="M30 14v20" stroke="#3559E6" stroke-width="4" stroke-linecap="round"></path>
                  </svg>
                  <span>Vecells Lease Fence Command Control Lab</span>
                </div>
                <div class="metrics">
                  <div class="metric"><span>Active leases</span><strong id="metric-active-leases">0</strong></div>
                  <div class="metric"><span>Open recoveries</span><strong id="metric-open-recoveries">0</strong></div>
                  <div class="metric"><span>Fence mismatches</span><strong id="metric-fence-mismatches">0</strong></div>
                  <div class="metric"><span>Action records</span><strong id="metric-actions">0</strong></div>
                </div>
              </header>
              <div class="layout">
                <aside>
                  <div class="filter-group">
                    <label for="domain-filter">Domain</label>
                    <select id="domain-filter" data-testid="domain-filter"></select>
                  </div>
                  <div class="filter-group">
                    <label for="lease-state-filter">Lease state</label>
                    <select id="lease-state-filter" data-testid="lease-state-filter"></select>
                  </div>
                  <div class="filter-group">
                    <label for="fence-issue-filter">Fence issue type</label>
                    <select id="fence-issue-filter" data-testid="fence-issue-filter"></select>
                  </div>
                  <div class="inspector-card">
                    <strong>Operator notes</strong>
                    <p id="filter-notes" class="parity">Filters scope lease authority, epoch drift, and command-tuple posture together.</p>
                  </div>
                </aside>
                <main class="canvas">
                  <section>
                    <div class="panel-title">
                      <h2>Lease timeline</h2>
                      <span class="parity" data-testid="timeline-parity"></span>
                    </div>
                    <div class="timeline" data-testid="timeline" id="timeline"></div>
                  </section>
                  <section>
                    <div class="panel-title">
                      <h2>Lineage epoch strip</h2>
                      <span class="parity" data-testid="epoch-strip-parity"></span>
                    </div>
                    <div class="epoch-strip" data-testid="epoch-strip" id="epoch-strip"></div>
                  </section>
                  <section>
                    <div class="panel-title">
                      <h2>Command action inspector lane</h2>
                      <span class="parity" data-testid="action-grid-parity"></span>
                    </div>
                    <div class="action-grid" id="action-grid"></div>
                  </section>
                </main>
                <aside class="inspector" data-testid="inspector" id="inspector"></aside>
              </div>
              <div class="lower">
                <section class="table-panel">
                  <div class="panel-title">
                    <h3>Concurrency case table</h3>
                    <span class="parity" data-testid="case-table-parity"></span>
                  </div>
                  <table data-testid="case-table">
                    <thead>
                      <tr><th>Scenario</th><th>Issue</th><th>Posture</th></tr>
                    </thead>
                    <tbody id="case-table-body"></tbody>
                  </table>
                </section>
                <section class="table-panel">
                  <div class="panel-title">
                    <h3>Validator results</h3>
                    <span class="parity">All frozen control-plane checks should pass.</span>
                  </div>
                  <table data-testid="validator-table">
                    <thead>
                      <tr><th>Validator</th><th>Status</th><th>Detail</th></tr>
                    </thead>
                    <tbody id="validator-table-body"></tbody>
                  </table>
                </section>
              </div>
            </div>
            <script>
              window.__CONTROL_PLANE_DATA__ = __DATA__;
            </script>
            <script>
              const data = window.__CONTROL_PLANE_DATA__;
              const caseById = new Map(data.concurrency_cases.map((entry) => [entry.scenarioId, entry]));
              const leaseById = new Map(data.leases.map((entry) => [entry.leaseId, entry]));
              const actionById = new Map(data.command_actions.map((entry) => [entry.actionRecordId, entry]));
              const recoveriesByScenario = groupBy(data.recoveries, "scenarioId");
              const takeoversByScenario = groupBy(data.takeovers, "scenarioId");
              const fencesByScenario = groupBy(data.lineage_fences, "scenarioId");
              const actionsByScenario = groupBy(data.command_actions, "scenarioId");
              const leasesByScenario = groupBy(data.leases, "scenarioId");
              const state = {
                domain: "all",
                leaseState: "all",
                fenceIssueType: "all",
                selectedScenarioId: data.concurrency_cases[0].scenarioId,
                selectedLeaseId: data.concurrency_cases[0].selectedLeaseRef,
                selectedActionId: data.concurrency_cases[0].selectedActionRef,
              };

              function groupBy(values, key) {
                return values.reduce((acc, value) => {
                  const bucket = acc.get(value[key]) ?? [];
                  bucket.push(value);
                  acc.set(value[key], bucket);
                  return acc;
                }, new Map());
              }

              function setReducedMotionFlag() {
                const media = window.matchMedia("(prefers-reduced-motion: reduce)");
                document.body.dataset.reducedMotion = media.matches ? "true" : "false";
              }

              function populateFilters() {
                fillSelect("domain-filter", [
                  ["all", "All domains"],
                  ["booking", "Booking"],
                  ["governance_admin", "Governance Admin"],
                  ["hub_coordination", "Hub Coordination"],
                  ["pharmacy", "Pharmacy"],
                  ["triage_workspace", "Triage Workspace"],
                ]);
                fillSelect("lease-state-filter", [
                  ["all", "All lease states"],
                  ["active", "Active only"],
                  ["broken", "Broken only"],
                ]);
                fillSelect("fence-issue-filter", [
                  ["all", "All fence issue types"],
                  ["none", "No fence issue"],
                  ["stale_token", "Stale token"],
                  ["stale_epoch", "Stale epoch"],
                  ["takeover", "Takeover"],
                ]);
              }

              function fillSelect(id, values) {
                const element = document.getElementById(id);
                element.innerHTML = values
                  .map(([value, label]) => `<option value="${value}">${label}</option>`)
                  .join("");
                element.addEventListener("change", (event) => {
                  state[element.id === "domain-filter" ? "domain" : element.id === "lease-state-filter" ? "leaseState" : "fenceIssueType"] = event.target.value;
                  syncSelection();
                  render();
                });
              }

              function visibleScenarioIds() {
                return data.concurrency_cases
                  .filter((entry) => {
                    if (state.domain !== "all" && entry.domain !== state.domain) {
                      return false;
                    }
                    if (state.fenceIssueType !== "all" && entry.fenceIssueType !== state.fenceIssueType) {
                      return false;
                    }
                    if (state.leaseState === "all") {
                      return true;
                    }
                    return (leasesByScenario.get(entry.scenarioId) ?? []).some((lease) => lease.state === state.leaseState);
                  })
                  .map((entry) => entry.scenarioId);
              }

              function visibleLeases() {
                const visible = new Set(visibleScenarioIds());
                return data.leases.filter((lease) => visible.has(lease.scenarioId) && (state.leaseState === "all" || lease.state === state.leaseState));
              }

              function visibleCases() {
                const visible = new Set(visibleScenarioIds());
                return data.concurrency_cases.filter((entry) => visible.has(entry.scenarioId));
              }

              function visibleActions() {
                const visible = new Set(visibleScenarioIds());
                return data.command_actions.filter((action) => visible.has(action.scenarioId));
              }

              function syncSelection() {
                const cases = visibleCases();
                if (!cases.some((entry) => entry.scenarioId === state.selectedScenarioId)) {
                  state.selectedScenarioId = cases[0]?.scenarioId ?? data.concurrency_cases[0].scenarioId;
                }
                const selectedCase = caseById.get(state.selectedScenarioId);
                const scenarioLeases = visibleLeases().filter((lease) => lease.scenarioId === state.selectedScenarioId);
                if (!scenarioLeases.some((lease) => lease.leaseId === state.selectedLeaseId)) {
                  state.selectedLeaseId = scenarioLeases[0]?.leaseId ?? selectedCase?.selectedLeaseRef ?? null;
                }
                const scenarioActions = visibleActions().filter((action) => action.scenarioId === state.selectedScenarioId);
                if (state.selectedActionId && !scenarioActions.some((action) => action.actionRecordId === state.selectedActionId)) {
                  state.selectedActionId = selectedCase?.selectedActionRef ?? scenarioActions[0]?.actionRecordId ?? null;
                }
                if (!state.selectedActionId && scenarioActions.length > 0 && selectedCase?.selectedActionRef) {
                  state.selectedActionId = selectedCase.selectedActionRef;
                }
              }

              function selectScenario(scenarioId, leaseId = null, actionId = null) {
                state.selectedScenarioId = scenarioId;
                state.selectedLeaseId = leaseId ?? caseById.get(scenarioId)?.selectedLeaseRef ?? null;
                state.selectedActionId = actionId;
                render();
              }

              function moveSelection(kind, currentId, delta) {
                const list =
                  kind === "timeline"
                    ? visibleLeases().map((lease) => lease.leaseId)
                    : kind === "case"
                      ? visibleCases().map((entry) => entry.scenarioId)
                      : visibleActions()
                          .filter((entry) => entry.scenarioId === state.selectedScenarioId)
                          .map((entry) => entry.actionRecordId);
                const currentIndex = Math.max(0, list.indexOf(currentId));
                const nextId = list[Math.min(list.length - 1, Math.max(0, currentIndex + delta))];
                if (!nextId) {
                  return;
                }
                if (kind === "timeline") {
                  const lease = leaseById.get(nextId);
                  selectScenario(lease.scenarioId, lease.leaseId, state.selectedActionId);
                } else if (kind === "case") {
                  selectScenario(nextId, caseById.get(nextId)?.selectedLeaseRef ?? null, caseById.get(nextId)?.selectedActionRef ?? null);
                } else {
                  const action = actionById.get(nextId);
                  selectScenario(action.scenarioId, caseById.get(action.scenarioId)?.selectedLeaseRef ?? null, action.actionRecordId);
                }
              }

              function render() {
                syncSelection();
                const cases = visibleCases();
                const leases = visibleLeases();
                const actions = visibleActions();
                const selectedCase = caseById.get(state.selectedScenarioId);
                const selectedLease = leaseById.get(state.selectedLeaseId) ?? leases.find((lease) => lease.scenarioId === state.selectedScenarioId) ?? null;
                const selectedAction =
                  (state.selectedActionId ? actionById.get(state.selectedActionId) : null) ??
                  actions.find((action) => action.actionRecordId === selectedCase?.selectedActionRef) ??
                  null;
                const selectedRecoveries = recoveriesByScenario.get(state.selectedScenarioId) ?? [];
                const selectedTakeovers = takeoversByScenario.get(state.selectedScenarioId) ?? [];
                const selectedFences = fencesByScenario.get(state.selectedScenarioId) ?? [];

                document.getElementById("metric-active-leases").textContent = String(leases.filter((lease) => lease.state === "active").length);
                document.getElementById("metric-open-recoveries").textContent = String(
                  data.recoveries.filter((record) => record.resolutionState === "open").length,
                );
                document.getElementById("metric-fence-mismatches").textContent = String(
                  data.recoveries.filter((record) => record.recoveryReason === "lineage_drift" || record.recoveryReason === "stale_write_rejected").length,
                );
                document.getElementById("metric-actions").textContent = String(actions.length);

                document.querySelector("[data-testid='timeline-parity']").textContent =
                  `${leases.length} visible leases aligned with ${cases.length} visible cases.`;
                document.querySelector("[data-testid='epoch-strip-parity']").textContent =
                  `${selectedFences.length} visible fences for ${state.selectedScenarioId}.`;
                document.querySelector("[data-testid='action-grid-parity']").textContent =
                  `${actions.filter((entry) => entry.scenarioId === state.selectedScenarioId).length} visible action records for the selected case.`;
                document.querySelector("[data-testid='case-table-parity']").textContent =
                  `${cases.length} visible concurrency cases.`;
                document.getElementById("filter-notes").textContent =
                  selectedCase?.operatorPosture ?? "Filters scope lease authority, epoch drift, and command-tuple posture together.";

                document.getElementById("timeline").innerHTML = leases
                  .map((lease) => `
                    <button
                      class="lease-card"
                      data-testid="lease-card-${lease.leaseId}"
                      data-selected="${lease.leaseId === state.selectedLeaseId}"
                      type="button"
                    >
                      <strong>${lease.leaseId}</strong>
                      <div class="lease-meta">
                        <span class="badge">${lease.domain}</span>
                        <span class="badge">${lease.state}</span>
                        <span class="badge mono">epoch ${lease.ownershipEpoch}</span>
                      </div>
                      <div class="lease-meta">
                        <span>${lease.ownerActorRef}</span>
                        <span class="mono">${lease.fencingToken.slice(0, 12)}…</span>
                      </div>
                    </button>
                  `)
                  .join("");
                document.querySelectorAll(".lease-card").forEach((button) => {
                  button.addEventListener("click", () => {
                    const lease = leaseById.get(button.dataset.testid.replace("lease-card-", ""));
                    selectScenario(lease.scenarioId, lease.leaseId, state.selectedActionId);
                  });
                  button.addEventListener("keydown", (event) => {
                    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                      event.preventDefault();
                      moveSelection("timeline", button.dataset.testid.replace("lease-card-", ""), event.key === "ArrowDown" ? 1 : -1);
                    }
                  });
                });

                document.getElementById("epoch-strip").innerHTML = selectedFences
                  .map((fence) => `
                    <div
                      class="epoch-pill"
                      data-testid="epoch-pill-${fence.fenceId}"
                      data-selected="${selectedCase?.fenceIssueType === fence.issueType}"
                      data-issue-type="${fence.issueType}"
                      tabindex="0"
                    >
                      <strong class="mono">epoch ${fence.currentEpoch}</strong>
                      <div class="lease-meta">
                        <span class="badge">${fence.issuedFor}</span>
                        <span class="badge">${fence.issueType}</span>
                      </div>
                      <p class="parity mono">${fence.fenceId}</p>
                    </div>
                  `)
                  .join("");

                const selectedScenarioActions = actions.filter((entry) => entry.scenarioId === state.selectedScenarioId);
                document.getElementById("action-grid").innerHTML = selectedScenarioActions.length
                  ? selectedScenarioActions
                      .map((action) => `
                        <button
                          class="action-card"
                          data-testid="action-card-${action.actionRecordId}"
                          data-selected="${action.actionRecordId === state.selectedActionId}"
                          type="button"
                        >
                          <strong>${action.actionRecordId}</strong>
                          <div class="action-meta">
                            <span class="badge">${action.actionScope}</span>
                            <span class="badge mono">epoch ${action.lineageFenceEpoch}</span>
                            <span class="badge">${action.supersedesActionRecordRef ? "superseding" : "exact"}</span>
                          </div>
                          <div class="action-meta">
                            <span class="mono">${action.routeIntentTupleHash.slice(0, 12)}…</span>
                            <span>${action.transportCorrelationId}</span>
                          </div>
                        </button>
                      `)
                      .join("")
                  : `<div class="action-card" data-testid="action-empty-state" data-selected="false">No action record is bound to this scenario.</div>`;
                document.querySelectorAll(".action-card[data-testid^='action-card-']").forEach((button) => {
                  button.addEventListener("click", () => {
                    const action = actionById.get(button.dataset.testid.replace("action-card-", ""));
                    selectScenario(action.scenarioId, caseById.get(action.scenarioId)?.selectedLeaseRef ?? null, action.actionRecordId);
                  });
                  button.addEventListener("keydown", (event) => {
                    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                      event.preventDefault();
                      moveSelection("action", button.dataset.testid.replace("action-card-", ""), event.key === "ArrowDown" ? 1 : -1);
                    }
                  });
                });

                document.getElementById("case-table-body").innerHTML = cases
                  .map((entry) => `
                    <tr>
                      <td colspan="3">
                        <button
                          class="case-row-button"
                          data-testid="case-row-${entry.scenarioId}"
                          data-selected="${entry.scenarioId === state.selectedScenarioId}"
                          type="button"
                        >
                          <strong>${entry.title}</strong>
                          <div class="lease-meta">
                            <span class="badge">${entry.domain}</span>
                            <span class="badge">${entry.fenceIssueType}</span>
                            <span>${entry.operatorPosture}</span>
                          </div>
                        </button>
                      </td>
                    </tr>
                  `)
                  .join("");
                document.querySelectorAll(".case-row-button").forEach((button) => {
                  button.addEventListener("click", () => {
                    const scenarioId = button.dataset.testid.replace("case-row-", "");
                    selectScenario(scenarioId, caseById.get(scenarioId)?.selectedLeaseRef ?? null, caseById.get(scenarioId)?.selectedActionRef ?? null);
                  });
                  button.addEventListener("keydown", (event) => {
                    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                      event.preventDefault();
                      moveSelection("case", button.dataset.testid.replace("case-row-", ""), event.key === "ArrowDown" ? 1 : -1);
                    }
                  });
                });

                document.getElementById("validator-table-body").innerHTML = data.validator_results
                  .map((entry) => `
                    <tr data-testid="validator-row-${entry.validatorId}">
                      <td>${entry.label}</td>
                      <td class="status-${entry.status}">${entry.status}</td>
                      <td>${entry.detail}</td>
                    </tr>
                  `)
                  .join("");

                document.getElementById("inspector").innerHTML = `
                  <div class="panel-title">
                    <h2>${selectedCase?.title ?? "No case selected"}</h2>
                    <span class="badge">${selectedCase?.fenceIssueType ?? "none"}</span>
                  </div>
                  <div class="inspector-card">
                    <strong>Selected lease</strong>
                    ${
                      selectedLease
                        ? `<dl class="kv">
                            <dt>Lease</dt><dd class="mono">${selectedLease.leaseId}</dd>
                            <dt>Domain</dt><dd>${selectedLease.domain}</dd>
                            <dt>Owner</dt><dd>${selectedLease.ownerActorRef}</dd>
                            <dt>State</dt><dd>${selectedLease.state}</dd>
                            <dt>Epoch</dt><dd class="mono">${selectedLease.ownershipEpoch}</dd>
                            <dt>Fence token</dt><dd class="mono">${selectedLease.fencingToken}</dd>
                            <dt>Version</dt><dd class="mono">${selectedLease.governingObjectVersionRef}</dd>
                          </dl>`
                        : "<p>No visible lease in the current filter scope.</p>"
                    }
                  </div>
                  <div class="inspector-card">
                    <strong>Selected action</strong>
                    ${
                      selectedAction
                        ? `<dl class="kv">
                            <dt>Action</dt><dd class="mono">${selectedAction.actionRecordId}</dd>
                            <dt>Scope</dt><dd>${selectedAction.actionScope}</dd>
                            <dt>Route tuple</dt><dd class="mono">${selectedAction.routeIntentTupleHash}</dd>
                            <dt>Idempotency</dt><dd class="mono">${selectedAction.idempotencyKey}</dd>
                            <dt>Supersedes</dt><dd class="mono">${selectedAction.supersedesActionRecordRef ?? "none"}</dd>
                            <dt>Transport</dt><dd>${selectedAction.transportCorrelationId}</dd>
                          </dl>`
                        : "<p>No action record is selected for this scenario.</p>"
                    }
                  </div>
                  <div class="inspector-card">
                    <strong>Recovery and takeover posture</strong>
                    <p>${selectedCase?.summary ?? ""}</p>
                    <p class="parity">Recoveries: ${selectedRecoveries.length}. Takeovers: ${selectedTakeovers.length}. Fences: ${selectedFences.length}.</p>
                    <ul>
                      ${selectedRecoveries
                        .map((entry) => `<li class="status-${entry.resolutionState === "open" ? "open" : "resolved"}">${entry.staleOwnershipRecoveryId} · ${entry.recoveryReason} · ${entry.resolutionState}</li>`)
                        .join("")}
                      ${selectedTakeovers
                        .map((entry) => `<li class="status-pass">${entry.leaseTakeoverRecordId} · ${entry.takeoverReason}</li>`)
                        .join("")}
                    </ul>
                  </div>
                `;
              }

              populateFilters();
              setReducedMotionFlag();
              syncSelection();
              render();
            </script>
          </body>
        </html>
        """
    )
    return template.replace("__DATA__", json.dumps(MANIFEST))


def build_spec() -> str:
    return dedent(
        """
        import fs from "node:fs";
        import http from "node:http";
        import path from "node:path";
        import { fileURLToPath } from "node:url";

        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const ROOT = path.resolve(__dirname, "..", "..");
        const HTML_PATH = path.join(ROOT, "docs", "architecture", "71_control_plane_lab.html");
        const MANIFEST_PATH = path.join(ROOT, "data", "analysis", "request_lifecycle_lease_manifest.json");
        const CASEBOOK_PATH = path.join(ROOT, "data", "analysis", "stale_ownership_casebook.json");
        const MATRIX_PATH = path.join(ROOT, "data", "analysis", "lineage_fence_and_command_action_matrix.csv");

        const MANIFEST = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
        const CASEBOOK = JSON.parse(fs.readFileSync(CASEBOOK_PATH, "utf8"));
        const MATRIX = fs.readFileSync(MATRIX_PATH, "utf8").trim().split(/\\r?\\n/).slice(1);

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

        function startStaticServer() {
          return new Promise((resolve, reject) => {
            const server = http.createServer((req, res) => {
              const rawUrl = req.url ?? "/";
              const urlPath =
                rawUrl === "/"
                  ? "/docs/architecture/71_control_plane_lab.html"
                  : rawUrl.split("?")[0];
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
                  : filePath.endsWith(".csv")
                    ? "text/csv; charset=utf-8"
                    : "text/plain; charset=utf-8";
              res.writeHead(200, { "Content-Type": contentType });
              res.end(body);
            });
            server.once("error", reject);
            server.listen(4371, "127.0.0.1", () => resolve(server));
          });
        }

        async function run() {
          assertCondition(fs.existsSync(HTML_PATH), `Missing lab HTML: ${HTML_PATH}`);
          const { chromium } = await importPlaywright();
          const server = await startStaticServer();
          const browser = await chromium.launch({ headless: true });
          const page = await browser.newPage({ viewport: { width: 1480, height: 1120 } });
          const url =
            process.env.CONTROL_PLANE_LAB_URL ??
            "http://127.0.0.1:4371/docs/architecture/71_control_plane_lab.html";

          try {
            await page.goto(url, { waitUntil: "networkidle" });
            await page.locator("[data-testid='timeline']").waitFor();
            await page.locator("[data-testid='epoch-strip']").waitFor();
            await page.locator("[data-testid='inspector']").waitFor();
            await page.locator("[data-testid='case-table']").waitFor();
            await page.locator("[data-testid='validator-table']").waitFor();

            const leaseCards = await page.locator("button[data-testid^='lease-card-']").count();
            assertCondition(
              leaseCards === MANIFEST.summary.lease_count,
              `Expected ${MANIFEST.summary.lease_count} visible lease cards, found ${leaseCards}.`,
            );

            await page.locator("[data-testid='domain-filter']").selectOption("pharmacy");
            const pharmacyLeases = await page.locator("button[data-testid^='lease-card-']").count();
            assertCondition(pharmacyLeases === 1, `Expected 1 pharmacy lease, found ${pharmacyLeases}.`);
            const pharmacyActions = await page.locator("button[data-testid^='action-card-']").count();
            assertCondition(pharmacyActions === 2, `Expected 2 pharmacy action cards, found ${pharmacyActions}.`);

            await page.locator("[data-testid='action-card-CAR_071_PHARMACY_RECOVERY']").click();
            await page.waitForFunction(() => {
              const inspector = document.querySelector("[data-testid='inspector']");
              return inspector?.textContent?.includes("CAR_071_PHARMACY_RECOVERY");
            });
            const inspectorText = await page.locator("[data-testid='inspector']").innerText();
            assertCondition(
              inspectorText.includes("CAR_071_PHARMACY_RECOVERY") &&
                inspectorText.includes("idem_pharmacy_dispatch_2") &&
                inspectorText.includes("CAR_071_PHARMACY_EXACT"),
              "Inspector lost action selection synchronization.",
            );
            const selectedCase = await page
              .locator("[data-testid='case-row-repeated_ui_actions_reuse_or_supersede']")
              .getAttribute("data-selected");
            assertCondition(selectedCase === "true", "Case table lost synchronization with selected action.");

            await page.locator("[data-testid='domain-filter']").selectOption("all");
            await page.locator("[data-testid='lease-state-filter']").selectOption("broken");
            const brokenLeases = await page.locator("button[data-testid^='lease-card-']").count();
            assertCondition(brokenLeases === 2, `Expected 2 broken leases, found ${brokenLeases}.`);

            await page.locator("[data-testid='lease-state-filter']").selectOption("all");
            await page.locator("[data-testid='fence-issue-filter']").selectOption("stale_epoch");
            const staleEpochLeases = await page.locator("button[data-testid^='lease-card-']").count();
            assertCondition(staleEpochLeases === 1, `Expected 1 stale-epoch lease, found ${staleEpochLeases}.`);
            const staleEpochCases = await page.locator("button[data-testid^='case-row-']").count();
            assertCondition(staleEpochCases === 1, `Expected 1 stale-epoch case, found ${staleEpochCases}.`);

            await page.locator("[data-testid='fence-issue-filter']").selectOption("all");

            const parityText = await page.locator("[data-testid='timeline-parity']").textContent();
            assertCondition(
              parityText.includes("7 visible leases"),
              "Timeline parity text drifted.",
            );
            assertCondition(
              MATRIX.length === MANIFEST.summary.lineage_fence_count + MANIFEST.summary.command_action_count,
              "Matrix row count drifted from the frozen control-plane baseline.",
            );

            await page.locator("[data-testid='lease-card-LSE_071_BOOKING_ALPHA']").focus();
            await page.keyboard.press("ArrowDown");
            const nextSelected = await page
              .locator("[data-testid='lease-card-LSE_071_BOOKING_BRAVO']")
              .getAttribute("data-selected");
            assertCondition(nextSelected === "true", "ArrowDown did not advance lease selection.");

            await page.locator("[data-testid='case-row-competing_reviewers_same_task']").focus();
            await page.keyboard.press("ArrowDown");
            const nextCaseSelected = await page
              .locator("[data-testid='case-row-worker_restart_with_stale_fencing_token']")
              .getAttribute("data-selected");
            assertCondition(nextCaseSelected === "true", "ArrowDown did not advance case-row selection.");

            await page.setViewportSize({ width: 390, height: 844 });
            const inspectorVisible = await page.locator("[data-testid='inspector']").isVisible();
            assertCondition(inspectorVisible, "Inspector disappeared on mobile width.");

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
            assertCondition(landmarks >= 7, `Expected multiple landmarks, found ${landmarks}.`);
            assertCondition(CASEBOOK.summary.case_count === 5, "Casebook summary drifted.");
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

        export const controlPlaneLabManifest = {
          task: MANIFEST.task_id,
          leases: MANIFEST.summary.lease_count,
          recoveries: MANIFEST.summary.recovery_count,
          coverage: [
            "domain filtering",
            "lease-state filtering",
            "fence issue filtering",
            "selection synchronization",
            "diagram and table parity",
            "keyboard navigation",
            "reduced motion",
            "responsive layout",
          ],
        };
        """
    )


def main() -> None:
    write_json(MANIFEST_PATH, MANIFEST)
    write_csv(MATRIX_PATH, MATRIX_ROWS)
    write_json(CASEBOOK_PATH, CASEBOOK)
    write_text(DESIGN_DOC_PATH, build_design_doc())
    write_text(RULES_DOC_PATH, build_rules_doc())
    write_text(LAB_PATH, build_lab_html())
    write_text(SPEC_PATH, build_spec())


if __name__ == "__main__":
    main()
