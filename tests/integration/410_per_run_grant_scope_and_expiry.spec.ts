import { describe, expect, it } from "vitest";
import {
  createAssistiveCapabilityControlPlane,
  type AssistiveControlActorContext,
  type AssistiveControlActorRole,
  type EvaluateInvocationEligibilityCommand,
} from "../../packages/domains/assistive_control_plane/src/index.ts";

function actor(actorRole: AssistiveControlActorRole): AssistiveControlActorContext {
  return {
    actorRef: `actor:${actorRole}`,
    actorRole,
    purposeOfUse: "phase8_capability_grant_test",
    routeIntentBindingRef: "route-intent:assistive-control-plane",
    auditCorrelationId: `audit:${actorRole}`,
  };
}

describe("410 per-run grant scope and expiry", () => {
  it("downgrades visible requests to shadow-only when the release state is shadow-only", () => {
    const clock = { current: "2026-04-27T23:00:00.000Z", now: () => clock.current };
    const plane = createReadyPlane(clock, "shadow_only");
    const decision = plane.invocationEligibility.evaluateInvocationEligibility(invocationCommand({ visibilityCeiling: "visible_insert" }));
    const grant = plane.invocationGrants.issueInvocationGrant(decision, actor("capability_control_plane"));
    const settlement = plane.runSettlements.settleRun(
      {
        assistiveRunRef: "assistive-run:shadow-only",
        assistiveInvocationGrantRef: grant.assistiveInvocationGrantId,
        producedArtifactRefs: ["suggestion-envelope:shadow-only"],
        schemaValidationState: "valid",
        policyValidationState: "valid",
        transitionEnvelopeRef: "transition-envelope:shadow-only",
        uiTransitionSettlementRecordRef: "ui-transition-settlement:shadow-only",
      },
      actor("capability_control_plane"),
    );

    expect(decision.eligible).toBe(true);
    expect(grant.renderPosture).toBe("shadow_only");
    expect(grant.grantState).toBe("shadow_only");
    expect(settlement.settlementState).toBe("shadow_only");
    expect(settlement.renderableArtifactRefs).toEqual([]);
  });

  it("blocks settlement after the grant expires", () => {
    const clock = { current: "2026-04-27T23:00:00.000Z", now: () => clock.current };
    const plane = createReadyPlane(clock, "visible_insert");
    const decision = plane.invocationEligibility.evaluateInvocationEligibility(invocationCommand({ grantTtlSeconds: 30 }));
    const grant = plane.invocationGrants.issueInvocationGrant(decision, actor("capability_control_plane"));
    clock.current = "2026-04-27T23:01:00.000Z";

    const settlement = plane.runSettlements.settleRun(
      {
        assistiveRunRef: "assistive-run:expired-grant",
        assistiveInvocationGrantRef: grant.assistiveInvocationGrantId,
        producedArtifactRefs: ["suggestion-envelope:expired-grant"],
        schemaValidationState: "valid",
        policyValidationState: "valid",
        transitionEnvelopeRef: "transition-envelope:expired-grant",
        uiTransitionSettlementRecordRef: "ui-transition-settlement:expired-grant",
      },
      actor("capability_control_plane"),
    );

    expect(settlement.settlementState).toBe("blocked_by_policy");
    expect(settlement.quarantineReasonCode).toBe("invocation_grant_not_live");
    expect(settlement.blockedArtifactRefs).toEqual(["suggestion-envelope:expired-grant"]);
  });

  it("blocks settlement after explicit grant revocation", () => {
    const clock = { current: "2026-04-27T23:00:00.000Z", now: () => clock.current };
    const plane = createReadyPlane(clock, "visible_insert");
    const decision = plane.invocationEligibility.evaluateInvocationEligibility(invocationCommand());
    const grant = plane.invocationGrants.issueInvocationGrant(decision, actor("capability_control_plane"));
    plane.invocationGrants.revokeInvocationGrant(grant.assistiveInvocationGrantId, actor("assistive_ops"), "manual_safety_freeze");

    const settlement = plane.runSettlements.settleRun(
      {
        assistiveRunRef: "assistive-run:revoked-grant",
        assistiveInvocationGrantRef: grant.assistiveInvocationGrantId,
        producedArtifactRefs: ["suggestion-envelope:revoked-grant"],
        schemaValidationState: "valid",
        policyValidationState: "valid",
        transitionEnvelopeRef: "transition-envelope:revoked-grant",
        uiTransitionSettlementRecordRef: "ui-transition-settlement:revoked-grant",
      },
      actor("capability_control_plane"),
    );

    expect(settlement.settlementState).toBe("blocked_by_policy");
    expect(settlement.blockedArtifactRefs).toEqual(["suggestion-envelope:revoked-grant"]);
  });
});

function createReadyPlane(clock: { now(): string }, releaseMode: "visible_insert" | "shadow_only") {
  const plane = createAssistiveCapabilityControlPlane({ clock });
  plane.intendedUseProfiles.registerProfile(
    {
      profileId: "intended-use:endpoint-suggestion:v1",
      clinicalPurpose: "Review-only endpoint suggestion for trained staff.",
      nonClinicalPurpose: "Surface bounded evidence and abstention posture.",
      medicalPurposeState: "endpoint_suggestion_clinically_consequential_decision_support",
      permittedUserRoles: ["clinical_reviewer"],
      permittedSubjectScopes: ["subject-scope:request-review"],
      forbiddenActions: ["create_endpoint_decision", "commit_workflow_state"],
      forbiddenDownstreamConsumers: ["EndpointDecision", "AppointmentRecord", "PharmacyCase", "TaskClosure"],
      evidenceRequirement: {
        acceptedEvidenceClassRefs: ["evidence-class:documentation-context"],
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
      allowedUpstreamCapabilityCodes: ["capability:structured_fact_extraction"],
      allowedDerivedArtifactTypes: ["StructuredFactSet", "DocumentationContextSnapshot"],
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
      approvalRequirement: "single_review",
      medicalDeviceAssessmentRef: "medical-device-assessment:endpoint-suggestion:v1",
      releaseCohortRef: "release-cohort:phase8:rc1",
      killSwitchPolicyRef: "kill-switch-policy:endpoint-suggestion:v1",
    },
    actor("capability_control_plane"),
  );
  plane.releaseStates.publishReleaseState(
    {
      releaseStateId: `release-state:endpoint-suggestion:${releaseMode}`,
      capabilityCode: "capability:endpoint_suggestion",
      tenantId: "tenant:demo",
      cohortId: "cohort:phase8-visible",
      mode: releaseMode,
      effectiveFrom: "2026-04-27T22:00:00.000Z",
      compiledPolicyBundleRef: "compiled-policy-bundle:phase8:v1",
      rolloutVerdictRef: `rollout-verdict:endpoint-suggestion:${releaseMode}`,
      runtimePublicationBundleRef: "runtime-publication:phase8:v1",
      releaseRecoveryDispositionRef: "release-recovery:phase8:v1",
      releaseStateVersionRef: `release-state-version:endpoint-suggestion:${releaseMode}`,
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
