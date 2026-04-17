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
TESTS_DIR = ROOT / "tests" / "playwright"
TOOLS_DIR = ROOT / "tools" / "analysis"

CASEBOOK_PATH = DATA_DIR / "reservation_queue_casebook.json"
MATRIX_PATH = DATA_DIR / "queue_rank_snapshot_matrix.csv"
MANIFEST_PATH = DATA_DIR / "reservation_fence_manifest.json"
DESIGN_DOC_PATH = DOCS_DIR / "81_reservation_authority_and_queue_ranking_design.md"
RULES_DOC_PATH = DOCS_DIR / "81_reservation_truth_and_queue_fairness_rules.md"
HTML_PATH = DOCS_DIR / "81_reservation_queue_control_studio.html"
SPEC_PATH = TESTS_DIR / "reservation-queue-control-studio.spec.js"
BUILDER_PATH = TOOLS_DIR / "build_reservation_authority_and_queue_ranking.py"
ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = TESTS_DIR / "package.json"
ROOT_SCRIPT_UPDATES_PATH = TOOLS_DIR / "root_script_updates.py"
DOMAIN_SOURCE_PATH = (
    ROOT / "packages" / "domains" / "identity_access" / "src" / "reservation-queue-control-backbone.ts"
)
DOMAIN_TEST_PATH = (
    ROOT / "packages" / "domains" / "identity_access" / "tests" / "reservation-queue-control-backbone.test.ts"
)
SERVICE_SOURCE_PATH = ROOT / "services" / "command-api" / "src" / "reservation-queue-control.ts"
SERVICE_TEST_PATH = (
    ROOT / "services" / "command-api" / "tests" / "reservation-queue-control.integration.test.js"
)
MIGRATION_PATH = (
    ROOT / "services" / "command-api" / "migrations" / "081_reservation_authority_and_queue_ranking_coordinator.sql"
)
PLAYWRIGHT_PACKAGE_BUILDER = TOOLS_DIR / "build_parallel_foundation_tracks_gate.py"

EXPECTED_GENERATED_AT = "2026-04-12T00:00:00+00:00"
EXPECTED_CAPTURED_ON = "2026-04-12"

REQUIRED_RESERVATION_SCENARIOS = {
    "soft_selected_supply_no_exclusive_hold",
    "real_held_reservation_with_expiry_and_revalidation",
    "pending_confirmation_requires_truthful_nonfinal_copy",
    "overlapping_local_and_hub_claims_same_key",
}

REQUIRED_QUEUE_SCENARIOS = {
    "fair_queue_normal_load_commits_snapshot",
    "overload_queue_pressure_escalated",
    "fairness_merge_rotates_routine_bands",
    "assignment_suggestions_preserve_base_queue",
    "next_task_advice_blocked_on_stale_owner",
}

REQUIRED_GAPS = {
    "PARALLEL_INTERFACE_GAP_081_LIVE_SUPPLIER_HOLD_FEED",
    "PARALLEL_INTERFACE_GAP_081_HUB_CONTENTION_SIGNAL_PORT",
    "PARALLEL_INTERFACE_GAP_081_WORKBENCH_NEXT_TASK_LAUNCH_PORT",
}

REQUIRED_EVENTS = {
    "reservation.claimed",
    "reservation.released",
    "reservation.hold_expired",
    "queue.rank_snapshot.committed",
    "queue.assignment_suggestion.refreshed",
    "queue.fairness_merge.changed",
    "queue.pressure.escalated",
}

