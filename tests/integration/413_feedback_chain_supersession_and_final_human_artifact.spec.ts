import { describe, expect, it } from "vitest";
import {
  createAssistiveFeedbackChainPlane,
  type AssistiveFeedbackActorContext,
  type AssistiveFeedbackActorRole,
  type OpenFeedbackChainCommand,
} from "../../packages/domains/assistive_feedback_chain/src/index.ts";

const fixedClock = { now: () => "2026-04-27T23:57:00.000Z" };

function actor(actorRole: AssistiveFeedbackActorRole): AssistiveFeedbackActorContext {
  return {
    actorRef: `actor:${actorRole}`,
    actorRole,
    purposeOfUse: "phase8_final_artifact_test",
    routeIntentBindingRef: "route-intent:assistive-feedback",
    auditCorrelationId: `audit:${actorRole}`,
  };
}

describe("413 feedback chain supersession and final human artifact", () => {
  it("binds a final human artifact only after approval gate readiness and authoritative settlement", () => {
    const plane = createAssistiveFeedbackChainPlane({ clock: fixedClock });
    const chain = plane.feedbackChains.openFeedbackChain(
      chainCommand(),
      actor("feedback_chain_service"),
    );
    const action = plane.actionLedger.recordAction(
      actionCommand(chain.assistiveFeedbackChainId, "gesture:accept-after-edit"),
      actor("action_ledger"),
    );
    plane.overrideRecords.captureOverrideRecord(
      overrideCommand(chain.assistiveFeedbackChainId, action.actionRecordId),
      actor("clinical_reviewer"),
    );

    expect(() =>
      plane.finalHumanArtifacts.bindFinalHumanArtifact(
        finalArtifactCommand(chain.assistiveFeedbackChainId, "missing-assessment"),
        actor("clinical_reviewer"),
      ),
    ).toThrow(/HumanApprovalGateAssessment not found/);

    const assessment = plane.approvalGates.assessApprovalGate(
      approvalCommand(chain.assistiveFeedbackChainId, [
        {
          approverRef: "clinician:one",
          approvalEventRef: "approval-event:one",
          approverRole: "duty_clinician",
          approvedAt: "2026-04-27T23:57:00.000Z",
        },
      ]),
      actor("clinical_reviewer"),
    );

    const finalArtifact = plane.finalHumanArtifacts.bindFinalHumanArtifact(
      finalArtifactCommand(chain.assistiveFeedbackChainId, assessment.approvalGateAssessmentId),
      actor("clinical_reviewer"),
    );

    expect(finalArtifact.workflowSettlementState).toBe("settled");
    expect(finalArtifact.authoritativeWorkflowSettlementRef).toBe(
      "command-settlement:task-001:submitted",
    );
    expect(plane.runtime.store.chains.get(chain.assistiveFeedbackChainId)?.chainState).toBe(
      "settled_clean",
    );
  });

  it("supersedes rather than mutates a chain for regenerate or artifact-hash drift", () => {
    const plane = createAssistiveFeedbackChainPlane({ clock: fixedClock });
    const chain = plane.feedbackChains.openFeedbackChain(
      chainCommand(),
      actor("feedback_chain_service"),
    );
    const action = plane.actionLedger.recordAction(
      actionCommand(chain.assistiveFeedbackChainId, "gesture:regenerate", {
        actionType: "regenerate",
      }),
      actor("action_ledger"),
    );

    const result = plane.supersession.supersedeChain(
      {
        currentFeedbackChainRef: chain.assistiveFeedbackChainId,
        supersessionReason: "artifact_hash_drift",
        replacementArtifactRef: "draft-note:task-001:v2",
        replacementArtifactRevisionRef: "artifact-revision:draft-note:v2",
        replacementArtifactHash: "artifact-hash:draft-note:v2",
      },
      actor("feedback_chain_service"),
    );

    expect(result.supersededChain.chainState).toBe("superseded");
    expect(result.supersededChain.actionRecordRefs).toContain(action.actionRecordId);
    expect(result.replacementChain?.supersedesFeedbackChainRef).toBe(
      chain.assistiveFeedbackChainId,
    );
    expect(result.replacementChain?.artifactHash).toBe("artifact-hash:draft-note:v2");
  });
});

function chainCommand(overrides: Partial<OpenFeedbackChainCommand> = {}): OpenFeedbackChainCommand {
  return {
    assistiveSessionRef: "assistive-session:task-001",
    assistiveCapabilityTrustEnvelopeRef: "assistive-capability-trust-envelope:task-001",
    artifactRef: "draft-note:task-001:v1",
    artifactRevisionRef: "artifact-revision:draft-note:v1",
    artifactHash: "artifact-hash:draft-note:v1",
    capabilityCode: "documentation.note_draft",
    taskRef: "task:001",
    routeIntentBindingRef: "route-intent:assistive-feedback",
    selectedAnchorRef: "selected-anchor:task-001:note-section",
    reviewVersionRef: "review-version:task-001:v1",
    decisionEpochRef: "decision-epoch:task-001:v1",
    policyBundleRef: "compiled-policy-bundle:phase8:v1",
    lineageFenceEpoch: "lineage-fence:task-001:v1",
    ...overrides,
  };
}

