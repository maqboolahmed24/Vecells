#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]

CHECKLIST = ROOT / "prompt" / "checklist.md"
PACKAGE_JSON = ROOT / "package.json"
ROOT_SCRIPT_UPDATES = ROOT / "tools" / "analysis" / "root_script_updates.py"

ARCH_DOC = ROOT / "docs" / "architecture" / "246_conversation_digest_composer_and_settlement.md"
SECURITY_DOC = ROOT / "docs" / "security" / "246_conversation_mutation_receipt_and_recovery_controls.md"

CONTRACT = ROOT / "data" / "contracts" / "246_conversation_digest_contract.json"
TUPLE_CONTRACT = ROOT / "data" / "contracts" / "246_247_conversation_tuple_contract.json"
STATE_MATRIX = ROOT / "data" / "analysis" / "246_digest_and_composer_state_matrix.csv"
CASES = ROOT / "data" / "analysis" / "246_urgent_diversion_and_settlement_cases.json"
GAP_LOG = ROOT / "data" / "analysis" / "246_gap_log.json"

DOMAIN_SOURCE = ROOT / "packages" / "domains" / "communications" / "src" / "phase3-conversation-control-kernel.ts"
DOMAIN_INDEX = ROOT / "packages" / "domains" / "communications" / "src" / "index.ts"
SERVICE_SOURCE = ROOT / "services" / "command-api" / "src" / "phase3-conversation-control.ts"
SERVICE_DEFINITION = ROOT / "services" / "command-api" / "src" / "service-definition.ts"
MIGRATION = ROOT / "services" / "command-api" / "migrations" / "122_phase3_conversation_digest_and_settlement.sql"
INTEGRATION_TEST = ROOT / "services" / "command-api" / "tests" / "phase3-conversation-control.integration.test.js"


def fail(message: str) -> None:
    raise SystemExit(f"[246-conversation-digest-settlement] {message}")


def read(path: Path) -> str:
    if not path.exists():
        fail(f"missing required file {path.relative_to(ROOT)}")
    return path.read_text(encoding="utf-8")


def require_text(path: Path, snippets: list[str]) -> None:
    text = read(path)
    for snippet in snippets:
        if snippet not in text:
            fail(f"{path.relative_to(ROOT)} is missing required text: {snippet}")


def load_json(path: Path):
    try:
        return json.loads(read(path))
    except json.JSONDecodeError as exc:
        fail(f"invalid JSON in {path.relative_to(ROOT)}: {exc}")


def load_csv(path: Path) -> list[dict[str, str]]:
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def validate_checklist() -> None:
    checklist = read(CHECKLIST)
    if not re.search(
        r"^- \[[Xx]\] par_246_phase3_track_backend_build_patient_conversation_digest_and_shared_staff_rules",
        checklist,
        re.MULTILINE,
    ):
        fail("task 246 checklist entry is not complete")


def validate_docs() -> None:
    require_text(
        ARCH_DOC,
        [
            "PatientConversationPreviewDigest",
            "PatientComposerLease",
            "PatientUrgentDiversionState",
            "ConversationCommandSettlement",
            "One live composer",
            "246 to 247 seam",
        ],
    )
    require_text(
        SECURITY_DOC,
        [
            "ReviewActionLease",
            "WorkspaceFocusProtectionLease",
            "ProtectedCompositionState",
            "send success does not imply settled conversational truth",
            "RecoveryContinuationToken",
        ],
    )


def validate_contracts() -> None:
    contract = load_json(CONTRACT)
    if contract.get("schemaVersion") != "246.phase3.conversation-digest-settlement.v1":
        fail("246 contract schemaVersion drifted")
    if contract.get("serviceName") != "Phase3ConversationDigestSettlementApplication":
        fail("246 contract serviceName drifted")
    if contract.get("tupleContractRef") != "data/contracts/246_247_conversation_tuple_contract.json":
        fail("246 contract tupleContractRef drifted")

    tuple_contract = load_json(TUPLE_CONTRACT)
    if tuple_contract.get("schemaVersion") != "246.247.conversation-tuple-compat.v1":
        fail("246/247 tuple contract schemaVersion drifted")
    if tuple_contract.get("producerTrack") != "247" or tuple_contract.get("consumerTrack") != "246":
        fail("246/247 tuple contract track ownership drifted")
    if "continuityValidationState" not in tuple_contract.get("tupleFields", []):
        fail("246/247 tuple contract is missing continuityValidationState")