REQUIRED_TEST_IDS = {
    "filter-reservation-state",
    "filter-queue",
    "filter-fairness-mode",
    "filter-actor",
    "fence-timeline",
    "fairness-heat-surface",
    "advisory-strip",
    "reservation-table",
    "queue-table",
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


def run_runtime_simulation() -> list[dict[str, Any]]:
    command = [
        "pnpm",
        "exec",
        "tsx",
        "--eval",
        (
            'import { runReservationQueueControlSimulation } from "./packages/domains/identity_access/src/index.ts";'
            " void (async () => {"
            " const scenarios = await runReservationQueueControlSimulation();"
            " console.log(JSON.stringify(scenarios.map((scenario) => ({"
            " scenarioId: scenario.scenarioId,"
            " reservationState: scenario.reservation?.toSnapshot().state ?? null,"
            " truthState: scenario.projection?.toSnapshot().truthState ?? null,"
            " fenceState: scenario.fence?.toSnapshot().state ?? null,"
            " overloadState: scenario.queueCommit?.toSnapshot().overloadState ?? null,"
            " fairnessMergeState: scenario.queueCommit?.toSnapshot().fairnessMergeState ?? null,"
            " advisoryState: scenario.advisory?.toSnapshot().advisoryState ?? null,"
            " nextTaskRefs: scenario.advisory?.toSnapshot().nextTaskRefs ?? [],"
            " eventNames: scenario.eventNames"
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
        MATRIX_PATH,
        MANIFEST_PATH,
        DESIGN_DOC_PATH,
        RULES_DOC_PATH,
        HTML_PATH,
        SPEC_PATH,
        BUILDER_PATH,
        ROOT_PACKAGE_PATH,
        PLAYWRIGHT_PACKAGE_PATH,
        ROOT_SCRIPT_UPDATES_PATH,
        DOMAIN_SOURCE_PATH,
        DOMAIN_TEST_PATH,
        SERVICE_SOURCE_PATH,
        SERVICE_TEST_PATH,
        MIGRATION_PATH,
        PLAYWRIGHT_PACKAGE_BUILDER,
    ]:
        require(path.exists(), f"Missing par_081 artifact: {path}")

    casebook = read_json(CASEBOOK_PATH)
    matrix = read_csv(MATRIX_PATH)
    manifest = read_json(MANIFEST_PATH)
    root_package = read_json(ROOT_PACKAGE_PATH)
    playwright_package = read_json(PLAYWRIGHT_PACKAGE_PATH)

    require(casebook["task_id"] == "par_081", "Casebook task_id drifted.")
    require(casebook["generated_at"] == EXPECTED_GENERATED_AT, "Casebook generated_at drifted.")
    require(casebook["captured_on"] == EXPECTED_CAPTURED_ON, "Casebook captured_on drifted.")
    require(casebook["mode"] == "Reservation_Queue_Control_Studio", "Casebook mode drifted.")
    require(manifest["task_id"] == "par_081", "Manifest task_id drifted.")
    require(manifest["generated_at"] == EXPECTED_GENERATED_AT, "Manifest generated_at drifted.")
    require(manifest["captured_on"] == EXPECTED_CAPTURED_ON, "Manifest captured_on drifted.")
    require(manifest["mode"] == "Reservation_Queue_Control_Studio", "Manifest mode drifted.")

    reservation_ids = {entry["scenarioId"] for entry in casebook["reservationCases"]}
    queue_ids = {entry["scenarioId"] for entry in casebook["queueCases"]}
    require(reservation_ids == REQUIRED_RESERVATION_SCENARIOS, "Reservation scenario set drifted.")
    require(queue_ids == REQUIRED_QUEUE_SCENARIOS, "Queue scenario set drifted.")
    require(casebook["summary"]["scenario_count"] == 9, "Scenario count drifted.")
    require(
        casebook["summary"]["reservation_scenario_count"] == len(casebook["reservationCases"]),
        "Reservation scenario summary count drifted.",
    )
    require(
        casebook["summary"]["queue_scenario_count"] == len(casebook["queueCases"]),
        "Queue scenario summary count drifted.",
    )
    require(
        casebook["summary"]["active_hold_count"]
        == sum(1 for entry in casebook["reservationCases"] if entry["reservationState"] == "held"),
        "Active hold summary count drifted.",
    )
    require(
        casebook["summary"]["pending_confirmation_count"]
        == sum(
            1 for entry in casebook["reservationCases"] if entry["reservationState"] == "pending_confirmation"
        ),
        "Pending confirmation summary count drifted.",
    )
    require(
        casebook["summary"]["overload_critical_count"]
        == sum(1 for entry in casebook["queueCases"] if entry["overloadState"] == "overload_critical"),
        "Overload summary count drifted.",
    )
    require(
        casebook["summary"]["conflict_blocked_count"]
        == sum(1 for entry in casebook["reservationCases"] if entry["fenceState"] == "conflict_blocked"),
        "Conflict-blocked summary count drifted.",
    )
    require(
        casebook["summary"]["assignment_ready_count"]
        == sum(1 for entry in casebook["queueCases"] if entry["advisoryState"] == "ready"),
        "Assignment-ready summary count drifted.",
    )
    require(
        casebook["summary"]["next_task_blocked_count"]
        == sum(
            1
            for entry in casebook["queueCases"]
            if isinstance(entry["advisoryState"], str) and entry["advisoryState"].startswith("blocked")
        ),
        "Next-task blocked summary count drifted.",
    )

    require(set(manifest["parallel_interface_gaps"]) == REQUIRED_GAPS, "Parallel interface gaps drifted.")
    require(
        {entry["eventName"] for entry in manifest["canonical_events"]} == REQUIRED_EVENTS,
        "Canonical event set drifted.",
    )
    require(manifest["summary"]["matrix_row_count"] == len(matrix), "Matrix row count drifted.")
    require(
        manifest["summary"]["canonical_event_count"] == len(manifest["canonical_events"]),
        "Canonical event summary count drifted.",
    )
    require(
        manifest["summary"]["parallel_interface_gap_count"] == len(manifest["parallel_interface_gaps"]),
        "Parallel interface gap summary count drifted.",
    )

    matrix_scenarios = {row["scenario_id"] for row in matrix}
    require(matrix_scenarios == REQUIRED_QUEUE_SCENARIOS, "Queue matrix scenario coverage drifted.")

    design_doc = DESIGN_DOC_PATH.read_text()
    for marker in [
        "## Core law",
        "`ReservationAuthority` is the only serializer",
        "## Control records",
        "## Persistence and simulator",
    ]:
        require(marker in design_doc, f"Design doc is missing marker: {marker}")

    rules_doc = RULES_DOC_PATH.read_text()
    for marker in [
        "## Reservation truth",
        "`soft_selected` is not exclusivity.",
        "## Queue fairness",
        "## Next-task discipline",
    ]:
        require(marker in rules_doc, f"Rules doc is missing marker: {marker}")

    html = HTML_PATH.read_text()
    require("Reservation_Queue_Control_Studio" in html, "Studio mode label is missing from HTML.")
    for test_id in REQUIRED_TEST_IDS:
      require(f'data-testid="{test_id}"' in html, f"HTML is missing data-testid={test_id}.")

    spec_source = SPEC_PATH.read_text()
    for probe in [
        "filtering and synchronized selection behavior",
        "keyboard navigation and focus order",
        "reduced-motion handling",
        "responsive layout at desktop and tablet widths",
        "accessibility smoke checks and landmark verification",
    ]:
        require(probe in spec_source, f"Spec is missing coverage text: {probe}")

    root_script_updates = ROOT_SCRIPT_UPDATES_PATH.read_text()
    require(
        "validate:reservation-queue-control" in root_script_updates
        and "validate_reservation_authority_and_queue_ranking.py" in root_script_updates,
        "root_script_updates.py is missing the par_081 validator wiring.",
    )
    require(
        "build_reservation_authority_and_queue_ranking.py" in root_script_updates,
        "root_script_updates.py is missing the par_081 builder wiring.",
    )

    root_scripts = root_package["scripts"]
    require(
        "build_reservation_authority_and_queue_ranking.py" in root_scripts["codegen"],
        "Root codegen script is missing build_reservation_authority_and_queue_ranking.py.",
    )
    require(
        root_scripts["validate:reservation-queue-control"]
        == "python3 ./tools/analysis/validate_reservation_authority_and_queue_ranking.py",
        "Root validate:reservation-queue-control script drifted.",
    )
    require(
        "pnpm validate:reservation-queue-control" in root_scripts["bootstrap"]
        and "pnpm validate:reservation-queue-control" in root_scripts["check"],
        "Root bootstrap/check scripts are missing par_081 validator wiring.",
    )

    playwright_scripts = playwright_package["scripts"]
    for key in ["build", "lint", "test", "typecheck", "e2e"]:
        require(
            "reservation-queue-control-studio.spec.js" in playwright_scripts[key],
            f"Playwright package script {key} is missing reservation-queue-control-studio.spec.js.",
        )

    require(
        "reservation-queue-control-studio.spec.js" in PLAYWRIGHT_PACKAGE_BUILDER.read_text(),
        "build_parallel_foundation_tracks_gate.py is missing the par_081 Playwright spec.",
    )

    domain_source = DOMAIN_SOURCE_PATH.read_text()
    for token in [
        "export class ReservationAuthority",
        "export class QueueRankingCoordinator",
        "reservationQueueCanonicalEventEntries",
        "reservationQueueParallelInterfaceGaps",
        "createReservationQueueSimulationHarness",
    ]:
        require(token in domain_source, f"Domain source is missing required token: {token}")

    service_source = SERVICE_SOURCE_PATH.read_text()
    for token in [
        "createReservationQueueControlApplication",
        "reservationQueueControlMigrationPlanRefs",
        "reservationQueueControlPersistenceTables",
    ]:
        require(token in service_source, f"Command API source is missing required token: {token}")

    migration_source = MIGRATION_PATH.read_text().lower()
    for token in [
        "create table if not exists reservation_fence_records",
        "create table if not exists queue_snapshot_commit_records",
        "create table if not exists queue_pressure_escalation_records",
        "create table if not exists next_task_advisory_snapshots",
    ]:
        require(token in migration_source, f"Migration is missing token: {token}")

    runtime = run_runtime_simulation()
    require(len(runtime) == 9, "Runtime simulation should publish 9 scenarios.")
    runtime_by_id = {entry["scenarioId"]: entry for entry in runtime}
    require(
        runtime_by_id["soft_selected_supply_no_exclusive_hold"]["truthState"] == "truthful_nonexclusive",
        "Soft-selected runtime truth drifted.",
    )
    require(
        runtime_by_id["real_held_reservation_with_expiry_and_revalidation"]["truthState"] == "exclusive_held",
        "Held runtime truth drifted.",
    )
    require(
        runtime_by_id["pending_confirmation_requires_truthful_nonfinal_copy"]["truthState"] == "pending_confirmation",
        "Pending-confirmation runtime truth drifted.",
    )
    require(
        runtime_by_id["overlapping_local_and_hub_claims_same_key"]["fenceState"] == "conflict_blocked",
        "Overlapping-claim runtime fence state drifted.",
    )
    require(
        runtime_by_id["overload_queue_pressure_escalated"]["overloadState"] == "overload_critical",
        "Overload runtime posture drifted.",
    )
    require(
        runtime_by_id["assignment_suggestions_preserve_base_queue"]["advisoryState"] == "ready",
        "Assignment-ready runtime posture drifted.",
    )
    require(
        runtime_by_id["next_task_advice_blocked_on_stale_owner"]["advisoryState"] == "blocked_stale_owner",
        "Blocked next-task runtime posture drifted.",
    )
    runtime_events = {event for entry in runtime for event in entry["eventNames"]}
    require(REQUIRED_EVENTS.issubset(runtime_events), "Runtime event coverage drifted.")

    print("par_081 reservation authority and queue ranking validation passed")


if __name__ == "__main__":
    main()
