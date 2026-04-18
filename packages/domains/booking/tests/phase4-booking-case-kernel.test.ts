import { describe, expect, it } from "vitest";
import {
  createPhase4BookingCaseKernelService,
  createPhase4BookingCaseKernelStore,
  type BookingIntentHandoffSourceSnapshot,
  type BookingCaseTransitionCommandInput,
  type SearchPolicySnapshot,
} from "../src/phase4-booking-case-kernel.ts";

function buildHandoff(seed = "282"): BookingIntentHandoffSourceSnapshot {
  return {
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
  };
}

function buildSearchPolicy(seed = "282"): SearchPolicySnapshot {
  return {
    policyId: `search_policy_${seed}`,
    timeframeEarliest: "2026-04-19T08:00:00.000Z",
    timeframeLatest: "2026-04-29T18:00:00.000Z",
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

function buildTransitionCommand(
  seed = "282",
  overrides: Partial<BookingCaseTransitionCommandInput> = {},
): BookingCaseTransitionCommandInput {
  return {
    bookingCaseId: `booking_case_${seed}`,
    actorRef: `actor_${seed}`,
    routeIntentBindingRef: `route_intent_${seed}`,
    commandActionRecordRef: `command_action_${seed}`,
    commandSettlementRecordRef: `command_settlement_${seed}`,
    recordedAt: "2026-04-18T10:00:00.000Z",
    sourceDecisionEpochRef: `decision_epoch_${seed}`,
    sourceDecisionSupersessionRef: null,
    lineageCaseLinkRef: `lineage_case_link_${seed}`,
    requestLifecycleLeaseRef: `request_lease_${seed}`,
    ownershipEpoch: 4,
    fencingToken: `fencing_token_${seed}`,
    currentLineageFenceEpoch: 7,
    reasonCode: "test_transition",
    ...overrides,
  };
}

describe("phase4 booking case kernel", () => {
  it("creates a durable booking case from a phase3 handoff and emits booking.case.created", async () => {
    const service = createPhase4BookingCaseKernelService({
      repositories: createPhase4BookingCaseKernelStore(),
    });

    const result = await service.createBookingCaseFromIntent({
      handoff: buildHandoff(),
      bookingCaseId: "booking_case_282",
      patientRef: "patient_282",
      tenantId: "tenant_default",
      providerContext: {
        practiceRef: "practice_282",
        supplierHintRef: "supplier_im1",
        careSetting: "general_practice",
      },
      actorRef: "actor_282",
      routeIntentBindingRef: "route_intent_282",
      commandActionRecordRef: "create_case_action_282",
      commandSettlementRecordRef: "create_case_settlement_282",
      createdAt: "2026-04-18T09:30:00.000Z",
      patientShellConsistencyProjectionRef: "patient_shell_projection_282",
      patientEmbeddedSessionProjectionRef: "embedded_session_282",
      surfaceRouteContractRef: "booking_route_contract_v1",
      surfacePublicationRef: "surface_publication_282",
      runtimePublicationBundleRef: "runtime_publication_282",
    });

    expect(result.bookingIntent.intentState).toBe("acknowledged");
    expect(result.bookingIntent.lifecycleClosureAuthority).toBe("LifecycleCoordinator");
    expect(result.bookingCase.status).toBe("handoff_received");
    expect(result.bookingCase.closureAuthority).toBe("LifecycleCoordinator");
    expect(result.transitionJournal).toHaveLength(1);
    expect(result.emittedEvents).toHaveLength(1);
    expect(result.emittedEvents[0]?.eventType).toBe("booking.case.created");
  });

  it("creates search policy and enters searching_local only from a live capability tuple", async () => {
    const service = createPhase4BookingCaseKernelService({
      repositories: createPhase4BookingCaseKernelStore(),
    });

    await service.createBookingCaseFromIntent({
      handoff: buildHandoff(),
      bookingCaseId: "booking_case_282",
      patientRef: "patient_282",
      tenantId: "tenant_default",
      providerContext: {
        practiceRef: "practice_282",
        supplierHintRef: "supplier_im1",
        careSetting: "general_practice",
      },
      actorRef: "actor_282",
      routeIntentBindingRef: "route_intent_282",
      commandActionRecordRef: "create_case_action_282",
      commandSettlementRecordRef: "create_case_settlement_282",
      createdAt: "2026-04-18T09:30:00.000Z",
      surfaceRouteContractRef: "booking_route_contract_v1",
      surfacePublicationRef: "surface_publication_282",
      runtimePublicationBundleRef: "runtime_publication_282",
    });

    await service.markCapabilityChecked(
      buildTransitionCommand("282", {
        commandActionRecordRef: "mark_capability_checked_282",
        commandSettlementRecordRef: "mark_capability_checked_settlement_282",
        reasonCode: "capability_tuple_current",
      }),
    );

    const searchResult = await service.beginLocalSearch(
      buildTransitionCommand("282", {
        commandActionRecordRef: "begin_local_search_282",
        commandSettlementRecordRef: "begin_local_search_settlement_282",
        reasonCode: "capability_live_for_search",
        activeCapabilityResolutionRef: "capability_resolution_282",
        activeCapabilityProjectionRef: "capability_projection_282",
        activeProviderAdapterBindingRef: "adapter_binding_282",
        capabilityState: "live_staff_assist",
        searchPolicy: buildSearchPolicy(),
      }),
    );

    expect(searchResult.bookingCase.status).toBe("searching_local");
    expect(searchResult.bookingCase.searchPolicyRef).toBe("search_policy_282");
    expect(searchResult.searchPolicy?.policyId).toBe("search_policy_282");
    expect(searchResult.transitionJournal).toHaveLength(3);
  });

  it("fails closed on stale decision epoch and records a rejected audit entry", async () => {
    const service = createPhase4BookingCaseKernelService({
      repositories: createPhase4BookingCaseKernelStore(),
    });

    await service.createBookingCaseFromIntent({
      handoff: buildHandoff(),
      bookingCaseId: "booking_case_282",
      patientRef: "patient_282",
      tenantId: "tenant_default",
      providerContext: {
        practiceRef: "practice_282",
        supplierHintRef: null,
        careSetting: "general_practice",
      },
      actorRef: "actor_282",
      routeIntentBindingRef: "route_intent_282",
      commandActionRecordRef: "create_case_action_282",
      commandSettlementRecordRef: "create_case_settlement_282",
      createdAt: "2026-04-18T09:30:00.000Z",
      surfaceRouteContractRef: "booking_route_contract_v1",
      surfacePublicationRef: "surface_publication_282",
      runtimePublicationBundleRef: "runtime_publication_282",
    });

    await expect(
      service.markCapabilityChecked(
        buildTransitionCommand("282", {
          commandActionRecordRef: "mark_capability_checked_282",
          commandSettlementRecordRef: "mark_capability_checked_settlement_282",
          sourceDecisionEpochRef: "decision_epoch_stale",
          reasonCode: "stale_epoch",
        }),
      ),
    ).rejects.toMatchObject({
      code: "STALE_SOURCE_DECISION_EPOCH",
    });

    const bundle = await service.queryBookingCaseBundle("booking_case_282");
    expect(bundle?.bookingCase.status).toBe("handoff_received");
    expect(bundle?.transitionJournal).toHaveLength(2);
    expect(bundle?.transitionJournal[1]?.transitionOutcome).toBe("rejected");
    expect(bundle?.transitionJournal[1]?.failureCode).toBe("STALE_SOURCE_DECISION_EPOCH");
  });

  it("fails closed during identity repair freeze", async () => {
    const service = createPhase4BookingCaseKernelService({
      repositories: createPhase4BookingCaseKernelStore(),
    });

    await service.createBookingCaseFromIntent({
      handoff: buildHandoff(),
      bookingCaseId: "booking_case_282",
      patientRef: "patient_282",
      tenantId: "tenant_default",
      providerContext: {
        practiceRef: "practice_282",
        supplierHintRef: null,
        careSetting: "general_practice",
      },
      actorRef: "actor_282",
      routeIntentBindingRef: "route_intent_282",
      commandActionRecordRef: "create_case_action_282",
      commandSettlementRecordRef: "create_case_settlement_282",
      createdAt: "2026-04-18T09:30:00.000Z",
      surfaceRouteContractRef: "booking_route_contract_v1",
      surfacePublicationRef: "surface_publication_282",
      runtimePublicationBundleRef: "runtime_publication_282",
    });

    await expect(
      service.markCapabilityChecked(
        buildTransitionCommand("282", {
          commandActionRecordRef: "mark_capability_checked_282",
          commandSettlementRecordRef: "mark_capability_checked_settlement_282",
          identityRepairBranchDispositionRef: "identity_repair_branch_frozen_282",
          reasonCode: "identity_repair_active",
        }),
      ),
    ).rejects.toMatchObject({
      code: "IDENTITY_REPAIR_FREEZE_ACTIVE",
    });
  });

  it("rejects illegal transitions and replays duplicate legal requests idempotently", async () => {
    const service = createPhase4BookingCaseKernelService({
      repositories: createPhase4BookingCaseKernelStore(),
    });

    await service.createBookingCaseFromIntent({
      handoff: buildHandoff(),
      bookingCaseId: "booking_case_282",
      patientRef: "patient_282",
      tenantId: "tenant_default",
      providerContext: {
        practiceRef: "practice_282",
        supplierHintRef: null,
        careSetting: "general_practice",
      },
      actorRef: "actor_282",
      routeIntentBindingRef: "route_intent_282",
      commandActionRecordRef: "create_case_action_282",
      commandSettlementRecordRef: "create_case_settlement_282",
      createdAt: "2026-04-18T09:30:00.000Z",
      surfaceRouteContractRef: "booking_route_contract_v1",
      surfacePublicationRef: "surface_publication_282",
      runtimePublicationBundleRef: "runtime_publication_282",
    });

    await expect(
      service.markManaged(
        buildTransitionCommand("282", {
          commandActionRecordRef: "illegal_managed_282",
          commandSettlementRecordRef: "illegal_managed_settlement_282",
          appointmentRef: "appointment_282",
          reasonCode: "illegal_transition",
        }),
      ),
    ).rejects.toMatchObject({
      code: "ILLEGAL_BOOKING_CASE_TRANSITION",
    });

    const first = await service.markCapabilityChecked(
      buildTransitionCommand("282", {
        commandActionRecordRef: "mark_capability_checked_282",
        commandSettlementRecordRef: "mark_capability_checked_settlement_282",
        reasonCode: "capability_tuple_current",
      }),
    );

    const replay = await service.markCapabilityChecked(
      buildTransitionCommand("282", {
        commandActionRecordRef: "mark_capability_checked_282",
        commandSettlementRecordRef: "mark_capability_checked_settlement_282",
        reasonCode: "capability_tuple_current",
      }),
    );

    expect(first.bookingCase.status).toBe("capability_checked");
    expect(replay.bookingCase.status).toBe("capability_checked");
    expect(replay.transitionJournal).toHaveLength(3);
  });
});
