import { describe, expect, it } from "vitest";
import {
  createAssistiveTrustEnvelopeProjectionPlane,
  type AssistiveInvocationGrantProjection,
  type AssistiveRunSettlementProjection,
  type AssistiveTrustActorContext,
  type AssistiveTrustActorRole,
  type ResolveSurfaceBindingCommand,
} from "../../packages/domains/assistive_trust_envelope/src/index.ts";

const fixedClock = { now: () => "2026-04-27T23:30:00.000Z" };

function actor(actorRole: AssistiveTrustActorRole): AssistiveTrustActorContext {
  return {
    actorRef: `actor:${actorRole}`,
    actorRole,
    purposeOfUse: "phase8_same_shell_fail_closed_test",
    routeIntentBindingRef: "route-intent:assistive-trust-envelope",
    auditCorrelationId: `audit:${actorRole}`,
  };
}

describe("411 same-shell recovery and fail-closed projection", () => {
  it("fails closed when trust projection and rollout verdict inputs are absent", () => {
    const plane = createAssistiveTrustEnvelopeProjectionPlane({ clock: fixedClock });
    const binding = plane.surfaceBindings.resolveSurfaceBinding(
      surfaceBindingCommand({ rolloutVerdictRef: "" }),
      actor("assistive_surface_resolver"),
    );
    const provenance = createProvenance(plane);
    const confidence = createSuppressedConfidence(plane);

    const envelope = plane.trustEnvelopes.projectTrustEnvelope(
      {
        artifactRef: "suggestion-envelope:task-001",
        capabilityCode: "capability:endpoint_suggestion",
        surfaceBindingRef: binding.assistiveSurfaceBindingId,
        invocationGrant: grantProjection(),
        runSettlement: settlementProjection(),
        killSwitchState: {
          killSwitchStateId: "kill-switch-state:endpoint-suggestion:inactive",
          killState: "inactive",
          reasonCode: "normal_operation",
        },
        provenanceEnvelopeRefs: [provenance.assistiveProvenanceEnvelopeId],
        confidenceDigestRefs: [confidence.assistiveConfidenceDigestId],
        trustState: "trusted",
        assistiveCapabilityWatchTupleRef: "assistive-watch-tuple:endpoint-suggestion:v1",
        selectedAnchorRef: "selected-anchor:task-001:summary-rail",
        routeFamily: "route-family:staff-workspace",
        entityContinuityKey: "entity-continuity:task-001",
        continuityState: "current",
      },
      actor("trust_envelope_projector"),
    );

    expect(envelope.surfacePostureState).toBe("placeholder_only");
    expect(envelope.actionabilityState).toBe("regenerate_only");
    expect(envelope.confidencePostureState).toBe("suppressed");
    expect(envelope.completionAdjacencyState).toBe("blocked");
    expect(envelope.blockingReasonRefs).toEqual(
      expect.arrayContaining([
        "missing_trust_projection_fail_closed",
        "missing_rollout_verdict_fail_closed",
      ]),
    );
    expect(envelope.browserClientActionabilityRecomputeForbidden).toBe(true);
  });

  it("retains the original route, selected anchor, and entity continuity when selected anchor drifts", () => {
    const plane = createAssistiveTrustEnvelopeProjectionPlane({ clock: fixedClock });
    const binding = plane.surfaceBindings.resolveSurfaceBinding(
      surfaceBindingCommand(),
      actor("assistive_surface_resolver"),
    );
    const provenance = createProvenance(plane);
    const confidence = createSuppressedConfidence(plane);

    const envelope = plane.trustEnvelopes.projectTrustEnvelope(
      {
        artifactRef: "suggestion-envelope:task-001",
        capabilityCode: "capability:endpoint_suggestion",
        surfaceBindingRef: binding.assistiveSurfaceBindingId,
        invocationGrant: grantProjection(),
        runSettlement: settlementProjection(),
        killSwitchState: {
          killSwitchStateId: "kill-switch-state:endpoint-suggestion:inactive",
          killState: "inactive",
          reasonCode: "normal_operation",
        },
        provenanceEnvelopeRefs: [provenance.assistiveProvenanceEnvelopeId],
        confidenceDigestRefs: [confidence.assistiveConfidenceDigestId],
        trustState: "trusted",
        trustProjectionRef: "assistive-trust-projection:endpoint-suggestion:v1",
        assistiveCapabilityWatchTupleRef: "assistive-watch-tuple:endpoint-suggestion:v1",
        rolloutVerdictRef: "rollout-verdict:endpoint-suggestion:visible",
        selectedAnchorRef: "selected-anchor:task-001:different-card",
        routeFamily: "route-family:staff-workspace",
        entityContinuityKey: "entity-continuity:task-001",
        continuityState: "current",
      },
      actor("trust_envelope_projector"),
    );

    expect(envelope.selectedAnchorRef).toBe("selected-anchor:task-001:summary-rail");
    expect(envelope.observedSelectedAnchorRef).toBe("selected-anchor:task-001:different-card");
    expect(envelope.routeFamily).toBe("route-family:staff-workspace");
    expect(envelope.entityContinuityKey).toBe("entity-continuity:task-001");
    expect(envelope.sameShellRecoveryRequired).toBe(true);
    expect(envelope.surfacePostureState).toBe("provenance_only");
    expect(envelope.actionabilityState).toBe("regenerate_only");
    expect(envelope.blockingReasonRefs).toEqual(
      expect.arrayContaining([
        "selected_anchor_drift_freeze_frame_required",
        "same_shell_recovery_required",
      ]),
    );
    const freezeFrame = plane.runtime.store.freezeFrames.get(envelope.freezeFrameRef ?? "");
    expect(freezeFrame?.sameShellSelectedAnchorRef).toBe("selected-anchor:task-001:summary-rail");
  });
});

