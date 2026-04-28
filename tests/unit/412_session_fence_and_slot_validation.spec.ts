import { describe, expect, it } from "vitest";
import {
  createAssistiveWorkProtectionPlane,
  type AssistiveWorkProtectionActorContext,
  type AssistiveWorkProtectionActorRole,
  type StartAssistiveSessionCommand,
} from "../../packages/domains/assistive_work_protection/src/index.ts";

const fixedClock = { now: () => "2026-04-27T23:40:00.000Z" };

function actor(actorRole: AssistiveWorkProtectionActorRole): AssistiveWorkProtectionActorContext {
  return {
    actorRef: `actor:${actorRole}`,
    actorRole,
    purposeOfUse: "phase8_session_fence_test",
    routeIntentBindingRef: "route-intent:assistive-work-protection",
    auditCorrelationId: `audit:${actorRole}`,
  };
}

describe("412 session fence and slot validation", () => {
  it("starts a server-side assistive session and validates matching workspace fences", () => {
    const plane = createAssistiveWorkProtectionPlane({ clock: fixedClock });
    const session = plane.sessions.startSession(
      sessionCommand(),
      actor("assistive_session_service"),
    );

    const validation = plane.sessionFences.validateSessionFence({
      assistiveSessionRef: session.assistiveSessionId,
      currentReviewVersionRef: "review-version:task-001:v1",
      currentDecisionEpochRef: "decision-epoch:task-001:v1",
      currentPolicyBundleRef: "compiled-policy-bundle:phase8:v1",
      currentLineageFenceEpoch: "lineage-fence:task-001:v1",
      currentSelectedAnchorRef: "selected-anchor:task-001:note-section",
      currentSurfacePublicationRef: "surface-publication:staff-workspace:v1",
      currentRuntimePublicationBundleRef: "runtime-publication:phase8:v1",
      currentRuntimePublicationState: "current",
      currentReviewActionLeaseRef: "review-action-lease:task-001:v1",
      currentWorkspaceTrustEnvelopeRef: "workspace-trust-envelope:task-001:v1",
      currentAssistiveCapabilityTrustEnvelopeRef: "assistive-capability-trust-envelope:task-001:v1",
      currentTrustEnvelopeActionabilityState: "enabled",
      sessionFenceToken: "session-fence-token:task-001",
    });

    expect(session.sessionState).toBe("live");
    expect(validation.validationState).toBe("valid");
    expect(validation.insertPostureState).toBe("allowed");
    expect(validation.blockingReasonRefs).toEqual([]);
  });

  it("fails closed when review version drifts and requires regeneration", () => {
    const plane = createAssistiveWorkProtectionPlane({ clock: fixedClock });
    const session = plane.sessions.startSession(
      sessionCommand(),
      actor("assistive_session_service"),
    );

    const validation = plane.sessionFences.validateSessionFence({
      assistiveSessionRef: session.assistiveSessionId,
      currentReviewVersionRef: "review-version:task-001:v2",
      currentDecisionEpochRef: "decision-epoch:task-001:v1",
      currentPolicyBundleRef: "compiled-policy-bundle:phase8:v1",
      currentLineageFenceEpoch: "lineage-fence:task-001:v1",
      currentSelectedAnchorRef: "selected-anchor:task-001:note-section",
      currentSurfacePublicationRef: "surface-publication:staff-workspace:v1",
      currentRuntimePublicationBundleRef: "runtime-publication:phase8:v1",
      currentRuntimePublicationState: "current",
      currentReviewActionLeaseRef: "review-action-lease:task-001:v1",
      currentWorkspaceTrustEnvelopeRef: "workspace-trust-envelope:task-001:v1",
      currentAssistiveCapabilityTrustEnvelopeRef: "assistive-capability-trust-envelope:task-001:v1",
      currentTrustEnvelopeActionabilityState: "enabled",
      sessionFenceToken: "session-fence-token:task-001",
    });

    expect(validation.validationState).toBe("drifted");
    expect(validation.insertPostureState).toBe("regenerate_required");
    expect(validation.blockingReasonRefs).toContain("review_version_drift_regenerate_required");
  });

  it("registers typed insertion points and rejects missing slot hashes", () => {
    const plane = createAssistiveWorkProtectionPlane({ clock: fixedClock });
    const session = plane.sessions.startSession(
      sessionCommand(),
      actor("assistive_session_service"),
    );

    const point = plane.insertionPoints.registerInsertionPoint(
      {
        assistiveSessionRef: session.assistiveSessionId,
        taskRef: "task:001",
        surfaceRef: "surface:assistive-rail",
        contentClass: "note_section",
        selectedAnchorRef: "selected-anchor:task-001:note-section",
        reviewVersionRef: "review-version:task-001:v1",
        decisionEpochRef: "decision-epoch:task-001:v1",
        lineageFenceEpoch: "lineage-fence:task-001:v1",
        slotHash: "slot-hash:note-section:intro",
        quietReturnTargetRef: "quiet-return-target:task-001",
      },
      actor("assistive_lease_service"),
    );

    expect(point.slotState).toBe("live");
    expect(point.contentClass).toBe("note_section");
    expect(() =>
      plane.insertionPoints.registerInsertionPoint(
        {
          assistiveSessionRef: session.assistiveSessionId,
          taskRef: "task:001",
          surfaceRef: "surface:assistive-rail",
          contentClass: "message_body",
          selectedAnchorRef: "selected-anchor:task-001:note-section",
          reviewVersionRef: "review-version:task-001:v1",
          decisionEpochRef: "decision-epoch:task-001:v1",
          lineageFenceEpoch: "lineage-fence:task-001:v1",
          slotHash: "",
          quietReturnTargetRef: "quiet-return-target:task-001",
        },
        actor("assistive_lease_service"),
      ),
    ).toThrow(/slotHash/i);
  });
});

function sessionCommand(
  overrides: Partial<StartAssistiveSessionCommand> = {},
): StartAssistiveSessionCommand {
  return {
    taskRef: "task:001",
    contextSnapshotRef: "documentation-context:task-001:v1",
    reviewVersionRef: "review-version:task-001:v1",
    decisionEpochRef: "decision-epoch:task-001:v1",
    policyBundleRef: "compiled-policy-bundle:phase8:v1",
    lineageFenceEpoch: "lineage-fence:task-001:v1",
    entityContinuityKey: "entity-continuity:task-001",
    selectedAnchorRef: "selected-anchor:task-001:note-section",
    surfaceBindingRef: "assistive-surface-binding:task-001:v1",
    surfacePublicationRef: "surface-publication:staff-workspace:v1",
    runtimePublicationBundleRef: "runtime-publication:phase8:v1",
    staffWorkspaceConsistencyProjectionRef: "staff-workspace-consistency:task-001:v1",
    workspaceSliceTrustProjectionRef: "workspace-slice-trust:task-001:v1",
    workspaceTrustEnvelopeRef: "workspace-trust-envelope:task-001:v1",
    assistiveCapabilityTrustEnvelopeRef: "assistive-capability-trust-envelope:task-001:v1",
    reviewActionLeaseRef: "review-action-lease:task-001:v1",
    sessionFenceToken: "session-fence-token:task-001",
    ...overrides,
  };
}
