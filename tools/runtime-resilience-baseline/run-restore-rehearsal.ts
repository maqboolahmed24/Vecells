import fs from "node:fs";
import path from "node:path";
import {
  buildRehearsalOutputs,
  materializeBackupPayloads,
  materializeRestoreTargets,
  parseArgs,
  readJson,
  writeJson,
  type BackupPayloadCatalogEntry,
} from "./shared.ts";

function main(): void {
  const args = parseArgs(process.argv);
  const environment = args["--environment"] ?? "local";
  const outputDir = path.resolve(args["--output-dir"] ?? `.artifacts/runtime-resilience-baseline/${environment}`);
  const scenarioId = args["--scenario-id"];
  const payloadCatalogPath = path.join(outputDir, "backup-payload-catalog.json");
  const outputs = buildRehearsalOutputs(environment, scenarioId);
  const payloadCatalog: BackupPayloadCatalogEntry[] = fs.existsSync(payloadCatalogPath)
    ? readJson<BackupPayloadCatalogEntry[]>(payloadCatalogPath)
    : materializeBackupPayloads(outputDir, outputs.manifests);

  materializeRestoreTargets(outputDir, outputs.restoreRuns, payloadCatalog);

  writeJson(path.join(outputDir, "scenario-context.json"), outputs.context);
  writeJson(path.join(outputDir, "backup-set-manifests.json"), outputs.manifests);
  writeJson(path.join(outputDir, "runbook-bindings.json"), outputs.runbookBindings);
  writeJson(path.join(outputDir, "restore-runs.json"), outputs.restoreRuns);
  writeJson(path.join(outputDir, "recovery-evidence-packs.json"), outputs.evidencePacks);
  writeJson(path.join(outputDir, "backup-payload-catalog.json"), payloadCatalog);

  console.log(
    `Materialized restore targets for ${outputs.restoreRuns.length} essential functions in ${outputDir}.`,
  );
}

main();
