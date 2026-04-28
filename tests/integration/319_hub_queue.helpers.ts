import {
  createPhase5EnhancedAccessPolicyService,
  createPhase5EnhancedAccessPolicyStore,
  createPhase5HubQueueEngineService,
  createPhase5HubQueueEngineStore,
  createPhase5HubCaseKernelService,
  createPhase5HubCaseKernelStore,
  createPhase5NetworkCapacityPipelineService,
  createPhase5NetworkCapacityPipelineStore,
  type HubCaseTransitionResult,
  type HubQueueCaseBindingInput,
  type HubOptionCapacityReservationBindingSnapshot,
  type HubQueueDominantAction,
  type HubQueuePublishResult,
  type HubQueueTimerSnapshot,
  type NetworkBookingPriorityBand,
  type NetworkSlotCandidateSnapshot,
} from "../../packages/domains/hub_coordination/src/index.ts";
import {
  buildCreateHubCaseCommand,
  buildHubCommand,
  buildOwnedHubCommand,
  buildPhase4FallbackRequestCommand,
} from "./315_hub_case.helpers.ts";
import { buildEnhancedAccessPolicyCompileInput } from "./317_enhanced_access_policy.helpers.ts";
import {
  buildBinding,
  buildCapacityRow,
  buildDefaultBindings,
  buildSnapshotCommand,
} from "./318_network_capacity.helpers.ts";

const BASE_TIME = Date.parse("2026-04-24T09:00:00.000Z");

export function atMinute(minuteOffset: number): string {
  return new Date(BASE_TIME + minuteOffset * 60_000).toISOString();
}

export interface HubQueueHarness {
  seed: string;
  pcnRef: string;
  activePolicyTupleHash: string;
  hubStore: ReturnType<typeof createPhase5HubCaseKernelStore>;
  hubService: ReturnType<typeof createPhase5HubCaseKernelService>;
  policyStore: ReturnType<typeof createPhase5EnhancedAccessPolicyStore>;
  policyService: ReturnType<typeof createPhase5EnhancedAccessPolicyService>;
  capacityStore: ReturnType<typeof createPhase5NetworkCapacityPipelineStore>;
  capacityService: ReturnType<typeof createPhase5NetworkCapacityPipelineService>;
  queueStore: ReturnType<typeof createPhase5HubQueueEngineStore>;
  queueService: ReturnType<typeof createPhase5HubQueueEngineService>;
}

export interface QueueCaseSetup {
  name: string;
  request: Awaited<
    ReturnType<ReturnType<typeof createPhase5HubCaseKernelService>["createNetworkBookingRequestFromPhase4Fallback"]>
  >;
  created: HubCaseTransitionResult;
  validated: HubCaseTransitionResult;
  queued: HubCaseTransitionResult;
  claimed: HubCaseTransitionResult;
  candidateSearching: HubCaseTransitionResult | null;
  candidatesReady: HubCaseTransitionResult | null;
  selecting: HubCaseTransitionResult | null;
  alternativesOffered: HubCaseTransitionResult | null;
  patientChoicePending: HubCaseTransitionResult | null;
  callbackTransferPending: HubCaseTransitionResult | null;
  staleOwnerRecovery: HubCaseTransitionResult | null;
  bookedPendingAck: HubCaseTransitionResult | null;
  snapshotResult: Awaited<
    ReturnType<ReturnType<typeof createPhase5NetworkCapacityPipelineService>["buildCandidateSnapshotForCase"]>
  > | null;
  current: HubCaseTransitionResult;
}

export interface CreateHubQueueCaseInput {
  name: string;
  priorityBand?: NetworkBookingPriorityBand;
  dueMinute: number;
  latestSafeOfferMinute?: number | null;
  originPracticeOds?: string;
  expectedCoordinationMinutes?: number;
  state?:
    | "candidate_searching"
    | "candidates_ready"
    | "coordinator_selecting"
    | "alternatives_offered"
    | "patient_choice_pending"
    | "callback_transfer_pending"
    | "stale_owner_recovery"
    | "booked_pending_practice_ack";
  snapshotBindings?: ReturnType<typeof buildDefaultBindings>;
  snapshotMinute?: number;
  policyTupleHashOverride?: string | null;
  practiceAckDueMinute?: number;
  patientChoiceExpiresAt?: string | null;
  callbackTransferBlocked?: boolean;
  dominantAction?: HubQueueDominantAction | null;
  reservationBindings?: readonly HubOptionCapacityReservationBindingSnapshot[];
  localFailureScore?: number;
}

