#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from collections import OrderedDict
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"
TESTS_DIR = ROOT / "tests" / "playwright"
PACKAGE_DIR = ROOT / "packages" / "event-contracts"

PHASE0_PATH = ROOT / "blueprint" / "phase-0-the-foundation-protocol.md"
NAMESPACE_PATH = DATA_DIR / "canonical_event_namespaces.json"
CONTRACT_PATH = DATA_DIR / "canonical_event_contracts.json"
NORMALIZATION_PATH = DATA_DIR / "canonical_event_normalization_rules.json"
SCHEMA_VERSION_PATH = DATA_DIR / "canonical_event_schema_versions.json"
FAMILY_MATRIX_PATH = DATA_DIR / "canonical_event_family_matrix.csv"
STRATEGY_PATH = DOCS_DIR / "48_event_namespace_strategy.md"
PROCESS_PATH = DOCS_DIR / "48_event_schema_registry_process.md"
CATALOG_PATH = DOCS_DIR / "48_event_contract_catalog.md"
STUDIO_PATH = DOCS_DIR / "48_event_registry_studio.html"
SPEC_PATH = TESTS_DIR / "event-registry-studio.spec.js"
ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = TESTS_DIR / "package.json"
SCHEMA_DIR = PACKAGE_DIR / "schemas"
PACKAGE_SOURCE_PATH = PACKAGE_DIR / "src" / "index.ts"

EXPECTED_NAMESPACES = {
    "request",
    "intake",
    "identity",
    "access",
    "telephony",
    "safety",
    "triage",
    "booking",
    "hub",
    "pharmacy",
    "patient",
    "communication",
    "reachability",
    "exception",
    "confirmation",
    "capacity",
    "support",
    "assistive",
    "policy",
    "release",
    "analytics",
    "audit",
}

REQUIRED_GAP_EVENTS = {
    "intake.attachment.quarantined",
    "patient.receipt.degraded",
    "exception.review_case.opened",
    "exception.review_case.recovered",
    "identity.repair_case.opened",
    "identity.repair_case.corrected",
    "identity.repair_case.closed",
    "request.duplicate.review_required",
    "request.duplicate.resolved",
    "reachability.dependency.created",
    "reachability.dependency.failed",
    "reachability.dependency.repaired",
    "confirmation.gate.created",
    "confirmation.gate.confirmed",
    "confirmation.gate.disputed",
    "request.closure_blockers.changed",
}

REQUIRED_ALIAS_PREFIXES = {
    "ingest": "intake",
    "tasks": "triage.task",
    "fallback.review_case": "exception.review_case",
    "external.confirmation.gate": "confirmation.gate",
}

HTML_MARKERS = [
    'data-testid="registry-masthead"',
    'data-testid="namespace-rail"',
    'data-testid="contract-table"',
    'data-testid="diff-ledger"',
    'data-testid="inspector"',
    'data-testid="defect-strip"',
    'data-testid="filter-context"',
    'data-testid="filter-compatibility"',
    'data-testid="filter-replay"',
    'data-testid="filter-defect"',
    'data-testid="filter-diff"',
]


def fail(message: str) -> None:
    raise SystemExit(message)


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        fail(message)


def read_json(path: Path) -> Any:
    return json.loads(path.read_text())


def load_csv(path: Path) -> list[dict[str, str]]:
    with path.open() as handle:
        return list(csv.DictReader(handle))


def parse_minimum_event_families(phase0_text: str) -> OrderedDict[str, list[str]]:
    marker = "Minimum required canonical event families:"
    end_marker = "Use these namespaces consistently"
    start = phase0_text.index(marker)
    end = phase0_text.index(end_marker, start)
    block = phase0_text[start:end]
    families: OrderedDict[str, list[str]] = OrderedDict()
    for line in block.splitlines():
        line = line.strip()
        if not line.startswith("- `") or "`:" not in line:
            continue
        values = []
        cursor = 0
        while True:
            open_tick = line.find("`", cursor)
            if open_tick == -1:
                break
            close_tick = line.find("`", open_tick + 1)
            values.append(line[open_tick + 1 : close_tick])
            cursor = close_tick + 1
        namespace = values[0].replace(".*", "")
        families[namespace] = values[1:]
    return families


def ensure_deliverables() -> None:
    required = [
        NAMESPACE_PATH,
        CONTRACT_PATH,
        NORMALIZATION_PATH,
        SCHEMA_VERSION_PATH,
        FAMILY_MATRIX_PATH,
        STRATEGY_PATH,
        PROCESS_PATH,
        CATALOG_PATH,
        STUDIO_PATH,
        SPEC_PATH,
        ROOT_PACKAGE_PATH,
        PLAYWRIGHT_PACKAGE_PATH,
        PACKAGE_SOURCE_PATH,
        SCHEMA_DIR / "catalog.json",
        SCHEMA_DIR / "canonical-event-envelope.v1.schema.json",
    ]
    missing = [str(path) for path in required if not path.exists()]
    assert_true(not missing, "Missing seq_048 deliverables:\n" + "\n".join(missing))


