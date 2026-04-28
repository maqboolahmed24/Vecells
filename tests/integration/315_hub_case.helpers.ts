import {
  createPhase5HubCaseKernelService,
  createPhase5HubCaseKernelStore,
  type CreateHubCoordinationCaseInput,
  type CreateNetworkBookingRequestInput,
  type HubCaseTransitionCommandInput,
  type HubCoordinationCaseSnapshot,
  type HubCaseTransitionResult,
  type NetworkBookingRequestCreationResult,
} from "../../packages/domains/hub_coordination/src/phase5-hub-case-kernel.ts";

const BASE_TIME = Date.parse("2026-04-23T10:00:00.000Z");

function atMinute(minuteOffset: number): string {
  return new Date(BASE_TIME + minuteOffset * 60_000).toISOString();
}

export function buildPhase4FallbackRequestCommand(
  seed = "315",
  overrides: Partial<Omit<CreateNetworkBookingRequestInput, "creationMode">> = {},
): Omit<CreateNetworkBookingRequestInput, "creationMode"> {
  return {
    networkBookingRequestId: `network_request_${seed}`,
    episodeRef: `episode_${seed}`,
    requestLineageRef: `request_lineage_${seed}`,
    originLineageCaseLinkRef: `booking_lineage_${seed}`,
    originBookingCaseId: `booking_case_${seed}`,
    originRequestId: `request_${seed}`,
    originPracticeOds: `ODS_${seed}`,
    patientRef: `patient_${seed}`,
    priorityBand: "priority",
    clinicalTimeframe: {
      windowClass: "within_required_window",
      dueAt: atMinute(30),
      latestSafeOfferAt: atMinute(20),
      urgencyCarryFloor: 0.6,
    },
    modalityPreference: {
      preferredModes: ["in_person", "telephone"],
      allowsInPerson: true,
      allowsRemote: true,
    },
    clinicianType: "general_practice",
    continuityPreference: {
      continuityMode: "same_site_preferred",
      preferredSiteRefs: [`site_${seed}`],
    },
    accessNeeds: {
      needsSummary: "Step-free access and hearing loop.",
      accessibilityRequirementRefs: [`access_${seed}`],
      communicationSupportRefs: [`comm_${seed}`],
    },
    travelConstraints: {
      travelMode: "public_transport",
      maxTravelMinutes: 45,
      locationConstraintRefs: [`geo_${seed}`],
    },
    reasonForHubRouting: "no_local_capacity",
    requestedAt: atMinute(0),
    actorRef: `actor_${seed}`,
    commandActionRecordRef: `request_action_${seed}`,
    commandSettlementRecordRef: `request_settlement_${seed}`,
    sourceBookingBranchState: "active",
    idempotencyKey: `request_idempotency_${seed}`,
    ...overrides,
  };
}

export function buildCreateHubCaseCommand(
  seed: string,
  networkBookingRequestId: string,
  overrides: Partial<CreateHubCoordinationCaseInput> = {},
): CreateHubCoordinationCaseInput {
  return {
    networkBookingRequestId,
    hubCoordinationCaseId: `hub_case_${seed}`,
    servingPcnId: `pcn_${seed}`,
    actorRef: `actor_${seed}`,
    routeIntentBindingRef: `route_${seed}_create_case`,
    commandActionRecordRef: `create_case_action_${seed}`,
    commandSettlementRecordRef: `create_case_settlement_${seed}`,
    createdAt: atMinute(1),
    expectedCoordinationMinutes: 25,
    sourceBookingBranchState: "active",
    ...overrides,
  };
}

export function buildHubCommand(
  hubCoordinationCaseId: string,
  seed: string,
  step: string,
  minuteOffset: number,
  overrides: Partial<HubCaseTransitionCommandInput> = {},
): HubCaseTransitionCommandInput {
  return {
    hubCoordinationCaseId,
    actorRef: `actor_${seed}`,
    routeIntentBindingRef: `route_${seed}_${step}`,
    commandActionRecordRef: `action_${seed}_${step}`,
    commandSettlementRecordRef: `settlement_${seed}_${step}`,
    recordedAt: atMinute(minuteOffset),
    reasonCode: step,
    sourceBookingBranchState: "active",
    leaseFreshness: "active",
    ...overrides,
  };
}