function actionCommand(
  assistiveFeedbackChainRef: string,
  actionGestureKey: string,
  overrides = {},
) {
  return {
    assistiveSessionId: "assistive-session:task-001",
    assistiveFeedbackChainRef,
    assistiveCapabilityTrustEnvelopeRef: "assistive-capability-trust-envelope:task-001",
    artifactRef: "draft-note:task-001:v1",
    artifactHash: "artifact-hash:draft-note:v1",
    actionType: "accept_after_edit" as const,
    actionGestureKey,
    sectionRef: "note-section:intro",
    actorRef: "clinician:one",
    routeIntentBindingRef: "route-intent:assistive-feedback",
    selectedAnchorRef: "selected-anchor:task-001:note-section",
    reviewVersionRef: "review-version:task-001:v1",
    decisionEpochRef: "decision-epoch:task-001:v1",
    reviewActionLeaseRef: "review-action-lease:task-001",
    uiEventEnvelopeRef: "ui-event:gesture",
    uiTransitionSettlementRecordRef: "ui-transition:settled",
    uiTelemetryDisclosureFenceRef: "ui-telemetry-disclosure:fence",
    ...overrides,
  };
}

function overrideCommand(assistiveFeedbackChainRef: string, actionRecordId: string) {
  return {
    assistiveSessionId: "assistive-session:task-001",
    assistiveFeedbackChainRef,
    assistiveArtifactActionRecordRef: actionRecordId,
    assistiveCapabilityTrustEnvelopeRef: "assistive-capability-trust-envelope:task-001",
    capabilityCode: "documentation.note_draft",
    decisionType: "clinical_note",
    modelOutputRef: "model-output:draft-note:v1",
    humanOutputRef: "human-output:draft-note:v1",
    artifactHash: "artifact-hash:draft-note:v1",
    overrideDisposition: "accepted_after_edit" as const,
    overrideScope: "content_material" as const,
    changedSpanRefs: ["span:intro"],
    overrideReasonCodes: ["reason:clinical_specificity"],
    displayConfidenceBand: "supported",
    allowedSetMassAtDecision: 0.8,
    epistemicUncertaintyAtDecision: 0.1,
    expectedHarmAtDecision: 0.1,
    trustScoreAtDecision: 0.93,
    sessionFreshnessPenalty: 0,
    continuityValidationState: "trusted" as const,
    provenanceEnvelopeRef: "assistive-provenance:draft-note:v1",
    confidenceDigestRef: "assistive-confidence:draft-note:v1",
    selectedAnchorRef: "selected-anchor:task-001:note-section",
    reviewVersionRef: "review-version:task-001:v1",
    reasonPolicy: {
      policyBundleRef: "approval-policy-bundle:phase8:v1",
      highHarmReasonThreshold: 0.3,
      lowTrustReasonThreshold: 0.8,
    },
  };
}

function approvalCommand(assistiveFeedbackChainRef: string, approvalEvents = []) {
  return {
    assistiveSessionRef: "assistive-session:task-001",
    assistiveFeedbackChainRef,
    assistiveCapabilityTrustEnvelopeRef: "assistive-capability-trust-envelope:task-001",
    artifactRef: "draft-note:task-001:v1",
    artifactHash: "artifact-hash:draft-note:v1",
    reviewVersionRef: "review-version:task-001:v1",
    decisionEpochRef: "decision-epoch:task-001:v1",
    selectedAnchorRef: "selected-anchor:task-001:note-section",
    decisionType: "clinical_note",
    riskTier: "medium" as const,
    expectedHarmAtGate: 0.1,
    trustScoreAtGate: 0.94,
    sessionFreshnessPenalty: 0,
    continuityValidationState: "trusted" as const,
    allFencesValid: true,
    externallyConsequential: false,
    irreversible: false,
    completionAdjacencyState: "allowed" as const,
    approvalEvents,
    approvalGatePolicy: {
      approvalPolicyBundleRef: "approval-policy-bundle:phase8:v1",
      thetaDualReview: 0.4,
      tauSingleReviewerGreen: 0.8,
      tauCommit: 0.75,
    },
  };
}

function finalArtifactCommand(
  assistiveFeedbackChainRef: string,
  approvalGateAssessmentRef: string,
) {
  return {
    taskRef: "task:001",
    assistiveFeedbackChainRef,
    assistiveCapabilityTrustEnvelopeRef: "assistive-capability-trust-envelope:task-001",
    artifactType: "clinical_note" as const,
    contentRef: "human-final-note:task-001:v1",
    artifactHash: "human-final-note-hash:v1",
    approvedByRefs: ["clinician:one"],
    approvalEventRefs: ["approval-event:one"],
    approvedAt: "2026-04-27T23:57:00.000Z",
    approvalMode: "assistive_edited" as const,
    approvalGateAssessmentRef,
    sourceAssistiveRefs: ["draft-note:task-001:v1"],
    artifactPresentationContractRef: "artifact-presentation:clinical-note",
    authoritativeWorkflowSettlementRef: "command-settlement:task-001:submitted",
    taskCompletionSettlementEnvelopeRef: "task-completion-settlement:task-001",
    reviewVersionRef: "review-version:task-001:v1",
    decisionEpochRef: "decision-epoch:task-001:v1",
    selectedAnchorRef: "selected-anchor:task-001:note-section",
    workflowSettlementState: "settled" as const,
    completionAdjacencyState: "allowed" as const,
  };
}
