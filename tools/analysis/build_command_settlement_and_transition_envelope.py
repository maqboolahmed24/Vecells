#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path
from textwrap import dedent

from root_script_updates import ROOT_SCRIPT_UPDATES as SHARED_ROOT_SCRIPT_UPDATES


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"
TESTS_DIR = ROOT / "tests" / "playwright"
PACKAGE_SRC_DIR = ROOT / "packages" / "api-contracts" / "src"
PACKAGE_TESTS_DIR = ROOT / "packages" / "api-contracts" / "tests"
PACKAGE_SCHEMA_DIR = ROOT / "packages" / "api-contracts" / "schemas"

TASK_ID = "par_072"
VISUAL_MODE = "Settlement_Envelope_Atlas"
GENERATED_AT = "2026-04-12T00:00:00+00:00"

MANIFEST_PATH = DATA_DIR / "command_settlement_manifest.json"
MATRIX_PATH = DATA_DIR / "settlement_to_transition_matrix.csv"
CASEBOOK_PATH = DATA_DIR / "settlement_supersession_casebook.json"
DESIGN_DOC_PATH = DOCS_DIR / "72_command_settlement_and_transition_envelope_design.md"
RULES_DOC_PATH = DOCS_DIR / "72_settlement_dimension_mapping_rules.md"
ATLAS_PATH = DOCS_DIR / "72_settlement_envelope_atlas.html"
SPEC_PATH = TESTS_DIR / "settlement-envelope-atlas.spec.js"
VALIDATOR_PATH = ROOT / "tools" / "analysis" / "validate_settlement_envelope_library.py"
DOMAIN_SOURCE_PATH = (
    ROOT / "packages" / "domains" / "identity_access" / "src" / "command-settlement-backbone.ts"
)
SERVICE_SOURCE_PATH = ROOT / "services" / "command-api" / "src" / "command-settlement.ts"
MIGRATION_PATH = (
    ROOT
    / "services"
    / "command-api"
    / "migrations"
    / "072_command_settlement_and_transition_envelope_library.sql"
)
DOMAIN_TEST_PATH = (
    ROOT
    / "packages"
    / "domains"
    / "identity_access"
    / "tests"
    / "command-settlement-backbone.test.ts"
)
SERVICE_TEST_PATH = ROOT / "services" / "command-api" / "tests" / "command-settlement.integration.test.js"
PACKAGE_TRANSITION_SOURCE_PATH = PACKAGE_SRC_DIR / "transition-envelope.ts"
PACKAGE_INDEX_PATH = PACKAGE_SRC_DIR / "index.ts"
PACKAGE_PUBLIC_API_TEST_PATH = PACKAGE_TESTS_DIR / "public-api.test.ts"
PACKAGE_JSON_PATH = ROOT / "packages" / "api-contracts" / "package.json"
COMMAND_SETTLEMENT_SCHEMA_PATH = PACKAGE_SCHEMA_DIR / "command-settlement-record.schema.json"
TRANSITION_ENVELOPE_SCHEMA_PATH = PACKAGE_SCHEMA_DIR / "transition-envelope.schema.json"

INDEX_BLOCK_START = "// par_072_settlement_envelope_catalog:start"
INDEX_BLOCK_END = "// par_072_settlement_envelope_catalog:end"
EXPORT_BLOCK_START = "// par_072_transition_envelope_exports:start"
EXPORT_BLOCK_END = "// par_072_transition_envelope_exports:end"

SOURCE_PRECEDENCE = [
    "prompt/072.md",
    "prompt/shared_operating_contract_066_to_075.md",
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "blueprint/phase-0-the-foundation-protocol.md#1.23 CommandSettlementRecord",
    "blueprint/phase-0-the-foundation-protocol.md#1.9 TransitionEnvelope",
    "blueprint/platform-frontend-blueprint.md#4.4 Action dispatch, acknowledgement, projection follow-through, and route-local settlement",
    "blueprint/ux-quiet-clarity-redesign.md#PendingActionRetention",
    "blueprint/ux-quiet-clarity-redesign.md#QuietSettlementEnvelope",
    "blueprint/platform-runtime-and-release-blueprint.md#commandSettlementSchemaRef and transitionEnvelopeSchemaRef",
    "blueprint/forensic-audit-findings.md#Finding 91",
    "blueprint/forensic-audit-findings.md#Finding 97",
    "packages/domains/identity_access/src/command-settlement-backbone.ts",
    "packages/api-contracts/src/transition-envelope.ts",
    "services/command-api/src/command-settlement.ts",
]

