import { describe, expect, it } from "vitest";
import {
  createAssistiveTrustEnvelopeProjectionPlane,
  type AssistiveTrustActorContext,
  type AssistiveTrustActorRole,
  type ResolveSurfaceBindingCommand,
} from "../../packages/domains/assistive_trust_envelope/src/index.ts";

const fixedClock = { now: () => "2026-04-27T23:10:00.000Z" };

function actor(actorRole: AssistiveTrustActorRole): AssistiveTrustActorContext {
  return {
    actorRef: `actor:${actorRole}`,
    actorRole,
    purposeOfUse: "phase8_surface_binding_test",
    routeIntentBindingRef: "route-intent:assistive-trust-envelope",
    auditCorrelationId: `audit:${actorRole}`,
  };
}

describe("411 surface binding and presentation contract", () => {
  it("resolves a live staff-only same-shell surface binding with workspace trust refs", () => {
    const plane = createAssistiveTrustEnvelopeProjectionPlane({ clock: fixedClock });
    const binding = plane.surfaceBindings.resolveSurfaceBinding(
      surfaceBindingCommand(),
      actor("assistive_surface_resolver"),
    );

    expect(binding.bindingState).toBe("live");
    expect(binding.renderPosture).toBe("visible");
    expect(binding.audienceTier).toBe("staff");
    expect(binding.allowedShell).toBe("staff_workspace");
    expect(binding.staffWorkspaceConsistencyProjectionRef).toBe(
      "staff-workspace-consistency:task-001:v1",
    );
    expect(binding.workspaceTrustEnvelopeRef).toBe("workspace-trust-envelope:task-001:v1");
    expect(binding.selectedAnchorRequirement).toBe("selected-anchor:task-001:summary-rail");
  });

  it("rejects patient-facing route attempts instead of widening Phase 8 assistive surfaces", () => {
    const plane = createAssistiveTrustEnvelopeProjectionPlane({ clock: fixedClock });

    expect(() =>
      plane.surfaceBindings.resolveSurfaceBinding(
        surfaceBindingCommand({
          routeFamily: "route-family:patient-web",
          allowedShell: "staff_workspace",
          audienceTier: "patient",
        }),
        actor("assistive_surface_resolver"),
      ),
    ).toThrow(/staff-only/i);
  });

  it("keeps presentation summary-first, companion-only, and raw-score-suppressed", () => {
    const plane = createAssistiveTrustEnvelopeProjectionPlane({ clock: fixedClock });
    const contract = plane.presentationContracts.registerPresentationContract(
      {
        capabilityCode: "capability:endpoint_suggestion",
        contractVersionRef: "assistive-presentation-contract:endpoint-suggestion:v1",
      },
      actor("clinical_safety_lead"),
    );

    expect(contract.presentationMode).toBe("summary_stub");
    expect(contract.dominanceGuard).toBe("companion_only");
    expect(contract.primaryActionLimit).toBe(1);
    expect(contract.rawScoreVisible).toBe(false);
    expect(contract.confidenceDisclosureMode).toBe("suppressed");
  });
});

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
