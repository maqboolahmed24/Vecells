import { describe, expect, it } from "vitest";
import { serviceDefinition } from "../src/service-definition.ts";
import {
  PHASE4_BOOKING_CASE_QUERY_SURFACES,
  PHASE4_BOOKING_CASE_SCHEMA_VERSION,
  PHASE4_BOOKING_CASE_SERVICE_NAME,
  createPhase4BookingCaseApplication,
  phase4BookingCaseMigrationPlanRefs,
  phase4BookingCasePersistenceTables,
  phase4BookingCaseRoutes,
} from "../src/phase4-booking-case.ts";

function buildDirectResolutionBundle(seed = "282") {
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

function buildTransition(seed = "282", overrides = {}) {
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

describe("phase4 booking case application", () => {
  it("creates a booking case from a phase3 direct-resolution handoff", async () => {
    const directResolutionBundle = buildDirectResolutionBundle();
    const application = createPhase4BookingCaseApplication({
      directResolutionApplication: {
        async queryTaskDirectResolution(taskId) {
          return taskId === "task_282" ? structuredClone(directResolutionBundle) : null;
        },
      },
    });

    const result = await application.createBookingCaseFromTaskHandoff({
      taskId: "task_282",
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

    expect(result.bookingCase.status).toBe("handoff_received");
    expect(result.bookingIntent.intentState).toBe("acknowledged");
    expect(result.emittedEvents).toHaveLength(1);

    const queried = await application.queryBookingCase("booking_case_282");
    expect(queried?.bookingCase.requestId).toBe("request_282");
    expect(queried?.transitionJournal).toHaveLength(1);
  });

  it("keeps later-owned event emission out of 282 while allowing whole-graph transitions", async () => {
    const directResolutionBundle = buildDirectResolutionBundle();
    const application = createPhase4BookingCaseApplication({
      directResolutionApplication: {
        async queryTaskDirectResolution() {
          return structuredClone(directResolutionBundle);
        },
      },
    });

    await application.createBookingCaseFromTaskHandoff({
      taskId: "task_282",
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

    await application.markCapabilityChecked(
      buildTransition("282", {
        commandActionRecordRef: "mark_capability_checked_282",
        commandSettlementRecordRef: "mark_capability_checked_settlement_282",
        reasonCode: "capability_tuple_current",
      }),
    );

    const search = await application.beginLocalSearch(
      buildTransition("282", {
        commandActionRecordRef: "begin_local_search_282",
        commandSettlementRecordRef: "begin_local_search_settlement_282",
        reasonCode: "capability_live_for_search",
        activeCapabilityResolutionRef: "capability_resolution_282",
        activeCapabilityProjectionRef: "capability_projection_282",
        activeProviderAdapterBindingRef: "adapter_binding_282",
        capabilityState: "live_staff_assist",
        searchPolicy: {
          policyId: "search_policy_282",
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
          policyBundleHash: "policy_bundle_hash_282",
          sameBandReorderSlackMinutesByWindow: { early: 10, standard: 20 },
        },
      }),
    );

    expect(search.bookingCase.status).toBe("searching_local");
    expect(search.emittedEvents).toEqual([]);
  });

  it("fails closed on identity repair freeze and stale decision epoch", async () => {
    const directResolutionBundle = buildDirectResolutionBundle();
    const application = createPhase4BookingCaseApplication({
      directResolutionApplication: {
        async queryTaskDirectResolution() {
          return structuredClone(directResolutionBundle);
        },
      },
    });

    await application.createBookingCaseFromTaskHandoff({
      taskId: "task_282",
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
      application.markCapabilityChecked(
        buildTransition("282", {
          commandActionRecordRef: "identity_frozen_282",
          commandSettlementRecordRef: "identity_frozen_settlement_282",
          identityRepairBranchDispositionRef: "identity_repair_branch_frozen_282",
          reasonCode: "identity_repair_active",
        }),
      ),
    ).rejects.toMatchObject({
      code: "IDENTITY_REPAIR_FREEZE_ACTIVE",
    });

    await expect(
      application.markCapabilityChecked(
        buildTransition("282", {
          commandActionRecordRef: "stale_epoch_282",
          commandSettlementRecordRef: "stale_epoch_settlement_282",
          sourceDecisionEpochRef: "decision_epoch_stale",
          reasonCode: "stale_epoch",
        }),
      ),
    ).rejects.toMatchObject({
      code: "STALE_SOURCE_DECISION_EPOCH",
    });
  });

  it("publishes the 282 route, persistence, and migration surfaces", () => {
    expect(PHASE4_BOOKING_CASE_SERVICE_NAME).toBe("Phase4BookingCaseKernelApplication");
    expect(PHASE4_BOOKING_CASE_SCHEMA_VERSION).toBe(
      "282.phase4.booking-case-state-machine-and-intent-records.v1",
    );
    expect(PHASE4_BOOKING_CASE_QUERY_SURFACES).toContain("GET /v1/bookings/cases/{bookingCaseId}");
    expect(phase4BookingCaseRoutes).toHaveLength(17);
    expect(phase4BookingCasePersistenceTables).toContain("phase4_booking_cases");
    expect(phase4BookingCaseMigrationPlanRefs).toContain(
      "services/command-api/migrations/131_phase4_booking_case_kernel.sql",
    );

    const routeIds = new Set(serviceDefinition.routeCatalog.map((route) => route.routeId));
    expect(routeIds.has("booking_case_create_from_intent")).toBe(true);
    expect(routeIds.has("booking_case_begin_local_search")).toBe(true);
    expect(routeIds.has("booking_case_close")).toBe(true);
  });
});
