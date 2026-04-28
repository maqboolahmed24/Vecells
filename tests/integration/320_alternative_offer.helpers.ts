import {
  createIdentityAccessStore,
  type IdentityAccessDependencies,
} from "../../packages/domains/identity_access/src/index.ts";
import {
  createPhase5EnhancedAccessPolicyService,
  createPhase5EnhancedAccessPolicyStore,
} from "../../packages/domains/hub_coordination/src/phase5-enhanced-access-policy-engine.ts";
import {
  createPhase5AlternativeOfferEngineService,
  createPhase5AlternativeOfferEngineStore,
  type DeliverAlternativeOfferSessionInput,
  type OfferMutationFenceInput,
  type OpenAlternativeOfferSessionInput,
  type OpenAlternativeOfferSessionResult,
} from "../../packages/domains/hub_coordination/src/phase5-alternative-offer-engine.ts";
import { type HubOptionCapacityReservationBindingSnapshot } from "../../packages/domains/hub_coordination/src/phase5-hub-queue-engine.ts";
import {
  createBatchedCapacityImportAdapter,
  createManualCapacityBoardAdapter,
  createNativeApiFeedCapacityAdapter,
  createPartnerScheduleSyncCapacityAdapter,
  createPhase5NetworkCapacityPipelineService,
  createPhase5NetworkCapacityPipelineStore,
} from "../../packages/domains/hub_coordination/src/phase5-network-capacity-pipeline.ts";
import {
  buildOwnedHubCommand,
} from "./315_hub_case.helpers.ts";
import {
  atMinute,
  buildSnapshotCommand,
} from "./318_network_capacity.helpers.ts";
import { buildEnhancedAccessPolicyCompileInput } from "./317_enhanced_access_policy.helpers.ts";
import { setupClaimedHubCase } from "./315_hub_case.helpers.ts";

export async function setupAlternativeOfferHarness(seed = "320") {
  const hub = await setupClaimedHubCase(seed);
  const policyRepositories = createPhase5EnhancedAccessPolicyStore();
  const policyService = createPhase5EnhancedAccessPolicyService({
    repositories: policyRepositories,
    hubCaseService: hub.service,
  });
  await policyService.compileEnhancedAccessPolicy(
    buildEnhancedAccessPolicyCompileInput(seed, hub.claimed.hubCase.servingPcnId, {
      effectiveAt: atMinute(0),
    }),
  );

  const repositories = createPhase5NetworkCapacityPipelineStore();
  const capacityService = createPhase5NetworkCapacityPipelineService({
    repositories,
    hubCaseService: hub.service,
    policyService,
    adapters: [
      createNativeApiFeedCapacityAdapter(),
      createPartnerScheduleSyncCapacityAdapter(),
      createManualCapacityBoardAdapter(),
      createBatchedCapacityImportAdapter(),
    ],
  });
  const snapshotResult = await capacityService.buildCandidateSnapshotForCase({
    ...buildSnapshotCommand(seed),
    hubCoordinationCaseId: hub.claimed.hubCase.hubCoordinationCaseId,
  });

  const candidateSearching = await hub.service.beginCandidateSearch(
    buildOwnedHubCommand(hub.claimed.hubCase, seed, "begin_candidate_search", 7, {
      compiledPolicyBundleRef: snapshotResult.activePolicySet.compiledPolicy.compiledPolicyBundleRef,
      enhancedAccessPolicyRef: snapshotResult.activePolicySet.compiledPolicy.policyId,
      policyEvaluationRef: snapshotResult.policyResult.evaluation.policyEvaluationId,
      policyTupleHash: snapshotResult.activePolicySet.compiledPolicy.policyTupleHash,
    }),
  );
  const candidatesReady = await hub.service.publishCandidatesReady(
    buildOwnedHubCommand(candidateSearching.hubCase, seed, "publish_candidates_ready", 8, {
      candidateSnapshotRef: snapshotResult.snapshotId,
      crossSiteDecisionPlanRef: snapshotResult.decisionPlan?.decisionPlanId,
    }),
  );

  const identityRepositories = createIdentityAccessStore();
  const offerRepositories = createPhase5AlternativeOfferEngineStore();
  const offerService = createPhase5AlternativeOfferEngineService({
    repositories: offerRepositories,
    hubCaseService: hub.service,
    capacityRepositories: repositories,
    identityRepositories: identityRepositories as IdentityAccessDependencies,
  });

  return {
    ...hub,
    policyRepositories,
    policyService,
    repositories,
    capacityService,
    snapshotResult,
    candidateSearching,
    candidatesReady,
    identityRepositories,
    offerRepositories,
    offerService,
  };
}

export { atMinute };