export function buildOwnedHubCommand(
  hubCase: HubCoordinationCaseSnapshot,
  seed: string,
  step: string,
  minuteOffset: number,
  overrides: Partial<HubCaseTransitionCommandInput> = {},
): HubCaseTransitionCommandInput {
  return buildHubCommand(hubCase.hubCoordinationCaseId, seed, step, minuteOffset, {
    expectedOwnershipEpoch: hubCase.ownershipEpoch,
    expectedOwnershipFenceToken: hubCase.ownershipFenceToken,
    ...overrides,
  });
}

export async function setupClaimedHubCase(seed = "315") {
  const store = createPhase5HubCaseKernelStore();
  const service = createPhase5HubCaseKernelService({ repositories: store });

  const request = await service.createNetworkBookingRequestFromPhase4Fallback(
    buildPhase4FallbackRequestCommand(seed),
  );
  const created = await service.createHubCoordinationCaseFromNetworkRequest(
    buildCreateHubCaseCommand(seed, request.networkBookingRequest.networkBookingRequestId),
  );
  const validated = await service.validateIntake(
    buildHubCommand(created.hubCase.hubCoordinationCaseId, seed, "validate_intake", 2),
  );
  const queued = await service.queueHubCase(
    buildHubCommand(created.hubCase.hubCoordinationCaseId, seed, "queue_case", 3),
  );
  const claimed = await service.claimHubCase(
    buildHubCommand(queued.hubCase.hubCoordinationCaseId, seed, "claim_case", 4, {
      expectedOwnershipEpoch: queued.hubCase.ownershipEpoch,
      claimedBy: `coordinator_${seed}`,
      actingOrg: {
        organisationRef: `hub_org_${seed}`,
        organisationKind: "hub",
        siteRef: `hub_site_${seed}`,
      },
      ownershipLeaseRef: `lease_${seed}`,
      newOwnershipFenceToken: `fence_${seed}_1`,
    }),
  );

  return {
    store,
    service,
    request,
    created,
    validated,
    queued,
    claimed,
  };
}

export async function progressClaimedHubCaseToBookedViaService(
  service: ReturnType<typeof createPhase5HubCaseKernelService>,
  claimed: HubCaseTransitionResult,
  seed: string,
) {
  const candidateSearching = await service.beginCandidateSearch(
    buildOwnedHubCommand(claimed.hubCase, seed, "begin_candidate_search", 5, {
      compiledPolicyBundleRef: `policy_bundle_${seed}`,
      enhancedAccessPolicyRef: `enhanced_access_policy_${seed}`,
      policyEvaluationRef: `policy_evaluation_${seed}`,
      policyTupleHash: `policy_tuple_${seed}`,
    }),
  );
  const candidatesReady = await service.publishCandidatesReady(
    buildOwnedHubCommand(candidateSearching.hubCase, seed, "publish_candidates_ready", 6, {
      candidateSnapshotRef: `candidate_snapshot_${seed}`,
      crossSiteDecisionPlanRef: `cross_site_plan_${seed}`,
    }),
  );
  const selecting = await service.enterCoordinatorSelecting(
    buildOwnedHubCommand(candidatesReady.hubCase, seed, "enter_coordinator_selecting", 7, {
      selectedCandidateRef: `candidate_${seed}`,
    }),
  );
  const revalidating = await service.enterCandidateRevalidating(
    buildOwnedHubCommand(selecting.hubCase, seed, "enter_candidate_revalidating", 8, {
      selectedCandidateRef: `candidate_${seed}`,
    }),
  );
  const nativePending = await service.enterNativeBookingPending(
    buildOwnedHubCommand(revalidating.hubCase, seed, "enter_native_booking_pending", 9, {
      bookingEvidenceRef: `commit_attempt_${seed}`,
    }),
  );
  const confirmationPending = await service.markConfirmationPending(
    buildOwnedHubCommand(
      nativePending.hubCase,
      seed,
      "mark_confirmation_pending",
      10,
      {},
    ),
  );
  const bookedPendingAck = await service.markBookedPendingPracticeAcknowledgement(
    buildOwnedHubCommand(
      confirmationPending.hubCase,
      seed,
      "mark_booked_pending_ack",
      11,
      {
        networkAppointmentRef: `network_appointment_${seed}`,
        offerToConfirmationTruthRef: `truth_projection_${seed}`,
        practiceAckGeneration: 1,
        practiceAckDueAt: atMinute(40),
      },
    ),
  );
  const booked = await service.markBooked(
    buildOwnedHubCommand(bookedPendingAck.hubCase, seed, "mark_booked", 12),
  );

  return {
    candidateSearching,
    candidatesReady,
    selecting,
    revalidating,
    nativePending,
    confirmationPending,
    bookedPendingAck,
    booked,
  };
}

