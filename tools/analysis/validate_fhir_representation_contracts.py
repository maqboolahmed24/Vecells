#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"
TESTS_DIR = ROOT / "tests" / "playwright"
PACKAGE_DIR = ROOT / "packages" / "fhir-mapping"
CONTRACT_DIR = PACKAGE_DIR / "contracts"

CONTRACTS_PATH = DATA_DIR / "fhir_representation_contracts.json"
MAPPING_MATRIX_PATH = DATA_DIR / "fhir_mapping_matrix.csv"
EXCHANGE_POLICY_PATH = DATA_DIR / "fhir_exchange_bundle_policies.json"
IDENTIFIER_POLICY_PATH = DATA_DIR / "fhir_identifier_and_status_policies.json"

STRATEGY_DOC_PATH = DOCS_DIR / "49_fhir_representation_strategy.md"
CATALOG_DOC_PATH = DOCS_DIR / "49_fhir_representation_contract_catalog.md"
MATRIX_DOC_PATH = DOCS_DIR / "49_domain_to_fhir_mapping_matrix.md"
ATLAS_PATH = DOCS_DIR / "49_fhir_representation_atlas.html"
SPEC_PATH = TESTS_DIR / "fhir-representation-atlas.spec.js"

PACKAGE_SOURCE_PATH = PACKAGE_DIR / "src" / "index.ts"
PACKAGE_TEST_PATH = PACKAGE_DIR / "tests" / "public-api.test.ts"
PACKAGE_README_PATH = PACKAGE_DIR / "README.md"
CONTRACT_README_PATH = CONTRACT_DIR / "README.md"
CATALOG_PATH = CONTRACT_DIR / "catalog.json"
PACKAGE_CONTRACTS_PATH = CONTRACT_DIR / "representation-contracts.json"
PACKAGE_EXCHANGE_PATH = CONTRACT_DIR / "exchange-bundle-policies.json"
PACKAGE_POLICY_PATH = CONTRACT_DIR / "identifier-and-status-policies.json"
ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = TESTS_DIR / "package.json"

LEGAL_BUNDLE_TYPES = {
    "transaction",
    "message",
    "document",
    "collection",
    "searchset",
    "history",
    "batch",
}

REQUIRED_PURPOSES = {
    "clinical_persistence",
    "external_interchange",
    "partner_callback_correlation",
    "audit_companion",
}

REQUIRED_RESOURCE_TYPES = {
    "Task",
    "ServiceRequest",
    "DocumentReference",
    "Communication",
    "Consent",
    "AuditEvent",
    "Provenance",
}

REQUIRED_BLOCKED_OWNERS = {
    "AccessGrant",
    "CapabilityDecision",
    "Session",
    "RequestLifecycleLease",
    "CapacityReservation",
}

README_MARKERS = [
    "## Purpose",
    "## Allowed Dependencies",
    "## Forbidden Dependencies",
    "## Public API",
    "## Bootstrapping Test",
]

HTML_MARKERS = [
    'data-testid="atlas-masthead"',
    'data-testid="aggregate-rail"',
    'data-testid="mapping-table"',
    'data-testid="braid-diagram"',
    'data-testid="inspector"',
    'data-testid="bundle-matrix"',
    'data-testid="policy-ledger"',
    'data-testid="defect-strip"',
]


def fail(message: str) -> None:
    raise SystemExit(message)


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        fail(message)


def read_json(path: Path) -> Any:
    return json.loads(path.read_text())


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open() as handle:
        return list(csv.DictReader(handle))


def ensure_deliverables() -> None:
    required = [
        CONTRACTS_PATH,
        MAPPING_MATRIX_PATH,
        EXCHANGE_POLICY_PATH,
        IDENTIFIER_POLICY_PATH,
        STRATEGY_DOC_PATH,
        CATALOG_DOC_PATH,
        MATRIX_DOC_PATH,
        ATLAS_PATH,
        SPEC_PATH,
        PACKAGE_SOURCE_PATH,
        PACKAGE_TEST_PATH,
        PACKAGE_README_PATH,
        CONTRACT_README_PATH,
        CATALOG_PATH,
        PACKAGE_CONTRACTS_PATH,
        PACKAGE_EXCHANGE_PATH,
        PACKAGE_POLICY_PATH,
        ROOT_PACKAGE_PATH,
        PLAYWRIGHT_PACKAGE_PATH,
        Path(__file__),
    ]
    missing = [str(path) for path in required if not path.exists()]
    assert_true(not missing, "Missing seq_049 deliverables:\n" + "\n".join(missing))


