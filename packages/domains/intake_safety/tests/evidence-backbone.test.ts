import { describe, expect, it } from "vitest";
import {
  type EvidenceBackboneDependencies,
  type EvidenceBackboneServices,
  createDeterministicEvidenceIdGenerator,
  createEvidenceBackboneServices,
  createEvidenceBackboneStore,
} from "../src/index.ts";

interface SeededEvidenceFlow {
  store: EvidenceBackboneDependencies;
  services: EvidenceBackboneServices;
  captureBundleId: string;
  normalizedDerivationId: string;
  patientSummaryDerivationId: string;
  verifiedParityId: string;
  initialSnapshotId: string;
}

async function createSeededEvidenceFlow(): Promise<SeededEvidenceFlow> {
  const store = createEvidenceBackboneStore(createDeterministicEvidenceIdGenerator("store063"));
  const services = createEvidenceBackboneServices(
    store,
    createDeterministicEvidenceIdGenerator("svc063"),
  );

  await services.artifacts.registerSourceArtifact({
    artifactId: "artifact_source_payload_001",
    locator: "object://evidence/source/payload-001.json",
    checksum: "sha256_source_payload_001",
    mediaType: "application/json",
    byteLength: 128,
    createdAt: "2026-04-12T11:00:00Z",
  });
  await services.artifacts.registerSourceArtifact({
    artifactId: "artifact_source_metadata_001",
    locator: "object://evidence/source/metadata-001.json",
    checksum: "sha256_source_metadata_001",
    mediaType: "application/json",
    byteLength: 48,
    createdAt: "2026-04-12T11:00:00Z",
  });

  const captureBundle = await services.captureBundles.freezeCaptureBundle({
    captureBundleId: "capture_bundle_001",
    evidenceLineageRef: "request_001",
    sourceChannel: "self_service_form",
    replayClass: "distinct",
    transportCorrelationRef: "corr_001",
    capturePolicyVersion: "capture_policy_v1",
    sourceHash: "hash_raw_001",
    semanticHash: "hash_sem_001",
    sourceArtifactRefs: ["artifact_source_payload_001"],
    metadataArtifactRefs: ["artifact_source_metadata_001"],
    createdAt: "2026-04-12T11:01:00Z",
  });

  await services.artifacts.registerDerivedArtifact({
    artifactId: "artifact_normalized_001",
    locator: "object://evidence/derived/normalized-001.json",
    checksum: "sha256_normalized_001",
    mediaType: "application/json",
    byteLength: 96,
    createdAt: "2026-04-12T11:02:00Z",
  });
  const normalized = await services.derivations.createDerivationPackage({
    derivationPackageId: "derivation_normalized_001",
    captureBundleRef: captureBundle.captureBundleId,
    derivationClass: "canonical_normalization",
    derivationVersion: "norm_v1",
    policyVersionRef: "norm_policy_v1",
    derivedArtifactRef: "artifact_normalized_001",
    createdAt: "2026-04-12T11:02:00Z",
  });

  await services.artifacts.registerDerivedArtifact({
    artifactId: "artifact_patient_summary_001",
    locator: "object://evidence/derived/patient-summary-001.json",
    checksum: "sha256_patient_summary_001",
    mediaType: "application/json",
    byteLength: 64,
    createdAt: "2026-04-12T11:03:00Z",
  });
  const patientSummary = await services.derivations.createDerivationPackage({
    derivationPackageId: "derivation_patient_summary_001",
    captureBundleRef: captureBundle.captureBundleId,
    derivationClass: "patient_safe_summary",
    derivationVersion: "patient_summary_v1",
    policyVersionRef: "summary_policy_v1",
    derivedArtifactRef: "artifact_patient_summary_001",
    createdAt: "2026-04-12T11:03:00Z",
  });

  const parity = await services.summaryParity.createSummaryParityRecord({
    parityRecordId: "parity_001",
    captureBundleRef: captureBundle.captureBundleId,
    normalizedDerivationPackageRef: normalized.derivationPackageId,
    summaryDerivationPackageRef: patientSummary.derivationPackageId,
    summaryKind: "patient_safe_summary",
    parityPolicyVersion: "parity_policy_v1",
    createdAt: "2026-04-12T11:04:00Z",
  });

  const snapshot = await services.snapshots.createEvidenceSnapshot({
    evidenceSnapshotId: "snapshot_001",
    captureBundleRef: captureBundle.captureBundleId,
    authoritativeNormalizedDerivationPackageRef: normalized.derivationPackageId,
    currentSummaryParityRecordRef: parity.parityRecordId,
    createdAt: "2026-04-12T11:05:00Z",
  });

  return {
    store,
    services,
    captureBundleId: captureBundle.captureBundleId,
    normalizedDerivationId: normalized.derivationPackageId,
    patientSummaryDerivationId: patientSummary.derivationPackageId,
    verifiedParityId: parity.parityRecordId,
    initialSnapshotId: snapshot.evidenceSnapshotId,
  };
}

