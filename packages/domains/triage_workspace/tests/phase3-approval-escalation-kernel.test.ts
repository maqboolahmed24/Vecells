import { describe, expect, it } from "vitest";
import { createDeterministicBackboneIdGenerator } from "@vecells/domain-kernel";
import {
  createPhase3ApprovalEscalationKernelService,
  createPhase3ApprovalEscalationKernelStore,
  evaluateGovernedApprovalRequirement,
  type GovernedApprovalRequirementAssessmentSnapshot,
} from "../src/phase3-approval-escalation-kernel.ts";

function assessmentFromEvaluation(seed: string, decisionEpochRef: string, decisionId: string) {
  const evaluated = evaluateGovernedApprovalRequirement({
    taskId: `task_${seed}`,
    requestId: `request_${seed}`,
    decisionEpochRef,
    decisionId,
    endpointCode: "self_care_and_safety_net",
    payload: {
      summary: "Symptoms remain suitable for self-care.",
      safetyNetAdvice: "Seek urgent review if breathing worsens.",
    },
    evaluatedAt: "2026-04-16T13:00:00.000Z",
  });
  const assessment: GovernedApprovalRequirementAssessmentSnapshot = {
    assessmentId: `assessment_${seed}_${decisionEpochRef}`,
    taskId: `task_${seed}`,
    requestId: `request_${seed}`,
    decisionEpochRef,
    decisionId,
    endpointClass: "self_care_and_safety_net",
    approvalPolicyMatrixRef: evaluated.approvalPolicyMatrixRef,
    tenantPolicyRef: evaluated.tenantPolicyRef,
    pathwayRef: evaluated.pathwayRef,
    riskBurdenClass: evaluated.riskBurdenClass,
    assistiveProvenanceState: evaluated.assistiveProvenanceState,
    sensitiveOverrideState: evaluated.sensitiveOverrideState,
    matchedPolicyRuleRefs: evaluated.matchedPolicyRuleRefs,
    requiredApprovalMode: evaluated.requiredApprovalMode,
    checkpointState: evaluated.checkpointState,
    reasonCodeRefs: evaluated.reasonCodeRefs,
    evaluatedAt: "2026-04-16T13:00:00.000Z",
    tupleHash: evaluated.tupleHash,
    version: 1,
  };
  return {
    evaluated,
    assessment,
  };
}

