import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  createPhase4BookingCapabilityEngineService,
  createPhase4BookingCapabilityEngineStore,
  type BookingSelectionAudience,
} from "../src/phase4-booking-capability-engine.ts";
import type { SearchPolicySnapshot } from "../src/phase4-booking-case-kernel.ts";
import {
  createPhase4SlotSearchSnapshotService,
  createPhase4SlotSearchSnapshotStore,
  type ProviderSearchWindowInput,
  type SlotSearchExecutionInput,
} from "../src/phase4-slot-search-snapshot-pipeline.ts";
import {
  createPhase4CapacityRankService,
  createPhase4CapacityRankStore,
  type OfferSessionCompilationInput,
} from "../src/phase4-capacity-rank-offer-engine.ts";

function canonicalize(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => canonicalize(entry)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, entryValue]) => entryValue !== undefined)
      .sort(([left], [right]) => left.localeCompare(right));
    return `{${entries
      .map(([key, entryValue]) => `${JSON.stringify(key)}:${canonicalize(entryValue)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function selectionProofHash(input: {
  offerSessionId: string;
  slotSetSnapshotRef: string;
  capacityRankProofRef: string;
  selectionToken: string;
  truthMode: string;
  reservationTruthProjectionRef: string;
  providerAdapterBindingHash: string;
  capabilityTupleHash: string;
  selectedCandidateHash: string;
  selectedCanonicalSlotIdentityRef: string;
}): string {
  return createHash("sha256").update(canonicalize(input)).digest("hex");
}

function buildSearchPolicy(
  seed = "285",
  selectionAudience: SearchPolicySnapshot["selectionAudience"] = "staff_assist",
): SearchPolicySnapshot {
  return {
    policyId: `search_policy_${seed}`,
    timeframeEarliest: "2026-04-20T08:00:00.000Z",
    timeframeLatest: "2026-04-27T18:00:00.000Z",
    modality: "in_person",
    clinicianType: "general_practice",
    continuityPreference: "preferred_clinician_if_available",
    sitePreference: ["site_a", "site_b"],
    accessibilityNeeds: ["step_free_access"],
    maxTravelTime: 45,
    bookabilityPolicy: "patient_visible_slots_only",
    selectionAudience,
    patientChannelMode: selectionAudience === "patient_self_service" ? "signed_in_shell" : "staff_proxy",
    policyBundleHash: `policy_bundle_hash_${seed}_${selectionAudience}`,
    sameBandReorderSlackMinutesByWindow: {
      preferred: 180,
      acceptable: 240,
    },
  };
}

async function buildLiveSearchCapability(
  seed = "285",
  selectionAudience: BookingSelectionAudience = "staff",
) {
  const service = createPhase4BookingCapabilityEngineService({
    repositories: createPhase4BookingCapabilityEngineStore(),
  });
  return service.resolveBookingCapability({
    bookingCaseId: `booking_case_${seed}`,
    appointmentId: null,
    tenantId: "tenant_vecells_beta",
    practiceRef: "ods_A83002",
    organisationRef: "org_vecells_beta",
    supplierRef: selectionAudience === "patient" ? "optum_emis_web" : "vecells_local_gateway",
    integrationMode: selectionAudience === "patient" ? "im1_patient_api" : "local_gateway_component",
    deploymentType:
      selectionAudience === "patient" ? "internet_patient_shell" : "practice_local_gateway",
    selectionAudience,
    requestedActionScope: "search_slots",
    gpLinkageCheckpointRef: null,
    gpLinkageStatus: "not_required",
    localConsumerCheckpointRef: `local_component_checkpoint_${seed}`,
    localConsumerStatus: "ready",
    supplierDegradationStatus: "nominal",
    publicationState: "published",
    assuranceTrustState: "writable",
    routeIntentBindingRef: `route_intent_booking_${seed}_${selectionAudience}`,
    surfaceRouteContractRef: `surface_route_booking_${seed}`,
    surfacePublicationRef: `surface_publication_booking_${seed}`,
    runtimePublicationBundleRef: `runtime_publication_booking_${seed}`,
    governingObjectDescriptorRef: "BookingCase",
    governingObjectRef: `booking_case_${seed}`,
    governingObjectVersionRef: `booking_case_${seed}_v1`,
    parentAnchorRef: `booking_anchor_${seed}`,
    commandActionRecordRef: `resolve_capability_case_${seed}`,
    commandSettlementRecordRef: `resolve_capability_case_settlement_${seed}`,
    subjectRef: `actor_${seed}`,
    evaluatedAt: "2026-04-18T12:00:00.000Z",
  });
}

async function buildOfferCompilationInput(input?: {
  seed?: string;
  selectionAudience?: BookingSelectionAudience;
  patientPreferenceSummary?: string;
  supplierWindows?: readonly ProviderSearchWindowInput[];
}): Promise<OfferSessionCompilationInput> {
  const seed = input?.seed ?? "285";
  const selectionAudience = input?.selectionAudience ?? "staff";
  const capability = await buildLiveSearchCapability(seed, selectionAudience);
  const searchPolicy = buildSearchPolicy(
    seed,
    selectionAudience === "patient" ? "patient_self_service" : "staff_assist",
  );
  const slotSearchService = createPhase4SlotSearchSnapshotService({
    repositories: createPhase4SlotSearchSnapshotStore(),
  });

  const supplierWindows: readonly ProviderSearchWindowInput[] =
    input?.supplierWindows ??
    [
      {
        supplierRef: capability.providerAdapterBinding.supplierRef,
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
            locationName: "North Site",
            practitionerRef: "practitioner_a",
            serviceRef: "service_gp",
            clinicianType: "general_practice",
            modality: "in_person",
            startAt: "2026-04-20T09:00:00.000Z",
            endAt: "2026-04-20T09:15:00.000Z",
            siteId: "site_b",
            siteName: "Secondary Preferred Site",
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
          {
            supplierSlotRef: "slot_c_1430",
            capacityUnitRef: "cap_u3",
            scheduleRef: "schedule_c",
            scheduleOwnerRef: "schedule_owner_c",
            locationRef: "location_c",
            locationName: "Preferred Site Later",
            practitionerRef: "practitioner_c",
            serviceRef: "service_gp",
            clinicianType: "general_practice",
            modality: "in_person",
            startAt: "2026-04-20T14:30:00.000Z",
            endAt: "2026-04-20T14:45:00.000Z",
            siteId: "site_a",
            siteName: "Preferred Site Later",
            accessibilityTags: ["step_free_access"],
            continuityScore: 0.9,
            restrictions: [],
            bookabilityMode: "dual",
            inventoryLineageRef: "inventory_lineage_c",
            sourceVersionRef: "supplier_version_c",
          },
        ],
      },
    ];

  const slotSearchResult = await slotSearchService.executeSlotSearch({
    bookingCaseId: `booking_case_${seed}`,
    caseVersionRef: capability.resolution.governingObjectVersionRef,
    searchPolicy,
    capabilityResolution: capability.resolution,
    providerAdapterBinding: capability.providerAdapterBinding,
    displayTimeZone: "Europe/London",
    supplierWindows,
    commandActionRecordRef: `slot_search_action_${seed}`,
    commandSettlementRecordRef: `slot_search_settlement_${seed}`,
    routeIntentBindingRef: capability.resolution.routeTuple.routeIntentBindingRef,
    subjectRef: `actor_${seed}`,
    occurredAt: "2026-04-18T12:30:00.000Z",
    payloadArtifactRef: `artifact://booking/search/${seed}`,
    edgeCorrelationId: `edge_correlation_${seed}`,
    expiresInSeconds: 900,
  } satisfies SlotSearchExecutionInput);

  return {
    bookingCaseId: `booking_case_${seed}`,
    searchPolicy,
    capabilityResolution: capability.resolution,
    providerAdapterBinding: capability.providerAdapterBinding,
    slotSetSnapshot: slotSearchResult.slotSetSnapshot,
    recoveryState: slotSearchResult.recoveryState,
    candidateIndex: slotSearchResult.candidateIndex,
    normalizedSlots: slotSearchResult.normalizedSlots,
    patientPreferenceSummary: input?.patientPreferenceSummary ?? "Prefers mornings and the usual site.",
    commandActionRecordRef: `offer_session_action_${seed}`,
    commandSettlementRecordRef: `offer_session_settlement_${seed}`,
    routeIntentBindingRef: capability.resolution.routeTuple.routeIntentBindingRef,
    subjectRef: `actor_${seed}`,
    occurredAt: "2026-04-18T13:00:00.000Z",
    payloadArtifactRef: `artifact://booking/offers/${seed}`,
    edgeCorrelationId: `offer_edge_${seed}`,
    offerSessionTtlSeconds: 900,
  };
}

