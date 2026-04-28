import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { createPhase4BookingCapabilityEngineStore } from "@vecells/domain-booking";
import { serviceDefinition } from "../src/service-definition.ts";
import {
  PHASE4_BOOKING_REMINDER_QUERY_SURFACES,
  PHASE4_BOOKING_REMINDER_SCHEMA_VERSION,
  PHASE4_BOOKING_REMINDER_SERVICE_NAME,
  createPhase4BookingReminderApplication,
  phase4BookingReminderMigrationPlanRefs,
  phase4BookingReminderPersistenceTables,
  phase4BookingReminderRoutes,
} from "../src/phase4-booking-reminders.ts";
import { createPhase4BookingCaseApplication } from "../src/phase4-booking-case.ts";
import { createPhase4BookingCapabilityApplication } from "../src/phase4-booking-capability.ts";
import { createPhase4SlotSearchApplication } from "../src/phase4-slot-search.ts";
import { createPhase4CapacityRankApplication } from "../src/phase4-capacity-rank-offers.ts";
import { createPhase4BookingReservationApplication } from "../src/phase4-booking-reservations.ts";
import { createPhase4BookingCommitApplication } from "../src/phase4-booking-commit.ts";

function buildDirectResolutionBundle(seed = "289") {
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

function buildSearchPolicy(seed = "289") {
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

function buildSearchWindows(seed = "289") {
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

async function setupCommitFlow(options = {}) {
  const seed = options.seed ?? "289";
  const bookingCaseApplication = createPhase4BookingCaseApplication({
    directResolutionApplication: {
      async queryTaskDirectResolution() {
        return structuredClone(buildDirectResolutionBundle(seed));
      },
    },
  });
  const capabilityRepositories = createPhase4BookingCapabilityEngineStore();
  if (options.forceExclusiveHold ?? true) {
    await enableExclusiveHold(capabilityRepositories);
  }
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

  const capability = await bookingCapabilityApplication.resolveBookingCaseCapability({
    bookingCaseId: `booking_case_${seed}`,
    tenantId: "tenant_vecells_beta",
    practiceRef: "ods_A83002",
    organisationRef: "org_vecells_beta",
    supplierRef: "vecells_local_gateway",
    integrationMode: "local_gateway_component",
    deploymentType: "practice_local_gateway",
    selectionAudience: "staff",
    requestedActionScope: "search_slots",
    gpLinkageCheckpointRef: null,
    gpLinkageStatus: "not_required",
    localConsumerCheckpointRef: `local_component_checkpoint_${seed}`,
    localConsumerStatus: "ready",
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
    recordedAt: "2026-04-18T12:01:00.000Z",
    sourceDecisionEpochRef: `decision_epoch_${seed}`,
    sourceDecisionSupersessionRef: null,
    lineageCaseLinkRef: `lineage_case_link_${seed}`,
    requestLifecycleLeaseRef: `request_lease_${seed}`,
    ownershipEpoch: 4,
    fencingToken: `fencing_token_${seed}`,
    currentLineageFenceEpoch: 7,
    reasonCode: "capability_checked",
    activeCapabilityResolutionRef: capability.resolution.bookingCapabilityResolutionId,
    activeCapabilityProjectionRef: capability.projection.bookingCapabilityProjectionId,
    activeProviderAdapterBindingRef:
      capability.providerAdapterBinding.bookingProviderAdapterBindingId,
    capabilityState: capability.resolution.capabilityState,
    surfaceRouteContractRef: "booking_route_contract_v1",
    surfacePublicationRef: `surface_publication_${seed}`,
    runtimePublicationBundleRef: `runtime_publication_${seed}`,
  });

  await bookingCaseApplication.beginLocalSearch({
    bookingCaseId: `booking_case_${seed}`,
    actorRef: `actor_${seed}`,
    routeIntentBindingRef: `route_intent_${seed}`,
    commandActionRecordRef: `begin_local_search_${seed}`,
    commandSettlementRecordRef: `begin_local_search_settlement_${seed}`,
    recordedAt: "2026-04-18T12:02:00.000Z",
    sourceDecisionEpochRef: `decision_epoch_${seed}`,
    sourceDecisionSupersessionRef: null,
    lineageCaseLinkRef: `lineage_case_link_${seed}`,
    requestLifecycleLeaseRef: `request_lease_${seed}`,
    ownershipEpoch: 4,
    fencingToken: `fencing_token_${seed}`,
    currentLineageFenceEpoch: 7,
    reasonCode: "begin_local_search",
    activeCapabilityResolutionRef: capability.resolution.bookingCapabilityResolutionId,
    activeCapabilityProjectionRef: capability.projection.bookingCapabilityProjectionId,
    activeProviderAdapterBindingRef:
      capability.providerAdapterBinding.bookingProviderAdapterBindingId,
    capabilityState: capability.resolution.capabilityState,
    surfaceRouteContractRef: "booking_route_contract_v1",
    surfacePublicationRef: `surface_publication_${seed}`,
    runtimePublicationBundleRef: `runtime_publication_${seed}`,
    searchPolicy: buildSearchPolicy(seed),
  });

  await slotSearchApplication.startSlotSearch({
    bookingCaseId: `booking_case_${seed}`,
    displayTimeZone: "Europe/London",
    supplierWindows: buildSearchWindows(seed),
    commandActionRecordRef: `slot_search_action_${seed}`,
    commandSettlementRecordRef: `slot_search_settlement_${seed}`,
    subjectRef: `staff_actor_${seed}`,
    occurredAt: "2026-04-18T12:10:00.000Z",
    payloadArtifactRef: `artifact://booking/search/${seed}`,
    edgeCorrelationId: `edge_correlation_${seed}`,
    expiresInSeconds: 900,
  });

  const created = await capacityRankApplication.createOfferSessionFromCurrentSnapshot({
    bookingCaseId: `booking_case_${seed}`,
    actorRef: `actor_${seed}`,
    subjectRef: `staff_actor_${seed}`,
    commandActionRecordRef: `offer_session_action_${seed}`,
    commandSettlementRecordRef: `offer_session_settlement_${seed}`,
    occurredAt: "2026-04-18T12:20:00.000Z",
    payloadArtifactRef: `artifact://booking/offers/${seed}`,
    edgeCorrelationId: `offer_edge_${seed}`,
  });

  const selectedCandidate = created.offerCandidates[0];
  const selectionProofHash = createHash("sha256")
    .update(
      canonicalize({
        offerSessionId: created.offerSession.offerSessionId,
        slotSetSnapshotRef: created.offerSession.slotSetSnapshotRef,
        capacityRankProofRef: created.capacityRankProof.capacityRankProofId,
        selectionToken: created.offerSession.selectionToken,
        truthMode: created.offerSession.truthMode,
        reservationTruthProjectionRef: created.offerSession.reservationTruthProjectionRef,
        providerAdapterBindingHash: created.offerSession.providerAdapterBindingHash,
        capabilityTupleHash: created.offerSession.capabilityTupleHash,
        selectedCandidateHash: selectedCandidate.candidateHash,
        selectedCanonicalSlotIdentityRef: selectedCandidate.canonicalSlotIdentityRef,
      }),
    )
    .digest("hex");

  const selected = await capacityRankApplication.selectOfferCandidate({
    offerSessionId: created.offerSession.offerSessionId,
    offerCandidateId: selectedCandidate.offerCandidateId,
    selectionToken: created.offerSession.selectionToken,
    selectionProofHash,
    actorRef: `actor_${seed}`,
    subjectRef: `staff_actor_${seed}`,
    commandActionRecordRef: `select_offer_candidate_${seed}`,
    commandSettlementRecordRef: `select_offer_candidate_settlement_${seed}`,
    occurredAt: "2026-04-18T12:21:00.000Z",
    payloadArtifactRef: `artifact://booking/offers/${seed}/selection`,
    edgeCorrelationId: `offer_selection_edge_${seed}`,
  });

  return {
    seed,
    bookingCaseApplication,
    bookingCapabilityApplication,
    slotSearchApplication,
    capacityRankApplication,
    bookingReservationApplication,
    bookingCommitApplication,
    offerSession: selected.offerSession,
  };
}

async function setupConfirmedBookingFlow(seed) {
  const flow = await setupCommitFlow({ seed, forceExclusiveHold: true });
  const commit = await flow.bookingCommitApplication.beginCommitFromSelectedOffer({
    bookingCaseId: `booking_case_${seed}`,
    offerSessionId: flow.offerSession.offerSessionId,
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
    expectedSelectionProofHash: flow.offerSession.selectionProofHash,
    expectedRequestLifecycleLeaseRef: `request_lease_${seed}`,
    expectedOwnershipEpochRef: 4,
    expectedSourceDecisionEpochRef: `decision_epoch_${seed}`,
    expectedRuntimePublicationBundleRef: `runtime_publication_${seed}`,
    expectedSurfacePublicationRef: `surface_publication_${seed}`,
    reviewActionLeaseRef: `review_action_lease_${seed}`,
    payloadArtifactRef: `artifact://booking/commit/${seed}`,
    edgeCorrelationId: `edge_commit_${seed}`,
  });
  return {
    ...flow,
    commit,
  };
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

describe("phase4 booking reminders application", () => {
  it("creates one durable reminder plan after confirmed booking truth and binds it to the appointment record", async () => {
    const seed = "289_create";
    const flow = await setupConfirmedBookingFlow(seed);
    const reminders = createPhase4BookingReminderApplication({
      bookingCommitApplication: flow.bookingCommitApplication,
      slotSearchApplication: flow.slotSearchApplication,
    });

    const result = await reminders.createOrRefreshReminderPlan(buildReminderInput(seed));

    expect(PHASE4_BOOKING_REMINDER_SERVICE_NAME).toBe("Phase4BookingReminderPlanApplication");
    expect(PHASE4_BOOKING_REMINDER_SCHEMA_VERSION).toBe(
      "289.phase4.reminder-plan-and-settlement.v1",
    );
    expect(PHASE4_BOOKING_REMINDER_QUERY_SURFACES).toEqual(
      expect.arrayContaining(["GET /v1/bookings/cases/{bookingCaseId}/reminder-plan/current"]),
    );
    expect(result.replayed).toBe(false);
    expect(result.reminderPlan.schemaVersion).toBe(PHASE4_BOOKING_REMINDER_SCHEMA_VERSION);
    expect(result.reminderPlan.scheduleState).toBe("scheduled");
    expect(result.scheduleEntries).toHaveLength(2);
    expect(result.scheduleEntries.map((entry) => entry.state)).toEqual(["scheduled", "scheduled"]);
    expect(result.reminderPlan.appointmentRecordRef).toBe(
      flow.commit.appointmentRecord.appointmentRecordId,
    );

    const appointmentDocument =
      await flow.bookingCommitApplication.bookingCommitRepositories.getAppointmentRecord(
        flow.commit.appointmentRecord.appointmentRecordId,
      );
    expect(appointmentDocument?.toSnapshot().reminderPlanRef).toBe(
      result.reminderPlan.reminderPlanId,
    );

    expect(phase4BookingReminderPersistenceTables).toEqual(
      expect.arrayContaining([
        "phase4_reminder_plans",
        "phase4_reminder_schedule_entries",
        "phase4_reminder_transition_journal",
      ]),
    );
    expect(phase4BookingReminderMigrationPlanRefs.at(-1)).toBe(
      "services/command-api/migrations/138_phase4_reminder_plan_and_notification_settlement.sql",
    );
    expect(phase4BookingReminderRoutes.map((route) => route.routeId)).toEqual(
      expect.arrayContaining([
        "booking_case_reminder_plan_current",
        "booking_case_refresh_reminder_plan",
        "booking_reminder_plan_sweep_due",
        "booking_reminder_plan_suppress",
        "booking_reminder_plan_record_transport_outcome",
        "booking_reminder_plan_record_delivery_evidence",
        "booking_reminder_plan_mark_repair_required",
      ]),
    );

    const routeIds = new Set(serviceDefinition.routeCatalog.map((route) => route.routeId));
    expect(routeIds.has("booking_case_reminder_plan_current")).toBe(true);
    expect(routeIds.has("booking_case_refresh_reminder_plan")).toBe(true);
    expect(routeIds.has("booking_reminder_plan_sweep_due")).toBe(true);
    expect(routeIds.has("booking_reminder_plan_suppress")).toBe(true);
    expect(routeIds.has("booking_reminder_plan_record_transport_outcome")).toBe(true);
    expect(routeIds.has("booking_reminder_plan_record_delivery_evidence")).toBe(true);
    expect(routeIds.has("booking_reminder_plan_mark_repair_required")).toBe(true);
  });

  it("keeps reminder timing deterministic across DST boundaries", async () => {
    const seed = "289_dst";
    const flow = await setupConfirmedBookingFlow(seed);
    const reminders = createPhase4BookingReminderApplication({
      bookingCommitApplication: flow.bookingCommitApplication,
    });

    const result = await reminders.createOrRefreshReminderPlan(
      buildReminderInput(seed, {
        scheduleOffsetsMinutesBeforeStart: [120, 1440],
        appointmentStartAt: "2026-03-29T08:30:00.000Z",
        appointmentEndAt: "2026-03-29T08:45:00.000Z",
        appointmentTimeZone: "Europe/London",
      }),
    );

    expect(result.scheduleEntries.map((entry) => entry.plannedSendAt)).toEqual([
      "2026-03-28T08:30:00.000Z",
      "2026-03-29T06:30:00.000Z",
    ]);
  });

  it("queues due schedules, distinguishes accepted transport from delivered evidence, and replays duplicate delivery evidence safely", async () => {
    const seed = "289_delivery";
    const flow = await setupConfirmedBookingFlow(seed);
    const reminders = createPhase4BookingReminderApplication({
      bookingCommitApplication: flow.bookingCommitApplication,
    });

    const created = await reminders.createOrRefreshReminderPlan(
      buildReminderInput(seed, {
        scheduleOffsetsMinutesBeforeStart: [0],
      }),
    );
    const scheduleEntry = created.scheduleEntries[0];

    const queued = await reminders.sweepDueReminderSchedules({
      reminderPlanId: created.reminderPlan.reminderPlanId,
      commandActionRecordRef: `queue_reminder_${seed}`,
      commandSettlementRecordRef: `queue_reminder_settlement_${seed}`,
      sweptAt: "2026-04-20T09:00:00.000Z",
      payloadArtifactRef: `artifact://booking/reminders/${seed}/queue`,
      edgeCorrelationId: `edge_booking_reminder_queue_${seed}`,
    });
    expect(queued.scheduleEntries[0].state).toBe("queued");
    expect(queued.communicationEnvelope?.queueState).toBe("queued");

    const accepted = await reminders.recordReminderTransportOutcome({
      reminderPlanId: created.reminderPlan.reminderPlanId,
      reminderScheduleEntryId: scheduleEntry.reminderScheduleEntryId,
      commandActionRecordRef: `transport_reminder_${seed}`,
      commandSettlementRecordRef: `transport_reminder_settlement_${seed}`,
      transportSettlementKey: `transport_settlement_${seed}_1`,
      workerRunRef: `worker_${seed}`,
      providerMode: "simulator",
      transportOutcome: "accepted",
      recordedAt: "2026-04-20T09:00:10.000Z",
      providerCorrelationRef: `provider_correlation_${seed}`,
      payloadArtifactRef: `artifact://booking/reminders/${seed}/transport`,
      edgeCorrelationId: `edge_booking_reminder_transport_${seed}`,
    });
    expect(accepted.scheduleEntries[0].state).toBe("sent");
    expect(accepted.reminderPlan.transportAckState).toBe("accepted");
    expect(accepted.reminderPlan.deliveryEvidenceState).toBe("pending");
    expect(accepted.communicationEnvelope?.queueState).toBe("delivery_pending");

    const delivered = await reminders.recordReminderDeliveryEvidence({
      reminderPlanId: created.reminderPlan.reminderPlanId,
      reminderScheduleEntryId: scheduleEntry.reminderScheduleEntryId,
      commandActionRecordRef: `delivery_reminder_${seed}`,
      commandSettlementRecordRef: `delivery_reminder_settlement_${seed}`,
      deliveryEvidenceKey: `delivery_evidence_${seed}`,
      deliveryEvidenceState: "delivered",
      evidenceSource: "simulator_delivery_webhook",
      observedAt: "2026-04-20T09:00:40.000Z",
      recordedAt: "2026-04-20T09:00:40.000Z",
      providerCorrelationRef: `provider_correlation_${seed}`,
      payloadArtifactRef: `artifact://booking/reminders/${seed}/delivery`,
      edgeCorrelationId: `edge_booking_reminder_delivery_${seed}`,
    });
    expect(delivered.scheduleEntries[0].state).toBe("completed");
    expect(delivered.reminderPlan.deliveryEvidenceState).toBe("delivered");
    expect(delivered.emittedEvents.map((event) => event.eventType)).toContain(
      "communication.delivery.evidence.recorded",
    );

    const replayed = await reminders.recordReminderDeliveryEvidence({
      reminderPlanId: created.reminderPlan.reminderPlanId,
      reminderScheduleEntryId: scheduleEntry.reminderScheduleEntryId,
      commandActionRecordRef: `delivery_reminder_${seed}_replay`,
      commandSettlementRecordRef: `delivery_reminder_settlement_${seed}_replay`,
      deliveryEvidenceKey: `delivery_evidence_${seed}`,
      deliveryEvidenceState: "delivered",
      evidenceSource: "simulator_delivery_webhook",
      observedAt: "2026-04-20T09:00:41.000Z",
      recordedAt: "2026-04-20T09:00:41.000Z",
      providerCorrelationRef: `provider_correlation_${seed}`,
      payloadArtifactRef: `artifact://booking/reminders/${seed}/delivery_replay`,
      edgeCorrelationId: `edge_booking_reminder_delivery_replay_${seed}`,
    });
    expect(replayed.replayed).toBe(true);
  });

  it("retries timed out transport and later marks route-repair on delivery failure", async () => {
    const seed = "289_retry";
    const flow = await setupConfirmedBookingFlow(seed);
    const reminders = createPhase4BookingReminderApplication({
      bookingCommitApplication: flow.bookingCommitApplication,
    });

    const created = await reminders.createOrRefreshReminderPlan(
      buildReminderInput(seed, {
        scheduleOffsetsMinutesBeforeStart: [0],
      }),
    );
    const scheduleEntry = created.scheduleEntries[0];
    await reminders.sweepDueReminderSchedules({
      reminderPlanId: created.reminderPlan.reminderPlanId,
      commandActionRecordRef: `queue_reminder_${seed}`,
      commandSettlementRecordRef: `queue_reminder_settlement_${seed}`,
      sweptAt: "2026-04-20T09:00:00.000Z",
      payloadArtifactRef: `artifact://booking/reminders/${seed}/queue`,
      edgeCorrelationId: `edge_booking_reminder_queue_${seed}`,
    });

    const timedOut = await reminders.recordReminderTransportOutcome({
      reminderPlanId: created.reminderPlan.reminderPlanId,
      reminderScheduleEntryId: scheduleEntry.reminderScheduleEntryId,
      commandActionRecordRef: `transport_timeout_${seed}`,
      commandSettlementRecordRef: `transport_timeout_settlement_${seed}`,
      transportSettlementKey: `transport_timeout_key_${seed}`,
      workerRunRef: `worker_${seed}`,
      providerMode: "simulator",
      transportOutcome: "timed_out",
      recordedAt: "2026-04-20T09:00:10.000Z",
      payloadArtifactRef: `artifact://booking/reminders/${seed}/transport_timeout`,
      edgeCorrelationId: `edge_booking_reminder_transport_timeout_${seed}`,
      maxAttempts: 3,
      backoffSeconds: [60],
    });
    expect(timedOut.scheduleEntries[0].state).toBe("queued");
    expect(timedOut.scheduleEntries[0].nextAttemptAt).toBe("2026-04-20T09:01:10.000Z");
    expect(timedOut.reminderPlan.transportAckState).toBe("timed_out");

    await reminders.recordReminderTransportOutcome({
      reminderPlanId: created.reminderPlan.reminderPlanId,
      reminderScheduleEntryId: scheduleEntry.reminderScheduleEntryId,
      commandActionRecordRef: `transport_accept_${seed}`,
      commandSettlementRecordRef: `transport_accept_settlement_${seed}`,
      transportSettlementKey: `transport_accept_key_${seed}`,
      workerRunRef: `worker_${seed}`,
      providerMode: "simulator",
      transportOutcome: "accepted",
      recordedAt: "2026-04-20T09:01:11.000Z",
      providerCorrelationRef: `provider_correlation_${seed}`,
      payloadArtifactRef: `artifact://booking/reminders/${seed}/transport_accept`,
      edgeCorrelationId: `edge_booking_reminder_transport_accept_${seed}`,
    });

    const failed = await reminders.recordReminderDeliveryEvidence({
      reminderPlanId: created.reminderPlan.reminderPlanId,
      reminderScheduleEntryId: scheduleEntry.reminderScheduleEntryId,
      commandActionRecordRef: `delivery_fail_${seed}`,
      commandSettlementRecordRef: `delivery_fail_settlement_${seed}`,
      deliveryEvidenceKey: `delivery_fail_key_${seed}`,
      deliveryEvidenceState: "failed",
      evidenceSource: "provider_callback",
      observedAt: "2026-04-20T09:01:40.000Z",
      recordedAt: "2026-04-20T09:01:40.000Z",
      providerCorrelationRef: `provider_correlation_${seed}`,
      payloadArtifactRef: `artifact://booking/reminders/${seed}/delivery_fail`,
      edgeCorrelationId: `edge_booking_reminder_delivery_fail_${seed}`,
    });
    expect(failed.scheduleEntries[0].state).toBe("delivery_blocked");
    expect(failed.reminderPlan.authoritativeOutcomeState).toBe("recovery_required");
    expect(failed.repairJourney).not.toBeNull();

    const truthRef =
      await flow.bookingCommitApplication.bookingCommitRepositories.getCurrentBookingConfirmationTruthProjectionRef(
        `booking_case_${seed}`,
      );
    const truthDocument =
      await flow.bookingCommitApplication.bookingCommitRepositories.getBookingConfirmationTruthProjection(
        truthRef,
      );
    expect(truthDocument?.toSnapshot().reminderExposureState).toBe("blocked");
  });

  it("opens blocked repair posture when route authority is stale and supports reminder-change refreshes on the same plan", async () => {
    const seed = "289_change";
    const flow = await setupConfirmedBookingFlow(seed);
    const reminders = createPhase4BookingReminderApplication({
      bookingCommitApplication: flow.bookingCommitApplication,
    });

    const blocked = await reminders.createOrRefreshReminderPlan(
      buildReminderInput(seed, {
        contactRoute: {
          ...buildReminderInput(seed).contactRoute,
          verificationState: "unverified",
        },
      }),
    );
    expect(blocked.reminderPlan.scheduleState).toBe("delivery_blocked");
    expect(blocked.repairJourney).not.toBeNull();

    const refreshed = await reminders.createOrRefreshReminderPlan(
      buildReminderInput(seed, {
        commandActionRecordRef: `reminder_change_${seed}`,
        commandSettlementRecordRef: `reminder_change_settlement_${seed}`,
        templateVersionRef: "booking_reminder_v2",
        payloadRef: `artifact://booking/reminders/${seed}/payload_v2`,
        scheduleOffsetsMinutesBeforeStart: [60],
      }),
    );
    expect(refreshed.reminderPlan.reminderPlanId).toBe(blocked.reminderPlan.reminderPlanId);
    expect(refreshed.reminderPlan.templateVersionRef).toBe("booking_reminder_v2");
    expect(refreshed.reminderPlan.scheduleState).toBe("scheduled");
    expect(refreshed.scheduleEntries.some((entry) => entry.state === "cancelled")).toBe(true);
    expect(refreshed.scheduleEntries.some((entry) => entry.state === "scheduled")).toBe(true);
  });

  it("suppresses stale reminders when appointment lifecycle drifts out of booked truth", async () => {
    const seed = "289_suppress";
    const flow = await setupConfirmedBookingFlow(seed);
    const reminders = createPhase4BookingReminderApplication({
      bookingCommitApplication: flow.bookingCommitApplication,
    });

    const created = await reminders.createOrRefreshReminderPlan(
      buildReminderInput(seed, {
        scheduleOffsetsMinutesBeforeStart: [0],
      }),
    );
    const appointmentDocument =
      await flow.bookingCommitApplication.bookingCommitRepositories.getAppointmentRecord(
        flow.commit.appointmentRecord.appointmentRecordId,
      );
    const appointment = appointmentDocument.toSnapshot();
    await flow.bookingCommitApplication.bookingCommitRepositories.saveAppointmentRecord(
      {
        ...appointment,
        appointmentStatus: "cancelled",
        updatedAt: "2026-04-20T08:55:00.000Z",
        version: appointment.version + 1,
      },
      { expectedVersion: appointment.version },
    );

    const suppressed = await reminders.sweepDueReminderSchedules({
      reminderPlanId: created.reminderPlan.reminderPlanId,
      commandActionRecordRef: `suppress_drift_${seed}`,
      commandSettlementRecordRef: `suppress_drift_settlement_${seed}`,
      sweptAt: "2026-04-20T09:00:00.000Z",
      payloadArtifactRef: `artifact://booking/reminders/${seed}/suppress_drift`,
      edgeCorrelationId: `edge_booking_reminder_suppress_drift_${seed}`,
    });
    expect(suppressed.reminderPlan.scheduleState).toBe("cancelled");
    expect(suppressed.reminderPlan.deliveryEvidenceState).toBe("suppressed");
    expect(suppressed.reminderPlan.authoritativeOutcomeState).toBe("suppressed");

    const truthRef =
      await flow.bookingCommitApplication.bookingCommitRepositories.getCurrentBookingConfirmationTruthProjectionRef(
        `booking_case_${seed}`,
      );
    const truthDocument =
      await flow.bookingCommitApplication.bookingCommitRepositories.getBookingConfirmationTruthProjection(
        truthRef,
      );
    expect(truthDocument?.toSnapshot().reminderExposureState).toBe("blocked");
  });

  it("moves contradictory delivery evidence into explicit disputed repair posture", async () => {
    const seed = "289_dispute";
    const flow = await setupConfirmedBookingFlow(seed);
    const reminders = createPhase4BookingReminderApplication({
      bookingCommitApplication: flow.bookingCommitApplication,
    });

    const created = await reminders.createOrRefreshReminderPlan(
      buildReminderInput(seed, {
        scheduleOffsetsMinutesBeforeStart: [0],
      }),
    );
    const scheduleEntry = created.scheduleEntries[0];
    await reminders.sweepDueReminderSchedules({
      reminderPlanId: created.reminderPlan.reminderPlanId,
      commandActionRecordRef: `queue_dispute_${seed}`,
      commandSettlementRecordRef: `queue_dispute_settlement_${seed}`,
      sweptAt: "2026-04-20T09:00:00.000Z",
      payloadArtifactRef: `artifact://booking/reminders/${seed}/queue_dispute`,
      edgeCorrelationId: `edge_booking_reminder_queue_dispute_${seed}`,
    });
    await reminders.recordReminderTransportOutcome({
      reminderPlanId: created.reminderPlan.reminderPlanId,
      reminderScheduleEntryId: scheduleEntry.reminderScheduleEntryId,
      commandActionRecordRef: `transport_dispute_${seed}`,
      commandSettlementRecordRef: `transport_dispute_settlement_${seed}`,
      transportSettlementKey: `transport_dispute_key_${seed}`,
      workerRunRef: `worker_${seed}`,
      providerMode: "simulator",
      transportOutcome: "accepted",
      recordedAt: "2026-04-20T09:00:10.000Z",
      providerCorrelationRef: `provider_correlation_${seed}`,
      payloadArtifactRef: `artifact://booking/reminders/${seed}/transport_dispute`,
      edgeCorrelationId: `edge_booking_reminder_transport_dispute_${seed}`,
    });
    await reminders.recordReminderDeliveryEvidence({
      reminderPlanId: created.reminderPlan.reminderPlanId,
      reminderScheduleEntryId: scheduleEntry.reminderScheduleEntryId,
      commandActionRecordRef: `delivery_dispute_${seed}_positive`,
      commandSettlementRecordRef: `delivery_dispute_settlement_${seed}_positive`,
      deliveryEvidenceKey: `delivery_dispute_positive_${seed}`,
      deliveryEvidenceState: "delivered",
      evidenceSource: "simulator_delivery_webhook",
      observedAt: "2026-04-20T09:00:40.000Z",
      recordedAt: "2026-04-20T09:00:40.000Z",
      providerCorrelationRef: `provider_correlation_${seed}`,
      payloadArtifactRef: `artifact://booking/reminders/${seed}/delivery_dispute_positive`,
      edgeCorrelationId: `edge_booking_reminder_delivery_dispute_positive_${seed}`,
    });

    const disputed = await reminders.recordReminderDeliveryEvidence({
      reminderPlanId: created.reminderPlan.reminderPlanId,
      reminderScheduleEntryId: scheduleEntry.reminderScheduleEntryId,
      commandActionRecordRef: `delivery_dispute_${seed}_negative`,
      commandSettlementRecordRef: `delivery_dispute_settlement_${seed}_negative`,
      deliveryEvidenceKey: `delivery_dispute_negative_${seed}`,
      deliveryEvidenceState: "disputed",
      evidenceSource: "manual_review",
      observedAt: "2026-04-20T09:01:10.000Z",
      recordedAt: "2026-04-20T09:01:10.000Z",
      providerCorrelationRef: `provider_correlation_${seed}`,
      payloadArtifactRef: `artifact://booking/reminders/${seed}/delivery_dispute_negative`,
      edgeCorrelationId: `edge_booking_reminder_delivery_dispute_negative_${seed}`,
    });
    expect(disputed.scheduleEntries[0].state).toBe("disputed");
    expect(disputed.reminderPlan.deliveryEvidenceState).toBe("disputed");
    expect(disputed.repairJourney).not.toBeNull();
  });
});
