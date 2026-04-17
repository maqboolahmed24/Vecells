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
SOURCE = ROOT / "services" / "command-api" / "src" / "telephony-verification-pipeline.ts"
MIGRATION = (
    ROOT
    / "services"
    / "command-api"
    / "migrations"
    / "104_phase2_telephony_verification_pipeline.sql"
)
SERVICE_DEFINITION = ROOT / "services" / "command-api" / "src" / "service-definition.ts"
BACKEND_TEST = (
    ROOT
    / "services"
    / "command-api"
    / "tests"
    / "telephony-verification-pipeline.integration.test.js"
)
ARCH_DOC = ROOT / "docs" / "architecture" / "189_telephony_verification_pipeline_design.md"
API_DOC = ROOT / "docs" / "api" / "189_identifier_capture_and_verification_decision_contract.md"
SECURITY_DOC = ROOT / "docs" / "security" / "189_telephony_identifier_vaulting_and_masking_rules.md"
CAPTURE_SCHEMA = ROOT / "data" / "contracts" / "189_identifier_capture_attempt.schema.json"
IDENTITY_SCHEMA = (
    ROOT
    / "data"
    / "contracts"
    / "189_telephony_identity_confidence_assessment.schema.json"
)
DESTINATION_SCHEMA = (
    ROOT
    / "data"
    / "contracts"
    / "189_telephony_destination_confidence_assessment.schema.json"
)
DECISION_SCHEMA = ROOT / "data" / "contracts" / "189_telephony_verification_decision.schema.json"
PACKAGE_SCHEMA = (
    ROOT / "data" / "contracts" / "189_telephony_candidate_evidence_package.schema.json"
)
THRESHOLD_MATRIX = ROOT / "data" / "analysis" / "189_verification_threshold_matrix.csv"
FEATURE_BOUNDARIES = ROOT / "data" / "analysis" / "189_feature_weight_and_boundaries.json"
AMBIGUITY_CASES = ROOT / "data" / "analysis" / "189_ambiguity_and_manual_followup_cases.json"
GAP_ARTIFACT = ROOT / "PARALLEL_INTERFACE_GAP_PHASE2_TELEPHONY_VERIFICATION.json"

GAP_FILES = [
    ROOT
    / "data"
    / "analysis"
    / "GAP_RESOLVED_PHASE2_TELEPHONY_VERIFICATION_CONFIDENCE_OBJECTS.json",
    ROOT
    / "data"
    / "analysis"
    / "GAP_RESOLVED_PHASE2_TELEPHONY_VERIFICATION_THRESHOLD_SOURCE.json",
    ROOT
    / "data"
    / "analysis"
    / "GAP_RESOLVED_PHASE2_TELEPHONY_VERIFICATION_CALIBRATION_ABSENCE.json",
    ROOT
    / "data"
    / "analysis"
    / "GAP_RESOLVED_PHASE2_TELEPHONY_VERIFICATION_CALLER_ID_CAP.json",
    ROOT
    / "data"
    / "analysis"
    / "GAP_RESOLVED_PHASE2_TELEPHONY_VERIFICATION_AUTHORITY_UNAVAILABLE.json",
]

SOURCE_MARKERS = {
    "TelephonyVerificationPipeline",
    "controlledTelephonyIdentifierCaptureOrder",
    "TelephonyIdentifierCaptureAttempt",
    "TelephonyIdentityConfidenceAssessment",
    "TelephonyDestinationConfidenceAssessment",
    "TelephonyVerificationDecision",
    "TelephonyCandidateEvidencePackage",
    "TelephonyIdentityBindingAuthorityPort",
    "IdentityEvidenceVaultService",
    "IdentityBindingAuthorityService",
    "z_id",
    "P_id",
    "LCB_id_alpha",
    "UCB_id_alpha",
    "gap_id",
    "z_dest",
    "P_dest",
    "LCB_dest_alpha",
    "P_seed_lower",
    "TELEPHONY_VERIFICATION_EPSILON = 1e-6",
    "dependence_safe_frechet_lower_bound",
    "localBindingMutation: \"forbidden\"",
    "TEL_VERIFY_189_CALLER_ID_ONLY_BLOCKED",
    "TEL_VERIFY_189_NO_VALIDATED_CALIBRATION_FAIL_CLOSED",
    "TEL_VERIFY_189_AUTHORITY_UNAVAILABLE_NON_BINDING_FALLBACK",
    "TEL_VERIFY_189_SEEDED_DOWNGRADED_TO_CHALLENGE",
    "createIdentityBindingAuthorityTelephonyPort",
}

