#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"
TESTS_DIR = ROOT / "tests" / "playwright"

MANIFEST_PATH = DATA_DIR / "request_lifecycle_lease_manifest.json"
MATRIX_PATH = DATA_DIR / "lineage_fence_and_command_action_matrix.csv"
CASEBOOK_PATH = DATA_DIR / "stale_ownership_casebook.json"
DESIGN_DOC_PATH = DOCS_DIR / "71_lease_fence_and_command_action_design.md"
RULES_DOC_PATH = DOCS_DIR / "71_stale_owner_and_lineage_epoch_rules.md"
LAB_PATH = DOCS_DIR / "71_control_plane_lab.html"
SPEC_PATH = TESTS_DIR / "control-plane-lab.spec.js"
ROOT_SCRIPT_UPDATES_PATH = ROOT / "tools" / "analysis" / "root_script_updates.py"
PLAYWRIGHT_BUILDER_PATH = ROOT / "tools" / "analysis" / "build_parallel_foundation_tracks_gate.py"
DOMAIN_BUILDER_PATH = ROOT / "tools" / "analysis" / "build_domain_package_scaffold.py"
DOMAIN_SOURCE_PATH = ROOT / "packages" / "domains" / "identity_access" / "src" / "lease-fence-command-backbone.ts"
SERVICE_SOURCE_PATH = ROOT / "services" / "command-api" / "src" / "lease-fence-command.ts"
MIGRATION_PATH = ROOT / "services" / "command-api" / "migrations" / "071_request_lifecycle_lease_and_command_action_records.sql"
DOMAIN_TEST_PATH = ROOT / "packages" / "domains" / "identity_access" / "tests" / "lease-fence-command-backbone.test.ts"
SERVICE_TEST_PATH = ROOT / "services" / "command-api" / "tests" / "lease-fence-command.integration.test.js"
PACKAGE_JSON_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = TESTS_DIR / "package.json"


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


