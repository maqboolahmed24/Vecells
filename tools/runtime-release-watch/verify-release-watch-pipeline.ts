#!/usr/bin/env node

import path from "node:path";
import { buildDigestSummary, hydrateScenario, parseArgs, readJson } from "./shared.ts";

const args = parseArgs(process.argv);
const environment = args["--environment"] ?? "local";
const inputDir = path.resolve(
  args["--input-dir"] ?? `.artifacts/runtime-release-watch/${environment}`,
);

try {
  const saved = readJson<{
    expected: {
      watchState: string;
      tupleState: string;
      policyState: string;
      observationState: string;
      allowedActions: string[];
      triggeredTriggerRefs: string[];
    };
    actual: {
      watchState: string;
      tupleState: string;
      policyState: string;
      observationState: string;
      allowedActions: string[];
      triggeredTriggerRefs: string[];
    };
  }>(path.join(inputDir, "watch-verdict.json"));
  const context = hydrateScenario(environment);
  const actual = {
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
  };
  const savedDigest = buildDigestSummary(saved.actual);
  const rerunDigest = buildDigestSummary(actual);
  if (savedDigest !== rerunDigest) {
    throw new Error(
      `Release watch rehearsal output drifted from rerun for ${environment}: ${savedDigest} != ${rerunDigest}`,
    );
  }
  if (saved.actual.watchState !== saved.expected.watchState) {
    throw new Error(
      `Saved watch verdict does not match expected state for ${environment}: ${saved.actual.watchState} != ${saved.expected.watchState}`,
    );
  }
  if (actual.watchState !== context.record.expected.watchState) {
    throw new Error(
      `Rerun watch verdict does not match expected state for ${environment}: ${actual.watchState} != ${context.record.expected.watchState}`,
    );
  }
  if (actual.watchState === "blocked" || actual.watchState === "rollback_required") {
    throw new Error(`Release watch rehearsal for ${environment} is not in a promotable posture.`);
  }
  console.log(
    JSON.stringify(
      {
        task_id: "par_097",
        environment,
        scenario_id: context.record.scenarioId,
        watch_state: actual.watchState,
        digest: rerunDigest,
      },
      null,
      2,
    ),
  );
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
