import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  BACKUP_RESTORE_CHANNEL_SCHEMA_VERSION,
  backupSecretRefForScope,
  createBackupRestoreChannelRegistryProjection,
  createBackupTargetBinding,
  createBackupTargetSyntheticPayload,
  createRestoreReportChannelBinding,
  createRestoreReportSyntheticPayload,
  requiredBackupDatasetScopes,
  requiredRecoveryArtifactTypes,
  settleRestoreReportChannel,
  upsertBackupTargetBinding,
  upsertRestoreReportChannelBinding,
  verifyBackupTargetBinding,
} from "../../packages/domains/operations/src/index";

describe("task 462 backup restore channel registry", () => {
  it("covers required backup dataset scopes with secret refs, manifests, checksums, and immutability proof", () => {
    const projection = createBackupRestoreChannelRegistryProjection();
    expect(projection.schemaVersion).toBe(BACKUP_RESTORE_CHANNEL_SCHEMA_VERSION);
    expect(projection.targetBindings).toHaveLength(8);
    expect(projection.targetBindings.map((binding) => binding.datasetScope)).toEqual(
      requiredBackupDatasetScopes,
    );
    for (const binding of projection.targetBindings) {
      expect(binding.secretMaterialInline).toBe(false);
      expect(binding.secretRef).toMatch(/^vault-ref\//);
      expect(binding.essentialFunctionRefs.length).toBeGreaterThan(0);
      expect(binding.recoveryTierRefs.length).toBeGreaterThan(0);
      expect(binding.backupSetManifestRef).toMatch(/^backup-set-manifest:/);
      expect(binding.recoveryEvidencePackRef).toMatch(/^recovery-evidence-pack:/);
      expect(binding.latestVerificationRecord.checksumAlgorithm).toBe("sha256");
      expect(binding.latestVerificationRecord.checksumMatches).toBe(true);
      expect(binding.latestVerificationRecord.immutabilityProofObserved).toBe(true);
      expect(binding.latestVerificationRecord.restoreCompatibilityDigest).toMatch(/^sha256:/);
      expect(binding.latestVerificationRecord.dependencyOrderDigest).toMatch(/^sha256:/);
    }
  });

  it("covers restore report artifact types with governed artifact presentation policies", () => {
    const projection = createBackupRestoreChannelRegistryProjection();
    for (const artifactType of requiredRecoveryArtifactTypes) {
      expect(
        projection.reportChannels.some((channel) => channel.artifactTypes.includes(artifactType)),
      ).toBe(true);
    }
    for (const channel of projection.reportChannels) {
      expect(channel.secretMaterialInline).toBe(false);
      expect(channel.secretRef).toMatch(/^vault-ref\//);
      expect(channel.artifactPresentationPolicy.presentationContractRef).toBe(
        "ArtifactPresentationContract",
      );
      expect(channel.artifactPresentationPolicy.artifactSurfaceFrameRef).toBe(
        "ArtifactSurfaceFrame",
      );
      expect(channel.artifactPresentationPolicy.artifactModeTruthProjectionRef).toBe(
        "ArtifactModeTruthProjection",
      );
      expect(channel.artifactPresentationPolicy.rawObjectStoreUrlsAllowed).toBe(false);
      expect(channel.artifactPresentationPolicy.outboundGrantRequired).toBe(true);
      expect(channel.latestSettlement.presentationGrantRef).toMatch(/^presentation-grant:/);
      expect(channel.latestSettlement.result).toBe("delivered");
    }
  });

  it("upserts target and channel bindings idempotently with tenant and environment isolation", () => {
    const projection = createBackupRestoreChannelRegistryProjection();
    const targetCandidate = createBackupTargetBinding(
      {
        datasetScope: "patient_intake_event_data",
        label: "Patient intake event data",
        essentialFunctionRefs: ["digital_intake", "patient_status"],
        recoveryTierRefs: ["tier_0_critical_15m"],
        storageClass: "fake_immutable_object_store",
        immutabilityRequirement: "append_only_object_lock_min_35d",
      },
      { tenantRef: projection.tenantRef, environmentRef: projection.environmentRef, selected: true },
    );
    const targetReplay = upsertBackupTargetBinding(projection.targetBindings, targetCandidate);
    expect(targetReplay).toHaveLength(projection.targetBindings.length);
    expect(targetReplay.filter((binding) => binding.datasetScope === targetCandidate.datasetScope))
      .toHaveLength(1);

    const channelCandidate = createRestoreReportChannelBinding(
      {
        channelId: "restore-channel-resilience-board",
        label: "Resilience board evidence channel",
        destinationClass: "resilience_board_artifact_channel",
        artifactTypes: requiredRecoveryArtifactTypes,
        permittedRecipients: ["resilience_duty_lead"],
        surfaces: ["/ops/resilience"],
      },
      { tenantRef: projection.tenantRef, environmentRef: projection.environmentRef, selected: true },
    );
    const channelReplay = upsertRestoreReportChannelBinding(
      projection.reportChannels,
      channelCandidate,
    );
    expect(channelReplay).toHaveLength(projection.reportChannels.length);
    expect(channelReplay.filter((channel) => channel.channelId === channelCandidate.channelId))
      .toHaveLength(1);

    const otherTenant = createBackupRestoreChannelRegistryProjection({
      tenantRef: "tenant-assurance-lab",
      environmentRef: "preview",
    });
    expect(otherTenant.targetBindings[0]?.secretRef).not.toBe(projection.targetBindings[0]?.secretRef);
    expect(
      backupSecretRefForScope("patient_intake_event_data", "tenant-assurance-lab", "preview"),
    ).toMatch(/^vault-ref\/tenant-assurance-lab\/preview/);
  });

  it("settles target verification and report delivery with only redacted synthetic payloads", () => {
    const projection = createBackupRestoreChannelRegistryProjection();
    const verifiedTarget = verifyBackupTargetBinding(projection.selectedTargetBinding);
    expect(verifiedTarget.verification.status).toBe("verified");
    expect(verifiedTarget.fakeBackupTargetRecord.accepted).toBe(true);

    const settledChannel = settleRestoreReportChannel(projection.selectedChannel);
    expect(settledChannel.settlement.result).toBe("delivered");
    expect(settledChannel.fakeReceiverRecord.accepted).toBe(true);

    const backupPayload = createBackupTargetSyntheticPayload(projection.selectedTargetBinding);
    const reportPayload = createRestoreReportSyntheticPayload(projection.selectedChannel);
    for (const payload of [backupPayload, reportPayload]) {
      const serialized = JSON.stringify(payload);
      expect(serialized).not.toMatch(/https?:\/\//);
      expect(serialized).not.toMatch(/accessToken|credential|rawObjectStoreUrl|inlineSecret/);
    }
  });

  it("fails closed for backup and restore report fixture states", () => {
    const expectations = [
      ["target_creation", "pending_creation", "blocked", "diagnostic_only"],
      ["missing_secret", "missing_secret", "blocked", "blocked"],
      ["stale_checksum", "stale_checksum", "stale", "blocked"],
      ["missing_immutability_proof", "missing_immutability_proof", "blocked", "blocked"],
      ["report_delivery_failed", "verified", "failed", "blocked"],
      ["unsupported_scope", "unsupported_scope", "blocked", "blocked"],
      ["tuple_drift", "tuple_drift", "stale", "blocked"],
      ["withdrawn_channel", "verified", "withdrawn", "blocked"],
    ] as const;
    for (const [scenarioState, targetState, channelState, recoveryControlState] of expectations) {
      const projection = createBackupRestoreChannelRegistryProjection({ scenarioState });
      expect(projection.selectedTargetBinding.latestVerificationRecord.status).toBe(targetState);
      expect(projection.selectedChannel.latestSettlement.result).toBe(channelState);
      expect(projection.readiness.recoveryControlState).toBe(recoveryControlState);
    }
    expect(
      createBackupRestoreChannelRegistryProjection({ scenarioState: "tuple_drift" }).readiness
        .tupleState,
    ).toBe("drifted");
  });

  it("keeps schema, gap, and generated contract artifacts available", () => {
    const root = process.cwd();
    expect(
      fs.existsSync(path.join(root, "data/contracts/462_backup_restore_channel_binding.schema.json")),
    ).toBe(true);
    expect(
      fs.existsSync(
        path.join(
          root,
          "data/contracts/PHASE9_BATCH_458_472_INTERFACE_GAP_462_BACKUP_RESTORE_CHANNELS.json",
        ),
      ),
    ).toBe(true);
  });
});