SETTLEMENT_ROWS = [
    {
        "scenario_id": "local_ack_then_settled_success",
        "settlement_id": "CSR_072_LOCAL_ACK_PENDING_V1",
        "action_record_ref": "CAR_072_LOCAL_ACK",
        "local_ack_state": "local_ack",
        "result": "pending",
        "processing_acceptance_state": "accepted_for_processing",
        "external_observation_state": "unobserved",
        "authoritative_outcome_state": "pending",
        "envelope_outcome_state": "pending",
        "authoritative_proof_class": "not_yet_authoritative",
        "same_shell_recovery_ref": "",
        "quiet_eligible_at": "",
        "stale_after_at": "2026-04-12T12:02:20Z",
        "last_safe_anchor_ref": "anchor_task_072_local_ack",
        "allowed_summary_tier": "",
        "supersedes_settlement_ref": "",
        "recorded_at": "2026-04-12T12:01:20Z",
        "headline": "Local acknowledgement is visible, but the shell stays pending.",
    },
    {
        "scenario_id": "local_ack_then_settled_success",
        "settlement_id": "CSR_072_LOCAL_ACK_SETTLED_V2",
        "action_record_ref": "CAR_072_LOCAL_ACK",
        "local_ack_state": "local_ack",
        "result": "applied",
        "processing_acceptance_state": "externally_accepted",
        "external_observation_state": "external_effect_observed",
        "authoritative_outcome_state": "settled",
        "envelope_outcome_state": "settled",
        "authoritative_proof_class": "external_confirmation",
        "same_shell_recovery_ref": "",
        "quiet_eligible_at": "2026-04-12T12:01:42Z",
        "stale_after_at": "",
        "last_safe_anchor_ref": "anchor_task_072_local_ack",
        "allowed_summary_tier": "full_summary",
        "supersedes_settlement_ref": "CSR_072_LOCAL_ACK_PENDING_V1",
        "recorded_at": "2026-04-12T12:01:40Z",
        "headline": "Authoritative confirmation lands and calm return becomes legal.",
    },
    {
        "scenario_id": "accepted_for_processing_pending_external_confirmation",
        "settlement_id": "CSR_072_EXTERNAL_PENDING_V1",
        "action_record_ref": "CAR_072_EXTERNAL_PENDING",
        "local_ack_state": "local_ack",
        "result": "awaiting_external",
        "processing_acceptance_state": "awaiting_external_confirmation",
        "external_observation_state": "unobserved",
        "authoritative_outcome_state": "pending",
        "envelope_outcome_state": "pending",
        "authoritative_proof_class": "not_yet_authoritative",
        "same_shell_recovery_ref": "",
        "quiet_eligible_at": "",
        "stale_after_at": "2026-04-12T12:05:10Z",
        "last_safe_anchor_ref": "anchor_task_072_processing_pending",
        "allowed_summary_tier": "",
        "supersedes_settlement_ref": "",
        "recorded_at": "2026-04-12T12:03:10Z",
        "headline": "Accepted-for-processing is distinct from authoritative completion.",
    },
    {
        "scenario_id": "projection_visible_not_authoritative_success",
        "settlement_id": "CSR_072_PROJECTION_VISIBLE_V1",
        "action_record_ref": "CAR_072_PROJECTION_VISIBLE",
        "local_ack_state": "optimistic_applied",
        "result": "projection_pending",
        "processing_acceptance_state": "accepted_for_processing",
        "external_observation_state": "projection_visible",
        "authoritative_outcome_state": "pending",
        "envelope_outcome_state": "pending",
        "authoritative_proof_class": "not_yet_authoritative",
        "same_shell_recovery_ref": "",
        "quiet_eligible_at": "",
        "stale_after_at": "2026-04-12T12:06:10Z",
        "last_safe_anchor_ref": "anchor_task_072_projection_visible",
        "allowed_summary_tier": "",
        "supersedes_settlement_ref": "",
        "recorded_at": "2026-04-12T12:04:10Z",
        "headline": "Projection visibility informs the shell, but it does not quiet the chain.",
    },
    {
        "scenario_id": "review_required_outcome",
        "settlement_id": "CSR_072_REVIEW_REQUIRED_V1",
        "action_record_ref": "CAR_072_REVIEW_REQUIRED",
        "local_ack_state": "local_ack",
        "result": "review_required",
        "processing_acceptance_state": "externally_accepted",
        "external_observation_state": "disputed",
        "authoritative_outcome_state": "review_required",
        "envelope_outcome_state": "review_required",
        "authoritative_proof_class": "review_disposition",
        "same_shell_recovery_ref": "",
        "quiet_eligible_at": "",
        "stale_after_at": "2026-04-12T12:07:10Z",
        "last_safe_anchor_ref": "anchor_task_072_review_required",
        "allowed_summary_tier": "",
        "supersedes_settlement_ref": "",
        "recorded_at": "2026-04-12T12:05:10Z",
        "headline": "Conflicting evidence must hold the shell in diff-first review posture.",
    },
    {
        "scenario_id": "stale_recoverable_due_to_tuple_drift",
        "settlement_id": "CSR_072_STALE_RECOVERABLE_V1",
        "action_record_ref": "CAR_072_STALE_RECOVERABLE",
        "local_ack_state": "superseded",
        "result": "stale_recoverable",
        "processing_acceptance_state": "not_started",
        "external_observation_state": "recovery_observed",
        "authoritative_outcome_state": "recovery_required",
        "envelope_outcome_state": "recovery_required",
        "authoritative_proof_class": "recovery_disposition",
        "same_shell_recovery_ref": "/recover/task_072_stale_recoverable",
        "quiet_eligible_at": "",
        "stale_after_at": "2026-04-12T12:08:40Z",
        "last_safe_anchor_ref": "anchor_task_072_stale_recoverable",
        "allowed_summary_tier": "summary_only",
        "supersedes_settlement_ref": "",
        "recorded_at": "2026-04-12T12:06:40Z",
        "headline": "Tuple drift keeps the original chain recoverable in place.",
    },
    {
        "scenario_id": "blocked_policy_and_denied_scope_recovery",
        "settlement_id": "CSR_072_BLOCKED_POLICY_V1",
        "action_record_ref": "CAR_072_BLOCKED_POLICY",
        "local_ack_state": "queued",
        "result": "blocked_policy",
        "processing_acceptance_state": "not_started",
        "external_observation_state": "recovery_observed",
        "authoritative_outcome_state": "recovery_required",
        "envelope_outcome_state": "recovery_required",
        "authoritative_proof_class": "recovery_disposition",
        "same_shell_recovery_ref": "/recover/policy/072_blocked_policy",
        "quiet_eligible_at": "",
        "stale_after_at": "2026-04-12T12:09:10Z",
        "last_safe_anchor_ref": "anchor_task_072_blocked_policy",
        "allowed_summary_tier": "summary_only",
        "supersedes_settlement_ref": "",
        "recorded_at": "2026-04-12T12:07:10Z",
        "headline": "Policy blocks must degrade in place instead of throwing detached failure.",
    },
    {
        "scenario_id": "blocked_policy_and_denied_scope_recovery",
        "settlement_id": "CSR_072_DENIED_SCOPE_V1",
        "action_record_ref": "CAR_072_DENIED_SCOPE",
        "local_ack_state": "queued",
        "result": "denied_scope",
        "processing_acceptance_state": "not_started",
        "external_observation_state": "recovery_observed",
        "authoritative_outcome_state": "recovery_required",
        "envelope_outcome_state": "recovery_required",
        "authoritative_proof_class": "recovery_disposition",
        "same_shell_recovery_ref": "/recover/scope/072_denied_scope",
        "quiet_eligible_at": "",
        "stale_after_at": "2026-04-12T12:09:20Z",
        "last_safe_anchor_ref": "anchor_task_072_denied_scope",
        "allowed_summary_tier": "summary_only",
        "supersedes_settlement_ref": "",
        "recorded_at": "2026-04-12T12:07:20Z",
        "headline": "Scope denial keeps the shell recoverable with the last safe anchor preserved.",
    },
    {
        "scenario_id": "settlement_superseded_by_later_evidence",
        "settlement_id": "CSR_072_LATER_EVIDENCE_PENDING_V1",
        "action_record_ref": "CAR_072_LATER_EVIDENCE",
        "local_ack_state": "local_ack",
        "result": "awaiting_external",
        "processing_acceptance_state": "awaiting_external_confirmation",
        "external_observation_state": "unobserved",
        "authoritative_outcome_state": "pending",
        "envelope_outcome_state": "pending",
        "authoritative_proof_class": "not_yet_authoritative",
        "same_shell_recovery_ref": "",
        "quiet_eligible_at": "",
        "stale_after_at": "2026-04-12T12:10:10Z",
        "last_safe_anchor_ref": "anchor_task_072_superseded_evidence",
        "allowed_summary_tier": "",
        "supersedes_settlement_ref": "",
        "recorded_at": "2026-04-12T12:08:10Z",
        "headline": "The initial revision stays pending while later evidence catches up.",
    },
    {
        "scenario_id": "settlement_superseded_by_later_evidence",
        "settlement_id": "CSR_072_LATER_EVIDENCE_SETTLED_V2",
        "action_record_ref": "CAR_072_LATER_EVIDENCE",
        "local_ack_state": "local_ack",
        "result": "applied",
        "processing_acceptance_state": "externally_accepted",
        "external_observation_state": "projection_visible",
        "authoritative_outcome_state": "settled",
        "envelope_outcome_state": "settled",
        "authoritative_proof_class": "projection_visible",
        "same_shell_recovery_ref": "",
        "quiet_eligible_at": "2026-04-12T12:08:42Z",
        "stale_after_at": "",
        "last_safe_anchor_ref": "anchor_task_072_superseded_evidence",
        "allowed_summary_tier": "full_summary",
        "supersedes_settlement_ref": "CSR_072_LATER_EVIDENCE_PENDING_V1",
        "recorded_at": "2026-04-12T12:08:40Z",
        "headline": "Later evidence supersedes pending state without creating a competing chain.",
    },
]

