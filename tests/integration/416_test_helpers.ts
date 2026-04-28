import {
  type AssistiveFreezeActorContext,
  type AssistiveFreezeActorRole,
  type OpenFreezeRecordCommand,
} from "../../packages/domains/assistive_freeze/src/index.ts";

export const fixedClock = { now: () => "2026-04-28T02:15:00.000Z" };

export function actor(
  actorRole: AssistiveFreezeActorRole,
  purposeOfUse = "phase8_freeze_test",
): AssistiveFreezeActorContext {
  return {
    actorRef: `actor:${actorRole}`,
    actorRole,
    purposeOfUse,
    routeIntentBindingRef: "route-intent:assistive-freeze",
    auditCorrelationId: `audit:${actorRole}`,
  };
}

export function freezeCommand(
  overrides?: Partial<OpenFreezeRecordCommand>,
): OpenFreezeRecordCommand {
  return {
    capabilityCode: "documentation.note_draft",
    releaseCandidateRef: "assistive-release-candidate:rc1",
    rolloutSliceContractRef: "rollout-slice:staff-pilot-a",
    rolloutVerdictRef: "rollout-verdict:staff-pilot-a",
    routeFamilyRef: "clinical-workspace",
    audienceTier: "staff",
    releaseCohortRef: "release-cohort:staff-pilot-a",
    watchTupleHash: "watch-tuple-hash:doc:v1",
    policyBundleRef: "compiled-policy-bundle:phase8:v1",
    surfaceRouteContractRef: "surface-route-contract:clinical-workspace:v1",
    surfacePublicationRef: "surface-publication:clinical-workspace:v1",
    runtimePublicationBundleRef: "runtime-publication:phase8:v1",
    releaseRecoveryDispositionRef: "release-recovery:assistive:v1",
    rolloutRungAtFreeze: "visible_insert",
    triggerType: "trust_quarantined",
    triggerRef: "trust-projection:quarantined:v1",
    ...overrides,
  };
}
