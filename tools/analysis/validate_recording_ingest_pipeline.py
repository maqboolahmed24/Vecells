#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import re
from pathlib import Path
from typing import Any

from root_script_updates import ROOT_SCRIPT_UPDATES


ROOT = Path(__file__).resolve().parents[2]
CHECKLIST = ROOT / "prompt" / "checklist.md"
ROOT_PACKAGE = ROOT / "package.json"
SOURCE = (
    ROOT
    / "services"
    / "command-api"
    / "src"
    / "telephony-recording-ingest-pipeline.ts"
)
MIGRATION = (
    ROOT
    / "services"
    / "command-api"
    / "migrations"
    / "105_phase2_recording_ingest_pipeline.sql"
)
SERVICE_DEFINITION = ROOT / "services" / "command-api" / "src" / "service-definition.ts"
BACKEND_TEST = (
    ROOT
    / "services"
    / "command-api"
    / "tests"
    / "telephony-recording-ingest-pipeline.integration.test.js"
)
ARCH_DOC = ROOT / "docs" / "architecture" / "190_recording_ingest_and_audio_storage_design.md"
API_DOC = ROOT / "docs" / "api" / "190_recording_fetch_and_audio_reference_contract.md"
SECURITY_DOC = ROOT / "docs" / "security" / "190_audio_quarantine_scan_and_retention_controls.md"
FETCH_JOB_SCHEMA = ROOT / "data" / "contracts" / "190_recording_fetch_job.schema.json"
ASSESSMENT_SCHEMA = (
    ROOT / "data" / "contracts" / "190_recording_asset_quarantine_assessment.schema.json"
)
SETTLEMENT_SCHEMA = ROOT / "data" / "contracts" / "190_audio_ingest_settlement.schema.json"
DOCUMENT_LINK_SCHEMA = (
    ROOT / "data" / "contracts" / "190_recording_document_reference_link.schema.json"
)
RETRY_MATRIX = ROOT / "data" / "analysis" / "190_recording_fetch_retry_backoff_matrix.csv"
FORMAT_POLICY = ROOT / "data" / "analysis" / "190_audio_format_and_scan_policy.json"
NO_ORPHAN_CASES = ROOT / "data" / "analysis" / "190_no_orphan_replay_cases.json"
GAP_ARTIFACT = ROOT / "PARALLEL_INTERFACE_GAP_PHASE2_RECORDING_INGEST.json"

GAP_FILES = [
    ROOT / "data" / "analysis" / "GAP_RESOLVED_PHASE2_RECORDING_TIMEOUT_RETRY_LAW.json",
    ROOT / "data" / "analysis" / "GAP_RESOLVED_PHASE2_RECORDING_AUDIO_FORMAT_POLICY.json",
    ROOT
    / "data"
    / "analysis"
    / "GAP_RESOLVED_PHASE2_RECORDING_DUPLICATE_ASSET_DETECTION.json",
    ROOT
    / "data"
    / "analysis"
    / "GAP_RESOLVED_PHASE2_RECORDING_PARTIAL_PROGRESS_CLEANUP.json",
    ROOT / "data" / "analysis" / "GAP_RESOLVED_PHASE2_RECORDING_PROVIDER_URL_LEAKAGE.json",
]

SOURCE_MARKERS = {
    "TelephonyRecordingIngestPipeline",
    "RecordingFetchJob",
    "RecordingAssetQuarantineAssessment",
    "GovernedAudioObject",
    "AudioIngestSettlement",
    "RecordingDocumentReferenceLink",
    "ProviderRecordingAdapter",
    "RecordingScannerAdapter",
    "recordingAudioFormatPolicy",
    "recordingFetchTimeoutRetryLaw",
    "allowedRecordingAudioMediaTypes",
    "createInMemoryProviderRecordingAdapter",
    "createStaticRecordingScanner",
    "scheduleRecordingFetchJob",
    "drainRecordingFetchJobs",
    "repairNoOrphanRecordingIngest",
    "artifact://recording-audio",
    "REC_190_DOCUMENT_REFERENCE_CREATED_EXACT_ONCE",
    "REC_190_DUPLICATE_ASSET_REUSED_EXISTING_GOVERNED_OBJECT",
    "REC_190_NO_ORPHAN_REPLAY_REPAIRED_DOCUMENT_REFERENCE",
    "REC_190_PROVIDER_TIMEOUT_RETRY_LAW_EXHAUSTED",
    "GAP_RESOLVED_PHASE2_RECORDING_PROVIDER_URL_LEAKAGE",
}

MIGRATION_MARKERS = {
    "phase2_recording_fetch_jobs",
    "phase2_recording_quarantine_objects",
    "phase2_recording_asset_quarantine_assessments",
    "phase2_recording_governed_audio_objects",
    "phase2_recording_document_reference_links",
    "phase2_recording_ingest_settlements",
    "phase2_recording_manual_review_dispositions",
    "TelephonyRecordingIngestPipeline",
    "phase2-recording-ingest-190.v1",
    "phase2-recording-fetch-retry-190.v1",
    "phase2-audio-format-scan-policy-190.v1",
    "artifact://recording-audio/%",
}

