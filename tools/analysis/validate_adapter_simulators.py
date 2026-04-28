#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import sys
from pathlib import Path

from root_script_updates import ROOT_SCRIPT_UPDATES


ROOT = Path(__file__).resolve().parents[2]
DOCS_DIR = ROOT / "docs" / "integrations"
DATA_DIR = ROOT / "data" / "integration"
ANALYSIS_DIR = ROOT / "data" / "analysis"
TESTS_DIR = ROOT / "tests" / "playwright"

VALIDATION_DOC_PATH = DOCS_DIR / "129_adapter_simulator_validation.md"
CATALOG_DOC_PATH = DOCS_DIR / "129_seeded_external_contract_catalog.md"
HANDOVER_DOC_PATH = DOCS_DIR / "129_mock_now_vs_actual_provider_handover.md"
DEGRADED_DOC_PATH = DOCS_DIR / "129_adapter_degraded_mode_matrix.md"
CONSOLE_PATH = DOCS_DIR / "129_adapter_validation_console.html"

ADAPTER_MATRIX_PATH = DATA_DIR / "adapter_simulator_matrix.csv"
CATALOG_PATH = DATA_DIR / "seeded_external_contract_catalog.json"
DEGRADATION_PATH = DATA_DIR / "adapter_degradation_profiles.json"
VALIDATION_RESULTS_PATH = DATA_DIR / "adapter_validation_results.json"
HANDOVER_MATRIX_PATH = DATA_DIR / "live_provider_handover_matrix.csv"

SIMULATOR_MATRIX_SOURCE_PATH = ANALYSIS_DIR / "simulator_vs_live_adapter_matrix.csv"
SIMULATOR_CATALOG_SOURCE_PATH = ANALYSIS_DIR / "simulator_contract_catalog.json"

SPEC_PATH = TESTS_DIR / "adapter-validation-console.spec.js"
ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = TESTS_DIR / "package.json"

EXCLUDED_ADAPTER_CODES = {
    "adp_assistive_model_vendor_watch",
    "adp_standards_source_watch",
}
REQUIRED_RUNTIME_COVERAGE = {"runtime_http", "standalone_http", "contract_only", "missing_runtime"}


def fail(message: str) -> None:
    print(message, file=sys.stderr)
    raise SystemExit(1)


def assert_exists(path: Path) -> None:
    if not path.exists():
        fail(f"Missing required seq_129 artifact: {path}")


def load_json(path: Path):
    assert_exists(path)
    return json.loads(path.read_text(encoding="utf-8"))


def load_csv(path: Path):
    assert_exists(path)
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def assert_contains(path: Path, fragment: str) -> None:
    assert_exists(path)
    if fragment not in path.read_text(encoding="utf-8"):
        fail(f"{path} is missing required fragment: {fragment}")


def non_empty_csv_cell(row: dict[str, str], field: str) -> bool:
    return bool(row.get(field, "").strip())


