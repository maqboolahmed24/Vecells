import { createHash } from "node:crypto";
import {
  createDeterministicBackboneIdGenerator,
  type BackboneIdGenerator,
} from "@vecells/domain-kernel";
import type { FoundationEventEnvelope } from "@vecells/event-contracts";
import type {
  AuthoritativeReadAndConfirmationPolicySnapshot,
  BeginCommitDispatchOutcomeInput,
  BookingAuthoritativeProofClass,
  BookingCaseBundle,
  BookingCommitPolicySnapshot,
  BookingSelectionAudience,
  ReleasedCapacityInput,
  WaitlistBundle,
  WaitlistEntryMutationResult,
  WaitlistEntrySnapshot,
  WaitlistOfferSnapshot,
  WaitlistOfferTruthMode,
} from "@vecells/domain-booking";
import {
  createPhase4SmartWaitlistService,
  createPhase4SmartWaitlistStore,
} from "@vecells/domain-booking";
import {
  createPhase4BookingCaseApplication,
  type Phase4BookingCaseApplication,
} from "./phase4-booking-case";
import {
  createPhase4BookingCapabilityApplication,
  type Phase4BookingCapabilityApplication,
} from "./phase4-booking-capability";
import {
  createPhase4BookingReservationApplication,
  type BookingReservationTruthResult,
  type Phase4BookingReservationApplication,
} from "./phase4-booking-reservations";
import {
  createPhase4BookingCommitApplication,
  type BookingCommitApplicationResult,
  type Phase4BookingCommitApplication,
} from "./phase4-booking-commit";

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

function selectionAudienceFromEntry(entry: WaitlistEntrySnapshot): BookingSelectionAudience {
  return entry.selectionAudience === "staff" ? "staff" : "patient";
}

function selectionAudienceFromWaitlistAudience(
  selectionAudience: "patient" | "staff",
): BookingSelectionAudience {
  return selectionAudience === "staff" ? "staff" : "patient";
}

function normalizeWaitlistModality(
  modality: string,
): WaitlistEntrySnapshot["preferenceEnvelope"]["modality"] {
  const normalized = modality.trim().toLowerCase();
  if (
    normalized === "remote" ||
    normalized === "video" ||
    normalized === "telephone" ||
    normalized === "online"
  ) {
    return "remote";
  }
  if (normalized === "either" || normalized === "hybrid") {
    return "either";
  }
  return "in_person";
}

function buildSyntheticWaitlistOfferSessionRef(waitlistOfferId: string): string {
  return `waitlist_offer_session::${waitlistOfferId}`;
}

