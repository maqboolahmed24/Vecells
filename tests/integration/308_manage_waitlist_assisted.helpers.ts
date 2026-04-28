import { createHash } from "node:crypto";

import { createPhase4BookingCapabilityEngineStore } from "../../packages/domains/booking/src/phase4-booking-capability-engine.ts";
import { createPhase4AppointmentManageApplication } from "../../services/command-api/src/phase4-appointment-manage.ts";
import { createPhase4AssistedBookingApplication } from "../../services/command-api/src/phase4-assisted-booking.ts";
import { createPhase4BookingCapabilityApplication } from "../../services/command-api/src/phase4-booking-capability.ts";
import { createPhase4BookingCaseApplication } from "../../services/command-api/src/phase4-booking-case.ts";
import { createPhase4BookingCommitApplication } from "../../services/command-api/src/phase4-booking-commit.ts";
import { createPhase4BookingReservationApplication } from "../../services/command-api/src/phase4-booking-reservations.ts";
import { createPhase4CapacityRankApplication } from "../../services/command-api/src/phase4-capacity-rank-offers.ts";
import { createPhase4SlotSearchApplication } from "../../services/command-api/src/phase4-slot-search.ts";
import { createPhase4SmartWaitlistApplication } from "../../services/command-api/src/phase4-smart-waitlist.ts";

import {
  buildDirectResolutionBundle,
  buildSearchPolicy,
  buildSearchWindows,
  buildSelectionProofHash,
  canonicalize,
  setupBookingCoreFlow,
} from "./307_booking_core.helpers.ts";

export {
  buildDirectResolutionBundle,
  buildSearchPolicy,
  buildSearchWindows,
  buildSelectionProofHash,
  canonicalize,
};

export function buildReleasedCapacity(seed = "308", overrides: Record<string, unknown> = {}) {
  return {
    releasedSlotRef: `released_slot_${seed}`,
    selectedNormalizedSlotRef: `normalized_slot_${seed}`,
    selectedCanonicalSlotIdentityRef: `canonical_slot_${seed}`,
    sourceSlotSetSnapshotRef: `slot_snapshot_${seed}`,
    capacityUnitRef: `capacity_unit_${seed}`,
    supplierRef: "vecells_local_gateway",
    scheduleOwnerRef: `schedule_owner_${seed}`,
    inventoryLineageRef: `inventory_lineage_${seed}`,
    slotStartAt: "2026-04-24T09:00:00.000Z",
    slotEndAt: "2026-04-24T09:15:00.000Z",
    slotStartAtEpoch: Date.parse("2026-04-24T09:00:00.000Z"),
    slotEndAtEpoch: Date.parse("2026-04-24T09:15:00.000Z"),
    localDayKey: "2026-04-24",
    siteRef: "site_a",
    modality: "in_person",
    locationRef: `location_${seed}`,
    practitionerRef: `practitioner_${seed}`,
    serviceRef: "service_gp",
    continuityScore: 0.92,
    travelMinutes: 20,
    authoritativeReleaseState: "authoritative_released",
    releaseReasonCode: "authoritative_slot_release",
    ...overrides,
  };
}

