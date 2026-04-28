import { describe, expect, it } from "vitest";
import {
  createAssistiveCapabilityControlPlane,
  type AssistiveControlActorContext,
  type AssistiveControlActorRole,
  type EvaluateInvocationEligibilityCommand,
} from "../../packages/domains/assistive_control_plane/src/index.ts";

const fixedClock = { now: () => "2026-04-27T22:00:00.000Z" };

function actor(actorRole: AssistiveControlActorRole): AssistiveControlActorContext {
  return {
    actorRef: `actor:${actorRole}`,
    actorRole,
    purposeOfUse: "phase8_capability_settlement_test",
    routeIntentBindingRef: "route-intent:assistive-control-plane",
    auditCorrelationId: `audit:${actorRole}`,
  };
}

describe("410 kill switch, release state, and run settlement", () => {
  it("settles a valid visible run as renderable and binds policy and publication refs from the grant", () => {
    const plane = createReadyPlane();
    const grant = issueGrant(plane);
    const settlement = plane.runSettlements.settleRun(
      {
        assistiveRunRef: "assistive-run:endpoint-suggestion:001",
        assistiveInvocationGrantRef: grant.assistiveInvocationGrantId,
        producedArtifactRefs: ["suggestion-envelope:001"],
        schemaValidationState: "valid",
        policyValidationState: "valid",
        transitionEnvelopeRef: "transition-envelope:assistive-run:001",
        uiTransitionSettlementRecordRef: "ui-transition-settlement:assistive-run:001",
        assistiveCapabilityTrustEnvelopeRef: "assistive-trust-envelope:001",
      },
      actor("capability_control_plane"),
    );

    expect(settlement.settlementState).toBe("renderable");
    expect(settlement.renderableArtifactRefs).toEqual(["suggestion-envelope:001"]);
    expect(settlement.blockedArtifactRefs).toEqual([]);
    expect(settlement.policyBundleRef).toBe("compiled-policy-bundle:phase8:v1");
    expect(settlement.surfacePublicationRef).toBe("surface-publication:staff-workspace:v1");
  });

  it("blocks invocation when the current materialized kill-switch state is active", () => {
    const plane = createReadyPlane();
    plane.killSwitches.setKillSwitchState(
      {
        killSwitchStateId: "kill-switch-state:endpoint-suggestion:block",
        capabilityCode: "capability:endpoint_suggestion",
        tenantId: "tenant:demo",
        environmentRing: "environment-ring:local-nonprod",
        killState: "blocked",
        reasonCode: "safety_threshold_breach",
        fallbackMode: "blocked",
        stateVersionRef: "kill-switch-version:endpoint-suggestion:block",
      },
      actor("assistive_ops"),
    );

    const decision = plane.invocationEligibility.evaluateInvocationEligibility(invocationCommand());

    expect(decision.eligible).toBe(false);
    expect(decision.reasonCodes).toContain("assistive_kill_switch_active");
    expect(() => plane.invocationGrants.issueInvocationGrant(decision, actor("capability_control_plane"))).toThrow(/eligible decision/i);
  });

  it("quarantines schema-invalid output and partitions produced artifacts into blocked refs", () => {
    const plane = createReadyPlane();
    const grant = issueGrant(plane);
    const settlement = plane.runSettlements.settleRun(
      {
        assistiveRunRef: "assistive-run:endpoint-suggestion:bad-schema",
        assistiveInvocationGrantRef: grant.assistiveInvocationGrantId,
        producedArtifactRefs: ["suggestion-envelope:bad-schema"],
        schemaValidationState: "invalid",
        policyValidationState: "valid",
        transitionEnvelopeRef: "transition-envelope:assistive-run:bad-schema",
        uiTransitionSettlementRecordRef: "ui-transition-settlement:assistive-run:bad-schema",
      },
      actor("capability_control_plane"),
    );

    expect(settlement.settlementState).toBe("quarantined");
    expect(settlement.quarantineReasonCode).toBe("schema_validation_failed");
    expect(settlement.renderableArtifactRefs).toEqual([]);
    expect(settlement.blockedArtifactRefs).toEqual(["suggestion-envelope:bad-schema"]);
  });
});

function issueGrant(plane: ReturnType<typeof createReadyPlane>) {
  const decision = plane.invocationEligibility.evaluateInvocationEligibility(invocationCommand());
  return plane.invocationGrants.issueInvocationGrant(decision, actor("capability_control_plane"));
}

