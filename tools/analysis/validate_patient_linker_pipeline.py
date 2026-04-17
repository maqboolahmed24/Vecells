#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "analysis"))

from root_script_updates import ROOT_SCRIPT_UPDATES


CHECKLIST = ROOT / "prompt" / "checklist.md"
SOURCE = ROOT / "services" / "command-api" / "src" / "patient-linker.ts"
SERVICE_DEFINITION = ROOT / "services" / "command-api" / "src" / "service-definition.ts"
TEST = ROOT / "services" / "command-api" / "tests" / "patient-linker.integration.test.js"
MIGRATION = ROOT / "services" / "command-api" / "migrations" / "093_phase2_patient_linker.sql"
ARCH_DOC = ROOT / "docs" / "architecture" / "178_patient_linker_and_match_pipeline_design.md"
SECURITY_DOC = ROOT / "docs" / "security" / "178_patient_matching_drift_and_fail_closed_rules.md"
DECISION_EXAMPLES = ROOT / "data" / "analysis" / "178_link_decision_examples.json"
DRIFT_CASES = ROOT / "data" / "analysis" / "178_drift_and_ambiguity_cases.json"
CALIBRATION_PROFILES = ROOT / "data" / "analysis" / "178_seed_calibration_profiles.json"
ROOT_PACKAGE = ROOT / "package.json"

REQUIRED_GAPS = {
    "PARALLEL_INTERFACE_GAP_PHASE2_LINKER_CALIBRATED_DECISION_V1",
    "PARALLEL_INTERFACE_GAP_PHASE2_LINKER_RUNNER_UP_COMPETITION_V1",
    "PARALLEL_INTERFACE_GAP_PHASE2_LINKER_DRIFT_FAIL_CLOSED_V1",
    "PARALLEL_INTERFACE_GAP_PHASE2_LINKER_PDS_OPTIONAL_SEAM_V1",
    "PARALLEL_INTERFACE_GAP_PHASE2_LINKER_CONTACT_PREF_SEPARATION_V1",
    "PARALLEL_INTERFACE_GAP_PHASE2_LINKER_AUTHORITY_INTENT_PORT_V1",
}

REQUIRED_ROUTE_FAMILIES = {
    "public_intake",
    "signed_in_draft_start",
    "authenticated_request_status",
    "post_sign_in_attachment_write",
    "sms_continuation",
    "identity_repair",
    "future_protected_records",
    "future_booking_surfaces",
}

SOURCE_MARKERS = {
    "createPatientLinkerApplication",
    "createPatientLinkerService",
    "createInMemoryPatientLinkerRepository",
    "createSeedPatientLinkCalibrationRepository",
    "createSeedPatientLinkCalibrationProfiles",
    "createDisabledPdsEnrichmentProvider",
    "createInMemoryIdentityBindingAuthorityIntentPort",
    "CandidateSearchSpec",
    "MatchEvidenceBasis",
    "PatientLinkDecision",
    "PatientLinkCalibrationProfile",
    "PatientLinkerAuthorityIntent",
    "PdsEnrichmentProvider",
    "P_link",
    "LCB_link_alpha",
    "UCB_link_alpha",
    "P_subject",
    "LCB_subject_alpha",
    "runnerUpProbabilityUpperBound",
    "gap_logit",
    "confidenceModelState",
    "contactClaims",
    "pdsDemographics",
    "patientPreferredComms",
    "LINK_172_CALIBRATION_MISSING_FAIL_CLOSED",
    "LINK_172_RUNNER_UP_TOO_CLOSE",
    "LINK_172_MODEL_OUT_OF_DOMAIN_FAIL_CLOSED",
    "LINK_172_PATIENT_PREFS_DO_NOT_PROVE_IDENTITY",
    "LINK_172_LINKER_RECOMMENDS_AUTHORITY_SETTLES",
}

MIGRATION_TABLES = {
    "patient_link_candidate_search_specs",
    "patient_link_candidate_sets",
    "patient_match_evidence_basis",
    "patient_link_decisions",
    "patient_link_binding_intents",
    "patient_link_calibration_profiles",
    "patient_link_pds_enrichment_audit",
}

MIGRATION_MARKERS = {
    "candidate_search_spec_id TEXT PRIMARY KEY",
    "match_evidence_basis_id TEXT PRIMARY KEY",
    "patient_link_decision_id TEXT PRIMARY KEY",
    "p_link REAL NOT NULL",
    "lcb_link_alpha REAL NOT NULL",
    "runner_up_probability_upper_bound REAL NOT NULL",
    "gap_logit REAL NOT NULL",
    "identity_binding_authority_intent TEXT NOT NULL",
}

REQUIRED_DECISION_CASES = {
    "LINK178_VERIFIED_BIND_EXACT",
    "LINK178_PROVISIONAL_DRAFT_POLICY",
    "LINK178_AMBIGUOUS_RUNNER_UP",
    "LINK178_NO_CANDIDATE",
}

