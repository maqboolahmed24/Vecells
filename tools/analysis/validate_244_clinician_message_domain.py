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

ARCH_DOC = ROOT / "docs" / "architecture" / "244_clinician_message_thread_and_delivery_chain.md"
SECURITY_DOC = ROOT / "docs" / "security" / "244_clinician_message_dispatch_receipt_and_reply_controls.md"
OPS_DOC = ROOT / "docs" / "operations" / "244_message_thread_reconciliation_runbook.md"

CONTRACT = ROOT / "data" / "contracts" / "244_clinician_message_domain_contract.json"
STATE_MATRIX = ROOT / "data" / "analysis" / "244_message_thread_state_matrix.csv"
REPLAY_MATRIX = ROOT / "data" / "analysis" / "244_dispatch_and_delivery_replay_cases.csv"
GAP_LOG = ROOT / "data" / "analysis" / "244_gap_log.json"

DOMAIN_SOURCE = ROOT / "packages" / "domains" / "triage_workspace" / "src" / "phase3-clinician-message-kernel.ts"
PACKAGE_INDEX = ROOT / "packages" / "domains" / "triage_workspace" / "src" / "index.ts"
PUBLIC_API_TEST = ROOT / "packages" / "domains" / "triage_workspace" / "tests" / "public-api.test.ts"
DOMAIN_TEST = ROOT / "packages" / "domains" / "triage_workspace" / "tests" / "phase3-clinician-message-kernel.test.ts"

COMMAND_API_SOURCE = ROOT / "services" / "command-api" / "src" / "phase3-clinician-message-domain.ts"
SERVICE_DEFINITION = ROOT / "services" / "command-api" / "src" / "service-definition.ts"
MIGRATION = ROOT / "services" / "command-api" / "migrations" / "120_phase3_clinician_message_domain.sql"
INTEGRATION_TEST = ROOT / "services" / "command-api" / "tests" / "phase3-clinician-message-domain.integration.test.js"


def fail(message: str) -> None:
    raise SystemExit(f"[244-clinician-message-domain] {message}")


def read(path: Path) -> str:
    if not path.exists():
        fail(f"missing required file {path.relative_to(ROOT)}")
    return path.read_text(encoding="utf-8")


def require_text(path: Path, snippets: list[str]) -> None:
    text = read(path)
    for snippet in snippets:
        if snippet not in text:
            fail(f"{path.relative_to(ROOT)} is missing required text: {snippet}")


def load_csv(path: Path) -> list[dict[str, str]]:
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def load_json(path: Path):
    try:
        return json.loads(read(path))
    except json.JSONDecodeError as exc:
        fail(f"invalid JSON in {path.relative_to(ROOT)}: {exc}")


def validate_checklist() -> None:
    checklist = read(CHECKLIST)
    if not re.search(
        r"^- \[[Xx]\] par_244_phase3_track_backend_build_clinician_message_thread_state_machine_and_delivery_settlement_chain",
        checklist,
        re.MULTILINE,
    ):
        fail("task 244 checklist entry is not complete")


def validate_docs() -> None:
    require_text(
        ARCH_DOC,
        [
            "ClinicianMessageThread",
            "MessageDispatchEnvelope",
            "MessageDeliveryEvidenceBundle",
            "ThreadExpectationEnvelope",
            "ThreadResolutionGate",
            "AdapterReceiptCheckpoint",
            "drafted -> approved -> sent -> delivered -> patient_replied -> awaiting_clinician_review -> closed",
        ],
    )
    require_text(
        SECURITY_DOC,
        [
            "phase3-message-hmac-sha256-simulator.v1",
            "MESSAGE_WEBHOOK_SIGNATURE_REJECTED",
            "ThreadResolutionGate",
            "Provider acceptance does not mean delivered truth.",
        ],
    )
    require_text(
        OPS_DOC,
        [
            ":create-message-thread",
            ":approve-draft",
            ":send",
            ":record-provider-receipt",
            ":record-delivery-evidence",
            ":settle-resolution-gate",
            ":reopen",
        ],
    )


