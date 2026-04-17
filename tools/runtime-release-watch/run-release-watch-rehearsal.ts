#!/usr/bin/env node

import path from "node:path";
import { hydrateScenario, parseArgs, writeJson } from "./shared.ts";

const args = parseArgs(process.argv);
const environment = args["--environment"] ?? "local";
const outputDir = path.resolve(
  args["--output-dir"] ?? `.artifacts/runtime-release-watch/${environment}`,
);

try {
  const context = hydrateScenario(environment);
  writeJson(path.join(outputDir, "release-watch-tuple.json"), context.result.tuple);
  writeJson(path.join(outputDir, "wave-observation-policy.json"), context.result.policy);
  writeJson(path.join(outputDir, "observation-window.json"), context.result.observationWindow);
  writeJson(path.join(outputDir, "trigger-evaluations.json"), context.result.triggerEvaluations);
  writeJson(path.join(outputDir, "action-eligibility.json"), context.result.actionEligibility);
  writeJson(path.join(outputDir, "timeline.json"), context.coordinator.store.getTimeline());
  writeJson(path.join(outputDir, "watch-verdict.json"), {
    scenarioId: context.record.scenarioId,
    expected: context.record.expected,
    actual: {
      watchState: context.result.watchState,
      tupleState: context.result.tuple.tupleState,
      policyState: context.result.policy.policyState,
      observationState: context.result.observationWindow.observationState,
      allowedActions: context.result.actionEligibility
        .filter((row) => row.allowed)
        .map((row) => row.waveActionType),
      triggeredTriggerRefs: context.result.triggerEvaluations
        .filter((row) => row.triggerState === "triggered")
        .map((row) => row.triggerRef),
    },
  });
  console.log(
    JSON.stringify(
      {
        task_id: "par_097",
        environment,
        output_dir: outputDir,
        scenario_id: context.record.scenarioId,
        watch_state: context.result.watchState,
      },
      null,
      2,
    ),
  );
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
