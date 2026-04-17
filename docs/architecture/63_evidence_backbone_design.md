# 63 Evidence Backbone Design

`par_063` closes the Phase 0 evidence gap by implementing the immutable source, derivation, redaction, parity, and snapshot backbone in checked-in backend code. The implementation lives in `@vecells/domain-intake-safety`, is composed into `@vecells/command-api`, and keeps raw bytes externalized behind immutable artifact locators plus checksums.

## Source Precedence

- `prompt/063.md`
- `prompt/shared_operating_contract_056_to_065.md`
- `blueprint/phase-0-the-foundation-protocol.md#EvidenceSnapshot`
- `blueprint/phase-0-the-foundation-protocol.md#EvidenceCaptureBundle`
- `blueprint/phase-0-the-foundation-protocol.md#EvidenceDerivationPackage`
- `blueprint/phase-0-the-foundation-protocol.md#EvidenceRedactionTransform`
- `blueprint/phase-0-the-foundation-protocol.md#EvidenceSummaryParityRecord`
- `blueprint/phase-0-the-foundation-protocol.md#4.3B Evidence immutability, derivation, and parity`
- `blueprint/phase-1-the-red-flag-gate.md#Submit algorithm`
- `blueprint/phase-2-identity-and-echoes.md#Convergence into one request model and one workflow`
- `blueprint/forensic-audit-findings.md#Finding-03`
- `blueprint/phase-cards.md#Card 1: Phase 0 - Foundation`
- `blueprint/callback-and-clinician-messaging-loop.md#Purpose`
- `data/analysis/domain_package_manifest.json#EvidenceSnapshot`

## Aggregate Homes

- `EvidenceCaptureBundle`: `frozen_pre_normalization_source_bundle` via `evidence_capture_bundles` in `@vecells/domain-intake-safety`.
- `EvidenceDerivationPackage`: `append_only_derived_artifact_lineage` via `evidence_derivation_packages` in `@vecells/domain-intake-safety`.
- `EvidenceRedactionTransform`: `policy_versioned_redaction_history` via `evidence_redaction_transforms` in `@vecells/domain-intake-safety`.
- `EvidenceSummaryParityRecord`: `authoritative_summary_gate` via `evidence_summary_parity_records` in `@vecells/domain-intake-safety`.
- `EvidenceSnapshot`: `single_join_of_frozen_source_and_authority_refs` via `evidence_snapshots` in `@vecells/domain-intake-safety`.

## Service Homes

- `EvidenceCaptureBundleService.freezeCaptureBundle`: freeze one immutable capture bundle before normalization or replay branching.
- `EvidenceDerivationPackageService.createDerivationPackage`: append immutable derivation packages pinned to source bundle hash and derivation version.
- `EvidenceRedactionTransformService.createRedactionTransform`: append immutable redaction transforms that preserve source hash and policy version.
- `EvidenceSummaryParityService.createSummaryParityRecord`: issue explicit verified, stale, blocked, or superseded parity records before summary authority.
- `EvidenceSnapshotService.createEvidenceSnapshot`: mint one immutable EvidenceSnapshot join over frozen source and authoritative refs.
- `EvidenceAssimilationCoordinator.assimilateDerivationRevision`: append late derivations and mint superseding snapshots only when material meaning changes.

## Artifact Storage Classes

- `SourceArtifactStorage` -> `evidence_source_artifacts`: opaque object references only; raw bytes remain outside primary relational objects.
- `DerivedArtifactStorage` -> `evidence_derived_artifacts`: normalized, transcript, fact, and summary artifacts remain externalized by locator plus checksum.
- `RedactedArtifactStorage` -> `evidence_redacted_artifacts`: redacted variants remain separate immutable artifacts linked back to the source checksum chain.

## Gap Closures

- Finding `03` is closed by requiring `EvidenceCaptureBundle` before `EvidenceDerivationPackage(canonical_normalization)`.
- Late transcript improvement, enrichment, schema migration, and redaction changes are append-only revisions, not row rewrites.
- Authoritative summaries are blocked unless one `EvidenceSummaryParityRecord(parityState = verified)` is bound to the same immutable snapshot authority.
- Redaction narrows visibility by transform; it never rewrites frozen source or derivation history.

## Implementation Files

- `packages/domains/intake_safety/src/evidence-backbone.ts`
- `packages/domains/intake_safety/src/index.ts`
- `packages/domains/intake_safety/tests/evidence-backbone.test.ts`
- `services/command-api/src/evidence-backbone.ts`
- `services/command-api/migrations/063_evidence_backbone.sql`
- `services/command-api/tests/evidence-backbone.integration.test.js`
- `docs/architecture/63_evidence_backbone_design.md`
- `docs/architecture/63_evidence_immutability_and_parity_rules.md`
- `data/analysis/evidence_object_manifest.json`
- `data/analysis/evidence_pipeline_invariant_matrix.csv`
- `tools/analysis/build_evidence_backbone.py`
- `tools/analysis/validate_evidence_backbone.py`
