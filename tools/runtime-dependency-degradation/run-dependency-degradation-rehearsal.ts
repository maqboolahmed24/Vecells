#!/usr/bin/env node

import path from "node:path";
import { hydrateScenario, parseArgs, writeJson } from "./shared.ts";

const args = parseArgs(process.argv);
const environment = args["--environment"] ?? "local";
const scenarioId = args["--scenario-id"];
const outputDir = path.resolve(
  args["--output-dir"] ?? `.artifacts/runtime-dependency-degradation/${environment}`,
);

try {
  const context = hydrateScenario(environment, scenarioId);
  writeJson(path.join(outputDir, "simulation-catalog.json"), context.simulationHarness.catalog);
  writeJson(path.join(outputDir, "simulation-metrics.json"), context.simulationHarness.metrics);
  writeJson(path.join(outputDir, "simulation-timeline.json"), context.simulationHarness.timeline);
  writeJson(path.join(outputDir, "scenario.json"), context.scenario);
  writeJson(path.join(outputDir, "dependency-degradation-decision.json"), context.decision);
  writeJson(
    path.join(outputDir, "browser-runtime-contract.json"),
    context.decision.browserMutationResolution.browserContract,
  );
  writeJson(path.join(outputDir, "timeline.json"), context.timeline);
  writeJson(path.join(outputDir, "dependency-degradation-verdict.json"), context.verdict);
  console.log(
    JSON.stringify(
      {
        task_id: "par_098",
        environment,
        output_dir: outputDir,
        scenario_id: context.scenario.scenarioId,
        decision_state: context.decision.decisionState,
        topology_fallback_mode: context.decision.topologyFallbackMode,
      },
      null,
      2,
    ),
  );
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
