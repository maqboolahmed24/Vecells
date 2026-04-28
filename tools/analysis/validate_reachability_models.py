#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"
TESTS_DIR = ROOT / "tests" / "playwright"

MANIFEST_PATH = DATA_DIR / "contact_route_snapshot_manifest.json"
DEPENDENCY_MATRIX_PATH = DATA_DIR / "reachability_dependency_matrix.csv"
CASEBOOK_PATH = DATA_DIR / "reachability_assessment_casebook.json"
DESIGN_DOC_PATH = DOCS_DIR / "69_contact_route_and_reachability_design.md"
RULES_DOC_PATH = DOCS_DIR / "69_reachability_assessment_rules.md"
STUDIO_PATH = DOCS_DIR / "69_reachability_truth_studio.html"
SPEC_PATH = TESTS_DIR / "reachability-truth-studio.spec.js"
ROOT_PACKAGE_PATH = ROOT / "package.json"
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
    rows = load_csv(DEPENDENCY_MATRIX_PATH)
    casebook = load_json(CASEBOOK_PATH)
    package_json = load_json(ROOT_PACKAGE_PATH)
    playwright_package = load_json(PLAYWRIGHT_PACKAGE_PATH)

    for required_path in [DESIGN_DOC_PATH, RULES_DOC_PATH, STUDIO_PATH, SPEC_PATH]:
        if not required_path.exists():
            fail(f"Missing required artifact: {required_path}")

    if manifest["task_id"] != "par_069":
        fail("Manifest task_id drifted from par_069.")

    summary = manifest["summary"]
    expected_summary = {
        "snapshot_count": 10,
        "dependency_count": 6,
        "assessment_count": 8,
        "observation_count": 10,
        "repair_journey_count": 3,
        "verification_checkpoint_count": 3,
        "active_dependency_count": 6,
        "blocked_promise_count": 3,
        "clear_route_count": 2,
    }
    for key, expected in expected_summary.items():
        if summary[key] != expected:
            fail(f"Manifest summary {key} drifted: expected {expected}, found {summary[key]}.")

    length_checks = {
        "snapshot_count": ("snapshots", manifest["snapshots"]),
        "dependency_count": ("dependencies", manifest["dependencies"]),
        "assessment_count": ("assessments", manifest["assessments"]),
        "observation_count": ("observations", manifest["observations"]),
        "repair_journey_count": ("repair_journeys", manifest["repair_journeys"]),
        "verification_checkpoint_count": (
            "verification_checkpoints",
            manifest["verification_checkpoints"],
        ),
    }
    for summary_key, (label, values) in length_checks.items():
        if summary[summary_key] != len(values):
            fail(f"{summary_key} drifted from {label} array.")

    snapshots_by_id = {
        snapshot["contactRouteSnapshotId"]: snapshot for snapshot in manifest["snapshots"]
    }
    assessments_by_id = {
        assessment["reachabilityAssessmentId"]: assessment
        for assessment in manifest["assessments"]
    }
    journeys_by_id = {
        journey["repairJourneyId"]: journey for journey in manifest["repair_journeys"]
    }
    observation_classes_by_id = {
        observation["reachabilityObservationId"]: observation["observationClass"]
        for observation in manifest["observations"]
    }

    for dependency in manifest["dependencies"]:
        dependency_id = dependency["dependencyId"]
        if dependency["currentContactRouteSnapshotRef"] not in snapshots_by_id:
            fail(f"Dependency {dependency_id} references missing currentContactRouteSnapshotRef.")
        if dependency["currentReachabilityAssessmentRef"] not in assessments_by_id:
            fail(f"Dependency {dependency_id} references missing currentReachabilityAssessmentRef.")
        if dependency["repairJourneyRef"] and dependency["repairJourneyRef"] not in journeys_by_id:
            fail(f"Dependency {dependency_id} references missing repairJourneyRef.")
        if not dependency["blockedActionScopeRefs"]:
            fail(f"Dependency {dependency_id} must declare blockedActionScopeRefs.")

    for assessment in manifest["assessments"]:
        assessment_id = assessment["reachabilityAssessmentId"]
        observation_refs = assessment["consideredObservationRefs"]
        observation_classes = [
            observation_classes_by_id[observation_ref]
            for observation_ref in observation_refs
            if observation_ref in observation_classes_by_id
        ]
        if (
            assessment["assessmentState"] == "clear"
            and observation_classes
            and all(observation_class == "transport_ack" for observation_class in observation_classes)
        ):
            fail(
                f"Assessment {assessment_id} illegally treats transport ack as reachability proof."
            )

    if len(rows) != summary["dependency_count"]:
        fail("reachability_dependency_matrix row count must equal dependency_count.")
    if {row["dependency_id"] for row in rows} != {
        dependency["dependencyId"] for dependency in manifest["dependencies"]
    }:
        fail("reachability_dependency_matrix ids drifted from dependencies array.")

    if casebook["summary"]["case_count"] != len(casebook["cases"]):
        fail("Casebook case_count drifted.")
    if casebook["summary"]["blocked_case_count"] != 3:
        fail("blocked_case_count drifted from the frozen par_069 baseline.")
    if casebook["summary"]["repaired_case_count"] != 1:
        fail("repaired_case_count drifted from the frozen par_069 baseline.")

    design_doc = DESIGN_DOC_PATH.read_text(encoding="utf-8")
    for marker in [
        "## Core law",
        "`ReachabilityAssessmentRecord` is the sole object allowed",
        "`ContactRouteVerificationCheckpoint` is the only gate allowed",
    ]:
        if marker not in design_doc:
            fail(f"Design doc is missing required marker: {marker}")

    rules_doc = RULES_DOC_PATH.read_text(encoding="utf-8")
    for marker in [
        "## Fail-closed rules",
        "`transport_ack` alone never clears a route",
        "## Simulator contract",
    ]:
        if marker not in rules_doc:
            fail(f"Rules doc is missing required marker: {marker}")

    studio_html = STUDIO_PATH.read_text(encoding="utf-8")
    for marker in [
        'data-testid="constellation"',
        'data-testid="snapshot-stack"',
        'data-testid="repair-ribbon"',
        'data-testid="inspector"',
        'data-testid="observation-table"',
        'data-testid="checkpoint-table"',
        'data-testid="dependency-matrix-table"',
    ]:
        if marker not in studio_html:
            fail(f"Studio HTML is missing required marker: {marker}")

    spec_source = SPEC_PATH.read_text(encoding="utf-8")
    for probe in [
        "domain filtering",
        "state filtering",
        "selection synchronization",
        "repair spotlight ribbon",
        "diagram and table parity",
        "keyboard navigation",
        "reduced motion",
    ]:
        if probe not in spec_source:
            fail(f"Spec is missing expected coverage text: {probe}")

    scripts = package_json["scripts"]
    if "build_reachability_models.py" not in scripts["codegen"]:
        fail("Root codegen script is missing build_reachability_models.py.")
    if "pnpm validate:reachability" not in scripts["bootstrap"]:
        fail("Root bootstrap script is missing validate:reachability.")
    if "pnpm validate:reachability" not in scripts["check"]:
        fail("Root check script is missing validate:reachability.")
    if scripts["validate:reachability"] != "python3 ./tools/analysis/validate_reachability_models.py":
        fail("Root validate:reachability script drifted.")

    playwright_scripts = playwright_package["scripts"]
    for key in ["build", "lint", "test", "typecheck", "e2e"]:
        if "reachability-truth-studio.spec.js" not in playwright_scripts[key]:
            fail(f"Playwright package script {key} is missing reachability-truth-studio.spec.js.")

    reachability_source = (
        ROOT / "packages" / "domains" / "identity_access" / "src" / "reachability-backbone.ts"
    ).read_text(encoding="utf-8")
    for token in [
        "calculateReachabilityAssessment",
        "createReachabilityGovernorService",
        "createReachabilitySimulationHarness",
        "validateReachabilityLedgerState",
        "TRANSPORT_ACK_WITHOUT_PROOF",
        "VERIFICATION_SUCCESS_REBOUND_READY",
        "ContactRouteRepairJourney",
        "ContactRouteVerificationCheckpoint",
    ]:
        if token not in reachability_source:
            fail(f"Reachability backbone is missing required token: {token}")

    service_source = (
        ROOT / "services" / "command-api" / "src" / "identity-access.ts"
    ).read_text(encoding="utf-8")
    for token in [
        "createReachabilityGovernorService",
        "createReachabilitySimulationHarness",
        "069_contact_route_and_reachability.sql",
        "contact_route_snapshots",
        "reachability_assessment_records",
    ]:
        if token not in service_source:
            fail(f"Command API seam is missing required token: {token}")
    if "createReachabilityStore" not in service_source and "createIdentityRepairStore" not in service_source:
        fail(
            "Command API seam must expose a repository factory for reachability, either "
            "createReachabilityStore or createIdentityRepairStore."
        )

    migration_source = (
        ROOT
        / "services"
        / "command-api"
        / "migrations"
        / "069_contact_route_and_reachability.sql"
    ).read_text(encoding="utf-8")
    for token in [
        "create table if not exists contact_route_snapshots",
        "create table if not exists reachability_dependencies",
        "create table if not exists contact_route_repair_journeys",
        "create table if not exists contact_route_verification_checkpoints",
    ]:
        if token not in migration_source.lower():
            fail(f"Migration is missing required token: {token}")

    domain_test_source = (
        ROOT
        / "packages"
        / "domains"
        / "identity_access"
        / "tests"
        / "reachability-backbone.test.ts"
    ).read_text(encoding="utf-8")
    for token in [
        "transport acknowledgement as at-risk",
        "candidate route verification mints a fresh snapshot",
        "fails closed when verification expires",
        "maps simulator channels and scenarios",
    ]:
        if token not in domain_test_source:
            fail(f"Reachability domain tests are missing required coverage token: {token}")

    integration_test_source = (
        ROOT
        / "services"
        / "command-api"
        / "tests"
        / "identity-access.integration.test.js"
    ).read_text(encoding="utf-8")
    for token in [
        "reachabilityGovernor.freezeContactRouteSnapshot",
        "reachabilitySimulation.simulateScenario",
        "TRANSPORT_ACK_WITHOUT_PROOF",
        "identityAccessMigrationPlanRefs",
    ]:
        if token not in integration_test_source:
            fail(f"Reachability integration test is missing required coverage token: {token}")

    print("reachability models validated")


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception as error:  # pragma: no cover
        fail(str(error))
