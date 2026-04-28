#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Any

from build_audit_and_worm_strategy import (
    ADMISSIBILITY_PATH,
    AUDIT_FHIR_MATRIX_PATH,
    AUDIT_SCHEMA_PATH,
    AUDIT_TAXONOMY_PATH,
    EXPLORER_PATH,
    FRONTEND_MANIFEST_PATH,
    FHIR_CONTRACTS_PATH,
    GRAPH_AUTHORITIES,
    PLAYWRIGHT_PACKAGE_PATH,
    RELEASE_PARITY_PATH,
    ROOT_PACKAGE_PATH,
    SPEC_PATH,
    STRATEGY_DOC_PATH,
    TASK_ID,
    VALIDATOR_PATH,
    VISUAL_MODE,
    WORM_CLASSES_PATH,
    build_schema,
    merkle_root,
    read_json,
    stable_hash,
)


def fail(message: str) -> None:
    raise SystemExit(message)


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        fail(message)


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open() as handle:
        return list(csv.DictReader(handle))


def ensure_deliverables() -> None:
    required = [
        AUDIT_SCHEMA_PATH,
        AUDIT_TAXONOMY_PATH,
        WORM_CLASSES_PATH,
        AUDIT_FHIR_MATRIX_PATH,
        ADMISSIBILITY_PATH,
        STRATEGY_DOC_PATH,
        EXPLORER_PATH,
        VALIDATOR_PATH,
        SPEC_PATH,
        ROOT_PACKAGE_PATH,
        PLAYWRIGHT_PACKAGE_PATH,
    ]
    missing = [str(path) for path in required if not path.exists()]
    assert_true(not missing, "Missing seq_053 deliverables:\n" + "\n".join(missing))


def validate_shape(row: dict[str, Any], schema: dict[str, Any], label: str) -> None:
    for key in schema["required"]:
        assert_true(key in row, f"{label} lost required property {key}")
    for key, property_schema in schema["properties"].items():
        if key not in row:
            continue
        value = row[key]
        expected_type = property_schema.get("type")
        if expected_type == "string":
            assert_true(isinstance(value, str) and value != "", f"{label} property {key} must be a non-empty string")
        elif expected_type == "integer":
            assert_true(isinstance(value, int), f"{label} property {key} must be an integer")
        elif expected_type == "array":
            assert_true(isinstance(value, list), f"{label} property {key} must be an array")
            assert_true(
                len(value) >= property_schema.get("minItems", 0),
                f"{label} property {key} fell below minItems",
            )
        elif expected_type == "boolean":
            assert_true(isinstance(value, bool), f"{label} property {key} must be a boolean")
        if "enum" in property_schema:
            assert_true(value in property_schema["enum"], f"{label} property {key} drifted outside enum")


