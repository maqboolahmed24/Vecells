#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"
TESTS_DIR = ROOT / "tests" / "playwright"

MATRIX_PATH = DATA_DIR / "access_grant_family_matrix.csv"
CASEBOOK_PATH = DATA_DIR / "access_grant_casebook.json"
MANIFEST_PATH = DATA_DIR / "access_grant_runtime_tuple_manifest.json"
DESIGN_DOC_PATH = DOCS_DIR / "78_access_grant_service_design.md"
RULES_DOC_PATH = DOCS_DIR / "78_access_grant_family_and_redemption_rules.md"
LAB_PATH = DOCS_DIR / "78_access_grant_journey_lab.html"
SPEC_PATH = TESTS_DIR / "access-grant-journey-lab.spec.js"

ROOT_SCRIPT_UPDATES_PATH = ROOT / "tools" / "analysis" / "root_script_updates.py"
ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = TESTS_DIR / "package.json"

DOMAIN_SOURCE_PATH = ROOT / "packages" / "domains" / "identity_access" / "src" / "identity-access-backbone.ts"
DOMAIN_TEST_PATH = ROOT / "packages" / "domains" / "identity_access" / "tests" / "identity-access-backbone.test.ts"
SERVICE_SOURCE_PATH = ROOT / "services" / "command-api" / "src" / "access-grant.ts"
SERVICE_TEST_PATH = ROOT / "services" / "command-api" / "tests" / "access-grant.integration.test.js"


def fail(message: str) -> None:
    raise SystemExit(message)


