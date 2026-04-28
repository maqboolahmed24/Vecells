import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { createPhase4BookingCapabilityEngineStore } from "@vecells/domain-booking";
import { serviceDefinition } from "../src/service-definition.ts";
import {
  PHASE4_ASSISTED_BOOKING_QUERY_SURFACES,
  PHASE4_ASSISTED_BOOKING_SCHEMA_VERSION,
  PHASE4_ASSISTED_BOOKING_SERVICE_NAME,
  createPhase4AssistedBookingApplication,
  phase4AssistedBookingMigrationPlanRefs,
  phase4AssistedBookingPersistenceTables,
  phase4AssistedBookingRoutes,
} from "../src/phase4-assisted-booking.ts";
import { createPhase4BookingCaseApplication } from "../src/phase4-booking-case.ts";
import { createPhase4BookingCapabilityApplication } from "../src/phase4-booking-capability.ts";
import { createPhase4SlotSearchApplication } from "../src/phase4-slot-search.ts";
import { createPhase4CapacityRankApplication } from "../src/phase4-capacity-rank-offers.ts";
import { createPhase4BookingReservationApplication } from "../src/phase4-booking-reservations.ts";
import { createPhase4BookingCommitApplication } from "../src/phase4-booking-commit.ts";

function buildDirectResolutionBundle(seed = "291") {
  return {
    settlement: null,
    callbackSeed: null,
    clinicianMessageSeed: null,
    selfCareStarter: null,
    adminResolutionStarter: null,
    bookingIntent: {
      intentId: `booking_intent_${seed}`,
      episodeRef: `episode_${seed}`,
      requestId: `request_${seed}`,
      requestLineageRef: `request_lineage_${seed}`,
      sourceTriageTaskRef: `task_${seed}`,
      lineageCaseLinkRef: `lineage_case_link_${seed}`,
      priorityBand: "soon",
      timeframe: "within_14_days",
      modality: "in_person",
      clinicianType: "general_practice",
      continuityPreference: "preferred_clinician_if_available",
      accessNeeds: "step_free_access",
      patientPreferenceSummary: "Prefers mornings at the preferred site.",
      createdFromDecisionId: `decision_${seed}`,
      decisionEpochRef: `decision_epoch_${seed}`,
      decisionSupersessionRecordRef: null,
      lifecycleLeaseRef: `request_lease_${seed}`,
      leaseAuthorityRef: "lease_authority_booking_intent",
      leaseTtlSeconds: 600,
      ownershipEpoch: 4,
      fencingToken: `fencing_token_${seed}`,
      currentLineageFenceEpoch: 7,
      intentState: "seeded",
      commandActionRecordRef: `handoff_action_${seed}`,
      commandSettlementRecordRef: `handoff_settlement_${seed}`,
      createdAt: "2026-04-18T09:00:00.000Z",
      updatedAt: "2026-04-18T09:00:00.000Z",
      version: 1,
    },
    pharmacyIntent: null,
    presentationArtifact: null,
    patientStatusProjection: null,
    outboxEntries: [],
  };
}

function buildSearchPolicy(seed = "291") {
  return {
    policyId: `search_policy_${seed}`,
    timeframeEarliest: "2026-04-20T08:00:00.000Z",
    timeframeLatest: "2026-04-21T18:00:00.000Z",
    modality: "in_person",
    clinicianType: "general_practice",
    continuityPreference: "preferred_clinician_if_available",
    sitePreference: ["site_a", "site_b"],
    accessibilityNeeds: ["step_free_access"],
    maxTravelTime: 45,
    bookabilityPolicy: "include_staff_assistable",
    selectionAudience: "staff_assist",
    patientChannelMode: "staff_proxy",
    policyBundleHash: `policy_bundle_hash_${seed}`,
    sameBandReorderSlackMinutesByWindow: { early: 10, standard: 20 },
  };
}