export async function setupManagedAppointmentFlow(seed = "308_manage") {
  const core = await setupBookingCoreFlow({
    seed,
    supplierRef: "gp_connect_existing",
    integrationMode: "gp_connect_existing",
    deploymentType: "hscn_direct_care_consumer",
    audience: "staff",
  });
  const appointmentManageApplication = createPhase4AppointmentManageApplication({
    bookingCaseApplication: core.bookingCaseApplication,
    bookingCapabilityApplication: core.bookingCapabilityApplication,
    slotSearchApplication: core.slotSearchApplication,
    capacityRankApplication: core.capacityRankApplication,
    bookingReservationApplication: core.bookingReservationApplication,
    bookingCommitApplication: core.bookingCommitApplication,
  });

  const committed = await core.bookingCommitApplication.beginCommitFromSelectedOffer({
    bookingCaseId: `booking_case_${seed}`,
    offerSessionId: core.offerSession!.offerSessionId,
    actorRef: `actor_${seed}`,
    subjectRef: `staff_actor_${seed}`,
    commandActionRecordRef: `begin_commit_action_${seed}`,
    commandSettlementRecordRef: `begin_commit_settlement_${seed}`,
    occurredAt: "2026-04-22T12:25:00.000Z",
    idempotencyKey: `idempotency_key_${seed}`,
    dispatchOutcome: {
      kind: "authoritative_success",
      authoritativeProofClass: "durable_provider_reference",
      providerReference: `provider_reference_${seed}`,
      settlementRef: `settlement_${seed}`,
    },
    expectedSelectionProofHash: core.selectionProofHash!,
    expectedRequestLifecycleLeaseRef: `request_lease_${seed}`,
    expectedOwnershipEpochRef: 4,
    expectedSourceDecisionEpochRef: `decision_epoch_${seed}`,
    expectedRuntimePublicationBundleRef: `runtime_publication_${seed}`,
    expectedSurfacePublicationRef: `surface_publication_${seed}`,
    reviewActionLeaseRef: `review_action_lease_${seed}`,
    payloadArtifactRef: `artifact://booking/commit/${seed}`,
    edgeCorrelationId: `edge_commit_${seed}`,
  });

  const managed = await core.bookingCaseApplication.markManaged({
    bookingCaseId: `booking_case_${seed}`,
    actorRef: `actor_${seed}`,
    routeIntentBindingRef: `route_intent_${seed}`,
    commandActionRecordRef: `mark_managed_after_commit_${seed}`,
    commandSettlementRecordRef: `mark_managed_after_commit_settlement_${seed}`,
    recordedAt: "2026-04-22T12:27:00.000Z",
    sourceDecisionEpochRef: `decision_epoch_${seed}`,
    sourceDecisionSupersessionRef: null,
    lineageCaseLinkRef: `lineage_case_link_${seed}`,
    requestLifecycleLeaseRef: `request_lease_${seed}`,
    ownershipEpoch: 4,
    fencingToken: `fencing_token_${seed}`,
    currentLineageFenceEpoch: 7,
    reasonCode: "booking_ready_for_manage",
    currentOfferSessionRef: core.offerSession!.offerSessionId,
    selectedSlotRef: committed.transaction.selectedSlotRef,
    appointmentRef: committed.appointmentRecord!.appointmentRecordId,
    latestConfirmationTruthProjectionRef:
      committed.confirmationTruthProjection.bookingConfirmationTruthProjectionId,
  });

  return {
    ...core,
    appointmentManageApplication,
    appointmentRecord: committed.appointmentRecord!,
    confirmationTruthProjection: committed.confirmationTruthProjection,
    bookingCase: managed,
  };
}

export function buildManageInput(flow: any, overrides: Record<string, unknown> = {}) {
  return {
    appointmentId: flow.appointmentRecord.appointmentRecordId,
    actorRef: `actor_${flow.seed}`,
    subjectRef: `staff_actor_${flow.seed}`,
    actorMode: "staff",
    routeIntentBindingRef: `route_intent_manage_${flow.seed}`,
    surfaceRouteContractRef: `surface_route_manage_${flow.seed}`,
    surfacePublicationRef: `surface_publication_${flow.seed}`,
    runtimePublicationBundleRef: `runtime_publication_${flow.seed}`,
    selectedAnchorRef: flow.appointmentRecord.appointmentRecordId,
    routeFamilyRef: "staff_booking_manage",
    experienceContinuityEvidenceRef: `experience_continuity_${flow.seed}`,
    continuityEvidenceState: "current",
    commandActionRecordRef: `manage_action_${flow.seed}`,
    commandSettlementRecordRef: `manage_settlement_${flow.seed}`,
    occurredAt: "2026-04-22T13:00:00.000Z",
    idempotencyKey: `manage_idempotency_${flow.seed}`,
    payloadArtifactRef: `artifact://booking/manage/${flow.seed}`,
    edgeCorrelationId: `edge_manage_${flow.seed}`,
    ...overrides,
  };
}

