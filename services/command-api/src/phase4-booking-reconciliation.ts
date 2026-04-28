import { createHash } from "node:crypto";
import {
  createDeterministicBackboneIdGenerator,
  type BackboneIdGenerator,
} from "@vecells/domain-kernel";
import { makeFoundationEvent, type FoundationEventEnvelope } from "@vecells/event-contracts";
import {
  createPhase4AssistedBookingService,
  createPhase4AssistedBookingStore,
  createPhase4BookingReconciliationService,
  createPhase4BookingReconciliationStore,
  parseBookingReconciliationCompetingGateConfidences,
  parseBookingReconciliationEvidenceAtoms,
  PHASE4_BOOKING_RECONCILIATION_SCHEMA_VERSION,
  type BookingAuthoritativeProofClass,
  type BookingCaseBundle,
  type BookingCommitObservationKind,
  type BookingConfirmationTruthProjectionSnapshot,
  type BookingExceptionQueueEntrySnapshot,
  type BookingReconciliationAttemptMutationResult,
  type BookingReconciliationAttemptOutcome,
  type BookingReconciliationAttemptSnapshot,
  type BookingReconciliationBundle,
  type BookingReconciliationEvidenceAtomSnapshot,
  type BookingReconciliationRecordSnapshot,
  type BookingReconciliationState,
  type BookingReconciliationTrigger,
  type Phase4AssistedBookingRepositories,
  type Phase4AssistedBookingService,
} from "@vecells/domain-booking";
import {
  createReservationConfirmationAuthorityService,
  defaultReservationConfirmationThresholdPolicy,
  type ConfirmationAssuranceLevel,
  type ExternalConfirmationGateSnapshot,
} from "@vecells/domain-identity-access";
import {
  createPhase4BookingCommitApplication,
  type BookingCommitApplicationResult,
  type Phase4BookingCommitApplication,
  type ReconcileBookingCommitInput,
} from "./phase4-booking-commit";
import {
  createPhase4BookingCaseApplication,
  type Phase4BookingCaseApplication,
} from "./phase4-booking-case";
import {
  createPhase4BookingReservationApplication,
  type Phase4BookingReservationApplication,
} from "./phase4-booking-reservations";

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

function ensurePositiveInteger(value: number, field: string): number {
  invariant(
    Number.isInteger(value) && value > 0,
    `INVALID_${field.toUpperCase()}`,
    `${field} must be a positive integer.`,
  );
  return value;
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

function addSeconds(timestamp: string, seconds: number): string {
  return new Date(Date.parse(timestamp) + seconds * 1000).toISOString();
}

function compareIso(left: string, right: string): number {
  return left.localeCompare(right);
}

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

type QueueEntryState = "open" | "claimed";
type CallbackVerificationState = "verified" | "failed" | "not_supported";
type CallbackReceiptState =
  | "accepted_for_processing"
  | "confirmation_pending"
  | "confirmed"
  | "failed"
  | "expired"
  | "conflict";
type ReadOutcome = "confirmed" | "pending" | "not_found" | "conflict" | "failed" | "expired";
type HardMatchRef = "selected_slot" | "patient_identity" | "appointment_window";
type HardMatchStatus = "matched" | "failed" | "unknown";

function defaultPayloadArtifactRef(input: {
  bookingCaseId?: string | null;
  bookingTransactionId?: string | null;
  commandActionRecordRef: string;
}): string {
  return `artifact://booking/reconciliation/${input.bookingCaseId ?? input.bookingTransactionId ?? "unknown"}/${input.commandActionRecordRef}`;
}

function defaultEdgeCorrelationId(input: {
  bookingCaseId?: string | null;
  bookingTransactionId?: string | null;
  commandActionRecordRef: string;
}): string {
  return `edge::booking_reconciliation::${input.bookingCaseId ?? input.bookingTransactionId ?? "unknown"}::${input.commandActionRecordRef}`;
}

function confirmationDeadlineSecondsForMode(
  mode: BookingReconciliationRecordSnapshot["authoritativeReadMode"],
): number {
  switch (mode) {
    case "read_after_write":
      return 10 * 60;
    case "durable_provider_reference":
      return 15 * 60;
    case "gate_required":
      return 30 * 60;
  }
}

function retryDelaysForMode(
  mode: BookingReconciliationRecordSnapshot["authoritativeReadMode"],
): readonly number[] {
  switch (mode) {
    case "read_after_write":
      return [30, 120, 300];
    case "durable_provider_reference":
      return [120, 300, 600, 900];
    case "gate_required":
      return [300, 600, 900, 1200];
  }
}

function nextAttemptAtForMode(
  mode: BookingReconciliationRecordSnapshot["authoritativeReadMode"],
  attemptOrdinal: number,
  fromTimestamp: string,
): string | null {
  const delays = retryDelaysForMode(mode);
  const delay = delays[attemptOrdinal - 1];
  return typeof delay === "number" ? addSeconds(fromTimestamp, delay) : null;
}

function maxAttemptsForMode(
  mode: BookingReconciliationRecordSnapshot["authoritativeReadMode"],
): number {
  return retryDelaysForMode(mode).length;
}

function isFinalTransactionOutcome(
  state: BookingCommitApplicationResult["transaction"]["authoritativeOutcomeState"],
): boolean {
  return state === "booked" || state === "failed" || state === "expired" || state === "superseded";
}

function stateForFinalOutcome(
  state: BookingCommitApplicationResult["transaction"]["authoritativeOutcomeState"],
): Extract<BookingReconciliationState, "confirmed" | "failed" | "expired" | "superseded"> {
  switch (state) {
    case "booked":
      return "confirmed";
    case "failed":
      return "failed";
    case "expired":
      return "expired";
    case "superseded":
      return "superseded";
    default:
      invariant(false, "BOOKING_RECONCILIATION_FINAL_STATE_INVALID", `Unsupported final outcome ${state}.`);
  }
}

function evidenceRefsFromAtoms(
  atoms: readonly BookingReconciliationEvidenceAtomSnapshot[],
): readonly string[] {
  return uniqueSorted(atoms.map((atom) => atom.evidenceRef));
}

function serializeSemanticReceipt(value: unknown): unknown {
  if (value === null || value === undefined) {
    return { state: "unknown" };
  }
  return value;
}

function bookingReconciliationServiceNameId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_:-]/g, "_");
}

function hardMatchRefs(
  input?: Partial<Record<HardMatchRef, HardMatchStatus>> | null,
): {
  matched: readonly HardMatchRef[];
  failed: readonly HardMatchRef[];
} {
  const matched = new Set<HardMatchRef>();
  const failed = new Set<HardMatchRef>();
  for (const ref of ["selected_slot", "patient_identity", "appointment_window"] as const) {
    const status = input?.[ref] ?? "unknown";
    if (status === "matched") {
      matched.add(ref);
    }
    if (status === "failed") {
      failed.add(ref);
    }
  }
  return {
    matched: [...matched].sort(),
    failed: [...failed].sort(),
  };
}

function assuranceLevelForMode(
  mode: BookingReconciliationRecordSnapshot["authoritativeReadMode"],
  manualOverrideRequested: boolean,
): ConfirmationAssuranceLevel {
  if (manualOverrideRequested) {
    return "manual";
  }
  switch (mode) {
    case "read_after_write":
      return "strong";
    case "durable_provider_reference":
      return "moderate";
    case "gate_required":
      return "weak";
  }
}

function callbackObservationKind(
  receiptState: CallbackReceiptState,
): {
  observationKind: BookingCommitObservationKind;
  blockerReasonCode: string | null;
  recoveryMode: string | null;
  failureReasonCode: string | null;
} {
  switch (receiptState) {
    case "accepted_for_processing":
      return {
        observationKind: "confirmation_pending",
        blockerReasonCode: "callback_processing_accepted",
        recoveryMode: "awaiting_authoritative_read",
        failureReasonCode: null,
      };
    case "confirmation_pending":
      return {
        observationKind: "confirmation_pending",
        blockerReasonCode: "callback_confirmation_pending",
        recoveryMode: "awaiting_external_confirmation",
        failureReasonCode: null,
      };
    case "confirmed":
      return {
        observationKind: "confirmation_pending",
        blockerReasonCode: "callback_confirmed_pending_authoritative_read",
        recoveryMode: "awaiting_authoritative_read",
        failureReasonCode: null,
      };
    case "failed":
      return {
        observationKind: "authoritative_failure",
        blockerReasonCode: null,
        recoveryMode: null,
        failureReasonCode: "callback_authoritative_failure",
      };
    case "expired":
      return {
        observationKind: "expired",
        blockerReasonCode: null,
        recoveryMode: null,
        failureReasonCode: "callback_confirmation_expired",
      };
    case "conflict":
      return {
        observationKind: "reconciliation_required",
        blockerReasonCode: "callback_conflict",
        recoveryMode: "reconcile_supplier_conflict",
        failureReasonCode: null,
      };
  }
}

function callbackEvidenceAtoms(input: {
  receiptState: CallbackReceiptState;
  providerReference: string | null;
  observedAt: string;
  reasonCode?: string | null;
}): readonly BookingReconciliationEvidenceAtomSnapshot[] {
  const atoms: BookingReconciliationEvidenceAtomSnapshot[] = [
    {
      evidenceRef: `callback_state::${input.receiptState}::${input.observedAt}`,
      sourceFamily: "supplier_callback",
      proofRef: input.providerReference,
      logLikelihoodWeight:
        input.receiptState === "confirmed" || input.receiptState === "accepted_for_processing"
          ? 0.35
          : input.receiptState === "confirmation_pending"
            ? 0.2
            : 0.55,
      polarity:
        input.receiptState === "failed" ||
        input.receiptState === "expired" ||
        input.receiptState === "conflict"
          ? "negative"
          : "positive",
      satisfiesHardMatchRefs:
        input.receiptState === "confirmed" || input.receiptState === "accepted_for_processing"
          ? ["selected_slot"]
          : [],
      contradictory: input.receiptState === "conflict",
      failsHardMatchRefs: input.receiptState === "conflict" ? ["appointment_window"] : [],
    },
  ];
  if (input.reasonCode) {
    atoms.push({
      evidenceRef: `callback_reason::${input.reasonCode}`,
      sourceFamily: "supplier_callback",
      proofRef: null,
      logLikelihoodWeight: input.receiptState === "conflict" ? 0.7 : 0.25,
      polarity:
        input.receiptState === "failed" ||
        input.receiptState === "expired" ||
        input.receiptState === "conflict"
          ? "negative"
          : "positive",
      contradictory: input.receiptState === "conflict",
      failsHardMatchRefs: input.receiptState === "conflict" ? ["patient_identity"] : [],
    });
  }
  return atoms;
}

