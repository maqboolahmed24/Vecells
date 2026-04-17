#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path
from textwrap import dedent


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"

TASK_ID = "par_063"
CAPTURED_ON = "2026-04-12"
GENERATED_AT = "2026-04-12T00:00:00+00:00"

MANIFEST_PATH = DATA_DIR / "evidence_object_manifest.json"
MATRIX_PATH = DATA_DIR / "evidence_pipeline_invariant_matrix.csv"
DESIGN_DOC_PATH = DOCS_DIR / "63_evidence_backbone_design.md"
RULES_DOC_PATH = DOCS_DIR / "63_evidence_immutability_and_parity_rules.md"
INTAKE_SAFETY_INDEX_PATH = ROOT / "packages" / "domains" / "intake_safety" / "src" / "index.ts"

SOURCE_PRECEDENCE = [
    "prompt/063.md",
    "prompt/shared_operating_contract_056_to_065.md",
    "blueprint/phase-0-the-foundation-protocol.md#EvidenceSnapshot",
    "blueprint/phase-0-the-foundation-protocol.md#EvidenceCaptureBundle",
    "blueprint/phase-0-the-foundation-protocol.md#EvidenceDerivationPackage",
    "blueprint/phase-0-the-foundation-protocol.md#EvidenceRedactionTransform",
    "blueprint/phase-0-the-foundation-protocol.md#EvidenceSummaryParityRecord",
    "blueprint/phase-0-the-foundation-protocol.md#4.3B Evidence immutability, derivation, and parity",
    "blueprint/phase-1-the-red-flag-gate.md#Submit algorithm",
    "blueprint/phase-2-identity-and-echoes.md#Convergence into one request model and one workflow",
    "blueprint/forensic-audit-findings.md#Finding-03",
    "blueprint/phase-cards.md#Card 1: Phase 0 - Foundation",
    "blueprint/callback-and-clinician-messaging-loop.md#Purpose",
    "data/analysis/domain_package_manifest.json#EvidenceSnapshot",
]

EVIDENCE_OBJECTS = [
    {
        "objectId": "OBJ_063_CAPTURE_BUNDLE",
        "name": "EvidenceCaptureBundle",
        "kind": "immutable_document",
        "packageName": "@vecells/domain-intake-safety",
        "repoPath": "packages/domains/intake_safety/src/evidence-backbone.ts",
        "persistenceTable": "evidence_capture_bundles",
        "authoritativeBoundary": "frozen_pre_normalization_source_bundle",
        "sourceRefs": [
            "blueprint/phase-0-the-foundation-protocol.md#EvidenceCaptureBundle",
            "blueprint/phase-0-the-foundation-protocol.md#4.3B Evidence immutability, derivation, and parity",
            "blueprint/forensic-audit-findings.md#Finding-03",
        ],
    },
    {
        "objectId": "OBJ_063_DERIVATION_PACKAGE",
        "name": "EvidenceDerivationPackage",
        "kind": "immutable_document",
        "packageName": "@vecells/domain-intake-safety",
        "repoPath": "packages/domains/intake_safety/src/evidence-backbone.ts",
        "persistenceTable": "evidence_derivation_packages",
        "authoritativeBoundary": "append_only_derived_artifact_lineage",
        "sourceRefs": [
            "blueprint/phase-0-the-foundation-protocol.md#EvidenceDerivationPackage",
            "blueprint/phase-0-the-foundation-protocol.md#4.3B Evidence immutability, derivation, and parity",
            "prompt/063.md",
        ],
    },
    {
        "objectId": "OBJ_063_REDACTION_TRANSFORM",
        "name": "EvidenceRedactionTransform",
        "kind": "immutable_document",
        "packageName": "@vecells/domain-intake-safety",
        "repoPath": "packages/domains/intake_safety/src/evidence-backbone.ts",
        "persistenceTable": "evidence_redaction_transforms",
        "authoritativeBoundary": "policy_versioned_redaction_history",
        "sourceRefs": [
            "blueprint/phase-0-the-foundation-protocol.md#EvidenceRedactionTransform",
            "blueprint/phase-0-the-foundation-protocol.md#4.3B Evidence immutability, derivation, and parity",
            "prompt/063.md",
        ],
    },
    {
        "objectId": "OBJ_063_SUMMARY_PARITY_RECORD",
        "name": "EvidenceSummaryParityRecord",
        "kind": "immutable_document",
        "packageName": "@vecells/domain-intake-safety",
        "repoPath": "packages/domains/intake_safety/src/evidence-backbone.ts",
        "persistenceTable": "evidence_summary_parity_records",
        "authoritativeBoundary": "authoritative_summary_gate",
        "sourceRefs": [
            "blueprint/phase-0-the-foundation-protocol.md#EvidenceSummaryParityRecord",
            "blueprint/phase-0-the-foundation-protocol.md#4.3B Evidence immutability, derivation, and parity",
            "blueprint/patient-account-and-communications-blueprint.md#PatientRequestSummaryProjection",
        ],
    },
    {
        "objectId": "OBJ_063_EVIDENCE_SNAPSHOT",
        "name": "EvidenceSnapshot",
        "kind": "immutable_document",
        "packageName": "@vecells/domain-intake-safety",
        "repoPath": "packages/domains/intake_safety/src/evidence-backbone.ts",
        "persistenceTable": "evidence_snapshots",
        "authoritativeBoundary": "single_join_of_frozen_source_and_authority_refs",
        "sourceRefs": [
            "blueprint/phase-0-the-foundation-protocol.md#EvidenceSnapshot",
            "blueprint/phase-0-the-foundation-protocol.md#4.3B Evidence immutability, derivation, and parity",
            "blueprint/forensic-audit-findings.md#Finding-03",
        ],
    },
]

