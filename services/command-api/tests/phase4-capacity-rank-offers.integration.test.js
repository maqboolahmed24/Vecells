import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { serviceDefinition } from "../src/service-definition.ts";
import {
  PHASE4_CAPACITY_RANK_QUERY_SURFACES,
  PHASE4_CAPACITY_RANK_SCHEMA_VERSION,
  PHASE4_CAPACITY_RANK_SERVICE_NAME,
  createPhase4CapacityRankApplication,
  phase4CapacityRankMigrationPlanRefs,
  phase4CapacityRankPersistenceTables,
  phase4CapacityRankRoutes,
} from "../src/phase4-capacity-rank-offers.ts";
import { createPhase4BookingCaseApplication } from "../src/phase4-booking-case.ts";
import { createPhase4BookingCapabilityApplication } from "../src/phase4-booking-capability.ts";
import { createPhase4SlotSearchApplication } from "../src/phase4-slot-search.ts";

function buildDirectResolutionBundle(seed = "285") {
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

function buildSearchWindows() {
  return [
    {
      supplierRef: "vecells_local_gateway",
      supplierWindowRef: "supplier_window_a",
      searchWindowStartAt: "2026-04-20T08:00:00.000Z",
      searchWindowEndAt: "2026-04-20T18:00:00.000Z",
      fetchStartedAt: "2026-04-18T12:00:00.000Z",
      fetchCompletedAt: "2026-04-18T12:00:05.000Z",
      rawRows: [
        {
          supplierSlotRef: "slot_a_0900",
          capacityUnitRef: "cap_u1",
          scheduleRef: "schedule_a",
          scheduleOwnerRef: "schedule_owner_a",
          locationRef: "location_a",
          locationName: "Neutral Site",
          practitionerRef: "practitioner_a",
          serviceRef: "service_gp",
          clinicianType: "general_practice",
          modality: "in_person",
          startAt: "2026-04-20T09:00:00.000Z",
          endAt: "2026-04-20T09:15:00.000Z",
          siteId: "site_b",
          siteName: "Fallback Preferred Site",
          accessibilityTags: ["step_free_access"],
          continuityScore: 0.2,
          restrictions: [],
          bookabilityMode: "dual",
          inventoryLineageRef: "inventory_lineage_a",
          sourceVersionRef: "supplier_version_a",
        },
        {
          supplierSlotRef: "slot_b_1030",
          capacityUnitRef: "cap_u2",
          scheduleRef: "schedule_b",
          scheduleOwnerRef: "schedule_owner_b",
          locationRef: "location_b",
          locationName: "Preferred Site",
          practitionerRef: "practitioner_b",
          serviceRef: "service_gp",
          clinicianType: "general_practice",
          modality: "in_person",
          startAt: "2026-04-20T10:30:00.000Z",
          endAt: "2026-04-20T10:45:00.000Z",
          siteId: "site_a",
          siteName: "Preferred Site",
          accessibilityTags: ["step_free_access"],
          continuityScore: 0.95,
          restrictions: [],
          bookabilityMode: "dual",
          inventoryLineageRef: "inventory_lineage_b",
          sourceVersionRef: "supplier_version_b",
        },
      ],
    },
  ];
}

function buildSearchPolicy(seed = "285") {
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

describe("phase4 capacity rank offer application", () => {
  it("compiles one offer session from the current snapshot and supports page, compare, selection, and refresh flows", async () => {
    const bookingCaseApplication = createPhase4BookingCaseApplication({
      directResolutionApplication: {
        async queryTaskDirectResolution() {
          return structuredClone(buildDirectResolutionBundle());
        },
      },
    });

    await bookingCaseApplication.createBookingCaseFromTaskHandoff({
      taskId: "task_285",
      bookingCaseId: "booking_case_285",
      patientRef: "patient_285",
      tenantId: "tenant_vecells_beta",
      providerContext: {
        practiceRef: "ods_A83002",
        supplierHintRef: "vecells_local_gateway",
        careSetting: "general_practice",
      },
      actorRef: "actor_285",
      routeIntentBindingRef: "route_intent_285",
      commandActionRecordRef: "create_case_action_285",
      commandSettlementRecordRef: "create_case_settlement_285",
      createdAt: "2026-04-18T09:30:00.000Z",
      surfaceRouteContractRef: "booking_route_contract_v1",
      surfacePublicationRef: "surface_publication_285",
      runtimePublicationBundleRef: "runtime_publication_285",
    });

    const capabilityApplication = createPhase4BookingCapabilityApplication({
      bookingCaseApplication,
    });
    const slotSearchApplication = createPhase4SlotSearchApplication({
      bookingCaseApplication,
      bookingCapabilityApplication: capabilityApplication,
    });
    const offerApplication = createPhase4CapacityRankApplication({
      bookingCaseApplication,
      bookingCapabilityApplication: capabilityApplication,
      slotSearchApplication,
    });

    const capability = await capabilityApplication.resolveBookingCaseCapability({
      bookingCaseId: "booking_case_285",
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
      localConsumerCheckpointRef: "local_component_checkpoint_285",
      localConsumerStatus: "ready",
      supplierDegradationStatus: "nominal",
      publicationState: "published",
      assuranceTrustState: "writable",
      routeIntentBindingRef: "route_intent_booking_285",
      surfaceRouteContractRef: "surface_route_booking_285",
      surfacePublicationRef: "surface_publication_booking_285",
      runtimePublicationBundleRef: "runtime_publication_booking_285",
      governingObjectDescriptorRef: "BookingCase",
      governingObjectRef: "booking_case_285",
      governingObjectVersionRef: "booking_case_285_v1",
      parentAnchorRef: "booking_anchor_285",
      commandActionRecordRef: "resolve_capability_case_285",
      commandSettlementRecordRef: "resolve_capability_case_settlement_285",
      subjectRef: "staff_actor_285",
      evaluatedAt: "2026-04-18T12:00:00.000Z",
    });

    await bookingCaseApplication.markCapabilityChecked({
      bookingCaseId: "booking_case_285",
      actorRef: "actor_285",
      routeIntentBindingRef: "route_intent_285",
      commandActionRecordRef: "mark_capability_checked_285",
      commandSettlementRecordRef: "mark_capability_checked_settlement_285",
      recordedAt: "2026-04-18T10:00:00.000Z",
      sourceDecisionEpochRef: "decision_epoch_285",
      sourceDecisionSupersessionRef: null,
      lineageCaseLinkRef: "lineage_case_link_285",
      requestLifecycleLeaseRef: "request_lease_285",
      ownershipEpoch: 4,
      fencingToken: "fencing_token_285",
      currentLineageFenceEpoch: 7,
      reasonCode: "capability_tuple_current",
    });

    await bookingCaseApplication.beginLocalSearch({
      bookingCaseId: "booking_case_285",
      actorRef: "actor_285",
      routeIntentBindingRef: "route_intent_285",
      commandActionRecordRef: "begin_local_search_285",
      commandSettlementRecordRef: "begin_local_search_settlement_285",
      recordedAt: "2026-04-18T10:05:00.000Z",
      sourceDecisionEpochRef: "decision_epoch_285",
      sourceDecisionSupersessionRef: null,
      lineageCaseLinkRef: "lineage_case_link_285",
      requestLifecycleLeaseRef: "request_lease_285",
      ownershipEpoch: 4,
      fencingToken: "fencing_token_285",
      currentLineageFenceEpoch: 7,
      reasonCode: "capability_live_for_search",
      activeCapabilityResolutionRef: capability.resolution.bookingCapabilityResolutionId,
      activeCapabilityProjectionRef: capability.projection.bookingCapabilityProjectionId,
      activeProviderAdapterBindingRef: capability.providerAdapterBinding.bookingProviderAdapterBindingId,
      capabilityState: capability.resolution.capabilityState,
      searchPolicy: buildSearchPolicy(),
    });

    const slotSearch = await slotSearchApplication.startSlotSearch({
      bookingCaseId: "booking_case_285",
      displayTimeZone: "Europe/London",
      supplierWindows: buildSearchWindows(),
      commandActionRecordRef: "slot_search_action_285",
      commandSettlementRecordRef: "slot_search_settlement_285",
      subjectRef: "staff_actor_285",
      occurredAt: "2026-04-18T12:30:00.000Z",
      payloadArtifactRef: "artifact://booking/search/285",
      edgeCorrelationId: "edge_correlation_285",
      expiresInSeconds: 900,
    });

    expect(slotSearch.normalizedSlots).toHaveLength(2);
    expect(capability.resolution.bookingCapabilityResolutionId).toBe(
      slotSearch.slotSetSnapshot.capabilityResolutionRef,
    );

    const created = await offerApplication.createOfferSessionFromCurrentSnapshot({
      bookingCaseId: "booking_case_285",
      actorRef: "actor_285",
      subjectRef: "staff_actor_285",
      commandActionRecordRef: "offer_session_action_285",
      commandSettlementRecordRef: "offer_session_settlement_285",
      occurredAt: "2026-04-18T13:00:00.000Z",
      payloadArtifactRef: "artifact://booking/offers/285",
      edgeCorrelationId: "offer_edge_285",
    });

    expect(created.offerSession.sessionState).toBe("offerable");
    expect(created.offerCandidates).toHaveLength(2);
    expect(created.offerSession.truthMode).toBe("truthful_nonexclusive");

    const current = await offerApplication.queryCurrentOfferSession({
      bookingCaseId: "booking_case_285",
    });
    expect(current?.offerSession.offerSessionId).toBe(created.offerSession.offerSessionId);

    const page = await offerApplication.fetchOfferSessionPage({
      offerSessionId: created.offerSession.offerSessionId,
      pageNumber: 1,
      requestedAt: "2026-04-18T13:05:00.000Z",
    });
    expect(page.candidates.map((candidate) => candidate.offerCandidateId)).toEqual(
      created.capacityRankProof.orderedCandidateRefs,
    );

    const compare = await offerApplication.fetchOfferSessionCompare({
      offerSessionId: created.offerSession.offerSessionId,
      candidateRefs: [page.candidates[1].offerCandidateId, page.candidates[0].offerCandidateId],
      requestedAt: "2026-04-18T13:06:00.000Z",
    });
    expect(compare.candidates.map((candidate) => candidate.offerCandidateId)).toEqual([
      page.candidates[0].offerCandidateId,
      page.candidates[1].offerCandidateId,
    ]);

    await slotSearchApplication.refreshSlotSearch({
      bookingCaseId: "booking_case_285",
      displayTimeZone: "Europe/London",
      supplierWindows: buildSearchWindows(),
      commandActionRecordRef: "slot_search_refresh_action_285",
      commandSettlementRecordRef: "slot_search_refresh_settlement_285",
      subjectRef: "staff_actor_285",
      occurredAt: "2026-04-18T13:15:00.000Z",
      payloadArtifactRef: "artifact://booking/search/285_refresh",
      edgeCorrelationId: "edge_correlation_285_refresh",
      expiresInSeconds: 900,
    });

    const refreshed = await offerApplication.refreshOfferSessionFromCurrentSnapshot({
      bookingCaseId: "booking_case_285",
      actorRef: "actor_285",
      subjectRef: "staff_actor_285",
      commandActionRecordRef: "offer_session_refresh_action_285",
      commandSettlementRecordRef: "offer_session_refresh_settlement_285",
      occurredAt: "2026-04-18T13:16:00.000Z",
      payloadArtifactRef: "artifact://booking/offers/285_refresh",
      edgeCorrelationId: "offer_edge_285_refresh",
    });

    expect(refreshed.offerSession.offerSessionId).not.toBe(created.offerSession.offerSessionId);
    expect(refreshed.supersededOfferSessionRefs).toContain(created.offerSession.offerSessionId);
    const refreshedCurrent = await offerApplication.queryCurrentOfferSession({
      bookingCaseId: "booking_case_285",
    });
    expect(refreshedCurrent?.offerSession.offerSessionId).toBe(refreshed.offerSession.offerSessionId);

    const refreshedCandidate = refreshed.offerCandidates[1];
    const canonicalize = (value) => {
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
    };
    const refreshedProofHash = createHash("sha256")
      .update(
        canonicalize({
          offerSessionId: refreshed.offerSession.offerSessionId,
          slotSetSnapshotRef: refreshed.offerSession.slotSetSnapshotRef,
          capacityRankProofRef: refreshed.capacityRankProof.capacityRankProofId,
          selectionToken: refreshed.offerSession.selectionToken,
          truthMode: refreshed.offerSession.truthMode,
          reservationTruthProjectionRef: refreshed.offerSession.reservationTruthProjectionRef,
          providerAdapterBindingHash: refreshed.offerSession.providerAdapterBindingHash,
          capabilityTupleHash: refreshed.offerSession.capabilityTupleHash,
          selectedCandidateHash: refreshedCandidate.candidateHash,
          selectedCanonicalSlotIdentityRef: refreshedCandidate.canonicalSlotIdentityRef,
        }),
      )
      .digest("hex");

    const selected = await offerApplication.selectOfferCandidate({
      offerSessionId: refreshed.offerSession.offerSessionId,
      offerCandidateId: refreshedCandidate.offerCandidateId,
      selectionToken: refreshed.offerSession.selectionToken,
      selectionProofHash: refreshedProofHash,
      actorRef: "actor_285",
      subjectRef: "staff_actor_285",
      commandActionRecordRef: "select_offer_candidate_285",
      commandSettlementRecordRef: "select_offer_candidate_settlement_285",
      occurredAt: "2026-04-18T13:17:00.000Z",
      payloadArtifactRef: "artifact://booking/offers/285/selection",
      edgeCorrelationId: "offer_selection_edge_285",
    });

    expect(selected.offerSession.sessionState).toBe("selected");
    expect(selected.offerSession.selectedOfferCandidateRef).toBe(refreshedCandidate.offerCandidateId);

    const bookingCase = await bookingCaseApplication.queryBookingCase("booking_case_285");
    expect(bookingCase?.bookingCase.status).toBe("selecting");
    expect(bookingCase?.bookingCase.currentOfferSessionRef).toBe(refreshed.offerSession.offerSessionId);
    expect(bookingCase?.bookingCase.selectedSlotRef).toBe(refreshedCandidate.normalizedSlotRef);
  });

  it("publishes the expected metadata surfaces and route catalog entries", () => {
    expect(PHASE4_CAPACITY_RANK_SERVICE_NAME).toBe(
      "Phase4CapacityRankOfferSessionApplication",
    );
    expect(PHASE4_CAPACITY_RANK_SCHEMA_VERSION).toBe(
      "285.phase4.slot-scoring-offer-orchestration.v1",
    );
    expect(PHASE4_CAPACITY_RANK_QUERY_SURFACES).toEqual(
      expect.arrayContaining([
        "GET /v1/bookings/cases/{bookingCaseId}/offers/current",
        "GET /v1/bookings/offer-sessions/{offerSessionId}/pages/{pageNumber}",
        "GET /v1/bookings/offer-sessions/{offerSessionId}/compare",
      ]),
    );
    expect(phase4CapacityRankPersistenceTables).toEqual(
      expect.arrayContaining([
        "phase4_rank_plans",
        "phase4_capacity_rank_proofs",
        "phase4_offer_sessions",
        "phase4_offer_candidates",
      ]),
    );
    expect(phase4CapacityRankMigrationPlanRefs).toContain(
      "services/command-api/migrations/134_phase4_capacity_rank_and_offer_session.sql",
    );
    expect(
      phase4CapacityRankRoutes.map((route) => route.routeId),
    ).toEqual(
      expect.arrayContaining([
        "booking_case_offer_session_current",
        "booking_offer_session_page",
        "booking_offer_session_compare",
        "booking_case_offer_session_create",
        "booking_case_offer_session_refresh",
        "booking_offer_session_select_candidate",
      ]),
    );
    for (const routeId of phase4CapacityRankRoutes.map((route) => route.routeId)) {
      expect(serviceDefinition.routeCatalog.some((route) => route.routeId === routeId)).toBe(true);
    }
  });
});
