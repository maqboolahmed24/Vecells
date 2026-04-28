#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import sys
from pathlib import Path

from root_script_updates import ROOT_SCRIPT_UPDATES


ROOT = Path(__file__).resolve().parents[2]
DOCS_DIR = ROOT / "docs" / "architecture"
DATA_DIR = ROOT / "data" / "analysis"
PACKAGE_DIR = ROOT / "packages" / "persistent-shell"
PLAYWRIGHT_DIR = ROOT / "tests" / "playwright"

DOC_PATH = DOCS_DIR / "112_route_guard_and_feature_flag_plumbing.md"
PRECEDENCE_DOC_PATH = DOCS_DIR / "112_browser_authority_and_runtime_binding_precedence.md"
CHANNEL_DOC_PATH = DOCS_DIR / "112_embedded_and_constrained_channel_guard_rules.md"
LAB_PATH = DOCS_DIR / "112_route_guard_lab.html"

DECISION_MATRIX_PATH = DATA_DIR / "route_guard_decision_matrix.csv"
SWITCH_SCHEMA_PATH = DATA_DIR / "feature_switch_schema.json"
EXAMPLES_PATH = DATA_DIR / "runtime_binding_guard_examples.json"
FREEZE_MATRIX_PATH = DATA_DIR / "route_freeze_and_recovery_matrix.csv"

PACKAGE_INDEX_PATH = PACKAGE_DIR / "src" / "index.tsx"
PACKAGE_SOURCE_PATH = PACKAGE_DIR / "src" / "route-guard-plumbing.tsx"
PACKAGE_TEST_PATH = PACKAGE_DIR / "tests" / "route-guard-plumbing.test.ts"
PACKAGE_PUBLIC_API_TEST_PATH = PACKAGE_DIR / "tests" / "public-api.test.ts"

ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = PLAYWRIGHT_DIR / "package.json"
ROOT_SCRIPT_UPDATES_PATH = ROOT / "tools" / "analysis" / "root_script_updates.py"
SPEC_PATH = PLAYWRIGHT_DIR / "route-guard-and-feature-flags.spec.js"


def fail(message: str) -> None:
    print(message, file=sys.stderr)
    raise SystemExit(1)


def assert_exists(path: Path) -> None:
    if not path.exists():
        fail(f"Missing par_112 artifact: {path}")


def assert_contains(path: Path, fragment: str) -> None:
    assert_exists(path)
    if fragment not in path.read_text(encoding="utf-8"):
        fail(f"{path} is missing required fragment: {fragment}")


def read_json(path: Path):
    assert_exists(path)
    return json.loads(path.read_text(encoding="utf-8"))


