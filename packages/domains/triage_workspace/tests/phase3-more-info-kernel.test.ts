import { describe, expect, it } from "vitest";
import { createDeterministicBackboneIdGenerator } from "@vecells/domain-kernel";
import {
  computeMoreInfoWorkerEffectKey,
  createPhase3MoreInfoKernelService,
  createPhase3MoreInfoKernelStore,
  resolveQuietHoursReleaseAt,
} from "../src/index.ts";

function createHarness(seed: string) {
  const repositories = createPhase3MoreInfoKernelStore();
  const service = createPhase3MoreInfoKernelService(repositories, {
    idGenerator: createDeterministicBackboneIdGenerator(`phase3_more_info_${seed}`),
  });

  return { repositories, service };
}

function createCycleInput(seed: string, overrides: Record<string, unknown> = {}) {
  return {
    taskId: `task_${seed}`,
    requestId: `request_${seed}`,
    requestLineageRef: `lineage_${seed}`,
    promptSetRef: `prompt_${seed}`,
    channelRef: "sms_outbound",
    responseRouteFamilyRef: "patient_more_info",
    dueAt: "2026-04-16T10:00:00.000Z",
    lateReviewStartsAt: "2026-04-16T10:30:00.000Z",
    expiresAt: "2026-04-16T11:15:00.000Z",
    reminderOffsetsMinutes: [20, 40],
    cadencePolicyRef: "reply_window_policy_v1",
    quietHoursWindow: {
      policyRef: "quiet_hours_22_06",
      startHourUtc: 22,
      endHourUtc: 6,
    },
    lifecycleLeaseRef: `lease_${seed}`,
    leaseAuthorityRef: "lease_authority_triage_more_info",
    ownershipEpoch: 1,
    fencingToken: `fencing_${seed}`,
    currentLineageFenceEpoch: 1,
    responseGrantRef: `grant_${seed}`,
    responseGrantExpiresAt: "2026-04-16T09:20:00.000Z",
    createdAt: "2026-04-16T09:00:00.000Z",
    ...overrides,
  };
}

