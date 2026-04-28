import { describe, expect, it } from "vitest";
import {
  createAssistiveTrustEnvelopeProjectionPlane,
  type AssistiveInvocationGrantProjection,
  type AssistiveRunSettlementProjection,
  type AssistiveTrustActorContext,
  type AssistiveTrustActorRole,
  type ResolveSurfaceBindingCommand,
} from "../../packages/domains/assistive_trust_envelope/src/index.ts";

const fixedClock = { now: () => "2026-04-27T23:20:00.000Z" };

function actor(actorRole: AssistiveTrustActorRole): AssistiveTrustActorContext {
  return {
    actorRef: `actor:${actorRole}`,
    actorRole,
    purposeOfUse: "phase8_trust_envelope_test",
    routeIntentBindingRef: "route-intent:assistive-trust-envelope",
    auditCorrelationId: `audit:${actorRole}`,
  };
}

describe("411 trust envelope posture and freeze frame", () => {
  it("projects an interactive envelope only when grant, settlement, trust, rollout, publication, and continuity are current", () => {
    const plane = createAssistiveTrustEnvelopeProjectionPlane({ clock: fixedClock });
    const binding = plane.surfaceBindings.resolveSurfaceBinding(
      surfaceBindingCommand(),
      actor("assistive_surface_resolver"),
    );
    const provenance = createProvenance(plane);
    const confidence = plane.confidenceDigests.createConfidenceDigest(
      {
        artifactRef: "suggestion-envelope:task-001",
        capabilityCode: "capability:endpoint_suggestion",
        supportProbabilityRef: "support-probability:endpoint-suggestion:task-001:v1",
        evidenceCoverage: 0.82,
        epistemicUncertainty: "low",
        expectedHarmBand: "low",
        calibrationVersionRef: "calibration:endpoint-suggestion:v1",
        trustState: "trusted",
        publicationState: "published",
        runtimePublicationState: "current",
        continuityState: "current",
      },
      actor("clinical_safety_lead"),
    );

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
        selectedAnchorRef: "selected-anchor:task-001:summary-rail",
        routeFamily: "route-family:staff-workspace",
        entityContinuityKey: "entity-continuity:task-001",
        continuityState: "current",
      },
      actor("trust_envelope_projector"),
    );

    expect(envelope.surfacePostureState).toBe("interactive");
    expect(envelope.actionabilityState).toBe("enabled");
    expect(envelope.confidencePostureState).toBe("conservative_band");
    expect(envelope.completionAdjacencyState).toBe("allowed");
    expect(envelope.blockingReasonRefs).toEqual([]);
  });

  it("freezes in place on runtime publication drift and suppresses write affordances", () => {
    const plane = createAssistiveTrustEnvelopeProjectionPlane({ clock: fixedClock });
    const binding = plane.surfaceBindings.resolveSurfaceBinding(
      surfaceBindingCommand({
        runtimePublicationState: "stale",
        runtimePublicationBundleRef: "runtime-publication:phase8:stale",
      }),
      actor("assistive_surface_resolver"),
    );
    const provenance = createProvenance(plane);
    const confidence = plane.confidenceDigests.createConfidenceDigest(
      {
        artifactRef: "suggestion-envelope:task-001",
        capabilityCode: "capability:endpoint_suggestion",
        supportProbabilityRef: "support-probability:endpoint-suggestion:task-001:v1",
        evidenceCoverage: 0.76,
        epistemicUncertainty: "medium",
        expectedHarmBand: "medium",
        calibrationVersionRef: "calibration:endpoint-suggestion:v1",
        trustState: "trusted",
        publicationState: "published",
        runtimePublicationState: "stale",
        continuityState: "current",
      },
      actor("clinical_safety_lead"),
    );

    const envelope = plane.trustEnvelopes.projectTrustEnvelope(
      {
        artifactRef: "suggestion-envelope:task-001",
        capabilityCode: "capability:endpoint_suggestion",
        surfaceBindingRef: binding.assistiveSurfaceBindingId,
        invocationGrant: grantProjection({
          runtimePublicationBundleRef: "runtime-publication:phase8:stale",
        }),
        runSettlement: settlementProjection({
          runtimePublicationBundleRef: "runtime-publication:phase8:stale",
        }),
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
        selectedAnchorRef: "selected-anchor:task-001:summary-rail",
        routeFamily: "route-family:staff-workspace",
        entityContinuityKey: "entity-continuity:task-001",
        continuityState: "current",
      },
      actor("trust_envelope_projector"),
    );

    expect(envelope.surfacePostureState).toBe("provenance_only");
    expect(envelope.actionabilityState).toBe("regenerate_only");
    expect(envelope.confidencePostureState).toBe("suppressed");
    expect(envelope.blockingReasonRefs).toEqual(
      expect.arrayContaining([
        "runtime_publication_drift_freeze_frame_required",
        "same_shell_recovery_required",
      ]),
    );
    expect(envelope.freezeFrameRef).toBeDefined();
    const freezeFrame = plane.runtime.store.freezeFrames.get(envelope.freezeFrameRef ?? "");
    expect(freezeFrame?.suppressWriteAffordances).toBe(true);
    expect(freezeFrame?.suppressedAffordances).toEqual(
      expect.arrayContaining(["accept", "insert", "completion"]),
    );
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
