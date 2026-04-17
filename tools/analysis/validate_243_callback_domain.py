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

ARCH_DOC = ROOT / "docs" / "architecture" / "243_callback_case_state_machine_and_attempt_policies.md"
SECURITY_DOC = ROOT / "docs" / "security" / "243_callback_webhook_verification_and_voicemail_controls.md"
OPS_DOC = ROOT / "docs" / "operations" / "243_callback_attempt_window_and_retry_runbook.md"

STATE_MATRIX = ROOT / "data" / "analysis" / "243_callback_state_and_retry_matrix.csv"
REPLAY_MATRIX = ROOT / "data" / "analysis" / "243_voicemail_policy_and_provider_replay_cases.csv"
GAP_LOG = ROOT / "data" / "analysis" / "243_gap_log.json"

DOMAIN_SOURCE = ROOT / "packages" / "domains" / "triage_workspace" / "src" / "phase3-callback-kernel.ts"
PACKAGE_INDEX = ROOT / "packages" / "domains" / "triage_workspace" / "src" / "index.ts"
PUBLIC_API_TEST = ROOT / "packages" / "domains" / "triage_workspace" / "tests" / "public-api.test.ts"
DOMAIN_TEST = ROOT / "packages" / "domains" / "triage_workspace" / "tests" / "phase3-callback-kernel.test.ts"

COMMAND_API_SOURCE = ROOT / "services" / "command-api" / "src" / "phase3-callback-domain.ts"
SERVICE_DEFINITION = ROOT / "services" / "command-api" / "src" / "service-definition.ts"
MIGRATION = ROOT / "services" / "command-api" / "migrations" / "119_phase3_callback_case_domain.sql"
INTEGRATION_TEST = ROOT / "services" / "command-api" / "tests" / "phase3-callback-domain.integration.test.js"


def fail(message: str) -> None:
    raise SystemExit(f"[243-callback-domain] {message}")


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
        r"^- \[[Xx]\] par_243_phase3_track_backend_build_callback_case_state_machine_attempt_windows_and_voicemail_policy",
        checklist,
        re.MULTILINE,
    ):
        fail("task 243 checklist entry is not complete")


def validate_docs() -> None:
    require_text(
        ARCH_DOC,
        [
            "CallbackCase",
            "CallbackIntentLease",
            "CallbackAttemptRecord",
            "CallbackExpectationEnvelope",
            "CallbackOutcomeEvidenceBundle",
            "CallbackResolutionGate",
            "AdapterReceiptCheckpoint",
            "created -> queued -> scheduled -> ready_for_attempt",
        ],
    )
    require_text(
        SECURITY_DOC,
        [
            "phase3-callback-hmac-sha256-simulator.v1",
            "CALLBACK_WEBHOOK_SIGNATURE_REJECTED",
            "CALLBACK_VOICEMAIL_POLICY_BLOCKED",
            "voicemail_left",
            "Exact replay and semantic replay collapse onto the current `AdapterReceiptCheckpoint`.",
        ],
    )
    require_text(
        OPS_DOC,
        [
            ":create-callback-case",
            ":schedule",
            ":initiate-attempt",
            ":record-provider-receipt",
            ":settle-resolution-gate",
            "contact_route_repair_pending",
        ],
    )