export async function setupWaitlistFlow(options: Record<string, any> = {}) {
  const seed = options.seed ?? "308_waitlist";
  const supplierRef = options.supplierRef ?? "vecells_local_gateway";
  const integrationMode = options.integrationMode ?? "local_gateway_component";
  const deploymentType = options.deploymentType ?? "practice_local_gateway";
  const audience = options.audience ?? "staff";
  const core = await setupBookingCoreFlow({
    seed,
    supplierRef,
    integrationMode,
    deploymentType,
    audience,
    forceExclusiveHold: options.forceExclusiveHold ?? false,
    searchWindows: options.searchWindows,
    skipOfferSelection: true,
  });

  const waitlistApplication = createPhase4SmartWaitlistApplication({
    bookingCaseApplication: core.bookingCaseApplication,
    bookingCapabilityApplication: core.bookingCapabilityApplication,
    bookingReservationApplication: core.bookingReservationApplication,
    bookingCommitApplication: core.bookingCommitApplication,
  });

  return {
    ...core,
    waitlistApplication,
  };
}

function createSnapshotDocument(snapshotFactory: () => Record<string, unknown>) {
  return {
    toSnapshot() {
      return structuredClone(snapshotFactory());
    },
  };
}

export function createTriageHarness(seed: string) {
  const state: any = {
    task: {
      taskId: `task_${seed}`,
      requestId: `request_${seed}`,
      launchContextRef: `launch_context_${seed}`,
      activeReviewSessionRef: `review_session_${seed}`,
      reviewFreshnessState: "fresh",
      taskCompletionSettlementEnvelopeRef: `task_completion_envelope_${seed}`,
      fencingToken: `fencing_token_${seed}`,
      currentLineageFenceEpoch: 7,
      staleOwnerRecoveryRef: null,
    },
    reviewSession: {
      reviewSessionId: `review_session_${seed}`,
      sessionState: "active",
      reviewActionLeaseRef: `review_action_lease_${seed}`,
      selectedAnchorTupleHashRef: `selected_anchor_tuple_${seed}`,
    },
    launchContext: {
      launchContextId: `launch_context_${seed}`,
      sourceQueueRankSnapshotRef: `queue_rank_snapshot_${seed}`,
    },
  };

  const application = {
    triageRepositories: {
      async getTask(taskId: string) {
        return taskId === state.task.taskId ? createSnapshotDocument(() => state.task) : null;
      },
      async getReviewSession(reviewSessionId: string) {
        return reviewSessionId === state.reviewSession.reviewSessionId
          ? createSnapshotDocument(() => state.reviewSession)
          : null;
      },
      async getLaunchContext(launchContextId: string) {
        return launchContextId === state.launchContext.launchContextId
          ? createSnapshotDocument(() => state.launchContext)
          : null;
      },
    },
    async markStaleOwnerDetected({ taskId, breakReason }: { taskId: string; breakReason: string }) {
      if (taskId !== state.task.taskId) {
        throw new Error("TASK_NOT_FOUND");
      }
      state.task = {
        ...state.task,
        staleOwnerRecoveryRef: `stale_owner_recovery_${seed}`,
        reviewFreshnessState: "review_required",
        staleOwnerReasonCode: breakReason,
      };
      return {
        taskRef: state.task.taskId,
        staleOwnerRecoveryRef: state.task.staleOwnerRecoveryRef,
      };
    },
    async reacquireTaskLease({
      taskId,
      ownerSessionRef,
      leaseTtlSeconds,
    }: {
      taskId: string;
      ownerSessionRef?: string | null;
      leaseTtlSeconds?: number | null;
    }) {
      if (taskId !== state.task.taskId) {
        throw new Error("TASK_NOT_FOUND");
      }
      state.task = {
        ...state.task,
        staleOwnerRecoveryRef: null,
        reviewFreshnessState: "fresh",
        reacquiredOwnerSessionRef: ownerSessionRef ?? null,
        reacquiredLeaseTtlSeconds: leaseTtlSeconds ?? null,
      };
      return { taskRef: state.task.taskId };
    },
  };

  return { application, state };
}

