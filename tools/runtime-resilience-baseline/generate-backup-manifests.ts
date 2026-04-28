import path from "node:path";
import {
  buildRehearsalOutputs,
  materializeBackupPayloads,
  parseArgs,
  writeJson,
} from "./shared.ts";

function main(): void {
  const args = parseArgs(process.argv);
  const environment = args["--environment"] ?? "local";
  const outputDir = path.resolve(args["--output-dir"] ?? `.artifacts/runtime-resilience-baseline/${environment}`);
  const scenarioId = args["--scenario-id"];

  const outputs = buildRehearsalOutputs(environment, scenarioId);
  const payloadCatalog = materializeBackupPayloads(outputDir, outputs.manifests);

  writeJson(path.join(outputDir, "scenario-context.json"), outputs.context);
  writeJson(path.join(outputDir, "backup-set-manifests.json"), outputs.manifests);
  writeJson(path.join(outputDir, "runbook-bindings.json"), outputs.runbookBindings);
  writeJson(path.join(outputDir, "backup-payload-catalog.json"), payloadCatalog);

  console.log(
    `Generated ${outputs.manifests.length} backup manifests for ${outputs.context.environmentRing} (${outputs.context.scenarioId}).`,
  );
}

main();