function buildSearchWindows(seed = "291", supplierRef = "vecells_local_gateway") {
  return [
    {
      supplierRef,
      supplierWindowRef: `supplier_window_a_${seed}`,
      searchWindowStartAt: "2026-04-20T08:00:00.000Z",
      searchWindowEndAt: "2026-04-20T18:00:00.000Z",
      fetchStartedAt: "2026-04-18T12:00:00.000Z",
      fetchCompletedAt: "2026-04-18T12:00:05.000Z",
      rawRows: [
        {
          supplierSlotRef: `slot_a_0900_${seed}`,
          capacityUnitRef: `cap_u1_${seed}`,
          scheduleRef: `schedule_a_${seed}`,
          scheduleOwnerRef: `schedule_owner_a_${seed}`,
          locationRef: `location_a_${seed}`,
          locationName: "Preferred Site",
          practitionerRef: `practitioner_a_${seed}`,
          serviceRef: "service_gp",
          clinicianType: "general_practice",
          modality: "in_person",
          startAt: "2026-04-20T09:00:00.000Z",
          endAt: "2026-04-20T09:15:00.000Z",
          siteId: "site_a",
          siteName: "Preferred Site",
          accessibilityTags: ["step_free_access"],
          continuityScore: 0.95,
          restrictions: [],
          bookabilityMode: "dual",
          inventoryLineageRef: `inventory_lineage_a_${seed}`,
          sourceVersionRef: `supplier_version_a_${seed}`,
        },
        {
          supplierSlotRef: `slot_b_1030_${seed}`,
          capacityUnitRef: `cap_u2_${seed}`,
          scheduleRef: `schedule_b_${seed}`,
          scheduleOwnerRef: `schedule_owner_b_${seed}`,
          locationRef: `location_b_${seed}`,
          locationName: "Fallback Site",
          practitionerRef: `practitioner_b_${seed}`,
          serviceRef: "service_gp",
          clinicianType: "general_practice",
          modality: "in_person",
          startAt: "2026-04-20T10:30:00.000Z",
          endAt: "2026-04-20T10:45:00.000Z",
          siteId: "site_b",
          siteName: "Fallback Site",
          accessibilityTags: ["step_free_access"],
          continuityScore: 0.45,
          restrictions: [],
          bookabilityMode: "dual",
          inventoryLineageRef: `inventory_lineage_b_${seed}`,
          sourceVersionRef: `supplier_version_b_${seed}`,
        },
      ],
    },
  ];
}

function buildReminderInput(seed, overrides = {}) {
  return {
    bookingCaseId: `booking_case_${seed}`,
    commandActionRecordRef: `refresh_reminder_plan_${seed}`,
    commandSettlementRecordRef: `refresh_reminder_plan_settlement_${seed}`,
    actorRef: `actor_${seed}`,
    templateSetRef: "booking_reminders",
    templateVersionRef: "booking_reminder_v1",
    routeProfileRef: "patient_primary_contact",
    channel: "sms",
    payloadRef: `artifact://booking/reminders/${seed}/payload_v1`,
    payload: {
      reminderType: "appointment",
      appointmentId: `appointment_${seed}`,
    },
    payloadArtifactRef: `artifact://booking/reminders/${seed}/refresh`,
    edgeCorrelationId: `edge_booking_reminder_refresh_${seed}`,
    scheduleOffsetsMinutesBeforeStart: [1440, 120],
    refreshedAt: "2026-04-18T12:40:00.000Z",
    appointmentStartAt: "2026-04-20T09:00:00.000Z",
    appointmentEndAt: "2026-04-20T09:15:00.000Z",
    appointmentTimeZone: "Europe/London",
    contactRoute: {
      subjectRef: `patient_${seed}`,
      routeRef: `contact_route_${seed}`,
      routeVersionRef: `contact_route_version_${seed}`,
      routeKind: "sms",
      normalizedAddressRef: `+447700900${seed.slice(-2).padStart(2, "0")}`,
      preferenceProfileRef: `contact_pref_${seed}`,
      verificationState: "verified_current",
      demographicFreshnessState: "current",
      preferenceFreshnessState: "current",
      sourceAuthorityClass: "patient_confirmed",
      maskedDestination: "+44******000",
    },
    ...overrides,
  };
}

function canonicalize(value) {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => canonicalize(entry)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value)
      .filter(([, entryValue]) => entryValue !== undefined)
      .sort(([left], [right]) => left.localeCompare(right));
    return `{${entries
      .map(([key, entryValue]) => `${JSON.stringify(key)}:${canonicalize(entryValue)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function buildSelectionProofHash(bundle, candidate) {
  return createHash("sha256")
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
        selectedCandidateHash: candidate.candidateHash,
        selectedCanonicalSlotIdentityRef: candidate.canonicalSlotIdentityRef,
      }),
    )
    .digest("hex");
}

