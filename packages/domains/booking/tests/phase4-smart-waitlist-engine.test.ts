import { describe, expect, it } from "vitest";
import {
  createPhase4SmartWaitlistService,
  createPhase4SmartWaitlistStore,
  type CreateOrRefreshWaitlistEntryInput,
  type ReleasedCapacityInput,
} from "../src/phase4-smart-waitlist-engine.ts";

function buildJoinInput(
  seed = "290",
  overrides: Partial<CreateOrRefreshWaitlistEntryInput> = {},
): CreateOrRefreshWaitlistEntryInput {
  return {
    bookingCaseId: `booking_case_${seed}`,
    patientRef: `patient_${seed}`,
    requestRef: `request_${seed}`,
    requestLineageRef: `request_lineage_${seed}`,
    routeFamilyRef: "patient_booking_waitlist",
    selectionAudience: "patient",
    selectedAnchorRef: `booking_case_${seed}`,
    preferenceEnvelope: {
      modality: "in_person",
      siteRefs: ["site_a"],
      timeframeEarliest: "2026-04-20T08:00:00.000Z",
      timeframeLatest: "2026-04-21T18:00:00.000Z",
      timeZone: "Europe/London",
      maxTravelMinutes: 45,
      continuityPreference: "preferred_clinician_if_available",
      offerMode: "exclusive_hold",
      responseWindowMinutes: 45,
      convenienceTags: ["morning"],
    },
    deadlineAt: "2026-04-21T18:00:00.000Z",
    expectedOfferServiceMinutes: 90,
    capabilityResolutionRef: `capability_resolution_${seed}`,
    capabilityTupleHash: `capability_tuple_${seed}`,
    providerAdapterBindingRef: `provider_binding_${seed}`,
    providerAdapterBindingHash: `provider_binding_hash_${seed}`,
    authoritativeReadAndConfirmationPolicyRef: `confirmation_policy_${seed}`,
    reservationSemantics: "exclusive_hold",
    joinedAt: "2026-04-19T09:00:00.000Z",
    commandActionRecordRef: `join_action_${seed}`,
    commandSettlementRecordRef: `join_settlement_${seed}`,
    subjectRef: `subject_${seed}`,
    payloadArtifactRef: `artifact://booking/waitlist/${seed}/join`,
    edgeCorrelationId: `edge_${seed}_join`,
    ...overrides,
  };
}

function buildReleasedCapacity(
  seed = "290",
  overrides: Partial<ReleasedCapacityInput> = {},
): ReleasedCapacityInput {
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
    continuityScore: 0.9,
    travelMinutes: 25,
    authoritativeReleaseState: "authoritative_released",
    releaseReasonCode: "authoritative_slot_release",
    ...overrides,
  };
}