def main() -> None:
    for path in [
        VALIDATION_DOC_PATH,
        CATALOG_DOC_PATH,
        HANDOVER_DOC_PATH,
        DEGRADED_DOC_PATH,
        CONSOLE_PATH,
        ADAPTER_MATRIX_PATH,
        CATALOG_PATH,
        DEGRADATION_PATH,
        VALIDATION_RESULTS_PATH,
        HANDOVER_MATRIX_PATH,
        SPEC_PATH,
    ]:
        assert_exists(path)

    source_matrix = [
        row
        for row in load_csv(SIMULATOR_MATRIX_SOURCE_PATH)
        if row["adapterCode"] not in EXCLUDED_ADAPTER_CODES
    ]
    source_adapter_ids = {row["adapterCode"] for row in source_matrix}
    source_simulator_ids = {row["simulatorContractRef"] for row in source_matrix}

    simulator_catalog = load_json(SIMULATOR_CATALOG_SOURCE_PATH)
    catalog_simulator_ids = {row["simulatorId"] for row in simulator_catalog["simulators"]}
    missing_catalog_simulator_ids = source_simulator_ids - catalog_simulator_ids

    seeded_catalog = load_json(CATALOG_PATH)
    validation_results = load_json(VALIDATION_RESULTS_PATH)
    degradation_payload = load_json(DEGRADATION_PATH)
    adapter_matrix_rows = load_csv(ADAPTER_MATRIX_PATH)
    handover_rows = load_csv(HANDOVER_MATRIX_PATH)

    if seeded_catalog.get("task_id") != "seq_129":
        fail("seeded_external_contract_catalog.json drifted off seq_129.")
    if seeded_catalog.get("visual_mode") != "Adapter_Validation_Console":
        fail("seq_129 visual mode drifted off Adapter_Validation_Console.")
    if validation_results.get("task_id") != "seq_129":
        fail("adapter_validation_results.json drifted off seq_129.")
    if degradation_payload.get("task_id") != "seq_129":
        fail("adapter_degradation_profiles.json drifted off seq_129.")

    adapter_rows = seeded_catalog.get("adapterRows", [])
    validation_rows = validation_results.get("rows", [])
    degradation_rows = degradation_payload.get("rows", [])

    if len(adapter_rows) != len(source_adapter_ids):
        fail("Adapter catalog row count drifted from the simulator-vs-live source matrix.")
    if len(adapter_matrix_rows) != len(source_adapter_ids):
        fail("adapter_simulator_matrix.csv row count drifted from the source matrix.")
    if len(validation_rows) != len(source_adapter_ids):
        fail("adapter_validation_results.json row count drifted from the source matrix.")
    if len(degradation_rows) != len(source_adapter_ids):
        fail("adapter_degradation_profiles.json row count drifted from the source matrix.")
    if len(handover_rows) != len(source_adapter_ids):
        fail("live_provider_handover_matrix.csv row count drifted from the source matrix.")

    adapter_ids = {row["adapterId"] for row in adapter_rows}
    if adapter_ids != source_adapter_ids:
        fail("Seeded adapter catalog omitted one or more required adapter rows.")

    summary = seeded_catalog.get("summary", {})
    if summary.get("adapterCount") != len(adapter_rows):
        fail("Seeded adapter catalog summary adapterCount drifted.")
    if summary.get("dishonestCount", 0) != 0:
        fail("seq_129 should not close with dishonest adapter rows.")

    degradation_by_profile = {row["profileId"]: row for row in degradation_rows}
    validation_by_adapter = {row["adapterId"]: row for row in validation_rows}
    handover_by_adapter = {row["adapterId"]: row for row in handover_rows}

    for row in adapter_rows:
        adapter_id = row["adapterId"]
        for field in [
            "adapterId",
            "adapterFamily",
            "mockOrActual",
            "ingressContractRefs",
            "egressContractRefs",
            "capabilityTuple",
            "unsupportedCapabilityRefs",
            "idempotencyModel",
            "receiptProofModel",
            "degradationProfileRef",
            "seedFixtureRefs",
            "currentValidationState",
            "liveProviderMigrationRef",
            "notes",
            "runtimeEvidence",
        ]:
            if field not in row:
                fail(f"{adapter_id} is missing required field {field}.")

        if row["mockOrActual"] != "mock_now_execution":
            fail(f"{adapter_id} drifted off mock_now_execution posture.")
        if not row["ingressContractRefs"] or not row["egressContractRefs"]:
            fail(f"{adapter_id} lost explicit ingress/egress contract refs.")
        if not row["unsupportedCapabilityRefs"]:
            fail(f"{adapter_id} lost explicit unsupported capability refs.")
        if not row["seedFixtureRefs"] and row["runtimeEvidence"]["runtimeCoverage"] in {
            "runtime_http",
            "standalone_http",
        }:
            fail(f"{adapter_id} lost seeded fixtures despite having an executable runtime.")

        capability = row["capabilityTuple"]
        for field in [
            "capabilityTupleId",
            "supportedActionScopes",
            "effectFamilies",
            "authoritativeProofObjects",
            "routeFamilyRefs",
            "runtimeSurface",
        ]:
            if field not in capability:
                fail(f"{adapter_id} capability tuple is missing {field}.")
        if not capability["supportedActionScopes"]:
            fail(f"{adapter_id} lost supported action scopes.")
        if not capability["authoritativeProofObjects"]:
            fail(f"{adapter_id} lost authoritative proof objects.")
        if capability["runtimeSurface"] not in REQUIRED_RUNTIME_COVERAGE:
            fail(f"{adapter_id} has unknown runtime coverage {capability['runtimeSurface']}.")

        profile_ref = row["degradationProfileRef"]
        if profile_ref not in degradation_by_profile:
            fail(f"{adapter_id} points at missing degradation profile {profile_ref}.")

        runtime_evidence = row["runtimeEvidence"]
        runtime_coverage = runtime_evidence["runtimeCoverage"]
        if runtime_coverage not in REQUIRED_RUNTIME_COVERAGE:
            fail(f"{adapter_id} runtime coverage is invalid: {runtime_coverage}")
        if not runtime_evidence["validationScenarios"]:
            fail(f"{adapter_id} lost validation scenarios.")
        if runtime_evidence["duplicateSideEffectsDetected"]:
            fail(f"{adapter_id} still reports duplicate side effects.")
        if not runtime_evidence["degradedTruthVisible"]:
            fail(f"{adapter_id} no longer surfaces degraded truth explicitly.")
        if not runtime_evidence["unsupportedCapabilityVisible"]:
            fail(f"{adapter_id} no longer surfaces unsupported capability explicitly.")

        validation_row = validation_by_adapter.get(adapter_id)
        if not validation_row:
            fail(f"{adapter_id} is missing from adapter_validation_results.json.")
        if validation_row["currentValidationState"] != row["currentValidationState"]:
            fail(f"{adapter_id} drifted between catalog and validation results.")
        if validation_row["runtimeCoverage"] != runtime_coverage:
            fail(f"{adapter_id} drifted between catalog and validation runtime coverage.")

        if row["currentValidationState"] == "pass":
            if runtime_coverage not in {"runtime_http", "standalone_http"}:
                fail(f"{adapter_id} cannot pass without an executable runtime path.")
            if not runtime_evidence["usedRealCurrentPath"]:
                fail(f"{adapter_id} passed without using the real current path.")
            if not runtime_evidence["exactReplayVerified"]:
                fail(f"{adapter_id} passed without exact replay verification.")
            if runtime_evidence["gapRefs"]:
                fail(f"{adapter_id} passed while still carrying explicit gap refs.")
        elif runtime_coverage == "contract_only":
            if row["currentValidationState"] != "partial":
                fail(f"{adapter_id} contract-only rows must remain partial.")
            if not runtime_evidence["gapRefs"]:
                fail(f"{adapter_id} contract-only row lost its explicit gap refs.")
        elif runtime_coverage == "missing_runtime":
            if row["currentValidationState"] not in {"blocked", "dishonest"}:
                fail(f"{adapter_id} missing-runtime rows must not pass.")
            if not runtime_evidence["gapRefs"]:
                fail(f"{adapter_id} missing-runtime row lost its explicit gap refs.")

        if row["simulatorContractRef"] in missing_catalog_simulator_ids:
            if row["currentValidationState"] == "pass":
                fail(f"{adapter_id} passed even though its simulator catalog row is missing upstream.")
            if not runtime_evidence["gapRefs"]:
                fail(f"{adapter_id} lacks explicit gap refs for its missing simulator catalog row.")

        handover_row = handover_by_adapter.get(adapter_id)
        if not handover_row:
            fail(f"{adapter_id} is missing from the live-provider handover matrix.")
        for field in [
            "pendingOnboardingEvidence",
            "simulatorAssumptionsToRevisit",
            "proofObjectsBecomeLive",
            "operationalMonitoringEvidence",
            "currentExecutionPosture",
            "actualProviderSummary",
        ]:
            if not non_empty_csv_cell(handover_row, field):
                fail(f"{adapter_id} handover row is missing {field}.")

    assert_contains(VALIDATION_DOC_PATH, "# 129 Adapter Simulator Validation")
    assert_contains(CATALOG_DOC_PATH, "# 129 Seeded External Contract Catalog")
    assert_contains(HANDOVER_DOC_PATH, "# 129 Mock Now Vs Actual Provider Handover")
    assert_contains(DEGRADED_DOC_PATH, "# 129 Adapter Degraded Mode Matrix")

    assert_contains(CONSOLE_PATH, "Adapter_Validation_Console")
    assert_contains(CONSOLE_PATH, 'data-testid="filter-family"')
    assert_contains(CONSOLE_PATH, 'data-testid="filter-state"')
    assert_contains(CONSOLE_PATH, 'data-testid="filter-posture"')
    assert_contains(CONSOLE_PATH, 'data-testid="adapter-rail"')
    assert_contains(CONSOLE_PATH, 'data-testid="capability-matrix"')
    assert_contains(CONSOLE_PATH, 'data-testid="degradation-braid"')
    assert_contains(CONSOLE_PATH, 'data-testid="handover-ladder"')
    assert_contains(CONSOLE_PATH, 'data-testid="inspector"')
    assert_contains(CONSOLE_PATH, "dataset.reducedMotion")

    assert_contains(SPEC_PATH, "adapterValidationConsoleCoverage")
    assert_contains(SPEC_PATH, "unsupported capability visibility")
    assert_contains(SPEC_PATH, "keyboard traversal and landmark structure")
    assert_contains(SPEC_PATH, "reduced-motion")

    scripts = load_json(ROOT_PACKAGE_PATH)["scripts"]
    if scripts.get("validate:adapter-simulators") != ROOT_SCRIPT_UPDATES["validate:adapter-simulators"]:
        fail("Root script drifted for validate:adapter-simulators.")
    if "build_adapter_simulator_validation.ts" not in scripts["codegen"]:
        fail("Root codegen script is missing the adapter simulator validation generator.")
    if "validate:adapter-simulators" not in scripts["bootstrap"]:
        fail("Root bootstrap script is missing validate:adapter-simulators.")
    if "validate:adapter-simulators" not in scripts["check"]:
        fail("Root check script is missing validate:adapter-simulators.")

    playwright_scripts = load_json(PLAYWRIGHT_PACKAGE_PATH)["scripts"]
    for script_name in ["build", "lint", "test", "typecheck", "e2e"]:
        if "adapter-validation-console.spec.js" not in playwright_scripts[script_name]:
            fail(f"Playwright {script_name} script is missing seq_129 coverage.")


if __name__ == "__main__":
    main()
