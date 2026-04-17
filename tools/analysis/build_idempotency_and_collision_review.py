#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path
from textwrap import dedent


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"

TASK_ID = "par_067"
VISUAL_MODE = "Replay_Collision_Studio"
CAPTURED_ON = "2026-04-12"
GENERATED_AT = "2026-04-12T00:00:00+00:00"

MANIFEST_PATH = DATA_DIR / "idempotency_record_manifest.json"
MATRIX_PATH = DATA_DIR / "replay_classification_matrix.csv"
CASEBOOK_PATH = DATA_DIR / "replay_collision_casebook.json"

DESIGN_DOC_PATH = DOCS_DIR / "67_idempotency_and_collision_review_design.md"
ALGORITHM_DOC_PATH = DOCS_DIR / "67_replay_classification_algorithm.md"
STUDIO_PATH = DOCS_DIR / "67_replay_collision_studio.html"

SOURCE_PRECEDENCE = [
    "prompt/067.md",
    "prompt/shared_operating_contract_066_to_075.md",
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "blueprint/phase-0-the-foundation-protocol.md#1.23A ReplayCollisionReview",
    "blueprint/phase-0-the-foundation-protocol.md#1.23B AdapterDispatchAttempt",
    "blueprint/phase-0-the-foundation-protocol.md#1.23C AdapterReceiptCheckpoint",
    "blueprint/phase-0-the-foundation-protocol.md#4.1 Command ingest and envelope creation",
    "blueprint/phase-0-the-foundation-protocol.md#6.6A Adapter outbox, inbox, and callback replay rule",
    "blueprint/phase-1-the-red-flag-gate.md#replay rules",
    "blueprint/forensic-audit-findings.md#Finding-04",
    "blueprint/forensic-audit-findings.md#Finding-05",
    "blueprint/forensic-audit-findings.md#Finding-18",
    "blueprint/forensic-audit-findings.md#Finding-35",
    "services/command-api/src/replay-collision-authority.ts",
    "services/command-api/src/replay-collision-simulator.ts",
    "packages/domains/identity_access/src/replay-collision-backbone.ts",
]

IDEMPOTENCY_RECORDS = [
    {
        "idempotencyRecordId": "IDR_067_BROWSER_PRIMARY",
        "scenarioId": "repeated_browser_taps_identical_raw_payloads",
        "decisionClass": "exact_replay",
        "actionScope": "request_submit",
        "governingLineageRef": "lineage_067_browser_primary",
        "sourceCommandId": "cmd_067_browser_primary",
        "sourceCommandIdFamily": "command_id",
        "transportCorrelationId": "transport_067_browser_primary",
        "rawPayloadHash": "raw_hash::067_browser_primary_exact",
        "semanticPayloadHash": "sem_hash::067_browser_primary",
        "replayKey": "replay_key::067_browser_primary",
        "scopeFingerprint": "scope_fp::067_browser_primary",
        "effectScopeKey": "effect_scope::067_browser_primary",
        "firstAcceptedActionRecordRef": "action_067_browser_primary",
        "acceptedSettlementRef": "settlement_067_browser_primary",
        "collisionReviewRef": None,
        "decisionBasisRef": "decision_basis::067_browser_primary",
        "canonicalizationNote": "Raw bytes stayed identical; the same submit command collapsed through durable backend replay control.",
        "scopeSummary": "Browser self-service governed submit for one intake lineage and one envelope-bound promotion target.",
        "effectScopeLabel": "Primary browser submit",
        "sourceRefs": [
            "packages/domains/identity_access/src/replay-collision-backbone.ts::ReplayCollisionAuthorityService.resolveInboundCommand",
            "services/command-api/src/replay-collision-simulator.ts::simulateReplayCollisionScenario",
        ],
    },
    {
        "idempotencyRecordId": "IDR_067_BROWSER_SEMANTIC",
        "scenarioId": "semantically_identical_transport_variance",
        "decisionClass": "semantic_replay",
        "actionScope": "request_submit",
        "governingLineageRef": "lineage_067_browser_semantic",
        "sourceCommandId": "cmd_067_browser_semantic",
        "sourceCommandIdFamily": "command_id",
        "transportCorrelationId": "transport_067_browser_semantic",
        "rawPayloadHash": "raw_hash::067_browser_semantic_variant",
        "semanticPayloadHash": "sem_hash::067_browser_semantic",
        "replayKey": "replay_key::067_browser_semantic",
        "scopeFingerprint": "scope_fp::067_browser_semantic",
        "effectScopeKey": "effect_scope::067_browser_semantic",
        "firstAcceptedActionRecordRef": "action_067_browser_semantic",
        "acceptedSettlementRef": "settlement_067_browser_semantic",
        "collisionReviewRef": None,
        "decisionBasisRef": "decision_basis::067_browser_semantic",
        "canonicalizationNote": "Raw framing drifted, but field ordering, trace noise, and duplicate whitespace normalized to the same semantic hash.",
        "scopeSummary": "Same governed submit intent with transport-only variance and no governing-scope drift.",
        "effectScopeLabel": "Semantic browser submit",
        "sourceRefs": [
            "packages/domains/identity_access/src/replay-collision-backbone.ts::buildCanonicalReplayHashes",
            "services/command-api/src/replay-collision-simulator.ts::simulateReplayCollisionScenario",
        ],
    },
    {
        "idempotencyRecordId": "IDR_067_SOURCE_COLLISION",
        "scenarioId": "reused_source_command_id_changed_semantics",
        "decisionClass": "collision_review",
        "actionScope": "request_submit",
        "governingLineageRef": "lineage_067_source_collision",
        "sourceCommandId": "cmd_067_source_collision",
        "sourceCommandIdFamily": "command_id",
        "transportCorrelationId": "transport_067_source_collision",
        "rawPayloadHash": "raw_hash::067_source_collision",
        "semanticPayloadHash": "sem_hash::067_source_collision",
        "replayKey": "replay_key::067_source_collision",
        "scopeFingerprint": "scope_fp::067_source_collision",
        "effectScopeKey": "effect_scope::067_source_collision",
        "firstAcceptedActionRecordRef": "action_067_source_collision_primary",
        "acceptedSettlementRef": "settlement_067_source_collision_primary",
        "collisionReviewRef": "RCR_067_SOURCE_ID_REUSE",
        "decisionBasisRef": "decision_basis::067_source_collision",
        "canonicalizationNote": "The source command identifier was reused, but semantic meaning changed from governed submit to administrative change.",
        "scopeSummary": "One canonical action scope and lineage; semantically divergent identifier reuse is quarantined rather than silently deduped.",
        "effectScopeLabel": "Source identifier collision",
        "sourceRefs": [
            "packages/domains/identity_access/src/replay-collision-backbone.ts::ReplayCollisionAuthorityService.openCollisionReview",
            "services/command-api/src/replay-collision-simulator.ts::simulateReplayCollisionScenario",
        ],
    },
    {
        "idempotencyRecordId": "IDR_067_CALLBACK_SCOPE_DRIFT",
        "scenarioId": "duplicate_callbacks_and_out_of_order_provider_receipts",
        "decisionClass": "collision_review",
        "actionScope": "booking_commit",
        "governingLineageRef": "lineage_067_callback_scope_drift",
        "sourceCommandId": "cmd_067_callback_scope_drift",
        "sourceCommandIdFamily": "idempotency_key",
        "transportCorrelationId": "transport_067_callback_scope_drift",
        "rawPayloadHash": "raw_hash::067_callback_scope_drift",
        "semanticPayloadHash": "sem_hash::067_callback_scope_drift",
        "replayKey": "replay_key::067_callback_scope_drift",
        "scopeFingerprint": "scope_fp::067_callback_scope_drift",
        "effectScopeKey": "effect_scope::067_callback_scope_drift",
        "firstAcceptedActionRecordRef": "action_067_callback_scope_drift_primary",
        "acceptedSettlementRef": "settlement_067_callback_scope_drift_primary",
        "collisionReviewRef": "RCR_067_CALLBACK_SCOPE_DRIFT",
        "decisionBasisRef": "decision_basis::067_callback_scope_drift",
        "canonicalizationNote": "Provider correlation was reused on a different effect key after accepted and stale receipt traffic already existed.",
        "scopeSummary": "Adapter callback dedupe remained canonical, and provider-local identifiers were not allowed to mint a second effect.",
        "effectScopeLabel": "Callback scope drift",
        "sourceRefs": [
            "packages/domains/identity_access/src/replay-collision-backbone.ts::ReplayCollisionAuthorityService.recordAdapterReceiptCheckpoint",
            "services/command-api/src/replay-collision-simulator.ts::simulateReplayCollisionScenario",
        ],
    },
    {
        "idempotencyRecordId": "IDR_067_OUTBOX_DISTINCT",
        "scenarioId": "delayed_duplicate_jobs_from_outbox",
        "decisionClass": "distinct",
        "actionScope": "notification_dispatch",
        "governingLineageRef": "lineage_067_outbox_distinct",
        "sourceCommandId": "cmd_067_outbox_distinct",
        "sourceCommandIdFamily": "command_id",
        "transportCorrelationId": "transport_067_outbox_distinct",
        "rawPayloadHash": "raw_hash::067_outbox_distinct",
        "semanticPayloadHash": "sem_hash::067_outbox_distinct",
        "replayKey": "replay_key::067_outbox_distinct",
        "scopeFingerprint": "scope_fp::067_outbox_distinct",
        "effectScopeKey": "effect_scope::067_outbox_distinct",
        "firstAcceptedActionRecordRef": "action_067_outbox_distinct",
        "acceptedSettlementRef": "settlement_067_outbox_distinct",
        "collisionReviewRef": None,
        "decisionBasisRef": "decision_basis::067_outbox_distinct",
        "canonicalizationNote": "The initial command remained distinct, while delayed queue replays were forced to reuse the live dispatch attempt by effect key.",
        "scopeSummary": "Outbox and worker retries share one canonical effect scope and one settlement chain.",
        "effectScopeLabel": "Outbox dispatch reuse",
        "sourceRefs": [
            "packages/domains/identity_access/src/replay-collision-backbone.ts::ReplayCollisionAuthorityService.ensureAdapterDispatchAttempt",
            "services/command-api/src/replay-collision-simulator.ts::simulateReplayCollisionScenario",
        ],
    },
]

