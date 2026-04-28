#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"
TESTS_DIR = ROOT / "tests" / "playwright"

MANIFEST_PATH = DATA_DIR / "command_settlement_manifest.json"
MATRIX_PATH = DATA_DIR / "settlement_to_transition_matrix.csv"
CASEBOOK_PATH = DATA_DIR / "settlement_supersession_casebook.json"
DESIGN_DOC_PATH = DOCS_DIR / "72_command_settlement_and_transition_envelope_design.md"
RULES_DOC_PATH = DOCS_DIR / "72_settlement_dimension_mapping_rules.md"
ATLAS_PATH = DOCS_DIR / "72_settlement_envelope_atlas.html"
SPEC_PATH = TESTS_DIR / "settlement-envelope-atlas.spec.js"
ROOT_SCRIPT_UPDATES_PATH = ROOT / "tools" / "analysis" / "root_script_updates.py"
PLAYWRIGHT_BUILDER_PATH = ROOT / "tools" / "analysis" / "build_parallel_foundation_tracks_gate.py"
DOMAIN_BUILDER_PATH = ROOT / "tools" / "analysis" / "build_domain_package_scaffold.py"
DOMAIN_SOURCE_PATH = ROOT / "packages" / "domains" / "identity_access" / "src" / "command-settlement-backbone.ts"
SERVICE_SOURCE_PATH = ROOT / "services" / "command-api" / "src" / "command-settlement.ts"
MIGRATION_PATH = ROOT / "services" / "command-api" / "migrations" / "072_command_settlement_and_transition_envelope_library.sql"
DOMAIN_TEST_PATH = ROOT / "packages" / "domains" / "identity_access" / "tests" / "command-settlement-backbone.test.ts"
SERVICE_TEST_PATH = ROOT / "services" / "command-api" / "tests" / "command-settlement.integration.test.js"
PACKAGE_TRANSITION_SOURCE_PATH = ROOT / "packages" / "api-contracts" / "src" / "transition-envelope.ts"
PACKAGE_INDEX_PATH = ROOT / "packages" / "api-contracts" / "src" / "index.ts"
PACKAGE_PUBLIC_API_TEST_PATH = ROOT / "packages" / "api-contracts" / "tests" / "public-api.test.ts"
PACKAGE_JSON_PATH = ROOT / "packages" / "api-contracts" / "package.json"
COMMAND_SETTLEMENT_SCHEMA_PATH = ROOT / "packages" / "api-contracts" / "schemas" / "command-settlement-record.schema.json"
TRANSITION_ENVELOPE_SCHEMA_PATH = ROOT / "packages" / "api-contracts" / "schemas" / "transition-envelope.schema.json"
PACKAGE_JSON_ROOT = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = ROOT / "tests" / "playwright" / "package.json"


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
    root_package_json = load_json(PACKAGE_JSON_ROOT)
    playwright_package = load_json(PLAYWRIGHT_PACKAGE_PATH)

    for required_path in [
        DESIGN_DOC_PATH,
        RULES_DOC_PATH,
        ATLAS_PATH,
        SPEC_PATH,
        ROOT_SCRIPT_UPDATES_PATH,
        PLAYWRIGHT_BUILDER_PATH,
        DOMAIN_BUILDER_PATH,
        DOMAIN_SOURCE_PATH,
        SERVICE_SOURCE_PATH,
        MIGRATION_PATH,
        DOMAIN_TEST_PATH,
        SERVICE_TEST_PATH,
        PACKAGE_TRANSITION_SOURCE_PATH,
        PACKAGE_INDEX_PATH,
        PACKAGE_PUBLIC_API_TEST_PATH,
        COMMAND_SETTLEMENT_SCHEMA_PATH,
        TRANSITION_ENVELOPE_SCHEMA_PATH,
    ]:
        if not required_path.exists():
            fail(f"Missing required artifact: {required_path}")

    if manifest["task_id"] != "par_072":
        fail("Manifest task_id drifted from par_072.")

    expected_summary = {
        "scenario_count": 7,
        "settlement_revision_count": 10,
        "transition_envelope_count": 10,
        "settled_count": 2,
        "pending_count": 4,
        "review_required_count": 1,
        "recovery_required_count": 3,
        "validator_count": 6,
    }
    for key, expected in expected_summary.items():
        if manifest["summary"][key] != expected:
            fail(f"Manifest summary {key} drifted: expected {expected}, found {manifest['summary'][key]}.")

    if len(matrix) != manifest["summary"]["settlement_revision_count"]:
        fail("settlement_to_transition_matrix row count drifted from the frozen baseline.")
    if casebook["summary"]["case_count"] != len(casebook["cases"]):
        fail("Casebook case_count drifted from cases array.")

    design_doc = DESIGN_DOC_PATH.read_text(encoding="utf-8")
    for marker in [
        "## Core law",
        "`CommandSettlementRecord` is the authoritative mutation outcome substrate.",
        "`TransitionEnvelope` is the required same-shell bridge",
    ]:
        if marker not in design_doc:
            fail(f"Design doc is missing required marker: {marker}")

    rules_doc = RULES_DOC_PATH.read_text(encoding="utf-8")
    for marker in [
        "## Mapping law",
        "## Recovery law",
        "## Simulator contract",
    ]:
        if marker not in rules_doc:
            fail(f"Rules doc is missing required marker: {marker}")

    atlas_html = ATLAS_PATH.read_text(encoding="utf-8")
    for marker in [
        'data-testid="quadrant"',
        'data-testid="revision-rail"',
        'data-testid="inspector"',
        'data-testid="mapping-table"',
        'data-testid="validator-table"',
        'data-testid="result-filter"',
        'data-testid="outcome-filter"',
        'data-testid="recovery-filter"',
    ]:
        if marker not in atlas_html:
            fail(f"Atlas HTML is missing required marker: {marker}")

    spec_source = SPEC_PATH.read_text(encoding="utf-8")
    for probe in [
        "settlement filtering",
        "card selection synchronization",
        "quadrant and table parity",
        "keyboard navigation",
        "reduced motion",
        "responsive layout",
    ]:
        if probe not in spec_source:
            fail(f"Spec is missing expected coverage text: {probe}")

    root_script_updates = ROOT_SCRIPT_UPDATES_PATH.read_text(encoding="utf-8")
    for token in [
        "build_command_settlement_and_transition_envelope.py",
        "validate:settlement-envelope",
        "validate_settlement_envelope_library.py",
    ]:
        if token not in root_script_updates:
            fail(f"root_script_updates.py is missing required token: {token}")

    playwright_builder = PLAYWRIGHT_BUILDER_PATH.read_text(encoding="utf-8")
    if "settlement-envelope-atlas.spec.js" not in playwright_builder:
        fail("build_parallel_foundation_tracks_gate.py does not preserve the par_072 Playwright spec.")

    domain_builder = DOMAIN_BUILDER_PATH.read_text(encoding="utf-8")
    if 'export * from "./command-settlement-backbone";' not in domain_builder:
        fail("build_domain_package_scaffold.py does not preserve the settlement backbone export.")

    domain_source = DOMAIN_SOURCE_PATH.read_text(encoding="utf-8")
    for token in [
        "CommandSettlementRecordDocument",
        "createCommandSettlementAuthorityService",
        "validateCommandSettlementRevisionChain",
        "validateCommandSettlementCalmReturnLaw",
    ]:
        if token not in domain_source:
            fail(f"Settlement backbone source is missing required token: {token}")

    service_source = SERVICE_SOURCE_PATH.read_text(encoding="utf-8")
    for token in [
        "createCommandSettlementApplication",
        "commandSettlementPersistenceTables",
        "072_command_settlement_and_transition_envelope_library.sql",
        "buildTransitionEnvelope",
        "runAllScenarios",
    ]:
        if token not in service_source:
            fail(f"Command API settlement seam is missing required token: {token}")

    package_transition_source = PACKAGE_TRANSITION_SOURCE_PATH.read_text(encoding="utf-8")
    for token in [
        "buildTransitionEnvelope",
        "validateTransitionEnvelope",
        "CommandSettlementRecordLike",
        "TransitionEnvelope",
    ]:
        if token not in package_transition_source:
            fail(f"Transition-envelope library is missing required token: {token}")

    package_index_source = PACKAGE_INDEX_PATH.read_text(encoding="utf-8")
    if 'export * from "./transition-envelope";' not in package_index_source:
        fail("API-contract index is missing the transition-envelope export.")

    migration_source = MIGRATION_PATH.read_text(encoding="utf-8").lower()
    if "create table if not exists command_settlement_records" not in migration_source:
        fail("Migration is missing command_settlement_records table.")

    if "publishes the par_072 settlement and envelope schema surface" not in PACKAGE_PUBLIC_API_TEST_PATH.read_text(encoding="utf-8"):
        fail("API-contract public-api test is missing the par_072 schema assertion.")

    exports = package_json["exports"]
    if "./schemas/transition-envelope.schema.json" not in exports:
        fail("API-contract package.json is missing the transition-envelope schema export.")

    root_scripts = root_package_json["scripts"]
    if "build_command_settlement_and_transition_envelope.py" not in root_scripts["codegen"]:
        fail("Root codegen script is missing the par_072 builder.")
    if "pnpm validate:settlement-envelope" not in root_scripts["bootstrap"]:
        fail("Root bootstrap script is missing validate:settlement-envelope.")
    if "pnpm validate:settlement-envelope" not in root_scripts["check"]:
        fail("Root check script is missing validate:settlement-envelope.")
    if root_scripts["validate:settlement-envelope"] != "python3 ./tools/analysis/validate_settlement_envelope_library.py":
        fail("Root validate:settlement-envelope script drifted.")

    playwright_scripts = playwright_package["scripts"]
    for key in ["build", "lint", "test", "typecheck", "e2e"]:
        if "settlement-envelope-atlas.spec.js" not in playwright_scripts[key]:
            fail(f"Playwright package script {key} is missing settlement-envelope-atlas.spec.js.")

    print("par_072 settlement and transition-envelope validation passed")


if __name__ == "__main__":
    main()