function createSnapshotDocument(snapshotFactory) {
  return {
    toSnapshot() {
      return structuredClone(snapshotFactory());
    },
  };
}

function createTriageHarness(seed) {
  const state = {
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
      async getTask(taskId) {
        return taskId === state.task.taskId
          ? createSnapshotDocument(() => state.task)
          : null;
      },
      async getReviewSession(reviewSessionId) {
        return reviewSessionId === state.reviewSession.reviewSessionId
          ? createSnapshotDocument(() => state.reviewSession)
          : null;
      },
      async getLaunchContext(launchContextId) {
        return launchContextId === state.launchContext.launchContextId
          ? createSnapshotDocument(() => state.launchContext)
          : null;
      },
    },
    async markStaleOwnerDetected({ taskId, breakReason }) {
      if (taskId !== state.task.taskId) {
        throw new Error("TASK_NOT_FOUND");
      }
      state.task = {
        ...state.task,
        staleOwnerRecoveryRef: `stale_owner_recovery_${seed}`,
        reviewFreshnessState: "review_required",
        staleOwnerReasonCode: breakReason,
      };
      return { taskRef: state.task.taskId, staleOwnerRecoveryRef: state.task.staleOwnerRecoveryRef };
    },
    async reacquireTaskLease({ taskId, ownerSessionRef, leaseTtlSeconds }) {
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

function createWorkspaceHarness(seed) {
  const state = {
    consistencyProjectionId: `workspace_consistency_${seed}`,
    trustProjectionId: `workspace_trust_${seed}`,
    trustEnvelopeId: `workspace_trust_envelope_${seed}`,
    mutationAuthorityState: "live",
    blockingReasonRefs: [],
    protectedCompositionStateId: `protected_composition_${seed}`,
    protectedCompositionStateValidity: "live",
  };

  const application = {
    async queryWorkspaceTaskContext(input) {
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

function createTaskCompletionHarness(seed, triageState) {
  const state = {
    authoritativeSettlementState: "pending",
    nextTaskLaunchState: "blocked",
    blockingReasonRefs: ["authoritative_booking_settlement_pending"],
  };

  const application = {
    async queryTaskCompletionContinuity(taskId) {
      if (taskId !== triageState.task.taskId) {
        throw new Error("TASK_COMPLETION_NOT_FOUND");
      }
      return {
        task: structuredClone(triageState.task),
        reviewSession: structuredClone(triageState.reviewSession),
        completionEnvelope: {
          taskCompletionSettlementEnvelopeId:
            triageState.task.taskCompletionSettlementEnvelopeRef,
          authoritativeSettlementState: state.authoritativeSettlementState,
          nextTaskLaunchState: state.nextTaskLaunchState,
          blockingReasonRefs: [...state.blockingReasonRefs],
        },
      };
    },
  };

  return { application, state };
}

async function enableExclusiveHold(capabilityRepositories) {
  const rows = await capabilityRepositories.listProviderCapabilityMatrixRows();
  const target = rows
    .map((row) => row.toSnapshot())
    .find(
      (row) =>
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

async function mutateCapabilityRow(capabilityRepositories, matcher, mutator) {
  const rows = await capabilityRepositories.listProviderCapabilityMatrixRows();
  const target = rows.map((row) => row.toSnapshot()).find(matcher);
  if (!target) {
    throw new Error("TARGET_CAPABILITY_ROW_NOT_FOUND");
  }
  const updated = mutator(target);
  await capabilityRepositories.saveProviderCapabilityMatrixRow(updated);
  return updated;
}

async function setupAssistedBookingFlow(seed = "291") {
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
    triageApplication: triageHarness.application,
    workspaceContextApplication: workspaceHarness.application,
    taskCompletionContinuityApplication: taskCompletionHarness.application,
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
    createdAt: "2026-04-18T09:30:00.000Z",
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

function buildBaseGuard(seed, overrides = {}) {
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

function buildStartSessionInput(seed, overrides = {}) {
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
    startedAt: "2026-04-18T12:00:00.000Z",
    ...buildBaseGuard(seed),
    ...overrides,
  };
}

function buildSlotSearchInput(seed, overrides = {}) {
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
    refreshedAt: "2026-04-18T12:05:00.000Z",
    displayTimeZone: "Europe/London",
    supplierWindows: buildSearchWindows(seed),
    searchPolicy: buildSearchPolicy(seed),
    payloadArtifactRef: `artifact://booking/search/${seed}/assisted`,
    edgeCorrelationId: `edge_assisted_search_${seed}`,
    ...buildBaseGuard(seed),
    ...overrides,
  };
}

async function queryOfferSelection(flow) {
  const bundle = await flow.capacityRankApplication.queryCurrentOfferSession({
    bookingCaseId: `booking_case_${flow.seed}`,
  });
  const selectedCandidate = bundle.offerCandidates[0];
  const selectionProofHash = buildSelectionProofHash(bundle, selectedCandidate);
  return { bundle, selectedCandidate, selectionProofHash };
}

describe("phase4 assisted booking application", () => {
  it("publishes the 291 metadata surface and route catalog entries", async () => {
    expect(PHASE4_ASSISTED_BOOKING_SERVICE_NAME).toBe(
      "Phase4StaffAssistedBookingOperationsApplication",
    );
    expect(PHASE4_ASSISTED_BOOKING_SCHEMA_VERSION).toBe(
      "291.phase4.staff-assisted-booking-operations.v1",
    );
    expect(PHASE4_ASSISTED_BOOKING_QUERY_SURFACES).toEqual(
      expect.arrayContaining([
        "GET /v1/workspace/bookings/{bookingCaseId}/assisted-session/current",
        "GET /v1/workspace/bookings/exception-queue",
      ]),
    );
    expect(phase4AssistedBookingPersistenceTables).toEqual(
      expect.arrayContaining([
        "phase4_assisted_booking_sessions",
        "phase4_booking_exception_queue_entries",
        "phase3_staff_workspace_consistency_projections",
        "phase3_task_completion_settlement_envelopes",
      ]),
    );
    expect(phase4AssistedBookingMigrationPlanRefs.at(-1)).toBe(
      "services/command-api/migrations/140_phase4_staff_assisted_booking_and_exception_queue.sql",
    );

    for (const routeId of [
      "workspace_booking_assisted_session_current",
      "workspace_booking_assisted_session_start",
      "workspace_booking_assisted_capability_refresh",
      "workspace_booking_assisted_slot_search_start",
      "workspace_booking_assisted_slot_compare",
      "workspace_booking_assisted_slot_select",
      "workspace_booking_assisted_slot_confirm",
      "workspace_booking_assisted_waitlist_or_fallback",
      "workspace_booking_exception_queue_current",
      "workspace_booking_exception_queue_refresh",
      "workspace_booking_exception_queue_claim",
      "workspace_booking_exception_queue_reopen",
      "workspace_booking_stale_owner_reacquire",
    ]) {
      expect(phase4AssistedBookingRoutes.some((route) => route.routeId === routeId)).toBe(true);
      expect(serviceDefinition.routeCatalog.some((route) => route.routeId === routeId)).toBe(true);
    }
  });

  it("starts an assisted session, searches and confirms through the booking core, and keeps task completion blocked until authoritative settlement exists", async () => {
    const flow = await setupAssistedBookingFlow("291_pending_commit");

    const started = await flow.assistedBookingApplication.startAssistedBookingSession(
      buildStartSessionInput(flow.seed),
    );
    expect(started.session?.schemaVersion).toBe(PHASE4_ASSISTED_BOOKING_SCHEMA_VERSION);
    expect(started.session?.sessionState).toBe("active");
    expect(started.capability?.resolution.capabilityState).toBe("live_staff_assist");

    const searched = await flow.assistedBookingApplication.startAssistedSlotSearch(
      buildSlotSearchInput(flow.seed),
    );
    expect(searched.currentSlotSearch?.slotSetSnapshot.slotSetSnapshotId).toContain(
      "slot_set_snapshot_",
    );
    expect(searched.currentOfferSession?.offerCandidates.length).toBeGreaterThan(1);

    const { bundle, selectedCandidate, selectionProofHash } = await queryOfferSelection(flow);
    const selected = await flow.assistedBookingApplication.selectAssistedSlot({
      bookingCaseId: `booking_case_${flow.seed}`,
      staffUserRef: `staff_actor_${flow.seed}`,
      offerSessionId: bundle.offerSession.offerSessionId,
      offerCandidateId: selectedCandidate.offerCandidateId,
      selectionToken: bundle.offerSession.selectionToken,
      selectionProofHash,
      commandActionRecordRef: `assisted_select_slot_${flow.seed}`,
      commandSettlementRecordRef: `assisted_select_slot_settlement_${flow.seed}`,
      occurredAt: "2026-04-18T12:10:00.000Z",
      payloadArtifactRef: `artifact://booking/offers/${flow.seed}/assist_select`,
      edgeCorrelationId: `edge_assisted_select_${flow.seed}`,
      ...buildBaseGuard(flow.seed),
    });
    expect(selected.session?.selectedSlotRef).toBe(
      selected.currentOfferSession?.offerSession.selectedNormalizedSlotRef,
    );

    const confirmed = await flow.assistedBookingApplication.confirmAssistedSlot({
      bookingCaseId: `booking_case_${flow.seed}`,
      staffUserRef: `staff_actor_${flow.seed}`,
      offerSessionId: bundle.offerSession.offerSessionId,
      commandActionRecordRef: `assisted_confirm_slot_${flow.seed}`,
      commandSettlementRecordRef: `assisted_confirm_slot_settlement_${flow.seed}`,
      occurredAt: "2026-04-18T12:15:00.000Z",
      idempotencyKey: `assisted_confirm_idempotency_${flow.seed}`,
      dispatchOutcome: {
        kind: "confirmation_pending",
        blockerReasonCode: "external_gate_pending",
        recoveryMode: "awaiting_supplier_confirmation",
      },
      expectedSelectionProofHash: selectionProofHash,
      payloadArtifactRef: `artifact://booking/commit/${flow.seed}/assist_confirm`,
      edgeCorrelationId: `edge_assisted_confirm_${flow.seed}`,
      ...buildBaseGuard(flow.seed),
    });

    expect(confirmed.currentCommit).not.toBeNull();
    expect(confirmed.currentCommit?.transaction.authoritativeOutcomeState).toBe(
      "confirmation_pending",
    );
    expect(confirmed.staffConfirmationAuthority.staffVisibleState).not.toBe("confirmed");
    expect(confirmed.taskCompletionGate.mayCloseTask).toBe(false);
    expect(confirmed.taskCompletionGate.mayLaunchNextTask).toBe(false);
    expect(confirmed.taskCompletionGate.blockingReasonRefs).toContain(
      "authoritative_booking_settlement_pending",
    );

    flow.taskCompletionState.authoritativeSettlementState = "settled";
    flow.taskCompletionState.nextTaskLaunchState = "ready";
    flow.taskCompletionState.blockingReasonRefs = [];
    const settled =
      await flow.assistedBookingApplication.queryCurrentAssistedBookingWorkspace(
        `booking_case_${flow.seed}`,
      );
    expect(settled?.taskCompletionGate.mayCloseTask).toBe(true);
    expect(settled?.taskCompletionGate.mayLaunchNextTask).toBe(true);
  });

  it("preserves slot-comparison focus while queue deltas refresh around the active session", async () => {
    const flow = await setupAssistedBookingFlow("291_focus");
    await flow.assistedBookingApplication.startAssistedBookingSession(
      buildStartSessionInput(flow.seed),
    );
    const searched = await flow.assistedBookingApplication.startAssistedSlotSearch(
      buildSlotSearchInput(flow.seed),
    );
    const candidateRefs = searched.currentOfferSession.offerCandidates
      .slice(0, 2)
      .map((candidate) => candidate.offerCandidateId);

    const compared = await flow.assistedBookingApplication.compareAssistedSlots({
      bookingCaseId: `booking_case_${flow.seed}`,
      requestedAt: "2026-04-18T12:09:00.000Z",
      candidateRefs,
      compareAnchorRefs: ["compare_anchor_primary", "compare_anchor_secondary"],
      focusProtectionLeaseRef: `focus_protection_lease_${flow.seed}`,
      protectedCompositionMode: "compare_review",
      protectedCompositionStateRef: `protected_composition_${flow.seed}`,
      ...buildBaseGuard(flow.seed),
    });
    expect(compared.session?.compareAnchorRefs).toEqual([
      "compare_anchor_primary",
      "compare_anchor_secondary",
    ]);
    expect(compared.session?.focusProtectionLeaseRef).toBe(
      `focus_protection_lease_${flow.seed}`,
    );

    await flow.assistedBookingApplication.assistedBookingService.upsertBookingExceptionQueueEntry({
      bookingCaseRef: `booking_case_${flow.seed}`,
      taskRef: `task_${flow.seed}`,
      assistedBookingSessionRef: compared.session.assistedBookingSessionId,
      exceptionFamily: "supplier_endpoint_unavailable",
      severity: "critical",
      selectedAnchorRef: "compare_anchor_primary",
      currentSnapshotRef: compared.session.currentSnapshotRef,
      reasonCodes: ["supplier_timeout"],
      evidenceRefs: ["supplier_probe_291_focus"],
      observedAt: "2026-04-18T12:09:30.000Z",
      sameShellRecoveryRouteRef: `/workspace/bookings/booking_case_${flow.seed}`,
    });

    const queue = await flow.assistedBookingApplication.queryBookingExceptionQueue({
      bookingCaseId: `booking_case_${flow.seed}`,
      taskId: `task_${flow.seed}`,
      entryStates: ["open", "claimed"],
    });
    expect(queue.some((entry) => entry.exceptionFamily === "supplier_endpoint_unavailable")).toBe(
      true,
    );

    const afterRefresh =
      await flow.assistedBookingApplication.queryCurrentAssistedBookingWorkspace(
        `booking_case_${flow.seed}`,
      );
    expect(afterRefresh?.session?.compareAnchorRefs).toEqual([
      "compare_anchor_primary",
      "compare_anchor_secondary",
    ]);
    expect(afterRefresh?.session?.focusProtectionLeaseRef).toBe(
      `focus_protection_lease_${flow.seed}`,
    );
  });

  it("fails closed on stale review leases, opens same-shell recovery, and clears stale-owner posture after reacquire", async () => {
    const flow = await setupAssistedBookingFlow("291_recovery");
    await flow.assistedBookingApplication.startAssistedBookingSession(
      buildStartSessionInput(flow.seed),
    );
    await flow.assistedBookingApplication.startAssistedSlotSearch(buildSlotSearchInput(flow.seed));
    const { bundle, selectedCandidate, selectionProofHash } = await queryOfferSelection(flow);

    await expect(
      flow.assistedBookingApplication.selectAssistedSlot({
        bookingCaseId: `booking_case_${flow.seed}`,
        staffUserRef: `staff_actor_${flow.seed}`,
        offerSessionId: bundle.offerSession.offerSessionId,
        offerCandidateId: selectedCandidate.offerCandidateId,
        selectionToken: bundle.offerSession.selectionToken,
        selectionProofHash,
        commandActionRecordRef: `assisted_select_slot_${flow.seed}`,
        commandSettlementRecordRef: `assisted_select_slot_settlement_${flow.seed}`,
        occurredAt: "2026-04-18T12:10:00.000Z",
        ...buildBaseGuard(flow.seed, {
          reviewActionLeaseRef: `stale_review_action_lease_${flow.seed}`,
        }),
      }),
    ).rejects.toThrow(/ASSISTED_FAIL_CLOSED/);

    const failed =
      await flow.assistedBookingApplication.queryCurrentAssistedBookingWorkspace(
        `booking_case_${flow.seed}`,
      );
    expect(failed?.session?.sessionState).toBe("stale_recoverable");
    expect(failed?.exceptionQueue.some((entry) => entry.exceptionFamily === "stale_owner_or_publication_drift")).toBe(
      true,
    );
    expect(flow.triageState.task.staleOwnerRecoveryRef).toBe(`stale_owner_recovery_${flow.seed}`);

    const reacquired = await flow.assistedBookingApplication.reacquireAssistedBookingTask({
      bookingCaseId: `booking_case_${flow.seed}`,
      taskId: `task_${flow.seed}`,
      staffUserRef: `staff_actor_${flow.seed}`,
      reacquiredAt: "2026-04-18T12:11:00.000Z",
      ownerSessionRef: `owner_session_${flow.seed}`,
      leaseTtlSeconds: 300,
    });
    expect(reacquired.session?.sessionState).toBe("active");
    expect(reacquired.session?.blockedReasonRefs).toEqual([]);
    expect(flow.triageState.task.staleOwnerRecoveryRef).toBeNull();
    expect(
      reacquired.exceptionQueue.some(
        (entry) => entry.exceptionFamily === "stale_owner_or_publication_drift",
      ),
    ).toBe(false);
  });

  it("rejects publication drift and same-supplier binding drift instead of widening staff capability illegally", async () => {
    const publicationFlow = await setupAssistedBookingFlow("291_publication");
    await publicationFlow.assistedBookingApplication.startAssistedBookingSession(
      buildStartSessionInput(publicationFlow.seed),
    );
    await publicationFlow.assistedBookingApplication.startAssistedSlotSearch(
      buildSlotSearchInput(publicationFlow.seed),
    );
    const publicationSelection = await queryOfferSelection(publicationFlow);

    await expect(
      publicationFlow.assistedBookingApplication.selectAssistedSlot({
        bookingCaseId: `booking_case_${publicationFlow.seed}`,
        staffUserRef: `staff_actor_${publicationFlow.seed}`,
        offerSessionId: publicationSelection.bundle.offerSession.offerSessionId,
        offerCandidateId: publicationSelection.selectedCandidate.offerCandidateId,
        selectionToken: publicationSelection.bundle.offerSession.selectionToken,
        selectionProofHash: publicationSelection.selectionProofHash,
        commandActionRecordRef: `assisted_select_slot_${publicationFlow.seed}`,
        commandSettlementRecordRef: `assisted_select_slot_settlement_${publicationFlow.seed}`,
        occurredAt: "2026-04-18T12:10:00.000Z",
        ...buildBaseGuard(publicationFlow.seed, {
          runtimePublicationBundleRef: `runtime_publication_stale_${publicationFlow.seed}`,
        }),
      }),
    ).rejects.toThrow(/ASSISTED_FAIL_CLOSED/);

    const publicationFailed =
      await publicationFlow.assistedBookingApplication.queryCurrentAssistedBookingWorkspace(
        `booking_case_${publicationFlow.seed}`,
      );
    expect(
      publicationFailed?.exceptionQueue.some(
        (entry) =>
          entry.exceptionFamily === "stale_owner_or_publication_drift" &&
          entry.reasonCodes.includes("assisted_runtime_publication_drift"),
      ),
    ).toBe(true);

    const bindingFlow = await setupAssistedBookingFlow("291_binding");
    await bindingFlow.assistedBookingApplication.startAssistedBookingSession(
      buildStartSessionInput(bindingFlow.seed),
    );
    await bindingFlow.assistedBookingApplication.startAssistedSlotSearch(
      buildSlotSearchInput(bindingFlow.seed),
    );

    await mutateCapabilityRow(
      bindingFlow.capabilityRepositories,
      (row) =>
        row.supplierRef === "vecells_local_gateway" &&
        row.integrationMode === "local_gateway_component" &&
        row.deploymentType === "practice_local_gateway",
      (row) => ({
        ...row,
        publishedAt: "2026-04-19T08:00:00.000Z",
        searchNormalizationContractRef: `${row.searchNormalizationContractRef}.rotated`,
        rowHash: `${row.rowHash}_rotated`,
      }),
    );

    await expect(
      bindingFlow.assistedBookingApplication.refreshAssistedCapabilityResolution({
        bookingCaseId: `booking_case_${bindingFlow.seed}`,
        staffUserRef: `staff_actor_${bindingFlow.seed}`,
        routeIntentBindingRef: `route_intent_assisted_${bindingFlow.seed}`,
        commandActionRecordRef: `refresh_assisted_capability_${bindingFlow.seed}`,
        commandSettlementRecordRef: `refresh_assisted_capability_settlement_${bindingFlow.seed}`,
        refreshedAt: "2026-04-18T12:20:00.000Z",
        ...buildBaseGuard(bindingFlow.seed),
      }),
    ).rejects.toThrow(/ASSISTED_PROVIDER_BINDING_MISMATCH/);
  });

  it("surfaces linkage-required blockers and reminder delivery failures in one explicit exception queue", async () => {
    const linkageFlow = await setupAssistedBookingFlow("291_linkage");
    await mutateCapabilityRow(
      linkageFlow.capabilityRepositories,
      (row) =>
        row.supplierRef === "vecells_local_gateway" &&
        row.integrationMode === "local_gateway_component" &&
        row.deploymentType === "practice_local_gateway",
      (row) => ({
        ...row,
        capabilities: {
          ...row.capabilities,
          requires_gp_linkage_details: true,
        },
        rowHash: `${row.rowHash}_linkage_required`,
      }),
    );

    const linked = await linkageFlow.assistedBookingApplication.startAssistedBookingSession(
      buildStartSessionInput(linkageFlow.seed, {
        gpLinkageCheckpointRef: `gp_linkage_checkpoint_${linkageFlow.seed}`,
        gpLinkageStatus: "missing",
      }),
    );
    expect(linked.session?.sessionState).toBe("recovery_required");
    expect(linked.capability?.resolution.capabilityState).toBe("linkage_required");
    expect(
      linked.exceptionQueue.some((entry) => entry.exceptionFamily === "linkage_required_blocker"),
    ).toBe(true);

    const reminderFlow = await setupAssistedBookingFlow("291_reminder");
    await reminderFlow.assistedBookingApplication.startAssistedBookingSession(
      buildStartSessionInput(reminderFlow.seed),
    );
    await reminderFlow.assistedBookingApplication.startAssistedSlotSearch(
      buildSlotSearchInput(reminderFlow.seed),
    );
    const reminderSelection = await queryOfferSelection(reminderFlow);
    await reminderFlow.assistedBookingApplication.selectAssistedSlot({
      bookingCaseId: `booking_case_${reminderFlow.seed}`,
      staffUserRef: `staff_actor_${reminderFlow.seed}`,
      offerSessionId: reminderSelection.bundle.offerSession.offerSessionId,
      offerCandidateId: reminderSelection.selectedCandidate.offerCandidateId,
      selectionToken: reminderSelection.bundle.offerSession.selectionToken,
      selectionProofHash: reminderSelection.selectionProofHash,
      commandActionRecordRef: `assisted_select_slot_${reminderFlow.seed}`,
      commandSettlementRecordRef: `assisted_select_slot_settlement_${reminderFlow.seed}`,
      occurredAt: "2026-04-18T12:10:00.000Z",
      ...buildBaseGuard(reminderFlow.seed),
    });
    await reminderFlow.assistedBookingApplication.confirmAssistedSlot({
      bookingCaseId: `booking_case_${reminderFlow.seed}`,
      staffUserRef: `staff_actor_${reminderFlow.seed}`,
      offerSessionId: reminderSelection.bundle.offerSession.offerSessionId,
      commandActionRecordRef: `assisted_confirm_slot_${reminderFlow.seed}`,
      commandSettlementRecordRef: `assisted_confirm_slot_settlement_${reminderFlow.seed}`,
      occurredAt: "2026-04-18T12:15:00.000Z",
      idempotencyKey: `assisted_confirm_idempotency_${reminderFlow.seed}`,
      dispatchOutcome: {
        kind: "authoritative_success",
        authoritativeProofClass: "durable_provider_reference",
        providerReference: `provider_reference_${reminderFlow.seed}`,
        settlementRef: `settlement_${reminderFlow.seed}`,
      },
      expectedSelectionProofHash: reminderSelection.selectionProofHash,
      ...buildBaseGuard(reminderFlow.seed),
    });

    const reminderPlan =
      await reminderFlow.assistedBookingApplication.reminderApplication.createOrRefreshReminderPlan(
        buildReminderInput(reminderFlow.seed),
      );
    await reminderFlow.assistedBookingApplication.reminderApplication.markReminderRepairRequired({
      reminderPlanId: reminderPlan.reminderPlan.reminderPlanId,
      commandActionRecordRef: `mark_reminder_repair_${reminderFlow.seed}`,
      commandSettlementRecordRef: `mark_reminder_repair_settlement_${reminderFlow.seed}`,
      markedAt: "2026-04-18T12:50:00.000Z",
      reasonCodes: ["provider_delivery_failure"],
    });

    const refreshedQueue = await reminderFlow.assistedBookingApplication.refreshBookingExceptionQueue({
      bookingCaseId: `booking_case_${reminderFlow.seed}`,
      taskId: `task_${reminderFlow.seed}`,
    });
    expect(
      refreshedQueue.some((entry) => entry.exceptionFamily === "reminder_delivery_failure"),
    ).toBe(true);
  });
});
