import {
  type BookingCapabilityDiagnosticsBundle,
  createPhase4SlotSearchSnapshotService,
  createPhase4SlotSearchSnapshotStore,
  type Phase4SlotSearchSnapshotRepositories,
  type Phase4SlotSearchSnapshotService,
  type ProviderSearchWindowInput,
  type SlotSearchExecutionInput,
  type SlotSearchDayBucketResult,
  type SlotSearchExecutionResult,
  type SlotSearchPageResult,
  type SlotSearchSelectionAudience,
  type SlotSnapshotRecoveryStateSnapshot,
} from "@vecells/domain-booking";
import type { BookingCaseBundle, SearchPolicySnapshot } from "@vecells/domain-booking";
import type { QueryBookingCapabilityDiagnosticsInput } from "./phase4-booking-capability";

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

export const PHASE4_SLOT_SEARCH_SERVICE_NAME = "Phase4SlotSearchSnapshotPipelineApplication";
export const PHASE4_SLOT_SEARCH_SCHEMA_VERSION =
  "284.phase4.slot-search-snapshot-pipeline.v1";
export const PHASE4_SLOT_SEARCH_QUERY_SURFACES = [
  "GET /v1/bookings/cases/{bookingCaseId}/slot-search/current",
  "GET /v1/bookings/slot-snapshots/{slotSetSnapshotId}/pages/{pageNumber}",
  "GET /v1/bookings/slot-snapshots/{slotSetSnapshotId}/days/{localDayKey}",
] as const;

