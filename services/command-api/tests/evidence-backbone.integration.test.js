import { describe, expect, it } from "vitest";
import {
  createEvidenceBackboneApplication,
  evidenceBackbonePersistenceTables,
} from "../src/evidence-backbone.ts";

describe("evidence backbone application seam", () => {
  it("composes immutable capture, derivation, parity, and snapshot services through command-api", async () => {
    const application = createEvidenceBackboneApplication();

    await application.services.artifacts.registerSourceArtifact({
      artifactId: "artifact_source_payload_001",
      locator: "object://evidence/source/payload-001.json",
      checksum: "sha256_source_payload_001",
      mediaType: "application/json",
      byteLength: 128,
      createdAt: "2026-04-12T13:00:00Z",
    });

    const captureBundle = await application.services.captureBundles.freezeCaptureBundle({
      captureBundleId: "capture_bundle_001",
      evidenceLineageRef: "request_001",
      sourceChannel: "self_service_form",
      replayClass: "distinct",
      capturePolicyVersion: "capture_policy_v1",
      sourceHash: "hash_raw_001",
      semanticHash: "hash_sem_001",
      sourceArtifactRefs: ["artifact_source_payload_001"],
      createdAt: "2026-04-12T13:00:01Z",
    });

    await application.services.artifacts.registerDerivedArtifact({
      artifactId: "artifact_normalized_001",
      locator: "object://evidence/derived/normalized-001.json",
      checksum: "sha256_normalized_001",
      mediaType: "application/json",
      byteLength: 96,
      createdAt: "2026-04-12T13:00:02Z",
    });
    const normalized = await application.services.derivations.createDerivationPackage({
      derivationPackageId: "derivation_normalized_001",
      captureBundleRef: captureBundle.captureBundleId,
      derivationClass: "canonical_normalization",
      derivationVersion: "norm_v1",
      policyVersionRef: "norm_policy_v1",
      derivedArtifactRef: "artifact_normalized_001",
      createdAt: "2026-04-12T13:00:02Z",
    });

    await application.services.artifacts.registerDerivedArtifact({
      artifactId: "artifact_patient_summary_001",
      locator: "object://evidence/derived/patient-summary-001.json",
      checksum: "sha256_patient_summary_001",
      mediaType: "application/json",
      byteLength: 48,
      createdAt: "2026-04-12T13:00:03Z",
    });
    const patientSummary = await application.services.derivations.createDerivationPackage({
      derivationPackageId: "derivation_patient_summary_001",
      captureBundleRef: captureBundle.captureBundleId,
      derivationClass: "patient_safe_summary",
      derivationVersion: "patient_summary_v1",
      policyVersionRef: "summary_policy_v1",
      derivedArtifactRef: "artifact_patient_summary_001",
      createdAt: "2026-04-12T13:00:03Z",
    });

    const parity = await application.services.summaryParity.createSummaryParityRecord({
      parityRecordId: "parity_001",
      captureBundleRef: captureBundle.captureBundleId,
      normalizedDerivationPackageRef: normalized.derivationPackageId,
      summaryDerivationPackageRef: patientSummary.derivationPackageId,
      summaryKind: "patient_safe_summary",
      parityPolicyVersion: "parity_policy_v1",
      createdAt: "2026-04-12T13:00:04Z",
    });

    const snapshot = await application.services.snapshots.createEvidenceSnapshot({
      evidenceSnapshotId: "snapshot_001",
      captureBundleRef: captureBundle.captureBundleId,
      authoritativeNormalizedDerivationPackageRef: normalized.derivationPackageId,
      currentSummaryParityRecordRef: parity.parityRecordId,
      createdAt: "2026-04-12T13:00:05Z",
    });

    expect(application.migrationPlanRef).toBe(
      "services/command-api/migrations/063_evidence_backbone.sql",
    );
    expect(evidenceBackbonePersistenceTables).toEqual([
      "evidence_source_artifacts",
      "evidence_derived_artifacts",
      "evidence_redacted_artifacts",
      "evidence_capture_bundles",
      "evidence_derivation_packages",
      "evidence_redaction_transforms",
      "evidence_summary_parity_records",
      "evidence_snapshots",
    ]);
    expect(snapshot.toSnapshot().currentSummaryParityRecordRef).toBe("parity_001");
    expect(
      (await application.repositories.getCurrentEvidenceSnapshotForLineage("request_001"))
        ?.evidenceSnapshotId,
    ).toBe("snapshot_001");
  });

  it("keeps technical-only derivations unattached and supersedes snapshots append-only on material change", async () => {
    const application = createEvidenceBackboneApplication();

    await application.services.artifacts.registerSourceArtifact({
      artifactId: "artifact_source_payload_002",
      locator: "object://evidence/source/payload-002.json",
      checksum: "sha256_source_payload_002",
      mediaType: "application/json",
      byteLength: 140,
      createdAt: "2026-04-12T13:10:00Z",
    });
    const captureBundle = await application.services.captureBundles.freezeCaptureBundle({
      captureBundleId: "capture_bundle_002",
      evidenceLineageRef: "request_002",
      sourceChannel: "telephony_capture",
      replayClass: "collision_review",
      capturePolicyVersion: "capture_policy_v1",
      sourceHash: "hash_raw_002",
      semanticHash: "hash_sem_002",
      sourceArtifactRefs: ["artifact_source_payload_002"],
      createdAt: "2026-04-12T13:10:01Z",
    });

    await application.services.artifacts.registerDerivedArtifact({
      artifactId: "artifact_normalized_002",
      locator: "object://evidence/derived/normalized-002.json",
      checksum: "sha256_normalized_002",
      mediaType: "application/json",
      byteLength: 90,
      createdAt: "2026-04-12T13:10:02Z",
    });
    const normalized = await application.services.derivations.createDerivationPackage({
      derivationPackageId: "derivation_normalized_002",
      captureBundleRef: captureBundle.captureBundleId,
      derivationClass: "canonical_normalization",
      derivationVersion: "norm_v1",
      policyVersionRef: "norm_policy_v1",
      derivedArtifactRef: "artifact_normalized_002",
      createdAt: "2026-04-12T13:10:02Z",
    });

    const initialSnapshot = await application.services.snapshots.createEvidenceSnapshot({
      evidenceSnapshotId: "snapshot_010",
      captureBundleRef: captureBundle.captureBundleId,
      authoritativeNormalizedDerivationPackageRef: normalized.derivationPackageId,
      createdAt: "2026-04-12T13:10:03Z",
    });

    await application.services.artifacts.registerDerivedArtifact({
      artifactId: "artifact_transcript_002_v2",
      locator: "object://evidence/derived/transcript-002-v2.txt",
      checksum: "sha256_transcript_002_v2",
      mediaType: "text/plain",
      byteLength: 50,
      createdAt: "2026-04-12T13:10:04Z",
    });
    const technicalOnly = await application.services.assimilation.assimilateDerivationRevision({
      derivationPackage: {
        derivationPackageId: "derivation_transcript_002_v2",
        captureBundleRef: captureBundle.captureBundleId,
        derivationClass: "transcript",
        derivationVersion: "transcript_v2",
        policyVersionRef: "transcript_policy_v2",
        derivedArtifactRef: "artifact_transcript_002_v2",
        createdAt: "2026-04-12T13:10:04Z",
      },
      materialDeltaDisposition: "technical_only",
    });

    await application.services.artifacts.registerDerivedArtifact({
      artifactId: "artifact_facts_002_v2",
      locator: "object://evidence/derived/facts-002-v2.json",
      checksum: "sha256_facts_002_v2",
      mediaType: "application/json",
      byteLength: 72,
      createdAt: "2026-04-12T13:10:05Z",
    });
    const materialChange = await application.services.assimilation.assimilateDerivationRevision({
      derivationPackage: {
        derivationPackageId: "derivation_facts_002_v2",
        captureBundleRef: captureBundle.captureBundleId,
        derivationClass: "structured_fact_extraction",
        derivationVersion: "facts_v2",
        policyVersionRef: "facts_policy_v2",
        derivedArtifactRef: "artifact_facts_002_v2",
        createdAt: "2026-04-12T13:10:05Z",
      },
      materialDeltaDisposition: "clinical_meaning_changed",
      snapshotIntent: {
        evidenceSnapshotId: "snapshot_011",
        authoritativeNormalizedDerivationPackageRef: normalized.derivationPackageId,
        createdAt: "2026-04-12T13:10:06Z",
      },
    });

    expect(technicalOnly.evidenceSnapshot).toBeNull();
    expect(materialChange.evidenceSnapshot?.toSnapshot().supersedesEvidenceSnapshotRef).toBe(
      initialSnapshot.evidenceSnapshotId,
    );
    expect(
      (await application.repositories.getCurrentEvidenceSnapshotForLineage("request_002"))
        ?.evidenceSnapshotId,
    ).toBe("snapshot_011");
  });
});
