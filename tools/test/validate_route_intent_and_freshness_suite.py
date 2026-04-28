#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "analysis"))

from root_script_updates import ROOT_SCRIPT_UPDATES

DOCS_DIR = ROOT / "docs" / "tests"
DATA_DIR = ROOT / "data" / "test"
PLAYWRIGHT_DIR = ROOT / "tests" / "playwright"

SUITE_DOC_PATH = DOCS_DIR / "134_route_intent_projection_freshness_scoped_mutation_suite.md"
CONTINUITY_DOC_PATH = DOCS_DIR / "134_surface_authority_and_continuity_cases.md"
LAB_PATH = DOCS_DIR / "134_continuity_gate_lab.html"

ROUTE_TUPLE_CASES_PATH = DATA_DIR / "route_intent_tuple_parity_cases.csv"
PROJECTION_CASES_PATH = DATA_DIR / "projection_freshness_cases.csv"
SCOPED_MUTATION_CASES_PATH = DATA_DIR / "scoped_mutation_gate_cases.csv"
SUITE_RESULTS_PATH = DATA_DIR / "continuity_gate_suite_results.json"

ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = PLAYWRIGHT_DIR / "package.json"
ROOT_SCRIPT_UPDATES_PATH = ROOT / "tools" / "analysis" / "root_script_updates.py"
SPEC_PATH = PLAYWRIGHT_DIR / "route-intent-and-freshness-lab.spec.js"

REQUIRED_CASE_FAMILIES = {
    "stale_governing_object_version",
    "stale_identity_binding_or_subject_version",
    "stale_release_publication_runtime_binding",
    "channel_or_embedded_capability_drift",
    "transport_live_but_freshness_not_authoritative",
    "reachability_or_contact_repair_suppresses_mutation",
    "acting_scope_or_break_glass_drift",
    "same_shell_recovery_preserves_selected_anchor",
}


def fail(message: str) -> None:
    print(message, file=sys.stderr)
    raise SystemExit(1)


def assert_exists(path: Path) -> None:
    if not path.exists():
        fail(f"Missing seq_134 artifact: {path}")


def read_json(path: Path):
    assert_exists(path)
    return json.loads(path.read_text(encoding="utf-8"))


def read_csv(path: Path) -> list[dict[str, str]]:
    assert_exists(path)
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def assert_contains(path: Path, fragment: str) -> None:
    assert_exists(path)
    if fragment not in path.read_text(encoding="utf-8"):
        fail(f"{path} is missing required fragment: {fragment}")


