#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import re
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]

CANDIDATE_SEARCH = ROOT / "data/contracts/172_candidate_search_spec.schema.json"
MATCH_EVIDENCE = ROOT / "data/contracts/172_match_evidence_basis.schema.json"
PATIENT_LINK_DECISION = ROOT / "data/contracts/172_patient_link_decision.schema.json"
CALIBRATION_PROFILE = ROOT / "data/contracts/172_link_calibration_profile.schema.json"
PDS_SEAM = ROOT / "data/contracts/172_pds_enrichment_seam.yaml"
CONTACT_RULES = ROOT / "data/contracts/172_contact_claim_and_preference_separation_rules.json"
THRESHOLD_MATRIX = ROOT / "data/analysis/172_link_threshold_matrix.csv"
CANDIDATE_EXAMPLES = ROOT / "data/analysis/172_candidate_competition_examples.json"
GAP_LOG = ROOT / "data/analysis/172_patient_link_gap_log.json"
ARCHITECTURE_DOC = ROOT / "docs/architecture/172_patient_linkage_match_model_and_pds_seam.md"
SECURITY_DOC = ROOT / "docs/security/172_identity_matching_contact_claim_and_preference_separation.md"
FRONTEND_SPEC = ROOT / "docs/frontend/172_account_linking_state_experience_spec.md"
BOARD = ROOT / "docs/frontend/172_patient_linkage_confidence_board.html"
PLAYWRIGHT_SPEC = ROOT / "tests/playwright/172_patient_linkage_confidence_board.spec.js"
CHECKLIST = ROOT / "prompt/checklist.md"
ROOT_PACKAGE = ROOT / "package.json"
PLAYWRIGHT_PACKAGE = ROOT / "tests/playwright/package.json"
ROOT_SCRIPT_UPDATES = ROOT / "tools/analysis/root_script_updates.py"

ROUTE_SENSITIVITY_FAMILIES = {
    "public_intake",
    "signed_in_draft_start",
    "authenticated_request_status",
    "post_sign_in_attachment_write",
    "sms_continuation",
    "identity_repair",
    "future_protected_records",
    "future_booking_surfaces",
}

LINK_STATES = {
    "none",
    "candidate",
    "provisional_verified",
    "verified_patient",
    "ambiguous",
    "correction_pending",
    "revoked",
}

PATIENT_STATES = {
    "signed_in_ready",
    "details_found_confirmation_needed",
    "limited_or_provisional_mode",
    "unable_to_confidently_match",
    "identity_hold_bounded_recovery",
}

REQUIRED_GAP_IDS = {
    "GAP_RESOLVED_PHASE2_LINK_AUTH_NOT_BINDING_V1",
    "GAP_RESOLVED_PHASE2_LINK_CALIBRATED_PROBABILITY_V1",
    "GAP_RESOLVED_PHASE2_LINK_RUNNER_UP_SEPARATION_V1",
    "GAP_RESOLVED_PHASE2_LINK_PDS_GOVERNED_SEAM_V1",
    "GAP_RESOLVED_PHASE2_LINK_CONTACT_PREFERENCE_SEPARATION_V1",
    "GAP_RESOLVED_PHASE2_LINK_UI_STATE_GRAMMAR_V1",
    "GAP_RESOLVED_PHASE2_LINK_THRESHOLD_PLACEHOLDERS_V1",
}

REQUIRED_BOARD_MARKERS = {
    "Patient_Linkage_Confidence_Board",
    "identity_constellation_mark",
    "state-rail",
    "route-filter",
    "link-state-filter",
    "model-state-filter",
    "candidate-confidence-ridge",
    "candidate-confidence-table",
    "subject-proof-braid",
    "subject-proof-table",
    "threshold-ladder",
    "threshold-table",
    "patient-state-atlas",
    "patient-state-table",
    "copy-state-registry",
    "parity-table",
    "inspector",
    "--masthead-height: 72px",
    "--left-rail-width: 280px",
    "--right-inspector-width: 408px",
    "1600px",
    "prefers-reduced-motion",
}

