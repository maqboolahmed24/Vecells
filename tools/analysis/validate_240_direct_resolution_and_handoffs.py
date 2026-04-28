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

ARCH_DOC = ROOT / "docs" / "architecture" / "240_direct_resolution_and_handoff_seed_generation.md"
SECURITY_DOC = ROOT / "docs" / "security" / "240_direct_consequence_handoff_and_epoch_integrity.md"
OPS_DOC = ROOT / "docs" / "operations" / "240_direct_resolution_and_handoff_seed_runbook.md"

DIRECT_CASES = ROOT / "data" / "analysis" / "240_direct_resolution_cases.csv"
INTEGRITY_CASES = ROOT / "data" / "analysis" / "240_handoff_seed_integrity_cases.csv"
GAP_LOG = ROOT / "data" / "analysis" / "240_gap_log.json"

DOMAIN_SOURCE = ROOT / "packages" / "domains" / "triage_workspace" / "src" / "phase3-direct-resolution-kernel.ts"
DOMAIN_TEST = ROOT / "packages" / "domains" / "triage_workspace" / "tests" / "phase3-direct-resolution-kernel.test.ts"
PACKAGE_INDEX = ROOT / "packages" / "domains" / "triage_workspace" / "src" / "index.ts"
PUBLIC_API_TEST = ROOT / "packages" / "domains" / "triage_workspace" / "tests" / "public-api.test.ts"

COMMAND_API_SOURCE = ROOT / "services" / "command-api" / "src" / "phase3-direct-resolution-handoffs.ts"
SERVICE_DEFINITION = ROOT / "services" / "command-api" / "src" / "service-definition.ts"
MIGRATION = ROOT / "services" / "command-api" / "migrations" / "116_phase3_direct_resolution_and_handoff_seeds.sql"
INTEGRATION_TEST = ROOT / "services" / "command-api" / "tests" / "phase3-direct-resolution-handoffs.integration.test.js"


def fail(message: str) -> None:
    raise SystemExit(f"[240-direct-resolution-handoffs] {message}")


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
        r"^- \[[Xx]\] par_240_phase3_track_backend_build_direct_resolution_and_downstream_handoff_seed_generation",
        checklist,
        re.MULTILINE,
    ):
        fail("task 240 checklist entry is not complete")


def validate_docs() -> None:
    require_text(
        ARCH_DOC,
        [
            "DecisionEpoch",
            "CallbackCaseSeed",
            "ClinicianMessageSeed",
            "BookingIntent",
            "PharmacyIntent",
            "LineageCaseLink",
            "decisionEpochRef",
            "recovery_only",
            "TriageOutcomePresentationArtifact",
        ],
    )
    require_text(
        SECURITY_DOC,
        [
            "Approval-required consequence",
            "recovery_only",
            "OutboundNavigationGrant",
            "outbox-safe",
            "simulator-backed",
        ],
    )
    require_text(
        OPS_DOC,
        [
            ":commit-direct-resolution",
            ":publish-artifact",
            ":reconcile-direct-resolution-supersession",
            ":drain-worker",
            "BookingIntent",
            "PharmacyIntent",
        ],
    )


def validate_analysis() -> None:
    direct_cases = load_csv(DIRECT_CASES)
    if {row["caseId"] for row in direct_cases} != {
        "CALLBACK_DIRECT",
        "MESSAGE_DIRECT",
        "SELF_CARE_DIRECT",
        "ADMIN_DIRECT",
        "BOOKING_HANDOFF",
        "PHARMACY_HANDOFF",
    }:
        fail("240_direct_resolution_cases.csv drifted from the required endpoint coverage")

    integrity_cases = load_csv(INTEGRITY_CASES)
    if {row["caseId"] for row in integrity_cases} != {
        "CALLBACK_LINKED",
        "MESSAGE_LINKED",
        "ADMIN_LINKED",
        "BOOKING_ATOMIC",
        "PHARMACY_ATOMIC",
        "SELF_CARE_EPOCH",
    }:
        fail("240_handoff_seed_integrity_cases.csv drifted from the required handoff integrity matrix")

    gap_log = load_json(GAP_LOG)
    gaps = gap_log.get("gaps", [])
    if len(gaps) != 2:
        fail("240_gap_log.json must contain exactly two accepted gaps")
    for gap in gaps:
        for field in [
            "missingSurface",
            "expectedOwnerTask",
            "temporaryFallback",
            "riskIfUnresolved",
            "followUpAction",
        ]:
            if not gap.get(field):
                fail(f"240 gap entry missing {field}")


