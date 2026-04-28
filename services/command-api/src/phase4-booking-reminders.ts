import { createHash } from "node:crypto";
import {
  createDeterministicBackboneIdGenerator,
  type BackboneIdGenerator,
  type CompareAndSetWriteOptions,
} from "@vecells/domain-kernel";
import { makeFoundationEvent, type FoundationEventEnvelope } from "@vecells/event-contracts";
import {
  createReachabilityGovernorService,
  createReachabilityStore,
  type ContactRouteFreshnessState,
  type ContactRouteKind,
  type ContactRouteRepairJourney,
  type ContactRouteSourceAuthorityClass,
  type ContactRouteSnapshotVerificationState,
  type ReachabilityAssessmentRecord,
  type ReachabilityDependencies,
} from "@vecells/domain-identity-access";
import type {
  BookingCommitApplicationResult,
  Phase4BookingCommitApplication,
} from "./phase4-booking-commit";
import type { Phase4SlotSearchApplication } from "./phase4-slot-search";
import {
  createPhase1ConfirmationDispatchService,
  createPhase1ConfirmationDispatchStore,
  type Phase1ConfirmationCommunicationEnvelopeSnapshot,
  type Phase1ConfirmationDeliveryEvidenceState,
  type Phase1ConfirmationDispatchRepositories,
  type Phase1ConfirmationPreferredChannel,
  type Phase1ConfirmationReceiptBridgeSnapshot,
  type Phase1ConfirmationRouteAuthorityState,
  type Phase1ConfirmationTransportOutcome,
  type Phase1NotificationProviderMode,
} from "../../../packages/domains/communications/src/index";

