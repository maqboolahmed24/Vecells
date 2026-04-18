import {
  createPhase4BookingCapabilityEngineService,
  createPhase4BookingCapabilityEngineStore,
  type BookingCapabilityDiagnosticsBundle,
  type BookingCapabilityResolutionInput,
  type BookingCapabilityResolutionResult,
  type Phase4BookingCapabilityEngineRepositories,
  type Phase4BookingCapabilityEngineService,
} from "@vecells/domain-booking";
import type { BookingCaseBundle } from "@vecells/domain-booking";

function invariant(condition: unknown, code: string, message: string): asserts condition {
  if (!condition) {
    throw new Error(`${code}: ${message}`);
  }
}

function requireRef(value: string | null | undefined, field: string): string {
  invariant(
    typeof value === "string" && value.trim().length > 0,
    `INVALID_${field.toUpperCase()}`,
    `${field} is required.`,
  );
  return value.trim();
}

export const PHASE4_BOOKING_CAPABILITY_SERVICE_NAME =
  "Phase4BookingCapabilityEngineApplication";
export const PHASE4_BOOKING_CAPABILITY_SCHEMA_VERSION =
  "283.phase4.provider-capability-matrix-and-binding-compiler.v1";

export const PHASE4_BOOKING_CAPABILITY_QUERY_SURFACES = [
  "GET /v1/bookings/cases/{bookingCaseId}/capability",
  "GET /v1/appointments/{appointmentId}/manage-capability",
  "GET /internal/v1/bookings/capabilities/diagnostics",
] as const;

export const phase4BookingCapabilityRoutes = [
  {
    routeId: "booking_case_capability_current",
    method: "GET",
    path: "/v1/bookings/cases/{bookingCaseId}/capability",
    contractFamily: "BookingCapabilityResolutionContract",
    purpose:
      "Resolve one current BookingCapabilityResolution and BookingCapabilityProjection for the exact booking-case tuple.",
    bodyRequired: false,
    idempotencyRequired: false,
  },
  {
    routeId: "appointment_manage_capability_current",
    method: "GET",
    path: "/v1/appointments/{appointmentId}/manage-capability",
    contractFamily: "AppointmentManageCapabilityResolutionContract",
    purpose:
      "Resolve one current BookingCapabilityResolution and BookingCapabilityProjection for the exact appointment-manage tuple.",
    bodyRequired: false,
    idempotencyRequired: false,
  },
  {
    routeId: "booking_case_capability_resolve",
    method: "POST",
    path: "/internal/v1/bookings/capabilities:resolve-case",
    contractFamily: "ResolveBookingCaseCapabilityCommandContract",
    purpose:
      "Compile the current binding and persist one lawful booking-case capability tuple for the exact tenant, provider, audience, and route context.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "appointment_manage_capability_resolve",
    method: "POST",
    path: "/internal/v1/bookings/capabilities:resolve-appointment-manage",
    contractFamily: "ResolveAppointmentManageCapabilityCommandContract",
    purpose:
      "Compile the current binding and persist one lawful appointment-manage capability tuple for the exact tenant, provider, audience, and route context.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "booking_capability_diagnostics",
    method: "GET",
    path: "/internal/v1/bookings/capabilities/diagnostics",
    contractFamily: "BookingCapabilityDiagnosticsContract",
    purpose:
      "Inspect the current matrix row, binding, fallback actions, blocked reasons, and projection for internal diagnostics without widening booking truth.",
    bodyRequired: false,
    idempotencyRequired: false,
  },
] as const;

export const phase4BookingCapabilityPersistenceTables = [
  "phase4_provider_capability_matrix_rows",
  "phase4_adapter_contract_profiles",
  "phase4_dependency_degradation_profiles",
  "phase4_authoritative_read_confirmation_policies",
  "phase4_booking_provider_adapter_bindings",
  "phase4_booking_capability_resolutions",
  "phase4_booking_capability_projections",
] as const;

