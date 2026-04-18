import { describe, expect, it } from "vitest";
import {
  createPhase4BookingCapabilityEngineService,
  createPhase4BookingCapabilityEngineStore,
  phase4ProviderCapabilityMatrixRows,
  type BookingCapabilityResolutionInput,
  type BookingIntegrationMode,
} from "../src/phase4-booking-capability-engine.ts";

function buildBookingInput(
  overrides: Partial<BookingCapabilityResolutionInput> = {},
): BookingCapabilityResolutionInput {
  return {
    bookingCaseId: "booking_case_283",
    appointmentId: null,
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
    presentedCapabilityTupleHash: null,
    presentedBindingHash: null,
    commandActionRecordRef: "command_action_283",
    commandSettlementRecordRef: "command_settlement_283",
    subjectRef: "patient_283",
    evaluatedAt: "2026-04-18T12:00:00.000Z",
    expiresInSeconds: 900,
    ...overrides,
  };
}

function inputForMode(mode: BookingIntegrationMode): BookingCapabilityResolutionInput {
  switch (mode) {
    case "im1_patient_api":
      return buildBookingInput();
    case "im1_transaction_api":
      return buildBookingInput({
        supplierRef: "tpp_systmone",
        integrationMode: "im1_transaction_api",
        deploymentType: "practice_local_component",
        selectionAudience: "staff",
        requestedActionScope: "search_slots",
        gpLinkageCheckpointRef: null,
        gpLinkageStatus: "not_required",
        localConsumerCheckpointRef: "local_component_checkpoint_283",
        localConsumerStatus: "ready",
        governingObjectRef: "booking_case_612",
        governingObjectVersionRef: "booking_case_612_v1",
        bookingCaseId: "booking_case_612",
      });
    case "gp_connect_existing":
      return buildBookingInput({
        supplierRef: "gp_connect_existing",
        integrationMode: "gp_connect_existing",
        deploymentType: "hscn_direct_care_consumer",
        selectionAudience: "staff",
        requestedActionScope: "reschedule_appointment",
        gpLinkageCheckpointRef: null,
        gpLinkageStatus: "not_required",
        localConsumerCheckpointRef: null,
        localConsumerStatus: "not_required",
        governingObjectDescriptorRef: "AppointmentRecord",
        governingObjectRef: "appointment_600",
        governingObjectVersionRef: "appointment_600_v5",
        appointmentId: "appointment_600",
        bookingCaseId: null,
      });
    case "local_gateway_component":
      return buildBookingInput({
        supplierRef: "vecells_local_gateway",
        integrationMode: "local_gateway_component",
        deploymentType: "practice_local_gateway",
        selectionAudience: "staff",
        requestedActionScope: "book_slot",
        gpLinkageCheckpointRef: null,
        gpLinkageStatus: "not_required",
        localConsumerCheckpointRef: "local_gateway_checkpoint_283",
        localConsumerStatus: "ready",
        governingObjectRef: "booking_case_728",
        governingObjectVersionRef: "booking_case_728_v2",
        bookingCaseId: "booking_case_728",
      });
    case "manual_assist_only":
      return buildBookingInput({
        supplierRef: "manual_assist_network",
        integrationMode: "manual_assist_only",
        deploymentType: "ops_manual_assist",
        selectionAudience: "staff",
        requestedActionScope: "view_booking_summary",
        gpLinkageCheckpointRef: null,
        gpLinkageStatus: "not_required",
        localConsumerCheckpointRef: null,
        localConsumerStatus: "not_required",
        governingObjectDescriptorRef: "AppointmentRecord",
        governingObjectRef: "appointment_905",
        governingObjectVersionRef: "appointment_905_v1",
        appointmentId: "appointment_905",
        bookingCaseId: null,
      });
  }
}