describe("phase 3 more-info kernel", () => {
  it("creates one authoritative checkpoint and requires explicit supersession before a replacement cycle", async () => {
    const { service } = createHarness("supersession");

    const created = await service.createCycle(createCycleInput("supersession"));

    await expect(
      service.createCycle(
        createCycleInput("supersession_replacement", {
          taskId: "task_supersession",
          requestId: "request_supersession",
          requestLineageRef: "lineage_supersession",
          currentLineageFenceEpoch: 1,
        }),
      ),
    ).rejects.toThrow(/active MoreInfoReplyWindowCheckpoint|explicitly superseded/i);

    const superseded = await service.supersedeCycle({
      cycleId: created.cycle.cycleId,
      presentedOwnershipEpoch: created.cycle.ownershipEpoch,
      presentedFencingToken: created.cycle.fencingToken,
      presentedLineageFenceEpoch: created.cycle.currentLineageFenceEpoch,
      nextLineageFenceEpoch: created.cycle.currentLineageFenceEpoch + 1,
      supersededByCycleRef: "cycle_replacement_supersession",
      recordedAt: "2026-04-16T09:05:00.000Z",
    });

    expect(superseded.cycle.state).toBe("superseded");
    expect(superseded.checkpoint.replyWindowState).toBe("superseded");
    expect(superseded.schedule.scheduleState).toBe("cancelled");

    const replacement = await service.createCycle(
      createCycleInput("replacement", {
        taskId: "task_supersession",
        requestId: "request_supersession",
        requestLineageRef: "lineage_supersession",
        supersedesCycleRef: created.cycle.cycleId,
        currentLineageFenceEpoch: superseded.cycle.currentLineageFenceEpoch,
        createdAt: "2026-04-16T09:06:00.000Z",
      }),
    );

    expect(replacement.cycle.supersedesCycleRef).toBe(created.cycle.cycleId);
    expect(replacement.checkpoint.replyWindowState).toBe("open");
  });

  it("settles the checkpoint on cancellation so a lineage can open a fresh cycle", async () => {
    const { service } = createHarness("cancel");
    const created = await service.createCycle(createCycleInput("cancel"));

    const cancelled = await service.cancelCycle({
      cycleId: created.cycle.cycleId,
      presentedOwnershipEpoch: created.cycle.ownershipEpoch,
      presentedFencingToken: created.cycle.fencingToken,
      presentedLineageFenceEpoch: created.cycle.currentLineageFenceEpoch,
      nextLineageFenceEpoch: created.cycle.currentLineageFenceEpoch + 1,
      recordedAt: "2026-04-16T09:10:00.000Z",
    });

    expect(cancelled.cycle.state).toBe("cancelled");
    expect(cancelled.checkpoint.replyWindowState).toBe("settled");
    expect(cancelled.checkpoint.settledAt).toBe("2026-04-16T09:10:00.000Z");
    expect(cancelled.schedule.scheduleState).toBe("cancelled");

    const replacement = await service.createCycle(
      createCycleInput("cancel_replacement", {
        taskId: "task_cancel",
        requestId: "request_cancel",
        requestLineageRef: "lineage_cancel",
        currentLineageFenceEpoch: cancelled.cycle.currentLineageFenceEpoch,
        createdAt: "2026-04-16T09:11:00.000Z",
      }),
    );

    expect(replacement.cycle.state).toBe("awaiting_delivery");
    expect(replacement.checkpoint.replyWindowState).toBe("open");
  });

  it("derives reminder_due and blocked_repair from authoritative checkpoint time only", async () => {
    const { service } = createHarness("refresh");
    const created = await service.createCycle(createCycleInput("refresh"));

    const reminderDue = await service.refreshReplyWindowState({
      cycleId: created.cycle.cycleId,
      presentedOwnershipEpoch: created.cycle.ownershipEpoch,
      presentedFencingToken: created.cycle.fencingToken,
      presentedLineageFenceEpoch: created.cycle.currentLineageFenceEpoch,
      evaluatedAt: "2026-04-16T09:21:00.000Z",
      repairBlocked: false,
    });

    expect(reminderDue.checkpoint.replyWindowState).toBe("reminder_due");
    expect(reminderDue.cycle.state).toBe("awaiting_delivery");

    const blocked = await service.refreshReplyWindowState({
      cycleId: created.cycle.cycleId,
      presentedOwnershipEpoch: reminderDue.cycle.ownershipEpoch,
      presentedFencingToken: reminderDue.cycle.fencingToken,
      presentedLineageFenceEpoch: reminderDue.cycle.currentLineageFenceEpoch,
      evaluatedAt: "2026-04-16T09:22:00.000Z",
      repairBlocked: true,
      repairRequiredReasonRef: "contact_route_disputed",
    });

    expect(blocked.checkpoint.replyWindowState).toBe("blocked_repair");
    expect(blocked.checkpoint.repairRequiredReasonRef).toBe("contact_route_disputed");
  });

  it("keeps quiet-hours release and worker effect keys replay-safe", () => {
    expect(
      resolveQuietHoursReleaseAt({
        evaluatedAt: "2026-04-16T23:15:00.000Z",
        quietHoursWindow: {
          policyRef: "quiet_hours_22_06",
          startHourUtc: 22,
          endHourUtc: 6,
        },
      }),
    ).toBe("2026-04-17T06:00:00.000Z");

    const baseline = computeMoreInfoWorkerEffectKey({
      cycleId: "cycle_replay_safe",
      effectType: "reminder_send",
      ordinal: 2,
      checkpointRevision: 4,
    });
    const replay = computeMoreInfoWorkerEffectKey({
      cycleId: "cycle_replay_safe",
      effectType: "reminder_send",
      ordinal: 2,
      checkpointRevision: 4,
    });
    const advanced = computeMoreInfoWorkerEffectKey({
      cycleId: "cycle_replay_safe",
      effectType: "reminder_send",
      ordinal: 2,
      checkpointRevision: 5,
    });

    expect(replay).toBe(baseline);
    expect(advanced).not.toBe(baseline);
  });
});