REQUIRED_DRIFT_CASES = {
    "LINK178_MISSING_CALIBRATION_FAILS_CLOSED",
    "LINK178_OUT_OF_DOMAIN_DRIFT_FAILS_CLOSED",
    "LINK178_RUNNER_UP_COMPETITION_BLOCKS_AUTO_LINK",
    "LINK178_PDS_DISABLED_LOCAL_MATCHING_CONTINUES",
    "LINK178_CONTACT_PREF_NOT_IDENTITY_PROOF",
}


def fail(message: str) -> None:
    raise SystemExit(f"[patient-linker-pipeline] {message}")


def read(path: Path) -> str:
    if not path.exists():
        fail(f"missing required artifact: {path.relative_to(ROOT)}")
    return path.read_text(encoding="utf-8")


def load_json(path: Path) -> Any:
    try:
        return json.loads(read(path))
    except json.JSONDecodeError as error:
        fail(f"{path.relative_to(ROOT)} is invalid JSON: {error}")


def checklist_state(task_prefix: str) -> str:
    pattern = re.compile(r"- \[([ Xx\-])\] ([^ ]+)")
    for line in read(CHECKLIST).splitlines():
        match = pattern.match(line.strip())
        if match and match.group(2).startswith(f"{task_prefix}_"):
            marker = match.group(1)
            return "X" if marker == "x" else marker
    fail(f"checklist row missing for {task_prefix}")


def require_markers(label: str, text: str, markers: set[str]) -> None:
    missing = sorted(marker for marker in markers if marker not in text)
    if missing:
        fail(f"{label} missing markers: {', '.join(missing)}")


def validate_checklist() -> None:
    for task_id in [
        "seq_170",
        "seq_171",
        "seq_172",
        "seq_173",
        "seq_174",
        "par_175",
        "par_176",
        "par_177",
    ]:
        if checklist_state(task_id) != "X":
            fail(f"{task_id} must be complete before par_178")
    if checklist_state("par_178") not in {"-", "X"}:
        fail("par_178 must be claimed or complete")


def validate_source() -> None:
    source = read(SOURCE)
    require_markers("patient linker source", source, SOURCE_MARKERS | REQUIRED_GAPS)
    for route_family in REQUIRED_ROUTE_FAMILIES:
        if route_family not in source:
            fail(f"source missing route family {route_family}")
    forbidden = {
        "console.log(",
        "localStorage",
        "sessionStorage",
        "document.cookie",
        "Request.patientRef",
        "Episode.patientRef",
        ".patientRef =",
        "directIdentityBindingWrite",
        "patientPreferredCommsOverwrite",
    }
    present = sorted(term for term in forbidden if term in source)
    if present:
        fail(f"source contains forbidden patient-link shortcuts: {', '.join(present)}")
    if source.count("candidateSetFreezeRule") < 2:
        fail("source must freeze candidate sets before scoring")
    if source.count("identityBindingAuthorityIntent") < 4:
        fail("source must emit authority intents rather than settling binding truth")
    service_definition = read(SERVICE_DEFINITION)
    require_markers(
        "service definition",
        service_definition,
        {
            "patient_linker_evaluate",
            "/identity/patient-link/evaluate",
            "PatientLinkDecisionContract",
            "patient_linker_candidates",
            "/identity/patient-link/candidates",
            "CandidateSearchSpecContract",
        },
    )


def validate_migration() -> None:
    migration = read(MIGRATION)
    require_markers("migration", migration, MIGRATION_TABLES | MIGRATION_MARKERS)


def validate_docs() -> None:
    combined = "\n".join(read(path) for path in [ARCH_DOC, SECURITY_DOC])
    require_markers(
        "docs",
        combined,
        {
            "PatientLinker",
            "CandidateSearchSpec",
            "MatchEvidenceBasis",
            "PatientLinkDecision",
            "PatientLinkCalibrationProfile",
            "PdsEnrichmentProvider",
            "IdentityBindingAuthority",
            "P_link",
            "LCB_link_alpha",
            "runnerUpProbabilityUpperBound",
            "gap_logit",
            "confidenceModelState",
            "contactClaims",
            "pdsDemographics",
            "patientPreferredComms",
            "Request.patientRef",
            "Episode.patientRef",
            "OWASP",
            "NHS England",
        }
        | REQUIRED_GAPS,
    )


def require_gap_payload(path: Path) -> dict[str, Any]:
    payload = load_json(path)
    if payload.get("taskId") != "par_178":
        fail(f"{path.relative_to(ROOT)} taskId must be par_178")
    if payload.get("schemaVersion") != "172.phase2.patient-link.v1":
        fail(f"{path.relative_to(ROOT)} must bind task 172 schema")
    return payload


def validate_decision_examples() -> None:
    payload = require_gap_payload(DECISION_EXAMPLES)
    gaps = {entry.get("gapId") for entry in payload.get("parallelInterfaceGaps", [])}
    if not REQUIRED_GAPS.issubset(gaps):
        missing = sorted(REQUIRED_GAPS - gaps)
        fail(f"decision examples missing gaps: {', '.join(missing)}")
    case_ids = {entry.get("caseId") for entry in payload.get("decisionExamples", [])}
    if not REQUIRED_DECISION_CASES.issubset(case_ids):
        missing = sorted(REQUIRED_DECISION_CASES - case_ids)
        fail(f"decision examples missing cases: {', '.join(missing)}")
    verified = next(
        entry for entry in payload["decisionExamples"] if entry.get("caseId") == "LINK178_VERIFIED_BIND_EXACT"
    )
    checks = verified.get("minimumChecks", {})
    for check_name in [
        "winnerLowerBoundPass",
        "runnerUpCeilingPass",
        "gapLogitPass",
        "subjectProofFloorPass",
        "driftPass",
        "policyAllowsAutoLink",
    ]:
        if checks.get(check_name) is not True:
            fail(f"verified example must pass {check_name}")