describe("phase4 booking capability engine", () => {
  it("resolves one deterministic binding for every supported integration mode", async () => {
    const service = createPhase4BookingCapabilityEngineService({
      repositories: createPhase4BookingCapabilityEngineStore(),
    });

    const modes: BookingIntegrationMode[] = [
      "im1_patient_api",
      "im1_transaction_api",
      "gp_connect_existing",
      "local_gateway_component",
      "manual_assist_only",
    ];

    for (const mode of modes) {
      const result =
        mode === "gp_connect_existing" || mode === "manual_assist_only"
          ? await service.resolveAppointmentManageCapability(inputForMode(mode))
          : await service.resolveBookingCapability(inputForMode(mode));
      expect(result.providerAdapterBinding.integrationMode).toBe(mode);
      expect(result.providerAdapterBinding.bindingHash).toMatch(/^[a-f0-9]{64}$/);
      expect(result.resolution.capabilityTupleHash).toMatch(/^[a-f0-9]{64}$/);
    }
  });

  it("keeps patient and staff projection parity on the same GP Connect tuple without widening patient self-service", async () => {
    const service = createPhase4BookingCapabilityEngineService({
      repositories: createPhase4BookingCapabilityEngineStore(),
    });

    const patient = await service.resolveAppointmentManageCapability(
      inputForMode("gp_connect_existing"),
    );
    const staff = await service.resolveAppointmentManageCapability(
      buildBookingInput({
        ...inputForMode("gp_connect_existing"),
        selectionAudience: "staff",
        requestedActionScope: "reschedule_appointment",
        routeIntentBindingRef: "route_intent_manage_staff_283",
      }),
    );

    const patientAssist = await service.resolveAppointmentManageCapability(
      buildBookingInput({
        ...inputForMode("gp_connect_existing"),
        selectionAudience: "patient",
        requestedActionScope: "reschedule_appointment",
        routeIntentBindingRef: "route_intent_manage_patient_283",
      }),
    );

    expect(staff.resolution.capabilityState).toBe("live_staff_assist");
    expect(staff.projection.surfaceState).toBe("staff_assist_live");
    expect(patientAssist.resolution.capabilityState).toBe("assisted_only");
    expect(patientAssist.projection.surfaceState).toBe("assisted_only");
    expect(patientAssist.projection.selfServiceActionRefs).toEqual([]);
    expect(patientAssist.projection.assistedActionRefs).toContain("request_staff_assist");
    expect(staff.projection.parityGroupId).toBe(patientAssist.projection.parityGroupId);
    expect(patient.emittedEvents).toHaveLength(1);
  });

  it("fails closed into linkage_required when IM1 patient linkage is missing", async () => {
    const service = createPhase4BookingCapabilityEngineService({
      repositories: createPhase4BookingCapabilityEngineStore(),
    });

    const result = await service.resolveBookingCapability(
      buildBookingInput({
        gpLinkageStatus: "missing",
      }),
    );

    expect(result.resolution.capabilityState).toBe("linkage_required");
    expect(result.resolution.fallbackActionRefs).toContain("fallback_repair_gp_linkage");
    expect(result.projection.surfaceState).toBe("linkage_required");
    expect(result.projection.blockedActionReasonCodes).toContain("reason_gp_linkage_required");
  });

  it("fails closed into local_component_required when the local consumer is missing", async () => {
    const service = createPhase4BookingCapabilityEngineService({
      repositories: createPhase4BookingCapabilityEngineStore(),
    });

    const result = await service.resolveBookingCapability(
      buildBookingInput({
        ...inputForMode("im1_transaction_api"),
        localConsumerStatus: "missing",
      }),
    );

    expect(result.resolution.capabilityState).toBe("local_component_required");
    expect(result.projection.assistedActionRefs).toContain("launch_local_component");
    expect(result.resolution.blockedActionReasonCodes).toContain(
      "reason_local_component_required",
    );
  });

  it("downgrades live capability into recovery_only when trust or route publication drifts", async () => {
    const service = createPhase4BookingCapabilityEngineService({
      repositories: createPhase4BookingCapabilityEngineStore(),
    });

    const result = await service.resolveAppointmentManageCapability(
      buildBookingInput({
        ...inputForMode("gp_connect_existing"),
        publicationState: "frozen",
        assuranceTrustState: "read_only",
      }),
    );

    expect(result.resolution.capabilityState).toBe("recovery_only");
    expect(result.projection.surfaceState).toBe("recovery_required");
    expect(result.projection.controlState).toBe("read_only");
    expect(result.resolution.blockedActionReasonCodes).toEqual(
      expect.arrayContaining(["reason_publication_frozen", "reason_assurance_read_only"]),
    );
  });

  it("returns degraded_manual for degraded supplier posture and blocks unsupported manual-assist actions", async () => {
    const service = createPhase4BookingCapabilityEngineService({
      repositories: createPhase4BookingCapabilityEngineStore(),
    });

    const degraded = await service.resolveBookingCapability(
      buildBookingInput({
        ...inputForMode("local_gateway_component"),
        supplierDegradationStatus: "degraded_manual",
      }),
    );
    expect(degraded.resolution.capabilityState).toBe("degraded_manual");
    expect(degraded.resolution.fallbackActionRefs).toContain("fallback_manual_hub_booking");

    const blocked = await service.resolveAppointmentManageCapability(
      buildBookingInput({
        ...inputForMode("manual_assist_only"),
        selectionAudience: "patient",
        requestedActionScope: "cancel_appointment",
        routeIntentBindingRef: "route_intent_blocked_patient_283",
      }),
    );
    expect(blocked.resolution.capabilityState).toBe("blocked");
    expect(blocked.projection.surfaceState).toBe("blocked");
    expect(blocked.resolution.blockedActionReasonCodes).toEqual(
      expect.arrayContaining(["reason_action_scope_not_supported", "reason_policy_blocked"]),
    );
  });

  it("supersedes stale bindings and stale scope resolutions when the matrix version changes", async () => {
    const repositories = createPhase4BookingCapabilityEngineStore();
    const service = createPhase4BookingCapabilityEngineService({ repositories });

    const first = await service.resolveBookingCapability(buildBookingInput());

    const oldRow = phase4ProviderCapabilityMatrixRows.find(
      (row) => row.providerCapabilityMatrixRef === "PCM_279_OPTUM_IM1_PATIENT_V1",
    );
    expect(oldRow).toBeDefined();
    await repositories.saveProviderCapabilityMatrixRow({
      ...oldRow!,
      providerCapabilityMatrixRef: "PCM_283_OPTUM_IM1_PATIENT_V2",
      matrixVersionRef: "283.matrix.optum-im1-patient.v2",
    });
    await repositories.saveProviderCapabilityMatrixRow({
      ...oldRow!,
      contractState: "superseded",
    });

    const second = await service.resolveBookingCapability(
      buildBookingInput({
        presentedCapabilityTupleHash: first.resolution.capabilityTupleHash,
        presentedBindingHash: first.providerAdapterBinding.bindingHash,
      }),
    );

    expect(second.providerCapabilityMatrixRow.matrixVersionRef).toBe(
      "283.matrix.optum-im1-patient.v2",
    );
    expect(second.providerAdapterBinding.bindingHash).not.toBe(
      first.providerAdapterBinding.bindingHash,
    );
    expect(second.supersededBindingRefs).toContain(
      first.providerAdapterBinding.bookingProviderAdapterBindingId,
    );
    expect(second.supersededResolutionRefs).toContain(
      first.resolution.bookingCapabilityResolutionId,
    );
  });

  it("replays the same tuple deterministically and publishes diagnostics for the current scope", async () => {
    const repositories = createPhase4BookingCapabilityEngineStore();
    const service = createPhase4BookingCapabilityEngineService({ repositories });

    const first = await service.resolveBookingCapability(buildBookingInput());
    const replay = await service.resolveBookingCapability(buildBookingInput());

    expect(replay.resolution.capabilityTupleHash).toBe(first.resolution.capabilityTupleHash);
    expect(replay.providerAdapterBinding.bindingHash).toBe(
      first.providerAdapterBinding.bindingHash,
    );
    expect(replay.emittedEvents).toEqual([]);

    const diagnostics = await service.queryCapabilityDiagnostics({
      bookingCaseId: "booking_case_283",
      appointmentId: null,
      governingObjectDescriptorRef: "BookingCase",
      governingObjectRef: "booking_case_283",
      selectionAudience: "patient",
      requestedActionScope: "book_slot",
    });

    expect(diagnostics?.isCurrentScope).toBe(true);
    expect(diagnostics?.providerAdapterBinding.bindingHash).toBe(
      first.providerAdapterBinding.bindingHash,
    );
    expect(diagnostics?.resolution.allowedActionScopes).toContain("book_slot");
  });
});
