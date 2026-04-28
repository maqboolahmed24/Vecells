#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"
TESTS_DIR = ROOT / "tests" / "playwright"
TOOLS_DIR = ROOT / "tools" / "analysis"
INFRA_DIR = ROOT / "infra" / "event-spine"
DOMAIN_KERNEL_DIR = ROOT / "packages" / "domain-kernel"
COMMAND_API_DIR = ROOT / "services" / "command-api"

BROKER_MANIFEST_PATH = DATA_DIR / "event_broker_topology_manifest.json"
POLICY_MATRIX_PATH = DATA_DIR / "outbox_inbox_policy_matrix.csv"
TRANSPORT_MAPPING_PATH = DATA_DIR / "canonical_event_to_transport_mapping.json"
EVENT_REGISTRY_PATH = DATA_DIR / "canonical_event_contracts.json"
RUNTIME_TOPOLOGY_PATH = DATA_DIR / "runtime_topology_manifest.json"

DESIGN_DOC_PATH = DOCS_DIR / "87_event_spine_and_queueing_design.md"
RULES_DOC_PATH = DOCS_DIR / "87_outbox_inbox_ordering_and_correlation_rules.md"
ATLAS_PATH = DOCS_DIR / "87_event_spine_topology_atlas.html"
SPEC_PATH = TESTS_DIR / "event-spine-topology-atlas.spec.js"

BUILD_SCRIPT_PATH = TOOLS_DIR / "build_event_spine_and_queueing.py"
ROOT_SCRIPT_UPDATES_PATH = TOOLS_DIR / "root_script_updates.py"
PLAYWRIGHT_BUILDER_PATH = TOOLS_DIR / "build_parallel_foundation_tracks_gate.py"
ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = TESTS_DIR / "package.json"

README_PATH = INFRA_DIR / "README.md"
TERRAFORM_MAIN_PATH = INFRA_DIR / "terraform" / "main.tf"
TERRAFORM_VARIABLES_PATH = INFRA_DIR / "terraform" / "variables.tf"
TERRAFORM_OUTPUTS_PATH = INFRA_DIR / "terraform" / "outputs.tf"
BROKER_MODULE_MAIN_PATH = INFRA_DIR / "terraform" / "modules" / "broker_namespace" / "main.tf"
BROKER_MODULE_VARIABLES_PATH = (
    INFRA_DIR / "terraform" / "modules" / "broker_namespace" / "variables.tf"
)
BROKER_MODULE_OUTPUTS_PATH = (
    INFRA_DIR / "terraform" / "modules" / "broker_namespace" / "outputs.tf"
)
SUBSCRIPTION_MODULE_MAIN_PATH = (
    INFRA_DIR / "terraform" / "modules" / "subscription_group" / "main.tf"
)
SUBSCRIPTION_MODULE_VARIABLES_PATH = (
    INFRA_DIR / "terraform" / "modules" / "subscription_group" / "variables.tf"
)
SUBSCRIPTION_MODULE_OUTPUTS_PATH = (
    INFRA_DIR / "terraform" / "modules" / "subscription_group" / "outputs.tf"
)
ENVIRONMENT_FILE_PATHS = [
    INFRA_DIR / "environments" / "local.auto.tfvars.json",
    INFRA_DIR / "environments" / "ci-preview.auto.tfvars.json",
    INFRA_DIR / "environments" / "integration.auto.tfvars.json",
    INFRA_DIR / "environments" / "preprod.auto.tfvars.json",
    INFRA_DIR / "environments" / "production.auto.tfvars.json",
]
LOCAL_COMPOSE_PATH = INFRA_DIR / "local" / "event-spine-emulator.compose.yaml"
LOCAL_POLICY_PATH = INFRA_DIR / "local" / "broker-access-policy.json"
LOCAL_BOOTSTRAP_PATH = INFRA_DIR / "local" / "bootstrap-event-spine.mjs"
LOCAL_RESET_PATH = INFRA_DIR / "local" / "reset-event-spine.mjs"
SMOKE_TEST_PATH = INFRA_DIR / "tests" / "event-spine-smoke.test.mjs"

DOMAIN_KERNEL_SOURCE_PATH = DOMAIN_KERNEL_DIR / "src" / "event-spine.ts"
DOMAIN_KERNEL_INDEX_PATH = DOMAIN_KERNEL_DIR / "src" / "index.ts"
DOMAIN_KERNEL_TEST_PATH = DOMAIN_KERNEL_DIR / "tests" / "event-spine.test.ts"
COMMAND_API_SOURCE_PATH = COMMAND_API_DIR / "src" / "event-spine.ts"
COMMAND_API_TEST_PATH = COMMAND_API_DIR / "tests" / "event-spine.integration.test.js"
COMMAND_API_MIGRATION_PATH = COMMAND_API_DIR / "migrations" / "087_event_spine_outbox_inbox.sql"

