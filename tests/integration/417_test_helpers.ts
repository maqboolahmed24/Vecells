import {
  type AssistiveAssuranceActorContext,
  type AssistiveAssuranceActorRole,
  type AssessChangeImpactCommand,
  type ReleaseApprovalSignoff,
} from "../../packages/domains/assistive_assurance/src/index.ts";

export const fixedAssuranceClock = { now: () => "2026-04-28T03:30:00.000Z" };

export function assuranceActor(
  actorRole: AssistiveAssuranceActorRole,
  actorRef = `actor:${actorRole}`,
): AssistiveAssuranceActorContext {
  return {
    actorRef,
    actorRole,
    purposeOfUse: "phase8_assurance_test",
    routeIntentBindingRef: "route-intent:assistive-assurance",
    auditCorrelationId: `audit:${actorRole}`,
  };
}

export function materialChangeCommand(
  overrides?: Partial<AssessChangeImpactCommand>,
): AssessChangeImpactCommand {
  return {
    changeRequestId: "model-change-request:doc-draft-v2",
    capabilityCode: "documentation.note_draft",
    releaseCandidateRef: "assistive-release-candidate:doc-draft-v2",
    releaseCandidateHash: "candidate-hash:doc-draft-v2",
    changeClass: "capability_expansion",
    currentVersionRef: "assistive-capability:doc-draft:v1",
    proposedVersionRef: "assistive-capability:doc-draft:v2",
    requestedBy: "user:requester",
    surfaceDeltaRefs: ["surface-delta:rail-visible"],
    surfacePublicationDeltaRefs: ["surface-publication-delta:staff-workspace"],
    rolloutLadderDelta: true,
    rolloutSliceDeltaRefs: ["rollout-slice-delta:8.3"],
    workflowDecisionDelta: true,
    artifactDeliveryDelta: true,
    uiTelemetryDisclosureDelta: true,
    intendedUseDelta: false,
    patientFacingWordingDelta: false,
    medicalPurposeBoundaryState: "endpoint_suggestion_clinically_consequential_decision_support",
    candidateHashStable: true,
    ...overrides,
  };
}

export function completeSignoffs(): ReleaseApprovalSignoff[] {
  return [
    {
      role: "product_owner",
      actorRef: "user:product-owner",
      evidenceRef: "signoff:product",
      signedAt: fixedAssuranceClock.now(),
    },
    {
      role: "deployment_approver",
      actorRef: "user:deployment",
      evidenceRef: "signoff:deployment",
      signedAt: fixedAssuranceClock.now(),
    },
    {
      role: "independent_safety_reviewer",
      actorRef: "user:independent-safety",
      evidenceRef: "signoff:independent-safety",
      signedAt: fixedAssuranceClock.now(),
    },
    {
      role: "clinical_safety_officer",
      actorRef: "user:cso",
      evidenceRef: "signoff:cso",
      signedAt: fixedAssuranceClock.now(),
    },
    {
      role: "information_governance_lead",
      actorRef: "user:ig",
      evidenceRef: "signoff:ig",
      signedAt: fixedAssuranceClock.now(),
    },
    {
      role: "regulatory_owner",
      actorRef: "user:regulatory",
      evidenceRef: "signoff:regulatory",
      signedAt: fixedAssuranceClock.now(),
    },
    {
      role: "rollback_owner",
      actorRef: "user:rollback",
      evidenceRef: "signoff:rollback",
      signedAt: fixedAssuranceClock.now(),
    },
  ];
}