COLLISION_REVIEWS = [
    {
        "replayCollisionReviewId": "RCR_067_SOURCE_ID_REUSE",
        "idempotencyRecordRef": "IDR_067_SOURCE_COLLISION",
        "actionScope": "request_submit",
        "governingLineageRef": "lineage_067_source_collision",
        "existingActionRecordRef": "action_067_source_collision_primary",
        "existingSettlementRef": "settlement_067_source_collision_primary",
        "incomingSourceCommandId": "cmd_067_source_collision",
        "incomingTransportCorrelationId": "transport_067_source_collision",
        "incomingSemanticPayloadHash": "sem_hash::067_source_collision_drift",
        "incomingEffectSetHash": "effect_set::067_source_collision",
        "collisionClass": "source_id_reuse",
        "reviewState": "open",
        "createdAt": "2026-04-12T12:30:10Z",
        "resolvedAt": None,
        "summary": "Semantically divergent reuse of the same source command identifier.",
    },
    {
        "replayCollisionReviewId": "RCR_067_CALLBACK_SCOPE_DRIFT",
        "idempotencyRecordRef": "IDR_067_CALLBACK_SCOPE_DRIFT",
        "actionScope": "booking_commit",
        "governingLineageRef": "lineage_067_callback_scope_drift",
        "existingActionRecordRef": "action_067_callback_scope_drift_primary",
        "existingSettlementRef": "settlement_067_callback_scope_drift_primary",
        "incomingSourceCommandId": "provider_message_067_b",
        "incomingTransportCorrelationId": "provider_corr_067_shared",
        "incomingSemanticPayloadHash": "sem_hash::067_callback_scope_drift_incoming",
        "incomingEffectSetHash": "effect_sim_067_booking_secondary",
        "collisionClass": "callback_scope_drift",
        "reviewState": "open",
        "createdAt": "2026-04-12T12:30:25Z",
        "resolvedAt": None,
        "summary": "Provider correlation drifted across effect scopes after accepted callback traffic already existed.",
    },
]

ADAPTER_DISPATCH_ATTEMPTS = [
    {
        "dispatchAttemptId": "ADA_067_BOOKING_PRIMARY",
        "idempotencyRecordRef": "IDR_067_CALLBACK_SCOPE_DRIFT",
        "actionScope": "booking_commit",
        "governingLineageRef": "lineage_067_callback_scope_drift",
        "actionRecordRef": "action_067_callback_scope_drift_primary",
        "adapterContractProfileRef": "adapter_contract_booking_v1",
        "effectScope": "booking_confirmation",
        "effectKey": "effect_067_booking_primary",
        "providerCorrelationRef": "provider_corr_067_shared",
        "status": "collision_review",
        "attemptCount": 1,
        "firstDispatchedAt": "2026-04-12T12:30:20Z",
        "lastObservedAt": "2026-04-12T12:30:25Z",
        "confirmedSettlementRef": "settlement_booking_067_primary",
    },
    {
        "dispatchAttemptId": "ADA_067_OUTBOX_PRIMARY",
        "idempotencyRecordRef": "IDR_067_OUTBOX_DISTINCT",
        "actionScope": "notification_dispatch",
        "governingLineageRef": "lineage_067_outbox_distinct",
        "actionRecordRef": "action_067_outbox_distinct",
        "adapterContractProfileRef": "adapter_contract_notifications_v1",
        "effectScope": "notification_delivery",
        "effectKey": "effect_067_outbox_primary",
        "providerCorrelationRef": "provider_corr_067_outbox",
        "status": "duplicate_accepted",
        "attemptCount": 1,
        "firstDispatchedAt": "2026-04-12T12:30:40Z",
        "lastObservedAt": "2026-04-12T12:30:41Z",
        "confirmedSettlementRef": "settlement_067_outbox_distinct",
    },
]

