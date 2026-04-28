#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"
TESTS_DIR = ROOT / "tests" / "playwright"

MANIFEST_PATH = DATA_DIR / "queue_rank_plan_manifest.json"
FACTOR_MATRIX_PATH = DATA_DIR / "queue_rank_entry_factor_matrix.csv"
CASEBOOK_PATH = DATA_DIR / "assignment_suggestion_casebook.json"
DESIGN_DOC_PATH = DOCS_DIR / "73_queue_rank_model_design.md"
RULES_DOC_PATH = DOCS_DIR / "73_deterministic_queue_ranking_rules.md"
STUDIO_PATH = DOCS_DIR / "73_queue_rank_explanation_studio.html"
SPEC_PATH = TESTS_DIR / "queue-rank-explanation-studio.spec.js"

ROOT_SCRIPT_UPDATES_PATH = ROOT / "tools" / "analysis" / "root_script_updates.py"
ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = TESTS_DIR / "package.json"
API_CONTRACT_SOURCE_PATH = ROOT / "packages" / "api-contracts" / "src" / "queue-ranking.ts"
API_CONTRACT_INDEX_PATH = ROOT / "packages" / "api-contracts" / "src" / "index.ts"
API_CONTRACT_TEST_PATH = ROOT / "packages" / "api-contracts" / "tests" / "queue-ranking.test.ts"
API_CONTRACT_PUBLIC_API_TEST_PATH = (
    ROOT / "packages" / "api-contracts" / "tests" / "public-api.test.ts"
)
API_CONTRACT_PACKAGE_JSON_PATH = ROOT / "packages" / "api-contracts" / "package.json"
QUEUE_PLAN_SCHEMA_PATH = ROOT / "packages" / "api-contracts" / "schemas" / "queue-rank-plan.schema.json"
QUEUE_SNAPSHOT_SCHEMA_PATH = ROOT / "packages" / "api-contracts" / "schemas" / "queue-rank-snapshot.schema.json"
QUEUE_ENTRY_SCHEMA_PATH = ROOT / "packages" / "api-contracts" / "schemas" / "queue-rank-entry.schema.json"
QUEUE_SUGGESTION_SCHEMA_PATH = (
    ROOT / "packages" / "api-contracts" / "schemas" / "queue-assignment-suggestion-snapshot.schema.json"
)
COMMAND_API_SOURCE_PATH = ROOT / "services" / "command-api" / "src" / "queue-ranking.ts"
COMMAND_API_TEST_PATH = ROOT / "services" / "command-api" / "tests" / "queue-ranking.integration.test.js"
MIGRATION_PATH = ROOT / "services" / "command-api" / "migrations" / "073_queue_rank_models.sql"


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
    factor_rows = load_csv(FACTOR_MATRIX_PATH)
    casebook = load_json(CASEBOOK_PATH)
    root_package = load_json(ROOT_PACKAGE_PATH)
    playwright_package = load_json(PLAYWRIGHT_PACKAGE_PATH)
    api_contract_package = load_json(API_CONTRACT_PACKAGE_JSON_PATH)

    for path in [
        DESIGN_DOC_PATH,
        RULES_DOC_PATH,
        STUDIO_PATH,
        SPEC_PATH,
        ROOT_SCRIPT_UPDATES_PATH,
        API_CONTRACT_SOURCE_PATH,
        API_CONTRACT_INDEX_PATH,
        API_CONTRACT_TEST_PATH,
        API_CONTRACT_PUBLIC_API_TEST_PATH,
        QUEUE_PLAN_SCHEMA_PATH,
        QUEUE_SNAPSHOT_SCHEMA_PATH,
        QUEUE_ENTRY_SCHEMA_PATH,
        QUEUE_SUGGESTION_SCHEMA_PATH,
        COMMAND_API_SOURCE_PATH,
        COMMAND_API_TEST_PATH,
        MIGRATION_PATH,
    ]:
        if not path.exists():
            fail(f"Missing required artifact: {path}")

    if manifest["task_id"] != "par_073":
        fail("Manifest task_id drifted from par_073.")

    expected_summary = {
        "scenario_count": 6,
        "factor_row_count": 18,
        "suggestion_case_count": 2,
        "suggestion_row_count": 6,
        "governed_auto_claim_count": 3,
        "schema_count": 4,
        "validator_count": 6,
    }
    for key, expected in expected_summary.items():
        if manifest["summary"][key] != expected:
            fail(f"Manifest summary {key} drifted: expected {expected}, found {manifest['summary'][key]}.")

    if len(factor_rows) != manifest["summary"]["factor_row_count"]:
        fail("Factor matrix row count drifted from manifest summary.")
    if casebook["summary"]["case_count"] != len(casebook["cases"]):
        fail("Suggestion casebook summary drifted from cases array.")

    design_doc = DESIGN_DOC_PATH.read_text(encoding="utf-8")
    for marker in [
        "## Core law",
        "`QueueRankPlan` is the only versioned source of canonical queue ordering.",
        "`QueueAssignmentSuggestionSnapshot` is derived",
    ]:
        if marker not in design_doc:
            fail(f"Design doc is missing required marker: {marker}")

    rules_doc = RULES_DOC_PATH.read_text(encoding="utf-8")
    for marker in [
        "## Ranking law",
        "## Suggestion isolation",
        "## Mixed-snapshot prohibition",
    ]:
        if marker not in rules_doc:
            fail(f"Rules doc is missing required marker: {marker}")

    studio_html = STUDIO_PATH.read_text(encoding="utf-8")
    for marker in [
        'data-testid="queue-family-filter"',
        'data-testid="overload-filter"',
        'data-testid="tier-filter"',
        'data-testid="ladder"',
        'data-testid="fairness-ribbon"',
        'data-testid="inspector"',
        'data-testid="factor-table"',
        'data-testid="suggestion-table"',
    ]:
        if marker not in studio_html:
            fail(f"Studio HTML is missing required marker: {marker}")

    spec_source = SPEC_PATH.read_text(encoding="utf-8")
    for probe in [
        "queue-family and tier filtering",
        "row and card selection synchronization",
        "diagram and table parity",
        "keyboard navigation",
        "reduced motion",
        "responsive layout",
    ]:
        if probe not in spec_source:
            fail(f"Spec is missing expected coverage text: {probe}")

    root_script_updates = ROOT_SCRIPT_UPDATES_PATH.read_text(encoding="utf-8")
    for token in [
        "build_queue_rank_models.py",
        "validate:queue-rank-models",
        "validate_queue_rank_models.py",
    ]:
        if token not in root_script_updates:
            fail(f"root_script_updates.py is missing required token: {token}")

    api_contract_source = API_CONTRACT_SOURCE_PATH.read_text(encoding="utf-8")
    for token in [
        "queueRankingContractCatalog",
        "QueueRankingAuthorityService",
        "validateQueueAssignmentSuggestionIsolation",
        "validateQueueConsumerSnapshotRefs",
        "queueDefaultPlan",
    ]:
        if token not in api_contract_source:
            fail(f"Queue-ranking runtime source is missing required token: {token}")

    if 'export * from "./queue-ranking";' not in API_CONTRACT_INDEX_PATH.read_text(
        encoding="utf-8"
    ):
        fail("API-contract index is missing the queue-ranking export.")

    if "publishes the par_073 queue-ranking schema surface" not in API_CONTRACT_PUBLIC_API_TEST_PATH.read_text(
        encoding="utf-8"
    ):
        fail("API-contract public-api test is missing the par_073 assertion.")

    api_contract_exports = api_contract_package["exports"]
    for key in [
        "./schemas/queue-rank-plan.schema.json",
        "./schemas/queue-rank-snapshot.schema.json",
        "./schemas/queue-rank-entry.schema.json",
        "./schemas/queue-assignment-suggestion-snapshot.schema.json",
    ]:
        if key not in api_contract_exports:
            fail(f"API-contract package.json is missing export: {key}")

    command_api_source = COMMAND_API_SOURCE_PATH.read_text(encoding="utf-8")
    for token in [
        "createQueueRankingApplication",
        "queueRankingPersistenceTables",
        "queueRankingMigrationPlanRefs",
        "runAllScenarios",
    ]:
        if token not in command_api_source:
            fail(f"Command API queue-ranking seam is missing required token: {token}")

    migration_source = MIGRATION_PATH.read_text(encoding="utf-8").lower()
    if "create table if not exists queue_rank_entries" not in migration_source:
        fail("Migration is missing queue_rank_entries table.")

    root_scripts = root_package["scripts"]
    if "build_queue_rank_models.py" not in root_scripts["codegen"]:
        fail("Root codegen script is missing the par_073 builder.")
    if "pnpm validate:queue-rank-models" not in root_scripts["bootstrap"]:
        fail("Root bootstrap script is missing validate:queue-rank-models.")
    if "pnpm validate:queue-rank-models" not in root_scripts["check"]:
        fail("Root check script is missing validate:queue-rank-models.")
    if root_scripts["validate:queue-rank-models"] != "python3 ./tools/analysis/validate_queue_rank_models.py":
        fail("Root validate:queue-rank-models script drifted.")

    playwright_scripts = playwright_package["scripts"]
    for key in ["build", "lint", "test", "typecheck", "e2e"]:
        if "queue-rank-explanation-studio.spec.js" not in playwright_scripts[key]:
            fail(f"Playwright package script {key} is missing queue-rank-explanation-studio.spec.js.")

    print("par_073 queue-ranking validation passed")


if __name__ == "__main__":
    main()