export function createWorkspaceHarness(seed: string) {
  const state: any = {
    consistencyProjectionId: `workspace_consistency_${seed}`,
    trustProjectionId: `workspace_trust_${seed}`,
    trustEnvelopeId: `workspace_trust_envelope_${seed}`,
    mutationAuthorityState: "live",
    blockingReasonRefs: [],
    protectedCompositionStateId: `protected_composition_${seed}`,
    protectedCompositionStateValidity: "live",
  };

  const application = {
    async queryWorkspaceTaskContext(input: any) {
      return {
        staffWorkspaceConsistencyProjection: {
          workspaceConsistencyProjectionId:
            input.staffWorkspaceConsistencyProjectionRef ?? state.consistencyProjectionId,
        },
        workspaceSliceTrustProjection: {
          workspaceSliceTrustProjectionId:
            input.workspaceSliceTrustProjectionRef ?? state.trustProjectionId,
        },
        protectedCompositionState: input.focusProtectionLeaseRef
          ? {
              protectedCompositionStateId:
                input.protectedCompositionStateRef ?? state.protectedCompositionStateId,
              stateValidity: state.protectedCompositionStateValidity,
              compareAnchorRefs: input.compareAnchorRefs ?? [],
            }
          : null,
        workspaceTrustEnvelope: {
          workspaceTrustEnvelopeId: state.trustEnvelopeId,
          mutationAuthorityState: state.mutationAuthorityState,
          blockingReasonRefs: [...state.blockingReasonRefs],
        },
      };
    },
  };

  return { application, state };
}

export function createTaskCompletionHarness(seed: string, triageState: any) {
  const state: any = {
    authoritativeSettlementState: "pending",
    nextTaskLaunchState: "blocked",
    blockingReasonRefs: ["authoritative_booking_settlement_pending"],
  };

  const application = {
    async queryTaskCompletionContinuity(taskId: string) {
      if (taskId !== triageState.task.taskId) {
        throw new Error("TASK_COMPLETION_NOT_FOUND");
      }
      return {
        task: structuredClone(triageState.task),
        reviewSession: structuredClone(triageState.reviewSession),
        completionEnvelope: {
          taskCompletionSettlementEnvelopeId: triageState.task.taskCompletionSettlementEnvelopeRef,
          authoritativeSettlementState: state.authoritativeSettlementState,
          nextTaskLaunchState: state.nextTaskLaunchState,
          blockingReasonRefs: [...state.blockingReasonRefs],
        },
      };
    },
  };

  return { application, state };
}

async function enableExclusiveHold(capabilityRepositories: any) {
  const rows = await capabilityRepositories.listProviderCapabilityMatrixRows();
  const target = rows
    .map((row: any) => row.toSnapshot())
    .find(
      (row: any) =>
        row.supplierRef === "vecells_local_gateway" &&
        row.integrationMode === "local_gateway_component" &&
        row.deploymentType === "practice_local_gateway",
    );
  if (!target) {
    throw new Error("TARGET_CAPABILITY_ROW_NOT_FOUND");
  }
  await capabilityRepositories.saveProviderCapabilityMatrixRow({
    ...target,
    reservationMode: "exclusive_hold",
    rowHash: `${target.rowHash}_exclusive_hold`,
  });
}

export async function mutateCapabilityRow(
  capabilityRepositories: any,
  matcher: (row: any) => boolean,
  mutator: (row: any) => any,
) {
  const rows = await capabilityRepositories.listProviderCapabilityMatrixRows();
  const target = rows.map((row: any) => row.toSnapshot()).find(matcher);
  if (!target) {
    throw new Error("TARGET_CAPABILITY_ROW_NOT_FOUND");
  }
  const updated = mutator(target);
  await capabilityRepositories.saveProviderCapabilityMatrixRow(updated);
  return updated;
}

