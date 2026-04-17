import path from "node:path";
import {
  canonicalEssentialFunctionMap,
  canonicalRecoveryTiers,
  compileOperationalReadinessSnapshot,
  type BackupSetManifest,
  type OperationalReadinessSnapshot,
  type RecoveryEvidencePack,
  type RunbookBindingRecord,
  type RestoreRun,
} from "../../packages/release-controls/src/resilience-baseline.ts";
import { parseArgs, readJson, writeJson, type ScenarioContext } from "./shared.ts";

function main(): void {
  const args = parseArgs(process.argv);
  const inputDir = path.resolve(args["--input-dir"] ?? args["--output-dir"] ?? ".artifacts/runtime-resilience-baseline/local");

  const context = readJson<ScenarioContext>(path.join(inputDir, "scenario-context.json"));
  const manifests = readJson<BackupSetManifest[]>(path.join(inputDir, "backup-set-manifests.json"));
  const runbookBindings = readJson<RunbookBindingRecord[]>(
    path.join(inputDir, "runbook-bindings.json"),
  );
  const restoreRuns = readJson<RestoreRun[]>(path.join(inputDir, "restore-runs.json"));
  const evidencePacks = readJson<RecoveryEvidencePack[]>(
    path.join(inputDir, "recovery-evidence-packs.json"),
  );

  const snapshot: OperationalReadinessSnapshot = compileOperationalReadinessSnapshot({
    tuple: context.tuple,
    buildProvenanceState: context.buildProvenanceState,
    compiledAt: "2026-04-13T12:25:00.000Z",
    essentialFunctions: canonicalEssentialFunctionMap,
    recoveryTiers: canonicalRecoveryTiers,
    backupManifests: manifests,
    runbookBindings,
    restoreRuns,
    evidencePacks,
  });

  writeJson(path.join(inputDir, "operational-readiness-snapshot.json"), snapshot);
  console.log(
    `Compiled operational readiness snapshot for ${context.environmentRing} (${snapshot.readinessState}).`,
  );
}

main();
