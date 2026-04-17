import { describe, expect, it } from "vitest";
import {
  Phase3TriageTransitionGuard,
  createPhase3TriageKernelService,
  createPhase3TriageKernelStore,
  phase3TriageLegalTransitions,
  type CreatePhase3TriageTaskInput,
  type Phase3CommandContext,
  type Phase3TriageTaskStatus,
} from "../src/index.ts";
import { createDeterministicBackboneIdGenerator } from "@vecells/domain-kernel";

function createTaskInput(seed: string): CreatePhase3TriageTaskInput {
  return {
    taskId: `task_${seed}`,
    requestId: `request_${seed}`,
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
    taskCompletionSettlementEnvelopeRef: `completion_envelope_${seed}`,
    createdAt: "2026-04-16T08:00:00Z",
  };
}

function command(seed: string, recordedAt: string): Phase3CommandContext {
  return {
    actorRef: `actor_${seed}`,
    routeIntentTupleHash: `route_tuple_${seed}`,
    routeIntentBindingRef: `route_binding_${seed}`,
    commandActionRecordRef: `action_${seed}`,
    commandSettlementRecordRef: `command_settlement_${seed}`,
    transitionEnvelopeRef: `transition_envelope_${seed}`,
    releaseRecoveryDispositionRef: `recovery_${seed}`,
    causalToken: `cause_${seed}`,
    recordedAt,
  };
}

async function seedQueuedTask(seed: string) {
  const repositories = createPhase3TriageKernelStore();
  const service = createPhase3TriageKernelService(repositories, {
    idGenerator: createDeterministicBackboneIdGenerator(`phase3_kernel_${seed}`),
  });
  const created = await service.createTask(createTaskInput(seed));
  const queued = await service.transitionTask({
    taskId: created.task.taskId,
    nextStatus: "queued",
    presentedOwnershipEpoch: created.task.ownershipEpoch,
    presentedFencingToken: created.task.fencingToken,
    presentedLineageFenceEpoch: created.task.currentLineageFenceEpoch,
    command: command(`${seed}_queued`, "2026-04-16T08:02:00Z"),
  });

  return { repositories, service, created, queued };
}