function createProvenance(plane: ReturnType<typeof createAssistiveTrustEnvelopeProjectionPlane>) {
  return plane.provenanceEnvelopes.createProvenanceEnvelope(
    {
      artifactRef: "suggestion-envelope:task-001",
      capabilityCode: "capability:endpoint_suggestion",
      inputEvidenceSnapshotRef: "evidence-snapshot:task-001:v1",
      inputEvidenceSnapshotHash: "sha256:evidence-snapshot-task-001-v1",
      captureBundleRef: "capture-bundle:task-001:v1",
      derivationPackageRefs: ["derivation-package:documentation-context:v1"],
      summaryParityRef: "summary-parity:task-001:v1",
      evidenceMapSetRef: "evidence-map-set:task-001:v1",
      modelVersionRef: "model:endpoint-suggestion:v1",
      promptVersionRef: "prompt:endpoint-suggestion:v1",
      outputSchemaVersionRef: "schema:suggestion-envelope:v1",
      calibrationBundleRef: "calibration:endpoint-suggestion:v1",
      policyBundleRef: "compiled-policy-bundle:phase8:v1",
      surfacePublicationRef: "surface-publication:staff-workspace:v1",
      runtimePublicationBundleRef: "runtime-publication:phase8:v1",
      maskingPolicyRef: "masking-policy:assistive:v1",
    },
    actor("trust_envelope_projector"),
  );
}

function createSuppressedConfidence(
  plane: ReturnType<typeof createAssistiveTrustEnvelopeProjectionPlane>,
) {
  return plane.confidenceDigests.createConfidenceDigest(
    {
      artifactRef: "suggestion-envelope:task-001",
      capabilityCode: "capability:endpoint_suggestion",
      supportProbabilityRef: "support-probability:endpoint-suggestion:task-001:v1",
      evidenceCoverage: 0.55,
      epistemicUncertainty: "medium",
      expectedHarmBand: "medium",
      calibrationVersionRef: "calibration:endpoint-suggestion:v1",
      trustState: "degraded",
      publicationState: "published",
      runtimePublicationState: "current",
      continuityState: "current",
    },
    actor("clinical_safety_lead"),
  );
}

function surfaceBindingCommand(
  overrides: Partial<ResolveSurfaceBindingCommand> = {},
): ResolveSurfaceBindingCommand {
  return {
    capabilityCode: "capability:endpoint_suggestion",
    artifactRef: "suggestion-envelope:task-001",
    entityContinuityKey: "entity-continuity:task-001",
    routeFamily: "route-family:staff-workspace",
    allowedShell: "staff_workspace",
    audienceTier: "staff",
    visibilityPolicyRef: "visibility-policy:staff-only:v1",
    rolloutVerdictRef: "rollout-verdict:endpoint-suggestion:visible",
    rolloutRung: "visible_insert",
    consistencyProjectionRef: "workspace-consistency:task-001:v1",
    staffWorkspaceConsistencyProjectionRef: "staff-workspace-consistency:task-001:v1",
    workspaceSliceTrustProjectionRef: "workspace-slice-trust:task-001:v1",
    workspaceTrustEnvelopeRef: "workspace-trust-envelope:task-001:v1",
    surfaceRouteContractRef: "surface-route-contract:staff-workspace:v1",
    surfacePublicationRef: "surface-publication:staff-workspace:v1",
    runtimePublicationBundleRef: "runtime-publication:phase8:v1",
    releaseRecoveryDispositionRef: "release-recovery:phase8:v1",
    selectedAnchorRequirement: "selected-anchor:task-001:summary-rail",
    placeholderContractRef: "placeholder-contract:assistive:v1",
    ...overrides,
  };
}

function grantProjection(
  overrides: Partial<AssistiveInvocationGrantProjection> = {},
): AssistiveInvocationGrantProjection {
  return {
    assistiveInvocationGrantId: "assistive-invocation-grant:endpoint-suggestion:task-001",
    capabilityCode: "capability:endpoint_suggestion",
    routeFamily: "route-family:staff-workspace",
    entityContinuityKey: "entity-continuity:task-001",
    selectedAnchorRef: "selected-anchor:task-001:summary-rail",
    rolloutVerdictRef: "rollout-verdict:endpoint-suggestion:visible",
    rolloutRung: "visible_insert",
    renderPosture: "visible",
    grantState: "live",
    compiledPolicyBundleRef: "compiled-policy-bundle:phase8:v1",
    surfacePublicationRef: "surface-publication:staff-workspace:v1",
    runtimePublicationBundleRef: "runtime-publication:phase8:v1",
    releaseRecoveryDispositionRef: "release-recovery:phase8:v1",
    ...overrides,
  };
}

function settlementProjection(
  overrides: Partial<AssistiveRunSettlementProjection> = {},
): AssistiveRunSettlementProjection {
  return {
    assistiveRunSettlementId: "assistive-run-settlement:endpoint-suggestion:task-001",
    assistiveInvocationGrantRef: "assistive-invocation-grant:endpoint-suggestion:task-001",
    settlementState: "renderable",
    renderableArtifactRefs: ["suggestion-envelope:task-001"],
    blockedArtifactRefs: [],
    policyBundleRef: "compiled-policy-bundle:phase8:v1",
    surfacePublicationRef: "surface-publication:staff-workspace:v1",
    runtimePublicationBundleRef: "runtime-publication:phase8:v1",
    releaseRecoveryDispositionRef: "release-recovery:phase8:v1",
    ...overrides,
  };
}
