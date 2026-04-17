#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"
TESTS_DIR = ROOT / "tests" / "playwright"

CASEBOOK_PATH = DATA_DIR / "identity_repair_casebook.json"
MATRIX_PATH = DATA_DIR / "reachability_repair_matrix.csv"
MANIFEST_PATH = DATA_DIR / "route_authority_manifest.json"
DESIGN_DOC_PATH = DOCS_DIR / "80_identity_repair_and_reachability_governor_design.md"
RULES_DOC_PATH = DOCS_DIR / "80_wrong_patient_and_contact_route_repair_rules.md"
HTML_PATH = DOCS_DIR / "80_identity_repair_reachability_command_center.html"
SPEC_PATH = TESTS_DIR / "identity-repair-reachability-command-center.spec.js"

ROOT_SCRIPT_UPDATES_PATH = ROOT / "tools" / "analysis" / "root_script_updates.py"
ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = TESTS_DIR / "package.json"

DOMAIN_SOURCE_PATH = ROOT / "packages" / "domains" / "identity_access" / "src" / "identity-repair-backbone.ts"
DOMAIN_TEST_PATH = ROOT / "packages" / "domains" / "identity_access" / "tests" / "identity-repair-backbone.test.ts"
SERVICE_SOURCE_PATH = ROOT / "services" / "command-api" / "src" / "identity-access.ts"
SERVICE_TEST_PATH = ROOT / "services" / "command-api" / "tests" / "identity-repair.integration.test.js"
MIGRATION_PATH = ROOT / "services" / "command-api" / "migrations" / "080_identity_repair_and_reachability_governor.sql"


def fail(message: str) -> None:
    raise SystemExit(message)


