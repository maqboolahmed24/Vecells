import path from "node:path";
import {
  parseArgs,
  runCanaryScenarioRehearsal,
} from "./shared.ts";

const args = parseArgs(process.argv);
const environmentRing = args["--environment"] ?? "local";
const outputDir = args["--output-dir"];
const scenarioId = args["--scenario-id"];

if (!outputDir) {
  throw new Error("Missing required --output-dir.");
}

const output = runCanaryScenarioRehearsal(
  environmentRing,
  path.resolve(outputDir),
  scenarioId,
);

console.log(
  `Rehearsed ${output.summary.actionType} for ${output.summary.environmentRing} with cockpit state ${output.summary.cockpitState}.`,
);