SERVICE_MARKERS = {
    "telephony_recording_fetch_job_schedule",
    "/internal/telephony/call-sessions/{callSessionRef}/recordings/fetch-jobs",
    "RecordingFetchJobContract",
    "telephony_recording_fetch_worker_drain",
    "/internal/telephony/recording-fetch-worker/drain",
    "AudioIngestSettlementContract",
    "telephony_recording_document_reference_current",
    "/internal/telephony/call-sessions/{callSessionRef}/recordings",
    "RecordingDocumentReferenceProjectionContract",
}

DOC_MARKERS = {
    "TelephonyRecordingIngestPipeline",
    "RecordingFetchJob",
    "RecordingAssetQuarantineAssessment",
    "GovernedAudioObject",
    "RecordingDocumentReferenceLink",
    "AudioIngestSettlement",
    "DocumentReference",
    "artifact://recording-audio",
    "provider URLs",
    "quarantine",
    "exact-once",
    "no orphan",
}

SCHEMA_FILES = [
    FETCH_JOB_SCHEMA,
    ASSESSMENT_SCHEMA,
    SETTLEMENT_SCHEMA,
    DOCUMENT_LINK_SCHEMA,
]

GAP_IDS = {
    "GAP_RESOLVED_PHASE2_RECORDING_TIMEOUT_RETRY_LAW",
    "GAP_RESOLVED_PHASE2_RECORDING_AUDIO_FORMAT_POLICY",
    "GAP_RESOLVED_PHASE2_RECORDING_DUPLICATE_ASSET_DETECTION",
    "GAP_RESOLVED_PHASE2_RECORDING_PARTIAL_PROGRESS_CLEANUP",
    "GAP_RESOLVED_PHASE2_RECORDING_PROVIDER_URL_LEAKAGE",
}


def fail(message: str) -> None:
    raise SystemExit(f"[recording-ingest-pipeline] {message}")


def read(path: Path) -> str:
    if not path.exists():
        fail(f"missing required artifact: {path.relative_to(ROOT)}")
    return path.read_text(encoding="utf-8")


def load_json(path: Path) -> Any:
    try:
        return json.loads(read(path))
    except json.JSONDecodeError as error:
        fail(f"{path.relative_to(ROOT)} is invalid JSON: {error}")


def require_markers(label: str, text: str, markers: set[str]) -> None:
    missing = sorted(marker for marker in markers if marker not in text)
    if missing:
        fail(f"{label} missing markers: {', '.join(missing)}")


def forbid_markers(label: str, text: str, markers: set[str]) -> None:
    present = sorted(marker for marker in markers if marker in text)
    if present:
        fail(f"{label} contains forbidden markers: {', '.join(present)}")


def checklist_state(task_prefix: str) -> str:
    pattern = re.compile(r"- \[([ Xx\-])\] ([^ ]+)")
    for line in read(CHECKLIST).splitlines():
        match = pattern.match(line.strip())
        if match and match.group(2).startswith(f"{task_prefix}_"):
            marker = match.group(1)
            return "X" if marker == "x" else marker
    fail(f"checklist row missing for {task_prefix}")


def validate_checklist() -> None:
    if checklist_state("par_189") != "X":
        fail("par_189 must be complete before par_190")
    if checklist_state("par_190") not in {"-", "X"}:
        fail("par_190 must be claimed or complete")


def validate_source() -> None:
    source = read(SOURCE)
    require_markers("source", source, SOURCE_MARKERS | GAP_IDS)
    forbid_markers(
        "source",
        source,
        {
            "providerUrl",
            "signedUrl",
            "rawProviderUrl",
            "Request.patientRef",
            "Episode.patientRef",
            "PARALLEL_INTERFACE_GAP_PHASE2_RECORDING_INGEST.json",
        },
    )
    if source.count("documentReferenceRef") < 12:
        fail("source must carry DocumentReference linkage through job, settlement, and replay")
    if source.count("quarantine") < 20:
        fail("source must model quarantine before governed storage")
    if source.count("terminalOutcome") < 10:
        fail("source must persist terminal outcomes for exact replay")


def validate_migration() -> None:
    require_markers("migration", read(MIGRATION), MIGRATION_MARKERS)


def validate_service_definition() -> None:
    require_markers("service definition", read(SERVICE_DEFINITION), SERVICE_MARKERS)


def validate_docs() -> None:
    combined = "\n".join(read(path) for path in [ARCH_DOC, API_DOC, SECURITY_DOC])
    require_markers("docs", combined, DOC_MARKERS)


