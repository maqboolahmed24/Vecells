#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"

TASK_ID = "par_064"
CAPTURED_ON = "2026-04-12"
GENERATED_AT = "2026-04-12T00:00:00+00:00"

CONTRACTS_PATH = DATA_DIR / "fhir_representation_contracts.json"
MANIFEST_PATH = DATA_DIR / "fhir_representation_contract_manifest.json"
MATRIX_PATH = DATA_DIR / "fhir_resource_type_matrix.csv"
DESIGN_DOC_PATH = DOCS_DIR / "64_fhir_mapping_compiler_design.md"
RULES_DOC_PATH = DOCS_DIR / "64_fhir_representation_set_rules.md"

ROOT_PACKAGE_PATH = ROOT / "package.json"
PACKAGE_INDEX_PATH = ROOT / "packages" / "fhir-mapping" / "src" / "index.ts"
PACKAGE_JSON_PATH = ROOT / "packages" / "fhir-mapping" / "package.json"
COMMAND_API_PACKAGE_JSON_PATH = ROOT / "services" / "command-api" / "package.json"

IMPLEMENTATION_FILES = [
    "packages/fhir-mapping/src/representation-compiler.ts",
    "packages/fhir-mapping/src/index.ts",
    "packages/fhir-mapping/tests/representation-compiler.test.ts",
    "packages/fhir-mapping/tests/public-api.test.ts",
    "packages/fhir-mapping/schemas/fhir-representation-set.schema.json",
    "packages/fhir-mapping/schemas/fhir-resource-record.schema.json",
    "packages/fhir-mapping/schemas/fhir-exchange-bundle.schema.json",
    "services/command-api/src/fhir-mapping.ts",
    "services/command-api/tests/fhir-mapping.integration.test.js",
    "services/command-api/migrations/064_fhir_mapping_compiler.sql",
    "tools/analysis/build_fhir_mapping_compiler.py",
    "tools/analysis/validate_fhir_mapping_compiler.py",
]

SOURCE_PRECEDENCE = [
    "prompt/064.md",
    "prompt/shared_operating_contract_056_to_065.md",
    "blueprint/phase-0-the-foundation-protocol.md#FhirRepresentationContract",
    "blueprint/phase-0-the-foundation-protocol.md#FhirRepresentationSet",
    "blueprint/phase-0-the-foundation-protocol.md#FhirResourceRecord",
    "blueprint/phase-0-the-foundation-protocol.md#FhirExchangeBundle",
    "blueprint/phase-0-the-foundation-protocol.md#4.3 FHIR mapping law",
    "blueprint/platform-runtime-and-release-blueprint.md#AdapterContractProfile",
    "blueprint/platform-runtime-and-release-blueprint.md#Data persistence and migration contract",
    "blueprint/forensic-audit-findings.md#Finding-03",
    "data/analysis/fhir_representation_contracts.json",
    "data/analysis/fhir_exchange_bundle_policies.json",
    "data/analysis/fhir_identifier_and_status_policies.json",
]