describe("phase4 smart waitlist engine", () => {
  it("creates a real waitlist entry with deadline, fallback, and continuation truth", async () => {
    const service = createPhase4SmartWaitlistService({
      repositories: createPhase4SmartWaitlistStore(),
    });

    const created = await service.createOrRefreshWaitlistEntry(buildJoinInput("290_join"));

    expect(created.entry.waitlistEntryId).toContain("waitlist_entry_");
    expect(created.entry.priorityKey).toContain(created.entry.waitlistEntryId);
    expect(created.deadlineEvaluation.offerabilityState).toBe("waitlist_safe");
    expect(created.fallbackObligation.requiredFallbackRoute).toBe("stay_local_waitlist");
    expect(created.continuationTruth.patientVisibleState).toBe("waiting_for_offer");
    expect(created.emittedEvents.map((event) => event.eventType)).toEqual([
      "booking.waitlist.joined",
      "booking.waitlist.deadline_evaluated",
    ]);
  });

  it("matches released capacity by indexed keys, issues one offer, and moves the entry to offer_pending", async () => {
    const service = createPhase4SmartWaitlistService({
      repositories: createPhase4SmartWaitlistStore(),
    });

    const joined = await service.createOrRefreshWaitlistEntry(buildJoinInput("290_offer"));
    await service.createOrRefreshWaitlistEntry(
      buildJoinInput("290_other", {
        preferenceEnvelope: {
          ...buildJoinInput("290_other").preferenceEnvelope,
          siteRefs: ["site_b"],
        },
      }),
    );

    const planned = await service.processReleasedCapacity({
      releasedCapacity: [buildReleasedCapacity("290_offer")],
      processedAt: "2026-04-19T10:00:00.000Z",
      commandActionRecordRef: "process_action_290_offer",
      commandSettlementRecordRef: "process_settlement_290_offer",
      subjectRef: "subject_290_offer",
      payloadArtifactRef: "artifact://booking/waitlist/290_offer/process",
      edgeCorrelationId: "edge_290_offer_process",
    });

    expect(planned.plannedOffers).toHaveLength(1);
    expect(planned.plannedOffers[0]?.waitlistEntryRef).toBe(joined.entry.waitlistEntryId);
    expect(planned.plannedOffers[0]?.scoreVector.preferenceFit).toBeGreaterThan(0.9);

    const issued = await service.issuePlannedWaitlistOffer({
      plannedOffer: planned.plannedOffers[0],
      reservationRef: "reservation_290_offer",
      reservationTruthProjectionRef: "reservation_truth_290_offer",
      holdState: "held",
      sentAt: "2026-04-19T10:00:00.000Z",
      commandActionRecordRef: "issue_action_290_offer",
      commandSettlementRecordRef: "issue_settlement_290_offer",
      payloadArtifactRef: "artifact://booking/waitlist/290_offer/issue",
      edgeCorrelationId: "edge_290_offer_issue",
    });

    expect(issued.activeOffer?.offerState).toBe("sent");
    expect(issued.entry.continuationState).toBe("offer_pending");
    expect(issued.continuationTruth.patientVisibleState).toBe("offer_available");

    const current = await service.queryCurrentWaitlist("booking_case_290_offer");
    expect(current?.activeOffer?.waitlistOfferId).toBe(issued.activeOffer?.waitlistOfferId);
  });

  it("re-enters accepted offers into pending confirmation and clears fallback debt only after booked settlement", async () => {
    const service = createPhase4SmartWaitlistService({
      repositories: createPhase4SmartWaitlistStore(),
    });

    await service.createOrRefreshWaitlistEntry(buildJoinInput("290_accept"));
    const planned = await service.processReleasedCapacity({
      releasedCapacity: [buildReleasedCapacity("290_accept")],
      processedAt: "2026-04-19T10:00:00.000Z",
      commandActionRecordRef: "process_action_290_accept",
      commandSettlementRecordRef: "process_settlement_290_accept",
      subjectRef: "subject_290_accept",
    });
    const issued = await service.issuePlannedWaitlistOffer({
      plannedOffer: planned.plannedOffers[0],
      reservationRef: "reservation_290_accept",
      reservationTruthProjectionRef: "reservation_truth_290_accept",
      holdState: "held",
      sentAt: "2026-04-19T10:00:00.000Z",
      commandActionRecordRef: "issue_action_290_accept",
      commandSettlementRecordRef: "issue_settlement_290_accept",
    });

    const accepted = await service.acceptWaitlistOffer({
      waitlistOfferId: issued.activeOffer?.waitlistOfferId ?? "",
      acceptedAt: "2026-04-19T10:05:00.000Z",
      commandActionRecordRef: "accept_action_290_accept",
      commandSettlementRecordRef: "accept_settlement_290_accept",
    });

    expect(accepted.entry.continuationState).toBe("accepted_pending_confirmation");
    expect(accepted.continuationTruth.patientVisibleState).toBe("accepted_pending_booking");

    const pending = await service.settleWaitlistCommitOutcome({
      waitlistOfferId: issued.activeOffer?.waitlistOfferId ?? "",
      settledAt: "2026-04-19T10:06:00.000Z",
      outcome: "confirmation_pending",
      commandActionRecordRef: "commit_pending_action_290_accept",
      commandSettlementRecordRef: "commit_pending_settlement_290_accept",
    });

    expect(pending.entry.continuationState).toBe("accepted_pending_confirmation");
    expect(pending.activeOffer?.holdState).toBe("pending_confirmation");

    const booked = await service.settleWaitlistCommitOutcome({
      waitlistOfferId: issued.activeOffer?.waitlistOfferId ?? "",
      settledAt: "2026-04-19T10:08:00.000Z",
      outcome: "booked",
      commandActionRecordRef: "commit_booked_action_290_accept",
      commandSettlementRecordRef: "commit_booked_settlement_290_accept",
    });

    expect(booked.entry.activeState).toBe("closed");
    expect(booked.entry.continuationState).toBe("closed");
    expect(booked.continuationTruth.patientVisibleState).toBe("closed");
    expect(booked.activeOffer?.holdState).toBe("confirmed");
  });

  it("expires stale offers and escalates overdue entries into callback fallback", async () => {
    const service = createPhase4SmartWaitlistService({
      repositories: createPhase4SmartWaitlistStore(),
    });

    await service.createOrRefreshWaitlistEntry(
      buildJoinInput("290_expire", {
        deadlineAt: "2026-04-19T10:20:00.000Z",
        joinedAt: "2026-04-19T09:00:00.000Z",
        expectedOfferServiceMinutes: 30,
      }),
    );
    const planned = await service.processReleasedCapacity({
      releasedCapacity: [buildReleasedCapacity("290_expire")],
      processedAt: "2026-04-19T09:50:00.000Z",
      commandActionRecordRef: "process_action_290_expire",
      commandSettlementRecordRef: "process_settlement_290_expire",
      subjectRef: "subject_290_expire",
    });
    const issued = await service.issuePlannedWaitlistOffer({
      plannedOffer: planned.plannedOffers[0],
      reservationRef: "reservation_290_expire",
      reservationTruthProjectionRef: "reservation_truth_290_expire",
      holdState: "soft_selected",
      sentAt: "2026-04-19T09:50:00.000Z",
      commandActionRecordRef: "issue_action_290_expire",
      commandSettlementRecordRef: "issue_settlement_290_expire",
    });

    const expired = await service.expireWaitlistOffer({
      waitlistOfferId: issued.activeOffer?.waitlistOfferId ?? "",
      expiredAt: "2026-04-19T10:15:00.000Z",
      reasonCode: "offer_ttl_elapsed",
      commandActionRecordRef: "expire_action_290_expire",
      commandSettlementRecordRef: "expire_settlement_290_expire",
    });

    expect(expired.deadlineEvaluation.offerabilityState).toBe("fallback_required");
    expect(expired.fallbackObligation.requiredFallbackRoute).toBe("callback");
    expect(expired.continuationTruth.windowRiskState).toBe("fallback_due");
  });
});
