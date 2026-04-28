import { describe, expect, it } from "vitest";
import {
  createAssistiveCapabilityControlPlane,
  type AssistiveControlActorContext,
  type AssistiveControlActorRole,
  type EvaluateInvocationEligibilityCommand,
} from "../../packages/domains/assistive_control_plane/src/index.ts";

const fixedClock = { now: () => "2026-04-27T21:00:00.000Z" };

function actor(actorRole: AssistiveControlActorRole): AssistiveControlActorContext {
  return {
    actorRef: `actor:${actorRole}`,
    actorRole,
    purposeOfUse: "phase8_capability_control_test",
    routeIntentBindingRef: "route-intent:assistive-control-plane",
    auditCorrelationId: `audit:${actorRole}`,
  };
}

describe("410 invocation eligibility and composition", () => {
  it("issues an invocation grant only after route, role, subject, evidence, release, and kill-switch checks pass", () => {
    const plane = createReadyPlane();
    const decision = plane.invocationEligibility.evaluateInvocationEligibility(invocationCommand());
    const grant = plane.invocationGrants.issueInvocationGrant(decision, actor("capability_control_plane"));

    expect(decision.eligible).toBe(true);
    expect(grant.capabilityCode).toBe("capability:endpoint_suggestion");
    expect(grant.routeFamily).toBe("route-family:staff-workspace");
    expect(grant.subjectScope).toBe("subject-scope:request-review");
    expect(grant.renderPosture).toBe("visible");
    expect(grant.grantState).toBe("live");
    expect(grant.grantFenceToken).toMatch(/^grant-fence-token:/);
  });

  it("blocks forbidden downstream consumers and recursive capability laundering", () => {
    const plane = createReadyPlane();
    const decision = plane.invocationEligibility.evaluateInvocationEligibility(
      invocationCommand({
        upstreamArtifacts: [
          {
            capabilityCode: "capability:endpoint_suggestion",
            artifactType: "SuggestionEnvelope",
            chainDepth: 3,
          },
        ],
        downstreamConsumerObjectTypes: ["EndpointDecision"],
      }),
    );

    expect(decision.eligible).toBe(false);
    expect(decision.reasonCodes).toEqual(
      expect.arrayContaining(["forbidden_downstream_consumer", "blocked_downstream_consumer", "composition_loop_detected", "composition_chain_depth_exceeded"]),
    );
    expect(() => plane.invocationGrants.issueInvocationGrant(decision, actor("capability_control_plane"))).toThrow(/eligible decision/i);
  });

  it("fails closed when the route family or actor role is outside intended use", () => {
    const plane = createReadyPlane();
    const decision = plane.invocationEligibility.evaluateInvocationEligibility(
      invocationCommand({
        routeFamily: "route-family:patient-web",
        actorRole: "patient",
      }),
    );

    expect(decision.eligible).toBe(false);
    expect(decision.reasonCodes).toEqual(expect.arrayContaining(["route_family_not_allowed", "actor_role_not_permitted"]));
  });
});

