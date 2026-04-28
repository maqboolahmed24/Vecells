#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]

LOAD_PROFILES = ROOT / "data/performance/168_load_profiles.yaml"
FAULT_MATRIX = ROOT / "data/performance/168_resilience_fault_matrix.csv"
BROWSER_BUDGETS = ROOT / "data/performance/168_browser_budget_targets.json"
SUITE_RESULTS = ROOT / "data/performance/168_suite_results.json"
SUBMISSION_DOC = ROOT / "docs/performance/168_phase1_submission_burst_and_resilience_suite.md"
BACKPRESSURE_DOC = ROOT / "docs/performance/168_capacity_limits_and_backpressure_rules.md"
LAB_HTML = ROOT / "docs/performance/168_burst_resilience_lab.html"
RUNNER = ROOT / "tools/performance/run_phase1_burst_resilience_suite.mjs"
PLAYWRIGHT_SPEC = ROOT / "tests/playwright/168_burst_resilience_lab.spec.js"
ROOT_PACKAGE = ROOT / "package.json"
PLAYWRIGHT_PACKAGE = ROOT / "tests/playwright/package.json"
ROOT_SCRIPT_UPDATES = ROOT / "tools/analysis/root_script_updates.py"

REQUIRED_FAMILIES = {
    "autosave_bursts",
    "submit_bursts_replay_storms",
    "upload_bursts_scan_backlog",
    "projection_lag_read_model_delay",
    "notification_backlog_provider_latency_failure",
    "bounded_storage_queue_cache_failures_service_restarts",
    "runtime_publication_route_freeze_drift",
    "browser_visible_resilience",
}

REQUIRED_HTML_MARKERS = {
    "Burst_Resilience_Lab",
    "throughput_wave_mark",
    "load-profile-ribbon",
    "load-profile-ribbon-table",
    "side-effect-integrity-braid",
    "side-effect-integrity-table",
    "degraded-mode-ladder",
    "degraded-mode-table",
    "metrics-table",
    "fault-table",
    "budget-table",
    "parity-table",
    "prefers-reduced-motion",
    "--masthead-height: 72px",
    "--left-rail-width: 292px",
    "--right-inspector-width: 404px",
    "max-width: 1600px",
}

REQUIRED_SPEC_MARKERS = {
    "mobile",
    "tablet",
    "desktop",
    "reducedMotion",
    "sticky-footer",
    "focus",
    "projection_lag_read_model_delay_168",
    "notification_backlog_provider_delay_168",
    "throughput_wave_mark",
    "parity-table",
    "run_phase1_burst_resilience_suite.mjs",
}


def fail(message: str) -> None:
    raise SystemExit(f"[phase1-performance-suite] {message}")


def require_file(path: Path) -> str:
    if not path.exists():
        fail(f"missing required file: {path.relative_to(ROOT)}")
    return path.read_text(encoding="utf-8")


def load_json(path: Path) -> dict:
    require_file(path)
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as error:
        fail(f"{path.relative_to(ROOT)} is invalid JSON: {error}")


def parse_profiles(text: str) -> list[dict[str, str]]:
    profiles: list[dict[str, str]] = []
    current: dict[str, str] | None = None
    for raw_line in text.splitlines():
        stripped = raw_line.strip()
        if stripped.startswith("- id:"):
            current = {"id": stripped.removeprefix("- id:").strip()}
            profiles.append(current)
        elif current is not None and ":" in stripped and not stripped.startswith("#"):
            key, value = stripped.split(":", 1)
            if key and value.strip():
                current[key.strip()] = value.strip()
    return profiles


def parse_faults(text: str) -> list[dict[str, str]]:
    return list(csv.DictReader(text.splitlines()))


def require_markers(label: str, text: str, markers: set[str]) -> None:
    missing = sorted(marker for marker in markers if marker not in text)
    if missing:
        fail(f"{label} missing markers: {', '.join(missing)}")


def require_false(value: object, label: str) -> None:
    if value is not False:
        fail(f"{label} must be false")