def validate_contracts(contract_payload: dict[str, Any]) -> None:
    assert_true(contract_payload["task_id"] == "seq_049", "Contract payload task id drifted")
    assert_true(
        contract_payload["visual_mode"] == "Clinical_Representation_Atlas",
        "FHIR atlas visual mode drifted",
    )
    contracts = contract_payload["contracts"]
    ids = [row["fhirRepresentationContractId"] for row in contracts]
    assert_true(len(ids) == len(set(ids)), "FHIR contract ids lost uniqueness")
    assert_true(
        REQUIRED_PURPOSES.issubset({row["representationPurpose"] for row in contracts}),
        "Missing one or more required representation purposes",
    )
    assert_true(
        REQUIRED_RESOURCE_TYPES.issubset(
            {resource for row in contracts for resource in row["allowedResourceTypes"]}
        ),
        "Required FHIR resource coverage drifted",
    )
    assert_true(
        "Request" in {row["governingAggregateType"] for row in contracts},
        "Request mapping contract disappeared",
    )
    assert_true(
        "AuditRecord" in {row["governingAggregateType"] for row in contracts},
        "Audit companion contract disappeared",
    )
    blocked_owners = REQUIRED_BLOCKED_OWNERS | {
        row["objectType"] for row in read_json(IDENTIFIER_POLICY_PATH)["prohibitedLifecycleOwners"]
    }
    active_owners = {row["governingAggregateType"] for row in contracts}
    assert_true(
        not (REQUIRED_BLOCKED_OWNERS & active_owners),
        "Blocked lifecycle owners leaked into active FHIR contracts",
    )
    for row in contracts:
        assert_true(bool(row["owningBoundedContextRef"]), f"Contract {row['fhirRepresentationContractId']} lost owner context")
        assert_true(bool(row["triggerMilestoneTypes"]), f"Contract {row['fhirRepresentationContractId']} lost trigger milestones")
        assert_true(bool(row["requiredEvidenceRefs"]), f"Contract {row['fhirRepresentationContractId']} lost evidence refs")
        assert_true(bool(row["requiredProfileCanonicalUrls"]), f"Contract {row['fhirRepresentationContractId']} lost profile urls")
        assert_true(bool(row["source_refs"]), f"Contract {row['fhirRepresentationContractId']} lost source refs")
        assert_true(row["contractState"] == "active", f"Contract {row['fhirRepresentationContractId']} drifted inactive")


def validate_mapping_matrix(contract_payload: dict[str, Any]) -> None:
    rows = read_csv(MAPPING_MATRIX_PATH)
    allowed_rows = [row for row in rows if row["materializationDisposition"] == "allowed"]
    blocked_rows = [row for row in rows if row["materializationDisposition"] == "prohibited"]
    contract_ids = {row["fhirRepresentationContractId"] for row in contract_payload["contracts"]}
    assert_true(allowed_rows, "FHIR mapping matrix has no allowed rows")
    for row in allowed_rows:
        assert_true(
            row["fhirRepresentationContractId"] in contract_ids,
            f"Mapping row points to unknown contract {row['fhirRepresentationContractId']}",
        )
        assert_true(bool(row["resourceType"]), f"Allowed mapping row {row['mappingRowId']} lost resource type")
        assert_true(bool(row["profileCanonicalUrl"]), f"Allowed mapping row {row['mappingRowId']} lost profile url")
    assert_true(len(blocked_rows) >= 8, "Blocked mapping rows drifted")
    assert_true(
        REQUIRED_BLOCKED_OWNERS.issubset({row["governingAggregateType"] for row in blocked_rows}),
        "Required blocked lifecycle owners drifted from mapping matrix",
    )


def validate_exchange_policies(contract_payload: dict[str, Any]) -> None:
    payload = read_json(EXCHANGE_POLICY_PATH)
    contract_ids = {row["fhirRepresentationContractId"] for row in contract_payload["contracts"]}
    assert_true(payload["task_id"] == "seq_049", "Exchange bundle payload task id drifted")
    assert_true(payload["policies"], "Exchange bundle policy list is empty")
    for row in payload["policies"]:
        assert_true(
            set(row["representationContractRefs"]).issubset(contract_ids),
            f"Bundle policy {row['policyId']} points at unknown contracts",
        )
        assert_true(
            set(row["legalBundleTypes"]).issubset(LEGAL_BUNDLE_TYPES),
            f"Bundle policy {row['policyId']} uses illegal bundle types",
        )
        assert_true(bool(row["adapterProfileRefs"]), f"Bundle policy {row['policyId']} lost adapter profiles")
        assert_true(bool(row["source_refs"]), f"Bundle policy {row['policyId']} lost source refs")