function buildAttemptKey(input: {
  bookingTransactionId: string;
  trigger: BookingReconciliationTrigger;
  semanticPayload: unknown;
}): string {
  return deterministicId("booking_reconciliation_attempt_key", {
    bookingTransactionId: input.bookingTransactionId,
    trigger: input.trigger,
    semanticPayload: input.semanticPayload,
  });
}

function buildTransportMessageId(input: {
  bookingTransactionId: string;
  semanticPayload: unknown;
}): string {
  return deterministicId("booking_reconciliation_transport", {
    bookingTransactionId: input.bookingTransactionId,
    semanticPayload: input.semanticPayload,
  });
}

function buildOrderingKey(input: { observedAt: string; semanticPayload: unknown }): string {
  return `${ensureIsoTimestamp(input.observedAt, "observedAt")}::${sha256(input.semanticPayload).slice(0, 16)}`;
}

function eventRouteRefs(result: BookingCommitApplicationResult): {
  routeIntentRef: string;
  subjectRef: string;
  payloadArtifactRef: string;
  edgeCorrelationId: string;
} {
  return {
    routeIntentRef: result.transaction.routeIntentBindingRef,
    subjectRef: result.transaction.subjectRef,
    payloadArtifactRef: result.transaction.payloadArtifactRef,
    edgeCorrelationId: result.transaction.edgeCorrelationId,
  };
}

function buildReconciliationStartedEvent(input: {
  commit: BookingCommitApplicationResult;
  attempt: BookingReconciliationAttemptSnapshot;
}): FoundationEventEnvelope<object> {
  return makeFoundationEvent("booking.reconciliation.started", {
    governingRef: input.commit.transaction.bookingTransactionId,
    governingVersionRef: `${input.attempt.bookingReconciliationRecordRef}::${input.attempt.attemptOrdinal}`,
    previousState: input.commit.transaction.authoritativeOutcomeState,
    nextState: input.attempt.outcome,
    stateAxis: "booking_reconciliation",
    commandActionRecordRef: input.commit.transaction.commandActionRecordRef,
    commandSettlementRef: input.commit.transaction.commandSettlementRecordRef,
    ...eventRouteRefs(input.commit),
    occurredAt: input.attempt.startedAt,
  });
}

function buildEvidenceObservedEvent(input: {
  commit: BookingCommitApplicationResult;
  attempt: BookingReconciliationAttemptSnapshot;
}): FoundationEventEnvelope<object> {
  return makeFoundationEvent("booking.reconciliation.evidence_observed", {
    governingRef: input.commit.transaction.bookingTransactionId,
    governingVersionRef: `${input.attempt.bookingReconciliationRecordRef}::${input.attempt.attemptOrdinal}`,
    evidenceRefs: input.attempt.evidenceRefs,
    receiptCheckpointRef: input.attempt.receiptCheckpointRef,
    commandActionRecordRef: input.commit.transaction.commandActionRecordRef,
    commandSettlementRef: input.commit.transaction.commandSettlementRecordRef,
    ...eventRouteRefs(input.commit),
    occurredAt: input.attempt.completedAt,
  });
}

function buildGateUpdatedEvent(input: {
  commit: BookingCommitApplicationResult;
  gate: ExternalConfirmationGateSnapshot;
}): FoundationEventEnvelope<object> {
  return makeFoundationEvent("booking.reconciliation.gate_updated", {
    governingRef: input.gate.gateId,
    artifactRef: input.gate.gateId,
    artifactHash: sha256({
      gateId: input.gate.gateId,
      gateRevision: input.gate.gateRevision,
      state: input.gate.state,
      confirmationConfidence: input.gate.confirmationConfidence,
    }),
    evidenceClass: input.gate.state,
    commandActionRecordRef: input.commit.transaction.commandActionRecordRef,
    commandSettlementRef: input.commit.transaction.commandSettlementRecordRef,
    ...eventRouteRefs(input.commit),
    occurredAt: input.gate.updatedAt,
  });
}

function buildDisputeOpenedEvent(input: {
  commit: BookingCommitApplicationResult;
  attempt: BookingReconciliationAttemptSnapshot;
}): FoundationEventEnvelope<object> {
  return makeFoundationEvent("booking.reconciliation.dispute_opened", {
    governingRef: input.commit.transaction.bookingTransactionId,
    governingVersionRef: `${input.attempt.bookingReconciliationRecordRef}::${input.attempt.attemptOrdinal}`,
    reasonCodes: input.attempt.reasonCodes,
    commandActionRecordRef: input.commit.transaction.commandActionRecordRef,
    commandSettlementRef: input.commit.transaction.commandSettlementRecordRef,
    ...eventRouteRefs(input.commit),
    occurredAt: input.attempt.completedAt,
  });
}

function buildFinalSettlementEvent(input: {
  eventType:
    | "booking.reconciliation.transaction_confirmed"
    | "booking.reconciliation.transaction_failed";
  commit: BookingCommitApplicationResult;
  attempt: BookingReconciliationAttemptSnapshot;
}): FoundationEventEnvelope<object> {
  return makeFoundationEvent(input.eventType, {
    governingRef: input.commit.transaction.bookingTransactionId,
    governingVersionRef: `${input.attempt.bookingReconciliationRecordRef}::${input.attempt.attemptOrdinal}`,
    settlementState: input.commit.transaction.authoritativeOutcomeState,
    settlementRef: input.commit.confirmationTruthProjection.bookingConfirmationTruthProjectionId,
    commandActionRecordRef: input.commit.transaction.commandActionRecordRef,
    commandSettlementRef: input.commit.transaction.commandSettlementRecordRef,
    ...eventRouteRefs(input.commit),
    occurredAt: input.attempt.completedAt,
  });
}

export const PHASE4_BOOKING_RECONCILIATION_SERVICE_NAME =
  "Phase4BookingReconciliationAndConfirmationWorkerApplication";
export const PHASE4_BOOKING_RECONCILIATION_QUERY_SURFACES = [
  "GET /v1/bookings/cases/{bookingCaseId}/reconciliation/current",
] as const;

