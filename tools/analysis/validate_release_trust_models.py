#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"
TESTS_DIR = ROOT / "tests" / "playwright"

MANIFEST_PATH = DATA_DIR / "release_approval_freeze_manifest.json"
MATRIX_PATH = DATA_DIR / "assurance_slice_trust_matrix.csv"
CASEBOOK_PATH = DATA_DIR / "release_trust_freeze_casebook.json"
DESIGN_DOC_PATH = DOCS_DIR / "75_release_freeze_channel_freeze_and_assurance_trust_design.md"
RULES_DOC_PATH = DOCS_DIR / "75_release_trust_verdict_rules.md"
COMMAND_CENTER_PATH = DOCS_DIR / "75_release_trust_freeze_command_center.html"
SPEC_PATH = TESTS_DIR / "release-trust-freeze-command-center.spec.js"
ROOT_SCRIPT_UPDATES_PATH = ROOT / "tools" / "analysis" / "root_script_updates.py"
ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = TESTS_DIR / "package.json"
SERVICE_PACKAGE_PATH = ROOT / "services" / "command-api" / "package.json"
ANALYTICS_SOURCE_PATH = (
    ROOT / "packages" / "domains" / "analytics_assurance" / "src" / "assurance-slice-trust-backbone.ts"
)
ANALYTICS_INDEX_PATH = ROOT / "packages" / "domains" / "analytics_assurance" / "src" / "index.ts"
IDENTITY_SOURCE_PATH = (
    ROOT / "packages" / "domains" / "identity_access" / "src" / "release-trust-freeze-backbone.ts"
)
IDENTITY_INDEX_PATH = ROOT / "packages" / "domains" / "identity_access" / "src" / "index.ts"
SERVICE_SOURCE_PATH = ROOT / "services" / "command-api" / "src" / "release-trust-freeze.ts"
SERVICE_TEST_PATH = ROOT / "services" / "command-api" / "tests" / "release-trust-freeze.integration.test.js"
MIGRATION_PATH = (
    ROOT / "services" / "command-api" / "migrations" / "075_release_approval_freeze_channel_release_freeze_and_assurance_slice_trust_models.sql"
)
RELEASE_CONTROLS_SOURCE_PATH = ROOT / "packages" / "release-controls" / "src" / "index.ts"
RELEASE_CONTROLS_TEST_PATH = ROOT / "packages" / "release-controls" / "tests" / "public-api.test.ts"


def fail(message: str) -> None:
    raise SystemExit(message)