def validate_namespaces(namespace_payload: dict[str, Any]) -> None:
    assert_true(namespace_payload["task_id"] == "seq_048", "Namespace payload task id drifted")
    assert_true(namespace_payload["visual_mode"] == "Event_Registry_Studio", "Namespace visual mode drifted")
    namespaces = namespace_payload["namespaces"]
    codes = {row["namespaceCode"] for row in namespaces}
    assert_true(codes == EXPECTED_NAMESPACES, "Namespace set drifted from the Phase 0 canonical taxonomy")
    ids = [row["canonicalEventNamespaceId"] for row in namespaces]
    assert_true(len(ids) == len(set(ids)), "Namespace ids lost uniqueness")
    for row in namespaces:
        assert_true(bool(row["owningBoundedContextRef"]), f"Namespace {row['namespaceCode']} lost its owner")
        assert_true(bool(row["allowedProducerContextRefs"]), f"Namespace {row['namespaceCode']} lost producer allowlist")
        assert_true(bool(row["source_refs"]), f"Namespace {row['namespaceCode']} lost source refs")
        assert_true(row["namespaceState"] == "active", f"Namespace {row['namespaceCode']} is no longer active")
    assert_true(namespace_payload["summary"]["namespace_count"] == 22, "Namespace count drifted")


def validate_contracts(contract_payload: dict[str, Any], phase0_families: OrderedDict[str, list[str]]) -> None:
    assert_true(contract_payload["task_id"] == "seq_048", "Contract payload task id drifted")
    contracts = contract_payload["contracts"]
    event_names = [row["eventName"] for row in contracts]
    assert_true(len(event_names) == len(set(event_names)), "Event names lost uniqueness")
    assert_true(contract_payload["summary"]["missing_contract_count"] == 0, "Registry should not report missing contracts")

    expected_events = []
    for events in phase0_families.values():
        expected_events.extend(events)
    assert_true(set(expected_events) == set(event_names), "Contract registry no longer matches the Phase 0 minimum event list")
    assert_true(REQUIRED_GAP_EVENTS.issubset(set(event_names)), "Forensic gap event set is incomplete")

    namespace_refs = {row["namespaceRef"] for row in contracts}
    assert_true(len(namespace_refs) == 22, "Every active namespace should own at least one event contract")
    for row in contracts:
        assert_true(bool(row["canonicalEventContractId"]), f"Contract id missing for {row['eventName']}")
        assert_true(bool(row["governingObjectType"]), f"Governing object type missing for {row['eventName']}")
        assert_true(bool(row["requiredIdentifierRefs"]), f"Identifier refs missing for {row['eventName']}")
        assert_true(bool(row["requiredCausalityRefs"]), f"Causality refs missing for {row['eventName']}")
        assert_true(bool(row["requiredPrivacyRefs"]), f"Privacy refs missing for {row['eventName']}")
        assert_true(bool(row["requiredPayloadRefs"]), f"Payload refs missing for {row['eventName']}")
        assert_true(bool(row["schemaVersionRef"]), f"Schema version ref missing for {row['eventName']}")
        assert_true(bool(row["source_refs"]), f"Source refs missing for {row['eventName']}")
        assert_true(not row["eventName"].startswith("ingest."), "Legacy ingest aliases may not be active canonical events")
        assert_true(not row["eventName"].startswith("tasks."), "Legacy tasks aliases may not be active canonical events")
        assert_true(
            not row["eventName"].startswith("fallback.review_case."),
            "Fallback review aliases may not be active canonical events",
        )
        assert_true(
            not row["eventName"].startswith("external.confirmation.gate."),
            "External confirmation aliases may not be active canonical events",
        )


def validate_normalization(
    normalization_payload: dict[str, Any],
    contract_payload: dict[str, Any],
) -> None:
    rules = normalization_payload["normalizationRules"]
    contract_refs = {row["canonicalEventContractId"] for row in contract_payload["contracts"]}
    assert_true(rules, "Normalization rules payload is empty")
    for row in rules:
        assert_true(
            row["targetCanonicalEventContractRef"] in contract_refs,
            f"Normalization rule {row['canonicalEventNormalizationRuleId']} points to an unknown contract",
        )
        assert_true(row["ruleState"] == "active", f"Normalization rule {row['canonicalEventNormalizationRuleId']} drifted inactive")

    seen_prefixes = set()
    for row in rules:
        prefix = row["sourceNamespacePattern"]
        if prefix in {"ingest", "tasks", "fallback.review_case", "external.confirmation.gate"}:
            seen_prefixes.add(prefix)
    assert_true(set(REQUIRED_ALIAS_PREFIXES.keys()).issubset(seen_prefixes), "Required alias normalization families are incomplete")