INVARIANT_ROWS = [
    {
        "invariant_id": "INV_064_DOMAIN_FIRST_AUTHORITY",
        "scope": "FhirRepresentationContract",
        "rule": "Domain aggregates remain authoritative and FHIR is derived representation only.",
        "enforced_by": "packages/fhir-mapping/src/representation-compiler.ts::FhirRepresentationContractRecord.normalize",
        "verified_by": "packages/fhir-mapping/tests/representation-compiler.test.ts",
        "source_refs": "blueprint/phase-0-the-foundation-protocol.md#FhirRepresentationContract; prompt/064.md",
    },
    {
        "invariant_id": "INV_064_PUBLISHED_CONTRACT_ONLY",
        "scope": "FhirRepresentationContract",
        "rule": "Runtime materialization may read only published active representation contract rows.",
        "enforced_by": "packages/fhir-mapping/src/representation-compiler.ts::FhirRepresentationContractRecord.publish",
        "verified_by": "packages/fhir-mapping/tests/representation-compiler.test.ts",
        "source_refs": "blueprint/platform-runtime-and-release-blueprint.md#AdapterContractProfile; prompt/064.md",
    },
    {
        "invariant_id": "INV_064_REPLAY_SAFE_SET_IDS",
        "scope": "FhirRepresentationSet",
        "rule": "The same aggregate version rematerializes the same representation set identity and resource membership.",
        "enforced_by": "packages/fhir-mapping/src/representation-compiler.ts::FhirRepresentationCompiler.materializeRepresentationSet",
        "verified_by": "packages/fhir-mapping/tests/representation-compiler.test.ts",
        "source_refs": "blueprint/phase-0-the-foundation-protocol.md#FhirRepresentationSet; blueprint/phase-0-the-foundation-protocol.md#Tests that must pass before 0B is done",
    },
    {
        "invariant_id": "INV_064_IDENTIFIER_STABILITY",
        "scope": "FhirResourceRecord",
        "rule": "Logical ids, version ids, and identifier sets are deterministic under replay and may not silently fork.",
        "enforced_by": "packages/fhir-mapping/src/representation-compiler.ts::deterministicResourceId; packages/fhir-mapping/src/representation-compiler.ts::deterministicVersionId",
        "verified_by": "packages/fhir-mapping/tests/representation-compiler.test.ts",
        "source_refs": "prompt/064.md; blueprint/phase-0-the-foundation-protocol.md#FhirResourceRecord",
    },
    {
        "invariant_id": "INV_064_BUNDLE_TYPE_GUARD",
        "scope": "FhirExchangeBundle",
        "rule": "Only declared and supported bundle types may be emitted at the adapter boundary.",
        "enforced_by": "packages/fhir-mapping/src/representation-compiler.ts::allowedBundleTypeSet; packages/fhir-mapping/src/representation-compiler.ts::FhirRepresentationCompiler.materializeRepresentationSet",
        "verified_by": "packages/fhir-mapping/tests/representation-compiler.test.ts",
        "source_refs": "blueprint/phase-0-the-foundation-protocol.md#FhirExchangeBundle; prompt/064.md",
    },
    {
        "invariant_id": "INV_064_APPEND_ONLY_SUPERSESSION",
        "scope": "FhirRepresentationSet",
        "rule": "New aggregate versions supersede prior representation rows append-only instead of rewriting history in place.",
        "enforced_by": "packages/fhir-mapping/src/representation-compiler.ts::appendVersionedRecord; packages/fhir-mapping/src/representation-compiler.ts::FhirRepresentationSetRecord.supersede",
        "verified_by": "packages/fhir-mapping/tests/representation-compiler.test.ts; services/command-api/tests/fhir-mapping.integration.test.js",
        "source_refs": "prompt/064.md; blueprint/phase-0-the-foundation-protocol.md#FhirRepresentationSet",
    },
    {
        "invariant_id": "INV_064_ADAPTER_CONSUMPTION_GUARD",
        "scope": "FhirExchangeBundle",
        "rule": "Adapters may consume only the published contract rows and bundle types their profile explicitly allows.",
        "enforced_by": "packages/fhir-mapping/src/representation-compiler.ts::authorizeAdapterConsumption",
        "verified_by": "packages/fhir-mapping/tests/representation-compiler.test.ts",
        "source_refs": "blueprint/platform-runtime-and-release-blueprint.md#AdapterContractProfile; blueprint/phase-0-the-foundation-protocol.md#FhirExchangeBundle",
    },
]


def read_json(path: Path):
    return json.loads(path.read_text())


def write_json(path: Path, payload) -> None:
    path.write_text(json.dumps(payload, indent=2) + "\n")


def patch_root_package_json() -> None:
    package_json = read_json(ROOT_PACKAGE_PATH)
    scripts = package_json["scripts"]
    builder_cmd = "python3 ./tools/analysis/build_fhir_mapping_compiler.py"
    validator_cmd = "python3 ./tools/analysis/validate_fhir_mapping_compiler.py"

    if builder_cmd not in scripts["codegen"]:
        scripts["codegen"] = scripts["codegen"].replace(
            "&& pnpm format",
            f"&& python3 ./tools/analysis/build_parallel_foundation_tracks_gate.py && {builder_cmd} && pnpm format",
        )
        scripts["codegen"] = scripts["codegen"].replace(
            "python3 ./tools/analysis/build_parallel_foundation_tracks_gate.py && python3 ./tools/analysis/build_parallel_foundation_tracks_gate.py &&",
            "python3 ./tools/analysis/build_parallel_foundation_tracks_gate.py &&",
        )

    scripts["validate:fhir-compiler"] = validator_cmd

    for script_name in ("bootstrap", "check"):
        if "pnpm validate:fhir-compiler" not in scripts[script_name]:
            scripts[script_name] = scripts[script_name].replace(
                "pnpm validate:fhir &&",
                "pnpm validate:fhir && pnpm validate:fhir-compiler &&",
            )

    ROOT_PACKAGE_PATH.write_text(json.dumps(package_json, indent=2) + "\n")


