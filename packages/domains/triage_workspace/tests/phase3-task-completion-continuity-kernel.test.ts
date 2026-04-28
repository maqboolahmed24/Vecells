import { describe, expect, it } from "vitest";
import { createDeterministicBackboneIdGenerator } from "@vecells/domain-kernel";
import {
  createPhase3TaskCompletionContinuityKernelService,
  createPhase3TaskCompletionContinuityKernelStore,
} from "../src/index.ts";

describe("phase 3 task completion and continuity kernel", () => {
  it("creates one authoritative TaskCompletionSettlementEnvelope and reuses it for idempotent replay", async () => {
    const repositories = createPhase3TaskCompletionContinuityKernelStore();
    const service = createPhase3TaskCompletionContinuityKernelService(repositories, {
      idGenerator: createDeterministicBackboneIdGenerator("phase3_task_completion_replay"),
    });

    const first = await service.settleTaskCompletion({
      taskCompletionSettlementEnvelopeId: "task_completion_envelope_replay",
      taskId: "task_completion_replay",
      actionType: "clinician_callback",
      selectedAnchorRef: "anchor_completion_replay",
      sourceQueueRankSnapshotRef: "rank_completion_replay",
      workspaceTrustEnvelopeRef: "workspace_trust_completion_replay",
      localAckState: "shown",
      authoritativeSettlementState: "settled",
      closureSummaryRef: "artifact_completion_replay",
      blockingReasonRefs: ["TASK_242_NEXT_TASK_GATED"],
      nextTaskLaunchState: "gated",
      nextTaskLaunchLeaseRef: null,
      experienceContinuityEvidenceRef: "experience_continuity_evidence_task_completion_replay",
      releaseConditionRef: "release_condition_authoritative_completion",
      settledAt: "2026-04-16T12:00:00.000Z",
    });
    const replay = await service.settleTaskCompletion({
      taskCompletionSettlementEnvelopeId: "task_completion_envelope_replay",
      taskId: "task_completion_replay",
      actionType: "clinician_callback",
      selectedAnchorRef: "anchor_completion_replay",
      sourceQueueRankSnapshotRef: "rank_completion_replay",
      workspaceTrustEnvelopeRef: "workspace_trust_completion_replay",
      localAckState: "shown",
      authoritativeSettlementState: "settled",
      closureSummaryRef: "artifact_completion_replay",
      blockingReasonRefs: ["TASK_242_NEXT_TASK_GATED"],
      nextTaskLaunchState: "gated",
      nextTaskLaunchLeaseRef: null,
      experienceContinuityEvidenceRef: "experience_continuity_evidence_task_completion_replay",
      releaseConditionRef: "release_condition_authoritative_completion",
      settledAt: "2026-04-16T12:01:00.000Z",
    });
    const envelopes = await service.listTaskCompletionSettlementEnvelopesForTask(
      "task_completion_replay",
    );

    expect(first.reusedExisting).toBe(false);
    expect(replay.reusedExisting).toBe(true);
    expect(first.completionEnvelope.taskCompletionSettlementEnvelopeId).toBe(
      replay.completionEnvelope.taskCompletionSettlementEnvelopeId,
    );
    expect(envelopes).toHaveLength(1);
    expect(envelopes[0].settlementRevision).toBe(1);
  });

  it("advances the same completion envelope identity through gated to ready revisions when continuity-backed next-task state changes", async () => {
    const repositories = createPhase3TaskCompletionContinuityKernelStore();
    const service = createPhase3TaskCompletionContinuityKernelService(repositories, {
      idGenerator: createDeterministicBackboneIdGenerator("phase3_task_completion_ready"),
    });

    await service.settleTaskCompletion({
      taskCompletionSettlementEnvelopeId: "task_completion_envelope_ready",
      taskId: "task_completion_ready",
      actionType: "self_care_and_safety_net",
      selectedAnchorRef: "anchor_completion_ready",
      sourceQueueRankSnapshotRef: "rank_completion_ready",
      workspaceTrustEnvelopeRef: "workspace_trust_completion_ready",
      localAckState: "shown",
      authoritativeSettlementState: "settled",
      closureSummaryRef: "artifact_completion_ready",
      blockingReasonRefs: ["TASK_242_NEXT_TASK_GATED"],
      nextTaskLaunchState: "gated",
      nextTaskLaunchLeaseRef: "next_task_launch_lease_ready",
      experienceContinuityEvidenceRef: "experience_continuity_evidence_task_completion_ready",
      releaseConditionRef: "release_condition_authoritative_completion",
      settledAt: "2026-04-16T12:10:00.000Z",
    });
    const advanced = await service.settleTaskCompletion({
      taskCompletionSettlementEnvelopeId: "task_completion_envelope_ready",
      taskId: "task_completion_ready",
      actionType: "self_care_and_safety_net",
      selectedAnchorRef: "anchor_completion_ready",
      sourceQueueRankSnapshotRef: "rank_completion_ready",
      workspaceTrustEnvelopeRef: "workspace_trust_completion_ready_v2",
      localAckState: "shown",
      authoritativeSettlementState: "settled",
      closureSummaryRef: "artifact_completion_ready",
      blockingReasonRefs: [],
      nextTaskLaunchState: "ready",
      nextTaskLaunchLeaseRef: "next_task_launch_lease_ready",
      experienceContinuityEvidenceRef: "experience_continuity_evidence_task_completion_ready",
      releaseConditionRef: "release_condition_authoritative_completion",
      settledAt: "2026-04-16T12:11:00.000Z",
    });
    const envelopes = await service.listTaskCompletionSettlementEnvelopesForTask(
      "task_completion_ready",
    );

    expect(advanced.reusedExisting).toBe(false);
    expect(advanced.completionEnvelope.taskCompletionSettlementEnvelopeId).toBe(
      "task_completion_envelope_ready",
    );
    expect(advanced.completionEnvelope.nextTaskLaunchState).toBe("ready");
    expect(advanced.completionEnvelope.settlementRevision).toBe(2);
    expect(advanced.completionEnvelope.version).toBe(2);
    expect(envelopes).toHaveLength(1);
  });

  it("persists one OperatorHandoffFrame for blocked baton cases and revises it in place", async () => {
    const repositories = createPhase3TaskCompletionContinuityKernelStore();
    const service = createPhase3TaskCompletionContinuityKernelService(repositories, {
      idGenerator: createDeterministicBackboneIdGenerator("phase3_task_completion_handoff"),
    });

    await service.recordOperatorHandoffFrame({
      operatorHandoffFrameId: "operator_handoff_frame_booking",
      taskId: "task_completion_handoff",
      handoffType: "booking",
      nextOwnerRef: "owner_booking_queue",
      readinessSummaryRef: "artifact_booking_handoff",
      pendingDependencyRefs: ["TASK_242_BOOKING_ACCEPTANCE_PENDING", "booking_intent_242"],
      confirmedArtifactRef: "booking_intent_242",
      settlementState: "pending_acceptance",
      generatedAt: "2026-04-16T12:20:00.000Z",
    });
    const revised = await service.recordOperatorHandoffFrame({
      operatorHandoffFrameId: "operator_handoff_frame_booking",
      taskId: "task_completion_handoff",
      handoffType: "booking",
      nextOwnerRef: "owner_booking_queue",
      readinessSummaryRef: "artifact_booking_handoff",
      pendingDependencyRefs: [],
      confirmedArtifactRef: "booking_intent_242",
      settlementState: "acknowledged",
      generatedAt: "2026-04-16T12:21:00.000Z",
    });
    const frames = await service.listOperatorHandoffFramesForTask("task_completion_handoff");

    expect(revised.operatorHandoffFrame.operatorHandoffFrameId).toBe(
      "operator_handoff_frame_booking",
    );
    expect(revised.operatorHandoffFrame.handoffRevision).toBe(2);
    expect(revised.operatorHandoffFrame.version).toBe(2);
    expect(revised.operatorHandoffFrame.settlementState).toBe("acknowledged");
    expect(frames).toHaveLength(1);
  });
});