def validate_contract_and_analysis() -> None:
    contract = load_json(CONTRACT)
    if contract.get("schemaVersion") != "244.phase3.clinician-message-domain.v1":
        fail("244 contract schemaVersion drifted")
    if contract.get("serviceName") != "Phase3ClinicianMessageDomainApplication":
        fail("244 contract serviceName drifted")
    if contract.get("outboxEffectTypes") != [
        "projection_refresh",
        "reply_assimilation",
        "callback_escalation",
    ]:
        fail("244 contract outboxEffectTypes drifted")

    state_rows = load_csv(STATE_MATRIX)
    if {row["caseId"] for row in state_rows} != {
        "THREAD_CREATE_TO_DRAFT",
        "DRAFT_APPROVE_SEND",
        "PROVIDER_ACCEPTANCE_PENDING_ONLY",
        "DELIVERY_SUCCESS_TO_REPLY_WINDOW",
        "REPLY_TO_AWAITING_REVIEW",
        "REPAIR_ROUTE_ON_FAILED_DELIVERY",
        "CALLBACK_ESCALATION_FROM_REVIEW",
        "CLOSE_AND_REOPEN",
    }:
        fail("244_message_thread_state_matrix.csv drifted from required coverage")

    replay_rows = load_csv(REPLAY_MATRIX)
    if {row["caseId"] for row in replay_rows} != {
        "DUPLICATE_SEND_REUSES_DISPATCH_ENVELOPE",
        "STALE_WRITER_SEND_FAILS_CLOSED",
        "EXACT_PROVIDER_RECEIPT_REPLAY_REUSES_CHECKPOINT",
        "OUT_OF_ORDER_CONTRADICTORY_EVIDENCE_REQUIRES_DISPUTE",
        "UNSIGNED_PROVIDER_RECEIPT_REJECTED",
        "PATIENT_REPLY_ASSIMILATION_HOOK_EMITTED",
    }:
        fail("244_dispatch_and_delivery_replay_cases.csv drifted from required replay coverage")

    gap_log = load_json(GAP_LOG)
    if gap_log.get("status") != "accepted_gaps_only":
        fail("244_gap_log.json must declare accepted_gaps_only status")
    if len(gap_log.get("gaps", [])) != 2:
        fail("244_gap_log.json must contain exactly two accepted gaps")


def validate_sources() -> None:
    require_text(
        DOMAIN_SOURCE,
        [
            "ClinicianMessageThreadState",
            "MessageDispatchEnvelopeSnapshot",
            "MessageDeliveryEvidenceBundleSnapshot",
            "ThreadExpectationEnvelopeSnapshot",
            "ThreadResolutionGateSnapshot",
            "MessagePatientReplySnapshot",
            "createPhase3ClinicianMessageKernelService(",
        ],
    )
    require_text(
        PACKAGE_INDEX,
        [
            "Phase3ClinicianMessageKernelService",
            'export * from "./phase3-clinician-message-kernel";',
        ],
    )
    require_text(
        PUBLIC_API_TEST,
        [
            "createPhase3ClinicianMessageKernelStore",
            "createPhase3ClinicianMessageKernelService",
        ],
    )
    require_text(
        DOMAIN_TEST,
        [
            "creates one clinician message thread and reuses it when the same message seed is replayed",
            "reuses the same MessageDispatchEnvelope for duplicate send on the same dispatch fence and thread version",
            "keeps provider acceptance separate from delivery truth until MessageDeliveryEvidenceBundle is written",
            "routes the patient reply through ClinicianMessageThread first and advances the expectation envelope to awaiting_review",
            "makes close and reopen legal only through ThreadResolutionGate and fresh expectation revisions",
        ],
    )
    require_text(
        COMMAND_API_SOURCE,
        [
            "PHASE3_CLINICIAN_MESSAGE_SERVICE_NAME",
            "workspace_task_create_message_thread",
            "verifyMessageWebhookSignature(",
            "recordProviderReceipt(",
            "settleResolutionGate(",
            "reply_assimilation",
        ],
    )
    require_text(
        SERVICE_DEFINITION,
        [
            "workspace_task_message_thread_current",
            "workspace_task_create_message_thread",
            "workspace_task_send_message_thread",
            "workspace_task_record_message_provider_receipt",
            "workspace_task_record_message_delivery_evidence",
            "workspace_task_ingest_message_reply",
            "workspace_task_settle_message_resolution_gate",
            "workspace_task_reopen_message_thread",
        ],
    )
    require_text(
        MIGRATION,
        [
            "phase3_clinician_message_threads",
            "phase3_message_dispatch_envelopes",
            "phase3_message_delivery_evidence_bundles",
            "phase3_thread_expectation_envelopes",
            "phase3_thread_resolution_gates",
            "phase3_message_patient_replies",
            "phase3_message_thread_outbox_entries",
        ],
    )
    require_text(
        INTEGRATION_TEST,
        [
            "publishes the 244 clinician message routes in the command-api route catalog",
            "creates the clinician message thread from the live seed and reuses one immutable MessageDispatchEnvelope for duplicate send",
            "keeps provider acceptance provisional until MessageDeliveryEvidenceBundle is written and rejects contradictory late failure evidence",
            "rejects unsigned provider receipts under the clinician message webhook policy",
            "routes the patient reply onto the current thread and emits the 237 assimilation hook before callback escalation",
            "closes only through ThreadResolutionGate and then reacquires a fresh lease on reopen",
        ],
    )


def validate_scripts() -> None:
    require_text(
        PACKAGE_JSON,
        ['"validate:244-clinician-message-domain": "python3 ./tools/analysis/validate_244_clinician_message_domain.py"'],
    )
    require_text(
        ROOT_SCRIPT_UPDATES,
        ['"validate:244-clinician-message-domain": "python3 ./tools/analysis/validate_244_clinician_message_domain.py"'],
    )


def main() -> None:
    validate_checklist()
    validate_docs()
    validate_contract_and_analysis()
    validate_sources()
    validate_scripts()


if __name__ == "__main__":
    main()