def main() -> None:
    manifest = load_json(MANIFEST_PATH)
    matrix = load_csv(MATRIX_PATH)
    casebook = load_json(CASEBOOK_PATH)
    package_json = load_json(PACKAGE_JSON_PATH)
    playwright_package = load_json(PLAYWRIGHT_PACKAGE_PATH)

    for required_path in [
        DESIGN_DOC_PATH,
        RULES_DOC_PATH,
        LAB_PATH,
        SPEC_PATH,
        ROOT_SCRIPT_UPDATES_PATH,
        PLAYWRIGHT_BUILDER_PATH,
        DOMAIN_BUILDER_PATH,
        DOMAIN_SOURCE_PATH,
        SERVICE_SOURCE_PATH,
        MIGRATION_PATH,
        DOMAIN_TEST_PATH,
        SERVICE_TEST_PATH,
    ]:
        if not required_path.exists():
            fail(f"Missing required artifact: {required_path}")

    if manifest["task_id"] != "par_071":
        fail("Manifest task_id drifted from par_071.")

    expected_summary = {
        "lease_count": 7,
        "active_lease_count": 5,
        "broken_lease_count": 2,
        "recovery_count": 4,
        "open_recovery_count": 2,
        "takeover_count": 2,
        "lineage_fence_count": 11,
        "command_action_count": 2,
        "case_count": 5,
        "validator_count": 6,
    }
    for key, expected in expected_summary.items():
        if manifest["summary"][key] != expected:
            fail(f"Manifest summary {key} drifted: expected {expected}, found {manifest['summary'][key]}.")

    if len(manifest["leases"]) != manifest["summary"]["lease_count"]:
        fail("lease_count drifted from leases array length.")
    if len(manifest["recoveries"]) != manifest["summary"]["recovery_count"]:
        fail("recovery_count drifted from recoveries array length.")
    if len(manifest["takeovers"]) != manifest["summary"]["takeover_count"]:
        fail("takeover_count drifted from takeovers array length.")
    if len(manifest["lineage_fences"]) != manifest["summary"]["lineage_fence_count"]:
        fail("lineage_fence_count drifted from lineage_fences array length.")
    if len(manifest["command_actions"]) != manifest["summary"]["command_action_count"]:
        fail("command_action_count drifted from command_actions array length.")
    if len(manifest["validator_results"]) != manifest["summary"]["validator_count"]:
        fail("validator_count drifted from validator_results array length.")

    if len(matrix) != manifest["summary"]["lineage_fence_count"] + manifest["summary"]["command_action_count"]:
        fail("lineage_fence_and_command_action_matrix row count drifted from frozen baseline.")

    if casebook["summary"]["case_count"] != len(casebook["cases"]):
        fail("Casebook case_count drifted from cases array.")
    if casebook["summary"]["stale_token_case_count"] != 1:
        fail("stale_token_case_count drifted from the frozen par_071 baseline.")
    if casebook["summary"]["stale_epoch_case_count"] != 1:
        fail("stale_epoch_case_count drifted from the frozen par_071 baseline.")
    if casebook["summary"]["takeover_case_count"] != 1:
        fail("takeover_case_count drifted from the frozen par_071 baseline.")

    design_doc = DESIGN_DOC_PATH.read_text(encoding="utf-8")
    for marker in [
        "## Core law",
        "`RequestLifecycleLease` is a compare-and-set authority",
        "`CommandActionRecord` is the immutable mutation tuple.",
    ]:
        if marker not in design_doc:
            fail(f"Design doc is missing required marker: {marker}")

    rules_doc = RULES_DOC_PATH.read_text(encoding="utf-8")
    for marker in [
        "## Recovery law",
        "`LineageFence` must advance monotonically",
        "## Simulator contract",
    ]:
        if marker not in rules_doc:
            fail(f"Rules doc is missing required marker: {marker}")

    lab_html = LAB_PATH.read_text(encoding="utf-8")
    for marker in [
        'data-testid="timeline"',
        'data-testid="epoch-strip"',
        'data-testid="inspector"',
        'data-testid="case-table"',
        'data-testid="validator-table"',
        'data-testid="domain-filter"',
        'data-testid="lease-state-filter"',
        'data-testid="fence-issue-filter"',
    ]:
        if marker not in lab_html:
            fail(f"Lab HTML is missing required marker: {marker}")

    spec_source = SPEC_PATH.read_text(encoding="utf-8")
    for probe in [
        "domain filtering",
        "lease-state filtering",
        "fence issue filtering",
        "selection synchronization",
        "diagram and table parity",
        "keyboard navigation",
        "reduced motion",
        "responsive layout",
    ]:
        if probe not in spec_source:
            fail(f"Spec is missing expected coverage text: {probe}")

    root_script_updates = ROOT_SCRIPT_UPDATES_PATH.read_text(encoding="utf-8")
    for token in [
        "build_lease_fence_action_models.py",
        "validate:lease-fence-actions",
        "validate_lease_fence_action_models.py",
    ]:
        if token not in root_script_updates:
            fail(f"root_script_updates.py is missing required token: {token}")

    playwright_builder = PLAYWRIGHT_BUILDER_PATH.read_text(encoding="utf-8")
    if "control-plane-lab.spec.js" not in playwright_builder:
        fail("build_parallel_foundation_tracks_gate.py does not preserve the par_071 Playwright spec.")

    domain_builder = DOMAIN_BUILDER_PATH.read_text(encoding="utf-8")
    if 'export * from "./lease-fence-command-backbone";' not in domain_builder:
        fail("build_domain_package_scaffold.py does not preserve the lease-fence backbone export.")

    domain_source = DOMAIN_SOURCE_PATH.read_text(encoding="utf-8")
    for token in [
        "RequestLifecycleLeaseDocument",
        "StaleOwnershipRecoveryRecordDocument",
        "LeaseTakeoverRecordDocument",
        "LineageFenceDocument",
        "CommandActionRecordDocument",
        "createLeaseFenceCommandAuthorityService",
        "LeaseFenceCommandSimulationHarness",
        "validateLeaseLedgerState",
        "buildRouteIntentTupleHash",
    ]:
        if token not in domain_source:
            fail(f"Lease-fence backbone source is missing required token: {token}")

    service_source = SERVICE_SOURCE_PATH.read_text(encoding="utf-8")
    for token in [
        "createLeaseFenceCommandAuthorityService",
        "createLeaseFenceCommandSimulationHarness",
        "createLeaseFenceCommandStore",
        "leaseFenceCommandPersistenceTables",
        "071_request_lifecycle_lease_and_command_action_records.sql",
        "lease_authority_states",
    ]:
        if token not in service_source:
            fail(f"Command API seam is missing required token: {token}")

    migration_source = MIGRATION_PATH.read_text(encoding="utf-8").lower()
    for token in [
        "create table if not exists request_lifecycle_leases",
        "create table if not exists stale_ownership_recovery_records",
        "create table if not exists lease_takeover_records",
        "create table if not exists lineage_fences",
        "create table if not exists command_action_records",
        "create table if not exists lease_authority_states",
    ]:
        if token not in migration_source:
            fail(f"Migration is missing required token: {token}")

    domain_test_source = DOMAIN_TEST_PATH.read_text(encoding="utf-8")
    for token in [
        "opens stale-owner recovery when lineage fence issuance presents a stale epoch",
        "reuses exact command tuples and supersedes changed retries",
        "rejects stale fencing tokens after takeover",
    ]:
        if token not in domain_test_source:
            fail(f"Domain test is missing required coverage text: {token}")

    service_test_source = SERVICE_TEST_PATH.read_text(encoding="utf-8")
    for token in [
        "composes the canonical lease, fence, takeover, and action-record authority",
        "services/command-api/migrations/071_request_lifecycle_lease_and_command_action_records.sql",
        "worker_restart_with_stale_fencing_token",
        "repeated_ui_actions_reuse_or_supersede",
    ]:
        if token not in service_test_source:
            fail(f"Service test is missing required coverage text: {token}")

    scripts = package_json["scripts"]
    if "build_lease_fence_action_models.py" not in scripts["codegen"]:
        fail("Root codegen script is missing build_lease_fence_action_models.py.")
    if "pnpm validate:lease-fence-actions" not in scripts["bootstrap"]:
        fail("Root bootstrap script is missing validate:lease-fence-actions.")
    if "pnpm validate:lease-fence-actions" not in scripts["check"]:
        fail("Root check script is missing validate:lease-fence-actions.")
    if scripts["validate:lease-fence-actions"] != "python3 ./tools/analysis/validate_lease_fence_action_models.py":
        fail("Root validate:lease-fence-actions script drifted.")

    playwright_scripts = playwright_package["scripts"]
    for key in ["build", "lint", "test", "typecheck", "e2e"]:
        if "control-plane-lab.spec.js" not in playwright_scripts[key]:
            fail(f"Playwright package script {key} is missing control-plane-lab.spec.js.")


if __name__ == "__main__":
    main()
