import path from "node:path";
import {
  buildRehearsalOutputs,
  buildRehearsalSummary,
  materializeBackupPayloads,
  materializeRestoreTargets,
  parseArgs,
  writeScenarioFiles,
} from "./shared.ts";

function main(): void {
  const args = parseArgs(process.argv);
  const environment = args["--environment"] ?? "local";
  const outputDir = path.resolve(args["--output-dir"] ?? `.artifacts/runtime-resilience-baseline/${environment}`);
  const scenarioId = args["--scenario-id"];

  const outputs = buildRehearsalOutputs(environment, scenarioId);
  const payloadCatalog = materializeBackupPayloads(outputDir, outputs.manifests);
  materializeRestoreTargets(outputDir, outputs.restoreRuns, payloadCatalog);

  const summary = buildRehearsalSummary(
    outputs.context,
    outputs.snapshot,
    outputs.manifests,
    outputs.restoreRuns,
    outputs.evidencePacks,
  );

  writeScenarioFiles(outputDir, {
    ...outputs,
    payloadCatalog,
    summary,
  });

  console.log(
    `Rehearsed resilience baseline for ${outputs.context.environmentRing} with readiness ${outputs.snapshot.readinessState}.`,
  );
}

main();