function buildSyntheticWaitlistSnapshotRef(waitlistOffer: WaitlistOfferSnapshot): string {
  return (
    waitlistOffer.sourceSlotSetSnapshotRef ??
    `waitlist_release_snapshot::${waitlistOffer.waitlistOfferId}::${waitlistOffer.capacityUnitRef}`
  );
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

function normalizeWaitlistCommitOutcome(
  outcome: BookingCommitApplicationResult["transaction"]["authoritativeOutcomeState"],
): "booked" | "confirmation_pending" | "reconciliation_required" | "failed" | "expired" {
  if (
    outcome === "booked" ||
    outcome === "confirmation_pending" ||
    outcome === "reconciliation_required" ||
    outcome === "failed" ||
    outcome === "expired"
  ) {
    return outcome;
  }
  invariant(
    false,
    "WAITLIST_COMMIT_OUTCOME_UNSUPPORTED",
    `Waitlist acceptance produced unsupported authoritative outcome ${outcome}.`,
  );
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

function classifyWaitlistReservationOutcome(input: {
  dispatchOutcome: BeginCommitDispatchOutcomeInput;
  policy: BookingCommitPolicySnapshot;
}): {
  outcome: "confirmed" | "confirmation_pending" | "reconciliation_required" | "failed" | "expired";
  reasonCode: string | null;
  recoveryMode: string | null;
} {
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

function buildEffectiveWaitlistDispatchOutcome(input: {
  dispatchOutcome: BeginCommitDispatchOutcomeInput;
  reservationOutcome: ReturnType<typeof classifyWaitlistReservationOutcome>;
}): BeginCommitDispatchOutcomeInput {
  if (input.reservationOutcome.outcome === "confirmation_pending") {
    return {
      kind: "confirmation_pending",
      blockerReasonCode: input.reservationOutcome.reasonCode ?? "awaiting_external_confirmation",
      recoveryMode: input.reservationOutcome.recoveryMode ?? "awaiting_external_confirmation",
      externalConfirmationGateRef:
        input.dispatchOutcome.kind === "confirmation_pending" ||
        input.dispatchOutcome.kind === "reconciliation_required"
          ? input.dispatchOutcome.externalConfirmationGateRef
          : null,
      providerReference:
        "providerReference" in input.dispatchOutcome
          ? optionalRef(input.dispatchOutcome.providerReference)
          : null,
    };
  }
  if (input.reservationOutcome.outcome === "reconciliation_required") {
    return {
      kind: "reconciliation_required",
      blockerReasonCode: input.reservationOutcome.reasonCode ?? "reconciliation_required",
      recoveryMode: input.reservationOutcome.recoveryMode ?? "reconcile_supplier_outcome",
      externalConfirmationGateRef:
        input.dispatchOutcome.kind === "confirmation_pending" ||
        input.dispatchOutcome.kind === "reconciliation_required"
          ? input.dispatchOutcome.externalConfirmationGateRef
          : null,
      providerReference:
        "providerReference" in input.dispatchOutcome
          ? optionalRef(input.dispatchOutcome.providerReference)
          : null,
    };
  }
  return input.dispatchOutcome;
}

function canRefreshBookingCaseToWaitlisted(status: BookingCaseBundle["bookingCase"]["status"]): boolean {
  return (
    status !== "waitlisted" &&
    status !== "booked" &&
    status !== "confirmation_pending" &&
    status !== "supplier_reconciliation_pending" &&
    status !== "managed" &&
    status !== "closed"
  );
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

function buildTransitionInput(
  bundle: BookingCaseBundle,
  command: {
    actorRef: string;
    commandActionRecordRef: string;
    commandSettlementRecordRef: string;
    recordedAt: string;
    routeIntentBindingRef: string;
    reasonCode: string;
  },
  extras?: {
    selectedSlotRef?: string | null;
    waitlistEntryRef?: string | null;
    activeWaitlistFallbackObligationRef?: string | null;
    latestWaitlistContinuationTruthProjectionRef?: string | null;
    appointmentRef?: string | null;
    latestConfirmationTruthProjectionRef?: string | null;
    callbackCaseRef?: string | null;
    hubCaseRef?: string | null;
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
    reasonCode: command.reasonCode,
    activeCapabilityResolutionRef: bundle.bookingCase.activeCapabilityResolutionRef,
    activeCapabilityProjectionRef: bundle.bookingCase.activeCapabilityProjectionRef,
    activeProviderAdapterBindingRef: bundle.bookingCase.activeProviderAdapterBindingRef,
    capabilityState: null,
    currentOfferSessionRef: bundle.bookingCase.currentOfferSessionRef,
    selectedSlotRef: extras?.selectedSlotRef ?? bundle.bookingCase.selectedSlotRef,
    appointmentRef: extras?.appointmentRef ?? bundle.bookingCase.appointmentRef,
    latestConfirmationTruthProjectionRef:
      extras?.latestConfirmationTruthProjectionRef ??
      bundle.bookingCase.latestConfirmationTruthProjectionRef,
    waitlistEntryRef: extras?.waitlistEntryRef ?? bundle.bookingCase.waitlistEntryRef,
    activeWaitlistFallbackObligationRef:
      extras?.activeWaitlistFallbackObligationRef ??
      bundle.bookingCase.activeWaitlistFallbackObligationRef,
    latestWaitlistContinuationTruthProjectionRef:
      extras?.latestWaitlistContinuationTruthProjectionRef ??
      bundle.bookingCase.latestWaitlistContinuationTruthProjectionRef,
    callbackCaseRef: extras?.callbackCaseRef ?? null,
    hubCaseRef: extras?.hubCaseRef ?? null,
    surfaceRouteContractRef: bundle.bookingCase.surfaceRouteContractRef,
    surfacePublicationRef: bundle.bookingCase.surfacePublicationRef,
    runtimePublicationBundleRef: bundle.bookingCase.runtimePublicationBundleRef,
  };
}

async function advanceCaseThroughWaitlistCommit(input: {
  bookingCaseApplication: Phase4BookingCaseApplication;
  bookingCase: BookingCaseBundle;
  waitlistOffer: WaitlistOfferSnapshot;
  bookingCommit: Pick<
    BookingCommitApplicationResult,
    "transaction" | "appointmentRecord" | "confirmationTruthProjection"
  >;
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
      | "startSelection"
      | "startRevalidation"
      | "enterCommitPending"
      | "markBooked"
      | "markConfirmationPending"
      | "markSupplierReconciliationPending",
    reasonCode: string,
  ) {
    const transitionActionRecordRef = `${input.commandActionRecordRef}::${action}`;
    const transitionSettlementRecordRef = `${input.commandSettlementRecordRef}::${action}`;
    const command = buildTransitionInput(
      current,
      {
        actorRef: input.actorRef,
        commandActionRecordRef: transitionActionRecordRef,
        commandSettlementRecordRef: transitionSettlementRecordRef,
        recordedAt: input.occurredAt,
        routeIntentBindingRef: input.routeIntentBindingRef,
        reasonCode,
      },
      {
        selectedSlotRef: input.waitlistOffer.selectedNormalizedSlotRef,
        waitlistEntryRef: current.bookingCase.waitlistEntryRef,
        activeWaitlistFallbackObligationRef: current.bookingCase.activeWaitlistFallbackObligationRef,
        latestWaitlistContinuationTruthProjectionRef:
          current.bookingCase.latestWaitlistContinuationTruthProjectionRef,
        appointmentRef:
          input.bookingCommit.appointmentRecord?.appointmentRecordId ??
          current.bookingCase.appointmentRef,
        latestConfirmationTruthProjectionRef:
          input.bookingCommit.confirmationTruthProjection.bookingConfirmationTruthProjectionId,
      },
    );
    const result =
      action === "startSelection"
        ? await input.bookingCaseApplication.startSelection(command)
        : action === "startRevalidation"
          ? await input.bookingCaseApplication.startRevalidation(command)
          : action === "enterCommitPending"
            ? await input.bookingCaseApplication.enterCommitPending(command)
            : action === "markBooked"
              ? await input.bookingCaseApplication.markBooked(command)
              : action === "markConfirmationPending"
                ? await input.bookingCaseApplication.markConfirmationPending(command)
                : await input.bookingCaseApplication.markSupplierReconciliationPending(command);
    emittedEvents.push(...result.emittedEvents);
    current = {
      bookingIntent: result.bookingIntent,
      bookingCase: result.bookingCase,
      searchPolicy: result.searchPolicy,
      transitionJournal: result.transitionJournal,
    };
  }

  if (current.bookingCase.status === "waitlisted") {
    await applyTransition("startSelection", "waitlist_offer_accepted");
  }

  if (
    input.bookingCommit.transaction.authoritativeOutcomeState === "booked" ||
    input.bookingCommit.transaction.authoritativeOutcomeState === "confirmation_pending" ||
    input.bookingCommit.transaction.authoritativeOutcomeState === "reconciliation_required"
  ) {
    if (current.bookingCase.status === "selecting") {
      await applyTransition("startRevalidation", "waitlist_offer_revalidation_started");
    }
    if (current.bookingCase.status === "revalidating") {
      await applyTransition("enterCommitPending", "waitlist_offer_commit_pending");
    }
  }

  if (
    input.bookingCommit.transaction.authoritativeOutcomeState === "booked" &&
    current.bookingCase.status === "commit_pending"
  ) {
    await applyTransition("markBooked", "waitlist_offer_booked");
  }
  if (
    input.bookingCommit.transaction.authoritativeOutcomeState === "confirmation_pending" &&
    current.bookingCase.status === "commit_pending"
  ) {
    await applyTransition("markConfirmationPending", "waitlist_offer_confirmation_pending");
  }
  if (
    input.bookingCommit.transaction.authoritativeOutcomeState === "reconciliation_required" &&
    current.bookingCase.status === "commit_pending"
  ) {
    await applyTransition(
      "markSupplierReconciliationPending",
      "waitlist_offer_reconciliation_pending",
    );
  }

  return {
    bookingCase: current,
    emittedEvents,
  };
}

export const PHASE4_SMART_WAITLIST_SERVICE_NAME = "Phase4SmartWaitlistApplication";
export const PHASE4_SMART_WAITLIST_QUERY_SURFACES = [
  "GET /v1/bookings/cases/{bookingCaseId}/waitlist/current",
] as const;

export const phase4SmartWaitlistRoutes = [
  {
    routeId: "booking_case_waitlist_current",
    method: "GET",
    path: "/v1/bookings/cases/{bookingCaseId}/waitlist/current",
    contractFamily: "WaitlistBundleContract",
    purpose:
      "Resolve the current WaitlistEntry, WaitlistOffer, WaitlistDeadlineEvaluation, WaitlistFallbackObligation, and WaitlistContinuationTruthProjection for one booking case.",
    bodyRequired: false,
    idempotencyRequired: false,
  },
  {
    routeId: "booking_case_join_waitlist",
    method: "POST",
    path: "/internal/v1/bookings/cases/{bookingCaseId}:join-waitlist",
    contractFamily: "JoinWaitlistCommandContract",
    purpose:
      "Create or refresh one real WaitlistEntry, first deadline evaluation, first fallback obligation, and first continuation projection under the governing BookingCase.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "waitlist_entry_pause",
    method: "POST",
    path: "/internal/v1/bookings/waitlist/entries/{waitlistEntryId}:pause",
    contractFamily: "PauseWaitlistEntryCommandContract",
    purpose:
      "Pause one live WaitlistEntry without clearing its deadline or fallback lineage.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "waitlist_entry_close",
    method: "POST",
    path: "/internal/v1/bookings/waitlist/entries/{waitlistEntryId}:close",
    contractFamily: "CloseWaitlistEntryCommandContract",
    purpose:
      "Close one WaitlistEntry only after authoritative booking truth or governed fallback closure.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "booking_waitlist_process_released_capacity",
    method: "POST",
    path: "/internal/v1/bookings/waitlist:process-released-capacity",
    contractFamily: "ProcessReleasedCapacityCommandContract",
    purpose:
      "Micro-batch authoritative released capacity into indexed waitlist matching, ReservationAuthority issuance, and truthful offer creation.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "waitlist_offer_accept",
    method: "POST",
    path: "/internal/v1/bookings/waitlist/offers/{waitlistOfferId}:accept",
    contractFamily: "AcceptWaitlistOfferCommandContract",
    purpose:
      "Accept one live WaitlistOffer and re-enter the canonical booking commit pipeline on the same capacity unit.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "waitlist_offer_expire",
    method: "POST",
    path: "/internal/v1/bookings/waitlist/offers/{waitlistOfferId}:expire",
    contractFamily: "ExpireWaitlistOfferCommandContract",
    purpose:
      "Expire one WaitlistOffer, release or expire its reservation truth, and refresh fallback obligation lawfully.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "waitlist_offer_supersede",
    method: "POST",
    path: "/internal/v1/bookings/waitlist/offers/{waitlistOfferId}:supersede",
    contractFamily: "SupersedeWaitlistOfferCommandContract",
    purpose:
      "Supersede one WaitlistOffer while keeping fallback debt armed and replayable.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "waitlist_entry_refresh_fallback",
    method: "POST",
    path: "/internal/v1/bookings/waitlist/entries/{waitlistEntryId}:refresh-fallback",
    contractFamily: "RefreshWaitlistFallbackCommandContract",
    purpose:
      "Refresh one WaitlistDeadlineEvaluation, WaitlistFallbackObligation, and WaitlistContinuationTruthProjection before or after local offer activity.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
] as const;

export const phase4SmartWaitlistPersistenceTables = [
  "phase4_waitlist_entries",
  "phase4_waitlist_entry_eligibility_keys",
  "phase4_waitlist_deadline_evaluations",
  "phase4_waitlist_fallback_obligations",
  "phase4_waitlist_continuation_truth_projections",
  "phase4_waitlist_offers",
  "phase4_waitlist_allocation_batches",
  "phase4_waitlist_transition_journal",
  "phase4_booking_reservation_scopes",
  "capacity_reservations",
  "reservation_truth_projections",
] as const;

export const phase4SmartWaitlistMigrationPlanRefs = [
  "services/command-api/migrations/131_phase4_booking_case_kernel.sql",
  "services/command-api/migrations/135_phase4_booking_reservation_authority.sql",
  "services/command-api/migrations/136_phase4_booking_commit_pipeline.sql",
  "services/command-api/migrations/139_phase4_smart_waitlist_and_deadline_logic.sql",
] as const;

export interface JoinWaitlistInput {
  bookingCaseId: string;
  actorRef: string;
  subjectRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  occurredAt: string;
  routeIntentBindingRef: string;
  preferenceOverrides?: Partial<WaitlistEntrySnapshot["preferenceEnvelope"]> | null;
  deadlineAt?: string | null;
  expectedOfferServiceMinutes?: number | null;
  payloadArtifactRef?: string | null;
  edgeCorrelationId?: string | null;
}

export interface ProcessReleasedCapacityCommand {
  releasedCapacity: readonly ReleasedCapacityInput[];
  actorRef: string;
  subjectRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  processedAt: string;
  payloadArtifactRef?: string | null;
  edgeCorrelationId?: string | null;
}

export interface AcceptWaitlistOfferCommand {
  waitlistOfferId: string;
  actorRef: string;
  subjectRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  acceptedAt: string;
  idempotencyKey: string;
  dispatchOutcome: BeginCommitDispatchOutcomeInput;
  releaseRecoveryDispositionRef?: string | null;
  transitionEnvelopeRef?: string | null;
  reviewActionLeaseRef?: string | null;
  payloadArtifactRef?: string | null;
  edgeCorrelationId?: string | null;
}

export interface ExpireWaitlistOfferCommand {
  waitlistOfferId: string;
  actorRef: string;
  subjectRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  expiredAt: string;
  reasonCode: string;
  payloadArtifactRef?: string | null;
  edgeCorrelationId?: string | null;
}

export interface SupersedeWaitlistOfferCommand {
  waitlistOfferId: string;
  actorRef: string;
  subjectRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  supersededAt: string;
  supersededByRef: string;
  reasonCode: string;
  payloadArtifactRef?: string | null;
  edgeCorrelationId?: string | null;
}

export interface RefreshWaitlistFallbackCommand {
  waitlistEntryId: string;
  actorRef: string;
  subjectRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  evaluatedAt: string;
  noEligibleSupply?: boolean;
  staleCapacityTruth?: boolean;
  policyCutoff?: boolean;
  payloadArtifactRef?: string | null;
  edgeCorrelationId?: string | null;
}

export interface PauseWaitlistEntryCommand {
  waitlistEntryId: string;
  actorRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  pausedAt: string;
  reasonCode: string;
  payloadArtifactRef?: string | null;
  edgeCorrelationId?: string | null;
}

export interface CloseWaitlistEntryCommand {
  waitlistEntryId: string;
  actorRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  closedAt: string;
  reasonCode: string;
  payloadArtifactRef?: string | null;
  edgeCorrelationId?: string | null;
}

export interface WaitlistApplicationResult {
  bookingCase: BookingCaseBundle;
  waitlist: WaitlistBundle;
  emittedEvents: readonly FoundationEventEnvelope<object>[];
}

export interface WaitlistReleasedCapacityResult {
  bookingCases: readonly BookingCaseBundle[];
  allocationBatchRef: string;
  issuedOffers: readonly WaitlistBundle[];
  emittedEvents: readonly FoundationEventEnvelope<object>[];
}

export interface WaitlistOfferAcceptanceResult extends WaitlistApplicationResult {
  bookingCommit: BookingCommitApplicationResult;
  reservationTruth: BookingReservationTruthResult | null;
}

export interface QueryCurrentWaitlistInput {
  bookingCaseId: string;
}

export interface Phase4SmartWaitlistApplication {
  waitlistService: ReturnType<typeof createPhase4SmartWaitlistService>;
  queryCurrentWaitlist(input: QueryCurrentWaitlistInput): Promise<WaitlistApplicationResult | null>;
  joinWaitlist(input: JoinWaitlistInput): Promise<WaitlistApplicationResult>;
  pauseWaitlistEntry(input: PauseWaitlistEntryCommand): Promise<WaitlistApplicationResult>;
  closeWaitlistEntry(input: CloseWaitlistEntryCommand): Promise<WaitlistApplicationResult>;
  processReleasedCapacity(input: ProcessReleasedCapacityCommand): Promise<WaitlistReleasedCapacityResult>;
  acceptWaitlistOffer(input: AcceptWaitlistOfferCommand): Promise<WaitlistOfferAcceptanceResult>;
  expireWaitlistOffer(input: ExpireWaitlistOfferCommand): Promise<WaitlistApplicationResult>;
  supersedeWaitlistOffer(input: SupersedeWaitlistOfferCommand): Promise<WaitlistApplicationResult>;
  refreshFallbackObligation(input: RefreshWaitlistFallbackCommand): Promise<WaitlistApplicationResult>;
}

export function createPhase4SmartWaitlistApplication(input?: {
  bookingCaseApplication?: Phase4BookingCaseApplication;
  bookingCapabilityApplication?: Phase4BookingCapabilityApplication;
  bookingReservationApplication?: Phase4BookingReservationApplication;
  bookingCommitApplication?: Phase4BookingCommitApplication;
  idGenerator?: BackboneIdGenerator;
}) : Phase4SmartWaitlistApplication {
  const bookingCaseApplication =
    input?.bookingCaseApplication ?? createPhase4BookingCaseApplication();
  const bookingCapabilityApplication =
    input?.bookingCapabilityApplication ??
    createPhase4BookingCapabilityApplication({
      bookingCaseApplication,
    });
  const bookingReservationApplication =
    input?.bookingReservationApplication ??
    createPhase4BookingReservationApplication({
      bookingCaseApplication,
      bookingCapabilityApplication,
    });
  const bookingCommitApplication =
    input?.bookingCommitApplication ??
    createPhase4BookingCommitApplication({
      bookingCaseApplication,
      bookingCapabilityApplication,
      bookingReservationApplication,
    });
  const waitlistService = createPhase4SmartWaitlistService({
    repositories: createPhase4SmartWaitlistStore(),
    idGenerator:
      input?.idGenerator ?? createDeterministicBackboneIdGenerator("phase4-smart-waitlist-app"),
  });

  async function requireBookingCaseBundle(bookingCaseId: string): Promise<BookingCaseBundle> {
    const bookingCase = await bookingCaseApplication.queryBookingCase(requireRef(bookingCaseId, "bookingCaseId"));
    invariant(bookingCase, "BOOKING_CASE_NOT_FOUND", `BookingCase ${bookingCaseId} was not found.`);
    return bookingCase;
  }

  async function requireWaitlistEntry(waitlistEntryId: string): Promise<WaitlistEntrySnapshot> {
    const document = await waitlistService.repositories.getWaitlistEntry(waitlistEntryId);
    invariant(document, "WAITLIST_ENTRY_NOT_FOUND", `WaitlistEntry ${waitlistEntryId} was not found.`);
    return document.toSnapshot();
  }

  async function requireWaitlistOffer(waitlistOfferId: string): Promise<WaitlistOfferSnapshot> {
    const offer = await waitlistService.queryWaitlistOffer(waitlistOfferId);
    invariant(offer, "WAITLIST_OFFER_NOT_FOUND", `WaitlistOffer ${waitlistOfferId} was not found.`);
    return offer;
  }

  async function resolveCapabilityForEntry(entry: WaitlistEntrySnapshot) {
    const diagnostics = await bookingCapabilityApplication.queryCapabilityDiagnostics({
      resolutionId: entry.capabilityResolutionRef,
      bookingCaseId: entry.bookingCaseId,
      selectionAudience: selectionAudienceFromEntry(entry),
      requestedActionScope: "book_slot",
    });
    invariant(
      diagnostics !== null,
      "WAITLIST_CAPABILITY_NOT_FOUND",
      `Booking capability diagnostics for ${entry.bookingCaseId} were not found.`,
    );
    return diagnostics;
  }

  function fallbackTransferRefs(entryId: string) {
    return {
      callbackCaseRef: `callback_case_${entryId}`,
      callbackExpectationEnvelopeRef: `callback_expectation_${entryId}`,
      hubCoordinationCaseRef: `hub_coordination_${entryId}`,
    };
  }

  async function ensureTransferRefs(
    result: WaitlistEntryMutationResult,
    command: {
      commandActionRecordRef: string;
      commandSettlementRecordRef: string;
      occurredAt: string;
      payloadArtifactRef?: string | null;
      edgeCorrelationId?: string | null;
    },
  ): Promise<WaitlistEntryMutationResult> {
    const route = result.fallbackObligation.requiredFallbackRoute;
    if (route === "stay_local_waitlist" || route === "booking_failed") {
      return result;
    }
    if (
      (route === "callback" && result.fallbackObligation.callbackCaseRef) ||
      (route === "hub" && result.fallbackObligation.hubCoordinationCaseRef)
    ) {
      return result;
    }
    const refs = fallbackTransferRefs(result.entry.waitlistEntryId);
    return waitlistService.refreshFallbackObligation({
      waitlistEntryId: result.entry.waitlistEntryId,
      evaluatedAt: command.occurredAt,
      noEligibleSupply: result.fallbackObligation.triggerClass === "no_eligible_supply",
      staleCapacityTruth: result.fallbackObligation.triggerClass === "stale_capacity_truth",
      policyCutoff:
        result.fallbackObligation.triggerClass === "policy_cutoff" ||
        result.fallbackObligation.triggerClass === "no_safe_laxity",
      callbackCaseRef: refs.callbackCaseRef,
      callbackExpectationEnvelopeRef: refs.callbackExpectationEnvelopeRef,
      hubCoordinationCaseRef: refs.hubCoordinationCaseRef,
      commandActionRecordRef: command.commandActionRecordRef,
      commandSettlementRecordRef: command.commandSettlementRecordRef,
      payloadArtifactRef: optionalRef(command.payloadArtifactRef),
      edgeCorrelationId: optionalRef(command.edgeCorrelationId),
    });
  }

  async function syncBookingCaseFromWaitlist(input: {
    bookingCase: BookingCaseBundle;
    waitlist: WaitlistEntryMutationResult;
    actorRef: string;
    commandActionRecordRef: string;
    commandSettlementRecordRef: string;
    occurredAt: string;
    routeIntentBindingRef: string;
  }): Promise<{ bookingCase: BookingCaseBundle; waitlist: WaitlistEntryMutationResult; emittedEvents: readonly FoundationEventEnvelope<object>[] }> {
    let current = input.bookingCase;
    let waitlist = await ensureTransferRefs(input.waitlist, {
      commandActionRecordRef: input.commandActionRecordRef,
      commandSettlementRecordRef: input.commandSettlementRecordRef,
      occurredAt: input.occurredAt,
    });
    const emittedEvents: FoundationEventEnvelope<object>[] = [];
    const route = waitlist.fallbackObligation.requiredFallbackRoute;

    if (
      route === "stay_local_waitlist" &&
      waitlist.entry.activeState === "active" &&
      canRefreshBookingCaseToWaitlisted(current.bookingCase.status)
    ) {
      const result = await bookingCaseApplication.markWaitlisted(
        buildTransitionInput(
          current,
          {
            actorRef: input.actorRef,
            commandActionRecordRef: `${input.commandActionRecordRef}::markWaitlisted`,
            commandSettlementRecordRef: `${input.commandSettlementRecordRef}::markWaitlisted`,
            recordedAt: input.occurredAt,
            routeIntentBindingRef: input.routeIntentBindingRef,
            reasonCode: "waitlist_truth_refreshed",
          },
          {
            waitlistEntryRef: waitlist.entry.waitlistEntryId,
            activeWaitlistFallbackObligationRef:
              waitlist.fallbackObligation.waitlistFallbackObligationId,
            latestWaitlistContinuationTruthProjectionRef:
              waitlist.continuationTruth.waitlistContinuationTruthProjectionId,
          },
        ),
      );
      emittedEvents.push(...result.emittedEvents);
      current = {
        bookingIntent: result.bookingIntent,
        bookingCase: result.bookingCase,
        searchPolicy: result.searchPolicy,
        transitionJournal: result.transitionJournal,
      };
    }

    if (route === "callback" && current.bookingCase.status !== "callback_fallback") {
      const result = await bookingCaseApplication.markCallbackFallback(
        buildTransitionInput(
          current,
          {
            actorRef: input.actorRef,
            commandActionRecordRef: `${input.commandActionRecordRef}::markCallbackFallback`,
            commandSettlementRecordRef:
              `${input.commandSettlementRecordRef}::markCallbackFallback`,
            recordedAt: input.occurredAt,
            routeIntentBindingRef: input.routeIntentBindingRef,
            reasonCode: "waitlist_callback_fallback",
          },
          {
            waitlistEntryRef: waitlist.entry.waitlistEntryId,
            activeWaitlistFallbackObligationRef:
              waitlist.fallbackObligation.waitlistFallbackObligationId,
            latestWaitlistContinuationTruthProjectionRef:
              waitlist.continuationTruth.waitlistContinuationTruthProjectionId,
            callbackCaseRef: waitlist.fallbackObligation.callbackCaseRef,
          },
        ),
      );
      emittedEvents.push(...result.emittedEvents);
      current = {
        bookingIntent: result.bookingIntent,
        bookingCase: result.bookingCase,
        searchPolicy: result.searchPolicy,
        transitionJournal: result.transitionJournal,
      };
    }

    if (route === "hub" && current.bookingCase.status !== "fallback_to_hub") {
      const result = await bookingCaseApplication.markHubFallback(
        buildTransitionInput(
          current,
          {
            actorRef: input.actorRef,
            commandActionRecordRef: `${input.commandActionRecordRef}::markHubFallback`,
            commandSettlementRecordRef: `${input.commandSettlementRecordRef}::markHubFallback`,
            recordedAt: input.occurredAt,
            routeIntentBindingRef: input.routeIntentBindingRef,
            reasonCode: "waitlist_hub_fallback",
          },
          {
            waitlistEntryRef: waitlist.entry.waitlistEntryId,
            activeWaitlistFallbackObligationRef:
              waitlist.fallbackObligation.waitlistFallbackObligationId,
            latestWaitlistContinuationTruthProjectionRef:
              waitlist.continuationTruth.waitlistContinuationTruthProjectionId,
            hubCaseRef: waitlist.fallbackObligation.hubCoordinationCaseRef,
          },
        ),
      );
      emittedEvents.push(...result.emittedEvents);
      current = {
        bookingIntent: result.bookingIntent,
        bookingCase: result.bookingCase,
        searchPolicy: result.searchPolicy,
        transitionJournal: result.transitionJournal,
      };
    }

    if (route === "booking_failed" && current.bookingCase.status !== "booking_failed") {
      const result = await bookingCaseApplication.markBookingFailed(
        buildTransitionInput(
          current,
          {
            actorRef: input.actorRef,
            commandActionRecordRef: `${input.commandActionRecordRef}::markBookingFailed`,
            commandSettlementRecordRef:
              `${input.commandSettlementRecordRef}::markBookingFailed`,
            recordedAt: input.occurredAt,
            routeIntentBindingRef: input.routeIntentBindingRef,
            reasonCode: "waitlist_booking_failed",
          },
          {
            waitlistEntryRef: waitlist.entry.waitlistEntryId,
            activeWaitlistFallbackObligationRef:
              waitlist.fallbackObligation.waitlistFallbackObligationId,
            latestWaitlistContinuationTruthProjectionRef:
              waitlist.continuationTruth.waitlistContinuationTruthProjectionId,
          },
        ),
      );
      emittedEvents.push(...result.emittedEvents);
      current = {
        bookingIntent: result.bookingIntent,
        bookingCase: result.bookingCase,
        searchPolicy: result.searchPolicy,
        transitionJournal: result.transitionJournal,
      };
    }

    return {
      bookingCase: current,
      waitlist,
      emittedEvents,
    };
  }

  async function waitlistResultForBookingCase(
    bookingCaseId: string,
  ): Promise<WaitlistBundle> {
    const bundle = await waitlistService.queryCurrentWaitlist(bookingCaseId);
    invariant(bundle, "WAITLIST_BUNDLE_NOT_FOUND", `No current waitlist exists for ${bookingCaseId}.`);
    return bundle;
  }

  return {
    waitlistService,

    async queryCurrentWaitlist(input) {
      const bookingCase = await requireBookingCaseBundle(input.bookingCaseId);
      const waitlist = await waitlistService.queryCurrentWaitlist(input.bookingCaseId);
      if (!waitlist) {
        return null;
      }
      return {
        bookingCase,
        waitlist,
        emittedEvents: [],
      };
    },

    async joinWaitlist(command) {
      const bookingCase = await requireBookingCaseBundle(command.bookingCaseId);
      invariant(
        bookingCase.searchPolicy !== null,
        "SEARCH_POLICY_REQUIRED",
        "BookingCase must have a current SearchPolicy before joining waitlist.",
      );
      invariant(
        bookingCase.bookingCase.activeCapabilityResolutionRef !== null,
        "ACTIVE_CAPABILITY_REQUIRED",
        "BookingCase must have an active capability resolution before joining waitlist.",
      );
      const entryAudience =
        bookingCase.searchPolicy.selectionAudience === "staff_assist" ? "staff" : "patient";
      const diagnostics = await bookingCapabilityApplication.queryCapabilityDiagnostics({
        resolutionId: bookingCase.bookingCase.activeCapabilityResolutionRef,
        bookingCaseId: bookingCase.bookingCase.bookingCaseId,
        selectionAudience: selectionAudienceFromWaitlistAudience(entryAudience),
        requestedActionScope: "book_slot",
      });
      invariant(diagnostics, "WAITLIST_CAPABILITY_NOT_FOUND", "Current booking capability was not found.");
      const preferenceEnvelope = {
        modality: normalizeWaitlistModality(
          command.preferenceOverrides?.modality ?? bookingCase.searchPolicy.modality,
        ),
        siteRefs:
          command.preferenceOverrides?.siteRefs ?? bookingCase.searchPolicy.sitePreference,
        timeframeEarliest:
          command.preferenceOverrides?.timeframeEarliest ??
          bookingCase.searchPolicy.timeframeEarliest,
        timeframeLatest:
          command.preferenceOverrides?.timeframeLatest ??
          bookingCase.searchPolicy.timeframeLatest,
        timeZone:
          command.preferenceOverrides?.timeZone ??
          "Europe/London",
        maxTravelMinutes:
          command.preferenceOverrides?.maxTravelMinutes ?? bookingCase.searchPolicy.maxTravelTime,
        continuityPreference:
          command.preferenceOverrides?.continuityPreference ??
          bookingCase.bookingIntent.continuityPreference,
        offerMode:
          (command.preferenceOverrides?.offerMode as WaitlistOfferTruthMode | undefined) ??
          (diagnostics.providerAdapterBinding.reservationSemantics === "exclusive_hold"
            ? "exclusive_hold"
            : "truthful_nonexclusive"),
        responseWindowMinutes:
          command.preferenceOverrides?.responseWindowMinutes ?? 45,
        convenienceTags:
          command.preferenceOverrides?.convenienceTags ??
          [bookingCase.bookingIntent.patientPreferenceSummary],
      };
      const created = await waitlistService.createOrRefreshWaitlistEntry({
        bookingCaseId: bookingCase.bookingCase.bookingCaseId,
        patientRef: bookingCase.bookingCase.patientRef,
        requestRef: bookingCase.bookingCase.requestId,
        requestLineageRef: bookingCase.bookingCase.requestLineageRef,
        routeFamilyRef: `${entryAudience}_booking_waitlist`,
        selectionAudience: entryAudience,
        selectedAnchorRef: bookingCase.bookingCase.bookingCaseId,
        preferenceEnvelope,
        deadlineAt:
          optionalRef(command.deadlineAt) ?? bookingCase.searchPolicy.timeframeLatest,
        expectedOfferServiceMinutes: command.expectedOfferServiceMinutes ?? 90,
        capabilityResolutionRef: diagnostics.resolution.bookingCapabilityResolutionId,
        capabilityTupleHash: diagnostics.resolution.capabilityTupleHash,
        providerAdapterBindingRef:
          diagnostics.providerAdapterBinding.bookingProviderAdapterBindingId,
        providerAdapterBindingHash: diagnostics.providerAdapterBinding.bindingHash,
        authoritativeReadAndConfirmationPolicyRef:
          diagnostics.authoritativeReadAndConfirmationPolicy.authoritativeReadAndConfirmationPolicyId,
        reservationSemantics:
          diagnostics.providerAdapterBinding.reservationSemantics === "exclusive_hold"
            ? "exclusive_hold"
            : "truthful_nonexclusive",
        joinedAt: ensureIsoTimestamp(command.occurredAt, "occurredAt"),
        commandActionRecordRef: command.commandActionRecordRef,
        commandSettlementRecordRef: command.commandSettlementRecordRef,
        subjectRef: command.subjectRef,
        payloadArtifactRef: optionalRef(command.payloadArtifactRef),
        edgeCorrelationId: optionalRef(command.edgeCorrelationId),
      });
      const synced = await syncBookingCaseFromWaitlist({
        bookingCase,
        waitlist: created,
        actorRef: command.actorRef,
        commandActionRecordRef: command.commandActionRecordRef,
        commandSettlementRecordRef: command.commandSettlementRecordRef,
        occurredAt: command.occurredAt,
        routeIntentBindingRef: command.routeIntentBindingRef,
      });
      return {
        bookingCase: synced.bookingCase,
        waitlist: await waitlistResultForBookingCase(bookingCase.bookingCase.bookingCaseId),
        emittedEvents: [...created.emittedEvents, ...synced.emittedEvents],
      };
    },

    async pauseWaitlistEntry(command) {
      const entry = await requireWaitlistEntry(command.waitlistEntryId);
      const bookingCase = await requireBookingCaseBundle(entry.bookingCaseId);
      const result = await waitlistService.pauseWaitlistEntry({
        waitlistEntryId: command.waitlistEntryId,
        pausedAt: command.pausedAt,
        reasonCode: command.reasonCode,
        commandActionRecordRef: command.commandActionRecordRef,
        commandSettlementRecordRef: command.commandSettlementRecordRef,
        payloadArtifactRef: optionalRef(command.payloadArtifactRef),
        edgeCorrelationId: optionalRef(command.edgeCorrelationId),
      });
      return {
        bookingCase,
        waitlist: await waitlistResultForBookingCase(entry.bookingCaseId),
        emittedEvents: result.emittedEvents,
      };
    },

    async closeWaitlistEntry(command) {
      const entry = await requireWaitlistEntry(command.waitlistEntryId);
      const bookingCase = await requireBookingCaseBundle(entry.bookingCaseId);
      const result = await waitlistService.closeWaitlistEntry({
        waitlistEntryId: command.waitlistEntryId,
        closedAt: command.closedAt,
        reasonCode: command.reasonCode,
        commandActionRecordRef: command.commandActionRecordRef,
        commandSettlementRecordRef: command.commandSettlementRecordRef,
        payloadArtifactRef: optionalRef(command.payloadArtifactRef),
        edgeCorrelationId: optionalRef(command.edgeCorrelationId),
      });
      return {
        bookingCase,
        waitlist: await waitlistResultForBookingCase(entry.bookingCaseId),
        emittedEvents: result.emittedEvents,
      };
    },

    async processReleasedCapacity(command) {
      const processedAt = ensureIsoTimestamp(command.processedAt, "processedAt");
      const planned = await waitlistService.processReleasedCapacity({
        releasedCapacity: command.releasedCapacity,
        processedAt,
        commandActionRecordRef: command.commandActionRecordRef,
        commandSettlementRecordRef: command.commandSettlementRecordRef,
        subjectRef: command.subjectRef,
        payloadArtifactRef: optionalRef(command.payloadArtifactRef),
        edgeCorrelationId: optionalRef(command.edgeCorrelationId),
      });

      const issuedOffers: WaitlistBundle[] = [];
      const bookingCases = new Map<string, BookingCaseBundle>();
      const emittedEvents: FoundationEventEnvelope<object>[] = [...planned.emittedEvents];

      for (const plannedOffer of planned.plannedOffers) {
        const entry = await requireWaitlistEntry(plannedOffer.waitlistEntryRef);
        const diagnostics = await resolveCapabilityForEntry(entry);
        const waitlistContext = {
          bookingCaseId: entry.bookingCaseId,
          waitlistOfferId: plannedOffer.waitlistOfferId,
          supplierRef: plannedOffer.releasedCapacity.supplierRef,
          capacityUnitRef: plannedOffer.releasedCapacity.capacityUnitRef,
          scheduleOwnerRef: plannedOffer.releasedCapacity.scheduleOwnerRef,
          inventoryLineageRef: plannedOffer.releasedCapacity.inventoryLineageRef,
          slotStartAtEpoch: plannedOffer.releasedCapacity.slotStartAtEpoch,
          slotEndAtEpoch: plannedOffer.releasedCapacity.slotEndAtEpoch,
          locationRef: plannedOffer.releasedCapacity.locationRef,
          practitionerRef: plannedOffer.releasedCapacity.practitionerRef,
          serviceRef: plannedOffer.releasedCapacity.serviceRef,
          modality: plannedOffer.releasedCapacity.modality,
          selectedAnchorRef: entry.selectedAnchorRef,
          selectedNormalizedSlotRef: plannedOffer.releasedCapacity.selectedNormalizedSlotRef,
          selectedCanonicalSlotIdentityRef:
            plannedOffer.releasedCapacity.selectedCanonicalSlotIdentityRef,
          providerAdapterBindingRef: entry.providerAdapterBindingRef,
          providerAdapterBindingHash: entry.providerAdapterBindingHash,
          capabilityResolutionRef: entry.capabilityResolutionRef,
          capabilityTupleHash: entry.capabilityTupleHash,
          authoritativeReadAndConfirmationPolicyRef:
            entry.authoritativeReadAndConfirmationPolicyRef,
          reservationSemantics:
            diagnostics.providerAdapterBinding.reservationSemantics,
          sourceSlotSetSnapshotRef: optionalRef(plannedOffer.releasedCapacity.sourceSlotSetSnapshotRef),
          selectionToken: plannedOffer.selectionToken,
          selectionProofHash: plannedOffer.selectionProofHash,
        };
        const reservationTruth =
          diagnostics.providerAdapterBinding.reservationSemantics === "exclusive_hold"
            ? await bookingReservationApplication.acquireOrRefreshHold({
                scopeFamily: "waitlist_offer",
                scopeObjectRef: plannedOffer.waitlistOfferId,
                actorRef: command.actorRef,
                subjectRef: command.subjectRef,
                commandActionRecordRef: `${command.commandActionRecordRef}::${plannedOffer.waitlistOfferId}::hold`,
                commandSettlementRecordRef: `${command.commandSettlementRecordRef}::${plannedOffer.waitlistOfferId}::hold`,
                occurredAt: processedAt,
                payloadArtifactRef: optionalRef(command.payloadArtifactRef),
                edgeCorrelationId: optionalRef(command.edgeCorrelationId),
                waitlistContext,
                holdTtlSeconds: entry.responseWindowMinutes * 60,
              })
            : await bookingReservationApplication.createOrRefreshSoftSelection({
                scopeFamily: "waitlist_offer",
                scopeObjectRef: plannedOffer.waitlistOfferId,
                actorRef: command.actorRef,
                subjectRef: command.subjectRef,
                commandActionRecordRef: `${command.commandActionRecordRef}::${plannedOffer.waitlistOfferId}::soft-select`,
                commandSettlementRecordRef: `${command.commandSettlementRecordRef}::${plannedOffer.waitlistOfferId}::soft-select`,
                occurredAt: processedAt,
                payloadArtifactRef: optionalRef(command.payloadArtifactRef),
                edgeCorrelationId: optionalRef(command.edgeCorrelationId),
                waitlistContext,
                ttlSeconds: entry.responseWindowMinutes * 60,
              });
        emittedEvents.push(...reservationTruth.emittedEvents);
        const issued = await waitlistService.issuePlannedWaitlistOffer({
          plannedOffer,
          reservationRef: reservationTruth.reservation.reservationId,
          reservationTruthProjectionRef:
            reservationTruth.projection.reservationTruthProjectionId,
          holdState: reservationTruth.reservation.state,
          sentAt: processedAt,
          commandActionRecordRef: command.commandActionRecordRef,
          commandSettlementRecordRef: command.commandSettlementRecordRef,
          payloadArtifactRef: optionalRef(command.payloadArtifactRef),
          edgeCorrelationId: optionalRef(command.edgeCorrelationId),
        });
        const bookingCase = bookingCases.get(entry.bookingCaseId) ?? (await requireBookingCaseBundle(entry.bookingCaseId));
        const synced = await syncBookingCaseFromWaitlist({
          bookingCase,
          waitlist: issued,
          actorRef: command.actorRef,
          commandActionRecordRef: command.commandActionRecordRef,
          commandSettlementRecordRef: command.commandSettlementRecordRef,
          occurredAt: processedAt,
          routeIntentBindingRef:
            diagnostics.resolution.routeTuple.routeIntentBindingRef,
        });
        bookingCases.set(entry.bookingCaseId, synced.bookingCase);
        issuedOffers.push(await waitlistResultForBookingCase(entry.bookingCaseId));
        emittedEvents.push(...issued.emittedEvents, ...synced.emittedEvents);
      }

      return {
        bookingCases: [...bookingCases.values()],
        allocationBatchRef: planned.allocationBatch.waitlistAllocationBatchId,
        issuedOffers,
        emittedEvents,
      };
    },

    async acceptWaitlistOffer(command) {
      const waitlistOffer = await requireWaitlistOffer(command.waitlistOfferId);
      const entry = await requireWaitlistEntry(waitlistOffer.waitlistEntryRef);
      const diagnostics = await resolveCapabilityForEntry(entry);
      const bookingCase = await requireBookingCaseBundle(entry.bookingCaseId);
      const accepted = await waitlistService.acceptWaitlistOffer({
        waitlistOfferId: command.waitlistOfferId,
        acceptedAt: command.acceptedAt,
        commandActionRecordRef: command.commandActionRecordRef,
        commandSettlementRecordRef: command.commandSettlementRecordRef,
        payloadArtifactRef: optionalRef(command.payloadArtifactRef),
        edgeCorrelationId: optionalRef(command.edgeCorrelationId),
      });
      const commitPolicy = toCommitPolicy(diagnostics.authoritativeReadAndConfirmationPolicy);
      const reservationOutcome = classifyWaitlistReservationOutcome({
        dispatchOutcome: command.dispatchOutcome,
        policy: commitPolicy,
      });
      let reservationTruth = await bookingReservationApplication.queryReservationTruth({
        scopeFamily: "waitlist_offer",
        scopeObjectRef: command.waitlistOfferId,
        requestedAt: command.acceptedAt,
      });
      if (reservationTruth && reservationOutcome.outcome === "confirmed") {
        reservationTruth = await bookingReservationApplication.markConfirmed({
          scopeFamily: "waitlist_offer",
          scopeObjectRef: command.waitlistOfferId,
          actorRef: command.actorRef,
          subjectRef: command.subjectRef,
          commandActionRecordRef: command.commandActionRecordRef,
          commandSettlementRecordRef: command.commandSettlementRecordRef,
          occurredAt: command.acceptedAt,
          payloadArtifactRef: optionalRef(command.payloadArtifactRef),
          edgeCorrelationId: optionalRef(command.edgeCorrelationId),
          expectedReservationVersionRef: reservationTruth.scope.currentReservationVersionRef,
          fenceToken: reservationTruth.fence.fenceToken,
        });
      } else if (reservationTruth && reservationOutcome.outcome === "confirmation_pending") {
        reservationTruth = await bookingReservationApplication.markPendingConfirmation({
          scopeFamily: "waitlist_offer",
          scopeObjectRef: command.waitlistOfferId,
          actorRef: command.actorRef,
          subjectRef: command.subjectRef,
          commandActionRecordRef: command.commandActionRecordRef,
          commandSettlementRecordRef: command.commandSettlementRecordRef,
          occurredAt: command.acceptedAt,
          payloadArtifactRef: optionalRef(command.payloadArtifactRef),
          edgeCorrelationId: optionalRef(command.edgeCorrelationId),
          expectedReservationVersionRef: reservationTruth.scope.currentReservationVersionRef,
          fenceToken: reservationTruth.fence.fenceToken,
        });
      } else if (reservationTruth && reservationOutcome.outcome === "reconciliation_required") {
        reservationTruth = await bookingReservationApplication.markDisputed({
          scopeFamily: "waitlist_offer",
          scopeObjectRef: command.waitlistOfferId,
          actorRef: command.actorRef,
          subjectRef: command.subjectRef,
          commandActionRecordRef: command.commandActionRecordRef,
          commandSettlementRecordRef: command.commandSettlementRecordRef,
          occurredAt: command.acceptedAt,
          payloadArtifactRef: optionalRef(command.payloadArtifactRef),
          edgeCorrelationId: optionalRef(command.edgeCorrelationId),
          expectedReservationVersionRef: reservationTruth.scope.currentReservationVersionRef,
          fenceToken: reservationTruth.fence.fenceToken,
          terminalReasonCode: reservationOutcome.reasonCode ?? "reconciliation_required",
        });
      } else if (reservationTruth && reservationOutcome.outcome === "failed") {
        reservationTruth = await bookingReservationApplication.releaseReservation({
          scopeFamily: "waitlist_offer",
          scopeObjectRef: command.waitlistOfferId,
          actorRef: command.actorRef,
          subjectRef: command.subjectRef,
          commandActionRecordRef: command.commandActionRecordRef,
          commandSettlementRecordRef: command.commandSettlementRecordRef,
          occurredAt: command.acceptedAt,
          payloadArtifactRef: optionalRef(command.payloadArtifactRef),
          edgeCorrelationId: optionalRef(command.edgeCorrelationId),
          expectedReservationVersionRef: reservationTruth.scope.currentReservationVersionRef,
          fenceToken: reservationTruth.fence.fenceToken,
          terminalReasonCode: reservationOutcome.reasonCode ?? "booking_commit_failed",
        });
      } else if (reservationTruth && reservationOutcome.outcome === "expired") {
        reservationTruth = await bookingReservationApplication.expireReservation({
          scopeFamily: "waitlist_offer",
          scopeObjectRef: command.waitlistOfferId,
          actorRef: command.actorRef,
          subjectRef: command.subjectRef,
          commandActionRecordRef: command.commandActionRecordRef,
          commandSettlementRecordRef: command.commandSettlementRecordRef,
          occurredAt: command.acceptedAt,
          payloadArtifactRef: optionalRef(command.payloadArtifactRef),
          edgeCorrelationId: optionalRef(command.edgeCorrelationId),
          expectedReservationVersionRef: reservationTruth.scope.currentReservationVersionRef,
          fenceToken: reservationTruth.fence.fenceToken,
          terminalReasonCode: reservationOutcome.reasonCode ?? "confirmation_expired",
        });
      }
      const effectiveDispatchOutcome = buildEffectiveWaitlistDispatchOutcome({
        dispatchOutcome: command.dispatchOutcome,
        reservationOutcome,
      });
      const commitResult = await bookingCommitApplication.bookingCommitService.beginCommit({
        bookingTransactionId: `booking_transaction_waitlist_${command.waitlistOfferId}`,
        bookingCaseId: bookingCase.bookingCase.bookingCaseId,
        episodeRef: bookingCase.bookingCase.episodeRef,
        requestId: bookingCase.bookingCase.requestId,
        requestLineageRef: bookingCase.bookingCase.requestLineageRef,
        lineageCaseLinkRef: bookingCase.bookingCase.lineageCaseLinkRef,
        snapshotId: buildSyntheticWaitlistSnapshotRef(waitlistOffer),
        offerSessionRef: buildSyntheticWaitlistOfferSessionRef(waitlistOffer.waitlistOfferId),
        sourceDecisionEpochRef: bookingCase.bookingCase.sourceDecisionEpochRef,
        sourceDecisionSupersessionRef: bookingCase.bookingCase.sourceDecisionSupersessionRef,
        selectedSlotRef: waitlistOffer.selectedNormalizedSlotRef,
        canonicalReservationKey:
          reservationTruth?.scope.canonicalReservationKey ??
          `${waitlistOffer.selectedCanonicalSlotIdentityRef}::waitlist`,
        selectedCandidateHash: sha256({
          waitlistOfferId: waitlistOffer.waitlistOfferId,
          selectionProofHash: waitlistOffer.selectionProofHash,
        }),
        selectionProofHash: waitlistOffer.selectionProofHash,
        policyBundleHash:
          bookingCase.searchPolicy?.policyBundleHash ?? entry.capabilityTupleHash,
        capabilityResolutionRef: diagnostics.resolution.bookingCapabilityResolutionId,
        providerAdapterBindingRef:
          diagnostics.providerAdapterBinding.bookingProviderAdapterBindingId,
        providerAdapterBindingHash: diagnostics.providerAdapterBinding.bindingHash,
        adapterContractProfileRef:
          diagnostics.providerAdapterBinding.adapterContractProfileRef,
        capabilityTupleHash: diagnostics.resolution.capabilityTupleHash,
        authoritativeReadAndConfirmationPolicy: commitPolicy,
        reservationTruthProjectionRef:
          reservationTruth?.projection.reservationTruthProjectionId ?? null,
        idempotencyKey: command.idempotencyKey,
        preflightVersion: sha256({
          waitlistOfferId: waitlistOffer.waitlistOfferId,
          acceptedAt: command.acceptedAt,
        }),
        reservationVersion: reservationTruth?.reservation.reservationVersion ?? 1,
        reservationVersionRef:
          reservationTruth?.scope.currentReservationVersionRef ??
          `${waitlistOffer.waitlistOfferId}@v1`,
        requestLifecycleLeaseRef: bookingCase.bookingCase.requestLifecycleLeaseRef,
        requestOwnershipEpochRef: bookingCase.bookingCase.ownershipEpoch,
        reviewActionLeaseRef: optionalRef(command.reviewActionLeaseRef),
        fencingToken:
          reservationTruth?.fence.fenceToken ?? bookingCase.bookingIntent.fencingToken,
        dispatchEffectKeyRef: sha256({
          bookingCaseId: bookingCase.bookingCase.bookingCaseId,
          waitlistOfferId: waitlistOffer.waitlistOfferId,
          idempotencyKey: command.idempotencyKey,
        }),
        dispatchAttemptRef: `dispatch_attempt_waitlist_${command.waitlistOfferId}`,
        latestReceiptCheckpointRef: null,
        holdState: reservationTruth?.reservation.state ?? waitlistOffer.holdState,
        commandActionRecordRef: command.commandActionRecordRef,
        commandSettlementRecordRef: command.commandSettlementRecordRef,
        routeIntentBindingRef: diagnostics.resolution.routeTuple.routeIntentBindingRef,
        subjectRef: command.subjectRef,
        payloadArtifactRef:
          optionalRef(command.payloadArtifactRef) ??
          `artifact://booking/waitlist/${waitlistOffer.waitlistOfferId}/accept`,
        edgeCorrelationId:
          optionalRef(command.edgeCorrelationId) ??
          `${waitlistOffer.waitlistOfferId}::accept`,
        surfaceRouteContractRef: diagnostics.resolution.routeTuple.surfaceRouteContractRef,
        surfacePublicationRef: diagnostics.resolution.routeTuple.surfacePublicationRef,
        runtimePublicationBundleRef:
          diagnostics.resolution.routeTuple.runtimePublicationBundleRef,
        releaseRecoveryDispositionRef: optionalRef(command.releaseRecoveryDispositionRef),
        transitionEnvelopeRef: optionalRef(command.transitionEnvelopeRef),
        occurredAt: command.acceptedAt,
        preflightFailureReasonCodes: [],
        guardedRecheckFailureReasonCodes: [],
        safetyPreemptionReasonCode: null,
        compensationReasonCodes: [],
        dispatchOutcome: effectiveDispatchOutcome,
      });
      const advancedCase = await advanceCaseThroughWaitlistCommit({
        bookingCaseApplication,
        bookingCase,
        waitlistOffer,
        bookingCommit: commitResult,
        actorRef: command.actorRef,
        commandActionRecordRef: command.commandActionRecordRef,
        commandSettlementRecordRef: command.commandSettlementRecordRef,
        occurredAt: command.acceptedAt,
        routeIntentBindingRef: diagnostics.resolution.routeTuple.routeIntentBindingRef,
      });
      const bookingCommit: BookingCommitApplicationResult = {
        ...commitResult,
        bookingCase: advancedCase.bookingCase,
        reservationTruth,
        dispatchAttemptRef: commitResult.transaction.dispatchAttemptRef,
        receiptCheckpointRef: commitResult.transaction.latestReceiptCheckpointRef,
        replayDecisionClass: null,
        collisionReviewRef: null,
      };
      const settled = await waitlistService.settleWaitlistCommitOutcome({
        waitlistOfferId: waitlistOffer.waitlistOfferId,
        settledAt: command.acceptedAt,
        outcome: normalizeWaitlistCommitOutcome(commitResult.transaction.authoritativeOutcomeState),
        callbackCaseRef: fallbackTransferRefs(entry.waitlistEntryId).callbackCaseRef,
        callbackExpectationEnvelopeRef:
          fallbackTransferRefs(entry.waitlistEntryId).callbackExpectationEnvelopeRef,
        hubCoordinationCaseRef: fallbackTransferRefs(entry.waitlistEntryId).hubCoordinationCaseRef,
        commandActionRecordRef: command.commandActionRecordRef,
        commandSettlementRecordRef: command.commandSettlementRecordRef,
        payloadArtifactRef: optionalRef(command.payloadArtifactRef),
        edgeCorrelationId: optionalRef(command.edgeCorrelationId),
      });
      const synced = await syncBookingCaseFromWaitlist({
        bookingCase: advancedCase.bookingCase,
        waitlist: settled,
        actorRef: command.actorRef,
        commandActionRecordRef: command.commandActionRecordRef,
        commandSettlementRecordRef: command.commandSettlementRecordRef,
        occurredAt: command.acceptedAt,
        routeIntentBindingRef: diagnostics.resolution.routeTuple.routeIntentBindingRef,
      });
      return {
        bookingCase: synced.bookingCase,
        waitlist: await waitlistResultForBookingCase(entry.bookingCaseId),
        bookingCommit: {
          ...bookingCommit,
          bookingCase: synced.bookingCase,
        emittedEvents: [...bookingCommit.emittedEvents, ...advancedCase.emittedEvents, ...synced.emittedEvents],
      },
        reservationTruth,
        emittedEvents: [
          ...accepted.emittedEvents,
          ...(reservationTruth?.emittedEvents ?? []),
          ...bookingCommit.emittedEvents,
          ...advancedCase.emittedEvents,
          ...settled.emittedEvents,
          ...synced.emittedEvents,
        ],
      };
    },

    async expireWaitlistOffer(command) {
      const waitlistOffer = await requireWaitlistOffer(command.waitlistOfferId);
      const entry = await requireWaitlistEntry(waitlistOffer.waitlistEntryRef);
      const diagnostics = await resolveCapabilityForEntry(entry);
      const bookingCase = await requireBookingCaseBundle(entry.bookingCaseId);
      const reservationTruthBeforeExpire = await bookingReservationApplication.queryReservationTruth({
        scopeFamily: "waitlist_offer",
        scopeObjectRef: waitlistOffer.waitlistOfferId,
        requestedAt: command.expiredAt,
      });
      const reservationTruth = await bookingReservationApplication.expireReservation({
        scopeFamily: "waitlist_offer",
        scopeObjectRef: waitlistOffer.waitlistOfferId,
        actorRef: command.actorRef,
        subjectRef: command.subjectRef,
        commandActionRecordRef: `${command.commandActionRecordRef}::reservation-expire`,
        commandSettlementRecordRef: `${command.commandSettlementRecordRef}::reservation-expire`,
        occurredAt: command.expiredAt,
        terminalReasonCode: command.reasonCode,
        payloadArtifactRef: optionalRef(command.payloadArtifactRef),
        edgeCorrelationId: optionalRef(command.edgeCorrelationId),
        expectedReservationVersionRef:
          reservationTruthBeforeExpire?.scope.currentReservationVersionRef ?? undefined,
        fenceToken: reservationTruthBeforeExpire?.fence.fenceToken ?? undefined,
      });
      const expired = await waitlistService.expireWaitlistOffer({
        waitlistOfferId: command.waitlistOfferId,
        expiredAt: command.expiredAt,
        reasonCode: command.reasonCode,
        commandActionRecordRef: command.commandActionRecordRef,
        commandSettlementRecordRef: command.commandSettlementRecordRef,
        payloadArtifactRef: optionalRef(command.payloadArtifactRef),
        edgeCorrelationId: optionalRef(command.edgeCorrelationId),
      });
      const synced = await syncBookingCaseFromWaitlist({
        bookingCase,
        waitlist: expired,
        actorRef: command.actorRef,
        commandActionRecordRef: command.commandActionRecordRef,
        commandSettlementRecordRef: command.commandSettlementRecordRef,
        occurredAt: command.expiredAt,
        routeIntentBindingRef: diagnostics.resolution.routeTuple.routeIntentBindingRef,
      });
      return {
        bookingCase: synced.bookingCase,
        waitlist: await waitlistResultForBookingCase(entry.bookingCaseId),
        emittedEvents: [
          ...reservationTruth.emittedEvents,
          ...expired.emittedEvents,
          ...synced.emittedEvents,
        ],
      };
    },

    async supersedeWaitlistOffer(command) {
      const waitlistOffer = await requireWaitlistOffer(command.waitlistOfferId);
      const entry = await requireWaitlistEntry(waitlistOffer.waitlistEntryRef);
      const diagnostics = await resolveCapabilityForEntry(entry);
      const bookingCase = await requireBookingCaseBundle(entry.bookingCaseId);
      const reservationTruthBeforeRelease = await bookingReservationApplication.queryReservationTruth({
        scopeFamily: "waitlist_offer",
        scopeObjectRef: waitlistOffer.waitlistOfferId,
        requestedAt: command.supersededAt,
      });
      const reservationTruth = await bookingReservationApplication.releaseReservation({
        scopeFamily: "waitlist_offer",
        scopeObjectRef: waitlistOffer.waitlistOfferId,
        actorRef: command.actorRef,
        subjectRef: command.subjectRef,
        commandActionRecordRef: `${command.commandActionRecordRef}::reservation-release`,
        commandSettlementRecordRef: `${command.commandSettlementRecordRef}::reservation-release`,
        occurredAt: command.supersededAt,
        terminalReasonCode: command.reasonCode,
        payloadArtifactRef: optionalRef(command.payloadArtifactRef),
        edgeCorrelationId: optionalRef(command.edgeCorrelationId),
        expectedReservationVersionRef:
          reservationTruthBeforeRelease?.scope.currentReservationVersionRef ?? undefined,
        fenceToken: reservationTruthBeforeRelease?.fence.fenceToken ?? undefined,
      });
      const superseded = await waitlistService.supersedeWaitlistOffer({
        waitlistOfferId: command.waitlistOfferId,
        supersededAt: command.supersededAt,
        supersededByRef: command.supersededByRef,
        reasonCode: command.reasonCode,
        commandActionRecordRef: command.commandActionRecordRef,
        commandSettlementRecordRef: command.commandSettlementRecordRef,
        payloadArtifactRef: optionalRef(command.payloadArtifactRef),
        edgeCorrelationId: optionalRef(command.edgeCorrelationId),
      });
      const synced = await syncBookingCaseFromWaitlist({
        bookingCase,
        waitlist: superseded,
        actorRef: command.actorRef,
        commandActionRecordRef: command.commandActionRecordRef,
        commandSettlementRecordRef: command.commandSettlementRecordRef,
        occurredAt: command.supersededAt,
        routeIntentBindingRef: diagnostics.resolution.routeTuple.routeIntentBindingRef,
      });
      return {
        bookingCase: synced.bookingCase,
        waitlist: await waitlistResultForBookingCase(entry.bookingCaseId),
        emittedEvents: [
          ...reservationTruth.emittedEvents,
          ...superseded.emittedEvents,
          ...synced.emittedEvents,
        ],
      };
    },

    async refreshFallbackObligation(command) {
      const entry = await requireWaitlistEntry(command.waitlistEntryId);
      const diagnostics = await resolveCapabilityForEntry(entry);
      const bookingCase = await requireBookingCaseBundle(entry.bookingCaseId);
      const refreshed = await waitlistService.refreshFallbackObligation({
        waitlistEntryId: command.waitlistEntryId,
        evaluatedAt: command.evaluatedAt,
        noEligibleSupply: command.noEligibleSupply,
        staleCapacityTruth: command.staleCapacityTruth,
        policyCutoff: command.policyCutoff,
        commandActionRecordRef: command.commandActionRecordRef,
        commandSettlementRecordRef: command.commandSettlementRecordRef,
        payloadArtifactRef: optionalRef(command.payloadArtifactRef),
        edgeCorrelationId: optionalRef(command.edgeCorrelationId),
      });
      const synced = await syncBookingCaseFromWaitlist({
        bookingCase,
        waitlist: refreshed,
        actorRef: command.actorRef,
        commandActionRecordRef: command.commandActionRecordRef,
        commandSettlementRecordRef: command.commandSettlementRecordRef,
        occurredAt: command.evaluatedAt,
        routeIntentBindingRef: diagnostics.resolution.routeTuple.routeIntentBindingRef,
      });
      return {
        bookingCase: synced.bookingCase,
        waitlist: await waitlistResultForBookingCase(entry.bookingCaseId),
        emittedEvents: [...refreshed.emittedEvents, ...synced.emittedEvents],
      };
    },
  };
}
