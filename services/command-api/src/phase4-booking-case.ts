import {
  createDeterministicBackboneIdGenerator,
  type BackboneIdGenerator,
} from "@vecells/domain-kernel";
import {
  createPhase4BookingCaseKernelService,
  createPhase4BookingCaseKernelStore,
  type BookingCaseBundle,
  type BookingCaseTransitionCommandInput,
  type BookingCaseTransitionResult,
  type CreateBookingCaseFromIntentInput,
  type Phase4BookingCaseKernelRepositories,
  type Phase4BookingCaseKernelService,
} from "@vecells/domain-booking";
import type { BookingIntentSnapshot, Phase3DirectResolutionBundle } from "@vecells/domain-triage-workspace";
import {
  phase3DirectResolutionMigrationPlanRefs,
  phase3DirectResolutionPersistenceTables,
} from "./phase3-direct-resolution-handoffs";

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

export const PHASE4_BOOKING_CASE_SERVICE_NAME = "Phase4BookingCaseKernelApplication";
export const PHASE4_BOOKING_CASE_SCHEMA_VERSION =
  "282.phase4.booking-case-state-machine-and-intent-records.v1";
export const PHASE4_BOOKING_CASE_QUERY_SURFACES = [
  "GET /v1/bookings/cases/{bookingCaseId}",
] as const;