VALIDATORS = [
    {
        "validator_id": "VAL_072_FOUR_DIMENSIONS_REMAIN_DISTINCT",
        "description": "Local ack, processing acceptance, external observation, and authoritative outcome may not collapse into one success token.",
        "status": "pass",
    },
    {
        "validator_id": "VAL_072_CALM_SUCCESS_REQUIRES_PROOF",
        "description": "Settled envelopes require authoritative proof, quietEligibleAt, and audit linkage.",
        "status": "pass",
    },
    {
        "validator_id": "VAL_072_RECOVERABLE_RESULTS_KEEP_SAME_SHELL_RECOVERY",
        "description": "Recoverable results preserve same-shell recovery ref, last safe anchor, and allowed summary tier.",
        "status": "pass",
    },
    {
        "validator_id": "VAL_072_SUPERSESSION_IS_MONOTONE",
        "description": "Later evidence may supersede prior revisions, but it may not create a competing chain head.",
        "status": "pass",
    },
    {
        "validator_id": "VAL_072_PROJECTION_VISIBLE_IS_NOT_FINAL",
        "description": "Projection visibility may widen truth, but it may not quiet the shell by itself.",
        "status": "pass",
    },
    {
        "validator_id": "VAL_072_STALE_DRIFT_REQUIRES_NEW_ACTION_CHAIN",
        "description": "Tuple drift must open recovery and a new action record instead of appending success to the old chain.",
        "status": "pass",
    },
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


def replace_block(source: str, start: str, end: str, block: str) -> str:
    replacement = f"{start}\n{block.rstrip()}\n{end}"
    if start in source and end in source:
        before, remainder = source.split(start, 1)
        _, after = remainder.split(end, 1)
        return before + replacement + after
    return source.rstrip() + "\n\n" + replacement + "\n"


def patch_package_index() -> None:
    source = PACKAGE_INDEX_PATH.read_text(encoding="utf-8")
    export_block = 'export * from "./transition-envelope";'
    source = replace_block(source, EXPORT_BLOCK_START, EXPORT_BLOCK_END, export_block)
    block = dedent(
        """
        export const commandSettlementEnvelopeCatalog = {
          taskId: "par_072",
          visualMode: "Settlement_Envelope_Atlas",
          scenarioCount: 7,
          settlementRevisionCount: 10,
          recoveryRequiredCount: 3,
          settledCount: 2,
          schemaArtifactPaths: [
            "packages/api-contracts/schemas/command-settlement-record.schema.json",
            "packages/api-contracts/schemas/transition-envelope.schema.json",
          ],
        } as const;

        export const commandSettlementEnvelopeSchemas = [
          {
            schemaId: "CommandSettlementRecord",
            artifactPath: "packages/api-contracts/schemas/command-settlement-record.schema.json",
            generatedByTask: "par_072",
          },
          {
            schemaId: "TransitionEnvelope",
            artifactPath: "packages/api-contracts/schemas/transition-envelope.schema.json",
            generatedByTask: "par_072",
          },
        ] as const;
        """
    ).strip()
    source = replace_block(source, INDEX_BLOCK_START, INDEX_BLOCK_END, block)
    write_text(PACKAGE_INDEX_PATH, source)


def patch_public_api_test() -> None:
    source = PACKAGE_PUBLIC_API_TEST_PATH.read_text(encoding="utf-8")
    import_anchor = "  scopedMutationGateCatalog,\n  scopedMutationGateSchemas,\n"
    if "commandSettlementEnvelopeCatalog" not in source:
        source = source.replace(
            import_anchor,
            import_anchor
            + "  commandSettlementEnvelopeCatalog,\n  commandSettlementEnvelopeSchemas,\n",
        )
    test_anchor = dedent(
        """
          it("publishes the seq_060 recovery posture schema surface", () => {
        """
    ).strip()
    test_block = dedent(
        """
          it("publishes the par_072 settlement and envelope schema surface", () => {
            expect(commandSettlementEnvelopeCatalog.taskId).toBe("par_072");
            expect(commandSettlementEnvelopeCatalog.scenarioCount).toBe(7);
            expect(commandSettlementEnvelopeCatalog.settlementRevisionCount).toBe(10);
            expect(commandSettlementEnvelopeSchemas).toHaveLength(2);

            for (const schema of commandSettlementEnvelopeSchemas) {
              const schemaPath = path.join(ROOT, schema.artifactPath);
              expect(fs.existsSync(schemaPath)).toBe(true);
            }
          });

        """
    ).rstrip()
    if "publishes the par_072 settlement and envelope schema surface" not in source:
        source = source.replace(test_anchor, test_block + "\n" + test_anchor)
    write_text(PACKAGE_PUBLIC_API_TEST_PATH, source)


def patch_package_json() -> None:
    payload = json.loads(PACKAGE_JSON_PATH.read_text(encoding="utf-8"))
    exports = payload.setdefault("exports", {})
    exports["./schemas/transition-envelope.schema.json"] = (
        "./schemas/transition-envelope.schema.json"
    )
    write_json(PACKAGE_JSON_PATH, payload)


def build_command_settlement_schema() -> dict[str, object]:
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://vecells.local/schemas/command-settlement-record.schema.json",
        "task_id": TASK_ID,
        "title": "CommandSettlementRecord",
        "description": "Immutable authoritative settlement revision for one command action chain.",
        "type": "object",
        "required": [
            "settlementId",
            "actionRecordRef",
            "replayDecisionClass",
            "result",
            "processingAcceptanceState",
            "externalObservationState",
            "authoritativeOutcomeState",
            "authoritativeProofClass",
            "settlementRevision",
            "blockingRefs",
            "recordedAt",
        ],
        "properties": {
            "settlementId": {"type": "string"},
            "actionRecordRef": {"type": "string"},
            "replayDecisionClass": {
                "type": "string",
                "enum": [
                    "exact_replay",
                    "semantic_replay",
                    "distinct",
                    "collision_review",
                ],
            },
            "result": {
                "type": "string",
                "enum": [
                    "pending",
                    "applied",
                    "projection_pending",
                    "awaiting_external",
                    "stale_recoverable",
                    "blocked_policy",
                    "denied_scope",
                    "review_required",
                    "reconciliation_required",
                    "failed",
                    "expired",
                ],
            },
            "processingAcceptanceState": {
                "type": "string",
                "enum": [
                    "not_started",
                    "accepted_for_processing",
                    "awaiting_external_confirmation",
                    "externally_accepted",
                    "externally_rejected",
                    "timed_out",
                ],
            },
            "externalObservationState": {
                "type": "string",
                "enum": [
                    "unobserved",
                    "projection_visible",
                    "external_effect_observed",
                    "review_disposition_observed",
                    "recovery_observed",
                    "disputed",
                    "failed",
                    "expired",
                ],
            },
            "authoritativeOutcomeState": {
                "type": "string",
                "enum": [
                    "pending",
                    "projection_pending",
                    "awaiting_external",
                    "review_required",
                    "stale_recoverable",
                    "recovery_required",
                    "reconciliation_required",
                    "settled",
                    "failed",
                    "expired",
                    "superseded",
                ],
            },
            "authoritativeProofClass": {
                "type": "string",
                "enum": [
                    "not_yet_authoritative",
                    "projection_visible",
                    "external_confirmation",
                    "review_disposition",
                    "recovery_disposition",
                ],
            },
            "settlementRevision": {"type": "integer", "minimum": 1},
            "supersedesSettlementRef": {"type": ["string", "null"]},
            "externalEffectRefs": {
                "type": "array",
                "items": {"type": "string"},
                "uniqueItems": True,
            },
            "sameShellRecoveryRef": {"type": ["string", "null"]},
            "projectionVersionRef": {"type": ["string", "null"]},
            "uiTransitionSettlementRef": {"type": ["string", "null"]},
            "projectionVisibilityRef": {"type": ["string", "null"]},
            "auditRecordRef": {"type": ["string", "null"]},
            "blockingRefs": {
                "type": "array",
                "items": {"type": "string"},
                "uniqueItems": True,
            },
            "quietEligibleAt": {"type": ["string", "null"], "format": "date-time"},
            "staleAfterAt": {"type": ["string", "null"], "format": "date-time"},
            "lastSafeAnchorRef": {"type": ["string", "null"]},
            "allowedSummaryTier": {"type": ["string", "null"]},
            "recordedAt": {"type": "string", "format": "date-time"},
        },
        "examples": [
            {
                "settlementId": "CSR_072_LOCAL_ACK_SETTLED_V2",
                "actionRecordRef": "CAR_072_LOCAL_ACK",
                "replayDecisionClass": "distinct",
                "result": "applied",
                "processingAcceptanceState": "externally_accepted",
                "externalObservationState": "external_effect_observed",
                "authoritativeOutcomeState": "settled",
                "authoritativeProofClass": "external_confirmation",
                "settlementRevision": 2,
                "supersedesSettlementRef": "CSR_072_LOCAL_ACK_PENDING_V1",
                "externalEffectRefs": ["bookingTxn://072_local_ack"],
                "sameShellRecoveryRef": None,
                "projectionVersionRef": None,
                "uiTransitionSettlementRef": None,
                "projectionVisibilityRef": None,
                "auditRecordRef": "audit://072_local_ack",
                "blockingRefs": [],
                "quietEligibleAt": "2026-04-12T12:01:42Z",
                "staleAfterAt": None,
                "lastSafeAnchorRef": "anchor_task_072_local_ack",
                "allowedSummaryTier": "full_summary",
                "recordedAt": "2026-04-12T12:01:40Z",
            },
            {
                "settlementId": "CSR_072_STALE_RECOVERABLE_V1",
                "actionRecordRef": "CAR_072_STALE_RECOVERABLE",
                "replayDecisionClass": "distinct",
                "result": "stale_recoverable",
                "processingAcceptanceState": "not_started",
                "externalObservationState": "recovery_observed",
                "authoritativeOutcomeState": "stale_recoverable",
                "authoritativeProofClass": "recovery_disposition",
                "settlementRevision": 1,
                "supersedesSettlementRef": None,
                "externalEffectRefs": [],
                "sameShellRecoveryRef": "/recover/task_072_stale_recoverable",
                "projectionVersionRef": None,
                "uiTransitionSettlementRef": None,
                "projectionVisibilityRef": None,
                "auditRecordRef": "audit://072_stale_recoverable",
                "blockingRefs": [],
                "quietEligibleAt": None,
                "staleAfterAt": "2026-04-12T12:08:40Z",
                "lastSafeAnchorRef": "anchor_task_072_stale_recoverable",
                "allowedSummaryTier": "summary_only",
                "recordedAt": "2026-04-12T12:06:40Z",
            },
        ],
    }


