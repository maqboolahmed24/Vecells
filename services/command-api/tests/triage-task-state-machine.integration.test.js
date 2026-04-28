import { describe, expect, it } from "vitest";
import { createPhase3TriageKernelApplication } from "../src/phase3-triage-kernel.ts";

function createTaskInput(seed) {
  return {
    taskId: `task_${seed}`,
    requestId: `request_${seed}`,
    episodeId: `episode_${seed}`,
    requestLineageRef: `lineage_${seed}`,
    queueKey: `queue_${seed}`,
    sourceQueueRankSnapshotRef: `rank_${seed}`,
    returnAnchorRef: `anchor_${seed}`,
    returnAnchorTupleHash: `anchor_hash_${seed}`,
    selectedAnchorRef: `anchor_${seed}`,
    selectedAnchorTupleHash: `anchor_hash_${seed}`,
    workspaceTrustEnvelopeRef: `trust_${seed}`,
    surfaceRouteContractRef: `route_contract_${seed}`,
    surfacePublicationRef: `publication_${seed}`,
    runtimePublicationBundleRef: `runtime_${seed}`,
    taskCompletionSettlementEnvelopeRef: `completion_${seed}`,
    createdAt: "2026-04-16T09:00:00Z",
  };
}

describe("phase 3 triage kernel application seam", () => {
  it("routes claim, review, and release through lease and settlement backbones without deleting prior audit", async () => {
    const application = createPhase3TriageKernelApplication();

    const created = await application.createTask(createTaskInput("cmdapi_release"));
    const queued = await application.moveTaskToQueue({
      taskId: created.task.taskId,
      actorRef: "actor_cmdapi_release",
      queuedAt: "2026-04-16T09:01:00Z",
    });
    const claimed = await application.claimTask({
      taskId: queued.task.taskId,
      actorRef: "actor_cmdapi_release",
      claimedAt: "2026-04-16T09:02:00Z",
    });
    const review = await application.enterReview({
      taskId: claimed.task.taskId,
      actorRef: "actor_cmdapi_release",
      openedAt: "2026-04-16T09:03:00Z",
      staffWorkspaceConsistencyProjectionRef: "workspace_consistency_cmdapi_release",
      workspaceSliceTrustProjectionRef: "workspace_slice_cmdapi_release",
      audienceSurfaceRuntimeBindingRef: "runtime_binding_cmdapi_release",
      reviewActionLeaseRef: "review_action_cmdapi_release",
      selectedAnchorRef: "anchor_review_cmdapi_release",
      selectedAnchorTupleHashRef: "anchor_review_cmdapi_release_hash",
    });

    const settlementsBeforeRelease =
      await application.triageRepositories.listTaskCommandSettlements();
    const release = await application.releaseTask({
      taskId: review.task.taskId,
      actorRef: "actor_cmdapi_release",
      releasedAt: "2026-04-16T09:04:00Z",
    });

    const taskSettlementsAfterRelease =
      await application.triageRepositories.listTaskCommandSettlements();
    const controlPlaneLeases = await application.controlPlaneRepositories.listRequestLifecycleLeases();
    const commandActions = await application.controlPlaneRepositories.listCommandActionRecords();
    const commandSettlements =
      await application.controlPlaneRepositories.listCommandSettlementRecords();

    expect(application.migrationPlanRef).toBe(
      "services/command-api/migrations/110_phase3_triage_task_kernel.sql",
    );
    expect(application.migrationPlanRefs.at(0)).toBe(
      "services/command-api/migrations/062_submission_and_lineage_backbone.sql",
    );
    expect(application.persistenceTables).toContain("phase3_triage_tasks");
    expect(commandActions).toHaveLength(3);
    expect(commandSettlements).toHaveLength(3);
    expect(taskSettlementsAfterRelease).toHaveLength(settlementsBeforeRelease.length + 1);
    expect(
      taskSettlementsAfterRelease.some(
        (entry) =>
          entry.toSnapshot().settlementId === settlementsBeforeRelease[0]?.toSnapshot().settlementId,
      ),
    ).toBe(true);
    expect(release.task.ownershipState).toBe("releasing");
    expect(release.task.currentLineageFenceEpoch).toBeGreaterThan(
      claimed.task.currentLineageFenceEpoch,
    );
    expect(controlPlaneLeases).toHaveLength(1);
    expect(controlPlaneLeases[0]?.toSnapshot().state).toBe("released");
  });

  it("opens stale-owner recovery and takeover records explicitly and rejects stale post-takeover writes", async () => {
    const application = createPhase3TriageKernelApplication();

    const created = await application.createTask(createTaskInput("cmdapi_takeover"));
    await application.moveTaskToQueue({
      taskId: created.task.taskId,
      actorRef: "actor_cmdapi_takeover",
      queuedAt: "2026-04-16T09:11:00Z",
    });
    const claimed = await application.claimTask({
      taskId: created.task.taskId,
      actorRef: "actor_cmdapi_takeover",
      claimedAt: "2026-04-16T09:12:00Z",
    });
    const review = await application.enterReview({
      taskId: claimed.task.taskId,
      actorRef: "actor_cmdapi_takeover",
      openedAt: "2026-04-16T09:13:00Z",
      staffWorkspaceConsistencyProjectionRef: "workspace_consistency_cmdapi_takeover",
      workspaceSliceTrustProjectionRef: "workspace_slice_cmdapi_takeover",
      audienceSurfaceRuntimeBindingRef: "runtime_binding_cmdapi_takeover",
      reviewActionLeaseRef: "review_action_cmdapi_takeover",
      selectedAnchorRef: "anchor_review_cmdapi_takeover",
      selectedAnchorTupleHashRef: "anchor_review_cmdapi_takeover_hash",
    });

    const stale = await application.markStaleOwnerDetected({
      taskId: review.task.taskId,
      authorizedByRef: "supervisor_cmdapi_takeover",
      detectedAt: "2026-04-16T09:14:00Z",
      breakReason: "supervisor_break_for_stale_owner",
      breakGuardSeconds: 0,
    });

    const recoveriesAfterBreak =
      await application.controlPlaneRepositories.listStaleOwnershipRecoveryRecords();
    expect(recoveriesAfterBreak).toHaveLength(1);
    expect(recoveriesAfterBreak[0]?.toSnapshot().resolutionState).toBe("open");
    expect(stale.task.ownershipState).toBe("broken");

    const takeover = await application.takeOverStaleTask({
      taskId: stale.task.taskId,
      actorRef: "actor_supervisor_takeover",
      authorizedByRef: "supervisor_cmdapi_takeover",
      takeoverAt: "2026-04-16T09:15:00Z",
      takeoverReason: "supervisor_takeover_for_triage_case",
    });

    const recoveriesAfterTakeover =
      await application.controlPlaneRepositories.listStaleOwnershipRecoveryRecords();
    const takeoverRecords = await application.controlPlaneRepositories.listLeaseTakeoverRecords();

    expect(takeover.task.assignedTo).toBe("actor_supervisor_takeover");
    expect(takeover.transitionJournalEntry?.reasonCode).toBe("supervisor_takeover_committed");
    expect(recoveriesAfterTakeover[0]?.toSnapshot().resolutionState).toBe("resolved");
    expect(takeoverRecords).toHaveLength(1);
    expect(takeoverRecords[0]?.toSnapshot().takeoverState).toBe("committed");

    await expect(
      application.leaseAuthority.registerCommandAction({
        leaseId: claimed.task.lifecycleLeaseRef,
        domain: "triage_workspace",
        domainObjectRef: claimed.task.taskId,
        governingObjectVersionRef: `${claimed.task.taskId}@v${review.task.reviewVersion}`,
        presentedOwnershipEpoch: claimed.task.ownershipEpoch,
        presentedFencingToken: claimed.task.fencingToken,
        presentedLineageFenceEpoch: claimed.task.currentLineageFenceEpoch,
        actionScope: "start_review",
        governingObjectRef: claimed.task.taskId,
        canonicalObjectDescriptorRef: "TriageTask",
        initiatingBoundedContextRef: "triage_workspace",
        governingBoundedContextRef: "triage_workspace",
        lineageScope: "request",
        routeIntentRef: "route_intent_stale_post_takeover",
        routeContractDigestRef: "route_contract_digest_stale_post_takeover_v1",
        requiredContextBoundaryRefs: [],
        parentAnchorRef: claimed.task.launchContextRef,
        edgeCorrelationId: "edge_stale_post_takeover",
        initiatingUiEventRef: "ui_event_stale_post_takeover",
        initiatingUiEventCausalityFrameRef: "ui_frame_stale_post_takeover",
        actingContextRef: "staff_workspace",
        policyBundleRef: "policy_triage_workspace_v1",
        sourceCommandId: "cmd_stale_post_takeover",
        transportCorrelationId: "transport_stale_post_takeover",
        semanticPayload: { attempt: "stale_owner_retry" },
        idempotencyKey: "idempotency_stale_post_takeover",
        idempotencyRecordRef: "idempotency_record_stale_post_takeover",
        commandFollowingTokenRef: "command_follow_stale_post_takeover",
        expectedEffectSetRefs: ["triage.retry.stale_post_takeover"],
        causalToken: "causal_stale_post_takeover",
        createdAt: "2026-04-16T09:16:00Z",
        sameShellRecoveryRouteRef: "/workspace/tasks/task_cmdapi_takeover/recover",
        operatorVisibleWorkRef: "work_task_cmdapi_takeover",
        blockedActionScopeRefs: ["start_review"],
        detectedByRef: "actor_cmdapi_takeover",
      }),
    ).rejects.toThrow(/stale/i);
  });
});