describe("phase 3 triage kernel", () => {
  it("enforces the frozen legal transition graph exactly", () => {
    const guard = new Phase3TriageTransitionGuard();
    const statuses = Object.keys(phase3TriageLegalTransitions) as Phase3TriageTaskStatus[];

    for (const previousStatus of statuses) {
      const legal = new Set(phase3TriageLegalTransitions[previousStatus]);
      for (const nextStatus of statuses) {
        const attempt = () => guard.assertWorkflowTransition(previousStatus, nextStatus);
        if (legal.has(nextStatus)) {
          expect(attempt).not.toThrow();
        } else {
          expect(attempt).toThrow(/Illegal triage workflow transition/i);
        }
      }
    }
  });

  it("rejects stale ownership epochs and stale fencing tokens on claim", async () => {
    const { service, queued } = await seedQueuedTask("claim_guard");

    await expect(
      service.claimTask({
        taskId: queued.task.taskId,
        actorRef: "actor_claim_guard",
        presentedOwnershipEpoch: queued.task.ownershipEpoch + 1,
        presentedFencingToken: queued.task.fencingToken,
        presentedLineageFenceEpoch: queued.task.currentLineageFenceEpoch,
        nextOwnershipEpoch: 1,
        nextLineageFenceEpoch: 1,
        nextFencingToken: "claim_guard_fence_v1",
        lifecycleLeaseRef: "lease_claim_guard_v1",
        leaseAuthorityRef: "lease_authority_claim_guard",
        leaseTtlSeconds: 300,
        claimedAt: "2026-04-16T08:03:00Z",
        command: command("claim_guard_stale_epoch", "2026-04-16T08:03:00Z"),
      }),
    ).rejects.toThrow(/ownership epoch|stale/i);

    await expect(
      service.claimTask({
        taskId: queued.task.taskId,
        actorRef: "actor_claim_guard",
        presentedOwnershipEpoch: queued.task.ownershipEpoch,
        presentedFencingToken: "stale_fencing_token",
        presentedLineageFenceEpoch: queued.task.currentLineageFenceEpoch,
        nextOwnershipEpoch: 1,
        nextLineageFenceEpoch: 1,
        nextFencingToken: "claim_guard_fence_v1",
        lifecycleLeaseRef: "lease_claim_guard_v1",
        leaseAuthorityRef: "lease_authority_claim_guard",
        leaseTtlSeconds: 300,
        claimedAt: "2026-04-16T08:03:30Z",
        command: command("claim_guard_stale_token", "2026-04-16T08:03:30Z"),
      }),
    ).rejects.toThrow(/fencing token|stale/i);

    const claimed = await service.claimTask({
      taskId: queued.task.taskId,
      actorRef: "actor_claim_guard",
      presentedOwnershipEpoch: queued.task.ownershipEpoch,
      presentedFencingToken: queued.task.fencingToken,
      presentedLineageFenceEpoch: queued.task.currentLineageFenceEpoch,
      nextOwnershipEpoch: 1,
      nextLineageFenceEpoch: 1,
      nextFencingToken: "claim_guard_fence_v1",
      lifecycleLeaseRef: "lease_claim_guard_v1",
      leaseAuthorityRef: "lease_authority_claim_guard",
      leaseTtlSeconds: 300,
      claimedAt: "2026-04-16T08:04:00Z",
      command: command("claim_guard_claim", "2026-04-16T08:04:00Z"),
    });

    await expect(
      service.enterReview({
        taskId: claimed.task.taskId,
        presentedOwnershipEpoch: claimed.task.ownershipEpoch,
        presentedFencingToken: "stale_fencing_token",
        presentedLineageFenceEpoch: claimed.task.currentLineageFenceEpoch,
        staffWorkspaceConsistencyProjectionRef: "workspace_consistency_claim_guard",
        workspaceSliceTrustProjectionRef: "workspace_slice_claim_guard",
        audienceSurfaceRuntimeBindingRef: "runtime_binding_claim_guard",
        reviewActionLeaseRef: "review_action_claim_guard",
        requestLifecycleLeaseRef: "lease_claim_guard_v1",
        selectedAnchorRef: "anchor_review_claim_guard",
        selectedAnchorTupleHashRef: "anchor_review_claim_guard_hash",
        openedAt: "2026-04-16T08:05:00Z",
        command: command("claim_guard_stale_review", "2026-04-16T08:05:00Z"),
      }),
    ).rejects.toThrow(/stale/i);
  });

  it("does not allow heartbeat to silently revive a released review session", async () => {
    const { repositories, service, queued } = await seedQueuedTask("heartbeat");

    const claimed = await service.claimTask({
      taskId: queued.task.taskId,
      actorRef: "actor_heartbeat",
      presentedOwnershipEpoch: queued.task.ownershipEpoch,
      presentedFencingToken: queued.task.fencingToken,
      presentedLineageFenceEpoch: queued.task.currentLineageFenceEpoch,
      nextOwnershipEpoch: 1,
      nextLineageFenceEpoch: 1,
      nextFencingToken: "heartbeat_fence_v1",
      lifecycleLeaseRef: "lease_heartbeat_v1",
      leaseAuthorityRef: "lease_authority_heartbeat",
      leaseTtlSeconds: 300,
      claimedAt: "2026-04-16T08:05:00Z",
      command: command("heartbeat_claim", "2026-04-16T08:05:00Z"),
    });

    const review = await service.enterReview({
      taskId: claimed.task.taskId,
      presentedOwnershipEpoch: claimed.task.ownershipEpoch,
      presentedFencingToken: claimed.task.fencingToken,
      presentedLineageFenceEpoch: claimed.task.currentLineageFenceEpoch,
      staffWorkspaceConsistencyProjectionRef: "workspace_consistency_heartbeat",
      workspaceSliceTrustProjectionRef: "workspace_slice_heartbeat",
      audienceSurfaceRuntimeBindingRef: "runtime_binding_heartbeat",
      reviewActionLeaseRef: "review_action_heartbeat",
      requestLifecycleLeaseRef: "lease_heartbeat_v1",
      selectedAnchorRef: "anchor_review_heartbeat",
      selectedAnchorTupleHashRef: "anchor_review_heartbeat_hash",
      openedAt: "2026-04-16T08:06:00Z",
      command: command("heartbeat_enter_review", "2026-04-16T08:06:00Z"),
    });

    const released = await service.releaseTask({
      taskId: review.task.taskId,
      presentedOwnershipEpoch: review.task.ownershipEpoch,
      presentedFencingToken: review.task.fencingToken,
      presentedLineageFenceEpoch: review.task.currentLineageFenceEpoch,
      nextLineageFenceEpoch: review.task.currentLineageFenceEpoch + 1,
      releasedAt: "2026-04-16T08:07:00Z",
      command: command("heartbeat_release", "2026-04-16T08:07:00Z"),
    });

    await expect(
      service.heartbeatReviewSession({
        taskId: review.task.taskId,
        reviewSessionId: review.reviewSession!.reviewSessionId,
        presentedOwnershipEpoch: released.task.ownershipEpoch,
        presentedFencingToken: released.task.fencingToken,
        presentedLineageFenceEpoch: released.task.currentLineageFenceEpoch,
        heartbeatAt: "2026-04-16T08:08:00Z",
      }),
    ).rejects.toThrow(/stale|active ownership state|review session/i);

    const sessions = await repositories.listReviewSessions();
    expect(sessions).toHaveLength(1);
    expect(sessions[0]?.toSnapshot().sessionState).toBe("release_pending");
  });

  it("keeps release audit append-only and retains earlier settlement witnesses", async () => {
    const { repositories, service, queued } = await seedQueuedTask("release_audit");

    const claimed = await service.claimTask({
      taskId: queued.task.taskId,
      actorRef: "actor_release_audit",
      presentedOwnershipEpoch: queued.task.ownershipEpoch,
      presentedFencingToken: queued.task.fencingToken,
      presentedLineageFenceEpoch: queued.task.currentLineageFenceEpoch,
      nextOwnershipEpoch: 1,
      nextLineageFenceEpoch: 1,
      nextFencingToken: "release_audit_fence_v1",
      lifecycleLeaseRef: "lease_release_audit_v1",
      leaseAuthorityRef: "lease_authority_release_audit",
      leaseTtlSeconds: 300,
      claimedAt: "2026-04-16T08:09:00Z",
      command: command("release_audit_claim", "2026-04-16T08:09:00Z"),
    });

    await service.enterReview({
      taskId: claimed.task.taskId,
      presentedOwnershipEpoch: claimed.task.ownershipEpoch,
      presentedFencingToken: claimed.task.fencingToken,
      presentedLineageFenceEpoch: claimed.task.currentLineageFenceEpoch,
      staffWorkspaceConsistencyProjectionRef: "workspace_consistency_release_audit",
      workspaceSliceTrustProjectionRef: "workspace_slice_release_audit",
      audienceSurfaceRuntimeBindingRef: "runtime_binding_release_audit",
      reviewActionLeaseRef: "review_action_release_audit",
      requestLifecycleLeaseRef: "lease_release_audit_v1",
      selectedAnchorRef: "anchor_review_release_audit",
      selectedAnchorTupleHashRef: "anchor_review_release_audit_hash",
      openedAt: "2026-04-16T08:10:00Z",
      command: command("release_audit_enter_review", "2026-04-16T08:10:00Z"),
    });

    const settlementsBeforeRelease = await repositories.listTaskCommandSettlements();
    const journalBeforeRelease = await repositories.listTransitionJournalEntriesForTask(
      claimed.task.taskId,
    );

    const released = await service.releaseTask({
      taskId: claimed.task.taskId,
      presentedOwnershipEpoch: claimed.task.ownershipEpoch,
      presentedFencingToken: claimed.task.fencingToken,
      presentedLineageFenceEpoch: claimed.task.currentLineageFenceEpoch,
      nextLineageFenceEpoch: claimed.task.currentLineageFenceEpoch + 1,
      releasedAt: "2026-04-16T08:11:00Z",
      command: command("release_audit_release", "2026-04-16T08:11:00Z"),
    });

    const settlementsAfterRelease = await repositories.listTaskCommandSettlements();
    const journalAfterRelease = await repositories.listTransitionJournalEntriesForTask(
      claimed.task.taskId,
    );

    expect(released.taskSettlement?.actionScope).toBe("task_release");
    expect(settlementsAfterRelease).toHaveLength(settlementsBeforeRelease.length + 1);
    expect(journalAfterRelease).toHaveLength(journalBeforeRelease.length + 1);
    expect(
      settlementsAfterRelease.some(
        (entry) =>
          entry.toSnapshot().settlementId === settlementsBeforeRelease[0]?.toSnapshot().settlementId,
      ),
    ).toBe(true);
  });

  it("makes stale-owner recovery explicit and traceable through supervisor takeover", async () => {
    const { repositories, service, queued } = await seedQueuedTask("takeover");

    const claimed = await service.claimTask({
      taskId: queued.task.taskId,
      actorRef: "actor_takeover",
      presentedOwnershipEpoch: queued.task.ownershipEpoch,
      presentedFencingToken: queued.task.fencingToken,
      presentedLineageFenceEpoch: queued.task.currentLineageFenceEpoch,
      nextOwnershipEpoch: 1,
      nextLineageFenceEpoch: 1,
      nextFencingToken: "takeover_fence_v1",
      lifecycleLeaseRef: "lease_takeover_v1",
      leaseAuthorityRef: "lease_authority_takeover",
      leaseTtlSeconds: 300,
      claimedAt: "2026-04-16T08:12:00Z",
      command: command("takeover_claim", "2026-04-16T08:12:00Z"),
    });

    const review = await service.enterReview({
      taskId: claimed.task.taskId,
      presentedOwnershipEpoch: claimed.task.ownershipEpoch,
      presentedFencingToken: claimed.task.fencingToken,
      presentedLineageFenceEpoch: claimed.task.currentLineageFenceEpoch,
      staffWorkspaceConsistencyProjectionRef: "workspace_consistency_takeover",
      workspaceSliceTrustProjectionRef: "workspace_slice_takeover",
      audienceSurfaceRuntimeBindingRef: "runtime_binding_takeover",
      reviewActionLeaseRef: "review_action_takeover",
      requestLifecycleLeaseRef: "lease_takeover_v1",
      selectedAnchorRef: "anchor_review_takeover",
      selectedAnchorTupleHashRef: "anchor_review_takeover_hash",
      openedAt: "2026-04-16T08:13:00Z",
      command: command("takeover_enter_review", "2026-04-16T08:13:00Z"),
    });

    const stale = await service.markStaleOwnerDetected({
      taskId: review.task.taskId,
      staleOwnerRecoveryRef: "stale_recovery_takeover_v1",
      nextLineageFenceEpoch: review.task.currentLineageFenceEpoch + 1,
      detectedAt: "2026-04-16T08:14:00Z",
      broken: true,
    });

    expect(stale.task.ownershipState).toBe("broken");
    expect(stale.task.staleOwnerRecoveryRef).toBe("stale_recovery_takeover_v1");

    const takeover = await service.takeOverStaleTask({
      taskId: stale.task.taskId,
      actorRef: "actor_supervisor_takeover",
      staleOwnerRecoveryRef: stale.task.staleOwnerRecoveryRef!,
      nextOwnershipEpoch: 2,
      nextLineageFenceEpoch: stale.task.currentLineageFenceEpoch + 1,
      nextFencingToken: "takeover_fence_v2",
      lifecycleLeaseRef: "lease_takeover_v2",
      leaseAuthorityRef: "lease_authority_takeover",
      leaseTtlSeconds: 300,
      takeoverAt: "2026-04-16T08:15:00Z",
      command: command("takeover_commit", "2026-04-16T08:15:00Z"),
    });

    const journal = await repositories.listTransitionJournalEntriesForTask(takeover.task.taskId);

    expect(takeover.task.status).toBe("claimed");
    expect(takeover.task.assignedTo).toBe("actor_supervisor_takeover");
    expect(takeover.task.staleOwnerRecoveryRef).toBeNull();
    expect(takeover.reviewSession?.sessionState).toBe("superseded");
    expect(takeover.transitionJournalEntry?.reasonCode).toBe("supervisor_takeover_committed");
    expect(journal.at(-1)?.toSnapshot().reasonCode).toBe("supervisor_takeover_committed");
  });
});
