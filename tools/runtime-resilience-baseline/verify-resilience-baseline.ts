import fs from "node:fs";
import path from "node:path";
import {
  canonicalBackupScopes,
  canonicalEssentialFunctionMap,
  type BackupPayloadCatalogEntry,
  type BackupSetManifest,
  type OperationalReadinessSnapshot,
  type RecoveryEvidencePack,
  type RestoreRun,
  type RunbookBindingRecord,
} from "../../packages/release-controls/src/resilience-baseline.ts";
import { parseArgs, readJson, type RehearsalSummary, type ScenarioContext } from "./shared.ts";

function requireCondition(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function main(): void {
  const args = parseArgs(process.argv);
  const inputDir = path.resolve(args["--input-dir"] ?? ".artifacts/runtime-resilience-baseline/local");

  const context = readJson<ScenarioContext>(path.join(inputDir, "scenario-context.json"));
  const summary = readJson<RehearsalSummary>(path.join(inputDir, "rehearsal-summary.json"));
  const manifests = readJson<BackupSetManifest[]>(path.join(inputDir, "backup-set-manifests.json"));
  const runbookBindings = readJson<RunbookBindingRecord[]>(
    path.join(inputDir, "runbook-bindings.json"),
  );
  const restoreRuns = readJson<RestoreRun[]>(path.join(inputDir, "restore-runs.json"));
  const evidencePacks = readJson<RecoveryEvidencePack[]>(
    path.join(inputDir, "recovery-evidence-packs.json"),
  );
  const snapshot = readJson<OperationalReadinessSnapshot>(
    path.join(inputDir, "operational-readiness-snapshot.json"),
  );
  const payloadCatalog = readJson<BackupPayloadCatalogEntry[]>(
    path.join(inputDir, "backup-payload-catalog.json"),
  );

  requireCondition(
    manifests.length === canonicalBackupScopes.length,
    "Backup manifest count drifted from the canonical backup scope catalog.",
  );
  requireCondition(
    runbookBindings.length === canonicalEssentialFunctionMap.length,
    "Runbook binding count drifted from the essential function map.",
  );
  requireCondition(
    restoreRuns.length === canonicalEssentialFunctionMap.length,
    "Restore run count drifted from the essential function map.",
  );
  requireCondition(
    evidencePacks.length === canonicalEssentialFunctionMap.length,
    "Evidence pack count drifted from the essential function map.",
  );
  requireCondition(
    snapshot.readinessState === context.expectedReadinessState,
    `Expected readiness ${context.expectedReadinessState}, got ${snapshot.readinessState}.`,
  );
  requireCondition(
    summary.actualReadinessState === snapshot.readinessState,
    "Rehearsal summary drifted from the compiled readiness snapshot.",
  );
  requireCondition(
    summary.expectedReadinessState === context.expectedReadinessState,
    "Rehearsal summary lost the expected readiness state.",
  );

  payloadCatalog.forEach((entry) => {
    if (!entry.payloadRoot) {
      return;
    }
    const payloadRoot = path.join(inputDir, entry.payloadRoot);
    requireCondition(
      fs.existsSync(payloadRoot),
      `Missing payload root for ${entry.backupSetManifestId}: ${payloadRoot}`,
    );
    entry.relativePaths.forEach((relativePath) => {
      const payloadPath = path.join(payloadRoot, relativePath);
      requireCondition(fs.existsSync(payloadPath), `Missing payload file ${payloadPath}`);
    });
  });

  if (snapshot.readinessState === "exact_and_ready") {
    requireCondition(snapshot.blockerRefs.length === 0, "Ready snapshot still has blocker refs.");
  }
  if (snapshot.readinessState === "tuple_drift") {
    requireCondition(
      snapshot.blockerRefs.includes("RESILIENCE_TUPLE_DRIFT"),
      "Tuple-drift scenario lost the tuple drift blocker.",
    );
  }
  if (snapshot.readinessState === "missing_backup_manifest") {
    requireCondition(
      snapshot.blockerRefs.includes("MISSING_BACKUP_MANIFEST"),
      "Missing-manifest scenario lost the missing backup blocker.",
    );
  }

  console.log(
    `Verified resilience baseline rehearsal for ${context.environmentRing} (${snapshot.readinessState}).`,
  );
}

main();
