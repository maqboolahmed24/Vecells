#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"
PLAYWRIGHT_DIR = ROOT / "tests" / "playwright"
DOMAIN_DIR = ROOT / "packages" / "domains" / "intake_safety"
SERVICE_DIR = ROOT / "services" / "command-api"

CASEBOOK_PATH = DATA_DIR / "evidence_assimilation_casebook.json"
MATRIX_PATH = DATA_DIR / "safety_rule_dependency_matrix.csv"
URGENT_MANIFEST_PATH = DATA_DIR / "urgent_diversion_truth_manifest.json"
DESIGN_DOC_PATH = DOCS_DIR / "79_evidence_assimilation_and_safety_design.md"
RULES_DOC_PATH = DOCS_DIR / "79_incremental_resafety_and_urgent_diversion_rules.md"
OBSERVATORY_PATH = DOCS_DIR / "79_safety_assimilation_observatory.html"
SPEC_PATH = PLAYWRIGHT_DIR / "safety-assimilation-observatory.spec.js"
DOMAIN_SOURCE_PATH = DOMAIN_DIR / "src" / "assimilation-safety-backbone.ts"
DOMAIN_INDEX_PATH = DOMAIN_DIR / "src" / "index.ts"
DOMAIN_TEST_PATH = DOMAIN_DIR / "tests" / "assimilation-safety-backbone.test.ts"
SERVICE_SOURCE_PATH = SERVICE_DIR / "src" / "assimilation-safety.ts"
SERVICE_TEST_PATH = SERVICE_DIR / "tests" / "assimilation-safety.integration.test.js"
MIGRATION_PATH = SERVICE_DIR / "migrations" / "079_evidence_assimilation_and_safety_orchestrator.sql"
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
    casebook = read_json(CASEBOOK_PATH)
    matrix = read_csv(MATRIX_PATH)
    urgent_manifest = read_json(URGENT_MANIFEST_PATH)
    root_package = read_json(ROOT_PACKAGE_PATH)
    playwright_package = read_json(PLAYWRIGHT_PACKAGE_PATH)

    for path in [
        DESIGN_DOC_PATH,
        RULES_DOC_PATH,
        OBSERVATORY_PATH,
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

    summary = casebook["summary"]
    expected_summary = {
        "scenario_count": 8,
        "no_re_safety_count": 1,
        "re_safety_required_count": 5,
        "blocked_manual_review_count": 1,
        "coalesced_pending_preemption_count": 1,
        "urgent_diversion_required_count": 3,
        "urgent_diversion_issued_count": 1,
        "residual_review_count": 2,
        "fallback_manual_review_count": 1,
        "replay_or_coalesced_count": 2,
    }
    for key, expected in expected_summary.items():
        actual = summary[key]
        if actual != expected:
            fail(f"Casebook summary {key} drifted: expected {expected}, found {actual}.")

    if len(casebook["scenarios"]) != summary["scenario_count"]:
        fail("evidence_assimilation_casebook.json scenario_count drifted from scenarios length.")
    if len(matrix) != 14:
        fail("safety_rule_dependency_matrix.csv row count drifted from the authored default rule pack.")
    if urgent_manifest["summary"]["urgent_required_count"] != summary["urgent_diversion_required_count"]:
        fail("urgent_diversion_truth_manifest.json urgent count drifted from the casebook.")

    require_tokens(
        DESIGN_DOC_PATH,
        [
            "## Core Law",
            "`EvidenceAssimilationCoordinator` is the sole gateway",
            "## Event Boundary",
        ],
    )
    require_tokens(
        RULES_DOC_PATH,
        [
            "## Rule Pack",
            "## Incremental Engine",
            "## Urgent Diversion Rules",
        ],
    )
    require_tokens(
        OBSERVATORY_PATH,
        [
            'data-testid="source-filter"',
            'data-testid="trigger-filter"',
            'data-testid="safety-filter"',
            'data-testid="urgent-filter"',
            'data-testid="evidence-ribbon"',
            'data-testid="rule-heat-surface"',
            'data-testid="urgent-ladder"',
            'data-testid="assimilation-table"',
            'data-testid="safety-table"',
            'data-testid="inspector"',
        ],
    )
    require_tokens(
        SPEC_PATH,
        [
            "filtering and synchronization across assimilation and safety views",
            "keyboard navigation and focus management",
            "reduced-motion handling",
            "responsive layout at desktop and tablet widths",
            "accessibility smoke checks and landmark verification",
        ],
    )
    require_tokens(
        DOMAIN_SOURCE_PATH,
        [
          "class CanonicalEvidenceAssimilationCoordinator",
          "class SafetyOrchestrator",
          "class IncrementalSafetyRuleEvaluator",
          "assimilationSafetyCanonicalEventEntries",
          "createAssimilationSafetySimulationHarness",
        ],
    )
    require_tokens(
        DOMAIN_INDEX_PATH,
        ['export * from "./assimilation-safety-backbone";'],
    )
    require_tokens(
        SERVICE_SOURCE_PATH,
        [
            "createAssimilationSafetyApplication",
            "assimilationSafetyPersistenceTables",
            "assimilationSafetyMigrationPlanRefs",
        ],
    )
    require_tokens(
        MIGRATION_PATH,
        [
            "CREATE TABLE IF NOT EXISTS evidence_assimilation_records",
            "CREATE TABLE IF NOT EXISTS material_delta_assessments",
            "CREATE TABLE IF NOT EXISTS evidence_classification_decisions",
            "CREATE TABLE IF NOT EXISTS safety_preemption_records",
            "CREATE TABLE IF NOT EXISTS safety_decision_records",
            "CREATE TABLE IF NOT EXISTS urgent_diversion_settlements",
        ],
    )
    require_tokens(
        ROOT_SCRIPT_UPDATES_PATH,
        [
            "validate:assimilation-safety",
            "validate_assimilation_and_safety.py",
        ],
    )

    scripts = root_package["scripts"]
    if (
        scripts["validate:assimilation-safety"]
        != "python3 ./tools/analysis/validate_assimilation_and_safety.py"
    ):
        fail("Root validate:assimilation-safety script drifted.")
    if "pnpm validate:assimilation-safety" not in scripts["bootstrap"]:
        fail("Root bootstrap script is missing validate:assimilation-safety.")
    if "pnpm validate:assimilation-safety" not in scripts["check"]:
        fail("Root check script is missing validate:assimilation-safety.")

    playwright_scripts = playwright_package["scripts"]
    for key in ["build", "lint", "test", "typecheck", "e2e"]:
        if "safety-assimilation-observatory.spec.js" not in playwright_scripts[key]:
            fail(f"Playwright package script {key} is missing safety-assimilation-observatory.spec.js.")


if __name__ == "__main__":
    main()
