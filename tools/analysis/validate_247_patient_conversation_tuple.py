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

ARCH_DOC = ROOT / "docs" / "architecture" / "247_patient_conversation_tuple_and_visibility.md"
SECURITY_DOC = ROOT / "docs" / "security" / "247_patient_thread_visibility_and_redaction_controls.md"
OPS_DOC = ROOT / "docs" / "operations" / "247_conversation_projection_refresh_and_backfill_runbook.md"

CONTRACT = ROOT / "data" / "contracts" / "247_patient_conversation_tuple_contract.json"
MODE_MATRIX = ROOT / "data" / "analysis" / "247_visibility_modes_and_thread_drift_cases.csv"
CASE_FILE = ROOT / "data" / "analysis" / "247_backfill_and_cluster_grouping_cases.json"
GAP_LOG = ROOT / "data" / "analysis" / "247_gap_log.json"

DOMAIN_SOURCE = ROOT / "packages" / "domains" / "communications" / "src" / "phase3-patient-conversation-tuple.ts"
DOMAIN_INDEX = ROOT / "packages" / "domains" / "communications" / "src" / "index.ts"
DOMAIN_TEST = ROOT / "packages" / "domains" / "communications" / "tests" / "phase3-patient-conversation-tuple.test.ts"
SERVICE_SOURCE = ROOT / "services" / "command-api" / "src" / "phase3-patient-conversation-projections.ts"
SERVICE_DEFINITION = ROOT / "services" / "command-api" / "src" / "service-definition.ts"
MIGRATION = ROOT / "services" / "command-api" / "migrations" / "123_phase3_patient_conversation_tuple_and_visibility.sql"
INTEGRATION_TEST = ROOT / "services" / "command-api" / "tests" / "phase3-patient-conversation-projections.integration.test.js"


def fail(message: str) -> None:
    raise SystemExit(f"[247-patient-conversation-tuple] {message}")


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
        r"^- \[[Xx]\] par_247_phase3_track_backend_build_callback_message_visibility_and_patient_threading_projections",
        checklist,
        re.MULTILINE,
    ):
        fail("task 247 checklist entry is not complete")


def validate_docs() -> None:
    require_text(
        ARCH_DOC,
        [
            "PatientConversationCluster",
            "CommunicationEnvelope",
            "ConversationSubthreadProjection",
            "ConversationThreadProjection",
            "PatientCommunicationVisibilityProjection",
            "PatientReceiptEnvelope",
            "`247` to `246` handoff",
        ],
    )
    require_text(
        SECURITY_DOC,
        [
            "public_safe_summary",
            "authenticated_summary",
            "step_up_required",
            "suppressed_recovery_only",
            "Send success does not imply settled calmness.",
            "The cluster is never hidden just because content is redacted.",
        ],
    )
    require_text(
        OPS_DOC,
        [
            ":refresh-patient-conversation",
            ":backfill",
            "placeholder or recovery rows",
        ],
    )


def validate_contracts() -> None:
    contract = load_json(CONTRACT)
    if contract.get("schemaVersion") != "247.phase3.patient-conversation-tuple.v1":
        fail("247 contract schemaVersion drifted")
    if contract.get("serviceName") != "Phase3PatientConversationProjectionApplication":
        fail("247 contract serviceName drifted")
    if contract.get("tupleContractRef") != "data/contracts/246_247_conversation_tuple_contract.json":
        fail("247 contract tupleContractRef drifted")
    if contract.get("previewModes") != [
        "public_safe_summary",
        "authenticated_summary",
        "step_up_required",
        "suppressed_recovery_only",
    ]:
        fail("247 contract previewModes drifted")