def validate_payloads() -> None:
    schema = read_json(AUDIT_SCHEMA_PATH)
    taxonomy_rows = read_csv(AUDIT_TAXONOMY_PATH)
    worm_payload = read_json(WORM_CLASSES_PATH)
    companion_rows = read_csv(AUDIT_FHIR_MATRIX_PATH)
    admissibility_payload = read_json(ADMISSIBILITY_PATH)
    frontend_payload = read_json(FRONTEND_MANIFEST_PATH)
    release_payload = read_json(RELEASE_PARITY_PATH)
    fhir_payload = read_json(FHIR_CONTRACTS_PATH)

    assert_true(schema == build_schema(), "Audit schema drifted from builder output")
    assert_true(admissibility_payload["task_id"] == TASK_ID, "seq_053 task id drifted")
    assert_true(admissibility_payload["visual_mode"] == VISUAL_MODE, "seq_053 visual mode drifted")
    assert_true(worm_payload["task_id"] == TASK_ID, "WORM payload task id drifted")

    records = admissibility_payload["sampleAuditRecords"]
    dependencies = admissibility_payload["admissibilityDependencies"]
    worm_rows = worm_payload["wormRetentionClasses"]
    record_schema = schema["$defs"]["auditRecord"]
    worm_schema = schema["$defs"]["wormRetentionClass"]
    dependency_schema = schema["$defs"]["admissibilityDependency"]

    assert_true(
        admissibility_payload["summary"]["audit_record_count"] == len(records),
        "Audit record summary drifted",
    )
    assert_true(
        admissibility_payload["summary"]["action_taxonomy_count"] == len(taxonomy_rows),
        "Action taxonomy summary drifted",
    )
    assert_true(
        worm_payload["summary"]["worm_retention_class_count"] == len(worm_rows),
        "WORM retention class summary drifted",
    )
    assert_true(
        admissibility_payload["summary"]["admissibility_dependency_count"] == len(dependencies),
        "Admissibility dependency summary drifted",
    )
    assert_true(
        admissibility_payload["summary"]["fhir_companion_row_count"] == len(companion_rows),
        "FHIR companion summary drifted",
    )

    taxonomy_by_id = {row["audit_action_taxonomy_id"]: row for row in taxonomy_rows}
    taxonomy_by_code = {row["action_code"]: row for row in taxonomy_rows}
    worm_ids = {row["wormRetentionClassId"] for row in worm_rows}
    release_ids = {row["releaseId"] for row in release_payload["releaseCandidates"]}
    fhir_contract_ids = {
        row["fhirRepresentationContractId"]: row for row in fhir_payload["contracts"]
    }
    frontend_surfaces = {
        row["audienceSurface"] for row in frontend_payload["frontendContractManifests"]
    }
    bundle_ids = {
        row["designContractPublicationBundleRef"] for row in frontend_payload["frontendContractManifests"]
    }
    companion_by_id = {row["audit_to_fhir_companion_matrix_id"]: row for row in companion_rows}

    assert_true(all(row["worm_append_required"] == "true" for row in taxonomy_rows), "Every authoritative taxonomy row must require WORM append")
    assert_true(all(row["hash_chain_required"] == "true" for row in taxonomy_rows), "Every authoritative taxonomy row must require hash chaining")
    assert_true(
        len({row["route_family_ref"] for row in taxonomy_rows}) >= 5,
        "Taxonomy coverage unexpectedly collapsed",
    )

    seen_ids: set[str] = set()
    previous_hash = None
    recomputed_hashes: list[str] = []
    for record in records:
        validate_shape(record, record_schema, record["auditRecordId"])
        assert_true(record["auditRecordId"] not in seen_ids, f"Duplicate audit record id {record['auditRecordId']}")
        seen_ids.add(record["auditRecordId"])
        assert_true(record["actionTaxonomyRef"] in taxonomy_by_id, f"{record['auditRecordId']} points at unknown taxonomy row")
        taxonomy = taxonomy_by_id[record["actionTaxonomyRef"]]
        assert_true(record["actionCode"] == taxonomy["action_code"], f"{record['auditRecordId']} action code drifted from taxonomy")
        assert_true(record["retentionClassRef"] in worm_ids, f"{record['auditRecordId']} points at unknown WORM class")
        assert_true(record["releaseCandidateRef"] in release_ids, f"{record['auditRecordId']} points at unknown release candidate")
        assert_true(record["audienceSurface"] in frontend_surfaces, f"{record['auditRecordId']} points at unknown audience surface")
        assert_true(record["designContractPublicationBundleRef"] in bundle_ids, f"{record['auditRecordId']} points at unknown design bundle")
        assert_true(record["fhirRepresentationContractRef"] in fhir_contract_ids, f"{record['auditRecordId']} points at unknown FHIR contract")
        assert_true(
            fhir_contract_ids[record["fhirRepresentationContractRef"]]["representationPurpose"] == "audit_companion",
            f"{record['auditRecordId']} must point at the audit-companion FHIR contract",
        )
        assert_true(record["fhirCompanionTupleRef"] in companion_by_id, f"{record['auditRecordId']} points at unknown companion tuple")
        assert_true(
            record["chainIntegrityState"] == "exact",
            f"{record['auditRecordId']} unexpectedly drifted out of exact chain integrity",
        )
        assert_true(
            record["admissibilityDependencyRefs"],
            f"{record['auditRecordId']} lost admissibility dependency refs",
        )
        if previous_hash is None:
            assert_true(
                record["previousHash"].startswith("GENESIS_053"),
                "First audit record lost the seq_053 genesis previous hash",
            )
        else:
            assert_true(
                record["previousHash"] == previous_hash,
                f"{record['auditRecordId']} previousHash no longer matches the prior record hash",
            )
        hash_input = {
            key: record[key]
            for key in [
                "auditRecordId",
                "chainSequence",
                "actorClass",
                "actorRef",
                "actingContextRef",
                "actionTaxonomyRef",
                "actionCode",
                "targetType",
                "targetId",
                "reasonCode",
                "edgeCorrelationId",
                "routeIntentRef",
                "commandActionRef",
                "commandSettlementRef",
                "uiEventRef",
                "uiEventCausalityFrameRef",
                "uiTransitionSettlementRef",
                "projectionVisibilityRef",
                "selectedAnchorRef",
                "shellDecisionClass",
                "disclosureFenceRef",
                "sourceIpHash",
                "userAgentHash",
                "timestamp",
                "previousHash",
                "retentionClassRef",
                "fhirRepresentationContractRef",
            ]
        }
        expected_hash = stable_hash(hash_input)
        assert_true(record["hash"] == expected_hash, f"{record['auditRecordId']} hash drifted from canonical chain input")
        previous_hash = record["hash"]
        recomputed_hashes.append(record["hash"])

    assert_true(
        admissibility_payload["hashChainPolicy"]["chainMerkleRoot"] == merkle_root(recomputed_hashes),
        "Chain Merkle root drifted from record hashes",
    )
    assert_true(
        admissibility_payload["summary"]["chain_break_count"] == 0,
        "seq_053 should not ship with chain breaks in the sample ledger",
    )

    for worm_row in worm_rows:
        validate_shape(worm_row, worm_schema, worm_row["wormRetentionClassId"])
        if worm_row["immutabilityMode"] in {"worm_hash_chained", "worm_append_only", "hash_chained_archive_only"}:
            assert_true(
                worm_row["ordinaryDeletionEligible"] is False,
                f"{worm_row['wormRetentionClassId']} must never be ordinary deletion eligible",
            )
            assert_true(
                worm_row["deleteReadyProhibited"] is True,
                f"{worm_row['wormRetentionClassId']} must explicitly prohibit delete-ready posture",
            )
        assert_true(
            worm_row["hashChainRequired"] is True,
            f"{worm_row['wormRetentionClassId']} must stay hash-chained in seq_053",
        )

    for companion_row in companion_rows:
        assert_true(
            companion_row["canonical_truth_state"] == "AuditRecord_canonical_companion_only",
            f"{companion_row['audit_to_fhir_companion_matrix_id']} lost companion-only canonicality",
        )
        assert_true(
            companion_row["fhir_representation_contract_ref"] in fhir_contract_ids,
            f"{companion_row['audit_to_fhir_companion_matrix_id']} points at unknown FHIR contract",
        )

    dependency_ids = {row["auditAdmissibilityDependencyId"] for row in dependencies}
    for record in records:
        assert_true(
            set(record["admissibilityDependencyRefs"]).issubset(dependency_ids),
            f"{record['auditRecordId']} points at unknown dependency refs",
        )

    blocked_count = 0
    for dependency in dependencies:
        validate_shape(dependency, dependency_schema, dependency["auditAdmissibilityDependencyId"])
        assert_true(
            dependency["requiredGraphAuthorityRefs"] == GRAPH_AUTHORITIES,
            f"{dependency['auditAdmissibilityDependencyId']} lost the required graph authority pair",
        )
        if dependency["currentState"] == "blocked":
            blocked_count += 1
            assert_true(
                len(dependency["blockedReasonCodes"]) >= 1,
                f"{dependency['auditAdmissibilityDependencyId']} must keep at least one blocking reason",
            )
        assert_true(
            all(ref in release_ids or ref in bundle_ids for ref in dependency["requiredReleaseTupleRefs"]),
            f"{dependency['auditAdmissibilityDependencyId']} references unknown release or bundle tuple refs",
        )

    assert_true(
        blocked_count == admissibility_payload["summary"]["inadmissible_dependency_count"],
        "Blocked dependency summary drifted",
    )


