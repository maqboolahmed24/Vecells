#!/usr/bin/env node

import path from "node:path";
import { hydrateExecutionContext, parseArgs, writeJson } from "./shared.ts";

const args = parseArgs(process.argv);
const environment = args["--environment"] ?? "local";
const outputDir = path.resolve(
  args["--output-dir"] ?? `.artifacts/runtime-migration-backfill/${environment}`,
);

void (async () => {
  const context = hydrateExecutionContext(environment);
  const result = await context.runner.execute({
    plan: context.plan,
    backfillPlan: context.backfillPlan,
    binding: context.binding,
    bundle: context.bundle,
    currentBundle: context.currentBundle,
    parityRecord: context.parityRecord,
    currentParity: context.currentParity,
    projectionWorker: context.projectionWorker,
    eventStream: context.eventStream,
    targets: [
      {
        projectionFamilyRef: context.backfillPlan.projectionFamilyRef,
        projectionVersionRef: context.backfillPlan.projectionVersionRef,
        projectionVersionSetRef: context.backfillPlan.projectionContractVersionSetRefs[0]!,
      },
    ],
    intent: "dry_run",
    options: {
      operatorRef: "operator::ci-rehearsal",
      observedMinutes: context.record.observedMinutes,
      observedSamples: context.record.observedSamples,
      comparisonMatches: context.record.comparisonMatches,
      rollbackModeMatches: context.record.rollbackModeMatches,
      routeIntentBindingRef: `rib::${context.record.scenarioId.toLowerCase()}`,
    },
  });

  writeJson(path.join(outputDir, "execution-result.json"), result);
  writeJson(path.join(outputDir, "impact-preview.json"), result.impactPreview);
  writeJson(path.join(outputDir, "observation-window.json"), result.observationWindow);
  writeJson(path.join(outputDir, "route-readiness.json"), result.routeReadinessVerdicts);
  console.log(
    JSON.stringify(
      {
        task_id: "par_095",
        environment,
        output_dir: outputDir,
        settlement_result: result.settlement.result,
        verdict_state: result.routeReadinessVerdicts[0]?.verdictState ?? "blocked",
      },
      null,
      2,
    ),
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