def build_transition_envelope_schema() -> dict[str, object]:
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://vecells.local/schemas/transition-envelope.schema.json",
        "task_id": TASK_ID,
        "title": "TransitionEnvelope",
        "description": "Same-shell transition bridge for asynchronous command truth.",
        "type": "object",
        "required": [
            "transitionId",
            "entityRef",
            "commandRef",
            "commandSettlementRef",
            "originState",
            "targetIntent",
            "localAckState",
            "processingAcceptanceState",
            "externalObservationState",
            "authoritativeOutcomeState",
            "causalToken",
            "settlementRevisionRef",
            "settlementPolicy",
            "userVisibleMessage",
            "visibleScope",
            "startedAt",
            "updatedAt",
            "invalidateOnConflict",
        ],
        "properties": {
            "transitionId": {"type": "string"},
            "entityRef": {"type": "string"},
            "commandRef": {"type": "string"},
            "commandSettlementRef": {"type": "string"},
            "affectedAnchorRef": {"type": ["string", "null"]},
            "originState": {"type": "string"},
            "targetIntent": {"type": "string"},
            "localAckState": {
                "type": "string",
                "enum": ["queued", "local_ack", "optimistic_applied", "superseded"],
            },
            "processingAcceptanceState": {
                "type": "string",
                "enum": [
                    "not_sent",
                    "accepted_for_processing",
                    "awaiting_external_confirmation",
                    "externally_accepted",
                    "externally_rejected",
                    "timed_out",
                ],
            },
            "externalObservationState": {
                "type": "string",
                "enum": [
                    "unobserved",
                    "projection_visible",
                    "external_effect_observed",
                    "review_disposition_observed",
                    "recovery_observed",
                    "disputed",
                    "failed",
                    "expired",
                ],
            },
            "authoritativeOutcomeState": {
                "type": "string",
                "enum": [
                    "pending",
                    "review_required",
                    "recovery_required",
                    "reconciliation_required",
                    "settled",
                    "reverted",
                    "failed",
                    "expired",
                ],
            },
            "causalToken": {"type": "string"},
            "settlementRevisionRef": {"type": "string"},
            "settlementPolicy": {
                "type": "string",
                "enum": ["projection_token", "external_ack", "manual_review"],
            },
            "userVisibleMessage": {"type": "string"},
            "visibleScope": {
                "type": "string",
                "enum": ["local_component", "active_card", "active_shell"],
            },
            "startedAt": {"type": "string", "format": "date-time"},
            "updatedAt": {"type": "string", "format": "date-time"},
            "failureReason": {"type": ["string", "null"]},
            "recoveryActionRef": {"type": ["string", "null"]},
            "invalidateOnConflict": {"type": "boolean"},
            "lastSafeAnchorRef": {"type": ["string", "null"]},
            "allowedSummaryTier": {"type": ["string", "null"]},
            "quietEligibleAt": {"type": ["string", "null"], "format": "date-time"},
            "staleAfterAt": {"type": ["string", "null"], "format": "date-time"},
        },
        "examples": [
            {
                "transitionId": "TE_072_LOCAL_ACK_SETTLED_V2",
                "entityRef": "task_072_local_ack",
                "commandRef": "CAR_072_LOCAL_ACK",
                "commandSettlementRef": "CSR_072_LOCAL_ACK_SETTLED_V2",
                "affectedAnchorRef": "anchor_task_072_local_ack",
                "originState": "task_claim",
                "targetIntent": "quiet_return",
                "localAckState": "local_ack",
                "processingAcceptanceState": "externally_accepted",
                "externalObservationState": "external_effect_observed",
                "authoritativeOutcomeState": "settled",
                "causalToken": "cause_072_local_ack",
                "settlementRevisionRef": "CSR_072_LOCAL_ACK_SETTLED_V2",
                "settlementPolicy": "external_ack",
                "userVisibleMessage": "Authoritative settlement confirmed.",
                "visibleScope": "active_shell",
                "startedAt": "2026-04-12T12:01:10Z",
                "updatedAt": "2026-04-12T12:01:40Z",
                "failureReason": None,
                "recoveryActionRef": None,
                "invalidateOnConflict": False,
                "lastSafeAnchorRef": "anchor_task_072_local_ack",
                "allowedSummaryTier": "full_summary",
                "quietEligibleAt": "2026-04-12T12:01:42Z",
                "staleAfterAt": None,
            },
            {
                "transitionId": "TE_072_STALE_RECOVERABLE_V1",
                "entityRef": "task_072_stale_recoverable",
                "commandRef": "CAR_072_STALE_RECOVERABLE",
                "commandSettlementRef": "CSR_072_STALE_RECOVERABLE_V1",
                "affectedAnchorRef": "anchor_task_072_stale_recoverable",
                "originState": "task_claim",
                "targetIntent": "reacquire_and_retry",
                "localAckState": "superseded",
                "processingAcceptanceState": "not_sent",
                "externalObservationState": "recovery_observed",
                "authoritativeOutcomeState": "recovery_required",
                "causalToken": "cause_072_stale_recoverable",
                "settlementRevisionRef": "CSR_072_STALE_RECOVERABLE_V1",
                "settlementPolicy": "manual_review",
                "userVisibleMessage": "Recovery is required in the current shell before mutation can continue.",
                "visibleScope": "active_shell",
                "startedAt": "2026-04-12T12:06:05Z",
                "updatedAt": "2026-04-12T12:06:40Z",
                "failureReason": None,
                "recoveryActionRef": "/recover/task_072_stale_recoverable",
                "invalidateOnConflict": False,
                "lastSafeAnchorRef": "anchor_task_072_stale_recoverable",
                "allowedSummaryTier": "summary_only",
                "quietEligibleAt": None,
                "staleAfterAt": "2026-04-12T12:08:40Z",
            },
        ],
    }


def build_manifest() -> dict[str, object]:
    return {
        "generated_at": GENERATED_AT,
        "task_id": TASK_ID,
        "visual_mode": VISUAL_MODE,
        "summary": {
            "scenario_count": 7,
            "settlement_revision_count": 10,
            "transition_envelope_count": 10,
            "settled_count": 2,
            "pending_count": 4,
            "review_required_count": 1,
            "recovery_required_count": 3,
            "validator_count": len(VALIDATORS),
        },
        "source_precedence": SOURCE_PRECEDENCE,
        "validators": VALIDATORS,
        "settlements": SETTLEMENT_ROWS,
    }


def build_casebook() -> dict[str, object]:
    cases = [
        {
            "scenarioId": "local_ack_then_settled_success",
            "selectedSettlementRef": "CSR_072_LOCAL_ACK_SETTLED_V2",
            "headline": "Local acknowledgement stays visible until authoritative settlement lands.",
            "operatorPosture": "keep one chain; do not treat local acknowledgement as calm success",
        },
        {
            "scenarioId": "accepted_for_processing_pending_external_confirmation",
            "selectedSettlementRef": "CSR_072_EXTERNAL_PENDING_V1",
            "headline": "Accepted-for-processing remains pending and same-shell.",
            "operatorPosture": "hold the anchor and wait for external confirmation",
        },
        {
            "scenarioId": "projection_visible_not_authoritative_success",
            "selectedSettlementRef": "CSR_072_PROJECTION_VISIBLE_V1",
            "headline": "Projection-visible truth still cannot quiet the shell.",
            "operatorPosture": "show projection visibility but preserve pending posture",
        },
        {
            "scenarioId": "review_required_outcome",
            "selectedSettlementRef": "CSR_072_REVIEW_REQUIRED_V1",
            "headline": "Review-required outcomes keep continuity while the user re-checks.",
            "operatorPosture": "block unsafe follow-up actions until review clears",
        },
        {
            "scenarioId": "stale_recoverable_due_to_tuple_drift",
            "selectedSettlementRef": "CSR_072_STALE_RECOVERABLE_V1",
            "headline": "Tuple drift degrades to recovery instead of silently settling the stale chain.",
            "operatorPosture": "open a new action chain; keep the old one recoverable",
        },
        {
            "scenarioId": "blocked_policy_and_denied_scope_recovery",
            "selectedSettlementRef": "CSR_072_DENIED_SCOPE_V1",
            "headline": "Policy and scope blocks must preserve the last safe anchor and summary tier.",
            "operatorPosture": "recover in place with the governing limitation explained",
        },
        {
            "scenarioId": "settlement_superseded_by_later_evidence",
            "selectedSettlementRef": "CSR_072_LATER_EVIDENCE_SETTLED_V2",
            "headline": "Later evidence supersedes pending state without creating a second success chain.",
            "operatorPosture": "append monotone revisions only",
        },
    ]
    return {
        "generated_at": GENERATED_AT,
        "summary": {
            "case_count": len(cases),
            "recovery_case_count": 3,
            "settled_case_count": 2,
        },
        "cases": cases,
    }


def build_design_doc(manifest: dict[str, object]) -> str:
    return dedent(
        f"""
        # 72 Command Settlement And Transition Envelope Design

        `par_072` adds the authoritative mutation-settlement substrate and the same-shell transition-envelope library that later patient, staff, support, ops, and governance shells will consume.

        ## Core law

        `CommandSettlementRecord` is the authoritative mutation outcome substrate.
        `TransitionEnvelope` is the required same-shell bridge for meaningful asynchronous action.
        The four dimensions remain distinct: local acknowledgement, processing acceptance, external observation, and authoritative outcome.

        ## Frozen surface

        - Settlement revisions: `{manifest["summary"]["settlement_revision_count"]}`
        - Transition envelopes: `{manifest["summary"]["transition_envelope_count"]}`
        - Scenarios: `{manifest["summary"]["scenario_count"]}`
        - Recovery-required revisions: `{manifest["summary"]["recovery_required_count"]}`

        ## Implementation notes

        - Immutable settlement revisions supersede through `supersedesSettlementRef`.
        - Calm success requires authoritative proof, `quietEligibleAt`, and audit linkage.
        - Recoverable outcomes preserve `sameShellRecoveryRef`, `lastSafeAnchorRef`, and `allowedSummaryTier`.
        - Projection visibility or accepted-for-processing may inform the shell, but they may not quiet it.
        """
    ).strip()


def build_rules_doc() -> str:
    return dedent(
        """
        # 72 Settlement Dimension Mapping Rules

        ## Mapping law

        - `localAckState` is UI-local and never implies authoritative settlement.
        - `processingAcceptanceState` may widen pending guidance, but it cannot authorize calm success.
        - `externalObservationState` may widen truth, but it cannot quiet the shell by itself.
        - `authoritativeOutcomeState` is the only dimension that can authorize settled calm posture.

        ## Recovery law

        - `stale_recoverable`, `blocked_policy`, `denied_scope`, and other recovery-required outcomes must publish one same-shell recovery ref.
        - Recoverable envelopes preserve the last safe anchor and the allowed summary tier.
        - Detached success or error pages are forbidden substitutes for same-shell recovery.

        ## Supersession law

        - Later evidence may append a new settlement revision for the same action chain.
        - A later revision must point to `supersedesSettlementRef` and may not create a competing head.
        - Tuple drift requires a new action chain; later success may not be folded into the stale one.

        ## Simulator contract

        The seeded simulator must keep the canonical seven scenarios available:

        1. local acknowledgement followed by settled success
        2. accepted-for-processing followed by pending external confirmation
        3. projection-visible but not yet authoritative success
        4. review-required outcome
        5. stale-recoverable tuple drift
        6. blocked-policy and denied-scope recovery
        7. later evidence superseding a prior pending revision
        """
    ).strip()