RECEIPT_CHECKPOINTS = [
    {
        "receiptCheckpointId": "ARC_067_ACCEPTED_NEW",
        "recordRef": "IDR_067_CALLBACK_SCOPE_DRIFT",
        "adapterContractProfileRef": "adapter_contract_booking_v1",
        "effectKey": "effect_067_booking_primary",
        "providerCorrelationRef": "provider_corr_067_shared",
        "transportMessageId": "provider_message_067_a",
        "orderingKey": "200",
        "decisionClass": "accepted_new",
        "linkedSettlementRef": "settlement_booking_067_primary",
        "recordedAt": "2026-04-12T12:30:25Z",
        "summary": "First accepted callback established the current confirmation chain.",
    },
    {
        "receiptCheckpointId": "ARC_067_SEMANTIC_REPLAY",
        "recordRef": "IDR_067_CALLBACK_SCOPE_DRIFT",
        "adapterContractProfileRef": "adapter_contract_booking_v1",
        "effectKey": "effect_067_booking_primary",
        "providerCorrelationRef": "provider_corr_067_shared",
        "transportMessageId": "provider_message_067_a",
        "orderingKey": "200",
        "decisionClass": "semantic_replay",
        "linkedSettlementRef": "settlement_booking_067_primary",
        "recordedAt": "2026-04-12T12:30:26Z",
        "summary": "Receipt replay differed only by transport framing and stayed on the same settlement chain.",
    },
    {
        "receiptCheckpointId": "ARC_067_STALE_IGNORED",
        "recordRef": "IDR_067_CALLBACK_SCOPE_DRIFT",
        "adapterContractProfileRef": "adapter_contract_booking_v1",
        "effectKey": "effect_067_booking_primary",
        "providerCorrelationRef": "provider_corr_067_shared",
        "transportMessageId": "provider_message_067_b",
        "orderingKey": "199",
        "decisionClass": "stale_ignored",
        "linkedSettlementRef": "settlement_booking_067_primary",
        "recordedAt": "2026-04-12T12:30:27Z",
        "summary": "Out-of-order callback was observed but safely ignored.",
    },
    {
        "receiptCheckpointId": "ARC_067_COLLISION_REVIEW",
        "recordRef": "IDR_067_CALLBACK_SCOPE_DRIFT",
        "adapterContractProfileRef": "adapter_contract_booking_v1",
        "effectKey": "effect_067_booking_secondary",
        "providerCorrelationRef": "provider_corr_067_shared",
        "transportMessageId": "provider_message_067_c",
        "orderingKey": "201",
        "decisionClass": "collision_review",
        "linkedSettlementRef": "settlement_booking_067_primary",
        "recordedAt": "2026-04-12T12:30:28Z",
        "summary": "Provider correlation reused on the wrong effect scope opened governed collision review.",
    },
]

VALIDATOR_RESULTS = [
    {
        "validatorId": "VAL_067_DETERMINISTIC_REPLAY",
        "verdict": "pass",
        "summary": "Repeated replay inputs converge to one durable decision class and one authoritative settlement chain.",
    },
    {
        "validatorId": "VAL_067_COLLISION_FREEZES_MUTATION",
        "verdict": "pass",
        "summary": "Open ReplayCollisionReview rows keep automatic mutation blocked and point back to the existing accepted chain.",
    },
    {
        "validatorId": "VAL_067_EFFECT_SCOPE_UNIQUENESS",
        "verdict": "pass",
        "summary": "One effect scope key maps to one accepted action chain and one dispatch attempt.",
    },
    {
        "validatorId": "VAL_067_RECEIPT_CHAIN_SINGLETON",
        "verdict": "pass",
        "summary": "Receipt checkpoints advance or ignore the same settlement chain; they do not mint a second business result.",
    },
]

CASEBOOK = [
    {
        "caseId": "CASE_067_IDENTICAL_BROWSER_TAPS",
        "recordRef": "IDR_067_BROWSER_PRIMARY",
        "scenarioId": "repeated_browser_taps_identical_raw_payloads",
        "decisionClass": "exact_replay",
        "blockedAutomaticMutation": False,
        "timeline": [
            "distinct_accept",
            "exact_replay_returned",
        ],
        "sourceRefs": [
            "prompt/067.md",
            "services/command-api/src/replay-collision-simulator.ts",
        ],
    },
    {
        "caseId": "CASE_067_TRANSPORT_VARIANCE",
        "recordRef": "IDR_067_BROWSER_SEMANTIC",
        "scenarioId": "semantically_identical_transport_variance",
        "decisionClass": "semantic_replay",
        "blockedAutomaticMutation": False,
        "timeline": [
            "distinct_accept",
            "semantic_replay_returned",
        ],
        "sourceRefs": [
            "prompt/067.md",
            "packages/domains/identity_access/src/replay-collision-backbone.ts",
        ],
    },
    {
        "caseId": "CASE_067_SOURCE_ID_COLLISION",
        "recordRef": "IDR_067_SOURCE_COLLISION",
        "scenarioId": "reused_source_command_id_changed_semantics",
        "decisionClass": "collision_review",
        "blockedAutomaticMutation": True,
        "timeline": [
            "distinct_accept",
            "collision_review_opened",
        ],
        "sourceRefs": [
            "prompt/067.md",
            "packages/domains/identity_access/src/replay-collision-backbone.ts",
        ],
    },
    {
        "caseId": "CASE_067_CALLBACK_SCOPE_DRIFT",
        "recordRef": "IDR_067_CALLBACK_SCOPE_DRIFT",
        "scenarioId": "duplicate_callbacks_and_out_of_order_provider_receipts",
        "decisionClass": "collision_review",
        "blockedAutomaticMutation": True,
        "timeline": [
            "accepted_new_receipt",
            "semantic_replay_receipt",
            "stale_receipt_ignored",
            "callback_scope_drift_collision",
        ],
        "sourceRefs": [
            "prompt/067.md",
            "services/command-api/src/replay-collision-simulator.ts",
        ],
    },
    {
        "caseId": "CASE_067_OUTBOX_DUPLICATE_JOB",
        "recordRef": "IDR_067_OUTBOX_DISTINCT",
        "scenarioId": "delayed_duplicate_jobs_from_outbox",
        "decisionClass": "distinct",
        "blockedAutomaticMutation": False,
        "timeline": [
            "distinct_accept",
            "dispatch_attempt_created",
            "dispatch_attempt_reused",
        ],
        "sourceRefs": [
            "prompt/067.md",
            "services/command-api/src/replay-collision-simulator.ts",
        ],
    },
]