export const phase4BookingCaseRoutes = [
  {
    routeId: "booking_case_current",
    method: "GET",
    path: "/v1/bookings/cases/{bookingCaseId}",
    contractFamily: "BookingCaseBundleContract",
    purpose:
      "Expose the current BookingCase, durable BookingIntent lineage, SearchPolicy ref, and append-only transition journal for one booking branch.",
    bodyRequired: false,
    idempotencyRequired: false,
  },
  {
    routeId: "booking_case_create_from_intent",
    method: "POST",
    path: "/internal/v1/bookings/cases:create-from-intent",
    contractFamily: "CreateBookingCaseFromIntentCommandContract",
    purpose:
      "Create or replay one Phase 4 BookingCase from the current Phase 3 booking handoff lineage without widening capability, slot, offer, or waitlist authority.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "booking_case_mark_capability_checked",
    method: "POST",
    path: "/internal/v1/bookings/cases/{bookingCaseId}:mark-capability-checked",
    contractFamily: "BookingCaseCapabilityCheckedCommandContract",
    purpose:
      "Acknowledge that the booking case handoff tuple remains current and can enter capability_checked before any live slot search starts.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "booking_case_begin_local_search",
    method: "POST",
    path: "/internal/v1/bookings/cases/{bookingCaseId}:begin-local-search",
    contractFamily: "BookingCaseBeginLocalSearchCommandContract",
    purpose:
      "Enter searching_local only when the current capability tuple is live and one SearchPolicy has been durably recorded.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "booking_case_publish_offers_ready",
    method: "POST",
    path: "/internal/v1/bookings/cases/{bookingCaseId}:publish-offers-ready",
    contractFamily: "BookingCaseOffersReadyCommandContract",
    purpose:
      "Advance the booking branch into offers_ready when a typed OfferSession ref exists, without claiming offer-generation ownership.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "booking_case_start_selection",
    method: "POST",
    path: "/internal/v1/bookings/cases/{bookingCaseId}:start-selection",
    contractFamily: "BookingCaseSelectionCommandContract",
    purpose:
      "Advance the booking branch into selecting against one typed selected-slot ref and the live booking tuple.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "booking_case_start_revalidation",
    method: "POST",
    path: "/internal/v1/bookings/cases/{bookingCaseId}:start-revalidation",
    contractFamily: "BookingCaseRevalidationCommandContract",
    purpose:
      "Advance the booking branch into revalidating without locally re-deriving reservation or commit semantics.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "booking_case_enter_commit_pending",
    method: "POST",
    path: "/internal/v1/bookings/cases/{bookingCaseId}:enter-commit-pending",
    contractFamily: "BookingCaseCommitPendingCommandContract",
    purpose:
      "Advance the booking branch into commit_pending against the current selected-slot tuple while keeping BookingTransaction authority external to 282.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "booking_case_mark_confirmation_pending",
    method: "POST",
    path: "/internal/v1/bookings/cases/{bookingCaseId}:mark-confirmation-pending",
    contractFamily: "BookingCaseConfirmationPendingCommandContract",
    purpose:
      "Advance the booking branch into confirmation_pending when authoritative confirmation truth is pending on the same lineage.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "booking_case_mark_supplier_reconciliation_pending",
    method: "POST",
    path: "/internal/v1/bookings/cases/{bookingCaseId}:mark-supplier-reconciliation-pending",
    contractFamily: "BookingCaseSupplierReconciliationPendingCommandContract",
    purpose:
      "Advance the booking branch into supplier_reconciliation_pending when authoritative booking truth is ambiguous or disputed on the same lineage.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "booking_case_mark_waitlisted",
    method: "POST",
    path: "/internal/v1/bookings/cases/{bookingCaseId}:mark-waitlisted",
    contractFamily: "BookingCaseWaitlistedCommandContract",
    purpose:
      "Advance the booking branch into waitlisted only when typed waitlist truth refs exist, without claiming waitlist policy authority.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "booking_case_mark_callback_fallback",
    method: "POST",
    path: "/internal/v1/bookings/cases/{bookingCaseId}:mark-callback-fallback",
    contractFamily: "BookingCaseCallbackFallbackCommandContract",
    purpose:
      "Advance the booking branch into callback_fallback only when the typed fallback obligation and linked callback case refs exist.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "booking_case_mark_hub_fallback",
    method: "POST",
    path: "/internal/v1/bookings/cases/{bookingCaseId}:mark-hub-fallback",
    contractFamily: "BookingCaseHubFallbackCommandContract",
    purpose:
      "Advance the booking branch into fallback_to_hub only when the typed fallback obligation and linked hub case refs exist.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "booking_case_mark_booking_failed",
    method: "POST",
    path: "/internal/v1/bookings/cases/{bookingCaseId}:mark-booking-failed",
    contractFamily: "BookingCaseFailureCommandContract",
    purpose:
      "Advance the booking branch into booking_failed when the authoritative continuation path has ended without live waitlist or fallback truth.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "booking_case_mark_booked",
    method: "POST",
    path: "/internal/v1/bookings/cases/{bookingCaseId}:mark-booked",
    contractFamily: "BookingCaseBookedCommandContract",
    purpose:
      "Advance the booking branch into booked only when typed appointment and confirmation-truth refs exist on the current lineage.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "booking_case_mark_managed",
    method: "POST",
    path: "/internal/v1/bookings/cases/{bookingCaseId}:mark-managed",
    contractFamily: "BookingCaseManagedCommandContract",
    purpose:
      "Advance the booking branch into managed when authoritative appointment truth exists, without granting request closure authority.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "booking_case_close",
    method: "POST",
    path: "/internal/v1/bookings/cases/{bookingCaseId}:close",
    contractFamily: "BookingCaseCloseCommandContract",
    purpose:
      "Close one finished booking branch without directly closing the canonical request lifecycle.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
] as const;

export const phase4BookingCasePersistenceTables = [
  ...new Set([
    ...phase3DirectResolutionPersistenceTables,
    "phase4_booking_intents",
    "phase4_search_policies",
    "phase4_booking_cases",
    "phase4_booking_case_transition_journal",
  ]),
] as const;

export const phase4BookingCaseMigrationPlanRefs = [
  ...new Set([
    ...phase3DirectResolutionMigrationPlanRefs,
    "services/command-api/migrations/131_phase4_booking_case_kernel.sql",
  ]),
] as const;

interface BookingIntentSourcePort {
  queryTaskDirectResolution(taskId: string): Promise<Phase3DirectResolutionBundle | null>;
}

export interface CreateBookingCaseFromTaskHandoffInput
  extends Omit<CreateBookingCaseFromIntentInput, "handoff"> {
  taskId: string;
}

export interface Phase4BookingCaseApplication {
  bookingKernelService: Phase4BookingCaseKernelService;
  bookingRepositories: Phase4BookingCaseKernelRepositories;
  queryBookingCase(bookingCaseId: string): Promise<BookingCaseBundle | null>;
  createBookingCaseFromIntent(
    input: CreateBookingCaseFromIntentInput,
  ): Promise<BookingCaseTransitionResult>;
  createBookingCaseFromTaskHandoff(
    input: CreateBookingCaseFromTaskHandoffInput,
  ): Promise<BookingCaseTransitionResult>;
  markCapabilityChecked(
    input: BookingCaseTransitionCommandInput,
  ): Promise<BookingCaseTransitionResult>;
  beginLocalSearch(
    input: BookingCaseTransitionCommandInput,
  ): Promise<BookingCaseTransitionResult>;
  publishOffersReady(
    input: BookingCaseTransitionCommandInput,
  ): Promise<BookingCaseTransitionResult>;
  startSelection(input: BookingCaseTransitionCommandInput): Promise<BookingCaseTransitionResult>;
  startRevalidation(
    input: BookingCaseTransitionCommandInput,
  ): Promise<BookingCaseTransitionResult>;
  enterCommitPending(
    input: BookingCaseTransitionCommandInput,
  ): Promise<BookingCaseTransitionResult>;
  markConfirmationPending(
    input: BookingCaseTransitionCommandInput,
  ): Promise<BookingCaseTransitionResult>;
  markSupplierReconciliationPending(
    input: BookingCaseTransitionCommandInput,
  ): Promise<BookingCaseTransitionResult>;
  markWaitlisted(input: BookingCaseTransitionCommandInput): Promise<BookingCaseTransitionResult>;
  markCallbackFallback(
    input: BookingCaseTransitionCommandInput,
  ): Promise<BookingCaseTransitionResult>;
  markHubFallback(input: BookingCaseTransitionCommandInput): Promise<BookingCaseTransitionResult>;
  markBookingFailed(
    input: BookingCaseTransitionCommandInput,
  ): Promise<BookingCaseTransitionResult>;
  markBooked(input: BookingCaseTransitionCommandInput): Promise<BookingCaseTransitionResult>;
  markManaged(input: BookingCaseTransitionCommandInput): Promise<BookingCaseTransitionResult>;
  closeBookingCase(input: BookingCaseTransitionCommandInput): Promise<BookingCaseTransitionResult>;
}

function requireBookingIntentFromBundle(bundle: Phase3DirectResolutionBundle | null): BookingIntentSnapshot {
  invariant(bundle?.bookingIntent, "BOOKING_INTENT_NOT_FOUND", "No live booking handoff exists for the requested task.");
  return bundle.bookingIntent;
}

export function createPhase4BookingCaseApplication(input?: {
  repositories?: ReturnType<typeof createPhase4BookingCaseKernelStore>;
  directResolutionApplication?: BookingIntentSourcePort;
  idGenerator?: BackboneIdGenerator;
}): Phase4BookingCaseApplication {
  const repositories = input?.repositories ?? createPhase4BookingCaseKernelStore();
  const bookingKernelService = createPhase4BookingCaseKernelService({
    repositories,
    idGenerator:
      input?.idGenerator ?? createDeterministicBackboneIdGenerator("phase4-booking-command-api"),
  });

  return {
    bookingKernelService,
    bookingRepositories: bookingKernelService.repositories,

    async queryBookingCase(bookingCaseId) {
      return bookingKernelService.queryBookingCaseBundle(bookingCaseId);
    },

    async createBookingCaseFromIntent(command) {
      return bookingKernelService.createBookingCaseFromIntent(command);
    },

    async createBookingCaseFromTaskHandoff(command) {
      invariant(
        input?.directResolutionApplication,
        "DIRECT_RESOLUTION_APPLICATION_REQUIRED",
        "directResolutionApplication is required to create a booking case from a task handoff.",
      );
      const taskId = requireRef(command.taskId, "taskId");
      const bundle = await input.directResolutionApplication.queryTaskDirectResolution(taskId);
      const bookingIntent = requireBookingIntentFromBundle(bundle);
      return bookingKernelService.createBookingCaseFromIntent({
        ...command,
        handoff: bookingIntent,
      });
    },

    async markCapabilityChecked(command) {
      return bookingKernelService.markCapabilityChecked(command);
    },

    async beginLocalSearch(command) {
      return bookingKernelService.beginLocalSearch(command);
    },

    async publishOffersReady(command) {
      return bookingKernelService.publishOffersReady(command);
    },

    async startSelection(command) {
      return bookingKernelService.startSelection(command);
    },

    async startRevalidation(command) {
      return bookingKernelService.startRevalidation(command);
    },

    async enterCommitPending(command) {
      return bookingKernelService.enterCommitPending(command);
    },

    async markConfirmationPending(command) {
      return bookingKernelService.markConfirmationPending(command);
    },

    async markSupplierReconciliationPending(command) {
      return bookingKernelService.markSupplierReconciliationPending(command);
    },

    async markWaitlisted(command) {
      return bookingKernelService.markWaitlisted(command);
    },

    async markCallbackFallback(command) {
      return bookingKernelService.markCallbackFallback(command);
    },

    async markHubFallback(command) {
      return bookingKernelService.markHubFallback(command);
    },

    async markBookingFailed(command) {
      return bookingKernelService.markBookingFailed(command);
    },

    async markBooked(command) {
      return bookingKernelService.markBooked(command);
    },

    async markManaged(command) {
      return bookingKernelService.markManaged(command);
    },

    async closeBookingCase(command) {
      return bookingKernelService.closeBookingCase(command);
    },
  };
}
