#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"

MANIFEST_PATH = DATA_DIR / "evidence_object_manifest.json"
MATRIX_PATH = DATA_DIR / "evidence_pipeline_invariant_matrix.csv"
DESIGN_DOC_PATH = DOCS_DIR / "63_evidence_backbone_design.md"
RULES_DOC_PATH = DOCS_DIR / "63_evidence_immutability_and_parity_rules.md"
ROOT_PACKAGE_PATH = ROOT / "package.json"


def read_json(path: Path):
    return json.loads(path.read_text())


def read_csv(path: Path):
    with path.open() as handle:
        return list(csv.DictReader(handle))


manifest = read_json(MANIFEST_PATH)
rows = read_csv(MATRIX_PATH)
package_json = read_json(ROOT_PACKAGE_PATH)

assert manifest["task_id"] == "par_063"
assert manifest["summary"]["evidence_object_count"] == 5
assert manifest["summary"]["service_count"] == 6
assert manifest["summary"]["storage_class_count"] == 3
assert manifest["summary"]["persistence_table_count"] == 8
assert manifest["summary"]["implementation_file_count"] == 12
assert manifest["summary"]["invariant_count"] == 10
assert len(manifest["evidence_objects"]) == 5
assert len(manifest["services"]) == 6
assert len(manifest["storage_classes"]) == 3
assert len(rows) == 10

object_names = {row["name"] for row in manifest["evidence_objects"]}
assert object_names == {
    "EvidenceCaptureBundle",
    "EvidenceDerivationPackage",
    "EvidenceRedactionTransform",
    "EvidenceSummaryParityRecord",
    "EvidenceSnapshot",
}

service_names = {row["name"] for row in manifest["services"]}
assert service_names == {
    "EvidenceCaptureBundleService",
    "EvidenceDerivationPackageService",
    "EvidenceRedactionTransformService",
    "EvidenceSummaryParityService",
    "EvidenceSnapshotService",
    "EvidenceAssimilationCoordinator",
}

for rel_path in manifest["implementation_files"]:
    assert (ROOT / rel_path).exists(), rel_path

assert DESIGN_DOC_PATH.exists()
assert RULES_DOC_PATH.exists()
assert "## Aggregate Homes" in DESIGN_DOC_PATH.read_text()
assert "## Invariant Matrix" in RULES_DOC_PATH.read_text()

scripts = package_json["scripts"]
assert "build_evidence_backbone.py" in scripts["codegen"]
assert "pnpm validate:evidence-backbone" in scripts["check"]
assert "pnpm validate:evidence-backbone" in scripts["bootstrap"]
assert scripts["validate:evidence-backbone"] == "python3 ./tools/analysis/validate_evidence_backbone.py"

intake_index = (ROOT / "packages" / "domains" / "intake_safety" / "src" / "index.ts").read_text()
assert 'export * from "./evidence-backbone";' in intake_index

evidence_source = (
    ROOT / "packages" / "domains" / "intake_safety" / "src" / "evidence-backbone.ts"
).read_text()
for token in [
    "class EvidenceCaptureBundleService",
    "class EvidenceDerivationPackageService",
    "class EvidenceRedactionTransformService",
    "class EvidenceSummaryParityService",
    "class EvidenceSnapshotService",
    "class EvidenceAssimilationCoordinator",
    "SNAPSHOT_PARITY_RECORD_NOT_VERIFIED",
    "DERIVATION_REQUIRES_CAPTURE_BUNDLE",
]:
    assert token in evidence_source, token

command_api_source = (
    ROOT / "services" / "command-api" / "src" / "evidence-backbone.ts"
).read_text()
for token in [
    "createEvidenceBackboneApplication",
    "evidenceBackbonePersistenceTables",
    "services/command-api/migrations/063_evidence_backbone.sql",
]:
    assert token in command_api_source, token

migration_source = (
    ROOT / "services" / "command-api" / "migrations" / "063_evidence_backbone.sql"
).read_text()
for table_name in [
    "evidence_source_artifacts",
    "evidence_derived_artifacts",
    "evidence_redacted_artifacts",
    "evidence_capture_bundles",
    "evidence_derivation_packages",
    "evidence_redaction_transforms",
    "evidence_summary_parity_records",
    "evidence_snapshots",
]:
    assert table_name in migration_source, table_name

invariant_ids = {row["invariant_id"] for row in rows}
assert "INV_063_FREEZE_BEFORE_NORMALIZATION" in invariant_ids
assert "INV_063_PARITY_REQUIRED_FOR_AUTHORITY" in invariant_ids
assert "INV_063_MATERIAL_CHANGE_SUPERSEDES" in invariant_ids

print("par_063 evidence backbone validation passed")
