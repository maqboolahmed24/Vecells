import { createHash } from "node:crypto";
import {
  createDeterministicBackboneIdGenerator,
  type BackboneIdGenerator,
} from "@vecells/domain-kernel";
import type {
  BookingActionScope,
  BookingBlockedReasonCode,
  BookingCapabilityDiagnosticsBundle,
  BookingCapabilityResolutionSnapshot,
  BookingCapabilityResolutionResult,
  BookingCaseBundle,
  Phase4AssistedBookingRepositories,
  Phase4AssistedBookingService,
  SearchPolicySnapshot,
  AssistedBookingSessionSnapshot,
  BookingExceptionFamily,
  BookingExceptionQueueEntrySnapshot,
  AssistedBookingSessionMode,
  AssistedBookingSessionState,
  BookingExceptionQueueSeverity,
  BookingExceptionQueueEntryState,
} from "@vecells/domain-booking";
import {
  createPhase4AssistedBookingService,
  createPhase4AssistedBookingStore,
} from "@vecells/domain-booking";
import {
  createWorkspaceProjectionStore,
  type AllowedLivePatchMode,
  type ProtectedCompositionMode,
  type WorkspaceContextProjectionBundle,
  type WorkspaceFocusProtectionLeaseState,
  type WorkspaceInvalidatingDriftState,
  type WorkspaceProjectionDependencies,
} from "@vecells/domain-identity-access";
import type {
  Phase3ReviewSessionSnapshot,
  Phase3TaskLaunchContextSnapshot,
  Phase3TriageTaskSnapshot,
  TaskCompletionSettlementEnvelopeSnapshot,
} from "@vecells/domain-triage-workspace";
import {
  createPhase3ReopenLaunchApplication,
  type Phase3ReopenLaunchApplication,
} from "./phase3-reopen-launch-leases";
import {
  createPhase3TaskCompletionContinuityApplication,
  type Phase3TaskCompletionContinuityApplication,
  type Phase3TaskCompletionContinuityApplicationBundle,
} from "./phase3-task-completion-continuity";
import {
  createPhase3TriageKernelApplication,
  type Phase3TriageKernelApplication,
} from "./phase3-triage-kernel";
import {
  createWorkspaceConsistencyProjectionApplication,
  type WorkspaceContextProjectionApplication,
} from "./workspace-consistency-projection";
import {
  createPhase4BookingCapabilityApplication,
  type Phase4BookingCapabilityApplication,
} from "./phase4-booking-capability";
import {
  createPhase4BookingCaseApplication,
  type Phase4BookingCaseApplication,
} from "./phase4-booking-case";
import {
  createPhase4SlotSearchApplication,
  type Phase4SlotSearchApplication,
  type StartSlotSearchInput,
} from "./phase4-slot-search";
import {
  createPhase4CapacityRankApplication,
  type Phase4CapacityRankApplication,
} from "./phase4-capacity-rank-offers";
import {
  createPhase4BookingReservationApplication,
  type BookingReservationTruthResult,
  type Phase4BookingReservationApplication,
} from "./phase4-booking-reservations";
import {
  createPhase4BookingCommitApplication,
  type BookingCommitApplicationResult,
  type BeginBookingCommitFromSelectedOfferInput,
  type Phase4BookingCommitApplication,
} from "./phase4-booking-commit";
import {
  createPhase4SmartWaitlistApplication,
  type Phase4SmartWaitlistApplication,
  type WaitlistApplicationResult,
} from "./phase4-smart-waitlist";
import {
  createPhase4BookingReminderApplication,
  type Phase4BookingReminderApplication,
} from "./phase4-booking-reminders";

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

function compareIso(left: string, right: string): number {
  return left.localeCompare(right);
}

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

function bookingCaseVersionRef(bundle: BookingCaseBundle): string {
  return [
    "booking_case_version",
    bundle.bookingCase.bookingCaseId,
    bundle.bookingCase.status,
    bundle.bookingCase.updatedAt,
    bundle.bookingCase.activeCapabilityResolutionRef ?? "none",
    bundle.bookingCase.currentOfferSessionRef ?? "none",
    bundle.bookingCase.selectedSlotRef ?? "none",
  ].join("::");
}

function defaultStaffSearchPolicy(bookingCase: BookingCaseBundle): SearchPolicySnapshot {
  const existing = bookingCase.searchPolicy;
  if (existing) {
    return {
      ...existing,
      policyId: `${existing.policyId}::staff_assist`,
      selectionAudience: "staff_assist",
      patientChannelMode: "staff_proxy",
      bookabilityPolicy: "include_staff_assistable",
      policyBundleHash: sha256({
        ...existing,
        selectionAudience: "staff_assist",
        patientChannelMode: "staff_proxy",
        bookabilityPolicy: "include_staff_assistable",
      }),
    };
  }
  return {
    policyId: `staff_search_policy_${bookingCase.bookingCase.bookingCaseId}`,
    timeframeEarliest: bookingCase.bookingIntent.createdAt,
    timeframeLatest: new Date(
      Date.parse(bookingCase.bookingIntent.createdAt) + 14 * 24 * 60 * 60 * 1000,
    ).toISOString(),
    modality: bookingCase.bookingIntent.modality,
    clinicianType: bookingCase.bookingIntent.clinicianType,
    continuityPreference: bookingCase.bookingIntent.continuityPreference,
    sitePreference: [],
    accessibilityNeeds: bookingCase.bookingIntent.accessNeeds
      ? [bookingCase.bookingIntent.accessNeeds]
      : [],
    maxTravelTime: 45,
    bookabilityPolicy: "include_staff_assistable",
    selectionAudience: "staff_assist",
    patientChannelMode: "staff_proxy",
    policyBundleHash: sha256({
      bookingCaseId: bookingCase.bookingCase.bookingCaseId,
      modality: bookingCase.bookingIntent.modality,
      clinicianType: bookingCase.bookingIntent.clinicianType,
      continuityPreference: bookingCase.bookingIntent.continuityPreference,
      selectionAudience: "staff_assist",
      patientChannelMode: "staff_proxy",
      bookabilityPolicy: "include_staff_assistable",
    }),
    sameBandReorderSlackMinutesByWindow: { standard: 20 },
  };
}

function supportedSearchStates(status: BookingCaseBundle["bookingCase"]["status"]): boolean {
  return (
    status === "handoff_received" ||
    status === "capability_checked" ||
    status === "searching_local" ||
    status === "offers_ready"
  );
}

function taskCompletionGate(
  bundle: Phase3TaskCompletionContinuityApplicationBundle | null,
): {
  mayCloseTask: boolean;
  mayLaunchNextTask: boolean;
  authoritativeSettlementState: string;
  nextTaskLaunchState: string;
  blockingReasonRefs: readonly string[];
} {
  const completion = bundle?.completionEnvelope;
  if (!completion) {
    return {
      mayCloseTask: false,
      mayLaunchNextTask: false,
      authoritativeSettlementState: "missing",
      nextTaskLaunchState: "blocked",
      blockingReasonRefs: ["TASK_COMPLETION_ENVELOPE_MISSING"],
    };
  }
  return {
    mayCloseTask: completion.authoritativeSettlementState !== "pending",
    mayLaunchNextTask:
      completion.authoritativeSettlementState !== "pending" &&
      completion.nextTaskLaunchState === "ready",
    authoritativeSettlementState: completion.authoritativeSettlementState,
    nextTaskLaunchState: completion.nextTaskLaunchState,
    blockingReasonRefs: completion.blockingReasonRefs,
  };
}

function deriveStaffConfirmationPosture(
  commit: BookingCommitApplicationResult | null,
): {
  staffVisibleState:
    | "pending"
    | "accepted"
    | "confirmation_pending"
    | "reconciliation_required"
    | "confirmed"
    | "failed";
  confirmationTruthState: string | null;
  transactionOutcomeState: string | null;
} {
  if (!commit) {
    return {
      staffVisibleState: "pending",
      confirmationTruthState: null,
      transactionOutcomeState: null,
    };
  }
  const truthState = commit.confirmationTruthProjection.confirmationTruthState;
  if (truthState === "confirmed") {
    return {
      staffVisibleState: "confirmed",
      confirmationTruthState: truthState,
      transactionOutcomeState: commit.transaction.authoritativeOutcomeState,
    };
  }
  if (
    truthState === "reconciliation_required" ||
    commit.transaction.authoritativeOutcomeState === "reconciliation_required"
  ) {
    return {
      staffVisibleState: "reconciliation_required",
      confirmationTruthState: truthState,
      transactionOutcomeState: commit.transaction.authoritativeOutcomeState,
    };
  }
  if (commit.transaction.authoritativeOutcomeState === "confirmation_pending") {
    return {
      staffVisibleState: "confirmation_pending",
      confirmationTruthState: truthState,
      transactionOutcomeState: commit.transaction.authoritativeOutcomeState,
    };
  }
  if (
    commit.transaction.processingAcceptanceState !== "not_started" ||
    commit.transaction.authoritativeOutcomeState === "booked"
  ) {
    return {
      staffVisibleState: "accepted",
      confirmationTruthState: truthState,
      transactionOutcomeState: commit.transaction.authoritativeOutcomeState,
    };
  }
  if (
    commit.transaction.authoritativeOutcomeState === "failed" ||
    truthState === "failed"
  ) {
    return {
      staffVisibleState: "failed",
      confirmationTruthState: truthState,
      transactionOutcomeState: commit.transaction.authoritativeOutcomeState,
    };
  }
  return {
    staffVisibleState: "pending",
    confirmationTruthState: truthState,
    transactionOutcomeState: commit.transaction.authoritativeOutcomeState,
  };
}

function severityForExceptionFamily(
  family: BookingExceptionFamily,
): BookingExceptionQueueSeverity {
  switch (family) {
    case "supplier_endpoint_unavailable":
    case "ambiguous_commit":
    case "stale_owner_or_publication_drift":
      return "critical";
    case "slot_revalidation_failure":
    case "patient_self_service_blocked":
    case "capability_mismatch":
      return "blocking";
    case "linkage_required_blocker":
    case "reminder_delivery_failure":
      return "warn";
  }
}

function familyFromBookingException(commit: BookingCommitApplicationResult): BookingExceptionFamily | null {
  const exception = commit.bookingException;
  if (!exception || exception.exceptionState !== "open") {
    return null;
  }
  switch (exception.exceptionClass) {
    case "dispatch_ambiguity":
    case "receipt_divergence":
    case "supplier_reconciliation_required":
    case "local_compensation_required":
      return "ambiguous_commit";
    case "authoritative_failure":
      return "supplier_endpoint_unavailable";
    case "preflight_failure":
      return exception.reasonCode.includes("slot_") || exception.reasonCode.includes("selected_slot")
        ? "slot_revalidation_failure"
        : "supplier_endpoint_unavailable";
  }
}

function isGpLinkageBlocked(
  capability: BookingCapabilityDiagnosticsBundle | null,
): boolean {
  return Boolean(
    capability?.resolution.capabilityState === "linkage_required" ||
      capability?.resolution.blockedActionReasonCodes.includes("reason_gp_linkage_required"),
  );
}

function isSelfServiceBlocked(
  capability: BookingCapabilityDiagnosticsBundle | null,
  bookingCase: BookingCaseBundle,
): boolean {
  return Boolean(
    bookingCase.searchPolicy?.selectionAudience === "patient_self_service" &&
      capability &&
      (capability.resolution.capabilityState === "live_staff_assist" ||
        capability.resolution.capabilityState === "assisted_only" ||
        capability.resolution.capabilityState === "local_component_required" ||
        capability.resolution.capabilityState === "linkage_required"),
  );
}

export const PHASE4_ASSISTED_BOOKING_SERVICE_NAME =
  "Phase4StaffAssistedBookingOperationsApplication";
export const PHASE4_ASSISTED_BOOKING_SCHEMA_VERSION =
  "291.phase4.staff-assisted-booking-operations.v1";
export const PHASE4_ASSISTED_BOOKING_QUERY_SURFACES = [
  "GET /v1/workspace/bookings/{bookingCaseId}/assisted-session/current",
  "GET /v1/workspace/bookings/exception-queue",
] as const;

