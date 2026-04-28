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
  args["--input-dir"] ?? `.artifacts/runtime-dependency-degradation/${environment}`,
);

try {
  const saved = readJson<{
    scenarioId: string;
    environmentRing: string;
    dependencyCode: string;
    expected: {
      decisionState: string;
      gatewayReadMode: string;
      browserMutationMode: string;
      projectionPublicationMode: string;
      integrationDispatchMode: string;
    };
    actual: {
      decisionState: string;
      outcomeState: string;
      gatewayReadMode: string;
      browserMutationMode: string;
      projectionPublicationMode: string;
      integrationDispatchMode: string;
      assurancePublicationState: string;
      primaryAudienceFallbackMode: string;
      recoveryReadyToClear: boolean;
      blockedEscalationFamilyRefs: string[];
    };
    digests: {
      verdict: string;
      catalogMetrics: string;
    };
  }>(path.join(inputDir, "dependency-degradation-verdict.json"));
  const context = hydrateScenario(environment, saved.scenarioId);
  const rerun = buildRehearsalVerdict(
    context.scenario,
    context.decision,
    buildMetricsDigest(context.simulationHarness.metrics),
  );

  if (saved.digests.verdict !== rerun.digests.verdict) {
    throw new Error(
      `Dependency degradation rehearsal output drifted from rerun for ${environment}: ${saved.digests.verdict} != ${rerun.digests.verdict}`,
    );
  }
  if (saved.digests.catalogMetrics !== rerun.digests.catalogMetrics) {
    throw new Error(
      `Dependency degradation catalog metrics drifted for ${environment}: ${saved.digests.catalogMetrics} != ${rerun.digests.catalogMetrics}`,
    );
  }
  if (rerun.actual.decisionState !== rerun.expected.decisionState) {
    throw new Error(
      `Rerun decision state does not match expected state for ${environment}: ${rerun.actual.decisionState} != ${rerun.expected.decisionState}`,
    );
  }
  if (rerun.actual.gatewayReadMode !== rerun.expected.gatewayReadMode) {
    throw new Error(
      `Rerun gateway mode does not match expected mode for ${environment}: ${rerun.actual.gatewayReadMode} != ${rerun.expected.gatewayReadMode}`,
    );
  }
  if (rerun.actual.browserMutationMode !== rerun.expected.browserMutationMode) {
    throw new Error(
      `Rerun browser mutation mode does not match expected mode for ${environment}: ${rerun.actual.browserMutationMode} != ${rerun.expected.browserMutationMode}`,
    );
  }
  if (rerun.actual.projectionPublicationMode !== rerun.expected.projectionPublicationMode) {
    throw new Error(
      `Rerun projection mode does not match expected mode for ${environment}: ${rerun.actual.projectionPublicationMode} != ${rerun.expected.projectionPublicationMode}`,
    );
  }
  if (rerun.actual.integrationDispatchMode !== rerun.expected.integrationDispatchMode) {
    throw new Error(
      `Rerun integration mode does not match expected mode for ${environment}: ${rerun.actual.integrationDispatchMode} != ${rerun.expected.integrationDispatchMode}`,
    );
  }

  console.log(
    JSON.stringify(
      {
        task_id: "par_098",
        environment,
        scenario_id: rerun.scenarioId,
        decision_state: rerun.actual.decisionState,
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