def read_json(path: Path) -> object:
    if not path.exists():
        fail(f"Missing required JSON artifact: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def read_csv(path: Path) -> list[dict[str, str]]:
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
    casebook = read_json(CASEBOOK_PATH)
    matrix_rows = read_csv(MATRIX_PATH)
    manifest = read_json(MANIFEST_PATH)

    for required_path in [DESIGN_DOC_PATH, RULES_DOC_PATH, HTML_PATH, SPEC_PATH, MIGRATION_PATH]:
        if not required_path.exists():
            fail(f"Missing required artifact: {required_path}")

    if casebook["task_id"] != "par_080":
        fail("Identity repair casebook task id drifted.")
    if casebook["mode"] != "Identity_Repair_Reachability_Command_Center":
        fail("Identity repair casebook visual mode drifted.")
    if casebook["summary"]["repair_case_count"] != len(casebook["repairCases"]):
        fail("repair_case_count drifted from repairCases.")
    if casebook["summary"]["reachability_case_count"] != len(casebook["reachabilityCases"]):
        fail("reachability_case_count drifted from reachabilityCases.")
    if casebook["summary"]["released_case_count"] != sum(
        1 for row in casebook["repairCases"] if row["state"] == "closed"
    ):
        fail("released_case_count drifted from repairCases.")
    if len(matrix_rows) != 6:
        fail("Reachability repair matrix row count drifted.")

    required_repair_ids = {
        "IRC_080_WRONG_PATIENT",
        "IRC_080_DELIVERY_DISPUTE",
        "IRC_080_AUDIT_REPLAY",
    }
    repair_ids = {row["repairCaseId"] for row in casebook["repairCases"]}
    if repair_ids != required_repair_ids:
        fail("Identity repair case ids drifted.")

    required_dependency_ids = {
        "RD_080_CALLBACK",
        "RD_080_PHARMACY",
        "RD_080_MESSAGE",
        "RD_080_WAITLIST",
    }
    dependency_ids = {row["dependencyId"] for row in casebook["reachabilityCases"]}
    if dependency_ids != required_dependency_ids:
        fail("Reachability dependency ids drifted.")

    expected_events = {
        "identity.repair_case.opened",
        "identity.repair_case.freeze_committed",
        "identity.repair_branch.quarantined",
        "identity.repair_release.settled",
        "reachability.route_snapshot.superseded",
        "reachability.changed",
        "reachability.repair.started",
        "reachability.verification_checkpoint.verified",
        "reachability.repair_journey.closed",
    }
    manifest_events = {row["eventName"] for row in manifest["canonical_events"]}
    if manifest_events != expected_events:
        fail("Route authority manifest canonical-event set drifted.")
    if manifest["summary"]["canonical_event_count"] != len(expected_events):
        fail("canonical_event_count drifted.")
    if manifest["summary"]["parallel_gap_count"] != 4:
        fail("parallel_gap_count drifted.")
    if manifest["summary"]["release_mode_count"] != 4:
        fail("release_mode_count drifted.")

    html = HTML_PATH.read_text(encoding="utf-8")
    for marker in [
        "Identity_Repair_Reachability_Command_Center",
        'data-testid="filter-repair-state"',
        'data-testid="filter-route-state"',
        'data-testid="filter-dependency-class"',
        'data-testid="filter-audience-impact"',
        'data-testid="repair-cascade"',
        'data-testid="route-funnel"',
        'data-testid="repair-ribbon"',
        'data-testid="repair-table"',
        'data-testid="reachability-table"',
        'data-testid="inspector"',
    ]:
        if marker not in html:
            fail(f"Command center HTML is missing required marker: {marker}")

    spec = SPEC_PATH.read_text(encoding="utf-8")
    for probe in [
        "filtering and synchronized selection",
        "keyboard navigation and focus management",
        "reduced motion",
        "responsive layout",
        "accessibility smoke checks",
    ]:
        if probe not in spec:
            fail(f"Spec is missing expected coverage text: {probe}")

    root_script_updates = ROOT_SCRIPT_UPDATES_PATH.read_text(encoding="utf-8")
    for token in [
        "build_identity_repair_and_reachability.py",
        "validate:identity-repair-reachability",
        "validate_identity_repair_and_reachability.py",
    ]:
        if token not in root_script_updates:
            fail(f"root_script_updates.py is missing required token: {token}")

    root_package = read_json(ROOT_PACKAGE_PATH)
    scripts = root_package["scripts"]
    if "build_identity_repair_and_reachability.py" not in scripts["codegen"]:
        fail("Root codegen script is missing build_identity_repair_and_reachability.py.")
    if "pnpm validate:identity-repair-reachability" not in scripts["bootstrap"]:
        fail("Root bootstrap script is missing validate:identity-repair-reachability.")
    if "pnpm validate:identity-repair-reachability" not in scripts["check"]:
        fail("Root check script is missing validate:identity-repair-reachability.")
    if (
        scripts["validate:identity-repair-reachability"]
        != "python3 ./tools/analysis/validate_identity_repair_and_reachability.py"
    ):
        fail("Root validate:identity-repair-reachability script drifted.")

    playwright_package = read_json(PLAYWRIGHT_PACKAGE_PATH)
    playwright_scripts = playwright_package["scripts"]
    expected_playwright_checks = {
        "build": ("identity-repair-reachability-command-center.spec.js", "node --check"),
        "lint": ("identity-repair-reachability-command-center.spec.js", "eslint"),
        "test": ("identity-repair-reachability-command-center.spec.js", "node "),
        "typecheck": ("identity-repair-reachability-command-center.spec.js", "node --check"),
        "e2e": ("identity-repair-reachability-command-center.spec.js", "--run"),
    }
    for key, (filename, command_marker) in expected_playwright_checks.items():
        script = playwright_scripts[key]
        if filename not in script or command_marker not in script:
            fail(f"Playwright package script {key} is missing semantic coverage for {filename}.")

    for token in [
        "createIdentityRepairOrchestratorService",
        "createIdentityRepairSimulationHarness",
        "validateIdentityRepairLedgerState",
        "runIdentityRepairReachabilitySimulation",
        "identityRepairReachabilityCanonicalEvents",
        "createReachabilityGovernorService",
    ]:
        assert_contains(DOMAIN_SOURCE_PATH, token)

    for token in [
        "createIdentityRepairStore",
        "identityRepairOrchestrator",
        "identityRepairSimulation",
        "080_identity_repair_and_reachability_governor.sql",
        "071_request_lifecycle_lease_and_command_action_records.sql",
    ]:
        assert_contains(SERVICE_SOURCE_PATH, token)

    assert_contains(DOMAIN_TEST_PATH, "reuses the active repair case on exact signal replay")
    assert_contains(DOMAIN_TEST_PATH, "evaluates route verification and same-shell repair journey recovery")
    assert_contains(SERVICE_TEST_PATH, "freezes stale grants and clears lineage blockers only after governed repair release")

    migration_source = MIGRATION_PATH.read_text(encoding="utf-8")
    for table_name in [
        "identity_repair_cases",
        "identity_repair_signals",
        "identity_repair_freeze_records",
        "identity_repair_branch_dispositions",
        "identity_repair_release_settlements",
    ]:
        if table_name not in migration_source:
            fail(f"Migration is missing required table definition: {table_name}")

    print("identity repair and reachability validated")


if __name__ == "__main__":
    main()
