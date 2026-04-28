import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  canonicalize,
  required481EdgeCases,
  SCHEMA_VERSION,
  TASK_ID,
} from "./run_481_dr_go_live_smoke";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "../..");

type JsonObject = Record<string, unknown>;

const requiredFiles = [
  "tests/playwright/481_go_live_smoke_admin_release.spec.ts",
  "tests/playwright/481_go_live_smoke_patient_staff.spec.ts",
  "tests/resilience/481_backup_restore_drill.test.ts",
  "tests/resilience/481_failover_and_recovery_report.test.ts",
  "tests/resilience/481_essential_function_continuity.test.ts",
  "data/evidence/481_dr_and_go_live_smoke_report.json",
  "data/evidence/481_restore_report_channel_evidence.json",
  "data/evidence/481_failover_probe_manifest.json",
  "docs/test-evidence/481_final_dr_and_go_live_smoke_report.md",
  "docs/runbooks/481_go_live_smoke_and_recovery_runbook.md",
  "data/analysis/481_algorithm_alignment_notes.md",
  "data/analysis/481_external_reference_notes.json",
  "data/contracts/PROGRAMME_BATCH_473_489_INTERFACE_GAP_481_DR_GO_LIVE_SMOKE_AUTHORITY.json",
] as const;

const requiredRecordTypes = [
  "FinalDRSmokeRun",
  "BackupRestoreEvidence",
  "FailoverProbeEvidence",
  "RestoreReportChannelEvidence",
  "EssentialFunctionContinuityVerdict",
  "GoLiveSmokeScenario",
  "RecoveryCommunicationEvidence",
  "RollbackSmokeEvidence",
] as const;

const forbiddenRawSensitivePattern =
  /patientNhs|nhsNumber|clinicalNarrative|rawIncident|rawRouteParam|artifact-fragment:raw|artifactFragment=|investigationKey=|Bearer |access_token|refresh_token|id_token|sk_live|BEGIN PRIVATE|PRIVATE KEY|s3:\/\/|gs:\/\/|blob:|inlineSecret|rawExportUrl|postgres:\/\/|mysql:\/\/|AKIA[0-9A-Z]{16}|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;

function hashValue(value: unknown): string {
  return createHash("sha256").update(canonicalize(value)).digest("hex");
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), "utf8")) as T;
}

function assertFileExists(relativePath: string): void {
  assert(fs.existsSync(path.join(ROOT, relativePath)), `${relativePath} must exist`);
}

function assertNoSensitiveSerialized(value: unknown, label: string): void {
  const serialized = typeof value === "string" ? value : JSON.stringify(value);
  assert(!forbiddenRawSensitivePattern.test(serialized), `${label} contains raw sensitive marker`);
}

function assertHashRecord(value: unknown, pathLabel = "record"): void {
  if (value === null || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertHashRecord(entry, `${pathLabel}[${index}]`));
    return;
  }
  const record = value as JsonObject;
  if (typeof record.recordHash === "string") {
    const { recordHash, ...withoutHash } = record;
    assert.equal(
      recordHash,
      hashValue(withoutHash),
      `${pathLabel} recordHash must be deterministic`,
    );
  }
  for (const [key, nested] of Object.entries(record)) {
    if (key !== "recordHash") assertHashRecord(nested, `${pathLabel}.${key}`);
  }
}

function collectRecordTypes(value: unknown, found = new Set<string>()): Set<string> {
  if (value === null || typeof value !== "object") return found;
  if (Array.isArray(value)) {
    value.forEach((entry) => collectRecordTypes(entry, found));
    return found;
  }
  const record = value as JsonObject;
  if (typeof record.recordType === "string") found.add(record.recordType);
  Object.values(record).forEach((entry) => collectRecordTypes(entry, found));
  return found;
}

function asArray(value: unknown, label: string): JsonObject[] {
  assert(Array.isArray(value), `${label} must be an array`);
  return value as JsonObject[];
}

