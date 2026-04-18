import { createHash } from "node:crypto";
import {
  createDeterministicBackboneIdGenerator,
  type BackboneIdGenerator,
} from "@vecells/domain-kernel";
import type { FoundationEventEnvelope } from "@vecells/event-contracts";
import type {
  AuthoritativeReadAndConfirmationPolicySnapshot,
  BookingAuthoritativeProofClass,
  BookingCapabilityDiagnosticsBundle,
  BookingCaseBundle,
  BeginCommitDispatchOutcomeInput,
  BookingCommitObservationKind,
  BookingCommitPolicySnapshot,
  BookingCommitProcessingResult,
  BookingCommitReadResult,
  BookingConfirmationTruthProjectionSnapshot,
  BookingTransactionSnapshot,
  OfferSessionSnapshot,
  Phase4BookingCommitRepositories,
  Phase4BookingCommitService,
} from "@vecells/domain-booking";
import {
  createPhase4BookingCommitService,
  createPhase4BookingCommitStore,
} from "@vecells/domain-booking";
import {
  createReplayCollisionAuthorityService,
  createReplayCollisionStore,
  createReservationConfirmationAuthorityService,
  defaultReservationConfirmationThresholdPolicy,
  type ConfirmationAssuranceLevel,
  type ConfirmationEvidenceAtom,
  type ReplayCollisionAuthorityService,
  type ReplayCollisionDependencies,
  type ReservationConfirmationDependencies,
} from "@vecells/domain-identity-access";
import {
  createPhase4BookingCapabilityApplication,
  type Phase4BookingCapabilityApplication,
} from "./phase4-booking-capability";
import {
  createPhase4BookingCaseApplication,
  type Phase4BookingCaseApplication,
} from "./phase4-booking-case";
import {
  createPhase4BookingReservationApplication,
  type BookingReservationTruthResult,
  type Phase4BookingReservationApplication,
} from "./phase4-booking-reservations";
import {
  createPhase4CapacityRankApplication,
  type Phase4CapacityRankApplication,
} from "./phase4-capacity-rank-offers";
import {
  createPhase4SlotSearchApplication,
  type Phase4SlotSearchApplication,
} from "./phase4-slot-search";

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

function addSeconds(timestamp: string, seconds: number): string {
  return new Date(Date.parse(timestamp) + seconds * 1000).toISOString();
}

function nextRecordId(prefix: string, value: unknown): string {
  return `${prefix}_${sha256(value).slice(0, 24)}`;
}

function compareIso(left: string, right: string): number {
  return left.localeCompare(right);
}

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

const PHASE4_BOOKING_COMMIT_ACTION_SCOPE = "booking_commit";
const PHASE4_BOOKING_RECEIPT_ACTION_SCOPE = "booking_commit_receipt";

export const PHASE4_BOOKING_COMMIT_SERVICE_NAME =
  "Phase4BookingCommitConfirmationApplication";
export const PHASE4_BOOKING_COMMIT_SCHEMA_VERSION =
  "287.phase4.booking-commit-confirmation.v1";
export const PHASE4_BOOKING_COMMIT_QUERY_SURFACES = [
  "GET /v1/bookings/cases/{bookingCaseId}/commit/current",
] as const;