export const phase4SlotSearchRoutes = [
  {
    routeId: "booking_case_slot_search_current",
    method: "GET",
    path: "/v1/bookings/cases/{bookingCaseId}/slot-search/current",
    contractFamily: "SlotSearchSessionContract",
    purpose:
      "Resolve the current frozen SlotSearchSession, SlotSetSnapshot, recovery state, and candidate index for one booking case.",
    bodyRequired: false,
    idempotencyRequired: false,
  },
  {
    routeId: "booking_slot_snapshot_page",
    method: "GET",
    path: "/v1/bookings/slot-snapshots/{slotSetSnapshotId}/pages/{pageNumber}",
    contractFamily: "SlotSetSnapshotPageContract",
    purpose:
      "Fetch one page from the frozen SnapshotCandidateIndex after re-evaluating the active booking-case and capability tuple.",
    bodyRequired: false,
    idempotencyRequired: false,
  },
  {
    routeId: "booking_slot_snapshot_day_bucket",
    method: "GET",
    path: "/v1/bookings/slot-snapshots/{slotSetSnapshotId}/days/{localDayKey}",
    contractFamily: "SlotSetSnapshotDayBucketContract",
    purpose:
      "Fetch one local-day bucket from the frozen SnapshotCandidateIndex after re-evaluating the active booking-case and capability tuple.",
    bodyRequired: false,
    idempotencyRequired: false,
  },
  {
    routeId: "booking_case_slot_search_start",
    method: "POST",
    path: "/internal/v1/bookings/cases/{bookingCaseId}:start-slot-search",
    contractFamily: "StartSlotSearchCommandContract",
    purpose:
      "Execute one bounded supplier search and freeze a SlotSearchSession plus SlotSetSnapshot against the live booking-case and capability tuple.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "booking_slot_search_refresh",
    method: "POST",
    path: "/internal/v1/bookings/slot-snapshots/{slotSetSnapshotId}:refresh",
    contractFamily: "RefreshSlotSearchCommandContract",
    purpose:
      "Refresh or supersede the current booking slot snapshot without widening beyond the live SearchPolicy and capability tuple.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "booking_slot_search_invalidate",
    method: "POST",
    path: "/internal/v1/bookings/slot-snapshots/{slotSetSnapshotId}:invalidate",
    contractFamily: "InvalidateSlotSnapshotCommandContract",
    purpose:
      "Invalidate a stale or disputed slot snapshot while preserving its recovery provenance and clearing the current snapshot pointer.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
] as const;

export const phase4SlotSearchPersistenceTables = [
  "phase4_slot_search_sessions",
  "phase4_provider_search_slices",
  "phase4_temporal_normalization_envelopes",
  "phase4_canonical_slot_identities",
  "phase4_normalized_slots",
  "phase4_snapshot_candidate_indices",
  "phase4_slot_snapshot_recovery_states",
  "phase4_slot_set_snapshots",
] as const;

export const phase4SlotSearchMigrationPlanRefs = [
  "services/command-api/migrations/133_phase4_slot_search_snapshot_pipeline.sql",
] as const;

interface BookingCaseLookupPort {
  queryBookingCase(bookingCaseId: string): Promise<BookingCaseBundle | null>;
}

interface BookingCapabilityLookupPort {
  queryCapabilityDiagnostics(
    input: QueryBookingCapabilityDiagnosticsInput,
  ): Promise<BookingCapabilityDiagnosticsBundle | null>;
}

export interface StartSlotSearchInput {
  bookingCaseId: string;
  displayTimeZone: string;
  supplierWindows: readonly ProviderSearchWindowInput[];
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  subjectRef: string;
  occurredAt: string;
  payloadArtifactRef?: string | null;
  edgeCorrelationId?: string | null;
  expiresInSeconds?: number;
}

export interface QueryCurrentSlotSearchInput {
  bookingCaseId: string;
}

export interface FetchSlotSnapshotPageInput {
  slotSetSnapshotId: string;
  pageNumber: number;
  requestedAt: string;
}

export interface FetchSlotSnapshotDayBucketInput {
  slotSetSnapshotId: string;
  localDayKey: string;
  requestedAt: string;
}

export interface InvalidateSlotSnapshotInput {
  slotSetSnapshotId: string;
  reasonCodes: readonly string[];
  invalidatedAt: string;
}

export type RefreshSlotSearchInput = StartSlotSearchInput;

export interface Phase4SlotSearchApplication {
  slotSearchService: Phase4SlotSearchSnapshotService;
  slotSearchRepositories: Phase4SlotSearchSnapshotRepositories;
  startSlotSearch(input: StartSlotSearchInput): Promise<SlotSearchExecutionResult>;
  refreshSlotSearch(input: RefreshSlotSearchInput): Promise<SlotSearchExecutionResult>;
  queryCurrentSlotSearch(input: QueryCurrentSlotSearchInput): Promise<SlotSearchExecutionResult | null>;
  fetchSlotSnapshotPage(input: FetchSlotSnapshotPageInput): Promise<SlotSearchPageResult>;
  fetchSlotSnapshotDayBucket(input: FetchSlotSnapshotDayBucketInput): Promise<SlotSearchDayBucketResult>;
  invalidateSlotSnapshot(input: InvalidateSlotSnapshotInput): Promise<SlotSnapshotRecoveryStateSnapshot>;
}

function translateSelectionAudience(
  searchPolicy: SearchPolicySnapshot,
): SlotSearchSelectionAudience {
  return searchPolicy.selectionAudience === "patient_self_service" ? "patient" : "staff";
}

function buildCapabilityDiagnosticsQuery(
  bookingCase: BookingCaseBundle,
): QueryBookingCapabilityDiagnosticsInput {
  invariant(
    bookingCase.searchPolicy !== null,
    "BOOKING_SEARCH_POLICY_NOT_FOUND",
    "SearchPolicy must exist before slot search can execute.",
  );
  return {
    bookingCaseId: bookingCase.bookingCase.bookingCaseId,
    governingObjectDescriptorRef: "BookingCase",
    governingObjectRef: bookingCase.bookingCase.bookingCaseId,
    selectionAudience: translateSelectionAudience(bookingCase.searchPolicy),
    requestedActionScope: "search_slots",
  };
}

function requireSearchableCase(bookingCase: BookingCaseBundle): SearchPolicySnapshot {
  invariant(
    bookingCase.bookingCase.status === "searching_local" ||
      bookingCase.bookingCase.status === "offers_ready",
    "BOOKING_CASE_NOT_SEARCHABLE",
    "BookingCase must be in searching_local or offers_ready before slot search can run.",
  );
  invariant(
    bookingCase.searchPolicy !== null,
    "BOOKING_SEARCH_POLICY_NOT_FOUND",
    "SearchPolicy must exist before slot search can execute.",
  );
  invariant(
    bookingCase.bookingCase.activeCapabilityResolutionRef !== null,
    "ACTIVE_CAPABILITY_RESOLUTION_REQUIRED",
    "BookingCase must point at an active capability resolution before slot search can execute.",
  );
  invariant(
    bookingCase.bookingCase.activeProviderAdapterBindingRef !== null,
    "ACTIVE_PROVIDER_ADAPTER_BINDING_REQUIRED",
    "BookingCase must point at an active provider adapter binding before slot search can execute.",
  );
  return bookingCase.searchPolicy;
}

export function createPhase4SlotSearchApplication(input?: {
  repositories?: ReturnType<typeof createPhase4SlotSearchSnapshotStore>;
  bookingCaseApplication?: BookingCaseLookupPort;
  bookingCapabilityApplication?: BookingCapabilityLookupPort;
}): Phase4SlotSearchApplication {
  const slotSearchRepositories = input?.repositories ?? createPhase4SlotSearchSnapshotStore();
  const slotSearchService = createPhase4SlotSearchSnapshotService({
    repositories: slotSearchRepositories,
  });

  async function requireBookingCase(bookingCaseId: string): Promise<BookingCaseBundle> {
    invariant(
      input?.bookingCaseApplication,
      "BOOKING_CASE_APPLICATION_REQUIRED",
      "bookingCaseApplication is required for Phase 4 slot search execution.",
    );
    const bookingCase = await input.bookingCaseApplication.queryBookingCase(bookingCaseId);
    invariant(bookingCase !== null, "BOOKING_CASE_NOT_FOUND", `BookingCase ${bookingCaseId} was not found.`);
    return bookingCase;
  }

  async function requireCurrentCapability(bookingCase: BookingCaseBundle) {
    invariant(
      input?.bookingCapabilityApplication,
      "BOOKING_CAPABILITY_APPLICATION_REQUIRED",
      "bookingCapabilityApplication is required for Phase 4 slot search execution.",
    );
    const diagnostics = await input.bookingCapabilityApplication.queryCapabilityDiagnostics(
      buildCapabilityDiagnosticsQuery(bookingCase),
    );
    invariant(
      diagnostics?.isCurrentScope,
      "CURRENT_BOOKING_CAPABILITY_NOT_FOUND",
      "No current booking capability tuple exists for search_slots on this booking case.",
    );
    invariant(
      diagnostics.resolution.bookingCapabilityResolutionId ===
        bookingCase.bookingCase.activeCapabilityResolutionRef,
      "ACTIVE_CAPABILITY_RESOLUTION_DRIFT",
      "BookingCase active capability resolution no longer matches the current capability tuple.",
    );
    invariant(
      diagnostics.providerAdapterBinding.bookingProviderAdapterBindingId ===
        bookingCase.bookingCase.activeProviderAdapterBindingRef,
      "ACTIVE_PROVIDER_ADAPTER_BINDING_DRIFT",
      "BookingCase active provider adapter binding no longer matches the current capability tuple.",
    );
    return diagnostics;
  }

  async function buildCurrentTuple(slotSetSnapshotId: string, requestedAt: string) {
    const snapshotDocument = await slotSearchRepositories.getSlotSetSnapshot(slotSetSnapshotId);
    invariant(
      snapshotDocument,
      "SLOT_SET_SNAPSHOT_NOT_FOUND",
      `SlotSetSnapshot ${slotSetSnapshotId} was not found.`,
    );
    const snapshot = snapshotDocument.toSnapshot();
    const sessionDocument = await slotSearchRepositories.getSlotSearchSession(snapshot.searchSessionId);
    invariant(
      sessionDocument,
      "SLOT_SEARCH_SESSION_NOT_FOUND",
      `SlotSearchSession ${snapshot.searchSessionId} was not found.`,
    );
    const searchSession = sessionDocument.toSnapshot();
    const bookingCase = await requireBookingCase(searchSession.bookingCaseId);
    const searchPolicy = requireSearchableCase(bookingCase);
    const diagnostics = input?.bookingCapabilityApplication
      ? await input.bookingCapabilityApplication.queryCapabilityDiagnostics(
          buildCapabilityDiagnosticsQuery(bookingCase),
        )
      : null;

    return {
      bookingCaseId: searchSession.bookingCaseId,
      caseVersionRef:
        diagnostics?.resolution.governingObjectVersionRef ??
        `${snapshot.caseVersionRef}::stale_missing_current`,
      policyBundleHash:
        bookingCase.searchPolicy?.policyBundleHash ??
        `${snapshot.policyBundleHash}::stale_missing_policy`,
      providerAdapterBindingHash:
        diagnostics?.resolution.providerAdapterBindingHash ??
        `${snapshot.providerAdapterBindingHash}::stale_missing_binding`,
      capabilityTupleHash:
        diagnostics?.resolution.capabilityTupleHash ??
        `${snapshot.capabilityTupleHash}::stale_missing_capability`,
      now: requireRef(requestedAt, "requestedAt"),
    };
  }

  async function buildExecuteInput(command: StartSlotSearchInput): Promise<SlotSearchExecutionInput> {
    const bookingCase = await requireBookingCase(requireRef(command.bookingCaseId, "bookingCaseId"));
    const searchPolicy = requireSearchableCase(bookingCase);
    const capability = await requireCurrentCapability(bookingCase);
    return {
      bookingCaseId: bookingCase.bookingCase.bookingCaseId,
      caseVersionRef: capability.resolution.governingObjectVersionRef,
      searchPolicy,
      capabilityResolution: capability.resolution,
      providerAdapterBinding: capability.providerAdapterBinding,
      displayTimeZone: requireRef(command.displayTimeZone, "displayTimeZone"),
      supplierWindows: command.supplierWindows,
      commandActionRecordRef: requireRef(command.commandActionRecordRef, "commandActionRecordRef"),
      commandSettlementRecordRef: requireRef(
        command.commandSettlementRecordRef,
        "commandSettlementRecordRef",
      ),
      routeIntentBindingRef: capability.resolution.routeTuple.routeIntentBindingRef,
      subjectRef: requireRef(command.subjectRef, "subjectRef"),
      occurredAt: requireRef(command.occurredAt, "occurredAt"),
      payloadArtifactRef: command.payloadArtifactRef ?? null,
      edgeCorrelationId: command.edgeCorrelationId ?? null,
      expiresInSeconds: command.expiresInSeconds,
    };
  }

  return {
    slotSearchService,
    slotSearchRepositories,

    async startSlotSearch(command) {
      return slotSearchService.executeSlotSearch(await buildExecuteInput(command));
    },

    async refreshSlotSearch(command) {
      return slotSearchService.executeSlotSearch(await buildExecuteInput(command));
    },

    async queryCurrentSlotSearch({ bookingCaseId }) {
      const bookingCase = await requireBookingCase(requireRef(bookingCaseId, "bookingCaseId"));
      const searchPolicy = requireSearchableCase(bookingCase);
      return slotSearchService.queryCurrentSlotSearch(
        bookingCase.bookingCase.bookingCaseId,
        translateSelectionAudience(searchPolicy),
      );
    },

    async fetchSlotSnapshotPage(command) {
      const currentTuple = await buildCurrentTuple(
        requireRef(command.slotSetSnapshotId, "slotSetSnapshotId"),
        requireRef(command.requestedAt, "requestedAt"),
      );
      return slotSearchService.fetchSnapshotPage(
        command.slotSetSnapshotId,
        command.pageNumber,
        currentTuple,
      );
    },

    async fetchSlotSnapshotDayBucket(command) {
      const currentTuple = await buildCurrentTuple(
        requireRef(command.slotSetSnapshotId, "slotSetSnapshotId"),
        requireRef(command.requestedAt, "requestedAt"),
      );
      return slotSearchService.fetchDayBucket(
        command.slotSetSnapshotId,
        command.localDayKey,
        currentTuple,
      );
    },

    async invalidateSlotSnapshot(command) {
      return slotSearchService.invalidateSnapshot(
        requireRef(command.slotSetSnapshotId, "slotSetSnapshotId"),
        command.reasonCodes,
        requireRef(command.invalidatedAt, "invalidatedAt"),
      );
    },
  };
}