def validate_fixtures() -> tuple[list[dict[str, str]], list[dict[str, str]], dict, dict]:
    profiles = parse_profiles(require_file(LOAD_PROFILES))
    faults = parse_faults(require_file(FAULT_MATRIX))
    budgets = load_json(BROWSER_BUDGETS)
    results = load_json(SUITE_RESULTS)

    if len(profiles) != results["fixtureCounts"]["loadProfiles"]:
        fail("load profile count does not match suite results")
    if len(faults) != results["fixtureCounts"]["faultMatrixRows"]:
        fail("fault matrix row count does not match suite results")

    families = {profile.get("family", "") for profile in profiles}
    missing_families = sorted(REQUIRED_FAMILIES - families)
    if missing_families:
        fail(f"load profiles missing families: {', '.join(missing_families)}")

    fault_families = {fault.get("fault_family", "") for fault in faults}
    missing_fault_families = sorted(REQUIRED_FAMILIES - fault_families)
    if missing_fault_families:
        fail(f"fault matrix missing families: {', '.join(missing_fault_families)}")

    required_profile_fields = {
        "id",
        "family",
        "entrypoint",
        "peak_rps",
        "p95_ms",
        "p99_ms",
        "recovery_seconds",
        "max_duplicate_side_effects",
        "max_false_writable_states",
        "browser_truth",
    }
    for profile in profiles:
        missing = sorted(required_profile_fields - set(profile))
        if missing:
            fail(f"profile {profile.get('id', '<unknown>')} missing fields: {', '.join(missing)}")
        if profile["max_duplicate_side_effects"] != "0":
            fail(f"profile {profile['id']} allows duplicate side effects")
        if profile["max_false_writable_states"] != "0":
            fail(f"profile {profile['id']} allows false writable states")

    for fault in faults:
        if fault.get("parity_row_required") != "yes":
            fail(f"fault {fault.get('fault_id')} does not require parity rows")
        if fault.get("unresolved_defect_rationale") and len(fault["unresolved_defect_rationale"]) < 12:
            fail(f"fault {fault.get('fault_id')} has an unresolved defect without rationale")

    runtime_budgets = budgets.get("runtimeBudgets", {})
    for key in [
        "firstVisibleLabMs",
        "profileSwitchMs",
        "faultInspectorUpdateMs",
        "maxCumulativeLayoutShift",
        "maxDuplicateAuthoritativeSideEffects",
        "maxFalseWritableDegradedStates",
    ]:
        if key not in runtime_budgets:
            fail(f"browser budget missing {key}")
    if len(budgets.get("breakpoints", [])) != results["fixtureCounts"]["browserBreakpoints"]:
        fail("browser breakpoint count does not match suite results")

    invariants = results.get("globalInvariants", {})
    for key in [
        "duplicateAuthoritativeSideEffectsAllowed",
        "calmWritableDuringDegradationAllowed",
        "proseOnlyBudgetsAllowed",
        "visualMeaningWithoutParityTablesAllowed",
        "unresolvedDefectsWithoutRationaleAllowed",
        "prematureNotificationReassuranceAllowed",
        "genericDetachedErrorsAllowed",
    ]:
        require_false(invariants.get(key), f"global invariant {key}")

    for defect in results.get("unresolvedDefects", []):
        if not defect.get("rationale"):
            fail(f"unresolved defect {defect.get('id', '<unknown>')} lacks rationale")

    return profiles, faults, budgets, results


def validate_documents() -> None:
    submission_doc = require_file(SUBMISSION_DOC)
    backpressure_doc = require_file(BACKPRESSURE_DOC)
    for label, text in [
        ("submission suite doc", submission_doc),
        ("capacity/backpressure doc", backpressure_doc),
    ]:
        require_markers(
            label,
            text,
            {
                "exact-once",
                "browser",
                "backpressure",
                "machine-readable",
                "fail",
            },
        )
    require_markers(
        "submission suite doc",
        submission_doc,
        {
            "Duplicate authoritative side effects",
            "calm and writable",
            "Performance budgets exist only in prose",
            "Visual meaning exists without parity tables",
            "Unresolved defects exist without a rationale",
        },
    )


def validate_lab_html() -> None:
    html = require_file(LAB_HTML)
    require_markers("burst resilience lab", html, REQUIRED_HTML_MARKERS)
    forbidden = ["Everything is fine", "Notification sent", "All saved"]
    for phrase in forbidden:
        if phrase in html:
            fail(f"lab uses forbidden reassurance phrase: {phrase}")


def validate_runner() -> None:
    text = require_file(RUNNER)
    require_markers(
        "load runner",
        text,
        {
            "createIntakeSubmitApplication",
            "Promise.all",
            "countSideEffects",
            "duplicateAuthoritativeSideEffects",
            "phase1BurstRunnerTool",
            "exact-once",
            "sameDraftReplayStorm",
        },
    )


def validate_playwright_spec() -> None:
    text = require_file(PLAYWRIGHT_SPEC)
    require_markers("playwright spec", text, REQUIRED_SPEC_MARKERS)


def validate_package_scripts() -> None:
    root_package = load_json(ROOT_PACKAGE)
    scripts = root_package.get("scripts", {})
    expected_script = "python3 ./tools/performance/validate_phase1_performance_suite.py"
    if scripts.get("validate:phase1-performance-suite") != expected_script:
        fail("root package missing validate:phase1-performance-suite script")
    if (
        scripts.get("perf:phase1-burst-resilience")
        != "pnpm exec tsx ./tools/performance/run_phase1_burst_resilience_suite.mjs --assert"
    ):
        fail("root package missing perf:phase1-burst-resilience runner script")
    for chain_name in ["bootstrap", "check"]:
        chain = scripts.get(chain_name, "")
        if "pnpm validate:phase1-channel-accessibility-suite && pnpm validate:phase1-performance-suite" not in chain:
            fail(f"{chain_name} does not run phase1 performance suite after seq_167")

    playwright_package = load_json(PLAYWRIGHT_PACKAGE)
    playwright_scripts = playwright_package.get("scripts", {})
    for script_name in ["build", "lint", "test", "typecheck", "e2e"]:
        if "168_burst_resilience_lab.spec.js" not in playwright_scripts.get(script_name, ""):
            fail(f"tests/playwright {script_name} script missing 168_burst_resilience_lab.spec.js")

    root_script_updates = require_file(ROOT_SCRIPT_UPDATES)
    require_markers(
        "root script update manifest",
        root_script_updates,
        {
            '"validate:phase1-performance-suite"',
            "validate_phase1_performance_suite.py",
            "validate:phase1-channel-accessibility-suite && pnpm validate:phase1-performance-suite",
        },
    )


def main() -> int:
    validate_fixtures()
    validate_documents()
    validate_lab_html()
    validate_runner()
    validate_playwright_spec()
    validate_package_scripts()
    print("Phase 1 performance burst and resilience suite validation passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
