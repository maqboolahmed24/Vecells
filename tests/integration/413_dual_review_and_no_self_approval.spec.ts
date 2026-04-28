import { describe, expect, it } from "vitest";
import {
  createAssistiveFeedbackChainPlane,
  type AssistiveFeedbackActorContext,
  type AssistiveFeedbackActorRole,
  type OpenFeedbackChainCommand,
} from "../../packages/domains/assistive_feedback_chain/src/index.ts";

const fixedClock = { now: () => "2026-04-27T23:59:00.000Z" };

function actor(actorRole: AssistiveFeedbackActorRole): AssistiveFeedbackActorContext {
  return {
    actorRef: `actor:${actorRole}`,
    actorRole,
    purposeOfUse: "phase8_dual_review_test",
    routeIntentBindingRef: "route-intent:assistive-feedback",
    auditCorrelationId: `audit:${actorRole}`,
  };
}

describe("413 dual review and no self approval", () => {
  it("requires two distinct human approvers for high-risk low-trust external commits", () => {
    const plane = createAssistiveFeedbackChainPlane({ clock: fixedClock });
    const chain = plane.feedbackChains.openFeedbackChain(
      chainCommand(),
      actor("feedback_chain_service"),
    );

    const repeatedActor = plane.approvalGates.assessApprovalGate(
      approvalCommand(chain.assistiveFeedbackChainId, [
        approvalEvent("clinician:one", "approval-event:one"),
        approvalEvent("clinician:one", "approval-event:one-repeat"),
        approvalEvent("model:generator", "approval-event:model"),
      ]),
      actor("clinical_reviewer"),
    );

    expect(repeatedActor.requiredApproverCount).toBe(2);
    expect(repeatedActor.currentApproverCount).toBe(1);
    expect(repeatedActor.eligibilityState).toBe("dual_review");
    expect(repeatedActor.blockingReasonCodes).toContain("distinct_approver_required");

    const independentActors = plane.approvalGates.assessApprovalGate(
      approvalCommand(
        chain.assistiveFeedbackChainId,
        [
          approvalEvent("clinician:one", "approval-event:one"),
          approvalEvent("clinician:two", "approval-event:two"),
        ],
        "assessment:independent",
      ),
      actor("second_reviewer"),
    );

    expect(independentActors.currentApproverRefs).toEqual(["clinician:one", "clinician:two"]);
    expect(independentActors.eligibilityState).toBe("ready_to_settle");
  });

  it("blocks approval gate readiness when commit fences or completion adjacency drift", () => {
    const plane = createAssistiveFeedbackChainPlane({ clock: fixedClock });
    const chain = plane.feedbackChains.openFeedbackChain(
      chainCommand(),
      actor("feedback_chain_service"),
    );

    const blocked = plane.approvalGates.assessApprovalGate(
      {
        ...approvalCommand(
          chain.assistiveFeedbackChainId,
          [
            approvalEvent("clinician:one", "approval-event:one"),
            approvalEvent("clinician:two", "approval-event:two"),
          ],
          "assessment:blocked",
        ),
        allFencesValid: false,
        completionAdjacencyState: "observe_only",
      },
      actor("clinical_reviewer"),
    );

    expect(blocked.eligibilityState).toBe("blocked");
    expect(blocked.blockingReasonCodes).toEqual(
      expect.arrayContaining([
        "all_fences_valid_required",
        "completion_adjacency_allowed_required",
      ]),
    );
  });
});

function chainCommand(overrides: Partial<OpenFeedbackChainCommand> = {}): OpenFeedbackChainCommand {
  return {
    assistiveSessionRef: "assistive-session:task-001",
    assistiveCapabilityTrustEnvelopeRef: "assistive-capability-trust-envelope:task-001",
    artifactRef: "endpoint-suggestion:task-001:v1",
    artifactRevisionRef: "artifact-revision:endpoint-suggestion:v1",
    artifactHash: "artifact-hash:endpoint-suggestion:v1",
    capabilityCode: "clinical_intelligence.endpoint_suggestion",
    taskRef: "task:001",
    routeIntentBindingRef: "route-intent:assistive-feedback",
    selectedAnchorRef: "selected-anchor:task-001:endpoint",
    reviewVersionRef: "review-version:task-001:v1",
    decisionEpochRef: "decision-epoch:task-001:v1",
    policyBundleRef: "compiled-policy-bundle:phase8:v1",
    lineageFenceEpoch: "lineage-fence:task-001:v1",
    ...overrides,
  };
}

function approvalEvent(approverRef: string, approvalEventRef: string) {
  return {
    approverRef,
    approvalEventRef,
    approverRole: "duty_clinician",
    approvedAt: "2026-04-27T23:59:00.000Z",
  };
}

function approvalCommand(
  assistiveFeedbackChainRef: string,
  approvalEvents = [],
  approvalGateAssessmentId?: string,
) {
  return {
    approvalGateAssessmentId,
    assistiveSessionRef: "assistive-session:task-001",
    assistiveFeedbackChainRef,
    assistiveCapabilityTrustEnvelopeRef: "assistive-capability-trust-envelope:task-001",
    artifactRef: "endpoint-suggestion:task-001:v1",
    artifactHash: "artifact-hash:endpoint-suggestion:v1",
    reviewVersionRef: "review-version:task-001:v1",
    decisionEpochRef: "decision-epoch:task-001:v1",
    selectedAnchorRef: "selected-anchor:task-001:endpoint",
    decisionType: "endpoint_decision",
    riskTier: "high" as const,
    expectedHarmAtGate: 0.55,
    trustScoreAtGate: 0.74,
    sessionFreshnessPenalty: 0,
    continuityValidationState: "trusted" as const,
    allFencesValid: true,
    externallyConsequential: true,
    irreversible: true,
    policyExceptionOverride: false,
    hardStopOverride: false,
    completionAdjacencyState: "allowed" as const,
    modelOutputGeneratorRef: "model:generator",
    approvalEvents,
    approvalGatePolicy: {
      approvalPolicyBundleRef: "approval-policy-bundle:phase8:v1",
      thetaDualReview: 0.4,
      tauSingleReviewerGreen: 0.85,
      tauCommit: 0.7,
    },
  };
}
