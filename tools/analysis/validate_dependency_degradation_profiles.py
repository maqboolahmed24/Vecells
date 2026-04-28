#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import sys
from pathlib import Path

from root_script_updates import ROOT_SCRIPT_UPDATES


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"
PLAYWRIGHT_DIR = ROOT / "tests" / "playwright"
TOOLS_DIR = ROOT / "tools" / "runtime-dependency-degradation"

DEGRADATION_PATH = DATA_DIR / "dependency_degradation_profiles.json"
FAILURE_MATRIX_PATH = DATA_DIR / "dependency_failure_mode_matrix.csv"
AUDIENCE_MATRIX_PATH = DATA_DIR / "audience_fallback_matrix.csv"
SCHEMA_PATH = ROOT / "packages" / "api-contracts" / "schemas" / "dependency-degradation-profile.schema.json"
CATALOG_TS_PATH = ROOT / "packages" / "release-controls" / "src" / "dependency-degradation.catalog.ts"
SOURCE_PATH = ROOT / "packages" / "release-controls" / "src" / "dependency-degradation.ts"
INDEX_PATH = ROOT / "packages" / "release-controls" / "src" / "index.ts"
UNIT_TEST_PATH = ROOT / "packages" / "release-controls" / "tests" / "dependency-degradation.test.ts"
PUBLIC_API_TEST_PATH = ROOT / "packages" / "release-controls" / "tests" / "public-api.test.ts"
API_GATEWAY_PATH = ROOT / "services" / "api-gateway" / "src" / "gateway-surface-authority.ts"
COMMAND_API_PATH = ROOT / "services" / "command-api" / "src" / "service-definition.ts"
PROJECTION_WORKER_PATH = ROOT / "services" / "projection-worker" / "src" / "service-definition.ts"
NOTIFICATION_WORKER_PATH = ROOT / "services" / "notification-worker" / "src" / "service-definition.ts"
API_GATEWAY_TEST_PATH = ROOT / "services" / "api-gateway" / "tests" / "dependency-degradation.integration.test.js"
COMMAND_API_TEST_PATH = ROOT / "services" / "command-api" / "tests" / "dependency-degradation.integration.test.js"
PROJECTION_WORKER_TEST_PATH = ROOT / "services" / "projection-worker" / "tests" / "dependency-degradation.integration.test.js"
NOTIFICATION_WORKER_TEST_PATH = ROOT / "services" / "notification-worker" / "tests" / "dependency-degradation.integration.test.js"
DESIGN_DOC_PATH = DOCS_DIR / "98_dependency_degradation_engine_design.md"
RULES_DOC_PATH = DOCS_DIR / "98_workload_family_fallback_and_escalation_rules.md"
HTML_PATH = DOCS_DIR / "98_dependency_degradation_atlas.html"
SPEC_PATH = PLAYWRIGHT_DIR / "dependency-degradation-atlas.spec.js"
SHARED_SCRIPT_PATH = TOOLS_DIR / "shared.ts"
REHEARSAL_SCRIPT_PATH = TOOLS_DIR / "run-dependency-degradation-rehearsal.ts"
VERIFY_SCRIPT_PATH = TOOLS_DIR / "verify-dependency-degradation.ts"
ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = PLAYWRIGHT_DIR / "package.json"
ROOT_SCRIPT_UPDATES_PATH = ROOT / "tools" / "analysis" / "root_script_updates.py"
PARALLEL_GATE_PATH = ROOT / "tools" / "analysis" / "build_parallel_foundation_tracks_gate.py"
WORKFLOW_CI_PATH = ROOT / ".github" / "workflows" / "build-provenance-ci.yml"
WORKFLOW_PROMOTION_PATH = ROOT / ".github" / "workflows" / "nonprod-provenance-promotion.yml"


def fail(message: str) -> None:
    print(message, file=sys.stderr)
    raise SystemExit(1)


def assert_exists(path: Path) -> None:
    if not path.exists():
        fail(f"Missing required par_098 artifact: {path}")


def load_json(path: Path):
    assert_exists(path)
    return json.loads(path.read_text(encoding="utf-8"))


def load_csv(path: Path) -> list[dict[str, str]]:
    assert_exists(path)
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def assert_contains(path: Path, fragment: str) -> None:
    assert_exists(path)
    if fragment not in path.read_text(encoding="utf-8"):
        fail(f"{path} is missing required fragment: {fragment}")