def validate_schemas() -> None:
    for path in SCHEMA_FILES:
        payload = load_json(path)
        required = set(payload.get("required", []))
        if payload.get("type") != "object" or payload.get("additionalProperties") is not False:
            fail(f"{path.relative_to(ROOT)} must be a closed object schema")
        if "recordedBy" not in required:
            fail(f"{path.relative_to(ROOT)} must require recordedBy")
    if load_json(FETCH_JOB_SCHEMA)["properties"]["retryPolicyVersion"]["const"] != (
        "phase2-recording-fetch-retry-190.v1"
    ):
        fail("fetch job schema must pin retry policy version")
    document_schema = load_json(DOCUMENT_LINK_SCHEMA)
    artifact_pattern = document_schema["properties"]["artifactUrl"]["pattern"]
    if artifact_pattern != "^artifact://recording-audio/":
        fail("document link schema must expose only artifact:// recording audio URLs")


def validate_analysis() -> None:
    with RETRY_MATRIX.open(newline="", encoding="utf-8") as handle:
        rows = list(csv.DictReader(handle))
    if len(rows) < 5:
        fail("retry backoff matrix must cover retry and terminal cases")
    outcomes = {row["terminal_outcome"] for row in rows}
    if {"pending", "recording_missing"} - outcomes:
        fail("retry backoff matrix must include pending and recording_missing outcomes")

    policy = load_json(FORMAT_POLICY)
    if policy.get("providerUrlPersistence") != "forbidden":
        fail("format policy must forbid provider URL persistence")
    allowed = set(policy.get("allowedMediaTypes", []))
    if {"audio/wav", "audio/mpeg", "audio/mp4", "audio/ogg", "audio/webm"} - allowed:
        fail("format policy missing allowed audio media types")
    if policy.get("hardMaxDurationSeconds") != 120 or policy.get("maxByteSize") != 26214400:
        fail("format policy must pin duration and byte limits")

    casebook = load_json(NO_ORPHAN_CASES)
    cases = {case.get("caseId") for case in casebook.get("cases", [])}
    expected_cases = {
        "duplicate_provider_recording_callback",
        "terminal_success_replayed",
        "governed_object_without_document_reference",
        "blocked_quarantine",
    }
    if expected_cases - cases:
        fail("no-orphan replay casebook missing required cases")


def validate_gap_resolutions() -> None:
    for path in GAP_FILES:
        payload = load_json(path)
        if payload.get("gapId") not in GAP_IDS:
            fail(f"{path.relative_to(ROOT)} has unexpected gapId")
        for key in (
            "taskId",
            "sourceAmbiguity",
            "decisionTaken",
            "whyThisFitsTheBlueprint",
            "operationalRisk",
            "followUpIfPolicyChanges",
        ):
            if not payload.get(key):
                fail(f"{path.relative_to(ROOT)} missing {key}")


def validate_tests() -> None:
    test = read(BACKEND_TEST)
    require_markers(
        "backend tests",
        test,
        {
            "duplicate provider recording events",
            "delayed provider availability",
            "missing provider assets",
            "corrupt assets",
            "unsupported audio formats",
            "malware or unreadable scan outcomes",
            "same terminal settlement",
            "repairs partial governed-object progress",
            "expectNoProviderLeak",
        },
    )


def validate_scripts() -> None:
    package = json.loads(read(ROOT_PACKAGE))
    scripts = package.get("scripts", {})
    expected_script = "python3 ./tools/analysis/validate_recording_ingest_pipeline.py"
    if scripts.get("validate:recording-ingest-pipeline") != expected_script:
        fail("package.json missing validate:recording-ingest-pipeline script")
    if ROOT_SCRIPT_UPDATES.get("validate:recording-ingest-pipeline") != expected_script:
        fail("root_script_updates missing validate:recording-ingest-pipeline")
    expected_chain = (
        "pnpm validate:identity-audit-and-masking && "
        "pnpm validate:telephony-edge-ingestion && "
        "pnpm validate:call-session-state-machine && "
        "pnpm validate:telephony-verification-pipeline && "
        "pnpm validate:recording-ingest-pipeline && "
        "pnpm validate:telephony-readiness-pipeline && "
        "pnpm validate:telephony-continuation-grants && "
        "pnpm validate:telephony-convergence && "
        "pnpm validate:phone-followup-resafety && "
        "pnpm validate:195-auth-frontend && "
        "pnpm validate:audit-worm"
    )
    for name in ("bootstrap", "check"):
        if expected_chain not in scripts.get(name, ""):
            fail(f"package.json {name} chain missing recording ingest validator")
        if expected_chain not in ROOT_SCRIPT_UPDATES.get(name, ""):
            fail(f"root_script_updates {name} chain missing recording ingest validator")


def validate_gap_artifact_absent() -> None:
    if GAP_ARTIFACT.exists():
        fail("unexpected fallback gap artifact exists; coherent sibling seams were available")


def main() -> None:
    validate_checklist()
    validate_source()
    validate_migration()
    validate_service_definition()
    validate_docs()
    validate_schemas()
    validate_analysis()
    validate_gap_resolutions()
    validate_tests()
    validate_scripts()
    validate_gap_artifact_absent()
    print("[recording-ingest-pipeline] validation passed")


if __name__ == "__main__":
    main()

