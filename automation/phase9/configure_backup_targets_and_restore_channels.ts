import fs from "node:fs";
import path from "node:path";
import {
  BACKUP_RESTORE_CHANNEL_SCHEMA_VERSION,
  createBackupRestoreChannelRegistryProjection,
  createBackupTargetSyntheticPayload,
  createRestoreReportSyntheticPayload,
  settleRestoreReportChannel,
  verifyBackupTargetBinding,
} from "../../packages/domains/operations/src/index";

export interface BackupRestoreChannelAutomationResult {
  readonly schemaVersion: typeof BACKUP_RESTORE_CHANNEL_SCHEMA_VERSION;
  readonly runId: string;
  readonly tenantRef: string;
  readonly environmentRef: string;
  readonly releaseRef: string;
  readonly route: "/ops/config/backup-restore";
  readonly verifiedTargetCount: number;
  readonly deliveredChannelCount: number;
  readonly readinessState: string;
  readonly recoveryControlState: string;
  readonly noRawArtifactUrls: true;
  readonly evidencePath: string;
}

export function configureBackupTargetsAndRestoreChannels(options: {
  readonly tenantRef?: string;
  readonly environmentRef?: string;
  readonly releaseRef?: string;
  readonly outputDir?: string;
} = {}): BackupRestoreChannelAutomationResult {
  const tenantRef = options.tenantRef ?? "tenant-demo-gp";
  const environmentRef = options.environmentRef ?? "local";
  const releaseRef = options.releaseRef ?? "release-wave-blue-42";
  const projection = createBackupRestoreChannelRegistryProjection({
    tenantRef,
    environmentRef,
    releaseRef,
    scenarioState: "normal",
  });
  const verifiedTargets = projection.targetBindings.map((binding) =>
    verifyBackupTargetBinding(binding),
  );
  const deliveredChannels = projection.reportChannels.map((channel) =>
    settleRestoreReportChannel(channel),
  );
  const evidence = {
    schemaVersion: BACKUP_RESTORE_CHANNEL_SCHEMA_VERSION,
    generatedAt: "2026-04-28T10:30:00Z",
    route: "/ops/config/backup-restore",
    tenantRef,
    environmentRef,
    releaseRef,
    registryHash: projection.registryHash,
    readiness: projection.readiness,
    targetPayloads: verifiedTargets.map((record) =>
      createBackupTargetSyntheticPayload(record.binding),
    ),
    reportPayloads: deliveredChannels.map((record) =>
      createRestoreReportSyntheticPayload(record.channel),
    ),
    targetVerificationRecords: verifiedTargets.map((record) => record.verification),
    reportDeliverySettlements: deliveredChannels.map((record) => record.settlement),
    fakeBackupTargetRecords: verifiedTargets.map((record) => record.fakeBackupTargetRecord),
    fakeRestoreReportReceiverRecords: deliveredChannels.map((record) => record.fakeReceiverRecord),
    noRawArtifactUrls: projection.noRawArtifactUrls,
  };
  const outputDir =
    options.outputDir ?? path.join(process.cwd(), ".artifacts", "backup-restore-channels-462");
  fs.mkdirSync(outputDir, { recursive: true });
  const evidencePath = path.join(outputDir, "backup-restore-channel-automation.json");
  fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
  return {
    schemaVersion: BACKUP_RESTORE_CHANNEL_SCHEMA_VERSION,
    runId: "automation-462-backup-restore-channels",
    tenantRef,
    environmentRef,
    releaseRef,
    route: "/ops/config/backup-restore",
    verifiedTargetCount: verifiedTargets.length,
    deliveredChannelCount: deliveredChannels.length,
    readinessState: projection.readiness.readinessState,
    recoveryControlState: projection.readiness.recoveryControlState,
    noRawArtifactUrls: true,
    evidencePath,
  };
}

if (process.argv.includes("--run")) {
  const result = configureBackupTargetsAndRestoreChannels();
  console.log(JSON.stringify(result, null, 2));
}