SERVICES = [
    {
        "serviceId": "SRV_063_CAPTURE_FREEZE",
        "name": "EvidenceCaptureBundleService",
        "home": "@vecells/domain-intake-safety::EvidenceCaptureBundleService",
        "method": "freezeCaptureBundle",
        "effect": "freeze one immutable capture bundle before normalization or replay branching",
    },
    {
        "serviceId": "SRV_063_DERIVATION_CREATE",
        "name": "EvidenceDerivationPackageService",
        "home": "@vecells/domain-intake-safety::EvidenceDerivationPackageService",
        "method": "createDerivationPackage",
        "effect": "append immutable derivation packages pinned to source bundle hash and derivation version",
    },
    {
        "serviceId": "SRV_063_REDACTION_CREATE",
        "name": "EvidenceRedactionTransformService",
        "home": "@vecells/domain-intake-safety::EvidenceRedactionTransformService",
        "method": "createRedactionTransform",
        "effect": "append immutable redaction transforms that preserve source hash and policy version",
    },
    {
        "serviceId": "SRV_063_PARITY_VERIFY",
        "name": "EvidenceSummaryParityService",
        "home": "@vecells/domain-intake-safety::EvidenceSummaryParityService",
        "method": "createSummaryParityRecord",
        "effect": "issue explicit verified, stale, blocked, or superseded parity records before summary authority",
    },
    {
        "serviceId": "SRV_063_SNAPSHOT_CREATE",
        "name": "EvidenceSnapshotService",
        "home": "@vecells/domain-intake-safety::EvidenceSnapshotService",
        "method": "createEvidenceSnapshot",
        "effect": "mint one immutable EvidenceSnapshot join over frozen source and authoritative refs",
    },
    {
        "serviceId": "SRV_063_ASSIMILATION",
        "name": "EvidenceAssimilationCoordinator",
        "home": "@vecells/domain-intake-safety::EvidenceAssimilationCoordinator",
        "method": "assimilateDerivationRevision",
        "effect": "append late derivations and mint superseding snapshots only when material meaning changes",
    },
]

STORAGE_CLASSES = [
    {
        "storageId": "ST_063_SOURCE_ARTIFACTS",
        "name": "SourceArtifactStorage",
        "persistenceTable": "evidence_source_artifacts",
        "disposition": "opaque object references only; raw bytes remain outside primary relational objects",
    },
    {
        "storageId": "ST_063_DERIVED_ARTIFACTS",
        "name": "DerivedArtifactStorage",
        "persistenceTable": "evidence_derived_artifacts",
        "disposition": "normalized, transcript, fact, and summary artifacts remain externalized by locator plus checksum",
    },
    {
        "storageId": "ST_063_REDACTED_ARTIFACTS",
        "name": "RedactedArtifactStorage",
        "persistenceTable": "evidence_redacted_artifacts",
        "disposition": "redacted variants remain separate immutable artifacts linked back to the source checksum chain",
    },
]