REQUIRED_SPEC_MARKERS = {
    "candidate and threshold filter synchronization",
    "row and diagram selection sync",
    "ambiguous/out-of-domain rendering",
    "patient-state atlas parity",
    "keyboard traversal and landmarks",
    "reducedMotion equivalence",
    "diagram/table parity",
    "Patient_Linkage_Confidence_Board",
}


def fail(message: str) -> None:
    raise SystemExit(f"[phase2-patient-link-contracts] {message}")


def require_file(path: Path) -> str:
    if not path.exists():
        fail(f"missing required file: {path.relative_to(ROOT)}")
    return path.read_text(encoding="utf-8")


def load_json(path: Path) -> Any:
    text = require_file(path)
    try:
        return json.loads(text)
    except json.JSONDecodeError as error:
        fail(f"{path.relative_to(ROOT)} is invalid JSON: {error}")


def load_csv(path: Path) -> list[dict[str, str]]:
    text = require_file(path)
    try:
        return list(csv.DictReader(text.splitlines()))
    except csv.Error as error:
        fail(f"{path.relative_to(ROOT)} is invalid CSV: {error}")


def require_markers(label: str, text: str, markers: set[str] | list[str]) -> None:
    missing = sorted(marker for marker in markers if marker not in text)
    if missing:
        fail(f"{label} missing markers: {', '.join(missing)}")


def property_names(schema: Any) -> set[str]:
    names: set[str] = set()
    if isinstance(schema, dict):
        properties = schema.get("properties")
        if isinstance(properties, dict):
            names.update(properties.keys())
        for value in schema.values():
            names.update(property_names(value))
    elif isinstance(schema, list):
        for item in schema:
            names.update(property_names(item))
    return names


def enum_at(schema: dict[str, Any], *keys: str) -> set[str]:
    node: Any = schema
    for key in keys:
        node = node[key]
    return set(node["enum"])


def as_float(row: dict[str, str], key: str) -> float:
    try:
        return float(row.get(key, ""))
    except ValueError:
        fail(f"{row.get('route_sensitivity_family', 'unknown')} has non-numeric {key}")


