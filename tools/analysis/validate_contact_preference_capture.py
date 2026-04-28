#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "analysis"))

from root_script_updates import ROOT_SCRIPT_UPDATES


DATA_ANALYSIS_DIR = ROOT / "data" / "analysis"
DATA_CONTRACTS_DIR = ROOT / "data" / "contracts"
DOCS_ARCHITECTURE_DIR = ROOT / "docs" / "architecture"
DOMAIN_SRC_DIR = ROOT / "packages" / "domains" / "intake_request" / "src"
DOMAIN_TESTS_DIR = ROOT / "packages" / "domains" / "intake_request" / "tests"
EVENT_CONTRACTS_SRC_DIR = ROOT / "packages" / "event-contracts" / "src"
COMMAND_API_SRC_DIR = ROOT / "services" / "command-api" / "src"
COMMAND_API_TESTS_DIR = ROOT / "services" / "command-api" / "tests"

PACKAGE_JSON_PATH = ROOT / "package.json"
ROOT_SCRIPT_UPDATES_PATH = ROOT / "tools" / "analysis" / "root_script_updates.py"
MIGRATION_PATH = ROOT / "services" / "command-api" / "migrations" / "084_phase1_contact_preference_capture.sql"

EVENTS_PATH = EVENT_CONTRACTS_SRC_DIR / "submission-lineage-events.ts"
DOMAIN_INDEX_PATH = DOMAIN_SRC_DIR / "index.ts"
CAPTURE_PATH = DOMAIN_SRC_DIR / "contact-preference-capture.ts"
VALIDATION_PATH = DOMAIN_SRC_DIR / "submission-envelope-validation.ts"
DOMAIN_TEST_PATH = DOMAIN_TESTS_DIR / "contact-preference-capture.test.ts"
DOMAIN_PUBLIC_API_TEST_PATH = DOMAIN_TESTS_DIR / "public-api.test.ts"
SUBMISSION_TEST_PATH = DOMAIN_TESTS_DIR / "submission-envelope-validation.test.ts"
COMMAND_API_PATH = COMMAND_API_SRC_DIR / "contact-preference.ts"
COMMAND_API_VALIDATION_PATH = COMMAND_API_SRC_DIR / "submission-envelope-validation.ts"
COMMAND_API_TEST_PATH = COMMAND_API_TESTS_DIR / "contact-preference.integration.test.js"

CONTRACT_PATH = DATA_CONTRACTS_DIR / "147_contact_preference_contract.json"
MASKED_VIEW_PATH = DATA_CONTRACTS_DIR / "147_contact_preference_masked_view.json"
MATRIX_PATH = DATA_ANALYSIS_DIR / "147_contact_preference_completeness_matrix.csv"
REASONS_PATH = DATA_ANALYSIS_DIR / "147_contact_preference_reason_codes.json"
DESIGN_DOC_PATH = DOCS_ARCHITECTURE_DIR / "147_contact_preference_capture_design.md"
BOUNDARY_DOC_PATH = DOCS_ARCHITECTURE_DIR / "147_masking_and_route_truth_boundary.md"


