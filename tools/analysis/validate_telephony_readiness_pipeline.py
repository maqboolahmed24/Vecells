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
SOURCE = ROOT / "services" / "command-api" / "src" / "telephony-readiness-pipeline.ts"
MIGRATION = (
    ROOT
    / "services"
    / "command-api"
    / "migrations"
    / "106_phase2_telephony_readiness_pipeline.sql"
)
SERVICE_DEFINITION = ROOT / "services" / "command-api" / "src" / "service-definition.ts"
BACKEND_TEST = (
    ROOT / "services" / "command-api" / "tests" / "telephony-readiness-pipeline.integration.test.js"
)
ARCH_DOC = (
    ROOT / "docs" / "architecture" / "191_transcript_readiness_and_evidence_assessment_design.md"
)
API_DOC = ROOT / "docs" / "api" / "191_telephony_safety_fact_and_readiness_contract.md"
SECURITY_DOC = ROOT / "docs" / "security" / "191_transcript_derivation_and_manual_review_controls.md"
JOB_SCHEMA = ROOT / "data" / "contracts" / "191_transcript_job_contract.schema.json"
DERIVATION_SCHEMA = ROOT / "data" / "contracts" / "191_transcript_derivation_package.schema.json"
FACTS_SCHEMA = ROOT / "data" / "contracts" / "191_telephony_safety_facts.schema.json"
MANUAL_REVIEW_SCHEMA = (
    ROOT / "data" / "contracts" / "191_manual_audio_review_queue_entry.schema.json"
)
REASON_CATALOG = ROOT / "data" / "contracts" / "191_evidence_readiness_reason_catalog.json"
TRUTH_TABLE = ROOT / "data" / "analysis" / "191_transcript_readiness_truth_table.csv"
TRANSITION_MATRIX = ROOT / "data" / "analysis" / "191_evidence_readiness_transition_matrix.csv"
DEGRADATION_CASES = ROOT / "data" / "analysis" / "191_degradation_and_manual_review_cases.json"
GAP_ARTIFACT = ROOT / "PARALLEL_INTERFACE_GAP_PHASE2_TELEPHONY_READINESS.json"

GAP_FILES = [
    ROOT
    / "data"
    / "analysis"
    / "GAP_RESOLVED_PHASE2_TELEPHONY_READINESS_COVERAGE_SUFFICIENCY_LAW.json",
    ROOT
    / "data"
    / "analysis"
    / "GAP_RESOLVED_PHASE2_TELEPHONY_READINESS_CONTRADICTION_RESOLUTION.json",
    ROOT
    / "data"
    / "analysis"
    / "GAP_RESOLVED_PHASE2_TELEPHONY_READINESS_TERMINAL_UNUSABILITY.json",
    ROOT
    / "data"
    / "analysis"
    / "GAP_RESOLVED_PHASE2_TELEPHONY_READINESS_RERUN_SUPERSESSION_PROJECTION.json",
    ROOT
    / "data"
    / "analysis"
    / "GAP_RESOLVED_PHASE2_TELEPHONY_READINESS_WORKER_COMPLETION_SHORTCUT.json",
]

SOURCE_MARKERS = {
    "TelephonyReadinessPipeline",
    "TranscriptJobContract",
    "EvidenceDerivationPackage",
    "TelephonySafetyFacts",
    "TelephonyTranscriptReadinessRecord",
    "TelephonyEvidenceReadinessAssessment",
    "ManualAudioReviewQueueEntry",
    "TranscriptProviderAdapter",
    "transcriptCoverageSufficiencyPolicy",
    "telephonyEvidenceReadinessReasonCatalog",
    "enqueueTranscriptJob",
    "drainTranscriptJobs",
    "enqueueTranscriptRerun",
    "assessEvidenceWithoutRecording",
    "artifact://telephony-transcript",
    "TEL_READY_191_WORKER_COMPLETION_NOT_PROMOTION_AUTHORITY",
    "TEL_READY_191_STRUCTURED_CAPTURE_CONFLICT",
    "TEL_READY_191_SAFETY_USABLE_READY_TO_PROMOTE",
    "GAP_RESOLVED_PHASE2_TELEPHONY_READINESS_WORKER_COMPLETION_SHORTCUT",
}