def validate_schemas() -> None:
    candidate = load_json(CANDIDATE_SEARCH)
    evidence = load_json(MATCH_EVIDENCE)
    decision = load_json(PATIENT_LINK_DECISION)
    calibration = load_json(CALIBRATION_PROFILE)

    expected_titles = {
        CANDIDATE_SEARCH: "CandidateSearchSpec",
        MATCH_EVIDENCE: "MatchEvidenceBasis",
        PATIENT_LINK_DECISION: "PatientLinkDecision",
        CALIBRATION_PROFILE: "LinkCalibrationProfile",
    }
    for path, title in expected_titles.items():
        if load_json(path).get("title") != title:
            fail(f"{path.relative_to(ROOT)} title must be {title}")

    search_keys = enum_at(candidate, "properties", "permittedSearchKeys", "items")
    for required in [
        "nhs_number_hash_exact",
        "date_of_birth",
        "normalized_family_name",
        "normalized_given_name",
        "postcode_prefix",
        "address_token_set",
        "contact_claim_digest",
        "pds_demographic_ref",
    ]:
        if required not in search_keys:
            fail(f"CandidateSearchSpec permittedSearchKeys missing {required}")

    boundaries = candidate["properties"]["searchBoundaries"]["properties"]
    if boundaries["freeTextRummaging"].get("const") != "forbidden":
        fail("CandidateSearchSpec must forbid free-text rummaging")
    if boundaries["routeLocalHeuristics"].get("const") != "forbidden":
        fail("CandidateSearchSpec must forbid route-local heuristics")

    evidence_required = set(evidence.get("required", []))
    for required in [
        "rawEvidenceRefs",
        "normalizedFeatureValues",
        "provenancePenalties",
        "missingnessFlags",
        "calibratorVersionRef",
        "thresholdVersionRef",
        "confidenceModelState",
    ]:
        if required not in evidence_required:
            fail(f"MatchEvidenceBasis must require {required}")

    decision_required = set(decision.get("required", []))
    for required in [
        "P_link",
        "LCB_link_alpha",
        "UCB_link_alpha",
        "P_subject",
        "LCB_subject_alpha",
        "runnerUpProbabilityUpperBound",
        "gap_logit",
        "confidenceModelState",
        "autoLinkChecks",
    ]:
        if required not in decision_required:
            fail(f"PatientLinkDecision must require {required}")

    if enum_at(decision, "properties", "linkState") != LINK_STATES:
        fail("PatientLinkDecision linkState vocabulary drifted")

    checks = set(decision["properties"]["autoLinkChecks"]["required"])
    for required in [
        "winnerLowerBoundPass",
        "runnerUpCeilingPass",
        "gapLogitPass",
        "subjectProofFloorPass",
        "driftPass",
        "policyAllowsAutoLink",
    ]:
        if required not in checks:
            fail(f"autoLinkChecks missing {required}")

    calibration_thresholds = set(calibration["properties"]["thresholds"]["required"])
    for required in [
        "autoLinkLcbMin",
        "provisionalLcbMin",
        "runnerUpUcbMax",
        "subjectLcbMin",
        "gapLogitMin",
        "driftFailClosedPosture",
    ]:
        if required not in calibration_thresholds:
            fail(f"LinkCalibrationProfile thresholds missing {required}")

    leaking_names = sorted(
        name
        for name in property_names(decision) | property_names(candidate)
        if name in {"nhsNumber", "phoneNumber", "emailAddress", "pdsPayload", "rawPatientRecord"}
    )
    if leaking_names:
        fail(f"patient-link schemas expose raw identifiers: {', '.join(leaking_names)}")


def validate_threshold_matrix(rows: list[dict[str, str]]) -> None:
    families = {row.get("route_sensitivity_family") for row in rows}
    missing = sorted(ROUTE_SENSITIVITY_FAMILIES - families)
    if missing:
        fail(f"threshold matrix missing route sensitivity rows: {', '.join(missing)}")
    if len(rows) != len(families):
        fail("threshold matrix has duplicate route sensitivity rows")

    for row in rows:
        family = row.get("route_sensitivity_family", "")
        for field in [
            "threshold_version",
            "auto_link_allowed",
            "drift_fail_closed_posture",
            "manual_review_posture",
            "link_state_on_auto",
            "reason_codes",
        ]:
            if not row.get(field):
                fail(f"{family} missing {field}")
        auto_lcb = as_float(row, "auto_link_lcb_min")
        provisional_lcb = as_float(row, "provisional_lcb_min")
        runner_up = as_float(row, "runner_up_ucb_max")
        subject_lcb = as_float(row, "subject_lcb_min")
        gap = as_float(row, "gap_logit_min")
        if not (0 <= runner_up <= 1 and 0 <= provisional_lcb <= auto_lcb <= 1 and 0 <= subject_lcb <= 1):
            fail(f"{family} has invalid probability thresholds")
        if gap < 0:
            fail(f"{family} has negative gap_logit_min")
        if row.get("auto_link_allowed") == "true":
            if row.get("link_state_on_auto") != "verified_patient":
                fail(f"{family} auto-link must settle verified_patient")
            if runner_up > 0.05 or subject_lcb < 0.95 or gap < 3.0:
                fail(f"{family} auto-link lacks strict runner-up or subject-proof checks")
        if row.get("drift_fail_closed_posture") == "verified_patient":
            fail(f"{family} drift posture cannot auto-verify")


def validate_pds_seam() -> None:
    text = require_file(PDS_SEAM)
    require_markers(
        str(PDS_SEAM.relative_to(ROOT)),
        text,
        [
            "enabledByDefault: false",
            "legalBasisGate:",
            "onboardingGate:",
            "secureConnectivityGate:",
            "featureFlag: identity.pds_enrichment.enabled",
            "fallbackMode: local_matching_only",
            "noAmbientSideEffect: true",
            "directIdentityBindingWrite",
            "patientPreferredCommsOverwrite",
            "disabled_until_live_im1_prerequisites",
        ],
    )


