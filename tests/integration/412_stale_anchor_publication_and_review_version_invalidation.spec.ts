import { describe, expect, it } from "vitest";
import {
  createAssistiveWorkProtectionPlane,
  type AssistiveWorkProtectionActorContext,
  type AssistiveWorkProtectionActorRole,
  type StartAssistiveSessionCommand,
} from "../../packages/domains/assistive_work_protection/src/index.ts";

const fixedClock = { now: () => "2026-04-27T23:50:00.000Z" };

function actor(actorRole: AssistiveWorkProtectionActorRole): AssistiveWorkProtectionActorContext {
  return {
    actorRef: `actor:${actorRole}`,
    actorRole,
    purposeOfUse: "phase8_stale_anchor_publication_test",
    routeIntentBindingRef: "route-intent:assistive-work-protection",
    auditCorrelationId: `audit:${actorRole}`,
  };
}

describe("412 stale anchor, publication, and review-version invalidation", () => {
  it("invalidates a patch lease when selected anchor or review version drifts", () => {
    const plane = createAssistiveWorkProtectionPlane({ clock: fixedClock });
    const { session, point } = seedSessionAndPoint(plane);
    const lease = plane.patchLeaseIssuer.issueDraftPatchLease(
      {
        assistiveSessionRef: session.assistiveSessionId,
        artifactRef: "draft-note:task-001:v1",
        sectionRef: "note-section:intro",
        draftInsertionPointRef: point.assistiveDraftInsertionPointId,
        reviewActionLeaseRef: "review-action-lease:task-001:v1",
        contentClass: "note_section",
      },
      actor("assistive_lease_service"),
    );

    const validation = plane.patchLeaseValidator.validateDraftPatchLease({
      assistiveDraftPatchLeaseRef: lease.assistiveDraftPatchLeaseId,
      currentReviewVersionRef: "review-version:task-001:v2",
      currentDecisionEpochRef: "decision-epoch:task-001:v1",
      currentLineageFenceEpoch: "lineage-fence:task-001:v1",
      currentSelectedAnchorRef: "selected-anchor:task-001:different",
      currentReviewActionLeaseRef: "review-action-lease:task-001:v1",
      currentSlotHash: "slot-hash:note-section:intro",
    });

    expect(validation.leaseState).toBe("invalidated");
    expect(validation.insertPostureState).toBe("regenerate_required");
    expect(validation.invalidatingDriftState).toBe("anchor_invalidated");
    expect(validation.blockingReasonRefs).toEqual(
      expect.arrayContaining([
        "selected_anchor_drift_regenerate_required",
        "review_version_drift_regenerate_required",
      ]),
    );
  });

  it("blocks insert posture when publication or trust-envelope actionability is stale", () => {
    const plane = createAssistiveWorkProtectionPlane({ clock: fixedClock });
    const session = plane.sessions.startSession(
      sessionCommand({
        runtimePublicationState: "stale",
        trustEnvelopeActionabilityState: "regenerate_only",
      }),
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
      currentRuntimePublicationState: "stale",
      currentReviewActionLeaseRef: "review-action-lease:task-001:v1",
      currentWorkspaceTrustEnvelopeRef: "workspace-trust-envelope:task-001:v1",
      currentAssistiveCapabilityTrustEnvelopeRef: "assistive-capability-trust-envelope:task-001:v1",
      currentTrustEnvelopeActionabilityState: "regenerate_only",
      sessionFenceToken: "session-fence-token:task-001",
    });

    expect(validation.validationState).toBe("blocked");
    expect(validation.insertPostureState).toBe("blocked");
    expect(validation.blockingReasonRefs).toEqual(
      expect.arrayContaining([
        "publication_drift_regenerate_required",
        "trust_envelope_actionability_required",
      ]),
    );
  });

  it("preserves quiet return target while invalidating work protection", () => {
    const plane = createAssistiveWorkProtectionPlane({ clock: fixedClock });
    const { session, point } = seedSessionAndPoint(plane);
    const quietTarget = plane.quietReturnTargets.resolveQuietReturnTarget(
      {
        assistiveSessionRef: session.assistiveSessionId,
        selectedAnchorRef: "selected-anchor:task-001:note-section",
        protectedRegionRef: "protected-region:assistive-note-section",
        priorQuietRegionRef: "quiet-region:task-canvas",
        primaryReadingTargetRef: "reading-target:task-summary",
        returnRouteRef: "/workspace/task/task-001/decision",
      },
      actor("assistive_lease_service"),
    );
    const protection = plane.workProtectionLeases.issueWorkProtectionLease(
      {
        assistiveSessionId: session.assistiveSessionId,
        workspaceFocusProtectionLeaseRef: "workspace-focus-protection-lease:task-001",
        artifactRef: "draft-note:task-001:v1",
        lockReason: "reading_delta",
        draftInsertionPointRef: point.assistiveDraftInsertionPointId,
        protectedRegionRef: "protected-region:assistive-note-section",
        quietReturnTargetRef: quietTarget.assistiveQuietReturnTargetId,
      },
      actor("assistive_lease_service"),
    );

    const invalidated = plane.workProtectionLeases.invalidateWorkProtectionLease(
      protection.assistiveWorkProtectionLeaseId,
      actor("assistive_lease_service"),
      "anchor_invalidated",
    );

    expect(invalidated.leaseState).toBe("invalidated");
    expect(invalidated.quietReturnTargetRef).toBe(quietTarget.assistiveQuietReturnTargetId);
    expect(quietTarget.selectedAnchorRef).toBe("selected-anchor:task-001:note-section");
    expect(quietTarget.returnRouteRef).toBe("/workspace/task/task-001/decision");
  });
});

function seedSessionAndPoint(plane: ReturnType<typeof createAssistiveWorkProtectionPlane>) {
  const session = plane.sessions.startSession(sessionCommand(), actor("assistive_session_service"));
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
  return { session, point };
}

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