def ensure(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def read_csv_rows(path: Path) -> list[dict[str, str]]:
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def main() -> None:
    required_paths = [
        PACKAGE_JSON_PATH,
        ROOT_SCRIPT_UPDATES_PATH,
        MIGRATION_PATH,
        EVENTS_PATH,
        DOMAIN_INDEX_PATH,
        CAPTURE_PATH,
        VALIDATION_PATH,
        DOMAIN_TEST_PATH,
        DOMAIN_PUBLIC_API_TEST_PATH,
        SUBMISSION_TEST_PATH,
        COMMAND_API_PATH,
        COMMAND_API_VALIDATION_PATH,
        COMMAND_API_TEST_PATH,
        CONTRACT_PATH,
        MASKED_VIEW_PATH,
        MATRIX_PATH,
        REASONS_PATH,
        DESIGN_DOC_PATH,
        BOUNDARY_DOC_PATH,
    ]
    for path in required_paths:
        ensure(path.exists(), f"Missing par_147 artifact: {path}")

    package_json = read_json(PACKAGE_JSON_PATH)
    contract = read_json(CONTRACT_PATH)
    masked_view_contract = read_json(MASKED_VIEW_PATH)
    reason_catalog = read_json(REASONS_PATH)
    matrix_rows = read_csv_rows(MATRIX_PATH)

    events_text = EVENTS_PATH.read_text(encoding="utf-8")
    domain_index_text = DOMAIN_INDEX_PATH.read_text(encoding="utf-8")
    capture_text = CAPTURE_PATH.read_text(encoding="utf-8")
    validation_text = VALIDATION_PATH.read_text(encoding="utf-8")
    domain_test_text = DOMAIN_TEST_PATH.read_text(encoding="utf-8")
    domain_public_api_test_text = DOMAIN_PUBLIC_API_TEST_PATH.read_text(encoding="utf-8")
    submission_test_text = SUBMISSION_TEST_PATH.read_text(encoding="utf-8")
    command_api_text = COMMAND_API_PATH.read_text(encoding="utf-8")
    command_api_validation_text = COMMAND_API_VALIDATION_PATH.read_text(encoding="utf-8")
    command_api_test_text = COMMAND_API_TEST_PATH.read_text(encoding="utf-8")
    docs_text = DESIGN_DOC_PATH.read_text(encoding="utf-8") + "\n" + BOUNDARY_DOC_PATH.read_text(
        encoding="utf-8"
    )
    migration_text = MIGRATION_PATH.read_text(encoding="utf-8")

    ensure(
        package_json["scripts"].get("validate:contact-preference-capture")
        == "python3 ./tools/analysis/validate_contact_preference_capture.py",
        "package.json is missing validate:contact-preference-capture.",
    )
    ensure(
        ROOT_SCRIPT_UPDATES["validate:contact-preference-capture"]
        == "python3 ./tools/analysis/validate_contact_preference_capture.py",
        "root_script_updates.py is missing validate:contact-preference-capture.",
    )
    ensure(
        "pnpm validate:contact-preference-capture" in ROOT_SCRIPT_UPDATES["bootstrap"]
        and "pnpm validate:contact-preference-capture" in ROOT_SCRIPT_UPDATES["check"],
        "Root script update strings do not include validate:contact-preference-capture.",
    )

    for token in [
        "intake.contact_preferences.captured",
        "intake.contact_preferences.frozen",
        "emitIntakeContactPreferencesCaptured",
        "emitIntakeContactPreferencesFrozen",
    ]:
        ensure(token in events_text, f"submission-lineage-events.ts is missing {token}.")

    ensure(
        'export * from "./contact-preference-capture";' in domain_index_text,
        "Domain package index must export contact-preference-capture.",
    )
    for token in [
        "createPhase1ContactPreferenceService",
        "createPhase1ContactPreferenceStore",
        "ContactPreferenceSubmitFreezeDocument",
        "ContactRouteSnapshotSeedDocument",
        "buildValidationSummaryForDraft",
    ]:
        ensure(token in capture_text, f"contact-preference-capture.ts is missing {token}.")

    for token in [
        "contactPreferenceSummary?: ContactPreferenceValidationSummary",
        "CONTACT_PREFERENCE_INCOMPLETE",
        "CONTACT_PREFERENCE_BLOCKED",
        "resolveContactPreferenceSummary",
        "contactPreferencesRef",
        "PARALLEL_INTERFACE_GAP_147_CONTACT_PREFERENCE_CAPTURE_PENDING",
    ]:
        ensure(token in validation_text, f"submission-envelope-validation.ts is missing {token}.")

    for token in [
        "createContactPreferenceApplication",
        "createPhase1ContactPreferenceService",
        "createReachabilityGovernorService",
        "contactPreferenceResolver",
        "mintInitialContactRouteSnapshot",
        "verificationState: seedSnapshot.verificationState",
    ]:
        ensure(token in command_api_text, f"contact-preference.ts is missing {token}.")

    ensure(
        "contactPreferenceSummary" in command_api_validation_text
        and "contactPreferenceResolver" in command_api_validation_text,
        "Command API submission validation seam must wire contact preference summaries.",
    )

    for token in [
        "replays exact idempotent writes",
        "contactPreferencesRef",
        "followUpPermission",
    ]:
        ensure(token in domain_test_text, f"contact-preference-capture tests lost {token}.")

    ensure(
        "createPhase1ContactPreferenceService" in domain_public_api_test_text
        and "createPhase1ContactPreferenceStore" in domain_public_api_test_text,
        "Public API test must assert contact-preference exports.",
    )
    for token in [
        "CONTACT_PREFERENCE_INCOMPLETE",
        "contactPreferencesRef",
        "contactPreferenceSummary",
    ]:
        ensure(token in submission_test_text, f"Submission validation tests lost {token}.")

    for token in [
        "captureContactPreferences",
        "CONTACT_PREFERENCE_INCOMPLETE",
        "mintInitialContactRouteSnapshot",
        "unverified",
    ]:
        ensure(token in command_api_test_text, f"Integration tests lost {token}.")

    ensure(
        contract["taskId"] == "par_147",
        "Contact preference contract must declare taskId par_147.",
    )
    ensure(
        contract["contractId"] == "PHASE1_CONTACT_PREFERENCE_CAPTURE_V1",
        "Contact preference contract ID drifted.",
    )
    ensure(
        contract["protectedStorageRules"]["maskedSummaryRequiredForOrdinarySurfaces"] is True,
        "Contract must require masked summaries on ordinary surfaces.",
    )
    ensure(
        "logs" in contract["protectedStorageRules"]["rawDestinationLeakageForbiddenIn"]
        and "dom" in contract["protectedStorageRules"]["rawDestinationLeakageForbiddenIn"],
        "Contract must forbid raw destination leakage into ordinary surfaces.",
    )
    ensure(
        contract["routeSnapshotSeedBridge"]["defaultVerificationState"] == "unverified",
        "Initial contact route truth must stay unverified in par_147.",
    )
    ensure(
        contract["routeSnapshotSeedBridge"]["bridgeObjectMayNotClaimReachabilityClear"] is True,
        "par_147 must not create calm clear reachability assessments.",
    )
    required_contract_events = {
        "intake.contact_preferences.captured",
        "intake.contact_preferences.frozen",
    }
    ensure(
        required_contract_events.issubset(set(contract["publicEventPolicy"]["internalEventNames"])),
        "Contact preference contract lost required internal events.",
    )
    ensure(
        contract["publicEventPolicy"]["newPublicEvents"] == [],
        "par_147 must not mint new public event names.",
    )

    ensure(
        masked_view_contract["contractId"] == "PHASE1_CONTACT_PREFERENCE_MASKED_VIEW_V1",
        "Masked view contract ID drifted.",
    )
    ensure(
        masked_view_contract["ordinarySurfaceContract"]["onlyMaskedDestinationSummariesAllowed"] is True,
        "Masked view contract must forbid raw destinations.",
    )

    reason_codes = {entry["reasonCode"] for entry in reason_catalog["reasonCodes"]}
    for code in [
        "GAP_RESOLVED_CONTACT_PREFERENCE_MINIMUM_PHASE1_SELF_SERVICE_V1",
        "CONTACT_PREF_INITIAL_CAPTURE",
        "CONTACT_PREF_DESTINATION_CHANGED",
        "CONTACT_PREF_DESTINATION_REQUIRED_FOR_PREFERRED_CHANNEL",
        "CONTACT_PREF_FOLLOW_UP_PERMISSION_REQUIRED",
        "CONTACT_PREF_CAPTURE_MISSING",
    ]:
        ensure(code in reason_codes, f"Reason-code catalog is missing {code}.")

    ensure(matrix_rows, "147_contact_preference_completeness_matrix.csv must contain rows.")
    completeness_states = {row["completeness_state"] for row in matrix_rows}
    ensure(
        {"complete", "incomplete"}.issubset(completeness_states),
        "Completeness matrix must cover complete and incomplete states.",
    )
    ensure(
        any(
            row["preferred_channel"] in {"sms", "email", "phone", "null"}
            and row["follow_up_permission_state"] == "not_set"
            and row["completeness_state"] == "incomplete"
            for row in matrix_rows
        ),
        "Completeness matrix must cover missing follow-up permission.",
    )
    ensure(
        any(
            row["preferred_channel"] in {"sms", "email", "phone", "null"}
            and row["preferred_destination_state"] == "missing"
            and row["completeness_state"] == "incomplete"
            for row in matrix_rows
        ),
        "Completeness matrix must cover missing preferred-channel destination.",
    )
    ensure(
        any(
            row["completeness_state"] == "complete"
            and row["route_snapshot_seed_state"] == "ready_to_mint"
            for row in matrix_rows
        ),
        "Completeness matrix must show route seeds only for complete captures.",
    )

    for token in [
        "masked",
        "ordinary surfaces",
        "unverified",
        "route truth",
        "contactPreferencesRef",
    ]:
        ensure(token.lower() in docs_text.lower(), f"par_147 docs must mention {token}.")

    for table_name in [
        "phase1_contact_preference_captures",
        "phase1_contact_preference_masked_views",
        "phase1_contact_route_snapshot_seeds",
        "phase1_contact_preference_submit_freezes",
    ]:
        ensure(
            table_name in migration_text,
            f"Migration 084 must create {table_name}.",
        )

    print("validate_contact_preference_capture: ok")


if __name__ == "__main__":
    main()
