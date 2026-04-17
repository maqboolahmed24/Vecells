import { describe, expect, it } from "vitest";
import { createDeterministicBackboneIdGenerator } from "@vecells/domain-kernel";
import {
  createPhase3ApprovalEscalationKernelStore,
  createPhase3ReopenLaunchKernelService,
  createPhase3ReopenLaunchKernelStore,
  createPhase3TriageKernelService,
  createPhase3TriageKernelStore,
  type CreatePhase3TriageTaskInput,
} from "../src/index.ts";

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
    taskCompletionSettlementEnvelopeRef: `completion_${seed}`,
    createdAt: "2026-04-16T08:00:00.000Z",
  };
}

describe("phase 3 reopen and next-task launch kernel", () => {
  it("keeps one authoritative reopen record and deduplicates replay for the same bounce-back tuple", async () => {
    const triageRepositories = createPhase3TriageKernelStore();
    const approvalRepositories = createPhase3ApprovalEscalationKernelStore();
    const repositories = createPhase3ReopenLaunchKernelStore({
      triageRepositories,
      approvalRepositories,
    });
    const triageService = createPhase3TriageKernelService(triageRepositories, {
      idGenerator: createDeterministicBackboneIdGenerator("phase3_reopen_launch_triage_replay"),
    });
    const service = createPhase3ReopenLaunchKernelService(repositories, {
      idGenerator: createDeterministicBackboneIdGenerator("phase3_reopen_launch_replay"),
    });

    await triageService.createTask(createTaskInput("reopen_replay"));

    const first = await service.recordGovernedReopen({
      taskId: "task_reopen_replay",
      sourceDomain: "booking_handoff",
      reasonCode: "booking_unable_to_complete",
      evidenceRefs: ["booking_intent_1", "handoff_note_1"],
      supersededDecisionEpochRef: "decision_epoch_reopen_replay",
      decisionSupersessionRecordRef: "decision_supersession_reopen_replay",
      priorityOverride: "same_day_return",
      reopenedByMode: "reviewer_manual",
      reopenedAt: "2026-04-16T08:10:00.000Z",
    });
    const replay = await service.recordGovernedReopen({
      taskId: "task_reopen_replay",
      sourceDomain: "booking_handoff",
      reasonCode: "booking_unable_to_complete",
      evidenceRefs: ["handoff_note_1", "booking_intent_1"],
      supersededDecisionEpochRef: "decision_epoch_reopen_replay",
      decisionSupersessionRecordRef: "decision_supersession_reopen_replay",
      priorityOverride: "same_day_return",
      reopenedByMode: "reviewer_manual",
      reopenedAt: "2026-04-16T08:11:00.000Z",
    });
    const records = await approvalRepositories.listTriageReopenRecordsForTask("task_reopen_replay");

    expect(first.reusedExisting).toBe(false);
    expect(replay.reusedExisting).toBe(true);
    expect(first.reopenRecord.reopenRecordId).toBe(replay.reopenRecord.reopenRecordId);
    expect(records).toHaveLength(1);
  });

  it("issues one ready NextTaskLaunchLease from stable source context and preserves return-anchor posture", async () => {
    const triageRepositories = createPhase3TriageKernelStore();
    const repositories = createPhase3ReopenLaunchKernelStore({
      triageRepositories,
      approvalRepositories: createPhase3ApprovalEscalationKernelStore(),
    });
    const triageService = createPhase3TriageKernelService(triageRepositories, {
      idGenerator: createDeterministicBackboneIdGenerator("phase3_reopen_launch_triage_ready"),
    });
    const service = createPhase3ReopenLaunchKernelService(repositories, {
      idGenerator: createDeterministicBackboneIdGenerator("phase3_reopen_launch_ready"),
    });

    const created = await triageService.createTask(createTaskInput("launch_ready"));
    const launchContext = await triageRepositories.getLaunchContext(created.task.launchContextRef);
    expect(launchContext).toBeDefined();
    const preparedContext = launchContext!.update({
      nextTaskCandidateRefs: ["task_candidate_a", "task_candidate_b"],
      nextTaskRankSnapshotRef: "rank_launch_ready_next",
      nextTaskLaunchState: "blocked",
      nextTaskBlockingReasonRefs: ["TASK_241_COMPLETION_PENDING"],
      updatedAt: "2026-04-16T08:20:00.000Z",
    });
    await triageRepositories.saveLaunchContext(preparedContext, {
      expectedVersion: launchContext!.version,
    });

    const issued = await service.issueNextTaskLaunchLease({
      sourceTaskRef: "task_launch_ready",
      launchContextRef: created.task.launchContextRef,
      nextTaskCandidateRef: "task_candidate_a",
      sourceSettlementEnvelopeRef: "settlement_envelope_launch_ready",
      continuityEvidenceRef: "continuity_launch_ready",
      sourceRankSnapshotRef: "rank_launch_ready_next",
      launchEligibilityState: "ready",
      blockingReasonRefs: [],
      issuedAt: "2026-04-16T08:21:00.000Z",
      expiresAt: "2026-04-16T08:31:00.000Z",
    });

    expect(issued.reusedExisting).toBe(false);
    expect(issued.nextTaskLaunchLease.launchEligibilityState).toBe("ready");
    expect(issued.nextTaskLaunchLease.leaseState).toBe("live");
    expect(issued.launchContext.returnAnchorRef).toBe("anchor_launch_ready");
    expect(issued.launchContext.nextTaskLaunchState).toBe("ready");
    expect(issued.launchContext.departingTaskReturnStubState).toBe("pinned");
  });

  it("degrades the launch lease to stale or continuity_blocked when queue or continuity truth drifts", async () => {
    const triageRepositories = createPhase3TriageKernelStore();
    const repositories = createPhase3ReopenLaunchKernelStore({
      triageRepositories,
      approvalRepositories: createPhase3ApprovalEscalationKernelStore(),
    });
    const triageService = createPhase3TriageKernelService(triageRepositories, {
      idGenerator: createDeterministicBackboneIdGenerator("phase3_reopen_launch_triage_drift"),
    });
    const service = createPhase3ReopenLaunchKernelService(repositories, {
      idGenerator: createDeterministicBackboneIdGenerator("phase3_reopen_launch_drift"),
    });

    const created = await triageService.createTask(createTaskInput("launch_drift"));
    const launchContext = await triageRepositories.getLaunchContext(created.task.launchContextRef);
    const preparedContext = launchContext!.update({
      nextTaskCandidateRefs: ["task_candidate_drift"],
      nextTaskRankSnapshotRef: "rank_launch_drift_next",
      updatedAt: "2026-04-16T08:40:00.000Z",
    });
    await triageRepositories.saveLaunchContext(preparedContext, {
      expectedVersion: launchContext!.version,
    });

    const issued = await service.issueNextTaskLaunchLease({
      sourceTaskRef: "task_launch_drift",
      launchContextRef: created.task.launchContextRef,
      nextTaskCandidateRef: "task_candidate_drift",
      sourceSettlementEnvelopeRef: "settlement_envelope_launch_drift",
      continuityEvidenceRef: "continuity_launch_drift",
      sourceRankSnapshotRef: "rank_launch_drift_next",
      launchEligibilityState: "ready",
      issuedAt: "2026-04-16T08:41:00.000Z",
      expiresAt: "2026-04-16T08:51:00.000Z",
    });
    const snapshotDrift = await service.validateNextTaskLaunchLease({
      nextTaskLaunchLeaseId: issued.nextTaskLaunchLease.nextTaskLaunchLeaseId,
      validatedAt: "2026-04-16T08:42:00.000Z",
      currentSourceRankSnapshotRef: "rank_launch_drift_newer",
      currentSourceSettlementEnvelopeRef: "settlement_envelope_launch_drift",
      currentContinuityEvidenceRef: "continuity_launch_drift",
      currentReturnAnchorRef: "anchor_launch_drift",
      currentSelectedAnchorRef: "anchor_launch_drift",
      currentSelectedAnchorTupleHash: "anchor_hash_launch_drift",
    });
    const continuityLease = await service.issueNextTaskLaunchLease({
      sourceTaskRef: "task_launch_drift",
      launchContextRef: created.task.launchContextRef,
      nextTaskCandidateRef: "task_candidate_drift",
      sourceSettlementEnvelopeRef: "settlement_envelope_launch_drift",
      continuityEvidenceRef: "continuity_launch_drift",
      sourceRankSnapshotRef: "rank_launch_drift_next",
      launchEligibilityState: "ready",
      issuedAt: "2026-04-16T08:43:00.000Z",
      expiresAt: "2026-04-16T08:53:00.000Z",
    });
    const continuityDrift = await service.validateNextTaskLaunchLease({
      nextTaskLaunchLeaseId: continuityLease.nextTaskLaunchLease.nextTaskLaunchLeaseId,
      validatedAt: "2026-04-16T08:44:00.000Z",
      currentSourceRankSnapshotRef: "rank_launch_drift_next",
      currentSourceSettlementEnvelopeRef: "settlement_envelope_launch_drift",
      currentContinuityEvidenceRef: "continuity_launch_drift_shifted",
      currentReturnAnchorRef: "anchor_launch_drift",
      currentSelectedAnchorRef: "anchor_launch_drift",
      currentSelectedAnchorTupleHash: "anchor_hash_launch_drift",
    });

    expect(snapshotDrift.nextTaskLaunchLease.launchEligibilityState).toBe("stale");
    expect(snapshotDrift.nextTaskLaunchLease.leaseState).toBe("invalidated");
    expect(snapshotDrift.launchContext.nextTaskBlockingReasonRefs).toContain(
      "TASK_241_QUEUE_SNAPSHOT_DRIFT",
    );
    expect(continuityDrift.nextTaskLaunchLease.launchEligibilityState).toBe(
      "continuity_blocked",
    );
    expect(continuityDrift.nextTaskLaunchLease.leaseState).toBe("invalidated");
    expect(continuityDrift.launchContext.nextTaskLaunchState).toBe("gated");
    expect(continuityDrift.launchContext.nextTaskBlockingReasonRefs).toContain(
      "TASK_241_CONTINUITY_DRIFT",
    );
  });
});
