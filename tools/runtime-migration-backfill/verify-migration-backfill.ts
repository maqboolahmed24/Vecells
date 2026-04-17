#!/usr/bin/env node

import path from "node:path";
import { stableDigest } from "../../packages/release-controls/src/build-provenance.ts";
import { hydrateExecutionContext, parseArgs, readJson } from "./shared.ts";

const args = parseArgs(process.argv);
const environment = args["--environment"] ?? "local";
const inputDir = path.resolve(
  args["--input-dir"] ?? `.artifacts/runtime-migration-backfill/${environment}`,
);

void (async () => {
  const saved = readJson<{
    settlement: { result: string; verdictState: string };
    routeReadinessVerdicts: Array<{ verdictState: string; reason: string }>;
  }>(path.join(inputDir, "execution-result.json"));
  const context = hydrateExecutionContext(environment);
  const rerun = await context.runner.execute({
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

  const savedDigest = stableDigest({
    settlement: saved.settlement.result,
    verdict: saved.routeReadinessVerdicts[0]?.verdictState ?? "blocked",
  });
  const rerunDigest = stableDigest({
    settlement: rerun.settlement.result,
    verdict: rerun.routeReadinessVerdicts[0]?.verdictState ?? "blocked",
  });
  if (savedDigest !== rerunDigest) {
    throw new Error(
      `Saved rehearsal output drifted from rerun for ${environment}: ${savedDigest} != ${rerunDigest}`,
    );
  }
  if (
    rerun.settlement.result === "blocked_policy" ||
    rerun.settlement.result === "rollback_required"
  ) {
    throw new Error(`Rehearsal for ${environment} did not stay in a non-blocked posture.`);
  }
  console.log(
    JSON.stringify(
      {
        task_id: "par_095",
        environment,
        settlement_result: rerun.settlement.result,
        verdict_state: rerun.routeReadinessVerdicts[0]?.verdictState ?? "blocked",
        digest: rerunDigest,
      },
      null,
      2,
    ),
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
