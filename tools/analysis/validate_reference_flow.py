#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import sys
from pathlib import Path

from root_script_updates import ROOT_SCRIPT_UPDATES


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "programme"
TESTS_DIR = ROOT / "tests" / "playwright"

REFERENCE_CATALOG_PATH = DATA_DIR / "reference_case_catalog.json"
TRACE_MATRIX_PATH = DATA_DIR / "reference_flow_trace_matrix.csv"
PROJECTION_SNAPSHOTS_PATH = DATA_DIR / "reference_flow_projection_snapshots.csv"
SETTLEMENT_CHAIN_PATH = DATA_DIR / "reference_flow_settlement_chain.jsonl"
BLOCKER_MATRIX_PATH = DATA_DIR / "reference_flow_blocker_matrix.csv"

SYNTHETIC_FLOW_DOC_PATH = DOCS_DIR / "128_synthetic_reference_flow.md"
CASE_CATALOG_DOC_PATH = DOCS_DIR / "128_reference_case_catalog.md"
SEED_CONTRACT_DOC_PATH = DOCS_DIR / "128_seed_data_and_trace_contracts.md"
OBSERVATORY_PATH = DOCS_DIR / "128_reference_flow_observatory.html"
TRACEABILITY_DOC_PATH = DOCS_DIR / "128_reference_flow_traceability.md"
SPEC_PATH = TESTS_DIR / "synthetic-reference-flow-observatory.spec.js"

ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = TESTS_DIR / "package.json"

REQUIRED_CASES = {
    "RC_FLOW_001": "nominal",
    "RC_FLOW_002": "replay",
    "RC_FLOW_003": "duplicate_review",
    "RC_FLOW_004": "quarantine_fallback",
    "RC_FLOW_005": "identity_hold",
    "RC_FLOW_006": "confirmation_blocked",
}
UNHAPPY_PATH_CASES = {"RC_FLOW_003", "RC_FLOW_004", "RC_FLOW_005", "RC_FLOW_006"}
REQUIRED_LAYERS = {
    "gateway",
    "command_api",
    "domain_kernel",
    "event_spine",
    "projection_worker",
    "shell_observatory",
}


def fail(message: str) -> None:
    print(message, file=sys.stderr)
    raise SystemExit(1)


def assert_exists(path: Path) -> None:
    if not path.exists():
        fail(f"Missing required seq_128 artifact: {path}")


def load_json(path: Path):
    assert_exists(path)
    return json.loads(path.read_text(encoding="utf-8"))


def load_csv(path: Path):
    assert_exists(path)
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def load_jsonl(path: Path):
    assert_exists(path)
    rows = []
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line:
            rows.append(json.loads(line))
    return rows


def assert_contains(path: Path, fragment: str) -> None:
    assert_exists(path)
    if fragment not in path.read_text(encoding="utf-8"):
        fail(f"{path} is missing required fragment: {fragment}")


