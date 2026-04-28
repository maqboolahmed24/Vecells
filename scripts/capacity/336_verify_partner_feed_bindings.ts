import {
  bootstrapPartnerFeeds,
  buildPartnerFeedRegistry,
  buildSmokeScenario,
  decisionClassesForFeed,
  type PartnerFeedVerificationSummary,
  writeVerificationSummary,
} from "./336_partner_feed_lib.ts";
import {
  buildSnapshotCommand,
  setupNetworkCapacityHarness,
} from "../../tests/integration/318_network_capacity.helpers.ts";

export async function runPartnerFeedVerification(
  outputDir?: string,
): Promise<PartnerFeedVerificationSummary> {
  await bootstrapPartnerFeeds({ outputDir });
  const registry = await buildPartnerFeedRegistry();
  const smoke = await buildSmokeScenario();
  const harness = await setupNetworkCapacityHarness("336_verify");
  const result = await harness.service.buildCandidateSnapshotForCase({
    ...buildSnapshotCommand("336_verify"),
    hubCoordinationCaseId: harness.claimed.hubCase.hubCoordinationCaseId,
    adapterBindings: smoke.bindings,
    deliveredMinutes: 120,
    cancelledMinutes: 0,
    replacementMinutes: 0,
  });

  const admissionByFeedId = new Map(
    result.sourceAdmissions.map((admission) => [
      admission.sourceRef,
      {
        sourceRef: admission.sourceRef,
        sourceIdentity: admission.sourceIdentity,
        admissionDisposition: admission.admissionDisposition,
        sourceTrustState: admission.sourceTrustState,
        sourceFreshnessState: admission.sourceFreshnessState,
      },
    ]),
  );

  const summary: PartnerFeedVerificationSummary = {
    taskId: "seq_336",
    verificationAt: result.snapshot?.fetchedAt ?? new Date().toISOString(),
    sourceAdmissionDispositions: registry.feeds
      .filter((feed) => admissionByFeedId.has(feed.feedId))
      .map((feed) => ({
        feedId: feed.feedId,
        ...(admissionByFeedId.get(feed.feedId) as {
          sourceRef: string;
          sourceIdentity: string;
          admissionDisposition: string;
          sourceTrustState: string;
          sourceFreshnessState: string;
        }),
      })),
    feedChecks: registry.feeds.map((feed) => {
      const admission = admissionByFeedId.get(feed.feedId);
      return {
        feedId: feed.feedId,
        verificationState:
          admission || feed.portalAutomationState === "manual_bridge_required"
            ? feed.verificationState
            : feed.verificationState,
        trustAdmissionState: feed.trustAdmissionState,
        decisionClasses: [
          ...decisionClassesForFeed(feed, admission?.admissionDisposition),
          ...result.supplyExceptions
            .filter((exception) => exception.sourceRef === feed.feedId)
            .map((exception) => exception.exceptionCode.toLowerCase()),
        ],
        samplePayloadRef: `sample://${feed.feedId}`,
      };
    }),
    snapshotId: result.snapshotId,
    decisionPlanId: result.decisionPlan?.decisionPlanId ?? null,
    capacityRankProofId: result.rankProof?.capacityRankProofId ?? null,
  };

  await writeVerificationSummary(outputDir ?? ".artifacts/capacity/336", summary);
  return summary;
}

async function main(): Promise<void> {
  const outputDirIndex = process.argv.indexOf("--output-dir");
  const outputDir =
    outputDirIndex >= 0 && process.argv[outputDirIndex + 1]
      ? process.argv[outputDirIndex + 1]
      : undefined;
  const summary = await runPartnerFeedVerification(outputDir);
  console.log(JSON.stringify(summary, null, 2));
}

if (process.argv[1]?.endsWith("336_verify_partner_feed_bindings.ts")) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