INVARIANT_ROWS = [
    {
        "invariant_id": "INV_063_FREEZE_BEFORE_NORMALIZATION",
        "scope": "EvidenceCaptureBundle",
        "rule": "Canonical normalization may not run before one immutable capture bundle exists.",
        "enforced_by": "packages/domains/intake_safety/src/evidence-backbone.ts::EvidenceDerivationPackageService.createDerivationPackage",
        "verified_by": "packages/domains/intake_safety/tests/evidence-backbone.test.ts",
        "source_refs": "blueprint/phase-0-the-foundation-protocol.md#4.3B Evidence immutability, derivation, and parity; blueprint/forensic-audit-findings.md#Finding-03",
    },
    {
        "invariant_id": "INV_063_CAPTURE_BUNDLE_APPEND_ONLY",
        "scope": "EvidenceCaptureBundle",
        "rule": "Capture bundles are append-only rows and may never be rewritten in place.",
        "enforced_by": "packages/domains/intake_safety/src/evidence-backbone.ts::appendOnlyInsert",
        "verified_by": "packages/domains/intake_safety/tests/evidence-backbone.test.ts",
        "source_refs": "prompt/063.md; blueprint/phase-0-the-foundation-protocol.md#4.3B Evidence immutability, derivation, and parity",
    },
    {
        "invariant_id": "INV_063_DERIVATION_APPEND_ONLY",
        "scope": "EvidenceDerivationPackage",
        "rule": "Late transcript, normalization, fact, and summary reruns append new derivation packages instead of mutating prior output.",
        "enforced_by": "packages/domains/intake_safety/src/evidence-backbone.ts::EvidenceDerivationPackageService.createDerivationPackage",
        "verified_by": "packages/domains/intake_safety/tests/evidence-backbone.test.ts; services/command-api/tests/evidence-backbone.integration.test.js",
        "source_refs": "blueprint/phase-0-the-foundation-protocol.md#4.3B Evidence immutability, derivation, and parity; blueprint/phase-2-identity-and-echoes.md#Convergence into one request model and one workflow",
    },
    {
        "invariant_id": "INV_063_REDACTION_IS_NONDESTRUCTIVE",
        "scope": "EvidenceRedactionTransform",
        "rule": "Redaction narrows visibility through immutable transforms and preserves the source hash and redaction policy version.",
        "enforced_by": "packages/domains/intake_safety/src/evidence-backbone.ts::EvidenceRedactionTransformService.createRedactionTransform",
        "verified_by": "packages/domains/intake_safety/tests/evidence-backbone.test.ts",
        "source_refs": "blueprint/phase-0-the-foundation-protocol.md#4.3B Evidence immutability, derivation, and parity; prompt/063.md",
    },
    {
        "invariant_id": "INV_063_PARITY_REQUIRED_FOR_AUTHORITY",
        "scope": "EvidenceSummaryParityRecord",
        "rule": "Only parityState = verified may back an authoritative summary in an immutable snapshot.",
        "enforced_by": "packages/domains/intake_safety/src/evidence-backbone.ts::EvidenceSnapshotService.createEvidenceSnapshot",
        "verified_by": "packages/domains/intake_safety/tests/evidence-backbone.test.ts",
        "source_refs": "blueprint/phase-0-the-foundation-protocol.md#4.3B Evidence immutability, derivation, and parity; blueprint/patient-account-and-communications-blueprint.md#PatientRequestSummaryProjection",
    },
    {
        "invariant_id": "INV_063_PARITY_STATE_EXPLICIT",
        "scope": "EvidenceSummaryParityRecord",
        "rule": "Summary parity records must resolve through explicit verified, stale, blocked, or superseded states.",
        "enforced_by": "packages/domains/intake_safety/src/evidence-backbone.ts::EvidenceSummaryParityService.createSummaryParityRecord",
        "verified_by": "packages/domains/intake_safety/tests/evidence-backbone.test.ts",
        "source_refs": "prompt/063.md; blueprint/phase-0-the-foundation-protocol.md#4.3B Evidence immutability, derivation, and parity",
    },
    {
        "invariant_id": "INV_063_SNAPSHOT_SINGLE_CURRENT",
        "scope": "EvidenceSnapshot",
        "rule": "Each evidence lineage may resolve to at most one current EvidenceSnapshot; supersession must reference the current authority.",
        "enforced_by": "packages/domains/intake_safety/src/evidence-backbone.ts::EvidenceSnapshotService.createEvidenceSnapshot; packages/domains/intake_safety/src/evidence-backbone.ts::InMemoryEvidenceBackboneStore.getCurrentEvidenceSnapshotForLineage",
        "verified_by": "packages/domains/intake_safety/tests/evidence-backbone.test.ts; services/command-api/tests/evidence-backbone.integration.test.js",
        "source_refs": "blueprint/phase-0-the-foundation-protocol.md#EvidenceSnapshot; prompt/063.md",
    },
    {
        "invariant_id": "INV_063_TECHNICAL_ONLY_UNATTACHED",
        "scope": "EvidenceAssimilationCoordinator",
        "rule": "technical_only and operational_nonclinical revisions stay unattached when policy allows and do not mutate prior snapshot truth.",
        "enforced_by": "packages/domains/intake_safety/src/evidence-backbone.ts::EvidenceAssimilationCoordinator.assimilateDerivationRevision",
        "verified_by": "packages/domains/intake_safety/tests/evidence-backbone.test.ts; services/command-api/tests/evidence-backbone.integration.test.js",
        "source_refs": "blueprint/phase-0-the-foundation-protocol.md#4.3B Evidence immutability, derivation, and parity; prompt/063.md",
    },
    {
        "invariant_id": "INV_063_MATERIAL_CHANGE_SUPERSEDES",
        "scope": "EvidenceAssimilationCoordinator",
        "rule": "Clinically material, triage, delivery, or patient-visible interpretation changes create a new immutable snapshot through append-only supersession.",
        "enforced_by": "packages/domains/intake_safety/src/evidence-backbone.ts::EvidenceAssimilationCoordinator.assimilateDerivationRevision",
        "verified_by": "packages/domains/intake_safety/tests/evidence-backbone.test.ts; services/command-api/tests/evidence-backbone.integration.test.js",
        "source_refs": "blueprint/phase-0-the-foundation-protocol.md#4.3B Evidence immutability, derivation, and parity; blueprint/callback-and-clinician-messaging-loop.md#Purpose",
    },
    {
        "invariant_id": "INV_063_REPLAY_CLASSES_PRESERVE_FROZEN_EVIDENCE",
        "scope": "EvidenceCaptureBundle",
        "rule": "Replay and collision-review classes preserve immutable frozen evidence instead of skipping bundle freeze.",
        "enforced_by": "packages/domains/intake_safety/src/evidence-backbone.ts::EvidenceCaptureBundleService.freezeCaptureBundle",
        "verified_by": "packages/domains/intake_safety/tests/evidence-backbone.test.ts; services/command-api/tests/evidence-backbone.integration.test.js",
        "source_refs": "prompt/063.md; blueprint/phase-0-the-foundation-protocol.md#4.1 Command ingest and envelope creation; blueprint/phase-1-the-red-flag-gate.md#Submit algorithm",
    },
]


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n")