def patch_fhir_mapping_index() -> None:
    export_line = 'export * from "./representation-compiler";'
    text = PACKAGE_INDEX_PATH.read_text()
    if export_line not in text:
        PACKAGE_INDEX_PATH.write_text(text.rstrip() + "\n\n" + export_line + "\n")


def patch_fhir_mapping_package_json() -> None:
    package_json = read_json(PACKAGE_JSON_PATH)
    exports = package_json.setdefault("exports", {})
    exports["./schemas/fhir-representation-set"] = "./schemas/fhir-representation-set.schema.json"
    exports["./schemas/fhir-resource-record"] = "./schemas/fhir-resource-record.schema.json"
    exports["./schemas/fhir-exchange-bundle"] = "./schemas/fhir-exchange-bundle.schema.json"
    PACKAGE_JSON_PATH.write_text(json.dumps(package_json, indent=2) + "\n")


def patch_command_api_package_json() -> None:
    package_json = read_json(COMMAND_API_PACKAGE_JSON_PATH)
    deps = package_json.setdefault("dependencies", {})
    deps["@vecells/fhir-mapping"] = "workspace:*"
    COMMAND_API_PACKAGE_JSON_PATH.write_text(json.dumps(package_json, indent=2) + "\n")


def build_manifest(contracts_payload: dict) -> dict:
    contracts = contracts_payload["contracts"]
    resource_types = sorted(
        ({
            resource_profile["resourceType"]
            for contract in contracts
            for resource_profile in contract["resourceProfiles"]
        } | {"Bundle"})
    )
    return {
        "task_id": TASK_ID,
        "generated_at": GENERATED_AT,
        "captured_on": CAPTURED_ON,
        "source_precedence": SOURCE_PRECEDENCE,
        "summary": {
            "representation_contract_count": len(contracts),
            "governing_aggregate_type_count": len(
                {contract["governingAggregateType"] for contract in contracts}
            ),
            "canonical_resource_type_count": len(resource_types),
            "bundle_policy_ref_count": len(
                {
                    policy_ref
                    for contract in contracts
                    for policy_ref in contract["declaredBundlePolicyRefs"]
                }
            ),
            "persistence_table_count": 4,
            "schema_count": 3,
            "implementation_file_count": len(IMPLEMENTATION_FILES),
            "invariant_count": len(INVARIANT_ROWS),
        },
        "resource_types": resource_types,
        "persistence_tables": [
            "fhir_representation_contracts",
            "fhir_representation_sets",
            "fhir_resource_records",
            "fhir_exchange_bundles",
        ],
        "schemas": [
            "packages/fhir-mapping/schemas/fhir-representation-set.schema.json",
            "packages/fhir-mapping/schemas/fhir-resource-record.schema.json",
            "packages/fhir-mapping/schemas/fhir-exchange-bundle.schema.json",
        ],
        "implementation_files": IMPLEMENTATION_FILES,
        "invariants": INVARIANT_ROWS,
    }


def write_matrix(contracts_payload: dict) -> None:
    rows = []
    for contract in sorted(
        contracts_payload["contracts"],
        key=lambda row: row["fhirRepresentationContractId"],
    ):
        bundle_refs = "; ".join(contract["declaredBundlePolicyRefs"])
        for resource in sorted(
            contract["resourceProfiles"], key=lambda row: row["resourceType"]
        ):
            rows.append(
                {
                    "fhir_representation_contract_id": contract["fhirRepresentationContractId"],
                    "governing_aggregate_type": contract["governingAggregateType"],
                    "representation_purpose": contract["representationPurpose"],
                    "resource_type": resource["resourceType"],
                    "profile_canonical_url": resource["profileCanonicalUrl"],
                    "identifier_policy_ref": contract["identifierPolicyRef"],
                    "status_mapping_policy_ref": contract["statusMappingPolicyRef"],
                    "declared_bundle_policy_refs": bundle_refs,
                    "contract_state": contract["contractState"],
                    "source_refs": "; ".join(contract["source_refs"]),
                }
            )

    rows.append(
        {
            "fhir_representation_contract_id": "COMPILER_064_EXCHANGE_BUNDLE_RUNTIME",
            "governing_aggregate_type": "FhirExchangeBundle",
            "representation_purpose": "external_interchange",
            "resource_type": "Bundle",
            "profile_canonical_url": "https://vecells.example/fhir/StructureDefinition/vecells-exchange-bundle",
            "identifier_policy_ref": "compiler_managed_bundle_identifier_policy",
            "status_mapping_policy_ref": "compiler_managed_bundle_exchange_state",
            "declared_bundle_policy_refs": "compiler_managed_bundle_runtime",
            "contract_state": "active",
            "source_refs": "blueprint/phase-0-the-foundation-protocol.md#FhirExchangeBundle; prompt/064",
        }
    )

    with MATRIX_PATH.open("w", newline="") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=[
                "fhir_representation_contract_id",
                "governing_aggregate_type",
                "representation_purpose",
                "resource_type",
                "profile_canonical_url",
                "identifier_policy_ref",
                "status_mapping_policy_ref",
                "declared_bundle_policy_refs",
                "contract_state",
                "source_refs",
            ],
        )
        writer.writeheader()
        writer.writerows(rows)


