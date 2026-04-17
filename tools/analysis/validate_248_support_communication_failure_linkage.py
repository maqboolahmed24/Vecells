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

ARCH_DOC = ROOT / "docs" / "architecture" / "248_support_linkage_for_callback_and_message_failures.md"
SECURITY_DOC = ROOT / "docs" / "security" / "248_support_masking_and_resolution_artifact_controls.md"
CONTRACT = ROOT / "data" / "contracts" / "248_support_communication_failure_contract.json"
ATTACH_MATRIX = ROOT / "data" / "analysis" / "248_support_attach_vs_create_matrix.csv"
CASE_FILE = ROOT / "data" / "analysis" / "248_manual_handoff_and_resolution_cases.json"
GAP_LOG = ROOT / "data" / "analysis" / "248_gap_log.json"

DOMAIN_SOURCE = ROOT / "packages" / "domains" / "support" / "src" / "phase3-communication-failure-linkage.ts"
DOMAIN_INDEX = ROOT / "packages" / "domains" / "support" / "src" / "index.ts"
DOMAIN_TEST = ROOT / "packages" / "domains" / "support" / "tests" / "phase3-communication-failure-linkage.test.ts"
SERVICE_SOURCE = ROOT / "services" / "command-api" / "src" / "phase3-support-communication-linkage.ts"
SERVICE_DEFINITION = ROOT / "services" / "command-api" / "src" / "service-definition.ts"
SUPPORT_LINEAGE_SOURCE = ROOT / "services" / "command-api" / "src" / "support-lineage-ticket-subject-history.ts"
MIGRATION = ROOT / "services" / "command-api" / "migrations" / "124_phase3_support_communication_failure_linkage.sql"
INTEGRATION_TEST = ROOT / "services" / "command-api" / "tests" / "phase3-support-communication-linkage.integration.test.js"


def fail(message: str) -> None:
    raise SystemExit(f"[248-support-communication-linkage] {message}")


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
        r"^- \[[Xx-]\] par_248_phase3_track_backend_build_support_handoff_and_resolution_linkage_for_callback_and_message_failures",
        checklist,
        re.MULTILINE,
    ):
        fail("task 248 checklist entry is missing")


def validate_docs() -> None:
    require_text(
        ARCH_DOC,
        [
            "one canonical `SupportLineageBinding`",
            "`SupportActionRecord`, `SupportActionSettlement`, and `SupportResolutionSnapshot`",
            "MessageDispatchEnvelope",
            "CallbackCase",
            "reuses the existing live path",
        ],
    )
    require_text(
        SECURITY_DOC,
        [
            "Durable support summaries require `SupportLineageArtifactBinding`.",
            "Local support acknowledgement does not calm the patient thread.",
            "stale_recoverable",
            "`manual_handoff_required` is explicit and provenance-bound.",
        ],
    )


def validate_contract_and_analysis() -> None:
    contract = load_json(CONTRACT)
    if contract.get("schemaVersion") != "248.phase3.support-communication-linkage.v1":
        fail("248 contract schemaVersion drifted")
    if contract.get("serviceName") != "Phase3SupportCommunicationLinkageApplication":
        fail("248 contract serviceName drifted")
    if contract.get("communicationDomains") != [
        "callback_case",
        "clinician_message_thread",
    ]:
        fail("248 contract communicationDomains drifted")

    rows = load_csv(ATTACH_MATRIX)
    if {row["caseId"] for row in rows} != {
        "MESSAGE_FAILURE_CREATES_TICKET",
        "MESSAGE_FAILURE_ATTACHES_EXISTING",
        "CALLBACK_FAILURE_CREATES_CALLBACK_BOUND_LINEAGE",
        "STALE_TUPLE_FAILS_CLOSED",
        "AWAITING_EXTERNAL_STAYS_PROVISIONAL",
        "MANUAL_HANDOFF_ACCEPTED_PUBLISHES_RESOLUTION",
    }:
        fail("248 attach/create matrix drifted from required cases")

    cases = load_json(CASE_FILE)
    if {case["caseId"] for case in cases.get("cases", [])} != {
        "MANUAL_HANDOFF_NOT_DURABLE_BEFORE_ACCEPTED_TRANSFER",
        "MANUAL_HANDOFF_ACCEPTED_TRANSFER_DURABLE",
        "STALE_RECOVERABLE_SUMMARY_REQUIRES_ARTIFACT_BINDING",
        "SUPPORT_NOTE_CANNOT_CALM_MESSAGE_FAILURE",
    }:
        fail("248 handoff and resolution cases drifted from required set")

    gap_log = load_json(GAP_LOG)
    if gap_log.get("status") != "accepted_gaps_only":
        fail("248 gap log must declare accepted_gaps_only")
    if len(gap_log.get("gaps", [])) != 2:
        fail("248 gap log must contain exactly two accepted gaps")