describe("immutable evidence backbone", () => {
  it("blocks canonical normalization until a capture bundle is frozen", async () => {
    const store = createEvidenceBackboneStore(createDeterministicEvidenceIdGenerator("store063a"));
    const services = createEvidenceBackboneServices(
      store,
      createDeterministicEvidenceIdGenerator("svc063a"),
    );

    await services.artifacts.registerDerivedArtifact({
      artifactId: "artifact_normalized_prebundle_001",
      locator: "object://evidence/derived/prebundle-normalized-001.json",
      checksum: "sha256_prebundle_normalized_001",
      mediaType: "application/json",
      byteLength: 80,
      createdAt: "2026-04-12T12:00:00Z",
    });

    await expect(
      services.derivations.createDerivationPackage({
        derivationPackageId: "derivation_prebundle_001",
        captureBundleRef: "missing_capture_bundle",
        derivationClass: "canonical_normalization",
        derivationVersion: "norm_v1",
        policyVersionRef: "norm_policy_v1",
        derivedArtifactRef: "artifact_normalized_prebundle_001",
        createdAt: "2026-04-12T12:00:01Z",
      }),
    ).rejects.toMatchObject({ code: "DERIVATION_REQUIRES_CAPTURE_BUNDLE" });
  });

  it("keeps capture bundles append-only and preserves frozen evidence in replay classes", async () => {
    const store = createEvidenceBackboneStore(createDeterministicEvidenceIdGenerator("store063b"));
    const services = createEvidenceBackboneServices(
      store,
      createDeterministicEvidenceIdGenerator("svc063b"),
    );

    await services.artifacts.registerSourceArtifact({
      artifactId: "artifact_source_payload_replay_001",
      locator: "object://evidence/source/replay-payload-001.json",
      checksum: "sha256_replay_payload_001",
      mediaType: "application/json",
      byteLength: 48,
      createdAt: "2026-04-12T12:10:00Z",
    });

    const semanticReplayBundle = await services.captureBundles.freezeCaptureBundle({
      captureBundleId: "capture_bundle_semantic_001",
      evidenceLineageRef: "request_replay_001",
      sourceChannel: "telephony_capture",
      replayClass: "semantic_replay",
      capturePolicyVersion: "capture_policy_v1",
      sourceHash: "hash_raw_semantic_001",
      semanticHash: "hash_semantic_001",
      sourceArtifactRefs: ["artifact_source_payload_replay_001"],
      createdAt: "2026-04-12T12:10:01Z",
    });
    const collisionBundle = await services.captureBundles.freezeCaptureBundle({
      captureBundleId: "capture_bundle_collision_001",
      evidenceLineageRef: "request_replay_001",
      sourceChannel: "telephony_capture",
      replayClass: "collision_review",
      capturePolicyVersion: "capture_policy_v1",
      sourceHash: "hash_raw_collision_001",
      semanticHash: "hash_semantic_collision_001",
      sourceArtifactRefs: ["artifact_source_payload_replay_001"],
      createdAt: "2026-04-12T12:10:02Z",
    });

    expect(semanticReplayBundle.toSnapshot().replayClass).toBe("semantic_replay");
    expect(collisionBundle.toSnapshot().replayClass).toBe("collision_review");
    await expect(store.saveEvidenceCaptureBundle(semanticReplayBundle)).rejects.toMatchObject({
      code: "IMMUTABLE_EVIDENCECAPTUREBUNDLE_REWRITE_FORBIDDEN",
    });
  });

  it("preserves source hash and policy version across immutable redaction transforms", async () => {
    const { services, captureBundleId, normalizedDerivationId } = await createSeededEvidenceFlow();

    await services.artifacts.registerRedactedArtifact({
      artifactId: "artifact_patient_summary_redacted_001",
      locator: "object://evidence/redacted/patient-summary-redacted-001.json",
      checksum: "sha256_patient_summary_redacted_001",
      mediaType: "application/json",
      byteLength: 40,
      createdAt: "2026-04-12T12:20:00Z",
      sourceArtifactRef: "artifact_patient_summary_001",
    });

    const transform = await services.redactions.createRedactionTransform({
      redactionTransformId: "redaction_001",
      sourceDerivationPackageRef: normalizedDerivationId,
      sourceArtifactRef: "artifact_normalized_001",
      redactionPolicyVersion: "redaction_policy_v2",
      redactedArtifactRef: "artifact_patient_summary_redacted_001",
      createdAt: "2026-04-12T12:20:01Z",
    });

    expect(transform.toSnapshot().sourceCaptureBundleRef).toBeNull();
    expect(transform.toSnapshot().sourceDerivationPackageRef).toBe(normalizedDerivationId);
    expect(transform.toSnapshot().sourceArtifactHash).toBe("sha256_normalized_001");
    expect(transform.toSnapshot().redactionPolicyVersion).toBe("redaction_policy_v2");
    expect(transform.toSnapshot().evidenceLineageRef).toBe("request_001");
    expect(transform.toSnapshot().sourceDerivationPackageRef).not.toBe(captureBundleId);
  });

  it("blocks authoritative summary posture when parity proof is stale or blocked", async () => {
    const { services, captureBundleId, normalizedDerivationId, patientSummaryDerivationId } =
      await createSeededEvidenceFlow();

    const blockedParity = await services.summaryParity.createSummaryParityRecord({
      parityRecordId: "parity_blocked_001",
      captureBundleRef: captureBundleId,
      normalizedDerivationPackageRef: normalizedDerivationId,
      summaryDerivationPackageRef: patientSummaryDerivationId,
      summaryKind: "patient_safe_summary",
      parityPolicyVersion: "parity_policy_v1",
      blockingReasonRefs: ["PARITY_BLOCKED_SUMMARY_DRIFT"],
      createdAt: "2026-04-12T12:30:00Z",
    });

    await expect(
      services.snapshots.createEvidenceSnapshot({
        evidenceSnapshotId: "snapshot_blocked_001",
        captureBundleRef: captureBundleId,
        authoritativeNormalizedDerivationPackageRef: normalizedDerivationId,
        currentSummaryParityRecordRef: blockedParity.parityRecordId,
        createdAt: "2026-04-12T12:30:01Z",
      }),
    ).rejects.toMatchObject({ code: "SNAPSHOT_PARITY_RECORD_NOT_VERIFIED" });
  });

  it("keeps technical-only revisions unattached and supersedes snapshots by append-only rows when meaning changes", async () => {
    const { services, store, captureBundleId, normalizedDerivationId, initialSnapshotId } =
      await createSeededEvidenceFlow();

    await services.artifacts.registerDerivedArtifact({
      artifactId: "artifact_transcript_v2_001",
      locator: "object://evidence/derived/transcript-v2-001.txt",
      checksum: "sha256_transcript_v2_001",
      mediaType: "text/plain",
      byteLength: 44,
      createdAt: "2026-04-12T12:40:00Z",
    });
    const technicalOnly = await services.assimilation.assimilateDerivationRevision({
      derivationPackage: {
        derivationPackageId: "derivation_transcript_v2_001",
        captureBundleRef: captureBundleId,
        derivationClass: "transcript",
        derivationVersion: "transcript_v2",
        policyVersionRef: "transcript_policy_v2",
        derivedArtifactRef: "artifact_transcript_v2_001",
        createdAt: "2026-04-12T12:40:01Z",
      },
      materialDeltaDisposition: "technical_only",
    });

    expect(technicalOnly.evidenceSnapshot).toBeNull();
    expect(
      (await store.getCurrentEvidenceSnapshotForLineage("request_001"))?.evidenceSnapshotId,
    ).toBe(initialSnapshotId);

    await services.artifacts.registerDerivedArtifact({
      artifactId: "artifact_structured_facts_v2_001",
      locator: "object://evidence/derived/structured-facts-v2-001.json",
      checksum: "sha256_structured_facts_v2_001",
      mediaType: "application/json",
      byteLength: 72,
      createdAt: "2026-04-12T12:41:00Z",
    });
    const materialChange = await services.assimilation.assimilateDerivationRevision({
      derivationPackage: {
        derivationPackageId: "derivation_structured_facts_v2_001",
        captureBundleRef: captureBundleId,
        derivationClass: "structured_fact_extraction",
        derivationVersion: "facts_v2",
        policyVersionRef: "facts_policy_v2",
        derivedArtifactRef: "artifact_structured_facts_v2_001",
        createdAt: "2026-04-12T12:41:01Z",
      },
      materialDeltaDisposition: "clinical_meaning_changed",
      snapshotIntent: {
        evidenceSnapshotId: "snapshot_002",
        authoritativeNormalizedDerivationPackageRef: normalizedDerivationId,
        createdAt: "2026-04-12T12:41:02Z",
      },
    });

    expect(materialChange.evidenceSnapshot?.toSnapshot().supersedesEvidenceSnapshotRef).toBe(
      initialSnapshotId,
    );
    expect(materialChange.evidenceSnapshot?.toSnapshot().authoritativeDerivedFactsPackageRef).toBe(
      "derivation_structured_facts_v2_001",
    );
    expect(
      (await store.getCurrentEvidenceSnapshotForLineage("request_001"))?.evidenceSnapshotId,
    ).toBe("snapshot_002");
  });
});
