import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { createPhase4BookingCapabilityEngineStore } from "@vecells/domain-booking";
import { serviceDefinition } from "../src/service-definition.ts";
import {
  PHASE4_APPOINTMENT_MANAGE_QUERY_SURFACES,
  PHASE4_APPOINTMENT_MANAGE_SCHEMA_VERSION,
  PHASE4_APPOINTMENT_MANAGE_SERVICE_NAME,
  createPhase4AppointmentManageApplication,
  phase4AppointmentManageMigrationPlanRefs,
  phase4AppointmentManagePersistenceTables,
  phase4AppointmentManageRoutes,
} from "../src/phase4-appointment-manage.ts";
import { createPhase4BookingCaseApplication } from "../src/phase4-booking-case.ts";
import { createPhase4BookingCapabilityApplication } from "../src/phase4-booking-capability.ts";
import { createPhase4SlotSearchApplication } from "../src/phase4-slot-search.ts";
import { createPhase4CapacityRankApplication } from "../src/phase4-capacity-rank-offers.ts";
import { createPhase4BookingReservationApplication } from "../src/phase4-booking-reservations.ts";
import { createPhase4BookingCommitApplication } from "../src/phase4-booking-commit.ts";

function buildDirectResolutionBundle(seed = "288") {
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

function buildSearchPolicy(seed = "288") {
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
    bookabilityPolicy: "patient_visible_slots_only",
    selectionAudience: "staff_assist",
    patientChannelMode: "staff_proxy",
    policyBundleHash: `policy_bundle_hash_${seed}`,
    sameBandReorderSlackMinutesByWindow: { early: 10, standard: 20 },
  };
}

function buildSearchWindows(seed = "288") {
  return [
    {
      supplierRef: "vecells_local_gateway",
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
          continuityScore: 0.4,
          restrictions: [],
          bookabilityMode: "dual",
          inventoryLineageRef: `inventory_lineage_b_${seed}`,
          sourceVersionRef: `supplier_version_b_${seed}`,
        },
      ],
    },
  ];
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