function invariant(condition: unknown, code: string, message: string): asserts condition {
  if (!condition) {
    const error = new Error(`${code}: ${message}`) as Error & { code?: string };
    error.code = code;
    throw error;
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

function ensureNonNegativeInteger(value: number, field: string): number {
  invariant(
    Number.isInteger(value) && value >= 0,
    `INVALID_${field.toUpperCase()}`,
    `${field} must be a non-negative integer.`,
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

function sha256(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

function deterministicId(prefix: string, value: unknown): string {
  return `${prefix}_${sha256(value).slice(0, 24)}`;
}

function addMinutes(timestamp: string, minutes: number): string {
  return new Date(Date.parse(timestamp) + minutes * 60_000).toISOString();
}

function compareIso(left: string, right: string): number {
  return left.localeCompare(right);
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

class SnapshotDocument<T> {
  constructor(private readonly snapshot: T) {}

  toSnapshot(): T {
    return structuredClone(this.snapshot);
  }
}

export type ReminderPlanScheduleState =
  | "draft"
  | "scheduled"
  | "queued"
  | "sent"
  | "delivery_blocked"
  | "disputed"
  | "cancelled"
  | "completed";

export type ReminderPlanTransportAckState = "none" | "accepted" | "rejected" | "timed_out";

export type ReminderPlanDeliveryEvidenceState =
  | "pending"
  | "delivered"
  | "disputed"
  | "failed"
  | "expired"
  | "suppressed";

export type ReminderPlanDeliveryRiskState = "on_track" | "at_risk" | "likely_failed" | "disputed";

export type ReminderPlanAuthoritativeOutcomeState =
  | "scheduled"
  | "awaiting_delivery_truth"
  | "delivered"
  | "settled"
  | "recovery_required"
  | "suppressed";

export interface ReminderPlanSnapshot {
  reminderPlanId: string;
  schemaVersion: typeof PHASE4_BOOKING_REMINDER_SCHEMA_VERSION;
  bookingCaseRef: string;
  appointmentRecordRef: string;
  confirmationTruthRef: string;
  requestRef: string;
  requestLineageRef: string;
  sourceTaskRef: string;
  selectedSlotRef: string;
  appointmentStartAt: string;
  appointmentEndAt: string;
  appointmentTimeZone: string;
  templateSetRef: string;
  templateVersionRef: string;
  routeProfileRef: string;
  channel: Phase1ConfirmationPreferredChannel;
  payloadRef: string;
  payloadHash: string;
  maskedDestination: string;
  preferenceProfileRef: string;
  contactRouteRef: string;
  contactRouteVersionRef: string;
  currentContactRouteSnapshotRef: string | null;
  reachabilityDependencyRef: string | null;
  currentReachabilityAssessmentRef: string | null;
  reachabilityEpoch: number;
  repairJourneyRef: string | null;
  communicationEnvelopeRef: string | null;
  scheduleRefs: readonly string[];
  scheduleState: ReminderPlanScheduleState;
  transportAckState: ReminderPlanTransportAckState;
  deliveryEvidenceState: ReminderPlanDeliveryEvidenceState;
  deliveryRiskState: ReminderPlanDeliveryRiskState;
  authoritativeOutcomeState: ReminderPlanAuthoritativeOutcomeState;
  suppressionReasonRefs: readonly string[];
  deliveryEvidenceRefs: readonly string[];
  lastDeliveryAttemptAt: string | null;
  nextAttemptAt: string | null;
  causalToken: string;
  monotoneRevision: number;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface ReminderScheduleEntrySnapshot {
  reminderScheduleEntryId: string;
  reminderPlanRef: string;
  scheduleRef: string;
  scheduleOrdinal: number;
  plannedSendAt: string;
  queueIdempotencyKey: string;
  receiptEnvelopeRef: string;
  state: ReminderPlanScheduleState;
  communicationEnvelopeRef: string | null;
  latestTransportSettlementRef: string | null;
  latestDeliveryEvidenceRef: string | null;
  lastProviderCorrelationRef: string | null;
  transportAckState: ReminderPlanTransportAckState;
  deliveryEvidenceState: ReminderPlanDeliveryEvidenceState;
  authoritativeOutcomeState: ReminderPlanAuthoritativeOutcomeState;
  reasonCodes: readonly string[];
  lastAttemptAt: string | null;
  nextAttemptAt: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface ReminderTransitionJournalEntrySnapshot {
  reminderTransitionJournalEntryId: string;
  reminderPlanRef: string;
  reminderScheduleEntryRef: string | null;
  actionScope:
    | "refresh_plan"
    | "queue_due_schedule"
    | "transport_settlement"
    | "delivery_evidence"
    | "suppress"
    | "repair_required";
  previousScheduleState: ReminderPlanScheduleState | "none";
  nextScheduleState: ReminderPlanScheduleState;
  previousOutcomeState: ReminderPlanAuthoritativeOutcomeState | "none";
  nextOutcomeState: ReminderPlanAuthoritativeOutcomeState;
  reasonCodes: readonly string[];
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  payloadArtifactRef: string;
  edgeCorrelationId: string;
  recordedAt: string;
  version: number;
}

interface ReminderRepositories {
  getReminderPlan(reminderPlanId: string): Promise<SnapshotDocument<ReminderPlanSnapshot> | null>;
  saveReminderPlan(
    snapshot: ReminderPlanSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listReminderPlans(): Promise<readonly SnapshotDocument<ReminderPlanSnapshot>[]>;
  getCurrentReminderPlanRefForBookingCase(bookingCaseId: string): Promise<string | null>;
  setCurrentReminderPlanRefForBookingCase(
    bookingCaseId: string,
    reminderPlanId: string | null,
  ): Promise<void>;
  getCurrentReminderPlanRefForAppointment(appointmentRecordId: string): Promise<string | null>;
  setCurrentReminderPlanRefForAppointment(
    appointmentRecordId: string,
    reminderPlanId: string | null,
  ): Promise<void>;
  getReminderScheduleEntry(
    reminderScheduleEntryId: string,
  ): Promise<SnapshotDocument<ReminderScheduleEntrySnapshot> | null>;
  saveReminderScheduleEntry(
    snapshot: ReminderScheduleEntrySnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listReminderScheduleEntries(
    reminderPlanId: string,
  ): Promise<readonly SnapshotDocument<ReminderScheduleEntrySnapshot>[]>;
  saveReminderTransitionJournalEntry(
    snapshot: ReminderTransitionJournalEntrySnapshot,
  ): Promise<void>;
  listReminderTransitionJournalEntries(
    reminderPlanId: string,
  ): Promise<readonly SnapshotDocument<ReminderTransitionJournalEntrySnapshot>[]>;
}

function normalizeReminderPlan(snapshot: ReminderPlanSnapshot): ReminderPlanSnapshot {
  invariant(
    snapshot.version >= 1,
    "INVALID_REMINDER_PLAN_VERSION",
    "ReminderPlan.version must be >= 1.",
  );
  invariant(
    snapshot.monotoneRevision >= 1,
    "INVALID_REMINDER_PLAN_REVISION",
    "ReminderPlan.monotoneRevision must be >= 1.",
  );
  return {
    ...snapshot,
    reminderPlanId: requireRef(snapshot.reminderPlanId, "reminderPlanId"),
    bookingCaseRef: requireRef(snapshot.bookingCaseRef, "bookingCaseRef"),
    appointmentRecordRef: requireRef(snapshot.appointmentRecordRef, "appointmentRecordRef"),
    confirmationTruthRef: requireRef(snapshot.confirmationTruthRef, "confirmationTruthRef"),
    requestRef: requireRef(snapshot.requestRef, "requestRef"),
    requestLineageRef: requireRef(snapshot.requestLineageRef, "requestLineageRef"),
    sourceTaskRef: requireRef(snapshot.sourceTaskRef, "sourceTaskRef"),
    selectedSlotRef: requireRef(snapshot.selectedSlotRef, "selectedSlotRef"),
    appointmentStartAt: ensureIsoTimestamp(snapshot.appointmentStartAt, "appointmentStartAt"),
    appointmentEndAt: ensureIsoTimestamp(snapshot.appointmentEndAt, "appointmentEndAt"),
    appointmentTimeZone: requireRef(snapshot.appointmentTimeZone, "appointmentTimeZone"),
    templateSetRef: requireRef(snapshot.templateSetRef, "templateSetRef"),
    templateVersionRef: requireRef(snapshot.templateVersionRef, "templateVersionRef"),
    routeProfileRef: requireRef(snapshot.routeProfileRef, "routeProfileRef"),
    payloadRef: requireRef(snapshot.payloadRef, "payloadRef"),
    payloadHash: requireRef(snapshot.payloadHash, "payloadHash"),
    maskedDestination: requireRef(snapshot.maskedDestination, "maskedDestination"),
    preferenceProfileRef: requireRef(snapshot.preferenceProfileRef, "preferenceProfileRef"),
    contactRouteRef: requireRef(snapshot.contactRouteRef, "contactRouteRef"),
    contactRouteVersionRef: requireRef(snapshot.contactRouteVersionRef, "contactRouteVersionRef"),
    currentContactRouteSnapshotRef: optionalRef(snapshot.currentContactRouteSnapshotRef),
    reachabilityDependencyRef: optionalRef(snapshot.reachabilityDependencyRef),
    currentReachabilityAssessmentRef: optionalRef(snapshot.currentReachabilityAssessmentRef),
    reachabilityEpoch: ensureNonNegativeInteger(snapshot.reachabilityEpoch, "reachabilityEpoch"),
    repairJourneyRef: optionalRef(snapshot.repairJourneyRef),
    communicationEnvelopeRef: optionalRef(snapshot.communicationEnvelopeRef),
    scheduleRefs: uniqueSortedRefs(snapshot.scheduleRefs),
    suppressionReasonRefs: uniqueSortedRefs(snapshot.suppressionReasonRefs),
    deliveryEvidenceRefs: uniqueSortedRefs(snapshot.deliveryEvidenceRefs),
    lastDeliveryAttemptAt: optionalRef(snapshot.lastDeliveryAttemptAt),
    nextAttemptAt: optionalRef(snapshot.nextAttemptAt),
    causalToken: requireRef(snapshot.causalToken, "causalToken"),
    createdAt: ensureIsoTimestamp(snapshot.createdAt, "createdAt"),
    updatedAt: ensureIsoTimestamp(snapshot.updatedAt, "updatedAt"),
  };
}

function normalizeReminderScheduleEntry(
  snapshot: ReminderScheduleEntrySnapshot,
): ReminderScheduleEntrySnapshot {
  invariant(
    snapshot.version >= 1,
    "INVALID_REMINDER_SCHEDULE_VERSION",
    "ReminderScheduleEntry.version must be >= 1.",
  );
  return {
    ...snapshot,
    reminderScheduleEntryId: requireRef(
      snapshot.reminderScheduleEntryId,
      "reminderScheduleEntryId",
    ),
    reminderPlanRef: requireRef(snapshot.reminderPlanRef, "reminderPlanRef"),
    scheduleRef: requireRef(snapshot.scheduleRef, "scheduleRef"),
    plannedSendAt: ensureIsoTimestamp(snapshot.plannedSendAt, "plannedSendAt"),
    queueIdempotencyKey: requireRef(snapshot.queueIdempotencyKey, "queueIdempotencyKey"),
    receiptEnvelopeRef: requireRef(snapshot.receiptEnvelopeRef, "receiptEnvelopeRef"),
    communicationEnvelopeRef: optionalRef(snapshot.communicationEnvelopeRef),
    latestTransportSettlementRef: optionalRef(snapshot.latestTransportSettlementRef),
    latestDeliveryEvidenceRef: optionalRef(snapshot.latestDeliveryEvidenceRef),
    lastProviderCorrelationRef: optionalRef(snapshot.lastProviderCorrelationRef),
    reasonCodes: uniqueSortedRefs(snapshot.reasonCodes),
    lastAttemptAt: optionalRef(snapshot.lastAttemptAt),
    nextAttemptAt: optionalRef(snapshot.nextAttemptAt),
    createdAt: ensureIsoTimestamp(snapshot.createdAt, "createdAt"),
    updatedAt: ensureIsoTimestamp(snapshot.updatedAt, "updatedAt"),
  };
}

function normalizeReminderJournalEntry(
  snapshot: ReminderTransitionJournalEntrySnapshot,
): ReminderTransitionJournalEntrySnapshot {
  invariant(
    snapshot.version >= 1,
    "INVALID_REMINDER_JOURNAL_VERSION",
    "ReminderTransitionJournalEntry.version must be >= 1.",
  );
  return {
    ...snapshot,
    reminderTransitionJournalEntryId: requireRef(
      snapshot.reminderTransitionJournalEntryId,
      "reminderTransitionJournalEntryId",
    ),
    reminderPlanRef: requireRef(snapshot.reminderPlanRef, "reminderPlanRef"),
    reminderScheduleEntryRef: optionalRef(snapshot.reminderScheduleEntryRef),
    reasonCodes: uniqueSortedRefs(snapshot.reasonCodes),
    commandActionRecordRef: requireRef(snapshot.commandActionRecordRef, "commandActionRecordRef"),
    commandSettlementRecordRef: requireRef(
      snapshot.commandSettlementRecordRef,
      "commandSettlementRecordRef",
    ),
    payloadArtifactRef: requireRef(snapshot.payloadArtifactRef, "payloadArtifactRef"),
    edgeCorrelationId: requireRef(snapshot.edgeCorrelationId, "edgeCorrelationId"),
    recordedAt: ensureIsoTimestamp(snapshot.recordedAt, "recordedAt"),
  };
}

export function createPhase4BookingReminderStore(): ReminderRepositories {
  const reminderPlans = new Map<string, ReminderPlanSnapshot>();
  const currentReminderPlanByBookingCase = new Map<string, string>();
  const currentReminderPlanByAppointment = new Map<string, string>();
  const scheduleEntries = new Map<string, ReminderScheduleEntrySnapshot>();
  const scheduleRefsByPlan = new Map<string, Set<string>>();
  const journalEntries = new Map<string, ReminderTransitionJournalEntrySnapshot>();
  const journalRefsByPlan = new Map<string, Set<string>>();

  return {
    async getReminderPlan(reminderPlanId) {
      const snapshot = reminderPlans.get(reminderPlanId);
      return snapshot ? new SnapshotDocument(snapshot) : null;
    },
    async saveReminderPlan(snapshot, options) {
      const normalized = normalizeReminderPlan(snapshot);
      saveWithCas(reminderPlans, normalized.reminderPlanId, normalized, options);
    },
    async listReminderPlans() {
      return [...reminderPlans.values()]
        .sort((left, right) => compareIso(left.updatedAt, right.updatedAt))
        .map((snapshot) => new SnapshotDocument(snapshot));
    },
    async getCurrentReminderPlanRefForBookingCase(bookingCaseId) {
      return currentReminderPlanByBookingCase.get(bookingCaseId) ?? null;
    },
    async setCurrentReminderPlanRefForBookingCase(bookingCaseId, reminderPlanId) {
      if (reminderPlanId) {
        currentReminderPlanByBookingCase.set(bookingCaseId, reminderPlanId);
        return;
      }
      currentReminderPlanByBookingCase.delete(bookingCaseId);
    },
    async getCurrentReminderPlanRefForAppointment(appointmentRecordId) {
      return currentReminderPlanByAppointment.get(appointmentRecordId) ?? null;
    },
    async setCurrentReminderPlanRefForAppointment(appointmentRecordId, reminderPlanId) {
      if (reminderPlanId) {
        currentReminderPlanByAppointment.set(appointmentRecordId, reminderPlanId);
        return;
      }
      currentReminderPlanByAppointment.delete(appointmentRecordId);
    },
    async getReminderScheduleEntry(reminderScheduleEntryId) {
      const snapshot = scheduleEntries.get(reminderScheduleEntryId);
      return snapshot ? new SnapshotDocument(snapshot) : null;
    },
    async saveReminderScheduleEntry(snapshot, options) {
      const normalized = normalizeReminderScheduleEntry(snapshot);
      saveWithCas(scheduleEntries, normalized.reminderScheduleEntryId, normalized, options);
      const refs = scheduleRefsByPlan.get(normalized.reminderPlanRef) ?? new Set<string>();
      refs.add(normalized.reminderScheduleEntryId);
      scheduleRefsByPlan.set(normalized.reminderPlanRef, refs);
    },
    async listReminderScheduleEntries(reminderPlanId) {
      const refs = scheduleRefsByPlan.get(reminderPlanId) ?? new Set<string>();
      return [...refs]
        .map((ref) => scheduleEntries.get(ref))
        .filter((snapshot): snapshot is ReminderScheduleEntrySnapshot => snapshot !== undefined)
        .sort((left, right) => {
          const byTime = compareIso(left.plannedSendAt, right.plannedSendAt);
          return byTime === 0 ? left.scheduleOrdinal - right.scheduleOrdinal : byTime;
        })
        .map((snapshot) => new SnapshotDocument(snapshot));
    },
    async saveReminderTransitionJournalEntry(snapshot) {
      const normalized = normalizeReminderJournalEntry(snapshot);
      journalEntries.set(normalized.reminderTransitionJournalEntryId, structuredClone(normalized));
      const refs = journalRefsByPlan.get(normalized.reminderPlanRef) ?? new Set<string>();
      refs.add(normalized.reminderTransitionJournalEntryId);
      journalRefsByPlan.set(normalized.reminderPlanRef, refs);
    },
    async listReminderTransitionJournalEntries(reminderPlanId) {
      const refs = journalRefsByPlan.get(reminderPlanId) ?? new Set<string>();
      return [...refs]
        .map((ref) => journalEntries.get(ref))
        .filter(
          (snapshot): snapshot is ReminderTransitionJournalEntrySnapshot => snapshot !== undefined,
        )
        .sort((left, right) => left.version - right.version)
        .map((snapshot) => new SnapshotDocument(snapshot));
    },
  };
}

export const PHASE4_BOOKING_REMINDER_SERVICE_NAME = "Phase4BookingReminderPlanApplication";
export const PHASE4_BOOKING_REMINDER_SCHEMA_VERSION = "289.phase4.reminder-plan-and-settlement.v1";
export const PHASE4_BOOKING_REMINDER_QUERY_SURFACES = [
  "GET /v1/bookings/cases/{bookingCaseId}/reminder-plan/current",
] as const;

export const phase4BookingReminderRoutes = [
  {
    routeId: "booking_case_reminder_plan_current",
    method: "GET",
    path: "/v1/bookings/cases/{bookingCaseId}/reminder-plan/current",
    contractFamily: "ReminderPlanBundleContract",
    purpose:
      "Resolve the current durable ReminderPlan, schedule entries, latest communication envelope, and repair posture for one managed appointment lineage.",
    bodyRequired: false,
    idempotencyRequired: false,
  },
  {
    routeId: "booking_case_refresh_reminder_plan",
    method: "POST",
    path: "/internal/v1/bookings/cases/{bookingCaseId}:refresh-reminder-plan",
    contractFamily: "RefreshReminderPlanCommandContract",
    purpose:
      "Create or refresh one ReminderPlan only from current confirmed booking truth, current route authority, and versioned template and payload references.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "booking_reminder_plan_sweep_due",
    method: "POST",
    path: "/internal/v1/bookings/reminder-plans/{reminderPlanId}:sweep-due",
    contractFamily: "SweepReminderPlanSchedulesCommandContract",
    purpose:
      "Queue any due reminder schedules through the canonical communication-envelope chain after rechecking current booking and route truth.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "booking_reminder_plan_suppress",
    method: "POST",
    path: "/internal/v1/bookings/reminder-plans/{reminderPlanId}:suppress",
    contractFamily: "SuppressReminderPlanCommandContract",
    purpose:
      "Cancel or suppress stale reminder work when appointment truth, confirmation truth, or governed policy no longer permits booked reassurance.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "booking_reminder_plan_record_transport_outcome",
    method: "POST",
    path: "/internal/v1/bookings/reminder-plans/{reminderPlanId}:record-transport-outcome",
    contractFamily: "RecordReminderTransportOutcomeCommandContract",
    purpose:
      "Settle reminder transport acceptance or retry posture distinctly from delivery truth and keep the ReminderPlan monotone under duplicate worker execution.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "booking_reminder_plan_record_delivery_evidence",
    method: "POST",
    path: "/internal/v1/bookings/reminder-plans/{reminderPlanId}:record-delivery-evidence",
    contractFamily: "RecordReminderDeliveryEvidenceCommandContract",
    purpose:
      "Ingest authoritative reminder delivery evidence or failure through the same envelope chain and update blocked or disputed posture explicitly.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "booking_reminder_plan_mark_repair_required",
    method: "POST",
    path: "/internal/v1/bookings/reminder-plans/{reminderPlanId}:mark-repair-required",
    contractFamily: "MarkReminderRepairRequiredCommandContract",
    purpose:
      "Refresh the reminder route-repair posture when reminder delivery, verification freshness, or route authority can no longer support truthful reassurance.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
] as const;

export const phase4BookingReminderPersistenceTables = [
  "phase4_booking_confirmation_truth_projections",
  "phase4_appointment_records",
  "phase1_confirmation_communication_envelopes",
  "phase1_confirmation_transport_settlements",
  "phase1_confirmation_delivery_evidence",
  "phase1_confirmation_receipt_bridges",
  "reachability_dependencies",
  "reachability_assessment_records",
  "contact_route_snapshots",
  "contact_route_repair_journeys",
  "phase4_reminder_plans",
  "phase4_reminder_schedule_entries",
  "phase4_reminder_transition_journal",
] as const;

export const phase4BookingReminderMigrationPlanRefs = [
  "services/command-api/migrations/069_contact_route_and_reachability.sql",
  "services/command-api/migrations/080_identity_repair_and_reachability_governor.sql",
  "services/command-api/migrations/089_phase1_confirmation_dispatch_and_observability.sql",
  "services/command-api/migrations/136_phase4_booking_commit_pipeline.sql",
  "services/command-api/migrations/138_phase4_reminder_plan_and_notification_settlement.sql",
] as const;

export interface ReminderContactRouteInput {
  subjectRef: string;
  routeRef: string;
  routeVersionRef: string;
  routeKind: ContactRouteKind;
  normalizedAddressRef: string;
  preferenceProfileRef: string;
  verificationState: ContactRouteSnapshotVerificationState;
  demographicFreshnessState: ContactRouteFreshnessState;
  preferenceFreshnessState: ContactRouteFreshnessState;
  sourceAuthorityClass: ContactRouteSourceAuthorityClass;
  maskedDestination: string;
}

export interface RefreshReminderPlanInput {
  bookingCaseId: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  actorRef: string;
  templateSetRef: string;
  templateVersionRef: string;
  routeProfileRef: string;
  channel: Phase1ConfirmationPreferredChannel;
  payloadRef: string;
  payload?: unknown;
  payloadArtifactRef?: string | null;
  edgeCorrelationId?: string | null;
  scheduleOffsetsMinutesBeforeStart: readonly number[];
  refreshedAt: string;
  appointmentTimeZone?: string | null;
  appointmentStartAt?: string | null;
  appointmentEndAt?: string | null;
  contactRoute: ReminderContactRouteInput;
}

export interface SweepDueReminderSchedulesInput {
  reminderPlanId: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  sweptAt: string;
  payloadArtifactRef?: string | null;
  edgeCorrelationId?: string | null;
  contactRoute?: ReminderContactRouteInput | null;
}

export interface SuppressReminderPlanInput {
  reminderPlanId: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  suppressedAt: string;
  reasonCodes: readonly string[];
  payloadArtifactRef?: string | null;
  edgeCorrelationId?: string | null;
}

export interface RecordReminderTransportOutcomeInput {
  reminderPlanId: string;
  reminderScheduleEntryId: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  transportSettlementKey: string;
  workerRunRef: string;
  providerMode: Phase1NotificationProviderMode;
  transportOutcome: Phase1ConfirmationTransportOutcome;
  recordedAt: string;
  providerCorrelationRef?: string | null;
  payloadArtifactRef?: string | null;
  edgeCorrelationId?: string | null;
  maxAttempts?: number | null;
  backoffSeconds?: readonly number[] | null;
}

export interface RecordReminderDeliveryEvidenceInput {
  reminderPlanId: string;
  reminderScheduleEntryId: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  deliveryEvidenceKey: string;
  deliveryEvidenceState: Exclude<Phase1ConfirmationDeliveryEvidenceState, "pending">;
  evidenceSource:
    | "provider_delivery_webhook"
    | "provider_callback"
    | "simulator_delivery_webhook"
    | "manual_review";
  observedAt: string;
  recordedAt: string;
  providerCorrelationRef?: string | null;
  payloadArtifactRef?: string | null;
  edgeCorrelationId?: string | null;
}

export interface MarkReminderRepairRequiredInput {
  reminderPlanId: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  markedAt: string;
  reasonCodes: readonly string[];
  disputed?: boolean;
  payloadArtifactRef?: string | null;
  edgeCorrelationId?: string | null;
}

export interface QueryCurrentReminderPlanInput {
  bookingCaseId: string;
}

export interface ReminderPlanApplicationResult {
  reminderPlan: ReminderPlanSnapshot;
  scheduleEntries: readonly ReminderScheduleEntrySnapshot[];
  communicationEnvelope: Phase1ConfirmationCommunicationEnvelopeSnapshot | null;
  receiptBridge: Phase1ConfirmationReceiptBridgeSnapshot | null;
  repairJourney: ContactRouteRepairJourney | null;
  reachabilityAssessment: ReachabilityAssessmentRecord | null;
  replayed: boolean;
  emittedEvents: readonly FoundationEventEnvelope<unknown>[];
}

function requireReminderChannel(
  channel: Phase1ConfirmationPreferredChannel,
  routeKind: ContactRouteKind,
): Phase1ConfirmationPreferredChannel {
  invariant(
    routeKind === channel,
    "REMINDER_ROUTE_CHANNEL_MISMATCH",
    `Reminder channel ${channel} requires route kind ${channel}, received ${routeKind}.`,
  );
  return channel;
}

async function bindReminderPlanToAppointmentRecord(input: {
  bookingCommitApplication: Phase4BookingCommitApplication;
  appointmentRecordRef: string;
  reminderPlanRef: string;
  updatedAt: string;
}) {
  const appointmentDocument =
    await input.bookingCommitApplication.bookingCommitRepositories.getAppointmentRecord(
      input.appointmentRecordRef,
    );
  invariant(
    appointmentDocument,
    "APPOINTMENT_RECORD_NOT_FOUND",
    `AppointmentRecord ${input.appointmentRecordRef} was not found.`,
  );
  const appointment = appointmentDocument.toSnapshot();
  if (appointment.reminderPlanRef === input.reminderPlanRef) {
    return appointment;
  }
  const nextAppointment = {
    ...appointment,
    reminderPlanRef: input.reminderPlanRef,
    updatedAt: ensureIsoTimestamp(input.updatedAt, "updatedAt"),
    version: appointment.version + 1,
  };
  await input.bookingCommitApplication.bookingCommitRepositories.saveAppointmentRecord(
    nextAppointment,
    {
      expectedVersion: appointment.version,
    },
  );
  return nextAppointment;
}

function confirmationReminderExposureStateForPlan(
  outcomeState: ReminderPlanAuthoritativeOutcomeState,
): "blocked" | "scheduled" {
  return outcomeState === "scheduled" ||
    outcomeState === "awaiting_delivery_truth" ||
    outcomeState === "delivered" ||
    outcomeState === "settled"
    ? "scheduled"
    : "blocked";
}

function reminderRiskFromAssessment(
  assessment: ReachabilityAssessmentRecord,
): ReminderPlanDeliveryRiskState {
  switch (assessment.deliveryRiskState) {
    case "on_track":
      return "on_track";
    case "at_risk":
      return "at_risk";
    case "likely_failed":
      return "likely_failed";
    case "disputed":
      return "disputed";
    default:
      return assessment.assessmentState === "disputed" ? "disputed" : "at_risk";
  }
}

function routeAuthorityStateFromAssessment(
  assessment: ReachabilityAssessmentRecord,
): Phase1ConfirmationRouteAuthorityState {
  switch (assessment.routeAuthorityState) {
    case "current":
    case "stale_verification":
    case "stale_demographics":
    case "stale_preferences":
    case "disputed":
    case "superseded":
      return assessment.routeAuthorityState;
    default:
      return "unknown";
  }
}

function dispatchableAssessment(assessment: ReachabilityAssessmentRecord): boolean {
  return (
    assessment.routeAuthorityState === "current" &&
    assessment.assessmentState !== "blocked" &&
    assessment.assessmentState !== "disputed"
  );
}

function scheduleStateFromAssessment(
  assessment: ReachabilityAssessmentRecord,
): ReminderPlanScheduleState {
  if (assessment.assessmentState === "disputed") {
    return "disputed";
  }
  return dispatchableAssessment(assessment) ? "scheduled" : "delivery_blocked";
}

function outcomeStateFromAssessment(
  assessment: ReachabilityAssessmentRecord,
): ReminderPlanAuthoritativeOutcomeState {
  return dispatchableAssessment(assessment) ? "scheduled" : "recovery_required";
}

function dominantReasonCodesFromAssessment(assessment: ReachabilityAssessmentRecord): string[] {
  return uniqueSortedRefs(
    [
      assessment.dominantReasonCode ?? "",
      assessment.routeAuthorityState === "current" ? "" : `route_${assessment.routeAuthorityState}`,
      assessment.assessmentState === "clear" ? "" : `reachability_${assessment.assessmentState}`,
    ].filter(Boolean),
  );
}

function aggregatePlanState(
  scheduleEntries: readonly ReminderScheduleEntrySnapshot[],
  fallbackRisk: ReminderPlanDeliveryRiskState,
  existingSuppressionReasonRefs: readonly string[],
): Pick<
  ReminderPlanSnapshot,
  | "scheduleState"
  | "transportAckState"
  | "deliveryEvidenceState"
  | "deliveryRiskState"
  | "authoritativeOutcomeState"
  | "suppressionReasonRefs"
  | "deliveryEvidenceRefs"
  | "lastDeliveryAttemptAt"
  | "nextAttemptAt"
  | "communicationEnvelopeRef"
> {
  const deliveryEvidenceRefs = uniqueSortedRefs(
    scheduleEntries.map((entry) => entry.latestDeliveryEvidenceRef ?? "").filter(Boolean),
  );
  const latestEnvelopeRef =
    [...scheduleEntries]
      .sort((left, right) => compareIso(right.updatedAt, left.updatedAt))
      .find((entry) => entry.communicationEnvelopeRef)?.communicationEnvelopeRef ?? null;
  const lastDeliveryAttemptAt =
    [...scheduleEntries]
      .map((entry) => entry.lastAttemptAt)
      .filter((value): value is string => value !== null)
      .sort(compareIso)
      .at(-1) ?? null;
  const nextAttemptAt =
    [...scheduleEntries]
      .map((entry) => entry.nextAttemptAt)
      .filter((value): value is string => value !== null)
      .sort(compareIso)
      .at(0) ?? null;

  const states = new Set(scheduleEntries.map((entry) => entry.state));
  const deliveryStates = new Set(scheduleEntries.map((entry) => entry.deliveryEvidenceState));
  const transportStates = new Set(scheduleEntries.map((entry) => entry.transportAckState));
  const has = (state: ReminderPlanScheduleState) => states.has(state);

  let scheduleState: ReminderPlanScheduleState = "draft";
  if (has("disputed")) {
    scheduleState = "disputed";
  } else if (has("delivery_blocked")) {
    scheduleState = "delivery_blocked";
  } else if (has("sent")) {
    scheduleState = "sent";
  } else if (has("queued")) {
    scheduleState = "queued";
  } else if (has("scheduled")) {
    scheduleState = "scheduled";
  } else if (
    scheduleEntries.length > 0 &&
    scheduleEntries.every((entry) => entry.state === "completed")
  ) {
    scheduleState = "completed";
  } else if (
    scheduleEntries.length > 0 &&
    scheduleEntries.every((entry) => entry.state === "cancelled")
  ) {
    scheduleState = "cancelled";
  }

  let transportAckState: ReminderPlanTransportAckState = "none";
  if (transportStates.has("accepted")) {
    transportAckState = "accepted";
  } else if (transportStates.has("timed_out")) {
    transportAckState = "timed_out";
  } else if (transportStates.has("rejected")) {
    transportAckState = "rejected";
  }

  let deliveryEvidenceState: ReminderPlanDeliveryEvidenceState = "pending";
  if (deliveryStates.has("disputed")) {
    deliveryEvidenceState = "disputed";
  } else if (deliveryStates.has("failed")) {
    deliveryEvidenceState = "failed";
  } else if (deliveryStates.has("expired")) {
    deliveryEvidenceState = "expired";
  } else if (deliveryStates.has("suppressed")) {
    deliveryEvidenceState = "suppressed";
  } else if (
    scheduleEntries.length > 0 &&
    scheduleEntries.every((entry) => entry.deliveryEvidenceState === "delivered")
  ) {
    deliveryEvidenceState = "delivered";
  }

  let authoritativeOutcomeState: ReminderPlanAuthoritativeOutcomeState = "scheduled";
  if (scheduleState === "disputed") {
    authoritativeOutcomeState = "recovery_required";
  } else if (scheduleState === "delivery_blocked") {
    authoritativeOutcomeState =
      deliveryEvidenceState === "suppressed" ? "suppressed" : "recovery_required";
  } else if (scheduleState === "sent" || scheduleState === "queued") {
    authoritativeOutcomeState = "awaiting_delivery_truth";
  } else if (scheduleState === "completed") {
    authoritativeOutcomeState = deliveryEvidenceState === "delivered" ? "settled" : "delivered";
  } else if (scheduleState === "cancelled") {
    authoritativeOutcomeState =
      deliveryEvidenceState === "suppressed" || existingSuppressionReasonRefs.length > 0
        ? "suppressed"
        : "settled";
  }

  let deliveryRiskState = fallbackRisk;
  if (deliveryEvidenceState === "disputed" || scheduleState === "disputed") {
    deliveryRiskState = "disputed";
  } else if (deliveryEvidenceState === "failed" || deliveryEvidenceState === "expired") {
    deliveryRiskState = "likely_failed";
  } else if (transportAckState === "timed_out" || transportAckState === "rejected") {
    deliveryRiskState = "at_risk";
  }

  return {
    scheduleState,
    transportAckState,
    deliveryEvidenceState,
    deliveryRiskState,
    authoritativeOutcomeState,
    suppressionReasonRefs: uniqueSortedRefs(existingSuppressionReasonRefs),
    deliveryEvidenceRefs,
    lastDeliveryAttemptAt,
    nextAttemptAt,
    communicationEnvelopeRef: latestEnvelopeRef,
  };
}

function buildScheduleEntries(input: {
  reminderPlanId: string;
  causalToken: string;
  appointmentStartAt: string;
  refreshedAt: string;
  scheduleOffsetsMinutesBeforeStart: readonly number[];
  initialState: ReminderPlanScheduleState;
  initialOutcomeState: ReminderPlanAuthoritativeOutcomeState;
  initialDeliveryState: ReminderPlanDeliveryEvidenceState;
}): ReminderScheduleEntrySnapshot[] {
  const offsets = [...new Set(input.scheduleOffsetsMinutesBeforeStart)]
    .map((value) => ensureNonNegativeInteger(value, "scheduleOffsetMinutes"))
    .sort((left, right) => right - left);
  invariant(
    offsets.length > 0,
    "REMINDER_SCHEDULE_REQUIRED",
    "At least one reminder offset is required.",
  );
  return offsets.map((offsetMinutes, index) => {
    const scheduleRef = deterministicId("reminder_schedule_ref", {
      reminderPlanId: input.reminderPlanId,
      causalToken: input.causalToken,
      offsetMinutes,
      ordinal: index,
    });
    return normalizeReminderScheduleEntry({
      reminderScheduleEntryId: deterministicId("reminder_schedule_entry", scheduleRef),
      reminderPlanRef: input.reminderPlanId,
      scheduleRef,
      scheduleOrdinal: index + 1,
      plannedSendAt: addMinutes(input.appointmentStartAt, -offsetMinutes),
      queueIdempotencyKey: `booking_reminder_queue::${scheduleRef}`,
      receiptEnvelopeRef: `booking_reminder_receipt::${scheduleRef}`,
      state: input.initialState,
      communicationEnvelopeRef: null,
      latestTransportSettlementRef: null,
      latestDeliveryEvidenceRef: null,
      lastProviderCorrelationRef: null,
      transportAckState: "none",
      deliveryEvidenceState: input.initialDeliveryState,
      authoritativeOutcomeState: input.initialOutcomeState,
      reasonCodes: [],
      lastAttemptAt: null,
      nextAttemptAt:
        input.initialState === "scheduled" || input.initialState === "queued"
          ? addMinutes(input.appointmentStartAt, -offsetMinutes)
          : null,
      createdAt: input.refreshedAt,
      updatedAt: input.refreshedAt,
      version: 1,
    });
  });
}

function deriveAppointmentTiming(
  bookingCommit: BookingCommitApplicationResult,
  slotSearchApplication: Phase4SlotSearchApplication | undefined,
  input: Pick<
    RefreshReminderPlanInput,
    "appointmentStartAt" | "appointmentEndAt" | "appointmentTimeZone"
  >,
) {
  if (input.appointmentStartAt && input.appointmentEndAt) {
    return {
      appointmentStartAt: ensureIsoTimestamp(input.appointmentStartAt, "appointmentStartAt"),
      appointmentEndAt: ensureIsoTimestamp(input.appointmentEndAt, "appointmentEndAt"),
      appointmentTimeZone: optionalRef(input.appointmentTimeZone) ?? "Europe/London",
    };
  }
  invariant(
    slotSearchApplication,
    "SLOT_SEARCH_APPLICATION_REQUIRED",
    "slotSearchApplication is required when appointment timing overrides are not supplied.",
  );
  return slotSearchApplication
    .queryCurrentSlotSearch({ bookingCaseId: bookingCommit.bookingCase.bookingCase.bookingCaseId })
    .then((searchResult) => {
      invariant(
        searchResult,
        "BOOKING_SLOT_SEARCH_NOT_FOUND",
        "Current slot search snapshot is required.",
      );
      const target = searchResult.normalizedSlots.find(
        (slot) => slot.normalizedSlotId === bookingCommit.transaction.selectedSlotRef,
      );
      invariant(target, "BOOKING_SELECTED_SLOT_NOT_FOUND", "Selected normalized slot is required.");
      return {
        appointmentStartAt: target.startAt,
        appointmentEndAt: target.endAt,
        appointmentTimeZone: optionalRef(input.appointmentTimeZone) ?? "Europe/London",
      };
    });
}

async function updateReminderExposureState(input: {
  bookingCommitApplication: Phase4BookingCommitApplication;
  bookingCaseId: string;
  reminderExposureState: "blocked" | "scheduled";
  commandSettlementRecordRef: string;
  generatedAt: string;
  truthBasisSuffix: string;
}) {
  const currentRef =
    await input.bookingCommitApplication.bookingCommitRepositories.getCurrentBookingConfirmationTruthProjectionRef(
      input.bookingCaseId,
    );
  invariant(
    currentRef,
    "BOOKING_CONFIRMATION_TRUTH_NOT_FOUND",
    `Current BookingConfirmationTruthProjection for ${input.bookingCaseId} was not found.`,
  );
  const currentDocument =
    await input.bookingCommitApplication.bookingCommitRepositories.getBookingConfirmationTruthProjection(
      currentRef,
    );
  invariant(
    currentDocument,
    "BOOKING_CONFIRMATION_TRUTH_POINTER_DRIFT",
    `BookingConfirmationTruthProjection ${currentRef} was not found.`,
  );
  const current = currentDocument.toSnapshot();
  if (current.reminderExposureState === input.reminderExposureState) {
    return current;
  }
  const next = {
    ...current,
    reminderExposureState: input.reminderExposureState,
    commandSettlementRecordRef: input.commandSettlementRecordRef,
    truthBasisHash: sha256({
      priorTruthBasisHash: current.truthBasisHash,
      reminderExposureState: input.reminderExposureState,
      truthBasisSuffix: input.truthBasisSuffix,
    }),
    settlementRevision: current.settlementRevision + 1,
    generatedAt: input.generatedAt,
    version: current.version + 1,
  };
  await input.bookingCommitApplication.bookingCommitRepositories.saveBookingConfirmationTruthProjection(
    next,
    {
      expectedVersion: current.version,
    },
  );
  return next;
}

async function maybeOpenRepairJourney(input: {
  reachabilityGovernor: ReturnType<typeof createReachabilityGovernorService>;
  reachabilityRepositories: ReachabilityDependencies;
  reachabilityDependencyRef: string | null;
  issuedAt: string;
}): Promise<ContactRouteRepairJourney | null> {
  if (!input.reachabilityDependencyRef) {
    return null;
  }
  const currentDependency = await input.reachabilityRepositories.getReachabilityDependency(
    input.reachabilityDependencyRef,
  );
  if (!currentDependency) {
    return null;
  }
  const currentAssessment = await input.reachabilityRepositories.getReachabilityAssessment(
    currentDependency.toSnapshot().currentReachabilityAssessmentRef,
  );
  if (!currentAssessment || currentAssessment.toSnapshot().assessmentState === "clear") {
    return null;
  }
  const opened = await input.reachabilityGovernor.openRepairJourney({
    reachabilityDependencyRef: input.reachabilityDependencyRef,
    issuedAt: input.issuedAt,
    patientRecoveryLoopRef: "booking_manage_contact_route_repair",
  });
  return opened.journey.toSnapshot();
}

export interface Phase4BookingReminderApplication {
  reminderRepositories: ReminderRepositories;
  communicationRepositories: Phase1ConfirmationDispatchRepositories;
  communication: ReturnType<typeof createPhase1ConfirmationDispatchService>;
  reachabilityRepositories: ReachabilityDependencies;
  reachabilityGovernor: ReturnType<typeof createReachabilityGovernorService>;
  migrationPlanRef: (typeof phase4BookingReminderMigrationPlanRefs)[number];
  migrationPlanRefs: typeof phase4BookingReminderMigrationPlanRefs;
  queryCurrentReminderPlan(
    input: QueryCurrentReminderPlanInput,
  ): Promise<ReminderPlanApplicationResult | null>;
  createOrRefreshReminderPlan(
    input: RefreshReminderPlanInput,
  ): Promise<ReminderPlanApplicationResult>;
  sweepDueReminderSchedules(
    input: SweepDueReminderSchedulesInput,
  ): Promise<ReminderPlanApplicationResult>;
  suppressReminderPlan(input: SuppressReminderPlanInput): Promise<ReminderPlanApplicationResult>;
  recordReminderTransportOutcome(
    input: RecordReminderTransportOutcomeInput,
  ): Promise<ReminderPlanApplicationResult>;
  recordReminderDeliveryEvidence(
    input: RecordReminderDeliveryEvidenceInput,
  ): Promise<ReminderPlanApplicationResult>;
  markReminderRepairRequired(
    input: MarkReminderRepairRequiredInput,
  ): Promise<ReminderPlanApplicationResult>;
}

export function createPhase4BookingReminderApplication(options?: {
  repositories?: ReminderRepositories;
  communicationRepositories?: Phase1ConfirmationDispatchRepositories;
  reachabilityRepositories?: ReachabilityDependencies;
  bookingCommitApplication?: Phase4BookingCommitApplication;
  slotSearchApplication?: Phase4SlotSearchApplication;
  idGenerator?: BackboneIdGenerator;
}): Phase4BookingReminderApplication {
  const reminderRepositories = options?.repositories ?? createPhase4BookingReminderStore();
  const communicationRepositories =
    options?.communicationRepositories ?? createPhase1ConfirmationDispatchStore();
  const reachabilityRepositories = options?.reachabilityRepositories ?? createReachabilityStore();
  const idGenerator =
    options?.idGenerator ??
    createDeterministicBackboneIdGenerator("command_api_phase4_booking_reminders");
  const communication = createPhase1ConfirmationDispatchService({
    repositories: communicationRepositories,
    idGenerator,
  });
  const reachabilityGovernor = createReachabilityGovernorService(
    reachabilityRepositories,
    idGenerator,
  );

  async function resolveCommitContext(
    bookingCaseId: string,
  ): Promise<BookingCommitApplicationResult> {
    invariant(
      options?.bookingCommitApplication,
      "BOOKING_COMMIT_APPLICATION_REQUIRED",
      "bookingCommitApplication is required for reminder plan orchestration.",
    );
    const bundle = await options.bookingCommitApplication.queryCurrentBookingCommit({
      bookingCaseId,
    });
    invariant(
      bundle,
      "BOOKING_COMMIT_BUNDLE_NOT_FOUND",
      `Booking case ${bookingCaseId} was not found.`,
    );
    return bundle;
  }

  async function getCurrentPlanForBookingCase(
    bookingCaseId: string,
  ): Promise<ReminderPlanSnapshot | null> {
    const currentRef =
      await reminderRepositories.getCurrentReminderPlanRefForBookingCase(bookingCaseId);
    if (!currentRef) {
      return null;
    }
    const current = await reminderRepositories.getReminderPlan(currentRef);
    return current?.toSnapshot() ?? null;
  }

  async function buildResult(
    reminderPlan: ReminderPlanSnapshot,
    emittedEvents: readonly FoundationEventEnvelope<unknown>[],
    replayed = false,
  ): Promise<ReminderPlanApplicationResult> {
    const schedules = (
      await reminderRepositories.listReminderScheduleEntries(reminderPlan.reminderPlanId)
    ).map((document) => document.toSnapshot());
    const communicationEnvelope = reminderPlan.communicationEnvelopeRef
      ? ((
          await communication.getCommunicationEnvelope(reminderPlan.communicationEnvelopeRef)
        )?.toSnapshot() ?? null)
      : null;
    const receiptBridge = reminderPlan.communicationEnvelopeRef
      ? ((
          await communication.getReceiptBridgeForCommunicationEnvelope(
            reminderPlan.communicationEnvelopeRef,
          )
        )?.toSnapshot() ?? null)
      : null;
    const repairJourney = reminderPlan.repairJourneyRef
      ? ((
          await reachabilityRepositories.getContactRouteRepairJourney(reminderPlan.repairJourneyRef)
        )?.toSnapshot() ?? null)
      : null;
    const reachabilityAssessment = reminderPlan.currentReachabilityAssessmentRef
      ? ((
          await reachabilityRepositories.getReachabilityAssessment(
            reminderPlan.currentReachabilityAssessmentRef,
          )
        )?.toSnapshot() ?? null)
      : null;
    return {
      reminderPlan,
      scheduleEntries: schedules,
      communicationEnvelope,
      receiptBridge,
      repairJourney,
      reachabilityAssessment,
      replayed,
      emittedEvents,
    };
  }

  async function bindRouteTruth(input: {
    bookingCommit: BookingCommitApplicationResult;
    currentPlan: ReminderPlanSnapshot | null;
    refreshedAt: string;
    appointmentDeadlineAt: string;
    channel: Phase1ConfirmationPreferredChannel;
    contactRoute: ReminderContactRouteInput;
  }) {
    const channel = requireReminderChannel(input.channel, input.contactRoute.routeKind);
    const frozen = await reachabilityGovernor.freezeContactRouteSnapshot({
      subjectRef: input.contactRoute.subjectRef,
      routeRef: input.contactRoute.routeRef,
      routeVersionRef: input.contactRoute.routeVersionRef,
      routeKind: input.contactRoute.routeKind,
      normalizedAddressRef: input.contactRoute.normalizedAddressRef,
      preferenceProfileRef: input.contactRoute.preferenceProfileRef,
      verificationCheckpointRef: null,
      verificationState: input.contactRoute.verificationState,
      demographicFreshnessState: input.contactRoute.demographicFreshnessState,
      preferenceFreshnessState: input.contactRoute.preferenceFreshnessState,
      sourceAuthorityClass: input.contactRoute.sourceAuthorityClass,
      createdAt: input.refreshedAt,
    });

    let dependencyResult: {
      dependency: Awaited<
        ReturnType<typeof reachabilityRepositories.getReachabilityDependency>
      > extends infer T
        ? T extends { toSnapshot(): infer S }
          ? { toSnapshot(): S }
          : never
        : never;
      assessment: Awaited<
        ReturnType<typeof reachabilityRepositories.getReachabilityAssessment>
      > extends infer T
        ? T extends { toSnapshot(): infer S }
          ? { toSnapshot(): S }
          : never
        : never;
    } | null = null;

    if (
      input.currentPlan?.reachabilityDependencyRef &&
      input.currentPlan.contactRouteRef === input.contactRoute.routeRef
    ) {
      const refreshed = await reachabilityGovernor.refreshDependencyAssessment({
        reachabilityDependencyRef: input.currentPlan.reachabilityDependencyRef,
        contactRouteSnapshotRef: frozen.snapshot.contactRouteSnapshotId,
        assessedAt: input.refreshedAt,
      });
      dependencyResult = {
        dependency: refreshed.dependency,
        assessment: refreshed.assessment,
      };
    } else {
      const created = await reachabilityGovernor.createDependency({
        episodeId: input.bookingCommit.bookingCase.bookingIntent.episodeRef,
        requestId: input.bookingCommit.bookingCase.bookingIntent.requestId,
        domain: "booking",
        domainObjectRef:
          input.currentPlan?.reminderPlanId ??
          deterministicId("reminder_plan", {
            bookingCaseId: input.bookingCommit.bookingCase.bookingCase.bookingCaseId,
            appointmentRecordRef: input.bookingCommit.appointmentRecord?.appointmentRecordId,
          }),
        requiredRouteRef: input.contactRoute.routeRef,
        purpose: "outcome_confirmation",
        blockedActionScopeRefs: ["appointment_manage_entry"],
        selectedAnchorRef: "appointment_reminders",
        requestReturnBundleRef: `booking_case_return::${input.bookingCommit.bookingCase.bookingCase.bookingCaseId}`,
        resumeContinuationRef: "booking_manage_contact_route_repair",
        deadlineAt: input.appointmentDeadlineAt,
        failureEffect: "requeue",
        assessedAt: input.refreshedAt,
      });
      dependencyResult = {
        dependency: created.dependency,
        assessment: created.assessment,
      };
    }

    const repairJourney =
      dependencyResult.assessment.toSnapshot().assessmentState === "clear"
        ? null
        : await maybeOpenRepairJourney({
            reachabilityGovernor,
            reachabilityRepositories,
            reachabilityDependencyRef: dependencyResult.dependency.toSnapshot().dependencyId,
            issuedAt: input.refreshedAt,
          });

    return {
      channel,
      maskedDestination: input.contactRoute.maskedDestination,
      preferenceProfileRef: input.contactRoute.preferenceProfileRef,
      frozenSnapshotRef: frozen.snapshot.contactRouteSnapshotId,
      dependencyRef: dependencyResult.dependency.toSnapshot().dependencyId,
      assessmentRef: dependencyResult.assessment.toSnapshot().reachabilityAssessmentId,
      reachabilityEpoch: dependencyResult.dependency.toSnapshot().reachabilityEpoch,
      repairJourneyRef: repairJourney?.repairJourneyId ?? null,
      assessment: dependencyResult.assessment.toSnapshot(),
    };
  }

  async function cancelSupersededSchedules(
    existingPlan: ReminderPlanSnapshot,
    recordedAt: string,
    reasonCodes: readonly string[],
  ): Promise<ReminderScheduleEntrySnapshot[]> {
    const currentEntries = (
      await reminderRepositories.listReminderScheduleEntries(existingPlan.reminderPlanId)
    ).map((document) => document.toSnapshot());
    const updatedEntries: ReminderScheduleEntrySnapshot[] = [];
    for (const entry of currentEntries) {
      if (entry.state === "completed" || entry.state === "cancelled") {
        updatedEntries.push(entry);
        continue;
      }
      const nextEntry = normalizeReminderScheduleEntry({
        ...entry,
        state: "cancelled",
        deliveryEvidenceState:
          entry.deliveryEvidenceState === "delivered" ? entry.deliveryEvidenceState : "suppressed",
        authoritativeOutcomeState: "suppressed",
        reasonCodes: uniqueSortedRefs([...entry.reasonCodes, ...reasonCodes]),
        nextAttemptAt: null,
        updatedAt: recordedAt,
        version: entry.version + 1,
      });
      await reminderRepositories.saveReminderScheduleEntry(nextEntry, {
        expectedVersion: entry.version,
      });
      updatedEntries.push(nextEntry);
      if (entry.communicationEnvelopeRef) {
        await communication.refreshRouteTruth({
          communicationEnvelopeRef: entry.communicationEnvelopeRef,
          routeAuthorityState: "superseded",
          reachabilityAssessmentState: "blocked",
          deliveryRiskState: "disputed",
          reasonCodes: uniqueSortedRefs([...entry.reasonCodes, ...reasonCodes]),
          recordedAt,
        });
      }
    }
    return updatedEntries;
  }

  async function recordJournalEntry(input: {
    reminderPlanRef: string;
    reminderScheduleEntryRef?: string | null;
    actionScope: ReminderTransitionJournalEntrySnapshot["actionScope"];
    previousScheduleState: ReminderPlanScheduleState | "none";
    nextScheduleState: ReminderPlanScheduleState;
    previousOutcomeState: ReminderPlanAuthoritativeOutcomeState | "none";
    nextOutcomeState: ReminderPlanAuthoritativeOutcomeState;
    reasonCodes: readonly string[];
    commandActionRecordRef: string;
    commandSettlementRecordRef: string;
    payloadArtifactRef: string;
    edgeCorrelationId: string;
    recordedAt: string;
  }) {
    const current = await reminderRepositories.listReminderTransitionJournalEntries(
      input.reminderPlanRef,
    );
    await reminderRepositories.saveReminderTransitionJournalEntry(
      normalizeReminderJournalEntry({
        reminderTransitionJournalEntryId: (
          idGenerator.nextId as unknown as (value: string) => string
        )("phase4ReminderTransitionJournalEntry"),
        reminderPlanRef: input.reminderPlanRef,
        reminderScheduleEntryRef: input.reminderScheduleEntryRef ?? null,
        actionScope: input.actionScope,
        previousScheduleState: input.previousScheduleState,
        nextScheduleState: input.nextScheduleState,
        previousOutcomeState: input.previousOutcomeState,
        nextOutcomeState: input.nextOutcomeState,
        reasonCodes: input.reasonCodes,
        commandActionRecordRef: input.commandActionRecordRef,
        commandSettlementRecordRef: input.commandSettlementRecordRef,
        payloadArtifactRef: input.payloadArtifactRef,
        edgeCorrelationId: input.edgeCorrelationId,
        recordedAt: input.recordedAt,
        version: current.length + 1,
      }),
    );
  }

  async function persistPlan(
    currentPlan: ReminderPlanSnapshot | null,
    nextPlan: ReminderPlanSnapshot,
  ): Promise<void> {
    await reminderRepositories.saveReminderPlan(nextPlan, {
      expectedVersion: currentPlan?.version,
    });
    await reminderRepositories.setCurrentReminderPlanRefForBookingCase(
      nextPlan.bookingCaseRef,
      nextPlan.reminderPlanId,
    );
    await reminderRepositories.setCurrentReminderPlanRefForAppointment(
      nextPlan.appointmentRecordRef,
      nextPlan.reminderPlanId,
    );
  }

  async function suppressForTruthDrift(
    currentPlan: ReminderPlanSnapshot,
    input: {
      commandActionRecordRef: string;
      commandSettlementRecordRef: string;
      recordedAt: string;
      reasonCodes: readonly string[];
      payloadArtifactRef: string;
      edgeCorrelationId: string;
    },
  ) {
    await cancelSupersededSchedules(currentPlan, input.recordedAt, input.reasonCodes);
    const updatedEntries = (
      await reminderRepositories.listReminderScheduleEntries(currentPlan.reminderPlanId)
    ).map((document) => document.toSnapshot());
    const aggregated = aggregatePlanState(
      updatedEntries,
      currentPlan.deliveryRiskState,
      uniqueSortedRefs([...currentPlan.suppressionReasonRefs, ...input.reasonCodes]),
    );
    const nextPlan = normalizeReminderPlan({
      ...currentPlan,
      ...aggregated,
      scheduleState: "cancelled",
      deliveryEvidenceState: "suppressed",
      authoritativeOutcomeState: "suppressed",
      suppressionReasonRefs: uniqueSortedRefs([
        ...currentPlan.suppressionReasonRefs,
        ...input.reasonCodes,
      ]),
      updatedAt: input.recordedAt,
      monotoneRevision: currentPlan.monotoneRevision + 1,
      version: currentPlan.version + 1,
    });
    await persistPlan(currentPlan, nextPlan);
    if (options?.bookingCommitApplication) {
      await updateReminderExposureState({
        bookingCommitApplication: options.bookingCommitApplication,
        bookingCaseId: nextPlan.bookingCaseRef,
        reminderExposureState: "blocked",
        commandSettlementRecordRef: input.commandSettlementRecordRef,
        generatedAt: input.recordedAt,
        truthBasisSuffix: nextPlan.reminderPlanId,
      });
    }
    await recordJournalEntry({
      reminderPlanRef: nextPlan.reminderPlanId,
      actionScope: "suppress",
      previousScheduleState: currentPlan.scheduleState,
      nextScheduleState: nextPlan.scheduleState,
      previousOutcomeState: currentPlan.authoritativeOutcomeState,
      nextOutcomeState: nextPlan.authoritativeOutcomeState,
      reasonCodes: input.reasonCodes,
      commandActionRecordRef: input.commandActionRecordRef,
      commandSettlementRecordRef: input.commandSettlementRecordRef,
      payloadArtifactRef: input.payloadArtifactRef,
      edgeCorrelationId: input.edgeCorrelationId,
      recordedAt: input.recordedAt,
    });
    return buildResult(nextPlan, [], false);
  }

  const application: Phase4BookingReminderApplication = {
    reminderRepositories,
    communicationRepositories,
    communication,
    reachabilityRepositories,
    reachabilityGovernor,
    migrationPlanRef: phase4BookingReminderMigrationPlanRefs.at(-1)!,
    migrationPlanRefs: phase4BookingReminderMigrationPlanRefs,
    async queryCurrentReminderPlan({ bookingCaseId }) {
      const current = await getCurrentPlanForBookingCase(bookingCaseId);
      return current ? buildResult(current, [], true) : null;
    },
    async createOrRefreshReminderPlan(input) {
      const refreshedAt = ensureIsoTimestamp(input.refreshedAt, "refreshedAt");
      const bookingCommit = await resolveCommitContext(input.bookingCaseId);
      const currentPlan = await getCurrentPlanForBookingCase(input.bookingCaseId);

      if (
        bookingCommit.confirmationTruthProjection.confirmationTruthState !== "confirmed" ||
        bookingCommit.appointmentRecord === null ||
        bookingCommit.appointmentRecord.appointmentStatus !== "booked"
      ) {
        invariant(
          currentPlan,
          "BOOKING_CONFIRMATION_NOT_CONFIRMED",
          "Reminder plans require confirmed booking truth.",
        );
        return suppressForTruthDrift(currentPlan, {
          commandActionRecordRef: input.commandActionRecordRef,
          commandSettlementRecordRef: input.commandSettlementRecordRef,
          recordedAt: refreshedAt,
          reasonCodes: ["confirmation_truth_not_confirmed"],
          payloadArtifactRef:
            optionalRef(input.payloadArtifactRef) ??
            `artifact://booking/reminder/${currentPlan.reminderPlanId}/suppress`,
          edgeCorrelationId:
            optionalRef(input.edgeCorrelationId) ??
            `edge_booking_reminder_suppress_${currentPlan.reminderPlanId}`,
        });
      }

      const reminderPlanId =
        currentPlan?.reminderPlanId ??
        deterministicId("reminder_plan", {
          bookingCaseId: input.bookingCaseId,
          appointmentRecordRef: bookingCommit.appointmentRecord.appointmentRecordId,
        });
      const appointmentTiming = await deriveAppointmentTiming(
        bookingCommit,
        options?.slotSearchApplication,
        input,
      );
      const routeBinding = await bindRouteTruth({
        bookingCommit,
        currentPlan,
        refreshedAt,
        appointmentDeadlineAt: appointmentTiming.appointmentStartAt,
        channel: input.channel,
        contactRoute: input.contactRoute,
      });
      const causalToken = sha256({
        reminderPlanId,
        appointmentRecordRef: bookingCommit.appointmentRecord.appointmentRecordId,
        confirmationTruthRef:
          bookingCommit.confirmationTruthProjection.bookingConfirmationTruthProjectionId,
        contactRouteVersionRef: input.contactRoute.routeVersionRef,
        contactRouteVerificationState: input.contactRoute.verificationState,
        demographicFreshnessState: input.contactRoute.demographicFreshnessState,
        preferenceFreshnessState: input.contactRoute.preferenceFreshnessState,
        sourceAuthorityClass: input.contactRoute.sourceAuthorityClass,
        templateVersionRef: input.templateVersionRef,
        routeProfileRef: input.routeProfileRef,
        channel: input.channel,
        scheduleOffsetsMinutesBeforeStart: [...input.scheduleOffsetsMinutesBeforeStart],
        payloadRef: input.payloadRef,
        payloadHash: sha256(input.payload ?? input.payloadRef),
      });

      if (currentPlan && currentPlan.causalToken === causalToken) {
        return buildResult(currentPlan, [], true);
      }

      if (currentPlan) {
        await cancelSupersededSchedules(currentPlan, refreshedAt, ["reminder_plan_superseded"]);
      }

      const initialScheduleState = scheduleStateFromAssessment(routeBinding.assessment);
      const initialOutcomeState = outcomeStateFromAssessment(routeBinding.assessment);
      const initialDeliveryState: ReminderPlanDeliveryEvidenceState =
        initialScheduleState === "scheduled" ? "pending" : "suppressed";
      const scheduleEntries = buildScheduleEntries({
        reminderPlanId,
        causalToken,
        appointmentStartAt: appointmentTiming.appointmentStartAt,
        refreshedAt,
        scheduleOffsetsMinutesBeforeStart: input.scheduleOffsetsMinutesBeforeStart,
        initialState: initialScheduleState,
        initialOutcomeState,
        initialDeliveryState,
      });
      for (const entry of scheduleEntries) {
        await reminderRepositories.saveReminderScheduleEntry(entry);
      }

      const aggregated = aggregatePlanState(
        scheduleEntries,
        reminderRiskFromAssessment(routeBinding.assessment),
        initialScheduleState === "scheduled"
          ? []
          : dominantReasonCodesFromAssessment(routeBinding.assessment),
      );
      const nextPlan = normalizeReminderPlan({
        reminderPlanId,
        schemaVersion: PHASE4_BOOKING_REMINDER_SCHEMA_VERSION,
        bookingCaseRef: input.bookingCaseId,
        appointmentRecordRef: bookingCommit.appointmentRecord.appointmentRecordId,
        confirmationTruthRef:
          bookingCommit.confirmationTruthProjection.bookingConfirmationTruthProjectionId,
        requestRef: bookingCommit.bookingCase.bookingIntent.requestId,
        requestLineageRef: bookingCommit.bookingCase.bookingIntent.requestLineageRef,
        sourceTaskRef: bookingCommit.bookingCase.bookingIntent.sourceTriageTaskRef,
        selectedSlotRef: bookingCommit.transaction.selectedSlotRef,
        appointmentStartAt: appointmentTiming.appointmentStartAt,
        appointmentEndAt: appointmentTiming.appointmentEndAt,
        appointmentTimeZone: appointmentTiming.appointmentTimeZone,
        templateSetRef: requireRef(input.templateSetRef, "templateSetRef"),
        templateVersionRef: requireRef(input.templateVersionRef, "templateVersionRef"),
        routeProfileRef: requireRef(input.routeProfileRef, "routeProfileRef"),
        channel: routeBinding.channel,
        payloadRef: requireRef(input.payloadRef, "payloadRef"),
        payloadHash: sha256(input.payload ?? input.payloadRef),
        maskedDestination: routeBinding.maskedDestination,
        preferenceProfileRef: routeBinding.preferenceProfileRef,
        contactRouteRef: input.contactRoute.routeRef,
        contactRouteVersionRef: input.contactRoute.routeVersionRef,
        currentContactRouteSnapshotRef: routeBinding.frozenSnapshotRef,
        reachabilityDependencyRef: routeBinding.dependencyRef,
        currentReachabilityAssessmentRef: routeBinding.assessmentRef,
        reachabilityEpoch: routeBinding.reachabilityEpoch,
        repairJourneyRef: routeBinding.repairJourneyRef,
        communicationEnvelopeRef: null,
        scheduleRefs: scheduleEntries.map((entry) => entry.scheduleRef),
        scheduleState: aggregated.scheduleState,
        transportAckState: aggregated.transportAckState,
        deliveryEvidenceState: aggregated.deliveryEvidenceState,
        deliveryRiskState: aggregated.deliveryRiskState,
        authoritativeOutcomeState: aggregated.authoritativeOutcomeState,
        suppressionReasonRefs: aggregated.suppressionReasonRefs,
        deliveryEvidenceRefs: aggregated.deliveryEvidenceRefs,
        lastDeliveryAttemptAt: aggregated.lastDeliveryAttemptAt,
        nextAttemptAt: aggregated.nextAttemptAt,
        causalToken,
        monotoneRevision: (currentPlan?.monotoneRevision ?? 0) + 1,
        createdAt: currentPlan?.createdAt ?? refreshedAt,
        updatedAt: refreshedAt,
        version: (currentPlan?.version ?? 0) + 1,
      });
      await persistPlan(currentPlan, nextPlan);
      if (options?.bookingCommitApplication) {
        await bindReminderPlanToAppointmentRecord({
          bookingCommitApplication: options.bookingCommitApplication,
          appointmentRecordRef: nextPlan.appointmentRecordRef,
          reminderPlanRef: nextPlan.reminderPlanId,
          updatedAt: refreshedAt,
        });
        await updateReminderExposureState({
          bookingCommitApplication: options.bookingCommitApplication,
          bookingCaseId: input.bookingCaseId,
          reminderExposureState: confirmationReminderExposureStateForPlan(
            nextPlan.authoritativeOutcomeState,
          ),
          commandSettlementRecordRef: input.commandSettlementRecordRef,
          generatedAt: refreshedAt,
          truthBasisSuffix: nextPlan.reminderPlanId,
        });
      }
      await recordJournalEntry({
        reminderPlanRef: nextPlan.reminderPlanId,
        actionScope: "refresh_plan",
        previousScheduleState: currentPlan?.scheduleState ?? "none",
        nextScheduleState: nextPlan.scheduleState,
        previousOutcomeState: currentPlan?.authoritativeOutcomeState ?? "none",
        nextOutcomeState: nextPlan.authoritativeOutcomeState,
        reasonCodes:
          nextPlan.scheduleState === "scheduled"
            ? []
            : dominantReasonCodesFromAssessment(routeBinding.assessment),
        commandActionRecordRef: input.commandActionRecordRef,
        commandSettlementRecordRef: input.commandSettlementRecordRef,
        payloadArtifactRef:
          optionalRef(input.payloadArtifactRef) ??
          `artifact://booking/reminder/${reminderPlanId}/refresh`,
        edgeCorrelationId:
          optionalRef(input.edgeCorrelationId) ?? `edge_booking_reminder_refresh_${reminderPlanId}`,
        recordedAt: refreshedAt,
      });

      const emittedEvents =
        nextPlan.scheduleState === "scheduled"
          ? [
              makeFoundationEvent("booking.reminders.scheduled", {
                governingRef: nextPlan.bookingCaseRef,
                governingVersionRef: nextPlan.reminderPlanId,
                previousState: currentPlan?.scheduleState ?? "none",
                nextState: nextPlan.scheduleState,
                stateAxis: "booking_reminder_plan",
                appointmentRecordRef: nextPlan.appointmentRecordRef,
                confirmationTruthRef: nextPlan.confirmationTruthRef,
                reminderPlanRef: nextPlan.reminderPlanId,
                scheduleRefs: nextPlan.scheduleRefs,
              }),
            ]
          : [];

      return buildResult(nextPlan, emittedEvents, false);
    },
    async sweepDueReminderSchedules(input) {
      const planDocument = await reminderRepositories.getReminderPlan(input.reminderPlanId);
      invariant(
        planDocument,
        "REMINDER_PLAN_NOT_FOUND",
        `ReminderPlan ${input.reminderPlanId} was not found.`,
      );
      const currentPlan = planDocument.toSnapshot();
      const bookingCommit = await resolveCommitContext(currentPlan.bookingCaseRef);
      if (
        bookingCommit.confirmationTruthProjection.confirmationTruthState !== "confirmed" ||
        bookingCommit.appointmentRecord?.appointmentRecordId !== currentPlan.appointmentRecordRef ||
        bookingCommit.appointmentRecord?.appointmentStatus !== "booked"
      ) {
        return suppressForTruthDrift(currentPlan, {
          commandActionRecordRef: input.commandActionRecordRef,
          commandSettlementRecordRef: input.commandSettlementRecordRef,
          recordedAt: ensureIsoTimestamp(input.sweptAt, "sweptAt"),
          reasonCodes: ["appointment_truth_drifted"],
          payloadArtifactRef:
            optionalRef(input.payloadArtifactRef) ??
            `artifact://booking/reminder/${currentPlan.reminderPlanId}/truth-drift`,
          edgeCorrelationId:
            optionalRef(input.edgeCorrelationId) ??
            `edge_booking_reminder_truth_drift_${currentPlan.reminderPlanId}`,
        });
      }

      const recordedAt = ensureIsoTimestamp(input.sweptAt, "sweptAt");
      let effectivePlan = currentPlan;
      if (input.contactRoute) {
        const rebound = await application.createOrRefreshReminderPlan({
          bookingCaseId: currentPlan.bookingCaseRef,
          commandActionRecordRef: input.commandActionRecordRef,
          commandSettlementRecordRef: input.commandSettlementRecordRef,
          actorRef: "system",
          templateSetRef: currentPlan.templateSetRef,
          templateVersionRef: currentPlan.templateVersionRef,
          routeProfileRef: currentPlan.routeProfileRef,
          channel: currentPlan.channel,
          payloadRef: currentPlan.payloadRef,
          payloadArtifactRef: input.payloadArtifactRef,
          edgeCorrelationId: input.edgeCorrelationId,
          scheduleOffsetsMinutesBeforeStart: (
            await reminderRepositories.listReminderScheduleEntries(currentPlan.reminderPlanId)
          ).map((document) => {
            const entry = document.toSnapshot();
            return Math.round(
              (Date.parse(currentPlan.appointmentStartAt) - Date.parse(entry.plannedSendAt)) /
                60_000,
            );
          }),
          refreshedAt: recordedAt,
          appointmentStartAt: currentPlan.appointmentStartAt,
          appointmentEndAt: currentPlan.appointmentEndAt,
          appointmentTimeZone: currentPlan.appointmentTimeZone,
          contactRoute: input.contactRoute,
        });
        effectivePlan = rebound.reminderPlan;
      }

      if (
        effectivePlan.scheduleState === "delivery_blocked" ||
        effectivePlan.scheduleState === "disputed" ||
        effectivePlan.scheduleState === "cancelled" ||
        effectivePlan.scheduleState === "completed"
      ) {
        return buildResult(effectivePlan, [], true);
      }

      const scheduleEntries = (
        await reminderRepositories.listReminderScheduleEntries(effectivePlan.reminderPlanId)
      ).map((document) => document.toSnapshot());
      const dueEntries = scheduleEntries.filter(
        (entry) => entry.state === "scheduled" && entry.plannedSendAt <= recordedAt,
      );
      if (dueEntries.length === 0) {
        return buildResult(effectivePlan, [], true);
      }

      const assessmentDocument = effectivePlan.currentReachabilityAssessmentRef
        ? await reachabilityRepositories.getReachabilityAssessment(
            effectivePlan.currentReachabilityAssessmentRef,
          )
        : null;
      invariant(
        assessmentDocument,
        "REMINDER_REACHABILITY_ASSESSMENT_REQUIRED",
        "Current reachability assessment is required before a reminder can queue.",
      );
      const assessment = assessmentDocument.toSnapshot();
      invariant(
        dispatchableAssessment(assessment),
        "REMINDER_ROUTE_NOT_DISPATCHABLE",
        "Reminder queueing requires current route authority and non-blocked reachability.",
      );

      const emittedEvents: FoundationEventEnvelope<unknown>[] = [];
      for (const entry of dueEntries) {
        const queued = await communication.queueConfirmationCommunication({
          requestRef: effectivePlan.requestRef,
          requestLineageRef: effectivePlan.requestLineageRef,
          triageTaskRef: effectivePlan.sourceTaskRef,
          receiptEnvelopeRef: entry.receiptEnvelopeRef,
          outcomeArtifactRef: effectivePlan.payloadRef,
          contactPreferencesRef: effectivePlan.preferenceProfileRef,
          routeSnapshotSeedRef: null,
          currentContactRouteSnapshotRef: effectivePlan.currentContactRouteSnapshotRef,
          currentReachabilityAssessmentRef: effectivePlan.currentReachabilityAssessmentRef,
          reachabilityDependencyRef: effectivePlan.reachabilityDependencyRef,
          preferredChannel: effectivePlan.channel,
          maskedDestination: effectivePlan.maskedDestination,
          templateVariantRef: effectivePlan.templateVersionRef,
          routeAuthorityState: routeAuthorityStateFromAssessment(assessment),
          reachabilityAssessmentState: assessment.assessmentState,
          deliveryRiskState: assessment.deliveryRiskState,
          enqueueIdempotencyKey: entry.queueIdempotencyKey,
          queuedAt: recordedAt,
        });
        emittedEvents.push(...queued.events);
        if (!queued.replayed) {
          const updatedEntry = normalizeReminderScheduleEntry({
            ...entry,
            state: "queued",
            communicationEnvelopeRef: queued.envelope.communicationEnvelopeId,
            transportAckState: "none",
            deliveryEvidenceState: "pending",
            authoritativeOutcomeState: "awaiting_delivery_truth",
            nextAttemptAt: recordedAt,
            updatedAt: recordedAt,
            version: entry.version + 1,
          });
          await reminderRepositories.saveReminderScheduleEntry(updatedEntry, {
            expectedVersion: entry.version,
          });
          await recordJournalEntry({
            reminderPlanRef: effectivePlan.reminderPlanId,
            reminderScheduleEntryRef: entry.reminderScheduleEntryId,
            actionScope: "queue_due_schedule",
            previousScheduleState: entry.state,
            nextScheduleState: updatedEntry.state,
            previousOutcomeState: entry.authoritativeOutcomeState,
            nextOutcomeState: updatedEntry.authoritativeOutcomeState,
            reasonCodes: [],
            commandActionRecordRef: input.commandActionRecordRef,
            commandSettlementRecordRef: input.commandSettlementRecordRef,
            payloadArtifactRef:
              optionalRef(input.payloadArtifactRef) ??
              `artifact://booking/reminder/${effectivePlan.reminderPlanId}/queue`,
            edgeCorrelationId:
              optionalRef(input.edgeCorrelationId) ??
              `edge_booking_reminder_queue_${effectivePlan.reminderPlanId}`,
            recordedAt,
          });
        }
      }

      const refreshedEntries = (
        await reminderRepositories.listReminderScheduleEntries(effectivePlan.reminderPlanId)
      ).map((document) => document.toSnapshot());
      const aggregated = aggregatePlanState(
        refreshedEntries,
        effectivePlan.deliveryRiskState,
        effectivePlan.suppressionReasonRefs,
      );
      const nextPlan = normalizeReminderPlan({
        ...effectivePlan,
        ...aggregated,
        updatedAt: recordedAt,
        monotoneRevision: effectivePlan.monotoneRevision + 1,
        version: effectivePlan.version + 1,
      });
      await persistPlan(effectivePlan, nextPlan);
      if (options?.bookingCommitApplication) {
        await updateReminderExposureState({
          bookingCommitApplication: options.bookingCommitApplication,
          bookingCaseId: nextPlan.bookingCaseRef,
          reminderExposureState: confirmationReminderExposureStateForPlan(
            nextPlan.authoritativeOutcomeState,
          ),
          commandSettlementRecordRef: input.commandSettlementRecordRef,
          generatedAt: recordedAt,
          truthBasisSuffix: nextPlan.reminderPlanId,
        });
      }
      return buildResult(nextPlan, emittedEvents, false);
    },
    async suppressReminderPlan(input) {
      const currentPlanDocument = await reminderRepositories.getReminderPlan(input.reminderPlanId);
      invariant(
        currentPlanDocument,
        "REMINDER_PLAN_NOT_FOUND",
        `ReminderPlan ${input.reminderPlanId} was not found.`,
      );
      return suppressForTruthDrift(currentPlanDocument.toSnapshot(), {
        commandActionRecordRef: input.commandActionRecordRef,
        commandSettlementRecordRef: input.commandSettlementRecordRef,
        recordedAt: ensureIsoTimestamp(input.suppressedAt, "suppressedAt"),
        reasonCodes: uniqueSortedRefs(input.reasonCodes),
        payloadArtifactRef:
          optionalRef(input.payloadArtifactRef) ??
          `artifact://booking/reminder/${input.reminderPlanId}/suppress`,
        edgeCorrelationId:
          optionalRef(input.edgeCorrelationId) ??
          `edge_booking_reminder_suppress_${input.reminderPlanId}`,
      });
    },
    async recordReminderTransportOutcome(input) {
      const currentPlanDocument = await reminderRepositories.getReminderPlan(input.reminderPlanId);
      invariant(
        currentPlanDocument,
        "REMINDER_PLAN_NOT_FOUND",
        `ReminderPlan ${input.reminderPlanId} was not found.`,
      );
      const currentPlan = currentPlanDocument.toSnapshot();
      const entryDocument = await reminderRepositories.getReminderScheduleEntry(
        input.reminderScheduleEntryId,
      );
      invariant(
        entryDocument,
        "REMINDER_SCHEDULE_ENTRY_NOT_FOUND",
        `ReminderScheduleEntry ${input.reminderScheduleEntryId} was not found.`,
      );
      const entry = entryDocument.toSnapshot();
      invariant(
        entry.reminderPlanRef === currentPlan.reminderPlanId,
        "REMINDER_PLAN_ENTRY_MISMATCH",
        "ReminderScheduleEntry does not belong to the supplied ReminderPlan.",
      );
      invariant(
        entry.communicationEnvelopeRef,
        "REMINDER_COMMUNICATION_ENVELOPE_REQUIRED",
        "ReminderScheduleEntry must have a communicationEnvelopeRef before transport settles.",
      );

      const recordedAt = ensureIsoTimestamp(input.recordedAt, "recordedAt");
      const result = await communication.dispatchQueuedConfirmation({
        communicationEnvelopeRef: entry.communicationEnvelopeRef,
        transportSettlementKey: input.transportSettlementKey,
        workerRunRef: requireRef(input.workerRunRef, "workerRunRef"),
        providerMode: input.providerMode,
        transportOutcome: input.transportOutcome,
        providerCorrelationRef: input.providerCorrelationRef ?? null,
        recordedAt,
        maxAttempts: input.maxAttempts ?? undefined,
        backoffSeconds: input.backoffSeconds ?? undefined,
      });
      if (result.replayed) {
        return buildResult(currentPlan, [], true);
      }

      const envelope = result.envelope.toSnapshot();
      const updatedEntry = normalizeReminderScheduleEntry({
        ...entry,
        state:
          envelope.transportAckState === "accepted"
            ? "sent"
            : envelope.queueState === "queued"
              ? "queued"
              : "delivery_blocked",
        latestTransportSettlementRef: result.transportSettlement?.transportSettlementId ?? null,
        lastProviderCorrelationRef:
          input.providerCorrelationRef ?? entry.lastProviderCorrelationRef,
        transportAckState:
          envelope.transportAckState === "accepted"
            ? "accepted"
            : envelope.transportAckState === "rejected"
              ? "rejected"
              : envelope.transportAckState === "timed_out"
                ? "timed_out"
                : "none",
        authoritativeOutcomeState:
          envelope.authoritativeOutcomeState === "awaiting_delivery_truth"
            ? "awaiting_delivery_truth"
            : envelope.authoritativeOutcomeState === "delivery_confirmed"
              ? "delivered"
              : "recovery_required",
        reasonCodes: envelope.reasonCodes,
        lastAttemptAt: recordedAt,
        nextAttemptAt: envelope.nextAttemptNotBeforeAt,
        updatedAt: recordedAt,
        version: entry.version + 1,
      });
      await reminderRepositories.saveReminderScheduleEntry(updatedEntry, {
        expectedVersion: entry.version,
      });

      const refreshedEntries = (
        await reminderRepositories.listReminderScheduleEntries(currentPlan.reminderPlanId)
      ).map((document) => document.toSnapshot());
      const aggregated = aggregatePlanState(
        refreshedEntries,
        currentPlan.deliveryRiskState,
        currentPlan.suppressionReasonRefs,
      );
      const nextPlan = normalizeReminderPlan({
        ...currentPlan,
        ...aggregated,
        updatedAt: recordedAt,
        monotoneRevision: currentPlan.monotoneRevision + 1,
        version: currentPlan.version + 1,
      });
      await persistPlan(currentPlan, nextPlan);
      if (options?.bookingCommitApplication) {
        await updateReminderExposureState({
          bookingCommitApplication: options.bookingCommitApplication,
          bookingCaseId: nextPlan.bookingCaseRef,
          reminderExposureState: confirmationReminderExposureStateForPlan(
            nextPlan.authoritativeOutcomeState,
          ),
          commandSettlementRecordRef: input.commandSettlementRecordRef,
          generatedAt: recordedAt,
          truthBasisSuffix: nextPlan.reminderPlanId,
        });
      }
      await recordJournalEntry({
        reminderPlanRef: nextPlan.reminderPlanId,
        reminderScheduleEntryRef: updatedEntry.reminderScheduleEntryId,
        actionScope: "transport_settlement",
        previousScheduleState: entry.state,
        nextScheduleState: updatedEntry.state,
        previousOutcomeState: entry.authoritativeOutcomeState,
        nextOutcomeState: updatedEntry.authoritativeOutcomeState,
        reasonCodes: updatedEntry.reasonCodes,
        commandActionRecordRef: input.commandActionRecordRef,
        commandSettlementRecordRef: input.commandSettlementRecordRef,
        payloadArtifactRef:
          optionalRef(input.payloadArtifactRef) ??
          `artifact://booking/reminder/${nextPlan.reminderPlanId}/transport`,
        edgeCorrelationId:
          optionalRef(input.edgeCorrelationId) ??
          `edge_booking_reminder_transport_${nextPlan.reminderPlanId}`,
        recordedAt,
      });
      return buildResult(nextPlan, result.events, false);
    },
    async recordReminderDeliveryEvidence(input) {
      const currentPlanDocument = await reminderRepositories.getReminderPlan(input.reminderPlanId);
      invariant(
        currentPlanDocument,
        "REMINDER_PLAN_NOT_FOUND",
        `ReminderPlan ${input.reminderPlanId} was not found.`,
      );
      const currentPlan = currentPlanDocument.toSnapshot();
      const entryDocument = await reminderRepositories.getReminderScheduleEntry(
        input.reminderScheduleEntryId,
      );
      invariant(
        entryDocument,
        "REMINDER_SCHEDULE_ENTRY_NOT_FOUND",
        `ReminderScheduleEntry ${input.reminderScheduleEntryId} was not found.`,
      );
      const entry = entryDocument.toSnapshot();
      invariant(
        entry.communicationEnvelopeRef,
        "REMINDER_COMMUNICATION_ENVELOPE_REQUIRED",
        "ReminderScheduleEntry must have a communicationEnvelopeRef before delivery evidence settles.",
      );
      const recordedAt = ensureIsoTimestamp(input.recordedAt, "recordedAt");
      const result = await communication.recordDeliveryEvidence({
        communicationEnvelopeRef: entry.communicationEnvelopeRef,
        deliveryEvidenceKey: requireRef(input.deliveryEvidenceKey, "deliveryEvidenceKey"),
        evidenceSource: input.evidenceSource,
        providerCorrelationRef: input.providerCorrelationRef ?? null,
        deliveryEvidenceState: input.deliveryEvidenceState,
        observedAt: ensureIsoTimestamp(input.observedAt, "observedAt"),
        recordedAt,
      });
      if (result.replayed) {
        return buildResult(currentPlan, [], true);
      }

      let repairJourneyRef = currentPlan.repairJourneyRef;
      let currentReachabilityAssessmentRef = currentPlan.currentReachabilityAssessmentRef;
      let reachabilityEpoch = currentPlan.reachabilityEpoch;
      let deliveryRiskState = currentPlan.deliveryRiskState;
      if (currentPlan.reachabilityDependencyRef && currentPlan.currentContactRouteSnapshotRef) {
        const observation =
          input.deliveryEvidenceState === "delivered"
            ? {
                observationClass: "delivery_receipt" as const,
                outcomePolarity: "positive" as const,
                authorityWeight: "moderate" as const,
              }
            : input.deliveryEvidenceState === "disputed"
              ? {
                  observationClass: "manual_dispute" as const,
                  outcomePolarity: "ambiguous" as const,
                  authorityWeight: "strong" as const,
                }
              : {
                  observationClass: "bounce" as const,
                  outcomePolarity: "negative" as const,
                  authorityWeight: "strong" as const,
                };
        await reachabilityGovernor.recordObservation({
          reachabilityDependencyRef: currentPlan.reachabilityDependencyRef,
          contactRouteSnapshotRef: currentPlan.currentContactRouteSnapshotRef,
          observationClass: observation.observationClass,
          observationSourceRef: "phase4-booking-reminders",
          observedAt: ensureIsoTimestamp(input.observedAt, "observedAt"),
          recordedAt,
          outcomePolarity: observation.outcomePolarity,
          authorityWeight: observation.authorityWeight,
          evidenceRef: result.deliveryEvidence.deliveryEvidenceId,
        });
        const refreshed = await reachabilityGovernor.refreshDependencyAssessment({
          reachabilityDependencyRef: currentPlan.reachabilityDependencyRef,
          assessedAt: recordedAt,
        });
        currentReachabilityAssessmentRef = refreshed.assessment.reachabilityAssessmentId;
        reachabilityEpoch = refreshed.dependency.toSnapshot().reachabilityEpoch;
        deliveryRiskState = reminderRiskFromAssessment(refreshed.assessment.toSnapshot());
        if (refreshed.assessment.toSnapshot().assessmentState !== "clear") {
          repairJourneyRef =
            (
              await maybeOpenRepairJourney({
                reachabilityGovernor,
                reachabilityRepositories,
                reachabilityDependencyRef: currentPlan.reachabilityDependencyRef,
                issuedAt: recordedAt,
              })
            )?.repairJourneyId ?? repairJourneyRef;
        }
      }

      const updatedEntry = normalizeReminderScheduleEntry({
        ...entry,
        state:
          input.deliveryEvidenceState === "delivered"
            ? "completed"
            : input.deliveryEvidenceState === "disputed"
              ? "disputed"
              : "delivery_blocked",
        latestDeliveryEvidenceRef: result.deliveryEvidence.deliveryEvidenceId,
        lastProviderCorrelationRef:
          input.providerCorrelationRef ?? entry.lastProviderCorrelationRef,
        deliveryEvidenceState:
          input.deliveryEvidenceState === "failed"
            ? "failed"
            : input.deliveryEvidenceState === "expired"
              ? "expired"
              : input.deliveryEvidenceState,
        authoritativeOutcomeState:
          input.deliveryEvidenceState === "delivered" ? "delivered" : "recovery_required",
        reasonCodes: result.envelope.toSnapshot().reasonCodes,
        lastAttemptAt: recordedAt,
        nextAttemptAt: null,
        updatedAt: recordedAt,
        version: entry.version + 1,
      });
      await reminderRepositories.saveReminderScheduleEntry(updatedEntry, {
        expectedVersion: entry.version,
      });

      const refreshedEntries = (
        await reminderRepositories.listReminderScheduleEntries(currentPlan.reminderPlanId)
      ).map((document) => document.toSnapshot());
      const aggregated = aggregatePlanState(
        refreshedEntries,
        deliveryRiskState,
        currentPlan.suppressionReasonRefs,
      );
      const nextPlan = normalizeReminderPlan({
        ...currentPlan,
        ...aggregated,
        repairJourneyRef,
        currentReachabilityAssessmentRef,
        reachabilityEpoch,
        updatedAt: recordedAt,
        monotoneRevision: currentPlan.monotoneRevision + 1,
        version: currentPlan.version + 1,
      });
      await persistPlan(currentPlan, nextPlan);
      if (options?.bookingCommitApplication) {
        await updateReminderExposureState({
          bookingCommitApplication: options.bookingCommitApplication,
          bookingCaseId: nextPlan.bookingCaseRef,
          reminderExposureState: confirmationReminderExposureStateForPlan(
            nextPlan.authoritativeOutcomeState,
          ),
          commandSettlementRecordRef: input.commandSettlementRecordRef,
          generatedAt: recordedAt,
          truthBasisSuffix: nextPlan.reminderPlanId,
        });
      }
      await recordJournalEntry({
        reminderPlanRef: nextPlan.reminderPlanId,
        reminderScheduleEntryRef: updatedEntry.reminderScheduleEntryId,
        actionScope: "delivery_evidence",
        previousScheduleState: entry.state,
        nextScheduleState: updatedEntry.state,
        previousOutcomeState: entry.authoritativeOutcomeState,
        nextOutcomeState: updatedEntry.authoritativeOutcomeState,
        reasonCodes: updatedEntry.reasonCodes,
        commandActionRecordRef: input.commandActionRecordRef,
        commandSettlementRecordRef: input.commandSettlementRecordRef,
        payloadArtifactRef:
          optionalRef(input.payloadArtifactRef) ??
          `artifact://booking/reminder/${nextPlan.reminderPlanId}/delivery`,
        edgeCorrelationId:
          optionalRef(input.edgeCorrelationId) ??
          `edge_booking_reminder_delivery_${nextPlan.reminderPlanId}`,
        recordedAt,
      });
      return buildResult(nextPlan, result.events, false);
    },
    async markReminderRepairRequired(input) {
      const currentPlanDocument = await reminderRepositories.getReminderPlan(input.reminderPlanId);
      invariant(
        currentPlanDocument,
        "REMINDER_PLAN_NOT_FOUND",
        `ReminderPlan ${input.reminderPlanId} was not found.`,
      );
      const currentPlan = currentPlanDocument.toSnapshot();
      const recordedAt = ensureIsoTimestamp(input.markedAt, "markedAt");
      const repairJourney =
        (await maybeOpenRepairJourney({
          reachabilityGovernor,
          reachabilityRepositories,
          reachabilityDependencyRef: currentPlan.reachabilityDependencyRef,
          issuedAt: recordedAt,
        })) ?? null;
      const nextPlan = normalizeReminderPlan({
        ...currentPlan,
        scheduleState: input.disputed ? "disputed" : "delivery_blocked",
        deliveryEvidenceState: input.disputed ? "disputed" : currentPlan.deliveryEvidenceState,
        deliveryRiskState: input.disputed ? "disputed" : "likely_failed",
        authoritativeOutcomeState: "recovery_required",
        repairJourneyRef: repairJourney?.repairJourneyId ?? currentPlan.repairJourneyRef,
        suppressionReasonRefs: uniqueSortedRefs([
          ...currentPlan.suppressionReasonRefs,
          ...input.reasonCodes,
        ]),
        updatedAt: recordedAt,
        monotoneRevision: currentPlan.monotoneRevision + 1,
        version: currentPlan.version + 1,
      });
      await persistPlan(currentPlan, nextPlan);
      if (options?.bookingCommitApplication) {
        await updateReminderExposureState({
          bookingCommitApplication: options.bookingCommitApplication,
          bookingCaseId: nextPlan.bookingCaseRef,
          reminderExposureState: "blocked",
          commandSettlementRecordRef: input.commandSettlementRecordRef,
          generatedAt: recordedAt,
          truthBasisSuffix: nextPlan.reminderPlanId,
        });
      }
      await recordJournalEntry({
        reminderPlanRef: nextPlan.reminderPlanId,
        actionScope: "repair_required",
        previousScheduleState: currentPlan.scheduleState,
        nextScheduleState: nextPlan.scheduleState,
        previousOutcomeState: currentPlan.authoritativeOutcomeState,
        nextOutcomeState: nextPlan.authoritativeOutcomeState,
        reasonCodes: input.reasonCodes,
        commandActionRecordRef: input.commandActionRecordRef,
        commandSettlementRecordRef: input.commandSettlementRecordRef,
        payloadArtifactRef:
          optionalRef(input.payloadArtifactRef) ??
          `artifact://booking/reminder/${nextPlan.reminderPlanId}/repair`,
        edgeCorrelationId:
          optionalRef(input.edgeCorrelationId) ??
          `edge_booking_reminder_repair_${nextPlan.reminderPlanId}`,
        recordedAt,
      });
      return buildResult(nextPlan, [], false);
    },
  };

  return application;
}