def validate_repo_wiring() -> None:
    root_package = read_json(ROOT_PACKAGE_PATH)
    playwright_package = read_json(PLAYWRIGHT_PACKAGE_PATH)
    strategy_doc = STRATEGY_DOC_PATH.read_text()
    explorer_text = EXPLORER_PATH.read_text()
    spec_text = SPEC_PATH.read_text()

    root_scripts = root_package.get("scripts", {})
    assert_true(
        "build_audit_and_worm_strategy.py" in root_scripts.get("codegen", ""),
        "Root codegen script lost seq_053 builder wiring",
    )
    assert_true(
        "validate:audit-worm" in root_scripts
        and "validate_audit_and_worm_strategy.py" in root_scripts["validate:audit-worm"],
        "Root package lost the seq_053 validator script",
    )
    assert_true(
        "audit-ledger-explorer.spec.js" in playwright_package["scripts"]["e2e"],
        "Playwright workspace lost the seq_053 e2e wiring",
    )
    assert_true("# 53 Audit And WORM Strategy" in strategy_doc, "Strategy doc marker missing")
    for marker in [
        'data-testid="filter-rail"',
        'data-testid="chain-lane"',
        'data-testid="ledger-table"',
        'data-testid="inspector"',
        'data-testid="defect-strip"',
    ]:
        assert_true(marker in explorer_text, f"Explorer HTML lost required marker {marker}")
    for marker in [
        "filter-taxonomy",
        "filter-admissibility",
        "ledger-row-",
        "AuditEvent + Provenance companion only",
    ]:
        assert_true(marker in spec_text, f"Spec lost required coverage marker {marker}")


def main() -> None:
    ensure_deliverables()
    validate_payloads()
    validate_repo_wiring()
    print("seq_053 audit and WORM strategy validation passed")


if __name__ == "__main__":
    main()
