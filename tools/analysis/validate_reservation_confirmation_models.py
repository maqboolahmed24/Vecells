#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"
TESTS_DIR = ROOT / "tests" / "playwright"

MANIFEST_PATH = DATA_DIR / "capacity_reservation_manifest.json"
MATRIX_PATH = DATA_DIR / "reservation_truth_matrix.csv"
CASEBOOK_PATH = DATA_DIR / "external_confirmation_gate_casebook.json"
DESIGN_DOC_PATH = DOCS_DIR / "74_capacity_reservation_and_confirmation_gate_design.md"
RULES_DOC_PATH = DOCS_DIR / "74_reservation_truth_and_confirmation_rules.md"
LAB_PATH = DOCS_DIR / "74_reservation_confirmation_truth_lab.html"
SPEC_PATH = TESTS_DIR / "reservation-confirmation-truth-lab.spec.js"

ROOT_SCRIPT_UPDATES_PATH = ROOT / "tools" / "analysis" / "root_script_updates.py"
DOMAIN_SOURCE_PATH = (
    ROOT / "packages" / "domains" / "identity_access" / "src" / "reservation-confirmation-backbone.ts"
)
DOMAIN_INDEX_PATH = ROOT / "packages" / "domains" / "identity_access" / "src" / "index.ts"
SERVICE_SOURCE_PATH = ROOT / "services" / "command-api" / "src" / "reservation-confirmation.ts"
SERVICE_TEST_PATH = (
    ROOT / "services" / "command-api" / "tests" / "reservation-confirmation.integration.test.js"
)
DOMAIN_TEST_PATH = (
    ROOT / "packages" / "domains" / "identity_access" / "tests" / "reservation-confirmation-backbone.test.ts"
)
MIGRATION_PATH = (
    ROOT / "services" / "command-api" / "migrations" / "074_capacity_reservation_and_external_confirmation_gate_models.sql"
)
DOMAIN_PACKAGE_BUILDER = ROOT / "tools" / "analysis" / "build_domain_package_scaffold.py"
PLAYWRIGHT_PACKAGE_BUILDER = (
    ROOT / "tools" / "analysis" / "build_parallel_foundation_tracks_gate.py"
)
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
        DOMAIN_SOURCE_PATH,
        DOMAIN_INDEX_PATH,
        DOMAIN_TEST_PATH,
        SERVICE_SOURCE_PATH,
        SERVICE_TEST_PATH,
        MIGRATION_PATH,
        DOMAIN_PACKAGE_BUILDER,
        PLAYWRIGHT_PACKAGE_BUILDER,
    ]:
        if not required_path.exists():
            fail(f"Missing required artifact: {required_path}")

    if manifest["task_id"] != "par_074":
        fail("Manifest task_id drifted from par_074.")

    expected_summary = {
        "scenario_count": 8,
        "reservation_count": 8,
        "projection_count": 8,
        "gate_case_count": 3,
        "held_count": 1,
        "pending_confirmation_count": 1,
        "confirmed_count": 2,
        "disputed_count": 1,
        "expired_count": 1,
        "truthful_nonexclusive_count": 2,
        "countdown_enabled_count": 1,
        "final_reassurance_legal_count": 2,
        "evidence_atom_count": 10,
        "validator_row_count": 20,
    }
    for key, expected in expected_summary.items():
        if manifest["summary"][key] != expected:
            fail(f"Manifest summary {key} drifted: expected {expected}, found {manifest['summary'][key]}.")

    if len(manifest["scenarios"]) != manifest["summary"]["scenario_count"]:
        fail("Manifest scenario_count drifted from scenarios array length.")
    if len(matrix) != manifest["summary"]["scenario_count"]:
        fail("reservation_truth_matrix row count must equal scenario_count.")
    if casebook["summary"]["case_count"] != len(casebook["cases"]):
        fail("Casebook case_count drifted from cases array.")
    if casebook["summary"]["gate_case_count"] != 3:
        fail("Casebook gate_case_count drifted from the frozen par_074 baseline.")
    if casebook["summary"]["evidence_atom_count"] != 10:
        fail("Casebook evidence_atom_count drifted from the frozen par_074 baseline.")
    if casebook["summary"]["validator_row_count"] != 20:
        fail("Casebook validator_row_count drifted from the frozen par_074 baseline.")

    design_doc = DESIGN_DOC_PATH.read_text(encoding="utf-8")
    for marker in [
        "## Core law",
        "`ReservationTruthProjection` is the sole user-visible authority",
        "## Persistence and simulator",
    ]:
        if marker not in design_doc:
            fail(f"Design doc is missing required marker: {marker}")

    rules_doc = RULES_DOC_PATH.read_text(encoding="utf-8")
    for marker in [
        "## Fail-closed rules",
        "`soft_selected` may not be rendered or persisted as exclusivity.",
        "## Simulator contract",
    ]:
        if marker not in rules_doc:
            fail(f"Rules doc is missing required marker: {marker}")

    lab_source = LAB_PATH.read_text(encoding="utf-8")
    for marker in [
        'data-testid="state-rail"',
        'data-testid="truth-card-strip"',
        'data-testid="confidence-panel"',
        'data-testid="inspector"',
        'data-testid="evidence-table"',
        'data-testid="validator-table"',
        'data-testid="state-filter"',
        'data-testid="commit-mode-filter"',
        'data-testid="assurance-filter"',
        'data-testid="state-rail-parity"',
        'data-testid="confidence-parity"',
    ]:
        if marker not in lab_source:
            fail(f"Lab HTML is missing required marker: {marker}")

    spec_source = SPEC_PATH.read_text(encoding="utf-8")
    for probe in [
        "state and assurance filtering",
        "selection synchronization",
        "chart and table parity",
        "keyboard navigation",
        "reduced motion",
        "responsive layout",
        "accessibility smoke checks",
    ]:
        if probe not in spec_source:
            fail(f"Spec is missing expected coverage text: {probe}")

    root_script_updates = ROOT_SCRIPT_UPDATES_PATH.read_text(encoding="utf-8")
    for token in [
        "build_capacity_reservation_confirmation_models.py",
        "validate:reservation-confirmation",
        "validate_reservation_confirmation_models.py",
    ]:
        if token not in root_script_updates:
            fail(f"root_script_updates.py is missing required token: {token}")

    domain_source = DOMAIN_SOURCE_PATH.read_text(encoding="utf-8")
    for token in [
        "SOFT_SELECTED_FORBIDS_EXCLUSIVE_COMMIT_MODE",
        "defaultReservationConfirmationThresholdPolicy",
        "buildReservationTruthProjection",
        "buildExternalConfirmationGate",
        "validateReservationConfirmationBundle",
        "createReservationConfirmationSimulationHarness",
        "PARALLEL_INTERFACE_GAP_074_RESERVATION_AUTHORITY_PORT",
        "PARALLEL_INTERFACE_GAP_074_BOOKING_CONFIRMATION_TRUTH_PORT",
    ]:
        if token not in domain_source:
            fail(f"Domain source is missing required token: {token}")

    domain_index = DOMAIN_INDEX_PATH.read_text(encoding="utf-8")
    if 'export * from "./reservation-confirmation-backbone";' not in domain_index:
        fail("Domain package index is missing the reservation-confirmation export.")

    service_source = SERVICE_SOURCE_PATH.read_text(encoding="utf-8")
    for token in [
        "createReservationConfirmationAuthorityService",
        "createReservationConfirmationSimulationHarness",
        "reservationConfirmationPersistenceTables",
        "074_capacity_reservation_and_external_confirmation_gate_models.sql",
    ]:
        if token not in service_source:
            fail(f"Command API seam is missing required token: {token}")

    migration_source = MIGRATION_PATH.read_text(encoding="utf-8").lower()
    for token in [
        "create table if not exists capacity_reservations",
        "create table if not exists reservation_truth_projections",
        "create table if not exists external_confirmation_gates",
    ]:
        if token not in migration_source:
            fail(f"Migration is missing required token: {token}")

    domain_builder = DOMAIN_PACKAGE_BUILDER.read_text(encoding="utf-8")
    if 'export * from "./reservation-confirmation-backbone";' not in domain_builder:
        fail("build_domain_package_scaffold.py does not preserve the reservation-confirmation export.")

    playwright_builder = PLAYWRIGHT_PACKAGE_BUILDER.read_text(encoding="utf-8")
    if "reservation-confirmation-truth-lab.spec.js" not in playwright_builder:
        fail("build_parallel_foundation_tracks_gate.py does not preserve the par_074 Playwright spec.")

    scripts = package_json["scripts"]
    if "build_capacity_reservation_confirmation_models.py" not in scripts["codegen"]:
        fail("Root codegen script is missing build_capacity_reservation_confirmation_models.py.")
    if "pnpm validate:reservation-confirmation" not in scripts["bootstrap"]:
        fail("Root bootstrap script is missing validate:reservation-confirmation.")
    if "pnpm validate:reservation-confirmation" not in scripts["check"]:
        fail("Root check script is missing validate:reservation-confirmation.")
    if (
        scripts["validate:reservation-confirmation"]
        != "python3 ./tools/analysis/validate_reservation_confirmation_models.py"
    ):
        fail("Root validate:reservation-confirmation script drifted.")

    playwright_scripts = playwright_package["scripts"]
    for key in ["build", "lint", "test", "typecheck", "e2e"]:
        if "reservation-confirmation-truth-lab.spec.js" not in playwright_scripts[key]:
            fail(
                f"Playwright package script {key} is missing reservation-confirmation-truth-lab.spec.js."
            )


if __name__ == "__main__":
    main()