def main() -> None:
    for path in [
        SUITE_DOC_PATH,
        CONTINUITY_DOC_PATH,
        LAB_PATH,
        ROUTE_TUPLE_CASES_PATH,
        PROJECTION_CASES_PATH,
        SCOPED_MUTATION_CASES_PATH,
        SUITE_RESULTS_PATH,
        ROOT_PACKAGE_PATH,
        PLAYWRIGHT_PACKAGE_PATH,
        ROOT_SCRIPT_UPDATES_PATH,
        SPEC_PATH,
        Path(__file__),
    ]:
        assert_exists(path)

    route_rows = read_csv(ROUTE_TUPLE_CASES_PATH)
    projection_rows = read_csv(PROJECTION_CASES_PATH)
    mutation_rows = read_csv(SCOPED_MUTATION_CASES_PATH)
    suite_results = read_json(SUITE_RESULTS_PATH)
    root_package = read_json(ROOT_PACKAGE_PATH)
    playwright_package = read_json(PLAYWRIGHT_PACKAGE_PATH)

    if suite_results["task_id"] != "seq_134":
        fail("seq_134 suite drifted off its task id.")
    if suite_results["visual_mode"] != "Continuity_Gate_Lab":
        fail("seq_134 visual mode drifted.")

    summary = suite_results["summary"]
    if summary["route_intent_case_count"] != len(route_rows):
        fail("Route-intent case count drifted from the suite summary.")
    if summary["projection_freshness_case_count"] != len(projection_rows):
        fail("Projection-freshness case count drifted from the suite summary.")
    if summary["scoped_mutation_case_count"] != len(mutation_rows):
        fail("Scoped-mutation case count drifted from the suite summary.")
    if summary["continuity_scenario_count"] != len(suite_results["continuityScenarios"]):
        fail("Continuity scenario count drifted from the suite summary.")

    case_families = {row["caseFamily"] for row in suite_results["continuityScenarios"]}
    if not REQUIRED_CASE_FAMILIES.issubset(case_families):
        fail("seq_134 continuity scenarios lost one or more required case families.")

    if summary["browser_gap_count"] < 2:
        fail("seq_134 must keep explicit browser specimen gaps visible.")

    gap_rows = [row for row in suite_results["continuityScenarios"] if row["browserSpecimenState"] == "gap"]
    gap_refs = {row["gapRef"] for row in gap_rows}
    required_gap_refs = {
        "GAP_BROWSER_SPECIMEN_RF_SUPPORT_TICKET_WORKSPACE",
        "GAP_BROWSER_SPECIMEN_RF_INTAKE_TELEPHONY_CAPTURE",
    }
    if not required_gap_refs.issubset(gap_refs):
        fail("seq_134 lost one or more explicit browser-specimen gap rows.")

    live_but_non_live = [
        row
        for row in projection_rows
        if row["transport_state"] == "live" and row["expected_shell_posture"] != "live"
    ]
    if len(live_but_non_live) < 2:
        fail("seq_134 must prove that live transport is insufficient without fresh truth.")

    if not any(row["ordinary_mutation_state"] == "blocked" for row in mutation_rows):
        fail("seq_134 mutation matrix lost blocked ordinary-mutation coverage.")
    if not any(
        row["case_family"] == "same_shell_recovery_preserves_selected_anchor"
        and row["selected_anchor_disposition"] in {"freeze", "preserve"}
        for row in mutation_rows
    ):
        fail("seq_134 lost same-shell selected-anchor recovery coverage.")

    if not any(
        row["case_family"] == "acting_scope_or_break_glass_drift"
        and row["ordinary_mutation_state"] == "blocked"
        for row in mutation_rows
    ):
        fail("seq_134 lost acting-scope drift blocking coverage.")

    if not any(
        row["case_family"] == "stale_governing_object_version"
        and row["expected_decision"] == "reissue-required"
        for row in route_rows
    ):
        fail("seq_134 lost stale governing-object reissue coverage.")

    if not any(
        row["case_family"] == "transport_live_but_freshness_not_authoritative"
        and row["transport_live_insufficient"] == "yes"
        for row in projection_rows
    ):
        fail("seq_134 lost the explicit live-is-not-fresh assertion.")

    assert_contains(SUITE_DOC_PATH, "transport-live but non-live-actionability cases")
    assert_contains(CONTINUITY_DOC_PATH, "Explicit Browser Gaps")
    assert_contains(LAB_PATH, 'data-testid="continuity-gate-lab"')
    assert_contains(LAB_PATH, 'data-testid="route-intent-lattice"')
    assert_contains(LAB_PATH, 'data-testid="freshness-ladder"')
    assert_contains(LAB_PATH, 'data-testid="mutation-braid"')
    assert_contains(LAB_PATH, "prefers-reduced-motion: reduce")
    assert_contains(SPEC_PATH, "selected-anchor preservation")
    assert_contains(SPEC_PATH, "live-vs-fresh distinction")
    assert_contains(SPEC_PATH, "blocked/widened mutation behavior")

    expected_validate_script = "python3 ./tools/test/validate_route_intent_and_freshness_suite.py"
    if root_package["scripts"].get("validate:route-intent-freshness-suite") != expected_validate_script:
        fail("Root package lost validate:route-intent-freshness-suite.")
    if ROOT_SCRIPT_UPDATES.get("validate:route-intent-freshness-suite") != expected_validate_script:
        fail("root_script_updates.py lost validate:route-intent-freshness-suite.")

    build_script = root_package["scripts"]["codegen"]
    if "python3 ./tools/analysis/build_route_intent_and_freshness_suite.py" not in build_script:
        fail("Root package codegen lost the seq_134 builder.")
    if "python3 ./tools/analysis/build_route_intent_and_freshness_suite.py" not in ROOT_SCRIPT_UPDATES["codegen"]:
        fail("root_script_updates.py codegen lost the seq_134 builder.")

    for script_name in ["bootstrap", "check"]:
        if "pnpm validate:route-intent-freshness-suite" not in root_package["scripts"][script_name]:
            fail(f"Root package {script_name} lost seq_134 validation.")
        if "pnpm validate:route-intent-freshness-suite" not in ROOT_SCRIPT_UPDATES[script_name]:
            fail(f"root_script_updates.py {script_name} lost seq_134 validation.")

    needle = "route-intent-and-freshness-lab.spec.js"
    for script_name in ["build", "lint", "test", "typecheck", "e2e"]:
        if needle not in playwright_package["scripts"][script_name]:
            fail(f"Playwright package {script_name} lost {needle}.")

    print(
        json.dumps(
            {
                "task_id": "seq_134",
                "continuity_scenarios": summary["continuity_scenario_count"],
                "browser_gaps": summary["browser_gap_count"],
                "live_not_fresh_cases": summary["transport_live_but_non_live_actionability_count"],
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