export function validate481DRGoLiveSmokeArtifacts(): void {
  requiredFiles.forEach(assertFileExists);

  const report = readJson<JsonObject>("data/evidence/481_dr_and_go_live_smoke_report.json");
  const restoreChannels = readJson<JsonObject>(
    "data/evidence/481_restore_report_channel_evidence.json",
  );
  const failover = readJson<JsonObject>("data/evidence/481_failover_probe_manifest.json");
  const interfaceGap = readJson<JsonObject>(
    "data/contracts/PROGRAMME_BATCH_473_489_INTERFACE_GAP_481_DR_GO_LIVE_SMOKE_AUTHORITY.json",
  );
  const externalRefs = readJson<JsonObject>("data/analysis/481_external_reference_notes.json");

  for (const [label, value] of Object.entries({
    report,
    restoreChannels,
    failover,
    interfaceGap,
    externalRefs,
  })) {
    assertNoSensitiveSerialized(value, label);
    assertHashRecord(value, label);
  }

  for (const relativePath of [
    "docs/test-evidence/481_final_dr_and_go_live_smoke_report.md",
    "docs/runbooks/481_go_live_smoke_and_recovery_runbook.md",
    "data/analysis/481_algorithm_alignment_notes.md",
  ]) {
    assertNoSensitiveSerialized(
      fs.readFileSync(path.join(ROOT, relativePath), "utf8"),
      relativePath,
    );
  }

  assert.equal(report.taskId, TASK_ID);
  assert.equal(report.schemaVersion, SCHEMA_VERSION);
  assert.equal(report.smokeVerdict, "go_live_smoke_green");
  assert.equal((report.finalRun as JsonObject).smokeVerdict, "go_live_smoke_green");
  assert.deepEqual((report.finalRun as JsonObject).blockerRefs, []);

  const recordTypes = collectRecordTypes({ report, restoreChannels, failover, interfaceGap });
  requiredRecordTypes.forEach((recordType) => {
    assert(recordTypes.has(recordType), `${recordType} must be represented`);
  });

  const scenarios = asArray(report.scenarios, "report.scenarios");
  assert(scenarios.length >= 6, "481 must enumerate green and fail-closed smoke scenarios");
  const edgeCases = new Set(
    scenarios.flatMap((scenario) =>
      asArray(scenario.requiredEdgeCaseRefs, `${scenario.scenarioId}.requiredEdgeCaseRefs`),
    ),
  );
  required481EdgeCases.forEach((edgeCase) => {
    assert(edgeCases.has(edgeCase), `${edgeCase} must be covered`);
  });

  const backupEvidence = asArray(report.backupRestoreEvidence, "report.backupRestoreEvidence");
  assert(
    backupEvidence.some(
      (evidence) =>
        evidence.restoreDrillState === "audit_replay_stale" &&
        asArray(evidence.blockerRefs, "backup.blockerRefs").includes(
          "blocker:481:audit-replay-dependency-stale" as any,
        ),
    ),
    "stale audit replay restore edge case must block",
  );

  const channelEvidence = asArray(
    report.restoreReportChannelEvidence,
    "report.restoreReportChannelEvidence",
  );
  assert(
    channelEvidence.some(
      (evidence) => evidence.configured === false && evidence.state === "blocked",
    ),
    "missing restore report channel must block",
  );

  const failoverEvidence = asArray(report.failoverProbeEvidence, "report.failoverProbeEvidence");
  assert(
    failoverEvidence.some(
      (evidence) =>
        evidence.runtimeSwitchState === "switched" &&
        evidence.publicationParityState === "mismatch",
    ),
    "failover parity mismatch must be captured",
  );

  const continuity = asArray(
    report.essentialFunctionContinuityVerdicts,
    "report.essentialFunctionContinuityVerdicts",
  );
  assert(
    continuity.some((evidence) => Number(evidence.staffQueueProjectionLagSeconds) > 120),
    "staff queue projection lag breach must be represented",
  );

  const communications = asArray(
    report.recoveryCommunicationEvidence,
    "report.recoveryCommunicationEvidence",
  );
  assert(
    communications.some(
      (evidence) =>
        evidence.alertDeliveryState === "queued" && evidence.ownerRotaState === "absent",
    ),
    "alert delivered/queued with absent owner rota must be represented",
  );

  const rollback = asArray(report.rollbackSmokeEvidence, "report.rollbackSmokeEvidence");
  assert(
    rollback.some(
      (evidence) =>
        evidence.assistiveInsertControlsVisibleAfterFreeze === true && evidence.state === "blocked",
    ),
    "rollback smoke assistive insert visibility must fail closed",
  );

  const artifacts = asArray(report.artifactRefs, "report.artifactRefs");
  assert(
    artifacts.some((artifact) => String(artifact).includes("gls_481_admin_green_release_board")),
    "admin release Playwright artifacts must be captured",
  );
  assert(
    artifacts.some((artifact) => String(artifact).includes("gls_481_patient_staff_queue_lag")),
    "patient/staff Playwright artifacts must be captured",
  );
  artifacts.forEach((artifact) => {
    const artifactRef = String(artifact);
    assert(
      artifactRef.startsWith("output/playwright/481-dr-go-live-smoke/"),
      `${artifactRef} must stay under 481 output root`,
    );
    assert(fs.existsSync(path.join(ROOT, artifactRef)), `${artifactRef} must exist`);
  });

  console.log("481 DR and go-live smoke artifacts validated.");
}

if (process.argv[1]?.endsWith("validate_481_dr_go_live_smoke.ts")) {
  validate481DRGoLiveSmokeArtifacts();
}