describe("phase4 capacity rank and offer engine", () => {
  it("creates one deterministic ranked proof and reuses it for paging and compare mode", async () => {
    const service = createPhase4CapacityRankService({
      repositories: createPhase4CapacityRankStore(),
    });
    const input = await buildOfferCompilationInput({ seed: "285_rank" });

    const result = await service.createOfferSession(input);

    expect(result.rankPlan.rankPlanVersion).toBe("285.rank-plan.local-booking.v1");
    expect(result.offerSession.sessionState).toBe("offerable");
    expect(result.offerCandidates.map((candidate) => candidate.slotSnapshot.supplierSlotId)).toEqual([
      "slot_b_1030",
      "slot_a_0900",
      "slot_c_1430",
    ]);
    expect(result.offerCandidates.map((candidate) => candidate.frontierMembership)).toEqual([
      true,
      true,
      false,
    ]);
    expect(result.explanations[0]?.patientReasonCueRefs).toContain("cue_best_match");
    expect(result.emittedEvents[0]?.eventType).toBe("booking.offers.created");

    const page = await service.fetchOfferPage(result.offerSession.offerSessionId, 1, {
      bookingCaseId: input.bookingCaseId,
      caseVersionRef: input.slotSetSnapshot.caseVersionRef,
      policyBundleHash: input.slotSetSnapshot.policyBundleHash,
      providerAdapterBindingHash: input.slotSetSnapshot.providerAdapterBindingHash,
      capabilityTupleHash: input.slotSetSnapshot.capabilityTupleHash,
      currentSlotSetSnapshotRef: input.slotSetSnapshot.slotSetSnapshotId,
      now: "2026-04-18T13:10:00.000Z",
    });
    expect(page.candidates.map((candidate) => candidate.offerCandidateId)).toEqual(
      result.capacityRankProof.orderedCandidateRefs,
    );

    const compare = await service.fetchCompareCandidates(
      result.offerSession.offerSessionId,
      [
        result.capacityRankProof.orderedCandidateRefs[2]!,
        result.capacityRankProof.orderedCandidateRefs[0]!,
      ],
      {
        bookingCaseId: input.bookingCaseId,
        caseVersionRef: input.slotSetSnapshot.caseVersionRef,
        policyBundleHash: input.slotSetSnapshot.policyBundleHash,
        providerAdapterBindingHash: input.slotSetSnapshot.providerAdapterBindingHash,
        capabilityTupleHash: input.slotSetSnapshot.capabilityTupleHash,
        currentSlotSetSnapshotRef: input.slotSetSnapshot.slotSetSnapshotId,
        now: "2026-04-18T13:11:00.000Z",
      },
    );
    expect(compare.candidates.map((candidate) => candidate.offerCandidateId)).toEqual([
      result.capacityRankProof.orderedCandidateRefs[0]!,
      result.capacityRankProof.orderedCandidateRefs[2]!,
    ]);
  });

  it("enforces hard filters even if stale candidates leak into the ranking input", async () => {
    const service = createPhase4CapacityRankService({
      repositories: createPhase4CapacityRankStore(),
    });
    const input = await buildOfferCompilationInput({ seed: "285_filters" });
    const staleCandidate = {
      ...input.normalizedSlots[0]!,
      normalizedSlotId: "normalized_slot_stale_wrong_modality",
      canonicalSlotIdentityRef: "canonical_slot_stale_wrong_modality",
      supplierSlotId: "slot_wrong_modality",
      modality: "remote",
      clinicianType: "dermatology",
      accessibilityTags: [],
      bookabilityMode: "view_only" as const,
      restrictions: ["linkage_blocked"],
      canonicalTieBreakKey: "0000000000000000::stale::remote::view_only::x::y",
    };
    const result = await service.createOfferSession({
      ...input,
      normalizedSlots: [...input.normalizedSlots, staleCandidate],
      candidateIndex: {
        ...input.candidateIndex,
        orderedSlotRefs: [...input.candidateIndex.orderedSlotRefs, staleCandidate.normalizedSlotId],
      },
      commandActionRecordRef: "offer_session_action_285_filters_second",
    });

    expect(
      result.offerCandidates.some((candidate) => candidate.slotSnapshot.supplierSlotId === "slot_wrong_modality"),
    ).toBe(false);
  });

  it("keeps patient self-service offerability narrower than staff-assisted offerability", async () => {
    const staffInputForAudienceTest = await buildOfferCompilationInput({
      seed: "285_patient_staff_base",
      selectionAudience: "staff",
      supplierWindows: [
        {
          supplierRef: "vecells_local_gateway",
          supplierWindowRef: "supplier_window_staff",
          searchWindowStartAt: "2026-04-20T08:00:00.000Z",
          searchWindowEndAt: "2026-04-20T18:00:00.000Z",
          fetchStartedAt: "2026-04-18T12:00:00.000Z",
          fetchCompletedAt: "2026-04-18T12:00:05.000Z",
          rawRows: [
            {
              supplierSlotRef: "slot_patient_dual",
              capacityUnitRef: "cap_sd",
              scheduleRef: "schedule_sd",
              locationRef: "location_sd",
              clinicianType: "general_practice",
              modality: "in_person",
              startAt: "2026-04-20T09:00:00.000Z",
              endAt: "2026-04-20T09:15:00.000Z",
              siteId: "site_a",
              accessibilityTags: ["step_free_access"],
              continuityScore: 0.7,
              restrictions: [],
              bookabilityMode: "dual",
            },
            {
              supplierSlotRef: "slot_staff_only",
              capacityUnitRef: "cap_ss",
              scheduleRef: "schedule_ss",
              locationRef: "location_ss",
              clinicianType: "general_practice",
              modality: "in_person",
              startAt: "2026-04-20T10:00:00.000Z",
              endAt: "2026-04-20T10:15:00.000Z",
              siteId: "site_b",
              accessibilityTags: ["step_free_access"],
              continuityScore: 0.9,
              restrictions: [],
              bookabilityMode: "staff_assist_only",
            },
          ],
        },
      ],
    });
    const patientInput = {
      ...staffInputForAudienceTest,
      searchPolicy: {
        ...staffInputForAudienceTest.searchPolicy,
        selectionAudience: "patient_self_service" as const,
      },
      capabilityResolution: {
        ...staffInputForAudienceTest.capabilityResolution,
        selectionAudience: "patient" as const,
      },
      commandActionRecordRef: "offer_session_action_285_patient_narrow",
    };
    const patientService = createPhase4CapacityRankService({
      repositories: createPhase4CapacityRankStore(),
    });
    const patient = await patientService.createOfferSession(patientInput);

    expect(patient.offerCandidates).toHaveLength(1);
    expect(patient.offerCandidates[0]?.offerabilityState).toBe("staff_and_patient");

    const staffInput = {
      ...staffInputForAudienceTest,
      commandActionRecordRef: "offer_session_action_285_staff_wide",
    };
    const staffService = createPhase4CapacityRankService({
      repositories: createPhase4CapacityRankStore(),
    });
    const staff = await staffService.createOfferSession(staffInput);

    expect(staff.offerCandidates).toHaveLength(2);
    expect(staff.offerCandidates.some((candidate) => candidate.offerabilityState === "staff_assist_only")).toBe(true);
  });

  it("returns typed continuation branches when no acceptable local slot exists", async () => {
    const service = createPhase4CapacityRankService({
      repositories: createPhase4CapacityRankStore(),
    });
    const input = await buildOfferCompilationInput({
      seed: "285_branch",
      supplierWindows: [
        {
          supplierRef: "vecells_local_gateway",
          supplierWindowRef: "supplier_window_empty",
          searchWindowStartAt: "2026-04-20T08:00:00.000Z",
          searchWindowEndAt: "2026-04-20T18:00:00.000Z",
          fetchStartedAt: "2026-04-18T12:00:00.000Z",
          fetchCompletedAt: "2026-04-18T12:00:05.000Z",
          rawRows: [],
        },
      ],
    });

    const result = await service.createOfferSession(input);

    expect(result.offerSession.sessionState).toBe("branch_only");
    expect(result.offerSession.offeredCandidateRefs).toHaveLength(0);
    expect(result.offerSession.continuationBranches.map((branch) => branch.branchRef)).toEqual([
      "join_local_waitlist",
      "assisted_callback",
      "fallback_to_hub",
    ]);
    expect(result.offerSession.selectedCanonicalSlotIdentityRef).toBeNull();
  });

  it("verifies selection-proof hashes and updates the session without claiming exclusivity", async () => {
    const service = createPhase4CapacityRankService({
      repositories: createPhase4CapacityRankStore(),
    });
    const input = await buildOfferCompilationInput({ seed: "285_select" });
    const created = await service.createOfferSession(input);
    const secondCandidate = created.offerCandidates[1]!;
    const invalidSelectionProofHash = created.offerSession.selectionProofHash.replace(/.$/, "0");

    await expect(
      service.selectOfferCandidate({
        offerSessionId: created.offerSession.offerSessionId,
        offerCandidateId: secondCandidate.offerCandidateId,
        selectionToken: created.offerSession.selectionToken,
        selectionProofHash: invalidSelectionProofHash,
        currentTuple: {
          bookingCaseId: input.bookingCaseId,
          caseVersionRef: input.slotSetSnapshot.caseVersionRef,
          policyBundleHash: input.slotSetSnapshot.policyBundleHash,
          providerAdapterBindingHash: input.slotSetSnapshot.providerAdapterBindingHash,
          capabilityTupleHash: input.slotSetSnapshot.capabilityTupleHash,
          currentSlotSetSnapshotRef: input.slotSetSnapshot.slotSetSnapshotId,
          now: "2026-04-18T13:10:00.000Z",
        },
        commandActionRecordRef: "select_bad_proof_285",
        commandSettlementRecordRef: "select_bad_proof_settlement_285",
        routeIntentBindingRef: input.routeIntentBindingRef,
        subjectRef: "actor_285_select",
        occurredAt: "2026-04-18T13:10:00.000Z",
      }),
    ).rejects.toThrow(/selectionProofHash no longer matches/);

    const goodHash = selectionProofHash({
      offerSessionId: created.offerSession.offerSessionId,
      slotSetSnapshotRef: created.offerSession.slotSetSnapshotRef,
      capacityRankProofRef: created.capacityRankProof.capacityRankProofId,
      selectionToken: created.offerSession.selectionToken,
      truthMode: created.offerSession.truthMode,
      reservationTruthProjectionRef: created.offerSession.reservationTruthProjectionRef,
      providerAdapterBindingHash: created.offerSession.providerAdapterBindingHash,
      capabilityTupleHash: created.offerSession.capabilityTupleHash,
      selectedCandidateHash: secondCandidate.candidateHash,
      selectedCanonicalSlotIdentityRef: secondCandidate.canonicalSlotIdentityRef,
    });

    const selected = await service.selectOfferCandidate({
      offerSessionId: created.offerSession.offerSessionId,
      offerCandidateId: secondCandidate.offerCandidateId,
      selectionToken: created.offerSession.selectionToken,
      selectionProofHash: goodHash,
      currentTuple: {
        bookingCaseId: input.bookingCaseId,
        caseVersionRef: input.slotSetSnapshot.caseVersionRef,
        policyBundleHash: input.slotSetSnapshot.policyBundleHash,
        providerAdapterBindingHash: input.slotSetSnapshot.providerAdapterBindingHash,
        capabilityTupleHash: input.slotSetSnapshot.capabilityTupleHash,
        currentSlotSetSnapshotRef: input.slotSetSnapshot.slotSetSnapshotId,
        now: "2026-04-18T13:10:00.000Z",
      },
      commandActionRecordRef: "select_good_proof_285",
      commandSettlementRecordRef: "select_good_proof_settlement_285",
      routeIntentBindingRef: input.routeIntentBindingRef,
      subjectRef: "actor_285_select",
      occurredAt: "2026-04-18T13:10:00.000Z",
    });

    expect(selected.offerSession.sessionState).toBe("selected");
    expect(selected.offerSession.selectedOfferCandidateRef).toBe(secondCandidate.offerCandidateId);
    expect(selected.offerSession.truthMode).toBe("truthful_nonexclusive");
    expect(selected.emittedEvents[0]?.eventType).toBe("booking.slot.selected");
  });

  it("is deterministic under candidate reordering", async () => {
    const input = await buildOfferCompilationInput({ seed: "285_determinism" });
    const permutations = [
      input.normalizedSlots,
      [...input.normalizedSlots].reverse(),
      [input.normalizedSlots[1]!, input.normalizedSlots[2]!, input.normalizedSlots[0]!],
    ];

    const orderedSignatures = [];
    for (const [index, normalizedSlots] of permutations.entries()) {
      const service = createPhase4CapacityRankService({
        repositories: createPhase4CapacityRankStore(),
      });
      const result = await service.createOfferSession({
        ...input,
        normalizedSlots,
        candidateIndex: {
          ...input.candidateIndex,
          orderedSlotRefs: normalizedSlots.map((slot) => slot.normalizedSlotId),
        },
        commandActionRecordRef: `offer_session_action_285_determinism_${index}`,
      });
      orderedSignatures.push(
        result.offerCandidates.map((candidate) => candidate.slotSnapshot.supplierSlotId).join("->"),
      );
    }

    expect(new Set(orderedSignatures)).toEqual(new Set(["slot_b_1030->slot_a_0900->slot_c_1430"]));
  });
});