export const phase4BookingReconciliationRoutes = [
  {
    routeId: "booking_case_reconciliation_current",
    method: "GET",
    path: "/v1/bookings/cases/{bookingCaseId}/reconciliation/current",
    contractFamily: "BookingReconciliationStatusBundleContract",
    purpose:
      "Resolve the current BookingTransaction, reconciliation ledger, external gate, and manual-attention queue posture for one booking case.",
    bodyRequired: false,
    idempotencyRequired: false,
  },
  {
    routeId: "booking_transaction_assimilate_receipt",
    method: "POST",
    path: "/internal/v1/bookings/transactions/{bookingTransactionId}:assimilate-receipt",
    contractFamily: "AssimilateBookingReceiptCommandContract",
    purpose:
      "Verify and assimilate one supplier callback or webhook through AdapterReceiptCheckpoint-backed booking reconciliation.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "booking_transaction_force_reconcile",
    method: "POST",
    path: "/internal/v1/bookings/transactions/{bookingTransactionId}:force-reconcile",
    contractFamily: "ForceBookingReconcileAttemptCommandContract",
    purpose:
      "Run one governed authoritative read, gate refresh, and settlement attempt for a pending or disputed BookingTransaction.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "booking_transaction_resolve_manual_dispute",
    method: "POST",
    path: "/internal/v1/bookings/transactions/{bookingTransactionId}:resolve-manual-dispute",
    contractFamily: "ResolveBookingManualDisputeCommandContract",
    purpose:
      "Resolve one manual booking dispute with an auditable reason while preserving append-only reconciliation history.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "booking_reconciliation_process_due",
    method: "POST",
    path: "/internal/v1/bookings/reconciliation:process-due",
    contractFamily: "ProcessDueBookingReconciliationCommandContract",
    purpose:
      "Sweep due booking reconciliations, apply bounded retry policy, and emit explicit manual-attention posture when automation is exhausted.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
] as const;

export const phase4BookingReconciliationPersistenceTables = [
  "phase4_booking_reconciliation_records",
  "phase4_booking_reconciliation_attempts",
  "phase4_booking_transactions",
  "phase4_booking_confirmation_truth_projections",
  "phase4_appointment_records",
  "phase4_booking_exception_queue_entries",
  "adapter_receipt_checkpoints",
  "external_confirmation_gates",
  "reservation_truth_projections",
] as const;

export const phase4BookingReconciliationMigrationPlanRefs = [
  "services/command-api/migrations/136_phase4_booking_commit_pipeline.sql",
  "services/command-api/migrations/140_phase4_staff_assisted_booking_and_exception_queue.sql",
  "services/command-api/migrations/141_phase4_booking_reconciliation_worker.sql",
] as const;

export interface BookingAuthoritativeReadResultInput {
  observedAt: string;
  outcome: ReadOutcome;
  providerReference?: string | null;
  reasonCode?: string | null;
  proofRef?: string | null;
  sourceFamily?: string | null;
  hardMatchRefs?: Partial<Record<HardMatchRef, HardMatchStatus>> | null;
  competingGateConfidences?: readonly number[];
  rawPayload?: unknown;
}

export interface AssimilateBookingReceiptInput {
  bookingTransactionId: string;
  actorRef: string;
  subjectRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  observedAt: string;
  transportMessageId: string;
  orderingKey: string;
  rawReceipt: unknown;
  semanticReceipt?: unknown;
  callbackState: CallbackReceiptState;
  providerCorrelationRef?: string | null;
  providerReference?: string | null;
  linkedSettlementRef?: string | null;
  signatureVerification?: CallbackVerificationState | null;
  networkVerification?: CallbackVerificationState | null;
  schemaVerified?: boolean | null;
  payloadArtifactRef?: string | null;
  edgeCorrelationId?: string | null;
}

export interface ForceBookingReconcileAttemptInput {
  bookingTransactionId: string;
  actorRef: string;
  subjectRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  attemptedAt: string;
  authoritativeReadResult?: BookingAuthoritativeReadResultInput | null;
  workerRunRef?: string | null;
  payloadArtifactRef?: string | null;
  edgeCorrelationId?: string | null;
}

export interface ResolveBookingManualDisputeInput {
  bookingTransactionId: string;
  actorRef: string;
  subjectRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  resolvedAt: string;
  auditReasonCode: string;
  resolution: ReconcileBookingCommitInput["resolution"];
  payloadArtifactRef?: string | null;
  edgeCorrelationId?: string | null;
}

export interface ProcessDueBookingReconciliationsInput {
  actorRef: string;
  subjectRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  processedAt: string;
  limit?: number | null;
  authoritativeReadResults?: Readonly<Record<string, BookingAuthoritativeReadResultInput | null>>;
  payloadArtifactRef?: string | null;
  edgeCorrelationId?: string | null;
}

export interface BookingReconciliationStatusBundle {
  bookingCase: BookingCaseBundle;
  bookingCommit: BookingCommitApplicationResult;
  reconciliation: BookingReconciliationBundle;
  externalConfirmationGate: ExternalConfirmationGateSnapshot | null;
  manualQueueEntry: BookingExceptionQueueEntrySnapshot | null;
}

export interface BookingReconciliationMutationResult extends BookingReconciliationStatusBundle {
  emittedEvents: readonly FoundationEventEnvelope<object>[];
}

export interface ProcessDueBookingReconciliationsResult {
  processed: readonly BookingReconciliationMutationResult[];
  emittedEvents: readonly FoundationEventEnvelope<object>[];
}

interface ObservationDraft {
  action: "observe" | "noop";
  observationKind: BookingCommitObservationKind;
  authoritativeProofClass: Exclude<BookingAuthoritativeProofClass, "none"> | null;
  providerReference: string | null;
  blockerReasonCode: string | null;
  recoveryMode: string | null;
  failureReasonCode: string | null;
  reasonCodes: readonly string[];
  evidenceAtoms: readonly BookingReconciliationEvidenceAtomSnapshot[];
  evidenceRefs: readonly string[];
  competingGateConfidences: readonly number[];
  semanticReceipt: unknown;
}

export interface BookingAuthoritativeReadAdapter {
  readAfterWrite(input: {
    bookingCase: BookingCaseBundle;
    bookingCommit: BookingCommitApplicationResult;
    reconciliation: BookingReconciliationBundle;
    attemptedAt: string;
    workerRunRef: string;
  }): Promise<BookingAuthoritativeReadResultInput | null>;
}

export class ExternalConfirmationGateEvaluator {
  constructor(
    private readonly bookingReservationApplication: Phase4BookingReservationApplication,
  ) {}

  async getCurrentGate(gateRef: string | null | undefined): Promise<ExternalConfirmationGateSnapshot | null> {
    const normalizedGateRef = optionalRef(gateRef);
    if (!normalizedGateRef) {
      return null;
    }
    const document =
      await this.bookingReservationApplication.reservationRepositories.getExternalConfirmationGate(
        normalizedGateRef,
      );
    return document?.toSnapshot() ?? null;
  }

  async evaluate(input: {
    bookingCommit: BookingCommitApplicationResult;
    reconciliation: BookingReconciliationBundle;
    evaluatedAt: string;
  }): Promise<ExternalConfirmationGateSnapshot | null> {
    const existingGate =
      await this.getCurrentGate(input.reconciliation.record.externalConfirmationGateRef);
    const atomsByRef = new Map<string, BookingReconciliationEvidenceAtomSnapshot>();
    const competingGateConfidences: number[] = [];
    let manualOverrideRequested = false;
    for (const attempt of input.reconciliation.attempts) {
      for (const atom of parseBookingReconciliationEvidenceAtoms(attempt)) {
        atomsByRef.set(atom.evidenceRef, atom);
      }
      for (const confidence of parseBookingReconciliationCompetingGateConfidences(attempt)) {
        competingGateConfidences.push(confidence);
      }
      manualOverrideRequested = manualOverrideRequested || attempt.manualOverrideRequested;
    }

    if (atomsByRef.size === 0) {
      return existingGate;
    }

    const authority = createReservationConfirmationAuthorityService(
      this.bookingReservationApplication.reservationRepositories,
    );
    const gate = await authority.refreshExternalConfirmationGate({
      gateId: existingGate?.gateId ?? input.bookingCommit.transaction.externalConfirmationGateRef ?? undefined,
      episodeId: input.bookingCommit.bookingCase.bookingCase.episodeRef,
      domain: "booking",
      domainObjectRef: input.bookingCommit.transaction.bookingTransactionId,
      transportMode: "booking_reconciliation",
      assuranceLevel: assuranceLevelForMode(
        input.reconciliation.record.authoritativeReadMode,
        manualOverrideRequested,
      ),
      evidenceModelVersionRef: `booking_reconciliation_gate::${input.bookingCommit.transaction.bookingTransactionId}`,
      requiredHardMatchRefs: ["selected_slot", "patient_identity", "appointment_window"],
      evidenceAtoms: [...atomsByRef.values()],
      confirmationDeadlineAt: input.reconciliation.record.confirmationDeadlineAt,
      priorProbability: existingGate?.confirmationConfidence ?? 0.55,
      createdAt: existingGate?.createdAt ?? input.bookingCommit.transaction.createdAt,
      updatedAt: ensureIsoTimestamp(input.evaluatedAt, "evaluatedAt"),
      thresholdPolicy: defaultReservationConfirmationThresholdPolicy,
      competingGateConfidences,
      manualOverrideRequested,
    });
    return gate.toSnapshot();
  }
}

export class AuthoritativeReadSettlementService {
  classify(input: {
    bookingCommit: BookingCommitApplicationResult;
    attemptOrdinal: number;
    confirmationDeadlineAt: string;
    attemptedAt: string;
    authoritativeReadResult: BookingAuthoritativeReadResultInput | null;
  }): ObservationDraft {
    const attemptedAt = ensureIsoTimestamp(input.attemptedAt, "attemptedAt");
    const mode = input.bookingCommit.transaction.authoritativeReadMode;
    if (!input.authoritativeReadResult) {
      if (compareIso(attemptedAt, input.confirmationDeadlineAt) > 0) {
        return {
          action: "observe",
          observationKind: "expired",
          authoritativeProofClass: null,
          providerReference: null,
          blockerReasonCode: null,
          recoveryMode: null,
          failureReasonCode: "authoritative_confirmation_timeout",
          reasonCodes: ["authoritative_confirmation_timeout"],
          evidenceAtoms: [
            {
              evidenceRef: `authoritative_read_timeout::${attemptedAt}`,
              sourceFamily: "authoritative_read",
              proofRef: null,
              logLikelihoodWeight: 0.8,
              polarity: "negative",
              contradictory: true,
              failsHardMatchRefs: ["appointment_window"],
            },
          ],
          evidenceRefs: [`authoritative_read_timeout::${attemptedAt}`],
          competingGateConfidences: [],
          semanticReceipt: { outcome: "expired", reasonCode: "authoritative_confirmation_timeout" },
        };
      }
      return {
        action: "noop",
        observationKind: "confirmation_pending",
        authoritativeProofClass: null,
        providerReference: null,
        blockerReasonCode: "authoritative_read_unavailable",
        recoveryMode: "retry_authoritative_read",
        failureReasonCode: null,
        reasonCodes: ["authoritative_read_unavailable"],
        evidenceAtoms: [
          {
            evidenceRef: `authoritative_read_unavailable::${attemptedAt}`,
            sourceFamily: "authoritative_read",
            proofRef: null,
            logLikelihoodWeight: 0.15,
            polarity: "negative",
          },
        ],
        evidenceRefs: [`authoritative_read_unavailable::${attemptedAt}`],
        competingGateConfidences: [],
        semanticReceipt: { outcome: "pending", reasonCode: "authoritative_read_unavailable" },
      };
    }

    const result = input.authoritativeReadResult;
    const observedAt = ensureIsoTimestamp(result.observedAt, "observedAt");
    const sourceFamily = optionalRef(result.sourceFamily) ?? "authoritative_read";
    const providerReference = optionalRef(result.providerReference);
    const reasonCode = optionalRef(result.reasonCode);
    const proofRef = optionalRef(result.proofRef) ?? providerReference;
    const hardMatches = hardMatchRefs(result.hardMatchRefs);
    const baseRef = deterministicId("booking_reconciliation_read", {
      bookingTransactionId: input.bookingCommit.transaction.bookingTransactionId,
      observedAt,
      outcome: result.outcome,
      providerReference,
      reasonCode,
      hardMatches,
    });

    if (result.outcome === "confirmed") {
      if (hardMatches.failed.length > 0 || hardMatches.matched.length < 3) {
        const conflictReason =
          reasonCode ??
          (hardMatches.failed.length > 0
            ? "authoritative_read_hard_match_failed"
            : "authoritative_read_hard_match_unknown");
        return {
          action: "observe",
          observationKind: "reconciliation_required",
          authoritativeProofClass: null,
          providerReference,
          blockerReasonCode: conflictReason,
          recoveryMode: "manual_reconciliation_required",
          failureReasonCode: null,
          reasonCodes: [conflictReason],
          evidenceAtoms: [
            {
              evidenceRef: `${baseRef}::conflict`,
              sourceFamily,
              proofRef,
              logLikelihoodWeight: 0.9,
              polarity: "negative",
              failsHardMatchRefs: hardMatches.failed,
              contradictory: true,
            },
          ],
          evidenceRefs: [`${baseRef}::conflict`],
          competingGateConfidences: result.competingGateConfidences ?? [],
          semanticReceipt: {
            outcome: "conflict",
            providerReference,
            reasonCode: conflictReason,
            hardMatches,
          },
        };
      }
      const proofClass: Exclude<BookingAuthoritativeProofClass, "none"> =
        mode === "read_after_write" ? "same_commit_read_after_write" : "reconciled_confirmation";
      return {
        action: "observe",
        observationKind:
          proofClass === "same_commit_read_after_write"
            ? "same_commit_read_after_write"
            : "reconciled_confirmation",
        authoritativeProofClass: proofClass,
        providerReference,
        blockerReasonCode: null,
        recoveryMode: null,
        failureReasonCode: null,
        reasonCodes: ["authoritative_read_confirmed"],
        evidenceAtoms: [
          {
            evidenceRef: `${baseRef}::confirmed`,
            sourceFamily,
            proofRef,
            logLikelihoodWeight: 1.35,
            polarity: "positive",
            satisfiesHardMatchRefs: hardMatches.matched,
          },
        ],
        evidenceRefs: [`${baseRef}::confirmed`],
        competingGateConfidences: result.competingGateConfidences ?? [],
        semanticReceipt: {
          outcome: "confirmed",
          providerReference,
          hardMatches,
          proofClass,
        },
      };
    }

    if (result.outcome === "pending") {
      return {
        action: "observe",
        observationKind: "confirmation_pending",
        authoritativeProofClass: null,
        providerReference,
        blockerReasonCode: reasonCode ?? "authoritative_read_pending",
        recoveryMode: "retry_authoritative_read",
        failureReasonCode: null,
        reasonCodes: [reasonCode ?? "authoritative_read_pending"],
        evidenceAtoms: [
          {
            evidenceRef: `${baseRef}::pending`,
            sourceFamily,
            proofRef,
            logLikelihoodWeight: 0.2,
            polarity: "positive",
            satisfiesHardMatchRefs: hardMatches.matched,
          },
        ],
        evidenceRefs: [`${baseRef}::pending`],
        competingGateConfidences: result.competingGateConfidences ?? [],
        semanticReceipt: {
          outcome: "pending",
          providerReference,
          hardMatches,
        },
      };
    }

    if (result.outcome === "not_found") {
      const provisionalPending = input.attemptOrdinal <= 1 && compareIso(observedAt, input.confirmationDeadlineAt) <= 0;
      return {
        action: "observe",
        observationKind: provisionalPending ? "confirmation_pending" : "reconciliation_required",
        authoritativeProofClass: null,
        providerReference,
        blockerReasonCode:
          reasonCode ??
          (provisionalPending
            ? "authoritative_read_not_yet_visible"
            : "accepted_but_authoritative_read_missing"),
        recoveryMode: provisionalPending
          ? "retry_authoritative_read"
          : "manual_reconciliation_required",
        failureReasonCode: null,
        reasonCodes: [
          reasonCode ??
            (provisionalPending
              ? "authoritative_read_not_yet_visible"
              : "accepted_but_authoritative_read_missing"),
        ],
        evidenceAtoms: [
          {
            evidenceRef: `${baseRef}::not_found`,
            sourceFamily,
            proofRef,
            logLikelihoodWeight: provisionalPending ? 0.3 : 0.8,
            polarity: "negative",
            contradictory: !provisionalPending,
            failsHardMatchRefs: provisionalPending ? [] : ["appointment_window"],
          },
        ],
        evidenceRefs: [`${baseRef}::not_found`],
        competingGateConfidences: result.competingGateConfidences ?? [],
        semanticReceipt: {
          outcome: "not_found",
          providerReference,
          reasonCode,
        },
      };
    }

    if (result.outcome === "conflict") {
      const conflictReason = reasonCode ?? "authoritative_read_conflict";
      return {
        action: "observe",
        observationKind: "reconciliation_required",
        authoritativeProofClass: null,
        providerReference,
        blockerReasonCode: conflictReason,
        recoveryMode: "manual_reconciliation_required",
        failureReasonCode: null,
        reasonCodes: [conflictReason],
        evidenceAtoms: [
          {
            evidenceRef: `${baseRef}::conflict`,
            sourceFamily,
            proofRef,
            logLikelihoodWeight: 0.95,
            polarity: "negative",
            contradictory: true,
            failsHardMatchRefs: hardMatches.failed.length > 0 ? hardMatches.failed : ["patient_identity"],
          },
        ],
        evidenceRefs: [`${baseRef}::conflict`],
        competingGateConfidences: result.competingGateConfidences ?? [],
        semanticReceipt: {
          outcome: "conflict",
          providerReference,
          reasonCode: conflictReason,
          hardMatches,
        },
      };
    }

    if (result.outcome === "failed") {
      return {
        action: "observe",
        observationKind: "authoritative_failure",
        authoritativeProofClass: null,
        providerReference,
        blockerReasonCode: null,
        recoveryMode: null,
        failureReasonCode: reasonCode ?? "authoritative_read_failed",
        reasonCodes: [reasonCode ?? "authoritative_read_failed"],
        evidenceAtoms: [
          {
            evidenceRef: `${baseRef}::failed`,
            sourceFamily,
            proofRef,
            logLikelihoodWeight: 0.9,
            polarity: "negative",
            contradictory: true,
          },
        ],
        evidenceRefs: [`${baseRef}::failed`],
        competingGateConfidences: result.competingGateConfidences ?? [],
        semanticReceipt: {
          outcome: "failed",
          providerReference,
          reasonCode,
        },
      };
    }

    return {
      action: "observe",
      observationKind: "expired",
      authoritativeProofClass: null,
      providerReference,
      blockerReasonCode: null,
      recoveryMode: null,
      failureReasonCode: reasonCode ?? "authoritative_read_expired",
      reasonCodes: [reasonCode ?? "authoritative_read_expired"],
      evidenceAtoms: [
        {
          evidenceRef: `${baseRef}::expired`,
          sourceFamily,
          proofRef,
          logLikelihoodWeight: 0.75,
          polarity: "negative",
          contradictory: true,
          failsHardMatchRefs: ["appointment_window"],
        },
      ],
      evidenceRefs: [`${baseRef}::expired`],
      competingGateConfidences: result.competingGateConfidences ?? [],
      semanticReceipt: {
        outcome: "expired",
        providerReference,
        reasonCode,
      },
    };
  }
}

interface ReconciliationDependencies {
  bookingCaseApplication: Phase4BookingCaseApplication;
  bookingCommitApplication: Phase4BookingCommitApplication;
  bookingReservationApplication: Phase4BookingReservationApplication;
  assistedBookingService: Phase4AssistedBookingService;
  reconciliationService: ReturnType<typeof createPhase4BookingReconciliationService>;
  gateEvaluator: ExternalConfirmationGateEvaluator;
}

async function loadCommitByTransactionId(
  dependencies: ReconciliationDependencies,
  bookingTransactionId: string,
  requestedAt: string,
): Promise<BookingCommitApplicationResult | null> {
  const repositories = dependencies.bookingCommitApplication.bookingCommitRepositories;
  const transactionDocument = await repositories.getBookingTransaction(
    requireRef(bookingTransactionId, "bookingTransactionId"),
  );
  if (!transactionDocument) {
    return null;
  }
  const transaction = transactionDocument.toSnapshot();
  const confirmationTruthDocument =
    await repositories.getBookingConfirmationTruthProjection(
      transaction.confirmationTruthProjectionRef,
    );
  invariant(
    confirmationTruthDocument,
    "BOOKING_CONFIRMATION_TRUTH_NOT_FOUND",
    `BookingConfirmationTruthProjection ${transaction.confirmationTruthProjectionRef} was not found.`,
  );
  const appointmentRecord = transaction.appointmentRecordRef
    ? (await repositories.getAppointmentRecord(transaction.appointmentRecordRef))?.toSnapshot() ?? null
    : null;
  const bookingException = transaction.bookingExceptionRef
    ? (await repositories.getBookingException(transaction.bookingExceptionRef))?.toSnapshot() ?? null
    : null;
  const journal = (
    await repositories.listBookingTransactionJournalEntries(transaction.bookingTransactionId)
  ).map((entry) => entry.toSnapshot());
  const bookingCase = await dependencies.bookingCaseApplication.queryBookingCase(
    transaction.bookingCaseId,
  );
  invariant(
    bookingCase,
    "BOOKING_CASE_NOT_FOUND",
    `BookingCase ${transaction.bookingCaseId} was not found.`,
  );
  const reservationTruth =
    await dependencies.bookingReservationApplication.queryReservationTruth({
      scopeFamily: "offer_session",
      scopeObjectRef: transaction.offerSessionRef,
      requestedAt,
    });
  return {
    bookingCase,
    transaction,
    confirmationTruthProjection: confirmationTruthDocument.toSnapshot(),
    appointmentRecord,
    bookingException,
    journal,
    reservationTruth,
    dispatchAttemptRef: transaction.dispatchAttemptRef,
    receiptCheckpointRef: transaction.latestReceiptCheckpointRef,
    replayDecisionClass: null,
    collisionReviewRef: null,
    replayed: false,
    emittedEvents: [],
  };
}

function deriveReconciliationPosture(input: {
  bookingCommit: BookingCommitApplicationResult;
  currentRecord: BookingReconciliationRecordSnapshot | null;
  observedAt: string;
  confirmationDeadlineAt: string;
  forceManualAttention?: boolean;
}): {
  reconcileState: BookingReconciliationState;
  nextAttemptAt: string | null;
  manualAttentionRequired: boolean;
} {
  const observedAt = ensureIsoTimestamp(input.observedAt, "observedAt");
  const currentAttemptOrdinal = input.currentRecord?.currentAttemptOrdinal ?? 0;
  const mode = input.bookingCommit.transaction.authoritativeReadMode;
  if (isFinalTransactionOutcome(input.bookingCommit.transaction.authoritativeOutcomeState)) {
    return {
      reconcileState: stateForFinalOutcome(input.bookingCommit.transaction.authoritativeOutcomeState),
      nextAttemptAt: null,
      manualAttentionRequired: false,
    };
  }
  if (input.forceManualAttention || input.currentRecord?.manualAttentionRequired) {
    return {
      reconcileState: "manual_attention",
      nextAttemptAt: null,
      manualAttentionRequired: true,
    };
  }
  const attemptsExceeded = currentAttemptOrdinal >= maxAttemptsForMode(mode);
  const deadlinePassed = compareIso(observedAt, input.confirmationDeadlineAt) > 0;
  if (input.bookingCommit.transaction.authoritativeOutcomeState === "reconciliation_required") {
    const nextAttemptAt =
      attemptsExceeded || deadlinePassed || !input.bookingCommit.transaction.supportsDisputeRecovery
        ? null
        : nextAttemptAtForMode(mode, currentAttemptOrdinal + 1, observedAt);
    return {
      reconcileState: nextAttemptAt ? "disputed" : "manual_attention",
      nextAttemptAt,
      manualAttentionRequired: nextAttemptAt === null,
    };
  }
  if (input.bookingCommit.transaction.authoritativeOutcomeState === "confirmation_pending") {
    const nextAttemptAt =
      attemptsExceeded || deadlinePassed
        ? null
        : nextAttemptAtForMode(mode, currentAttemptOrdinal + 1, observedAt);
    return {
      reconcileState:
        mode === "gate_required"
          ? nextAttemptAt
            ? "awaiting_callback"
            : "manual_attention"
          : nextAttemptAt
            ? "poll_due"
            : "manual_attention",
      nextAttemptAt,
      manualAttentionRequired: nextAttemptAt === null,
    };
  }
  return {
    reconcileState: "pending",
    nextAttemptAt: nextAttemptAtForMode(mode, currentAttemptOrdinal + 1, observedAt),
    manualAttentionRequired: false,
  };
}

async function synchronizeReconciliationFromCommit(input: {
  dependencies: ReconciliationDependencies;
  bookingCommit: BookingCommitApplicationResult;
  observedAt: string;
  forceManualAttention?: boolean;
  queueEntryRef?: string | null;
}): Promise<BookingReconciliationBundle> {
  const current =
    await input.dependencies.reconciliationService.queryCurrentBookingReconciliation({
      bookingTransactionRef: input.bookingCommit.transaction.bookingTransactionId,
    });
  const gate = await input.dependencies.gateEvaluator.getCurrentGate(
    input.bookingCommit.transaction.externalConfirmationGateRef,
  );
  const confirmationDeadlineAt =
    gate?.confirmationDeadlineAt ??
    current?.record.confirmationDeadlineAt ??
    addSeconds(
      input.bookingCommit.transaction.createdAt,
      confirmationDeadlineSecondsForMode(input.bookingCommit.transaction.authoritativeReadMode),
    );
  const posture = deriveReconciliationPosture({
    bookingCommit: input.bookingCommit,
    currentRecord: current?.record ?? null,
    observedAt: input.observedAt,
    confirmationDeadlineAt,
    forceManualAttention: input.forceManualAttention,
  });
  return input.dependencies.reconciliationService.syncBookingReconciliation({
    bookingReconciliationRecordId: current?.record.bookingReconciliationRecordId ?? null,
    bookingCaseRef: input.bookingCommit.bookingCase.bookingCase.bookingCaseId,
    bookingTransactionRef: input.bookingCommit.transaction.bookingTransactionId,
    requestLineageRef: input.bookingCommit.transaction.requestLineageRef,
    offerSessionRef: input.bookingCommit.transaction.offerSessionRef,
    selectedSlotRef: input.bookingCommit.transaction.selectedSlotRef,
    reservationTruthProjectionRef:
      input.bookingCommit.reservationTruth?.projection.reservationTruthProjectionId ?? null,
    confirmationTruthProjectionRef:
      input.bookingCommit.confirmationTruthProjection.bookingConfirmationTruthProjectionId,
    appointmentRecordRef: input.bookingCommit.appointmentRecord?.appointmentRecordId ?? null,
    externalConfirmationGateRef:
      gate?.gateId ?? input.bookingCommit.transaction.externalConfirmationGateRef,
    latestReceiptCheckpointRef: input.bookingCommit.transaction.latestReceiptCheckpointRef,
    queueEntryRef: optionalRef(input.queueEntryRef) ?? current?.record.queueEntryRef ?? null,
    authoritativeReadAndConfirmationPolicyRef:
      input.bookingCommit.transaction.authoritativeReadAndConfirmationPolicyRef,
    authoritativeReadMode: input.bookingCommit.transaction.authoritativeReadMode,
    reconcileState: posture.reconcileState,
    manualAttentionRequired: posture.manualAttentionRequired,
    manualDisputeState:
      current?.record.manualDisputeState ??
      (posture.manualAttentionRequired ? "open" : "none"),
    gateState: gate?.state ?? null,
    gateConfidence: gate?.confirmationConfidence ?? null,
    competingGateMargin: gate?.competingGateMargin ?? null,
    confirmationDeadlineAt,
    nextAttemptAt: posture.nextAttemptAt,
    finalOutcomeState: input.bookingCommit.transaction.authoritativeOutcomeState,
    latestReasonCodes: uniqueSorted([
      ...(current?.record.latestReasonCodes ?? []),
      ...(input.bookingCommit.bookingException ? [input.bookingCommit.bookingException.reasonCode] : []),
      ...input.bookingCommit.transaction.blockerReasonCodes,
      ...input.bookingCommit.transaction.reconciliationReasonCodes,
    ]),
    evidenceRefs: uniqueSorted([
      ...(current?.record.evidenceRefs ?? []),
      ...(gate ? [gate.gateId] : []),
      ...(input.bookingCommit.bookingException ? [input.bookingCommit.bookingException.bookingExceptionId] : []),
      ...(input.bookingCommit.transaction.latestReceiptCheckpointRef
        ? [input.bookingCommit.transaction.latestReceiptCheckpointRef]
        : []),
    ]),
    observedAt: input.observedAt,
  });
}

async function activeManualQueueEntry(
  assistedBookingService: Phase4AssistedBookingService,
  bookingCaseId: string,
): Promise<BookingExceptionQueueEntrySnapshot | null> {
  const entries = await assistedBookingService.queryBookingExceptionQueue({
    bookingCaseRef: bookingCaseId,
    entryStates: ["open", "claimed"],
  });
  return entries.find((entry) => entry.exceptionFamily === "ambiguous_commit") ?? null;
}

async function synchronizeManualAttentionQueue(input: {
  dependencies: ReconciliationDependencies;
  bookingCommit: BookingCommitApplicationResult;
  reconciliation: BookingReconciliationBundle;
  observedAt: string;
  reasonCodes: readonly string[];
  evidenceRefs: readonly string[];
}): Promise<BookingExceptionQueueEntrySnapshot | null> {
  const current = await activeManualQueueEntry(
    input.dependencies.assistedBookingService,
    input.bookingCommit.bookingCase.bookingCase.bookingCaseId,
  );
  if (!input.reconciliation.record.manualAttentionRequired) {
    if (current) {
      await input.dependencies.assistedBookingService.resolveBookingExceptionQueueEntry({
        bookingExceptionQueueEntryId: current.bookingExceptionQueueEntryId,
        resolvedAt: input.observedAt,
        reasonCodes: ["condition_cleared"],
      });
    }
    return null;
  }
  const result =
    await input.dependencies.assistedBookingService.upsertBookingExceptionQueueEntry({
      bookingCaseRef: input.bookingCommit.bookingCase.bookingCase.bookingCaseId,
      taskRef: input.bookingCommit.bookingCase.bookingCase.originTriageTaskRef,
      assistedBookingSessionRef: null,
      exceptionFamily: "ambiguous_commit",
      severity: "critical",
      selectedAnchorRef:
        input.bookingCommit.transaction.selectedSlotRef ??
        input.bookingCommit.bookingCase.bookingCase.bookingCaseId,
      currentSnapshotRef: input.bookingCommit.transaction.bookingTransactionId,
      providerAdapterBindingRef: input.bookingCommit.transaction.providerAdapterBindingRef,
      providerAdapterBindingHash: input.bookingCommit.transaction.providerAdapterBindingHash,
      capabilityResolutionRef: input.bookingCommit.transaction.capabilityResolutionRef,
      capabilityTupleHash: input.bookingCommit.transaction.capabilityTupleHash,
      reviewActionLeaseRef: input.bookingCommit.transaction.reviewActionLeaseRef,
      surfaceRouteContractRef: input.bookingCommit.bookingCase.bookingCase.surfaceRouteContractRef,
      surfacePublicationRef: input.bookingCommit.bookingCase.bookingCase.surfacePublicationRef,
      runtimePublicationBundleRef:
        input.bookingCommit.bookingCase.bookingCase.runtimePublicationBundleRef,
      taskCompletionSettlementEnvelopeRef: null,
      requestLifecycleLeaseRef: input.bookingCommit.bookingCase.bookingCase.requestLifecycleLeaseRef,
      requestOwnershipEpochRef: input.bookingCommit.bookingCase.bookingCase.ownershipEpoch,
      staleOwnerRecoveryRef: input.bookingCommit.bookingCase.bookingCase.staleOwnerRecoveryRef,
      reasonCodes: uniqueSorted([
        ...input.reasonCodes,
        ...input.reconciliation.record.latestReasonCodes,
      ]),
      evidenceRefs: uniqueSorted([
        ...input.evidenceRefs,
        ...input.reconciliation.record.evidenceRefs,
        input.reconciliation.record.bookingReconciliationRecordId,
      ]),
      observedAt: input.observedAt,
      sameShellRecoveryRouteRef: `/workspace/bookings/${input.bookingCommit.bookingCase.bookingCase.bookingCaseId}`,
    });
  return result.entry;
}

async function materializeStatusBundle(input: {
  dependencies: ReconciliationDependencies;
  bookingCommit: BookingCommitApplicationResult;
  reconciliation: BookingReconciliationBundle;
}): Promise<BookingReconciliationStatusBundle> {
  const gate = await input.dependencies.gateEvaluator.getCurrentGate(
    input.reconciliation.record.externalConfirmationGateRef,
  );
  const queueEntry = await activeManualQueueEntry(
    input.dependencies.assistedBookingService,
    input.bookingCommit.bookingCase.bookingCase.bookingCaseId,
  );
  return {
    bookingCase: input.bookingCommit.bookingCase,
    bookingCommit: input.bookingCommit,
    reconciliation: input.reconciliation,
    externalConfirmationGate: gate,
    manualQueueEntry: queueEntry,
  };
}

export class BookingReceiptAssimilator {
  constructor(private readonly dependencies: ReconciliationDependencies) {}

  async assimilate(input: AssimilateBookingReceiptInput): Promise<BookingReconciliationMutationResult> {
    const commit = await loadCommitByTransactionId(
      this.dependencies,
      input.bookingTransactionId,
      input.observedAt,
    );
    invariant(
      commit,
      "BOOKING_TRANSACTION_NOT_FOUND",
      `BookingTransaction ${input.bookingTransactionId} was not found.`,
    );
    const payloadArtifactRef =
      optionalRef(input.payloadArtifactRef) ??
      defaultPayloadArtifactRef({
        bookingTransactionId: input.bookingTransactionId,
        commandActionRecordRef: input.commandActionRecordRef,
      });
    const edgeCorrelationId =
      optionalRef(input.edgeCorrelationId) ??
      defaultEdgeCorrelationId({
        bookingTransactionId: input.bookingTransactionId,
        commandActionRecordRef: input.commandActionRecordRef,
      });
    const baseReconciliation = await synchronizeReconciliationFromCommit({
      dependencies: this.dependencies,
      bookingCommit: commit,
      observedAt: input.observedAt,
    });
    const signatureVerification = input.signatureVerification ?? "not_supported";
    const networkVerification = input.networkVerification ?? "not_supported";
    const schemaVerified = input.schemaVerified ?? true;
    const securityFailed =
      signatureVerification === "failed" ||
      networkVerification === "failed" ||
      !schemaVerified;
    const securityReasonCodes = uniqueSorted([
      ...(signatureVerification === "failed" ? ["callback_signature_verification_failed"] : []),
      ...(networkVerification === "failed" ? ["callback_network_policy_failed"] : []),
      ...(!schemaVerified ? ["callback_schema_validation_failed"] : []),
    ]);

    const attemptSemanticPayload = {
      kind: "callback_receipt",
      transportMessageId: input.transportMessageId,
      orderingKey: input.orderingKey,
      callbackState: input.callbackState,
      providerReference: optionalRef(input.providerReference),
      providerCorrelationRef: optionalRef(input.providerCorrelationRef),
      securityReasonCodes,
      semanticReceipt: serializeSemanticReceipt(input.semanticReceipt ?? input.rawReceipt),
    };

    if (securityFailed) {
      const attempted = await this.dependencies.reconciliationService.recordBookingReconciliationAttempt({
        bookingReconciliationRecordRef: baseReconciliation.record.bookingReconciliationRecordId,
        bookingCaseRef: commit.bookingCase.bookingCase.bookingCaseId,
        bookingTransactionRef: commit.transaction.bookingTransactionId,
        attemptKey: buildAttemptKey({
          bookingTransactionId: commit.transaction.bookingTransactionId,
          trigger: "provider_callback",
          semanticPayload: attemptSemanticPayload,
        }),
        trigger: "provider_callback",
        workerRunRef: bookingReconciliationServiceNameId(input.commandActionRecordRef),
        action: "queue_only",
        outcome: "security_rejected",
        observationKind: null,
        authoritativeProofClass: null,
        providerReference: optionalRef(input.providerReference),
        reasonCodes: securityReasonCodes,
        evidenceRefs: securityReasonCodes.map(
          (reasonCode) => `callback_security::${reasonCode}::${input.transportMessageId}`,
        ),
        evidenceAtoms: securityReasonCodes.map((reasonCode) => ({
          evidenceRef: `callback_security::${reasonCode}::${input.transportMessageId}`,
          sourceFamily: "supplier_callback",
          proofRef: null,
          logLikelihoodWeight: 1,
          polarity: "negative" as const,
          contradictory: true,
        })),
        startedAt: input.observedAt,
        completedAt: input.observedAt,
        nextAttemptAt: null,
      });
      const synced = await synchronizeReconciliationFromCommit({
        dependencies: this.dependencies,
        bookingCommit: commit,
        observedAt: input.observedAt,
        forceManualAttention: true,
      });
      const queueEntry = await synchronizeManualAttentionQueue({
        dependencies: this.dependencies,
        bookingCommit: commit,
        reconciliation: synced,
        observedAt: input.observedAt,
        reasonCodes: securityReasonCodes,
        evidenceRefs: attempted.attempt.evidenceRefs,
      });
      const finalReconciliation = await synchronizeReconciliationFromCommit({
        dependencies: this.dependencies,
        bookingCommit: commit,
        observedAt: input.observedAt,
        forceManualAttention: true,
        queueEntryRef: queueEntry?.bookingExceptionQueueEntryId ?? null,
      });
      const status = await materializeStatusBundle({
        dependencies: this.dependencies,
        bookingCommit: commit,
        reconciliation: finalReconciliation,
      });
      return {
        ...status,
        emittedEvents: [
          buildReconciliationStartedEvent({
            commit,
            attempt: attempted.attempt,
          }),
          buildDisputeOpenedEvent({
            commit,
            attempt: attempted.attempt,
          }),
        ],
      };
    }

    const callbackShape = callbackObservationKind(input.callbackState);
    const commitResult = await this.dependencies.bookingCommitApplication.recordAuthoritativeObservation({
      bookingTransactionId: commit.transaction.bookingTransactionId,
      observationKind: callbackShape.observationKind,
      actorRef: input.actorRef,
      subjectRef: input.subjectRef,
      commandActionRecordRef: input.commandActionRecordRef,
      commandSettlementRecordRef: input.commandSettlementRecordRef,
      observedAt: input.observedAt,
      transportMessageId: requireRef(input.transportMessageId, "transportMessageId"),
      orderingKey: requireRef(input.orderingKey, "orderingKey"),
      rawReceipt: input.rawReceipt,
      semanticReceipt: serializeSemanticReceipt(input.semanticReceipt ?? input.rawReceipt),
      providerCorrelationRef: optionalRef(input.providerCorrelationRef),
      providerReference: optionalRef(input.providerReference),
      authoritativeProofClass: null,
      externalConfirmationGateRef:
        commit.transaction.externalConfirmationGateRef,
      blockerReasonCode: callbackShape.blockerReasonCode,
      recoveryMode: callbackShape.recoveryMode,
      failureReasonCode: callbackShape.failureReasonCode,
      linkedSettlementRef: optionalRef(input.linkedSettlementRef),
      payloadArtifactRef,
      edgeCorrelationId,
    });
    const callbackReasonCode =
      callbackShape.blockerReasonCode ?? callbackShape.failureReasonCode ?? input.callbackState;
    const attempted = await this.dependencies.reconciliationService.recordBookingReconciliationAttempt({
      bookingReconciliationRecordRef: baseReconciliation.record.bookingReconciliationRecordId,
      bookingCaseRef: commitResult.bookingCase.bookingCase.bookingCaseId,
      bookingTransactionRef: commitResult.transaction.bookingTransactionId,
      attemptKey: buildAttemptKey({
        bookingTransactionId: commitResult.transaction.bookingTransactionId,
        trigger: "provider_callback",
        semanticPayload: attemptSemanticPayload,
      }),
      trigger: "provider_callback",
      workerRunRef: bookingReconciliationServiceNameId(input.commandActionRecordRef),
      action:
        callbackShape.observationKind === "confirmation_pending"
          ? "observe_pending"
          : callbackShape.observationKind === "reconciliation_required"
            ? "observe_dispute"
            : callbackShape.observationKind === "authoritative_failure"
              ? "observe_failed"
              : "observe_expired",
      outcome:
        commitResult.transaction.authoritativeOutcomeState === "booked"
          ? "confirmed"
          : commitResult.transaction.authoritativeOutcomeState === "failed"
            ? "failed"
            : commitResult.transaction.authoritativeOutcomeState === "expired"
              ? "expired"
              : callbackShape.observationKind === "reconciliation_required"
                ? "disputed"
                : "pending",
      observationKind: callbackShape.observationKind,
      authoritativeProofClass: null,
      providerReference: optionalRef(input.providerReference),
      receiptCheckpointRef: commitResult.receiptCheckpointRef,
      gateRef: commitResult.transaction.externalConfirmationGateRef,
      reasonCodes: [callbackReasonCode],
      evidenceRefs: callbackEvidenceAtoms({
        receiptState: input.callbackState,
        providerReference: optionalRef(input.providerReference),
        observedAt: input.observedAt,
        reasonCode: callbackReasonCode,
      }).map((atom) => atom.evidenceRef),
      evidenceAtoms: callbackEvidenceAtoms({
        receiptState: input.callbackState,
        providerReference: optionalRef(input.providerReference),
        observedAt: input.observedAt,
        reasonCode: callbackReasonCode,
      }),
      startedAt: input.observedAt,
      completedAt: input.observedAt,
      nextAttemptAt: null,
    });
    const gate = await this.dependencies.gateEvaluator.evaluate({
      bookingCommit: commitResult,
      reconciliation:
        (await this.dependencies.reconciliationService.queryCurrentBookingReconciliation({
          bookingTransactionRef: commitResult.transaction.bookingTransactionId,
        })) ?? baseReconciliation,
      evaluatedAt: input.observedAt,
    });
    const synced = await synchronizeReconciliationFromCommit({
      dependencies: this.dependencies,
      bookingCommit: commitResult,
      observedAt: input.observedAt,
    });
    const queueEntry = await synchronizeManualAttentionQueue({
      dependencies: this.dependencies,
      bookingCommit: commitResult,
      reconciliation: synced,
      observedAt: input.observedAt,
      reasonCodes: attempted.attempt.reasonCodes,
      evidenceRefs: attempted.attempt.evidenceRefs,
    });
    const finalReconciliation = await synchronizeReconciliationFromCommit({
      dependencies: this.dependencies,
      bookingCommit: commitResult,
      observedAt: input.observedAt,
      queueEntryRef: queueEntry?.bookingExceptionQueueEntryId ?? null,
    });
    const status = await materializeStatusBundle({
      dependencies: this.dependencies,
      bookingCommit: commitResult,
      reconciliation: finalReconciliation,
    });
    const emittedEvents: FoundationEventEnvelope<object>[] = [
      ...commitResult.emittedEvents,
      buildReconciliationStartedEvent({ commit: commitResult, attempt: attempted.attempt }),
      buildEvidenceObservedEvent({ commit: commitResult, attempt: attempted.attempt }),
    ];
    if (gate) {
      emittedEvents.push(buildGateUpdatedEvent({ commit: commitResult, gate }));
    }
    if (
      commitResult.transaction.authoritativeOutcomeState === "reconciliation_required" ||
      finalReconciliation.record.manualAttentionRequired
    ) {
      emittedEvents.push(buildDisputeOpenedEvent({ commit: commitResult, attempt: attempted.attempt }));
    }
    if (commitResult.transaction.authoritativeOutcomeState === "booked") {
      emittedEvents.push(
        buildFinalSettlementEvent({
          eventType: "booking.reconciliation.transaction_confirmed",
          commit: commitResult,
          attempt: attempted.attempt,
        }),
      );
    }
    if (
      commitResult.transaction.authoritativeOutcomeState === "failed" ||
      commitResult.transaction.authoritativeOutcomeState === "expired"
    ) {
      emittedEvents.push(
        buildFinalSettlementEvent({
          eventType: "booking.reconciliation.transaction_failed",
          commit: commitResult,
          attempt: attempted.attempt,
        }),
      );
    }
    return {
      ...status,
      emittedEvents,
    };
  }
}

export class BookingReconciliationWorker {
  constructor(
    private readonly dependencies: ReconciliationDependencies,
    private readonly authoritativeReadSettlementService: AuthoritativeReadSettlementService,
    private readonly authoritativeReadAdapter: BookingAuthoritativeReadAdapter | null,
  ) {}

  async forceAttempt(input: ForceBookingReconcileAttemptInput): Promise<BookingReconciliationMutationResult> {
    const commit = await loadCommitByTransactionId(
      this.dependencies,
      input.bookingTransactionId,
      input.attemptedAt,
    );
    invariant(
      commit,
      "BOOKING_TRANSACTION_NOT_FOUND",
      `BookingTransaction ${input.bookingTransactionId} was not found.`,
    );
    const payloadArtifactRef =
      optionalRef(input.payloadArtifactRef) ??
      defaultPayloadArtifactRef({
        bookingTransactionId: input.bookingTransactionId,
        commandActionRecordRef: input.commandActionRecordRef,
      });
    const edgeCorrelationId =
      optionalRef(input.edgeCorrelationId) ??
      defaultEdgeCorrelationId({
        bookingTransactionId: input.bookingTransactionId,
        commandActionRecordRef: input.commandActionRecordRef,
      });
    const baseReconciliation = await synchronizeReconciliationFromCommit({
      dependencies: this.dependencies,
      bookingCommit: commit,
      observedAt: input.attemptedAt,
    });
    if (isFinalTransactionOutcome(commit.transaction.authoritativeOutcomeState)) {
      const status = await materializeStatusBundle({
        dependencies: this.dependencies,
        bookingCommit: commit,
        reconciliation: baseReconciliation,
      });
      return {
        ...status,
        emittedEvents: [],
      };
    }
    const workerRunRef =
      optionalRef(input.workerRunRef) ??
      bookingReconciliationServiceNameId(
        `${input.commandActionRecordRef}_${commit.transaction.bookingTransactionId}`,
      );
    const authoritativeReadResult =
      input.authoritativeReadResult ??
      (await this.authoritativeReadAdapter?.readAfterWrite({
        bookingCase: commit.bookingCase,
        bookingCommit: commit,
        reconciliation: baseReconciliation,
        attemptedAt: input.attemptedAt,
        workerRunRef,
      })) ??
      null;
    const draft = this.authoritativeReadSettlementService.classify({
      bookingCommit: commit,
      attemptOrdinal: baseReconciliation.record.currentAttemptOrdinal + 1,
      confirmationDeadlineAt: baseReconciliation.record.confirmationDeadlineAt,
      attemptedAt: input.attemptedAt,
      authoritativeReadResult,
    });

    let commitResult = commit;
    if (draft.action === "observe") {
      const semanticReceipt = {
        source: "authoritative_read",
        attemptedAt: input.attemptedAt,
        draft: draft.semanticReceipt,
      };
      commitResult = await this.dependencies.bookingCommitApplication.recordAuthoritativeObservation({
        bookingTransactionId: commit.transaction.bookingTransactionId,
        observationKind: draft.observationKind,
        actorRef: input.actorRef,
        subjectRef: input.subjectRef,
        commandActionRecordRef: input.commandActionRecordRef,
        commandSettlementRecordRef: input.commandSettlementRecordRef,
        observedAt: authoritativeReadResult?.observedAt ?? input.attemptedAt,
        transportMessageId: buildTransportMessageId({
          bookingTransactionId: commit.transaction.bookingTransactionId,
          semanticPayload: semanticReceipt,
        }),
        orderingKey: buildOrderingKey({
          observedAt: authoritativeReadResult?.observedAt ?? input.attemptedAt,
          semanticPayload: semanticReceipt,
        }),
        rawReceipt: authoritativeReadResult?.rawPayload ?? semanticReceipt,
        semanticReceipt,
        providerCorrelationRef: null,
        providerReference: draft.providerReference,
        authoritativeProofClass: draft.authoritativeProofClass,
        externalConfirmationGateRef: commit.transaction.externalConfirmationGateRef,
        blockerReasonCode: draft.blockerReasonCode,
        recoveryMode: draft.recoveryMode,
        failureReasonCode: draft.failureReasonCode,
        linkedSettlementRef: null,
        payloadArtifactRef,
        edgeCorrelationId,
      });
    }
    const nextDraftAttemptAt =
      draft.action === "noop"
        ? nextAttemptAtForMode(
            commit.transaction.authoritativeReadMode,
            baseReconciliation.record.currentAttemptOrdinal + 1,
            input.attemptedAt,
          )
        : null;
    const attempted = await this.dependencies.reconciliationService.recordBookingReconciliationAttempt({
      bookingReconciliationRecordRef: baseReconciliation.record.bookingReconciliationRecordId,
      bookingCaseRef: commitResult.bookingCase.bookingCase.bookingCaseId,
      bookingTransactionRef: commitResult.transaction.bookingTransactionId,
      attemptKey: buildAttemptKey({
        bookingTransactionId: commitResult.transaction.bookingTransactionId,
        trigger: "manual_retry",
        semanticPayload: {
          authoritativeReadResult,
          draft: draft.semanticReceipt,
        },
      }),
      trigger: "manual_retry",
      workerRunRef,
      action:
        draft.action === "noop"
          ? "noop"
          : draft.observationKind === "confirmation_pending"
            ? "observe_pending"
            : draft.observationKind === "reconciliation_required"
              ? "observe_dispute"
              : draft.observationKind === "authoritative_failure"
                ? "observe_failed"
                : draft.observationKind === "expired"
                  ? "observe_expired"
                  : "observe_confirmed",
      outcome:
        commitResult.transaction.authoritativeOutcomeState === "booked"
          ? "confirmed"
          : commitResult.transaction.authoritativeOutcomeState === "failed"
            ? "failed"
            : commitResult.transaction.authoritativeOutcomeState === "expired"
              ? "expired"
              : draft.observationKind === "reconciliation_required"
                ? "disputed"
                : draft.action === "noop"
                  ? "pending"
                  : "pending",
      observationKind: draft.action === "observe" ? draft.observationKind : null,
      authoritativeProofClass: draft.authoritativeProofClass,
      providerReference: draft.providerReference,
      receiptCheckpointRef: commitResult.receiptCheckpointRef,
      gateRef: commitResult.transaction.externalConfirmationGateRef,
      reasonCodes: draft.reasonCodes,
      evidenceRefs: draft.evidenceRefs,
      evidenceAtoms: draft.evidenceAtoms,
      competingGateConfidences: draft.competingGateConfidences,
      startedAt: input.attemptedAt,
      completedAt: authoritativeReadResult?.observedAt ?? input.attemptedAt,
      nextAttemptAt: nextDraftAttemptAt,
    });
    const gate = await this.dependencies.gateEvaluator.evaluate({
      bookingCommit: commitResult,
      reconciliation:
        (await this.dependencies.reconciliationService.queryCurrentBookingReconciliation({
          bookingTransactionRef: commitResult.transaction.bookingTransactionId,
        })) ?? baseReconciliation,
      evaluatedAt: authoritativeReadResult?.observedAt ?? input.attemptedAt,
    });
    const synced = await synchronizeReconciliationFromCommit({
      dependencies: this.dependencies,
      bookingCommit: commitResult,
      observedAt: authoritativeReadResult?.observedAt ?? input.attemptedAt,
      forceManualAttention:
        draft.action === "noop" &&
        nextDraftAttemptAt === null &&
        !isFinalTransactionOutcome(commitResult.transaction.authoritativeOutcomeState),
    });
    const queueEntry = await synchronizeManualAttentionQueue({
      dependencies: this.dependencies,
      bookingCommit: commitResult,
      reconciliation: synced,
      observedAt: authoritativeReadResult?.observedAt ?? input.attemptedAt,
      reasonCodes: attempted.attempt.reasonCodes,
      evidenceRefs: attempted.attempt.evidenceRefs,
    });
    const finalReconciliation = await synchronizeReconciliationFromCommit({
      dependencies: this.dependencies,
      bookingCommit: commitResult,
      observedAt: authoritativeReadResult?.observedAt ?? input.attemptedAt,
      queueEntryRef: queueEntry?.bookingExceptionQueueEntryId ?? null,
    });
    const status = await materializeStatusBundle({
      dependencies: this.dependencies,
      bookingCommit: commitResult,
      reconciliation: finalReconciliation,
    });
    const emittedEvents: FoundationEventEnvelope<object>[] = [
      ...commitResult.emittedEvents,
      buildReconciliationStartedEvent({ commit: commitResult, attempt: attempted.attempt }),
      buildEvidenceObservedEvent({ commit: commitResult, attempt: attempted.attempt }),
    ];
    if (gate) {
      emittedEvents.push(buildGateUpdatedEvent({ commit: commitResult, gate }));
    }
    if (
      finalReconciliation.record.manualAttentionRequired ||
      commitResult.transaction.authoritativeOutcomeState === "reconciliation_required"
    ) {
      emittedEvents.push(buildDisputeOpenedEvent({ commit: commitResult, attempt: attempted.attempt }));
    }
    if (commitResult.transaction.authoritativeOutcomeState === "booked") {
      emittedEvents.push(
        buildFinalSettlementEvent({
          eventType: "booking.reconciliation.transaction_confirmed",
          commit: commitResult,
          attempt: attempted.attempt,
        }),
      );
    }
    if (
      commitResult.transaction.authoritativeOutcomeState === "failed" ||
      commitResult.transaction.authoritativeOutcomeState === "expired"
    ) {
      emittedEvents.push(
        buildFinalSettlementEvent({
          eventType: "booking.reconciliation.transaction_failed",
          commit: commitResult,
          attempt: attempted.attempt,
        }),
      );
    }
    return {
      ...status,
      emittedEvents,
    };
  }

  async processDue(input: ProcessDueBookingReconciliationsInput): Promise<ProcessDueBookingReconciliationsResult> {
    const due = await this.dependencies.reconciliationService.listDueBookingReconciliations(
      input.processedAt,
      input.limit ?? null,
    );
    const processed: BookingReconciliationMutationResult[] = [];
    const emittedEvents: FoundationEventEnvelope<object>[] = [];
    for (const entry of due) {
      const result = await this.forceAttempt({
        bookingTransactionId: entry.record.bookingTransactionRef,
        actorRef: input.actorRef,
        subjectRef: input.subjectRef,
        commandActionRecordRef: input.commandActionRecordRef,
        commandSettlementRecordRef: input.commandSettlementRecordRef,
        attemptedAt: input.processedAt,
        authoritativeReadResult:
          input.authoritativeReadResults?.[entry.record.bookingTransactionRef] ?? null,
        workerRunRef: bookingReconciliationServiceNameId(
          `${input.commandActionRecordRef}_${entry.record.bookingTransactionRef}`,
        ),
        payloadArtifactRef: input.payloadArtifactRef,
        edgeCorrelationId: input.edgeCorrelationId,
      });
      processed.push(result);
      emittedEvents.push(...result.emittedEvents);
    }
    return {
      processed,
      emittedEvents,
    };
  }
}

export interface Phase4BookingReconciliationApplication {
  readonly serviceName: typeof PHASE4_BOOKING_RECONCILIATION_SERVICE_NAME;
  readonly schemaVersion: typeof PHASE4_BOOKING_RECONCILIATION_SCHEMA_VERSION;
  readonly querySurfaces: typeof PHASE4_BOOKING_RECONCILIATION_QUERY_SURFACES;
  readonly routes: typeof phase4BookingReconciliationRoutes;
  readonly bookingCaseApplication: Phase4BookingCaseApplication;
  readonly bookingCommitApplication: Phase4BookingCommitApplication;
  readonly bookingReservationApplication: Phase4BookingReservationApplication;
  readonly assistedBookingService: Phase4AssistedBookingService;
  readonly reconciliationService: ReturnType<typeof createPhase4BookingReconciliationService>;
  readonly gateEvaluator: ExternalConfirmationGateEvaluator;
  readonly authoritativeReadSettlementService: AuthoritativeReadSettlementService;
  readonly receiptAssimilator: BookingReceiptAssimilator;
  readonly worker: BookingReconciliationWorker;
  readonly persistenceTables: typeof phase4BookingReconciliationPersistenceTables;
  readonly migrationPlanRef: (typeof phase4BookingReconciliationMigrationPlanRefs)[number];
  readonly migrationPlanRefs: typeof phase4BookingReconciliationMigrationPlanRefs;
  queryCurrentBookingReconciliation(
    input: { bookingCaseId?: string | null; bookingTransactionId?: string | null; requestedAt?: string | null },
  ): Promise<BookingReconciliationStatusBundle | null>;
  assimilateBookingReceipt(
    input: AssimilateBookingReceiptInput,
  ): Promise<BookingReconciliationMutationResult>;
  forceReconcileAttempt(
    input: ForceBookingReconcileAttemptInput,
  ): Promise<BookingReconciliationMutationResult>;
  resolveManualDispute(
    input: ResolveBookingManualDisputeInput,
  ): Promise<BookingReconciliationMutationResult>;
  processDueReconciliations(
    input: ProcessDueBookingReconciliationsInput,
  ): Promise<ProcessDueBookingReconciliationsResult>;
}

export function createPhase4BookingReconciliationApplication(input?: {
  bookingCaseApplication?: Phase4BookingCaseApplication;
  bookingReservationApplication?: Phase4BookingReservationApplication;
  bookingCommitApplication?: Phase4BookingCommitApplication;
  assistedBookingRepositories?: Phase4AssistedBookingRepositories;
  assistedBookingService?: Phase4AssistedBookingService;
  authoritativeReadAdapter?: BookingAuthoritativeReadAdapter | null;
  reconciliationService?: ReturnType<typeof createPhase4BookingReconciliationService>;
  idGenerator?: BackboneIdGenerator;
}): Phase4BookingReconciliationApplication {
  const idGenerator =
    input?.idGenerator ??
    createDeterministicBackboneIdGenerator("phase4-booking-reconciliation-app");
  const bookingCaseApplication =
    input?.bookingCaseApplication ?? createPhase4BookingCaseApplication();
  const bookingReservationApplication =
    input?.bookingReservationApplication ??
    createPhase4BookingReservationApplication({
      bookingCaseApplication,
      idGenerator,
    });
  const bookingCommitApplication =
    input?.bookingCommitApplication ??
    createPhase4BookingCommitApplication({
      bookingCaseApplication,
      bookingReservationApplication,
      idGenerator,
    });
  const assistedBookingRepositories =
    input?.assistedBookingRepositories ?? createPhase4AssistedBookingStore();
  const assistedBookingService =
    input?.assistedBookingService ??
    createPhase4AssistedBookingService({
      repositories: assistedBookingRepositories,
    });
  const reconciliationService =
    input?.reconciliationService ??
    createPhase4BookingReconciliationService({
      repositories: createPhase4BookingReconciliationStore(),
    });
  const dependencies: ReconciliationDependencies = {
    bookingCaseApplication,
    bookingCommitApplication,
    bookingReservationApplication,
    assistedBookingService,
    reconciliationService,
    gateEvaluator: new ExternalConfirmationGateEvaluator(bookingReservationApplication),
  };
  const authoritativeReadSettlementService = new AuthoritativeReadSettlementService();
  const receiptAssimilator = new BookingReceiptAssimilator(dependencies);
  const worker = new BookingReconciliationWorker(
    dependencies,
    authoritativeReadSettlementService,
    input?.authoritativeReadAdapter ?? null,
  );

  return {
    serviceName: PHASE4_BOOKING_RECONCILIATION_SERVICE_NAME,
    schemaVersion: PHASE4_BOOKING_RECONCILIATION_SCHEMA_VERSION,
    querySurfaces: PHASE4_BOOKING_RECONCILIATION_QUERY_SURFACES,
    routes: phase4BookingReconciliationRoutes,
    bookingCaseApplication,
    bookingCommitApplication,
    bookingReservationApplication,
    assistedBookingService,
    reconciliationService,
    gateEvaluator: dependencies.gateEvaluator,
    authoritativeReadSettlementService,
    receiptAssimilator,
    worker,
    persistenceTables: phase4BookingReconciliationPersistenceTables,
    migrationPlanRef: phase4BookingReconciliationMigrationPlanRefs.at(-1)!,
    migrationPlanRefs: phase4BookingReconciliationMigrationPlanRefs,

    async queryCurrentBookingReconciliation(inputQuery) {
      const requestedAt =
        optionalRef(inputQuery.requestedAt) ?? new Date().toISOString();
      const bookingTransactionId = optionalRef(inputQuery.bookingTransactionId);
      const bookingCaseId = optionalRef(inputQuery.bookingCaseId);
      const commit = bookingTransactionId
        ? await loadCommitByTransactionId(dependencies, bookingTransactionId, requestedAt)
        : bookingCaseId
          ? await bookingCommitApplication.queryCurrentBookingCommit({
              bookingCaseId,
              requestedAt,
            })
          : null;
      if (!commit) {
        return null;
      }
      const reconciliation = await synchronizeReconciliationFromCommit({
        dependencies,
        bookingCommit: commit,
        observedAt: requestedAt,
      });
      return materializeStatusBundle({
        dependencies,
        bookingCommit: commit,
        reconciliation,
      });
    },

    assimilateBookingReceipt(inputReceipt) {
      return receiptAssimilator.assimilate(inputReceipt);
    },

    forceReconcileAttempt(inputForce) {
      return worker.forceAttempt(inputForce);
    },

    async resolveManualDispute(inputResolve) {
      const commit = await loadCommitByTransactionId(
        dependencies,
        inputResolve.bookingTransactionId,
        inputResolve.resolvedAt,
      );
      invariant(
        commit,
        "BOOKING_TRANSACTION_NOT_FOUND",
        `BookingTransaction ${inputResolve.bookingTransactionId} was not found.`,
      );
      invariant(
        commit.transaction.authoritativeOutcomeState === "confirmation_pending" ||
          commit.transaction.authoritativeOutcomeState === "reconciliation_required",
        "BOOKING_TRANSACTION_NOT_MANUALLY_RECONCILABLE",
        "Only confirmation_pending or reconciliation_required transactions may be manually resolved.",
      );
      invariant(
        commit.transaction.supportsDisputeRecovery || inputResolve.resolution.kind !== "confirmed",
        "BOOKING_TRANSACTION_MANUAL_CONFIRM_NOT_ALLOWED",
        "Manual authoritative confirmation is not allowed by the current provider policy.",
      );
      const payloadArtifactRef =
        optionalRef(inputResolve.payloadArtifactRef) ??
        defaultPayloadArtifactRef({
          bookingTransactionId: inputResolve.bookingTransactionId,
          commandActionRecordRef: inputResolve.commandActionRecordRef,
        });
      const edgeCorrelationId =
        optionalRef(inputResolve.edgeCorrelationId) ??
        defaultEdgeCorrelationId({
          bookingTransactionId: inputResolve.bookingTransactionId,
          commandActionRecordRef: inputResolve.commandActionRecordRef,
        });
      const baseReconciliation = await synchronizeReconciliationFromCommit({
        dependencies,
        bookingCommit: commit,
        observedAt: inputResolve.resolvedAt,
      });
      const commitResult = await bookingCommitApplication.reconcileAmbiguousTransaction({
        bookingTransactionId: inputResolve.bookingTransactionId,
        actorRef: inputResolve.actorRef,
        subjectRef: inputResolve.subjectRef,
        commandActionRecordRef: inputResolve.commandActionRecordRef,
        commandSettlementRecordRef: inputResolve.commandSettlementRecordRef,
        reconciledAt: inputResolve.resolvedAt,
        payloadArtifactRef,
        edgeCorrelationId,
        resolution: inputResolve.resolution,
      });
      const attempted = await reconciliationService.recordBookingReconciliationAttempt({
        bookingReconciliationRecordRef: baseReconciliation.record.bookingReconciliationRecordId,
        bookingCaseRef: commitResult.bookingCase.bookingCase.bookingCaseId,
        bookingTransactionRef: commitResult.transaction.bookingTransactionId,
        attemptKey: buildAttemptKey({
          bookingTransactionId: commitResult.transaction.bookingTransactionId,
          trigger: "manual_resolution",
          semanticPayload: {
            auditReasonCode: inputResolve.auditReasonCode,
            resolution: inputResolve.resolution,
          },
        }),
        trigger: "manual_resolution",
        workerRunRef: bookingReconciliationServiceNameId(inputResolve.commandActionRecordRef),
        action: "manual_reconcile",
        outcome:
          commitResult.transaction.authoritativeOutcomeState === "booked"
            ? "confirmed"
            : commitResult.transaction.authoritativeOutcomeState === "failed"
              ? "failed"
              : commitResult.transaction.authoritativeOutcomeState === "expired"
                ? "expired"
                : "superseded",
        observationKind: null,
        authoritativeProofClass:
          inputResolve.resolution.kind === "confirmed"
            ? inputResolve.resolution.authoritativeProofClass
            : null,
        providerReference:
          inputResolve.resolution.kind === "confirmed"
            ? optionalRef(inputResolve.resolution.providerReference)
            : null,
        receiptCheckpointRef: commitResult.transaction.latestReceiptCheckpointRef,
        gateRef: commitResult.transaction.externalConfirmationGateRef,
        reasonCodes: [inputResolve.auditReasonCode],
        evidenceRefs: [
          `manual_resolution::${inputResolve.auditReasonCode}::${inputResolve.bookingTransactionId}`,
        ],
        evidenceAtoms:
          inputResolve.resolution.kind === "confirmed"
            ? [
                {
                  evidenceRef: `manual_resolution::${inputResolve.auditReasonCode}::${inputResolve.bookingTransactionId}`,
                  sourceFamily: "manual_review",
                  proofRef: optionalRef(inputResolve.resolution.providerReference),
                  logLikelihoodWeight: 1.1,
                  polarity: "positive",
                  satisfiesHardMatchRefs: [
                    "selected_slot",
                    "patient_identity",
                    "appointment_window",
                  ],
                },
              ]
            : [],
        manualOverrideRequested: true,
        startedAt: inputResolve.resolvedAt,
        completedAt: inputResolve.resolvedAt,
        nextAttemptAt: null,
      });
      const gate = await dependencies.gateEvaluator.evaluate({
        bookingCommit: commitResult,
        reconciliation:
          (await reconciliationService.queryCurrentBookingReconciliation({
            bookingTransactionRef: commitResult.transaction.bookingTransactionId,
          })) ?? baseReconciliation,
        evaluatedAt: inputResolve.resolvedAt,
      });
      const synced = await synchronizeReconciliationFromCommit({
        dependencies,
        bookingCommit: commitResult,
        observedAt: inputResolve.resolvedAt,
      });
      const queueEntry = await synchronizeManualAttentionQueue({
        dependencies,
        bookingCommit: commitResult,
        reconciliation: synced,
        observedAt: inputResolve.resolvedAt,
        reasonCodes: [inputResolve.auditReasonCode],
        evidenceRefs: attempted.attempt.evidenceRefs,
      });
      const finalReconciliation = await synchronizeReconciliationFromCommit({
        dependencies,
        bookingCommit: commitResult,
        observedAt: inputResolve.resolvedAt,
        queueEntryRef: queueEntry?.bookingExceptionQueueEntryId ?? null,
      });
      const status = await materializeStatusBundle({
        dependencies,
        bookingCommit: commitResult,
        reconciliation: finalReconciliation,
      });
      const emittedEvents: FoundationEventEnvelope<object>[] = [
        ...commitResult.emittedEvents,
        buildReconciliationStartedEvent({ commit: commitResult, attempt: attempted.attempt }),
        buildEvidenceObservedEvent({ commit: commitResult, attempt: attempted.attempt }),
      ];
      if (gate) {
        emittedEvents.push(buildGateUpdatedEvent({ commit: commitResult, gate }));
      }
      if (commitResult.transaction.authoritativeOutcomeState === "booked") {
        emittedEvents.push(
          buildFinalSettlementEvent({
            eventType: "booking.reconciliation.transaction_confirmed",
            commit: commitResult,
            attempt: attempted.attempt,
          }),
        );
      } else {
        emittedEvents.push(
          buildFinalSettlementEvent({
            eventType: "booking.reconciliation.transaction_failed",
            commit: commitResult,
            attempt: attempted.attempt,
          }),
        );
      }
      return {
        ...status,
        emittedEvents,
      };
    },

    processDueReconciliations(inputProcess) {
      return worker.processDue(inputProcess);
    },
  };
}