def write_json(path: Path, payload: object) -> None:
    write_text(path, json.dumps(payload, indent=2))


def write_csv(path: Path, rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)


def ensure_index_export() -> None:
    export_line = 'export * from "./evidence-backbone";'
    text = INTAKE_SAFETY_INDEX_PATH.read_text()
    if export_line not in text:
        write_text(INTAKE_SAFETY_INDEX_PATH, text.rstrip() + "\n\n" + export_line)


def build_manifest() -> dict[str, object]:
    implementation_files = [
        "packages/domains/intake_safety/src/evidence-backbone.ts",
        "packages/domains/intake_safety/src/index.ts",
        "packages/domains/intake_safety/tests/evidence-backbone.test.ts",
        "services/command-api/src/evidence-backbone.ts",
        "services/command-api/migrations/063_evidence_backbone.sql",
        "services/command-api/tests/evidence-backbone.integration.test.js",
        "docs/architecture/63_evidence_backbone_design.md",
        "docs/architecture/63_evidence_immutability_and_parity_rules.md",
        "data/analysis/evidence_object_manifest.json",
        "data/analysis/evidence_pipeline_invariant_matrix.csv",
        "tools/analysis/build_evidence_backbone.py",
        "tools/analysis/validate_evidence_backbone.py",
    ]
    return {
        "task_id": TASK_ID,
        "captured_on": CAPTURED_ON,
        "generated_at": GENERATED_AT,
        "mission": (
            "Canonical immutable evidence backbone for frozen source capture, append-only derivation, "
            "non-destructive redaction, parity-gated summaries, and append-only snapshot supersession."
        ),
        "source_precedence": SOURCE_PRECEDENCE,
        "evidence_objects": EVIDENCE_OBJECTS,
        "services": SERVICES,
        "storage_classes": STORAGE_CLASSES,
        "implementation_files": implementation_files,
        "summary": {
            "evidence_object_count": len(EVIDENCE_OBJECTS),
            "service_count": len(SERVICES),
            "storage_class_count": len(STORAGE_CLASSES),
            "persistence_table_count": 8,
            "implementation_file_count": len(implementation_files),
            "invariant_count": len(INVARIANT_ROWS),
        },
    }