def validate_drift_cases() -> None:
    payload = require_gap_payload(DRIFT_CASES)
    case_ids = {entry.get("caseId") for entry in payload.get("cases", [])}
    if not REQUIRED_DRIFT_CASES.issubset(case_ids):
        missing = sorted(REQUIRED_DRIFT_CASES - case_ids)
        fail(f"drift cases missing cases: {', '.join(missing)}")
    drift_policy = payload.get("driftPolicy", {})
    for reason in [
        "LINK_172_CALIBRATION_MISSING_FAIL_CLOSED",
        "LINK_172_MODEL_OUT_OF_DOMAIN_FAIL_CLOSED",
        "LINK_172_RUNNER_UP_TOO_CLOSE",
        "LINK_172_NO_CANDIDATE_LIMITED_MODE",
    ]:
        if reason not in drift_policy.values():
            fail(f"drift policy missing {reason}")


def validate_calibration_profiles() -> None:
    payload = require_gap_payload(CALIBRATION_PROFILES)
    if payload.get("calibrationVersionRef") != "LINK_CAL_178_SYNTHETIC_ADJUDICATED_V1":
        fail("calibration artifact version mismatch")
    route_families = {entry.get("routeSensitivityFamily") for entry in payload.get("profiles", [])}
    if not REQUIRED_ROUTE_FAMILIES.issubset(route_families):
        missing = sorted(REQUIRED_ROUTE_FAMILIES - route_families)
        fail(f"calibration profiles missing route families: {', '.join(missing)}")
    for profile in payload.get("profiles", []):
        for key in [
            "thresholdVersionRef",
            "minimumCalibrationPosture",
            "autoLinkLcbMin",
            "provisionalLcbMin",
            "runnerUpUcbMax",
            "subjectLcbMin",
            "gapLogitMin",
            "driftFailClosedPosture",
        ]:
            if key not in profile:
                fail(f"calibration profile {profile.get('routeSensitivityFamily')} missing {key}")


def validate_tests() -> None:
    test = read(TEST)
    require_markers(
        "tests",
        test,
        {
            "creates calibrated verified PatientLinkDecision records",
            "keeps strong draft-start matches provisional",
            "fails closed when a runner-up remains too competitive",
            "treats missing calibration as out-of-domain",
            "keeps PDS optional and preserves contact-claim preference separation",
            "emits a no-candidate candidate-refresh decision",
            "LINK_172_LINKER_RECOMMENDS_AUTHORITY_SETTLES",
            "LINK_172_PATIENT_PREFS_DO_NOT_PROVE_IDENTITY",
        },
    )


def validate_root_script_wiring() -> None:
    package = load_json(ROOT_PACKAGE)
    scripts = package.get("scripts", {})
    expected = "python3 ./tools/analysis/validate_patient_linker_pipeline.py"
    if scripts.get("validate:patient-linker-pipeline") != expected:
        fail("package.json missing validate:patient-linker-pipeline script")
    expected_chain = (
        "pnpm validate:auth-bridge-service && pnpm validate:session-governor "
        "&& pnpm validate:identity-evidence-vault && pnpm validate:patient-linker-pipeline"
    )
    for script_name in ["bootstrap", "check"]:
        if expected_chain not in scripts.get(script_name, ""):
            fail(f"package.json {script_name} is not wired after identity evidence vault")
        if expected_chain not in ROOT_SCRIPT_UPDATES.get(script_name, ""):
            fail(f"root_script_updates {script_name} is not wired after identity evidence vault")
    if ROOT_SCRIPT_UPDATES.get("validate:patient-linker-pipeline") != expected:
        fail("root_script_updates missing validate:patient-linker-pipeline")


def validate_no_raw_contact_leaks() -> None:
    combined = "\n".join(read(path) for path in [DECISION_EXAMPLES, DRIFT_CASES, CALIBRATION_PROFILES])
    if re.search(r"[^\s@]+@[^\s@]+\.[^\s@]+", combined):
        fail("patient linker artifacts must not contain raw email-shaped evidence")
    if re.search(r"\+?\d[\d\s().-]{7,}\d", combined):
        fail("patient linker artifacts must not contain raw phone-shaped evidence")


def main() -> None:
    validate_checklist()
    validate_source()
    validate_migration()
    validate_docs()
    validate_decision_examples()
    validate_drift_cases()
    validate_calibration_profiles()
    validate_tests()
    validate_root_script_wiring()
    validate_no_raw_contact_leaks()
    print("[patient-linker-pipeline] ok")


if __name__ == "__main__":
    main()