export async function setupAssistedBookingFlow(seed = "308_assisted") {
  const bookingCaseApplication = createPhase4BookingCaseApplication({
    directResolutionApplication: {
      async queryTaskDirectResolution() {
        return structuredClone(buildDirectResolutionBundle(seed));
      },
    },
  });
  const capabilityRepositories = createPhase4BookingCapabilityEngineStore();
  await enableExclusiveHold(capabilityRepositories);
  const bookingCapabilityApplication = createPhase4BookingCapabilityApplication({
    bookingCaseApplication,
    repositories: capabilityRepositories,
  });
  const slotSearchApplication = createPhase4SlotSearchApplication({
    bookingCaseApplication,
    bookingCapabilityApplication,
  });
  const capacityRankApplication = createPhase4CapacityRankApplication({
    bookingCaseApplication,
    bookingCapabilityApplication,
    slotSearchApplication,
  });
  const bookingReservationApplication = createPhase4BookingReservationApplication({
    bookingCaseApplication,
    bookingCapabilityApplication,
    slotSearchApplication,
    capacityRankApplication,
  });
  const bookingCommitApplication = createPhase4BookingCommitApplication({
    bookingCaseApplication,
    bookingCapabilityApplication,
    slotSearchApplication,
    capacityRankApplication,
    bookingReservationApplication,
  });
  const triageHarness = createTriageHarness(seed);
  const workspaceHarness = createWorkspaceHarness(seed);
  const taskCompletionHarness = createTaskCompletionHarness(seed, triageHarness.state);
  const assistedBookingApplication = createPhase4AssistedBookingApplication({
    bookingCaseApplication,
    bookingCapabilityApplication,
    slotSearchApplication,
    capacityRankApplication,
    bookingReservationApplication,
    bookingCommitApplication,
    triageApplication: triageHarness.application as never,
    workspaceContextApplication: workspaceHarness.application as never,
    taskCompletionContinuityApplication: taskCompletionHarness.application as never,
  });

  await bookingCaseApplication.createBookingCaseFromTaskHandoff({
    taskId: `task_${seed}`,
    bookingCaseId: `booking_case_${seed}`,
    patientRef: `patient_${seed}`,
    tenantId: "tenant_vecells_beta",
    providerContext: {
      practiceRef: "ods_A83002",
      supplierHintRef: "vecells_local_gateway",
      careSetting: "general_practice",
    },
    actorRef: `actor_${seed}`,
    routeIntentBindingRef: `route_intent_${seed}`,
    commandActionRecordRef: `create_case_action_${seed}`,
    commandSettlementRecordRef: `create_case_settlement_${seed}`,
    createdAt: "2026-04-22T09:30:00.000Z",
    surfaceRouteContractRef: "booking_route_contract_v1",
    surfacePublicationRef: `surface_publication_${seed}`,
    runtimePublicationBundleRef: `runtime_publication_${seed}`,
  });

  return {
    seed,
    capabilityRepositories,
    bookingCaseApplication,
    bookingCapabilityApplication,
    slotSearchApplication,
    capacityRankApplication,
    bookingReservationApplication,
    bookingCommitApplication,
    assistedBookingApplication,
    triageState: triageHarness.state,
    workspaceState: workspaceHarness.state,
    taskCompletionState: taskCompletionHarness.state,
  };
}

export function buildBaseGuard(seed: string, overrides: Record<string, unknown> = {}) {
  return {
    taskId: `task_${seed}`,
    workspaceRef: `workspace_booking_${seed}`,
    reviewActionLeaseRef: `review_action_lease_${seed}`,
    staffWorkspaceConsistencyProjectionRef: `workspace_consistency_${seed}`,
    workspaceSliceTrustProjectionRef: `workspace_trust_${seed}`,
    requestLifecycleLeaseRef: `request_lease_${seed}`,
    requestOwnershipEpochRef: 4,
    surfaceRouteContractRef: "booking_route_contract_v1",
    surfacePublicationRef: `surface_publication_${seed}`,
    runtimePublicationBundleRef: `runtime_publication_${seed}`,
    ...overrides,
  };
}

