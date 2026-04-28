import { describe, expect, it } from "vitest";
import {
  createAssistiveFeedbackChainPlane,
  type AssistiveFeedbackActorContext,
  type AssistiveFeedbackActorRole,
  type OpenFeedbackChainCommand,
} from "../../packages/domains/assistive_feedback_chain/src/index.ts";

const fixedClock = { now: () => "2026-04-27T23:55:00.000Z" };

function actor(actorRole: AssistiveFeedbackActorRole): AssistiveFeedbackActorContext {
  return {
    actorRef: `actor:${actorRole}`,
    actorRole,
    purposeOfUse: "phase8_feedback_chain_test",
    routeIntentBindingRef: "route-intent:assistive-feedback",
    auditCorrelationId: `audit:${actorRole}`,
  };
}

describe("413 action gesture idempotency and override rules", () => {
  it("captures one visible gesture once and returns the same action record on retry", () => {
    const plane = createAssistiveFeedbackChainPlane({ clock: fixedClock });
    const chain = plane.feedbackChains.openFeedbackChain(
      chainCommand(),
      actor("feedback_chain_service"),
    );

    const first = plane.actionLedger.recordAction(
      actionCommand(chain.assistiveFeedbackChainId, "gesture:accept:intro"),
      actor("action_ledger"),
    );
    const retry = plane.actionLedger.recordAction(
      actionCommand(chain.assistiveFeedbackChainId, "gesture:accept:intro"),
      actor("action_ledger"),
    );

    expect(retry.actionRecordId).toBe(first.actionRecordId);
    expect(plane.runtime.store.actions.size).toBe(1);
    expect(
      plane.runtime.store.chains.get(chain.assistiveFeedbackChainId)?.actionRecordRefs,
    ).toEqual([first.actionRecordId]);
  });

  it("rejects a reused actionGestureKey that would fork human truth across chains", () => {
    const plane = createAssistiveFeedbackChainPlane({ clock: fixedClock });
    const chain = plane.feedbackChains.openFeedbackChain(
      chainCommand(),
      actor("feedback_chain_service"),
    );
    const replacementChain = plane.feedbackChains.openFeedbackChain(
      chainCommand({
        artifactRef: "draft-note:task-001:v2",
        artifactRevisionRef: "artifact-revision:draft-note:v2",
        artifactHash: "artifact-hash:draft-note:v2",
      }),
      actor("feedback_chain_service"),
    );
    plane.actionLedger.recordAction(
      actionCommand(chain.assistiveFeedbackChainId, "gesture:shared"),
      actor("action_ledger"),
    );

    expect(() =>
      plane.actionLedger.recordAction(
        actionCommand(replacementChain.assistiveFeedbackChainId, "gesture:shared", {
          artifactRef: "draft-note:task-001:v2",
          artifactHash: "artifact-hash:draft-note:v2",
        }),
        actor("action_ledger"),
      ),
    ).toThrow(/action_gesture_cannot_fork_chains/);
  });

  it("requires deterministic reason codes for material or low-confidence overrides", () => {
    const plane = createAssistiveFeedbackChainPlane({ clock: fixedClock });
    const chain = plane.feedbackChains.openFeedbackChain(
      chainCommand(),
      actor("feedback_chain_service"),
    );
    const action = plane.actionLedger.recordAction(
      actionCommand(chain.assistiveFeedbackChainId, "gesture:edit", {
        actionType: "accept_after_edit",
      }),
      actor("action_ledger"),
    );

    expect(() =>
      plane.overrideRecords.captureOverrideRecord(
        {
          ...overrideCommand(chain.assistiveFeedbackChainId, action.actionRecordId),
          overrideDisposition: "accepted_after_edit",
          overrideScope: "content_material",
          overrideReasonCodes: [],
        },
        actor("clinical_reviewer"),
      ),
    ).toThrow(/material_override_reason_code_required/);

    const captured = plane.overrideRecords.captureOverrideRecord(
      {
        ...overrideCommand(chain.assistiveFeedbackChainId, action.actionRecordId),
        overrideDisposition: "accepted_unchanged",
        overrideScope: "style_only",
        displayConfidenceBand: "supported",
        expectedHarmAtDecision: 0.02,
        trustScoreAtDecision: 0.94,
        overrideReasonCodes: [],
      },
      actor("clinical_reviewer"),
    );

    expect(captured.reasonRequirementState).toBe("optional");
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
  overrides: Partial<
    Parameters<
      ReturnType<typeof createAssistiveFeedbackChainPlane>["actionLedger"]["recordAction"]
    >[0]
  > = {},
) {
  return {
    assistiveSessionId: "assistive-session:task-001",
    assistiveFeedbackChainRef,
    assistiveCapabilityTrustEnvelopeRef: "assistive-capability-trust-envelope:task-001",
    artifactRef: "draft-note:task-001:v1",
    artifactHash: "artifact-hash:draft-note:v1",
    actionType: "accept_unchanged" as const,
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
    displayConfidenceBand: "guarded",
    allowedSetMassAtDecision: 0.72,
    epistemicUncertaintyAtDecision: 0.2,
    expectedHarmAtDecision: 0.3,
    trustScoreAtDecision: 0.7,
    sessionFreshnessPenalty: 0,
    continuityValidationState: "trusted" as const,
    provenanceEnvelopeRef: "assistive-provenance:draft-note:v1",
    confidenceDigestRef: "assistive-confidence:draft-note:v1",
    selectedAnchorRef: "selected-anchor:task-001:note-section",
    reviewVersionRef: "review-version:task-001:v1",
    reasonPolicy: {
      policyBundleRef: "approval-policy-bundle:phase8:v1",
      highHarmReasonThreshold: 0.25,
      lowTrustReasonThreshold: 0.8,
    },
  };
}
