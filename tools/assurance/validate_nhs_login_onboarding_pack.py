#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DOCS_DIR = ROOT / "docs" / "assurance"
DATA_DIR = ROOT / "data" / "assurance"
TESTS_DIR = ROOT / "tests" / "playwright"

DOC_PATHS = [
    DOCS_DIR / "124_nhs_login_onboarding_evidence_pack.md",
    DOCS_DIR / "124_nhs_login_mock_now_execution.md",
    DOCS_DIR / "124_nhs_login_actual_onboarding_strategy_later.md",
    DOCS_DIR / "124_identity_assurance_and_scope_request_matrix.md",
    DOCS_DIR / "124_nhs_login_user_journeys_and_callback_evidence.md",
]

ARTIFACT_INDEX_PATH = DATA_DIR / "nhs_login_application_artifact_index.json"
SCOPE_MATRIX_PATH = DATA_DIR / "nhs_login_scope_claim_matrix.csv"
ENVIRONMENT_PLAN_PATH = DATA_DIR / "nhs_login_environment_progression_plan.csv"
GAP_REGISTER_PATH = DATA_DIR / "nhs_login_gap_register.json"
PLAYWRIGHT_SPEC_PATH = TESTS_DIR / "nhs-login-mock-onboarding-evidence.spec.js"
ROOT_PACKAGE_PATH = ROOT / "package.json"
ROOT_SCRIPT_UPDATES_PATH = ROOT / "tools" / "analysis" / "root_script_updates.py"

REQUIRED_SCOPE_OR_CLAIM_REFS = {
    "openid",
    "profile",
    "profile_extended",
    "email",
    "phone",
    "gp_integration_credentials",
    "sub",
    "nhs_number",
    "identity_proofing_level",
    "gp_linkage_key",
    "gp_ods_code",
    "gp_user_id",
}
EXPECTED_ACTUAL_STAGES = {
    "actual_application_eligibility",
    "actual_dos_and_discovery",
    "actual_sandpit_request",
    "actual_integration_request",
    "actual_technical_conformance_and_scal",
    "actual_connection_agreement_and_production",
    "actual_live_partner_change",
}
EXPECTED_PROGRESSION_STAGES = {
    "STAGE_124_LOCAL_MOCK_EVIDENCE_REHEARSAL",
    "STAGE_124_APPLICATION_ELIGIBILITY",
    "STAGE_124_DOS_DISCOVERY_PREP",
    "STAGE_124_SANDPIT_REQUEST",
    "STAGE_124_INTEGRATION_REQUEST",
    "STAGE_124_TECHNICAL_CONFORMANCE",
    "STAGE_124_SCAL_AND_SAFETY",
    "STAGE_124_PRODUCTION_PROGRESS",
    "STAGE_124_LIVE_CHANGE_CONTROL",
}
ALLOWED_ENVIRONMENT_IDS = {
    "env_local_mock",
    "env_actual_sandpit",
    "env_actual_integration",
    "env_actual_production",
    "pre_environment",
}
ALLOWED_CALLBACK_DECISIONS = {
    "auth_read_only",
    "local_capability_review",
    "writable_candidate",
    "claim_pending",
    "consent_denied",
    "no_local_session",
    "reauth_required",
    "replay_blocked",
    "re_auth_required",
    "im1_blocked",
}


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def read_text(path: Path) -> str:
    require(path.exists(), f"Missing required artifact: {path}")
    return path.read_text(encoding="utf-8")


def load_json(path: Path):
    return json.loads(read_text(path))


def load_csv(path: Path) -> list[dict[str, str]]:
    return list(csv.DictReader(read_text(path).splitlines()))


def split_pipe(value: str | None) -> list[str]:
    if not value or value == "none":
        return []
    return [part for part in value.split("|") if part]


def load_playwright_manifest() -> dict:
    command = [
        "node",
        "--input-type=module",
        "-e",
        (
            "import { pathToFileURL } from 'node:url';"
            f"const modulePath = pathToFileURL('{PLAYWRIGHT_SPEC_PATH.as_posix()}').href;"
            "const mod = await import(modulePath);"
            "console.log(JSON.stringify({"
            "coverage: mod.mockOnboardingEvidenceCoverage,"
            "manifest: mod.onboardingEvidenceManifest"
            "}));"
        ),
    ]
    result = subprocess.run(command, cwd=ROOT, capture_output=True, text=True, check=True)
    return json.loads(result.stdout)