function createReadyPlane() {
  const plane = createAssistiveCapabilityControlPlane({ clock: fixedClock });
  seedControlPlane(plane);
  return plane;
}

function seedControlPlane(plane: ReturnType<typeof createAssistiveCapabilityControlPlane>) {
  plane.intendedUseProfiles.registerProfile(profileCommand(), actor("clinical_safety_lead"));
  plane.compositionPolicies.registerPolicy(compositionCommand(), actor("clinical_safety_lead"));
  plane.manifests.registerManifest(manifestCommand(), actor("capability_control_plane"));
  plane.releaseStates.publishReleaseState(releaseCommand("visible_insert"), actor("release_manager"));
  plane.killSwitches.setKillSwitchState(killSwitchCommand("inactive"), actor("assistive_ops"));
}

function profileCommand() {
  return {
    profileId: "intended-use:endpoint-suggestion:v1",
    clinicalPurpose: "Review-only endpoint suggestion for trained staff.",
    nonClinicalPurpose: "Surface bounded evidence and abstention posture.",
    medicalPurposeState: "endpoint_suggestion_clinically_consequential_decision_support" as const,
    permittedUserRoles: ["clinical_reviewer"],
    permittedSubjectScopes: ["subject-scope:request-review"],
    forbiddenActions: ["create_endpoint_decision", "commit_workflow_state"],
    forbiddenDownstreamConsumers: ["EndpointDecision", "AppointmentRecord", "PharmacyCase", "TaskClosure"],
    evidenceRequirement: {
      acceptedEvidenceClassRefs: ["evidence-class:documentation-context"],
      minimumEvidenceClassCount: 1,
    },
    humanReviewRequirement: "single_review" as const,
  };
}

function compositionCommand() {
  return {
    compositionPolicyId: "composition-policy:endpoint-suggestion:v1",
    capabilityCode: "capability:endpoint_suggestion",
    allowedUpstreamCapabilityCodes: ["capability:structured_fact_extraction"],
    allowedDerivedArtifactTypes: ["StructuredFactSet", "DocumentationContextSnapshot"],
    blockedDownstreamObjectTypes: ["EndpointDecision", "AppointmentRecord", "PharmacyCase", "TaskClosure"],
    maxChainDepth: 2,
    loopDetectionMode: "block" as const,
  };
}

function manifestCommand() {
  return {
    manifestId: "manifest:endpoint-suggestion:v1",
    capabilityCode: "capability:endpoint_suggestion",
    capabilityFamily: "endpoint_suggestion" as const,
    intendedUseProfileRef: "intended-use:endpoint-suggestion:v1",
    allowedContexts: ["route-family:staff-workspace"],
    allowedInputs: ["evidence-class:documentation-context"],
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
    approvalRequirement: "single_review" as const,
    medicalDeviceAssessmentRef: "medical-device-assessment:endpoint-suggestion:v1",
    releaseCohortRef: "release-cohort:phase8:rc1",
    killSwitchPolicyRef: "kill-switch-policy:endpoint-suggestion:v1",
  };
}

function releaseCommand(mode: "visible_insert" | "shadow_only" | "observe_only") {
  return {
    releaseStateId: `release-state:endpoint-suggestion:${mode}`,
    capabilityCode: "capability:endpoint_suggestion",
    tenantId: "tenant:demo",
    cohortId: "cohort:phase8-visible",
    mode,
    effectiveFrom: "2026-04-27T21:00:00.000Z",
    compiledPolicyBundleRef: "compiled-policy-bundle:phase8:v1",
    rolloutVerdictRef: `rollout-verdict:endpoint-suggestion:${mode}`,
    runtimePublicationBundleRef: "runtime-publication:phase8:v1",
    releaseRecoveryDispositionRef: "release-recovery:phase8:v1",
    releaseStateVersionRef: `release-state-version:endpoint-suggestion:${mode}`,
  };
}

function killSwitchCommand(killState: "inactive" | "blocked") {
  return {
    killSwitchStateId: `kill-switch-state:endpoint-suggestion:${killState}`,
    capabilityCode: "capability:endpoint_suggestion",
    tenantId: "tenant:demo",
    environmentRing: "environment-ring:local-nonprod",
    killState,
    reasonCode: killState === "inactive" ? "normal_operation" : "safety_threshold_breach",
    fallbackMode: killState === "inactive" ? ("shadow_only" as const) : ("blocked" as const),
    stateVersionRef: `kill-switch-version:endpoint-suggestion:${killState}`,
  };
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
    ...overrides,
  };
}