def validate_sources() -> None:
    require_text(
        DOMAIN_SOURCE,
        [
            "SUPPORT_COMMUNICATION_FAILURE_LINKAGE_SERVICE_NAME",
            "buildSupportCommunicationHashBundle(",
            "normalizeSupportCommunicationSettlement(",
            "canPublishSupportResolutionSnapshot(",
        ],
    )
    require_text(
        DOMAIN_INDEX,
        [
            'canonicalName: "SupportCommunicationFailureLinkageService"',
            'canonicalName: "SupportResolutionSnapshotBuilder"',
            'export * from "./phase3-communication-failure-linkage"',
        ],
    )
    require_text(
        DOMAIN_TEST,
        [
            "keeps one stable failure-path key for the same governing communication tuple",
            "awaiting_external cannot publish a durable resolution summary",
            "requires accepted transfer for manual_handoff_required to become durable",
        ],
    )
    require_text(
        SERVICE_SOURCE,
        [
            "PHASE3_SUPPORT_COMMUNICATION_LINKAGE_SERVICE_NAME",
            "openOrAttachSupportCommunicationFailure(",
            "querySupportCommunicationFailureLinkage(",
            "recordSupportCommunicationAction(",
            "publishSupportResolutionSnapshot(",
            "SupportResolutionSnapshot",
        ],
    )
    require_text(
        SERVICE_DEFINITION,
        [
            "workspace_task_open_support_communication_failure",
            "support_ticket_communication_failure_linkage_current",
            "support_ticket_record_communication_action",
            "support_ticket_publish_resolution_snapshot",
        ],
    )
    require_text(
        SUPPORT_LINEAGE_SOURCE,
        [
            "export interface SupportLineageFixture",
        ],
    )
    require_text(
        MIGRATION,
        [
            "phase3_support_tickets",
            "phase3_support_lineage_bindings",
            "phase3_support_lineage_scope_members",
            "phase3_support_lineage_artifact_bindings",
            "phase3_support_action_records",
            "phase3_support_action_settlements",
            "phase3_support_resolution_snapshots",
        ],
    )
    require_text(
        INTEGRATION_TEST,
        [
            "publishes the 248 support communication routes in the command-api route catalog",
            "opens one canonical support lineage for a message failure and reuses it on repeated entry",
            "opens callback failure support linkage on the callback chain instead of inventing a detached target",
            "fails closed when support tries to act on a stale governing tuple",
            "keeps provisional support acknowledgement subordinate to the live message failure chain",
            "requires authoritative settlement and provenance before publishing a durable resolution snapshot",
        ],
    )


def validate_scripts() -> None:
    require_text(
        PACKAGE_JSON,
        [
            '"validate:248-support-communication-linkage": "python3 ./tools/analysis/validate_248_support_communication_failure_linkage.py"'
        ],
    )
    require_text(
        ROOT_SCRIPT_UPDATES,
        [
            '"validate:248-support-communication-linkage": "python3 ./tools/analysis/validate_248_support_communication_failure_linkage.py"'
        ],
    )


def main() -> None:
    validate_checklist()
    validate_docs()
    validate_contract_and_analysis()
    validate_sources()
    validate_scripts()


if __name__ == "__main__":
    main()