def validate_schema_versions(
    schema_payload: dict[str, Any],
    contract_payload: dict[str, Any],
) -> None:
    schema_versions = schema_payload["schemaVersions"]
    active_versions = [row for row in schema_versions if row["lifecycleState"] == "active"]
    contracts = contract_payload["contracts"]
    contract_by_schema = {row["schemaVersionRef"]: row for row in contracts}
    assert_true(
        len(active_versions) == contract_payload["summary"]["active_contract_count"],
        "Active schema versions must match active contract count",
    )
    for row in active_versions:
        assert_true(
            row["schemaVersionRef"] in contract_by_schema,
            f"Schema version {row['schemaVersionRef']} is not linked to a contract row",
        )
        artifact_path = ROOT / row["artifactPath"]
        assert_true(artifact_path.exists(), f"Schema artifact missing for {row['schemaVersionRef']}")
        schema_json = read_json(artifact_path)
        assert_true(schema_json["properties"]["eventName"]["const"] == row["eventName"], "Schema event constant drifted")
    assert_true(schema_payload["summary"]["blocked_schema_count"] == 4, "Blocked schema count drifted")
    assert_true(schema_payload["schemaArtifactCatalog"]["activeSchemaArtifactCount"] == len(active_versions), "Schema catalog count drifted")
    assert_true(
        schema_payload["envelopeSchemaVersion"]["artifactPath"] == "packages/event-contracts/schemas/canonical-event-envelope.v1.schema.json",
        "Envelope schema artifact path drifted",
    )


def validate_family_matrix(matrix_rows: list[dict[str, str]], contract_payload: dict[str, Any]) -> None:
    contracts = contract_payload["contracts"]
    assert_true(len(matrix_rows) == len(contracts), "Family matrix row count drifted")
    contract_names = {row["eventName"] for row in contracts}
    assert_true({row["event_name"] for row in matrix_rows} == contract_names, "Family matrix lost event coverage")


def validate_html() -> None:
    html = STUDIO_PATH.read_text()
    for marker in HTML_MARKERS:
        assert_true(marker in html, f"Studio HTML lost marker: {marker}")
    assert_true("prefers-reduced-motion" in html, "Studio HTML lost reduced-motion handling")
    assert_true("../../data/analysis/canonical_event_contracts.json" in html, "Studio no longer loads generated contract data")
    assert_true("../../data/analysis/canonical_event_normalization_rules.json" in html, "Studio no longer loads generated rule data")


def validate_scripts() -> None:
    root_package = read_json(ROOT_PACKAGE_PATH)
    scripts = root_package["scripts"]
    assert_true("build_event_registry.py" in scripts["codegen"], "Root codegen no longer includes seq_048 generator")
    assert_true("validate:events" in scripts, "Root package lost validate:events script")
    assert_true("validate:events" in scripts["bootstrap"], "Root bootstrap no longer runs validate:events")
    assert_true("validate:events" in scripts["check"], "Root check no longer runs validate:events")

    playwright_package = read_json(PLAYWRIGHT_PACKAGE_PATH)
    for script_name in ["build", "lint", "test", "typecheck", "e2e"]:
        assert_true(
            "event-registry-studio.spec.js" in playwright_package["scripts"][script_name],
            f"Playwright workspace script {script_name} lost the seq_048 spec",
        )

    source_text = PACKAGE_SOURCE_PATH.read_text()
    assert_true("canonicalEventContracts" in source_text, "event-contracts package source lost registry exports")
    assert_true("schemaArtifactCatalog" in source_text, "event-contracts package source lost schema catalog export")


def main() -> None:
    ensure_deliverables()
    phase0_families = parse_minimum_event_families(PHASE0_PATH.read_text())
    namespace_payload = read_json(NAMESPACE_PATH)
    contract_payload = read_json(CONTRACT_PATH)
    normalization_payload = read_json(NORMALIZATION_PATH)
    schema_payload = read_json(SCHEMA_VERSION_PATH)
    matrix_rows = load_csv(FAMILY_MATRIX_PATH)

    validate_namespaces(namespace_payload)
    validate_contracts(contract_payload, phase0_families)
    validate_normalization(normalization_payload, contract_payload)
    validate_schema_versions(schema_payload, contract_payload)
    validate_family_matrix(matrix_rows, contract_payload)
    validate_html()
    validate_scripts()


if __name__ == "__main__":
    main()