def build_design_doc(manifest: dict[str, object]) -> str:
    object_lines = "\n".join(
        f"- `{row['name']}`: `{row['authoritativeBoundary']}` via `{row['persistenceTable']}` in `{row['packageName']}`."
        for row in EVIDENCE_OBJECTS
    )
    service_lines = "\n".join(
        f"- `{row['name']}.{row['method']}`: {row['effect']}."
        for row in SERVICES
    )
    storage_lines = "\n".join(
        f"- `{row['name']}` -> `{row['persistenceTable']}`: {row['disposition']}."
        for row in STORAGE_CLASSES
    )
    source_lines = "\n".join(f"- `{ref}`" for ref in manifest["source_precedence"])
    implementation_lines = "\n".join(
        f"- `{path}`" for path in manifest["implementation_files"]
    )
    return (
        f"# 63 Evidence Backbone Design\n\n"
        f"`par_063` closes the Phase 0 evidence gap by implementing the immutable source, "
        f"derivation, redaction, parity, and snapshot backbone in checked-in backend code. "
        f"The implementation lives in `@vecells/domain-intake-safety`, is composed into "
        f"`@vecells/command-api`, and keeps raw bytes externalized behind immutable artifact "
        f"locators plus checksums.\n\n"
        f"## Source Precedence\n\n"
        f"{source_lines}\n\n"
        f"## Aggregate Homes\n\n"
        f"{object_lines}\n\n"
        f"## Service Homes\n\n"
        f"{service_lines}\n\n"
        f"## Artifact Storage Classes\n\n"
        f"{storage_lines}\n\n"
        f"## Gap Closures\n\n"
        f"- Finding `03` is closed by requiring `EvidenceCaptureBundle` before "
        f"`EvidenceDerivationPackage(canonical_normalization)`.\n"
        f"- Late transcript improvement, enrichment, schema migration, and redaction changes are "
        f"append-only revisions, not row rewrites.\n"
        f"- Authoritative summaries are blocked unless one "
        f"`EvidenceSummaryParityRecord(parityState = verified)` is bound to the same immutable "
        f"snapshot authority.\n"
        f"- Redaction narrows visibility by transform; it never rewrites frozen source or "
        f"derivation history.\n\n"
        f"## Implementation Files\n\n"
        f"{implementation_lines}"
    )


def build_rules_doc() -> str:
    matrix_rows = "\n".join(
        f"| `{row['invariant_id']}` | {row['scope']} | {row['rule']} |"
        for row in INVARIANT_ROWS
    )
    return (
        "# 63 Evidence Immutability And Parity Rules\n\n"
        "The Phase 0 evidence pipeline now runs under explicit append-only law. Source capture "
        "freezes first, derivations append next, parity records gate authority, and snapshots "
        "supersede by new rows only.\n\n"
        "## Non-Negotiables\n\n"
        "- `EvidenceCaptureBundle` freezes before canonical normalization, transcript generation, "
        "fact extraction, or summary generation.\n"
        "- Existing evidence rows are immutable. Later work appends new "
        "`EvidenceDerivationPackage`, `EvidenceRedactionTransform`, "
        "`EvidenceSummaryParityRecord`, or `EvidenceSnapshot` rows.\n"
        "- Redaction transforms preserve the source checksum chain and redaction policy version.\n"
        "- `parityState = verified` is the only legal authoritative-summary posture.\n"
        "- `technical_only` and `operational_nonclinical` revisions stay unattached when policy "
        "allows.\n\n"
        "## Invariant Matrix\n\n"
        "| Invariant | Scope | Rule |\n"
        "| --- | --- | --- |\n"
        f"{matrix_rows}"
    )


def main() -> None:
    manifest = build_manifest()
    write_json(MANIFEST_PATH, manifest)
    write_csv(MATRIX_PATH, INVARIANT_ROWS)
    write_text(DESIGN_DOC_PATH, build_design_doc(manifest))
    write_text(RULES_DOC_PATH, build_rules_doc())
    ensure_index_export()
    print("par_063 evidence backbone artifacts generated")


if __name__ == "__main__":
    main()