def validate_contact_rules(rules: dict[str, Any]) -> None:
    domains = set(rules.get("domainSeparation", {}).keys())
    required_domains = {"contactClaims", "pdsDemographics", "patientPreferredComms"}
    if domains != required_domains:
        fail("contact/preference rules must define exactly the three separated domains")

    for domain, config in rules.get("domainSeparation", {}).items():
        if "patientPreferredComms" in config.get("mustNotOverwrite", []) and domain != "patientPreferredComms":
            continue
        if domain == "patientPreferredComms" and "contactClaims" in config.get("mustNotOverwrite", []):
            continue
        fail(f"{domain} lacks explicit overwrite separation")

    for rule in rules.get("rules", []):
        if rule.get("overwriteAllowed") is not False:
            fail(f"{rule.get('ruleId', 'unknown')} allows contact/preference overwrite")
        if not rule.get("patientVisibleCopyKey", "").startswith("LINK_172_COPY_"):
            fail(f"{rule.get('ruleId', 'unknown')} lacks patient-visible copy key")


def validate_examples(payload: dict[str, Any]) -> None:
    examples = payload.get("examples", [])
    if not examples:
        fail("candidate competition examples are empty")

    states = {item.get("patientFacingState") for item in examples}
    missing_states = sorted(PATIENT_STATES - states)
    if missing_states:
        fail(f"candidate examples missing patient states: {', '.join(missing_states)}")

    link_states = {item.get("linkState") for item in examples}
    for required in ["verified_patient", "provisional_verified", "ambiguous", "none", "correction_pending"]:
        if required not in link_states:
            fail(f"candidate examples missing linkState {required}")

    for item in examples:
        example_id = item.get("exampleId", "unknown")
        if item.get("routeSensitivityFamily") not in ROUTE_SENSITIVITY_FAMILIES:
            fail(f"{example_id} uses unknown routeSensitivityFamily")
        if item.get("linkState") not in LINK_STATES:
            fail(f"{example_id} uses unknown linkState")
        for field in [
            "P_link",
            "LCB_link_alpha",
            "UCB_link_alpha",
            "P_subject",
            "LCB_subject_alpha",
            "runnerUpProbabilityUpperBound",
        ]:
            value = item.get(field)
            if not isinstance(value, (int, float)) or not 0 <= value <= 1:
                fail(f"{example_id} has invalid probability field {field}")
        if item.get("linkState") == "verified_patient" and item.get("confidenceModelState") != "calibrated":
            fail(f"{example_id} verified_patient must be calibrated")
        if item.get("linkState") == "verified_patient" and item.get("runnerUpProbabilityUpperBound") > 0.05:
            fail(f"{example_id} verified_patient lacks runner-up separation")
        if item.get("confidenceModelState") == "out_of_domain" and item.get("linkState") == "verified_patient":
            fail(f"{example_id} out_of_domain cannot verify patient")
        if not item.get("reasonCodes") or not all(
            str(code).startswith("LINK_172_") for code in item.get("reasonCodes", [])
        ):
            fail(f"{example_id} reason codes must be LINK_172 namespaced")

    registry_states = {item.get("state") for item in payload.get("patientStateRegistry", [])}
    if registry_states != PATIENT_STATES:
        fail("patientStateRegistry must exactly cover the patient-facing state grammar")
    for item in payload.get("patientStateRegistry", []):
        reveal = item.get("safeReveal", "").lower()
        if "candidate comparison" in reveal or "raw" in reveal or "probability" in reveal:
            fail(f"{item.get('state')} safe reveal exposes unsafe detail")
        if not item.get("copyKey", "").startswith("LINK_172_COPY_"):
            fail(f"{item.get('state')} lacks LINK_172 copy key")