def load_json(path: Path) -> object:
    if not path.exists():
        fail(f"Missing required JSON artifact: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def load_csv(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        fail(f"Missing required CSV artifact: {path}")
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def assert_contains(path: Path, needle: str) -> None:
    if not path.exists():
        fail(f"Missing required source file: {path}")
    source = path.read_text(encoding="utf-8")
    if needle not in source:
        fail(f"{path} is missing required token: {needle}")


def main() -> None:
    manifest = load_json(MANIFEST_PATH)
    casebook = load_json(CASEBOOK_PATH)
    matrix_rows = load_csv(MATRIX_PATH)

    for required_path in [DESIGN_DOC_PATH, RULES_DOC_PATH, LAB_PATH, SPEC_PATH]:
        if not required_path.exists():
            fail(f"Missing required artifact: {required_path}")

    summary = manifest["summary"]
    if summary["grant_family_count"] != len(manifest["grant_families"]):
        fail("grant_family_count drifted from grant_families.")
    if summary["use_case_count"] != len(manifest["use_cases"]):
        fail("use_case_count drifted from use_cases.")
    if summary["runtime_tuple_count"] != len(manifest["runtime_tuples"]):
        fail("runtime_tuple_count drifted from runtime_tuples.")
    if summary["parallel_gap_count"] != len(manifest["parallel_interface_gaps"]):
        fail("parallel_gap_count drifted from parallel_interface_gaps.")
    if summary["bounded_port_count"] != len(manifest["bounded_ports"]):
        fail("bounded_port_count drifted from bounded_ports.")
    if summary["authoritative_operation_count"] != len(manifest["authoritative_operations"]):
        fail("authoritative_operation_count drifted from authoritative_operations.")

    case_summary = casebook["summary"]
    if case_summary["scenario_count"] != len(casebook["cases"]):
        fail("scenario_count drifted from casebook cases.")
    if len(matrix_rows) != summary["use_case_count"]:
        fail("Matrix row count drifted from frozen use-case count.")

    required_scenarios = {
        "draft_resume_issue_and_redeem",
        "request_claim_auth_uplift",
        "secure_continuation_verified_resume",
        "callback_reply_single_use",
        "message_reply_reissued",
        "booking_manage_rotated",
        "waitlist_offer_replay_safe",
        "network_alternative_choice_route_drift",
        "pharmacy_choice_wrong_patient_revoked",
        "support_reissue_recovery",
        "recover_only_no_grant",
        "manual_only_support_gate",
    }
    scenario_ids = {case["scenarioId"] for case in casebook["cases"]}
    if not required_scenarios.issubset(scenario_ids):
        fail("Casebook is missing one or more required access-grant scenarios.")

    if "PARALLEL_INTERFACE_GAP_AUTH_BRIDGE_CALLBACK_PROVIDER" not in manifest["parallel_interface_gaps"]:
        fail("Manifest is missing PARALLEL_INTERFACE_GAP_AUTH_BRIDGE_CALLBACK_PROVIDER.")
    if "PARALLEL_INTERFACE_GAP_SESSION_COOKIE_RUNTIME" not in manifest["parallel_interface_gaps"]:
        fail("Manifest is missing PARALLEL_INTERFACE_GAP_SESSION_COOKIE_RUNTIME.")

    html = LAB_PATH.read_text(encoding="utf-8")
    for marker in [
        "Access_Grant_Journey_Lab",
        'data-testid="family-ladder"',
        'data-testid="transition-map"',
        'data-testid="supersession-ribbon"',
        'data-testid="issuance-table"',
        'data-testid="redemption-table"',
        'data-testid="inspector"',
        'data-testid="family-filter"',
        'data-testid="redemption-state-filter"',
        'data-testid="subject-binding-filter"',
        'data-testid="route-family-filter"',
    ]:
        if marker not in html:
            fail(f"Journey lab HTML is missing required marker: {marker}")

    spec_source = SPEC_PATH.read_text(encoding="utf-8")
    for probe in [
        "issuance, redemption, and supersession filters",
        "selection synchronization",
        "keyboard navigation and focus order",
        "reduced motion",
        "responsive layout",
        "accessibility smoke checks",
    ]:
        if probe not in spec_source:
            fail(f"Spec is missing expected coverage text: {probe}")

    root_script_updates = ROOT_SCRIPT_UPDATES_PATH.read_text(encoding="utf-8")
    for token in [
        "build_access_grant_service.py",
        "validate:access-grant",
        "validate_access_grant_service.py",
    ]:
        if token not in root_script_updates:
            fail(f"root_script_updates.py is missing required token: {token}")

    root_package = load_json(ROOT_PACKAGE_PATH)
    scripts = root_package["scripts"]
    if "build_access_grant_service.py" not in scripts["codegen"]:
        fail("Root codegen script is missing build_access_grant_service.py.")
    if "pnpm validate:access-grant" not in scripts["bootstrap"]:
        fail("Root bootstrap script is missing validate:access-grant.")
    if "pnpm validate:access-grant" not in scripts["check"]:
        fail("Root check script is missing validate:access-grant.")
    if (
        scripts["validate:access-grant"]
        != "python3 ./tools/analysis/validate_access_grant_service.py"
    ):
        fail("Root validate:access-grant script drifted.")

    playwright_package = load_json(PLAYWRIGHT_PACKAGE_PATH)
    playwright_scripts = playwright_package["scripts"]
    for key, token in {
        "build": "node --check access-grant-journey-lab.spec.js",
        "lint": "eslint access-grant-journey-lab.spec.js",
        "test": "node access-grant-journey-lab.spec.js",
        "typecheck": "node --check access-grant-journey-lab.spec.js",
        "e2e": "node access-grant-journey-lab.spec.js --run",
    }.items():
        if token not in playwright_scripts[key]:
            fail(f"Playwright package script {key} is missing {token}.")

    for token in [
        "issueGrantForUseCase",
        "openAuthBridgeFlow",
        "rotateGrant",
        "replaceGrant",
        "revokeGrant",
        "OpaqueAccessGrantTokenMaterializer",
        "LocalSessionGovernor",
        "LocalAuthBridge",
        "accessGrantParallelInterfaceGaps",
    ]:
        assert_contains(DOMAIN_SOURCE_PATH, token)

    for token in [
        "accessGrantPersistenceTables",
        "accessGrantMigrationPlanRefs",
        "createAccessGrantApplication",
        "parallelInterfaceGaps",
    ]:
        assert_contains(SERVICE_SOURCE_PATH, token)

    assert_contains(DOMAIN_TEST_PATH, "issues immutable scope envelopes and returns the same redemption on exact replay")
    assert_contains(SERVICE_TEST_PATH, "openAuthBridgeFlow")

    print("access-grant service validated")


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception as error:  # pragma: no cover
        fail(str(error))