MATRIX_ROWS = [
    {
        "scenario_id": "repeated_browser_taps_identical_raw_payloads",
        "record_ref": "IDR_067_BROWSER_PRIMARY",
        "action_scope": "request_submit",
        "decision_class": "exact_replay",
        "raw_hash_relation": "same",
        "semantic_hash_relation": "same",
        "scope_relation": "same",
        "effect_scope_relation": "same",
        "returned_settlement_ref": "settlement_067_browser_primary",
        "blocked_automatic_mutation": "false",
        "source_refs": "blueprint/phase-0-the-foundation-protocol.md#4.1 Command ingest and envelope creation; services/command-api/src/replay-collision-simulator.ts",
    },
    {
        "scenario_id": "semantically_identical_transport_variance",
        "record_ref": "IDR_067_BROWSER_SEMANTIC",
        "action_scope": "request_submit",
        "decision_class": "semantic_replay",
        "raw_hash_relation": "different",
        "semantic_hash_relation": "same",
        "scope_relation": "same",
        "effect_scope_relation": "same",
        "returned_settlement_ref": "settlement_067_browser_semantic",
        "blocked_automatic_mutation": "false",
        "source_refs": "blueprint/phase-0-the-foundation-protocol.md#4.1 Command ingest and envelope creation; packages/domains/identity_access/src/replay-collision-backbone.ts",
    },
    {
        "scenario_id": "reused_source_command_id_changed_semantics",
        "record_ref": "IDR_067_SOURCE_COLLISION",
        "action_scope": "request_submit",
        "decision_class": "collision_review",
        "raw_hash_relation": "different",
        "semantic_hash_relation": "different",
        "scope_relation": "same",
        "effect_scope_relation": "same",
        "returned_settlement_ref": "settlement_067_source_collision_primary",
        "blocked_automatic_mutation": "true",
        "source_refs": "blueprint/phase-0-the-foundation-protocol.md#1.23A ReplayCollisionReview; packages/domains/identity_access/src/replay-collision-backbone.ts",
    },
    {
        "scenario_id": "duplicate_callbacks_and_out_of_order_provider_receipts",
        "record_ref": "IDR_067_CALLBACK_SCOPE_DRIFT",
        "action_scope": "booking_commit",
        "decision_class": "collision_review",
        "raw_hash_relation": "mixed",
        "semantic_hash_relation": "mixed",
        "scope_relation": "drifted",
        "effect_scope_relation": "drifted",
        "returned_settlement_ref": "settlement_067_callback_scope_drift_primary",
        "blocked_automatic_mutation": "true",
        "source_refs": "blueprint/phase-0-the-foundation-protocol.md#6.6A Adapter outbox, inbox, and callback replay rule; services/command-api/src/replay-collision-simulator.ts",
    },
    {
        "scenario_id": "delayed_duplicate_jobs_from_outbox",
        "record_ref": "IDR_067_OUTBOX_DISTINCT",
        "action_scope": "notification_dispatch",
        "decision_class": "distinct",
        "raw_hash_relation": "same",
        "semantic_hash_relation": "same",
        "scope_relation": "same",
        "effect_scope_relation": "same",
        "returned_settlement_ref": "settlement_067_outbox_distinct",
        "blocked_automatic_mutation": "false",
        "source_refs": "blueprint/phase-0-the-foundation-protocol.md#6.6A Adapter outbox, inbox, and callback replay rule; packages/domains/identity_access/src/replay-collision-backbone.ts",
    },
]

IMPLEMENTATION_FILES = [
    "packages/domain-kernel/src/request-intake-backbone.ts",
    "packages/domains/identity_access/src/replay-collision-backbone.ts",
    "packages/domains/identity_access/tests/replay-collision-backbone.test.ts",
    "packages/domains/identity_access/src/index.ts",
    "services/command-api/src/replay-collision-authority.ts",
    "services/command-api/src/replay-collision-simulator.ts",
    "services/command-api/tests/replay-collision.integration.test.js",
    "services/command-api/migrations/067_idempotency_and_replay_collision.sql",
    "tools/analysis/build_idempotency_and_collision_review.py",
    "tools/analysis/validate_replay_classification.py",
    "tests/playwright/replay-collision-studio.spec.js",
]


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n")


def write_json(path: Path, payload: object) -> None:
    write_text(path, json.dumps(payload, indent=2))


def write_csv(path: Path, rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)


def build_manifest() -> dict:
    decision_counts = {}
    for record in IDEMPOTENCY_RECORDS:
        decision_counts[record["decisionClass"]] = decision_counts.get(record["decisionClass"], 0) + 1

    return {
        "task_id": TASK_ID,
        "visual_mode": VISUAL_MODE,
        "captured_on": CAPTURED_ON,
        "generated_at": GENERATED_AT,
        "mission": (
            "Freeze the canonical replay and collision-control layer so submit replays, transport variance, "
            "identifier drift, callback scope drift, and delayed outbox jobs all resolve through one durable "
            "IdempotencyRecord plus governed ReplayCollisionReview."
        ),
        "source_precedence": SOURCE_PRECEDENCE,
        "summary": {
            "idempotency_record_count": len(IDEMPOTENCY_RECORDS),
            "exact_replay_count": decision_counts.get("exact_replay", 0),
            "semantic_replay_count": decision_counts.get("semantic_replay", 0),
            "collision_review_count": decision_counts.get("collision_review", 0),
            "distinct_count": decision_counts.get("distinct", 0),
            "replay_collision_review_count": len(COLLISION_REVIEWS),
            "dispatch_attempt_count": len(ADAPTER_DISPATCH_ATTEMPTS),
            "receipt_checkpoint_count": len(RECEIPT_CHECKPOINTS),
            "casebook_count": len(CASEBOOK),
            "implementation_file_count": len(IMPLEMENTATION_FILES),
        },
        "idempotencyRecords": IDEMPOTENCY_RECORDS,
        "replayCollisionReviews": COLLISION_REVIEWS,
        "adapterDispatchAttempts": ADAPTER_DISPATCH_ATTEMPTS,
        "adapterReceiptCheckpoints": RECEIPT_CHECKPOINTS,
        "validatorResults": VALIDATOR_RESULTS,
        "implementationFiles": IMPLEMENTATION_FILES,
    }


