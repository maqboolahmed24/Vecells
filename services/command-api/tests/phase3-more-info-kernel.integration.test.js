import { describe, expect, it } from "vitest";
import {
  PHASE3_MORE_INFO_QUERY_SURFACES,
  PHASE3_MORE_INFO_SCHEMA_VERSION,
  PHASE3_MORE_INFO_SERVICE_NAME,
  createPhase3MoreInfoKernelApplication,
  phase3MoreInfoKernelMigrationPlanRefs,
  phase3MoreInfoKernelPersistenceTables,
  phase3MoreInfoRoutes,
} from "../src/phase3-more-info-kernel.ts";

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
    createdAt: "2026-04-16T09:00:00.000Z",
  };
}

async function seedReviewTask(application, seed) {
  const created = await application.triageApplication.createTask(createTaskInput(seed));
  const queued = await application.triageApplication.moveTaskToQueue({
    taskId: created.task.taskId,
    actorRef: `actor_${seed}`,
    queuedAt: "2026-04-16T09:01:00.000Z",
  });
  const claimed = await application.triageApplication.claimTask({
    taskId: queued.task.taskId,
    actorRef: `actor_${seed}`,
    claimedAt: "2026-04-16T09:02:00.000Z",
  });
  return application.triageApplication.enterReview({
    taskId: claimed.task.taskId,
    actorRef: `actor_${seed}`,
    openedAt: "2026-04-16T09:03:00.000Z",
    staffWorkspaceConsistencyProjectionRef: `workspace_consistency_${seed}`,
    workspaceSliceTrustProjectionRef: `workspace_slice_${seed}`,
    audienceSurfaceRuntimeBindingRef: `runtime_binding_${seed}`,
    reviewActionLeaseRef: `review_action_${seed}`,
    selectedAnchorRef: `anchor_review_${seed}`,
    selectedAnchorTupleHashRef: `anchor_review_hash_${seed}`,
  });
}

function requestInput(seed, overrides = {}) {
  return {
    taskId: `task_${seed}`,
    actorRef: `actor_${seed}`,
    recordedAt: "2026-04-16T09:04:00.000Z",
    promptSetRef: `prompt_${seed}`,
    channelRef: "sms_outbound",
    responseRouteFamilyRef: "patient_more_info",
    dueAt: "2026-04-16T09:20:00.000Z",
    expiresAt: "2026-04-16T10:20:00.000Z",
    reminderOffsetsMinutes: [5, 10],
    cadencePolicyRef: "reply_window_policy_v1",
    quietHoursWindow: null,
    ...overrides,
  };
}

