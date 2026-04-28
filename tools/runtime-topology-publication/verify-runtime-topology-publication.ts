#!/usr/bin/env node

import path from "node:path";
import {
  buildMetricsDigest,
  buildRehearsalVerdict,
  hydrateScenario,
  parseArgs,
  readJson,
} from "./shared.ts";

const args = parseArgs(process.argv);
const environment = args["--environment"] ?? "local";
const inputDir = path.resolve(
  args["--input-dir"] ?? `.artifacts/runtime-topology-publication/${environment}`,
);

try {
  const saved = readJson<{
    scenarioId: string;
    environmentRing: string;
    expected: {
      publishable: boolean;
      publicationEligibilityState: "publishable" | "blocked";
      bindingCompleteness: number;
      driftFindingCount: number;
      blockedReasonRefs: string[];
    };
    actual: {
      publishable: boolean;
      publicationEligibilityState: "publishable" | "blocked";
      bindingCompleteness: number;
      driftFindingCount: number;
      blockedReasonRefs: string[];
    };
    digests: {
      verdict: string;
      metrics: string;
    };
  }>(path.join(inputDir, "runtime-topology-publication-verdict.json"));
  const context = hydrateScenario(environment, saved.scenarioId);
  const rerun = buildRehearsalVerdict(
    context.simulationHarness.scenario,
    context.simulationHarness.verdict,
    context.simulationHarness.metrics,
  );

  if (saved.digests.verdict !== rerun.digests.verdict) {
    throw new Error(
      `Runtime topology publication verdict drifted for ${environment}: ${saved.digests.verdict} != ${rerun.digests.verdict}`,
    );
  }
  if (saved.digests.metrics !== buildMetricsDigest(context.simulationHarness.metrics)) {
    throw new Error(`Runtime topology publication metrics drifted for ${environment}.`);
  }
  if (rerun.actual.publishable !== rerun.expected.publishable) {
    throw new Error(
      `Publishable state drifted for ${environment}: ${rerun.actual.publishable} != ${rerun.expected.publishable}`,
    );
  }
  if (rerun.actual.publicationEligibilityState !== rerun.expected.publicationEligibilityState) {
    throw new Error(
      `Eligibility state drifted for ${environment}: ${rerun.actual.publicationEligibilityState} != ${rerun.expected.publicationEligibilityState}`,
    );
  }
  if (
    rerun.actual.bindingCompleteness !== rerun.expected.bindingCompleteness ||
    rerun.actual.driftFindingCount !== rerun.expected.driftFindingCount
  ) {
    throw new Error(`Binding completeness or drift count drifted for ${environment}.`);
  }
  const actualReasons = [...rerun.actual.blockedReasonRefs].sort().join(",");
  const expectedReasons = [...rerun.expected.blockedReasonRefs].sort().join(",");
  if (actualReasons !== expectedReasons) {
    throw new Error(
      `Blocked reason refs drifted for ${environment}: ${actualReasons} != ${expectedReasons}`,
    );
  }

  console.log(
    JSON.stringify(
      {
        task_id: "par_099",
        environment,
        scenario_id: rerun.scenarioId,
        publishable: rerun.actual.publishable,
        digest: rerun.digests.verdict,
      },
      null,
      2,
    ),
  );
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