def validate_sources() -> None:
    require_text(
        DOMAIN_SOURCE,
        [
            "CallbackCaseSeedSnapshot",
            "ClinicianMessageSeedSnapshot",
            "BookingIntentSnapshot",
            "PharmacyIntentSnapshot",
            "DirectResolutionSettlementSnapshot",
            "reconcileSupersededConsequences",
            "lifecycle_handoff_active",
        ],
    )
    require_text(
        PACKAGE_INDEX,
        [
            "CallbackCaseSeed",
            "ClinicianMessageSeed",
            "DirectResolutionSettlement",
            "PatientStatusProjectionUpdate",
            "Phase3DirectResolutionKernelService",
            'export * from "./phase3-direct-resolution-kernel";',
        ],
    )
    require_text(
        PUBLIC_API_TEST,
        [
            "createPhase3DirectResolutionKernelStore",
            "createPhase3DirectResolutionKernelService",
        ],
    )
    require_text(
        DOMAIN_TEST,
        [
            "keeps one authoritative settlement and deduplicates replay by task plus DecisionEpoch",
            "degrades stale consequence state to recovery_only and emits one recovery-required projection",
            "drains pending outbox effects exactly once and records the dispatch witness",
        ],
    )
    require_text(
        COMMAND_API_SOURCE,
        [
            "PHASE3_DIRECT_RESOLUTION_SERVICE_NAME",
            "phase3DirectResolutionRoutes",
            "commitDirectResolution",
            "markEndpointSelected",
            "createBookingIntent",
            "createCallbackSeed",
            "createPatientStatusProjection",
            "reconcileStaleConsequencesIfNeeded",
        ],
    )
    require_text(
        SERVICE_DEFINITION,
        [
            "workspace_task_direct_resolution_current",
            "workspace_task_commit_direct_resolution",
            "workspace_task_publish_outcome_artifact",
            "workspace_task_reconcile_stale_direct_resolution",
            "workspace_direct_resolution_worker_drain",
        ],
    )
    require_text(
        MIGRATION,
        [
            "phase3_callback_case_seeds",
            "phase3_clinician_message_seeds",
            "phase3_booking_intents",
            "phase3_pharmacy_intents",
            "phase3_direct_resolution_settlements",
            "phase3_direct_resolution_outbox_entries",
        ],
    )
    require_text(
        INTEGRATION_TEST,
        [
            "commits callback consequence once, keeps replay idempotent, and closes the triage task only after settlement",
            "commits self-care consequence through the summary-first artifact path and emits closure evaluation",
            "blocks booking handoff seed until approval truth is present, then creates the proposed lineage link in the same commit path",
        ],
    )


def validate_scripts() -> None:
    require_text(
        PACKAGE_JSON,
        ['"validate:240-direct-resolution-handoffs": "python3 ./tools/analysis/validate_240_direct_resolution_and_handoffs.py"'],
    )
    require_text(
        ROOT_SCRIPT_UPDATES,
        ['"validate:240-direct-resolution-handoffs": "python3 ./tools/analysis/validate_240_direct_resolution_and_handoffs.py"'],
    )


def main() -> None:
    validate_checklist()
    validate_docs()
    validate_analysis()
    validate_sources()
    validate_scripts()


if __name__ == "__main__":
    main()