def write_docs(manifest: dict) -> None:
    DESIGN_DOC_PATH.write_text(
        "\n".join(
            [
                "# 64 FHIR Mapping Compiler Design",
                "",
                "## Outcome",
                "",
                "Seq_064 turns the seq_049 contract catalog into a real runtime compiler and append-only persistence seam. Domain aggregates remain authoritative while the compiler materializes replay-safe `FhirRepresentationSet`, `FhirResourceRecord`, and `FhirExchangeBundle` rows only from published `FhirRepresentationContract` definitions.",
                "",
                "## Runtime Homes",
                "",
                "- Shared package compiler: `packages/fhir-mapping/src/representation-compiler.ts`",
                "- Shared package schemas: `packages/fhir-mapping/schemas/*.schema.json`",
                "- Command API seam: `services/command-api/src/fhir-mapping.ts`",
                "- Persistence migration: `services/command-api/migrations/064_fhir_mapping_compiler.sql`",
                "",
                "## Coverage",
                "",
                f"- Published representation contracts: `{manifest['summary']['representation_contract_count']}`",
                f"- Governing aggregate types: `{manifest['summary']['governing_aggregate_type_count']}`",
                f"- Canonical resource types: `{manifest['summary']['canonical_resource_type_count']}`",
                f"- Persistence tables: `{manifest['summary']['persistence_table_count']}`",
                f"- Schemas: `{manifest['summary']['schema_count']}`",
                "",
                "## Compiler Law",
                "",
                "- Contracts are validated before runtime use; unsupported resource types, profile drift, or unpublished rows fail closed.",
                "- Deterministic ids and hashes are derived from contract, aggregate ref, aggregate version, and policy refs.",
                "- Replay returns the existing representation set instead of minting silent forks.",
                "- Aggregate version advance supersedes prior set, resource, and bundle rows append-only.",
                "- Adapter consumption is guarded by declared contract refs and allowed bundle types.",
            ]
        )
        + "\n"
    )

    RULES_DOC_PATH.write_text(
        "\n".join(
            [
                "# 64 FHIR Representation Set Rules",
                "",
                "## Invariant Matrix",
                "",
                "| Invariant | Scope | Rule |",
                "| --- | --- | --- |",
                *[
                    f"| `{row['invariant_id']}` | `{row['scope']}` | {row['rule']} |"
                    for row in INVARIANT_ROWS
                ],
                "",
                "## Resource Families",
                "",
                "- `Task` remains the canonical request-shaped FHIR representation for request truth.",
                "- `ServiceRequest` appears only when the published contract says a real clinical or external commitment exists.",
                "- `DocumentReference`, `Communication`, `Consent`, `AuditEvent`, and `Provenance` are emitted as governed representation products, never hidden lifecycle owners.",
                "- `Bundle` remains an exchange product bound to published bundle law and adapter profiles.",
            ]
        )
        + "\n"
    )


def main() -> None:
    contracts_payload = read_json(CONTRACTS_PATH)
    manifest = build_manifest(contracts_payload)
    write_json(MANIFEST_PATH, manifest)
    write_matrix(contracts_payload)
    write_docs(manifest)
    patch_root_package_json()
    patch_fhir_mapping_index()
    patch_fhir_mapping_package_json()
    patch_command_api_package_json()
    print("par_064 FHIR mapping compiler artifacts generated")


if __name__ == "__main__":
    main()