MIGRATION_MARKERS = {
    "phase2_transcript_jobs",
    "phase2_transcript_derivation_packages",
    "phase2_telephony_safety_facts",
    "phase2_telephony_transcript_readiness_records",
    "phase2_telephony_evidence_readiness_assessments",
    "phase2_manual_audio_review_queue_entries",
    "TelephonyReadinessPipeline",
    "phase2-transcript-readiness-191.v1",
    "phase2-evidence-readiness-191.v1",
    "phase2-telephony-fact-extractor-191.v1",
    "artifact://telephony-transcript/%",
}

SERVICE_MARKERS = {
    "telephony_transcript_job_enqueue",
    "/internal/telephony/call-sessions/{callSessionRef}/transcript-jobs",
    "TranscriptJobContract",
    "telephony_transcript_worker_drain",
    "/internal/telephony/transcript-worker/drain",
    "TranscriptDerivationPackageContract",
    "telephony_evidence_readiness_current",
    "/internal/telephony/call-sessions/{callSessionRef}/evidence-readiness",
    "TelephonyEvidenceReadinessProjectionContract",
    "telephony_manual_audio_review_queue",
    "ManualAudioReviewQueueEntryContract",
}

DOC_MARKERS = {
    "TelephonyReadinessPipeline",
    "TranscriptJobContract",
    "EvidenceDerivationPackage",
    "TelephonySafetyFacts",
    "TelephonyTranscriptReadinessRecord",
    "TelephonyEvidenceReadinessAssessment",
    "ManualAudioReviewQueueEntry",
    "worker completion is not readiness",
    "safety_usable",
    "manual_review_only",
    "unusable_terminal",
    "append",
}

GAP_IDS = {
    "GAP_RESOLVED_PHASE2_TELEPHONY_READINESS_COVERAGE_SUFFICIENCY_LAW",
    "GAP_RESOLVED_PHASE2_TELEPHONY_READINESS_CONTRADICTION_RESOLUTION",
    "GAP_RESOLVED_PHASE2_TELEPHONY_READINESS_TERMINAL_UNUSABILITY",
    "GAP_RESOLVED_PHASE2_TELEPHONY_READINESS_RERUN_SUPERSESSION_PROJECTION",
    "GAP_RESOLVED_PHASE2_TELEPHONY_READINESS_WORKER_COMPLETION_SHORTCUT",
}


def fail(message: str) -> None:
    raise SystemExit(f"[telephony-readiness-pipeline] {message}")


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
    if checklist_state("par_190") != "X":
        fail("par_190 must be complete before par_191")
    if checklist_state("par_191") not in {"-", "X"}:
        fail("par_191 must be claimed or complete")


def validate_source() -> None:
    source = read(SOURCE)
    require_markers("source", source, SOURCE_MARKERS | GAP_IDS)
    forbid_markers(
        "source",
        source,
        {
            "rawTranscript",
            "fullTranscript",
            "Request.patientRef",
            "Episode.patientRef",
            "PARALLEL_INTERFACE_GAP_PHASE2_TELEPHONY_READINESS.json",
        },
    )
    if source.count("TelephonyEvidenceReadinessAssessment") < 8:
        fail("source must make evidence readiness a first-class durable authority")
    if source.count("supersedes") < 15:
        fail("source must carry append-only supersession refs")
    if source.count("manual_review_only") < 3:
        fail("source must fail closed into manual review")


def validate_migration() -> None:
    require_markers("migration", read(MIGRATION), MIGRATION_MARKERS)


def validate_service_definition() -> None:
    require_markers("service definition", read(SERVICE_DEFINITION), SERVICE_MARKERS)