export async function setupHubQueueHarness(seed = "319") {
  const hubStore = createPhase5HubCaseKernelStore();
  const hubService = createPhase5HubCaseKernelService({ repositories: hubStore });
  const policyStore = createPhase5EnhancedAccessPolicyStore();
  const policyService = createPhase5EnhancedAccessPolicyService({
    repositories: policyStore,
    hubCaseService: hubService,
  });
  const pcnRef = `pcn_${seed}`;
  const compileInput = buildEnhancedAccessPolicyCompileInput(seed, pcnRef, {
      effectiveAt: atMinute(0),
    });
  const { policyTupleHash: activePolicyTupleHash } =
    policyService.policyTupleHashFromCompileInput(compileInput);
  await policyService.compileEnhancedAccessPolicy(compileInput);
  const capacityStore = createPhase5NetworkCapacityPipelineStore();
  const capacityService = createPhase5NetworkCapacityPipelineService({
    repositories: capacityStore,
    hubCaseService: hubService,
    policyService,
  });
  const queueStore = createPhase5HubQueueEngineStore();
  const queueService = createPhase5HubQueueEngineService({
    repositories: queueStore,
    hubCaseService: hubService,
    capacityRepositories: capacityStore,
  });

  return {
    seed,
    pcnRef,
    activePolicyTupleHash,
    hubStore,
    hubService,
    policyStore,
    policyService,
    capacityStore,
    capacityService,
    queueStore,
    queueService,
  } satisfies HubQueueHarness;
}

function seedLabel(harness: HubQueueHarness, name: string): string {
  return `${harness.seed}_${name}`;
}

export function buildNoTrustedSupplyBindings(seed: string) {
  return [
    buildBinding(seed, "partner_schedule_sync", "degraded", [
      buildCapacityRow(seed, "degraded_only_a", 30, 60, {
        travelMinutes: 20,
        accessibilityFitScore: 0.7,
      }),
    ]),
    buildBinding(seed, "batched_capacity_import", "quarantined", [
      buildCapacityRow(seed, "degraded_only_b", 35, 65, {
        travelMinutes: 15,
        accessibilityFitScore: 0.6,
      }),
    ]),
  ] as const;
}

export function buildReservationBinding(
  caseId: string,
  candidate: NetworkSlotCandidateSnapshot,
  suffix: string,
): HubOptionCapacityReservationBindingSnapshot {
  return {
    hubCoordinationCaseId: caseId,
    candidateRef: candidate.candidateId,
    reservationRef: `reservation_${suffix}`,
    reservationState: "held",
    reservationFenceToken: `reservation_fence_${suffix}`,
    expiresAt: addMinutesIso(candidate.startAt, -10),
    sourceRefs: ["fixture:reservation_binding"],
  };
}

function addMinutesIso(timestamp: string, minutes: number): string {
  return new Date(Date.parse(timestamp) + minutes * 60_000).toISOString();
}

