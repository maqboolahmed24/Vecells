import { describe, expect, it } from "vitest";
import { serviceDefinition } from "../src/service-definition.ts";
import {
  createPhase4BookingCapabilityApplication,
  PHASE4_BOOKING_CAPABILITY_QUERY_SURFACES,
  PHASE4_BOOKING_CAPABILITY_SCHEMA_VERSION,
  PHASE4_BOOKING_CAPABILITY_SERVICE_NAME,
  phase4BookingCapabilityMigrationPlanRefs,
  phase4BookingCapabilityPersistenceTables,
  phase4BookingCapabilityRoutes,
} from "../src/phase4-booking-capability.ts";
import { createPhase4BookingCaseApplication } from "../src/phase4-booking-case.ts";

function buildDirectResolutionBundle(seed = "283") {
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

describe("phase4 booking capability application", () => {
  it("resolves one current booking-case capability tuple and publishes diagnostics", async () => {
    const bookingCaseApplication = createPhase4BookingCaseApplication({
      directResolutionApplication: {
        async queryTaskDirectResolution() {
          return structuredClone(buildDirectResolutionBundle());
        },
      },
    });

    await bookingCaseApplication.createBookingCaseFromTaskHandoff({
      taskId: "task_283",
      bookingCaseId: "booking_case_283",
      patientRef: "patient_283",
      tenantId: "tenant_vecells_beta",
      providerContext: {
        practiceRef: "ods_A83002",
        supplierHintRef: "optum_emis_web",
        careSetting: "general_practice",
      },
      actorRef: "actor_283",
      routeIntentBindingRef: "route_intent_283",
      commandActionRecordRef: "create_case_action_283",
      commandSettlementRecordRef: "create_case_settlement_283",
      createdAt: "2026-04-18T09:30:00.000Z",
      surfaceRouteContractRef: "booking_route_contract_v1",
      surfacePublicationRef: "surface_publication_283",
      runtimePublicationBundleRef: "runtime_publication_283",
    });

    const application = createPhase4BookingCapabilityApplication({
      bookingCaseApplication,
    });

    const result = await application.resolveBookingCaseCapability({
      bookingCaseId: "booking_case_283",
      tenantId: "tenant_vecells_beta",
      practiceRef: "ods_A83002",
      organisationRef: "org_vecells_beta",
      supplierRef: "optum_emis_web",
      integrationMode: "im1_patient_api",
      deploymentType: "internet_patient_shell",
      selectionAudience: "patient",
      requestedActionScope: "book_slot",
      gpLinkageCheckpointRef: "gp_linkage_checkpoint_283",
      gpLinkageStatus: "linked",
      localConsumerCheckpointRef: null,
      localConsumerStatus: "not_required",
      supplierDegradationStatus: "nominal",
      publicationState: "published",
      assuranceTrustState: "writable",
      routeIntentBindingRef: "route_intent_booking_283",
      surfaceRouteContractRef: "surface_route_booking_283",
      surfacePublicationRef: "surface_publication_booking_283",
      runtimePublicationBundleRef: "runtime_publication_booking_283",
      governingObjectDescriptorRef: "BookingCase",
      governingObjectRef: "booking_case_283",
      governingObjectVersionRef: "booking_case_283_v1",
      parentAnchorRef: "patient_booking_anchor_283",
      commandActionRecordRef: "resolve_capability_case_283",
      commandSettlementRecordRef: "resolve_capability_case_settlement_283",
      subjectRef: "patient_283",
      evaluatedAt: "2026-04-18T12:00:00.000Z",
    });

    expect(result.resolution.capabilityState).toBe("live_self_service");
    expect(result.providerAdapterBinding.integrationMode).toBe("im1_patient_api");
    expect(result.emittedEvents).toHaveLength(1);

    const diagnostics = await application.queryCapabilityDiagnostics({
      bookingCaseId: "booking_case_283",
      governingObjectDescriptorRef: "BookingCase",
      governingObjectRef: "booking_case_283",
      selectionAudience: "patient",
      requestedActionScope: "book_slot",
    });

    expect(diagnostics?.isCurrentScope).toBe(true);
    expect(diagnostics?.resolution.capabilityTupleHash).toBe(
      result.resolution.capabilityTupleHash,
    );
  });

  it("resolves assisted-only patient manage posture and live staff manage posture from the same provider row", async () => {
    const application = createPhase4BookingCapabilityApplication();

    const patient = await application.resolveAppointmentManageCapability({
      appointmentId: "appointment_600",
      tenantId: "tenant_vecells_beta",
      practiceRef: "ods_A83002",
      organisationRef: "org_vecells_beta",
      supplierRef: "gp_connect_existing",
      integrationMode: "gp_connect_existing",
      deploymentType: "hscn_direct_care_consumer",
      selectionAudience: "patient",
      requestedActionScope: "reschedule_appointment",
      gpLinkageCheckpointRef: null,
      gpLinkageStatus: "not_required",
      localConsumerCheckpointRef: null,
      localConsumerStatus: "not_required",
      supplierDegradationStatus: "nominal",
      publicationState: "published",
      assuranceTrustState: "writable",
      routeIntentBindingRef: "route_intent_patient_manage_283",
      surfaceRouteContractRef: "surface_route_patient_manage_283",
      surfacePublicationRef: "surface_publication_patient_manage_283",
      runtimePublicationBundleRef: "runtime_publication_patient_manage_283",
      governingObjectDescriptorRef: "AppointmentRecord",
      governingObjectRef: "appointment_600",
      governingObjectVersionRef: "appointment_600_v5",
      parentAnchorRef: "patient_manage_anchor_600",
      commandActionRecordRef: "resolve_manage_patient_283",
      commandSettlementRecordRef: "resolve_manage_patient_settlement_283",
      subjectRef: "patient_600",
      evaluatedAt: "2026-04-18T12:00:00.000Z",
    });

    const staff = await application.resolveAppointmentManageCapability({
      ...patient.resolution,
      appointmentId: "appointment_600",
      bookingCaseId: null,
      selectionAudience: "staff",
      requestedActionScope: "reschedule_appointment",
      routeIntentBindingRef: "route_intent_staff_manage_283",
      surfaceRouteContractRef: "surface_route_staff_manage_283",
      surfacePublicationRef: "surface_publication_staff_manage_283",
      runtimePublicationBundleRef: "runtime_publication_staff_manage_283",
      commandActionRecordRef: "resolve_manage_staff_283",
      commandSettlementRecordRef: "resolve_manage_staff_settlement_283",
      subjectRef: "staff_actor_600",
      evaluatedAt: "2026-04-18T12:05:00.000Z",
    });

    expect(patient.projection.surfaceState).toBe("assisted_only");
    expect(staff.projection.surfaceState).toBe("staff_assist_live");
    expect(staff.projection.parityGroupId).toBe(patient.projection.parityGroupId);
  });

  it("publishes the expected metadata surfaces and route catalog entries", () => {
    expect(PHASE4_BOOKING_CAPABILITY_SERVICE_NAME).toBe(
      "Phase4BookingCapabilityEngineApplication",
    );
    expect(PHASE4_BOOKING_CAPABILITY_SCHEMA_VERSION).toBe(
      "283.phase4.provider-capability-matrix-and-binding-compiler.v1",
    );
    expect(PHASE4_BOOKING_CAPABILITY_QUERY_SURFACES).toEqual(
      expect.arrayContaining([
        "GET /v1/bookings/cases/{bookingCaseId}/capability",
        "GET /v1/appointments/{appointmentId}/manage-capability",
      ]),
    );
    expect(phase4BookingCapabilityPersistenceTables).toEqual(
      expect.arrayContaining([
        "phase4_provider_capability_matrix_rows",
        "phase4_booking_capability_resolutions",
        "phase4_booking_capability_projections",
      ]),
    );
    expect(phase4BookingCapabilityMigrationPlanRefs).toContain(
      "services/command-api/migrations/132_phase4_booking_capability_engine.sql",
    );
    expect(
      phase4BookingCapabilityRoutes.map((route) => route.routeId),
    ).toEqual(
      expect.arrayContaining([
        "booking_case_capability_current",
        "appointment_manage_capability_current",
        "booking_case_capability_resolve",
        "appointment_manage_capability_resolve",
        "booking_capability_diagnostics",
      ]),
    );
    expect(
      serviceDefinition.routeCatalog.map((route) => route.routeId),
    ).toEqual(
      expect.arrayContaining([
        "booking_case_capability_current",
        "appointment_manage_capability_current",
        "booking_case_capability_resolve",
        "appointment_manage_capability_resolve",
        "booking_capability_diagnostics",
      ]),
    );
  });
});