def build_atlas_html() -> str:
    manifest_rel = "../../data/analysis/command_settlement_manifest.json"
    matrix_rel = "../../data/analysis/settlement_to_transition_matrix.csv"
    casebook_rel = "../../data/analysis/settlement_supersession_casebook.json"
    return dedent(
        f"""
        <!doctype html>
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>Settlement Envelope Atlas</title>
            <style>
              :root {{
                --canvas: #F7F9FC;
                --panel: #FFFFFF;
                --rail: #EEF2F8;
                --inset: #F4F6FB;
                --text-strong: #0F172A;
                --text-default: #1E293B;
                --text-muted: #667085;
                --border: #E2E8F0;
                --settlement: #3559E6;
                --pending: #0EA5A4;
                --recovery: #7C3AED;
                --warning: #C98900;
                --blocked: #C24141;
              }}
              * {{ box-sizing: border-box; }}
              body {{
                margin: 0;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                background: var(--canvas);
                color: var(--text-default);
              }}
              body[data-reduced-motion="true"] * {{ transition: none !important; animation: none !important; }}
              header {{
                height: 72px;
                display: grid;
                grid-template-columns: 1fr auto;
                gap: 20px;
                align-items: center;
                padding: 0 24px;
                border-bottom: 1px solid var(--border);
                background: rgba(255,255,255,0.86);
                backdrop-filter: blur(14px);
                position: sticky;
                top: 0;
                z-index: 10;
              }}
              .brand {{
                display: inline-flex;
                gap: 12px;
                align-items: center;
                font-weight: 700;
                color: var(--text-strong);
              }}
              .brand svg {{
                width: 34px;
                height: 34px;
                border-radius: 12px;
                background: linear-gradient(140deg, var(--settlement), #1D4ED8);
                color: white;
                padding: 8px;
              }}
              .masthead-metrics {{
                display: flex;
                gap: 12px;
                flex-wrap: wrap;
                justify-content: flex-end;
              }}
              .metric {{
                border: 1px solid var(--border);
                background: var(--panel);
                border-radius: 14px;
                padding: 10px 14px;
                min-width: 118px;
              }}
              .metric strong {{ display: block; color: var(--text-strong); }}
              main {{
                max-width: 1500px;
                margin: 0 auto;
                padding: 20px;
                display: grid;
                grid-template-columns: 300px minmax(0, 1fr) 410px;
                gap: 18px;
              }}
              aside, section, .panel {{
                background: var(--panel);
                border: 1px solid var(--border);
                border-radius: 20px;
              }}
              aside {{
                padding: 18px;
                height: fit-content;
                position: sticky;
                top: 92px;
              }}
              .filter-group {{ display: grid; gap: 12px; margin-bottom: 16px; }}
              label {{ display: grid; gap: 6px; font-size: 13px; color: var(--text-muted); }}
              select {{
                height: 44px;
                border-radius: 12px;
                border: 1px solid var(--border);
                background: var(--inset);
                padding: 0 12px;
                color: var(--text-strong);
              }}
              .canvas {{ display: grid; gap: 18px; }}
              .quadrant, .rail, .grid-panel, .table-panel {{
                padding: 18px;
              }}
              .quadrant {{ min-height: 250px; }}
              .quad-grid {{
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 12px;
                margin-top: 14px;
              }}
              .quad-cell {{
                border-radius: 16px;
                border: 1px solid var(--border);
                background: var(--inset);
                padding: 16px;
              }}
              .quad-cell strong {{ display: block; font-size: 24px; color: var(--text-strong); }}
              .rail {{
                min-height: 180px;
                background: linear-gradient(180deg, rgba(53, 89, 230, 0.08), transparent);
              }}
              .rail-items {{
                display: grid;
                gap: 8px;
                margin-top: 14px;
              }}
              .rail-item {{
                display: grid;
                grid-template-columns: auto 1fr auto;
                gap: 10px;
                align-items: center;
                padding: 10px 12px;
                border-radius: 14px;
                border: 1px solid var(--border);
                background: var(--panel);
                font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
                font-size: 12px;
              }}
              .cards {{
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
                gap: 12px;
              }}
              .card {{
                min-height: 170px;
                border-radius: 18px;
                border: 1px solid var(--border);
                background: var(--panel);
                padding: 16px;
                text-align: left;
                cursor: pointer;
                transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
              }}
              .card[data-selected="true"] {{
                border-color: var(--settlement);
                box-shadow: 0 18px 40px rgba(53, 89, 230, 0.12);
                transform: translateY(-2px);
              }}
              .card code, .mono {{
                font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
              }}
              .inspector {{
                padding: 18px;
                position: sticky;
                top: 92px;
                height: fit-content;
                transition: transform 220ms ease;
              }}
              .key-value {{
                display: grid;
                grid-template-columns: 140px 1fr;
                gap: 10px;
                padding: 8px 0;
                border-bottom: 1px solid var(--border);
                font-size: 13px;
              }}
              .lower {{
                grid-column: 2 / 4;
                display: grid;
                grid-template-columns: minmax(0, 1fr) minmax(0, 360px);
                gap: 18px;
              }}
              table {{
                width: 100%;
                border-collapse: collapse;
                font-size: 13px;
              }}
              th, td {{
                padding: 10px 12px;
                border-bottom: 1px solid var(--border);
                text-align: left;
                vertical-align: top;
              }}
              tr[data-selected="true"] {{
                background: rgba(53, 89, 230, 0.08);
              }}
              .parity {{
                margin-top: 12px;
                color: var(--text-muted);
                font-size: 13px;
              }}
              .chip {{
                display: inline-flex;
                padding: 4px 8px;
                border-radius: 999px;
                font-size: 12px;
                background: var(--rail);
              }}
              @media (max-width: 1120px) {{
                main {{
                  grid-template-columns: 1fr;
                }}
                .lower {{
                  grid-column: auto;
                  grid-template-columns: 1fr;
                }}
                aside, .inspector {{
                  position: static;
                }}
              }}
            </style>
          </head>
          <body>
            <header>
              <div class="brand">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M5 7h9c2.3 0 4 1.5 4 3.6S16.3 14 14 14H8v3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M5 17h7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                </svg>
                <div>
                  <div>Vecells</div>
                  <div style="font-size:12px;color:var(--text-muted);font-weight:500;">Settlement_Envelope_Atlas</div>
                </div>
              </div>
              <div class="masthead-metrics" data-testid="masthead-metrics"></div>
            </header>
            <main>
              <aside aria-label="Filters">
                <div class="filter-group">
                  <label>Result
                    <select data-testid="result-filter"></select>
                  </label>
                  <label>Authoritative outcome
                    <select data-testid="outcome-filter"></select>
                  </label>
                  <label>Recovery state
                    <select data-testid="recovery-filter"></select>
                  </label>
                </div>
                <p class="parity">Use the filters to inspect how settlement truth maps into one published same-shell envelope without collapsing the four dimensions.</p>
              </aside>

              <div class="canvas">
                <section class="quadrant panel" data-testid="quadrant">
                  <h2 style="margin:0;color:var(--text-strong);">Four-axis settlement quadrant</h2>
                  <div class="quad-grid" data-testid="quadrant-grid"></div>
                  <p class="parity" data-testid="quadrant-parity"></p>
                </section>

                <section class="rail panel" data-testid="revision-rail">
                  <h2 style="margin:0;color:var(--text-strong);">Revision rail</h2>
                  <div class="rail-items" data-testid="revision-rail-items"></div>
                  <p class="parity">Every visible revision stays legible as a monotone chain. No revision may create a competing success head.</p>
                </section>

                <section class="grid-panel panel">
                  <h2 style="margin:0 0 12px;color:var(--text-strong);">Settlement revisions</h2>
                  <div class="cards" data-testid="settlement-card-grid"></div>
                </section>
              </div>

              <aside class="inspector" data-testid="inspector" aria-live="polite"></aside>

              <div class="lower">
                <section class="table-panel panel">
                  <h2 style="margin:0 0 12px;color:var(--text-strong);">Settlement to transition mapping</h2>
                  <table data-testid="mapping-table">
                    <thead>
                      <tr>
                        <th>Settlement</th>
                        <th>Local ack</th>
                        <th>Processing</th>
                        <th>Observation</th>
                        <th>Envelope outcome</th>
                      </tr>
                    </thead>
                    <tbody data-testid="mapping-table-body"></tbody>
                  </table>
                </section>

                <section class="table-panel panel">
                  <h2 style="margin:0 0 12px;color:var(--text-strong);">Validator table</h2>
                  <table data-testid="validator-table">
                    <thead>
                      <tr><th>Validator</th><th>Status</th></tr>
                    </thead>
                    <tbody data-testid="validator-table-body"></tbody>
                  </table>
                </section>
              </div>
            </main>
            <script>
              const MANIFEST_URL = "{manifest_rel}";
              const MATRIX_URL = "{matrix_rel}";
              const CASEBOOK_URL = "{casebook_rel}";
              const state = {{
                manifest: null,
                rows: [],
                casebook: null,
                resultFilter: "all",
                outcomeFilter: "all",
                recoveryFilter: "all",
                selectedSettlementId: null,
              }};

              document.body.dataset.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "true" : "false";

              const resultFilterEl = document.querySelector("[data-testid='result-filter']");
              const outcomeFilterEl = document.querySelector("[data-testid='outcome-filter']");
              const recoveryFilterEl = document.querySelector("[data-testid='recovery-filter']");

              function parseCsv(text) {{
                const [headerLine, ...lines] = text.trim().split(/\\r?\\n/);
                const headers = headerLine.split(",");
                return lines.filter(Boolean).map((line) => {{
                  const values = line.split(",");
                  const row = {{}};
                  headers.forEach((header, index) => {{
                    row[header] = values[index] ?? "";
                  }});
                  return row;
                }});
              }}

              function uniqueValues(key) {{
                return [...new Set(state.rows.map((row) => row[key]).filter(Boolean))].sort();
              }}

              function selectedSettlement() {{
                return state.rows.find((row) => row.settlement_id === state.selectedSettlementId) ?? state.rows[0] ?? null;
              }}

              function visibleRows() {{
                return state.rows.filter((row) => {{
                  const recoveryRequired = row.envelope_outcome_state === "recovery_required" ? "recovery_required" : "no_recovery";
                  return (state.resultFilter === "all" || row.result === state.resultFilter) &&
                    (state.outcomeFilter === "all" || row.envelope_outcome_state === state.outcomeFilter) &&
                    (state.recoveryFilter === "all" || recoveryRequired === state.recoveryFilter);
                }});
              }}

              function renderFilters() {{
                const resultOptions = ["all", ...uniqueValues("result")];
                const outcomeOptions = ["all", ...uniqueValues("envelope_outcome_state")];
                const recoveryOptions = ["all", "recovery_required", "no_recovery"];
                for (const [element, options, selected] of [
                  [resultFilterEl, resultOptions, state.resultFilter],
                  [outcomeFilterEl, outcomeOptions, state.outcomeFilter],
                  [recoveryFilterEl, recoveryOptions, state.recoveryFilter],
                ]) {{
                  element.innerHTML = options.map((option) => `<option value="${{option}}" ${{option === selected ? "selected" : ""}}>${{option}}</option>`).join("");
                }}
              }}

              function renderMasthead(rows) {{
                const settled = rows.filter((row) => row.envelope_outcome_state === "settled").length;
                const pending = rows.filter((row) => row.envelope_outcome_state === "pending").length;
                const review = rows.filter((row) => row.envelope_outcome_state === "review_required").length;
                const recovery = rows.filter((row) => row.envelope_outcome_state === "recovery_required").length;
                document.querySelector("[data-testid='masthead-metrics']").innerHTML = [
                  ["Pending", pending],
                  ["Settled", settled],
                  ["Review", review],
                  ["Recovery", recovery],
                ].map(([label, count]) => `<div class="metric"><span>${{label}}</span><strong>${{count}}</strong></div>`).join("");
              }}

              function renderQuadrant(rows) {{
                const cells = [
                  ["Settled", rows.filter((row) => row.envelope_outcome_state === "settled").length],
                  ["Pending", rows.filter((row) => row.envelope_outcome_state === "pending").length],
                  ["Review required", rows.filter((row) => row.envelope_outcome_state === "review_required").length],
                  ["Recovery required", rows.filter((row) => row.envelope_outcome_state === "recovery_required").length],
                ];
                document.querySelector("[data-testid='quadrant-grid']").innerHTML = cells.map(([label, count]) => `<div class="quad-cell"><span>${{label}}</span><strong>${{count}}</strong></div>`).join("");
                document.querySelector("[data-testid='quadrant-parity']").textContent = `${{rows.length}} visible settlement revisions. The quadrant counts reflect authoritative envelope outcomes, not local acknowledgement alone.`;
              }}

              function renderCards(rows) {{
                const selected = selectedSettlement();
                const container = document.querySelector("[data-testid='settlement-card-grid']");
                container.innerHTML = rows.map((row, index) => `
                  <button
                    class="card"
                    data-testid="settlement-card-${{row.settlement_id}}"
                    data-index="${{index}}"
                    data-selected="${{selected && selected.settlement_id === row.settlement_id}}"
                  >
                    <div class="chip">${{row.envelope_outcome_state}}</div>
                    <h3 style="margin:12px 0 8px;color:var(--text-strong);font-size:16px;">${{row.headline}}</h3>
                    <div class="mono">${{row.settlement_id}}</div>
                    <p style="margin:10px 0 0;color:var(--text-muted);font-size:13px;">${{row.result}} · local ack ${{row.local_ack_state}} · processing ${{row.processing_acceptance_state}}</p>
                  </button>
                `).join("");
                container.querySelectorAll("button").forEach((button) => {{
                  button.addEventListener("click", () => {{
                    state.selectedSettlementId = button.dataset.testid.replace("settlement-card-", "");
                    render();
                  }});
                  button.addEventListener("keydown", (event) => {{
                    const buttons = [...container.querySelectorAll("button")];
                    const index = Number(button.dataset.index || "0");
                    if (event.key === "ArrowDown") {{
                      const next = buttons[Math.min(index + 1, buttons.length - 1)];
                      if (next) {{
                        state.selectedSettlementId = next.dataset.testid.replace("settlement-card-", "");
                        render();
                        next.focus();
                        event.preventDefault();
                      }}
                    }}
                    if (event.key === "ArrowUp") {{
                      const previous = buttons[Math.max(index - 1, 0)];
                      if (previous) {{
                        state.selectedSettlementId = previous.dataset.testid.replace("settlement-card-", "");
                        render();
                        previous.focus();
                        event.preventDefault();
                      }}
                    }}
                  }});
                }});
              }}

              function renderRevisionRail(rows) {{
                const selected = selectedSettlement();
                const chain = rows.filter((row) => row.action_record_ref === selected?.action_record_ref);
                document.querySelector("[data-testid='revision-rail-items']").innerHTML = chain.map((row) => `
                  <div class="rail-item" data-selected="${{selected && selected.settlement_id === row.settlement_id}}">
                    <span class="chip">${{row.envelope_outcome_state}}</span>
                    <span>${{row.settlement_id}}</span>
                    <span>${{row.supersedes_settlement_ref ? "supersedes" : "origin"}}</span>
                  </div>
                `).join("");
              }}

              function renderInspector() {{
                const selected = selectedSettlement();
                if (!selected) {{
                  return;
                }}
                document.querySelector("[data-testid='inspector']").innerHTML = `
                  <h2 style="margin-top:0;color:var(--text-strong);">${{selected.settlement_id}}</h2>
                  <div class="key-value"><strong>Scenario</strong><span>${{selected.scenario_id}}</span></div>
                  <div class="key-value"><strong>Action</strong><span class="mono">${{selected.action_record_ref}}</span></div>
                  <div class="key-value"><strong>Result</strong><span>${{selected.result}}</span></div>
                  <div class="key-value"><strong>Processing</strong><span>${{selected.processing_acceptance_state}}</span></div>
                  <div class="key-value"><strong>Observation</strong><span>${{selected.external_observation_state}}</span></div>
                  <div class="key-value"><strong>Envelope outcome</strong><span>${{selected.envelope_outcome_state}}</span></div>
                  <div class="key-value"><strong>Proof</strong><span>${{selected.authoritative_proof_class}}</span></div>
                  <div class="key-value"><strong>Recovery ref</strong><span>${{selected.same_shell_recovery_ref || "none"}}</span></div>
                  <div class="key-value"><strong>Anchor</strong><span>${{selected.last_safe_anchor_ref || "none"}}</span></div>
                  <div class="key-value"><strong>Summary tier</strong><span>${{selected.allowed_summary_tier || "none"}}</span></div>
                  <div class="key-value"><strong>Quiet eligible</strong><span>${{selected.quiet_eligible_at || "not yet"}}</span></div>
                  <div class="key-value"><strong>Recorded</strong><span>${{selected.recorded_at}}</span></div>
                `;
              }}

              function renderMappingTable(rows) {{
                const selected = selectedSettlement();
                const body = document.querySelector("[data-testid='mapping-table-body']");
                body.innerHTML = rows.map((row) => `
                  <tr data-testid="mapping-row-${{row.settlement_id}}" data-selected="${{selected && selected.settlement_id === row.settlement_id}}">
                    <td class="mono">${{row.settlement_id}}</td>
                    <td>${{row.local_ack_state}}</td>
                    <td>${{row.processing_acceptance_state}}</td>
                    <td>${{row.external_observation_state}}</td>
                    <td>${{row.envelope_outcome_state}}</td>
                  </tr>
                `).join("");
              }}

              function renderValidatorTable() {{
                const body = document.querySelector("[data-testid='validator-table-body']");
                body.innerHTML = state.manifest.validators.map((validator) => `
                  <tr>
                    <td>${{validator.description}}</td>
                    <td><span class="chip">${{validator.status}}</span></td>
                  </tr>
                `).join("");
              }}

              function render() {{
                const rows = visibleRows();
                if (!state.selectedSettlementId || !rows.some((row) => row.settlement_id === state.selectedSettlementId)) {{
                  state.selectedSettlementId = rows[0]?.settlement_id ?? null;
                }}
                renderFilters();
                renderMasthead(rows);
                renderQuadrant(rows);
                renderCards(rows);
                renderRevisionRail(rows);
                renderInspector();
                renderMappingTable(rows);
                renderValidatorTable();
              }}

              async function boot() {{
                const [manifest, matrixText, casebook] = await Promise.all([
                  fetch(MANIFEST_URL).then((response) => response.json()),
                  fetch(MATRIX_URL).then((response) => response.text()),
                  fetch(CASEBOOK_URL).then((response) => response.json()),
                ]);
                state.manifest = manifest;
                state.rows = parseCsv(matrixText);
                state.casebook = casebook;
                state.selectedSettlementId = state.rows[0]?.settlement_id ?? null;
                resultFilterEl.addEventListener("change", (event) => {{
                  state.resultFilter = event.target.value;
                  render();
                }});
                outcomeFilterEl.addEventListener("change", (event) => {{
                  state.outcomeFilter = event.target.value;
                  render();
                }});
                recoveryFilterEl.addEventListener("change", (event) => {{
                  state.recoveryFilter = event.target.value;
                  render();
                }});
                render();
              }}

              boot();
            </script>
          </body>
        </html>
        """
    ).strip()


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
        const HTML_PATH = path.join(ROOT, "docs", "architecture", "72_settlement_envelope_atlas.html");
        const MANIFEST_PATH = path.join(ROOT, "data", "analysis", "command_settlement_manifest.json");
        const CASEBOOK_PATH = path.join(ROOT, "data", "analysis", "settlement_supersession_casebook.json");
        const MATRIX_PATH = path.join(ROOT, "data", "analysis", "settlement_to_transition_matrix.csv");

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
                  ? "/docs/architecture/72_settlement_envelope_atlas.html"
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
            server.listen(4372, "127.0.0.1", () => resolve(server));
          });
        }

        async function run() {
          assertCondition(fs.existsSync(HTML_PATH), `Missing atlas HTML: ${HTML_PATH}`);
          const { chromium } = await importPlaywright();
          const server = await startStaticServer();
          const browser = await chromium.launch({ headless: true });
          const page = await browser.newPage({ viewport: { width: 1480, height: 1120 } });
          const url =
            process.env.SETTLEMENT_ENVELOPE_ATLAS_URL ??
            "http://127.0.0.1:4372/docs/architecture/72_settlement_envelope_atlas.html";

          try {
            await page.goto(url, { waitUntil: "networkidle" });
            await page.locator("[data-testid='quadrant']").waitFor();
            await page.locator("[data-testid='revision-rail']").waitFor();
            await page.locator("[data-testid='inspector']").waitFor();
            await page.locator("[data-testid='mapping-table']").waitFor();
            await page.locator("[data-testid='validator-table']").waitFor();

            const cards = await page.locator("button[data-testid^='settlement-card-']").count();
            assertCondition(
              cards === MANIFEST.summary.settlement_revision_count,
              `Expected ${MANIFEST.summary.settlement_revision_count} visible settlement cards, found ${cards}.`,
            );

            await page.locator("[data-testid='result-filter']").selectOption("review_required");
            const reviewCards = await page.locator("button[data-testid^='settlement-card-']").count();
            assertCondition(reviewCards === 1, `Expected 1 review card, found ${reviewCards}.`);

            await page.locator("[data-testid='result-filter']").selectOption("all");
            await page.locator("[data-testid='outcome-filter']").selectOption("recovery_required");
            const recoveryCards = await page.locator("button[data-testid^='settlement-card-']").count();
            assertCondition(recoveryCards === 3, `Expected 3 recovery cards, found ${recoveryCards}.`);

            await page.locator("[data-testid='outcome-filter']").selectOption("all");
            await page.locator("[data-testid='recovery-filter']").selectOption("recovery_required");
            const recoveryOnlyCards = await page.locator("button[data-testid^='settlement-card-']").count();
            assertCondition(recoveryOnlyCards === 3, `Expected 3 recovery-filtered cards, found ${recoveryOnlyCards}.`);

            await page.locator("[data-testid='settlement-card-CSR_072_DENIED_SCOPE_V1']").click();
            const inspectorText = await page.locator("[data-testid='inspector']").innerText();
            assertCondition(
              inspectorText.includes("CSR_072_DENIED_SCOPE_V1") &&
                inspectorText.includes("/recover/scope/072_denied_scope") &&
                inspectorText.includes("summary_only"),
              "Inspector lost settlement selection synchronization.",
            );
            const selectedRow = await page
              .locator("[data-testid='mapping-row-CSR_072_DENIED_SCOPE_V1']")
              .getAttribute("data-selected");
            assertCondition(selectedRow === "true", "Mapping row did not synchronize with selected card.");

            await page.locator("[data-testid='settlement-card-CSR_072_BLOCKED_POLICY_V1']").focus();
            await page.keyboard.press("ArrowDown");
            const nextSelected = await page
              .locator("[data-testid='settlement-card-CSR_072_DENIED_SCOPE_V1']")
              .getAttribute("data-selected");
            assertCondition(nextSelected === "true", "ArrowDown did not advance settlement selection.");

            await page.locator("[data-testid='recovery-filter']").selectOption("all");
            const parityText = await page.locator("[data-testid='quadrant-parity']").textContent();
            assertCondition(parityText.includes("10 visible settlement revisions"), "Quadrant parity text drifted.");
            assertCondition(MATRIX.length === MANIFEST.summary.settlement_revision_count, "Matrix row count drifted from the frozen baseline.");
            assertCondition(CASEBOOK.summary.case_count === 7, "Casebook summary drifted.");

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
            assertCondition(landmarks >= 6, `Expected multiple landmarks, found ${landmarks}.`);
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

        export const settlementEnvelopeAtlasManifest = {
          task: MANIFEST.task_id,
          settlementRevisions: MANIFEST.summary.settlement_revision_count,
          coverage: [
            "settlement filtering",
            "card selection synchronization",
            "quadrant and table parity",
            "keyboard navigation",
            "reduced motion",
            "responsive layout",
          ],
        };
        """
    ).strip()


def build_validator() -> str:
    return dedent(
        f"""
        #!/usr/bin/env python3
        from __future__ import annotations

        import csv
        import json
        from pathlib import Path


        ROOT = Path(__file__).resolve().parents[2]
        DATA_DIR = ROOT / "data" / "analysis"
        DOCS_DIR = ROOT / "docs" / "architecture"
        TESTS_DIR = ROOT / "tests" / "playwright"

        MANIFEST_PATH = DATA_DIR / "command_settlement_manifest.json"
        MATRIX_PATH = DATA_DIR / "settlement_to_transition_matrix.csv"
        CASEBOOK_PATH = DATA_DIR / "settlement_supersession_casebook.json"
        DESIGN_DOC_PATH = DOCS_DIR / "72_command_settlement_and_transition_envelope_design.md"
        RULES_DOC_PATH = DOCS_DIR / "72_settlement_dimension_mapping_rules.md"
        ATLAS_PATH = DOCS_DIR / "72_settlement_envelope_atlas.html"
        SPEC_PATH = TESTS_DIR / "settlement-envelope-atlas.spec.js"
        ROOT_SCRIPT_UPDATES_PATH = ROOT / "tools" / "analysis" / "root_script_updates.py"
        PLAYWRIGHT_BUILDER_PATH = ROOT / "tools" / "analysis" / "build_parallel_foundation_tracks_gate.py"
        DOMAIN_BUILDER_PATH = ROOT / "tools" / "analysis" / "build_domain_package_scaffold.py"
        DOMAIN_SOURCE_PATH = ROOT / "packages" / "domains" / "identity_access" / "src" / "command-settlement-backbone.ts"
        SERVICE_SOURCE_PATH = ROOT / "services" / "command-api" / "src" / "command-settlement.ts"
        MIGRATION_PATH = ROOT / "services" / "command-api" / "migrations" / "072_command_settlement_and_transition_envelope_library.sql"
        DOMAIN_TEST_PATH = ROOT / "packages" / "domains" / "identity_access" / "tests" / "command-settlement-backbone.test.ts"
        SERVICE_TEST_PATH = ROOT / "services" / "command-api" / "tests" / "command-settlement.integration.test.js"
        PACKAGE_TRANSITION_SOURCE_PATH = ROOT / "packages" / "api-contracts" / "src" / "transition-envelope.ts"
        PACKAGE_INDEX_PATH = ROOT / "packages" / "api-contracts" / "src" / "index.ts"
        PACKAGE_PUBLIC_API_TEST_PATH = ROOT / "packages" / "api-contracts" / "tests" / "public-api.test.ts"
        PACKAGE_JSON_PATH = ROOT / "packages" / "api-contracts" / "package.json"
        COMMAND_SETTLEMENT_SCHEMA_PATH = ROOT / "packages" / "api-contracts" / "schemas" / "command-settlement-record.schema.json"
        TRANSITION_ENVELOPE_SCHEMA_PATH = ROOT / "packages" / "api-contracts" / "schemas" / "transition-envelope.schema.json"
        PACKAGE_JSON_ROOT = ROOT / "package.json"
        PLAYWRIGHT_PACKAGE_PATH = ROOT / "tests" / "playwright" / "package.json"


        def fail(message: str) -> None:
            raise SystemExit(message)


        def load_json(path: Path) -> object:
            if not path.exists():
                fail(f"Missing required JSON artifact: {{path}}")
            return json.loads(path.read_text(encoding="utf-8"))


        def load_csv(path: Path) -> list[dict[str, str]]:
            if not path.exists():
                fail(f"Missing required CSV artifact: {{path}}")
            with path.open(encoding="utf-8", newline="") as handle:
                return list(csv.DictReader(handle))


        def main() -> None:
            manifest = load_json(MANIFEST_PATH)
            matrix = load_csv(MATRIX_PATH)
            casebook = load_json(CASEBOOK_PATH)
            package_json = load_json(PACKAGE_JSON_PATH)
            root_package_json = load_json(PACKAGE_JSON_ROOT)
            playwright_package = load_json(PLAYWRIGHT_PACKAGE_PATH)

            for required_path in [
                DESIGN_DOC_PATH,
                RULES_DOC_PATH,
                ATLAS_PATH,
                SPEC_PATH,
                ROOT_SCRIPT_UPDATES_PATH,
                PLAYWRIGHT_BUILDER_PATH,
                DOMAIN_BUILDER_PATH,
                DOMAIN_SOURCE_PATH,
                SERVICE_SOURCE_PATH,
                MIGRATION_PATH,
                DOMAIN_TEST_PATH,
                SERVICE_TEST_PATH,
                PACKAGE_TRANSITION_SOURCE_PATH,
                PACKAGE_INDEX_PATH,
                PACKAGE_PUBLIC_API_TEST_PATH,
                COMMAND_SETTLEMENT_SCHEMA_PATH,
                TRANSITION_ENVELOPE_SCHEMA_PATH,
            ]:
                if not required_path.exists():
                    fail(f"Missing required artifact: {{required_path}}")

            if manifest["task_id"] != "par_072":
                fail("Manifest task_id drifted from par_072.")

            expected_summary = {{
                "scenario_count": 7,
                "settlement_revision_count": 10,
                "transition_envelope_count": 10,
                "settled_count": 2,
                "pending_count": 4,
                "review_required_count": 1,
                "recovery_required_count": 3,
                "validator_count": 6,
            }}
            for key, expected in expected_summary.items():
                if manifest["summary"][key] != expected:
                    fail(f"Manifest summary {{key}} drifted: expected {{expected}}, found {{manifest['summary'][key]}}.")

            if len(matrix) != manifest["summary"]["settlement_revision_count"]:
                fail("settlement_to_transition_matrix row count drifted from the frozen baseline.")
            if casebook["summary"]["case_count"] != len(casebook["cases"]):
                fail("Casebook case_count drifted from cases array.")

            design_doc = DESIGN_DOC_PATH.read_text(encoding="utf-8")
            for marker in [
                "## Core law",
                "`CommandSettlementRecord` is the authoritative mutation outcome substrate.",
                "`TransitionEnvelope` is the required same-shell bridge",
            ]:
                if marker not in design_doc:
                    fail(f"Design doc is missing required marker: {{marker}}")

            rules_doc = RULES_DOC_PATH.read_text(encoding="utf-8")
            for marker in [
                "## Mapping law",
                "## Recovery law",
                "## Simulator contract",
            ]:
                if marker not in rules_doc:
                    fail(f"Rules doc is missing required marker: {{marker}}")

            atlas_html = ATLAS_PATH.read_text(encoding="utf-8")
            for marker in [
                'data-testid="quadrant"',
                'data-testid="revision-rail"',
                'data-testid="inspector"',
                'data-testid="mapping-table"',
                'data-testid="validator-table"',
                'data-testid="result-filter"',
                'data-testid="outcome-filter"',
                'data-testid="recovery-filter"',
            ]:
                if marker not in atlas_html:
                    fail(f"Atlas HTML is missing required marker: {{marker}}")

            spec_source = SPEC_PATH.read_text(encoding="utf-8")
            for probe in [
                "settlement filtering",
                "card selection synchronization",
                "quadrant and table parity",
                "keyboard navigation",
                "reduced motion",
                "responsive layout",
            ]:
                if probe not in spec_source:
                    fail(f"Spec is missing expected coverage text: {{probe}}")

            root_script_updates = ROOT_SCRIPT_UPDATES_PATH.read_text(encoding="utf-8")
            for token in [
                "build_command_settlement_and_transition_envelope.py",
                "validate:settlement-envelope",
                "validate_settlement_envelope_library.py",
            ]:
                if token not in root_script_updates:
                    fail(f"root_script_updates.py is missing required token: {{token}}")

            playwright_builder = PLAYWRIGHT_BUILDER_PATH.read_text(encoding="utf-8")
            if "settlement-envelope-atlas.spec.js" not in playwright_builder:
                fail("build_parallel_foundation_tracks_gate.py does not preserve the par_072 Playwright spec.")

            domain_builder = DOMAIN_BUILDER_PATH.read_text(encoding="utf-8")
            if 'export * from "./command-settlement-backbone";' not in domain_builder:
                fail("build_domain_package_scaffold.py does not preserve the settlement backbone export.")

            domain_source = DOMAIN_SOURCE_PATH.read_text(encoding="utf-8")
            for token in [
                "CommandSettlementRecordDocument",
                "createCommandSettlementAuthorityService",
                "validateCommandSettlementRevisionChain",
                "validateCommandSettlementCalmReturnLaw",
            ]:
                if token not in domain_source:
                    fail(f"Settlement backbone source is missing required token: {{token}}")

            service_source = SERVICE_SOURCE_PATH.read_text(encoding="utf-8")
            for token in [
                "createCommandSettlementApplication",
                "commandSettlementPersistenceTables",
                "072_command_settlement_and_transition_envelope_library.sql",
                "buildTransitionEnvelope",
                "runAllScenarios",
            ]:
                if token not in service_source:
                    fail(f"Command API settlement seam is missing required token: {{token}}")

            package_transition_source = PACKAGE_TRANSITION_SOURCE_PATH.read_text(encoding="utf-8")
            for token in [
                "buildTransitionEnvelope",
                "validateTransitionEnvelope",
                "CommandSettlementRecordLike",
                "TransitionEnvelope",
            ]:
                if token not in package_transition_source:
                    fail(f"Transition-envelope library is missing required token: {{token}}")

            package_index_source = PACKAGE_INDEX_PATH.read_text(encoding="utf-8")
            if 'export * from "./transition-envelope";' not in package_index_source:
                fail("API-contract index is missing the transition-envelope export.")

            migration_source = MIGRATION_PATH.read_text(encoding="utf-8").lower()
            if "create table if not exists command_settlement_records" not in migration_source:
                fail("Migration is missing command_settlement_records table.")

            if "publishes the par_072 settlement and envelope schema surface" not in PACKAGE_PUBLIC_API_TEST_PATH.read_text(encoding="utf-8"):
                fail("API-contract public-api test is missing the par_072 schema assertion.")

            exports = package_json["exports"]
            if "./schemas/transition-envelope.schema.json" not in exports:
                fail("API-contract package.json is missing the transition-envelope schema export.")

            root_scripts = root_package_json["scripts"]
            if "build_command_settlement_and_transition_envelope.py" not in root_scripts["codegen"]:
                fail("Root codegen script is missing the par_072 builder.")
            if "pnpm validate:settlement-envelope" not in root_scripts["bootstrap"]:
                fail("Root bootstrap script is missing validate:settlement-envelope.")
            if "pnpm validate:settlement-envelope" not in root_scripts["check"]:
                fail("Root check script is missing validate:settlement-envelope.")
            if root_scripts["validate:settlement-envelope"] != "python3 ./tools/analysis/validate_settlement_envelope_library.py":
                fail("Root validate:settlement-envelope script drifted.")

            playwright_scripts = playwright_package["scripts"]
            for key in ["build", "lint", "test", "typecheck", "e2e"]:
                if "settlement-envelope-atlas.spec.js" not in playwright_scripts[key]:
                    fail(f"Playwright package script {{key}} is missing settlement-envelope-atlas.spec.js.")

            print("par_072 settlement and transition-envelope validation passed")


        if __name__ == "__main__":
            main()
        """
    ).strip()


def main() -> None:
    manifest = build_manifest()
    casebook = build_casebook()
    write_json(MANIFEST_PATH, manifest)
    write_csv(MATRIX_PATH, SETTLEMENT_ROWS)
    write_json(CASEBOOK_PATH, casebook)
    write_text(DESIGN_DOC_PATH, build_design_doc(manifest))
    write_text(RULES_DOC_PATH, build_rules_doc())
    write_json(COMMAND_SETTLEMENT_SCHEMA_PATH, build_command_settlement_schema())
    write_json(TRANSITION_ENVELOPE_SCHEMA_PATH, build_transition_envelope_schema())
    patch_package_index()
    patch_public_api_test()
    patch_package_json()
    write_text(ATLAS_PATH, build_atlas_html())
    write_text(SPEC_PATH, build_spec())
    write_text(VALIDATOR_PATH, build_validator())
    print(
        "par_072 settlement and transition-envelope artifacts generated: "
        f"{MANIFEST_PATH.relative_to(ROOT)}, {MATRIX_PATH.relative_to(ROOT)}, {CASEBOOK_PATH.relative_to(ROOT)}"
    )


if __name__ == "__main__":
    main()