export function buildStartSessionInput(seed: string, overrides: Record<string, unknown> = {}) {
  return {
    bookingCaseId: `booking_case_${seed}`,
    staffUserRef: `staff_actor_${seed}`,
    organisationRef: "org_vecells_beta",
    supplierRef: "vecells_local_gateway",
    integrationMode: "local_gateway_component",
    deploymentType: "practice_local_gateway",
    routeIntentBindingRef: `route_intent_assisted_${seed}`,
    commandActionRecordRef: `start_assisted_session_${seed}`,
    commandSettlementRecordRef: `start_assisted_session_settlement_${seed}`,
    startedAt: "2026-04-22T12:00:00.000Z",
    ...buildBaseGuard(seed),
    ...overrides,
  };
}

export function buildSlotSearchInput(seed: string, overrides: Record<string, unknown> = {}) {
  return {
    bookingCaseId: `booking_case_${seed}`,
    staffUserRef: `staff_actor_${seed}`,
    organisationRef: "org_vecells_beta",
    supplierRef: "vecells_local_gateway",
    integrationMode: "local_gateway_component",
    deploymentType: "practice_local_gateway",
    routeIntentBindingRef: `route_intent_assisted_${seed}`,
    commandActionRecordRef: `assisted_slot_search_${seed}`,
    commandSettlementRecordRef: `assisted_slot_search_settlement_${seed}`,
    refreshedAt: "2026-04-22T12:05:00.000Z",
    displayTimeZone: "Europe/London",
    supplierWindows: buildSearchWindows(seed),
    searchPolicy: buildSearchPolicy(seed),
    payloadArtifactRef: `artifact://booking/search/${seed}/assisted`,
    edgeCorrelationId: `edge_assisted_search_${seed}`,
    ...buildBaseGuard(seed),
    ...overrides,
  };
}

export async function queryOfferSelection(flow: any) {
  const bundle = await flow.capacityRankApplication.queryCurrentOfferSession({
    bookingCaseId: `booking_case_${flow.seed}`,
  });
  const selectedCandidate = bundle.offerCandidates[0];
  const selectionProofHash = createHash("sha256")
    .update(
      canonicalize({
        offerSessionId: bundle.offerSession.offerSessionId,
        slotSetSnapshotRef: bundle.offerSession.slotSetSnapshotRef,
        capacityRankProofRef: bundle.capacityRankProof.capacityRankProofId,
        selectionToken: bundle.offerSession.selectionToken,
        truthMode: bundle.offerSession.truthMode,
        reservationTruthProjectionRef: bundle.offerSession.reservationTruthProjectionRef,
        providerAdapterBindingHash: bundle.offerSession.providerAdapterBindingHash,
        capabilityTupleHash: bundle.offerSession.capabilityTupleHash,
        selectedCandidateHash: selectedCandidate.candidateHash,
        selectedCanonicalSlotIdentityRef: selectedCandidate.canonicalSlotIdentityRef,
      }),
    )
    .digest("hex");
  return { bundle, selectedCandidate, selectionProofHash };
}

export async function setupReconciliationFlow(options: Record<string, any> = {}) {
  return setupBookingCoreFlow({
    seed: options.seed ?? "308_reconciliation",
    supplierRef: options.supplierRef ?? "vecells_local_gateway",
    integrationMode: options.integrationMode ?? "local_gateway_component",
    deploymentType: options.deploymentType ?? "practice_local_gateway",
    audience: options.audience ?? "staff",
    forceExclusiveHold: options.forceExclusiveHold ?? false,
    searchWindows: options.searchWindows,
  });
}
