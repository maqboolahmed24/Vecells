#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import subprocess
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"

CASEBOOK_PATH = DATA_DIR / "lifecycle_coordinator_casebook.json"
MANIFEST_PATH = DATA_DIR / "lineage_fence_epoch_manifest.json"
MATRIX_PATH = DATA_DIR / "lifecycle_signal_contract_matrix.csv"
HTML_PATH = DOCS_DIR / "77_lifecycle_control_center.html"
DESIGN_DOC_PATH = DOCS_DIR / "77_lifecycle_coordinator_service_design.md"
STATE_DOC_PATH = DOCS_DIR / "77_closure_and_reopen_state_machine.md"

REQUIRED_SCENARIOS = {
    "normal_closure",
    "more_info_reopen",
    "booking_confirmation",
    "hub_return_visibility_debt",
    "pharmacy_weak_match",
    "wrong_patient_repair_release",
    "duplicate_review_hold",
    "fallback_review_hold",
    "reachability_repair_hold",
}

REQUIRED_SIGNAL_FAMILIES = {
    "milestone",
    "blocker",
    "confirmation",
    "lease",
    "lineage_case",
    "grant",
    "repair",
    "terminal_outcome",
    "reopen",
}

REQUIRED_DOMAINS = {
    "triage",
    "booking",
    "hub",
    "pharmacy",
    "callback",
    "messaging",
    "support",
    "system",
}

REQUIRED_TEST_IDS = {
    "milestone-ribbon",
    "blocker-lattice",
    "epoch-waterfall",
    "signal-table",
    "closure-table",
    "inspector",
}


def read_json(path: Path) -> Any:
    return json.loads(path.read_text())


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open() as handle:
        return list(csv.DictReader(handle))


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def run_simulation_summary() -> list[dict[str, Any]]:
    command = [
        "pnpm",
        "exec",
        "tsx",
        "--eval",
        (
            'import { runLifecycleCoordinatorSimulation } from "./packages/domains/identity_access/src/index.ts";'
            " void (async () => {"
            " const results = await runLifecycleCoordinatorSimulation();"
            " console.log(JSON.stringify(results.map((entry) => ({"
            " scenarioId: entry.scenarioId,"
            " title: entry.title,"
            " workflowState: entry.request.workflowState,"
            " closureDecisions: entry.closureRecords.map((record) => record.toSnapshot().decision),"
            " reopenCount: entry.reopenRecords.length,"
            " fenceEpoch: entry.fence.currentEpoch"
            " })), null, 2));"
            " })();"
        ),
    ]
    completed = subprocess.run(
        command,
        cwd=ROOT,
        check=True,
        capture_output=True,
        text=True,
    )
    return json.loads(completed.stdout)


def main() -> None:
    for path in [
        CASEBOOK_PATH,
        MANIFEST_PATH,
        MATRIX_PATH,
        HTML_PATH,
        DESIGN_DOC_PATH,
        STATE_DOC_PATH,
    ]:
        require(path.exists(), f"Required lifecycle coordinator artifact is missing: {path}")

    casebook = read_json(CASEBOOK_PATH)
    manifest = read_json(MANIFEST_PATH)
    matrix = read_csv(MATRIX_PATH)
    html = HTML_PATH.read_text()

    require(casebook["task_id"] == "par_077", "Casebook task_id drifted.")
    require(manifest["task_id"] == "par_077", "Fence manifest task_id drifted.")

    casebook_scenarios = {scenario["scenarioId"] for scenario in casebook["scenarios"]}
    require(casebook_scenarios == REQUIRED_SCENARIOS, "Casebook scenario set drifted.")
    require(
        set(manifest["scenarioWaterfalls"].keys()) == REQUIRED_SCENARIOS,
        "Fence manifest scenario waterfalls drifted.",
    )
    require(
        casebook["summary"]["scenario_count"] == len(REQUIRED_SCENARIOS),
        "Casebook scenario count is inconsistent.",
    )
    require(
        casebook["summary"]["signal_count"]
        == sum(len(scenario["signalStream"]) for scenario in casebook["scenarios"]),
        "Casebook signal count is inconsistent.",
    )

    signal_families = {row["signal_family"] for row in matrix}
    source_domains = {row["source_domain"] for row in matrix}
    require(REQUIRED_SIGNAL_FAMILIES.issubset(signal_families), "Signal family coverage drifted.")
    require(REQUIRED_DOMAINS.issubset(source_domains), "Signal domain coverage drifted.")
    require(
        all(row["may_write_request_workflow_directly"] == "no" for row in matrix),
        "A signal contract may now write request workflow directly.",
    )
    require(
        all(row["may_write_request_closed_directly"] == "no" for row in matrix),
        "A signal contract may now close the request directly.",
    )

    simulation_summary = run_simulation_summary()
    summary_by_id = {row["scenarioId"]: row for row in simulation_summary}
    for scenario in casebook["scenarios"]:
        runtime = summary_by_id.get(scenario["scenarioId"])
        require(runtime is not None, f"Runtime simulation is missing {scenario['scenarioId']}.")
        closure_decisions = [row["decision"] for row in scenario["closureHistory"]]
        require(
            runtime["workflowState"] == scenario["currentMilestone"],
            f"Workflow drifted for {scenario['scenarioId']}.",
        )
        require(
            runtime["closureDecisions"] == closure_decisions,
            f"Closure history drifted for {scenario['scenarioId']}.",
        )
        require(
            runtime["reopenCount"] == len(scenario["reopenHistory"]),
            f"Reopen history drifted for {scenario['scenarioId']}.",
        )
        require(
            runtime["fenceEpoch"] == scenario["activeEpoch"],
            f"Fence epoch drifted for {scenario['scenarioId']}.",
        )
        waterfall = manifest["scenarioWaterfalls"][scenario["scenarioId"]]
        require(
            waterfall[-1]["epoch"] == scenario["activeEpoch"],
            f"Waterfall tail epoch drifted for {scenario['scenarioId']}.",
        )

    require("Lifecycle_Control_Center" in html, "Control center mode label missing from HTML.")
    for test_id in REQUIRED_TEST_IDS:
        require(
            f'data-testid="{test_id}"' in html,
            f"Control center HTML is missing data-testid={test_id}.",
        )

    print(
        "Lifecycle coordinator artifacts validated: "
        f"{len(matrix)} signal contracts, {len(casebook['scenarios'])} scenarios, "
        f"{len(manifest['transitionRules'])} fence rules."
    )


if __name__ == "__main__":
    main()
