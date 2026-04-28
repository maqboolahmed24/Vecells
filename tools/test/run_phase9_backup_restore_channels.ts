import fs from "node:fs";
import path from "node:path";
import {
  BACKUP_RESTORE_CHANNEL_GAP_ARTIFACT_REF,
  BACKUP_RESTORE_CHANNEL_SCHEMA_VERSION,
  createBackupRestoreChannelRegistryFixture,
  createBackupRestoreChannelRegistryProjection,
} from "../../packages/domains/operations/src/index";

const root = process.cwd();
const contractsDir = path.join(root, "data", "contracts");
const fixturesDir = path.join(root, "data", "fixtures");
const analysisDir = path.join(root, "data", "analysis");

const contractPath = path.join(
  contractsDir,
  "462_phase9_backup_restore_channel_registry_contract.json",
);
const fixturePath = path.join(fixturesDir, "462_backup_restore_channel_registry_fixtures.json");
const evidencePath = path.join(analysisDir, "462_backup_restore_channel_verification_evidence.json");

const fixture = createBackupRestoreChannelRegistryFixture();
const normal = fixture.scenarioProjections.normal;
const drifted = fixture.scenarioProjections.tuple_drift;

const contractArtifact = {
  schemaVersion: BACKUP_RESTORE_CHANNEL_SCHEMA_VERSION,
  visualMode: fixture.visualMode,
  route: "/ops/config/backup-restore",
  opsRoute: "/ops/resilience",
  interfaceGapArtifactRef: BACKUP_RESTORE_CHANNEL_GAP_ARTIFACT_REF,
  sourceAlgorithmRefs: fixture.sourceAlgorithmRefs,
  automationAnchors: fixture.automationAnchors,
  requiredBackupDatasetScopes: fixture.requiredBackupDatasetScopes,
  requiredRecoveryArtifactTypes: fixture.requiredRecoveryArtifactTypes,
  backupCoverage: {
    targetCount: normal.targetBindings.length,
    allSecretRefsAreVaultRefs: normal.targetBindings.every((binding) =>
      binding.secretRef.startsWith("vault-ref/"),
    ),
    allHaveEssentialFunctionRefs: normal.targetBindings.every(
      (binding) => binding.essentialFunctionRefs.length > 0,
    ),
    allHaveRecoveryTierRefs: normal.targetBindings.every(
      (binding) => binding.recoveryTierRefs.length > 0,
    ),
    allHaveChecksumProof: normal.targetBindings.every(
      (binding) =>
        binding.latestVerificationRecord.checksumAlgorithm === "sha256" &&
        binding.latestVerificationRecord.checksumMatches,
    ),
    allHaveImmutabilityProof: normal.targetBindings.every(
      (binding) => binding.latestVerificationRecord.immutabilityProofObserved,
    ),
    allHaveRestoreAndDependencyDigests: normal.targetBindings.every(
      (binding) =>
        binding.latestVerificationRecord.restoreCompatibilityDigest.startsWith("sha256:") &&
        binding.latestVerificationRecord.dependencyOrderDigest.startsWith("sha256:"),
    ),
  },
  reportChannelCoverage: {
    channelCount: normal.reportChannels.length,
    allSecretRefsAreVaultRefs: normal.reportChannels.every((channel) =>
      channel.secretRef.startsWith("vault-ref/"),
    ),
    allArtifactTypesCovered: fixture.requiredRecoveryArtifactTypes.every((artifactType) =>
      normal.reportChannels.some((channel) => channel.artifactTypes.includes(artifactType)),
    ),
    noRawArtifactUrls: normal.reportChannels.every(
      (channel) => channel.artifactPresentationPolicy.rawObjectStoreUrlsAllowed === false,
    ),
    outboundGrantsRequired: normal.reportChannels.every(
      (channel) => channel.artifactPresentationPolicy.outboundGrantRequired === true,
    ),
  },
  recoveryTupleDriftInvalidatesLiveControls:
    drifted.readiness.tupleState === "drifted" &&
    drifted.readiness.recoveryControlState === "blocked",
  scenarioCoverage: Object.fromEntries(
    Object.entries(fixture.scenarioProjections).map(([scenarioState, projection]) => [
      scenarioState,
      {
        selectedTargetState: projection.selectedTargetBinding.latestVerificationRecord.status,
        selectedChannelState: projection.selectedChannel.latestSettlement.result,
        readinessState: projection.readiness.readinessState,
        recoveryControlState: projection.readiness.recoveryControlState,
      },
    ]),
  ),
};

const evidence = {
  schemaVersion: "462.phase9.backup-restore-channel-evidence.v1",
  generatedAt: "2026-04-28T10:30:00Z",
  normalVerificationRecords: normal.verificationRecords,
  normalSettlements: normal.deliverySettlements,
  fakeBackupTargetRecords: normal.fakeBackupTargetRecords,
  fakeRestoreReportReceiverRecords: normal.fakeRestoreReportReceiverRecords,
  replayProjection: createBackupRestoreChannelRegistryProjection({
    scenarioState: "normal",
    selectedDatasetScope: normal.selectedDatasetScope,
    selectedChannelId: normal.selectedChannelId,
  }),
};

fs.mkdirSync(contractsDir, { recursive: true });
fs.mkdirSync(fixturesDir, { recursive: true });
fs.mkdirSync(analysisDir, { recursive: true });
fs.writeFileSync(contractPath, `${JSON.stringify(contractArtifact, null, 2)}\n`);
fs.writeFileSync(fixturePath, `${JSON.stringify(fixture, null, 2)}\n`);
fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);

console.log(`Phase 9 backup restore contract: ${path.relative(root, contractPath)}`);
console.log(`Phase 9 backup restore fixture: ${path.relative(root, fixturePath)}`);
console.log(`Phase 9 backup restore evidence: ${path.relative(root, evidencePath)}`);