def read_json(path: Path) -> object:
    if not path.exists():
        fail(f"Missing JSON artifact: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def read_csv(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        fail(f"Missing CSV artifact: {path}")
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def main() -> None:
    manifest = read_json(MANIFEST_PATH)
    matrix = read_csv(MATRIX_PATH)
    casebook = read_json(CASEBOOK_PATH)
    root_package = read_json(ROOT_PACKAGE_PATH)
    playwright_package = read_json(PLAYWRIGHT_PACKAGE_PATH)
    service_package = read_json(SERVICE_PACKAGE_PATH)

    for path in [
        DESIGN_DOC_PATH,
        RULES_DOC_PATH,
        COMMAND_CENTER_PATH,
        SPEC_PATH,
        ROOT_SCRIPT_UPDATES_PATH,
        ANALYTICS_SOURCE_PATH,
        ANALYTICS_INDEX_PATH,
        IDENTITY_SOURCE_PATH,
        IDENTITY_INDEX_PATH,
        SERVICE_SOURCE_PATH,
        SERVICE_TEST_PATH,
        MIGRATION_PATH,
        RELEASE_CONTROLS_SOURCE_PATH,
        RELEASE_CONTROLS_TEST_PATH,
    ]:
        if not path.exists():
            fail(f"Missing required artifact: {path}")

    expected_summary = {
        "scenario_count": 6,
        "release_freeze_count": 6,
        "channel_freeze_count": 6,
        "assurance_slice_count": 12,
        "verdict_count": 6,
        "validator_row_count": 12,
        "live_count": 1,
        "diagnostic_only_count": 1,
        "recovery_only_count": 2,
        "blocked_count": 2,
    }
    for key, expected in expected_summary.items():
        actual = manifest["summary"][key]
        if actual != expected:
            fail(f"Manifest summary {key} drifted: expected {expected}, found {actual}.")

    if len(manifest["scenarios"]) != manifest["summary"]["scenario_count"]:
        fail("Manifest scenario_count drifted from scenarios array length.")
    if len(matrix) != manifest["summary"]["assurance_slice_count"]:
        fail("assurance_slice_trust_matrix.csv row count drifted from assurance_slice_count.")
    if casebook["summary"]["case_count"] != 6:
        fail("Casebook case_count drifted from the frozen par_075 baseline.")
    if casebook["summary"]["trust_slice_count"] != 12:
        fail("Casebook trust_slice_count drifted from the frozen par_075 baseline.")
    if casebook["summary"]["validator_row_count"] != 12:
        fail("Casebook validator_row_count drifted from the frozen par_075 baseline.")

    design_doc = DESIGN_DOC_PATH.read_text(encoding="utf-8")
    for token in [
        "## Core law",
        "`ReleaseApprovalFreeze` is the immutable approved release tuple",
        "## Persistence and shared contract surface",
    ]:
        if token not in design_doc:
            fail(f"Design doc is missing required marker: {token}")

    rules_doc = RULES_DOC_PATH.read_text(encoding="utf-8")
    for token in [
        "## Verdict rules",
        "## Fail-closed rules",
        "## Simulator contract",
    ]:
        if token not in rules_doc:
            fail(f"Rules doc is missing required marker: {token}")

    command_center = COMMAND_CENTER_PATH.read_text(encoding="utf-8")
    for token in [
        'data-testid="verdict-filter"',
        'data-testid="trust-filter"',
        'data-testid="surface-filter"',
        'data-testid="channel-filter"',
        'data-testid="verdict-rail"',
        'data-testid="tuple-stack"',
        'data-testid="trust-matrix"',
        'data-testid="inspector"',
        'data-testid="validator-table"',
        'data-testid="watchlist-linkage-table"',
    ]:
        if token not in command_center:
            fail(f"Command center is missing required marker: {token}")

    spec_source = SPEC_PATH.read_text(encoding="utf-8")
    for token in [
        "verdict and trust filtering",
        "selection synchronization",
        "chart and table parity",
        "keyboard navigation",
        "reduced motion",
        "responsive layout",
        "accessibility smoke checks",
    ]:
        if token not in spec_source:
            fail(f"Playwright spec is missing expected coverage text: {token}")

    root_script_updates = ROOT_SCRIPT_UPDATES_PATH.read_text(encoding="utf-8")
    for token in [
        "build_release_trust_models.py",
        "validate:release-trust",
        "validate_release_trust_models.py",
    ]:
        if token not in root_script_updates:
            fail(f"root_script_updates.py is missing required token: {token}")

    analytics_source = ANALYTICS_SOURCE_PATH.read_text(encoding="utf-8")
    for token in [
        "evaluateAssuranceSliceTrust",
        "validateAssuranceSliceTrustThresholds",
        "createAssuranceSliceTrustAuthorityService",
        "defaultAssuranceTrustEvaluationModelRef",
    ]:
        if token not in analytics_source:
            fail(f"Analytics assurance source is missing required token: {token}")

    if 'export * from "./assurance-slice-trust-backbone";' not in ANALYTICS_INDEX_PATH.read_text(
        encoding="utf-8"
    ):
        fail("Analytics assurance package index is missing the par_075 export.")

    identity_source = IDENTITY_SOURCE_PATH.read_text(encoding="utf-8")
    for token in [
        "validateReleaseApprovalFreezeDrift",
        "evaluateReleaseTrustFreezeVerdict",
        "assertReleaseTrustFreezeVerdictPrecedence",
        "releaseTrustFreezeParallelInterfaceGaps",
    ]:
        if token not in identity_source:
            fail(f"Identity access source is missing required token: {token}")

    if 'export * from "./release-trust-freeze-backbone";' not in IDENTITY_INDEX_PATH.read_text(
        encoding="utf-8"
    ):
        fail("Identity access package index is missing the par_075 export.")

    service_source = SERVICE_SOURCE_PATH.read_text(encoding="utf-8")
    for token in [
        "createReleaseTrustFreezeApplication",
        "createReleaseTrustFreezeSimulationHarness",
        "releaseTrustFreezePersistenceTables",
        "releaseTrustFreezeMigrationPlanRefs",
        "live_exact_parity_trusted_slices",
        "blocked_standards_watchlist_drift",
    ]:
        if token not in service_source:
            fail(f"Command API seam is missing required token: {token}")

    migration_source = MIGRATION_PATH.read_text(encoding="utf-8").lower()
    for token in [
        "create table if not exists governance_review_packages",
        "create table if not exists standards_dependency_watchlists",
        "create table if not exists release_approval_freezes",
        "create table if not exists channel_release_freeze_records",
        "create table if not exists assurance_slice_trust_records",
        "create table if not exists release_trust_freeze_verdicts",
    ]:
        if token not in migration_source:
            fail(f"Migration is missing required token: {token}")

    release_controls_source = RELEASE_CONTROLS_SOURCE_PATH.read_text(encoding="utf-8")
    for token in [
        "ReleaseTrustFreezeVerdictContract",
        "isLiveReleaseTrustVerdict",
        "releaseTrustAllowsCalmTruth",
        "releaseTrustAllowsMutation",
    ]:
        if token not in release_controls_source:
            fail(f"Release controls source is missing required token: {token}")

    release_controls_test = RELEASE_CONTROLS_TEST_PATH.read_text(encoding="utf-8")
    if "isLiveReleaseTrustVerdict" not in release_controls_test:
        fail("Release controls public-api test is missing the par_075 helper coverage.")
    for token in [
        "isLiveReleaseTrustVerdict,",
        "releaseTrustAllowsCalmTruth,",
        "releaseTrustAllowsMutation,",
    ]:
        if token not in release_controls_test:
            fail(f"Release controls public-api test import drifted: {token}")

    if (
        service_package.get("dependencies", {}).get("@vecells/domain-analytics-assurance")
        != "workspace:*"
    ):
        fail("services/command-api/package.json is missing @vecells/domain-analytics-assurance.")

    scripts = root_package["scripts"]
    if "build_release_trust_models.py" not in scripts["codegen"]:
        fail("Root codegen script is missing build_release_trust_models.py.")
    if "pnpm validate:release-trust" not in scripts["bootstrap"]:
        fail("Root bootstrap script is missing validate:release-trust.")
    if "pnpm validate:release-trust" not in scripts["check"]:
        fail("Root check script is missing validate:release-trust.")
    if scripts["validate:release-trust"] != "python3 ./tools/analysis/validate_release_trust_models.py":
        fail("Root validate:release-trust script drifted.")

    playwright_scripts = playwright_package["scripts"]
    for key in ["build", "lint", "test", "typecheck", "e2e"]:
        if "release-trust-freeze-command-center.spec.js" not in playwright_scripts[key]:
            fail(
                f"Playwright package script {key} is missing release-trust-freeze-command-center.spec.js."
            )


if __name__ == "__main__":
    main()