def validate_analysis() -> None:
    state_rows = load_csv(STATE_MATRIX)
    if {row["caseId"] for row in state_rows} != {
        "CREATE_TO_QUEUED",
        "SCHEDULE_WITH_ACTIVE_LEASE",
        "RESCHEDULE_REACQUIRE_AFTER_DRIFT",
        "READY_FOR_ATTEMPT_ARMED",
        "ROUTE_INVALID_TO_REPAIR",
        "NO_ANSWER_TO_RETRY",
        "MAX_ATTEMPTS_TO_ESCALATE",
        "ANSWERED_TO_COMPLETE",
    }:
        fail("243_callback_state_and_retry_matrix.csv drifted from the required callback coverage")

    replay_rows = load_csv(REPLAY_MATRIX)
    if {row["caseId"] for row in replay_rows} != {
        "VOICEMAIL_AMBIGUOUS_POLICY_BLOCKS",
        "VOICEMAIL_ALLOWED_REQUIRES_CAPTURE_AND_SCRIPT",
        "PROVIDER_RECEIPT_EXACT_REPLAY_REUSES_CHECKPOINT",
        "PROVIDER_RECEIPT_SEMANTIC_REPLAY_REUSES_CHECKPOINT",
        "PROVIDER_RECEIPT_SCOPE_DRIFT_OPENS_COLLISION_REVIEW",
        "INVALID_SIGNATURE_FAILS_CLOSED",
    }:
        fail("243_voicemail_policy_and_provider_replay_cases.csv drifted from the required replay coverage")

    gap_log = load_json(GAP_LOG)
    if gap_log.get("status") != "accepted_gaps_only":
        fail("243_gap_log.json must declare accepted_gaps_only status")
    if len(gap_log.get("gaps", [])) != 2:
        fail("243_gap_log.json must contain exactly two accepted gaps")
    for gap in gap_log["gaps"]:
        for field in [
            "gapId",
            "missingSurface",
            "expectedOwnerTask",
            "temporaryFallback",
            "riskIfUnresolved",
            "followUpAction",
        ]:
            if not gap.get(field):
                fail(f"243 gap entry missing {field}")


def validate_sources() -> None:
    require_text(
        DOMAIN_SOURCE,
        [
            "CallbackCaseState",
            "CallbackIntentLeaseSnapshot",
            "CallbackAttemptRecordSnapshot",
            "resolveCallbackAttemptWindowPolicy(",
            "resolveCallbackVoicemailPolicy(",
            "createPhase3CallbackKernelService(",
        ],
    )
    require_text(
        PACKAGE_INDEX,
        [
            "Phase3CallbackKernelService",
            'export * from "./phase3-callback-kernel";',
        ],
    )
    require_text(
        PUBLIC_API_TEST,
        [
            "createPhase3CallbackKernelStore",
            "createPhase3CallbackKernelService",
        ],
    )
    require_text(
        DOMAIN_TEST,
        [
            "creates one callback case and reuses it when the same callback seed is replayed",
            "makes each callback attempt exclusive and returns the same CallbackAttemptRecord for duplicate initiation",
            "resolves voicemail policy with safe defaults and requires explicit evidence before voicemail_left can count",
        ],
    )
    require_text(
        COMMAND_API_SOURCE,
        [
            "PHASE3_CALLBACK_SERVICE_NAME",
            "workspace_task_create_callback_case",
            "verifyCallbackWebhookSignature(",
            "recordProviderReceipt(",
            "settleResolutionGate(",
        ],
    )
    require_text(
        SERVICE_DEFINITION,
        [
          "workspace_task_callback_case_current",
          "workspace_task_create_callback_case",
          "workspace_task_schedule_callback_case",
          "workspace_task_record_callback_provider_receipt",
          "workspace_task_settle_callback_resolution_gate",
          "workspace_task_reopen_callback_case",
        ],
    )
    require_text(
        MIGRATION,
        [
            "phase3_callback_cases",
            "phase3_callback_intent_leases",
            "phase3_callback_attempt_records",
            "phase3_callback_expectation_envelopes",
            "phase3_callback_outcome_evidence_bundles",
            "phase3_callback_resolution_gates",
        ],
    )
    require_text(
        INTEGRATION_TEST,
        [
            "publishes the 243 callback routes in the command-api route catalog",
            "creates the callback case from the live callback seed and rotates the intent lease when material schedule drift occurs",
            "reuses the same CallbackAttemptRecord for duplicate initiation and collapses exact provider receipt replay onto one checkpoint",
            "rejects unsigned provider receipts under the callback webhook policy",
            "blocks voicemail_left until an explicit allowed voicemail policy and evidence chain are present",
        ],
    )


def validate_scripts() -> None:
    require_text(
        PACKAGE_JSON,
        ['"validate:243-callback-domain": "python3 ./tools/analysis/validate_243_callback_domain.py"'],
    )
    require_text(
        ROOT_SCRIPT_UPDATES,
        ['"validate:243-callback-domain": "python3 ./tools/analysis/validate_243_callback_domain.py"'],
    )


def main() -> None:
    validate_checklist()
    validate_docs()
    validate_analysis()
    validate_sources()
    validate_scripts()


if __name__ == "__main__":
    main()