def validate_policy_payload(contract_payload: dict[str, Any]) -> None:
    payload = read_json(IDENTIFIER_POLICY_PATH)
    contract_owner_refs = {row["governingAggregateType"] for row in contract_payload["contracts"]}
    assert_true(payload["task_id"] == "seq_049", "Policy payload task id drifted")
    assert_true(payload["identifierPolicies"], "Identifier policies are empty")
    assert_true(payload["statusMappingPolicies"], "Status mapping policies are empty")
    assert_true(payload["prohibitedLifecycleOwners"], "Blocked lifecycle-owner set is empty")
    assert_true(
        REQUIRED_BLOCKED_OWNERS.issubset({row["objectType"] for row in payload["prohibitedLifecycleOwners"]}),
        "Required blocked lifecycle owners drifted",
    )
    for row in payload["replayPolicies"]:
        assert_true(
            row["stableMembershipOnReplay"] is True,
            f"Replay policy {row['policyId']} no longer guarantees stable membership",
        )
    assert_true("AuditRecord" in contract_owner_refs, "Audit companion ownership drifted")


def validate_package_contracts(contract_payload: dict[str, Any]) -> None:
    contract_catalog = read_json(CATALOG_PATH)
    package_contracts = read_json(PACKAGE_CONTRACTS_PATH)
    package_exchange = read_json(PACKAGE_EXCHANGE_PATH)
    package_policy = read_json(PACKAGE_POLICY_PATH)
    assert_true(
        package_contracts["summary"]["active_contract_count"] == contract_payload["summary"]["active_contract_count"],
        "Package contract mirror drifted",
    )
    assert_true(
        package_exchange["summary"]["policy_count"] == read_json(EXCHANGE_POLICY_PATH)["summary"]["policy_count"],
        "Package exchange mirror drifted",
    )
    assert_true(
        package_policy["summary"]["blocked_lifecycle_owner_count"]
        == read_json(IDENTIFIER_POLICY_PATH)["summary"]["blocked_lifecycle_owner_count"],
        "Package policy mirror drifted",
    )
    artifact_paths = [ROOT / row["artifactPath"] for row in contract_catalog["artifacts"]]
    missing = [str(path) for path in artifact_paths if not path.exists()]
    assert_true(not missing, "Missing package contract artifacts:\n" + "\n".join(missing))


def validate_docs_and_ui() -> None:
    for marker in README_MARKERS:
        assert_true(marker in PACKAGE_README_PATH.read_text(), f"FHIR package README missing marker {marker}")
    for marker in HTML_MARKERS:
        assert_true(marker in ATLAS_PATH.read_text(), f"FHIR atlas HTML missing marker {marker}")
    source_text = PACKAGE_SOURCE_PATH.read_text()
    for token in (
        "fhirRepresentationContracts",
        "fhirExchangeBundlePolicies",
        "blockedFhirLifecycleOwners",
        "foundationFhirMappings",
    ):
        assert_true(token in source_text, f"FHIR package source lost export {token}")
    test_text = PACKAGE_TEST_PATH.read_text()
    assert_true("fhirRepresentationContracts.length" in test_text, "FHIR package test lost contract assertions")


def validate_root_scripts() -> None:
    root_package = read_json(ROOT_PACKAGE_PATH)
    scripts = root_package["scripts"]
    assert_true("build_fhir_representation_contracts.py" in scripts["codegen"], "Root codegen lost seq_049 builder")
    assert_true("validate:fhir" in scripts["bootstrap"], "Root bootstrap no longer runs validate:fhir")
    assert_true("validate:fhir" in scripts["check"], "Root check no longer runs validate:fhir")
    assert_true(
        scripts["validate:fhir"] == "python3 ./tools/analysis/validate_fhir_representation_contracts.py",
        "Root validate:fhir script drifted",
    )
    playwright_package = read_json(PLAYWRIGHT_PACKAGE_PATH)
    for script_name in ("build", "lint", "test", "typecheck", "e2e"):
        assert_true(
            "fhir-representation-atlas.spec.js" in playwright_package["scripts"][script_name],
            f"Playwright package script {script_name} lost FHIR atlas coverage",
        )


def main() -> None:
    ensure_deliverables()
    contract_payload = read_json(CONTRACTS_PATH)
    validate_contracts(contract_payload)
    validate_mapping_matrix(contract_payload)
    validate_exchange_policies(contract_payload)
    validate_policy_payload(contract_payload)
    validate_package_contracts(contract_payload)
    validate_docs_and_ui()
    validate_root_scripts()
    print("seq_049 validation passed")


if __name__ == "__main__":
    main()
