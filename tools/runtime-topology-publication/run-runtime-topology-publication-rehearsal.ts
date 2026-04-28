#!/usr/bin/env node

import path from "node:path";
import { hydrateScenario, parseArgs, writeJson } from "./shared.ts";

const args = parseArgs(process.argv);
const environment = args["--environment"] ?? "local";
const scenarioId = args["--scenario-id"];
const outputDir = path.resolve(
  args["--output-dir"] ?? `.artifacts/runtime-topology-publication/${environment}`,
);

try {
  const context = hydrateScenario(environment, scenarioId);
  writeJson(path.join(outputDir, "runtime-topology-drift-catalog.json"), context.driftCatalog);
  writeJson(
    path.join(outputDir, "gateway-surface-publication-matrix.json"),
    context.gatewaySurfaceMatrix,
  );
  writeJson(path.join(outputDir, "scenario.json"), context.scenario);
  writeJson(
    path.join(outputDir, "runtime-topology-publication-verdict.json"),
    context.verdict,
  );
  writeJson(
    path.join(outputDir, "runtime-topology-publication-graph.json"),
    context.simulationHarness.scenario.graph,
  );
  writeJson(
    path.join(outputDir, "runtime-topology-publication-metrics.json"),
    context.simulationHarness.metrics,
  );
  writeJson(
    path.join(outputDir, "current-graph-snapshot.json"),
    context.simulationHarness.currentGraphSnapshot,
  );
  console.log(
    JSON.stringify(
      {
        task_id: "par_099",
        environment,
        output_dir: outputDir,
        scenario_id: context.scenario.scenarioId,
        publishable: context.verdict.actual.publishable,
        blocked_reason_refs: context.verdict.actual.blockedReasonRefs,
      },
      null,
      2,
    ),
  );
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