export async function createHubQueueCase(
  harness: HubQueueHarness,
  input: CreateHubQueueCaseInput,
): Promise<QueueCaseSetup> {
  const name = seedLabel(harness, input.name);
  const request = await harness.hubService.createNetworkBookingRequestFromPhase4Fallback(
    buildPhase4FallbackRequestCommand(name, {
      originPracticeOds: input.originPracticeOds ?? `ODS_${input.name}`,
      priorityBand: input.priorityBand ?? "priority",
      requestedAt: atMinute(1),
      clinicalTimeframe: {
        windowClass: "within_required_window",
        dueAt: atMinute(input.dueMinute),
        latestSafeOfferAt:
          input.latestSafeOfferMinute === null
            ? null
            : atMinute(input.latestSafeOfferMinute ?? input.dueMinute - 10),
        urgencyCarryFloor: input.priorityBand === "urgent" ? 0.8 : 0.4,
      },
    }),
  );
  const created = await harness.hubService.createHubCoordinationCaseFromNetworkRequest(
    buildCreateHubCaseCommand(name, request.networkBookingRequest.networkBookingRequestId, {
      servingPcnId: harness.pcnRef,
      createdAt: atMinute(2),
      expectedCoordinationMinutes: input.expectedCoordinationMinutes ?? 20,
    }),
  );
  const validated = await harness.hubService.validateIntake(
    buildHubCommand(created.hubCase.hubCoordinationCaseId, name, "validate_intake", 3),
  );
  const queued = await harness.hubService.queueHubCase(
    buildHubCommand(created.hubCase.hubCoordinationCaseId, name, "queue_case", 4),
  );
  const claimed = await harness.hubService.claimHubCase(
    buildHubCommand(queued.hubCase.hubCoordinationCaseId, name, "claim_case", 5, {
      expectedOwnershipEpoch: queued.hubCase.ownershipEpoch,
      claimedBy: `coordinator_${name}`,
      actingOrg: {
        organisationRef: `hub_org_${name}`,
        organisationKind: "hub",
        siteRef: `hub_site_${name}`,
      },
      ownershipLeaseRef: `lease_${name}`,
      newOwnershipFenceToken: `fence_${name}`,
    }),
  );

  let current = claimed;
  let candidateSearching: HubCaseTransitionResult | null = null;
  let candidatesReady: HubCaseTransitionResult | null = null;
  let selecting: HubCaseTransitionResult | null = null;
  let alternativesOffered: HubCaseTransitionResult | null = null;
  let patientChoicePending: HubCaseTransitionResult | null = null;
  let callbackTransferPending: HubCaseTransitionResult | null = null;
  let staleOwnerRecovery: HubCaseTransitionResult | null = null;
  let bookedPendingAck: HubCaseTransitionResult | null = null;
  let snapshotResult: Awaited<
    ReturnType<ReturnType<typeof createPhase5NetworkCapacityPipelineService>["buildCandidateSnapshotForCase"]>
  > | null = null;

  if (input.state === "stale_owner_recovery") {
    staleOwnerRecovery = await harness.hubService.markStaleOwnerRecoveryPending(
      buildOwnedHubCommand(claimed.hubCase, name, "stale_owner_recovery", 6, {
        activeOwnershipTransitionRef: `ownership_transition_${name}`,
      }),
    );
    current = staleOwnerRecovery;
    return {
      name: input.name,
      request,
      created,
      validated,
      queued,
      claimed,
      candidateSearching,
      candidatesReady,
      selecting,
      alternativesOffered,
      patientChoicePending,
      callbackTransferPending,
      staleOwnerRecovery,
      bookedPendingAck,
      snapshotResult,
      current,
    };
  }

  candidateSearching = await harness.hubService.beginCandidateSearch(
    buildOwnedHubCommand(claimed.hubCase, name, "begin_candidate_search", 6, {
      compiledPolicyBundleRef: `compiled_bundle_${harness.seed}`,
      enhancedAccessPolicyRef: `enhanced_access_policy_${harness.seed}`,
      policyEvaluationRef: `policy_evaluation_${name}`,
      policyTupleHash: input.policyTupleHashOverride ?? harness.activePolicyTupleHash,
    }),
  );
  current = candidateSearching;

  if (input.state === "candidate_searching") {
    return {
      name: input.name,
      request,
      created,
      validated,
      queued,
      claimed,
      candidateSearching,
      candidatesReady,
      selecting,
      alternativesOffered,
      patientChoicePending,
      callbackTransferPending,
      staleOwnerRecovery,
      bookedPendingAck,
      snapshotResult,
      current,
    };
  }

  snapshotResult = await harness.capacityService.buildCandidateSnapshotForCase({
    ...buildSnapshotCommand(name, {
      evaluatedAt: atMinute(input.snapshotMinute ?? 7),
      hubCoordinationCaseId: candidateSearching.hubCase.hubCoordinationCaseId,
      adapterBindings: input.snapshotBindings ?? buildDefaultBindings(name),
    }),
    hubCoordinationCaseId: candidateSearching.hubCase.hubCoordinationCaseId,
  });
  candidatesReady = await harness.hubService.publishCandidatesReady(
    buildOwnedHubCommand(candidateSearching.hubCase, name, "publish_candidates_ready", 8, {
      policyTupleHash:
        input.policyTupleHashOverride ?? snapshotResult.snapshot?.policyTupleHash ?? candidateSearching.hubCase.policyTupleHash,
      candidateSnapshotRef: snapshotResult.snapshotId,
      crossSiteDecisionPlanRef: snapshotResult.decisionPlan?.decisionPlanId ?? null,
    }),
  );
  current = candidatesReady;

  if (input.state === "candidates_ready") {
    return {
      name: input.name,
      request,
      created,
      validated,
      queued,
      claimed,
      candidateSearching,
      candidatesReady,
      selecting,
      alternativesOffered,
      patientChoicePending,
      callbackTransferPending,
      staleOwnerRecovery,
      bookedPendingAck,
      snapshotResult,
      current,
    };
  }

  const selectedCandidateRef = snapshotResult.candidates[0]!.candidateId;

  if (input.state === "callback_transfer_pending") {
    callbackTransferPending = await harness.hubService.markCallbackTransferPending(
      buildOwnedHubCommand(candidatesReady.hubCase, name, "callback_transfer_pending", 9, {
        activeFallbackRef: `fallback_${name}`,
      }),
    );
    current = callbackTransferPending;
    return {
      name: input.name,
      request,
      created,
      validated,
      queued,
      claimed,
      candidateSearching,
      candidatesReady,
      selecting,
      alternativesOffered,
      patientChoicePending,
      callbackTransferPending,
      staleOwnerRecovery,
      bookedPendingAck,
      snapshotResult,
      current,
    };
  }

  if (input.state === "alternatives_offered" || input.state === "patient_choice_pending") {
    alternativesOffered = await harness.hubService.enterAlternativesOffered(
      buildOwnedHubCommand(candidatesReady.hubCase, name, "alternatives_offered", 9, {
        activeAlternativeOfferSessionRef: `offer_session_${name}`,
        activeOfferOptimisationPlanRef: `offer_plan_${name}`,
        offerToConfirmationTruthRef: `offer_truth_${name}`,
      }),
    );
    current = alternativesOffered;
    if (input.state === "alternatives_offered") {
      return {
        name: input.name,
        request,
        created,
        validated,
        queued,
        claimed,
        candidateSearching,
        candidatesReady,
        selecting,
        alternativesOffered,
        patientChoicePending,
        callbackTransferPending,
        staleOwnerRecovery,
        bookedPendingAck,
        snapshotResult,
        current,
      };
    }
    patientChoicePending = await harness.hubService.enterPatientChoicePending(
      buildOwnedHubCommand(alternativesOffered.hubCase, name, "patient_choice_pending", 10),
    );
    current = patientChoicePending;
    return {
      name: input.name,
      request,
      created,
      validated,
      queued,
      claimed,
      candidateSearching,
      candidatesReady,
      selecting,
      alternativesOffered,
      patientChoicePending,
      callbackTransferPending,
      staleOwnerRecovery,
      bookedPendingAck,
      snapshotResult,
      current,
    };
  }

  selecting = await harness.hubService.enterCoordinatorSelecting(
    buildOwnedHubCommand(candidatesReady.hubCase, name, "coordinator_selecting", 9, {
      selectedCandidateRef,
      policyTupleHash: input.policyTupleHashOverride ?? candidatesReady.hubCase.policyTupleHash,
    }),
  );
  current = selecting;

  if (input.state === "coordinator_selecting") {
    return {
      name: input.name,
      request,
      created,
      validated,
      queued,
      claimed,
      candidateSearching,
      candidatesReady,
      selecting,
      alternativesOffered,
      patientChoicePending,
      callbackTransferPending,
      staleOwnerRecovery,
      bookedPendingAck,
      snapshotResult,
      current,
    };
  }

  if (input.state === "booked_pending_practice_ack") {
    const revalidating = await harness.hubService.enterCandidateRevalidating(
      buildOwnedHubCommand(selecting.hubCase, name, "candidate_revalidating", 10, {
        selectedCandidateRef,
      }),
    );
    const nativePending = await harness.hubService.enterNativeBookingPending(
      buildOwnedHubCommand(revalidating.hubCase, name, "native_booking_pending", 11, {
        bookingEvidenceRef: `booking_evidence_${name}`,
      }),
    );
    const confirmationPending = await harness.hubService.markConfirmationPending(
      buildOwnedHubCommand(nativePending.hubCase, name, "confirmation_pending", 12),
    );
    bookedPendingAck = await harness.hubService.markBookedPendingPracticeAcknowledgement(
      buildOwnedHubCommand(
        confirmationPending.hubCase,
        name,
        "booked_pending_practice_ack",
        13,
        {
          networkAppointmentRef: `appointment_${name}`,
          offerToConfirmationTruthRef: `truth_${name}`,
          practiceAckGeneration: 1,
          practiceAckDueAt: atMinute(input.practiceAckDueMinute ?? 12),
        },
      ),
    );
    current = bookedPendingAck;
  }

  return {
    name: input.name,
    request,
    created,
    validated,
    queued,
    claimed,
    candidateSearching,
    candidatesReady,
    selecting,
    alternativesOffered,
    patientChoicePending,
    callbackTransferPending,
    staleOwnerRecovery,
    bookedPendingAck,
    snapshotResult,
    current,
  };
}

