import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(read(relativePath)) as T;
}

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function assertIncludes(file: string, fragment: string): void {
  const content = read(file);
  assertCondition(content.includes(fragment), `${file} is missing ${fragment}`);
}

const requiredFiles = [
  "packages/domains/operations/src/phase9-backup-restore-channels.ts",
  "automation/phase9/configure_backup_targets_and_restore_channels.ts",
  "tests/playwright/462_configure_backup_targets.spec.ts",
  "tests/playwright/462_restore_report_channels.spec.ts",
  "tests/playwright/462_backup_channel_accessibility.spec.ts",
  "tests/playwright/462_backup_restore.helpers.ts",
  "tests/integration/462_backup_restore_channel_contract.test.ts",
  "docs/runbooks/462_backup_targets_restore_report_channels_setup.md",
  "data/contracts/462_backup_restore_channel_binding.schema.json",
  "data/contracts/PHASE9_BATCH_458_472_INTERFACE_GAP_462_BACKUP_RESTORE_CHANNELS.json",
  "data/contracts/462_phase9_backup_restore_channel_registry_contract.json",
  "data/fixtures/462_backup_restore_channel_registry_fixtures.json",
  "data/analysis/462_algorithm_alignment_notes.md",
  "data/analysis/462_external_reference_notes.json",
  "data/analysis/462_backup_restore_channel_verification_evidence.json",
  "tools/test/run_phase9_backup_restore_channels.ts",
  "tools/analysis/validate_462_phase9_backup_restore_channels.ts",
];

for (const requiredFile of requiredFiles) {
  assertCondition(
    fs.existsSync(path.join(root, requiredFile)),
    `Missing required file ${requiredFile}`,
  );
}

for (const typeName of [
  "interface BackupTargetBinding",
  "interface RestoreReportChannelBinding",
  "interface BackupTargetVerificationRecord",
  "interface RestoreReportDeliverySettlement",
  "interface RecoveryArtifactChannelPolicy",
]) {
  assertIncludes("packages/domains/operations/src/phase9-backup-restore-channels.ts", typeName);
}

for (const anchor of [
  'data-testid="backup-restore-config-surface"',
  'data-testid="backup-restore-scope-ribbon"',
  'data-testid="backup-restore-wizard"',
  'data-testid="backup-target-table"',
  'data-testid="restore-report-channel-table"',
  'data-testid="fake-backup-target-ledger"',
  'data-testid="fake-restore-report-receiver-ledger"',
  'data-testid="recovery-artifact-policy-rail"',
  'data-testid="backup-restore-error-summary"',
  'data-testid="backup-restore-readiness-strip"',
]) {
  assertIncludes("apps/governance-console/src/governance-shell-seed.tsx", anchor);
}

assertIncludes("apps/governance-console/src/governance-shell-seed.model.ts", "/ops/config/backup-restore");
assertIncludes("apps/ops-console/src/operations-shell-seed.tsx", "ops-backup-restore-readiness-strip");
assertIncludes("apps/ops-console/src/operations-shell-seed.tsx", "data-backup-restore-state");
assertIncludes("package.json", "test:phase9:backup-restore-channels");
assertIncludes("package.json", "validate:462-phase9-backup-restore-channels");

const contract = readJson<any>(
  "data/contracts/462_phase9_backup_restore_channel_registry_contract.json",
);
assertCondition(
  contract.schemaVersion === "462.phase9.backup-restore-channel-binding.v1",
  "Bad task 462 schema version",
);
assertCondition(contract.route === "/ops/config/backup-restore", "Bad backup restore route");
assertCondition(contract.opsRoute === "/ops/resilience", "Bad ops route");
assertCondition(contract.backupCoverage.targetCount === 8, "Backup target count mismatch");
assertCondition(contract.reportChannelCoverage.channelCount === 3, "Report channel count mismatch");
assertCondition(
  contract.backupCoverage.allSecretRefsAreVaultRefs === true,
  "Backup target secret refs must be vault refs",
);
assertCondition(
  contract.backupCoverage.allHaveChecksumProof === true,
  "Backup targets must have checksum proof",
);
assertCondition(
  contract.backupCoverage.allHaveImmutabilityProof === true,
  "Backup targets must have immutability proof",
);
assertCondition(
  contract.reportChannelCoverage.noRawArtifactUrls === true,
  "Raw artifact URLs must be disallowed",
);
assertCondition(
  contract.reportChannelCoverage.outboundGrantsRequired === true,
  "Outbound grants must be required",
);
assertCondition(
  contract.recoveryTupleDriftInvalidatesLiveControls === true,
  "Tuple drift must invalidate live controls",
);

for (const datasetScope of [
  "patient_intake_event_data",
  "safety_gate_triage_queue",
  "booking_hub_coordination",
  "pharmacy_referral_loop",
  "outbound_communications",
  "audit_search_assurance_ledger",
  "assistive_downgrade_human_artifact",
  "operational_projection_conformance_proof",
]) {
  assertCondition(
    contract.requiredBackupDatasetScopes.includes(datasetScope),
    `Missing required backup dataset scope ${datasetScope}`,
  );
}

for (const artifactType of [
  "restore_report",
  "failover_report",
  "chaos_report",
  "journey_recovery_proof",
  "backup_manifest_report",
  "runbook_bundle",
  "readiness_snapshot_summary",
]) {
  assertCondition(
    contract.requiredRecoveryArtifactTypes.includes(artifactType),
    `Missing required recovery artifact type ${artifactType}`,
  );
}

const fixture = readJson<any>("data/fixtures/462_backup_restore_channel_registry_fixtures.json");
for (const scenarioState of [
  "normal",
  "target_creation",
  "stale_checksum",
  "missing_secret",
  "missing_immutability_proof",
  "report_delivery_failed",
  "unsupported_scope",
  "tuple_drift",
  "withdrawn_channel",
]) {
  assertCondition(fixture.scenarioProjections[scenarioState], `Missing ${scenarioState} fixture`);
}

const externalNotes = readJson<any>("data/analysis/462_external_reference_notes.json");
for (const expectedUrl of [
  "https://www.ncsc.gov.uk/collection/ransomware-resistant-backups",
  "https://www.ncsc.gov.uk/blog-post/offline-backups-in-an-online-world",
  "https://csrc.nist.gov/pubs/sp/800/34/final",
  "https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html",
  "https://design-system.service.gov.uk/components/error-summary/",
  "https://playwright.dev/docs/network",
  "https://playwright.dev/docs/aria-snapshots",
]) {
  assertCondition(
    externalNotes.references.some((reference: { url: string }) => reference.url === expectedUrl),
    `Missing external reference ${expectedUrl}`,
  );
}

assertCondition(
  /^\- \[(?:-|X)\] par_462_phase9_use_Playwright_or_other_appropriate_tooling_browser_automation_to_configure_backup_targets_and_restore_report_channels/m.test(
    read("prompt/checklist.md"),
  ),
  "Checklist row for par_462 must be claimed or complete",
);

console.log("Task 462 backup restore channel validation passed.");