def read_csv(path: Path) -> list[dict[str, str]]:
    assert_exists(path)
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def main() -> None:
    for path in [
        DOC_PATH,
        PRECEDENCE_DOC_PATH,
        CHANNEL_DOC_PATH,
        LAB_PATH,
        DECISION_MATRIX_PATH,
        SWITCH_SCHEMA_PATH,
        EXAMPLES_PATH,
        FREEZE_MATRIX_PATH,
        PACKAGE_INDEX_PATH,
        PACKAGE_SOURCE_PATH,
        PACKAGE_TEST_PATH,
        PACKAGE_PUBLIC_API_TEST_PATH,
        ROOT_PACKAGE_PATH,
        PLAYWRIGHT_PACKAGE_PATH,
        ROOT_SCRIPT_UPDATES_PATH,
        SPEC_PATH,
        Path(__file__),
    ]:
        assert_exists(path)

    decision_rows = read_csv(DECISION_MATRIX_PATH)
    freeze_rows = read_csv(FREEZE_MATRIX_PATH)
    schema_payload = read_json(SWITCH_SCHEMA_PATH)
    examples_payload = read_json(EXAMPLES_PATH)
    root_package = read_json(ROOT_PACKAGE_PATH)
    playwright_package = read_json(PLAYWRIGHT_PACKAGE_PATH)

    if examples_payload["task_id"] != "par_112":
        fail("Route-guard examples drifted off par_112.")
    if examples_payload["visual_mode"] != "Route_Guard_Lab":
        fail("Route-guard examples visual mode drifted.")
    if examples_payload["summary"]["scenario_count"] != len(examples_payload["scenarios"]):
        fail("Route-guard scenario summary drifted.")
    if len(examples_payload["scenarios"]) != 7:
        fail("Expected exactly 7 route-guard examples.")

    postures = {scenario["effectivePosture"] for scenario in examples_payload["scenarios"]}
    if postures != {"live", "read_only", "recovery_only", "blocked"}:
        fail(f"Route-guard examples lost posture coverage: {postures}")

    if len(decision_rows) != 7:
        fail("Route-guard decision matrix drifted from 7 rows.")
    if len(freeze_rows) != 7:
        fail("Route freeze and recovery matrix drifted from 7 rows.")

    required_schema_fields = {
        "capabilityId",
        "routeFamilyRef",
        "manifestRef",
        "capabilityKind",
        "exposure",
        "label",
        "inspectorLabel",
        "requiredPosture",
        "presentInManifest",
        "enabledForRoute",
        "state",
        "reasonRefs",
        "sourceRefs",
    }
    if set(schema_payload["required"]) != required_schema_fields:
        fail("Feature-switch schema required fields drifted.")

    capability_kinds = set(schema_payload["properties"]["capabilityKind"]["enum"])
    if capability_kinds != {
        "route_entry",
        "projection_query",
        "mutation_command",
        "live_update_channel",
        "cache_reuse",
        "recovery_action",
        "embedded_bridge",
    }:
        fail("Feature-switch capability kinds drifted.")

    assert_contains(DOC_PATH, "GAP_RESOLUTION_FEATURE_SWITCH_ROUTE_CAPABILITY_TYPES")
    assert_contains(DOC_PATH, "ASSUMPTION_EMBEDDED_MINIMUM_CAPABILITIES")
    assert_contains(PRECEDENCE_DOC_PATH, "flowchart TD")
    assert_contains(CHANNEL_DOC_PATH, "flowchart TD")
    assert_contains(LAB_PATH, 'data-testid="route-guard-lab"')
    assert_contains(LAB_PATH, 'data-testid="guard-stage"')
    assert_contains(LAB_PATH, 'data-testid="guard-runtime-inspector"')
    assert_contains(LAB_PATH, 'data-testid="guard-timeline"')
    assert_contains(LAB_PATH, "prefers-reduced-motion: reduce")

    assert_contains(PACKAGE_SOURCE_PATH, "ROUTE_GUARD_TASK_ID")
    assert_contains(PACKAGE_SOURCE_PATH, "resolveRouteGuardDecision")
    assert_contains(PACKAGE_SOURCE_PATH, "useRouteAuthorityGuard")
    assert_contains(PACKAGE_SOURCE_PATH, "RouteGuardSurface")
    assert_contains(PACKAGE_INDEX_PATH, "routeGuardCatalog")
    assert_contains(PACKAGE_TEST_PATH, "keeps a route live")
    assert_contains(PACKAGE_PUBLIC_API_TEST_PATH, 'expect(routeGuardCatalog.taskId).toBe("par_112")')

    if root_package["scripts"].get("validate:route-guard-plumbing") != "python3 ./tools/analysis/validate_route_guard_plumbing.py":
        fail("Root package lost validate:route-guard-plumbing.")
    if ROOT_SCRIPT_UPDATES.get("validate:route-guard-plumbing") != "python3 ./tools/analysis/validate_route_guard_plumbing.py":
        fail("root_script_updates.py lost validate:route-guard-plumbing.")

    for script_name in ["bootstrap", "check"]:
        if "pnpm validate:route-guard-plumbing" not in root_package["scripts"][script_name]:
            fail(f"Root package {script_name} lost route-guard validation.")
        if "pnpm validate:route-guard-plumbing" not in ROOT_SCRIPT_UPDATES[script_name]:
            fail(f"root_script_updates.py {script_name} lost route-guard validation.")

    for script_name in ["build", "lint", "test", "typecheck", "e2e"]:
        script_value = playwright_package["scripts"][script_name]
        needle = "route-guard-and-feature-flags.spec.js"
        if needle not in script_value:
            fail(f"Playwright package {script_name} lost {needle}.")

    assert_contains(SPEC_PATH, "route live/read-only/recovery-only/blocked")
    assert_contains(SPEC_PATH, "Embedded host bridge")
    assert_contains(SPEC_PATH, "prefers-reduced-motion")


if __name__ == "__main__":
    main()
