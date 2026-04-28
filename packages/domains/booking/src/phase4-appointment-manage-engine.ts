import { createHash } from "node:crypto";
import {
  RequestBackboneInvariantError,
  type CompareAndSetWriteOptions,
} from "@vecells/domain-kernel";
import {
  makeFoundationEvent,
  type FoundationEventEnvelope,
} from "@vecells/event-contracts";
import type { AppointmentRecordSnapshot } from "./phase4-booking-commit-engine";

function invariant(condition: unknown, code: string, message: string): asserts condition {
  if (!condition) {
    throw new RequestBackboneInvariantError(code, message);
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

function uniqueSorted(values: readonly string[]): string[] {
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

function compareIso(left: string, right: string): number {
  return left.localeCompare(right);
}

function normalizeRecordId(prefix: string, value: unknown): string {
  return `${prefix}_${sha256(value).slice(0, 24)}`;
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

export const PHASE4_APPOINTMENT_MANAGE_SCHEMA_VERSION =
  "288.phase4.appointment-manage-command-layer.v1" as const;

export type AppointmentManageActionScope =
  | "appointment_cancel"
  | "appointment_reschedule"
  | "appointment_reschedule_abandon"
  | "appointment_detail_update"
  | "reminder_change";

export type AppointmentManageActorMode = "patient" | "staff" | "staff_proxy" | "system";

export type BookingManageSettlementResult =
  | "applied"
  | "supplier_pending"
  | "stale_recoverable"
  | "unsupported_capability"
  | "safety_preempted"
  | "reconciliation_required";

export type BookingContinuityState =
  | "live"
  | "summary_only"
  | "stale_recovery"
  | "blocked_recovery";

export type BookingContinuityWritableState = "writable" | "summary_only" | "recovery_only";

export type AppointmentManageCommandState = "submitted" | "settled" | "superseded";

export interface AppointmentManageWindowPolicy {
  cancelCutoffMinutes: number;
  amendCutoffMinutes: number;
}

export interface AppointmentManageCommandSnapshot {
  appointmentManageCommandId: string;
  schemaVersion: typeof PHASE4_APPOINTMENT_MANAGE_SCHEMA_VERSION;
  appointmentId: string;
  bookingCaseId: string;
  actionScope: AppointmentManageActionScope;
  routeIntentBindingRef: string;
  routeIntentTupleHash: string;
  canonicalObjectDescriptorRef: string;
  governingObjectVersionRef: string;
  routeContractDigest: string;
  policyBundleRef: string;
  capabilityResolutionRef: string;
  capabilityTupleHash: string;
  providerAdapterBindingRef: string;
  providerAdapterBindingHash: string;
  freshnessToken: string;
  governingFenceEpoch: number;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  idempotencyKey: string;
  actorMode: AppointmentManageActorMode;
  selectedAnchorRef: string;
  routeFamilyRef: string;
  semanticPayloadHash: string;
  latestManageSettlementRef: string;
  commandState: AppointmentManageCommandState;
  submitTime: string;
  updatedAt: string;
  version: number;
}

export interface BookingManageSettlementSnapshot {
  bookingManageSettlementId: string;
  schemaVersion: typeof PHASE4_APPOINTMENT_MANAGE_SCHEMA_VERSION;
  appointmentManageCommandRef: string;
  bookingCaseId: string;
  appointmentId: string;
  actionScope: AppointmentManageActionScope;
  routeIntentBindingRef: string;
  canonicalObjectDescriptorRef: string;
  governingObjectVersionRef: string;
  routeIntentTupleHash: string;
  capabilityResolutionRef: string;
  capabilityTupleHash: string;
  providerAdapterBindingRef: string;
  providerAdapterBindingHash: string;
  result: BookingManageSettlementResult;
  receiptTextRef: string | null;
  continuityEvidenceRef: string;
  causalToken: string;
  transitionEnvelopeRef: string | null;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  releaseRecoveryDispositionRef: string | null;
  routeFreezeDispositionRef: string | null;
  recoveryRouteRef: string | null;
  presentationArtifactRef: string | null;
  contactRouteRepairJourneyRef: string | null;
  reasonCodes: readonly string[];
  recordedAt: string;
  version: number;
}

export interface BookingContinuityEvidenceProjectionSnapshot {
  bookingContinuityEvidenceProjectionId: string;
  schemaVersion: typeof PHASE4_APPOINTMENT_MANAGE_SCHEMA_VERSION;
  bookingCaseId: string;
  appointmentId: string;
  appointmentRecordRef: string;
  bookingConfirmationTruthProjectionRef: string;
  appointmentLineageRef: string;
  selectedAnchorRef: string;
  routeFamilyRef: string;
  routeIntentBindingRef: string;
  routeIntentTupleHash: string;
  capabilityResolutionRef: string;
  capabilityTupleHash: string;
  providerAdapterBindingRef: string;
  providerAdapterBindingHash: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  latestManageSettlementRef: string;
  latestManageCommandRef: string;
  experienceContinuityEvidenceRef: string;
  continuityState: BookingContinuityState;
  writableState: BookingContinuityWritableState;
  generatedAt: string;
  version: number;
}

export interface AppointmentManageBundle {
  command: AppointmentManageCommandSnapshot;
  settlement: BookingManageSettlementSnapshot;
  continuityEvidence: BookingContinuityEvidenceProjectionSnapshot;
}

export interface AppointmentManageProcessingResult extends AppointmentManageBundle {
  replayed: boolean;
  emittedEvents: readonly FoundationEventEnvelope<object>[];
}

interface SnapshotDocument<T> {
  toSnapshot(): T;
}

class StoredSnapshotDocument<T> implements SnapshotDocument<T> {
  constructor(private readonly snapshot: T) {}

  toSnapshot(): T {
    return structuredClone(this.snapshot);
  }
}

export interface Phase4AppointmentManageRepositories {
  getAppointmentManageCommand(
    appointmentManageCommandId: string,
  ): Promise<SnapshotDocument<AppointmentManageCommandSnapshot> | null>;
  findAppointmentManageCommandByIdempotencyKey(
    idempotencyKey: string,
  ): Promise<SnapshotDocument<AppointmentManageCommandSnapshot> | null>;
  listAppointmentManageCommandsForAppointment(
    appointmentId: string,
  ): Promise<readonly SnapshotDocument<AppointmentManageCommandSnapshot>[]>;
  saveAppointmentManageCommand(
    snapshot: AppointmentManageCommandSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getBookingManageSettlement(
    bookingManageSettlementId: string,
  ): Promise<SnapshotDocument<BookingManageSettlementSnapshot> | null>;
  listBookingManageSettlementsForAppointment(
    appointmentId: string,
  ): Promise<readonly SnapshotDocument<BookingManageSettlementSnapshot>[]>;
  saveBookingManageSettlement(
    snapshot: BookingManageSettlementSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getCurrentBookingManageSettlementRef(appointmentId: string): Promise<string | null>;
  setCurrentBookingManageSettlementRef(
    appointmentId: string,
    bookingManageSettlementId: string,
  ): Promise<void>;
  getBookingContinuityEvidenceProjection(
    bookingContinuityEvidenceProjectionId: string,
  ): Promise<SnapshotDocument<BookingContinuityEvidenceProjectionSnapshot> | null>;
  saveBookingContinuityEvidenceProjection(
    snapshot: BookingContinuityEvidenceProjectionSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getCurrentBookingContinuityEvidenceProjectionRef(appointmentId: string): Promise<string | null>;
  setCurrentBookingContinuityEvidenceProjectionRef(
    appointmentId: string,
    bookingContinuityEvidenceProjectionId: string,
  ): Promise<void>;
}

export function createPhase4AppointmentManageStore(): Phase4AppointmentManageRepositories {
  const commands = new Map<string, AppointmentManageCommandSnapshot>();
  const commandByIdempotencyKey = new Map<string, string>();
  const commandRefsByAppointment = new Map<string, string[]>();
  const settlements = new Map<string, BookingManageSettlementSnapshot>();
  const settlementRefsByAppointment = new Map<string, string[]>();
  const currentSettlementByAppointment = new Map<string, string>();
  const continuityProjections = new Map<string, BookingContinuityEvidenceProjectionSnapshot>();
  const currentContinuityByAppointment = new Map<string, string>();

  return {
    async getAppointmentManageCommand(appointmentManageCommandId) {
      const row = commands.get(appointmentManageCommandId);
      return row ? new StoredSnapshotDocument(row) : null;
    },
    async findAppointmentManageCommandByIdempotencyKey(idempotencyKey) {
      const commandId = commandByIdempotencyKey.get(idempotencyKey);
      if (!commandId) {
        return null;
      }
      const row = commands.get(commandId);
      return row ? new StoredSnapshotDocument(row) : null;
    },
    async listAppointmentManageCommandsForAppointment(appointmentId) {
      return (commandRefsByAppointment.get(appointmentId) ?? [])
        .map((commandId) => commands.get(commandId))
        .filter((row): row is AppointmentManageCommandSnapshot => row !== undefined)
        .sort((left, right) => compareIso(left.submitTime, right.submitTime))
        .map((row) => new StoredSnapshotDocument(row));
    },
    async saveAppointmentManageCommand(snapshot, options) {
      saveWithCas(commands, snapshot.appointmentManageCommandId, snapshot, options);
      commandByIdempotencyKey.set(snapshot.idempotencyKey, snapshot.appointmentManageCommandId);
      const existing = commandRefsByAppointment.get(snapshot.appointmentId) ?? [];
      if (!existing.includes(snapshot.appointmentManageCommandId)) {
        commandRefsByAppointment.set(snapshot.appointmentId, [
          ...existing,
          snapshot.appointmentManageCommandId,
        ]);
      }
    },
    async getBookingManageSettlement(bookingManageSettlementId) {
      const row = settlements.get(bookingManageSettlementId);
      return row ? new StoredSnapshotDocument(row) : null;
    },
    async listBookingManageSettlementsForAppointment(appointmentId) {
      return (settlementRefsByAppointment.get(appointmentId) ?? [])
        .map((settlementId) => settlements.get(settlementId))
        .filter((row): row is BookingManageSettlementSnapshot => row !== undefined)
        .sort((left, right) => compareIso(left.recordedAt, right.recordedAt))
        .map((row) => new StoredSnapshotDocument(row));
    },
    async saveBookingManageSettlement(snapshot, options) {
      saveWithCas(settlements, snapshot.bookingManageSettlementId, snapshot, options);
      const existing = settlementRefsByAppointment.get(snapshot.appointmentId) ?? [];
      if (!existing.includes(snapshot.bookingManageSettlementId)) {
        settlementRefsByAppointment.set(snapshot.appointmentId, [
          ...existing,
          snapshot.bookingManageSettlementId,
        ]);
      }
    },
    async getCurrentBookingManageSettlementRef(appointmentId) {
      return currentSettlementByAppointment.get(appointmentId) ?? null;
    },
    async setCurrentBookingManageSettlementRef(appointmentId, bookingManageSettlementId) {
      currentSettlementByAppointment.set(appointmentId, bookingManageSettlementId);
    },
    async getBookingContinuityEvidenceProjection(bookingContinuityEvidenceProjectionId) {
      const row = continuityProjections.get(bookingContinuityEvidenceProjectionId);
      return row ? new StoredSnapshotDocument(row) : null;
    },
    async saveBookingContinuityEvidenceProjection(snapshot, options) {
      saveWithCas(
        continuityProjections,
        snapshot.bookingContinuityEvidenceProjectionId,
        snapshot,
        options,
      );
    },
    async getCurrentBookingContinuityEvidenceProjectionRef(appointmentId) {
      return currentContinuityByAppointment.get(appointmentId) ?? null;
    },
    async setCurrentBookingContinuityEvidenceProjectionRef(
      appointmentId,
      bookingContinuityEvidenceProjectionId,
    ) {
      currentContinuityByAppointment.set(appointmentId, bookingContinuityEvidenceProjectionId);
    },
  };
}

export interface AppointmentManagePredicateInput {
  appointmentStartAt: string;
  evaluatedAt: string;
  cutoffMinutes: number;
  hasLiveFence: boolean;
  appointmentStatus: AppointmentRecordSnapshot["appointmentStatus"];
}

export function isClinicallyMeaningfulFreeText(text: string | null | undefined): boolean {
  if (typeof text !== "string") {
    return false;
  }
  const normalized = text.trim().toLowerCase();
  if (!normalized) {
    return false;
  }
  return /(symptom|worse|worsening|pain|bleed|bleeding|shortness of breath|breathless|dizzy|rash|fever|infection|swelling|chest|collapse|urgent|deteriorat)/i.test(
    normalized,
  );
}

export function evaluateCancelablePredicate(input: AppointmentManagePredicateInput): boolean {
  if (input.hasLiveFence || input.appointmentStatus !== "booked") {
    return false;
  }
  const startAt = Date.parse(ensureIsoTimestamp(input.appointmentStartAt, "appointmentStartAt"));
  const evaluatedAt = Date.parse(ensureIsoTimestamp(input.evaluatedAt, "evaluatedAt"));
  return startAt - evaluatedAt >= ensurePositiveInteger(input.cutoffMinutes, "cutoffMinutes") * 60_000;
}

export function evaluateReschedulablePredicate(input: AppointmentManagePredicateInput): boolean {
  if (input.hasLiveFence || input.appointmentStatus !== "booked") {
    return false;
  }
  const startAt = Date.parse(ensureIsoTimestamp(input.appointmentStartAt, "appointmentStartAt"));
  const evaluatedAt = Date.parse(ensureIsoTimestamp(input.evaluatedAt, "evaluatedAt"));
  return startAt - evaluatedAt >= ensurePositiveInteger(input.cutoffMinutes, "cutoffMinutes") * 60_000;
}

export function defaultAppointmentManageWindowPolicy(
  manageSupportContractRef: string,
): AppointmentManageWindowPolicy {
  const ref = requireRef(manageSupportContractRef, "manageSupportContractRef");
  if (ref.includes("manual-assist")) {
    return { cancelCutoffMinutes: 24 * 60, amendCutoffMinutes: 24 * 60 };
  }
  if (ref.includes("gp-connect")) {
    return { cancelCutoffMinutes: 2 * 60, amendCutoffMinutes: 4 * 60 };
  }
  if (ref.includes("im1")) {
    return { cancelCutoffMinutes: 2 * 60, amendCutoffMinutes: 4 * 60 };
  }
  return { cancelCutoffMinutes: 2 * 60, amendCutoffMinutes: 6 * 60 };
}

function buildContinuityUpdatedEvent(
  continuityEvidence: BookingContinuityEvidenceProjectionSnapshot,
): FoundationEventEnvelope<object> {
  return makeFoundationEvent("booking.manage.continuity.updated", {
    governingRef: continuityEvidence.bookingContinuityEvidenceProjectionId,
    bookingCaseId: continuityEvidence.bookingCaseId,
    appointmentId: continuityEvidence.appointmentId,
    continuityState: continuityEvidence.continuityState,
    writableState: continuityEvidence.writableState,
    latestManageSettlementRef: continuityEvidence.latestManageSettlementRef,
    routeIntentTupleHash: continuityEvidence.routeIntentTupleHash,
  });
}

function buildBookingCancelledEvent(
  settlement: BookingManageSettlementSnapshot,
): FoundationEventEnvelope<object> {
  return makeFoundationEvent("booking.cancelled", {
    governingRef: settlement.bookingManageSettlementId,
    bookingCaseId: settlement.bookingCaseId,
    appointmentId: settlement.appointmentId,
    actionScope: settlement.actionScope,
    result: settlement.result,
    continuityEvidenceRef: settlement.continuityEvidenceRef,
  });
}

function buildBookingRescheduleStartedEvent(
  settlement: BookingManageSettlementSnapshot,
): FoundationEventEnvelope<object> {
  return makeFoundationEvent("booking.reschedule.started", {
    governingRef: settlement.bookingManageSettlementId,
    bookingCaseId: settlement.bookingCaseId,
    appointmentId: settlement.appointmentId,
    actionScope: settlement.actionScope,
    result: settlement.result,
    continuityEvidenceRef: settlement.continuityEvidenceRef,
  });
}

export interface PersistAppointmentManageOutcomeInput {
  appointmentId: string;
  bookingCaseId: string;
  actionScope: AppointmentManageActionScope;
  routeIntentBindingRef: string;
  routeIntentTupleHash: string;
  canonicalObjectDescriptorRef: string;
  governingObjectVersionRef: string;
  routeContractDigest: string;
  policyBundleRef: string;
  capabilityResolutionRef: string;
  capabilityTupleHash: string;
  providerAdapterBindingRef: string;
  providerAdapterBindingHash: string;
  freshnessToken: string;
  governingFenceEpoch: number;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  idempotencyKey: string;
  actorMode: AppointmentManageActorMode;
  selectedAnchorRef: string;
  routeFamilyRef: string;
  experienceContinuityEvidenceRef: string;
  continuityState: BookingContinuityState;
  writableState: BookingContinuityWritableState;
  bookingConfirmationTruthProjectionRef: string;
  appointmentLineageRef: string;
  appointmentRecordRef: string;
  semanticPayload?: unknown;
  result: BookingManageSettlementResult;
  receiptTextRef?: string | null;
  reasonCodes?: readonly string[];
  causalToken?: string | null;
  transitionEnvelopeRef?: string | null;
  releaseRecoveryDispositionRef?: string | null;
  routeFreezeDispositionRef?: string | null;
  recoveryRouteRef?: string | null;
  presentationArtifactRef?: string | null;
  contactRouteRepairJourneyRef?: string | null;
  recordedAt: string;
  emitBookingCancelledEvent?: boolean;
  emitBookingRescheduleStartedEvent?: boolean;
}

export interface RefreshBookingContinuityEvidenceInput {
  bookingCaseId: string;
  appointmentId: string;
  appointmentRecordRef: string;
  bookingConfirmationTruthProjectionRef: string;
  appointmentLineageRef: string;
  selectedAnchorRef: string;
  routeFamilyRef: string;
  routeIntentBindingRef: string;
  routeIntentTupleHash: string;
  capabilityResolutionRef: string;
  capabilityTupleHash: string;
  providerAdapterBindingRef: string;
  providerAdapterBindingHash: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  latestManageSettlementRef: string;
  latestManageCommandRef: string;
  experienceContinuityEvidenceRef: string;
  continuityState: BookingContinuityState;
  writableState: BookingContinuityWritableState;
  generatedAt: string;
}

export interface Phase4AppointmentManageService {
  repositories: Phase4AppointmentManageRepositories;
  submitCancellation(
    input: PersistAppointmentManageOutcomeInput,
  ): Promise<AppointmentManageProcessingResult>;
  submitReschedule(
    input: PersistAppointmentManageOutcomeInput,
  ): Promise<AppointmentManageProcessingResult>;
  abandonReschedule(
    input: PersistAppointmentManageOutcomeInput,
  ): Promise<AppointmentManageProcessingResult>;
  submitDetailUpdate(
    input: PersistAppointmentManageOutcomeInput,
  ): Promise<AppointmentManageProcessingResult>;
  refreshContinuityEvidence(
    input: RefreshBookingContinuityEvidenceInput,
  ): Promise<BookingContinuityEvidenceProjectionSnapshot>;
  queryCurrentAppointmentManage(appointmentId: string): Promise<AppointmentManageBundle | null>;
}

export function createPhase4AppointmentManageService(input?: {
  repositories?: Phase4AppointmentManageRepositories;
}): Phase4AppointmentManageService {
  const repositories = input?.repositories ?? createPhase4AppointmentManageStore();

  async function hydrateResult(
    command: AppointmentManageCommandSnapshot,
    settlement: BookingManageSettlementSnapshot,
    continuityEvidence: BookingContinuityEvidenceProjectionSnapshot,
    replayed: boolean,
    emittedEvents: readonly FoundationEventEnvelope<object>[],
  ): Promise<AppointmentManageProcessingResult> {
    return {
      command,
      settlement,
      continuityEvidence,
      replayed,
      emittedEvents,
    };
  }

  async function persistOutcome(
    input: PersistAppointmentManageOutcomeInput,
  ): Promise<AppointmentManageProcessingResult> {
    const replay = await repositories.findAppointmentManageCommandByIdempotencyKey(
      requireRef(input.idempotencyKey, "idempotencyKey"),
    );
    if (replay) {
      const replayedCommand = replay.toSnapshot();
      const settlementDocument = await repositories.getBookingManageSettlement(
        replayedCommand.latestManageSettlementRef,
      );
      invariant(
        settlementDocument,
        "BOOKING_MANAGE_SETTLEMENT_NOT_FOUND",
        `BookingManageSettlement ${replayedCommand.latestManageSettlementRef} was not found.`,
      );
      const continuityRef = await repositories.getCurrentBookingContinuityEvidenceProjectionRef(
        replayedCommand.appointmentId,
      );
      invariant(
        continuityRef,
        "BOOKING_CONTINUITY_EVIDENCE_NOT_FOUND",
        `No current BookingContinuityEvidenceProjection exists for ${replayedCommand.appointmentId}.`,
      );
      const continuityDocument = await repositories.getBookingContinuityEvidenceProjection(continuityRef);
      invariant(
        continuityDocument,
        "BOOKING_CONTINUITY_EVIDENCE_NOT_FOUND",
        `BookingContinuityEvidenceProjection ${continuityRef} was not found.`,
      );
      return hydrateResult(
        replayedCommand,
        settlementDocument.toSnapshot(),
        continuityDocument.toSnapshot(),
        true,
        [],
      );
    }

    const recordedAt = ensureIsoTimestamp(input.recordedAt, "recordedAt");
    const settlementId = normalizeRecordId("booking_manage_settlement", [
      input.appointmentId,
      input.actionScope,
      input.idempotencyKey,
      recordedAt,
      input.result,
    ]);
    const command: AppointmentManageCommandSnapshot = {
      appointmentManageCommandId: normalizeRecordId("appointment_manage_command", [
        input.appointmentId,
        input.actionScope,
        input.idempotencyKey,
      ]),
      schemaVersion: PHASE4_APPOINTMENT_MANAGE_SCHEMA_VERSION,
      appointmentId: requireRef(input.appointmentId, "appointmentId"),
      bookingCaseId: requireRef(input.bookingCaseId, "bookingCaseId"),
      actionScope: input.actionScope,
      routeIntentBindingRef: requireRef(input.routeIntentBindingRef, "routeIntentBindingRef"),
      routeIntentTupleHash: requireRef(input.routeIntentTupleHash, "routeIntentTupleHash"),
      canonicalObjectDescriptorRef: requireRef(
        input.canonicalObjectDescriptorRef,
        "canonicalObjectDescriptorRef",
      ),
      governingObjectVersionRef: requireRef(
        input.governingObjectVersionRef,
        "governingObjectVersionRef",
      ),
      routeContractDigest: requireRef(input.routeContractDigest, "routeContractDigest"),
      policyBundleRef: requireRef(input.policyBundleRef, "policyBundleRef"),
      capabilityResolutionRef: requireRef(input.capabilityResolutionRef, "capabilityResolutionRef"),
      capabilityTupleHash: requireRef(input.capabilityTupleHash, "capabilityTupleHash"),
      providerAdapterBindingRef: requireRef(
        input.providerAdapterBindingRef,
        "providerAdapterBindingRef",
      ),
      providerAdapterBindingHash: requireRef(
        input.providerAdapterBindingHash,
        "providerAdapterBindingHash",
      ),
      freshnessToken: requireRef(input.freshnessToken, "freshnessToken"),
      governingFenceEpoch: ensurePositiveInteger(
        input.governingFenceEpoch,
        "governingFenceEpoch",
      ),
      surfacePublicationRef: requireRef(input.surfacePublicationRef, "surfacePublicationRef"),
      runtimePublicationBundleRef: requireRef(
        input.runtimePublicationBundleRef,
        "runtimePublicationBundleRef",
      ),
      idempotencyKey: requireRef(input.idempotencyKey, "idempotencyKey"),
      actorMode: input.actorMode,
      selectedAnchorRef: requireRef(input.selectedAnchorRef, "selectedAnchorRef"),
      routeFamilyRef: requireRef(input.routeFamilyRef, "routeFamilyRef"),
      semanticPayloadHash: sha256(input.semanticPayload ?? {}),
      latestManageSettlementRef: settlementId,
      commandState: "settled",
      submitTime: recordedAt,
      updatedAt: recordedAt,
      version: 1,
    };

    const continuityId = normalizeRecordId("booking_continuity_evidence", [
      input.appointmentId,
      settlementId,
      input.continuityState,
      input.writableState,
      recordedAt,
    ]);
    const continuityEvidence: BookingContinuityEvidenceProjectionSnapshot = {
      bookingContinuityEvidenceProjectionId: continuityId,
      schemaVersion: PHASE4_APPOINTMENT_MANAGE_SCHEMA_VERSION,
      bookingCaseId: command.bookingCaseId,
      appointmentId: command.appointmentId,
      appointmentRecordRef: requireRef(input.appointmentRecordRef, "appointmentRecordRef"),
      bookingConfirmationTruthProjectionRef: requireRef(
        input.bookingConfirmationTruthProjectionRef,
        "bookingConfirmationTruthProjectionRef",
      ),
      appointmentLineageRef: requireRef(input.appointmentLineageRef, "appointmentLineageRef"),
      selectedAnchorRef: command.selectedAnchorRef,
      routeFamilyRef: command.routeFamilyRef,
      routeIntentBindingRef: command.routeIntentBindingRef,
      routeIntentTupleHash: command.routeIntentTupleHash,
      capabilityResolutionRef: command.capabilityResolutionRef,
      capabilityTupleHash: command.capabilityTupleHash,
      providerAdapterBindingRef: command.providerAdapterBindingRef,
      providerAdapterBindingHash: command.providerAdapterBindingHash,
      surfacePublicationRef: command.surfacePublicationRef,
      runtimePublicationBundleRef: command.runtimePublicationBundleRef,
      latestManageSettlementRef: settlementId,
      latestManageCommandRef: command.appointmentManageCommandId,
      experienceContinuityEvidenceRef: requireRef(
        input.experienceContinuityEvidenceRef,
        "experienceContinuityEvidenceRef",
      ),
      continuityState: input.continuityState,
      writableState: input.writableState,
      generatedAt: recordedAt,
      version: 1,
    };

    const settlement: BookingManageSettlementSnapshot = {
      bookingManageSettlementId: settlementId,
      schemaVersion: PHASE4_APPOINTMENT_MANAGE_SCHEMA_VERSION,
      appointmentManageCommandRef: command.appointmentManageCommandId,
      bookingCaseId: command.bookingCaseId,
      appointmentId: command.appointmentId,
      actionScope: command.actionScope,
      routeIntentBindingRef: command.routeIntentBindingRef,
      canonicalObjectDescriptorRef: command.canonicalObjectDescriptorRef,
      governingObjectVersionRef: command.governingObjectVersionRef,
      routeIntentTupleHash: command.routeIntentTupleHash,
      capabilityResolutionRef: command.capabilityResolutionRef,
      capabilityTupleHash: command.capabilityTupleHash,
      providerAdapterBindingRef: command.providerAdapterBindingRef,
      providerAdapterBindingHash: command.providerAdapterBindingHash,
      result: input.result,
      receiptTextRef: optionalRef(input.receiptTextRef),
      continuityEvidenceRef: continuityId,
      causalToken:
        optionalRef(input.causalToken) ??
        normalizeRecordId("booking_manage_causal", [
          settlementId,
          command.capabilityTupleHash,
          command.governingObjectVersionRef,
        ]),
      transitionEnvelopeRef: optionalRef(input.transitionEnvelopeRef),
      surfacePublicationRef: command.surfacePublicationRef,
      runtimePublicationBundleRef: command.runtimePublicationBundleRef,
      releaseRecoveryDispositionRef: optionalRef(input.releaseRecoveryDispositionRef),
      routeFreezeDispositionRef: optionalRef(input.routeFreezeDispositionRef),
      recoveryRouteRef: optionalRef(input.recoveryRouteRef),
      presentationArtifactRef: optionalRef(input.presentationArtifactRef),
      contactRouteRepairJourneyRef: optionalRef(input.contactRouteRepairJourneyRef),
      reasonCodes: uniqueSorted(input.reasonCodes ?? []),
      recordedAt,
      version: 1,
    };

    await repositories.saveAppointmentManageCommand(command);
    await repositories.saveBookingManageSettlement(settlement);
    await repositories.setCurrentBookingManageSettlementRef(
      settlement.appointmentId,
      settlement.bookingManageSettlementId,
    );
    await repositories.saveBookingContinuityEvidenceProjection(continuityEvidence);
    await repositories.setCurrentBookingContinuityEvidenceProjectionRef(
      continuityEvidence.appointmentId,
      continuityEvidence.bookingContinuityEvidenceProjectionId,
    );

    const emittedEvents: FoundationEventEnvelope<object>[] = [
      buildContinuityUpdatedEvent(continuityEvidence),
    ];
    if (input.emitBookingCancelledEvent && input.result === "applied") {
      emittedEvents.push(buildBookingCancelledEvent(settlement));
    }
    if (input.emitBookingRescheduleStartedEvent && input.result === "applied") {
      emittedEvents.push(buildBookingRescheduleStartedEvent(settlement));
    }
    return hydrateResult(command, settlement, continuityEvidence, false, emittedEvents);
  }

  return {
    repositories,
    submitCancellation(input) {
      invariant(
        input.actionScope === "appointment_cancel",
        "INVALID_MANAGE_ACTION_SCOPE",
        "submitCancellation requires actionScope = appointment_cancel.",
      );
      return persistOutcome(input);
    },
    submitReschedule(input) {
      invariant(
        input.actionScope === "appointment_reschedule",
        "INVALID_MANAGE_ACTION_SCOPE",
        "submitReschedule requires actionScope = appointment_reschedule.",
      );
      return persistOutcome(input);
    },
    abandonReschedule(input) {
      invariant(
        input.actionScope === "appointment_reschedule_abandon",
        "INVALID_MANAGE_ACTION_SCOPE",
        "abandonReschedule requires actionScope = appointment_reschedule_abandon.",
      );
      return persistOutcome(input);
    },
    submitDetailUpdate(input) {
      invariant(
        input.actionScope === "appointment_detail_update" ||
          input.actionScope === "reminder_change",
        "INVALID_MANAGE_ACTION_SCOPE",
        "submitDetailUpdate requires an appointment_detail_update or reminder_change scope.",
      );
      return persistOutcome(input);
    },
    async refreshContinuityEvidence(input) {
      const currentRef = await repositories.getCurrentBookingContinuityEvidenceProjectionRef(
        input.appointmentId,
      );
      const existing = currentRef
        ? await repositories.getBookingContinuityEvidenceProjection(currentRef)
        : null;
      const snapshot: BookingContinuityEvidenceProjectionSnapshot = {
        bookingContinuityEvidenceProjectionId:
          existing?.toSnapshot().bookingContinuityEvidenceProjectionId ??
          normalizeRecordId("booking_continuity_evidence", [
            input.appointmentId,
            input.routeIntentTupleHash,
            input.latestManageSettlementRef,
          ]),
        schemaVersion: PHASE4_APPOINTMENT_MANAGE_SCHEMA_VERSION,
        bookingCaseId: requireRef(input.bookingCaseId, "bookingCaseId"),
        appointmentId: requireRef(input.appointmentId, "appointmentId"),
        appointmentRecordRef: requireRef(input.appointmentRecordRef, "appointmentRecordRef"),
        bookingConfirmationTruthProjectionRef: requireRef(
          input.bookingConfirmationTruthProjectionRef,
          "bookingConfirmationTruthProjectionRef",
        ),
        appointmentLineageRef: requireRef(input.appointmentLineageRef, "appointmentLineageRef"),
        selectedAnchorRef: requireRef(input.selectedAnchorRef, "selectedAnchorRef"),
        routeFamilyRef: requireRef(input.routeFamilyRef, "routeFamilyRef"),
        routeIntentBindingRef: requireRef(input.routeIntentBindingRef, "routeIntentBindingRef"),
        routeIntentTupleHash: requireRef(input.routeIntentTupleHash, "routeIntentTupleHash"),
        capabilityResolutionRef: requireRef(input.capabilityResolutionRef, "capabilityResolutionRef"),
        capabilityTupleHash: requireRef(input.capabilityTupleHash, "capabilityTupleHash"),
        providerAdapterBindingRef: requireRef(
          input.providerAdapterBindingRef,
          "providerAdapterBindingRef",
        ),
        providerAdapterBindingHash: requireRef(
          input.providerAdapterBindingHash,
          "providerAdapterBindingHash",
        ),
        surfacePublicationRef: requireRef(input.surfacePublicationRef, "surfacePublicationRef"),
        runtimePublicationBundleRef: requireRef(
          input.runtimePublicationBundleRef,
          "runtimePublicationBundleRef",
        ),
        latestManageSettlementRef: requireRef(
          input.latestManageSettlementRef,
          "latestManageSettlementRef",
        ),
        latestManageCommandRef: requireRef(input.latestManageCommandRef, "latestManageCommandRef"),
        experienceContinuityEvidenceRef: requireRef(
          input.experienceContinuityEvidenceRef,
          "experienceContinuityEvidenceRef",
        ),
        continuityState: input.continuityState,
        writableState: input.writableState,
        generatedAt: ensureIsoTimestamp(input.generatedAt, "generatedAt"),
        version: (existing?.toSnapshot().version ?? 0) + 1,
      };
      await repositories.saveBookingContinuityEvidenceProjection(snapshot, {
        expectedVersion: existing?.toSnapshot().version,
      });
      await repositories.setCurrentBookingContinuityEvidenceProjectionRef(
        snapshot.appointmentId,
        snapshot.bookingContinuityEvidenceProjectionId,
      );
      return snapshot;
    },
    async queryCurrentAppointmentManage(appointmentId) {
      const settlementRef = await repositories.getCurrentBookingManageSettlementRef(appointmentId);
      const continuityRef =
        await repositories.getCurrentBookingContinuityEvidenceProjectionRef(appointmentId);
      if (!settlementRef || !continuityRef) {
        return null;
      }
      const settlementDocument = await repositories.getBookingManageSettlement(settlementRef);
      const continuityDocument =
        await repositories.getBookingContinuityEvidenceProjection(continuityRef);
      invariant(
        settlementDocument && continuityDocument,
        "CURRENT_MANAGE_STATE_MISSING",
        `Current manage state for ${appointmentId} is incomplete.`,
      );
      const settlement = settlementDocument.toSnapshot();
      const commandDocument = await repositories.getAppointmentManageCommand(
        settlement.appointmentManageCommandRef,
      );
      invariant(
        commandDocument,
        "CURRENT_MANAGE_COMMAND_MISSING",
        `AppointmentManageCommand ${settlement.appointmentManageCommandRef} was not found.`,
      );
      return {
        command: commandDocument.toSnapshot(),
        settlement,
        continuityEvidence: continuityDocument.toSnapshot(),
      };
    },
  };
}
