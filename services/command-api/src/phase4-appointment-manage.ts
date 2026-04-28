import { createHash } from "node:crypto";
import type {
  AppointmentManageActorMode,
  AppointmentManageBundle,
  AppointmentRecordSnapshot,
  BookingCapabilityDiagnosticsBundle,
  BookingCapabilityProjectionSnapshot,
  BookingCapabilityResolutionResult,
  BookingConfirmationTruthProjectionSnapshot,
  BookingManageSettlementResult,
  BookingProviderAdapterBindingSnapshot,
  BookingContinuityEvidenceProjectionSnapshot,
  NormalizedSlotSnapshot,
  OfferSessionSnapshot,
  Phase4AppointmentManageRepositories,
  Phase4AppointmentManageService,
} from "@vecells/domain-booking";
import {
  createPhase4AppointmentManageService,
  createPhase4AppointmentManageStore,
  defaultAppointmentManageWindowPolicy,
  evaluateCancelablePredicate,
  evaluateReschedulablePredicate,
  isClinicallyMeaningfulFreeText,
} from "@vecells/domain-booking";
import { type FoundationEventEnvelope } from "@vecells/event-contracts";
import {
  createPhase4BookingCapabilityApplication,
  type Phase4BookingCapabilityApplication,
} from "./phase4-booking-capability";
import {
  createPhase4BookingCaseApplication,
  type Phase4BookingCaseApplication,
} from "./phase4-booking-case";
import {
  createPhase4BookingCommitApplication,
  type Phase4BookingCommitApplication,
} from "./phase4-booking-commit";
import {
  createPhase4BookingReservationApplication,
  type Phase4BookingReservationApplication,
} from "./phase4-booking-reservations";
import {
  createPhase4CapacityRankApplication,
  type Phase4CapacityRankApplication,
} from "./phase4-capacity-rank-offers";
import {
  createPhase4SlotSearchApplication,
  type Phase4SlotSearchApplication,
  type StartSlotSearchInput,
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

function buildRouteTupleHash(input: {
  appointmentId: string;
  actionScope: string;
  routeIntentBindingRef: string;
  surfaceRouteContractRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
}): string {
  return sha256(input);
}

function buildRouteContractDigest(input: {
  routeFamilyRef: string;
  surfaceRouteContractRef: string;
  actionScope: string;
}): string {
  return sha256(input);
}

function buildAppointmentVersionRef(appointment: AppointmentRecordSnapshot): string {
  return `appointment_record::${appointment.appointmentRecordId}::v${appointment.version}`;
}

function buildFreshnessToken(input: {
  appointmentVersionRef: string;
  capabilityTupleHash: string;
  providerAdapterBindingHash: string;
  bookingConfirmationTruthProjectionRef: string;
}): string {
  return sha256(input);
}

function buildAppointmentLineageRef(appointment: AppointmentRecordSnapshot): string {
  return `appointment_lineage::${appointment.bookingCaseRef}::${
    appointment.supersedesAppointmentRef ?? appointment.appointmentRecordId
  }`;
}

function currentTimestamp(input: string | null | undefined, fallback: string): string {
  return input ? ensureIsoTimestamp(input, "timestamp") : fallback;
}

type AppointmentManageCapabilityPrerequisites = {
  gpLinkageStatus?: "linked" | "missing" | "not_required";
  localConsumerStatus?: "ready" | "missing" | "not_required";
  supplierDegradationStatus?: "nominal" | "degraded_manual";
  publicationState?: "published" | "frozen" | "withdrawn";
  assuranceTrustState?: "writable" | "read_only" | "blocked";
  organisationRef?: string;
};

type ContinuityEvidenceState = "current" | "stale" | "blocked" | "degraded";

interface BaseAppointmentManageInput extends AppointmentManageCapabilityPrerequisites {
  appointmentId: string;
  actorRef: string;
  subjectRef: string;
  actorMode: AppointmentManageActorMode;
  routeIntentBindingRef: string;
  surfaceRouteContractRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  selectedAnchorRef?: string | null;
  routeFamilyRef?: string | null;
  experienceContinuityEvidenceRef?: string | null;
  continuityEvidenceState?: ContinuityEvidenceState;
  expectedRouteIntentTupleHash?: string | null;
  expectedCapabilityTupleHash?: string | null;
  expectedProviderAdapterBindingHash?: string | null;
  expectedGoverningObjectVersionRef?: string | null;
  expectedContinuityEvidenceRef?: string | null;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  occurredAt: string;
  idempotencyKey: string;
  payloadArtifactRef?: string | null;
  edgeCorrelationId?: string | null;
}

export interface SubmitAppointmentCancelInput extends BaseAppointmentManageInput {
  cancelReasonCode: string;
  successDisposition?: "close_case" | "rebook_in_place" | "stay_summary";
  supplierOutcome:
    | {
        kind: "authoritative_cancelled";
      }
    | {
        kind: "supplier_pending";
        blockerReasonCode: string;
        recoveryMode: string;
      }
    | {
        kind: "reconciliation_required";
        blockerReasonCode: string;
        recoveryMode: string;
      }
    | {
        kind: "authoritative_failure";
        failureReasonCode: string;
      };
}

export interface BootstrapReplacementSearchInput {
  displayTimeZone: string;
  supplierWindows: StartSlotSearchInput["supplierWindows"];
  createOfferSession?: boolean;
  searchCommandActionRecordRef: string;
  searchCommandSettlementRecordRef: string;
  offerCommandActionRecordRef: string;
  offerCommandSettlementRecordRef: string;
  occurredAt?: string | null;
  subjectRef?: string | null;
}

export interface SubmitAppointmentRescheduleInput extends BaseAppointmentManageInput {
  bootstrapReplacementSearch?: BootstrapReplacementSearchInput | null;
}

export interface AbandonAppointmentRescheduleInput extends BaseAppointmentManageInput {
  reasonCodes?: readonly string[];
}

export interface SubmitAppointmentDetailUpdateInput extends BaseAppointmentManageInput {
  details: Readonly<Record<string, string>>;
  updateScope?: "detail_update" | "reminder_change";
  contactDependencyState?: "clear" | "blocked";
}

export interface QueryCurrentAppointmentManageInput extends AppointmentManageCapabilityPrerequisites {
  appointmentId: string;
  actorMode?: AppointmentManageActorMode;
  routeIntentBindingRef?: string | null;
  surfaceRouteContractRef?: string | null;
  surfacePublicationRef?: string | null;
  runtimePublicationBundleRef?: string | null;
  selectedAnchorRef?: string | null;
  routeFamilyRef?: string | null;
  experienceContinuityEvidenceRef?: string | null;
  continuityEvidenceState?: ContinuityEvidenceState;
}

export interface AppointmentManageCapabilityContext {
  diagnostics: BookingCapabilityDiagnosticsBundle;
  resolved: BookingCapabilityResolutionResult;
}

export interface AppointmentManageApplicationResult {
  bookingCase: Awaited<ReturnType<Phase4BookingCaseApplication["queryBookingCase"]>>;
  appointmentRecord: AppointmentRecordSnapshot;
  currentAppointmentRecord: AppointmentRecordSnapshot | null;
  currentConfirmationTruth: BookingConfirmationTruthProjectionSnapshot;
  capability: AppointmentManageCapabilityContext;
  currentManage: AppointmentManageBundle | null;
  continuityEvidence: BookingContinuityEvidenceProjectionSnapshot;
  replacementOfferSessionId: string | null;
  replacementSlotSnapshotId: string | null;
  replayed: boolean;
  emittedEvents: readonly FoundationEventEnvelope<object>[];
}

export interface Phase4AppointmentManageApplication {
  appointmentManageService: Phase4AppointmentManageService;
  appointmentManageRepositories: Phase4AppointmentManageRepositories;
  submitCancelAppointment(
    input: SubmitAppointmentCancelInput,
  ): Promise<AppointmentManageApplicationResult>;
  submitRescheduleAppointment(
    input: SubmitAppointmentRescheduleInput,
  ): Promise<AppointmentManageApplicationResult>;
  abandonAppointmentReschedule(
    input: AbandonAppointmentRescheduleInput,
  ): Promise<AppointmentManageApplicationResult>;
  submitAppointmentDetailUpdate(
    input: SubmitAppointmentDetailUpdateInput,
  ): Promise<AppointmentManageApplicationResult>;
  queryCurrentAppointmentManage(
    input: QueryCurrentAppointmentManageInput,
  ): Promise<AppointmentManageApplicationResult | null>;
}

export const PHASE4_APPOINTMENT_MANAGE_SERVICE_NAME =
  "Phase4AppointmentManageCommandApplication";
export const PHASE4_APPOINTMENT_MANAGE_SCHEMA_VERSION =
  "288.phase4.appointment-manage-command-layer.v1";

export const PHASE4_APPOINTMENT_MANAGE_QUERY_SURFACES = [
  "GET /v1/appointments/{appointmentId}/manage/current",
] as const;

export const phase4AppointmentManageRoutes = [
  {
    routeId: "appointment_manage_current",
    method: "GET",
    path: "/v1/appointments/{appointmentId}/manage/current",
    contractFamily: "AppointmentManageCurrentContract",
    purpose:
      "Resolve the latest BookingManageSettlement and BookingContinuityEvidenceProjection for one appointment-manage shell tuple.",
    bodyRequired: false,
    idempotencyRequired: false,
  },
  {
    routeId: "appointment_submit_cancel",
    method: "POST",
    path: "/internal/v1/appointments/{appointmentId}:submit-cancel",
    contractFamily: "SubmitAppointmentCancelCommandContract",
    purpose:
      "Submit one governed AppointmentManageCommand for authoritative cancellation while keeping same-shell stale, pending, and reconciliation posture explicit.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "appointment_submit_reschedule",
    method: "POST",
    path: "/internal/v1/appointments/{appointmentId}:submit-reschedule",
    contractFamily: "SubmitAppointmentRescheduleCommandContract",
    purpose:
      "Start one reschedule chain over the same booking engine without releasing the source appointment early or forking a second scheduler.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "appointment_abandon_reschedule",
    method: "POST",
    path: "/internal/v1/appointments/{appointmentId}:abandon-reschedule",
    contractFamily: "AbandonAppointmentRescheduleCommandContract",
    purpose:
      "Restore the source appointment and booking-manage continuity safely when a replacement booking chain is abandoned before authoritative replacement truth exists.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "appointment_submit_detail_update",
    method: "POST",
    path: "/internal/v1/appointments/{appointmentId}:submit-detail-update",
    contractFamily: "SubmitAppointmentDetailUpdateCommandContract",
    purpose:
      "Apply one admin-only appointment detail update or return safety-preempted or repair-bound settlement when the content or reachability posture is not lawful.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
] as const;

export const phase4AppointmentManagePersistenceTables = [
  "phase4_appointment_manage_commands",
  "phase4_booking_manage_settlements",
  "phase4_booking_continuity_evidence_projections",
  "phase4_appointment_records",
] as const;

export const phase4AppointmentManageMigrationPlanRefs = [
  "services/command-api/migrations/136_phase4_booking_commit_pipeline.sql",
  "services/command-api/migrations/137_phase4_appointment_manage_command_layer.sql",
] as const;

interface ManageSupportPolicy {
  supportsCancel: boolean;
  supportsReschedule: boolean;
  supportsDetailUpdate: boolean;
  supportsReminderChange: boolean;
  allowedDetailFields: readonly string[];
  contactDependentFields: readonly string[];
}

function resolveManageSupportPolicy(
  binding: BookingProviderAdapterBindingSnapshot,
): ManageSupportPolicy {
  const ref = binding.manageSupportContractRef;
  if (ref.includes("manual-assist")) {
    return {
      supportsCancel: false,
      supportsReschedule: false,
      supportsDetailUpdate: false,
      supportsReminderChange: false,
      allowedDetailFields: [],
      contactDependentFields: ["contactPhone", "contactEmail", "reminderChannel"],
    };
  }
  if (ref.includes("gp-connect")) {
    return {
      supportsCancel: true,
      supportsReschedule: true,
      supportsDetailUpdate: true,
      supportsReminderChange: true,
      allowedDetailFields: [
        "contactPhone",
        "contactEmail",
        "accessibilityNotes",
        "administrativeNote",
        "arrivalWindow",
        "reminderChannel",
      ],
      contactDependentFields: ["contactPhone", "contactEmail", "reminderChannel"],
    };
  }
  return {
    supportsCancel: true,
    supportsReschedule: true,
    supportsDetailUpdate: true,
    supportsReminderChange: true,
    allowedDetailFields: [
      "contactPhone",
      "contactEmail",
      "accessibilityNotes",
      "administrativeNote",
      "arrivalWindow",
      "reminderChannel",
    ],
    contactDependentFields: ["contactPhone", "contactEmail", "reminderChannel"],
  };
}

function resolveSelectionAudience(actorMode: AppointmentManageActorMode): "patient" | "staff" {
  return actorMode === "patient" ? "patient" : "staff";
}

function resolveRequestedActionScope(
  actionScope: "appointment_cancel" | "appointment_reschedule" | "appointment_detail_update" | "reminder_change" | "appointment_reschedule_abandon" | "query",
): "cancel_appointment" | "reschedule_appointment" | "manage_appointment" {
  switch (actionScope) {
    case "appointment_cancel":
      return "cancel_appointment";
    case "appointment_reschedule":
      return "reschedule_appointment";
    default:
      return "manage_appointment";
  }
}

function mutateAppointment(
  appointment: AppointmentRecordSnapshot,
  patch: Partial<AppointmentRecordSnapshot>,
  updatedAt: string,
): AppointmentRecordSnapshot {
  return {
    ...appointment,
    ...patch,
    updatedAt: ensureIsoTimestamp(updatedAt, "updatedAt"),
    version: appointment.version + 1,
  };
}

function continuityEvidenceState(
  input: ContinuityEvidenceState | null | undefined,
): ContinuityEvidenceState {
  return input ?? "current";
}

function buildDefaultRouteFamilyRef(actorMode: AppointmentManageActorMode): string {
  return actorMode === "patient" ? "patient_booking_manage" : "staff_booking_manage";
}

function buildDefaultExperienceContinuityEvidenceRef(appointmentId: string): string {
  return `experience_continuity::booking_manage::${appointmentId}`;
}

function isWritableManageTruth(
  confirmationTruth: BookingConfirmationTruthProjectionSnapshot,
  appointment: AppointmentRecordSnapshot,
): boolean {
  return (
    confirmationTruth.confirmationTruthState === "confirmed" &&
    confirmationTruth.manageExposureState === "writable" &&
    appointment.appointmentStatus === "booked"
  );
}

function buildReasonCodeList(...sets: ReadonlyArray<readonly string[]>): string[] {
  return [...new Set(sets.flat().map((value) => value.trim()).filter(Boolean))].sort();
}

function isCurrentSummaryOnlyStatus(appointment: AppointmentRecordSnapshot): boolean {
  return (
    appointment.appointmentStatus === "cancelled" ||
    appointment.appointmentStatus === "superseded" ||
    appointment.appointmentStatus === "cancellation_pending" ||
    appointment.appointmentStatus === "reschedule_in_progress"
  );
}

export function createPhase4AppointmentManageApplication(input?: {
  repositories?: ReturnType<typeof createPhase4AppointmentManageStore>;
  bookingCaseApplication?: Phase4BookingCaseApplication;
  bookingCapabilityApplication?: Phase4BookingCapabilityApplication;
  slotSearchApplication?: Phase4SlotSearchApplication;
  capacityRankApplication?: Phase4CapacityRankApplication;
  bookingReservationApplication?: Phase4BookingReservationApplication;
  bookingCommitApplication?: Phase4BookingCommitApplication;
}): Phase4AppointmentManageApplication {
  const bookingCaseApplication =
    input?.bookingCaseApplication ?? createPhase4BookingCaseApplication();
  const bookingCapabilityApplication =
    input?.bookingCapabilityApplication ??
    createPhase4BookingCapabilityApplication({ bookingCaseApplication });
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
  const bookingCommitApplication =
    input?.bookingCommitApplication ??
    createPhase4BookingCommitApplication({
      bookingCaseApplication,
      bookingCapabilityApplication,
      slotSearchApplication,
      capacityRankApplication,
      bookingReservationApplication,
    });
  const appointmentManageRepositories =
    input?.repositories ?? createPhase4AppointmentManageStore();
  const appointmentManageService = createPhase4AppointmentManageService({
    repositories: appointmentManageRepositories,
  });

  async function requireAppointmentRecord(
    appointmentId: string,
  ): Promise<AppointmentRecordSnapshot> {
    const appointmentDocument =
      await bookingCommitApplication.bookingCommitRepositories.getAppointmentRecord(
        requireRef(appointmentId, "appointmentId"),
      );
    invariant(
      appointmentDocument,
      "APPOINTMENT_RECORD_NOT_FOUND",
      `AppointmentRecord ${appointmentId} was not found.`,
    );
    return appointmentDocument.toSnapshot();
  }

  async function requireManageContext(
    appointmentId: string,
    occurredAt: string,
  ): Promise<{
    appointment: AppointmentRecordSnapshot;
    bookingCase: NonNullable<Awaited<ReturnType<Phase4BookingCaseApplication["queryBookingCase"]>>>;
    currentCommit: NonNullable<
      Awaited<ReturnType<Phase4BookingCommitApplication["queryCurrentBookingCommit"]>>
    >;
    sourceTransaction: NonNullable<
      Awaited<
        ReturnType<
          Phase4BookingCommitApplication["bookingCommitRepositories"]["getBookingTransaction"]
        >
      >
    > extends { toSnapshot(): infer T }
      ? T
      : never;
    offerSession: OfferSessionSnapshot;
    selectedSlot: NormalizedSlotSnapshot;
    currentAppointment: AppointmentRecordSnapshot | null;
  }> {
    const appointment = await requireAppointmentRecord(appointmentId);
    const bookingCase = await bookingCaseApplication.queryBookingCase(appointment.bookingCaseRef);
    invariant(
      bookingCase,
      "BOOKING_CASE_NOT_FOUND",
      `BookingCase ${appointment.bookingCaseRef} was not found.`,
    );
    const currentCommit = await bookingCommitApplication.queryCurrentBookingCommit({
      bookingCaseId: bookingCase.bookingCase.bookingCaseId,
      requestedAt: occurredAt,
    });
    invariant(
      currentCommit,
      "BOOKING_COMMIT_NOT_FOUND",
      `Current booking commit state for ${bookingCase.bookingCase.bookingCaseId} was not found.`,
    );
    const txDocument = await bookingCommitApplication.bookingCommitRepositories.getBookingTransaction(
      appointment.bookingTransactionRef,
    );
    invariant(
      txDocument,
      "BOOKING_TRANSACTION_NOT_FOUND",
      `BookingTransaction ${appointment.bookingTransactionRef} was not found.`,
    );
    const transaction = txDocument.toSnapshot();
    const offerSessionDocument = await capacityRankApplication.capacityRankRepositories.getOfferSession(
      transaction.offerSessionRef,
    );
    invariant(
      offerSessionDocument,
      "OFFER_SESSION_NOT_FOUND",
      `OfferSession ${transaction.offerSessionRef} was not found.`,
    );
    const offerSession = offerSessionDocument.toSnapshot();
    const normalizedSlots = (
      await slotSearchApplication.slotSearchRepositories.listNormalizedSlots(
        offerSession.slotSetSnapshotRef,
      )
    ).map((document) => document.toSnapshot());
    const selectedSlot =
      normalizedSlots.find((slot) => slot.normalizedSlotId === appointment.selectedSlotRef) ??
      normalizedSlots.find((slot) => slot.normalizedSlotId === offerSession.selectedNormalizedSlotRef);
    invariant(
      selectedSlot,
      "SELECTED_NORMALIZED_SLOT_NOT_FOUND",
      `Selected normalized slot for appointment ${appointmentId} was not found.`,
    );
    const currentAppointment =
      currentCommit.appointmentRecord &&
      currentCommit.appointmentRecord.appointmentRecordId !== appointment.appointmentRecordId
        ? currentCommit.appointmentRecord
        : currentCommit.appointmentRecord?.appointmentRecordId === appointment.appointmentRecordId
          ? currentCommit.appointmentRecord
          : null;
    return {
      appointment,
      bookingCase,
      currentCommit,
      sourceTransaction: txDocument.toSnapshot(),
      offerSession,
      selectedSlot,
      currentAppointment,
    };
  }

  async function resolveCurrentCaseDiagnostics(bookingCaseId: string) {
    const bookingCase = await bookingCaseApplication.queryBookingCase(bookingCaseId);
    invariant(bookingCase, "BOOKING_CASE_NOT_FOUND", `BookingCase ${bookingCaseId} was not found.`);
    if (!bookingCase.bookingCase.activeCapabilityResolutionRef) {
      return null;
    }
    return bookingCapabilityApplication.queryCapabilityDiagnostics({
      resolutionId: bookingCase.bookingCase.activeCapabilityResolutionRef,
    });
  }

  async function resolveManageCapability(
    actionScope:
      | "appointment_cancel"
      | "appointment_reschedule"
      | "appointment_detail_update"
      | "reminder_change"
      | "appointment_reschedule_abandon"
      | "query",
    base: BaseAppointmentManageInput | QueryCurrentAppointmentManageInput,
    appointment: AppointmentRecordSnapshot,
    bookingCase: NonNullable<Awaited<ReturnType<Phase4BookingCaseApplication["queryBookingCase"]>>>,
  ): Promise<AppointmentManageCapabilityContext> {
    const caseDiagnostics = await resolveCurrentCaseDiagnostics(bookingCase.bookingCase.bookingCaseId);
    invariant(
      caseDiagnostics,
      "BOOKING_CASE_CAPABILITY_NOT_FOUND",
      "The current booking-case capability tuple is required before appointment-manage resolution can run.",
    );
    const resolved = await bookingCapabilityApplication.resolveAppointmentManageCapability({
      appointmentId: appointment.appointmentRecordId,
      tenantId: bookingCase.bookingCase.tenantId,
      practiceRef: bookingCase.bookingCase.providerContext.practiceRef,
      organisationRef:
        base.organisationRef ?? caseDiagnostics.resolution.organisationRef,
      supplierRef:
        caseDiagnostics.resolution.supplierRef ??
        requireRef(bookingCase.bookingCase.providerContext.supplierHintRef, "supplierHintRef"),
      integrationMode: caseDiagnostics.resolution.integrationMode,
      deploymentType: caseDiagnostics.resolution.deploymentType,
      selectionAudience:
        resolveSelectionAudience(base.actorMode ?? "staff"),
      requestedActionScope: resolveRequestedActionScope(actionScope),
      gpLinkageCheckpointRef: caseDiagnostics.resolution.gpLinkageCheckpointRef,
      gpLinkageStatus:
        base.gpLinkageStatus ?? caseDiagnostics.resolution.prerequisiteState.gpLinkageStatus,
      localConsumerCheckpointRef: caseDiagnostics.resolution.localConsumerCheckpointRef,
      localConsumerStatus:
        base.localConsumerStatus ?? caseDiagnostics.resolution.prerequisiteState.localConsumerStatus,
      supplierDegradationStatus:
        base.supplierDegradationStatus ??
        caseDiagnostics.resolution.prerequisiteState.supplierDegradationStatus,
      publicationState:
        base.publicationState ?? caseDiagnostics.resolution.prerequisiteState.publicationState,
      assuranceTrustState:
        base.assuranceTrustState ?? caseDiagnostics.resolution.prerequisiteState.assuranceTrustState,
      routeIntentBindingRef:
        optionalRef(base.routeIntentBindingRef) ??
        `appointment_manage_route::${appointment.appointmentRecordId}`,
      surfaceRouteContractRef:
        optionalRef(base.surfaceRouteContractRef) ?? bookingCase.bookingCase.surfaceRouteContractRef,
      surfacePublicationRef:
        optionalRef(base.surfacePublicationRef) ?? bookingCase.bookingCase.surfacePublicationRef,
      runtimePublicationBundleRef:
        optionalRef(base.runtimePublicationBundleRef) ??
        bookingCase.bookingCase.runtimePublicationBundleRef,
      governingObjectDescriptorRef: "AppointmentRecord",
      governingObjectRef: appointment.appointmentRecordId,
      governingObjectVersionRef: buildAppointmentVersionRef(appointment),
      parentAnchorRef:
        optionalRef(base.selectedAnchorRef) ?? appointment.appointmentRecordId,
      presentedCapabilityTupleHash: optionalRef(
        "expectedCapabilityTupleHash" in base ? base.expectedCapabilityTupleHash : null,
      ),
      presentedBindingHash: optionalRef(
        "expectedProviderAdapterBindingHash" in base
          ? base.expectedProviderAdapterBindingHash
          : null,
      ),
      commandActionRecordRef:
        "commandActionRecordRef" in base
          ? base.commandActionRecordRef
          : `appointment_manage_query_action_${appointment.appointmentRecordId}`,
      commandSettlementRecordRef:
        "commandSettlementRecordRef" in base
          ? base.commandSettlementRecordRef
          : `appointment_manage_query_settlement_${appointment.appointmentRecordId}`,
      subjectRef:
        "subjectRef" in base ? base.subjectRef : `appointment_manage_query_subject_${appointment.appointmentRecordId}`,
      evaluatedAt:
        "occurredAt" in base
          ? base.occurredAt
          : new Date().toISOString(),
    });
    return { diagnostics: caseDiagnostics, resolved };
  }

  function buildContinuityVerdict(input: {
    appointment: AppointmentRecordSnapshot;
    confirmationTruth: BookingConfirmationTruthProjectionSnapshot;
    continuityEvidenceState: ContinuityEvidenceState;
    hasTupleDrift: boolean;
    hasCapabilityDrift: boolean;
    hasBindingDrift: boolean;
    hasContinuityDrift: boolean;
    hasReleaseFreeze: boolean;
    latestSettlementResult: BookingManageSettlementResult | null;
  }): {
    continuityState:
      | "live"
      | "summary_only"
      | "stale_recovery"
      | "blocked_recovery";
    writableState: "writable" | "summary_only" | "recovery_only";
    recoveryRouteRef: string | null;
  } {
    if (
      input.hasTupleDrift ||
      input.hasCapabilityDrift ||
      input.hasBindingDrift ||
      input.hasContinuityDrift ||
      input.hasReleaseFreeze ||
      input.continuityEvidenceState === "stale"
    ) {
      return {
        continuityState: "stale_recovery",
        writableState: "recovery_only",
        recoveryRouteRef: "booking_manage_refresh_same_shell",
      };
    }
    if (input.continuityEvidenceState === "blocked") {
      return {
        continuityState: "blocked_recovery",
        writableState: "recovery_only",
        recoveryRouteRef: "booking_manage_blocked_same_shell",
      };
    }
    if (
      input.continuityEvidenceState === "degraded" ||
      input.latestSettlementResult === "supplier_pending" ||
      input.latestSettlementResult === "reconciliation_required" ||
      !isWritableManageTruth(input.confirmationTruth, input.appointment) ||
      isCurrentSummaryOnlyStatus(input.appointment)
    ) {
      return {
        continuityState: "summary_only",
        writableState: "summary_only",
        recoveryRouteRef: null,
      };
    }
    return {
      continuityState: "live",
      writableState: "writable",
      recoveryRouteRef: null,
    };
  }

  async function refreshContinuityFor(
    appointment: AppointmentRecordSnapshot,
    bookingCase: NonNullable<Awaited<ReturnType<Phase4BookingCaseApplication["queryBookingCase"]>>>,
    confirmationTruth: BookingConfirmationTruthProjectionSnapshot,
    capability: AppointmentManageCapabilityContext,
    latestManage: AppointmentManageBundle | null,
    requested: {
      continuityEvidenceState: ContinuityEvidenceState;
      routeIntentBindingRef: string;
      routeIntentTupleHash: string;
      selectedAnchorRef: string;
      routeFamilyRef: string;
      surfacePublicationRef: string;
      runtimePublicationBundleRef: string;
      experienceContinuityEvidenceRef: string;
      hasTupleDrift: boolean;
      hasCapabilityDrift: boolean;
      hasBindingDrift: boolean;
      hasContinuityDrift: boolean;
    },
  ) {
    const verdict = buildContinuityVerdict({
      appointment,
      confirmationTruth,
      continuityEvidenceState: requested.continuityEvidenceState,
      hasTupleDrift: requested.hasTupleDrift,
      hasCapabilityDrift: requested.hasCapabilityDrift,
      hasBindingDrift: requested.hasBindingDrift,
      hasContinuityDrift: requested.hasContinuityDrift,
      hasReleaseFreeze:
        bookingCase.bookingCase.routeFreezeDispositionRef !== null ||
        bookingCase.bookingCase.releaseRecoveryDispositionRef !== null,
      latestSettlementResult: latestManage?.settlement.result ?? null,
    });
    const continuity = await appointmentManageService.refreshContinuityEvidence({
      bookingCaseId: bookingCase.bookingCase.bookingCaseId,
      appointmentId: appointment.appointmentRecordId,
      appointmentRecordRef: appointment.appointmentRecordId,
      bookingConfirmationTruthProjectionRef:
        confirmationTruth.bookingConfirmationTruthProjectionId,
      appointmentLineageRef: buildAppointmentLineageRef(appointment),
      selectedAnchorRef: requested.selectedAnchorRef,
      routeFamilyRef: requested.routeFamilyRef,
      routeIntentBindingRef: requested.routeIntentBindingRef,
      routeIntentTupleHash: requested.routeIntentTupleHash,
      capabilityResolutionRef:
        capability.resolved.resolution.bookingCapabilityResolutionId,
      capabilityTupleHash: capability.resolved.resolution.capabilityTupleHash,
      providerAdapterBindingRef:
        capability.resolved.providerAdapterBinding.bookingProviderAdapterBindingId,
      providerAdapterBindingHash: capability.resolved.providerAdapterBinding.bindingHash,
      surfacePublicationRef: requested.surfacePublicationRef,
      runtimePublicationBundleRef: requested.runtimePublicationBundleRef,
      latestManageSettlementRef:
        latestManage?.settlement.bookingManageSettlementId ??
        `booking_manage_settlement_none::${appointment.appointmentRecordId}`,
      latestManageCommandRef:
        latestManage?.command.appointmentManageCommandId ??
        `appointment_manage_command_none::${appointment.appointmentRecordId}`,
      experienceContinuityEvidenceRef: requested.experienceContinuityEvidenceRef,
      continuityState: verdict.continuityState,
      writableState: verdict.writableState,
      generatedAt: new Date().toISOString(),
    });
    return {
      continuity,
      verdict,
    };
  }

  async function saveAppointment(
    appointment: AppointmentRecordSnapshot,
    previousVersion: number,
  ): Promise<void> {
    await bookingCommitApplication.bookingCommitRepositories.saveAppointmentRecord(appointment, {
      expectedVersion: previousVersion,
    });
  }

  async function finalizeSupersededRescheduleSource(
    appointment: AppointmentRecordSnapshot,
    currentAppointment: AppointmentRecordSnapshot | null,
  ): Promise<{
    appointment: AppointmentRecordSnapshot;
    currentAppointment: AppointmentRecordSnapshot | null;
  }> {
    if (
      appointment.appointmentStatus !== "reschedule_in_progress" ||
      currentAppointment === null ||
      currentAppointment.appointmentRecordId === appointment.appointmentRecordId
    ) {
      return { appointment, currentAppointment };
    }
    const superseded = mutateAppointment(
      appointment,
      {
        appointmentStatus: "superseded",
        supersededByAppointmentRef: currentAppointment.appointmentRecordId,
      },
      currentAppointment.updatedAt,
    );
    const currentLinked = currentAppointment.supersedesAppointmentRef
      ? currentAppointment
      : mutateAppointment(
          currentAppointment,
          {
            supersedesAppointmentRef: appointment.appointmentRecordId,
          },
          currentAppointment.updatedAt,
        );
    await saveAppointment(superseded, appointment.version);
    if (currentLinked !== currentAppointment) {
      await saveAppointment(currentLinked, currentAppointment.version);
    }
    return {
      appointment: superseded,
      currentAppointment: currentLinked,
    };
  }

  async function buildResult(
    appointment: AppointmentRecordSnapshot,
    bookingCase: NonNullable<Awaited<ReturnType<Phase4BookingCaseApplication["queryBookingCase"]>>>,
    currentCommit: NonNullable<
      Awaited<ReturnType<Phase4BookingCommitApplication["queryCurrentBookingCommit"]>>
    >,
    capability: AppointmentManageCapabilityContext,
    currentManage: AppointmentManageBundle | null,
    continuityEvidence: BookingContinuityEvidenceProjectionSnapshot,
    replayed: boolean,
    emittedEvents: readonly FoundationEventEnvelope<object>[],
    replacementOfferSessionId: string | null,
    replacementSlotSnapshotId: string | null,
    currentAppointmentRecord: AppointmentRecordSnapshot | null = currentCommit.appointmentRecord,
  ): Promise<AppointmentManageApplicationResult> {
    return {
      bookingCase,
      appointmentRecord: appointment,
      currentAppointmentRecord,
      currentConfirmationTruth: currentCommit.confirmationTruthProjection,
      capability,
      currentManage,
      continuityEvidence,
      replacementOfferSessionId,
      replacementSlotSnapshotId,
      replayed,
      emittedEvents,
    };
  }

  async function requireLiveMutationPreconditions(
    input: BaseAppointmentManageInput,
    appointment: AppointmentRecordSnapshot,
    bookingCase: NonNullable<Awaited<ReturnType<Phase4BookingCaseApplication["queryBookingCase"]>>>,
    capability: AppointmentManageCapabilityContext,
    latestManage: AppointmentManageBundle | null,
    currentConfirmationTruth: BookingConfirmationTruthProjectionSnapshot,
  ) {
    const expectedRouteTupleHash = optionalRef(input.expectedRouteIntentTupleHash);
    const expectedCapabilityTupleHash = optionalRef(input.expectedCapabilityTupleHash);
    const expectedBindingHash = optionalRef(input.expectedProviderAdapterBindingHash);
    const expectedGoverningObjectVersionRef = optionalRef(input.expectedGoverningObjectVersionRef);
    const expectedContinuityEvidenceRef = optionalRef(input.expectedContinuityEvidenceRef);
    const routeIntentTupleHash = buildRouteTupleHash({
      appointmentId: appointment.appointmentRecordId,
      actionScope: input.commandActionRecordRef,
      routeIntentBindingRef: input.routeIntentBindingRef,
      surfaceRouteContractRef: input.surfaceRouteContractRef,
      surfacePublicationRef: input.surfacePublicationRef,
      runtimePublicationBundleRef: input.runtimePublicationBundleRef,
    });
    return {
      routeIntentTupleHash,
      hasTupleDrift:
        expectedRouteTupleHash !== null && expectedRouteTupleHash !== routeIntentTupleHash,
      hasCapabilityDrift:
        expectedCapabilityTupleHash !== null &&
        expectedCapabilityTupleHash !== capability.resolved.resolution.capabilityTupleHash,
      hasBindingDrift:
        expectedBindingHash !== null &&
        expectedBindingHash !== capability.resolved.providerAdapterBinding.bindingHash,
      hasGoverningObjectDrift:
        expectedGoverningObjectVersionRef !== null &&
        expectedGoverningObjectVersionRef !== buildAppointmentVersionRef(appointment),
      hasContinuityDrift:
        expectedContinuityEvidenceRef !== null &&
        latestManage?.continuityEvidence.bookingContinuityEvidenceProjectionId !==
          expectedContinuityEvidenceRef,
      manageWritable:
        currentConfirmationTruth.confirmationTruthState === "confirmed" &&
        currentConfirmationTruth.manageExposureState === "writable" &&
        bookingCase.bookingCase.status === "managed" &&
        bookingCase.bookingCase.appointmentRef === appointment.appointmentRecordId &&
        appointment.appointmentStatus === "booked",
    };
  }

  async function bootstrapReplacementSearch(
    bookingCaseId: string,
    bootstrap: BootstrapReplacementSearchInput | null | undefined,
    defaultSubjectRef: string,
  ): Promise<{ replacementOfferSessionId: string | null; replacementSlotSnapshotId: string | null }> {
    if (!bootstrap) {
      return { replacementOfferSessionId: null, replacementSlotSnapshotId: null };
    }
    const occurredAt =
      optionalRef(bootstrap.occurredAt) ?? new Date().toISOString();
    const search = await slotSearchApplication.startSlotSearch({
      bookingCaseId,
      displayTimeZone: bootstrap.displayTimeZone,
      supplierWindows: bootstrap.supplierWindows,
      commandActionRecordRef: bootstrap.searchCommandActionRecordRef,
      commandSettlementRecordRef: bootstrap.searchCommandSettlementRecordRef,
      subjectRef: optionalRef(bootstrap.subjectRef) ?? defaultSubjectRef,
      occurredAt,
      payloadArtifactRef: null,
      edgeCorrelationId: null,
    });
    if (bootstrap.createOfferSession === false) {
      return {
        replacementOfferSessionId: null,
        replacementSlotSnapshotId: search.slotSetSnapshot.slotSetSnapshotId,
      };
    }
    const offerSession = await capacityRankApplication.createOfferSessionFromCurrentSnapshot({
      bookingCaseId,
      actorRef: `actor_bootstrap_${bookingCaseId}`,
      subjectRef: optionalRef(bootstrap.subjectRef) ?? defaultSubjectRef,
      commandActionRecordRef: bootstrap.offerCommandActionRecordRef,
      commandSettlementRecordRef: bootstrap.offerCommandSettlementRecordRef,
      occurredAt,
      payloadArtifactRef: null,
      edgeCorrelationId: null,
    });
    return {
      replacementOfferSessionId: offerSession.offerSession.offerSessionId,
      replacementSlotSnapshotId: search.slotSetSnapshot.slotSetSnapshotId,
    };
  }

  return {
    appointmentManageService,
    appointmentManageRepositories,

    async submitCancelAppointment(input) {
      const occurredAt = ensureIsoTimestamp(input.occurredAt, "occurredAt");
      let {
        appointment,
        bookingCase,
        currentCommit,
        sourceTransaction,
        offerSession,
        selectedSlot,
        currentAppointment,
      } = await requireManageContext(input.appointmentId, occurredAt);
      ({ appointment, currentAppointment } = await finalizeSupersededRescheduleSource(
        appointment,
        currentAppointment,
      ));
      const currentManage =
        await appointmentManageService.queryCurrentAppointmentManage(appointment.appointmentRecordId);
      const capability = await resolveManageCapability(
        "appointment_cancel",
        input,
        appointment,
        bookingCase,
      );
      const gate = await requireLiveMutationPreconditions(
        input,
        appointment,
        bookingCase,
        capability,
        currentManage,
        currentCommit.confirmationTruthProjection,
      );
      const routeFamilyRef =
        optionalRef(input.routeFamilyRef) ?? buildDefaultRouteFamilyRef(input.actorMode);
      const selectedAnchorRef =
        optionalRef(input.selectedAnchorRef) ?? appointment.appointmentRecordId;
      const experienceContinuityEvidenceRef =
        optionalRef(input.experienceContinuityEvidenceRef) ??
        buildDefaultExperienceContinuityEvidenceRef(appointment.appointmentRecordId);
      const policy = resolveManageSupportPolicy(capability.resolved.providerAdapterBinding);
      const hasLiveFence =
        currentManage !== null &&
        currentManage.continuityEvidence.writableState !== "writable" &&
        (currentManage.command.actionScope === "appointment_cancel" ||
          currentManage.command.actionScope === "appointment_reschedule");
      let result: BookingManageSettlementResult;
      let reasonCodes: string[] = [input.cancelReasonCode];
      let recoveryRouteRef: string | null = null;
      let transitionEnvelopeRef: string | null = null;
      let updatedAppointment = appointment;
      let emittedEvents: readonly FoundationEventEnvelope<object>[] = [];

      if (
        gate.hasTupleDrift ||
        gate.hasCapabilityDrift ||
        gate.hasBindingDrift ||
        gate.hasGoverningObjectDrift ||
        gate.hasContinuityDrift ||
        !gate.manageWritable
      ) {
        result = "stale_recoverable";
        reasonCodes = buildReasonCodeList(reasonCodes, [
          gate.hasTupleDrift ? "stale_route_tuple" : "",
          gate.hasCapabilityDrift ? "stale_capability_tuple" : "",
          gate.hasBindingDrift ? "stale_provider_binding" : "",
          gate.hasGoverningObjectDrift ? "stale_governing_object" : "",
          gate.hasContinuityDrift ? "stale_continuity_evidence" : "",
          !gate.manageWritable ? "manage_not_writable" : "",
        ]);
        recoveryRouteRef = "booking_manage_refresh_same_shell";
      } else if (
        !policy.supportsCancel ||
        !capability.resolved.projection.manageActionRefs.includes("cancel_appointment")
      ) {
        result = "unsupported_capability";
        reasonCodes = buildReasonCodeList(reasonCodes, ["cancel_not_supported"]);
        recoveryRouteRef = "booking_manage_read_only";
      } else if (
        !evaluateCancelablePredicate({
          appointmentStartAt: selectedSlot.startAt,
          evaluatedAt: occurredAt,
          cutoffMinutes: defaultAppointmentManageWindowPolicy(
            capability.resolved.providerAdapterBinding.manageSupportContractRef,
          ).cancelCutoffMinutes,
          hasLiveFence,
          appointmentStatus: appointment.appointmentStatus,
        })
      ) {
        result = "stale_recoverable";
        reasonCodes = buildReasonCodeList(reasonCodes, ["cancel_window_elapsed"]);
        recoveryRouteRef = "booking_manage_window_elapsed";
      } else {
        updatedAppointment = mutateAppointment(
          appointment,
          {
            appointmentStatus:
              input.supplierOutcome.kind === "authoritative_cancelled"
                ? "cancelled"
                : "cancellation_pending",
            manageSupportContractRef:
              capability.resolved.providerAdapterBinding.manageSupportContractRef,
            manageCapabilities: capability.resolved.projection.manageActionRefs,
            manageCapabilityProjectionRef:
              capability.resolved.projection.bookingCapabilityProjectionId,
          },
          occurredAt,
        );
        await saveAppointment(updatedAppointment, appointment.version);

        if (input.supplierOutcome.kind === "authoritative_cancelled") {
          result = "applied";
          transitionEnvelopeRef = "booking_manage_cancelled_authoritatively";
          if ((input.successDisposition ?? "close_case") === "rebook_in_place") {
            await bookingCaseApplication.beginLocalSearch({
              bookingCaseId: bookingCase.bookingCase.bookingCaseId,
              actorRef: input.actorRef,
              routeIntentBindingRef: input.routeIntentBindingRef,
              commandActionRecordRef: `${input.commandActionRecordRef}::rebook`,
              commandSettlementRecordRef: `${input.commandSettlementRecordRef}::rebook`,
              recordedAt: occurredAt,
              sourceDecisionEpochRef: bookingCase.bookingIntent.decisionEpochRef,
              sourceDecisionSupersessionRef:
                bookingCase.bookingIntent.decisionSupersessionRecordRef,
              lineageCaseLinkRef: bookingCase.bookingCase.lineageCaseLinkRef,
              requestLifecycleLeaseRef: bookingCase.bookingCase.requestLifecycleLeaseRef,
              ownershipEpoch: bookingCase.bookingCase.ownershipEpoch,
              fencingToken: bookingCase.bookingIntent.fencingToken,
              currentLineageFenceEpoch: bookingCase.bookingIntent.currentLineageFenceEpoch,
              reasonCode: "appointment_cancelled_rebook_in_place",
              currentOfferSessionRef: bookingCase.bookingCase.currentOfferSessionRef,
              selectedSlotRef: bookingCase.bookingCase.selectedSlotRef,
              appointmentRef: appointment.appointmentRecordId,
              latestConfirmationTruthProjectionRef:
                bookingCase.bookingCase.latestConfirmationTruthProjectionRef,
              searchPolicy: bookingCase.searchPolicy,
            });
            bookingCase = (await bookingCaseApplication.queryBookingCase(
              bookingCase.bookingCase.bookingCaseId,
            ))!;
          } else {
            await bookingCaseApplication.closeBookingCase({
              bookingCaseId: bookingCase.bookingCase.bookingCaseId,
              actorRef: input.actorRef,
              routeIntentBindingRef: input.routeIntentBindingRef,
              commandActionRecordRef: `${input.commandActionRecordRef}::close`,
              commandSettlementRecordRef: `${input.commandSettlementRecordRef}::close`,
              recordedAt: occurredAt,
              sourceDecisionEpochRef: bookingCase.bookingIntent.decisionEpochRef,
              sourceDecisionSupersessionRef:
                bookingCase.bookingIntent.decisionSupersessionRecordRef,
              lineageCaseLinkRef: bookingCase.bookingCase.lineageCaseLinkRef,
              requestLifecycleLeaseRef: bookingCase.bookingCase.requestLifecycleLeaseRef,
              ownershipEpoch: bookingCase.bookingCase.ownershipEpoch,
              fencingToken: bookingCase.bookingIntent.fencingToken,
              currentLineageFenceEpoch: bookingCase.bookingIntent.currentLineageFenceEpoch,
              reasonCode: "appointment_cancelled_authoritatively",
              appointmentRef: appointment.appointmentRecordId,
            });
            bookingCase = (await bookingCaseApplication.queryBookingCase(
              bookingCase.bookingCase.bookingCaseId,
            ))!;
          }
        } else if (input.supplierOutcome.kind === "supplier_pending") {
          result = "supplier_pending";
          reasonCodes = buildReasonCodeList(reasonCodes, [input.supplierOutcome.blockerReasonCode]);
          recoveryRouteRef = input.supplierOutcome.recoveryMode;
        } else {
          result = "reconciliation_required";
          reasonCodes = buildReasonCodeList(reasonCodes, [
            input.supplierOutcome.kind === "reconciliation_required"
              ? input.supplierOutcome.blockerReasonCode
              : input.supplierOutcome.failureReasonCode,
          ]);
          recoveryRouteRef =
            input.supplierOutcome.kind === "reconciliation_required"
              ? input.supplierOutcome.recoveryMode
              : "reconcile_cancellation_outcome";
          await bookingCaseApplication.markSupplierReconciliationPending({
            bookingCaseId: bookingCase.bookingCase.bookingCaseId,
            actorRef: input.actorRef,
            routeIntentBindingRef: input.routeIntentBindingRef,
            commandActionRecordRef: `${input.commandActionRecordRef}::reconcile`,
            commandSettlementRecordRef: `${input.commandSettlementRecordRef}::reconcile`,
            recordedAt: occurredAt,
            sourceDecisionEpochRef: bookingCase.bookingIntent.decisionEpochRef,
            sourceDecisionSupersessionRef:
              bookingCase.bookingIntent.decisionSupersessionRecordRef,
            lineageCaseLinkRef: bookingCase.bookingCase.lineageCaseLinkRef,
            requestLifecycleLeaseRef: bookingCase.bookingCase.requestLifecycleLeaseRef,
            ownershipEpoch: bookingCase.bookingCase.ownershipEpoch,
            fencingToken: bookingCase.bookingIntent.fencingToken,
            currentLineageFenceEpoch: bookingCase.bookingIntent.currentLineageFenceEpoch,
            reasonCode: "appointment_cancellation_reconciliation_required",
            appointmentRef: appointment.appointmentRecordId,
            latestConfirmationTruthProjectionRef:
              bookingCase.bookingCase.latestConfirmationTruthProjectionRef,
          });
          bookingCase = (await bookingCaseApplication.queryBookingCase(
            bookingCase.bookingCase.bookingCaseId,
          ))!;
        }
      }

      const persisted = await appointmentManageService.submitCancellation({
        appointmentId: appointment.appointmentRecordId,
        bookingCaseId: bookingCase.bookingCase.bookingCaseId,
        actionScope: "appointment_cancel",
        routeIntentBindingRef: input.routeIntentBindingRef,
        routeIntentTupleHash: gate.routeIntentTupleHash,
        canonicalObjectDescriptorRef: "AppointmentRecord",
        governingObjectVersionRef: buildAppointmentVersionRef(updatedAppointment),
        routeContractDigest: buildRouteContractDigest({
          routeFamilyRef,
          surfaceRouteContractRef: input.surfaceRouteContractRef,
          actionScope: "appointment_cancel",
        }),
        policyBundleRef:
          bookingCase.searchPolicy?.policyBundleHash ??
          sourceTransaction.policyBundleHash,
        capabilityResolutionRef:
          capability.resolved.resolution.bookingCapabilityResolutionId,
        capabilityTupleHash: capability.resolved.resolution.capabilityTupleHash,
        providerAdapterBindingRef:
          capability.resolved.providerAdapterBinding.bookingProviderAdapterBindingId,
        providerAdapterBindingHash:
          capability.resolved.providerAdapterBinding.bindingHash,
        freshnessToken: buildFreshnessToken({
          appointmentVersionRef: buildAppointmentVersionRef(updatedAppointment),
          capabilityTupleHash: capability.resolved.resolution.capabilityTupleHash,
          providerAdapterBindingHash: capability.resolved.providerAdapterBinding.bindingHash,
          bookingConfirmationTruthProjectionRef:
            currentCommit.confirmationTruthProjection.bookingConfirmationTruthProjectionId,
        }),
        governingFenceEpoch: bookingCase.bookingIntent.currentLineageFenceEpoch,
        surfacePublicationRef: input.surfacePublicationRef,
        runtimePublicationBundleRef: input.runtimePublicationBundleRef,
        idempotencyKey: input.idempotencyKey,
        actorMode: input.actorMode,
        selectedAnchorRef,
        routeFamilyRef,
        experienceContinuityEvidenceRef,
        continuityState:
          result === "applied" && updatedAppointment.appointmentStatus === "cancelled"
            ? "summary_only"
            : result === "supplier_pending"
              ? "summary_only"
              : result === "reconciliation_required"
                ? "blocked_recovery"
                : "stale_recovery",
        writableState:
          result === "applied" && updatedAppointment.appointmentStatus === "cancelled"
            ? "recovery_only"
            : result === "supplier_pending"
              ? "summary_only"
              : "recovery_only",
        bookingConfirmationTruthProjectionRef:
          currentCommit.confirmationTruthProjection.bookingConfirmationTruthProjectionId,
        appointmentLineageRef: buildAppointmentLineageRef(updatedAppointment),
        appointmentRecordRef: updatedAppointment.appointmentRecordId,
        semanticPayload: {
          cancelReasonCode: input.cancelReasonCode,
          successDisposition: input.successDisposition ?? "close_case",
          supplierOutcome: input.supplierOutcome,
        },
        result,
        receiptTextRef:
          result === "applied"
            ? "booking_manage_cancelled"
            : result === "supplier_pending"
              ? "booking_manage_cancel_pending"
              : result === "reconciliation_required"
                ? "booking_manage_cancel_reconciliation"
                : "booking_manage_cancel_recovery",
        reasonCodes,
        transitionEnvelopeRef,
        releaseRecoveryDispositionRef: bookingCase.bookingCase.releaseRecoveryDispositionRef,
        routeFreezeDispositionRef: bookingCase.bookingCase.routeFreezeDispositionRef,
        recoveryRouteRef,
        presentationArtifactRef:
          updatedAppointment.presentationArtifactRef ??
          `artifact://booking/appointment/${updatedAppointment.appointmentRecordId}`,
        recordedAt: occurredAt,
        emitBookingCancelledEvent:
          input.supplierOutcome.kind === "authoritative_cancelled",
      });
      emittedEvents = persisted.emittedEvents;

      const latestManage = await appointmentManageService.queryCurrentAppointmentManage(
        appointment.appointmentRecordId,
      );
      const { continuity } = await refreshContinuityFor(
        updatedAppointment,
        bookingCase,
        currentCommit.confirmationTruthProjection,
        capability,
        latestManage,
        {
          continuityEvidenceState: continuityEvidenceState(input.continuityEvidenceState),
          routeIntentBindingRef: input.routeIntentBindingRef,
          routeIntentTupleHash: gate.routeIntentTupleHash,
          selectedAnchorRef,
          routeFamilyRef,
          surfacePublicationRef: input.surfacePublicationRef,
          runtimePublicationBundleRef: input.runtimePublicationBundleRef,
          experienceContinuityEvidenceRef,
          hasTupleDrift: gate.hasTupleDrift || gate.hasGoverningObjectDrift,
          hasCapabilityDrift: gate.hasCapabilityDrift,
          hasBindingDrift: gate.hasBindingDrift,
          hasContinuityDrift: gate.hasContinuityDrift,
        },
      );

      const finalAppointment = mutateAppointment(
        updatedAppointment,
        {
          latestManageSettlementRef: persisted.settlement.bookingManageSettlementId,
        },
        occurredAt,
      );
      await saveAppointment(finalAppointment, updatedAppointment.version);
      return buildResult(
        finalAppointment,
        bookingCase,
        currentCommit,
        capability,
        latestManage,
        continuity,
        persisted.replayed,
        emittedEvents,
        null,
        null,
      );
    },

    async submitRescheduleAppointment(input) {
      const occurredAt = ensureIsoTimestamp(input.occurredAt, "occurredAt");
      let {
        appointment,
        bookingCase,
        currentCommit,
        sourceTransaction,
        selectedSlot,
      } = await requireManageContext(input.appointmentId, occurredAt);
      const currentManage =
        await appointmentManageService.queryCurrentAppointmentManage(appointment.appointmentRecordId);
      const capability = await resolveManageCapability(
        "appointment_reschedule",
        input,
        appointment,
        bookingCase,
      );
      const gate = await requireLiveMutationPreconditions(
        input,
        appointment,
        bookingCase,
        capability,
        currentManage,
        currentCommit.confirmationTruthProjection,
      );
      const routeFamilyRef =
        optionalRef(input.routeFamilyRef) ?? buildDefaultRouteFamilyRef(input.actorMode);
      const selectedAnchorRef =
        optionalRef(input.selectedAnchorRef) ?? appointment.appointmentRecordId;
      const experienceContinuityEvidenceRef =
        optionalRef(input.experienceContinuityEvidenceRef) ??
        buildDefaultExperienceContinuityEvidenceRef(appointment.appointmentRecordId);
      const policy = resolveManageSupportPolicy(capability.resolved.providerAdapterBinding);
      const hasLiveFence =
        currentManage !== null &&
        currentManage.continuityEvidence.writableState !== "writable" &&
        (currentManage.command.actionScope === "appointment_cancel" ||
          currentManage.command.actionScope === "appointment_reschedule");
      let result: BookingManageSettlementResult;
      let reasonCodes: string[] = [];
      let recoveryRouteRef: string | null = null;
      let updatedAppointment = appointment;
      let replacementOfferSessionId: string | null = null;
      let replacementSlotSnapshotId: string | null = null;

      if (
        gate.hasTupleDrift ||
        gate.hasCapabilityDrift ||
        gate.hasBindingDrift ||
        gate.hasGoverningObjectDrift ||
        gate.hasContinuityDrift ||
        !gate.manageWritable
      ) {
        result = "stale_recoverable";
        reasonCodes = buildReasonCodeList([
          gate.hasTupleDrift ? "stale_route_tuple" : "",
          gate.hasCapabilityDrift ? "stale_capability_tuple" : "",
          gate.hasBindingDrift ? "stale_provider_binding" : "",
          gate.hasGoverningObjectDrift ? "stale_governing_object" : "",
          gate.hasContinuityDrift ? "stale_continuity_evidence" : "",
          !gate.manageWritable ? "manage_not_writable" : "",
        ]);
        recoveryRouteRef = "booking_manage_refresh_same_shell";
      } else if (
        !policy.supportsReschedule ||
        !capability.resolved.projection.manageActionRefs.includes("reschedule_appointment")
      ) {
        result = "unsupported_capability";
        reasonCodes = ["reschedule_not_supported"];
        recoveryRouteRef = "booking_manage_read_only";
      } else if (
        !evaluateReschedulablePredicate({
          appointmentStartAt: selectedSlot.startAt,
          evaluatedAt: occurredAt,
          cutoffMinutes: defaultAppointmentManageWindowPolicy(
            capability.resolved.providerAdapterBinding.manageSupportContractRef,
          ).amendCutoffMinutes,
          hasLiveFence,
          appointmentStatus: appointment.appointmentStatus,
        })
      ) {
        result = "stale_recoverable";
        reasonCodes = ["reschedule_window_elapsed"];
        recoveryRouteRef = "booking_manage_window_elapsed";
      } else {
        updatedAppointment = mutateAppointment(
          appointment,
          {
            appointmentStatus: "reschedule_in_progress",
            manageSupportContractRef:
              capability.resolved.providerAdapterBinding.manageSupportContractRef,
            manageCapabilities: capability.resolved.projection.manageActionRefs,
            manageCapabilityProjectionRef:
              capability.resolved.projection.bookingCapabilityProjectionId,
          },
          occurredAt,
        );
        await saveAppointment(updatedAppointment, appointment.version);
        await bookingCaseApplication.beginLocalSearch({
          bookingCaseId: bookingCase.bookingCase.bookingCaseId,
          actorRef: input.actorRef,
          routeIntentBindingRef: input.routeIntentBindingRef,
          commandActionRecordRef: `${input.commandActionRecordRef}::begin_search`,
          commandSettlementRecordRef: `${input.commandSettlementRecordRef}::begin_search`,
          recordedAt: occurredAt,
          sourceDecisionEpochRef: bookingCase.bookingIntent.decisionEpochRef,
          sourceDecisionSupersessionRef:
            bookingCase.bookingIntent.decisionSupersessionRecordRef,
          lineageCaseLinkRef: bookingCase.bookingCase.lineageCaseLinkRef,
          requestLifecycleLeaseRef: bookingCase.bookingCase.requestLifecycleLeaseRef,
          ownershipEpoch: bookingCase.bookingCase.ownershipEpoch,
          fencingToken: bookingCase.bookingIntent.fencingToken,
          currentLineageFenceEpoch: bookingCase.bookingIntent.currentLineageFenceEpoch,
          reasonCode: "appointment_reschedule_started",
          activeCapabilityResolutionRef:
            requireRef(
              bookingCase.bookingCase.activeCapabilityResolutionRef,
              "activeCapabilityResolutionRef",
            ),
          activeCapabilityProjectionRef:
            requireRef(
              bookingCase.bookingCase.activeCapabilityProjectionRef,
              "activeCapabilityProjectionRef",
            ),
          activeProviderAdapterBindingRef:
            requireRef(
              bookingCase.bookingCase.activeProviderAdapterBindingRef,
              "activeProviderAdapterBindingRef",
            ),
          capabilityState: capability.diagnostics.resolution.capabilityState,
          appointmentRef: appointment.appointmentRecordId,
          latestConfirmationTruthProjectionRef:
            appointment.confirmationTruthProjectionRef,
          searchPolicy: bookingCase.searchPolicy,
        });
        bookingCase = (await bookingCaseApplication.queryBookingCase(
          bookingCase.bookingCase.bookingCaseId,
        ))!;
        ({ replacementOfferSessionId, replacementSlotSnapshotId } =
          await bootstrapReplacementSearch(
            bookingCase.bookingCase.bookingCaseId,
            input.bootstrapReplacementSearch,
            input.subjectRef,
          ));
        bookingCase = (await bookingCaseApplication.queryBookingCase(
          bookingCase.bookingCase.bookingCaseId,
        ))!;
        result = "applied";
      }

      const persisted = await appointmentManageService.submitReschedule({
        appointmentId: appointment.appointmentRecordId,
        bookingCaseId: bookingCase.bookingCase.bookingCaseId,
        actionScope: "appointment_reschedule",
        routeIntentBindingRef: input.routeIntentBindingRef,
        routeIntentTupleHash: gate.routeIntentTupleHash,
        canonicalObjectDescriptorRef: "AppointmentRecord",
        governingObjectVersionRef: buildAppointmentVersionRef(updatedAppointment),
        routeContractDigest: buildRouteContractDigest({
          routeFamilyRef,
          surfaceRouteContractRef: input.surfaceRouteContractRef,
          actionScope: "appointment_reschedule",
        }),
        policyBundleRef:
          bookingCase.searchPolicy?.policyBundleHash ??
          sourceTransaction.policyBundleHash,
        capabilityResolutionRef:
          capability.resolved.resolution.bookingCapabilityResolutionId,
        capabilityTupleHash: capability.resolved.resolution.capabilityTupleHash,
        providerAdapterBindingRef:
          capability.resolved.providerAdapterBinding.bookingProviderAdapterBindingId,
        providerAdapterBindingHash:
          capability.resolved.providerAdapterBinding.bindingHash,
        freshnessToken: buildFreshnessToken({
          appointmentVersionRef: buildAppointmentVersionRef(updatedAppointment),
          capabilityTupleHash: capability.resolved.resolution.capabilityTupleHash,
          providerAdapterBindingHash: capability.resolved.providerAdapterBinding.bindingHash,
          bookingConfirmationTruthProjectionRef:
            currentCommit.confirmationTruthProjection.bookingConfirmationTruthProjectionId,
        }),
        governingFenceEpoch: bookingCase.bookingIntent.currentLineageFenceEpoch,
        surfacePublicationRef: input.surfacePublicationRef,
        runtimePublicationBundleRef: input.runtimePublicationBundleRef,
        idempotencyKey: input.idempotencyKey,
        actorMode: input.actorMode,
        selectedAnchorRef,
        routeFamilyRef,
        experienceContinuityEvidenceRef,
        continuityState: result === "applied" ? "summary_only" : "stale_recovery",
        writableState: result === "applied" ? "summary_only" : "recovery_only",
        bookingConfirmationTruthProjectionRef:
          currentCommit.confirmationTruthProjection.bookingConfirmationTruthProjectionId,
        appointmentLineageRef: buildAppointmentLineageRef(updatedAppointment),
        appointmentRecordRef: updatedAppointment.appointmentRecordId,
        semanticPayload: {
          bootstrapReplacementSearch: input.bootstrapReplacementSearch
            ? { createOfferSession: input.bootstrapReplacementSearch.createOfferSession ?? true }
            : null,
        },
        result,
        receiptTextRef:
          result === "applied"
            ? "booking_manage_reschedule_started"
            : "booking_manage_reschedule_recovery",
        reasonCodes,
        transitionEnvelopeRef:
          result === "applied" ? "booking_reschedule_chain_open" : null,
        releaseRecoveryDispositionRef: bookingCase.bookingCase.releaseRecoveryDispositionRef,
        routeFreezeDispositionRef: bookingCase.bookingCase.routeFreezeDispositionRef,
        recoveryRouteRef,
        presentationArtifactRef:
          updatedAppointment.presentationArtifactRef ??
          `artifact://booking/appointment/${updatedAppointment.appointmentRecordId}`,
        recordedAt: occurredAt,
        emitBookingRescheduleStartedEvent: result === "applied",
      });
      const latestManage = await appointmentManageService.queryCurrentAppointmentManage(
        appointment.appointmentRecordId,
      );
      const { continuity } = await refreshContinuityFor(
        updatedAppointment,
        bookingCase,
        currentCommit.confirmationTruthProjection,
        capability,
        latestManage,
        {
          continuityEvidenceState: continuityEvidenceState(input.continuityEvidenceState),
          routeIntentBindingRef: input.routeIntentBindingRef,
          routeIntentTupleHash: gate.routeIntentTupleHash,
          selectedAnchorRef,
          routeFamilyRef,
          surfacePublicationRef: input.surfacePublicationRef,
          runtimePublicationBundleRef: input.runtimePublicationBundleRef,
          experienceContinuityEvidenceRef,
          hasTupleDrift: gate.hasTupleDrift || gate.hasGoverningObjectDrift,
          hasCapabilityDrift: gate.hasCapabilityDrift,
          hasBindingDrift: gate.hasBindingDrift,
          hasContinuityDrift: gate.hasContinuityDrift,
        },
      );
      const finalAppointment = mutateAppointment(
        updatedAppointment,
        {
          latestManageSettlementRef: persisted.settlement.bookingManageSettlementId,
        },
        occurredAt,
      );
      await saveAppointment(finalAppointment, updatedAppointment.version);
      return buildResult(
        finalAppointment,
        bookingCase,
        currentCommit,
        capability,
        latestManage,
        continuity,
        persisted.replayed,
        persisted.emittedEvents,
        replacementOfferSessionId,
        replacementSlotSnapshotId,
      );
    },

    async abandonAppointmentReschedule(input) {
      const occurredAt = ensureIsoTimestamp(input.occurredAt, "occurredAt");
      let { appointment, bookingCase, currentCommit } = await requireManageContext(
        input.appointmentId,
        occurredAt,
      );
      const currentManage =
        await appointmentManageService.queryCurrentAppointmentManage(appointment.appointmentRecordId);
      const capability = await resolveManageCapability(
        "appointment_reschedule_abandon",
        input,
        appointment,
        bookingCase,
      );
      const routeFamilyRef =
        optionalRef(input.routeFamilyRef) ?? buildDefaultRouteFamilyRef(input.actorMode);
      const selectedAnchorRef =
        optionalRef(input.selectedAnchorRef) ?? appointment.appointmentRecordId;
      const experienceContinuityEvidenceRef =
        optionalRef(input.experienceContinuityEvidenceRef) ??
        buildDefaultExperienceContinuityEvidenceRef(appointment.appointmentRecordId);

      let result: BookingManageSettlementResult;
      let reasonCodes = buildReasonCodeList(input.reasonCodes ?? []);
      let recoveryRouteRef: string | null = null;
      let updatedAppointment = appointment;

      if (appointment.appointmentStatus !== "reschedule_in_progress") {
        result = "stale_recoverable";
        reasonCodes = buildReasonCodeList(reasonCodes, ["reschedule_not_in_progress"]);
        recoveryRouteRef = "booking_manage_refresh_same_shell";
      } else if (
        ![
          "searching_local",
          "offers_ready",
          "selecting",
          "revalidating",
          "commit_pending",
        ].includes(bookingCase.bookingCase.status)
      ) {
        result = "stale_recoverable";
        reasonCodes = buildReasonCodeList(reasonCodes, ["reschedule_restore_state_drift"]);
        recoveryRouteRef = "booking_manage_refresh_same_shell";
      } else {
        updatedAppointment = mutateAppointment(
          appointment,
          {
            appointmentStatus: "booked",
          },
          occurredAt,
        );
        await saveAppointment(updatedAppointment, appointment.version);
        const transactionDocument =
          await bookingCommitApplication.bookingCommitRepositories.getBookingTransaction(
            appointment.bookingTransactionRef,
          );
        invariant(
          transactionDocument,
          "BOOKING_TRANSACTION_NOT_FOUND",
          `BookingTransaction ${appointment.bookingTransactionRef} was not found.`,
        );
        const transaction = transactionDocument.toSnapshot();
        await bookingCaseApplication.markManaged({
          bookingCaseId: bookingCase.bookingCase.bookingCaseId,
          actorRef: input.actorRef,
          routeIntentBindingRef: input.routeIntentBindingRef,
          commandActionRecordRef: `${input.commandActionRecordRef}::restore`,
          commandSettlementRecordRef: `${input.commandSettlementRecordRef}::restore`,
          recordedAt: occurredAt,
          sourceDecisionEpochRef: bookingCase.bookingIntent.decisionEpochRef,
          sourceDecisionSupersessionRef:
            bookingCase.bookingIntent.decisionSupersessionRecordRef,
          lineageCaseLinkRef: bookingCase.bookingCase.lineageCaseLinkRef,
          requestLifecycleLeaseRef: bookingCase.bookingCase.requestLifecycleLeaseRef,
          ownershipEpoch: bookingCase.bookingCase.ownershipEpoch,
          fencingToken: bookingCase.bookingIntent.fencingToken,
          currentLineageFenceEpoch: bookingCase.bookingIntent.currentLineageFenceEpoch,
          reasonCode: "appointment_reschedule_abandoned",
          currentOfferSessionRef: transaction.offerSessionRef,
          selectedSlotRef: appointment.selectedSlotRef,
          appointmentRef: appointment.appointmentRecordId,
          latestConfirmationTruthProjectionRef:
            appointment.confirmationTruthProjectionRef,
        });
        bookingCase = (await bookingCaseApplication.queryBookingCase(
          bookingCase.bookingCase.bookingCaseId,
        ))!;
        result = "applied";
      }

      const routeIntentTupleHash = buildRouteTupleHash({
        appointmentId: appointment.appointmentRecordId,
        actionScope: "appointment_reschedule_abandon",
        routeIntentBindingRef: input.routeIntentBindingRef,
        surfaceRouteContractRef: input.surfaceRouteContractRef,
        surfacePublicationRef: input.surfacePublicationRef,
        runtimePublicationBundleRef: input.runtimePublicationBundleRef,
      });

      const persisted = await appointmentManageService.abandonReschedule({
        appointmentId: appointment.appointmentRecordId,
        bookingCaseId: bookingCase.bookingCase.bookingCaseId,
        actionScope: "appointment_reschedule_abandon",
        routeIntentBindingRef: input.routeIntentBindingRef,
        routeIntentTupleHash,
        canonicalObjectDescriptorRef: "AppointmentRecord",
        governingObjectVersionRef: buildAppointmentVersionRef(updatedAppointment),
        routeContractDigest: buildRouteContractDigest({
          routeFamilyRef,
          surfaceRouteContractRef: input.surfaceRouteContractRef,
          actionScope: "appointment_reschedule_abandon",
        }),
        policyBundleRef:
          bookingCase.searchPolicy?.policyBundleHash ??
          `booking_manage_policy_bundle::${bookingCase.bookingCase.bookingCaseId}`,
        capabilityResolutionRef:
          capability.resolved.resolution.bookingCapabilityResolutionId,
        capabilityTupleHash: capability.resolved.resolution.capabilityTupleHash,
        providerAdapterBindingRef:
          capability.resolved.providerAdapterBinding.bookingProviderAdapterBindingId,
        providerAdapterBindingHash:
          capability.resolved.providerAdapterBinding.bindingHash,
        freshnessToken: buildFreshnessToken({
          appointmentVersionRef: buildAppointmentVersionRef(updatedAppointment),
          capabilityTupleHash: capability.resolved.resolution.capabilityTupleHash,
          providerAdapterBindingHash: capability.resolved.providerAdapterBinding.bindingHash,
          bookingConfirmationTruthProjectionRef:
            currentCommit.confirmationTruthProjection.bookingConfirmationTruthProjectionId,
        }),
        governingFenceEpoch: bookingCase.bookingIntent.currentLineageFenceEpoch,
        surfacePublicationRef: input.surfacePublicationRef,
        runtimePublicationBundleRef: input.runtimePublicationBundleRef,
        idempotencyKey: input.idempotencyKey,
        actorMode: input.actorMode,
        selectedAnchorRef,
        routeFamilyRef,
        experienceContinuityEvidenceRef,
        continuityState: result === "applied" ? "live" : "stale_recovery",
        writableState: result === "applied" ? "writable" : "recovery_only",
        bookingConfirmationTruthProjectionRef:
          currentCommit.confirmationTruthProjection.bookingConfirmationTruthProjectionId,
        appointmentLineageRef: buildAppointmentLineageRef(updatedAppointment),
        appointmentRecordRef: updatedAppointment.appointmentRecordId,
        semanticPayload: { reasonCodes },
        result,
        receiptTextRef:
          result === "applied"
            ? "booking_manage_reschedule_restored"
            : "booking_manage_reschedule_restore_recovery",
        reasonCodes,
        transitionEnvelopeRef:
          result === "applied" ? "booking_reschedule_restored" : null,
        releaseRecoveryDispositionRef: bookingCase.bookingCase.releaseRecoveryDispositionRef,
        routeFreezeDispositionRef: bookingCase.bookingCase.routeFreezeDispositionRef,
        recoveryRouteRef,
        presentationArtifactRef:
          updatedAppointment.presentationArtifactRef ??
          `artifact://booking/appointment/${updatedAppointment.appointmentRecordId}`,
        recordedAt: occurredAt,
      });
      const latestManage = await appointmentManageService.queryCurrentAppointmentManage(
        appointment.appointmentRecordId,
      );
      const { continuity } = await refreshContinuityFor(
        updatedAppointment,
        bookingCase,
        currentCommit.confirmationTruthProjection,
        capability,
        latestManage,
        {
          continuityEvidenceState: continuityEvidenceState(input.continuityEvidenceState),
          routeIntentBindingRef: input.routeIntentBindingRef,
          routeIntentTupleHash,
          selectedAnchorRef,
          routeFamilyRef,
          surfacePublicationRef: input.surfacePublicationRef,
          runtimePublicationBundleRef: input.runtimePublicationBundleRef,
          experienceContinuityEvidenceRef,
          hasTupleDrift: result !== "applied",
          hasCapabilityDrift: false,
          hasBindingDrift: false,
          hasContinuityDrift: false,
        },
      );
      const finalAppointment = mutateAppointment(
        updatedAppointment,
        {
          latestManageSettlementRef: persisted.settlement.bookingManageSettlementId,
        },
        occurredAt,
      );
      await saveAppointment(finalAppointment, updatedAppointment.version);
      return buildResult(
        finalAppointment,
        bookingCase,
        currentCommit,
        capability,
        latestManage,
        continuity,
        persisted.replayed,
        persisted.emittedEvents,
        null,
        null,
      );
    },

    async submitAppointmentDetailUpdate(input) {
      const occurredAt = ensureIsoTimestamp(input.occurredAt, "occurredAt");
      let { appointment, bookingCase, currentCommit } = await requireManageContext(
        input.appointmentId,
        occurredAt,
      );
      const manageActionScope =
        input.updateScope === "reminder_change" ? "reminder_change" : "appointment_detail_update";
      const currentManage =
        await appointmentManageService.queryCurrentAppointmentManage(appointment.appointmentRecordId);
      const capability = await resolveManageCapability(
        manageActionScope,
        input,
        appointment,
        bookingCase,
      );
      const gate = await requireLiveMutationPreconditions(
        input,
        appointment,
        bookingCase,
        capability,
        currentManage,
        currentCommit.confirmationTruthProjection,
      );
      const routeFamilyRef =
        optionalRef(input.routeFamilyRef) ?? buildDefaultRouteFamilyRef(input.actorMode);
      const selectedAnchorRef =
        optionalRef(input.selectedAnchorRef) ?? appointment.appointmentRecordId;
      const experienceContinuityEvidenceRef =
        optionalRef(input.experienceContinuityEvidenceRef) ??
        buildDefaultExperienceContinuityEvidenceRef(appointment.appointmentRecordId);
      const policy = resolveManageSupportPolicy(capability.resolved.providerAdapterBinding);
      const routeIntentTupleHash = gate.routeIntentTupleHash;
      const entries = Object.entries(input.details).sort(([left], [right]) => left.localeCompare(right));
      let result: BookingManageSettlementResult;
      let reasonCodes: string[] = [];
      let recoveryRouteRef: string | null = null;
      let contactRouteRepairJourneyRef: string | null = null;
      let updatedAppointment = appointment;

      if (
        gate.hasTupleDrift ||
        gate.hasCapabilityDrift ||
        gate.hasBindingDrift ||
        gate.hasGoverningObjectDrift ||
        gate.hasContinuityDrift ||
        !gate.manageWritable
      ) {
        result = "stale_recoverable";
        reasonCodes = buildReasonCodeList([
          gate.hasTupleDrift ? "stale_route_tuple" : "",
          gate.hasCapabilityDrift ? "stale_capability_tuple" : "",
          gate.hasBindingDrift ? "stale_provider_binding" : "",
          gate.hasGoverningObjectDrift ? "stale_governing_object" : "",
          gate.hasContinuityDrift ? "stale_continuity_evidence" : "",
          !gate.manageWritable ? "manage_not_writable" : "",
        ]);
        recoveryRouteRef = "booking_manage_refresh_same_shell";
      } else if (
        manageActionScope === "reminder_change"
          ? !policy.supportsReminderChange
          : !policy.supportsDetailUpdate
      ) {
        result = "unsupported_capability";
        reasonCodes = [
          manageActionScope === "reminder_change"
            ? "reminder_change_not_supported"
            : "detail_update_not_supported",
        ];
      } else if (
        entries.some(([field]) => !policy.allowedDetailFields.includes(field))
      ) {
        result = "unsupported_capability";
        reasonCodes = ["field_not_allowed_by_manage_contract"];
      } else if (
        entries.some(([, value]) => isClinicallyMeaningfulFreeText(value))
      ) {
        result = "safety_preempted";
        reasonCodes = ["clinically_meaningful_free_text_detected"];
        recoveryRouteRef = "request_shell_safety_preempted";
      } else if (
        input.contactDependencyState === "blocked" &&
        entries.some(([field]) => policy.contactDependentFields.includes(field))
      ) {
        result = "stale_recoverable";
        reasonCodes = ["contact_route_dependency_blocked"];
        recoveryRouteRef = "contact_route_repair";
        contactRouteRepairJourneyRef = `contact_route_repair_journey_${appointment.appointmentRecordId}`;
      } else {
        result = "applied";
        updatedAppointment = mutateAppointment(
          appointment,
          {
            administrativeDetails: Object.freeze({
              ...appointment.administrativeDetails,
              ...Object.fromEntries(entries),
            }),
            manageSupportContractRef:
              capability.resolved.providerAdapterBinding.manageSupportContractRef,
            manageCapabilities: capability.resolved.projection.manageActionRefs,
            manageCapabilityProjectionRef:
              capability.resolved.projection.bookingCapabilityProjectionId,
          },
          occurredAt,
        );
        await saveAppointment(updatedAppointment, appointment.version);
      }

      const persisted = await appointmentManageService.submitDetailUpdate({
        appointmentId: appointment.appointmentRecordId,
        bookingCaseId: bookingCase.bookingCase.bookingCaseId,
        actionScope: manageActionScope,
        routeIntentBindingRef: input.routeIntentBindingRef,
        routeIntentTupleHash,
        canonicalObjectDescriptorRef: "AppointmentRecord",
        governingObjectVersionRef: buildAppointmentVersionRef(updatedAppointment),
        routeContractDigest: buildRouteContractDigest({
          routeFamilyRef,
          surfaceRouteContractRef: input.surfaceRouteContractRef,
          actionScope: manageActionScope,
        }),
        policyBundleRef:
          bookingCase.searchPolicy?.policyBundleHash ??
          `booking_manage_policy_bundle::${bookingCase.bookingCase.bookingCaseId}`,
        capabilityResolutionRef:
          capability.resolved.resolution.bookingCapabilityResolutionId,
        capabilityTupleHash: capability.resolved.resolution.capabilityTupleHash,
        providerAdapterBindingRef:
          capability.resolved.providerAdapterBinding.bookingProviderAdapterBindingId,
        providerAdapterBindingHash:
          capability.resolved.providerAdapterBinding.bindingHash,
        freshnessToken: buildFreshnessToken({
          appointmentVersionRef: buildAppointmentVersionRef(updatedAppointment),
          capabilityTupleHash: capability.resolved.resolution.capabilityTupleHash,
          providerAdapterBindingHash: capability.resolved.providerAdapterBinding.bindingHash,
          bookingConfirmationTruthProjectionRef:
            currentCommit.confirmationTruthProjection.bookingConfirmationTruthProjectionId,
        }),
        governingFenceEpoch: bookingCase.bookingIntent.currentLineageFenceEpoch,
        surfacePublicationRef: input.surfacePublicationRef,
        runtimePublicationBundleRef: input.runtimePublicationBundleRef,
        idempotencyKey: input.idempotencyKey,
        actorMode: input.actorMode,
        selectedAnchorRef,
        routeFamilyRef,
        experienceContinuityEvidenceRef,
        continuityState:
          result === "applied"
            ? "live"
            : result === "safety_preempted"
              ? "blocked_recovery"
              : "stale_recovery",
        writableState: result === "applied" ? "writable" : "recovery_only",
        bookingConfirmationTruthProjectionRef:
          currentCommit.confirmationTruthProjection.bookingConfirmationTruthProjectionId,
        appointmentLineageRef: buildAppointmentLineageRef(updatedAppointment),
        appointmentRecordRef: updatedAppointment.appointmentRecordId,
        semanticPayload: { details: Object.fromEntries(entries), updateScope: manageActionScope },
        result,
        receiptTextRef:
          result === "applied"
            ? "booking_manage_detail_update_applied"
            : result === "safety_preempted"
              ? "booking_manage_detail_update_safety_preempted"
              : "booking_manage_detail_update_recovery",
        reasonCodes,
        recoveryRouteRef,
        releaseRecoveryDispositionRef: bookingCase.bookingCase.releaseRecoveryDispositionRef,
        routeFreezeDispositionRef: bookingCase.bookingCase.routeFreezeDispositionRef,
        presentationArtifactRef:
          updatedAppointment.presentationArtifactRef ??
          `artifact://booking/appointment/${updatedAppointment.appointmentRecordId}`,
        contactRouteRepairJourneyRef,
        recordedAt: occurredAt,
      });
      const latestManage = await appointmentManageService.queryCurrentAppointmentManage(
        appointment.appointmentRecordId,
      );
      const { continuity } = await refreshContinuityFor(
        updatedAppointment,
        bookingCase,
        currentCommit.confirmationTruthProjection,
        capability,
        latestManage,
        {
          continuityEvidenceState: continuityEvidenceState(input.continuityEvidenceState),
          routeIntentBindingRef: input.routeIntentBindingRef,
          routeIntentTupleHash,
          selectedAnchorRef,
          routeFamilyRef,
          surfacePublicationRef: input.surfacePublicationRef,
          runtimePublicationBundleRef: input.runtimePublicationBundleRef,
          experienceContinuityEvidenceRef,
          hasTupleDrift: gate.hasTupleDrift || gate.hasGoverningObjectDrift,
          hasCapabilityDrift: gate.hasCapabilityDrift,
          hasBindingDrift: gate.hasBindingDrift,
          hasContinuityDrift: gate.hasContinuityDrift,
        },
      );
      const finalAppointment = mutateAppointment(
        updatedAppointment,
        {
          latestManageSettlementRef: persisted.settlement.bookingManageSettlementId,
        },
        occurredAt,
      );
      await saveAppointment(finalAppointment, updatedAppointment.version);
      return buildResult(
        finalAppointment,
        bookingCase,
        currentCommit,
        capability,
        latestManage,
        continuity,
        persisted.replayed,
        persisted.emittedEvents,
        null,
        null,
      );
    },

    async queryCurrentAppointmentManage(input) {
      const occurredAt = new Date().toISOString();
      let { appointment, bookingCase, currentCommit, currentAppointment } = await requireManageContext(
        input.appointmentId,
        occurredAt,
      );
      ({ appointment, currentAppointment } = await finalizeSupersededRescheduleSource(
        appointment,
        currentAppointment,
      ));
      const actorMode = input.actorMode ?? "staff";
      const resolvedInput: QueryCurrentAppointmentManageInput = {
        ...input,
        actorMode,
      };
      const capability = await resolveManageCapability(
        "query",
        resolvedInput,
        appointment,
        bookingCase,
      );
      const currentManage =
        await appointmentManageService.queryCurrentAppointmentManage(appointment.appointmentRecordId);
      const routeIntentBindingRef =
        optionalRef(input.routeIntentBindingRef) ??
        capability.resolved.resolution.routeTuple.routeIntentBindingRef;
      const surfaceRouteContractRef =
        optionalRef(input.surfaceRouteContractRef) ??
        capability.resolved.resolution.routeTuple.surfaceRouteContractRef;
      const surfacePublicationRef =
        optionalRef(input.surfacePublicationRef) ??
        capability.resolved.resolution.routeTuple.surfacePublicationRef;
      const runtimePublicationBundleRef =
        optionalRef(input.runtimePublicationBundleRef) ??
        capability.resolved.resolution.routeTuple.runtimePublicationBundleRef;
      const routeIntentTupleHash = buildRouteTupleHash({
        appointmentId: appointment.appointmentRecordId,
        actionScope: "query",
        routeIntentBindingRef,
        surfaceRouteContractRef,
        surfacePublicationRef,
        runtimePublicationBundleRef,
      });
      const routeFamilyRef =
        optionalRef(input.routeFamilyRef) ?? buildDefaultRouteFamilyRef(actorMode);
      const selectedAnchorRef =
        optionalRef(input.selectedAnchorRef) ?? appointment.appointmentRecordId;
      const experienceContinuityEvidenceRef =
        optionalRef(input.experienceContinuityEvidenceRef) ??
        buildDefaultExperienceContinuityEvidenceRef(appointment.appointmentRecordId);
      const { continuity } = await refreshContinuityFor(
        appointment,
        bookingCase,
        currentCommit.confirmationTruthProjection,
        capability,
        currentManage,
        {
          continuityEvidenceState: continuityEvidenceState(input.continuityEvidenceState),
          routeIntentBindingRef,
          routeIntentTupleHash,
          selectedAnchorRef,
          routeFamilyRef,
          surfacePublicationRef,
          runtimePublicationBundleRef,
          experienceContinuityEvidenceRef,
          hasTupleDrift: false,
          hasCapabilityDrift: false,
          hasBindingDrift: false,
          hasContinuityDrift: false,
        },
      );
      return buildResult(
        appointment,
        bookingCase,
        currentCommit,
        capability,
        currentManage,
        continuity,
        false,
        [],
        null,
        null,
        currentAppointment,
      );
    },
  };
}