def validate_docs() -> None:
    combined = "\n".join(read(path) for path in [ARCH_DOC, API_DOC, SECURITY_DOC])
    require_markers("docs", combined, DOC_MARKERS)


def validate_schemas() -> None:
    for path in [JOB_SCHEMA, DERIVATION_SCHEMA, FACTS_SCHEMA, MANUAL_REVIEW_SCHEMA]:
        payload = load_json(path)
        if payload.get("type") != "object" or payload.get("additionalProperties") is not False:
            fail(f"{path.relative_to(ROOT)} must be a closed object schema")
        required = set(payload.get("required", []))
        if "recordedBy" not in required:
            fail(f"{path.relative_to(ROOT)} must require recordedBy")
    derivation = load_json(DERIVATION_SCHEMA)
    if derivation["properties"]["transcriptArtifactRef"]["pattern"] != "^artifact://telephony-transcript/":
        fail("derivation schema must expose only artifact:// telephony transcript refs")
    facts = load_json(FACTS_SCHEMA)
    if "contradictionFlags" not in facts.get("required", []):
        fail("safety facts schema must require contradiction flags")
    catalog = load_json(REASON_CATALOG)
    states = {row.get("usabilityState") for row in catalog.get("reasonCodes", [])}
    required_states = {
        "awaiting_recording",
        "awaiting_transcript",
        "awaiting_structured_capture",
        "urgent_live_only",
        "manual_review_only",
        "safety_usable",
        "unusable_terminal",
    }
    if required_states - states:
        fail("reason catalog missing required evidence readiness usability states")


def validate_analysis() -> None:
    with TRUTH_TABLE.open(newline="", encoding="utf-8") as handle:
        truth_rows = list(csv.DictReader(handle))
    truth_states = {row["evidence_usability"] for row in truth_rows}
    if {"safety_usable", "manual_review_only", "unusable_terminal"} - truth_states:
        fail("transcript readiness truth table missing terminal usability cases")

    with TRANSITION_MATRIX.open(newline="", encoding="utf-8") as handle:
        transition_rows = list(csv.DictReader(handle))
    if not any(row["input_event"] == "manual_correction_rerun" for row in transition_rows):
        fail("transition matrix must cover rerun supersession")
    if not any(row["to_state"] == "urgent_live_only" for row in transition_rows):
        fail("transition matrix must cover urgent_live_only")

    casebook = load_json(DEGRADATION_CASES)
    cases = {case.get("caseId") for case in casebook.get("cases", [])}
    expected_cases = {
        "partial_segments",
        "extractor_failed",
        "structured_capture_conflict",
        "urgent_live_routine_block",
        "terminal_unusable_audio",
    }
    if expected_cases - cases:
        fail("degradation casebook missing required cases")


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
            "queued, running, and ready transcript readiness",
            "extracts safety facts",
            "transcript coverage is degraded",
            "detects contradictions",
            "awaiting_structured_capture",
            "urgent_live_only",
            "unusable_terminal",
            "appends rerun derivation packages",
            "expectNoRawTranscriptLeak",
        },
    )


def validate_scripts() -> None:
    package = json.loads(read(ROOT_PACKAGE))
    scripts = package.get("scripts", {})
    expected_script = "python3 ./tools/analysis/validate_telephony_readiness_pipeline.py"
    if scripts.get("validate:telephony-readiness-pipeline") != expected_script:
        fail("package.json missing validate:telephony-readiness-pipeline script")
    if ROOT_SCRIPT_UPDATES.get("validate:telephony-readiness-pipeline") != expected_script:
        fail("root_script_updates missing validate:telephony-readiness-pipeline")
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
            fail(f"package.json {name} chain missing telephony readiness validator")
        if expected_chain not in ROOT_SCRIPT_UPDATES.get(name, ""):
            fail(f"root_script_updates {name} chain missing telephony readiness validator")


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
    print("[telephony-readiness-pipeline] validation passed")


if __name__ == "__main__":
    main()
