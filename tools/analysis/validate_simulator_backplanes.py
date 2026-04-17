#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"
SERVICE_DIR = ROOT / "services" / "adapter-simulators"
TESTS_DIR = ROOT / "tests" / "playwright"

MANIFEST_PATH = DATA_DIR / "simulator_contract_manifest.json"
CASEBOOK_PATH = DATA_DIR / "provider_behavior_casebook.json"
CUTOVER_PATH = DATA_DIR / "mock_to_live_cutover_checklist.csv"
HTML_PATH = DOCS_DIR / "83_simulator_backplane_control_deck.html"
DOC_PATH = DOCS_DIR / "83_simulator_backplane_design.md"
CUTOVER_DOC_PATH = DOCS_DIR / "83_mock_now_vs_actual_provider_cutover_strategy.md"
COMPOSE_PATH = SERVICE_DIR / "manifests" / "docker-compose.yaml"
SERVICE_ENTRY_PATH = SERVICE_DIR / "src" / "index.ts"
RUNTIME_PATH = SERVICE_DIR / "src" / "backplane.ts"
SDK_PATH = SERVICE_DIR / "src" / "sdk-clients.ts"
TEST_PATH = SERVICE_DIR / "tests" / "backplane.test.ts"
DECK_SPEC_PATH = TESTS_DIR / "simulator-backplane-control-deck.spec.js"
FLOW_SPEC_PATH = TESTS_DIR / "simulator-end-to-end-flows.spec.js"

REQUIRED_FAMILIES = {"nhs_login", "im1_gp", "mesh", "telephony", "notifications"}
REQUIRED_HTML_MARKERS = {
    "control-deck-shell",
    "topology-diagram",
    "seed-strip",
    "event-timeline",
    "simulator-table",
    "scenario-table",
    "inspector",
}


def read_json(path: Path):
    return json.loads(path.read_text())


def read_csv(path: Path):
    with path.open() as handle:
        return list(csv.DictReader(handle))


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def main() -> None:
    manifest = read_json(MANIFEST_PATH)
    casebook = read_json(CASEBOOK_PATH)
    cutover_rows = read_csv(CUTOVER_PATH)
    html = HTML_PATH.read_text()

    require(manifest["task_id"] == "par_083", "Simulator contract manifest task_id drifted.")
    require(casebook["task_id"] == "par_083", "Provider behavior casebook task_id drifted.")
    require(set(row["family"] for row in manifest["families"]) == REQUIRED_FAMILIES, "Manifest family coverage drifted.")
    require(set(row["family"] for row in cutover_rows) == REQUIRED_FAMILIES, "Cutover checklist family coverage drifted.")
    require(len(manifest["scenario_seeds"]) >= 6, "Scenario seed coverage drifted below the required floor.")
    require(manifest["summary"]["family_count"] == 5, "Manifest family count drifted.")
    require(manifest["summary"]["scenario_seed_count"] >= 6, "Manifest scenario seed count drifted.")
    require(manifest["parallel_interface_gaps"], "Parallel interface gap record was lost.")

    for family in manifest["families"]:
        require(family["adapter_contract_profile_ref"], f"{family['family']} lost adapter contract profile binding.")
        require(family["simulator_contract_ref"], f"{family['family']} lost simulator contract ref.")
        require(family["route_family_refs"], f"{family['family']} lost route family bindings.")
        require(family["replay_classes"], f"{family['family']} lost replay classes.")
        require(family["callback_timing_classes"], f"{family['family']} lost callback timing classes.")
        require(family["evidence_shapes"], f"{family['family']} lost evidence shapes.")
        actual_later = family["actual_provider_strategy_later"]
        require(actual_later["swap_boundary"], f"{family['family']} lost swap boundary guidance.")
        require(actual_later["secret_classes"], f"{family['family']} lost secret classes.")
        require(
            actual_later["semantic_preservation_rules"],
            f"{family['family']} lost semantic preservation rules.",
        )

    require(casebook["personas"], "Casebook lost personas.")
    require(casebook["gp_sites"], "Casebook lost GP sites.")
    require(casebook["booking_flows"], "Casebook lost booking flows.")
    require(casebook["mailbox_messages"], "Casebook lost mailbox messages.")
    require(casebook["call_sessions"], "Casebook lost call sessions.")
    require(casebook["recordings"], "Casebook lost recordings.")
    require(casebook["transcripts"], "Casebook lost transcripts.")
    require(casebook["notification_outcomes"], "Casebook lost notification outcomes.")
    require(casebook["delivery_disputes"], "Casebook lost delivery disputes.")
    require(casebook["cross_simulator_flows"], "Casebook lost cross-simulator flows.")

    for marker in REQUIRED_HTML_MARKERS:
        require(marker in html, f"Control deck lost required data-testid marker {marker}.")

    for path in [
        DOC_PATH,
        CUTOVER_DOC_PATH,
        HTML_PATH,
        COMPOSE_PATH,
        SERVICE_ENTRY_PATH,
        RUNTIME_PATH,
        SDK_PATH,
        TEST_PATH,
        DECK_SPEC_PATH,
        FLOW_SPEC_PATH,
    ]:
        require(path.exists(), f"Required simulator artifact missing: {path}")

    print("par_083 simulator backplanes validation passed")


if __name__ == "__main__":
    main()