function createReadyPlane() {
  const plane = createAssistiveCapabilityControlPlane({ clock: fixedClock });
  plane.intendedUseProfiles.registerProfile(
    {
      profileId: "intended-use:endpoint-suggestion:v1",
      clinicalPurpose: "Review-only endpoint suggestion for trained staff.",
      nonClinicalPurpose: "Surface bounded evidence and abstention posture.",
      medicalPurposeState: "endpoint_suggestion_clinically_consequential_decision_support",
      permittedUserRoles: ["clinical_reviewer", "bounded_suggestion_orchestrator"],
      permittedSubjectScopes: ["subject-scope:request-review"],
      forbiddenActions: ["create_endpoint_decision", "commit_workflow_state"],
      forbiddenDownstreamConsumers: ["EndpointDecision", "AppointmentRecord", "PharmacyCase", "TaskClosure"],
      evidenceRequirement: {
        acceptedEvidenceClassRefs: ["evidence-class:documentation-context", "evidence-class:evaluation-thresholds"],
        minimumEvidenceClassCount: 1,
      },
      humanReviewRequirement: "single_review",
    },
    actor("clinical_safety_lead"),
  );
  plane.compositionPolicies.registerPolicy(
    {
      compositionPolicyId: "composition-policy:endpoint-suggestion:v1",
      capabilityCode: "capability:endpoint_suggestion",
      allowedUpstreamCapabilityCodes: ["capability:structured_fact_extraction", "capability:transcription"],
      allowedDerivedArtifactTypes: ["StructuredFactSet", "TranscriptArtifact", "DocumentationContextSnapshot", "EvidenceMapSet"],
      blockedDownstreamObjectTypes: ["EndpointDecision", "AppointmentRecord", "PharmacyCase", "TaskClosure"],
      maxChainDepth: 2,
      loopDetectionMode: "block",
    },
    actor("clinical_safety_lead"),
  );
  plane.manifests.registerManifest(
    {
      manifestId: "manifest:endpoint-suggestion:v1",
      capabilityCode: "capability:endpoint_suggestion",
      capabilityFamily: "endpoint_suggestion",
      intendedUseProfileRef: "intended-use:endpoint-suggestion:v1",
      allowedContexts: ["route-family:staff-workspace"],
      allowedInputs: ["evidence-class:documentation-context", "evidence-class:evaluation-thresholds"],
      allowedOutputs: ["SuggestionEnvelope", "AbstentionRecord"],
      compositionPolicyRef: "composition-policy:endpoint-suggestion:v1",
      visibilityPolicyRef: "visibility-policy:staff-only:v1",
      surfaceBindingPolicyRef: "surface-binding-policy:staff-workspace:v1",
      routeContractPolicyRef: "route-contract-policy:staff-workspace:v1",
      publicationPolicyRef: "publication-policy:phase8:v1",
      rolloutLadderPolicyRef: "rollout-ladder:endpoint-suggestion:v1",
      recoveryDispositionPolicyRef: "release-recovery:phase8:v1",
      telemetryDisclosurePolicyRef: "telemetry-disclosure:assistive:v1",
      requiredTrustSliceRefs: ["trust-slice:assistive:phase8"],
      shadowModeDefault: true,
      visibleModeDefault: false,
      approvalRequirement: "single_review",
      medicalDeviceAssessmentRef: "medical-device-assessment:endpoint-suggestion:v1",
      releaseCohortRef: "release-cohort:phase8:rc1",
      killSwitchPolicyRef: "kill-switch-policy:endpoint-suggestion:v1",
    },
    actor("capability_control_plane"),
  );
  plane.releaseStates.publishReleaseState(
    {
      releaseStateId: "release-state:endpoint-suggestion:v1",
      capabilityCode: "capability:endpoint_suggestion",
      tenantId: "tenant:demo",
      cohortId: "cohort:phase8-visible",
      mode: "visible_insert",
      effectiveFrom: "2026-04-27T20:00:00.000Z",
      compiledPolicyBundleRef: "compiled-policy-bundle:phase8:v1",
      rolloutVerdictRef: "rollout-verdict:endpoint-suggestion:v1",
      runtimePublicationBundleRef: "runtime-publication:phase8:v1",
      releaseRecoveryDispositionRef: "release-recovery:phase8:v1",
      releaseStateVersionRef: "release-state-version:endpoint-suggestion:v1",
    },
    actor("release_manager"),
  );
  plane.killSwitches.setKillSwitchState(
    {
      killSwitchStateId: "kill-switch-state:endpoint-suggestion:inactive",
      capabilityCode: "capability:endpoint_suggestion",
      tenantId: "tenant:demo",
      environmentRing: "environment-ring:local-nonprod",
      killState: "inactive",
      reasonCode: "normal_operation",
      fallbackMode: "shadow_only",
      stateVersionRef: "kill-switch-version:endpoint-suggestion:v1",
    },
    actor("assistive_ops"),
  );
  return plane;
}

function invocationCommand(overrides: Partial<EvaluateInvocationEligibilityCommand> = {}): EvaluateInvocationEligibilityCommand {
  return {
    capabilityCode: "capability:endpoint_suggestion",
    routeFamily: "route-family:staff-workspace",
    subjectScope: "subject-scope:request-review",
    actorRef: "clinician:001",
    actorRole: "clinical_reviewer",
    actingContextRef: "acting-context:staff:001",
    tenantId: "tenant:demo",
    cohortId: "cohort:phase8-visible",
    environmentRing: "environment-ring:local-nonprod",
    evidenceClassRefs: ["evidence-class:documentation-context"],
    visibilityCeiling: "visible_insert",
    requestedActionScope: "suggest_endpoint",
    reviewVersionRef: "review-version:001",
    lineageFenceEpoch: "lineage-fence:001",
    entityContinuityKey: "entity-continuity:task:001",
    surfaceBindingRef: "assistive-surface-binding:endpoint-suggestion:v1",
    surfaceRouteContractRef: "surface-route-contract:staff-workspace:v1",
    surfacePublicationRef: "surface-publication:staff-workspace:v1",
    runtimePublicationBundleRef: "runtime-publication:phase8:v1",
    releaseRecoveryDispositionRef: "release-recovery:phase8:v1",
    telemetryDisclosureFenceRef: "telemetry-disclosure:assistive:v1",
    ticketOrTaskRef: "task:001",
    publicationState: "published",
    runtimePublicationState: "current",
    grantTtlSeconds: 300,
    ...overrides,
  };
}