describe("phase 3 more-info kernel application seam", () => {
  it("publishes the 236 request-more-info, recompute, reminder, and worker surfaces against triage tasks", async () => {
    const application = createPhase3MoreInfoKernelApplication();
    await seedReviewTask(application, "236_surface");

    const requested = await application.requestMoreInfo(requestInput("236_surface"));
    const queried = await application.queryTaskMoreInfo("task_236_surface");
    const leases =
      await application.triageApplication.controlPlaneRepositories.listRequestLifecycleLeases();
    const grants = await application.identityRepositories.listAccessGrants();

    expect(application.serviceName).toBe(PHASE3_MORE_INFO_SERVICE_NAME);
    expect(application.schemaVersion).toBe(PHASE3_MORE_INFO_SCHEMA_VERSION);
    expect(application.querySurfaces).toEqual(PHASE3_MORE_INFO_QUERY_SURFACES);
    expect(application.routes).toEqual(phase3MoreInfoRoutes);
    expect(application.migrationPlanRef).toBe(
      "services/command-api/migrations/112_phase3_more_info_cycle_kernel.sql",
    );
    expect(application.migrationPlanRefs).toEqual(phase3MoreInfoKernelMigrationPlanRefs);
    expect(phase3MoreInfoKernelPersistenceTables).toEqual(
      expect.arrayContaining([
        "phase3_more_info_cycles",
        "phase3_more_info_reply_window_checkpoints",
        "phase3_more_info_reminder_schedules",
        "phase3_more_info_outbox_entries",
      ]),
    );
    expect(requested.taskTransition?.task.status).toBe("awaiting_patient_info");
    expect(requested.responseGrant.grantRef).toBeTruthy();
    expect(requested.initialOutboxEntry.dispatchState).toBe("pending");
    expect(queried?.cycle.cycleId).toBe(requested.cycle.cycleId);
    expect(queried?.checkpoint.replyWindowState).toBe("open");
    expect(grants).toHaveLength(1);
    expect(grants[0]?.toSnapshot().actionScope).toBe("respond_more_info");
    expect(
      leases
        .map((lease) => lease.toSnapshot())
        .filter((lease) => lease.domain === "triage_more_info" && lease.state === "active"),
    ).toHaveLength(1);
  });

  it("requires explicit supersession before replacement and keeps the task in awaiting_patient_info on replacement", async () => {
    const application = createPhase3MoreInfoKernelApplication();
    await seedReviewTask(application, "236_replace");

    const first = await application.requestMoreInfo(requestInput("236_replace"));

    await expect(
      application.requestMoreInfo(
        requestInput("236_replace", {
          recordedAt: "2026-04-16T09:05:00.000Z",
          promptSetRef: "prompt_236_replace_v2",
          dueAt: "2026-04-16T09:40:00.000Z",
          expiresAt: "2026-04-16T10:40:00.000Z",
        }),
      ),
    ).rejects.toThrow(/explicitly superseded/i);

    const replacement = await application.requestMoreInfo(
      requestInput("236_replace", {
        recordedAt: "2026-04-16T09:06:00.000Z",
        promptSetRef: "prompt_236_replace_v2",
        dueAt: "2026-04-16T09:40:00.000Z",
        expiresAt: "2026-04-16T10:40:00.000Z",
        supersedeActiveCycleId: first.cycle.cycleId,
      }),
    );

    const grants = await application.identityRepositories.listAccessGrants();
    const liveGrantStates = grants.map((grant) => grant.toSnapshot().grantState);

    expect(replacement.taskTransition).toBeNull();
    expect(replacement.supersededCycle?.cycle.cycleId).toBe(first.cycle.cycleId);
    expect(replacement.supersededCycle?.cycle.state).toBe("superseded");
    expect(replacement.supersededCycle?.checkpoint.replyWindowState).toBe("superseded");
    expect(replacement.cycle.supersedesCycleRef).toBe(first.cycle.cycleId);
    expect(liveGrantStates.filter((state) => state === "live")).toHaveLength(1);
    expect(
      application
        .listOutboxEntries()
        .filter(
          (entry) => entry.cycleId === first.cycle.cycleId && entry.dispatchState === "pending",
        ),
    ).toHaveLength(0);
  });

  it("suppresses quiet-hours reminders and stays replay-safe across worker restarts", async () => {
    const application = createPhase3MoreInfoKernelApplication();
    await seedReviewTask(application, "236_worker");

    const requested = await application.requestMoreInfo(
      requestInput("236_worker", {
        dueAt: "2026-04-16T11:30:00.000Z",
        expiresAt: "2026-04-16T12:30:00.000Z",
        reminderOffsetsMinutes: [1],
        quietHoursWindow: {
          policyRef: "quiet_hours_09_10",
          startHourUtc: 9,
          endHourUtc: 10,
        },
      }),
    );

    const initial = await application.drainReminderWorker({
      evaluatedAt: "2026-04-16T09:04:00.000Z",
    });
    const suppressed = await application.drainReminderWorker({
      evaluatedAt: "2026-04-16T09:05:30.000Z",
    });
    const suppressedReplay = await application.drainReminderWorker({
      evaluatedAt: "2026-04-16T09:05:30.000Z",
    });
    const released = await application.drainReminderWorker({
      evaluatedAt: "2026-04-16T10:00:00.000Z",
    });
    const releasedReplay = await application.drainReminderWorker({
      evaluatedAt: "2026-04-16T10:00:00.000Z",
    });

    const current = await application.queryTaskMoreInfo("task_236_worker");

    expect(initial.dispatched.map((entry) => entry.effectType)).toEqual(["initial_delivery"]);
    expect(suppressed.dispatched.map((entry) => entry.effectType)).toEqual(["suppressed"]);
    expect(
      suppressed.outboxEntries.filter((entry) => entry.effectType === "reminder_send"),
    ).toHaveLength(0);
    expect(
      suppressedReplay.outboxEntries.filter((entry) => entry.effectType === "reminder_send"),
    ).toHaveLength(0);
    expect(released.dispatched.map((entry) => entry.effectType)).toEqual(["reminder_send"]);
    expect(released.outboxEntries.filter((entry) => entry.effectType === "reminder_send")).toHaveLength(1);
    expect(releasedReplay.outboxEntries.filter((entry) => entry.effectType === "reminder_send")).toHaveLength(1);
    expect(current?.cycle.cycleId).toBe(requested.cycle.cycleId);
    expect(current?.schedule.scheduleState).toBe("exhausted");
    expect(current?.checkpoint.replyWindowState).toBe("open");
  });

  it("suppresses reminder authority after late review starts instead of sending stale jobs", async () => {
    const application = createPhase3MoreInfoKernelApplication();
    await seedReviewTask(application, "236_late_review");

    const requested = await application.requestMoreInfo(
      requestInput("236_late_review", {
        dueAt: "2026-04-16T09:08:00.000Z",
        expiresAt: "2026-04-16T09:40:00.000Z",
        reminderOffsetsMinutes: [1],
      }),
    );

    await application.drainReminderWorker({
      evaluatedAt: "2026-04-16T09:04:00.000Z",
    });
    const lateReview = await application.drainReminderWorker({
      evaluatedAt: "2026-04-16T09:09:00.000Z",
    });
    const current = await application.queryTaskMoreInfo("task_236_late_review");

    expect(lateReview.dispatched).toEqual([]);
    expect(current?.cycle.cycleId).toBe(requested.cycle.cycleId);
    expect(current?.cycle.state).toBe("awaiting_late_review");
    expect(current?.checkpoint.replyWindowState).toBe("late_review");
    expect(current?.schedule.scheduleState).toBe("suppressed");
    expect(current?.schedule.suppressedReasonRef).toBe("late_review_reached");
    expect(
      application.listOutboxEntries().filter((entry) => entry.effectType === "reminder_send"),
    ).toHaveLength(0);
  });

  it("seeds callback fallback once under blocked reachability and releases lease plus grant on explicit expiry", async () => {
    const application = createPhase3MoreInfoKernelApplication();
    await seedReviewTask(application, "236_expiry");

    const requested = await application.requestMoreInfo(
      requestInput("236_expiry", {
        dueAt: "2026-04-16T09:10:00.000Z",
        expiresAt: "2026-04-16T09:30:00.000Z",
        reminderOffsetsMinutes: [1],
      }),
    );

    await application.drainReminderWorker({
      evaluatedAt: "2026-04-16T09:04:00.000Z",
    });

    const blocked = await application.drainReminderWorker({
      evaluatedAt: "2026-04-16T09:06:00.000Z",
      reachabilityByCycleId: {
        [requested.cycle.cycleId]: {
          summaryState: "blocked",
          deliveryRiskState: "likely_failed",
          blockedReasonRef: "contact_route_disputed",
          callbackFallbackAllowed: true,
        },
      },
    });
    const blockedReplay = await application.drainReminderWorker({
      evaluatedAt: "2026-04-16T09:06:00.000Z",
      reachabilityByCycleId: {
        [requested.cycle.cycleId]: {
          summaryState: "blocked",
          deliveryRiskState: "likely_failed",
          blockedReasonRef: "contact_route_disputed",
          callbackFallbackAllowed: true,
        },
      },
    });
    const expired = await application.expireCycle({
      cycleId: requested.cycle.cycleId,
      actorRef: "actor_236_expiry",
      recordedAt: "2026-04-16T09:31:00.000Z",
    });

    const grants = await application.identityRepositories.listAccessGrants();
    const leases =
      await application.triageApplication.controlPlaneRepositories.listRequestLifecycleLeases();

    expect(blocked.dispatched.map((entry) => entry.effectType)).toContain("callback_fallback_seed");
    expect(
      blocked.outboxEntries.filter((entry) => entry.effectType === "callback_fallback_seed"),
    ).toHaveLength(1);
    expect(
      blockedReplay.outboxEntries.filter((entry) => entry.effectType === "callback_fallback_seed"),
    ).toHaveLength(1);
    expect(expired.cycle.state).toBe("expired");
    expect(expired.checkpoint.replyWindowState).toBe("expired");
    expect(
      grants.find((grant) => grant.toSnapshot().grantId === requested.responseGrant.grantRef)?.toSnapshot()
        .grantState,
    ).not.toBe("live");
    expect(
      leases
        .map((lease) => lease.toSnapshot())
        .find((lease) => lease.leaseId === requested.cycle.lifecycleLeaseRef)?.state,
    ).toBe("released");
  });
});