HTML_MARKERS = [
    'data-testid="river-diagram"',
    'data-testid="queue-chart"',
    'data-testid="trace-strip"',
    'data-testid="topology-table"',
    'data-testid="checkpoint-table"',
    'data-testid="inspector"',
]

SPEC_MARKERS = [
    "filter behavior and synchronized selection",
    "keyboard navigation and focus management",
    "reduced-motion handling",
    "responsive layout at desktop and tablet widths",
    "accessibility smoke checks and landmark verification",
    "verification that DLQ or quarantine routes remain visibly distinct from ordinary delivery",
]

EXPECTED_QUEUE_REFS = {
    "q_event_projection_live",
    "q_event_projection_replay",
    "q_event_integration_effects",
    "q_event_notification_effects",
    "q_event_callback_correlation",
    "q_event_assurance_audit",
    "q_event_replay_quarantine",
}


def fail(message: str) -> None:
    raise SystemExit(message)


def require(condition: bool, message: str) -> None:
    if not condition:
        fail(message)


def read_json(path: Path):
    require(path.exists(), f"Missing JSON artifact: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def read_csv(path: Path) -> list[dict[str, str]]:
    require(path.exists(), f"Missing CSV artifact: {path}")
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def assert_contains(path: Path, needle: str) -> None:
    source = path.read_text(encoding="utf-8")
    require(needle in source, f"{path} is missing required token: {needle}")


def main() -> None:
    required_paths = [
        BROKER_MANIFEST_PATH,
        POLICY_MATRIX_PATH,
        TRANSPORT_MAPPING_PATH,
        EVENT_REGISTRY_PATH,
        RUNTIME_TOPOLOGY_PATH,
        DESIGN_DOC_PATH,
        RULES_DOC_PATH,
        ATLAS_PATH,
        SPEC_PATH,
        BUILD_SCRIPT_PATH,
        ROOT_SCRIPT_UPDATES_PATH,
        PLAYWRIGHT_BUILDER_PATH,
        ROOT_PACKAGE_PATH,
        PLAYWRIGHT_PACKAGE_PATH,
        README_PATH,
        TERRAFORM_MAIN_PATH,
        TERRAFORM_VARIABLES_PATH,
        TERRAFORM_OUTPUTS_PATH,
        BROKER_MODULE_MAIN_PATH,
        BROKER_MODULE_VARIABLES_PATH,
        BROKER_MODULE_OUTPUTS_PATH,
        SUBSCRIPTION_MODULE_MAIN_PATH,
        SUBSCRIPTION_MODULE_VARIABLES_PATH,
        SUBSCRIPTION_MODULE_OUTPUTS_PATH,
        LOCAL_COMPOSE_PATH,
        LOCAL_POLICY_PATH,
        LOCAL_BOOTSTRAP_PATH,
        LOCAL_RESET_PATH,
        SMOKE_TEST_PATH,
        DOMAIN_KERNEL_SOURCE_PATH,
        DOMAIN_KERNEL_INDEX_PATH,
        DOMAIN_KERNEL_TEST_PATH,
        COMMAND_API_SOURCE_PATH,
        COMMAND_API_TEST_PATH,
        COMMAND_API_MIGRATION_PATH,
        *ENVIRONMENT_FILE_PATHS,
    ]
    for path in required_paths:
        require(path.exists(), f"Missing par_087 artifact: {path}")

    broker_manifest = read_json(BROKER_MANIFEST_PATH)
    mapping_payload = read_json(TRANSPORT_MAPPING_PATH)
    event_registry = read_json(EVENT_REGISTRY_PATH)
    runtime_topology = read_json(RUNTIME_TOPOLOGY_PATH)
    policy_rows = read_csv(POLICY_MATRIX_PATH)

    require(broker_manifest["task_id"] == "par_087", "Broker manifest task id drifted.")
    require(broker_manifest["visual_mode"] == "Event_Spine_Topology_Atlas", "Broker manifest visual mode drifted.")
    require(mapping_payload["task_id"] == "par_087", "Transport mapping task id drifted.")
    require(
        broker_manifest["summary"]["transport_mapping_count"]
        == event_registry["summary"]["active_contract_count"],
        "Transport mappings no longer cover every canonical event contract.",
    )
    require(
        broker_manifest["summary"]["namespace_count"]
        == event_registry["summary"]["namespace_count"],
        "Namespace stream coverage drifted.",
    )
    require(
        broker_manifest["summary"]["queue_group_count"] == len(EXPECTED_QUEUE_REFS),
        "Queue group count drifted.",
    )
    require(
        broker_manifest["summary"]["policy_count"] == len(policy_rows),
        "Policy row count drifted.",
    )
    require(
        broker_manifest["summary"]["subscription_count"]
        == len(broker_manifest["subscriptionBindings"]),
        "Subscription summary drifted.",
    )

    queue_group_refs = {row["queueRef"] for row in broker_manifest["queueGroups"]}
    require(queue_group_refs == EXPECTED_QUEUE_REFS, f"Queue refs drifted: {queue_group_refs}")
    require(
        all(row["routingSubject"] == row["eventName"] for row in mapping_payload["transportMappings"]),
        "Canonical event subjects no longer match canonical event names.",
    )
    require(
        all(row["queueRefs"] for row in mapping_payload["transportMappings"]),
        "A transport mapping lost its queue routes.",
    )
    require(
        all(row["edgeCorrelationRequired"] and row["causalTokenRequired"] for row in mapping_payload["transportMappings"]),
        "Canonical envelope requirements drifted from the transport mapping.",
    )
    require(
        sum(1 for row in mapping_payload["transportMappings"] if row["eventState"] == "watch_or_review")
        == broker_manifest["summary"]["watch_or_review_event_count"],
        "Watch-event summary drifted.",
    )

    policy_refs = {row["policy_ref"] for row in policy_rows}
    require("OP_087_COMMAND_CANONICAL_OUTBOX" in policy_refs, "Command outbox policy missing.")
    require("IP_087_CALLBACK_RECEIPT_INBOX" in policy_refs, "Callback inbox policy missing.")
    require(
        all(row["queue_ref"] in EXPECTED_QUEUE_REFS for row in policy_rows),
        "A policy references an unknown queue.",
    )

    runtime_queue_refs = {row["queue_ref"] for row in runtime_topology["queue_catalog"]}
    require(EXPECTED_QUEUE_REFS.issubset(runtime_queue_refs), "Runtime topology lost par_087 queue refs.")
    require(
        runtime_topology["event_broker_topology_manifest_ref"]
        == "data/analysis/event_broker_topology_manifest.json",
        "Runtime topology lost broker manifest ref.",
    )
    require(
        runtime_topology["outbox_inbox_policy_matrix_ref"]
        == "data/analysis/outbox_inbox_policy_matrix.csv",
        "Runtime topology lost policy matrix ref.",
    )
    require(
        runtime_topology["canonical_event_to_transport_mapping_ref"]
        == "data/analysis/canonical_event_to_transport_mapping.json",
        "Runtime topology lost transport mapping ref.",
    )
    require(
        all(EXPECTED_QUEUE_REFS.issubset(set(row["queue_refs"])) for row in runtime_topology["environment_manifests"]),
        "An environment manifest lost the par_087 queue refs.",
    )

    for needle in HTML_MARKERS:
        assert_contains(ATLAS_PATH, needle)
    for needle in SPEC_MARKERS:
        assert_contains(SPEC_PATH, needle)

    assert_contains(DESIGN_DOC_PATH, "Queue Groups")
    assert_contains(RULES_DOC_PATH, "Non-negotiable Rules")
    assert_contains(DOMAIN_KERNEL_INDEX_PATH, 'export * from "./event-spine";')
    assert_contains(DOMAIN_KERNEL_SOURCE_PATH, "runEventSpineSimulationScenarios")
    assert_contains(COMMAND_API_SOURCE_PATH, "createEventSpineApplication")
    assert_contains(COMMAND_API_MIGRATION_PATH, "event_outbox_entries")
    assert_contains(LOCAL_POLICY_PATH, '"browser_direct_publish_blocked": true')
    assert_contains(SMOKE_TEST_PATH, "event_broker_topology_manifest.json")
    assert_contains(ROOT_SCRIPT_UPDATES_PATH, "build_event_spine_and_queueing.py")
    assert_contains(ROOT_SCRIPT_UPDATES_PATH, "validate:event-spine")
    assert_contains(PLAYWRIGHT_BUILDER_PATH, "event-spine-topology-atlas.spec.js")

    root_package = read_json(ROOT_PACKAGE_PATH)
    playwright_package = read_json(PLAYWRIGHT_PACKAGE_PATH)
    require(
        "python3 ./tools/analysis/build_event_spine_and_queueing.py"
        in root_package["scripts"]["codegen"],
        "Root codegen lost the par_087 builder.",
    )
    require(
        root_package["scripts"]["validate:event-spine"]
        == "python3 ./tools/analysis/validate_event_spine_and_queueing.py",
        "Root validate:event-spine script drifted.",
    )
    require(
        "node event-spine-topology-atlas.spec.js --run" in playwright_package["scripts"]["e2e"],
        "Playwright e2e script lost the par_087 atlas spec.",
    )

    print("event spine and queueing validation passed")


if __name__ == "__main__":
    main()