export const phase4BookingCapabilityMigrationPlanRefs = [
  "services/command-api/migrations/132_phase4_booking_capability_engine.sql",
] as const;

interface BookingCaseLookupPort {
  queryBookingCase(bookingCaseId: string): Promise<BookingCaseBundle | null>;
}

export interface ResolveBookingCaseCapabilityInput
  extends Omit<BookingCapabilityResolutionInput, "appointmentId"> {
  bookingCaseId: string;
}

export interface ResolveAppointmentManageCapabilityInput
  extends Omit<BookingCapabilityResolutionInput, "bookingCaseId"> {
  appointmentId: string;
}

export interface QueryBookingCapabilityDiagnosticsInput {
  resolutionId?: string;
  bookingCaseId?: string | null;
  appointmentId?: string | null;
  governingObjectDescriptorRef?: string;
  governingObjectRef?: string;
  selectionAudience?: BookingCapabilityResolutionInput["selectionAudience"];
  requestedActionScope?: BookingCapabilityResolutionInput["requestedActionScope"];
}

export interface Phase4BookingCapabilityApplication {
  bookingCapabilityService: Phase4BookingCapabilityEngineService;
  bookingCapabilityRepositories: Phase4BookingCapabilityEngineRepositories;
  resolveBookingCaseCapability(
    input: ResolveBookingCaseCapabilityInput,
  ): Promise<BookingCapabilityResolutionResult>;
  resolveAppointmentManageCapability(
    input: ResolveAppointmentManageCapabilityInput,
  ): Promise<BookingCapabilityResolutionResult>;
  queryCapabilityDiagnostics(
    input: QueryBookingCapabilityDiagnosticsInput,
  ): Promise<BookingCapabilityDiagnosticsBundle | null>;
}

function deriveBookingCaseContext(
  bookingCase: BookingCaseBundle,
  input: ResolveBookingCaseCapabilityInput,
): ResolveBookingCaseCapabilityInput {
  return {
    ...input,
    tenantId: input.tenantId ?? bookingCase.bookingCase.tenantId,
    practiceRef: input.practiceRef ?? bookingCase.bookingCase.providerContext.practiceRef,
    supplierRef:
      input.supplierRef ??
      requireRef(
        bookingCase.bookingCase.providerContext.supplierHintRef,
        "bookingCase.providerContext.supplierHintRef",
      ),
  };
}

export function createPhase4BookingCapabilityApplication(input?: {
  bookingCaseApplication?: BookingCaseLookupPort;
  repositories?: ReturnType<typeof createPhase4BookingCapabilityEngineStore>;
}): Phase4BookingCapabilityApplication {
  const bookingCapabilityRepositories =
    input?.repositories ?? createPhase4BookingCapabilityEngineStore();
  const bookingCapabilityService = createPhase4BookingCapabilityEngineService({
    repositories: bookingCapabilityRepositories,
  });

  return {
    bookingCapabilityService,
    bookingCapabilityRepositories,
    async resolveBookingCaseCapability(command) {
      const bookingCaseId = requireRef(command.bookingCaseId, "bookingCaseId");
      let resolvedInput = { ...command };
      if (input?.bookingCaseApplication) {
        const bookingCase = await input.bookingCaseApplication.queryBookingCase(bookingCaseId);
        invariant(
          bookingCase !== null,
          "BOOKING_CASE_NOT_FOUND",
          `BookingCase ${bookingCaseId} was not found for capability resolution.`,
        );
        resolvedInput = deriveBookingCaseContext(bookingCase, resolvedInput);
      }
      return bookingCapabilityService.resolveBookingCapability({
        ...resolvedInput,
        appointmentId: null,
      });
    },
    async resolveAppointmentManageCapability(command) {
      return bookingCapabilityService.resolveAppointmentManageCapability({
        ...command,
        bookingCaseId: null,
      });
    },
    queryCapabilityDiagnostics(input) {
      return bookingCapabilityService.queryCapabilityDiagnostics(input);
    },
  };
}
