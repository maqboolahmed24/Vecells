import { describe, expect, it } from "vitest";
import {
  createAssistiveWorkProtectionPlane,
  type AssistiveWorkProtectionActorContext,
  type AssistiveWorkProtectionActorRole,
  type StartAssistiveSessionCommand,
} from "../../packages/domains/assistive_work_protection/src/index.ts";

const fixedClock = { now: () => "2026-04-27T23:45:00.000Z" };

function actor(actorRole: AssistiveWorkProtectionActorRole): AssistiveWorkProtectionActorContext {
  return {
    actorRef: `actor:${actorRole}`,
    actorRole,
    purposeOfUse: "phase8_patch_lease_buffering_test",
    routeIntentBindingRef: "route-intent:assistive-work-protection",
    auditCorrelationId: `audit:${actorRole}`,
  };
}

describe("412 patch lease and work protection buffering", () => {
  it("issues a draft patch lease only from a live insertion point and validates it against current slot truth", () => {
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
      currentReviewVersionRef: "review-version:task-001:v1",
      currentDecisionEpochRef: "decision-epoch:task-001:v1",
      currentLineageFenceEpoch: "lineage-fence:task-001:v1",
      currentSelectedAnchorRef: "selected-anchor:task-001:note-section",
      currentReviewActionLeaseRef: "review-action-lease:task-001:v1",
      currentSlotHash: "slot-hash:note-section:intro",
    });

    expect(lease.leaseState).toBe("active");
    expect(validation.insertPostureState).toBe("allowed");
    expect(validation.blockingReasonRefs).toEqual([]);
  });

  it("buffers disruptive deltas during active assistive work protection", () => {
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
        lockReason: "composing",
        draftInsertionPointRef: point.assistiveDraftInsertionPointId,
        protectedRegionRef: "protected-region:assistive-note-section",
        quietReturnTargetRef: quietTarget.assistiveQuietReturnTargetId,
      },
      actor("assistive_lease_service"),
    );

    const delta = plane.deferredDeltaBuffer.bufferDeferredDelta(
      {
        assistiveSessionRef: session.assistiveSessionId,
        assistiveWorkProtectionLeaseRef: protection.assistiveWorkProtectionLeaseId,
        deltaKind: "disruptive",
        blockerSeverity: "medium",
        sourceRef: "queue-change-batch:task-001:newer",
        targetRef: "protected-region:assistive-note-section",
        deltaHash: "delta-hash:queue-change:newer",
      },
      actor("assistive_lease_service"),
    );

    const updatedProtection = plane.runtime.store.workProtectionLeases.get(
      protection.assistiveWorkProtectionLeaseId,
    );
    expect(delta.deltaState).toBe("buffered");
    expect(updatedProtection?.bufferedDeferredDeltaRefs).toContain(delta.assistiveDeferredDeltaId);
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
