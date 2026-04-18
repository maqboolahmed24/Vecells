import { createQueueRankingApplication } from "../../services/command-api/src/queue-ranking.ts";
import { createPhase3TriageKernelApplication } from "../../services/command-api/src/phase3-triage-kernel.ts";
import {
  assertCondition,
  importPlaywright,
  openQueueFairnessScenario,
  startQueueFairnessLabServer,
  stopQueueFairnessLabServer,
  takeQueueLabTrace,
} from "./272_queue_suite_helpers";

function createTaskInput(seed: string) {
  return {
    taskId: `task_${seed}`,
    requestId: `request_${seed}`,
    episodeId: `episode_${seed}`,
    requestLineageRef: `lineage_${seed}`,
    queueKey: `queue_${seed}`,
    sourceQueueRankSnapshotRef: `rank_${seed}`,
    returnAnchorRef: `queue-row-${seed}`,
    returnAnchorTupleHash: `queue-row-${seed}::tuple`,
    selectedAnchorRef: `queue-row-${seed}`,
    selectedAnchorTupleHash: `queue-row-${seed}::tuple`,
    workspaceTrustEnvelopeRef: `trust_${seed}`,
    surfaceRouteContractRef: `route_contract_${seed}`,
    surfacePublicationRef: `publication_${seed}`,
    runtimePublicationBundleRef: `runtime_${seed}`,
    taskCompletionSettlementEnvelopeRef: `completion_${seed}`,
    createdAt: "2026-04-18T10:00:00.000Z",
  };
}

async function seedReviewTask(application: ReturnType<typeof createPhase3TriageKernelApplication>, seed: string) {
  await application.createTask(createTaskInput(seed));
  await application.moveTaskToQueue({
    taskId: `task_${seed}`,
    actorRef: `actor_${seed}`,
    queuedAt: "2026-04-18T10:01:00.000Z",
  });
  await application.claimTask({
    taskId: `task_${seed}`,
    actorRef: `actor_${seed}`,
    claimedAt: "2026-04-18T10:02:00.000Z",
  });
  return application.enterReview({
    taskId: `task_${seed}`,
    actorRef: `actor_${seed}`,
    openedAt: "2026-04-18T10:03:00.000Z",
    staffWorkspaceConsistencyProjectionRef: `workspace_consistency_${seed}`,
    workspaceSliceTrustProjectionRef: `workspace_slice_${seed}`,
    audienceSurfaceRuntimeBindingRef: `runtime_binding_${seed}`,
    reviewActionLeaseRef: `review_action_${seed}`,
    selectedAnchorRef: `anchor_review_${seed}`,
    selectedAnchorTupleHashRef: `anchor_review_hash_${seed}`,
  });
}

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const queueApplication = createQueueRankingApplication();
  const softClaimRace = await queueApplication.runScenarioById("soft_claim_race_serialized");
  assertCondition(softClaimRace.softClaimOutcome === "blocked_race", "soft claim race must serialize to one winner");

  const triageApplication = createPhase3TriageKernelApplication();
  await seedReviewTask(triageApplication, "272_takeover");
  const stale = await triageApplication.markStaleOwnerDetected({
    taskId: "task_272_takeover",
    authorizedByRef: "supervisor_272_takeover",
    detectedAt: "2026-04-18T10:06:00.000Z",
    breakReason: "queue_governance_suite_recovery",
    breakGuardSeconds: 0,
  });
  const beforeTakeover = await triageApplication.triageRepositories.getTask("task_272_takeover");
  const staleSnapshot = beforeTakeover?.toSnapshot();
  const takeover = await triageApplication.takeOverStaleTask({
    taskId: "task_272_takeover",
    actorRef: "reviewer_replacement_272",
    authorizedByRef: "supervisor_272_takeover",
    takeoverAt: "2026-04-18T10:07:00.000Z",
    takeoverReason: "governed_supervisor_takeover",
    ownerSessionRef: "replacement_session_272",
    leaseTtlSeconds: 300,
  });
  assertCondition(
    stale.task.staleOwnerRecoveryRef !== null,
    "stale-owner recovery should create an explicit recovery record",
  );
  assertCondition(
    takeover.task.ownershipEpoch > (staleSnapshot?.ownershipEpoch ?? 0),
    "takeover must advance ownership epoch",
  );
  assertCondition(
    takeover.task.currentLineageFenceEpoch > (staleSnapshot?.currentLineageFenceEpoch ?? 0),
    "takeover must advance the lineage fence epoch",
  );
  assertCondition(
    takeover.task.launchContextRef === stale.task.launchContextRef,
    "stale-owner takeover must preserve the same launch context for continuity",
  );

  const { server, atlasUrl } = await startQueueFairnessLabServer();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({ viewport: { width: 1480, height: 980 } });
    await context.tracing.start({ screenshots: true, snapshots: true });
    const actorOne = await context.newPage();
    const actorTwo = await context.newPage();

    await openQueueFairnessScenario(actorOne, atlasUrl, "claim_race");
    await openQueueFairnessScenario(actorTwo, atlasUrl, "stale_owner_recovery");

    assertCondition(
      (await actorOne.locator("[data-testid='OwnershipEpochLadder']").getAttribute("data-ownership-mode")) ===
        "claim_race",
      "claim race scenario did not render the ownership ladder in claim-race mode",
    );
    assertCondition(
      (await actorOne.locator("[data-testid='OwnershipEpochLadder']").textContent())?.includes(
        "Second claim rejected with the stale queue fence",
      ) === true,
      "claim race ladder lost the stale-claim rejection step",
    );

    assertCondition(
      (await actorTwo.locator("[data-testid='OwnershipEpochLadder']").getAttribute("data-ownership-mode")) ===
        "stale_owner_recovery",
      "stale-owner recovery scenario did not render the ownership ladder in recovery mode",
    );
    assertCondition(
      (await actorTwo.locator("[data-testid='OwnershipEpochLadder']").textContent())?.includes(
        "Supervisor takeover committed with epoch 8",
      ) === true,
      "stale-owner recovery ladder lost the takeover step",
    );

    await takeQueueLabTrace(context, "272-queue-concurrency-trace.zip");
  } finally {
    await browser.close();
    await stopQueueFairnessLabServer(server);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