CAPTURE_FIELDS = {
    "nhs_number",
    "date_of_birth",
    "surname",
    "postcode",
    "caller_id_hint",
    "verified_callback",
    "handset_step_up_proof",
    "ivr_consistency",
    "operator_correction",
}

OUTCOMES = {
    "telephony_verified_seeded",
    "telephony_verified_challenge",
    "manual_followup_required",
    "identity_failed",
    "insufficient_calibration",
    "destination_untrusted",
    "ambiguous_candidate_set",
}

MIGRATION_MARKERS = {
    "phase2_telephony_identifier_capture_attempts",
    "phase2_telephony_candidate_sets",
    "phase2_telephony_identity_confidence_assessments",
    "phase2_telephony_destination_confidence_assessments",
    "phase2_telephony_verification_decisions",
    "phase2_telephony_candidate_evidence_packages",
    "phase2_telephony_verification_authority_submissions",
    "TelephonyVerificationPipeline",
    "IdentityBindingAuthority",
    "local_binding_mutation",
    "dependence_safe_frechet_lower_bound",
    "phase2-telephony-verification-189.v1",
}

SERVICE_MARKERS = {
    "telephony_identifier_capture_append",
    "/internal/telephony/call-sessions/{callSessionRef}/identifier-captures",
    "TelephonyIdentifierCaptureAttemptContract",
    "telephony_verification_evaluate",
    "/internal/telephony/call-sessions/{callSessionRef}/verification",
    "TelephonyVerificationDecisionContract",
    "telephony_verification_decision_current",
    "TelephonyVerificationProjectionContract",
}

DOC_MARKERS = {
    "TelephonyVerificationPipeline",
    "TelephonyIdentifierCaptureAttempt",
    "TelephonyIdentityConfidenceAssessment",
    "TelephonyDestinationConfidenceAssessment",
    "TelephonyVerificationDecision",
    "TelephonyCandidateEvidencePackage",
    "IdentityEvidenceVault",
    "IdentityBindingAuthority",
    "P_seed_lower",
    "gap_id",
    "caller-ID-only",
    "localBindingMutation = forbidden",
}

GAP_IDS = {
    "GAP_RESOLVED_PHASE2_TELEPHONY_VERIFICATION_CONFIDENCE_OBJECTS",
    "GAP_RESOLVED_PHASE2_TELEPHONY_VERIFICATION_THRESHOLD_SOURCE",
    "GAP_RESOLVED_PHASE2_TELEPHONY_VERIFICATION_CALIBRATION_ABSENCE",
    "GAP_RESOLVED_PHASE2_TELEPHONY_VERIFICATION_CALLER_ID_CAP",
    "GAP_RESOLVED_PHASE2_TELEPHONY_VERIFICATION_AUTHORITY_UNAVAILABLE",
}


def fail(message: str) -> None:
    raise SystemExit(f"[telephony-verification-pipeline] {message}")


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
    if checklist_state("par_188") != "X":
        fail("par_188 must be complete before par_189")
    if checklist_state("par_189") not in {"-", "X"}:
        fail("par_189 must be claimed or complete")


def validate_source() -> None:
    source = read(SOURCE)
    require_markers("source", source, SOURCE_MARKERS | CAPTURE_FIELDS | OUTCOMES | GAP_IDS)
    forbid_markers(
        "source",
        source,
        {
            "Request.patientRef",
            "Episode.patientRef",
            "rawPhoneNumber",
            "fullPhoneNumber",
            "fullNhsNumber",
            "PARALLEL_INTERFACE_GAP_PHASE2_TELEPHONY_VERIFICATION.json",
        },
    )
    if source.count("writeEvidence") < 1:
        fail("source must write raw capture values to IdentityEvidenceVault")
    if source.count("normalizedValueHash") < 10:
        fail("source must persist normalized hashes rather than raw values")
    if source.count("localBindingMutation") < 4:
        fail("source must carry the local non-binding guarantee")


def validate_migration() -> None:
    require_markers("migration", read(MIGRATION), MIGRATION_MARKERS | OUTCOMES | CAPTURE_FIELDS)


def validate_service_definition() -> None:
    require_markers("service definition", read(SERVICE_DEFINITION), SERVICE_MARKERS)


def validate_docs() -> None:
    combined = "\n".join(read(path) for path in [ARCH_DOC, API_DOC, SECURITY_DOC])
    require_markers("docs", combined, DOC_MARKERS | GAP_IDS | OUTCOMES)
    forbid_markers("docs", combined, {"PARALLEL_INTERFACE_GAP_PHASE2_TELEPHONY_VERIFICATION.json"})