def main() -> None:
    for path in [
        REFERENCE_CATALOG_PATH,
        TRACE_MATRIX_PATH,
        PROJECTION_SNAPSHOTS_PATH,
        SETTLEMENT_CHAIN_PATH,
        BLOCKER_MATRIX_PATH,
        SYNTHETIC_FLOW_DOC_PATH,
        CASE_CATALOG_DOC_PATH,
        SEED_CONTRACT_DOC_PATH,
        OBSERVATORY_PATH,
        TRACEABILITY_DOC_PATH,
        SPEC_PATH,
    ]:
        assert_exists(path)

    reference_catalog = load_json(REFERENCE_CATALOG_PATH)
    trace_matrix_rows = load_csv(TRACE_MATRIX_PATH)
    projection_rows = load_csv(PROJECTION_SNAPSHOTS_PATH)
    settlement_rows = load_jsonl(SETTLEMENT_CHAIN_PATH)
    blocker_rows = load_csv(BLOCKER_MATRIX_PATH)

    legacy_cases = reference_catalog.get("referenceCases", [])
    if len(legacy_cases) < 11:
        fail("seq_128 must preserve the legacy seq_059 reference corpus.")

    harness = reference_catalog.get("referenceFlowHarness")
    if not isinstance(harness, dict):
        fail("reference_case_catalog.json is missing referenceFlowHarness.")
    if harness.get("task_id") != "seq_128":
        fail("referenceFlowHarness drifted off seq_128.")

    cases = harness.get("referenceFlowCases", [])
    if len(cases) != 6:
        fail("Expected exactly six synthetic reference-flow cases.")

    case_by_id = {}
    for case in cases:
        case_id = case.get("referenceCaseId")
        scenario_class = case.get("scenarioClass")
        if case_id in case_by_id:
            fail(f"Duplicate reference-flow case id: {case_id}")
        case_by_id[case_id] = case
        if case_id not in REQUIRED_CASES:
            fail(f"Unexpected synthetic reference-flow case: {case_id}")
        if scenario_class != REQUIRED_CASES[case_id]:
            fail(f"Case {case_id} drifted off required scenario class {REQUIRED_CASES[case_id]}.")
        for field in [
            "seedFixtureRefs",
            "entryChannel",
            "gatewaySurfaceRef",
            "routeFamilyRef",
            "expectedCanonicalObjects",
            "expectedEvents",
            "expectedSettlementChain",
            "expectedProjectionFamilies",
            "expectedClosureBlockers",
            "expectedRecoveryOrFallbackPosture",
            "shellContinuityExpectation",
            "mockOrActualState",
            "notes",
        ]:
            if field not in case:
                fail(f"Case {case_id} is missing required field {field}.")
        if case["mockOrActualState"] != "mock_now_execution":
            fail(f"Case {case_id} drifted off the required mock-now execution posture.")
        if case["actualTrace"]["domain"]["closureAuthorityOwner"] != "LifecycleCoordinator":
            fail(f"Case {case_id} implies closure outside LifecycleCoordinator ownership.")

    if set(case_by_id) != set(REQUIRED_CASES):
        fail("Missing one or more required synthetic reference-flow cases.")

    rows_by_case: dict[str, list[dict[str, str]]] = {}
    for row in trace_matrix_rows:
        rows_by_case.setdefault(row["referenceCaseId"], []).append(row)

    if len(trace_matrix_rows) != len(REQUIRED_CASES) * len(REQUIRED_LAYERS):
        fail("Trace matrix row count drifted from the 6-layer contract.")

    for case_id in REQUIRED_CASES:
        rows = rows_by_case.get(case_id, [])
        layers = {row["layer"] for row in rows}
        if layers != REQUIRED_LAYERS:
            fail(f"Trace matrix layer coverage drifted for {case_id}: {sorted(layers)}")

        for runtime_layer in ["gateway", "command_api", "projection_worker"]:
            row = next(candidate for candidate in rows if candidate["layer"] == runtime_layer)
            if row["pathKind"] != "runtime_http":
                fail(f"{case_id} bypassed the real runtime path for {runtime_layer}.")
            if row["usedRealCurrentPath"] != "true":
                fail(f"{case_id} drifted off the real runtime path for {runtime_layer}.")

        shell_row = next(candidate for candidate in rows if candidate["layer"] == "shell_observatory")
        if shell_row["pathKind"] != "shell_manifest":
            fail(f"{case_id} lost its shell-facing proof row.")

        if any(row["coordinatorOwnedClosure"] != "true" for row in rows):
            fail(f"{case_id} lost coordinator-owned closure in the trace matrix.")

    replay_case = case_by_id["RC_FLOW_002"]
    if replay_case["actualTrace"]["domain"]["sideEffectDelta"] != 0:
        fail("Exact replay created a new side effect instead of reusing authoritative truth.")
    if replay_case["actualTrace"]["domain"]["payload"]["committedRequestId"] != replay_case["actualTrace"]["domain"]["payload"]["replayRequestId"]:
        fail("Exact replay minted a different request instead of returning the prior request.")

    fallback_case = case_by_id["RC_FLOW_004"]
    fallback_domain_payload = fallback_case["actualTrace"]["domain"]["payload"]
    if "fallbackCase" not in fallback_domain_payload["requestClosure"]:
        fail("Fallback case lost the fallback review object.")
    if "patient_visible_continuity" not in fallback_case["actualTrace"]["domain"]["continuityOutcome"]:
        fail("Fallback case lost patient-visible continuity proof.")
    if "true" not in {
        row["patientVisibleContinuity"]
        for row in blocker_rows
        if row["referenceCaseId"] == "RC_FLOW_004"
    }:
        fail("Fallback blocker rows no longer record patient-visible continuity.")

    for case_id in UNHAPPY_PATH_CASES:
        if case_id not in rows_by_case:
            fail(f"Unhappy-path case {case_id} is missing from the machine-readable trace matrix.")
        if case_id not in {row["referenceCaseId"] for row in blocker_rows}:
            fail(f"Unhappy-path case {case_id} is missing from the blocker matrix.")
        if case_id not in {row["referenceCaseId"] for row in settlement_rows}:
            fail(f"Unhappy-path case {case_id} is missing from the settlement chain.")

    projection_case_ids = {row["referenceCaseId"] for row in projection_rows}
    if projection_case_ids != set(REQUIRED_CASES):
        fail("Projection snapshot coverage drifted across the reference cases.")

    scripts = load_json(ROOT_PACKAGE_PATH)["scripts"]
    if scripts.get("validate:reference-flow") != ROOT_SCRIPT_UPDATES["validate:reference-flow"]:
        fail("Root script drifted for validate:reference-flow.")
    if "run_synthetic_reference_flow.ts" not in scripts["codegen"]:
        fail("Root codegen script is missing the synthetic reference-flow generator.")
    if "validate:reference-flow" not in scripts["bootstrap"]:
        fail("Root bootstrap script is missing validate:reference-flow.")
    if "validate:reference-flow" not in scripts["check"]:
        fail("Root check script is missing validate:reference-flow.")

    playwright_scripts = load_json(PLAYWRIGHT_PACKAGE_PATH)["scripts"]
    for script_name in ["build", "lint", "test", "typecheck", "e2e"]:
        if "synthetic-reference-flow-observatory.spec.js" not in playwright_scripts[script_name]:
            fail(f"Playwright {script_name} script is missing seq_128 coverage.")

    assert_contains(OBSERVATORY_PATH, "Reference Flow Observatory")
    assert_contains(OBSERVATORY_PATH, "data-testid=\"scenario-rail\"")
    assert_contains(OBSERVATORY_PATH, "data-testid=\"sequence-diagram\"")
    assert_contains(OBSERVATORY_PATH, "data-testid=\"state-lattice\"")
    assert_contains(OBSERVATORY_PATH, "data-testid=\"blocker-ribbon\"")
    assert_contains(SPEC_PATH, "syntheticReferenceFlowObservatoryCoverage")
    assert_contains(SPEC_PATH, "diagram/table parity")


if __name__ == "__main__":
    main()