def main() -> None:
    for path in [
        DEGRADATION_PATH,
        FAILURE_MATRIX_PATH,
        AUDIENCE_MATRIX_PATH,
        SCHEMA_PATH,
        CATALOG_TS_PATH,
        SOURCE_PATH,
        INDEX_PATH,
        UNIT_TEST_PATH,
        PUBLIC_API_TEST_PATH,
        API_GATEWAY_PATH,
        COMMAND_API_PATH,
        PROJECTION_WORKER_PATH,
        NOTIFICATION_WORKER_PATH,
        API_GATEWAY_TEST_PATH,
        COMMAND_API_TEST_PATH,
        PROJECTION_WORKER_TEST_PATH,
        NOTIFICATION_WORKER_TEST_PATH,
        DESIGN_DOC_PATH,
        RULES_DOC_PATH,
        HTML_PATH,
        SPEC_PATH,
        SHARED_SCRIPT_PATH,
        REHEARSAL_SCRIPT_PATH,
        VERIFY_SCRIPT_PATH,
        WORKFLOW_CI_PATH,
        WORKFLOW_PROMOTION_PATH,
    ]:
        assert_exists(path)

    pack = load_json(DEGRADATION_PATH)
    schema = load_json(SCHEMA_PATH)
    failure_rows = load_csv(FAILURE_MATRIX_PATH)
    audience_rows = load_csv(AUDIENCE_MATRIX_PATH)
    summary = pack["summary"]

    if pack["task_id"] != "seq_057":
        fail("Dependency degradation pack drifted off seq_057 compatibility.")
    if pack.get("runtime_execution_task_id") != "par_098":
        fail("Dependency degradation pack lost par_098 runtime execution binding.")
    if schema["task_id"] != "seq_057":
        fail("Dependency degradation schema drifted off seq_057 compatibility.")
    if schema.get("runtime_execution_task_id") != "par_098":
        fail("Dependency degradation schema lost par_098 runtime execution binding.")
    if pack["visual_mode"] != "Dependency_Degradation_Atlas":
        fail("Dependency degradation atlas visual mode drifted.")

    if summary["dependency_degradation_profile_count"] != len(pack["profiles"]):
        fail("dependency_degradation_profile_count drifted from profile rows.")
    if summary["runtime_execution_profile_count"] != len(pack["profiles"]):
        fail("runtime_execution_profile_count drifted from profile rows.")
    if summary["failure_mode_matrix_row_count"] != len(failure_rows):
        fail("failure_mode_matrix_row_count drifted.")
    if summary["audience_fallback_row_count"] != len(audience_rows):
        fail("audience_fallback_row_count drifted.")
    if summary["simulation_scenario_count"] != len(pack["simulationScenarios"]):
        fail("simulation_scenario_count drifted.")
    if len(pack["profiles"]) != 20:
        fail("par_098 must publish 20 runtime execution profiles.")

    required_modes = {
        "gateway_read_only",
        "command_halt",
        "projection_stale",
        "integration_queue_only",
        "local_placeholder",
    }
    actual_modes = {row["topologyFallbackMode"] for row in pack["profiles"]}
    if not required_modes.issubset(actual_modes):
        fail(f"Missing required topology fallback modes: {required_modes - actual_modes}")

    required_failure_classes = {
        "transport_loss",
        "semantic_contract_mismatch",
        "callback_ambiguity",
        "accepted_pending_stall",
        "trust_revocation",
    }
    actual_failure_classes = {row["failureModeClass"] for row in pack["profiles"]}
    if actual_failure_classes != required_failure_classes:
        fail(
            "Failure-mode coverage drifted: "
            f"expected {required_failure_classes}, found {actual_failure_classes}."
        )

    for row in pack["profiles"]:
        if row.get("runtimeExecutionTaskId") != "par_098":
            fail(f"{row['dependencyCode']} lost runtimeExecutionTaskId.")
        if not row["routeFamilyRefs"]:
            fail(f"{row['dependencyCode']} lost routeFamilyRefs.")
        if not row["gatewaySurfaceRefs"]:
            fail(f"{row['dependencyCode']} lost gatewaySurfaceRefs.")
        if not row["audienceFallbacks"]:
            fail(f"{row['dependencyCode']} lost audienceFallbacks.")
        if not row["recoveryRequirements"]["allowedRouteExposureStates"]:
            fail(f"{row['dependencyCode']} lost allowedRouteExposureStates.")

    scripts = load_json(ROOT_PACKAGE_PATH)["scripts"]
    for name in [
        "validate:dependency-degradation",
        "ci:rehearse-dependency-degradation",
        "ci:verify-dependency-degradation",
    ]:
        if scripts.get(name) != ROOT_SCRIPT_UPDATES[name]:
            fail(f"Root script drifted for {name}.")
    if "build_dependency_degradation_profiles.py" not in scripts["codegen"]:
        fail("Root codegen script is missing par_098 builder.")
    if "validate:dependency-degradation" not in scripts["bootstrap"]:
        fail("Root bootstrap script is missing validate:dependency-degradation.")
    if "validate:dependency-degradation" not in scripts["check"]:
        fail("Root check script is missing validate:dependency-degradation.")

    playwright_scripts = load_json(PLAYWRIGHT_PACKAGE_PATH)["scripts"]
    for script_name in ["build", "lint", "test", "typecheck", "e2e"]:
        if "dependency-degradation-atlas.spec.js" not in playwright_scripts[script_name]:
            fail(f"Playwright {script_name} script is missing par_098 spec.")

    for token in [
        "validate:dependency-degradation",
        "ci:rehearse-dependency-degradation",
        "ci:verify-dependency-degradation",
        "build_dependency_degradation_profiles.py",
    ]:
        assert_contains(ROOT_SCRIPT_UPDATES_PATH, token)

    assert_contains(PARALLEL_GATE_PATH, "dependency-degradation-atlas.spec.js")
    assert_contains(INDEX_PATH, 'export * from "./dependency-degradation";')
    for token in [
        "DependencyDegradationExecutionEngine",
        "resolveGatewayRouteDegradation",
        "resolveCommandMutationDegradation",
        "resolveProjectionPublicationDegradation",
        "resolveIntegrationDispatchDegradation",
        "createDependencyDegradationSimulationHarness",
        "runDependencyDegradationSimulation",
    ]:
        assert_contains(SOURCE_PATH, token)

    for token in [
        "resolveGatewayRouteDegradation",
        "degradationDecision",
    ]:
        assert_contains(API_GATEWAY_PATH, token)
    for token in [
        "resolveCommandMutationDegradation",
        "halted_by_dependency_degradation",
        "withheld_by_degradation",
    ]:
        assert_contains(COMMAND_API_PATH, token)
    for token in [
        "resolveProjectionPublicationDegradation",
        "projection-stale-explicit",
    ]:
        assert_contains(PROJECTION_WORKER_PATH, token)
    for token in [
        "resolveIntegrationDispatchDegradation",
        "queued_until_dependency_recovers",
        "halted_by_dependency_degradation",
    ]:
        assert_contains(NOTIFICATION_WORKER_PATH, token)

    for token in [
        "keeps patient routes calm and read-only for identity callback ambiguity",
        "enforces bounded escalation ceilings for requested workload families",
        "holds recovery until publication and trust gates clear",
        "publishes deterministic simulation scenarios and metrics",
    ]:
        assert_contains(UNIT_TEST_PATH, token)
    assert_contains(PUBLIC_API_TEST_PATH, "runs the dependency degradation simulation harness")

    combined_docs = (
        DESIGN_DOC_PATH.read_text(encoding="utf-8")
        + RULES_DOC_PATH.read_text(encoding="utf-8")
    )
    for marker in [
        "# 98 Dependency Degradation Engine Design",
        "# 98 Workload Family Fallback And Escalation Rules",
        "FOLLOW_ON_DEPENDENCY_CONTENT_PATIENT_SAFE_PLACEHOLDER_V1",
        "GAP_RESOLUTION_ESCALATION_CEILING_RUNTIME_BOUNDARY_V1",
    ]:
        if marker not in combined_docs:
            fail(f"Docs lost required marker: {marker}")

    for marker in [
        'data-testid="degradation-masthead"',
        'data-testid="filter-topology"',
        'data-testid="filter-audience"',
        'data-testid="filter-failure-mode"',
        'data-testid="profile-rail"',
        'data-testid="fallback-table"',
        'data-testid="impact-table"',
        'data-testid="audience-table"',
        'data-testid="inspector"',
        "prefers-reduced-motion: reduce",
        "Audience Fallback Tokens",
    ]:
        assert_contains(HTML_PATH, marker)

    for probe in [
        "topology fallback filtering",
        "audience fallback inspection",
        "failure-mode filtering",
        "keyboard navigation",
        "reduced motion",
        "responsive layout",
        "accessibility landmarks",
        "gateway_read_only, command_halt, projection_stale, integration_queue_only, and local_placeholder remain distinct",
    ]:
        assert_contains(SPEC_PATH, probe)

    assert_contains(SHARED_SCRIPT_PATH, "hydrateScenario")
    assert_contains(REHEARSAL_SCRIPT_PATH, "dependency-degradation-verdict.json")
    assert_contains(VERIFY_SCRIPT_PATH, "Dependency degradation rehearsal output drifted")

    assert_contains(WORKFLOW_CI_PATH, "ci:rehearse-dependency-degradation")
    assert_contains(WORKFLOW_CI_PATH, "ci:verify-dependency-degradation")
    assert_contains(WORKFLOW_PROMOTION_PATH, "ci:rehearse-dependency-degradation")
    assert_contains(WORKFLOW_PROMOTION_PATH, "ci:verify-dependency-degradation")

    print("dependency degradation profiles validated")


if __name__ == "__main__":
    main()