describe("phase 3 approval and urgent escalation kernel", () => {
  it("evaluates self-care closure into a required checkpoint and blocks self-approval", async () => {
    const repositories = createPhase3ApprovalEscalationKernelStore();
    const service = createPhase3ApprovalEscalationKernelService(repositories, {
      idGenerator: createDeterministicBackboneIdGenerator("phase3_approval_kernel_required"),
    });
    const { evaluated, assessment } = assessmentFromEvaluation(
      "required",
      "decision_epoch_required",
      "decision_required",
    );

    expect(evaluated.requiredApprovalMode).toBe("required");
    expect(evaluated.matchedPolicyRuleRefs).toEqual(["AP_228_SELF_CARE_CLOSURE"]);

    const created = await service.evaluateApprovalRequirement({
      assessment,
      checkpointId: "checkpoint_required",
      actionType: evaluated.actionType,
      requestedBy: "reviewer_primary",
      requestedAt: "2026-04-16T13:00:00.000Z",
      lifecycleLeaseRef: "lease_required",
      leaseAuthorityRef: "lease_authority_triage_approval",
      leaseTtlSeconds: 1800,
      lastHeartbeatAt: "2026-04-16T13:00:00.000Z",
      fencingToken: "fence_required",
      ownershipEpoch: 1,
      currentLineageFenceEpoch: 1,
    });
    const pending = await service.requestApproval({
      checkpointId: created.checkpoint.checkpointId,
      requestedBy: "reviewer_primary",
      requestedAt: "2026-04-16T13:01:00.000Z",
    });

    await expect(
      service.approveCheckpoint({
        checkpointId: created.checkpoint.checkpointId,
        approvedBy: "reviewer_primary",
        approvedAt: "2026-04-16T13:02:00.000Z",
        presentedRoleRefs: ["clinical_supervisor"],
      }),
    ).rejects.toThrow("different actor than the requester");

    const approved = await service.approveCheckpoint({
      checkpointId: created.checkpoint.checkpointId,
      approvedBy: "clinical_supervisor_1",
      approvedAt: "2026-04-16T13:03:00.000Z",
      presentedRoleRefs: ["clinical_supervisor"],
    });

    expect(pending.state).toBe("pending");
    expect(approved.state).toBe("approved");
    expect(approved.approvedBy).toBe("clinical_supervisor_1");
  });

  it("supersedes the prior checkpoint when the decision epoch changes", async () => {
    const repositories = createPhase3ApprovalEscalationKernelStore();
    const service = createPhase3ApprovalEscalationKernelService(repositories, {
      idGenerator: createDeterministicBackboneIdGenerator("phase3_approval_kernel_supersede"),
    });
    const first = assessmentFromEvaluation("supersede", "decision_epoch_1", "decision_1");
    const second = assessmentFromEvaluation("supersede", "decision_epoch_2", "decision_2");

    await service.evaluateApprovalRequirement({
      assessment: first.assessment,
      checkpointId: "checkpoint_epoch_1",
      actionType: first.evaluated.actionType,
      requestedBy: "reviewer_epoch_1",
      requestedAt: "2026-04-16T14:00:00.000Z",
      lifecycleLeaseRef: "lease_epoch_1",
      leaseAuthorityRef: "lease_authority_triage_approval",
      leaseTtlSeconds: 1800,
      lastHeartbeatAt: "2026-04-16T14:00:00.000Z",
      fencingToken: "fence_epoch_1",
      ownershipEpoch: 1,
      currentLineageFenceEpoch: 1,
    });

    const replaced = await service.evaluateApprovalRequirement({
      assessment: {
        ...second.assessment,
        evaluatedAt: "2026-04-16T14:05:00.000Z",
      },
      checkpointId: "checkpoint_epoch_2",
      actionType: second.evaluated.actionType,
      requestedBy: "reviewer_epoch_2",
      requestedAt: "2026-04-16T14:05:00.000Z",
      lifecycleLeaseRef: "lease_epoch_2",
      leaseAuthorityRef: "lease_authority_triage_approval",
      leaseTtlSeconds: 1800,
      lastHeartbeatAt: "2026-04-16T14:05:00.000Z",
      fencingToken: "fence_epoch_2",
      ownershipEpoch: 2,
      currentLineageFenceEpoch: 2,
      decisionSupersessionRecordRef: "decision_supersession_epoch_2",
    });

    expect(replaced.supersededCheckpoint?.state).toBe("superseded");
    expect(replaced.supersededCheckpoint?.invalidationReasonClass).toBe("epoch_superseded");
    expect(replaced.checkpoint.supersedesCheckpointRef).toBe("checkpoint_epoch_1");
    expect(replaced.checkpoint.decisionEpochRef).toBe("decision_epoch_2");
  });

  it("collapses replayed urgent contact attempts and preserves the return-to-triage reopen lineage", async () => {
    const repositories = createPhase3ApprovalEscalationKernelStore();
    const service = createPhase3ApprovalEscalationKernelService(repositories, {
      idGenerator: createDeterministicBackboneIdGenerator("phase3_approval_kernel_escalation"),
    });

    const escalation = await service.startUrgentEscalation({
      taskId: "task_escalation",
      requestId: "request_escalation",
      decisionEpochRef: "decision_epoch_escalation",
      endpointDecisionRef: "decision_escalation",
      triggerMode: "reviewer_manual",
      triggerReasonCode: "residual_high_risk",
      severityBand: "urgent",
      urgentTaskRef: "urgent_task_escalation",
      openedAt: "2026-04-16T15:00:00.000Z",
    });

    const firstAttempt = await service.recordUrgentContactAttempt({
      escalationId: escalation.dutyEscalationRecordId,
      decisionEpochRef: escalation.decisionEpochRef,
      attemptReplayKey: "attempt_primary_1",
      contactRouteClass: "primary_phone",
      attemptState: "connected",
      attemptedAt: "2026-04-16T15:01:00.000Z",
      completedAt: "2026-04-16T15:02:00.000Z",
      outcomeNote: "Duty clinician reached the patient directly.",
    });
    const replayedAttempt = await service.recordUrgentContactAttempt({
      escalationId: escalation.dutyEscalationRecordId,
      decisionEpochRef: escalation.decisionEpochRef,
      attemptReplayKey: "attempt_primary_1",
      contactRouteClass: "primary_phone",
      attemptState: "connected",
      attemptedAt: "2026-04-16T15:01:30.000Z",
      completedAt: "2026-04-16T15:02:30.000Z",
    });
    const returned = await service.recordUrgentOutcome({
      escalationId: escalation.dutyEscalationRecordId,
      decisionEpochRef: escalation.decisionEpochRef,
      outcomeClass: "return_to_triage",
      triageReopenRecord: {
        reopenRecordId: "reopen_from_urgent_1",
        taskId: "task_escalation",
        sourceDomain: "urgent_escalation",
        reasonCode: "urgent_return_requires_practice_review",
        evidenceRefs: [escalation.dutyEscalationRecordId],
        supersededDecisionEpochRef: escalation.decisionEpochRef,
        decisionSupersessionRecordRef: "decision_supersession_return_1",
        priorityOverride: "urgent_return",
        reopenedByMode: "reviewer_manual",
        reopenedAt: "2026-04-16T15:03:00.000Z",
        version: 1,
      },
      recordedAt: "2026-04-16T15:03:00.000Z",
    });

    expect(firstAttempt.attempt.urgentContactAttemptId).toBe(
      replayedAttempt.attempt.urgentContactAttemptId,
    );
    expect(replayedAttempt.escalation.currentUrgentContactAttemptRef).toBe(
      firstAttempt.attempt.urgentContactAttemptId,
    );
    expect(returned.escalation.escalationState).toBe("returned_to_triage");
    expect(returned.outcome.triageReopenRecordRef).toBe("reopen_from_urgent_1");
    expect(returned.reopenRecord?.sourceDomain).toBe("urgent_escalation");
  });
});