export async function releaseAndCloseBookedCase(
  service: ReturnType<typeof createPhase5HubCaseKernelService>,
  booked: HubCaseTransitionResult,
  seed: string,
) {
  const released = await service.releaseHubCase(
    buildOwnedHubCommand(booked.hubCase, seed, "release_case", 13),
  );
  const closed = await service.closeHubCase(
    buildHubCommand(released.hubCase.hubCoordinationCaseId, seed, "close_case", 14, {
      expectedOwnershipEpoch: released.hubCase.ownershipEpoch,
      closeDecisionRef: `close_decision_${seed}`,
    }),
  );

  return {
    released,
    closed,
  };
}

export async function createFallbackCallbackPath(seed = "315_callback") {
  const { service, claimed } = await setupClaimedHubCase(seed);
  const candidateSearching = await service.beginCandidateSearch(
    buildOwnedHubCommand(claimed.hubCase, seed, "begin_candidate_search", 5, {
      compiledPolicyBundleRef: `policy_bundle_${seed}`,
      enhancedAccessPolicyRef: `enhanced_access_policy_${seed}`,
      policyEvaluationRef: `policy_evaluation_${seed}`,
      policyTupleHash: `policy_tuple_${seed}`,
    }),
  );
  const ready = await service.publishCandidatesReady(
    buildOwnedHubCommand(candidateSearching.hubCase, seed, "publish_candidates_ready", 6, {
      candidateSnapshotRef: `candidate_snapshot_${seed}`,
      crossSiteDecisionPlanRef: `cross_site_plan_${seed}`,
    }),
  );
  const callbackPending = await service.markCallbackTransferPending(
    buildOwnedHubCommand(ready.hubCase, seed, "mark_callback_pending", 7, {
      activeFallbackRef: `fallback_${seed}`,
    }),
  );
  const callbackOffered = await service.markCallbackOffered(
    buildOwnedHubCommand(callbackPending.hubCase, seed, "mark_callback_offered", 8, {
      callbackExpectationRef: `callback_expectation_${seed}`,
    }),
  );
  const released = await service.releaseHubCase(
    buildOwnedHubCommand(callbackOffered.hubCase, seed, "release_case", 9),
  );
  const closed = await service.closeHubCase(
    buildHubCommand(released.hubCase.hubCoordinationCaseId, seed, "close_case", 10, {
      expectedOwnershipEpoch: released.hubCase.ownershipEpoch,
      closeDecisionRef: `close_decision_${seed}`,
    }),
  );

  return {
    service,
    claimed,
    candidateSearching,
    ready,
    callbackPending,
    callbackOffered,
    released,
    closed,
  };
}

export type HubTestService = ReturnType<typeof createPhase5HubCaseKernelService>;
export type HubBookedPath = Awaited<
  ReturnType<typeof progressClaimedHubCaseToBookedViaService>
>;
export type HubClaimedSetup = Awaited<ReturnType<typeof setupClaimedHubCase>>;
export type HubRequestResult = NetworkBookingRequestCreationResult;
