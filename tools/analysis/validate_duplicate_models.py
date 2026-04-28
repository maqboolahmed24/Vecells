#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"
TESTS_DIR = ROOT / "tests" / "playwright"

MANIFEST_PATH = DATA_DIR / "duplicate_cluster_manifest.json"
MATRIX_PATH = DATA_DIR / "duplicate_pair_evidence_matrix.csv"
CASEBOOK_PATH = DATA_DIR / "duplicate_resolution_casebook.json"
DESIGN_DOC_PATH = DOCS_DIR / "70_duplicate_cluster_and_pair_evidence_design.md"
RULES_DOC_PATH = DOCS_DIR / "70_duplicate_resolution_rules.md"
WORKBENCH_PATH = DOCS_DIR / "70_duplicate_resolution_workbench.html"
SPEC_PATH = TESTS_DIR / "duplicate-resolution-workbench.spec.js"
ROOT_SCRIPT_UPDATES_PATH = ROOT / "tools" / "analysis" / "root_script_updates.py"
DOMAIN_SOURCE_PATH = (
    ROOT / "packages" / "domains" / "identity_access" / "src" / "duplicate-review-backbone.ts"
)
SERVICE_SOURCE_PATH = ROOT / "services" / "command-api" / "src" / "duplicate-review.ts"
MIGRATION_PATH = (
    ROOT / "services" / "command-api" / "migrations" / "070_duplicate_cluster_and_pair_evidence.sql"
)
PLAYWRIGHT_PACKAGE_BUILDER = (
    ROOT / "tools" / "analysis" / "build_parallel_foundation_tracks_gate.py"
)
DOMAIN_PACKAGE_BUILDER = ROOT / "tools" / "analysis" / "build_domain_package_scaffold.py"
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
        WORKBENCH_PATH,
        SPEC_PATH,
        ROOT_SCRIPT_UPDATES_PATH,
        DOMAIN_SOURCE_PATH,
        SERVICE_SOURCE_PATH,
        MIGRATION_PATH,
        PLAYWRIGHT_PACKAGE_BUILDER,
        DOMAIN_PACKAGE_BUILDER,
    ]:
        if not required_path.exists():
            fail(f"Missing required artifact: {required_path}")

    if manifest["task_id"] != "par_070":
        fail("Manifest task_id drifted from par_070.")

    expected_summary = {
        "cluster_count": 6,
        "pair_evidence_count": 8,
        "decision_count": 7,
        "review_required_count": 2,
        "in_review_count": 1,
        "resolved_count": 4,
        "closure_blocking_count": 2,
        "parallel_interface_gap_count": 1,
        "superseded_decision_count": 1,
    }
    for key, expected in expected_summary.items():
        if manifest["summary"][key] != expected:
            fail(f"Manifest summary {key} drifted: expected {expected}, found {manifest['summary'][key]}.")

    if len(manifest["clusters"]) != manifest["summary"]["cluster_count"]:
        fail("cluster_count drifted from clusters array length.")
    if len(manifest["pair_evidences"]) != manifest["summary"]["pair_evidence_count"]:
        fail("pair_evidence_count drifted from pair_evidences array length.")
    if len(manifest["decisions"]) != manifest["summary"]["decision_count"]:
        fail("decision_count drifted from decisions array length.")

    if len(matrix) != manifest["summary"]["pair_evidence_count"]:
        fail("duplicate_pair_evidence_matrix row count must equal pair_evidence_count.")
    if {row["pair_evidence_id"] for row in matrix} != {
        evidence["pairEvidenceId"] for evidence in manifest["pair_evidences"]
    }:
        fail("duplicate_pair_evidence_matrix ids drifted from manifest pair_evidences.")

    if casebook["summary"]["case_count"] != len(casebook["cases"]):
        fail("Casebook case_count drifted from cases array.")
    if casebook["summary"]["blocking_case_count"] != 2:
        fail("blocking_case_count drifted from the frozen par_070 baseline.")
    if casebook["summary"]["supersession_history_count"] != 1:
        fail("supersession_history_count drifted from the frozen par_070 baseline.")

    design_doc = DESIGN_DOC_PATH.read_text(encoding="utf-8")
    for marker in [
        "## Core law",
        "`DuplicateCluster` is the review container, not the settlement.",
        "`DuplicateResolutionDecision` is the only legal settlement",
    ]:
        if marker not in design_doc:
            fail(f"Design doc is missing required marker: {marker}")

    rules_doc = RULES_DOC_PATH.read_text(encoding="utf-8")
    for marker in [
        "## Fail-closed rules",
        "`same_request_attach` requires explicit continuity witness.",
        "## Simulator contract",
    ]:
        if marker not in rules_doc:
            fail(f"Rules doc is missing required marker: {marker}")

    workbench = WORKBENCH_PATH.read_text(encoding="utf-8")
    for marker in [
        'data-testid="constellation"',
        'data-testid="comparison-lane"',
        'data-testid="inspector"',
        'data-testid="evidence-table"',
        'data-testid="supersession-history"',
        'data-testid="relation-filter"',
        'data-testid="review-status-filter"',
        'data-testid="uncertainty-filter"',
    ]:
        if marker not in workbench:
            fail(f"Workbench HTML is missing required marker: {marker}")

    spec_source = SPEC_PATH.read_text(encoding="utf-8")
    for probe in [
        "relation and status filtering",
        "cluster selection synchronization",
        "diagram and table parity",
        "keyboard navigation",
        "reduced motion",
        "responsive layout",
    ]:
        if probe not in spec_source:
            fail(f"Spec is missing expected coverage text: {probe}")

    root_script_updates = ROOT_SCRIPT_UPDATES_PATH.read_text(encoding="utf-8")
    for token in [
        "build_duplicate_models.py",
        "validate:duplicate-models",
        "validate_duplicate_models.py",
    ]:
        if token not in root_script_updates:
            fail(f"root_script_updates.py is missing required token: {token}")

    domain_source = DOMAIN_SOURCE_PATH.read_text(encoding="utf-8")
    for token in [
        "DuplicatePairEvidenceDocument",
        "DuplicateClusterDocument",
        "DuplicateResolutionDecisionDocument",
        "recommendDuplicateResolution",
        "validateDuplicateLedgerState",
        "createDuplicateEvidenceSimulationHarness",
        "PARALLEL_INTERFACE_GAP_070_DUPLICATE_LINEAGE_SETTLEMENT_PORT",
        "SAME_REQUEST_ATTACH_REQUIRES_CONTINUITY_WITNESS",
        "PAIRWISE_EDGES_ARE_NOT_TRANSITIVE_PROOF",
    ]:
        if token not in domain_source:
            fail(f"Duplicate backbone source is missing required token: {token}")

    service_source = SERVICE_SOURCE_PATH.read_text(encoding="utf-8")
    for token in [
        "createDuplicateReviewAuthorityService",
        "createDuplicateReviewStore",
        "createDuplicateEvidenceSimulationHarness",
        "duplicateReviewPersistenceTables",
        "070_duplicate_cluster_and_pair_evidence.sql",
    ]:
        if token not in service_source:
            fail(f"Command API seam is missing required token: {token}")

    migration_source = MIGRATION_PATH.read_text(encoding="utf-8").lower()
    for token in [
        "create table if not exists duplicate_pair_evidences",
        "create table if not exists duplicate_clusters",
        "create table if not exists duplicate_resolution_decisions",
    ]:
        if token not in migration_source:
            fail(f"Migration is missing required token: {token}")

    playwright_builder = PLAYWRIGHT_PACKAGE_BUILDER.read_text(encoding="utf-8")
    if "duplicate-resolution-workbench.spec.js" not in playwright_builder:
        fail("build_parallel_foundation_tracks_gate.py does not preserve the par_070 Playwright spec.")

    domain_builder = DOMAIN_PACKAGE_BUILDER.read_text(encoding="utf-8")
    if 'export * from "./duplicate-review-backbone";' not in domain_builder:
        fail("build_domain_package_scaffold.py does not preserve the duplicate backbone export.")

    scripts = package_json["scripts"]
    if "build_duplicate_models.py" not in scripts["codegen"]:
        fail("Root codegen script is missing build_duplicate_models.py.")
    if "pnpm validate:duplicate-models" not in scripts["bootstrap"]:
        fail("Root bootstrap script is missing validate:duplicate-models.")
    if "pnpm validate:duplicate-models" not in scripts["check"]:
        fail("Root check script is missing validate:duplicate-models.")
    if scripts["validate:duplicate-models"] != "python3 ./tools/analysis/validate_duplicate_models.py":
        fail("Root validate:duplicate-models script drifted.")

    playwright_scripts = playwright_package["scripts"]
    for key in ["build", "lint", "test", "typecheck", "e2e"]:
        if "duplicate-resolution-workbench.spec.js" not in playwright_scripts[key]:
            fail(f"Playwright package script {key} is missing duplicate-resolution-workbench.spec.js.")


if __name__ == "__main__":
    main()
