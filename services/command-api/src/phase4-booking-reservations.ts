import { createHash } from "node:crypto";
import {
  createDeterministicBackboneIdGenerator,
  type BackboneIdGenerator,
  type CompareAndSetWriteOptions,
} from "@vecells/domain-kernel";
import { makeFoundationEvent, type FoundationEventEnvelope } from "@vecells/event-contracts";
import type {
  BookingCapabilityResolutionSnapshot,
  BookingProviderAdapterBindingSnapshot,
  BookingSelectionAudience,
  CanonicalSlotIdentitySnapshot,
  NormalizedSlotSnapshot,
  OfferSessionSnapshot,
} from "@vecells/domain-booking";
import {
  buildReservationVersionRef,
  createReservationConfirmationAuthorityService,
  createReservationQueueControlStore,
  createReservationQueueServices,
  type CapacityCommitMode,
  type CapacityReservationSnapshot,
  type CapacityReservationState,
  type ReservationFenceRecordSnapshot,
  type ReservationQueueControlDependencies,
  type ReservationTruthProjectionSnapshot,
} from "@vecells/domain-identity-access";
import type { Phase4BookingCapabilityApplication } from "./phase4-booking-capability";
import { createPhase4BookingCapabilityApplication } from "./phase4-booking-capability";
import type { Phase4BookingCaseApplication } from "./phase4-booking-case";
import { createPhase4BookingCaseApplication } from "./phase4-booking-case";
import type { Phase4CapacityRankApplication } from "./phase4-capacity-rank-offers";
import { createPhase4CapacityRankApplication } from "./phase4-capacity-rank-offers";
import type { Phase4SlotSearchApplication } from "./phase4-slot-search";
import { createPhase4SlotSearchApplication } from "./phase4-slot-search";

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

function optionalRef(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function ensureIsoTimestamp(value: string, field: string): string {
  const normalized = requireRef(value, field);
  invariant(
    !Number.isNaN(Date.parse(normalized)),
    `INVALID_${field.toUpperCase()}_TIMESTAMP`,
    `${field} must be a valid ISO-8601 timestamp.`,
  );
  return normalized;
}

function ensurePositiveInteger(value: number, field: string): number {
  invariant(
    Number.isInteger(value) && value > 0,
    `INVALID_${field.toUpperCase()}`,
    `${field} must be a positive integer.`,
  );
  return value;
}

function uniqueSortedRefs(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) =>
    left.localeCompare(right),
  );
  return `{${entries
    .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
    .join(",")}}`;
}

function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function sha256(value: unknown): string {
  return sha256Hex(stableStringify(value));
}

function normalizeRecordId(prefix: string, value: string): string {
  return `${prefix}_${value}`;
}

function addSeconds(timestamp: string, seconds: number): string {
  return new Date(Date.parse(timestamp) + seconds * 1000).toISOString();
}

function saveWithCas<T extends { version: number }>(
  map: Map<string, T>,
  key: string,
  row: T,
  options?: CompareAndSetWriteOptions,
): void {
  const current = map.get(key);
  if (options?.expectedVersion !== undefined) {
    invariant(
      current?.version === options.expectedVersion,
      "OPTIMISTIC_CONCURRENCY_MISMATCH",
      `Expected version ${options.expectedVersion} for ${key}, received ${current?.version ?? "missing"}.`,
    );
  } else if (current) {
    invariant(
      current.version < row.version,
      "NON_MONOTONE_SAVE",
      `Persisted version for ${key} must increase monotonically.`,
    );
  }
  map.set(key, structuredClone(row));
}

type BookingReservationScopeFamily = "offer_session" | "waitlist_offer";
type BookingReservationAction =
  | "soft_select"
  | "acquire_hold"
  | "refresh_hold"
  | "mark_pending_confirmation"
  | "mark_confirmed"
  | "release"
  | "expire"
  | "dispute"
  | "expire_sweep";

type BookingReservationScopeState =
  | "active"
  | "released"
  | "expired"
  | "disputed";

interface BookingReservationScopeSnapshot {
  bookingReservationScopeId: string;
  scopeFamily: BookingReservationScopeFamily;
  scopeObjectRef: string;
  bookingCaseId: string | null;
  sourceDomain: string;
  holderRef: string;
  selectedAnchorRef: string;
  selectedNormalizedSlotRef: string;
  selectedCanonicalSlotIdentityRef: string;
  sourceSlotSetSnapshotRef: string | null;
  providerAdapterBindingRef: string;
  providerAdapterBindingHash: string;
  capabilityResolutionRef: string;
  capabilityTupleHash: string;
  authoritativeReadAndConfirmationPolicyRef: string;
  reservationSemantics: CapacityCommitMode;
  selectionToken: string | null;
  selectionProofHash: string | null;
  governingObjectVersionRef: string | null;
  scopeTupleHash: string;
  projectionFreshnessEnvelopeRef: string;
  canonicalReservationKey: string;
  capacityIdentityRef: string;
  currentReservationRef: string;
  currentReservationTruthProjectionRef: string;
  currentFenceRef: string;
  currentReservationVersionRef: string;
  currentReservationState: CapacityReservationState;
  currentCommitMode: CapacityCommitMode;
  currentTruthBasisHash: string;
  currentTruthState: string;
  currentDisplayExclusivityState: string;
  scopeState: BookingReservationScopeState;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

interface BookingReservationJournalEntrySnapshot {
  bookingReservationJournalEntryId: string;
  bookingReservationScopeRef: string;
  scopeFamily: BookingReservationScopeFamily;
  scopeObjectRef: string;
  action: BookingReservationAction;
  previousReservationState: CapacityReservationState | "none";
  nextReservationState: CapacityReservationState;
  previousTruthState: string | "none";
  nextTruthState: string;
  reservationRef: string;
  reservationTruthProjectionRef: string;
  reservationFenceRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  subjectRef: string;
  payloadArtifactRef: string;
  edgeCorrelationId: string;
  occurredAt: string;
  version: number;
}

interface BookingReservationReplayRecord {
  scopeRef: string | null;
  journalEntryRef: string | null;
  reservationRef: string | null;
  projectionRef: string | null;
  fenceRef: string | null;
  conflictBlocked: boolean;
  blockingFenceRef: string | null;
}

interface BookingReservationScopeDocument {
  toSnapshot(): BookingReservationScopeSnapshot;
}

interface BookingReservationJournalEntryDocument {
  toSnapshot(): BookingReservationJournalEntrySnapshot;
}

class SnapshotDocument<T> {
  constructor(private readonly snapshot: T) {}