def validate_analysis() -> None:
    rows = load_csv(STATE_MATRIX)
    if {row["caseId"] for row in rows} != {
        "AUTHORITATIVE_REPLY",
        "PLACEHOLDER_RECOVERY",
        "STALE_CONTINUITY_RECOVERY",
        "STEP_UP_BLOCK",
        "URGENT_FREEZE",
        "REPAIR_REQUIRED_BLOCK",
    }:
        fail("246_digest_and_composer_state_matrix.csv drifted from required cases")

    cases = load_json(CASES)
    if {case["caseId"] for case in cases.get("cases", [])} != {
        "URGENT_FREEZES_ACTIVE_COMPOSER",
        "REVIEW_PENDING_SETTLEMENT_ISSUES_RECOVERY",
        "STALE_TUPLE_COLLAPSES_CALM_SUCCESS",
        "STAFF_DELIVERY_DISPUTE_REQUIRES_PROTECTED_CONTEXT",
        "DUPLICATE_COMMAND_SETTLEMENT_REUSES_EXISTING_RECORD",
    }:
        fail("246_urgent_diversion_and_settlement_cases.json drifted from required cases")

    gap_log = load_json(GAP_LOG)
    if gap_log.get("status") != "accepted_gaps_only":
        fail("246_gap_log.json must declare accepted_gaps_only status")
    if len(gap_log.get("gaps", [])) != 2:
        fail("246_gap_log.json must contain exactly two accepted gaps")


def validate_sources() -> None:
    require_text(
        DOMAIN_SOURCE,
        [
            "PatientConversationPreviewDigestSnapshot",
            "PatientComposerLeaseSnapshot",
            "PatientUrgentDiversionStateSnapshot",
            "ConversationCommandSettlementSnapshot",
            "recomputeDigest(",
            "acquireComposerLease(",
            "recomputeUrgentDiversion(",
            "recordSettlement(",
        ],
    )
    require_text(
        DOMAIN_INDEX,
        [
            'canonicalName: "ConversationCommandSettlement"',
            'canonicalName: "PatientConversationPreviewDigest"',
        ],
    )
    require_text(
        SERVICE_SOURCE,
        [
            "PHASE3_CONVERSATION_CONTROL_SERVICE_NAME",
            "publishConversationTuple(",
            "queryTaskConversationControl(",
            "recordMessageMutationSettlement(",
            "recordCallbackMutationSettlement(",
            "requireStaffMutationGuards(",
            "normalizeSettlementAgainstTuple(",
        ],
    )
    require_text(
        SERVICE_DEFINITION,
        [
            "workspace_task_conversation_control_current",
            "patient_portal_conversation_control_current",
            "internal_conversation_tuple_publish",
            "patient_portal_conversation_acquire_composer",
            "patient_portal_conversation_release_composer",
            "internal_conversation_urgent_diversion_recompute",
            "internal_message_conversation_settlement_record",
            "internal_callback_conversation_settlement_record",
        ],
    )
    require_text(
        MIGRATION,
        [
            "phase3_conversation_tuple_compatibility",
            "phase3_conversation_preview_digests",
            "phase3_patient_composer_leases",
            "phase3_patient_urgent_diversion_states",
            "phase3_conversation_command_settlements",
            "phase3_recovery_continuation_tokens",
        ],
    )
    require_text(
        INTEGRATION_TEST,
        [
            "publishes the 246 conversation-control routes in the command-api route catalog",
            "derives one canonical digest, keeps one live composer, and freezes it in place under urgent diversion",
            "deduplicates message-settlement replay while preserving the shared receipt grammar ladder",
            "fails closed on stale tuple calmness and returns recovery-only callback settlement posture",
            "requires the current staff review lease and live protected composition for guarded staff mutations",
        ],
    )


def validate_scripts() -> None:
    require_text(
        PACKAGE_JSON,
        [
            '"validate:246-conversation-digest-settlement": "python3 ./tools/analysis/validate_246_conversation_digest_and_settlement.py"'
        ],
    )
    require_text(
        ROOT_SCRIPT_UPDATES,
        [
            '"validate:246-conversation-digest-settlement": "python3 ./tools/analysis/validate_246_conversation_digest_and_settlement.py"'
        ],
    )


def main() -> None:
    validate_checklist()
    validate_docs()
    validate_contracts()
    validate_analysis()
    validate_sources()
    validate_scripts()


if __name__ == "__main__":
    main()