async function enableExclusiveHold(
  capabilityRepositories,
  supplierRef,
  integrationMode,
  deploymentType,
) {
  const rows = await capabilityRepositories.listProviderCapabilityMatrixRows();
  const target = rows
    .map((row) => row.toSnapshot())
    .find(
      (row) =>
        row.supplierRef === supplierRef &&
        row.integrationMode === integrationMode &&
        row.deploymentType === deploymentType,
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

async function selectCurrentOffer(flow, label) {
  const bundle = await flow.capacityRankApplication.queryCurrentOfferSession({
    bookingCaseId: `booking_case_${flow.seed}`,
  });
  const candidate = bundle.offerCandidates[0];
  const selectionProofHash = buildSelectionProofHash(bundle, candidate);
  const selected = await flow.capacityRankApplication.selectOfferCandidate({
    offerSessionId: bundle.offerSession.offerSessionId,
    offerCandidateId: candidate.offerCandidateId,
    selectionToken: bundle.offerSession.selectionToken,
    selectionProofHash,
    actorRef: `actor_${flow.seed}`,
    subjectRef: `staff_actor_${flow.seed}`,
    commandActionRecordRef: `${label}_select_offer_candidate_${flow.seed}`,
    commandSettlementRecordRef: `${label}_select_offer_candidate_settlement_${flow.seed}`,
    occurredAt: "2026-04-18T12:21:00.000Z",
    payloadArtifactRef: `artifact://booking/offers/${flow.seed}/${label}/selection`,
    edgeCorrelationId: `${label}_offer_selection_edge_${flow.seed}`,
  });
  return { selected, selectionProofHash };
}

async function setupManagedAppointmentFlow(seed = "288") {
  const bookingCaseApplication = createPhase4BookingCaseApplication({
    directResolutionApplication: {
      async queryTaskDirectResolution() {
        return structuredClone(buildDirectResolutionBundle(seed));
      },
    },
  });
  const capabilityRepositories = createPhase4BookingCapabilityEngineStore();
  await enableExclusiveHold(
    capabilityRepositories,
    "gp_connect_existing",
    "gp_connect_existing",
    "hscn_direct_care_consumer",
  );
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
  const appointmentManageApplication = createPhase4AppointmentManageApplication({
    bookingCaseApplication,
    bookingCapabilityApplication,
    slotSearchApplication,
    capacityRankApplication,
    bookingReservationApplication,
    bookingCommitApplication,
  });

  await bookingCaseApplication.createBookingCaseFromTaskHandoff({
    taskId: `task_${seed}`,
    bookingCaseId: `booking_case_${seed}`,
    patientRef: `patient_${seed}`,
    tenantId: "tenant_vecells_beta",
    providerContext: {
      practiceRef: "ods_A83002",
      supplierHintRef: "gp_connect_existing",
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

  const capability = await bookingCapabilityApplication.resolveBookingCaseCapability({
    bookingCaseId: `booking_case_${seed}`,
    tenantId: "tenant_vecells_beta",
    practiceRef: "ods_A83002",
    organisationRef: "org_vecells_beta",
    supplierRef: "gp_connect_existing",
    integrationMode: "gp_connect_existing",
    deploymentType: "hscn_direct_care_consumer",
    selectionAudience: "staff",
    requestedActionScope: "search_slots",
    gpLinkageCheckpointRef: null,
    gpLinkageStatus: "not_required",
    localConsumerCheckpointRef: null,
    localConsumerStatus: "not_required",
    supplierDegradationStatus: "nominal",
    publicationState: "published",
    assuranceTrustState: "writable",
    routeIntentBindingRef: `route_intent_booking_${seed}`,
    surfaceRouteContractRef: `surface_route_booking_${seed}`,
    surfacePublicationRef: `surface_publication_booking_${seed}`,
    runtimePublicationBundleRef: `runtime_publication_booking_${seed}`,
    governingObjectDescriptorRef: "BookingCase",
    governingObjectRef: `booking_case_${seed}`,
    governingObjectVersionRef: `booking_case_${seed}_v1`,
    parentAnchorRef: `booking_anchor_${seed}`,
    commandActionRecordRef: `resolve_capability_case_${seed}`,
    commandSettlementRecordRef: `resolve_capability_case_settlement_${seed}`,
    subjectRef: `staff_actor_${seed}`,
    evaluatedAt: "2026-04-18T12:00:00.000Z",
  });

  await bookingCaseApplication.markCapabilityChecked({
    bookingCaseId: `booking_case_${seed}`,
    actorRef: `actor_${seed}`,
    routeIntentBindingRef: `route_intent_${seed}`,
    commandActionRecordRef: `mark_capability_checked_${seed}`,
    commandSettlementRecordRef: `mark_capability_checked_settlement_${seed}`,
    recordedAt: "2026-04-18T10:00:00.000Z",
    sourceDecisionEpochRef: `decision_epoch_${seed}`,
    sourceDecisionSupersessionRef: null,
    lineageCaseLinkRef: `lineage_case_link_${seed}`,
    requestLifecycleLeaseRef: `request_lease_${seed}`,
    ownershipEpoch: 4,
    fencingToken: `fencing_token_${seed}`,
    currentLineageFenceEpoch: 7,
    reasonCode: "capability_tuple_current",
  });

  await bookingCaseApplication.beginLocalSearch({
    bookingCaseId: `booking_case_${seed}`,
    actorRef: `actor_${seed}`,
    routeIntentBindingRef: `route_intent_${seed}`,
    commandActionRecordRef: `begin_local_search_${seed}`,
    commandSettlementRecordRef: `begin_local_search_settlement_${seed}`,
    recordedAt: "2026-04-18T10:05:00.000Z",
    sourceDecisionEpochRef: `decision_epoch_${seed}`,
    sourceDecisionSupersessionRef: null,
    lineageCaseLinkRef: `lineage_case_link_${seed}`,
    requestLifecycleLeaseRef: `request_lease_${seed}`,
    ownershipEpoch: 4,
    fencingToken: `fencing_token_${seed}`,
    currentLineageFenceEpoch: 7,
    reasonCode: "capability_live_for_search",
    activeCapabilityResolutionRef: capability.resolution.bookingCapabilityResolutionId,
    activeCapabilityProjectionRef: capability.projection.bookingCapabilityProjectionId,
    activeProviderAdapterBindingRef: capability.providerAdapterBinding.bookingProviderAdapterBindingId,
    capabilityState: capability.resolution.capabilityState,
    searchPolicy: buildSearchPolicy(seed),
  });

  await slotSearchApplication.startSlotSearch({
    bookingCaseId: `booking_case_${seed}`,
    displayTimeZone: "Europe/London",
      supplierWindows: buildSearchWindows(seed).map((window) => ({
        ...window,
        supplierRef: "gp_connect_existing",
      })),
    commandActionRecordRef: `slot_search_action_${seed}`,
    commandSettlementRecordRef: `slot_search_settlement_${seed}`,
    subjectRef: `staff_actor_${seed}`,
    occurredAt: "2026-04-18T12:10:00.000Z",
    payloadArtifactRef: `artifact://booking/search/${seed}`,
    edgeCorrelationId: `edge_correlation_${seed}`,
    expiresInSeconds: 900,
  });

  await capacityRankApplication.createOfferSessionFromCurrentSnapshot({
    bookingCaseId: `booking_case_${seed}`,
    actorRef: `actor_${seed}`,
    subjectRef: `staff_actor_${seed}`,
    commandActionRecordRef: `offer_session_action_${seed}`,
    commandSettlementRecordRef: `offer_session_settlement_${seed}`,
    occurredAt: "2026-04-18T12:20:00.000Z",
    payloadArtifactRef: `artifact://booking/offers/${seed}`,
    edgeCorrelationId: `offer_edge_${seed}`,
  });

  const { selected, selectionProofHash } = await selectCurrentOffer(
    {
      seed,
      capacityRankApplication,
    },
    "initial",
  );

  const committed = await bookingCommitApplication.beginCommitFromSelectedOffer({
    bookingCaseId: `booking_case_${seed}`,
    offerSessionId: selected.offerSession.offerSessionId,
    actorRef: `actor_${seed}`,
    subjectRef: `staff_actor_${seed}`,
    commandActionRecordRef: `begin_commit_action_${seed}`,
    commandSettlementRecordRef: `begin_commit_settlement_${seed}`,
    occurredAt: "2026-04-18T12:25:00.000Z",
    idempotencyKey: `idempotency_key_${seed}`,
    dispatchOutcome: {
      kind: "authoritative_success",
      authoritativeProofClass: "durable_provider_reference",
      providerReference: `provider_reference_${seed}`,
      settlementRef: `settlement_${seed}`,
    },
    expectedSelectionProofHash: selectionProofHash,
    expectedRequestLifecycleLeaseRef: `request_lease_${seed}`,
    expectedOwnershipEpochRef: 4,
    expectedSourceDecisionEpochRef: `decision_epoch_${seed}`,
    expectedRuntimePublicationBundleRef: `runtime_publication_${seed}`,
    expectedSurfacePublicationRef: `surface_publication_${seed}`,
    reviewActionLeaseRef: `review_action_lease_${seed}`,
    payloadArtifactRef: `artifact://booking/commit/${seed}`,
    edgeCorrelationId: `edge_commit_${seed}`,
  });

  const managed = await bookingCaseApplication.markManaged({
    bookingCaseId: `booking_case_${seed}`,
    actorRef: `actor_${seed}`,
    routeIntentBindingRef: `route_intent_${seed}`,
    commandActionRecordRef: `mark_managed_after_commit_${seed}`,
    commandSettlementRecordRef: `mark_managed_after_commit_settlement_${seed}`,
    recordedAt: "2026-04-18T12:27:00.000Z",
    sourceDecisionEpochRef: `decision_epoch_${seed}`,
    sourceDecisionSupersessionRef: null,
    lineageCaseLinkRef: `lineage_case_link_${seed}`,
    requestLifecycleLeaseRef: `request_lease_${seed}`,
    ownershipEpoch: 4,
    fencingToken: `fencing_token_${seed}`,
    currentLineageFenceEpoch: 7,
    reasonCode: "booking_ready_for_manage",
    currentOfferSessionRef: selected.offerSession.offerSessionId,
    selectedSlotRef: committed.transaction.selectedSlotRef,
    appointmentRef: committed.appointmentRecord.appointmentRecordId,
    latestConfirmationTruthProjectionRef:
      committed.confirmationTruthProjection.bookingConfirmationTruthProjectionId,
  });

  return {
    seed,
    bookingCaseApplication,
    bookingCapabilityApplication,
    slotSearchApplication,
    capacityRankApplication,
    bookingReservationApplication,
    bookingCommitApplication,
    appointmentManageApplication,
    appointmentRecord: committed.appointmentRecord,
    confirmationTruthProjection: committed.confirmationTruthProjection,
    bookingCase: managed,
  };
}

function buildManageInput(flow, overrides = {}) {
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
    occurredAt: "2026-04-18T13:00:00.000Z",
    idempotencyKey: `manage_idempotency_${flow.seed}`,
    payloadArtifactRef: `artifact://booking/manage/${flow.seed}`,
    edgeCorrelationId: `edge_manage_${flow.seed}`,
    ...overrides,
  };
}

describe("phase4 appointment manage application", () => {
  it("publishes the 288 service metadata and authoritative cancel path in the route catalog", async () => {
    expect(PHASE4_APPOINTMENT_MANAGE_SERVICE_NAME).toBe(
      "Phase4AppointmentManageCommandApplication",
    );
    expect(PHASE4_APPOINTMENT_MANAGE_SCHEMA_VERSION).toBe(
      "288.phase4.appointment-manage-command-layer.v1",
    );
    expect(PHASE4_APPOINTMENT_MANAGE_QUERY_SURFACES).toContain(
      "GET /v1/appointments/{appointmentId}/manage/current",
    );
    expect(phase4AppointmentManagePersistenceTables).toEqual(
      expect.arrayContaining([
        "phase4_appointment_manage_commands",
        "phase4_booking_manage_settlements",
        "phase4_booking_continuity_evidence_projections",
      ]),
    );
    expect(phase4AppointmentManageMigrationPlanRefs).toContain(
      "services/command-api/migrations/137_phase4_appointment_manage_command_layer.sql",
    );
    for (const routeId of [
      "appointment_manage_current",
      "appointment_submit_cancel",
      "appointment_submit_reschedule",
      "appointment_abandon_reschedule",
      "appointment_submit_detail_update",
    ]) {
      expect(phase4AppointmentManageRoutes.some((route) => route.routeId === routeId)).toBe(true);
      expect(serviceDefinition.routeCatalog.some((route) => route.routeId === routeId)).toBe(true);
    }
  });

  it("authoritatively cancels an appointment and closes the booking case only after cancellation truth exists", async () => {
    const flow = await setupManagedAppointmentFlow("288_cancelled");

    const result = await flow.appointmentManageApplication.submitCancelAppointment({
      ...buildManageInput(flow, {
        commandActionRecordRef: "cancel_action_288_cancelled",
        commandSettlementRecordRef: "cancel_settlement_288_cancelled",
        idempotencyKey: "cancel_idempotency_288_cancelled",
      }),
      cancelReasonCode: "patient_requested_cancellation",
      supplierOutcome: {
        kind: "authoritative_cancelled",
      },
    });

    expect(result.appointmentRecord.appointmentStatus).toBe("cancelled");
    expect(result.currentManage?.settlement.result).toBe("applied");
    expect(result.continuityEvidence.continuityState).toBe("summary_only");
    expect(result.continuityEvidence.writableState).toBe("summary_only");
    expect(result.bookingCase.bookingCase.status).toBe("closed");
    expect(result.emittedEvents.map((event) => event.eventType)).toEqual(
      expect.arrayContaining(["booking.cancelled", "booking.manage.continuity.updated"]),
    );
  });

  it("keeps cancellation pending and the case managed while supplier truth is unresolved", async () => {
    const flow = await setupManagedAppointmentFlow("288_pending_cancel");

    const result = await flow.appointmentManageApplication.submitCancelAppointment({
      ...buildManageInput(flow, {
        commandActionRecordRef: "cancel_action_288_pending_cancel",
        commandSettlementRecordRef: "cancel_settlement_288_pending_cancel",
        idempotencyKey: "cancel_idempotency_288_pending_cancel",
      }),
      cancelReasonCode: "patient_requested_cancellation",
      supplierOutcome: {
        kind: "supplier_pending",
        blockerReasonCode: "awaiting_supplier_cancellation",
        recoveryMode: "awaiting_cancellation_confirmation",
      },
    });

    expect(result.appointmentRecord.appointmentStatus).toBe("cancellation_pending");
    expect(result.currentManage?.settlement.result).toBe("supplier_pending");
    expect(result.bookingCase.bookingCase.status).toBe("managed");
    expect(result.continuityEvidence.continuityState).toBe("summary_only");
    expect(result.continuityEvidence.writableState).toBe("summary_only");
    expect(result.emittedEvents.map((event) => event.eventType)).toEqual([
      "booking.manage.continuity.updated",
    ]);
  });

  it("fails closed on stale route, capability, and continuity tuples instead of mutating the appointment", async () => {
    const flow = await setupManagedAppointmentFlow("288_stale");

    const result = await flow.appointmentManageApplication.submitAppointmentDetailUpdate({
      ...buildManageInput(flow, {
        commandActionRecordRef: "detail_action_288_stale",
        commandSettlementRecordRef: "detail_settlement_288_stale",
        idempotencyKey: "detail_idempotency_288_stale",
        expectedRouteIntentTupleHash: "stale_route_tuple_hash",
        expectedCapabilityTupleHash: "stale_capability_tuple_hash",
        expectedContinuityEvidenceRef: "stale_continuity_ref",
      }),
      details: {
        administrativeNote: "Please leave at reception",
      },
    });

    expect(result.currentManage?.settlement.result).toBe("stale_recoverable");
    expect(result.currentManage?.settlement.reasonCodes).toEqual(
      expect.arrayContaining([
        "stale_capability_tuple",
        "stale_continuity_evidence",
        "stale_route_tuple",
      ]),
    );
    expect(result.appointmentRecord.administrativeDetails).toEqual({});
  });

  it("starts a governed reschedule chain and can safely abandon it back to the source appointment", async () => {
    const flow = await setupManagedAppointmentFlow("288_abandon");

    const started = await flow.appointmentManageApplication.submitRescheduleAppointment({
      ...buildManageInput(flow, {
        commandActionRecordRef: "reschedule_action_288_abandon",
        commandSettlementRecordRef: "reschedule_settlement_288_abandon",
        idempotencyKey: "reschedule_idempotency_288_abandon",
      }),
      bootstrapReplacementSearch: {
        occurredAt: "2026-04-18T13:10:00.000Z",
        displayTimeZone: "Europe/London",
        supplierWindows: buildSearchWindows("288_abandon_replacement").map((window) => ({
          ...window,
          supplierRef: "gp_connect_existing",
        })),
        searchCommandActionRecordRef: "replacement_search_action_288_abandon",
        searchCommandSettlementRecordRef: "replacement_search_settlement_288_abandon",
        offerCommandActionRecordRef: "replacement_offer_action_288_abandon",
        offerCommandSettlementRecordRef: "replacement_offer_settlement_288_abandon",
      },
    });

    expect(started.appointmentRecord.appointmentStatus).toBe("reschedule_in_progress");
    expect(started.currentManage?.settlement.result).toBe("applied");
    expect(started.bookingCase.bookingCase.status).toBe("offers_ready");
    expect(started.replacementOfferSessionId).not.toBeNull();

    const restored = await flow.appointmentManageApplication.abandonAppointmentReschedule({
      ...buildManageInput(flow, {
        commandActionRecordRef: "reschedule_restore_action_288_abandon",
        commandSettlementRecordRef: "reschedule_restore_settlement_288_abandon",
        idempotencyKey: "reschedule_restore_idempotency_288_abandon",
      }),
      reasonCodes: ["patient_stopped_reschedule"],
    });

    expect(restored.appointmentRecord.appointmentStatus).toBe("booked");
    expect(restored.currentManage?.settlement.actionScope).toBe("appointment_reschedule_abandon");
    expect(restored.currentManage?.settlement.result).toBe("applied");
    expect(restored.bookingCase.bookingCase.status).toBe("managed");
    expect(restored.continuityEvidence.writableState).toBe("writable");
  });

  it("reuses the same booking engine for replacement success and supersedes the source appointment linearly", async () => {
    const flow = await setupManagedAppointmentFlow("288_supersede");

    const started = await flow.appointmentManageApplication.submitRescheduleAppointment({
      ...buildManageInput(flow, {
        commandActionRecordRef: "reschedule_action_288_supersede",
        commandSettlementRecordRef: "reschedule_settlement_288_supersede",
        idempotencyKey: "reschedule_idempotency_288_supersede",
      }),
      bootstrapReplacementSearch: {
        occurredAt: "2026-04-18T13:10:00.000Z",
        displayTimeZone: "Europe/London",
        supplierWindows: buildSearchWindows("288_supersede_replacement").map((window) => ({
          ...window,
          supplierRef: "gp_connect_existing",
        })),
        searchCommandActionRecordRef: "replacement_search_action_288_supersede",
        searchCommandSettlementRecordRef: "replacement_search_settlement_288_supersede",
        offerCommandActionRecordRef: "replacement_offer_action_288_supersede",
        offerCommandSettlementRecordRef: "replacement_offer_settlement_288_supersede",
      },
    });

    expect(started.replacementOfferSessionId).not.toBeNull();

    const { selected, selectionProofHash } = await selectCurrentOffer(flow, "replacement");
    const replacementCommit = await flow.bookingCommitApplication.beginCommitFromSelectedOffer({
      bookingCaseId: `booking_case_${flow.seed}`,
      offerSessionId: selected.offerSession.offerSessionId,
      actorRef: `actor_${flow.seed}`,
      subjectRef: `staff_actor_${flow.seed}`,
      commandActionRecordRef: `replacement_begin_commit_action_${flow.seed}`,
      commandSettlementRecordRef: `replacement_begin_commit_settlement_${flow.seed}`,
      occurredAt: "2026-04-18T13:20:00.000Z",
      idempotencyKey: `replacement_commit_idempotency_${flow.seed}`,
      dispatchOutcome: {
        kind: "authoritative_success",
        authoritativeProofClass: "durable_provider_reference",
        providerReference: `replacement_provider_reference_${flow.seed}`,
        settlementRef: `replacement_settlement_${flow.seed}`,
      },
      expectedSelectionProofHash: selectionProofHash,
      expectedRequestLifecycleLeaseRef: `request_lease_${flow.seed}`,
      expectedOwnershipEpochRef: 4,
      expectedSourceDecisionEpochRef: `decision_epoch_${flow.seed}`,
      expectedRuntimePublicationBundleRef: `runtime_publication_${flow.seed}`,
      expectedSurfacePublicationRef: `surface_publication_${flow.seed}`,
      reviewActionLeaseRef: `replacement_review_action_lease_${flow.seed}`,
      payloadArtifactRef: `artifact://booking/commit/replacement/${flow.seed}`,
      edgeCorrelationId: `edge_commit_replacement_${flow.seed}`,
    });
    await flow.bookingCaseApplication.markManaged({
      bookingCaseId: `booking_case_${flow.seed}`,
      actorRef: `actor_${flow.seed}`,
      routeIntentBindingRef: `route_intent_${flow.seed}`,
      commandActionRecordRef: `replacement_mark_managed_${flow.seed}`,
      commandSettlementRecordRef: `replacement_mark_managed_settlement_${flow.seed}`,
      recordedAt: "2026-04-18T13:25:00.000Z",
      sourceDecisionEpochRef: `decision_epoch_${flow.seed}`,
      sourceDecisionSupersessionRef: null,
      lineageCaseLinkRef: `lineage_case_link_${flow.seed}`,
      requestLifecycleLeaseRef: `request_lease_${flow.seed}`,
      ownershipEpoch: 4,
      fencingToken: `fencing_token_${flow.seed}`,
      currentLineageFenceEpoch: 7,
      reasonCode: "replacement_booking_ready_for_manage",
      currentOfferSessionRef: selected.offerSession.offerSessionId,
      selectedSlotRef: replacementCommit.transaction.selectedSlotRef,
      appointmentRef: replacementCommit.appointmentRecord.appointmentRecordId,
      latestConfirmationTruthProjectionRef:
        replacementCommit.confirmationTruthProjection.bookingConfirmationTruthProjectionId,
    });

    const queried = await flow.appointmentManageApplication.queryCurrentAppointmentManage({
      appointmentId: flow.appointmentRecord.appointmentRecordId,
      actorMode: "staff",
    });

    expect(queried.appointmentRecord.appointmentStatus).toBe("superseded");
    expect(queried.appointmentRecord.supersededByAppointmentRef).toBe(
      replacementCommit.appointmentRecord.appointmentRecordId,
    );
    expect(queried.currentAppointmentRecord?.supersedesAppointmentRef).toBe(
      flow.appointmentRecord.appointmentRecordId,
    );
  });

  it("routes clinically meaningful detail text to safety preemption and contact-dependent updates to repair", async () => {
    const safetyFlow = await setupManagedAppointmentFlow("288_safety");

    const safety = await safetyFlow.appointmentManageApplication.submitAppointmentDetailUpdate({
      ...buildManageInput(safetyFlow, {
        commandActionRecordRef: "detail_action_288_safety",
        commandSettlementRecordRef: "detail_settlement_288_safety",
        idempotencyKey: "detail_idempotency_288_safety",
      }),
      details: {
        administrativeNote: "My breathing is worse and chest pain has started",
      },
    });

    expect(safety.currentManage?.settlement.result).toBe("safety_preempted");
    expect(safety.currentManage?.settlement.recoveryRouteRef).toBe("request_shell_safety_preempted");

    const repairFlow = await setupManagedAppointmentFlow("288_repair");
    const repair = await repairFlow.appointmentManageApplication.submitAppointmentDetailUpdate({
      ...buildManageInput(repairFlow, {
        commandActionRecordRef: "detail_action_288_repair",
        commandSettlementRecordRef: "detail_settlement_288_repair",
        idempotencyKey: "detail_idempotency_288_repair",
      }),
      details: {
        contactPhone: "07123456789",
      },
      contactDependencyState: "blocked",
    });

    expect(repair.currentManage?.settlement.result).toBe("stale_recoverable");
    expect(repair.currentManage?.settlement.reasonCodes).toContain("contact_route_dependency_blocked");
    expect(repair.currentManage?.settlement.contactRouteRepairJourneyRef).toBe(
      `contact_route_repair_journey_${repairFlow.appointmentRecord.appointmentRecordId}`,
    );
  });
});