def validate_schemas() -> None:
    expected_titles = {
        CAPTURE_SCHEMA: "TelephonyIdentifierCaptureAttempt",
        IDENTITY_SCHEMA: "TelephonyIdentityConfidenceAssessment",
        DESTINATION_SCHEMA: "TelephonyDestinationConfidenceAssessment",
        DECISION_SCHEMA: "TelephonyVerificationDecision",
        PACKAGE_SCHEMA: "TelephonyCandidateEvidencePackage",
    }
    for path, title in expected_titles.items():
        schema = load_json(path)
        if schema.get("title") != title:
            fail(f"{path.relative_to(ROOT)} title must be {title}")
    require_markers("capture schema", read(CAPTURE_SCHEMA), CAPTURE_FIELDS)
    require_markers("identity schema", read(IDENTITY_SCHEMA), {"z_id", "P_id", "LCB_id_alpha"})
    require_markers(
        "destination schema",
        read(DESTINATION_SCHEMA),
        {"z_dest", "P_dest", "LCB_dest_alpha", "P_seed_lower"},
    )
    require_markers("decision schema", read(DECISION_SCHEMA), OUTCOMES | {"localBindingMutation"})
    require_markers(
        "evidence package schema",
        read(PACKAGE_SCHEMA),
        {"IdentityBindingAuthority", "localBindingMutation", "captureAttemptRefs"},
    )


def validate_analysis() -> None:
    rows = list(csv.DictReader(read(THRESHOLD_MATRIX).splitlines()))
    routes = {row.get("route_sensitivity") for row in rows}
    for route in {"sms_continuation", "public_intake", "future_protected_records"}:
        if route not in routes:
            fail(f"threshold matrix missing {route}")
    required_thresholds = {
        "tau_id",
        "tau_runner_up",
        "delta_id",
        "tau_dest",
        "tau_seeded",
        "tau_challenge",
        "tau_runner_up_challenge",
        "delta_challenge",
    }
    for row in rows:
        if not required_thresholds.issubset(row.keys()):
            fail("threshold matrix missing one or more threshold columns")
    boundaries = load_json(FEATURE_BOUNDARIES)
    for key in ("identityFormula", "destinationFormula", "seededLowerBound", "callerIdCap"):
        if not boundaries.get(key):
            fail(f"feature boundaries missing {key}")
    if boundaries["callerIdCap"].get("maximumCallerIdContribution") != 0.25:
        fail("caller ID cap must be 0.25")
    cases = load_json(AMBIGUITY_CASES).get("cases", [])
    case_ids = {case.get("caseId") for case in cases}
    for case_id in {
        "TEL189_CALLER_ID_ONLY",
        "TEL189_CLOSE_RUNNER_UP",
        "TEL189_NO_CALIBRATION",
        "TEL189_DESTINATION_BELOW_SEEDED_THRESHOLD",
        "TEL189_AUTHORITY_UNAVAILABLE",
        "TEL189_CONTRADICTORY_IDENTIFIER",
    }:
        if case_id not in case_ids:
            fail(f"ambiguity/manual case file missing {case_id}")


def validate_gap_resolutions() -> None:
    for path in GAP_FILES:
        payload = load_json(path)
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
            "controlled order",
            "raw values only in the evidence vault",
            "seeded decision",
            "challenge continuation",
            "caller ID is the only positive evidence",
            "runner-up competition",
            "insufficient calibration",
            "IdentityBindingAuthority is unavailable",
            "expectNoRawTelephonyLeak",
            "localBindingMutation",
        },
    )


def validate_scripts() -> None:
    package = json.loads(read(ROOT_PACKAGE))
    scripts = package.get("scripts", {})
    if (
        scripts.get("validate:telephony-verification-pipeline")
        != "python3 ./tools/analysis/validate_telephony_verification_pipeline.py"
    ):
        fail("package.json missing validate:telephony-verification-pipeline script")
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
            fail(f"package.json {name} chain missing telephony verification validator")
        if expected_chain not in ROOT_SCRIPT_UPDATES.get(name, ""):
            fail(f"root_script_updates {name} chain missing telephony verification validator")
    if (
        ROOT_SCRIPT_UPDATES.get("validate:telephony-verification-pipeline")
        != "python3 ./tools/analysis/validate_telephony_verification_pipeline.py"
    ):
        fail("root_script_updates missing validate:telephony-verification-pipeline")


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
    print("[telephony-verification-pipeline] validation passed")


if __name__ == "__main__":
    main()
