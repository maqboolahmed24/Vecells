import { describe, expect, it } from "vitest";
import { serviceDefinition } from "../src/service-definition.ts";
import {
  PHASE4_SLOT_SEARCH_QUERY_SURFACES,
  PHASE4_SLOT_SEARCH_SCHEMA_VERSION,
  PHASE4_SLOT_SEARCH_SERVICE_NAME,
  createPhase4SlotSearchApplication,
  phase4SlotSearchMigrationPlanRefs,
  phase4SlotSearchPersistenceTables,
  phase4SlotSearchRoutes,
} from "../src/phase4-slot-search.ts";
import { createPhase4BookingCaseApplication } from "../src/phase4-booking-case.ts";
import { createPhase4BookingCapabilityApplication } from "../src/phase4-booking-capability.ts";

function buildDirectResolutionBundle(seed = "284") {
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
      patientPreferenceSummary: "Prefers mornings.",
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

function buildSearchPolicy(seed = "284") {
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

function buildSearchWindows() {
  return [
    {
      supplierRef: "vecells_local_gateway",
      supplierWindowRef: "supplier_window_a",
      searchWindowStartAt: "2026-04-20T08:00:00.000Z",
      searchWindowEndAt: "2026-04-20T13:00:00.000Z",
      fetchStartedAt: "2026-04-18T12:00:00.000Z",
      fetchCompletedAt: "2026-04-18T12:00:05.000Z",
      rawRows: [
        {
          supplierSlotRef: "slot_a_0900",
          capacityUnitRef: "cap_u1",
          scheduleRef: "schedule_a",
          scheduleOwnerRef: "schedule_owner_a",
          locationRef: "location_a",
          locationName: "North Site",
          practitionerRef: "practitioner_a",
          serviceRef: "service_gp",
          clinicianType: "general_practice",
          modality: "in_person",
          startAt: "2026-04-20T09:00:00.000Z",
          endAt: "2026-04-20T09:15:00.000Z",
          siteId: "site_a",
          siteName: "North Site",
          accessibilityTags: ["step_free_access", "lift_access"],
          continuityScore: 0.8,
          restrictions: [],
          bookabilityMode: "dual",
          inventoryLineageRef: "inventory_lineage_a",
          sourceVersionRef: "supplier_version_a",
        },
      ],
    },
    {
      supplierRef: "vecells_local_gateway",
      supplierWindowRef: "supplier_window_b",
      searchWindowStartAt: "2026-04-20T13:00:00.000Z",
      searchWindowEndAt: "2026-04-20T18:00:00.000Z",
      fetchStartedAt: "2026-04-18T12:00:06.000Z",
      fetchCompletedAt: "2026-04-18T12:00:10.000Z",
      rawRows: [
        {
          supplierSlotRef: "slot_b_1100",
          capacityUnitRef: "cap_u3",
          scheduleRef: "schedule_b",
          scheduleOwnerRef: "schedule_owner_b",
          locationRef: "location_b",
          locationName: "South Site",
          practitionerRef: "practitioner_b",
          serviceRef: "service_gp",
          clinicianType: "general_practice",
          modality: "in_person",
          startAt: "2026-04-20T11:00:00.000Z",
          endAt: "2026-04-20T11:15:00.000Z",
          siteId: "site_b",
          siteName: "South Site",
          accessibilityTags: ["step_free_access"],
          continuityScore: 0.6,
          restrictions: [],
          bookabilityMode: "dual",
          inventoryLineageRef: "inventory_lineage_b",
          sourceVersionRef: "supplier_version_b",
        },
      ],
    },
  ];
}

describe("phase4 slot search application", () => {
  it("starts one frozen slot search from the live booking-case and capability tuple", async () => {
    const bookingCaseApplication = createPhase4BookingCaseApplication({
      directResolutionApplication: {
        async queryTaskDirectResolution() {
          return structuredClone(buildDirectResolutionBundle());
        },
      },
    });

    await bookingCaseApplication.createBookingCaseFromTaskHandoff({
      taskId: "task_284",
      bookingCaseId: "booking_case_284",
      patientRef: "patient_284",
      tenantId: "tenant_vecells_beta",
      providerContext: {
        practiceRef: "ods_A83002",
        supplierHintRef: "vecells_local_gateway",
        careSetting: "general_practice",
      },
      actorRef: "actor_284",
      routeIntentBindingRef: "route_intent_284",
      commandActionRecordRef: "create_case_action_284",
      commandSettlementRecordRef: "create_case_settlement_284",
      createdAt: "2026-04-18T09:30:00.000Z",
      surfaceRouteContractRef: "booking_route_contract_v1",
      surfacePublicationRef: "surface_publication_284",
      runtimePublicationBundleRef: "runtime_publication_284",
    });

    const capabilityApplication = createPhase4BookingCapabilityApplication({
      bookingCaseApplication,
    });

    const capability = await capabilityApplication.resolveBookingCaseCapability({
      bookingCaseId: "booking_case_284",
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
      localConsumerCheckpointRef: "local_component_checkpoint_284",
      localConsumerStatus: "ready",
      supplierDegradationStatus: "nominal",
      publicationState: "published",
      assuranceTrustState: "writable",
      routeIntentBindingRef: "route_intent_booking_284",
      surfaceRouteContractRef: "surface_route_booking_284",
      surfacePublicationRef: "surface_publication_booking_284",
      runtimePublicationBundleRef: "runtime_publication_booking_284",
      governingObjectDescriptorRef: "BookingCase",
      governingObjectRef: "booking_case_284",
      governingObjectVersionRef: "booking_case_284_v1",
      parentAnchorRef: "booking_anchor_284",
      commandActionRecordRef: "resolve_capability_case_284",
      commandSettlementRecordRef: "resolve_capability_case_settlement_284",
      subjectRef: "staff_actor_284",
      evaluatedAt: "2026-04-18T12:00:00.000Z",
    });

    await bookingCaseApplication.markCapabilityChecked({
      bookingCaseId: "booking_case_284",
      actorRef: "actor_284",
      routeIntentBindingRef: "route_intent_284",
      commandActionRecordRef: "mark_capability_checked_284",
      commandSettlementRecordRef: "mark_capability_checked_settlement_284",
      recordedAt: "2026-04-18T10:00:00.000Z",
      sourceDecisionEpochRef: "decision_epoch_284",
      sourceDecisionSupersessionRef: null,
      lineageCaseLinkRef: "lineage_case_link_284",
      requestLifecycleLeaseRef: "request_lease_284",
      ownershipEpoch: 4,
      fencingToken: "fencing_token_284",
      currentLineageFenceEpoch: 7,
      reasonCode: "capability_tuple_current",
    });

    await bookingCaseApplication.beginLocalSearch({
      bookingCaseId: "booking_case_284",
      actorRef: "actor_284",
      routeIntentBindingRef: "route_intent_284",
      commandActionRecordRef: "begin_local_search_284",
      commandSettlementRecordRef: "begin_local_search_settlement_284",
      recordedAt: "2026-04-18T10:05:00.000Z",
      sourceDecisionEpochRef: "decision_epoch_284",
      sourceDecisionSupersessionRef: null,
      lineageCaseLinkRef: "lineage_case_link_284",
      requestLifecycleLeaseRef: "request_lease_284",
      ownershipEpoch: 4,
      fencingToken: "fencing_token_284",
      currentLineageFenceEpoch: 7,
      reasonCode: "capability_live_for_search",
      activeCapabilityResolutionRef: capability.resolution.bookingCapabilityResolutionId,
      activeCapabilityProjectionRef: capability.projection.bookingCapabilityProjectionId,
      activeProviderAdapterBindingRef: capability.providerAdapterBinding.bookingProviderAdapterBindingId,
      capabilityState: capability.resolution.capabilityState,
      searchPolicy: buildSearchPolicy(),
    });

    const application = createPhase4SlotSearchApplication({
      bookingCaseApplication,
      bookingCapabilityApplication: capabilityApplication,
    });

    const started = await application.startSlotSearch({
      bookingCaseId: "booking_case_284",
      displayTimeZone: "Europe/London",
      supplierWindows: buildSearchWindows(),
      commandActionRecordRef: "start_slot_search_284",
      commandSettlementRecordRef: "start_slot_search_settlement_284",
      subjectRef: "staff_actor_284",
      occurredAt: "2026-04-18T12:30:00.000Z",
      payloadArtifactRef: "artifact://booking/search/284",
      edgeCorrelationId: "edge_correlation_284",
    });

    expect(started.slotSetSnapshot.slotCount).toBe(2);
    expect(started.providerSearchSlices).toHaveLength(2);
    expect(started.emittedEvents).toHaveLength(1);

    const current = await application.queryCurrentSlotSearch({
      bookingCaseId: "booking_case_284",
    });
    expect(current?.slotSetSnapshot.slotSetSnapshotId).toBe(started.slotSetSnapshot.slotSetSnapshotId);

    const page = await application.fetchSlotSnapshotPage({
      slotSetSnapshotId: started.slotSetSnapshot.slotSetSnapshotId,
      pageNumber: 1,
      requestedAt: "2026-04-18T12:35:00.000Z",
    });
    expect(page.selectable).toBe(true);
    expect(page.slots).toHaveLength(2);

    const dayBucket = await application.fetchSlotSnapshotDayBucket({
      slotSetSnapshotId: started.slotSetSnapshot.slotSetSnapshotId,
      localDayKey: "2026-04-20",
      requestedAt: "2026-04-18T12:35:00.000Z",
    });
    expect(dayBucket.slots).toHaveLength(2);

    const refreshed = await application.refreshSlotSearch({
      bookingCaseId: "booking_case_284",
      displayTimeZone: "Europe/London",
      supplierWindows: [buildSearchWindows()[0]],
      commandActionRecordRef: "refresh_slot_search_284",
      commandSettlementRecordRef: "refresh_slot_search_settlement_284",
      subjectRef: "staff_actor_284",
      occurredAt: "2026-04-18T12:40:00.000Z",
    });
    expect(refreshed.supersededSnapshotRefs).toContain(started.slotSetSnapshot.slotSetSnapshotId);

    const invalidated = await application.invalidateSlotSnapshot({
      slotSetSnapshotId: refreshed.slotSetSnapshot.slotSetSnapshotId,
      reasonCodes: ["operator_reset"],
      invalidatedAt: "2026-04-18T12:45:00.000Z",
    });
    expect(invalidated.viewState).toBe("stale_refresh_required");

    const noCurrent = await application.queryCurrentSlotSearch({
      bookingCaseId: "booking_case_284",
    });
    expect(noCurrent).toBeNull();
  });

  it("publishes the expected 284 route, persistence, and migration metadata", () => {
    expect(PHASE4_SLOT_SEARCH_SERVICE_NAME).toBe(
      "Phase4SlotSearchSnapshotPipelineApplication",
    );
    expect(PHASE4_SLOT_SEARCH_SCHEMA_VERSION).toBe(
      "284.phase4.slot-search-snapshot-pipeline.v1",
    );
    expect(PHASE4_SLOT_SEARCH_QUERY_SURFACES).toEqual(
      expect.arrayContaining([
        "GET /v1/bookings/cases/{bookingCaseId}/slot-search/current",
        "GET /v1/bookings/slot-snapshots/{slotSetSnapshotId}/pages/{pageNumber}",
        "GET /v1/bookings/slot-snapshots/{slotSetSnapshotId}/days/{localDayKey}",
      ]),
    );
    expect(phase4SlotSearchPersistenceTables).toEqual(
      expect.arrayContaining([
        "phase4_slot_search_sessions",
        "phase4_provider_search_slices",
        "phase4_slot_set_snapshots",
      ]),
    );
    expect(phase4SlotSearchMigrationPlanRefs).toContain(
      "services/command-api/migrations/133_phase4_slot_search_snapshot_pipeline.sql",
    );
    expect(phase4SlotSearchRoutes.map((route) => route.routeId)).toEqual(
      expect.arrayContaining([
        "booking_case_slot_search_current",
        "booking_slot_snapshot_page",
        "booking_slot_snapshot_day_bucket",
        "booking_case_slot_search_start",
        "booking_slot_search_refresh",
        "booking_slot_search_invalidate",
      ]),
    );
    expect(serviceDefinition.routeCatalog.map((route) => route.routeId)).toEqual(
      expect.arrayContaining([
        "booking_case_slot_search_current",
        "booking_slot_snapshot_page",
        "booking_slot_snapshot_day_bucket",
        "booking_case_slot_search_start",
        "booking_slot_search_refresh",
        "booking_slot_search_invalidate",
      ]),
    );
  });
});