def validate_gap_log(gap_log: dict[str, Any]) -> None:
    if gap_log.get("unresolvedGaps") != []:
        fail("patient link gap log must have no unresolved gaps")
    gap_ids = {item.get("gapId") for item in gap_log.get("resolvedGaps", [])}
    missing = sorted(REQUIRED_GAP_IDS - gap_ids)
    if missing:
        fail(f"patient link gap log missing closures: {', '.join(missing)}")


def validate_docs_and_board() -> None:
    doc_markers = {
        ARCHITECTURE_DOC: [
            "CandidateSearchSpec",
            "MatchEvidenceBasis",
            "PatientLinkDecision",
            "IdentityBindingAuthority",
            "PDS_ENRICHMENT_SEAM_172",
            "gap_logit",
        ],
        SECURITY_DOC: [
            "contactClaims",
            "pdsDemographics",
            "patientPreferredComms",
            "Fail-Closed Rules",
            "Runner-up",
        ],
        FRONTEND_SPEC: [
            "Patient_Linkage_Confidence_Board",
            "LINK_172_COPY_CONFIRM_DETAILS",
            "same-shell",
            "patient-state atlas parity",
        ],
    }
    for path, markers in doc_markers.items():
        require_markers(str(path.relative_to(ROOT)), require_file(path), markers)

    board = require_file(BOARD)
    require_markers(str(BOARD.relative_to(ROOT)), board, REQUIRED_BOARD_MARKERS)
    for visual, table in [
        ("candidate-confidence-ridge", "candidate-confidence-table"),
        ("subject-proof-braid", "subject-proof-table"),
        ("threshold-ladder", "threshold-table"),
        ("patient-state-atlas", "patient-state-table"),
    ]:
        if visual not in board or table not in board:
            fail(f"board missing parity mapping for {visual} -> {table}")

    spec = require_file(PLAYWRIGHT_SPEC)
    require_markers(str(PLAYWRIGHT_SPEC.relative_to(ROOT)), spec, REQUIRED_SPEC_MARKERS)


def validate_package_wiring() -> None:
    package = load_json(ROOT_PACKAGE)
    scripts = package.get("scripts", {})
    expected = "python3 ./tools/analysis/validate_phase2_patient_link_contracts.py"
    if scripts.get("validate:phase2-patient-link-contracts") != expected:
        fail("root package missing validate:phase2-patient-link-contracts script")
    for script_name in ["bootstrap", "check"]:
        if "pnpm validate:phase2-patient-link-contracts" not in scripts.get(script_name, ""):
            fail(f"root package {script_name} missing phase2 patient link validation")

    playwright_package = load_json(PLAYWRIGHT_PACKAGE)
    for script_name in ["build", "lint", "test", "typecheck", "e2e"]:
        script = playwright_package.get("scripts", {}).get(script_name, "")
        if "172_patient_linkage_confidence_board.spec.js" not in script:
            fail(f"tests/playwright {script_name} missing seq_172 spec")

    if "validate:phase2-patient-link-contracts" not in require_file(ROOT_SCRIPT_UPDATES):
        fail("root_script_updates.py missing phase2 patient link script")


def validate_checklist() -> None:
    checklist = require_file(CHECKLIST)
    if not re.search(r"- \[[Xx]\] seq_171_", checklist):
        fail("seq_171 must be complete before seq_172")
    if not re.search(r"- \[(?:-|X)\] seq_172_", checklist):
        fail("seq_172 is not claimed or complete in prompt/checklist.md")


def main() -> int:
    validate_schemas()
    validate_threshold_matrix(load_csv(THRESHOLD_MATRIX))
    validate_pds_seam()
    validate_contact_rules(load_json(CONTACT_RULES))
    validate_examples(load_json(CANDIDATE_EXAMPLES))
    validate_gap_log(load_json(GAP_LOG))
    validate_docs_and_board()
    validate_package_wiring()
    validate_checklist()
    print("phase2 patient link contracts validation passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