export function buildCaseBinding(
  setup: QueueCaseSetup,
  overrides: Partial<HubQueueCaseBindingInput> = {},
): HubQueueCaseBindingInput {
  return {
    hubCoordinationCaseId: setup.current.hubCase.hubCoordinationCaseId,
    blockerStubRefs: [`blocker_${setup.name}`],
    ...overrides,
  };
}

export async function publishQueue(
  harness: HubQueueHarness,
  cases: readonly QueueCaseSetup[],
  overrides: {
    caseBindings?: readonly HubQueueCaseBindingInput[];
    selectedAnchorRef?: string | null;
    selectedAnchorTupleHashRef?: string | null;
    selectedOptionCardRef?: string | null;
  } = {},
): Promise<HubQueuePublishResult> {
  return harness.queueService.publishHubQueueOrder({
    queueRef: `hub_queue:${harness.pcnRef}`,
    hubCoordinationCaseIds: cases.map((setup) => setup.current.hubCase.hubCoordinationCaseId),
    evaluatedAt: atMinute(20),
    continuity: {
      selectedQueueRowRef: overrides.selectedAnchorRef ?? cases[0]?.current.hubCase.hubCoordinationCaseId ?? null,
      selectedAnchorRef: overrides.selectedAnchorRef ?? cases[0]?.current.hubCase.hubCoordinationCaseId ?? null,
      selectedAnchorTupleHashRef:
        overrides.selectedAnchorTupleHashRef ??
        `anchor_tuple_${cases[0]?.current.hubCase.hubCoordinationCaseId ?? "none"}`,
      selectedOptionCardRef: overrides.selectedOptionCardRef ?? null,
      blockerStubRefs: ["continuity_blocker"],
      dominantActionRef: "review_ranked_options",
      focusProtectedRef: "focus_protection_319",
    },
    caseBindings: overrides.caseBindings ?? cases.map((setup) => buildCaseBinding(setup)),
  });
}

export function timerByType(
  result: HubQueuePublishResult,
  hubCoordinationCaseId: string,
  timerType: HubQueueTimerSnapshot["timerType"],
) {
  return result.timers.find(
    (timer) =>
      timer.hubCoordinationCaseId === hubCoordinationCaseId && timer.timerType === timerType,
  );
}