export const phase4BookingCommitRoutes = [
  {
    routeId: "booking_case_commit_current",
    method: "GET",
    path: "/v1/bookings/cases/{bookingCaseId}/commit/current",
    contractFamily: "BookingTransactionBundleContract",
    purpose:
      "Resolve the current BookingTransaction, BookingConfirmationTruthProjection, AppointmentRecord, exception, reservation truth, and transition journal for one booking case.",
    bodyRequired: false,
    idempotencyRequired: false,
  },
  {
    routeId: "booking_case_begin_commit",
    method: "POST",
    path: "/internal/v1/bookings/cases/{bookingCaseId}:begin-commit",
    contractFamily: "BeginBookingCommitCommandContract",
    purpose:
      "Run preflight revalidation, reservation fencing, idempotent dispatch, authoritative success classification, and confirmation-truth settlement from the current selected offer.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "booking_transaction_record_authoritative_observation",
    method: "POST",
    path: "/internal/v1/bookings/transactions/{bookingTransactionId}:record-authoritative-observation",
    contractFamily: "RecordBookingAuthoritativeObservationCommandContract",
    purpose:
      "Collapse supplier callbacks and read-after-write observations through the canonical receipt-checkpoint chain before booking truth is refreshed.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "booking_transaction_reconcile_ambiguous",
    method: "POST",
    path: "/internal/v1/bookings/transactions/{bookingTransactionId}:reconcile-ambiguous",
    contractFamily: "ReconcileBookingCommitCommandContract",
    purpose:
      "Resolve a pending or disputed BookingTransaction into confirmed, failed, or expired truth without rewriting the original transaction chain.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "booking_transaction_release_or_supersede_failed",
    method: "POST",
    path: "/internal/v1/bookings/transactions/{bookingTransactionId}:release-or-supersede-failed",
    contractFamily: "ReleaseBookingFailedTransactionCommandContract",
    purpose:
      "Release or supersede a failed, expired, or reconciliation-required BookingTransaction while keeping compensation and recovery append-only.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
] as const;

export const phase4BookingCommitPersistenceTables = [
  "idempotency_records",
  "replay_collision_reviews",
  "adapter_dispatch_attempts",
  "adapter_receipt_checkpoints",
  "external_confirmation_gates",
  "capacity_reservations",
  "reservation_truth_projections",
  "phase4_booking_transactions",
  "phase4_booking_confirmation_truth_projections",
  "phase4_appointment_records",
  "phase4_booking_exceptions",
  "phase4_booking_transaction_journal",
] as const;

export const phase4BookingCommitMigrationPlanRefs = [
  "services/command-api/migrations/067_idempotency_and_replay_collision.sql",
  "services/command-api/migrations/074_capacity_reservation_and_external_confirmation_gate_models.sql",
  "services/command-api/migrations/135_phase4_booking_reservation_authority.sql",
  "services/command-api/migrations/136_phase4_booking_commit_pipeline.sql",
] as const;

export interface BeginBookingCommitFromSelectedOfferInput {
  bookingCaseId: string;
  offerSessionId?: string | null;
  actorRef: string;
  subjectRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  occurredAt: string;
  idempotencyKey: string;
  dispatchOutcome: BeginCommitDispatchOutcomeInput;
  expectedSelectionProofHash?: string | null;
  expectedRequestLifecycleLeaseRef?: string | null;
  expectedOwnershipEpochRef?: number | null;
  expectedSourceDecisionEpochRef?: string | null;
  expectedRuntimePublicationBundleRef?: string | null;
  expectedSurfacePublicationRef?: string | null;
  sourceCommandId?: string | null;
  transportCorrelationId?: string | null;
  reviewActionLeaseRef?: string | null;
  payloadArtifactRef?: string | null;
  edgeCorrelationId?: string | null;
  releaseRecoveryDispositionRef?: string | null;
  transitionEnvelopeRef?: string | null;
  safetyPreemptionReasonCode?: string | null;
}

export interface RecordBookingAuthoritativeObservationInput {
  bookingTransactionId: string;
  observationKind: BookingCommitObservationKind;
  actorRef: string;
  subjectRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  observedAt: string;
  transportMessageId: string;
  orderingKey: string;
  rawReceipt: unknown;
  semanticReceipt?: unknown;
  providerCorrelationRef?: string | null;
  providerReference?: string | null;
  authoritativeProofClass?: Exclude<BookingAuthoritativeProofClass, "none"> | null;
  externalConfirmationGateRef?: string | null;
  blockerReasonCode?: string | null;
  recoveryMode?: string | null;
  failureReasonCode?: string | null;
  linkedSettlementRef?: string | null;
  payloadArtifactRef?: string | null;
  edgeCorrelationId?: string | null;
}

export interface ReconcileBookingCommitInput {
  bookingTransactionId: string;
  actorRef: string;
  subjectRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  reconciledAt: string;
  payloadArtifactRef?: string | null;
  edgeCorrelationId?: string | null;
  resolution:
    | {
        kind: "confirmed";
        authoritativeProofClass: Exclude<BookingAuthoritativeProofClass, "none">;
        providerReference?: string | null;
      }
    | {
        kind: "failed";
        failureReasonCode: string;
      }
    | {
        kind: "expired";
        failureReasonCode: string;
      };
}

export interface ReleaseBookingFailedTransactionInput {
  bookingTransactionId: string;
  actorRef: string;
  subjectRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  releasedAt: string;
  reasonCodes: readonly string[];
  payloadArtifactRef?: string | null;
  edgeCorrelationId?: string | null;
}

export interface QueryCurrentBookingCommitInput {
  bookingCaseId: string;
  requestedAt?: string | null;
}

export interface BookingCommitApplicationResult extends BookingCommitReadResult {
  bookingCase: BookingCaseBundle;
  reservationTruth: BookingReservationTruthResult | null;
  dispatchAttemptRef: string | null;
  receiptCheckpointRef: string | null;
  replayDecisionClass: string | null;
  collisionReviewRef: string | null;
  replayed: boolean;
  emittedEvents: readonly FoundationEventEnvelope<object>[];
}

export interface Phase4BookingCommitApplication {
  bookingCommitService: Phase4BookingCommitService;
  bookingCommitRepositories: Phase4BookingCommitRepositories;
  replayRepositories: ReplayCollisionDependencies;
  beginCommitFromSelectedOffer(
    input: BeginBookingCommitFromSelectedOfferInput,
  ): Promise<BookingCommitApplicationResult>;
  recordAuthoritativeObservation(
    input: RecordBookingAuthoritativeObservationInput,
  ): Promise<BookingCommitApplicationResult>;
  reconcileAmbiguousTransaction(
    input: ReconcileBookingCommitInput,
  ): Promise<BookingCommitApplicationResult>;
  releaseOrSupersedeFailedTransaction(
    input: ReleaseBookingFailedTransactionInput,
  ): Promise<BookingCommitApplicationResult>;
  queryCurrentBookingCommit(
    input: QueryCurrentBookingCommitInput,
  ): Promise<BookingCommitApplicationResult | null>;
}

function allowedProofClassesFromPolicy(
  policy: AuthoritativeReadAndConfirmationPolicySnapshot,
): Exclude<BookingAuthoritativeProofClass, "none">[] {
  const allowed = new Set<Exclude<BookingAuthoritativeProofClass, "none">>();
  for (const value of policy.durableProofClasses) {
    if (
      value === "durable_provider_reference" ||
      value === "same_commit_read_after_write" ||
      value === "reconciled_confirmation"
    ) {
      allowed.add(value);
    }
  }
  if (policy.supportsDisputeRecovery) {
    allowed.add("reconciled_confirmation");
  }
  return [...allowed];
}

function toCommitPolicy(
  policy: AuthoritativeReadAndConfirmationPolicySnapshot,
): BookingCommitPolicySnapshot {
  return {
    authoritativeReadAndConfirmationPolicyRef:
      policy.authoritativeReadAndConfirmationPolicyId,
    authoritativeReadMode: policy.authoritativeReadMode,
    allowedAuthoritativeProofClasses: allowedProofClassesFromPolicy(policy),
    supportsAsyncCommitConfirmation: policy.supportsAsyncCommitConfirmation,
    supportsDisputeRecovery: policy.supportsDisputeRecovery,
    manageExposureBeforeProof: policy.manageExposureBeforeProof,
    patientVisibilityBeforeProof: policy.patientVisibilityBeforeProof,
  };
}

function proofAllowed(
  policy: BookingCommitPolicySnapshot,
  proofClass: Exclude<BookingAuthoritativeProofClass, "none">,
  providerReference: string | null,
): boolean {
  if (!policy.allowedAuthoritativeProofClasses.includes(proofClass)) {
    return false;
  }
  if (proofClass === "durable_provider_reference") {
    return providerReference !== null;
  }
  return true;
}

type ReservationOutcomeClass =
  | "confirmed"
  | "confirmation_pending"
  | "reconciliation_required"
  | "failed"
  | "expired";

function classifyBeginReservationOutcome(input: {
  dispatchOutcome: BeginCommitDispatchOutcomeInput;
  policy: BookingCommitPolicySnapshot;
  safetyPreemptionReasonCode: string | null;
}): {
  outcome: ReservationOutcomeClass;
  reasonCode: string | null;
  recoveryMode: string | null;
} {
  if (input.safetyPreemptionReasonCode) {
    return {
      outcome: "failed",
      reasonCode: input.safetyPreemptionReasonCode,
      recoveryMode: "late_safety_preemption",
    };
  }
  switch (input.dispatchOutcome.kind) {
    case "authoritative_success":
      return proofAllowed(
        input.policy,
        input.dispatchOutcome.authoritativeProofClass,
        optionalRef(input.dispatchOutcome.providerReference),
      )
        ? { outcome: "confirmed", reasonCode: null, recoveryMode: null }
        : {
            outcome: "reconciliation_required",
            reasonCode: "authoritative_proof_not_allowed_by_policy",
            recoveryMode: "policy_reconciliation_required",
          };
    case "confirmation_pending":
      return input.policy.supportsAsyncCommitConfirmation
        ? {
            outcome: "confirmation_pending",
            reasonCode: input.dispatchOutcome.blockerReasonCode,
            recoveryMode: input.dispatchOutcome.recoveryMode,
          }
        : {
            outcome: "reconciliation_required",
            reasonCode: "async_confirmation_not_allowed_by_policy",
            recoveryMode: "policy_reconciliation_required",
          };
    case "reconciliation_required":
      return {
        outcome: "reconciliation_required",
        reasonCode: input.dispatchOutcome.blockerReasonCode,
        recoveryMode: input.dispatchOutcome.recoveryMode,
      };
    case "authoritative_failure":
      return {
        outcome: "failed",
        reasonCode: input.dispatchOutcome.failureReasonCode,
        recoveryMode: "authoritative_failure",
      };
    case "dispatch_failed":
      return {
        outcome: "failed",
        reasonCode: input.dispatchOutcome.failureReasonCode,
        recoveryMode: "dispatch_failed",
      };
  }
}

function classifyObservationReservationOutcome(input: {
  transaction: BookingTransactionSnapshot;
  observationKind: BookingCommitObservationKind;
  authoritativeProofClass: Exclude<BookingAuthoritativeProofClass, "none"> | null;
  providerReference: string | null;
  policy: BookingCommitPolicySnapshot;
  blockerReasonCode: string | null;
  failureReasonCode: string | null;
}): {
  outcome: ReservationOutcomeClass;
  reasonCode: string | null;
  recoveryMode: string | null;
} {
  if (
    (input.observationKind === "durable_provider_reference" ||
      input.observationKind === "same_commit_read_after_write" ||
      input.observationKind === "reconciled_confirmation") &&
    input.authoritativeProofClass &&
    proofAllowed(input.policy, input.authoritativeProofClass, input.providerReference)
  ) {
    if (
      input.transaction.authoritativeOutcomeState === "failed" ||
      input.transaction.authoritativeOutcomeState === "expired"
    ) {
      return {
        outcome: "reconciliation_required",
        reasonCode: "post_failure_confirmation_conflict",
        recoveryMode: "manual_reconciliation_required",
      };
    }
    return {
      outcome: "confirmed",
      reasonCode: null,
      recoveryMode: null,
    };
  }
  if (input.observationKind === "confirmation_pending") {
    return input.policy.supportsAsyncCommitConfirmation
      ? {
          outcome: "confirmation_pending",
          reasonCode: input.blockerReasonCode ?? "awaiting_external_confirmation",
          recoveryMode: "awaiting_external_confirmation",
        }
      : {
          outcome: "reconciliation_required",
          reasonCode: "async_confirmation_not_allowed_by_policy",
          recoveryMode: "policy_reconciliation_required",
        };
  }
  if (input.observationKind === "reconciliation_required") {
    return {
      outcome: "reconciliation_required",
      reasonCode: input.blockerReasonCode ?? "reconciliation_required",
      recoveryMode: "reconcile_supplier_observation",
    };
  }
  if (input.observationKind === "expired") {
    return {
      outcome: "expired",
      reasonCode: input.failureReasonCode ?? "confirmation_expired",
      recoveryMode: "confirmation_expired",
    };
  }
  if (input.observationKind === "authoritative_failure") {
    return input.transaction.authoritativeOutcomeState === "booked"
      ? {
          outcome: "reconciliation_required",
          reasonCode: input.failureReasonCode ?? "confirmed_booking_conflict",
          recoveryMode: "confirmed_booking_conflict",
        }
      : {
          outcome: "failed",
          reasonCode: input.failureReasonCode ?? "authoritative_failure",
          recoveryMode: "authoritative_failure",
        };
  }
  return {
    outcome: "reconciliation_required",
    reasonCode: "receipt_collision_review",
    recoveryMode: "reconcile_divergent_receipt",
  };
}

function buildPreflightVersion(input: {
  slotSetSnapshotId: string;
  policyBundleHash: string;
  capabilityTupleHash: string;
  providerAdapterBindingHash: string;
  selectedNormalizedSlotRef: string;
  selectedCandidateHash: string;
  selectionProofHash: string;
  reservationVersionRef: string | null;
}): string {
  return sha256(input);
}

function buildDispatchEffectKey(input: {
  bookingCaseId: string;
  canonicalReservationKey: string;
  selectionProofHash: string;
}): string {
  return sha256({
    bookingCaseId: input.bookingCaseId,
    canonicalReservationKey: input.canonicalReservationKey,
    selectionProofHash: input.selectionProofHash,
  });
}

function buildGateEvidenceAtoms(input: {
  occurredAt: string;
  providerReference: string | null;
  reasonCode: string | null;
  outcome: "confirmation_pending" | "reconciliation_required";
}): readonly ConfirmationEvidenceAtom[] {
  const atoms: ConfirmationEvidenceAtom[] = [
    {
      evidenceRef: `booking_commit_dispatch::${input.outcome}::${input.occurredAt}`,
      sourceFamily: "supplier_dispatch",
      proofRef: input.providerReference,
      logLikelihoodWeight: input.outcome === "confirmation_pending" ? 0.35 : 0.15,
      polarity: "positive",
      satisfiesHardMatchRefs: ["selected_slot", "reservation_key"],
    },
  ];
  if (input.reasonCode) {
    atoms.push({
      evidenceRef: `booking_commit_reason::${input.reasonCode}`,
      sourceFamily: "supplier_callback",
      proofRef: null,
      logLikelihoodWeight: input.outcome === "reconciliation_required" ? -0.45 : -0.1,
      polarity: "negative",
      contradictory: input.outcome === "reconciliation_required",
      failsHardMatchRefs:
        input.outcome === "reconciliation_required" ? ["single_authoritative_chain"] : [],
    });
  }
  return atoms;
}

function gateAssuranceLevel(
  outcome: "confirmation_pending" | "reconciliation_required",
): ConfirmationAssuranceLevel {
  return outcome === "confirmation_pending" ? "moderate" : "manual";
}

function defaultPayloadArtifactRef(input: {
  bookingCaseId?: string | null;
  bookingTransactionId?: string | null;
  commandActionRecordRef: string;
}): string {
  return `artifact://booking/commit/${input.bookingCaseId ?? input.bookingTransactionId ?? "unknown"}/${input.commandActionRecordRef}`;
}

function defaultEdgeCorrelationId(input: {
  bookingCaseId?: string | null;
  bookingTransactionId?: string | null;
  commandActionRecordRef: string;
}): string {
  return `edge::booking_commit::${input.bookingCaseId ?? input.bookingTransactionId ?? "unknown"}::${input.commandActionRecordRef}`;
}

function buildTransitionInput(
  bundle: BookingCaseBundle,
  command: {
    actorRef: string;
    commandActionRecordRef: string;
    commandSettlementRecordRef: string;
    recordedAt: string;
    routeIntentBindingRef: string;
  },
  reasonCode: string,
  extras?: {
    currentOfferSessionRef?: string | null;
    selectedSlotRef?: string | null;
    appointmentRef?: string | null;
    latestConfirmationTruthProjectionRef?: string | null;
    exceptionRef?: string | null;
  },
) {
  return {
    bookingCaseId: bundle.bookingCase.bookingCaseId,
    actorRef: command.actorRef,
    routeIntentBindingRef: command.routeIntentBindingRef,
    commandActionRecordRef: command.commandActionRecordRef,
    commandSettlementRecordRef: command.commandSettlementRecordRef,
    recordedAt: command.recordedAt,
    sourceDecisionEpochRef: bundle.bookingCase.sourceDecisionEpochRef,
    sourceDecisionSupersessionRef: bundle.bookingCase.sourceDecisionSupersessionRef,
    lineageCaseLinkRef: bundle.bookingCase.lineageCaseLinkRef,
    requestLifecycleLeaseRef: bundle.bookingCase.requestLifecycleLeaseRef,
    ownershipEpoch: bundle.bookingCase.ownershipEpoch,
    fencingToken: bundle.bookingIntent.fencingToken,
    currentLineageFenceEpoch: bundle.bookingIntent.currentLineageFenceEpoch,
    reasonCode,
    activeCapabilityResolutionRef: bundle.bookingCase.activeCapabilityResolutionRef,
    activeCapabilityProjectionRef: bundle.bookingCase.activeCapabilityProjectionRef,
    activeProviderAdapterBindingRef: bundle.bookingCase.activeProviderAdapterBindingRef,
    capabilityState: null,
    currentOfferSessionRef:
      extras?.currentOfferSessionRef ?? bundle.bookingCase.currentOfferSessionRef,
    selectedSlotRef: extras?.selectedSlotRef ?? bundle.bookingCase.selectedSlotRef,
    appointmentRef: extras?.appointmentRef ?? bundle.bookingCase.appointmentRef,
    latestConfirmationTruthProjectionRef:
      extras?.latestConfirmationTruthProjectionRef ??
      bundle.bookingCase.latestConfirmationTruthProjectionRef,
    exceptionRef: extras?.exceptionRef ?? bundle.bookingCase.exceptionRef,
    surfaceRouteContractRef: bundle.bookingCase.surfaceRouteContractRef,
    surfacePublicationRef: bundle.bookingCase.surfacePublicationRef,
    runtimePublicationBundleRef: bundle.bookingCase.runtimePublicationBundleRef,
  };
}

interface CommitContext {
  bookingCase: BookingCaseBundle;
  diagnostics: BookingCapabilityDiagnosticsBundle;
  policy: AuthoritativeReadAndConfirmationPolicySnapshot;
  commitPolicy: BookingCommitPolicySnapshot;
  offerSession: OfferSessionSnapshot;
  currentReservationTruth: BookingReservationTruthResult | null;
  selectedSlotRef: string;
  selectedCandidateHash: string;
  occurredAt: string;
  preflightVersion: string;
  preflightFailureReasonCodes: readonly string[];
  guardedRecheckFailureReasonCodes: readonly string[];
  dispatchEffectKeyRef: string;
  routeIntentBindingRef: string;
}

async function advanceCaseForCommitOutcome(input: {
  bookingCaseApplication: Phase4BookingCaseApplication;
  bookingCase: BookingCaseBundle;
  transaction: BookingTransactionSnapshot;
  confirmationTruth: BookingConfirmationTruthProjectionSnapshot;
  appointmentRef: string | null;
  exceptionRef: string | null;
  actorRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  occurredAt: string;
  routeIntentBindingRef: string;
}): Promise<{ bookingCase: BookingCaseBundle; emittedEvents: readonly FoundationEventEnvelope<object>[] }> {
  let current = input.bookingCase;
  const emittedEvents: FoundationEventEnvelope<object>[] = [];

  async function applyTransition(
    action:
      | "startRevalidation"
      | "enterCommitPending"
      | "markConfirmationPending"
      | "markSupplierReconciliationPending"
      | "markBookingFailed"
      | "markBooked"
      | "markManaged",
    reasonCode: string,
  ) {
    const transitionActionRecordRef = `${input.commandActionRecordRef}::${action}`;
    const transitionSettlementRecordRef = `${input.commandSettlementRecordRef}::${action}`;
    const transitionInput = buildTransitionInput(
      current,
      {
        actorRef: input.actorRef,
        commandActionRecordRef: transitionActionRecordRef,
        commandSettlementRecordRef: transitionSettlementRecordRef,
        recordedAt: input.occurredAt,
        routeIntentBindingRef: input.routeIntentBindingRef,
      },
      reasonCode,
      {
        currentOfferSessionRef: current.bookingCase.currentOfferSessionRef,
        selectedSlotRef: input.transaction.selectedSlotRef,
        appointmentRef: input.appointmentRef,
        latestConfirmationTruthProjectionRef:
          input.confirmationTruth.bookingConfirmationTruthProjectionId,
        exceptionRef: input.exceptionRef,
      },
    );
    const result =
      action === "startRevalidation"
        ? await input.bookingCaseApplication.startRevalidation(transitionInput)
        : action === "enterCommitPending"
          ? await input.bookingCaseApplication.enterCommitPending(transitionInput)
          : action === "markConfirmationPending"
            ? await input.bookingCaseApplication.markConfirmationPending(transitionInput)
            : action === "markSupplierReconciliationPending"
              ? await input.bookingCaseApplication.markSupplierReconciliationPending(transitionInput)
              : action === "markBookingFailed"
                ? await input.bookingCaseApplication.markBookingFailed(transitionInput)
                : action === "markBooked"
                  ? await input.bookingCaseApplication.markBooked(transitionInput)
                  : await input.bookingCaseApplication.markManaged(transitionInput);
    emittedEvents.push(...result.emittedEvents);
    current = {
      bookingIntent: result.bookingIntent,
      bookingCase: result.bookingCase,
      searchPolicy: result.searchPolicy,
      transitionJournal: result.transitionJournal,
    };
  }

  const status = current.bookingCase.status;
  if (
    input.transaction.authoritativeOutcomeState === "booked" ||
    input.transaction.authoritativeOutcomeState === "confirmation_pending" ||
    input.transaction.authoritativeOutcomeState === "reconciliation_required"
  ) {
    if (status === "selecting") {
      await applyTransition("startRevalidation", "booking_preflight_started");
    }
    if (current.bookingCase.status === "revalidating") {
      await applyTransition("enterCommitPending", "booking_preflight_passed");
    }
  }

  if (input.transaction.authoritativeOutcomeState === "booked") {
    if (current.bookingCase.status === "commit_pending") {
      await applyTransition("markBooked", "booking_authoritative_success");
    } else if (
      current.bookingCase.status === "confirmation_pending" ||
      current.bookingCase.status === "supplier_reconciliation_pending" ||
      current.bookingCase.status === "booked"
    ) {
      await applyTransition("markManaged", "booking_authoritative_success");
    }
  } else if (input.transaction.authoritativeOutcomeState === "confirmation_pending") {
    if (current.bookingCase.status === "commit_pending") {
      await applyTransition("markConfirmationPending", "booking_confirmation_pending");
    }
  } else if (input.transaction.authoritativeOutcomeState === "reconciliation_required") {
    if (
      current.bookingCase.status === "commit_pending" ||
      current.bookingCase.status === "confirmation_pending"
    ) {
      await applyTransition(
        "markSupplierReconciliationPending",
        "booking_supplier_reconciliation_pending",
      );
    }
  } else if (
    input.transaction.authoritativeOutcomeState === "failed" ||
    input.transaction.authoritativeOutcomeState === "expired"
  ) {
    if (current.bookingCase.status !== "booking_failed") {
      await applyTransition("markBookingFailed", "booking_commit_failed");
    }
  }

  return {
    bookingCase: current,
    emittedEvents,
  };
}

export function createPhase4BookingCommitApplication(input?: {
  bookingCaseApplication?: Phase4BookingCaseApplication;
  bookingCapabilityApplication?: Phase4BookingCapabilityApplication;
  slotSearchApplication?: Phase4SlotSearchApplication;
  capacityRankApplication?: Phase4CapacityRankApplication;
  bookingReservationApplication?: Phase4BookingReservationApplication;
  commitRepositories?: ReturnType<typeof createPhase4BookingCommitStore>;
  replayRepositories?: ReplayCollisionDependencies;
  idGenerator?: BackboneIdGenerator;
}): Phase4BookingCommitApplication {
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
  const bookingReservationApplication =
    input?.bookingReservationApplication ??
    createPhase4BookingReservationApplication({
      bookingCaseApplication,
      bookingCapabilityApplication,
      slotSearchApplication,
      capacityRankApplication,
    });
  const bookingCommitRepositories =
    input?.commitRepositories ?? createPhase4BookingCommitStore();
  const bookingCommitService = createPhase4BookingCommitService({
    repositories: bookingCommitRepositories,
  });
  const replayRepositories = input?.replayRepositories ?? createReplayCollisionStore();
  const replayAuthority = createReplayCollisionAuthorityService(
    replayRepositories,
    input?.idGenerator ??
      createDeterministicBackboneIdGenerator("phase4-booking-commit-replay"),
  );
  const reservationConfirmationAuthority = createReservationConfirmationAuthorityService(
    bookingReservationApplication.reservationRepositories as ReservationConfirmationDependencies,
    input?.idGenerator ??
      createDeterministicBackboneIdGenerator("phase4-booking-commit-gates"),
  );

  async function loadCurrentPolicy(
    diagnostics: BookingCapabilityDiagnosticsBundle,
  ): Promise<AuthoritativeReadAndConfirmationPolicySnapshot> {
    const document =
      await bookingCapabilityApplication.bookingCapabilityRepositories.getAuthoritativeReadAndConfirmationPolicy(
        diagnostics.resolution.authoritativeReadAndConfirmationPolicyRef,
      );
    invariant(
      document !== null,
      "AUTHORITATIVE_CONFIRMATION_POLICY_NOT_FOUND",
      "Current AuthoritativeReadAndConfirmationPolicy was not found.",
    );
    return document.toSnapshot();
  }

  async function requireOfferSession(
    bookingCaseId: string,
    offerSessionId: string | null | undefined,
  ): Promise<OfferSessionSnapshot> {
    const current =
      offerSessionId === null || offerSessionId === undefined
        ? await capacityRankApplication.queryCurrentOfferSession({ bookingCaseId })
        : null;
    if (current) {
      return current.offerSession;
    }
    const explicitRef = requireRef(offerSessionId, "offerSessionId");
    const document =
      await capacityRankApplication.capacityRankRepositories.getOfferSession(explicitRef);
    invariant(document !== null, "OFFER_SESSION_NOT_FOUND", `OfferSession ${explicitRef} was not found.`);
    return document.toSnapshot();
  }

  async function resolveCommitContext(
    command: BeginBookingCommitFromSelectedOfferInput,
    options?: { reservationVersionRefOverride?: string | null },
  ): Promise<CommitContext> {
    const bookingCaseId = requireRef(command.bookingCaseId, "bookingCaseId");
    const occurredAt = ensureIsoTimestamp(command.occurredAt, "occurredAt");
    const bookingCase = await bookingCaseApplication.queryBookingCase(bookingCaseId);
    invariant(bookingCase !== null, "BOOKING_CASE_NOT_FOUND", `BookingCase ${bookingCaseId} was not found.`);
    invariant(
      bookingCase.bookingCase.status === "selecting" ||
        bookingCase.bookingCase.status === "revalidating" ||
        bookingCase.bookingCase.status === "commit_pending" ||
        bookingCase.bookingCase.status === "confirmation_pending" ||
        bookingCase.bookingCase.status === "supplier_reconciliation_pending",
      "BOOKING_CASE_NOT_READY_FOR_COMMIT",
      "BookingCase must be in a commit-capable state before booking commit can start.",
    );
    const offerSession = await requireOfferSession(bookingCaseId, command.offerSessionId);
    invariant(
      offerSession.bookingCaseId === bookingCaseId,
      "OFFER_SESSION_CASE_MISMATCH",
      "OfferSession does not belong to the requested BookingCase.",
    );
    invariant(
      offerSession.selectedNormalizedSlotRef !== null &&
        offerSession.selectedCandidateHash !== null &&
        offerSession.selectionProofHash.length > 0,
      "OFFER_SESSION_SELECTION_REQUIRED",
      "OfferSession must have one selected slot before commit can start.",
    );
    if (command.expectedSelectionProofHash) {
      invariant(
        offerSession.selectionProofHash === requireRef(command.expectedSelectionProofHash, "expectedSelectionProofHash"),
        "STALE_SELECTION_PROOF",
        "Selection proof no longer matches the current OfferSession.",
      );
    }

    const diagnostics = await bookingCapabilityApplication.queryCapabilityDiagnostics({
      resolutionId: offerSession.capabilityResolutionRef,
    });
    invariant(
      diagnostics?.isCurrentScope,
      "CURRENT_BOOKING_CAPABILITY_NOT_FOUND",
      "One current booking capability tuple is required before booking commit can execute.",
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
      "OfferSession binding no longer matches the current booking capability tuple.",
    );
    const policy = await loadCurrentPolicy(diagnostics);
    const commitPolicy = toCommitPolicy(policy);
    const slotSetSnapshotDocument =
      await slotSearchApplication.slotSearchRepositories.getSlotSetSnapshot(
        offerSession.slotSetSnapshotRef,
      );
    invariant(
      slotSetSnapshotDocument !== null,
      "CURRENT_SLOT_SEARCH_NOT_FOUND",
      "A current SlotSetSnapshot is required before booking commit can execute.",
    );
    const slotSetSnapshot = slotSetSnapshotDocument.toSnapshot();
    const recoveryStateDocument =
      await slotSearchApplication.slotSearchRepositories.getSnapshotRecoveryState(
        slotSetSnapshot.recoveryStateRef,
      );
    invariant(
      recoveryStateDocument !== null,
      "SLOT_SNAPSHOT_RECOVERY_STATE_NOT_FOUND",
      "SlotSnapshotRecoveryState was not found for the selected offer snapshot.",
    );
    const candidateIndexDocument =
      await slotSearchApplication.slotSearchRepositories.getSnapshotCandidateIndex(
        slotSetSnapshot.candidateIndexRef,
      );
    invariant(
      candidateIndexDocument !== null,
      "SLOT_SNAPSHOT_CANDIDATE_INDEX_NOT_FOUND",
      "SnapshotCandidateIndex was not found for the selected offer snapshot.",
    );
    const normalizedSlots = (
      await slotSearchApplication.slotSearchRepositories.listNormalizedSlots(
        slotSetSnapshot.slotSetSnapshotId,
      )
    ).map((document) => document.toSnapshot());
    const slotSearch = {
      slotSetSnapshot,
      recoveryState: recoveryStateDocument.toSnapshot(),
      candidateIndex: candidateIndexDocument.toSnapshot(),
      normalizedSlots,
    };
    const selectedSlotRef = offerSession.selectedNormalizedSlotRef;
    const selectedSlot = slotSearch.normalizedSlots.find(
      (slot) => slot.normalizedSlotId === selectedSlotRef,
    );
    const reservationTruth =
      await bookingReservationApplication.queryReservationTruth({
        scopeFamily: "offer_session",
        scopeObjectRef: offerSession.offerSessionId,
        requestedAt: occurredAt,
      });

    const preflightFailureReasonCodes: string[] = [];
    if (bookingCase.bookingCase.currentOfferSessionRef !== offerSession.offerSessionId) {
      preflightFailureReasonCodes.push("slot_snapshot_superseded");
    }
    if (compareIso(slotSearch.slotSetSnapshot.expiresAt, occurredAt) < 0) {
      preflightFailureReasonCodes.push("slot_snapshot_expired");
    }
    if (slotSearch.recoveryState.viewState === "stale_refresh_required") {
      preflightFailureReasonCodes.push("slot_snapshot_not_selectable");
    }
    if (!selectedSlot) {
      preflightFailureReasonCodes.push("selected_slot_missing_from_snapshot");
    }
    if (
      !slotSearch.candidateIndex.orderedSlotRefs.includes(selectedSlotRef)
    ) {
      preflightFailureReasonCodes.push("selected_slot_missing_from_candidate_index");
    }
    if (
      diagnostics.resolution.capabilityState === "recovery_only" ||
      diagnostics.resolution.capabilityState === "blocked"
    ) {
      preflightFailureReasonCodes.push("route_not_writable");
    }
    if (command.expectedRequestLifecycleLeaseRef) {
      invariant(
        bookingCase.bookingCase.requestLifecycleLeaseRef ===
          requireRef(command.expectedRequestLifecycleLeaseRef, "expectedRequestLifecycleLeaseRef"),
        "STALE_REQUEST_LIFECYCLE_LEASE",
        "BookingCase requestLifecycleLeaseRef no longer matches the caller tuple.",
      );
    }
    if (command.expectedOwnershipEpochRef !== undefined && command.expectedOwnershipEpochRef !== null) {
      invariant(
        bookingCase.bookingCase.ownershipEpoch ===
          ensurePositiveInteger(command.expectedOwnershipEpochRef, "expectedOwnershipEpochRef"),
        "STALE_REQUEST_OWNERSHIP_EPOCH",
        "BookingCase ownershipEpoch no longer matches the caller tuple.",
      );
    }
    if (command.expectedSourceDecisionEpochRef) {
      invariant(
        bookingCase.bookingCase.sourceDecisionEpochRef ===
          requireRef(command.expectedSourceDecisionEpochRef, "expectedSourceDecisionEpochRef"),
        "STALE_SOURCE_DECISION_EPOCH",
        "BookingCase sourceDecisionEpochRef no longer matches the caller tuple.",
      );
    }
    if (command.expectedRuntimePublicationBundleRef) {
      invariant(
        bookingCase.bookingCase.runtimePublicationBundleRef ===
          requireRef(
            command.expectedRuntimePublicationBundleRef,
            "expectedRuntimePublicationBundleRef",
          ),
        "STALE_RUNTIME_PUBLICATION_BUNDLE",
        "Runtime publication bundle no longer matches the caller tuple.",
      );
    }
    if (command.expectedSurfacePublicationRef) {
      invariant(
        bookingCase.bookingCase.surfacePublicationRef ===
          requireRef(command.expectedSurfacePublicationRef, "expectedSurfacePublicationRef"),
        "STALE_SURFACE_PUBLICATION",
        "Surface publication no longer matches the caller tuple.",
      );
    }
    if (offerSession.selectionAudience === "staff" && !optionalRef(command.reviewActionLeaseRef)) {
      preflightFailureReasonCodes.push("review_action_lease_missing");
    }
    if (command.safetyPreemptionReasonCode) {
      preflightFailureReasonCodes.push(requireRef(command.safetyPreemptionReasonCode, "safetyPreemptionReasonCode"));
    }

    const reservationVersionRef =
      options?.reservationVersionRefOverride ??
      reservationTruth?.scope.currentReservationVersionRef ??
      null;
    const preflightVersion = buildPreflightVersion({
      slotSetSnapshotId: slotSearch.slotSetSnapshot.slotSetSnapshotId,
      policyBundleHash: bookingCase.searchPolicy?.policyBundleHash ?? slotSearch.slotSetSnapshot.policyBundleHash,
      capabilityTupleHash: diagnostics.resolution.capabilityTupleHash,
      providerAdapterBindingHash: diagnostics.providerAdapterBinding.bindingHash,
      selectedNormalizedSlotRef: selectedSlotRef,
      selectedCandidateHash: offerSession.selectedCandidateHash,
      selectionProofHash: offerSession.selectionProofHash,
      reservationVersionRef,
    });

    const routeIntentBindingRef =
      optionalRef(command.offerSessionId) ?? diagnostics.resolution.routeTuple.routeIntentBindingRef;
    const guardedRecheckFailureReasonCodes: string[] = [];

    return {
      bookingCase,
      diagnostics,
      policy,
      commitPolicy,
      offerSession,
      currentReservationTruth: reservationTruth,
      selectedSlotRef,
      selectedCandidateHash: offerSession.selectedCandidateHash,
      occurredAt,
      preflightVersion,
      preflightFailureReasonCodes: uniqueSorted(preflightFailureReasonCodes),
      guardedRecheckFailureReasonCodes,
      dispatchEffectKeyRef:
        buildDispatchEffectKey({
          bookingCaseId,
          canonicalReservationKey:
            reservationTruth?.scope.canonicalReservationKey ??
            `${offerSession.selectedCanonicalSlotIdentityRef}::provisional`,
          selectionProofHash: offerSession.selectionProofHash,
        }),
      routeIntentBindingRef,
    };
  }

  async function refreshExternalConfirmationGate(input: {
    transactionId: string;
    episodeRef: string;
    domainObjectRef: string;
    providerReference: string | null;
    reasonCode: string | null;
    occurredAt: string;
    outcome: "confirmation_pending" | "reconciliation_required";
    existingGateRef?: string | null;
  }): Promise<string> {
    const gate = await reservationConfirmationAuthority.refreshExternalConfirmationGate({
      gateId: optionalRef(input.existingGateRef) ?? undefined,
      episodeId: input.episodeRef,
      domain: "booking",
      domainObjectRef: input.domainObjectRef,
      transportMode: "booking_commit",
      assuranceLevel: gateAssuranceLevel(input.outcome),
      evidenceModelVersionRef: `booking_commit_gate::${input.transactionId}`,
      requiredHardMatchRefs: ["selected_slot", "reservation_key"],
      evidenceAtoms: buildGateEvidenceAtoms({
        occurredAt: input.occurredAt,
        providerReference: input.providerReference,
        reasonCode: input.reasonCode,
        outcome: input.outcome,
      }),
      confirmationDeadlineAt: addSeconds(input.occurredAt, 900),
      priorProbability: 0.55,
      createdAt: input.occurredAt,
      updatedAt: input.occurredAt,
      thresholdPolicy: defaultReservationConfirmationThresholdPolicy,
    });
    return gate.gateId;
  }

  async function aggregateCurrentResult(
    bookingCaseId: string,
    options?: {
      reservationScopeObjectRef?: string | null;
      requestedAt?: string | null;
      replayed?: boolean;
      replayDecisionClass?: string | null;
      collisionReviewRef?: string | null;
      dispatchAttemptRef?: string | null;
      receiptCheckpointRef?: string | null;
      emittedEvents?: readonly FoundationEventEnvelope<object>[];
    },
  ): Promise<BookingCommitApplicationResult | null> {
    const current = await bookingCommitService.queryCurrentBookingCommit(bookingCaseId);
    if (!current) {
      return null;
    }
    const bookingCase = await bookingCaseApplication.queryBookingCase(bookingCaseId);
    invariant(bookingCase !== null, "BOOKING_CASE_NOT_FOUND", `BookingCase ${bookingCaseId} was not found.`);
    const reservationScopeObjectRef =
      optionalRef(options?.reservationScopeObjectRef) ??
      current.transaction.offerSessionRef;
    const reservationTruth = await bookingReservationApplication.queryReservationTruth({
      scopeFamily: "offer_session",
      scopeObjectRef: reservationScopeObjectRef,
      requestedAt:
        optionalRef(options?.requestedAt) ?? new Date().toISOString(),
    });
    return {
      ...current,
      bookingCase,
      reservationTruth,
      dispatchAttemptRef: options?.dispatchAttemptRef ?? current.transaction.dispatchAttemptRef,
      receiptCheckpointRef:
        options?.receiptCheckpointRef ?? current.transaction.latestReceiptCheckpointRef,
      replayDecisionClass: options?.replayDecisionClass ?? null,
      collisionReviewRef: options?.collisionReviewRef ?? null,
      replayed: options?.replayed ?? false,
      emittedEvents: options?.emittedEvents ?? [],
    };
  }

  return {
    bookingCommitService,
    bookingCommitRepositories,
    replayRepositories,

    async beginCommitFromSelectedOffer(command) {
      const context = await resolveCommitContext(command);
      const payloadArtifactRef =
        optionalRef(command.payloadArtifactRef) ??
        defaultPayloadArtifactRef({
          bookingCaseId: context.bookingCase.bookingCase.bookingCaseId,
          commandActionRecordRef: command.commandActionRecordRef,
        });
      const edgeCorrelationId =
        optionalRef(command.edgeCorrelationId) ??
        defaultEdgeCorrelationId({
          bookingCaseId: context.bookingCase.bookingCase.bookingCaseId,
          commandActionRecordRef: command.commandActionRecordRef,
        });
      const replayResolution = await replayAuthority.resolveInboundCommand({
        actionScope: PHASE4_BOOKING_COMMIT_ACTION_SCOPE,
        governingLineageRef: context.bookingCase.bookingCase.requestLineageRef,
        effectiveActorRef: command.actorRef,
        sourceCommandId: optionalRef(command.sourceCommandId) ?? command.idempotencyKey,
        sourceCommandIdFamily: "idempotency_key",
        transportCorrelationId: optionalRef(command.transportCorrelationId),
        intentGeneration: 0,
        expectedEffectSetRefs: [context.dispatchEffectKeyRef],
        scope: {
          governingObjectRef: context.bookingCase.bookingCase.bookingCaseId,
          governingObjectVersionRef:
            context.diagnostics.resolution.governingObjectVersionRef,
          routeIntentTupleHash: context.diagnostics.resolution.routeTuple.routeTupleHash,
          routeContractDigestRef:
            context.diagnostics.resolution.routeTuple.surfaceRouteContractRef,
          audienceSurfaceRuntimeBindingRef:
            context.diagnostics.resolution.routeTuple.runtimePublicationBundleRef,
          releaseTrustFreezeVerdictRef:
            context.diagnostics.projection.bookingCapabilityProjectionId,
        },
        rawPayload: command,
        semanticPayload: {
          bookingCaseId: command.bookingCaseId,
          offerSessionRef: context.offerSession.offerSessionId,
          selectionProofHash: context.offerSession.selectionProofHash,
          dispatchOutcome: command.dispatchOutcome,
        },
        firstAcceptedActionRecordRef: command.commandActionRecordRef,
        acceptedSettlementRef: command.commandSettlementRecordRef,
        observedAt: context.occurredAt,
      });

      if (replayResolution.decisionClass === "collision_review") {
        const replayed = await aggregateCurrentResult(command.bookingCaseId, {
          requestedAt: context.occurredAt,
          replayed: true,
          replayDecisionClass: replayResolution.decisionClass,
          collisionReviewRef:
            replayResolution.collisionReview?.replayCollisionReviewId ?? null,
        });
        invariant(
          replayed !== null,
          "BOOKING_COMMIT_COLLISION_REVIEW_REQUIRED",
          "Booking commit collision review opened before a stable transaction chain existed.",
        );
        return replayed;
      }

      if (replayResolution.reusedExistingRecord) {
        const replayed = await aggregateCurrentResult(command.bookingCaseId, {
          requestedAt: context.occurredAt,
          replayed: true,
          replayDecisionClass: replayResolution.decisionClass,
        });
        invariant(
          replayed !== null,
          "BOOKING_COMMIT_REPLAY_TARGET_NOT_FOUND",
          "Replay resolved to an existing command, but no current BookingTransaction was found.",
        );
        return replayed;
      }

      let reservationTruth = context.currentReservationTruth;
      if (context.preflightFailureReasonCodes.length === 0) {
        reservationTruth =
          context.diagnostics.providerAdapterBinding.reservationSemantics === "exclusive_hold"
            ? await bookingReservationApplication.acquireOrRefreshHold({
                scopeFamily: "offer_session",
                scopeObjectRef: context.offerSession.offerSessionId,
                actorRef: command.actorRef,
                subjectRef: command.subjectRef,
                commandActionRecordRef: command.commandActionRecordRef,
                commandSettlementRecordRef: command.commandSettlementRecordRef,
                occurredAt: context.occurredAt,
                payloadArtifactRef,
                edgeCorrelationId,
                expectedReservationVersionRef:
                  reservationTruth?.scope.currentReservationVersionRef ?? null,
                fenceToken: reservationTruth?.fence.fenceToken ?? null,
              })
            : await bookingReservationApplication.createOrRefreshSoftSelection({
                scopeFamily: "offer_session",
                scopeObjectRef: context.offerSession.offerSessionId,
                actorRef: command.actorRef,
                subjectRef: command.subjectRef,
                commandActionRecordRef: command.commandActionRecordRef,
                commandSettlementRecordRef: command.commandSettlementRecordRef,
                occurredAt: context.occurredAt,
                payloadArtifactRef,
                edgeCorrelationId,
                expectedReservationVersionRef:
                  reservationTruth?.scope.currentReservationVersionRef ?? null,
                fenceToken: reservationTruth?.fence.fenceToken ?? null,
              });

        const guarded = await resolveCommitContext(command, {
          reservationVersionRefOverride: reservationTruth.scope.currentReservationVersionRef,
        });
        if (
          guarded.offerSession.offerSessionId !== context.offerSession.offerSessionId ||
          guarded.offerSession.selectionProofHash !== context.offerSession.selectionProofHash ||
          guarded.diagnostics.resolution.capabilityTupleHash !==
            context.diagnostics.resolution.capabilityTupleHash ||
          guarded.diagnostics.providerAdapterBinding.bindingHash !==
            context.diagnostics.providerAdapterBinding.bindingHash
        ) {
          context.guardedRecheckFailureReasonCodes = uniqueSorted([
            ...context.guardedRecheckFailureReasonCodes,
            "guarded_recheck_tuple_drift",
          ]);
          reservationTruth = await bookingReservationApplication.releaseReservation({
            scopeFamily: "offer_session",
            scopeObjectRef: context.offerSession.offerSessionId,
            actorRef: command.actorRef,
            subjectRef: command.subjectRef,
            commandActionRecordRef: command.commandActionRecordRef,
            commandSettlementRecordRef: command.commandSettlementRecordRef,
            occurredAt: context.occurredAt,
            payloadArtifactRef,
            edgeCorrelationId,
            expectedReservationVersionRef: reservationTruth.scope.currentReservationVersionRef,
            fenceToken: reservationTruth.fence.fenceToken,
            terminalReasonCode: "guarded_recheck_tuple_drift",
          });
        }
      }

      const reservationOutcome =
        context.preflightFailureReasonCodes.length > 0 ||
        context.guardedRecheckFailureReasonCodes.length > 0
          ? {
              outcome: "failed" as const,
              reasonCode:
                context.preflightFailureReasonCodes[0] ??
                context.guardedRecheckFailureReasonCodes[0] ??
                "booking_preflight_failed",
              recoveryMode: "preflight_failed",
            }
          : classifyBeginReservationOutcome({
              dispatchOutcome: command.dispatchOutcome,
              policy: context.commitPolicy,
              safetyPreemptionReasonCode: optionalRef(command.safetyPreemptionReasonCode),
            });

      if (reservationTruth && context.preflightFailureReasonCodes.length > 0) {
        reservationTruth = await bookingReservationApplication.releaseReservation({
          scopeFamily: "offer_session",
          scopeObjectRef: context.offerSession.offerSessionId,
          actorRef: command.actorRef,
          subjectRef: command.subjectRef,
          commandActionRecordRef: command.commandActionRecordRef,
          commandSettlementRecordRef: command.commandSettlementRecordRef,
          occurredAt: context.occurredAt,
          payloadArtifactRef,
          edgeCorrelationId,
          expectedReservationVersionRef: reservationTruth.scope.currentReservationVersionRef,
          fenceToken: reservationTruth.fence.fenceToken,
          terminalReasonCode: reservationOutcome.reasonCode ?? "booking_preflight_failed",
        });
      } else if (reservationTruth && context.guardedRecheckFailureReasonCodes.length > 0) {
        reservationTruth = await bookingReservationApplication.releaseReservation({
          scopeFamily: "offer_session",
          scopeObjectRef: context.offerSession.offerSessionId,
          actorRef: command.actorRef,
          subjectRef: command.subjectRef,
          commandActionRecordRef: command.commandActionRecordRef,
          commandSettlementRecordRef: command.commandSettlementRecordRef,
          occurredAt: context.occurredAt,
          payloadArtifactRef,
          edgeCorrelationId,
          expectedReservationVersionRef: reservationTruth.scope.currentReservationVersionRef,
          fenceToken: reservationTruth.fence.fenceToken,
          terminalReasonCode: reservationOutcome.reasonCode ?? "guarded_recheck_failed",
        });
      } else if (reservationTruth && reservationOutcome.outcome === "confirmed") {
        reservationTruth = await bookingReservationApplication.markConfirmed({
          scopeFamily: "offer_session",
          scopeObjectRef: context.offerSession.offerSessionId,
          actorRef: command.actorRef,
          subjectRef: command.subjectRef,
          commandActionRecordRef: command.commandActionRecordRef,
          commandSettlementRecordRef: command.commandSettlementRecordRef,
          occurredAt: context.occurredAt,
          payloadArtifactRef,
          edgeCorrelationId,
          expectedReservationVersionRef: reservationTruth.scope.currentReservationVersionRef,
          fenceToken: reservationTruth.fence.fenceToken,
        });
      } else if (reservationTruth && reservationOutcome.outcome === "confirmation_pending") {
        reservationTruth = await bookingReservationApplication.markPendingConfirmation({
          scopeFamily: "offer_session",
          scopeObjectRef: context.offerSession.offerSessionId,
          actorRef: command.actorRef,
          subjectRef: command.subjectRef,
          commandActionRecordRef: command.commandActionRecordRef,
          commandSettlementRecordRef: command.commandSettlementRecordRef,
          occurredAt: context.occurredAt,
          payloadArtifactRef,
          edgeCorrelationId,
          expectedReservationVersionRef: reservationTruth.scope.currentReservationVersionRef,
          fenceToken: reservationTruth.fence.fenceToken,
        });
      } else if (reservationTruth && reservationOutcome.outcome === "reconciliation_required") {
        reservationTruth = await bookingReservationApplication.markDisputed({
          scopeFamily: "offer_session",
          scopeObjectRef: context.offerSession.offerSessionId,
          actorRef: command.actorRef,
          subjectRef: command.subjectRef,
          commandActionRecordRef: command.commandActionRecordRef,
          commandSettlementRecordRef: command.commandSettlementRecordRef,
          occurredAt: context.occurredAt,
          payloadArtifactRef,
          edgeCorrelationId,
          expectedReservationVersionRef: reservationTruth.scope.currentReservationVersionRef,
          fenceToken: reservationTruth.fence.fenceToken,
          terminalReasonCode: reservationOutcome.reasonCode ?? "reconciliation_required",
        });
      } else if (
        reservationTruth &&
        (reservationOutcome.outcome === "failed" || reservationOutcome.outcome === "expired")
      ) {
        reservationTruth =
          reservationOutcome.outcome === "expired"
            ? await bookingReservationApplication.expireReservation({
                scopeFamily: "offer_session",
                scopeObjectRef: context.offerSession.offerSessionId,
                actorRef: command.actorRef,
                subjectRef: command.subjectRef,
                commandActionRecordRef: command.commandActionRecordRef,
                commandSettlementRecordRef: command.commandSettlementRecordRef,
                occurredAt: context.occurredAt,
                payloadArtifactRef,
                edgeCorrelationId,
                expectedReservationVersionRef: reservationTruth.scope.currentReservationVersionRef,
                fenceToken: reservationTruth.fence.fenceToken,
                terminalReasonCode: reservationOutcome.reasonCode ?? "confirmation_expired",
              })
            : await bookingReservationApplication.releaseReservation({
                scopeFamily: "offer_session",
                scopeObjectRef: context.offerSession.offerSessionId,
                actorRef: command.actorRef,
                subjectRef: command.subjectRef,
                commandActionRecordRef: command.commandActionRecordRef,
                commandSettlementRecordRef: command.commandSettlementRecordRef,
                occurredAt: context.occurredAt,
                payloadArtifactRef,
                edgeCorrelationId,
                expectedReservationVersionRef: reservationTruth.scope.currentReservationVersionRef,
                fenceToken: reservationTruth.fence.fenceToken,
                terminalReasonCode: reservationOutcome.reasonCode ?? "booking_commit_failed",
              });
      }

      const bookingTransactionId = nextRecordId("booking_transaction", {
        bookingCaseId: context.bookingCase.bookingCase.bookingCaseId,
        idempotencyKey: command.idempotencyKey,
      });
      let externalConfirmationGateRef: string | null = null;
      if (
        reservationOutcome.outcome === "confirmation_pending" ||
        reservationOutcome.outcome === "reconciliation_required"
      ) {
        externalConfirmationGateRef = await refreshExternalConfirmationGate({
          transactionId: bookingTransactionId,
          episodeRef: context.bookingCase.bookingCase.episodeRef,
          domainObjectRef: bookingTransactionId,
          providerReference:
            "providerReference" in command.dispatchOutcome
              ? optionalRef(command.dispatchOutcome.providerReference)
              : null,
          reasonCode: reservationOutcome.reasonCode,
          occurredAt: context.occurredAt,
          outcome: reservationOutcome.outcome,
          existingGateRef:
            "externalConfirmationGateRef" in command.dispatchOutcome
              ? optionalRef(command.dispatchOutcome.externalConfirmationGateRef)
              : null,
        });
      }

      const dispatchAttempt = await replayAuthority.ensureAdapterDispatchAttempt({
        idempotencyRecordRef: replayResolution.idempotencyRecord.idempotencyRecordId,
        actionScope: PHASE4_BOOKING_COMMIT_ACTION_SCOPE,
        governingLineageRef: context.bookingCase.bookingCase.requestLineageRef,
        actionRecordRef: command.commandActionRecordRef,
        adapterContractProfileRef: context.diagnostics.providerAdapterBinding.adapterContractProfileRef,
        effectScope: context.bookingCase.bookingCase.bookingCaseId,
        effectKey:
          optionalRef(command.dispatchOutcome.kind === "dispatch_failed" ? null : null) ??
          context.dispatchEffectKeyRef,
        transportPayload: command.dispatchOutcome,
        semanticPayload: {
          bookingCaseId: context.bookingCase.bookingCase.bookingCaseId,
          bookingTransactionId,
          dispatchOutcome: command.dispatchOutcome,
        },
        providerCorrelationRef:
          "providerReference" in command.dispatchOutcome
            ? optionalRef(command.dispatchOutcome.providerReference)
            : null,
        firstDispatchedAt: context.occurredAt,
      });

      let effectiveDispatchOutcome: BeginCommitDispatchOutcomeInput;
      if (reservationOutcome.outcome === "confirmation_pending") {
        effectiveDispatchOutcome = {
          kind: "confirmation_pending",
          blockerReasonCode: reservationOutcome.reasonCode ?? "awaiting_external_confirmation",
          recoveryMode: reservationOutcome.recoveryMode ?? "awaiting_external_confirmation",
          externalConfirmationGateRef,
          providerReference:
            "providerReference" in command.dispatchOutcome
              ? optionalRef(command.dispatchOutcome.providerReference)
              : null,
        };
      } else if (reservationOutcome.outcome === "reconciliation_required") {
        effectiveDispatchOutcome = {
          kind: "reconciliation_required",
          blockerReasonCode: reservationOutcome.reasonCode ?? "reconciliation_required",
          recoveryMode: reservationOutcome.recoveryMode ?? "reconcile_supplier_outcome",
          externalConfirmationGateRef,
          providerReference:
            "providerReference" in command.dispatchOutcome
              ? optionalRef(command.dispatchOutcome.providerReference)
              : null,
        };
      } else {
        effectiveDispatchOutcome = command.dispatchOutcome;
      }

      const commitResult = await bookingCommitService.beginCommit({
        bookingTransactionId,
        bookingCaseId: context.bookingCase.bookingCase.bookingCaseId,
        episodeRef: context.bookingCase.bookingCase.episodeRef,
        requestId: context.bookingCase.bookingCase.requestId,
        requestLineageRef: context.bookingCase.bookingCase.requestLineageRef,
        lineageCaseLinkRef: context.bookingCase.bookingCase.lineageCaseLinkRef,
        snapshotId: context.offerSession.slotSetSnapshotRef,
        offerSessionRef: context.offerSession.offerSessionId,
        sourceDecisionEpochRef: context.bookingCase.bookingCase.sourceDecisionEpochRef,
        sourceDecisionSupersessionRef:
          context.bookingCase.bookingCase.sourceDecisionSupersessionRef,
        selectedSlotRef: context.selectedSlotRef,
        canonicalReservationKey:
          reservationTruth?.scope.canonicalReservationKey ??
          `${context.offerSession.selectedCanonicalSlotIdentityRef}::provisional`,
        selectedCandidateHash: context.selectedCandidateHash,
        selectionProofHash: context.offerSession.selectionProofHash,
        policyBundleHash:
          context.bookingCase.searchPolicy?.policyBundleHash ??
          context.offerSession.searchPolicyRef,
        capabilityResolutionRef: context.diagnostics.resolution.bookingCapabilityResolutionId,
        providerAdapterBindingRef:
          context.diagnostics.providerAdapterBinding.bookingProviderAdapterBindingId,
        providerAdapterBindingHash: context.diagnostics.providerAdapterBinding.bindingHash,
        adapterContractProfileRef:
          context.diagnostics.providerAdapterBinding.adapterContractProfileRef,
        capabilityTupleHash: context.diagnostics.resolution.capabilityTupleHash,
        authoritativeReadAndConfirmationPolicy: context.commitPolicy,
        reservationTruthProjectionRef:
          reservationTruth?.projection.reservationTruthProjectionId ?? null,
        idempotencyKey: command.idempotencyKey,
        preflightVersion: context.preflightVersion,
        reservationVersion: reservationTruth?.reservation.reservationVersion ?? 1,
        reservationVersionRef:
          reservationTruth?.scope.currentReservationVersionRef ??
          `${bookingTransactionId}@v1`,
        requestLifecycleLeaseRef: context.bookingCase.bookingCase.requestLifecycleLeaseRef,
        requestOwnershipEpochRef: context.bookingCase.bookingCase.ownershipEpoch,
        reviewActionLeaseRef: optionalRef(command.reviewActionLeaseRef),
        fencingToken:
          reservationTruth?.fence.fenceToken ?? context.bookingCase.bookingIntent.fencingToken,
        dispatchEffectKeyRef: context.dispatchEffectKeyRef,
        dispatchAttemptRef: dispatchAttempt.dispatchAttempt.dispatchAttemptId,
        latestReceiptCheckpointRef: null,
        holdState:
          reservationTruth?.reservation.state ?? "none",
        commandActionRecordRef: command.commandActionRecordRef,
        commandSettlementRecordRef: command.commandSettlementRecordRef,
        routeIntentBindingRef:
          context.diagnostics.resolution.routeTuple.routeIntentBindingRef,
        subjectRef: command.subjectRef,
        payloadArtifactRef,
        edgeCorrelationId,
        surfaceRouteContractRef:
          context.diagnostics.resolution.routeTuple.surfaceRouteContractRef,
        surfacePublicationRef:
          context.diagnostics.resolution.routeTuple.surfacePublicationRef,
        runtimePublicationBundleRef:
          context.diagnostics.resolution.routeTuple.runtimePublicationBundleRef,
        releaseRecoveryDispositionRef:
          optionalRef(command.releaseRecoveryDispositionRef),
        transitionEnvelopeRef: optionalRef(command.transitionEnvelopeRef),
        occurredAt: context.occurredAt,
        preflightFailureReasonCodes: context.preflightFailureReasonCodes,
        guardedRecheckFailureReasonCodes: context.guardedRecheckFailureReasonCodes,
        safetyPreemptionReasonCode: optionalRef(command.safetyPreemptionReasonCode),
        compensationReasonCodes: [],
        dispatchOutcome: effectiveDispatchOutcome,
      });

      const caseSettlement = await advanceCaseForCommitOutcome({
        bookingCaseApplication,
        bookingCase: context.bookingCase,
        transaction: commitResult.transaction,
        confirmationTruth: commitResult.confirmationTruthProjection,
        appointmentRef: commitResult.appointmentRecord?.appointmentRecordId ?? null,
        exceptionRef: commitResult.bookingException?.bookingExceptionId ?? null,
        actorRef: command.actorRef,
        commandActionRecordRef: command.commandActionRecordRef,
        commandSettlementRecordRef: command.commandSettlementRecordRef,
        occurredAt: context.occurredAt,
        routeIntentBindingRef:
          context.diagnostics.resolution.routeTuple.routeIntentBindingRef,
      });

      return {
        ...commitResult,
        bookingCase: caseSettlement.bookingCase,
        reservationTruth,
        dispatchAttemptRef: dispatchAttempt.dispatchAttempt.dispatchAttemptId,
        receiptCheckpointRef: null,
        replayDecisionClass: replayResolution.decisionClass,
        collisionReviewRef: null,
        replayed: false,
        emittedEvents: [
          ...(reservationTruth?.emittedEvents ?? []),
          ...commitResult.emittedEvents,
          ...caseSettlement.emittedEvents,
        ],
      };
    },

    async recordAuthoritativeObservation(command) {
      const transactionDocument =
        await bookingCommitRepositories.getBookingTransaction(
          requireRef(command.bookingTransactionId, "bookingTransactionId"),
        );
      invariant(
        transactionDocument !== null,
        "BOOKING_TRANSACTION_NOT_FOUND",
        `BookingTransaction ${command.bookingTransactionId} was not found.`,
      );
      const transaction = transactionDocument.toSnapshot();
      const payloadArtifactRef =
        optionalRef(command.payloadArtifactRef) ??
        defaultPayloadArtifactRef({
          bookingTransactionId: transaction.bookingTransactionId,
          commandActionRecordRef: command.commandActionRecordRef,
        });
      const edgeCorrelationId =
        optionalRef(command.edgeCorrelationId) ??
        defaultEdgeCorrelationId({
          bookingTransactionId: transaction.bookingTransactionId,
          commandActionRecordRef: command.commandActionRecordRef,
        });
      const commitPolicy: BookingCommitPolicySnapshot = {
        authoritativeReadAndConfirmationPolicyRef:
          transaction.authoritativeReadAndConfirmationPolicyRef,
        authoritativeReadMode: transaction.authoritativeReadMode,
        allowedAuthoritativeProofClasses: transaction.allowedAuthoritativeProofClasses,
        supportsAsyncCommitConfirmation: transaction.supportsAsyncCommitConfirmation,
        supportsDisputeRecovery: transaction.supportsDisputeRecovery,
        manageExposureBeforeProof: transaction.manageExposureBeforeProof,
        patientVisibilityBeforeProof: transaction.patientVisibilityBeforeProof,
      };

      const receiptResult = await replayAuthority.recordAdapterReceiptCheckpoint({
        actionScope: PHASE4_BOOKING_RECEIPT_ACTION_SCOPE,
        governingLineageRef: transaction.requestLineageRef,
        adapterContractProfileRef: transaction.adapterContractProfileRef,
        effectKey: transaction.dispatchEffectKeyRef,
        providerCorrelationRef: optionalRef(command.providerCorrelationRef),
        transportMessageId: requireRef(command.transportMessageId, "transportMessageId"),
        orderingKey: requireRef(command.orderingKey, "orderingKey"),
        rawReceipt: command.rawReceipt,
        semanticReceipt: command.semanticReceipt ?? command.rawReceipt,
        linkedSettlementRef: optionalRef(command.linkedSettlementRef),
        recordedAt: ensureIsoTimestamp(command.observedAt, "observedAt"),
      });

      let reservationTruth =
        await bookingReservationApplication.queryReservationTruth({
          scopeFamily: "offer_session",
          scopeObjectRef: transaction.offerSessionRef,
          requestedAt: command.observedAt,
        });
      const reservationOutcome =
        receiptResult.decisionClass === "collision_review"
          ? {
              outcome: "reconciliation_required" as const,
              reasonCode: "receipt_collision_review",
              recoveryMode: "reconcile_divergent_receipt",
            }
          : classifyObservationReservationOutcome({
              transaction,
              observationKind: command.observationKind,
              authoritativeProofClass:
                optionalRef(command.authoritativeProofClass ?? null) as Exclude<
                  BookingAuthoritativeProofClass,
                  "none"
                > | null,
              providerReference: optionalRef(command.providerReference),
              policy: commitPolicy,
              blockerReasonCode: optionalRef(command.blockerReasonCode),
              failureReasonCode: optionalRef(command.failureReasonCode),
            });

      if (reservationTruth && reservationOutcome.outcome === "confirmed") {
        reservationTruth = await bookingReservationApplication.markConfirmed({
          scopeFamily: "offer_session",
          scopeObjectRef: transaction.offerSessionRef,
          actorRef: command.actorRef,
          subjectRef: command.subjectRef,
          commandActionRecordRef: command.commandActionRecordRef,
          commandSettlementRecordRef: command.commandSettlementRecordRef,
          occurredAt: command.observedAt,
          payloadArtifactRef,
          edgeCorrelationId,
          expectedReservationVersionRef: reservationTruth.scope.currentReservationVersionRef,
          fenceToken: reservationTruth.fence.fenceToken,
        });
      } else if (reservationTruth && reservationOutcome.outcome === "confirmation_pending") {
        reservationTruth = await bookingReservationApplication.markPendingConfirmation({
          scopeFamily: "offer_session",
          scopeObjectRef: transaction.offerSessionRef,
          actorRef: command.actorRef,
          subjectRef: command.subjectRef,
          commandActionRecordRef: command.commandActionRecordRef,
          commandSettlementRecordRef: command.commandSettlementRecordRef,
          occurredAt: command.observedAt,
          payloadArtifactRef,
          edgeCorrelationId,
          expectedReservationVersionRef: reservationTruth.scope.currentReservationVersionRef,
          fenceToken: reservationTruth.fence.fenceToken,
        });
      } else if (reservationTruth && reservationOutcome.outcome === "reconciliation_required") {
        reservationTruth = await bookingReservationApplication.markDisputed({
          scopeFamily: "offer_session",
          scopeObjectRef: transaction.offerSessionRef,
          actorRef: command.actorRef,
          subjectRef: command.subjectRef,
          commandActionRecordRef: command.commandActionRecordRef,
          commandSettlementRecordRef: command.commandSettlementRecordRef,
          occurredAt: command.observedAt,
          payloadArtifactRef,
          edgeCorrelationId,
          expectedReservationVersionRef: reservationTruth.scope.currentReservationVersionRef,
          fenceToken: reservationTruth.fence.fenceToken,
          terminalReasonCode: reservationOutcome.reasonCode ?? "reconciliation_required",
        });
      } else if (reservationTruth && reservationOutcome.outcome === "failed") {
        reservationTruth = await bookingReservationApplication.releaseReservation({
          scopeFamily: "offer_session",
          scopeObjectRef: transaction.offerSessionRef,
          actorRef: command.actorRef,
          subjectRef: command.subjectRef,
          commandActionRecordRef: command.commandActionRecordRef,
          commandSettlementRecordRef: command.commandSettlementRecordRef,
          occurredAt: command.observedAt,
          payloadArtifactRef,
          edgeCorrelationId,
          expectedReservationVersionRef: reservationTruth.scope.currentReservationVersionRef,
          fenceToken: reservationTruth.fence.fenceToken,
          terminalReasonCode: reservationOutcome.reasonCode ?? "authoritative_failure",
        });
      } else if (reservationTruth && reservationOutcome.outcome === "expired") {
        reservationTruth = await bookingReservationApplication.expireReservation({
          scopeFamily: "offer_session",
          scopeObjectRef: transaction.offerSessionRef,
          actorRef: command.actorRef,
          subjectRef: command.subjectRef,
          commandActionRecordRef: command.commandActionRecordRef,
          commandSettlementRecordRef: command.commandSettlementRecordRef,
          occurredAt: command.observedAt,
          payloadArtifactRef,
          edgeCorrelationId,
          expectedReservationVersionRef: reservationTruth.scope.currentReservationVersionRef,
          fenceToken: reservationTruth.fence.fenceToken,
          terminalReasonCode: reservationOutcome.reasonCode ?? "confirmation_expired",
        });
      }

      const gateRef =
        reservationOutcome.outcome === "confirmation_pending" ||
        reservationOutcome.outcome === "reconciliation_required"
          ? await refreshExternalConfirmationGate({
              transactionId: transaction.bookingTransactionId,
              episodeRef: transaction.episodeRef,
              domainObjectRef: transaction.bookingTransactionId,
              providerReference: optionalRef(command.providerReference),
              reasonCode: reservationOutcome.reasonCode,
              occurredAt: ensureIsoTimestamp(command.observedAt, "observedAt"),
              outcome: reservationOutcome.outcome,
              existingGateRef:
                optionalRef(command.externalConfirmationGateRef) ??
                transaction.externalConfirmationGateRef,
            })
          : transaction.externalConfirmationGateRef;

      const commitResult = await bookingCommitService.ingestAuthoritativeObservation({
        bookingTransactionId: transaction.bookingTransactionId,
        latestReceiptCheckpointRef: receiptResult.checkpoint.receiptCheckpointId,
        receiptDecisionClass: receiptResult.decisionClass,
        providerCorrelationRef: optionalRef(command.providerCorrelationRef),
        observedAt: command.observedAt,
        observationKind:
          receiptResult.decisionClass === "collision_review"
            ? "reconciliation_required"
            : command.observationKind,
        authoritativeProofClass:
          optionalRef(command.authoritativeProofClass ?? null) as Exclude<
            BookingAuthoritativeProofClass,
            "none"
          > | null,
        providerReference: optionalRef(command.providerReference),
        externalConfirmationGateRef: gateRef,
        blockerReasonCode:
          reservationOutcome.outcome === "confirmation_pending" ||
          reservationOutcome.outcome === "reconciliation_required"
            ? reservationOutcome.reasonCode
            : optionalRef(command.blockerReasonCode),
        recoveryMode: reservationOutcome.recoveryMode,
        failureReasonCode: optionalRef(command.failureReasonCode),
        commandActionRecordRef: command.commandActionRecordRef,
        commandSettlementRecordRef: command.commandSettlementRecordRef,
        routeIntentBindingRef: transaction.routeIntentBindingRef,
        subjectRef: command.subjectRef,
        payloadArtifactRef,
        edgeCorrelationId,
      });

      const bookingCase = await bookingCaseApplication.queryBookingCase(transaction.bookingCaseId);
      invariant(bookingCase !== null, "BOOKING_CASE_NOT_FOUND", "BookingCase was not found for the transaction.");
      const caseSettlement = await advanceCaseForCommitOutcome({
        bookingCaseApplication,
        bookingCase,
        transaction: commitResult.transaction,
        confirmationTruth: commitResult.confirmationTruthProjection,
        appointmentRef: commitResult.appointmentRecord?.appointmentRecordId ?? null,
        exceptionRef: commitResult.bookingException?.bookingExceptionId ?? null,
        actorRef: command.actorRef,
        commandActionRecordRef: command.commandActionRecordRef,
        commandSettlementRecordRef: command.commandSettlementRecordRef,
        occurredAt: command.observedAt,
        routeIntentBindingRef: transaction.routeIntentBindingRef,
      });

      return {
        ...commitResult,
        bookingCase: caseSettlement.bookingCase,
        reservationTruth,
        dispatchAttemptRef: receiptResult.dispatchAttempt.dispatchAttemptId,
        receiptCheckpointRef: receiptResult.checkpoint.receiptCheckpointId,
        replayDecisionClass: receiptResult.decisionClass,
        collisionReviewRef:
          receiptResult.collisionReview?.replayCollisionReviewId ?? null,
        replayed: commitResult.replayed,
        emittedEvents: [
          ...(reservationTruth?.emittedEvents ?? []),
          ...commitResult.emittedEvents,
          ...caseSettlement.emittedEvents,
        ],
      };
    },

    async reconcileAmbiguousTransaction(command) {
      const transactionDocument =
        await bookingCommitRepositories.getBookingTransaction(
          requireRef(command.bookingTransactionId, "bookingTransactionId"),
        );
      invariant(transactionDocument !== null, "BOOKING_TRANSACTION_NOT_FOUND", "BookingTransaction was not found.");
      const transaction = transactionDocument.toSnapshot();
      const payloadArtifactRef =
        optionalRef(command.payloadArtifactRef) ??
        defaultPayloadArtifactRef({
          bookingTransactionId: transaction.bookingTransactionId,
          commandActionRecordRef: command.commandActionRecordRef,
        });
      const edgeCorrelationId =
        optionalRef(command.edgeCorrelationId) ??
        defaultEdgeCorrelationId({
          bookingTransactionId: transaction.bookingTransactionId,
          commandActionRecordRef: command.commandActionRecordRef,
        });
      let reservationTruth =
        await bookingReservationApplication.queryReservationTruth({
          scopeFamily: "offer_session",
          scopeObjectRef: transaction.offerSessionRef,
          requestedAt: command.reconciledAt,
        });
      if (reservationTruth && command.resolution.kind === "confirmed") {
        reservationTruth = await bookingReservationApplication.markConfirmed({
          scopeFamily: "offer_session",
          scopeObjectRef: transaction.offerSessionRef,
          actorRef: command.actorRef,
          subjectRef: command.subjectRef,
          commandActionRecordRef: command.commandActionRecordRef,
          commandSettlementRecordRef: command.commandSettlementRecordRef,
          occurredAt: command.reconciledAt,
          payloadArtifactRef,
          edgeCorrelationId,
          expectedReservationVersionRef: reservationTruth.scope.currentReservationVersionRef,
          fenceToken: reservationTruth.fence.fenceToken,
        });
      } else if (reservationTruth && command.resolution.kind === "failed") {
        reservationTruth = await bookingReservationApplication.releaseReservation({
          scopeFamily: "offer_session",
          scopeObjectRef: transaction.offerSessionRef,
          actorRef: command.actorRef,
          subjectRef: command.subjectRef,
          commandActionRecordRef: command.commandActionRecordRef,
          commandSettlementRecordRef: command.commandSettlementRecordRef,
          occurredAt: command.reconciledAt,
          payloadArtifactRef,
          edgeCorrelationId,
          expectedReservationVersionRef: reservationTruth.scope.currentReservationVersionRef,
          fenceToken: reservationTruth.fence.fenceToken,
          terminalReasonCode: command.resolution.failureReasonCode,
        });
      } else if (reservationTruth && command.resolution.kind === "expired") {
        reservationTruth = await bookingReservationApplication.expireReservation({
          scopeFamily: "offer_session",
          scopeObjectRef: transaction.offerSessionRef,
          actorRef: command.actorRef,
          subjectRef: command.subjectRef,
          commandActionRecordRef: command.commandActionRecordRef,
          commandSettlementRecordRef: command.commandSettlementRecordRef,
          occurredAt: command.reconciledAt,
          payloadArtifactRef,
          edgeCorrelationId,
          expectedReservationVersionRef: reservationTruth.scope.currentReservationVersionRef,
          fenceToken: reservationTruth.fence.fenceToken,
          terminalReasonCode: command.resolution.failureReasonCode,
        });
      }

      const resolution =
        command.resolution.kind === "confirmed"
          ? {
              kind: "confirmed" as const,
              authoritativeProofClass: command.resolution.authoritativeProofClass,
              providerReference: optionalRef(command.resolution.providerReference),
              externalConfirmationGateRef: transaction.externalConfirmationGateRef,
            }
          : command.resolution.kind === "failed"
            ? {
                kind: "failed" as const,
                failureReasonCode: command.resolution.failureReasonCode,
              }
            : {
                kind: "expired" as const,
                failureReasonCode: command.resolution.failureReasonCode,
              };

      const commitResult = await bookingCommitService.reconcileAmbiguousTransaction({
        bookingTransactionId: transaction.bookingTransactionId,
        reconciledAt: command.reconciledAt,
        resolution,
        commandActionRecordRef: command.commandActionRecordRef,
        commandSettlementRecordRef: command.commandSettlementRecordRef,
        routeIntentBindingRef: transaction.routeIntentBindingRef,
        subjectRef: command.subjectRef,
        payloadArtifactRef,
        edgeCorrelationId,
      });

      const bookingCase = await bookingCaseApplication.queryBookingCase(transaction.bookingCaseId);
      invariant(bookingCase !== null, "BOOKING_CASE_NOT_FOUND", "BookingCase was not found for the transaction.");
      const caseSettlement = await advanceCaseForCommitOutcome({
        bookingCaseApplication,
        bookingCase,
        transaction: commitResult.transaction,
        confirmationTruth: commitResult.confirmationTruthProjection,
        appointmentRef: commitResult.appointmentRecord?.appointmentRecordId ?? null,
        exceptionRef: commitResult.bookingException?.bookingExceptionId ?? null,
        actorRef: command.actorRef,
        commandActionRecordRef: command.commandActionRecordRef,
        commandSettlementRecordRef: command.commandSettlementRecordRef,
        occurredAt: command.reconciledAt,
        routeIntentBindingRef: transaction.routeIntentBindingRef,
      });

      return {
        ...commitResult,
        bookingCase: caseSettlement.bookingCase,
        reservationTruth,
        dispatchAttemptRef: transaction.dispatchAttemptRef,
        receiptCheckpointRef: transaction.latestReceiptCheckpointRef,
        replayDecisionClass: null,
        collisionReviewRef: null,
        replayed: commitResult.replayed,
        emittedEvents: [
          ...(reservationTruth?.emittedEvents ?? []),
          ...commitResult.emittedEvents,
          ...caseSettlement.emittedEvents,
        ],
      };
    },

    async releaseOrSupersedeFailedTransaction(command) {
      const transactionDocument =
        await bookingCommitRepositories.getBookingTransaction(
          requireRef(command.bookingTransactionId, "bookingTransactionId"),
        );
      invariant(transactionDocument !== null, "BOOKING_TRANSACTION_NOT_FOUND", "BookingTransaction was not found.");
      const transaction = transactionDocument.toSnapshot();
      const payloadArtifactRef =
        optionalRef(command.payloadArtifactRef) ??
        defaultPayloadArtifactRef({
          bookingTransactionId: transaction.bookingTransactionId,
          commandActionRecordRef: command.commandActionRecordRef,
        });
      const edgeCorrelationId =
        optionalRef(command.edgeCorrelationId) ??
        defaultEdgeCorrelationId({
          bookingTransactionId: transaction.bookingTransactionId,
          commandActionRecordRef: command.commandActionRecordRef,
        });
      let reservationTruth =
        await bookingReservationApplication.queryReservationTruth({
          scopeFamily: "offer_session",
          scopeObjectRef: transaction.offerSessionRef,
          requestedAt: command.releasedAt,
        });
      if (
        reservationTruth &&
        reservationTruth.scope.scopeState === "active" &&
        reservationTruth.scope.currentReservationState !== "released" &&
        reservationTruth.scope.currentReservationState !== "expired"
      ) {
        reservationTruth = await bookingReservationApplication.releaseReservation({
          scopeFamily: "offer_session",
          scopeObjectRef: transaction.offerSessionRef,
          actorRef: command.actorRef,
          subjectRef: command.subjectRef,
          commandActionRecordRef: command.commandActionRecordRef,
          commandSettlementRecordRef: command.commandSettlementRecordRef,
          occurredAt: command.releasedAt,
          payloadArtifactRef,
          edgeCorrelationId,
          expectedReservationVersionRef: reservationTruth.scope.currentReservationVersionRef,
          fenceToken: reservationTruth.fence.fenceToken,
          terminalReasonCode: command.reasonCodes[0] ?? "transaction_superseded",
        });
      }

      const commitResult = await bookingCommitService.releaseOrSupersedeFailedTransaction({
        bookingTransactionId: transaction.bookingTransactionId,
        releasedAt: command.releasedAt,
        reasonCodes: command.reasonCodes,
        commandActionRecordRef: command.commandActionRecordRef,
        commandSettlementRecordRef: command.commandSettlementRecordRef,
        routeIntentBindingRef: transaction.routeIntentBindingRef,
        subjectRef: command.subjectRef,
        payloadArtifactRef,
        edgeCorrelationId,
      });

      const bookingCase = await bookingCaseApplication.queryBookingCase(transaction.bookingCaseId);
      invariant(bookingCase !== null, "BOOKING_CASE_NOT_FOUND", "BookingCase was not found for the transaction.");
      return {
        ...commitResult,
        bookingCase,
        reservationTruth,
        dispatchAttemptRef: transaction.dispatchAttemptRef,
        receiptCheckpointRef: transaction.latestReceiptCheckpointRef,
        replayDecisionClass: null,
        collisionReviewRef: null,
        replayed: commitResult.replayed,
        emittedEvents: [
          ...(reservationTruth?.emittedEvents ?? []),
          ...commitResult.emittedEvents,
        ],
      };
    },

    async queryCurrentBookingCommit(input) {
      return aggregateCurrentResult(requireRef(input.bookingCaseId, "bookingCaseId"), {
        requestedAt: optionalRef(input.requestedAt) ?? new Date().toISOString(),
      });
    },
  };
}
