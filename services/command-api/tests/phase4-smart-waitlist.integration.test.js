import { describe, expect, it } from "vitest";
import { createPhase4BookingCapabilityEngineStore } from "@vecells/domain-booking";
import { serviceDefinition } from "../src/service-definition.ts";
import {
  PHASE4_SMART_WAITLIST_QUERY_SURFACES,
  PHASE4_SMART_WAITLIST_SERVICE_NAME,
  createPhase4SmartWaitlistApplication,
  phase4SmartWaitlistMigrationPlanRefs,
  phase4SmartWaitlistPersistenceTables,
  phase4SmartWaitlistRoutes,
} from "../src/phase4-smart-waitlist.ts";
import { createPhase4BookingCaseApplication } from "../src/phase4-booking-case.ts";
import { createPhase4BookingCapabilityApplication } from "../src/phase4-booking-capability.ts";
import { createPhase4BookingReservationApplication } from "../src/phase4-booking-reservations.ts";
import { createPhase4BookingCommitApplication } from "../src/phase4-booking-commit.ts";

function buildDirectResolutionBundle(seed = "290") {
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

function buildSearchPolicy(seed = "290") {
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

function buildReleasedCapacity(seed = "290", overrides = {}) {
  return {
    releasedSlotRef: `released_slot_${seed}`,
    selectedNormalizedSlotRef: `normalized_slot_${seed}`,
    selectedCanonicalSlotIdentityRef: `canonical_slot_${seed}`,
    sourceSlotSetSnapshotRef: `slot_snapshot_${seed}`,
    capacityUnitRef: `capacity_unit_${seed}`,
    supplierRef: "vecells_local_gateway",
    scheduleOwnerRef: `schedule_owner_${seed}`,
    inventoryLineageRef: `inventory_lineage_${seed}`,
    slotStartAt: "2026-04-20T09:00:00.000Z",
    slotEndAt: "2026-04-20T09:15:00.000Z",
    slotStartAtEpoch: Date.parse("2026-04-20T09:00:00.000Z"),
    slotEndAtEpoch: Date.parse("2026-04-20T09:15:00.000Z"),
    localDayKey: "2026-04-20",
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

async function setupWaitlistFlow(options = {}) {
  const seed = options.seed ?? "290";
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
  const bookingReservationApplication = createPhase4BookingReservationApplication({
    bookingCaseApplication,
    bookingCapabilityApplication,
  });
  const bookingCommitApplication = createPhase4BookingCommitApplication({
    bookingCaseApplication,
    bookingCapabilityApplication,
    bookingReservationApplication,
  });
  const waitlistApplication = createPhase4SmartWaitlistApplication({
    bookingCaseApplication,
    bookingCapabilityApplication,
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

  return {
    seed,
    capability,
    bookingCaseApplication,
    bookingCapabilityApplication,
    bookingReservationApplication,
    bookingCommitApplication,
    waitlistApplication,
  };
}

describe("phase4 smart waitlist application", () => {
  it("joins waitlist, issues a reservation-backed offer, and books through the canonical commit pipeline", async () => {
    const flow = await setupWaitlistFlow({
      seed: "290_accept",
      forceExclusiveHold: true,
    });

    const joined = await flow.waitlistApplication.joinWaitlist({
      bookingCaseId: `booking_case_${flow.seed}`,
      actorRef: `actor_${flow.seed}`,
      subjectRef: `staff_actor_${flow.seed}`,
      commandActionRecordRef: `join_waitlist_action_${flow.seed}`,
      commandSettlementRecordRef: `join_waitlist_settlement_${flow.seed}`,
      occurredAt: "2026-04-19T09:00:00.000Z",
      routeIntentBindingRef: `route_intent_waitlist_${flow.seed}`,
      payloadArtifactRef: `artifact://booking/waitlist/${flow.seed}/join`,
      edgeCorrelationId: `edge_waitlist_join_${flow.seed}`,
    });

    expect(joined.bookingCase.bookingCase.status).toBe("waitlisted");
    expect(joined.waitlist.entry.activeState).toBe("active");
    expect(joined.waitlist.fallbackObligation.requiredFallbackRoute).toBe(
      "stay_local_waitlist",
    );

    const processed = await flow.waitlistApplication.processReleasedCapacity({
      releasedCapacity: [buildReleasedCapacity(flow.seed)],
      actorRef: `actor_${flow.seed}`,
      subjectRef: `staff_actor_${flow.seed}`,
      commandActionRecordRef: `process_released_capacity_${flow.seed}`,
      commandSettlementRecordRef: `process_released_capacity_settlement_${flow.seed}`,
      processedAt: "2026-04-19T09:50:00.000Z",
      payloadArtifactRef: `artifact://booking/waitlist/${flow.seed}/process`,
      edgeCorrelationId: `edge_waitlist_process_${flow.seed}`,
    });

    expect(processed.issuedOffers).toHaveLength(1);
    expect(processed.issuedOffers[0]?.activeOffer?.holdState).toBe("held");
    expect(processed.issuedOffers[0]?.activeOffer?.offerState).toBe("sent");

    const accepted = await flow.waitlistApplication.acceptWaitlistOffer({
      waitlistOfferId: processed.issuedOffers[0].activeOffer.waitlistOfferId,
      actorRef: `actor_${flow.seed}`,
      subjectRef: `staff_actor_${flow.seed}`,
      commandActionRecordRef: `accept_waitlist_offer_${flow.seed}`,
      commandSettlementRecordRef: `accept_waitlist_offer_settlement_${flow.seed}`,
      acceptedAt: "2026-04-19T09:55:00.000Z",
      idempotencyKey: `waitlist_accept_idempotency_${flow.seed}`,
      dispatchOutcome: {
        kind: "authoritative_success",
        authoritativeProofClass: "durable_provider_reference",
        providerReference: `provider_reference_${flow.seed}`,
        settlementRef: `provider_settlement_${flow.seed}`,
      },
      payloadArtifactRef: `artifact://booking/waitlist/${flow.seed}/accept`,
      edgeCorrelationId: `edge_waitlist_accept_${flow.seed}`,
    });

    expect(accepted.bookingCommit.transaction.authoritativeOutcomeState).toBe("booked");
    expect(accepted.bookingCommit.confirmationTruthProjection.confirmationTruthState).toBe(
      "confirmed",
    );
    expect(accepted.bookingCase.bookingCase.status).toBe("booked");
    expect(accepted.waitlist.entry.activeState).toBe("closed");
    expect(accepted.waitlist.entry.continuationState).toBe("closed");
    expect(accepted.waitlist.fallbackObligation.transferState).toBe("satisfied");
  });

  it("expires overdue offers and escalates the booking case into callback fallback when local waitlist is no longer safe", async () => {
    const flow = await setupWaitlistFlow({ seed: "290_expire" });

    await flow.waitlistApplication.joinWaitlist({
      bookingCaseId: `booking_case_${flow.seed}`,
      actorRef: `actor_${flow.seed}`,
      subjectRef: `staff_actor_${flow.seed}`,
      commandActionRecordRef: `join_waitlist_action_${flow.seed}`,
      commandSettlementRecordRef: `join_waitlist_settlement_${flow.seed}`,
      occurredAt: "2026-04-19T09:00:00.000Z",
      routeIntentBindingRef: `route_intent_waitlist_${flow.seed}`,
      deadlineAt: "2026-04-19T10:20:00.000Z",
      expectedOfferServiceMinutes: 30,
      payloadArtifactRef: `artifact://booking/waitlist/${flow.seed}/join`,
      edgeCorrelationId: `edge_waitlist_join_${flow.seed}`,
    });

    const processed = await flow.waitlistApplication.processReleasedCapacity({
      releasedCapacity: [buildReleasedCapacity(flow.seed)],
      actorRef: `actor_${flow.seed}`,
      subjectRef: `staff_actor_${flow.seed}`,
      commandActionRecordRef: `process_released_capacity_${flow.seed}`,
      commandSettlementRecordRef: `process_released_capacity_settlement_${flow.seed}`,
      processedAt: "2026-04-19T09:50:00.000Z",
      payloadArtifactRef: `artifact://booking/waitlist/${flow.seed}/process`,
      edgeCorrelationId: `edge_waitlist_process_${flow.seed}`,
    });

    const expired = await flow.waitlistApplication.expireWaitlistOffer({
      waitlistOfferId: processed.issuedOffers[0].activeOffer.waitlistOfferId,
      actorRef: `actor_${flow.seed}`,
      subjectRef: `staff_actor_${flow.seed}`,
      commandActionRecordRef: `expire_waitlist_offer_${flow.seed}`,
      commandSettlementRecordRef: `expire_waitlist_offer_settlement_${flow.seed}`,
      expiredAt: "2026-04-19T10:15:00.000Z",
      reasonCode: "offer_ttl_elapsed",
      payloadArtifactRef: `artifact://booking/waitlist/${flow.seed}/expire`,
      edgeCorrelationId: `edge_waitlist_expire_${flow.seed}`,
    });

    expect(expired.waitlist.deadlineEvaluation.offerabilityState).toBe("fallback_required");
    expect(expired.waitlist.fallbackObligation.requiredFallbackRoute).toBe("callback");
    expect(expired.waitlist.fallbackObligation.callbackCaseRef).toBeTruthy();
    expect(expired.bookingCase.bookingCase.status).toBe("callback_fallback");
    expect(expired.bookingCase.bookingCase.activeWaitlistFallbackObligationRef).toBe(
      expired.waitlist.fallbackObligation.waitlistFallbackObligationId,
    );
  });

  it("publishes the expected metadata surfaces and route catalog entries", () => {
    expect(PHASE4_SMART_WAITLIST_SERVICE_NAME).toBe("Phase4SmartWaitlistApplication");
    expect(PHASE4_SMART_WAITLIST_QUERY_SURFACES).toContain(
      "GET /v1/bookings/cases/{bookingCaseId}/waitlist/current",
    );
    expect(phase4SmartWaitlistPersistenceTables).toEqual(
      expect.arrayContaining([
        "phase4_waitlist_entries",
        "phase4_waitlist_entry_eligibility_keys",
        "phase4_waitlist_deadline_evaluations",
        "phase4_waitlist_offers",
        "phase4_waitlist_allocation_batches",
        "phase4_waitlist_transition_journal",
      ]),
    );
    expect(phase4SmartWaitlistMigrationPlanRefs.at(-1)).toBe(
      "services/command-api/migrations/139_phase4_smart_waitlist_and_deadline_logic.sql",
    );
    expect(phase4SmartWaitlistRoutes.map((route) => route.routeId)).toEqual(
      expect.arrayContaining([
        "booking_case_waitlist_current",
        "booking_case_join_waitlist",
        "waitlist_entry_pause",
        "waitlist_entry_close",
        "booking_waitlist_process_released_capacity",
        "waitlist_offer_accept",
        "waitlist_offer_expire",
        "waitlist_offer_supersede",
        "waitlist_entry_refresh_fallback",
      ]),
    );

    const routeIds = new Set(serviceDefinition.routeCatalog.map((route) => route.routeId));
    expect(routeIds.has("booking_case_waitlist_current")).toBe(true);
    expect(routeIds.has("booking_case_join_waitlist")).toBe(true);
    expect(routeIds.has("waitlist_entry_pause")).toBe(true);
    expect(routeIds.has("waitlist_entry_close")).toBe(true);
    expect(routeIds.has("booking_waitlist_process_released_capacity")).toBe(true);
    expect(routeIds.has("waitlist_offer_accept")).toBe(true);
    expect(routeIds.has("waitlist_offer_expire")).toBe(true);
    expect(routeIds.has("waitlist_offer_supersede")).toBe(true);
    expect(routeIds.has("waitlist_entry_refresh_fallback")).toBe(true);
  });
});
