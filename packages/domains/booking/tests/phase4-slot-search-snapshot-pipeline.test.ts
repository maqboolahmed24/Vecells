import { describe, expect, it } from "vitest";
import {
  createPhase4BookingCapabilityEngineService,
  createPhase4BookingCapabilityEngineStore,
} from "../src/phase4-booking-capability-engine.ts";
import type { SearchPolicySnapshot } from "../src/phase4-booking-case-kernel.ts";
import {
  createPhase4SlotSearchSnapshotService,
  createPhase4SlotSearchSnapshotStore,
  type SlotSearchExecutionInput,
} from "../src/phase4-slot-search-snapshot-pipeline.ts";

function buildSearchPolicy(seed = "284"): SearchPolicySnapshot {
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
    sameBandReorderSlackMinutesByWindow: {
      early: 10,
      standard: 20,
    },
  };
}

async function buildLiveSearchCapability(seed = "284") {
  const service = createPhase4BookingCapabilityEngineService({
    repositories: createPhase4BookingCapabilityEngineStore(),
  });

  return service.resolveBookingCapability({
    bookingCaseId: `booking_case_${seed}`,
    appointmentId: null,
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
}

async function buildSearchExecutionInput(
  overrides: Partial<SlotSearchExecutionInput> = {},
): Promise<SlotSearchExecutionInput> {
  const capability = await buildLiveSearchCapability();
  return {
    bookingCaseId: "booking_case_284",
    caseVersionRef: capability.resolution.governingObjectVersionRef,
    searchPolicy: buildSearchPolicy(),
    capabilityResolution: capability.resolution,
    providerAdapterBinding: capability.providerAdapterBinding,
    displayTimeZone: "Europe/London",
    supplierWindows: [
      {
        supplierRef: capability.providerAdapterBinding.supplierRef,
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
          {
            supplierSlotRef: "slot_a_0730",
            capacityUnitRef: "cap_u2",
            scheduleRef: "schedule_a",
            locationRef: "location_a",
            clinicianType: "general_practice",
            modality: "in_person",
            startAt: "2026-04-20T07:30:00.000Z",
            endAt: "2026-04-20T07:45:00.000Z",
            siteId: "site_a",
            accessibilityTags: ["step_free_access"],
            restrictions: [],
            bookabilityMode: "dual",
          },
        ],
      },
      {
        supplierRef: capability.providerAdapterBinding.supplierRef,
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
    ],
    commandActionRecordRef: "command_action_284",
    commandSettlementRecordRef: "command_settlement_284",
    routeIntentBindingRef: capability.resolution.routeTuple.routeIntentBindingRef,
    subjectRef: "staff_actor_284",
    occurredAt: "2026-04-18T12:30:00.000Z",
    payloadArtifactRef: "artifact://booking/search/284",
    edgeCorrelationId: "edge_correlation_284",
    expiresInSeconds: 900,
    ...overrides,
  };
}

describe("phase4 slot search snapshot pipeline", () => {
  it("materializes snapshot truth with replay safety and per-slice provenance", async () => {
    const repositories = createPhase4SlotSearchSnapshotStore();
    const service = createPhase4SlotSearchSnapshotService({ repositories });
    const input = await buildSearchExecutionInput();

    const first = await service.executeSlotSearch(input);
    const replay = await service.executeSlotSearch(input);

    expect(first.searchSession.slotSearchSessionId).toBe(replay.searchSession.slotSearchSessionId);
    expect(first.slotSetSnapshot.slotSetSnapshotId).toBe(replay.slotSetSnapshot.slotSetSnapshotId);
    expect(first.providerSearchSlices).toHaveLength(2);
    expect(first.canonicalSlotIdentities).toHaveLength(3);
    expect(first.normalizedSlots).toHaveLength(2);
    expect(first.candidateIndex.orderedSlotRefs).toHaveLength(2);
    expect(first.candidateIndex.aggregateCounters.filteredCount).toBe(1);
    expect(first.emittedEvents[0]?.eventType).toBe("booking.slots.fetched");

    const northSiteSlot = first.normalizedSlots.find((slot) => slot.siteId === "site_a");
    const southSiteSlot = first.normalizedSlots.find((slot) => slot.siteId === "site_b");
    expect(northSiteSlot?.sourceSliceRef).toBe(first.providerSearchSlices[0]?.providerSearchSliceId);
    expect(southSiteSlot?.sourceSliceRef).toBe(first.providerSearchSlices[1]?.providerSearchSliceId);

    const current = await service.queryCurrentSlotSearch("booking_case_284", "staff");
    expect(current?.slotSetSnapshot.slotSetSnapshotId).toBe(first.slotSetSnapshot.slotSetSnapshotId);

    const page = await service.fetchSnapshotPage(first.slotSetSnapshot.slotSetSnapshotId, 1, {
      bookingCaseId: "booking_case_284",
      caseVersionRef: first.slotSetSnapshot.caseVersionRef,
      policyBundleHash: first.slotSetSnapshot.policyBundleHash,
      providerAdapterBindingHash: first.slotSetSnapshot.providerAdapterBindingHash,
      capabilityTupleHash: first.slotSetSnapshot.capabilityTupleHash,
      now: "2026-04-18T12:35:00.000Z",
    });
    expect(page.selectable).toBe(true);
    expect(page.effectiveRecoveryState.viewState).toBe("renderable");
    expect(page.slots.map((slot) => slot.siteId)).toEqual(["site_a", "site_b"]);
  });

  it("fails closed into recovery when temporal normalization cannot safely resolve supplier rows", async () => {
    const service = createPhase4SlotSearchSnapshotService({
      repositories: createPhase4SlotSearchSnapshotStore(),
    });
    const input = await buildSearchExecutionInput({
      commandActionRecordRef: "command_action_284_temporal",
      supplierWindows: [
        {
          supplierRef: "vecells_local_gateway",
          supplierWindowRef: "supplier_window_temporal",
          searchWindowStartAt: "2026-04-20T08:00:00.000Z",
          searchWindowEndAt: "2026-04-20T13:00:00.000Z",
          fetchStartedAt: "2026-04-18T12:00:00.000Z",
          fetchCompletedAt: "2026-04-18T12:00:03.000Z",
          coverageStateHint: "degraded",
          degradationReasonRefs: ["temporal_normalization_recovery"],
          rawRows: [
            {
              supplierSlotRef: "slot_temporal_ambiguous",
              capacityUnitRef: "cap_temporal",
              scheduleRef: "schedule_temporal",
              locationRef: "location_temporal",
              clinicianType: "general_practice",
              modality: "in_person",
              startAt: "2026-10-25T01:30:00",
              endAt: "2026-10-25T01:45:00",
              sourceTimeZone: "Europe/London",
              siteId: "site_a",
              accessibilityTags: ["step_free_access"],
              restrictions: [],
              bookabilityMode: "dual",
            },
          ],
        },
      ],
    });

    const result = await service.executeSlotSearch(input);

    expect(result.slotSetSnapshot.slotCount).toBe(0);
    expect(result.slotSetSnapshot.coverageState).toBe("degraded");
    expect(result.recoveryState.viewState).toBe("support_fallback");
    expect(result.recoveryState.reasonCodes).toEqual(
      expect.arrayContaining(["temporal_ambiguous_local_time", "temporal_normalization_recovery"]),
    );
    expect(result.candidateIndex.aggregateCounters.temporal_ambiguous_local_time).toBe(1);
  });

  it("marks snapshot stale when the governing tuple drifts at read time", async () => {
    const service = createPhase4SlotSearchSnapshotService({
      repositories: createPhase4SlotSearchSnapshotStore(),
    });
    const input = await buildSearchExecutionInput({
      commandActionRecordRef: "command_action_284_stale",
    });

    const result = await service.executeSlotSearch(input);
    const page = await service.fetchSnapshotPage(result.slotSetSnapshot.slotSetSnapshotId, 1, {
      bookingCaseId: "booking_case_284",
      caseVersionRef: "booking_case_284_v2",
      policyBundleHash: result.slotSetSnapshot.policyBundleHash,
      providerAdapterBindingHash: result.slotSetSnapshot.providerAdapterBindingHash,
      capabilityTupleHash: result.slotSetSnapshot.capabilityTupleHash,
      now: "2026-04-18T12:35:00.000Z",
    });

    expect(page.selectable).toBe(false);
    expect(page.failureReasonCodes).toContain("case_version_drift");
    expect(page.effectiveRecoveryState.viewState).toBe("stale_refresh_required");
  });
});