def build_design_doc(manifest: dict) -> str:
    return dedent(
        f"""
        # 67 Idempotency And Collision Review Design

        Captured on `{CAPTURED_ON}` for `{TASK_ID}`.

        ## Authority Split

        `IdempotencyRecord` is the durable replay authority. It owns canonical command hashes, replay keys, effect-scope uniqueness, and the accepted action-settlement chain.

        `ReplayCollisionReview` is the only legal holding area for semantically divergent identifier reuse or callback scope drift. It never quietly converts back into ordinary mutation.

        `AdapterDispatchAttempt` and `AdapterReceiptCheckpoint` are the callback-safe support objects. They bind one externally consequential effect key to one dispatch chain and one receipt checkpoint ledger.

        ## Canonical Homes

        - `packages/domains/identity_access/src/replay-collision-backbone.ts`
        - `services/command-api/src/replay-collision-authority.ts`
        - `services/command-api/src/replay-collision-simulator.ts`
        - `services/command-api/migrations/067_idempotency_and_replay_collision.sql`

        ## Summary

        - Idempotency records: `{manifest["summary"]["idempotency_record_count"]}`
        - Replay collision reviews: `{manifest["summary"]["replay_collision_review_count"]}`
        - Dispatch attempts: `{manifest["summary"]["dispatch_attempt_count"]}`
        - Receipt checkpoints: `{manifest["summary"]["receipt_checkpoint_count"]}`

        ## Control Guarantees

        1. Canonical hashing strips transport-only noise but preserves actor-, scope-, lineage-, and intent-bearing content.
        2. Replay recognition runs under compare-and-set and never depends on browser debouncing or queue retries.
        3. Exact and semantic replay return the same authoritative settlement chain.
        4. Divergent identifier reuse opens explicit `ReplayCollisionReview` and blocks automatic mutation.
        5. Callback dedupe can advance or ignore the same chain, but it cannot create a second business result.
        """
    ).strip()


def build_algorithm_doc() -> str:
    return dedent(
        """
        # 67 Replay Classification Algorithm

        ## Canonicalization Steps

        1. Compute `h_raw = H(raw_bytes)` from the transport payload exactly as received.
        2. Compute `h_sem = H(Canon_sem(payload))`, where canonical semantic payload:
           - removes trace and transport-only fields
           - sorts object keys
           - collapses duplicate whitespace
           - preserves actor, scope, lineage, and intent fields
        3. Compute `expectedEffectSetHash` from the sorted expected-effect list.
        4. Compute `scopeFingerprint` from action scope, governing lineage, governing object, route tuple, route contract digest, runtime binding, and release-trust posture.
        5. Compute `replayKey = H(actionScope || governingLineageRef || effectiveActorRef || h_sem || causalParentRef || intentGeneration)`.

        ## Classification Order

        1. If the exact replay composite already exists, classify `exact_replay` when `h_raw` matches and `semantic_replay` when only `h_sem` matches.
        2. If source command or transport correlation resolves to an existing record with matching semantic hash and matching scope fingerprint, classify replay against that same authoritative chain.
        3. If source command, transport correlation, or callback correlation resolves to an existing record but semantic payload or scope diverges, open `ReplayCollisionReview`.
        4. If the effect scope key is already owned by another accepted chain, fail closed into governed collision review instead of accepting a second side effect.
        5. Otherwise persist a new `IdempotencyRecord(decisionClass = distinct)` and allow one canonical mutation path.

        ## Callback Rules

        1. Every effect key owns one live `AdapterDispatchAttempt`.
        2. `AdapterReceiptCheckpoint` accepts new receipts, returns exact or semantic replay, ignores stale out-of-order receipts, or opens callback-scope collision review.
        3. Receipt checkpoints may confirm or repeat the same settlement chain; they may not fork it.
        """
    ).strip()