export const phase4AssistedBookingRoutes = [
  {
    routeId: "workspace_booking_assisted_session_current",
    method: "GET",
    path: "/v1/workspace/bookings/{bookingCaseId}/assisted-session/current",
    contractFamily: "AssistedBookingWorkspaceBundleContract",
    purpose:
      "Resolve the current AssistedBookingSession, workspace fences, booking core state, confirmation truth, waitlist state, and queue posture for one booking case.",
    bodyRequired: false,
    idempotencyRequired: false,
  },
  {
    routeId: "workspace_booking_assisted_session_start",
    method: "POST",
    path: "/internal/v1/workspace/bookings/{bookingCaseId}:start-assisted-session",
    contractFamily: "StartAssistedBookingSessionCommandContract",
    purpose:
      "Open or refresh one AssistedBookingSession from the current BookingCase, review lease, workspace projections, and lawful staff capability tuple.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_booking_assisted_capability_refresh",
    method: "POST",
    path: "/internal/v1/workspace/bookings/{bookingCaseId}:refresh-assisted-capability",
    contractFamily: "RefreshAssistedBookingCapabilityCommandContract",
    purpose:
      "Resolve one current staff audience capability tuple on the same supplier and binding lineage before any assisted mutation can proceed.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_booking_assisted_slot_search_start",
    method: "POST",
    path: "/internal/v1/workspace/bookings/{bookingCaseId}:start-assisted-slot-search",
    contractFamily: "StartAssistedSlotSearchCommandContract",
    purpose:
      "Run the canonical slot-search and offer compilation pipeline for staff-assisted booking without creating a second booking engine.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_booking_assisted_slot_compare",
    method: "POST",
    path: "/internal/v1/workspace/bookings/{bookingCaseId}:compare-assisted-slots",
    contractFamily: "CompareAssistedBookingSlotsCommandContract",
    purpose:
      "Fetch compare-ready staff-assistable offer candidates while preserving focus protection and protected composition state.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_booking_assisted_slot_select",
    method: "POST",
    path: "/internal/v1/workspace/bookings/{bookingCaseId}:select-assisted-slot",
    contractFamily: "SelectAssistedBookingSlotCommandContract",
    purpose:
      "Select one offer candidate through the existing capacity-rank selection proof and move the BookingCase into canonical selecting posture.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_booking_assisted_slot_confirm",
    method: "POST",
    path: "/internal/v1/workspace/bookings/{bookingCaseId}:confirm-assisted-slot",
    contractFamily: "ConfirmAssistedBookingSlotCommandContract",
    purpose:
      "Commit one selected staff-assisted slot through the canonical reservation, revalidation, dispatch, and confirmation-truth pipeline.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_booking_assisted_waitlist_or_fallback",
    method: "POST",
    path: "/internal/v1/workspace/bookings/{bookingCaseId}:initiate-assisted-waitlist-or-fallback",
    contractFamily: "InitiateAssistedWaitlistOrFallbackCommandContract",
    purpose:
      "Move staff-assisted booking into waitlist, callback fallback, or hub fallback without bypassing booking-case continuation truth.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_booking_exception_queue_current",
    method: "GET",
    path: "/v1/workspace/bookings/exception-queue",
    contractFamily: "BookingExceptionQueueContract",
    purpose:
      "List the current BookingExceptionQueue projection for staff booking work with machine-readable reason and evidence refs only.",
    bodyRequired: false,
    idempotencyRequired: false,
  },
  {
    routeId: "workspace_booking_exception_queue_refresh",
    method: "POST",
    path: "/internal/v1/workspace/bookings/{bookingCaseId}:refresh-exception-queue",
    contractFamily: "RefreshBookingExceptionQueueCommandContract",
    purpose:
      "Recompute queue-visible booking exceptions from current capability, commit, reminder, stale-owner, and workspace-trust truth.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_booking_exception_queue_claim",
    method: "POST",
    path: "/internal/v1/workspace/bookings/exception-queue/{bookingExceptionQueueEntryId}:claim",
    contractFamily: "ClaimBookingExceptionQueueEntryCommandContract",
    purpose:
      "Claim one booking-exception queue entry without inventing local resolution truth.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_booking_exception_queue_reopen",
    method: "POST",
    path: "/internal/v1/workspace/bookings/exception-queue/{bookingExceptionQueueEntryId}:reopen",
    contractFamily: "ReopenBookingExceptionQueueEntryCommandContract",
    purpose:
      "Reopen one booking-exception queue entry when manual work or same-shell recovery must resume.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_booking_stale_owner_reacquire",
    method: "POST",
    path: "/internal/v1/workspace/bookings/{bookingCaseId}:reacquire-assisted-task",
    contractFamily: "ReacquireAssistedBookingTaskCommandContract",
    purpose:
      "Reacquire the live booking task lease after stale-owner recovery opened and refresh the AssistedBookingSession back onto the current ownership tuple.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
] as const;

export const phase4AssistedBookingPersistenceTables = [
  "phase4_assisted_booking_sessions",
  "phase4_booking_exception_queue_entries",
  "phase3_staff_workspace_consistency_projections",
  "phase3_workspace_slice_trust_projections",
  "phase3_protected_composition_states",
  "phase3_workspace_trust_envelopes",
  "phase3_task_completion_settlement_envelopes",
  "phase3_review_sessions",
  "phase3_triage_tasks",
] as const;

export const phase4AssistedBookingMigrationPlanRefs = [
  "services/command-api/migrations/118_phase3_task_completion_and_workspace_continuity.sql",
  "services/command-api/migrations/131_phase4_booking_case_kernel.sql",
  "services/command-api/migrations/132_phase4_booking_capability_engine.sql",
  "services/command-api/migrations/133_phase4_slot_search_snapshot_pipeline.sql",
  "services/command-api/migrations/136_phase4_booking_commit_pipeline.sql",
  "services/command-api/migrations/138_phase4_reminder_plan_and_notification_settlement.sql",
  "services/command-api/migrations/139_phase4_smart_waitlist_and_deadline_logic.sql",
  "services/command-api/migrations/140_phase4_staff_assisted_booking_and_exception_queue.sql",
] as const;

interface AssistedCapabilityHints {
  organisationRef?: string | null;
  supplierRef?: string | null;
  integrationMode?: string | null;
  deploymentType?: string | null;
  gpLinkageCheckpointRef?: string | null;
  gpLinkageStatus?: "linked" | "missing" | "not_required";
  localConsumerCheckpointRef?: string | null;
  localConsumerStatus?: "ready" | "missing" | "not_required";
  supplierDegradationStatus?: "nominal" | "degraded_manual";
  publicationState?: "published" | "frozen" | "withdrawn";
  assuranceTrustState?: "writable" | "read_only" | "blocked";
}

export interface AssistedWorkspaceGuardInput {
  taskId: string;
  workspaceRef: string;
  routeFamilyRef?: string | null;
  reviewActionLeaseRef?: string | null;
  staffWorkspaceConsistencyProjectionRef?: string | null;
  workspaceSliceTrustProjectionRef?: string | null;
  requestLifecycleLeaseRef?: string | null;
  requestOwnershipEpochRef?: number | null;
  surfaceRouteContractRef?: string | null;
  surfacePublicationRef?: string | null;
  runtimePublicationBundleRef?: string | null;
  focusProtectionLeaseRef?: string | null;
  focusProtectionLeaseState?: WorkspaceFocusProtectionLeaseState | null;
  protectedCompositionMode?: ProtectedCompositionMode | null;
  protectedCompositionStateRef?: string | null;
  compareAnchorRefs?: readonly string[];
  primaryReadingTargetRef?: string | null;
  quietReturnTargetRef?: string | null;
  allowedLivePatchMode?: AllowedLivePatchMode | null;
  invalidatingDriftState?: WorkspaceInvalidatingDriftState | null;
}

export interface StartAssistedBookingSessionInput
  extends AssistedCapabilityHints,
    AssistedWorkspaceGuardInput {
  bookingCaseId: string;
  staffUserRef: string;
  routeIntentBindingRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  startedAt: string;
  mode?: AssistedBookingSessionMode;
}

export interface RefreshAssistedCapabilityResolutionInput
  extends AssistedCapabilityHints,
    AssistedWorkspaceGuardInput {
  bookingCaseId: string;
  staffUserRef: string;
  routeIntentBindingRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  refreshedAt: string;
  requestedActionScope?: BookingActionScope;
}

export interface StartAssistedSlotSearchInput
  extends RefreshAssistedCapabilityResolutionInput {
  displayTimeZone: string;
  supplierWindows: StartSlotSearchInput["supplierWindows"];
  forceRefresh?: boolean;
  searchPolicy?: SearchPolicySnapshot | null;
  payloadArtifactRef?: string | null;
  edgeCorrelationId?: string | null;
}

export interface CompareAssistedSlotsInput extends AssistedWorkspaceGuardInput {
  bookingCaseId: string;
  requestedAt: string;
  candidateRefs: readonly string[];
}

export interface SelectAssistedSlotInput extends AssistedWorkspaceGuardInput {
  bookingCaseId: string;
  staffUserRef: string;
  offerSessionId?: string | null;
  offerCandidateId: string;
  selectionToken: string;
  selectionProofHash: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  occurredAt: string;
  payloadArtifactRef?: string | null;
  edgeCorrelationId?: string | null;
}

export interface ConfirmAssistedSlotInput extends AssistedWorkspaceGuardInput {
  bookingCaseId: string;
  staffUserRef: string;
  offerSessionId?: string | null;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  occurredAt: string;
  idempotencyKey: string;
  dispatchOutcome: BeginBookingCommitFromSelectedOfferInput["dispatchOutcome"];
  expectedSelectionProofHash?: string | null;
  payloadArtifactRef?: string | null;
  edgeCorrelationId?: string | null;
  releaseRecoveryDispositionRef?: string | null;
  transitionEnvelopeRef?: string | null;
}

export interface InitiateAssistedWaitlistOrFallbackInput
  extends AssistedWorkspaceGuardInput {
  bookingCaseId: string;
  staffUserRef: string;
  routeIntentBindingRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  occurredAt: string;
  mode: "waitlist" | "callback" | "hub";
  preferenceOverrides?: Record<string, unknown> | null;
  deadlineAt?: string | null;
  expectedOfferServiceMinutes?: number | null;
  callbackCaseRef?: string | null;
  hubCaseRef?: string | null;
  reasonCode?: string | null;
  payloadArtifactRef?: string | null;
  edgeCorrelationId?: string | null;
}

export interface RefreshBookingExceptionQueueInput {
  bookingCaseId: string;
  taskId?: string | null;
}

export interface QueryBookingExceptionQueueInput {
  bookingCaseId?: string | null;
  taskId?: string | null;
  entryStates?: readonly BookingExceptionQueueEntryState[];
}

export interface ClaimBookingExceptionQueueEntryInput {
  bookingExceptionQueueEntryId: string;
  staffUserRef: string;
  claimedAt: string;
}

export interface ReopenBookingExceptionQueueEntryInput {
  bookingExceptionQueueEntryId: string;
  reopenedAt: string;
  reasonCodes?: readonly string[];
}

export interface ReacquireAssistedBookingTaskInput {
  bookingCaseId: string;
  taskId: string;
  staffUserRef: string;
  reacquiredAt: string;
  ownerSessionRef?: string | null;
  leaseTtlSeconds?: number | null;
}

export interface AssistedBookingWorkspaceBundle {
  session: AssistedBookingSessionSnapshot | null;
  bookingCase: BookingCaseBundle;
  capability: BookingCapabilityDiagnosticsBundle | null;
  workspaceContext: WorkspaceContextProjectionBundle | null;
  taskCompletion: Phase3TaskCompletionContinuityApplicationBundle | null;
  currentReservationTruth: BookingReservationTruthResult | null;
  currentCommit: BookingCommitApplicationResult | null;
  currentWaitlist: WaitlistApplicationResult | null;
  currentReminderPlan: Awaited<
    ReturnType<Phase4BookingReminderApplication["queryCurrentReminderPlan"]>
  > | null;
  currentSlotSearch: Awaited<
    ReturnType<Phase4SlotSearchApplication["queryCurrentSlotSearch"]>
  > | null;
  currentOfferSession: Awaited<
    ReturnType<Phase4CapacityRankApplication["queryCurrentOfferSession"]>
  > | null;
  exceptionQueue: readonly BookingExceptionQueueEntrySnapshot[];
  taskCompletionGate: ReturnType<typeof taskCompletionGate>;
  staffConfirmationAuthority: ReturnType<typeof deriveStaffConfirmationPosture>;
}

export interface Phase4AssistedBookingApplication {
  readonly serviceName: typeof PHASE4_ASSISTED_BOOKING_SERVICE_NAME;
  readonly schemaVersion: typeof PHASE4_ASSISTED_BOOKING_SCHEMA_VERSION;
  readonly querySurfaces: typeof PHASE4_ASSISTED_BOOKING_QUERY_SURFACES;
  readonly routes: typeof phase4AssistedBookingRoutes;
  readonly bookingCaseApplication: Phase4BookingCaseApplication;
  readonly bookingCapabilityApplication: Phase4BookingCapabilityApplication;
  readonly slotSearchApplication: Phase4SlotSearchApplication;
  readonly capacityRankApplication: Phase4CapacityRankApplication;
  readonly bookingReservationApplication: Phase4BookingReservationApplication;
  readonly bookingCommitApplication: Phase4BookingCommitApplication;
  readonly waitlistApplication: Phase4SmartWaitlistApplication;
  readonly reminderApplication: Phase4BookingReminderApplication;
  readonly triageApplication: Phase3TriageKernelApplication;
  readonly workspaceContextApplication: WorkspaceContextProjectionApplication;
  readonly taskCompletionContinuityApplication: Phase3TaskCompletionContinuityApplication;
  readonly assistedBookingRepositories: Phase4AssistedBookingRepositories;
  readonly assistedBookingService: Phase4AssistedBookingService;
  readonly persistenceTables: typeof phase4AssistedBookingPersistenceTables;
  readonly migrationPlanRef: (typeof phase4AssistedBookingMigrationPlanRefs)[number];
  readonly migrationPlanRefs: typeof phase4AssistedBookingMigrationPlanRefs;
  queryCurrentAssistedBookingWorkspace(
    bookingCaseId: string,
  ): Promise<AssistedBookingWorkspaceBundle | null>;
  startAssistedBookingSession(
    input: StartAssistedBookingSessionInput,
  ): Promise<AssistedBookingWorkspaceBundle>;
  refreshAssistedCapabilityResolution(
    input: RefreshAssistedCapabilityResolutionInput,
  ): Promise<AssistedBookingWorkspaceBundle>;
  startAssistedSlotSearch(
    input: StartAssistedSlotSearchInput,
  ): Promise<AssistedBookingWorkspaceBundle>;
  compareAssistedSlots(input: CompareAssistedSlotsInput): Promise<AssistedBookingWorkspaceBundle>;
  selectAssistedSlot(input: SelectAssistedSlotInput): Promise<AssistedBookingWorkspaceBundle>;
  confirmAssistedSlot(input: ConfirmAssistedSlotInput): Promise<AssistedBookingWorkspaceBundle>;
  initiateAssistedWaitlistOrFallback(
    input: InitiateAssistedWaitlistOrFallbackInput,
  ): Promise<AssistedBookingWorkspaceBundle>;
  refreshBookingExceptionQueue(
    input: RefreshBookingExceptionQueueInput,
  ): Promise<readonly BookingExceptionQueueEntrySnapshot[]>;
  queryBookingExceptionQueue(
    input?: QueryBookingExceptionQueueInput,
  ): Promise<readonly BookingExceptionQueueEntrySnapshot[]>;
  claimBookingExceptionQueueEntry(
    input: ClaimBookingExceptionQueueEntryInput,
  ): Promise<BookingExceptionQueueEntrySnapshot>;
  reopenBookingExceptionQueueEntry(
    input: ReopenBookingExceptionQueueEntryInput,
  ): Promise<BookingExceptionQueueEntrySnapshot>;
  reacquireAssistedBookingTask(
    input: ReacquireAssistedBookingTaskInput,
  ): Promise<AssistedBookingWorkspaceBundle>;
}

class Phase4AssistedBookingApplicationImpl implements Phase4AssistedBookingApplication {
  readonly serviceName = PHASE4_ASSISTED_BOOKING_SERVICE_NAME;
  readonly schemaVersion = PHASE4_ASSISTED_BOOKING_SCHEMA_VERSION;
  readonly querySurfaces = PHASE4_ASSISTED_BOOKING_QUERY_SURFACES;
  readonly routes = phase4AssistedBookingRoutes;
  readonly bookingCaseApplication: Phase4BookingCaseApplication;
  readonly bookingCapabilityApplication: Phase4BookingCapabilityApplication;
  readonly slotSearchApplication: Phase4SlotSearchApplication;
  readonly capacityRankApplication: Phase4CapacityRankApplication;
  readonly bookingReservationApplication: Phase4BookingReservationApplication;
  readonly bookingCommitApplication: Phase4BookingCommitApplication;
  readonly waitlistApplication: Phase4SmartWaitlistApplication;
  readonly reminderApplication: Phase4BookingReminderApplication;
  readonly triageApplication: Phase3TriageKernelApplication;
  readonly workspaceContextApplication: WorkspaceContextProjectionApplication;
  readonly taskCompletionContinuityApplication: Phase3TaskCompletionContinuityApplication;
  readonly assistedBookingRepositories: Phase4AssistedBookingRepositories;
  readonly assistedBookingService: Phase4AssistedBookingService;
  readonly persistenceTables = phase4AssistedBookingPersistenceTables;
  readonly migrationPlanRef = phase4AssistedBookingMigrationPlanRefs.at(-1)!;
  readonly migrationPlanRefs = phase4AssistedBookingMigrationPlanRefs;

  private readonly workspaceRepositories: WorkspaceProjectionDependencies;

  constructor(options?: {
    bookingCaseApplication?: Phase4BookingCaseApplication;
    bookingCapabilityApplication?: Phase4BookingCapabilityApplication;
    slotSearchApplication?: Phase4SlotSearchApplication;
    capacityRankApplication?: Phase4CapacityRankApplication;
    bookingReservationApplication?: Phase4BookingReservationApplication;
    bookingCommitApplication?: Phase4BookingCommitApplication;
    waitlistApplication?: Phase4SmartWaitlistApplication;
    reminderApplication?: Phase4BookingReminderApplication;
    triageApplication?: Phase3TriageKernelApplication;
    workspaceContextApplication?: WorkspaceContextProjectionApplication;
    taskCompletionContinuityApplication?: Phase3TaskCompletionContinuityApplication;
    reopenLaunchApplication?: Phase3ReopenLaunchApplication;
    workspaceRepositories?: WorkspaceProjectionDependencies;
    repositories?: Phase4AssistedBookingRepositories;
    idGenerator?: BackboneIdGenerator;
  }) {
    const idGenerator =
      options?.idGenerator ??
      createDeterministicBackboneIdGenerator("command_api_phase4_assisted_booking");
    this.bookingCaseApplication =
      options?.bookingCaseApplication ?? createPhase4BookingCaseApplication();
    this.bookingCapabilityApplication =
      options?.bookingCapabilityApplication ??
      createPhase4BookingCapabilityApplication({
        bookingCaseApplication: this.bookingCaseApplication,
      });
    this.slotSearchApplication =
      options?.slotSearchApplication ??
      createPhase4SlotSearchApplication({
        bookingCaseApplication: this.bookingCaseApplication,
        bookingCapabilityApplication: this.bookingCapabilityApplication,
      });
    this.capacityRankApplication =
      options?.capacityRankApplication ??
      createPhase4CapacityRankApplication({
        bookingCaseApplication: this.bookingCaseApplication,
        bookingCapabilityApplication: this.bookingCapabilityApplication,
        slotSearchApplication: this.slotSearchApplication,
      });
    this.bookingReservationApplication =
      options?.bookingReservationApplication ??
      createPhase4BookingReservationApplication({
        bookingCaseApplication: this.bookingCaseApplication,
        bookingCapabilityApplication: this.bookingCapabilityApplication,
        slotSearchApplication: this.slotSearchApplication,
        capacityRankApplication: this.capacityRankApplication,
      });
    this.bookingCommitApplication =
      options?.bookingCommitApplication ??
      createPhase4BookingCommitApplication({
        bookingCaseApplication: this.bookingCaseApplication,
        bookingCapabilityApplication: this.bookingCapabilityApplication,
        slotSearchApplication: this.slotSearchApplication,
        capacityRankApplication: this.capacityRankApplication,
        bookingReservationApplication: this.bookingReservationApplication,
      });
    this.waitlistApplication =
      options?.waitlistApplication ??
      createPhase4SmartWaitlistApplication({
        bookingCaseApplication: this.bookingCaseApplication,
        bookingCapabilityApplication: this.bookingCapabilityApplication,
        bookingReservationApplication: this.bookingReservationApplication,
        bookingCommitApplication: this.bookingCommitApplication,
      });
    this.reminderApplication =
      options?.reminderApplication ??
      createPhase4BookingReminderApplication({
        bookingCommitApplication: this.bookingCommitApplication,
        slotSearchApplication: this.slotSearchApplication,
      });
    this.triageApplication =
      options?.triageApplication ??
      createPhase3TriageKernelApplication({
        idGenerator,
      });
    this.workspaceRepositories =
      options?.workspaceRepositories ?? createWorkspaceProjectionStore();
    this.workspaceContextApplication =
      options?.workspaceContextApplication ??
      createWorkspaceConsistencyProjectionApplication({
        triageApplication: this.triageApplication,
        workspaceRepositories: this.workspaceRepositories,
        idGenerator,
      });
    const reopenLaunchApplication =
      options?.reopenLaunchApplication ??
      createPhase3ReopenLaunchApplication({
        triageApplication: this.triageApplication,
        idGenerator,
      });
    this.taskCompletionContinuityApplication =
      options?.taskCompletionContinuityApplication ??
      createPhase3TaskCompletionContinuityApplication({
        reopenLaunchApplication,
        workspaceRepositories: this.workspaceRepositories,
        idGenerator,
      });
    this.assistedBookingRepositories =
      options?.repositories ?? createPhase4AssistedBookingStore();
    this.assistedBookingService = createPhase4AssistedBookingService({
      repositories: this.assistedBookingRepositories,
    });
  }

  async queryCurrentAssistedBookingWorkspace(
    bookingCaseId: string,
  ): Promise<AssistedBookingWorkspaceBundle | null> {
    const bookingCase = await this.bookingCaseApplication.queryBookingCase(
      requireRef(bookingCaseId, "bookingCaseId"),
    );
    if (!bookingCase) {
      return null;
    }
    return this.buildWorkspaceBundle(bookingCase);
  }

  async startAssistedBookingSession(
    input: StartAssistedBookingSessionInput,
  ): Promise<AssistedBookingWorkspaceBundle> {
    const capability = await this.resolveLawfulStaffCapability({
      ...input,
      refreshedAt: input.startedAt,
      requestedActionScope: "search_slots",
      recordedAt: input.startedAt,
    });
    const guard = await this.loadWorkspaceGuardOrFailClosed({
      bookingCaseId: input.bookingCaseId,
      guard: input,
      requireCurrentRefs: false,
      allowMissingFocus: true,
    });
    await this.assistedBookingService.createOrRefreshAssistedBookingSession({
      bookingCaseId: input.bookingCaseId,
      taskRef: guard.task.taskId,
      workspaceRef: requireRef(input.workspaceRef, "workspaceRef"),
      staffUserRef: requireRef(input.staffUserRef, "staffUserRef"),
      mode: input.mode ?? "summary",
      sessionState:
        capability.resolution.capabilityState === "live_staff_assist" ? "active" : "recovery_required",
      startedAt: input.startedAt,
      lastActivityAt: input.startedAt,
      currentSnapshotRef: null,
      capabilityResolutionRef: capability.resolution.bookingCapabilityResolutionId,
      capabilityProjectionRef: capability.projection.bookingCapabilityProjectionId,
      providerAdapterBindingRef: capability.providerAdapterBinding.bookingProviderAdapterBindingId,
      providerAdapterBindingHash: capability.providerAdapterBinding.bindingHash,
      adapterContractProfileRef: capability.adapterContractProfile.adapterContractProfileId,
      capabilityTupleHash: capability.resolution.capabilityTupleHash,
      staffWorkspaceConsistencyProjectionRef:
        guard.workspaceContext.staffWorkspaceConsistencyProjection.workspaceConsistencyProjectionId,
      workspaceSliceTrustProjectionRef:
        guard.workspaceContext.workspaceSliceTrustProjection.workspaceSliceTrustProjectionId,
      reviewActionLeaseRef: guard.reviewSession.reviewActionLeaseRef,
      focusProtectionLeaseRef: optionalRef(input.focusProtectionLeaseRef),
      workProtectionLeaseRef: optionalRef(input.focusProtectionLeaseRef),
      protectedCompositionStateRef:
        guard.workspaceContext.protectedCompositionState?.protectedCompositionStateId ?? null,
      surfaceRouteContractRef: guard.bookingCase.bookingCase.surfaceRouteContractRef,
      surfacePublicationRef: guard.bookingCase.bookingCase.surfacePublicationRef,
      runtimePublicationBundleRef: guard.bookingCase.bookingCase.runtimePublicationBundleRef,
      taskCompletionSettlementEnvelopeRef:
        guard.taskCompletion?.completionEnvelope?.taskCompletionSettlementEnvelopeId ??
        guard.task.taskCompletionSettlementEnvelopeRef,
      requestLifecycleLeaseRef: guard.bookingCase.bookingCase.requestLifecycleLeaseRef,
      requestOwnershipEpochRef: guard.bookingCase.bookingCase.ownershipEpoch,
      blockedReasonRefs:
        capability.resolution.capabilityState === "live_staff_assist" ? [] : capability.resolution.blockedActionReasonCodes,
    });
    await this.synchronizeExceptionQueue(input.bookingCaseId, {
      capability,
      guard,
    });
    const bundle = await this.buildWorkspaceBundle(guard.bookingCase, {
      guard,
    });
    return bundle;
  }

  async refreshAssistedCapabilityResolution(
    input: RefreshAssistedCapabilityResolutionInput,
  ): Promise<AssistedBookingWorkspaceBundle> {
    const capability = await this.resolveLawfulStaffCapability({
      ...input,
      requestedActionScope: input.requestedActionScope ?? "search_slots",
      recordedAt: input.refreshedAt,
    });
    const guard = await this.loadWorkspaceGuardOrFailClosed({
      bookingCaseId: input.bookingCaseId,
      guard: input,
      requireCurrentRefs: false,
      allowMissingFocus: true,
    });
    const currentSession =
      await this.assistedBookingService.queryCurrentAssistedBookingSession(input.bookingCaseId);
    await this.assistedBookingService.createOrRefreshAssistedBookingSession({
      assistedBookingSessionId: currentSession?.assistedBookingSessionId,
      bookingCaseId: input.bookingCaseId,
      taskRef: guard.task.taskId,
      workspaceRef: requireRef(input.workspaceRef, "workspaceRef"),
      staffUserRef: requireRef(input.staffUserRef, "staffUserRef"),
      mode: currentSession?.mode ?? "summary",
      sessionState:
        capability.resolution.capabilityState === "live_staff_assist" ? "active" : "recovery_required",
      startedAt: currentSession?.startedAt ?? input.refreshedAt,
      lastActivityAt: input.refreshedAt,
      currentSnapshotRef: currentSession?.currentSnapshotRef ?? null,
      currentOfferSessionRef: currentSession?.currentOfferSessionRef ?? null,
      currentReservationScopeRef: currentSession?.currentReservationScopeRef ?? null,
      selectedSlotRef: currentSession?.selectedSlotRef ?? null,
      compareAnchorRefs: currentSession?.compareAnchorRefs ?? [],
      capabilityResolutionRef: capability.resolution.bookingCapabilityResolutionId,
      capabilityProjectionRef: capability.projection.bookingCapabilityProjectionId,
      providerAdapterBindingRef: capability.providerAdapterBinding.bookingProviderAdapterBindingId,
      providerAdapterBindingHash: capability.providerAdapterBinding.bindingHash,
      adapterContractProfileRef: capability.adapterContractProfile.adapterContractProfileId,
      capabilityTupleHash: capability.resolution.capabilityTupleHash,
      staffWorkspaceConsistencyProjectionRef:
        guard.workspaceContext.staffWorkspaceConsistencyProjection.workspaceConsistencyProjectionId,
      workspaceSliceTrustProjectionRef:
        guard.workspaceContext.workspaceSliceTrustProjection.workspaceSliceTrustProjectionId,
      reviewActionLeaseRef: guard.reviewSession.reviewActionLeaseRef,
      focusProtectionLeaseRef:
        optionalRef(input.focusProtectionLeaseRef) ?? currentSession?.focusProtectionLeaseRef ?? null,
      workProtectionLeaseRef:
        optionalRef(input.focusProtectionLeaseRef) ?? currentSession?.workProtectionLeaseRef ?? null,
      protectedCompositionStateRef:
        guard.workspaceContext.protectedCompositionState?.protectedCompositionStateId ??
        currentSession?.protectedCompositionStateRef ??
        null,
      surfaceRouteContractRef: guard.bookingCase.bookingCase.surfaceRouteContractRef,
      surfacePublicationRef: guard.bookingCase.bookingCase.surfacePublicationRef,
      runtimePublicationBundleRef: guard.bookingCase.bookingCase.runtimePublicationBundleRef,
      taskCompletionSettlementEnvelopeRef:
        guard.taskCompletion?.completionEnvelope?.taskCompletionSettlementEnvelopeId ??
        guard.task.taskCompletionSettlementEnvelopeRef,
      requestLifecycleLeaseRef: guard.bookingCase.bookingCase.requestLifecycleLeaseRef,
      requestOwnershipEpochRef: guard.bookingCase.bookingCase.ownershipEpoch,
      currentConfirmationTruthProjectionRef:
        currentSession?.currentConfirmationTruthProjectionRef ?? null,
      currentWaitlistEntryRef: currentSession?.currentWaitlistEntryRef ?? null,
      currentFallbackObligationRef: currentSession?.currentFallbackObligationRef ?? null,
      staleOwnerRecoveryRef: guard.task.staleOwnerRecoveryRef ?? null,
      blockedReasonRefs:
        capability.resolution.capabilityState === "live_staff_assist"
          ? []
          : capability.resolution.blockedActionReasonCodes,
    });
    await this.synchronizeExceptionQueue(input.bookingCaseId, {
      capability,
      guard,
    });
    return this.buildWorkspaceBundle(guard.bookingCase, { guard });
  }

  async startAssistedSlotSearch(
    input: StartAssistedSlotSearchInput,
  ): Promise<AssistedBookingWorkspaceBundle> {
    const capability = await this.resolveLawfulStaffCapability({
      ...input,
      requestedActionScope: "search_slots",
      recordedAt: input.refreshedAt,
    });
    const guard = await this.loadWorkspaceGuardOrFailClosed({
      bookingCaseId: input.bookingCaseId,
      guard: input,
      requireCurrentRefs: false,
      allowMissingFocus: true,
    });
    invariant(
      supportedSearchStates(guard.bookingCase.bookingCase.status),
      "ASSISTED_SLOT_SEARCH_NOT_ALLOWED",
      "BookingCase is not in a staff-assisted searchable state.",
    );
    if (
      guard.bookingCase.searchPolicy &&
      guard.bookingCase.searchPolicy.selectionAudience !== "staff_assist" &&
      guard.bookingCase.bookingCase.status !== "handoff_received" &&
      guard.bookingCase.bookingCase.status !== "capability_checked"
    ) {
      await this.failClosedWithRecovery({
        bookingCaseId: input.bookingCaseId,
        taskId: guard.task.taskId,
        reviewActionLeaseRef: guard.reviewSession.reviewActionLeaseRef,
        reasonCode: "capability_search_policy_not_staff_assist",
        family: "capability_mismatch",
        severity: "blocking",
      });
    }

    if (guard.bookingCase.bookingCase.status === "handoff_received") {
      await this.bookingCaseApplication.markCapabilityChecked({
        bookingCaseId: input.bookingCaseId,
        actorRef: input.staffUserRef,
        routeIntentBindingRef: input.routeIntentBindingRef,
        commandActionRecordRef: `${input.commandActionRecordRef}_capability`,
        commandSettlementRecordRef: `${input.commandSettlementRecordRef}_capability`,
        recordedAt: input.refreshedAt,
        sourceDecisionEpochRef: guard.bookingCase.bookingCase.sourceDecisionEpochRef,
        sourceDecisionSupersessionRef: guard.bookingCase.bookingCase.sourceDecisionSupersessionRef,
        lineageCaseLinkRef: guard.bookingCase.bookingCase.lineageCaseLinkRef,
        requestLifecycleLeaseRef: guard.bookingCase.bookingCase.requestLifecycleLeaseRef,
        ownershipEpoch: guard.bookingCase.bookingCase.ownershipEpoch,
        fencingToken: guard.task.fencingToken,
        currentLineageFenceEpoch: guard.task.currentLineageFenceEpoch,
        reasonCode: "assisted_capability_checked",
        activeCapabilityResolutionRef: capability.resolution.bookingCapabilityResolutionId,
        activeCapabilityProjectionRef: capability.projection.bookingCapabilityProjectionId,
        activeProviderAdapterBindingRef:
          capability.providerAdapterBinding.bookingProviderAdapterBindingId,
        capabilityState: capability.resolution.capabilityState,
        surfaceRouteContractRef: guard.bookingCase.bookingCase.surfaceRouteContractRef,
        surfacePublicationRef: guard.bookingCase.bookingCase.surfacePublicationRef,
        runtimePublicationBundleRef: guard.bookingCase.bookingCase.runtimePublicationBundleRef,
      });
    }

    const refreshedCase =
      (await this.bookingCaseApplication.queryBookingCase(input.bookingCaseId)) ?? guard.bookingCase;
    if (refreshedCase.bookingCase.status === "capability_checked") {
      await this.bookingCaseApplication.beginLocalSearch({
        bookingCaseId: input.bookingCaseId,
        actorRef: input.staffUserRef,
        routeIntentBindingRef: input.routeIntentBindingRef,
        commandActionRecordRef: `${input.commandActionRecordRef}_search`,
        commandSettlementRecordRef: `${input.commandSettlementRecordRef}_search`,
        recordedAt: input.refreshedAt,
        sourceDecisionEpochRef: refreshedCase.bookingCase.sourceDecisionEpochRef,
        sourceDecisionSupersessionRef: refreshedCase.bookingCase.sourceDecisionSupersessionRef,
        lineageCaseLinkRef: refreshedCase.bookingCase.lineageCaseLinkRef,
        requestLifecycleLeaseRef: refreshedCase.bookingCase.requestLifecycleLeaseRef,
        ownershipEpoch: refreshedCase.bookingCase.ownershipEpoch,
        fencingToken: guard.task.fencingToken,
        currentLineageFenceEpoch: guard.task.currentLineageFenceEpoch,
        reasonCode: "assisted_begin_local_search",
        activeCapabilityResolutionRef: capability.resolution.bookingCapabilityResolutionId,
        activeCapabilityProjectionRef: capability.projection.bookingCapabilityProjectionId,
        activeProviderAdapterBindingRef:
          capability.providerAdapterBinding.bookingProviderAdapterBindingId,
        capabilityState: capability.resolution.capabilityState,
        searchPolicy: input.searchPolicy ?? defaultStaffSearchPolicy(refreshedCase),
        surfaceRouteContractRef: refreshedCase.bookingCase.surfaceRouteContractRef,
        surfacePublicationRef: refreshedCase.bookingCase.surfacePublicationRef,
        runtimePublicationBundleRef: refreshedCase.bookingCase.runtimePublicationBundleRef,
      });
    }

    const currentSearch = await this.slotSearchApplication.queryCurrentSlotSearch({
      bookingCaseId: input.bookingCaseId,
    });
    const searchResult =
      currentSearch && input.forceRefresh !== true
        ? await this.slotSearchApplication.refreshSlotSearch({
            bookingCaseId: input.bookingCaseId,
            displayTimeZone: input.displayTimeZone,
            supplierWindows: input.supplierWindows,
            commandActionRecordRef: input.commandActionRecordRef,
            commandSettlementRecordRef: input.commandSettlementRecordRef,
            subjectRef: input.staffUserRef,
            occurredAt: input.refreshedAt,
            payloadArtifactRef: input.payloadArtifactRef,
            edgeCorrelationId: input.edgeCorrelationId,
          })
        : await this.slotSearchApplication.startSlotSearch({
            bookingCaseId: input.bookingCaseId,
            displayTimeZone: input.displayTimeZone,
            supplierWindows: input.supplierWindows,
            commandActionRecordRef: input.commandActionRecordRef,
            commandSettlementRecordRef: input.commandSettlementRecordRef,
            subjectRef: input.staffUserRef,
            occurredAt: input.refreshedAt,
            payloadArtifactRef: input.payloadArtifactRef,
            edgeCorrelationId: input.edgeCorrelationId,
          });
    const offerResult = await this.capacityRankApplication.refreshOfferSessionFromCurrentSnapshot({
      bookingCaseId: input.bookingCaseId,
      actorRef: input.staffUserRef,
      subjectRef: input.staffUserRef,
      commandActionRecordRef: `${input.commandActionRecordRef}_offers`,
      commandSettlementRecordRef: `${input.commandSettlementRecordRef}_offers`,
      occurredAt: input.refreshedAt,
      payloadArtifactRef: input.payloadArtifactRef,
      edgeCorrelationId: input.edgeCorrelationId,
    });
    const session =
      await this.assistedBookingService.queryCurrentAssistedBookingSession(input.bookingCaseId);
    if (session) {
      await this.assistedBookingService.recordAssistedBookingSessionState({
        assistedBookingSessionId: session.assistedBookingSessionId,
        mode: "slot_compare",
        sessionState: "active",
        lastActivityAt: input.refreshedAt,
        currentSnapshotRef: searchResult.slotSetSnapshot.slotSetSnapshotId,
        currentOfferSessionRef: offerResult.offerSession.offerSessionId,
        blockedReasonRefs: [],
      });
    }
    await this.synchronizeExceptionQueue(input.bookingCaseId, {
      capability,
      guard,
    });
    const latestCase = await this.requireBookingCase(input.bookingCaseId);
    return this.buildWorkspaceBundle(latestCase);
  }

  async compareAssistedSlots(
    input: CompareAssistedSlotsInput,
  ): Promise<AssistedBookingWorkspaceBundle> {
    const guard = await this.loadWorkspaceGuardOrFailClosed({
      bookingCaseId: input.bookingCaseId,
      guard: input,
      requireCurrentRefs: true,
      requireFocusProtection:
        optionalRef(input.focusProtectionLeaseRef) !== null ||
        input.protectedCompositionMode === "compare_review",
    });
    const offerSession = await this.capacityRankApplication.queryCurrentOfferSession({
      bookingCaseId: input.bookingCaseId,
    });
    invariant(
      offerSession !== null,
      "ASSISTED_OFFER_SESSION_NOT_FOUND",
      "A current OfferSession is required before staff-assisted compare can run.",
    );
    await this.capacityRankApplication.fetchOfferSessionCompare({
      offerSessionId: offerSession.offerSession.offerSessionId,
      candidateRefs: input.candidateRefs,
      requestedAt: input.requestedAt,
    });
    const session =
      await this.assistedBookingService.queryCurrentAssistedBookingSession(input.bookingCaseId);
    if (session) {
      await this.assistedBookingService.recordAssistedBookingSessionState({
        assistedBookingSessionId: session.assistedBookingSessionId,
        mode: "slot_compare",
        sessionState:
          guard.workspaceContext.workspaceTrustEnvelope.mutationAuthorityState === "live"
            ? "active"
            : "stale_recoverable",
        lastActivityAt: input.requestedAt,
        compareAnchorRefs: input.compareAnchorRefs ?? input.candidateRefs,
        focusProtectionLeaseRef: optionalRef(input.focusProtectionLeaseRef),
        workProtectionLeaseRef: optionalRef(input.focusProtectionLeaseRef),
        protectedCompositionStateRef:
          guard.workspaceContext.protectedCompositionState?.protectedCompositionStateId ?? null,
      });
    }
    return this.buildWorkspaceBundle(guard.bookingCase, { guard });
  }

  async selectAssistedSlot(
    input: SelectAssistedSlotInput,
  ): Promise<AssistedBookingWorkspaceBundle> {
    const guard = await this.loadWorkspaceGuardOrFailClosed({
      bookingCaseId: input.bookingCaseId,
      guard: input,
      requireCurrentRefs: true,
      requireFocusProtection: optionalRef(input.focusProtectionLeaseRef) !== null,
    });
    const currentOffer =
      optionalRef(input.offerSessionId) ??
      (
        await this.capacityRankApplication.queryCurrentOfferSession({
          bookingCaseId: input.bookingCaseId,
        })
      )?.offerSession.offerSessionId;
    invariant(currentOffer, "ASSISTED_OFFER_SESSION_NOT_FOUND", "OfferSession is required.");
    const selected = await this.capacityRankApplication.selectOfferCandidate({
      offerSessionId: currentOffer,
      offerCandidateId: input.offerCandidateId,
      selectionToken: input.selectionToken,
      selectionProofHash: input.selectionProofHash,
      actorRef: input.staffUserRef,
      subjectRef: input.staffUserRef,
      commandActionRecordRef: input.commandActionRecordRef,
      commandSettlementRecordRef: input.commandSettlementRecordRef,
      occurredAt: input.occurredAt,
      payloadArtifactRef: input.payloadArtifactRef,
      edgeCorrelationId: input.edgeCorrelationId,
    });
    const session =
      await this.assistedBookingService.queryCurrentAssistedBookingSession(input.bookingCaseId);
    if (session) {
      await this.assistedBookingService.recordAssistedBookingSessionState({
        assistedBookingSessionId: session.assistedBookingSessionId,
        mode: "slot_confirm",
        sessionState: "active",
        lastActivityAt: input.occurredAt,
        selectedSlotRef: selected.offerSession.selectedNormalizedSlotRef,
        currentOfferSessionRef: selected.offerSession.offerSessionId,
        currentSnapshotRef: selected.offerSession.slotSetSnapshotRef,
        compareAnchorRefs: input.compareAnchorRefs ?? session.compareAnchorRefs,
      });
    }
    await this.synchronizeExceptionQueue(input.bookingCaseId, { guard });
    const latestCase = await this.requireBookingCase(input.bookingCaseId);
    return this.buildWorkspaceBundle(latestCase, { guard });
  }

  async confirmAssistedSlot(
    input: ConfirmAssistedSlotInput,
  ): Promise<AssistedBookingWorkspaceBundle> {
    const guard = await this.loadWorkspaceGuardOrFailClosed({
      bookingCaseId: input.bookingCaseId,
      guard: input,
      requireCurrentRefs: true,
      requireFocusProtection: optionalRef(input.focusProtectionLeaseRef) !== null,
    });
    const commit = await this.bookingCommitApplication.beginCommitFromSelectedOffer({
      bookingCaseId: input.bookingCaseId,
      offerSessionId: input.offerSessionId ?? null,
      actorRef: input.staffUserRef,
      subjectRef: input.staffUserRef,
      commandActionRecordRef: input.commandActionRecordRef,
      commandSettlementRecordRef: input.commandSettlementRecordRef,
      occurredAt: input.occurredAt,
      idempotencyKey: input.idempotencyKey,
      dispatchOutcome: input.dispatchOutcome,
      expectedSelectionProofHash: input.expectedSelectionProofHash ?? null,
      expectedRequestLifecycleLeaseRef: guard.bookingCase.bookingCase.requestLifecycleLeaseRef,
      expectedOwnershipEpochRef: guard.bookingCase.bookingCase.ownershipEpoch,
      expectedSourceDecisionEpochRef: guard.bookingCase.bookingCase.sourceDecisionEpochRef,
      expectedRuntimePublicationBundleRef:
        guard.bookingCase.bookingCase.runtimePublicationBundleRef,
      expectedSurfacePublicationRef: guard.bookingCase.bookingCase.surfacePublicationRef,
      reviewActionLeaseRef: guard.reviewSession.reviewActionLeaseRef,
      payloadArtifactRef: input.payloadArtifactRef,
      edgeCorrelationId: input.edgeCorrelationId,
      releaseRecoveryDispositionRef: input.releaseRecoveryDispositionRef ?? null,
      transitionEnvelopeRef: input.transitionEnvelopeRef ?? null,
    });
    const currentSession =
      await this.assistedBookingService.queryCurrentAssistedBookingSession(input.bookingCaseId);
    if (currentSession) {
      await this.assistedBookingService.recordAssistedBookingSessionState({
        assistedBookingSessionId: currentSession.assistedBookingSessionId,
        mode: "slot_confirm",
        sessionState:
          commit.confirmationTruthProjection.confirmationTruthState === "confirmed"
            ? "settled"
            : commit.confirmationTruthProjection.confirmationTruthState ===
                  "reconciliation_required" ||
                commit.transaction.authoritativeOutcomeState === "reconciliation_required"
              ? "recovery_required"
              : "active",
        lastActivityAt: input.occurredAt,
        currentSnapshotRef: commit.transaction.bookingTransactionId,
        currentConfirmationTruthProjectionRef:
          commit.confirmationTruthProjection.bookingConfirmationTruthProjectionId,
        selectedSlotRef: commit.transaction.selectedSlotRef,
      });
    }
    await this.synchronizeExceptionQueue(input.bookingCaseId, {
      guard,
      commit,
    });
    const latestCase = await this.requireBookingCase(input.bookingCaseId);
    return this.buildWorkspaceBundle(latestCase, { guard });
  }

  async initiateAssistedWaitlistOrFallback(
    input: InitiateAssistedWaitlistOrFallbackInput,
  ): Promise<AssistedBookingWorkspaceBundle> {
    const guard = await this.loadWorkspaceGuardOrFailClosed({
      bookingCaseId: input.bookingCaseId,
      guard: input,
      requireCurrentRefs: true,
      requireFocusProtection:
        optionalRef(input.focusProtectionLeaseRef) !== null &&
        input.protectedCompositionMode === "consequence_confirm",
    });
    if (input.mode === "waitlist") {
      await this.waitlistApplication.joinWaitlist({
        bookingCaseId: input.bookingCaseId,
        actorRef: input.staffUserRef,
        subjectRef: input.staffUserRef,
        commandActionRecordRef: input.commandActionRecordRef,
        commandSettlementRecordRef: input.commandSettlementRecordRef,
        occurredAt: input.occurredAt,
        routeIntentBindingRef: input.routeIntentBindingRef,
        preferenceOverrides: (input.preferenceOverrides ?? null) as never,
        deadlineAt: input.deadlineAt ?? null,
        expectedOfferServiceMinutes: input.expectedOfferServiceMinutes ?? null,
        payloadArtifactRef: input.payloadArtifactRef,
        edgeCorrelationId: input.edgeCorrelationId,
      });
    } else if (input.mode === "callback") {
      await this.bookingCaseApplication.markCallbackFallback({
        bookingCaseId: input.bookingCaseId,
        actorRef: input.staffUserRef,
        routeIntentBindingRef: input.routeIntentBindingRef,
        commandActionRecordRef: input.commandActionRecordRef,
        commandSettlementRecordRef: input.commandSettlementRecordRef,
        recordedAt: input.occurredAt,
        sourceDecisionEpochRef: guard.bookingCase.bookingCase.sourceDecisionEpochRef,
        sourceDecisionSupersessionRef: guard.bookingCase.bookingCase.sourceDecisionSupersessionRef,
        lineageCaseLinkRef: guard.bookingCase.bookingCase.lineageCaseLinkRef,
        requestLifecycleLeaseRef: guard.bookingCase.bookingCase.requestLifecycleLeaseRef,
        ownershipEpoch: guard.bookingCase.bookingCase.ownershipEpoch,
        fencingToken: guard.task.fencingToken,
        currentLineageFenceEpoch: guard.task.currentLineageFenceEpoch,
        reasonCode: requireRef(input.reasonCode ?? "assisted_callback_fallback", "reasonCode"),
        callbackCaseRef: requireRef(input.callbackCaseRef, "callbackCaseRef"),
        surfaceRouteContractRef: guard.bookingCase.bookingCase.surfaceRouteContractRef,
        surfacePublicationRef: guard.bookingCase.bookingCase.surfacePublicationRef,
        runtimePublicationBundleRef: guard.bookingCase.bookingCase.runtimePublicationBundleRef,
      });
    } else {
      await this.bookingCaseApplication.markHubFallback({
        bookingCaseId: input.bookingCaseId,
        actorRef: input.staffUserRef,
        routeIntentBindingRef: input.routeIntentBindingRef,
        commandActionRecordRef: input.commandActionRecordRef,
        commandSettlementRecordRef: input.commandSettlementRecordRef,
        recordedAt: input.occurredAt,
        sourceDecisionEpochRef: guard.bookingCase.bookingCase.sourceDecisionEpochRef,
        sourceDecisionSupersessionRef: guard.bookingCase.bookingCase.sourceDecisionSupersessionRef,
        lineageCaseLinkRef: guard.bookingCase.bookingCase.lineageCaseLinkRef,
        requestLifecycleLeaseRef: guard.bookingCase.bookingCase.requestLifecycleLeaseRef,
        ownershipEpoch: guard.bookingCase.bookingCase.ownershipEpoch,
        fencingToken: guard.task.fencingToken,
        currentLineageFenceEpoch: guard.task.currentLineageFenceEpoch,
        reasonCode: requireRef(input.reasonCode ?? "assisted_hub_fallback", "reasonCode"),
        hubCaseRef: requireRef(input.hubCaseRef, "hubCaseRef"),
        surfaceRouteContractRef: guard.bookingCase.bookingCase.surfaceRouteContractRef,
        surfacePublicationRef: guard.bookingCase.bookingCase.surfacePublicationRef,
        runtimePublicationBundleRef: guard.bookingCase.bookingCase.runtimePublicationBundleRef,
      });
    }
    const session =
      await this.assistedBookingService.queryCurrentAssistedBookingSession(input.bookingCaseId);
    if (session) {
      await this.assistedBookingService.recordAssistedBookingSessionState({
        assistedBookingSessionId: session.assistedBookingSessionId,
        mode: input.mode === "waitlist" ? "waitlist_review" : "fallback_review",
        sessionState: input.mode === "waitlist" ? "active" : "recovery_required",
        lastActivityAt: input.occurredAt,
      });
    }
    await this.synchronizeExceptionQueue(input.bookingCaseId, { guard });
    const latestCase = await this.requireBookingCase(input.bookingCaseId);
    return this.buildWorkspaceBundle(latestCase, { guard });
  }

  async refreshBookingExceptionQueue(
    input: RefreshBookingExceptionQueueInput,
  ): Promise<readonly BookingExceptionQueueEntrySnapshot[]> {
    await this.synchronizeExceptionQueue(requireRef(input.bookingCaseId, "bookingCaseId"), {});
    return this.queryBookingExceptionQueue({
      bookingCaseId: input.bookingCaseId,
      taskId: optionalRef(input.taskId) ?? undefined,
      entryStates: ["open", "claimed"],
    });
  }

  queryBookingExceptionQueue(
    input?: QueryBookingExceptionQueueInput,
  ): Promise<readonly BookingExceptionQueueEntrySnapshot[]> {
    return this.assistedBookingService.queryBookingExceptionQueue({
      bookingCaseRef: optionalRef(input?.bookingCaseId),
      taskRef: optionalRef(input?.taskId),
      entryStates: input?.entryStates,
    });
  }

  async claimBookingExceptionQueueEntry(
    input: ClaimBookingExceptionQueueEntryInput,
  ): Promise<BookingExceptionQueueEntrySnapshot> {
    const result = await this.assistedBookingService.claimBookingExceptionQueueEntry({
      bookingExceptionQueueEntryId: input.bookingExceptionQueueEntryId,
      claimedByRef: input.staffUserRef,
      claimedAt: input.claimedAt,
    });
    return result.entry;
  }

  async reopenBookingExceptionQueueEntry(
    input: ReopenBookingExceptionQueueEntryInput,
  ): Promise<BookingExceptionQueueEntrySnapshot> {
    const result = await this.assistedBookingService.reopenBookingExceptionQueueEntry(input);
    return result.entry;
  }

  async reacquireAssistedBookingTask(
    input: ReacquireAssistedBookingTaskInput,
  ): Promise<AssistedBookingWorkspaceBundle> {
    await this.triageApplication.reacquireTaskLease({
      taskId: input.taskId,
      actorRef: input.staffUserRef,
      reacquiredAt: input.reacquiredAt,
      ownerSessionRef: input.ownerSessionRef ?? null,
      leaseTtlSeconds: input.leaseTtlSeconds ?? undefined,
    });
    const bookingCase = await this.requireBookingCase(input.bookingCaseId);
    const guard = await this.loadWorkspaceGuardOrFailClosed({
      bookingCaseId: input.bookingCaseId,
      guard: {
        taskId: input.taskId,
        workspaceRef: `workspace_booking_${input.bookingCaseId}`,
        reviewActionLeaseRef:
          (
            await this.requireActiveReviewSession(await this.requireTask(input.taskId))
          ).reviewActionLeaseRef,
      },
      requireCurrentRefs: false,
      allowMissingFocus: true,
    });
    const session =
      await this.assistedBookingService.queryCurrentAssistedBookingSession(input.bookingCaseId);
    if (session) {
      await this.assistedBookingService.recordAssistedBookingSessionState({
        assistedBookingSessionId: session.assistedBookingSessionId,
        sessionState: "active",
        lastActivityAt: input.reacquiredAt,
        blockedReasonRefs: [],
        staleOwnerRecoveryRef: guard.task.staleOwnerRecoveryRef ?? null,
      });
    }
    await this.synchronizeExceptionQueue(input.bookingCaseId, { guard });
    return this.buildWorkspaceBundle(bookingCase, { guard });
  }

  private async requireBookingCase(bookingCaseId: string): Promise<BookingCaseBundle> {
    const bookingCase = await this.bookingCaseApplication.queryBookingCase(bookingCaseId);
    invariant(bookingCase, "BOOKING_CASE_NOT_FOUND", `BookingCase ${bookingCaseId} was not found.`);
    return bookingCase;
  }

  private async requireTask(taskId: string): Promise<Phase3TriageTaskSnapshot> {
    const task = await this.triageApplication.triageRepositories.getTask(taskId);
    invariant(task, "TRIAGE_TASK_NOT_FOUND", `TriageTask ${taskId} was not found.`);
    return task.toSnapshot() as Phase3TriageTaskSnapshot;
  }

  private async requireActiveReviewSession(
    task: Phase3TriageTaskSnapshot,
  ): Promise<Phase3ReviewSessionSnapshot> {
    invariant(
      task.activeReviewSessionRef,
      "REVIEW_SESSION_REQUIRED",
      `Task ${task.taskId} requires an active review session.`,
    );
    const session = await this.triageApplication.triageRepositories.getReviewSession(
      task.activeReviewSessionRef,
    );
    invariant(
      session,
      "REVIEW_SESSION_NOT_FOUND",
      `ReviewSession ${task.activeReviewSessionRef} was not found.`,
    );
    const snapshot = session.toSnapshot() as Phase3ReviewSessionSnapshot;
    invariant(
      snapshot.sessionState === "active",
      "REVIEW_SESSION_NOT_ACTIVE",
      `ReviewSession ${snapshot.reviewSessionId} must be active.`,
    );
    return snapshot;
  }

  private async requireLaunchContext(
    task: Phase3TriageTaskSnapshot,
  ): Promise<Phase3TaskLaunchContextSnapshot> {
    const launch = await this.triageApplication.triageRepositories.getLaunchContext(
      task.launchContextRef,
    );
    invariant(
      launch,
      "TASK_LAUNCH_CONTEXT_NOT_FOUND",
      `TaskLaunchContext ${task.launchContextRef} was not found.`,
    );
    return launch.toSnapshot() as Phase3TaskLaunchContextSnapshot;
  }

  private async safeQueryTaskCompletion(
    taskId: string,
  ): Promise<Phase3TaskCompletionContinuityApplicationBundle | null> {
    try {
      return await this.taskCompletionContinuityApplication.queryTaskCompletionContinuity(taskId);
    } catch {
      return null;
    }
  }

  private async queryCapabilityByResolution(
    resolutionId: string | null | undefined,
  ): Promise<BookingCapabilityDiagnosticsBundle | null> {
    if (!resolutionId) {
      return null;
    }
    return this.bookingCapabilityApplication.queryCapabilityDiagnostics({
      resolutionId,
    });
  }

  private async buildWorkspaceBundle(
    bookingCase: BookingCaseBundle,
    options?: {
      guard?: Awaited<ReturnType<Phase4AssistedBookingApplicationImpl["loadWorkspaceGuard"]>>;
    },
  ): Promise<AssistedBookingWorkspaceBundle> {
    const session =
      await this.assistedBookingService.queryCurrentAssistedBookingSession(
        bookingCase.bookingCase.bookingCaseId,
      );
    const capability =
      (session
        ? await this.queryCapabilityByResolution(session.capabilityResolutionRef)
        : null) ??
      (await this.queryCapabilityByResolution(bookingCase.bookingCase.activeCapabilityResolutionRef));
    const currentSlotSearch = bookingCase.searchPolicy
      ? await this.slotSearchApplication.queryCurrentSlotSearch({
          bookingCaseId: bookingCase.bookingCase.bookingCaseId,
        }).catch(() => null)
      : null;
    const currentOfferSession =
      await this.capacityRankApplication.queryCurrentOfferSession({
        bookingCaseId: bookingCase.bookingCase.bookingCaseId,
      }).catch(() => null);
    const currentReservationTruth = currentOfferSession
      ? await this.bookingReservationApplication.queryReservationTruth({
          scopeFamily: "offer_session",
          scopeObjectRef: currentOfferSession.offerSession.offerSessionId,
          requestedAt: new Date().toISOString(),
        }).catch(() => null)
      : null;
    const currentCommit = await this.bookingCommitApplication.queryCurrentBookingCommit({
      bookingCaseId: bookingCase.bookingCase.bookingCaseId,
    }).catch(() => null);
    const currentWaitlist = await this.waitlistApplication.queryCurrentWaitlist({
      bookingCaseId: bookingCase.bookingCase.bookingCaseId,
    }).catch(() => null);
    const currentReminderPlan = await this.reminderApplication.queryCurrentReminderPlan({
      bookingCaseId: bookingCase.bookingCase.bookingCaseId,
    }).catch(() => null);
    const taskId = session?.taskRef ?? options?.guard?.task.taskId ?? null;
    const taskCompletion = taskId ? await this.safeQueryTaskCompletion(taskId) : null;
    const workspaceContext = options?.guard?.workspaceContext ?? null;
    const exceptionQueue = await this.assistedBookingService.queryBookingExceptionQueue({
      bookingCaseRef: bookingCase.bookingCase.bookingCaseId,
      entryStates: ["open", "claimed"],
    });
    return {
      session,
      bookingCase,
      capability,
      workspaceContext,
      taskCompletion,
      currentReservationTruth,
      currentCommit,
      currentWaitlist,
      currentReminderPlan,
      currentSlotSearch,
      currentOfferSession,
      exceptionQueue,
      taskCompletionGate: taskCompletionGate(taskCompletion),
      staffConfirmationAuthority: deriveStaffConfirmationPosture(currentCommit),
    };
  }

  private deriveCapabilityHints(
    bookingCase: BookingCaseBundle,
    current: BookingCapabilityDiagnosticsBundle | null,
    input: AssistedCapabilityHints & {
      routeIntentBindingRef: string;
      requestedActionScope: BookingActionScope;
      recordedAt: string;
    },
  ) {
    const currentResolution = current?.resolution;
    const currentBinding = current?.providerAdapterBinding;
    return {
      bookingCaseId: bookingCase.bookingCase.bookingCaseId,
      tenantId: bookingCase.bookingCase.tenantId,
      practiceRef: bookingCase.bookingCase.providerContext.practiceRef,
      organisationRef:
        optionalRef(input.organisationRef) ??
        currentResolution?.organisationRef ??
        "org_booking_staff_assist",
      supplierRef:
        optionalRef(input.supplierRef) ??
        currentResolution?.supplierRef ??
        bookingCase.bookingCase.providerContext.supplierHintRef,
      integrationMode:
        optionalRef(input.integrationMode) ??
        currentResolution?.integrationMode ??
        "local_gateway_component",
      deploymentType:
        optionalRef(input.deploymentType) ??
        currentResolution?.deploymentType ??
        "practice_local_gateway",
      selectionAudience: "staff" as const,
      requestedActionScope: input.requestedActionScope,
      gpLinkageCheckpointRef:
        optionalRef(input.gpLinkageCheckpointRef) ??
        currentResolution?.gpLinkageCheckpointRef ??
        null,
      gpLinkageStatus:
        input.gpLinkageStatus ?? currentResolution?.prerequisiteState.gpLinkageStatus ?? "not_required",
      localConsumerCheckpointRef:
        optionalRef(input.localConsumerCheckpointRef) ??
        currentResolution?.localConsumerCheckpointRef ??
        null,
      localConsumerStatus:
        input.localConsumerStatus ??
        currentResolution?.prerequisiteState.localConsumerStatus ??
        "ready",
      supplierDegradationStatus:
        input.supplierDegradationStatus ??
        currentResolution?.prerequisiteState.supplierDegradationStatus ??
        "nominal",
      publicationState:
        input.publicationState ??
        currentResolution?.prerequisiteState.publicationState ??
        "published",
      assuranceTrustState:
        input.assuranceTrustState ??
        currentResolution?.prerequisiteState.assuranceTrustState ??
        "writable",
      routeIntentBindingRef: input.routeIntentBindingRef,
      surfaceRouteContractRef: bookingCase.bookingCase.surfaceRouteContractRef,
      surfacePublicationRef: bookingCase.bookingCase.surfacePublicationRef,
      runtimePublicationBundleRef: bookingCase.bookingCase.runtimePublicationBundleRef,
      governingObjectDescriptorRef: "BookingCase",
      governingObjectRef: bookingCase.bookingCase.bookingCaseId,
      governingObjectVersionRef: bookingCaseVersionRef(bookingCase),
      parentAnchorRef:
        bookingCase.bookingCase.currentOfferSessionRef ??
        bookingCase.bookingCase.bookingCaseId,
      commandActionRecordRef: `assisted_capability_action_${bookingCase.bookingCase.bookingCaseId}`,
      commandSettlementRecordRef: `assisted_capability_settlement_${bookingCase.bookingCase.bookingCaseId}`,
      subjectRef: "staff_assisted_booking",
      evaluatedAt: input.recordedAt,
      currentBinding,
      currentResolution,
    };
  }

  private async resolveLawfulStaffCapability(input: RefreshAssistedCapabilityResolutionInput & {
    requestedActionScope: BookingActionScope;
    recordedAt: string;
  }): Promise<BookingCapabilityResolutionResult> {
    const bookingCase = await this.requireBookingCase(input.bookingCaseId);
    const currentCapability = await this.queryCapabilityByResolution(
      bookingCase.bookingCase.activeCapabilityResolutionRef,
    );
    const hints = this.deriveCapabilityHints(bookingCase, currentCapability, input);
    invariant(
      hints.supplierRef,
      "BOOKING_SUPPLIER_REQUIRED",
      "A supplierRef is required for assisted capability resolution.",
    );
    const resolved = await this.bookingCapabilityApplication.resolveBookingCaseCapability({
      bookingCaseId: bookingCase.bookingCase.bookingCaseId,
      tenantId: hints.tenantId,
      practiceRef: hints.practiceRef,
      organisationRef: hints.organisationRef,
      supplierRef: hints.supplierRef,
      integrationMode: hints.integrationMode as never,
      deploymentType: hints.deploymentType,
      selectionAudience: "staff",
      requestedActionScope: hints.requestedActionScope,
      gpLinkageCheckpointRef: hints.gpLinkageCheckpointRef,
      gpLinkageStatus: hints.gpLinkageStatus,
      localConsumerCheckpointRef: hints.localConsumerCheckpointRef,
      localConsumerStatus: hints.localConsumerStatus,
      supplierDegradationStatus: hints.supplierDegradationStatus,
      publicationState: hints.publicationState,
      assuranceTrustState: hints.assuranceTrustState,
      routeIntentBindingRef: input.routeIntentBindingRef,
      surfaceRouteContractRef: bookingCase.bookingCase.surfaceRouteContractRef,
      surfacePublicationRef: bookingCase.bookingCase.surfacePublicationRef,
      runtimePublicationBundleRef: bookingCase.bookingCase.runtimePublicationBundleRef,
      governingObjectDescriptorRef: "BookingCase",
      governingObjectRef: bookingCase.bookingCase.bookingCaseId,
      governingObjectVersionRef: bookingCaseVersionRef(bookingCase),
      parentAnchorRef:
        bookingCase.bookingCase.currentOfferSessionRef ??
        bookingCase.bookingCase.bookingCaseId,
      commandActionRecordRef: input.commandActionRecordRef,
      commandSettlementRecordRef: input.commandSettlementRecordRef,
      subjectRef: input.staffUserRef,
      evaluatedAt: input.recordedAt,
    });

    if (currentCapability) {
      invariant(
        currentCapability.resolution.supplierRef === resolved.resolution.supplierRef,
        "ASSISTED_SUPPLIER_SWITCH_FORBIDDEN",
        "Staff assistance may not silently switch suppliers.",
      );
      if (
        currentCapability.providerAdapterBinding.bookingProviderAdapterBindingId !==
          resolved.providerAdapterBinding.bookingProviderAdapterBindingId ||
        currentCapability.providerAdapterBinding.bindingHash !==
          resolved.providerAdapterBinding.bindingHash
      ) {
        throw new Error(
          "ASSISTED_PROVIDER_BINDING_MISMATCH: Staff capability must stay on the same provider binding lineage.",
        );
      }
      if (
        currentCapability.resolution.capabilityState === "assisted_only" &&
        resolved.resolution.capabilityState !== "live_staff_assist"
      ) {
        throw new Error(
          "ASSISTED_CAPABILITY_NOT_LIVE: Assisted-only patient posture requires live staff-assisted capability.",
        );
      }
    }
    return resolved;
  }

  private async loadWorkspaceGuard(options: {
    bookingCaseId: string;
    guard: AssistedWorkspaceGuardInput;
    requireCurrentRefs: boolean;
    allowMissingFocus?: boolean;
    requireFocusProtection?: boolean;
  }): Promise<{
    bookingCase: BookingCaseBundle;
    task: Phase3TriageTaskSnapshot;
    reviewSession: Phase3ReviewSessionSnapshot;
    launchContext: Phase3TaskLaunchContextSnapshot;
    workspaceContext: WorkspaceContextProjectionBundle;
    taskCompletion: Phase3TaskCompletionContinuityApplicationBundle | null;
  }> {
    const bookingCase = await this.requireBookingCase(options.bookingCaseId);
    const task = await this.requireTask(requireRef(options.guard.taskId, "taskId"));
    invariant(
      task.requestId === bookingCase.bookingCase.requestId,
      "ASSISTED_TASK_CASE_REQUEST_MISMATCH",
      "BookingCase and workspace task must stay on the same request.",
    );
    const reviewSession = await this.requireActiveReviewSession(task);
    const launchContext = await this.requireLaunchContext(task);
    const taskCompletion = await this.safeQueryTaskCompletion(task.taskId);
    const workspaceContext = await this.workspaceContextApplication.queryWorkspaceTaskContext({
      taskId: task.taskId,
      workspaceRef: requireRef(options.guard.workspaceRef, "workspaceRef"),
      currentRouteFamilyRef: optionalRef(options.guard.routeFamilyRef) ?? "workspace_bookings",
      currentSurfaceRouteContractRef:
        optionalRef(options.guard.surfaceRouteContractRef) ??
        bookingCase.bookingCase.surfaceRouteContractRef,
      currentSurfacePublicationRef:
        optionalRef(options.guard.surfacePublicationRef) ??
        bookingCase.bookingCase.surfacePublicationRef,
      currentRuntimePublicationBundleRef:
        optionalRef(options.guard.runtimePublicationBundleRef) ??
        bookingCase.bookingCase.runtimePublicationBundleRef,
      reviewActionLeaseState: "live",
      requestLifecycleLeaseState: "live",
      presentedOwnershipEpoch:
        options.guard.requestOwnershipEpochRef ?? bookingCase.bookingCase.ownershipEpoch,
      presentedFencingToken: task.fencingToken,
      presentedLineageFenceEpoch: task.currentLineageFenceEpoch,
      continuitySelectedAnchorTupleHashRef: reviewSession.selectedAnchorTupleHashRef,
      continuitySourceQueueRankSnapshotRef: launchContext.sourceQueueRankSnapshotRef,
      focusProtectionLeaseRef: optionalRef(options.guard.focusProtectionLeaseRef),
      focusProtectionLeaseState:
        options.guard.focusProtectionLeaseState ??
        (options.guard.focusProtectionLeaseRef ? "active" : null),
      compositionMode: options.guard.protectedCompositionMode ?? null,
      draftArtifactRefs: [],
      compareAnchorRefs: options.guard.compareAnchorRefs ?? [],
      primaryReadingTargetRef:
        optionalRef(options.guard.primaryReadingTargetRef) ??
        `booking_case_reading_${bookingCase.bookingCase.bookingCaseId}`,
      quietReturnTargetRef:
        optionalRef(options.guard.quietReturnTargetRef) ??
        `/workspace/bookings/${bookingCase.bookingCase.bookingCaseId}`,
      allowedLivePatchMode: options.guard.allowedLivePatchMode ?? "blocking_only",
      invalidatingDriftState: options.guard.invalidatingDriftState ?? null,
      releaseGateRef:
        options.guard.protectedCompositionMode && options.guard.focusProtectionLeaseRef
          ? deterministicId("assisted_booking_release_gate", {
              bookingCaseId: bookingCase.bookingCase.bookingCaseId,
              mode: options.guard.protectedCompositionMode,
            })
          : null,
      compositionStartedAt:
        options.guard.protectedCompositionMode && options.guard.focusProtectionLeaseRef
          ? new Date().toISOString()
          : null,
    });
    if (options.requireCurrentRefs) {
      if (options.guard.reviewActionLeaseRef) {
        invariant(
          reviewSession.reviewActionLeaseRef === options.guard.reviewActionLeaseRef,
          "ASSISTED_REVIEW_ACTION_LEASE_MISMATCH",
          "Assisted booking mutation requires the current ReviewActionLease.",
        );
      }
      if (options.guard.requestLifecycleLeaseRef) {
        invariant(
          bookingCase.bookingCase.requestLifecycleLeaseRef ===
            options.guard.requestLifecycleLeaseRef,
          "ASSISTED_REQUEST_LIFECYCLE_LEASE_MISMATCH",
          "Assisted booking mutation requires the current BookingCase request lifecycle lease.",
        );
      }
      if (options.guard.requestOwnershipEpochRef !== undefined && options.guard.requestOwnershipEpochRef !== null) {
        invariant(
          bookingCase.bookingCase.ownershipEpoch === options.guard.requestOwnershipEpochRef,
          "ASSISTED_REQUEST_OWNERSHIP_EPOCH_MISMATCH",
          "Assisted booking mutation requires the current BookingCase ownership epoch.",
        );
      }
      if (options.guard.staffWorkspaceConsistencyProjectionRef) {
        invariant(
          workspaceContext.staffWorkspaceConsistencyProjection.workspaceConsistencyProjectionId ===
            options.guard.staffWorkspaceConsistencyProjectionRef,
          "ASSISTED_WORKSPACE_CONSISTENCY_MISMATCH",
          "Assisted booking mutation requires the current StaffWorkspaceConsistencyProjection.",
        );
      }
      if (options.guard.workspaceSliceTrustProjectionRef) {
        invariant(
          workspaceContext.workspaceSliceTrustProjection.workspaceSliceTrustProjectionId ===
            options.guard.workspaceSliceTrustProjectionRef,
          "ASSISTED_WORKSPACE_TRUST_MISMATCH",
          "Assisted booking mutation requires the current WorkspaceSliceTrustProjection.",
        );
      }
      if (options.guard.surfacePublicationRef) {
        invariant(
          bookingCase.bookingCase.surfacePublicationRef === options.guard.surfacePublicationRef,
          "ASSISTED_SURFACE_PUBLICATION_DRIFT",
          "Assisted booking mutation requires the current surface publication tuple.",
        );
      }
      if (options.guard.runtimePublicationBundleRef) {
        invariant(
          bookingCase.bookingCase.runtimePublicationBundleRef ===
            options.guard.runtimePublicationBundleRef,
          "ASSISTED_RUNTIME_PUBLICATION_DRIFT",
          "Assisted booking mutation requires the current runtime publication tuple.",
        );
      }
    }
    invariant(
      task.reviewFreshnessState === "fresh",
      "ASSISTED_STALE_WORKSPACE_CONTEXT",
      "Assisted booking mutation requires fresh review context.",
    );
    invariant(
      workspaceContext.workspaceTrustEnvelope.mutationAuthorityState === "live",
      "ASSISTED_WORKSPACE_MUTATION_BLOCKED",
      "Assisted booking mutation is blocked by current workspace trust.",
    );
    if (options.requireFocusProtection) {
      invariant(
        options.guard.focusProtectionLeaseRef,
        "ASSISTED_FOCUS_PROTECTION_REQUIRED",
        "Assisted compare or recovery work requires WorkspaceFocusProtectionLease.",
      );
      invariant(
        workspaceContext.protectedCompositionState?.stateValidity === "live",
        "ASSISTED_PROTECTED_COMPOSITION_REQUIRED",
        "Assisted compare or recovery work requires live ProtectedCompositionState.",
      );
      if (!options.allowMissingFocus && options.guard.protectedCompositionStateRef) {
        invariant(
          workspaceContext.protectedCompositionState?.protectedCompositionStateId ===
            options.guard.protectedCompositionStateRef,
          "ASSISTED_PROTECTED_COMPOSITION_MISMATCH",
          "Assisted compare or recovery work requires the current ProtectedCompositionState.",
        );
      }
    }
    return {
      bookingCase,
      task,
      reviewSession,
      launchContext,
      workspaceContext,
      taskCompletion,
    };
  }

  private async loadWorkspaceGuardOrFailClosed(options: {
    bookingCaseId: string;
    guard: AssistedWorkspaceGuardInput;
    requireCurrentRefs: boolean;
    allowMissingFocus?: boolean;
    requireFocusProtection?: boolean;
  }): Promise<
    Awaited<ReturnType<Phase4AssistedBookingApplicationImpl["loadWorkspaceGuard"]>>
  > {
    try {
      return await this.loadWorkspaceGuard(options);
    } catch (error) {
      const code =
        error instanceof Error
          ? ((error as Error & { code?: string }).code ?? "ASSISTED_GUARD_FAILED")
          : "ASSISTED_GUARD_FAILED";
      const family: BookingExceptionFamily =
        code.includes("PUBLICATION") || code.includes("WORKSPACE")
          ? "stale_owner_or_publication_drift"
          : code.includes("CAPABILITY")
            ? "capability_mismatch"
            : "stale_owner_or_publication_drift";
      return this.failClosedWithRecovery({
        bookingCaseId: options.bookingCaseId,
        taskId: options.guard.taskId,
        reviewActionLeaseRef: options.guard.reviewActionLeaseRef,
        reasonCode: code.toLowerCase(),
        family,
        severity: family === "capability_mismatch" ? "blocking" : "critical",
      });
    }
  }

  private async failClosedWithRecovery(input: {
    bookingCaseId: string;
    taskId: string;
    reviewActionLeaseRef: string | null | undefined;
    reasonCode: string;
    family?: BookingExceptionFamily;
    severity?: BookingExceptionQueueSeverity;
  }): Promise<never> {
    const bookingCase = await this.requireBookingCase(input.bookingCaseId);
    try {
      await this.triageApplication.markStaleOwnerDetected({
        taskId: input.taskId,
        authorizedByRef: optionalRef(input.reviewActionLeaseRef) ?? "assisted_booking",
        detectedAt: new Date().toISOString(),
        breakReason: input.reasonCode,
      });
    } catch {
      // Best-effort recovery opening; the queue entry still records the failure.
    }
    const task = await this.requireTask(input.taskId);
    const currentSession =
      await this.assistedBookingService.queryCurrentAssistedBookingSession(input.bookingCaseId);
    if (currentSession) {
      await this.assistedBookingService.recordAssistedBookingSessionState({
        assistedBookingSessionId: currentSession.assistedBookingSessionId,
        sessionState: "stale_recoverable",
        lastActivityAt: new Date().toISOString(),
        staleOwnerRecoveryRef: task.staleOwnerRecoveryRef ?? null,
        blockedReasonRefs: [input.reasonCode],
      });
    }
    await this.assistedBookingService.upsertBookingExceptionQueueEntry({
      bookingCaseRef: bookingCase.bookingCase.bookingCaseId,
      taskRef: task.taskId,
      assistedBookingSessionRef: currentSession?.assistedBookingSessionId ?? null,
      exceptionFamily: input.family ?? "stale_owner_or_publication_drift",
      severity: input.severity ?? "critical",
      selectedAnchorRef:
        bookingCase.bookingCase.selectedSlotRef ?? bookingCase.bookingCase.bookingCaseId,
      currentSnapshotRef:
        bookingCase.bookingCase.currentOfferSessionRef ?? bookingCase.bookingCase.selectedSlotRef,
      reasonCodes: [input.reasonCode],
      evidenceRefs: uniqueSorted([
        task.taskId,
        ...(task.staleOwnerRecoveryRef ? [task.staleOwnerRecoveryRef] : []),
      ]),
      observedAt: new Date().toISOString(),
      taskCompletionSettlementEnvelopeRef: task.taskCompletionSettlementEnvelopeRef,
      requestLifecycleLeaseRef: bookingCase.bookingCase.requestLifecycleLeaseRef,
      requestOwnershipEpochRef: bookingCase.bookingCase.ownershipEpoch,
      staleOwnerRecoveryRef: task.staleOwnerRecoveryRef ?? null,
      sameShellRecoveryRouteRef: `/workspace/bookings/${bookingCase.bookingCase.bookingCaseId}`,
    });
    throw new Error(`ASSISTED_FAIL_CLOSED: ${input.reasonCode}`);
  }

  private async synchronizeExceptionQueue(
    bookingCaseId: string,
    options: {
      capability?: BookingCapabilityResolutionResult | BookingCapabilityDiagnosticsBundle | null;
      guard?: Awaited<ReturnType<Phase4AssistedBookingApplicationImpl["loadWorkspaceGuard"]>>;
      commit?: BookingCommitApplicationResult | null;
    },
  ): Promise<readonly BookingExceptionQueueEntrySnapshot[]> {
    const bookingCase = await this.requireBookingCase(bookingCaseId);
    const session =
      await this.assistedBookingService.queryCurrentAssistedBookingSession(bookingCaseId);
    const capability =
      options.capability && "isCurrentScope" in options.capability
        ? options.capability
        : session
          ? await this.queryCapabilityByResolution(session.capabilityResolutionRef)
          : await this.queryCapabilityByResolution(
              bookingCase.bookingCase.activeCapabilityResolutionRef,
            );
    const commit =
      options.commit ??
      (await this.bookingCommitApplication.queryCurrentBookingCommit({
        bookingCaseId,
      }).catch(() => null));
    const reminderPlan = await this.reminderApplication.queryCurrentReminderPlan({
      bookingCaseId,
    }).catch(() => null);
    const task = options.guard?.task ?? (session ? await this.requireTask(session.taskRef).catch(() => null) : null);
    const desired = new Map<
      BookingExceptionFamily,
      Omit<Parameters<Phase4AssistedBookingService["upsertBookingExceptionQueueEntry"]>[0], "exceptionFamily" | "severity">
    >();

    if (commit) {
      const family = familyFromBookingException(commit);
      if (family && commit.bookingException) {
        desired.set(family, {
          bookingCaseRef: bookingCaseId,
          taskRef: task?.taskId ?? session?.taskRef ?? bookingCase.bookingCase.originTriageTaskRef,
          assistedBookingSessionRef: session?.assistedBookingSessionId ?? null,
          selectedAnchorRef:
            commit.transaction.selectedSlotRef ?? bookingCase.bookingCase.bookingCaseId,
          currentSnapshotRef: commit.transaction.bookingTransactionId,
          providerAdapterBindingRef: commit.transaction.providerAdapterBindingRef,
          providerAdapterBindingHash: commit.transaction.providerAdapterBindingHash,
          capabilityResolutionRef: commit.transaction.capabilityResolutionRef,
          capabilityTupleHash: commit.transaction.capabilityTupleHash,
          reasonCodes: [commit.bookingException.reasonCode],
          evidenceRefs: uniqueSorted([
            commit.bookingException.bookingExceptionId,
            commit.transaction.bookingTransactionId,
          ]),
          observedAt: commit.bookingException.updatedAt,
          taskCompletionSettlementEnvelopeRef:
            task?.taskCompletionSettlementEnvelopeRef ?? null,
          requestLifecycleLeaseRef: bookingCase.bookingCase.requestLifecycleLeaseRef,
          requestOwnershipEpochRef: bookingCase.bookingCase.ownershipEpoch,
          staleOwnerRecoveryRef: task?.staleOwnerRecoveryRef ?? null,
          sameShellRecoveryRouteRef: `/workspace/bookings/${bookingCaseId}`,
        });
      }
    }

    if (capability && isGpLinkageBlocked(capability)) {
      desired.set("linkage_required_blocker", {
        bookingCaseRef: bookingCaseId,
        taskRef: task?.taskId ?? session?.taskRef ?? bookingCase.bookingCase.originTriageTaskRef,
        assistedBookingSessionRef: session?.assistedBookingSessionId ?? null,
        selectedAnchorRef: bookingCase.bookingCase.bookingCaseId,
        currentSnapshotRef: session?.currentSnapshotRef ?? null,
        providerAdapterBindingRef:
          capability.providerAdapterBinding.bookingProviderAdapterBindingId,
        providerAdapterBindingHash: capability.providerAdapterBinding.bindingHash,
        capabilityResolutionRef: capability.resolution.bookingCapabilityResolutionId,
        capabilityTupleHash: capability.resolution.capabilityTupleHash,
        reasonCodes: capability.resolution.blockedActionReasonCodes,
        evidenceRefs: [capability.resolution.bookingCapabilityResolutionId],
        observedAt: capability.resolution.evaluatedAt,
        taskCompletionSettlementEnvelopeRef: task?.taskCompletionSettlementEnvelopeRef ?? null,
        requestLifecycleLeaseRef: bookingCase.bookingCase.requestLifecycleLeaseRef,
        requestOwnershipEpochRef: bookingCase.bookingCase.ownershipEpoch,
      });
    }

    if (capability && isSelfServiceBlocked(capability, bookingCase)) {
      desired.set("patient_self_service_blocked", {
        bookingCaseRef: bookingCaseId,
        taskRef: task?.taskId ?? session?.taskRef ?? bookingCase.bookingCase.originTriageTaskRef,
        assistedBookingSessionRef: session?.assistedBookingSessionId ?? null,
        selectedAnchorRef: bookingCase.bookingCase.bookingCaseId,
        currentSnapshotRef: session?.currentSnapshotRef ?? null,
        providerAdapterBindingRef:
          capability.providerAdapterBinding.bookingProviderAdapterBindingId,
        providerAdapterBindingHash: capability.providerAdapterBinding.bindingHash,
        capabilityResolutionRef: capability.resolution.bookingCapabilityResolutionId,
        capabilityTupleHash: capability.resolution.capabilityTupleHash,
        reasonCodes: capability.resolution.blockedActionReasonCodes,
        evidenceRefs: [capability.resolution.bookingCapabilityResolutionId],
        observedAt: capability.resolution.evaluatedAt,
        taskCompletionSettlementEnvelopeRef: task?.taskCompletionSettlementEnvelopeRef ?? null,
        requestLifecycleLeaseRef: bookingCase.bookingCase.requestLifecycleLeaseRef,
        requestOwnershipEpochRef: bookingCase.bookingCase.ownershipEpoch,
      });
    }

    if (
      capability &&
      session &&
      (session.providerAdapterBindingHash !== capability.providerAdapterBinding.bindingHash ||
        session.providerAdapterBindingRef !==
          capability.providerAdapterBinding.bookingProviderAdapterBindingId)
    ) {
      desired.set("capability_mismatch", {
        bookingCaseRef: bookingCaseId,
        taskRef: task?.taskId ?? session.taskRef,
        assistedBookingSessionRef: session.assistedBookingSessionId,
        selectedAnchorRef: bookingCase.bookingCase.bookingCaseId,
        currentSnapshotRef: session.currentSnapshotRef,
        providerAdapterBindingRef:
          capability.providerAdapterBinding.bookingProviderAdapterBindingId,
        providerAdapterBindingHash: capability.providerAdapterBinding.bindingHash,
        capabilityResolutionRef: capability.resolution.bookingCapabilityResolutionId,
        capabilityTupleHash: capability.resolution.capabilityTupleHash,
        reasonCodes: ["assisted_session_binding_drift"],
        evidenceRefs: [session.assistedBookingSessionId, capability.resolution.bookingCapabilityResolutionId],
        observedAt: capability.resolution.evaluatedAt,
        taskCompletionSettlementEnvelopeRef: task?.taskCompletionSettlementEnvelopeRef ?? null,
        requestLifecycleLeaseRef: bookingCase.bookingCase.requestLifecycleLeaseRef,
        requestOwnershipEpochRef: bookingCase.bookingCase.ownershipEpoch,
      });
    }

    if (
      reminderPlan &&
      (reminderPlan.reminderPlan.deliveryEvidenceState === "failed" ||
        reminderPlan.reminderPlan.deliveryEvidenceState === "disputed" ||
        reminderPlan.reminderPlan.authoritativeOutcomeState === "recovery_required")
    ) {
      desired.set("reminder_delivery_failure", {
        bookingCaseRef: bookingCaseId,
        taskRef: task?.taskId ?? session?.taskRef ?? bookingCase.bookingCase.originTriageTaskRef,
        assistedBookingSessionRef: session?.assistedBookingSessionId ?? null,
        selectedAnchorRef: bookingCase.bookingCase.bookingCaseId,
        currentSnapshotRef: reminderPlan.reminderPlan.reminderPlanId,
        reasonCodes: [
          `delivery_${reminderPlan.reminderPlan.deliveryEvidenceState}`,
          `outcome_${reminderPlan.reminderPlan.authoritativeOutcomeState}`,
        ],
        evidenceRefs: [reminderPlan.reminderPlan.reminderPlanId],
        observedAt: reminderPlan.reminderPlan.updatedAt,
        taskCompletionSettlementEnvelopeRef: task?.taskCompletionSettlementEnvelopeRef ?? null,
        requestLifecycleLeaseRef: bookingCase.bookingCase.requestLifecycleLeaseRef,
        requestOwnershipEpochRef: bookingCase.bookingCase.ownershipEpoch,
      });
    }

    const workspaceContext = options.guard?.workspaceContext ?? null;
    if (
      task?.staleOwnerRecoveryRef ||
      workspaceContext?.workspaceTrustEnvelope.mutationAuthorityState === "frozen" ||
      workspaceContext?.workspaceTrustEnvelope.mutationAuthorityState === "blocked"
    ) {
      desired.set("stale_owner_or_publication_drift", {
        bookingCaseRef: bookingCaseId,
        taskRef: task?.taskId ?? session?.taskRef ?? bookingCase.bookingCase.originTriageTaskRef,
        assistedBookingSessionRef: session?.assistedBookingSessionId ?? null,
        selectedAnchorRef:
          bookingCase.bookingCase.selectedSlotRef ?? bookingCase.bookingCase.bookingCaseId,
        currentSnapshotRef:
          session?.currentSnapshotRef ?? bookingCase.bookingCase.currentOfferSessionRef,
        staffWorkspaceConsistencyProjectionRef:
          workspaceContext?.staffWorkspaceConsistencyProjection.workspaceConsistencyProjectionId ??
          session?.staffWorkspaceConsistencyProjectionRef ??
          null,
        workspaceSliceTrustProjectionRef:
          workspaceContext?.workspaceSliceTrustProjection.workspaceSliceTrustProjectionId ??
          session?.workspaceSliceTrustProjectionRef ??
          null,
        reviewActionLeaseRef:
          options.guard?.reviewSession.reviewActionLeaseRef ?? session?.reviewActionLeaseRef ?? null,
        surfaceRouteContractRef:
          bookingCase.bookingCase.surfaceRouteContractRef,
        surfacePublicationRef: bookingCase.bookingCase.surfacePublicationRef,
        runtimePublicationBundleRef:
          bookingCase.bookingCase.runtimePublicationBundleRef,
        taskCompletionSettlementEnvelopeRef:
          task?.taskCompletionSettlementEnvelopeRef ?? null,
        requestLifecycleLeaseRef: bookingCase.bookingCase.requestLifecycleLeaseRef,
        requestOwnershipEpochRef: bookingCase.bookingCase.ownershipEpoch,
        staleOwnerRecoveryRef: task?.staleOwnerRecoveryRef ?? null,
        reasonCodes: uniqueSorted([
          ...(workspaceContext?.workspaceTrustEnvelope.blockingReasonRefs ?? []),
          ...(task?.staleOwnerRecoveryRef ? ["stale_owner_recovery_open"] : []),
        ]),
        evidenceRefs: uniqueSorted([
          ...(task?.staleOwnerRecoveryRef ? [task.staleOwnerRecoveryRef] : []),
          ...(workspaceContext
            ? [workspaceContext.workspaceTrustEnvelope.workspaceTrustEnvelopeId]
            : []),
        ]),
        observedAt: new Date().toISOString(),
        sameShellRecoveryRouteRef: `/workspace/bookings/${bookingCaseId}`,
      });
    }

    const current = await this.assistedBookingService.queryBookingExceptionQueue({
      bookingCaseRef: bookingCaseId,
    });
    const activeFamilies = new Set(desired.keys());
    for (const [family, entryInput] of desired) {
      await this.assistedBookingService.upsertBookingExceptionQueueEntry({
        ...entryInput,
        exceptionFamily: family,
        severity: severityForExceptionFamily(family),
      });
    }
    for (const currentEntry of current) {
      if (
        (currentEntry.entryState === "open" || currentEntry.entryState === "claimed") &&
        !activeFamilies.has(currentEntry.exceptionFamily)
      ) {
        await this.assistedBookingService.resolveBookingExceptionQueueEntry({
          bookingExceptionQueueEntryId: currentEntry.bookingExceptionQueueEntryId,
          resolvedAt: new Date().toISOString(),
          reasonCodes: ["condition_cleared"],
        });
      }
    }
    return this.assistedBookingService.queryBookingExceptionQueue({
      bookingCaseRef: bookingCaseId,
      entryStates: ["open", "claimed"],
    });
  }
}

export function createPhase4AssistedBookingApplication(options?: {
  bookingCaseApplication?: Phase4BookingCaseApplication;
  bookingCapabilityApplication?: Phase4BookingCapabilityApplication;
  slotSearchApplication?: Phase4SlotSearchApplication;
  capacityRankApplication?: Phase4CapacityRankApplication;
  bookingReservationApplication?: Phase4BookingReservationApplication;
  bookingCommitApplication?: Phase4BookingCommitApplication;
  waitlistApplication?: Phase4SmartWaitlistApplication;
  reminderApplication?: Phase4BookingReminderApplication;
  triageApplication?: Phase3TriageKernelApplication;
  workspaceContextApplication?: WorkspaceContextProjectionApplication;
  taskCompletionContinuityApplication?: Phase3TaskCompletionContinuityApplication;
  reopenLaunchApplication?: Phase3ReopenLaunchApplication;
  workspaceRepositories?: WorkspaceProjectionDependencies;
  repositories?: Phase4AssistedBookingRepositories;
  idGenerator?: BackboneIdGenerator;
}): Phase4AssistedBookingApplication {
  return new Phase4AssistedBookingApplicationImpl(options);
}
