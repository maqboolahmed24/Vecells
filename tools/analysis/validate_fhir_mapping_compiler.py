#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"

MANIFEST_PATH = DATA_DIR / "fhir_representation_contract_manifest.json"
MATRIX_PATH = DATA_DIR / "fhir_resource_type_matrix.csv"
DESIGN_DOC_PATH = DOCS_DIR / "64_fhir_mapping_compiler_design.md"
RULES_DOC_PATH = DOCS_DIR / "64_fhir_representation_set_rules.md"
ROOT_PACKAGE_PATH = ROOT / "package.json"
PACKAGE_INDEX_PATH = ROOT / "packages" / "fhir-mapping" / "src" / "index.ts"
PACKAGE_JSON_PATH = ROOT / "packages" / "fhir-mapping" / "package.json"
COMMAND_API_PACKAGE_JSON_PATH = ROOT / "services" / "command-api" / "package.json"
COMPILER_PATH = ROOT / "packages" / "fhir-mapping" / "src" / "representation-compiler.ts"
COMMAND_API_SEAM_PATH = ROOT / "services" / "command-api" / "src" / "fhir-mapping.ts"
MIGRATION_PATH = ROOT / "services" / "command-api" / "migrations" / "064_fhir_mapping_compiler.sql"


def read_json(path: Path):
    return json.loads(path.read_text())


def read_csv(path: Path):
    with path.open() as handle:
        return list(csv.DictReader(handle))


manifest = read_json(MANIFEST_PATH)
rows = read_csv(MATRIX_PATH)
root_package = read_json(ROOT_PACKAGE_PATH)
fhir_package = read_json(PACKAGE_JSON_PATH)
command_api_package = read_json(COMMAND_API_PACKAGE_JSON_PATH)

assert manifest["task_id"] == "par_064"
assert manifest["summary"]["representation_contract_count"] >= 10
assert manifest["summary"]["canonical_resource_type_count"] == 8
assert manifest["summary"]["persistence_table_count"] == 4
assert manifest["summary"]["schema_count"] == 3
assert manifest["summary"]["implementation_file_count"] == len(manifest["implementation_files"])
assert manifest["summary"]["invariant_count"] == len(manifest["invariants"])
assert len(rows) >= 20

for rel_path in manifest["implementation_files"]:
    assert (ROOT / rel_path).exists(), rel_path

assert DESIGN_DOC_PATH.exists()
assert RULES_DOC_PATH.exists()
assert "## Runtime Homes" in DESIGN_DOC_PATH.read_text()
assert "## Invariant Matrix" in RULES_DOC_PATH.read_text()

scripts = root_package["scripts"]
assert "build_fhir_mapping_compiler.py" in scripts["codegen"]
assert scripts["validate:fhir-compiler"] == "python3 ./tools/analysis/validate_fhir_mapping_compiler.py"
assert "pnpm validate:fhir-compiler" in scripts["check"]
assert "pnpm validate:fhir-compiler" in scripts["bootstrap"]

package_index = PACKAGE_INDEX_PATH.read_text()
assert 'export * from "./representation-compiler";' in package_index

compiler_source = COMPILER_PATH.read_text()
for token in [
    "class FhirRepresentationContractRecord",
    "class FhirRepresentationCompiler",
    "class InMemoryFhirRepresentationStore",
    "authorizeAdapterConsumption",
    "UNSUPPORTED_RESOURCE_TYPE",
    "UNSUPPORTED_BUNDLE_TYPE",
    "ADAPTER_CONSUMPTION_CONTRACT_NOT_ALLOWED",
]:
    assert token in compiler_source, token

exports = fhir_package["exports"]
assert (
    exports["./schemas/fhir-representation-set"]
    == "./schemas/fhir-representation-set.schema.json"
)
assert exports["./schemas/fhir-resource-record"] == "./schemas/fhir-resource-record.schema.json"
assert (
    exports["./schemas/fhir-exchange-bundle"]
    == "./schemas/fhir-exchange-bundle.schema.json"
)

assert command_api_package["dependencies"]["@vecells/fhir-mapping"] == "workspace:*"

command_api_source = COMMAND_API_SEAM_PATH.read_text()
for token in [
    "createFhirRepresentationCompilerApplication",
    "fhirRepresentationPersistenceTables",
    "services/command-api/migrations/064_fhir_mapping_compiler.sql",
]:
    assert token in command_api_source, token

migration_source = MIGRATION_PATH.read_text()
for table_name in [
    "fhir_representation_contracts",
    "fhir_representation_sets",
    "fhir_resource_records",
    "fhir_exchange_bundles",
]:
    assert table_name in migration_source, table_name

resource_types = {row["resource_type"] for row in rows}
assert resource_types == {
    "Task",
    "ServiceRequest",
    "DocumentReference",
    "Communication",
    "Consent",
    "AuditEvent",
    "Provenance",
    "Bundle",
}

print("par_064 FHIR mapping compiler validation passed")