def validate_analysis() -> None:
    rows = load_csv(MODE_MATRIX)
    if {row["caseId"] for row in rows} != {
        "AUTHENTICATED_FULL",
        "PUBLIC_SAFE_PLACEHOLDER",
        "STEP_UP_REQUIRED_BLOCK",
        "SUPPRESSED_RECOVERY_ONLY",
        "REQUEST_LINEAGE_DRIFT_STALE",
        "LEGACY_BACKFILL_PLACEHOLDER",
    }:
        fail("247 visibility mode matrix drifted from required cases")

    cases = load_json(CASE_FILE)
    if {case["caseId"] for case in cases.get("cases", [])} != {
        "UNIFIED_REQUEST_CLUSTER",
        "RECEIPT_FACTS_STAY_SEPARATE",
        "LEGACY_HISTORY_BACKFILLS_TO_PLACEHOLDER",
        "TUPLE_PUBLISH_FEEDS_246",
    }:
        fail("247 backfill and grouping cases drifted from required set")

    gap_log = load_json(GAP_LOG)
    if gap_log.get("status") != "accepted_gaps_only":
        fail("247 gap log must declare accepted_gaps_only")
    if len(gap_log.get("gaps", [])) != 2:
        fail("247 gap log must contain exactly two accepted gaps")


def validate_sources() -> None:
    require_text(
        DOMAIN_SOURCE,
        [
            "PHASE3_PATIENT_CONVERSATION_TUPLE_SERVICE_NAME",
            "PatientCommunicationVisibilityProjectionSnapshot",
            "CommunicationEnvelopeSnapshot",
            "ConversationSubthreadProjectionSnapshot",
            "ConversationThreadProjectionSnapshot",
            "PatientReceiptEnvelopeSnapshot",
            "materializeConversation(",
        ],
    )
    require_text(
        DOMAIN_INDEX,
        [
            'canonicalName: "CommunicationEnvelope"',
            'canonicalName: "ConversationThreadProjection"',
            'canonicalName: "PatientCommunicationVisibilityProjection"',
            'canonicalName: "PatientReceiptEnvelope"',
        ],
    )
    require_text(
        DOMAIN_TEST,
        [
            "groups callback, message, and more-info rows into one request-centered cluster with typed subthreads",
            "keeps receipt causality explicit instead of collapsing local acknowledgement, transport, and final outcome",
            "projects public-safe, step-up, and suppressed modes explicitly without hiding the cluster",
            "degrades stale lineage or legacy backfill into placeholder and recovery posture instead of calming the thread",
        ],
    )
    require_text(
        SERVICE_SOURCE,
        [
            "PHASE3_PATIENT_CONVERSATION_PROJECTION_SERVICE_NAME",
            "queryTaskPatientConversationProjection(",
            "queryClusterPatientConversationProjection(",
            "refreshTaskPatientConversationProjection(",
            "backfillLegacyConversationHistory(",
            "createPhase3PatientConversationTupleService(",
            "publishConversationTuple(",
        ],
    )
    require_text(
        SERVICE_DEFINITION,
        [
            "workspace_task_patient_conversation_projection_current",
            "patient_portal_conversation_thread_projection_current",
            "internal_workspace_task_refresh_patient_conversation_projection",
            "internal_conversation_legacy_backfill",
        ],
    )
    require_text(
        MIGRATION,
        [
            "phase3_patient_communication_envelopes",
            "phase3_patient_conversation_subthreads",
            "phase3_patient_conversation_threads",
            "phase3_patient_conversation_clusters",
            "phase3_patient_communication_visibility_projections",
            "phase3_patient_receipt_envelopes",
            "phase3_patient_conversation_legacy_backfill_records",
        ],
    )
    require_text(
        INTEGRATION_TEST,
        [
            "publishes the 247 patient-conversation routes in the command-api route catalog",
            "refreshes one request-centered cluster across callback, message, more-info, reminder, and repair, then publishes the 246 tuple consumer seam",
            "holds preview depth in explicit public-safe, step-up, and suppressed modes instead of dropping the cluster",
            "backfills legacy callback or message history into placeholder recovery posture before calm settled copy is allowed",
        ],
    )


def validate_scripts() -> None:
    require_text(
        PACKAGE_JSON,
        [
            '"validate:247-patient-conversation-tuple": "python3 ./tools/analysis/validate_247_patient_conversation_tuple.py"'
        ],
    )
    require_text(
        ROOT_SCRIPT_UPDATES,
        [
            '"validate:247-patient-conversation-tuple": "python3 ./tools/analysis/validate_247_patient_conversation_tuple.py"'
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