def main() -> None:
    for doc_path in DOC_PATHS:
        text = read_text(doc_path)
        lowered = text.lower()
        require("mock_now_execution" in lowered, f"{doc_path.name} is missing Mock_now_execution")
        require(
            "actual_production_strategy_later" in lowered,
            f"{doc_path.name} is missing Actual_production_strategy_later",
        )

    index = load_json(ARTIFACT_INDEX_PATH)
    scope_rows = load_csv(SCOPE_MATRIX_PATH)
    progression_rows = load_csv(ENVIRONMENT_PLAN_PATH)
    gap_register = load_json(GAP_REGISTER_PATH)
    manifest_bundle = load_playwright_manifest()

    require(index["task_id"] == "par_124", "artifact index task_id drifted")
    require(gap_register["task_id"] == "par_124", "gap register task_id drifted")
    require(index["summary"]["artifact_count"] == len(index["artifacts"]), "artifact count summary drifted")
    require(gap_register["summary"]["gap_count"] == len(gap_register["gaps"]), "gap count summary drifted")

    evidence_refs = {row["evidence_ref"]: row for row in index["evidence_refs"]}
    callback_rules = index["callback_rule_catalog"]
    artifacts = index["artifacts"]

    require(any(row["mock_or_actual"] == "mock" for row in artifacts), "mock artifacts are missing")
    require(any(row["mock_or_actual"] == "actual" for row in artifacts), "actual artifacts are missing")
    require(
        {row["onboarding_stage"] for row in artifacts if row["mock_or_actual"] == "actual"} == EXPECTED_ACTUAL_STAGES,
        "actual onboarding stage set drifted",
    )

    for row in artifacts:
        required_scalar_fields = [
            "artifact_id",
            "artifact_type",
            "mock_or_actual",
            "submittable_state",
            "onboarding_stage",
            "journey_type",
            "scope_or_claim_ref",
            "assurance_level_assumption",
            "current_evidence_ref",
            "gap_state",
            "owner_role",
            "review_due_at",
            "notes",
        ]
        for field_name in required_scalar_fields:
            require(row[field_name], f"{row['artifact_id']} is missing {field_name}")
        require(row["source_blueprint_refs"], f"{row['artifact_id']} is missing source_blueprint_refs")
        require(
            "dependent_integration_refs" in row and row["dependent_integration_refs"] is not None,
            f"{row['artifact_id']} is missing dependent_integration_refs",
        )
        require(
            row["current_evidence_ref"] in evidence_refs,
            f"{row['artifact_id']} references unknown evidence ref {row['current_evidence_ref']}",
        )
        evidence_kind = evidence_refs[row["current_evidence_ref"]]["mock_or_actual"]
        if row["mock_or_actual"] == "actual":
            require(
                evidence_kind != "mock",
                f"{row['artifact_id']} is marked actual but depends only on mock evidence",
            )
            require(
                row["onboarding_stage"].startswith("actual_"),
                f"{row['artifact_id']} mixes actual strategy into a non-actual stage",
            )
        else:
            require(
                row["onboarding_stage"] == "mock_local_bridge",
                f"{row['artifact_id']} mixes mock strategy into an actual stage",
            )

    require(
        any(gap["gap_id"] == "GAP_NHS_LOGIN_IM1_DEPENDENT_SCOPE_APPROVAL_PENDING" for gap in gap_register["gaps"]),
        "IM1-dependent NHS login scope approval gap is missing",
    )

    callback_rule_ids = {row["rule_id"] for row in callback_rules}
    require(
        "RULE_124_CALLBACK_SUCCESS_IS_NOT_WRITE_AUTHORITY" in callback_rule_ids,
        "callback success boundary rule is missing",
    )
    for row in callback_rules:
        for decision in row["allowed_local_session_decisions"]:
            require(
                decision in ALLOWED_CALLBACK_DECISIONS,
                f"Unexpected callback-local-session decision: {decision}",
            )
        require("writable" not in row["allowed_local_session_decisions"], "bare writable state is not allowed")

    required_scope_columns = {
        "row_id",
        "entry_kind",
        "bundle_refs",
        "scope_or_claim_ref",
        "product_purpose",
        "exact_in_product_use",
        "route_binding_refs",
        "assurance_level_assumption",
        "dependent_integration_refs",
        "blocked_reason",
        "contact_truth_boundary",
        "current_evidence_ref",
        "gap_state",
        "owner_role",
        "review_due_at",
        "notes",
    }
    require(required_scope_columns <= set(scope_rows[0].keys()), "scope matrix columns drifted")
    scope_refs = {row["scope_or_claim_ref"] for row in scope_rows}
    require(REQUIRED_SCOPE_OR_CLAIM_REFS <= scope_refs, "scope or claim coverage drifted")

    for row in scope_rows:
        require(row["product_purpose"], f"{row['row_id']} is missing product_purpose")
        require(row["exact_in_product_use"], f"{row['row_id']} is missing exact_in_product_use")
        require(
            row["current_evidence_ref"] in evidence_refs,
            f"{row['row_id']} references unknown evidence ref {row['current_evidence_ref']}",
        )

    for sensitive_ref in ("gp_integration_credentials", "gp_linkage_key", "gp_ods_code", "gp_user_id"):
        sensitive_rows = [row for row in scope_rows if row["scope_or_claim_ref"] == sensitive_ref]
        require(sensitive_rows, f"Missing blocked scope or claim row for {sensitive_ref}")
        for row in sensitive_rows:
            dependents = split_pipe(row["dependent_integration_refs"])
            require(
                "par_123_im1_scal_readiness_pack" in dependents,
                f"{row['row_id']} is missing par_123 dependency",
            )
            require(
                row["gap_state"].startswith("blocked"),
                f"{row['row_id']} should remain blocked until IM1 prerequisites are real",
            )

    for contact_ref in ("email", "phone", "phone_number", "email_verified", "phone_number_verified"):
        for row in scope_rows:
            if row["scope_or_claim_ref"] == contact_ref:
                require(
                    "not_authoritative" in row["contact_truth_boundary"],
                    f"{row['row_id']} lost the contact-truth boundary",
                )

    required_progression_columns = {
        "stage_id",
        "stage_label",
        "mock_or_actual",
        "environment_profile_id",
        "official_path_ref",
        "entry_requirements",
        "exit_evidence",
        "submittable_state",
        "dependent_integration_refs",
        "gap_state",
        "owner_role",
        "review_due_at",
        "notes",
    }
    require(
        required_progression_columns <= set(progression_rows[0].keys()),
        "environment progression columns drifted",
    )
    require(
        {row["stage_id"] for row in progression_rows} == EXPECTED_PROGRESSION_STAGES,
        "environment progression stage set drifted",
    )
    for row in progression_rows:
        require(
            row["environment_profile_id"] in ALLOWED_ENVIRONMENT_IDS,
            f"Unexpected environment_profile_id: {row['environment_profile_id']}",
        )

    actual_strategy = read_text(DOCS_DIR / "124_nhs_login_actual_onboarding_strategy_later.md")
    for required_phrase in (
        "Digital Onboarding Service",
        "Sandpit Environment Request",
        "Integration Environment Request",
        "Technical Conformance Report",
        "SCAL",
        "Connection Agreement",
        "Production Environment Request",
        "Live Partner Change Request",
    ):
        require(required_phrase in actual_strategy, f"Actual strategy is missing {required_phrase}")

    journey_doc = read_text(DOCS_DIR / "124_nhs_login_user_journeys_and_callback_evidence.md").lower()
    for required_phrase in (
        "sign-in",
        "callback",
        "local session",
        "logout",
        "expiry",
    ):
        require(required_phrase in journey_doc, f"Journey evidence doc is missing {required_phrase}")

    spec_coverage = manifest_bundle["coverage"]
    spec_manifest = manifest_bundle["manifest"]
    require(spec_manifest["task"] == "par_124", "Playwright manifest task drifted")
    require(spec_manifest["onboardingStage"] == "mock_local_bridge", "Playwright manifest stage drifted")
    required_coverage = {
        "sign-in entry from the shell",
        "callback handling returns governed route data",
        "auth_read_only local session outcome",
        "writable candidate remains locally governed",
        "local logout resets only the local session",
        "session expiry returns re-auth recovery",
    }
    require(required_coverage <= set(spec_coverage), "Playwright coverage drifted")
    require(
        {"auth_read_only", "writable_candidate", "logged_out", "re_auth_required"}
        <= set(spec_manifest["verifiedPostures"]),
        "Playwright manifest posture coverage drifted",
    )

    root_package = load_json(ROOT_PACKAGE_PATH)
    root_scripts = root_package["scripts"]
    require(
        root_scripts.get("validate:nhs-login-onboarding-pack")
        == "python3 ./tools/assurance/validate_nhs_login_onboarding_pack.py",
        "Root package validate script is missing or drifted",
    )
    root_script_updates = read_text(ROOT_SCRIPT_UPDATES_PATH)
    require(
        "validate:nhs-login-onboarding-pack" in root_script_updates,
        "root_script_updates.py is missing the onboarding-pack validator entry",
    )


if __name__ == "__main__":
    main()