def build_studio_html() -> str:
    html = """
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>67 Replay Collision Studio</title>
    <style>
      :root {
        color-scheme: light;
        --canvas: #F7F8FC;
        --panel: #FFFFFF;
        --rail: #EEF2F8;
        --inset: #F4F6FB;
        --text-strong: #0F172A;
        --text-default: #1E293B;
        --text-muted: #667085;
        --border: #E2E8F0;
        --exact: #0EA5A4;
        --semantic: #3559E6;
        --collision: #7C3AED;
        --warning: #C98900;
        --blocked: #C24141;
        --shadow: 0 24px 60px rgba(15, 23, 42, 0.08);
      }

      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: var(--canvas);
        color: var(--text-default);
      }
      body[data-reduced-motion="true"] * {
        animation-duration: 0.001ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.001ms !important;
        scroll-behavior: auto !important;
      }
      .shell {
        max-width: 1500px;
        margin: 0 auto;
        padding: 24px;
        display: grid;
        gap: 20px;
      }
      .masthead {
        min-height: 72px;
        display: grid;
        grid-template-columns: 1.4fr 1fr;
        gap: 20px;
        align-items: center;
      }
      .brand, .metric-strip, .rail, .panel, .inspector, .lower-grid {
        background: var(--panel);
        border: 1px solid var(--border);
        border-radius: 24px;
        box-shadow: var(--shadow);
      }
      .brand {
        padding: 18px 22px;
        display: flex;
        align-items: center;
        gap: 18px;
      }
      .brand svg {
        width: 46px;
        height: 46px;
        flex: none;
      }
      .brand small {
        display: block;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.14em;
        font-size: 11px;
        margin-bottom: 4px;
      }
      .brand h1 {
        margin: 0;
        font-size: 24px;
        color: var(--text-strong);
      }
      .metric-strip {
        padding: 14px 18px;
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px;
      }
      .metric {
        border-radius: 18px;
        background: var(--inset);
        padding: 12px 14px;
      }
      .metric span {
        display: block;
        color: var(--text-muted);
        font-size: 12px;
      }
      .metric strong {
        display: block;
        margin-top: 6px;
        color: var(--text-strong);
        font-size: 24px;
      }
      .workspace {
        display: grid;
        grid-template-columns: 300px minmax(0, 1fr) 408px;
        gap: 20px;
        align-items: start;
      }
      .rail {
        padding: 18px;
        position: sticky;
        top: 24px;
      }
      .rail h2, .panel h2, .inspector h2 {
        margin: 0 0 12px;
        color: var(--text-strong);
        font-size: 16px;
      }
      .field {
        display: grid;
        gap: 8px;
        margin-bottom: 14px;
      }
      .field label {
        font-size: 12px;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.12em;
      }
      select, button.card, .matrix-row {
        min-height: 44px;
        transition: transform 180ms ease, border-color 180ms ease, background 180ms ease;
      }
      select {
        border: 1px solid var(--border);
        border-radius: 16px;
        padding: 0 14px;
        background: var(--inset);
        color: var(--text-default);
        font: inherit;
      }
      .record-list {
        display: grid;
        gap: 12px;
        margin-top: 18px;
      }
      button.card {
        width: 100%;
        text-align: left;
        border: 1px solid var(--border);
        border-radius: 20px;
        background: var(--panel);
        padding: 16px;
        cursor: pointer;
      }
      button.card[data-selected="true"] {
        border-color: var(--semantic);
        background: rgba(53, 89, 230, 0.06);
        transform: translateY(-1px);
      }
      .decision-chip {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        border-radius: 999px;
        padding: 4px 10px;
        font-size: 12px;
        font-weight: 600;
      }
      .decision-chip.exact_replay { background: rgba(14, 165, 164, 0.14); color: var(--exact); }
      .decision-chip.semantic_replay { background: rgba(53, 89, 230, 0.14); color: var(--semantic); }
      .decision-chip.collision_review { background: rgba(124, 58, 237, 0.14); color: var(--collision); }
      .decision-chip.distinct { background: rgba(201, 137, 0, 0.14); color: var(--warning); }
      .card h3 {
        margin: 12px 0 6px;
        color: var(--text-strong);
        font-size: 17px;
      }
      .mono {
        font-family: "SFMono-Regular", SFMono-Regular, ui-monospace, Menlo, monospace;
      }
      .center {
        display: grid;
        gap: 20px;
      }
      .panel {
        padding: 18px 20px;
      }
      .panel-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        min-height: 260px;
      }
      .inset {
        background: var(--inset);
        border: 1px solid var(--border);
        border-radius: 20px;
        padding: 16px;
      }
      .timeline-list, .validator-list, .checkpoint-table, .matrix-table {
        display: grid;
        gap: 10px;
      }
      .timeline-step, .validator-row, .checkpoint-row, .matrix-row {
        border: 1px solid var(--border);
        border-radius: 16px;
        padding: 12px 14px;
        background: var(--panel);
      }
      .timeline-step[data-selected="true"], .matrix-row[data-selected="true"] {
        border-color: var(--semantic);
        background: rgba(53, 89, 230, 0.06);
      }
      .inspector {
        padding: 18px 20px;
        min-height: 100%;
        transition: transform 220ms ease;
      }
      .inspector-grid {
        display: grid;
        gap: 12px;
      }
      .inspector dl {
        margin: 0;
        display: grid;
        grid-template-columns: 1fr;
        gap: 8px;
      }
      .inspector dt {
        color: var(--text-muted);
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.12em;
      }
      .inspector dd {
        margin: 0;
        color: var(--text-default);
      }
      .lower-grid {
        padding: 18px 20px;
      }
      .lower-grid-inner {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 18px;
      }
      .matrix-row { cursor: pointer; }
      .legend {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        margin-top: 10px;
        color: var(--text-muted);
        font-size: 12px;
      }
      .swatch {
        width: 10px;
        height: 10px;
        border-radius: 999px;
        display: inline-block;
      }
      @media (max-width: 1160px) {
        .workspace {
          grid-template-columns: 1fr;
        }
        .rail, .inspector {
          position: static;
        }
      }
      @media (max-width: 900px) {
        .masthead, .panel-grid, .lower-grid-inner {
          grid-template-columns: 1fr;
        }
        .metric-strip {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
    </style>
  </head>
  <body>
    <div class="shell">
      <header class="masthead" aria-label="Replay collision studio header">
        <section class="brand">
          <svg viewBox="0 0 64 64" aria-hidden="true">
            <rect x="4" y="4" width="56" height="56" rx="18" fill="#0F172A"></rect>
            <path d="M18 46V18h18c8 0 13 4 13 11 0 4-2 7-5 9l7 8H42l-6-7h-8v7H18zm10-15h8c3 0 5-2 5-4s-2-4-5-4h-8v8zM18 18l17 28h-9L9 18h9z" fill="#F7F8FC"></path>
          </svg>
          <div>
            <small>Vecells Replay Authority</small>
            <h1>Replay Collision Studio</h1>
            <div class="legend">
              <span><span class="swatch" style="background: var(--exact)"></span> Exact replay</span>
              <span><span class="swatch" style="background: var(--semantic)"></span> Semantic replay</span>
              <span><span class="swatch" style="background: var(--collision)"></span> Collision review</span>
              <span><span class="swatch" style="background: var(--warning)"></span> Distinct</span>
            </div>
          </div>
        </section>
        <section class="metric-strip" aria-label="Replay metrics">
          <article class="metric"><span>Exact Replay</span><strong data-testid="metric-exact-total"></strong></article>
          <article class="metric"><span>Semantic Replay</span><strong data-testid="metric-semantic-total"></strong></article>
          <article class="metric"><span>Collision Review</span><strong data-testid="metric-collision-total"></strong></article>
          <article class="metric"><span>Distinct</span><strong data-testid="metric-distinct-total"></strong></article>
        </section>
      </header>

      <main class="workspace">
        <aside class="rail" aria-label="Replay filters">
          <h2>Filters</h2>
          <div class="field">
            <label for="action-scope-filter">Action Scope</label>
            <select id="action-scope-filter" data-testid="action-scope-filter"></select>
          </div>
          <div class="field">
            <label for="decision-class-filter">Decision Class</label>
            <select id="decision-class-filter" data-testid="decision-class-filter"></select>
          </div>
          <div class="field">
            <label for="effect-scope-filter">Effect Scope</label>
            <select id="effect-scope-filter" data-testid="effect-scope-filter"></select>
          </div>
          <div class="record-list" data-testid="record-list"></div>
        </aside>

        <section class="center">
          <section class="panel">
            <h2>Raw Vs Semantic Diff</h2>
            <div class="panel-grid" data-testid="diff-pane"></div>
          </section>
          <section class="panel">
            <h2>Replay Decision Timeline</h2>
            <div class="timeline-list" data-testid="decision-timeline"></div>
          </section>
          <section class="lower-grid">
            <div class="lower-grid-inner">
              <section>
                <h2>Callback Checkpoints</h2>
                <div class="checkpoint-table" data-testid="checkpoint-table"></div>
              </section>
              <section>
                <h2>Validation Rail</h2>
                <div class="validator-list" data-testid="validator-rail"></div>
              </section>
            </div>
          </section>
          <section class="panel">
            <h2>Classification Matrix</h2>
            <div class="matrix-table" data-testid="classification-matrix"></div>
          </section>
        </section>

        <aside class="inspector" aria-label="Selected replay record inspector" data-testid="inspector">
          <h2>Inspector</h2>
          <div class="inspector-grid"></div>
        </aside>
      </main>
    </div>

    <script>
      const MANIFEST_PATH = "__MANIFEST_PATH__";
      const CASEBOOK_PATH = "__CASEBOOK_PATH__";
      const MATRIX_PATH = "__MATRIX_PATH__";

      function parseCsv(text) {
        const lines = text.trim().split(/\\r?\\n/);
        const headers = lines[0].split(",");
        return lines.slice(1).map((line) => {
          const values = line.split(",");
          const row = {};
          headers.forEach((header, index) => {
            row[header] = values[index] ?? "";
          });
          return row;
        });
      }

      function decisionLabel(decisionClass) {
        return decisionClass.replace(/_/g, " ");
      }

      function uniqueOptions(values) {
        return ["all", ...Array.from(new Set(values)).sort()];
      }

      const state = {
        manifest: null,
        casebook: null,
        matrix: [],
        selectedRecordId: null,
        filters: {
          actionScope: "all",
          decisionClass: "all",
          effectScope: "all",
        },
      };

      function filteredRecords() {
        return state.manifest.idempotencyRecords.filter((record) => {
          if (state.filters.actionScope !== "all" && record.actionScope !== state.filters.actionScope) {
            return false;
          }
          if (state.filters.decisionClass !== "all" && record.decisionClass !== state.filters.decisionClass) {
            return false;
          }
          if (state.filters.effectScope !== "all" && record.effectScopeLabel !== state.filters.effectScope) {
            return false;
          }
          return true;
        });
      }

      function currentRecord() {
        const records = filteredRecords();
        const selected = records.find((record) => record.idempotencyRecordId === state.selectedRecordId);
        return selected ?? records[0] ?? null;
      }

      function currentCase() {
        const record = currentRecord();
        if (!record) return null;
        return state.casebook.replayCases.find((entry) => entry.recordRef === record.idempotencyRecordId) ?? null;
      }

      function currentCheckpoints() {
        const record = currentRecord();
        if (!record) return [];
        return state.manifest.adapterReceiptCheckpoints.filter((checkpoint) => checkpoint.recordRef === record.idempotencyRecordId);
      }

      function renderMetrics() {
        const summary = state.manifest.summary;
        document.querySelector("[data-testid='metric-exact-total']").textContent = String(summary.exact_replay_count);
        document.querySelector("[data-testid='metric-semantic-total']").textContent = String(summary.semantic_replay_count);
        document.querySelector("[data-testid='metric-collision-total']").textContent = String(summary.collision_review_count);
        document.querySelector("[data-testid='metric-distinct-total']").textContent = String(summary.distinct_count);
      }

      function renderFilters() {
        const actionScopeFilter = document.querySelector("[data-testid='action-scope-filter']");
        const decisionClassFilter = document.querySelector("[data-testid='decision-class-filter']");
        const effectScopeFilter = document.querySelector("[data-testid='effect-scope-filter']");

        const actionOptions = uniqueOptions(state.manifest.idempotencyRecords.map((record) => record.actionScope));
        const decisionOptions = uniqueOptions(state.manifest.idempotencyRecords.map((record) => record.decisionClass));
        const effectOptions = uniqueOptions(state.manifest.idempotencyRecords.map((record) => record.effectScopeLabel));

        actionScopeFilter.innerHTML = actionOptions.map((value) => `<option value="${value}">${value}</option>`).join("");
        decisionClassFilter.innerHTML = decisionOptions.map((value) => `<option value="${value}">${decisionLabel(value)}</option>`).join("");
        effectScopeFilter.innerHTML = effectOptions.map((value) => `<option value="${value}">${value}</option>`).join("");

        actionScopeFilter.value = state.filters.actionScope;
        decisionClassFilter.value = state.filters.decisionClass;
        effectScopeFilter.value = state.filters.effectScope;

        actionScopeFilter.onchange = (event) => {
          state.filters.actionScope = event.target.value;
          render();
        };
        decisionClassFilter.onchange = (event) => {
          state.filters.decisionClass = event.target.value;
          render();
        };
        effectScopeFilter.onchange = (event) => {
          state.filters.effectScope = event.target.value;
          render();
        };
      }

      function selectRecord(recordId) {
        state.selectedRecordId = recordId;
        render();
      }

      function renderCards() {
        const records = filteredRecords();
        if (!records.find((record) => record.idempotencyRecordId === state.selectedRecordId)) {
          state.selectedRecordId = records[0]?.idempotencyRecordId ?? null;
        }
        const selectedId = currentRecord()?.idempotencyRecordId;
        const list = document.querySelector("[data-testid='record-list']");
        list.innerHTML = records.map((record) => `
          <button
            class="card"
            type="button"
            data-testid="record-card-${record.idempotencyRecordId}"
            data-selected="${String(record.idempotencyRecordId === selectedId)}"
            aria-pressed="${String(record.idempotencyRecordId === selectedId)}"
          >
            <span class="decision-chip ${record.decisionClass}">
              ${decisionLabel(record.decisionClass)}
            </span>
            <h3>${record.effectScopeLabel}</h3>
            <div>${record.scopeSummary}</div>
            <div class="mono" style="margin-top:10px;color:var(--text-muted);font-size:12px;">
              ${record.idempotencyRecordId}
            </div>
          </button>
        `).join("");

        list.querySelectorAll("button.card").forEach((button, index) => {
          button.addEventListener("click", () => selectRecord(records[index].idempotencyRecordId));
          button.addEventListener("keydown", (event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              const next = records[(index + 1) % records.length];
              selectRecord(next.idempotencyRecordId);
              list.querySelector(`[data-testid="record-card-${next.idempotencyRecordId}"]`)?.focus();
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              const next = records[(index - 1 + records.length) % records.length];
              selectRecord(next.idempotencyRecordId);
              list.querySelector(`[data-testid="record-card-${next.idempotencyRecordId}"]`)?.focus();
            }
          });
        });
      }

      function renderDiffPane() {
        const record = currentRecord();
        const panel = document.querySelector("[data-testid='diff-pane']");
        if (!record) {
          panel.innerHTML = "";
          return;
        }
        panel.innerHTML = `
          <article class="inset">
            <h3>Raw Hash Basis</h3>
            <p>${record.canonicalizationNote}</p>
            <div class="mono" data-testid="raw-hash-value">${record.rawPayloadHash}</div>
          </article>
          <article class="inset">
            <h3>Semantic Hash Basis</h3>
            <p>${record.scopeSummary}</p>
            <div class="mono" data-testid="semantic-hash-value">${record.semanticPayloadHash}</div>
            <div class="legend">
              <span>Replay key <span class="mono">${record.replayKey}</span></span>
            </div>
          </article>
        `;
      }

      function renderTimeline() {
        const entry = currentCase();
        const timeline = document.querySelector("[data-testid='decision-timeline']");
        if (!entry) {
          timeline.innerHTML = "";
          return;
        }
        timeline.innerHTML = entry.timeline.map((step, index) => `
          <div
            class="timeline-step"
            data-testid="timeline-step-${entry.caseId}-${index}"
            data-selected="${String(index === entry.timeline.length - 1)}"
          >
            <strong>${step.replace(/_/g, " ")}</strong>
            <div>${entry.scenarioId}</div>
          </div>
        `).join("");
      }

      function renderInspector() {
        const record = currentRecord();
        const inspector = document.querySelector(".inspector-grid");
        if (!record) {
          inspector.innerHTML = "";
          return;
        }
        const review = state.manifest.replayCollisionReviews.find((entry) => entry.replayCollisionReviewId === record.collisionReviewRef);
        inspector.innerHTML = `
          <div class="inset">
            <dl>
              <dt>Idempotency Record</dt>
              <dd class="mono">${record.idempotencyRecordId}</dd>
              <dt>Decision</dt>
              <dd>${decisionLabel(record.decisionClass)}</dd>
              <dt>Accepted Action</dt>
              <dd class="mono">${record.firstAcceptedActionRecordRef}</dd>
              <dt>Accepted Settlement</dt>
              <dd class="mono">${record.acceptedSettlementRef}</dd>
              <dt>Replay Key</dt>
              <dd class="mono">${record.replayKey}</dd>
              <dt>Scope Fingerprint</dt>
              <dd class="mono">${record.scopeFingerprint}</dd>
            </dl>
          </div>
          <div class="inset">
            <h3 style="margin-top:0;">Collision Link</h3>
            <p>${review ? review.summary : "No active collision review."}</p>
            <div class="mono">${review ? review.replayCollisionReviewId : "clear"}</div>
          </div>
        `;
      }

      function renderCheckpoints() {
        const rows = currentCheckpoints();
        const table = document.querySelector("[data-testid='checkpoint-table']");
        if (rows.length === 0) {
          table.innerHTML = `
          <div class="checkpoint-row">
            <strong>No callback checkpoints yet</strong>
            <div>The selected replay chain has not recorded adapter receipt checkpoints.</div>
          </div>
        `;
          return;
        }
        table.innerHTML = rows.map((row) => `
          <div class="checkpoint-row" data-testid="checkpoint-row-${row.receiptCheckpointId}">
            <strong>${decisionLabel(row.decisionClass)}</strong>
            <div>${row.summary}</div>
            <div class="mono">${row.transportMessageId} • ${row.orderingKey}</div>
          </div>
        `).join("");
      }

      function renderValidators() {
        const rail = document.querySelector("[data-testid='validator-rail']");
        rail.innerHTML = state.manifest.validatorResults.map((row) => `
          <div class="validator-row" data-testid="validator-row-${row.validatorId}">
            <strong>${row.validatorId}</strong>
            <div>${row.summary}</div>
            <div>${row.verdict.toUpperCase()}</div>
          </div>
        `).join("");
      }

      function renderMatrix() {
        const table = document.querySelector("[data-testid='classification-matrix']");
        const current = currentRecord();
        table.innerHTML = state.matrix.map((row, index) => `
          <button
            type="button"
            class="matrix-row"
            data-testid="matrix-row-${row.record_ref}"
            data-selected="${String(current && row.record_ref === current.idempotencyRecordId)}"
          >
            <strong>${row.scenario_id}</strong>
            <div>${decisionLabel(row.decision_class)} • raw ${row.raw_hash_relation} • semantic ${row.semantic_hash_relation}</div>
          </button>
        `).join("");
        const rows = Array.from(table.querySelectorAll(".matrix-row"));
        rows.forEach((row, index) => {
          row.addEventListener("click", () => {
            state.selectedRecordId = state.matrix[index].record_ref;
            render();
          });
          row.addEventListener("keydown", (event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              const next = state.matrix[(index + 1) % state.matrix.length];
              state.selectedRecordId = next.record_ref;
              render();
              table.querySelector(`[data-testid="matrix-row-${next.record_ref}"]`)?.focus();
            }
          });
        });
      }

      function render() {
        renderMetrics();
        renderFilters();
        renderCards();
        renderDiffPane();
        renderTimeline();
        renderInspector();
        renderCheckpoints();
        renderValidators();
        renderMatrix();
      }

      async function load() {
        const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        document.body.dataset.reducedMotion = prefersReducedMotion ? "true" : "false";
        const [manifestResponse, casebookResponse, matrixResponse] = await Promise.all([
          fetch(MANIFEST_PATH),
          fetch(CASEBOOK_PATH),
          fetch(MATRIX_PATH),
        ]);
        state.manifest = await manifestResponse.json();
        state.casebook = await casebookResponse.json();
        state.matrix = parseCsv(await matrixResponse.text());
        state.selectedRecordId = state.manifest.idempotencyRecords[0]?.idempotencyRecordId ?? null;
        render();
      }

      load().catch((error) => {
        document.body.innerHTML = `<pre>${error instanceof Error ? error.message : String(error)}</pre>`;
      });
    </script>
  </body>
</html>
    """
    return (
        dedent(html)
        .replace("__MANIFEST_PATH__", "../../data/analysis/idempotency_record_manifest.json")
        .replace("__CASEBOOK_PATH__", "../../data/analysis/replay_collision_casebook.json")
        .replace("__MATRIX_PATH__", "../../data/analysis/replay_classification_matrix.csv")
    ).strip()


def main() -> None:
    manifest = build_manifest()
    casebook = {
        "task_id": TASK_ID,
        "generated_at": GENERATED_AT,
        "summary": {
            "replay_case_count": len(CASEBOOK),
            "blocked_case_count": sum(1 for row in CASEBOOK if row["blockedAutomaticMutation"]),
        },
        "replayCases": CASEBOOK,
    }

    write_json(MANIFEST_PATH, manifest)
    write_csv(MATRIX_PATH, MATRIX_ROWS)
    write_json(CASEBOOK_PATH, casebook)
    write_text(DESIGN_DOC_PATH, build_design_doc(manifest))
    write_text(ALGORITHM_DOC_PATH, build_algorithm_doc())
    write_text(STUDIO_PATH, build_studio_html())


if __name__ == "__main__":
    main()
