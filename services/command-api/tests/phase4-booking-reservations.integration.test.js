import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { createPhase4BookingCapabilityEngineStore } from "@vecells/domain-booking";
import { serviceDefinition } from "../src/service-definition.ts";
import {
  PHASE4_BOOKING_RESERVATION_SCHEMA_VERSION,
  PHASE4_BOOKING_RESERVATION_SERVICE_NAME,
  createPhase4BookingReservationApplication,
  phase4BookingReservationMigrationPlanRefs,
  phase4BookingReservationPersistenceTables,
  phase4BookingReservationRoutes,
} from "../src/phase4-booking-reservations.ts";
import { createPhase4BookingCaseApplication } from "../src/phase4-booking-case.ts";
import { createPhase4BookingCapabilityApplication } from "../src/phase4-booking-capability.ts";
import { createPhase4SlotSearchApplication } from "../src/phase4-slot-search.ts";
import { createPhase4CapacityRankApplication } from "../src/phase4-capacity-rank-offers.ts";

function buildDirectResolutionBundle(seed = "286") {
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

function buildSearchPolicy(seed = "286") {
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

function buildSearchWindows(seed = "286") {
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

async function setupSelectedOfferFlow(options = {}) {
  const seed = options.seed ?? "286";
  const bookingCaseApplication = createPhase4BookingCaseApplication({
    directResolutionApplication: {
      async queryTaskDirectResolution() {
        return structuredClone(buildDirectResolutionBundle(seed));
      },
    },
  });
  const capabilityRepositories = createPhase4BookingCapabilityEngineStore();
  if (options.forceExclusiveHold) {
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
  const offerApplication = createPhase4CapacityRankApplication({
    bookingCaseApplication,
    bookingCapabilityApplication,
    slotSearchApplication,
  });
  const reservationApplication = createPhase4BookingReservationApplication({
    bookingCaseApplication,
    bookingCapabilityApplication,
    slotSearchApplication,
    capacityRankApplication: offerApplication,
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
    activeProviderAdapterBindingRef: capability.providerAdapterBinding.bookingProviderAdapterBindingId,
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
    activeProviderAdapterBindingRef: capability.providerAdapterBinding.bookingProviderAdapterBindingId,
    capabilityState: capability.resolution.capabilityState,
    surfaceRouteContractRef: "booking_route_contract_v1",
    surfacePublicationRef: `surface_publication_${seed}`,
    runtimePublicationBundleRef: `runtime_publication_${seed}`,
    searchPolicy: buildSearchPolicy(seed),
  });

  const slotSearch = await slotSearchApplication.startSlotSearch({
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

  const created = await offerApplication.createOfferSessionFromCurrentSnapshot({
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

  const selected = await offerApplication.selectOfferCandidate({
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
    offerApplication,
    reservationApplication,
    capability,
    slotSearch,
    offerSession: selected.offerSession,
    selectedCandidate,
  };
}

async function buildWaitlistDescriptor(flow, waitlistOfferId) {
  const snapshotDocument =
    await flow.slotSearchApplication.slotSearchRepositories.getSlotSetSnapshot(
      flow.offerSession.slotSetSnapshotRef,
    );
  if (!snapshotDocument) {
    throw new Error("WAITLIST_SOURCE_SLOT_SNAPSHOT_NOT_FOUND");
  }
  const slotSetSnapshot = snapshotDocument.toSnapshot();
  const normalizedSlots = (
    await flow.slotSearchApplication.slotSearchRepositories.listNormalizedSlots(
      slotSetSnapshot.slotSetSnapshotId,
    )
  ).map((document) => document.toSnapshot());
  const canonicalSlotIdentities = (
    await flow.slotSearchApplication.slotSearchRepositories.listCanonicalSlotIdentities(
      slotSetSnapshot.slotSetSnapshotId,
    )
  ).map((document) => document.toSnapshot());
  const selectedSlot = normalizedSlots.find(
    (slot) => slot.normalizedSlotId === flow.offerSession.selectedNormalizedSlotRef,
  );
  const selectedIdentity = canonicalSlotIdentities.find(
    (identity) =>
      identity.canonicalSlotIdentityId === flow.offerSession.selectedCanonicalSlotIdentityRef,
  );
  return {
    bookingCaseId: flow.offerSession.bookingCaseId,
    waitlistOfferId,
    supplierRef: selectedIdentity.supplierRef,
    capacityUnitRef: selectedIdentity.capacityUnitRef,
    scheduleOwnerRef: selectedIdentity.scheduleOwnerRef,
    inventoryLineageRef: selectedIdentity.inventoryLineageRef,
    slotStartAtEpoch: selectedIdentity.slotStartAtEpoch,
    slotEndAtEpoch: selectedIdentity.slotEndAtEpoch,
    locationRef: selectedIdentity.locationRef,
    practitionerRef: selectedIdentity.practitionerRef,
    serviceRef: selectedIdentity.serviceRef,
    modality: selectedIdentity.modality,
    selectedAnchorRef: selectedSlot.normalizedSlotId,
    selectedNormalizedSlotRef: selectedSlot.normalizedSlotId,
    selectedCanonicalSlotIdentityRef: selectedIdentity.canonicalSlotIdentityId,
    providerAdapterBindingRef: flow.capability.providerAdapterBinding.bookingProviderAdapterBindingId,
    providerAdapterBindingHash: flow.capability.providerAdapterBinding.bindingHash,
    capabilityResolutionRef: flow.capability.resolution.bookingCapabilityResolutionId,
    capabilityTupleHash: flow.capability.resolution.capabilityTupleHash,
    authoritativeReadAndConfirmationPolicyRef:
      flow.capability.providerAdapterBinding.authoritativeReadAndConfirmationPolicyRef,
    reservationSemantics: flow.capability.providerAdapterBinding.reservationSemantics,
    sourceSlotSetSnapshotRef: slotSetSnapshot.slotSetSnapshotId,
    governingObjectVersionRef: flow.capability.resolution.governingObjectVersionRef,
  };
}

describe("phase4 booking reservation application", () => {
  it("creates truthful nonexclusive soft selection for the selected offer session", async () => {
    const flow = await setupSelectedOfferFlow({ seed: "286_nonexclusive" });
    const soft = await flow.reservationApplication.createOrRefreshSoftSelection({
      scopeFamily: "offer_session",
      scopeObjectRef: flow.offerSession.offerSessionId,
      actorRef: `actor_${flow.seed}`,
      subjectRef: `staff_actor_${flow.seed}`,
      commandActionRecordRef: `reservation_soft_select_${flow.seed}`,
      commandSettlementRecordRef: `reservation_soft_select_settlement_${flow.seed}`,
      occurredAt: "2026-04-18T12:22:00.000Z",
      ttlSeconds: 300,
    });

    expect(soft.scope.currentReservationState).toBe("soft_selected");
    expect(soft.projection.truthState).toBe("truthful_nonexclusive");
    expect(soft.projection.displayExclusivityState).toBe("nonexclusive");
    expect(soft.projection.countdownMode).toBe("none");
    expect(soft.emittedEvents.map((event) => event.eventType)).toEqual([
      "capacity.reservation.created",
      "capacity.reservation.soft_selected",
      "capacity.reservation.truth.updated",
    ]);

    const current = await flow.reservationApplication.queryReservationTruth({
      scopeFamily: "offer_session",
      scopeObjectRef: flow.offerSession.offerSessionId,
      requestedAt: "2026-04-18T12:22:30.000Z",
    });
    expect(current?.scope.currentReservationVersionRef).toBe(soft.scope.currentReservationVersionRef);
  });

  it("supports exclusive hold, pending confirmation, confirmation, and release when the binding allows real hold semantics", async () => {
    const flow = await setupSelectedOfferFlow({
      seed: "286_exclusive",
      forceExclusiveHold: true,
    });

    const soft = await flow.reservationApplication.createOrRefreshSoftSelection({
      scopeFamily: "offer_session",
      scopeObjectRef: flow.offerSession.offerSessionId,
      actorRef: `actor_${flow.seed}`,
      subjectRef: `staff_actor_${flow.seed}`,
      commandActionRecordRef: `reservation_soft_select_${flow.seed}`,
      commandSettlementRecordRef: `reservation_soft_select_settlement_${flow.seed}`,
      occurredAt: "2026-04-18T12:22:00.000Z",
      ttlSeconds: 300,
    });

    const held = await flow.reservationApplication.acquireOrRefreshHold({
      scopeFamily: "offer_session",
      scopeObjectRef: flow.offerSession.offerSessionId,
      actorRef: `actor_${flow.seed}`,
      subjectRef: `staff_actor_${flow.seed}`,
      commandActionRecordRef: `reservation_hold_${flow.seed}`,
      commandSettlementRecordRef: `reservation_hold_settlement_${flow.seed}`,
      occurredAt: "2026-04-18T12:23:00.000Z",
      fenceToken: soft.fence.fenceToken,
      expectedReservationVersionRef: soft.scope.currentReservationVersionRef,
      holdTtlSeconds: 120,
    });
    expect(held.projection.truthState).toBe("exclusive_held");
    expect(held.projection.displayExclusivityState).toBe("exclusive");
    expect(held.projection.countdownMode).toBe("hold_expiry");

    const pending = await flow.reservationApplication.markPendingConfirmation({
      scopeFamily: "offer_session",
      scopeObjectRef: flow.offerSession.offerSessionId,
      actorRef: `actor_${flow.seed}`,
      subjectRef: `staff_actor_${flow.seed}`,
      commandActionRecordRef: `reservation_pending_${flow.seed}`,
      commandSettlementRecordRef: `reservation_pending_settlement_${flow.seed}`,
      occurredAt: "2026-04-18T12:24:00.000Z",
      fenceToken: held.fence.fenceToken,
      expectedReservationVersionRef: held.scope.currentReservationVersionRef,
    });
    expect(pending.projection.truthState).toBe("pending_confirmation");

    const confirmed = await flow.reservationApplication.markConfirmed({
      scopeFamily: "offer_session",
      scopeObjectRef: flow.offerSession.offerSessionId,
      actorRef: `actor_${flow.seed}`,
      subjectRef: `staff_actor_${flow.seed}`,
      commandActionRecordRef: `reservation_confirmed_${flow.seed}`,
      commandSettlementRecordRef: `reservation_confirmed_settlement_${flow.seed}`,
      occurredAt: "2026-04-18T12:25:00.000Z",
      fenceToken: pending.fence.fenceToken,
      expectedReservationVersionRef: pending.scope.currentReservationVersionRef,
    });
    expect(confirmed.projection.truthState).toBe("confirmed");

    const released = await flow.reservationApplication.releaseReservation({
      scopeFamily: "offer_session",
      scopeObjectRef: flow.offerSession.offerSessionId,
      actorRef: `actor_${flow.seed}`,
      subjectRef: `staff_actor_${flow.seed}`,
      commandActionRecordRef: `reservation_release_${flow.seed}`,
      commandSettlementRecordRef: `reservation_release_settlement_${flow.seed}`,
      occurredAt: "2026-04-18T12:26:00.000Z",
      fenceToken: confirmed.fence.fenceToken,
      expectedReservationVersionRef: confirmed.scope.currentReservationVersionRef,
      terminalReasonCode: "user_cancelled",
    });
    expect(released.projection.truthState).toBe("released");
    expect(released.scope.scopeState).toBe("released");
  });

  it("rejects stale tokens and expires bounded soft selections in the sweep worker", async () => {
    const flow = await setupSelectedOfferFlow({
      seed: "286_expiry",
      forceExclusiveHold: true,
    });
    const soft = await flow.reservationApplication.createOrRefreshSoftSelection({
      scopeFamily: "offer_session",
      scopeObjectRef: flow.offerSession.offerSessionId,
      actorRef: `actor_${flow.seed}`,
      subjectRef: `staff_actor_${flow.seed}`,
      commandActionRecordRef: `reservation_soft_select_${flow.seed}`,
      commandSettlementRecordRef: `reservation_soft_select_settlement_${flow.seed}`,
      occurredAt: "2026-04-18T12:22:00.000Z",
      ttlSeconds: 30,
    });

    await expect(
      flow.reservationApplication.acquireOrRefreshHold({
        scopeFamily: "offer_session",
        scopeObjectRef: flow.offerSession.offerSessionId,
        actorRef: `actor_${flow.seed}`,
        subjectRef: `staff_actor_${flow.seed}`,
        commandActionRecordRef: `reservation_hold_${flow.seed}`,
        commandSettlementRecordRef: `reservation_hold_settlement_${flow.seed}`,
        occurredAt: "2026-04-18T12:22:10.000Z",
        fenceToken: "a".repeat(64),
        expectedReservationVersionRef: soft.scope.currentReservationVersionRef,
      }),
    ).rejects.toMatchObject({
      code: "STALE_RESERVATION_FENCE_TOKEN",
    });

    const sweep = await flow.reservationApplication.sweepExpiredReservations({
      asOf: "2026-04-18T12:23:10.000Z",
      actorRef: `actor_${flow.seed}`,
      subjectRef: `staff_actor_${flow.seed}`,
      commandActionRecordRef: `reservation_sweep_${flow.seed}`,
      commandSettlementRecordRef: `reservation_sweep_settlement_${flow.seed}`,
    });
    expect(sweep.expiredScopeRefs).toContain(soft.scope.bookingReservationScopeId);

    const expired = await flow.reservationApplication.queryReservationTruth({
      scopeFamily: "offer_session",
      scopeObjectRef: flow.offerSession.offerSessionId,
      requestedAt: "2026-04-18T12:23:30.000Z",
    });
    expect(expired?.projection.truthState).toBe("expired");
  });

  it("serializes real holds across offer-session and waitlist scopes sharing one canonicalReservationKey", async () => {
    const flow = await setupSelectedOfferFlow({
      seed: "286_concurrency",
      forceExclusiveHold: true,
    });
    const waitlistContext = await buildWaitlistDescriptor(
      flow,
      `waitlist_offer_${flow.seed}`,
    );

    const [offerResult, waitlistResult] = await Promise.allSettled([
      flow.reservationApplication.acquireOrRefreshHold({
        scopeFamily: "offer_session",
        scopeObjectRef: flow.offerSession.offerSessionId,
        actorRef: `actor_${flow.seed}`,
        subjectRef: `staff_actor_${flow.seed}`,
        commandActionRecordRef: `reservation_hold_offer_${flow.seed}`,
        commandSettlementRecordRef: `reservation_hold_offer_settlement_${flow.seed}`,
        occurredAt: "2026-04-18T12:22:00.000Z",
        holdTtlSeconds: 120,
      }),
      flow.reservationApplication.acquireOrRefreshHold({
        scopeFamily: "waitlist_offer",
        scopeObjectRef: waitlistContext.waitlistOfferId,
        actorRef: `actor_${flow.seed}`,
        subjectRef: `staff_actor_${flow.seed}`,
        commandActionRecordRef: `reservation_hold_waitlist_${flow.seed}`,
        commandSettlementRecordRef: `reservation_hold_waitlist_settlement_${flow.seed}`,
        occurredAt: "2026-04-18T12:22:00.000Z",
        holdTtlSeconds: 120,
        waitlistContext,
      }),
    ]);

    expect(
      [offerResult.status, waitlistResult.status].sort(),
    ).toEqual(["fulfilled", "rejected"]);

    const successful =
      offerResult.status === "fulfilled" ? offerResult.value : waitlistResult.value;
    expect(successful.projection.truthState).toBe("exclusive_held");
  });

  it("publishes the expected metadata surfaces and route catalog entries", () => {
    expect(PHASE4_BOOKING_RESERVATION_SERVICE_NAME).toBe(
      "Phase4BookingReservationAuthorityApplication",
    );
    expect(PHASE4_BOOKING_RESERVATION_SCHEMA_VERSION).toBe(
      "286.phase4.reservation-authority-and-truth-projection.v1",
    );
    expect(phase4BookingReservationPersistenceTables).toEqual(
      expect.arrayContaining([
        "capacity_reservations",
        "reservation_truth_projections",
        "reservation_fence_records",
        "phase4_booking_reservation_scopes",
        "phase4_booking_reservation_transition_journal",
        "phase4_booking_reservation_replays",
      ]),
    );
    expect(phase4BookingReservationMigrationPlanRefs.at(-1)).toBe(
      "services/command-api/migrations/135_phase4_booking_reservation_authority.sql",
    );
    expect(
      phase4BookingReservationRoutes.map((route) => route.routeId),
    ).toEqual(
      expect.arrayContaining([
        "booking_reservation_truth_current",
        "booking_reservation_soft_select",
        "booking_reservation_acquire_hold",
        "booking_reservation_mark_pending_confirmation",
        "booking_reservation_mark_confirmed",
        "booking_reservation_release",
        "booking_reservation_expire",
        "booking_reservation_mark_disputed",
        "booking_reservation_expiry_sweep",
      ]),
    );
    const routeIds = new Set(serviceDefinition.routeCatalog.map((route) => route.routeId));
    expect(routeIds.has("booking_reservation_truth_current")).toBe(true);
    expect(routeIds.has("booking_reservation_expiry_sweep")).toBe(true);
  });
});