export function buildOpenAlternativeOfferInput(
  harness: Awaited<ReturnType<typeof setupAlternativeOfferHarness>>,
  overrides: Partial<OpenAlternativeOfferSessionInput> = {},
): OpenAlternativeOfferSessionInput {
  const seed = harness.candidatesReady.hubCase.hubCoordinationCaseId.replace("hub_case_", "");
  return {
    hubCoordinationCaseId: harness.candidatesReady.hubCase.hubCoordinationCaseId,
    actorRef: `coordinator_${seed}`,
    routeIntentBindingRef: `route_${seed}_offer_patient_choice`,
    commandActionRecordRef: `action_${seed}_offer_patient_choice`,
    commandSettlementRecordRef: `settlement_${seed}_offer_patient_choice`,
    recordedAt: atMinute(9),
    subjectRef: `subject_${seed}`,
    sessionEpochRef: `session_epoch_${seed}_v1`,
    subjectBindingVersionRef: `identity_binding_${seed}@v3`,
    manifestVersionRef: `manifest_${seed}_v1`,
    releaseApprovalFreezeRef: `release_freeze_${seed}_v1`,
    channelReleaseFreezeState: "monitoring",
    surfaceRouteContractRef: `surface_contract_${seed}_v1`,
    surfacePublicationRef: `surface_publication_${seed}_v1`,
    runtimePublicationBundleRef: `runtime_bundle_${seed}_v1`,
    selectedAnchorRef: `anchor_${seed}`,
    selectedAnchorTupleHashRef: `anchor_tuple_${seed}`,
    transitionEnvelopeRef: `transition_envelope_${seed}`,
    experienceContinuityEvidenceRef: `continuity_${seed}_v1`,
    releaseRecoveryDispositionRef: `release_recovery_${seed}_v1`,
    visibilityEnvelopeVersionRef: `visibility_envelope_${seed}_v1`,
    routeFamilyRef: "rf_patient_appointments",
    rankDisclosurePolicyRef: "313.rank-disclosure.patient-open-choice.v1",
    tokenKeyVersionRef: "token_key_local_v1",
    expiryMinutes: 20,
    lineagedFenceEpoch: harness.candidatesReady.hubCase.ownershipEpoch,
    sourceRefs: ["tests/integration/320_alternative_offer.helpers.ts"],
    ...overrides,
  };
}

export async function openAlternativeOfferSession(
  harness: Awaited<ReturnType<typeof setupAlternativeOfferHarness>>,
  overrides: Partial<OpenAlternativeOfferSessionInput> = {},
): Promise<OpenAlternativeOfferSessionResult> {
  return harness.offerService.openAlternativeOfferSession(
    buildOpenAlternativeOfferInput(harness, overrides),
  );
}

export function buildDeliverAlternativeOfferInput(
  openResult: OpenAlternativeOfferSessionResult,
  overrides: Partial<DeliverAlternativeOfferSessionInput> = {},
): DeliverAlternativeOfferSessionInput {
  return {
    alternativeOfferSessionId: openResult.session.alternativeOfferSessionId,
    actorRef: openResult.hubTransition.hubCase.claimedBy ?? "coordinator_deliver",
    routeIntentBindingRef: `${openResult.session.routeIntentRef}_deliver`,
    commandActionRecordRef: `${openResult.session.alternativeOfferSessionId}_deliver_action`,
    commandSettlementRecordRef: `${openResult.session.alternativeOfferSessionId}_deliver_settlement`,
    recordedAt: atMinute(10),
    deliveryMode: "patient_secure_link",
    ...overrides,
  };
}

export async function openAndDeliverAlternativeOfferSession(
  harness: Awaited<ReturnType<typeof setupAlternativeOfferHarness>>,
  overrides: {
    open?: Partial<OpenAlternativeOfferSessionInput>;
    deliver?: Partial<DeliverAlternativeOfferSessionInput>;
  } = {},
) {
  const openResult = await openAlternativeOfferSession(harness, overrides.open);
  const delivered = await harness.offerService.deliverAlternativeOfferSession(
    buildDeliverAlternativeOfferInput(openResult, overrides.deliver),
  );
  return {
    openResult,
    delivered,
  };
}

export function buildMutationFence(
  session: OpenAlternativeOfferSessionResult["session"],
  truthTupleHash: string,
  overrides: Partial<OfferMutationFenceInput> = {},
): OfferMutationFenceInput {
  return {
    subjectRef: session.subjectRef,
    sessionEpochRef: session.sessionEpochRef,
    subjectBindingVersionRef: session.subjectBindingVersionRef,
    manifestVersionRef: session.manifestVersionRef,
    releaseApprovalFreezeRef: session.releaseApprovalFreezeRef,
    channelReleaseFreezeState: session.channelReleaseFreezeState,
    visibleOfferSetHash: session.visibleOfferSetHash,
    truthTupleHash,
    offerFenceEpoch: session.offerFenceEpoch,
    experienceContinuityEvidenceRef: session.experienceContinuityEvidenceRef,
    surfacePublicationRef: session.surfacePublicationRef,
    runtimePublicationBundleRef: session.runtimePublicationBundleRef,
    ...overrides,
  };
}

export function buildReservationBinding(
  session: OpenAlternativeOfferSessionResult["session"],
  candidateRef: string,
  overrides: Partial<HubOptionCapacityReservationBindingSnapshot> = {},
): HubOptionCapacityReservationBindingSnapshot {
  return {
    hubCoordinationCaseId: session.hubCoordinationCaseId,
    candidateRef,
    reservationRef: `reservation_${candidateRef}`,
    reservationState: "held",
    reservationFenceToken: `reservation_fence_${candidateRef}`,
    expiresAt: session.expiresAt,
    sourceRefs: ["tests/integration/320_alternative_offer.helpers.ts"],
    ...overrides,
  };
}