  toSnapshot(): T {
    return structuredClone(this.snapshot);
  }
}

interface Phase4BookingReservationRepositories {
  getBookingReservationScope(
    bookingReservationScopeId: string,
  ): Promise<BookingReservationScopeDocument | null>;
  getCurrentBookingReservationScopeRef(
    scopeFamily: BookingReservationScopeFamily,
    scopeObjectRef: string,
  ): Promise<string | null>;
  listBookingReservationScopes(): Promise<readonly BookingReservationScopeDocument[]>;
  saveBookingReservationScope(
    snapshot: BookingReservationScopeSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  setCurrentBookingReservationScopeRef(
    scopeFamily: BookingReservationScopeFamily,
    scopeObjectRef: string,
    bookingReservationScopeId: string,
  ): Promise<void>;
  appendReservationJournalEntry(
    snapshot: BookingReservationJournalEntrySnapshot,
  ): Promise<void>;
  listReservationJournalEntries(
    bookingReservationScopeId: string,
  ): Promise<readonly BookingReservationJournalEntryDocument[]>;
  getReservationJournalEntry(
    bookingReservationJournalEntryId: string,
  ): Promise<BookingReservationJournalEntryDocument | null>;
  getReservationReplay(replayKey: string): Promise<BookingReservationReplayRecord | null>;
  saveReservationReplay(replayKey: string, record: BookingReservationReplayRecord): Promise<void>;
}

function scopeKey(scopeFamily: BookingReservationScopeFamily, scopeObjectRef: string): string {
  return `${scopeFamily}::${scopeObjectRef}`;
}

function createPhase4BookingReservationStore(): Phase4BookingReservationRepositories {
  const scopes = new Map<string, BookingReservationScopeSnapshot>();
  const currentScopeRefs = new Map<string, string>();
  const journal = new Map<string, BookingReservationJournalEntrySnapshot[]>();
  const journalById = new Map<string, BookingReservationJournalEntrySnapshot>();
  const replays = new Map<string, BookingReservationReplayRecord>();

  return {
    async getBookingReservationScope(bookingReservationScopeId) {
      const row = scopes.get(bookingReservationScopeId);
      return row ? new SnapshotDocument(row) : null;
    },
    async getCurrentBookingReservationScopeRef(scopeFamily, scopeObjectRef) {
      return currentScopeRefs.get(scopeKey(scopeFamily, scopeObjectRef)) ?? null;
    },
    async listBookingReservationScopes() {
      return [...scopes.values()].map((row) => new SnapshotDocument(row));
    },
    async saveBookingReservationScope(snapshot, options) {
      saveWithCas(scopes, snapshot.bookingReservationScopeId, snapshot, options);
    },
    async setCurrentBookingReservationScopeRef(scopeFamily, scopeObjectRef, bookingReservationScopeId) {
      currentScopeRefs.set(scopeKey(scopeFamily, scopeObjectRef), bookingReservationScopeId);
    },
    async appendReservationJournalEntry(snapshot) {
      const entries = journal.get(snapshot.bookingReservationScopeRef) ?? [];
      const nextVersion = (entries.at(-1)?.version ?? 0) + 1;
      invariant(
        snapshot.version === nextVersion,
        "NON_MONOTONE_RESERVATION_JOURNAL",
        `Booking reservation journal for ${snapshot.bookingReservationScopeRef} must append version ${nextVersion}.`,
      );
      journal.set(snapshot.bookingReservationScopeRef, [...entries, structuredClone(snapshot)]);
      journalById.set(snapshot.bookingReservationJournalEntryId, structuredClone(snapshot));
    },
    async listReservationJournalEntries(bookingReservationScopeId) {
      return (journal.get(bookingReservationScopeId) ?? []).map((row) => new SnapshotDocument(row));
    },
    async getReservationJournalEntry(bookingReservationJournalEntryId) {
      const row = journalById.get(bookingReservationJournalEntryId);
      return row ? new SnapshotDocument(row) : null;
    },
    async getReservationReplay(replayKey) {
      return structuredClone(replays.get(replayKey) ?? null);
    },
    async saveReservationReplay(replayKey, record) {
      replays.set(replayKey, structuredClone(record));
    },
  };
}

interface WaitlistReservationDescriptorInput {
  bookingCaseId: string | null;
  waitlistOfferId: string;
  supplierRef: string;
  capacityUnitRef: string;
  scheduleOwnerRef: string;
  inventoryLineageRef: string;
  slotStartAtEpoch: number;
  slotEndAtEpoch: number;
  locationRef: string;
  practitionerRef: string;
  serviceRef: string;
  modality: string;
  selectedAnchorRef: string;
  selectedNormalizedSlotRef: string;
  selectedCanonicalSlotIdentityRef: string;
  providerAdapterBindingRef: string;
  providerAdapterBindingHash: string;
  capabilityResolutionRef: string;
  capabilityTupleHash: string;
  authoritativeReadAndConfirmationPolicyRef: string;
  reservationSemantics: CapacityCommitMode;
  sourceSlotSetSnapshotRef?: string | null;
  sourceDomain?: string | null;
  holderRef?: string | null;
  selectionToken?: string | null;
  selectionProofHash?: string | null;
  governingObjectVersionRef?: string | null;
}

interface ReservationScopeContext {
  scopeFamily: BookingReservationScopeFamily;
  scopeObjectRef: string;
  bookingCaseId: string | null;
  sourceDomain: string;
  holderRef: string;
  selectedAnchorRef: string;
  selectedNormalizedSlotRef: string;
  selectedCanonicalSlotIdentityRef: string;
  sourceSlotSetSnapshotRef: string | null;
  providerAdapterBindingRef: string;
  providerAdapterBindingHash: string;
  capabilityResolutionRef: string;
  capabilityTupleHash: string;
  authoritativeReadAndConfirmationPolicyRef: string;
  reservationSemantics: CapacityCommitMode;
  selectionToken: string | null;
  selectionProofHash: string | null;
  governingObjectVersionRef: string | null;
  scopeTupleHash: string;
  projectionFreshnessEnvelopeRef: string;
  canonicalReservationKey: string;
  capacityIdentityRef: string;
}

function compileReservationIdentity(input: {
  supplierRef: string;
  capacityUnitRef: string;
  scheduleOwnerRef: string;
  inventoryLineageRef: string;
  slotStartAtEpoch: number;
  slotEndAtEpoch: number;
  modality: string;
  locationRef: string;
  practitionerRef: string;
  serviceRef: string;
}) {
  const capacityIdentityHash = sha256({
    supplierRef: input.supplierRef,
    capacityUnitRef: input.capacityUnitRef,
    scheduleOwnerRef: input.scheduleOwnerRef,
    inventoryLineageRef: input.inventoryLineageRef,
    slotStartAtEpoch: input.slotStartAtEpoch,
    slotEndAtEpoch: input.slotEndAtEpoch,
    modality: input.modality,
    locationRef: input.locationRef,
    practitionerRef: input.practitionerRef,
    serviceRef: input.serviceRef,
  });
  const canonicalReservationKeyHash = sha256({
    supplierRef: input.supplierRef,
    capacityUnitRef: input.capacityUnitRef,
    scheduleOwnerRef: input.scheduleOwnerRef,
    inventoryLineageRef: input.inventoryLineageRef,
    slotStartAtEpoch: input.slotStartAtEpoch,
    slotEndAtEpoch: input.slotEndAtEpoch,
  });
  return {
    capacityIdentityRef: normalizeRecordId("capacity_identity", capacityIdentityHash),
    canonicalReservationKey: normalizeRecordId(
      "canonical_reservation_key",
      canonicalReservationKeyHash,
    ),
  };
}

function buildScopeTupleHash(input: {
  scopeFamily: BookingReservationScopeFamily;
  scopeObjectRef: string;
  bookingCaseId: string | null;
  selectedNormalizedSlotRef: string;
  selectedCanonicalSlotIdentityRef: string;
  sourceSlotSetSnapshotRef: string | null;
  providerAdapterBindingRef: string;
  providerAdapterBindingHash: string;
  capabilityResolutionRef: string;
  capabilityTupleHash: string;
  governingObjectVersionRef: string | null;
  selectionProofHash: string | null;
}): string {
  return sha256({
    scopeFamily: input.scopeFamily,
    scopeObjectRef: input.scopeObjectRef,
    bookingCaseId: input.bookingCaseId,
    selectedNormalizedSlotRef: input.selectedNormalizedSlotRef,
    selectedCanonicalSlotIdentityRef: input.selectedCanonicalSlotIdentityRef,
    sourceSlotSetSnapshotRef: input.sourceSlotSetSnapshotRef,
    providerAdapterBindingRef: input.providerAdapterBindingRef,
    providerAdapterBindingHash: input.providerAdapterBindingHash,
    capabilityResolutionRef: input.capabilityResolutionRef,
    capabilityTupleHash: input.capabilityTupleHash,
    governingObjectVersionRef: input.governingObjectVersionRef,
    selectionProofHash: input.selectionProofHash,
  });
}

function buildProjectionFreshnessEnvelopeRef(scopeTupleHash: string): string {
  return normalizeRecordId("booking_reservation_freshness", scopeTupleHash);
}

function translateSelectionAudience(
  audience: BookingSelectionAudience,
): BookingSelectionAudience {
  return audience === "patient" ? "patient" : "staff";
}

function deriveCommitModeFromSemantics(
  reservationSemantics: CapacityCommitMode,
  action: BookingReservationAction,
): CapacityCommitMode {
  if (action === "acquire_hold" || action === "refresh_hold") {
    return "exclusive_hold";
  }
  return reservationSemantics === "degraded_manual_pending"
    ? "degraded_manual_pending"
    : "truthful_nonexclusive";
}

function buildReplayKey(input: {
  action: BookingReservationAction;
  scopeFamily: BookingReservationScopeFamily;
  scopeObjectRef: string;
  commandActionRecordRef: string;
}): string {
  return sha256(input);
}

function defaultPayloadArtifactRef(input: {
  scopeFamily: BookingReservationScopeFamily;
  scopeObjectRef: string;
  commandActionRecordRef: string;
}): string {
  return `artifact://booking/reservation/${input.scopeFamily}/${input.scopeObjectRef}/${input.commandActionRecordRef}`;
}

function defaultEdgeCorrelationId(input: {
  scopeFamily: BookingReservationScopeFamily;
  scopeObjectRef: string;
  commandActionRecordRef: string;
}): string {
  return normalizeRecordId(
    "edge_booking_reservation",
    sha256({
      scopeFamily: input.scopeFamily,
      scopeObjectRef: input.scopeObjectRef,
      commandActionRecordRef: input.commandActionRecordRef,
    }),
  );
}

function capacityReservationEventName(
  state: CapacityReservationState,
  priorState: CapacityReservationState | "none",
): string {
  switch (state) {
    case "soft_selected":
      return "capacity.reservation.soft_selected";
    case "held":
      return "capacity.reservation.held";
    case "pending_confirmation":
      return "capacity.reservation.pending_confirmation";
    case "confirmed":
      return "capacity.reservation.confirmed";
    case "released":
      return "capacity.reservation.released";
    case "expired":
      return "capacity.reservation.expired";
    case "disputed":
      return "capacity.reservation.disputed";
    default:
      return "capacity.reservation.truth.updated";
  }
}

interface ReservationMutationAuditInput {
  scope: BookingReservationScopeSnapshot;
  reservation: CapacityReservationSnapshot;
  projection: ReservationTruthProjectionSnapshot;
  previousReservationState: CapacityReservationState | "none";
  previousTruthState: string | "none";
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  subjectRef: string;
  payloadArtifactRef: string;
  edgeCorrelationId: string;
  occurredAt: string;
}

function buildCapacityReservationEvent(
  eventType: string,
  input: ReservationMutationAuditInput,
): FoundationEventEnvelope<object> {
  return makeFoundationEvent(eventType, {
    governingRef: input.reservation.reservationId,
    governingVersionRef: input.scope.currentReservationVersionRef,
    previousState: input.previousReservationState,
    nextState: input.reservation.state,
    stateAxis: "capacity_reservation",
    selectedSlotRef: input.scope.selectedNormalizedSlotRef,
    commandActionRecordRef: input.commandActionRecordRef,
    commandSettlementRef: input.commandSettlementRecordRef,
    routeIntentRef: input.scope.scopeObjectRef,
    subjectRef: input.subjectRef,
    payloadArtifactRef: input.payloadArtifactRef,
    edgeCorrelationId: input.edgeCorrelationId,
    occurredAt: input.occurredAt,
  });
}

function buildCapacityReservationTruthUpdatedEvent(
  input: ReservationMutationAuditInput,
): FoundationEventEnvelope<object> {
  return makeFoundationEvent("capacity.reservation.truth.updated", {
    governingRef: input.projection.reservationTruthProjectionId,
    governingVersionRef: input.projection.reservationVersionRef,
    previousState: input.previousTruthState,
    nextState: input.projection.truthState,
    stateAxis: "capacity_reservation_truth",
    selectedSlotRef: input.scope.selectedNormalizedSlotRef,
    commandActionRecordRef: input.commandActionRecordRef,
    commandSettlementRef: input.commandSettlementRecordRef,
    routeIntentRef: input.scope.scopeObjectRef,
    subjectRef: input.subjectRef,
    payloadArtifactRef: input.payloadArtifactRef,
    edgeCorrelationId: input.edgeCorrelationId,
    occurredAt: input.occurredAt,
  });
}

export const PHASE4_BOOKING_RESERVATION_SERVICE_NAME =
  "Phase4BookingReservationAuthorityApplication";
export const PHASE4_BOOKING_RESERVATION_SCHEMA_VERSION =
  "286.phase4.reservation-authority-and-truth-projection.v1";

export const phase4BookingReservationRoutes = [
  {
    routeId: "booking_reservation_truth_current",
    method: "GET",
    path: "/v1/bookings/reservations/scopes/{scopeFamily}/{scopeObjectRef}",
    contractFamily: "BookingReservationTruthContract",
    purpose:
      "Resolve the authoritative CapacityReservation, ReservationTruthProjection, fence token, and append-only audit journal for one offer-session or waitlist scope.",
    bodyRequired: false,
    idempotencyRequired: false,
  },
  {
    routeId: "booking_reservation_soft_select",
    method: "POST",
    path: "/internal/v1/bookings/reservations/scopes/{scopeFamily}/{scopeObjectRef}:soft-select",
    contractFamily: "BookingReservationSoftSelectCommandContract",
    purpose:
      "Create or refresh one bounded soft_selected CapacityReservation without implying exclusivity.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "booking_reservation_acquire_hold",
    method: "POST",
    path: "/internal/v1/bookings/reservations/scopes/{scopeFamily}/{scopeObjectRef}:acquire-hold",
    contractFamily: "BookingReservationAcquireHoldCommandContract",
    purpose:
      "Acquire or refresh one real exclusive hold only when the current binding allows reservationSemantics = exclusive_hold.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "booking_reservation_mark_pending_confirmation",
    method: "POST",
    path: "/internal/v1/bookings/reservations/scopes/{scopeFamily}/{scopeObjectRef}:mark-pending-confirmation",
    contractFamily: "BookingReservationPendingConfirmationCommandContract",
    purpose:
      "Advance one active reservation into pending_confirmation on the same fenced scope and truth basis.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "booking_reservation_mark_confirmed",
    method: "POST",
    path: "/internal/v1/bookings/reservations/scopes/{scopeFamily}/{scopeObjectRef}:mark-confirmed",
    contractFamily: "BookingReservationConfirmedCommandContract",
    purpose:
      "Mark one reservation confirmed on the same fenced scope and reservation version.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "booking_reservation_release",
    method: "POST",
    path: "/internal/v1/bookings/reservations/scopes/{scopeFamily}/{scopeObjectRef}:release",
    contractFamily: "BookingReservationReleaseCommandContract",
    purpose:
      "Release one active reservation and immediately degrade ReservationTruthProjection authority.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "booking_reservation_expire",
    method: "POST",
    path: "/internal/v1/bookings/reservations/scopes/{scopeFamily}/{scopeObjectRef}:expire",
    contractFamily: "BookingReservationExpireCommandContract",
    purpose:
      "Expire one active reservation and immediately degrade ReservationTruthProjection authority.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "booking_reservation_mark_disputed",
    method: "POST",
    path: "/internal/v1/bookings/reservations/scopes/{scopeFamily}/{scopeObjectRef}:mark-disputed",
    contractFamily: "BookingReservationDisputedCommandContract",
    purpose:
      "Mark one reservation disputed on the same fenced scope when provider truth or external evidence conflicts.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "booking_reservation_expiry_sweep",
    method: "POST",
    path: "/internal/v1/bookings/reservations:expire-stale",
    contractFamily: "BookingReservationExpirySweepCommandContract",
    purpose:
      "Sweep active soft-selected or held reservations whose bounded expiry has elapsed and refresh truth projections safely.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
] as const;

export const phase4BookingReservationPersistenceTables = [
  "capacity_reservations",
  "reservation_truth_projections",
  "reservation_fence_records",
  "phase4_booking_reservation_scopes",
  "phase4_booking_reservation_transition_journal",
  "phase4_booking_reservation_replays",
] as const;

export const phase4BookingReservationMigrationPlanRefs = [
  "services/command-api/migrations/074_capacity_reservation_and_external_confirmation_gate_models.sql",
  "services/command-api/migrations/081_reservation_authority_and_queue_ranking_coordinator.sql",
  "services/command-api/migrations/135_phase4_booking_reservation_authority.sql",
] as const;

interface BookingReservationMutationBaseInput {
  scopeFamily: BookingReservationScopeFamily;
  scopeObjectRef: string;
  actorRef: string;
  subjectRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  occurredAt: string;
  payloadArtifactRef?: string | null;
  edgeCorrelationId?: string | null;
  expectedReservationVersionRef?: string | null;
  fenceToken?: string | null;
}

interface CreateOrRefreshSoftSelectionInput extends BookingReservationMutationBaseInput {
  waitlistContext?: WaitlistReservationDescriptorInput | null;
  ttlSeconds?: number;
}

interface AcquireOrRefreshHoldInput extends BookingReservationMutationBaseInput {
  waitlistContext?: WaitlistReservationDescriptorInput | null;
  holdTtlSeconds?: number;
}

interface PendingConfirmationInput extends BookingReservationMutationBaseInput {}
interface ConfirmReservationInput extends BookingReservationMutationBaseInput {}
interface ReleaseReservationInput extends BookingReservationMutationBaseInput {
  terminalReasonCode: string;
}
interface ExpireReservationInput extends BookingReservationMutationBaseInput {
  terminalReasonCode: string;
}
interface DisputeReservationInput extends BookingReservationMutationBaseInput {
  terminalReasonCode: string;
}

interface QueryReservationTruthInput {
  scopeFamily: BookingReservationScopeFamily;
  scopeObjectRef: string;
  requestedAt: string;
}

interface SweepExpiredReservationsInput {
  asOf: string;
  actorRef: string;
  subjectRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
}

export interface BookingReservationTruthResult {
  scope: BookingReservationScopeSnapshot;
  journal: readonly BookingReservationJournalEntrySnapshot[];
  reservation: CapacityReservationSnapshot;
  projection: ReservationTruthProjectionSnapshot;
  fence: ReservationFenceRecordSnapshot;
  replayed: boolean;
  conflictBlocked: boolean;
  blockingFence: ReservationFenceRecordSnapshot | null;
  emittedEvents: readonly FoundationEventEnvelope<object>[];
}

export interface BookingReservationExpirySweepResult {
  expiredScopeRefs: readonly string[];
  results: readonly BookingReservationTruthResult[];
}

function bookingCapabilityDiagnosticsQuery(input: {
  bookingCaseId: string;
  selectionAudience: BookingSelectionAudience;
}) {
  return {
    bookingCaseId: input.bookingCaseId,
    governingObjectDescriptorRef: "BookingCase",
    governingObjectRef: input.bookingCaseId,
    selectionAudience: translateSelectionAudience(input.selectionAudience),
    requestedActionScope: "search_slots" as const,
  };
}

export interface Phase4BookingReservationApplication {
  reservationRepositories: ReservationQueueControlDependencies;
  reservationScopeRepositories: Phase4BookingReservationRepositories;
  createOrRefreshSoftSelection(input: CreateOrRefreshSoftSelectionInput): Promise<BookingReservationTruthResult>;
  acquireOrRefreshHold(input: AcquireOrRefreshHoldInput): Promise<BookingReservationTruthResult>;
  markPendingConfirmation(input: PendingConfirmationInput): Promise<BookingReservationTruthResult>;
  markConfirmed(input: ConfirmReservationInput): Promise<BookingReservationTruthResult>;
  releaseReservation(input: ReleaseReservationInput): Promise<BookingReservationTruthResult>;
  expireReservation(input: ExpireReservationInput): Promise<BookingReservationTruthResult>;
  markDisputed(input: DisputeReservationInput): Promise<BookingReservationTruthResult>;
  queryReservationTruth(input: QueryReservationTruthInput): Promise<BookingReservationTruthResult | null>;
  sweepExpiredReservations(input: SweepExpiredReservationsInput): Promise<BookingReservationExpirySweepResult>;
}

export function createPhase4BookingReservationApplication(input?: {
  bookingCaseApplication?: Phase4BookingCaseApplication;
  bookingCapabilityApplication?: Phase4BookingCapabilityApplication;
  slotSearchApplication?: Phase4SlotSearchApplication;
  capacityRankApplication?: Phase4CapacityRankApplication;
  reservationRepositories?: ReservationQueueControlDependencies;
  scopeRepositories?: Phase4BookingReservationRepositories;
  idGenerator?: BackboneIdGenerator;
}): Phase4BookingReservationApplication {
  const bookingCaseApplication =
    input?.bookingCaseApplication ?? createPhase4BookingCaseApplication();
  const bookingCapabilityApplication =
    input?.bookingCapabilityApplication ??
    createPhase4BookingCapabilityApplication({
      bookingCaseApplication,
    });
  const slotSearchApplication =
    input?.slotSearchApplication ??
    createPhase4SlotSearchApplication({
      bookingCaseApplication,
      bookingCapabilityApplication,
    });
  const capacityRankApplication =
    input?.capacityRankApplication ??
    createPhase4CapacityRankApplication({
      bookingCaseApplication,
      bookingCapabilityApplication,
      slotSearchApplication,
    });
  const reservationRepositories =
    input?.reservationRepositories ?? createReservationQueueControlStore();
  const reservationServices = createReservationQueueServices({
    repositories: reservationRepositories,
    idGenerator:
      input?.idGenerator ??
      createDeterministicBackboneIdGenerator("phase4-booking-reservations"),
  });
  const scopeRepositories = input?.scopeRepositories ?? createPhase4BookingReservationStore();
  const reservationConfirmationAuthority = createReservationConfirmationAuthorityService(
    reservationRepositories,
    input?.idGenerator ??
      createDeterministicBackboneIdGenerator("phase4-booking-reservations-projection"),
  );
  const idGenerator =
    input?.idGenerator ??
    createDeterministicBackboneIdGenerator("phase4-booking-reservations-scope");

  async function getCurrentScope(
    scopeFamily: BookingReservationScopeFamily,
    scopeObjectRef: string,
  ): Promise<BookingReservationScopeSnapshot | null> {
    const currentRef = await scopeRepositories.getCurrentBookingReservationScopeRef(
      scopeFamily,
      scopeObjectRef,
    );
    if (!currentRef) {
      return null;
    }
    const scopeDocument = await scopeRepositories.getBookingReservationScope(currentRef);
    return scopeDocument?.toSnapshot() ?? null;
  }

  async function requireReservationArtifacts(scope: BookingReservationScopeSnapshot) {
    const reservation = await reservationRepositories.getCapacityReservation(scope.currentReservationRef);
    const projection = await reservationRepositories.getReservationTruthProjection(
      scope.currentReservationTruthProjectionRef,
    );
    const fence = await reservationRepositories.getReservationFenceRecord(scope.currentFenceRef);
    invariant(reservation, "RESERVATION_NOT_FOUND", `CapacityReservation ${scope.currentReservationRef} was not found.`);
    invariant(
      projection,
      "RESERVATION_PROJECTION_NOT_FOUND",
      `ReservationTruthProjection ${scope.currentReservationTruthProjectionRef} was not found.`,
    );
    invariant(fence, "RESERVATION_FENCE_NOT_FOUND", `ReservationFenceRecord ${scope.currentFenceRef} was not found.`);
    return {
      reservation: reservation.toSnapshot(),
      projection: projection.toSnapshot(),
      fence: fence.toSnapshot(),
    };
  }

  async function rebuildReplay(
    replayKey: string,
  ): Promise<BookingReservationTruthResult | null> {
    const replay = await scopeRepositories.getReservationReplay(replayKey);
    if (!replay) {
      return null;
    }
    if (replay.scopeRef === null || replay.reservationRef === null || replay.projectionRef === null || replay.fenceRef === null) {
      return null;
    }
    const scopeDocument = await scopeRepositories.getBookingReservationScope(replay.scopeRef);
    if (!scopeDocument) {
      return null;
    }
    const scope = scopeDocument.toSnapshot();
    const artifacts = await requireReservationArtifacts(scope);
    const journal = (await scopeRepositories.listReservationJournalEntries(scope.bookingReservationScopeId)).map(
      (entry) => entry.toSnapshot(),
    );
    const blockingFence =
      replay.blockingFenceRef === null
        ? null
        : (await reservationRepositories.getReservationFenceRecord(replay.blockingFenceRef))?.toSnapshot() ?? null;
    return {
      scope,
      journal,
      reservation: artifacts.reservation,
      projection: artifacts.projection,
      fence: artifacts.fence,
      replayed: true,
      conflictBlocked: replay.conflictBlocked,
      blockingFence,
      emittedEvents: [],
    };
  }

  async function resolveOfferScopeContext(
    offerSessionId: string,
    options?: { requireCurrent?: boolean },
  ): Promise<ReservationScopeContext> {
    const offerSessionDocument = await capacityRankApplication.capacityRankRepositories.getOfferSession(
      offerSessionId,
    );
    invariant(offerSessionDocument, "OFFER_SESSION_NOT_FOUND", `OfferSession ${offerSessionId} was not found.`);
    const offerSession = offerSessionDocument.toSnapshot();
    invariant(
      offerSession.selectedNormalizedSlotRef !== null &&
        offerSession.selectedCanonicalSlotIdentityRef !== null,
      "OFFER_SESSION_SELECTION_REQUIRED",
      "OfferSession must have one selected slot before reservation state can be created.",
    );
    const bookingCase = await bookingCaseApplication.queryBookingCase(offerSession.bookingCaseId);
    invariant(bookingCase, "BOOKING_CASE_NOT_FOUND", `BookingCase ${offerSession.bookingCaseId} was not found.`);
    if (options?.requireCurrent ?? true) {
      invariant(
        bookingCase.bookingCase.currentOfferSessionRef === offerSession.offerSessionId,
        "OFFER_SESSION_NOT_CURRENT",
        "Only the current OfferSession may mutate reservation truth.",
      );
    }
    const snapshotDocument =
      await slotSearchApplication.slotSearchRepositories.getSlotSetSnapshot(
        offerSession.slotSetSnapshotRef,
      );
    invariant(
      snapshotDocument !== null,
      "OFFER_SESSION_SLOT_SNAPSHOT_NOT_FOUND",
      `SlotSetSnapshot ${offerSession.slotSetSnapshotRef} was not found for OfferSession ${offerSession.offerSessionId}.`,
    );
    const snapshot = snapshotDocument.toSnapshot();
    const normalizedSlots = (
      await slotSearchApplication.slotSearchRepositories.listNormalizedSlots(
        snapshot.slotSetSnapshotId,
      )
    ).map((document) => document.toSnapshot());
    const selectedSlot = normalizedSlots.find(
      (slot) => slot.normalizedSlotId === offerSession.selectedNormalizedSlotRef,
    );
    invariant(
      selectedSlot,
      "SELECTED_NORMALIZED_SLOT_NOT_FOUND",
      `NormalizedSlot ${offerSession.selectedNormalizedSlotRef} was not found in the current snapshot.`,
    );
    const canonicalSlotIdentities = (
      await slotSearchApplication.slotSearchRepositories.listCanonicalSlotIdentities(
        snapshot.slotSetSnapshotId,
      )
    ).map((document) => document.toSnapshot());
    const canonicalIdentity = canonicalSlotIdentities.find(
      (identity) =>
        identity.canonicalSlotIdentityId === offerSession.selectedCanonicalSlotIdentityRef,
    );
    invariant(
      canonicalIdentity,
      "SELECTED_CANONICAL_SLOT_IDENTITY_NOT_FOUND",
      `CanonicalSlotIdentity ${offerSession.selectedCanonicalSlotIdentityRef} was not found in the current snapshot.`,
    );
    const diagnostics = await bookingCapabilityApplication.queryCapabilityDiagnostics(
      bookingCapabilityDiagnosticsQuery({
        bookingCaseId: offerSession.bookingCaseId,
        selectionAudience: offerSession.selectionAudience,
      }),
    );
    invariant(
      diagnostics?.isCurrentScope,
      "CURRENT_BOOKING_CAPABILITY_NOT_FOUND",
      "One current booking capability tuple is required before reservation truth can resolve.",
    );
    invariant(
      diagnostics.resolution.bookingCapabilityResolutionId === offerSession.capabilityResolutionRef,
      "OFFER_SESSION_CAPABILITY_DRIFT",
      "OfferSession capabilityResolutionRef no longer matches the current booking capability tuple.",
    );
    invariant(
      diagnostics.providerAdapterBinding.bookingProviderAdapterBindingId ===
        offerSession.providerAdapterBindingRef,
      "OFFER_SESSION_BINDING_DRIFT",
      "OfferSession provider adapter binding no longer matches the current booking binding.",
    );
    return compileScopeContextFromOffer({
      offerSession,
      bookingCaseVersionRef: diagnostics.resolution.governingObjectVersionRef,
      binding: diagnostics.providerAdapterBinding,
      resolution: diagnostics.resolution,
      canonicalIdentity,
      selectedSlot,
      sourceSlotSetSnapshotRef: snapshot.slotSetSnapshotId,
    });
  }

  function compileScopeContextFromOffer(input: {
    offerSession: OfferSessionSnapshot;
    binding: BookingProviderAdapterBindingSnapshot;
    resolution: BookingCapabilityResolutionSnapshot;
    canonicalIdentity: CanonicalSlotIdentitySnapshot;
    selectedSlot: NormalizedSlotSnapshot;
    sourceSlotSetSnapshotRef: string;
    bookingCaseVersionRef: string;
  }): ReservationScopeContext {
    const reservationIdentity = compileReservationIdentity({
      supplierRef: input.canonicalIdentity.supplierRef,
      capacityUnitRef: input.canonicalIdentity.capacityUnitRef,
      scheduleOwnerRef: input.canonicalIdentity.scheduleOwnerRef,
      inventoryLineageRef: input.canonicalIdentity.inventoryLineageRef,
      slotStartAtEpoch: input.canonicalIdentity.slotStartAtEpoch,
      slotEndAtEpoch: input.canonicalIdentity.slotEndAtEpoch,
      modality: input.canonicalIdentity.modality,
      locationRef: input.canonicalIdentity.locationRef,
      practitionerRef: input.canonicalIdentity.practitionerRef,
      serviceRef: input.canonicalIdentity.serviceRef,
    });
    const tupleHash = buildScopeTupleHash({
      scopeFamily: "offer_session",
      scopeObjectRef: input.offerSession.offerSessionId,
      bookingCaseId: input.offerSession.bookingCaseId,
      selectedNormalizedSlotRef: input.selectedSlot.normalizedSlotId,
      selectedCanonicalSlotIdentityRef: input.canonicalIdentity.canonicalSlotIdentityId,
      sourceSlotSetSnapshotRef: input.sourceSlotSetSnapshotRef,
      providerAdapterBindingRef: input.binding.bookingProviderAdapterBindingId,
      providerAdapterBindingHash: input.binding.bindingHash,
      capabilityResolutionRef: input.resolution.bookingCapabilityResolutionId,
      capabilityTupleHash: input.resolution.capabilityTupleHash,
      governingObjectVersionRef: input.bookingCaseVersionRef,
      selectionProofHash: input.offerSession.selectionProofHash,
    });
    return {
      scopeFamily: "offer_session",
      scopeObjectRef: input.offerSession.offerSessionId,
      bookingCaseId: input.offerSession.bookingCaseId,
      sourceDomain: "phase4_offer_session",
      holderRef: input.offerSession.offerSessionId,
      selectedAnchorRef: input.selectedSlot.normalizedSlotId,
      selectedNormalizedSlotRef: input.selectedSlot.normalizedSlotId,
      selectedCanonicalSlotIdentityRef: input.canonicalIdentity.canonicalSlotIdentityId,
      sourceSlotSetSnapshotRef: input.sourceSlotSetSnapshotRef,
      providerAdapterBindingRef: input.binding.bookingProviderAdapterBindingId,
      providerAdapterBindingHash: input.binding.bindingHash,
      capabilityResolutionRef: input.resolution.bookingCapabilityResolutionId,
      capabilityTupleHash: input.resolution.capabilityTupleHash,
      authoritativeReadAndConfirmationPolicyRef:
        input.binding.authoritativeReadAndConfirmationPolicyRef,
      reservationSemantics: input.binding.reservationSemantics,
      selectionToken: input.offerSession.selectionToken,
      selectionProofHash: input.offerSession.selectionProofHash,
      governingObjectVersionRef: input.bookingCaseVersionRef,
      scopeTupleHash: tupleHash,
      projectionFreshnessEnvelopeRef: buildProjectionFreshnessEnvelopeRef(tupleHash),
      canonicalReservationKey: reservationIdentity.canonicalReservationKey,
      capacityIdentityRef: reservationIdentity.capacityIdentityRef,
    };
  }

  function resolveWaitlistScopeContext(
    input: WaitlistReservationDescriptorInput,
  ): ReservationScopeContext {
    const reservationIdentity = compileReservationIdentity({
      supplierRef: input.supplierRef,
      capacityUnitRef: input.capacityUnitRef,
      scheduleOwnerRef: input.scheduleOwnerRef,
      inventoryLineageRef: input.inventoryLineageRef,
      slotStartAtEpoch: input.slotStartAtEpoch,
      slotEndAtEpoch: input.slotEndAtEpoch,
      modality: input.modality,
      locationRef: input.locationRef,
      practitionerRef: input.practitionerRef,
      serviceRef: input.serviceRef,
    });
    const tupleHash = buildScopeTupleHash({
      scopeFamily: "waitlist_offer",
      scopeObjectRef: input.waitlistOfferId,
      bookingCaseId: input.bookingCaseId,
      selectedNormalizedSlotRef: input.selectedNormalizedSlotRef,
      selectedCanonicalSlotIdentityRef: input.selectedCanonicalSlotIdentityRef,
      sourceSlotSetSnapshotRef: input.sourceSlotSetSnapshotRef ?? null,
      providerAdapterBindingRef: input.providerAdapterBindingRef,
      providerAdapterBindingHash: input.providerAdapterBindingHash,
      capabilityResolutionRef: input.capabilityResolutionRef,
      capabilityTupleHash: input.capabilityTupleHash,
      governingObjectVersionRef: input.governingObjectVersionRef ?? null,
      selectionProofHash: input.selectionProofHash ?? null,
    });
    return {
      scopeFamily: "waitlist_offer",
      scopeObjectRef: input.waitlistOfferId,
      bookingCaseId: input.bookingCaseId,
      sourceDomain: optionalRef(input.sourceDomain) ?? "phase4_waitlist_offer",
      holderRef: optionalRef(input.holderRef) ?? input.waitlistOfferId,
      selectedAnchorRef: input.selectedAnchorRef,
      selectedNormalizedSlotRef: input.selectedNormalizedSlotRef,
      selectedCanonicalSlotIdentityRef: input.selectedCanonicalSlotIdentityRef,
      sourceSlotSetSnapshotRef: input.sourceSlotSetSnapshotRef ?? null,
      providerAdapterBindingRef: input.providerAdapterBindingRef,
      providerAdapterBindingHash: input.providerAdapterBindingHash,
      capabilityResolutionRef: input.capabilityResolutionRef,
      capabilityTupleHash: input.capabilityTupleHash,
      authoritativeReadAndConfirmationPolicyRef:
        input.authoritativeReadAndConfirmationPolicyRef,
      reservationSemantics: input.reservationSemantics,
      selectionToken: input.selectionToken ?? null,
      selectionProofHash: input.selectionProofHash ?? null,
      governingObjectVersionRef: input.governingObjectVersionRef ?? null,
      scopeTupleHash: tupleHash,
      projectionFreshnessEnvelopeRef: buildProjectionFreshnessEnvelopeRef(tupleHash),
      canonicalReservationKey: reservationIdentity.canonicalReservationKey,
      capacityIdentityRef: reservationIdentity.capacityIdentityRef,
    };
  }

  function contextFromScope(scope: BookingReservationScopeSnapshot): ReservationScopeContext {
    return {
      scopeFamily: scope.scopeFamily,
      scopeObjectRef: scope.scopeObjectRef,
      bookingCaseId: scope.bookingCaseId,
      sourceDomain: scope.sourceDomain,
      holderRef: scope.holderRef,
      selectedAnchorRef: scope.selectedAnchorRef,
      selectedNormalizedSlotRef: scope.selectedNormalizedSlotRef,
      selectedCanonicalSlotIdentityRef: scope.selectedCanonicalSlotIdentityRef,
      sourceSlotSetSnapshotRef: scope.sourceSlotSetSnapshotRef,
      providerAdapterBindingRef: scope.providerAdapterBindingRef,
      providerAdapterBindingHash: scope.providerAdapterBindingHash,
      capabilityResolutionRef: scope.capabilityResolutionRef,
      capabilityTupleHash: scope.capabilityTupleHash,
      authoritativeReadAndConfirmationPolicyRef:
        scope.authoritativeReadAndConfirmationPolicyRef,
      reservationSemantics: scope.reservationSemantics,
      selectionToken: scope.selectionToken,
      selectionProofHash: scope.selectionProofHash,
      governingObjectVersionRef: scope.governingObjectVersionRef,
      scopeTupleHash: scope.scopeTupleHash,
      projectionFreshnessEnvelopeRef: scope.projectionFreshnessEnvelopeRef,
      canonicalReservationKey: scope.canonicalReservationKey,
      capacityIdentityRef: scope.capacityIdentityRef,
    };
  }

  async function resolveScopeContext(input: {
    scopeFamily: BookingReservationScopeFamily;
    scopeObjectRef: string;
    waitlistContext?: WaitlistReservationDescriptorInput | null;
    requireCurrent?: boolean;
  }): Promise<ReservationScopeContext> {
    if (input.scopeFamily === "offer_session") {
      return resolveOfferScopeContext(input.scopeObjectRef, {
        requireCurrent: input.requireCurrent,
      });
    }
    invariant(
      input.waitlistContext !== null && input.waitlistContext !== undefined,
      "WAITLIST_CONTEXT_REQUIRED",
      "Waitlist reservation scope requires a typed waitlist context descriptor until the waitlist engine lands.",
    );
    return resolveWaitlistScopeContext(input.waitlistContext);
  }

  async function buildScopeSnapshot(input: {
    priorScope: BookingReservationScopeSnapshot | null;
    context: ReservationScopeContext;
    reservation: CapacityReservationSnapshot;
    projection: ReservationTruthProjectionSnapshot;
    fence: ReservationFenceRecordSnapshot;
    occurredAt: string;
  }): Promise<BookingReservationScopeSnapshot> {
    const scopeId =
      input.priorScope?.bookingReservationScopeId ??
      normalizeRecordId(
        "booking_reservation_scope",
        sha256({
          scopeFamily: input.context.scopeFamily,
          scopeObjectRef: input.context.scopeObjectRef,
        }),
      );
    return {
      bookingReservationScopeId: scopeId,
      scopeFamily: input.context.scopeFamily,
      scopeObjectRef: input.context.scopeObjectRef,
      bookingCaseId: input.context.bookingCaseId,
      sourceDomain: input.context.sourceDomain,
      holderRef: input.context.holderRef,
      selectedAnchorRef: input.context.selectedAnchorRef,
      selectedNormalizedSlotRef: input.context.selectedNormalizedSlotRef,
      selectedCanonicalSlotIdentityRef: input.context.selectedCanonicalSlotIdentityRef,
      sourceSlotSetSnapshotRef: input.context.sourceSlotSetSnapshotRef,
      providerAdapterBindingRef: input.context.providerAdapterBindingRef,
      providerAdapterBindingHash: input.context.providerAdapterBindingHash,
      capabilityResolutionRef: input.context.capabilityResolutionRef,
      capabilityTupleHash: input.context.capabilityTupleHash,
      authoritativeReadAndConfirmationPolicyRef:
        input.context.authoritativeReadAndConfirmationPolicyRef,
      reservationSemantics: input.context.reservationSemantics,
      selectionToken: input.context.selectionToken,
      selectionProofHash: input.context.selectionProofHash,
      governingObjectVersionRef: input.context.governingObjectVersionRef,
      scopeTupleHash: input.context.scopeTupleHash,
      projectionFreshnessEnvelopeRef: input.context.projectionFreshnessEnvelopeRef,
      canonicalReservationKey: input.context.canonicalReservationKey,
      capacityIdentityRef: input.context.capacityIdentityRef,
      currentReservationRef: input.reservation.reservationId,
      currentReservationTruthProjectionRef: input.projection.reservationTruthProjectionId,
      currentFenceRef: input.fence.reservationFenceRecordId,
      currentReservationVersionRef: buildReservationVersionRef({
        reservationId: input.reservation.reservationId,
        reservationVersion: input.reservation.reservationVersion,
      }),
      currentReservationState: input.reservation.state,
      currentCommitMode: input.reservation.commitMode,
      currentTruthBasisHash: input.reservation.truthBasisHash,
      currentTruthState: input.projection.truthState,
      currentDisplayExclusivityState: input.projection.displayExclusivityState,
      scopeState:
        input.reservation.state === "released"
          ? "released"
          : input.reservation.state === "expired"
            ? "expired"
            : input.reservation.state === "disputed"
              ? "disputed"
              : "active",
      expiresAt: input.reservation.expiresAt,
      createdAt: input.priorScope?.createdAt ?? input.occurredAt,
      updatedAt: input.occurredAt,
      version: (input.priorScope?.version ?? 0) + 1,
    };
  }

  async function appendJournalEntry(input: {
    scope: BookingReservationScopeSnapshot;
    action: BookingReservationAction;
    previousReservationState: CapacityReservationState | "none";
    previousTruthState: string | "none";
    reservation: CapacityReservationSnapshot;
    projection: ReservationTruthProjectionSnapshot;
    fence: ReservationFenceRecordSnapshot;
    commandActionRecordRef: string;
    commandSettlementRecordRef: string;
    subjectRef: string;
    payloadArtifactRef: string;
    edgeCorrelationId: string;
    occurredAt: string;
  }): Promise<BookingReservationJournalEntrySnapshot> {
    const existingEntries = await scopeRepositories.listReservationJournalEntries(
      input.scope.bookingReservationScopeId,
    );
    const entry: BookingReservationJournalEntrySnapshot = {
      bookingReservationJournalEntryId: normalizeRecordId(
        "booking_reservation_journal",
        sha256({
          scopeRef: input.scope.bookingReservationScopeId,
          action: input.action,
          commandActionRecordRef: input.commandActionRecordRef,
        }),
      ),
      bookingReservationScopeRef: input.scope.bookingReservationScopeId,
      scopeFamily: input.scope.scopeFamily,
      scopeObjectRef: input.scope.scopeObjectRef,
      action: input.action,
      previousReservationState: input.previousReservationState,
      nextReservationState: input.reservation.state,
      previousTruthState: input.previousTruthState,
      nextTruthState: input.projection.truthState,
      reservationRef: input.reservation.reservationId,
      reservationTruthProjectionRef: input.projection.reservationTruthProjectionId,
      reservationFenceRef: input.fence.reservationFenceRecordId,
      commandActionRecordRef: input.commandActionRecordRef,
      commandSettlementRecordRef: input.commandSettlementRecordRef,
      subjectRef: input.subjectRef,
      payloadArtifactRef: input.payloadArtifactRef,
      edgeCorrelationId: input.edgeCorrelationId,
      occurredAt: input.occurredAt,
      version: existingEntries.length + 1,
    };
    await scopeRepositories.appendReservationJournalEntry(entry);
    return entry;
  }

  async function persistSuccessfulMutation(input: {
    priorScope: BookingReservationScopeSnapshot | null;
    context: ReservationScopeContext;
    action: BookingReservationAction;
    reservation: CapacityReservationSnapshot;
    projection: ReservationTruthProjectionSnapshot;
    fence: ReservationFenceRecordSnapshot;
    commandActionRecordRef: string;
    commandSettlementRecordRef: string;
    subjectRef: string;
    payloadArtifactRef: string;
    edgeCorrelationId: string;
    occurredAt: string;
    replayKey: string;
  }): Promise<BookingReservationTruthResult> {
    const scope = await buildScopeSnapshot({
      priorScope: input.priorScope,
      context: input.context,
      reservation: input.reservation,
      projection: input.projection,
      fence: input.fence,
      occurredAt: input.occurredAt,
    });
    await scopeRepositories.saveBookingReservationScope(scope, {
      expectedVersion: input.priorScope?.version,
    });
    await scopeRepositories.setCurrentBookingReservationScopeRef(
      scope.scopeFamily,
      scope.scopeObjectRef,
      scope.bookingReservationScopeId,
    );
    const journalEntry = await appendJournalEntry({
      scope,
      action: input.action,
      previousReservationState: input.priorScope?.currentReservationState ?? "none",
      previousTruthState: input.priorScope?.currentTruthState ?? "none",
      reservation: input.reservation,
      projection: input.projection,
      fence: input.fence,
      commandActionRecordRef: input.commandActionRecordRef,
      commandSettlementRecordRef: input.commandSettlementRecordRef,
      subjectRef: input.subjectRef,
      payloadArtifactRef: input.payloadArtifactRef,
      edgeCorrelationId: input.edgeCorrelationId,
      occurredAt: input.occurredAt,
    });
    await scopeRepositories.saveReservationReplay(input.replayKey, {
      scopeRef: scope.bookingReservationScopeId,
      journalEntryRef: journalEntry.bookingReservationJournalEntryId,
      reservationRef: input.reservation.reservationId,
      projectionRef: input.projection.reservationTruthProjectionId,
      fenceRef: input.fence.reservationFenceRecordId,
      conflictBlocked: false,
      blockingFenceRef: null,
    });
    const mutationAuditInput: ReservationMutationAuditInput = {
      scope,
      reservation: input.reservation,
      projection: input.projection,
      previousReservationState: input.priorScope?.currentReservationState ?? "none",
      previousTruthState: input.priorScope?.currentTruthState ?? "none",
      commandActionRecordRef: input.commandActionRecordRef,
      commandSettlementRecordRef: input.commandSettlementRecordRef,
      subjectRef: input.subjectRef,
      payloadArtifactRef: input.payloadArtifactRef,
      edgeCorrelationId: input.edgeCorrelationId,
      occurredAt: input.occurredAt,
    };
    const emittedEvents = [
      ...(input.priorScope === null
        ? [buildCapacityReservationEvent("capacity.reservation.created", mutationAuditInput)]
        : []),
      buildCapacityReservationEvent(
        capacityReservationEventName(
          input.reservation.state,
          input.priorScope?.currentReservationState ?? "none",
        ),
        mutationAuditInput,
      ),
      buildCapacityReservationTruthUpdatedEvent(mutationAuditInput),
    ];
    return {
      scope,
      journal: (await scopeRepositories.listReservationJournalEntries(scope.bookingReservationScopeId)).map(
        (entry) => entry.toSnapshot(),
      ),
      reservation: input.reservation,
      projection: input.projection,
      fence: input.fence,
      replayed: false,
      conflictBlocked: false,
      blockingFence: null,
      emittedEvents,
    };
  }

  async function handleConflictReplay(input: {
    replayKey: string;
    blockingFenceRef: string | null;
  }): Promise<void> {
    await scopeRepositories.saveReservationReplay(input.replayKey, {
      scopeRef: null,
      journalEntryRef: null,
      reservationRef: null,
      projectionRef: null,
      fenceRef: null,
      conflictBlocked: true,
      blockingFenceRef: input.blockingFenceRef,
    });
  }

  async function mutateFromClaim(input: {
    action: BookingReservationAction;
    command: BookingReservationMutationBaseInput;
    context: ReservationScopeContext;
    requestedState: Extract<
      CapacityReservationState,
      "soft_selected" | "held" | "pending_confirmation" | "confirmed"
    >;
    expiresAt: string | null;
    revalidatedAt?: string | null;
    confirmedAt?: string | null;
  }): Promise<BookingReservationTruthResult> {
    const replayKey = buildReplayKey({
      action: input.action,
      scopeFamily: input.context.scopeFamily,
      scopeObjectRef: input.context.scopeObjectRef,
      commandActionRecordRef: input.command.commandActionRecordRef,
    });
    const replay = await rebuildReplay(replayKey);
    if (replay) {
      return replay;
    }
    const priorScope = await getCurrentScope(
      input.context.scopeFamily,
      input.context.scopeObjectRef,
    );
    const payloadArtifactRef =
      optionalRef(input.command.payloadArtifactRef) ??
      defaultPayloadArtifactRef({
        scopeFamily: input.context.scopeFamily,
        scopeObjectRef: input.context.scopeObjectRef,
        commandActionRecordRef: input.command.commandActionRecordRef,
      });
    const edgeCorrelationId =
      optionalRef(input.command.edgeCorrelationId) ??
      defaultEdgeCorrelationId({
        scopeFamily: input.context.scopeFamily,
        scopeObjectRef: input.context.scopeObjectRef,
        commandActionRecordRef: input.command.commandActionRecordRef,
      });

    let authorityResult:
      | Awaited<ReturnType<typeof reservationServices.reservationAuthority.claimReservation>>
      | Awaited<ReturnType<typeof reservationServices.reservationAuthority.transitionReservation>>;

    if (priorScope === null) {
      authorityResult = await reservationServices.reservationAuthority.claimReservation({
        capacityIdentityRef: input.context.capacityIdentityRef,
        canonicalReservationKey: input.context.canonicalReservationKey,
        sourceDomain: input.context.sourceDomain,
        holderRef: input.context.holderRef,
        sourceObjectRef: input.context.scopeObjectRef,
        selectedAnchorRef: input.context.selectedAnchorRef,
        projectionFreshnessEnvelopeRef: input.context.projectionFreshnessEnvelopeRef,
        requestedState: input.requestedState,
        supplierObservedAt: input.command.occurredAt,
        generatedAt: input.command.occurredAt,
        expiresAt: input.expiresAt,
        revalidatedAt: input.revalidatedAt,
        confirmedAt: input.confirmedAt,
        commitMode: deriveCommitModeFromSemantics(
          input.context.reservationSemantics,
          input.action,
        ),
        capacityIdentitySupportsExclusivity:
          input.context.reservationSemantics === "exclusive_hold",
      });
      if (authorityResult.conflictBlocked) {
        await handleConflictReplay({
          replayKey,
          blockingFenceRef: authorityResult.blockingFence?.reservationFenceRecordId ?? null,
        });
        invariant(
          authorityResult.blockingFence !== null,
          "BLOCKING_FENCE_REQUIRED",
          "Conflict-blocked reservation claims must return a blocking fence.",
        );
        throw new Error(
          `BOOKING_RESERVATION_CONFLICT: ${authorityResult.blockingFence.reservationFenceRecordId}`,
        );
      }
    } else {
      invariant(
        input.command.fenceToken,
        "RESERVATION_FENCE_TOKEN_REQUIRED",
        "Reservation mutation requires the latest active fence token.",
      );
      invariant(
        priorScope.scopeTupleHash === input.context.scopeTupleHash,
        "STALE_RESERVATION_SCOPE_TUPLE",
        "Reservation mutation requires the current booking tuple. Refresh reservation truth before retrying.",
      );
      authorityResult = await reservationServices.reservationAuthority.transitionReservation({
        canonicalReservationKey: input.context.canonicalReservationKey,
        fenceToken: input.command.fenceToken,
        requestedState: input.requestedState,
        observedAt: input.command.occurredAt,
        generatedAt: input.command.occurredAt,
        expectedReservationVersionRef:
          optionalRef(input.command.expectedReservationVersionRef) ??
          priorScope.currentReservationVersionRef,
        expiresAt: input.expiresAt,
        revalidatedAt: input.revalidatedAt,
        confirmedAt: input.confirmedAt,
        projectionFreshnessEnvelopeRef: input.context.projectionFreshnessEnvelopeRef,
        sourceObjectRef: input.context.scopeObjectRef,
        selectedAnchorRef: input.context.selectedAnchorRef,
        commitMode: deriveCommitModeFromSemantics(
          input.context.reservationSemantics,
          input.action,
        ),
        capacityIdentitySupportsExclusivity:
          input.context.reservationSemantics === "exclusive_hold",
      });
    }

    invariant(
      authorityResult.reservation !== null && authorityResult.projection !== null,
      "RESERVATION_AUTHORITY_RESULT_INCOMPLETE",
      "Successful reservation mutations must return reservation and projection documents.",
    );
    const reservation = authorityResult.reservation.toSnapshot();
    const projection = authorityResult.projection.toSnapshot();
    const fence = authorityResult.fence.toSnapshot();
    return persistSuccessfulMutation({
      priorScope,
      context: input.context,
      action: input.action,
      reservation,
      projection,
      fence,
      commandActionRecordRef: input.command.commandActionRecordRef,
      commandSettlementRecordRef: input.command.commandSettlementRecordRef,
      subjectRef: input.command.subjectRef,
      payloadArtifactRef,
      edgeCorrelationId,
      occurredAt: input.command.occurredAt,
      replayKey,
    });
  }

  async function mutateTerminal(input: {
    action: BookingReservationAction;
    command: ReleaseReservationInput | ExpireReservationInput | DisputeReservationInput;
    terminalReasonCode: string;
    terminalState: "released" | "expired" | "disputed";
  }): Promise<BookingReservationTruthResult> {
    const replayKey = buildReplayKey({
      action: input.action,
      scopeFamily: input.command.scopeFamily,
      scopeObjectRef: input.command.scopeObjectRef,
      commandActionRecordRef: input.command.commandActionRecordRef,
    });
    const replay = await rebuildReplay(replayKey);
    if (replay) {
      return replay;
    }
    const priorScope = await getCurrentScope(input.command.scopeFamily, input.command.scopeObjectRef);
    invariant(priorScope, "BOOKING_RESERVATION_SCOPE_NOT_FOUND", "Current booking reservation scope was not found.");
    invariant(
      input.command.fenceToken,
      "RESERVATION_FENCE_TOKEN_REQUIRED",
      "Terminal reservation mutation requires the latest active fence token.",
    );
    const payloadArtifactRef =
      optionalRef(input.command.payloadArtifactRef) ??
      defaultPayloadArtifactRef({
        scopeFamily: input.command.scopeFamily,
        scopeObjectRef: input.command.scopeObjectRef,
        commandActionRecordRef: input.command.commandActionRecordRef,
      });
    const edgeCorrelationId =
      optionalRef(input.command.edgeCorrelationId) ??
      defaultEdgeCorrelationId({
        scopeFamily: input.command.scopeFamily,
        scopeObjectRef: input.command.scopeObjectRef,
        commandActionRecordRef: input.command.commandActionRecordRef,
      });

    const authorityResult =
      input.terminalState === "released"
        ? await reservationServices.reservationAuthority.releaseReservation({
            canonicalReservationKey: priorScope.canonicalReservationKey,
            fenceToken: input.command.fenceToken,
            observedAt: input.command.occurredAt,
            generatedAt: input.command.occurredAt,
            terminalReasonCode: input.terminalReasonCode,
            expectedReservationVersionRef:
              optionalRef(input.command.expectedReservationVersionRef) ??
              priorScope.currentReservationVersionRef,
          })
        : input.terminalState === "expired"
          ? await reservationServices.reservationAuthority.expireReservation({
              canonicalReservationKey: priorScope.canonicalReservationKey,
              fenceToken: input.command.fenceToken,
              observedAt: input.command.occurredAt,
              generatedAt: input.command.occurredAt,
              terminalReasonCode: input.terminalReasonCode,
              expectedReservationVersionRef:
                optionalRef(input.command.expectedReservationVersionRef) ??
                priorScope.currentReservationVersionRef,
            })
          : await reservationServices.reservationAuthority.disputeReservation({
              canonicalReservationKey: priorScope.canonicalReservationKey,
              fenceToken: input.command.fenceToken,
              observedAt: input.command.occurredAt,
              generatedAt: input.command.occurredAt,
              terminalReasonCode: input.terminalReasonCode,
              expectedReservationVersionRef:
                optionalRef(input.command.expectedReservationVersionRef) ??
                priorScope.currentReservationVersionRef,
            });

    const context: ReservationScopeContext = {
      scopeFamily: priorScope.scopeFamily,
      scopeObjectRef: priorScope.scopeObjectRef,
      bookingCaseId: priorScope.bookingCaseId,
      sourceDomain: priorScope.sourceDomain,
      holderRef: priorScope.holderRef,
      selectedAnchorRef: priorScope.selectedAnchorRef,
      selectedNormalizedSlotRef: priorScope.selectedNormalizedSlotRef,
      selectedCanonicalSlotIdentityRef: priorScope.selectedCanonicalSlotIdentityRef,
      sourceSlotSetSnapshotRef: priorScope.sourceSlotSetSnapshotRef,
      providerAdapterBindingRef: priorScope.providerAdapterBindingRef,
      providerAdapterBindingHash: priorScope.providerAdapterBindingHash,
      capabilityResolutionRef: priorScope.capabilityResolutionRef,
      capabilityTupleHash: priorScope.capabilityTupleHash,
      authoritativeReadAndConfirmationPolicyRef:
        priorScope.authoritativeReadAndConfirmationPolicyRef,
      reservationSemantics: priorScope.reservationSemantics,
      selectionToken: priorScope.selectionToken,
      selectionProofHash: priorScope.selectionProofHash,
      governingObjectVersionRef: priorScope.governingObjectVersionRef,
      scopeTupleHash: priorScope.scopeTupleHash,
      projectionFreshnessEnvelopeRef: priorScope.projectionFreshnessEnvelopeRef,
      canonicalReservationKey: priorScope.canonicalReservationKey,
      capacityIdentityRef: priorScope.capacityIdentityRef,
    };
    return persistSuccessfulMutation({
      priorScope,
      context,
      action: input.action,
      reservation: authorityResult.reservation.toSnapshot(),
      projection: authorityResult.projection.toSnapshot(),
      fence: authorityResult.fence.toSnapshot(),
      commandActionRecordRef: input.command.commandActionRecordRef,
      commandSettlementRecordRef: input.command.commandSettlementRecordRef,
      subjectRef: input.command.subjectRef,
      payloadArtifactRef,
      edgeCorrelationId,
      occurredAt: input.command.occurredAt,
      replayKey,
    });
  }

  async function maybeRefreshProjectionForScope(
    scope: BookingReservationScopeSnapshot,
    requestedAt: string,
  ): Promise<{
    scope: BookingReservationScopeSnapshot;
    reservation: CapacityReservationSnapshot;
    projection: ReservationTruthProjectionSnapshot;
    fence: ReservationFenceRecordSnapshot;
  }> {
    const artifacts = await requireReservationArtifacts(scope);
    let freshnessState: "fresh" | "stale" = "fresh";
    let nextFreshnessEnvelopeRef = scope.projectionFreshnessEnvelopeRef;
    if (scope.scopeFamily === "offer_session") {
      try {
        const currentContext = await resolveOfferScopeContext(scope.scopeObjectRef, {
          requireCurrent: false,
        });
        if (
          currentContext.scopeTupleHash !== scope.scopeTupleHash ||
          currentContext.providerAdapterBindingRef !== scope.providerAdapterBindingRef ||
          currentContext.capabilityResolutionRef !== scope.capabilityResolutionRef ||
          currentContext.sourceSlotSetSnapshotRef !== scope.sourceSlotSetSnapshotRef
        ) {
          freshnessState = "stale";
          nextFreshnessEnvelopeRef = currentContext.projectionFreshnessEnvelopeRef;
        }
      } catch {
        freshnessState = "stale";
      }
    }
    if (
      artifacts.reservation.truthBasisHash !== scope.currentTruthBasisHash ||
      artifacts.projection.projectionFreshnessEnvelopeRef !== nextFreshnessEnvelopeRef
    ) {
      freshnessState = "stale";
    }

    if (freshnessState === "fresh") {
      return {
        scope,
        reservation: artifacts.reservation,
        projection: artifacts.projection,
        fence: artifacts.fence,
      };
    }

    const refreshedProjection = await reservationConfirmationAuthority.refreshReservationTruthProjection({
      reservationId: artifacts.reservation.reservationId,
      reservationTruthProjectionId: artifacts.projection.reservationTruthProjectionId,
      sourceObjectRef: scope.scopeObjectRef,
      selectedAnchorRef: scope.selectedAnchorRef,
      projectionFreshnessEnvelopeRef: nextFreshnessEnvelopeRef,
      generatedAt: requestedAt,
      freshnessState,
      currentTruthBasisHash: scope.currentTruthBasisHash,
      capacityIdentitySupportsExclusivity: scope.reservationSemantics === "exclusive_hold",
    });

    const refreshedScope: BookingReservationScopeSnapshot = {
      ...scope,
      projectionFreshnessEnvelopeRef: nextFreshnessEnvelopeRef,
      currentReservationTruthProjectionRef: refreshedProjection.reservationTruthProjectionId,
      currentTruthState: refreshedProjection.toSnapshot().truthState,
      currentDisplayExclusivityState:
        refreshedProjection.toSnapshot().displayExclusivityState,
      updatedAt: requestedAt,
      version: scope.version + 1,
    };
    await scopeRepositories.saveBookingReservationScope(refreshedScope, {
      expectedVersion: scope.version,
    });
    return {
      scope: refreshedScope,
      reservation: artifacts.reservation,
      projection: refreshedProjection.toSnapshot(),
      fence: artifacts.fence,
    };
  }

  return {
    reservationRepositories,
    reservationScopeRepositories: scopeRepositories,

    async createOrRefreshSoftSelection(input) {
      const context = await resolveScopeContext({
        scopeFamily: input.scopeFamily,
        scopeObjectRef: input.scopeObjectRef,
        waitlistContext: input.waitlistContext,
        requireCurrent: true,
      });
      return mutateFromClaim({
        action: "soft_select",
        command: input,
        context,
        requestedState: "soft_selected",
        expiresAt: addSeconds(input.occurredAt, input.ttlSeconds ?? 300),
      });
    },

    async acquireOrRefreshHold(input) {
      const context = await resolveScopeContext({
        scopeFamily: input.scopeFamily,
        scopeObjectRef: input.scopeObjectRef,
        waitlistContext: input.waitlistContext,
        requireCurrent: true,
      });
      invariant(
        context.reservationSemantics === "exclusive_hold",
        "RESERVATION_HOLD_NOT_SUPPORTED",
        "Real holds are allowed only when the active provider binding publishes reservationSemantics = exclusive_hold.",
      );
      return mutateFromClaim({
        action: input.holdTtlSeconds === undefined ? "acquire_hold" : "refresh_hold",
        command: input,
        context,
        requestedState: "held",
        expiresAt: addSeconds(input.occurredAt, input.holdTtlSeconds ?? 120),
        revalidatedAt: input.occurredAt,
      });
    },

    async markPendingConfirmation(input) {
      const priorScope = await getCurrentScope(input.scopeFamily, input.scopeObjectRef);
      invariant(priorScope, "BOOKING_RESERVATION_SCOPE_NOT_FOUND", "Current booking reservation scope was not found.");
      const context =
        input.scopeFamily === "offer_session"
          ? await resolveOfferScopeContext(input.scopeObjectRef, { requireCurrent: true })
          : contextFromScope(priorScope);
      return mutateFromClaim({
        action: "mark_pending_confirmation",
        command: input,
        context,
        requestedState: "pending_confirmation",
        expiresAt: null,
      });
    },

    async markConfirmed(input) {
      const priorScope = await getCurrentScope(input.scopeFamily, input.scopeObjectRef);
      invariant(priorScope, "BOOKING_RESERVATION_SCOPE_NOT_FOUND", "Current booking reservation scope was not found.");
      const context =
        input.scopeFamily === "offer_session"
          ? await resolveOfferScopeContext(input.scopeObjectRef, { requireCurrent: true })
          : contextFromScope(priorScope);
      return mutateFromClaim({
        action: "mark_confirmed",
        command: input,
        context,
        requestedState: "confirmed",
        expiresAt: null,
        confirmedAt: input.occurredAt,
      });
    },

    async releaseReservation(input) {
      return mutateTerminal({
        action: "release",
        command: input,
        terminalReasonCode: input.terminalReasonCode,
        terminalState: "released",
      });
    },

    async expireReservation(input) {
      return mutateTerminal({
        action: "expire",
        command: input,
        terminalReasonCode: input.terminalReasonCode,
        terminalState: "expired",
      });
    },

    async markDisputed(input) {
      return mutateTerminal({
        action: "dispute",
        command: input,
        terminalReasonCode: input.terminalReasonCode,
        terminalState: "disputed",
      });
    },

    async queryReservationTruth(input) {
      const currentScope = await getCurrentScope(input.scopeFamily, input.scopeObjectRef);
      if (!currentScope) {
        return null;
      }
      const refreshed = await maybeRefreshProjectionForScope(currentScope, input.requestedAt);
      const journal = (await scopeRepositories.listReservationJournalEntries(
        refreshed.scope.bookingReservationScopeId,
      )).map((entry) => entry.toSnapshot());
      return {
        scope: refreshed.scope,
        journal,
        reservation: refreshed.reservation,
        projection: refreshed.projection,
        fence: refreshed.fence,
        replayed: false,
        conflictBlocked: false,
        blockingFence: null,
        emittedEvents: [],
      };
    },

    async sweepExpiredReservations(input) {
      const expiredScopeRefs: string[] = [];
      const results: BookingReservationTruthResult[] = [];
      for (const scopeDocument of await scopeRepositories.listBookingReservationScopes()) {
        const scope = scopeDocument.toSnapshot();
        if (scope.scopeState !== "active" || scope.expiresAt === null) {
          continue;
        }
        if (Date.parse(scope.expiresAt) > Date.parse(input.asOf)) {
          continue;
        }
        expiredScopeRefs.push(scope.bookingReservationScopeId);
        results.push(
          await mutateTerminal({
            action: "expire_sweep",
            command: {
              scopeFamily: scope.scopeFamily,
              scopeObjectRef: scope.scopeObjectRef,
              actorRef: input.actorRef,
              subjectRef: input.subjectRef,
              commandActionRecordRef: `${input.commandActionRecordRef}:${scope.bookingReservationScopeId}`,
              commandSettlementRecordRef: input.commandSettlementRecordRef,
              occurredAt: input.asOf,
              expectedReservationVersionRef: scope.currentReservationVersionRef,
              fenceToken: (await requireReservationArtifacts(scope)).fence.fenceToken,
              terminalReasonCode: "reservation_ttl_elapsed",
            },
            terminalReasonCode: "reservation_ttl_elapsed",
            terminalState: "expired",
          }),
        );
      }
      return {
        expiredScopeRefs,
        results,
      };
    },
  };
}
