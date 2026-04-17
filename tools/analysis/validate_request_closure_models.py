#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"
PLAYWRIGHT_DIR = ROOT / "tests" / "playwright"
DOMAIN_DIR = ROOT / "packages" / "domains" / "identity_access"
SERVICE_DIR = ROOT / "services" / "command-api"

MANIFEST_PATH = DATA_DIR / "request_closure_record_manifest.json"
MATRIX_PATH = DATA_DIR / "fallback_review_case_matrix.csv"
CASEBOOK_PATH = DATA_DIR / "closure_blocker_casebook.json"
DESIGN_DOC_PATH = DOCS_DIR / "76_request_closure_and_exception_case_design.md"
RULES_DOC_PATH = DOCS_DIR / "76_closure_blocker_taxonomy_and_rules.md"
ATLAS_PATH = DOCS_DIR / "76_closure_governance_atlas.html"
SPEC_PATH = PLAYWRIGHT_DIR / "closure-governance-atlas.spec.js"
DOMAIN_SOURCE_PATH = DOMAIN_DIR / "src" / "request-closure-backbone.ts"
DOMAIN_INDEX_PATH = DOMAIN_DIR / "src" / "index.ts"
DOMAIN_TEST_PATH = DOMAIN_DIR / "tests" / "request-closure-backbone.test.ts"
SERVICE_SOURCE_PATH = SERVICE_DIR / "src" / "request-closure.ts"
SERVICE_TEST_PATH = SERVICE_DIR / "tests" / "request-closure.integration.test.js"
MIGRATION_PATH = (
    SERVICE_DIR / "migrations" / "076_request_closure_record_and_exception_case_models.sql"
)
ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = PLAYWRIGHT_DIR / "package.json"
ROOT_SCRIPT_UPDATES_PATH = ROOT / "tools" / "analysis" / "root_script_updates.py"


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


def require_tokens(path: Path, tokens: list[str]) -> None:
    text = path.read_text(encoding="utf-8")
    for token in tokens:
        if token not in text:
            fail(f"{path} is missing required token: {token}")


def main() -> None:
    manifest = read_json(MANIFEST_PATH)
    matrix = read_csv(MATRIX_PATH)
    casebook = read_json(CASEBOOK_PATH)
    root_package = read_json(ROOT_PACKAGE_PATH)
    playwright_package = read_json(PLAYWRIGHT_PACKAGE_PATH)

    for path in [
        DESIGN_DOC_PATH,
        RULES_DOC_PATH,
        ATLAS_PATH,
        SPEC_PATH,
        DOMAIN_SOURCE_PATH,
        DOMAIN_INDEX_PATH,
        DOMAIN_TEST_PATH,
        SERVICE_SOURCE_PATH,
        SERVICE_TEST_PATH,
        MIGRATION_PATH,
        ROOT_SCRIPT_UPDATES_PATH,
    ]:
        if not path.exists():
            fail(f"Missing required artifact: {path}")

    summary = manifest["summary"]
    expected_summary = {
        "scenario_count": 7,
        "close_count": 1,
        "defer_count": 6,
        "fallback_case_count": 1,
        "stale_materialized_count": 1,
        "decision_ladder_row_count": 7,
        "exception_case_count": 1,
    }
    for key, expected in expected_summary.items():
        actual = summary[key]
        if actual != expected:
            fail(f"Manifest summary {key} drifted: expected {expected}, found {actual}.")

    if len(manifest["scenarios"]) != summary["scenario_count"]:
        fail("request_closure_record_manifest.json scenario_count drifted from scenarios length.")
    if len(matrix) != summary["fallback_case_count"]:
        fail("fallback_review_case_matrix.csv row count drifted from fallback_case_count.")
    if casebook["summary"]["case_count"] != summary["scenario_count"]:
        fail("closure_blocker_casebook.json case_count drifted from manifest scenario_count.")

    require_tokens(
        DESIGN_DOC_PATH,
        [
            "## Core Law",
            "`RequestClosureRecord` is the authoritative close-or-defer artifact",
            "## Event Boundary",
        ],
    )
    require_tokens(
        RULES_DOC_PATH,
        [
            "## Blocker Taxonomy",
            "## Request Closure Rules",
            "## Fallback Review Rules",
        ],
    )
    require_tokens(
        ATLAS_PATH,
        [
            'data-testid="decision-filter"',
            'data-testid="blocker-filter"',
            'data-testid="trigger-filter"',
            'data-testid="lineage-filter"',
            'data-testid="decision-ladder"',
            'data-testid="blocker-matrix"',
            'data-testid="fallback-ribbon"',
            'data-testid="closure-table"',
            'data-testid="exception-table"',
            'data-testid="inspector"',
        ],
    )
    require_tokens(
        SPEC_PATH,
        [
            "filter behavior across decision and blocker classes",
            "selection synchronization between table, inspector, and diagrams",
            "keyboard navigation",
            "reduced-motion handling",
            "responsive layout at desktop and tablet widths",
            "accessibility smoke checks and landmark verification",
        ],
    )
    require_tokens(
        DOMAIN_SOURCE_PATH,
        [
            "evaluateRequestClosure",
            "FallbackReviewCaseDocument",
            "requestClosureCanonicalEventEntries",
            "requestClosureParallelInterfaceGaps",
            "createRequestClosureSimulationHarness",
        ],
    )
    require_tokens(
        DOMAIN_INDEX_PATH,
        ['export * from "./request-closure-backbone";'],
    )
    require_tokens(
        SERVICE_SOURCE_PATH,
        [
            "createRequestClosureApplication",
            "requestClosurePersistenceTables",
            "requestClosureMigrationPlanRefs",
        ],
    )
    require_tokens(
        MIGRATION_PATH,
        [
            "CREATE TABLE IF NOT EXISTS request_closure_records",
            "CREATE TABLE IF NOT EXISTS fallback_review_cases",
        ],
    )
    require_tokens(
        ROOT_SCRIPT_UPDATES_PATH,
        [
            "validate:request-closure",
            "validate_request_closure_models.py",
        ],
    )

    scripts = root_package["scripts"]
    if scripts["validate:request-closure"] != "python3 ./tools/analysis/validate_request_closure_models.py":
        fail("Root validate:request-closure script drifted.")
    if "pnpm validate:request-closure" not in scripts["bootstrap"]:
        fail("Root bootstrap script is missing validate:request-closure.")
    if "pnpm validate:request-closure" not in scripts["check"]:
        fail("Root check script is missing validate:request-closure.")

    playwright_scripts = playwright_package["scripts"]
    for key in ["build", "lint", "test", "typecheck", "e2e"]:
        if "closure-governance-atlas.spec.js" not in playwright_scripts[key]:
            fail(f"Playwright package script {key} is missing closure-governance-atlas.spec.js.")


if __name__ == "__main__":
    main()
